# Phase 6: OpenCode Adapter - Research

**Researched:** 2026-04-13
**Domain:** OpenCode plugin/instruction/agent integration for the CodeWiki installer
**Confidence:** HIGH for repo-side installer work; MEDIUM for live OpenCode event payload shapes because they still need runtime validation

## Summary

Phase 6 is not a greenfield adapter from zero. The repo already ships the shared non-Claude skill surface through `src/lib/adapters/shared-skills.ts`, already treats OpenCode as a supported tool in `src/core/types.ts`, and already exposes the right installer/reporting seams to add a real tool adapter. The missing work is the OpenCode-specific surface: project plugin file, project-local agent files, `AGENTS.md` merge, adapter resolution, and regression coverage that proves explicit bootstrap plus rerun idempotency.

The current repo and roadmap support the planned two-plan split cleanly:

1. `06-01` should add the OpenCode-owned template assets only:
   - `src/templates/opencode/plugins/codewiki.ts`
   - `src/templates/opencode/agents/codewiki-wiki-updater.md`
   - `src/templates/opencode/agents/codewiki-verifier.md`
   - `src/templates/opencode/instructions.md`
2. `06-02` should wire the adapter and tests only:
   - `src/lib/adapters/opencode.ts`
   - `src/lib/adapters/index.ts`
   - `src/commands/init.ts`
   - `test/init.test.ts`
   - `src/templates/__tests__/opencode-adapter.test.ts`

That split stays inside the project atomicity rules: each plan touches at most five files, keeps templates separate from wiring/tests, and preserves Phase 6 as an implementation phase instead of a docs cascade.

**Primary recommendation:** implement OpenCode as a real adapter layered on top of the already-shipped shared-skills adapter. Do not create a third skill tree, do not broaden detection in this phase, and do not move wiki logic into the plugin. Keep the plugin a thin event-to-hook bridge and keep idempotency centered on the same copy/merge/report patterns used by Claude.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OC-01 | Reuse `.agents/skills/codewiki-<name>/SKILL.md` for OpenCode selections | Already implemented by `src/lib/adapters/shared-skills.ts`; Phase 6 must preserve and reuse it, not replace it |
| OC-02 | Install 2 subagents to `.opencode/agents/` | Requires new OpenCode-specific agent templates plus adapter copy logic |
| OC-03 | Install `.opencode/plugins/codewiki.ts` dispatching `tool.execute.before`, `file.edited`, `session.idle` to shared shell hooks | Supported by current OpenCode plugin docs; requires a thin TypeScript dispatcher template and adapter install path |
| OC-04 | Append CodeWiki instructions to `AGENTS.md` using marker comments | Supported by existing `mergeMarkerSection()` pattern and current OpenCode rules docs |
</phase_requirements>

## User Constraints (from 06-CONTEXT.md)

### Locked Decisions

- `.opencode/plugins/codewiki.ts` stays a thin dispatcher; no wiki/product intelligence moves into the plugin.
- `session.idle` is treated as assistant-idle / turn-end, not literal teardown.
- OpenCode gets a concise `AGENTS.md` marker block, not a Claude-sized instruction dump.
- The shipped role pair remains `codewiki-wiki-updater` and `codewiki-verifier`, but prompts may be adapted for the OpenCode host.
- Auto-detection stays conservative in Phase 6.
- Explicit `--tool opencode` must bootstrap the full OpenCode surface even if the project had no prior OpenCode files.

### Discretion

- Exact TypeScript structure inside the plugin dispatcher
- Exact wording of the OpenCode `AGENTS.md` block
- Exact prompt adaptation delta between the Claude and OpenCode agent templates
- Exact test decomposition inside the two roadmap plans

## Canonical Findings

### 1. Shared non-Claude skills are already done

The installer already copies canonical skill assets into `.agents/skills/` whenever `codex`, `copilot`, or `opencode` is selected:

- `src/lib/adapters/shared-skills.ts` copies `path.join(options.templateDir, "skills")` into `.agents/skills`
- `src/lib/adapters/index.ts` already resolves the shared-skills adapter for `opencode`
- `test/init.test.ts` already locks the `.agents/skills` behavior for mixed-tool installs

Implication: Phase 6 must not introduce `.opencode/skills/` as a new canonical CodeWiki path even though OpenCode supports it. The product canon already settled on `.agents/skills/` for OpenCode-only and mixed non-Claude installs.

### 2. OpenCode officially supports the install surfaces Phase 6 needs

From the current OpenCode docs checked on 2026-04-13:

- Rules: project `AGENTS.md` is the supported project rule file, `/init` creates or updates it, and `AGENTS.md` takes precedence over `CLAUDE.md`
- Agent Skills: OpenCode discovers skills from `.agents/skills/<name>/SKILL.md` in addition to `.opencode/skills/` and `.claude/skills/`
- Plugins: project-local plugins are loaded from `.opencode/plugins/`
- Plugins: the event list includes `tool.execute.before`, `file.edited`, and `session.idle`
- Plugins: examples use the plugin context `$` helper to shell out to local commands
- Agents: OpenCode supports markdown-defined agents and a project-specific create flow; the global docs explicitly show markdown agent files under `~/.config/opencode/agents/*.md`

Inference from the agents docs plus the product canon: project-scoped OpenCode agents should live under `.opencode/agents/` even though the docs snippet I verified explicitly shows the global path example. This matches the repo's Phase 6 contract and the documented "global or project-specific" create flow.

### 3. The current repo already has the right reusable installer pieces

These files give Phase 6 most of its implementation scaffolding:

- `src/lib/adapters/claude.ts`: the clearest example of copy -> chmod/merge -> report behavior for a real adapter
- `src/lib/adapters/base.ts`: generic directory copy helper with per-file reporting
- `src/lib/merge.ts`: marker-section merge and safe JSON deep merge
- `src/lib/reporter.ts`: sectioned install output already used by `init`
- `src/commands/init.ts`: requested `--tool` values already override auto-detection, which satisfies the explicit OpenCode bootstrap requirement without more CLI work

Implication: OpenCode should mirror Claude's overall adapter structure, but only for the surfaces OpenCode actually owns.

### 4. Detection should stay conservative in this phase

`src/lib/detect.ts` currently recognizes OpenCode from `opencode.json` only. That is narrower than what OpenCode itself can use (`.opencode/` directories also exist), but it matches the user-approved Phase 6 decision to keep auto-detection conservative. Because `src/commands/init.ts` uses `requestedTools ?? await detectTools(root)`, explicit `--tool opencode` already bypasses detection and gives us the required bootstrap path.

Implication: Phase 6 does not need to touch `src/lib/detect.ts` unless implementation reveals an unavoidable issue. The better move is to preserve the narrow detector and prove the explicit bootstrap path in tests.

### 5. The pending-integration report must change once OpenCode becomes real

`src/commands/init.ts` currently treats `opencode` as a "shared skills only" tool in `SHARED_SKILL_ONLY_TOOLS`, which makes the report say hooks/instructions are still pending. Once the OpenCode adapter lands, that messaging becomes incorrect even if shared-skills still runs alongside the new adapter.

Implication: Plan `06-02` must update the pending-report logic so only truly unimplemented tools remain listed as pending.

## Recommended Implementation Shape

### Asset plan (`06-01`)

Create these new template assets:

1. `src/templates/opencode/plugins/codewiki.ts`
   - Exports a plugin factory
   - Resolves the project root from the plugin context
   - Dispatches:
     - `tool.execute.before` -> `.codewiki/hooks/pre-wiki-context.sh`
     - `file.edited` -> `.codewiki/hooks/post-verify.sh`
     - `session.idle` -> `.codewiki/hooks/session-end.sh`
   - Remains intentionally thin and host-specific

2. `src/templates/opencode/instructions.md`
   - Compact marker block for `AGENTS.md`
   - Covers skills, approval boundary, hook behavior, and important project paths
   - Avoids Claude-specific command/instruction framing

3. `src/templates/opencode/agents/codewiki-wiki-updater.md`
4. `src/templates/opencode/agents/codewiki-verifier.md`
   - Preserve updater/verifier responsibilities
   - Use OpenCode-native markdown agent frontmatter and tone
   - Do not invent a new agent catalog

### Wiring plan (`06-02`)

Implement `src/lib/adapters/opencode.ts` with the same overall pattern as Claude:

- ensure `.opencode/plugins`, `.opencode/agents`, and `.codewiki/hooks` exist as needed
- copy plugin and agent templates
- copy shared hooks only if scaffold did not already handle them? no: keep hook ownership with scaffold; the OpenCode adapter only depends on their existing location and should not duplicate them
- merge `AGENTS.md` with `mergeMarkerSection()`
- return per-file `ReportEntry[]`

Then update:

- `src/lib/adapters/index.ts` to resolve the new OpenCode adapter alongside shared-skills
- `src/commands/init.ts` so OpenCode is no longer reported as "pending"
- `test/init.test.ts` to prove explicit OpenCode bootstrap, installed surfaces, and rerun idempotency
- `src/templates/__tests__/opencode-adapter.test.ts` to lock the new template assets

## Plugin Design Guidance

### Dispatcher behavior

The safest plugin design is a thin shell-out bridge with minimal payload shaping:

- For `tool.execute.before`, serialize the event input to stdin so `pre-wiki-context.sh` can extract search terms when useful
- For `file.edited`, serialize the event payload or a normalized `{ filePath }` style object to stdin so `post-verify.sh` can detect related wiki entities
- For `session.idle`, invoke `session-end.sh` without assuming teardown semantics
- Swallow script failures so the plugin behaves like the existing shell hooks: helpful, never blocking

### Event semantics

The docs explicitly list `session.idle` as a plugin event and use it in a notification example for "session completed" / response-ready behavior. The repo's current canon interprets this as assistant-idle / turn-end rather than durable teardown, and that interpretation is consistent with the docs example. This is still an inference from usage, not a stronger protocol guarantee, so implementation should keep comments/documentation careful.

### Payload risk

The official docs confirm event names, but not every handler payload shape needed by our scripts. That is the main remaining technical uncertainty for Phase 6. We should plan around it by:

- keeping plugin normalization minimal and localized
- testing for the presence of the expected event names in template tests
- treating live OpenCode smoke validation as a post-implementation verification step, not as a prerequisite for planning

## Test Strategy Findings

### Best automated coverage for Phase 6

1. `test/init.test.ts` should add OpenCode integration cases that:
   - run `init --tool opencode` in a temp project with no prior OpenCode files
   - assert `.agents/skills/codewiki-<name>/SKILL.md` exists
   - assert `.opencode/plugins/codewiki.ts` exists
   - assert `.opencode/agents/codewiki-wiki-updater.md` and `.opencode/agents/codewiki-verifier.md` exist
   - assert `AGENTS.md` contains exactly one CodeWiki marker block
   - rerun `init --tool opencode` and confirm no duplicate marker sections or duplicate files
   - assert the report no longer labels OpenCode as pending

2. `src/templates/__tests__/opencode-adapter.test.ts` should assert:
   - plugin template contains `tool.execute.before`, `file.edited`, and `session.idle`
   - instructions template mentions `AGENTS.md`, `wiki/`, `raw/`, `.codewiki/config.yml`, and `wiki/_backlinks.json`
   - OpenCode agent templates preserve updater/verifier responsibilities

### What does NOT need new tests in Phase 6

- `src/lib/detect.ts` does not need new detection coverage if we preserve the narrow `opencode.json` rule
- shared-skill installation behavior is already covered and should be reused, not re-tested from scratch
- hook shell scripts already have their own test coverage; Phase 6 only needs to prove the OpenCode surfaces point to them

## Common Pitfalls

### Pitfall 1: Accidentally creating a third skill source of truth

OpenCode supports `.opencode/skills/`, but CodeWiki already standardized on `.agents/skills/` for non-Claude tools. Writing OpenCode skills into `.opencode/skills/` would add a redundant tree and immediately drift from the product/docs canon.

### Pitfall 2: Leaving OpenCode in the "pending integrations" report after implementation

If `src/commands/init.ts` is not updated, the CLI will install the real OpenCode adapter and still tell users OpenCode is pending. That is a product regression even if the files land correctly.

### Pitfall 3: Treating `session.idle` as guaranteed teardown

The docs show `session.idle` as a good response-finished notification trigger, but not as a destructive cleanup boundary. The plugin should not delete state or make assumptions that only hold at real session shutdown.

### Pitfall 4: Over-normalizing event payloads inside the plugin

The more host-specific logic we put in the plugin, the harder it becomes to keep Phase 6 thin and maintainable. The plugin should adapt only enough to call the shared shell hooks.

### Pitfall 5: Copying Claude prompt wording too literally

The user explicitly rejected a near-literal Claude clone. OpenCode agents should preserve role behavior but use the host's native markdown-agent framing, permissions, and tone.

## Validation Architecture

Phase 6 should use a mixed validation strategy because part of the risk is install output and part is template content:

- **Quick run command:** `npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/opencode-adapter.test.ts`
- **Full suite command:** `npm test`
- **Manual smoke check (recommended after execution):** run the built CLI in a temp project with `--tool opencode`, inspect the generated `.opencode/plugins/codewiki.ts`, and if OpenCode is available locally, launch it once to confirm the plugin loads without syntax/runtime errors

Nyquist implications:

- Wave 0 is not a new framework install; the repo already has `node:test` and Vitest
- The missing verification surface is a new template test plus extended init integration coverage
- Manual smoke validation is still useful because runtime payload shapes are only partially documented

## Sources

### Internal

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/phases/06-opencode-adapter/06-CONTEXT.md`
- `.planning/research/SUMMARY.md`
- `docs/codewiki-project-v2.md`
- `docs/implementation-plan-v2.md`
- `src/commands/init.ts`
- `src/lib/adapters/claude.ts`
- `src/lib/adapters/shared-skills.ts`
- `src/lib/adapters/index.ts`
- `src/lib/detect.ts`
- `test/init.test.ts`

### Official OpenCode docs checked on 2026-04-13

- https://opencode.ai/docs/rules/
- https://opencode.ai/docs/skills
- https://opencode.ai/docs/plugins/
- https://opencode.ai/docs/agents/

## Recommendation

Proceed with the roadmap's two-plan Phase 6 split exactly as written. Do not reopen plugin architecture, detection broadening, or skill-tree location in this phase. The best plan is:

- `06-01`: create OpenCode-owned templates only
- `06-02`: wire a real OpenCode adapter plus regression coverage and report cleanup

## RESEARCH COMPLETE
