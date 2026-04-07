# Requirements: CodeWiki v2

**Defined:** 2026-04-07
**Core Value:** `npx codewiki init` turns any project into an AI-tool-native knowledge system in 30 seconds, where every session starts smarter than the last.

## v1 Requirements

### CLI Installer

- [ ] **CLI-01**: `npx codewiki init` works without a global install
- [ ] **CLI-02**: `--tool claude-code,codex` flag installs only specified adapters
- [ ] **CLI-03**: `--force` flag overwrites existing prompt/command files
- [ ] **CLI-04**: `--name <name>` flag sets project name in config
- [ ] **CLI-05**: Auto-detect AI tools present (check for `.claude/`, `.codex/`, `opencode.json`, `.github/copilot-instructions.md`)
- [ ] **CLI-06**: Structured install report shows ✓ Created / ⚠ Skipped / ✗ Failed per file
- [ ] **CLI-07**: Re-running `init` without `--force` produces identical state (idempotent)

### Wiki Scaffold

- [ ] **WIKI-01**: Creates `wiki/index.md` and `wiki/log.md`
- [ ] **WIKI-02**: Creates `wiki/entities/`, `wiki/decisions/`, `wiki/lessons/`, `wiki/issues/`, `wiki/sources/` directories
- [ ] **WIKI-03**: Creates `raw/` and `tasks/` directories
- [ ] **WIKI-04**: Creates `.codewiki/config.yml` with project settings
- [ ] **WIKI-05**: Creates `.codewiki/templates/` with all 5 page templates (entity, decision, lesson, issue, source-summary)

### Prompt Files (Slash Commands)

- [ ] **CMD-01**: `/codewiki-ingest` — instructs agent to digest a raw source into wiki
- [ ] **CMD-02**: `/codewiki-query` — instructs agent to search wiki and synthesize answer
- [ ] **CMD-03**: `/codewiki-lint` — instructs agent to check wiki for contradictions, orphans, stale content, file drift
- [ ] **CMD-04**: `/codewiki-prd` — adapted from `docs/prompts/create-prd.md`, full interaction model preserved
- [ ] **CMD-05**: `/codewiki-tasks` — adapted from `docs/prompts/generate-tasks.md`, "Go" gate preserved
- [ ] **CMD-06**: `/codewiki-process` — adapted from `docs/prompts/process-task-list.md`, one-sub-task-at-a-time preserved
- [ ] **CMD-07**: All command files have `description:` frontmatter so they appear in `/help`

### Hook Scripts

- [ ] **HOOK-01**: `pre-wiki-context.sh` — reads wiki/index.md, greps for relevant pages, outputs context to stdout
- [ ] **HOOK-02**: `post-verify.sh` — checks if modified files relate to wiki entities, outputs reminder
- [ ] **HOOK-03**: Hook scripts always exit 0 (never block agent)
- [ ] **HOOK-04**: Hook scripts are POSIX sh compatible (pass `shellcheck --shell=sh`)
- [ ] **HOOK-05**: Hook scripts are executable (mode 755) after installation

### Agent Definitions

- [ ] **AGENT-01**: `codewiki-wiki-updater` subagent — proposes wiki updates from code changes
- [ ] **AGENT-02**: `codewiki-verifier` subagent — checks proposed wiki changes for contradictions

### Claude Code Adapter

- [ ] **CC-01**: Installs 6 slash commands to `.claude/commands/codewiki/`
- [ ] **CC-02**: Installs 2 subagents to `.claude/agents/`
- [ ] **CC-03**: Deep-merges PreToolUse/PostToolUse hooks into `.claude/settings.json` without clobbering existing hooks
- [ ] **CC-04**: Appends CodeWiki instructions to `CLAUDE.md` using `<!-- codewiki:start/end -->` markers
- [ ] **CC-05**: Installs hook scripts to `.codewiki/hooks/` with mode 755

### Codex Adapter

- [ ] **CODEX-01**: Installs 6 slash commands to correct Codex command directory (per-project or global, confirmed by research spike)
- [ ] **CODEX-02**: Merges hook config into Codex hooks.json without clobbering existing hooks
- [ ] **CODEX-03**: Appends CodeWiki instructions to `AGENTS.md` using marker comments

### Copilot Adapter

- [ ] **COP-01**: Creates `.github/hooks/codewiki-hooks.json` with `"version": 1` and preToolUse/postToolUse entries
- [ ] **COP-02**: Appends CodeWiki instructions to `.github/copilot-instructions.md` using marker comments
- [ ] **COP-03**: Documents slash command limitation (no file-based slash command directory confirmed)

### OpenCode Adapter

- [ ] **OC-01**: Installs 6 slash commands to `.opencode/commands/codewiki/`
- [ ] **OC-02**: Installs 2 subagents to `.opencode/agents/`
- [ ] **OC-03**: Merges `session_completed` hook into `opencode.json` experimental.hooks (no PreToolUse — not available)
- [ ] **OC-04**: Appends CodeWiki instructions to `AGENTS.md` using marker comments

### Config Merge Safety

- [ ] **MERGE-01**: JSON config merge (`.claude/settings.json`, `opencode.json`) never clobbers existing user keys
- [ ] **MERGE-02**: JSON config merge deduplicates CodeWiki hooks (re-run does not double entries)
- [ ] **MERGE-03**: Markdown instruction merge never creates duplicate `<!-- codewiki:start -->` sections
- [ ] **MERGE-04**: `--force` replaces the existing marker section in instruction files

### Build & Publish

- [ ] **BUILD-01**: `npm run build` copies `src/templates/**` to `dist/templates/` (postbuild step)
- [ ] **BUILD-02**: `npm pack --dry-run` lists `dist/templates/claude/commands/ingest.md` (prompt files in tarball)
- [ ] **BUILD-03**: `engines.node >= "20.11.0"` set in package.json
- [ ] **BUILD-04**: Zero npm runtime dependencies (Commander.js + optional picocolors only)

## v2 Requirements

### Update Command

- **UPD-01**: `codewiki update` re-installs latest prompt files without touching wiki content
- **UPD-02**: `codewiki update --tool claude-code` updates only specified tool's prompts

### Plugin System

- **PLUG-01**: Custom page type templates configurable in `.codewiki/config.yml`
- **PLUG-02**: Third-party prompt packs installable via npm

## Out of Scope

| Feature | Reason |
|---------|--------|
| Runtime CLI commands (`codewiki ingest`, `codewiki query`) | Reimplements AI tool natively; loses conversation loop |
| LLM API calls from CLI | Forces API key management, fails offline, vendor lock-in |
| Web dashboard / database / server | Wiki is already browsable as markdown |
| Team sync / multi-user | Git handles this natively |
| Interactive wizard prompts (inquirer) | Breaks CI; flags cover all config needs |
| Template auto-update system | Creates version conflicts with user customizations |
| Windows support | Developer tool targeting macOS/Linux; POSIX hooks incompatible |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 through CLI-07 | Phase 4 (Claude Code Adapter + init) | Pending |
| WIKI-01 through WIKI-05 | Phase 2 (Shared Infrastructure) | Pending |
| CMD-01 through CMD-07 | Phase 3 (Prompt Templates + Hooks) | Pending |
| HOOK-01 through HOOK-05 | Phase 3 (Prompt Templates + Hooks) | Pending |
| AGENT-01 through AGENT-02 | Phase 3 (Prompt Templates + Hooks) | Pending |
| CC-01 through CC-05 | Phase 4 (Claude Code Adapter + init) | Pending |
| CODEX-01 through CODEX-03 | Phase 7 (Codex + Copilot Adapters) | Pending |
| COP-01 through COP-03 | Phase 7 (Codex + Copilot Adapters) | Pending |
| OC-01 through OC-04 | Phase 6 (OpenCode Adapter) | Pending |
| MERGE-01 through MERGE-04 | Phase 2 (Shared Infrastructure) | Pending |
| BUILD-01 through BUILD-04 | Phase 8 (npm Publish Hardening) | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
