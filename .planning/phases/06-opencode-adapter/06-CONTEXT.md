# Phase 6: OpenCode Adapter - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

`npx codewiki init` must install the OpenCode adapter on projects that either already show OpenCode markers or explicitly request `--tool opencode`. The phase reuses the shared `.agents/skills` tree and shared shell hooks, installs OpenCode agent files, appends CodeWiki instructions to `AGENTS.md`, and installs a thin `.opencode/plugins/codewiki.ts` dispatcher that maps documented OpenCode plugin events to the shared hooks. It does not expand scope into alternate skill trees, new runtime product behavior, or broader multi-tool work outside OpenCode.

</domain>

<decisions>
## Implementation Decisions

### Plugin architecture
- **D-01:** `.opencode/plugins/codewiki.ts` stays a thin dispatcher. Its job is to listen to `tool.execute.before`, `file.edited`, and `session.idle`, translate the event payload just enough for the shared shell hooks, and invoke those hooks.
- **D-02:** The plugin must not grow product logic, wiki decision logic, or host-specific "smart" behavior that belongs in the shared hooks or later implementation work.
- **D-03:** `session.idle` continues to be treated as a turn-end / idle signal, not as permanent session teardown.

### OpenCode instruction surface
- **D-04:** `AGENTS.md` integration for OpenCode should be a concise CodeWiki marker block, not a full Claude-style instruction dump.
- **D-05:** That block should cover only the essentials: available CodeWiki skills, the human-approval boundary for `wiki/` edits, expected pre/post hook behavior, and the important project paths (`wiki/`, `raw/`, `.codewiki/config.yml`, `wiki/_backlinks.json`).

### OpenCode agents
- **D-06:** Phase 6 installs the existing two CodeWiki agent roles for OpenCode: `codewiki-wiki-updater` and `codewiki-verifier`.
- **D-07:** OpenCode agent templates should be adapted as much as needed to work best in OpenCode rather than being forced into near-literal copies of another tool's prompt shape.
- **D-08:** The responsibilities stay unchanged even when the prompt wording or workflow is tool-tuned: the updater proposes wiki changes from code changes with per-change approval, and the verifier remains read-only and checks for contradictions, broken references, and missing index updates.
- **D-09:** The same product preference should inform future tool-agent work as later phases arrive: preserve the shared role pair where possible, but optimize each tool's agent prompts for that host's best runtime fit.

### Detection and bootstrap
- **D-10:** Auto-detection for OpenCode remains conservative in this phase. Existing marker-based detection can stay narrow rather than broadening immediately.
- **D-11:** Explicit `--tool opencode` must be authoritative: if the user asks for OpenCode, the installer should create the required OpenCode surface even when no prior OpenCode config exists.
- **D-12:** That bootstrap path should create whatever Phase 6 owns and needs to function: `.opencode/`, `.opencode/plugins/codewiki.ts`, `.opencode/agents/`, and the CodeWiki-managed `AGENTS.md` marker section.

### the agent's Discretion
- Exact TypeScript structure inside the thin plugin dispatcher, as long as it remains a minimal event-to-hook bridge
- Exact wording of the concise `AGENTS.md` marker block
- Exact delta between the Claude agent templates and the OpenCode copies, as long as responsibilities stay equivalent
- Exact bootstrap sequencing and install-report phrasing for newly created OpenCode targets

</decisions>

<specifics>
## Specific Ideas

- The user explicitly called out that plugin architecture had already been decided; preserve the thin-dispatch model rather than reopening it during planning.
- The OpenCode `AGENTS.md` block should stay compact and practical instead of copying the full Claude instruction body.
- Reuse the existing `codewiki-wiki-updater` and `codewiki-verifier` responsibilities rather than inventing a different role catalog for OpenCode.
- The user revised the earlier "light adaptation" wording: prompts should be adapted to work as well as possible for each tool, even if that means more than small wording tweaks, as long as the shared updater/verifier role model still holds.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and acceptance criteria
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, and the expected split into `06-01` and `06-02`
- `.planning/REQUIREMENTS.md` — `OC-01` through `OC-04` define the OpenCode adapter contract
- `.planning/PROJECT.md` — active product context and the current hook/event canon for OpenCode
- `.planning/STATE.md` — current phase focus plus the already-decided OpenCode plugin event model

### Architecture canon
- `docs/codewiki-project-v2.md` — canonical v2 architecture, dual skill-tree rules, and tool-specific instruction surfaces
- `docs/implementation-plan-v2.md` — current maintainer map for the installer, adapter split, and remaining Phase 6 scope
- `.planning/research/SUMMARY.md` — distilled OpenCode phase implications and remaining validation gaps for live event payloads

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/adapters/claude.ts`: the shipped example of a thin tool adapter that copies assets, merges managed files, and reports per-file outcomes
- `src/lib/adapters/shared-skills.ts`: already installs the shared non-Claude `.agents/skills/` tree that OpenCode must keep reusing
- `src/lib/adapters/base.ts`: shared file-copy helpers for template directories and per-file reporting
- `src/lib/merge.ts`: existing marker-section merge logic for instruction files; natural fit for `AGENTS.md`
- `src/templates/hooks/pre-wiki-context.sh`, `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`: shared hook payload targets the plugin must dispatch to
- `src/templates/claude/agents/codewiki-wiki-updater.md` and `src/templates/claude/agents/codewiki-verifier.md`: current agent bodies to adapt for `.opencode/agents/`

### Established Patterns
- Tool adapters stay small and installer-focused; the CLI orchestrates scaffold plus adapter installs rather than embedding tool logic in `init`
- Managed markdown instructions use CodeWiki marker sections instead of clobbering whole files
- Shared assets are copied from `src/templates/` into the host project; adapters should prefer reuse over tool-specific duplication
- Report entries distinguish created/skipped/replaced/failed per target rather than aborting an entire adapter section on one file issue

### Integration Points
- `src/commands/init.ts`: runs scaffold, resolves adapters, and prints the sectioned install report
- `src/lib/adapters/index.ts`: must start resolving a real OpenCode adapter instead of leaving OpenCode at shared-skills-only
- `src/lib/detect.ts`: current detection surface is relevant to the conservative auto-detect + explicit bootstrap decision
- `src/core/types.ts`: OpenCode is already a first-class supported tool

</code_context>

<deferred>
## Deferred Ideas

- Broaden OpenCode auto-detection beyond the current conservative markers only if later validation shows it is safe and reduces false negatives without introducing noisy false positives
- Add deeper OpenCode-specific agent behavior only if real runtime differences justify something beyond light template adaptation
- Capture and harden against real OpenCode event payload shapes as follow-up validation during planning/implementation rather than expanding discuss-phase scope now

</deferred>

---

*Phase: 06-opencode-adapter*
*Context gathered: 2026-04-13*
