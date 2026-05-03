# Wiki Schema & Governance

This document defines the rules for maintaining the `MeetingSummary` Knowledge Base. It is inspired by Karpathy's "LLM Wiki" pattern.

## 1. Core Principles
*   **Persistent & Compounding**: The wiki is not just a cache; it is a synthesis of everything the agent has learned about this project.
*   **Interlinked**: Every entity and concept should be linked. Avoid orphan pages.
*   **Cited**: Every claim in the wiki should ideally trace back to a file in `raw/` or a specific file in the codebase.
*   **Agent-Maintained**: The human curates; the AI summarizes, cross-references, and files.

## 2. Standard Operations

### INGEST
1.  Read a new source (file, transcript, recording).
2.  Summarize key takeaways.
3.  Identify existing wiki pages to update (Entities/Concepts).
4.  Create new pages if necessary.
5.  Update `wiki/index.md` and append to `wiki/log.md`.

### QUERY
1.  Read `wiki/index.md` to find relevant context.
2.  Drill into specific pages in `wiki/entities/` or `wiki/concepts/`.
3.  Synthesize answer.
4.  **Important**: If the query uncovers a new insight, file it back into the wiki.

## 3. Directory Structure
*   `raw/`: Immutable source materials (transcripts, meeting notes).
*   `wiki/entities/`: Pages for specific tools, libraries, or project modules (e.g., UI, Backend, OpenAI API).
*   `wiki/concepts/`: Pages for high-level patterns or design decisions (e.g., Summarization Logic, Task Extraction).
*   `wiki/index.md`: The map of the wiki.
*   `wiki/log.md`: Chronological log of major events.
