# 从微信云开发迁移到 Vercel 指南

本文档说明如何将小程序从微信云开发迁移到自建 API 服务。

## 背景

原小程序使用微信云开发的云函数 `aiProxy` 来调用 AI 服务。现在改为独立的 HTTP API 服务，部署在 Vercel 上。

## 优势

1. **无需开通云开发**：不依赖微信云环境
2. **免费额度更大**：Vercel 免费版足够个人和小团队使用
3. **部署更灵活**：可以部署到任何支持 Node.js 的平台
4. **调试更方便**：可以本地启动服务测试
5. **独立维护**：API 服务和小程序前端分离

## 迁移步骤

### 第一步：部署 API 服务到 Vercel

#### 1.1 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 1.2 登录 Vercel

```bash
vercel login
```

按提示选择登录方式（GitHub/GitLab/Email 都可以）。

#### 1.3 部署项目

在项目根目录执行：

```bash
cd /Users/ltc/Documents/project/b-unit-checklist-main
vercel
```

第一次部署会询问：

```
? Set up and deploy "~/Documents/project/b-unit-checklist-main"? [Y/n] Y
? Which scope do you want to deploy to? （选择你的账号）
? Link to existing project? [y/N] n
? What's your project's name? b-unit-checklist
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

#### 1.4 配置环境变量

部署完成后，进入 Vercel 控制台：

1. 打开 https://vercel.com/dashboard
2. 找到刚才部署的项目 `b-unit-checklist`
3. 点击 Settings → Environment Variables
4. 添加以下变量：

| Name | Value | Environment |
|------|-------|-------------|
| `DASHSCOPE_API_KEY` | `sk-你的阿里云API密钥` | Production, Preview, Development |

可选变量（不配置则使用默认值）：

| Name | Default Value |
|------|---------------|
| `DASHSCOPE_MODEL` | `qwen-plus` |
| `DASHSCOPE_TTS_VOICE` | `Cherry` |
| `YOUDAO_APP_KEY` | （留空则不用有道词典） |
| `YOUDAO_APP_SECRET` | （留空则不用有道词典） |

#### 1.5 重新部署以应用环境变量

```bash
vercel --prod
```

部署成功后会显示你的域名，类似：

```
✅ Production: https://b-unit-checklist.vercel.app
```

**记下这个域名，下一步要用。**

#### 1.6 测试 API 服务

```bash
# 测试健康检查
curl https://b-unit-checklist.vercel.app/health

# 测试查词功能
curl -X POST https://b-unit-checklist.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus"}'
```

如果返回 JSON 数据，说明部署成功。

---

### 第二步：更新小程序配置

#### 2.1 修改 app.js

打开 `app.js`，注释掉云开发初始化代码：

```javascript
App({
  onLaunch() {
    // 不再需要云开发初始化
    // if (wx.cloud) {
    //   wx.cloud.init({
    //     traceUser: true
    //   });
    // }
    
    const { initStorage } = require('./utils/storage.js');
    initStorage();
  },
  globalData: {}
});
```

#### 2.2 更新 utils/storage.js

找到初始化配置的部分，添加 AI 服务配置：

```javascript
// 找到 initStorage 函数中的默认配置部分
const defaultConfig = {
  // ... 其他配置
  
  // 添加 AI 服务配置
  aiService: {
    enabled: true,
    mode: 'http',  // 使用 HTTP 模式
    baseUrl: 'https://b-unit-checklist.vercel.app',  // 替换为你的 Vercel 域名
    provider: 'qwen',
    dictionaryPath: '/dictionary/lookup',
    ttsPath: '/speech/tts',
    contentPath: '/learning/content',
    planPath: '/learning/plan'
  }
};
```

#### 2.3 在设置页面添加配置项（可选）

如果想让用户自己配置 API 地址，可以在 `pages/settings/settings.wxml` 添加：

```xml
<view class="setting-section">
  <view class="setting-title">AI 服务设置</view>
  <view class="setting-item">
    <text class="setting-label">启用 AI 功能</text>
    <switch checked="{{config.aiService.enabled}}" bindchange="onAIServiceToggle"/>
  </view>
  <view class="setting-item" wx:if="{{config.aiService.enabled}}">
    <text class="setting-label">服务地址</text>
    <input class="setting-input" value="{{config.aiService.baseUrl}}" 
           bindblur="onAIServiceUrlChange" placeholder="https://your-api.vercel.app"/>
  </view>
</view>
```

在 `pages/settings/settings.js` 添加对应的事件处理：

```javascript
onAIServiceToggle(e) {
  const enabled = e.detail.value;
  this.setData({
    'config.aiService.enabled': enabled
  });
  this.saveConfig();
},

onAIServiceUrlChange(e) {
  const url = e.detail.value.trim();
  this.setData({
    'config.aiService.baseUrl': url
  });
  this.saveConfig();
}
```

---

### 第三步：测试小程序

#### 3.1 本地测试

在微信开发者工具中：

1. 点击"详情" → "本地设置"
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 编译运行小程序
4. 测试以下功能：
   - 查看今日任务（测试内容生成）
   - 点击单词查询（测试词典功能）
   - 点击发音按钮（测试 TTS 功能）

#### 3.2 查看请求日志

在微信开发者工具的"调试器" → "Network" 中查看请求：

- 请求 URL 应该是 `https://b-unit-checklist.vercel.app/xxx`
- 响应状态应该是 200
- 响应内容应该包含 `ok: true`

---

### 第四步：配置服务器域名白名单（正式发布前）

正式发布小程序前，需要在微信公众平台配置服务器域名：

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" → "开发管理" → "开发设置"
3. 找到"服务器域名" → "request 合法域名"
4. 点击"修改"，添加：

```
https://b-unit-checklist.vercel.app
```

以及阿里云的域名（用于 TTS 音频）：

```
https://dashscope.aliyuncs.com
```

5. 保存并等待审核（通常几分钟）

---

## 迁移前后对比

| 项目 | 微信云开发 | Vercel 自建 API |
|------|-----------|----------------|
| 部署方式 | 微信开发者工具上传 | Vercel CLI 一键部署 |
| 环境配置 | 云开发控制台配置 | Vercel 环境变量 |
| 调用方式 | `wx.cloud.callFunction()` | `wx.request()` |
| 本地调试 | 需要云函数模拟器 | 直接 `npm run dev` |
| 费用 | 免费版有限额 | Vercel 免费版额度更大 |
| 日志查看 | 云开发控制台 | Vercel Dashboard |
| 域名配置 | 不需要 | 需要配置服务器白名单 |

---

## 常见问题

### Q1: 小程序请求失败，提示"不在以下 request 合法域名列表中"

**A:** 开发阶段，在微信开发者工具中勾选"不校验合法域名"。正式发布前，需要在微信公众平台配置服务器域名白名单。

### Q2: Vercel 部署后 API 返回 500 错误

**A:** 检查环境变量是否配置正确：
1. 进入 Vercel 控制台 → Settings → Environment Variables
2. 确认 `DASHSCOPE_API_KEY` 已配置且正确
3. 重新部署：`vercel --prod`

### Q3: 阿里云 API Key 在哪里获取？

**A:** 
1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 注册/登录阿里云账号
3. 开通 DashScope 服务（有免费额度）
4. 在控制台找到 API Key

### Q4: 想要切换回云函数怎么办？

**A:** 只需要在小程序配置中改回云函数模式：

```javascript
aiService: {
  enabled: true,
  mode: 'cloud',  // 改回 cloud
  cloudFunctionName: 'aiProxy',
  provider: 'qwen'
}
```

代码已经兼容两种模式。

### Q5: 可以部署到其他平台吗？

**A:** 可以！只要支持 Node.js 的平台都可以：
- Railway: https://railway.app/
- Render: https://render.com/
- 腾讯云函数 SCF
- 阿里云函数计算 FC
- 自己的云服务器

只需要把 `api` 目录部署上去，配置好环境变量即可。

---

## 回滚方案

如果迁移过程中遇到问题，可以随时回滚：

1. 恢复 `app.js` 中的云开发初始化代码
2. 在小程序配置中将 `aiService.mode` 改回 `cloud`
3. 确保云函数 `aiProxy` 仍然部署在云端

原有的云函数代码仍然保留在 `cloudfunctions/aiProxy` 目录中。

---

## 后续优化

迁移完成后，可以考虑：

1. **自定义域名**：在 Vercel 中绑定自己的域名
2. **CDN 加速**：Vercel 自带全球 CDN
3. **监控告警**：集成 Sentry 等错误监控服务
4. **日志分析**：Vercel 提供完整的函数日志
5. **性能优化**：根据 Vercel Analytics 优化响应时间

---

## 需要帮助？

- Vercel 文档：https://vercel.com/docs
- 阿里云百炼文档：https://help.aliyun.com/zh/dashscope/
- 项目 Issue: （在你的 GitHub 仓库创建）
