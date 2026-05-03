---
name: meeting-summary-pro
description: 啟動 MeetingSummary Pro 的核心開發與維護模式。包含音訊處理邏輯優化、Gemini 提示詞調整、以及 UI/UX 高細節維護。
---

# MeetingSummary Pro Skill

此技能專用於維護與擴展 `MeetingSummary` 專案。當使用者需要修改音訊錄製邏輯、調整 Gemini 總結策略或優化 Dashboard UI 時，必須遵循此工作流。

## 1. 觸發詞 (Triggers)
- 「啟動 MeetingSummary 開發模式」
- 「優化 Gemini 總結提示詞」
- 「修改錄音引擎邏輯」

## 2. 核心工作流 (Workflow)

### Phase A: 診斷 (Diagnosis)
1. 檢查 `src/App.tsx` 中的 `MediaRecorder` 配置。
2. 檢查 `processWithGemini` 中的 Prompt 是否符合最新的需求（例如：是否需要情緒分析）。
3. 檢查 `App.css` 的佈局一致性。

### Phase B: 執行 (Execution)
- **UI 修改**: 必須遵循「色彩大師規範」與「毛玻璃美學」。
- **邏輯修改**: 任何對 `processAudio` 的變動必須確保 `isProcessing` 狀態被正確管理，防止 UI 凍結。
- **Wiki 同步**: 完成修改後，必須更新 `wiki/entities/` 中對應的組件文件。

### Phase C: 驗證 (Verification)
1. 執行 `npx tsc` 確保型別安全。
2. 檢查 Console 是否有任何紅字錯誤。
3. 更新 `DEV_LOG.md` 紀錄 RCA 與 CAPA。

## 3. 知識庫連結 (Wiki Links)
- [Meeting Summarization Concept](wiki/concepts/meeting-summarization.md)
- [Speaker Diarization Concept](wiki/concepts/speaker-diarization.md)
- [Gemini Integration Schema](wiki/entities/backend.md)
