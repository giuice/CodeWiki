---
phase: 07-codex-and-copilot-adapters
plan: 02
subsystem: adapters
tags: [codex, adapters, hooks, toml, cli-init]
requires:
  - phase: 07-codex-and-copilot-adapters
    provides: Codex hook/config/agent/instruction templates from plan 07-01
provides:
  - Real Codex adapter layered on shared .agents/skills
  - Codex resolver wiring that preserves shared skill installation
  - Init pending-report cleanup for Codex
affects: [07-codex-and-copilot-adapters, codex-init, adapter-resolution]
tech-stack:
  added: []
  patterns: [marker-managed AGENTS.md merge, deep-merged hook JSON, narrow TOML feature merge]
key-files:
  created: [src/lib/adapters/codex.ts]
  modified: [src/lib/adapters/index.ts, src/commands/init.ts]
key-decisions:
  - "Codex remains in SHARED_SKILLS_TOOLS while also resolving a real CodexAdapter."
  - "Codex config merging uses a narrow text helper that only changes codex_hooks in [features]."
patterns-established:
  - "Codex adapter copies tool-owned hooks and agents while SharedSkillsAdapter remains the only Codex skill tree."
  - "Codex hooks.json merges by event and deduplicates entries instead of overwriting user hooks."
requirements-completed: [CODEX-01, CODEX-02, CODEX-03]
duration: 4min
completed: 2026-05-01
---

# Phase 07 Plan 02: Codex Adapter Wiring Summary

**Real Codex adapter that installs hooks, agents, config, and AGENTS guidance while preserving shared agents skills.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-01T16:01:00Z
- **Completed:** 2026-05-01T16:05:14Z
- **Tasks:** 3
- **Files modified:** 3 code files, 1 summary file

## Accomplishments

- Added `CodexAdapter` with Codex hook, agent, hooks JSON, config TOML, and AGENTS installation behavior.
- Wired Codex selections through both `SharedSkillsAdapter` and the new Codex-specific adapter.
- Removed Codex from the shared-skills-only pending report while leaving Copilot pending for plan 07-05.

## Task Commits

1. **Task 1: Implement Codex adapter copy, chmod, hook JSON merge, TOML feature merge, and AGENTS merge** - `e34f185` (feat)
2. **Task 2: Resolve Codex adapter alongside shared skills** - `feea9d4` (feat)
3. **Task 3: Stop reporting Codex as pending once real adapter exists** - `eda8b48` (fix)
4. **Build fix: satisfy strict Codex TOML typing** - `9d52ee5` (fix)

## Files Created/Modified

- `src/lib/adapters/codex.ts` - Codex adapter, hook permissions, hook JSON merge, TOML feature merge, and marker-managed `AGENTS.md` merge.
- `src/lib/adapters/index.ts` - Adds Codex adapter factory while preserving `["codex", "copilot", "opencode"]` shared-skill behavior.
- `src/commands/init.ts` - Narrows `SHARED_SKILL_ONLY_TOOLS` to Copilot only.
- `.planning/phases/07-codex-and-copilot-adapters/07-02-SUMMARY.md` - Execution summary.

## Decisions Made

- Codex remains in `SHARED_SKILLS_TOOLS` so the shared agents skill tree stays canonical.
- Codex config TOML is merged as text, changing only `codex_hooks` under `[features]` and preserving unrelated user config/comments.
- Codex hooks JSON uses `deepMerge()` plus per-event `deduplicateHookEntries()` to preserve unrelated hook entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Satisfied strict TypeScript indexed access in TOML merge helper**
- **Found during:** Plan-level `npm run build`
- **Issue:** `noUncheckedIndexedAccess` made `lines[index]` type `string | undefined`, blocking TypeScript compilation.
- **Fix:** Cached indexed TOML lines with `const line = lines[index] ?? ""` before regex checks and indentation parsing.
- **Files modified:** `src/lib/adapters/codex.ts`
- **Verification:** `npm run build` passed.
- **Committed in:** `9d52ee5`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking issue)
**Impact on plan:** Required for build correctness; no scope expansion.

## Issues Encountered

- The `rtk test` shell builtin invocation is not usable in this environment, so file-existence checks were verified with `rtk ls` while preserving the same acceptance intent.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None.

## Verification

- `rtk ls src/lib/adapters/codex.ts` - passed
- `rtk rg` check for Codex adapter class and Codex install target constants - passed
- `rtk rg -n "codex: async|CodexAdapter" src/lib/adapters/index.ts` - passed
- `rtk rg -n "new Set<SupportedTool>\\(\\[\\"copilot\\"\\]\\)" src/commands/init.ts` - passed
- `rtk npm run build` - passed

## Next Phase Readiness

Codex is now adapter-backed and no longer reported as pending. Plan 07-03 can add Codex regression coverage, and plan 07-05 can later wire Copilot while preserving this resolver pattern.

## Self-Check: PASSED

- Summary file exists.
- Modified code files exist.
- Commits `e34f185`, `feea9d4`, `eda8b48`, and `9d52ee5` are reachable in git history.

---
*Phase: 07-codex-and-copilot-adapters*
*Completed: 2026-05-01*
