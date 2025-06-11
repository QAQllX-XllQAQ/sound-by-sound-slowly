// settings.js
Page({
  data: {
    // API配置
    llmApiKey: '',
    iflyApiKey: '',
    facefusionApiKey: '',
    // 用户头像
    userAvatarUrl: '',
    // 保存状态
    saved: false
  },

  onLoad: function() {
    // 加载已保存的API密钥和头像信息
    this.loadAPIKeys();
    this.loadUserAvatar();
  },

  onShow: function() {
    // 重置保存状态
    this.setData({
      saved: false
    });
  },

  // 加载API密钥
  loadAPIKeys: function() {
    const llmApiKey = wx.getStorageSync('llmApiKey') || '';
    const iflyApiKey = wx.getStorageSync('iflyApiKey') || '';
    const facefusionApiKey = wx.getStorageSync('facefusionApiKey') || '';
    
    this.setData({
      llmApiKey,
      iflyApiKey,
      facefusionApiKey
    });
  },

  // 加载用户头像
  loadUserAvatar: function() {
    const userAvatarUrl = wx.getStorageSync('userAvatarUrl') || '';
    
    this.setData({
      userAvatarUrl
    });
  },

  // 选择用户头像
  chooseUserAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取选择的图片临时路径
        const tempFilePath = res.tempFilePaths[0];
        
        // 显示图片裁剪框
        this.cropUserAvatar(tempFilePath);
      }
    });
  },

  // 裁剪用户头像
  cropUserAvatar: function(tempFilePath) {
    wx.navigateTo({
      url: `/pages/settings/crop-avatar/crop-avatar?src=${tempFilePath}`,
      events: {
        // 接收裁剪后的图片路径
        cropComplete: (data) => {
          if (data && data.tempFilePath) {
            // 保存临时文件到本地，避免临时文件被删除
            this.saveAvatarToStorage(data.tempFilePath);
          }
        }
      }
    });
  },

  // 保存头像到本地存储
  saveAvatarToStorage: function(tempFilePath) {
    // 获取本地文件管理器
    const fs = wx.getFileSystemManager();
    
    try {
      // 生成本地文件路径，将临时文件转为本地文件
      const localPath = `${wx.env.USER_DATA_PATH}/user_avatar_${Date.now()}.jpg`;
      
      // 拷贝临时文件到本地存储
      fs.copyFileSync(tempFilePath, localPath);
      
      // 更新状态并保存路径
      this.setData({
        userAvatarUrl: localPath
      });
      
      // 显示提示
      wx.showToast({
        title: '头像已更新',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存头像失败:', error);
      
      // 如果无法保存到本地文件，则直接使用临时路径
      this.setData({
        userAvatarUrl: tempFilePath
      });
      
      wx.showToast({
        title: '头像已临时更新',
        icon: 'none'
      });
    }
  },

  // 输入框变化事件
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [field]: value
    });
  },

  // 保存设置
  saveAPIKeys: function() {
    const { llmApiKey, iflyApiKey, facefusionApiKey, userAvatarUrl } = this.data;
    
    // 保存到本地存储
    wx.setStorageSync('llmApiKey', llmApiKey);
    wx.setStorageSync('iflyApiKey', iflyApiKey);
    wx.setStorageSync('facefusionApiKey', facefusionApiKey);
    wx.setStorageSync('userAvatarUrl', userAvatarUrl);
    
    // 更新状态并显示提示
    this.setData({
      saved: true
    });
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
  },

  // 重置设置
  resetAPIKeys: function() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有API密钥和头像设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            llmApiKey: '',
            iflyApiKey: '',
            facefusionApiKey: '',
            userAvatarUrl: '',
            saved: false
          });
          
          // 清除本地存储
          wx.removeStorageSync('llmApiKey');
          wx.removeStorageSync('iflyApiKey');
          wx.removeStorageSync('facefusionApiKey');
          wx.removeStorageSync('userAvatarUrl');
          
          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  // 打开API说明
  openApiGuide: function() {
    // Simple modal explaining where to get and how to use API keys
    wx.showModal({
      title: 'API Configuration Guide',
      content: 'LLM API Key: used for generating pronunciation tips and feedback via GPT-4o-mini.\n\niFly API Key: used for pronunciation evaluation to analyze accuracy.\n\nFaceFusion API Key: used for face-driven lip simulation.',
      showCancel: false
    });
  }
}) 