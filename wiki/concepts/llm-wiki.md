# LLM Wiki Pattern

The `LLM Wiki` is a design pattern for compounding knowledge in agentic workflows.

## 1. Background
Inspired by Andrej Karpathy's workflow, this pattern focuses on creating a "project brain" that agents can read from and write to across sessions.

## 2. Core Mechanics
- **Persistent Storage**: Using Markdown files in a `wiki/` directory.
- **Recursive Synthesis**: Every time a task is completed, the agent updates the wiki with new insights.
- **Grounded Research**: The wiki serves as the first point of reference, reducing hallucination and redundant work.

## 3. Implementation in MeetingSummary
In this project, the Wiki will track:
- Evolving prompt strategies for different meeting types.
- UI components and design system tokens.
- Bug reports and RCA/CAPA logs (via `DEV_LOG.md` integration).
