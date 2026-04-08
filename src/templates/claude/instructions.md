## CodeWiki

This project uses [CodeWiki](https://github.com/user/codewiki) for AI-maintained project knowledge.

### Wiki Commands
- `/codewiki-ingest` — Digest a raw source into the wiki
- `/codewiki-query` — Search wiki and synthesize an answer
- `/codewiki-lint` — Check wiki for contradictions, orphans, stale content
- `/codewiki-absorb` — Extract knowledge from recent git changes
- `/codewiki-breakdown` — Find undocumented entities ranked by importance
- `/codewiki-prd` — Create a product requirements document
- `/codewiki-tasks` — Generate tasks from a PRD
- `/codewiki-process` — Process task list one sub-task at a time

### Wiki Location
- Wiki pages: `wiki/`
- Backlinks index: `wiki/_backlinks.json`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`

### Hooks
CodeWiki hooks run automatically on Write/Edit operations to provide wiki context and track changes.