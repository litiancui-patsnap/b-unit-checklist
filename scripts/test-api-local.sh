#!/bin/bash

# 本地测试 API 服务

set -e

echo "🧪 本地 API 服务测试"
echo ""

# 检查是否有 .env 文件
if [ ! -f "api/.env" ]; then
    echo "❌ 未找到 api/.env 文件"
    echo "正在从模板创建..."
    cp api/.env.example api/.env
    echo "✅ 已创建 api/.env"
    echo ""
    echo "请编辑 api/.env 文件，填入你的 DASHSCOPE_API_KEY"
    echo "然后重新运行此脚本"
    exit 0
fi

# 检查依赖
if [ ! -d "api/node_modules" ]; then
    echo "📦 安装依赖..."
    cd api && npm install && cd ..
    echo "✅ 依赖安装完成"
    echo ""
fi

# 启动服务（后台运行）
echo "🚀 启动本地服务..."
cd api && node index.js &
SERVER_PID=$!
cd ..

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 测试健康检查
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 测试 1: 健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:3000/health | jq '.' || curl -s http://localhost:3000/health
echo ""

# 测试查词
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 测试 2: 查词 (focus)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus", "category": "日常"}' | jq '.' || \
curl -s -X POST http://localhost:3000/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"term": "focus", "category": "日常"}'
echo ""

# 测试词汇推荐
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 测试 3: 获取推荐词汇"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"goal": "daily", "count": 3}' | jq '.words' || \
curl -s -X POST http://localhost:3000/dictionary/lookup \
  -H "Content-Type: application/json" \
  -d '{"goal": "daily", "count": 3}'
echo ""

# 测试内容生成
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 测试 4: 生成每日学习内容"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/learning/content \
  -H "Content-Type: application/json" \
  -d '{"goal": "daily"}' | jq '.content' || \
curl -s -X POST http://localhost:3000/learning/content \
  -H "Content-Type: application/json" \
  -d '{"goal": "daily"}'
echo ""

# 测试 TTS
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 测试 5: TTS 语音合成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/speech/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test."}' | jq '.' || \
curl -s -X POST http://localhost:3000/speech/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test."}'
echo ""

# 停止服务
echo ""
echo "🛑 停止本地服务..."
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "如果所有测试都返回了 ok: true，说明 API 服务正常。"
echo ""
echo "📋 下一步："
echo "1. 运行 ./scripts/deploy-vercel.sh 部署到 Vercel"
echo "2. 在微信开发者工具中测试小程序"
echo ""
