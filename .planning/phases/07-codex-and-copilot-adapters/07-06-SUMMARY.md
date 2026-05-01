---
phase: 07-codex-and-copilot-adapters
plan: 06
subsystem: testing
tags: [typescript, vitest, node-test, copilot, codex, adapters]

requires:
  - phase: 07-codex-and-copilot-adapters
    provides: Copilot hook and adapter implementation from plans 07-04 and 07-05
provides:
  - Copilot template contract coverage for hook JSON, wrappers, and instructions
  - Compiled init coverage for explicit Copilot install, no-clobber behavior, and rerun idempotency
  - Mixed Claude+Copilot and all-tool regression coverage without stale pending reports
affects: [phase-07, phase-08, adapter-regressions]

tech-stack:
  added: []
  patterns:
    - Vitest template contract tests read source templates directly
    - Compiled node:test init regressions verify installed adapter surfaces from dist

key-files:
  created:
    - src/templates/__tests__/copilot-adapter.test.ts
  modified:
    - test/init.test.ts

key-decisions:
  - "Copilot coverage verifies shared .agents/skills usage and explicitly rejects .github/skills."
  - "Mixed-selection regressions assert both .claude/skills and .agents/skills contain exactly one copy of each CodeWiki skill."

patterns-established:
  - "Copilot adapter tests lock lifecycle semantics: agentStop is meaningful post-turn follow-up and sessionEnd is cleanup-only."
  - "Final all-tool smoke coverage must reject stale pending-integration report text."

requirements-completed: [CODEX-01, CODEX-02, CODEX-03, COP-01, COP-02, COP-03]

duration: 12min
completed: 2026-05-01
---

# Phase 07 Plan 06: Copilot and Final Regression Coverage Summary

**Copilot template and compiled init regressions now prove explicit Copilot installs, mixed skill trees, and all-tool reporting without stale pending output.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-01T16:40:05Z
- **Completed:** 2026-05-01T16:51:53Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added Vitest contract coverage for Copilot hook JSON, wrapper scripts, instruction paths, and lifecycle semantics.
- Added compiled CLI coverage for `init --tool copilot`, preserving existing Copilot instructions and unrelated hook files across reruns.
- Added mixed `claude-code,copilot` and final `claude-code,codex,copilot,opencode` regressions proving both skill trees and no pending integration report.

## Task Commits

1. **Task 1: Add Copilot template contract tests** - `7faf210` (test)
2. **Task 2: Add Copilot compiled CLI install, no-clobber, and idempotency tests** - `ee7b072` (test)
3. **Task 3: Add final mixed-selection and stale pending-report regressions** - `a7b39ea` (test)

## Files Created/Modified

- `src/templates/__tests__/copilot-adapter.test.ts` - New Copilot source-template contract tests for hooks, wrappers, lifecycle wording, and shared skill path rules.
- `test/init.test.ts` - New compiled init regressions for Copilot explicit install, rerun idempotency, mixed Claude+Copilot installs, and all-tool smoke reporting.

## Decisions Made

- Kept Copilot template assertions source-level and focused on stable contract markers instead of duplicating adapter implementation details.
- Added `assertInstalledSkillTreeOnce()` to make mixed-selection tests prove exact skill tree cardinality, not just file existence.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first `npm test` run inside the sandbox failed because Vitest hook tests could not spawn `/bin/sh` and reported `spawnSync /bin/sh EPERM`.
- Reran the same `npm test` command outside the sandbox with approval; it passed with 16 node:test tests and 105 Vitest tests.

## Known Stubs

None.

## Threat Flags

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 7 regression coverage is complete for Codex, Copilot, mixed shared-skill installs, and stale pending-report cleanup. Phase 8 can proceed to npm publish hardening with adapter coverage in place.

## Self-Check: PASSED

- Found `src/templates/__tests__/copilot-adapter.test.ts`
- Found `test/init.test.ts`
- Found `.planning/phases/07-codex-and-copilot-adapters/07-06-SUMMARY.md`
- Found commits `7faf210`, `ee7b072`, and `a7b39ea`

---
*Phase: 07-codex-and-copilot-adapters*
*Completed: 2026-05-01*
