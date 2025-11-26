import mysql from 'mysql2/promise';

// 最终验证配置 - 请根据实际情况修改数据库名称
const finalConfigs = [
  {
    name: 'weix2数据库',
    config: {
      host: 'sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com',
      port: 21639,
      user: 'app_user',
      password: 'C123456@',
      database: 'weix2'
    }
  },
  {
    name: 'nodejs_demo数据库', 
    config: {
      host: 'sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com',
      port: 21639,
      user: 'app_user',
      password: 'C123456@',
      database: 'nodejs_demo'
    }
  }
];

async function testFinalConnection(config, name) {
  console.log(`\n=== 最终验证: ${name} ===`);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功！');
    
    // 测试基本查询
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    console.log('✅ 服务器时间:', rows[0].current_time);
    
    // 测试数据库连接
    const [dbRows] = await connection.execute('SELECT DATABASE() as db_name');
    console.log('✅ 当前数据库:', dbRows[0].db_name);
    
    // 测试表查询（使用兼容的语法）
    try {
      const [tableRows] = await connection.execute('SHOW TABLES');
      console.log(`✅ 数据库中的表数量: ${tableRows.length}`);
      if (tableRows.length > 0) {
        console.log('📋 表列表 (前5个):');
        tableRows.slice(0, 5).forEach((row, index) => {
          const tableName = Object.values(row)[0];
          console.log(`   ${index + 1}. ${tableName}`);
        });
      }
    } catch (tableError) {
      console.log('⚠️ 表查询问题:', tableError.message);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    return false;
  }
}

async function runFinalVerification() {
  console.log('=== 数据库连接最终验证 ===');
  console.log('时间:', new Date().toLocaleString());
  console.log('='.repeat(50));
  
  for (const [index, config] of finalConfigs.entries()) {
    console.log(`\n测试 ${index + 1}/${finalConfigs.length}`);
    const success = await testFinalConnection(config.config, config.name);
    
    if (success && index === 0) {
      console.log('\n🎉 推荐配置: 使用第一个成功的配置设置云函数环境变量');
      console.log('MYSQL_DATABASE=weix2');
    }
    
    if (index < finalConfigs.length - 1) {
      console.log('\n⏳ 等待1秒...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n=== 云函数部署建议 ===');
  console.log('1. 在微信开发者工具中打开云函数');
  console.log('2. 选择 wechatLogin 函数');
  console.log('3. 在函数配置中设置环境变量');
  console.log('4. 上传部署云函数');
  console.log('5. 测试小程序登录功能');
}

runFinalVerification().catch(console.error);