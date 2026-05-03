import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';


const App: React.FC = () => {
  const [provider, setProvider] = useState<'gemini' | 'assemblyai' | 'deepgram'>('gemini');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>(`
# 📘 軟體運作說明 (User Guide)

歡迎使用 **MeetingSummary Pro**！本工具利用 Google Gemini 1.5 的多模態能力，直接分析您的會議音訊並生成總結。

### 🛠️ 操作步驟 (Step-by-Step)
1. **填入金鑰**：在上方輸入框填入您的 [Gemini API Key](https://aistudio.google.com/)。
2. **開始會議**：點擊 **Start Meeting**，系統會開始錄製您電腦麥克風的聲音。
3. **錄音監控**：您可以透過中間的計時器與動態指示器確認錄音狀態。
4. **結束並總結**：點擊 **Stop Recording**，系統會將音訊傳送至 Gemini。
5. **檢視分析**：
   - **角色辨識**：Gemini 會自動辨識不同發言者 (Speaker 1, 2...)。
   - **智慧總結**：自動提煉決策點與待辦事項。

---
*提示：建議在安靜環境下錄音，以獲得最佳的角色辨識效果。*
  `);
  const [summary, setSummary] = useState<string>('✨ 系統已就緒，請填入 API Key 並開始會議。');
  const [duration, setDuration] = useState(0);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [assemblyKey, setAssemblyKey] = useState(import.meta.env.VITE_ASSEMBLYAI_API_KEY || '');
  const [deepgramKey, setDeepgramKey] = useState(import.meta.env.VITE_DEEPGRAM_API_KEY || '');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processAudio(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(''); // 清除運作說明，準備接收新內容
      setSummary('正在錄音中...');
      setDuration(0);
      
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to record meetings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };


  const processAudio = async (blob: Blob) => {
    const currentKey = provider === 'gemini' ? apiKey : (provider === 'assemblyai' ? assemblyKey : deepgramKey);
    
    if (!currentKey) {
      alert(`Please provide an API Key for ${provider}.`);
      return;
    }

    setIsProcessing(true);
    setSummary(`${provider.toUpperCase()} is analyzing your meeting...`);
    
    try {
      if (provider === 'gemini') {
        await processWithGemini(blob, currentKey);
      } else {
        // Placeholder for future implementation of other providers
        setSummary(`${provider.toUpperCase()} integration is reserved. Currently implementing...`);
        setTimeout(() => setIsProcessing(false), 2000);
      }
    } catch (err) {
      console.error(`${provider.toUpperCase()} Error:`, err);
      setSummary("Error processing audio. Please check your credentials.");
      setIsProcessing(false);
    }
  };

  const processWithGemini = async (blob: Blob, key: string) => {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const prompt = `
        You are a professional meeting assistant. Listen to the provided audio.
        1. Provide a verbatim transcript but clearly label the different speakers (e.g., Speaker 1, Speaker 2).
        2. Provide a concise summary of the meeting.
        3. List the Key Decisions and Action Items (with owners if mentioned).
        Output the result in clear Markdown format.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: blob.type
          }
        }
      ]);

      const responseText = result.response.text();
      setTranscript(responseText);
      setSummary("Analysis Complete (Gemini).");
      setIsProcessing(false);
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎙️ MeetingSummary Pro</h1>
        <p>Premium Agent-Driven Transcription & Synthesis</p>
      </header>

      <main className="dashboard">
        <section className="controls glass-card">
          <div className="api-config">
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value as any)}
              className="provider-select"
            >
              <option value="gemini">Google Gemini</option>
              <option value="assemblyai">AssemblyAI</option>
              <option value="deepgram">Deepgram</option>
            </select>

            {provider === 'gemini' && (
              <input 
                type="password" 
                placeholder="Enter Gemini API Key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                className="api-input"
              />
            )}
            {provider === 'assemblyai' && (
              <input 
                type="password" 
                placeholder="Enter AssemblyAI API Key" 
                value={assemblyKey} 
                onChange={(e) => setAssemblyKey(e.target.value)}
                className="api-input"
              />
            )}
            {provider === 'deepgram' && (
              <input 
                type="password" 
                placeholder="Enter Deepgram API Key" 
                value={deepgramKey} 
                onChange={(e) => setDeepgramKey(e.target.value)}
                className="api-input"
              />
            )}
          </div>

          <div className="recording-status">
            {isRecording && <span className="recording-indicator"></span>}
            <span className="timer">{formatTime(duration)}</span>
          </div>
          
          <button 
            className={`record-btn ${isRecording ? 'active' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? 'Stop Recording' : isProcessing ? 'Processing...' : 'Start Meeting'}
          </button>
        </section>

        <div className="content-grid">
          <section className="transcript-panel glass-card">
            <h3>Transcript & Analysis</h3>
            <div className="scroll-area">
              {isProcessing && <div className="loading-spinner">Processing Audio...</div>}
              {!transcript && !isProcessing && <p className="empty-state">No analysis yet...</p>}
              <div className="summary-content markdown">
                {transcript}
              </div>
            </div>
          </section>

          <section className="summary-panel glass-card">
            <h3>Status</h3>
            <div className="summary-content">
              {summary || <p className="empty-state">System ready.</p>}
            </div>
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2026 MeetingSummary - Powered by Antigravity AI</p>
      </footer>
    </div>
  );
};

export default App;
