

const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
    'CREATE TABLE IF NOT EXISTS users (id INT(11) NOT NULL AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, unionid VARCHAR(64) DEFAULT NULL, nick_name VARCHAR(100) DEFAULT NULL, avatar_url VARCHAR(255) DEFAULT NULL, phone VARCHAR(32) DEFAULT NULL, points INT(11) DEFAULT 0, create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uniq_openid (openid), KEY idx_phone (phone)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  );
  
  // 如果phone字段不存在，则添加phone字段
  try {
    await conn.execute(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32) DEFAULT NULL'
    );
  } catch (e) {
    // 字段已存在，忽略错误
  }
  
  // 为phone字段添加索引（如果不存在）
  try {
    await conn.execute(
      'ALTER TABLE USERS ADD INDEX IF NOT EXISTS idx_phone (phone)'
    );
  } catch (e) {
    // 索引已存在，忽略错误
  }
  return conn;
}

// 解密手机号数据
function decryptPhoneNumber(encryptedData, iv, sessionKey) {
  const key = Buffer.from(sessionKey, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const encrypted = Buffer.from(encryptedData, 'base64');
  
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, ivBuffer);
  decipher.setAutoPadding(true);
  
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
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

    const { action, userInfo: clientUserInfo, code } = event;

    switch (action) {
      case 'login':
        // 登录处理 - 创建基础用户信息
        console.log('登录请求参数:', { action, clientUserInfo, code });
        
        // 如果没有获取到openid，可能是云开发环境问题
        if (!wxContext.OPENID) {
          console.error('无法获取用户openid');
          return {
            success: false,
            error: '无法获取用户身份信息'
          };
        }
        
        // 保存 session_key 到 sessions 集合
        try {
          const sessionsCollection = db.collection('sessions');
          await sessionsCollection.where({
            _openid: wxContext.OPENID
          }).update({
            data: {
              session_key: wxContext.SESSION_KEY,
              updateTime: new Date()
            }
          });
          
          // 如果不存在，则创建
          const existingSession = await sessionsCollection.where({
            _openid: wxContext.OPENID
          }).get();
          
          if (existingSession.data.length === 0) {
            await sessionsCollection.add({
              data: {
                _openid: wxContext.OPENID,
                session_key: wxContext.SESSION_KEY,
                createTime: new Date(),
                updateTime: new Date()
              }
            });
          }
        } catch (sessionError) {
          console.error('保存 session_key 失败:', sessionError);
        }
        
        const baseUserInfo = {
          _openid: wxContext.OPENID,
          _appid: wxContext.APPID,
          _unionid: wxContext.UNIONID,
          loginTime: new Date(),
          lastLoginTime: new Date(),
          nickName: clientUserInfo?.nickName || '微信用户',
          avatarUrl: clientUserInfo?.avatarUrl || '',
          phone: clientUserInfo?.phone || null,
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
            updateData.phone = clientUserInfo.phone || existingUser.data[0].phone;
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
              'INSERT INTO users (openid, unionid, nick_name, avatar_url, phone, last_login_time) VALUES (?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE unionid=VALUES(unionid), nick_name=VALUES(nick_name), avatar_url=VALUES(avatar_url), phone=VALUES(phone), last_login_time=NOW()',
              [wxContext.OPENID, wxContext.UNIONID || null, updateData.nickName || null, updateData.avatarUrl || null, updateData.phone || null]
            );
            await conn.end();
          }
          const secret = process.env.JWT_SECRET;
          const token = secret ? jwt.sign({ openid: wxContext.OPENID }, secret, { expiresIn: '7d' }) : wxContext.OPENID;
          const userData = {
            ...updatedUser.data[0],
            openid: wxContext.OPENID,
            phone: updatedUser.data[0].phone || null
          };
          return { success: true, message: '登录成功', token, openid: wxContext.OPENID, data: userData };
        } else {
          // 创建新用户
          result = await userCollection.add({
            data: baseUserInfo
          });
          
          const conn = await getMysql();
          if (conn) {
            await conn.execute(
              'INSERT INTO users (openid, unionid, nick_name, avatar_url, phone, create_time, last_login_time) VALUES (?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE last_login_time=NOW()',
              [wxContext.OPENID, wxContext.UNIONID || null, baseUserInfo.nickName || null, baseUserInfo.avatarUrl || null, baseUserInfo.phone || null]
            );
            await conn.end();
          }
          const secret = process.env.JWT_SECRET;
          const token = secret ? jwt.sign({ openid: wxContext.OPENID }, secret, { expiresIn: '7d' }) : wxContext.OPENID;
          const userData = {
            ...baseUserInfo,
            openid: wxContext.OPENID,
            phone: baseUserInfo.phone || null
          };
          return { success: true, message: '注册并登录成功', token, openid: wxContext.OPENID, data: userData };
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
            'UPDATE users SET nick_name=?, avatar_url=?, phone=?, last_login_time=NOW() WHERE openid=?',
            [userInfo.nickName || null, userInfo.avatarUrl || null, userInfo.phone || null, wxContext.OPENID]
          );
          await conn.end();
        }
        return { success: true, message: '用户信息更新成功', data: updateResult };

      case 'getUserByPhone':
        // 通过手机号查找用户
        const { phone } = event;
        if (!phone) {
          return {
            success: false,
            error: '缺少手机号'
          };
        }

        const conn2 = await getMysql();
        if (conn2) {
          try {
            const [rows] = await conn2.execute(
              'SELECT id, openid, unionid, nick_name, avatar_url, phone, points, create_time, last_login_time FROM users WHERE phone = ?',
              [phone]
            );
            await conn2.end();
            
            if (rows.length > 0) {
              return {
                success: true,
                data: rows[0]
              };
            } else {
              return {
                success: false,
                error: '未找到该手机号对应的用户'
              };
            }
          } catch (error) {
            await conn2.end();
            return {
              success: false,
              error: '查询失败: ' + error.message
            };
          }
        } else {
          return {
            success: false,
            error: '数据库连接失败'
          };
        }

      case 'updateUserPhone':
        // 更新用户手机号
        const { openid, encryptedData, iv } = event;
        if (!openid || !encryptedData || !iv) {
          return {
            success: false,
            error: '缺少必要参数'
          };
        }

        try {
          // 获取用户的 session_key
          const sessionData = await db.collection('sessions').where({
            _openid: openid
          }).get();
          
          if (sessionData.data.length === 0) {
            return {
              success: false,
              error: '用户会话不存在'
            };
          }
          
          const sessionKey = sessionData.data[0].session_key;
          
          // 解密手机号数据
          const phoneData = decryptPhoneNumber(encryptedData, iv, sessionKey);
          
          if (!phoneData.phoneNumber) {
            return {
              success: false,
              error: '手机号解密失败'
            };
          }
          
          const phoneNumber = phoneData.phoneNumber;
          
          const conn3 = await getMysql();
          if (conn3) {
            try {
              await conn3.execute(
                'UPDATE users SET phone = ?, last_login_time = NOW() WHERE openid = ?',
                [phoneNumber, openid]
              );
              await conn3.end();
              
              // 同时更新云数据库
              await db.collection('users').where({
                _openid: openid
              }).update({
                data: {
                  phone: phoneNumber,
                  updateTime: new Date()
                }
              });
              
              return {
                success: true,
                message: '手机号绑定成功',
                phone: phoneNumber
              };
            } catch (error) {
              await conn3.end();
              return {
                success: false,
                error: '手机号更新失败: ' + error.message
              };
            }
          } else {
            return {
              success: false,
              error: '数据库连接失败'
            };
          }
        } catch (error) {
          console.error('手机号解密失败:', error);
          return {
            success: false,
            error: '手机号解密失败: ' + error.message
          };
        }

      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }

  } catch (error) {
    console.error('登录云函数执行错误:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno
    });
    return {
      success: false,
      error: error.message || '登录失败',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
};
  
