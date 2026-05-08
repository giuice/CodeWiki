# Tasks: Hooks Normalizados

Source PRD: `docs/explorar/2026-05-06-hooks-normalizados.md`

## Relevant Files

- `src/commands/init.ts` - Common `codewiki init` orchestration point where shared hook installation can run before tool-specific adapters.
- `src/lib/scaffold.ts` - Shared project scaffold behavior that currently creates `.codewiki/hooks` but does not copy shared hook scripts.
- `src/templates/scaffold.ts` - Scaffold directory/file list, including `.codewiki/hooks` and `.codewiki/state`.
- `src/lib/adapters/base.ts` - Existing copy/chmod helpers that should be reused for shared hook installation.
- `src/lib/shared-hooks.ts` - Shared hook installer used by `codewiki init` to copy and chmod `.codewiki/hooks/*.sh` outside any tool-specific adapter.
- `src/lib/adapters/claude.ts` - Claude adapter currently owns shared hook copying and should stop being the only path that installs those scripts.
- `src/lib/adapters/codex.ts` - Codex adapter hook merge behavior and default event list.
- `src/templates/codex/hooks.json` - Codex default hook wiring and current production `statusMessage` entries.
- `src/templates/codex/hooks/user-prompt-submit.sh` - Codex prompt wrapper that dispatches to `pre-wiki-context.sh`.
- `src/templates/codex/hooks/pre-tool-use.sh` - Codex pre-tool wrapper that currently returns `{}` and does not block.
- `src/templates/codex/hooks/post-tool-use.sh` - Codex post-tool wrapper that dispatches to `post-verify.sh`.
- `src/templates/codex/hooks/stop.sh` - Codex stop wrapper that dispatches to `session-end.sh`.
- `src/templates/copilot/hooks/codewiki-hooks.json` - Copilot hook wiring for `preToolUse`, `postToolUse`, `agentStop`, and `sessionEnd`.
- `src/templates/copilot/hooks/pre-tool-use.sh` - Copilot wrapper that dispatches to `pre-wiki-context.sh`.
- `src/templates/copilot/hooks/post-tool-use.sh` - Copilot wrapper that dispatches to `post-verify.sh`.
- `src/templates/copilot/hooks/agent-stop.sh` - Copilot wrapper that dispatches to `session-end.sh`.
- `src/templates/opencode/plugins/codewiki.ts` - OpenCode plugin dispatcher to shared hook scripts.
- `src/templates/hooks/pre-wiki-context.sh` - Shared prompt context sensor that needs narrower filtering and context dedupe/cache.
- `src/templates/hooks/post-verify.sh` - Shared post-edit sensor that writes `pending-absorb.jsonl`.
- `src/templates/hooks/session-end.sh` - Shared session/turn-end sensor that writes `pending-absorb.jsonl`.
- `src/templates/codex/instructions.md` - Codex installed instructions that describe hook defaults.
- `src/templates/copilot/instructions.md` - Copilot installed instructions that describe hook defaults.
- `src/templates/opencode/instructions.md` - OpenCode installed instructions that describe hook defaults.
- `src/templates/claude/instructions.md` - Claude installed instructions that describe hook defaults.
- `src/lib/__tests__/scaffold.test.ts` - Scaffold tests for shared directories/files and report behavior.
- `src/commands/__tests__/init.test.ts` - Init tests for per-tool installation behavior.
- `src/templates/__tests__/hooks.test.ts` - Shared hook behavior tests.
- `src/templates/__tests__/session-end.test.ts` - Session-end hook tests.
- `src/templates/__tests__/codex-adapter.test.ts` - Codex hook template and instruction tests.
- `src/templates/__tests__/copilot-adapter.test.ts` - Copilot hook template and instruction tests.
- `src/templates/__tests__/opencode-adapter.test.ts` - OpenCode plugin and instruction tests.
- `src/templates/__tests__/commands.test.ts` - Skill/instruction contract tests that mention pending absorb behavior.
- `test/init.test.ts` - Compiled CLI integration coverage for generated init reports and installed hook config.
- `test/planning-docs-canon.test.ts` - Compiled product-doc canon integration coverage for stale adapter claims.
- `README.md` - Primary user-facing workflow and hook contract.
- `README.pt-BR.md` - Portuguese user-facing workflow and hook contract.
- `docs/hook-compatibility-matrix.md` - Host-by-host hook behavior reference.
- `docs/codewiki-project-v2.md` - Long-form design reference that documents adapter hook defaults.

## Reusable Utilities, Patterns, and Constraints

- Reuse `copyTemplateDir`, `copyTemplateFile`, and `chmodExecutable` from `src/lib/adapters/base.ts` instead of duplicating filesystem copy logic.
- Reuse `ensureInsideRoot`, `ensureDir`, `exists`, `readTextIfExists`, and `relativePath` patterns for safe root-relative writes.
- Keep shell hooks POSIX `sh` compatible, silent by default, guarded with `trap 'exit 0' EXIT`, and debug-only through `CODEWIKI_HOOK_DEBUG=1`.
- Keep updater/verifier invocation out of hooks. Skills such as `codewiki-process`, `codewiki-absorb`, and `codewiki-flow` remain responsible for reading `.codewiki/state/`.
- Treat `statusMessage` as visible UI output for Codex. No frequent production Codex hook should ship with `statusMessage` by default.
- Do not remove compatibility assets unless the default wiring changes require it. Dormant wrappers may remain packaged when useful for future opt-in behavior.

## [x] 1. Shared Hook Installation Foundation

- [x] 1.1 Add a common shared-hook install path that copies `src/templates/hooks/*.sh` to `.codewiki/hooks/` during `codewiki init`.
  - Target files: `src/commands/init.ts`, `src/lib/adapters/base.ts` or a focused shared helper module.
  - read_first: `src/commands/init.ts`, `src/lib/scaffold.ts`, `src/lib/adapters/base.ts`, `src/templates/hooks/pre-wiki-context.sh`, `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`
  - acceptance_criteria:
    - Running `codewiki init --tool codex`, `--tool copilot`, or `--tool opencode` from tests installs `.codewiki/hooks/pre-wiki-context.sh`, `.codewiki/hooks/post-verify.sh`, and `.codewiki/hooks/session-end.sh`.
    - Installed shared hook scripts are marked executable when newly created or replaced.
    - The init report has a common shared-hook section or clearly reports the shared hook files outside any Claude-only adapter section.
    - No tool-specific adapter is required for `.codewiki/hooks/*.sh` to exist.

- [x] 1.2 Remove Claude-only ownership of shared hook copying while preserving Claude hook wiring.
  - Target files: `src/lib/adapters/claude.ts`, `src/templates/claude/instructions.md`
  - read_first: `src/lib/adapters/claude.ts`, `src/commands/init.ts`, `src/lib/adapters/base.ts`, `src/templates/claude/instructions.md`
  - acceptance_criteria:
    - `ClaudeCodeAdapter.install` no longer copies `path.join(options.templateDir, "hooks")` as its own adapter asset directory.
    - `.claude/settings.json` still wires `PreToolUse` to `.codewiki/hooks/pre-wiki-context.sh` and `PostToolUse` to `.codewiki/hooks/post-verify.sh`.
    - `session-end.sh` remains not wired automatically for Claude by default.
    - Re-running Claude init does not create duplicate report entries for the same shared hook script.

- [x] 1.3 Add install tests that prove shared hooks are present for each non-Claude-only install path.
  - Target files: `src/commands/__tests__/init.test.ts`, optionally `src/lib/__tests__/scaffold.test.ts`
  - read_first: `src/commands/__tests__/init.test.ts`, `src/lib/__tests__/scaffold.test.ts`, `src/commands/init.ts`
  - acceptance_criteria:
    - Tests cover `--tool codex`, `--tool copilot`, and `--tool opencode` installs and assert all three `.codewiki/hooks/*.sh` files exist.
    - Tests cover `--tool all` and assert the shared hooks are installed exactly once in the filesystem.
    - The focused command `npm run test:unit -- src/commands/__tests__/init.test.ts src/lib/__tests__/scaffold.test.ts` passes.

## [x] 2. Normalized Event Schema and State Writes

- [x] 2.1 Normalize `post-verify.sh` pending absorb events to the agreed shared schema.
  - Target files: `src/templates/hooks/post-verify.sh`, `src/templates/__tests__/hooks.test.ts`
  - read_first: `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`, `src/templates/__tests__/hooks.test.ts`
  - acceptance_criteria:
    - Each `post-verify.sh` append to `.codewiki/state/pending-absorb.jsonl` includes `timestamp`, `source`, `host`, `event`, `reason`, `files`, `topic_candidates`, and `diff_hash` or equivalent stable payload hash.
    - The hook remains silent on stdout by default for valid, empty, and malformed payloads.
    - Existing debug fields in `.codewiki/state/hooks-debug.jsonl` continue to include `stdin_payload`, `stdout_produced`, `wrapper_json`, and `observable_context`.
    - `src/templates/__tests__/hooks.test.ts` parses at least one pending event and verifies the required schema fields.

- [x] 2.2 Normalize `session-end.sh` pending absorb events to the same schema.
  - Target files: `src/templates/hooks/session-end.sh`, `src/templates/__tests__/session-end.test.ts`
  - read_first: `src/templates/hooks/session-end.sh`, `src/templates/hooks/post-verify.sh`, `src/templates/__tests__/session-end.test.ts`
  - acceptance_criteria:
    - Each `session-end.sh` append includes `timestamp`, `source`, `host`, `event`, `reason`, `files`, `topic_candidates`, `diff_stat`, and `diff_hash`.
    - `topic_candidates` are derived from changed filenames using the same practical normalization style as `post-verify.sh`.
    - The hook remains silent on stdout outside a git repository, with empty stdin, and with real staged or unstaged changes.
    - `src/templates/__tests__/session-end.test.ts` verifies required schema fields on a recorded event.

- [x] 2.3 Keep schema changes shell-portable and covered by shell compatibility tests.
  - Target files: `src/templates/hooks/pre-wiki-context.sh`, `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`, `src/templates/__tests__/hooks.test.ts`, `src/templates/__tests__/session-end.test.ts`
  - read_first: `src/templates/__tests__/hooks.test.ts`, `src/templates/__tests__/session-end.test.ts`, `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`
  - acceptance_criteria:
    - Shared hooks still start with `#!/bin/sh`.
    - Shared hooks do not introduce `[[`, `local`, bash arrays, or other bash-only syntax.
    - Existing shellcheck tests for `pre-wiki-context.sh`, `post-verify.sh`, and `session-end.sh` pass.

## [x] 3. Codex Hook Defaults and Noise Removal

- [x] 3.1 Remove production `statusMessage` entries from default Codex hook config.
  - Target files: `src/templates/codex/hooks.json`, `src/templates/__tests__/codex-adapter.test.ts`
  - read_first: `src/templates/codex/hooks.json`, `src/templates/__tests__/codex-adapter.test.ts`, `docs/explorar/2026-05-06-hooks-normalizados.md`
  - acceptance_criteria:
    - `src/templates/codex/hooks.json` contains no `statusMessage` keys.
    - Codex hook config remains valid JSON.
    - The Codex template test explicitly fails if `statusMessage` reappears in default hook config.

- [x] 3.2 Remove Codex `PreToolUse` from default wiring if it remains guardrail-only.
  - Target files: `src/templates/codex/hooks.json`, `src/lib/adapters/codex.ts`, `src/templates/codex/instructions.md`, `src/templates/__tests__/codex-adapter.test.ts`
  - read_first: `src/templates/codex/hooks.json`, `src/templates/codex/hooks/pre-tool-use.sh`, `src/lib/adapters/codex.ts`, `src/templates/codex/instructions.md`, `src/templates/__tests__/codex-adapter.test.ts`
  - acceptance_criteria:
    - Default `hooks.json` no longer wires `PreToolUse` unless the wrapper performs a real blocking decision.
    - `CODEX_HOOK_EVENT_NAMES` in `src/lib/adapters/codex.ts` matches the default events still present in `hooks.json`.
    - The dormant `pre-tool-use.sh` wrapper may remain packaged, but instructions describe it as not wired by default when that is the chosen behavior.
    - Codex tests assert `UserPromptSubmit`, `PostToolUse`, and `Stop` defaults without requiring `PreToolUse`.

- [x] 3.3 Preserve Codex JSON and debug-only output contracts after default changes.
  - Target files: `src/templates/codex/hooks/user-prompt-submit.sh`, `src/templates/codex/hooks/post-tool-use.sh`, `src/templates/codex/hooks/stop.sh`, `src/templates/__tests__/codex-adapter.test.ts`
  - read_first: `src/templates/codex/hooks/user-prompt-submit.sh`, `src/templates/codex/hooks/post-tool-use.sh`, `src/templates/codex/hooks/stop.sh`, `src/templates/__tests__/codex-adapter.test.ts`
  - acceptance_criteria:
    - `post-tool-use.sh` returns `{}` by default when shared hook stdout is empty or debug is disabled.
    - `stop.sh` returns `{}` by default and still respects `stop_hook_active`.
    - Any Codex wrapper-visible context or blocking reason remains gated behind `CODEWIKI_HOOK_DEBUG=1`.
    - The focused command `npm run test:unit -- src/templates/__tests__/codex-adapter.test.ts` passes.

## [x] 4. Controlled Context Injection Filtering, Cache, and Dedupe

- [x] 4.1 Narrow `pre-wiki-context.sh` intent matching to explicit CodeWiki-related terms.
  - Target files: `src/templates/hooks/pre-wiki-context.sh`, `src/templates/__tests__/hooks.test.ts`
  - read_first: `docs/explorar/2026-05-06-hooks-normalizados.md`, `src/templates/hooks/pre-wiki-context.sh`, `src/templates/__tests__/hooks.test.ts`
  - acceptance_criteria:
    - The default filter prioritizes explicit terms such as `codewiki`, `wiki`, `ingest`, `query`, `lint`, `absorb`, `obsidian`, `lesson`, and `lessons`.
    - Generic programming terms such as `source`, `history`, `architecture`, `schema`, and `decision` no longer trigger context by themselves.
    - A test proves a generic programming prompt produces no stdout.
    - A test proves an explicit CodeWiki prompt can still produce `## CodeWiki Context` when `wiki/index.md` exists and matches.

- [x] 4.2 Add a small context emission cache so the same context block is not repeated in one session.
  - Target files: `src/templates/hooks/pre-wiki-context.sh`, `src/templates/__tests__/hooks.test.ts`
  - read_first: `src/templates/hooks/pre-wiki-context.sh`, `src/templates/hooks/post-verify.sh`, `src/templates/__tests__/hooks.test.ts`
  - acceptance_criteria:
    - `pre-wiki-context.sh` records an emitted context fingerprint under `.codewiki/state/` using a stable hash of host, event, prompt intent terms, and emitted context.
    - Re-running the hook with the same relevant prompt and same emitted context suppresses duplicate stdout by default.
    - Changing the relevant prompt terms or emitted wiki index match allows a new context block.
    - Debug logging explains whether a context block was emitted, filtered, or deduped when `CODEWIKI_HOOK_DEBUG=1`.

- [x] 4.3 Add minimal operator controls for context diagnostics without changing the silent default.
  - Target files: `src/templates/hooks/pre-wiki-context.sh`, `src/templates/codex/instructions.md`, `README.md`, `README.pt-BR.md`
  - read_first: `src/templates/hooks/pre-wiki-context.sh`, `src/templates/codex/instructions.md`, `README.md`, `README.pt-BR.md`
  - acceptance_criteria:
    - `CODEWIKI_HOOK_DEBUG=1` remains the documented way to make hook diagnostics visible in state logs.
    - Any cache bypass or diagnostic behavior is opt-in by environment variable and does not add visible output in production defaults.
    - README hook docs mention that prompt context is filtered and deduped.

## [x] 5. Post-Edit and Session Lifecycle Dedupe/Throttle

- [x] 5.1 Add duplicate suppression for repeated `post-verify.sh` events.
  - Target files: `src/templates/hooks/post-verify.sh`, `src/templates/__tests__/hooks.test.ts`
  - read_first: `src/templates/hooks/post-verify.sh`, `src/templates/hooks/session-end.sh`, `src/templates/__tests__/hooks.test.ts`
  - acceptance_criteria:
    - Replaying the same host, event, files, and payload/diff hash does not append duplicate lines to `.codewiki/state/pending-absorb.jsonl`.
    - A materially different file set or hash appends a new pending event.
    - Duplicate suppression is persisted under `.codewiki/state/` and survives repeated hook process invocations.
    - The hook remains silent on stdout in duplicate and non-duplicate cases.

- [x] 5.2 Add duplicate suppression or throttle for repeated `session-end.sh` events.
  - Target files: `src/templates/hooks/session-end.sh`, `src/templates/__tests__/session-end.test.ts`
  - read_first: `src/templates/hooks/session-end.sh`, `src/templates/__tests__/session-end.test.ts`, `src/templates/codex/hooks/stop.sh`, `src/templates/copilot/hooks/agent-stop.sh`
  - acceptance_criteria:
    - Running `session-end.sh` twice against the same uncommitted diff records only one pending event for the same host, event, files, and diff hash.
    - A changed diff hash records a new pending event.
    - The behavior protects Codex `Stop`, Copilot `agentStop`, Copilot `sessionEnd`, and OpenCode `session.idle` from spamming `pending-absorb.jsonl`.
    - Existing tests for staged plus unstaged changes still pass.

- [x] 5.3 Keep host wrappers as thin adapters over shared state-writing hooks.
  - Target files: `src/templates/codex/hooks/post-tool-use.sh`, `src/templates/codex/hooks/stop.sh`, `src/templates/copilot/hooks/post-tool-use.sh`, `src/templates/copilot/hooks/agent-stop.sh`, `src/templates/opencode/plugins/codewiki.ts`
  - read_first: `src/templates/codex/hooks/post-tool-use.sh`, `src/templates/codex/hooks/stop.sh`, `src/templates/copilot/hooks/post-tool-use.sh`, `src/templates/copilot/hooks/agent-stop.sh`, `src/templates/opencode/plugins/codewiki.ts`
  - acceptance_criteria:
    - Wrappers continue to set `CODEWIKI_HOOK_HOST` and `CODEWIKI_HOOK_EVENT` before dispatching to shared hooks.
    - Wrappers do not call `codewiki-wiki-updater`, `codewiki-verifier`, `codewiki-process`, or `codewiki-absorb`.
    - Copilot `agentStop` and Codex `Stop` remain allow/no-op by default unless debug-only behavior is explicitly enabled.
    - OpenCode plugin remains a dispatcher and does not implement its own dedupe or schema logic.

## [x] 6. Docs, Templates, and Tests Alignment

- [x] 6.1 Update README hook workflow docs to match the normalized contract.
  - Target files: `README.md`, `README.pt-BR.md`
  - read_first: `README.md`, `README.pt-BR.md`, `docs/explorar/2026-05-06-hooks-normalizados.md`
  - acceptance_criteria:
    - Both READMEs state that hooks are silent sensors, not workflow engines.
    - Both READMEs mention shared hook scripts are installed for every supported adapter path.
    - Both READMEs mention `pending-absorb.jsonl` schema/dedupe at a practical level without over-documenting internals.
    - Both READMEs state updater/verifier follow-up is performed by skills or explicit agent invocation, not by hooks.

- [x] 6.2 Update host-specific instructions and compatibility matrix for Codex and lifecycle defaults.
  - Target files: `docs/hook-compatibility-matrix.md`, `src/templates/codex/instructions.md`, `src/templates/copilot/instructions.md`, `src/templates/opencode/instructions.md`, `src/templates/claude/instructions.md`
  - read_first: `docs/hook-compatibility-matrix.md`, `src/templates/codex/instructions.md`, `src/templates/copilot/instructions.md`, `src/templates/opencode/instructions.md`, `src/templates/claude/instructions.md`
  - acceptance_criteria:
    - Codex docs no longer describe production `statusMessage` or default `PreToolUse` if it was removed.
    - Lifecycle docs describe Stop/sessionEnd/agentStop/session.idle as state sensors protected by dedupe/throttle.
    - The matrix still lists host event differences but presents one CodeWiki observable contract.
    - Instruction template tests are updated to assert the new wording where they currently expect old hook defaults.

- [x] 6.3 Align skills and agent instructions with state-first follow-up.
  - Target files: `src/templates/skills/codewiki-process/SKILL.md`, `src/templates/skills/codewiki-absorb/SKILL.md`, `src/templates/skills/codewiki-flow/SKILL.md`, `src/templates/claude/commands/codewiki/process.md`, `src/templates/claude/commands/codewiki/absorb.md`, `src/templates/claude/commands/codewiki/flow.md`, `src/templates/__tests__/commands.test.ts`
  - read_first: `src/templates/skills/codewiki-process/SKILL.md`, `src/templates/skills/codewiki-absorb/SKILL.md`, `src/templates/skills/codewiki-flow/SKILL.md`, `src/templates/__tests__/commands.test.ts`
  - acceptance_criteria:
    - Skills instruct agents to inspect `.codewiki/state/pending-absorb.jsonl` after meaningful verification or explicit absorb flow.
    - Skills do not imply hooks directly run updater/verifier.
    - Claude command mirrors remain aligned with shared skill wording.
    - `src/templates/__tests__/commands.test.ts` passes after expectation updates.

- [x] 6.4 Run focused and full verification for the normalized hook contract.
  - Target files: `package.json`, changed source and test files from this plan
  - read_first: `package.json`, `src/templates/__tests__/hooks.test.ts`, `src/templates/__tests__/session-end.test.ts`, `src/templates/__tests__/codex-adapter.test.ts`, `src/commands/__tests__/init.test.ts`
  - acceptance_criteria:
    - `npm run test:unit -- src/templates/__tests__/hooks.test.ts src/templates/__tests__/session-end.test.ts` passes.
    - `npm run test:unit -- src/templates/__tests__/codex-adapter.test.ts src/templates/__tests__/copilot-adapter.test.ts src/templates/__tests__/opencode-adapter.test.ts` passes.
    - `npm run test:unit -- src/commands/__tests__/init.test.ts src/lib/__tests__/scaffold.test.ts` passes.
    - `npm run lint` passes, or any failure is documented with the exact failing command and reason.
