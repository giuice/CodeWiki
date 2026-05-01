---
phase: 07-codex-and-copilot-adapters
plan: 05
subsystem: cli-adapters
tags: [typescript, copilot, hooks, installer, marker-merge]

requires:
  - phase: 07-04
    provides: Copilot hook JSON, wrapper scripts, and instruction templates
provides:
  - Real Copilot adapter that installs CodeWiki-owned hook wrappers and hook JSON
  - Copilot adapter registry resolution layered after shared `.agents/skills`
  - Init reporting with no shared-skills-only pending section for Codex or Copilot
affects: [phase-07, copilot-adapter, init-command, adapter-registry]

tech-stack:
  added: []
  patterns:
    - Deterministic CodeWiki-owned Copilot hook installation under `.github/hooks`
    - Marker-managed `.github/copilot-instructions.md` merge
    - Shared skills adapter remains canonical for non-Claude skill installation

key-files:
  created:
    - src/lib/adapters/copilot.ts
  modified:
    - src/lib/adapters/index.ts
    - src/commands/init.ts

key-decisions:
  - "Copilot keeps the shared `.agents/skills` adapter and adds a real Copilot adapter afterward."
  - "The obsolete shared-skills-only pending report was removed now that Codex and Copilot both resolve real adapters."

patterns-established:
  - "Copilot hook config is treated as a CodeWiki-owned file at `.github/hooks/codewiki-hooks.json`; unrelated `.github/hooks/*.json` files are not touched."
  - "Copilot instructions are merged only through `mergeMarkerSection()` so existing user-authored instructions survive."

requirements-completed: [COP-01, COP-02, COP-03]

duration: 4min
completed: 2026-05-01
---

# Phase 07 Plan 05: Copilot Adapter Wiring Summary

**Copilot installer support now writes CodeWiki hook assets and marker-managed instructions while preserving the shared `.agents/skills` tree.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-01T16:08:55Z
- **Completed:** 2026-05-01T16:12:32Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `CopilotAdapter` with `.github/hooks/codewiki/*.sh` wrapper installation, executable permissions, CodeWiki-owned `.github/hooks/codewiki-hooks.json`, and `.github/copilot-instructions.md` marker merge.
- Registered Copilot as a real adapter while preserving shared-skills-first behavior for `.agents/skills/codewiki-<name>/SKILL.md`.
- Removed the transitional pending integration report section so Copilot is no longer labeled shared-skills-only.

## Task Commits

1. **Task 1: Implement Copilot adapter copy, chmod, hook JSON install, and instruction merge** - `8352b72` (feat)
2. **Task 2: Resolve Copilot adapter alongside shared skills** - `1054181` (feat)
3. **Task 3: Remove shared-skills-only pending report after both adapters are real** - `6da3220` (fix)

## Files Created/Modified

- `src/lib/adapters/copilot.ts` - Real Copilot adapter for hook wrappers, hook JSON, executable permissions, and instruction merge.
- `src/lib/adapters/index.ts` - Adds Copilot adapter factory while keeping Copilot in `SHARED_SKILLS_TOOLS`.
- `src/commands/init.ts` - Removes obsolete pending integration reporting.

## Verification

- `test -f src/lib/adapters/copilot.ts && rg -n "export class CopilotAdapter|\\.github/hooks|\\.github/copilot-instructions\\.md" src/lib/adapters/copilot.ts && rg -n "copilot: async|CopilotAdapter" src/lib/adapters/index.ts` - passed
- `npm run build` - passed
- Compiled CLI smoke: `codewiki init --tool copilot --name demo` in a temp project - passed; installed `.agents/skills`, `.github/hooks/codewiki-hooks.json`, executable wrapper scripts, and `.github/copilot-instructions.md` without pending-report output.

## Decisions Made

- Copilot adapter copies only `.sh` wrappers into `.github/hooks/codewiki/`; the hook JSON is installed separately at `.github/hooks/codewiki-hooks.json`.
- The shared-skills pending helper was removed entirely because all Phase 7 supported non-Claude tools now have real adapters.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None found.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 07-06 can add Copilot/final regression coverage against the installed files and pending-report cleanup. The compiled CLI smoke already confirms the expected install surface.

## Self-Check: PASSED

- Found created/modified files: `src/lib/adapters/copilot.ts`, `src/lib/adapters/index.ts`, `src/commands/init.ts`, `.planning/phases/07-codex-and-copilot-adapters/07-05-SUMMARY.md`
- Found task commits: `8352b72`, `1054181`, `6da3220`

---
*Phase: 07-codex-and-copilot-adapters*
*Completed: 2026-05-01*
