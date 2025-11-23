# 青年夜校微信小程序

一个基于微信小程序和云开发的全栈项目，支持每日签到、积分追踪和手机号绑定功能。使用外部MySQL数据库作为唯一数据源。

## 功能特点

- **我的积分**：显示总积分和签到记录
- **夜校任务**：执行每日签到，刷新积分和记录
- **公众号文章展示**：支持显示微信公众号文章内容
- **手机号自动绑定**：通过微信授权自动获取用户手机号并存储到MySQL数据库
- **云函数 `wechatLogin`**：处理用户登录、注册和手机号绑定，访问外部MySQL数据库

## 项目结构

- `miniprogram/pages/points/`：积分页面
- `miniprogram/pages/tasks/`：夜校任务页面（签到）
- `miniprogram/pages/mine/`：我的页面（总积分、签到数）
- `miniprogram/pages/webview/`：公众号文章展示页面
- `cloudfunctions/wechatLogin/`：微信登录云函数（Node.js）

## 技术栈

- **前端**：微信小程序
- **后端**：微信云开发
- **数据库**：MySQL
- **认证**：微信授权登录
- **API**：微信小程序API

## 部署说明（云函数本地ZIP上传）

1. 本地安装依赖
   - 在 `cloudfunctions/wechatLogin` 目录下：
     - `npm config set registry https://registry.npmmirror.com`
     - `npm install --production`
   - 对于 Node.js 10.15 运行时，使用 `mysql2@2.3.3`；如果升级到 Node.js 16，使用 `^3.x`。

2. 打包并上传
   - 压缩为 `wechatLogin.zip`，包括：`index.js`、`package.json`、`package-lock.json`、`node_modules/`
   - 在腾讯云SCF控制台，选择函数 `wechatLogin`，运行时 `Nodejs10.15` 或更高版本，上传ZIP并部署。

3. 环境变量（强烈建议在云函数配置中设置）：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `JWT_SECRET`（用于生成用户认证令牌）

安全提示：不要在源代码中硬编码数据库凭据或提交到Git。使用云平台环境变量管理敏感信息。

## 小程序

- 源代码在 `miniprogram/` 目录下，使用微信开发者工具打开和调试。确保云函数已部署并配置正确的URL或后端环境。

## 数据库设计

### users 表结构

| 字段名 | 类型 | 是否为空 | 键 | 默认值 | 说明 |
|--------|------|----------|-----|--------|------|
| id | int(11) | NO | PRI | auto_increment | 自增主键 |
| openid | varchar(64) | NO | UNI | | 微信用户唯一标识 |
| unionid | varchar(64) | YES | | | 微信用户跨应用唯一标识 |
| nick_name | varchar(100) | YES | | | 用户昵称 |
| avatar_url | varchar(255) | YES | | | 用户头像URL |
| phone | varchar(32) | YES | | | 用户手机号 |
| points | int(11) | YES | | 0 | 用户积分 |
| create_time | timestamp | NO | | CURRENT_TIMESTAMP | 创建时间 |
| last_login_time | timestamp | NO | | CURRENT_TIMESTAMP | 最后登录时间 |

## 主要功能实现

### 1. 微信授权登录

- 使用 `wx.login` 获取临时登录凭证
- 通过云函数 `wechatLogin` 处理登录逻辑
- 支持自动注册和用户信息更新

### 2. 手机号自动绑定

- 使用微信小程序 `getPhoneNumber` 组件获取用户手机号
- 通过云函数解密手机号数据并存储到MySQL数据库
- 支持用户拒绝授权时的友好提示

### 3. 公众号文章展示

- 使用 `web-view` 组件展示微信公众号文章
- 支持加载状态和错误处理
- 提供重试机制

## Git / 推送到GitHub（快速指南）

1. 本地提交：

```bash
git add .
git commit -m "feat: 添加手机号自动绑定功能"
```

2. 绑定远程并推送（如果尚未绑定）：

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/Youth-Night-School.git
git push -u origin main
```

如果远程已存在，只需运行 `git push`。

## 更多信息与贡献

- 有关部署、测试或扩展云函数的信息，请查看 `cloudfunctions/` 下相应函数目录中的README或代码注释。
- 欢迎提交问题或拉取请求，描述改进或修复。

## 开发者

- 项目名称：青春夜校微信小程序
- 开发语言：JavaScript
- 开发工具：微信开发者工具
- 数据库：MySQL

---

如果您希望我为您提交并推送到GitHub（需要配置远程仓库和推送权限），我可以为您运行 `git add/commit/push`。请确认是否要继续。

// 本README中的所有注释均使用中文编写，便于国内开发者理解和协作。