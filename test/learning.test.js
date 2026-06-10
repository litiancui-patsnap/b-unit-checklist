const assert = require('assert');
const {
  TASK_TYPES,
  getTemplatesForGoal,
  normalizeTaskItem,
  normalizeTaskType
} = require('../utils/defaultConfig.js');
const {
  SPEAKING_SCENES,
  buildQuizQuestions,
  createWord,
  getDueReviewWords,
  getQuizResult,
  getSceneStats,
  reviewWord
} = require('../utils/learning.js');

assert.deepStrictEqual(
  TASK_TYPES.map(item => item.value),
  ['word', 'listen', 'speak', 'read', 'write'],
  'task types should stay within the planned five categories'
);

assert.strictEqual(normalizeTaskType('translate'), 'write');
assert.strictEqual(normalizeTaskType('review'), 'write');
assert.strictEqual(normalizeTaskItem({ text: 'x' }).type, 'word');

const templates = getTemplatesForGoal('exam');
templates.C.items.forEach(item => {
  assert.ok(
    TASK_TYPES.some(type => type.value === item.type),
    `default task type should be valid: ${item.type}`
  );
});

const today = '2026-06-08';
const word = createWord({
  term: 'focus',
  translation: '专注',
  example: 'I need to focus.'
}, today, 'word_1');

assert.strictEqual(word.status, 'new');
assert.strictEqual(word.nextReviewDate, today);

const reviewed = reviewWord(word, today, false);
assert.strictEqual(reviewed.status, 'review');
assert.strictEqual(reviewed.lastReviewedDate, today);
assert.strictEqual(reviewed.nextReviewDate, '2026-06-09');

const mastered = reviewWord(reviewed, '2026-06-09', true);
assert.strictEqual(mastered.status, 'mastered');
assert.strictEqual(mastered.nextReviewDate, '');

const dueWords = getDueReviewWords({
  '2026-06-08': {
    words: [word, mastered]
  }
}, today);
assert.strictEqual(dueWords.length, 1);
assert.strictEqual(dueWords[0].term, 'focus');

const quizQuestions = buildQuizQuestions([
  word,
  word,
  createWord({ term: 'review', translation: '复习' }, today, 'word_2'),
  createWord({ term: 'speak', translation: '说' }, today, 'word_3')
], 2);

assert.strictEqual(quizQuestions.length, 2);
const answers = {
  [quizQuestions[0].id]: quizQuestions[0].answer,
  [quizQuestions[1].id]: 'wrong'
};
assert.deepStrictEqual(getQuizResult(quizQuestions, answers), {
  answeredCount: 2,
  score: 1,
  total: 2,
  completed: true
});

assert.deepStrictEqual(getSceneStats({
  intro: {
    intro_1: true,
    intro_2: false
  },
  work: {
    work_1: true
  }
}).completedLines, 2);

SPEAKING_SCENES.forEach(scene => {
  scene.lines.forEach(line => {
    assert.ok(line.audioText, `scene line should include audio text: ${line.id}`);
    assert.ok(!line.audioText.includes('...'), `audio text should not include placeholder ellipses: ${line.id}`);
  });
});

console.log('learning tests passed');
