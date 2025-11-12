// 微信手机号授权登录页面 - 使用 signInWithPhoneAuth
import app from '../../utils/cloud-init';

Page({
  data: {
    isLoading: false
  },

  // 处理微信手机号授权
  async handlePhoneAuth(e) {
    console.log('微信手机号授权事件:', e);
    if (e.detail && e.detail.errno === 1400001) {
      wx.showToast({ title: '当前额度不足', icon: 'none' })
      return
    }
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const phoneCode = e.detail.code;
      if (!phoneCode) {
        wx.showToast({ title: '获取授权码失败', icon: 'none' });
        return;
      }
      this.setData({ isLoading: true });
      try {
        await wx.login();
        const loginRes = await wx.cloud.callFunction({ name: 'wechatLogin', data: { action: 'login' } });
        const phoneRes = await wx.cloud.callFunction({ name: 'getPhoneNumber', data: { code: phoneCode } });
        const token = loginRes.result && (loginRes.result.token || loginRes.result.openid);
        const phoneNumber = phoneRes.result && (phoneRes.result.phoneNumber || (phoneRes.result.data && phoneRes.result.data.phoneNumber));
        wx.setStorageSync('token', token);
        wx.setStorageSync('phoneNumber', phoneNumber);
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/mine/mine' });
        }, 1500);
      } catch (error) {
        wx.showToast({ title: error.message || '登录失败', icon: 'none' });
      } finally {
        this.setData({ isLoading: false });
      }
    } else {
      wx.showToast({ title: '已取消授权', icon: 'none' });
    }
  },

  // 切换到短信验证码登录
  switchToSms() {
    wx.navigateTo({
      url: '/pages/sms-login/index'
    });
  }
});
