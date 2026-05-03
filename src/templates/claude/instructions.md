## CodeWiki

This project uses [CodeWiki](https://github.com/user/codewiki) for AI-maintained project knowledge.

CodeWiki is not query-time RAG. It maintains a persistent, human-reviewed markdown wiki that compounds project knowledge across sessions. Use it as durable project memory: read/query the wiki before answering questions that depend on project history, and keep the wiki current when sources or substantial code changes add durable knowledge.

### Operating Flow
- At session start for wiki work: read `.codewiki/config.yml`, `wiki/SCHEMA.md`, `wiki/index.md`, and recent `wiki/log.md` before ingest/query/lint/absorb.
- New external source in `wiki/raw/` or user asks to process docs: use `codewiki-ingest`. Raw sources are immutable; wiki edits are proposed for review.
- User asks how the project works, why a decision was made, or where knowledge lives: use `codewiki-query` and cite wiki pages rather than inventing answers.
- New feature or larger change: use `codewiki-prd`, then `codewiki-tasks`, then `codewiki-process` to work one sub-task at a time.
- After a substantial coding session: run `codewiki-absorb` deliberately to capture durable lessons, entities, decisions, and issues from recent changes.
- Periodically or when drift is suspected: run `codewiki-lint` and `codewiki-breakdown` to find contradictions, stale claims, orphan pages, and missing high-signal pages.
- Hooks provide context and change signals; they do not replace deliberate ingest/query/absorb/lint work or human approval of wiki writes.

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
- Schema: `wiki/SCHEMA.md`
- Raw sources: `wiki/raw/`
- PRD/task workflow: `.codewiki/tasks/`
- Config: `.codewiki/config.yml`

### Hooks
CodeWiki hooks are wired through `.claude/settings.json`.

- `PreToolUse` and `PostToolUse` run on `Write|Edit` to provide wiki context and emit post-verify change context.
- `.codewiki/hooks/session-end.sh` ships as a shared asset but is not wired automatically in v1. Use `codewiki-absorb` deliberately at the end of a substantial session.
