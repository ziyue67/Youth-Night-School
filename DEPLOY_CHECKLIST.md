# 湖州职业技术学院公众号文章获取系统 - 部署检查清单

## 部署前检查

### 1. 数据库配置
- [ ] 创建了 wechat_accounts 数据表
- [ ] 数据库用户有足够的权限（CREATE, INSERT, UPDATE, SELECT）
- [ ] 数据库字符集设置为 utf8mb4
- [ ] 测试数据库连接是否正常

### 2. 云函数配置
- [ ] 安装了所有依赖：`npm install`
- [ ] 配置了环境变量：
  - `DB_HOST`: 数据库主机地址
  - `DB_PORT`: 数据库端口（默认3306）
  - `DB_USER`: 数据库用户名
  - `DB_PASSWORD`: 数据库密码
  - `DB_NAME`: 数据库名称
- [ ] 云函数代码已测试通过
- [ ] 云函数入口文件正确（index.js）

### 3. 小程序配置
- [ ] app.json 中包含了管理页面：`"pages/admin/index"`
- [ ] news 页面已更新支持公众号文章
- [ ] mine 页面已添加管理入口
- [ ] 所有页面文件都存在且语法正确

### 4. 文件检查
- [ ] 云函数文件：
  - [ ] `index.js`
  - [ ] `package.json`
  - [ ] `test.js`
  - [ ] `create_wechat_accounts_table.sql`
- [ ] 小程序页面文件：
  - [ ] `pages/admin/index.js`
  - [ ] `pages/admin/index.wxml`
  - [ ] `pages/admin/index.wxss`
  - [ ] `pages/admin/index.json`
  - [ ] `pages/news/index.js`（已更新）
  - [ ] `pages/news/index.wxml`（已更新）
  - [ ] `pages/news/index.wxss`（已更新）
- [ ] 文档文件：
  - [ ] `README_公众号文章获取系统.md`
  - [ ] `DEPLOY_CHECKLIST.md`

## 部署步骤

### 1. 数据库部署
- [ ] 执行 SQL 创建表：
  ```sql
  -- 运行 cloudfunctions/fetchWechatArticles/create_wechat_accounts_table.sql
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

### 2. 云函数部署
- [ ] 在微信开发者工具中打开项目
- [ ] 右键点击 `cloudfunctions/fetchWechatArticles` 文件夹
- [ ] 选择"上传并部署：云端安装依赖（不上传node_modules）"
- [ ] 等待部署完成
- [ ] 在云开发控制台配置环境变量

### 3. 小程序部署
- [ ] 检查所有页面文件是否正确
- [ ] 确保页面路由配置正确
- [ ] 测试页面跳转是否正常
- [ ] 上传小程序代码

## 测试验证

### 1. 云函数测试
- [ ] 在云开发控制台测试云函数
- [ ] 测试 `fetchWechatArticles` 函数：
  - 获取文章列表
  - 获取最新文章
  - 保存文章到数据库

### 2. 小程序测试
- [ ] 测试新闻页面显示
- [ ] 测试管理页面功能
- [ ] 测试从 mine 页面进入管理页面
- [ ] 测试下拉刷新功能

### 3. 数据库测试
- [ ] 检查数据库中是否有文章数据
- [ ] 检查文章数据是否完整
- [ ] 检查重复文章是否正确更新

## 功能验证

### 1. 文章获取功能
- [ ] 能够成功获取公众号文章
- [ ] 文章信息完整（标题、链接、描述等）
- [ ] 不会重复获取相同文章

### 2. 数据存储功能
- [ ] 新文章能够正确插入数据库
- ] 重复文章能够正确更新
- ] 数据库操作不会出现错误

### 3. 小程序显示功能
- [ ] 新闻页面能够显示公众号文章
- [ ] 公众号文章有特殊标识
- [ ] 文章描述能够正确显示
- [ ] 加载状态和空状态正常显示

### 4. 管理功能
- [ ] 管理页面能够正常访问
- [ ] 能够手动获取文章
- [ ] 能够查看文章列表
- [ ] 能够复制结果到剪贴板

## 性能和优化

### 1. 性能检查
- [ ] 云函数响应时间在可接受范围内
- [ ] 数据库查询效率良好
- [ ] 小程序页面加载速度正常

### 2. 错误处理
- [ ] 网络错误能够正确处理
- [ ] 数据库错误能够正确处理
- [ ] 用户界面有适当的错误提示

### 3. 用户体验
- [ ] 加载状态提示清晰
- [ ] 空状态提示友好
- [ ] 操作反馈及时

## 监控和维护

### 1. 日志监控
- [ ] 配置了云函数日志
- [ ] 能够监控文章获取情况
- [ ] 能够及时发现错误

### 2. 定期维护
- [ ] 定期检查网页结构变化
- [ ] 定期清理无效文章
- [ ] 定期备份数据库

### 3. 更新计划
- [ ] 计划定期获取新文章
- [ ] 计划优化爬虫逻辑
- [ ] 计划添加新功能

## 常见问题

### 1. 云函数部署失败
- 检查依赖是否正确安装
- 检查代码语法是否正确
- 检查环境变量是否配置

### 2. 数据库连接失败
- 检查数据库连接信息
- 检查数据库服务是否运行
- 检查防火墙设置

### 3. 文章获取失败
- 检查微信公众号网页结构
- 检查网络连接
- 检查请求头设置

### 4. 小程序显示异常
- 检查页面文件是否正确
- 检查路由配置是否正确
- 检查数据格式是否正确

## 部署完成确认

- [ ] 所有功能测试通过
- [ ] 性能测试通过
- [ ] 错误处理测试通过
- [ ] 用户体验测试通过
- [ ] 文档和说明完整

## 联系信息

如有问题，请联系：
- 开发团队：[您的联系方式]
- 技术支持：[技术支持联系方式]