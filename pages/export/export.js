const { generateExportText } = require('../../utils/export.js');

Page({
  data: {
    exportText: '',
    onlyCompleted: false
  },

  onLoad() {
    this.generateExport();
  },

  onShow() {
    this.generateExport();
  },

  generateExport() {
    const { onlyCompleted } = this.data;
    const exportText = generateExportText(onlyCompleted);
    this.setData({ exportText });
  },

  onOnlyCompletedChange(e) {
    this.setData({
      onlyCompleted: e.detail.value
    }, () => {
      this.generateExport();
    });
  },

  copyText() {
    const { exportText } = this.data;
    wx.setClipboardData({
      data: exportText,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  refreshExport() {
    this.generateExport();
    wx.showToast({
      title: '已刷新',
      icon: 'success'
    });
  }
});
