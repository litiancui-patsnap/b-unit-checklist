const { getRecentDates } = require('./date.js');
const { getAllDays, getConfig } = require('./storage.js');
const { countCheckedByItems } = require('./checklist.js');
const { getGoalLabel, getIntensityLabel } = require('./defaultConfig.js');

function generateExportText(onlyCompleted = false) {
  const dates = getRecentDates(30);
  const recent7Dates = getRecentDates(7);
  const allDays = getAllDays();
  const config = getConfig();

  const weeklyCompletedCount = recent7Dates.filter(date => allDays[date]?.complete).length;
  const weeklyDiaryCount = recent7Dates.filter(date => (allDays[date]?.diary || '').trim()).length;

  let text = '英语学习记录 / 周报\n';
  text += '='.repeat(40) + '\n\n';
  text += `学习目标：${getGoalLabel(config.learningGoal)}\n`;
  text += `默认强度：${getIntensityLabel(config.dailyIntensity)}\n`;
  text += `本周完成：${weeklyCompletedCount}/7 天\n`;
  text += `本周英文日记：${weeklyDiaryCount} 句\n\n`;
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
    const completeStatus = dayData.complete ? '✅' : '—';

    const startTotal = config.startChecklist.length;
    const startChecked = countCheckedByItems(dayData.start, config.startChecklist);

    let itemsTotal = 0;
    let itemsChecked = 0;
    if (template !== '-' && config.templates[template]) {
      itemsTotal = config.templates[template].items.length;
      itemsChecked = countCheckedByItems(dayData.items, config.templates[template].items);
    }

    text += `${date}  强度:${intensity}  完成:${completeStatus}  准备:${startChecked}/${startTotal}  任务:${itemsChecked}/${itemsTotal}\n`;
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

module.exports = {
  generateExportText
};
