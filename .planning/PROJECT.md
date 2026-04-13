# CodeWiki v2

## What This Is

CodeWiki is a framework that installs into any AI coding tool (Claude Code, Codex, Copilot, OpenCode) and maintains a persistent, LLM-written wiki of verified project knowledge. Developers run `npx codewiki init` once — the CLI scaffolds a wiki structure and installs tool-facing integration assets into the host tool. The canonical install surface is eight standalone Skills plus shared hooks, agents, and instruction blocks. All intelligence (reading wiki, proposing updates, human approval loops) lives in markdown prompt files and shared scripts that the AI tool executes natively.

Target users: solo developers using AI coding agents who have experienced agents confidently producing broken code and want accumulated, cross-referenced, human-verified context that reduces hallucination over time.

## Core Value

`npx codewiki init` turns any project into an AI-tool-native knowledge system in 30 seconds, where every session starts smarter than the last.

## Requirements

### Validated

- WIKI-01..WIKI-05 validated in Phase 2 — scaffold and init create the expected wiki tree, config, and template files.
- MERGE-01..MERGE-04 validated in Phase 2 — merge utilities are covered by focused Vitest tests and regression-safe edge-case checks.
- BUILD-01 validated early in Phase 2 — `npm run build` now copies template assets into `dist/templates/`.
- BUILD-02 validated across Phases 5 and 4.1.3 — compiled pack coverage now proves `npm pack --dry-run` includes the canonical packaged skill asset and shared hook assets in the tarball.
- ABS-01..ABS-05 validated in Phase 3.1 — auto-improvement prompts, backlinks scaffold state, and structured hook outputs are now implemented and test-covered.
- CLI-01..CLI-07 and CC-01..CC-05 validated in Phase 4 — the adapter pipeline, Claude installer, detection flow, rerun idempotency, and sectioned install reporting are covered by unit plus built CLI integration tests.
- SM-01 validated in Phase 4.1.1 — the eight canonical CodeWiki skill sources now live under `src/templates/skills/codewiki-<name>/SKILL.md` with preserved prompt bodies and skill discovery frontmatter.
- SM-02..SM-04 validated in Phases 4.1.2-4.1.3 — installer output, regression coverage, and tarball verification now follow the canonical skill install surface for Claude and mixed-tool runs.
- SM-05 validated in Phase 4.1.4 — planning artifacts (ROADMAP, REQUIREMENTS, STATE, CONVENTIONS) refreshed to reflect the skills canon and parser-safe sub-phase numbering consistently

### Active

- [ ] `codewiki init` installs the wiki scaffold plus the full per-tool integration surface for Claude Code, Codex, Copilot, and OpenCode
- [ ] OpenCode adapter writes `.opencode/plugins/codewiki.ts`, `.opencode/agents/`, and `AGENTS.md` integration while reusing the shared `.agents/skills/codewiki-<name>/SKILL.md` tree
- [ ] Codex adapter writes `.codex/hooks.json` integration using `UserPromptSubmit` and `Stop`, appends to `AGENTS.md`, and reuses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree
- [ ] Copilot adapter writes `.github/hooks/*.json`, appends to `.github/copilot-instructions.md`, uses `agentStop` as the meaningful post-turn hook, and reuses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree
- [ ] Per-tool hooks and plugins inject wiki context and trigger wiki follow-up according to each host's documented event model
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

- **Existing codebase:** `src/` now has an init-only CLI, shared infrastructure in `src/lib/`, a generic adapter pipeline in `src/lib/adapters/`, a working Claude installer, canonical skill source templates under `src/templates/skills/`, adapters and regression coverage wired to the canonical skill paths, and a Phase 5 test suite that covers merge/scaffold behavior, rerun idempotency, hook exit-0 guarantees, and npm-pack tarball inclusion for shipped templates.
- **Architecture model:** GSD (`get-shit-done`) — the CLI is a scaffolder/installer only, like how GSD installs prompts and configs. Study GSD's hook scripts and install pattern before implementing.
- **Hook formats:** Claude Code uses `.claude/settings.json` with `PreToolUse` and `PostToolUse` on `Write|Edit`. Codex uses `.codex/hooks.json`, but `PreToolUse` and `PostToolUse` are Bash-only so the current fallback design is `UserPromptSubmit` plus `Stop`. Copilot uses `.github/hooks/*.json` with `preToolUse` and `postToolUse`, while `agentStop` is the meaningful post-turn hook and `sessionEnd` is cleanup-only. OpenCode uses `.opencode/plugins/codewiki.ts` and plugin events (`tool.execute.before`, `file.edited`, `session.idle`) instead of `opencode.json` hook wiring.
- **Original prompts:** `docs/prompts/create-prd.md`, `generate-tasks.md`, and `process-task-list.md` are the source-text lineage for the `codewiki-prd`, `codewiki-tasks`, and `codewiki-process` skill content.
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
| CLI = installer only, no runtime logic | AI tools natively read markdown; middleware adds complexity without value | Validated in Phases 1-4 |
| Shared hook scripts in `.codewiki/hooks/` | Avoid duplicating shell logic per tool; tool configs or plugins just point to shared scripts | Validated in Phases 2-4 |
| Prompt assets bundled in `dist/templates/` | npm package must be self-contained; read from `import.meta.dirname` at runtime | Validated in Phases 2 and 5 |
| Marker comments `<!-- codewiki:start/end -->` | Safe idempotent merging of instruction file sections | Validated in Phases 2 and 4 |
| Keep `wiki/` as plain markdown | No database, no vendor lock-in; agent reads/writes natively | Validated in Phase 2 |
| Auto-improvement uses dedicated prompts plus `_backlinks.json` | Keeps prompt context small while giving the wiki a shared ranking/maintenance primitive | Validated in Phase 3.1 |
| Generic adapter pipeline powers `init` | Keeps tool-specific install behavior out of the command handler and makes future adapters additive | Validated in Phase 4 |
| Install `session-end.sh` but leave it unwired in Claude | Ships the asset now while waiting for a confirmed Claude lifecycle hook for session completion | Validated in Phase 4 |
| Install surface = eight standalone Skills in a dual-tree layout | Claude requires `.claude/skills/`; Codex, Copilot, and OpenCode use `.agents/skills/`; mixed selections write both | Validated in Phase 4.1 |
| Hook/event strategy follows each vendor's documented runtime | Correctness depends on the host's actual event model, not a uniform abstraction | Canonicalized on 2026-04-13 |

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
*Last updated: 2026-04-13 after canonical hook/event reconciliation*
