const assert = require('assert');
const {
  buildServiceUrl,
  getFallbackWordSuggestions,
  normalizeAIService,
  normalizeDailyContent,
  normalizeWordSuggestion
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

console.log('ai learning tests passed');
