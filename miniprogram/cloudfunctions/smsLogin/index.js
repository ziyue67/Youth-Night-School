const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { phoneNumber, code } = event;
  
  if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
    return {
      success: false,
      error: '手机号格式不正确'
    };
  }

  if (!code || code.length !== 6) {
    return {
      success: false,
      error: '验证码格式不正确'
    };
  }

  try {
    // 1. 验证验证码
    const smsCollection = db.collection('sms_codes');
    const now = new Date();
    
    const smsRecord = await smsCollection
      .where({
        phoneNumber,
        code,
        expireTime: _.gt(now)
      })
      .limit(1)
      .get();

    if (smsRecord.data.length === 0) {
      return {
        success: false,
        error: '验证码无效或已过期'
      };
    }

    // 2. 验证通过后删除验证码
    await smsCollection.doc(smsRecord.data[0]._id).remove();

    // 3. 获取或创建用户
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    const userCollection = db.collection('users');
    let userInfo = null;
    
    const userRes = await userCollection.where({ phoneNumber }).limit(1).get();
    
    if (userRes.data.length > 0) {
      // 更新用户openid（如果首次登录）
      userInfo = userRes.data[0];
      if (!userInfo.openid && openid) {
        await userCollection.doc(userInfo._id).update({
          data: {
            openid,
            lastLoginTime: now
          }
        });
        userInfo.openid = openid;
      }
    } else {
      // 创建新用户
      const newUser = {
        phoneNumber,
        openid,
        createTime: now,
        lastLoginTime: now,
        points: 0,
        level: 1
      };
      
      const addRes = await userCollection.add({ data: newUser });
      userInfo = { ...newUser, _id: addRes._id };
    }

    // 4. 生成登录令牌
    const token = cloud.getWXContext().OPENID + Date.now();

    return {
      success: true,
      userInfo,
      token,
      message: '登录成功'
    };

  } catch (error) {
    console.error('短信登录失败:', error);
    return {
      success: false,
      error: error.message || '登录失败'
    };
  }
};