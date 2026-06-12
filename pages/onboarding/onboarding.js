const { getConfig, setConfig } = require('../../utils/storage.js');
const { DAILY_INTENSITIES, LEARNING_GOALS, getDefaultConfig, getGoalLabel, getIntensityLabel } = require('../../utils/defaultConfig.js');

function markActiveOptions(options, selectedValue) {
  return options.map(item => ({
    ...item,
    activeClass: item.value === selectedValue ? 'active' : ''
  }));
}

function getPlanPreview(goal, intensity) {
  const config = getDefaultConfig(goal, intensity);
  const template = config.templates[intensity] || config.templates.B;
  const items = template.items || [];
  const modules = [];

  items.forEach(item => {
    const moduleName = item.module || item.type;
    const existing = modules.find(module => module.name === moduleName);
    if (existing) {
      existing.count++;
      existing.minutes += Number(item.minutes || 0);
      return;
    }

    modules.push({
      name: moduleName,
      count: 1,
      minutes: Number(item.minutes || 0)
    });
  });

  return {
    goalLabel: getGoalLabel(goal),
    intensityLabel: getIntensityLabel(intensity),
    title: template.title,
    totalMinutes: items.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
    totalCount: items.length,
    threshold: template.threshold || 0,
    modules,
    items: items.slice(0, 5),
    diaryTemplates: config.diaryTemplates.slice(0, 2)
  };
}

function getIntensityPreviews(goal, selectedIntensity) {
  return DAILY_INTENSITIES.map(item => {
    const preview = getPlanPreview(goal, item.value);
    return {
      value: item.value,
      label: item.label,
      totalMinutes: preview.totalMinutes,
      totalCount: preview.totalCount,
      threshold: preview.threshold,
      activeClass: item.value === selectedIntensity ? 'active' : ''
    };
  });
}

Page({
  data: {
    goals: markActiveOptions(LEARNING_GOALS, 'daily'),
    intensityPreviews: getIntensityPreviews('daily', 'B'),
    selectedGoal: 'daily',
    selectedIntensity: 'B',
    planPreview: getPlanPreview('daily', 'B')
  },

  onLoad() {
    const config = getConfig();
    if (config.hasOnboarded) {
      wx.switchTab({
        url: '/pages/home/home'
      });
      return;
    }

    const selectedGoal = config.learningGoal || 'daily';
    const selectedIntensity = config.dailyIntensity || 'B';
    this.setData({
      selectedGoal,
      selectedIntensity,
      goals: markActiveOptions(LEARNING_GOALS, selectedGoal),
      intensityPreviews: getIntensityPreviews(selectedGoal, selectedIntensity),
      planPreview: getPlanPreview(selectedGoal, selectedIntensity)
    });
  },

  selectGoal(e) {
    const selectedGoal = e.currentTarget.dataset.goal;
    const { selectedIntensity } = this.data;
    this.setData({
      selectedGoal,
      goals: markActiveOptions(LEARNING_GOALS, selectedGoal),
      intensityPreviews: getIntensityPreviews(selectedGoal, selectedIntensity),
      planPreview: getPlanPreview(selectedGoal, selectedIntensity)
    });
  },

  selectIntensity(e) {
    const selectedIntensity = e.currentTarget.dataset.intensity;
    const { selectedGoal } = this.data;
    this.setData({
      selectedIntensity,
      intensityPreviews: getIntensityPreviews(selectedGoal, selectedIntensity),
      planPreview: getPlanPreview(selectedGoal, selectedIntensity)
    });
  },

  startLearning() {
    const { selectedGoal, selectedIntensity } = this.data;
    const config = getDefaultConfig(selectedGoal, selectedIntensity);
    config.hasOnboarded = true;

    const success = setConfig(config);
    if (!success) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      return;
    }

    wx.switchTab({
      url: '/pages/home/home'
    });
  }
});
