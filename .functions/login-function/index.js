
'use strict';

// 使用 @cloudbase/node-sdk 替代 wx-server-sdk
const cloudbase = require('@cloudbase/node-sdk');

// 初始化云开发环境
const app = cloudbase.init({
  env: cloudbase.DYNAMIC_CURRENT_ENV
});

// 获取数据库实例
const db = app.database();

exports.main = async (event, context) => {
  try {
    // 获取微信上下文信息
    const wxContext = app.getWXContext();

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
          
          return {
            success: true,
            message: '登录成功',
            data: {
              openid: wxContext.OPENID,
              appid: wxContext.APPID,
              unionid: wxContext.UNIONID,
              isNewUser: false,
              userInfo: updatedUser.data[0]
            }
          };
        } else {
          // 创建新用户
          result = await userCollection.add({
            data: baseUserInfo
          });
          
          return {
            success: true,
            message: '注册并登录成功',
            data: {
              openid: wxContext.OPENID,
              appid: wxContext.APPID,
              unionid: wxContext.UNIONID,
              isNewUser: true,
              userInfo: baseUserInfo
            }
          };
        }

      case 'getUserInfo':
        // 获取用户信息
        const userResult = await db.collection('users').where({
          _openid: wxContext.OPENID
        }).get();

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

        return {
          success: true,
          message: '用户信息更新成功',
          data: updateResult
        };

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
  