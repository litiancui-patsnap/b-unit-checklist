# 小程序 AI 服务配置

当前配置的 API 地址：https://b-unit-checklist-main.vercel.app

## 在微信开发者工具中测试

1. 打开微信开发者工具
2. 点击"详情" → "本地设置"
3. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
4. 编译运行

## 正式发布前配置

需要在微信公众平台配置服务器域名白名单：

1. 登录 https://mp.weixin.qq.com/
2. 开发 → 开发管理 → 开发设置
3. 服务器域名 → request 合法域名 → 修改
4. 添加以下域名：

```
https://b-unit-checklist-main.vercel.app
https://dashscope.aliyuncs.com
```

5. 保存

## 测试 API 是否正常

```bash
# 健康检查
curl https://b-unit-checklist-main.vercel.app/health

# 测试查词
curl -X POST https://b-unit-checklist-main.vercel.app/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus"}'
```

## 如果需要切换回云函数

在 utils/storage.js 中修改：

```javascript
aiService: {
  enabled: true,
  mode: 'cloud',  // 改为 cloud
  cloudFunctionName: 'aiProxy',
  provider: 'qwen'
}
```

并在 app.js 中恢复云开发初始化代码。
