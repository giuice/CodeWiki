# Phase 7: Codex and Copilot Adapters - Research

**Researched:** 2026-05-01
**Domain:** Codex and GitHub Copilot adapter integration for the CodeWiki installer
**Confidence:** HIGH for repository-side installer, template, and regression work; MEDIUM for live hook payload smoke behavior because host runtimes can evolve quickly.

## Summary

Phase 7 should implement Codex and Copilot as real adapters layered on top of the already-shipped shared `.agents/skills` installer. The repo already has the right pattern from Claude and OpenCode: adapters copy tool-owned template assets, merge marker-managed instruction blocks, and let the shared scaffold own `.codewiki/hooks/`.

The main risk is not architecture. It is event contract fidelity. Current Codex docs require `[features] codex_hooks = true`, support repo-local `.codex/hooks.json`, and make stdout behavior event-specific. `UserPromptSubmit` can add context from plain text or JSON `additionalContext`; `PreToolUse` ignores plain text and only blocks with JSON or exit code 2; `PostToolUse` can inject additional context through JSON; `Stop` expects JSON on stdout and exposes `stop_hook_active` to prevent continuation loops. Codex `apply_patch` can be matched via `apply_patch`, `Edit`, or `Write`.

Copilot uses a different hook format under `.github/hooks/*.json` with `"version": 1`. The current GitHub docs describe command hooks with `type: "command"` plus `bash`/`powershell`, and list `agentStop` as the main-agent turn-completion hook whose output can force continuation. `sessionEnd` is explicitly termination/cleanup and has ignored output, so it must not become the smart follow-up hook.

Recommended split:

1. `07-01`: Codex templates: wrappers, hooks config, config TOML, instruction block, and TOML agents.
2. `07-02`: Codex adapter wiring: copy templates, merge TOML hooks feature, merge `.codex/hooks.json`, merge `AGENTS.md`, resolve adapter, remove pending report.
3. `07-03`: Codex regression coverage for templates, idempotent install, no-clobber hooks/config, mixed Claude+Codex skill trees.
4. `07-04`: Copilot templates: hook JSON, wrapper scripts, instruction block.
5. `07-05`: Copilot adapter wiring: copy hooks/wrappers, merge `.github/copilot-instructions.md`, resolve adapter, remove pending report.
6. `07-06`: Copilot and combined regression coverage for explicit install, no-clobber/idempotency, mixed selections, and pending-report cleanup.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CODEX-01 | Codex selections reuse `.agents/skills/codewiki-<name>/SKILL.md` | Already implemented by `SharedSkillsAdapter`; Phase 7 must preserve it and avoid `.codex/skills` |
| CODEX-02 | Merge `.codex/hooks.json`, enable `codex_hooks`, use `UserPromptSubmit`, `PreToolUse`/`PostToolUse` matchers for `apply_patch`, and event-specific JSON wrappers | Supported by current Codex hooks docs; requires thin wrapper scripts and safe JSON/TOML merges |
| CODEX-03 | Append CodeWiki instructions to `AGENTS.md` with marker comments | Reuse `mergeMarkerSection()` as Claude/OpenCode do |
| COP-01 | Create `.github/hooks/codewiki-hooks.json` with `"version": 1`, tool hooks, and `agentStop` follow-up semantics | Supported by GitHub Copilot hook docs; use command hooks and conservative wrapper scripts |
| COP-02 | Append CodeWiki instructions to `.github/copilot-instructions.md` with marker comments | Reuse `mergeMarkerSection()` |
| COP-03 | Reuse `.agents/skills/codewiki-<name>/SKILL.md`; do not introduce `.github/skills` | Already implemented by `SharedSkillsAdapter`; Phase 7 must preserve it |
</phase_requirements>

## Canonical Findings

### Codex hooks

- Hooks are enabled by `[features] codex_hooks = true` in `.codex/config.toml`.
- Codex loads repo-local hooks from `.codex/hooks.json` or inline `[hooks]` in `.codex/config.toml`; use one representation for hook entries to avoid merge warnings.
- Commands run with the session `cwd`, so repo-local hook commands should resolve `git rev-parse --show-toplevel`.
- `PreToolUse` and `PostToolUse` can match file edits through `apply_patch`, `Edit`, or `Write`.
- `PreToolUse` plain stdout is ignored; guardrail output must be JSON or exit code 2.
- `PostToolUse` can add developer context via JSON and can force the model to continue from hook-provided feedback.
- `UserPromptSubmit` plain stdout is useful for prompt-level wiki context injection.
- `Stop` plain stdout is invalid. A loop-safe wrapper must output JSON and allow stopping when `stop_hook_active` is already true.

Sources: <https://developers.openai.com/codex/hooks>

### Codex skills and subagents

- Codex reads repo skills from `.agents/skills` from the working directory upward to the repository root.
- Skills use `SKILL.md` with `name` and `description`; existing CodeWiki skill templates already match the portable skill format.
- Project-scoped custom agents live under `.codex/agents/*.toml`.
- Each custom agent TOML requires `name`, `description`, and `developer_instructions`.

Sources: <https://developers.openai.com/codex/skills>, <https://developers.openai.com/codex/subagents>

### Copilot hooks

- Copilot hook files are JSON files loaded from `.github/hooks/*.json` and use `"version": 1`.
- Command hooks use `type: "command"` with `bash` and/or `powershell`, optional `cwd`, `env`, and `timeoutSec`.
- `preToolUse` can allow, deny, ask, or modify tool args with stdout JSON.
- `postToolUse` runs after successful tools; `postToolUseFailure` handles failure-specific recovery guidance.
- `agentStop` fires when the main agent finishes a turn and can block/force continuation with `decision: "block"` and `reason`.
- `sessionEnd` fires on session termination and ignores output, so it is cleanup-only.
- Hook config supports camelCase names and VS Code-compatible PascalCase names; use the canonical camelCase names for `.github/hooks/codewiki-hooks.json` unless a wrapper intentionally supports both input shapes.

Sources: <https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-hooks-reference>, <https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-hooks>

## Existing Repo Patterns

### Reuse directly

- `src/lib/adapters/claude.ts`: directory copy, executable permissions, JSON hook merge, marker-section instruction merge, report entries.
- `src/lib/adapters/opencode.ts`: compact `AGENTS.md` merge and real adapter layering beside shared skills.
- `src/lib/adapters/shared-skills.ts`: canonical non-Claude skill installer.
- `src/lib/merge.ts`: `deepMerge()`, `deduplicateHookEntries()`, `mergeMarkerSection()`.
- `src/commands/init.ts`: pending-integration report must be narrowed as real adapters land.
- `test/init.test.ts`: end-to-end compiled CLI install tests.
- `src/templates/__tests__/opencode-adapter.test.ts`: template content-contract test style.

### New reusable utilities likely needed

- A tiny TOML feature merge helper inside `CodexAdapter` or a local function that preserves existing `.codex/config.toml` text and adds `[features]\ncodex_hooks = true` without clobbering other keys.
- Wrapper scripts under tool-specific template directories that dispatch to existing `.codewiki/hooks/*.sh` and translate stdout into host-specific JSON where required.

## Recommended Implementation Details

### Codex template shape

Create:

- `src/templates/codex/hooks.json`
- `src/templates/codex/config.toml`
- `src/templates/codex/hooks/user-prompt-submit.sh`
- `src/templates/codex/hooks/pre-tool-use.sh`
- `src/templates/codex/hooks/post-tool-use.sh`
- `src/templates/codex/hooks/stop.sh`
- `src/templates/codex/agents/codewiki-wiki-updater.toml`
- `src/templates/codex/agents/codewiki-verifier.toml`
- `src/templates/codex/instructions.md`

The wrappers should stay thin:

- `user-prompt-submit.sh`: call `.codewiki/hooks/pre-wiki-context.sh` and let plain stdout become Codex developer context.
- `pre-tool-use.sh`: call shared guardrail/context script only if needed, but return `{}` or no output for allow; never emit plain text as if it would inject context.
- `post-tool-use.sh`: call `.codewiki/hooks/post-verify.sh`, escape the output, and emit JSON with `hookSpecificOutput.hookEventName = "PostToolUse"` and `additionalContext`.
- `stop.sh`: if `stop_hook_active` is true, emit `{}` and exit 0; otherwise call `.codewiki/hooks/session-end.sh`, and only when it produces clear follow-up text emit `{"decision":"block","reason":"..."}`.

### Copilot template shape

Create:

- `src/templates/copilot/hooks/codewiki-hooks.json`
- `src/templates/copilot/hooks/pre-tool-use.sh`
- `src/templates/copilot/hooks/post-tool-use.sh`
- `src/templates/copilot/hooks/agent-stop.sh`
- `src/templates/copilot/instructions.md`

The Copilot wrappers should use command-hook JSON:

- `pre-tool-use.sh`: call `pre-wiki-context.sh`; when it has context, output an allow/no-op JSON only if useful; avoid blocking by default.
- `post-tool-use.sh`: call `post-verify.sh` and output `additionalContext` or exit code 0 with no output if empty.
- `agent-stop.sh`: detect CodeWiki-triggered continuation via an environment marker or transcript/payload marker and allow stop when already in a CodeWiki follow-up; only return `{"decision":"block","reason":"..."}` when `session-end.sh` produces clear follow-up.

### Adapter wiring

Codex adapter:

- ensure `.codex/`, `.codex/hooks/`, and `.codex/agents/`
- copy wrapper scripts and TOML agents
- chmod copied `.sh` wrapper scripts
- merge `.codex/hooks.json` with deduplication per hook event
- merge `.codex/config.toml` to enable `codex_hooks = true`
- merge `AGENTS.md`
- resolve adapter alongside `SharedSkillsAdapter`
- remove `codex` from `SHARED_SKILL_ONLY_TOOLS`

Copilot adapter:

- ensure `.github/hooks/` and `.github/hooks/codewiki/` or equivalent wrapper directory
- copy wrapper scripts and hook JSON
- chmod copied `.sh` wrapper scripts
- merge or write `.github/hooks/codewiki-hooks.json` without clobbering existing hook files
- merge `.github/copilot-instructions.md`
- resolve adapter alongside `SharedSkillsAdapter`
- remove `copilot` from `SHARED_SKILL_ONLY_TOOLS`

## Test Strategy

### Codex

- Template tests assert hook config contains `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `Edit|Write|apply_patch`, and wrapper filenames.
- Template tests assert TOML agents contain `name`, `description`, `developer_instructions`, approval-gated updater language, and read-only verifier language.
- Init tests assert `init --tool codex` installs `.agents/skills`, `.codex/hooks.json`, `.codex/config.toml`, `.codex/hooks/*.sh`, `.codex/agents/*.toml`, and `AGENTS.md`.
- Init tests assert rerun idempotency: one CodeWiki marker block, no duplicate hook entries, `codex_hooks = true` remains present, and the report no longer says Codex is pending.
- Init tests assert existing `.codex/hooks.json`, `.codex/config.toml`, and `AGENTS.md` user content survives.
- Mixed selection tests assert `--tool claude-code,codex` writes both `.claude/skills` and `.agents/skills` exactly once.

### Copilot

- Template tests assert hook JSON contains `"version": 1`, `preToolUse`, `postToolUse`, `agentStop`, wrapper filenames, and no smart `sessionEnd` follow-up.
- Init tests assert `init --tool copilot` installs `.agents/skills`, `.github/hooks/codewiki-hooks.json`, wrapper scripts, and `.github/copilot-instructions.md`.
- Init tests assert rerun idempotency: one CodeWiki marker block, no duplicate hook entries, and no pending report.
- Init tests assert existing `.github/copilot-instructions.md` text survives.
- Mixed selection tests assert `--tool claude-code,copilot` writes both `.claude/skills` and `.agents/skills` exactly once.

## Common Pitfalls

- Creating `.codex/skills` or `.github/skills` duplicates the already-settled shared skill tree and violates CODEX-01/COP-03.
- Treating Codex `PreToolUse` stdout as context injection silently fails because plain stdout is ignored.
- Emitting plain text from Codex `Stop` is invalid and can break the hook.
- Forgetting `stop_hook_active` can create Codex continuation loops.
- Using Copilot `sessionEnd` for smart follow-up will not work because session-end output is ignored.
- Leaving Codex/Copilot in `SHARED_SKILL_ONLY_TOOLS` after implementing real adapters creates a contradictory install report.
- Overwriting `.codex/config.toml`, `.codex/hooks.json`, `AGENTS.md`, or `.github/copilot-instructions.md` violates the no-clobber requirement.

## Validation Architecture

Phase 7 needs both template-contract and compiled CLI integration tests. The quick feedback loop is:

`npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/codex-adapter.test.ts src/templates/__tests__/copilot-adapter.test.ts`

The full suite remains:

`npm test`

Manual smoke remains useful for live Codex/Copilot hook payloads after implementation, but all installer/file-contract requirements can be automated in this repo.
