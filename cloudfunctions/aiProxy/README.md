# aiProxy 云函数

这个云函数是小程序的 AI / 词典 / 发音代理层。API Key 只放在云函数环境变量里，不进入小程序前端包。

## 环境变量

建议在云函数配置里把超时时间设置为 20 秒。AI 内容生成和 TTS 都会访问外部服务，3 秒默认超时不够稳定。

必填：

- `DASHSCOPE_API_KEY`：阿里云百炼 API Key

可选：

- `DASHSCOPE_MODEL`：文本生成模型，默认 `qwen-plus`
- `DASHSCOPE_CHAT_BASE_URL`：默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `DASHSCOPE_TTS_MODEL`：默认 `qwen3-tts-flash`
- `DASHSCOPE_TTS_VOICE`：默认 `Cherry`
- `DASHSCOPE_TTS_LANGUAGE`：默认 `English`
- `YOUDAO_APP_KEY`：有道智云词典应用 ID
- `YOUDAO_APP_SECRET`：有道智云词典应用密钥

## 支持动作

- `dictionary.lookup`：查词或生成推荐词
- `learning.content`：生成每日一句、短文、场景表达、长难句
- `learning.plan`：生成学习计划
- `speech.tts`：生成临时音频 URL
