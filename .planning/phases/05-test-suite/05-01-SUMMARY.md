---
phase: 05-test-suite
plan: "01"
subsystem: testing
tags: [node:test, vitest, npm-pack, packaging, hooks]
requires:
  - phase: 04-claude-code-adapter-init-command
    provides: end-to-end init orchestration through scaffold plus adapters
provides:
  - pack tarball coverage for bundled Claude command and hook assets
  - explicit empty-JSON stdin coverage for session-end.sh
  - serialized node:test execution to keep npm pack from deleting dist mid-suite
affects: [phase-8-npm-publish-hardening, packaging-verification, test-execution]
tech-stack:
  added: []
  patterns: [node-test-pack-verification, explicit-hook-stdin-coverage, serialized-node-integration-tests]
key-files:
  created:
    - test/pack.test.ts
  modified:
    - src/templates/__tests__/session-end.test.ts
    - package.json
key-decisions:
  - Preserve the planned `spawnSync("npm", ["pack", "--dry-run"])` call, then read `--json` output because this npm version omits file listings from plain dry-run stdout.
  - Serialize compiled node:test files in `npm test` so `npm pack --dry-run` cannot delete `dist/` while other integration files are still executing.
patterns-established:
  - `npm pack` coverage belongs in compiled `test/` node:test files, not vitest, because prepack rebuilds and cleans dist.
  - Hook exit-code regressions can be pinned with narrow `execSync` stdin cases added beside existing shellcheck coverage.
requirements-completed: [BUILD-01, BUILD-02]
duration: 8m
completed: 2026-04-10
---

# Phase 05 Plan 01: Test Suite Summary

**Pack tarball verification now proves bundled Claude command and hook assets while session-end coverage explicitly locks empty-JSON stdin behavior.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-10T18:20:00Z
- **Completed:** 2026-04-10T18:28:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added a compiled `node:test` pack integration test covering the real Claude ingest tarball path plus all three hook scripts.
- Added the missing `session-end.sh` empty-JSON stdin regression test without changing existing shell tests.
- Kept `npm test` green by serializing compiled node:test execution after `npm pack --dry-run` exposed a `dist/` cleanup race.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test/pack.test.ts — npm pack tarball coverage** - `d60ac32` (test), `99b763e` (feat)
2. **Task 2: Add empty-JSON-payload test case to session-end.test.ts** - `fa02a53` (test)
3. **Blocking verification fix: serialize compiled node integration tests** - `6c7a679` (fix)

## Files Created/Modified

- `test/pack.test.ts` - Adds node:test coverage for `npm pack --dry-run` and package file assertions.
- `src/templates/__tests__/session-end.test.ts` - Adds the explicit `{}` stdin exit-0 regression test.
- `package.json` - Serializes compiled node:test execution to avoid `dist/` deletion during pack verification.
- `.planning/phases/05-test-suite/05-01-SUMMARY.md` - Records execution, deviations, and verification results for the plan.

## Decisions Made

- Used the exact planned plain dry-run spawn first for success verification, then parsed `npm pack --dry-run --json` because the local npm output no longer prints file lists on plain stdout.
- Fixed the new concurrency race in the test runner instead of weakening pack coverage or moving the test out of the compiled integration suite.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm dry-run stdout no longer listed tarball files**
- **Found during:** Task 1 (Create test/pack.test.ts — npm pack tarball coverage)
- **Issue:** `npm pack --dry-run` returned only the tarball filename plus lifecycle logs, so the planned plain-stdout path assertions could never pass on this npm version.
- **Fix:** Kept the required plain dry-run spawn for exit-status coverage and added a follow-up `--json` dry-run read for the file-list assertions.
- **Files modified:** `test/pack.test.ts`
- **Verification:** `npm run build && node --test "dist/test/pack.test.js"`
- **Committed in:** `99b763e`

**2. [Rule 3 - Blocking] node:test executed pack coverage concurrently with init integration tests**
- **Found during:** Final `npm test`
- **Issue:** `npm pack --dry-run` triggers `prepack`, which deletes `dist/`; concurrent compiled integration files then failed to find `dist/bin/codewiki.js`.
- **Fix:** Added `--test-concurrency=1` to the compiled node:test leg of `npm test`.
- **Files modified:** `package.json`
- **Verification:** `npm test`
- **Committed in:** `6c7a679`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes preserved the planned behaviors and were required to make the new coverage executable on the current npm/node:test toolchain.

## Issues Encountered

- Task 2's added test passed immediately because `session-end.sh` already tolerated `{}` stdin; the gap was missing specification coverage, not missing hook behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 8 pack/publish hardening now has executable tarball coverage to build on.
- Package publishing still includes compiled test artifacts in the tarball; that remains out of scope for this plan and should stay with the planned publish-hardening work.

## Self-Check: PASSED

---
*Phase: 05-test-suite*
*Completed: 2026-04-10*
