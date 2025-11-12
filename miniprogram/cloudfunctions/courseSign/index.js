// 云函数：课程签到
const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const usersCollection = db.collection('users');

exports.main = async (event, context) => {
  const { courseId, openid } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    const userOpenid = openid || wxContext.OPENID;
    
    // 获取用户信息
    const userRes = await usersCollection.where({ _openid: userOpenid }).get();
    
    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const user = userRes.data[0];
    const signRecord = user.signRecord || [];
    
    // 检查今日是否已签到该课程
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const hasSigned = signRecord.some(item => 
      item.courseId === courseId && 
      item.date === todayStr
    );

    if (hasSigned) {
      return { success: false, message: '今日已签到该课程' };
    }

    // 添加签到记录
    const newSign = {
      courseId: courseId,
      date: todayStr,
      time: today,
      points: 5
    };

    await usersCollection.doc(user._id).update({
      data: {
        signRecord: db.command.push(newSign),
        points: db.command.inc(5)
      }
    });

    return {
      success: true,
      message: '签到成功，积分+5',
      points: (user.points || 0) + 5
    };
  } catch (err) {
    console.error('签到失败:', err);
    return {
      success: false,
      message: '签到异常',
      error: err.message
    };
  }
};