import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';

// 2026 May Official Standards
interface GeminiModel {
  id: string;
  name: string;
  description: string;
  rpm: number;
  rpd: number;
  tpm: number;
  contextWindow: string;
  status: 'stable' | 'preview';
  isAudioSupported: boolean;
}

const GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    description: '2026 旗艦級輕量化模型，具備極速處理與高配額穩定性',
    rpm: 15,
    rpd: 1500,
    tpm: 1000000,
    contextWindow: '1M tokens',
    status: 'stable',
    isAudioSupported: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: '標準版穩定模型，多模態理解能力極強，適合一般會議',
    rpm: 10,
    rpd: 1500,
    tpm: 1000000,
    contextWindow: '1M tokens',
    status: 'stable',
    isAudioSupported: true
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: '高階邏輯推理模型，適合處理超大型系列課程或研討會',
    rpm: 2,
    rpd: 50,
    tpm: 32000,
    contextWindow: '1M tokens',
    status: 'stable',
    isAudioSupported: true
  }
];

interface MeetingRecord {
  id: string;
  date: string;
  duration: number;
  provider: string;
  modelId: string;
  transcript: string;
  summary: string;
}

/**
 * Helper to handle transient Gemini API errors (503, 429) with exponential backoff.
 */
async function generateContentWithRetry(
  model: any,
  content: any,
  onRetry: (attempt: number, max: number) => void,
  maxRetries: number = 2
): Promise<any> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(content);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      const errorMsg = (err?.message || "").toLowerCase();
      
      // Retry on 503 (Service Unavailable) or 429 (Rate Limit)
      const isTransient = status === 503 || status === 429 || 
                          errorMsg.includes('503') || errorMsg.includes('429') || 
                          errorMsg.includes('service unavailable') || errorMsg.includes('too many requests');
      
      if (isTransient && attempt < maxRetries) {
        onRetry(attempt, maxRetries);
        // Exponential backoff: 2s, 4s, 8s... + jitter
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Helper to clean and sanitize API keys.
 */
const cleanApiKey = (key: string): string => key.trim().replace(/[^\x00-\x7F]/g, "");

const App: React.FC = () => {
  const [provider, setProvider] = useState<'gemini' | 'assemblyai' | 'deepgram'>('gemini');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3.1-flash-lite');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>(`
# 📘 快速開始指南 (Context-Aware Guide)

本系統支援**自動情境偵測**與**跨檔案整合分析**。

1. **上傳/錄音**：選擇左側音訊來源。
2. **分析**：AI 會自動判定場合（會議/課程/討論）並產出最適格式。
3. **歷史紀錄**：分析完成後，結果會自動同步至左下角的「歷史紀錄」清單中，方便隨時點閱。

---
*提示：偵測到多個檔案時，系統會自動啟動 Master Synthesis 模式。*
  `);
  const [summary, setSummary] = useState<string>('✨ 系統已就緒');
  const [duration, setDuration] = useState(0);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [assemblyKey] = useState(import.meta.env.VITE_ASSEMBLYAI_API_KEY || '');
  const [deepgramKey] = useState(import.meta.env.VITE_DEEPGRAM_API_KEY || '');
  const [audioSource, setAudioSource] = useState<'record' | 'upload'>('record');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [processedFileIndices, setProcessedFileIndices] = useState<Set<number>>(new Set());
  const [processMode, setProcessMode] = useState<'standard' | 'fine'>('standard');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<MeetingRecord[]>(() => {
    try {
      const savedHistory = localStorage.getItem('meeting_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  });

  const saveToHistory = (newTranscript: string, newSummary: string) => {
    const newRecord: MeetingRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('zh-TW'),
      duration,
      provider,
      modelId: geminiModel,
      transcript: newTranscript,
      summary: newSummary
    };
    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('meeting_history', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('meeting_history', JSON.stringify(updatedHistory));
  };

  const loadHistoryItem = (item: MeetingRecord) => {
    setTranscript(item.transcript);
    setSummary(item.summary);
    setDuration(item.duration);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files)
      .filter(f => f.size <= 100 * 1024 * 1024)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    setSelectedFiles(validFiles);
    setProcessedFileIndices(new Set());
    setCurrentFileIndex(null);
    setAudioSource('upload');
    setTranscript(`已選擇 ${validFiles.length} 個檔案（已按名稱排序），準備進行智慧化整合分析...`);
  };

  const fileToBase64 = (fileOrBlob: Blob | File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => event.data.size > 0 && audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => processAudio(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
      setSummary('正在錄製中...');
      setDuration(0);
      timerRef.current = window.setInterval(() => setDuration(prev => prev + 1), 1000);
    } catch (err) {
      alert("錄音啟動失敗");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const processAudio = async (blob: Blob) => {
    const rawKey = provider === 'gemini' ? apiKey : (provider === 'assemblyai' ? assemblyKey : deepgramKey);
    const currentKey = cleanApiKey(rawKey);
    if (!currentKey) return alert(`請提供 API Key`);
    setIsProcessing(true);
    try {
      if (provider === 'gemini') await processWithGemini(blob, currentKey);
    } catch (err) {
      setSummary("分析失敗");
      setIsProcessing(false);
    }
  };

  const processAllFiles = async () => {
    const rawKey = provider === 'gemini' ? apiKey : (provider === 'assemblyai' ? assemblyKey : deepgramKey);
    const currentKey = cleanApiKey(rawKey);
    if (!currentKey) return alert(`請提供 API Key`);

    let accumulatedTranscript = `📦 已啟動批次整合模式 (共 ${selectedFiles.length} 個片段)\n\n`;
    setTranscript(accumulatedTranscript);
    setProcessedFileIndices(new Set());
    setCurrentFileIndex(null);
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setIsProcessing(true);
      setCurrentFileIndex(i);
      setSummary(`解析中 (${i + 1}/${selectedFiles.length}): ${file.name}`);
      try {
        const responseText = await processWithFile(file, currentKey);
        accumulatedTranscript += `--- \n### 片段 ${i + 1}: ${file.name}\n${responseText}\n\n`;
        setTranscript(accumulatedTranscript);
        setProcessedFileIndices(prev => new Set(prev).add(i));
      } catch (error: any) {
        const errorMsg = (error?.message || "").toLowerCase();
        const is503 = errorMsg.includes('503') || error?.status === 503 || errorMsg.includes('service unavailable');
        accumulatedTranscript += `❌ 檔案 ${file.name} 解析失敗 ${is503 ? '(伺服器過載/503)' : ''}。\n`;
        setTranscript(accumulatedTranscript);
        if (is503) {
          setSummary("⚠️ 伺服器目前壓力較大，建議切換至 Gemini 2.5 Flash 試試看。");
        }
      }
    }

    setCurrentFileIndex(null);

    if (selectedFiles.length > 1 && provider === 'gemini') {
      setSummary("🔄 偵測到多段內容，正在進行 Master Synthesis...");
      try {
        const finalSynthesis = await synthesizeResults(accumulatedTranscript, currentKey);
        setTranscript(finalSynthesis);
        saveToHistory(finalSynthesis, `Integrated Session (${selectedFiles.length} files)`);
        setSummary("✅ 整合分析完成！");
      } catch (error) {
        setSummary("⚠️ 整合失敗");
      }
    } else {
      setSummary("解析完成。");
      saveToHistory(accumulatedTranscript, "Single File Analysis");
    }
    setIsProcessing(false);
  };

  /**
   * Unified interface for calling Gemini models with fallback and retry logic.
   */
  const callGemini = async (
    key: string,
    prompt: any,
    audioData?: { data: string, mimeType: string },
    statusPrefix: string = ""
  ): Promise<string> => {
    const modelsToTry = [geminiModel, ...GEMINI_MODELS.map(m => m.id).filter(id => id !== geminiModel)];
    let lastError: any = null;

    for (const modelId of modelsToTry) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: modelId, 
          generationConfig: { temperature: 0.2, topP: 0.8, topK: 40, maxOutputTokens: 8192 } 
        });
        
        const content = audioData 
          ? [prompt, { inlineData: audioData }]
          : prompt;

        const result = await generateContentWithRetry(
          model, 
          content,
          (attempt, max) => setSummary(`🔄 ${statusPrefix}${modelId} 忙碌，重試 (${attempt}/${max})...`)
        );
        return result.response.text();
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.response?.status;
        const errorMsg = (err?.message || "").toLowerCase();
        const isTransient = status === 503 || status === 429 || errorMsg.includes('503') || errorMsg.includes('429') || errorMsg.includes('service unavailable');
        
        if (isTransient && modelId !== modelsToTry[modelsToTry.length - 1]) {
          setSummary(`⚠️ ${statusPrefix}${modelId} 過載，嘗試備援模型...`);
          continue;
        }
        break;
      }
    }
    throw lastError || new Error("所有可用模型均不可用");
  };

  const processWithGemini = async (blob: Blob, key: string) => {
    const base64Data = await fileToBase64(blob);
    
    const standardPrompt = `## 任務：專業會議分析 (Multi-modal Analysis 2026)
你是一個頂尖的會議記錄與情境分析專家。請針對音訊內容，產生一份結構嚴謹的報告。

### 🛑 輸出格式要求 (必須嚴格遵守三大區塊)：

1. **逐字稿 (Diarized Transcript)**: 
   - 使用 [mm:ss] 格式標記時間。
   - 清楚區分講者（如：講者A、講者B）。
   - 內容需完整且精確。

2. **詳細摘要 (Detailed Summary)**:
   - 條列式整理核心議題。
   - 捕捉會議中的邏輯轉折與重要資訊。

3. **總結與行動方案 (Conclusion & Action Items)**:
   - 提煉最終結論。
   - 明確列出後續待辦事項。

### ⚠️ 重要指令：
- **絕對不可遺漏**「詳細摘要」與「總結」區塊。
- 若對話過長，請適度精簡逐字稿，以確保摘要與總結有足夠空間生成。
- 語系：請使用繁體中文 (zh-TW)。`;

    const finePrompt = `## 任務：高精度商務會議分析與深度智能洞察 (Fine-Grained Intelligence 2026)
你是一個具備跨國企業與學術背景的頂尖速記官與分析專家。請產出具備「極高完整度」與「策略深度」的報告。

### 🛑 輸出格式要求：

1. **精細逐字稿 (High-Fidelity Transcript)**: 
   - [mm:ss] 精確時間戳記。
   - 標註講者身分並捕捉語氣與關鍵措辭。
   - 內容需達到 99% 的重現度，不可過度概括。

2. **深度多維摘要 (Multi-dimensional Intelligence Summary)**:
   - **核心議論**: 深度拆解每個議題的背景、論點與共識。
   - **隱性洞察**: 分析講者之間的立場差異、關鍵決策點或潛在風險。
   - **數據/細節**: 提取所有提到的具體數字、日期、地點或專有名詞。

3. **高價值結論與執行計畫 (Strategic Conclusion & Action Plan)**:
   - 提煉具備執行力的核心結論。
   - 以優先級 (P0/P1) 列出行動方案，並標註負責人（若提及）。

### ⚠️ 重要指令：
- **精細度極大化**：這是精細模式，請確保逐字稿的細節完整，且總結具備深度分析價值。
- 語系：請使用繁體中文 (zh-TW)。`;

    const prompt = processMode === 'standard' ? standardPrompt : finePrompt;

    try {
      const text = await callGemini(key, prompt, { data: base64Data, mimeType: blob.type }, "錄音分析: ");
      setTranscript(text);
      saveToHistory(text, `錄音分析 (${geminiModel})`);
      setSummary(`分析完成`);
    } catch (err: any) {
      setSummary(`分析失敗：${err?.message || "未知錯誤"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithFile = async (file: File, key: string): Promise<string> => {
    const base64Data = await fileToBase64(file);
    
    const standardPrompt = `## 任務：檔案情境識別與專業摘要提取
檔案名稱：「${file.name}」

### 🛑 輸出格式要求：
1. **逐字稿 (Diarized Transcript)**: 包含 [mm:ss] 時間戳記。
2. **詳細摘要 (Detailed Summary)**: 捕捉關鍵對話點。
3. **總結 (Conclusion)**: 提煉核心價值。

### ⚠️ 指令：
- **嚴禁遺漏**「詳細摘要」與「總結」。
- 語系：繁體中文 (zh-TW)。`;

    const finePrompt = `## 任務：高精度檔案分析與深度智能洞察
檔案名稱：「${file.name}」

### 🛑 輸出格式要求：
1. **精細逐字稿 (High-Fidelity Transcript)**: 完整重現對話細節，標註講者與時間 [mm:ss]。
2. **多維度深度摘要 (Multi-dimensional Summary)**: 包含背景分析、論點拆解、細節提取（數據/名詞）。
3. **高價值結論 (Strategic Conclusion)**: 提煉核心洞察與策略建議。

### ⚠️ 指令：
- **極大化細節**：確保內容的廣度與深度。
- 語系：繁體中文 (zh-TW)。`;

    const prompt = processMode === 'standard' ? standardPrompt : finePrompt;

    return callGemini(key, prompt, { data: base64Data, mimeType: file.type }, `檔案 ${file.name}: `);
  };

  const synthesizeResults = async (allTranscripts: string, key: string): Promise<string> => {
    const prompt = `## 任務：全自動情境感知整合分析 (Master Synthesis 2026)
請根據以下多個片段，產生一份完整的整合報告。報告必須包含：
1. **整合逐字稿**: 合併各片段內容，並保留/校對時間標記。
2. **深度綜合摘要**: 跨片段的邏輯串接。
3. **最終結論**。

語系：繁體中文 (zh-TW)。

片段內容如下：
${allTranscripts}`;

    return callGemini(key, prompt, undefined, "整合分析: ");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportToMarkdown = () => {
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Summary_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <aside className="sidebar glass-card">
        <header className="app-header">
          <h1>🎙️ MeetingSummary Pro</h1>
          <p>Premium Adaptive Engine</p>
        </header>

        <div className="api-config">
          <select value={provider} onChange={(e) => setProvider(e.target.value as any)} className="provider-select">
            <option value="gemini">Google Gemini</option>
          </select>
          <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} className="api-input">
            {GEMINI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <div className="process-mode-container">
            <div className="mode-label">分析模式</div>
            <div className="mode-toggle">
              <button 
                className={`mode-btn ${processMode === 'standard' ? 'active' : ''}`}
                onClick={() => setProcessMode('standard')}
              >
                標準
              </button>
              <button 
                className={`mode-btn ${processMode === 'fine' ? 'active' : ''}`}
                onClick={() => setProcessMode('fine')}
              >
                精細 ✨
              </button>
            </div>
            <p className="mode-description">
              {processMode === 'standard' 
                ? '適合一般會議，平衡摘要速度與內容。' 
                : '高精度逐字稿與深度洞察，適合重要會議。'}
            </p>
          </div>

          <input type="password" placeholder="Enter API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="api-input" />
          <div className="audio-source-selector">
            <button type="button" className={`source-btn ${audioSource === 'record' ? 'active' : ''}`} onClick={() => setAudioSource('record')}>🎤 錄製</button>
            <button type="button" className={`source-btn ${audioSource === 'upload' ? 'active' : ''}`} onClick={() => fileInputRef.current?.click()}>📂 上傳 ({selectedFiles.length})</button>
            <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>

          {selectedFiles.length > 0 && audioSource === 'upload' && (
            <div className="selected-files-list">
              <h4>📁 待處理檔案 ({selectedFiles.length})</h4>
              <ul>
                {selectedFiles.map((f, i) => (
                  <li key={i} title={f.name} className={`file-item ${currentFileIndex === i ? 'processing' : ''} ${processedFileIndices.has(i) ? 'done' : ''}`}>
                    <span className="file-name-text">{f.name}</span>
                    {currentFileIndex === i && <span className="status-icon loading">⏳</span>}
                    {processedFileIndices.has(i) && <span className="status-icon">✅</span>}
                    {currentFileIndex === i && <div className="file-progress-track"><div className="file-progress-fill"></div></div>}
                  </li>
                ))}
              </ul>
              <button className="clear-files-btn" onClick={() => { setSelectedFiles([]); setProcessedFileIndices(new Set()); setCurrentFileIndex(null); }}>清除全部</button>
            </div>
          )}
        </div>

        <div className="record-controls">
          <div className="recording-status">
            {isRecording && <span className="recording-indicator"></span>}
            <span className="timer">{formatTime(duration)}</span>
          </div>
          <button className={`record-btn ${isRecording ? 'active' : ''}`} onClick={isRecording ? stopRecording : (audioSource === 'record' ? startRecording : processAllFiles)} disabled={isProcessing}>
            {isRecording ? 'Stop Recording' : isProcessing ? 'Processing...' : audioSource === 'record' ? 'Start Recording' : 'Start Analysis'}
          </button>
          <div className="status-inline">{summary}</div>
        </div>

        <div className="history-section">
          <h3>🕒 History ({history.length})</h3>
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-item" onClick={() => loadHistoryItem(item)}>
                <div className="history-info">
                  <span className="history-date">{item.date}</span>
                  <button className="delete-btn" onClick={(e) => deleteHistoryItem(item.id, e)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section className="transcript-panel glass-card">
          <div className="panel-header">
            <h3>Adaptive Analysis Results</h3>
            <div className="export-actions">
              <button onClick={exportToMarkdown} className="icon-btn">📄 MD</button>
              <button onClick={() => window.print()} className="icon-btn">🖨️ PDF</button>
            </div>
          </div>
          <div className="scroll-area">
            <div className="summary-content markdown">{transcript}</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
