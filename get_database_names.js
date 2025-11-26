import mysql from 'mysql2/promise';

// 实际数据库配置
const dbConfig = {
  host: 'sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com',
  port: 21639,
  user: 'app_user',
  password: 'C123456@',
  database: 'mysql'  // 连接到mysql数据库来获取其他数据库列表
};

async function getDatabaseNames() {
  console.log('=== 获取腾讯云MySQL数据库列表 ===');
  console.log('连接到数据库:', dbConfig.host);
  console.log('时间:', new Date().toLocaleString());
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功！');
    
    // 获取所有数据库列表
    const [rows] = await connection.execute('SHOW DATABASES');
    
    console.log('\n📊 可用数据库列表:');
    console.log('='.repeat(50));
    
    const databaseNames = [];
    for (const row of rows) {
      const dbName = Object.values(row)[0];
      databaseNames.push(dbName);
      
      // 跳过系统数据库
      if (!['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
        console.log(`✅ ${dbName} (可能是您的应用数据库)`);
      } else {
        console.log(`📋 ${dbName} (系统数据库)`);
      }
    }
    
    console.log('\n=== 推荐的应用数据库 ===');
    const userDatabases = databaseNames.filter(db => 
      !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db)
    );
    
    if (userDatabases.length > 0) {
      userDatabases.forEach((db, index) => {
        console.log(`${index + 1}. ${db}`);
      });
    } else {
      console.log('❌ 未找到用户数据库');
      console.log('建议: 在腾讯云控制台中检查您的数据库实例');
    }
    
    console.log('\n=== 云函数环境变量配置 ===');
    console.log('请将以下配置设置到微信云函数控制台中:');
    console.log('MYSQL_HOST=sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com');
    console.log('MYSQL_PORT=21639');
    console.log('MYSQL_USER=app_user');
    console.log('MYSQL_PASSWORD=C123456@');
    console.log('MYSQL_DATABASE=您的实际数据库名称');
    
    await connection.end();
    return databaseNames;
    
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.log('💡 建议: 检查网络连接和腾讯云安全组设置');
    return [];
  }
}

// 运行脚本
getDatabaseNames().catch(console.error);