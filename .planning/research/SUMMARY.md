# Project Research Summary

**Project:** CodeWiki v2
**Domain:** npm CLI installer for AI coding tool integrations
**Originally researched:** 2026-04-07
**Canonicalized:** 2026-04-13
**Confidence:** HIGH for the shipped installer surface; MEDIUM for non-Claude runtime event payload details that still need live validation

## Executive Summary

CodeWiki v2 is an installer-only CLI that scaffolds a wiki structure and installs native AI-tool assets into a project. The canonical architecture is now stable:

- source templates live under `src/templates/skills/codewiki-<name>/SKILL.md`
- Claude installs `.claude/skills/codewiki-<name>/SKILL.md`
- Codex, Copilot, and OpenCode install `.agents/skills/codewiki-<name>/SKILL.md`
- shared hook scripts ship in `.codewiki/hooks/`
- Claude is the only fully shipped adapter today; the other tools still need their tool-specific hook, instruction, agent, or plugin adapters

The main remaining uncertainty is no longer where skills live. That question is resolved. The remaining uncertainty is how each non-Claude tool's runtime event payload behaves in real sessions.

## Key Findings

### Install Surface

The skill canon is settled:

- CodeWiki ships eight standalone Skills, not a bundled mega-skill and not flat slash-command files
- `src/templates/skills/codewiki-<name>/SKILL.md` is the only source of truth in this repository
- `.claude/skills/` is required for Claude Code
- `.agents/skills/` is the shared non-Claude tree for Codex, Copilot, and OpenCode

This dual-tree layout is the minimum structure that satisfies the verified discovery split between Claude and Codex while keeping the repo layout simple.

### Hook/Event Model

The per-tool hook model must follow the host's real event surface:

- Claude Code uses `.claude/settings.json` with `PreToolUse` and `PostToolUse` on `Write|Edit`
- Codex uses `.codex/hooks.json`, but CodeWiki's design must rely on `UserPromptSubmit` and `Stop` because `PreToolUse` and `PostToolUse` are Bash-only
- Copilot uses `.github/hooks/*.json` with `preToolUse` and `postToolUse`; `agentStop` is the meaningful post-turn hook and `sessionEnd` is cleanup-only
- OpenCode uses `.opencode/plugins/codewiki.ts`, not `opencode.json` hook wiring; the plugin should dispatch `tool.execute.before`, `file.edited`, and `session.idle`

### Architecture

The installer still follows the same high-level pipeline:

1. Detect tools
2. Scaffold the wiki
3. Install shipped adapters
4. Report installed versus pending surfaces

The important adjustment is that the shared non-Claude skill tree already ships today, so future phases focus on tool-specific hook, plugin, instruction, and agent integration rather than skill-path research.

## Primary Risks

1. **Docs drift back to the command-era model.** The biggest current documentation risk is reintroducing legacy command-era paths or the deprecated OpenCode JSON-hook model as if they were still canonical.
2. **Incorrect event mapping in future adapters.** Codex, Copilot, and OpenCode all expose different runtime semantics. A wrong event choice will produce subtle misbehavior even if the config file parses.
3. **Published tarball misses prompt assets.** This remains a standing build risk even though the current pack tests already cover the canonical skill assets.
4. **Hook scripts assume one JSON payload shape.** Live adapter work still needs sample payload validation for non-Claude tools.

## Implications For The Roadmap

### Phase 6: OpenCode

The OpenCode phase should no longer plan around a dedicated OpenCode-only skill tree or the deprecated JSON-hook model. The current target is:

- shared `.agents/skills/`
- `.opencode/plugins/codewiki.ts`
- `.opencode/agents/`
- `AGENTS.md`
- event handling through `tool.execute.before`, `file.edited`, and `session.idle`

### Phase 7: Codex And Copilot

The Codex and Copilot phases no longer need a skill-path spike. Their remaining work is:

- Codex: `.codex/hooks.json` plus `AGENTS.md`
- Copilot: `.github/hooks/*.json` plus `.github/copilot-instructions.md`
- both: keep reusing the shared `.agents/skills/` tree

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Skill install canon | HIGH | Dual-tree layout is already implemented and test-covered |
| Claude adapter | HIGH | Fully shipped and regression-covered |
| Codex hook strategy | MEDIUM | Event choice is documented, but live payload validation still matters |
| Copilot hook strategy | MEDIUM | Docs are clear on the events; live adapter payload usage still needs confirmation |
| OpenCode plugin strategy | MEDIUM | Event names are documented; actual runtime payload structure still needs validation |

## Remaining Validation Work

- Capture live Codex payloads for `UserPromptSubmit` and `Stop`
- Capture live Copilot payloads for `postToolUse` and `agentStop`
- Capture live OpenCode plugin payloads for `tool.execute.before`, `file.edited`, and `session.idle`
- Keep grep-based regression checks so live docs never drift back to superseded command-era paths

## Sources

### Canonical internal sources

- `docs/codewiki-project-v2.md`
- `docs/skills-migration-handoff.md`
- `docs/research-reference.md`

### Vendor sources

- Claude Code hooks and skills docs
- OpenAI Codex hooks and skills docs
- GitHub Copilot hooks docs
- OpenCode plugin and skills docs

---
*Research summary refreshed to the canonical skills + hook-event model on 2026-04-13*
