# Project Research Summary

**Project:** CodeWiki v2
**Domain:** npm CLI installer for AI coding tool integrations
**Researched:** 2026-04-07
**Confidence:** HIGH (core stack + Claude Code); MEDIUM (Codex/Copilot/OpenCode specifics)

## Executive Summary

CodeWiki v2 is an installer-only CLI that scaffolds a wiki structure and injects AI tool integrations (slash commands, hook scripts, agent definitions, instruction files) into any project. The key architectural insight — validated across all four research threads — is that the CLI does zero runtime AI work. All intelligence lives in markdown prompt files that the installed AI tool executes natively. This makes the TypeScript implementation minimal and stable: it is a file copier and JSON/markdown merger, nothing more.

The recommended approach is a clean-room rewrite of the v1 runtime CLI, replacing it with a thin `src/bin/codewiki.ts` entry point, a per-tool adapter pattern, and a `postbuild` copy step that bundles all markdown/shell templates alongside the compiled JS in `dist/`. The existing `package.json` configuration (`"type": "module"`, `NodeNext` resolution, correct `bin` and `files` fields) is already correct and requires only minor additions. Commander.js provides arg parsing with zero transitive dependencies; all other logic uses Node.js built-ins.

The primary risk cluster is around three inter-related concerns: hook scripts that must always exit 0 to avoid blocking the agent, config merges that must deep-merge without destroying existing user settings, and npm publish that must correctly bundle non-JS template assets. All three have known solutions documented in this research — the risk is implementation discipline, not unknowns. A secondary risk is tool-specific API gaps: Copilot has no confirmed file-based slash command directory, Codex per-project command paths are unconfirmed, and OpenCode has no PreToolUse hook. These gaps mean the Claude Code adapter is the only fully-specified implementation at v1 launch; the other three tools should be added incrementally after validation.

## Key Findings

### Recommended Stack

The existing stack is essentially correct and needs only minor additions. TypeScript with `tsc` compiles to `dist/`; a `postbuild` npm script copies `src/templates/**` to `dist/templates/`. Commander.js v14 handles arg parsing with zero runtime dependencies of its own. `picocolors` provides colored terminal output at 7 kB vs chalk's 101 kB. All file I/O uses Node.js built-ins (`fs.cpSync`, `fs.readFileSync`, `fs.chmodSync`). Template files are located at runtime via `import.meta.dirname` (requires Node >=20.11.0, which should be set in `engines`).

**Core technologies:**
- TypeScript ^5.x + `tsc`: compile language — already configured correctly with NodeNext module resolution
- Node.js >=20.11.0: runtime — enables `import.meta.dirname` without polyfill; v22 LTS recommended
- Commander.js ^14: CLI arg parsing — zero dependencies, ESM-native, 125k+ npm dependents, the standard choice
- `picocolors` ^1.1: terminal color output — 14x smaller than chalk, identical API, zero dependencies
- Node.js built-in `fs`/`path`: all file I/O — `fs.cpSync`, `fs.chmodSync`, `fs.readFileSync` cover every case
- `copyfiles` (devDep): asset bundling — `postbuild` script to copy template assets into `dist/`
- `vitest` (devDep): testing — runs TypeScript directly, 10-20x faster than Jest

**Critical version constraint:** `engines: { "node": ">=20.11.0" }` must be set — `import.meta.dirname` is unavailable before this version.

### Expected Features

The v1 launch scope is well-defined. Auto-detection, idempotent re-runs, merge safety, and a structured install report are table stakes users expect from any scaffolding CLI. Multi-tool support in a single command is the primary differentiator. The key anti-features to resist are runtime CLI commands (ingest/query/lint as TypeScript) and an interactive wizard — both would add complexity that the AI tool already handles natively.

**Must have (table stakes):**
- Auto-detect AI tools present — check for `.claude/`, `.codex/`, `opencode.json`, `.github/copilot-instructions.md`
- `--tool` flag override — explicit control for CI and power users
- Idempotent re-runs — JSON deep-merge, marker-comment sections, no duplicate hooks
- `--force` flag — intentional prompt update path
- Structured install report — `created`, `skipped`, `replaced`, `failed` per file
- `npx codewiki init` zero-install entry point — standard for scaffolding tools

**Should have (competitive differentiators):**
- Multi-tool install in one command — 4 different hook config formats abstracted away
- Shared hook scripts in `.codewiki/hooks/` — one update propagates to all tools
- Pre-hook wiki context injection via hook scripts — the differentiating passive context delivery
- Marker-comment merge for instruction files — safe idempotent appends to CLAUDE.md / AGENTS.md
- System instructions appended to tool instruction files — agent understands wiki pattern without user prompting

**Defer (v2+):**
- `codewiki update` command — re-install prompts in place
- Plugin system for custom page types — wait for page templates to stabilize
- Codex/Copilot/OpenCode adapters — add after Claude Code adapter is validated (Codex and Copilot have research gaps)
- Template auto-update system — creates version conflicts with user customizations

### Architecture Approach

The installer follows a detect-scaffold-adapt-report pipeline. `src/commands/init.ts` orchestrates four distinct phases: detect which tools are present, create the wiki scaffold (always), run per-tool adapters for detected tools, and print a structured report. Each adapter is isolated in `src/adapters/{claude,codex,copilot,opencode}.ts` and responsible for copying prompts, merging hook configs, and appending instruction sections for exactly one tool. Shared infrastructure (JSON deep-merge, markdown marker-merge, asset path resolution, file copy with chmod) lives in `src/lib/`. Template files are not compiled — they are copied verbatim by a `postbuild` npm script from `src/templates/` to `dist/templates/`.

**Major components:**
1. CLI entry (`src/bin/codewiki.ts`) — Commander setup, shebang, routes to init command
2. Tool detector (`src/lib/detect.ts`) — filesystem-based auto-detection of installed AI tools
3. Wiki scaffolder (`src/lib/scaffold.ts`) — creates `wiki/`, `raw/`, `tasks/`, `.codewiki/` with template files
4. Per-tool adapters (`src/adapters/*.ts`) — copy prompts, merge hook JSON, append instruction sections for one tool each
5. Merge utilities (`src/lib/merge.ts`) — deep-merge JSON (no clobber), marker-comment section replace/append
6. Asset locator (`src/lib/assets.ts`) — `import.meta.dirname`-relative template path resolution
7. Reporter (`src/lib/reporter.ts`) — structured per-file install report output
8. Template layer (`src/templates/**`) — markdown prompts, shell scripts, JSON fragments, wiki starter files (not compiled)

### Critical Pitfalls

1. **Template files absent from npm package** — `tsc` does not copy non-JS assets; add `postbuild: cp -r src/templates dist/templates` and verify with `npm pack --dry-run` before every publish. This is the highest-severity pitfall: silent failure, no error, just empty installed files.

2. **Hook scripts exit non-zero, blocking the agent** — Claude Code exit code 2 prevents the tool call entirely. CodeWiki hooks inject context only; wrap every hook in `set +e`, end with unconditional `exit 0`, and test with an empty JSON payload to confirm clean exit in all edge cases including missing `wiki/index.md`.

3. **Config merge clobbers existing user settings** — `Object.assign` or spread replaces entire hook arrays. Implement a `mergeHooks` function that reads existing config, filters out old CodeWiki entries by command path, then appends fresh entries. Never replace a file that may have user content.

4. **Duplicate hook registrations on re-run** — naive append-only merge causes hooks to stack on each `init` call. Use the `.codewiki/hooks/` path as a dedup key: skip if a matching command string already exists. Test: two `init` runs must produce exactly one hook entry.

5. **POSIX incompatibility in hook scripts** — hook scripts must use `#!/bin/sh`, not `#!/bin/bash`. No `[[ ]]`, no `local`, no bash arrays. Ubuntu uses `dash` as `/bin/sh`; bash-specific syntax fails silently on Linux CI. Run `shellcheck --shell=sh` on every hook script.

## Implications for Roadmap

Based on the architecture's build-order dependencies and the pitfall-to-phase mapping, the natural phase structure is:

### Phase 1: Delete v1 Runtime CLI
**Rationale:** The v1 `src/` has runtime commands (ingest, query, lint, prd, tasks, status) that must be deleted before any new code is written. Building adapters on top of v1 artifacts causes confusion and test pollution. This is a clean-slate prerequisite.
**Delivers:** Empty `src/` ready for v2 architecture; passing build with no dead code
**Avoids:** Architecture confusion between v1 runtime logic and v2 installer-only pattern

### Phase 2: Build Shared Infrastructure
**Rationale:** All adapters depend on the merge utilities, asset locator, reporter, and detect module. Building them first lets each adapter be written and tested in isolation. This also forces the `postbuild` copy step to be validated early — not retrofitted at publish time.
**Delivers:** `src/lib/merge.ts`, `src/lib/assets.ts`, `src/lib/detect.ts`, `src/lib/reporter.ts`, `src/lib/scaffold.ts`; `postbuild` script confirmed working
**Uses:** `import.meta.dirname` pattern, `fs.cpSync`, `fs.chmodSync`, inline deep-merge (no third-party)
**Avoids:** Pitfall 1 (template files absent from package) — caught early; Pitfall 3 (config clobber) — merge utility is the spec

### Phase 3: Write Prompt Templates and Hook Scripts
**Rationale:** The adapters copy files — they need the files to exist first. Hook scripts are the riskiest deliverable (three failure modes: exit code discipline, POSIX compatibility, cross-tool JSON schema). Writing and testing hooks as a standalone phase before the init command is wired up reduces debugging surface.
**Delivers:** `src/templates/shared/hooks/pre-wiki-context.sh`, `post-verify.sh`; all 8 slash command `.md` files for Claude Code (6 from Phase 3, 2 added in Phase 3.1); agent definition `.md` files; wiki starter templates; `settings-fragment.json`
**Avoids:** Pitfall 2 (hook exit codes) — tested in isolation before wiring; Pitfall 6 (POSIX bashisms) — shellcheck gating; Pitfall 7 (JSON schema divergence) — test with sample payloads per tool

### Phase 4: Claude Code Adapter + init Command
**Rationale:** Claude Code is the most mature tool with fully confirmed hook format, command paths, and agent support. Building the Claude Code adapter first validates the entire installer pattern before tackling tools with research gaps. The init command orchestration is built here too, since Claude Code is the only fully-specified adapter at v1.
**Delivers:** Working `npx codewiki init` that installs wiki scaffold + Claude Code integration; `--tool`, `--force`, `--name` flags; structured install report; idempotent re-runs
**Implements:** Per-tool adapter pattern; detect-scaffold-adapt-report flow
**Avoids:** Pitfall 3 (config clobber), Pitfall 4 (duplicate hooks), Pitfall 5 (duplicate instruction blocks), Pitfall 8 (missing chmod)

### Phase 5: Tests
**Rationale:** Tests are the specification for merge correctness and idempotency. The "looks done but isn't" checklist from PITFALLS.md maps directly to required test cases. Tests must cover: existing hooks survive init, two init runs produce one hook entry, `CLAUDE.md` marker appears exactly once, hook exits 0 with empty payload, `npm pack --dry-run` lists template assets.
**Delivers:** vitest suite covering scaffold, merge utilities, Claude Code adapter, idempotency, and npm pack validation
**Uses:** vitest (replaces node --test)
**Avoids:** All critical pitfalls — test coverage is the enforcement mechanism

### Phase 6: OpenCode Adapter
**Rationale:** OpenCode is architecturally similar to Claude Code (similar command/agent file paths) but requires a fundamentally different hook strategy — no PreToolUse, only `session_completed`. Adding it as a separate phase after Claude Code is validated reduces risk and makes the capability difference explicit.
**Delivers:** OpenCode adapter with `session_completed`-only hook config; `.opencode/commands/*.md` and `.opencode/agents/*.md` installed
**Avoids:** Pitfall 9 (creating broken PreToolUse config for OpenCode)

### Phase 7: Codex + Copilot Adapters (post-validation)
**Rationale:** Both tools have unresolved research gaps: Codex per-project command path is unconfirmed, Copilot has no confirmed slash command file directory. These adapters should be written after the Claude Code pattern is battle-tested and the gaps are resolved via spikes.
**Delivers:** Codex adapter (after per-project command path spike); Copilot adapter (instruction-file-only if slash command directory unconfirmed)
**Research flags:** Both adapters need a spike before implementation to confirm command installation paths

### Phase 8: npm Publish Hardening
**Rationale:** Final validation before any public release — `npm pack --dry-run` audit, `engines` field, README, version bump. This phase exists to catch publish-time surprises that tests cannot catch.
**Delivers:** Published npm package working via `npx codewiki init`; confirmed `dist/templates/` in tarball
**Avoids:** Pitfall 1 (template files missing from published package) — final gate

### Phase Ordering Rationale

- **Delete before build:** v1 runtime code creates false confidence that `init` exists. Remove it first so every subsequent phase builds on solid ground.
- **Infrastructure before adapters:** Merge utilities and asset locator are shared dependencies; building them first prevents duplicated logic across adapters.
- **Templates before init:** The init command is a file installer — it needs the files before it can be tested end-to-end.
- **Claude Code first:** Fully specified, locally verifiable (GSD install pattern confirmed working). Use it to validate the adapter pattern before tackling tools with gaps.
- **Tests as a phase:** The merge and idempotency requirements are complex enough that test cases function as a specification. Testing as a phase (not an afterthought) prevents the "looks done but isn't" failure mode documented in PITFALLS.md.
- **Codex/Copilot last:** Research gaps make premature implementation risky. Add after validation, not in parallel.

### Research Flags

Phases likely needing a research spike during planning:
- **Phase 7 (Codex adapter):** Codex per-project command path (`.codex/prompts/`) is unconfirmed vs. global-only (`~/.codex/prompts/`). Must spike before implementing.
- **Phase 7 (Copilot adapter):** No confirmed file-based custom slash command directory. Copilot hook support is a Preview feature. Verify current state before planning this adapter.
- **Phase 3 (hook scripts):** Cross-tool JSON payload shapes (Codex, OpenCode) are MEDIUM confidence. Requires sample payload testing before finalizing hook script field parsing.

Phases with standard patterns (skip research phase):
- **Phase 1 (delete v1):** Destructive change, no research needed — just delete.
- **Phase 2 (shared infrastructure):** Deep-merge, marker-comment merge, and `import.meta.dirname` asset location are fully documented with working code examples in this research.
- **Phase 4 (Claude Code adapter):** Hook format, command paths, agent paths, and settings merge format are HIGH confidence with confirmed working GSD local install as reference.
- **Phase 5 (tests):** vitest setup is standard; test cases are specified in PITFALLS.md checklist.
- **Phase 8 (npm publish):** Standard npm publish checklist; no novel surface area.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is already correct. Commander.js, picocolors, vitest, and `postbuild` copy step are well-documented with zero ambiguity. |
| Features | HIGH (Claude Code); MEDIUM (others) | Claude Code feature set is fully specified. Codex per-project command path and Copilot slash command directory are unconfirmed. OpenCode hook limitations confirmed. |
| Architecture | HIGH | Architecture is fully derived from PRD, implementation plan, and confirmed GSD local install patterns. All component boundaries and data flows are specified. |
| Pitfalls | HIGH (Claude Code + npm); MEDIUM (Codex/OpenCode) | Claude Code hook exit code semantics confirmed. Merge correctness patterns confirmed. Cross-tool JSON payload divergence is MEDIUM — requires per-tool payload testing. |

**Overall confidence:** HIGH for v1 scope (Claude Code + shared infrastructure). MEDIUM for Codex/Copilot adapters due to documentation gaps.

### Gaps to Address

- **Codex per-project command path:** Is `.codex/prompts/<name>.md` valid per-project, or global-only (`~/.codex/prompts/`)? Spike required before Phase 7. If global-only, Codex slash commands cannot be installed per-project — the Codex adapter ships with hooks + instruction file only.
- **Copilot file-based slash command directory:** No `.github/commands/` equivalent confirmed. If absent, Copilot adapter ships with hooks + `.github/copilot-instructions.md` append only. Verify against current Copilot Agent Mode documentation before Phase 7.
- **Cross-tool hook JSON payload shapes:** Codex and OpenCode `file_edited` payload schemas are MEDIUM confidence. Test with actual tool invocations before finalizing hook script field parsing in Phase 3.
- **Claude Code stdout format for context injection:** Research confirms stdout is injected as `additionalContext`, but the exact JSON envelope (plain text vs. `{ "additionalContext": "..." }`) should be verified against GSD's working hook before Phase 3 implementation.

## Sources

### Primary (HIGH confidence)
- GSD local install at `/home/giuice/.claude/settings.json` — Claude Code hook format confirmed working
- Claude Code hooks official documentation — exit code semantics, JSON stdin format, `additionalContext` stdout
- `docs/codewiki-project-v2.md` — PRD with architecture diagrams (project internal)
- `docs/implementation-plan-v2.md` — detailed task breakdown (project internal)
- npm package.json `files` field documentation — publish whitelist behavior confirmed
- Node.js ESM docs — `import.meta.dirname` availability from v20.11.0

### Secondary (MEDIUM confidence)
- Codex hooks documentation — `hooks.json` format and stdin protocol (API still evolving)
- OpenCode config documentation — `experimental.hooks` with `file_edited` and `session_completed`
- Copilot hooks documentation — `.github/hooks/*.json` format with `"version": 1` (Preview feature)
- Commander.js npm page — zero dependencies confirmed, v14.0.3 current
- picocolors npm page — 7 kB, zero deps, 14x smaller than chalk

### Tertiary (LOW confidence)
- Codex per-project command path (`.codex/prompts/`) — mentioned in community sources; official docs reference global only; needs validation spike

---
*Research completed: 2026-04-07*
*Ready for roadmap: yes*
