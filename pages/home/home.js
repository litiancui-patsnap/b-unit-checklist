const { getToday } = require('../../utils/date.js');
const { getAllDays, getConfig, getDayData, getMeta, setDayData, setMeta } = require('../../utils/storage.js');
const {
  addTaskEvidence,
  calculateStreak,
  getLanguageLabel,
  getPlan,
  getResourceDescription,
  getWeek,
  isTaskComplete,
  shiftDate,
  updatePlannerCompletion
} = require('../../utils/planner.js');
const { DAY_MODES, buildTaskRoute, decorateDayModes } = require('../../utils/taskRoute.js');

const LANGUAGE_OPTIONS = [
  { value: 'jp', label: '日语' },
  { value: 'en', label: '英语' },
  { value: 'review', label: '复习' }
];

const MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120];

function createDayData(config, stored = null) {
  return {
    template: config.dailyIntensity || 'B',
    start: {},
    items: {},
    complete: false,
    diary: '',
    words: [],
    scenePractice: {},
    contentChecks: {},
    quiz: { answers: {} },
    rescue: null,
    ...(stored || {}),
    planner: {
      checked: {},
      customTasks: [],
      evidence: {},
      dayMode: 'normal',
      complete: false,
      ...(stored?.planner || {})
    }
  };
}

function formatDateTitle(dateString, todayString) {
  const date = new Date(`${dateString}T00:00:00`);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const prefix = dateString === todayString ? '今天 · ' : '';
  return `${prefix}${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

Page({
  data: {
    selectedDate: '',
    dateTitle: '',
    dayType: '',
    focusTitle: '',
    focusDescription: '',
    progress: 0,
    plannedMinutes: 0,
    completedMinutes: 0,
    streak: 0,
    tasks: [],
    completedTaskCount: 0,
    weekDays: [],
    japaneseRatio: 0,
    englishRatio: 0,
    resources: [],
    dailyTip: '',
    planAdjustment: null,
    personaName: '',
    personaPromise: '',
    dayMode: 'normal',
    dayModes: decorateDayModes('normal', true),
    routeLabel: '今日标准路线',
    routeDescription: '按计划主线推进',
    mainTask: null,
    nextTasks: [],
    remainingTaskCount: 0,
    remainingMinutes: 0,
    routeMinutes: 0,
    hiddenRouteCount: 0,
    routeCompleted: false,
    canSelectDayMode: true,
    showAllTasks: false,
    customTitle: '',
    languageOptions: LANGUAGE_OPTIONS,
    languageIndex: 0,
    minuteOptions: MINUTE_OPTIONS,
    minuteIndex: 0,
    isLoading: true
  },

  onLoad() {
    const config = getConfig();
    if (!config.hasOnboarded) {
      wx.redirectTo({ url: '/pages/onboarding/onboarding' });
      return;
    }
    this.skipNextShowReload = true;
    const autoStartTask = this.consumePlannerAutoStartTask();
    this.pendingAutoStartTask = autoStartTask;
    this.setData({
      selectedDate: autoStartTask?.date || this.consumePlannerPreviewDate() || getToday()
    }, () => this.loadPlan());
  },

  onShow() {
    if (this.skipNextShowReload) {
      this.skipNextShowReload = false;
      return;
    }
    const autoStartTask = this.consumePlannerAutoStartTask();
    const previewDate = this.consumePlannerPreviewDate();
    if (autoStartTask) {
      this.pendingAutoStartTask = autoStartTask;
      this.setData({ selectedDate: autoStartTask.date }, () => this.loadPlan());
      return;
    }
    if (previewDate) {
      this.setData({ selectedDate: previewDate }, () => this.loadPlan());
      return;
    }
    if (this.data.selectedDate) this.loadPlan();
  },

  consumePlannerPreviewDate() {
    const meta = getMeta();
    const previewDate = meta.plannerPreviewDate;
    if (!previewDate) return '';
    delete meta.plannerPreviewDate;
    setMeta(meta);
    return previewDate;
  },

  consumePlannerAutoStartTask() {
    const meta = getMeta();
    const autoStartTask = meta.plannerAutoStartTask;
    if (!autoStartTask?.taskId || !autoStartTask?.date) return null;
    delete meta.plannerAutoStartTask;
    setMeta(meta);
    return autoStartTask;
  },

  openPendingAutoStartTask() {
    const autoStartTask = this.pendingAutoStartTask;
    this.pendingAutoStartTask = null;
    if (!autoStartTask || autoStartTask.date !== this.data.selectedDate || this.data.selectedDate !== getToday()) return;
    const task = this.data.tasks.find(item => item.id === autoStartTask.taskId);
    if (!task || task.checked) return;
    this.openTask({ currentTarget: { dataset: { id: task.id } } });
  },

  loadPlan() {
    const selectedDate = this.data.selectedDate || getToday();
    const today = getToday();
    const config = getConfig();
    const meta = getMeta();
    const adjustments = meta.plannerAdjustments || {};
    const dayData = createDayData(config, getDayData(selectedDate));
    const personaId = config.studyPersona || 'dual_worker';
    const plan = getPlan(selectedDate, adjustments, personaId);
    const evidence = dayData.planner.evidence || {};
    const tasks = [...plan.tasks, ...(dayData.planner.customTasks || [])].map(rawItem => {
      const item = addTaskEvidence(rawItem);
      return {
        ...item,
        checked: isTaskComplete(item, dayData, selectedDate),
        hasEvidence: Boolean(evidence[item.id]),
        languageLabel: getLanguageLabel(item.language),
        languageClass: `language-${item.language}`,
        canExecute: selectedDate === today,
        isCustom: String(item.id).startsWith('custom_')
      };
    });
    const plannedMinutes = tasks.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const completedTasks = tasks.filter(item => item.checked);
    const completedMinutes = completedTasks.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const progress = plannedMinutes ? Math.round((completedMinutes / plannedMinutes) * 100) : 0;
    const japaneseMinutes = tasks.filter(item => item.language === 'jp').reduce((sum, item) => sum + item.minutes, 0);
    const englishMinutes = tasks.filter(item => item.language === 'en').reduce((sum, item) => sum + item.minutes, 0);
    const languageMinutes = japaneseMinutes + englishMinutes;
    const japaneseRatio = languageMinutes ? Math.round((japaneseMinutes / languageMinutes) * 100) : 0;
    const englishRatio = languageMinutes ? 100 - japaneseRatio : 0;
    const allDays = {
      ...getAllDays(),
      [selectedDate]: dayData
    };
    const resources = [...new Set(tasks.map(item => item.resource).filter(Boolean))].slice(0, 5).map((name, index) => ({
      id: `resource_${index}`,
      name,
      description: getResourceDescription(name)
    }));
    const dayMode = dayData.planner.dayMode || 'normal';
    const canSelectDayMode = selectedDate === today;
    const route = buildTaskRoute(tasks, dayMode);

    this.currentDayData = dayData;
    this.currentPlanAdjustments = adjustments;
    this.currentPersonaId = personaId;
    this.setData({
      selectedDate,
      dateTitle: formatDateTitle(selectedDate, today),
      dayType: plan.dayType,
      focusTitle: plan.focus,
      focusDescription: plan.description,
      progress,
      plannedMinutes,
      completedMinutes,
      streak: calculateStreak(allDays, today),
      tasks,
      completedTaskCount: completedTasks.length,
      weekDays: getWeek(selectedDate, allDays),
      japaneseRatio,
      englishRatio,
      resources,
      dailyTip: plan.tip,
      planAdjustment: plan.adjustment,
      personaName: plan.persona.name,
      personaPromise: plan.persona.promise,
      dayMode,
      dayModes: decorateDayModes(dayMode, canSelectDayMode),
      canSelectDayMode,
      ...route,
      isLoading: false
    }, () => this.openPendingAutoStartTask());
  },

  changeDate(offset) {
    this.setData({ selectedDate: shiftDate(this.data.selectedDate, offset), showAllTasks: false });
    this.loadPlan();
  },

  previousDay() {
    this.changeDate(-1);
  },

  nextDay() {
    this.changeDate(1);
  },

  goToday() {
    this.setData({ selectedDate: getToday(), showAllTasks: false });
    this.loadPlan();
  },

  selectWeekDay(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.date, showAllTasks: false });
    this.loadPlan();
  },

  selectDayMode(e) {
    if (!this.data.canSelectDayMode) {
      wx.showToast({ title: '只能调整今天的学习状态', icon: 'none' });
      return;
    }
    const dayMode = e.currentTarget.dataset.mode;
    if (!DAY_MODES.some(item => item.value === dayMode) || dayMode === this.data.dayMode) return;
    const dayData = this.currentDayData || createDayData(getConfig(), getDayData(this.data.selectedDate));
    dayData.planner.dayMode = dayMode;
    setDayData(this.data.selectedDate, dayData);
    this.currentDayData = dayData;
    this.loadPlan();
  },

  toggleAllTasks() {
    this.setData({ showAllTasks: !this.data.showAllTasks });
  },

  toggleTask(e) {
    const id = e.currentTarget.dataset.id;
    const dayData = this.currentDayData || createDayData(getConfig(), getDayData(this.data.selectedDate));
    const checked = !dayData.planner.checked[id];
    const task = this.data.tasks.find(item => item.id === id);
    if (checked && task?.evidenceRequired && !dayData.planner.evidence?.[id]) {
      this.openTask({ currentTarget: { dataset: task } });
      return;
    }
    dayData.planner.checked[id] = checked;

    updatePlannerCompletion(dayData, this.data.selectedDate, this.currentPlanAdjustments, this.currentPersonaId);

    setDayData(this.data.selectedDate, dayData);
    this.currentDayData = dayData;
    this.loadPlan();
  },

  openTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find(item => item.id === taskId) || e.currentTarget.dataset;
    const executionType = task.executionType || e.currentTarget.dataset.type;
    const taskTitle = task.title || e.currentTarget.dataset.title;
    if (this.data.selectedDate !== getToday()) {
      wx.showToast({ title: '仅今天的任务可提交证据', icon: 'none' });
      return;
    }
    if (!getDayData(this.data.selectedDate)) {
      setDayData(this.data.selectedDate, this.currentDayData);
    }
    if (task.hasEvidence) {
      wx.navigateTo({
        url: `/pages/evidence/evidence?taskId=${encodeURIComponent(taskId)}&date=${this.data.selectedDate}&returnDelta=1`
      });
      return;
    }
    if (executionType && (task.language || e.currentTarget.dataset.language) === 'en') {
      wx.navigateTo({
        url: `/pages/study/study?taskType=${executionType}&plannerTaskId=${encodeURIComponent(taskId)}&plannerDate=${this.data.selectedDate}&plannerTaskTitle=${encodeURIComponent(taskTitle)}`
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/evidence/evidence?taskId=${encodeURIComponent(taskId)}&date=${this.data.selectedDate}&returnDelta=1`
    });
  },

  onCustomTitleInput(e) {
    this.setData({ customTitle: e.detail.value });
  },

  onLanguageChange(e) {
    this.setData({ languageIndex: Number(e.detail.value) });
  },

  onMinuteChange(e) {
    this.setData({ minuteIndex: Number(e.detail.value) });
  },

  addCustomTask() {
    const title = this.data.customTitle.trim();
    if (!title) {
      wx.showToast({ title: '请输入学习任务', icon: 'none' });
      return;
    }

    const language = LANGUAGE_OPTIONS[this.data.languageIndex] || LANGUAGE_OPTIONS[0];
    const minutes = MINUTE_OPTIONS[this.data.minuteIndex] || MINUTE_OPTIONS[0];
    const dayData = this.currentDayData || createDayData(getConfig(), getDayData(this.data.selectedDate));
    dayData.planner.customTasks.push(addTaskEvidence({
      id: `custom_${Date.now()}`,
      title,
      language: language.value,
      minutes,
      resource: '自定义学习资料',
      executionType: language.value === 'en' ? 'read' : ''
    }));
    updatePlannerCompletion(dayData, this.data.selectedDate, this.currentPlanAdjustments, this.currentPersonaId);
    setDayData(this.data.selectedDate, dayData);
    this.currentDayData = dayData;
    this.setData({ customTitle: '' });
    this.loadPlan();
  },

  deleteCustomTask(e) {
    const id = e.currentTarget.dataset.id;
    const dayData = this.currentDayData;
    if (!dayData) return;
    dayData.planner.customTasks = dayData.planner.customTasks.filter(item => item.id !== id);
    delete dayData.planner.checked[id];
    delete dayData.planner.evidence[id];
    updatePlannerCompletion(dayData, this.data.selectedDate, this.currentPlanAdjustments, this.currentPersonaId);
    setDayData(this.data.selectedDate, dayData);
    this.loadPlan();
  },

  resetDay() {
    wx.showModal({
      title: '重置当天打卡',
      content: '将清空当天计划任务的完成状态，是否继续？',
      success: (result) => {
        if (!result.confirm) return;
        const dayData = this.currentDayData;
        dayData.planner.checked = {};
        dayData.planner.evidence = {};
        updatePlannerCompletion(dayData, this.data.selectedDate, this.currentPlanAdjustments, this.currentPersonaId);
        setDayData(this.data.selectedDate, dayData);
        this.loadPlan();
      }
    });
  }
});
