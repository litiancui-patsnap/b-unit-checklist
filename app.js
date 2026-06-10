App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      });
    }
    const { initStorage } = require('./utils/storage.js');
    initStorage();
  },
  globalData: {}
});
