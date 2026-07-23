const assert = require('assert');
const { getDefaultConfig } = require('../utils/defaultConfig.js');
const { getToday } = require('../utils/date.js');

let capturedPage = null;
let toastTitle = '';
let navigatedUrl = '';
const config = getDefaultConfig('daily', 'B');
config.hasOnboarded = true;
let storageData = {
  config,
  days: {},
  meta: { remind_last_shown_date: '' }
};

global.Page = page => {
  capturedPage = page;
};

global.wx = {
  getStorageSync() {
    return storageData;
  },
  setStorageSync(key, value) {
    storageData = value;
  },
  showToast({ title }) {
    toastTitle = title;
  },
  navigateTo({ url }) {
    navigatedUrl = url;
  },
  redirectTo() {}
};

require('../pages/home/home.js');

function createPage(data = {}) {
  return {
    ...capturedPage,
    data: {
      ...capturedPage.data,
      ...data
    },
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback();
    }
  };
}

const lifecyclePage = createPage();
let loadCount = 0;
lifecyclePage.loadPlan = () => {
  loadCount++;
};
lifecyclePage.onLoad();
lifecyclePage.onShow();
assert.strictEqual(loadCount, 1, 'initial show should not reload the plan');

const pastPage = createPage({ selectedDate: '2026-07-18' });
pastPage.openTask({
  currentTarget: {
    dataset: {
      type: 'read',
      id: 'base_6_2',
      title: 'TED 精读与精听'
    }
  }
});
assert.strictEqual(toastTitle, '仅今天的任务可提交证据');
assert.strictEqual(navigatedUrl, '');

const today = getToday();
const todayPage = createPage({ selectedDate: today });
todayPage.currentDayData = {
  template: 'B',
  planner: {
    checked: {},
    customTasks: [],
    complete: false
  }
};
todayPage.openTask({
  currentTarget: {
    dataset: {
      type: 'speak',
      id: 'base_0_2',
      title: 'TED 跟读与口头复述',
      language: 'en'
    }
  }
});
assert.ok(navigatedUrl.startsWith('/pages/study/study?taskType=speak'));
assert.ok(storageData.days[today], 'opening an execution task should persist its planner day');

const routePage = createPage({ selectedDate: today });
routePage.loadPlan();
assert.strictEqual(routePage.data.dayMode, 'normal');
assert.strictEqual(routePage.data.mainTask.id, routePage.data.tasks[0].id);
assert.strictEqual(routePage.data.nextTasks.length, 2);
assert.strictEqual(routePage.data.showAllTasks, false);
routePage.selectDayMode({ currentTarget: { dataset: { mode: 'focused' } } });
assert.strictEqual(storageData.days[today].planner.dayMode, 'focused');
assert.strictEqual(routePage.data.dayMode, 'focused');
assert.ok(['audio', 'sentence', 'diary'].includes(routePage.data.mainTask.evidenceType), 'focused mode should prioritize visible output');
routePage.toggleAllTasks();
assert.strictEqual(routePage.data.showAllTasks, true);

const autoTask = routePage.data.tasks.find(item => item.language === 'en' && !item.checked);
storageData.meta.plannerAutoStartTask = { date: today, taskId: autoTask.id };
navigatedUrl = '';
const autoStartPage = createPage({ selectedDate: today });
autoStartPage.onShow();
assert.strictEqual(storageData.meta.plannerAutoStartTask, undefined, 'auto-start task should be consumed once');
assert.ok(navigatedUrl.includes(encodeURIComponent(autoTask.id)), 'home should automatically enter the prepared next task');

const evidencePage = createPage({
  selectedDate: today,
  tasks: [{
    id: 'base_2_0',
    title: '日语单词复习',
    language: 'jp',
    evidenceRequired: true,
    evidenceLabel: '回忆证据'
  }]
});
evidencePage.currentDayData = {
  planner: { checked: {}, customTasks: [], evidence: {}, complete: false }
};
evidencePage.currentPlanAdjustments = {};
evidencePage.currentPersonaId = 'dual_worker';
evidencePage.toggleTask({ currentTarget: { dataset: { id: 'base_2_0' } } });
assert.ok(navigatedUrl.startsWith('/pages/evidence/evidence?taskId=base_2_0'));
assert.strictEqual(evidencePage.currentDayData.planner.checked.base_2_0, undefined, 'evidence-required tasks cannot be checked directly');

const nextWeekStart = '2026-07-27';
storageData.meta.plannerAdjustments = {
  [nextWeekStart]: {
    weekStart: nextWeekStart,
    weekEnd: '2026-08-02',
    title: '减少负担，保留主线',
    mode: '聚焦关键任务',
    reason: '根据本周复盘生成',
    minuteScale: 0.8,
    englishBonusMinutes: 10,
    outputBonusMinutes: 0
  }
};
storageData.meta.plannerPreviewDate = nextWeekStart;
const previewPage = createPage();
const previewDate = previewPage.consumePlannerPreviewDate();
assert.strictEqual(previewDate, nextWeekStart);
assert.strictEqual(storageData.meta.plannerPreviewDate, undefined, 'preview date should be consumed once');
previewPage.setData({ selectedDate: previewDate });
previewPage.loadPlan();
assert.strictEqual(previewPage.data.planAdjustment.mode, '聚焦关键任务');
assert.strictEqual(previewPage.data.tasks[0].minutes, 40);
assert.strictEqual(previewPage.data.tasks[5].minutes, 50);
assert.strictEqual(previewPage.data.tasks[5].canExecute, false, 'future tasks should remain non-executable');

console.log('home planner page tests passed');
