# CodeWiki — Product Requirements Document (v2)

## Changelog from v1

- **Architecture rewrite.** The CLI is now a scaffolder/installer only (like GSD). All intelligence lives in markdown prompts, slash commands, hooks, and agents that the AI tool executes natively. The CLI runs zero application logic at runtime.
- **Multi-tool support updated.** All four tools (Claude Code, Codex, Copilot, OpenCode) now support hooks natively. Adapter strategy updated with accurate config formats.
- **PRD/Tasks/Process prompts.** First-class slash commands adapted from the original prompts in `docs/prompts/`, not thin CLI wrappers.
- **CLI commands removed.** `codewiki ingest`, `codewiki query`, `codewiki lint`, `codewiki prd`, `codewiki tasks`, `codewiki status` are no longer CLI commands that run TypeScript logic. They become slash commands/skills inside the AI tools.
- **Section 7 (CLI Interface) rewritten.** The CLI has exactly one command: `init`.

---

## 1. Problem Statement

AI coding agents (Claude Code, Codex, Copilot, OpenCode) operate statelessly. Every session starts from zero — the agent has no memory of what was tried before, what failed, what assumptions turned out wrong, or what gotchas exist in the codebase. This causes three recurring failures:

1. **Repeated mistakes.** The agent tries an approach that already failed in a previous session. Nobody told it.
2. **False confidence.** The agent assumes its code works. Tests may pass, but on human review ~80% of complex changes have subtle problems (e.g. Supabase Realtime with Presence edge cases). There's no mechanism to capture *why* something failed and prevent the same assumption next time.
3. **Knowledge evaporation.** Hard-won lessons — architectural decisions, integration quirks, environment-specific gotchas — live only in chat history that no future session can access.

RAG over docs doesn't solve this. It retrieves fragments but never synthesizes, never flags contradictions, never accumulates verified knowledge. Every query rediscovers from scratch.

## 2. Product Vision

**CodeWiki** is a framework that installs into any AI coding tool and maintains a persistent, LLM-written wiki of verified project knowledge. It sits between the developer's raw docs and the AI agent, providing accumulated, cross-referenced, human-verified context that reduces hallucination and prevents repeated mistakes.

The wiki is a **compounding artifact** — it gets richer with every feature built, every bug fixed, every assumption proven wrong.

### Core Principles

- **Nothing enters the wiki without human confirmation.** The agent proposes; the human approves.
- **Multi-tool by design.** The wiki is the value, not the tool integration. Works with Claude Code, Codex, Copilot, OpenCode, or any tool that can read markdown and execute commands.
- **The wiki is just markdown files in the project.** No database, no server, no vendor lock-in. Browse in VS Code, grep in terminal, diff in git.
- **The CLI is just an installer.** `npx codewiki init` scaffolds the wiki structure and installs hooks, commands, and agents into your AI tool. The CLI runs zero logic at runtime — the AI tool does all the work.
- **Prompt-native.** All intelligence lives in markdown prompt files (slash commands, agents, hooks). The AI tool reads these natively. No TypeScript middleware between the agent and the wiki.

## 3. Target User

Solo developers using AI coding agents on real projects. Developers who have experienced the pain of agents confidently producing broken code and want a systematic way to make agents smarter over time.

## 4. Architecture

### 4.1 Two Layers (Runtime)

```
┌─────────────────────────────────────────────┐
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

### 4.2 Installed Config (per-tool, created by `init`)

```
┌─────────────────────────────────────────────┐
│  TOOL INTEGRATION (installed by init)       │
│                                             │
│  Hooks ─── pre-tool: inject wiki context    │
│        └── post-tool: verification prompt   │
│                                             │
│  Commands/Skills ─── /codewiki-ingest       │
│                  ├── /codewiki-query         │
│                  ├── /codewiki-lint          │
│                  ├── /codewiki-absorb        │
│                  ├── /codewiki-breakdown     │
│                  ├── /codewiki-prd           │
│                  ├── /codewiki-tasks         │
│                  └── /codewiki-process       │
│                                             │
│  Agents ─── codewiki-wiki-updater           │
│         └── codewiki-verifier               │
│                                             │
│  Instructions ─── CLAUDE.md / AGENTS.md /   │
│                   copilot-instructions.md   │
└─────────────────────────────────────────────┘
```

### 4.3 Directory Structure (after `npx codewiki init`)

The exact files depend on the `--tool` flag. Example for Claude Code:

```
project-root/
├── .claude/
│   ├── settings.json              # Tool-specific hook wiring
│   ├── commands/
│   │   └── codewiki/
│   │       ├── ingest.md          # /codewiki-ingest slash command
│   │       ├── query.md           # /codewiki-query slash command
│   │       ├── lint.md            # /codewiki-lint slash command
│   │       ├── absorb.md          # /codewiki-absorb slash command
│   │       ├── breakdown.md       # /codewiki-breakdown slash command
│   │       ├── prd.md             # /codewiki-prd slash command
│   │       ├── tasks.md           # /codewiki-tasks slash command
│   │       └── process.md         # /codewiki-process slash command
│   └── agents/
│       ├── codewiki-wiki-updater.md
│       └── codewiki-verifier.md
├── .codewiki/
│   ├── config.yml                 # Project-level config
│   ├── templates/                 # Page templates for each wiki type
│   │   ├── entity.md
│   │   ├── decision.md
│   │   ├── lesson.md
│   │   ├── issue.md
│   │   └── source-summary.md
│   └── hooks/                     # Hook scripts (shared across tools)
│       ├── pre-wiki-context.sh    # Reads wiki/index.md, finds relevant pages
│       ├── post-verify.sh         # Emits structured change context for wiki updates
│       └── session-end.sh         # Summarizes session work for absorb
├── raw/                           # Immutable source documents
│   └── (user drops markdown here)
├── wiki/
│   ├── index.md                   # Auto-maintained catalog of all pages
│   ├── log.md                     # Chronological record of all operations
│   ├── _backlinks.json            # Reverse link index for importance ranking
│   ├── entities/
│   ├── decisions/
│   ├── lessons/
│   ├── issues/
│   └── sources/
├── CLAUDE.md                      # (appended) CodeWiki instructions
└── (rest of project)
```

For Codex, `AGENTS.md` is used instead of `CLAUDE.md`, commands go to `.codex/commands/`, hooks to `.codex/hooks.json`, etc.

### 4.4 Wiki Page Types

(Unchanged from v1 — see entity, decision, lesson, issue, source-summary templates in §8.)

#### Entity Pages (`wiki/entities/`)
One per module, service, or major component. Contains: purpose, key files, dependencies, known issues (linked), relevant lessons (linked), current status. Stores file hashes in `file_hashes` frontmatter for drift detection.

#### Decision Pages (`wiki/decisions/`)
Lightweight ADRs. Context, decision, consequences, status.

#### Lesson Pages (`wiki/lessons/`)
The core anti-hallucination mechanism. What happened, what went wrong, the fix, verification evidence, takeaway.

#### Issue Pages (`wiki/issues/`)
Known problems, gotchas, traps. Never moved or archived — resolved issues gain `status: resolved` and `resolved_by: LESSON-XXX` in frontmatter.

#### Source Summary Pages (`wiki/sources/`)
Digested versions of raw documents. One page per raw source.

### 4.5 Special Files

**`wiki/index.md`** — Content-oriented catalog. Every page listed with link, one-line summary, and tags. The agent reads this first when querying the wiki. Updated on every ingest.

**`wiki/log.md`** — Chronological, append-only. Records every operation (ingest, query, verification, lint).

**`wiki/_backlinks.json`** — Reverse-link index used to rank important topics, detect orphan pages, and drive breakdown/query/lint prioritization. Updated whenever ingest, absorb, or lint changes the wiki graph.

## 5. Core Workflows

### 5.0 Recommended Developer Workflow

For day-to-day use, developers should follow this order:

1. Run `npx codewiki init` once to scaffold the wiki, prompts, hooks, and tool-specific instructions.
2. Add existing project material to `raw/` and run `/codewiki-ingest` until the wiki reflects the current project state.
3. For net-new work, use `/codewiki-prd` and then `/codewiki-tasks` before writing code.
4. Implement through `/codewiki-process` so task progression, tests, commits, pre-hook context injection, and post-verify wiki proposals stay in one loop.
5. Review every wiki proposal from the post-verify flow before allowing writes to `wiki/`.
6. At session end, rely on `session-end.sh` or run `/codewiki-absorb` manually to capture durable lessons from the recent diff.
7. Use `/codewiki-breakdown`, `/codewiki-lint`, and `/codewiki-query` as the ongoing maintenance loop between features.

### 5.1 The Verification Loop (Primary Flow)

This is the main loop. It runs via hooks — no CLI invocation needed.

**Hook trigger rule:** The pre-hook fires **only when the agent is about to modify files** — not on read-only actions.

```
Developer: "implement retry logic in api-client.ts"
         │
         ▼
┌──── PRE-HOOK (automatic) ───────────────────────┐
│ Hook script reads wiki/index.md                  │
│ Finds pages relevant to modified files           │
│ Outputs wiki context to stdout                   │
│ Agent receives it as tool-use context            │
│ "WIKI CONTEXT: ISSUE-012 says exponential        │
│  backoff breaks with 0ms base delay."            │
└──────────────────────────────────────────────────┘
         │
         ▼
   Agent codes WITH wiki context
         │
         ▼
┌──── POST-HOOK (automatic) ──────────────────────┐
│ Hook script detects wiki-relevant changes and    │
│ triggers the wiki-updater agent with change      │
│ context. The agent proposes concrete wiki edits  │
│ (new lessons, entity updates, issue tracking).   │
└──────────────────────────────────────────────────┘
         │
         ▼
   Wiki-updater agent proposes specific updates
         │
    ┌────┴─────────────┐
    │                  │
 Approve ✅         Reject ❌
    │                  │
    ▼                  ▼
 Agent writes       Agent creates
 wiki updates       ISSUE page
 (human confirms)   documenting failure
```

### 5.2 The Auto-Improvement Engine (Compounding Loop)

The verification loop captures knowledge reactively (when files change). The auto-improvement engine captures knowledge **proactively** — it finds gaps, extracts patterns, and strengthens the wiki without waiting for a specific code change.

#### 5.2.1 Absorb (`/codewiki-absorb`)

After a coding session (or on demand), the agent reviews recent changes and extracts durable knowledge:

1. Reads `git diff` or recent commits to understand what changed.
2. Reads `wiki/index.md` and `wiki/_backlinks.json` to understand current wiki state.
3. Identifies new entities, lessons, decisions, or issues implied by the changes.
4. Cross-references against existing wiki pages to avoid duplication.
5. Proposes concrete wiki updates (new pages, enriched existing pages, new cross-links).
6. Human approves each proposed change.
7. Updates `wiki/_backlinks.json` after all changes are applied.

This is the **compounding loop**: every session leaves the wiki richer for the next session.

#### 5.2.2 Breakdown (`/codewiki-breakdown`)

Proactive gap-finding. The agent scans the wiki for referenced-but-undocumented entities:

1. Reads all wiki pages and `wiki/_backlinks.json`.
2. Identifies entities mentioned in 2+ pages that have no dedicated wiki page.
3. Identifies pages with zero inbound links (orphans).
4. Ranks candidates by reference count (most-referenced gaps first).
5. Proposes new pages for the top candidates, with content drawn from existing mentions.
6. Human approves each new page.

#### 5.2.3 Backlink Index (`wiki/_backlinks.json`)

A reverse-link map tracking which wiki pages reference each other. Maintained automatically by `absorb`, `ingest`, and `lint`. Structure:

```json
{
  "entities/api-client": ["lessons/retry-backoff", "issues/timeout-bug", "decisions/http-library"],
  "lessons/retry-backoff": ["entities/api-client"]
}
```

High-backlink pages indicate important entities. The breakdown command uses this to prioritize gap-filling.

#### 5.2.4 Session-End Hook

A hook that fires when the AI tool session ends (or on `SessionEnd` / `session_completed` events). It:

1. Summarizes what was accomplished in the session.
2. Emits a lightweight session summary that the tool can hand to `/codewiki-absorb` or an equivalent absorb flow.
3. Proposes wiki updates for any new knowledge worth capturing.

This ensures knowledge capture happens even when the developer forgets to run `/codewiki-absorb` manually.

### 5.3 Source Ingestion (`/codewiki-ingest`)

Slash command, not CLI. The agent:
1. Reads the raw source document.
2. Discusses key takeaways with the developer.
3. Creates a source summary page in `wiki/sources/`.
4. Updates `wiki/index.md` and `wiki/_backlinks.json`.
5. Identifies affected entity/decision/issue pages and proposes updates.
6. Human reviews and approves each wiki update.
7. Agent appends to `wiki/log.md`.

### 5.4 PRD-to-Tasks Flow

Three slash commands adapted from the original prompts:

1. **`/codewiki-prd`** — Agent asks clarifying questions, generates a PRD in `tasks/`, following the create-prd prompt template. Human reviews and refines. (Adapted from `docs/prompts/create-prd.md`)

2. **`/codewiki-tasks`** — Agent analyzes PRD + codebase, generates parent tasks (waits for "Go"), then generates sub-tasks with checklist format. Output goes to `/tasks/tasks-[prd-name].md`. (Adapted from `docs/prompts/generate-tasks.md`)

3. **`/codewiki-process`** — Agent works through tasks one sub-task at a time. Marks `[x]` on completion, runs tests when parent task is done, commits with conventional commits, pauses for user approval between each sub-task. Each task goes through the Verification Loop (§5.1). (Adapted from `docs/prompts/process-task-list.md`)

### 5.5 Wiki Query (`/codewiki-query`)

Slash command. Agent reads `wiki/index.md` and `wiki/_backlinks.json`, finds relevant pages (prioritizing high-backlink pages), synthesizes an answer with references. If the answer is valuable, the agent files it back into the wiki as a new page or enriches an existing one (with human approval). This **output filing** ensures every question makes the next answer better.

### 5.6 Wiki Lint (`/codewiki-lint`)

Slash command. The agent scans for:
- Contradictions between pages.
- Stale claims superseded by newer lessons.
- Orphan pages with no inbound links (using `_backlinks.json`).
- Missing cross-references.
- File drift (entity `file_hashes` vs current files).
- Open issues with no activity.
- **Anti-cramming check**: articles over 120 lines that should be split.
- **Anti-thinning check**: stub pages (<15 lines) that should be enriched or merged.
- **Structural audit**: articles organized by date instead of theme (diary-driven vs narrative).

Agent proposes fixes. Human approves. Rebuilds `wiki/_backlinks.json` after changes.

## 6. Multi-Tool Support

### 6.1 What `init` Installs Per Tool

All four tools now support hooks, commands, and instructions natively:

| Tool | Hooks | Commands/Skills | Instructions | Agents |
|------|-------|----------------|--------------|--------|
| **Claude Code** | `.claude/settings.json` — `PreToolUse`/`PostToolUse` on `Write\|Edit` | `.claude/commands/codewiki/*.md` | Appends to `CLAUDE.md` | `.claude/agents/codewiki-*.md` |
| **Codex** | `.codex/hooks.json` — lifecycle hooks | `.codex/commands/codewiki/*.md` or slash commands | Appends to `AGENTS.md` | `.codex/agents/codewiki-*.md` (if supported) |
| **Copilot** | `.github/hooks/codewiki-*.json` — `preToolUse`/`postToolUse` | Slash commands via custom agents | Appends to `.github/copilot-instructions.md` | Custom agent definitions |
| **OpenCode** | `opencode.json` `experimental.hooks` — `file_edited` | `.opencode/commands/codewiki/*.md` | Appends to `AGENTS.md` (OpenCode reads it) | `.opencode/agents/codewiki-*.md` |

### 6.2 Adapter Contents

Each adapter installs:

- **Hook scripts** — Shell scripts in `.codewiki/hooks/` that are referenced by the tool's hook config. Shared across tools; the tool-specific config just points to them.
- **Slash commands** — Markdown prompt files placed in the tool's native command directory. Same prompt content, adapted path.
- **System instructions** — Appended to the tool's instruction file (CLAUDE.md, AGENTS.md, copilot-instructions.md). Tells the agent about the wiki, the verification loop, and how to use the slash commands.
- **Agents** (where supported) — Subagent definitions for wiki-updater and verifier workflows.

### 6.3 Tool Auto-Detection

`codewiki init` (without `--tool`) detects which tools are present by checking for:
- `.claude/` directory or `CLAUDE.md` → Claude Code
- `.codex/` directory or `AGENTS.md` with Codex markers → Codex
- `.github/copilot-instructions.md` or `.github/` directory → Copilot
- `opencode.json` or `.opencode/` directory → OpenCode

If none detected, prompts the user to choose. `--tool claude-code,codex` overrides detection.

## 7. CLI Interface

### 7.1 The Only CLI Command

```bash
npx codewiki init                              # Auto-detect tools, scaffold everything
npx codewiki init --tool claude-code,copilot   # Only install for specific tools
npx codewiki init --name my-project            # Set project name
npx codewiki init --force                      # Overwrite existing files
```

That's it. The CLI does one thing: install CodeWiki into your project.

### 7.2 What `init` Does

1. Creates `.codewiki/config.yml` with project settings.
2. Creates `.codewiki/templates/` with page templates.
3. Creates `.codewiki/hooks/` with shared hook scripts.
4. Creates `raw/` directory for source documents.
5. Creates `wiki/` directory structure with `index.md`, `log.md`, and `_backlinks.json`.
6. Creates `tasks/` directory for PRD and task files.
7. **Per tool:** installs hooks, commands, agents, and system instructions into the tool's native locations.
8. Reports what was installed.

### 7.3 Why No Runtime CLI

The original v1 had `codewiki ingest`, `codewiki query`, `codewiki lint`, etc. as CLI commands that ran TypeScript logic (parsing wiki pages, matching terms, rendering proposals). This was wrong because:

- It reimplements what the AI tool already does natively (read markdown, find relevant content, synthesize answers).
- It adds a middleware layer between the agent and the wiki, losing the AI's ability to reason about context.
- It can't do the interactive parts (ask clarifying questions, propose wiki updates, wait for human approval) — those require the AI tool's conversation loop.

The slash commands are pure markdown prompts. The AI tool reads them and executes the workflow natively. The wiki is just markdown files the agent can read and write directly.

## 8. Page Templates

(Unchanged from v1. Templates live in `.codewiki/templates/`.)

## 9. Configuration (`config.yml`)

```yaml
# .codewiki/config.yml
version: 2

project:
  name: "my-project"
  description: "Brief project description for LLM context"

tools:
  - claude-code
  - copilot

wiki:
  path: wiki/
  raw_path: raw/
  tasks_path: tasks/

verification:
  require_human_approval: true
  require_tests: true
  auto_log: true

lint:
  check_orphans: true
  check_contradictions: true
  check_stale_issues: true
  check_file_drift: true
```

## 10. Success Metrics

(Unchanged from v1.)

## 11. What's Explicitly Out of Scope (v1)

(Unchanged from v1, plus:)

- **Runtime CLI logic.** The CLI does not parse wiki pages, match terms, or render proposals. That's the AI tool's job.
- **Custom LLM calls.** The CLI does not call any LLM API. All AI work happens inside the AI coding tool.
- **Autonomous wiki writes.** The agent always proposes; the human always approves. Even the auto-improvement engine (absorb, breakdown, session-end) goes through the human approval gate.

## 12. Design Decisions (Resolved)

1. **CLI = installer only.** The CLI scaffolds files and installs tool configs. All intelligence lives in markdown prompts that the AI tool executes. This follows the GSD pattern: the value is in the prompts and wiki, not in the CLI binary.

2. **Hook granularity → File-modification only.** (Unchanged from v1.)

3. **Wiki page lifecycle → Stay in place, never archive.** (Unchanged from v1.)

4. **Template evolution → Skip for v1.** (Unchanged from v1.)

5. **File drift → Lightweight hash-based detection.** (Unchanged from v1.)

6. **PRD integration → Slash commands from original prompts.** The three prompts (`create-prd.md`, `generate-tasks.md`, `process-task-list.md`) become slash commands installed by `init`. They preserve the original prompt's interaction model (clarifying questions, "Go" confirmation, one-sub-task-at-a-time).

7. **Shared hook scripts.** Hook scripts live in `.codewiki/hooks/` and are referenced by each tool's config. This avoids duplicating shell logic per tool. The tool-specific config (`.claude/settings.json`, `.codex/hooks.json`, etc.) just points to the shared scripts.

8. **Auto-improvement engine → Separate commands, not unified skill.** The absorb, breakdown, and lint commands are separate slash commands rather than subcommands of a single skill. This keeps each command's token footprint small — the AI tool only loads the prompt it needs. Inspired by Farzaa's wiki skill pattern but adapted for token efficiency.

9. **Backlink index → JSON file, not computed on the fly.** `wiki/_backlinks.json` is a pre-computed reverse-link map maintained by absorb/ingest/lint. This avoids scanning all wiki pages on every query — the agent reads one file to find high-importance pages. Inspired by Farzaa's `_backlinks.json` pattern.

10. **Post-hook → Active trigger, not passive reminder.** The post-hook triggers the wiki-updater agent with change context rather than just printing a reminder. The human approval gate stays (the agent proposes, human approves), but the trigger is automatic. This is the key difference from the v2 original design — the system is active, not passive.

11. **Anti-cramming / anti-thinning rules in lint.** Borrowed from Farzaa's wiki skill: articles over 120 lines should be split, stubs under 15 lines should be enriched or merged, and articles organized chronologically should be restructured by theme. These quality checks prevent the wiki from degrading over time.
