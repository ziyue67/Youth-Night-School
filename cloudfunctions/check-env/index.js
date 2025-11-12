const cloud = require('wx-server-sdk');
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const db = cloud.database();
    const result = await db.collection('users').limit(1).get();
    
    return {
      success: true,
      message: '云环境正常',
      env: cloud.DYNAMIC_CURRENT_ENV,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '云环境异常，请检查配置'
    };
  }
};