const assert = require('assert');
const { getDefaultConfig } = require('../utils/defaultConfig.js');
const { getToday } = require('../utils/date.js');
const { getPlan } = require('../utils/planner.js');

const today = getToday();
const tasks = getPlan(today).tasks;
let capturedPage = null;
let switchedUrl = '';
const storageData = {
  config: {
    ...getDefaultConfig('daily', 'B'),
    hasOnboarded: true
  },
  days: {
    [today]: {
      diary: 'Today I finished one planned task.',
      words: [{ id: 'word_1', text: 'review' }],
      planner: {
        checked: { [tasks[0].id]: true },
        customTasks: [],
        complete: false
      }
    }
  },
  meta: { remind_last_shown_date: '' }
};

global.Page = page => {
  capturedPage = page;
};

global.wx = {
  getStorageSync() {
    return storageData;
  },
  setStorageSync() {},
  showToast() {},
  pageScrollTo() {},
  switchTab({ url }) {
    switchedUrl = url;
  },
  setClipboardData({ success }) {
    if (success) success();
  }
};

require('../pages/export/export.js');

const page = {
  ...capturedPage,
  data: JSON.parse(JSON.stringify(capturedPage.data)),
  setData(patch, callback) {
    Object.assign(this.data, patch);
    if (callback) callback();
  }
};

page.loadRecords();
assert.strictEqual(page.data.weekDays.length, 7);
assert.strictEqual(page.data.selectedDate, today);
assert.strictEqual(page.data.selectedDay.completedTasks, 1);
assert.strictEqual(page.data.outputDays, 1);
assert.strictEqual(page.data.wordCount, 1);
assert.ok(page.data.insights.length >= 3);
assert.ok(page.data.exportText.includes('语言学习复盘 / 周报'));
assert.ok(page.data.exportText.includes('本周计划完成'));
assert.strictEqual(page.data.totalDays, 1, 'empty calendar dates should not count as learning records');

page.goTodayPlan();
assert.strictEqual(switchedUrl, '/pages/home/home');

console.log('export review page tests passed');
