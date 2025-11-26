const fetch = require('node-fetch');

// 测试云函数
async function testCloudFunction() {
  try {
    const url = 'http://localhost:5001/your-env-id/fetchWechatArticles'; // 替换为实际的云函数URL
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetch'
      })
    });
    
    const result = await response.json();
    console.log('测试结果:', result);
    
    if (result.success) {
      console.log('成功获取文章:', result.data);
    } else {
      console.error('获取文章失败:', result.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 直接运行测试
testCloudFunction();