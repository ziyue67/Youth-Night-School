// 云函数错误处理中间件
const cloud = require('wx-server-sdk');

// 初始化云环境（指定具体环境ID，避免动态环境识别失败）
cloud.init({
  env: 'cloud1-9go50673425', // 替换为你的云开发环境ID
  traceUser: true
});

// 错误处理包装器
const handleAsync = (fn) => async (event, context) => {
  try {
    return await fn(event, context);
  } catch (error) {
    console.error('云函数执行错误:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'FUNCTIONS_EXECUTE_FAIL',
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
};

// 登录统一处理
const loginHandler = handleAsync(async (event, context) => {
  const { type, code, phoneNumber, verificationCode } = event;

  switch (type) {
    case 'wechat':
      return await handleWechatLogin(code);
    case 'phone':
      return await handlePhoneLogin(code);
    case 'sms':
      return await handleSmsLogin(phoneNumber, verificationCode);
    default:
      throw new Error('未知的登录类型');
  }
});

// 微信登录处理：修复 openapi.auth.code 方法名错误
async function handleWechatLogin(code) {
  if (!code) throw new Error('缺少微信登录code');

  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  // 修复：正确方法名是 jscode2session，而非 auth.code
  const result = await cloud.openapi.auth.jscode2session({
    js_code: code,
    appid: wxContext.APPID,
    secret: '你的小程序密钥' // 补充小程序密钥（登录[微信公众平台]→开发→开发设置→获取）
  });

  const openid = result.openid;
  const userRes = await db.collection('users').where({ openid }).get();

  let userInfo = userRes.data[0];
  if (!userInfo) {
    userInfo = {
      openid,
      createTime: db.serverDate(), // 改用服务器时间，避免客户端时间偏差
      points: 0
    };
    await db.collection('users').add({ data: userInfo });
  }

  return {
    success: true,
    userInfo,
    token: openid + Date.now()
  };
}

// 手机号登录处理
async function handlePhoneLogin(code) {
  if (!code) throw new Error('缺少手机号授权码');

  const result = await cloud.openapi.phonenumber.getPhoneNumber({ code });
  if (result.errCode !== 0) {
    throw new Error(result.errMsg);
  }

  const { phoneNumber } = result.phoneInfo;
  return { success: true, phoneNumber };
}

// 短信验证码登录处理
async function handleSmsLogin(phoneNumber, verificationCode) {
  if (!phoneNumber || !verificationCode) { // 统一参数名（原 code 改为 verificationCode）
    throw new Error('缺少手机号或验证码');
  }

  // 验证验证码逻辑
  const db = cloud.database();
  const smsRes = await db.collection('sms_codes')
    .where({
      phoneNumber,
      code: verificationCode, // 匹配入参 verificationCode
      used: false,
      expireTime: db.command.gt(db.serverDate()) // 增加过期时间校验（需在 sms_codes 集合添加 expireTime 字段）
    })
    .get();

  if (smsRes.data.length === 0) {
    throw new Error('验证码无效或已过期');
  }

  // 标记验证码已使用
  await db.collection('sms_codes')
    .doc(smsRes.data[0]._id)
    .update({ data: { used: true } });

  return { success: true, phoneNumber };
}

// 资源监控
const resourceCheck = handleAsync(async (event, context) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    success: true,
    memory: {
      used: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB', // 格式化单位
      total: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
    },
    cpu: cpuUsage
  };
});

// 统一导出（云函数仅支持一个 main 入口，其他方法通过 event 分发）
exports.main = async (event, context) => {
  // 根据 event.action 分发不同功能
  const { action } = event;
  switch (action) {
    case 'login':
      return loginHandler(event, context);
    case 'resourceCheck':
      return resourceCheck(event, context);
    default:
      return { success: false, error: '未知的操作类型' };
  }
};