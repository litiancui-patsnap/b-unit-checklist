const { getToday } = require('../../utils/date.js');
const { getAllDays, getConfig, getDayData, setDayData } = require('../../utils/storage.js');
const {
  calculateStreak,
  getLanguageLabel,
  getPlan,
  getResourceDescription,
  getWeek,
  shiftDate
} = require('../../utils/planner.js');

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
    this.setData({ selectedDate: getToday() });
    this.loadPlan();
  },

  onShow() {
    if (this.data.selectedDate) {
      this.loadPlan();
    }
  },

  loadPlan() {
    const selectedDate = this.data.selectedDate || getToday();
    const today = getToday();
    const config = getConfig();
    const dayData = createDayData(config, getDayData(selectedDate));
    const plan = getPlan(selectedDate);
    const tasks = [...plan.tasks, ...(dayData.planner.customTasks || [])].map(item => ({
      ...item,
      checked: Boolean(dayData.planner.checked?.[item.id]),
      languageLabel: getLanguageLabel(item.language),
      languageClass: `language-${item.language}`,
      canExecute: Boolean(item.executionType),
      isCustom: String(item.id).startsWith('custom_')
    }));
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

    this.currentDayData = dayData;
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
      isLoading: false
    });
  },

  changeDate(offset) {
    this.setData({ selectedDate: shiftDate(this.data.selectedDate, offset) });
    this.loadPlan();
  },

  previousDay() {
    this.changeDate(-1);
  },

  nextDay() {
    this.changeDate(1);
  },

  goToday() {
    this.setData({ selectedDate: getToday() });
    this.loadPlan();
  },

  selectWeekDay(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.date });
    this.loadPlan();
  },

  toggleTask(e) {
    const id = e.currentTarget.dataset.id;
    const dayData = this.currentDayData || createDayData(getConfig(), getDayData(this.data.selectedDate));
    const checked = !dayData.planner.checked[id];
    dayData.planner.checked[id] = checked;

    const allTasks = [...getPlan(this.data.selectedDate).tasks, ...(dayData.planner.customTasks || [])];
    dayData.planner.complete = allTasks.length > 0 && allTasks.every(item => dayData.planner.checked[item.id]);
    if (dayData.planner.complete) {
      dayData.complete = true;
      dayData.completeSource = 'planner';
    } else if (dayData.completeSource === 'planner') {
      dayData.complete = false;
    }

    setDayData(this.data.selectedDate, dayData);
    this.currentDayData = dayData;
    this.loadPlan();
  },

  openTask(e) {
    const executionType = e.currentTarget.dataset.type;
    const taskId = e.currentTarget.dataset.id;
    const taskTitle = e.currentTarget.dataset.title;
    if (!executionType) {
      wx.showToast({ title: '按任务资料开始学习', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/study/study?taskType=${executionType}&plannerTaskId=${encodeURIComponent(taskId)}&plannerDate=${this.data.selectedDate}&plannerTaskTitle=${encodeURIComponent(taskTitle)}`
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
    dayData.planner.customTasks.push({
      id: `custom_${Date.now()}`,
      title,
      language: language.value,
      minutes,
      resource: '自定义学习资料',
      executionType: language.value === 'en' ? 'read' : ''
    });
    dayData.planner.complete = false;
    if (dayData.completeSource === 'planner') {
      dayData.complete = false;
    }
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
        dayData.planner.complete = false;
        if (dayData.completeSource === 'planner') {
          dayData.complete = false;
        }
        setDayData(this.data.selectedDate, dayData);
        this.loadPlan();
      }
    });
  }
});
