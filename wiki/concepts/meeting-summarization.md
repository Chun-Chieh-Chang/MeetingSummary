# Meeting Summarization Concept

This document outlines the core logic and patterns used to transform raw transcripts into structured meeting summaries.

## 📋 Optimized Summarization Structure (v2.0)

為了確保輸出的專業性與可讀性，系統採用以下結構化模板：

1.  **Executive Summary**: 核心結論的高層次概括。
2.  **Diarized Transcript**: 自動標註發言人的流暢逐字稿（省略語氣助詞）。
3.  **Topic Analysis**: 深度拆解討論議題。
4.  **Decision & Action Table**: 使用表格形式明確紀錄決策與負責人。
5.  **Tone & Insights**: 提供會議氛圍分析與後續建議。

## 🤖 Prompt Strategy
- **Language**: Forced `zh-TW` (Traditional Chinese).
- **Role**: Executive Assistant & Strategic Analyst.
- **Filtering**: Instructed to remove filler words for a clean reading experience.

## 🔗 Related Entities
- [backend](../entities/backend.md)
- [audio-engine](../entities/audio-engine.md)
- [project-requirements](../entities/project-requirements.md)
