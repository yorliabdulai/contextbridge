# Changelog

All notable changes to MemoryMesh are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-03-08

### Added

**Chrome Extension**
- Content scripts injecting a floating banner into Claude.ai, ChatGPT, and Gemini
- Save Context button — extracts conversation, sends to Bedrock for summarisation, stores in DynamoDB
- Sync to AI button — fetches all stored context entries and injects summaries into the active chat input
- Popup UI showing the 5 most recent context entries
- History importer page accessible from the popup
- Auto-format detection for ChatGPT exports (`mapping` object structure) and Claude exports (flat array with `sender: "human"|"assistant"`)
- 300ms throttle between import API calls to avoid Bedrock rate limits
- Event delegation fix for Save Context button (replaces per-element listeners)
- Context fetch limit increased to 1000 (was 5 — insufficient for bulk imports)

**MCP Server**
- TypeScript MCP server using stdio transport for Claude Desktop integration
- Four tools: `get_context`, `save_context`, `search_memory`, `get_user_profile`
- Direct DynamoDB access via AWS SDK v3

**AWS Infrastructure (CDK)**
- `MemoryMeshDynamoDB` stack: `memorymesh-context` (PK: `userId`, SK: `createdAt`) and `memorymesh-profile` (PK: `userId`) tables with `PAY_PER_REQUEST` billing
- `MemoryMeshLambda` stack: 5 Lambda functions (Node.js 20) with IAM role granting `bedrock:InvokeModel` on `*`
- `MemoryMeshApi` stack: HTTP API Gateway with routes to all Lambda functions

**Lambda Functions**
- `memorymesh-get-context` — retrieves context entries by userId with configurable limit
- `memorymesh-save-context` — writes a new context entry
- `memorymesh-search-memory` — keyword search across stored context
- `memorymesh-get-user-profile` — get or create user profile
- `memorymesh-summarize` — invokes Amazon Bedrock (`eu.anthropic.claude-haiku-4-5-20251001-v1:0`) and returns structured JSON (summary, tags, projects)

**Bedrock Integration**
- EU cross-region inference profile (`eu.anthropic.claude-haiku-4-5-20251001-v1:0`) in `eu-west-2`
- Structured JSON prompt returning `summary`, `tags`, and `projects` fields
- Used by both the summarize Lambda and the bulk history importer

**Proven end-to-end**
- 58 Claude + ChatGPT conversations imported, summarised, and synced to Gemini successfully