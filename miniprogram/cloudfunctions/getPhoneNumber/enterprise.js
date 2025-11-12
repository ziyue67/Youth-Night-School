// 企业级手机号获取实现 - 使用微信云开发
const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
  traceUser: true
});

const db = cloud.database();
const _ = db.command;

class PhoneNumberService {
  constructor() {
    this.db = db;
    this.collection = 'users';
  }

  /**
   * 获取用户手机号 - 企业级实现
   * @param {string} code - 微信返回的临时code
   * @param {string} openid - 用户openid
   * @returns {Promise<Object>} 手机号信息
   */
  async getPhoneNumber(code, openid) {
    try {
      // 1. 验证企业认证状态
      if (!this.isEnterpriseVerified()) {
        throw new Error('小程序未完成企业认证，无法使用手机号获取功能');
      }

      // 2. 调用微信官方接口获取手机号
      const phoneResult = await cloud.openapi.phonenumber.getPhoneNumber({
        code: code
      });

      if (phoneResult.errCode !== 0) {
        throw new Error(`获取手机号失败: ${phoneResult.errMsg}`);
      }

      const { phoneNumber, purePhoneNumber, countryCode } = phoneResult.phoneInfo;

      // 3. 更新用户手机号信息
      await this.updateUserPhoneNumber(openid, {
        phoneNumber,
        purePhoneNumber,
        countryCode,
        updateTime: new Date()
      });

      // 4. 记录操作日志（企业合规要求）
      await this.logPhoneNumberOperation(openid, phoneNumber);

      return {
        success: true,
        data: {
          phoneNumber,
          purePhoneNumber,
          countryCode
        }
      };

    } catch (error) {
      console.error('手机号获取失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证企业认证状态
   * @returns {boolean} 是否已认证
   */
  isEnterpriseVerified() {
    // 实际项目中需要通过云函数环境变量或配置获取
    return process.env.ENTERPRISE_VERIFIED === 'true';
  }

  /**
   * 更新用户手机号信息
   * @param {string} openid 
   * @param {Object} phoneData
   */
  async updateUserPhoneNumber(openid, phoneData) {
    const userCollection = this.db.collection(this.collection);
    
    const userExists = await userCollection.where({ openid }).count();
    
    if (userExists.total > 0) {
      // 更新现有用户
      await userCollection.where({ openid }).update({
        data: {
          phoneNumber: phoneData.phoneNumber,
          phoneInfo: phoneData,
          updateTime: new Date()
        }
      });
    } else {
      // 创建新用户记录
      await userCollection.add({
        data: {
          openid,
          phoneNumber: phoneData.phoneNumber,
          phoneInfo: phoneData,
          createTime: new Date(),
          updateTime: new Date(),
          points: 0,
          level: 1
        }
      });
    }
  }

  /**
   * 记录操作日志
   * @param {string} openid 
   * @param {string} phoneNumber
   */
  async logPhoneNumberOperation(openid, phoneNumber) {
    const logCollection = this.db.collection('operation_logs');
    
    await logCollection.add({
      data: {
        openid,
        operation: 'get_phone_number',
        phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 脱敏处理
        timestamp: new Date(),
        ip: 'server-side' // 云函数环境
      }
    });
  }
}

// 云函数入口
exports.main = async (event, context) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!code) {
    return {
      success: false,
      error: '缺少code参数'
    };
  }

  const service = new PhoneNumberService();
  return await service.getPhoneNumber(code, openid);
};