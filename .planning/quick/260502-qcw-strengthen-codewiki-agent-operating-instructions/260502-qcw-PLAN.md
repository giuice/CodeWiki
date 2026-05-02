---
quick_id: 260502-qcw
type: quick
mode: quick
autonomous: true
files_modified:
  - src/templates/claude/instructions.md
  - src/templates/codex/instructions.md
  - src/templates/copilot/instructions.md
  - src/templates/opencode/instructions.md
  - src/templates/__tests__/codex-adapter.test.ts
  - src/templates/__tests__/copilot-adapter.test.ts
  - src/templates/__tests__/opencode-adapter.test.ts
  - test/init.test.ts
---

# Quick Task 260502-qcw - Plan

## Objective

Strengthen the generated CodeWiki tool instructions so agents understand what CodeWiki is, when to use each workflow, which actions are manual, and what hooks do not replace.

## Tasks

1. Add a concise operational CodeWiki description to each installed instruction template.
2. Cover the required flows: ingest new raw sources, query wiki knowledge, plan/process feature work, absorb substantial code changes, and lint/breakdown wiki drift.
3. State the hook boundary clearly: hooks provide context and signals but do not replace deliberate workflow use or human approval.
4. Add regression assertions so future template changes keep the operational guidance.
5. Run focused template tests, typecheck, build, and the compiled init integration test.

## Success Criteria

- Claude, Codex, Copilot, and OpenCode generated instructions all explain CodeWiki as persistent project memory, not query-time RAG.
- Instructions tell the agent when to use ingest, query, prd/tasks/process, absorb, lint, and breakdown.
- Instructions explicitly say hooks do not replace manual workflow execution or human approval.
- Tests pass for the changed templates and init installation path.
