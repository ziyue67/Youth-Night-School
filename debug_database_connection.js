import mysql from 'mysql2/promise';

// 实际数据库配置
const actualDbConfig = {
  host: 'sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com',
  port: 21639,
  user: 'app_user',
  password: 'C123456@',
  database: 'your_database'  // 请替换为实际数据库名
};

// 测试配置
const testConfigs = [
  // 实际配置
  {
    name: '实际数据库配置',
    config: actualDbConfig
  },
  // 测试不同数据库名
  {
    name: '测试mysql数据库',
    config: { ...actualDbConfig, database: 'mysql' }
  },
  {
    name: '测试information_schema',
    config: { ...actualDbConfig, database: 'information_schema' }
  },
  // 测试连接超时设置
  {
    name: '延长超时时间',
    config: { ...actualDbConfig, connectTimeout: 15000 }
  },
  // 测试SSL连接（腾讯云可能需要）
  {
    name: 'SSL连接测试',
    config: { 
      ...actualDbConfig, 
      ssl: { 
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    }
  }
];

async function testConnection(config, name) {
  console.log(`\n=== ${name} ===`);
  console.log('配置:', {
    host: config.host, 
    port: config.port, 
    user: config.user,
    ...(config.database && { database: config.database }),
    ...(config.connectTimeout && { connectTimeout: config.connectTimeout }),
    ...(config.ssl && { ssl: 'enabled' })
  });
  
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('✅ 连接成功！');
    
    // 测试基本查询
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('✅ MySQL版本:', versionRows[0].version);
    
    // 测试当前用户权限
    const [privilegeRows] = await connection.execute('SHOW GRANTS FOR CURRENT_USER()');
    console.log('✅ 当前用户权限:');
    privilegeRows.forEach(row => {
      console.log(`   - ${row.Grants_for_current_user_}`);
    });
    
    // 测试访问数据库
    if (config.database) {
      try {
        const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
        console.log('✅ 当前数据库:', dbRows[0].current_db);
      } catch (dbError) {
        console.log('⚠️ 数据库访问问题:', dbError.message);
      }
    }
    
    // 测试简单的表查询
    try {
      const [tableRows] = await connection.execute('SHOW TABLES LIMIT 5');
      console.log('✅ 可用表示例 (前5个):', tableRows.map(row => Object.values(row)[0]));
    } catch (tableError) {
      console.log('⚠️ 表查询问题:', tableError.message);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误编号:', error.errno);
    
    // 详细错误分析
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔍 权限问题分析:');
      console.log('- 可能原因1: 用户名或密码错误');
      console.log('- 可能原因2: 用户没有从当前IP访问的权限');
      console.log('- 可能原因3: 用户账户被锁定或过期');
      console.log('- 可能原因4: 密码包含特殊字符需要转义');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔍 网络问题分析:');
      console.log('- 可能原因1: 数据库服务器不可达');
      console.log('- 可能原因2: 防火墙阻止连接');
      console.log('- 可能原因3: 端口21639被阻止');
      console.log('- 可能原因4: 网络延迟过高');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔍 连接被拒绝分析:');
      console.log('- 可能原因1: 数据库服务未启动');
      console.log('- 可能原因2: IP地址或端口错误');
      console.log('- 可能原因3: 腾讯云数据库安全组设置');
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔍 连接丢失分析:');
      console.log('- 可能原因1: 数据库服务器重启');
      console.log('- 可能原因2: 网络不稳定');
      console.log('- 可能原因3: 连接超时设置过短');
    } else if (error.errno === 'ECONNRESET') {
      console.log('🔍 连接重置分析:');
      console.log('- 可能原因1: 服务器主动断开连接');
      console.log('- 可能原因2: 安全策略阻止连接');
      console.log('- 可能原因3: SSL证书问题');
    }
    
    // 腾讯云特定建议
    console.log('\n💡 腾讯云数据库特定建议:');
    console.log('- 检查腾讯云控制台的安全组设置');
    console.log('- 确认白名单中包含当前IP地址');
    console.log('- 检查数据库实例状态是否正常');
    console.log('- 确认端口21639已正确开放');
    
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('=== 腾讯云MySQL数据库连接调试脚本 ===');
  console.log('数据库地址: sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com');
  console.log('端口: 21639');
  console.log('用户: app_user');
  console.log('时间:', new Date().toLocaleString());
  console.log('='.repeat(60));
  
  let totalTests = 0;
  let successfulTests = 0;
  
  // 运行所有测试
  for (const testConfig of testConfigs) {
    totalTests++;
    const success = await testConnection(testConfig.config, testConfig.name);
    if (success) successfulTests++;
    
    // 添加延迟，避免频繁连接
    if (totalTests < testConfigs.length) {
      console.log('\n⏳ 等待2秒后进行下一个测试...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n=== 测试结果总结 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`成功连接: ${successfulTests}`);
  console.log(`失败连接: ${totalTests - successfulTests}`);
  console.log(`成功率: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n=== 下一步操作建议 ===');
  
  if (successfulTests === 0) {
    console.log('❌ 所有测试都失败了，建议:');
    console.log('1. 检查腾讯云数据库控制台的安全组设置');
    console.log('2. 确认白名单中包含当前IP地址');
    console.log('3. 验证数据库实例状态');
    console.log('4. 联系腾讯云技术支持');
  } else if (successfulTests < totalTests) {
    console.log('⚠️ 部分测试成功，建议:');
    console.log('1. 使用成功的配置进行连接');
    console.log('2. 调整失败的配置参数');
    console.log('3. 检查SSL和超时设置');
  } else {
    console.log('✅ 所有测试都成功！数据库连接正常');
    console.log('建议: 将成功的配置应用到云函数中');
  }
  
  console.log('\n=== 云函数环境变量设置建议 ===');
  console.log('在微信云函数控制台中设置:');
  console.log('MYSQL_HOST=sh-cynosdbmysql-grp-abj6wt8e.sql.tencentcdb.com');
  console.log('MYSQL_PORT=21639');
  console.log('MYSQL_USER=app_user');
  console.log('MYSQL_PASSWORD=C123456@');
  console.log('MYSQL_DATABASE=your_actual_database_name');
}

// 运行测试
runComprehensiveTests().catch(console.error);