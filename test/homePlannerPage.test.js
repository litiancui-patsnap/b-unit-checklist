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
    setData(patch) {
      Object.assign(this.data, patch);
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
assert.strictEqual(toastTitle, '仅今天的任务可进入学习');
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
      title: 'TED 跟读与口头复述'
    }
  }
});
assert.ok(navigatedUrl.startsWith('/pages/study/study?taskType=speak'));
assert.ok(storageData.days[today], 'opening an execution task should persist its planner day');

console.log('home planner page tests passed');
