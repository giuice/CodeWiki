# CodeWiki

CodeWiki is a TypeScript npm CLI for bootstrapping a markdown-first project wiki that AI coding agents can read before modifying files and update only after human approval.

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
