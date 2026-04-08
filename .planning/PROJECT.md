# CodeWiki v2

## What This Is

CodeWiki is a framework that installs into any AI coding tool (Claude Code, Codex, Copilot, OpenCode) and maintains a persistent, LLM-written wiki of verified project knowledge. Developers run `npx codewiki init` once — the CLI scaffolds a wiki structure and installs hooks, slash commands, and agents into their AI tool. All intelligence (reading wiki, proposing updates, human approval loops) lives in markdown prompt files the AI tool executes natively.

Target users: solo developers using AI coding agents who have experienced agents confidently producing broken code and want accumulated, cross-referenced, human-verified context that reduces hallucination over time.

## Core Value

`npx codewiki init` turns any project into an AI-tool-native knowledge system in 30 seconds, where every session starts smarter than the last.

## Requirements

### Validated

- WIKI-01..WIKI-05 validated in Phase 2 — scaffold and init create the expected wiki tree, config, and template files.
- MERGE-01..MERGE-04 validated in Phase 2 — merge utilities are covered by focused Vitest tests and regression-safe edge-case checks.
- BUILD-01 validated early in Phase 2 — `npm run build` now copies template assets into `dist/templates/`.
- ABS-01..ABS-05 validated in Phase 3.1 — auto-improvement prompts, backlinks scaffold state, and structured hook outputs are now implemented and test-covered.
- CLI-01..CLI-07 and CC-01..CC-05 validated in Phase 4 — the adapter pipeline, Claude installer, detection flow, rerun idempotency, and sectioned install reporting are covered by unit plus built CLI integration tests.

### Active

- [ ] `codewiki init` installs wiki scaffold + tool-specific configs for Claude Code, Codex, Copilot, OpenCode
- [ ] Slash commands installed as native markdown prompts: `/codewiki-ingest`, `/codewiki-query`, `/codewiki-lint`, `/codewiki-absorb`, `/codewiki-breakdown`, `/codewiki-prd`, `/codewiki-tasks`, `/codewiki-process`
- [ ] Pre/post/session-end hooks inject wiki context and trigger wiki updates automatically
- [ ] Wiki structure: `wiki/entities/`, `decisions/`, `lessons/`, `issues/`, `sources/`, `index.md`, `log.md`
- [ ] Agents installed: `codewiki-wiki-updater`, `codewiki-verifier`
- [ ] `init --force` overwrites; without `--force`, existing files are preserved with warning
- [ ] Merges with existing tool configs (`.claude/settings.json`, etc.) — does not clobber
- [ ] Auto-detects which AI tools are present; `--tool` flag overrides
- [ ] Published to npm; works via `npx codewiki init` with zero install
- [ ] All prompt content adapted from original `docs/prompts/` source files

### Out of Scope

- Runtime CLI logic (ingest, query, lint, prd, tasks as TypeScript commands) — the AI tool does this natively
- Custom LLM API calls from the CLI — all AI work happens inside the AI coding tool
- Web dashboard, database, server — wiki is just markdown files in the project
- Template evolution system (v1 deferred decision)
- Multi-user / team sync — single developer workflow only in v1

## Context

- **Existing codebase:** `src/` now has an init-only CLI, shared infrastructure in `src/lib/`, a generic adapter pipeline in `src/lib/adapters/`, a working Claude installer, and the full Phase 3/3.1 prompt and hook asset set in `src/templates/`.
- **Architecture model:** GSD (`get-shit-done`) — the CLI is a scaffolder/installer only, like how GSD installs prompts and configs. Study GSD's hook scripts and install pattern before implementing.
- **Hook formats:** Each tool uses different hook config formats (`.claude/settings.json` for Claude Code, `.codex/hooks.json` for Codex, `.github/hooks/*.json` for Copilot, `opencode.json` for OpenCode). Research required before implementation.
- **Original prompts:** `docs/prompts/create-prd.md`, `generate-tasks.md`, `process-task-list.md` are the source of truth for the `/codewiki-prd`, `/codewiki-tasks`, `/codewiki-process` slash command content.
- **Prior design docs:** `docs/codewiki-project-v2.md` (PRD) and `docs/implementation-plan-v2.md` (task breakdown) are the implementation reference.

## Constraints

- **Tech stack**: TypeScript + Node.js — existing build system, keep it
- **Zero runtime dependencies**: CLI must have no npm dependencies at runtime (installer-only pattern)
- **Zero LLM calls**: CLI never calls any AI API — all intelligence is in markdown files
- **POSIX-compatible hooks**: Hook scripts must work across all four supported tools with `jq` fallback to `grep`
- **npm publish**: Package must work via `npx` with no global install; prompt files must be bundled in `dist/`
- **No clobber**: `init` must deep-merge JSON configs and use marker comments in markdown files to avoid destroying existing user configs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI = installer only, no runtime logic | AI tools natively read markdown; middleware adds complexity without value | — Pending |
| Shared hook scripts in `.codewiki/hooks/` | Avoid duplicating shell logic per tool; tool configs just point to shared scripts | — Pending |
| Prompt files bundled in `dist/prompts/` | npm package must be self-contained; read from `import.meta.url` at runtime | — Pending |
| Marker comments `<!-- codewiki:start/end -->` | Safe idempotent merging of instruction file sections | — Pending |
| Keep `wiki/` as plain markdown | No database, no vendor lock-in; agent reads/writes natively | — Pending |
| Auto-improvement uses dedicated prompts plus `_backlinks.json` | Keeps prompt context small while giving the wiki a shared ranking/maintenance primitive | Validated in Phase 3.1 |
| Generic adapter pipeline powers `init` | Keeps tool-specific install behavior out of the command handler and makes future adapters additive | Validated in Phase 4 |
| Install `session-end.sh` but leave it unwired in Claude | Ships the asset now while waiting for a confirmed Claude lifecycle hook for session completion | Validated in Phase 4 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after Phase 4 completion*
