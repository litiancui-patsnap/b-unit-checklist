# 🚀 开始使用

欢迎！这个项目已经准备好从微信云开发迁移到 Vercel。

## ⚡️ 最快开始（推荐）

一条命令完成所有步骤：

```bash
./scripts/start-migration.sh
```

这个交互式脚本会引导你：
1. 配置阿里云 API Key
2. 本地测试（可选）
3. 部署到 Vercel
4. 更新小程序配置
5. 测试小程序

## 📚 或者查看文档

| 文档 | 适合 | 时间 |
|------|------|------|
| [README-VERCEL.md](README-VERCEL.md) | 快速了解，想直接开始 | 5 分钟 |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | 全面了解方案和步骤 | 10 分钟 |
| [docs/migration-guide.md](docs/migration-guide.md) | 深度学习每个细节 | 20 分钟 |
| [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) | 了解项目结构 | 3 分钟 |

## 🎯 三种部署方式

### 方式一：一键脚本（最简单）

```bash
./scripts/start-migration.sh
```

### 方式二：自动化脚本

```bash
cp api/.env.example api/.env
# 编辑 api/.env 填入 DASHSCOPE_API_KEY
./scripts/deploy-vercel.sh
```

### 方式三：手动控制

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 配置环境变量
cp api/.env.example api/.env
# 编辑 api/.env

# 3. 本地测试
./scripts/test-api-local.sh

# 4. 部署
vercel --prod

# 5. 配置 Vercel 环境变量后重新部署
vercel --prod

# 6. 更新小程序配置
node scripts/update-miniprogram-config.js https://你的域名.vercel.app
```

## 📋 准备清单

部署前你需要：

- [ ] Node.js >= 18
- [ ] 阿里云百炼 API Key（[免费获取](https://dashscope.console.aliyun.com/)）
- [ ] Vercel 账号（[免费注册](https://vercel.com/signup)）
- [ ] 微信开发者工具

## ✅ 核心优势

| 特性 | 微信云开发 | Vercel 方案 |
|------|-----------|------------|
| 💰 费用 | 免费版 5GB/月 | 免费版 100GB/月 |
| 🚀 部署 | 微信开发者工具 | CLI 一键部署 |
| 🔧 调试 | 云函数模拟器 | 本地 npm run dev |
| 📊 日志 | 云控制台 | Vercel Dashboard |
| 🔐 安全 | API Key 在云端 | API Key 在 Vercel |
| 🔄 灵活 | 依赖微信云 | 独立部署 |

## 🧪 快速测试

部署后测试 API 是否正常：

```bash
# 健康检查
curl https://你的域名.vercel.app/health

# 查词
curl -X POST https://你的域名.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus"}'
```

## ❓ 常见问题

**Q: 需要什么前置知识？**  
A: 基本的命令行操作即可，脚本会引导你完成所有步骤。

**Q: 需要付费吗？**  
A: 不需要。阿里云和 Vercel 的免费额度足够个人使用。

**Q: 部署需要多久？**  
A: 使用一键脚本约 5-10 分钟。

**Q: 如果出问题怎么办？**  
A: 可以随时切回云函数，原代码完整保留。

**Q: 会影响现有小程序吗？**  
A: 不会。代码已兼容两种模式，可以先测试再切换。

## 📞 获取帮助

- 📖 [详细教程](docs/migration-guide.md)
- 📊 [项目结构](PROJECT-STRUCTURE.md)
- 🔧 [API 文档](api/README.md)
- 💬 [Vercel 文档](https://vercel.com/docs)

---

**准备好了？运行这个命令开始：**

```bash
./scripts/start-migration.sh
```

🎉 10 分钟后你就有一个不依赖微信云开发的小程序了！
