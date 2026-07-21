const assert = require('assert');
const { buildLearningReview, generateNextWeekAdjustment, getDaySummary } = require('../utils/learningInsights.js');
const { getPlan } = require('../utils/planner.js');

const today = '2026-07-21';
const yesterday = '2026-07-20';
const yesterdayTasks = getPlan(yesterday).tasks;
const todayTasks = getPlan(today).tasks;

const allDays = {
  [yesterday]: {
    complete: true,
    planner: {
      checked: Object.fromEntries(yesterdayTasks.map(task => [task.id, true])),
      customTasks: [],
      complete: true
    }
  },
  [today]: {
    diary: 'Today I reviewed one useful sentence.',
    words: [{ id: 'word_1', text: 'steady' }],
    planner: {
      checked: {
        [todayTasks[0].id]: true,
        [todayTasks[5].id]: true,
        custom_1: true
      },
      evidence: {
        [todayTasks[0].id]: { type: todayTasks[0].evidenceType, createdAt: Date.now() },
        [todayTasks[5].id]: { type: todayTasks[5].evidenceType, createdAt: Date.now() }
      },
      customTasks: [
        { id: 'custom_1', title: '英语复述', language: 'en', minutes: 15, resource: '学习日志' }
      ],
      complete: false
    }
  }
};

const todaySummary = getDaySummary(today, allDays[today]);
assert.strictEqual(todaySummary.totalTasks, 7);
assert.strictEqual(todaySummary.completedTasks, 3);
assert.strictEqual(todaySummary.completedMinutes, todayTasks[0].minutes + todayTasks[5].minutes + 15);
assert.strictEqual(todaySummary.englishMinutes, todayTasks[5].minutes + 15);
assert.strictEqual(todaySummary.japaneseMinutes, todayTasks[0].minutes);
assert.strictEqual(todaySummary.complete, false);
assert.strictEqual(todaySummary.hasActivity, true);

const review = buildLearningReview(allDays, today);
assert.strictEqual(review.weekDays.length, 7);
assert.strictEqual(review.weekDays[6].date, today);
assert.strictEqual(review.activeDays, 2);
assert.strictEqual(review.completedDays, 1);
assert.strictEqual(review.completedTasks, yesterdayTasks.length + 3);
assert.strictEqual(review.completedMinutes, yesterdayTasks.reduce((sum, task) => sum + task.minutes, 0) + todaySummary.completedMinutes);
assert.strictEqual(review.outputDays, 1);
assert.strictEqual(review.wordCount, 1);
assert.strictEqual(review.streak, 0, 'today is in progress, so the current streak has not started');
assert.ok(review.insights.length >= 3);
assert.strictEqual(review.recentRecords[0].date, today);

const emptyReview = buildLearningReview({}, today);
assert.strictEqual(emptyReview.activeDays, 0);
assert.strictEqual(emptyReview.completedDays, 0);
assert.strictEqual(emptyReview.insights[0].title, '先完成今天第一项');

const adjustment = generateNextWeekAdjustment({}, today);
assert.strictEqual(adjustment.weekStart, '2026-07-27');
assert.strictEqual(adjustment.weekEnd, '2026-08-02');
assert.strictEqual(adjustment.mode, '减负保连续');
assert.strictEqual(adjustment.minuteScale, 0.75);
assert.strictEqual(adjustment.englishBonusMinutes, 10);
assert.strictEqual(adjustment.outputBonusMinutes, 5);
assert.ok(adjustment.changes.length >= 3);
assert.ok(adjustment.adjustedMinutes > 0);

const repeatedSkipDays = {};
['2026-06-30', '2026-07-07', '2026-07-14', '2026-07-21'].forEach(date => {
  const tasks = getPlan(date).tasks;
  repeatedSkipDays[date] = {
    planner: {
      checked: Object.fromEntries(tasks.map((task, index) => [task.id, index !== 0])),
      customTasks: [],
      evidence: Object.fromEntries(tasks.slice(1).map(task => [task.id, {
        type: task.evidenceType,
        createdAt: Date.now()
      }])),
      complete: false
    }
  };
});
const skipReview = buildLearningReview(repeatedSkipDays, today);
assert.strictEqual(skipReview.mostSkippedTask.id, 'base_2_0');
assert.strictEqual(skipReview.mostSkippedTask.skipRate, 100);
assert.strictEqual(skipReview.mostSkippedTask.skipped, 4);

const adaptiveAdjustment = generateNextWeekAdjustment(repeatedSkipDays, today);
assert.strictEqual(adaptiveAdjustment.taskOverrides.base_2_0.action, 'replace');
assert.ok(adaptiveAdjustment.changes.some(change => change.includes('日语单词复习')));
const adaptivePlan = getPlan('2026-07-28', {
  [adaptiveAdjustment.weekStart]: adaptiveAdjustment
});
assert.strictEqual(adaptivePlan.tasks[0].adaptiveAction, 'replace');
assert.ok(adaptivePlan.tasks[0].title.includes('轻量回忆'));

console.log('learning insights tests passed');
