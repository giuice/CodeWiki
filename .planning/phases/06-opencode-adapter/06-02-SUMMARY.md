---
phase: 06-opencode-adapter
plan: "02"
subsystem: installer
tags: [opencode, installer, init, regression, templates, agmts]
requires:
  - phase: 06-opencode-adapter
    provides: OpenCode plugin, agent, and instructions templates
provides:
  - Real OpenCode adapter layered on top of shared-skills installation
  - Accurate init reporting for OpenCode as a shipped integration
  - Regression coverage for explicit OpenCode bootstrap and rerun idempotency
affects: [phase-07, init-reporting, template-regressions]
tech-stack:
  added: []
  patterns:
    - Non-Claude tools can layer a host-specific adapter on top of the shared .agents/skills tree
    - OpenCode regression coverage combines compiled init tests with template-level contract tests
key-files:
  created:
    - src/lib/adapters/opencode.ts
    - src/templates/__tests__/opencode-adapter.test.ts
  modified:
    - src/lib/adapters/index.ts
    - src/commands/init.ts
    - test/init.test.ts
    - src/templates/opencode/plugins/codewiki.ts
key-decisions:
  - OpenCode installs now resolve as shared-skills plus a real host adapter instead of staying in the pending bucket.
  - The pending-integration report remains for Codex and Copilot only after OpenCode becomes real.
  - Template source files must stay buildable inside the package pipeline even when they target a different host runtime.
patterns-established:
  - Real tool adapters should reuse the existing copy and marker-merge helpers instead of wiring tool logic through init.ts
  - Explicit init coverage should assert both installed files and idempotent marker merging for new adapters
requirements-completed: [OC-01, OC-02, OC-03, OC-04]
duration: -
completed: 2026-04-13
---

# Phase 06 Plan 02: OpenCode Adapter and Regression Coverage Summary

**The installer now ships a real OpenCode surface on top of shared skills, and the regression suite proves explicit bootstrap plus rerun idempotency end to end.**

## Performance

- **Duration:** -
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added a real `OpenCodeAdapter` that installs `.opencode/plugins/codewiki.ts`, `.opencode/agents/`, and a managed `AGENTS.md` marker block while keeping `.agents/skills/` as the shared non-Claude skill tree.
- Updated `init` reporting so OpenCode no longer appears as a shared-skills-only pending integration once its adapter ships.
- Added compiled `init` coverage and template-level OpenCode assertions that lock bootstrap output, rerun idempotency, and the OpenCode template contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement the real OpenCode adapter and resolve it alongside shared-skills** - `eca702a` (feat)
2. **Task 2: Remove OpenCode from the pending-integration report once the adapter is real** - `4852b7c` (fix)
3. **Task 3: Add OpenCode regression coverage for bootstrap, reruns, and template contracts** - `d552da6` (test)
4. **Blocking verification fix: keep the OpenCode plugin template buildable inside this package** - `85ecf41` (fix)

## Files Created/Modified

- `src/lib/adapters/opencode.ts` - installs the OpenCode-owned plugin, agents, and AGENTS.md marker content.
- `src/lib/adapters/index.ts` - resolves OpenCode as shared-skills plus a real host adapter.
- `src/commands/init.ts` - removes OpenCode from the shared-skills-only pending list.
- `test/init.test.ts` - proves explicit `init --tool opencode` bootstrap and rerun idempotency.
- `src/templates/__tests__/opencode-adapter.test.ts` - locks the OpenCode template contract.
- `src/templates/opencode/plugins/codewiki.ts` - switched the dispatcher implementation to a package-build-safe process bridge after verification exposed a compile issue.

## Decisions Made

- Kept the adapter implementation inside the existing adapter layer so `init` remains an orchestrator rather than a host-specific installer.
- Preserved the shared-skills tree for OpenCode and added only the host-owned surfaces that Phase 6 explicitly promised.
- Treated the package build as part of the template contract, which required replacing the Bun-specific global reference in the plugin template.

## Verification

- `npm run build`
- `node --test dist/test/init.test.js`
- `npx vitest run src/templates/__tests__/opencode-adapter.test.ts`
- `npm test`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] OpenCode plugin template used a Bun-specific global that broke the package build**
- **Found during:** Final verification (`npm run build`)
- **Issue:** `src/templates/opencode/plugins/codewiki.ts` is compiled as part of this repository before being copied into `dist/templates`, so `Bun` failed TypeScript compilation even though the file is only a generated template.
- **Fix:** Replaced the Bun-specific process bridge with a `node:child_process` implementation that preserves the same hook-dispatch behavior and stdin payload forwarding.
- **Files modified:** `src/templates/opencode/plugins/codewiki.ts`
- **Verification:** `npm run build`; `node --test dist/test/init.test.js`; `npx vitest run src/templates/__tests__/opencode-adapter.test.ts`; `npm test`
- **Committed in:** `85ecf41`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix kept the shipped OpenCode behavior intact while making the package buildable and testable in this repository.

## Issues Encountered

- The initial `gsd-executor` lane never returned a usable completion signal, so the phase execution continued inline with the workflow's sequential fallback.

## User Setup Required

None.

## Next Phase Readiness

- Phase 06 is ready to close: the OpenCode adapter now satisfies the planned install, reporting, and idempotency contracts.
- Phase 07 can build on the shared-skills plus host-adapter pattern for Codex and Copilot.

## Self-Check: PASSED

---
*Phase: 06-opencode-adapter*
*Completed: 2026-04-13*
