# AI Proxy API Service

这是英语学习小程序的后端 API 服务，替代微信云函数。

## 功能

- 词典查询（支持有道词典 + AI 生成）
- 每日学习内容生成
- 学习计划生成
- 英文 TTS 语音合成

## 本地开发

### 1. 安装依赖

```bash
cd api
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的阿里云百炼 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 3. 启动服务

```bash
npm run dev
```

服务默认运行在 `http://localhost:3000`

### 4. 测试接口

```bash
# 健康检查
curl http://localhost:3000/health

# 查词
curl -X POST http://localhost:3000/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus", "category": "日常"}'

# 生成每日内容
curl -X POST http://localhost:3000/learning/content \
  -H "Content-Type: application/json" \
  -d '{"goal": "daily"}'
```

## 部署到 Vercel

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署

在项目根目录（不是 api 目录）执行：

```bash
vercel
```

第一次部署会询问：
- Project name: 回车使用默认
- Directory: 回车使用当前目录
- Override settings: 选 No

### 4. 配置环境变量

在 Vercel 控制台 → 项目 → Settings → Environment Variables 添加：

```
DASHSCOPE_API_KEY = sk-xxxxxxxxxxxxxxxx
```

### 5. 重新部署

```bash
vercel --prod
```

部署成功后，Vercel 会给你一个域名，比如：
```
https://your-project.vercel.app
```

## 更新小程序配置

部署成功后，在小程序的 `pages/settings/settings.js` 中配置：

```javascript
// 在 data 中添加
aiService: {
  enabled: true,
  mode: 'http',  // 改为 http
  baseUrl: 'https://your-project.vercel.app',  // 替换为你的 Vercel 域名
  provider: 'qwen',
  dictionaryPath: '/dictionary/lookup',
  ttsPath: '/speech/tts',
  contentPath: '/learning/content',
  planPath: '/learning/plan'
}
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/dictionary/lookup` | POST | 查词或生成词汇推荐 |
| `/learning/content` | POST | 生成每日学习内容 |
| `/learning/plan` | POST | 生成学习计划 |
| `/speech/tts` | POST | 文本转语音 |

## 环境变量说明

### 必填

- `DASHSCOPE_API_KEY`: 阿里云百炼 API Key，在 [百炼控制台](https://dashscope.console.aliyun.com/) 获取

### 可选

- `DASHSCOPE_MODEL`: 文本生成模型，默认 `qwen-plus`
- `DASHSCOPE_CHAT_BASE_URL`: API 基础 URL
- `DASHSCOPE_TTS_MODEL`: TTS 模型，默认 `qwen3-tts-flash`
- `DASHSCOPE_TTS_VOICE`: 语音名称，默认 `Cherry`
- `DASHSCOPE_TTS_LANGUAGE`: 语言，默认 `English`
- `YOUDAO_APP_KEY`: 有道词典应用 ID（可选）
- `YOUDAO_APP_SECRET`: 有道词典密钥（可选）

## 故障排查

### 小程序请求失败

1. 检查小程序配置的 `baseUrl` 是否正确
2. 在微信开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名"
3. 正式发布前需要在微信公众平台配置服务器域名白名单

### Vercel 部署失败

1. 确保 `vercel.json` 在项目根目录
2. 确保 `api/index.js` 和 `api/lib.js` 存在
3. 检查 Node.js 版本 >= 18

### API 返回错误

1. 检查 Vercel 环境变量是否配置正确
2. 查看 Vercel 函数日志：Dashboard → Functions → Logs
3. 确认 API Key 有效且有余额
