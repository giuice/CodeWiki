# Phase 7: Codex and Copilot Adapters - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 delivers complete Codex and Copilot adapter support on top of the already-shipped shared `.agents/skills` tree. The phase owns Codex hook/config wiring, Codex hook wrappers, Codex `AGENTS.md` integration, Codex subagent templates, Copilot hook configuration, Copilot instruction integration, Copilot `agentStop` behavior, and regression coverage. It does not reopen the eight-skill canon, the shared `.agents/skills` decision, the Claude adapter, or the OpenCode adapter.

</domain>

<decisions>
## Implementation Decisions

### Scope completeness
- **D-01:** Phase 7 must deliver complete Codex and Copilot adapters. Do not cut scope by shipping only partial hooks or instruction-only integrations.
- **D-02:** The correct way to handle current AI token/context limits is aggressive atomic planning inside Phase 7, not deferring pieces out of Phase 7.
- **D-03:** The planner should split work into small plans or sub-slices when needed. A good split is likely Codex hooks/wrappers, Codex adapter merge/config/instructions, Codex agents, Copilot hooks/lifecycle, Copilot instructions/adapter, and focused regression coverage.

### Codex hook strategy
- **D-04:** Codex hook strategy is already documented and should not be treated as an open gray area. Downstream agents must follow the current Codex hook canon in `docs/codewiki-project-v2.md`.
- **D-05:** Enable Codex hooks with `[features] codex_hooks = true` in `.codex/config.toml` and install `.codex/hooks.json`.
- **D-06:** Use `UserPromptSubmit` for prompt-level wiki context injection.
- **D-07:** Use `PreToolUse` on `Edit|Write|apply_patch` only for guardrails or policy checks; do not rely on plain stdout there for context injection.
- **D-08:** Use `PostToolUse` on `Edit|Write|apply_patch` through a Codex-specific wrapper that converts shared `post-verify.sh` output into the JSON shape Codex expects.
- **D-09:** Use `Stop` through a Codex-specific loop-safe JSON wrapper that respects Codex's active-stop-hook signal and avoids continuation loops.
- **D-10:** Codex hook commands should resolve the repository root robustly, for example via `git rev-parse --show-toplevel`, instead of assuming Codex always starts from the repo root.

### Codex install surface
- **D-11:** Codex adapter should be complete in Phase 7, including `.codex/agents/codewiki-wiki-updater.toml` and `.codex/agents/codewiki-verifier.toml`.
- **D-12:** Do not invent a new Codex-specific role catalog. Preserve the existing two CodeWiki roles: updater proposes wiki updates from code changes with human approval; verifier remains read-only and checks consistency, references, and index/log hygiene.
- **D-13:** Adapt the two agent prompts to Codex's TOML subagent format and runtime expectations, rather than forcing a literal copy of the Claude or OpenCode prompt shape.

### Copilot lifecycle behavior
- **D-14:** Wire Copilot `agentStop` in Phase 7 as the meaningful post-turn hook for CodeWiki follow-up.
- **D-15:** `agentStop` must be conservative and loop-safe. It should force continuation only when there is clear evidence that a CodeWiki follow-up is needed.
- **D-16:** `agentStop` must detect when it is already running as a CodeWiki-triggered continuation and allow the agent to stop instead of repeatedly re-triggering itself.
- **D-17:** Copilot `sessionEnd` is cleanup/terminal lifecycle only. Do not use it as the smart post-turn CodeWiki follow-up mechanism.
- **D-18:** Copilot `preToolUse` and `postToolUse` remain the tool-level hook surface for context, guardrails, and post-tool observation.

### Instruction-file merging
- **D-19:** Codex `AGENTS.md` and Copilot `.github/copilot-instructions.md` must always preserve existing user text.
- **D-20:** Never overwrite or replace an existing `AGENTS.md` or `.github/copilot-instructions.md` wholesale. Use CodeWiki marker sections and merge/replace only the managed marker block.
- **D-21:** Instruction blocks should stay compact like the OpenCode block, but include explicit operational notes for hooks and lifecycle behavior.
- **D-22:** Codex instructions should mention available CodeWiki skills, the human-approval boundary for `wiki/` edits, installed hook behavior, and the loop-safe `Stop` wrapper.
- **D-23:** Copilot instructions should mention available CodeWiki skills, the human-approval boundary for `wiki/` edits, installed hook behavior, `agentStop` as post-turn follow-up, and `sessionEnd` as cleanup-only.

### the agent's Discretion
- Exact file split for Codex wrapper scripts, as long as event-specific stdout contracts stay correct and wrappers remain thin.
- Exact TOML field wording for Codex subagents, as long as the two role responsibilities are preserved.
- Exact plan boundaries, as long as each plan is small enough for current token limits and all Phase 7 scope remains in Phase 7.
- Exact wording of compact instruction blocks, as long as existing user text is preserved and lifecycle caveats are explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, dependencies, and Phase 8 boundary.
- `.planning/REQUIREMENTS.md` — `CODEX-01` through `CODEX-03` and `COP-01` through `COP-03` define the adapter contracts.
- `.planning/PROJECT.md` — project architecture, active requirements, shared hook model, no-clobber constraint, and current tool-specific hook canon.
- `.planning/STATE.md` — current phase focus and accumulated decisions, including the 2026-05-01 Codex/Copilot hook refresh.

### Product and implementation design
- `docs/codewiki-project-v2.md` — canonical v2 architecture, dual skill-tree rules, Codex hook contract, Copilot lifecycle clarification, and per-tool install layout.
- `docs/implementation-plan-v2.md` — current maintainer map for Phase 7 work and adapter implementation boundaries.
- `docs/research-reference.md` — official documentation links that must be refreshed before planning or implementing time-sensitive hook behavior.

### Prior phase context
- `.planning/phases/06-opencode-adapter/06-CONTEXT.md` — compact instruction-block preference, shared role-pair preservation, and adapter thin-dispatch precedent.
- `.planning/phases/04.1-skills-migration/04.1-CONTEXT.md` — eight-skill canon, dual-tree skill install rule, and mandatory atomicity constraints.
- `.planning/phases/04-claude-code-adapter-init-command/04-CONTEXT.md` — adapter pipeline, marker-section merge behavior, shared hook script install pattern, and no-clobber expectations.

### Official docs to refresh during research
- `https://developers.openai.com/codex/hooks` — Codex hook events, stdout contracts, feature flag, matcher semantics, and loop-safety signals.
- `https://developers.openai.com/codex/skills` — Codex `.agents/skills` discovery rules.
- `https://developers.openai.com/codex/subagents` — Codex `.codex/agents/*.toml` subagent format.
- `https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-hooks-reference` — Copilot CLI hook events, decision control, payloads, and `.github/hooks/*.json` format.
- `https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-hooks` — Copilot coding-agent hook semantics including `agentStop`, `subagentStop`, and `sessionEnd`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/adapters/claude.ts`: reference for copying shared assets, merging JSON hook config, applying executable permissions, merging instruction marker sections, and reporting inactive lifecycle assets.
- `src/lib/adapters/opencode.ts`: reference for compact `AGENTS.md` marker integration and tool-specific adapter packaging.
- `src/lib/adapters/shared-skills.ts`: already installs the shared non-Claude `.agents/skills/` tree that Codex and Copilot must reuse.
- `src/lib/adapters/base.ts`: shared template directory copy and reporting helper.
- `src/lib/merge.ts`: existing `deepMerge`, `deduplicateHookEntries`, and `mergeMarkerSection` utilities for no-clobber config/instruction merging.
- `src/templates/hooks/pre-wiki-context.sh`, `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`: shared hook scripts that Codex/Copilot wrappers or configs should dispatch to where compatible.
- `src/templates/opencode/instructions.md`: compact instruction-block precedent for non-Claude tools.
- `src/templates/claude/agents/codewiki-wiki-updater.md` and `src/templates/claude/agents/codewiki-verifier.md`: source role responsibilities to adapt into Codex TOML subagents.

### Established Patterns
- Tool adapters stay installer-focused; product intelligence belongs in markdown skills, agents, and shared hooks rather than TypeScript runtime logic.
- Instruction files are merged via `<!-- codewiki:start -->` / `<!-- codewiki:end -->` marker sections and must preserve unrelated user content.
- Shared skills are copied once into `.agents/skills/` for non-Claude selections; mixed Claude plus non-Claude selections also install `.claude/skills/`.
- Report entries should describe created/skipped/replaced/failed files per adapter section rather than hiding partial results.
- Explicit `--tool` selections are authoritative and should bootstrap missing tool directories/config files when this phase owns them.

### Integration Points
- `src/lib/adapters/index.ts`: must resolve real Codex and Copilot adapters instead of leaving them as shared-skills-only pending integrations.
- `src/commands/init.ts`: must stop reporting Codex/Copilot as pending once their real adapters are implemented.
- `src/lib/detect.ts`: current Codex and Copilot detection rules are relevant to bootstrap behavior; broaden only if planning verifies a safe need.
- `src/templates/adapter-templates.ts`: likely stale instruction-only wording for Codex/Copilot should be retired or aligned if still referenced.
- `src/templates/__tests__/opencode-adapter.test.ts` and `src/commands/__tests__/init.test.ts`: useful testing precedent for adapter assets, explicit tool bootstrap, idempotency, and report behavior.

</code_context>

<specifics>
## Specific Ideas

- The user clarified that "complete adapter" was already intended by the product docs. Future agents should not ask whether Codex agents or Copilot lifecycle hooks are in scope; they are in scope for Phase 7.
- The main planning concern is token/context pressure with current AI agents. Split everything small, but keep everything inside Phase 7.
- Copilot `agentStop` is accepted because it is the meaningful post-turn hook, but must behave conservatively and avoid self-triggered loops.
- Existing user-authored `AGENTS.md` content is sacred. CodeWiki may add or replace only its own marker-managed block.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 7 scope.

</deferred>

---

*Phase: 07-codex-and-copilot-adapters*
*Context gathered: 2026-05-01*
