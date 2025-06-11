// evaluation.js
// 引入学习进度模块，如果存在
try {
  const { addLearnProgress } = require('../../utils/learnProgress');
} catch (error) {
  console.log('学习进度模块未找到');
}

// 导入通用录音管理器
const recordingManager = require('../../utils/recordingManager');

// 导入发音工具以获取语言检测功能
const pronunciationUtil = require('../../utils/pronunciation');

// 递归FFT实现，用于频谱分析
function fftReIm(real, imag) {
  const n = real.length;
  
  // 安全性检查
  if (n <= 1) return;
  if (n !== imag.length) {
    console.error('FFT错误: real和imag数组长度不一致');
    return;
  }
  
  // 确保n是2的幂
  if ((n & (n - 1)) !== 0) {
    console.error('FFT错误: 数组长度不是2的幂');
    return;
  }
  
  const half = n >> 1;
  const evenReal = new Float32Array(half);
  const evenImag = new Float32Array(half);
  const oddReal = new Float32Array(half);
  const oddImag = new Float32Array(half);
  
  for (let i = 0; i < half; i++) {
    evenReal[i] = real[i * 2];
    evenImag[i] = imag[i * 2];
    oddReal[i] = real[i * 2 + 1];
    oddImag[i] = imag[i * 2 + 1];
  }
  
  // 递归调用
  fftReIm(evenReal, evenImag);
  fftReIm(oddReal, oddImag);
  
  // 合并结果
  for (let i = 0; i < half; i++) {
    const angle = -2 * Math.PI * i / n;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tre = cos * oddReal[i] - sin * oddImag[i];
    const tim = sin * oddReal[i] + cos * oddImag[i];
    real[i] = evenReal[i] + tre;
    imag[i] = evenImag[i] + tim;
    real[i + half] = evenReal[i] - tre;
    imag[i + half] = evenImag[i] - tim;
  }
}

Page({
  data: {
    audioPath: '', // 录音文件路径
    content: '', // 用户输入的内容
    isPlaying: false, // 是否正在播放录音
    score: 0, // 评测得分
    scoreText: '', // 得分文本描述
    feedbackTips: [], // 评测反馈提示
    showSpectrogram: false, // 是否显示声谱图
    evaluationDone: false, // 评测是否完成
    innerAudioContext: null, // 音频播放上下文
    recording: false, // 是否正在录音
    aiResult: '', // AI分析结果
    loading: false, // 是否正在加载中
    ipaResult: '', // AI分析结果的国际音标
    pronunciationTips: [], // AI分析结果的发音要点
    recordTimeDisplay: '00:00', // 录音时间显示
    language: '' // 语言类型
  },

  onLoad: function(options) {
    // 获取页面参数
    const { audioPath, content } = options;
    
    console.log('evaluation页面接收到的参数:', options);
    console.log('接收到的音频路径:', audioPath);
    
    // 解码URL编码的参数
    const decodedAudioPath = audioPath ? decodeURIComponent(audioPath) : '';
    const decodedContent = content ? decodeURIComponent(content) : '';
    
    console.log('解码后的音频路径:', decodedAudioPath);
    
    // 检测语言（如果有内容）
    let language = '';
    if (decodedContent) {
      try {
        language = pronunciationUtil.detectLanguage(decodedContent);
      } catch (error) {
        console.error('语言检测失败:', error);
      }
    }
    
    // 初始化数据
    this.setData({
      audioPath: decodedAudioPath,
      content: decodedContent,
      language: language
    });
    
    // 初始化音频播放上下文
    this.initAudioContext();

    // 配置录音管理器回调
    this.setupRecordingCallbacks();
    
    // 如果有音频路径，初始执行评测
    if (this.data.audioPath) {
      console.log('开始处理传入的音频文件:', this.data.audioPath);
      
      // 确保路径格式正确
      const processedPath = this.ensureValidFilePath(this.data.audioPath);
      
      // 更新路径并处理
      this.setData({ audioPath: processedPath });
      this.initAudioContext(processedPath);
      
      // 如果有音频，分析声谱图
      this.analyzeSpectrogram(processedPath);
      this.runEvaluation();
    } else {
      console.log('未接收到音频路径，跳过声谱图分析');
      this.runEvaluation();
    }
  },
  
  // 确保文件路径格式正确
  ensureValidFilePath: function(path) {
    if (!path) return '';
    
    console.log('处理文件路径:', path);
    
    // 已经是本地路径，直接返回
    if (path.startsWith('wxfile://') || path.startsWith('/')) {
      return path;
    }
    
    // HTTP/HTTPS路径，会在analyzeSpectrogram中处理
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // 如果是相对路径，转换为绝对路径
    if (!path.includes('://') && !path.startsWith('/')) {
      return '/' + path;
    }
    
    return path;
  },
  
  // 配置录音回调函数
  setupRecordingCallbacks: function() {
    // 录音开始回调
    recordingManager.callbacks.onStart = () => {
      this.setData({ recording: true, showSpectrogram: false, evaluationDone: false });
    };
    
    // 录音时间更新回调
    recordingManager.callbacks.onTimeUpdate = (data) => {
      this.setData({ recordTimeDisplay: data.formattedTime });
    };
    
    // 录音结束回调
    recordingManager.callbacks.onStop = (res) => {
      this.setData({
        recording: false,
        audioPath: res.tempFilePath
      });
      
      // 更新音频播放上下文
      this.initAudioContext(res.tempFilePath);
      
      // 执行评测（仅在有录音结果时）
      if (res.tempFilePath) {
        // 分析声谱图
        this.analyzeSpectrogram(res.tempFilePath);
        this.runEvaluation();
      } else {
        wx.showToast({ title: 'Failed to save recording', icon: 'none' });
        this.runEvaluation(); // 仍然执行评测
      }
    };
    
    // 录音错误回调
    recordingManager.callbacks.onError = (err) => {
      wx.showToast({
        title: 'Recording failed',
        icon: 'none'
      });
      this.setData({ recording: false });
    };
  },
  
  // 初始化音频上下文
  initAudioContext: function(path) {
    // 如果已存在音频上下文，先销毁
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
    }
    
    // 创建新的音频上下文
    this.innerAudioContext = wx.createInnerAudioContext();
    
    // 设置音频源（如果提供了路径）
    if (path || this.data.audioPath) {
      this.innerAudioContext.src = path || this.data.audioPath;
    }
    
    // 监听播放结束事件
    this.innerAudioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
    
    // 监听错误事件
    this.innerAudioContext.onError((err) => {
      console.error('音频播放错误:', err);
      this.setData({ isPlaying: false });
      wx.showToast({ title: '音频播放失败', icon: 'none' });
    });
  },

  // 播放录音
  playRecording: function() {
    if (this.data.isPlaying) {
      this.innerAudioContext.pause();
      this.setData({
        isPlaying: false
      });
    } else {
      this.innerAudioContext.play();
      this.setData({
        isPlaying: true
      });
    }
  },

  // 开始录音
  startRecording() {
    const options = {
      duration: 60000,
      format: 'wav',
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      frameSize: 50
    };
    
    // 使用通用录音管理器
    recordingManager.start(options, {
      onStart: () => {
        this.setData({ recording: true, showSpectrogram: false, evaluationDone: false });
      }
    });
  },
  
  // 停止录音
  stopRecording() {
    recordingManager.stop();
  },

  // 使用AI分析发音并给出改进建议
  async getAIPronunciationAnalysis(content, score) {
    // 获取API密钥
    const llmApiKey = wx.getStorageSync('llmApiKey');
    
    // 如果没有API密钥，返回本地生成的提示并提醒用户
    if (!llmApiKey) {
      console.log('未设置LLM API密钥，使用本地生成的反馈');
      wx.showToast({
        title: 'Please configure API key in Settings',
        icon: 'none',
        duration: 2000
      });
      return { tips: this.getDefaultFeedback(score) };
    }

    try {
      // 构建提示词
      const prompt = `Analyze the pronunciation of the following text scored ${score}/100 and provide 5 concise suggestions:
- If score < 60: identify major pronunciation issues and recommend fundamental improvement steps.
- If score between 60 and 80: highlight specific corrections and encourage further practice.
- If score >= 80: offer nuanced refinement tips and positive encouragement.
Text: "${content}"`;

      // 获取应用实例以访问环境ID
      const app = getApp();
      const cloudEnvId = app && app.globalData ? app.globalData.cloudEnvId : cloud.DYNAMIC_CURRENT_ENV;
      
      console.log('评测页面调用LLM API，环境ID:', cloudEnvId);
      console.log('使用的提示词:', prompt.substring(0, 100) + '...');

      // 显示加载状态
      this.setData({ loading: true });
      
      // 调用云函数 processInput
      const response = await wx.cloud.callFunction({
        name: 'processInput',
        config: {
          env: cloudEnvId
        },
        data: {
          apiKey: llmApiKey,
          prompt: prompt,
          max_tokens: 1024,
          model: 'openai/gpt-3.5-turbo' // 使用较经济的模型，也可以使用gpt-4-turbo等更强大的模型
        }
      });
      
      // 隐藏加载状态
      this.setData({ loading: false });
      
      console.log('API响应:', response);
      
      // 检查是否有错误
      if (response.result && response.result.error) {
        console.error('API调用返回错误:', response.result.error);
        wx.showToast({
          title: 'Analysis failed: ' + response.result.error,
          icon: 'none',
          duration: 3000
        });
        return { tips: this.getDefaultFeedback(score) };
      }
      
      // 检查是否有有效响应
      if (response.result && response.result.choices && response.result.choices[0]) {
        const content = response.result.choices[0].message.content;
        console.log('AI响应内容:', content.substring(0, 200) + '...');
        
        // 保存原始AI分析结果
        this.setData({ aiResult: content });
        
        // 添加学习进度，如果存在该功能
        try {
          if (typeof addLearnProgress === 'function') {
            addLearnProgress();
          }
        } catch (error) {
          console.log('学习进度记录功能不可用');
        }
        
        // 直接使用AI返回的完整内容作为tips
        // 将内容按换行符分割成数组，便于前端显示
        const tips = content.split('\n').filter(line => line.trim().length > 0);
        
        return {
          ipa: '', // 不再提取国际音标
          tips: tips, // 将AI完整回应作为提示
          suggestions: [] // 不再需要单独的建议
        };
      }
      
      console.warn('API响应格式不符合预期，使用默认反馈');
      return { tips: this.getDefaultFeedback(score) };
    } catch (error) {
      console.error('AI分析请求失败:', error);
      this.setData({ loading: false });
      
      // 显示错误提示
      wx.showToast({
        title: 'Analysis failed, please try again later',
        icon: 'none',
        duration: 2000
      });
      
      // 出错时返回本地生成的提示
      return { tips: this.getDefaultFeedback(score) };
    }
  },

  // 获取默认的反馈建议
  getDefaultFeedback(score) {
    if (score >= 90) {
      return [
        'Pronunciation is excellent and natural.',
        'Keep up the great work! Try more complex phrases.'
      ];
    } else if (score >= 80) {
      return [
        'Pronunciation is accurate; minor adjustments needed.',
        'Focus on tongue placement and mouth shape.'
      ];
    } else if (score >= 70) {
      return [
        'Some pronunciation errors detected; improvement advised.',
        'Pay attention to tone variation and breath control.',
        'Practice slowly to build accuracy before speed.'
      ];
    } else {
      return [
        'Pronunciation has significant issues; systematic practice required.',
        'Start by mastering individual syllables.',
        'Focus on relaxing and controlling your mouth muscles.',
        'Listen to native pronunciation and imitate thoroughly.'
      ];
    }
  },

  // 生成声谱图
  analyzeSpectrogram(filePath) {
    wx.showLoading({ title: 'Analyzing spectrogram...' });
    
    // 检查是否为HTTP/HTTPS链接
    if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
      console.log('检测到HTTP链接，正在下载文件:', filePath);
      // 先下载文件到本地
      wx.downloadFile({
        url: filePath,
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('文件下载成功，本地路径:', res.tempFilePath);
            // 使用下载后的本地路径进行分析
            this.processAudioFile(res.tempFilePath);
          } else {
            console.error('文件下载失败，状态码:', res.statusCode);
            wx.hideLoading();
            wx.showToast({ title: 'Failed to download audio', icon: 'none' });
            this.setData({ showSpectrogram: false });
          }
        },
        fail: (err) => {
          console.error('下载文件失败:', err);
          wx.hideLoading();
          wx.showToast({ title: 'Failed to download audio', icon: 'none' });
          this.setData({ showSpectrogram: false });
        }
      });
    } else {
      // 本地文件路径，直接处理
      this.processAudioFile(filePath);
    }
  },
  
  // 处理音频文件并生成声谱图
  processAudioFile(filePath) {
    const fs = wx.getFileSystemManager();
    console.log('开始处理音频文件:', filePath);
    
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: res => {
        try {
          const arrayBuffer = wx.base64ToArrayBuffer(res.data);
          const dataView = new DataView(arrayBuffer);
          const headerBytes = 44;
          
          // 检查文件大小是否足够包含WAV头和数据
          if (dataView.byteLength <= headerBytes) {
            console.error('文件大小不足，无法解析WAV格式');
            wx.hideLoading();
            wx.showToast({ title: 'Audio format error', icon: 'none' });
            this.setData({ showSpectrogram: false });
            return;
          }
          
          // 计算可以安全读取的样本数量
          const maxPossibleSamples = Math.floor((dataView.byteLength - headerBytes) / 2);
          const sampleCount = maxPossibleSamples;
          console.log('音频样本数量:', sampleCount, '总字节数:', dataView.byteLength);
          
          const samples = new Float32Array(sampleCount);
          for (let i = 0; i < sampleCount; i++) {
            // 确保不会越界
            if (headerBytes + i * 2 + 1 < dataView.byteLength) {
              samples[i] = dataView.getInt16(headerBytes + i * 2, true) / 32768;
            } else {
              console.warn('遇到越界索引，停止处理:', headerBytes + i * 2, '总字节数:', dataView.byteLength);
              break; // 到达边界，停止处理
            }
          }
          const fftSize = 64;
          const hopSize = 32;
          // 确保有足够的样本进行FFT处理
          if (samples.length < fftSize) {
            console.error('音频样本数量不足，无法执行FFT处理');
            wx.hideLoading();
            wx.showToast({ title: '音频太短，无法分析', icon: 'none' });
            this.setData({ showSpectrogram: false });
            return;
          }
          
          const frames = Math.floor((samples.length - fftSize) / hopSize) + 1;
          const bins = fftSize / 2;
          const spectrogramData = [];
          for (let f = 0; f < frames; f++) {
            const real = new Float32Array(fftSize);
            const imag = new Float32Array(fftSize);
            const start = f * hopSize;
            
            // 检查此帧是否有足够的样本
            if (start + fftSize > samples.length) {
              console.warn('无法处理完整FFT帧，停止处理');
              break;
            }
            
            for (let j = 0; j < fftSize; j++) {
              const win = 0.5 * (1 - Math.cos((2 * Math.PI * j) / (fftSize - 1)));
              real[j] = samples[start + j] * win;
              imag[j] = 0;
            }
            fftReIm(real, imag);
            const mags = new Float32Array(bins);
            for (let j = 0; j < bins; j++) {
              mags[j] = Math.sqrt(real[j] * real[j] + imag[j] * imag[j]);
            }
            spectrogramData.push(mags);
          }
          const ctx = wx.createCanvasContext('spectrogram');
          const width = 300;
          const height = 150;
          for (let x = 0; x < spectrogramData.length; x++) {
            for (let y = 0; y < bins; y++) {
              const mag = spectrogramData[x][y];
              const db = 20 * Math.log10(mag + 1e-8);
              const norm = (db + 100) / 100;
              // 限制灰度在 20-200 之间，避免过浅
              const minGray = 20;
              const maxGray = 200;
              const c = Math.floor(norm * (maxGray - minGray) + minGray);
              ctx.setFillStyle(`rgb(${c},${c},${c})`);
              ctx.fillRect(x * (width / spectrogramData.length), height - (y * (height / bins)), width / spectrogramData.length, height / bins);
            }
          }
          ctx.draw();
          wx.hideLoading();
          
          // 确保成功生成声谱图数据
          if (spectrogramData.length === 0) {
            console.warn('无法生成声谱图数据');
            this.setData({ showSpectrogram: false });
            wx.showToast({ title: 'Unable to generate spectrogram', icon: 'none' });
            return;
          }
          
          this.setData({ showSpectrogram: true });
        } catch (error) {
          console.error('处理音频数据时出错:', error);
          wx.hideLoading();
          wx.showToast({ title: '音频处理失败', icon: 'none' });
          this.setData({ showSpectrogram: false });
        }
      },
      fail: (err) => {
        console.error('读取文件失败:', err);
        wx.hideLoading();
        wx.showToast({ title: 'Failed to read audio', icon: 'none' });
        this.setData({ showSpectrogram: false });
      }
    });
  },

  // 模拟评测过程
  async runEvaluation() {
    wx.showLoading({
      title: 'Evaluating...',
    });
    
    try {
      // 检查或重新检测语言（如果尚未设置）
      if (!this.data.language && this.data.content) {
        try {
          const language = pronunciationUtil.detectLanguage(this.data.content);
          this.setData({ language });
        } catch (error) {
          console.error('语言检测失败:', error);
        }
      }
      
      // 模拟生成一个随机分数（60-100之间）
      const score = Math.floor(Math.random() * 41) + 60;
      
      // 根据分数生成文本描述
      let scoreText = '';
      
      if (score >= 90) {
        scoreText = 'Excellent';
      } else if (score >= 80) {
        scoreText = 'Good';
      } else if (score >= 70) {
        scoreText = 'Fair';
      } else {
        scoreText = 'Needs Improvement';
      }
      
      // 使用AI分析发音并给出改进建议
      const aiAnalysis = await this.getAIPronunciationAnalysis(this.data.content, score);
      
      this.setData({
        score,
        scoreText,
        ipaResult: aiAnalysis.ipa || '',
        pronunciationTips: aiAnalysis.tips || [],
        feedbackTips: aiAnalysis.suggestions || aiAnalysis.tips || [],
        evaluationDone: true
      });
      
      wx.hideLoading();
    } catch (error) {
      console.error('评测过程出错:', error);
      
      // 使用默认反馈
      const score = Math.floor(Math.random() * 41) + 60;
      const scoreText = score >= 90 ? 'Excellent' : (score >= 80 ? 'Good' : (score >= 70 ? 'Fair' : 'Needs Improvement'));
      const feedbackTips = this.getDefaultFeedback(score);
      
      this.setData({
        score,
        scoreText,
        ipaResult: '',
        pronunciationTips: [],
        feedbackTips,
        evaluationDone: true
      });
      
      wx.hideLoading();
    }
  },

  // 查看声谱图详情
  viewSpectrogram: function() {
    // 放大预览声谱图
    wx.canvasToTempFilePath({
      canvasId: 'spectrogram',
      success: (res) => {
        wx.previewImage({
          urls: [res.tempFilePath],
          current: res.tempFilePath
        });
      },
      fail: (err) => {
        console.error('获取声谱图失败:', err);
        wx.showToast({
          title: 'Preview failed',
          icon: 'none'
        });
      }
    });
  },

  // 返回学习页面
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 重新录制
  reRecord: function() {
    this.startRecording();
  },

  onUnload: function() {
    // 页面卸载时释放资源
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
    }
    
    // 重置录音管理器回调
    recordingManager.callbacks = {
      onStart: null,
      onStop: null,
      onError: null,
      onTimeUpdate: null
    };
  }
}) 