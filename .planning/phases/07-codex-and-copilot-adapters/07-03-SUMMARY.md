---
phase: 07-codex-and-copilot-adapters
plan: 03
subsystem: testing
tags: [codex, adapters, vitest, node-test, init]
requires:
  - phase: 07-01
    provides: Codex hook, config, instruction, and TOML agent templates
  - phase: 07-02
    provides: Real Codex adapter wiring layered on shared skills
provides:
  - Codex template contract coverage for hooks, wrappers, agents, and instructions
  - Codex compiled CLI coverage for explicit install no-clobber and rerun idempotency
  - Mixed Claude+Codex regression coverage for both skill trees and real adapter reporting
affects: [phase-07, phase-08, codex-adapter, init-tests]
tech-stack:
  added: []
  patterns: [template contract tests, compiled CLI integration tests, recursive hook command counting]
key-files:
  created: [src/templates/__tests__/codex-adapter.test.ts]
  modified: [test/init.test.ts]
key-decisions:
  - "Codex regression coverage asserts the real adapter surface rather than pending shared-skills-only reporting."
  - "Mixed Claude+Codex selections must install both .claude/skills and .agents/skills while also writing Codex hook and instruction assets."
patterns-established:
  - "Codex template tests read from src/templates/codex with the same local readFile pattern as OpenCode template tests."
  - "Compiled init tests count installed Codex hook command fragments recursively to prove rerun deduplication."
requirements-completed: [CODEX-01, CODEX-02, CODEX-03]
duration: 23min
completed: 2026-05-01
---

# Phase 07 Plan 03: Codex Regression Coverage Summary

**Codex adapter regression coverage now locks template contracts, explicit install no-clobber behavior, rerun idempotency, and mixed Claude+Codex skill-tree installs.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-05-01T16:15:34Z
- **Completed:** 2026-05-01T16:38:04Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added Vitest coverage for Codex hook events, matcher aliases, hook wrappers, feature flag, TOML agents, and instruction paths.
- Added compiled CLI coverage for `init --tool codex` preserving user `.codex/hooks.json`, `.codex/config.toml`, and `AGENTS.md` content.
- Updated mixed `claude-code,codex` coverage to assert real Codex adapter output, both skill trees, and no pending Codex report.

## Task Commits

1. **Task 1: Add Codex template contract tests** - `d53cd1e` (test)
2. **Tasks 2-3: Add Codex CLI and mixed-selection regression tests** - `c5428d3` (test)

## Files Created/Modified

- `src/templates/__tests__/codex-adapter.test.ts` - Codex template contract tests for hooks, config, wrappers, agents, and instructions.
- `test/init.test.ts` - Compiled init tests for explicit Codex install, no-clobber merge behavior, idempotency, and mixed Claude+Codex selection behavior.

## Decisions Made

- Kept Codex skill assertions on `.agents/skills/codewiki-<name>/SKILL.md`; no Codex-specific skill tree was introduced.
- Replaced the old mixed-selection pending assertion with real-adapter assertions because 07-02 implemented the Codex adapter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Folded Task 2 and Task 3 into one integration-test commit**
- **Found during:** Task 2 verification
- **Issue:** `npm run build && node --test dist/test/init.test.js` could not pass while the older mixed Claude+Codex test still expected Codex to be pending.
- **Fix:** Updated the mixed-selection regression immediately after adding the explicit Codex test, then committed both `test/init.test.ts` changes together.
- **Files modified:** `test/init.test.ts`
- **Verification:** Task 2 and Task 3 acceptance commands both exited 0.
- **Committed in:** `c5428d3`

---

**Total deviations:** 1 auto-fixed blocking issue.
**Impact on plan:** No product scope change; the combined commit keeps one test file internally consistent.

## Issues Encountered

- The sandbox blocked existing tests that spawn `/usr/bin/node`, `/bin/sh`, and `shellcheck` with `EPERM`. The affected verification commands were rerun through approved `rtk proxy` escalations and passed.

## Verification

- `npx vitest run src/templates/__tests__/codex-adapter.test.ts` - passed, 5 tests.
- `npm run build && node --test dist/test/init.test.js` - passed, 10 tests.
- `npm test` - passed, 15 Vitest files / 102 tests and 13 compiled node tests.

## Known Stubs

None.

## Threat Flags

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Codex regression coverage is complete. Later packaging or publish hardening can rely on tests proving the Codex adapter installs shared skills, Codex hooks/config/agents, and marker-managed instructions without clobbering user content.

## Self-Check: PASSED

- Found `src/templates/__tests__/codex-adapter.test.ts`.
- Found `test/init.test.ts`.
- Found commit `d53cd1e`.
- Found commit `c5428d3`.

---
*Phase: 07-codex-and-copilot-adapters*
*Completed: 2026-05-01*
