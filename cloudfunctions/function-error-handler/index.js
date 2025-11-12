const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const { code } = event;
    
    if (!code) {
      throw new Error('缺少必要的参数');
    }

    // 这里可以添加你的登录逻辑
    return {
      success: true,
      message: '处理成功',
      data: {
        openid: cloud.getWXContext().OPENID,
        code: code
      }
    };
  } catch (error) {
    console.error('函数执行错误:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
};