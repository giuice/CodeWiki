# CodeWiki Skills Migration Reference

**Originally created:** 2026-04-11
**Current role:** Historical reference for the skills-canon migration and the dual-tree install decision
**Supersedes:** `docs/docs-reconciliation-handoff.md`

This file is no longer an urgent handoff for an unfinished migration. The migration itself has already landed across the template tree, installer surfaces, regression coverage, planning docs, and product docs. Keep this document as the compact explanation of why the dual-tree skill layout exists and which milestones established it.

## Current status

The skills-canon migration is complete through Phase 04.1.5:

- `src/templates/skills/codewiki-<name>/SKILL.md` is the source of truth for the eight CodeWiki skills
- Claude installs `.claude/skills/codewiki-<name>/SKILL.md`
- Codex, Copilot, and OpenCode selections install `.agents/skills/codewiki-<name>/SKILL.md`
- Mixed selections that include Claude Code write both trees
- README, the v2 PRD, the implementation plan, and this reference now use the same canon

**SM-06 status:** Complete. Product-facing docs now describe the shipped skills surface and the dual-tree rule consistently.

## The canonical rule

> **CodeWiki installs eight Skills, one per logical workflow.** Not a bundled mega-skill and not a flat command-file surface. Each workflow ships as its own `SKILL.md` so tools only load the prompt they need.

Canonical skill set:

- `codewiki-ingest`
- `codewiki-query`
- `codewiki-lint`
- `codewiki-absorb`
- `codewiki-breakdown`
- `codewiki-prd`
- `codewiki-tasks`
- `codewiki-process`

`docs/skills/wiki.md` remains a file-format reference only. It does not define CodeWiki's packaging model.

## Why the dual tree exists

The dual tree is the minimum layout that covers the verified discovery split between Claude and non-Claude tools.

| Tool | Reads `.claude/skills/` | Reads `.agents/skills/` | Canonical CodeWiki target |
| --- | :---: | :---: | --- |
| Claude Code | ✅ | ❌ | `.claude/skills/codewiki-<name>/SKILL.md` |
| Codex | ❌ | ✅ | `.agents/skills/codewiki-<name>/SKILL.md` |
| Copilot | ✅ | ✅ | `.agents/skills/codewiki-<name>/SKILL.md` in v1; add `.claude/skills/` too when Claude is selected |
| OpenCode | ✅ | ✅ | `.agents/skills/codewiki-<name>/SKILL.md` in v1; add `.claude/skills/` too when Claude is selected |

That leads to one rule:

- Claude-only selections write `.claude/skills/` only
- Non-Claude-only selections write `.agents/skills/` only
- Mixed selections that include Claude Code write both trees

The project deliberately does not add third or fourth duplicated skill trees in v1 when they do not solve the Claude versus Codex discovery split.

## What shipped versus what remains

### Shipped now

- Portable source templates under `src/templates/skills/codewiki-<name>/SKILL.md`
- Claude adapter writing `.claude/skills/`, `.claude/settings.json`, `.claude/agents/`, and `CLAUDE.md`
- Shared non-Claude skills adapter writing `.agents/skills/`
- Regression coverage proving Claude-only installs leave `.agents/skills/` absent and mixed installs write both trees
- Tarball coverage proving canonical skill assets are packaged under `dist/templates/skills/`
- Planning and product docs aligned to the skills canon

### Still future work

- Codex-specific hook and instruction integration
- Copilot-specific hook and instruction integration
- OpenCode-specific hook/plugin, instruction, and agent integration

Those roadmap items are adapter-completion work, not another install-surface migration.

## Historical milestones

| Scope | Evidence |
| --- | --- |
| Canon correction established | `96ada8a` reframed the v2 PRD around eight Skills and the dual-tree rationale |
| Requirements rewired to the canon | `5449b74` updated requirements language and supporting PRD precision |
| Skill templates moved to the canonical tree | Phase 04.1.1 |
| Installer wrote `.claude/skills/` and `.agents/skills/` correctly | Phase 04.1.2 |
| Regression and pack coverage locked the new paths | Phase 04.1.3 |
| Planning docs adopted the same canon | Phase 04.1.4 |
| Product docs and this reference adopted the same canon | Phase 04.1.5 |

## Practical guidance for future maintainers

- Start from `src/templates/skills/codewiki-<name>/SKILL.md` whenever you change prompt behavior.
- Treat `.claude/skills/` and `.agents/skills/` as the live install surfaces unless a future adapter phase proves a broader canonical layout.
- Keep README, `docs/codewiki-project-v2.md`, `docs/implementation-plan-v2.md`, and `.planning/` artifacts aligned whenever the shipped installer surface changes.
- Preserve the distinction between "shared non-Claude skills ship today" and "full non-Claude adapters remain future work."

## Historical note

Earlier drafts of the migration described an outdated flat command-era install model and framed the remaining work as an urgent code migration. That framing is intentionally retired here. Use git history or completed phase artifacts if you need the original chronology, but do not revive deprecated install-surface language in live docs or code.
