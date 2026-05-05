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

## Claude Code

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `PreToolUse` (`Edit`\|`Write`) | Before file edit | Plain stdout → user context | May be skipped if matcher misses; no blocking | Advisory short context only |
| `PostToolUse` (`Edit`\|`Write`) | After file edit | Plain stdout → user context | Same delivery risk as `PreToolUse` | Silent state record to `.codewiki/state/` |
| `SessionEnd` | Session termination | Not wired in v1 | Fires after agent is gone; not useful for follow-up | Dormant — use explicit `codewiki-absorb` |

---

## Codex

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `UserPromptSubmit` | Before each prompt | Plain stdout → developer context | Stdout size limits; may be truncated | Short wiki context only for wiki-relevant prompts |
| `PreToolUse` (`Edit`\|`Write`\|`apply_patch`) | Before file edit | **Ignored** — no stdout delivery to agent | Agent never sees output; do not rely on context | Guardrail-only; no context emission |
| `PostToolUse` (`Edit`\|`Write`\|`apply_patch`) | After file edit | JSON wrapper stdout → continuation or context | Wrapper must emit valid JSON; malformed JSON may error | Silent state record; debug mode may emit context |
| `Stop` | Per turn / loop detection | JSON `{"decision":"block"\|"allow"}` | `stop_hook_active` loop if not respected; blocking may annoy user | `{}` (allow) by default; respect `stop_hook_active` |

---

## Copilot

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `preToolUse` | Before tool execution | JSON wrapper → `additionalContext` (host-dependent) | Cloud vs VS Code vs CLI vs SDK differ; not guaranteed | Advisory short context only |
| `postToolUse` | After tool execution | JSON wrapper → `additionalContext` (host-dependent) | Same runtime variance | Silent state record; debug mode may emit `additionalContext` |
| `agentStop` | After agent turn | JSON `{"decision":"allow"\|"block"}` | May not reach agent in all runtimes | `{"decision":"allow"}` for common pendency; block only in debug |
| `sessionEnd` | Session cleanup | Terminal / cleanup-only | Output ignored by agent | Redirect to `/dev/null`; no context delivery |

---

## OpenCode

| Event | Trigger | Output processed by host | Risk | CodeWiki default policy |
| --- | --- | --- | --- | --- |
| `tool.execute.before` | Before tool execution | Plugin return value → context | Plugin must be loaded; event name is stable | Advisory short context via `codewikiContext` |
| `file.edited` | After file edit | Plugin return value → context | Same as above | Silent state record via `codewikiContext` |
| `session.idle` | After run completes / idle | Plugin return value → context | Not true teardown; status transition only | Turn-end state signal; not teardown |

---

## Cross-host comparison

| Concern | Claude Code | Codex | Copilot | OpenCode |
| --- | --- | --- | --- | --- |
| **Context delivery channel** | Plain stdout | Plain stdout / JSON wrapper | JSON wrapper → `additionalContext` | Plugin return value |
| **Blocking capability** | None | `Stop` hook JSON | `agentStop` JSON | None |
| **Pre-tool guardrail viable?** | Yes (stdout) | No (stdout ignored) | Yes (JSON wrapper, host-dependent) | Yes (return value) |
| **Silent-by-default?** | Yes | Yes | Yes | Yes |
| **Debug mode available?** | Via `CODEWIKI_HOOK_DEBUG` | Via `CODEWIKI_HOOK_DEBUG` | Via `CODEWIKI_HOOK_DEBUG` | Via `CODEWIKI_HOOK_DEBUG` |
| **Runtime variance risk** | Low (single runtime) | Low (single runtime) | **High** (cloud vs local) | Low (single runtime) |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-05-05 | Initial matrix extracted from `docs/codewiki-project-v2.md` §6.1 and expanded into standalone artifact per audit gap 3. |
