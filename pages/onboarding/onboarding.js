const { getConfig, setConfig } = require('../../utils/storage.js');
const { DAILY_INTENSITIES, LEARNING_GOALS, getDefaultConfig } = require('../../utils/defaultConfig.js');

Page({
  data: {
    goals: LEARNING_GOALS,
    intensities: DAILY_INTENSITIES,
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
      selectedIntensity: config.dailyIntensity || 'B'
    });
  },

  selectGoal(e) {
    this.setData({
      selectedGoal: e.currentTarget.dataset.goal
    });
  },

  selectIntensity(e) {
    this.setData({
      selectedIntensity: e.currentTarget.dataset.intensity
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
