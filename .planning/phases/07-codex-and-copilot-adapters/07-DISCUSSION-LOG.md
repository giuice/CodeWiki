# Phase 7: Codex and Copilot Adapters - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 07-codex-and-copilot-adapters
**Areas discussed:** Codex hook clarity, Phase 7 atomic slicing, Copilot agentStop, instruction-file preservation

---

## Codex Hook Clarity

| Option | Description | Selected |
|--------|-------------|----------|
| Treat Codex wrappers as a gray area | Ask the user to decide whether the documented Codex hook strategy is desired | |
| Treat docs as locked | Follow `docs/codewiki-project-v2.md` and current official Codex docs without re-asking the strategy | yes |

**User's choice:** The user pointed out that this was already clear in the documentation and should not have been asked as an open product question.
**Notes:** Official Codex docs were checked during discussion. The Codex hook strategy is locked: `UserPromptSubmit` for prompt context, `PostToolUse` via JSON wrapper, loop-safe `Stop`, and `[features] codex_hooks = true`.

---

## Phase 7 Atomic Slicing

| Option | Description | Selected |
|--------|-------------|----------|
| Partial adapter scope | Ship only some Codex/Copilot pieces in Phase 7 and defer the rest | |
| Complete adapter scope with small plans | Keep all Codex/Copilot adapter work in Phase 7, but split aggressively for token/context limits | yes |

**User's choice:** The user clarified that complete adapters were planned, and that the right response to current AI token limits is atomic plans inside Phase 7.
**Notes:** The planner should split Codex and Copilot work into small, independently verifiable plans. This does not reduce Phase 7 scope.

---

## Copilot agentStop

| Option | Description | Selected |
|--------|-------------|----------|
| Do not wire agentStop yet | Start with `preToolUse`/`postToolUse` only and leave post-turn follow-up for later | |
| Wire agentStop conservatively | Use `agentStop` as the meaningful post-turn hook, with anti-loop protection | yes |

**User's choice:** The user agreed with wiring `agentStop` conservatively after discussing the loop/noise risk.
**Notes:** `sessionEnd` remains cleanup-only. `agentStop` should force continuation only when there is clear CodeWiki follow-up work and must avoid repeated self-triggering.

---

## Instruction-File Preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Replace instruction files | Treat `AGENTS.md` or Copilot instructions as generated files | |
| Merge marker sections only | Preserve all existing user text and manage only the CodeWiki marker block | yes |

**User's choice:** The user explicitly stated that existing `AGENTS.md` text must never be deleted.
**Notes:** This applies to Codex `AGENTS.md` and, by the same no-clobber pattern, Copilot `.github/copilot-instructions.md`. Use marker comments and never overwrite the whole file.

---

## the agent's Discretion

- Exact plan boundaries inside Phase 7, as long as every plan is small enough for context limits and all Codex/Copilot adapter scope remains in Phase 7.
- Exact wrapper script file split, as long as the documented hook contracts and loop-safety requirements are met.
- Exact compact instruction wording, as long as existing user text is preserved and operational caveats are explicit.

## Deferred Ideas

None.
