const crypto = require('crypto');
const https = require('https');

const GOAL_LABELS = {
  daily: '日常英语',
  spoken: '口语表达',
  cet: '四六级备考',
  exam: '考研英语',
  business: '职场英语'
};

async function handleEvent(event = {}, env = process.env) {
  const action = event.action || 'learning.content';

  try {
    if (action === 'dictionary.lookup') {
      return handleDictionary(event, env);
    }
    if (action === 'speech.tts') {
      return handleTts(event, env);
    }
    if (action === 'learning.plan') {
      return handlePlan(event, env);
    }
    return handleContent(event, env);
  } catch (error) {
    return {
      ok: false,
      error: sanitizeError(error),
      source: 'proxy'
    };
  }
}

async function handleDictionary(event, env) {
  const term = cleanText(event.term || event.word || '');
  const goal = event.goal || 'daily';
  const count = clamp(Number(event.count || 3), 1, 10);

  if (term && env.YOUDAO_APP_KEY && env.YOUDAO_APP_SECRET) {
    const youdaoWord = await lookupYoudao(term, event.category || '日常', env);
    if (youdaoWord) {
      return {
        ok: true,
        word: youdaoWord,
        source: 'youdao'
      };
    }
  }

  if (term) {
    const generated = await generateWordByQwen(term, event.category || '日常', env);
    return {
      ok: true,
      word: generated,
      source: generated.source || 'qwen'
    };
  }

  const words = await generateWordsByQwen(goal, count, env);
  return {
    ok: true,
    words,
    source: 'qwen'
  };
}

async function handleContent(event, env) {
  const goal = event.goal || 'daily';
  const content = await callQwenJson({
    env,
    system: '你是一个严谨的英语学习教练，只输出合法 JSON。',
    user: [
      `为一个微信英语打卡小程序生成今日学习内容，学习目标：${GOAL_LABELS[goal] || GOAL_LABELS.daily}。`,
      '要求难度适中，内容积极、简洁、适合中国英语学习者。',
      '返回 JSON 字段：sentence, shortReading, sceneExpression, longSentence。',
      'sentence 是一句英文；shortReading 是 35-55 个英文词的短文；sceneExpression 是一句实用场景表达；longSentence 是一句可用 / 分隔意群的长难句。'
    ].join('\n')
  });

  return {
    ok: true,
    content: {
      sentence: cleanText(content.sentence),
      shortReading: cleanText(content.shortReading),
      sceneExpression: cleanText(content.sceneExpression),
      longSentence: cleanText(content.longSentence),
      source: 'qwen'
    },
    source: 'qwen'
  };
}

async function handlePlan(event, env) {
  const goal = event.goal || 'daily';
  const intensity = event.intensity || 'B';
  const plan = await callQwenJson({
    env,
    system: '你是一个英语学习计划设计助手，只输出合法 JSON。',
    user: [
      `生成微信小程序今日学习计划，目标：${GOAL_LABELS[goal] || GOAL_LABELS.daily}，强度：${intensity}。`,
      '返回 JSON 字段：items。items 是数组，每项包含 type、module、text、minutes。',
      'type 只能是 word, listen, speak, read, write。minutes 为数字。'
    ].join('\n')
  });

  return {
    ok: true,
    plan: {
      items: Array.isArray(plan.items) ? plan.items.slice(0, 6) : []
    },
    source: 'qwen'
  };
}

async function handleTts(event, env) {
  const text = cleanText(event.text || '');
  if (!text) {
    return { ok: false, error: 'EMPTY_TEXT' };
  }
  if (!env.DASHSCOPE_API_KEY) {
    return { ok: false, error: 'MISSING_DASHSCOPE_API_KEY' };
  }

  const body = await postJson(env.DASHSCOPE_TTS_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    model: env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash',
    input: {
      text: text.slice(0, 500),
      voice: env.DASHSCOPE_TTS_VOICE || 'Cherry',
      language_type: env.DASHSCOPE_TTS_LANGUAGE || 'English'
    }
  }, {
    Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`
  });

  const audioUrl = normalizeAudioUrl(body?.output?.audio?.url || body?.output?.url || '');
  return {
    ok: Boolean(audioUrl),
    audioUrl,
    source: 'qwen-tts',
    expiresAt: body?.output?.audio?.expires_at || 0
  };
}

async function lookupYoudao(term, category, env) {
  const q = term.trim();
  const salt = randomId();
  const curtime = Math.floor(Date.now() / 1000).toString();
  const input = truncateForSign(q);
  const sign = sha256(`${env.YOUDAO_APP_KEY}${input}${salt}${curtime}${env.YOUDAO_APP_SECRET}`);
  const dicts = isChinese(q) ? 'ce' : 'ec';
  const params = {
    q,
    langType: 'auto',
    appKey: env.YOUDAO_APP_KEY,
    dicts,
    salt,
    sign,
    signType: 'v3',
    curtime,
    docType: 'json'
  };
  const data = await postForm(env.YOUDAO_DICT_URL || 'https://openapi.youdao.com/v2/dict', params);
  return parseYoudaoWord(data, q, category);
}

function parseYoudaoWord(data, term, category) {
  if (!data || data.errorCode !== '0') {
    return null;
  }
  const result = Array.isArray(data.result) ? data.result[0] : data.result;
  const dict = result?.ec || result?.ce || result || {};
  const basic = Array.isArray(dict.basic) ? dict.basic[0] : dict.basic || {};
  const explains = basic.explains || basic.explain || dict.explains || [];
  const sentence = Array.isArray(dict.sentenceSample) ? dict.sentenceSample[0] : dict.sentenceSample;
  const example = sentence?.sentence || sentence?.text || sentence || '';

  return normalizeWord({
    term,
    phonetic: basic.usPhonetic || basic.ukPhonetic || basic.phonetic || dict.phonetic || '',
    translation: Array.isArray(explains) ? explains.join('; ') : String(explains || ''),
    example,
    category,
    audioSrc: basic.usSpeech || basic.ukSpeech || dict.usSpeech || dict.ukSpeech || '',
    source: 'youdao'
  });
}

async function generateWordByQwen(term, category, env) {
  const data = await callQwenJson({
    env,
    system: '你是一个英语词典助手，只输出合法 JSON。',
    user: [
      `查询英文词或短语：${term}`,
      `分类：${category}`,
      '返回 JSON 字段：term, phonetic, translation, example, category。',
      'translation 用中文，包含词性和简短释义；example 用一个自然英文例句。'
    ].join('\n')
  });
  return normalizeWord({ ...data, term: data.term || term, category, source: 'qwen' });
}

async function generateWordsByQwen(goal, count, env) {
  const data = await callQwenJson({
    env,
    system: '你是一个英语词汇教练，只输出合法 JSON。',
    user: [
      `按学习目标生成 ${count} 个今日推荐英语词汇，目标：${GOAL_LABELS[goal] || GOAL_LABELS.daily}。`,
      '返回 JSON 字段：words。words 是数组，每项包含 term, phonetic, translation, example, category。',
      'translation 用中文，example 用自然英文例句。'
    ].join('\n')
  });
  return (Array.isArray(data.words) ? data.words : [])
    .slice(0, count)
    .map(item => normalizeWord({ ...item, source: 'qwen' }))
    .filter(item => item.term && item.translation);
}

async function callQwenJson({ env, system, user }) {
  if (!env.DASHSCOPE_API_KEY) {
    throw new Error('MISSING_DASHSCOPE_API_KEY');
  }

  const endpoint = `${env.DASHSCOPE_CHAT_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`;
  const data = await postJson(endpoint, {
    model: env.DASHSCOPE_MODEL || 'qwen-plus',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: Number(env.DASHSCOPE_TEMPERATURE || 0.7),
    response_format: { type: 'json_object' }
  }, {
    Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`
  });

  const content = data?.choices?.[0]?.message?.content || '{}';
  return parseJsonContent(content);
}

function postJson(url, payload, headers = {}) {
  return request({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(payload)
  });
}

function postForm(url, params) {
  const body = new URLSearchParams(params).toString();
  return request({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
}

function request({ url, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, res => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        raw += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP_${res.statusCode}`));
          return;
        }
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch (error) {
          reject(new Error('INVALID_JSON_RESPONSE'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('REQUEST_TIMEOUT'));
    });
    req.write(body);
    req.end();
  });
}

function normalizeWord(item = {}) {
  return {
    term: cleanText(item.term || item.word),
    phonetic: cleanText(item.phonetic || item.usPhonetic || item.ukPhonetic),
    translation: cleanText(item.translation || item.meaning || item.explain),
    example: cleanText(item.example || item.sentence),
    category: cleanText(item.category || '日常'),
    audioSrc: normalizeAudioUrl(item.audioSrc || item.audioUrl || item.usSpeech || item.ukSpeech),
    source: item.source || 'qwen'
  };
}

function parseJsonContent(content) {
  if (typeof content === 'object' && content) {
    return content;
  }
  const text = String(content || '').trim();
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  }
}

function truncateForSign(q) {
  const text = String(q || '');
  return text.length <= 20 ? text : `${text.slice(0, 10)}${text.length}${text.slice(-10)}`;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function randomId() {
  return crypto.randomBytes(16).toString('hex');
}

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeAudioUrl(url = '') {
  const text = cleanText(url);
  return text.startsWith('http://') ? `https://${text.slice(7)}` : text;
}

function isChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function sanitizeError(error) {
  return String(error?.message || error || 'UNKNOWN_ERROR').slice(0, 120);
}

module.exports = {
  handleEvent,
  normalizeAudioUrl,
  parseJsonContent,
  parseYoudaoWord,
  truncateForSign
};
