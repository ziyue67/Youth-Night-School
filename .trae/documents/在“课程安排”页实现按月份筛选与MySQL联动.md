## 目标
- 在“课程安排”页（pages/courses/index）顶部/课程列表上方加入横向月份小滑块（9–12 月等），点击某个月即切换显示该月份的课程。
- 后端数据来自 MySQL；改动 MySQL 后，小程序刷新即可反映最新课程。

## 数据库设计
- 表：`courses`
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `college VARCHAR(64)`（学院名称，例："建筑工程学院"）
  - `month TINYINT`（1–12）
  - `title VARCHAR(200)`（课程标题，例如“防诈反诈知识宣讲”）
  - `week VARCHAR(16)`（如“周二”“周三”）
  - `time_start TIME`（如 `19:30:00`）
  - `time_end TIME`（如 `21:00:00`）
  - `teacher VARCHAR(100)`（授课人）
  - `location VARCHAR(100)`（地点，可选）
  - `status ENUM('available','full') DEFAULT 'available'`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- 初始化示例
  - 9 月：按你给的表格插入多条记录（学院=建筑工程学院，month=9，title/周次/时间/教师按表填写）。
  - 10 月、11 月、12 月同理。
- 查询
  - 获取月份：`SELECT DISTINCT month FROM courses WHERE college=? ORDER BY month;`
  - 获取课程：`SELECT id,title,week,time_start,time_end,teacher,status FROM courses WHERE college=? AND month=? ORDER BY week,time_start;`

## 云函数接口
- 新增云函数：`courseSchedule`
- 依赖：`wx-server-sdk`、`mysql2`（与当前运行时兼容版本）
- 环境变量：沿用现有 `MYSQL_HOST/PORT/USER/PASSWORD/DATABASE`
- 接口
  - `action: 'months'`，参数：`college`，返回：该学院可选月份数组 `[9,10,11,12]`
  - `action: 'list'`，参数：`college, month`，返回：课程数组 `{id,title,week,time:'19:30-21:00',teacher,status}`
- 连接策略
  - 复用连接；查询结果统一输出字符串时间，避免时区/格式问题。

## 前端改造（pages/courses）
- WXML：在右侧主内容上方加入横向 `scroll-view` 月份滑块（小圆角按钮），当前月份高亮；点击触发 `onMonthTap`。
- JS：
  - `data` 增加：`months: [], currentMonth: null, currentCollege: '建筑工程学院', courses: []`
  - `onLoad/onShow`：根据路由参数或默认学院，请求 `months`，设置 `currentMonth` 为最早/最新月份，再请求 `list`。
  - `switchCollege`：切换学院后重新请求 `months` 与 `list`。
  - `onMonthTap`：更新 `currentMonth` 并请求 `list`。
- 渲染：课程列表保持现有结构，时间显示为 `week + ' ' + time_start + '-' + time_end`。空列表显示“暂无该月份课程”。

## 交互与样式
- 月份滑块：`scroll-x` 水平滚动；选中态颜色与边框突出；支持 9–12 月等。
- 数据刷新：下拉刷新时重新拉取 `months` 与当前 `list`。

## 部署与验证
- 在微信开发者工具为 `courseSchedule` 选择“云端安装依赖”部署；或本地打包 ZIP 上传 SCF（包含 `node_modules`）。
- 设置现有 MySQL 环境变量。
- 通过 SCF 测试：
  - `{"action":"months","college":"建筑工程学院"}` → 返回 `[9,10,11,12]`
  - `{"action":"list","college":"建筑工程学院","month":9}` → 返回课程数组。
- 小程序页面验证：切换月份能实时展示数据库课程；在 MySQL 修改/新增后，重新进入页面或下拉刷新即可生效。

## 后续扩展
- 增加“主题月”字段、课程图片、报名状态等。
- 后台管理页面（可选）：提供增删改查界面直接写 MySQL。

请确认后我立即按此方案实现前端月份滑块、云函数与 MySQL表结构，并完成联调。