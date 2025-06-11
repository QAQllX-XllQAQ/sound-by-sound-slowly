<details open>
<summary>English</summary>

# Sound By Sound Slowly

An AI-powered WeChat Mini Program for daily sign-in, pronunciation practice, and evaluation—featuring Pinyin & IPA conversion, tone analysis, and personalized tips driven by OpenRouter GPT-4o-mini.

## Features

- **Daily Sign-In**: Track learning streaks, total days, and monthly progress with a calendar view.
- **Pinyin Conversion**: Convert any text to Pinyin with tone marks (AI-generated or local fallback).
- **IPA Transcription**: Generate IPA for Chinese, English, or mixed text (AI-powered or fallback).
- **Tone Distribution**: Analyze character tone counts via AI or local logic, display percentages.
- **Pronunciation Tips**: Receive 5 concise, targeted pronunciation tips from GPT-4o-mini.
- **Audio Recording**: Record your voice (up to 60s), visualize duration, and playback.
- **Pronunciation Evaluation**: View spectrogram, score, feedback, and AI-generated improvement suggestions.
- **Settings**: Configure API keys (OpenRouter, iFly, FaceFusion) and upload a profile avatar.

## Prerequisites

- **WeChat Developer Tools**: for previewing & debugging the Mini Program.
- **Node.js & npm**: to install and deploy any cloud functions.
- **OpenRouter API Key**: required for AI-powered Pinyin, IPA, tone distribution, and tips.

## Setup

1. **Clone the repo**
   ```bash
   git clone <repository-url>
   cd <repo-root>
   ```

2. **Deploy cloud functions** (if using `processInput` or other serverless code):
   ```bash
   cd cloudfunctions/processInput
   npm install
   # Use WeChat CLI or Developer Tools to deploy this function
   ```

3. **Open the Mini Program**
   - Launch WeChat Developer Tools.
   - Open the `miniprogram/` directory as your project.

4. **Enter API Keys**
   - Run the app, navigate to **Settings**.
   - Paste your **OpenRouter** API key under "Large Language Model API Key."
   - (Optional) Enter iFly and FaceFusion keys for evaluation & lip simulation.

5. **Preview & Test**
   - Use the **Home** tab to sign in and track progress.
   - Go to **Learning**: enter text → view AI-powered Pinyin, IPA, tone stats, and tips.
   - Tap "Start Practice" to record your voice, then see evaluation details.

## Usage Guide

### Home
- **Sign In Today**: Tap to record your learning day.
- **Calendar**: Swipe months to track past activity.
- **Start Learning**: Jump to the AI pronunciation feature.

### Learning
1. **Enter Text**: Chinese, English, or mixed.
2. **Get Pronunciation**: AI calls deliver Pinyin, IPA, and tone distribution.
3. **Tips**: Five actionable tips for improving your pronunciation.
4. **Practice**: Record audio for evaluation.

### Evaluation
- **Playback**: Listen to your recording.
- **Spectrogram**: Visualize frequency over time.
- **Score & Feedback**: View quantitative score and AI suggestions.
- **Re-record**: Try again to improve your score.

### Settings
- **API Keys**: Manage your OpenRouter, iFly, and FaceFusion keys.
- **Avatar**: Upload or change your profile picture for lip simulation.

## Folder Structure

```
<repo-root>/
├── miniprogram/             # Main Mini Program code
│   ├── pages/               # Pages: index, learning, evaluation, settings
│   ├── utils/               # Core logic: pronunciation, pinyin, recording, loader
│   ├── components/          # Reusable UI: navigation-bar
│   ├── static/images/       # Icons & demos
│   ├── app.json             # Page & tabBar configuration
│   ├── app.js               # Cloud init & global data
│   └── app.wxss             # Global styles
├── cloudfunctions/          # WeChat cloud functions (e.g. processInput)
├── README.md                # This documentation
└── uploadCloudFunction.sh   # Helper script for cloud function deployment
```

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

</details>

<details>
<summary>中文</summary>

# 声声慢

一款 AI 驱动的微信小程序，用于每日签到、发音练习与评测——支持拼音和 IPA 转换、声调分析，以及基于 OpenRouter GPT-4o-mini 的个性化提示。

## 功能列表

- **每日签到**：通过日历视图记录学习连续天数、总学习天数和本月进度。
- **拼音转换**：将任意文本转换为带声调符号的拼音（AI 生成或本地回退）。
- **国际音标**：生成中文、英文或混合文本的 IPA（AI 驱动或本地回退）。
- **声调分布**：通过 AI 或本地逻辑分析汉字声调分布并展示百分比。
- **发音提示**：从 GPT-4o-mini 获取 5 条简洁、针对性的发音建议。
- **音频录制**：录制您的语音（最长 60 秒），显示时长并播放。
- **发音评测**：查看声谱图、得分、反馈以及 AI 生成的改进建议。
- **设置**：配置 API 密钥（OpenRouter、iFly、FaceFusion）并上传个人头像。

## 环境准备

- **微信开发者工具**：预览和调试小程序。
- **Node.js & npm**：安装并部署云函数。
- **OpenRouter API Key**：用于 AI 驱动的拼音、IPA、声调分布和发音提示。

## 安装与运行

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd <repo-root>
   ```

2. **部署云函数**（如果使用 `processInput` 或其他无服务器代码）：
   ```bash
   cd cloudfunctions/processInput
   npm install
   # 在微信开发者工具或 CLI 中部署此函数
   ```

3. **打开小程序**
   - 启动微信开发者工具。
   - 选择 `miniprogram/` 目录作为项目。

4. **填写 API 密钥**
   - 运行小程序，进入 **设置** 页面。
   - 在"LLM API Key"一栏粘贴您的 **OpenRouter** API 密钥。
   - （可选）填写 iFly 和 FaceFusion 密钥以启用评测与口型模拟。

5. **预览与测试**
   - 在 **首页** 进行签到，查看学习进度。
   - 进入 **学习**：输入文本 → 获取 AI 驱动的拼音、IPA、声调分布及发音提示。
   - 点击 "开始练习" 录制语音，然后查看评测结果。

## 使用指南

### 首页
- **今日签到**：点击记录学习天数。
- **日历**：滑动月份查看历史记录。
- **开始学习**：跳转至 AI 发音功能。

### 学习
1. **输入文本**：支持中文、英文或混合。
2. **获取发音**：AI 调用返回拼音、IPA 和声调分布。
3. **发音提示**：查看 5 条可操作的发音建议。
4. **练习**：录制语音进行评测。

### 评测
- **播放录音**：听取录音回放。
- **声谱图**：可视化频谱。
- **得分与反馈**：查看评分及 AI 建议。
- **重新录制**：改进发音后再次录制。

### 设置
- **API 密钥**：管理 OpenRouter、iFly 和 FaceFusion 密钥。
- **头像**：上传或更换个人头像以进行口型模拟。

## 目录结构

```
<repo-root>/
├── miniprogram/             # 小程序主体代码
│   ├── pages/               # 页面：index, learning, evaluation, settings
│   ├── utils/               # 核心逻辑：发音、拼音、录音、库加载
│   ├── components/          # 可复用组件：navigation-bar
│   ├── static/images/       # 图标 & 演示
│   ├── app.json             # 页面 & 选项卡配置
│   ├── app.js               # 云环境初始化 & 全局数据
│   └── app.wxss             # 全局样式
├── cloudfunctions/          # 云函数（如 processInput）
├── README.md                # 本文档
└── uploadCloudFunction.sh   # 云函数部署脚本
```

## 许可证

本项目基于 Apache 2.0 许可证开放。详情请参见 [LICENSE](LICENSE)。

</details> 
