const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 数据库连接配置
const DB_CONFIG = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
};

// 统一的数据库连接函数
async function getMysql() {
  if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password || !DB_CONFIG.database) {
    return null;
  }
  
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    
    // 初始化数据库表结构
    await initDatabaseTables(conn);
    
    return conn;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return null;
  }
}

// 初始化数据库表
async function initDatabaseTables(conn) {
  try {
    await conn.execute(
      `CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        openid VARCHAR(64) NOT NULL,
        unionid VARCHAR(64) DEFAULT NULL,
        nick_name VARCHAR(100) DEFAULT NULL,
        avatar_url VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(32) DEFAULT NULL,
        points INT(11) DEFAULT 0,
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_openid (openid),
        KEY idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
  } catch (error) {
    console.error('初始化数据库表失败:', error);
  }
}

// 统一的响应格式
function createResponse(success, data = null, error = null, message = null) {
  const response = { success };
  if (data !== null) response.data = data;
  if (error !== null) response.error = error;
  if (message !== null) response.message = message;
  return response;
}

// 解密手机号数据
function decryptPhoneNumber(encryptedData, iv, sessionKey) {
  try {
    const key = Buffer.from(sessionKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const encrypted = Buffer.from(encryptedData, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, ivBuffer);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('手机号解密失败:', error);
    throw new Error('手机号解密失败');
  }
}

// 生成JWT令牌
function generateToken(openid) {
  const secret = process.env.JWT_SECRET;
  return secret ? jwt.sign({ openid }, secret, { expiresIn: '7d' }) : openid;
}

// 保存或更新用户到MySQL
async function saveOrUpdateUserToMysql(conn, userData, isNewUser = false) {
  if (!conn) return;
  
  try {
    if (isNewUser) {
      await conn.execute(
        `INSERT INTO users (openid, unionid, nick_name, avatar_url, phone, create_time, last_login_time) 
         VALUES (?,?,?,?,?,NOW(),NOW()) 
         ON DUPLICATE KEY UPDATE last_login_time=NOW()`,
        [userData.openid, userData.unionid || null, userData.nickName || null, 
         userData.avatarUrl || null, userData.phone || null]
      );
    } else {
      await conn.execute(
        `INSERT INTO users (openid, unionid, nick_name, avatar_url, phone, last_login_time) 
         VALUES (?,?,?,?,?,NOW()) 
         ON DUPLICATE KEY UPDATE 
         unionid=VALUES(unionid), 
         nick_name=VALUES(nick_name), 
         avatar_url=VALUES(avatar_url), 
         phone=VALUES(phone), 
         last_login_time=NOW()`,
        [userData.openid, userData.unionid || null, userData.nickName || null, 
         userData.avatarUrl || null, userData.phone || null]
      );
    }
  } catch (error) {
    console.error('保存用户到MySQL失败:', error);
  }
}

// 处理用户登录
async function handleLogin(wxContext, clientUserInfo) {
  if (!wxContext.OPENID) {
    return createResponse(false, null, '无法获取用户身份信息');
  }

  // 保存session_key
  await saveSessionKey(wxContext.OPENID, wxContext.SESSION_KEY);

  // 构建用户信息
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

  try {
    // 检查用户是否存在
    const userCollection = db.collection('users');
    const existingUser = await userCollection.where({ _openid: wxContext.OPENID }).get();

    let userData, isNewUser = false;
    
    if (existingUser.data.length > 0) {
      // 更新现有用户
      const updateData = { lastLoginTime: new Date() };
      if (clientUserInfo) {
        updateData.nickName = clientUserInfo.nickName || existingUser.data[0].nickName;
        updateData.avatarUrl = clientUserInfo.avatarUrl || existingUser.data[0].avatarUrl;
        updateData.phone = clientUserInfo.phone || existingUser.data[0].phone;
      }

      await userCollection.where({ _openid: wxContext.OPENID }).update({ data: updateData });
      
      const updatedUser = await userCollection.where({ _openid: wxContext.OPENID }).get();
      userData = { ...updatedUser.data[0], openid: wxContext.OPENID };
      
      // 保存到MySQL
      await saveOrUpdateUserToMysql(await getMysql(), {
        openid: wxContext.OPENID,
        unionid: wxContext.UNIONID,
        nickName: updateData.nickName,
        avatarUrl: updateData.avatarUrl,
        phone: updateData.phone
      });
      
      return createResponse(true, userData, null, '登录成功');
    } else {
      // 创建新用户
      await userCollection.add({ data: baseUserInfo });
      userData = { ...baseUserInfo, openid: wxContext.OPENID };
      isNewUser = true;
      
      // 保存到MySQL
      await saveOrUpdateUserToMysql(await getMysql(), baseUserInfo, true);
      
      return createResponse(true, userData, null, '注册并登录成功');
    }
  } catch (error) {
    console.error('登录处理失败:', error);
    return createResponse(false, null, '登录失败: ' + error.message);
  }
}

// 保存session_key
async function saveSessionKey(openid, sessionKey) {
  try {
    const sessionsCollection = db.collection('sessions');
    const existingSession = await sessionsCollection.where({ _openid: openid }).get();
    
    const sessionData = {
      session_key: sessionKey,
      updateTime: new Date()
    };
    
    if (existingSession.data.length > 0) {
      await sessionsCollection.where({ _openid: openid }).update({ data: sessionData });
    } else {
      await sessionsCollection.add({
        data: {
          _openid: openid,
          session_key: sessionKey,
          createTime: new Date(),
          updateTime: new Date()
        }
      });
    }
  } catch (error) {
    console.error('保存session_key失败:', error);
  }
}

// 处理更新用户手机号
async function handleUpdateUserPhone(openid, encryptedData, iv) {
  if (!openid || !encryptedData || !iv) {
    return createResponse(false, null, '缺少必要参数');
  }

  try {
    // 获取session_key
    const sessionData = await db.collection('sessions').where({ _openid: openid }).get();
    if (sessionData.data.length === 0) {
      return createResponse(false, null, '用户会话不存在');
    }

    // 解密手机号
    const phoneData = decryptPhoneNumber(encryptedData, iv, sessionData.data[0].session_key);
    if (!phoneData.phoneNumber) {
      return createResponse(false, null, '手机号解密失败');
    }

    const phoneNumber = phoneData.phoneNumber;
    const conn = await getMysql();
    
    if (conn) {
      try {
        // 更新MySQL中的手机号
        await conn.execute(
          'UPDATE users SET phone = ?, last_login_time = NOW() WHERE openid = ?',
          [phoneNumber, openid]
        );
        
        // 更新云数据库中的手机号
        await db.collection('users').where({ _openid: openid }).update({
          data: { phone: phoneNumber, updateTime: new Date() }
        });
        
        return createResponse(true, { phone: phoneNumber }, null, '手机号绑定成功');
      } catch (error) {
        return createResponse(false, null, '手机号更新失败: ' + error.message);
      } finally {
        await conn.end();
      }
    } else {
      return createResponse(false, null, '数据库连接失败');
    }
  } catch (error) {
    return createResponse(false, null, '手机号解密失败: ' + error.message);
  }
}

// 主函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const { action, userInfo: clientUserInfo, code, phone, openid, encryptedData, iv } = event;

    // 添加token到成功响应
    const addTokenToResponse = (response) => {
      if (response.success && response.data && response.data.openid) {
        response.token = generateToken(response.data.openid);
      }
      return response;
    };

    switch (action) {
      case 'login':
        const loginResponse = await handleLogin(wxContext, clientUserInfo);
        return addTokenToResponse(loginResponse);

      case 'getUserInfo':
        try {
          const userResult = await db.collection('users').where({ _openid: wxContext.OPENID }).get();
          return userResult.data.length > 0 
            ? createResponse(true, userResult.data[0])
            : createResponse(false, null, '用户不存在');
        } catch (error) {
          return createResponse(false, null, '获取用户信息失败: ' + error.message);
        }

      case 'updateUserInfo':
        if (!userInfo) {
          return createResponse(false, null, '缺少用户信息');
        }
        
        try {
          const updateResult = await db.collection('users').where({
            _openid: wxContext.OPENID
          }).update({
            data: { ...userInfo, updateTime: new Date() }
          });

          const conn = await getMysql();
          if (conn) {
            try {
              await conn.execute(
                'UPDATE users SET nick_name=?, avatar_url=?, phone=?, last_login_time=NOW() WHERE openid=?',
                [userInfo.nickName || null, userInfo.avatarUrl || null, userInfo.phone || null, wxContext.OPENID]
              );
            } catch (error) {
              console.error('MySQL更新失败:', error);
            } finally {
              await conn.end();
            }
          }
          
          return createResponse(true, updateResult, null, '用户信息更新成功');
        } catch (error) {
          return createResponse(false, null, '用户信息更新失败: ' + error.message);
        }

      case 'getUserByPhone':
        if (!phone) {
          return createResponse(false, null, '缺少手机号');
        }

        const conn = await getMysql();
        if (conn) {
          try {
            const [rows] = await conn.execute(
              'SELECT id, openid, unionid, nick_name, avatar_url, phone, points, create_time, last_login_time FROM users WHERE phone = ?',
              [phone]
            );
            
            return rows.length > 0 
              ? createResponse(true, rows[0])
              : createResponse(false, null, '未找到该手机号对应的用户');
          } catch (error) {
            return createResponse(false, null, '查询失败: ' + error.message);
          } finally {
            await conn.end();
          }
        } else {
          return createResponse(false, null, '数据库连接失败');
        }

      case 'updateUserPhone':
        return await handleUpdateUserPhone(openid, encryptedData, iv);

      default:
        return createResponse(false, null, '未知的操作类型');
    }
  } catch (error) {
    console.error('登录云函数执行错误:', error);
    return createResponse(false, null, error.message || '登录失败');
  }
};
