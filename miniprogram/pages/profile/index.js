const { callCloudFunction, handleError, showSuccess, storage } = require('../../utils/common');

// 个人资料页面 - 优化后减少冗余
Page({
  data: {
    userInfo: null,
    phoneNumber: null
  },

  onLoad() {
    this.loadUserInfo();
    this.loadPhoneNumber();
  },

  // 加载用户信息 - 使用通用存储函数
  loadUserInfo() {
    const userInfo = storage.get('userInfo');
    this.setData({ userInfo });
  },

  // 加载手机号 - 使用通用存储函数
  loadPhoneNumber() {
    try {
      const phoneNumber = storage.get('phoneNumber');
      if (phoneNumber) {
        this.setData({ phoneNumber });
      }
    } catch (error) {
      console.error('加载手机号失败:', error);
    }
  },

  // 处理获取手机号 - 使用通用函数
  async handleGetPhoneNumber(e) {
    console.log('getPhoneNumber事件:', e);
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const code = e.detail.code;
      console.log('获取到手机号code:', code);
      
      try {
        const result = await callCloudFunction('getPhoneNumber', {
          code: code
        }, true, '获取手机号中...');
        
        if (result.result.success) {
          const phoneNumber = result.result.phoneNumber;
          console.log('获取到的手机号:', phoneNumber);
          
          // 使用通用存储函数保存手机号
          storage.set('phoneNumber', phoneNumber);
          
          // 更新页面显示
          this.setData({ phoneNumber });
          
          showSuccess('手机号绑定成功');
        } else {
          throw new Error(result.result.error || '获取手机号失败');
        }
      } catch (error) {
        handleError(error, '获取手机号失败');
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