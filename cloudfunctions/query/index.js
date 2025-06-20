// 云函数入口文件
const cloud = require('wx-server-sdk')
// 初始化
cloud.init() // 使用默认环境

// 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('云函数query被调用，参数：', event)
  try {
    const result = await db.collection('list').where({
      name: event.name
    }).get()
    console.log('查询结果：', result)
    return result
  } catch (error) {
    console.error('查询出错：', error)
    return {
      data: [],
      errMsg: error.message
    }
  }
}