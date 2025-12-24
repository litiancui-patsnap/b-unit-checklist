const { getToday, getRecentDates, getTodayDate, isTimeAfter } = require('../../utils/date.js');
const { getConfig, getDayData, setDayData, getAllDays, getMeta, setMeta } = require('../../utils/storage.js');

Page({
  data: {
    today: '',
    config: null,
    todayData: {
      template: '',
      start: {},
      items: {},
      complete: false
    },
    startChecklist: [],
    currentTemplate: null,
    progress: 0,
    streak: 0,
    recent7Days: [],
    reminderEnabled: false,
    reminderTime: ''
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
          template: '',
          start: {},
          items: {},
          complete: false
        };
      }

      this.setData({
        today,
        config,
        todayData,
        startChecklist: config.startChecklist || [],
        reminderEnabled: config.reminder?.enabled || false,
        reminderTime: config.reminder?.time || '21:30'
      });

      this.updateCurrentTemplate();
      this.calculateProgress();
      this.calculateStreak();
      this.loadRecent7Days();
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
      this.setData({
        currentTemplate: config.templates[todayData.template]
      });
    } else {
      this.setData({
        currentTemplate: null
      });
    }
  },

  selectTemplate(e) {
    const template = e.currentTarget.dataset.template;
    const { todayData } = this.data;

    if (todayData.template === template) {
      return;
    }

    todayData.template = template;
    todayData.items = {};

    this.setData({ todayData });
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

  calculateProgress() {
    const { todayData, startChecklist, currentTemplate } = this.data;

    let totalItems = startChecklist.length;
    let checkedItems = Object.values(todayData.start || {}).filter(Boolean).length;

    if (currentTemplate) {
      totalItems += currentTemplate.items.length;
      checkedItems += Object.values(todayData.items || {}).filter(Boolean).length;
    }

    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    this.setData({ progress });
  },

  completeToday() {
    const { todayData, config } = this.data;

    if (!todayData.template) {
      wx.showToast({
        title: '先选A/B/C模板',
        icon: 'none'
      });
      return;
    }

    const template = config.templates[todayData.template];
    const threshold = template.threshold;
    const checkedCount = Object.values(todayData.items || {}).filter(Boolean).length;

    if (checkedCount < threshold) {
      wx.showToast({
        title: `模板${todayData.template}需勾选至少${threshold}项`,
        icon: 'none'
      });
      return;
    }

    todayData.complete = true;
    this.setData({ todayData });
    this.saveTodayData();
    this.calculateStreak();

    wx.showToast({
      title: '今日完成 ✅',
      icon: 'success'
    });
  },

  uncompleteToday() {
    const { todayData } = this.data;
    todayData.complete = false;
    this.setData({ todayData });
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
            template: '',
            start: {},
            items: {},
            complete: false
          };

          this.setData({
            todayData,
            currentTemplate: null
          });
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
  },

  loadRecent7Days() {
    const dates = getRecentDates(7);
    const allDays = getAllDays();
    const recent7Days = [];

    dates.forEach(date => {
      const dayData = allDays[date];
      recent7Days.push({
        date,
        template: dayData?.template || '-',
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
        title: '该打卡啦！',
        icon: 'none',
        duration: 3000
      });

      meta.remind_last_shown_date = today;
      setMeta(meta);
    }
  }
});
