# MeetingSummary Development Log

Following PDCA (Plan-Do-Check-Act) methodology and MECE principles.

---

## [2026-05-03] - Project Initialization & Wiki Setup

### 🎯 Objective
Initialize the `MeetingSummary` project with a robust Knowledge Base (Wiki) structure based on the `SkillsBuilder` architecture (Karpathy LLM Wiki pattern).

### 📝 Task List
- [x] Create `wiki/` structure (`SCHEMA.md`, `index.md`, `log.md`).
- [x] Define initial concepts: `meeting-summarization`, `llm-wiki`.
- [x] Establish `raw/` directory for source materials.
- [x] Initialize `DEV_LOG.md` (this file).
- [x] Initialize frontend framework (Vite + React + TS).
- [x] Implement Premium UI/UX with "Color Master Palette" and Glassmorphism.
- [x] Implement core recording logic using MediaRecorder API.
- [x] Pivot to **Gemini 1.5 Pro/Flash** (Native Audio Support).
- [x] Integrate `@google/generative-ai` SDK.
- [x] Implement Embedded User Guide in UI (Initial State).
- [x] Implement Multi-Provider API Selector (Gemini, AssemblyAI, Deepgram).
- [x] Optimize Gemini Prompt to **v2.0** (Professional Structured Output in zh-TW).
- [x] Implement **Meeting History Persistence** (localStorage).
- [x] Add **History UI** (List view, Item loading, Delete functionality).
- [x] Implement **Export Functionality** (Markdown Download, PDF Print).
- [x] Enhance **Microphone Error Handling** (Specific advice for NotFound/NotAllowed).
- [ ] Implement actual API callers for AssemblyAI and Deepgram.

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: GitHub Actions build failed with a TypeScript error.
- **Root Cause**: A type mismatch occurred in `App.tsx` because the `transcript` state was changed from an array to a string, but a legacy function (`addMockTranscript`) still attempted to update it as an array.
- **Solution**: Removed all legacy transcription logic and ensured the state is handled consistently as a string, aligning with the Gemini API response format. Verified the fix using `npx tsc` locally.
- **Problem**: Microphone access fails with `NotFoundError`.
- **Root Cause**: No physical microphone connected or browser unable to access the device due to OS-level privacy settings.
- **Solution**: Improved error handling to provide actionable advice (check hardware, check Windows privacy settings, check browser permissions). Added safety checks for `navigator.mediaDevices`.
- **Problem (Legacy)**: Traditional STT (like OpenAI Whisper) often requires a separate diarization step.
- **Root Cause**: Audio and text models are usually disjoint.
- **Solution**: Gemini 1.5 Pro allows "Native Multimodal Reasoning", where the model listens to the audio and writes the diarized transcript directly, eliminating the need for complex pipeline orchestration.

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: Built a robust frontend state machine that handles the recording lifecycle and provides mock diarization for UI testing.
- **Preventive**: Will implement a "Processing" state to handle long-running cloud transcription tasks without blocking the UI.

---

## [2026-05-06] - UX Improvements, PWA Support & Layout Redesign

### 🎯 Objective
改善使用者體驗、新增 PWA 支援，並重新規劃版面以提升空間利用率。

### 📝 Task List

#### UX / Button Naming
- [x] 釐清「麥克風錄音」與「Start Meeting」的功能區別
- [x] 將主按鈕 `Start Meeting` 改為 `Start Recording`（麥克風模式）
- [x] 新增 `Start Analysis` 按鈕文字（上傳檔案模式）
- [x] 新增 `Select File` 狀態（尚未選擇檔案時）
- [x] 更新 UI 內嵌使用者說明，反映新按鈕名稱與操作流程

#### PWA Support
- [x] 安裝 `vite-plugin-pwa`
- [x] 設定 `vite.config.ts` PWA manifest 與 Workbox 快取策略
- [x] 建立 `scripts/generate-pwa-icons.ts` 自動生成 192x192 / 512x512 圖示
- [x] 新增 PWA 安裝說明至 UI 使用者指南（iOS / Android）
- [x] 修正 `.gitignore` 誤排除 `public/icons/` 導致圖示未部署的問題
- [x] 修正 manifest 圖示路徑（`/public/icons/` → `/icons/`，符合 Vite 靜態資源規則）

#### Code Quality
- [x] 修復 10 個 ESLint 錯誤：
  - `react-hooks/set-state-in-effect`：將 history 初始化移至 `useState` lazy initializer
  - `@typescript-eslint/no-explicit-any`：替換所有 `any` 為明確型別
  - `@typescript-eslint/ban-ts-comment`：將 `@ts-ignore` 改為 `@ts-expect-error`
- [x] 改善錯誤處理：使用 `err instanceof Error` 取代直接存取 `err.message`

#### Layout Redesign
- [x] 重新規劃版面為 **Sidebar + Main Content** 架構
  - 桌機：左側固定 Sidebar（320px）+ 右側全寬 Transcript 區
  - 手機：上下堆疊，Sidebar 全寬，內容區佔剩餘高度
- [x] 移除獨立 Status Panel（原佔 1/3 版面），整合至 Sidebar 底部
- [x] 移除 `content-grid` 雙欄佈局，Transcript 現在佔滿主內容區
- [x] 更新 `index.css`：移除 `place-items: center`，`#root` 改為全寬全高
- [x] 新增 Print 樣式：列印時隱藏 Sidebar，僅輸出 Transcript 內容

### 🔍 Analysis (RCA - Root Cause Analysis)

- **Problem**: PWA 圖示 404 Not Found（`/MeetingSummary/public/icons-192.png`）
- **Root Cause 1**: manifest 路徑包含 `/public/`，但 Vite 建構時會將 `public/` 內容複製至 `dist/` 根目錄，正確路徑應為 `/MeetingSummary/icons/icons-192.png`
- **Root Cause 2**: `.gitignore` 中誤加 `/public/icons/`，導致圖示從未被推送至 GitHub
- **Solution**: 修正 `vite.config.ts` 與 `manifest.webmanifest` 中的圖示路徑，並將 `public/icons/` 從 `.gitignore` 移除

- **Problem**: 手機版 layout 擠壓，空間利用不佳
- **Root Cause**: 原版面為橫排 Controls + 雙欄 Content Grid，在小螢幕上無法有效利用空間
- **Solution**: 改為 Sidebar + Main Content 架構，手機版改為垂直堆疊，Transcript 佔滿剩餘空間

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 建立 `.kiro/steering/pwa-checklist.md` 作為 PWA 部署前的檢查清單
- **Preventive**: 建立 `.kiro/hooks/pwa-build-check.json` hook，在任務執行前自動驗證 PWA 設定
- **Lesson Learned**: Vite 的 `public/` 目錄在建構後會被攤平至 `dist/` 根目錄，manifest 中的路徑不應包含 `public/`

---
## [2026-05-07] - Multiple File Upload Support

### 🎯 Objective
支援一次上傳並串接多個音訊檔案，依序處理並合併結果。

### 📝 Task List
- [x] 修改 `selectedFile` 狀態為 `selectedFiles` (File[] 陣列)
- [x] 新增 `uploadQueue` 狀態追蹤待處理檔案
- [x] 新增 `currentProcessingIndex` 狀態顯示處理進度
- [x] 修改 `handleFileSelect` 支援多檔案選擇與驗證
- [x] 新增 `processAllFiles` 函數依序處理所有檔案
- [x] 修改 `processWithFile` 支援 `append` 參數以串接結果
- [x] 更新 UI 按鈕文字與顯示邏輯
- [x] 更新使用者說明文字
- [x] 驗證 TypeScript 編譯無誤
- [x] 驗證 Vite 建構成功
- [x] 推送至 GitHub

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 原設計只支援單一檔案上傳
- **Root Cause**: `selectedFile` 狀態為 `File | null`，無法儲存多個檔案
- **Solution**: 
  - 將 `selectedFile` 改為 `selectedFiles: File[]`
  - 新增 `uploadQueue` 追蹤待處理檔案
  - 新增 `currentProcessingIndex` 顯示進度
  - `processWithFile` 新增 `append` 參數，支援結果串接

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 
  - 實作多檔案上傳 UI
  - 實作依序處理邏輯
  - 實作結果串接功能
- **Preventive**: 
  - 檔案大小與格式驗證
  - 錯誤處理與跳過機制
  - 進度顯示與使用者回饋

---
