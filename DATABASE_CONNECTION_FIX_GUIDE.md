# 数据库连接权限问题修复指南

## 问题描述
云函数返回错误：`Access denied for user 'app_user'@'121.4.251.228' (using password: YES)`

## 问题分析
这个错误表明MySQL数据库拒绝来自IP地址 `121.4.251.228` 的用户 `app_user` 的连接请求。可能的原因包括：

1. **用户名或密码错误**
2. **用户没有从该IP地址访问的权限**
3. **数据库用户不存在**
4. **MySQL服务器配置不允许远程访问**

## 解决方案

### 方案一：检查和修复云函数环境变量（推荐）

#### 步骤1：检查云函数环境变量配置
1. 登录微信云开发控制台
2. 进入云函数管理页面
3. 找到 `wechatLogin` 云函数
4. 右键点击选择 "云端配置"
5. 检查以下环境变量是否正确设置：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `MYSQL_HOST` | `your-mysql-host.com` | MySQL服务器地址 |
| `MYSQL_PORT` | `3306` | MySQL端口 |
| `MYSQL_USER` | `app_user` | 数据库用户名 |
| `MYSQL_PASSWORD` | `your_password` | 数据库密码 |
| `MYSQL_DATABASE` | `your_database` | 数据库名称 |
| `JWT_SECRET` | `your_jwt_secret` | JWT密钥 |

#### 步骤2：使用调试脚本测试连接
```javascript
// 在本地运行调试脚本
node debug_database_connection.js
```

### 方案二：MySQL数据库权限修复

#### 如果可以访问MySQL服务器，请执行以下SQL：

```sql
-- 1. 检查用户是否存在
SELECT user, host FROM mysql.user WHERE user = 'app_user';

-- 2. 如果用户不存在，创建用户
CREATE USER 'app_user'@'%' IDENTIFIED BY 'your_password';

-- 3. 授予用户访问特定数据库的权限
GRANT ALL PRIVILEGES ON your_database_name.* TO 'app_user'@'%';

-- 4. 刷新权限
FLUSH PRIVILEGES;

-- 5. 验证权限
SHOW GRANTS FOR 'app_user'@'%';
```

#### 安全方案：限制特定IP访问
```sql
-- 只允许从特定IP访问（更安全）
CREATE USER 'app_user'@'121.4.251.228' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database_name.* TO 'app_user'@'121.4.251.228';
FLUSH PRIVILEGES;
```

### 方案三：MySQL服务器配置检查

确保MySQL配置文件（my.cnf或my.ini）中的配置允许远程访问：

```ini
# 在 [mysqld] 部分确保有以下配置
bind-address = 0.0.0.0  # 允许任何IP访问
# 或者
# bind-address = 127.0.0.1  # 只允许本地访问
```

### 方案四：使用改进的云函数代码

1. 备份原始的 `index.js` 文件
2. 将 `index.debug.js` 重命名为 `index.js`
3. 重新部署云函数

新版本包含：
- 详细的调试信息
- 更好的错误处理
- 连接超时设置
- 用户友好的错误提示

### 方案五：临时解决方案

如果暂时无法修复数据库权限，可以考虑：

#### 1. 使用微信云开发数据库作为临时替代
```javascript
// 修改云函数，暂时跳过MySQL连接
async function getMysql() {
  console.log('⚠️ 使用临时模式：跳过MySQL连接');
  return null;
}
```

#### 2. 添加错误重试机制
```javascript
// 在云函数中添加重试逻辑
async function getMysqlWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getMysql();
    } catch (error) {
      console.log(`重试 ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('数据库连接失败，已达到最大重试次数');
}
```

## 验证修复

### 1. 测试数据库连接
使用调试脚本验证连接是否正常：
```bash
node debug_database_connection.js
```

### 2. 重新部署云函数
1. 在微信云开发控制台中重新部署 `wechatLogin` 云函数
2. 确保环境变量正确设置
3. 测试小程序登录功能

### 3. 检查云函数日志
在云函数控制台中查看详细日志：
- 连接状态
- 错误信息
- 执行时间

## 常见问题

### Q: 为什么之前可以连接，现在不行了？
A: 可能的原因：
- 数据库服务器重启
- 用户权限被修改
- 防火墙规则变更
- 云函数部署环境变更

### Q: 如何确保数据库安全？
A: 安全建议：
- 使用强密码
- 限制特定IP访问
- 定期更新密码
- 启用SSL连接
- 定期备份数据

### Q: 还是有问题怎么办？
A: 进一步调试：
1. 检查MySQL服务器日志
2. 使用telnet测试端口连通性
3. 联系数据库管理员
4. 使用调试脚本获取更多信息

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 错误完整日志
2. 数据库配置信息（隐藏密码）
3. 云函数环境变量配置
4. 调试脚本的输出结果

---

*最后更新：2024-11-26*
*版本：1.0*