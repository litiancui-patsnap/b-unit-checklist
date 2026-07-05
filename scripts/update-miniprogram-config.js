/**
 * 更新小程序配置以使用 Vercel API
 * 
 * 使用方法：
 * node scripts/update-miniprogram-config.js https://your-project.vercel.app
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const vercelUrl = args[0];

if (!vercelUrl) {
  console.error('❌ 请提供 Vercel 部署后的域名');
  console.error('用法: node scripts/update-miniprogram-config.js https://your-project.vercel.app');
  process.exit(1);
}

const cleanUrl = vercelUrl.replace(/\/$/, '');

console.log('📝 更新小程序配置...');
console.log(`API 地址: ${cleanUrl}`);

// 1. 更新 app.js - 注释掉云开发初始化
const appJsPath = path.join(__dirname, '..', 'app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

if (appJsContent.includes('wx.cloud.init')) {
  appJsContent = appJsContent.replace(
    /if \(wx\.cloud\) \{[\s\S]*?\}/,
    '// 已迁移到自建 API，不再需要云开发\n    // if (wx.cloud) {\n    //   wx.cloud.init({ traceUser: true });\n    // }'
  );
  fs.writeFileSync(appJsPath, appJsContent);
  console.log('✅ app.js 已更新（云开发初始化已注释）');
}

// 2. 更新 utils/storage.js - 添加 AI 服务配置
const storageJsPath = path.join(__dirname, '..', 'utils', 'storage.js');
let storageContent = fs.readFileSync(storageJsPath, 'utf8');

// 检查是否已经有 aiService 配置
if (!storageContent.includes('aiService:')) {
  // 在 DEFAULT_CONFIG 中添加 aiService
  storageContent = storageContent.replace(
    /(const DEFAULT_CONFIG = \{[^}]*)/,
    `$1,
  aiService: {
    enabled: true,
    mode: 'http',
    baseUrl: '${cleanUrl}',
    provider: 'qwen',
    dictionaryPath: '/dictionary/lookup',
    ttsPath: '/speech/tts',
    contentPath: '/learning/content',
    planPath: '/learning/plan'
  }`
  );
  fs.writeFileSync(storageJsPath, storageContent);
  console.log('✅ utils/storage.js 已更新（添加 AI 服务配置）');
} else {
  console.log('ℹ️  utils/storage.js 已包含 aiService 配置，跳过');
}

// 3. 创建配置说明文档
const configDoc = `# 小程序 AI 服务配置

当前配置的 API 地址：${cleanUrl}

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

\`\`\`
${cleanUrl}
https://dashscope.aliyuncs.com
\`\`\`

5. 保存

## 测试 API 是否正常

\`\`\`bash
# 健康检查
curl ${cleanUrl}/health

# 测试查词
curl -X POST ${cleanUrl}/dictionary/lookup \\
  -H "Content-Type: application/json" \\
  -d '{"term": "focus"}'
\`\`\`

## 如果需要切换回云函数

在 utils/storage.js 中修改：

\`\`\`javascript
aiService: {
  enabled: true,
  mode: 'cloud',  // 改为 cloud
  cloudFunctionName: 'aiProxy',
  provider: 'qwen'
}
\`\`\`

并在 app.js 中恢复云开发初始化代码。
`;

fs.writeFileSync(
  path.join(__dirname, '..', 'docs', 'miniprogram-config.md'),
  configDoc
);
console.log('✅ 配置文档已生成: docs/miniprogram-config.md');

console.log('\n✨ 配置更新完成！');
console.log('\n📋 后续步骤：');
console.log('1. 在微信开发者工具中编译运行小程序');
console.log('2. 测试词典、内容生成等功能');
console.log('3. 正式发布前配置服务器域名白名单');
console.log('\n详细说明请查看: docs/migration-guide.md');
