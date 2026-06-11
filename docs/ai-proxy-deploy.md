# AI 代理云函数部署

小程序端已经默认调用微信云函数 `aiProxy`。API Key 不写入小程序代码，只配置在云函数环境变量。

## 1. 创建或确认云开发环境

在微信开发者工具中打开项目，进入“云开发”，创建或选择一个环境，记下环境 ID。

如果命令行可正常读取环境，也可以运行：

```bash
"/Applications/wechatwebdevtools.app/Contents/MacOS/cli" cloud env list --project /Users/ltc/Documents/project/b-unit-checklist-main --appid wx63290a3d7d124980
```

## 2. 上传云函数

```bash
bash scripts/deploy-ai-proxy.sh <你的云开发环境ID>
```

这个命令会上传 `cloudfunctions/aiProxy`，并使用云端安装依赖，不会上传本地 `node_modules`。

## 3. 配置云函数环境变量

在云开发控制台进入 `aiProxy` 的环境变量配置。

同时建议把 `aiProxy` 的超时时间设置为 `20 秒`。如果控制台显示当前为 `3 秒`，AI 内容生成或 TTS 可能会超时。

必填：

```text
DASHSCOPE_API_KEY=你的阿里云百炼API_KEY
```

推荐填写：

```text
DASHSCOPE_MODEL=qwen-plus
DASHSCOPE_TTS_MODEL=qwen3-tts-flash
DASHSCOPE_TTS_VOICE=Cherry
DASHSCOPE_TTS_LANGUAGE=English
```

有道词典可选。如果不填，有道查词会自动降级为千问生成词条：

```text
YOUDAO_APP_KEY=你的有道智云应用ID
YOUDAO_APP_SECRET=你的有道智云应用密钥
```

## 4. 小程序设置

设置页保持：

```text
启用服务端代理：开启
调用方式：微信云函数
云函数名：aiProxy
```

不需要填写 HTTP 服务地址。

## 5. 能力说明

- `dictionary.lookup`：优先有道词典；没有有道 Key 时用千问生成词条。
- `learning.content`：千问生成每日一句、短文、场景表达、长难句。
- `learning.plan`：千问生成学习计划。
- `speech.tts`：千问 TTS 返回临时音频 URL。
