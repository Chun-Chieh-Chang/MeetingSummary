# Audio Engine

The Audio Engine is responsible for capturing, processing, and transmitting meeting audio.

## 🛠️ Implementation Details
- **API**: `MediaRecorder` Web API.
- **MIME Type**: `audio/webm`.
- **Transmission**: Base64 encoded blobs sent via JSON to Gemini 1.5.

## 🔄 Lifecycle
1.  **Request Permission**: `navigator.mediaDevices.getUserMedia({ audio: true })`.
2.  **Start Recording**: Buffering chunks in `audioChunksRef`.
3.  **Stop & Process**: Converting the final `Blob` to Base64 via `FileReader`.
4.  **Inference**: Sending to `GoogleGenerativeAI` SDK.

## ⚠️ Known Issues & Constraints
- **Browser Compatibility**: `MediaRecorder` support varies; WebM is the safest default.
- **Memory**: Large recordings (1h+) can consume significant RAM if kept as Base64 strings.
- **Latency**: Processing depends on internet speed and Gemini API response time.
