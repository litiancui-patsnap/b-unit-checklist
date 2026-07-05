#!/bin/bash

# 一键开始脚本 - 引导用户完成整个流程

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   从微信云开发迁移到 Vercel - 一键部署向导                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 检查当前目录
if [ ! -f "vercel.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 迁移步骤："
echo "   1️⃣  配置阿里云 API Key"
echo "   2️⃣  本地测试 API 服务（可选）"
echo "   3️⃣  部署到 Vercel"
echo "   4️⃣  更新小程序配置"
echo "   5️⃣  测试小程序"
echo ""

# 步骤 1: 检查环境变量
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1/5: 配置阿里云 API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "api/.env" ]; then
    echo "⚠️  未找到 api/.env 文件"
    echo ""
    echo "获取 API Key 步骤："
    echo "1. 访问 https://dashscope.console.aliyun.com/"
    echo "2. 注册/登录阿里云账号"
    echo "3. 开通 DashScope 服务（有免费额度）"
    echo "4. 复制 API Key（格式: sk-xxxxxxxx）"
    echo ""
    read -p "已获取 API Key？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请先获取 API Key，然后重新运行此脚本"
        exit 0
    fi
    
    cp api/.env.example api/.env
    echo "✅ 已创建 api/.env 文件"
    echo ""
    echo "请编辑 api/.env，填入你的 API Key："
    echo ""
    echo "DASHSCOPE_API_KEY=sk-你的密钥"
    echo ""
    read -p "按 Enter 打开编辑器..." 
    
    # 尝试用默认编辑器打开
    if command -v nano &> /dev/null; then
        nano api/.env
    elif command -v vim &> /dev/null; then
        vim api/.env
    else
        open -e api/.env 2>/dev/null || echo "请手动编辑 api/.env 文件"
    fi
    
    echo ""
    read -p "已完成配置？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请完成配置后重新运行此脚本"
        exit 0
    fi
fi

# 验证 API Key
source api/.env
if [ -z "$DASHSCOPE_API_KEY" ] || [ "$DASHSCOPE_API_KEY" = "your_dashscope_api_key_here" ]; then
    echo "❌ API Key 配置不正确，请检查 api/.env 文件"
    exit 1
fi

echo "✅ API Key 配置完成"
echo ""

# 步骤 2: 本地测试
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2/5: 本地测试 API 服务（可选）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "是否在本地测试 API？建议先测试确保配置正确 (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🧪 运行本地测试..."
    ./scripts/test-api-local.sh
    echo ""
    read -p "测试通过？继续部署到 Vercel (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "请解决测试问题后重新运行"
        exit 0
    fi
else
    echo "⏭️  跳过本地测试"
fi

echo ""

# 步骤 3: 部署到 Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3/5: 部署到 Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚠️  未安装 Vercel CLI"
    read -p "是否立即安装？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g vercel
    else
        echo "请手动安装: npm install -g vercel"
        exit 1
    fi
fi

# 检查登录状态
echo "📋 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  未登录 Vercel"
    echo "即将打开登录页面..."
    vercel login
fi

echo ""
echo "🚀 开始部署到 Vercel..."
echo ""

# 部署
DEPLOYMENT_URL=$(vercel --prod --yes 2>&1 | tee /dev/tty | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo ""
    echo "❌ 部署失败，请检查错误信息"
    echo "常见问题："
    echo "- 检查网络连接"
    echo "- 检查 vercel.json 配置"
    echo "- 查看 Vercel Dashboard 日志"
    exit 1
fi

echo ""
echo "✅ 部署成功！"
echo "🌐 部署地址: $DEPLOYMENT_URL"
echo ""

# 配置环境变量提醒
echo "⚠️  重要：需要在 Vercel 配置环境变量"
echo ""
echo "1. 访问 Vercel Dashboard: https://vercel.com/dashboard"
echo "2. 进入项目 → Settings → Environment Variables"
echo "3. 添加环境变量:"
echo "   名称: DASHSCOPE_API_KEY"
echo "   值: $DASHSCOPE_API_KEY"
echo "   环境: Production, Preview, Development (全选)"
echo "4. 保存"
echo ""
read -p "已完成环境变量配置？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "请完成配置后运行: vercel --prod"
    exit 0
fi

echo ""
echo "🔄 重新部署以应用环境变量..."
vercel --prod --yes

echo ""
echo "🔍 测试 API 健康检查..."
sleep 3
if curl -f -s "$DEPLOYMENT_URL/health" > /dev/null; then
    echo "✅ API 服务正常"
else
    echo "⚠️  API 健康检查失败，请稍后重试或查看 Vercel 日志"
fi

echo ""

# 步骤 4: 更新小程序配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 4/5: 更新小程序配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "是否自动更新小程序配置文件？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/update-miniprogram-config.js "$DEPLOYMENT_URL"
else
    echo "⏭️  跳过配置更新"
    echo "你可以稍后运行: node scripts/update-miniprogram-config.js $DEPLOYMENT_URL"
fi

echo ""

# 步骤 5: 测试小程序
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 5/5: 测试小程序"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📱 在微信开发者工具中测试："
echo ""
echo "1. 打开微信开发者工具"
echo "2. 导入项目：$(pwd)"
echo "3. 点击 详情 → 本地设置"
echo "4. ✅ 勾选 '不校验合法域名、web-view、TLS 版本以及 HTTPS 证书'"
echo "5. 点击 编译"
echo "6. 测试以下功能："
echo "   - 查看今日任务"
echo "   - 点击单词查看释义"
echo "   - 测试发音功能"
echo "   - 生成英文日记"
echo "7. 在 调试器 → Network 中检查请求地址是否为:"
echo "   $DEPLOYMENT_URL"
echo ""

read -p "小程序测试通过？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "如果遇到问题，请查看："
    echo "- 详细教程: docs/migration-guide.md"
    echo "- API 文档: api/README.md"
    echo "- 常见问题: DEPLOYMENT-GUIDE.md"
    exit 0
fi

# 完成
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    🎉 部署完成！                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ API 服务地址: $DEPLOYMENT_URL"
echo "✅ 小程序配置已更新"
echo "✅ 功能测试通过"
echo ""
echo "📋 正式发布前还需要："
echo ""
echo "1. 在微信公众平台配置服务器域名白名单"
echo "   - 登录 https://mp.weixin.qq.com/"
echo "   - 开发 → 开发管理 → 开发设置"
echo "   - 服务器域名 → request 合法域名 → 修改"
echo "   - 添加: $DEPLOYMENT_URL"
echo "   - 添加: https://dashscope.aliyuncs.com"
echo ""
echo "2. 提交小程序审核"
echo ""
echo "📖 完整文档："
echo "   - 快速指南: README-VERCEL.md"
echo "   - 详细教程: docs/migration-guide.md"
echo "   - 项目结构: PROJECT-STRUCTURE.md"
echo ""
echo "🔧 后续操作："
echo "   - 查看 Vercel 日志: https://vercel.com/dashboard"
echo "   - 自定义域名: Vercel → Settings → Domains"
echo "   - 监控告警: 集成 Sentry 等服务"
echo ""
echo "需要帮助？查看文档或在 GitHub 提 Issue"
echo ""
