// 我的页面 - 支持多种登录方式
Page({
  data: {
    isLogin: false,
    userInfo: null,
    points: 0,
    tasks: [],
    signRecord: [],
    signedToday: false,
    needPhone: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  // 检查登录状态（仅保留微信认证）
  checkLoginStatus() {
    const wxUserInfo = wx.getStorageSync('userInfo');
    const wxToken = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');

    let userInfo = wxUserInfo || null;
    let isLogin = !!(userInfo || openid || wxToken);

    if (!userInfo && (openid || wxToken)) {
      userInfo = {
        openid: openid || wxToken,
        nickName: '微信用户',
        avatarUrl: '',
        points: (wxUserInfo && wxUserInfo.points) || 0,
      };
      try {
        wx.setStorageSync('userInfo', userInfo);
      } catch (e) {}
    }

    // 检查今日签到状态
    const today = new Date().toISOString().slice(0, 10);
    const lastSignDate = wx.getStorageSync('lastSignDate');

    // 检查是否需要绑定手机号
    const needPhone = isLogin && (!userInfo || !userInfo.phone);
    
    this.setData({ isLogin, userInfo, signedToday: lastSignDate === today, needPhone });
    
    if (isLogin) {
      this.loadUserData();
    }
  },

  // 登录入口：直接进行微信授权登录
  showLoginOptions() {
    this.handleWechatLogin();
  },

  // 原有的微信登录方法
  async handleWechatLogin() {
    try {
      wx.showLoading({ title: '登录中...' });
      
      // 获取微信登录凭证
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (loginRes.code) {
        // 先进行基本的微信登录，获取用户信息
        const cloudRes = await wx.cloud.callFunction({
          name: 'wechatLogin',
          data: {
            action: 'login',
            code: loginRes.code,
            userInfo: {
              nickName: '微信用户',
              avatarUrl: '',
              phone: ''
            }
          }
        });

        if (cloudRes.result.success) {
          const { openid, userInfo, token } = cloudRes.result;
          
          // 存储用户信息
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('token', token);
          wx.setStorageSync('openid', openid);
          
          // 检查是否需要绑定手机号
          const needPhone = !userInfo || !userInfo.phone;
          
          this.setData({ 
            isLogin: true, 
            userInfo: userInfo,
            needPhone: needPhone
          });
          
          this.loadUserData();
          wx.showToast({ title: '登录成功', icon: 'success' });
        } else {
          console.error('云函数返回错误:', cloudRes.result);
          throw new Error(cloudRes.result.error || cloudRes.result.message || '登录失败');
        }
      }
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      const errorMessage = error.message || '登录失败';
      console.error('登录失败:', error);
      wx.showToast({ title: errorMessage, icon: 'none', duration: 3000 });
    }
  },

  // 获取手机号回调函数
  async getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      try {
        wx.showLoading({ title: '绑定手机号...' });
        
        // 调用云函数解密手机号
        const cloudRes = await wx.cloud.callFunction({
          name: 'wechatLogin',
          data: {
            action: 'updateUserPhone',
            openid: wx.getStorageSync('openid'),
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv
          }
        });

        if (cloudRes.result.success) {
          // 更新本地存储的用户信息
          const userInfo = wx.getStorageSync('userInfo');
          userInfo.phone = cloudRes.result.phone;
          wx.setStorageSync('userInfo', userInfo);
          
          this.setData({ 
            userInfo: userInfo,
            needPhone: false
          });
          
          wx.showToast({ title: '手机号绑定成功', icon: 'success' });
        } else {
          throw new Error(cloudRes.result.error || '手机号绑定失败');
        }
      } catch (error) {
        console.error('手机号绑定失败:', error);
        wx.showToast({ title: '手机号绑定失败', icon: 'none', duration: 3000 });
      } finally {
        wx.hideLoading();
      }
    } else {
      console.log('用户拒绝授权手机号');
      // 用户拒绝授权，显示提示
      wx.showModal({
        title: '提示',
        content: '您拒绝了手机号授权，可能会影响部分功能使用。您可以在"我的"页面中重新绑定手机号。',
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  },

  // 移除其他登录方式，不再提供跳转

  // 每日签到（主页入口）
  async handleDailySign() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (this.data.signedToday) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }
    // 直接调用与夜校任务页同一套逻辑
    wx.navigateTo({ url: '/pages/tasks/tasks' });
  },

  gotoPoints() {
    wx.navigateTo({ url: '/pages/points/points' });
  },

  gotoTasks() {
    wx.navigateTo({ url: '/pages/tasks/tasks' });
  },

  gotoSign() {
    wx.navigateTo({ url: '/pages/sign/sign' });
  },

  gotoProfile() {
    wx.navigateTo({ url: '/pages/profile/index' });
  },

  gotoContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  },

  gotoAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          wx.removeStorageSync('openid');
          
          this.setData({
            isLogin: false,
            userInfo: null,
            points: 0,
            tasks: [],
            signRecord: []
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  // 加载用户数据
  async loadUserData() {
    try {
      const res = await wx.cloud.callFunction({ name: 'dailySign', data: { action: 'status', openid: wx.getStorageSync('openid') } });
      if (res.result && res.result.success) {
        const today = new Date().toISOString().slice(0, 10);
        const points = res.result.points || 0;
        const signedToday = !!res.result.signedToday;
        const signRecord = (res.result.signRecord || []).map(i => ({ date: i.date, points: i.points }));
        const info = wx.getStorageSync('userInfo') || {};
        info.points = points;
        wx.setStorageSync('userInfo', info);
        wx.setStorageSync('lastSignDate', signedToday ? today : '');
        wx.setStorageSync('signRecord', signRecord);
        this.setData({ points, signRecord, signedToday });
        return;
      }
    } catch (e) {}
    const info = wx.getStorageSync('userInfo') || {};
    const record = wx.getStorageSync('signRecord') || [];
    const today = new Date().toISOString().slice(0, 10);
    const lastSignDate = wx.getStorageSync('lastSignDate');
    this.setData({ points: info.points || 0, signRecord: record, signedToday: lastSignDate === today });
  }
});
