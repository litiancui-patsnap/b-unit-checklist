# 🎉 部署成功！后续操作指南

你的 API 已成功部署到 Vercel！

## 📍 你的部署信息

**生产环境 URL**: https://b-unit-checklist-main.vercel.app

**Dashboard**: https://vercel.com/alinas-projects-6b64f21c/b-unit-checklist-main

---

## ⚠️ 重要：配置环境变量

**API 目前还不能工作**，因为需要在 Vercel 配置环境变量。

### 步骤：

1. **访问 Vercel Dashboard**
   https://vercel.com/alinas-projects-6b64f21c/b-unit-checklist-main

2. **进入 Settings**
   点击顶部的 "Settings" 标签

3. **打开 Environment Variables**
   左侧菜单选择 "Environment Variables"

4. **添加 API Key**
   - 点击 "Add New"
   - Name: `DASHSCOPE_API_KEY`
   - Value: `sk-你的阿里云百炼密钥`
   - Environment: 勾选 **Production**, Preview, Development
   - 点击 Save

5. **重新部署**（让环境变量生效）
   ```bash
   vercel --prod
   ```

---

## ✅ 测试 API（配置环境变量后）

### 方式一：命令行测试

```bash
# 健康检查
curl https://b-unit-checklist-main.vercel.app/health

# 应该返回:
# {"status":"ok","service":"AI Learning Proxy","timestamp":"..."}

# 测试查词 API
curl -X POST https://b-unit-checklist-main.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term":"focus"}'
```

### 方式二：浏览器测试

直接访问：https://b-unit-checklist-main.vercel.app/health

---

## 📱 更新小程序配置

### 自动更新（推荐）

```bash
node scripts/update-miniprogram-config.js https://b-unit-checklist-main.vercel.app
```

### 手动更新

编辑 `app.js`，找到 `aiService` 配置：

```javascript
const aiService = {
  mode: 'http',  // 改为 http
  baseUrl: 'https://b-unit-checklist-main.vercel.app',  // 添加这行
};
```

---

## 🧪 测试小程序

1. **打开微信开发者工具**

2. **勾选"不校验合法域名"**
   - 详情 → 本地设置
   - 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

3. **编译项目**

4. **测试功能**
   - 查词功能
   - 每日学习内容
   - 学习计划
   - 语音播放

---

## 🔧 查看日志和监控

### 查看部署日志
```bash
vercel logs https://b-unit-checklist-main.vercel.app
```

### 或访问 Dashboard
https://vercel.com/alinas-projects-6b64f21c/b-unit-checklist-main

点击 **Logs** 标签查看实时日志。

---

## 📋 生产环境配置（可选）

### 1. 添加服务器域名到微信公众平台

1. 登录 https://mp.weixin.qq.com/
2. 开发 → 开发管理 → 开发设置
3. 服务器域名 → request合法域名
4. 添加：`b-unit-checklist-main.vercel.app`

### 2. 自定义域名（可选）

如果你有自己的域名：

1. Vercel Dashboard → Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS 记录

---

## 🆘 常见问题

### Q: API 返回 500 错误
**A**: 检查环境变量是否配置正确
- Dashboard → Settings → Environment Variables
- 确认 `DASHSCOPE_API_KEY` 存在
- 重新部署: `vercel --prod`

### Q: curl 连接超时
**A**: 可能是网络问题或 Vercel 服务器响应慢
- 稍等片刻再试
- 或在浏览器访问
- 或使用 VPN

### Q: 小程序报"不在合法域名列表中"
**A**: 开发阶段勾选"不校验合法域名"；生产环境需在公众平台配置

### Q: 如何查看详细错误？
**A**: 
```bash
vercel logs https://b-unit-checklist-main.vercel.app --follow
```

或访问 Dashboard → Logs

### Q: 如何回滚到云函数？
**A**: 修改 `app.js`:
```javascript
const aiService = {
  mode: 'cloud',  // 改回 cloud
};
```

---

## 📊 下一步操作清单

- [ ] 配置 Vercel 环境变量 `DASHSCOPE_API_KEY`
- [ ] 重新部署 `vercel --prod`
- [ ] 测试 API `/health` 端点
- [ ] 更新小程序配置
- [ ] 测试小程序功能
- [ ] （可选）在公众平台配置服务器域名

---

## 🎯 快速命令参考

```bash
# 查看部署列表
vercel ls --prod

# 重新部署
vercel --prod

# 查看日志
vercel logs https://b-unit-checklist-main.vercel.app

# 测试健康检查
curl https://b-unit-checklist-main.vercel.app/health

# 更新小程序配置
node scripts/update-miniprogram-config.js https://b-unit-checklist-main.vercel.app

# 查看环境变量
vercel env ls
```

---

**🎉 恭喜！你已经成功将小程序从微信云开发迁移到 Vercel！**

现在去 Vercel Dashboard 配置环境变量，然后测试 API 吧！
