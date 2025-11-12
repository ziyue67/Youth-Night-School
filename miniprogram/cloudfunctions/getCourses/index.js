// 云函数：获取课程数据
const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();

exports.main = async (event, context) => {
  const { college } = event;
  
  try {
    let query = db.collection('courses');
    
    if (college) {
      query = query.where({ college });
    }
    
    const result = await query
      .orderBy('college', 'asc')
      .orderBy('id', 'asc')
      .get();
    
    // 按学院分组
    const courseData = {};
    result.data.forEach(item => {
      if (!courseData[item.college]) {
        courseData[item.college] = [];
      }
      courseData[item.college].push({
        id: item.id,
        name: item.name,
        time: item.time,
        teacher: item.teacher,
        status: item.status || 'available'
      });
    });
    
    return {
      success: true,
      data: courseData
    };
  } catch (err) {
    console.error('获取课程失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};