# Speaker Diarization Concept

Speaker Diarization is the process of partitioning an audio stream into homogeneous segments according to the speaker identity ("who spoke when").

## 1. Challenges in Web Environment
- **Local Limitations**: Browsers do not have built-in diarization engines.
- **Background Noise**: Meetings in open spaces make speaker separation difficult.
- **Overlapping Speech**: Distinguishing multiple speakers talking at once requires advanced neural networks.

## 2. Implementation Strategies
### Strategy A: Cloud-Based (Recommended)
Use APIs like **AssemblyAI** or **OpenAI Whisper** (with custom diarization pipelines like Pyannote).
- **Pros**: High accuracy, multi-language support, handles noise well.
- **Cons**: Latency, API costs, privacy concerns.

### Strategy B: Local Processing
Use `WebAssembly` (WASM) versions of Whisper or other light models.
- **Pros**: Privacy, zero latency once loaded.
- **Cons**: High CPU/RAM usage, lower accuracy for diarization.

## 3. MeetingSummary Approach
The project uses the **MediaRecorder API** to capture raw audio blobs, which are then queued for cloud processing to ensure the highest quality summary and accurate speaker tracking.
