// 短信验证码登录页面 - 使用 @cloudbase/adapter-wx_mp
import app from '../../utils/cloud-init';

Page({
  data: {
    phoneNumber: '',
    verificationCode: '',
    countdown: 0,
    agreed: false,
    isLoading: false,
    canSendCode: true
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({ phoneNumber: e.detail.value });
  },

  // 验证码输入
  onCodeInput(e) {
    this.setData({ verificationCode: e.detail.value });
  },

  // 发送验证码
  async sendVerificationCode() {
    const { phoneNumber } = this.data;
    
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    this.setData({ canSendCode: false, countdown: 60 });

    try {
      const auth = app.auth();
      
      const verificationInfo = await auth.getVerification({
        phone_number: `+86${phoneNumber}`,
      });

      wx.setStorageSync('verificationInfo', verificationInfo);
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      
      this.startCountdown();

    } catch (error) {
      console.error('发送验证码失败:', error);
      wx.showToast({ title: '发送失败，请重试', icon: 'none' });
      this.setData({ canSendCode: true, countdown: 0 });
    }
  },

  // 倒计时
  startCountdown() {
    const timer = setInterval(() => {
      const { countdown } = this.data;
      if (countdown > 0) {
        this.setData({ countdown: countdown - 1 });
      } else {
        clearInterval(timer);
        this.setData({ canSendCode: true });
      }
    }, 1000);
  },

  // 处理短信登录
  async handleSmsLogin() {
    const { phoneNumber, verificationCode } = this.data;

    if (!verificationCode || verificationCode.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });

    try {
      const auth = app.auth();
      const verificationInfo = wx.getStorageSync('verificationInfo');
      
      await auth.signInWithSms({
        verificationInfo,
        verificationCode,
        phoneNum: `+86${phoneNumber}`,
      });

      const userInfo = await auth.getUserInfo();
      
      wx.setStorageSync('smsUserInfo', userInfo);
      wx.showToast({ title: '登录成功', icon: 'success' });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/mine/mine' });
      }, 1500);

    } catch (error) {
      console.error('登录失败:', error);
      const errorMap = {
        'INVALID_VERIFICATION_CODE': '验证码错误',
        'VERIFICATION_CODE_EXPIRED': '验证码已过期',
        'PHONE_NUMBER_NOT_FOUND': '手机号未注册'
      };
      
      wx.showToast({ 
        title: errorMap[error.code] || '登录失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ isLoading: false });
    }
  }
});