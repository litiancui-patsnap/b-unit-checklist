const assert = require('assert');
const { countCheckedByItems, normalizeCheckedMap } = require('../utils/checklist.js');

const items = [
  { id: 'word', text: '背单词' },
  { id: 'listen', text: '听音频' }
];

assert.strictEqual(
  countCheckedByItems({ word: true, deleted: true, listen: false }, items),
  1,
  'only current configured items should be counted'
);

assert.deepStrictEqual(
  normalizeCheckedMap({ word: true, deleted: true, listen: 0 }, items),
  { word: true, listen: false },
  'stale checklist ids should be removed'
);

assert.strictEqual(
  countCheckedByItems(null, items),
  0,
  'missing checked maps should be treated as empty'
);

console.log('checklist tests passed');
