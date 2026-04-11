---
quick_id: 260411-mzx
type: quick
mode: quick
autonomous: true
files_modified:
  - docs/implementation-plan-v2.md
  - .planning/research/SUMMARY.md
  - .planning/research/ARCHITECTURE.md
  - .planning/research/FEATURES.md
  - README.md
  - docs/codewiki-project.md
  - docs/codewiki-project-v2.md
---

<objective>
Reconcile CodeWiki v2 documentation drift to the **8-slash-command, 4-tool** canon.

This applies all unblocked fixes from `docs/docs-reconciliation-handoff.md` §4–§5
**plus** the now-unblocked Q1 resolution (OpenCode post-hook = `session_completed →
post-verify.sh` only). It does NOT touch Q2/Q3/Q4-blocked files (v2 PRD §5.2.4
session-end.sh description, REQUIREMENTS.md CODEX-01, ROADMAP.md Phase 7 lines,
historical phase artifacts, or `docs/inconsistences.md` removal).

**Q1 rationale (record in commit body):** Phase 6 plan wins because OpenCode's
`session_completed` event matches the wiki.md batch-absorb mental model — absorb is
a deliberate end-of-session synthesis, not a per-edit reflex. `file_edited` would
fire mid-flow and violate the "absorb is deliberate" semantics. OpenCode also has
no PreToolUse equivalent, so pre-hook behavior must come from AGENTS.md instructions.

Purpose: Eliminate the cross-doc 6-vs-8 command mismatch and the OpenCode hook
trilemma so future readers (and Phase 06 executors) see one consistent surface.

Output: 7 modified files, 3 atomic commits, zero scope creep into blocked items.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/quick.md
</execution_context>

<context>
@CLAUDE.md
@docs/docs-reconciliation-handoff.md
@docs/inconsistences.md
@.planning/STATE.md
</context>

<important_drift_warning>
The handoff was written from a slightly stale snapshot. **One known drift already
spotted:** handoff says `implementation-plan-v2.md:552` for the `# Should have 6
.md files` line — actual location is **line 551**. Similar small drifts (±1–2
lines) are possible in any file. **Read every target chunk BEFORE editing** and
match by content, not by line number. If a target string is not found at the
expected location:

1. Search the file for the target string with Grep.
2. If found at a different line, edit at the new location and continue.
3. If NOT found anywhere in the file, STOP that specific edit, report it, and
   move to the next target. Do NOT guess.
</important_drift_warning>

<tasks>

<task type="auto">
  <name>Task 1: Fix command-count drift in non-PRD docs (5 files)</name>
  <files>
    docs/implementation-plan-v2.md
    .planning/research/SUMMARY.md
    .planning/research/ARCHITECTURE.md
    .planning/research/FEATURES.md
    README.md
  </files>
  <action>
Apply the following edits **in this exact order**, reading each chunk first to
confirm current text matches before editing.

---

**Edit 1.1 — `docs/implementation-plan-v2.md`** (5 line-level fixes + 1 explanatory note)

Read lines 15–25 first (the "Workflow target" block). Then **insert a new short
note immediately after line 24** (after the `6. Use /codewiki-breakdown...` bullet,
before the `## Refactor note` heading at line 26). The inserted block:

```markdown

> **Command count note:** Phase 3 shipped 6 commands (`ingest`, `query`, `lint`,
> `prd`, `tasks`, `process`); Phase 3.1 added `absorb` and `breakdown`, bringing
> the total to **8 slash commands**. Older sections of this doc that still say
> "6 commands" are stale — the canonical count is 8.
```

Then read lines 330–345 to confirm the "Available Commands" section. **Replace
the bullet list at lines 335–340** with this 8-command list (preserve list
indentation and exact bullet style):

```markdown
- `/codewiki-ingest` — Ingest a raw source document into the wiki
- `/codewiki-query` — Query the wiki for information
- `/codewiki-lint` — Health-check the wiki
- `/codewiki-absorb` — Absorb session lessons into the wiki at end-of-session
- `/codewiki-breakdown` — Break a large wiki page into smaller cross-linked pages
- `/codewiki-prd` — Generate a PRD for a new feature
- `/codewiki-tasks` — Generate tasks from a PRD
- `/codewiki-process` — Process tasks one at a time
```

Then make the four count substitutions. **Use Edit with unique surrounding
context** so the right occurrence is matched (do NOT rely on line numbers):

- In the install report block around line 434, find:
  `✓ Commands: .claude/commands/codewiki/ (6 commands)` →
  `✓ Commands: .claude/commands/codewiki/ (8 commands)`

- In the same install report block around line 440, find:
  `✓ Commands: .codex/commands/codewiki/ (6 commands)` →
  `✓ Commands: .codex/commands/codewiki/ (8 commands)`

- In the Task 7.2 list around line 475, find:
  `.claude/commands/codewiki/ingest.md exists (and all 6 commands)` →
  `.claude/commands/codewiki/ingest.md exists (and all 8 commands)`

- In the smoke-test block around line 551 (NOT 552 — handoff was off by one), find:
  `ls .claude/commands/codewiki/      # Should have 6 .md files` →
  `ls .claude/commands/codewiki/      # Should have 8 .md files`
  (preserve the spacing inside the comment exactly)

---

**Edit 1.2 — `.planning/research/SUMMARY.md` line 101**

Read lines 95–105 first. Find:
`all 6 slash command \`.md\` files for Claude Code`

Replace with:
`all 8 slash command \`.md\` files for Claude Code (6 from Phase 3, 2 added in Phase 3.1)`

Do NOT touch line 14 (the "only fully-specified implementation" softening is
out of scope — handoff lists it as a separate fix).

---

**Edit 1.3 — `.planning/research/ARCHITECTURE.md` lines 85, 89, 93**

Read lines 80–100 first to confirm the ASCII tree. Then make three edits.
**Preserve the column alignment of the `#` comment exactly** — these lines are
part of an ASCII directory tree where the `#` sits at a fixed column.

- Line 85: `│   │   ├── commands/       # 6 slash command .md files` →
  `│   │   ├── commands/       # 8 slash command .md files`
- Line 89: `│   │   └── commands/       # same 6 command .md files (different frontmatter if needed)` →
  `│   │   └── commands/       # same 8 command .md files (different frontmatter if needed)`
- Line 93: `│   │   ├── commands/       # same 6 command .md files` →
  `│   │   ├── commands/       # same 8 command .md files`

After editing, visually inspect the surrounding lines to confirm the tree
characters still align.

---

**Edit 1.4 — `.planning/research/FEATURES.md` line 137 ONLY**

Read lines 130–145 first. Find the MVP launch list bullet:
`- [ ] Claude Code adapter (hooks + 6 commands + 2 agents + instruction section) — first tool, most mature`

Replace with:
`- [ ] Claude Code adapter (hooks + 8 commands + 2 agents + instruction section) — first tool, most mature`

**DO NOT touch lines 5, 70, 85, 90–98, 99, 107–108** in this task — they belong
to Task 3 (line 5, 90–98) or are Q3-blocked (70, 85, 107–108).

---

**Edit 1.5 — `README.md` line 348**

Read lines 340–360 first. The current Phase 3 row is:
`| 3. Prompt Templates & Hook Scripts | 6 slash commands, 2 hooks, 2 agents | ✅ Complete |`

The Phase 3.1 row already exists at line 349:
`| 3.1 Auto-Improvement Engine | absorb, breakdown, backlinks, session-end hook | ✅ Complete |`

**Preferred fix:** Leave the Phase 3 row text untouched (it was historically
accurate — Phase 3 really did ship 6 commands), and **edit the Phase 3.1 row
description** to make the +2 commands explicit. Replace the Phase 3.1 row with:

`| 3.1 Auto-Improvement Engine | +2 slash commands (absorb, breakdown), backlinks, session-end hook | ✅ Complete |`

Rationale: this preserves the phase-by-phase chronology the table is designed
to communicate, while making the cumulative 8-command total derivable from the
table without rewriting history.

---

After all five edits, run the verify command below.
  </action>
  <verify>
Confirm every target string was updated and no stale "6 commands" / "6 slash
commands" / "6 .md files" references remain in the five touched files:

```bash
# Should return ZERO matches in the five edited files:
grep -nE "6 commands|6 slash commands|6 \\.md files|6 command \\.md files" \
  docs/implementation-plan-v2.md \
  .planning/research/SUMMARY.md \
  .planning/research/ARCHITECTURE.md \
  README.md

# .planning/research/FEATURES.md may still match on lines 70/85/107-108 (Q3-blocked).
# Verify ONLY line 137 was changed:
sed -n '137p' .planning/research/FEATURES.md | grep -q "8 commands" && echo "FEATURES.md:137 OK"

# Confirm the new note exists in implementation-plan-v2.md:
grep -q "Command count note" docs/implementation-plan-v2.md && echo "note inserted OK"

# Confirm absorb/breakdown both appear in the Available Commands section:
grep -q "/codewiki-absorb" docs/implementation-plan-v2.md && \
  grep -q "/codewiki-breakdown" docs/implementation-plan-v2.md && \
  echo "Available Commands updated OK"
```

All four checks must succeed. If the first grep returns matches, those are
unfixed drift — investigate before committing.
  </verify>
  <done>
- 5 files edited per the action block
- Verify grep commands all pass (zero stale matches; markers all present)
- Single atomic commit:
  `docs(quick-260411-mzx): align command count to 8 in implementation plan, research, README`
- Commit body briefly lists the 5 files and notes that Q2/Q3-blocked items
  (REQUIREMENTS.md, ROADMAP.md, FEATURES.md lines 70/85/107-108, v2 PRD §5.2.4)
  are intentionally untouched
  </done>
</task>

<task type="auto">
  <name>Task 2: Add SUPERSEDED banner to v1 legacy doc</name>
  <files>
    docs/codewiki-project.md
  </files>
  <action>
Read the first 10 lines of `docs/codewiki-project.md` to confirm the current
top-of-file content. The file currently begins with `# CodeWiki — Product
Requirements Document` (the v1 PRD).

**Prepend** the following SUPERSEDED banner at the very top of the file, with
exactly one blank line between the banner and the existing `#` heading. Use
this exact text (no edits, no rewording):

```markdown
> **SUPERSEDED** — This is CodeWiki v1. The canonical product spec is now
> [`docs/codewiki-project-v2.md`](./codewiki-project-v2.md). The v2 architecture
> is CLI-as-installer with all intelligence in markdown prompts; v1 described a
> runtime CLI that has since been removed. This file is kept for historical
> reference only.

```

Do NOT modify any other content in the file. The body stays intact per
handoff decision D4.
  </action>
  <verify>
```bash
# First non-empty line should be the SUPERSEDED banner:
head -1 docs/codewiki-project.md | grep -q "^> \\*\\*SUPERSEDED\\*\\*" && echo "banner present"

# The original heading must still exist somewhere in the file:
grep -q "^# CodeWiki — Product Requirements Document" docs/codewiki-project.md && \
  echo "original heading preserved"

# File should be exactly 6 lines longer than before (5 banner lines + 1 blank).
# Quick sanity: line count grew by 6:
wc -l docs/codewiki-project.md
```

Both `echo` lines must print. Inspect the diff to confirm only a prepend
happened — no other lines changed.
  </verify>
  <done>
- Banner prepended exactly as specified
- Original v1 PRD content untouched below the banner
- Single atomic commit:
  `docs(quick-260411-mzx): mark codewiki-project.md as v1 superseded by v2 PRD`
  </done>
</task>

<task type="auto">
  <name>Task 3: Q1 resolution — OpenCode post-hook = session_completed only</name>
  <files>
    docs/codewiki-project-v2.md
    .planning/research/FEATURES.md
  </files>
  <action>
This task applies the Q1 decision: **OpenCode uses `experimental.hooks.session_completed →
post-verify.sh` only.** Phase 6 plan wins. Rationale per `docs/skills/wiki.md`:
absorb is a deliberate end-of-session synthesis, so `session_completed` (fires
once at session end) is the correct trigger. `file_edited` would fire per-edit
mid-flow and violate the "absorb is deliberate" semantics. OpenCode has no
PreToolUse equivalent — pre-hook behavior must come from AGENTS.md instructions.

This task does NOT touch v2 PRD §5.2.4 (session-end.sh description) — that's
Q2-blocked. It also does NOT touch FEATURES.md lines 70/85/107-108 (Q3-blocked
research gaps).

---

**Edit 3.1 — `docs/codewiki-project-v2.md` §6.1 OpenCode row (around line 326)**

Read lines 315–330 first to capture the exact column format of the §6.1
hooks-and-commands table. The current OpenCode row is:

```
| **OpenCode** | `opencode.json` `experimental.hooks` — `file_edited` | `.opencode/commands/codewiki/*.md` | Appends to `AGENTS.md` (OpenCode reads it) | `.opencode/agents/codewiki-*.md` |
```

Replace **only the Hooks cell** (the second column) with:

```
`opencode.json` `experimental.hooks.session_completed` → `post-verify.sh` (no PreToolUse equivalent — pre-hook context comes from `AGENTS.md` instructions)
```

So the full new row reads:

```
| **OpenCode** | `opencode.json` `experimental.hooks.session_completed` → `post-verify.sh` (no PreToolUse equivalent — pre-hook context comes from `AGENTS.md` instructions) | `.opencode/commands/codewiki/*.md` | Appends to `AGENTS.md` (OpenCode reads it) | `.opencode/agents/codewiki-*.md` |
```

Match column widths to whatever the surrounding rows use. Markdown tables do
not require visual alignment, but if the existing table is visually aligned,
preserve that style.

**Do NOT touch §5.2.4 (lines 266–273) describing session-end.sh** — that
description is Q2-blocked and remains for a separate task.

---

**Edit 3.2 — `.planning/research/FEATURES.md` line 5 (Confidence note)**

Read lines 1–10 first. Current line 5:
`**Confidence:** HIGH for Claude Code/GSD patterns; MEDIUM for Codex/Copilot hook formats; LOW for OpenCode pre-hook capabilities`

Replace with:
`**Confidence:** HIGH for Claude Code/GSD patterns; MEDIUM for Codex/Copilot hook formats; OpenCode has no PreToolUse equivalent — post-hook uses \`session_completed\` (confirmed)`

---

**Edit 3.3 — `.planning/research/FEATURES.md` lines 87–100 (OpenCode hook JSON example)**

Read lines 85–105 first to confirm the current state. The current OpenCode
example block contains BOTH `file_edited` and `session_completed` keys. Replace
the JSON code block (lines ~89–98) so it shows ONLY `session_completed`:

Current:
```json
{
  "experimental": {
    "hooks": {
      "file_edited": { "command": "bash .codewiki/hooks/post-verify.sh" },
      "session_completed": { "command": "bash .codewiki/hooks/session-end.sh" }
    }
  }
}
```

Replace with:
```json
{
  "experimental": {
    "hooks": {
      "session_completed": { "command": "bash .codewiki/hooks/post-verify.sh" }
    }
  }
}
```

Then update the trailing prose (current line 99):
`- **No pre-tool hook available.** \`file_edited\` is post-edit only. Wiki context injection before coding is NOT possible in OpenCode via hooks.`

Replace with:
`- **No pre-tool hook available.** OpenCode has no PreToolUse equivalent. CodeWiki uses \`session_completed\` (fires once at end-of-session) to trigger \`post-verify.sh\` for batch wiki absorb. Pre-edit wiki context must come from \`AGENTS.md\` instructions, not hooks.`

Line 100 (`Commands go in .opencode/commands/<name>.md...`) stays unchanged.

**DO NOT touch lines 70 and 85** — those are RESEARCH GAP markers for
Codex/Copilot (Q3-blocked).
**DO NOT touch lines 107–108** — Codex/Copilot path table (Q3-blocked).
  </action>
  <verify>
```bash
# v2 PRD: OpenCode row mentions session_completed and no longer has bare file_edited:
grep -A0 "OpenCode" docs/codewiki-project-v2.md | grep -q "session_completed" && \
  echo "v2 PRD §6.1 updated"

# v2 PRD §6.1 row no longer says only file_edited:
grep -E "OpenCode.*experimental\\.hooks.*file_edited\\` \\|" docs/codewiki-project-v2.md && \
  echo "ERROR: stale file_edited still present in §6.1 row" || \
  echo "stale file_edited removed from §6.1 row"

# FEATURES.md line 5 confidence updated:
sed -n '5p' .planning/research/FEATURES.md | grep -q "session_completed" && \
  echo "FEATURES.md line 5 updated"

# FEATURES.md OpenCode JSON no longer contains file_edited as a hook key:
awk '/^### OpenCode/,/^### /' .planning/research/FEATURES.md | grep -q '"file_edited"' && \
  echo "ERROR: file_edited still present in OpenCode block" || \
  echo "OpenCode JSON cleaned"

# session_completed must point to post-verify.sh, NOT session-end.sh:
awk '/^### OpenCode/,/^## /' .planning/research/FEATURES.md | \
  grep '"session_completed"' | grep -q "post-verify.sh" && \
  echo "session_completed → post-verify.sh confirmed"

# Q3-blocked markers must STILL be present (we did NOT touch them):
sed -n '70p' .planning/research/FEATURES.md | grep -q "RESEARCH GAP" && echo "line 70 preserved"
sed -n '85p' .planning/research/FEATURES.md | grep -q "RESEARCH GAP" && echo "line 85 preserved"

# v2 PRD §5.2.4 (Q2-blocked) must be untouched — quick sanity check:
sed -n '266,273p' docs/codewiki-project-v2.md | grep -q "session-end" && \
  echo "§5.2.4 left intact"
```

All non-ERROR `echo` lines must print. Any `ERROR:` line means a Q-blocked
section was accidentally touched or a stale wiring survived — investigate
before committing.

Also: open `.planning/phases/06-opencode-adapter/06-01-PLAN.md` and
`06-02-PLAN.md` and quick-scan to confirm they already match this canon
(handoff §4.9 / §4.10 say they do). Do NOT edit them; just verify. If drift
is found, report it in the commit body and stop — drift in the phase plans
needs orchestrator attention, not a silent fix here.
  </verify>
  <done>
- v2 PRD §6.1 OpenCode row reflects session_completed → post-verify.sh
- v2 PRD §5.2.4 (lines 266–273) untouched
- FEATURES.md line 5 confidence note updated
- FEATURES.md OpenCode JSON example shows only session_completed → post-verify.sh
- FEATURES.md lines 70, 85, 107–108 unchanged (Q3 still pending)
- 06-01-PLAN.md and 06-02-PLAN.md spot-checked, no drift found (or drift reported)
- Single atomic commit:
  `docs(quick-260411-mzx): resolve Q1 — OpenCode post-hook is session_completed only`
- Commit body cites the wiki.md rationale (absorb is deliberate end-of-session)
  and notes that v2 PRD §5.2.4, FEATURES.md research gaps, and REQUIREMENTS/ROADMAP
  Codex/Copilot lines are intentionally NOT touched (Q2/Q3 still open)
  </done>
</task>

</tasks>

<verification>
After all three tasks and three commits, run:

```bash
# Show the three new commits in order:
git log --oneline -3

# Confirm no stale "6 commands" anywhere in the unblocked file set:
grep -rnE "6 commands|6 slash commands|6 command \\.md files|6 \\.md files" \
  docs/implementation-plan-v2.md \
  docs/codewiki-project-v2.md \
  .planning/research/SUMMARY.md \
  .planning/research/ARCHITECTURE.md \
  README.md \
  || echo "no stale 6-command refs in unblocked files"

# FEATURES.md may legitimately still match on lines 70/85/107-108 (Q3-blocked).
# Confirm that line 137 specifically is fixed:
sed -n '137p' .planning/research/FEATURES.md | grep -q "8 commands"

# Confirm the Q1 decision is uniformly recorded:
grep -l "session_completed" docs/codewiki-project-v2.md \
  .planning/research/FEATURES.md \
  .planning/phases/06-opencode-adapter/06-01-PLAN.md \
  .planning/phases/06-opencode-adapter/06-02-PLAN.md
```

Expected: 3 commits in order (Task 1, Task 2, Task 3); zero stale 6-command
matches in the unblocked file list; FEATURES.md:137 says 8 commands;
session_completed appears in all four Q1-relevant files.
</verification>

<success_criteria>
- [ ] 3 atomic commits land in order: command-count fix → v1 banner → Q1 resolution
- [ ] All seven listed files modified exactly per the action blocks
- [ ] No edits to Q2/Q3/Q4-blocked content (REQUIREMENTS.md, ROADMAP.md, v2 PRD §5.2.4,
      FEATURES.md lines 70/85/107-108, historical phase artifacts, inconsistences.md)
- [ ] Phase 06 plans (06-01, 06-02) verified consistent — not edited
- [ ] All verify grep checks pass with no ERROR markers
- [ ] STATE.md "Quick Tasks Completed" table is updated by the workflow runner
      (not by these edits) at handoff time
</success_criteria>

<output>
This is a quick task. No SUMMARY.md is required. The three commits **are** the
record. After the last commit, return control to the user with:

1. The three commit hashes
2. A short list of what was intentionally **NOT** touched (Q2/Q3-blocked items)
3. A reminder that `docs/inconsistences.md` removal and the Q2/Q3 fixes still
   need user answers before they can be planned as a follow-up quick task
</output>
