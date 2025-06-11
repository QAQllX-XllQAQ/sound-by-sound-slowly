// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init() // 使用默认环境

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取当前环境信息
    const { ENV_ID } = cloud.DYNAMIC_CURRENT_ENV
    
    // 返回环境列表
    return {
      envList: [{
        envId: ENV_ID,
        alias: '默认环境'
      }]
    }
  } catch (error) {
    console.error(error)
    return {
      envList: []
    }
  }
} 