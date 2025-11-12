const cloud = require('wx-server-sdk');
// 使用云函数所在环境的默认环境ID
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { userInfo } = event;

  try {
    const db = cloud.database();
    const users = db.collection('users');

    // 检查用户是否已存在
    const userRes = await users.where({ openid: wxContext.OPENID }).get();

    if (userRes.data.length > 0) {
      // 更新登录时间
      await users.where({ openid: wxContext.OPENID }).update({
        data: { lastLoginTime: new Date() }
      });
      return { success: true, user: userRes.data[0] };
    } else {
      // 创建新用户
      const newUser = {
        openid: wxContext.OPENID,
        avatarUrl: userInfo?.avatarUrl || '',
        nickName: userInfo?.nickName || '',
        createTime: new Date(),
        lastLoginTime: new Date()
      };
      const addRes = await users.add({ data: newUser });
      return { success: true, user: { ...newUser, _id: addRes._id } };
    }
  } catch (error) {
    console.error('登录云函数错误:', error);
    return { success: false, error: error.message };
  }
};