const {
  callCloudFunction,
  handleError,
  showSuccess,
  checkUserLoginStatus,
  checkTodaySignStatus,
  storage,
  navigateToPage
} = require('../../utils/common');

// 我的页面 - 优化版本
Page({
  data: {
    isLogin: false,
    userInfo: null,
    points: 0,
    totalSigns: 0,
    tasks: [],
    signRecord: [],
    signedToday: false,
    needPhone: false,
    loading: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const { isLogin, userInfo } = checkUserLoginStatus();
    const signedToday = checkTodaySignStatus();
    const needPhone = isLogin && (!userInfo || !userInfo.phone);
    
    this.setData({ isLogin, userInfo, signedToday, needPhone });
    
    if (isLogin) {
      this.loadUserData();
    }
  },

  // 修复签到次数的通用方法
  fixTotalSigns(totalSigns, signRecord) {
    if (totalSigns === 0 && signRecord.length > 0) {
      const fixedSigns = signRecord.length;
      console.log(`修复签到次数: 从0修正为${fixedSigns}，基于签到记录长度`);
      return fixedSigns;
    }
    return totalSigns;
  },

  // 检查用户是否已登录的通用方法
  checkLoginAndShowTip() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return false;
    }
    return true;
  },

  // 登录入口
  showLoginOptions() {
    this.handleWechatLogin();
  },

  // 微信登录方法
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
          
          // 保存用户信息
          storage.set('userInfo', userInfo);
          storage.set('token', token);
          storage.set('openid', openid);
          
          const needPhone = !userInfo || !userInfo.phone;
          
          this.setData({
            isLogin: true,
            userInfo: userInfo,
            needPhone: needPhone
          });
          
          // 登录成功后立即加载用户数据
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

  // 获取手机号回调函数
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
  handleDailySign() {
    if (!this.checkLoginAndShowTip()) return;
    if (this.data.signedToday) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }
    navigateToPage('/pages/tasks/tasks');
  },

  // 页面跳转方法 - 统一处理
  gotoPoints() {
    if (!this.checkLoginAndShowTip()) return;
    navigateToPage('/pages/points/points');
  },

  gotoTasks() {
    navigateToPage('/pages/tasks/tasks');
  },

  gotoSign() {
    navigateToPage('/pages/sign/sign');
  },

  gotoProfile() {
    if (!this.checkLoginAndShowTip()) return;
    navigateToPage('/pages/profile/index');
  },

  gotoContact() {
    navigateToPage('/pages/contact/contact');
  },

  gotoAbout() {
    navigateToPage('/pages/about/about');
  },

  // 退出登录
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
            totalSigns: 0,
            tasks: [],
            signRecord: [],
            signedToday: false
          });
          showSuccess('已退出登录');
        }
      }
    });
  },

  // 加载用户数据 - 优化版本
  async loadUserData() {
    if (this.data.loading) {
      console.log('数据正在加载中，避免重复请求');
      return;
    }

    this.setData({ loading: true });
    
    try {
      console.log('开始加载用户数据...');
      
      const res = await callCloudFunction('dailySign', {
        action: 'status',
        openid: storage.get('openid')
      }, true, '加载用户数据中...');
      
      console.log('云函数返回结果:', res);
      
      if (res.result && res.result.success) {
        const today = new Date().toISOString().slice(0, 10);
        const points = res.result.points || 0;
        const signRecord = (res.result.signRecord || []).map(i => ({ date: i.date, points: i.points }));
        let totalSigns = this.fixTotalSigns(res.result.totalSigns || 0, signRecord);
        const signedToday = !!res.result.signedToday;
        
        console.log('解析数据:', { points, totalSigns, signedToday, signRecordLength: signRecord.length });
        
        // 更新本地存储和页面数据
        this.updateUserDataAndStorage(points, totalSigns, signRecord, signedToday, today);
        
        return;
      } else {
        console.error('云函数返回失败:', res.result);
        throw new Error(res.result?.error || '数据加载失败');
      }
    } catch (e) {
      console.error('加载用户数据失败:', e);
      this.loadLocalData();
    } finally {
      this.setData({ loading: false });
    }
  },

  // 更新用户数据和本地存储的通用方法
  updateUserDataAndStorage(points, totalSigns, signRecord, signedToday, today) {
    // 更新本地存储
    const info = storage.get('userInfo') || {};
    info.points = points;
    info.totalSigns = totalSigns;
    
    storage.set('userInfo', info);
    storage.set('lastSignDate', signedToday ? today : '');
    storage.set('signRecord', signRecord);

    // 更新页面数据
    this.setData({
      points,
      totalSigns,
      signRecord: signRecord.slice(-6),
      signedToday
    });
    
    console.log('页面数据更新完成:', { points, totalSigns, signedToday });
    
    if (totalSigns > 0) {
      console.log(`✅ 成功加载签到次数: ${totalSigns}`);
    }
  },

  // 加载本地存储数据（降级处理）
  loadLocalData() {
    console.log('使用本地存储数据作为降级处理');
    
    const info = storage.get('userInfo') || {};
    const record = storage.get('signRecord') || [];
    const today = new Date().toISOString().slice(0, 10);
    const lastSignDate = storage.get('lastSignDate');
    
    let totalSigns = this.fixTotalSigns(info.totalSigns || record.length, record);
    
    this.setData({
      points: info.points || 0,
      totalSigns,
      signRecord: record,
      signedToday: lastSignDate === today,
      loading: false
    });
    
    console.log('本地存储数据加载完成:', {
      points: info.points || 0,
      totalSigns,
      signedToday: lastSignDate === today
    });
  },

  // 手动刷新数据
  async refreshData() {
    if (!this.checkLoginAndShowTip()) return;
    
    console.log('手动刷新数据');
    await this.loadUserData();
    wx.showToast({ title: '数据已刷新', icon: 'success' });
  }
});
