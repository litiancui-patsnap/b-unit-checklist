const assert = require('assert');
const { getDefaultConfig } = require('../utils/defaultConfig.js');
const { getPlan } = require('../utils/planner.js');

const date = '2026-07-21';
const task = getPlan(date).tasks[0];
const audioDate = '2026-07-22';
const audioTask = getPlan(audioDate).tasks.find(item => item.evidenceType === 'audio');
let capturedPage = null;
let navigatedBackDelta = 0;
let toastTitle = '';
let storageData = {
  config: {
    ...getDefaultConfig('daily', 'B'),
    hasOnboarded: true
  },
  days: {
    [date]: {
      planner: {
        checked: {},
        customTasks: [],
        evidence: {},
        complete: false
      }
    },
    [audioDate]: {
      planner: {
        checked: {},
        customTasks: [],
        evidence: {},
        complete: false
      }
    }
  },
  meta: { remind_last_shown_date: '' }
};

const recorderHandlers = {};
const recorderManager = {
  onStart(callback) { recorderHandlers.start = callback; },
  onStop(callback) { recorderHandlers.stop = callback; },
  onError(callback) { recorderHandlers.error = callback; },
  start() { recorderHandlers.start(); },
  stop() { recorderHandlers.stop({ tempFilePath: '/tmp/result.mp3', duration: 24000 }); }
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
  getRecorderManager() {
    return recorderManager;
  },
  navigateBack({ delta = 1 } = {}) {
    navigatedBackDelta = delta;
  }
};

const originalSetTimeout = global.setTimeout;
global.setTimeout = callback => callback();

require('../pages/evidence/evidence.js');

const page = {
  ...capturedPage,
  data: JSON.parse(JSON.stringify(capturedPage.data)),
  setData(patch) {
    Object.assign(this.data, patch);
  }
};

page.onLoad({ taskId: encodeURIComponent(task.id), date, returnDelta: '1' });
assert.strictEqual(page.data.task.id, task.id);
assert.strictEqual(page.data.evidenceType, 'recall');
page.onEvidenceInput({ detail: { value: '能闭卷回忆三个重点单词' } });
page.submitEvidence();

assert.strictEqual(toastTitle, '证据已保存，任务完成');
assert.strictEqual(navigatedBackDelta, 1);
assert.strictEqual(storageData.days[date].planner.checked[task.id], true);
assert.strictEqual(storageData.days[date].planner.evidence[task.id].type, 'recall');
assert.strictEqual(storageData.days[date].planner.evidence[task.id].text, '能闭卷回忆三个重点单词');

const audioPage = {
  ...capturedPage,
  data: JSON.parse(JSON.stringify(capturedPage.data)),
  setData(patch) {
    Object.assign(this.data, patch);
  }
};
audioPage.onLoad({ taskId: encodeURIComponent(audioTask.id), date: audioDate, returnDelta: '2' });
assert.strictEqual(audioPage.data.evidenceType, 'audio');
audioPage.startRecording();
assert.strictEqual(audioPage.data.isRecording, true);
audioPage.stopRecording();
assert.strictEqual(audioPage.data.audioPath, '/tmp/result.mp3');
assert.strictEqual(audioPage.data.audioDurationText, '24 秒');
audioPage.submitEvidence();
assert.strictEqual(storageData.days[audioDate].planner.checked[audioTask.id], true);
assert.strictEqual(storageData.days[audioDate].planner.evidence[audioTask.id].audioDuration, 24000);
assert.strictEqual(navigatedBackDelta, 2);

global.setTimeout = originalSetTimeout;
console.log('evidence page tests passed');
