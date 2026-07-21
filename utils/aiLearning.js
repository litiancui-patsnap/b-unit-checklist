const FALLBACK_WORDS = {
  daily: [
    word('focus', '/ˈfoʊkəs/', 'n. 焦点；v. 集中注意力', 'I need to focus on English today.', '日常'),
    word('review', '/rɪˈvjuː/', 'v. 复习；n. 回顾', 'I will review three new words tonight.', '日常'),
    word('habit', '/ˈhæbɪt/', 'n. 习惯', 'Learning English is a daily habit.', '日常')
  ],
  spoken: [
    word('actually', '/ˈæktʃuəli/', 'adv. 其实；实际上', 'Actually, I agree with you.', '口语'),
    word('probably', '/ˈprɑːbəbli/', 'adv. 可能', 'I will probably call you later.', '口语'),
    word('confident', '/ˈkɑːnfɪdənt/', 'adj. 自信的', 'I want to sound more confident.', '口语')
  ],
  cet: [
    word('efficient', '/ɪˈfɪʃnt/', 'adj. 高效的', 'This is an efficient way to review vocabulary.', '四六级'),
    word('maintain', '/meɪnˈteɪn/', 'v. 维持；保持', 'It is important to maintain a steady routine.', '四六级'),
    word('benefit', '/ˈbenɪfɪt/', 'n. 益处；v. 受益', 'Reading every day has many benefits.', '四六级')
  ],
  exam: [
    word('analyze', '/ˈænəlaɪz/', 'v. 分析', 'We need to analyze the sentence structure.', '考研'),
    word('context', '/ˈkɑːntekst/', 'n. 语境；背景', 'Guess the meaning from the context.', '考研'),
    word('significant', '/sɪɡˈnɪfɪkənt/', 'adj. 重要的；显著的', 'This change is significant.', '考研')
  ],
  business: [
    word('deadline', '/ˈdedlaɪn/', 'n. 截止日期', 'Can we confirm the deadline?', '职场'),
    word('clarify', '/ˈklærəfaɪ/', 'v. 澄清；说明', 'Could you clarify this requirement?', '职场'),
    word('proposal', '/prəˈpoʊzl/', 'n. 提案；建议', 'I will send the proposal today.', '职场')
  ]
};

const FALLBACK_CONTENT = {
  daily: content(
    'Small steps build strong English.',
    'Daily English practice does not need to be long. A short sentence, a few words, and one minute of speaking can still keep the habit alive.',
    'I learned one useful expression today.',
    'The word you remember today / will become easier to use / when you meet it again tomorrow.'
  ),
  spoken: content(
    'Speak slowly, but speak every day.',
    'Speaking practice works best when you repeat useful sentences aloud. Focus on rhythm first, then accuracy.',
    'Could you say that again more slowly?',
    'When you repeat a sentence aloud, / your mouth starts to remember / the sound pattern.'
  ),
  cet: content(
    'Vocabulary grows through review.',
    'For exam preparation, new words are only the first step. Review and examples help words stay in long-term memory.',
    'This phrase is useful in writing.',
    'A word becomes useful / only after you can recognize it / in a new sentence.'
  ),
  exam: content(
    'Read the sentence before translating it.',
    'Long sentences are easier when you first find the main structure. Then handle modifiers and clauses one by one.',
    'The main idea of this sentence is ...',
    'Although the sentence looks long, / its core meaning is simple / after we find the subject and verb.'
  ),
  business: content(
    'Clear English makes work smoother.',
    'In workplace communication, simple and direct sentences are often better than complicated expressions.',
    'I will follow up by email.',
    'Before a meeting ends, / it is useful to confirm / the owner and the deadline.'
  )
};

const SERVICE_REQUEST_TIMEOUT = 8000;
const SERVICE_HEALTH_TIMEOUT = 5000;

function word(term, phonetic, translation, example, category) {
  return {
    term,
    phonetic,
    translation,
    example,
    category,
    source: 'fallback'
  };
}

function content(sentence, shortReading, sceneExpression, longSentence) {
  return {
    sentence,
    shortReading,
    sceneExpression,
    longSentence,
    source: 'fallback'
  };
}

function normalizeAIService(config = {}) {
  const service = config.aiService || {};
  const mode = service.mode || 'cloud';
  return {
    enabled: Boolean(service.enabled && (mode === 'cloud' || service.baseUrl)),
    mode,
    cloudFunctionName: service.cloudFunctionName || 'aiProxy',
    baseUrl: String(service.baseUrl || '').replace(/\/+$/, ''),
    provider: service.provider || 'qwen',
    dictionaryPath: service.dictionaryPath || '/dictionary/lookup',
    ttsPath: service.ttsPath || '/speech/tts',
    contentPath: service.contentPath || '/learning/content',
    planPath: service.planPath || '/learning/plan'
  };
}

function buildServiceUrl(service, path) {
  const normalized = normalizeAIService({ aiService: service });
  if (!normalized.enabled) {
    return '';
  }
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${normalized.baseUrl}${cleanPath}`;
}

function createTimedResolver(resolve, timeout) {
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    resolve(null);
  }, timeout);

  return value => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve(value);
  };
}

function requestLearningService(config, path, payload) {
  const service = normalizeAIService(config);

  if (service.enabled && service.mode === 'cloud') {
    return requestCloudFunction(service, path, payload);
  }

  const url = buildServiceUrl(service, path);

  if (!url || typeof wx === 'undefined' || !wx.request) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    const finish = createTimedResolver(resolve, SERVICE_REQUEST_TIMEOUT);
    wx.request({
      url,
      method: 'POST',
      timeout: SERVICE_REQUEST_TIMEOUT,
      data: {
        provider: service.provider,
        ...payload
      },
      header: {
        'content-type': 'application/json'
      },
      success: res => finish(res.data || null),
      fail: () => finish(null)
    });
  });
}

function getActionFromPath(path = '') {
  if (path.includes('dictionary')) {
    return 'dictionary.lookup';
  }
  if (path.includes('speech') || path.includes('tts')) {
    return 'speech.tts';
  }
  if (path.includes('plan')) {
    return 'learning.plan';
  }
  return 'learning.content';
}

function requestCloudFunction(service, path, payload) {
  if (typeof wx === 'undefined' || !wx.cloud || !wx.cloud.callFunction) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    const finish = createTimedResolver(resolve, SERVICE_REQUEST_TIMEOUT);
    wx.cloud.callFunction({
      name: service.cloudFunctionName,
      data: {
        action: getActionFromPath(path),
        provider: service.provider,
        ...payload
      },
      success: res => finish(res.result || null),
      fail: () => finish(null)
    });
  });
}

function createHealthResult(available, mode, startedAt, reason = '') {
  return {
    available,
    mode,
    reason,
    checkedAt: Date.now(),
    elapsedMs: Date.now() - startedAt
  };
}

function checkLearningService(config = {}) {
  const service = normalizeAIService(config);
  const startedAt = Date.now();

  if (!service.enabled) {
    return Promise.resolve(createHealthResult(false, service.mode, startedAt, 'disabled'));
  }

  if (service.mode === 'cloud') {
    if (typeof wx === 'undefined' || !wx.cloud || !wx.cloud.callFunction) {
      return Promise.resolve(createHealthResult(false, service.mode, startedAt, 'unavailable'));
    }

    return new Promise(resolve => {
      const finish = createTimedResolver(value => {
        resolve(value || createHealthResult(false, service.mode, startedAt, 'timeout'));
      }, SERVICE_HEALTH_TIMEOUT);
      wx.cloud.callFunction({
        name: service.cloudFunctionName,
        data: { action: 'health' },
        success: res => {
          const result = res.result || {};
          finish(createHealthResult(result.ok !== false, service.mode, startedAt, result.ok === false ? 'service_error' : ''));
        },
        fail: () => finish(createHealthResult(false, service.mode, startedAt, 'request_failed'))
      });
    });
  }

  if (typeof wx === 'undefined' || !wx.request) {
    return Promise.resolve(createHealthResult(false, service.mode, startedAt, 'unavailable'));
  }

  return new Promise(resolve => {
    const finish = createTimedResolver(value => {
      resolve(value || createHealthResult(false, service.mode, startedAt, 'timeout'));
    }, SERVICE_HEALTH_TIMEOUT);
    wx.request({
      url: `${service.baseUrl}/health`,
      method: 'GET',
      timeout: SERVICE_HEALTH_TIMEOUT,
      success: res => {
        const statusCode = Number(res.statusCode || 0);
        const available = statusCode >= 200 && statusCode < 300 && res.data?.ok !== false;
        finish(createHealthResult(available, service.mode, startedAt, available ? '' : 'service_error'));
      },
      fail: () => finish(createHealthResult(false, service.mode, startedAt, 'request_failed'))
    });
  });
}

function normalizeWordSuggestion(item = {}, fallbackCategory = '日常') {
  return {
    term: String(item.term || item.word || '').trim(),
    phonetic: String(item.phonetic || item.ukphone || item.usphone || '').trim(),
    translation: String(item.translation || item.explain || item.meaning || '').trim(),
    example: String(item.example || item.sentence || '').trim(),
    category: String(item.category || fallbackCategory || '日常').trim(),
    audioSrc: String(item.audioSrc || item.audioUrl || item.speechUrl || '').trim(),
    source: item.source || 'ai'
  };
}

function getFallbackWordSuggestions(goal = 'daily') {
  return (FALLBACK_WORDS[goal] || FALLBACK_WORDS.daily).map(item => normalizeWordSuggestion(item));
}

async function getWordSuggestions(config, goal, count = 3) {
  const service = normalizeAIService(config);
  const data = await requestLearningService(config, service.dictionaryPath, {
    goal,
    count
  });
  const list = Array.isArray(data?.words) ? data.words : (Array.isArray(data) ? data : []);
  const normalized = list.map(item => normalizeWordSuggestion(item)).filter(item => item.term && item.translation);
  return normalized.length ? normalized.slice(0, count) : getFallbackWordSuggestions(goal).slice(0, count);
}

async function lookupWord(config, term, category = '日常') {
  const service = normalizeAIService(config);
  const data = await requestLearningService(config, service.dictionaryPath, {
    term,
    category
  });
  const result = data?.word || data?.result || data;
  const normalized = normalizeWordSuggestion(result || {}, category);
  if (normalized.term && normalized.translation) {
    return normalized;
  }

  const fallback = Object.keys(FALLBACK_WORDS)
    .reduce((list, key) => list.concat(FALLBACK_WORDS[key]), [])
    .find(item => item.term.toLowerCase() === String(term || '').trim().toLowerCase());
  return fallback ? normalizeWordSuggestion(fallback, category) : null;
}

function normalizeDailyContent(data = {}, goal = 'daily') {
  const fallback = FALLBACK_CONTENT[goal] || FALLBACK_CONTENT.daily;
  const hasGeneratedContent = Boolean(data.sentence || data.dailySentence || data.shortReading || data.reading || data.sceneExpression || data.expression || data.longSentence);
  return {
    sentence: String(data.sentence || data.dailySentence || fallback.sentence).trim(),
    shortReading: String(data.shortReading || data.reading || fallback.shortReading).trim(),
    sceneExpression: String(data.sceneExpression || data.expression || fallback.sceneExpression).trim(),
    longSentence: String(data.longSentence || fallback.longSentence).trim(),
    source: data.source || (hasGeneratedContent ? 'ai' : 'fallback')
  };
}

async function getDailyContent(config, goal = 'daily', date = '') {
  const service = normalizeAIService(config);
  const data = await requestLearningService(config, service.contentPath, {
    goal,
    date
  });
  return normalizeDailyContent(data?.content || data || {}, goal);
}

async function requestTtsAudio(config, text) {
  const service = normalizeAIService(config);
  const data = await requestLearningService(config, service.ttsPath, {
    text
  });
  return String(data?.audioUrl || data?.audioSrc || data?.url || '').trim();
}

module.exports = {
  buildServiceUrl,
  checkLearningService,
  getActionFromPath,
  getDailyContent,
  getFallbackWordSuggestions,
  getWordSuggestions,
  lookupWord,
  normalizeAIService,
  normalizeDailyContent,
  normalizeWordSuggestion,
  requestTtsAudio,
  SERVICE_HEALTH_TIMEOUT,
  SERVICE_REQUEST_TIMEOUT
};
