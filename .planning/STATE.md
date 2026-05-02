---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: complete
stopped_at: Completed quick task 260502-qcw
last_updated: "2026-05-02T16:16:57.000Z"
last_activity: 2026-05-02
progress:
  total_phases: 15
  completed_phases: 13
  total_plans: 36
  completed_plans: 36
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** `npx codewiki init` turns any project into an AI-tool-native knowledge system in 30 seconds, where every session starts smarter than the last.
**Current focus:** Milestone completion — Phase 8 UAT passed and npm publish hardening is complete

## Current Position

Phase: 8
Plan: complete
Status: Quick task 260502-qcw complete; milestone ready for final audit/cleanup
Last activity: 2026-05-02

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 36
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 1 | 10m | 10m |
| 02 | 3 | 6m | 2m |
| 03 | 3 | - | - |
| 03.1 | 3 | - | - |
| 04 | 3 | 7m | 2m |
| 04.1.1 | 4 | - | - |
| 05 | 1 | 8m | 8m |
| 04.1.2 | 3 | - | - |
| 04.1.3 | 2 | - | - |
| 04.1.4 | 1 | - | - |
| 04.1.5 | 1 | 25m | 25m |
| 06 | 2 | - | - |
| 7 | 6 | - | - |

**Recent Trend:**

- Last 4 plans: 04.1.2-02, 04.1.2-03, 04.1.3-01, 04.1.3-02
- Trend: Stable

*Updated after each plan completion*
| Phase 04.1.2 P01 | 1 min | 2 tasks | 1 files |
| Phase 04.1.2 P02 | 3 min | 2 tasks | 3 files |
| Phase 04.1.2 P03 | 2 min | 2 tasks | 1 files |
| Phase 04.1.5 P01 | 25 | 3 tasks | 4 files |
| Phase 07 P02 | 4 | 3 tasks | 4 files |
| Phase 07 P05 | 4 | 3 tasks | 3 files |
| Phase 07 P06 | 12min | 3 tasks | 2 files |
| Phase 08 P01 | 2min | 2 tasks | 3 files |
| Phase 08 P02 | 3min | 2 tasks | 3 files |
| Phase 08 P03 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: CLI = installer only (no runtime logic); all AI intelligence in markdown prompt files
- Roadmap: Phase 3 hook scripts are the highest-risk deliverable — write and test in isolation before wiring to init
- Roadmap: Claude Code adapter built first (fully specified); Codex, Copilot, and OpenCode reuse the shared `.agents/skills` tree while their tool-specific hook and instruction surfaces land in later phases
- Roadmap: OpenCode uses a plugin dispatcher at `.opencode/plugins/codewiki.ts` with `tool.execute.before`, `file.edited`, and `session.idle` rather than `opencode.json` hook wiring
- Phase 03.1: auto-improvement uses dedicated absorb/breakdown prompts plus a shared `_backlinks.json` index instead of a monolithic wiki skill
- Phase 03.1: post-verify is an active structured trigger for wiki updates, and session-end performs lightweight auto-capture from git diff context
- Phase 04: `init` is now a thin adapter orchestrator that detects tools, scaffolds shared assets, and reports unsupported selections explicitly
- Phase 04: Claude installs `session-end.sh` but reports it as inactive until a supported Claude session lifecycle hook is confirmed
- Phase 04.1: skills migration remains the active corrective umbrella phase; execution is split into 04.1.1-04.1.5 to preserve atomicity
- Phase 04.1 planning uses parser-safe chained decimals (4.1.1-4.1.5) because local GSD tooling does not accept 4.1a-style suffixes
- Phase 04.1 template migration uses `/create-skill` as a structure/metadata reference only; skill files are migrated by hand from the existing commands
- Phase 04.1.1: canonical skill sources now live under `src/templates/skills/codewiki-<name>/SKILL.md`; legacy command files stay in place until adapter and regression-path rewiring lands in Phases 04.1.2 and 04.1.3
- Phase 05: pack coverage reads `npm pack --dry-run --json` for file assertions because plain dry-run stdout on the current npm version omits the tarball file list
- Phase 05: compiled node:test integration files now run with `--test-concurrency=1` so pack verification cannot delete `dist/` while other integration files are executing
- Phase 04.1.4: Planning artifacts refreshed to reflect the skills canon — ROADMAP.md, REQUIREMENTS.md, STATE.md, and CONVENTIONS.md now describe the eight-skill install surface and parser-safe decimal sub-phases consistently
- Phase 04.1.2: skills canon install surface is `.claude/skills/codewiki-<name>/SKILL.md` for Claude and `.agents/skills/codewiki-<name>/SKILL.md` for non-Claude tools, replacing the legacy Claude command directory
- Phase 04.1.5: product docs now describe the shipped eight-skill surface and the `.claude/skills/` / `.agents/skills/` split consistently across README, PRD, implementation docs, and migration reference
- 2026-05-01 Codex hook canon refresh: current Codex docs supersede the 2026-04-13 hook model. Codex uses `UserPromptSubmit` for prompt-level context, can match `apply_patch` through `PreToolUse`/`PostToolUse` aliases `Edit|Write`, and needs event-specific JSON wrappers for `PostToolUse`/`Stop`; Copilot uses `agentStop` for meaningful post-turn follow-up and treats `sessionEnd` as cleanup-only; OpenCode uses plugin events `tool.execute.before`, `file.edited`, and `session.idle`
- [Phase 07]: Codex config merging uses a narrow text helper for codex_hooks — Preserves unrelated .codex/config.toml user settings and comments while enabling hooks.
- [Phase 07]: Codex remains in SHARED_SKILLS_TOOLS while also resolving a real CodexAdapter — Preserves canonical shared .agents/skills installation for Codex selections.
- [Phase 07]: Copilot remains in SHARED_SKILLS_TOOLS while also resolving a real CopilotAdapter — Preserves canonical shared .agents/skills installation for Copilot selections.
- [Phase 07]: Copilot hook config is a CodeWiki-owned `.github/hooks/codewiki-hooks.json` file — The adapter writes that deterministic file and leaves unrelated `.github/hooks/*.json` files alone.
- [Phase 07]: Copilot pending integration reporting was removed — Codex and Copilot both have real adapters after 07-05.
- [Phase 07]: Plan 07-06 Copilot regression coverage verifies shared .agents/skills usage and rejects .github/skills.
- [Phase 07]: Plan 07-06 mixed-selection regressions assert both .claude/skills and .agents/skills contain exactly one copy of each CodeWiki skill.
- Phase 08 planning: publish hardening is split into package/pack manifest coverage, local tarball npx smoke, and bounded README release verification docs.
- Phase 08 planning: local tarball smoke is the blocking pre-publish gate; `npx codewiki@latest init` remains a post-publish/manual registry check.
- Phase 08 planning: no runtime dependency is required for the phase; `picocolors` remains an allowed but unused narrow exception.
- [Phase 08]: Pack verification parses `npm pack --dry-run --json` and asserts the full runtime template manifest required by `init`.
- [Phase 08]: The blocking local tarball smoke generates a `.tgz` with `npm pack --json`, invokes it through `npx`, verifies representative adapter assets, and removes the tarball in `finally`.
- [Phase 08]: Local packed CLI tests preserve the direct `npx --yes <tarball>` form but fall back to `npx --yes --package <tarball> codewiki` when npm/npx treats the `.tgz` path as an executable.
- [Phase 08]: README publish guidance distinguishes the blocking local tarball smoke from the post-publish `npx codewiki@latest init` registry check.
- [Phase 08]: README now documents `node >=20.11.0`, zero runtime dependencies, dev-only TypeScript/Vitest/@types/node, and template/registry troubleshooting.
- [Phase 08]: UAT passed 5/5 user-facing checks on 2026-05-02 with no issues, skips, or blocked items.

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 03.1 inserted after Phase 3: Auto-Improvement Engine (URGENT) — adds absorb, breakdown, backlinks, session-end hook to make wiki auto-improve instead of passively remind. Inspired by Farzaa wiki skill and Karpathy/Spisak knowledge base patterns.
- Phase 04.1 inserted after Phase 4: Skills Migration (URGENT) — umbrella corrective phase for migrating Phase 4 output from slash commands to standalone Skills.
- Phase 04.1 was decomposed into 04.1.1-04.1.5 so template, adapter, test, and doc work can execute atomically with parser-safe numbering.
- Phase 9 added: Global Agent Install Surface — explicit global install, uninstall, and doctor commands for CodeWiki agent skills/hooks while preserving project-local `codewiki init` as the default setup path.

### Blockers/Concerns

- Future Codex adapter work: the shared `.agents/skills` tree is already resolved; remaining work is `.codex/hooks.json`, `.codex/config.toml`, Codex-specific hook wrappers, and `AGENTS.md` integration around current Codex hook semantics
- Future Copilot adapter work: installer wiring is complete; remaining Phase 7 Copilot work is regression coverage and any live hook payload smoke verification
- Phase 3 and future adapter work: actual payload shapes for Codex, Copilot, and OpenCode hook or plugin events should still be verified with live tool invocations before finalizing parser assumptions

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260407-ulj | Update README.md to reflect current project direction and Phase 3 functionality | 2026-04-08 | 6ce8cae | [260407-ulj-update-readme-md-to-reflect-current-proj](./quick/260407-ulj-update-readme-md-to-reflect-current-proj/) |
| 260411-mzx | Reconcile v2 docs to 8-command canon + initial OpenCode hook resolution (later superseded by the plugin-event canon) | 2026-04-11 | cace4e9 | [260411-mzx-reconcile-v2-docs-to-8-command-canon-plu](./quick/260411-mzx-reconcile-v2-docs-to-8-command-canon-plu/) |
| 260502-qcw | Strengthen generated CodeWiki agent operating instructions | 2026-05-02 | this commit | [260502-qcw-strengthen-codewiki-agent-operating-instructions](./quick/260502-qcw-strengthen-codewiki-agent-operating-instructions/) |

## Session Continuity

Last session: 2026-05-02T16:16:57.000Z
Stopped at: Completed quick task 260502-qcw
Resume file: None
