// pages/add/add.js
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
    index: '',
    array: []
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  bindPickerChange: function (e) {
    var index = e.detail.value
    this.setData({
      index: index,
    })
  },
  addBtn: function () {
    var type = this.data.array[this.data.index].type
    console.log('添加数据，类型：', type)
    wx.cloud.callFunction({
      data: {
        type: type,
        name: this.data.inputValue
      },
      name: "addData",
      success: (res) => {
        console.log('添加成功：', res)
        wx.showToast({
          icon: 'none',
          title: '添加成功'
        })
        this.setData({
          index: '',
          inputValue: ''
        })
      },
      fail(err) {
        console.error("添加失败：", err)
        wx.showToast({
          icon: 'none',
          title: '添加失败，请重试'
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      inputValue: options.name || ''
    })
    console.log('页面加载，参数：', options)
    var that = this
    wx.cloud.callFunction({
      name: "getList",
      success(res) {
        console.log('获取列表成功：', res)
        that.setData({
          array: res.result.data,
        })
      },
      fail(err) {
        console.error("获取列表失败：", err)
        wx.showToast({
          icon: 'none',
          title: '获取列表失败，请重试'
        })
      }
    })
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