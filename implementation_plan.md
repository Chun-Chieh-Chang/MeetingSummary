# Implementation Plan: MeetingSummary Web App

This plan outlines the steps to build a high-fidelity, agent-driven meeting summarization tool, strictly adhering to the "Digital Art Director" UI standards and "Senior Architect" logic.

## 1. Design System (Digital Art Director Phase)
- [ ] **Define Design Tokens**: Implement the "Color Master Palette" (Slate 900 base, Royal Blue accents).
- [ ] **Premium Layout**: Main Dashboard with:
    - **Recording Status**: Dynamic waveform animation.
    - **Live Transcription View**: Scrolling list of speaker bubbles.
    - **Summary Panel**: Glassmorphic card with AI insights.

## 2. Core Infrastructure (Architect Phase)
- [ ] **Framework Initialization**: `npx -y create-vite@latest ./ --template react-ts` (Done).
- [ ] **Audio Recording Module**: Use `MediaRecorder API` to capture `.webm` or `.wav` audio.
- [ ] **Google Gemini Integration**:
    - Use **Gemini 1.5 Pro/Flash** for native audio-to-summary processing.
    - Implement a multipart upload or Base64 encoding for the audio file.
    - *Advantage*: Gemini 1.5 supports long context windows (up to 1h+ audio) and can reason directly over the audio to perform diarization and summarization in one step.

## 3. Summarization & Intelligence
- [ ] **Prompt Engineering (Gemini-Specific)**: 
    - "Listen to the attached audio, transcribe it with speaker identification (Speaker 1, Speaker 2, etc.), and provide a structured summary including Key Decisions and Action Items."
    - Output: Markdown-formatted diarized transcript and summary.

## 4. Verification & Robustness
- [ ] **Simulation**: Create mock transcripts to test edge cases (very long meetings, multiple speakers).
- [ ] **PDCA Feedback Loop**: Update `DEV_LOG.md` after each component build to track RCA/CAPA.

## 5. Next Immediate Steps
1.  **Initialize Vite Project**: Set up the scaffold.
2.  **Global Styles**: Create `index.css` with the premium color palette.
3.  **Layout**: Build the main dashboard structure (Sidebar + Content Area).
