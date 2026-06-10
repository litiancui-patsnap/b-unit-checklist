const { getDateAfter } = require('./date.js');

const WORD_STATUS_OPTIONS = [
  { value: 'new', label: '新词' },
  { value: 'review', label: '需复习' },
  { value: 'mastered', label: '已掌握' }
];

const WORD_CATEGORY_OPTIONS = [
  { value: 'daily', label: '日常' },
  { value: 'spoken', label: '口语' },
  { value: 'travel', label: '旅行' },
  { value: 'business', label: '职场' },
  { value: 'cet', label: '四六级' },
  { value: 'exam', label: '考研' }
];

const REVIEW_INTERVALS = [0, 1, 3, 7];

const SPEAKING_SCENES = [
  scene('intro', '自我介绍', [
    speechLine('Hi, I am ... Nice to meet you.', 'Hi, I am Alex. Nice to meet you.'),
    speechLine('I come from ... and I work in ...', 'I come from Beijing and I work in marketing.'),
    speechLine('In my free time, I like ...', 'In my free time, I like reading.')
  ]),
  scene('restaurant', '点餐', [
    speechLine('Could I see the menu, please?', 'Could I see the menu, please?'),
    speechLine('I would like to order ...', 'I would like to order a coffee.'),
    speechLine('Could you make it less spicy?', 'Could you make it less spicy?')
  ]),
  scene('directions', '问路', [
    speechLine('Excuse me, how can I get to ...?', 'Excuse me, how can I get to the station?'),
    speechLine('Is it within walking distance?', 'Is it within walking distance?'),
    speechLine('Thank you for your help.', 'Thank you for your help.')
  ]),
  scene('work', '工作沟通', [
    speechLine('Could you clarify this requirement?', 'Could you clarify this requirement?'),
    speechLine('I will follow up by email.', 'I will follow up by email.'),
    speechLine('Let us sync on the timeline.', 'Let us sync on the timeline.')
  ]),
  scene('travel', '旅行', [
    speechLine('I have a reservation under the name ...', 'I have a reservation under the name Smith.'),
    speechLine('Could you recommend a local restaurant?', 'Could you recommend a local restaurant?'),
    speechLine('What time does the last train leave?', 'What time does the last train leave?')
  ]),
  scene('interview', '面试', [
    speechLine('I am interested in this role because ...', 'I am interested in this role because it matches my skills.'),
    speechLine('My strength is ...', 'My strength is communication.'),
    speechLine('Could you tell me more about the team?', 'Could you tell me more about the team?')
  ])
];

function speechLine(text, audioText = text, audioSrc = '') {
  return {
    text,
    audioText,
    audioSrc
  };
}

function scene(id, title, lines) {
  return {
    id,
    title,
    lines: lines.map((line, index) => {
      const lineData = typeof line === 'string' ? speechLine(line) : line;
      return {
        id: `${id}_${index + 1}`,
        text: lineData.text,
        audioText: lineData.audioText || lineData.text,
        audioSrc: lineData.audioSrc || ''
      };
    })
  };
}

function normalizeWordCategory(category = '') {
  const labelMatched = WORD_CATEGORY_OPTIONS.find(item => item.label === category);
  if (labelMatched) {
    return labelMatched.value;
  }
  const valueMatched = WORD_CATEGORY_OPTIONS.find(item => item.value === category);
  return valueMatched ? valueMatched.value : WORD_CATEGORY_OPTIONS[0].value;
}

function getWordCategoryLabel(category) {
  const normalized = normalizeWordCategory(category);
  const option = WORD_CATEGORY_OPTIONS.find(item => item.value === normalized);
  return option ? option.label : WORD_CATEGORY_OPTIONS[0].label;
}

function createWord({ term, phonetic, translation, example, category, audioSrc, source }, today, id) {
  return {
    id,
    term: (term || '').trim(),
    phonetic: (phonetic || '').trim(),
    translation: (translation || '').trim(),
    example: (example || '').trim(),
    category: normalizeWordCategory(category),
    audioSrc: (audioSrc || '').trim(),
    source: source || 'manual',
    status: 'new',
    createdDate: today,
    nextReviewDate: today,
    reviewCount: 0,
    lastReviewedDate: ''
  };
}

function getWordStatusLabel(status) {
  const option = WORD_STATUS_OPTIONS.find(item => item.value === status);
  return option ? option.label : WORD_STATUS_OPTIONS[0].label;
}

function normalizeWord(word = {}, today = '') {
  const status = word.status === 'mastered' || word.status === 'review' ? word.status : 'new';
  return {
    id: word.id,
    term: word.term || '',
    phonetic: word.phonetic || '',
    translation: word.translation || '',
    example: word.example || '',
    category: normalizeWordCategory(word.category),
    categoryLabel: getWordCategoryLabel(word.category),
    audioSrc: word.audioSrc || '',
    source: word.source || 'manual',
    status,
    createdDate: word.createdDate || today,
    nextReviewDate: status === 'mastered' ? '' : (word.nextReviewDate || word.createdDate || today),
    reviewCount: Number(word.reviewCount || 0),
    lastReviewedDate: word.lastReviewedDate || '',
    statusLabel: getWordStatusLabel(status)
  };
}

function reviewWord(word = {}, today, forceMastered = false) {
  const reviewCount = Number(word.reviewCount || 0) + 1;
  const mastered = forceMastered || reviewCount >= REVIEW_INTERVALS.length - 1;
  const interval = REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)];

  return normalizeWord({
    ...word,
    status: mastered ? 'mastered' : 'review',
    reviewCount,
    lastReviewedDate: today,
    nextReviewDate: mastered ? '' : getDateAfter(today, interval)
  }, today);
}

function collectWordsFromDays(allDays = {}, today = '') {
  const words = [];
  Object.keys(allDays).forEach(date => {
    (allDays[date]?.words || []).forEach(word => {
      const normalized = normalizeWord(word, date || today);
      if (normalized.id && normalized.term) {
        words.push({
          ...normalized,
          sourceDate: date
        });
      }
    });
  });
  return words;
}

function getDueReviewWords(allDays = {}, today = '') {
  return collectWordsFromDays(allDays, today).filter(word => {
    if (word.status === 'mastered') {
      return false;
    }
    return !word.nextReviewDate || word.nextReviewDate <= today;
  });
}

function getSceneStats(scenePractice = {}) {
  let completedLines = 0;
  let totalLines = 0;

  SPEAKING_SCENES.forEach(sceneItem => {
    totalLines += sceneItem.lines.length;
    sceneItem.lines.forEach(line => {
      if (scenePractice?.[sceneItem.id]?.[line.id]) {
        completedLines++;
      }
    });
  });

  return { completedLines, totalLines };
}

function buildQuizQuestions(words = [], limit = 5) {
  const seenIds = new Set();
  const candidates = words
    .filter(word => word.term && word.translation)
    .filter(word => {
      const key = word.id || `${word.term}_${word.translation}`;
      if (seenIds.has(key)) {
        return false;
      }
      seenIds.add(key);
      return true;
    })
    .slice(0, 20);

  if (candidates.length < 2) {
    return [];
  }

  return candidates.slice(0, limit).map((word, index) => {
    const distractors = candidates
      .filter(item => item.id !== word.id)
      .slice(0, 3)
      .map(item => item.term);
    const options = [word.term, ...distractors].slice(0, 4);

    return {
      id: `quiz_${word.id || index}`,
      prompt: word.translation,
      answer: word.term,
      options: rotate(options, index)
    };
  });
}

function rotate(items, offset) {
  if (!items.length) {
    return items;
  }
  const index = offset % items.length;
  return [...items.slice(index), ...items.slice(0, index)];
}

function getQuizResult(questions = [], answers = {}) {
  const answeredCount = questions.filter(question => answers[question.id]).length;
  const score = questions.filter(question => answers[question.id] === question.answer).length;
  return {
    answeredCount,
    score,
    total: questions.length,
    completed: questions.length > 0 && answeredCount === questions.length
  };
}

module.exports = {
  SPEAKING_SCENES,
  WORD_CATEGORY_OPTIONS,
  WORD_STATUS_OPTIONS,
  buildQuizQuestions,
  collectWordsFromDays,
  createWord,
  getDueReviewWords,
  getQuizResult,
  getSceneStats,
  getWordCategoryLabel,
  getWordStatusLabel,
  normalizeWordCategory,
  normalizeWord,
  reviewWord
};
