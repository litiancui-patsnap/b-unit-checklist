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

const STUDY_PERSONAS = [
  {
    id: 'dual_worker',
    name: '上班族日英双修',
    shortName: '日英双修',
    description: '日语系统推进，英语持续保持，适合工作日分段学习。',
    promise: '教材主线 + 通勤复习 + 每周英语输出'
  },
  {
    id: 'jlpt_business',
    name: 'JLPT＋职场英语',
    shortName: 'JLPT＋职场',
    description: '日语围绕 JLPT 词汇、语法和真题，英语聚焦会议、邮件与表达。',
    promise: '考试提分 + 工作场景可直接使用'
  },
  {
    id: 'commute_listening',
    name: '通勤听力计划',
    shortName: '通勤听力',
    description: '把主要任务压缩到去程、返程和睡前，优先训练听懂与复述。',
    promise: '每天 4～5 个动作，通勤完成主要输入'
  }
];

const EVIDENCE_REQUIRED_FROM = '2026-07-21';

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

function getStudyPersona(personaId = 'dual_worker') {
  return STUDY_PERSONAS.find(item => item.id === personaId) || STUDY_PERSONAS[0];
}

function getTaskEvidence(taskItem = {}) {
  const title = String(taskItem.title || '');
  const executionType = taskItem.executionType || '';
  if (executionType === 'speak' || /跟读|朗读|口头|复述/.test(title)) {
    return {
      type: 'audio',
      label: '录音证据',
      prompt: '录下 20～60 秒跟读或复述，回听后再提交。'
    };
  }
  if (/日记|短文/.test(title)) {
    return {
      type: 'diary',
      label: '日记证据',
      prompt: '写下 2～5 句学习日记或短文，保留今天的真实输出。'
    };
  }
  if (executionType === 'write' || /造句|摘要|观点|邮件|表达/.test(title)) {
    return {
      type: 'sentence',
      label: '造句证据',
      prompt: '至少写 2 句自己的表达，不直接照抄学习材料。'
    };
  }
  if (/单词|语法|错题|周测|复习|预习/.test(title)) {
    return {
      type: 'recall',
      label: '回忆证据',
      prompt: '合上资料，写出至少 3 个还能回忆起来的要点。'
    };
  }
  return {
    type: 'retell',
    label: '复述证据',
    prompt: '不用看原文，写下你能复述出的核心内容和一个细节。'
  };
}

function addTaskEvidence(taskItem = {}) {
  const evidence = getTaskEvidence(taskItem);
  return {
    ...taskItem,
    evidenceRequired: true,
    evidenceType: evidence.type,
    evidenceLabel: evidence.label,
    evidencePrompt: evidence.prompt
  };
}

function isTaskComplete(taskItem = {}, dayData = {}, dateString = '') {
  const checked = Boolean(dayData?.planner?.checked?.[taskItem.id]);
  if (!checked) return false;
  if (!taskItem.evidenceRequired || !dateString || dateString < EVIDENCE_REQUIRED_FROM) return true;
  return Boolean(dayData?.planner?.evidence?.[taskItem.id]);
}

function getCommutePlan(day) {
  const weekend = day === 0 || day === 6;
  const primaryLanguage = day === 2 || day === 4 ? 'en' : 'jp';
  const secondaryLanguage = primaryLanguage === 'jp' ? 'en' : 'jp';
  return {
    focus: weekend ? '长段听力与复述' : '通勤完成主要输入',
    description: weekend
      ? '保留通勤式短任务结构，用更完整的片段做精听、跟读和复述。'
      : '去程输入、返程复述，睡前只留下最小输出，不把学习压力带回家。',
    tasks: [
      task('通勤前闭卷回忆 10 个词', 'review', weekend ? 20 : 15, '个人词表或错词本', 'word'),
      task(`${primaryLanguage === 'jp' ? '日语' : '英语'}去程精听 1 个片段`, primaryLanguage, weekend ? 40 : 25, '30～90 秒通勤音频', 'listen'),
      task(`${primaryLanguage === 'jp' ? '日语' : '英语'}返程影子跟读与复述`, primaryLanguage, weekend ? 35 : 20, '去程同一音频', 'speak'),
      task(`${secondaryLanguage === 'jp' ? '日语' : '英语'}保持听力`, secondaryLanguage, weekend ? 30 : 20, '已学过且能理解 70%～90% 的音频', 'listen'),
      task('睡前造 2 句或写 1 句日记', secondaryLanguage, weekend ? 25 : 15, '学习日志', 'write')
    ]
  };
}

function transformJlptBusinessTask(taskItem = {}) {
  if (taskItem.language === 'en') {
    const englishTaskByType = {
      read: task('职场英语邮件精读', 'en', taskItem.minutes, '真实邮件与常用句型', 'read'),
      listen: task('职场会议片段精听', 'en', taskItem.minutes, '会议或汇报场景音频', 'listen'),
      speak: task('职场英语口头复述录音', 'en', taskItem.minutes, '会议表达关键词', 'speak'),
      write: task('职场英语邮件仿写', 'en', taskItem.minutes, '邮件模板与表达笔记', 'write')
    };
    return englishTaskByType[taskItem.executionType] || task('职场英语表达复习', 'en', taskItem.minutes, '会议、邮件与汇报表达', 'write');
  }

  const title = String(taskItem.title || '')
    .replace('日语新课', 'JLPT 词汇语法')
    .replace('下一课', 'JLPT 下一单元')
    .replace('日语课文', 'JLPT 阅读')
    .replace('新课文', 'JLPT 阅读材料')
    .replace('本周日语', '本周 JLPT');
  return {
    ...taskItem,
    title,
    resource: /听|跟读|朗读/.test(title) ? 'JLPT 听力真题与原文' : 'JLPT 教材、真题与错题本'
  };
}

function getPersonaPlanSource(day, personaId) {
  if (personaId === 'commute_listening') {
    return getCommutePlan(day);
  }
  const source = day === 0 || day === 6 ? WEEKEND_PLANS[day] : WEEKDAY_PLANS[day];
  if (personaId === 'jlpt_business') {
    return {
      ...source,
      focus: day === 0 ? 'JLPT 周测与职场输出' : `JLPT 主线 · ${source.focus}`,
      description: '日语围绕 JLPT 可测能力推进，英语只保留能直接用于会议、邮件或汇报的动作。',
      tasks: source.tasks.map(transformJlptBusinessTask)
    };
  }
  return source;
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

function getWeekStart(dateString) {
  const date = parseDate(dateString);
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return formatDateKey(date);
}

function getPlanAdjustment(dateString, adjustments = {}) {
  const weekStart = getWeekStart(dateString);
  const adjustment = adjustments?.[weekStart];
  if (!adjustment || adjustment.weekStart !== weekStart) {
    return null;
  }
  return adjustment;
}

function roundToFive(value) {
  return Math.max(10, Math.round(Number(value || 0) / 5) * 5);
}

function adjustTask(taskItem, adjustment) {
  if (!adjustment) return taskItem;
  const override = adjustment.taskOverrides?.[taskItem.id] || null;
  const overriddenTask = override?.action === 'replace'
    ? addTaskEvidence({ ...taskItem, ...(override.replacement || {}) })
    : taskItem;
  const taskScale = override?.action === 'lower' ? Number(override.minuteScale || 0.6) : 1;
  let minutes = Number(overriddenTask.minutes || 0) * taskScale * Number(adjustment.minuteScale || 1);
  if (overriddenTask.language === 'en') {
    minutes += Number(adjustment.englishBonusMinutes || 0);
  }
  if (overriddenTask.executionType === 'speak' || overriddenTask.executionType === 'write') {
    minutes += Number(adjustment.outputBonusMinutes || 0);
  }
  const adjustedMinutes = roundToFive(minutes);
  return {
    ...overriddenTask,
    minutes: adjustedMinutes,
    originalMinutes: Number(taskItem.minutes || 0),
    adjustmentDelta: adjustedMinutes - Number(taskItem.minutes || 0),
    adaptiveAction: override?.action || '',
    adaptiveNote: override?.note || ''
  };
}

function getPlan(dateString, adjustments = {}, personaId = 'dual_worker') {
  const date = parseDate(dateString);
  const day = date.getDay();
  const persona = getStudyPersona(personaId);
  const source = getPersonaPlanSource(day, persona.id);
  const adjustment = getPlanAdjustment(dateString, adjustments);
  const tasks = source.tasks.map((item, index) => {
    const id = persona.id === 'dual_worker' ? `base_${day}_${index}` : `${persona.id}_${day}_${index}`;
    return adjustTask(addTaskEvidence({ ...item, id }), adjustment);
  });
  return {
    ...source,
    persona,
    dayType: `${day === 0 || day === 6 ? '周末' : '工作日'} · ${tasks.reduce((sum, item) => sum + item.minutes, 0)} 分钟计划`,
    tip: TIPS[day % TIPS.length],
    tasks,
    adjustment: adjustment ? {
      weekStart: adjustment.weekStart,
      weekEnd: adjustment.weekEnd,
      title: adjustment.title,
      mode: adjustment.mode,
      reason: adjustment.reason
    } : null
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

function updatePlannerCompletion(dayData = {}, dateString, adjustments = {}, personaId = 'dual_worker') {
  dayData.planner = {
    checked: {},
    customTasks: [],
    complete: false,
    ...(dayData.planner || {})
  };
  dayData.planner.checked = dayData.planner.checked || {};
  dayData.planner.customTasks = dayData.planner.customTasks || [];
  const tasks = [...getPlan(dateString, adjustments, personaId).tasks, ...dayData.planner.customTasks];
  const complete = tasks.length > 0 && tasks.every(item => isTaskComplete(item, dayData, dateString));
  dayData.planner.complete = complete;
  if (complete) {
    dayData.complete = true;
    dayData.completeSource = 'planner';
  } else if (dayData.completeSource === 'planner') {
    dayData.complete = false;
  }
  return complete;
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
  EVIDENCE_REQUIRED_FROM,
  STUDY_PERSONAS,
  addTaskEvidence,
  calculateStreak,
  formatDateKey,
  getLanguageLabel,
  getPlan,
  getResourceDescription,
  getStudyPersona,
  getTaskEvidence,
  getWeek,
  getWeekStart,
  shiftDate,
  isTaskComplete,
  updatePlannerCompletion
};
