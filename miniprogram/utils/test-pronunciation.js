// test-pronunciation.js - 测试发音功能
const pronunciationUtil = require('./pronunciation');

// 测试文本
const testTexts = [
  '你好，世界',
  '声声慢',
  '学习普通话',
  '中国美食',
  'Hello World',
  'Good Morning',
  '中文 English 混合'
];

// 运行测试
function runTest() {
  console.log('=== 发音工具测试 ===');

  testTexts.forEach((text, index) => {
    console.log(`\n测试文本 ${index + 1}: "${text}"`);
    
    // 测试语言检测
    const language = pronunciationUtil.detectLanguage(text);
    console.log(`- 检测到的语言: ${language}`);
    
    // 测试拼音转换
    const guide = pronunciationUtil.generatePronunciationGuide(text);
    console.log(`- 拼音: ${guide.pinyin}`);
    console.log(`- IPA音标: ${guide.ipa}`);
    
    // 输出发音技巧
    console.log('- 发音技巧:');
    guide.tips.forEach((tip, i) => {
      console.log(`  ${i + 1}. ${tip}`);
    });
    
    // 输出声调分布（仅对中文有效）
    if (language === 'mandarin' || language === 'mixed') {
      console.log('- 声调分布:');
      const tones = guide.toneDistribution;
      console.log(`  第一声(阴平): ${tones[1]}个`);
      console.log(`  第二声(阳平): ${tones[2]}个`);
      console.log(`  第三声(上声): ${tones[3]}个`);
      console.log(`  第四声(去声): ${tones[4]}个`);
      console.log(`  轻声: ${tones[5]}个`);
      
      // 计算声调总数
      const totalTones = Object.values(tones).reduce((sum, count) => sum + count, 0);
      if (totalTones > 0) {
        console.log('- 声调百分比:');
        console.log(`  第一声: ${Math.round(tones[1] / totalTones * 100)}%`);
        console.log(`  第二声: ${Math.round(tones[2] / totalTones * 100)}%`);
        console.log(`  第三声: ${Math.round(tones[3] / totalTones * 100)}%`);
        console.log(`  第四声: ${Math.round(tones[4] / totalTones * 100)}%`);
        console.log(`  轻声: ${Math.round(tones[5] / totalTones * 100)}%`);
      }
    }
    
    console.log('---');
  });
  
  // 测试单独的声调分析功能
  console.log('\n=== 声调分析测试 ===');
  const toneTestText = '妈妈骑马，马慢妈妈骂马。';
  console.log(`测试文本: "${toneTestText}"`);
  const toneDistribution = pronunciationUtil.analyzeToneDistribution(toneTestText);
  console.log('声调分布:');
  console.log(`第一声: ${toneDistribution[1]}个`);
  console.log(`第二声: ${toneDistribution[2]}个`);
  console.log(`第三声: ${toneDistribution[3]}个`);
  console.log(`第四声: ${toneDistribution[4]}个`);
  console.log(`轻声: ${toneDistribution[5]}个`);
  
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