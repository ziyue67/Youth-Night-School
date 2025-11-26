const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 改进的数据库连接函数
async function getMysql() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  
  // 详细的调试信息
  console.log('数据库连接配置检查:');
  console.log('- MYSQL_HOST:', host ? '已设置' : '未设置');
  console.log('- MYSQL_PORT:', port);
  console.log('- MYSQL_USER:', user ? '已设置' : '未设置');
  console.log('- MYSQL_PASSWORD:', password ? '已设置' : '未设置');
  console.log('- MYSQL_DATABASE:', database ? '已设置' : '未设置');
  
  if (!host || !user || !password || !database) {
    const missing = [];
    if (!host) missing.push('MYSQL_HOST');
    if (!user) missing.push('MYSQL_USER');
    if (!password) missing.push('MYSQL_PASSWORD');
    if (!database) missing.push('MYSQL_DATABASE');
    
    throw new Error(`数据库连接信息未配置: ${missing.join(', ')}`);
  }
  
  try {
    const conn = await mysql.createConnection({ 
      host, 
      port, 
      user, 
      password, 
      database,
      // 添加连接超时设置
      connectTimeout: 10000,
      // 添加SSL选项（如果需要）
      // ssl: { ca: process.env.MYSQL_SSL_CA }
    });
    
    console.log('✅ 数据库连接成功');
    
    // 测试连接
    await conn.execute('SELECT 1');
    console.log('✅ 数据库连接测试成功');
    
    return conn;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误编号:', error.errno);
    
    // 提供更详细的错误信息
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔍 权限错误详情:');
      console.log('- 用户名:', user);
      console.log('- 主机:', host);
      console.log('- 可能原因: 用户名或密码错误，或用户没有从该IP访问的权限');
      console.log('- 建议: 检查环境变量配置，或联系数据库管理员重置密码');
    }
    
    throw new Error(`数据库连接失败: ${error.message}`);
  }
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

// 改进的错误处理函数
function handleDatabaseError(error, operation = '数据库操作') {
  console.error(`${operation}失败:`, error.message);
  console.error('错误详情:', {
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage
  });
  
  // 根据错误类型返回用户友好的错误信息
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return {
      success: false,
      error: '数据库访问权限错误，请联系管理员检查数据库配置',
      code: 'DATABASE_ACCESS_DENIED',
      originalError: error.message
    };
  } else if (error.code === 'ER_BAD_DB_ERROR') {
    return {
      success: false,
      error: '数据库不存在，请检查数据库名称',
      code: 'DATABASE_NOT_FOUND',
      originalError: error.message
    };
  } else if (error.code === 'ECONNREFUSED') {
    return {
      success: false,
      error: '无法连接到数据库服务器，请检查网络连接',
      code: 'DATABASE_CONNECTION_REFUSED',
      originalError: error.message
    };
  } else {
    return {
      success: false,
      error: `${operation}失败: ${error.message}`,
      code: 'DATABASE_ERROR',
      originalError: error.message
    };
  }
}

exports.main = async (event, context) => {
  const startTime = Date.now();
  console.log('=== 登录云函数开始执行 ===');
  console.log('请求参数:', JSON.stringify(event, null, 2));
  
  try {
    // 获取微信上下文信息
    const wxContext = cloud.getWXContext();
    console.log('微信上下文:', {
      OPENID: wxContext.OPENID,
      APPID: wxContext.APPID,
      UNIONID: wxContext.UNIONID,
      ENV: wxContext.ENV
    });

    const { action, userInfo: clientUserInfo, code } = event;

    switch (action) {
      case 'login':
        // 登录处理 - 创建基础用户信息
        console.log('开始处理登录请求...');
        
        // 如果没有获取到openid，可能是云开发环境问题
        if (!wxContext.OPENID) {
          console.error('无法获取用户openid');
          return {
            success: false,
            error: '无法获取用户身份信息',
            code: 'NO_OPENID'
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
          
          // 尝试连接MySQL并同步数据
          try {
            const conn = await getMysql();
            if (conn) {
              console.log('开始同步数据到MySQL...');
              await conn.execute(
                'INSERT INTO users (openid, unionid, nick_name, avatar_url, phone, last_login_time) VALUES (?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE unionid=VALUES(unionid), nick_name=VALUES(nick_name), avatar_url=VALUES(avatar_url), phone=VALUES(phone), last_login_time=NOW()',
                [wxContext.OPENID, wxContext.UNIONID || null, updateData.nickName || null, updateData.avatarUrl || null, updateData.phone || null]
              );
              await conn.end();
              console.log('✅ MySQL数据同步成功');
            }
          } catch (mysqlError) {
            console.error('MySQL数据同步失败:', mysqlError);
            return handleDatabaseError(mysqlError, 'MySQL数据同步');
          }
          
          const secret = process.env.JWT_SECRET;
          const token =