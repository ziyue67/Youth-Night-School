const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getMysqlConnection() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 21639;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  
  if (!host || !user || !password || !database) {
    throw new Error('数据库未配置，请检查环境变量');
  }
  
  return await mysql.createConnection({ 
    host, 
    port, 
    user, 
    password, 
    database, 
    dateStrings: true 
  });
}

exports.main = async (event, context) => {
  try {
    const connection = await getMysqlConnection();
    
    // 直接从外部MySQL数据库获取HZVTC_WeChat_Official_Articles表的数据
    const [rows] = await connection.execute(`
      SELECT id, title, link, publish_time, create_time
      FROM HZVTC_WeChat_Official_Articles 
      ORDER BY publish_time DESC 
      LIMIT 20
    `);
    
    await connection.end();
    
    console.log(`获取到 ${rows.length} 篇文章`);
    
    return {
      success: true,
      data: rows
    };
  } catch (err) {
    console.error('获取文章失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};