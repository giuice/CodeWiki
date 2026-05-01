---
phase: 08-npm-publish-hardening
plan: 01
subsystem: build
tags: [npm, packaging, node, pack-test]

requires:
  - phase: 07-codex-and-copilot-adapters
    provides: completed Codex and Copilot template surfaces included in package verification
provides:
  - Node engine contract for the npm package
  - Full runtime template manifest coverage from npm pack JSON output
  - Runtime-only package allowlist with negative pack assertions
affects: [npm-publish-hardening, package-contract, pack-verification]

tech-stack:
  added: []
  patterns:
    - Parse `npm pack --dry-run --json` and assert package file paths from `files[].path`
    - Keep installer runtime dependency-free unless a concrete implementation need appears

key-files:
  created:
    - .planning/phases/08-npm-publish-hardening/08-01-SUMMARY.md
  modified:
    - package.json
    - test/pack.test.ts

key-decisions:
  - "Preserved the zero-runtime-dependency package contract while adding engines.node >=20.11.0."
  - "Pack verification now checks the complete runtime template manifest needed by init, not representative files."

patterns-established:
  - "Pack manifest tests parse npm JSON into a Set before asserting required tarball paths."
  - "Pack manifest tests reject non-runtime artifacts such as dist/test, __tests__, source maps, and helper template sources."

requirements-completed: [BUILD-03, BUILD-04]

duration: 2min
completed: 2026-05-01
---

# Phase 8 Plan 01: Package Contract and Pack Manifest Summary

**Node engine metadata and full npm tarball template coverage for the installer package**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-01T18:06:04Z
- **Completed:** 2026-05-01T18:07:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `engines.node >=20.11.0` to `package.json`.
- Preserved an absent `dependencies` field for zero runtime dependencies.
- Replaced representative pack assertions with a complete `REQUIRED_TEMPLATE_FILES` manifest parsed from `npm pack --dry-run --json`.
- Tightened `package.json` publish `files` from broad `dist/` inclusion to runtime CLI modules, declarations, required template assets, README, and package metadata.
- Added negative pack assertions so tests, source maps, and helper template source files cannot enter the published tarball unnoticed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the Node engine contract and preserve zero runtime dependencies** - `1de7c29` (feat)
2. **Task 2: Replace representative pack assertions with a complete runtime template manifest** - `983ec8c` (test)

**Plan metadata:** final docs commit records this summary and tracking updates

## Files Created/Modified

- `package.json` - Declares the supported Node runtime through `engines.node` and scopes the npm publish allowlist to runtime artifacts.
- `test/pack.test.ts` - Parses npm pack JSON, asserts every runtime template asset required by `init`, and rejects non-runtime artifacts.
- `.planning/phases/08-npm-publish-hardening/08-01-SUMMARY.md` - Records execution outcome, verification, and tracking context.

## Decisions Made

- Kept runtime dependencies at zero; `picocolors` remains an allowed exception in Phase 8 context but was not needed for this plan.
- Used npm's machine-readable dry-run JSON manifest as the source of truth for pack file assertions.

## Verification

- `node -e "const p=require('./package.json'); if (p.engines.node !== '>=20.11.0') process.exit(1); if ('dependencies' in p) process.exit(2)"` - passed
- `npm run build && node --test dist/test/pack.test.js` - passed
- `npm test` - passed: 16 compiled node tests, 105 Vitest tests

## Deviations from Plan

Post-review hardening tightened the package allowlist and added negative pack assertions. This stayed within the plan's publish-hardening scope and was verified by `npm pack --dry-run --json`, `node --test dist/test/pack.test.js`, and `npm test`.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 08-02 can add the local tarball `npx` smoke test on top of the strengthened package metadata and pack manifest coverage.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/08-npm-publish-hardening/08-01-SUMMARY.md`.
- Task commits `1de7c29` and `983ec8c` exist in git history.
- Verification commands passed before the summary was finalized.

---
*Phase: 08-npm-publish-hardening*
*Completed: 2026-05-01*
