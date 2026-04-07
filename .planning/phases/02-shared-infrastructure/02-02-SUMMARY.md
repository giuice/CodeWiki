---
phase: 02-shared-infrastructure
plan: "02"
subsystem: infra
tags: [scaffold, detection, reporting, filesystem]
requires:
  - phase: 01-clean-slate
    provides: clean-src-slate
provides:
  - scaffold wrapper for full CodeWiki project layout
  - AI-tool detection by project markers
  - structured install-report formatter
affects: [init-command, adapter-installers, installer-reporting]
tech-stack:
  added: []
  patterns: [root-safe-filesystem-writes, fixed-marker-tool-detection, structured-install-reporting]
key-files:
  created:
    - src/lib/scaffold.ts
    - src/lib/detect.ts
    - src/lib/reporter.ts
    - src/lib/__tests__/scaffold.test.ts
    - src/lib/__tests__/detect.test.ts
    - src/lib/__tests__/reporter.test.ts
  modified:
    - src/templates/scaffold.ts
key-decisions:
  - Keep `src/templates/scaffold.ts` as the template source of truth and wrap it from `src/lib/scaffold.ts`.
  - Detect tools from explicit marker paths only to avoid false positives in generic `.github/` repositories.
patterns-established:
  - Scaffold writes flow through `ensureDir` and `writeFileSafe` so every path remains rooted safely inside the target project.
  - Installer reporting uses a small typed entry model that can be rendered consistently by future adapters.
requirements-completed: [WIKI-01, WIKI-02, WIKI-03, WIKI-04, WIKI-05]
duration: 1m
completed: 2026-04-07
---

# Phase 02 Plan 02: Scaffold, Detection, and Reporting Summary

**Full wiki scaffold wrapper, tool-marker detection, and structured install reporting for future adapters**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-07T21:06:50Z
- **Completed:** 2026-04-07T21:08:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `scaffoldProject` to create the full wiki tree through existing template helpers while reporting every write decision.
- Fixed the missing `tasks/` directory in the scaffold template so WIKI-03 is actually satisfied.
- Added `detectTools` and `formatReport` with dedicated unit tests for all four supported tool markers and report states.

## Task Commits

1. **Task 1: Create scaffold.ts wrapper with tasks/ fix and tests** - `01fdf83` (feat)
2. **Task 2: Create detect.ts and reporter.ts with tests** - `01fdf83` (feat)

## Files Created/Modified

- `src/templates/scaffold.ts` - Added the missing `tasks` directory to the generated project layout.
- `src/lib/scaffold.ts` - Root-safe scaffold wrapper that returns structured report entries.
- `src/lib/detect.ts` - Marker-based AI-tool detection for Claude Code, Codex, OpenCode, and Copilot.
- `src/lib/reporter.ts` - Shared formatter for created/skipped/replaced/failed install output.
- `src/lib/__tests__/scaffold.test.ts` - Verifies the scaffold tree, config file, and template set.
- `src/lib/__tests__/detect.test.ts` - Verifies each supported marker path and multi-tool detection.
- `src/lib/__tests__/reporter.test.ts` - Verifies symbol rendering and summary counts.

## Decisions Made

- Preserved the existing template module as the source of truth and wrapped it instead of moving template content into the lib layer.
- Kept detection rules explicit and path-based so adapters do not over-detect Copilot from a plain `.github/` directory.

## Deviations from Plan

### Execution Notes

- Tasks 1 and 2 landed in the same implementation commit because the new shared-library layer was introduced as a single coherent surface and verified with focused Vitest runs immediately after creation.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Shared scaffolding, detection, and reporting primitives are in place for adapter-specific install work.
- Phase 2 now has a complete `src/lib` foundation ready for barrel exports and integration verification.

---
*Phase: 02-shared-infrastructure*
*Completed: 2026-04-07*