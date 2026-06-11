const { getConfig, setConfig } = require('../../utils/storage.js');
const { DAILY_INTENSITIES, LEARNING_GOALS, getDefaultConfig } = require('../../utils/defaultConfig.js');

function markActiveOptions(options, selectedValue) {
  return options.map(item => ({
    ...item,
    activeClass: item.value === selectedValue ? 'active' : ''
  }));
}

Page({
  data: {
    goals: markActiveOptions(LEARNING_GOALS, 'daily'),
    intensities: markActiveOptions(DAILY_INTENSITIES, 'B'),
    selectedGoal: 'daily',
    selectedIntensity: 'B'
  },

  onLoad() {
    const config = getConfig();
    if (config.hasOnboarded) {
      wx.switchTab({
        url: '/pages/home/home'
      });
      return;
    }

    this.setData({
      selectedGoal: config.learningGoal || 'daily',
      selectedIntensity: config.dailyIntensity || 'B',
      goals: markActiveOptions(LEARNING_GOALS, config.learningGoal || 'daily'),
      intensities: markActiveOptions(DAILY_INTENSITIES, config.dailyIntensity || 'B')
    });
  },

  selectGoal(e) {
    const selectedGoal = e.currentTarget.dataset.goal;
    this.setData({
      selectedGoal,
      goals: markActiveOptions(LEARNING_GOALS, selectedGoal)
    });
  },

  selectIntensity(e) {
    const selectedIntensity = e.currentTarget.dataset.intensity;
    this.setData({
      selectedIntensity,
      intensities: markActiveOptions(DAILY_INTENSITIES, selectedIntensity)
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
