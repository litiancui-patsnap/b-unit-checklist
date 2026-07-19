const WEEKDAY_PLANS = {
  1: {
    focus: '输入新内容',
    description: '早上学习《标准日本语》新课；晚上快速阅读一篇 TED，建立本周输入。',
    tasks: [
      task('日语新课：单词与语法', 'jp', 50, '《标准日本语》教材'),
      task('课文听读与跟读', 'jp', 30, '配套课文音频'),
      task('通勤或工作间隙重听', 'review', 50, '当天日语课文'),
      task('午休单词复习', 'jp', 30, 'Anki 或单词本'),
      task('日语练习与造句', 'jp', 50, '配套练习册'),
      task('TED 快速阅读', 'en', 50, 'TED 文章与演讲稿', 'read')
    ]
  },
  2: {
    focus: '理解并练习',
    description: '日语进入课文理解和练习；英语集中处理昨天 TED 中没有听清的片段。',
    tasks: [
      task('日语单词复习', 'jp', 30, 'Anki 或单词本'),
      task('课文精读与语法练习', 'jp', 60, '《标准日本语》与练习册'),
      task('工作间隙重听课文', 'review', 45, '配套课文音频'),
      task('课文逐句跟读', 'jp', 35, '配套课文音频'),
      task('用本课句型造 5 句', 'jp', 30, '学习日志'),
      task('TED 重点片段精听', 'en', 60, 'TED 视频与英文字幕', 'listen')
    ]
  },
  3: {
    focus: '加强输出',
    description: '把前两天的输入转化为口语：日语复述课文，英语模仿 TED 的语音节奏。',
    tasks: [
      task('日语课文复述', 'jp', 45, '课文关键词'),
      task('语法错题回顾', 'review', 35, '错题本'),
      task('通勤听日语课文', 'jp', 45, '配套课文音频'),
      task('午休短句跟读', 'jp', 25, '本课重点句'),
      task('日语短文 5～10 句', 'jp', 45, '学习日志'),
      task('TED 影子跟读', 'en', 55, '30～60 秒片段', 'speak')
    ]
  },
  4: {
    focus: '推进下一课',
    description: '开始下一课日语内容，同时用英语摘要检验对 TED 核心观点的掌握。',
    tasks: [
      task('下一课单词与语法', 'jp', 60, '《标准日本语》教材'),
      task('新课文泛听', 'jp', 30, '配套课文音频'),
      task('工作间隙重听', 'review', 45, '当天新课文'),
      task('午休单词复习', 'jp', 25, 'Anki 或单词本'),
      task('日语基础练习', 'jp', 50, '配套练习册'),
      task('TED 摘要或个人观点', 'en', 55, '表达笔记', 'write')
    ]
  },
  5: {
    focus: '周内收尾',
    description: '停止堆积新内容，整理本周日语弱点，并完成一次英语口头复述。',
    tasks: [
      task('本周日语单词复习', 'review', 45, 'Anki 或单词本'),
      task('语法与错题整理', 'jp', 50, '错题本'),
      task('工作间隙混合听力', 'review', 45, '本周日语与 TED'),
      task('日语课文角色朗读', 'jp', 35, '配套课文音频'),
      task('日语周测与订正', 'jp', 45, '练习册'),
      task('TED 口头复述录音', 'en', 50, '关键词提纲', 'speak')
    ]
  }
};

const WEEKEND_PLANS = {
  6: {
    focus: '集中推进',
    description: '分四个区块学习：日语新课、课文听说、TED 精读精听，以及日语输出。',
    tasks: [
      task('日语新课与语法', 'jp', 120, '《标准日本语》教材'),
      task('日语课文精听与跟读', 'jp', 90, '配套课文音频'),
      task('TED 精读与精听', 'en', 120, 'TED 文章、视频与字幕', 'listen'),
      task('日语练习与短文', 'jp', 90, '练习册与学习日志'),
      task('本周错题复盘', 'review', 60, '错题本')
    ]
  },
  0: {
    focus: '巩固与检测',
    description: '减少新内容，通过复述、周测和总结把本周知识真正转化为可调用能力。',
    tasks: [
      task('日语单词与语法总复习', 'review', 100, 'Anki、教材与错题本'),
      task('日语课文复述与周测', 'jp', 110, '课文与练习册'),
      task('TED 跟读与口头复述', 'en', 90, 'TED 视频与关键词', 'speak'),
      task('英语摘要与表达复习', 'en', 70, '表达笔记', 'write'),
      task('下周日语预习', 'jp', 60, '《标准日本语》教材'),
      task('整理学习日志和计划', 'review', 50, '学习日志')
    ]
  }
};

const TIPS = [
  '上班时只听已经学过、能理解 70%～90% 的材料；新语法和精听留给专注时间。',
  '完成比完美重要。疲劳时保留最低任务，也不要完全中断。',
  '每学一个句型，至少造一个与自己生活有关的句子。',
  'TED 每周精学一篇即可：阅读、精听、跟读、复述分散到不同日期。',
  '周末不要连续学习，每 60～90 分钟至少离开座位休息一次。'
];

function task(title, language, minutes, resource, executionType = '') {
  return { title, language, minutes, resource, executionType };
}

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(dateString, offset) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

function getPlan(dateString) {
  const date = parseDate(dateString);
  const day = date.getDay();
  const source = day === 0 || day === 6 ? WEEKEND_PLANS[day] : WEEKDAY_PLANS[day];
  return {
    ...source,
    dayType: day === 0 || day === 6 ? '周末 · 8 小时计划' : '工作日 · 4 小时计划',
    tip: TIPS[day % TIPS.length],
    tasks: source.tasks.map((item, index) => ({
      ...item,
      id: `base_${day}_${index}`
    }))
  };
}

function getWeek(dateString, allDays = {}) {
  const selected = parseDate(dateString);
  const day = selected.getDay() || 7;
  selected.setDate(selected.getDate() - day + 1);
  const names = ['一', '二', '三', '四', '五', '六', '日'];
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selected);
    date.setDate(selected.getDate() + index);
    const key = formatDateKey(date);
    return {
      date: key,
      weekday: names[index],
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
      active: key === dateString,
      complete: Boolean(allDays[key]?.planner?.complete || allDays[key]?.complete)
    };
  });
}

function calculateStreak(allDays = {}, todayString) {
  let streak = 0;
  let cursor = todayString;
  for (let index = 0; index < 365; index++) {
    const dayData = allDays[cursor];
    if (dayData?.planner?.complete || dayData?.complete) {
      streak++;
      cursor = shiftDate(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

function getLanguageLabel(language) {
  return language === 'jp' ? '日语' : language === 'en' ? '英语' : '复习';
}

function getResourceDescription(resource = '') {
  if (resource.includes('标准日本语')) return '用于建立词汇、语法和课文主线。';
  if (resource.includes('TED')) return '本周只精学一篇，反复用于听读与输出。';
  if (resource.includes('音频')) return '专注学习后，可在通勤和工作间隙重复播放。';
  if (resource.includes('Anki') || resource.includes('单词')) return '旧词复习优先，每天少量新增。';
  if (resource.includes('错题')) return '只记录反复出错和容易混淆的内容。';
  return '用于把输入转化为造句、复述或写作。';
}

module.exports = {
  calculateStreak,
  formatDateKey,
  getLanguageLabel,
  getPlan,
  getResourceDescription,
  getWeek,
  shiftDate
};
