// 夜校任务页
const app = getApp();

Page({
  data: {
    signedToday: false,
    tasks: [
      { id: 1, name: '完成一节课程', points: 20, completed: false },
      { id: 2, name: '分享课程到朋友圈', points: 15, completed: false },
      { id: 3, name: '邀请好友加入', points: 50, completed: false }
    ],
    signRecord: []
  },

  onLoad() {
    this.checkDailySignStatus();
    this.loadSignRecord();
    this.loadStatus();
  },

  onShow() {
    this.checkDailySignStatus();
    this.loadSignRecord();
    this.loadStatus();
  },

  // 检查今日签到状态
  checkDailySignStatus() {
    const today = new Date().toISOString().slice(0, 10);
    const lastSignDate = wx.getStorageSync('lastSignDate');
    this.setData({ signedToday: lastSignDate === today });
  },

  // 加载签到记录
  async loadSignRecord() {
    try {
      const record = wx.getStorageSync('signRecord') || [];
      this.setData({ signRecord: record.slice(-7) }); // 只显示最近7条
    } catch (error) {
      console.error('加载签到记录失败:', error);
    }
  },

  // 每日签到
  async handleDailySign() {
    if (this.data.signedToday) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '签到中...' });

      // 调用云函数进行签到
      const res = await wx.cloud.callFunction({
        name: 'dailySign',
        data: {
          action: 'sign',
          points: 10
        }
      });

      wx.hideLoading();

      if (res.result.success) {
        // 更新本地状态
        const today = new Date().toISOString().slice(0, 10);
        wx.setStorageSync('lastSignDate', today);

        // 更新用户积分
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.points = (userInfo.points || 0) + 10;
        wx.setStorageSync('userInfo', userInfo);

        // 更新签到记录
        const signRecord = wx.getStorageSync('signRecord') || [];
        signRecord.unshift({
          date: today,
          points: 10,
          time: new Date().toLocaleString()
        });
        wx.setStorageSync('signRecord', signRecord.slice(0, 30)); // 保留最近30条

        // 更新页面数据
        this.setData({
          signedToday: true,
          signRecord: signRecord.slice(-7)
        });

        wx.showToast({
          title: '签到成功 +10积分',
          icon: 'success'
        });

        // 通知积分页面刷新
        const pages = getCurrentPages();
        const pointsPage = pages.find(p => p.route === 'pages/points/points');
        if (pointsPage) { pointsPage.loadPointsData(); }
        this.loadStatus();

      } else {
        if (res.result && res.result.error === '今日已签到') {
          const today = new Date().toISOString().slice(0, 10);
          wx.setStorageSync('lastSignDate', today);
          this.setData({ signedToday: true });
          wx.showToast({ title: '今日已签到', icon: 'none' });
          return;
        }
        if (res.result && res.result.error === '数据库未配置') {
          wx.showModal({
            title: '提示',
            content: '数据库未配置：请在云函数配置的环境变量中设置 MYSQL_HOST、MYSQL_USER、MYSQL_PASSWORD、MYSQL_DATABASE 后再重试。',
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }
        throw new Error(res.result.error || '签到失败');
      }

    } catch (error) {
      wx.hideLoading();
      if (String(error && error.message).includes('今日已签到')) {
        const today = new Date().toISOString().slice(0, 10);
        wx.setStorageSync('lastSignDate', today);
        this.setData({ signedToday: true });
        wx.showToast({ title: '今日已签到', icon: 'none' });
      } else {
        wx.showToast({ title: error.message || '签到失败', icon: 'none' });
        console.error('签到失败:', error);
      }
    }
  },
  async loadStatus() {
    try {
      const res = await wx.cloud.callFunction({ name: 'dailySign', data: { action: 'status' } });
      if (res.result && res.result.success) {
        const today = new Date().toISOString().slice(0, 10);
        const record = (res.result.signRecord || []).map(i => ({ date: i.date, points: i.points }));
        wx.setStorageSync('lastSignDate', res.result.signedToday ? today : '');
        wx.setStorageSync('signRecord', record);
        const info = wx.getStorageSync('userInfo') || {};
        info.points = res.result.points || 0;
        wx.setStorageSync('userInfo', info);
        this.setData({ signedToday: !!res.result.signedToday, signRecord: record.slice(-7) });
      }
    } catch {}
  }
});