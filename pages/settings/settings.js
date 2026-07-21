const { getConfig, setConfig } = require('../../utils/storage.js');
const {
  CONFIG_VERSION,
  DAILY_INTENSITIES,
  LEARNING_GOALS,
  getDefaultConfig,
  getDiaryTemplates,
  getTemplatesForGoal
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

function hasValidStartChecklist(startChecklist = []) {
  return Array.isArray(startChecklist) && startChecklist.length > 0 && startChecklist.every(item => item.text && item.text.trim());
}

function hasValidTemplate(template = {}) {
  const items = template.items || [];
  return items.length > 0 &&
    template.threshold >= 1 &&
    template.threshold <= items.length &&
    items.every(item => item.text && item.text.trim());
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function getTemplateMinutes(template = {}) {
  return (template.items || []).reduce((sum, item) => sum + Number(item.minutes || 0), 0);
}

function buildPlanPreviews(templates = {}, activeIntensity = 'B') {
  const labels = {
    A: { name: '轻量保底', description: '忙碌时保住连续性' },
    B: { name: '标准推进', description: '日常默认执行方案' },
    C: { name: '强化训练', description: '时间充足时系统练习' }
  };

  return ['A', 'B', 'C'].map(key => {
    const template = templates[key] || { items: [], threshold: 0 };
    return {
      key,
      ...labels[key],
      title: template.title || labels[key].name,
      taskCount: (template.items || []).length,
      minutes: getTemplateMinutes(template),
      threshold: Number(template.threshold || 0),
      active: key === activeIntensity
    };
  });
}

function getStrategySummary(goalOptions, intensityOptions, goal, intensity, templates) {
  const goalOption = goalOptions.find(item => item.value === goal) || goalOptions[0];
  const intensityOption = intensityOptions.find(item => item.value === intensity) || intensityOptions[1];
  const activeTemplate = templates[intensity] || { items: [] };
  return {
    selectedGoalLabel: goalOption.label,
    selectedGoalDescription: goalOption.description,
    selectedIntensityLabel: intensityOption.label,
    selectedIntensityDescription: intensityOption.description,
    strategyMinutes: getTemplateMinutes(activeTemplate),
    strategyTaskCount: (activeTemplate.items || []).length,
    planPreviews: buildPlanPreviews(templates, intensity)
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
    showMethodGuide: false,
    selectedGoalLabel: '日常英语',
    selectedGoalDescription: '每天保持英语输入和输出',
    selectedIntensityLabel: '标准',
    selectedIntensityDescription: '每天 15-25 分钟',
    strategyMinutes: 0,
    strategyTaskCount: 0,
    planPreviews: []
  },

  onLoad() {
    this.skipNextShowReload = true;
    this.loadConfig();
  },

  onShow() {
    if (this.skipNextShowReload) {
      this.skipNextShowReload = false;
      return;
    }
    this.loadConfig();
  },

  loadConfig() {
    const config = getConfig();
    const learningGoalIndex = this.data.learningGoalOptions.findIndex(item => item.value === config.learningGoal);
    const dailyIntensityIndex = this.data.dailyIntensityOptions.findIndex(item => item.value === config.dailyIntensity);

    const aiService = JSON.parse(JSON.stringify(config.aiService || {}));
    const status = getAIServiceStatus(aiService);

    const templates = {
      A: cloneData(config.templates.A),
      B: cloneData(config.templates.B),
      C: cloneData(config.templates.C)
    };
    const summary = getStrategySummary(
      this.data.learningGoalOptions,
      this.data.dailyIntensityOptions,
      config.learningGoal || 'daily',
      config.dailyIntensity || 'B',
      templates
    );

    this.setData({
      config,
      learningGoal: config.learningGoal || 'daily',
      dailyIntensity: config.dailyIntensity || 'B',
      learningGoalIndex: learningGoalIndex >= 0 ? learningGoalIndex : 0,
      dailyIntensityIndex: dailyIntensityIndex >= 0 ? dailyIntensityIndex : 1,
      startChecklist: cloneData(config.startChecklist),
      templateA: templates.A,
      templateB: templates.B,
      templateC: templates.C,
      diaryTemplates: cloneData(config.diaryTemplates || getDiaryTemplates(config.learningGoal)),
      reminderEnabled: config.reminder.enabled,
      reminderTime: config.reminder.time,
      aiService,
      aiServiceStatusText: status.text,
      aiServiceStatusClass: status.className,
      ...summary
    });
  },

  refreshStrategySummary() {
    const templates = {
      A: this.data.templateA || { items: [] },
      B: this.data.templateB || { items: [] },
      C: this.data.templateC || { items: [] }
    };
    this.setData(getStrategySummary(
      this.data.learningGoalOptions,
      this.data.dailyIntensityOptions,
      this.data.learningGoal,
      this.data.dailyIntensity,
      templates
    ));
  },

  refreshAIServiceStatus(aiService = this.data.aiService) {
    const status = getAIServiceStatus(aiService);
    this.setData({
      aiServiceStatusText: status.text,
      aiServiceStatusClass: status.className
    });
  },

  onLearningGoalChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.learningGoalOptions[index];
    if (option) {
      const templates = getTemplatesForGoal(option.value);
      this.setData({
        learningGoal: option.value,
        learningGoalIndex: index,
        templateA: cloneData(templates.A),
        templateB: cloneData(templates.B),
        templateC: cloneData(templates.C),
        diaryTemplates: getDiaryTemplates(option.value)
      }, () => this.refreshStrategySummary());
    }
  },

  onDailyIntensityChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.dailyIntensityOptions[index];
    if (option) {
      this.setData({
        dailyIntensity: option.value,
        dailyIntensityIndex: index
      }, () => this.refreshStrategySummary());
    }
  },

  selectLearningGoal(e) {
    this.onLearningGoalChange({ detail: { value: e.currentTarget.dataset.index } });
  },

  selectDailyIntensity(e) {
    this.onDailyIntensityChange({ detail: { value: e.currentTarget.dataset.index } });
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
      templateA: cloneData(templates.A),
      templateB: cloneData(templates.B),
      templateC: cloneData(templates.C),
      diaryTemplates: getDiaryTemplates(learningGoal)
    }, () => this.refreshStrategySummary());

    wx.showToast({
      title: '已生成默认任务',
      icon: 'success'
    });
  },

  saveConfig() {
    const { learningGoal, dailyIntensity, startChecklist, templateA, templateB, templateC, diaryTemplates, reminderEnabled, reminderTime, aiService } = this.data;
    const defaultConfig = getDefaultConfig(learningGoal, dailyIntensity);
    const currentTemplates = {
      A: templateA || defaultConfig.templates.A,
      B: templateB || defaultConfig.templates.B,
      C: templateC || defaultConfig.templates.C
    };
    const safeTemplates = {
      A: hasValidTemplate(currentTemplates.A) ? currentTemplates.A : defaultConfig.templates.A,
      B: hasValidTemplate(currentTemplates.B) ? currentTemplates.B : defaultConfig.templates.B,
      C: hasValidTemplate(currentTemplates.C) ? currentTemplates.C : defaultConfig.templates.C
    };
    const safeStartChecklist = hasValidStartChecklist(startChecklist) ? startChecklist : defaultConfig.startChecklist;

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
        startChecklist: safeStartChecklist,
        templates: safeTemplates,
        reminder: {
          enabled: reminderEnabled,
          time: reminderTime
        }
      };

      const success = setConfig(newConfig);

      if (success) {
        this.loadConfig();
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
  },

  goTodayPlan() {
    wx.switchTab({ url: '/pages/home/home' });
  }
});
