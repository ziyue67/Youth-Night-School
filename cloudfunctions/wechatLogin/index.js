

const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function getMysql() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) return null;
  const conn = await mysql.createConnection({ host, port, user, password, database });
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, unionid VARCHAR(64) DEFAULT NULL, nick_name VARCHAR(100) DEFAULT NULL, avatar_url VARCHAR(255) DEFAULT NULL, phone VARCHAR(32) DEFAULT NULL, points INT DEFAULT 0, create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid (openid))'
  );
  return conn;
}

exports.main = async (event, context) => {
  try {
    // 获取微信上下文信息
    const wxContext = cloud.getWXContext();

    console.log('登录请求 - 微信上下文:', {
      OPENID: wxContext.OPENID,
      APPID: wxContext.APPID,
      UNIONID: wxContext.UNIONID,
      ENV: wxContext.ENV
    });

    const { action, userInfo: clientUserInfo } = event;

    switch (action) {
      case 'login':
        // 登录处理 - 创建基础用户信息
        const baseUserInfo = {
          _openid: wxContext.OPENID,
          _appid: wxContext.APPID,
          _unionid: wxContext.UNIONID,
          loginTime: new Date(),
          lastLoginTime: new Date(),
          nickName: clientUserInfo?.nickName || '微信用户',
          avatarUrl: clientUserInfo?.avatarUrl || '',
          createTime: new Date()
        };

        // 查询用户是否已存在
        const userCollection = db.collection('users');
        const existingUser = await userCollection.where({
          _openid: wxContext.OPENID
        }).get();

        let result;
        if (existingUser.data.length > 0) {
          // 更新最后登录时间和用户信息
          const updateData = {
            lastLoginTime: new Date()
          };
          
          // 如果客户端提供了用户信息，则更新
          if (clientUserInfo) {
            updateData.nickName = clientUserInfo.nickName || existingUser.data[0].nickName;
            updateData.avatarUrl = clientUserInfo.avatarUrl || existingUser.data[0].avatarUrl;
          }

          result = await userCollection.where({
            _openid: wxContext.OPENID
          }).update({
            data: updateData
          });
          
          // 获取更新后的用户信息
          const updatedUser = await userCollection.where({
            _openid: wxContext.OPENID
          }).get();
          
          const conn = await getMysql();
          if (conn) {
            await conn.execute(
              'INSERT INTO users (openid, unionid, nick_name, avatar_url, last_login_time) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE unionid=VALUES(unionid), nick_name=VALUES(nick_name), avatar_url=VALUES(avatar_url), last_login_time=NOW()',
              [wxContext.OPENID, wxContext.UNIONID || null, updateData.nickName || null, updateData.avatarUrl || null]
            );
            await conn.end();
          }
          const secret = process.env.JWT_SECRET;
          const token = secret ? jwt.sign({ openid: wxContext.OPENID }, secret, { expiresIn: '7d' }) : wxContext.OPENID;
          return { success: true, message: '登录成功', token, openid: wxContext.OPENID, data: updatedUser.data[0] };
        } else {
          // 创建新用户
          result = await userCollection.add({
            data: baseUserInfo
          });
          
          const conn = await getMysql();
          if (conn) {
            await conn.execute(
              'INSERT INTO users (openid, unionid, nick_name, avatar_url, create_time, last_login_time) VALUES (?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE last_login_time=NOW()',
              [wxContext.OPENID, wxContext.UNIONID || null, baseUserInfo.nickName || null, baseUserInfo.avatarUrl || null]
            );
            await conn.end();
          }
          const secret = process.env.JWT_SECRET;
          const token = secret ? jwt.sign({ openid: wxContext.OPENID }, secret, { expiresIn: '7d' }) : wxContext.OPENID;
          return { success: true, message: '注册并登录成功', token, openid: wxContext.OPENID, data: baseUserInfo };
        }

      case 'getUserInfo':
        // 获取用户信息
        const userResult = await db.collection('users').where({ _openid: wxContext.OPENID }).get();

        if (userResult.data.length > 0) {
          return {
            success: true,
            data: userResult.data[0]
          };
        } else {
          return {
            success: false,
            error: '用户不存在'
          };
        }

      case 'updateUserInfo':
        // 更新用户信息
        const { userInfo } = event;
        if (!userInfo) {
          return {
            success: false,
            error: '缺少用户信息'
          };
        }

        const updateResult = await db.collection('users').where({
          _openid: wxContext.OPENID
        }).update({
          data: {
            ...userInfo,
            updateTime: new Date()
          }
        });

        const conn = await getMysql();
        if (conn) {
          await conn.execute(
            'UPDATE users SET nick_name=?, avatar_url=?, last_login_time=NOW() WHERE openid=?',
            [userInfo.nickName || null, userInfo.avatarUrl || null, wxContext.OPENID]
          );
          await conn.end();
        }
        return { success: true, message: '用户信息更新成功', data: updateResult };

      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }

  } catch (error) {
    console.error('登录云函数执行错误:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
};
  
