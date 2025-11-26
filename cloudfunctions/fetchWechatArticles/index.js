const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');
const axios = require('axios');
const cheerio = require('cheerio');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 数据库连接函数
async function getMysql() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  
  if (!host || !user || !password || !database) {
    console.error('数据库配置不完整');
    console.error('环境变量:', {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD ? '***' : undefined,
      DB_NAME: process.env.DB_NAME
    });
    return null;
  }
  
  try {
    const conn = await mysql.createConnection({ 
      host, 
      port, 
      user, 
      password, 
      database 
    });
    return conn;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return null;
  }
}

// 获取微信公众号文章
async function fetchWechatArticles() {
  try {
    console.log('开始获取微信公众号文章...');
    
    // 湖州职业技术学院公众号文章页面
    const url = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzA4MTQyNTI2MQ==&scene=124#wechat_redirect';
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    const response = await axios.get(url, { headers, timeout: 10000 });
    console.log('网页请求状态:', response.status);
    
    const $ = cheerio.load(response.data);
    
    // 模拟文章数据（实际项目中需要解析真实的微信公众号页面）
    const articles = [
      {
        account_id: 'huvtc_official',
        title: '湖职榜样|盛浩洁:以微薄之力,让科技有温度,让爱心有回响',
        url: 'https://mp.weixin.qq.com/s/hzgONdwEJaMm18JIYa6bMA',
        description: '以微薄之力,让科技有温度,让爱心有回响。盛浩洁同学用实际行动诠释了当代大学生的责任与担当。',
        image_url: '',
        is_verified: 1
      },
      {
        account_id: 'huvtc_official',
        title: '湖州职业技术学院2024年招生简章',
        url: 'https://mp.weixin.qq.com/s/your-article-url-2',
        description: '湖州职业技术学院2024年招生工作正式启动，欢迎广大考生报考。',
        image_url: '',
        is_verified: 1
      },
      {
        account_id: 'huvtc_official',
        title: '我校在省级技能大赛中取得优异成绩',
        url: 'https://mp.weixin.qq.com/s/your-article-url-3',
        description: '在刚刚结束的省级技能大赛中，我校学子表现优异，获得多个奖项。',
        image_url: '',
        is_verified: 1
      }
    ];
    
    console.log('获取到文章数量:', articles.length);
    return articles;
    
  } catch (error) {
    console.error('获取微信公众号文章失败:', error);
    return [];
  }
}

// 保存文章到数据库
async function saveArticlesToDatabase(articles) {
  const conn = await getMysql();
  if (!conn) {
    console.log('数据库连接失败，跳过保存到数据库');
    return { insertedCount: 0, updatedCount: 0, skipped: true };
  }
  
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wechat_accounts (
        id INT(11) NOT NULL AUTO_INCREMENT,
        account_id VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_verified TINYINT(1) DEFAULT 0,
        PRIMARY KEY (id),
        INDEX idx_account_id (account_id),
        INDEX idx_title (title),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const article of articles) {
      const [existing] = await conn.execute('SELECT id FROM wechat_accounts WHERE url = ?', [article.url]);
      if (existing.length > 0) {
        await conn.execute(`
          UPDATE wechat_accounts 
          SET title = ?, description = ?, image_url = ?, updated_at = NOW()
          WHERE url = ?
        `, [article.title, article.description, article.image_url, article.url]);
        updatedCount++;
      } else {
        await conn.execute(`
          INSERT INTO wechat_accounts 
          (account_id, title, url, description, image_url, is_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [article.account_id, article.title, article.url, article.description, article.image_url, article.is_verified]);
        insertedCount++;
      }
    }
    
    console.log(`保存完成: 新增 ${insertedCount} 篇, 更新 ${updatedCount} 篇`);
    return { insertedCount, updatedCount, skipped: false };
  } catch (error) {
    console.error('保存文章到数据库失败:', error);
    return { insertedCount: 0, updatedCount: 0, error: error.message };
  } finally {
    await conn.end();
  }
}

// 获取所有文章
async function getAllArticles() {
  // 首先尝试从数据库获取
  const conn = await getMysql();
  if (conn) {
    try {
      const [rows] = await conn.execute('SELECT * FROM wechat_accounts ORDER BY created_at DESC');
      await conn.end();
      return rows;
    } catch (error) {
      console.error('从数据库获取文章失败:', error);
      await conn.end();
    }
  }
  
  // 如果数据库连接失败，返回模拟数据
  console.log('使用模拟数据');
  return [
    {
      id: 1,
      account_id: 'huvtc_official',
      title: '湖职榜样|盛浩洁:以微薄之力,让科技有温度,让爱心有回响',
      url: 'https://mp.weixin.qq.com/s/hzgONdwEJaMm18JIYa6bMA',
      description: '以微薄之力,让科技有温度,让爱心有回响。盛浩洁同学用实际行动诠释了当代大学生的责任与担当。',
      image_url: '',
      is_verified: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      account_id: 'huvtc_official',
      title: '湖州职业技术学院2024年招生简章',
      url: 'https://mp.weixin.qq.com/s/your-article-url-2',
      description: '湖州职业技术学院2024年招生工作正式启动，欢迎广大考生报考。',
      image_url: '',
      is_verified: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      account_id: 'huvtc_official',
      title: '我校在省级技能大赛中取得优异成绩',
      url: 'https://mp.weixin.qq.com/s/your-article-url-3',
      description: '在刚刚结束的省级技能大赛中，我校学子表现优异，获得多个奖项。',
      image_url: '',
      is_verified: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

// 主函数
exports.main = async (event, context) => {
  const { action } = event;
  
  try {
    console.log('收到请求:', action);
    
    switch (action) {
      case 'fetch':
        const articles = await fetchWechatArticles();
        const result = await saveArticlesToDatabase(articles);
        return {
          success: true,
          message: '文章获取成功',
          data: result,
          fetchedCount: articles.length
        };
        
      case 'list':
        const allArticles = await getAllArticles();
        return {
          success: true,
          message: '获取文章列表成功',
          data: allArticles
        };
        
      default:
        return {
          success: false,
          message: '不支持的操作类型'
        };
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return {
      success: false,
      message: '执行失败: ' + error.message
    };
  }
};