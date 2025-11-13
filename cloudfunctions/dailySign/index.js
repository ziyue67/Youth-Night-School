// 每日签到云函数
const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getMysql() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) return null;
  const conn = await mysql.createConnection({ host, port, user, password, database });
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) UNIQUE, points INT DEFAULT 0, nick_name VARCHAR(64), phone VARCHAR(32), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
  );
  // 签到记录表
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS sign_logs (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, user_id INT, sign_date DATE NOT NULL, points INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid_date (openid, sign_date))'
  );
  return conn;
}

exports.main = async (event, context) => {
  const { action, points = 10 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const today = new Date().toISOString().slice(0, 10);

  if (action === 'status') {
    try {
      const conn = await getMysql();
      if (!conn) {
        const db = cloud.database();
        const usersCol = db.collection('users');
        const ures = await usersCol.where({ _openid: openid }).get();
        const points = ures.data && ures.data[0] ? (ures.data[0].points || 0) : 0;
        const logs = db.collection('sign_logs');
        const list = await logs.where({ _openid: openid }).orderBy('created_at', 'desc').limit(30).get();
        const signed = await logs.where({ _openid: openid, sign_date: today }).limit(1).get();
        return {
          success: true,
          points,
          signedToday: signed.data && signed.data.length > 0,
          signRecord: (list.data || []).map(i => ({ date: i.sign_date, points: i.points })),
          backend: 'cloud_db'
        };
      }
      const [urows] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
      let points = 0;
      if (!urows.length) {
        await conn.execute('INSERT INTO users (openid, points) VALUES (?,?)', [openid, 0]);
        const [u2] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
        points = u2[0].points || 0;
      } else {
        points = urows[0].points || 0;
      }
      const [signedRows] = await conn.execute('SELECT id FROM sign_logs WHERE openid=? AND sign_date=?', [openid, today]);
      const [logs] = await conn.execute('SELECT sign_date AS date, points FROM sign_logs WHERE openid=? ORDER BY created_at DESC LIMIT 30', [openid]);
      await conn.end();
      return {
        success: true,
        points,
        signedToday: signedRows.length > 0,
        signRecord: logs.map(r => ({ date: r.date, points: r.points })),
        backend: 'mysql'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  if (action !== 'sign') {
    return { success: false, error: '未知操作' };
  }

  try {
    const conn = await getMysql();
    if (!conn) {
      const db = cloud.database();
      const logs = db.collection('sign_logs');

      const exist = await logs.where({ _openid: openid, sign_date: today }).limit(1).get();
      if (exist.data && exist.data.length > 0) {
        return { success: false, error: '今日已签到' };
      }

      await logs.add({ data: { _openid: openid, sign_date: today, points, created_at: new Date() } });

      const usersCol = db.collection('users');
      const ures = await usersCol.where({ _openid: openid }).get();
      if (ures.data && ures.data.length > 0) {
        await usersCol.where({ _openid: openid }).update({ data: { points: db.command.inc(points) } });
      } else {
        await usersCol.add({ data: { _openid: openid, points } });
      }

      return { success: true, points, backend: 'cloud_db' };
    }

    const [urows] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
    if (!urows.length) {
      await conn.execute('INSERT INTO users (openid, points) VALUES (?,?)', [openid, 0]);
    }
    const [u2] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
    const userId = u2[0].id;
    const [rows] = await conn.execute('SELECT id FROM sign_logs WHERE openid=? AND sign_date=?', [openid, today]);
    if (rows.length > 0) {
      await conn.end();
      return { success: false, error: '今日已签到' };
    }

    await conn.execute('INSERT INTO sign_logs (openid, user_id, sign_date, points) VALUES (?,?,?,?)', [openid, userId, today, points]);

    // 更新用户积分
    await conn.execute(
      'INSERT INTO users (openid, points) VALUES (?,?) ON DUPLICATE KEY UPDATE points=points+?',
      [openid, points, points]
    );

    await conn.end();

    const db = cloud.database();
    await db.collection('users').where({ _openid: openid }).update({ data: { points: db.command.inc(points) } });

    return { success: true, points, backend: 'mysql' };
  } catch (err) {
    console.error('签到失败:', err);
    return { success: false, error: err.message };
  }
};