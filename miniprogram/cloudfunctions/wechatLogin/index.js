// 云函数：微信登录验证
const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const { code } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    // 获取openid（在小程序环境中，可以直接从context获取）
    const openid = wxContext.OPENID;
    const unionid = wxContext.UNIONID || '';

    // 生成登录令牌
    const token = openid;

    // 检查用户是否已存在
    const userRes = await usersCollection.where({ openid: openid }).get();
    let userInfo = null;
    
    if (userRes.data.length === 0) {
      // 创建新用户
      const newUser = {
        openid: openid,
        createTime: new Date(),
        points: 0,
        tasks: [],
        signRecord: [],
        level: 1,
        badges: []
      };
      
      const addRes = await usersCollection.add({ data: newUser });
      userInfo = { ...newUser, _id: addRes._id };
    } else {
      userInfo = userRes.data[0];
    }

    return {
      success: true,
      openid,
      userInfo,
      token,
      message: '登录成功'
    };
  } catch (err) {
    console.error('微信登录验证失败:', err);
    return {
      success: false,
      message: '登录验证失败',
      error: err.message
    };
  }
};