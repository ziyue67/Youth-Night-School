// 每日签到云函数
const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getMysql() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 21639;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) throw new Error('数据库未配置');
  const conn = await mysql.createConnection({ host, port, user, password, database, dateStrings: true });
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
        signRecord: logs.map(r => ({ date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10), points: r.points })),
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
    return { success: true, points, backend: 'mysql' };
  } catch (err) {
    console.error('签到失败:', err);
    return { success: false, error: err.message };
  }
};
