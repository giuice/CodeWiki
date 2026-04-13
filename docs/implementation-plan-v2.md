# CodeWiki v2 - Implementation Plan

> **Audience:** Developers extending or maintaining the installer.
> **Reference PRD:** `docs/codewiki-project-v2.md`
> **Status:** Updated to the skills canon after Phases 4.1.1-4.1.5. This is now a live implementation map, not a pre-migration checklist.

## Overview

CodeWiki v2 is an installer-only CLI. `codewiki init` scaffolds the wiki and copies portable prompt assets into the right tool-specific locations. The CLI does not run wiki logic at runtime. All intelligence lives in:

- skill files under `src/templates/skills/codewiki-<name>/SKILL.md`
- shared hook scripts under `src/templates/hooks/`
- tool-specific adapters under `src/lib/adapters/`

The current codebase has already completed the skills-canon migration:

- Claude installs the eight skills into `.claude/skills/codewiki-<name>/SKILL.md`
- Codex, Copilot, and OpenCode selections install the same eight skills into `.agents/skills/codewiki-<name>/SKILL.md`
- Mixed selections that include Claude write both trees
- Pack and init regression coverage verify the canonical skill assets

## Canonical install surfaces

### Source of truth in this repository

| Surface | Canonical path | Notes |
| --- | --- | --- |
| Shared skill template | `src/templates/skills/codewiki-<name>/SKILL.md` | One directory per logical skill |
| Shared hooks | `src/templates/hooks/*.sh` | Portable shell scripts reused by adapters |
| Claude adapter | `src/lib/adapters/claude.ts` | Full shipped adapter |
| Shared non-Claude skills adapter | `src/lib/adapters/shared-skills.ts` | Ships the `.agents/skills/` tree |
| Init entry point | `src/commands/init.ts` | Orchestrates scaffold plus adapters |

### Installed surfaces in user projects

| Tool selection | Skills written | Hooks/instructions/agents written today |
| --- | --- | --- |
| `claude-code` | `.claude/skills/codewiki-<name>/SKILL.md` | Claude hook wiring, Claude agents, `CLAUDE.md` |
| `codex` | `.agents/skills/codewiki-<name>/SKILL.md` | Not yet; planned future adapter work |
| `copilot` | `.agents/skills/codewiki-<name>/SKILL.md` | Not yet; planned future adapter work |
| `opencode` | `.agents/skills/codewiki-<name>/SKILL.md` | Not yet; planned future adapter work |
| `claude-code` plus any non-Claude tool | Both trees above | Claude adapter today, shared non-Claude skills today |

### Shared assets that always matter

- `.codewiki/config.yml`
- `.codewiki/templates/*.md`
- `.codewiki/hooks/pre-wiki-context.sh`
- `.codewiki/hooks/post-verify.sh`
- `.codewiki/hooks/session-end.sh`
- `raw/`, `tasks/`, and the `wiki/` directory tree

## What `codewiki init` does today

### 1. Scaffold the wiki

The scaffold step creates the shared wiki structure:

```text
.codewiki/
raw/
tasks/
wiki/
```

with the expected templates, hook scripts, index/log files, and backlink seed file.

### 2. Install the shipped adapters

Current shipped behavior:

1. Detect requested tools from `--tool` or local markers.
2. Install the Claude adapter when Claude Code is selected.
3. Install the shared non-Claude skills adapter when Codex, Copilot, or OpenCode are selected.
4. Keep the skill payload identical across trees; only the destination directory changes.
5. Preserve existing managed sections unless `--force` is used.

### 3. Preserve idempotency

The installer must remain safe to rerun:

- Claude-only reruns keep `.agents/skills/` absent.
- Mixed-tool reruns keep both skill trees intact without duplication.
- `--force` replaces stale managed skill content.
- Shared-skills reporting is explicit about what is installed today versus what is still pending.

## Current file map for maintainers

### Core implementation files

| Path | Role |
| --- | --- |
| `src/commands/init.ts` | Parses flags, detects tools, runs scaffold and adapters, prints the install report |
| `src/lib/adapters/index.ts` | Resolves which adapters run for a given tool selection |
| `src/lib/adapters/claude.ts` | Writes `.claude/skills`, `.claude/settings.json`, `.claude/agents`, and `CLAUDE.md` |
| `src/lib/adapters/shared-skills.ts` | Writes `.agents/skills` for non-Claude selections |
| `src/lib/scaffold.ts` | Creates `.codewiki/`, `raw/`, `tasks/`, and `wiki/` |
| `src/templates/adapter-templates.ts` | Reporter/install copy text helpers |

### Canonical content inputs

| Path | Why it matters |
| --- | --- |
| `src/templates/skills/` | Live skill payload copied by the installer |
| `src/templates/hooks/` | Shared hook scripts copied into `.codewiki/hooks/` |
| `docs/prompts/create-prd.md` | Source text lineage for `codewiki-prd` |
| `docs/prompts/generate-tasks.md` | Source text lineage for `codewiki-tasks` |
| `docs/prompts/process-task-list.md` | Source text lineage for `codewiki-process` |
| `docs/skills/wiki.md` | Skill file-format reference only, not a packaging template |

## Verification surface

### Tests that currently lock the skills canon

| File | What it proves |
| --- | --- |
| `test/init.test.ts` | Claude-only installs write `.claude/skills`, mixed installs write both trees, reruns remain idempotent |
| `test/pack.test.ts` | `dist/templates/skills/codewiki-ingest/SKILL.md` is included in the packaged tarball |
| `test/planning-docs-canon.test.ts` | Planning docs reference the canonical skill paths consistently |

### Recommended smoke checks

```bash
# Claude-only install
tmpdir=$(mktemp -d)
cd "$tmpdir"
node /path/to/dist/bin/codewiki.js init --tool claude-code --name test-project
find .claude/skills -maxdepth 2 -name SKILL.md | sort
test ! -d .agents/skills

# Mixed Claude + Codex install
tmpdir2=$(mktemp -d)
cd "$tmpdir2"
node /path/to/dist/bin/codewiki.js init --tool claude-code,codex --name test-project
find .claude/skills -maxdepth 2 -name SKILL.md | sort
find .agents/skills -maxdepth 2 -name SKILL.md | sort

# Pack asset verification
npm run build
npm test
```

## Remaining roadmap work

The skills canon is in place. The remaining implementation work is now about the non-Claude adapters, not about where skills live.

### Phase 6: OpenCode adapter

- Add OpenCode-specific hook/plugin packaging
- Add OpenCode instruction-file integration
- Add OpenCode agent packaging

### Phase 7: Codex and Copilot adapters

- Add Codex-specific hook configuration and instruction-file integration
- Add Copilot-specific hook configuration and instruction-file integration
- Package any tool-specific agent surfaces that remain worth shipping

### Phase 8: npm publish hardening

- Keep build and tarball checks aligned with the canonical template tree
- Preserve the zero-runtime-dependency installer pattern
- Keep README and docs aligned with the shipped adapter surface

## Documentation alignment

The current doc set should stay in sync with the implementation above:

- `README.md` explains the installer as an eight-skill product with `.claude/skills` and `.agents/skills` as the live install surface
- `docs/codewiki-project-v2.md` describes the canonical architecture and separates shipped behavior from future adapter work
- `docs/skills-migration-handoff.md` is now a reference explaining why the dual-tree skill layout exists

## Superseded background

Early v2 planning assumed a flat command-directory install model. That is no longer live guidance. The current implementation canon is:

- portable source templates under `src/templates/skills/codewiki-<name>/SKILL.md`
- Claude installs under `.claude/skills/`
- non-Claude selections install under `.agents/skills/`

If you need the older migration narrative, use git history or the completed phase artifacts in `.planning/`. Do not revive deprecated path assumptions in new code or docs.
