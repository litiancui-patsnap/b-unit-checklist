const { generateExportText } = require('../../utils/export.js');
const { getToday } = require('../../utils/date.js');
const { buildLearningReview, getDaySummary } = require('../../utils/learningInsights.js');
const { getAllDays } = require('../../utils/storage.js');

function getLanguageLabel(language) {
  if (language === 'jp') return '日语';
  if (language === 'en') return '英语';
  return '复习';
}

function decorateDay(summary, dateLabel = '') {
  return {
    ...summary,
    dateLabel: dateLabel || summary.date,
    progressText: `${summary.progress}%`,
    taskSummary: `${summary.completedTasks}/${summary.totalTasks} 项`,
    minuteSummary: `${summary.completedMinutes}/${summary.plannedMinutes} 分钟`,
    tasks: summary.tasks.map(task => ({
      ...task,
      languageLabel: getLanguageLabel(task.language),
      languageClass: `language-${task.language}`
    }))
  };
}

Page({
  data: {
    today: '',
    rangeLabel: '',
    streak: 0,
    activeDays: 0,
    completedDays: 0,
    completionRate: 0,
    completedTasks: 0,
    totalTasks: 0,
    completedMinutes: 0,
    japaneseMinutes: 0,
    englishMinutes: 0,
    reviewMinutes: 0,
    japaneseRatio: 0,
    englishRatio: 0,
    outputDays: 0,
    wordCount: 0,
    weekDays: [],
    insights: [],
    recentRecords: [],
    selectedDate: '',
    selectedDay: null,
    exportText: '',
    onlyCompleted: false,
    totalDays: 0,
    completedExportDays: 0,
    showReport: false,
    isLoading: true
  },

  onLoad() {
    this.skipNextShowReload = true;
    this.loadRecords();
  },

  onShow() {
    if (this.skipNextShowReload) {
      this.skipNextShowReload = false;
      return;
    }
    this.loadRecords();
  },

  loadRecords() {
    const today = getToday();
    const allDays = getAllDays();
    const review = buildLearningReview(allDays, today);
    const currentSelection = review.weekDays.some(day => day.date === this.data.selectedDate)
      ? this.data.selectedDate
      : today;
    const selectedWeekDay = review.weekDays.find(day => day.date === currentSelection);
    const selectedDay = decorateDay(
      getDaySummary(currentSelection, allDays[currentSelection]),
      selectedWeekDay?.dateLabel || currentSelection
    );
    const exportResult = generateExportText(this.data.onlyCompleted);

    this.setData({
      today,
      rangeLabel: review.rangeLabel,
      streak: review.streak,
      activeDays: review.activeDays,
      completedDays: review.completedDays,
      completionRate: review.completionRate,
      completedTasks: review.completedTasks,
      totalTasks: review.totalTasks,
      completedMinutes: review.completedMinutes,
      japaneseMinutes: review.japaneseMinutes,
      englishMinutes: review.englishMinutes,
      reviewMinutes: review.reviewMinutes,
      japaneseRatio: review.japaneseRatio,
      englishRatio: review.englishRatio,
      outputDays: review.outputDays,
      wordCount: review.wordCount,
      weekDays: review.weekDays.map(day => ({
        ...day,
        barHeight: Math.max(day.progress, 8),
        selected: day.date === currentSelection
      })),
      insights: review.insights,
      recentRecords: review.recentRecords,
      selectedDate: currentSelection,
      selectedDay,
      exportText: exportResult.text,
      totalDays: exportResult.totalCount,
      completedExportDays: exportResult.completedCount,
      isLoading: false
    });
  },

  selectDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    const allDays = getAllDays();
    const weekDay = this.data.weekDays.find(day => day.date === date);
    this.setData({
      selectedDate: date,
      selectedDay: decorateDay(getDaySummary(date, allDays[date]), weekDay?.dateLabel || date),
      weekDays: this.data.weekDays.map(day => ({
        ...day,
        selected: day.date === date
      }))
    });
  },

  selectRecentRecord(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    const allDays = getAllDays();
    const record = this.data.recentRecords.find(item => item.date === date);
    this.setData({
      selectedDate: date,
      selectedDay: decorateDay(getDaySummary(date, allDays[date]), record?.dateLabel || date),
      weekDays: this.data.weekDays.map(day => ({
        ...day,
        selected: day.date === date
      }))
    });
    wx.pageScrollTo({ selector: '#day-detail', duration: 250 });
  },

  onOnlyCompletedChange(e) {
    this.setData({ onlyCompleted: e.detail.value }, () => this.refreshReport());
  },

  refreshReport() {
    const result = generateExportText(this.data.onlyCompleted);
    this.setData({
      exportText: result.text,
      totalDays: result.totalCount,
      completedExportDays: result.completedCount
    });
  },

  toggleReport() {
    this.setData({ showReport: !this.data.showReport });
  },

  copyText() {
    wx.setClipboardData({
      data: this.data.exportText,
      success: () => wx.showToast({ title: '周报已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    });
  },

  refreshRecords() {
    this.loadRecords();
    wx.showToast({ title: '复盘已刷新', icon: 'success' });
  },

  goTodayPlan() {
    wx.switchTab({ url: '/pages/home/home' });
  }
});
