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
  // 签到记录表
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS sign_logs (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, sign_date DATE NOT NULL, points INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid_date (openid, sign_date))'
  );
  return conn;
}

exports.main = async (event, context) => {
  const { action, points = 10 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const today = new Date().toISOString().slice(0, 10);

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

    // 检查今日是否已签到
    const [rows] = await conn.execute('SELECT id FROM sign_logs WHERE openid=? AND sign_date=?', [openid, today]);
    if (rows.length > 0) {
      await conn.end();
      return { success: false, error: '今日已签到' };
    }

    // 写入签到记录
    await conn.execute('INSERT INTO sign_logs (openid, sign_date, points) VALUES (?,?,?)', [openid, today, points]);

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