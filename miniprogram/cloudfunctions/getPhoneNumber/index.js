const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();

  console.log('获取手机号请求:', { code, openid: wxContext.OPENID });

  if (!code) {
    return {
      success: false,
      error: '缺少code参数'
    };
  }

  try {
    // 调用微信接口获取手机号
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    });

    console.log('微信接口返回:', result);

    if (result.errCode === 0) {
      const phoneInfo = result.phoneInfo;
      const phoneNumber = phoneInfo.phoneNumber;

      // 保存手机号到数据库
      try {
        const userCollection = db.collection('users');
        
        // 检查用户是否已存在
        const userResult = await userCollection.where({
          openid: wxContext.OPENID
        }).get();

        if (userResult.data.length > 0) {
          // 更新现有用户
          await userCollection.where({
            openid: wxContext.OPENID
          }).update({
            data: {
              phoneNumber: phoneNumber,
              updateTime: new Date()
            }
          });
        } else {
          // 创建新用户
          await userCollection.add({
            data: {
              openid: wxContext.OPENID,
              phoneNumber: phoneNumber,
              createTime: new Date(),
              updateTime: new Date()
            }
          });
        }

        console.log('手机号保存成功:', phoneNumber);
        
        return {
          success: true,
          phoneNumber: phoneNumber
        };
      } catch (dbError) {
        console.error('数据库操作失败:', dbError);
        return {
          success: true,
          phoneNumber: phoneNumber,
          warning: '手机号已获取，但数据库保存失败'
        };
      }
    } else {
      return {
        success: false,
        error: result.errMsg || '获取手机号失败'
      };
    }
  } catch (error) {
    console.error('获取手机号异常:', error);
    return {
      success: false,
      error: error.message || '获取手机号异常'
    };
  }
};