const { getConfig, setConfig } = require('../../utils/storage.js');
const { getDefaultConfig, generateId } = require('../../utils/defaultConfig.js');

Page({
  data: {
    learningGoalOptions: [
      { value: 'daily', label: '日常英语' },
      { value: 'spoken', label: '口语表达' },
      { value: 'cet', label: '四六级备考' },
      { value: 'exam', label: '考研英语' },
      { value: 'business', label: '职场英语' }
    ],
    dailyIntensityOptions: [
      { value: 'A', label: '轻量：忙碌日也能完成' },
      { value: 'B', label: '标准：每天 15-25 分钟' },
      { value: 'C', label: '强化：系统训练英语能力' }
    ],
    learningGoal: 'daily',
    dailyIntensity: 'B',
    learningGoalIndex: 0,
    dailyIntensityIndex: 1,
    startChecklist: [],
    templateA: null,
    templateB: null,
    templateC: null,
    reminderEnabled: false,
    reminderTime: '21:30',
    config: null,
    showMethodGuide: false
  },

  onLoad() {
    this.loadConfig();
  },

  onShow() {
    this.loadConfig();
  },

  loadConfig() {
    const config = getConfig();
    const learningGoalIndex = this.data.learningGoalOptions.findIndex(item => item.value === config.learningGoal);
    const dailyIntensityIndex = this.data.dailyIntensityOptions.findIndex(item => item.value === config.dailyIntensity);

    this.setData({
      config,
      learningGoal: config.learningGoal || 'daily',
      dailyIntensity: config.dailyIntensity || 'B',
      learningGoalIndex: learningGoalIndex >= 0 ? learningGoalIndex : 0,
      dailyIntensityIndex: dailyIntensityIndex >= 0 ? dailyIntensityIndex : 1,
      startChecklist: JSON.parse(JSON.stringify(config.startChecklist)),
      templateA: JSON.parse(JSON.stringify(config.templates.A)),
      templateB: JSON.parse(JSON.stringify(config.templates.B)),
      templateC: JSON.parse(JSON.stringify(config.templates.C)),
      reminderEnabled: config.reminder.enabled,
      reminderTime: config.reminder.time
    });
  },

  onLearningGoalChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.learningGoalOptions[index];
    if (option) {
      this.setData({
        learningGoal: option.value,
        learningGoalIndex: index
      });
    }
  },

  onDailyIntensityChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.dailyIntensityOptions[index];
    if (option) {
      this.setData({
        dailyIntensity: option.value,
        dailyIntensityIndex: index
      });
    }
  },

  onStartInput(e) {
    const id = e.currentTarget.dataset.id;
    const value = e.detail.value;
    const { startChecklist } = this.data;

    const item = startChecklist.find(item => item.id === id);
    if (item) {
      item.text = value;
      this.setData({ startChecklist });
    }
  },

  addStart() {
    const { startChecklist } = this.data;
    startChecklist.push({
      id: generateId(),
      text: ''
    });
    this.setData({ startChecklist });
  },

  deleteStart(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这一项吗？',
      success: (res) => {
        if (res.confirm) {
          const { startChecklist } = this.data;
          const newList = startChecklist.filter(item => item.id !== id);
          this.setData({ startChecklist: newList });
        }
      }
    });
  },

  onThresholdInput(e) {
    const template = e.currentTarget.dataset.template;
    const value = parseInt(e.detail.value) || 0;

    if (template === 'A') {
      const { templateA } = this.data;
      templateA.threshold = value;
      this.setData({ templateA });
    } else if (template === 'B') {
      const { templateB } = this.data;
      templateB.threshold = value;
      this.setData({ templateB });
    } else if (template === 'C') {
      const { templateC } = this.data;
      templateC.threshold = value;
      this.setData({ templateC });
    }
  },

  onTemplateInput(e) {
    const template = e.currentTarget.dataset.template;
    const id = e.currentTarget.dataset.id;
    const value = e.detail.value;

    const templateKey = `template${template}`;
    const templateData = this.data[templateKey];
    const item = templateData.items.find(item => item.id === id);
    if (item) {
      item.text = value;
      this.setData({ [templateKey]: templateData });
    }
  },

  addTemplateItem(e) {
    const template = e.currentTarget.dataset.template;
    const templateKey = `template${template}`;
    const templateData = this.data[templateKey];

    templateData.items.push({
      id: generateId(),
      text: ''
    });

    this.setData({ [templateKey]: templateData });
  },

  deleteTemplateItem(e) {
    const template = e.currentTarget.dataset.template;
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这一项吗？',
      success: (res) => {
        if (res.confirm) {
          const templateKey = `template${template}`;
          const templateData = this.data[templateKey];
          templateData.items = templateData.items.filter(item => item.id !== id);
          this.setData({ [templateKey]: templateData });
        }
      }
    });
  },

  onReminderSwitch(e) {
    this.setData({
      reminderEnabled: e.detail.value
    });
  },

  onTimeChange(e) {
    this.setData({
      reminderTime: e.detail.value
    });
  },

  saveConfig() {
    const { learningGoal, dailyIntensity, startChecklist, templateA, templateB, templateC, reminderEnabled, reminderTime } = this.data;

    if (!startChecklist || startChecklist.length === 0) {
      wx.showToast({
        title: '学习准备不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of startChecklist) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '学习准备有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (!templateA.items || templateA.items.length === 0) {
      wx.showToast({
        title: '轻量任务不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of templateA.items) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '轻量任务有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (!templateB.items || templateB.items.length === 0) {
      wx.showToast({
        title: '标准任务不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of templateB.items) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '标准任务有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (!templateC.items || templateC.items.length === 0) {
      wx.showToast({
        title: '强化任务不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of templateC.items) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '强化任务有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (templateA.threshold < 0 || templateB.threshold < 0 || templateC.threshold < 0) {
      wx.showToast({
        title: '阈值不能为负数',
        icon: 'none'
      });
      return;
    }

    const thresholdRules = [
      { name: '轻量任务', template: templateA },
      { name: '标准任务', template: templateB },
      { name: '强化任务', template: templateC }
    ];

    for (let rule of thresholdRules) {
      if (rule.template.threshold < 1 || rule.template.threshold > rule.template.items.length) {
        wx.showToast({
          title: `${rule.name}阈值需为1-${rule.template.items.length}`,
          icon: 'none'
        });
        return;
      }
    }

    try {
      const newConfig = {
        version: 'ENGLISH_LEARNING_V1',
        learningGoal,
        dailyIntensity,
        startChecklist,
        templates: {
          A: templateA,
          B: templateB,
          C: templateC
        },
        reminder: {
          enabled: reminderEnabled,
          time: reminderTime
        }
      };

      const success = setConfig(newConfig);

      if (success) {
        wx.showToast({
          title: '已保存',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('saveConfig error:', error);
      wx.showToast({
        title: '保存异常',
        icon: 'none'
      });
    }
  },

  resetConfig() {
    wx.showModal({
      title: '确认恢复默认',
      content: '将恢复默认英语学习任务,确定吗？',
      success: (res) => {
        if (res.confirm) {
          const defaultConfig = getDefaultConfig();
          const success = setConfig(defaultConfig);

          if (success) {
            this.loadConfig();
            wx.showToast({
              title: '已恢复默认',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '恢复失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  toggleMethodGuide() {
    this.setData({
      showMethodGuide: !this.data.showMethodGuide
    });
  }
});
