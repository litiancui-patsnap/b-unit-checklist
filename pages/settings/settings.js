const { getConfig, setConfig } = require('../../utils/storage.js');
const {
  CONFIG_VERSION,
  DAILY_INTENSITIES,
  LEARNING_GOALS,
  TASK_TYPES,
  getDefaultConfig,
  getDiaryTemplates,
  getTaskTypeLabel,
  getTemplatesForGoal,
  generateId,
  normalizeTaskItem
} = require('../../utils/defaultConfig.js');

function getAIServiceStatus(service = {}) {
  const hasRoute = service.mode === 'cloud' || Boolean(String(service.baseUrl || '').trim());
  if (service.enabled && hasRoute) {
    return {
      text: '已启用',
      className: 'enabled'
    };
  }

  return {
    text: '未连接，当前使用本地内容',
    className: 'offline'
  };
}

Page({
  data: {
    configVersion: CONFIG_VERSION,
    learningGoalOptions: LEARNING_GOALS,
    dailyIntensityOptions: DAILY_INTENSITIES.map(item => ({
      ...item,
      displayLabel: `${item.label}：${item.description}`
    })),
    taskTypeOptions: TASK_TYPES,
    learningGoal: 'daily',
    dailyIntensity: 'B',
    learningGoalIndex: 0,
    dailyIntensityIndex: 1,
    startChecklist: [],
    templateA: null,
    templateB: null,
    templateC: null,
    diaryTemplates: [],
    reminderEnabled: false,
    reminderTime: '21:30',
    aiService: {
      enabled: true,
      mode: 'cloud',
      cloudFunctionName: 'aiProxy',
      baseUrl: '',
      provider: 'qwen',
      dictionaryPath: '/dictionary/lookup',
      ttsPath: '/speech/tts',
      contentPath: '/learning/content',
      planPath: '/learning/plan'
    },
    config: null,
    showDeveloperSettings: false,
    versionTapCount: 0,
    aiServiceStatusText: '已启用',
    aiServiceStatusClass: 'enabled',
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

    const aiService = JSON.parse(JSON.stringify(config.aiService || {}));
    const status = getAIServiceStatus(aiService);

    this.setData({
      config,
      learningGoal: config.learningGoal || 'daily',
      dailyIntensity: config.dailyIntensity || 'B',
      learningGoalIndex: learningGoalIndex >= 0 ? learningGoalIndex : 0,
      dailyIntensityIndex: dailyIntensityIndex >= 0 ? dailyIntensityIndex : 1,
      startChecklist: JSON.parse(JSON.stringify(config.startChecklist)),
      templateA: this.toEditableTemplate(config.templates.A),
      templateB: this.toEditableTemplate(config.templates.B),
      templateC: this.toEditableTemplate(config.templates.C),
      diaryTemplates: JSON.parse(JSON.stringify(config.diaryTemplates || getDiaryTemplates(config.learningGoal))),
      reminderEnabled: config.reminder.enabled,
      reminderTime: config.reminder.time,
      aiService,
      aiServiceStatusText: status.text,
      aiServiceStatusClass: status.className
    });
  },

  refreshAIServiceStatus(aiService = this.data.aiService) {
    const status = getAIServiceStatus(aiService);
    this.setData({
      aiServiceStatusText: status.text,
      aiServiceStatusClass: status.className
    });
  },

  toEditableTemplate(template) {
    return {
      ...JSON.parse(JSON.stringify(template)),
      items: (template.items || []).map(item => {
        const normalized = normalizeTaskItem(item);
        const typeIndex = TASK_TYPES.findIndex(type => type.value === normalized.type);
        return {
          ...normalized,
          typeIndex: typeIndex >= 0 ? typeIndex : 0
        };
      })
    };
  },

  toSavableTemplate(template) {
    return {
      ...template,
      items: (template.items || []).map(item => {
        const normalized = normalizeTaskItem(item);
        const { typeIndex, ...savable } = normalized;
        return savable;
      })
    };
  },

  onLearningGoalChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.learningGoalOptions[index];
    if (option) {
      this.setData({
        learningGoal: option.value,
        learningGoalIndex: index,
        diaryTemplates: getDiaryTemplates(option.value)
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

  onTemplateTypeChange(e) {
    const template = e.currentTarget.dataset.template;
    const id = e.currentTarget.dataset.id;
    const index = Number(e.detail.value);
    const option = this.data.taskTypeOptions[index] || this.data.taskTypeOptions[0];
    const templateKey = `template${template}`;
    const templateData = this.data[templateKey];
    const item = templateData.items.find(item => item.id === id);

    if (item) {
      item.type = option.value;
      item.typeIndex = index;
      item.module = getTaskTypeLabel(option.value);
      this.setData({ [templateKey]: templateData });
    }
  },

  onTemplateModuleInput(e) {
    const template = e.currentTarget.dataset.template;
    const id = e.currentTarget.dataset.id;
    const value = e.detail.value;
    const templateKey = `template${template}`;
    const templateData = this.data[templateKey];
    const item = templateData.items.find(item => item.id === id);

    if (item) {
      item.module = value;
      this.setData({ [templateKey]: templateData });
    }
  },

  onTemplateMinutesInput(e) {
    const template = e.currentTarget.dataset.template;
    const id = e.currentTarget.dataset.id;
    const value = parseInt(e.detail.value) || 0;
    const templateKey = `template${template}`;
    const templateData = this.data[templateKey];
    const item = templateData.items.find(item => item.id === id);

    if (item) {
      item.minutes = value;
      this.setData({ [templateKey]: templateData });
    }
  },

  addTemplateItem(e) {
    const template = e.currentTarget.dataset.template;
    const templateKey = `template${template}`;
    const templateData = this.data[templateKey];

    templateData.items.push({
      id: generateId(),
      type: 'word',
      typeIndex: 0,
      module: '单词',
      text: '',
      minutes: 3
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

  onAIServiceSwitch(e) {
    const aiService = {
      ...this.data.aiService,
      enabled: e.detail.value
    };
    this.setData({
      aiService
    });
    this.refreshAIServiceStatus(aiService);
  },

  onAIServiceInput(e) {
    const field = e.currentTarget.dataset.field;
    const aiService = {
      ...this.data.aiService,
      [field]: e.detail.value
    };
    this.setData({
      aiService
    });
    this.refreshAIServiceStatus(aiService);
  },

  onAIServiceModeChange(e) {
    const modes = ['cloud', 'http'];
    const mode = modes[Number(e.detail.value)] || 'cloud';
    const aiService = {
      ...this.data.aiService,
      mode
    };
    this.setData({
      aiService
    });
    this.refreshAIServiceStatus(aiService);
  },

  onVersionTap() {
    if (this.data.showDeveloperSettings) {
      return;
    }

    const nextCount = this.data.versionTapCount + 1;
    if (nextCount >= 5) {
      this.setData({
        showDeveloperSettings: true,
        versionTapCount: 0
      });
      wx.showToast({
        title: '已进入开发者设置',
        icon: 'none'
      });
      return;
    }

    this.setData({
      versionTapCount: nextCount
    });
  },

  applyGoalDefaults() {
    const { learningGoal } = this.data;
    const templates = getTemplatesForGoal(learningGoal);
    this.setData({
      templateA: this.toEditableTemplate(templates.A),
      templateB: this.toEditableTemplate(templates.B),
      templateC: this.toEditableTemplate(templates.C),
      diaryTemplates: getDiaryTemplates(learningGoal)
    });

    wx.showToast({
      title: '已生成默认任务',
      icon: 'success'
    });
  },

  saveConfig() {
    const { learningGoal, dailyIntensity, startChecklist, templateA, templateB, templateC, diaryTemplates, reminderEnabled, reminderTime, aiService } = this.data;
    const savableTemplateA = this.toSavableTemplate(templateA);
    const savableTemplateB = this.toSavableTemplate(templateB);
    const savableTemplateC = this.toSavableTemplate(templateC);

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

    if (!savableTemplateA.items || savableTemplateA.items.length === 0) {
      wx.showToast({
        title: '轻量任务不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of savableTemplateA.items) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '轻量任务有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (!savableTemplateB.items || savableTemplateB.items.length === 0) {
      wx.showToast({
        title: '标准任务不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of savableTemplateB.items) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '标准任务有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (!savableTemplateC.items || savableTemplateC.items.length === 0) {
      wx.showToast({
        title: '强化任务不能为空',
        icon: 'none'
      });
      return;
    }

    for (let item of savableTemplateC.items) {
      if (!item.text || !item.text.trim()) {
        wx.showToast({
          title: '强化任务有空项',
          icon: 'none'
        });
        return;
      }
    }

    if (savableTemplateA.threshold < 0 || savableTemplateB.threshold < 0 || savableTemplateC.threshold < 0) {
      wx.showToast({
        title: '阈值不能为负数',
        icon: 'none'
      });
      return;
    }

    const thresholdRules = [
      { name: '轻量任务', template: savableTemplateA },
      { name: '标准任务', template: savableTemplateB },
      { name: '强化任务', template: savableTemplateC }
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
        version: CONFIG_VERSION,
        hasOnboarded: true,
        learningGoal,
        dailyIntensity,
        diaryTemplates,
        aiService: {
          enabled: Boolean(aiService.enabled && (aiService.mode === 'cloud' || aiService.baseUrl)),
          mode: aiService.mode || 'cloud',
          cloudFunctionName: aiService.cloudFunctionName || 'aiProxy',
          baseUrl: String(aiService.baseUrl || '').trim(),
          provider: aiService.provider || 'qwen',
          dictionaryPath: aiService.dictionaryPath || '/dictionary/lookup',
          ttsPath: aiService.ttsPath || '/speech/tts',
          contentPath: aiService.contentPath || '/learning/content',
          planPath: aiService.planPath || '/learning/plan'
        },
        startChecklist,
        templates: {
          A: savableTemplateA,
          B: savableTemplateB,
          C: savableTemplateC
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
          const defaultConfig = getDefaultConfig(this.data.learningGoal, this.data.dailyIntensity);
          defaultConfig.hasOnboarded = true;
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
