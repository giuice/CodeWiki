# Phase 4: Claude Code Adapter + init Command - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `04-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 04-claude-code-adapter-init-command
**Areas discussed:** Claude install surface, Installer architecture, Tool detection and fallback UX, Existing-file behavior

---

## Claude install surface

| Option | Description | Selected |
|--------|-------------|----------|
| Full post-3.1 set | Install all current Claude assets: 8 commands, 2 agents, and shared hook scripts including session-end. | |
| Phase 4 snapshot only | Keep the older roadmap/test expectation: 6 commands, 2 agents, and only the pre/post hook path. | |
| Hybrid | Install all 8 commands and 2 agents now, but copy `session-end.sh` without Claude lifecycle wiring yet. | ✓ |

**User's choice:** Hybrid
**Notes:** Follow-up clarified that Phase 4 should copy `session-end.sh`, keep `.claude/settings.json` on pre/post hook wiring only, and report `session-end.sh` as installed but inactive.

---

## Installer architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Thin generic installer pipeline | Introduce small per-tool installer abstractions now, but only implement Claude in this phase. | ✓ |
| Claude-only path in init.ts | Implement Phase 4 directly in `init.ts` and refactor later. | |
| Shared helpers, minimal abstraction | Extract copy/merge helpers now, but keep adapter orchestration mostly Claude-specific until later phases. | |

**User's choice:** Thin generic installer pipeline
**Notes:** The current shared helpers (`SupportedTool`, detection, scaffold, report formatting, merge utilities) are enough justification to avoid a Claude-only dead end.

---

## Tool detection and fallback UX

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt when interactive, error when non-interactive | Match the docs without hurting CI or scripted usage. | ✓ |
| Always require `--tool` | No interactive fallback; fail with guidance to pass `--tool`. | |
| Default to `claude-code` | Treat Claude as the default install target when nothing is detected. | |

**User's choice:** Prompt when interactive, error when non-interactive
**Notes:** This keeps the product behavior aligned with the design docs while preserving deterministic behavior for automation.

---

## Existing-file behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Safe merge and per-file skip | Create or merge `CLAUDE.md` and `.claude/settings.json` as needed, skip copied assets without `--force`, and continue with a full report. | ✓ |
| Abort on any existing Claude target | If any relevant file exists, stop unless `--force` is provided. | |
| Merge configs, abort on copied assets | Allow settings/instructions merge, but stop if command, agent, or hook files already exist. | |

**User's choice:** Safe merge and per-file skip
**Notes:** Follow-up clarified that explicit Claude selection should create missing `.claude/` and `CLAUDE.md` automatically instead of requiring those files to pre-exist.

---

## the agent's Discretion

- Exact grouping and wording of the install report.
- Final code layout for the thin generic installer modules.
- Whether interactive tool-choice prompts should show only implemented adapters or show future adapters with explicit limitations.

## Deferred Ideas

- Claude lifecycle wiring for `session-end.sh` after the Claude hook model is confirmed.
- Full non-Claude adapter implementation remains in later phases.