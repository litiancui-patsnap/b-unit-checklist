const CONFIG_VERSION = 'ENGLISH_LEARNING_V3';

const LEARNING_GOALS = [
  { value: 'daily', label: '日常英语', description: '每天保持英语输入和输出' },
  { value: 'spoken', label: '口语表达', description: '多听、多跟读、多开口' },
  { value: 'cet', label: '四六级备考', description: '词汇、听力和阅读稳定推进' },
  { value: 'exam', label: '考研英语', description: '单词、长难句和翻译持续积累' },
  { value: 'business', label: '职场英语', description: '积累会议、邮件和表达素材' }
];

const DAILY_INTENSITIES = [
  { value: 'A', label: '轻量', description: '忙碌日也能完成', minutes: 5 },
  { value: 'B', label: '标准', description: '每天 15-25 分钟', minutes: 18 },
  { value: 'C', label: '强化', description: '系统训练英语能力', minutes: 35 }
];

const TASK_TYPES = [
  { value: 'word', label: '单词' },
  { value: 'listen', label: '听力' },
  { value: 'speak', label: '口语' },
  { value: 'read', label: '阅读' },
  { value: 'write', label: '写作' }
];

const GOAL_TASKS = {
  daily: {
    A: [
      task('word', '单词', '背 10 个常用单词', 3),
      task('listen', '听力', '听 2 分钟英语短音频', 2),
      task('speak', '跟读', '跟读 3 句英文', 2)
    ],
    B: [
      task('word', '单词', '背 20 个单词并复习昨日单词', 6),
      task('listen', '听力', '听 8 分钟英语音频', 8),
      task('speak', '跟读', '跟读 5 句英文', 5),
      task('write', '写作', '写 1 句英文日记', 3)
    ],
    C: [
      task('word', '单词', '背 40 个单词并整理易错词', 12),
      task('listen', '听力', '精听 12 分钟英语音频', 12),
      task('speak', '跟读', '跟读 10 句英文并录音回听', 8),
      task('read', '阅读', '阅读 1 段英文短文', 8),
      task('write', '写作', '写 3 句英文日记', 6)
    ]
  },
  spoken: {
    A: [
      task('listen', '听力', '听 3 分钟真实口语音频', 3),
      task('speak', '跟读', '跟读 5 句日常表达', 4),
      task('write', '输出', '写 1 句今天想说的英文', 2)
    ],
    B: [
      task('listen', '听力', '听 8 分钟真实口语音频', 8),
      task('speak', '跟读', '跟读 8 句并模仿语调', 8),
      task('speak', '复述', '用英文复述 1 句话', 4),
      task('write', '输出', '写 1 句可直接开口说的英文', 3)
    ],
    C: [
      task('listen', '听力', '精听 12 分钟真实口语音频', 12),
      task('speak', '跟读', '跟读 12 句并录音回听', 10),
      task('speak', '复述', '用英文复述 3 句话', 8),
      task('word', '表达', '整理 5 个口语表达', 5),
      task('write', '输出', '写 3 句今日口语脚本', 6)
    ]
  },
  cet: {
    A: [
      task('word', '词汇', '背 15 个四六级核心词', 4),
      task('listen', '听力', '听 1 段短对话', 3),
      task('read', '阅读', '读 1 个长难句', 3)
    ],
    B: [
      task('word', '词汇', '背 30 个四六级核心词', 8),
      task('listen', '听力', '听 1 组听力小题', 8),
      task('read', '阅读', '精读 1 段阅读材料', 8),
      task('write', '写作', '积累 1 句作文表达', 3)
    ],
    C: [
      task('word', '词汇', '背 50 个四六级核心词并复盘错词', 14),
      task('listen', '听力', '完成 1 组听力训练', 12),
      task('read', '阅读', '完成 1 篇阅读训练', 15),
      task('write', '写作', '仿写 3 句作文表达', 8),
      task('write', '复盘', '整理今日错因', 5)
    ]
  },
  exam: {
    A: [
      task('word', '词汇', '背 15 个考研核心词', 4),
      task('read', '长难句', '拆解 1 个长难句', 5),
      task('write', '翻译', '翻译 1 句英文', 4)
    ],
    B: [
      task('word', '词汇', '背 30 个考研核心词', 8),
      task('read', '长难句', '拆解 2 个长难句', 10),
      task('write', '翻译', '翻译 2 句英文', 6),
      task('write', '输出', '写 1 句同义改写', 4)
    ],
    C: [
      task('word', '词汇', '背 50 个考研核心词并复盘错词', 14),
      task('read', '长难句', '拆解 4 个长难句', 16),
      task('write', '翻译', '翻译 1 段英文', 12),
      task('read', '阅读', '精读 1 段真题材料', 12),
      task('write', '复盘', '整理 3 个表达或错因', 6)
    ]
  },
  business: {
    A: [
      task('word', '表达', '记 5 个职场英语表达', 3),
      task('listen', '听力', '听 2 分钟会议或邮件场景音频', 3),
      task('write', '写作', '写 1 句职场英文', 3)
    ],
    B: [
      task('word', '表达', '记 10 个会议或邮件表达', 6),
      task('listen', '听力', '听 8 分钟职场英语音频', 8),
      task('speak', '口语', '跟读 5 句会议表达', 5),
      task('write', '写作', '写 1 句英文邮件句子', 5)
    ],
    C: [
      task('word', '表达', '整理 15 个职场表达', 10),
      task('listen', '听力', '精听 12 分钟职场英语音频', 12),
      task('speak', '口语', '模拟 1 段会议发言', 10),
      task('write', '写作', '写 3 句英文邮件内容', 10),
      task('write', '复盘', '整理 3 个可复用表达', 5)
    ]
  }
};

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function task(type, module, text, minutes) {
  return { type, module, text, minutes };
}

function withIds(items, prefix) {
  return items.map((item, index) => ({
    id: generateId(`${prefix}_${index + 1}`),
    ...item
  }));
}

function getGoalLabel(goal) {
  const option = LEARNING_GOALS.find(item => item.value === goal);
  return option ? option.label : LEARNING_GOALS[0].label;
}

function getIntensityLabel(intensity) {
  const option = DAILY_INTENSITIES.find(item => item.value === intensity);
  return option ? option.label : DAILY_INTENSITIES[1].label;
}

function getTaskTypeLabel(type) {
  const option = TASK_TYPES.find(item => item.value === type);
  return option ? option.label : TASK_TYPES[0].label;
}

function normalizeTaskType(type) {
  if (TASK_TYPES.some(item => item.value === type)) {
    return type;
  }

  if (type === 'translate' || type === 'review') {
    return 'write';
  }

  return 'word';
}

function normalizeTaskItem(item = {}) {
  const type = normalizeTaskType(item.type);
  return {
    ...item,
    type,
    module: item.module || getTaskTypeLabel(type),
    minutes: Number(item.minutes || 0)
  };
}

function getTemplatesForGoal(goal = 'daily') {
  const goalTasks = GOAL_TASKS[goal] || GOAL_TASKS.daily;
  return {
    A: {
      title: `${getGoalLabel(goal)} · 轻量计划`,
      threshold: 1,
      items: withIds(goalTasks.A, `${goal}_a`)
    },
    B: {
      title: `${getGoalLabel(goal)} · 标准计划`,
      threshold: 2,
      items: withIds(goalTasks.B, `${goal}_b`)
    },
    C: {
      title: `${getGoalLabel(goal)} · 强化计划`,
      threshold: 3,
      items: withIds(goalTasks.C, `${goal}_c`)
    }
  };
}

function getDefaultConfig(goal = 'daily', dailyIntensity = 'B') {
  return {
    version: CONFIG_VERSION,
    hasOnboarded: false,
    learningGoal: goal,
    dailyIntensity,
    aiService: {
      enabled: true,
      mode: 'http',
      cloudFunctionName: 'aiProxy',
      baseUrl: 'https://b-unit-checklist-main.vercel.app',
      provider: 'qwen',
      dictionaryPath: '/dictionary/lookup',
      ttsPath: '/speech/tts',
      contentPath: '/learning/content',
      planPath: '/learning/plan'
    },
    diaryTemplates: getDiaryTemplates(goal),
    startChecklist: [
      { id: generateId('prep_1'), text: '准备好单词本或学习 App' },
      { id: generateId('prep_2'), text: '手机调成专注模式' },
      { id: generateId('prep_3'), text: '打开计时器' }
    ],
    templates: getTemplatesForGoal(goal),
    reminder: {
      enabled: false,
      time: '21:30'
    }
  };
}

function getDiaryTemplates(goal = 'daily') {
  const common = [
    'Today I learned ...',
    'One new word I remember is ...',
    'Tomorrow I will review ...'
  ];
  const byGoal = {
    daily: ['I listened to English for ... minutes.', 'I can use ... in a sentence.'],
    spoken: ['Today I practiced saying: ...', 'I want to say this more naturally: ...'],
    cet: ['The useful phrase I learned today is ...', 'One mistake I should avoid is ...'],
    exam: ['Today I analyzed this sentence: ...', 'This word means ... in the passage.'],
    business: ['Today I practiced this work expression: ...', 'I can use this in an email: ...']
  };
  return [...(byGoal[goal] || byGoal.daily), ...common];
}

module.exports = {
  CONFIG_VERSION,
  DAILY_INTENSITIES,
  LEARNING_GOALS,
  TASK_TYPES,
  getDefaultConfig,
  getDiaryTemplates,
  getGoalLabel,
  getIntensityLabel,
  getTaskTypeLabel,
  getTemplatesForGoal,
  normalizeTaskItem,
  normalizeTaskType,
  generateId
};
