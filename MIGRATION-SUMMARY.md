# API 服务迁移完成 ✅

## 改造内容总结

已成功将微信云函数 `aiProxy` 改造为独立的 Express API 服务，可部署到 Vercel。

### 新增文件

```
项目根目录/
├── api/                          # 新的 API 服务目录
│   ├── index.js                  # Express 服务入口
│   ├── lib.js                    # 业务逻辑（从云函数迁移）
│   ├── package.json              # 依赖配置
│   ├── .env.example              # 环境变量模板
│   └── README.md                 # API 使用文档
│
├── vercel.json                   # Vercel 部署配置
├── .vercelignore                 # Vercel 忽略文件列表
│
├── scripts/
│   ├── deploy-vercel.sh          # 一键部署脚本
│   ├── test-api-local.sh         # 本地测试脚本
│   └── update-miniprogram-config.js  # 小程序配置更新工具
│
├── docs/
│   ├── migration-guide.md        # 详细迁移指南（8KB）
│   └── miniprogram-config.md     # 小程序配置说明（动态生成）
│
└── README-VERCEL.md              # 快速部署指南
```

### API 端点

所有端点都已实现：

| 端点 | 方法 | 功能 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/dictionary/lookup` | POST | 查词 / 词汇推荐 |
| `/learning/content` | POST | 生成每日学习内容 |
| `/learning/plan` | POST | 生成学习计划 |
| `/speech/tts` | POST | 文本转语音 |

### 部署流程

#### 选项 1: 自动化部署（推荐）

```bash
cd /Users/ltc/Documents/project/b-unit-checklist-main

# 1. 配置环境变量
cp api/.env.example api/.env
# 编辑 api/.env，填入 DASHSCOPE_API_KEY

# 2. 本地测试（可选）
./scripts/test-api-local.sh

# 3. 一键部署到 Vercel
./scripts/deploy-vercel.sh
```

#### 选项 2: 手动部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
cd /Users/ltc/Documents/project/b-unit-checklist-main
vercel --prod

# 4. 在 Vercel 控制台配置环境变量
# Settings → Environment Variables
# 添加: DASHSCOPE_API_KEY

# 5. 重新部署
vercel --prod

# 6. 更新小程序配置
node scripts/update-miniprogram-config.js https://你的域名.vercel.app
```

### 需要的环境变量

在 Vercel 中配置（或本地 `api/.env` 文件）：

**必填：**
- `DASHSCOPE_API_KEY`: 阿里云百炼 API Key

**可选：**
- `DASHSCOPE_MODEL`: 默认 `qwen-plus`
- `DASHSCOPE_TTS_VOICE`: 默认 `Cherry`
- `YOUDAO_APP_KEY`: 有道词典 App Key（可选）
- `YOUDAO_APP_SECRET`: 有道词典密钥（可选）

### 小程序改动

部署后需要更新小程序配置：

1. **app.js**: 注释掉 `wx.cloud.init()`（脚本自动完成）
2. **utils/storage.js**: 添加 `aiService` 配置（脚本自动完成）
3. **服务器域名白名单**（正式发布前手动配置）：
   - 你的 Vercel 域名
   - `https://dashscope.aliyuncs.com`

### 兼容性说明

- ✅ 代码已兼容云函数和 HTTP 两种模式
- ✅ 可以随时切换回云函数
- ✅ 小程序 `utils/aiLearning.js` 无需修改
- ✅ 业务逻辑完全保留

### 优势对比

| 项目 | 微信云开发 | Vercel |
|------|-----------|--------|
| 免费流量 | 5GB/月 | 100GB/月 |
| 函数调用 | 10万次/月 | 10万次/月 |
| 部署方式 | 微信开发者工具 | CLI 一键部署 |
| 本地调试 | 需要模拟器 | 直接 `npm run dev` |
| 日志查看 | 云控制台 | Vercel Dashboard |
| 域名配置 | 不需要 | 需要白名单 |

### 文档说明

- **README-VERCEL.md**: 10 分钟快速部署指南
- **docs/migration-guide.md**: 完整迁移教程，包含所有细节
- **api/README.md**: API 服务使用说明
- **docs/miniprogram-config.md**: 部署后自动生成的配置文档

### 测试方式

**本地测试：**
```bash
./scripts/test-api-local.sh
```

**Vercel 测试：**
```bash
curl https://你的域名.vercel.app/health
```

**小程序测试：**
1. 在微信开发者工具中勾选"不校验合法域名"
2. 编译运行
3. 测试词典、内容生成、发音等功能

### 回滚方案

如果需要回到云函数：

1. 恢复 `app.js` 中的 `wx.cloud.init()`
2. 修改配置：
   ```javascript
   aiService: {
     mode: 'cloud',  // 改为 cloud
     cloudFunctionName: 'aiProxy'
   }
   ```

原云函数代码保留在 `cloudfunctions/aiProxy/`，未删除。

### 下一步

1. **立即操作**: 运行 `./scripts/deploy-vercel.sh` 或查看 `README-VERCEL.md`
2. **获取 API Key**: https://dashscope.console.aliyun.com/
3. **遇到问题**: 查看 `docs/migration-guide.md` 的"常见问题"章节

---

所有文件已创建完成，准备就绪！ 🚀
