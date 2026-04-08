# CodeWiki

CodeWiki is a framework that installs into any AI coding tool and maintains a persistent, LLM-written wiki of verified project knowledge.

Run `npx codewiki init` once — the CLI scaffolds a wiki structure and installs slash commands, hook scripts, and agent definitions into your AI tool. All intelligence (reading wiki, proposing updates, human approval loops) lives in markdown prompt files that the AI tool executes natively. The CLI itself runs zero application logic at runtime.

The result is a compounding knowledge base of decisions, lessons, issues, source summaries, and entity pages that future sessions of Claude Code, Codex, Copilot, or OpenCode can use — so every session starts smarter than the last.

## How it works

The core rule:

> The agent proposes; the human approves; only approved knowledge enters `wiki/`.

CodeWiki wraps a verification loop around coding work via automatically-installed hooks, slash commands, and agents:

```mermaid
flowchart TD
  A[Developer asks agent to change code] --> B[Pre-hook injects wiki context automatically]
  B --> C[Agent reads relevant wiki pages<br/>entities, lessons, issues, decisions]
  C --> D[Agent changes code with known context]
  D --> E[Agent runs verification<br/>tests, typecheck, manual checks]
  E --> F[Post-hook reminds about wiki updates]
  F --> G{Human approves result?}

  G -- Yes --> H[Agent proposes wiki updates<br/>lesson/entity/issue/log/source summary]
  H --> I{Human approves wiki update?}
  I -- Yes --> J[Write approved updates to wiki/]
  I -- No --> K[Keep proposal out of wiki/]

  G -- No --> L[Agent investigates failure]
  L --> M[Create or update proposed issue/lesson<br/>explaining what failed]
  M --> N[Human reviews strategy]
  N --> D
```

For read-only questions, use the `/codewiki-query` slash command inside your AI tool. For source ingestion, use `/codewiki-ingest`. All intelligence runs inside the AI tool — there is no runtime CLI.

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
