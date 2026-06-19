# Audio Engine

The Audio Engine is responsible for capturing speech input and converting it to text in the browser.

## Implementation Details (v2.0 — Agnes AI Architecture)

- **STT API**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Mode**: Continuous recognition with `interimResults: true` for real-time display
- **Languages**: zh-TW, zh-CN, en-US, ja-JP (user-selectable)
- **Output**: Final transcript text sent to Agnes AI for LLM summarization

## Lifecycle

1. **Start**: `recognition.start()` — browser requests microphone permission
2. **Stream**: `onresult` fires continuously; interim results shown in `[brackets]`
3. **Finalize**: Each `isFinal` segment appended to `finalTranscript` with `。`
4. **Stop & Analyze**: `recognition.stop()` → captured text sent to `callAgnesChat()`
5. **Auto-restart guard**: `onend` handler checks `isRecording` state to prevent infinite restart loops

## Architecture Change from v1.0

| v1.0 (Gemini) | v2.0 (Agnes AI) |
|:---|:---|
| `MediaRecorder` → audio blob | `SpeechRecognition` → text stream |
| Base64 encode → Gemini inline data | Plain text → Agnes `/v1/chat/completions` |
| `@google/generative-ai` SDK | Native `fetch` API |
| STT + LLM in one call | STT (browser, free) + LLM (Agnes, paid) |

## Known Constraints

- **Browser**: Chrome / Edge only (Firefox lacks `SpeechRecognition` support)
- **Environment**: Must be HTTPS or localhost (browser security requirement)
- **Accuracy**: Dependent on browser's speech engine; no custom model tuning available
- **Stale closure**: `liveTranscriptRef` used to safely capture final text in `stopRecording()`
