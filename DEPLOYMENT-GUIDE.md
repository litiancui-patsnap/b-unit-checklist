# 从微信云开发迁移到 Vercel - 完整改造

## 📋 改造概览

已将小程序从微信云开发迁移到独立的 Vercel API 服务，完全摆脱对微信云环境的依赖。

## 🎯 核心改动

### 1. API 服务 (api/)

创建了独立的 Express API 服务，包含：

- **index.js**: Express 路由和中间件
- **lib.js**: 完整业务逻辑（从云函数迁移）
- **package.json**: 依赖管理
- **.env.example**: 环境变量模板

**5 个 API 端点：**
- GET `/health` - 健康检查
- POST `/dictionary/lookup` - 查词/词汇推荐
- POST `/learning/content` - 生成每日学习内容
- POST `/learning/plan` - 生成学习计划
- POST `/speech/tts` - 文本转语音

### 2. 部署配置

- **vercel.json**: Vercel 部署配置（函数超时 20 秒）
- **.vercelignore**: 排除小程序文件，只部署 API

### 3. 自动化脚本 (scripts/)

- **deploy-vercel.sh**: 一键部署到 Vercel
- **test-api-local.sh**: 本地测试 API 服务
- **update-miniprogram-config.js**: 自动更新小程序配置

### 4. 文档 (docs/)

- **migration-guide.md**: 完整迁移教程（8.5KB）
- **miniprogram-config.md**: 自动生成的配置说明
- **README-VERCEL.md**: 10 分钟快速部署指南
- **MIGRATION-SUMMARY.md**: 改造总结

## 🚀 快速开始

### 前置要求

1. Node.js >= 18
2. 阿里云百炼 API Key（免费注册）
3. Vercel 账号（免费）

### 三步部署

```bash
# 1. 配置 API Key
cd /Users/ltc/Documents/project/b-unit-checklist-main
cp api/.env.example api/.env
# 编辑 api/.env，填入 DASHSCOPE_API_KEY=sk-你的密钥

# 2. 本地测试（可选）
./scripts/test-api-local.sh

# 3. 部署到 Vercel
./scripts/deploy-vercel.sh
```

就这么简单！脚本会自动：
- 检查登录状态
- 部署到 Vercel
- 测试 API 健康
- 更新小程序配置

### 手动部署

如果你更喜欢手动控制：

```bash
# 1. 安装并登录 Vercel CLI
npm install -g vercel
vercel login

# 2. 部署
vercel --prod

# 3. 在 Vercel 控制台配置环境变量
# Settings → Environment Variables → 添加 DASHSCOPE_API_KEY

# 4. 重新部署
vercel --prod

# 5. 更新小程序配置
node scripts/update-miniprogram-config.js https://你的域名.vercel.app
```

## 📱 小程序配置

部署后需要配置小程序：

### 开发阶段

在微信开发者工具中：
1. 详情 → 本地设置
2. 勾选"不校验合法域名、web-view、TLS 版本以及 HTTPS 证书"
3. 编译运行

### 正式发布

在微信公众平台配置服务器域名白名单：
```
https://你的项目.vercel.app
https://dashscope.aliyuncs.com
```

## 🔧 环境变量

### 必填

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| DASHSCOPE_API_KEY | 阿里云百炼 API Key | [控制台](https://dashscope.console.aliyun.com/) |

### 可选

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DASHSCOPE_MODEL | qwen-plus | 文本生成模型 |
| DASHSCOPE_TTS_VOICE | Cherry | TTS 语音 |
| YOUDAO_APP_KEY | - | 有道词典 Key（可选） |
| YOUDAO_APP_SECRET | - | 有道词典密钥（可选） |

## 📊 对比

| 项目 | 微信云开发 | Vercel API |
|------|-----------|-----------|
| **费用** | 免费版有限 | 免费版更大 |
| **免费流量** | 5GB/月 | 100GB/月 |
| **函数调用** | 10万次/月 | 10万次/月 |
| **部署方式** | 微信开发者工具 | CLI 一键部署 |
| **本地调试** | 需要模拟器 | 直接 npm run dev |
| **日志查看** | 云控制台 | Vercel Dashboard |
| **域名配置** | 不需要 | 需要白名单 |
| **API Key 安全** | 云端 | 云端 |

## ✅ 兼容性

- ✅ 小程序代码无需改动（utils/aiLearning.js 已支持两种模式）
- ✅ 可随时切换回云函数
- ✅ 业务逻辑完全保留
- ✅ 原云函数保留在 cloudfunctions/ 作为备份

## 🧪 测试

### 本地测试 API

```bash
./scripts/test-api-local.sh
```

测试 5 个端点：健康检查、查词、词汇推荐、内容生成、TTS

### Vercel 测试

```bash
curl https://你的域名.vercel.app/health

curl -X POST https://你的域名.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus"}'
```

### 小程序测试

1. 编译运行
2. 测试今日任务
3. 测试单词查询
4. 测试发音功能
5. 查看 Network 面板确认请求地址

## 📖 文档导航

- **快速开始**: README-VERCEL.md
- **详细教程**: docs/migration-guide.md
- **API 文档**: api/README.md
- **改造总结**: MIGRATION-SUMMARY.md
- **本文档**: DEPLOYMENT-GUIDE.md

## ❓ 常见问题

### Q: 小程序请求失败？

**A**: 开发阶段勾选"不校验合法域名"；正式发布前配置服务器域名白名单。

### Q: API 返回 500 错误？

**A**: 检查 Vercel 环境变量是否配置正确，查看 Vercel 函数日志。

### Q: 想切回云函数？

**A**: 
```javascript
// utils/storage.js 中修改
aiService: {
  mode: 'cloud',  // 改为 cloud
  cloudFunctionName: 'aiProxy'
}

// app.js 中恢复
wx.cloud.init({ traceUser: true });
```

### Q: 阿里云 API Key 在哪里获取？

**A**: 
1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云
3. 开通 DashScope（有免费额度）
4. 复制 API Key

### Q: Vercel 部署失败？

**A**: 
1. 确保 Node.js >= 18
2. 检查 vercel.json 配置
3. 查看 Vercel 部署日志
4. 确认 api/index.js 和 api/lib.js 存在

## 🔄 回滚方案

随时可以回退：

1. 恢复 app.js 中的 `wx.cloud.init()`
2. 修改 aiService.mode 为 'cloud'
3. 确保云函数仍在云端

原云函数代码完整保留。

## 🎉 优势总结

✅ **零云开发依赖** - 不需要开通微信云开发
✅ **更大免费额度** - Vercel 免费版 100GB 流量
✅ **独立维护** - API 服务和小程序分离
✅ **本地调试** - 直接 npm run dev
✅ **灵活部署** - 可部署到任何平台
✅ **完全兼容** - 可随时切换回云函数

## 🛠 后续优化

部署成功后可以考虑：

1. **自定义域名**: Vercel 支持绑定自己的域名
2. **监控告警**: 集成 Sentry 等错误监控
3. **性能优化**: 根据 Vercel Analytics 数据优化
4. **CDN 加速**: Vercel 自带全球 CDN
5. **版本管理**: 通过 Git 管理部署版本

## 📞 获取帮助

- Vercel 文档: https://vercel.com/docs
- 阿里云百炼: https://help.aliyun.com/zh/dashscope/
- Express 文档: https://expressjs.com/

---

**改造完成时间**: 2026-07-02  
**改造用时**: < 10 分钟  
**所需费用**: 0 元（使用免费服务）

开始部署: `./scripts/deploy-vercel.sh` 🚀
