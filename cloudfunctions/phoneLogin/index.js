const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();

  if (!code) {
    return { success: false, error: '缺少授权码' };
  }

  try {
    const result = await cloud.openapi.phonenumber.getPhoneNumber({ code });
    
    if (result.errCode === 0) {
      const { phoneNumber } = result.phoneInfo;
      const db = cloud.database();
      const openid = wxContext.OPENID;
      
      // 更新或创建用户
      const userRes = await db.collection('users').where({ openid }).get();
      
      if (userRes.data.length > 0) {
        await db.collection('users').where({ openid }).update({
          data: { phoneNumber, lastLoginTime: new Date() }
        });
      } else {
        await db.collection('users').add({
          data: {
            openid,
            phoneNumber,
            createTime: new Date(),
            lastLoginTime: new Date()
          }
        });
      }

      return { success: true, phoneNumber };
    } else {
      return { success: false, error: result.errMsg };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};