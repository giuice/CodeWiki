# CodeWiki Skills Migration — Handoff

**Created:** 2026-04-11 (late session)
**Supersedes:** `docs/docs-reconciliation-handoff.md` (built on the wrong canon — assumed "8 slash commands" where the real canon is "8 Skills")
**Author context:** Written at end of session after context budget ran low. Next session should read this first, NOT the old handoff.

---

## 0. The correction that triggered this handoff

The previous reconciliation (`docs/docs-reconciliation-handoff.md`) treated "8 slash commands to 4 tools" as the canonical install surface. It is **not**. The real canon, stated explicitly and repeatedly by the user across this session and prior ones:

> **CodeWiki installs eight Skills, one per logical command.** Not slash commands. Not a single bundled skill. Eight separate SKILL.md files, one each for `ingest`, `query`, `lint`, `absorb`, `breakdown`, `prd`, `tasks`, `process`. `docs/skills/wiki.md` is a **file-format reference only** — CodeWiki does NOT bundle subcommands the way wiki.md does.

The rationale is written as v2 PRD §12 Decision 8 (token efficiency, independent discoverability, independent evolution, per-tool portability).

Everything in this handoff — and every doc this session touched — flows from that correction.

## 1. STATUS — what's shipped in this reconciliation cycle

| Commit | What |
|---|---|
| `7dc3460` | (pre-correction) Task 1 — 8-command alignment in product/research/README. Still uses "commands" language — needs cascade. |
| `5efd16e` | (pre-correction) Task 2 — v1 deprecation banner on `docs/codewiki-project.md`. Still valid. |
| `cace4e9` | (pre-correction) Task 3 — OpenCode Q1 wiring (`session_completed → post-verify.sh`). Still valid — OpenCode's session_completed routes to post-verify, not session-end.sh. |
| `15d08d5` | Quick-task artifacts for the old reconciliation (PLAN/SUMMARY/STATE). Obsolete — superseded by this handoff. |
| `96ada8a` | **v2 PRD reframed as 8 Skills canon.** Rewrote §4.2 diagram, §4.3 tree, §5.3–5.6 prose, §6.1 table + new Hook Strategy Matrix, §6.2 adapter contents, §7.3 closing, §12 Decision 6 + Decision 8. Added SUPERSEDED banner to `docs/codewiki-project.md` (already existed from `5efd16e`). |
| `5449b74` | REQUIREMENTS.md `Prompt Files (Skills)` section rewrite with CMD-01..07 reworded + canon note. v2 PRD §5.2.4 precision fix: SessionEnd exists but fires too late for interactive absorb. |

## 1.5 2026-04-11 evening research — canon resolved for all four tools

Next session (this one) verified skills and hook surfaces against official docs for all four tools. Research reference: `docs/research-reference.md`. This closes most of §4's gaps and surfaces two new constraints the original plan didn't know about.

### Skills directories — verified

| Tool | Reads from | `.claude/`? | `.agents/`? |
|---|---|:---:|:---:|
| Claude Code | `.claude/skills/<name>/SKILL.md` + personal/enterprise/plugin | ✅ | ❌ |
| OpenCode | 6 paths incl. `.opencode/`, `.claude/`, `.agents/` | ✅ | ✅ |
| Copilot | `.github/skills/`, `.claude/skills/`, `.agents/skills/` (+ personal variants) | ✅ | ✅ |
| Codex | `.agents/skills/` only (CWD → repo root + `$HOME`) | ❌ | ✅ |

**No single directory covers all four.** Claude Code reads only `.claude/`; Codex reads only `.agents/`. The minimum-duplication install is a **dual tree**:

- `.claude/skills/codewiki-<name>/SKILL.md` — Claude Code only
- `.agents/skills/codewiki-<name>/SKILL.md` — Codex + Copilot + OpenCode

Tool-selection-conditional:
- `--tool claude-code` alone → `.claude/skills/` only
- Any subset without Claude Code → `.agents/skills/` only
- Claude Code + anything else → **both** trees (8 files × 2 dirs = 16 files, plain copy, no symlinks — Windows compat)

Single source of truth for templates: `src/templates/skills/codewiki-<name>/SKILL.md`. Adapters decide where to copy.

### Hook events — verified

| Tool | Pre-edit | Post-edit | Session-lifecycle (agent alive?) | Install format |
|---|---|---|---|---|
| Claude Code | `PreToolUse` matcher `Edit\|Write` | `PostToolUse` matcher `Edit\|Write` | `SessionEnd` = agent gone, dormant. `PreCompact` = agent alive before compaction, viable for lightweight absorb. | JSON `.claude/settings.json` + shell |
| Codex | ⚠️ `PreToolUse` is **Bash-only** per docs | ⚠️ `PostToolUse` is **Bash-only** | Only `SessionStart` and `Stop` exist. No session-end. | JSON `.codex/hooks.json` + shell |
| Copilot | `preToolUse` ✅ | `postToolUse` ✅ | `sessionEnd` exists, timing unknown | JSON `.github/hooks/*.json` + shell |
| OpenCode | `tool.execute.before` ✅ | `file.edited` ✅ (also `tool.execute.after`) | `session.idle`, `session.compacted`, `session.deleted` exist, timings unknown | **TS plugin file** via Bun `$` — NOT JSON |

### Three constraints the original plan didn't see

1. **Codex `PreToolUse`/`PostToolUse` are Bash-only.** Confirmed in Codex hook docs: *"PreToolUse only supports Bash tool interception"* / *"PostToolUse only supports Bash tool results."* CodeWiki's pre-edit and post-edit hooks cannot wire to file edits on Codex. **Fallback:** `UserPromptSubmit` → `pre-wiki-context.sh` (fires per user prompt, stdout injected into Claude's context) and `Stop` → `post-verify.sh` (fires at end of turn). Coarser than the other three tools but functional — the verification loop still exists on Codex, just at prompt/turn granularity rather than per-edit.

2. **OpenCode's install artifact is a TypeScript plugin file, not JSON config.** OpenCode plugins subscribe to events via a TS module and exec shell via Bun's `$` API. CodeWiki's OpenCode adapter templates `.opencode/plugins/codewiki.ts` (~30 lines) that dispatches `tool.execute.before` / `file.edited` / `session.idle` to the existing shell scripts. **The scripts themselves stay unchanged** — this preserves the "one shared script library" pattern (Decision 7). The plugin is a dispatcher; the logic lives in `pre-wiki-context.sh` / `post-verify.sh` / `session-end.sh` as before.

3. **The "session_completed → post-verify.sh" OpenCode workaround from the original §6.1 is dead.** OpenCode has real per-edit hooks now that the full event list is known. No more overloading post-verify.sh with session-level scope. `session.idle` (pending timing spike) becomes the natural session-end.sh trigger on OpenCode. Similarly `sessionEnd` on Copilot (pending timing spike). **`session-end.sh` may activate on up to 2 of 4 tools in v1** — substantially better than the previous "dormant on all four."

### Provisional decisions (accepted by user 2026-04-11 evening)

- **Skills install trees:** Dual tree (`.claude/skills/` + `.agents/skills/`), tool-selection-conditional, plain file duplication, no symlinks.
- **Codex fallback:** Ship v1 with `UserPromptSubmit` → `pre-wiki-context.sh` and `Stop` → `post-verify.sh`. Not dormant.
- **OpenCode plugin file:** Static TS template at `src/templates/opencode/plugins/codewiki.ts`, copied verbatim at install time, same pattern as the shell scripts.

## 2. The real problem — this is a code migration, not a doc patch

**Phase 4 is marked complete.** `CC-01..CC-05` are all `[x]` in REQUIREMENTS.md (see `.planning/REQUIREMENTS.md` traceability lines 161–165). The Claude Code adapter code that shipped in Phase 4 writes prompt files to:

```
.claude/commands/codewiki/*.md       ← what Phase 4 actually installs
```

The canon says the target is:

```
.claude/skills/codewiki-<name>/SKILL.md   ← what it should install
```

Aligning docs without touching code would create a worse drift: docs describe skills; code ships commands. The cascade through REQUIREMENTS/ROADMAP/FEATURES/SUMMARY/ARCHITECTURE/implementation-plan/README/Phase 6 plans/Phase 4 validation must be driven by a **code migration**, not a doc pass.

## 3. Recommended next phase: `04.1 — Skills Migration`

A decimal insert phase that re-does Phase 4's output with Skills as the install target. Rough shape:

1. **Source template move:** `src/templates/claude/commands/codewiki/*.md` → `src/templates/skills/codewiki-<name>/SKILL.md` (no `claude/` subfolder — skills are the portable surface, reused across tool adapters per §1.5). Each file gains `name:` in frontmatter and a richer `description:` (the description is what the agent uses to auto-match natural-language requests to the right skill).
2. **Adapter change:** The Claude Code adapter (wherever the Phase 4 code writes files into `.claude/commands/...`) now writes into `.claude/skills/codewiki-<name>/SKILL.md`. Each skill is a directory, not a flat file — the installer has to mkdir per skill. When the `--tool` selection also includes Codex, Copilot, or OpenCode, the same 8 files are also copied into `.agents/skills/codewiki-<name>/SKILL.md` (dual-tree install per §1.5).
3. **Settings merge:** No change to `.claude/settings.json` hook wiring — skills don't live in settings.json. But verify: is there anything in settings.json that references the old commands/codewiki path? (Probably not, but check.)
4. **Requirements update:** Rewrite CC-01 from "Installs 8 slash commands to `.claude/commands/codewiki/`" to "Installs 8 Skills to `.claude/skills/codewiki-<name>/SKILL.md` (+ dual-tree to `.agents/skills/` when non-Claude tools are also selected)". Re-run validation.
5. **Integration test:** Run `npx codewiki init` into a scratch dir, confirm skills layout, confirm one skill actually loads when invoked in Claude Code.
6. **`session-end.sh`:** Installs as a dormant shell asset, exactly as the v2 PRD §5.2.4 now says. Claude Code's SessionEnd hook exists but fires too late for the interactive absorb flow — verified 2026-04-11 — so it's not wired. Manual `/codewiki-absorb` remains the primary end-of-session path.
7. **Doc cascade** (follows the code change, not the other way around):
   - REQUIREMENTS.md — CC-01, CODEX-01, COP-03, OC-01, BUILD-02, traceability
   - ROADMAP.md — Phase 3/3.1/4/6/7 language
   - `.planning/research/FEATURES.md` — per-tool install path table, add skills column, MVP bullets, skills-directory research gaps for Codex/Copilot/OpenCode
   - `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md` — directory tree comments
   - `docs/implementation-plan-v2.md` — "Available Commands" section, install-report examples, smoke-test paths
   - `README.md:348` — Phase 3 table row
   - `.planning/phases/06-opencode-adapter/06-0*-PLAN.md` — OpenCode adapter now installs Skills too, not commands
   - `docs/docs-reconciliation-handoff.md` and `docs/inconsistences.md` — banner as SUPERSEDED, point at this file

## 4. Open research gaps — closed and replaced

**Skills directories:** All four resolved in the 2026-04-11 evening research pass. See §1.5 for the full matrix. Canonical decision: dual-tree install of `.claude/skills/` + `.agents/skills/` when both are required.

**Hook events:** Event surfaces verified for all four tools. See §1.5 for the full matrix. Two new constraints discovered: Codex `PreToolUse`/`PostToolUse` are Bash-only (CodeWiki falls back to `UserPromptSubmit`/`Stop`), and OpenCode's hook install artifact is a TS plugin file (not JSON).

**Remaining spikes** — three timing questions that cannot be resolved from documentation alone:

| Spike | Question | Blocks | Phase |
|---|---|---|---|
| OpenCode `session.idle` | Does this event fire while the agent is alive and able to invoke a skill interactively, or only after termination? | `session-end.sh` activation on OpenCode | 6 |
| Copilot `sessionEnd` | Same timing question — fires with agent alive or at termination? | `session-end.sh` activation on Copilot | 7 |
| Codex file-edit hooks | Is there any undocumented file-edit matcher for `PreToolUse`/`PostToolUse`, or is Bash-only permanent? Is there a planned expansion in OpenAI's Codex roadmap? | Whether Codex fallback (UserPromptSubmit/Stop) is v1-final or temporary | 5 |

These are ~10-minute probes each, not full research tasks — register a minimal hook/plugin, log the agent state when the event fires, confirm.

## 5. The SessionEnd question, resolved per tool

The original afternoon answer ("Claude Code SessionEnd fires too late, all four tools dormant") was right for Claude Code but too pessimistic for the other three. Follow-up research resolved two key points.

- **Claude Code.** `SessionEnd` fires at termination (agent gone) — dormant, unchanged. **But** `PreCompact` exists: fires before context compaction with the agent alive. Semantically "session is running out, capture what happened before compaction eats the context." Viable host for a lightweight absorb flow. Phase 4.1 evaluates wiring `session-end.sh` to `PreCompact` as an optional live hook on Claude Code. Manual `/codewiki-absorb` remains the primary end-of-session path.
- **Codex.** Only `SessionStart` and `Stop`. No session-end hook exists. `Stop` fires per turn (too frequent for session-end semantics). **Dormant (confirmed final for v1).**
- **Copilot.** `sessionEnd` exists, but the official hooks docs make it a terminal cleanup/logging hook with ignored output. The useful post-turn event is **`agentStop`**: docs define it as "the main agent finishes a turn," and its output is processed (`decision: "block"` + `reason` can force continuation). Therefore `sessionEnd` should not be the CodeWiki integration target for automatic absorb/validation; `agentStop` should.
- **OpenCode.** `session.idle`, `session.compacted`, `session.deleted` all exist. OpenCode's open-source runtime makes `session.idle` semantics explicit: it is published when session status becomes `idle`, and that transition happens when the active run finishes. So `session.idle` means **turn completed, waiting for next input**, not true session teardown. Good candidate for post-turn summary; wrong label for literal session-end.

**`session-end.sh` fate, updated:** Ships as a shared summary script on all tools, but the host wiring differs by semantics:
- Claude Code: dormant for true session-end; `PreCompact` remains a possible future summary hook.
- Codex: no true session-end hook; `Stop` remains turn-scoped only.
- Copilot: use `agentStop` for post-turn follow-up if we automate; keep `sessionEnd` for cleanup/logging only.
- OpenCode: use `session.idle` as post-turn summary trigger, not as teardown.

This preserves the "one script, one feature" principle, but the feature should now be described as **post-turn/session-summary capture**, not literal guaranteed teardown interception across all tools.

Validation addendum: here, `active` means the host tool can run `session-end.sh` and surface its structured summary. It does **not** imply a documented hook-to-skill bridge that can directly invoke `/codewiki-absorb`; current official hook docs across the researched tools document shell execution and context surfacing, not deterministic skill chaining.

**Why manual `/codewiki-absorb` is still correct even when session-end.sh activates:** Matches the `docs/skills/wiki.md` philosophy — absorb is a deliberate batch operation, not a reflex. Even with live triggers on OpenCode and Copilot, the manual invocation stays canonical for sessions where the automatic hook isn't appropriate (errors, partial absorb, etc.).

## 6. Memory pointers (for fast context reload next session)

- `/home/giuice/.claude/projects/-home-giuice-Desenv-CodeWiki/memory/feedback_skills_canon.md` — the canon statement and user's repeated frustration with the wrong model being assumed. Read this first.
- `/home/giuice/.claude/projects/-home-giuice-Desenv-CodeWiki/memory/MEMORY.md` — index with pointers
- `docs/codewiki-project-v2.md` — canonical source of truth per project decision D2. §12 Decision 8 is the load-bearing skills canon statement.
- `docs/skills/wiki.md` — format reference only, NOT a packaging template. CodeWiki does not bundle subcommands.
- `.planning/PROJECT.md:73` — historical note that `session-end.sh` was intentionally shipped but unwired in Phase 4. Reason is now updated (SessionEnd exists but unusable for interactive flow), but the outcome is the same.

## 7. How to resume

1. **Read this file first**, especially §1.5 (evening research: verified skills + hook matrix across all four tools). Do NOT read `docs/docs-reconciliation-handoff.md` — it was built on the wrong canon.
2. **Read `/home/giuice/.claude/projects/-home-giuice-Desenv-CodeWiki/memory/feedback_skills_canon.md`** to ground on what the user actually wants.
3. **Decide:** is the next step (a) `/gsd-insert-phase 04.1 Skills Migration` with full planning, or (b) a quick-task that rewrites the Claude adapter inline and cascades docs? The user has been cost-sensitive and frustrated; (b) is likely faster but (a) is cleaner. Ask the user which.
4. **Before any code changes:** grep the codebase for `commands/codewiki` to see every file that points at the old path. That's your migration surface. Target paths are `.claude/skills/codewiki-<name>/SKILL.md` (Claude Code) + `.agents/skills/codewiki-<name>/SKILL.md` (Codex/Copilot/OpenCode, dual-tree when applicable) — see §1.5.
5. **After code changes land:** the doc cascade from §3.7 becomes mechanical find-and-replace.
6. **Finally:** delete `docs/docs-reconciliation-handoff.md` and `docs/inconsistences.md`, and delete this file.

## 8. What explicitly does NOT change

- **Hook scripts** (`pre-wiki-context.sh`, `post-verify.sh`, `session-end.sh`) — still shell scripts in `.codewiki/hooks/`, still wired via each tool's hook config. The skills migration does not touch hooks.
- **Subagents** (`codewiki-wiki-updater`, `codewiki-verifier`) — still live in `.claude/agents/`, `.opencode/agents/`. Skills don't replace agents; they replace commands only.
- **Wiki directory structure** (`wiki/`, `raw/`, `tasks/`, `.codewiki/`) — unchanged.
- **CLI surface** (`npx codewiki init` with `--tool`, `--force`, `--name`) — unchanged. The CLI is still installer-only, zero runtime logic.
- **Project decisions D1–D4** from the old handoff — still valid (targeted reconciliation, v2 PRD as canon, research aligns to product, v1 doc deprecation banner).

---

*Written 2026-04-11 at end of session under context budget pressure. The session reached a successful correction (v2 PRD reframed to skills canon in commits `96ada8a` + `5449b74`) but could not complete the full cascade because Phase 4 code was already shipped to the wrong path. Next session inherits a cleaner problem statement: migrate Phase 4 output, then cascade docs. Good luck.*
