const express = require('express');
const cors = require('cors');
const { handleEvent } = require('./lib.js');

const app = express();

// 允许小程序域名跨域请求
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'ai-proxy', timestamp: Date.now() });
});

// 词典查询
app.post('/dictionary/lookup', async (req, res) => {
  try {
    const result = await handleEvent({
      action: 'dictionary.lookup',
      ...req.body
    }, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

// 学习内容生成
app.post('/learning/content', async (req, res) => {
  try {
    const result = await handleEvent({
      action: 'learning.content',
      ...req.body
    }, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

// 学习计划生成
app.post('/learning/plan', async (req, res) => {
  try {
    const result = await handleEvent({
      action: 'learning.plan',
      ...req.body
    }, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

// TTS 语音合成
app.post('/speech/tts', async (req, res) => {
  try {
    const result = await handleEvent({
      action: 'speech.tts',
      ...req.body
    }, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

// 兼容旧的云函数调用方式（可选）
app.post('/api/aiProxy', async (req, res) => {
  try {
    const result = await handleEvent(req.body, process.env);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'INTERNAL_ERROR'
    });
  }
});

// Vercel serverless 函数导出
module.exports = app;

// 本地开发模式
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`AI Proxy server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}
