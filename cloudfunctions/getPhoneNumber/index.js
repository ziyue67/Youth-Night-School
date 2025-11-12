const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();

  if (!code) {
    return { success: false, error: '缺少code参数' };
  }

  try {
    const result = await cloud.openapi.phonenumber.getPhoneNumber({ code });
    
    if (result.errCode === 0) {
      const { phoneNumber } = result.phoneInfo;
      
      // 保存到数据库
      const db = cloud.database();
      await db.collection('users').where({ openid: wxContext.OPENID }).update({
        data: { phoneNumber, updateTime: new Date() }
      });

      const conn = await getMysql();
      if (conn) {
        await conn.execute(
          'INSERT INTO users (openid, phone, last_login_time) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE phone=VALUES(phone), last_login_time=NOW()',
          [wxContext.OPENID, phoneNumber]
        );
        await conn.end();
      }

      return { success: true, phoneNumber };
    } else {
      return { success: false, error: result.errMsg };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
async function getMysql() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) return null;
  const conn = await mysql.createConnection({ host, port, user, password, database });
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, unionid VARCHAR(64) DEFAULT NULL, nick_name VARCHAR(100) DEFAULT NULL, avatar_url VARCHAR(255) DEFAULT NULL, phone VARCHAR(32) DEFAULT NULL, create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid (openid))'
  );
  return conn;
}
