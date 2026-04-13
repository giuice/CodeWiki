# Quick Task 260407-ulj: Update README.md — Summary

> Historical note: This completed quick-task artifact preserves the assumptions of its original session. It may mention superseded command-era paths or older hook-event choices. For current canon, use `docs/codewiki-project-v2.md`, `docs/skills-migration-handoff.md`, `docs/research-reference.md`, and the live `.planning/*.md` docs.

**Completed:** 2026-04-08
**Status:** ✅ Done

## What Changed

Complete rewrite of `README.md` to reflect the v2 installer-only architecture.

### Removed
- All references to deleted v1 runtime CLI commands (`codewiki ingest`, `codewiki query`, `codewiki lint`, `codewiki prd`, `codewiki tasks`, `codewiki status`)
- The 7-row commands table showing runtime CLI commands
- `codewiki --help` and `npm install -g codewiki` references
- "V1 non-goals" section naming

### Added
- **Slash Commands** section documenting all 6 installed slash commands
- **Hooks** section documenting `pre-wiki-context.sh` and `post-verify.sh`
- **Agents** section documenting `codewiki-wiki-updater` and `codewiki-verifier`
- **Multi-tool support** table showing per-tool integration paths (Claude Code, Codex, Copilot, OpenCode)
- **Project status** section showing Phase 3 of 8 complete
- Updated project layout showing tool-specific files (Claude Code example)
- Updated architecture mermaid diagram with three layers (Raw, Wiki, Tool Integration)

### Updated
- Introduction: emphasizes installer-only CLI + prompt-native intelligence
- Workflow diagram: includes pre-hook/post-hook steps
- Install section: `npx codewiki init` as primary path
- Quick start: shows slash commands used inside AI tool, not CLI
- Commands table: only `codewiki init` (the sole CLI command)
- Development section: mentions vitest, zero runtime deps
- Non-goals: renamed to "Current non-goals", added "runtime CLI commands beyond init"

## Verification

- Zero references to old CLI commands: ✅
- 10 references to `codewiki init`: ✅
- 11 references to slash commands: ✅
- 7 references to hooks: ✅
- 7 references to agents: ✅
- Lint passes: ✅
