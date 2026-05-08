# Hook Compatibility Matrix

> **Purpose:** Single reference for what CodeWiki hooks do per host, which events fire, how the host processes output, what can go wrong, and the default policy shipped by the installer.
> **Audience:** Developers extending adapters, auditors verifying behavior, and maintainers deciding default policies.
> **Scope:** Claude Code, Codex, Copilot, and OpenCode. Only events that CodeWiki actually wires are listed.

## Legend

| Column | Meaning |
| --- | --- |
| **Host** | The AI tool or runtime where the hook runs. |
| **Event** | The canonical event name the host exposes. |
| **Trigger** | When the event fires in the host lifecycle. |
| **Output processed by host** | What the host does with stdout / return value from the hook. |
| **Risk** | What can break or surprise you. |
| **CodeWiki default policy** | What the installer configures out of the box. |

---

## Observable CodeWiki Contract

Regardless of host event names, installed CodeWiki hooks are silent sensors by default:

- prompt context is filtered to explicit CodeWiki/wiki workflow intent and deduped under `.codewiki/state/`;
- pending absorb state is written to `.codewiki/state/pending-absorb.jsonl` with host, event, reason, files, topic candidates, and payload/diff hash fields;
- repeated post-edit and lifecycle signals are deduped by host, event, files, and hash;
- lifecycle diff/hash inputs exclude `.codewiki/state/**`, so tracked state files cannot cause self-amplifying lifecycle records;
- wrappers dispatch shared scripts with POSIX `sh` and set `CODEWIKI_HOOK_HOST` / `CODEWIKI_HOOK_EVENT` before calling them;
- updater/verifier follow-up is performed by CodeWiki skills or explicit agent invocation, not directly by hooks.

## Claude Code

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `PreToolUse` (`Edit`\|`Write`) | Before file edit | Plain stdout → user context | May be skipped if matcher misses; no blocking | Advisory short context only |
| `PostToolUse` (`Edit`\|`Write`) | After file edit | Plain stdout → user context | Same delivery risk as `PreToolUse` | Silent deduped state record to `.codewiki/state/` |
| `SessionEnd` | Session termination | Not wired in v1 | Fires after agent is gone; not useful for follow-up | Dormant — use explicit `codewiki-absorb`; `session-end.sh` still ships as a shared asset |

---

## Codex

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `UserPromptSubmit` | Before each prompt | Plain stdout → developer context | Stdout size limits; may be truncated | Filtered and deduped short wiki context only for wiki-relevant prompts |
| `PostToolUse` (`Edit`\|`Write`\|`apply_patch`) | After file edit | JSON wrapper stdout → `{}` by default or debug context | Wrapper must emit valid JSON; malformed JSON may error | Silent deduped state record; debug mode may emit context |
| `Stop` | Per turn / loop detection | JSON `{"decision":"block"\|"allow"}` | `stop_hook_active` loop if not respected; blocking may annoy user | `{}` (allow) by default; deduped lifecycle state; respect `stop_hook_active` |

---

## Copilot

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `preToolUse` | Before tool execution | JSON wrapper → `additionalContext` (host-dependent) | Cloud vs VS Code vs CLI vs SDK differ; not guaranteed | Advisory short context only |
| `postToolUse` | After tool execution | JSON wrapper → `additionalContext` (host-dependent) | Same runtime variance | Silent deduped state record; debug mode may emit `additionalContext` |
| `agentStop` | After agent turn | JSON `{"decision":"allow"\|"block"}` | May not reach agent in all runtimes | `{"decision":"allow"}` by default; deduped lifecycle state; block only in debug |
| `sessionEnd` | Session cleanup | Terminal / cleanup-only | Output ignored by agent | Redirect to `/dev/null`; sets `host=copilot`, `event=sessionEnd`; deduped lifecycle state only |

---

## OpenCode

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `tool.execute.before` | Before tool execution | Plugin return value → context | Plugin must be loaded; child process is bounded | Advisory short context via `codewikiContext`; `event=tool.execute.before` |
| `file.edited` | After file edit | Plugin return value → context | Same as above | Silent deduped state record via `codewikiContext`; `event=file.edited` |
| `session.idle` | After run completes / idle | Plugin return value → context | Not true teardown; status transition only | Deduped turn-end state signal; not teardown; `event=session.idle` |

---

## Cross-host comparison

| Concern | Claude Code | Codex | Copilot | OpenCode |
| --- | --- | --- | --- | --- |
| **Context delivery channel** | Plain stdout | Plain stdout / JSON wrapper | JSON wrapper → `additionalContext` | Plugin return value |
| **Blocking capability** | None | `Stop` hook JSON | `agentStop` JSON | None |
| **Pre-tool guardrail viable?** | Yes (stdout) | Not wired by default | Yes (JSON wrapper, host-dependent) | Yes (return value) |
| **Silent-by-default?** | Yes | Yes | Yes | Yes |
| **Debug mode available?** | Via `CODEWIKI_HOOK_DEBUG` | Via `CODEWIKI_HOOK_DEBUG` | Via `CODEWIKI_HOOK_DEBUG` | Via `CODEWIKI_HOOK_DEBUG` |
| **Shared script launcher** | `sh` from Claude command config | `sh` through Codex wrappers | `sh` through Copilot wrappers/config | Node `spawn("sh", ...)` with timeout |
| **Runtime variance risk** | Low (single runtime) | Low (single runtime) | **High** (cloud vs local) | Low (single runtime) |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-05-08 | Documented `sh` dispatch, host/event normalization for Copilot/OpenCode, lifecycle state exclusion, and OpenCode timeout guard. |
| 2026-05-06 | Normalized hooks as silent sensors, removed default Codex `PreToolUse`, documented prompt-context filtering/dedupe and pending-event dedupe. |
| 2026-05-05 | Initial matrix extracted from `docs/codewiki-project-v2.md` §6.1 and expanded into standalone artifact per audit gap 3. |
