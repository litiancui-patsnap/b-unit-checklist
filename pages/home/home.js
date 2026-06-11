const { getToday, getRecentDates, getTodayDate, isTimeAfter } = require('../../utils/date.js');
const { getConfig, getDayData, setDayData, getAllDays, getMeta, setMeta } = require('../../utils/storage.js');
const { countCheckedByItems, normalizeCheckedMap } = require('../../utils/checklist.js');
const { generateId, getGoalLabel, getIntensityLabel, getTaskTypeLabel } = require('../../utils/defaultConfig.js');
const { getPronunciationAudioSource, normalizePronunciationText } = require('../../utils/pronunciation.js');
const { getDailyContent, getWordSuggestions, lookupWord, requestTtsAudio } = require('../../utils/aiLearning.js');
const {
  SPEAKING_SCENES,
  WORD_CATEGORY_OPTIONS,
  WORD_STATUS_OPTIONS,
  buildQuizQuestions,
  collectWordsFromDays,
  createWord,
  getDueReviewWords,
  getQuizResult,
  getSceneStats,
  normalizeWord,
  reviewWord
} = require('../../utils/learning.js');

const DIARY_TEMPLATE_AUDIO_MAP = {
  'I listened to English for ... minutes.': {
    audioText: 'I listened to English for fifteen minutes today.'
  },
  'I can use ... in a sentence.': {
    audioText: 'I can use this phrase in a sentence.'
  },
  'Today I practiced saying: ...': {
    audioText: 'Today I practiced saying this sentence.'
  },
  'I want to say this more naturally: ...': {
    audioText: 'I want to say this more naturally.'
  },
  'The useful phrase I learned today is ...': {
    audioText: 'The useful phrase I learned today is follow up.'
  },
  'One mistake I should avoid is ...': {
    audioText: 'One mistake I should avoid is using the wrong tense.'
  },
  'Today I analyzed this sentence: ...': {
    audioText: 'Today I analyzed this sentence carefully.'
  },
  'This word means ... in the passage.': {
    audioText: 'This word means improve in the passage.'
  },
  'Today I practiced this work expression: ...': {
    audioText: 'Today I practiced this work expression.'
  },
  'I can use this in an email: ...': {
    audioText: 'I can use this in an email.'
  },
  'Today I learned ...': {
    audioText: 'Today I learned something useful.'
  },
  'One new word I remember is ...': {
    audioText: 'One new word I remember is focus.'
  },
  'Tomorrow I will review ...': {
    audioText: 'Tomorrow I will review these new words.'
  }
};

Page({
  data: {
    today: '',
    config: null,
    todayData: {
      template: '',
      start: {},
      items: {},
      complete: false,
      diary: '',
      words: [],
      scenePractice: {},
      contentChecks: {},
      quiz: {
        answers: {}
      },
      rescue: null
    },
    startChecklist: [],
    currentTemplate: null,
    progress: 0,
    streak: 0,
    recent7Days: [],
    reminderEnabled: false,
    reminderTime: '',
    learningGoalText: '',
    intensityText: '',
    planTotalMinutes: 0,
    planRequiredCount: 0,
    planModules: [],
    diaryTemplates: [],
    wordDraft: {
      term: '',
      phonetic: '',
      translation: '',
      example: '',
      category: 'daily'
    },
    wordCategoryOptions: WORD_CATEGORY_OPTIONS,
    wordCategoryIndex: 0,
    wordStatusOptions: WORD_STATUS_OPTIONS,
    reviewQueue: [],
    sceneTemplates: SPEAKING_SCENES,
    sceneStats: {
      completedLines: 0,
      totalLines: 0
    },
    quizQuestions: [],
    quizResult: {
      answeredCount: 0,
      score: 0,
      total: 0,
      completed: false
    },
    dailyContent: null,
    contentSourceText: '离线内容',
    aiBusy: false,
    ttsLoadingText: '',
    shareText: ''
  },

  onLoad() {
    this.audioContext = null;
    this.initAudioContext();
    this.loadData();
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },

  initAudioContext() {
    if (!this.audioContext && wx.createInnerAudioContext) {
      this.audioContext = wx.createInnerAudioContext();
      this.audioContext.onError((error) => {
        console.warn('Pronunciation audio error', error);
        wx.showToast({
          title: '发音播放失败',
          icon: 'none'
        });
      });
    }
    return this.audioContext;
  },

  onShow() {
    this.loadData();
    this.checkReminder();
  },

  loadData() {
    try {
      const today = getToday();
      const config = getConfig();

      if (!config.hasOnboarded) {
        wx.redirectTo({
          url: '/pages/onboarding/onboarding'
        });
        return;
      }

      if (!config || !config.startChecklist || !config.templates) {
        wx.showToast({
          title: '配置加载失败',
          icon: 'none'
        });
        return;
      }

      let todayData = getDayData(today);

      if (!todayData) {
        todayData = {
          template: config.dailyIntensity || 'B',
          start: {},
          items: {},
          complete: false,
          diary: '',
          words: [],
          scenePractice: {},
          contentChecks: {},
          quiz: {
            answers: {}
          },
          rescue: null
        };
      } else if (!todayData.template) {
        todayData.template = config.dailyIntensity || 'B';
      }

      if (!config.templates[todayData.template]) {
        todayData.template = config.templates[config.dailyIntensity] ? config.dailyIntensity : Object.keys(config.templates)[0];
      }

      if (typeof todayData.diary !== 'string') {
        todayData.diary = '';
      }

      const currentTemplate = config.templates[todayData.template];
      todayData.start = normalizeCheckedMap(todayData.start, config.startChecklist || []);
      todayData.items = normalizeCheckedMap(todayData.items, currentTemplate?.items || []);
      todayData.words = (todayData.words || []).map(word => normalizeWord(word, today));
      todayData.scenePractice = todayData.scenePractice || {};
      todayData.contentChecks = todayData.contentChecks || {};
      todayData.quiz = {
        answers: {},
        ...(todayData.quiz || {})
      };

      this.setData({
        today,
        config,
        todayData,
        startChecklist: config.startChecklist || [],
        reminderEnabled: config.reminder?.enabled || false,
        reminderTime: config.reminder?.time || '21:30',
        learningGoalText: getGoalLabel(config.learningGoal),
        intensityText: getIntensityLabel(todayData.template),
        diaryTemplates: this.getDiaryTemplates(config.diaryTemplates || []),
        wordDraft: {
          term: '',
          phonetic: '',
          translation: '',
          example: '',
          category: 'daily'
        },
        wordCategoryIndex: 0,
        shareText: ''
      });

      this.updateCurrentTemplate();
      this.refreshLearningState();
      this.loadDailyContent();
      this.calculateProgress();
      const streak = this.calculateStreak();
      this.loadRecent7Days();
      if (todayData.complete) {
        this.setData({
          shareText: this.generateShareText(todayData, streak)
        });
      }
    } catch (error) {
      console.error('loadData error:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  updateCurrentTemplate() {
    const { todayData, config } = this.data;
    if (todayData.template && config.templates[todayData.template]) {
      const currentTemplate = {
        ...config.templates[todayData.template],
        items: (config.templates[todayData.template].items || []).map(item => ({
          ...item,
          typeLabel: getTaskTypeLabel(item.type)
        }))
      };
      this.setData({
        currentTemplate,
        ...this.getPlanSummary(currentTemplate)
      });
    } else {
      this.setData({
        currentTemplate: null,
        planTotalMinutes: 0,
        planRequiredCount: 0,
        planModules: []
      });
    }
  },

  getPlanSummary(template) {
    const items = template?.items || [];
    const modules = [];

    items.forEach(item => {
      const moduleName = item.module || getTaskTypeLabel(item.type);
      const existing = modules.find(module => module.name === moduleName);
      if (existing) {
        existing.count++;
        existing.minutes += Number(item.minutes || 0);
      } else {
        modules.push({
          name: moduleName,
          count: 1,
          minutes: Number(item.minutes || 0)
        });
      }
    });

    return {
      planTotalMinutes: items.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
      planRequiredCount: template?.threshold || 0,
      planModules: modules
    };
  },

  selectTemplate(e) {
    const template = e.currentTarget.dataset.template;
    const { todayData } = this.data;

    if (todayData.template === template) {
      return;
    }

    todayData.template = template;
    todayData.items = {};
    todayData.rescue = null;

    this.setData({
      todayData,
      intensityText: getIntensityLabel(template),
      shareText: ''
    });
    this.updateCurrentTemplate();
    this.calculateProgress();
    this.saveTodayData();
  },

  refreshLearningState() {
    const { today, todayData } = this.data;
    const allDays = {
      ...getAllDays(),
      [today]: {
        ...(getAllDays()[today] || {}),
        ...todayData
      }
    };
    const reviewQueue = getDueReviewWords(allDays, today);
    const allWords = collectWordsFromDays(allDays, today);
    const quizQuestions = buildQuizQuestions([...reviewQueue, ...allWords], 5);
    const quizResult = getQuizResult(quizQuestions, todayData.quiz?.answers || {});
    const sceneTemplates = SPEAKING_SCENES.map(scene => ({
      ...scene,
      lines: scene.lines.map(line => ({
        ...line,
        checked: Boolean(todayData.scenePractice?.[scene.id]?.[line.id])
      }))
    }));

    this.setData({
      reviewQueue,
      sceneTemplates,
      sceneStats: getSceneStats(todayData.scenePractice || {}),
      quizQuestions,
      quizResult
    });
  },

  toggleStart(e) {
    const id = e.currentTarget.dataset.id;
    const { todayData } = this.data;

    if (!todayData.start) {
      todayData.start = {};
    }

    todayData.start[id] = !todayData.start[id];

    this.setData({ todayData });
    this.calculateProgress();
    this.saveTodayData();
  },

  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const { todayData } = this.data;

    if (!todayData.items) {
      todayData.items = {};
    }

    todayData.items[id] = !todayData.items[id];

    this.setData({ todayData });
    this.calculateProgress();
    this.saveTodayData();
  },

  onDiaryInput(e) {
    const value = e.detail.value;
    const { todayData } = this.data;
    todayData.diary = value;
    this.setData({
      todayData,
      shareText: todayData.complete ? this.generateShareText(todayData) : ''
    });
  },

  saveDiary() {
    this.saveTodayData();
  },

  useDiaryTemplate(e) {
    const template = e.currentTarget.dataset.template;
    const { todayData } = this.data;
    todayData.diary = template;
    this.setData({
      todayData,
      shareText: todayData.complete ? this.generateShareText(todayData) : ''
    });
    this.saveTodayData();
  },

  getDiaryTemplates(templates = []) {
    return templates.map((template, index) => {
      const text = typeof template === 'string' ? template : template.text;
      const audio = DIARY_TEMPLATE_AUDIO_MAP[text] || {};
      return {
        id: `diary_${index + 1}`,
        text,
        audioText: audio.audioText || normalizePronunciationText(text),
        audioSrc: audio.audioSrc || ''
      };
    });
  },

  onWordDraftInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`wordDraft.${field}`]: value
    });
  },

  onWordCategoryChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.wordCategoryOptions[index] || this.data.wordCategoryOptions[0];
    this.setData({
      wordCategoryIndex: index,
      'wordDraft.category': option.value
    });
  },

  async lookupWordDraft() {
    const { config, wordDraft, wordCategoryOptions, wordCategoryIndex } = this.data;
    const term = (wordDraft.term || '').trim();
    const category = wordCategoryOptions[wordCategoryIndex]?.label || '日常';

    if (!term) {
      wx.showToast({
        title: '先输入英文单词',
        icon: 'none'
      });
      return;
    }

    this.setData({ aiBusy: true });
    const result = await lookupWord(config, term, category);
    this.setData({ aiBusy: false });

    if (!result) {
      wx.showToast({
        title: '暂未查到释义',
        icon: 'none'
      });
      return;
    }

    this.setData({
      wordDraft: {
        ...wordDraft,
        term: result.term || term,
        phonetic: result.phonetic || wordDraft.phonetic,
        translation: result.translation || wordDraft.translation,
        example: result.example || wordDraft.example,
        category: result.category || wordDraft.category,
        audioSrc: result.audioSrc || '',
        source: result.source || 'ai'
      }
    });

    wx.showToast({
      title: result.source === 'fallback' ? '已用内置释义' : '已补全释义',
      icon: 'none'
    });
  },

  async addRecommendedWords() {
    const { today, todayData, config } = this.data;
    const goal = config.learningGoal || 'daily';
    const remain = Math.max(0, 10 - (todayData.words || []).length);

    if (!remain) {
      wx.showToast({
        title: '今日单词已满',
        icon: 'none'
      });
      return;
    }

    this.setData({ aiBusy: true });
    const suggestions = await getWordSuggestions(config, goal, Math.min(3, remain));
    this.setData({ aiBusy: false });

    const existingTerms = new Set((todayData.words || []).map(word => String(word.term || '').toLowerCase()));
    const newWords = suggestions
      .filter(item => item.term && item.translation && !existingTerms.has(item.term.toLowerCase()))
      .map(item => createWord(item, today, generateId('word')));

    if (!newWords.length) {
      wx.showToast({
        title: '暂无可添加推荐词',
        icon: 'none'
      });
      return;
    }

    todayData.words = [
      ...(todayData.words || []),
      ...newWords
    ].slice(0, 10);

    this.autoCheckTaskByType(todayData, 'word');
    this.setData({ todayData });
    this.saveTodayData();
    this.refreshLearningState();
    this.calculateProgress();

    wx.showToast({
      title: '已添加推荐词',
      icon: 'success'
    });
  },

  addWord() {
    const { today, todayData, wordDraft } = this.data;
    const words = todayData.words || [];

    if (words.length >= 10) {
      wx.showToast({
        title: '今日最多添加10个',
        icon: 'none'
      });
      return;
    }

    if (!wordDraft.term.trim() || !wordDraft.translation.trim()) {
      wx.showToast({
        title: '英文和中文不能为空',
        icon: 'none'
      });
      return;
    }

    todayData.words = [
      ...words,
      createWord(wordDraft, today, generateId('word'))
    ];

    this.setData({
      todayData,
      wordDraft: {
        term: '',
        phonetic: '',
        translation: '',
        example: '',
        category: 'daily'
      }
    });
    this.saveTodayData();
    this.refreshLearningState();

    wx.showToast({
      title: todayData.words.length < 3 ? '建议至少添加3个' : '已添加',
      icon: 'none'
    });
  },

  deleteWord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个单词吗？',
      success: (res) => {
        if (res.confirm) {
          const { todayData } = this.data;
          todayData.words = (todayData.words || []).filter(word => word.id !== id);
          this.setData({ todayData });
          this.saveTodayData();
          this.refreshLearningState();
        }
      }
    });
  },

  setWordStatus(e) {
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    const { today, todayData } = this.data;

    todayData.words = (todayData.words || []).map(word => {
      if (word.id !== id) {
        return word;
      }

      return normalizeWord({
        ...word,
        status,
        nextReviewDate: status === 'mastered' ? '' : (word.nextReviewDate || today)
      }, today);
    });

    this.setData({ todayData });
    this.saveTodayData();
    this.refreshLearningState();
  },

  markReviewWord(e) {
    const sourceDate = e.currentTarget.dataset.date;
    const id = e.currentTarget.dataset.id;
    const mastered = e.currentTarget.dataset.mastered === true || e.currentTarget.dataset.mastered === 'true';
    const { today, todayData } = this.data;

    if (sourceDate === today) {
      todayData.words = (todayData.words || []).map(word => (
        word.id === id ? reviewWord(word, today, mastered) : word
      ));
      this.setData({ todayData });
      this.saveTodayData();
    } else {
      const sourceData = getDayData(sourceDate);
      if (sourceData) {
        sourceData.words = (sourceData.words || []).map(word => (
          word.id === id ? reviewWord(word, today, mastered) : word
        ));
        setDayData(sourceDate, sourceData);
      }
    }

    this.refreshLearningState();
    wx.showToast({
      title: mastered ? '已标记掌握' : '已复习',
      icon: 'success'
    });
  },

  toggleSceneLine(e) {
    const sceneId = e.currentTarget.dataset.scene;
    const lineId = e.currentTarget.dataset.line;
    const { todayData } = this.data;

    if (!todayData.scenePractice) {
      todayData.scenePractice = {};
    }
    if (!todayData.scenePractice[sceneId]) {
      todayData.scenePractice[sceneId] = {};
    }

    todayData.scenePractice[sceneId][lineId] = !todayData.scenePractice[sceneId][lineId];
    this.setData({ todayData });
    this.saveTodayData();
    this.refreshLearningState();
  },

  playPronunciation(e) {
    const text = normalizePronunciationText(e.currentTarget.dataset.text || '');
    const sourceUrl = getPronunciationAudioSource(e.currentTarget.dataset.src || '');
    if (!text) {
      wx.showToast({
        title: '暂无可发音内容',
        icon: 'none'
      });
      return;
    }

    const audio = this.initAudioContext();
    if (!audio) {
      wx.showToast({
        title: '当前环境不支持发音',
        icon: 'none'
      });
      return;
    }

    if (!sourceUrl) {
      this.playTtsPronunciation(text);
      return;
    }

    this.playAudioSource(sourceUrl);
  },

  async playTtsPronunciation(text) {
    const { config } = this.data;
    this.setData({ ttsLoadingText: text });
    const ttsUrl = await requestTtsAudio(config, text);
    this.setData({ ttsLoadingText: '' });

    if (!ttsUrl) {
      wx.showToast({
        title: '请先配置发音服务',
        icon: 'none'
      });
      return;
    }

    this.playAudioSource(ttsUrl);
  },

  playAudioSource(sourceUrl) {
    const audio = this.initAudioContext();
    if (!audio) {
      wx.showToast({
        title: '当前环境不支持发音',
        icon: 'none'
      });
      return;
    }

    audio.stop();
    audio.autoplay = false;
    audio.src = sourceUrl;
    try {
      audio.play();
    } catch (error) {
      wx.showToast({
        title: '发音播放失败',
        icon: 'none'
      });
    }
  },

  async loadDailyContent() {
    const { config, today } = this.data;
    const content = await getDailyContent(config, config.learningGoal || 'daily', today);
    this.setData({
      dailyContent: content,
      contentSourceText: content.source === 'fallback' ? '离线内容' : 'AI生成'
    });
  },

  refreshDailyContent() {
    this.loadDailyContent();
  },

  toggleContentCheck(e) {
    const key = e.currentTarget.dataset.key;
    const type = e.currentTarget.dataset.type || 'read';
    const { todayData } = this.data;

    if (!todayData.contentChecks) {
      todayData.contentChecks = {};
    }

    todayData.contentChecks[key] = !todayData.contentChecks[key];
    if (todayData.contentChecks[key]) {
      this.autoCheckTaskByType(todayData, type);
    }

    this.setData({ todayData });
    this.saveTodayData();
    this.calculateProgress();
  },

  answerQuiz(e) {
    const questionId = e.currentTarget.dataset.question;
    const option = e.currentTarget.dataset.option;
    const { todayData, quizQuestions } = this.data;

    if (!todayData.quiz) {
      todayData.quiz = { answers: {} };
    }
    if (!todayData.quiz.answers) {
      todayData.quiz.answers = {};
    }

    todayData.quiz.answers[questionId] = option;
    const quizResult = getQuizResult(quizQuestions, todayData.quiz.answers);
    todayData.quiz = {
      ...todayData.quiz,
      score: quizResult.score,
      completed: quizResult.completed
    };

    if (quizResult.completed) {
      this.autoCheckTaskByType(todayData, 'word');
    }

    this.setData({ todayData, quizResult });
    this.saveTodayData();
    this.calculateProgress();
  },

  autoCheckTaskByType(todayData, type) {
    const { currentTemplate } = this.data;
    const targetTask = (currentTemplate?.items || []).find(item => item.type === type);
    if (!targetTask) {
      return;
    }
    if (!todayData.items) {
      todayData.items = {};
    }
    todayData.items[targetTask.id] = true;
  },

  calculateProgress() {
    const { todayData, startChecklist, currentTemplate } = this.data;

    let totalItems = startChecklist.length;
    let checkedItems = countCheckedByItems(todayData.start, startChecklist);

    if (currentTemplate) {
      totalItems += currentTemplate.items.length;
      checkedItems += countCheckedByItems(todayData.items, currentTemplate.items);
    }

    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    this.setData({ progress });
  },

  completeToday() {
    const { todayData, config } = this.data;

    if (!todayData.template) {
      wx.showToast({
        title: '先选择学习强度',
        icon: 'none'
      });
      return;
    }

    const template = config.templates[todayData.template];
    if (!template) {
      wx.showToast({
        title: '当前强度暂无配置',
        icon: 'none'
      });
      return;
    }

    const threshold = template.threshold;
    const checkedCount = countCheckedByItems(todayData.items, template.items);

    if (checkedCount < threshold) {
      const lightThreshold = config.templates.A?.threshold || 1;
      if (todayData.template !== 'A' && checkedCount >= lightThreshold) {
        wx.showModal({
          title: '轻量补救完成',
          content: `当前完成 ${checkedCount} 项，未达${getIntensityLabel(todayData.template)}要求。是否按轻量补救完成，保留连续学习？`,
          success: (res) => {
            if (res.confirm) {
              this.markTodayComplete({
                enabled: true,
                from: todayData.template,
                intensity: 'A',
                checkedCount
              });
            }
          }
        });
        return;
      }

      wx.showToast({
        title: `${getIntensityLabel(todayData.template)}需完成至少${threshold}项`,
        icon: 'none'
      });
      return;
    }

    this.markTodayComplete(null);
  },

  markTodayComplete(rescue) {
    const { todayData } = this.data;
    todayData.complete = true;
    todayData.rescue = rescue ? {
      ...rescue,
      completedAt: Date.now()
    } : null;
    this.setData({ todayData });
    this.saveTodayData();
    const streak = this.calculateStreak();
    this.setData({
      shareText: this.generateShareText(todayData, streak)
    });

    wx.showToast({
      title: '今日英语完成',
      icon: 'success'
    });
  },

  uncompleteToday() {
    const { todayData } = this.data;
    todayData.complete = false;
    todayData.rescue = null;
    this.setData({ todayData, shareText: '' });
    this.saveTodayData();
    this.calculateStreak();

    wx.showToast({
      title: '已取消完成',
      icon: 'none'
    });
  },

  resetToday() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空今天的所有数据吗？',
      success: (res) => {
        if (res.confirm) {
          const todayData = {
            template: this.data.config?.dailyIntensity || 'B',
            start: {},
            items: {},
            complete: false,
            diary: '',
            words: [],
            scenePractice: {},
            contentChecks: {},
            quiz: {
              answers: {}
            },
            rescue: null
          };

          this.setData({
            todayData,
            shareText: '',
            intensityText: getIntensityLabel(todayData.template)
          });
          this.updateCurrentTemplate();
          this.refreshLearningState();
          this.calculateProgress();
          this.saveTodayData();
          this.calculateStreak();

          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  saveTodayData() {
    try {
      const { today, todayData } = this.data;
      const success = setDayData(today, todayData);
      if (!success) {
        console.error('保存数据失败');
      }
    } catch (error) {
      console.error('saveTodayData error:', error);
    }
  },

  calculateStreak() {
    const allDays = getAllDays();
    const dates = getRecentDates(365);
    let streak = 0;

    for (let date of dates) {
      const dayData = allDays[date];
      if (dayData && dayData.complete) {
        streak++;
      } else {
        break;
      }
    }

    this.setData({ streak });
    return streak;
  },

  loadRecent7Days() {
    const dates = getRecentDates(7);
    const allDays = getAllDays();
    const recent7Days = [];

    dates.forEach(date => {
      const dayData = allDays[date];
      recent7Days.push({
        date,
        template: dayData?.rescue?.enabled ? `${getIntensityLabel(dayData.template)}→轻量` : (dayData?.template ? getIntensityLabel(dayData.template) : '-'),
        complete: dayData?.complete ? '✅' : '—'
      });
    });

    this.setData({ recent7Days });
  },

  checkReminder() {
    const { config } = this.data;
    if (!config || !config.reminder.enabled) {
      return;
    }

    const today = getToday();
    const todayData = getDayData(today);

    if (todayData && todayData.complete) {
      return;
    }

    const meta = getMeta();
    if (meta.remind_last_shown_date === today) {
      return;
    }

    const now = getTodayDate();
    const reminderTime = config.reminder.time;

    if (isTimeAfter(now, reminderTime)) {
      wx.showToast({
        title: '该学英语啦！',
        icon: 'none',
        duration: 3000
      });

      meta.remind_last_shown_date = today;
      setMeta(meta);
    }
  },

  generateShareText(dayData = this.data.todayData, streakValue = this.data.streak) {
    const { today, streak, learningGoalText, intensityText, config } = this.data;
    const templateItems = config?.templates?.[dayData.template]?.items || [];
    const checkedCount = countCheckedByItems(dayData.items, templateItems);
    const diary = (dayData.diary || '').trim();
    let text = `我今天完成了英语学习打卡！\n`;
    text += `日期：${today}\n`;
    text += `目标：${learningGoalText || '日常英语'}\n`;
    text += `强度：${intensityText || getIntensityLabel(dayData.template)}\n`;
    text += `任务：完成 ${checkedCount} 项\n`;
    if (dayData.rescue?.enabled) {
      text += `补救：按轻量完成，保留连续学习\n`;
    }
    if ((dayData.words || []).length) {
      text += `今日单词：${dayData.words.length} 个\n`;
    }
    if (dayData.quiz?.completed) {
      text += `单词小测：${dayData.quiz.score || 0}/${this.data.quizResult.total || 0}\n`;
    }
    text += `连续学习：${streakValue || streak} 天`;
    if (diary) {
      text += `\n今日英文句子：${diary}`;
    }
    return text;
  },

  copyShareText() {
    const shareText = this.data.shareText || this.generateShareText();
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({
          title: '分享文案已复制',
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
  }
});
