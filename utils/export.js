const { getRecentDates } = require('./date.js');
const { getAllDays, getConfig } = require('./storage.js');

function generateExportText(onlyCompleted = false) {
  const dates = getRecentDates(30);
  const allDays = getAllDays();
  const config = getConfig();

  let text = '备考打勾清单 - 最近30天\n';
  text += '='.repeat(40) + '\n\n';

  dates.reverse().forEach(date => {
    const dayData = allDays[date];

    if (!dayData) {
      if (!onlyCompleted) {
        text += `${date}  模板:-  完成:—  启动:0/0  清单:0/0\n`;
      }
      return;
    }

    if (onlyCompleted && !dayData.complete) {
      return;
    }

    const template = dayData.template || '-';
    const completeStatus = dayData.complete ? '✅' : '—';

    const startTotal = config.startChecklist.length;
    const startChecked = Object.values(dayData.start || {}).filter(Boolean).length;

    let itemsTotal = 0;
    let itemsChecked = 0;
    if (template !== '-' && config.templates[template]) {
      itemsTotal = config.templates[template].items.length;
      itemsChecked = Object.values(dayData.items || {}).filter(Boolean).length;
    }

    text += `${date}  模板:${template}  完成:${completeStatus}  启动:${startChecked}/${startTotal}  清单:${itemsChecked}/${itemsTotal}\n`;
  });

  text += '\n' + '='.repeat(40) + '\n';
  text += '导出时间: ' + new Date().toLocaleString('zh-CN') + '\n';

  return text;
}

module.exports = {
  generateExportText
};
