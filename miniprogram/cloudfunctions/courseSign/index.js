// 课程签到云函数
const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getMysql() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 21639;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) throw new Error('数据库未配置');
  const conn = await mysql.createConnection({ host, port, user, password, database, dateStrings: true });
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) UNIQUE, points INT DEFAULT 0, nick_name VARCHAR(64), phone VARCHAR(32), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
  );
  // 课程签到记录表
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS course_sign_logs (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, course_id VARCHAR(64) NOT NULL, course_name VARCHAR(128), sign_date DATE NOT NULL, points INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid_course_date (openid, course_id, sign_date))'
  );
  // 课程表
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS courses (id INT PRIMARY KEY AUTO_INCREMENT, course_id VARCHAR(64) UNIQUE NOT NULL, course_name VARCHAR(128) NOT NULL, teacher VARCHAR(64), schedule VARCHAR(128), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
  );
  return conn;
}

exports.main = async (event, context) => {
  const { action, courseId, courseName, points = 5 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const today = new Date().toISOString().slice(0, 10);

  if (action === 'status') {
    try {
      console.log('查询用户课程签到状态，openid:', openid);
      const conn = await getMysql();
      
      // 获取用户信息
      const [urows] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
      let userPoints = 0;
      if (!urows.length) {
        await conn.execute('INSERT INTO users (openid, points) VALUES (?,?)', [openid, 0]);
        const [u2] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
        userPoints = u2[0].points || 0;
      } else {
        userPoints = urows[0].points || 0;
      }
      
      // 获取今日签到记录
      const [signedRows] = await conn.execute('SELECT course_id, course_name, points FROM course_sign_logs WHERE openid=? AND sign_date=?', [openid, today]);
      
      // 获取最近签到记录
      const [logs] = await conn.execute('SELECT course_id, course_name, sign_date AS date, points FROM course_sign_logs WHERE openid=? ORDER BY created_at DESC LIMIT 10', [openid]);
      
      // 获取用户总签到次数
      const [countRows] = await conn.execute('SELECT COUNT(*) as totalSigns FROM course_sign_logs WHERE openid=?', [openid]);
      const totalSigns = countRows[0].totalSigns || 0;
      
      // 获取可用课程列表
      const [courses] = await conn.execute('SELECT course_id, course_name, teacher, schedule FROM courses ORDER BY course_name');
      
      console.log('数据库查询结果:', {
        openid,
        userPoints,
        totalSigns,
        signedToday: signedRows.length > 0,
        todayCourses: signedRows,
        logsCount: logs.length,
        coursesCount: courses.length
      });
      
      await conn.end();
      return {
        success: true,
        userPoints,
        totalSigns,
        signedToday: signedRows.length > 0,
        todayCourses: signedRows,
        signRecord: logs.map(r => ({ 
          courseId: r.course_id, 
          courseName: r.course_name, 
          date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10), 
          points: r.points 
        })),
        availableCourses: courses,
        backend: 'mysql'
      };
    } catch (err) {
      console.error('查询用户课程签到状态失败:', err);
      return { success: false, error: err.message };
    }
  }
  
  if (action === 'addCourse') {
    try {
      const { courseId, courseName, teacher, schedule } = event;
      if (!courseId || !courseName) {
        return { success: false, error: '课程ID和课程名称不能为空' };
      }
      
      const conn = await getMysql();
      await conn.execute(
        'INSERT INTO courses (course_id, course_name, teacher, schedule) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE course_name=?, teacher=?, schedule=?',
        [courseId, courseName, teacher || '', schedule || '', courseName, teacher || '', schedule || '']
      );
      
      await conn.end();
      return { success: true, message: '课程添加成功' };
    } catch (err) {
      console.error('添加课程失败:', err);
      return { success: false, error: err.message };
    }
  }
  
  if (action !== 'sign') {
    return { success: false, error: '未知操作' };
  }

  if (!courseId || !courseName) {
    return { success: false, error: '课程ID和课程名称不能为空' };
  }

  try {
    const conn = await getMysql();
    
    // 确保用户存在
    const [urows] = await conn.execute('SELECT id, points FROM users WHERE openid=?', [openid]);
    if (!urows.length) {
      await conn.execute('INSERT INTO users (openid, points) VALUES (?,?)', [openid, 0]);
    }
    
    // 检查今日是否已签到该课程
    const [rows] = await conn.execute('SELECT id FROM course_sign_logs WHERE openid=? AND course_id=? AND sign_date=?', [openid, courseId, today]);
    if (rows.length > 0) {
      await conn.end();
      return { success: false, error: '今日已签到该课程' };
    }

    // 记录签到
    await conn.execute('INSERT INTO course_sign_logs (openid, course_id, course_name, sign_date, points) VALUES (?,?,?,?,?)', [openid, courseId, courseName, today, points]);

    // 更新用户积分
    await conn.execute(
      'INSERT INTO users (openid, points) VALUES (?,?) ON DUPLICATE KEY UPDATE points=points+?',
      [openid, points, points]
    );

    await conn.end();
    return { success: true, points, courseId, courseName, backend: 'mysql' };
  } catch (err) {
    console.error('课程签到失败:', err);
    return { success: false, error: err.message };
  }
};