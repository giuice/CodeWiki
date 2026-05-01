---
phase: 07-codex-and-copilot-adapters
plan: 01
subsystem: adapter-templates
tags: [codex, hooks, agents, templates, codewiki]

requires:
  - phase: 06-opencode-adapter
    provides: compact non-Claude instruction block precedent and shared skill tree pattern
  - phase: 03.1-auto-improvement-engine
    provides: shared hook scripts for wiki context, post-verify, and session-end summaries
provides:
  - Codex hook config template with UserPromptSubmit, PreToolUse, PostToolUse, and Stop
  - Codex feature config enabling codex_hooks
  - Codex event-specific shell wrappers for shared CodeWiki hooks
  - Codex TOML updater and verifier agent templates
  - Compact Codex AGENTS.md instruction block body
affects: [phase-07-codex-adapter-wiring, CODEX-02, CODEX-03]

tech-stack:
  added: []
  patterns:
    - Thin Codex wrappers translate shared hook output into event-specific JSON
    - Codex Stop wrapper checks stop_hook_active before blocking continuation

key-files:
  created:
    - src/templates/codex/hooks.json
    - src/templates/codex/config.toml
    - src/templates/codex/hooks/user-prompt-submit.sh
    - src/templates/codex/hooks/pre-tool-use.sh
    - src/templates/codex/hooks/post-tool-use.sh
    - src/templates/codex/hooks/stop.sh
    - src/templates/codex/agents/codewiki-wiki-updater.toml
    - src/templates/codex/agents/codewiki-verifier.toml
    - src/templates/codex/instructions.md
  modified: []

key-decisions:
  - "Codex hook entries live in hooks.json while config.toml contains only the codex_hooks feature flag."
  - "PreToolUse is guardrail-only because Codex ignores plain stdout for that event."
  - "PostToolUse and Stop use Codex-specific JSON wrappers around shared CodeWiki hook scripts."

patterns-established:
  - "Codex templates preserve shared hook business logic and keep tool-specific files as dispatch/translation layers."
  - "Codex agent TOML preserves the existing approval-gated updater and read-only verifier role pair."

requirements-completed: [CODEX-02, CODEX-03]

duration: 4min
completed: 2026-05-01
---

# Phase 07 Plan 01: Codex Template Assets Summary

**Codex hook/config, wrapper, TOML-agent, and AGENTS.md templates for the CodeWiki adapter surface**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-01T15:55:13Z
- **Completed:** 2026-05-01T15:58:36Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Created `.codex/hooks.json` and `.codex/config.toml` source templates with `codex_hooks = true`.
- Added four Codex hook wrappers that preserve event-specific stdout contracts.
- Added Codex TOML custom agents and compact `AGENTS.md` instruction content.

## Task Commits

1. **Task 1: Create Codex hook config and feature template** - `a0688e7` (feat)
2. **Task 2: Create Codex event-specific wrapper scripts** - `01d4534` (feat)
3. **Task 3: Create Codex TOML agents and compact instructions** - `f1ccfc7` (feat)

## Files Created/Modified

- `src/templates/codex/hooks.json` - Codex hook event wiring for prompt, edit, post-edit, and stop events.
- `src/templates/codex/config.toml` - Codex feature flag template.
- `src/templates/codex/hooks/user-prompt-submit.sh` - Prompt-level context wrapper for `pre-wiki-context.sh`.
- `src/templates/codex/hooks/pre-tool-use.sh` - Guardrail-only `PreToolUse` wrapper.
- `src/templates/codex/hooks/post-tool-use.sh` - JSON wrapper for shared `post-verify.sh` output.
- `src/templates/codex/hooks/stop.sh` - Loop-safe JSON wrapper for shared `session-end.sh` output.
- `src/templates/codex/agents/codewiki-wiki-updater.toml` - Approval-gated updater role.
- `src/templates/codex/agents/codewiki-verifier.toml` - Read-only verifier role.
- `src/templates/codex/instructions.md` - Compact CodeWiki instruction block for later `AGENTS.md` merge.

## Decisions Made

- Followed the plan's split: hook entries are represented in `hooks.json`; `config.toml` only enables the hook feature.
- Kept Codex wrappers thin and delegated product behavior to `.codewiki/hooks/*.sh`.
- Preserved explicit human approval before any `wiki/` writes in the updater and instruction templates.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. Shell empty-string fallbacks such as `PAYLOAD=""` and `OUTPUT=""` are defensive command defaults, not user-visible stubs.

## Threat Flags

None. The new Codex hook, Stop, updater, and instruction surfaces match the plan threat model.

## Issues Encountered

- `node ./node_modules/@gsd-build/sdk/dist/cli.js query state.load` failed because the local SDK package is not installed.
- `gsd-sdk` is not present on PATH in this environment, so automated GSD state/roadmap/requirement update commands were unavailable.
- `.planning/STATE.md` was already modified before this plan's edits and is outside this plan's ownership list, so it was not changed by this executor.

## User Setup Required

None - no external service configuration required.

## Verification

- `test -f ... && rg -n "UserPromptSubmit|PreToolUse|PostToolUse|Stop|Edit\\|Write\\|apply_patch|codex_hooks = true|stop_hook_active|developer_instructions" src/templates/codex` - passed.
- `sh -n src/templates/codex/hooks/user-prompt-submit.sh` - passed.
- `sh -n src/templates/codex/hooks/pre-tool-use.sh` - passed.
- `sh -n src/templates/codex/hooks/post-tool-use.sh` - passed.
- `sh -n src/templates/codex/hooks/stop.sh` - passed.

## Next Phase Readiness

Codex-owned source templates are ready for Plan 07-02 adapter wiring. The next plan can copy these assets into `.codex/`, merge `hooks.json` and `config.toml`, and marker-merge `instructions.md` into `AGENTS.md`.

## Self-Check: PASSED

- All 9 created template files exist.
- Summary file exists.
- Task commits found: `a0688e7`, `01d4534`, `f1ccfc7`.

---
*Phase: 07-codex-and-copilot-adapters*
*Completed: 2026-05-01*
