# Pitfalls Research

**Domain:** CLI installer tool + AI tool hooks integration (npm package)
**Researched:** 2026-04-07
**Confidence:** HIGH (npm publishing, Claude Code hooks); MEDIUM (Codex/OpenCode specifics — APIs still evolving)

## Critical Pitfalls

### Pitfall 1: Prompt files absent at runtime because `dist/` omits non-JS assets

**What goes wrong:**
`npm run build` compiles TypeScript to `dist/` but does NOT copy `src/templates/**/*.md` or `src/templates/**/*.sh`. When `npx codewiki init` runs, it tries to read prompt files and finds nothing. Installed command/agent files are empty or the process throws `ENOENT`.

**Why it happens:**
`tsc` only emits `.js` and `.d.ts`. Non-TypeScript assets are ignored entirely unless an explicit copy step is added.

**How to avoid:**
- Add explicit copy step: `tsc -p tsconfig.json && cp -r src/templates dist/templates`
- Verify with `npm pack --dry-run` before every publish — check that `dist/templates/claude/commands/ingest.md` appears in the file list
- Reference template files using `join(import.meta.dirname, '..', 'templates', ...)` — never relative to `src/`

**Warning signs:**
- `init` runs without error but installed `.claude/commands/codewiki/ingest.md` is empty or zero bytes
- `npm pack` output shows no `.md` files inside `dist/`

**Phase to address:** Phase 8 (Build) — must be baked into build script from day one, not retrofitted.

---

### Pitfall 2: Hook scripts block the agent on exit code != 0

**What goes wrong:**
A pre-hook encounters a missing `wiki/index.md` (fresh project), exits with code 1 or 2, and Claude Code blocks the tool call or surfaces a confusing warning. Normal agent work is disrupted by an informational hook.

**Exit code semantics (Claude Code, HIGH confidence):**
- Exit 0: success, proceed. JSON on stdout parsed for context injection.
- Exit 2: blocking error — prevents the PreToolUse tool call. Stderr used as error message.
- Any other non-zero: non-blocking error — action continues but warning shown.

**How to avoid:**
- CodeWiki hooks are context injection only — must always exit 0
- Wrap entire hook body in `set +e` and end with unconditional `exit 0`
- If `wiki/index.md` is missing, output nothing and exit 0
- Test: `echo '{"tool_name":"Write","tool_input":{"file_path":"foo.ts"}}' | bash .codewiki/hooks/pre-wiki-context.sh; echo $?` must return 0 in all edge cases

**Warning signs:**
- Agent pauses unexpectedly when writing files
- Claude Code shows "hook failed" warnings
- Hooks work in populated repos but fail in freshly cloned repos

**Phase to address:** Phase 3 (Create Hook Scripts) — exit 0 discipline is a hook authoring requirement.

---

### Pitfall 3: Config merge clobbers existing user settings

**What goes wrong:**
`init` reads `.claude/settings.json`, then writes it back using `Object.assign` or spread — replacing the entire `hooks` array with only CodeWiki hooks. User loses every custom hook they had. Irreversible without git history.

**Why it happens:**
Shallow merging is JavaScript's default. Spread/assign replaces arrays at the key level.

**How to avoid:**
- Deep merge: read existing `hooks` array, filter out old CodeWiki entries (by path containing `.codewiki/hooks/`), then push new CodeWiki hook objects
- Write a `mergeHooks(existing, codewikiHooks)` utility that: keeps all non-codewiki hooks, removes old codewiki hooks (idempotency), appends fresh codewiki hooks
- Test 7.6 must verify: create settings with custom hooks, run init, verify custom hooks still present AND codewiki hooks added

**Warning signs:**
- After `init`, user's permission allow-lists are gone from settings.json
- `.claude/settings.json` is smaller after init than before

**Phase to address:** Phase 6, Task 6.2; Phase 7, Task 7.6.

---

### Pitfall 4: Duplicate hook registrations on re-run

**What goes wrong:**
Running `npx codewiki init` twice results in `.claude/settings.json` having two identical `PreToolUse` hook entries. Claude Code runs the hook twice per tool call, injecting wiki context twice.

**Why it happens:**
Merge logic appends codewiki hooks without checking if they already exist. Claude Code does NOT auto-deduplicate within a single settings file.

**How to avoid:**
- Before appending, check if an entry with the same `command` string already exists
- Use the command script path as dedup key: if any existing hook has a command containing `.codewiki/hooks/pre-wiki-context.sh`, skip
- Test 7.7: run init twice, parse settings.json, count occurrences of hook command — must equal exactly 1

**Warning signs:**
- Settings file grows each time init runs
- Agent output contains the same wiki context block twice per tool call

**Phase to address:** Phase 6 (init logic) and Phase 7 (Task 7.7 idempotency test).

---

### Pitfall 5: Duplicate `## CodeWiki` section in instruction files on re-run

**What goes wrong:**
Running init a second time appends a second `<!-- codewiki:start -->...<!-- codewiki:end -->` block to `CLAUDE.md`. Agent sees the CodeWiki instructions twice, wasting context.

**How to avoid:**
- Search for the exact marker `<!-- codewiki:start -->` to detect existing installation
- If marker found and no `--force`: print warning and skip — do not append
- If marker found and `--force`: replace the exact region between markers, do not append
- Test: `grep -c 'codewiki:start' CLAUDE.md` after two init runs must equal 1

**Phase to address:** Phase 6, Task 6.2; Phase 7, Task 7.7.

---

### Pitfall 6: POSIX incompatibility in hook scripts

**What goes wrong:**
Hook scripts use bash-specific syntax (`[[ ]]`, `local`, process substitution, arrays) that fail silently on systems using `dash` or POSIX `sh`. Ubuntu uses `dash` as `/bin/sh`. Hooks fail on Linux CI.

**How to avoid:**
- Use `#!/bin/sh` shebang, not `#!/bin/bash`
- No `[[ ]]` (use `[ ]`), no `local`, no `<<<` herestrings, no `echo -e`
- Guard for `jq` absence: `command -v jq >/dev/null 2>&1 && ...` with grep fallback
- Run `shellcheck --shell=sh` on all hook scripts

**Warning signs:**
- Hooks work on macOS but produce "syntax error" on Linux CI
- `sh -n hook.sh` fails but `bash -n hook.sh` passes

**Phase to address:** Phase 3 (Create Hook Scripts) — POSIX-only from the start.

---

### Pitfall 7: Wrong JSON field path for hook stdin across tools

**What goes wrong:**
The hook script parses `tool_input.file_path` from Claude Code's JSON payload. When the same script runs under Codex, it sends a different JSON shape. `jq` returns null, no context injected.

**Tool JSON payload shapes (MEDIUM confidence):**
- Claude Code PreToolUse: `{ "hook_event_name": "PreToolUse", "tool_name": "Write", "tool_input": { "file_path": "..." } }`
- Codex: different schema per hooks.json protocol
- OpenCode `file_edited`: sends file path patterns, not a PreToolUse format

**How to avoid:**
- Design for graceful degradation: if field not found, output nothing and exit 0
- Document which fields are available per tool in comment header of each hook script
- Test each script with sample payloads from each tool

**Phase to address:** Phase 3 (Create Hook Scripts) — requires completing R2-R5 research tasks first.

---

### Pitfall 8: Missing executable bit on copied hook scripts

**What goes wrong:**
`init` copies `.sh` files using Node's `fs.copyFile`. When Claude Code tries to run the hook, it gets `Permission denied` because the file has mode `644` instead of `755`.

**Why it happens:**
`fs.copyFile` does NOT preserve the source file's execute permissions by default.

**How to avoid:**
- After every hook script copy: `fs.chmodSync(destPath, 0o755)`
- Make this part of the file copy utility function, not an afterthought
- Smoke test: `ls -la .codewiki/hooks/` must show `-rwxr-xr-x` after init

**Phase to address:** Phase 6, Task 6.1 (file copy logic) — add chmod as part of copy operation.

---

### Pitfall 9: OpenCode does not support PreToolUse/PostToolUse hooks

**What goes wrong:**
OpenCode's experimental hook system only has `file_edited` (post-edit) and `session_completed`. There is no pre-tool hook. The wiki context injection workflow cannot work the same way under OpenCode.

**Confirmed:** OpenCode experimental hooks are `file_edited` and `session_completed` only.

**How to avoid:**
- OpenCode adapter must use `session_completed` for post-session reminders
- Pre-tool context injection is NOT achievable in OpenCode — document this limitation
- OpenCode users rely on `AGENTS.md` for static wiki context guidance, not dynamic hook injection
- Do not create an empty/broken hook config for OpenCode just to match the Claude Code shape

**Phase to address:** Phase 6, Task 6.1 — OpenCode adapter must be written differently from Claude Code adapter.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline prompt content as TS template strings | Avoids build copy step | Prompts not human-editable without rebuild | Never — file-based prompts are core design |
| Hardcode `dist/templates` as string literal | Avoids import.meta.url | Breaks when package install location differs | Never |
| `Object.assign({}, existing, newConfig)` for JSON merge | Simple one-liner | Clobbers existing hook arrays — data loss | Never for hook arrays |
| Skip idempotency check for markdown files | Saves implementation time | Users who re-run get duplicate instruction blocks | Never |
| `#!/bin/bash` in hook scripts | Full bash feature set | Fails on dash/sh environments, breaks Linux CI | Never |
| Inline shell in JSON hook commands | Avoids separate script files | Escape quoting fragile, untestable | Never — always point to a script file |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code `.claude/settings.json` | Replace entire `hooks` array | Read existing, filter old codewiki entries, append new entries |
| Claude Code hooks stdout | Print plain text for context | Output JSON with `additionalContext` field at exit 0 |
| Codex hooks | Assume single hooks.json per project | Codex loads all hooks.json across config layers; entries accumulate |
| OpenCode experimental hooks | Assume PreToolUse/PostToolUse exist | Only `file_edited` and `session_completed` — pre-tool injection unavailable |
| npm `files` field | List `"src/templates/"` | Build step must copy to `dist/templates/` first; list `"dist/"` |
| npm publish + .gitignore | Assume gitignored = not published | Without `.npmignore`, `.gitignore` patterns apply to npm publish; use explicit `files` field |

## "Looks Done But Isn't" Checklist

- [ ] **Hook scripts executable:** `ls -la .codewiki/hooks/` shows `-rwxr-xr-x` after init
- [ ] **Prompt files in npm tarball:** `npm pack --dry-run` lists `dist/templates/claude/commands/ingest.md`
- [ ] **CLAUDE.md marker present:** `grep 'codewiki:start' CLAUDE.md` returns exactly 1 result
- [ ] **Hook exits 0 when wiki absent:** `echo '{}' | sh .codewiki/hooks/pre-wiki-context.sh; echo $?` returns 0 in fresh directory
- [ ] **Slash command frontmatter `description` field:** Every `.claude/commands/codewiki/*.md` has `description:` — without it the command doesn't appear in `/help`
- [ ] **`--tool` flag actually filters:** `init --tool claude-code` does NOT create `.codex/`, `.opencode/`, `.github/hooks/`
- [ ] **Re-run produces identical state:** Hash all installed files after first init, re-run without `--force`, all hashes identical

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Prompt files missing from published package | HIGH | Republish with patch version bump; users must re-run `npx codewiki@latest init` |
| Hook clobbers existing settings.json | MEDIUM | Restore from git; add backup: copy settings.json → settings.json.bak before writing |
| Duplicate instruction blocks in CLAUDE.md | LOW | Manual removal of duplicate `<!-- codewiki:start -->...<!-- codewiki:end -->` block |
| Hook script exits non-zero, blocks agent | LOW | User edits hook to add `exit 0` at end, or removes hook entry from settings.json |
| Bashism in hook fails on Linux | MEDIUM | Rewrite POSIX-clean, redistribute via `init --force` |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Prompt files absent from npm package | Phase 8 (Build) | `npm pack --dry-run` lists `dist/templates/*.md` |
| Hook scripts block agent (exit != 0) | Phase 3 (Hook Scripts) | `echo '{}' | sh hook.sh; echo $?` returns 0 in all branches |
| Config merge clobbers user settings | Phase 6 (init command) | Test 7.6: existing hooks survive init |
| Duplicate hook registrations | Phase 6 (init command) | Test 7.7: two init runs = one hook entry |
| Duplicate instruction blocks | Phase 6 (init command) | Test 7.7: `grep -c codewiki:start CLAUDE.md` = 1 |
| POSIX incompatibility in hooks | Phase 3 (Hook Scripts) | `shellcheck --shell=sh` passes; tested on Linux |
| Wrong JSON field path across tools | Phase 3 (Hook Scripts) | Each hook tested with per-tool sample payloads |
| Missing executable bit on hook scripts | Phase 6 (file copy logic) | `ls -la .codewiki/hooks/` shows execute bit after init |
| OpenCode lacks PreToolUse lifecycle | Phase 6 (OpenCode adapter) | OpenCode adapter uses `session_completed` only |

## Key Findings for Roadmap

1. **Phase 3 (Hook Scripts) is the riskiest phase.** Three independent failure modes converge: exit code discipline, POSIX compatibility, and per-tool JSON schema divergence.

2. **Phase 8 (Build) must be decided in Phase 6, not at the end.** The `dist/templates/` copy step must exist before the first npm publish smoke test.

3. **OpenCode adapter requires a fundamentally different hook strategy.** Plan the OpenCode adapter around `session_completed` + static AGENTS.md instructions only.

4. **Config merge correctness must be test-covered before code review, not after.** Tests 7.6 and 7.7 are the specification for the merge logic.

## Sources

- Claude Code Hooks Reference — exit code semantics, JSON stdin format (HIGH confidence)
- Codex Hooks — hooks.json format, stdin protocol (MEDIUM confidence)
- OpenCode experimental hooks — `file_edited` and `session_completed` only (MEDIUM confidence)
- npm publish docs — files field behavior, .gitignore interaction (HIGH confidence)
- GSD local install patterns — Claude Code hook config confirmed working

---
*Pitfalls research for: CLI installer tool + AI tool hooks integration*
*Researched: 2026-04-07*
