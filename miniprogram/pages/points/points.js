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
      const res = await wx.cloud.callFunction({ name: 'dailySign', data: { action: 'status' } });
      if (res.result && res.result.success) {
        const points = res.result.points || 0;
        const info = wx.getStorageSync('userInfo') || {};
        info.points = points;
        wx.setStorageSync('userInfo', info);
        const history = (res.result.signRecord || []).map(i => ({ date: i.date, points: i.points }));
        this.setData({ points, pointsHistory: history });
        return;
      }
      const userInfo = wx.getStorageSync('userInfo') || {};
      const points = userInfo.points || 0;
      this.setData({ points, pointsHistory: [] });

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
