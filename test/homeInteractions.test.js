const assert = require('assert');

let capturedPage = null;
let lastPatch = null;

global.Page = (page) => {
  capturedPage = page;
};

global.wx = {
  showToast() {}
};

require('../pages/home/home.js');

function createPage(data) {
  return {
    ...capturedPage,
    data,
    setData(patch) {
      lastPatch = patch;
      Object.entries(patch).forEach(([key, value]) => {
        if (!key.includes('.')) {
          this.data[key] = value;
        }
      });
    },
    saveTodayData() {},
    refreshLearningState() {}
  };
}

const diaryPage = createPage({
  todayData: {
    diary: '',
    complete: false
  }
});

diaryPage.useDiaryTemplate({
  detail: {
    template: 'Today I learned something useful.'
  }
});
assert.strictEqual(diaryPage.data.todayData.diary, 'Today I learned something useful.');

const contentPage = createPage({
  todayData: {
    items: {},
    contentChecks: {}
  },
  currentTemplate: {
    items: [
      { id: 'listen_task', type: 'listen' },
      { id: 'read_task', type: 'read' }
    ]
  }
});

contentPage.toggleContentCheck({
  detail: {
    key: 'sentence',
    type: 'listen'
  }
});
assert.strictEqual(contentPage.data.todayData.contentChecks.sentence, true);
assert.strictEqual(contentPage.data.todayData.items.listen_task, true);
assert.strictEqual(lastPatch.progress, 50);
assert.strictEqual(lastPatch.planCompletedCount, 1);
assert.strictEqual(lastPatch.planTotalCount, 2);

const scenePage = createPage({
  todayData: {
    scenePractice: {}
  }
});
scenePage.toggleSceneLine({
  detail: {
    scene: 'intro',
    line: 'intro_1'
  }
});
assert.strictEqual(scenePage.data.todayData.scenePractice.intro.intro_1, true);

const reviewPage = createPage({
  today: '2026-07-15',
  todayData: {
    words: [
      {
        id: 'word_1',
        term: 'focus',
        translation: '专注',
        status: 'review',
        nextReviewDate: '2026-07-15'
      }
    ]
  }
});
reviewPage.markReviewWord({
  detail: {
    date: '2026-07-15',
    id: 'word_1',
    mastered: true
  }
});
assert.strictEqual(reviewPage.data.todayData.words[0].status, 'mastered');
assert.strictEqual(reviewPage.data.todayData.words[0].nextReviewDate, '');

const quizPage = createPage({
  todayData: {
    items: {},
    quiz: {
      answers: {}
    }
  },
  currentTemplate: {
    items: [
      { id: 'word_task', type: 'word' },
      { id: 'listen_task', type: 'listen' }
    ]
  },
  quizQuestions: [
    {
      id: 'quiz_focus',
      prompt: '专注',
      answer: 'focus',
      options: ['focus', 'review']
    }
  ],
  currentQuizIndex: 0,
  quizAnswered: false,
  quizScore: 0
});

quizPage.selectQuizOption({ detail: { index: 0 } });
assert.strictEqual(quizPage.data.todayData.quiz.answers.quiz_focus, 'focus');
assert.strictEqual(quizPage.data.todayData.quiz.completed, true);
assert.strictEqual(quizPage.data.todayData.items.word_task, true);
assert.strictEqual(quizPage.data.quizResult.score, 1);
assert.strictEqual(quizPage.data.quizAnswered, true);
assert.strictEqual(quizPage.data.planCompletedCount, 1);

console.log('home interaction tests passed');
