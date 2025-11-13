# 青春夜校小程序（Youth-Night-School）

一个包含前端小程序与云函数的示例项目，支持每日签到与积分记录，使用外网 MySQL 作为唯一数据源。

## 功能

- 我的积分：展示总积分与签到记录
- 夜校任务：执行每日签到，刷新积分与记录
- 云函数 `dailySign`：仅访问外网 MySQL，支持 `status` 与 `sign` 两个动作

## 目录结构

- `miniprogram/pages/points/`：积分页面
- `miniprogram/pages/tasks/`：夜校任务页面（签到）
- `miniprogram/pages/mine/`：我的页面（总积分、签到数）
- `cloudfunctions/dailySign/`：每日签到云函数（Node.js）

## 部署（SCF 本地打包 ZIP 路线）

1. 本地安装依赖
   - 在 `cloudfunctions/dailySign` 目录执行：
     - `npm config set registry https://registry.npmmirror.com`
     - `npm install --production`
   - 运行时为 Node.js 10.15 时使用 `mysql2@2.3.3`；如能升级到 Node.js 16，可改为 `^3.x`。

2. 打包上传
   - 打包为 `dailySign.zip`，包含：`index.js`、`package.json`、`package-lock.json`、`node_modules/`
   - 在腾讯云 SCF 控制台选择函数 `dailySign`，运行环境 `Nodejs10.15` 或更高版本，上传 ZIP 并部署。

3. 配置环境变量（外网 MySQL）
   - `MYSQL_HOST`：如 `sh-cynosdbmysql-grp-xxxx.sql.tencentcdb.com`
   - `MYSQL_PORT`：如 `21639`
   - `MYSQL_USER`：数据库账号（建议非 root）
   - `MYSQL_PASSWORD`：数据库密码
   - `MYSQL_DATABASE`：库名，如 `weix2`

4. 验证
   - SCF 测试 `{"action":"status","openid":"<你的openid>"}`，应返回 `backend: "mysql"`、`points` 与 `signRecord`。
   - 小程序“我的积分/夜校任务”页面显示与数据库一致的积分和日期。

## 关键实现说明

- 云函数只使用 MySQL：缺失 `MYSQL_*` 变量时直接报错；不再回退到云开发数据库。
- 兼容 `wx-server-sdk`：函数内部懒加载，缺失时从 `event.openid` 读取；前端已在调用时传入 `openid`。
- 日期一致性：MySQL 连接启用 `dateStrings: true`，并将签到记录日期统一输出为 `YYYY-MM-DD`。

## 推送到 GitHub

1. 初始化并提交：
   - 在项目根目录执行：
     - `git init`
     - `git add .`
     - `git commit -m "init: Youth Night School with MySQL-based dailySign"`

2. 创建远程仓库：
   - 在 GitHub 新建仓库，例如 `Youth-Night-School`（私有或公开均可）。

3. 绑定并推送：
   - `git branch -M main`
   - `git remote add origin https://github.com/<你的用户名>/Youth-Night-School.git`
   - `git push -u origin main`

> 安全提示：不要将数据库密码等敏感信息写入代码或提交到仓库。云函数使用环境变量读取敏感信息。

