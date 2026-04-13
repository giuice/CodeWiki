## CodeWiki

This project uses [CodeWiki](https://github.com/user/codewiki) for AI-maintained project knowledge.

### CodeWiki Skills
- `codewiki-ingest` — Digest a raw source into the wiki
- `codewiki-query` — Search the wiki and synthesize an answer
- `codewiki-lint` — Check the wiki for contradictions, orphan pages, stale claims, and structural drift
- `codewiki-absorb` — Extract durable knowledge from recent git changes
- `codewiki-breakdown` — Find undocumented entities ranked by backlink importance
- `codewiki-prd` — Create a product requirements document
- `codewiki-tasks` — Generate tasks from a PRD
- `codewiki-process` — Process a task list one sub-task at a time

Claude Code discovers these from `.claude/skills/codewiki-<name>/SKILL.md` and can invoke them through its native skill system.

### Wiki Location
- Wiki pages: `wiki/`
- Backlinks index: `wiki/_backlinks.json`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`

### Hooks
CodeWiki hooks are wired through `.claude/settings.json`.

- `PreToolUse` and `PostToolUse` run on `Write|Edit` to provide wiki context and emit post-verify change context.
- `.codewiki/hooks/session-end.sh` ships as a shared asset but is not wired automatically in v1. Use `codewiki-absorb` deliberately at the end of a substantial session.
