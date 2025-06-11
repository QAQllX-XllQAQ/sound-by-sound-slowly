// 云函数入口文件
const cloud = require('wx-server-sdk')
// 初始化
cloud.init() // 使用默认环境

// 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('云函数addData被调用，参数：', event)
  try {
    const result = await db.collection('list').add({
      data: {
        type: event.type,
        name: event.name,
        createTime: db.serverDate() // 添加创建时间
      }
    })
    console.log('添加结果：', result)
    return result
  } catch (error) {
    console.error('添加出错：', error)
    return {
      errMsg: error.message
    }
  }
}