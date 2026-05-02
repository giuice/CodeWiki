---
quick_id: 260502-qcw
type: quick
status: complete
---

# Quick Task 260502-qcw - Summary

**Task:** Strengthen generated CodeWiki agent operating instructions
**Date:** 2026-05-02
**Status:** Complete
**Commit:** This commit

## What Changed

- Added a concise "not query-time RAG" explanation to Claude, Codex, Copilot, and OpenCode instruction templates.
- Added an operating flow that tells agents when to use `codewiki-ingest`, `codewiki-query`, `codewiki-prd`, `codewiki-tasks`, `codewiki-process`, `codewiki-absorb`, `codewiki-lint`, and `codewiki-breakdown`.
- Clarified that hooks provide context and change signals, but do not replace deliberate workflow use or human approval of wiki writes.
- Added regression assertions for Codex, Copilot, OpenCode, and installed Claude instructions.

## Verification

- `npx vitest run src/templates/__tests__/codex-adapter.test.ts src/templates/__tests__/copilot-adapter.test.ts src/templates/__tests__/opencode-adapter.test.ts`
- `npm run typecheck`
- `npm run build`
- `node --test --test-concurrency=1 dist/test/init.test.js`
