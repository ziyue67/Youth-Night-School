
    'use strict';

    // 替换前: const cloud = require('wx-server-sdk');
    // 替换后: 使用 @cloudbase/node-sdk
    const cloudbase = require('@cloudbase/node-sdk');

    // 初始化云开发环境
    // 替换前: cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
    // 替换后: 使用 cloudbase.init()
    const app = cloudbase.init({
      env: cloudbase.DYNAMIC_CURRENT_ENV // 使用动态环境ID
    });

    // 获取数据库实例
    const db = app.database();

    // 获取数据模型实例（如果使用数据模型）
    const models = app.models;

    exports.main = async (event, context) => {
      try {
        // 获取微信上下文信息
        // 替换前: const wxContext = cloud.getWXContext();
        // 替换后: 使用 app.getWXContext()
        const wxContext = app.getWXContext();

        console.log('微信上下文信息:', {
          OPENID: wxContext.OPENID,
          APPID: wxContext.APPID,
          UNIONID: wxContext.UNIONID,
          ENV: wxContext.ENV
        });

        const { action, data } = event;

        switch (action) {
          case 'getUserInfo':
            // 获取用户信息示例
            return {
              success: true,
              data: {
                openid: wxContext.OPENID,
                appid: wxContext.APPID,
                unionid: wxContext.UNIONID,
                env: wxContext.ENV
              }
            };

          case 'databaseOperation':
            // 数据库操作示例
            const collection = db.collection('users');
            
            // 查询示例
            const queryResult = await collection.where({
              _openid: wxContext.OPENID
            }).get();

            // 插入示例
            if (queryResult.data.length === 0) {
              await collection.add({
                data: {
                  _openid: wxContext.OPENID,
                  createTime: new Date(),
                  ...data
                }
              });
            }

            return {
              success: true,
              data: queryResult.data
            };

          case 'modelOperation':
            // 数据模型操作示例（如果使用了数据模型）
            if (models && models.user) {
              const userModel = models.user;
              
              // 创建用户记录
              const createResult = await userModel.create({
                data: {
                  openid: wxContext.OPENID,
                  ...data
                }
              });

              // 查询用户记录
              const queryResult = await userModel.list({
                filter: {
                  where: {
                    openid: {
                      $eq: wxContext.OPENID
                    }
                  }
                }
              });

              return {
                success: true,
                data: {
                  createResult: createResult.data,
                  queryResult: queryResult.data
                }
              };
            } else {
              return {
                success: false,
                error: '数据模型未配置'
              };
            }

          case 'sqlOperation':
            // SQL 操作示例
            if (models) {
              // 使用预编译模式执行 SQL（推荐）
              const sqlResult = await models.$runSQL(
                "SELECT * FROM `users` WHERE openid = {{openid}} LIMIT 10",
                { openid: wxContext.OPENID }
              );

              return {
                success: true,
                data: sqlResult.data
              };
            } else {
              return {
                success: false,
                error: 'SQL 操作需要数据模型支持'
              };
            }

          default:
            return {
              success: false,
              error: '未知的操作类型'
            };
        }

      } catch (error) {
        console.error('云函数执行错误:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    };
  