// 小程序云开发配置
App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-9go506hg40673425',
      traceUser: true
    });
    
    console.log('云开发初始化完成');
  },

  globalData: {
    // 云开发数据库引用
    getDB: function() {
      return wx.cloud.database();
    }
  }
});