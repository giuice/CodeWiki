# CodeWiki

CodeWiki is a TypeScript npm CLI for a markdown-first, human-approved project wiki framework. It scaffolds `.codewiki/`, `raw/`, and `wiki/`, then provides thin commands that assemble context and proposals without silently mutating approved wiki knowledge.

## Install / Develop

```bash
npm install
npm run build
npm run typecheck
npm test
node dist/bin/codewiki.js --help
```

The package exposes the `codewiki` binary from `./dist/bin/codewiki.js`. Runtime dependencies are intentionally zero; TypeScript and Node types are dev tooling only.

## Commands

```bash
codewiki init
codewiki init --tool claude-code,codex --name my-project
codewiki ingest raw/api-redesign.md
codewiki query "what retry lessons apply to api-client?"
codewiki lint
codewiki prd "describe feature"
codewiki tasks raw/<prd>.md
codewiki status
```

## Human Approval Boundary

CodeWiki v1 is a deterministic scaffold/context/proposal generator. `ingest`, `query`, and `lint` print `PROPOSAL ONLY — no wiki files were modified without approval` and do not update `wiki/` content by default. Tests passing never auto-approves wiki writes; the agent proposes and the human approves.

## Scaffold

`codewiki init` creates:

- `.codewiki/config.yml`
- `.codewiki/templates/{entity,decision,lesson,issue,source-summary}.md`
- `.codewiki/adapters/{claude-code,codex,copilot,opencode}/`
- `raw/`
- `wiki/{index.md,log.md,entities,decisions,lessons,issues,sources}`

Use `--tool claude-code,codex,copilot,opencode` to select adapters. Unknown tools fail clearly. The CLI does not claim auto-detection unless a future implementation actually adds and tests it.

## Adapter Notes

Claude Code includes example hook wiring for file-write events only. Codex, Copilot, and OpenCode adapters are instruction-only in v1. Read-only tasks should use `codewiki query` explicitly; write tasks should read `wiki/index.md`, inspect matched pages, run tests, and ask for approval before wiki updates.

## V1 Non-Goals

No database, server, web UI, vector search, non-markdown ingestion, team workflow support, auto-verification, template migration CLI, or agent activity log ingestion is implemented in v1.
