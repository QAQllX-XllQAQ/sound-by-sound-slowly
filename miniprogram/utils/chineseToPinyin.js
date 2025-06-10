// chineseToPinyin.js - 自主实现的汉字拼音转换工具

const { 
  pinyinDict, 
  pinyinDictWithoutTone, 
  pinyinDictWithNumTone,
  getInitial,
  getFinal
} = require('./pinyinData');

/**
 * 将中文文本转换为拼音
 * @param {string} text - 要转换的中文文本
 * @param {Object} options - 转换选项
 * @param {string} options.toneType - 声调类型: 'symbol'(符号), 'num'(数字), 'none'(无)
 * @param {string} options.type - 返回类型: 'string'(字符串), 'array'(数组)
 * @param {string} options.pattern - 模式: 'pinyin'(全拼), 'initial'(声母), 'final'(韵母)
 * @param {boolean} options.v - 是否使用v替代ü
 * @param {string} options.nonZh - 非中文字符处理: 'consecutive'(保留), 'remove'(移除)
 * @returns {string|Array} - 转换后的拼音
 */
function pinyin(text, options = {}) {
  // 默认选项
  const defaultOptions = {
    toneType: 'symbol', // 音调形式: 'symbol'(符号), 'num'(数字), 'none'(无)
    type: 'string',     // 返回类型: 'string'(字符串), 'array'(数组)
    pattern: 'pinyin',  // 模式: 'pinyin'(全拼), 'initial'(声母), 'final'(韵母)
    v: true,            // 是否使用v替代ü
    nonZh: 'consecutive' // 非中文字符处理: 'consecutive'(保留), 'remove'(移除)
  };

  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 空字符串检查
  if (!text) return mergedOptions.type === 'array' ? [] : '';
  
  // 转换结果
  const result = [];
  
  // 逐字处理
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 检测是否为汉字 (Unicode范围: 0x4e00-0x9fff)
    const isHanzi = /[\u4e00-\u9fff]/.test(char);
    
    if (isHanzi) {
      let pinyinResult = '';
      
      // 根据模式获取拼音
      switch (mergedOptions.pattern) {
        case 'initial':
          pinyinResult = getInitial(char);
          break;
        case 'final':
          pinyinResult = getFinal(char);
          break;
        case 'pinyin':
        default:
          // 根据声调类型选择拼音
          if (mergedOptions.toneType === 'num') {
            pinyinResult = pinyinDictWithNumTone[char] || char;
          } else if (mergedOptions.toneType === 'none') {
            pinyinResult = pinyinDictWithoutTone[char] || char;
          } else {
            pinyinResult = pinyinDict[char] || char;
          }
          break;
      }
      
      // 处理ü到v的转换
      if (mergedOptions.v && pinyinResult.includes('ü')) {
        pinyinResult = pinyinResult.replace(/ü/g, 'v');
      }
      
      result.push(pinyinResult);
    } else if (mergedOptions.nonZh === 'consecutive') {
      // 保留非汉字
      result.push(char);
    }
    // 如果nonZh是'remove'，则跳过非汉字
  }
  
  // 根据type选项返回字符串或数组
  return mergedOptions.type === 'array' ? result : result.join(' ');
}

/**
 * 将文本与拼音进行匹配
 * @param {string} text - 中文文本
 * @param {string} query - 拼音查询字符串
 * @returns {Array} - 匹配到的字符索引数组
 */
function match(text, query) {
  if (!text || !query) return [];
  
  // 将查询字符串转为小写
  const lowerQuery = query.toLowerCase();
  
  // 获取文本的拼音和首字母
  const fullPinyin = [];
  const initialPinyin = [];
  
  // 生成拼音信息
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isHanzi = /[\u4e00-\u9fff]/.test(char);
    
    if (isHanzi) {
      const py = pinyinDictWithoutTone[char] || char;
      const initial = getInitial(char);
      
      fullPinyin.push(py);
      initialPinyin.push(initial);
    } else {
      fullPinyin.push(char.toLowerCase());
      initialPinyin.push(char.toLowerCase());
    }
  }
  
  // 匹配逻辑
  const matchIndices = [];
  
  // 首字母匹配
  const initialStr = initialPinyin.join('');
  if (initialStr.includes(lowerQuery)) {
    let startIdx = initialStr.indexOf(lowerQuery);
    for (let i = 0; i < lowerQuery.length; i++) {
      matchIndices.push(startIdx + i);
    }
    return [...new Set(matchIndices)].sort((a, b) => a - b);
  }
  
  // 全拼匹配
  const fullStr = fullPinyin.join('');
  if (fullStr.includes(lowerQuery)) {
    let startIdx = fullStr.indexOf(lowerQuery);
    for (let i = 0; i < lowerQuery.length; i++) {
      matchIndices.push(startIdx + i);
    }
    return [...new Set(matchIndices)].sort((a, b) => a - b);
  }
  
  // 混合匹配 (首字母+全拼)
  let queryIdx = 0;
  let textIdx = 0;
  
  while (queryIdx < lowerQuery.length && textIdx < text.length) {
    const queryChar = lowerQuery[queryIdx];
    const textChar = text[textIdx];
    const fullPy = fullPinyin[textIdx];
    const initialPy = initialPinyin[textIdx];
    
    if (queryChar === initialPy || fullPy.startsWith(queryChar)) {
      matchIndices.push(textIdx);
      queryIdx++;
    }
    textIdx++;
  }
  
  return queryIdx === lowerQuery.length ? [...new Set(matchIndices)].sort((a, b) => a - b) : [];
}

/**
 * 获取带汉字拼音的HTML字符串
 * @param {string} text - 中文文本
 * @param {Object} options - 配置选项
 * @returns {string} - 带拼音的HTML字符串
 */
function html(text, options = {}) {
  if (!text) return '';
  
  // 默认选项
  const defaultOptions = {
    toneType: 'symbol',
    v: true
  };
  
  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };
  
  let result = '';
  
  // 逐字处理
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isHanzi = /[\u4e00-\u9fff]/.test(char);
    
    if (isHanzi) {
      let py;
      
      if (mergedOptions.toneType === 'num') {
        py = pinyinDictWithNumTone[char] || char;
      } else if (mergedOptions.toneType === 'none') {
        py = pinyinDictWithoutTone[char] || char;
      } else {
        py = pinyinDict[char] || char;
      }
      
      // 处理ü到v的转换
      if (mergedOptions.v && py.includes('ü')) {
        py = py.replace(/ü/g, 'v');
      }
      
      // 生成带拼音的HTML
      result += `<span class="py-result-item">
<ruby>
    <span class="py-chinese-item">${char}</span>
    <rp>(</rp>
    <rt class="py-pinyin-item">${py}</rt>
    <rp>)</rp>
</ruby>
</span>`;
    } else {
      result += char;
    }
  }
  
  return result;
}

// 导出所有功能
module.exports = {
  pinyin,
  match,
  html
}; 