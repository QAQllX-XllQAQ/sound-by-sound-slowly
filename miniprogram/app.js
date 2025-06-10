// app.js
App({
  globalData: {
    cloudEnvId: 'cloud1-7g0tl9gu3e0e6e0e' // 存储环境ID以便在其他地方使用
  },
  onLaunch: function() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnvId, // 使用存储在globalData中的环境ID
        traceUser: true
      });
      console.log('云环境初始化成功:', this.globalData.cloudEnvId);
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    }
  }
});
