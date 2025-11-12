const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    // 检查云开发环境
    const db = cloud.database();
    
    // 尝试查询一个集合
    const result = await db.collection('users').limit(1).get();
    
    return {
      success: true,
      message: '云开发环境正常',
      env: cloud.DYNAMIC_CURRENT_ENV,
      collectionCount: result.data.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '云开发环境异常，请检查配置'
    };
  }
};