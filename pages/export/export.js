const { generateExportText } = require('../../utils/export.js');
const { getToday } = require('../../utils/date.js');
const { buildLearningReview, generateNextWeekAdjustment, getDaySummary } = require('../../utils/learningInsights.js');
const { getAllDays, getConfig, getMeta, setMeta } = require('../../utils/storage.js');

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
      languageClass: `language-${task.language}`,
      evidenceText: task.hasEvidence ? `已提交${task.evidence?.label || '证据'}` : '未提交证据'
    }))
  };
}

function decorateAdjustment(adjustment, applied = false) {
  return {
    ...adjustment,
    applied,
    statusText: applied ? '已应用' : '待生成',
    differenceText: adjustment.minuteDifference > 0
      ? `增加 ${adjustment.minuteDifference} 分钟`
      : adjustment.minuteDifference < 0
        ? `减少 ${Math.abs(adjustment.minuteDifference)} 分钟`
        : '总时长不变'
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
    evidenceCount: 0,
    evidenceRate: 0,
    skippedTasks: [],
    mostSkippedTask: null,
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
    nextWeekPlan: null,
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
    const config = getConfig();
    const personaId = config.studyPersona || 'dual_worker';
    const meta = getMeta();
    const adjustments = meta.plannerAdjustments || {};
    const review = buildLearningReview(allDays, today, adjustments, personaId);
    const nextWeekDraft = generateNextWeekAdjustment(allDays, today, adjustments, personaId);
    const savedAdjustment = adjustments[nextWeekDraft.weekStart];
    const currentSelection = review.weekDays.some(day => day.date === this.data.selectedDate)
      ? this.data.selectedDate
      : today;
    const selectedWeekDay = review.weekDays.find(day => day.date === currentSelection);
    const selectedDay = decorateDay(
      getDaySummary(currentSelection, allDays[currentSelection], adjustments, personaId),
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
      evidenceCount: review.evidenceCount,
      evidenceRate: review.evidenceRate,
      skippedTasks: review.skippedTasks.slice(0, 3),
      mostSkippedTask: review.mostSkippedTask,
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
      nextWeekPlan: decorateAdjustment(savedAdjustment || nextWeekDraft, Boolean(savedAdjustment)),
      isLoading: false
    });
    this.currentAdjustments = adjustments;
    this.currentPersonaId = personaId;
  },

  selectDay(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;
    const allDays = getAllDays();
    const weekDay = this.data.weekDays.find(day => day.date === date);
    this.setData({
      selectedDate: date,
      selectedDay: decorateDay(getDaySummary(date, allDays[date], this.currentAdjustments, this.currentPersonaId), weekDay?.dateLabel || date),
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
      selectedDay: decorateDay(getDaySummary(date, allDays[date], this.currentAdjustments, this.currentPersonaId), record?.dateLabel || date),
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

  generateNextWeekPlan() {
    const today = getToday();
    const allDays = getAllDays();
    const meta = getMeta();
    const adjustments = meta.plannerAdjustments || {};
    const adjustment = generateNextWeekAdjustment(allDays, today, adjustments, this.currentPersonaId);
    const appliedAdjustment = {
      ...adjustment,
      applied: true
    };
    meta.plannerAdjustments = {
      ...adjustments,
      [adjustment.weekStart]: appliedAdjustment
    };
    setMeta(meta);
    this.currentAdjustments = meta.plannerAdjustments;
    this.setData({ nextWeekPlan: decorateAdjustment(appliedAdjustment, true) });
    wx.showToast({ title: '下周方案已应用', icon: 'success' });
  },

  cancelNextWeekPlan() {
    const plan = this.data.nextWeekPlan;
    if (!plan?.applied) return;
    wx.showModal({
      title: '取消下周调整',
      content: '取消后，下周将恢复原始语言学习计划。',
      success: result => {
        if (!result.confirm) return;
        const meta = getMeta();
        const adjustments = { ...(meta.plannerAdjustments || {}) };
        delete adjustments[plan.weekStart];
        meta.plannerAdjustments = adjustments;
        setMeta(meta);
        this.currentAdjustments = adjustments;
        const draft = generateNextWeekAdjustment(getAllDays(), getToday(), adjustments, this.currentPersonaId);
        this.setData({ nextWeekPlan: decorateAdjustment(draft, false) });
        wx.showToast({ title: '已恢复原计划', icon: 'success' });
      }
    });
  },

  previewNextWeekPlan() {
    const plan = this.data.nextWeekPlan;
    if (!plan?.weekStart) return;
    const meta = getMeta();
    meta.plannerPreviewDate = plan.weekStart;
    setMeta(meta);
    wx.switchTab({ url: '/pages/home/home' });
  },

  goTodayPlan() {
    wx.switchTab({ url: '/pages/home/home' });
  }
});
