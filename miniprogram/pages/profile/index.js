// 个人资料页面
Page({
  data: {
    userInfo: null,
    phoneNumber: null
  },

  onLoad() {
    this.loadUserInfo();
    this.loadPhoneNumber();
  },

  async loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo });
  },

  async loadPhoneNumber() {
    try {
      const phoneNumber = wx.getStorageSync('phoneNumber');
      if (phoneNumber) {
        this.setData({ phoneNumber });
      }
    } catch (error) {
      console.error('加载手机号失败:', error);
    }
  },

  async handleGetPhoneNumber(e) {
    console.log('getPhoneNumber事件:', e);
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const code = e.detail.code;
      console.log('获取到手机号code:', code);
      
      try {
        // 调用云函数获取手机号
        wx.showLoading({
          title: '获取手机号中...',
        });
        
        const result = await wx.cloud.callFunction({
          name: 'getPhoneNumber',
          data: {
            code: code
          }
        });
        
        wx.hideLoading();
        
        if (result.result.success) {
          const phoneNumber = result.result.phoneNumber;
          console.log('获取到的手机号:', phoneNumber);
          
          // 保存手机号到本地缓存
          wx.setStorageSync('phoneNumber', phoneNumber);
          
          // 更新页面显示
          this.setData({ phoneNumber });
          
          wx.showToast({
            title: '手机号绑定成功',
            icon: 'success'
          });
        } else {
          throw new Error(result.result.error || '获取手机号失败');
        }
      } catch (error) {
        wx.hideLoading();
        console.error('获取手机号失败:', error);
        wx.showToast({
          title: error.message || '获取手机号失败',
          icon: 'none'
        });
      }
    } else {
      console.log('用户拒绝授权获取手机号');
      wx.showToast({
        title: '已取消手机号授权',
        icon: 'none'
      });
    }
  }
});