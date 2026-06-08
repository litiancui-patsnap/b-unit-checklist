function generateId() {
  return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getDefaultConfig() {
  return {
    startChecklist: [
      { id: generateId(), text: '手机静音,放远处' },
      { id: generateId(), text: '倒一杯水' },
      { id: generateId(), text: '打开计时器' },
      { id: generateId(), text: '深呼吸3次' }
    ],
    templates: {
      A: {
        title: '模板A',
        threshold: 1,
        items: [
          { id: generateId(), text: '综合应用能力 1题' },
          { id: generateId(), text: '复习笔记 10分钟' }
        ]
      },
      B: {
        title: '模板B',
        threshold: 2,
        items: [
          { id: generateId(), text: '综合应用能力 2题' },
          { id: generateId(), text: '职业能力测试 20题' },
          { id: generateId(), text: '复习错题本 15分钟' },
          { id: generateId(), text: '整理笔记' }
        ]
      },
      C: {
        title: '模板C',
        threshold: 2,
        items: [
          { id: generateId(), text: '综合应用能力 3题' },
          { id: generateId(), text: '职业能力测试 40题' },
          { id: generateId(), text: '专项训练 30分钟' },
          { id: generateId(), text: '模拟考试 1套' }
        ]
      }
    },
    reminder: {
      enabled: false,
      time: '21:30'
    }
  };
}

module.exports = {
  getDefaultConfig,
  generateId
};
