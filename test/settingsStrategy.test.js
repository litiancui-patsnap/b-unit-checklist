const assert = require('assert');
const { getDefaultConfig } = require('../utils/defaultConfig.js');

let capturedPage = null;
let switchedUrl = '';
let healthAvailable = true;
let healthRequest = null;
let storageData = {
  config: {
    ...getDefaultConfig('daily', 'B'),
    hasOnboarded: true
  },
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
  showToast() {},
  showModal() {},
  request(options) {
    healthRequest = options;
    if (healthAvailable) {
      options.success({ statusCode: 200, data: { ok: true } });
    } else {
      options.fail({ errMsg: 'request:fail timeout' });
    }
  },
  switchTab({ url }) {
    switchedUrl = url;
  }
};

require('../pages/settings/settings.js');

const page = {
  ...capturedPage,
  data: JSON.parse(JSON.stringify(capturedPage.data)),
  setData(patch, callback) {
    Object.assign(this.data, patch);
    if (callback) callback();
  }
};

(async () => {
  page.loadConfig();
  assert.strictEqual(page.data.selectedGoalLabel, '日常英语');
  assert.strictEqual(page.data.selectedIntensityLabel, '标准');
  assert.strictEqual(page.data.strategyTaskCount, storageData.config.templates.B.items.length);
  assert.strictEqual(page.data.planPreviews.find(item => item.active).key, 'B');

  await page.checkAIService();
  assert.strictEqual(page.data.aiServiceStatusClass, 'enabled');
  assert.ok(page.data.aiServiceStatusText.includes('服务正常'));
  assert.strictEqual(healthRequest.url, 'https://b-unit-checklist-main.vercel.app/health');

  healthAvailable = false;
  await page.checkAIService();
  assert.strictEqual(page.data.aiServiceStatusClass, 'offline');
  assert.ok(page.data.aiServiceStatusText.includes('本地内容'));

  page.selectLearningGoal({ currentTarget: { dataset: { index: 1 } } });
  assert.strictEqual(page.data.learningGoal, 'spoken');
  assert.ok(page.data.templateB.title.includes('口语表达'));
  assert.strictEqual(page.data.selectedGoalLabel, '口语表达');

  page.selectDailyIntensity({ currentTarget: { dataset: { index: 2 } } });
  assert.strictEqual(page.data.dailyIntensity, 'C');
  assert.strictEqual(page.data.planPreviews.find(item => item.active).key, 'C');

  page.selectStudyPersona({ currentTarget: { dataset: { persona: 'jlpt_business' } } });
  assert.strictEqual(page.data.studyPersona, 'jlpt_business');

  healthAvailable = true;
  page.saveConfig();
  assert.strictEqual(storageData.config.learningGoal, 'spoken');
  assert.strictEqual(storageData.config.dailyIntensity, 'C');
  assert.strictEqual(storageData.config.studyPersona, 'jlpt_business');
  assert.ok(storageData.config.templates.C.title.includes('口语表达'));

  page.goTodayPlan();
  assert.strictEqual(switchedUrl, '/pages/home/home');

  console.log('settings strategy tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
