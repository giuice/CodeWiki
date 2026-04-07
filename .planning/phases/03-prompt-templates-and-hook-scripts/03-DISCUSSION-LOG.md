# Phase 3: Prompt Templates and Hook Scripts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 03-prompt-templates-and-hook-scripts
**Areas discussed:** Prompt adaptation strategy, New command content, Hook script logic, Agent definitions

---

## Prompt Adaptation Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| GSD-inspired structure | Use structured tags, tool hints, clear gates — keep CodeWiki domain language | ✓ |
| Light touch | Keep original prose, add frontmatter only | |
| Full GSD port | Multi-agent orchestration, checkpoints, full workflow | |

**User's choice:** GSD-inspired structure with multi-agent orchestration and subagent spawning. No checkpoint files, no auto-commits — user controls git.
**Notes:** User explicitly wants multi-agent patterns from GSD but rejects checkpoint files and behind-the-scenes git commits.

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve all gates | Keep clarifying questions, "Go" confirmation, one-at-a-time | |
| Simplify gates | Keep major gates, remove per-subtask approval | |
| User choice | Offer as option at invocation time | ✓ |

**User's choice:** Make interaction gates a user choice — mentorship mode vs fast mode.

| Option | Description | Selected |
|--------|-------------|----------|
| /codewiki-prd: parallel research | Spawn agents for codebase, architecture, dependencies | ✓ |
| /codewiki-tasks: analyze + generate | Split analysis and generation across agents | ✓ |
| /codewiki-process: subtask executor | Focused subagent per subtask | ✓ |
| None — single-agent | Keep it simple | |

**User's choice:** All three commands get multi-agent orchestration.

## New Command Content (ingest, query, lint)

| Option | Description | Selected |
|--------|-------------|----------|
| Full wiki extraction | Extract entities/decisions/lessons/issues, cross-reference, propose pages | ✓ |
| Simple digest | Single raw/ summary file | |
| You decide | Claude designs | |

**User's choice:** Full wiki extraction for /codewiki-ingest

| Option | Description | Selected |
|--------|-------------|----------|
| Wiki-grounded search | Read index.md first, find pages, synthesize citing entries | ✓ |
| Simple file search | Grep and return files | |
| You decide | Claude designs | |

**User's choice:** Wiki-grounded search for /codewiki-query

| Option | Description | Selected |
|--------|-------------|----------|
| Full wiki health check | Contradictions, orphans, stale content, drift | ✓ |
| Structure only | Link resolution and template checks | |
| You decide | Claude designs | |

**User's choice:** Full health check for /codewiki-lint

## Hook Script Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Index + relevant pages | Read index.md, grep related terms, output summaries | ✓ |
| Index only | Just cat wiki/index.md | |
| You decide | Claude picks | |

**User's choice:** Index + relevant pages for pre-wiki-context.sh

| Option | Description | Selected |
|--------|-------------|----------|
| Entity match reminder | Parse JSON for modified paths, match wiki entities | ✓ |
| Generic reminder | Always output generic wiki reminder | |
| You decide | Claude picks | |

**User's choice:** Entity match reminder for post-verify.sh

## Agent Definitions

| Option | Description | Selected |
|--------|-------------|----------|
| Diff-aware proposals | Read code changes, identify entities, propose edits with before/after | ✓ |
| Batch proposals | Scan entire codebase vs wiki | |
| You decide | Claude designs | |

**User's choice:** Diff-aware proposals for wiki-updater

| Option | Description | Selected |
|--------|-------------|----------|
| Cross-reference check | Verify no contradictions, validate links, ensure index updates | ✓ |
| Simple consistency | Template structure and link resolution only | |
| You decide | Claude designs | |

**User's choice:** Cross-reference check for verifier

## Claude's Discretion

- Internal prompt wording and example content
- Specific grep patterns in hook scripts
- Agent instruction formatting details

## Deferred Ideas

None — discussion stayed within phase scope
