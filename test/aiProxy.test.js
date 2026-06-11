const assert = require('assert');
const {
  normalizeAudioUrl,
  parseJsonContent,
  parseYoudaoWord,
  truncateForSign
} = require('../cloudfunctions/aiProxy/lib.js');

assert.strictEqual(truncateForSign('Welcome to youdao AICloud.'), 'Welcome to26o AICloud.');
assert.deepStrictEqual(parseJsonContent('```json\n{"a":1}\n```'), { a: 1 });
assert.strictEqual(
  normalizeAudioUrl('http://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/a.wav'),
  'https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/a.wav'
);

const word = parseYoudaoWord({
  errorCode: '0',
  result: [{
    ec: {
      basic: {
        usPhonetic: 'foʊkəs',
        usSpeech: 'https://example.com/focus.mp3',
        explains: ['n. 焦点', 'v. 集中']
      },
      sentenceSample: [{
        sentence: 'I need to focus.'
      }]
    }
  }]
}, 'focus', '日常');

assert.strictEqual(word.term, 'focus');
assert.strictEqual(word.translation, 'n. 焦点; v. 集中');
assert.strictEqual(word.example, 'I need to focus.');
assert.strictEqual(word.source, 'youdao');

console.log('ai proxy tests passed');
