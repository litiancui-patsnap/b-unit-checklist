App({
  onLaunch() {
    const { initStorage } = require('./utils/storage.js');
    initStorage();
  },
  globalData: {}
});
