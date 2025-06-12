// crop-avatar.js
Page({
  data: {
    src: '', // 图片源路径
    width: 250, // 裁剪框宽度
    height: 250, // 裁剪框高度
    scale: 1, // 图片缩放比例
    imageLoaded: false // 图片是否已加载
  },

  onLoad: function(options) {
    // 获取传入的图片路径
    if (options.src) {
      this.setData({
        src: options.src
      });

      // 获取设备信息以适配裁剪框大小（兼容新旧 API）
      let screenWidth = 0;
      if (wx.getWindowInfo) {
        // 新版获取窗口信息
        const winInfo = wx.getWindowInfo();
        screenWidth = winInfo.windowWidth;
      } else if (wx.getSystemInfoSync) {
        // 兼容旧版
        const sysInfo = wx.getSystemInfoSync();
        screenWidth = sysInfo.screenWidth;
      }
      // 裁剪框宽高为屏幕宽度的70%，且为正方形
      const cropSize = Math.floor(screenWidth * 0.7);
      this.setData({
        width: cropSize,
        height: cropSize
      });
    } else {
      // 没有提供图片，返回上一页
      wx.showToast({
        title: '无法获取图片',
        icon: 'none'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }
  },

  // 图片加载完成
  onImageLoad() {
    this.setData({
      imageLoaded: true
    });
    
    // 初始化裁剪框
    this.cropper = this.selectComponent('#imageCropper');
    this.cropper.imgReset();
  },

  // 取消裁剪并返回
  cancelCrop() {
    wx.navigateBack();
  },

  // 确认裁剪
  confirmCrop() {
    // 获取事件通道，向上一页回传结果
    const eventChannel = this.getOpenerEventChannel();
    // 如果裁剪组件未初始化，则直接返回原始图片路径
    if (!this.cropper) {
      eventChannel.emit('cropComplete', { tempFilePath: this.data.src });
      wx.navigateBack();
      return;
    }
    // 显示加载提示
    wx.showLoading({ title: '处理中...' });
    // 执行裁剪，获取裁剪后的图片临时路径
    this.cropper.getImg((res) => {
      if (res && res.tempFilePath) {
        // 压缩图片，减小尺寸
        this.compressImage(res.tempFilePath);
      } else {
        wx.hideLoading();
        wx.showToast({ title: '裁剪失败', icon: 'none' });
      }
    });
  },

  // 压缩图片
  compressImage(tempFilePath) {
    // 压缩图片，减小尺寸
    wx.compressImage({
      src: tempFilePath,
      quality: 80, // 压缩质量
      success: (res) => {
        wx.hideLoading();
        
        // 通过事件回调给上一页面
        eventChannel.emit('cropComplete', { tempFilePath: res.tempFilePath });
        
        // 返回上一页
        wx.navigateBack();
      },
      fail: () => {
        wx.hideLoading();
        
        // 如果压缩失败，使用原图
        eventChannel.emit('cropComplete', { tempFilePath });
        
        // 返回上一页
        wx.navigateBack();
      }
    });
  },

  // 放大图片
  zoomIn() {
    if (this.cropper) {
      this.cropper.scaleImg(0.1);
    }
  },

  // 缩小图片
  zoomOut() {
    if (this.cropper) {
      this.cropper.scaleImg(-0.1);
    }
  },

  // 旋转图片
  rotateImage() {
    if (this.cropper) {
      this.cropper.imgRotate();
    }
  }
}) 