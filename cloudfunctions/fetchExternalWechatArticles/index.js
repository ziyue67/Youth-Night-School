const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getMysqlConnection() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT || 3306;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  
  if (!host || !user || !password || !database) {
    throw new Error('数据库连接信息未配置');
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

async function fetchWechatArticlesFromExternalDB() {
  const connection = await getMysqlConnection();
  
  try {
    // 从外部数据库获取HZVTC_WeChat_Official_Articles表的文章
    const [rows] = await connection.query(`
      SELECT id, title, link, publish_time, create_time
      FROM HZVTC_WeChat_Official_Articles 
      ORDER BY publish_time DESC 
      LIMIT 20
    `);
    
    return rows;
  } finally {
    await connection.end();
  }
}

async function syncToLocalDB(articles) {
  const db = cloud.database();
  
  for (const article of articles) {
    try {
      // 检查文章是否已存在（基于文章ID或链接）
      const existingArticle = await db.collection('HZVTC_WeChat_Official_Articles')
        .where({
          _id: article.id.toString()
        })
        .get();
      
      if (existingArticle.data.length === 0) {
        // 插入新文章
        await db.collection('HZVTC_WeChat_Official_Articles').add({
          data: {
            _id: article.id.toString(),
            title: article.title,
            link: article.link,
            publish_time: new Date(article.publish_time),
            create_time: new Date(article.create_time || article.publish_time)
          }
        });
        console.log(`新增文章: ${article.title}`);
      } else {
        // 更新现有文章
        await db.collection('HZVTC_WeChat_Official_Articles')
          .where({
            _id: article.id.toString()
          })
          .update({
            data: {
              title: article.title,
              link: article.link,
              publish_time: new Date(article.publish_time),
              create_time: new Date(article.create_time || article.publish_time)
            }
          });
        console.log(`更新文章: ${article.title}`);
      }
    } catch (err) {
      console.error(`同步文章失败: ${article.title}`, err);
    }
  }
}

exports.main = async (event, context) => {
  try {
    console.log('开始同步微信公众号文章...');
    
    // 从外部数据库获取文章
    const articles = await fetchWechatArticlesFromExternalDB();
    console.log(`从外部数据库获取到 ${articles.length} 篇文章`);
    
    // 同步到本地数据库
    await syncToLocalDB(articles);
    console.log('文章同步完成');
    
    return {
      success: true,
      message: `成功同步 ${articles.length} 篇文章`,
      data: articles
    };
  } catch (err) {
    console.error('同步文章失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};