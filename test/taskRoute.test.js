const assert = require('assert');
const { buildTaskRoute, decorateDayModes } = require('../utils/taskRoute.js');

const tasks = [
  { id: 'recall', title: '回忆', minutes: 30, evidenceType: 'recall', checked: false },
  { id: 'audio', title: '录音', minutes: 35, evidenceType: 'audio', checked: false },
  { id: 'short', title: '短任务', minutes: 10, evidenceType: 'retell', checked: false },
  { id: 'done', title: '已完成', minutes: 20, evidenceType: 'sentence', checked: true }
];

const normalRoute = buildTaskRoute(tasks, 'normal');
assert.strictEqual(normalRoute.mainTask.id, 'recall');
assert.strictEqual(normalRoute.remainingTaskCount, 3);
assert.strictEqual(normalRoute.routeMinutes, 75);

const busyRoute = buildTaskRoute(tasks, 'busy');
assert.strictEqual(busyRoute.mainTask.id, 'short');

const focusedRoute = buildTaskRoute(tasks, 'focused');
assert.strictEqual(focusedRoute.mainTask.id, 'audio');

const completedRoute = buildTaskRoute(tasks.map(task => ({ ...task, checked: true })), 'normal');
assert.strictEqual(completedRoute.routeCompleted, true);
assert.strictEqual(completedRoute.mainTask, null);

const modes = decorateDayModes('focused', false);
assert.strictEqual(modes.find(mode => mode.value === 'focused').active, true);
assert.ok(modes.every(mode => mode.disabled));

console.log('task route tests passed');
