---
phase: 04-claude-code-adapter-init-command
plan: "03"
subsystem: cli
tags: [init, cli, scaffold, detection, claude]
requires:
  - phase: 04-claude-code-adapter-init-command
    provides: adapter-registry-and-claude-installer
provides:
  - end-to-end init orchestration through scaffold plus adapters
  - tool auto-detection with non-TTY failure guidance and TTY fallback
  - scaffold cleanup that removes placeholder adapter directories
affects: [phase-5-test-suite, future-tool-adapters, cli-user-experience]
tech-stack:
  added: []
  patterns: [thin-init-orchestrator, explicit-unsupported-reporting, tty-driven-tool-selection]
key-files:
  created:
    - src/commands/__tests__/init.test.ts
  modified:
    - src/templates/scaffold.ts
    - src/lib/__tests__/scaffold.test.ts
    - src/commands/init.ts
    - test/init.test.ts
key-decisions:
  - Keep the no-detection TTY prompt limited to `claude-code` in Phase 4 because it is the only implemented adapter.
  - Remove adapter placeholder directories from scaffold output so adapters own their own installation surface.
patterns-established:
  - `init` is now a thin orchestrator: parse flags, detect or select tools, scaffold shared assets, run adapters, then format a sectioned report.
  - Unsupported tool selections are surfaced as explicit skipped report entries rather than silent no-ops.
requirements-completed: [CLI-01, CLI-02, CLI-04, CLI-05]
duration: 1m
completed: 2026-04-08
---

# Phase 04 Plan 03: Init Orchestration Summary

**Thin init pipeline that auto-detects tools, scaffolds wiki assets, runs adapters, and reports unsupported selections explicitly**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-08T18:50:42-03:00
- **Completed:** 2026-04-08T18:50:43-03:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Removed placeholder adapter directories from scaffold output and limited scaffold state to shared wiki assets plus hooks.
- Rewrote `init` to use detection, explicit tool selection, TTY fallback prompting, adapter execution, and sectioned reporting.
- Added built CLI integration coverage plus a focused TTY-mode unit test for the interactive fallback path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean up scaffold.ts to remove adapter directories** - `04c74d6` (feat)
2. **Task 2: Rewrite init.ts as adapter orchestrator** - `4464054` (feat)

## Files Created/Modified

- `src/templates/scaffold.ts` - Removes adapter placeholder directories and keeps scaffold output wiki-only.
- `src/lib/__tests__/scaffold.test.ts` - Verifies the new scaffold surface, including `.codewiki/hooks` and the empty tools array.
- `src/commands/init.ts` - Orchestrates tool detection, TTY prompting, scaffold execution, adapter resolution, and sectioned output.
- `test/init.test.ts` - Verifies explicit Claude installs, auto-detection, unsupported-tool reporting, rerun idempotency, and non-TTY failures.
- `src/commands/__tests__/init.test.ts` - Verifies the TTY prompt path by mocking the interactive selection.

## Decisions Made

- Kept `parseTools` and CLI flag parsing intact while moving all install work behind the adapter pipeline.
- Treated unsupported selections as visible report entries so future adapters can be staged without confusing the user.

## Deviations from Plan

### Execution Notes

- Copilot runtime compatibility required inline execution instead of spawned executor agents, but the task boundaries and outputs stayed identical to the plan.

## Issues Encountered

None.

## User Setup Required

None - the CLI now handles detection, explicit selection, and Claude installation end to end.

## Next Phase Readiness

- Phase 4 is now functionally complete and verified through both unit and built CLI integration tests.
- Phase 5 can focus on additional packaging and regression hardening rather than core Claude install functionality.

---
*Phase: 04-claude-code-adapter-init-command*
*Completed: 2026-04-08*