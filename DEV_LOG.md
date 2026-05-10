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
## [2026-05-07] - Code Quality & Project Structure Cleanup

### 🎯 Objective
修復 ESLint 錯誤、清理冗餘檔案，並更新專案結構。

### 📝 Task List

#### Code Quality Fixes
- [x] 修復 commit 4a6d991 中的 ESLint 錯誤：
  - 移除未使用的 `currentProcessingIndex` 狀態變數
  - 移除未使用的 `processFileAudio` 函數
- [x] 驗證 `npx tsc --noEmit` 通過
- [x] 驗證 `npx eslint .` 通過
- [x] 驗證 `npx vite build` 成功

#### Project Structure Cleanup
- [x] 移除 `PWA_SETUP.md`（內容已併入 DEV_LOG.md）
- [x] 移除 `implementation_plan.md`（所有功能已完成）
- [x] 移除根目錄的 `manifest.webmanifest`（由 vite-plugin-pwa 生成）
- [x] 移除 `SKILL.md`（已過時）
- [x] 更新 `.gitignore` 排除 `dist/`, `node_modules/`, `*.log` 等
- [x] 更新 `README.md` 反映最新功能

### 🔍 Analysis (RCA - Root Cause Analysis)

#### Issue 1: ESLint 錯誤（commit 4a6d991）
- **Problem**: ESLint 檢測到 2 個錯誤：
  - `currentProcessingIndex` 被賦值但從未使用
  - `processFileAudio` 被賦值但從未使用
- **Root Cause**: 在實作多檔案上傳功能時，新增了 `currentProcessingIndex` 用於顯示進度，但後來改用 `uploadQueue.length` 來計算進度，導致該變數未被使用。`processFileAudio` 是早期單一檔案處理邏輯的殘留函數。
- **Solution**: 
  - 移除 `currentProcessingIndex` 狀態變數
  - 移除 `processFileAudio` 函數
  - 使用 `uploadQueue.length` 計算剩餘檔案數量

#### Issue 2: 冗餘檔案累積
- **Problem**: 專案中存在多個過時或重複的文件檔案
- **Root Cause**: 
  - `PWA_SETUP.md` 與 `DEV_LOG.md` 內容重複
  - `implementation_plan.md` 中的功能已全部完成
  - 根目錄的 `manifest.webmanifest` 與 vite-plugin-pwa 生成的版本重複
- **Solution**: 
  - 保留 `DEV_LOG.md` 作為唯一開發記錄
  - 移除已完成的實作計畫
  - 移除重複的 PWA 設定文件

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 
  - 移除未使用的程式碼與文件
  - 清理專案結構
- **Preventive**: 
  - 建立程式碼審查清單，包含「檢查未使用變數/函數」項目
  - 定期清理過時文件
  - 建立 `pre-commit` hook 自動執行 `npx tsc --noEmit`, `npx eslint .`, `npx vite build`

---

## [2026-05-07] - PWA Icon Path Fix & Layout Redesign

### 🎯 Objective
修復 PWA 圖示路徑錯誤，並重新規劃版面以提升空間利用率。

### 📝 Task List

#### PWA Icon Path Fix
- [x] 修正 `vite.config.ts` 中的 PWA manifest 設定
- [x] 修正 `manifest.webmanifest` 圖示路徑（`/public/icons/` → `/icons/`）
- [x] 更新 `.gitignore` 移除 `/public/icons/` 排除規則
- [x] 驗證圖示正確部署至 GitHub Pages

#### Layout Redesign
- [x] 重新規劃版面為 **Sidebar + Main Content** 架構
  - 桌機：左側固定 Sidebar（320px）+ 右側全寬 Transcript 區
  - 手機：上下堆疊，Sidebar 全寬，內容區佔剩餘高度
- [x] 移除獨立 Status Panel（原佔 1/3 版面），整合至 Sidebar 底部
- [x] 移除 `content-grid` 雙欄佈局，Transcript 現在佔滿主內容區
- [x] 更新 `index.css`：移除 `place-items: center`，`#root` 改為全寬全高
- [x] 新增 Print 樣式：列印時隱藏 Sidebar，僅輸出 Transcript 內容

### 🔍 Analysis (RCA - Root Cause Analysis)

#### Issue 1: PWA 圖示 404 Not Found
- **Problem**: `GET https://chun-chieh-chang.github.io/MeetingSummary/public/icons/icons-192.png 404`
- **Root Cause 1**: manifest 路徑包含 `/public/icons/`，但 Vite 建構時會將 `public/` 內容複製至 `dist/` 根目錄，正確路徑應為 `/MeetingSummary/icons/icons-192.png`
- **Root Cause 2**: `.gitignore` 中誤加 `/public/icons/`，導致圖示從未被推送至 GitHub
- **Solution**: 
  - 修正 `vite.config.ts` 與 `manifest.webmanifest` 中的圖示路徑
  - 將 `public/icons/` 從 `.gitignore` 移除
  - 重新推送至 GitHub

#### Issue 2: 手機版 layout 擠壓，空間利用不佳
- **Root Cause**: 原版面為橫排 Controls + 雙欄 Content Grid，在小螢幕上無法有效利用空間
- **Solution**: 改為 Sidebar + Main Content 架構，手機版改為垂直堆疊，Transcript 佔滿剩餘空間

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 
  - 修正圖示路徑
  - 重新設計版面佈局
- **Preventive**: 
  - 建立 PWA 部署前檢查清單（`.kiro/steering/pwa-checklist.md`）
  - 建立 PWA 建構前自動驗證 hook（`.kiro/hooks/pwa-build-check.json`）
  - **Lesson Learned**: Vite 的 `public/` 目錄在建構後會被攤平至 `dist/` 根目錄，manifest 中的路徑不應包含 `public/`

---
## [2026-05-07] - Code Quality & Project Structure Cleanup

### 🎯 Objective
修復 ESLint 錯誤、清理冗餘檔案，並更新專案結構。

### 📝 Task List

#### Code Quality Fixes
- [x] 修復 commit 4a6d991 中的 ESLint 錯誤：
  - 移除未使用的 `currentProcessingIndex` 狀態變數
  - 移除未使用的 `processFileAudio` 函數
- [x] 驗證 `npx tsc --noEmit` 通過
- [x] 驗證 `npx eslint .` 通過
- [x] 驗證 `npx vite build` 成功

#### Project Structure Cleanup
- [x] 移除 `PWA_SETUP.md`（內容已併入 DEV_LOG.md）
- [x] 移除 `implementation_plan.md`（所有功能已完成）
- [x] 移除根目錄的 `manifest.webmanifest`（由 vite-plugin-pwa 生成）
- [x] 移除 `SKILL.md`（已過時）
- [x] 更新 `.gitignore` 排除 `dist/`, `node_modules/`, `*.log` 等
- [x] 更新 `README.md` 反映最新功能

### 🔍 Analysis (RCA - Root Cause Analysis)

#### Issue 1: ESLint 錯誤（commit 4a6d991）
- **Problem**: ESLint 檢測到 2 個錯誤：
  - `currentProcessingIndex` 被賦值但從未使用
  - `processFileAudio` 被賦值但從未使用
- **Root Cause**: 在實作多檔案上傳功能時，新增了 `currentProcessingIndex` 用於顯示進度，但後來改用 `uploadQueue.length` 來計算進度，導致該變數未被使用。`processFileAudio` 是早期單一檔案處理邏輯的殘留函數。
- **Solution**: 
  - 移除 `currentProcessingIndex` 狀態變數
  - 移除 `processFileAudio` 函數
  - 使用 `uploadQueue.length` 計算剩餘檔案數量

#### Issue 2: 冗餘檔案累積
- **Problem**: 專案中存在多個過時或重複的文件檔案
- **Root Cause**: 
  - `PWA_SETUP.md` 與 `DEV_LOG.md` 內容重複
  - `implementation_plan.md` 中的功能已全部完成
  - 根目錄的 `manifest.webmanifest` 與 vite-plugin-pwa 生成的版本重複
- **Solution**: 
  - 保留 `DEV_LOG.md` 作為唯一開發記錄
  - 移除已完成的實作計畫
  - 移除重複的 PWA 設定文件

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 
  - 移除未使用的程式碼與文件
  - 清理專案結構
- **Preventive**: 
  - 建立程式碼審查清單，包含「檢查未使用變數/函數」項目
  - 定期清理過時文件
  - 建立 `pre-commit` hook 自動執行 `npx tsc --noEmit`, `npx eslint .`, `npx vite build`

---

## [2026-05-07] - PWA Icon Path Fix & Layout Redesign

### 🎯 Objective
修復 PWA 圖示路徑錯誤，並重新規劃版面以提升空間利用率。

### 📝 Task List

#### PWA Icon Path Fix
- [x] 修正 `vite.config.ts` 中的 PWA manifest 設定
- [x] 修正 `manifest.webmanifest` 圖示路徑（`/public/icons/` → `/icons/`）
- [x] 更新 `.gitignore` 移除 `/public/icons/` 排除規則
- [x] 驗證圖示正確部署至 GitHub Pages

#### Layout Redesign
- [x] 重新規劃版面為 **Sidebar + Main Content** 架構
  - 桌機：左側固定 Sidebar（320px）+ 右側全寬 Transcript 區
  - 手機：上下堆疊，Sidebar 全寬，內容區佔剩餘高度
- [x] 移除獨立 Status Panel（原佔 1/3 版面），整合至 Sidebar 底部
- [x] 移除 `content-grid` 雙欄佈局，Transcript 現在佔滿主內容區
- [x] 更新 `index.css`：移除 `place-items: center`，`#root` 改為全寬全高
- [x] 新增 Print 樣式：列印時隱藏 Sidebar，僅輸出 Transcript 內容

### 🔍 Analysis (RCA - Root Cause Analysis)

#### Issue 1: PWA 圖示 404 Not Found
- **Problem**: `GET https://chun-chieh-chang.github.io/MeetingSummary/public/icons/icons-192.png 404`
- **Root Cause 1**: manifest 路徑包含 `/public/icons/`，但 Vite 建構時會將 `public/` 內容複製至 `dist/` 根目錄，正確路徑應為 `/MeetingSummary/icons/icons-192.png`
- **Root Cause 2**: `.gitignore` 中誤加 `/public/icons/`，導致圖示從未被推送至 GitHub
- **Solution**: 
  - 修正 `vite.config.ts` 與 `manifest.webmanifest` 中的圖示路徑
  - 將 `public/icons/` 從 `.gitignore` 移除
  - 重新推送至 GitHub

#### Issue 2: 手機版 layout 擠壓，空間利用不佳
- **Root Cause**: 原版面為橫排 Controls + 雙欄 Content Grid，在小螢幕上無法有效利用空間
- **Solution**: 改為 Sidebar + Main Content 架構，手機版改為垂直堆疊，Transcript 佔滿剩餘空間

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 
  - 修正圖示路徑
  - 重新設計版面佈局
- **Preventive**: 
  - 建立 PWA 部署前檢查清單（`.kiro/steering/pwa-checklist.md`）
  - 建立 PWA 建構前自動驗證 hook（`.kiro/hooks/pwa-build-check.json`）
  - **Lesson Learned**: Vite 的 `public/` 目錄在建構後會被攤平至 `dist/` 根目錄，manifest 中的路徑不應包含 `public/`

---

## [2026-05-07] - GitHub Actions Deployment Fix

### 🎯 Objective
修復 GitHub Actions 部署失敗問題。

### 📝 Task List
- [x] 修復 `setCurrentProcessingIndex` 未定義錯誤
- [x] 驗證 TypeScript 編譯無誤
- [x] 驗證 ESLint 檢查通過
- [x] 驗證 Vite 建構成功
- [x] 推送修復至 GitHub

### 🔍 Analysis (RCA - Root Cause Analysis)

#### Issue: GitHub Actions 部署失敗（Runs 26, 27, 28）
- **Problem**: GitHub Actions 部署失敗，錯誤訊息：
  ```
  src/App.tsx#L240 Cannot find name 'setCurrentProcessingIndex'.
  ```
- **Root Cause**: 
  - 在移除 `currentProcessingIndex` 狀態變數時，忘記移除 `clearFileSelection` 函數中對 `setCurrentProcessingIndex(0)` 的調用
  - 雖然本地端 `npx tsc --noEmit` 通過，但 GitHub Actions 使用的是遠端程式碼，未包含此修復
- **Solution**: 
  - 移除 `clearFileSelection` 函數中的 `setCurrentProcessingIndex(0)` 調用
  - 重新提交並推送

### 🛡️ CAPA (Corrective and Preventive Actions)

#### Corrective Actions (已執行)
- 移除 `setCurrentProcessingIndex(0)` 調用
- 修復並推送至 GitHub

#### Preventive Actions (建議執行)
- **建立 pre-commit hook**：在本地提交前自動執行 `npx tsc --noEmit`, `npx eslint .`, `npx vite build`
- **啟用 GitHub Actions 保護規則**：要求所有檢查通過後才能合併到 main 分支
- **使用 Git Hooks 驗證**：在 `.git/hooks/pre-push` 中加入驗證腳本
- **程式碼審查清單**：在移除變數/函數時，必須檢查所有引用點
- **IDE 設定**：啟用 ESLint 與 TypeScript 的即時檢查，確保本地環境與 CI 一致

#### Lesson Learned
- **本地驗證 ≠ CI 驗證**：本地環境的編譯通過不代表 CI 會通過，必須確保所有變更都已提交
- **變數/函數移除時的檢查清單**：
  1. 搜尋所有引用點（IDE 的 "Find All References" 功能）
  2. 檢查是否在其他函數中被調用
  3. 檢查是否在狀態初始化中被使用
  4. 重新編譯並測試
- **CI/CD 流程優化**：考慮在 GitHub Actions 中加入 "Build & Test" 步驟，確保每次推送都經過完整驗證

---

## [2026-05-10] - Repository Synchronization

### 🎯 Objective
將本地專案資料夾與 GitHub 遠端倉庫最新的 commit 同步。

### 📝 Task List
- [x] 執行 `git fetch origin` 獲取遠端更新
- [x] 執行 `git status` 檢查本地與遠端差異
- [x] 執行 `git pull origin main` 確保本地程式碼為最新版本
- [x] 更新 `DEV_LOG.md` 記錄同步狀態

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Status**: 執行 `git pull` 後顯示 `Already up to date`。
- **Observation**: 本地 `main` 分支已與 `origin/main` (commit `d68a581`) 保持一致。
- **Note**: 目前工作區狀態良好，無待提交變更。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 確認同步完成。
- **Preventive**: 在開始任何新開發任務前，應養成先執行 `git pull` 的習慣，避免產生衝突。

---

## [2026-05-10] - Server Restart & Runtime Bug Fix

### 🎯 Objective
重啟本地開發伺服器並修復導致網頁空白的執行階段錯誤。

### 📝 Task List
- [x] 執行 `npm run dev` 啟動 Vite 開發伺服器。
- [x] 診斷 `App.tsx` 中的 `ReferenceError: exportToMarkdown is not defined`。
- [x] 實作缺失的 `exportToMarkdown` 函數。
- [x] 驗證 TypeScript 編譯 (`npx tsc --noEmit`) 通過。
- [x] 驗證網頁正確載入並呈現 Premium UI。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 網頁開啟後呈現空白，開發者控制台顯示 `<App>` 組件出錯。
- **Root Cause**: `App.tsx` 的 JSX 中引用了 `exportToMarkdown` 作為按鈕點擊處理函數，但該函數未在組件內部定義，導致 React 渲染失敗。
- **Solution**: 在 `App.tsx` 中實作 `exportToMarkdown` 邏輯，使用 Blob 與 URL.createObjectURL 實現 Markdown 檔案下載。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 修復並補齊缺失的匯出功能。
- **Preventive**: 每次提交變更前應強制執行 `npx tsc --noEmit` 或 `npm run build` 以捕捉引用錯誤。

---

## [2026-05-10] - Gemini API 503 Error Handling (Robustness)

### 🎯 Objective
解決 `gemini-3.1-flash-lite` 偶爾回傳 503 (Service Unavailable) 的問題，提升系統穩定性。

### 📝 Task List
- [x] 實作 `generateContentWithRetry` 輔助函數。
- [x] 加入 **Exponential Backoff** (指數退避) 演算法（2s, 4s, 8s + Jitter）。
- [x] 針對 503 與 429 錯誤進行自動重試（最多 3 次）。
- [x] 優化 UI 狀態反饋：重試時顯示「伺服器忙碌，正在重試 (1/3)...」。
- [x] 驗證 TypeScript 編譯通過。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 使用者回報 `generativelanguage.googleapis.com` 回傳 503 錯誤。
- **Root Cause**: `gemini-3.1-flash-lite` 為熱門模型，免費版（Free Tier）在尖峰時段易受容量限制（Capacity Constraints）導致 503。原代碼未實作重試機制。
- **Solution**: 實作自動重試邏輯，在遇到暫時性錯誤時自動等待並再次請求，減少人為干預。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 實作指數退避重試機制。
- **Preventive**: 
    1. 建議使用者若頻繁遇到 503，可嘗試切換至 `gemini-2.5-flash`（負載較低）。
    2. 未來可考慮實作「模型自動降級」機制（例如 503 時自動嘗試 alternate model）。

---

## [2026-05-10] - Transcript Formatting & Sidebar File List UI

### 🎯 Objective
優化生成內容結構（逐字稿優先）並改善多檔案上傳時的視覺反饋。

### 📝 Task List
- [x] 更新 Gemini Prompt，要求優先輸出 **[mm:ss] 格式的時間標記逐字稿**。
- [x] 規範輸出結構：逐字稿 -> 詳細摘要 -> 結論與行動方案。
- [x] 在左側邊欄新增「待處理檔案」清單，顯示已選擇的檔案名稱。
- [x] 新增「清除全部」按鈕，方便使用者重新選擇檔案。
- [x] 優化邊欄 CSS，確保檔案清單在多檔案時具備滾動條。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem 1**: 生成內容缺乏時間戳記，難以回溯音訊。
- **Problem 2**: 上傳多個檔案時，使用者無法在 UI 上確認目前已選擇哪些檔案。
- **Solution**: 
    1. 透過 Prompt Engineering 強制模型執行 Diarization 與 Timestamping。
    2. 在 Sidebar 注入 `selectedFiles` 列表組件，提升操作透明度。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 實作逐字稿標記與檔案清單 UI。
- **Preventive**: 定期檢視使用者對於摘要結構的需求，動態調整 Prompt 範本。

---

## [2026-05-10] - File Processing Order (Alphabetical Sort)

### 🎯 Objective
確保多檔案處理時，分析順序嚴格遵循檔案名稱（Alphabetical Order）。

### 📝 Task List
- [x] 修改 `handleFileSelect` 邏輯，在存入 `selectedFiles` 前執行排序。
- [x] 使用 `localeCompare` 搭配 `numeric: true` 實現智慧型數字排序（如：part1, part2, part10）。
- [x] 更新 UI 提示文字，告知使用者檔案已按名稱排序。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 瀏覽器選取檔案時的順序可能不固定（取決於 OS 或選取順序），導致分析後的逐字稿邏輯中斷。
- **Solution**: 在前端強制對檔案陣列進行排序，保證處理順序的可預測性。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 實作 `selectedFiles.sort()`。
- **Preventive**: 對於具備順序依賴性的批次任務，一律在入口點進行正規化排序。

---

## [2026-05-10] - Individual File Processing Progress UI

### 🎯 Objective
在多檔案處理過程中，提供更細緻的進度回饋，讓使用者即時掌握每個檔案的分析狀態。

### 📝 Task List
- [x] 新增 `currentFileIndex` 與 `processedFileIndices` 狀態追蹤。
- [x] 在邊欄檔案清單中為每個檔案加入狀態圖示（等待中、處理中 ⏳、已完成 ✅）。
- [x] 針對正在處理的檔案加入底部的 **動態進度條 (Progress Track Animation)**。
- [x] 優化「清除全部」邏輯，確保清除檔案時一併重置所有處理狀態。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 批次處理時，原 UI 僅能顯示總體文字提示（如：解析中 2/4），使用者無法得知具體哪個檔案正在被處理或哪些已成功。
- **Solution**: 實作組件級狀態追蹤，透過 CSS 動畫模擬 API 調用過程中的進度感。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 實作檔案層級的進度條與狀態指示器。
- **Preventive**: 對於耗時較長的非同步任務，應優先考慮分階段的狀態可視化。

---

## [2026-05-10] - Automatic Model Fallback Mechanism

### 🎯 Objective
當首選模型持續回傳 503 錯誤時，系統應自動嘗試其他可用模型，確保任務完成。

### 📝 Task List
- [x] 實作 `fileToBase64` 異步輔助函數。
- [x] 在 `processWithGemini`, `processWithFile`, `synthesizeResults` 中加入 **模型切換隊列 (Fallback Queue)**。
- [x] 當 `generateContentWithRetry` 在 5 次重試後仍失敗且錯誤為 transient (503/429) 時，自動切換至下一個模型。
- [x] 優體 UI 反饋：切換模型時顯示 `⚠️ [Model ID] 過載，自動切換至下一個模型...`。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 單一模型的重試（Retry）在極端過載的情況下仍可能失敗，導致使用者任務中斷。
- **Solution**: 實作 **Multi-Model Redundancy**。預設順序為：`gemini-3.1-flash-lite` -> `gemini-2.5-flash` -> `gemini-2.5-pro`。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 實作模型自動降級與備援機制。
- **Preventive**: 考慮在未來加入「API Key 輪詢」或「多區域佈署」邏輯以進一步提升穩定性。

---

## [2026-05-10] - Optimized Fallback Speed

### 🎯 Objective
縮短單一模型的等待時間，加快切換至備援模型的速度。

### 📝 Task List
- [x] 將 `generateContentWithRetry` 的 `maxRetries` 從 5 次下修至 **2 次**。
- [x] 確保在第二次重試失敗後，系統立即觸發 Fallback 邏輯切換至下一個模型。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 5 次重試可能耗時過長（加上退避時間約 30-60 秒），若伺服器處於持續過載狀態，過多的重試會降低整體效率。
- **Solution**: 減少單點重試次數，將重心轉移至模型切換，以空間（多模型資源）換取時間。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 調整 `maxRetries = 2`。

---

## [2026-05-10] - PDCA Build Verification & Code Cleanup

### 🎯 Objective
執行全專案編譯驗證，確保所有優化與修復皆符合生產環境標準。

### 📝 Task List
- [x] 執行 `npm run build` 進行完整編譯測試。
- [x] 修復 TypeScript 編譯錯誤：移除未使用的 `setAssemblyKey`, `setDeepgramKey`。
- [x] 修復 TypeScript 編譯錯誤：初始化 `lastError` 並確保其在失敗訊息中被讀取。
- [x] 驗證 Vite 建構成功，確認 PWA 資源與 Assets 正確產出。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Observation**: 雖然 `tsc --noEmit` 通過，但生產環境建構 `tsc -b` 捕捉到了細微的變數引用錯誤。
- **Solution**: 遵循 MECE 原則清理冗餘變數，並加強錯誤處理的完整性。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Check (Effect Confirmation)**: `npm run build` 已成功，產出物完整，無任何警告或錯誤。
- **Preventive**: 每次任務結束前必須執行一次完整 Build 以作最終驗證。

---

## [2026-05-10] - Structured Output Enforcement (Missing Summary Fix)

### 🎯 Objective
修復在長音訊分析時，AI 可能遺漏摘要與總結區塊的問題。

### 📝 Task List
- [x] 優化 Prompt 結構：使用 Markdown Header 標註三大必填區塊。
- [x] 加入強制指令：要求 AI 即使內容過長也必須保留「摘要」與「總結」。
- [x] 調整 `generationConfig`：設置 `maxOutputTokens: 8192` 以提供充足的輸出空間。
- [x] 優化模型參數：調整 `temperature: 0.2` 以增加輸出結構的穩定性。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 當音訊內容極長時，逐字稿會佔據過多輸出空間，導致模型達到 Token 限制而中斷，或是忽略了後半段的指令。
- **Solution**: 透過明確的 Sectioning 與 Token 擴展，強制模型保留關鍵的分析部分。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 更新 Prompt 與 `generationConfig`。
- **Preventive**: 對於長文本輸出，應預設保留摘要空間。

---

## [2026-05-10] - Final Optimization & Git Push Preparation

### 🎯 Objective
執行推送前的最終優化，確保符合「色彩大師規範」與「代碼魯棒性」標準。

### 📝 Task List
- [x] 對齊「色彩大師規範」 (Color Master Palette) 並加入深色模式支援。
- [x] 重構 `App.tsx` 冗餘邏輯，封裝 API 調用與 Fallback 機制。
- [x] 執行 `npm run build` 進行生產環境確效。
- [x] 獲得使用者許可後執行 `git push`。

### 🔍 Analysis (RCA - Root Cause Analysis)
- **Problem**: 現有色彩計畫與 `user_global` 規範定義的專業色階有細微差異。
- **Root Cause**: 初始開發時使用的是海鹽藍主題，未完全對齊規範中的品牌藍與高級灰。
- **Solution**: 全面更新 `index.css` 與 `App.css` 的 Design Tokens。

### 🛡️ CAPA (Corrective and Preventive Actions)
- **Corrective**: 更新 CSS 與重構代碼。
- **Preventive**: 建立 `PRE_PUSH_CHECKLIST.md` 作為未來標準化部署流程。
