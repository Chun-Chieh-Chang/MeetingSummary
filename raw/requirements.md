# Project Requirements: MeetingSummary Pro — v2.0

## Goals
- High-fidelity meeting summarization using Agnes AI (agnes-2.0-flash).
- Real-time speech-to-text via browser Web Speech API (no upload required).
- Speaker diarization inferred by LLM from transcript context.
- Action item extraction with owners and deadlines.
- Premium light-mode UI with Sea Salt Blue palette and glassmorphism.

## Technical Constraints
- Frontend: React 19 + TypeScript + Vite 8.
- Backend: Serverless (direct API calls from browser).
- Storage: Local (browser localStorage for history, key `meeting_history_v2`).
- API: Agnes AI at `https://apihub.agnes-ai.com/v1` (OpenAI-compatible).

## UI/UX Standards
- Follow Digital Art Director guidelines (Color Master Palette).
- Responsive design for mobile (375px+) and desktop.
- 1.5x line height for readability.
- Built-in API key UX: badge display with optional override input.

## Privacy Policy
- Microphone audio is processed entirely in-browser (Web Speech API).
- Only the text transcript is transmitted to Agnes AI for summarization.
- No audio data leaves the device.
