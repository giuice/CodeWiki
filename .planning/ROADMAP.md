# Roadmap: CodeWiki v2

## Overview

CodeWiki v2 rewrites the v1 runtime CLI as a pure installer/scaffolder. The journey starts with deleting all v1 runtime code, builds shared infrastructure that every adapter depends on, writes all template files (the riskiest deliverable), wires up the Claude Code adapter to validate the full install pattern end-to-end, hardens the implementation with tests, then adds OpenCode, Codex, and Copilot adapters incrementally. The final phase hardens the npm publish so `npx codewiki init` works reliably with all template assets bundled.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Clean Slate** - Delete v1 runtime CLI; empty src/ ready for v2
- [x] **Phase 2: Shared Infrastructure** - Merge utils, scaffold, asset locator, reporter, detector
- [x] **Phase 3: Prompt Templates and Hook Scripts** - All markdown prompts, agent definitions, hook scripts
- [x] **Phase 3.1: Auto-Improvement Engine** - absorb, breakdown, backlinks, session-end hook (INSERTED)
- [x] **Phase 4: Claude Code Adapter + init Command** - Full end-to-end install via npx codewiki init
- [ ] **Phase 4.1: Skills Migration** - Umbrella corrective phase split into atomic skill/template, adapter, test, and doc sub-phases (INSERTED)
- [x] **Phase 4.1.1: Skill Template Source** - Move the eight source templates into per-skill SKILL.md directories and preserve prompt behavior (INSERTED)
- [ ] **Phase 4.1.2: Adapter Skill Install Paths** - Install skills into .claude/skills and conditional .agents/skills trees (INSERTED)
- [ ] **Phase 4.1.3: Skills Regression Coverage** - Update init and pack verification to assert skill-based install surfaces (INSERTED)
- [ ] **Phase 4.1.4: Planning Docs Canon Refresh** - Align roadmap, requirements, state, and active planning artifacts to the skills canon (INSERTED)
- [ ] **Phase 4.1.5: Product Docs Canon Refresh** - Align README, implementation docs, and handoff docs to the skills canon (INSERTED)
- [x] **Phase 5: Test Suite** - Merge correctness, idempotency, and npm pack coverage
- [ ] **Phase 6: OpenCode Adapter** - session_completed-only hook strategy; commands and agents
- [ ] **Phase 7: Codex and Copilot Adapters** - Post-spike adapters for tools with research gaps
- [ ] **Phase 8: npm Publish Hardening** - Build script, pack verification, engines field, README

## Phase Details

### Phase 1: Clean Slate
**Goal**: v1 runtime CLI is deleted; the repository contains only scaffolding-relevant code and the build compiles cleanly
**Depends on**: Nothing (first phase)
**Requirements**: (no v1 requirements map here — this is a prerequisite cleanup)
**Success Criteria** (what must be TRUE):
  1. `src/commands/` contains no v1 runtime files (ingest.ts, query.ts, lint.ts, prd.ts, tasks.ts, status.ts are gone)
  2. `npm run build` completes without errors on the cleaned codebase
  3. No v1 test files or fixtures reference deleted commands
  4. `src/` directory structure is ready to receive v2 adapter and lib files
**Plans:** 1 plan
Plans:
- [x] 01-01-PLAN.md — Delete v1 runtime code, prune orphaned modules, update cli.ts, verify build

### Phase 2: Shared Infrastructure
**Goal**: All shared library modules exist and are individually testable; the postbuild copy step is confirmed working
**Depends on**: Phase 1
**Requirements**: WIKI-01, WIKI-02, WIKI-03, WIKI-04, WIKI-05, MERGE-01, MERGE-02, MERGE-03, MERGE-04
**Success Criteria** (what must be TRUE):
  1. `src/lib/merge.ts` deep-merges two JSON objects without clobbering any existing user keys
  2. `src/lib/scaffold.ts` creates the full wiki directory tree (wiki/entities, decisions, lessons, issues, sources, raw, tasks, .codewiki/config.yml, .codewiki/templates/) when called
  3. `src/lib/detect.ts` returns correct tool names when `.claude/`, `.codex/`, `opencode.json`, or `.github/copilot-instructions.md` are present in a directory
  4. `npm run build` followed by `ls dist/templates/` shows template files were copied by the postbuild step
  5. `src/lib/reporter.ts` prints a structured created/skipped/replaced/failed report to stdout
**Plans:** 3 plans
Plans:
- [x] 02-01-PLAN.md — Merge utilities (deepMerge, marker merge) + vitest setup
- [x] 02-02-PLAN.md — Scaffold wrapper, tool detection, install reporter
- [x] 02-03-PLAN.md — Barrel export, postbuild copy, integration verification

### Phase 3: Prompt Templates and Hook Scripts
**Goal**: All markdown prompt files, agent definitions, and hook scripts exist in src/templates/ and are individually verifiable
**Depends on**: Phase 2
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06, CMD-07, HOOK-01, HOOK-02, HOOK-03, HOOK-04, HOOK-05, AGENT-01, AGENT-02
**Success Criteria** (what must be TRUE):
  1. Six slash command files exist in `src/templates/` with `description:` frontmatter and correct instruction content derived from source prompts
  2. `pre-wiki-context.sh` reads wiki/index.md and outputs context to stdout; exits 0 even when wiki/index.md does not exist
  3. `post-verify.sh` exits 0 under all conditions including empty JSON payload input
  4. `shellcheck --shell=sh` passes on both hook scripts with zero warnings
  5. Both agent definition markdown files (`codewiki-wiki-updater`, `codewiki-verifier`) exist in `src/templates/` with complete instruction content
**Plans:** 3 plans
Plans:
- [x] 03-01-PLAN.md -- Create 6 slash command markdown files (ingest, query, lint, prd, tasks, process)
- [x] 03-02-PLAN.md -- Create 2 hook scripts (pre-wiki-context.sh, post-verify.sh)
- [x] 03-03-PLAN.md -- Create 2 agent definitions (wiki-updater, verifier)

### Phase 03.1: Auto-Improvement Engine (INSERTED)

**Goal**: Wiki auto-improves after every coding session — absorb extracts knowledge from changes, breakdown finds gaps, backlinks enable importance ranking, session-end hook triggers capture automatically
**Depends on**: Phase 3
**Requirements**: ABS-01 (absorb command), ABS-02 (breakdown command), ABS-03 (backlinks index), ABS-04 (session-end hook), ABS-05 (post-hook active trigger)
**Success Criteria** (what must be TRUE):
  1. `src/templates/claude/commands/codewiki/absorb.md` exists with instructions to extract knowledge from recent git changes, cross-reference wiki, propose updates with anti-cramming/anti-thinning rules
  2. `src/templates/claude/commands/codewiki/breakdown.md` exists with instructions to find referenced-but-undocumented entities, rank by backlink count, propose new pages
  3. `wiki/_backlinks.json` is included in the scaffold (empty initial state `{}`), and absorb/ingest/lint prompts reference it
  4. `src/templates/hooks/session-end.sh` exists, passes `shellcheck --shell=sh`, exits 0 on empty input, and outputs session summary context
  5. `src/templates/hooks/post-verify.sh` is updated to output structured change context that triggers wiki-updater agent (not just a reminder)
  6. Existing ingest, query, and lint prompts are updated to reference `wiki/_backlinks.json`
**Plans:** 3/3 plans complete

Plans:
- [x] 03.1-01-PLAN.md — Create absorb.md and breakdown.md slash commands
- [x] 03.1-02-PLAN.md — Add _backlinks.json to scaffold, create session-end.sh, update post-verify.sh
- [x] 03.1-03-PLAN.md — Update ingest, lint, query prompts to reference _backlinks.json

### Phase 4: Claude Code Adapter + init Command
**Goal**: `npx codewiki init` installs the wiki scaffold and Claude Code integration into a real project; re-running produces identical state
**Depends on**: Phase 3.1
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07, CC-01, CC-02, CC-03, CC-04, CC-05
**Success Criteria** (what must be TRUE):
  1. Running `npx codewiki init` in a project with `.claude/` present creates all wiki directories, installs 8 slash commands to `.claude/commands/codewiki/`, installs 2 agents to `.claude/agents/`, and prints a structured install report
  2. Running `npx codewiki init --tool claude-code` on a project that also has `.codex/` installs only the Claude Code adapter (not Codex)
  3. Running `npx codewiki init` twice without `--force` produces no duplicate hook entries in `.claude/settings.json` and no duplicate `<!-- codewiki:start -->` blocks in `CLAUDE.md`
  4. Running `npx codewiki init --force` replaces existing CodeWiki marker sections in `CLAUDE.md` without touching content outside the markers
  5. Running `npx codewiki init` on a project with existing `.claude/settings.json` hooks preserves those hooks alongside the newly added CodeWiki hooks
**Plans:** 3/3 plans complete
Plans:
- [x] 04-01-PLAN.md — Adapter infrastructure (types, base helpers, registry, sectioned reporter)
- [x] 04-02-PLAN.md — Claude Code adapter (8 commands, 2 agents, 3 hooks, settings.json merge, CLAUDE.md merge)
- [x] 04-03-PLAN.md — Rewrite init.ts (detection, interactive fallback, scaffold, adapter orchestration)

### Phase 4.1: Skills Migration (INSERTED)

**Goal**: Replace the shipped slash-command install surface with the verified eight-skill canon across templates, adapters, tests, and docs without violating GSD atomicity
**Requirements**: SM-01, SM-02, SM-03, SM-04, SM-05, SM-06
**Depends on:** Phase 4
**Planning Note**: This umbrella phase is executed through child phases 4.1.1-4.1.5 because the local GSD parser supports chained decimals like 4.1.1 but not suffixes like 4.1a. Use `/create-skill` as a reference for metadata quality and structure, not as a generator.
**Canonical Refs**: `docs/codewiki-project-v2.md`, `docs/skills-migration-handoff.md`, `docs/skills/wiki.md`
**Plans:** 0 direct plans / 5 child phases

Plans:
- [x] 4.1.1 — Skill Template Source
- [ ] 4.1.2 — Adapter Skill Install Paths
- [ ] 4.1.3 — Skills Regression Coverage
- [ ] 4.1.4 — Planning Docs Canon Refresh
- [ ] 4.1.5 — Product Docs Canon Refresh

### Phase 4.1.1: Skill Template Source (INSERTED)

**Goal**: The eight CodeWiki source templates live under `src/templates/skills/codewiki-<name>/SKILL.md` with skill-native frontmatter and unchanged prompt intent
**Depends on**: Phase 4
**Requirements**: SM-01
**Success Criteria** (what must be TRUE):
  1. Eight files exist under `src/templates/skills/codewiki-<name>/SKILL.md` for ingest, query, lint, absorb, breakdown, prd, tasks, and process
  2. Each migrated file has `name` and `description` frontmatter suitable for skill discovery; skills with required positional input also define `argument-hint`
  3. The migrated files preserve the existing prompt purpose/process behavior from the old command templates
  4. The legacy files in `src/templates/claude/commands/codewiki/` are no longer the source of truth for the migrated skills
**Plans:** 4 plans
Plans:
- [x] 04.1.1-01-PLAN.md — Migrate ingest and query into skill directories
- [x] 04.1.1-02-PLAN.md — Migrate lint and absorb into skill directories
- [x] 04.1.1-03-PLAN.md — Migrate breakdown and prd into skill directories
- [x] 04.1.1-04-PLAN.md — Migrate tasks and process into skill directories

### Phase 4.1.2: Adapter Skill Install Paths (INSERTED)

**Goal**: Installer code copies the shared skill templates into the correct Claude and non-Claude skill trees without changing hook or agent behavior
**Depends on**: Phase 4.1.1
**Requirements**: SM-02, SM-03
**Success Criteria** (what must be TRUE):
  1. `npx codewiki init --tool claude-code` installs `.claude/skills/codewiki-<name>/SKILL.md` for all eight skills
  2. Tool selections including Codex, Copilot, or OpenCode install the same eight skills into `.agents/skills/codewiki-<name>/SKILL.md`
  3. Claude-only installs do not create a redundant `.agents/skills/` tree
  4. Hook wiring, agent installation, and instruction-file merging remain unchanged by the skill-path migration
**Plans:** 3 plans
Plans:
- [x] 04.1.2-01-PLAN.md — Repoint Claude adapter from command assets to `.claude/skills`
- [ ] 04.1.2-02-PLAN.md — Add the shared `.agents/skills` installer for non-Claude selections
- [ ] 04.1.2-03-PLAN.md — Update init reporting for combined skill installs and pending non-Claude integrations

### Phase 4.1.3: Skills Regression Coverage (INSERTED)

**Goal**: Regression tests and packaging verification prove the new skill install paths and bundled template assets
**Depends on**: Phase 4.1.2
**Requirements**: SM-04
**Success Criteria** (what must be TRUE):
  1. Init regression coverage asserts skill directories instead of command directories
  2. Pack coverage asserts `dist/templates/skills/codewiki-ingest/SKILL.md` appears in the tarball file list
  3. The migration does not weaken existing idempotency or hook-coverage guarantees
**Plans:** 0 plans
Plans:
- [ ] TBD (run /gsd-plan-phase 4.1.3)

### Phase 4.1.4: Planning Docs Canon Refresh (INSERTED)

**Goal**: Planning artifacts describe the skills canon and the parser-safe atomic sub-phase split accurately
**Depends on**: Phase 4.1.3
**Requirements**: SM-05
**Success Criteria** (what must be TRUE):
  1. `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, and `.planning/STATE.md` describe the split phase structure and skill canon consistently
  2. Traceability exists for SM-01 through SM-06
  3. Active phase contexts/plans no longer instruct future work to use unsupported `4.1a` numbering or slash-command canon language
**Plans:** 0 plans
Plans:
- [ ] TBD (run /gsd-plan-phase 4.1.4)

### Phase 4.1.5: Product Docs Canon Refresh (INSERTED)

**Goal**: User-facing and implementation docs describe skill-based installs and the dual-tree adapter rules consistently
**Depends on**: Phase 4.1.3
**Requirements**: SM-06
**Success Criteria** (what must be TRUE):
  1. README and implementation docs describe skills rather than slash commands as the install surface
  2. Handoff and reference docs describe the dual-tree install rules for `.claude/skills/` and `.agents/skills/`
  3. Project docs do not describe obsolete command directories as the source of truth
**Plans:** 0 plans
Plans:
- [ ] TBD (run /gsd-plan-phase 4.1.5)

### Phase 5: Test Suite
**Goal**: vitest suite covers merge correctness, idempotency, and npm pack asset inclusion; tests are the living spec for merge behavior
**Depends on**: Phase 4
**Requirements**: BUILD-01, BUILD-02
**Success Criteria** (what must be TRUE):
  1. `npm test` passes with tests covering: JSON deep-merge preserves existing keys, duplicate hook deduplication, markdown marker-section replace/append, scaffold creates expected directory tree
  2. A test simulating two consecutive `init` runs on a project asserts exactly one CodeWiki hook entry exists in `.claude/settings.json` after both runs
  3. A test runs `npm pack --dry-run` and asserts `dist/templates/claude/commands/codewiki/ingest.md` appears in the file list
  4. Hook script tests assert exit code 0 for both scripts when called with an empty JSON payload and when `wiki/index.md` is absent
**Plans:** 1 plan
Plans:
- [x] 05-01-PLAN.md — Add pack tarball test (BUILD-02) and session-end empty-JSON-payload edge case

### Phase 6: OpenCode Adapter
**Goal**: `npx codewiki init` on a project with `opencode.json` installs slash commands, agents, and a session_completed hook (no PreToolUse)
**Depends on**: Phase 5
**Requirements**: OC-01, OC-02, OC-03, OC-04
**Success Criteria** (what must be TRUE):
  1. Running `npx codewiki init` on a project with `opencode.json` installs 8 slash commands to `.opencode/commands/codewiki/` and 2 agents to `.opencode/agents/`
  2. The resulting `opencode.json` contains a `session_completed` hook entry pointing to `.codewiki/hooks/post-verify.sh` and no PreToolUse entry
  3. Re-running `npx codewiki init` twice does not create duplicate hook entries in `opencode.json` or duplicate marker sections in `AGENTS.md`
  4. Running `npx codewiki init --tool opencode` on a project without `opencode.json` still installs the OpenCode adapter (explicit flag overrides detection)
**Plans:** 2 plans
Plans:
- [ ] 06-01-PLAN.md — Create OpenCode command, agent, and AGENTS.md template assets
- [ ] 06-02-PLAN.md — Implement the OpenCode adapter, init wiring, and idempotent regression coverage

### Phase 7: Codex and Copilot Adapters
**Goal**: Codex and Copilot adapters are implemented after per-tool command path and hook format are confirmed via spikes
**Depends on**: Phase 6
**Requirements**: CODEX-01, CODEX-02, CODEX-03, COP-01, COP-02, COP-03
**Success Criteria** (what must be TRUE):
  1. Running `npx codewiki init` on a project with `.codex/` present merges CodeWiki hooks into Codex hook config without clobbering existing hooks, and appends instructions to `AGENTS.md` using marker comments
  2. Running `npx codewiki init` on a project with `.github/copilot-instructions.md` creates `.github/hooks/codewiki-hooks.json` with `"version": 1` and appends to `.github/copilot-instructions.md` using marker comments
  3. If Codex per-project command path is confirmed, 6 slash commands are installed to that directory; if global-only, the install report notes the limitation
  4. If Copilot has no confirmed slash command directory, the install report documents the limitation rather than silently skipping
**Plans:** TBD
Plans:
- [ ] TBD

### Phase 8: npm Publish Hardening
**Goal**: The package publishes to npm correctly and `npx codewiki init` works in a fresh project with all prompt files present in the tarball
**Depends on**: Phase 7
**Requirements**: BUILD-03, BUILD-04
**Success Criteria** (what must be TRUE):
  1. `npm pack --dry-run` output includes `dist/templates/claude/commands/ingest.md` and all other template files
  2. `package.json` has `engines: { "node": ">=20.11.0" }` and zero runtime dependencies (Commander.js and optional picocolors only)
  3. Running `npx codewiki@latest init` in a clean temporary directory (no global install) completes successfully and creates the wiki scaffold
  4. README documents the four supported tools, their hook strategies, and the `--tool`, `--force`, `--name` flags
**Plans:** TBD
Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.1 -> 4 -> 4.1.1 -> 4.1.2 -> 4.1.3 -> 4.1.4 -> 4.1.5 -> 5 -> 6 -> 7 -> 8
Phase 4.1 is an umbrella corrective phase tracked through child phases 4.1.1-4.1.5.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Clean Slate | 1/1 | Complete | 2026-04-07 |
| 2. Shared Infrastructure | 3/3 | Complete | 2026-04-07 |
| 3. Prompt Templates and Hook Scripts | 3/3 | Complete | 2026-04-08 |
| 3.1 Auto-Improvement Engine (INSERTED) | 3/3 | Complete | 2026-04-08 |
| 4. Claude Code Adapter + init Command | 3/3 | Complete | 2026-04-08 |
| 4.1 Skills Migration (INSERTED) | 1/5 child phases | In progress | 2026-04-12 |
| 4.1.1 Skill Template Source (INSERTED) | 4/4 | Complete | 2026-04-12 |
| 4.1.2 Adapter Skill Install Paths (INSERTED) | 0/3 | Planned | - |
| 4.1.3 Skills Regression Coverage (INSERTED) | 0/0 | Not started | - |
| 4.1.4 Planning Docs Canon Refresh (INSERTED) | 0/0 | Not started | - |
| 4.1.5 Product Docs Canon Refresh (INSERTED) | 0/0 | Not started | - |
| 5. Test Suite | 1/1 | Complete | 2026-04-10 |
| 6. OpenCode Adapter | 0/2 | Not started | - |
| 7. Codex and Copilot Adapters | 0/TBD | Not started | - |
| 8. npm Publish Hardening | 0/TBD | Not started | - |
