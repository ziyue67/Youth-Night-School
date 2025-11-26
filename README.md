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
- `miniprogram/pages/news/`：新闻资讯页面
- `cloudfunctions/wechatLogin/`：微信登录云函数（Node.js）
- `cloudfunctions/getLocalWechatArticles/`：获取本地微信公众号文章云函数

## 技术栈

- **前端**：微信小程序
- **后端**：微信云开发
- **数据库**：MySQL
- **认证**：微信授权登录
- **API**：微信小程序API
- **爬虫**：Python爬虫（用于获取微信公众号文章）

## 部署说明（云函数本地ZIP上传）

### 1. 本地安装依赖
   - 在 `cloudfunctions/wechatLogin` 目录下：
     - `npm config set registry https://registry.npmmirror.com`
     - `npm install --production`
   - 对于 Node.js 10.15 运行时，使用 `mysql2@2.3.3`；如果升级到 Node.js 16，使用 `^3.x`。

### 2. 打包并上传
   - 压缩为 `wechatLogin.zip`，包括：`index.js`、`package.json`、`package-lock.json`、`node_modules/`
   - 在腾讯云SCF控制台，选择函数 `wechatLogin`，运行时 `Nodejs10.15` 或更高版本，上传ZIP并部署。

### 3. 环境变量（强烈建议在云函数配置中设置）：

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

## 公众号文章爬取与集成

### 外部爬虫使用

本项目支持通过外部Python爬虫获取微信公众号文章数据，参考教程：[零基础小白也能实现的爬取微信公众号的标题、链接和时间！！！](https://blog.csdn.net/m0_64275877/article/details/146242365)

#### 爬虫功能特点

- **自动翻页获取**：支持自动翻页获取公众号所有历史文章
- **批量数据导出**：将文章数据导出为Excel格式
- **多公众号支持**：可以爬取不同公众号的文章
- **发布时间获取**：获取文章的发布时间信息

#### 爬虫代码使用方法

```python
import traceback
import requests
import pandas as pd
from pprint import pprint

# 创建 requests 会话
__session = requests.Session()
__headers = {
    "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
}
__params = {
    "lang": "zh_CN",
    "f": "json",
}

def get_fakeid(nickname):
    """获取微信公众号的 fakeid"""
    search_url = "https://mp.weixin.qq.com/cgi-bin/searchbiz"
    # ... 实现获取fakeid的逻辑

def get_all_articles(nickname, fakeid, max_pages=20):
    """自动翻页获取公众号的所有文章"""
    art_url = "https://mp.weixin.qq.com/cgi-bin/appmsg"
    # ... 实现获取文章的逻辑

def save_to_excel(articles, filename="公众号文章.xlsx"):
    """保存文章数据为 Excel 文件"""
    df = pd.DataFrame(articles)
    df.to_excel(filename, index=False, engine="openpyxl")
    print(f"✅ 文章数据已保存为 Excel 文件: {filename}")
```

#### 数据集成到小程序

爬取的文章数据可以通过以下方式集成到微信小程序：

1. **MySQL数据库存储**：将爬取的文章数据存储到MySQL数据库中
2. **云函数处理**：通过云函数 `getLocalWechatArticles` 从数据库获取文章列表
3. **前端展示**：小程序页面调用云函数展示文章内容

#### 使用步骤

1. **准备微信公众号账号**
   - 注册微信公众号账号：https://mp.weixin.qq.com/
   - 获取Cookie和token信息

2. **运行爬虫脚本**
   - 安装依赖：`pip install requests pandas openpyxl`
   - 修改代码中的User-Agent和页数限制
   - 运行爬虫获取文章数据

3. **数据导入**
   - 将爬取的文章数据导入到MySQL数据库
   - 更新云函数中的数据查询逻辑

4. **小程序展示**
   - 小程序页面会自动从数据库获取并展示最新文章

### 主要功能实现

#### 1. 微信授权登录

- 使用 `wx.login` 获取临时登录凭证
- 通过云函数 `wechatLogin` 处理登录逻辑
- 支持自动注册和用户信息更新

#### 2. 手机号自动绑定

- 使用微信小程序 `getPhoneNumber` 组件获取用户手机号
- 通过云函数解密手机号数据并存储到MySQL数据库
- 支持用户拒绝授权时的友好提示

#### 3. 公众号文章展示

- 使用 `web-view` 组件展示微信公众号文章
- 支持加载状态和错误处理
- 提供重试机制
- 集成爬虫数据，展示最新文章

#### 4. 新闻资讯页面

- 动态加载新闻列表
- 支持下拉刷新
- 区分普通新闻和微信公众号文章
- 错误时显示空状态

## Git / 推送到GitHub（快速指南）

1. 本地提交：

```bash
git add .
git commit -m "feat: 添加公众号文章爬取功能"
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
- 爬虫相关问题和建议请参考：[CSDN爬虫教程](https://blog.csdn.net/m0_64275877/article/details/146242365)

## 开发者

- 项目名称：青春夜校微信小程序
- 开发语言：JavaScript / Python
- 开发工具：微信开发者工具 / Python IDE
- 数据库：MySQL
- 爬虫技术：Python + Requests

---

## 注意事项

1. **爬虫使用注意事项**：
   - 请遵守微信公众号的使用条款和robots协议
   - 建议控制爬取频率，避免对微信公众号服务器造成过大压力