// recordingManager.js - 通用录音工具

/**
 * 录音管理器工具类
 * 提供统一的录音功能，以便各页面复用
 */
class RecordingManager {
  constructor() {
    // 初始化数据
    this.isRecording = false;
    this.recordTime = 0;
    this.recordTimeDisplay = '00:00';
    this.recordFilePath = '';
    this.timer = null;
    
    // 获取微信录音管理器
    this.recorderManager = wx.getRecorderManager();
    
    // 默认录音配置
    this.defaultOptions = {
      duration: 60000, // 最长录音时间（60s）
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 48000, // 编码码率
      format: 'wav', // 音频格式
      frameSize: 50 // 指定帧大小
    };
    
    // 回调函数存储
    this.callbacks = {
      onStart: null,
      onStop: null,
      onError: null,
      onTimeUpdate: null
    };
    
    // 初始化录音事件监听
    this._initEventListeners();
    
    // 确保temp目录存在
    this._ensureTempDirExists();
  }
  
  /**
   * 确保临时目录存在
   * @private
   */
  _ensureTempDirExists() {
    const fs = wx.getFileSystemManager();
    try {
      // 尝试创建temp目录（如果不存在）
      fs.mkdirSync(`${wx.env.USER_DATA_PATH}/temp`, true);
      console.log('确保temp目录存在:', `${wx.env.USER_DATA_PATH}/temp`);
    } catch (error) {
      // 目录可能已存在，或者其他错误
      console.log('temp目录检查结果:', error);
    }
  }
  
  /**
   * 初始化录音事件监听
   * @private
   */
  _initEventListeners() {
    // 监听录音开始事件
    this.recorderManager.onStart(() => {
      console.log('录音开始');
      this.isRecording = true;
      this.recordTime = 0;
      this.recordTimeDisplay = '00:00';
      
      // 启动计时器
      this._startTimer();
      
      // 触发开始回调
      if (typeof this.callbacks.onStart === 'function') {
        this.callbacks.onStart();
      }
    });
    
    // 监听录音结束事件
    this.recorderManager.onStop((res) => {
      console.log('录音结束, 原始文件路径:', res.tempFilePath);
      this.isRecording = false;
      
      // 将录音文件保存到固定位置
      this._saveRecordingToTempDir(res.tempFilePath);
    });
    
    // 监听录音错误事件
    this.recorderManager.onError((err) => {
      console.error('录音错误:', err);
      this.isRecording = false;
      
      // 清除计时器
      this._clearTimer();
      
      // 触发错误回调
      if (typeof this.callbacks.onError === 'function') {
        this.callbacks.onError(err);
      }
    });
    
    // 监听录音中断事件
    this.recorderManager.onInterruptionBegin(() => {
      console.log('录音被中断');
      // 如有必要，可以在这里添加中断处理逻辑
    });
    
    // 监听录音中断结束事件
    this.recorderManager.onInterruptionEnd(() => {
      console.log('录音中断结束');
      // 如有必要，可以在这里添加中断恢复逻辑
    });
  }
  
  /**
   * 将录音文件保存到临时目录
   * @private
   */
  _saveRecordingToTempDir(tempFilePath) {
    const fs = wx.getFileSystemManager();
    // 生成带时间戳的文件名，确保唯一性
    const timestamp = new Date().getTime();
    const newFilePath = `${wx.env.USER_DATA_PATH}/temp/recording_${timestamp}.wav`;
    
    try {
      // 复制文件到新路径
      fs.copyFileSync(tempFilePath, newFilePath);
      console.log('录音文件已保存到:', newFilePath);
      
      // 更新文件路径
      this.recordFilePath = newFilePath;
      
      // 清除计时器
      this._clearTimer();
      
      // 触发结束回调
      if (typeof this.callbacks.onStop === 'function') {
        this.callbacks.onStop({
          tempFilePath: newFilePath
        });
      } else {
        console.warn('没有设置onStop回调函数');
      }
    } catch (error) {
      console.error('保存录音文件失败:', error);
      
      // 保存失败时仍使用原始路径
      this.recordFilePath = tempFilePath;
      
      // 清除计时器
      this._clearTimer();
      
      // 触发结束回调
      if (typeof this.callbacks.onStop === 'function') {
        this.callbacks.onStop({
          tempFilePath: tempFilePath
        });
      }
    }
  }
  
  /**
   * 启动录音计时器
   * @private
   */
  _startTimer() {
    // 先清除可能存在的旧计时器
    this._clearTimer();
    
    // 创建新计时器
    this.timer = setInterval(() => {
      this.recordTime += 1;
      const minutes = Math.floor(this.recordTime / 60).toString().padStart(2, '0');
      const seconds = (this.recordTime % 60).toString().padStart(2, '0');
      this.recordTimeDisplay = `${minutes}:${seconds}`;
      
      // 触发时间更新回调
      if (typeof this.callbacks.onTimeUpdate === 'function') {
        this.callbacks.onTimeUpdate({
          currentTime: this.recordTime,
          formattedTime: this.recordTimeDisplay
        });
      }
      
      // 超时自动停止（比设置的时间少1秒，确保不超出限制）
      if (this.recordTime >= 59) {
        this.stop();
      }
    }, 1000);
  }
  
  /**
   * 清除录音计时器
   * @private
   */
  _clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  /**
   * 开始录音
   * @param {Object} options - 录音选项，可覆盖默认设置
   * @param {Object} callbacks - 回调函数对象
   */
  start(options = {}, callbacks = {}) {
    try {
      // 如果已经在录音，先尝试停止
      if (this.isRecording) {
        console.log('已经在录音，先停止当前录音');
        this.recorderManager.stop();
        // 短暂延迟后再开始新录音
        setTimeout(() => {
          this._doStart(options, callbacks);
        }, 300);
      } else {
        this._doStart(options, callbacks);
      }
    } catch (error) {
      console.error('开始录音出错:', error);
      if (typeof callbacks.onError === 'function') {
        callbacks.onError(error);
      }
    }
  }
  
  /**
   * 实际执行开始录音的函数
   * @private
   */
  _doStart(options = {}, callbacks = {}) {
    // 合并选项
    const recordOptions = { ...this.defaultOptions, ...options };
    console.log('开始录音, 配置:', recordOptions);
    
    // 更新回调
    this.callbacks = { ...this.callbacks, ...callbacks };
    
    // 开始录音
    this.recorderManager.start(recordOptions);
  }
  
  /**
   * 停止录音
   */
  stop() {
    console.log('调用停止录音函数, 当前录音状态:', this.isRecording);
    try {
      if (this.isRecording) {
        console.log('正在停止录音...');
        this.recorderManager.stop();
      } else {
        console.warn('没有正在进行的录音');
      }
    } catch (error) {
      console.error('停止录音出错:', error);
      
      // 确保清除计时器和状态
      this._clearTimer();
      this.isRecording = false;
      
      // 触发错误回调
      if (typeof this.callbacks.onError === 'function') {
        this.callbacks.onError(error);
      }
    }
  }
  
  /**
   * 取消录音（停止录音但不触发成功回调）
   */
  cancel() {
    console.log('取消录音');
    this.stop();
    // 可以添加取消特定的逻辑
  }
  
  /**
   * 强制重置录音状态
   * 用于处理可能的状态不一致情况
   */
  reset() {
    console.log('重置录音状态');
    this._clearTimer();
    this.isRecording = false;
    this.recordTime = 0;
    this.recordTimeDisplay = '00:00';
    // 不清除录音文件路径，以免影响最后一次录音的使用
  }
  
  /**
   * 获取当前录音状态
   * @returns {Object} 录音状态对象
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      recordTime: this.recordTime,
      recordTimeDisplay: this.recordTimeDisplay,
      recordFilePath: this.recordFilePath
    };
  }
  
  /**
   * 获取录音文件路径
   * @returns {string} 录音文件路径
   */
  getRecordFilePath() {
    return this.recordFilePath;
  }
  
  /**
   * 清理录音文件
   * 删除temp目录下超过一定数量的旧录音文件
   */
  cleanupOldRecordings(maxFiles = 10) {
    const fs = wx.getFileSystemManager();
    try {
      // 获取temp目录下的所有录音文件
      const files = fs.readdirSync(`${wx.env.USER_DATA_PATH}/temp`);
      
      // 筛选出录音文件
      const recordingFiles = files.filter(file => file.startsWith('recording_') && file.endsWith('.wav'));
      
      // 如果数量超过最大值，删除最旧的文件
      if (recordingFiles.length > maxFiles) {
        // 按文件名排序（包含时间戳，所以可以按字母顺序排）
        recordingFiles.sort();
        
        // 删除最旧的文件，直到数量符合要求
        const filesToDelete = recordingFiles.slice(0, recordingFiles.length - maxFiles);
        
        filesToDelete.forEach(file => {
          const filePath = `${wx.env.USER_DATA_PATH}/temp/${file}`;
          try {
            fs.unlinkSync(filePath);
            console.log('删除旧录音文件:', filePath);
          } catch (e) {
            console.error('删除旧录音文件失败:', e);
          }
        });
      }
    } catch (error) {
      console.error('清理旧录音文件失败:', error);
    }
  }
}

// 创建单例实例
const recordingManager = new RecordingManager();

module.exports = recordingManager; 