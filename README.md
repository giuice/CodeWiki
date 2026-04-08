# CodeWiki

CodeWiki is a framework that installs into any AI coding tool and maintains a persistent, LLM-written wiki of verified project knowledge.

Run `npx codewiki init` once — the CLI scaffolds a wiki structure and installs slash commands, hook scripts, and agent definitions into your AI tool. All intelligence (reading wiki, proposing updates, human approval loops) lives in markdown prompt files that the AI tool executes natively. The CLI itself runs zero application logic at runtime.

The result is a compounding knowledge base of decisions, lessons, issues, source summaries, and entity pages that future sessions of Claude Code, Codex, Copilot, or OpenCode can use — so every session starts smarter than the last.

## How it works

The core rule:

> The agent proposes; the human approves; only approved knowledge enters `wiki/`.

### The full developer workflow

```mermaid
flowchart TD
  Init["<b>1. SETUP</b><br/>npx codewiki init"] --> Feed

  subgraph Feed["<b>2. FEED KNOWLEDGE</b>"]
    direction LR
    F1["Drop docs into raw/"] --> F2["/codewiki-ingest<br/>Agent digests source → proposes<br/>wiki pages (you approve)"]
  end

  Feed --> Plan

  subgraph Plan["<b>3. PLAN A FEATURE</b>"]
    direction LR
    P1["/codewiki-prd<br/>Describe idea → agent asks<br/>clarifying questions → drafts PRD"] --> P2["/codewiki-tasks<br/>Agent reads PRD + codebase →<br/>generates task checklist"]
  end

  Plan --> Build

  subgraph Build["<b>4. BUILD (task by task)</b>"]
    direction TB
    B1["/codewiki-process<br/>Agent picks next sub-task"] --> B2["Pre-hook auto-injects<br/>wiki context before edits"]
    B2 --> B3["Agent codes with<br/>known lessons + issues"]
    B3 --> B4["Agent runs tests,<br/>commits with conventional commits"]
    B4 --> B5["Post-hook reminds<br/>about wiki updates"]
    B5 --> B6{"You approve?"}
    B6 -- "Yes" --> B7["Agent proposes wiki updates<br/>(lessons, entities, issues)"]
    B7 --> B8{"You approve<br/>wiki update?"}
    B8 -- "Yes" --> B9["Wiki grows smarter"]
    B8 -- "No" --> B10["Proposal discarded"]
    B6 -- "No" --> B11["Agent creates issue/lesson<br/>documenting failure"]
    B11 --> B1
    B9 --> B1
    B10 --> B1
  end

  Build --> Maintain

  subgraph Maintain["<b>5. MAINTAIN</b>"]
    direction LR
    M1["/codewiki-query<br/>Ask questions against<br/>accumulated wiki"] --> M2["/codewiki-lint<br/>Health-check: broken links,<br/>contradictions, stale claims"]
  end

  Maintain -->|"Next session starts<br/>smarter than the last"| Feed

  style Init fill:#2d6a4f,color:#fff
  style Feed fill:#1a3a5c,color:#fff
  style Plan fill:#4a2c6a,color:#fff
  style Build fill:#6a3b2d,color:#fff
  style Maintain fill:#3a5c1a,color:#fff
```

**Step by step:**

1. **Setup** — Run `npx codewiki init` once. It scaffolds the wiki and installs hooks, slash commands, and agents into your AI tool.
2. **Feed knowledge** — Drop existing docs (PRDs, architecture notes, incident reports) into `raw/` and run `/codewiki-ingest` to digest them into wiki pages. The agent proposes; you approve.
3. **Plan a feature** — Run `/codewiki-prd` with a feature idea. The agent asks clarifying questions and drafts a PRD. Then `/codewiki-tasks` generates a task breakdown with a checklist.
4. **Build** — Run `/codewiki-process`. The agent works through tasks one sub-task at a time. Hooks automatically inject wiki context before edits and prompt for verification after. Every task goes through the human approval loop — both for code and for wiki updates.
5. **Maintain** — Use `/codewiki-query` to ask questions against accumulated knowledge. Run `/codewiki-lint` to catch broken links, contradictions, and stale claims.

The wiki compounds over time. Every session starts with the full history of what worked, what failed, and why.

## Architecture

```mermaid
flowchart TB
  subgraph Raw[Raw layer: human-curated source of truth]
    R1[raw/*.md<br/>PRDs, notes, incidents, specs]
  end

  subgraph Wiki[Wiki layer: LLM-written, human-approved]
    W1[wiki/index.md — catalog]
    W2[wiki/log.md — chronology]
    W3[wiki/entities/]
    W4[wiki/decisions/]
    W5[wiki/lessons/]
    W6[wiki/issues/]
    W7[wiki/sources/]
  end

  subgraph ToolIntegration[Tool integration layer: installed by init]
    H1[Hooks<br/>pre-wiki-context.sh · post-verify.sh]
    SC[Slash Commands<br/>ingest · query · lint · prd · tasks · process]
    AG[Agents<br/>wiki-updater · verifier]
    SI[System Instructions<br/>CLAUDE.md / AGENTS.md / copilot-instructions.md]
  end

  R1 -->|/codewiki-ingest| W7
  W1 -->|pre-hook context| ToolIntegration
  ToolIntegration -->|proposal only| Review[Human review]
  Review -->|approved| Wiki
```

### Generated project layout

After `codewiki init`, a project gets:

```text
project-root/
├── .codewiki/
│   ├── config.yml                    # Project-level config
│   ├── templates/                    # Page templates for wiki entries
│   │   ├── entity.md
│   │   ├── decision.md
│   │   ├── lesson.md
│   │   ├── issue.md
│   │   └── source-summary.md
│   └── hooks/                        # Shared hook scripts
│       ├── pre-wiki-context.sh       # Injects wiki context before file edits
│       └── post-verify.sh            # Verification reminder after changes
├── raw/                              # Immutable human-curated source documents
├── wiki/
│   ├── index.md                      # Auto-maintained catalog of all pages
│   ├── log.md                        # Chronological record of all operations
│   ├── entities/
│   ├── decisions/
│   ├── lessons/
│   ├── issues/
│   └── sources/
└── (tool-specific files below)
```

Plus tool-specific files depending on `--tool`. For example, Claude Code gets:

```text
.claude/
├── settings.json                     # PreToolUse + PostToolUse hooks
├── commands/codewiki/
│   ├── ingest.md                     # /codewiki-ingest slash command
│   ├── query.md                      # /codewiki-query
│   ├── lint.md                       # /codewiki-lint
│   ├── prd.md                        # /codewiki-prd
│   ├── tasks.md                      # /codewiki-tasks
│   └── process.md                    # /codewiki-process
└── agents/
    ├── codewiki-wiki-updater.md      # Proposes wiki updates
    └── codewiki-verifier.md          # Validates wiki changes
CLAUDE.md                            # (appended) CodeWiki instructions
```

- `raw/` contains immutable, human-curated markdown sources.
- `wiki/` contains synthesized project knowledge — written only after human approval.
- `.codewiki/` contains config, templates, and shared hook scripts.
- Tool-specific directories (`.claude/`, `.codex/`, `.github/`, `.opencode/`) contain native integration files.

## Install

### Quick start (recommended)

```bash
npx codewiki init --name "My Project"
```

Auto-detects your AI tool and installs everything. Use `--tool` to target specific tools:

```bash
npx codewiki init --tool claude-code
npx codewiki init --tool claude-code,codex
```

### From source

```bash
git clone https://github.com/your-org/codewiki.git
cd codewiki
npm install
npm run build
npm link
codewiki init --name "My Project"
```

## Quick start in a project

```bash
# 1. Initialize CodeWiki in your project
npx codewiki init --name "My Project" --tool claude-code

# 2. Use slash commands inside your AI tool:
#    /codewiki-query "what do we know about auth middleware?"
#    /codewiki-ingest raw/api-redesign.md
#    /codewiki-lint
#    /codewiki-prd "add retry policy to API client"
#    /codewiki-tasks raw/<prd-file>.md
#    /codewiki-process

# 3. Hooks run automatically:
#    pre-wiki-context.sh — injects wiki context before file edits
#    post-verify.sh — verification reminder after changes

# 4. Agents available on demand:
#    codewiki-wiki-updater — proposes wiki updates from session work
#    codewiki-verifier — validates wiki changes before approval
```

## CLI Command

| Command | What it does |
| --- | --- |
| `codewiki init [--tool ...] [--name ...] [--force]` | Scaffolds `.codewiki/`, `raw/`, `wiki/`, and installs slash commands, hooks, and agents for the specified AI tool(s). Re-running is safe — merges without clobbering existing configs. Use `--force` to replace existing CodeWiki sections. |

This is the **only** CLI command. All other intelligence lives in the installed prompt files that your AI tool executes natively.

## Slash Commands

Installed as markdown prompt files into your AI tool's command directory. Use them inside your AI tool session:

| Slash Command | Purpose |
| --- | --- |
| `/codewiki-ingest` | Read a raw source document and propose wiki updates (source summary, entity updates, cross-references) |
| `/codewiki-query` | Search the wiki for relevant context and synthesize an answer with citations |
| `/codewiki-lint` | Health-check the wiki: broken links, orphan pages, contradictions, stale claims, file drift |
| `/codewiki-prd` | Draft a PRD through clarifying questions — saves to `tasks/` for review |
| `/codewiki-tasks` | Generate a task breakdown from a PRD with checklist format |
| `/codewiki-process` | Process tasks one sub-task at a time with verification and conventional commits |

## Hooks

Shared shell scripts in `.codewiki/hooks/`, referenced by each tool's native hook config:

| Hook | Trigger | What it does |
| --- | --- | --- |
| `pre-wiki-context.sh` | Before file edits (PreToolUse) | Reads `wiki/index.md`, finds pages relevant to the files being modified, outputs context for the agent |
| `post-verify.sh` | After file edits (PostToolUse) | Checks for wiki-relevant changes and reminds the agent to consider wiki updates |

Both scripts are POSIX-compatible, use `jq` with `grep` fallback, and always exit 0 (never block the agent).

## Agents

Subagent definitions installed into your AI tool's agent directory:

| Agent | Purpose |
| --- | --- |
| `codewiki-wiki-updater` | Receives a description of what changed, reads relevant wiki pages, and proposes specific updates (new lessons, entity updates, issue tracking) |
| `codewiki-verifier` | Reviews proposed wiki changes for contradictions, validates cross-references, and reports confidence levels |

## Multi-tool support

`codewiki init` auto-detects which AI tools are present and installs native integration for each:

| Tool | Hooks | Commands | Agents | Instructions |
| --- | --- | --- | --- | --- |
| **Claude Code** | `.claude/settings.json` (PreToolUse/PostToolUse) | `.claude/commands/codewiki/` | `.claude/agents/` | Appends to `CLAUDE.md` |
| **Codex** | `.codex/hooks.json` | `.codex/commands/codewiki/` | `.codex/agents/` | Appends to `AGENTS.md` |
| **Copilot** | `.github/hooks/` | Custom agent definitions | Custom agents | Appends to `.github/copilot-instructions.md` |
| **OpenCode** | `opencode.json` (session_completed only) | `.opencode/commands/codewiki/` | `.opencode/agents/` | Appends to `AGENTS.md` |

The wiki itself is tool-agnostic — it's just markdown files. The adapters are intentionally thin wrappers that point each tool at the shared wiki and hook scripts.

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Agent as AI agent
  participant CW as CodeWiki
  participant Human as Human reviewer

  Dev->>Agent: Change code
  Agent->>CW: Read wiki/index.md + relevant pages
  CW-->>Agent: Approved context
  Agent->>Agent: Edit code and run verification
  Agent->>Human: Summary + proposed wiki updates
  Human-->>Agent: Approve or reject
  Agent->>CW: Write wiki updates only if approved
```

## Development

```bash
npm install
npm run typecheck    # Type-check without emitting
npm run build        # Compile TypeScript + copy templates to dist/
npm test             # Run vitest unit tests + Node.js integration tests
```

The package compiles TypeScript from `src/` into `dist/` and copies template files (markdown prompts, hook scripts, agent definitions) via a `postbuild` step. Tests use vitest for unit tests and Node's built-in test runner for integration tests.

**Zero runtime dependencies.** TypeScript, vitest, and `@types/node` are dev-only. The published package contains only compiled JavaScript and bundled template files.

## Current non-goals

CodeWiki deliberately does **not** include:

- runtime CLI commands beyond `init`
- LLM API calls from the CLI (all AI work happens inside the AI coding tool)
- embeddings or vector search
- a database, server, or web UI
- non-markdown ingestion
- autonomous semantic contradiction fixing
- automatic wiki writes after tests pass
- team workflow orchestration

These can be revisited later, but the contract is intentionally small: local markdown, an installer CLI, and human-approved wiki knowledge.

## Project status

CodeWiki v2 is under active development. The v1 runtime CLI has been replaced with an installer-only architecture.

| Phase | Description | Status |
| --- | --- | --- |
| 1. Clean Slate | Delete v1 runtime CLI code | ✅ Complete |
| 2. Shared Infrastructure | Merge utils, scaffold, detection, reporting | ✅ Complete |
| 3. Prompt Templates & Hook Scripts | 6 slash commands, 2 hooks, 2 agents | ✅ Complete |
| 4. Claude Code Adapter + init Command | Full end-to-end install via `npx codewiki init` | 🔜 Next |
| 5. Test Suite | Merge correctness, idempotency, npm pack coverage | ⬜ Planned |
| 6. OpenCode Adapter | session_completed hook strategy | ⬜ Planned |
| 7. Codex & Copilot Adapters | Post-spike adapters | ⬜ Planned |
| 8. npm Publish Hardening | Build script, pack verification, README | ⬜ Planned |

## License

MIT
