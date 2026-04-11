# Feature Research

**Domain:** npm CLI installer for AI coding tool integrations (Claude Code, Codex, Copilot, OpenCode)
**Researched:** 2026-04-07
**Confidence:** HIGH for Claude Code/GSD patterns; MEDIUM for Codex/Copilot hook formats; OpenCode has no PreToolUse equivalent — post-hook uses `session_completed` (confirmed)

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto-detect AI tools present | Users don't want to specify which tools they have | LOW | Check for `.claude/`, `.codex/`, `.github/copilot-instructions.md`, `opencode.json` |
| `--tool` flag override | Power users need explicit control | LOW | Comma-separated: `--tool claude-code,codex` |
| Idempotent re-runs | Safe to run twice without breaking things | MEDIUM | No-clobber merge for JSON; marker-comment sections for markdown |
| `--force` flag for overwrite | Users need to update installed prompts | LOW | Overwrite command files; replace marker sections |
| Structured install report | Users need to know what happened | LOW | `✓ Created`, `⚠ Skipped`, `✗ Failed` per file |
| Zero runtime npm dependencies | Expected from a dev tool | LOW | Commander.js + picocolors are the only additions |
| Works via `npx codewiki init` | Standard for scaffolding tools | LOW | `bin` field in package.json, correct `dist/` structure |
| Bundled prompt files in dist/ | Self-contained package | LOW | `postbuild` script copies `src/templates/**` → `dist/templates/**` |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-tool install in one command | 4 different file formats abstracted | HIGH | Each tool has different hook config, command path, instruction file |
| Shared hook scripts in `.codewiki/hooks/` | One update propagates to all tools | LOW | All tool configs point to same `.codewiki/hooks/pre-wiki-context.sh` |
| Marker-comment merge | Safe instruction file updates without destroying user content | MEDIUM | `<!-- codewiki:start -->` / `<!-- codewiki:end -->` |
| Pre-hook wiki context injection | Wiki knowledge arrives automatically before file edits | MEDIUM | Most differentiating feature — passive context delivery |
| 6 slash commands with tool-native frontmatter | Correct format per tool, not just file copies | MEDIUM | Claude Code and OpenCode have different frontmatter requirements |
| System instructions explain verification loop | Agent understands the wiki pattern without user prompting | LOW | Appended to CLAUDE.md / AGENTS.md / copilot-instructions.md |

### Anti-Features (Deliberately NOT Building)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Runtime CLI commands (`codewiki ingest`, `codewiki query`) | Feels like a complete product | Reimplements what AI tools do natively; loses conversation loop; can't do interactive approval | Slash commands installed by `init` |
| LLM API calls from CLI | "Smart" installer that knows your codebase | Forces API key management, fails offline, adds vendor lock-in | AI tool executes the prompts natively |
| Interactive wizard prompts | Friendlier UX | Breaks CI/automation; flags cover all config needs | `--tool`, `--force`, `--name` flags |
| Template auto-update system | Keep prompts up to date automatically | Creates version conflicts with user customizations | `init --force` for intentional updates |
| Web dashboard / database | Visual wiki browser | Wiki is already browsable as markdown in any editor | Plain markdown + git |
| Team sync / multi-user | Teams use the same wiki | Wiki is in git — teams sync via git naturally | Git workflow |

## Hook Config Formats Per Tool

### Claude Code — `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "bash .codewiki/hooks/pre-wiki-context.sh", "timeout": 5 }] }],
    "PostToolUse": [{ "matcher": "Write|Edit|MultiEdit", "hooks": [{ "type": "command", "command": "bash .codewiki/hooks/post-verify.sh", "timeout": 5 }] }]
  }
}
```
- Hook stdin: `{ session_id, tool_name, tool_input, cwd }`. Stdout injected as `additionalContext`. Exit 2 blocks tool use.
- Merge into existing arrays — never replace the file.

### Codex — `~/.codex/hooks.json` (same three-level structure as Claude Code)

```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "write_file|edit_file", "hooks": [{ "type": "command", "command": "bash .codewiki/hooks/pre-wiki-context.sh", "statusMessage": "Loading CodeWiki context" }] }]
  }
}
```
- Exit 2 + stderr = block. Stdout JSON with `systemMessage` = inject context.
- Multiple `hooks.json` files across config layers are all loaded (don't replace each other).
- **RESEARCH GAP:** Per-project `.codex/` command path unconfirmed. Official docs reference `~/.codex/prompts/<name>.md` (global only).

### Copilot — `.github/hooks/<name>.json`

```json
{
  "version": 1,
  "hooks": [
    { "event": "preToolUse", "command": { "bash": "bash .codewiki/hooks/pre-wiki-context.sh", "timeoutSec": 5 } },
    { "event": "postToolUse", "command": { "bash": "bash .codewiki/hooks/post-verify.sh", "timeoutSec": 5 } }
  ]
}
```
- Must include `"version": 1`. File must be on the default branch. Multiple JSON files in `.github/hooks/` are all loaded.
- **Preview feature** as of 2025.
- **RESEARCH GAP:** No file-based custom slash command directory confirmed (no `.github/commands/` equivalent). Must rely on instruction file descriptions.

### OpenCode — `opencode.json`

```json
{
  "experimental": {
    "hooks": {
      "session_completed": { "command": "bash .codewiki/hooks/post-verify.sh" }
    }
  }
}
```
- **No pre-tool hook available.** OpenCode has no PreToolUse equivalent. CodeWiki uses `session_completed` (fires once at end-of-session) to trigger `post-verify.sh` for batch wiki absorb. Pre-edit wiki context must come from `AGENTS.md` instructions, not hooks.
- Commands go in `.opencode/commands/<name>.md`; agents in `.opencode/agents/<name>.md`.

## Command/Skill Installation Paths

| Tool | Slash Command Path | Instruction File | Subagents |
|------|--------------------|-----------------|-----------|
| Claude Code | `.claude/commands/codewiki/<name>.md` | `CLAUDE.md` (append) | `.claude/agents/<name>.md` |
| Codex | `~/.codex/prompts/<name>.md` (global; per-project unconfirmed) | `AGENTS.md` (append) | None native |
| Copilot | No file-based directory confirmed | `.github/copilot-instructions.md` (append) | `.github/copilot-agents/` (unconfirmed) |
| OpenCode | `.opencode/commands/<name>.md` | `AGENTS.md` (append) | `.opencode/agents/<name>.md` |

## Feature Dependencies

```
wiki scaffold (wiki/, raw/, tasks/, .codewiki/)
    └──required by──> all tool adapters

hook scripts (.codewiki/hooks/*.sh)
    └──required by──> Claude Code adapter
    └──required by──> Codex adapter
    └──required by──> Copilot adapter
    └──required by──> OpenCode adapter (post-only)

Claude Code adapter
    └──validates──> overall installer pattern (do this first)

slash command prompts (ingest.md, query.md, etc.)
    └──required by──> Claude Code adapter
    └──required by──> Codex adapter (if per-project path confirmed)
    └──required by──> OpenCode adapter
```

## MVP Definition

### Launch With (v1)

- [ ] Wiki scaffold (`wiki/`, `raw/`, `tasks/`, `.codewiki/`) — core value without any tool adapter
- [ ] Claude Code adapter (hooks + 8 commands + 2 agents + instruction section) — first tool, most mature
- [ ] Shared hook scripts in `.codewiki/hooks/` — context injection pattern
- [ ] No-clobber merge for `.claude/settings.json` and `CLAUDE.md` — idempotency
- [ ] `--force` flag for overwrite — upgrade path
- [ ] Structured install report — user confidence

### Add After Validation (v1.x)

- [ ] Codex adapter — after Claude Code pattern is validated; needs per-project command path spike
- [ ] OpenCode adapter — after Claude Code; similar structure, no pre-hook limitation
- [ ] Copilot adapter — last; Preview feature, custom command path unconfirmed

### Future Consideration (v2+)

- [ ] `codewiki update` command — re-install/update prompts in place
- [ ] Plugin system for custom page types — defer until page templates are battle-tested
- [ ] Config migration for breaking changes — not needed until v2 is a real upgrade

## Open Research Questions

1. **Codex per-project command path:** Is `.codex/prompts/` a valid per-project location, or global only (`~/.codex/prompts/`)? Verify before implementing Codex adapter.
2. **Copilot custom command files:** Does Copilot agent mode support a file-based custom slash command directory? If not, Copilot adapter ships without slash commands (instruction file only).
3. **OpenCode pre-tool hook:** Any way to inject context before file edits? Check OpenCode GitHub issues/Discord.
4. **JS vs. shell hooks:** GSD uses Node.js scripts for hooks (better JSON parsing). Should CodeWiki follow? Tradeoff: JS is more reliable but adds a conceptual dependency on Node.js being available during hook execution.

## Sources

- GSD local install at `/home/giuice/.claude/settings.json` — Claude Code hook format confirmed
- Claude Code hooks documentation (official)
- Codex hooks documentation (official)
- Copilot hooks documentation — `.github/hooks/*.json` format with `"version": 1`
- OpenCode config documentation — `experimental.hooks` with `file_edited` event

---
*Feature research for: npm CLI installer for AI coding tool integrations*
*Researched: 2026-04-07*
