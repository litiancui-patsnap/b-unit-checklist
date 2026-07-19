const assert = require('assert');
const {
  calculateStreak,
  getPlan,
  getWeek,
  shiftDate
} = require('../utils/planner.js');

const sundayPlan = getPlan('2026-07-19');
assert.strictEqual(sundayPlan.focus, '巩固与检测');
assert.strictEqual(sundayPlan.dayType, '周末 · 8 小时计划');
assert.strictEqual(sundayPlan.tasks.length, 6);
assert.strictEqual(
  sundayPlan.tasks.reduce((sum, item) => sum + item.minutes, 0),
  480
);
assert.strictEqual(sundayPlan.tasks[2].executionType, 'speak');

const week = getWeek('2026-07-19', {
  '2026-07-18': { planner: { complete: true } },
  '2026-07-19': { planner: { complete: false } }
});
assert.strictEqual(week[0].date, '2026-07-13');
assert.strictEqual(week[6].date, '2026-07-19');
assert.strictEqual(week[5].complete, true);
assert.strictEqual(week[6].active, true);

assert.strictEqual(shiftDate('2026-07-19', -1), '2026-07-18');
assert.strictEqual(calculateStreak({
  '2026-07-19': { planner: { complete: true } },
  '2026-07-18': { complete: true },
  '2026-07-17': { planner: { complete: false } }
}, '2026-07-19'), 2);

console.log('planner tests passed');
