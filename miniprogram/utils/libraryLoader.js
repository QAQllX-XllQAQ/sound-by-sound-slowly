// libraryLoader.js - 负责加载外部库并提供降级方案

// 导入拼音数据字典
const { 
  pinyinDict, 
  pinyinDictWithoutTone, 
  pinyinDictWithNumTone,
  initialDict,
  convertToneMarkToNumber,
  getInitial,
  getFinal
} = require('./pinyinData');

// 导入内部拼音工具
const { pinyin, match, html } = require('./chineseToPinyin');

/**
 * 尝试加载外部库
 * @param {string} libraryPath - 库路径 
 * @returns {Object|null} - 加载的库或null(加载失败)
 */
function tryLoadLibrary(libraryPath) {
  try {
    return require(libraryPath);
  } catch (error) {
    console.error(`加载库失败: ${libraryPath}`, error);
    return null;
  }
}

// 尝试加载拼音转换库 pinyin-pro
let pinyinPro = tryLoadLibrary('../miniprogram_npm/pinyin-pro/index');

// 如果从node_modules加载失败，尝试其他路径
if (!pinyinPro) {
  pinyinPro = tryLoadLibrary('./libs/pinyin-pro');
}

// 如果仍然失败，提供一个基于pinyinData的完整模拟对象
if (!pinyinPro) {
  console.warn('无法加载pinyin-pro库，将使用pinyinData构建模拟库');
  
  // 创建一个基于pinyinData的拼音转换工具
  pinyinPro = {
    pinyin: (text, options = {}) => {
      // 默认选项
      const defaultOptions = {
        toneType: 'symbol', // 声调类型：symbol, num, none
        type: 'string',     // 返回类型：string, array
        pattern: 'pinyin',  // 模式：pinyin, initial, final
        v: true,            // 是否使用v替代ü
        nonZh: 'consecutive' // 非汉字字符处理
      };
      
      // 合并选项
      const mergedOptions = { ...defaultOptions, ...options };
      
      // 处理选项
      if (mergedOptions.type === 'array') {
        return pinyin(text, mergedOptions);
      }
      
      // 根据不同模式和声调类型处理
      if (mergedOptions.pattern === 'initial') {
        // 仅获取声母
        let result = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const initial = getInitial(char);
          result += initial ? initial + ' ' : char;
        }
        return result.trim();
      } else if (mergedOptions.pattern === 'final') {
        // 仅获取韵母
        let result = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const final = getFinal(char);
          result += final ? final + ' ' : char;
        }
        return result.trim();
      } else {
        // 获取完整拼音
        if (mergedOptions.toneType === 'num') {
          // 使用数字声调
          return pinyin(text, { toneType: 'num', type: 'string' });
        } else if (mergedOptions.toneType === 'none') {
          // 无声调拼音
          return pinyin(text, { toneType: 'none', type: 'string' });
        } else {
          // 默认使用符号声调
          return pinyin(text, { toneType: 'symbol', type: 'string' });
        }
      }
    },
    
    // 添加更多pinyin-pro的API方法
    convertToneNumber: (pinyin) => {
      return convertToneMarkToNumber(pinyin);
    },
    
    // 获取声母方法
    initial: (char) => {
      return getInitial(char) || '';
    },
    
    // 获取韵母方法
    final: (char) => {
      return getFinal(char) || '';
    },
    
    // 拼音匹配方法
    match: (text, pattern) => {
      return match(text, pattern);
    },
    
    // 生成带拼音的HTML方法
    html: (text, options) => {
      return html(text, options);
    },
    
    // 判断是否包含中文
    containsChinese: (text) => {
      return /[\u4e00-\u9fff]/.test(text);
    }
  };
}

// 尝试加载IPA转换库
let IPATranslator = tryLoadLibrary('../miniprogram_npm/ipa-translator/index');

// 如果从node_modules加载失败，尝试其他路径
if (!IPATranslator) {
  IPATranslator = tryLoadLibrary('./libs/ipa-translator');  
}

// 如果仍然失败，提供一个基于pinyinData的模拟IPA转换器
if (!IPATranslator) {
  console.warn('无法加载IPA-Translator库，将使用pinyinData构建模拟IPA转换器');
  
  // 构建IPA映射表（使用汉语拼音作为简化的IPA）
  const mandarinIPAMap = {};
  
  // 利用拼音字典构建简化的IPA映射
  Object.entries(pinyinDict).forEach(([char, py]) => {
    // 为汉字创建一个简单的IPA表示
    // 这里我们简单地将拼音作为IPA的近似
    mandarinIPAMap[char] = py;
  });
  
  // 英文IPA映射表（简化版）
  const englishIPAMap = {
    a: 'æ', e: 'ɛ', i: 'ɪ', o: 'ɒ', u: 'ʌ',
    ai: 'aɪ', ao: 'aʊ', ei: 'eɪ', ou: 'əʊ',
    an: 'æn', en: 'ɛn', in: 'ɪn', un: 'ʌn',
    ang: 'æŋ', eng: 'ɛŋ', ing: 'ɪŋ', ong: 'ɒŋ',
    th: 'θ', dh: 'ð', sh: 'ʃ', ch: 'tʃ', 
    zh: 'ʒ', ng: 'ŋ', j: 'dʒ', r: 'ɹ'
  };
  
  // 创建模拟IPA转换器
  IPATranslator = {
    mandarin: {
      convert: (text) => {
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const isHanzi = /[\u4e00-\u9fff]/.test(char);
          
          if (isHanzi && mandarinIPAMap[char]) {
            // 添加空格使得IPA更易读
            result += mandarinIPAMap[char] + ' ';
          } else {
            // 非汉字或未知汉字直接保留
            result += char;
          }
        }
        
        return result.trim();
      }
    },
    english: {
      convert: (text) => {
        // 简单的英文IPA转换模拟
        // 将文本转为小写
        let lowerText = text.toLowerCase();
        
        // 替换常见的音素模式
        Object.entries(englishIPAMap).forEach(([eng, ipa]) => {
          const regex = new RegExp(eng, 'g');
          lowerText = lowerText.replace(regex, ipa);
        });
        
        return lowerText;
      }
    },
    cantonese: {
      convert: (text) => {
        // 粤语暂不支持，回退到普通话
        return IPATranslator.mandarin.convert(text);
      }
    }
  };
}

module.exports = {
  pinyinPro,
  IPATranslator,
  // 导出原始数据字典以便直接访问
  pinyinDict,
  pinyinDictWithoutTone,
  pinyinDictWithNumTone
}; 