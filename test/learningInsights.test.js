const assert = require('assert');
const { buildLearningReview, getDaySummary } = require('../utils/learningInsights.js');
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

console.log('learning insights tests passed');
