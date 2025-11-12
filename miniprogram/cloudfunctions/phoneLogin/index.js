const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();

  console.log('微信手机号登录请求:', { code, openid: wxContext.OPENID });

  if (!code) {
    return {
      success: false,
      error: '缺少授权码'
    };
  }

  try {
    // 调用微信官方接口获取手机号
    const phoneResult = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    });

    if (phoneResult.errCode !== 0) {
      console.error('获取手机号失败:', phoneResult);
      return {
        success: false,
        error: `获取手机号失败: ${phoneResult.errMsg}`
      };
    }

    const { phoneNumber, purePhoneNumber, countryCode } = phoneResult.phoneInfo;
    const openid = wxContext.OPENID;

    const db = cloud.database();
    const userCollection = db.collection('users');
    
    // 查找或创建用户
    let userInfo = null;
    const userRes = await userCollection.where({ openid }).get();
    
    if (userRes.data.length > 0) {
      // 更新用户信息
      await userCollection.where({ openid }).update({
        data: {
          phoneNumber,
          purePhoneNumber,
          countryCode,
          lastLoginTime: new Date()
        }
      });
      userInfo = userRes.data[0];
      userInfo.phoneNumber = phoneNumber;
    } else {
      // 创建新用户
      const newUser = {
        openid,
        phoneNumber,
        purePhoneNumber,
        countryCode,
        createTime: new Date(),
        lastLoginTime: new Date(),
        points: 0,
        level: 1,
        nickName: `用户${phoneNumber.slice(-4)}`
      };
      
      const addRes = await userCollection.add({ data: newUser });
      userInfo = { ...newUser, _id: addRes._id };
    }

    console.log('微信手机号登录成功:', userInfo);

    return {
      success: true,
      userInfo,
      token: openid + Date.now(),
      message: '登录成功'
    };

  } catch (error) {
    console.error('微信手机号登录异常:', error);
    return {
      success: false,
      error: error.message || '登录失败'
    };
  }
};