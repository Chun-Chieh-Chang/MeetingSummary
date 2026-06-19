# Project Requirements (Entity) — v2.0

This entity represents the current requirements and constraints for `MeetingSummary Pro`.

> Last updated: 2026-06-19 (Agnes AI migration)

## 1. Functional Scope

- **Speech-to-Text**: Real-time browser-local transcription via Web Speech API
- **AI Summarization**: Structured meeting summary via Agnes AI `agnes-2.0-flash`
- **Output Structure**: Executive Summary → Diarized Transcript → Topic Analysis → Action Items → Tone & Insights
- **History**: Persistent meeting records via `localStorage` (`meeting_history_v2`)
- **Export**: Markdown download, PDF print

## 2. Technical Stack

- **Framework**: Vite + React 19 (TypeScript)
- **AI Model**: Agnes AI `agnes-2.0-flash` via `/v1/chat/completions` (OpenAI-compatible)
- **STT**: Web Speech API (`SpeechRecognition`) — browser-local, free
- **State Management**: React Hooks (`useState`, `useRef`, `useEffect`)
- **Build**: Vite v8 + TypeScript v6
- **Deployment**: GitHub Pages via GitHub Actions

## 3. Security & Privacy

- **API Key**: Injected at CI build time via GitHub Secrets (`AGNES_API_KEY`)
- **UI**: Built-in key badge shown when key is present; override input available
- **Privacy**: Audio processed locally in browser; only text transcript sent to Agnes AI
- **Source Control**: `.env` gitignored; key never appears in source code

## 4. Design Aesthetics

- **Theme**: Light mode — Sea Salt Blue palette
- **Style**: Glassmorphism (backdrop blur + thin borders)
- **Typography**: Outfit/Inter font stacks
- **Responsive**: Mobile-first, min 375px

## Related Concepts

- [Meeting Summarization](../concepts/meeting-summarization.md)
- [Speaker Diarization](../concepts/speaker-diarization.md)
- [Audio Engine](./audio-engine.md)
