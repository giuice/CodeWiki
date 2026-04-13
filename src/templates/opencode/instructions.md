## CodeWiki

This project uses CodeWiki to keep human-reviewed project knowledge in `wiki/`.

### CodeWiki Skills
- `codewiki-ingest`, `codewiki-query`, `codewiki-lint`
- `codewiki-absorb`, `codewiki-breakdown`
- `codewiki-prd`, `codewiki-tasks`, `codewiki-process`

OpenCode discovers these from `.agents/skills/codewiki-<name>/SKILL.md`.

### Approval Boundary
- Treat `wiki/` as durable project knowledge, not scratch space.
- Propose wiki changes first.
- Do not create or edit files under `wiki/` until the human gives explicit approval for that change.

### Hook Behavior
- `tool.execute.before` may surface relevant context from `wiki/index.md` before an edit.
- `file.edited` may emit structured change context for follow-up wiki maintenance.
- `session.idle` may emit a lightweight session summary for later absorb work. Treat it as assistant-idle or turn-end, not teardown.

### Important Paths
- Wiki pages: `wiki/`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
