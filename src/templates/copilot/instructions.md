## CodeWiki

Copilot uses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree for CodeWiki skills, plus Copilot hooks installed under `.github/hooks/`.

CodeWiki is not query-time RAG. It maintains a persistent, human-reviewed markdown wiki that compounds project knowledge across sessions. Use it as durable project memory: read/query the wiki before answering questions that depend on project history, and keep the wiki current when sources or substantial code changes add durable knowledge.

### Operating Flow

- New external source in `raw/` or user asks to process docs: use `codewiki-ingest`. Raw sources are immutable; wiki edits are proposed for review.
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
- Propose wiki edits first and wait for human approval before writing them.
- Use the verifier role as a read-only check when a wiki change needs contradiction or index review.

### Copilot Hooks

- `.github/hooks/codewiki-hooks.json` wires `preToolUse` to `.codewiki/hooks/pre-wiki-context.sh`
- `.github/hooks/codewiki-hooks.json` wires `postToolUse` to `.codewiki/hooks/post-verify.sh`
- `.github/hooks/codewiki-hooks.json` wires `agentStop` as the meaningful post-turn CodeWiki follow-up hook
- `.github/hooks/codewiki-hooks.json` wires `sessionEnd` as cleanup-only lifecycle handling

### Important Paths

- Wiki: `wiki/`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
