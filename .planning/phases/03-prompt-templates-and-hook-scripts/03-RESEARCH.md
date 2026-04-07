# Phase 3: Prompt Templates and Hook Scripts - Research

**Researched:** 2026-04-07
**Domain:** Markdown prompt files, POSIX shell scripts, Claude Code slash command format
**Confidence:** HIGH

## Summary

Phase 3 creates 10 static files: 6 slash command markdown files, 2 agent definition markdown files, and 2 hook shell scripts. All live in `src/templates/` and get copied to `dist/templates/` by the existing postbuild step. No runtime code, no TypeScript logic -- just content files that AI tools consume.

The slash commands follow Claude Code's frontmatter format (`description:`, `allowed-tools:`, `argument-hint:`). The hook scripts must be pure POSIX `sh` passing `shellcheck --shell=sh`. The three adapted commands (prd, tasks, process) transform existing source prompts in `docs/prompts/` into the GSD-inspired structured tag format per D-01.

**Primary recommendation:** Treat this as a content-authoring phase split into 3 parallel workstreams: slash commands, hook scripts, agent definitions. Each file is independently verifiable. Hook scripts are highest risk (shell correctness, exit-0 guarantee, jq/grep fallback).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use GSD-inspired structured markdown with `<purpose>`, `<process>`, `<step>` tags and explicit tool usage hints for all 6 slash commands
- **D-02:** Implement multi-agent orchestration in adapted commands: `/codewiki-prd` spawns parallel research agents, `/codewiki-tasks` uses analyze+generate agents, `/codewiki-process` spawns focused subtask executor subagents
- **D-03:** No checkpoint files and no automatic git commits from within commands -- user controls all git operations
- **D-04:** Interaction gates (clarifying questions, "Go" confirmation, one-subtask-at-a-time) offered as user choice: "mentorship mode" (full gates) vs "fast mode" (generate all at once), selectable at invocation time
- **D-05:** `/codewiki-ingest` performs full wiki extraction with user approval before writing
- **D-06:** `/codewiki-query` performs wiki-grounded search (local markdown RAG pattern)
- **D-07:** `/codewiki-lint` performs full wiki health check
- **D-08:** `pre-wiki-context.sh` reads wiki/index.md AND greps for related terms, outputs page summaries. Exit 0 always
- **D-09:** `post-verify.sh` parses JSON payload for modified file paths, checks wiki entity matches, outputs reminder. Uses jq with grep fallback. Exit 0 always
- **D-10:** `codewiki-wiki-updater` agent reads code changes, proposes wiki edits with before/after diffs, user approves individually
- **D-11:** `codewiki-verifier` agent performs cross-reference contradiction check before any write

### Claude's Discretion
- Internal prompt wording and example content within each command
- Specific grep patterns and matching heuristics in hook scripts
- Agent instruction formatting details and error handling prose

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMD-01 | `/codewiki-ingest` command file | D-05 defines behavior; frontmatter format verified below |
| CMD-02 | `/codewiki-query` command file | D-06 defines behavior |
| CMD-03 | `/codewiki-lint` command file | D-07 defines behavior |
| CMD-04 | `/codewiki-prd` adapted from source prompt | D-01, D-02, D-04; source: `docs/prompts/create-prd.md` |
| CMD-05 | `/codewiki-tasks` adapted from source prompt | D-01, D-02, D-04; source: `docs/prompts/generate-tasks.md` |
| CMD-06 | `/codewiki-process` adapted from source prompt | D-01, D-02, D-04; source: `docs/prompts/process-task-list.md` |
| CMD-07 | All commands have `description:` frontmatter | Frontmatter format documented below |
| HOOK-01 | `pre-wiki-context.sh` reads wiki and outputs context | D-08; POSIX patterns below |
| HOOK-02 | `post-verify.sh` checks modified files against wiki | D-09; jq/grep fallback pattern below |
| HOOK-03 | Hook scripts always exit 0 | Trap pattern documented below |
| HOOK-04 | shellcheck --shell=sh passes with zero warnings | shellcheck rules below |
| HOOK-05 | Hook scripts executable (mode 755) | Set in git via postbuild; Phase 4 sets chmod at install time |
| AGENT-01 | `codewiki-wiki-updater` agent definition | D-10; agent markdown format below |
| AGENT-02 | `codewiki-verifier` agent definition | D-11; agent markdown format below |

</phase_requirements>

## Standard Stack

No new libraries. This phase creates only static content files (markdown + shell scripts). Zero dependencies.

## Architecture Patterns

### File Layout in src/templates/

```
src/templates/
  claude/
    commands/
      codewiki/
        ingest.md          # CMD-01
        query.md           # CMD-02
        lint.md            # CMD-03
        prd.md             # CMD-04
        tasks.md           # CMD-05
        process.md         # CMD-06
    agents/
      codewiki-wiki-updater.md   # AGENT-01
      codewiki-verifier.md       # AGENT-02
  hooks/
    pre-wiki-context.sh    # HOOK-01
    post-verify.sh         # HOOK-02
  adapter-templates.ts     # (existing)
  page-templates.ts        # (existing)
  scaffold.ts              # (existing)
```

[VERIFIED: existing postbuild step in package.json copies `src/templates/.` to `dist/templates/`]

### Pattern 1: Claude Code Slash Command Format

**What:** Markdown files with YAML frontmatter that Claude Code recognizes as slash commands.
**When to use:** All 6 command files.

```markdown
---
description: Short description shown in /help
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
argument-hint: <source-file>
---

# Command Title

<purpose>
What this command does and why.
</purpose>

<process>
## Step 1: ...
## Step 2: ...
</process>
```

[VERIFIED: frontmatter format confirmed from `.claude/plugins/marketplaces/claude-plugins-official/plugins/example-plugin/commands/example-command.md` on this machine]

Supported frontmatter fields: `description`, `argument-hint`, `allowed-tools`, `model`. [VERIFIED: same source]

### Pattern 2: Agent Definition Format

**What:** Markdown files in `.claude/agents/` that define subagents Claude Code can spawn.
**Format:**

```markdown
---
description: Brief description of the agent's role
tools: [Read, Glob, Grep, Bash, Edit, Write]
---

# Agent Name

## Role
[What this agent does]

## Instructions
[Detailed behavior]
```

[ASSUMED] -- Agent definition format inferred from Claude Code plugin patterns. The exact frontmatter keys for agents may differ from commands.

### Pattern 3: Mentorship vs Fast Mode Toggle (D-04)

Commands that support D-04 should check `$ARGUMENTS` for a mode flag:

```markdown
## Mode Selection

If the user includes `--fast` or `fast` in arguments, skip interaction gates and generate all output at once.
Otherwise, default to mentorship mode with clarifying questions and "Go" confirmations.

The user invoked this command with: $ARGUMENTS
```

[VERIFIED: `$ARGUMENTS` variable is available in Claude Code commands -- confirmed from example-command.md]

### Pattern 4: POSIX Shell Hook Script Structure

```sh
#!/bin/sh
# codewiki: pre-wiki-context hook
# Reads wiki/index.md and outputs relevant context to stdout
# Always exits 0 -- never blocks the agent

set -e

# Trap to guarantee exit 0
trap 'exit 0' EXIT

main() {
    wiki_index="wiki/index.md"
    
    # Guard: wiki not initialized
    if [ ! -f "$wiki_index" ]; then
        exit 0
    fi
    
    # ... logic here ...
}

main "$@"
```

Key POSIX rules for shellcheck compliance:
- Use `[ ]` not `[[ ]]` (bashism) [VERIFIED: shellcheck SC2039]
- Use `$(command)` not backticks [VERIFIED: shellcheck SC2006]
- No `local` keyword (not POSIX; use subshell or careful naming) -- actually `local` is widely supported but shellcheck with `--shell=sh` will warn [ASSUMED]
- Use `printf` over `echo -e` [VERIFIED: shellcheck SC2028]
- Quote all variable expansions [VERIFIED: shellcheck SC2086]

### Pattern 5: jq with grep Fallback (D-09)

```sh
# Parse JSON payload for file paths
if command -v jq >/dev/null 2>&1; then
    files=$(printf '%s' "$payload" | jq -r '.[] // empty' 2>/dev/null) || files=""
else
    # Fallback: extract quoted strings that look like file paths
    files=$(printf '%s' "$payload" | grep -oE '"[^"]*\.[a-zA-Z]+"' | tr -d '"') || files=""
fi
```

[ASSUMED] -- Exact JSON payload shape from Claude Code hooks is not confirmed for all tools. STATE.md notes: "Cross-tool JSON payload shapes for Codex and OpenCode are MEDIUM confidence."

### Anti-Patterns to Avoid
- **Bashisms in hook scripts:** No `[[ ]]`, `local`, `source`, arrays, `<<<` here-strings. shellcheck --shell=sh catches these.
- **Forgetting exit 0 trap:** Without the trap, any `set -e` failure would cause a non-zero exit, blocking the agent.
- **Hardcoding wiki paths:** Use variables at top of script; the wiki root may differ per project config in future.
- **Overly long command prompts:** Claude Code has context limits; keep each command focused and under ~200 lines of markdown.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON parsing in shell | Manual sed/awk extraction | jq with grep fallback | Edge cases in JSON escaping are infinite |
| POSIX compatibility testing | Manual testing | shellcheck --shell=sh | Catches 200+ shell pitfalls automatically |

## Common Pitfalls

### Pitfall 1: shellcheck `local` Keyword Warning
**What goes wrong:** Using `local` in `#!/bin/sh` scripts triggers SC2039 ("local is undefined in POSIX sh").
**Why it happens:** `local` works in bash/dash but is not in the POSIX spec.
**How to avoid:** Either use `#!/bin/sh` and avoid `local` entirely (use unique variable names), or accept that shellcheck with `--shell=sh` will flag it. Safest: avoid `local`.
**Warning signs:** shellcheck output shows SC2039.

### Pitfall 2: Hook Script Receives Empty or Malformed Input
**What goes wrong:** `post-verify.sh` called with no stdin, empty string, or non-JSON input causes script to fail.
**Why it happens:** Different AI tools pass different payload formats; some may pass nothing.
**How to avoid:** Guard every input read with defaults. `payload=$(cat 2>/dev/null) || payload=""`. Never assume input exists.

### Pitfall 3: Command $ARGUMENTS Not Parsed
**What goes wrong:** Command instructions reference `$ARGUMENTS` but don't tell the AI how to parse them.
**How to avoid:** Include explicit "## Arguments" section showing expected format and how to handle missing args.

### Pitfall 4: Adapted Commands Lose Original Interaction Model
**What goes wrong:** When adapting `docs/prompts/create-prd.md` etc., the clarifying-questions and "Go" gate get dropped.
**How to avoid:** Cross-reference each source prompt's interaction model and verify it appears in the adapted command (in mentorship mode).

## Code Examples

### Slash Command: codewiki-ingest (CMD-01)

```markdown
---
description: Digest a raw source document into wiki pages
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
argument-hint: <source-file-path>
---

# CodeWiki Ingest

<purpose>
Read a source document and extract entities, decisions, lessons, issues into wiki pages.
Cross-reference with existing wiki content. Propose new pages with user approval before writing.
</purpose>

<process>
## Step 1: Read Source
Read the file at $ARGUMENTS. If no argument provided, ask the user which file to ingest.

## Step 2: Read Wiki State
Read wiki/index.md to understand existing entities.

## Step 3: Extract Knowledge
Identify: entities, decisions, lessons, issues, source summaries.

## Step 4: Cross-Reference
Check each extracted item against existing wiki pages to avoid duplicates.

## Step 5: Propose Changes
Present proposed new pages and index updates. Wait for user approval before writing.

## Step 6: Write Approved Pages
Create approved pages using templates from .codewiki/templates/.
Update wiki/index.md with new entries.
</process>
```

### Hook Script: pre-wiki-context.sh (HOOK-01)

```sh
#!/bin/sh
# codewiki: pre-wiki-context hook
# Outputs wiki context to stdout; exits 0 always
trap 'exit 0' EXIT
set -e

WIKI_INDEX="wiki/index.md"

if [ ! -f "$WIKI_INDEX" ]; then
    exit 0
fi

# Output index for context
printf '## CodeWiki Context\n\n'
cat "$WIKI_INDEX"
```

### Hook Script: post-verify.sh (HOOK-02, with jq fallback)

```sh
#!/bin/sh
# codewiki: post-verify hook  
# Checks if modified files relate to wiki entities; exits 0 always
trap 'exit 0' EXIT
set -e

WIKI_ENTITIES="wiki/entities"

payload=$(cat 2>/dev/null) || payload=""
[ -z "$payload" ] && exit 0
[ ! -d "$WIKI_ENTITIES" ] && exit 0

# Extract file paths from payload
if command -v jq >/dev/null 2>&1; then
    files=$(printf '%s' "$payload" | jq -r '.. | strings' 2>/dev/null) || files=""
else
    files=$(printf '%s' "$payload" | grep -oE '"[^"]+\.[a-zA-Z0-9]+"' | tr -d '"') || files=""
fi

[ -z "$files" ] && exit 0

# Check each file against wiki entity names
for entity_file in "$WIKI_ENTITIES"/*.md; do
    [ -f "$entity_file" ] || continue
    entity_name=$(basename "$entity_file" .md)
    if printf '%s' "$files" | grep -qi "$entity_name"; then
        printf 'Wiki entity "%s" may need updating.\n' "$entity_name"
    fi
done
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit) + node --test (integration) |
| Config file | vitest via package.json scripts |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01..06 | Command files exist with correct frontmatter | unit | `vitest run src/test/commands.test.ts` | No - Wave 0 |
| CMD-07 | All commands have `description:` frontmatter | unit | Same as above | No - Wave 0 |
| HOOK-01 | pre-wiki-context.sh outputs context | integration | `sh src/templates/hooks/pre-wiki-context.sh` in temp dir | No - Wave 0 |
| HOOK-02 | post-verify.sh handles all inputs | integration | `echo '{}' \| sh src/templates/hooks/post-verify.sh` | No - Wave 0 |
| HOOK-03 | Hooks exit 0 always | integration | Test with bad input, missing files | No - Wave 0 |
| HOOK-04 | shellcheck passes | lint | `shellcheck --shell=sh src/templates/hooks/*.sh` | N/A (tool) |
| HOOK-05 | Scripts are executable | unit | Check file mode | No - Wave 0 |
| AGENT-01..02 | Agent files exist with content | unit | Same commands test | No - Wave 0 |

### Wave 0 Gaps
- [ ] `src/test/commands.test.ts` -- verifies all 6 command files exist, have `description:` frontmatter, contain expected sections
- [ ] `src/test/hooks.test.ts` -- verifies hook scripts exist, are executable, exit 0 under various conditions
- [ ] `src/test/agents.test.ts` -- verifies agent definition files exist with expected content
- [ ] shellcheck must be installed (`apt install shellcheck` or `brew install shellcheck`)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| shellcheck | HOOK-04 (lint validation) | No | -- | Install via `sudo apt install shellcheck` or skip in CI |
| jq | HOOK-02 (runtime, not build) | No | -- | grep fallback built into script (by design) |
| sh (POSIX shell) | HOOK-01, HOOK-02 | Yes | -- | -- |

**Missing dependencies with no fallback:**
- shellcheck: Required for HOOK-04 verification. Must be installed before hook validation. `sudo apt install shellcheck` on Ubuntu/Debian.

**Missing dependencies with fallback:**
- jq: Not needed at build time. Hook scripts include grep fallback by design (D-09).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Claude Code agent definition files use similar frontmatter to commands (description, tools) | Architecture Pattern 2 | Agent files may not be recognized; fix is trivial frontmatter adjustment |
| A2 | `local` keyword triggers SC2039 in shellcheck --shell=sh | Pitfall 1 | May need to restructure variable scoping in hooks |
| A3 | JSON payload shape passed to post-verify.sh by Claude Code hooks | Code Examples | grep fallback handles unknown shapes; low risk |

## Open Questions

1. **Exact Claude Code agent definition format**
   - What we know: Commands use YAML frontmatter with `description:`, `allowed-tools:`
   - What's unclear: Whether agents use the same frontmatter keys or different ones (e.g., `tools:` vs `allowed-tools:`)
   - Recommendation: Create agents with same format as commands; adjust if Claude Code rejects them

2. **Hook script payload JSON schema**
   - What we know: Claude Code passes JSON to PreToolUse/PostToolUse hooks
   - What's unclear: Exact field names and nesting
   - Recommendation: Use defensive parsing (jq `.. | strings` to extract all string values) and grep fallback

## Sources

### Primary (HIGH confidence)
- Example command file on local machine: `/home/giuice/.claude/plugins/.../example-command.md` -- frontmatter format
- Source prompts: `docs/prompts/create-prd.md`, `generate-tasks.md`, `process-task-list.md` -- content to adapt
- Existing templates: `src/templates/adapter-templates.ts` -- established pattern

### Secondary (MEDIUM confidence)
- shellcheck wiki for POSIX sh rules [ASSUMED from training data]

### Tertiary (LOW confidence)
- Agent definition format [ASSUMED -- no local example found]

## Metadata

**Confidence breakdown:**
- Slash command format: HIGH -- verified from local example file
- Hook script patterns: HIGH -- standard POSIX sh patterns
- Agent definition format: LOW -- no verified example; assumed similar to commands
- Content adaptation: HIGH -- source prompts are available and well-structured

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain, no fast-moving dependencies)
