## 项目结构 - 迁移后

```
b-unit-checklist-main/
│
├── 📦 小程序源码（保持不变）
│   ├── pages/               # 页面
│   ├── utils/               # 工具函数
│   ├── images/              # 图片资源
│   ├── assets/              # 音频资源
│   ├── app.js               # 小程序入口
│   ├── app.json             # 小程序配置
│   └── app.wxss             # 全局样式
│
├── 🚀 新增：API 服务
│   └── api/
│       ├── index.js         # Express 服务入口
│       ├── lib.js           # 业务逻辑（从云函数迁移）
│       ├── package.json     # 依赖配置
│       ├── .env.example     # 环境变量模板
│       └── README.md        # API 文档
│
├── ⚙️  新增：Vercel 配置
│   ├── vercel.json          # Vercel 部署配置
│   └── .vercelignore        # 排除小程序文件
│
├── 🛠 新增：自动化脚本
│   └── scripts/
│       ├── deploy-vercel.sh           # 一键部署
│       ├── test-api-local.sh          # 本地测试
│       └── update-miniprogram-config.js  # 配置更新
│
├── 📚 新增：文档
│   ├── docs/
│   │   └── migration-guide.md         # 详细迁移教程
│   ├── DEPLOYMENT-GUIDE.md            # 部署完整指南
│   ├── README-VERCEL.md               # 快速开始
│   └── MIGRATION-SUMMARY.md           # 改造总结
│
├── 💾 保留：原云函数（备份）
│   └── cloudfunctions/
│       └── aiProxy/         # 原云函数代码（未改动）
│
└── 🧪 测试代码
    └── test/                # 单元测试
```

## 核心文件说明

### API 服务 (api/)

| 文件 | 大小 | 说明 |
|------|------|------|
| index.js | 2.3KB | Express 路由，定义 5 个端点 |
| lib.js | 11KB | 核心业务逻辑（查词、内容生成、TTS） |
| package.json | 347B | 依赖：express, cors |
| .env.example | 436B | 环境变量模板 |

### 部署配置

| 文件 | 作用 |
|------|------|
| vercel.json | Vercel 部署配置，设置函数超时 20 秒 |
| .vercelignore | 排除小程序文件，只部署 API |

### 脚本工具

| 脚本 | 功能 |
|------|------|
| deploy-vercel.sh | 自动部署：检查环境 → 部署 → 测试 → 更新配置 |
| test-api-local.sh | 本地测试：启动服务 → 测试 5 个端点 → 停止 |
| update-miniprogram-config.js | 自动更新小程序配置文件 |

### 文档

| 文档 | 内容 | 适合 |
|------|------|------|
| README-VERCEL.md | 10 分钟快速部署 | 新手 |
| DEPLOYMENT-GUIDE.md | 完整部署指南 | 全面了解 |
| docs/migration-guide.md | 详细迁移教程 | 深度学习 |
| MIGRATION-SUMMARY.md | 改造总结 | 快速浏览 |
| api/README.md | API 使用文档 | API 开发 |

## 文件大小统计

```
API 服务:      ~17 KB
配置文件:      ~1 KB
脚本:          ~10 KB
文档:          ~25 KB
────────────────────
总计:          ~53 KB
```

## 依赖关系

```
小程序 (前端)
    ↓ HTTP 请求
API 服务 (Vercel)
    ↓ API 调用
阿里云百炼 / 有道词典
```

## 改动影响范围

### ✅ 无需改动
- pages/ 目录所有页面代码
- utils/ 目录（已支持两种模式）
- 测试代码
- 小程序配置文件

### ⚙️  需要配置
- app.js (注释云开发初始化)
- utils/storage.js (添加 aiService 配置)
- 微信公众平台服务器域名白名单

### 🆕 新增文件
- api/ 目录
- vercel.json / .vercelignore
- scripts/ 中的 3 个脚本
- 5 个文档文件

## 下一步操作

1. **查看快速指南**: 
   ```bash
   cat README-VERCEL.md
   ```

2. **本地测试**:
   ```bash
   cp api/.env.example api/.env
   # 编辑 api/.env 填入 API Key
   ./scripts/test-api-local.sh
   ```

3. **部署到 Vercel**:
   ```bash
   ./scripts/deploy-vercel.sh
   ```

4. **测试小程序**:
   - 在微信开发者工具中打开项目
   - 勾选"不校验合法域名"
   - 编译运行
