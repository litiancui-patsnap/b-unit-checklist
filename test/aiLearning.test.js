const assert = require('assert');
const {
  buildServiceUrl,
  checkLearningService,
  getFallbackWordSuggestions,
  getDailyContent,
  normalizeAIService,
  normalizeDailyContent,
  normalizeWordSuggestion,
  SERVICE_HEALTH_TIMEOUT,
  SERVICE_REQUEST_TIMEOUT
} = require('../utils/aiLearning.js');

const config = {
  aiService: {
    enabled: true,
    baseUrl: 'https://example.com/api/',
    provider: 'qwen',
    dictionaryPath: '/dictionary/lookup'
  }
};

assert.strictEqual(normalizeAIService({ aiService: { enabled: true } }).enabled, true);
assert.strictEqual(normalizeAIService({ aiService: { enabled: true, mode: 'http' } }).enabled, false);
assert.strictEqual(buildServiceUrl(config.aiService, '/speech/tts'), 'https://example.com/api/speech/tts');

assert.deepStrictEqual(
  normalizeWordSuggestion({
    word: 'focus',
    ukphone: '/focus/',
    explain: '专注',
    sentence: 'I need to focus.'
  }, '日常'),
  {
    term: 'focus',
    phonetic: '/focus/',
    translation: '专注',
    example: 'I need to focus.',
    category: '日常',
    audioSrc: '',
    source: 'ai'
  }
);

assert.strictEqual(getFallbackWordSuggestions('business')[0].category, '职场');
assert.strictEqual(normalizeDailyContent({}, 'exam').source, 'fallback');
assert.ok(normalizeDailyContent({}, 'exam').longSentence.includes('/'));

(async () => {
  let capturedRequest = null;
  const httpConfig = {
    aiService: {
      ...config.aiService,
      mode: 'http'
    }
  };

  global.wx = {
    request(options) {
      capturedRequest = options;
      options.success({ statusCode: 200, data: { ok: true } });
    }
  };

  const httpHealth = await checkLearningService(httpConfig);
  assert.strictEqual(httpHealth.available, true);
  assert.strictEqual(capturedRequest.url, 'https://example.com/api/health');
  assert.strictEqual(capturedRequest.method, 'GET');
  assert.strictEqual(capturedRequest.timeout, SERVICE_HEALTH_TIMEOUT);

  global.wx = {
    request(options) {
      capturedRequest = options;
      options.fail({ errMsg: 'request:fail timeout' });
    }
  };

  const fallbackContent = await getDailyContent(httpConfig, 'daily', '2026-07-21');
  assert.strictEqual(fallbackContent.source, 'fallback');
  assert.strictEqual(capturedRequest.method, 'POST');
  assert.strictEqual(capturedRequest.timeout, SERVICE_REQUEST_TIMEOUT);

  let cloudRequest = null;
  global.wx = {
    cloud: {
      callFunction(options) {
        cloudRequest = options;
        options.success({ result: { ok: true } });
      }
    }
  };

  const cloudHealth = await checkLearningService({
    aiService: {
      enabled: true,
      mode: 'cloud',
      cloudFunctionName: 'aiProxy'
    }
  });
  assert.strictEqual(cloudHealth.available, true);
  assert.strictEqual(cloudRequest.data.action, 'health');

  delete global.wx;
  console.log('ai learning tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
