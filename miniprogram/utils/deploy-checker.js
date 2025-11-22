// 云环境部署检查工具
class DeployChecker {
  constructor() {
    this.envId = process.env.CLOUD_ENV_ID || 'cloud1-9go506hg40673425';
    this.requiredFunctions = [
      'getPhoneNumber',
      'wechatLogin', 
      'phoneLogin',
      'sendSmsCode',
      'check-env'
    ];
  }

  async checkDeployment() {
    const results = [];
    
    for (const funcName of this.requiredFunctions) {
      try {
        await wx.cloud.callFunction({
          name: funcName,
          data: { check: true }
        });
        
        results.push({
          name: funcName,
          status: '已部署',
          message: '✅ 正常'
        });
      } catch (error) {
        results.push({
          name: funcName,
          status: '未部署',
          message: '❌ 需要部署',
          error: error.errMsg
        });
      }
    }
    
    return results;
  }

  getDeploymentGuide() {
    return `
    微信开发者工具操作步骤：
    1. 打开开发者工具
    2. 点击左侧"云开发"图标
    3. 进入"云函数"标签页
    4. 右键每个函数 → "上传并部署"
    5. 确保所有函数显示"已部署"
    
    当前环境ID: ${this.envId}
    `;
  }
}

// 导出检查器
module.exports = { DeployChecker };