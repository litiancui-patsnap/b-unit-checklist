const STORAGE_KEY = 'B_UNIT_CHECKLIST_PRO_V1';
const { getDefaultConfig } = require('./defaultConfig.js');

function initStorage() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    if (!data) {
      const defaultData = {
        config: getDefaultConfig(),
        days: {},
        meta: {
          remind_last_shown_date: ''
        }
      };
      wx.setStorageSync(STORAGE_KEY, defaultData);
    }
  } catch (e) {
    console.error('初始化存储失败', e);
  }
}

function getData() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    return data || { config: getDefaultConfig(), days: {}, meta: { remind_last_shown_date: '' } };
  } catch (e) {
    console.error('读取存储失败', e);
    return { config: getDefaultConfig(), days: {}, meta: { remind_last_shown_date: '' } };
  }
}

function setData(data) {
  try {
    wx.setStorageSync(STORAGE_KEY, data);
    return true;
  } catch (e) {
    console.error('保存存储失败', e);
    return false;
  }
}

function getConfig() {
  const data = getData();
  return data.config;
}

function setConfig(config) {
  const data = getData();
  data.config = config;
  return setData(data);
}

function getDayData(date) {
  const data = getData();
  return data.days[date] || null;
}

function setDayData(date, dayData) {
  const data = getData();
  data.days[date] = {
    ...dayData,
    lastModified: Date.now()
  };
  return setData(data);
}

function getAllDays() {
  const data = getData();
  return data.days;
}

function getMeta() {
  const data = getData();
  return data.meta || { remind_last_shown_date: '' };
}

function setMeta(meta) {
  const data = getData();
  data.meta = meta;
  return setData(data);
}

function resetAllData() {
  const defaultData = {
    config: getDefaultConfig(),
    days: {},
    meta: { remind_last_shown_date: '' }
  };
  return setData(defaultData);
}

module.exports = {
  initStorage,
  getData,
  setData,
  getConfig,
  setConfig,
  getDayData,
  setDayData,
  getAllDays,
  getMeta,
  setMeta,
  resetAllData
};
