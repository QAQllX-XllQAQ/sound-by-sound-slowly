// test-pinyin.js - 测试拼音转换功能

// 导入拼音转换工具
const { pinyin, match, html } = require('./chineseToPinyin');

// 测试文本
const testTexts = [
  '你好，世界',
  '声声慢',
  '学习普通话',
  '中国美食'
];

// 运行测试
function runTest() {
  console.log('=== 拼音转换测试 ===');

  testTexts.forEach((text, index) => {
    console.log(`\n测试文本 ${index + 1}: "${text}"`);
    
    // 测试带声调拼音
    const pinyinWithTone = pinyin(text);
    console.log(`- 带声调拼音: ${pinyinWithTone}`);
    
    // 测试数字声调拼音
    const pinyinWithNumTone = pinyin(text, { toneType: 'num' });
    console.log(`- 数字声调拼音: ${pinyinWithNumTone}`);
    
    // 测试无声调拼音
    const pinyinWithoutTone = pinyin(text, { toneType: 'none' });
    console.log(`- 无声调拼音: ${pinyinWithoutTone}`);
    
    // 测试拼音数组
    const pinyinArray = pinyin(text, { type: 'array' });
    console.log(`- 拼音数组: [${pinyinArray.join(', ')}]`);
    
    // 测试声母
    const initial = pinyin(text, { pattern: 'initial' });
    console.log(`- 声母: ${initial}`);
    
    // 测试韵母
    const final = pinyin(text, { pattern: 'final' });
    console.log(`- 韵母: ${final}`);
    
    // 测试拼音匹配
    if (text.length > 2) {
      const matchQuery = pinyinWithoutTone.substring(0, 2);
      const matchResult = match(text, matchQuery);
      console.log(`- 匹配 "${matchQuery}": 索引 [${matchResult.join(', ')}]`);
    }
    
    // 测试HTML生成 (只显示结果长度)
    const htmlResult = html(text);
    console.log(`- HTML 生成: ${htmlResult.length} 字符`);
    
    console.log('---');
  });
  
  console.log('\n=== 测试完成 ===');
}

// 导出测试函数
module.exports = {
  runTest
};

// 如果直接运行该文件，则执行测试
if (require.main === module) {
  runTest();
} 