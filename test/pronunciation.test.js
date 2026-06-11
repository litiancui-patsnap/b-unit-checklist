const assert = require('assert');
const {
  getPronunciationAudioSource,
  normalizeAudioSrc,
  normalizePronunciationText
} = require('../utils/pronunciation.js');

assert.strictEqual(
  normalizePronunciationText('I would like to order ...'),
  'I would like to order',
  'placeholder ellipses should be removed before requesting audio'
);

assert.strictEqual(
  normalizeAudioSrc('  https://cdn.example.com/speech/intro_1.m4a  '),
  'https://cdn.example.com/speech/intro_1.m4a',
  'audio src should be trimmed before playback'
);

assert.strictEqual(
  getPronunciationAudioSource('https://cdn.example.com/speech/intro_1.m4a'),
  'https://cdn.example.com/speech/intro_1.m4a',
  'pronunciation playback should use provided controlled audio source'
);

assert.strictEqual(
  getPronunciationAudioSource(''),
  '',
  'missing audio source should not create a third-party TTS URL'
);

console.log('pronunciation tests passed');
