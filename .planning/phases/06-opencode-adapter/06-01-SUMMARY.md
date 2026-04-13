---
phase: 06-opencode-adapter
plan: "01"
subsystem: adapter-templates
tags: [opencode, plugin, agents, instructions, codewiki]
requires: []
provides:
  - Thin OpenCode plugin template wired to shared CodeWiki hooks
  - OpenCode-native updater and verifier agent templates
  - Concise OpenCode AGENTS.md marker content for later merge
affects: [06-02, opencode-adapter, installer-assets]
tech-stack:
  added: []
  patterns:
    - OpenCode-owned assets stay host-native while preserving shared CodeWiki behavior contracts
    - The OpenCode plugin remains an event-to-hook bridge with no embedded wiki logic
key-files:
  created:
    - src/templates/opencode/plugins/codewiki.ts
    - src/templates/opencode/agents/codewiki-wiki-updater.md
    - src/templates/opencode/agents/codewiki-verifier.md
    - src/templates/opencode/instructions.md
  modified: []
key-decisions:
  - The OpenCode plugin template uses only tool.execute.before, file.edited, and session.idle as the documented event bridge.
  - OpenCode agent templates preserve the updater/verifier role pair but use OpenCode markdown-agent framing.
  - The AGENTS.md marker block stays concise and limited to CodeWiki-owned behavior.
patterns-established:
  - OpenCode templates should adapt to host ergonomics instead of cloning Claude surfaces literally
  - Approval and read-only boundaries belong in the agent prompts, not the plugin dispatcher
requirements-completed: [OC-02, OC-03, OC-04]
duration: -
completed: 2026-04-13
---

# Phase 06 Plan 01: OpenCode Template Assets Summary

**OpenCode now has a thin plugin template, two host-native agent templates, and a concise AGENTS.md marker block that preserve CodeWiki's shared hook and approval model.**

## Performance

- **Duration:** -
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added a project-local OpenCode plugin template that forwards the documented host events into the shared CodeWiki shell hooks.
- Added OpenCode-specific updater and verifier agent templates that preserve per-change approval and read-only verification boundaries.
- Added a concise AGENTS.md marker template that documents CodeWiki skills, approval rules, hook behavior, and the key project paths without importing Claude-specific wording.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the thin OpenCode plugin template** - `6729aaf` (feat)
2. **Task 2: Create OpenCode-specific updater and verifier agent templates** - `6afea27` (feat)
3. **Task 3: Create the concise OpenCode AGENTS marker template** - `917e4a4` (docs)

## Files Created/Modified

- `src/templates/opencode/plugins/codewiki.ts` - thin OpenCode event dispatcher for the shared CodeWiki hooks.
- `src/templates/opencode/agents/codewiki-wiki-updater.md` - approval-gated wiki updater prompt for OpenCode's markdown-agent surface.
- `src/templates/opencode/agents/codewiki-verifier.md` - read-only contradiction and reference verifier prompt for OpenCode.
- `src/templates/opencode/instructions.md` - compact CodeWiki marker content for OpenCode-managed `AGENTS.md` sections.

## Decisions Made

- Used a thin shell-dispatch implementation inside the plugin template so the generated file can pass event payloads to the shared hooks without adding product logic.
- Kept the OpenCode agent prompts concise and host-native instead of mirroring the Claude templates line-for-line.
- Scoped the instructions template to the OpenCode-managed boundary only: skills, approval, hooks, and important project paths.

## Verification

- `test -f src/templates/opencode/plugins/codewiki.ts`
- `rg -n "tool\.execute\.before|file\.edited|session\.idle|pre-wiki-context\.sh|post-verify\.sh|session-end\.sh" src/templates/opencode/plugins/codewiki.ts`
- `test -f src/templates/opencode/agents/codewiki-wiki-updater.md`
- `test -f src/templates/opencode/agents/codewiki-verifier.md`
- `rg -n "approval|wiki/index\.md|contradiction|broken ref|read-only|mode:" src/templates/opencode/agents/codewiki-wiki-updater.md src/templates/opencode/agents/codewiki-verifier.md`
- `test -f src/templates/opencode/instructions.md`
- `rg -n "wiki/|raw/|\.codewiki/config\.yml|wiki/_backlinks\.json|approval" src/templates/opencode/instructions.md`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The initial GSD executor lane never returned a usable completion signal, so the plan was executed inline using the workflow's sequential fallback.

## User Setup Required

None.

## Next Phase Readiness

- Plan 06-02 can now build the real OpenCode adapter against concrete plugin, agent, and instruction assets.
- The remaining risk is live OpenCode runtime behavior, especially payload shapes for the documented plugin events.

## Self-Check: PASSED

---
*Phase: 06-opencode-adapter*
*Completed: 2026-04-13*
