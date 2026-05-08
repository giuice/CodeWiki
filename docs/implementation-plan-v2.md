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

- Claude installs the ten skills into `.claude/skills/codewiki-<name>/SKILL.md`
- Codex, Copilot, and OpenCode selections install the same ten skills into `.agents/skills/codewiki-<name>/SKILL.md`
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
| Shared hook installer | `src/lib/shared-hooks.ts` | Copies and chmods `.codewiki/hooks/*.sh` before tool adapters run |
| Codex adapter | `src/lib/adapters/codex.ts` | Full shipped Codex hook, instruction, and agent adapter |
| Copilot adapter | `src/lib/adapters/copilot.ts` | Full shipped Copilot hook, instruction, and agent adapter |
| OpenCode adapter | `src/lib/adapters/opencode.ts` | Full shipped OpenCode plugin, instruction, and agent adapter |
| Copilot agents | `src/templates/copilot/agents/*.agent.md` | GitHub Copilot custom-agent profiles |
| Init entry point | `src/commands/init.ts` | Orchestrates scaffold plus adapters |

### Installed surfaces in user projects

| Tool selection | Skills written | Hooks/instructions/agents written today |
| --- | --- | --- |
| `claude-code` | `.claude/skills/codewiki-<name>/SKILL.md` | Claude hook wiring, Claude agents, `CLAUDE.md` |
| `codex` | `.agents/skills/codewiki-<name>/SKILL.md` | Codex hooks (`.codex/hooks.json`), wrappers, `.codex/config.toml`, `.codex/agents/`, and `AGENTS.md` |
| `copilot` | `.agents/skills/codewiki-<name>/SKILL.md` | Copilot hooks, `.github/agents/`, and `.github/copilot-instructions.md` |
| `opencode` | `.agents/skills/codewiki-<name>/SKILL.md` | OpenCode plugin (`.opencode/plugins/codewiki.ts`), `.opencode/agents/`, and `AGENTS.md` |
| `claude-code` plus any non-Claude tool | Both trees above | Claude adapter plus the selected non-Claude adapters; shared hooks are installed once |

### Shared assets that always matter

- `.codewiki/config.yml`
- `.codewiki/templates/*.md`
- `.codewiki/hooks/pre-wiki-context.sh`
- `.codewiki/hooks/post-verify.sh`
- `.codewiki/hooks/session-end.sh`
- `wiki/raw/`, `.codewiki/tasks/`, and the `wiki/` directory tree

## What `codewiki init` does today

### 1. Scaffold the wiki

The scaffold step creates the shared wiki structure:

```text
.codewiki/
├── config.yml
├── hooks/
├── state/
├── tasks/
└── templates/
wiki/
├── raw/
├── index.md
├── log.md
└── _backlinks.json
```

with the expected templates, shared hook scripts, index/log files, and backlink seed file.

### 2. Install the shipped adapters

Current shipped behavior:

1. Detect requested tools from `--tool` or local markers.
2. Scaffold the wiki and install shared hooks before any tool-specific adapter runs.
3. Install the Claude adapter when Claude Code is selected.
4. Install the shared non-Claude skills adapter when Codex, Copilot, or OpenCode are selected.
5. Install the selected Codex, Copilot, and OpenCode adapters when those tools are selected.
6. Keep the skill payload identical across trees; only the destination directory changes.
7. Preserve existing managed sections unless `--force` is used.
8. Report `Wiki scaffold`, `Shared hooks`, and each selected adapter as separate sections.

### 3. Preserve idempotency

The installer must remain safe to rerun:

- Claude-only reruns keep `.agents/skills/` absent.
- Mixed-tool reruns keep both skill trees intact without duplication.
- `--force` replaces stale managed skill content.
- Managed adapter assets such as skills, hooks, instructions, and agents update on rerun without clobbering unrelated user content.

## Current file map for maintainers

### Core implementation files

| Path | Role |
| --- | --- |
| `src/commands/init.ts` | Parses flags, detects tools, runs scaffold and adapters, prints the install report |
| `src/lib/adapters/index.ts` | Resolves which adapters run for a given tool selection |
| `src/lib/adapters/claude.ts` | Writes `.claude/skills`, `.claude/settings.json`, `.claude/agents`, and `CLAUDE.md` |
| `src/lib/adapters/shared-skills.ts` | Writes `.agents/skills` for non-Claude selections |
| `src/lib/shared-hooks.ts` | Writes executable shared hooks to `.codewiki/hooks` outside tool-specific adapters |
| `src/lib/adapters/codex.ts` | Writes Codex hooks, wrappers, config, agents, and managed `AGENTS.md` instructions |
| `src/lib/adapters/copilot.ts` | Writes Copilot hook config/wrappers, custom agents, and managed Copilot instructions |
| `src/lib/adapters/opencode.ts` | Writes OpenCode plugin, agents, and managed `AGENTS.md` instructions |
| `src/lib/scaffold.ts` | Creates `.codewiki/`, `.codewiki/tasks/`, `wiki/raw/`, and the wiki directory tree |
| `src/templates/adapter-templates.ts` | Reporter/install copy text helpers |

### Canonical content inputs

| Path | Why it matters |
| --- | --- |
| `src/templates/skills/` | Live skill payload copied by the installer |
| `src/templates/hooks/` | Shared hook scripts copied into `.codewiki/hooks/` |
| `src/templates/codex/` | Codex hook config, wrappers, agents, and instructions |
| `src/templates/copilot/` | Copilot hook config/wrappers, agents, and instructions |
| `src/templates/opencode/` | OpenCode plugin, agents, and instructions |
| `docs/prompts/create-prd.md` | Source text lineage for `codewiki-prd` |
| `docs/prompts/generate-tasks.md` | Source text lineage for `codewiki-tasks` |
| `docs/prompts/process-task-list.md` | Source text lineage for `codewiki-process` |
| `docs/skills/wiki.md` | Skill file-format reference only, not a packaging template |

## Verification surface

### Tests that currently lock the installer and hook canon

| File | What it proves |
| --- | --- |
| `test/init.test.ts` | Tool installs write expected skill trees, shared hooks, adapters, and managed instructions without duplication |
| `test/pack.test.ts` | `dist/templates/skills/codewiki-ingest/SKILL.md` is included in the packaged tarball |
| `test/planning-docs-canon.test.ts` | Planning docs reference the canonical skill paths consistently |
| `src/templates/__tests__/hooks.test.ts` | Shared hook schema, dedupe, debug, and shell compatibility behavior |
| `src/templates/__tests__/session-end.test.ts` | Lifecycle state schema, diff hashing, and `.codewiki/state/**` exclusion behavior |
| `src/templates/__tests__/*adapter.test.ts` | Host-specific template contracts for Codex, Copilot, and OpenCode |

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

The skills canon and the four shipped adapters are in place. Remaining work is publish hardening and ongoing host-runtime verification as upstream tools evolve.

### Phase 6: OpenCode adapter — Complete (shipped in v0.2.x)

- ✅ OpenCode-specific hook/plugin packaging
- ✅ OpenCode instruction-file integration (`AGENTS.md`)
- ✅ OpenCode agent packaging (`.opencode/agents/`)

### Phase 7: Codex and Copilot adapters — Complete (shipped in v0.2.x)

- ✅ Codex-specific hook configuration (`.codex/hooks.json`), `.codex/config.toml` feature enablement, wrapper scripts, and instruction-file integration (`AGENTS.md`)
- ✅ Codex hook model: `UserPromptSubmit` for prompt-level context, `PostToolUse` on `Edit|Write|apply_patch` through a JSON-emitting wrapper, and `Stop` through a loop-safe JSON-emitting wrapper. A dormant `PreToolUse` wrapper ships for opt-in guardrails but is not wired by default.
- ✅ Copilot-specific hook configuration and instruction-file integration (`.github/copilot-instructions.md`)
- ✅ Copilot custom-agent profiles (`.github/agents/`)

### Phase 8: npm publish hardening

- Keep build and tarball checks aligned with the canonical template tree
- Preserve the zero-runtime-dependency installer pattern
- Keep README and docs aligned with the shipped adapter surface

## Documentation alignment

The current doc set should stay in sync with the implementation above:

- `README.md` and `README.pt-BR.md` explain the installer as a ten-skill product with `.claude/skills` and `.agents/skills` as the live install surface.
- `docs/codewiki-project-v2.md` describes the canonical architecture and shipped adapter behavior.
- `docs/hook-compatibility-matrix.md` records the host-by-host hook events, output contracts, dedupe behavior, and default policies.
- `docs/prompts/*.md` are lineage references only, but should still mirror the current task directory, no-auto-commit boundary, and phase/task workflow.

## Superseded background

Early v2 planning assumed a flat command-directory install model. That is no longer live guidance. The current implementation canon is:

- portable source templates under `src/templates/skills/codewiki-<name>/SKILL.md`
- Claude installs under `.claude/skills/`
- non-Claude selections install under `.agents/skills/`

If you need the older migration narrative, use git history or the completed phase artifacts in `.planning/`. Do not revive deprecated path assumptions in new code or docs.
