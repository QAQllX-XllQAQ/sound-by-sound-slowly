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

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details. 
