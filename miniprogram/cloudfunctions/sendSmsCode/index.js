const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { phoneNumber } = event;
  
  if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
    return {
      success: false,
      error: '手机号格式不正确'
    };
  }

  try {
    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 发送短信验证码（需要配置短信模板）
    // 注意：这里需要你在云开发控制台配置短信模板
    const result = await cloud.openapi.cloudbase.sendSms({
      env: cloud.DYNAMIC_CURRENT_ENV,
      phoneNumberList: [`+86${phoneNumber}`],
      templateId: 'SMS_123456789', // 替换为你的短信模板ID
      templateParamList: [code, '5'] // 5分钟有效期
    });

    if (result.errCode === 0) {
      // 保存验证码到数据库
      await db.collection('sms_codes').add({
        data: {
          phoneNumber,
          code,
          createTime: new Date(),
          expireTime: new Date(Date.now() + 5 * 60 * 1000),
          used: false
        }
      });

      return {
        success: true,
        message: '验证码已发送',
        countdown: 300 // 5分钟倒计时
      };
    } else {
      throw new Error(result.errMsg);
    }
  } catch (error) {
    console.error('发送短信失败:', error);
    return {
      success: false,
      error: error.message || '发送失败'
    };
  }
};