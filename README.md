# CodeWiki

CodeWiki is a TypeScript npm CLI for bootstrapping a markdown-first project wiki that AI coding agents can read before modifying files and update only after human approval. It scaffolds a local `.codewiki/` schema plus `raw/` and `wiki/` folders, then helps agents produce human-reviewable wiki proposals instead of silently rewriting project knowledge.

## V1 principles

- **Human approval is mandatory.** Commands may scaffold files or draft proposal artifacts, but wiki knowledge is not applied without an explicit human review step.
- **Markdown is the system of record.** CodeWiki uses project-local markdown files instead of a database, server, vector index, or web UI.
- **Tool adapters are thin.** Claude Code, Codex, Copilot, and OpenCode adapters translate the same verification loop into each tool's instruction or hook surface.
- **Proposal output is honest.** `ingest`, `query`, and semantic lint review produce context bundles/checklists; they do not claim autonomous LLM synthesis or final verification.

## Generated project layout

After initialization, a project should contain:

```text
.codewiki/
  config.yml
  templates/
    entity.md
    decision.md
    lesson.md
    issue.md
    source-summary.md
  adapters/
    claude-code/
    codex/
    copilot/
    opencode/
raw/
wiki/
  index.md
  log.md
  entities/
  decisions/
  lessons/
  issues/
  sources/
```

`raw/` is for immutable human-curated markdown sources. `wiki/` is for LLM-written, human-approved project knowledge. `.codewiki/` stores schema conventions, config, templates, and tool-specific adapter fragments.

## Development

```bash
npm install
npm run build
npm run typecheck
npm test
node dist/bin/codewiki.js --help
```

The package compiles TypeScript from `src/` into `dist/` and runs Node's built-in test runner against compiled tests in `dist/test/`. Runtime dependencies are intentionally empty; `typescript` and `@types/node` are dev-only.

## Commands

```bash
codewiki init [--tool claude-code,codex,copilot,opencode] [--name <project-name>] [--force]
codewiki ingest <raw-markdown-path>
codewiki query "<question>"
codewiki lint
codewiki prd "<description>"
codewiki tasks <raw-prd-path>
codewiki status
```

| Command | Behavior |
| --- | --- |
| `init` | Creates the `.codewiki/`, `raw/`, and `wiki/` scaffold. It must refuse unsafe overwrites unless `--force` is supplied and must not claim tool auto-detection if none was performed. |
| `ingest` | Accepts markdown sources, reads `wiki/index.md` when present, and emits a source-summary proposal plus related-update checklist. It must not write final wiki pages automatically. |
| `query` | Reads `wiki/index.md` first, then matched wiki pages, and prints a referenced context bundle for an agent or human. It must not file new pages automatically. |
| `lint` | Runs deterministic checks for required files, broken wikilinks, issue lifecycle metadata, orphan candidates, and entity file-hash drift. Semantic contradiction/stale-claim review is emitted as an agent-review checklist. |
| `prd` | Creates a raw PRD draft marked human-review-needed. |
| `tasks` | Creates a task-list artifact from a PRD and routes the work through the verification loop. |
| `status` | Reports configured paths, page counts, last log entry, issue counts, and drift warning counts. |

## Human approval boundary

Tests passing never implies approval to mutate wiki pages. Ingest, query, and lint-derived updates are proposal-only and print:

```text
PROPOSAL ONLY — no wiki files were modified without approval
```

## Verification loop for wiki updates

1. Before modifying project files, an adapter can read `wiki/index.md` and matched issue/lesson/entity pages to inject relevant context.
2. The agent makes the code change with that context.
3. The agent runs relevant tests and summarizes files changed, wiki context used, and verification results.
4. The agent stops for human review.
5. Only after human approval may the agent propose or apply wiki updates such as lessons, entity updates, source summaries, or log entries.

Read-only questions should use `codewiki query` explicitly instead of triggering pre-hook context injection automatically.

## Adapter notes

`init` can generate adapter fragments for Claude Code, Codex, Copilot, and OpenCode. Claude Code includes example hook wiring. Codex, Copilot, and OpenCode adapters are instruction-only unless you manually wire them into those tools. All adapters state that pre-hook behavior is file-modification-only and read-only tasks should call `codewiki query` explicitly when wiki context is helpful.

## V1 non-goals

CodeWiki v1 deliberately avoids agent activity-log ingestion as raw source, non-markdown ingestion, embeddings/vector search, team workflow management, auto-verification, template migration commands, a database, a server, and a web UI.
