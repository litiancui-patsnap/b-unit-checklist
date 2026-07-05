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
      startChecklist: cloneData(config.startChecklist),
      templateA: cloneData(config.templates.A),
      templateB: cloneData(config.templates.B),
      templateC: cloneData(config.templates.C),
      diaryTemplates: cloneData(config.diaryTemplates || getDiaryTemplates(config.learningGoal)),
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
    });

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
