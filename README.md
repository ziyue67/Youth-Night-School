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

3. 环境变量（强烈建议在云函数配置中设置）：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

安全提示：不要将数据库凭证写入源码或提交到 Git 仓库。使用云平台的环境变量功能来管理敏感信息。

小程序
- 小程序源码在 `miniprogram/`，可使用微信开发者工具打开并调试。确保云函数部署并配置正确的云函数 URL 或环境后端。

Git / 推送到 GitHub（简要）
1. 本地提交：

```
git add README.md
git commit -m "docs: update README"
```

2. 绑定远程并推送（如果尚未绑定）：

```
git branch -M main
git remote add origin https://github.com/<你的用户名>/Youth-Night-School.git
git push -u origin main
```

如果远程已存在，只需执行 `git push` 即可。

更多信息与贡献
- 如果你想部署、测试或扩展云函数，请在 `cloudfunctions/` 下查看对应函数目录中的 `README` 或 `index.js` 注释。
- 欢迎提交 issue 或 Pull Request，描述你希望改进或修复的点。

----

如果你希望我代为提交并推送到你的 GitHub（需要本地已配置远程且有推送权限），我可以继续为你执行 `git add/commit/push` 操作。请确认是否现在进行推送。

