const { calculateStreak, getPlan, getWeekStart, isTaskComplete, shiftDate } = require('./planner.js');

function getPlannerTasks(dateString, dayData = {}, adjustments = {}, personaId = 'dual_worker') {
  const customTasks = dayData?.planner?.customTasks || [];
  return [...getPlan(dateString, adjustments, personaId).tasks, ...customTasks];
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

function getDaySummary(dateString, dayData = null, adjustments = {}, personaId = 'dual_worker') {
  const safeDayData = dayData || {};
  const plan = getPlan(dateString, adjustments, personaId);
  const tasks = getPlannerTasks(dateString, safeDayData, adjustments, personaId);
  const checked = getCheckedMap(safeDayData);
  const evidence = safeDayData?.planner?.evidence || {};
  const completedTasks = tasks.filter(task => isTaskComplete(task, safeDayData, dateString));
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
    evidenceCount: completedTasks.filter(task => evidence[task.id]).length,
    tasks: tasks.map(task => ({
      ...task,
      checked: isTaskComplete(task, safeDayData, dateString),
      hasEvidence: Boolean(evidence[task.id]),
      evidence: evidence[task.id] || null
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

  if (metrics.mostSkippedTask) {
    insights.push({
      tone: 'warning',
      title: `最常跳过：${metrics.mostSkippedTask.title}`,
      description: `${metrics.mostSkippedTask.summary}，跳过率 ${metrics.mostSkippedTask.skipRate}%。生成下周方案时会优先缩短或替换它。`
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

  if (metrics.completedTasks > 0 && metrics.evidenceRate < 60) {
    insights.push({
      tone: 'warning',
      title: '完成记录还缺少结果证据',
      description: `本周 ${metrics.completedTasks} 个已完成任务中有 ${metrics.evidenceCount} 个留下证据。录音、造句、复述或回忆记录会让复盘更可信。`
    });
  } else if (metrics.evidenceCount > 0) {
    insights.push({
      tone: 'success',
      title: '学习结果已经可验证',
      description: `本周留下 ${metrics.evidenceCount} 份学习证据，完成记录不再只是勾选。`
    });
  }

  return insights;
}

function getSkippedTaskStats(allDays = {}, todayString, adjustments = {}, personaId = 'dual_worker') {
  const stats = {};
  createDateRange(todayString, 28).forEach(date => {
    const dayData = allDays[date];
    if (!dayData) return;
    const checked = getCheckedMap(dayData);
    const hasPlannerAction = Object.values(checked).some(Boolean) || Object.keys(dayData?.planner?.evidence || {}).length > 0;
    if (!hasPlannerAction && !hasLegacyActivity(dayData)) return;
    getPlan(date, adjustments, personaId).tasks.forEach(task => {
      const current = stats[task.id] || {
        id: task.id,
        title: task.title,
        language: task.language,
        minutes: task.minutes,
        executionType: task.executionType,
        evidenceType: task.evidenceType,
        planned: 0,
        completed: 0,
        skipped: 0
      };
      current.planned += 1;
      if (isTaskComplete(task, dayData, date)) {
        current.completed += 1;
      } else {
        current.skipped += 1;
      }
      stats[task.id] = current;
    });
  });

  return Object.values(stats)
    .filter(item => item.planned >= 2 && item.skipped > 0)
    .map(item => ({
      ...item,
      skipRate: Math.round(item.skipped / item.planned * 100),
      summary: `${item.planned} 次计划中跳过 ${item.skipped} 次`
    }))
    .sort((left, right) => right.skipRate - left.skipRate || right.skipped - left.skipped || right.minutes - left.minutes);
}

function buildLearningReview(allDays = {}, todayString, adjustments = {}, personaId = 'dual_worker') {
  const weekDates = createDateRange(todayString, 7);
  const weekDays = weekDates.map(date => {
    const summary = getDaySummary(date, allDays[date], adjustments, personaId);
    return {
      ...summary,
      weekday: getWeekdayLabel(date),
      shortDate: getShortDate(date),
      dateLabel: getDateLabel(date, todayString),
      isToday: date === todayString
    };
  });
  const recentDates = createDateRange(todayString, 30);
  const recentSummaries = recentDates.map(date => getDaySummary(date, allDays[date], adjustments, personaId));
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
  const evidenceCount = weekDays.reduce((sum, day) => sum + day.evidenceCount, 0);
  const skippedTasks = getSkippedTaskStats(allDays, todayString, adjustments, personaId);
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
    evidenceCount,
    evidenceRate: completedTasks ? Math.round(evidenceCount / completedTasks * 100) : 0,
    skippedTasks,
    mostSkippedTask: skippedTasks[0] || null,
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

function getNextWeekStart(todayString) {
  const weekday = new Date(`${todayString}T00:00:00`).getDay();
  const offset = weekday === 0 ? 1 : 8 - weekday;
  return shiftDate(todayString, offset);
}

function getWeekMinutes(weekStart, adjustments = {}, personaId = 'dual_worker') {
  return Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index))
    .reduce((sum, date) => sum + getPlan(date, adjustments, personaId).tasks.reduce((taskSum, task) => taskSum + task.minutes, 0), 0);
}

function getAdaptiveOverride(skippedTask) {
  const shouldReplace = skippedTask.skipped >= 3 && skippedTask.skipRate >= 75;
  if (!shouldReplace) {
    return {
      action: 'lower',
      minuteScale: 0.6,
      note: `过去 28 天跳过率 ${skippedTask.skipRate}%，已缩短为轻量版`
    };
  }

  const replacements = {
    audio: {
      title: `轻量录音：${skippedTask.title}`,
      minutes: Math.min(20, skippedTask.minutes),
      resource: '只选 20～30 秒片段',
      executionType: 'speak'
    },
    sentence: {
      title: `轻量造句：用今天内容写 2 句`,
      minutes: Math.min(15, skippedTask.minutes),
      resource: '学习日志',
      executionType: 'write'
    },
    diary: {
      title: '轻量日记：只写 2 句',
      minutes: Math.min(15, skippedTask.minutes),
      resource: '学习日志',
      executionType: 'write'
    },
    recall: {
      title: `轻量回忆：${skippedTask.title}`,
      minutes: Math.min(15, skippedTask.minutes),
      resource: '闭卷回忆 3 个要点',
      executionType: 'word'
    },
    retell: {
      title: `轻量复述：${skippedTask.title}`,
      minutes: Math.min(20, skippedTask.minutes),
      resource: '只处理一个最小片段',
      executionType: skippedTask.executionType || 'read'
    }
  };
  return {
    action: 'replace',
    replacement: replacements[skippedTask.evidenceType] || replacements.retell,
    note: `连续跳过 ${skippedTask.skipped} 次，已主动替换为更小动作`
  };
}

function generateNextWeekAdjustment(allDays = {}, todayString, adjustments = {}, personaId = 'dual_worker') {
  const review = buildLearningReview(allDays, todayString, adjustments, personaId);
  const weekStart = getNextWeekStart(todayString);
  const weekEnd = shiftDate(weekStart, 6);
  let minuteScale = 1;
  let mode = '稳定推进';
  let title = '保持当前节奏';
  let reason = '最近一周完成节奏较稳定，下周不增加额外任务，继续巩固已有动作。';

  if (review.completedDays <= 2) {
    minuteScale = 0.75;
    mode = '减负保连续';
    title = '先把计划缩小，再恢复连续性';
    reason = `最近 7 天完成 ${review.completedDays} 天，当前计划可能偏重。下周先降低单项时长，优先恢复连续学习。`;
  } else if (review.completedDays <= 4) {
    minuteScale = 0.9;
    mode = '聚焦关键任务';
    title = '减少负担，保留主线';
    reason = `最近 7 天完成 ${review.completedDays} 天，已经有基础节奏。下周小幅减负，把注意力放在真正能完成的任务上。`;
  } else if (review.completedDays >= 6) {
    mode = '稳定强化';
    title = '保持总量，增加有效输出';
    reason = `最近 7 天完成 ${review.completedDays} 天，节奏稳定。下周保持任务总量，只增强英语输出质量。`;
  }

  const englishBonusMinutes = review.englishRatio < 20 ? 10 : 0;
  const outputBonusMinutes = review.outputDays === 0 ? 5 : 0;
  const adaptiveTasks = review.skippedTasks.slice(0, 2);
  const taskOverrides = Object.fromEntries(adaptiveTasks.map(item => [item.id, getAdaptiveOverride(item)]));
  const changes = [];
  adaptiveTasks.forEach(item => {
    const override = taskOverrides[item.id];
    changes.push(override.action === 'replace'
      ? `“${item.title}”常被跳过，下周替换为轻量动作`
      : `“${item.title}”跳过率 ${item.skipRate}%，下周时长降低 40%`);
  });
  if (minuteScale < 1) {
    changes.push(`各任务时长整体下调约 ${Math.round((1 - minuteScale) * 100)}%`);
  }
  if (englishBonusMinutes) {
    changes.push('每天的英语任务增加 10 分钟，避免英语只停留在计划中');
  }
  if (outputBonusMinutes) {
    changes.push('口语或写作任务增加 5 分钟，补上可见输出');
  }
  if (!changes.length) {
    changes.push('保持当前任务结构和时长，不额外增加学习材料');
  }

  const adjustment = {
    id: `adjustment_${weekStart}`,
    weekStart,
    weekEnd,
    generatedAt: Date.now(),
    sourceRange: review.rangeLabel,
    mode,
    title,
    reason,
    minuteScale,
    englishBonusMinutes,
    outputBonusMinutes,
    taskOverrides,
    adaptiveTasks,
    targetDays: Math.min(7, Math.max(3, review.completedDays + 1)),
    changes
  };
  const adjustmentMap = {
    ...adjustments,
    [weekStart]: adjustment
  };
  const originalMinutes = getWeekMinutes(weekStart, {}, personaId);
  const adjustedMinutes = getWeekMinutes(weekStart, adjustmentMap, personaId);

  return {
    ...adjustment,
    originalMinutes,
    adjustedMinutes,
    minuteDifference: adjustedMinutes - originalMinutes,
    rangeLabel: `${weekStart.slice(5).replace('-', '/')} - ${weekEnd.slice(5).replace('-', '/')}`,
    applied: false
  };
}

module.exports = {
  buildLearningReview,
  createDateRange,
  generateNextWeekAdjustment,
  getDaySummary,
  getNextWeekStart,
  getPlannerTasks,
  getSkippedTaskStats,
  getWeekStart
};
