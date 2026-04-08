---
phase: 03-prompt-templates-and-hook-scripts
plan: "03"
subsystem: agents
tags: [agents, claude, wiki, verification]
requires:
  - phase: 03-prompt-templates-and-hook-scripts
    provides: command-and-hook-context
provides:
  - wiki updater agent definition
  - wiki verifier agent definition
  - read-only contradiction and reference-check workflow for wiki proposals
affects: [claude-code-adapter, template-assets, wiki-maintenance]
tech-stack:
  added: []
  patterns: [approval-gated-wiki-updates, read-only-wiki-verification]
key-files:
  created:
    - src/templates/claude/agents/codewiki-wiki-updater.md
    - src/templates/claude/agents/codewiki-verifier.md
  modified: []
key-decisions:
  - Keep the updater agent approval-gated per proposed wiki change instead of allowing bulk autonomous edits.
  - Keep the verifier agent strictly read-only so contradiction checks cannot accidentally mutate the wiki.
patterns-established:
  - Wiki-maintenance agents reference the full `wiki/` structure explicitly instead of guessing paths.
  - Verification output uses structured findings such as `CONFLICT`, `BROKEN REF`, and `MISSING INDEX`.
requirements-completed: [AGENT-01, AGENT-02]
duration: 1m
completed: 2026-04-08
---

# Phase 03 Plan 03: Agent Definitions Summary

**Two Claude agent templates for wiki update proposals and read-only verification of wiki contradictions and references**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-08T00:23:55Z
- **Completed:** 2026-04-08T00:24:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `codewiki-wiki-updater.md` so CodeWiki can propose targeted wiki edits from recent code changes.
- Added `codewiki-verifier.md` so proposed wiki changes can be checked for contradiction, broken links, and missing index coverage before any write.
- Kept the verifier template explicitly read-only and the updater template explicitly approval-gated.

## Task Commits

1. **Task 1: Create codewiki-wiki-updater agent definition** - `8caf901` (feat)
2. **Task 2: Create codewiki-verifier agent definition** - `ff31de9` (feat)

## Files Created/Modified

- `src/templates/claude/agents/codewiki-wiki-updater.md` - Agent prompt for mapping code changes to affected wiki pages and proposing before/after edits.
- `src/templates/claude/agents/codewiki-verifier.md` - Read-only agent prompt for contradiction checks, cross-reference validation, and index coverage review.

## Decisions Made

- Required per-change user approval in the updater agent so wiki maintenance stays consistent with CodeWiki's human-review boundary.
- Kept the verifier agent free of write tools so it can only inspect and report.

## Deviations from Plan

None.

## Issues Encountered

None.

## User Setup Required

None - these are static template assets.

## Next Phase Readiness

- Phase 3 now has the full Claude prompt surface: commands, hooks, and agents.
- The phase is ready for consolidated validation and completion tracking.

---
*Phase: 03-prompt-templates-and-hook-scripts*
*Completed: 2026-04-08*
