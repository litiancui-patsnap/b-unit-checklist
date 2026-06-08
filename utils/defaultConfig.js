function generateId() {
  return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getDefaultConfig() {
  return {
    version: 'ENGLISH_LEARNING_V1',
    learningGoal: 'daily',
    dailyIntensity: 'B',
    startChecklist: [
      { id: generateId(), text: '准备好单词本或学习 App' },
      { id: generateId(), text: '手机调成专注模式' },
      { id: generateId(), text: '打开计时器' },
      { id: generateId(), text: '大声读一句英文进入状态' }
    ],
    templates: {
      A: {
        title: '轻量英语任务',
        threshold: 1,
        items: [
          { id: generateId(), text: '背 10 个单词' },
          { id: generateId(), text: '听 5 分钟英语音频' },
          { id: generateId(), text: '跟读 3 句英文' }
        ]
      },
      B: {
        title: '标准英语任务',
        threshold: 2,
        items: [
          { id: generateId(), text: '背 20 个单词并复习昨日单词' },
          { id: generateId(), text: '听 10 分钟英语音频' },
          { id: generateId(), text: '跟读 5 句英文' },
          { id: generateId(), text: '写 1 句英文日记' }
        ]
      },
      C: {
        title: '强化英语任务',
        threshold: 3,
        items: [
          { id: generateId(), text: '背 40 个单词并整理易错词' },
          { id: generateId(), text: '精听 15 分钟英语音频' },
          { id: generateId(), text: '跟读 10 句英文并录音回听' },
          { id: generateId(), text: '阅读 1 段英文短文' },
          { id: generateId(), text: '写 3 句英文日记' }
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
