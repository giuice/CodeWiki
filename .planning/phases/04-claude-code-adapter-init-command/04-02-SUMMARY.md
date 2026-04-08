---
phase: 04-claude-code-adapter-init-command
plan: "02"
subsystem: installer
tags: [claude, hooks, merge, adapter, installer]
requires:
  - phase: 04-claude-code-adapter-init-command
    provides: adapter-registry-and-shared-copy-helpers
  - phase: 03.1-auto-improvement-engine
    provides: absorb-breakdown-hooks-and-expanded-claude-assets
provides:
  - Claude Code adapter that installs command, agent, and hook assets
  - idempotent Claude settings merge with object-array deduplication
  - marker-managed CLAUDE.md instruction merge
affects: [phase-4-init-command, future-tool-adapters, claude-installation]
tech-stack:
  added: []
  patterns: [serialized-hook-deduplication, marker-managed-instructions, inactive-asset-reporting]
key-files:
  created:
    - src/templates/claude/instructions.md
    - src/lib/adapters/claude.ts
  modified:
    - src/lib/merge.ts
    - src/lib/index.ts
    - src/lib/adapters/base.ts
    - src/lib/__tests__/merge.test.ts
key-decisions:
  - Install `session-end.sh` now but report it as inactive until Claude exposes the right lifecycle hook.
  - Deduplicate Claude hook entries by serialized object value so re-runs preserve user hooks without duplicating CodeWiki hooks.
patterns-established:
  - Adapter installs can preserve existing JSON config while injecting structured hook objects.
  - Marker-based markdown merges remain the only write surface for AI-tool instruction files.
requirements-completed: [CLI-03, CLI-07, CC-01, CC-02, CC-03, CC-04, CC-05]
duration: 1m
completed: 2026-04-08
---

# Phase 04 Plan 02: Claude Adapter Summary

**Claude installer that copies 8 commands, 2 agents, 3 hooks, merges settings safely, and appends marker-managed instructions**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-08T18:47:10-03:00
- **Completed:** 2026-04-08T18:47:11-03:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added the Claude instruction fragment and the object-array hook deduplication helper needed for idempotent settings merges.
- Implemented `ClaudeCodeAdapter` to install all 8 command prompts, 2 agents, and 3 shared hook scripts.
- Preserved existing `.claude/settings.json` and `CLAUDE.md` content while preventing duplicate CodeWiki hooks and marker blocks on reruns.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CLAUDE.md instruction template and hook dedup utility** - `9d966e1` (feat)
2. **Task 2: Implement ClaudeCodeAdapter** - `743e10c` (feat)

## Files Created/Modified

- `src/templates/claude/instructions.md` - Marker-managed CodeWiki instructions for Claude projects.
- `src/lib/merge.ts` - Adds serialized hook-entry deduplication for Claude hook arrays.
- `src/lib/adapters/claude.ts` - Installs Claude commands, agents, hooks, settings merges, and CLAUDE.md instructions.
- `src/lib/adapters/base.ts` - Reports per-file copy failures instead of aborting an install section.
- `src/lib/__tests__/merge.test.ts` - Verifies object-array deduplication for repeated hook entries.
- `src/lib/index.ts` - Re-exports the new merge helper for the public installer API.

## Decisions Made

- Kept the CodeWiki instruction content in a standalone template file so adapter behavior stays data-driven rather than embedding markdown strings in TypeScript.
- Reported `session-end.sh` as installed-but-unwired so the installed asset is visible without implying unsupported Claude lifecycle integration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Hardened shared template-copying to report individual file failures**
- **Found during:** Task 2 (Implement ClaudeCodeAdapter)
- **Issue:** The shared directory copy helper would stop on the first file-system error, which violated the plan requirement to continue installation and return a full report.
- **Fix:** Updated `copyTemplateDir` to capture per-file failures as `failed` report entries while continuing the rest of the install.
- **Files modified:** `src/lib/adapters/base.ts`
- **Verification:** `npm run build`, `npm run test:unit`, `npm test`
- **Committed in:** `743e10c`

### Execution Notes

- Copilot runtime compatibility required inline execution instead of spawned executor agents, but the task boundaries and outputs stayed identical to the plan.

## Issues Encountered

None.

## User Setup Required

None - Claude assets install automatically; `session-end.sh` is intentionally present but not yet wired.

## Next Phase Readiness

- The init command can now delegate a real Claude installation instead of writing placeholder adapter files.
- Phase 5 can extend or harden this behavior with broader packaging and regression coverage.

---
*Phase: 04-claude-code-adapter-init-command*
*Completed: 2026-04-08*