# CodeWiki Docs Reconciliation — Handoff

**Created:** 2026-04-11
**Last updated:** 2026-04-11 (late session — Q1 resolved, unblocked fixes applied)
**Purpose:** Full context for resolving the v2 documentation drift flagged in `docs/inconsistences.md`. Written as a handoff so a new session can continue without losing context.
**Related audit:** `docs/inconsistences.md` (read-only audit output that triggered this work)

---

## 0. STATUS (read this first — supersedes §5 task list)

### What has been DONE (4 commits on `main`)

| Commit | What |
|---|---|
| `7dc3460` | **Task 1 — 8-command canon alignment.** `docs/implementation-plan-v2.md` (command-count note added, Available Commands refreshed with absorb + breakdown, 4 stale `(6 commands)` refs fixed), `.planning/research/SUMMARY.md:101`, `.planning/research/ARCHITECTURE.md:85/89/93`, `.planning/research/FEATURES.md:137`, `README.md:348` (new Phase 3.1 row added). |
| `5efd16e` | **Task 2 — v1 deprecation banner.** SUPERSEDED banner prepended to `docs/codewiki-project.md`; body untouched. |
| `cace4e9` | **Task 3 — Q1 resolution: OpenCode post-hook = `session_completed → post-verify.sh` only.** Updated `docs/codewiki-project-v2.md` §6.1 OpenCode row (line 326) and `.planning/research/FEATURES.md` (line 5 confidence note, lines 92–97 hook JSON, line 99 prose). |
| `15d08d5` | Quick-task artifacts: PLAN.md, SUMMARY.md, STATE.md row. |

Files handled across the above: `docs/implementation-plan-v2.md`, `docs/codewiki-project.md`, `docs/codewiki-project-v2.md` (partial — only §6.1 OpenCode row), `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/FEATURES.md` (partial — lines 5, 92–99, 137 only), `README.md`.

### Q1 — ANSWERED → option (a): Phase 6 plan wins

OpenCode post-hook wiring is `experimental.hooks.session_completed → post-verify.sh` only. No `file_edited`, no `session-end.sh` wiring, no PreToolUse. Rationale anchor: `docs/skills/wiki.md` — the wiki skill treats absorption as a deliberate batch operation at session end, which matches `session_completed` (fires once at session termination). `file_edited` would fire per-edit mid-flow and violate batch-absorb semantics. OpenCode has no PreToolUse equivalent; pre-edit context must come from `AGENTS.md` instructions, which Phase 6 plans already arrange via `src/templates/opencode/instructions.md`.

### What remains — Q2, Q3, Q4 still OPEN

**Q2** (§3.Q2 below) — `session-end.sh` status. Recommendation on the table: **option (a) "shipped but dormant"**. Rationale: matches PROJECT.md Key Decisions line 73 (Claude installs it but reports inactive until platform support confirmed); matches the Phase 6 decision (Q1) that OpenCode's `session_completed` goes to `post-verify.sh` not `session-end.sh`; honest about real state. Through the wiki.md lens: wiki.md's `/wiki absorb` is user-invoked, so a dormant session-end.sh + manual `/codewiki-absorb` as the primary path is faithful to the wiki.md model. **Files that need editing after Q2:** `docs/codewiki-project-v2.md:121` (§4.2 diagram annotation) and `docs/codewiki-project-v2.md:266-273` (§5.2.4 Session-End Hook section rewrite). No other doc needs Q2 edits.

**Q3** (§3.Q3 below) — Codex / Copilot 8-command requirement with real platform gaps. Recommendation on the table: **option (a) "Full 8 commands, per-tool path TBD by spike, fallback allowed"**. Rationale: keeps 8-command canon intact; acknowledges the real research gap; unblocks Phase 7 planning. **Files that need editing after Q3:**
- `.planning/REQUIREMENTS.md:67` — CODEX-01: "Installs 6 slash commands..." → "Installs 8 slash commands to the confirmed Codex command directory (per-project if available, else global `~/.codex/prompts/` with install-report notice)"
- `.planning/REQUIREMENTS.md:73-76` — Add COP-04: "Installs 8 command definitions via confirmed mechanism OR instruction-file fallback"
- `.planning/REQUIREMENTS.md:172-177` — Traceability rows for new COP-04
- `.planning/REQUIREMENTS.md:183` — Bump `v1 requirements: 54 total` → `55 total`
- `.planning/ROADMAP.md:141` — "6 slash commands are installed" → "8 slash commands are installed"
- `.planning/ROADMAP.md:142` — Clarify Copilot fallback path wording
- `.planning/research/FEATURES.md:70` — Codex RESEARCH GAP: keep the gap marker but align the 8-command expectation
- `.planning/research/FEATURES.md:85` — Copilot RESEARCH GAP: same treatment
- `.planning/research/FEATURES.md:107-108` — Commands path table rows for Codex/Copilot
- `.planning/research/SUMMARY.md:14` — Soften "Claude Code adapter is the only fully-specified implementation at v1 launch" since Phase 4 is validated and Phase 6 plan exists
- `docs/codewiki-project-v2.md:324` — Codex `.codex/commands/codewiki/*.md` row: mark "unverified" or add fallback clause to match Q3 decision
- `docs/codewiki-project-v2.md:325` — Copilot "Slash commands via custom agents" row: same treatment
- `docs/codewiki-project-v2.md:315-326` — §6.1 may benefit from an explicit "Hook Strategy Matrix" sub-table showing which hook events each tool exposes (mentioned in §4.1 below)

**Q4** (§3.Q4 below) — historical planning artifacts. Recommendation: **option (a) "leave intact"**. These are historical snapshots of what was true then (Phase 3 really did ship 6 commands before Phase 3.1 added absorb + breakdown). No edits needed. This is the lightest-touch option and preserves the evolution history.

### Final cleanup (after Q2–Q4 applied)

- `docs/inconsistences.md` — delete OR add a `> **RESOLVED 2026-04-NN**` banner pointing to commit range `7dc3460..HEAD`
- `docs/docs-reconciliation-handoff.md` (this file) — delete OR same treatment

### Pre-existing uncommitted state on `main` (NOT introduced by this reconciliation — do not discard)

- `.planning/REQUIREMENTS.md` — was already dirty before reconciliation; pending Q3 edits above
- `.planning/ROADMAP.md` — was already dirty; pending Q3 edits above
- `.planning/research/FEATURES.md:30` — "6 slash commands with tool-native frontmatter" → "8" edit was already made uncommitted; still sitting uncommitted, should be included in the next commit that touches FEATURES.md for Q3 work
- `.planning/phases/06-opencode-adapter/06-01-PLAN.md`, `06-02-PLAN.md` — already correct per handoff §4.9/§4.10; modifications were pre-existing, safe to commit separately or leave

### How to resume

1. Read this §0 block first.
2. Confirm or revise Q2/Q3/Q4 recommendations above.
3. Apply the Q2 edits → commit `docs(quick-XXX): resolve Q2 — session-end.sh shipped-but-dormant`.
4. Apply the Q3 edits → commit `docs(quick-XXX): resolve Q3 — Codex/Copilot 8-command with fallback`.
5. Q4: do nothing (leave historical artifacts intact).
6. Verify no stale `6 commands` / `file_edited` references remain in product or research docs (the 4 earlier commits already handled the OpenCode + Phase 3/3.1 slice; Q3 handles Codex/Copilot).
7. Delete `docs/inconsistences.md` and this file (or banner them).

---

## 1. Goal

Bring every product, planning, and research doc into alignment with the **8-slash-command, 4-tool, full-hook-automation** surface that the v2 PRD workflow (§5.0) describes. No gaps accepted for Codex, Copilot, or OpenCode.

**Canonical command surface (all four tools):**
1. `/codewiki-ingest`
2. `/codewiki-query`
3. `/codewiki-lint`
4. `/codewiki-absorb` *(added in Phase 3.1)*
5. `/codewiki-breakdown` *(added in Phase 3.1)*
6. `/codewiki-prd`
7. `/codewiki-tasks`
8. `/codewiki-process`

**Canonical workflow (from v2 PRD §5.0):**
1. `npx codewiki init` — scaffold wiki, prompts, hooks, tool-specific instructions.
2. `/codewiki-ingest` raw material until wiki reflects current project state.
3. `/codewiki-prd` then `/codewiki-tasks` for net-new work.
4. `/codewiki-process` runs tasks; pre-hook injects context, post-hook triggers wiki proposals.
5. Human reviews every wiki proposal from post-verify flow.
6. `session-end.sh` or manual `/codewiki-absorb` at session end.
7. `/codewiki-breakdown`, `/codewiki-lint`, `/codewiki-query` between features.

---

## 2. Decisions already made (answered by user in this session)

| # | Decision | Source |
|---|---|---|
| D1 | **Workflow: targeted reconciliation**, not the /gsd-docs-update 9-doc generator. Surgical edits to existing product/planning docs. | User answered |
| D2 | **Canonical source of truth: `docs/codewiki-project-v2.md`** (with its own internal drift fixed first). All other docs must align to v2. | User answered |
| D3 | **Research docs (FEATURES.md, SUMMARY.md) are updated to match product claims** where product doc treats capabilities as settled. Genuine research gaps may remain. | User answered |
| D4 | **v1 legacy doc (`docs/codewiki-project.md`) gets a deprecation banner**; body left intact. Old quick-task PLAN and other archived artifacts left alone. | User answered |

---

## 3. OPEN QUESTIONS — need user answers before any v2 PRD edits

These four points are real conflicts between v2 PRD and downstream plans. Cannot be resolved unilaterally.

### Q1. OpenCode hook wiring — which is canonical?

Three different wirings exist across docs:

| Source | File:line | Wiring |
|---|---|---|
| v2 PRD §6.1 table | `docs/codewiki-project-v2.md:326` | `experimental.hooks.file_edited` (only) |
| Research FEATURES | `.planning/research/FEATURES.md:90-98` | `file_edited → post-verify.sh` AND `session_completed → session-end.sh` (both events) |
| Phase 6 plan 02 | `.planning/phases/06-opencode-adapter/06-02-PLAN.md:196` | **ONLY** `session_completed → post-verify.sh`. Explicitly says "do not add file_edited, session-end.sh, PreToolUse, or PostToolUse wiring" |
| REQUIREMENTS OC-03 | `.planning/REQUIREMENTS.md:81` | `session_completed` only, no PreToolUse |

**Options:**
- **(a) Phase 6 plan wins** — only `session_completed → post-verify.sh`. Already written into OC-03 and the phase plans. Editing v2 PRD and FEATURES.md to match would be a straight fix.
- **(b) v2 PRD wins as-is** — would require rewriting OC-03 and 06-02-PLAN.md.
- **(c) Research FEATURES wins (both events)** — would require rewriting OC-03, 06-02-PLAN.md, and v2 PRD §6.1 row.

### Q2. `session-end.sh` current status

| Source | File:line | Claim |
|---|---|---|
| v2 PRD §5.2.4 | `docs/codewiki-project-v2.md:266-273` | Active hook that fires on session end to trigger lightweight absorb |
| v2 PRD §4.2 diagram | `docs/codewiki-project-v2.md:121` | Listed as installed hook |
| PROJECT.md Key Decisions | `.planning/PROJECT.md:73` | "Phase 04: Claude installs `session-end.sh` but reports it as **inactive** until a supported Claude session lifecycle hook is confirmed" |
| Phase 6 plan 02 | `.planning/phases/06-opencode-adapter/06-02-PLAN.md:196` | Do NOT add `session-end.sh` wiring to OpenCode |

**Real state:** session-end.sh ships as an asset. Not wired to any tool's config currently. v2 PRD §5.2.4 describes it as live.

**Options:**
- **(a) "Shipped but dormant"** — update v2 PRD to say "installed as an asset; activation pending confirmed platform hook support." Most honest.
- **(b) Wire it into OpenCode `session_completed`** — changes Phase 6 plan decision.
- **(c) Mark as Phase 8+ feature** — remove from current hook description.

### Q3. Codex / Copilot 8-command requirement with real platform gaps

| Source | File:line | Current text |
|---|---|---|
| v2 PRD §6.1 | `docs/codewiki-project-v2.md:324` | Codex: `.codex/commands/codewiki/*.md` (unverified) |
| v2 PRD §6.1 | `docs/codewiki-project-v2.md:325` | Copilot: "Slash commands via custom agents" (unverified) |
| REQUIREMENTS | `.planning/REQUIREMENTS.md:67` | **CODEX-01: "Installs 6 slash commands"** — stale count AND unverified path |
| REQUIREMENTS | `.planning/REQUIREMENTS.md:73-75` | No COP command-count requirement; COP-03 = "Documents slash command limitation" |
| Research FEATURES | `.planning/research/FEATURES.md:70,85,107-108` | "RESEARCH GAP" — Codex per-project path unconfirmed; Copilot has no confirmed file-based slash command directory |
| STATE.md blockers | `.planning/STATE.md:89-90` | Spikes required before Codex/Copilot phases planned |

**Options:**
- **(a) Full 8 commands, per-tool path TBD by spike** — CODEX-01 becomes "Installs 8 slash commands to confirmed path (per-project if available, else global `~/.codex/prompts/` with install-report notice)". Add COP-04 "Installs 8 command definitions via confirmed mechanism or instruction-file fallback."
- **(b) 8 commands mandatory, no fallback** — blocks Phase 7 until spikes prove this is possible.
- **(c) Instruction-file fallback explicitly allowed** — commands described in CLAUDE.md/AGENTS.md when no file-based path exists. The 8 logical commands must be reachable somehow.

### Q4. Historical planning artifacts

Files that correctly describe past state (Phase 3 really only shipped 6 commands; Phase 3.1 added absorb+breakdown):

```
.planning/phases/01-clean-slate/01-01-PLAN.md:53            ("6 v1 runtime commands" - unrelated, about deleted CLI commands)
.planning/phases/01-clean-slate/01-RESEARCH.md:46
.planning/phases/03-prompt-templates-and-hook-scripts/03-RESEARCH.md:9,20
.planning/phases/03-prompt-templates-and-hook-scripts/03-CONTEXT.md:9,17
.planning/phases/03-prompt-templates-and-hook-scripts/03-01-PLAN.md:45
.planning/phases/04-claude-code-adapter-init-command/04-DISCUSSION-LOG.md:17
.planning/quick/260407-ulj-update-readme-md-to-reflect-current-proj/260407-ulj-PLAN.md:40,147
.planning/ROADMAP.md:68  (Phase 3 completed-plan title: "Create 6 slash command markdown files")
```

**Options:**
- **(a) Leave intact** — historical snapshots of what was true then. My recommendation.
- **(b) Add resolution banners** to each ("Historical snapshot — pre Phase 3.1").
- **(c) Rewrite in place** — loses the evolution history. Not recommended.

---

## 4. Full file-by-file edit list

### 4.1 `docs/codewiki-project-v2.md` (canonical source)

**Needs zero command-count fixes** (already correct at 8). Open fixes depend on Q1/Q2 answers:

- Line 121 `session-end.sh` in diagram — may need "(inactive)" annotation per Q2
- Line 266-273 §5.2.4 Session-End Hook — may need rewrite per Q2
- Line 326 OpenCode table row — hook events per Q1
- Lines 315-326 §6.1 table header — claim "all four tools now support hooks, commands, and instructions natively" is the line research contradicts. Once research is updated (D3), this becomes consistent. May also benefit from an explicit "Hook Strategy Matrix" sub-table showing which hook events each tool exposes.

### 4.2 `docs/implementation-plan-v2.md` (biggest drift)

**Straight fixes — no questions:**

| Line | Current | Target |
|---|---|---|
| 334-340 | Available Commands section lists 6 commands | Add `/codewiki-absorb` and `/codewiki-breakdown` rows |
| 434 | `✓ Commands: .claude/commands/codewiki/ (6 commands)` | `(8 commands)` |
| 440 | `✓ Commands: .codex/commands/codewiki/ (6 commands)` | `(8 commands)` |
| 475 | `.claude/commands/codewiki/ingest.md exists (and all 6 commands)` | `(and all 8 commands)` |
| 552 | `ls .claude/commands/codewiki/  # Should have 6 .md files` | `# Should have 8 .md files` |
| 215-241 | absorb.md and breakdown.md task definitions — **already correct** | — |
| 597-605 | Files-to-CREATE list already includes absorb.md and breakdown.md | — |

Also worth adding: a note at the top saying "Phase 3 shipped 6 commands; Phase 3.1 added absorb + breakdown to bring the total to 8" so the 6/8 evolution is documented.

### 4.3 `.planning/REQUIREMENTS.md`

**Straight fix (Q3-dependent for exact wording):**

| Line | Current | Target |
|---|---|---|
| 67 | `CODEX-01: Installs 6 slash commands to correct Codex command directory` | `CODEX-01: Installs 8 slash commands to the confirmed Codex command directory` (exact path language from Q3) |
| 73-76 | Copilot has 3 requirements but no command-count | Add `COP-04: Installs 8 command definitions via confirmed mechanism OR instruction-file fallback` (Q3-dependent) |
| 172-177 | Traceability rows for CODEX-01..03, COP-01..03 | Add new COP-04 row if added |
| 183 | `v1 requirements: 54 total` | Bump to 55 if COP-04 added |

### 4.4 `.planning/ROADMAP.md`

**Straight fix:**

| Line | Current | Target |
|---|---|---|
| 141 | `If Codex per-project command path is confirmed, 6 slash commands are installed` | `...8 slash commands are installed` |
| 142 | `If Copilot has no confirmed slash command directory, the install report documents the limitation rather than silently skipping` | Clarify per Q3 resolution — explicitly state fallback path |
| 68 | `03-01-PLAN.md -- Create 6 slash command markdown files (ingest, query, lint, prd, tasks, process)` | **Historical — leave alone per Q4 option (a)** |

### 4.5 `.planning/research/FEATURES.md`

| Line | Current | Target |
|---|---|---|
| 5 | Confidence: "...LOW for OpenCode pre-hook capabilities" | Clarify: "OpenCode has no PreToolUse; uses session_completed instead — confirmed" |
| 30 | "8 slash commands with tool-native frontmatter" — **already says 8** | — |
| 70 | Codex "RESEARCH GAP: per-project path unconfirmed" | Keep as real gap per Q3; soften only if spike resolved |
| 85 | Copilot "RESEARCH GAP: no file-based custom slash command directory" | Keep as real gap per Q3 |
| 90-98 | OpenCode hook JSON shows both `file_edited` and `session_completed` | Update to match Q1 resolution |
| 99 | "No pre-tool hook available" | Keep — still true |
| 107-108 | Commands path table — Codex/Copilot "unconfirmed" | Align with Q3 resolution |
| 137 | MVP "Claude Code adapter (hooks + 6 commands + 2 agents...)" | **8 commands** |

### 4.6 `.planning/research/SUMMARY.md`

| Line | Current | Target |
|---|---|---|
| 101 | "all 6 slash command `.md` files for Claude Code" | **8 slash command .md files** (note: Phase 3 shipped 6, Phase 3.1 added 2) |
| 14 | "Claude Code adapter is the only fully-specified implementation at v1 launch" | Soften since Phase 4 validated and Phase 6 plan exists |

### 4.7 `.planning/research/ARCHITECTURE.md`

| Line | Current | Target |
|---|---|---|
| 85 | `│   │   ├── commands/       # 6 slash command .md files` | `# 8 slash command .md files` |
| 89 | `│   │   └── commands/       # same 6 command .md files` | `# same 8 command .md files` |
| 93 | `│   │   ├── commands/       # same 6 command .md files` | `# same 8 command .md files` |

### 4.8 `docs/codewiki-project.md` (v1 legacy)

**Prepend banner (per D4):**
```markdown
> **SUPERSEDED** — This is CodeWiki v1. The canonical product spec is now
> [`docs/codewiki-project-v2.md`](./codewiki-project-v2.md). The v2 architecture
> is CLI-as-installer with all intelligence in markdown prompts; v1 described a
> runtime CLI that has since been removed. This file is kept for historical
> reference only.
```

### 4.9 `.planning/phases/06-opencode-adapter/06-01-PLAN.md`

**Already correct** — lists all 8 commands. Git shows it's modified. No further edits needed.

### 4.10 `.planning/phases/06-opencode-adapter/06-02-PLAN.md`

**Already correct** per Phase 6 plan decisions. Git shows it's modified. No further edits needed — but its decisions drive Q1 and Q2 answers.

### 4.11 `README.md`

| Line | Current | Target |
|---|---|---|
| 348 | `| 3. Prompt Templates & Hook Scripts | 6 slash commands, 2 hooks, 2 agents | ✅ Complete |` | Either update to 8 OR add a Phase 3.1 row showing +2 commands added |

### 4.12 `docs/inconsistences.md`

After all fixes land, either delete or add a "RESOLVED 2026-04-NN" banner pointing to this reconciliation doc.

---

## 5. Task list (current status)

```
#1 [in_progress] Read remaining source files
#2 [pending] Fix REQUIREMENTS.md Codex + Copilot command count      (blocked on Q3)
#3 [pending] Fix implementation-plan-v2.md drift                     (ready — straight fix)
#4 [pending] Fix ROADMAP.md Phase 7 Codex/Copilot command count      (blocked on Q3)
#5 [pending] Update research/FEATURES.md to confirmed state          (blocked on Q1, Q3)
#6 [pending] Update research/SUMMARY.md to confirmed state           (ready — mostly straight fix)
#7 [pending] Fix codewiki-project-v2.md internal drift               (blocked on Q1, Q2)
#8 [pending] Deprecate docs/codewiki-project.md (v1)                 (ready — banner only)
#9 [pending] Remove docs/inconsistences.md once resolved             (last step)
```

**Un-blocked tasks that can be done immediately in the next session:**
- #3 implementation-plan-v2.md (8 line-level fixes listed above)
- #6 research/SUMMARY.md line 101 (6→8)
- #8 v1 doc deprecation banner (copy from §4.8 above)
- Partial #5 (research/FEATURES.md line 137 MVP: 6→8)
- research/ARCHITECTURE.md lines 85/89/93 (not in original task list but needs same 6→8 fix)
- README.md line 348 (Phase 3 summary row)

**Blocked tasks waiting on user answers to Q1–Q4:**
- #2, #4, #5 (partial), #7

---

## 6. Resume instructions for next session

1. Read this file first (`docs/docs-reconciliation-handoff.md`).
2. Read `docs/inconsistences.md` for the original audit.
3. Ask user to answer Q1–Q4 in §3 above.
4. Execute un-blocked tasks from §5 immediately (they don't need answers).
5. After Q1–Q4 answered, execute blocked tasks.
6. Commit in logical chunks (suggest: one commit per file group — v2 PRD, implementation plan, planning docs, research docs, v1 deprecation).
7. Final step: resolve `docs/inconsistences.md` (delete or banner) and this handoff doc.

**Important canon:**
- CodeWiki ships **8 slash commands** to **4 tools** with **full hook automation** (pre, post, session-end where supported).
- Phase 3 shipped 6 commands; Phase 3.1 added `absorb` + `breakdown`. Historical docs reflect this correctly.
- `docs/codewiki-project-v2.md` is canon (per D2), but it has internal drift on OpenCode hook wiring and `session-end.sh` status that must be resolved via Q1/Q2 before it can be propagated.
- User explicitly said: **"any doubt, do not suppose, ask me"** — honor this. Do not guess on Q1–Q4.

---
*Handoff written 2026-04-11 mid-session due to context budget. Questions Q1–Q4 are blocking reconciliation; answer them and everything else flows.*
