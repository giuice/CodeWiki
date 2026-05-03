---
title: Opinionated CodeWiki Structure
created: 2026-05-03
status: draft
---

# PRD: Opinionated CodeWiki Structure

## 1. Introduction / Overview

CodeWiki currently installs a usable set of wiki files, skills, hooks, and agent instructions, but the generated project structure does not give a new user a clear operational map. Users can install CodeWiki in another project and still be unsure where to put sources, what the agent should read first, how raw material differs from synthesized wiki pages, and where PRD/task workflow artifacts belong.

This feature makes CodeWiki more opinionated at initialization time. The installed scaffold should create a self-explanatory wiki workspace centered on `wiki/`, with raw sources, schema, index, log, backlinks, and durable knowledge pages in predictable locations. Operational planning artifacts should move under `.codewiki/` so the project root stays focused on source code and the wiki stays focused on durable knowledge.

The goal is not to copy another implementation verbatim. The goal is to adopt the strongest structural lesson from Karpathy-style LLM wiki workflows and Hermes' `llm-wiki` skill: the agent and the human both need a small, stable directory map and a mandatory orientation ritual before ingesting, querying, linting, or absorbing knowledge.

## 2. Goals

- Give new users an obvious "where do I start?" path immediately after `codewiki init`.
- Make `wiki/` the single visible knowledge workspace that can be opened in Obsidian, VS Code, or any markdown editor.
- Move raw source material under `wiki/raw/` by default so sources and compiled knowledge live in the same vault.
- Add `wiki/SCHEMA.md` as the canonical project-specific wiki contract.
- Move PRD/task/process artifacts under `.codewiki/tasks/` by default to avoid polluting the project root.
- Update skills, generated instructions, templates, tests, and installer output so all tools agree on the same paths.
- Preserve compatibility with existing projects that already have `raw/`, `tasks/`, or older `.codewiki/config.yml` values.

## 3. User Stories

- As a developer installing CodeWiki in an existing codebase, I want the installer to create a clear folder structure so I know where to place raw docs and how to ask the agent to process them.
- As an AI agent operating in a CodeWiki project, I want a mandatory orientation checklist so I read the schema, index, and recent log before creating or updating pages.
- As a user who opens the wiki in Obsidian, I want `wiki/` to contain the full knowledge vault, including raw material and assets.
- As a maintainer, I want PRDs and task lists to live in `.codewiki/tasks/` so implementation planning artifacts do not clutter the project root.
- As an existing CodeWiki user, I want updates to respect my configured paths and avoid silently moving or deleting existing files.

## 4. Functional Requirements

1. `codewiki init` must scaffold `wiki/SCHEMA.md` for new installs.
2. `codewiki init` must scaffold these default directories for new installs:
   - `wiki/raw/articles/`
   - `wiki/raw/papers/`
   - `wiki/raw/transcripts/`
   - `wiki/raw/specs/`
   - `wiki/raw/assets/`
   - `wiki/entities/`
   - `wiki/decisions/`
   - `wiki/concepts/`
   - `wiki/comparisons/`
   - `wiki/lessons/`
   - `wiki/issues/`
   - `wiki/sources/`
   - `wiki/queries/`
   - `.codewiki/tasks/`
3. The generated `.codewiki/config.yml` must default to:
   ```yaml
   wiki:
     path: "wiki/"
     raw_path: "wiki/raw/"
     tasks_path: ".codewiki/tasks/"
   ```
4. The installer must stop creating root-level `raw/` and `tasks/` for new installs.
5. Existing projects must remain compatible when their config explicitly points to `raw/` or `tasks/`.
6. Generated basic instructions for Claude, Codex, Copilot, and OpenCode must explain:
   - CodeWiki is a persistent, human-reviewed markdown wiki, not query-time RAG.
   - Raw sources live under `wiki/raw/` by default and are immutable.
   - Durable wiki pages live under `wiki/`.
   - PRD/task workflow files live under `.codewiki/tasks/` by default.
   - Hooks assist with context and change signals but do not replace explicit ingest, query, absorb, lint, or human approval.
7. All wiki-facing skills must begin by resolving `.codewiki/config.yml` when present.
8. `codewiki-ingest` must use `wiki.raw_path` as the default raw source root and mention the default raw subdirectories.
9. `codewiki-query`, `codewiki-lint`, `codewiki-absorb`, and `codewiki-breakdown` must use `wiki.path` rather than hardcoding `wiki/` in their operational steps.
10. Every wiki-facing skill must require orientation before work:
    - read `SCHEMA.md` from the resolved wiki path when it exists
    - read `index.md`
    - read recent `log.md`
    - read `_backlinks.json` when relevant
11. `codewiki-prd`, `codewiki-tasks`, and `codewiki-process` must continue resolving `wiki.tasks_path`, now defaulting to `.codewiki/tasks/`.
12. The scaffolded `wiki/SCHEMA.md` must define:
    - purpose of `raw/` vs wiki pages
    - naming conventions
    - required index/log maintenance
    - human approval boundary
    - page categories
    - contradiction handling
    - source immutability
13. The post-install report must include concise "Next steps" explaining how to add a source and which skills to invoke.
14. Tests must cover new scaffold paths, config defaults, instruction text, and skill path references.

## 5. Non-Goals

- Do not build a search index or vector database.
- Do not implement automatic migration or deletion of existing `raw/` or `tasks/` directories.
- Do not remove support for existing config paths.
- Do not make wiki writes automatic; human approval remains required.
- Do not redesign the full page taxonomy beyond the default structure needed for orientation.
- Do not implement `codewiki-tasks` or `codewiki-process` behavior changes beyond path defaults and documentation alignment.

## 6. Design Considerations

The default structure should be simple enough to understand from `ls wiki`:

```text
wiki/
  SCHEMA.md
  index.md
  log.md
  _backlinks.json
  raw/
    articles/
    papers/
    transcripts/
    specs/
    assets/
  entities/
  decisions/
  concepts/
  comparisons/
  lessons/
  issues/
  sources/
  queries/
.codewiki/
  config.yml
  templates/
  hooks/
  tasks/
```

The installer should not overwhelm users with long explanations. It should print a short next-step block after the normal file report:

```text
Next steps:
1. Put source docs in wiki/raw/articles/ or wiki/raw/specs/
2. Ask your agent to use codewiki-ingest on the source file
3. Ask wiki-grounded questions with codewiki-query
4. After substantial code work, run codewiki-absorb
```

The generated `SCHEMA.md` should be a durable contract for the agent, not a tutorial. Basic instructions can summarize the contract, while `SCHEMA.md` carries the detailed operational rules.

## 7. Technical Considerations

- Update `src/templates/scaffold.ts` to create the new directory structure.
- Update `src/templates/page-templates.ts`:
  - change config defaults
  - add a `schemaTemplate`
  - update `sourceSummaryTemplate.raw_source` from `raw/example.md` to `wiki/raw/example.md` or a more specific default
  - add index sections for `Concepts`, `Comparisons`, and `Queries`
- Update all generated instruction templates:
  - `src/templates/claude/instructions.md`
  - `src/templates/codex/instructions.md`
  - `src/templates/copilot/instructions.md`
  - `src/templates/opencode/instructions.md`
- Update wiki-facing skill templates to resolve config paths instead of hardcoding defaults:
  - `codewiki-ingest`
  - `codewiki-query`
  - `codewiki-lint`
  - `codewiki-absorb`
  - `codewiki-breakdown`
- Update planning skill templates:
  - `codewiki-prd`
  - `codewiki-tasks`
  - `codewiki-process`
- Update updater/verifier agent templates so they mention the new categories and read `SCHEMA.md`.
- Update tests under `src/lib/__tests__`, `src/templates/__tests__`, and command tests that assert scaffolded directories or instruction content.
- Consider whether old root-level `raw/` references in README files should be changed in the same work or a follow-up documentation task.

Backward compatibility rule: if `.codewiki/config.yml` exists and declares `wiki.raw_path` or `wiki.tasks_path`, skills must honor those values. The scaffold default changes only affect new installs or explicit update flows that replace config.

## 8. Success Metrics

- A fresh `codewiki init` creates no root-level `raw/` or `tasks/` directory.
- A fresh `codewiki init` creates `wiki/SCHEMA.md`, `wiki/raw/...`, and `.codewiki/tasks/`.
- All tests pass after updating expected paths.
- Searching generated templates for `raw/` and `tasks/` shows no stale root-default guidance except compatibility notes.
- A user can read the post-install output and know exactly where to put a first source and what command/skill to ask for next.
- An agent reading the generated instructions knows to orient through `SCHEMA.md`, `index.md`, and `log.md` before operating.

## 9. Open Questions

- Should update mode create the new `wiki/raw/` and `.codewiki/tasks/` directories even if an older project already has root-level `raw/` and `tasks/`?
- Should `codewiki init` ever migrate files from `raw/` to `wiki/raw/`, or only report a manual migration suggestion?
- Should `wiki/sources/` remain as source summaries while `wiki/raw/` holds immutable raw sources, or should the naming be clearer?
- Should the installer print a compatibility warning when it detects root-level `raw/` or `tasks/` without matching config?
- Should `SCHEMA.md` be replaced on update via marker blocks, skipped if present, or merged with a CodeWiki-managed section?
