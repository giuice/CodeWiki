## CodeWiki

OpenCode uses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree for CodeWiki skills, plus the project-local plugin and agents installed under `.opencode/`.

CodeWiki is not query-time RAG. It maintains a persistent, human-reviewed markdown wiki that compounds project knowledge across sessions. Use it as durable project memory: read/query the wiki before answering questions that depend on project history, and keep the wiki current when sources or substantial code changes add durable knowledge.

### Operating Flow

- At session start for wiki work: read `.codewiki/config.yml`, `wiki/SCHEMA.md`, `wiki/index.md`, and recent `wiki/log.md` before ingest/query/lint/absorb.
- New external source in `wiki/raw/` or user asks to process docs: use `codewiki-ingest`. Raw sources are immutable; wiki edits are proposed for review.
- User asks how the project works, why a decision was made, or where knowledge lives: use `codewiki-query` and cite wiki pages rather than inventing answers.
- New feature or larger change: use `codewiki-prd`, then `codewiki-tasks`, then `codewiki-process` to work one sub-task at a time.
- After a substantial coding session: run `codewiki-absorb` deliberately to capture durable lessons, entities, decisions, and issues from recent changes.
- Periodically or when drift is suspected: run `codewiki-lint` and `codewiki-breakdown` to find contradictions, stale claims, orphan pages, and missing high-signal pages.
- Hooks provide context and change signals; they do not replace deliberate ingest/query/absorb/lint work or human approval of wiki writes.

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
- Schema: `wiki/SCHEMA.md`
- Raw sources: `wiki/raw/`
- PRD/task workflow: `.codewiki/tasks/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
