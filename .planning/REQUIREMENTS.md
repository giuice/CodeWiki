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

- [x] **WIKI-01**: Creates `wiki/index.md` and `wiki/log.md`
- [x] **WIKI-02**: Creates `wiki/entities/`, `wiki/decisions/`, `wiki/lessons/`, `wiki/issues/`, `wiki/sources/` directories
- [x] **WIKI-03**: Creates `raw/` and `tasks/` directories
- [x] **WIKI-04**: Creates `.codewiki/config.yml` with project settings
- [x] **WIKI-05**: Creates `.codewiki/templates/` with all 5 page templates (entity, decision, lesson, issue, source-summary)

### Prompt Files (Slash Commands)

- [x] **CMD-01**: `/codewiki-ingest` — instructs agent to digest a raw source into wiki
- [x] **CMD-02**: `/codewiki-query` — instructs agent to search wiki and synthesize answer
- [x] **CMD-03**: `/codewiki-lint` — instructs agent to check wiki for contradictions, orphans, stale content, file drift
- [x] **CMD-04**: `/codewiki-prd` — adapted from `docs/prompts/create-prd.md`, full interaction model preserved
- [x] **CMD-05**: `/codewiki-tasks` — adapted from `docs/prompts/generate-tasks.md`, "Go" gate preserved
- [x] **CMD-06**: `/codewiki-process` — adapted from `docs/prompts/process-task-list.md`, one-sub-task-at-a-time preserved
- [x] **CMD-07**: All command files have `description:` frontmatter so they appear in `/help`

### Hook Scripts

- [x] **HOOK-01**: `pre-wiki-context.sh` — reads wiki/index.md, greps for relevant pages, outputs context to stdout
- [x] **HOOK-02**: `post-verify.sh` — checks if modified files relate to wiki entities, outputs reminder
- [x] **HOOK-03**: Hook scripts always exit 0 (never block agent)
- [x] **HOOK-04**: Hook scripts are POSIX sh compatible (pass `shellcheck --shell=sh`)
- [x] **HOOK-05**: Hook scripts are executable (mode 755) after installation

### Agent Definitions

- [x] **AGENT-01**: `codewiki-wiki-updater` subagent — proposes wiki updates from code changes
- [x] **AGENT-02**: `codewiki-verifier` subagent — checks proposed wiki changes for contradictions

### Auto-Improvement Engine

- [x] **ABS-01**: `/codewiki-absorb` extracts durable wiki knowledge from recent git changes with human approval gating
- [x] **ABS-02**: `/codewiki-breakdown` finds referenced-but-undocumented entities and ranks them by backlink importance
- [x] **ABS-03**: `wiki/_backlinks.json` is scaffolded and maintained by wiki prompts that read or update structural knowledge
- [x] **ABS-04**: `session-end.sh` summarizes session changes and exits 0 under all conditions
- [x] **ABS-05**: `post-verify.sh` emits structured change context that actively routes the runtime toward wiki-update follow-up work

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

- [x] **MERGE-01**: JSON config merge (`.claude/settings.json`, `opencode.json`) never clobbers existing user keys
- [x] **MERGE-02**: JSON config merge deduplicates CodeWiki hooks (re-run does not double entries)
- [x] **MERGE-03**: Markdown instruction merge never creates duplicate `<!-- codewiki:start -->` sections
- [x] **MERGE-04**: `--force` replaces the existing marker section in instruction files

### Build & Publish

- [x] **BUILD-01**: `npm run build` copies `src/templates/**` to `dist/templates/` (postbuild step)
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
| WIKI-01 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| WIKI-02 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| WIKI-03 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| WIKI-04 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| WIKI-05 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| MERGE-01 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| MERGE-02 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| MERGE-03 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| MERGE-04 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| CMD-01 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| CMD-02 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| CMD-03 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| CMD-04 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| CMD-05 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| CMD-06 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| CMD-07 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| HOOK-01 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| HOOK-02 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| HOOK-03 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| HOOK-04 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| HOOK-05 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| AGENT-01 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| AGENT-02 | Phase 3 (Prompt Templates and Hook Scripts) | Complete (2026-04-08) |
| ABS-01 | Phase 3.1 (Auto-Improvement Engine) | Complete (2026-04-08) |
| ABS-02 | Phase 3.1 (Auto-Improvement Engine) | Complete (2026-04-08) |
| ABS-03 | Phase 3.1 (Auto-Improvement Engine) | Complete (2026-04-08) |
| ABS-04 | Phase 3.1 (Auto-Improvement Engine) | Complete (2026-04-08) |
| ABS-05 | Phase 3.1 (Auto-Improvement Engine) | Complete (2026-04-08) |
| CLI-01 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CLI-02 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CLI-03 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CLI-04 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CLI-05 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CLI-06 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CLI-07 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CC-01 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CC-02 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CC-03 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CC-04 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| CC-05 | Phase 4 (Claude Code Adapter + init Command) | Pending |
| BUILD-01 | Phase 2 (Shared Infrastructure) | Complete (2026-04-07) |
| BUILD-02 | Phase 5 (Test Suite) | Pending |
| OC-01 | Phase 6 (OpenCode Adapter) | Pending |
| OC-02 | Phase 6 (OpenCode Adapter) | Pending |
| OC-03 | Phase 6 (OpenCode Adapter) | Pending |
| OC-04 | Phase 6 (OpenCode Adapter) | Pending |
| CODEX-01 | Phase 7 (Codex and Copilot Adapters) | Pending |
| CODEX-02 | Phase 7 (Codex and Copilot Adapters) | Pending |
| CODEX-03 | Phase 7 (Codex and Copilot Adapters) | Pending |
| COP-01 | Phase 7 (Codex and Copilot Adapters) | Pending |
| COP-02 | Phase 7 (Codex and Copilot Adapters) | Pending |
| COP-03 | Phase 7 (Codex and Copilot Adapters) | Pending |
| BUILD-03 | Phase 8 (npm Publish Hardening) | Pending |
| BUILD-04 | Phase 8 (npm Publish Hardening) | Pending |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0 ✓

**Note:** Phase 1 (Clean Slate) has no v1 requirements assigned — it is a prerequisite cleanup that removes v1 runtime code to create a clean foundation. All v1 requirements map to Phases 2-8.

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-08 — Phase 3.1 auto-improvement engine verified and traceability refreshed*
