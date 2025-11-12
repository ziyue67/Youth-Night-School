const cloud = require('wx-server-sdk')
const mysql = require('mysql2/promise')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

async function getMysql() {
  const host = process.env.MYSQL_HOST
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE
  if (!host || !user || !password || !database) return null
  const conn = await mysql.createConnection({ host, port, user, password, database })
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, unionid VARCHAR(64) DEFAULT NULL, nick_name VARCHAR(100) DEFAULT NULL, avatar_url VARCHAR(255) DEFAULT NULL, phone VARCHAR(32) DEFAULT NULL, points INT DEFAULT 0, create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid (openid))'
  )
  await conn.execute(
    'CREATE TABLE IF NOT EXISTS sign_logs (id INT PRIMARY KEY AUTO_INCREMENT, openid VARCHAR(64) NOT NULL, sign_date DATE NOT NULL, points INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_openid_date (openid, sign_date))'
  )
  return conn
}

exports.main = async (event, context) => {
  const db = cloud.database()
  const conn = await getMysql()
  if (!conn) return { success: false, error: '数据库未配置' }

  let usersMigrated = 0
  let logsMigrated = 0

  let offset = 0
  const limit = 100
  for (;;) {
    const res = await db.collection('users').orderBy('_id', 'asc').skip(offset).limit(limit).get()
    if (!res.data.length) break
    for (const u of res.data) {
      const openid = u._openid || u.openid || ''
      const unionid = u._unionid || u.unionid || null
      const nick = u.nickName || u.nick_name || null
      const avatar = u.avatarUrl || u.avatar_url || null
      const phone = u.phoneNumber || u.phone || null
      const points = typeof u.points === 'number' ? u.points : 0
      await conn.execute(
        'INSERT INTO users (openid, unionid, nick_name, avatar_url, phone, points, create_time, last_login_time) VALUES (?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE unionid=VALUES(unionid), nick_name=VALUES(nick_name), avatar_url=VALUES(avatar_url), phone=VALUES(phone), points=VALUES(points)'
        , [openid, unionid, nick, avatar, phone, points]
      )
      usersMigrated += 1
    }
    offset += res.data.length
  }

  offset = 0
  for (;;) {
    const res = await db.collection('sign_logs').orderBy('_id', 'asc').skip(offset).limit(limit).get()
    if (!res.data.length) break
    for (const l of res.data) {
      const openid = l._openid || l.openid || ''
      const signDate = l.sign_date || (l.date ? new Date(l.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
      const points = typeof l.points === 'number' ? l.points : 0
      await conn.execute(
        'INSERT IGNORE INTO sign_logs (openid, sign_date, points) VALUES (?,?,?)'
        , [openid, signDate, points]
      )
      logsMigrated += 1
    }
    offset += res.data.length
  }

  await conn.end()
  return { success: true, usersMigrated, logsMigrated }
}