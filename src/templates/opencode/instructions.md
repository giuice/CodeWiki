## CodeWiki

OpenCode uses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree for CodeWiki skills, plus the project-local plugin and agents installed under `.opencode/`.

### Skills

- `codewiki-ingest`, `codewiki-query`, `codewiki-lint`
- `codewiki-absorb`, `codewiki-breakdown`
- `codewiki-prd`, `codewiki-tasks`, `codewiki-process`

### Approval Boundary

- Treat `wiki/` as human-reviewed knowledge.
- Propose wiki edits first and wait for approval before writing them.
- Use the verifier agent as a read-only check when a wiki change needs contradiction or index review.

### OpenCode Hooks

- `.opencode/plugins/codewiki.ts` forwards `tool.execute.before` to `.codewiki/hooks/pre-wiki-context.sh`
- `.opencode/plugins/codewiki.ts` forwards `file.edited` to `.codewiki/hooks/post-verify.sh`
- `.opencode/plugins/codewiki.ts` forwards `session.idle` to `.codewiki/hooks/session-end.sh` as an idle or turn-end signal, not teardown

### Important Paths

- Wiki: `wiki/`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
