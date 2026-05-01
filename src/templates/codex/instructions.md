## CodeWiki

Codex uses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree for CodeWiki skills, plus Codex-owned hooks and agents under `.codex/`.

### Skills

- `codewiki-ingest`, `codewiki-query`, `codewiki-lint`
- `codewiki-absorb`, `codewiki-breakdown`
- `codewiki-prd`, `codewiki-tasks`, `codewiki-process`

### Approval Boundary

- Treat `wiki/` as human-reviewed knowledge.
- Propose wiki edits first and wait for approval before writing them.
- Use the verifier agent as a read-only check when a wiki change needs contradiction, reference, or index review.

### Codex Hooks

- `.codex/config.toml` enables `[features] codex_hooks = true`
- `.codex/hooks.json` wires `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and loop-safe `Stop`
- `UserPromptSubmit` loads prompt-level wiki context from `.codewiki/hooks/pre-wiki-context.sh`
- `PreToolUse` on `Edit|Write|apply_patch` is guardrail-only because Codex ignores plain stdout there
- `PostToolUse` wraps `.codewiki/hooks/post-verify.sh` output as Codex JSON additional context
- `Stop` wraps `.codewiki/hooks/session-end.sh` as JSON and respects `stop_hook_active` to avoid continuation loops

### Important Paths

- Hooks: `.codex/hooks.json`, `.codex/config.toml`
- Agents: `.codex/agents/`
- Wiki: `wiki/`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
