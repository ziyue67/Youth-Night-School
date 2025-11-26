const {
  callCloudFunction,
  handleError,
  showSuccess,
  checkUserLoginStatus,
  checkTodaySignStatus,
  storage,
  navigateToPage
} = require('../../utils/common');

// 我的页面 - 支持多种登录方式 - 优化后减少冗余
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

  // 检查登录状态 - 使用通用函数
  checkLoginStatus() {
    const { isLogin, userInfo } = checkUserLoginStatus();
    const signedToday = checkTodaySignStatus();
    const needPhone = isLogin && (!userInfo || !userInfo.phone);
    
    this.setData({ isLogin, userInfo, signedToday, needPhone });
    
    if (isLogin) {
      this.loadUserData();
    }
  },

  // 登录入口：直接进行微信授权登录
  showLoginOptions() {
    this.handleWechatLogin();
  },

  // 微信登录方法 - 使用通用函数
  async handleWechatLogin() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (loginRes.code) {
        const cloudRes = await callCloudFunction('wechatLogin', {
          action: 'login',
          code: loginRes.code,
          userInfo: {
            nickName: '微信用户',
            avatarUrl: '',
            phone: ''
          }
        }, true, '登录中...');

        if (cloudRes.result.success) {
          const { openid, userInfo, token } = cloudRes.result;
          
          // 使用通用存储函数
          storage.set('userInfo', userInfo);
          storage.set('token', token);
          storage.set('openid', openid);
          
          const needPhone = !userInfo || !userInfo.phone;
          
          this.setData({
            isLogin: true,
            userInfo: userInfo,
            needPhone: needPhone
          });
          
          this.loadUserData();
          showSuccess('登录成功');
        } else {
          throw new Error(cloudRes.result.error || cloudRes.result.message || '登录失败');
        }
      }
    } catch (error) {
      handleError(error, '登录失败');
    }
  },

  // 获取手机号回调函数 - 使用通用函数
  async getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      try {
        const cloudRes = await callCloudFunction('wechatLogin', {
          action: 'updateUserPhone',
          openid: storage.get('openid'),
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        }, true, '绑定手机号中...');

        if (cloudRes.result.success) {
          // 更新本地存储的用户信息
          const userInfo = storage.get('userInfo');
          userInfo.phone = cloudRes.result.phone;
          storage.set('userInfo', userInfo);
          
          this.setData({
            userInfo: userInfo,
            needPhone: false
          });
          
          showSuccess('手机号绑定成功');
        } else {
          throw new Error(cloudRes.result.error || '手机号绑定失败');
        }
      } catch (error) {
        handleError(error, '手机号绑定失败');
      }
    } else {
      console.log('用户拒绝授权手机号');
      wx.showModal({
        title: '提示',
        content: '您拒绝了手机号授权，可能会影响部分功能使用。您可以在"我的"页面中重新绑定手机号。',
        showCancel: false,
        confirmText: '我知道了'
      });
    }
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
    navigateToPage('/pages/tasks/tasks');
  },

  // 页面跳转方法 - 使用通用函数
  gotoPoints() {
    navigateToPage('/pages/points/points');
  },

  gotoTasks() {
    navigateToPage('/pages/tasks/tasks');
  },

  gotoSign() {
    navigateToPage('/pages/sign/sign');
  },

  gotoProfile() {
    navigateToPage('/pages/profile/index');
  },

  gotoContact() {
    navigateToPage('/pages/contact/contact');
  },

  gotoAbout() {
    navigateToPage('/pages/about/about');
  },

  // 退出登录 - 使用通用存储函数
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.remove('userInfo');
          storage.remove('token');
          storage.remove('openid');
          
          this.setData({
            isLogin: false,
            userInfo: null,
            points: 0,
            tasks: [],
            signRecord: []
          });
          showSuccess('已退出登录');
        }
      }
    });
  },

  // 加载用户数据 - 使用通用函数
  async loadUserData() {
    try {
      const res = await callCloudFunction('dailySign', {
        action: 'status',
        openid: storage.get('openid')
      }, false);
      
      if (res.result && res.result.success) {
        const today = new Date().toISOString().slice(0, 10);
        const points = res.result.points || 0;
        const signedToday = !!res.result.signedToday;
        const signRecord = (res.result.signRecord || []).map(i => ({ date: i.date, points: i.points }));
        
        const info = storage.get('userInfo') || {};
        info.points = points;
        
        storage.set('userInfo', info);
        storage.set('lastSignDate', signedToday ? today : '');
        storage.set('signRecord', signRecord);

        this.setData({ points, signRecord: signRecord.slice(-6), signedToday });
        return;
      }
    } catch (e) {
      // 静默处理错误
    }
    
    // 降级处理：使用本地存储数据
    const info = storage.get('userInfo') || {};
    const record = storage.get('signRecord') || [];
    const today = new Date().toISOString().slice(0, 10);
    const lastSignDate = storage.get('lastSignDate');
    
    this.setData({
      points: info.points || 0,
      signRecord: record,
      signedToday: lastSignDate === today
    });
  }
});
