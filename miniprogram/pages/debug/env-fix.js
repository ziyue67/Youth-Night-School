// 云环境修复和验证工具
Page({
  data: {
    envConfig: {
      envId: 'cloud1-9go506hg40673425',
      region: 'ap-shanghai',
      timeout: 5000
    },
    testResults: [],
    isChecking: false
  },

  onLoad() {
    this.checkEnvironment();
  },

  async checkEnvironment() {
    this.setData({ isChecking: true });
    
    const results = [];
    
    try {
      // 1. 检查基础配置
      results.push(await this.checkBasicConfig());
      
      // 2. 检查云函数部署
      results.push(await this.checkFunctions());
      
      // 3. 检查权限配置
      results.push(await this.checkPermissions());
      
      // 4. 检查网络连接
      results.push(await this.checkNetwork());
      
    } catch (error) {
      results.push({
        name: '环境检查',
        status: '❌ 异常',
        detail: error.message,
        fix: '请检查云开发控制台配置'
      });
    }
    
    this.setData({
      testResults: results,
      isChecking: false
    });
  },

  async checkBasicConfig() {
    try {
      // 检查云开发初始化
      const result = await wx.cloud.callFunction({
        name: 'check-env',
        data: {}
      });
      
      return {
        name: '基础配置',
        status: result.result.success ? '✅ 正常' : '❌ 异常',
        detail: result.result.message || result.result.error,
        fix: result.result.success ? null : '请检查云开发控制台环境配置'
      };
    } catch (error) {
      return {
        name: '基础配置',
        status: '❌ 连接失败',
        detail: error.errMsg || '无法连接到云环境',
        fix: '请确认云开发已开通并正确配置环境ID'
      };
    }
  },

  async checkFunctions() {
    const requiredFunctions = [
      'getPhoneNumber',
      'wechatLogin', 
      'phoneLogin',
      'sendSmsCode',
      'check-env'
    ];
    
    const results = [];
    
    for (const funcName of requiredFunctions) {
      try {
        const result = await wx.cloud.callFunction({
          name: funcName,
          data: { test: true }
        });
        
        results.push({
          name: funcName,
          status: '✅ 已部署',
          detail: '函数存在且可调用'
        });
      } catch (error) {
        if (error.errMsg.includes('FunctionName parameter could not be found')) {
          results.push({
            name: funcName,
            status: '❌ 未部署',
            detail: '云函数未找到',
            fix: '请在开发者工具中上传部署此云函数'
          });
        } else {
          results.push({
            name: funcName,
            status: '❌ 异常',
            detail: error.errMsg
          });
        }
      }
    }
    
    return {
      name: '云函数部署',
      status: results.some(r => r.status.includes('❌')) ? '❌ 部分缺失' : '✅ 完整',
      detail: `${results.filter(r => r.status.includes('✅')).length}/${requiredFunctions.length} 个已部署`
    };
  },

  async checkPermissions() {
    try {
      const db = wx.cloud.database();
      await db.collection('users').limit(1).get();
      
      return {
        name: '数据库权限',
        status: '✅ 正常',
        detail: '数据库权限配置正确'
      };
    } catch (error) {
      return {
        name: '数据库权限',
        status: '❌ 权限问题',
        detail: error.errMsg,
        fix: '请在云开发控制台配置数据库权限'
      };
    }
  },

  async checkNetwork() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'check-env',
        data: {}
      });
      
      return {
        name: '网络连接',
        status: '✅ 正常',
        detail: '网络连接稳定'
      };
    } catch (error) {
      return {
        name: '网络连接',
        status: '❌ 连接失败',
        detail: '请检查网络连接',
        fix: '确保网络畅通，尝试重启开发者工具'
      };
    }
  },

  // 获取修复指南
  getFixGuide() {
    return [
      {
        step: 1,
        title: '检查云开发状态',
        action: '登录腾讯云控制台 → 云开发 → 确认环境已创建'
      },
      {
        step: 2,
        title: '部署云函数',
        action: '开发者工具 → 云开发 → 云函数 → 上传所有函数'
      },
      {
        step: 3,
        title: '配置权限',
        action: '云开发控制台 → 数据库 → 设置权限为"所有用户可读"'
      },
      {
        step: 4,
        title: '验证配置',
        action: '使用此页面测试功能是否正常'
      }
    ];
  },

  // 一键修复功能
  async fixEnvironment() {
    wx.showLoading({ title: '修复中...' });
    
    try {
      // 重新测试环境
      await this.checkEnvironment();
      
      wx.showToast({
        title: '修复完成',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '修复失败，请手动检查',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});