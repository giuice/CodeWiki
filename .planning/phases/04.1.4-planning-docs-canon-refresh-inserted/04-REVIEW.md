---
phase: 04.1.4-planning-docs-canon-refresh-inserted
reviewed: 2026-04-12T22:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
  - .planning/STATE.md
  - .planning/CONVENTIONS.md
findings:
  critical: 1
  warning: 7
  info: 1
  total: 9
status: issues_found
---

# Phase 4.1.4: Code Review Report

**Reviewed:** 2026-04-12T22:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the four planning documentation files updated during Phase 4.1.4 (Planning Docs Canon Refresh). This phase was specifically tasked with replacing stale "slash command" references with the skills canon and ensuring parser-safe decimal sub-phase numbering. The review found **1 critical issue** (a stale path in future-facing success criteria that would cause a test failure), **7 warnings** (inconsistent terminology, stale checkboxes, and remaining "slash command" language), and **1 informational note**.

The core task of this phase — refreshing planning docs to use skills-canon language — was substantially completed, but several stale references survived the refresh. These need to be fixed in a follow-up pass.

## Critical Issues

### CR-01: Phase 8 success criterion references stale command path instead of canonical skill path

**File:** `.planning/ROADMAP.md:247`
**Issue:** Phase 8's first success criterion still says `dist/templates/claude/commands/ingest.md` instead of the canonical skill path `dist/templates/skills/codewiki-ingest/SKILL.md`. This is a future-facing test criterion — when Phase 8 is implemented, the npm pack test will assert the wrong path and fail. The Phase 5 success criterion (line 209) was correctly updated to use the skill path, but Phase 8 was missed.
**Fix:**
```markdown
# Change line 247 from:
1. `npm pack --dry-run` output includes `dist/templates/claude/commands/ingest.md` and all other template files

# To:
1. `npm pack --dry-run` output includes `dist/templates/skills/codewiki-ingest/SKILL.md` and all other template files
```

## Warnings

### WR-01: ROADMAP.md Phase 4.1 goal still uses "slash-command" terminology

**File:** `.planning/ROADMAP.md:115`
**Issue:** Phase 4.1's goal reads "Replace the shipped slash-command install surface with the verified eight-skill canon…" — while this is historically accurate as the migration's original intent, the Phase 4.1.4 success criterion 3 specifically says future work should not reference "slash-command canon language." The goal description contradicts the phase's own success criterion. Reword to describe the current state rather than the migration action.
**Fix:**
```markdown
# Change from:
**Goal**: Replace the shipped slash-command install surface with the verified eight-skill canon across templates, adapters, tests, and docs without violating GSD atomicity

# To:
**Goal**: Migrate from the legacy command install surface to the verified eight-skill canon across templates, adapters, tests, and docs without violating GSD atomicity
```

### WR-02: ROADMAP.md Phase 4.1.4 success criterion 3 contains "slash-command" — the term it was meant to eliminate

**File:** `.planning/ROADMAP.md:184`
**Issue:** Success criterion 3 reads: "Active phase contexts/plans no longer instruct future work to use unsupported `4.1a` numbering or slash-command canon language". The phrase "slash-command canon language" is itself a reference to the stale terminology. This is moderately confusing — the criterion is about *not* using the term, but a reader searching for stale references would flag this line. Consider rewording to avoid the term entirely.
**Fix:**
```markdown
# Change from:
3. Active phase contexts/plans no longer instruct future work to use unsupported `4.1a` numbering or slash-command canon language

# To:
3. Active phase contexts/plans no longer instruct future work to use unsupported `4.1a` numbering or legacy command-based install language
```

### WR-03: ROADMAP.md Phase 6 description says "commands and agents" instead of "skills and agents"

**File:** `.planning/ROADMAP.md:27`
**Issue:** The Phase 6 description line reads "session_completed-only hook strategy; commands and agents". Per the skills canon, CodeWiki installs skills, not commands. The successful criteria on line 219 correctly say "installs 8 skills to `.opencode/skills/`". The description should match.
**Fix:**
```markdown
# Change from:
- [ ] **Phase 6: OpenCode Adapter** - session_completed-only hook strategy; commands and agents

# To:
- [ ] **Phase 6: OpenCode Adapter** - session_completed-only hook strategy; skills and agents
```

### WR-04: REQUIREMENTS.md ABS-01 and ABS-02 use slash-command invocation syntax

**File:** `.planning/REQUIREMENTS.md:62-63`
**Issue:** ABS-01 and ABS-02 are written as `/codewiki-absorb` and `/codewiki-breakdown` — this is slash-command invocation syntax (the `/` prefix is how Claude Code slash commands are invoked). Since CodeWiki moved to a skill-based install surface, these should reference the skill names without the `/` prefix, or clarify that skill invocation syntax differs by tool. The other requirements (CMD-01 through CMD-07) correctly use `codewiki-ingest` style naming.
**Fix:**
```markdown
# Change from:
- [x] **ABS-01**: `/codewiki-absorb` extracts durable wiki knowledge from recent git changes with human approval gating
- [x] **ABS-02**: `/codewiki-breakdown` finds referenced-but-undocumented entities and ranks them by backlink importance

# To:
- [x] **ABS-01**: `codewiki-absorb` skill extracts durable wiki knowledge from recent git changes with human approval gating
- [x] **ABS-02**: `codewiki-breakdown` skill finds referenced-but-undocumented entities and ranks them by backlink importance
```

### WR-05: STATE.md Blockers section references "slash command directory" instead of "skill directory"

**File:** `.planning/STATE.md:104`
**Issue:** The Copilot blocker reads "no confirmed file-based slash command directory — spike required before that phase is planned." Per the skills canon, the concern is about whether Copilot has a skill directory (like `skills/`), not a slash-command directory. The term is stale.
**Fix:**
```markdown
# Change from:
- Future Copilot adapter work: no confirmed file-based slash command directory — spike required before that phase is planned

# To:
- Future Copilot adapter work: no confirmed file-based skill directory — spike required before that phase is planned
```

### WR-06: ROADMAP.md Phase 4.1.4 and 4.1.5 checkboxes not marked complete

**File:** `.planning/ROADMAP.md:24-25` and `.planning/ROADMAP.md:126-127`
**Issue:** Phase 4.1.4 is shown as `[ ]` (unchecked) in both the Phases list and the Phase Details section, but this phase was completed (as confirmed by the SUMMARY.md with completion date 2026-04-12). Similarly, 4.1.5 is `[ ]` which is correct (not yet started), but 4.1.4's unchecked state is incorrect. The progress table on line 272 also shows 4.1.4 as "0/0 | Not started" which contradicts the completion status.
**Fix:**
```markdown
# Line 24: Change from:
- [ ] **Phase 4.1.4: Planning Docs Canon Refresh**
# To:
- [x] **Phase 4.1.4: Planning Docs Canon Refresh**

# Line 126: Change from:
- [ ] 4.1.4 — Planning Docs Canon Refresh
# To:
- [x] 4.1.4 — Planning Docs Canon Refresh

# Line 187: Change from:
- [ ] 04.1.4-01-PLAN.md — Refresh...
# To:
- [x] 04.1.4-01-PLAN.md — Refresh...

# Line 272: Change from:
| 4.1.4 Planning Docs Canon Refresh (INSERTED) | 0/0 | Not started | - |
# To:
| 4.1.4 Planning Docs Canon Refresh (INSERTED) | 1/1 | Complete | 2026-04-12 |
```

### WR-07: STATE.md shows stale "stopped_at" and progress values for Phase 4.1.4

**File:** `.planning/STATE.md:6-8,28-31`
**Issue:** The YAML frontmatter shows `stopped_at: "Phase 04.1.4 complete; Phase 04.1.5 ready to plan"` which is correct, but the "Current Position" section still says "Status: Executing Phase 04.1.4" and `Progress: 60%`. While the frontmatter is current, the rendered section text is stale — it should reflect Phase 4.1.4 completion.
**Fix:** Update the "Current Position" section to reflect Phase 4.1.4 completion and advance progress to the next phase.

## Info

### IN-01: ROADMAP.md Phase 4.1.1 success criterion 4 references legacy path

**File:** `.planning/ROADMAP.md:138`
**Issue:** Success criterion 4 reads "The legacy files in `src/templates/claude/commands/codewiki/` are no longer the source of truth for the migrated skills." This is intentionally referencing a historical (legacy) path to describe the migration result — it's accurate as a past-tense statement. No fix required, but worth noting that future readers might search for `commands/codewiki` and flag this line.
**Fix:** No action needed — this is an accurate historical reference, not a stale one.

---

_Reviewed: 2026-04-12T22:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_