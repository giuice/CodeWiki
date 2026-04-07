# CodeWiki

<<<<<<< HEAD
CodeWiki is a markdown-first framework for carrying verified project knowledge between AI coding sessions. It installs into a project, scaffolds a local `.codewiki/` schema plus `raw/` and `wiki/` folders, and helps agents produce human-reviewable wiki proposals instead of silently rewriting project knowledge.

## v1 principles

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

## CLI commands

```bash
codewiki init [--tool claude-code,codex,copilot,opencode] [--name <project-name>] [--force]
codewiki ingest <raw-markdown-path>
codewiki query "<question>"
codewiki lint
codewiki prd "<description>"
codewiki tasks <raw-prd-path>
codewiki status
```

Command behavior expected by v1:

| Command | Behavior |
| --- | --- |
| `init` | Creates the `.codewiki/`, `raw/`, and `wiki/` scaffold. It must refuse unsafe overwrites unless `--force` is supplied. |
| `ingest` | Accepts markdown sources, reads `wiki/index.md` when present, and emits a source-summary proposal plus related-update checklist. It must not write final wiki pages automatically. |
| `query` | Reads `wiki/index.md` first, then matched wiki pages, and prints a referenced context bundle for an agent or human. It must not file new pages automatically. |
| `lint` | Runs deterministic checks for required files, broken wikilinks, issue lifecycle metadata, orphan candidates, and entity file-hash drift. Semantic contradiction/stale-claim review is emitted as an agent-review checklist. |
| `prd` | Creates a raw PRD draft marked human-review-needed. |
| `tasks` | Creates a task-list artifact from a PRD and routes the work through the verification loop. |
| `status` | Reports configured paths, page counts, last log entry, issue counts, and drift warning counts. |

Proposal-producing commands should print this boundary clearly:

```text
PROPOSAL ONLY — no wiki files were modified without approval
```

## Development

CodeWiki is implemented as a TypeScript npm CLI with compiled ESM output in `dist/` and a binary entrypoint at `dist/bin/codewiki.js`.

Expected package scripts:

=======
CodeWiki is a TypeScript npm CLI for bootstrapping a markdown-first project wiki that AI coding agents can read before modifying files and update only after human approval.

## Development

>>>>>>> main
```bash
npm install
npm run build
npm run typecheck
npm test
node dist/bin/codewiki.js --help
```

<<<<<<< HEAD
The test strategy compiles TypeScript tests and runs Node's built-in test runner against `dist/test/**/*.test.js`; v1 should not require `tsx`, `ts-node`, Vitest, or runtime dependencies unless a future ADR explicitly approves them.

## Verification loop for wiki updates

1. Before modifying project files, an adapter can read `wiki/index.md` and matched issue/lesson/entity pages to inject relevant context.
2. The agent makes the code change with that context.
3. The agent runs relevant tests and summarizes files changed, wiki context used, and verification results.
4. The agent stops for human review.
5. Only after human approval may the agent propose or apply wiki updates such as lessons, entity updates, source summaries, or log entries.

Read-only questions should use `codewiki query` explicitly instead of triggering pre-hook context injection automatically.

## V1 non-goals

CodeWiki v1 intentionally excludes agent activity logs as raw source, non-markdown ingestion, embeddings/vector search, team workflow support, auto-verification, template migration commands, and a web UI.
=======
The package compiles TypeScript from `src/` into `dist/` and runs Node's built-in test runner against compiled tests in `dist/test/`. Runtime dependencies are intentionally empty; `typescript` and `@types/node` are dev-only.

## Commands

- `codewiki init [--tool claude-code,codex,copilot,opencode] [--name project] [--force]` scaffolds `.codewiki/`, `raw/`, and `wiki/`.
- `codewiki ingest <path>` accepts markdown only and prints a source-summary proposal plus related-update checklist.
- `codewiki query "question"` reads `wiki/index.md` first, then matching wiki pages, and prints a referenced context bundle.
- `codewiki lint` runs deterministic checks for missing files, broken wikilinks, issue lifecycle problems, orphan candidates, and entity file-hash drift; semantic contradiction review is a checklist.
- `codewiki prd "description"` creates a raw PRD draft marked human-review-needed.
- `codewiki tasks <prd-path>` creates a human-review-needed task artifact that references the verification loop.
- `codewiki status` reports page counts, latest log heading, issue counts, and drift warning counts.

## Human approval boundary

Tests passing never implies approval to mutate wiki pages. Ingest, query, and lint-derived updates are proposal-only and print:

`PROPOSAL ONLY — no wiki files were modified without approval`

The framework deliberately avoids v1 non-goals: no server, database, web UI, embeddings, non-markdown ingestion, team workflow management, template migration CLI, agent activity-log ingestion, or auto-verification.

## Adapter notes

`init` can generate adapter fragments for Claude Code, Codex, Copilot, and OpenCode. Claude Code includes example hook wiring. Codex, Copilot, and OpenCode adapters are instruction-only unless you manually wire them into those tools. All adapters state that pre-hook behavior is file-modification-only and read-only tasks should call `codewiki query` explicitly when wiki context is helpful.
>>>>>>> main
