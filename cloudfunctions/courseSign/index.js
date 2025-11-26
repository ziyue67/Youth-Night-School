// 云函数入口文件
const cloud = require('wx-server-sdk')
const { db } = require('@cloudbase/database')  // 正确引入数据库 SDK，无任何路径

// 初始化云环境（必须替换为你的云环境ID！）
// 云环境ID获取：云开发控制台 → 设置 → 环境ID
cloud.init({
  env: 'cloud1-9go506hg40673425'  // 示例：env: 'cloud-xxx-123456'，不要留空！
})

// 云函数主逻辑
exports.main = async (event, context) => {
  try {
    // 测试数据库连接（替换为你的集合名，比如 'signList'）
    const collection = db.collection('sign_logs')
    const res = await collection.get()  // 查询集合数据
    
    return {
      success: true,
      data: res.data,
      errMsg: '云函数执行成功'
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    }
  }
}