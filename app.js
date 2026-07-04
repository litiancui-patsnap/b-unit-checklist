App({
  onLaunch() {
    // 已迁移到自建 API，不再需要云开发
    // if (wx.cloud) {
    //   wx.cloud.init({ traceUser: true });
    // }
    const { initStorage } = require('./utils/storage.js');
    initStorage();
  },
  globalData: {}
});
