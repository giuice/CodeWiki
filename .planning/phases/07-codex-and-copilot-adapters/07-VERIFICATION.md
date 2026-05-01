---
phase: 07-codex-and-copilot-adapters
verified: 2026-05-01T17:06:04Z
status: passed
score: 10/10 must-haves verified
overrides_applied: 0
---

# Phase 7: Codex and Copilot Adapters Verification Report

**Phase Goal:** Codex and Copilot adapters layer their tool-specific hooks and instruction integration on top of the already-shipped shared `.agents/skills` tree.
**Verified:** 2026-05-01T17:06:04Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CODEX-01: Codex uses the shared `.agents/skills` tree and does not create a Codex-specific skill tree. | VERIFIED | `src/lib/adapters/index.ts:4` includes `codex` in shared-skill tools; `resolveAdapters()` adds shared skills once before the Codex adapter at `src/lib/adapters/index.ts:42-50`; integration tests assert `.agents/skills` exists and `.claude/skills` does not for Codex-only installs at `test/init.test.ts:206-207`. |
| 2 | CODEX-02: Codex hook wiring enables `codex_hooks`, prompt context, edit guardrails, post-verify JSON, and loop-safe Stop. | VERIFIED | `src/templates/codex/config.toml` contains `[features] codex_hooks = true`; `src/templates/codex/hooks.json:3-50` wires `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and `Stop`; wrappers route shared scripts and JSON outputs in `src/templates/codex/hooks/post-tool-use.sh:25-42` and `src/templates/codex/hooks/stop.sh:25-47`. |
| 3 | CODEX-03: Codex instruction and TOML agent integration is installed through marker-managed `AGENTS.md` without clobbering user text. | VERIFIED | `CodexAdapter` installs `.codex/agents` and merges `AGENTS.md` via `mergeMarkerSection()` at `src/lib/adapters/codex.ts:96-106` and `src/lib/adapters/codex.ts:198-214`; tests preserve existing `AGENTS.md` text and keep one marker block at `test/init.test.ts:245-252`. |
| 4 | COP-01: Copilot installs a real hook surface with versioned hook config and wrappers. | VERIFIED | `src/templates/copilot/hooks/codewiki-hooks.json:1-37` has `"version": 1` and `preToolUse`, `postToolUse`, `agentStop`, `sessionEnd`; `CopilotAdapter` installs `.github/hooks/codewiki` and `.github/hooks/codewiki-hooks.json` at `src/lib/adapters/copilot.ts:38-46` and `src/lib/adapters/copilot.ts:93-112`. |
| 5 | COP-02: Copilot documents and implements `agentStop` as meaningful post-turn follow-up while `sessionEnd` remains cleanup-only. | VERIFIED | Hook config wires `agentStop` to `.github/hooks/codewiki/agent-stop.sh` and `sessionEnd` to cleanup command at `src/templates/copilot/hooks/codewiki-hooks.json:20-34`; wrapper comments and loop guards are in `src/templates/copilot/hooks/agent-stop.sh:2-5` and `src/templates/copilot/hooks/agent-stop.sh:38-58`; instructions state the lifecycle split at `src/templates/copilot/instructions.md:19-22`. |
| 6 | COP-03: Copilot uses only the shared `.agents/skills` CodeWiki skill tree. | VERIFIED | `src/lib/adapters/index.ts:4` includes `copilot` in shared-skill tools; Copilot instructions reference `.agents/skills` at `src/templates/copilot/instructions.md:3`; tests assert `.agents/skills` exists and `.claude/skills` does not for Copilot-only installs at `test/init.test.ts:273-274`, and template tests reject `.github/skills`. |
| 7 | Roadmap SC1: Auto-detected `.codex/` init preserves shared skills, merges hooks/config, and appends marker-managed `AGENTS.md`. | VERIFIED | `src/lib/detect.ts:9-13` detects `.codex`; `CodexAdapter` deep-merges hook JSON and deduplicates event entries at `src/lib/adapters/codex.ts:140-170`, merges config at `src/lib/adapters/codex.ts:176-192`, and merges instructions at `src/lib/adapters/codex.ts:198-214`; behavioral spot-check against compiled CLI passed for `.codex/` auto-detection. |
| 8 | Roadmap SC2: Codex hook wiring uses the required event names, matchers, root resolution, and Codex JSON wrappers. | VERIFIED | `src/templates/codex/hooks.json:3-50` uses `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, matcher `Edit|Write|apply_patch`, and `git rev-parse --show-toplevel`; `post-tool-use.sh:41-42` emits `hookSpecificOutput` with `hookEventName`; `stop.sh:29-47` respects `stop_hook_active` and emits block JSON only when shared output exists. |
| 9 | Roadmap SC3: Auto-detected Copilot init creates `.github/hooks/codewiki-hooks.json`, appends instructions, and documents `agentStop`/`sessionEnd` lifecycle. | VERIFIED | `src/lib/detect.ts:13` detects `.github/copilot-instructions.md`; `CopilotAdapter` writes `.github/hooks/codewiki-hooks.json` and merges instructions at `src/lib/adapters/copilot.ts:93-134`; behavioral spot-check against compiled CLI passed for Copilot auto-detection. |
| 10 | Roadmap SC4: Mixed `claude-code,codex` and `claude-code,copilot` selections write both `.claude/skills` and `.agents/skills` exactly once. | VERIFIED | `resolveAdapters()` adds `SharedSkillsAdapter` once for shared-skill tools at `src/lib/adapters/index.ts:40-45`; tests assert both trees for Claude+Codex at `test/init.test.ts:318-357`, both trees exactly once for Claude+Copilot at `test/init.test.ts:359-373`, and all adapters together at `test/init.test.ts:375-392`. |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/templates/codex/hooks.json` | Codex event hook config | VERIFIED | Contains `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `Edit|Write|apply_patch`, and repository root resolution. |
| `src/templates/codex/config.toml` | Codex feature flag template | VERIFIED | Contains `[features] codex_hooks = true`. |
| `src/templates/codex/hooks/*.sh` | Codex wrappers around shared hooks | VERIFIED | Prompt, guardrail, post-verify, and Stop wrappers are substantive and referenced by hook config. |
| `src/templates/codex/agents/*.toml` | Codex updater/verifier roles | VERIFIED | TOML agents contain `developer_instructions`, approval-gated updater guidance, and read-only verifier guidance. |
| `src/templates/codex/instructions.md` | Marker-managed `AGENTS.md` block body | VERIFIED | References shared `.agents/skills`, hook strategy, agents, config, and wiki paths. |
| `src/lib/adapters/codex.ts` | Real Codex adapter | VERIFIED | Installs hooks/agents, chmods wrapper scripts, merges `.codex/hooks.json`, merges `.codex/config.toml`, and marker-merges `AGENTS.md`. |
| `src/templates/copilot/hooks/codewiki-hooks.json` | Copilot hook config | VERIFIED | Contains `"version": 1`, `preToolUse`, `postToolUse`, `agentStop`, and cleanup-only `sessionEnd`. |
| `src/templates/copilot/hooks/*.sh` | Copilot wrappers around shared hooks | VERIFIED | Pre/post tool wrappers and loop-safe `agent-stop.sh` are substantive and referenced by hook config. |
| `src/templates/copilot/instructions.md` | Marker-managed Copilot instruction block body | VERIFIED | References shared `.agents/skills`, hook config, lifecycle behavior, config, and wiki paths; no `.github/skills`. |
| `src/lib/adapters/copilot.ts` | Real Copilot adapter | VERIFIED | Installs hook wrappers/config, chmods scripts, and marker-merges `.github/copilot-instructions.md`. |
| `src/lib/adapters/index.ts` | Adapter resolution | VERIFIED | Registers Codex and Copilot adapters while sharing one `.agents/skills` install for Codex/Copilot/OpenCode. |
| `test/init.test.ts` and template tests | Regression coverage | VERIFIED | Full `rtk npm test` passed with 16 compiled tests and 105 Vitest tests. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `initCommand()` | `resolveAdapters()` | `src/commands/init.ts:103-108` | WIRED | Init resolves selected/detected tools, then calls each adapter install and reports adapter sections. |
| `resolveAdapters()` | Shared skills plus Codex/Copilot adapters | `src/lib/adapters/index.ts:4-50` | WIRED | Shared skills are added once before tool-specific adapter factories. |
| `CodexAdapter` | Codex templates | `src/lib/adapters/codex.ts:89-106`, `140-214` | WIRED | Hook scripts, agents, hook JSON, config, and instructions all flow from templates into project paths. |
| `CopilotAdapter` | Copilot templates | `src/lib/adapters/copilot.ts:51-67`, `93-134` | WIRED | Hook wrapper scripts, hook config, and instruction block flow from templates into `.github/`. |
| Codex hook config | Codex wrappers | `src/templates/codex/hooks.json:7-45` | WIRED | Commands invoke `.codex/hooks/user-prompt-submit.sh`, `pre-tool-use.sh`, `post-tool-use.sh`, and `stop.sh`. |
| Copilot hook config | Copilot wrappers | `src/templates/copilot/hooks/codewiki-hooks.json:4-31` | WIRED | Commands invoke `.github/hooks/codewiki/pre-tool-use.sh`, `post-tool-use.sh`, `agent-stop.sh`, and cleanup-only `.codewiki/hooks/session-end.sh`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/lib/adapters/codex.ts` | `existingHooksConfig`, `templateHooksConfig` | Reads existing `.codex/hooks.json` and `src/templates/codex/hooks.json` at `src/lib/adapters/codex.ts:147-150` | Yes | FLOWING - merged with `deepMerge()` and event-level deduplication, then written back. |
| `src/lib/adapters/codex.ts` | `existingText`, `templateText` for config/instructions | Reads `.codex/config.toml`, Codex config template, `AGENTS.md`, and instruction template at `src/lib/adapters/codex.ts:181-207` | Yes | FLOWING - existing text is preserved/updated, not replaced with static empty output. |
| `src/lib/adapters/copilot.ts` | Hook wrapper filenames | Reads actual template directory via `readdir()` at `src/lib/adapters/copilot.ts:24-29` and copies each `.sh` at `src/lib/adapters/copilot.ts:51-67` | Yes | FLOWING - wrappers come from template files and are chmodded after copy. |
| `src/lib/adapters/copilot.ts` | `existingText`, `templateText` for hook config/instructions | Reads existing `.github/hooks/codewiki-hooks.json`, template hook JSON, existing instructions, and template instructions at `src/lib/adapters/copilot.ts:98-127` | Yes | FLOWING - hook config is created or force-replaced, instructions are marker-merged. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full current test suite | `rtk npm test` | Build succeeded; Vitest: 16 files, 105 tests passed; compiled Node tests: 16 passed. | PASS |
| Codex auto-detection with existing `.codex/` | Temp project, `node dist/bin/codewiki.js init --name verify-codex` | Created `.agents/skills`, Codex wrappers/agents; preserved existing hook command; wrote `codex_hooks = true`; one `AGENTS.md` marker. | PASS |
| Copilot auto-detection with existing `.github/copilot-instructions.md` | Temp project, `node dist/bin/codewiki.js init --name verify-copilot` | Created `.agents/skills`, `.github/hooks/codewiki-hooks.json`, wrappers; preserved unrelated `.github/hooks/existing.json`; one Copilot instruction marker. | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CODEX-01 | 07-02, 07-03, 07-06 | Codex layers on shared `.agents/skills` | SATISFIED | Shared-skill resolver and Codex-only/mixed tests verify `.agents/skills` behavior. |
| CODEX-02 | 07-01, 07-02, 07-03, 07-06 | Codex hook/config/wrapper behavior | SATISFIED | Codex templates, adapter merge logic, template tests, and init tests verify hook events, config, wrappers, and idempotency. |
| CODEX-03 | 07-01, 07-02, 07-03, 07-06 | Codex instructions and agent integration | SATISFIED | TOML agents and `AGENTS.md` merge are implemented and covered by tests. |
| COP-01 | 07-04, 07-05, 07-06 | Copilot hook template and adapter behavior | SATISFIED | Hook config/wrappers and Copilot adapter are implemented and tested. |
| COP-02 | 07-04, 07-05, 07-06 | Copilot lifecycle instruction behavior | SATISFIED | `agentStop` and cleanup-only `sessionEnd` are present in config, wrappers, instructions, and tests. |
| COP-03 | 07-05, 07-06 | Copilot uses shared `.agents/skills` only | SATISFIED | Resolver, instructions, and tests verify `.agents/skills` and reject `.github/skills`. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/commands/init.ts` | 113 | Text contains `Unsupported (not yet implemented)` | INFO | Not a Phase 7 stub. It is the generic unsupported-tools report path and tests assert Phase 7 adapters no longer hit pending/unsupported output for Codex/Copilot. |
| `test/init.test.ts` | 326 | Test assertion references `Unsupported (not yet implemented)` | INFO | Negative assertion only; not a runtime stub. |

### Human Verification Required

None. The phase goal is filesystem/config/template wiring, and the required behavior is covered by source inspection, compiled CLI spot-checks, and the full test suite.

### Gaps Summary

No blocking gaps found. Codex and Copilot are registered as real adapters, both layer on the shared `.agents/skills` tree, both install tool-owned hook/instruction surfaces, and mixed selections preserve exactly one shared `.agents/skills` tree alongside Claude's `.claude/skills`.

---

_Verified: 2026-05-01T17:06:04Z_
_Verifier: the agent (gsd-verifier)_
