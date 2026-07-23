const { getAllDays, getConfig, getDayData, getMeta, setDayData, setMeta } = require('../../utils/storage.js');
const {
  addTaskEvidence,
  calculateStreak,
  getPlan,
  getWeekStart,
  isTaskComplete,
  shiftDate,
  updatePlannerCompletion
} = require('../../utils/planner.js');
const { buildTaskRoute } = require('../../utils/taskRoute.js');

const RESULT_PRESENTATIONS = {
  audio: { icon: '🎙', title: '完成一次可回听输出', tone: 'audio' },
  sentence: { icon: '✍', title: '留下自己的表达', tone: 'sentence' },
  diary: { icon: '▤', title: '保存一页学习日记', tone: 'diary' },
  recall: { icon: '◈', title: '完成一次闭卷回忆', tone: 'recall' },
  retell: { icon: '◌', title: '完成一次脱稿复述', tone: 'retell' }
};

function createPlannerState(dayData = {}) {
  return {
    ...dayData,
    planner: {
      checked: {},
      customTasks: [],
      evidence: {},
      complete: false,
      ...(dayData.planner || {})
    }
  };
}

function formatDuration(duration = 0) {
  const seconds = Math.max(0, Math.round(Number(duration || 0) / 1000));
  return `${seconds} 秒`;
}

function getEvidenceSummary(evidence = {}) {
  if (evidence.type === 'audio') {
    return `${formatDuration(evidence.audioDuration)}录音 · 可以随时回听`;
  }
  const text = String(evidence.text || '').replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function countWeekEvidence(allDays = {}, dateString) {
  const weekStart = getWeekStart(dateString);
  return Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index))
    .reduce((sum, date) => sum + Object.keys(allDays[date]?.planner?.evidence || {}).length, 0);
}

Page({
  data: {
    date: '',
    taskId: '',
    task: null,
    evidenceType: '',
    evidenceLabel: '',
    evidencePrompt: '',
    evidenceText: '',
    audioPath: '',
    audioDuration: 0,
    audioDurationText: '',
    isRecording: false,
    hasExistingEvidence: false,
    returnDelta: 1,
    canRecord: true,
    saving: false,
    showSuccess: false,
    resultCard: null,
    nextTask: null,
    hasNextTask: false
  },

  onLoad(options = {}) {
    const date = options.date || '';
    const taskId = decodeURIComponent(options.taskId || '');
    const returnDelta = Math.max(1, Number(options.returnDelta || 1));
    const config = getConfig();
    const meta = getMeta();
    const dayData = createPlannerState(getDayData(date) || {});
    const planTasks = getPlan(date, meta.plannerAdjustments || {}, config.studyPersona || 'dual_worker').tasks;
    const tasks = [...planTasks, ...(dayData.planner.customTasks || [])].map(addTaskEvidence);
    const task = tasks.find(item => item.id === taskId);
    if (!date || !task) {
      wx.showToast({ title: '未找到对应任务', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }

    const existing = dayData.planner.evidence?.[taskId] || {};
    this.dayData = dayData;
    this.config = config;
    this.adjustments = meta.plannerAdjustments || {};
    this.setData({
      date,
      taskId,
      task,
      evidenceType: task.evidenceType,
      evidenceLabel: task.evidenceLabel,
      evidencePrompt: task.evidencePrompt,
      evidenceText: existing.text || '',
      audioPath: existing.audioPath || '',
      audioDuration: Number(existing.audioDuration || 0),
      audioDurationText: existing.audioDuration ? formatDuration(existing.audioDuration) : '',
      hasExistingEvidence: Boolean(existing.createdAt),
      returnDelta,
      canRecord: Boolean(wx.getRecorderManager)
    });
    this.initRecorder();
  },

  onUnload() {
    if (this.data.isRecording && this.recorderManager) {
      this.recorderManager.stop();
    }
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },

  setResultNavigation(active) {
    if (!wx.setNavigationBarColor) return;
    wx.setNavigationBarColor({
      frontColor: active ? '#ffffff' : '#000000',
      backgroundColor: active ? '#111c31' : '#ffffff',
      animation: { duration: 220, timingFunc: 'easeIn' }
    });
  },

  initRecorder() {
    if (!wx.getRecorderManager) return;
    this.recorderManager = wx.getRecorderManager();
    this.recorderManager.onStart(() => this.setData({ isRecording: true }));
    this.recorderManager.onStop(result => {
      this.setData({ isRecording: false });
      this.persistRecording(result.tempFilePath, result.duration);
    });
    this.recorderManager.onError(() => {
      this.setData({ isRecording: false });
      wx.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' });
    });
  },

  onEvidenceInput(e) {
    this.setData({ evidenceText: e.detail.value });
  },

  startRecording() {
    if (!this.recorderManager) {
      wx.showToast({ title: '当前设备不支持录音', icon: 'none' });
      return;
    }
    const start = () => this.recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    });
    if (!wx.authorize) {
      start();
      return;
    }
    wx.authorize({
      scope: 'scope.record',
      success: start,
      fail: () => wx.showModal({
        title: '需要麦克风权限',
        content: '录音证据需要使用麦克风，请在小程序设置中允许录音。',
        confirmText: '去设置',
        success: result => {
          if (result.confirm && wx.openSetting) wx.openSetting();
        }
      })
    });
  },

  stopRecording() {
    if (this.recorderManager && this.data.isRecording) {
      this.recorderManager.stop();
    }
  },

  persistRecording(tempFilePath, duration) {
    const applyPath = audioPath => this.setData({
      audioPath,
      audioDuration: Number(duration || 0),
      audioDurationText: formatDuration(duration)
    });
    if (!wx.saveFile) {
      applyPath(tempFilePath);
      return;
    }
    wx.saveFile({
      tempFilePath,
      success: result => applyPath(result.savedFilePath),
      fail: () => applyPath(tempFilePath)
    });
  },

  playRecording() {
    if (!this.data.audioPath || !wx.createInnerAudioContext) return;
    if (this.audioContext) this.audioContext.destroy();
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = this.data.audioPath;
    this.audioContext.onError(() => wx.showToast({ title: '录音文件已失效，请重新录制', icon: 'none' }));
    this.audioContext.play();
  },

  clearRecording() {
    this.setData({ audioPath: '', audioDuration: 0, audioDurationText: '' });
  },

  buildResultState(dayData, evidence, wasExisting) {
    const { date } = this.data;
    const config = this.config;
    const planTasks = getPlan(date, this.adjustments, config.studyPersona || 'dual_worker').tasks;
    const tasks = [...planTasks, ...(dayData.planner.customTasks || [])].map(rawTask => {
      const task = addTaskEvidence(rawTask);
      return {
        ...task,
        checked: isTaskComplete(task, dayData, date)
      };
    });
    const route = buildTaskRoute(tasks, dayData.planner.dayMode || 'normal');
    const completedCount = tasks.filter(task => task.checked).length;
    const allDays = {
      ...getAllDays(),
      [date]: dayData
    };
    const presentation = RESULT_PRESENTATIONS[evidence.type] || RESULT_PRESENTATIONS.retell;
    return {
      nextTask: route.mainTask,
      resultCard: {
        ...presentation,
        eyebrow: wasExisting ? '学习成果已更新' : '今日成果 +1',
        taskTitle: this.data.task.title,
        evidenceLabel: this.data.evidenceLabel,
        summary: getEvidenceSummary(evidence),
        completedCount,
        totalCount: tasks.length,
        progress: tasks.length ? Math.round(completedCount / tasks.length * 100) : 0,
        weekEvidenceCount: countWeekEvidence(allDays, date),
        streak: calculateStreak(allDays, date),
        dayComplete: Boolean(dayData.planner.complete)
      }
    };
  },

  submitEvidence() {
    if (this.data.saving) return;
    const isAudio = this.data.evidenceType === 'audio';
    const text = String(this.data.evidenceText || '').trim();
    if (isAudio && !this.data.audioPath) {
      wx.showToast({ title: '请先录制一段学习结果', icon: 'none' });
      return;
    }
    if (!isAudio && text.length < 5) {
      wx.showToast({ title: '请至少写 5 个字作为证据', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    const { taskId, task, date } = this.data;
    const dayData = createPlannerState(this.dayData);
    const wasExisting = Boolean(dayData.planner.evidence[taskId]?.createdAt);
    const evidence = {
      taskId,
      taskTitle: task.title,
      type: this.data.evidenceType,
      label: this.data.evidenceLabel,
      text,
      audioPath: this.data.audioPath,
      audioDuration: this.data.audioDuration,
      createdAt: Date.now()
    };
    dayData.planner.evidence[taskId] = evidence;
    dayData.planner.checked[taskId] = true;
    updatePlannerCompletion(dayData, date, this.adjustments, this.config.studyPersona || 'dual_worker');
    setDayData(date, dayData);
    this.dayData = dayData;
    const resultState = this.buildResultState(dayData, evidence, wasExisting);
    this.setData({
      hasExistingEvidence: true,
      saving: false,
      showSuccess: true,
      resultCard: resultState.resultCard,
      nextTask: resultState.nextTask,
      hasNextTask: Boolean(resultState.nextTask)
    });
    this.setResultNavigation(true);
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  },

  editEvidence() {
    this.setData({ showSuccess: false });
    this.setResultNavigation(false);
  },

  returnToPlan() {
    if (wx.switchTab) {
      wx.switchTab({ url: '/pages/home/home' });
      return;
    }
    wx.navigateBack({ delta: this.data.returnDelta });
  },

  continueNextTask() {
    const nextTask = this.data.nextTask;
    if (!nextTask) {
      this.returnToPlan();
      return;
    }
    const meta = getMeta();
    meta.plannerAutoStartTask = {
      date: this.data.date,
      taskId: nextTask.id,
      createdAt: Date.now()
    };
    setMeta(meta);
    this.returnToPlan();
  }
});
