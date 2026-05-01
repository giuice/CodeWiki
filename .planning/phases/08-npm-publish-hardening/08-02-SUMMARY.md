---
phase: 08-npm-publish-hardening
plan: 02
subsystem: testing
tags: [npm, npx, tarball, smoke-test, node-test]

requires:
  - phase: 08-npm-publish-hardening
    provides: package metadata contract and full pack manifest coverage from 08-01
provides:
  - Reusable packed-tarball CLI test helpers
  - Local release-candidate tarball smoke coverage through npx
  - Cleanup guarantee for generated npm pack artifacts
affects: [npm-publish-hardening, release-candidate-verification, init-regression-tests]

tech-stack:
  added: []
  patterns:
    - Run `npm pack --json` inside compiled node:test coverage and invoke the generated `.tgz` through `npx`
    - Clean generated package tarballs in a `finally` block
    - Assert representative scaffold and adapter files from the fresh temp project

key-files:
  created:
    - .planning/phases/08-npm-publish-hardening/08-02-SUMMARY.md
  modified:
    - test/helpers.ts
    - test/init.test.ts

key-decisions:
  - "The blocking local smoke uses a generated `.tgz` release candidate rather than the published `codewiki@latest` package."
  - "The packed CLI helper falls back to `npx --package <tarball> codewiki` when the local npm/npx version tries to execute the `.tgz` path directly."

patterns-established:
  - "Packed-package tests parse `npm pack --json`, derive an absolute tarball path, and remove that tarball in `finally`."
  - "Packed `init` smoke assertions stay representative instead of duplicating all adapter regression coverage."

requirements-completed: [CLI-01, BUILD-03, BUILD-04]

duration: 3min
completed: 2026-05-01
---

# Phase 8 Plan 02: Local Tarball npx Smoke Summary

**Local npm release-candidate tarball smoke test proves `npx` can scaffold wiki and adapter assets in a fresh project**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-01T18:10:27Z
- **Completed:** 2026-05-01T18:13:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added packed-package CLI helpers in `test/helpers.ts`.
- Added a compiled `node:test` smoke that runs `npm pack --json`, invokes the generated tarball through `npx`, and verifies scaffold plus Claude, Codex, Copilot, and OpenCode representative files.
- Verified the generated `.tgz` is removed after the smoke test.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add packed-package CLI helpers** - `f8589e6` (test)
2. **Task 2: Add a local tarball npx smoke test** - `44b4ed9` (test)

**Plan metadata:** final docs commit records this summary and tracking updates

## Files Created/Modified

- `test/helpers.ts` - Adds `runPackedCli` and `mustRunPackedCli` for invoking the local package tarball through `npx`.
- `test/init.test.ts` - Adds the local tarball smoke test and cleanup logic.
- `.planning/phases/08-npm-publish-hardening/08-02-SUMMARY.md` - Records execution outcome, verification, and deviations.

## Decisions Made

- Kept the smoke focused on package self-containment and representative adapter surfaces rather than duplicating every existing adapter assertion.
- Preserved the planned direct `npx --yes <tarball>` helper invocation, with a fallback for npm/npx versions that treat the tarball path as a shell command instead of a package spec.

## Verification

- `rg -n "runPackedCli|mustRunPackedCli" test/helpers.ts` - passed
- `npm run build && node --test dist/test/init.test.js` - passed: 14 compiled init tests, including `local npm tarball works through npx in a fresh project`
- `npm test` - passed: 16 Vitest files / 105 tests and 17 compiled node tests
- `ls codewiki-*.tgz 2>/dev/null || true` - no generated tarball remained

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added npx package-form fallback for local tarballs**
- **Found during:** Task 2 (Add a local tarball npx smoke test)
- **Issue:** The planned `npx --yes <tarball> ...` invocation failed locally with `Permission denied` because this npm/npx version tried to execute the `.tgz` path directly.
- **Fix:** `runPackedCli` preserves the planned invocation, then falls back to `npx --yes --package <tarball> codewiki ...` when that direct tarball path execution fails.
- **Files modified:** `test/helpers.ts`
- **Verification:** `npm run build && node --test dist/test/init.test.js`; `npm test`
- **Committed in:** `f8589e6`

**2. [Rule 3 - Blocking] Added explicit npm pack filename guard**
- **Found during:** Task 2 (Add a local tarball npx smoke test)
- **Issue:** TypeScript would not narrow the parsed `npm pack --json` filename after an equality assertion.
- **Fix:** Replaced the assertion-only check with an explicit `typeof filename !== "string"` guard that fails the test before using the path.
- **Files modified:** `test/init.test.ts`
- **Verification:** `npm run build && node --test dist/test/init.test.js`; `npm test`
- **Committed in:** `44b4ed9`

---

**Total deviations:** 2 auto-fixed (2 Rule 3 blocking issues)
**Impact on plan:** Both fixes were required to make the planned local tarball smoke executable and type-safe. No scope expansion beyond `test/helpers.ts` and `test/init.test.ts`.

## Issues Encountered

The first smoke run proved the direct `npx --yes <tarball>` form was not portable in this environment. The helper now uses npm's package-install form as a fallback while still testing the generated local tarball.

## Known Stubs

None. Stub-pattern scan only found local initialization values used by the test helper and tarball cleanup path.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 08-03 can document the release workflow with the local tarball smoke as the blocking pre-publish gate and `npx codewiki@latest init` as the post-publish/manual registry check.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/08-npm-publish-hardening/08-02-SUMMARY.md`.
- Task commits `f8589e6` and `44b4ed9` exist in git history.
- Verification commands passed before the summary was finalized.
- No generated `codewiki-*.tgz` tarball remained in the repository root.

---
*Phase: 08-npm-publish-hardening*
*Completed: 2026-05-01*
