const assert = require('assert');
const {
  CONFIG_VERSION,
  getDefaultConfig,
  getDiaryTemplates,
  getGoalLabel,
  getTemplatesForGoal
} = require('../utils/defaultConfig.js');

const spokenConfig = getDefaultConfig('spoken', 'C');
assert.strictEqual(spokenConfig.studyPersona, 'dual_worker');
assert.strictEqual(spokenConfig.version, CONFIG_VERSION);
assert.strictEqual(spokenConfig.learningGoal, 'spoken');
assert.strictEqual(spokenConfig.dailyIntensity, 'C');
assert.strictEqual(spokenConfig.hasOnboarded, false);
assert.ok(spokenConfig.templates.C.items.some(item => item.module === '复述'));

const cetTemplates = getTemplatesForGoal('cet');
assert.ok(cetTemplates.B.items.some(item => item.text.includes('四六级')));
assert.notDeepStrictEqual(
  cetTemplates.B.items.map(item => item.text),
  getTemplatesForGoal('business').B.items.map(item => item.text),
  'different learning goals should generate different default tasks'
);

assert.ok(getDiaryTemplates('business').some(template => template.includes('email')));
assert.strictEqual(getGoalLabel('unknown'), '日常英语');

console.log('default config tests passed');
