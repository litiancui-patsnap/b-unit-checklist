const STORAGE_KEY = 'B_UNIT_CHECKLIST_PRO_V1';
const { getDefaultConfig, getDiaryTemplates, normalizeTaskItem } = require('./defaultConfig.js');

function createDefaultData() {
  return {
    config: getDefaultConfig(),
    days: {},
    meta: {
      remind_last_shown_date: ''
    }
  };
}

function normalizeData(data) {
  if (!data) {
    return createDefaultData();
  }

  const defaultData = createDefaultData();
  const normalized = {
    config: data.config || defaultData.config,
    days: data.days || {},
    meta: data.meta || defaultData.meta
  };

  if (normalized.config.version !== defaultData.config.version) {
    normalized.config = defaultData.config;
  } else {
    normalized.config = {
      ...defaultData.config,
      ...normalized.config,
      templates: {
        ...defaultData.config.templates,
        ...(normalized.config.templates || {})
      },
      reminder: {
        ...defaultData.config.reminder,
        ...(normalized.config.reminder || {})
      },
      aiService: {
        ...defaultData.config.aiService,
        ...(normalized.config.aiService || {})
      }
    };
  }

  normalized.config.diaryTemplates = normalized.config.diaryTemplates || getDiaryTemplates(normalized.config.learningGoal);
  ['A', 'B', 'C'].forEach(key => {
    const template = normalized.config.templates[key] || defaultData.config.templates[key];
    normalized.config.templates[key] = {
      ...template,
      items: (template.items || []).map(normalizeTaskItem)
    };
  });

  return normalized;
}

function initStorage() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    if (!data) {
      wx.setStorageSync(STORAGE_KEY, createDefaultData());
      return;
    }

    const normalizedData = normalizeData(data);
    if (JSON.stringify(normalizedData.config) !== JSON.stringify(data.config || {})) {
      wx.setStorageSync(STORAGE_KEY, normalizedData);
    }
  } catch (e) {
    console.error('初始化存储失败', e);
  }
}

function getData() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    return normalizeData(data);
  } catch (e) {
    console.error('读取存储失败', e);
    return createDefaultData();
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
  return setData(createDefaultData());
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
