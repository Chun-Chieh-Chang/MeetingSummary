# Speaker Diarization Concept

Speaker Diarization is the process of identifying "who spoke when" in a conversation.

## Current Approach (v2.0 — Web Speech API)

MeetingSummary Pro uses a **two-stage pipeline**:

1. **Stage 1 — Real-time STT (Browser)**
   - `SpeechRecognition` API captures speech continuously
   - Each `isFinal` segment is timestamped and appended to the transcript
   - No speaker labeling at this stage (Web Speech API does not support diarization)

2. **Stage 2 — LLM Inference (Agnes AI)**
   - The complete transcript text is sent to `agnes-2.0-flash`
   - The model is prompted to infer speaker identity from conversational context
   - Output: structured "Diarized Transcript" section with labeled speakers (發言者 1, 2... or names if mentioned)

## Limitations

- **No true diarization**: Web Speech API provides a single-stream transcript without speaker boundaries
- **LLM inference only**: Agnes AI infers speakers from context clues (names mentioned, turn-taking patterns)
- **Accuracy**: Good for structured meetings with distinct speakers; less accurate for fast-paced overlapping speech

## Comparison: v1.0 vs v2.0

| Feature | v1.0 (Gemini) | v2.0 (Agnes AI) |
|:---|:---|:---|
| Audio capture | MediaRecorder (blob) | Web Speech API (text) |
| STT | Gemini inline audio multimodal | Browser-native (free) |
| Diarization | Gemini multimodal reasoning on audio | Agnes LLM inference on transcript |
| Privacy | Audio sent to Google | Audio stays in browser |

## Future Improvement Options

- **AssemblyAI**: Dedicated diarization API, high accuracy, paid
- **WebAssembly Whisper**: Local, private, but high CPU, no diarization
- **Agnes audio model**: If Agnes releases an audio/diarization endpoint in future

## Related

- [Audio Engine](../entities/audio-engine.md)
- [Meeting Summarization](./meeting-summarization.md)
