# Architecture Research

**Domain:** CLI installer for AI coding tool integrations
**Researched:** 2026-04-07
**Confidence:** HIGH (derived from PRD, implementation plan, and GSD local install patterns)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│  CLI LAYER (runs once at install time)                        │
│  npx codewiki init [--tool] [--force] [--name]               │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Tool Detect │  │ Wiki Scaffold  │  │  Per-Tool Adapters│  │
│  │ (auto/manual)│  │ wiki/, raw/,   │  │  Claude Code     │  │
│  └──────┬───────┘  │ tasks/,        │  │  Codex           │  │
│         │          │ .codewiki/     │  │  Copilot         │  │
│         │          └────────────────┘  │  OpenCode        │  │
│         └─────────────────────────────►└──────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  TEMPLATE LAYER (files bundled in dist/)                      │
│  dist/templates/                                              │
│    claude/commands/*.md       opencode/commands/*.md          │
│    claude/agents/*.md         opencode/agents/*.md            │
│    shared/hooks/*.sh          shared/wiki-templates/*.md      │
│    shared/config.yml          codex/*, copilot/*              │
└──────────────────────────────────────────────────────────────┘

          ▼ INSTALLED INTO TARGET PROJECT ▼

┌──────────────────────────────────────────────────────────────┐
│  WIKI LAYER (LLM-written, human-approved)                     │
│  wiki/index.md, log.md, entities/, decisions/, lessons/,      │
│  issues/, sources/                                            │
├──────────────────────────────────────────────────────────────┤
│  TOOL INTEGRATION LAYER (installed by init)                   │
│  .claude/settings.json (hooks)                                │
│  .claude/commands/codewiki/*.md (slash commands)              │
│  .claude/agents/*.md (subagents)                              │
│  .codewiki/hooks/pre-wiki-context.sh, post-verify.sh          │
│  CLAUDE.md (appended instructions)                            │
├──────────────────────────────────────────────────────────────┤
│  RAW LAYER (immutable, human-curated)                         │
│  raw/ (user drops markdown here)                              │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Location |
|-----------|----------------|----------|
| CLI entry point | Parse flags, route to init command | `src/bin/codewiki.ts` |
| Tool detector | Check for `.claude/`, `.codex/`, `opencode.json`, etc. | `src/lib/detect.ts` |
| Wiki scaffolder | Create `wiki/`, `raw/`, `tasks/`, `.codewiki/`, templates | `src/lib/scaffold.ts` |
| Per-tool adapter | Copy prompts + hook scripts + merge configs for one tool | `src/adapters/{claude,codex,copilot,opencode}.ts` |
| JSON merger | Deep-merge CodeWiki hooks into existing tool JSON config | `src/lib/merge.ts` |
| Markdown merger | Append/replace marker-comment section in instruction files | `src/lib/merge.ts` |
| Template reader | Locate and read bundled files from `dist/templates/` | `src/lib/assets.ts` |
| Reporter | Print structured install report | `src/lib/reporter.ts` |

## Recommended Project Structure

```
src/
├── bin/
│   └── codewiki.ts         # CLI entry: shebang, Commander setup, init command
├── commands/
│   └── init.ts             # init logic: orchestrate scaffold + adapters
├── adapters/
│   ├── claude.ts           # Claude Code adapter
│   ├── codex.ts            # Codex adapter
│   ├── copilot.ts          # Copilot adapter
│   └── opencode.ts         # OpenCode adapter
├── lib/
│   ├── assets.ts           # import.meta.dirname + template path resolution
│   ├── detect.ts           # AI tool auto-detection
│   ├── merge.ts            # JSON deep merge + markdown marker merge
│   ├── scaffold.ts         # wiki directory structure creation
│   └── reporter.ts         # install report output
└── templates/              # NOT compiled — copied verbatim by postbuild
    ├── claude/
    │   ├── commands/       # 6 slash command .md files
    │   ├── agents/         # 2 subagent .md files
    │   └── settings-fragment.json  # hooks to merge into .claude/settings.json
    ├── codex/
    │   └── commands/       # same 6 command .md files (different frontmatter if needed)
    ├── copilot/
    │   └── hooks/          # .github/hooks/codewiki-hooks.json
    ├── opencode/
    │   ├── commands/       # same 6 command .md files
    │   └── agents/         # 2 subagent .md files
    └── shared/
        ├── hooks/
        │   ├── pre-wiki-context.sh
        │   └── post-verify.sh
        ├── wiki-templates/ # entity.md, decision.md, lesson.md, issue.md, source-summary.md
        ├── config.yml      # .codewiki/config.yml template
        ├── wiki-index.md   # initial wiki/index.md
        └── wiki-log.md     # initial wiki/log.md
```

## Architectural Patterns

### Pattern 1: Template Fragment Merge

**What:** Instead of generating JSON/markdown from scratch, store fragments of what CodeWiki adds and merge them into existing files.

**When to use:** Any time CodeWiki adds to a file the user may already have (`.claude/settings.json`, `CLAUDE.md`).

**Trade-offs:** + Safe, idempotent, composable with other tools. − Requires merge logic to be robust.

**Example:**
```typescript
// src/templates/claude/settings-fragment.json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "bash .codewiki/hooks/pre-wiki-context.sh", "timeout": 5 }] }],
    "PostToolUse": [{ "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "bash .codewiki/hooks/post-verify.sh", "timeout": 5 }] }]
  }
}

// merge.ts
function mergeSettings(existing: Record<string, unknown>, fragment: Record<string, unknown>) {
  // Deep merge: hooks arrays concatenate, scalars overwrite
  // Never remove existing keys
}
```

### Pattern 2: Marker-Comment Sections in Markdown

**What:** Wrap CodeWiki's instruction block with `<!-- codewiki:start -->` / `<!-- codewiki:end -->` comments so it can be found, replaced, or skipped without affecting surrounding content.

**When to use:** Appending to `CLAUDE.md`, `AGENTS.md`, `copilot-instructions.md`.

**Trade-offs:** + Idempotent: second run replaces section, doesn't duplicate. + User can edit surrounding content freely. − Marker comments are visible in rendered markdown (minor).

**Example:**
```typescript
function appendInstructions(filePath: string, content: string, force: boolean): 'created' | 'appended' | 'skipped' | 'replaced' {
  const START = '<!-- codewiki:start -->';
  const END = '<!-- codewiki:end -->';
  const marker = `${START}\n${content}\n${END}`;

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, marker);
    return 'created';
  }
  const existing = fs.readFileSync(filePath, 'utf8');
  if (existing.includes(START)) {
    if (!force) return 'skipped';
    const replaced = existing.replace(new RegExp(`${START}[\\s\\S]*?${END}`), marker);
    fs.writeFileSync(filePath, replaced);
    return 'replaced';
  }
  fs.appendFileSync(filePath, '\n\n' + marker);
  return 'appended';
}
```

### Pattern 3: Asset Location via `import.meta.dirname`

**What:** Locate bundled template files relative to the compiled CLI file's own directory.

**When to use:** Any time the CLI needs to read a bundled file at runtime.

**Trade-offs:** + No path configuration needed. + Works with `npx`, global install, and local `node dist/bin/codewiki.js`. − Requires Node >=20.11.0.

**Example:**
```typescript
import { join } from 'node:path';
const TEMPLATES_DIR = join(import.meta.dirname, '..', 'templates');

function getTemplate(toolName: string, fileName: string): string {
  return fs.readFileSync(join(TEMPLATES_DIR, toolName, fileName), 'utf8');
}
```

## Data Flow

### `codewiki init` Execution Flow

```
npx codewiki init [flags]
    │
    ▼
Parse flags (--tool, --force, --name)
    │
    ▼
Detect AI tools (check filesystem markers)
    │
    ▼
Create wiki scaffold (wiki/, raw/, tasks/, .codewiki/config.yml, templates)
    │
    ├──for each detected tool──►
    │                           Locate templates for this tool (import.meta.dirname)
    │                           Copy command .md files to tool command dir
    │                           Copy hook scripts to .codewiki/hooks/
    │                           Merge settings fragment into tool JSON config
    │                           Append instructions to tool instruction file
    │                           Copy agent .md files (if tool supports agents)
    │                           Collect install result (created/skipped/replaced)
    │
    ▼
Print structured install report
```

### Hook Execution Flow (runtime, in target project)

```
Developer: "implement retry logic in api-client.ts"
    │
    ▼
AI tool triggers PreToolUse hook
    │
    ▼
.codewiki/hooks/pre-wiki-context.sh receives JSON on stdin
    │  { tool_name: "Write", tool_input: { file_path: "src/api-client.ts" } }
    │
    ▼
Script greps wiki/index.md for "api-client"
    │
    ▼
Outputs matching wiki context to stdout
    │  "WIKI CONTEXT: LESSON-003 — Retry with 0ms base delay causes infinite loop..."
    │
    ▼
AI tool injects stdout as additionalContext
    │
    ▼
Agent codes with wiki context
    │
    ▼
AI tool triggers PostToolUse hook
    │
    ▼
.codewiki/hooks/post-verify.sh checks for wiki-entity file changes
    │
    ▼
Outputs reminder if relevant files modified
```

## Build Order (Phase Dependencies)

```
Phase 1: Clean Up (delete v1 runtime commands)
    └──enables──► Phase 2, 3, 4, 5 (clean slate)

Phase 2: Prompt files (slash commands)
Phase 3: Hook scripts
Phase 4: Agent definitions
Phase 5: System instructions
    └── all four enable ──► Phase 6 (init command has files to install)

Phase 6: Rewrite init command + adapters
    └──enables──► Phase 7 (tests need a working init)

Phase 7: Tests
Phase 8: package.json + README
```

## Anti-Patterns

### Anti-Pattern 1: Replacing Instead of Merging

**What people do:** `fs.writeFileSync('.claude/settings.json', JSON.stringify(codewikiSettings))`

**Why it's wrong:** Destroys any existing Claude Code configuration the user had (permissions, other hooks).

**Do this instead:** Read existing file → deep-merge CodeWiki fragment → write back. Never replace a file that might have user content.

### Anti-Pattern 2: Non-Zero Exit from Hook Script

**What people do:** `exit 1` on parse error in the hook script.

**Why it's wrong:** In Claude Code, exit code 2 blocks the tool call. Exit code 1 also causes issues. Non-zero exit means the agent can't write files — breaks the entire session.

**Do this instead:** Always `exit 0`. Output errors to stderr for debugging. Never block on hook script failure.

### Anti-Pattern 3: Hardcoded Template Paths

**What people do:** `fs.readFileSync('/usr/local/lib/node_modules/codewiki/dist/templates/...')`

**Why it's wrong:** Breaks for `npx`, breaks for different Node installations, breaks on Windows.

**Do this instead:** `join(import.meta.dirname, '..', 'templates', ...)` — always relative to the compiled file's own location.

### Anti-Pattern 4: Bash-Specific Hook Scripts

**What people do:** `#!/bin/bash` + bash arrays + `[[` conditionals.

**Why it's wrong:** Copilot hooks and some environments run with `/bin/sh`. Bashisms fail silently or with confusing errors.

**Do this instead:** POSIX sh or Node.js scripts. Test with `shellcheck --shell=sh`.

## Integration Points

### AI Tool Configs Modified

| File | Integration | Safe Merge Pattern |
|------|-------------|-------------------|
| `.claude/settings.json` | Add PreToolUse/PostToolUse hook arrays | Deep merge: concat arrays, preserve existing keys |
| `CLAUDE.md` | Append CodeWiki instructions | Marker-comment section |
| `AGENTS.md` | Append CodeWiki instructions | Marker-comment section |
| `.github/copilot-instructions.md` | Append CodeWiki instructions | Marker-comment section |
| `opencode.json` | Add `experimental.hooks` entries | Deep merge |
| `.github/hooks/codewiki-hooks.json` | Create new file only | Check existence, skip if --force not set |

### Files Created (Never Merged)

| File | Action if exists | Action with --force |
|------|-----------------|---------------------|
| `.claude/commands/codewiki/*.md` | Skip with warning | Overwrite |
| `.claude/agents/codewiki-*.md` | Skip with warning | Overwrite |
| `.codewiki/hooks/*.sh` | Skip with warning | Overwrite |
| `wiki/index.md`, `wiki/log.md` | Skip (preserve wiki) | Overwrite |
| `.codewiki/config.yml` | Skip with warning | Overwrite |

## Sources

- `docs/codewiki-project-v2.md` — PRD with architecture diagrams
- `docs/implementation-plan-v2.md` — detailed implementation task breakdown
- GSD local install at `/home/giuice/.claude/` — hook config patterns
- STACK.md (this research session) — asset bundling, `import.meta.dirname`
- FEATURES.md (this research session) — per-tool hook formats

---
*Architecture research for: CLI installer for AI coding tool integrations*
*Researched: 2026-04-07*
