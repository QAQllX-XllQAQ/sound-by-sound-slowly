// pages/home/home.js
const { envList } = require('../../envList.js')

// 初始化云开发
if (!wx.cloud) {
  console.error('请使用 2.2.3 或以上的基础库以使用云能力');
} else {
  wx.cloud.init({
    env: envList[0].envId,
    traceUser: true,
  });
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '',
    noData: true,
    left: ''
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  toAdd: function () {
    wx.navigateTo({
      url: '/pages/add/add?name=' + this.data.inputValue
    })
  },
  queryData() {
    if (!this.data.inputValue) {
      wx.showToast({
        icon: 'none',
        title: '请输入垃圾名称'
      })
      return
    }

    console.log('开始查询数据，输入值：', this.data.inputValue)
    var that = this
    wx.cloud.callFunction({
      data: {
        name: this.data.inputValue
      },
      name: "query",
      success(res) {
        console.log('查询成功，结果：', res)
        // 写死的值
        var arr = ['-20rpx', '-366rpx', '-685rpx', '-1020rpx']
        if (res.result && res.result.data && res.result.data.length > 0) {
          that.setData({
            noData: false,
            left: arr[res.result.data[0].type * 1 - 1]
          })
        } else {
          that.setData({
            noData: true
          })
        }
      },
      fail(err) {
        console.error("查询失败：", err)
        wx.showToast({
          icon: 'none',
          title: '查询失败，请重试'
        })
      }
    })
  },
  //-20rpx, -366,-685rpx,-1020rpx

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})