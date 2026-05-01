---
phase: 08-npm-publish-hardening
plan: 03
subsystem: documentation
tags: [npm, readme, release-verification, publishing]

requires:
  - phase: 08-npm-publish-hardening
    provides: package engine contract, full pack manifest coverage, and local tarball npx smoke from 08-01 and 08-02
provides:
  - README guidance for local release-candidate verification
  - README guidance for post-publish registry smoke verification
  - README troubleshooting notes for missing template assets and registry-specific failures
affects: [npm-publish-hardening, maintainer-release-docs, user-install-docs]

tech-stack:
  added: []
  patterns:
    - Keep release documentation bounded to user and maintainer checks instead of an internal release manual

key-files:
  created:
    - .planning/phases/08-npm-publish-hardening/08-03-SUMMARY.md
  modified:
    - README.md

key-decisions:
  - "Documented the local tarball smoke as the blocking pre-publish gate."
  - "Documented `npx codewiki@latest init` as a post-publish registry verification check."
  - "Kept runtime dependency guidance explicit: node >=20.11.0, zero runtime dependencies, and dev-only TypeScript/Vitest/@types/node."

patterns-established:
  - "README publish guidance distinguishes local release candidates from already-published registry packages."

requirements-completed: [CLI-01, BUILD-03, BUILD-04]

duration: 3min
completed: 2026-05-01
---

# Phase 8 Plan 03: README Publish Verification Summary

**README release guidance now distinguishes local tarball pre-publish verification from post-publish registry smoke checks**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-01T18:16:36Z
- **Completed:** 2026-05-01T18:18:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added bounded Development-section publish verification commands for build, test, dry-run pack, real pack, local tarball smoke, and `codewiki@latest` registry smoke.
- Refreshed README multi-tool status so Claude Code, Codex, Copilot, and OpenCode document their current skill, hook/integration, agent, and instruction surfaces.
- Added concise runtime dependency and troubleshooting guidance for template asset and registry/publish verification failures.

## Task Commits

Each task was committed atomically:

1. **Task 1: Document runtime and release-candidate verification** - `df56691` (docs)
2. **Task 2: Document dependency and troubleshooting constraints** - `e4cfd50` (docs)

**Plan metadata:** final docs commit records this summary and tracking updates

## Files Created/Modified

- `README.md` - Documents supported tools, hook strategies, release-candidate verification, post-publish smoke checks, dependency contract, and troubleshooting.
- `.planning/phases/08-npm-publish-hardening/08-03-SUMMARY.md` - Records execution outcome, verification, and tracking context.

## Decisions Made

- Kept README release guidance compact and maintainer-focused rather than turning it into a full release runbook.
- Treated the stale README adapter status as part of Task 1 because the plan explicitly required verifying and updating the four supported tools and their hook strategies.

## Verification

- `rg -n "node >=20\\.11\\.0|npm pack --dry-run --json|npx --yes ./codewiki-<version>\\.tgz init --name packed-smoke --tool claude-code,codex,copilot,opencode|npx codewiki@latest init --name latest-smoke|post-publish|claude-code|codex|copilot|opencode|--tool|--force|--name" README.md` - passed
- `rg -n "Runtime dependencies are intentionally zero|src/templates/\\*\\*|dist/templates/\\*\\*|registry|troubleshooting" README.md` - passed
- `rg -n "node >=20\\.11\\.0|npm pack --dry-run --json|npx codewiki@latest init --name latest-smoke|Runtime dependencies are intentionally zero|troubleshooting" README.md` - passed
- `npm test` - passed: 16 Vitest files / 105 tests and 17 compiled node tests
- `ls codewiki-*.tgz` - no generated tarball remained after tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 8 README, package metadata, pack manifest coverage, and local tarball smoke coverage are complete. The package is ready for publish flow execution with `npm pack --json`, local tarball smoke, publish, and `npx codewiki@latest init` post-publish verification.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/08-npm-publish-hardening/08-03-SUMMARY.md`.
- Task commits `df56691` and `e4cfd50` exist in git history.
- Verification commands passed before the summary was finalized.

---
*Phase: 08-npm-publish-hardening*
*Completed: 2026-05-01*
