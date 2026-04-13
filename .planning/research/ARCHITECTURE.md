# Architecture Research

**Domain:** CLI installer for AI coding tool integrations
**Originally researched:** 2026-04-07
**Canonicalized:** 2026-04-13
**Confidence:** HIGH for the shipped installer architecture; MEDIUM for future non-Claude runtime payload handling

## System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│ CLI LAYER                                                   │
│ npx codewiki init [--tool] [--force] [--name]               │
├──────────────────────────────────────────────────────────────┤
│ DETECT  ->  SCAFFOLD  ->  INSTALL ADAPTERS  ->  REPORT      │
├──────────────────────────────────────────────────────────────┤
│ SOURCE TEMPLATES                                            │
│ src/templates/skills/codewiki-<name>/SKILL.md              │
│ src/templates/hooks/*.sh                                    │
│ src/templates/claude/agents/*.md                            │
│ src/templates/claude/instructions.md                        │
└──────────────────────────────────────────────────────────────┘

              ▼ installed into target project ▼

┌──────────────────────────────────────────────────────────────┐
│ WIKI LAYER                                                  │
│ wiki/, raw/, tasks/, .codewiki/config.yml                   │
├──────────────────────────────────────────────────────────────┤
│ SHARED TOOL ASSETS                                          │
│ .codewiki/hooks/*.sh                                        │
│ .agents/skills/codewiki-<name>/SKILL.md                     │
├──────────────────────────────────────────────────────────────┤
│ TOOL-SPECIFIC SURFACES                                      │
│ Claude:   .claude/skills/, .claude/settings.json, agents    │
│ Codex:    .codex/hooks.json, AGENTS.md                      │
│ Copilot:  .github/hooks/*.json, copilot-instructions.md     │
│ OpenCode: .opencode/plugins/codewiki.ts, .opencode/agents/  │
└──────────────────────────────────────────────────────────────┘
```

## Canonical Install Surfaces

| Surface | Canonical path | Status |
|---------|----------------|--------|
| Skill source templates | `src/templates/skills/codewiki-<name>/SKILL.md` | Shipped |
| Shared hook scripts | `src/templates/hooks/*.sh` -> `.codewiki/hooks/*.sh` | Shipped |
| Claude installed skills | `.claude/skills/codewiki-<name>/SKILL.md` | Shipped |
| Shared non-Claude installed skills | `.agents/skills/codewiki-<name>/SKILL.md` | Shipped |
| Claude hook config | `.claude/settings.json` | Shipped |
| OpenCode plugin adapter | `.opencode/plugins/codewiki.ts` | Planned |
| Codex hook config | `.codex/hooks.json` | Planned |
| Copilot hook config | `.github/hooks/*.json` | Planned |

## Component Responsibilities

| Component | Responsibility | Current location |
|-----------|----------------|------------------|
| CLI entry point | Parse flags and route to `init` | `src/bin/codewiki.ts` |
| Tool detector | Check for supported-tool markers | `src/lib/detect.ts` |
| Wiki scaffolder | Create shared project structure | `src/lib/scaffold.ts` |
| Claude adapter | Install Claude-specific skills, hooks, agents, and instructions | `src/lib/adapters/claude.ts` |
| Shared non-Claude skills adapter | Install `.agents/skills/` once for Codex, Copilot, and OpenCode selections | `src/lib/adapters/shared-skills.ts` |
| Merge utilities | Deep-merge JSON and replace marker sections | `src/lib/merge.ts` |
| Reporter | Render installed versus pending surfaces | `src/lib/reporter.ts` |

## Runtime Event Model

| Tool | Trigger model | CodeWiki implication |
|------|---------------|----------------------|
| Claude Code | `PreToolUse` and `PostToolUse` on `Write|Edit` | Direct file-edit interception works |
| Codex | `PreToolUse` and `PostToolUse` are Bash-only; `UserPromptSubmit` and `Stop` are broadly usable | CodeWiki falls back to prompt-level and turn-end hooks |
| Copilot | `preToolUse`, `postToolUse`, `agentStop`, `sessionEnd` | Use `preToolUse`/`postToolUse` for tool hooks and reserve `agentStop` for meaningful post-turn follow-up |
| OpenCode | Plugin events `tool.execute.before`, `file.edited`, `session.idle` | Implement a thin plugin dispatcher rather than JSON hook config |

## `init` Data Flow

```text
parse flags
  -> detect selected tools
  -> scaffold wiki and shared assets
  -> install Claude adapter if selected
  -> install shared non-Claude skills adapter if any non-Claude tool is selected
  -> install future tool-specific adapters as they exist
  -> print structured report
```

## Adapter Design Rules

1. Keep the skill corpus shared and portable.
2. Move tool-specific differences into small adapters, not into duplicated prompt content.
3. Keep `.codewiki/hooks/*.sh` as the shared logic layer.
4. Use the lightest tool-specific dispatcher necessary:
   - JSON hook config for Claude, Codex, and Copilot
   - TypeScript plugin dispatcher for OpenCode
5. Report pending integration work explicitly so mixed-tool installs are honest about what shipped.

## Architecture Implications For Future Work

### OpenCode

- Do not create a dedicated OpenCode-only skill tree as the canonical install surface.
- Build `.opencode/plugins/codewiki.ts` as a thin dispatcher that shells out to `.codewiki/hooks/*.sh`.
- Treat `session.idle` as turn-end or idle, not teardown.

### Codex

- Do not research skill paths again; `.agents/skills/` is already the canon.
- Focus on `.codex/hooks.json` and `AGENTS.md`.
- Design the adapter around `UserPromptSubmit` and `Stop`.

### Copilot

- Do not add a separate `.github/skills/` tree in v1.
- Focus on `.github/hooks/*.json` and `.github/copilot-instructions.md`.
- Treat `agentStop` as the meaningful post-turn lifecycle event and `sessionEnd` as cleanup-only.

## Sources

- `docs/codewiki-project-v2.md`
- `docs/skills-migration-handoff.md`
- `docs/research-reference.md`

---
*Architecture research refreshed to the canonical skills + hook-event model on 2026-04-13*
