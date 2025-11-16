const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getConn() {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 21639;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !password || !database) throw new Error('数据库未配置');
  return mysql.createConnection({ host, port, user, password, database, dateStrings: true });
}

function pickTables(college) {
  let map = {};
  try { map = JSON.parse(process.env.COURSE_TABLE_MAP || '{}'); } catch (e) { map = {}; }
  const fallback = (process.env.COURSE_TABLE || 'courses').replace(/`/g, '').trim();
  let values = [];
  const addVal = (val) => {
    if (!val) return;
    if (Array.isArray(val)) { values = values.concat(val); }
    else { values.push(val); }
  };
  addVal(map[college]);
  if (values.length === 0) {
    const norm = String(college).replace(/\s+/g, '');
    for (const k of Object.keys(map)) {
      if (String(k).replace(/\s+/g, '') === norm) addVal(map[k]);
    }
  }
  if (values.length === 0) {
    const norm = String(college).replace(/\s+/g, '');
    for (const k of Object.keys(map)) {
      const kk = String(k).replace(/\s+/g, '');
      if (kk.startsWith(norm) || kk.includes(norm)) addVal(map[k]);
    }
  }
  if (values.length === 0) values = [fallback];
  return values.map(n => String(n).replace(/`/g, '').replace(/\s+/g, ' ').trim());
}

function normalizeCollege(name) {
  const alias = {
    '社会发展与公共教育学院': '社会发展学院'
  };
  return alias[name] || name;
}

exports.main = async (event) => {
  const { action, college, month } = event;
  try {
    const conn = await getConn();
    const normalizedCollege = normalizeCollege(college);
    const tables = pickTables(normalizedCollege);
    if (action === 'months') {
      const set = new Set();
      for (const t of tables) {
        try {
          const [rows] = await conn.execute(`SELECT DISTINCT month FROM \`${t}\` WHERE college=? ORDER BY month`, [normalizedCollege]);
          for (const r of rows) set.add(Number(r.month));
        } catch (e) {}
      }
      await conn.end();
      const months = Array.from(set).sort((a,b)=>a-b);
      return { success: true, months };
    }
    if (action === 'list') {
      let all = [];
      for (const t of tables) {
        try {
          const [rows] = await conn.execute(
            `SELECT id, title, week, TIME_FORMAT(time_start, "%H:%i") AS ts, TIME_FORMAT(time_end, "%H:%i") AS te, status FROM \`${t}\` WHERE college=? AND month=? ORDER BY week, time_start`,
            [normalizedCollege, Number(month)]
          );
          all = all.concat(rows);
        } catch (e) {}
      }
      await conn.end();
      const courses = all.map(r => ({ id: r.id, name: r.title, time: `${r.week} ${r.ts}-${r.te}`, teacher: '', status: r.status || 'available' }));
      return { success: true, courses };
    }
    await conn.end();
    return { success: false, error: '未知操作' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

