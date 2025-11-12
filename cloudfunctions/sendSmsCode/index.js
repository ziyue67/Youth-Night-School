const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { phoneNumber } = event;
  
  if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
    return { success: false, error: '手机号格式不正确' };
  }

  try {
    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 保存验证码到数据库（5分钟有效期）
    const db = cloud.database();
    await db.collection('sms_codes').add({
      data: {
        phoneNumber,
        code,
        createTime: new Date(),
        expireTime: new Date(Date.now() + 5 * 60 * 1000),
        used: false
      }
    });

    // 返回成功（实际项目中需要配置短信服务）
    return {
      success: true,
      message: '验证码已发送',
      code: code // 开发环境返回code便于测试
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};