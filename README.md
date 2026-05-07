# 🎙️ MeetingSummary Pro

> A premium, agent-driven meeting summarization and transcription system with PWA support.

Built with **Antigravity** principles: Surgical modifications, Robustness testing, and Digital Art Director UI standards.

## 📱 Features

- **Dual Input Modes**: Microphone recording or file upload (MP3, WAV, WebM, MP4, etc.)
- **AI-Powered Transcription**: Native audio processing via Google Gemini 1.5 Pro/Flash
- **Speaker Diarization**: Automatic speaker identification and labeling
- **Structured Summaries**: Executive summary, action items, and insights
- **PWA Support**: Install to home screen on mobile devices
- **History Management**: Local storage persistence for past meetings
- **Export Options**: Markdown download and PDF print

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API Key ([Get free key](https://aistudio.google.com/))

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Custom CSS with Glassmorphism design
- **Intelligence**: Google Gemini 1.5 Pro/Flash (Native Audio Support)
- **PWA**: vite-plugin-pwa

## 📂 Project Structure

```
MeetingSummary/
├── .kiro/          # Kiro AI assistant configuration
├── dist/           # Build output (ignored in git)
├── public/         # Static assets (icons, favicon)
├── scripts/        # Build scripts (PWA icon generation)
├── src/            # Application source code
│   ├── assets/     # Images and icons
│   ├── App.css     # Main styles
│   ├── App.tsx     # Main application component
│   └── main.tsx    # Entry point
├── wiki/           # Knowledge Base (Entities & Concepts)
├── raw/            # Source transcripts and meeting notes
├── .env.example    # Environment variables template
├── DEV_LOG.md      # Development history (PDCA)
└── SKILL.md        # Development workflow guide
```

## 🧠 Project Brain (Wiki)
This project uses the [LLM Wiki Pattern](wiki/concepts/llm-wiki.md) to maintain a compounding knowledge base.
- [Wiki Index](wiki/index.md)
- [Governance & Schema](wiki/SCHEMA.md)

## 📊 API Providers

| Provider | Free Tier | Features |
|----------|-----------|----------|
| Google Gemini | Generous | Native audio support, diarization |
| AssemblyAI | $50 credit | Best-in-class diarization |
| Deepgram | $200 credit | Fast transcription |

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 👤 Author

**Chun-Chieh Chang**

---

*Created by Antigravity - Senior Full-stack Architect & Digital Art Director.*
