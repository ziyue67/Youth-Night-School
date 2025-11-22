// 登录调试页面 - 快速定位问题
Page({
  data: {
    logs: [],
    isDebugging: false
  },

  onLoad() {
    this.startDebug();
  },

  async startDebug() {
    this.setData({ isDebugging: true });
    const logs = [];

    try {
      // 1. 检查云开发环境
      logs.push(await this.checkCloudEnv());
      
      // 2. 检查云函数
      logs.push(await this.checkFunctions());
      
      // 3. 检查用户状态
      logs.push(await this.checkUserState());

    } catch (error) {
      logs.push({
        type: 'error',
        message: `调试异常: ${error.message}`
      });
    }

    this.setData({
      logs,
      isDebugging: false
    });
  },

  async checkCloudEnv() {
    try {
      await wx.cloud.init({
        env: process.env.CLOUD_ENV_ID || 'cloud1-9go506hg40673425',
        traceUser: true
      });
      
      return {
        type: 'success',
        message: '云开发环境连接正常'
      };
    } catch (error) {
      return {
        type: 'error',
        message: `云环境连接失败: ${error.errMsg}`
      };
    }
  },

  async checkFunctions() {
    const functions = ['wechatLogin', 'getPhoneNumber', 'phoneLogin'];
    const results = [];

    for (const funcName of functions) {
      try {
        const result = await wx.cloud.callFunction({
          name: funcName,
          data: { test: true }
        });
        results.push(`✅ ${funcName}: 正常`);
      } catch (error) {
        results.push(`❌ ${funcName}: ${error.errMsg}`);
      }
    }

    return {
      type: 'info',
      message: `云函数状态: ${results.join(', ')}`
    };
  },

  async checkUserState() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const token = wx.getStorageSync('token');
      
      return {
        type: 'info',
        message: `用户状态: ${userInfo ? '已登录' : '未登录'}`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `状态检查失败: ${error.errMsg}`
      };
    }
  },

  async testLogin() {
    wx.showLoading({ title: '测试中...' });
    
    try {
      // 测试微信登录
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (loginRes.code) {
        const result = await wx.cloud.callFunction({
          name: 'wechatLogin',
          data: { code: loginRes.code }
        });

        if (result.result.success) {
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 保存用户信息
          wx.setStorageSync('userInfo', result.result.userInfo);
          wx.setStorageSync('token', result.result.token);
          
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({
            title: result.result.error || '登录失败',
            icon: 'none'
          });
        }
      }
    } catch (error) {
      wx.showToast({
        title: error.errMsg || '测试失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  clearStorage() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除登录缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          wx.showToast({ title: '已清除', icon: 'success' });
          this.startDebug();
        }
      }
    });
  }
});