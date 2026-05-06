import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';

// Gemini Free Tier Models
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
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: '高智慧度模型，適合複雜分析與長上下文處理',
    rpm: 5,
    rpd: 100,
    tpm: 250000,
    contextWindow: '1M tokens',
    status: 'stable',
    isAudioSupported: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: '平衡型模型，快速回應與良好品質的折衷',
    rpm: 10,
    rpd: 250,
    tpm: 250000,
    contextWindow: '1M tokens',
    status: 'stable',
    isAudioSupported: true
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: '高效能模型，最高請求次數限制，適合大量使用',
    rpm: 15,
    rpd: 1000,
    tpm: 250000,
    contextWindow: '1M tokens',
    status: 'stable',
    isAudioSupported: true
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash (Preview)',
    description: '最新預覽版本，具備進階功能',
    rpm: -1,
    rpd: -1,
    tpm: -1,
    contextWindow: '1M tokens',
    status: 'preview',
    isAudioSupported: true
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite (Preview)',
    description: '最新預覽版本，高效能處理',
    rpm: -1,
    rpd: -1,
    tpm: -1,
    contextWindow: '1M tokens',
    status: 'preview',
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

const App: React.FC = () => {
  const [provider, setProvider] = useState<'gemini' | 'assemblyai' | 'deepgram'>('gemini');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'current' | 'history'>('current');
  const [history, setHistory] = useState<MeetingRecord[]>([]);
  const [transcript, setTranscript] = useState<string>(`
# 📘 軟體運作說明 (User Guide)

歡迎使用 **MeetingSummary Pro**！本工具利用 Google Gemini 的多模態能力，直接分析您的會議音訊並生成總結。

### 📱 PWA 安裝 (行動裝置)
本應用支援 PWA (Progressive Web App)，可在行動裝置上安裝為獨立應用：
- **iOS (Safari)**：點擊分享按鈕 → 「新增到主螢幕」
- **Android (Chrome)**：點擊選單 → 「安裝應用程式」或「新增到主螢幕」

### 🛠️ 操作步驟 (Step-by-Step)

#### 選項一：使用麥克風錄音
1. **選擇音訊來源**：點擊 **🎤 麥克風錄音** 按鈕
2. **填入金鑰**：在輸入框填入 Gemini API Key
3. **開始錄音**：點擊 **Start Recording**，系統會開始錄製您電腦麥克風的聲音
4. **結束錄音**：點擊 **Stop Recording** 停止錄音
5. **AI 分析**：系統會自動將音訊發送給 Gemini API 進行轉錄與總結

#### 選項二：上傳現有音訊檔案
1. **選擇音訊來源**：點擊 **📂 上傳檔案** 按鈕
2. **選擇檔案**：從您的裝置選擇音訊或影片檔案（支援 MP3, WAV, WebM, MP4 等格式）
3. **填入金鑰**：在輸入框填入 Gemini API Key
4. **開始分析**：點擊 **Start Analysis** 開始處理
5. **查看結果**：系統會自動將音訊發送給 Gemini API 進行轉錄與總結

### 🎁 免費資源獲取 (Free API Keys)
如果您還沒有 API Key，可以從以下官方渠道獲取免費額度：
- **[Google AI Studio (Gemini)](https://aistudio.google.com/)**: 目前提供最慷慨的免費層級，支援音訊直傳。
- **[AssemblyAI](https://www.assemblyai.com/)**: 提供 $50 試用金，具備頂級的角色辨識能力。
- **[Deepgram](https://www.deepgram.com/)**: 註冊即贈送 $200 額度，語音辨識速度極快。
- **[Groq Cloud](https://console.groq.com/)**: 適合極速文字總結（Llama 3 模型）。

### 📊 Gemini 免費層模型比較

| 模型 | RPM | RPD | TPM | Context | 音訊支援 | 狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Gemini 2.5 Pro | 5 | 100 | 250K | 1M | ✅ | 穩定版 |
| Gemini 2.5 Flash | 10 | 250 | 250K | 1M | ✅ | 穩定版 |
| Gemini 2.5 Flash-Lite | 15 | 1,000 | 250K | 1M | ✅ | 穩定版 |
| Gemini 3 Flash | 有限 | 有限 | 有限 | 1M | ✅ | 預覽版 |
| Gemini 3.1 Flash-Lite | 有限 | 有限 | 有限 | 1M | ✅ | 預覽版 |

**說明**：
- **RPM** = Requests Per Minute (每分鐘請求數)
- **RPD** = Requests Per Day (每日請求數)
- **TPM** = Tokens Per Minute (每分鐘 token 數)
- **Context** = 上下文視窗大小

---
*提示：建議在安靜環境下錄音，以獲得最佳的角色辨識效果。*
  `);
  const [summary, setSummary] = useState<string>('✨ 系統已就緒，請填入 API Key 並開始會議。');
  const [duration, setDuration] = useState(0);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [assemblyKey, setAssemblyKey] = useState(import.meta.env.VITE_ASSEMBLYAI_API_KEY || '');
  const [deepgramKey, setDeepgramKey] = useState(import.meta.env.VITE_DEEPGRAM_API_KEY || '');
  const [audioSource, setAudioSource] = useState<'record' | 'upload'>('record');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('meeting_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

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
    setProvider(item.provider as any);
    setGeminiModel(item.modelId);
    setView('current');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 檔案大小限制：100MB (Gemini API 限制)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      alert(`❌ 檔案過大！\n\n最大允許大小：100 MB\n您的檔案大小：${(file.size / 1024 / 1024).toFixed(2)} MB\n\n請選擇較小的檔案或使用檔案上傳 API。`);
      return;
    }
    
    // 檢查檔案類型
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/flac'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/avi'];
    
    if (!audioTypes.includes(file.type) && !videoTypes.includes(file.type)) {
      alert(`⚠️ 不支援的檔案格式！\n\n支援的格式：\n• 音訊：MP3, WAV, WebM, MP4, OGG, FLAC\n• 影片：MP4, WebM, AVI\n\n您的檔案類型：${file.type}`);
      return;
    }
    
    setSelectedFile(file);
    setAudioSource('upload');
    setTranscript(`已選擇檔案：${file.name}\n大小：${(file.size / 1024 / 1024).toFixed(2)} MB\n類型：${file.type}\n\n點擊「分析檔案」開始處理。`);
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setAudioSource('record');
    setTranscript('');
  };

  const exportToMarkdown = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Summary_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("您的瀏覽器不支援錄音功能，或目前不在安全環境 (HTTPS/Localhost) 下。");
        return;
      }

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
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        saveAudioToFile(blob, `meeting_${Date.now()}.webm`);
        processAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(''); // 清除運作說明，準備接收新內容
      setSummary('正在錄音中...');
      setDuration(0);
      
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone Access Error:", err);
      
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert("❌ 找不到麥克風設備。請檢查您的麥克風是否已插入，並在 Windows 設定中開啟麥克風存取權限。");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("❌ 麥克風權限被拒絕。請點擊網址列左側的鎖頭圖示，並選擇『允許使用麥克風』。");
      } else {
        alert(`❌ 錄音啟動失敗: ${err.message}`);
      }
      
      setIsRecording(false);
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

  const saveAudioToFile = async (blob: Blob, filename: string) => {
    try {
      // 嘗試使用 File System Access API (現代瀏覽器支援)
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'WebM Audio',
            accept: { 'audio/webm': ['.webm'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('Audio saved to:', handle.name);
      } else {
        // 傳統方式：下載檔案
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Audio downloaded:', filename);
      }
    } catch (err: any) {
      console.warn('Failed to save audio file:', err);
      // 使用者取消操作或其他錯誤，不中斷流程
    }
  };

  const getGeminiModelInfo = (modelId: string) => {
    return GEMINI_MODELS.find(m => m.id === modelId);
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

  const processFileAudio = async (file: File) => {
    const currentKey = provider === 'gemini' ? apiKey : (provider === 'assemblyai' ? assemblyKey : deepgramKey);
    
    if (!currentKey) {
      alert(`Please provide an API Key for ${provider}.`);
      return;
    }

    // 檔案大小限制檢查
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      alert(`❌ 檔案過大！\n\n最大允許大小：100 MB\n您的檔案大小：${(file.size / 1024 / 1024).toFixed(2)} MB`);
      return;
    }

    setIsProcessing(true);
    setSummary(`${provider.toUpperCase()} is analyzing your file...`);
    
    try {
      if (provider === 'gemini') {
        await processWithFile(file, currentKey);
      } else {
        // Placeholder for future implementation of other providers
        setSummary(`${provider.toUpperCase()} integration is reserved. Currently implementing...`);
        setTimeout(() => setIsProcessing(false), 2000);
      }
    } catch (err: any) {
      console.error(`${provider.toUpperCase()} Error:`, err);
      setSummary(`❌ 處理錯誤：\n\n${err.message}\n\n請檢查您的 API Key 和檔案格式。`);
      setIsProcessing(false);
    }
  };

  const processWithGemini = async (blob: Blob, key: string) => {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: geminiModel });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const prompt = `
        ## 角色設定
        你是一位專業的行政助理與戰略分析師。請仔細聽取這段會議音訊，並依照以下結構進行分析與記錄。
        請使用 **繁體中文 (zh-TW)** 進行輸出，並保持專業、簡潔的語氣。

        ## 輸出規範 (Markdown 格式)

        ### 1. 執行摘要 (Executive Summary)
        - 用 3-5 句話概括會議的核心目的與最終結論。

        ### 2. 角色標註逐字稿 (Diarized Transcript)
        - 標註發言者 (例如：發言者 1, 發言者 2)。
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
        請確保排版優雅，適合在高階主管會議後直接閱讀。
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
      saveToHistory(responseText, "Analysis Complete (Gemini).");
    };
    
    reader.onerror = () => {
      setSummary("❌ 讀取音訊失敗！\n\n請檢查錄音是否正常完成。");
      setIsProcessing(false);
    };
    
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    
    // 檢查是否為 RPM 限制錯誤
    if (err.message?.includes('429') || err.message?.includes('RATE_LIMIT_EXCEEDED')) {
      setSummary(`❌ API 速率限制！\n\n${err.message}\n\n請稍後再試，或切換到 Gemini 2.5 Flash-Lite 模型。`);
    } else if (err.message?.includes('TOKEN_LIMIT_EXCEEDED')) {
      setSummary(`❌ Token 上限！\n\n音訊過長，超過模型限制。\n\n請使用分段處理或選擇支援更長上下文的模型。`);
    } else {
      setSummary(`❌ Gemini API 錯誤：\n\n${err.message}\n\n請檢查您的 API Key 和錄音檔案。`);
    }
    setIsProcessing(false);
  }
  };

  const processWithFile = async (file: File, key: string) => {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: geminiModel });

    try {
      // 讀取檔案
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // 檢查 Base64 大小 (Gemini API 限制：100MB)
        const maxSize = 100 * 1024 * 1024;
        const base64Size = base64Data.length * 3 / 4;
        
        if (base64Size > maxSize) {
          setSummary(`❌ 檔案過大！\n\n上傳大小：${(base64Size / 1024 / 1024).toFixed(2)} MB\n最大限制：100 MB\n\n請選擇較小的檔案。`);
          setIsProcessing(false);
          return;
        }

        const prompt = `
          ## 角色設定
          你是一位專業的行政助理與戰略分析師。請仔細聽取這段會議音訊，並依照以下結構進行分析與記錄。
          請使用 **繁體中文 (zh-TW)** 進行輸出，並保持專業、簡潔的語氣。

          ## 輸出規範 (Markdown 格式)

          ### 1. 執行摘要 (Executive Summary)
          - 用 3-5 句話概括會議的核心目的與最終結論。

          ### 2. 角色標註逐字稿 (Diarized Transcript)
          - 標註發言者 (例如：發言者 1, 發言者 2)。
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
          請確保排版優雅，適合在高階主管會議後直接閱讀。
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type
            }
          }
        ]);

        const responseText = result.response.text();
        setTranscript(responseText);
        setSummary(`Analysis Complete (Gemini). File: ${file.name}`);
        setIsProcessing(false);
        saveToHistory(responseText, `Analysis Complete (Gemini). File: ${file.name}`);
      };
      
      reader.onerror = () => {
        setSummary("❌ 讀取檔案失敗！\n\n請檢查檔案是否損毀或格式是否正確。");
        setIsProcessing(false);
      };
      
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      
      // 檢查是否為 RPM 限制錯誤
      if (err.message?.includes('429') || err.message?.includes('RATE_LIMIT_EXCEEDED')) {
        setSummary(`❌ API 速率限制！\n\n${err.message}\n\n請稍後再試，或切換到 Gemini 2.5 Flash-Lite 模型。`);
      } else if (err.message?.includes('TOKEN_LIMIT_EXCEEDED')) {
        setSummary(`❌ Token 上限！\n\n音訊過長，超過模型限制。\n\n請使用分段處理或選擇支援更長上下文的模型。`);
      } else {
        setSummary(`❌ Gemini API 錯誤：\n\n${err.message}\n\n請檢查您的 API Key 和檔案格式。`);
      }
      setIsProcessing(false);
    }
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
              <>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="api-input"
                  style={{ marginBottom: '12px' }}
                >
                  {GEMINI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.status === 'preview' ? '(Preview)' : ''}
                    </option>
                  ))}
                </select>
                
                <div className="model-info" style={{ 
                  background: 'rgba(58, 124, 168, 0.05)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '12px'
                }}>
                  {(() => {
                    const modelInfo = getGeminiModelInfo(geminiModel);
                    return (
                      <>
                        <strong>{modelInfo?.name}</strong>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
                          {modelInfo?.description}
                        </p>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: '4px',
                          marginTop: '8px'
                        }}>
                          {modelInfo?.rpm && modelInfo.rpm > 0 && (
                            <span>⚡ {modelInfo.rpm} RPM</span>
                          )}
                          {modelInfo?.rpd && modelInfo.rpd > 0 && (
                            <span>📅 {modelInfo.rpd} RPD</span>
                          )}
                          {modelInfo?.tpm && modelInfo.tpm > 0 && (
                            <span>📊 {(modelInfo.tpm / 1000)}K TPM</span>
                          )}
                          <span>🧠 {modelInfo?.contextWindow}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <input 
                  type="password" 
                  placeholder="Enter Gemini API Key" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  className="api-input"
                />
              </>
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
            
            {/* Audio Source Selector */}
            <div className="audio-source-selector" style={{ 
              display: 'flex', 
              gap: '8px', 
              marginTop: '12px',
              marginBottom: '12px'
            }}>
              <button 
                type="button"
                className={`source-btn ${audioSource === 'record' ? 'active' : ''}`}
                onClick={() => {
                  setAudioSource('record');
                  setSelectedFile(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: audioSource === 'record' ? 'var(--accent-brand)' : 'rgba(58, 124, 168, 0.05)',
                  color: audioSource === 'record' ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🎤 麥克風錄音
              </button>
              <button 
                type="button"
                className={`source-btn ${audioSource === 'upload' ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: audioSource === 'upload' ? 'var(--accent-brand)' : 'rgba(58, 124, 168, 0.05)',
                  color: audioSource === 'upload' ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {selectedFile ? 'Change File' : 'Upload File'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="audio/*,video/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {/* File Selection Display */}
            {audioSource === 'upload' && selectedFile && (
              <div className="file-info" style={{ 
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: 'var(--success)' }}>✅ {selectedFile.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </div>
                </div>
                <button 
                  onClick={clearFileSelection}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="recording-status">
            {isRecording && <span className="recording-indicator"></span>}
            <span className="timer">{formatTime(duration)}</span>
          </div>
          
          <button 
            className={`record-btn ${isRecording ? 'active' : ''}`}
            onClick={isRecording ? stopRecording : () => {
              if (audioSource === 'record') {
                startRecording();
              } else if (audioSource === 'upload' && selectedFile) {
                processFileAudio(selectedFile);
              } else {
                alert('請選擇音訊來源並上傳檔案');
              }
            }}
            disabled={isProcessing}
          >
            {isRecording ? 'Stop Recording' : isProcessing ? 'Processing...' : audioSource === 'record' ? 'Start Recording' : selectedFile ? 'Start Analysis' : 'Select File'}
          </button>
        </section>

        <div className="content-grid">
          {view === 'current' ? (
            <>
              <section className="transcript-panel glass-card">
                <div className="panel-header">
                  <h3>Transcript & Analysis</h3>
                  <div className="export-actions">
                    <button onClick={exportToMarkdown} title="Export Markdown" className="icon-btn">📄 MD</button>
                    <button onClick={exportToPDF} title="Print PDF" className="icon-btn">🖨️ PDF</button>
                  </div>
                </div>
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
            </>
          ) : (
            <section className="history-panel glass-card full-width">
              <h3>Meeting History</h3>
              <div className="scroll-area">
                {history.length === 0 ? (
                  <p className="empty-state">No saved meetings yet.</p>
                ) : (
                  <div className="history-list">
                    {history.map(item => (
                      <div key={item.id} className="history-item" onClick={() => loadHistoryItem(item)}>
                        <div className="history-info">
                          <span className="history-date">{item.date}</span>
                          <span className="history-meta">
                            {item.provider.toUpperCase()} • {item.modelId} • {formatTime(item.duration)}
                          </span>
                        </div>
                        <button className="delete-btn" onClick={(e) => deleteHistoryItem(item.id, e)}>×</button>
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
        <p>© 2026 MeetingSummary - Powered by Antigravity AI</p>
      </footer>
    </div>
  );
};

export default App;
