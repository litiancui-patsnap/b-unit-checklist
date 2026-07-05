# 手动部署指南

如果自动化脚本遇到问题，按照以下步骤手动部署。

## 前置准备

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

验证安装：
```bash
vercel --version
```

### 2. 准备阿里云 API Key

1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 开通 DashScope 服务（免费）
4. 获取 API Key（格式: sk-xxxxxxxx）

### 3. 注册 Vercel 账号

访问 https://vercel.com/signup 注册（免费）

## 部署步骤

### 步骤 1: 配置本地环境变量（可选）

```bash
cd /Users/ltc/Documents/project/b-unit-checklist-main
cp api/.env.example api/.env
nano api/.env
```

填入你的 API Key：
```
DASHSCOPE_API_KEY=sk-你的密钥
```

保存退出（Ctrl+O, 回车, Ctrl+X）

### 步骤 2: 登录 Vercel

```bash
vercel login
```

选择登录方式（GitHub/GitLab/Email）

### 步骤 3: 首次部署（测试环境）

```bash
cd /Users/ltc/Documents/project/b-unit-checklist-main
vercel
```

按提示操作：
- `Set up and deploy "~/Documents/project/b-unit-checklist-main"?` → 回车 (Yes)
- `Which scope do you want to deploy to?` → 选择你的账号
- `Link to existing project?` → N (No)
- `What's your project's name?` → 回车（使用默认名）
- `In which directory is your code located?` → 回车（./）
- 等待部署完成

你会得到一个测试 URL，比如：https://b-unit-checklist-xxx.vercel.app

### 步骤 4: 配置 Vercel 环境变量

**重要：必须在 Vercel 配置环境变量，API 才能正常工作**

方式一：通过 Dashboard（推荐）

1. 访问 https://vercel.com/dashboard
2. 选择你的项目（b-unit-checklist）
3. 点击 Settings 标签
4. 左侧菜单选择 Environment Variables
5. 点击 Add New
6. 填写：
   - Name: `DASHSCOPE_API_KEY`
   - Value: `sk-你的阿里云密钥`
   - Environment: 勾选 Production, Preview, Development
7. 点击 Save

方式二：通过 CLI

```bash
vercel env add DASHSCOPE_API_KEY
# 输入值: sk-你的密钥
# 选择环境: Production, Preview, Development (空格选择，回车确认)
```

### 步骤 5: 部署到生产环境

```bash
vercel --prod
```

等待部署完成，你会得到生产环境 URL：
```
https://b-unit-checklist.vercel.app
```

### 步骤 6: 测试 API

```bash
# 测试健康检查
curl https://你的域名.vercel.app/health

# 应该返回:
# {"status":"ok","service":"AI Learning Proxy","timestamp":"..."}

# 测试词典 API
curl -X POST https://你的域名.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term":"focus"}'
```

### 步骤 7: 更新小程序配置

```bash
node scripts/update-miniprogram-config.js https://你的域名.vercel.app
```

或手动编辑 `app.js`：

```javascript
const aiService = {
  mode: 'http',  // 改为 http
  baseUrl: 'https://你的域名.vercel.app',  // 你的 Vercel URL
};
```

### 步骤 8: 测试小程序

1. 打开微信开发者工具
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 编译项目
4. 测试以下功能：
   - 查词功能
   - 每日学习内容
   - 学习计划
   - 语音播放

## 常见问题排查

### API 返回 500 错误

**原因**: 环境变量未配置或配置错误

**解决**:
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确认 `DASHSCOPE_API_KEY` 存在且正确
3. 重新部署: `vercel --prod`

### API 返回 404

**原因**: 路由配置问题

**解决**:
1. 检查 `vercel.json` 是否存在
2. 检查路由配置是否正确
3. 重新部署

### 小程序报"不在 request 合法域名列表中"

**原因**: 微信小程序限制

**解决**:
- **开发阶段**: 勾选"不校验合法域名"
- **生产环境**: 在微信公众平台配置服务器域名
  1. 登录 https://mp.weixin.qq.com/
  2. 开发 → 开发管理 → 开发设置
  3. 服务器域名 → request合法域名
  4. 添加: `https://你的域名.vercel.app`

### 如何查看部署日志

```bash
# 查看最近部署
vercel ls

# 查看特定部署的日志
vercel logs https://你的域名.vercel.app
```

或访问 Vercel Dashboard → 项目 → Logs

### 如何回滚

```bash
# 查看历史部署
vercel ls

# 将特定部署设为生产环境
vercel promote https://b-unit-checklist-xxx.vercel.app
```

## 生产环境配置

### 添加自定义域名（可选）

1. Vercel Dashboard → 项目 → Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS 记录

### 监控和告警

Vercel 提供基础监控，升级到 Pro 版可获得：
- 更详细的分析
- 告警通知
- 更大的流量限制

## 维护命令

```bash
# 查看项目列表
vercel ls

# 查看项目详情
vercel inspect

# 删除部署
vercel remove [deployment-url]

# 查看环境变量
vercel env ls

# 添加环境变量
vercel env add [NAME]

# 删除环境变量
vercel env rm [NAME]
```

## 成本估算

Vercel 免费版额度：
- 100GB 带宽/月
- 100GB-小时 函数执行时间/月
- 6000 分钟构建时间/月

对于个人小程序，免费版完全够用。

---

需要帮助？
- Vercel 文档: https://vercel.com/docs
- 阿里云文档: https://help.aliyun.com/zh/dashscope/
- 项目文档: cat DEPLOYMENT-GUIDE.md
