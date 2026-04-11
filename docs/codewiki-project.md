> **SUPERSEDED** — This is CodeWiki v1. The canonical product spec is now
> [`docs/codewiki-project-v2.md`](./codewiki-project-v2.md). The v2 architecture
> is CLI-as-installer with all intelligence in markdown prompts; v1 described a
> runtime CLI that has since been removed. This file is kept for historical
> reference only.

# CodeWiki — Product Requirements Document

## 1. Problem Statement

AI coding agents (Claude Code, Codex, Copilot, OpenCode) operate statelessly. Every session starts from zero — the agent has no memory of what was tried before, what failed, what assumptions turned out wrong, or what gotchas exist in the codebase. This causes three recurring failures:

1. **Repeated mistakes.** The agent tries an approach that already failed in a previous session. Nobody told it.
2. **False confidence.** The agent assumes its code works. Tests may pass, but on human review ~80% of complex changes have subtle problems (e.g. Supabase Realtime with Presence edge cases). There's no mechanism to capture *why* something failed and prevent the same assumption next time.
3. **Knowledge evaporation.** Hard-won lessons — architectural decisions, integration quirks, environment-specific gotchas — live only in chat history that no future session can access.

RAG over docs doesn't solve this. It retrieves fragments but never synthesizes, never flags contradictions, never accumulates verified knowledge. Every query rediscovers from scratch.

## 2. Product Vision

**CodeWiki** is a framework that installs into any coding project and maintains a persistent, LLM-written wiki of verified project knowledge. It sits between the developer's raw docs and the AI agent, providing accumulated, cross-referenced, human-verified context that reduces hallucination and prevents repeated mistakes.

The wiki is a **compounding artifact** — it gets richer with every feature built, every bug fixed, every assumption proven wrong.

### Core Principles

- **Nothing enters the wiki without human confirmation.** The agent proposes; the human approves.
- **Multi-tool by design.** The wiki is the value, not the tool integration. Works with Claude Code, Codex, Copilot, OpenCode, or any tool that can read markdown and execute commands.
- **The wiki is just markdown files in the project.** No database, no server, no vendor lock-in. Browse in VS Code, grep in terminal, diff in git.
- **Global framework, local config.** Install once globally (`npx codewiki init`), config lives per-project.

## 3. Target User

Solo developers using AI coding agents on real projects. Developers who have experienced the pain of agents confidently producing broken code and want a systematic way to make agents smarter over time.

## 4. Architecture

### 4.1 Three Layers

```
┌─────────────────────────────────────────────┐
│  SCHEMA LAYER                               │
│  .codewiki/config.yml                       │
│  Tool-specific adapters (hooks, commands)    │
│  Wiki conventions and page templates         │
├─────────────────────────────────────────────┤
│  WIKI LAYER (LLM-written, human-approved)   │
│  wiki/index.md                              │
│  wiki/log.md                                │
│  wiki/entities/    (modules, services)      │
│  wiki/decisions/   (architectural ADRs)     │
│  wiki/lessons/     (verified learnings)     │
│  wiki/issues/      (known gotchas, traps)   │
│  wiki/sources/     (digested raw docs)      │
├─────────────────────────────────────────────┤
│  RAW LAYER (immutable, human-curated)       │
│  raw/                                       │
│  PRDs, architecture docs, epics, incidents  │
│  Any markdown the developer drops in        │
└─────────────────────────────────────────────┘
```

**Raw layer** — Immutable source documents. The LLM reads from here but never modifies. Markdown files only (v1).

**Wiki layer** — LLM-generated, human-approved markdown. The LLM creates pages, updates cross-references, and maintains consistency. The developer reads and approves; the LLM writes.

**Schema layer** — Configuration and conventions. Tells the LLM how the wiki is structured, what page types exist, what workflows to follow. Lives in `.codewiki/`. Includes tool-specific adapter files that translate CodeWiki operations into each tool's native format (Claude Code hooks, Copilot instructions, etc.).

### 4.2 Directory Structure (after `npx codewiki init`)

```
project-root/
├── .codewiki/
│   ├── config.yml              # Project-level config
│   ├── templates/              # Page templates for each wiki type
│   │   ├── entity.md
│   │   ├── decision.md
│   │   ├── lesson.md
│   │   ├── issue.md
│   │   └── source-summary.md
│   └── adapters/               # Generated per-tool configs
│       ├── claude-code/        # .claude/hooks + commands
│       ├── codex/              # AGENTS.md fragments
│       ├── copilot/            # .github/copilot-instructions.md
│       └── opencode/           # opencode config fragments
├── raw/                        # Immutable source documents
│   └── (user drops markdown here)
├── wiki/
│   ├── index.md                # Auto-maintained catalog of all pages
│   ├── log.md                  # Chronological record of all operations
│   ├── entities/               # One page per module/service/component
│   ├── decisions/              # Architectural Decision Records
│   ├── lessons/                # "We tried X, it failed because Y, fix was Z"
│   ├── issues/                 # Known gotchas, traps, agent pitfalls
│   └── sources/                # Digested summaries of raw docs
└── (rest of project)
```

### 4.3 Wiki Page Types

#### Entity Pages (`wiki/entities/`)
One per module, service, or major component. Contains: purpose, key files, dependencies, known issues (linked), relevant lessons (linked), current status.

```markdown
---
type: entity
name: auth-middleware
files: [src/auth/middleware.ts, src/auth/tokens.ts]
file_hashes:
  src/auth/middleware.ts: a1b2c3d4
  src/auth/tokens.ts: e5f6g7h8
linked_issues: [ISSUE-012, ISSUE-015]
linked_lessons: [LESSON-007]
last_updated: 2026-04-07
---
# auth-middleware

## Purpose
Handles JWT validation and role-based access for all API routes.

## Key Files
- `src/auth/middleware.ts` — Main middleware, applied globally
- `src/auth/tokens.ts` — Token generation and refresh logic

## Dependencies
- `jsonwebtoken` — JWT signing/verification
- `src/db/users.ts` — User role lookups

## Known Issues
- [[ISSUE-012]] — Exponential backoff breaks with 0ms base delay
- [[ISSUE-015]] — Token refresh race condition under concurrent requests

## Lessons Learned
- [[LESSON-007]] — Synchronous token validation causes timeouts; must be async
```

#### Decision Pages (`wiki/decisions/`)
Lightweight ADRs. Context, decision, consequences, status.

#### Lesson Pages (`wiki/lessons/`)
The core anti-hallucination mechanism. Structure:

```markdown
---
type: lesson
id: LESSON-007
related_files: [src/auth/middleware.ts]
related_entities: [auth-middleware]
verified: true
verified_by: human
date: 2026-04-07
---
# LESSON-007: Token validation must be async

## What happened
Agent implemented synchronous JWT validation in the request path.

## What went wrong
Under load, synchronous `jwt.verify()` blocked the event loop, causing 5s+ response times on all routes.

## The fix
Switched to `jwt.verify()` with callback / promisified version. Wrapped in try-catch for malformed tokens.

## Verification
Human confirmed: response times returned to <50ms under load test (k6, 100 concurrent users).

## Takeaway
NEVER use synchronous crypto operations in the request path. This applies to all middleware, not just auth.
```

#### Issue Pages (`wiki/issues/`)
Known problems, gotchas, traps. Issues are never moved or archived — they stay in place permanently. Resolved issues gain a `status: resolved` flag and a `resolved_by: LESSON-XXX` link in frontmatter. This preserves the full history and keeps wikilinks stable. The pre-hook surfaces both open *and* resolved issues for related files, because "this was a problem before and here's how it was solved" is exactly the context that prevents repeated mistakes.

#### Source Summary Pages (`wiki/sources/`)
Digested versions of raw documents. One page per raw source. Links to entities/decisions/issues that the source informed.

### 4.4 Special Files

**`wiki/index.md`** — Content-oriented catalog. Every page listed with link, one-line summary, and tags. Organized by type. The LLM reads this first when querying the wiki to find relevant pages. Updated on every ingest.

**`wiki/log.md`** — Chronological, append-only. Records every operation (ingest, query, verification, lint). Each entry uses a consistent format for parseability:

```markdown
## [2026-04-07T14:32] ingest | auth-middleware retry logic
- Files modified: entities/auth-middleware.md, lessons/LESSON-008.md
- Source: task context from feature/retry-logic
- Status: VERIFIED ✅
- Human note: "Confirmed backoff works with k6 load test"
```

## 5. Core Workflows

### 5.1 The Verification Loop (Primary Flow)

This is the main loop that runs during active development. It is the core mechanism for preventing hallucination.

**Hook trigger rule:** The pre-hook fires **only when the agent is about to modify files** — not on read-only actions like explaining code or answering questions. For read-only tasks where wiki context would help, the developer uses `codewiki query` explicitly. This keeps the default tight and avoids noise.

```
Developer: "implement retry logic in api-client.ts"
         │
         ▼
┌──── PRE-HOOK ────────────────────────────────────┐
│ 1. Read wiki/index.md                            │
│ 2. Find pages relevant to: api-client.ts, retry  │
│ 3. Read matched pages (issues, lessons, entities) │
│ 4. Inject into agent's task context:             │
│    "WIKI CONTEXT: ISSUE-012 says exponential     │
│     backoff breaks with 0ms base delay.          │
│     LESSON-007 says token ops must be async."    │
└──────────────────────────────────────────────────┘
         │
         ▼
   Agent codes WITH wiki context
   (aware of known pitfalls)
         │
         ▼
┌──── POST-HOOK ───────────────────────────────────┐
│ 1. Agent runs test suite                         │
│ 2. Agent summarizes:                             │
│    - What changed (files, logic)                 │
│    - What wiki context it used                   │
│    - Test results                                │
│ 3. STOP. Present to human:                       │
│    "Changes ready for review. Tests pass.        │
│     Used ISSUE-012 context. Approve? (y/n)"      │
└──────────────────────────────────────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
 Human: YES ✅       Human: NO ❌
    │                  │
    ▼                  ▼
┌─ SUCCESS PATH ─┐  ┌─ FAILURE PATH ──────────────────────┐
│ Agent proposes  │  │ 1. Agent queries wiki + code for    │
│ wiki updates:   │  │    related context (what else could │
│ - Update entity │  │    be affected? similar past fails?)│
│   page          │  │ 2. Agent proposes NEW strategy      │
│ - Create/update │  │    with evidence from wiki          │
│   lesson if new │  │ 3. Human confirms strategy          │
│   pattern       │  │ 4. Agent logs ISSUE page:           │
│ - Log entry ✅  │  │    "Attempted X, failed because Y"  │
│                 │  │ 5. Loop back to coding with new     │
│ Human confirms  │  │    strategy + issue context          │
│ wiki updates    │  │ 6. Log entry ❌                     │
└─────────────────┘  └─────────────────────────────────────┘
```

**Critical rule:** Wiki updates in both paths require human confirmation before being written. The agent proposes changes; the human approves the write.

### 5.2 Source Ingestion

When the developer adds a new document to `raw/`:

1. Developer: `codewiki ingest raw/api-redesign-prd.md`
2. Agent reads the source document.
3. Agent discusses key takeaways with the developer (optional, configurable).
4. Agent creates a source summary page in `wiki/sources/`.
5. Agent updates `wiki/index.md`.
6. Agent identifies affected entity/decision/issue pages and proposes updates.
7. Human reviews and approves each wiki update.
8. Agent appends to `wiki/log.md`.

A single source may touch 5-15 wiki pages. The developer stays in the loop.

### 5.3 PRD-to-Tasks Flow (Integrated from ai-dev-tasks)

CodeWiki integrates a structured PRD workflow for new features:

1. **Create PRD**: `codewiki prd "describe feature"` — agent generates a PRD in `raw/`, following the create-prd template. Human reviews and refines.
2. **Generate tasks**: `codewiki tasks raw/XXXX-prd-feature-name.md` — agent breaks PRD into granular tasks with sub-tasks. Output goes to a task file the agent can process step-by-step.
3. **Process tasks**: Agent works through tasks one at a time. Each task goes through the Verification Loop (§5.1). Human approves each step before the agent proceeds. Wiki accumulates knowledge as the feature is built.

This means the wiki doesn't just document what exists — it captures the *process* of building, including every failed attempt and corrected assumption along the way.

### 5.4 Wiki Query

Developer asks a question against the wiki:

1. Agent reads `wiki/index.md` to find relevant pages.
2. Agent reads matched pages.
3. Agent synthesizes an answer with references to wiki pages.
4. If the answer is valuable (a comparison, an analysis, a new connection), the developer can tell the agent to file it as a new wiki page. Explorations compound into the knowledge base.

### 5.5 Wiki Lint

Periodic health check: `codewiki lint`

The agent scans for:
- Contradictions between pages.
- Stale claims superseded by newer lessons.
- Orphan pages with no inbound links.
- Concepts mentioned but lacking their own page.
- Missing cross-references.
- Issues that might be resolved by recent lessons but not yet linked.
- Open issues with no activity.
- **File drift detection.** Entity pages store hashes of their referenced files in `file_hashes` frontmatter. Lint compares stored hashes against current file hashes. Divergence means the wiki may be stale — lint flags it as "entity `X` references files that changed since last wiki update — review needed." No static analysis or AST parsing; just file hashes catching 80% of drift with near-zero complexity.

Agent proposes fixes. Human approves.

## 6. Multi-Tool Support

The wiki is tool-agnostic — it's just markdown files. What changes per tool is *how* the pre/post hooks are wired and *how* commands are invoked.

### 6.1 Adapter Strategy

`npx codewiki init` detects which tools are present (or asks) and generates the appropriate adapter files:

| Tool | Pre-Hook Mechanism | Post-Hook Mechanism | Command Format |
|------|-------------------|--------------------|--------------------|
| **Claude Code** | `hooks` in `.claude/settings.json` (pre-tool, file-write events only) | `hooks` in `.claude/settings.json` (post-tool, file-write events only) | `/codewiki:ingest`, `/codewiki:query`, `/codewiki:lint` |
| **Codex** | Instructions in `AGENTS.md` ("before coding, read wiki/index.md...") | Instructions in `AGENTS.md` ("after changes, run tests and ask for approval...") | `codewiki ingest`, `codewiki query`, `codewiki lint` |
| **Copilot** | Instructions in `.github/copilot-instructions.md` | Instructions in `.github/copilot-instructions.md` | `/codewiki-ingest`, `/codewiki-query`, `/codewiki-lint` |
| **OpenCode** | Config-based instructions | Config-based instructions | `codewiki ingest`, `codewiki query`, `codewiki lint` |

Each adapter translates the same core workflows into the tool's native format. The wiki structure and content are identical regardless of which tool maintains them.

### 6.2 Adapter Contents

Each adapter includes:

- **System instructions** — injected into the tool's instruction mechanism. Tells the agent: "A project wiki exists at `wiki/`. Before modifying files, query the wiki for relevant issues and lessons related to those files. After changes, run tests, summarize what changed, and ask the human to approve before updating the wiki. For read-only tasks, use `codewiki query` if wiki context would help."
- **Command definitions** — mapped to the tool's command/slash-command system where available.
- **Hook wiring** — for tools that support programmatic hooks (Claude Code), actual hook configs that trigger wiki queries pre-tool and verification prompts post-tool.

## 7. CLI Interface

### 7.1 Global Commands (installed via npm)

```bash
npx codewiki init          # Scaffold wiki structure + adapters in current project
npx codewiki init --tool claude-code,copilot  # Only generate specific adapters
```

### 7.2 Project Commands (run from project root)

```bash
codewiki ingest <path>     # Ingest a raw source into the wiki
codewiki query "<question>" # Query the wiki
codewiki lint              # Health-check the wiki
codewiki prd "<description>" # Generate a PRD in raw/
codewiki tasks <prd-path>  # Generate task list from PRD
codewiki status            # Show wiki stats (page count, last update, open issues)
```

These commands are thin wrappers. They:
1. Read `.codewiki/config.yml` for project settings.
2. Assemble the relevant wiki context.
3. Construct a prompt with the operation instructions.
4. Pass to the active AI tool (or print instructions for manual execution).

## 8. Page Templates

Templates in `.codewiki/templates/` define the structure for each page type. The LLM follows these when creating new pages. Templates include:

- Required frontmatter fields (type, id, related_files, dates, verification status).
- Section structure with placeholder descriptions.
- Wikilink conventions (`[[PAGE-ID]]` for cross-references).
- Naming conventions (e.g., `LESSON-NNN`, `ISSUE-NNN`, `DEC-NNN`).

Templates are customizable. The developer can modify them to fit their project's needs, and the LLM will follow the updated structure.

## 9. Configuration (`config.yml`)

```yaml
# .codewiki/config.yml
version: 1

project:
  name: "my-project"
  description: "Brief project description for LLM context"

tools:
  - claude-code
  - copilot

wiki:
  path: wiki/           # Relative to project root
  raw_path: raw/        # Relative to project root

verification:
  require_human_approval: true      # Never auto-commit wiki changes
  require_tests: true               # Tests must pass before approval prompt
  auto_log: true                    # Automatically append to log.md

ingestion:
  interactive: true     # Agent discusses takeaways with human during ingest
  max_pages_per_ingest: 20  # Safety limit

lint:
  check_orphans: true
  check_contradictions: true
  check_stale_issues: true
  check_file_drift: true        # Compare entity file_hashes against current files
```

## 10. Success Metrics

For a solo developer using CodeWiki over 4+ weeks on an active project:

- **Reduction in repeated mistakes.** The same class of error should not recur after being captured as an issue/lesson.
- **Agent context quality.** Pre-hook wiki context should be relevant to the task >70% of the time.
- **Wiki growth.** The wiki should accumulate 2-5 pages per day of active development without becoming stale.
- **Human approval rate.** If the human is approving >90% of wiki updates without changes, the templates and conventions are well-calibrated.

## 11. What's Explicitly Out of Scope (v1)

- **Agent activity logs as source.** Not ingesting chat histories or agent session logs.
- **Non-markdown sources.** Only markdown files in `raw/`. No Notion, Confluence, Jira, Google Docs.
- **Embedding-based search.** v1 uses `wiki/index.md` as the discovery mechanism. This works for wikis up to ~200 pages. Vector search is a v2 concern.
- **Multi-user / team workflows.** v1 is solo developer only. No review assignments, no access control, no merge conflict resolution for wiki pages.
- **Auto-verification.** All wiki writes require human confirmation. No "auto-approve if tests pass."
- **Template migration tooling.** No `codewiki migrate` command in v1. Templates are still evolving; the LLM can read inconsistent page structures fine. Revisit when templates stabilize (~v2).
- **Web UI or custom viewer.** The wiki is browsed in the editor. No dashboard, no web app.

## 12. Design Decisions (Resolved)

1. **Hook granularity → File-modification only.** The pre-hook fires only when the agent is about to write/modify files. Read-only tasks use `codewiki query` explicitly. This avoids noise from injecting wiki context on every "explain this function" request. If developers find themselves querying manually too often, that's a signal to widen the hook in v2.

2. **Wiki page lifecycle → Stay in place, never archive.** Resolved issues gain `status: resolved` and `resolved_by: LESSON-XXX` in frontmatter but never move directories. Moving files breaks wikilinks, and broken links are the #1 way wikis rot. Resolved issues are *more* valuable than open ones — they're complete stories. Lint can filter by status for reporting.

3. **Template evolution → Skip for v1.** In v1 the developer is still figuring out what templates work. A migration tool is useful only after templates stabilize (~50-100 pages). The LLM can read pages with slightly different structures fine. If a developer wants consistency, they ask the agent to "update all issue pages to match the new template" in a single session — that's a lint task, not a CLI feature. Revisit in v2.

4. **Conflict between wiki and reality → Lightweight hash-based drift detection.** Entity pages store file hashes in `file_hashes` frontmatter. During `codewiki lint`, stored hashes are compared against current file hashes. Divergence flags a warning: "entity X references files that changed since last wiki update." No AST parsing, no semantic analysis — just file hashes catching 80% of drift with near-zero complexity. The developer decides whether to re-ingest or ignore.

5. **PRD integration → First-class commands, thin implementation.** `codewiki prd` and `codewiki tasks` are first-class commands, but they're just prompt templates that call the active AI tool. The PRD lands in `raw/`, tasks are a working file, and each task runs through the normal verification loop. If someone doesn't want the PRD workflow, they simply never call those commands — no plugin to uninstall, no config to disable.