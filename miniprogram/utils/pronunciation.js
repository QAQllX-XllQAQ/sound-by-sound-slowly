// pronunciation.js - 发音工具库
// 导入拼音转换工具
const { pinyin } = require('./chineseToPinyin');

// 导入库加载器 - 同时获取拼音字典数据
const { 
  pinyinPro, 
  IPATranslator, 
  pinyinDict, 
  pinyinDictWithoutTone
} = require('./libraryLoader');

/**
 * 使用大语言模型API生成发音技巧
 * @param {string} text - 要分析的文本
 * @param {string} language - 语言类型
 * @returns {Promise<string[]>} - 发音技巧数组的Promise
 */
async function generateTipsWithLLM(text, language) {
  // Fetch API key for OpenRouter
  const openRouterKey = wx.getStorageSync('llmApiKey');
  // If no key, fall back to local tips
  if (!openRouterKey) {
    console.log('OpenRouter API key not set, using local tips');
    return language === 'mandarin'
      ? generateMandarinTips(text)
      : (language === 'english'
        ? generateEnglishTips(text)
        : [...generateMandarinTips(text).slice(0, 2), ...generateEnglishTips(text).slice(0, 2)]);
  }

  // Build English prompt based on language
  let prompt = '';
  if (language === 'mandarin') {
    prompt = `Please provide 5 concise pronunciation tips for the following Chinese text, focusing on tones, syllables, and common pronunciation challenges to improve accuracy:\n"${text}"\nList each tip in one line, max 30 English words.`;
  } else if (language === 'english') {
    prompt = `Please provide 5 concise pronunciation tips for the following English text, focusing on vowels, consonants, and stress patterns to help Chinese speakers improve pronunciation:\n"${text}"\nList each tip in one line, max 30 English words.`;
  } else {
    prompt = `Please provide 5 concise pronunciation tips for the following mixed Chinese-English text, helping learners switch naturally between languages:\n"${text}"\nList each tip in one line, max 30 English words.`;
  }

  try {
    // Call OpenRouter AI API
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`
        },
        data: {
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300
        },
        success: res => resolve(res),
        fail: err => reject(err)
      });
    });

    // Parse response
    const choices = response.data && response.data.choices;
    if (choices && choices[0] && choices[0].message && choices[0].message.content) {
      const content = choices[0].message.content;
      const tips = content.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
      return tips.length > 0 ? tips : getPronunciationTips(text);
    }
    return getPronunciationTips(text);
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    return getPronunciationTips(text);
  }
}

/**
 * 语言检测函数
 * @param {string} text - 要检测的文本
 * @returns {string} - 检测到的语言类型: 'mandarin', 'english', 'mixed'
 */
function detectLanguage(text) {
  if (!text) return 'mandarin';
  
  const zhPattern = /[\u4e00-\u9fa5]/; // 中文字符范围
  const enPattern = /[a-zA-Z]/; // 英文字符范围
  
  const hasZh = zhPattern.test(text);
  const hasEn = enPattern.test(text);
  
  if (hasZh && !hasEn) {
    return 'mandarin';
  } else if (!hasZh && hasEn) {
    return 'english';
  } else {
    return 'mixed';
  }
}

/**
 * IPA音标转换工具
 * 将中文或英文转换为国际音标
 * @param {string} text - 要转换的文本
 * @param {string} language - 语言类型
 * @returns {string} - IPA音标
 */
function toIPA(text, language) {
  if (!text) return '';
  
  // 检测语言类型
  if (!language) {
    language = detectLanguage(text);
  }
  
  try {
    // 使用IPA-Translator库进行转换
    if (language === 'mandarin' || language === 'mixed') {
      return IPATranslator.mandarin.convert(text);
    } else if (language === 'english') {
      return IPATranslator.english.convert(text);
    }
  } catch (error) {
    console.error('IPA转换出错:', error);
    
    // 如果转换失败，使用备用方法
    if (language === 'mandarin' || language === 'mixed') {
      // 对于汉字，我们用拼音替代IPA
      return pinyin(text, { toneType: 'symbol' });
    } else if (language === 'english') {
      // 简单转换英文为IPA（仅作示例，不够完整）
      const englishIPAMap = {
        'a': 'æ', 'e': 'e', 'i': 'i', 'o': 'ɔ', 'u': 'ʌ',
        'th': 'θ', 'sh': 'ʃ', 'ch': 'tʃ', 'j': 'dʒ', 'ng': 'ŋ',
        'r': 'ɹ', 'wh': 'hw'
      };
      
      let result = text.toLowerCase();
      
      for (const [eng, ipa] of Object.entries(englishIPAMap)) {
        result = result.replace(new RegExp(eng, 'g'), ipa);
      }
      
      return result;
    }
  }
  
  return text;
}

/**
 * 分析拼音中的声调分布
 * @param {string} text - 要分析的文本
 * @returns {Object} - 声调分布统计
 */
function analyzeToneDistribution(text) {
  const toneCount = {
    1: 0, // 阴平
    2: 0, // 阳平
    3: 0, // 上声
    4: 0, // 去声
    5: 0  // 轻声
  };
  
  try {
    // 使用带数字声调的拼音
    const pinyinWithTone = pinyinPro.pinyin(text, { toneType: 'num' });
    
    // 统计各声调数量
    for (let i = 0; i < pinyinWithTone.length; i++) {
      const char = pinyinWithTone[i];
      if (/[1-5]$/.test(char)) {
        const tone = parseInt(char[char.length - 1]);
        toneCount[tone]++;
      }
    }
  } catch (error) {
    console.error('分析声调分布出错:', error);
  }
  
  return toneCount;
}

/**
 * 生成普通话发音技巧
 * @param {string} text - 中文文本
 * @returns {string[]} - 发音技巧数组
 */
function generateMandarinTips(text) {
  // 尝试使用pinyin-pro或备用方法获取拼音
  let pinyinResult;
  try {
    pinyinResult = pinyinPro.pinyin(text, { toneType: 'none' });
  } catch (error) {
    pinyinResult = pinyin(text, { toneType: 'none' });
  }
  
  // 获取声调分布
  const toneDistribution = analyzeToneDistribution(text);
  
  // 基本的普通话发音提示
  const basicTips = [
    '注意声调变化，保持自然语调',
    '发音时保持口腔放松，吐字清晰',
    '注意声母与韵母的准确发音'
  ];
  
  // 检查是否包含特定的音节，提供针对性提示
  const specialTips = [];
  
  // 检测翘舌音
  if (/zh|ch|sh|r/.test(pinyinResult)) {
    specialTips.push('翘舌音(zh/ch/sh/r)发音时，舌尖上卷触碰上颚');
  }
  
  // 检测平舌音
  if (/z|c|s/.test(pinyinResult)) {
    specialTips.push('平舌音(z/c/s)发音时，舌尖轻抵下齿，气流从舌齿间送出');
  }
  
  // 检测ü音
  if (/ü|v/.test(pinyinResult)) {
    specialTips.push('ü发音时，保持嘴唇呈圆形，舌头前伸');
  }
  
  // 检测鼻音
  if (/an|en|in|un|ang|eng|ing|ong/.test(pinyinResult)) {
    specialTips.push('鼻音发音时，让气流部分从鼻腔通过');
  }
  
  // 检测儿化音
  if (/er/.test(pinyinResult)) {
    specialTips.push('儿化音发音时，舌尖上卷，向软腭方向运动');
  }
  
  // 根据声调分布添加特定提示
  const dominantTone = Object.entries(toneDistribution)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (dominantTone[1] > 0) {
    const toneMap = {
      '1': '以第一声(阴平)为主，发音时声音保持高平',
      '2': '以第二声(阳平)为主，发音时声音由中到高',
      '3': '以第三声(上声)为主，发音时声音先降后升',
      '4': '以第四声(去声)为主，发音时声音由高降到低',
      '5': '包含轻声字，发音轻快不重读'
    };
    
    specialTips.push(toneMap[dominantTone[0]]);
  }
  
  return [...basicTips, ...specialTips];
}

/**
 * 生成英语发音技巧
 * @param {string} text - 英文文本
 * @returns {string[]} - 发音技巧数组
 */
function generateEnglishTips(text) {
  const lowerText = text.toLowerCase();
  
  // 基本英语发音提示
  const basicTips = [
    '注意元音长短变化',
    '清晰区分辅音',
    '注意单词重音位置',
    '保持自然的语调和节奏'
  ];
  
  // 针对性提示
  const specialTips = [];
  
  // 检测th音
  if (/th/.test(lowerText)) {
    specialTips.push('发"th"音时，舌尖轻触上齿，有清音[θ]和浊音[ð]两种');
  }
  
  // 检测r音
  if (/r/.test(lowerText)) {
    specialTips.push('英语"r"音发音时，舌尖不要卷曲过度，与汉语"r"音不同');
  }
  
  // 检测连读
  if (lowerText.split(' ').length > 1) {
    specialTips.push('注意单词之间的连读，特别是辅音+元音的情况');
  }
  
  // 检测重音
  if (lowerText.split(' ').some(word => word.length > 2)) {
    specialTips.push('多音节单词注意重音位置，影响单词的整体发音效果');
  }
  
  // 检测特殊音素组合
  if (/[aeiou]{2,}/.test(lowerText)) {
    specialTips.push('注意双元音或三元音的发音，保持平滑过渡');
  }
  
  return [...basicTips, ...specialTips];
}

/**
 * 获取发音技巧
 * @param {string} text - 要分析的文本
 * @returns {string[]} - 发音技巧数组
 */
function getPronunciationTips(text) {
  if (!text) return [];
  
  const language = detectLanguage(text);
  
  if (language === 'mandarin') {
    return generateMandarinTips(text);
  } else if (language === 'english') {
    return generateEnglishTips(text);
  } else {
    // 混合语言
    const combinedTips = [
      ...generateMandarinTips(text).slice(0, 2),
      ...generateEnglishTips(text).slice(0, 2),
      '中英混合句子注意语言间的过渡自然流畅'
    ];
    return combinedTips;
  }
}

/**
 * 为文本生成完整的发音指南
 * @param {string} text - 要分析的文本
 * @returns {Promise<Object>} - 包含发音信息的对象的Promise
 */
async function generatePronunciationGuide(text) {
  if (!text) {
    return {
      language: 'mandarin',
      pinyin: '',
      ipa: '',
      tips: [],
      toneDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const language = detectLanguage(text);
  // Attempt AI-powered pinyin and IPA via OpenRouter
  const openRouterKey = wx.getStorageSync('llmApiKey');
  let pinyinResult = '';
  let ipaResult = '';
  if (openRouterKey) {
    // AI pinyin
    try {
      pinyinResult = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://openrouter.ai/api/v1/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`
          },
          data: {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: `Convert the following text into pinyin with tone marks. Output only a JSON object like {"pinyin":"..."} without any extra text:\n"${text}"` }],
            max_tokens: 200
          },
          success: res => {
            const msg = res.data.choices?.[0]?.message?.content || '';
            try {
              const obj = JSON.parse(msg.trim());
              resolve(obj.pinyin || '');
            } catch (e) {
              resolve(msg.trim());
            }
          },
          fail: err => reject(err)
        });
      });
    } catch (err) {
      console.error('AI pinyin generation failed:', err);
      // fallback to local
      try {
        pinyinResult = pinyinPro.pinyin(text, { toneType: 'symbol' });
      } catch (e) {
        pinyinResult = pinyin(text, { toneType: 'symbol' });
      }
    }
    // AI IPA
    try {
      ipaResult = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://openrouter.ai/api/v1/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`
          },
          data: {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: `Convert the following text into IPA transcription. Output only a JSON object like {"ipa":"..."} without any extra text:\n"${text}"` }],
            max_tokens: 200
          },
          success: res => {
            const msg = res.data.choices?.[0]?.message?.content || '';
            try {
              const obj = JSON.parse(msg.trim());
              resolve(obj.ipa || '');
            } catch (e) {
              resolve(msg.trim());
            }
          },
          fail: err => reject(err)
        });
      });
    } catch (err) {
      console.error('AI IPA generation failed:', err);
      ipaResult = toIPA(text, language);
    }
  } else {
    // Local fallback
    if (language === 'mandarin' || language === 'mixed') {
      try {
        pinyinResult = pinyinPro.pinyin(text, { toneType: 'symbol' });
      } catch (error) {
        pinyinResult = pinyin(text, { toneType: 'symbol' });
      }
    }
    ipaResult = toIPA(text, language);
  }
  
  // Generate pronunciation tips via AI or local fallback
  const tips = await generateTipsWithLLM(text, language);
  
  // AI-powered tone distribution in JSON format
  let toneDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (openRouterKey && language !== 'english') {
    try {
      const aiToneResp = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://openrouter.ai/api/v1/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`
          },
          data: {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: `Provide a JSON object mapping Mandarin tone numbers 1-5 to their counts for the following text. Output only the JSON object without explanation:\n"${text}"` }],
            max_tokens: 200
          },
          success: res => {
            const msg = res.data.choices?.[0]?.message?.content || '';
            try {
              const obj = JSON.parse(msg.trim());
              resolve(obj);
            } catch (e) {
              resolve({});
            }
          },
          fail: err => reject(err)
        });
      });
      toneDistribution = aiToneResp && typeof aiToneResp === 'object' && Object.keys(aiToneResp).length === 5
        ? aiToneResp
        : analyzeToneDistribution(text);
    } catch (e) {
      console.error('AI tone distribution failed:', e);
      toneDistribution = analyzeToneDistribution(text);
    }
  } else {
    toneDistribution = language !== 'english'
      ? analyzeToneDistribution(text)
      : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  
  return {
    language,
    pinyin: pinyinResult,
    ipa: ipaResult,
    tips,
    toneDistribution
  };
}

// 导出所有功能
module.exports = {
  detectLanguage,
  toIPA,
  getPronunciationTips,
  generateMandarinTips,
  generateEnglishTips,
  generatePronunciationGuide,
  analyzeToneDistribution,
  generateTipsWithLLM
};