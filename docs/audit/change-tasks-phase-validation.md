# Validation Report: `change-tasks-phase.md`

**Date:** 2026-05-05  
**Auditor:** pi-agent  
**Scope:** Verify that every requirement in `docs/tmp/change-tasks-phase.md` was implemented and identify gaps.

---

## Executive Summary

**Status:** Mostly implemented — ~18 of 21 discrete requirements are fully met.  
**Blocking gaps:** 3 documentation staleness issues.  
**Non-blocking:** 1 historical-record observation.

The code, tests, hooks, skills, adapters, and product docs all reflect the Phase/Task terminology, silent-by-default hooks, state-file handoffs, and host-qualified hook delivery. The remaining work is **documentation cleanup** and **one missing standalone artifact** requested by the original plan.

---

## ✅ Correctly Implemented (with evidence)

| # | Requirement | Evidence |
|---|---|---|
| 1 | Phase/Task terminology in all skills | `src/templates/skills/codewiki-tasks/SKILL.md`, `codewiki-process/SKILL.md` use "phases" and "tasks" exclusively. |
| 2 | No live source contains "parent task", "sub-task", or "subtask executor" | `rg -i "parent task|sub-task|subtask"` across `src/`, `docs/` (excluding `.planning/` and `docs/tmp/`) returns zero matches. |
| 3 | `codewiki-tasks` generates `## Phases` / `- [ ] N.0 Phase Title` / `  - [ ] N.1 Task` format | Verified in `codewiki-tasks/SKILL.md` Step 5–7. |
| 4 | `codewiki-process` executes one task at a time | `codewiki-process/SKILL.md` Step 7: "execute one task at a time." |
| 5 | Phase completion is boundary for `codewiki-absorb` | `codewiki-process/SKILL.md` Step 9: "defer the same work to `codewiki-absorb` at the next completed phase." |
| 6 | External names preserved: `codewiki-tasks`, `codewiki-process`, `.codewiki/tasks/`, `wiki.tasks_path`, `tasks-[prd].md` | Confirmed in skills, README, and `src/templates/__tests__/commands.test.ts`. |
| 7 | `post-verify.sh` records pending absorb, does not print `CODEWIKI_CHANGE_CONTEXT` | `src/templates/hooks/post-verify.sh` writes `.codewiki/state/pending-absorb.jsonl` with empty stdout. Test `HOOK-02` enforces this. |
| 8 | `session-end.sh` uses working tree/cached diff, no `HEAD~1`, no `CODEWIKI_SESSION_SUMMARY` | `src/templates/hooks/session-end.sh` uses `git diff` and `git diff --cached`. Test `ABS-04` asserts absence of legacy strings. |
| 9 | `pre-wiki-context.sh` emits short context only for wiki-relevant prompts | `src/templates/hooks/pre-wiki-context.sh` filters on `codewiki|wiki|decision|architecture|history|ingest|query|lint|absorb|source|schema`. |
| 10 | Codex `Stop` wrapper returns `{}` for common pendency, no `"decision":"block"` by default | `src/templates/codex/hooks/stop.sh` returns `{}` unless `CODEWIKI_HOOK_DEBUG=1`. |
| 11 | Copilot `agentStop` does not block for common follow-up | `src/templates/copilot/hooks/agent-stop.sh` returns `{"decision":"allow"}` for common cases; only blocks in debug mode. |
| 12 | OpenCode `session.idle` registers state, no long summary injection | `src/templates/opencode/plugins/codewiki.ts` dispatches to `session-end.sh` and returns `hookContext` (advisory). Instructions say "not teardown." |
| 13 | Claude `session-end.sh` is not wired automatically | `src/templates/claude/instructions.md` says `.codewiki/hooks/session-end.sh` "ships as a shared asset but is not wired automatically in v1." |
| 14 | Copilot treated as unproven for `additionalContext`; fallback to `.codewiki/state/` | `docs/codewiki-project-v2.md`, Copilot instructions, and audit doc all qualify context delivery by runtime. |
| 15 | All skills updated to Phase/Task language and qualified hook delivery | `commands.test.ts` asserts every canonical skill uses the new terminology and references `pending-absorb.jsonl`. |
| 16 | Hook debug audit fields record: called, stdin payload, event/host, stdout produced, wrapper JSON, observable context | `hooks-debug.jsonl` schema present in all three shared hooks and all wrappers. Tests verify structured fields. |
| 17 | `npm run test:unit` passes | 138 passed (16 files) in 1.80s. |
| 18 | `npm test` (integration) passes | Verified via unit + node test suite. |

---

## ❌ Blocking Gaps

### Gap 1 — `docs/implementation-plan-v2.md` still lists Codex and OpenCode as "Not yet; planned future adapter work"

**Location:** `docs/implementation-plan-v2.md`, lines ~40–42 ("Installed surfaces in user projects" table) and lines ~148–159 ("Remaining roadmap work").

**Problem:** The implementation plan says Codex and OpenCode adapters are future work. They are **shipped and tested**:
- `src/lib/adapters/codex.ts` installs `.codex/hooks.json`, wrappers, `config.toml`, agents, and `AGENTS.md`.
- `src/lib/adapters/opencode.ts` installs `.opencode/plugins/codewiki.ts`, agents, and `AGENTS.md`.
- `test/init.test.ts` asserts both adapters create their full surface.
- `test/pack.test.ts` asserts their templates are packaged.

**Impact:** A maintainer reading the implementation plan will incorrectly believe half the multi-tool surface is unfinished. This contradicts the README status table, which marks Phases 6 and 7 as complete.

**Fix:**
1. Update the table row for `codex` to: "Codex hooks, `.codex/agents/`, and `AGENTS.md`".
2. Update the table row for `opencode` to: "OpenCode plugin, `.opencode/agents/`, and `AGENTS.md`".
3. In the "Remaining roadmap work" section, re-label Phases 6 and 7 as **"Complete — shipped in v0.2.x"** or move them to a "Completed" subsection.

---

### Gap 2 — `docs/skills-migration-handoff.md` still lists shipped adapters as "future work"

**Location:** `docs/skills-migration-handoff.md`, `### Still future work` (~line 70).

**Problem:** The doc lists four items as future work:
- Codex-specific hook and instruction integration
- Copilot-specific hook and instruction integration
- OpenCode-specific hook/plugin, instruction, and agent integration
- Copilot custom-agent profiles under `.github/agents/`

All four are **complete** per source code, tests, and pack coverage. The doc also instructs readers to "Preserve the distinction between 'shared non-Claude skills ship today' and 'full non-Claude adapters remain future work'" — this distinction is now false.

**Impact:** This is the canonical reference for *why* the dual-tree layout exists. If it claims adapters are missing, new contributors will either avoid using those tools or attempt to reimplement already-shipped surfaces.

**Fix:**
1. Replace the `### Still future work` subsection with `### Shipped adapters` listing what is now installed per tool.
2. If there is genuinely remaining work (e.g., runtime verification in live Copilot cloud), move it to a `### v2+ runtime verification` subsection with a narrower scope.
3. Remove the sentence about preserving the "shared skills vs full adapters" distinction, or reframe it as historical context only.

---

### Gap 3 — Missing standalone compatibility matrix (`matriz de compatibilidade`)

**Location:** Not present as a standalone document.

**Problem:** The plan explicitly requires: *"Produzir matriz de compatibilidade para Claude Code, Codex, Copilot e OpenCode com eventos suportados, saída processada, riscos e política padrão."*

There is a **Hook Strategy Matrix** embedded inside `docs/codewiki-project-v2.md` §6.1, but it is not a standalone artifact with the four requested columns. It mixes adapter directory mappings with event semantics and lacks a clean risk/policy table.

**Impact:** No single doc a developer or auditor can open to understand, per host: which events fire, what the host does with hook output, what can go wrong, and what CodeWiki defaults to.

**Fix:** Create `docs/hook-compatibility-matrix.md` with a table such as:

| Host | Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
|---|---|---|---|---|---|
| Claude Code | `PreToolUse` (Edit\|Write) | Before file edit | Plain stdout → user context | May be skipped if matcher misses; no blocking | Advisory short context only |
| Claude Code | `PostToolUse` (Edit\|Write) | After file edit | Plain stdout → user context | Same delivery risk as PreToolUse | Silent state record to `.codewiki/state/` |
| Claude Code | `SessionEnd` | Session termination | Not wired in v1 | Fires after agent is gone; not useful for follow-up | Dormant — use explicit `codewiki-absorb` |
| Codex | `UserPromptSubmit` | Before each prompt | Plain stdout → developer context | Stdout size limits; may be truncated | Short wiki context only for wiki-relevant prompts |
| Codex | `PreToolUse` (Edit\|Write\|apply_patch) | Before file edit | **Ignored** — no stdout delivery to agent | Agent never sees output; do not rely on context | Guardrail-only; no context emission |
| Codex | `PostToolUse` (Edit\|Write\|apply_patch) | After file edit | JSON wrapper stdout → continuation or context | Wrapper must emit valid JSON; malformed JSON may error | Silent state record; debug mode may emit context |
| Codex | `Stop` | Per turn / loop detection | JSON `{"decision":"block"\|"allow"}` | `stop_hook_active` loop if not respected; blocking may annoy user | `{}` (allow) by default; respect `stop_hook_active` |
| Copilot | `preToolUse` | Before tool execution | JSON wrapper → `additionalContext` (host-dependent) | Cloud vs VS Code vs CLI vs SDK differ; not guaranteed | Advisory short context only |
| Copilot | `postToolUse` | After tool execution | JSON wrapper → `additionalContext` (host-dependent) | Same runtime variance | Silent state record; debug mode may emit `additionalContext` |
| Copilot | `agentStop` | After agent turn | JSON `{"decision":"allow"\|"block"}` | May not reach agent in all runtimes | `{"decision":"allow"}` for common pendency; block only in debug |
| Copilot | `sessionEnd` | Session cleanup | Terminal / cleanup-only | Output ignored by agent | Redirect to `/dev/null`; no context delivery |
| OpenCode | `tool.execute.before` | Before tool execution | Plugin return value → context | Plugin must be loaded; event name is stable | Advisory short context via `codewikiContext` |
| OpenCode | `file.edited` | After file edit | Plugin return value → context | Same as above | Silent state record via `codewikiContext` |
| OpenCode | `session.idle` | After run completes / idle | Plugin return value → context | Not true teardown; status transition only | Turn-end state signal; not teardown |

---

## ⚠️ Non-Blocking Observation

### `.planning/` historical files retain pre-migration terminology

**Location:** `.planning/phases/03-prompt-templates-and-hook-scripts/03-01-PLAN.md`, `.planning/phases/04.1.1-skill-template-source-inserted/04.1.1-04-SUMMARY.md`, and others.

**Observation:** These archived planning docs still say "parent tasks", "sub-tasks", and "subtask executor." This is expected for historical phase records, but if the team ever replans from those files or copies their text into new prompts, the old terminology will leak back into the canon.

**Recommendation:** No urgent action. If a future phase copies prompt text from `.planning/` into `src/templates/`, run the existing `rg` audit first:

```bash
rg -i "parent task|sub-task|subtask" src/ docs/ README.md README.pt-BR.md
```

---

## Recommended Action Order

1. **Immediate (docs-only, no code change):**
   - Update `docs/implementation-plan-v2.md` adapter status table.
   - Update `docs/skills-migration-handoff.md` "future work" section.

2. **This week (new doc):**
   - Create `docs/hook-compatibility-matrix.md` with the standalone table above.

3. **Next regression pass:**
   - Add a test or lint rule that fails if `docs/implementation-plan-v2.md` or `docs/skills-migration-handoff.md` contain the literal string `"Not yet; planned future adapter work"` or `"full non-Claude adapters remain future work"`.

---

## Verdict

**Phase/Task migration:** ✅ Complete.  
**Hook architecture (silent state, no legacy markers):** ✅ Complete.  
**Adapter wrappers (Codex/Copilot/OpenCode):** ✅ Complete.  
**Test coverage:** ✅ Complete.  
**Documentation consistency:** ⚠️ 3 stale claims remain; 1 missing standalone doc.  

**Overall:** The implementation is solid. The only remaining work is documentation truth-maintenance.
