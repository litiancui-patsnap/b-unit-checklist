const DAY_MODES = [
  {
    value: 'busy',
    label: '很忙',
    symbol: '◷',
    description: '先做最短的三项',
    routeLabel: '今日保底路线'
  },
  {
    value: 'normal',
    label: '正常',
    symbol: '●',
    description: '按计划主线推进',
    routeLabel: '今日标准路线'
  },
  {
    value: 'focused',
    label: '有时间',
    symbol: '✦',
    description: '优先完成高价值输出',
    routeLabel: '今日强化路线'
  }
];

function getOutputPriority(taskItem = {}) {
  if (taskItem.evidenceType === 'audio') return 0;
  if (taskItem.evidenceType === 'sentence' || taskItem.evidenceType === 'diary') return 1;
  if (taskItem.evidenceType === 'retell') return 2;
  return 3;
}

function buildTaskRoute(tasks = [], mode = 'normal') {
  const incompleteTasks = tasks.filter(item => !item.checked);
  const orderedTasks = [...incompleteTasks];
  if (mode === 'busy') {
    orderedTasks.sort((left, right) => left.minutes - right.minutes || getOutputPriority(left) - getOutputPriority(right));
  } else if (mode === 'focused') {
    orderedTasks.sort((left, right) => getOutputPriority(left) - getOutputPriority(right) || right.minutes - left.minutes);
  }
  const selectedMode = DAY_MODES.find(item => item.value === mode) || DAY_MODES[1];
  return {
    mainTask: orderedTasks[0] || null,
    nextTasks: orderedTasks.slice(1, 3),
    routeMinutes: orderedTasks.slice(0, 3).reduce((sum, item) => sum + Number(item.minutes || 0), 0),
    remainingTaskCount: incompleteTasks.length,
    remainingMinutes: incompleteTasks.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
    hiddenRouteCount: Math.max(0, incompleteTasks.length - 3),
    routeCompleted: incompleteTasks.length === 0,
    routeLabel: selectedMode.routeLabel,
    routeDescription: selectedMode.description
  };
}

function decorateDayModes(selectedMode, enabled) {
  return DAY_MODES.map(item => ({
    ...item,
    active: item.value === selectedMode,
    disabled: !enabled
  }));
}

module.exports = {
  DAY_MODES,
  buildTaskRoute,
  decorateDayModes,
  getOutputPriority
};
