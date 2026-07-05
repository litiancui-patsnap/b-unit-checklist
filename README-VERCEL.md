# 快速部署指南 🚀

本文档帮助你在 10 分钟内把小程序从微信云开发迁移到 Vercel。

## 一键部署（推荐）

### 准备工作

1. 获取阿里云百炼 API Key
   - 访问 https://dashscope.console.aliyun.com/
   - 注册/登录阿里云账号
   - 开通 DashScope 服务
   - 复制 API Key (格式: sk-xxxxxxxx)

2. 安装 Vercel CLI
   ```bash
   npm install -g vercel
   ```

### 部署步骤

#### 方式一：自动化脚本（最简单）

```bash
cd /Users/ltc/Documents/project/b-unit-checklist-main

# 1. 创建环境配置
cp api/.env.example api/.env

# 2. 编辑 api/.env，填入你的 API Key
# DASHSCOPE_API_KEY=sk-你的密钥

# 3. 运行一键部署脚本
./scripts/deploy-vercel.sh
```

脚本会自动：
- 检查环境
- 部署到 Vercel
- 测试 API 健康状态
- 更新小程序配置

#### 方式二：手动部署

```bash
# 1. 登录 Vercel
vercel login

# 2. 部署项目
vercel --prod

# 3. 在 Vercel 控制台配置环境变量
# Settings → Environment Variables
# 添加: DASHSCOPE_API_KEY = sk-你的密钥

# 4. 重新部署以应用环境变量
vercel --prod

# 5. 更新小程序配置
node scripts/update-miniprogram-config.js https://你的域名.vercel.app
```

## 测试小程序

### 1. 本地测试

1. 打开微信开发者工具
2. 导入项目目录
3. 点击"详情" → "本地设置"
4. 勾选"不校验合法域名..."
5. 编译运行
6. 测试以下功能：
   - 首页查看今日任务
   - 点击单词查看释义
   - 测试发音功能
   - 生成英文日记

### 2. 查看请求日志

在微信开发者工具的"调试器" → "Network" 中：
- 请求地址应为 `https://xxx.vercel.app/xxx`
- 状态码应为 200
- 响应包含 `ok: true`

### 3. 常见问题

**Q: 小程序请求失败**
- 确认已勾选"不校验合法域名"
- 检查 Vercel 部署是否成功
- 查看 Vercel 函数日志

**Q: API 返回错误**
- 确认环境变量 DASHSCOPE_API_KEY 已配置
- 检查 API Key 是否有效且有余额
- 在 Vercel Dashboard 查看函数日志

**Q: 想切回云函数**
- 恢复 app.js 中的 wx.cloud.init()
- 修改配置 aiService.mode 为 'cloud'

## 正式发布

正式发布小程序前，需要配置服务器域名白名单：

1. 登录 https://mp.weixin.qq.com/
2. 开发 → 开发管理 → 开发设置
3. 服务器域名 → request 合法域名 → 修改
4. 添加你的 Vercel 域名和阿里云域名：
   ```
   https://your-project.vercel.app
   https://dashscope.aliyuncs.com
   ```

## 文件说明

```
.
├── api/                      # 新增的 API 服务目录
│   ├── index.js             # Express 服务入口
│   ├── lib.js               # 业务逻辑（从云函数复制）
│   ├── package.json         # API 依赖
│   ├── .env.example         # 环境变量模板
│   └── README.md            # API 文档
├── vercel.json              # Vercel 部署配置
├── .vercelignore           # Vercel 忽略文件
├── scripts/
│   ├── deploy-vercel.sh    # 一键部署脚本
│   └── update-miniprogram-config.js  # 配置更新脚本
├── docs/
│   ├── migration-guide.md   # 详细迁移指南
│   └── miniprogram-config.md  # 小程序配置说明
└── cloudfunctions/          # 原云函数（保留作为备份）
```

## 成本对比

| 项目 | 微信云开发 | Vercel |
|------|-----------|--------|
| 免费额度 | 5GB 流量/月 | 100GB 流量/月 |
| 函数调用 | 10万次/月 | 10万次/月 |
| 函数时长 | 4万GBs/月 | 100 小时/月 |
| 超出费用 | 按量计费 | 付费套餐 $20/月 |

个人和小团队使用，Vercel 免费版完全够用。

## 优势总结

✅ 不依赖微信云开发
✅ 免费额度更大
✅ 部署和调试更方便
✅ 可以本地启动测试
✅ API 服务独立维护
✅ 代码已兼容两种模式，可随时切换

## 需要帮助？

- 完整文档: `docs/migration-guide.md`
- API 文档: `api/README.md`
- Vercel 文档: https://vercel.com/docs
- 阿里云百炼: https://help.aliyun.com/zh/dashscope/

---

**最后更新**: 2026-07-02
