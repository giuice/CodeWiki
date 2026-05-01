---
phase: 07-codex-and-copilot-adapters
plan: 04
subsystem: templates
tags: [copilot, hooks, instructions, codewiki]

requires:
  - phase: 03.1-auto-improvement-engine
    provides: shared CodeWiki hook scripts for pre-context, post-verify, and session-end summaries
  - phase: 04.1-skills-migration
    provides: shared `.agents/skills/codewiki-<name>/SKILL.md` skill tree canon
provides:
  - Copilot hook JSON template with preToolUse, postToolUse, agentStop, and cleanup-only sessionEnd wiring
  - Copilot wrapper scripts that translate shared CodeWiki hook output into Copilot command-hook JSON
  - Compact Copilot instruction template for marker-managed `.github/copilot-instructions.md`
affects: [phase-07, copilot-adapter, adapter-regression]

tech-stack:
  added: []
  patterns:
    - thin Copilot shell wrappers around shared `.codewiki/hooks/*.sh`
    - `agentStop` continuation only when shared session summary output is non-empty
    - `sessionEnd` retained as cleanup-only lifecycle wiring

key-files:
  created:
    - src/templates/copilot/hooks/codewiki-hooks.json
    - src/templates/copilot/hooks/pre-tool-use.sh
    - src/templates/copilot/hooks/post-tool-use.sh
    - src/templates/copilot/hooks/agent-stop.sh
    - src/templates/copilot/instructions.md
  modified: []

key-decisions:
  - "Copilot `agentStop` is the smart post-turn CodeWiki follow-up hook; `sessionEnd` stays cleanup-only."
  - "Copilot instructions reference the shared `.agents/skills` tree and do not introduce `.github/skills`."

patterns-established:
  - "Copilot command-hook wrappers resolve the repository root with `git rev-parse --show-toplevel` before calling shared hooks."
  - "Copilot post-tool and agent-stop wrappers emit JSON only, using `additionalContext` or `decision` fields as appropriate."

requirements-completed: [COP-01, COP-02]

duration: 3min
completed: 2026-05-01
---

# Phase 07 Plan 04: Copilot Template Summary

**Copilot hook and instruction templates with conservative `agentStop` follow-up and cleanup-only `sessionEnd` wiring**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-01T15:55:21Z
- **Completed:** 2026-05-01T15:58:08Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Created `codewiki-hooks.json` with `"version": 1`, `preToolUse`, `postToolUse`, `agentStop`, and cleanup-only `sessionEnd`.
- Added three POSIX shell wrappers that call shared CodeWiki hooks and return Copilot-compatible allow/context/block JSON.
- Added compact Copilot instructions that document shared skills, human approval for `wiki/`, lifecycle hooks, `.codewiki/config.yml`, and `wiki/_backlinks.json`.

## Task Commits

1. **Task 1: Create Copilot hook JSON template** - `0d476d6` (feat)
2. **Task 2: Create Copilot wrapper scripts** - `9d823b7` (feat)
3. **Task 3: Create compact Copilot instruction template** - `2f2a2c9` (feat)

## Files Created/Modified

- `src/templates/copilot/hooks/codewiki-hooks.json` - Copilot hook file template for `.github/hooks/codewiki-hooks.json`.
- `src/templates/copilot/hooks/pre-tool-use.sh` - Allows tools by default while invoking shared pre-context logic if installed.
- `src/templates/copilot/hooks/post-tool-use.sh` - Converts shared post-verify output into `additionalContext` JSON.
- `src/templates/copilot/hooks/agent-stop.sh` - Uses shared session summaries to request continuation only when follow-up context exists.
- `src/templates/copilot/instructions.md` - Marker-section body for `.github/copilot-instructions.md`.

## Decisions Made

- Followed the plan's lifecycle split: `agentStop` handles meaningful post-turn follow-up and `sessionEnd` is cleanup-only.
- Kept the Copilot instruction block compact and tied to `.agents/skills`, with no `.github/skills` install target.

## Verification

- PASS: `test -f src/templates/copilot/hooks/codewiki-hooks.json` via `rtk sh -c`.
- PASS: `test -f src/templates/copilot/hooks/pre-tool-use.sh` via `rtk sh -c`.
- PASS: `test -f src/templates/copilot/hooks/post-tool-use.sh` via `rtk sh -c`.
- PASS: `test -f src/templates/copilot/hooks/agent-stop.sh` via `rtk sh -c`.
- PASS: `test -f src/templates/copilot/instructions.md` via `rtk sh -c`.
- PASS: `rg -n "\"version\": 1|preToolUse|postToolUse|agentStop|sessionEnd|cleanup-only" src/templates/copilot`.
- PASS: task acceptance checks for required hook paths, `additionalContext`, lifecycle strings, and absence of `.github/skills`.
- PASS: `sh -n` syntax check for all three Copilot wrapper scripts.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- Bare `rtk test -f ...` does not work for shell builtins through this proxy. Re-ran the same file-existence checks through `rtk sh -c 'test -f ...'`; all checks passed.
- Concurrent Phase 7 Codex files were staged by another worker and were not modified or committed by this plan.

## Known Stubs

None. The stub scan matched shell variable initializers such as `PAYLOAD=""`; these are runtime defaults in wrapper scripts, not placeholder implementation or UI data stubs.

## Threat Flags

None. The Copilot hook surfaces implemented here are the planned trust boundaries from the plan threat model.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Copilot template assets are ready for Plan 07-05 adapter wiring. Later adapter work should copy the hook config to `.github/hooks/codewiki-hooks.json`, copy wrappers under `.github/hooks/codewiki/`, chmod wrapper scripts, and merge this instruction body into `.github/copilot-instructions.md` with CodeWiki markers.

## Self-Check: PASSED

- FOUND: `src/templates/copilot/hooks/codewiki-hooks.json`
- FOUND: `src/templates/copilot/hooks/pre-tool-use.sh`
- FOUND: `src/templates/copilot/hooks/post-tool-use.sh`
- FOUND: `src/templates/copilot/hooks/agent-stop.sh`
- FOUND: `src/templates/copilot/instructions.md`
- FOUND: `.planning/phases/07-codex-and-copilot-adapters/07-04-SUMMARY.md`
- FOUND commits: `0d476d6`, `9d823b7`, `2f2a2c9`

---
*Phase: 07-codex-and-copilot-adapters*
*Completed: 2026-05-01*
