#!/bin/bash

# 部署后检查脚本

set -e

echo "🔍 Vercel 部署状态检查"
echo ""

# 获取项目信息
PROJECT_INFO=$(vercel ls 2>/dev/null | head -5)

if [ -z "$PROJECT_INFO" ]; then
    echo "❌ 未找到 Vercel 项目"
    echo "请确保已运行: vercel --prod"
    exit 1
fi

echo "✅ 找到 Vercel 项目"
echo ""

# 获取最新部署的 URL
echo "📡 获取部署 URL..."
DEPLOY_URL=$(vercel ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    echo "⚠️  未找到生产环境 URL，尝试获取预览 URL..."
    DEPLOY_URL=$(vercel ls 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
fi

if [ -z "$DEPLOY_URL" ]; then
    echo "❌ 无法获取部署 URL"
    echo "请手动运行: vercel ls"
    exit 1
fi

echo "✅ 部署 URL: $DEPLOY_URL"
echo ""

# 测试健康检查
echo "🧪 测试 API 健康检查..."
HEALTH_CHECK=$(curl -s -w "\n%{http_code}" "${DEPLOY_URL}/health" 2>/dev/null | tail -1)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ 健康检查通过"
else
    echo "⚠️  健康检查失败 (HTTP $HEALTH_CHECK)"
    echo "这可能是因为:"
    echo "  1. Vercel 环境变量未配置"
    echo "  2. 部署还在进行中"
    echo "  3. API 路由配置有误"
    echo ""
    echo "请检查 Vercel Dashboard:"
    echo "  https://vercel.com/dashboard"
fi

echo ""

# 测试词典 API
echo "🧪 测试词典 API..."
DICT_RESPONSE=$(curl -s -X POST "${DEPLOY_URL}/dictionary/lookup" \
  -H "Content-Type: application/json" \
  -d '{"term":"test"}' 2>/dev/null)

if echo "$DICT_RESPONSE" | grep -q '"word"'; then
    echo "✅ 词典 API 工作正常"
elif echo "$DICT_RESPONSE" | grep -q 'error'; then
    echo "⚠️  词典 API 返回错误:"
    echo "$DICT_RESPONSE" | head -3
else
    echo "⚠️  词典 API 响应异常"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  下一步操作"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 配置 Vercel 环境变量（如果还没配置）:"
echo "   https://vercel.com/dashboard"
echo "   需要添加: DASHSCOPE_API_KEY"
echo ""
echo "2. 更新小程序配置:"
echo "   node scripts/update-miniprogram-config.js $DEPLOY_URL"
echo ""
echo "3. 在微信开发者工具中测试小程序"
echo ""
echo "你的 API 地址: $DEPLOY_URL"
echo ""
