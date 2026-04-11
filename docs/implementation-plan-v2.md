# CodeWiki v2 — Implementation Plan

> **Audience:** Junior developers implementing this plan.
> **Reference PRD:** `docs/codewiki-project-v2.md`
> **Architecture model:** GSD (https://github.com/gsd-build/get-shit-done) — study how GSD installs itself before starting.

---

## Overview

The current codebase (`src/`) implements a runtime CLI that does wiki parsing, term matching, and proposal rendering in TypeScript. **We are replacing this** with an installer-only CLI. The CLI's only job is `codewiki init` — it copies markdown prompts, hook scripts, and tool configs into the right places.

All "intelligence" (reading wiki, finding relevant pages, proposing updates, asking for human approval) moves to **markdown prompt files** that the AI tool (Claude Code, Codex, Copilot, OpenCode) executes natively.

## Workflow target

After the 3.1 auto-improvement work, the intended developer loop is:

1. Run `npx codewiki init` once.
2. Load project knowledge with `raw/` plus `/codewiki-ingest`.
3. Plan changes with `/codewiki-prd` and `/codewiki-tasks`.
4. Execute through `/codewiki-process`, letting hooks inject wiki context before edits and emit wiki-update proposals after verification.
5. Use `session-end.sh` or `/codewiki-absorb` to capture durable lessons from the session diff.
6. Use `/codewiki-breakdown`, `/codewiki-lint`, and `/codewiki-query` to strengthen and consult the wiki between features.

> **Command count note:** Phase 3 shipped 6 commands (`ingest`, `query`, `lint`,
> `prd`, `tasks`, `process`); Phase 3.1 added `absorb` and `breakdown`, bringing
> the total to **8 slash commands**. Older sections of this doc that still say
> "6 commands" are stale — the canonical count is 8.

## Refactor note

This plan predates the current template-tree refactor. When older task text below mentions `src/prompts/...`, read it as the shipped template assets under `src/templates/...`:

- command markdown lives under `src/templates/claude/commands/codewiki/`
- shared hook scripts live under `src/templates/hooks/`
- installed file wiring lives in `src/templates/scaffold.ts`

---

## Research Tasks (Do These First)

Before writing any code, each developer should:

### R1. Study GSD's installer pattern
```bash
git clone https://github.com/gsd-build/get-shit-done
```
Focus on:
- How `npx get-shit-done-cc@latest` works — read the install script
- What files it copies and where (`.claude/commands/`, `.claude/agents/`, `.claude/settings.json`)
- How hook scripts are structured (JS files that receive JSON on stdin)
- How slash commands are structured (markdown files with YAML frontmatter)
- How it handles multi-tool support (path rewriting for `.codex/`, `.opencode/`, etc.)

### R2. Study Claude Code hooks format
Read: https://docs.anthropic.com/en/docs/claude-code/hooks
- Hook events: `PreToolUse`, `PostToolUse`, `SessionStart`
- Matcher syntax: `"Write|Edit"` matches tool names
- Hook types: `"command"` runs a shell script
- The hook script receives JSON on stdin with tool input details
- The script's stdout is injected as context for the agent
- `.claude/settings.json` structure for hooks

### R3. Study Codex hooks and commands
Read: https://developers.openai.com/codex/hooks, https://developers.openai.com/codex/cli/slash-commands, https://developers.openai.com/codex/skills
- `hooks.json` format and lifecycle events
- How `AGENTS.md` is discovered and loaded
- Slash command format and registration
- Skills package format

### R4. Study Copilot hooks (Preview)
Read: https://code.visualstudio.com/docs/copilot/customization/hooks
- `.github/hooks/*.json` format
- Lifecycle events: `preToolUse`, `postToolUse`
- How hook scripts receive input (JSON on stdin)
- Custom instructions: `.github/copilot-instructions.md`

### R5. Study OpenCode config
Read: https://opencode.ai/docs/config/, https://opencode.ai/docs/commands/, https://opencode.ai/docs/agents/
- `opencode.json` hook config under `experimental`
- Command markdown files format
- Agent markdown files format
- How `AGENTS.md` is loaded

### R6. Read the original CodeWiki prompts
These are the source of truth for slash command content:
- `docs/prompts/create-prd.md` → becomes `/codewiki-prd` slash command
- `docs/prompts/generate-tasks.md` → becomes `/codewiki-tasks` slash command
- `docs/prompts/process-task-list.md` → becomes `/codewiki-process` slash command

---

## Implementation Tasks

### Phase 1: Clean Up — Remove Runtime CLI Logic

**Goal:** Strip the codebase down to just the `init` command.

#### Task 1.1: Remove runtime command modules
Delete these files (they contain runtime logic we're replacing with prompts):
- `src/commands/ingest.ts`
- `src/commands/query.ts`
- `src/commands/lint.ts`
- `src/commands/prd.ts`
- `src/commands/tasks.ts`
- `src/commands/status.ts`

Keep:
- `src/commands/init.ts` (will be rewritten)

#### Task 1.2: Remove unused core modules
These were used by the runtime commands. Delete:
- `src/core/wiki-index.ts` (term matching logic — AI tool does this natively)
- `src/core/proposals.ts` (proposal rendering — AI tool does this natively)
- `src/core/frontmatter.ts` (frontmatter parsing — AI tool reads markdown natively)
- `src/core/hash.ts` (file hashing — move to hook script if needed)

Keep:
- `src/core/files.ts` (file utilities used by init)
- `src/core/config.ts` (config loading — may still be used by init)
- `src/core/types.ts` (type definitions — simplify)

#### Task 1.3: Simplify CLI entry point
Update `src/cli.ts` to only have:
- `init` command
- `--help`
- `--version`

Remove all other command registrations.

#### Task 1.4: Remove runtime tests
Delete tests for removed commands:
- `test/ingest.test.ts`
- `test/query.test.ts`
- `test/lint.test.ts`
- `test/prd-tasks-status.test.ts`

Keep and update:
- `test/init.test.ts` (rewrite for new init behavior)
- `test/cli.test.ts` (simplify)
- `test/helpers.ts`

---

### Phase 2: Create Prompt Files (Slash Commands)

**Goal:** Write the markdown prompt files that will be installed as slash commands.

These files will live in `src/prompts/commands/` in the CodeWiki repo and get copied to the target project's tool-specific command directory by `init`.

#### Task 2.1: Create `/codewiki-ingest` prompt
File: `src/prompts/commands/ingest.md`

Content should instruct the AI to:
1. Read the specified raw source file
2. Read `wiki/index.md` to understand existing wiki state
3. Discuss key takeaways with the developer
4. Create a source summary page in `wiki/sources/` using the template from `.codewiki/templates/source-summary.md`
5. Update `wiki/index.md` with the new entry
6. Identify affected entity/decision/issue pages and propose updates
7. Wait for human approval before writing any wiki files
8. Append to `wiki/log.md`

#### Task 2.2: Create `/codewiki-query` prompt
File: `src/prompts/commands/query.md`

Content should instruct the AI to:
1. Read `wiki/index.md` first
2. Find pages relevant to the user's question
3. Read matched pages
4. Synthesize an answer with references to wiki paths
5. Offer to file the answer as a new wiki page if it's valuable
6. Never hallucinate wiki content — only cite what exists

#### Task 2.3: Create `/codewiki-lint` prompt
File: `src/prompts/commands/lint.md`

Content should instruct the AI to:
1. Read `wiki/index.md` and all wiki pages
2. Check for: broken wikilinks, orphan pages, contradictions, stale claims, missing cross-references, file drift (compare `file_hashes` in entity frontmatter against actual file hashes), resolved issues missing `resolved_by`, open issues with no activity
3. Report findings grouped by severity
4. Propose fixes for each finding
5. Wait for human approval before applying any fix

#### Task 2.4: Create `/codewiki-prd` prompt
File: `src/prompts/commands/prd.md`

**Adapt from `docs/prompts/create-prd.md`** — preserve the full interaction model:
1. Receive feature description from user
2. Read existing architecture docs / schema files to understand tech stack
3. Ask clarifying questions (provide numbered options for easy selection)
4. Generate PRD with: Introduction, Goals, User Stories, Functional Requirements, Non-Goals, Design Considerations, Technical Considerations, Success Metrics, Open Questions
5. Save as `tasks/[NNNN]-prd-[feature-name].md` (zero-padded sequence)
6. Do NOT start implementing — just create the PRD

#### Task 2.5: Create `/codewiki-tasks` prompt
File: `src/prompts/commands/tasks.md`

**Adapt from `docs/prompts/generate-tasks.md`** — preserve the full interaction model:
1. Receive PRD file reference
2. Analyze PRD + codebase patterns (package.json, existing similar features, reusable components)
3. Phase 1: Generate parent tasks, present to user, wait for "Go"
4. Phase 2: Generate sub-tasks with `- [ ] 1.0 / 1.1 / 1.2` checklist format
5. Identify relevant files section
6. Save as `tasks/tasks-[prd-file-name].md`

#### Task 2.6: Create `/codewiki-process` prompt
File: `src/prompts/commands/process.md`

**Adapt from `docs/prompts/process-task-list.md`** — preserve the full interaction model:
1. One sub-task at a time — do NOT proceed without user permission
2. Mark `[x]` on completion
3. When all subtasks of a parent are done: run tests → stage → clean up → commit (conventional commits)
4. Mark parent task `[x]` after commit
5. Junior developer mentorship: explain "why", safety first, suggest docs updates
6. End each response with: "Completed: [Task X]", "Next Up: [Task Y]", "Awaiting your command to proceed."

#### Task 2.7: Create `/codewiki-absorb` prompt
File: `src/prompts/commands/absorb.md`

**Inspired by Farzaa's wiki skill absorption loop.** Content should instruct the AI to:
1. Read `git diff HEAD~N` or recent commits to understand what changed in the session
2. Read `wiki/index.md` and `wiki/_backlinks.json` to understand current wiki state
3. For each changed file, identify which wiki entities, lessons, decisions, or issues are affected
4. Cross-reference against existing wiki pages to avoid duplication
5. Propose concrete wiki updates: new pages, enriched existing pages, new cross-links
6. Apply anti-cramming rule: if adding a 3rd paragraph about a sub-topic to an article, propose a new page instead
7. Apply anti-thinning rule: every page touched must get meaningfully richer
8. Wait for human approval before writing any wiki files
9. Update `wiki/_backlinks.json` after all changes are applied
10. Append to `wiki/log.md`

#### Task 2.8: Create `/codewiki-breakdown` prompt
File: `src/prompts/commands/breakdown.md`

**Inspired by Farzaa's breakdown mining.** Content should instruct the AI to:
1. Read all wiki pages and `wiki/_backlinks.json`
2. Identify entities mentioned in 2+ pages that have no dedicated wiki page
3. Identify pages with zero inbound links (orphans via `_backlinks.json`)
4. Rank candidates by reference count (most-referenced gaps first)
5. Present a candidate table: `| # | Article | Dir | Refs | Description |`
6. For approved candidates, create new pages with content drawn from existing mentions
7. Add wikilinks from existing articles back to the new pages
8. Rebuild `wiki/_backlinks.json`
9. Wait for human approval before writing any wiki files

---

### Phase 3: Create Hook Scripts

**Goal:** Write shell scripts that run as pre/post hooks.

#### Task 3.1: Create pre-hook wiki context script
File: `src/prompts/hooks/pre-wiki-context.sh`

This script:
1. Receives JSON on stdin from the AI tool (contains info about the tool call, e.g., which file is being written/edited)
2. Reads `wiki/index.md` to get the page catalog
3. Greps for file paths or keywords mentioned in the tool input
4. Outputs relevant wiki page paths and summaries to stdout
5. The AI tool injects this output as context

Keep it simple — just `grep` and `cat`. No complex parsing. The AI tool does the reasoning.

**Research note:** Study how GSD's hook scripts work. Look at `gsd-context-monitor.js` and `gsd-prompt-guard.js` for patterns.

#### Task 3.2: Create post-hook wiki-updater trigger script
File: `src/prompts/hooks/post-verify.sh`

This script actively triggers wiki updates (not just a passive reminder):
1. Receives JSON on stdin about the completed tool call
2. Checks if any files related to wiki entities were modified
3. Outputs structured context about what changed and which wiki entities are affected
4. The AI tool receives this output and triggers the wiki-updater agent with change context
5. The wiki-updater agent proposes concrete wiki edits (human approval still required)

#### Task 3.3: Create session-end hook script
File: `src/prompts/hooks/session-end.sh`

This script fires on session end (Claude Code `Stop`, Codex `session_completed`, etc.):
1. Reads `git diff` of uncommitted or recent changes from the session
2. Outputs a summary of what was accomplished
3. Triggers a lightweight absorb pass — the AI tool proposes wiki updates for new knowledge
4. Always exits 0

#### Task 3.4: Make hook scripts work across tools
Each tool passes slightly different JSON to hooks. The scripts should:
- Parse JSON with `jq` if available, fall back to `grep` patterns
- Be POSIX-compatible (no bash-isms)
- Exit 0 always (hooks should not block the agent)

---

### Phase 4: Create Agent Definitions

**Goal:** Write markdown agent definitions for subagent workflows.

#### Task 4.1: Wiki updater agent
File: `src/prompts/agents/codewiki-wiki-updater.md`

A subagent that:
1. Receives a description of what changed (files modified, test results)
2. Reads relevant wiki pages
3. Proposes specific wiki page updates (new lessons, issue updates, entity updates)
4. Outputs the proposed changes for human review

#### Task 4.2: Verifier agent
File: `src/prompts/agents/codewiki-verifier.md`

A subagent that:
1. Reviews proposed wiki changes against the existing wiki
2. Checks for contradictions with existing pages
3. Validates cross-references
4. Reports confidence level and any concerns

---

### Phase 5: Create System Instructions

**Goal:** Write the instruction text that gets appended to each tool's instruction file.

#### Task 5.1: Claude Code instructions
File: `src/prompts/instructions/claude-code.md`

Text to append to `CLAUDE.md`:
```markdown
## CodeWiki

This project uses CodeWiki for persistent, verified knowledge management.

- Wiki pages are in `wiki/`. Read `wiki/index.md` first for the catalog.
- Raw source documents are in `raw/`.
- Page templates are in `.codewiki/templates/`.
- **Before modifying files:** Check if relevant wiki issues or lessons exist.
- **After changes:** Consider whether wiki updates are needed.
- **Never modify wiki/ files without human approval.**

### Available Commands
- `/codewiki-ingest` — Ingest a raw source document into the wiki
- `/codewiki-query` — Query the wiki for information
- `/codewiki-lint` — Health-check the wiki
- `/codewiki-absorb` — Absorb session lessons into the wiki at end-of-session
- `/codewiki-breakdown` — Break a large wiki page into smaller cross-linked pages
- `/codewiki-prd` — Generate a PRD for a new feature
- `/codewiki-tasks` — Generate tasks from a PRD
- `/codewiki-process` — Process tasks one at a time
```

#### Task 5.2: Codex instructions
File: `src/prompts/instructions/codex.md`

Similar content adapted for `AGENTS.md` format.

#### Task 5.3: Copilot instructions
File: `src/prompts/instructions/copilot.md`

Similar content adapted for `.github/copilot-instructions.md`.

#### Task 5.4: OpenCode instructions
File: `src/prompts/instructions/opencode.md`

Similar content for OpenCode's `AGENTS.md` or config.

---

### Phase 6: Rewrite the `init` Command

**Goal:** `codewiki init` scaffolds wiki structure AND installs tool-specific configs.

#### Task 6.1: Rewrite `src/templates/scaffold.ts`

The scaffold module should:
1. Define the wiki directory structure (unchanged: `wiki/entities`, `wiki/decisions`, etc.)
2. Define config files (`.codewiki/config.yml`, `.codewiki/templates/*`)
3. Define per-tool install targets:

For Claude Code:
- Copy `src/prompts/commands/*.md` → `.claude/commands/codewiki/*.md`
- Copy `src/prompts/agents/*.md` → `.claude/agents/`
- Copy `src/prompts/hooks/*.sh` → `.codewiki/hooks/`
- Create/merge `.claude/settings.json` with hook config pointing to `.codewiki/hooks/`
- Append `src/prompts/instructions/claude-code.md` to `CLAUDE.md`

For Codex:
- Copy `src/prompts/commands/*.md` → `.codex/commands/codewiki/*.md` (research exact path)
- Copy `src/prompts/hooks/*.sh` → `.codewiki/hooks/`
- Create/merge `.codex/hooks.json` or equivalent (research exact format)
- Append `src/prompts/instructions/codex.md` to `AGENTS.md`

For Copilot:
- Copy commands as custom agent definitions (research format)
- Copy `src/prompts/hooks/*.sh` → `.codewiki/hooks/`
- Create `.github/hooks/codewiki-pre.json` and `codewiki-post.json` (research format)
- Append `src/prompts/instructions/copilot.md` to `.github/copilot-instructions.md`

For OpenCode:
- Copy `src/prompts/commands/*.md` → `.opencode/commands/codewiki/`
- Copy `src/prompts/agents/*.md` → `.opencode/agents/`
- Create/merge `opencode.json` with hook config (research format)
- Append `src/prompts/instructions/opencode.md` to `AGENTS.md`

#### Task 6.2: Handle merging with existing tool configs

Critical: `init` must NOT clobber existing tool configs.

For JSON files (`.claude/settings.json`, `opencode.json`):
- Read existing file if present
- Deep merge: add CodeWiki hooks to existing hooks array, don't replace
- Write back

For markdown files (`CLAUDE.md`, `AGENTS.md`, `copilot-instructions.md`):
- Check if file contains `## CodeWiki` section already
- If yes and `--force`: replace the section
- If yes and no `--force`: skip with warning
- If no: append the section

Use marker comments to identify CodeWiki's sections:
```markdown
<!-- codewiki:start -->
## CodeWiki
...
<!-- codewiki:end -->
```

#### Task 6.3: Rewrite `src/commands/init.ts`

The init command should:
1. Parse `--tool`, `--name`, `--force` flags (keep existing flag parsing)
2. Auto-detect tools if `--tool` not specified (check for `.claude/`, `.codex/`, `.github/`, `.opencode/`, `opencode.json`)
3. Call scaffold functions to create wiki structure
4. Call per-tool install functions to copy prompts, hooks, and merge configs
5. Report what was installed:
   ```
   CodeWiki initialized for my-project.
   
   Installed for: claude-code, codex
   
   Claude Code:
     ✓ Hooks: .claude/settings.json (PreToolUse, PostToolUse)
     ✓ Commands: .claude/commands/codewiki/ (8 commands)
     ✓ Agents: .claude/agents/ (2 agents)
     ✓ Instructions: CLAUDE.md (appended)
   
   Codex:
     ✓ Instructions: AGENTS.md (appended)
     ✓ Commands: .codex/commands/codewiki/ (8 commands)
   
   Wiki structure:
     ✓ wiki/index.md, wiki/log.md
     ✓ wiki/entities/, decisions/, lessons/, issues/, sources/
     ✓ raw/, tasks/
     ✓ .codewiki/config.yml, templates/
   ```

#### Task 6.4: Embed prompt files in the build

The prompt markdown files need to be available at runtime when `init` runs. Options:
- **Option A (recommended):** Read them from disk relative to the package install path (`import.meta.url` to find package root, then read `src/prompts/`)
- **Option B:** Inline them as template literal strings in TypeScript (like the current `adapter-templates.ts`). Simpler but harder to maintain.
- **Option C:** Copy prompts to `dist/prompts/` during build and read from there.

Research: How does GSD embed its markdown files? It copies them directly — the npm package includes the files and the installer reads them from the package directory.

Recommendation: Use Option C — add a build step that copies `src/prompts/**` to `dist/prompts/**`, then read from there at runtime. Add `"prompts/"` to the `files` array in `package.json`.

---

### Phase 7: Rewrite Tests

#### Task 7.1: Test init creates wiki scaffold
Same as current test but verify:
- `.codewiki/config.yml` exists with correct content
- `.codewiki/templates/*.md` exist
- `wiki/index.md`, `wiki/log.md` exist
- `wiki/entities/`, `wiki/decisions/`, etc. exist
- `raw/`, `tasks/` exist

#### Task 7.2: Test init installs Claude Code adapter
Run init with `--tool claude-code` and verify:
- `.claude/settings.json` exists and contains `PreToolUse` and `PostToolUse` hooks
- `.claude/commands/codewiki/ingest.md` exists (and all 8 commands)
- `.claude/agents/codewiki-wiki-updater.md` exists
- `CLAUDE.md` contains `## CodeWiki` section
- `.codewiki/hooks/pre-wiki-context.sh` exists and is executable

#### Task 7.3: Test init installs Codex adapter
Run init with `--tool codex` and verify:
- `AGENTS.md` contains `## CodeWiki` section
- Command files exist in the right location
- Hook config exists (research exact format first)

#### Task 7.4: Test init installs Copilot adapter
Similar verification for Copilot files.

#### Task 7.5: Test init installs OpenCode adapter
Similar verification for OpenCode files.

#### Task 7.6: Test init merges existing configs
- Create a `.claude/settings.json` with existing hooks
- Run init
- Verify CodeWiki hooks were added without removing existing hooks

#### Task 7.7: Test init doesn't duplicate on re-run
- Run init twice
- Verify `CLAUDE.md` has exactly one `## CodeWiki` section
- Verify `.claude/settings.json` has exactly one set of CodeWiki hooks

#### Task 7.8: Test `--tool` flag filters adapters
- `--tool claude-code` should not create Codex/Copilot/OpenCode files
- `--tool codex,copilot` should create both

#### Task 7.9: Test `--force` overwrites
- Run init, modify a prompt file
- Run init again without `--force` → should skip/warn
- Run init with `--force` → should overwrite

---

### Phase 8: Update `package.json` and Build

#### Task 8.1: Update `package.json`
- Add `"prompts/"` to the `files` array (so prompt files are included in npm package)
- Add a build step to copy prompts: `"build": "tsc -p tsconfig.json && cp -r src/prompts dist/prompts"`
- Keep zero runtime dependencies

#### Task 8.2: Update `README.md`
- Reflect the new architecture: CLI = installer, AI tool does the work
- Quick start: `npx codewiki init`, then use `/codewiki-prd`, `/codewiki-tasks`, etc.
- Explain what each slash command does
- Explain the verification loop

#### Task 8.3: Clean up old files
- Delete `docs/codewiki-implementation-review.md` (outdated)
- Delete `docs/next-command.md` (outdated)
- Keep `docs/codewiki-project.md` (v1 reference)
- Keep `docs/prompts/` (original prompts, source of truth for slash commands)

---

## Verification Checklist

Run these after implementation is complete:

```bash
# Build
npm run build

# Tests
npm test

# Smoke test: Claude Code
tmpdir=$(mktemp -d)
cd "$tmpdir"
node /path/to/dist/bin/codewiki.js init --tool claude-code --name test-project
# Verify:
cat .claude/settings.json          # Should have hooks
ls .claude/commands/codewiki/      # Should have 8 .md files
ls .claude/agents/                 # Should have 2 .md files
cat CLAUDE.md                      # Should have CodeWiki section
cat wiki/index.md                  # Should exist
ls .codewiki/hooks/                # Should have hook scripts

# Smoke test: Codex
tmpdir2=$(mktemp -d)
cd "$tmpdir2"
node /path/to/dist/bin/codewiki.js init --tool codex --name test-project
# Verify:
cat AGENTS.md                      # Should have CodeWiki section
ls .codewiki/hooks/                # Should have hook scripts

# Smoke test: merge existing config
tmpdir3=$(mktemp -d)
cd "$tmpdir3"
mkdir -p .claude
echo '{"permissions":{"allow":["Read"]}}' > .claude/settings.json
node /path/to/dist/bin/codewiki.js init --tool claude-code
cat .claude/settings.json          # Should have BOTH permissions AND hooks
```

---

## File Map Summary

### Files to DELETE
```
src/commands/ingest.ts
src/commands/query.ts
src/commands/lint.ts
src/commands/prd.ts
src/commands/tasks.ts
src/commands/status.ts
src/core/wiki-index.ts
src/core/proposals.ts
src/core/frontmatter.ts
src/core/hash.ts
test/ingest.test.ts
test/query.test.ts
test/lint.test.ts
test/prd-tasks-status.test.ts
```

### Files to CREATE
```
src/prompts/commands/ingest.md
src/prompts/commands/query.md
src/prompts/commands/lint.md
src/prompts/commands/absorb.md
src/prompts/commands/breakdown.md
src/prompts/commands/prd.md
src/prompts/commands/tasks.md
src/prompts/commands/process.md
src/prompts/hooks/pre-wiki-context.sh
src/prompts/hooks/post-verify.sh
src/prompts/hooks/session-end.sh
src/prompts/agents/codewiki-wiki-updater.md
src/prompts/agents/codewiki-verifier.md
src/prompts/instructions/claude-code.md
src/prompts/instructions/codex.md
src/prompts/instructions/copilot.md
src/prompts/instructions/opencode.md
```

### Files to REWRITE
```
src/commands/init.ts
src/templates/scaffold.ts
src/templates/adapter-templates.ts
src/cli.ts
src/core/types.ts
test/init.test.ts
test/cli.test.ts
package.json
README.md
```

### Files to KEEP (minimal changes)
```
src/bin/codewiki.ts
src/core/files.ts
src/core/config.ts
src/templates/page-templates.ts
test/helpers.ts
tsconfig.json
tsconfig.test.json
docs/codewiki-project-v2.md (new PRD)
docs/prompts/ (original prompts, reference)
```
