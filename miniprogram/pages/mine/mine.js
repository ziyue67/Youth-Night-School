// 我的页面 - 支持多种登录方式
Page({
  data: {
    isLogin: false,
    userInfo: null,
    points: 0,
    tasks: [],
    signRecord: [],
    signedToday: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  // 检查登录状态（支持多种登录方式）
  checkLoginStatus() {
    const wxUserInfo = wx.getStorageSync('userInfo');
    const wxToken = wx.getStorageSync('token');
    const smsUserInfo = wx.getStorageSync('smsUserInfo');
    const phoneUserInfo = wx.getStorageSync('phoneUserInfo');
    const openid = wx.getStorageSync('openid');

    let userInfo = smsUserInfo || phoneUserInfo || wxUserInfo || null;
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

    this.setData({ isLogin, userInfo, signedToday: lastSignDate === today });
    
    if (isLogin) {
      this.loadUserData();
    }
  },

  // 显示登录选项
  showLoginOptions() {
    wx.showActionSheet({
      itemList: ['微信手机号登录', '短信验证码登录', '微信授权登录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 微信手机号登录
            wx.navigateTo({
              url: '/pages/phone-auth-login/index'
            });
            break;
          case 1:
            // 短信验证码登录
            wx.navigateTo({
              url: '/pages/sms-login/index'
            });
            break;
          case 2:
            // 微信授权登录
            this.handleWechatLogin();
            break;
        }
      },
      fail: () => {
        console.log('用户取消选择');
      }
    });
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
        const cloudRes = await wx.cloud.callFunction({
          name: 'wechatLogin',
          data: {
            action: 'login'
          }
        });

        if (cloudRes.result.success) {
          const { openid, userInfo, token } = cloudRes.result;
          
          // 存储用户信息
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('token', token);
          wx.setStorageSync('openid', openid);
          
          this.setData({ 
            isLogin: true, 
            userInfo: userInfo 
          });
          
          this.loadUserData();
          wx.showToast({ title: '登录成功', icon: 'success' });
        } else {
          throw new Error(cloudRes.result.message || '登录失败');
        }
      }
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
      console.error('登录失败:', error);
    }
  },

  // 跳转到微信手机号登录
  gotoPhoneLogin() {
    wx.navigateTo({
      url: '/pages/phone-auth-login/index'
    });
  },

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
          wx.removeStorageSync('smsUserInfo');
          wx.removeStorageSync('phoneUserInfo');
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
    // 原有的数据加载逻辑...
  }
});