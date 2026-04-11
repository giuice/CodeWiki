# Quick Task 260411-mzx — Summary

**Task:** Reconcile v2 docs to 8-command canon — unblocked fixes + apply Q1 resolution (OpenCode post-hook = `session_completed → post-verify.sh` only)
**Date:** 2026-04-11
**Status:** Complete
**Branch:** main (no quick-task branch)

## Scope

Applied the un-blocked fixes from `docs/docs-reconciliation-handoff.md` §4–§5 plus the just-decided Q1 resolution to v2 PRD and the OpenCode hook example in research/FEATURES.md. Q2, Q3, and Q4 remain open and are deliberately untouched.

## Commits

| # | Hash | Subject | Files |
|---|------|---------|-------|
| 1 | `7dc3460` | `docs(quick-260411-mzx): align command count to 8 in implementation plan, research, README` | `docs/implementation-plan-v2.md`, `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/FEATURES.md` (line 137 only), `README.md` |
| 2 | `5efd16e` | `docs(quick-260411-mzx): mark codewiki-project.md as v1 superseded by v2 PRD` | `docs/codewiki-project.md` |
| 3 | `cace4e9` | `docs(quick-260411-mzx): resolve Q1 — OpenCode post-hook is session_completed only` | `docs/codewiki-project-v2.md` (§6.1 OpenCode row, line 326), `.planning/research/FEATURES.md` (line 5 confidence note, lines 92–97 hook JSON, line 99 prose) |

Total: **7 files modified**, **3 atomic commits**, **27 insertions / 15 deletions**.

## What Changed

### Task 1 — Command-count alignment (8 is canon)

- `docs/implementation-plan-v2.md`:
  - Added a "Command count note" near the top explaining the Phase 3 (6 commands) → Phase 3.1 (+absorb, +breakdown) → total 8 evolution, so a reader doesn't hit the 6→8 drift without context.
  - "Available Commands" list refreshed to include `/codewiki-absorb` and `/codewiki-breakdown` rows.
  - Four stale `(6 commands)` / `# Should have 6 .md files` references in the install-report and smoke-test sections updated to `8`. (Handoff said line 552 for the smoke-test check; actual was line 551 — one-off drift noted and resolved by content match.)
- `.planning/research/SUMMARY.md:101` → "all 8 slash command .md files for Claude Code (6 from Phase 3, 2 added in Phase 3.1)".
- `.planning/research/ARCHITECTURE.md` lines 85 / 89 / 93 → three template-tree comments updated from `# 6 ... command .md files` to `# 8 ... command .md files`. ASCII alignment preserved.
- `.planning/research/FEATURES.md:137` → MVP launch list bullet for Claude Code adapter now reads `8 commands` (lines 70, 85, 107–108 deliberately untouched — Q3-blocked).
- `README.md:348` → Phase 3.1 row description now reads `+2 slash commands (absorb, breakdown), backlinks, session-end hook` so the cumulative 8-command total is derivable from the table. Phase 3 row text left historically accurate.

### Task 2 — v1 deprecation banner

- `docs/codewiki-project.md`: prepended the SUPERSEDED banner verbatim from handoff §4.8. The v1 body is preserved unchanged.

### Task 3 — Q1 resolution (OpenCode hook wiring)

Decision: **Phase 6 plan wins.** OpenCode post-hook = `experimental.hooks.session_completed → post-verify.sh` only. No `file_edited`, no `session-end.sh` wiring, no PreToolUse equivalent.

**Decision anchor — `docs/skills/wiki.md`:** the wiki skill treats absorption as a deliberate batch operation performed at session end, not a per-edit reflex. `session_completed` fires once when a session terminates, which matches the batch-absorb mental model exactly. `file_edited` would fire mid-flow on every edit and violate "absorb is deliberate" — it would also flood the wiki proposal queue with noise from in-progress work. OpenCode has no PreToolUse equivalent, so pre-edit wiki context must come from `AGENTS.md` instructions, which the Phase 6 plans already arrange via `src/templates/opencode/instructions.md`.

- `docs/codewiki-project-v2.md` §6.1 OpenCode row (line 326) → `experimental.hooks.session_completed → post-verify.sh` with inline note that there is no PreToolUse equivalent.
- `.planning/research/FEATURES.md` line 5 (Confidence) → "OpenCode has no PreToolUse equivalent — post-hook uses `session_completed` (confirmed)".
- `.planning/research/FEATURES.md` OpenCode JSON example (lines 92–97) → shows only `session_completed → post-verify.sh`; the dual-event `file_edited` + `session_completed → session-end.sh` block is removed.
- `.planning/research/FEATURES.md` line 99 prose → updated to explain the absent PreToolUse and direct pre-edit context to `AGENTS.md`.

Phase 6 plans (`06-01-PLAN.md`, `06-02-PLAN.md`) were spot-checked — already correct per handoff §4.9/§4.10, no edits needed.

## Intentionally NOT Touched (still blocked)

| Item | Blocker |
|------|---------|
| `docs/codewiki-project-v2.md` §5.2.4 session-end.sh description | **Q2** (session-end.sh status: shipped-but-dormant vs. wired vs. Phase-8+) |
| `.planning/REQUIREMENTS.md` CODEX-01 (still says 6 commands) | **Q3** (Codex/Copilot 8-command requirement with real research gaps) |
| `.planning/REQUIREMENTS.md` COP-04 addition | **Q3** |
| `.planning/ROADMAP.md` Phase 7 Codex/Copilot lines | **Q3** |
| `.planning/research/FEATURES.md` lines 70, 85, 107–108 (Codex/Copilot RESEARCH GAP markers) | **Q3** |
| Historical phase artifacts under `.planning/phases/01-*`, `03-*`, `04-*` | **Q4** (leave intact as historical snapshots — recommended option) |
| `docs/inconsistences.md` cleanup/removal | Last-step after all 4 questions resolved |

## Verification

- `git log --oneline -5` shows three `docs(quick-260411-mzx): …` commits fast-forwarded onto main.
- `rg -n "\(6 commands\)|6 slash command|# 6 command|# same 6 command" docs/ .planning/research/ README.md` returns **zero** hits (the scoped check — `.planning/REQUIREMENTS.md` is out of scope per Q3).
- `rg -n "file_edited" docs/codewiki-project-v2.md .planning/research/FEATURES.md` returns **zero** hits.
- `rg -n "session_completed" docs/codewiki-project-v2.md .planning/research/FEATURES.md .planning/phases/06-opencode-adapter/` returns the expected unified references pointing at `post-verify.sh`.
- Pre-existing uncommitted change on `.planning/research/FEATURES.md:30` ("6 slash commands with tool-native frontmatter" → "8") was preserved across the merge and is still pending as an uncommitted main-branch change — the user can include it in their next commit.

## Drift Notes

1. **Handoff line 552 → actual line 551** on `docs/implementation-plan-v2.md` smoke-test block. Content matched; resolved by content-based match rather than line-number match. No edit needed to the handoff itself.
2. **Handoff §4.2 overstated drift** — `implementation-plan-v2.md` lines 17–24 already contained a "Workflow target" block listing all 8 commands. The newly-added "Command count note" is still valuable because it explains the **6→8 evolution** specifically, but the doc was less drifted at the top than the handoff implied.

## Follow-ups for Next Session

1. Answer **Q2** (session-end.sh status) → unblocks v2 PRD §5.2.4 and §4.2 diagram.
2. Answer **Q3** (Codex/Copilot 8-command requirement) → unblocks REQUIREMENTS.md CODEX-01 + COP-04, ROADMAP.md Phase 7 lines, FEATURES.md Codex/Copilot sections.
3. Answer **Q4** (historical artifact handling) → most likely "leave intact" per handoff recommendation.
4. After Q2–Q4 resolved: delete `docs/inconsistences.md` and `docs/docs-reconciliation-handoff.md` (or add RESOLVED banners pointing at this commit range).
