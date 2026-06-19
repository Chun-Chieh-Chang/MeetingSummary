import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// ─────────────────────────────────────────────
// Agnes AI Configuration
// ─────────────────────────────────────────────
const AGNES_BASE_URL = import.meta.env.VITE_AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const AGNES_CHAT_MODEL = import.meta.env.VITE_AGNES_CHAT_MODEL || 'agnes-2.0-flash';
// Built-in key injected at CI build time (not in source code)
const BUILTIN_KEY: string = import.meta.env.VITE_AGNES_API_KEY || '';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface MeetingRecord {
  id: string;
  date: string;
  duration: number;
  transcript: string;
  summary: string;
}

// Web Speech API is accessed via window at runtime; typed as any to avoid lib.dom coverage gaps.

// ─────────────────────────────────────────────
// Agnes AI Chat API caller
// ─────────────────────────────────────────────
async function callAgnesChat(apiKey: string, userMessage: string): Promise<string> {
  const response = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AGNES_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            '你是一位專業的行政助理與戰略分析師。使用者會提供一份會議逐字稿，請依照指定的 Markdown 格式輸出分析報告，使用繁體中文 (zh-TW)，保持專業、簡潔的語氣。',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Agnes API Error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Agnes API returned empty content.');
  return content;
}

// ─────────────────────────────────────────────
// Summary prompt builder
// ─────────────────────────────────────────────
function buildSummaryPrompt(rawTranscript: string): string {
  return `以下是一份會議錄音的逐字稿（由語音辨識系統自動產生），請依照以下 Markdown 格式進行分析整理：

---
## 原始逐字稿
${rawTranscript}
---

請依照以下結構輸出報告：

### 1. 執行摘要 (Executive Summary)
- 用 3-5 句話概括會議的核心目的與最終結論。

### 2. 角色標註逐字稿 (Diarized Transcript)
- 標註發言者（例如：發言者 1, 發言者 2）。
- 如果能從對話中得知姓名，請直接使用姓名。
- 紀錄關鍵對話內容，省略贅字，保持語意流暢。

### 3. 議題深度分析 (Topic Analysis)
- 條列會議中討論的所有主要議題。
- 簡述各議題的討論進度或不同觀點。

### 4. 決策紀錄與待辦事項 (Decisions & Action Items)
| 類型 | 內容描述 | 負責人 | 期限/備註 |
| :--- | :--- | :--- | :--- |
| [決策/待辦] | 具體描述 | 若提及請標註 | 若提及請標註 |

### 5. 會議氛圍與建議 (Tone & Insights)
- 簡述會議氛圍（如：積極、嚴肅、分歧）。
- 提供 1-2 個後續跟進的專業建議。

---
請確保排版優雅，適合在高階主管會議後直接閱讀。`;
}

// ─────────────────────────────────────────────
// App Component
// ─────────────────────────────────────────────
const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<MeetingRecord[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [status, setStatus] = useState<string>(
    BUILTIN_KEY
      ? '✅ 內建 API Key 已就緒，選擇語言後即可開始會議。'
      : '✨ 系統已就緒，請填入 Agnes API Key 並開始會議。'
  );
  const [duration, setDuration] = useState(0);
  // apiKey: uses built-in key by default; user can override
  const [apiKey] = useState(BUILTIN_KEY);
  const [showKeyOverride, setShowKeyOverride] = useState(false);
  const [overrideKey, setOverrideKey] = useState('');
  const [speechLang, setSpeechLang] = useState('zh-TW');

  // Effective key: override takes priority over built-in
  const effectiveKey = overrideKey.trim() || apiKey;

  // Refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const liveTranscriptRef = useRef<string>('');

  // ── Load history on mount ──────────────────
  useEffect(() => {
    const saved = localStorage.getItem('meeting_history_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // ── Helpers ────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveToHistory = (transcript: string, summary: string) => {
    const newRecord: MeetingRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('zh-TW'),
      duration,
      transcript,
      summary,
    };
    const updated = [newRecord, ...history];
    setHistory(updated);
    localStorage.setItem('meeting_history_v2', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('meeting_history_v2', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: MeetingRecord) => {
    setLiveTranscript(item.transcript);
    setAnalysisResult(item.summary);
    setDuration(item.duration);
    setView('current');
  };

  const exportToMarkdown = () => {
    const content = analysisResult || liveTranscript;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Summary_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => window.print();

  // ── Speech Recognition (STT) ───────────────
  const startRecording = () => {
    if (!effectiveKey.trim()) {
      alert('❌ 請先填入 Agnes API Key。');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(
        '❌ 您的瀏覽器不支援 Web Speech API。\n請使用 Chrome 或 Edge 瀏覽器，並確保在 HTTPS 或 localhost 環境下運行。'
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const segment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += segment + '。';
        } else {
          interimTranscript += segment;
        }
      }
      const combined = finalTranscript + (interimTranscript ? `[${interimTranscript}]` : '');
      liveTranscriptRef.current = finalTranscript;
      setLiveTranscript(combined);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed') {
        alert('❌ 麥克風權限被拒絕。請點擊網址列左側的鎖頭圖示，選擇「允許使用麥克風」。');
      } else if (event.error === 'no-speech') {
        // Silently ignore no-speech in continuous mode
      } else {
        alert(`❌ 語音辨識錯誤: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in recording state (handles browser auto-stops)
      if (recognitionRef.current && isRecording) {
        try { recognition.start(); } catch (_) { /* ignore */ }
      }
    };

    recognition.start();
    setIsRecording(true);
    setLiveTranscript('');
    setAnalysisResult('');
    liveTranscriptRef.current = '';
    setStatus('🔴 錄音中... 請開始說話，語音將即時轉換為文字。');
    setDuration(0);

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const capturedTranscript = liveTranscriptRef.current.trim();

    if (!capturedTranscript) {
      setStatus('⚠️ 未偵測到任何語音內容，請重試。');
      return;
    }

    // Clean the live display to show only final transcript
    setLiveTranscript(capturedTranscript);
    await processWithAgnes(capturedTranscript);
  };

  // ── LLM Analysis via Agnes ─────────────────
  const processWithAgnes = async (transcript: string) => {
    setIsProcessing(true);
    setStatus('🤖 Agnes AI 正在分析您的會議逐字稿...');

    try {
      const prompt = buildSummaryPrompt(transcript);
      const result = await callAgnesChat(effectiveKey, prompt);
      setAnalysisResult(result);
      setStatus(`✅ 分析完成 (agnes-2.0-flash)｜${new Date().toLocaleTimeString('zh-TW')}`);
      saveToHistory(transcript, result);
    } catch (err: any) {
      console.error('Agnes API Error:', err);
      setStatus(`❌ 分析失敗：${err.message}`);
      setAnalysisResult(`## ❌ 分析失敗\n\n${err.message}\n\n請確認您的 Agnes API Key 是否正確。`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── UI ─────────────────────────────────────
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎙️ MeetingSummary Pro</h1>
        <p>Powered by Agnes AI · agnes-2.0-flash</p>
      </header>

      <main className="dashboard">
        {/* ── Controls Panel ─────────────────── */}
        <section className="controls glass-card">
          <div className="view-toggle">
            <button
              className={view === 'current' ? 'active' : ''}
              onClick={() => setView('current')}
            >
              Current
            </button>
            <button
              className={view === 'history' ? 'active' : ''}
              onClick={() => setView('history')}
            >
              History ({history.length})
            </button>
          </div>

          {/* API Key & Language Config */}
          <div className="api-config-wrapper">
            <div className="api-config">
              {/* Key status area */}
              {BUILTIN_KEY && !showKeyOverride ? (
                <div className="key-badge-area">
                  <span className="key-badge">🔐 API Key 已內建</span>
                  <button
                    className="key-override-btn"
                    onClick={() => setShowKeyOverride(true)}
                    title="使用您自己的 API Key 覆蓋"
                  >
                    ✏️ 自訂
                  </button>
                </div>
              ) : (
                <div className="key-input-area">
                  <input
                    id="agnes-api-key"
                    type="password"
                    placeholder={BUILTIN_KEY ? '輸入自訂 Key（留空使用內建）' : 'Enter Agnes API Key (sk-...)'}
                    value={overrideKey}
                    onChange={(e) => setOverrideKey(e.target.value)}
                    className="api-input"
                    autoComplete="off"
                  />
                  {BUILTIN_KEY && (
                    <button
                      className="key-override-btn"
                      onClick={() => { setShowKeyOverride(false); setOverrideKey(''); }}
                      title="恢復使用內建 Key"
                    >
                      ↩ 復原
                    </button>
                  )}
                </div>
              )}
              <select
                id="speech-lang"
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="provider-select"
                title="語音辨識語言"
              >
                <option value="zh-TW">🇹🇼 繁體中文</option>
                <option value="zh-CN">🇨🇳 簡體中文</option>
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="ja-JP">🇯🇵 日本語</option>
              </select>
            </div>
            <p className="privacy-note">
              🔒 語音在瀏覽器本地辨識，僅文字摘要請求傳送至 Agnes AI
            </p>
          </div>

          {/* Recording Status */}
          <div className="recording-status">
            {isRecording && <span className="recording-indicator"></span>}
            <span className="timer">{formatTime(duration)}</span>
          </div>

          <button
            id="record-btn"
            className={`record-btn ${isRecording ? 'active' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording
              ? '⏹ Stop & Analyze'
              : isProcessing
              ? '⏳ Analyzing...'
              : '▶ Start Meeting'}
          </button>
        </section>

        {/* ── Content Grid ───────────────────── */}
        <div className="content-grid">
          {view === 'current' ? (
            <>
              {/* Live Transcript Panel */}
              <section className="transcript-panel glass-card">
                <div className="panel-header">
                  <h3>📝 Live Transcript</h3>
                  <div className="export-actions">
                    <button onClick={exportToMarkdown} title="Export Markdown" className="icon-btn">
                      📄 MD
                    </button>
                    <button onClick={exportToPDF} title="Print PDF" className="icon-btn">
                      🖨️ PDF
                    </button>
                  </div>
                </div>
                <div className="scroll-area">
                  {!liveTranscript && !isRecording && (
                    <div className="empty-state-guide">
                      <h4>📘 使用說明</h4>
                      <ol>
                        <li>確認 <strong>API Key</strong> 狀態（已內建或自行輸入）</li>
                        <li>選擇語音辨識語言</li>
                        <li>點擊 <strong>▶ Start Meeting</strong> 開始錄音</li>
                        <li>說話內容將即時轉換為逐字稿</li>
                        <li>點擊 <strong>⏹ Stop &amp; Analyze</strong> 生成 AI 摘要</li>
                      </ol>
                      <p className="tip">💡 需使用 Chrome / Edge 瀏覽器，並允許麥克風存取。</p>
                    </div>
                  )}
                  {liveTranscript && (
                    <div className={`summary-content ${isRecording ? 'live-mode' : 'markdown'}`}>
                      {liveTranscript}
                    </div>
                  )}
                </div>
              </section>

              {/* Analysis Result Panel */}
              <section className="summary-panel glass-card">
                <div className="panel-header">
                  <h3>🤖 Agnes Analysis</h3>
                </div>
                <div className="scroll-area">
                  <div className="summary-content">
                    {isProcessing && (
                      <div className="loading-spinner">
                        <span className="spinner-icon">⚙️</span> Agnes AI 正在生成會議摘要...
                      </div>
                    )}
                    {!isProcessing && !analysisResult && (
                      <p className="empty-state">{status}</p>
                    )}
                    {!isProcessing && analysisResult && (
                      <>
                        <p className="status-badge">{status}</p>
                        <div className="markdown">{analysisResult}</div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="history-panel glass-card full-width">
              <h3>📂 Meeting History</h3>
              <div className="scroll-area">
                {history.length === 0 ? (
                  <p className="empty-state">尚無儲存的會議紀錄。</p>
                ) : (
                  <div className="history-list">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="history-item"
                        onClick={() => loadHistoryItem(item)}
                      >
                        <div className="history-info">
                          <span className="history-date">{item.date}</span>
                          <span className="history-meta">
                            agnes-2.0-flash · {formatTime(item.duration)}
                          </span>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          title="刪除此紀錄"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2026 MeetingSummary Pro · Agnes AI (agnes-2.0-flash) · Web Speech API</p>
      </footer>
    </div>
  );
};

export default App;
