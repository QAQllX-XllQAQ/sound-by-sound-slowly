// learning.js
// 导入发音工具
const pronunciationUtil = require('../../utils/pronunciation');

// 导入通用录音管理器
const recordingManager = require('../../utils/recordingManager');

Page({
  data: {
    inputContent: '', // 用户输入的单词或句子
    showResult: false, // 是否显示结果区域
    showRecord: false, // 是否显示录音区域
    isRecording: false, // 是否正在录音
    recordTime: 0, // 录音时长
    recordTimeDisplay: '00:00', // 录音时长显示
    language: '', // 检测到的语言类型
    pinyin: '', // 拼音
    ipa: '', // 国际音标
    pronunciationTips: [], // 发音技巧数组
    recordFilePath: '', // 录音文件路径
    isSimplifiedMode: false, // 是否使用简化模式
    toneDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // 声调分布
    tonePercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } // 声调百分比
  },

  onLoad: function() {
    console.log('learning页面加载');
    
    // 清理旧录音文件
    try {
      recordingManager.cleanupOldRecordings(5);
    } catch (error) {
      console.error('清理旧录音文件失败:', error);
    }
    
    // 设置录音管理器回调
    this.setupRecordingCallbacks();
  },

  // 配置录音回调函数
  setupRecordingCallbacks: function() {
    console.log('设置录音回调');
    // 监听录音状态变化
    recordingManager.callbacks.onStart = () => {
      console.log('learning页面：录音开始回调触发');
      this.setData({
        isRecording: true,
        recordTime: 0,
        recordTimeDisplay: '00:00'
      });
    };
    
    // 监听录音时间更新
    recordingManager.callbacks.onTimeUpdate = (data) => {
      this.setData({
        recordTime: data.currentTime,
        recordTimeDisplay: data.formattedTime
      });
    };
    
    // 监听录音结束
    recordingManager.callbacks.onStop = (res) => {
      console.log('learning页面：录音结束回调触发', res);
      const tempFilePath = res.tempFilePath;
      
      this.setData({
        recordFilePath: tempFilePath,
        isRecording: false,
        showRecord: false
      });
      
      // 跳转到评测页面，使用encodeURIComponent确保URL中的特殊字符被正确处理
      const encodedPath = encodeURIComponent(tempFilePath);
      const encodedContent = encodeURIComponent(this.data.inputContent);
      
      wx.navigateTo({
        url: `/pages/evaluation/evaluation?audioPath=${encodedPath}&content=${encodedContent}`
      });
    };
    
    // 监听录音错误
    recordingManager.callbacks.onError = (err) => {
      console.error('learning页面：录音错误', err);
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      });
      this.setData({
        isRecording: false
      });
    };
  },

  // 输入内容变化
  onInputChange: function(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 提交输入内容
  submitContent: function() {
    if (!this.data.inputContent.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '处理中...',
    });
    
    try {
      const content = this.data.inputContent;
      
      // 使用异步的generatePronunciationGuide生成完整发音指南
      pronunciationUtil.generatePronunciationGuide(content)
        .then(guide => {
          // 计算声调百分比
          const tonePercentages = this.calculateTonePercentages(guide.toneDistribution);
          
          // 更新页面数据
          this.setData({
            language: guide.language,
            pinyin: guide.pinyin,
            ipa: guide.ipa,
            pronunciationTips: guide.tips,
            toneDistribution: guide.toneDistribution,
            tonePercentages: tonePercentages,
            showResult: true,
            isSimplifiedMode: false
          });
          
          wx.hideLoading();
        })
        .catch(error => {
          console.error('处理输入内容出错:', error);
          // 降级处理
          this.fallbackProcess();
        });
    } catch (error) {
      console.error('处理输入内容出错:', error);
      
      // 降级处理
      this.fallbackProcess();
    }
  },
  
  // 计算声调百分比
  calculateTonePercentages: function(toneDistribution) {
    const tonePercentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = Object.values(toneDistribution).reduce((sum, count) => sum + count, 0);
    
    if (total > 0) {
      for (let tone = 1; tone <= 5; tone++) {
        tonePercentages[tone] = Math.round((toneDistribution[tone] / total) * 100);
      }
    }
    
    return tonePercentages;
  },
  
  // 检测语言类型 - 使用pronunciation工具
  detectLanguage: function(text) {
    return pronunciationUtil.detectLanguage(text);
  },
  
  // 生成普通话发音提示 - 使用pronunciation工具
  generateMandarinTips: function(text) {
    return pronunciationUtil.generateMandarinTips(text);
  },
  
  // 生成英语发音提示 - 使用pronunciation工具
  generateEnglishTips: function(text) {
    return pronunciationUtil.generateEnglishTips(text);
  },
  
  // 降级处理方法（当转换出错时使用）
  fallbackProcess: function() {
    const content = this.data.inputContent;
    wx.showLoading({ title: 'Processing...' });
    pronunciationUtil.generatePronunciationGuide(content)
      .then(guide => {
        const tonePercentages = this.calculateTonePercentages(guide.toneDistribution);
        this.setData({
          language: guide.language,
          pinyin: guide.pinyin,
          ipa: guide.ipa,
          pronunciationTips: guide.tips,
          toneDistribution: guide.toneDistribution,
          tonePercentages: tonePercentages,
          showResult: true,
          isSimplifiedMode: true
        });
        wx.hideLoading();
      })
      .catch(error => {
        console.error('Fallback guide generation failed:', error);
        const language = this.detectLanguage(content);
        this.setData({
          language: language,
          pinyin: content,
          ipa: '',
          pronunciationTips: ['Unable to generate guide, try simpler input'],
          toneDistribution: {1:0,2:0,3:0,4:0,5:0},
          tonePercentages: {1:0,2:0,3:0,4:0,5:0},
          showResult: true,
          isSimplifiedMode: true
        });
        wx.hideLoading();
      });
  },

  // 开始学习（展示录音界面）
  startLearnPhase: function() {
    this.setData({
      showRecord: true
    });
  },
  
  // 开始录音
  startRecording: function() {
    console.log('learning页面：开始录音');
    // 确保之前的录音已停止
    if (this.data.isRecording) {
      console.log('已经在录音，先停止');
      recordingManager.stop();
      
      // 短暂延迟后再开始新录音
      setTimeout(() => {
        this._doStartRecording();
      }, 300);
    } else {
      this._doStartRecording();
    }
  },
  
  // 实际执行开始录音
  _doStartRecording: function() {
    const options = {
      duration: 60000, // 最长录音时间（60s）
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 48000, // 编码码率
      format: 'wav', // 修改为WAV格式以适配声谱图分析
      frameSize: 50 // 指定帧大小
    };
    
    console.log('开始录音，配置:', options);
    
    // 使用录音管理器
    recordingManager.start(options);
  },
  
  // 停止录音
  stopRecording: function() {
    console.log('learning页面：停止录音');
    if (this.data.isRecording) {
      recordingManager.stop();
      
      // 添加备用超时处理，防止回调未触发
      setTimeout(() => {
        if (this.data.isRecording) {
          console.log('录音停止回调未触发，强制更新状态');
          this.setData({
            isRecording: false
          });
          // 强制重置录音管理器状态
          recordingManager.reset();
        }
      }, 1000);
    } else {
      console.warn('没有正在进行的录音');
    }
  },
  
  // 取消录音
  cancelRecording: function() {
    console.log('learning页面：取消录音');
    recordingManager.cancel();
    
    this.setData({
      showRecord: false,
      isRecording: false
    });
  },
  
  onHide: function() {
    console.log('learning页面隐藏');
    // 页面隐藏时如果还在录音，停止录音
    if (this.data.isRecording) {
      console.log('页面隐藏时停止录音');
      recordingManager.stop();
    }
  },
  
  onUnload: function() {
    console.log('learning页面卸载');
    // 页面卸载时如果还在录音，停止录音
    if (this.data.isRecording) {
      console.log('页面卸载时停止录音');
      recordingManager.stop();
    }
    
    // 页面卸载时重置录音管理器回调，避免影响其他页面
    recordingManager.callbacks = {
      onStart: null,
      onStop: null,
      onError: null,
      onTimeUpdate: null
    };
  }
}) 