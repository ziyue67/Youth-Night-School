// 积分详情页
Page({
  data: {
    points: 0,
    pointsHistory: []
  },

  onLoad() {
    this.loadPointsData();
  },

  onShow() {
    this.loadPointsData();
  },

  // 加载积分数据
  async loadPointsData() {
    try {
      // 从本地存储获取当前积分
      const userInfo = wx.getStorageSync('userInfo') || {};
      const points = userInfo.points || 0;

      this.setData({
        points: points,
        pointsHistory: []
      });

    } catch (error) {
      console.error('加载积分数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPointsData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
