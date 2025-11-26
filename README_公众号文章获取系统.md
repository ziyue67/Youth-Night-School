# 湖州职业技术学院公众号文章获取系统

## 功能概述

这个系统可以自动获取湖州职业技术学院官方微信公众号的文章，并将其存储到数据库中，在小程序中显示。

## 系统架构

### 1. 云函数 - fetchWechatArticles

位置：`cloudfunctions/fetchWechatArticles/`

**功能：**
- 从微信公众号网页获取文章信息
- 将文章存储到 MySQL 数据库
- 提供文章查询接口

**主要方法：**
- `fetchWechatArticles()`: 获取最新文章
- `saveArticlesToDatabase(articles)`: 保存文章到数据库
- `getAllArticles()`: 获取所有文章

### 2. 数据库表结构

```sql
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. 小程序页面

#### 新闻页面 (`pages/news/`)
- 显示所有文章（默认文章 + 公众号文章）
- 支持下拉刷新
- 显示文章描述
- 区分普通文章和公众号文章

#### 管理页面 (`pages/admin/`)
- 手动获取最新文章
- 查看文章列表
- 显示获取统计信息
- 复制结果到剪贴板

## 部署步骤

### 1. 数据库配置

1. 在云函数的环境变量中配置 MySQL 数据库连接信息：
   ```javascript
   // 在云函数的环境变量中设置
   DB_HOST = 'your_database_host'
   DB_PORT = '3306'
   DB_USER = 'your_username'
   DB_PASSWORD = 'your_password'
   DB_NAME = 'your_database_name'
   ```

2. 执行 SQL 创建表：
   ```sql
   -- 运行 cloudfunctions/fetchWechatArticles/create_wechat_accounts_table.sql
   ```

### 2. 云函数部署

1. 上传云函数：
   ```bash
   # 在 cloudfunctions/fetchWechatArticles 目录下
   npm install
   # 然后在微信开发者工具中右键点击云函数，选择"上传并部署"
   ```

2. 配置云函数环境变量：
   - 在微信开发者工具中，右键点击云函数
   - 选择"云开发环境配置"
   - 添加数据库连接信息

### 3. 小程序配置

1. 确保 `app.json` 中包含管理页面：
   ```json
   "pages": [
     // ... 其他页面
     "pages/admin/index"
   ]
   ```

2. 确保 `news/index.js` 中已配置云函数调用

## 使用方法

### 1. 获取最新文章

1. 进入"我的"页面
2. 点击"公众号管理"
3. 点击"获取最新文章"
4. 系统会自动获取最新文章并存储到数据库

### 2. 查看文章列表

1. 在管理页面点击"查看文章列表"
2. 可以查看数据库中的所有文章

### 3. 在新闻页面查看

1. 进入"动态"页面
2. 可以看到所有文章，包括公众号文章
3. 公众号文章有特殊的标识（绿色边框）

## 技术特点

### 1. 网页爬取
- 使用 Cheerio 解析 HTML
- 支持从微信公众号网页提取文章信息
- 自动处理分页

### 2. 数据库操作
- 使用 UPSERT 逻辑避免重复
- 自动更新已存在的文章
- 支持批量操作

### 3. 错误处理
- 网络错误处理
- 数据库连接失败处理
- 网页解析错误处理

### 4. 用户体验
- 加载状态显示
- 空状态处理
- 下拉刷新支持
- 复制结果功能

## 注意事项

1. **网页结构变化**：如果微信公众号网页结构发生变化，需要更新爬取逻辑
2. **反爬虫机制**：建议设置合理的请求间隔，避免被封禁
3. **数据库性能**：大量文章时建议优化数据库索引
4. **云函数限制**：注意云函数的调用次数和时间限制

## 扩展功能

### 1. 定时获取
可以设置定时任务，定期获取最新文章。

### 2. 文章分类
可以添加文章分类功能，按类别显示文章。

### 3. 搜索功能
可以添加文章搜索功能，方便用户查找。

### 4. 分享功能
可以添加文章分享功能，支持分享到微信。

## 故障排除

### 1. 云函数调用失败
- 检查云函数是否正确部署
- 检查环境变量是否配置正确
- 检查网络连接

### 2. 数据库连接失败
- 检查数据库连接信息
- 检查数据库服务是否运行
- 检查防火墙设置

### 3. 网页解析失败
- 检查网页结构是否发生变化
- 检查目标网站是否可以访问
- 检查请求头设置

## 更新日志

### v1.0.0
- 基础文章获取功能
- 数据库存储功能
- 小程序展示功能
- 管理页面功能

## 联系方式

如有问题，请联系开发团队。