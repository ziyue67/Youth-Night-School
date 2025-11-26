const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  try {
    // 调用fetchExternalWechatArticles云函数来同步数据
    const syncResult = await cloud.callFunction({
      name: 'fetchExternalWechatArticles'
    });
    
    if (syncResult.result && syncResult.result.success) {
      return {
        success: true,
        message: '同步成功',
        data: syncResult.result.data
      };
    } else {
      return {
        success: false,
        error: syncResult.result?.error || '同步失败'
      };
    }
  } catch (err) {
    console.error('同步文章失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};