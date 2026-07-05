# Pull Request: 迁移到 Vercel API 并修复按钮布局

## 📋 改动内容

### 1. ✅ 迁移到 Vercel API
- 创建 Express API 服务 (`api/` 目录)
  - `api/index.js` - Express 路由和 CORS 配置
  - `api/lib.js` - 完整业务逻辑（从云函数迁移）
  - `api/package.json` - 依赖配置
- 配置 Vercel 部署
  - `vercel.json` - 部署配置
  - `.vercelignore` - 排除文件
- 更新小程序配置使用 HTTP 模式
  - `utils/defaultConfig.js` - aiService 从 `cloud` 改为 `http`
  - baseUrl 设置为 `https://b-unit-checklist-main.vercel.app`
- ✅ 已部署到生产环境

### 2. 🐛 修复问题
- **app.js 语法错误**: 修复 onLaunch 函数花括号位置导致的编译错误
- **按钮布局问题**: 修复以下按钮超出屏幕宽度
  - AI/词典补全、推荐今日单词 (`.word-action-row`)
  - 分享小程序卡片、复制打卡文案 (`.share-action-row`)
  - 改用 `flex` 布局 + `flex: 1` 自动平分宽度

### 3. 📖 新增文档和工具
- **部署文档**:
  - `GET-STARTED.md` - 快速开始指南
  - `DEPLOYMENT-GUIDE.md` - 完整部署指南
  - `DEPLOYMENT-SUCCESS.md` - 部署后操作
  - `MANUAL-DEPLOYMENT.md` - 手动部署步骤
  - `README-VERCEL.md` - Vercel 快速部署
  - `PROJECT-STRUCTURE.md` - 项目结构说明
  - `MIGRATION-SUMMARY.md` - 迁移总结
  - `POST-DEPLOYMENT.md` - 部署后清单
  - `START-HERE.txt` - 文本格式快速指引

- **自动化脚本**:
  - `scripts/start-migration.sh` - 一键迁移向导
  - `scripts/deploy-vercel.sh` - 部署脚本
  - `scripts/test-api-local.sh` - 本地测试脚本
  - `scripts/update-miniprogram-config.js` - 配置更新
  - `scripts/check-deployment.sh` - 部署检查

- **迁移文档**:
  - `docs/migration-guide.md` - 详细迁移指南

## 🧪 测试状态

- ✅ Vercel 部署成功
- ✅ 语法错误修复完成
- ✅ 按钮布局修复完成
- ⏳ 需要在微信开发者工具中测试 AI 功能（查词、推荐、内容生成、TTS）

## 🔑 部署依赖

**重要**: 需要在 Vercel Dashboard 配置环境变量才能使用 AI 功能：

1. 访问: https://vercel.com/alinas-projects-6b64f21c/b-unit-checklist-main/settings/environment-variables
2. 添加环境变量:
   - `DASHSCOPE_API_KEY` = `sk-你的阿里云百炼密钥`
3. 重新部署: `vercel --prod`

获取 API Key: https://dashscope.console.aliyun.com/

## 🔗 相关链接

- **Vercel Dashboard**: https://vercel.com/alinas-projects-6b64f21c/b-unit-checklist-main
- **生产环境**: https://b-unit-checklist-main.vercel.app
- **Health Check**: https://b-unit-checklist-main.vercel.app/health

## 📝 改动文件

**核心代码**:
- `app.js` - 修复语法错误
- `utils/defaultConfig.js` - 更新 AI 服务配置
- `pages/home/home.wxss` - 修复按钮布局

**新增 API 服务**:
- `api/index.js`
- `api/lib.js`
- `api/package.json`
- `api/.env.example`
- `api/README.md`

**部署配置**:
- `vercel.json`
- `.vercelignore`

**文档和脚本**: 共 20+ 个文件

## ✅ 检查清单

- [x] 代码无语法错误
- [x] 按钮布局正常显示
- [x] Vercel 部署成功
- [x] 配置文档完整
- [x] 部署脚本可用
- [ ] 小程序 AI 功能测试（需配置环境变量后测试）

## 🚀 合并后步骤

1. 在 Vercel 配置 `DASHSCOPE_API_KEY` 环境变量
2. 重新部署: `vercel --prod`
3. 在微信开发者工具测试所有 AI 功能
4. 如需回退到云开发，修改 `utils/defaultConfig.js` 中 `aiService.mode` 为 `'cloud'`
