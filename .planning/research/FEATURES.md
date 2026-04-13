# Feature Research

**Domain:** npm CLI installer for AI coding tool integrations (Claude Code, Codex, Copilot, OpenCode)
**Originally researched:** 2026-04-07
**Canonicalized:** 2026-04-13
**Confidence:** HIGH for the current install surface and Claude Code; MEDIUM for non-Claude runtime payload details that still need live-tool validation

## Current Feature Canon

CodeWiki v2 is an installer-only CLI. `npx codewiki init` scaffolds the wiki and installs tool-facing integration assets. The canonical product surface is:

- eight standalone Skills, one per workflow
- shared shell hooks in `.codewiki/hooks/`
- tool-specific instruction blocks
- tool-specific agents or plugins where the host supports them

The installer does not run runtime wiki logic itself. The host AI tool reads the markdown prompt assets and executes the workflow natively.

## Table Stakes

| Feature | Why expected | Complexity | Current canon |
|---------|--------------|------------|---------------|
| Auto-detect AI tools present | Users do not want to specify which tools they have | LOW | Detect `.claude/`, `.codex/`, `.github/copilot-instructions.md`, `opencode.json`, or `.opencode/` |
| `--tool` flag override | Explicit control for CI and mixed installs | LOW | Comma-separated selections such as `--tool claude-code,codex` |
| Idempotent re-runs | Safe to run twice without corrupting config | MEDIUM | JSON deep-merge, marker-comment merges, hook deduplication |
| `--force` flag | Intentional refresh of managed content | LOW | Replace managed marker sections and managed copied assets |
| Structured install report | Users need to know what actually shipped | LOW | Report installed surfaces separately from pending adapter work |
| Bundled prompt assets in `dist/` | `npx` must work without source checkout | LOW | `postbuild` copies `src/templates/**` to `dist/templates/**` |

## Differentiators

| Feature | Value | Complexity | Notes |
|---------|-------|------------|-------|
| Shared dual-tree skill strategy | One skill corpus covers all four tools | MEDIUM | Claude requires `.claude/skills/`; Codex, Copilot, and OpenCode use `.agents/skills/` |
| Shared hook scripts | One update propagates across adapters | LOW | `.codewiki/hooks/*.sh` stays portable; adapter code only dispatches |
| Per-tool event mapping | Aligns to real host semantics instead of pretending hooks are uniform | HIGH | Most important non-Claude correctness constraint |
| Marker-comment instruction merges | Safe re-runs without clobbering user docs | MEDIUM | `<!-- codewiki:start -->` / `<!-- codewiki:end -->` |
| Portable skill corpus | Same workflow text works across tools | LOW | File format is uniform `SKILL.md`; only install directory changes |

## Anti-Features

| Feature | Why not | Alternative |
|---------|---------|------------|
| Runtime CLI commands (`codewiki ingest`, `codewiki query`) | Reimplements what the AI tool already does natively and loses the conversation loop | Install Skills and let the host run them |
| Custom LLM API calls from the CLI | Adds API keys, vendor lock-in, and offline failure modes | Keep all AI work inside the host tool |
| Separate per-tool skill trees for Copilot/OpenCode | Adds duplication without solving a discovery gap | Use `.agents/skills/` as the shared non-Claude tree |
| Treating session-end hooks as interchangeable across hosts | Different tools expose materially different lifecycle events | Follow each host's documented event model |

## Hook Surface By Tool

| Tool | Canonical config surface | Pre-edit or pre-turn surface | Post-edit or post-turn surface | Lifecycle note |
|------|--------------------------|------------------------------|-------------------------------|----------------|
| Claude Code | `.claude/settings.json` | `PreToolUse` on `Write|Edit` | `PostToolUse` on `Write|Edit` | `PreCompact` is only a future candidate; `SessionEnd` remains dormant for true end-of-session semantics |
| Codex | `.codex/hooks.json` | `UserPromptSubmit` fallback | `Stop` fallback | `PreToolUse` and `PostToolUse` are Bash-only, so they are not the canonical file-edit interception path for CodeWiki |
| Copilot | `.github/hooks/*.json` | `preToolUse` | `postToolUse` | `agentStop` is the meaningful post-turn hook; `sessionEnd` is cleanup-only |
| OpenCode | `.opencode/plugins/codewiki.ts` | `tool.execute.before` | `file.edited` | `session.idle` is the best turn-end or idle signal; do not treat it as teardown |

## Skill Install Surface

CodeWiki ships eight skill directories:

- `codewiki-ingest`
- `codewiki-query`
- `codewiki-lint`
- `codewiki-absorb`
- `codewiki-breakdown`
- `codewiki-prd`
- `codewiki-tasks`
- `codewiki-process`

The canonical source and install paths are:

| Surface | Path | Notes |
|---------|------|-------|
| Source of truth in this repo | `src/templates/skills/codewiki-<name>/SKILL.md` | One directory per skill |
| Claude install tree | `.claude/skills/codewiki-<name>/SKILL.md` | Claude reads `.claude/skills/` |
| Shared non-Claude install tree | `.agents/skills/codewiki-<name>/SKILL.md` | Codex reads `.agents/skills/`; Copilot and OpenCode also discover it |

OpenCode and Copilot also support tool-specific skill directories, but CodeWiki does not use them as the canonical v1 repo layout because they do not solve the Claude versus Codex discovery split.

## Feature Dependencies

```text
wiki scaffold
  -> required by every adapter

src/templates/skills/*
  -> required by Claude adapter
  -> required by shared non-Claude skills adapter

.codewiki/hooks/*
  -> required by Claude adapter
  -> required by future Codex adapter
  -> required by future Copilot adapter
  -> required by future OpenCode plugin adapter

Claude adapter
  -> validates the end-to-end installer pattern first

shared .agents/skills adapter
  -> unblocks Codex, Copilot, and OpenCode skill availability before their full adapters land
```

## MVP And Remaining Work

### Shipped today

- Wiki scaffold
- Claude Code adapter
- Shared non-Claude `.agents/skills/` installer
- Shared hook scripts
- Marker-comment instruction merges
- Regression and pack coverage for the canonical skill assets

### Remaining adapter work

- OpenCode plugin adapter: `.opencode/plugins/codewiki.ts`, `.opencode/agents/`, `AGENTS.md`
- Codex hook and instruction adapter: `.codex/hooks.json`, `AGENTS.md`
- Copilot hook and instruction adapter: `.github/hooks/*.json`, `.github/copilot-instructions.md`

## Open Questions

1. What exact stdin payloads do Codex `UserPromptSubmit` and `Stop` deliver in realistic file-edit sessions?
2. Which Copilot payload fields are available at `agentStop` versus `postToolUse` for any future automatic absorb or continuation flow?
3. What runtime payload shape does OpenCode deliver to the plugin hooks when `tool.execute.before`, `file.edited`, and `session.idle` fire in practice?
4. Should any future OpenCode adapter ship a small helper library for the plugin, or keep the plugin as a thin Bun `$` dispatcher only?

## Sources

- `docs/codewiki-project-v2.md`
- `docs/skills-migration-handoff.md`
- `docs/research-reference.md`
- Claude Code hooks and skills docs
- OpenAI Codex hooks and skills docs
- GitHub Copilot hooks docs
- OpenCode plugin and skills docs

---
*Feature research refreshed to the skills + hook-event canon on 2026-04-13*
