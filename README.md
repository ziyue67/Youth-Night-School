# Weix2 小程序与云函数项目

一个包含微信小程序、云函数（CloudBase）、云托管与 MySQL 的全栈项目。支持将 CloudBase 数据迁移到云托管 MySQL，并提供 Docker 生产镜像构建。

## 功能概览
- 小程序登录与用户资料更新（`cloudfunctions/wechatLogin`）
- 获取手机号并落库（`cloudfunctions/getPhoneNumber`）
- 每日签到与积分（`cloudfunctions/dailySign`）
- 数据迁移到云托管 MySQL（`cloudfunctions/migrateToMysql`）
- 前端打包与静态托管（Docker 多阶段构建）

## 环境要求
- Node.js 16+
- CloudBase CLI：`npm i -g @cloudbase/cli`
- 腾讯云开发环境（`envId`：见 `cloudbaserc.json`）
- 云托管 MySQL（建议同 VPC 内网访问）

## 环境变量配置
在项目根目录创建并填写 `.env.local`（已忽略提交）：

```
MYSQL_HOST=your.mysql.host
MYSQL_PORT=3306
MYSQL_USER=app_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=weix2
JWT_SECRET=your_jwt_secret
```

`cloudbaserc.json` 已将上述变量注入到相关云函数的运行环境。

## 云函数部署与配置
1. 登录：`cloudbase login`
2. 单函数部署（示例）：
   - `cloudbase fn deploy wechatLogin`
   - `cloudbase fn deploy getPhoneNumber`
   - `cloudbase fn deploy dailySign`
   - `cloudbase fn deploy migrateToMysql`
3. 更新配置（环境变量等）：
   - `cloudbase fn config update wechatLogin`
   - `cloudbase fn config update getPhoneNumber`
   - `cloudbase fn config update dailySign`
   - `cloudbase fn config update migrateToMysql`

如为正式环境（prod），首次需在控制台创建任意云函数完成命名空间初始化。

## 数据迁移到 MySQL
- 触发迁移：
  - `cloudbase fn invoke migrateToMysql --params "{}" -e <envId>`
- 迁移内容：`users` 与 `sign_logs` 集合分别写入 MySQL 表（带唯一约束）。

## Docker 生产镜像
项目根已包含 `Dockerfile`，多阶段构建，使用 `serve` 托管打包后的 `dist`：

```
docker build -t weix2:prod .
docker run -p 3000:3000 weix2:prod
```

## 推送到 GitHub
如果本地已配置 GitHub 账号，推荐使用以下命令推送到公开仓库：

```
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
# 先在 GitHub Web 上创建公有仓库（例如 weix2），然后：
git remote add origin https://github.com/<你的用户名>/weix2.git
git push -u origin main
```

若安装了 GitHub CLI：

```
gh repo create weix2 --public --source . --remote origin --push
```

## 安全说明
- `.env.local` 已加入 `.gitignore`，避免泄露数据库凭据与密钥。
- 生产环境建议将云函数与 MySQL 置于同一 VPC 进行内网访问，并使用最小权限账号（仅授予 SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/INDEX）。

