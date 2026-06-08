const { getToday, getRecentDates, getTodayDate, isTimeAfter } = require('../../utils/date.js');
const { getConfig, getDayData, setDayData, getAllDays, getMeta, setMeta } = require('../../utils/storage.js');
const { countCheckedByItems, normalizeCheckedMap } = require('../../utils/checklist.js');
const { getGoalLabel, getIntensityLabel } = require('../../utils/defaultConfig.js');

Page({
  data: {
    today: '',
    config: null,
    todayData: {
      template: '',
      start: {},
      items: {},
      complete: false,
      diary: ''
    },
    startChecklist: [],
    currentTemplate: null,
    progress: 0,
    streak: 0,
    recent7Days: [],
    reminderEnabled: false,
    reminderTime: '',
    learningGoalText: '',
    intensityText: '',
    planTotalMinutes: 0,
    planRequiredCount: 0,
    planModules: [],
    diaryTemplates: [],
    shareText: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
    this.checkReminder();
  },

  loadData() {
    try {
      const today = getToday();
      const config = getConfig();

      if (!config.hasOnboarded) {
        wx.redirectTo({
          url: '/pages/onboarding/onboarding'
        });
        return;
      }

      if (!config || !config.startChecklist || !config.templates) {
        wx.showToast({
          title: '配置加载失败',
          icon: 'none'
        });
        return;
      }

      let todayData = getDayData(today);

      if (!todayData) {
        todayData = {
          template: config.dailyIntensity || 'B',
          start: {},
          items: {},
          complete: false,
          diary: ''
        };
      } else if (!todayData.template) {
        todayData.template = config.dailyIntensity || 'B';
      }

      if (!config.templates[todayData.template]) {
        todayData.template = config.templates[config.dailyIntensity] ? config.dailyIntensity : Object.keys(config.templates)[0];
      }

      if (typeof todayData.diary !== 'string') {
        todayData.diary = '';
      }

      const currentTemplate = config.templates[todayData.template];
      todayData.start = normalizeCheckedMap(todayData.start, config.startChecklist || []);
      todayData.items = normalizeCheckedMap(todayData.items, currentTemplate?.items || []);

      this.setData({
        today,
        config,
        todayData,
        startChecklist: config.startChecklist || [],
        reminderEnabled: config.reminder?.enabled || false,
        reminderTime: config.reminder?.time || '21:30',
        learningGoalText: getGoalLabel(config.learningGoal),
        intensityText: getIntensityLabel(todayData.template),
        diaryTemplates: config.diaryTemplates || [],
        shareText: ''
      });

      this.updateCurrentTemplate();
      this.calculateProgress();
      const streak = this.calculateStreak();
      this.loadRecent7Days();
      if (todayData.complete) {
        this.setData({
          shareText: this.generateShareText(todayData, streak)
        });
      }
    } catch (error) {
      console.error('loadData error:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  updateCurrentTemplate() {
    const { todayData, config } = this.data;
    if (todayData.template && config.templates[todayData.template]) {
      const currentTemplate = config.templates[todayData.template];
      this.setData({
        currentTemplate,
        ...this.getPlanSummary(currentTemplate)
      });
    } else {
      this.setData({
        currentTemplate: null,
        planTotalMinutes: 0,
        planRequiredCount: 0,
        planModules: []
      });
    }
  },

  getPlanSummary(template) {
    const items = template?.items || [];
    const modules = [];

    items.forEach(item => {
      const moduleName = item.module || '任务';
      const existing = modules.find(module => module.name === moduleName);
      if (existing) {
        existing.count++;
        existing.minutes += Number(item.minutes || 0);
      } else {
        modules.push({
          name: moduleName,
          count: 1,
          minutes: Number(item.minutes || 0)
        });
      }
    });

    return {
      planTotalMinutes: items.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
      planRequiredCount: template?.threshold || 0,
      planModules: modules
    };
  },

  selectTemplate(e) {
    const template = e.currentTarget.dataset.template;
    const { todayData } = this.data;

    if (todayData.template === template) {
      return;
    }

    todayData.template = template;
    todayData.items = {};

    this.setData({
      todayData,
      intensityText: getIntensityLabel(template),
      shareText: ''
    });
    this.updateCurrentTemplate();
    this.calculateProgress();
    this.saveTodayData();
  },

  toggleStart(e) {
    const id = e.currentTarget.dataset.id;
    const { todayData } = this.data;

    if (!todayData.start) {
      todayData.start = {};
    }

    todayData.start[id] = !todayData.start[id];

    this.setData({ todayData });
    this.calculateProgress();
    this.saveTodayData();
  },

  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const { todayData } = this.data;

    if (!todayData.items) {
      todayData.items = {};
    }

    todayData.items[id] = !todayData.items[id];

    this.setData({ todayData });
    this.calculateProgress();
    this.saveTodayData();
  },

  onDiaryInput(e) {
    const value = e.detail.value;
    const { todayData } = this.data;
    todayData.diary = value;
    this.setData({
      todayData,
      shareText: todayData.complete ? this.generateShareText(todayData) : ''
    });
  },

  saveDiary() {
    this.saveTodayData();
  },

  useDiaryTemplate(e) {
    const template = e.currentTarget.dataset.template;
    const { todayData } = this.data;
    todayData.diary = template;
    this.setData({
      todayData,
      shareText: todayData.complete ? this.generateShareText(todayData) : ''
    });
    this.saveTodayData();
  },

  calculateProgress() {
    const { todayData, startChecklist, currentTemplate } = this.data;

    let totalItems = startChecklist.length;
    let checkedItems = countCheckedByItems(todayData.start, startChecklist);

    if (currentTemplate) {
      totalItems += currentTemplate.items.length;
      checkedItems += countCheckedByItems(todayData.items, currentTemplate.items);
    }

    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    this.setData({ progress });
  },

  completeToday() {
    const { todayData, config } = this.data;

    if (!todayData.template) {
      wx.showToast({
        title: '先选择学习强度',
        icon: 'none'
      });
      return;
    }

    const template = config.templates[todayData.template];
    if (!template) {
      wx.showToast({
        title: '当前强度暂无配置',
        icon: 'none'
      });
      return;
    }

    const threshold = template.threshold;
    const checkedCount = countCheckedByItems(todayData.items, template.items);

    if (checkedCount < threshold) {
      wx.showToast({
        title: `${getIntensityLabel(todayData.template)}需完成至少${threshold}项`,
        icon: 'none'
      });
      return;
    }

    todayData.complete = true;
    this.setData({ todayData });
    this.saveTodayData();
    const streak = this.calculateStreak();
    this.setData({
      shareText: this.generateShareText(todayData, streak)
    });

    wx.showToast({
      title: '今日英语完成',
      icon: 'success'
    });
  },

  uncompleteToday() {
    const { todayData } = this.data;
    todayData.complete = false;
    this.setData({ todayData, shareText: '' });
    this.saveTodayData();
    this.calculateStreak();

    wx.showToast({
      title: '已取消完成',
      icon: 'none'
    });
  },

  resetToday() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空今天的所有数据吗？',
      success: (res) => {
        if (res.confirm) {
          const todayData = {
            template: this.data.config?.dailyIntensity || 'B',
            start: {},
            items: {},
            complete: false,
            diary: ''
          };

          this.setData({
            todayData,
            shareText: '',
            intensityText: getIntensityLabel(todayData.template)
          });
          this.updateCurrentTemplate();
          this.calculateProgress();
          this.saveTodayData();
          this.calculateStreak();

          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  saveTodayData() {
    try {
      const { today, todayData } = this.data;
      const success = setDayData(today, todayData);
      if (!success) {
        console.error('保存数据失败');
      }
    } catch (error) {
      console.error('saveTodayData error:', error);
    }
  },

  calculateStreak() {
    const allDays = getAllDays();
    const dates = getRecentDates(365);
    let streak = 0;

    for (let date of dates) {
      const dayData = allDays[date];
      if (dayData && dayData.complete) {
        streak++;
      } else {
        break;
      }
    }

    this.setData({ streak });
    return streak;
  },

  loadRecent7Days() {
    const dates = getRecentDates(7);
    const allDays = getAllDays();
    const recent7Days = [];

    dates.forEach(date => {
      const dayData = allDays[date];
      recent7Days.push({
        date,
        template: dayData?.template ? getIntensityLabel(dayData.template) : '-',
        complete: dayData?.complete ? '✅' : '—'
      });
    });

    this.setData({ recent7Days });
  },

  checkReminder() {
    const { config } = this.data;
    if (!config || !config.reminder.enabled) {
      return;
    }

    const today = getToday();
    const todayData = getDayData(today);

    if (todayData && todayData.complete) {
      return;
    }

    const meta = getMeta();
    if (meta.remind_last_shown_date === today) {
      return;
    }

    const now = getTodayDate();
    const reminderTime = config.reminder.time;

    if (isTimeAfter(now, reminderTime)) {
      wx.showToast({
        title: '该学英语啦！',
        icon: 'none',
        duration: 3000
      });

      meta.remind_last_shown_date = today;
      setMeta(meta);
    }
  },

  generateShareText(dayData = this.data.todayData, streakValue = this.data.streak) {
    const { today, streak, learningGoalText, intensityText, config } = this.data;
    const templateItems = config?.templates?.[dayData.template]?.items || [];
    const checkedCount = countCheckedByItems(dayData.items, templateItems);
    const diary = (dayData.diary || '').trim();
    let text = `我今天完成了英语学习打卡！\n`;
    text += `日期：${today}\n`;
    text += `目标：${learningGoalText || '日常英语'}\n`;
    text += `强度：${intensityText || getIntensityLabel(dayData.template)}\n`;
    text += `任务：完成 ${checkedCount} 项\n`;
    text += `连续学习：${streakValue || streak} 天`;
    if (diary) {
      text += `\n今日英文句子：${diary}`;
    }
    return text;
  },

  copyShareText() {
    const shareText = this.data.shareText || this.generateShareText();
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({
          title: '分享文案已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  }
});
