## CodeWiki

Codex uses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree for CodeWiki skills, plus Codex-owned hooks and agents under `.codex/`.

CodeWiki is not query-time RAG. It maintains a persistent, human-reviewed markdown wiki that compounds project knowledge across sessions. Use it as durable project memory: read/query the wiki before answering questions that depend on project history, and keep the wiki current when sources or substantial code changes add durable knowledge.

### Operating Flow

- At session start for wiki work: read `.codewiki/config.yml`, `wiki/SCHEMA.md`, `wiki/index.md`, and recent `wiki/log.md` before ingest/query/lint/absorb.
- New external source in `wiki/raw/` or user asks to process docs: use `codewiki-ingest`. Raw sources are immutable; wiki edits are proposed for review.
- User asks how the project works, why a decision was made, or where knowledge lives: use `codewiki-query` and cite wiki pages rather than inventing answers.
- User asks what to do next, resumes a session, starts a feature, or needs routing across CodeWiki workflows: use `codewiki-flow` to choose the next focused skill.
- New feature or larger change: use `codewiki-prd`, then `codewiki-tasks`, then `codewiki-process` to work one sub-task at a time.
- After a substantial coding session: run `codewiki-absorb` deliberately to capture durable lessons, entities, decisions, and issues from recent changes.
- Periodically or when drift is suspected: run `codewiki-lint` and `codewiki-breakdown` to find contradictions, stale claims, orphan pages, and missing high-signal pages.
- When setting up or auditing Obsidian usage: use `codewiki-obsidian` to keep vault structure, attachments, wikilinks, Dataview-ready frontmatter, and graph navigation compatible with CodeWiki.
- When a hook surfaces `CODEWIKI_CHANGE_CONTEXT`, treat it as a required follow-up signal: invoke `codewiki-wiki-updater` immediately to propose approval-gated wiki updates, or explicitly defer the same work to `codewiki-absorb` at session end.
- After `codewiki-wiki-updater` proposes a non-trivial wiki change, invoke `codewiki-verifier` for read-only contradiction, reference, frontmatter, index, log, and backlink review before applying approved wiki edits.
- Hooks provide context and change signals; they do not replace deliberate ingest/query/absorb/lint work or human approval of wiki writes.

### Schema Discipline

- Treat `wiki/SCHEMA.md` as the routing contract for page types, frontmatter, tag taxonomy, page thresholds, archive policy, index metadata, and log format.
- Raw markdown sources should preserve provenance fields such as `source_url`, `ingested`, and `sha256`; use `codewiki-ingest`/`codewiki-lint` to detect unchanged sources or source drift.
- Wiki pages should make uncertainty visible with `confidence`, `contested`, `contradictions`, and `sources` frontmatter instead of presenting weak claims as settled facts.
- New tags must be added to the schema taxonomy before use. Do not create pages for passing mentions; prefer updating existing pages unless the schema thresholds justify a new page.
- Substantial query answers can be proposed as durable pages under `wiki/queries/` or `wiki/comparisons/`; trivial lookups should stay in chat.
- Use the verifier agent for read-only review of proposed wiki changes that touch frontmatter, tags, confidence, contradictions, archive moves, index/log updates, or backlinks.

### Skills

- `codewiki-ingest`, `codewiki-query`, `codewiki-lint`
- `codewiki-absorb`, `codewiki-breakdown`, `codewiki-obsidian`
- `codewiki-prd`, `codewiki-tasks`, `codewiki-process`, `codewiki-flow`

### Approval Boundary

- Treat `wiki/` as human-reviewed knowledge.
- Propose wiki edits first and wait for approval before writing them.
- Use the verifier agent as a read-only check when a wiki change needs contradiction, reference, or index review.

### Codex Hooks

- `.codex/config.toml` enables `[features] codex_hooks = true`
- `.codex/hooks.json` wires `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, and loop-safe `Stop`
- `UserPromptSubmit` loads prompt-level wiki context from `.codewiki/hooks/pre-wiki-context.sh`
- `PreToolUse` on `Edit|Write|apply_patch` is guardrail-only because Codex ignores plain stdout there
- `PostToolUse` wraps `.codewiki/hooks/post-verify.sh` output as Codex JSON additional context; `CODEWIKI_CHANGE_CONTEXT` is the discovery mechanism for invoking `codewiki-wiki-updater`
- `Stop` wraps `.codewiki/hooks/session-end.sh` as JSON and respects `stop_hook_active` to avoid continuation loops

### Important Paths

- Hooks: `.codex/hooks.json`, `.codex/config.toml`
- Agents: `.codex/agents/`
- Wiki: `wiki/`
- Schema: `wiki/SCHEMA.md`
- Raw sources: `wiki/raw/`
- PRD/task workflow: `.codewiki/tasks/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
