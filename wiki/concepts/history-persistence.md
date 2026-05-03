# History Persistence Concept

This document describes the local persistence layer for meeting records.

## 💾 Storage Mechanism
- **Engine**: Browser `localStorage`.
- **Key**: `meeting_history`.
- **Format**: JSON array of `MeetingRecord` objects.

## 📄 Data Structure (MeetingRecord)
```typescript
interface MeetingRecord {
  id: string;        // Timestamp-based ID
  date: string;      // Human-readable locale date
  duration: number;  // Meeting length in seconds
  provider: string;  // AI engine used (Gemini, etc.)
  transcript: string; // The full generated Markdown content
  summary: string;    // Brief status summary
}
```

## 🔄 Lifecycle
1.  **Ingest**: When Gemini completes analysis, a new record is prepended to the history array.
2.  **Load**: On application mount, the history is parsed and stored in the `history` state.
3.  **Retrieve**: Clicking a history item populates the `transcript` and `summary` states.
4.  **Delete**: Users can remove specific entries, triggering a state update and storage sync.

## ⚠️ Privacy & Limitations
- **Security**: Data is stored in plaintext in the browser. Sensitive meeting content should be cleared manually if on a shared device.
- **Quota**: `localStorage` typically has a 5MB limit. Long Markdown transcripts may eventually hit this limit.
