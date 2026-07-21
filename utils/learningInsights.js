const { calculateStreak, getPlan, shiftDate } = require('./planner.js');

function getPlannerTasks(dateString, dayData = {}) {
  const customTasks = dayData?.planner?.customTasks || [];
  return [...getPlan(dateString).tasks, ...customTasks];
}

function getCheckedMap(dayData = {}) {
  return dayData?.planner?.checked || {};
}

function hasLegacyActivity(dayData = {}) {
  return Boolean(
    dayData.complete ||
    (dayData.words || []).length ||
    String(dayData.diary || '').trim() ||
    Object.values(dayData.items || {}).some(Boolean) ||
    Object.values(dayData.contentChecks || {}).some(Boolean) ||
    Object.values(dayData.scenePractice || {}).some(Boolean) ||
    dayData.quiz?.completed
  );
}

function getDaySummary(dateString, dayData = null) {
  const safeDayData = dayData || {};
  const plan = getPlan(dateString);
  const tasks = getPlannerTasks(dateString, safeDayData);
  const checked = getCheckedMap(safeDayData);
  const completedTasks = tasks.filter(task => checked[task.id]);
  const plannedMinutes = tasks.reduce((sum, task) => sum + Number(task.minutes || 0), 0);
  const completedMinutes = completedTasks.reduce((sum, task) => sum + Number(task.minutes || 0), 0);
  const plannerProgress = plannedMinutes ? Math.round(completedMinutes / plannedMinutes * 100) : 0;
  const plannerComplete = tasks.length > 0 && completedTasks.length === tasks.length;
  const complete = Boolean(plannerComplete || safeDayData.complete || safeDayData.planner?.complete);
  const hasPlannerActivity = completedTasks.length > 0 || (safeDayData.planner?.customTasks || []).length > 0;
  const hasActivity = hasPlannerActivity || hasLegacyActivity(safeDayData);
  const progress = plannerProgress || (complete ? 100 : 0);
  const japaneseMinutes = completedTasks
    .filter(task => task.language === 'jp')
    .reduce((sum, task) => sum + Number(task.minutes || 0), 0);
  const englishMinutes = completedTasks
    .filter(task => task.language === 'en')
    .reduce((sum, task) => sum + Number(task.minutes || 0), 0);
  const reviewMinutes = completedTasks
    .filter(task => task.language === 'review')
    .reduce((sum, task) => sum + Number(task.minutes || 0), 0);

  return {
    date: dateString,
    focus: plan.focus,
    description: plan.description,
    complete,
    hasActivity,
    progress,
    plannedMinutes,
    completedMinutes,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    japaneseMinutes,
    englishMinutes,
    reviewMinutes,
    diary: String(safeDayData.diary || '').trim(),
    wordCount: (safeDayData.words || []).length,
    tasks: tasks.map(task => ({
      ...task,
      checked: Boolean(checked[task.id])
    }))
  };
}

function createDateRange(todayString, count) {
  return Array.from({ length: count }, (_, index) => shiftDate(todayString, index - count + 1));
}

function getWeekdayLabel(dateString) {
  return ['日', '一', '二', '三', '四', '五', '六'][new Date(`${dateString}T00:00:00`).getDay()];
}

function getShortDate(dateString) {
  const [, month, day] = dateString.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function getDateLabel(dateString, todayString) {
  if (dateString === todayString) return '今天';
  if (dateString === shiftDate(todayString, -1)) return '昨天';
  return `${getShortDate(dateString)} 周${getWeekdayLabel(dateString)}`;
}

function buildInsights(metrics) {
  const insights = [];
  if (metrics.activeDays === 0) {
    insights.push({
      tone: 'primary',
      title: '先完成今天第一项',
      description: '记录的价值来自真实行动。回到计划页，先完成一项最容易开始的任务。'
    });
  } else if (metrics.completedDays >= 5) {
    insights.push({
      tone: 'success',
      title: '本周节奏稳定',
      description: `最近 7 天完成 ${metrics.completedDays} 天，继续保持当前任务量，不必额外加码。`
    });
  } else if (metrics.completedDays >= 3) {
    insights.push({
      tone: 'primary',
      title: '已经形成可持续节奏',
      description: '优先补齐经常跳过的任务，不要同时增加新的学习材料。'
    });
  } else {
    insights.push({
      tone: 'warning',
      title: '计划可能偏重',
      description: '最近完成天数偏少。下一次先保住轻量任务，再逐步恢复标准强度。'
    });
  }

  if (metrics.completedMinutes === 0) {
    insights.push({
      tone: 'neutral',
      title: '暂无语言投入分布',
      description: '完成任务后，这里会显示日语与英语的真实投入比例。'
    });
  } else if (metrics.englishRatio < 20) {
    insights.push({
      tone: 'warning',
      title: '英语保持动作偏少',
      description: '下一次优先完成一个可进入执行页的英语任务，避免英语只停留在计划中。'
    });
  } else if (metrics.japaneseRatio < 35) {
    insights.push({
      tone: 'warning',
      title: '日语主线投入不足',
      description: '日语是当前系统推进主线，建议先完成教材或课文任务，再安排英语保持。'
    });
  } else {
    insights.push({
      tone: 'success',
      title: '语言投入符合当前定位',
      description: '日语负责系统推进，英语负责持续保持，当前完成结构比较均衡。'
    });
  }

  if (metrics.outputDays === 0) {
    insights.push({
      tone: 'neutral',
      title: '增加一次可见输出',
      description: '本周还没有英文日记或其他输出记录。完成后写一句总结，复盘会更有依据。'
    });
  } else {
    insights.push({
      tone: 'success',
      title: '已经留下输出证据',
      description: `最近 7 天有 ${metrics.outputDays} 天留下英文日记或输出记录，可继续积累可复用表达。`
    });
  }

  return insights;
}

function buildLearningReview(allDays = {}, todayString) {
  const weekDates = createDateRange(todayString, 7);
  const weekDays = weekDates.map(date => {
    const summary = getDaySummary(date, allDays[date]);
    return {
      ...summary,
      weekday: getWeekdayLabel(date),
      shortDate: getShortDate(date),
      dateLabel: getDateLabel(date, todayString),
      isToday: date === todayString
    };
  });
  const recentDates = createDateRange(todayString, 30);
  const recentSummaries = recentDates.map(date => getDaySummary(date, allDays[date]));
  const activeDays = weekDays.filter(day => day.hasActivity).length;
  const completedDays = weekDays.filter(day => day.complete).length;
  const completedTasks = weekDays.reduce((sum, day) => sum + day.completedTasks, 0);
  const totalTasks = weekDays.reduce((sum, day) => sum + day.totalTasks, 0);
  const completedMinutes = weekDays.reduce((sum, day) => sum + day.completedMinutes, 0);
  const japaneseMinutes = weekDays.reduce((sum, day) => sum + day.japaneseMinutes, 0);
  const englishMinutes = weekDays.reduce((sum, day) => sum + day.englishMinutes, 0);
  const reviewMinutes = weekDays.reduce((sum, day) => sum + day.reviewMinutes, 0);
  const languageMinutes = japaneseMinutes + englishMinutes;
  const japaneseRatio = languageMinutes ? Math.round(japaneseMinutes / languageMinutes * 100) : 0;
  const englishRatio = languageMinutes ? 100 - japaneseRatio : 0;
  const outputDays = weekDays.filter(day => day.diary).length;
  const wordCount = weekDays.reduce((sum, day) => sum + day.wordCount, 0);
  const recentRecords = recentSummaries
    .filter(day => day.hasActivity)
    .reverse()
    .slice(0, 10)
    .map(day => ({
      ...day,
      dateLabel: getDateLabel(day.date, todayString),
      statusText: day.complete ? '已完成' : '进行中',
      statusClass: day.complete ? 'complete' : 'active'
    }));
  const metrics = {
    activeDays,
    completedDays,
    completionRate: Math.round(completedDays / 7 * 100),
    completedTasks,
    totalTasks,
    completedMinutes,
    japaneseMinutes,
    englishMinutes,
    reviewMinutes,
    japaneseRatio,
    englishRatio,
    outputDays,
    wordCount,
    streak: calculateStreak(allDays, todayString)
  };

  return {
    ...metrics,
    rangeLabel: `${getShortDate(weekDates[0])} - ${getShortDate(todayString)}`,
    weekDays,
    recentRecords,
    insights: buildInsights(metrics)
  };
}

module.exports = {
  buildLearningReview,
  createDateRange,
  getDaySummary,
  getPlannerTasks
};
