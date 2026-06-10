const { getRecentDates } = require('./date.js');
const { getAllDays, getConfig } = require('./storage.js');
const { countCheckedByItems } = require('./checklist.js');
const { TASK_TYPES, getGoalLabel, getIntensityLabel, getTaskTypeLabel } = require('./defaultConfig.js');
const { collectWordsFromDays, getSceneStats } = require('./learning.js');

function generateExportText(onlyCompleted = false) {
  const dates = getRecentDates(30);
  const recent7Dates = getRecentDates(7);
  const allDays = getAllDays();
  const config = getConfig();

  const weeklyCompletedCount = recent7Dates.filter(date => allDays[date]?.complete).length;
  const weeklyDiaryCount = recent7Dates.filter(date => (allDays[date]?.diary || '').trim()).length;
  const weeklyWordAddedCount = recent7Dates.reduce((sum, date) => sum + (allDays[date]?.words || []).length, 0);
  const recent7DateSet = new Set(recent7Dates);
  const weeklyWordReviewedCount = collectWordsFromDays(allDays).filter(word => recent7DateSet.has(word.lastReviewedDate)).length;
  const weeklySceneLineCount = recent7Dates.reduce((sum, date) => sum + getSceneStats(allDays[date]?.scenePractice || {}).completedLines, 0);
  const weeklyContentCount = recent7Dates.reduce((sum, date) => {
    const checks = allDays[date]?.contentChecks || {};
    return sum + Object.keys(checks).filter(key => checks[key]).length;
  }, 0);
  const weeklyQuizCount = recent7Dates.filter(date => allDays[date]?.quiz?.completed).length;
  const weeklyRescueCount = recent7Dates.filter(date => allDays[date]?.rescue?.enabled).length;
  const weeklyTypeStats = getWeeklyTypeStats(recent7Dates, allDays, config);

  let text = '英语学习记录 / 周报\n';
  text += '='.repeat(40) + '\n\n';
  text += `学习目标：${getGoalLabel(config.learningGoal)}\n`;
  text += `默认强度：${getIntensityLabel(config.dailyIntensity)}\n`;
  text += `本周完成：${weeklyCompletedCount}/7 天\n`;
  text += `本周英文日记：${weeklyDiaryCount} 句\n\n`;
  text += `本周新增单词：${weeklyWordAddedCount} 个\n`;
  text += `本周复习单词：${weeklyWordReviewedCount} 个\n`;
  text += `本周内容学习：${weeklyContentCount} 项\n`;
  text += `本周场景跟读：${weeklySceneLineCount} 句\n`;
  text += `本周单词小测：${weeklyQuizCount} 天\n`;
  text += `本周轻量补救：${weeklyRescueCount} 天\n`;
  text += `本周类型完成：${formatTypeStats(weeklyTypeStats)}\n\n`;
  text += '最近30天记录\n';
  text += '-'.repeat(40) + '\n';

  let totalCount = 0;
  let completedCount = 0;

  dates.reverse().forEach(date => {
    const dayData = allDays[date];

    if (!dayData) {
      if (!onlyCompleted) {
        text += `${date}  强度:-  完成:—  准备:0/0  任务:0/0\n`;
        totalCount++;
      }
      return;
    }

    if (onlyCompleted && !dayData.complete) {
      return;
    }

    const template = dayData.template || '-';
    const intensity = template === '-' ? '-' : getIntensityLabel(template);
    const completeStatus = dayData.rescue?.enabled ? '补救' : (dayData.complete ? '✅' : '—');

    const startTotal = config.startChecklist.length;
    const startChecked = countCheckedByItems(dayData.start, config.startChecklist);

    let itemsTotal = 0;
    let itemsChecked = 0;
    if (template !== '-' && config.templates[template]) {
      itemsTotal = config.templates[template].items.length;
      itemsChecked = countCheckedByItems(dayData.items, config.templates[template].items);
    }

    const wordCount = (dayData.words || []).length;
    const sceneStats = getSceneStats(dayData.scenePractice || {});
    const contentCount = Object.keys(dayData.contentChecks || {}).filter(key => dayData.contentChecks[key]).length;
    const quizText = dayData.quiz?.completed ? `${dayData.quiz.score || 0}` : '-';

    text += `${date}  强度:${intensity}  完成:${completeStatus}  准备:${startChecked}/${startTotal}  任务:${itemsChecked}/${itemsTotal}  内容:${contentCount}  单词:${wordCount}  跟读:${sceneStats.completedLines}  小测:${quizText}\n`;
    if ((dayData.diary || '').trim()) {
      text += `  英文日记：${dayData.diary.trim()}\n`;
    }
    totalCount++;
    if (dayData.complete) {
      completedCount++;
    }
  });

  text += '\n' + '='.repeat(40) + '\n';
  text += `统计：共 ${totalCount} 天记录，已完成 ${completedCount} 天\n`;
  text += '导出时间: ' + new Date().toLocaleString('zh-CN') + '\n';

  return {
    text,
    totalCount,
    completedCount
  };
}

function getWeeklyTypeStats(dates, allDays, config) {
  const stats = {};
  TASK_TYPES.forEach(type => {
    stats[type.value] = 0;
  });

  dates.forEach(date => {
    const dayData = allDays[date];
    const template = config.templates[dayData?.template];
    if (!dayData || !template) {
      return;
    }

    const completedTypes = new Set();
    (template.items || []).forEach(item => {
      if (dayData.items?.[item.id]) {
        completedTypes.add(item.type || 'word');
      }
    });

    completedTypes.forEach(type => {
      if (Object.prototype.hasOwnProperty.call(stats, type)) {
        stats[type]++;
      }
    });
  });

  return stats;
}

function formatTypeStats(stats) {
  return TASK_TYPES
    .map(type => `${getTaskTypeLabel(type.value)}${stats[type.value] || 0}天`)
    .join('、');
}

module.exports = {
  generateExportText
};
