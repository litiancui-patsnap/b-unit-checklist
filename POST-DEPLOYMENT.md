# 部署后操作清单

部署完成后，按以下步骤操作：

## 1️⃣ 检查部署状态

运行检查脚本：
```bash
./scripts/check-deployment.sh
```

或手动检查：
```bash
vercel ls
```

## 2️⃣ 配置 Vercel 环境变量

**重要：必须在 Vercel Dashboard 配置环境变量**

1. 访问 Vercel Dashboard
   https://vercel.com/dashboard

2. 选择你的项目

3. 进入 Settings → Environment Variables

4. 添加以下变量：
   ```
   DASHSCOPE_API_KEY = sk-你的阿里云API密钥
   ```

5. 重新部署（让环境变量生效）：
   ```bash
   vercel --prod
   ```

## 3️⃣ 测试 API

获取你的部署 URL：
```bash
vercel ls --prod
```

测试健康检查：
```bash
curl https://你的域名.vercel.app/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "AI Learning Proxy",
  "timestamp": "..."
}
```

测试词典 API：
```bash
curl -X POST https://你的域名.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term":"focus"}'
```

## 4️⃣ 更新小程序配置

运行配置更新脚本：
```bash
node scripts/update-miniprogram-config.js https://你的域名.vercel.app
```

或手动修改 `app.js`：

```javascript
// 找到 aiService 配置部分
const aiService = {
  mode: 'http',  // 改为 http
  baseUrl: 'https://你的域名.vercel.app',  // 添加你的 Vercel URL
  // ...
};
```

## 5️⃣ 测试小程序

1. 在微信开发者工具中打开小程序
2. 编译运行
3. 测试以下功能：
   - 查词功能
   - 每日学习内容
   - 学习计划生成
   - 语音播放

## 6️⃣ 添加服务器域名（生产环境）

在微信公众平台配置服务器域名：

1. 登录 https://mp.weixin.qq.com/
2. 开发 → 开发管理 → 开发设置
3. 服务器域名 → request合法域名
4. 添加：`https://你的域名.vercel.app`

## 常见问题

**Q: API 返回 500 错误**
A: 检查 Vercel 环境变量是否配置，特别是 DASHSCOPE_API_KEY

**Q: 小程序报错 "不在以下 request 合法域名列表中"**
A: 开发阶段在微信开发者工具勾选"不校验合法域名"，生产环境需在公众平台配置

**Q: 如何查看 API 日志？**
A: 访问 Vercel Dashboard → 选择项目 → Logs

**Q: 如何回滚到云函数？**
A: 修改 app.js 中的 `mode: 'cloud'` 即可，无需删除代码

## 监控和维护

### 查看部署日志
```bash
vercel logs https://你的域名.vercel.app
```

### 查看最近部署
```bash
vercel ls
```

### 重新部署
```bash
vercel --prod
```

### 查看环境变量
访问：https://vercel.com/dashboard → 项目 → Settings → Environment Variables

---

需要帮助？查看完整文档：
- DEPLOYMENT-GUIDE.md - 完整部署指南
- docs/migration-guide.md - 详细迁移教程
- api/README.md - API 使用文档
