#!/bin/bash

# Vercel 快速部署脚本

set -e

echo "🚀 开始部署到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未安装 Vercel CLI"
    echo "请运行: npm install -g vercel"
    exit 1
fi

# 检查是否登录
echo "📋 检查登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  未登录 Vercel，开始登录..."
    vercel login
fi

# 检查环境变量
if [ ! -f "api/.env" ]; then
    echo "⚠️  未找到 api/.env 文件"
    echo "请先复制 api/.env.example 为 api/.env 并填入你的 API Key"
    read -p "是否现在创建？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp api/.env.example api/.env
        echo "✅ 已创建 api/.env，请编辑该文件填入你的 DASHSCOPE_API_KEY"
        exit 0
    else
        exit 1
    fi
fi

# 读取 .env 文件
source api/.env

if [ -z "$DASHSCOPE_API_KEY" ] || [ "$DASHSCOPE_API_KEY" = "your_dashscope_api_key_here" ]; then
    echo "❌ 请在 api/.env 中配置正确的 DASHSCOPE_API_KEY"
    exit 1
fi

# 部署到 Vercel
echo "📦 开始部署..."
DEPLOYMENT_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ 部署失败，请检查错误信息"
    exit 1
fi

echo "✅ 部署成功！"
echo "🌐 部署地址: $DEPLOYMENT_URL"

# 测试健康检查
echo ""
echo "🔍 测试 API 健康检查..."
if curl -f -s "$DEPLOYMENT_URL/health" > /dev/null; then
    echo "✅ API 服务正常"
else
    echo "⚠️  API 健康检查失败，请稍后重试或查看 Vercel 日志"
fi

# 询问是否更新小程序配置
echo ""
read -p "是否自动更新小程序配置？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/update-miniprogram-config.js "$DEPLOYMENT_URL"
else
    echo "ℹ️  跳过配置更新"
    echo "你可以稍后运行: node scripts/update-miniprogram-config.js $DEPLOYMENT_URL"
fi

echo ""
echo "🎉 所有步骤完成！"
echo ""
echo "📋 接下来："
echo "1. 在微信开发者工具中打开项目"
echo "2. 详情 → 本地设置 → 勾选'不校验合法域名'"
echo "3. 编译运行并测试功能"
echo ""
echo "📖 详细文档: docs/migration-guide.md"
