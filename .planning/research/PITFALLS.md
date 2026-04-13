# Pitfalls Research

**Domain:** CLI installer tool plus AI-tool hooks integration
**Originally researched:** 2026-04-07
**Canonicalized:** 2026-04-13
**Confidence:** HIGH for the current doc and install canon; MEDIUM for future non-Claude runtime payload parsing

## Critical Pitfalls

### Pitfall 1: Published assets drift back to the command-era model

**What goes wrong:**
Docs, tests, or future plans reintroduce legacy command-era directories or other superseded install paths as if they were still canonical.

**How to avoid:**
- Treat `docs/codewiki-project-v2.md`, `docs/skills-migration-handoff.md`, and `docs/research-reference.md` as the tie-breakers
- Keep grep-based validation for live docs and tests
- Add historical banners to older phase artifacts instead of silently rewriting history

### Pitfall 2: Tarball misses the canonical skill and hook assets

**What goes wrong:**
`npm run build` succeeds, but `dist/templates/skills/**` or `dist/templates/hooks/**` never make it into the published package.

**How to avoid:**
- Copy `src/templates/**` to `dist/templates/**` in `postbuild`
- Verify with `npm pack --dry-run --json`
- Assert `dist/templates/skills/codewiki-ingest/SKILL.md` and the shared hook scripts appear in the tarball

### Pitfall 3: Wrong skill tree per tool

**What goes wrong:**
Future work invents a dedicated OpenCode-only skill tree, tries to rediscover a Codex-only skill tree, or adds another redundant tool-specific tree without a real need.

**How to avoid:**
- Keep `src/templates/skills/codewiki-<name>/SKILL.md` as the only source of truth
- Keep `.claude/skills/` for Claude Code
- Keep `.agents/skills/` as the shared non-Claude tree
- Only add another skill tree if a future adapter phase proves it solves a real discovery gap

### Pitfall 4: Codex adapter assumes file-edit interception works like Claude

**What goes wrong:**
An adapter is written around Codex `PreToolUse` or `PostToolUse` as if they could reliably intercept file edits.

**How to avoid:**
- Treat Codex `PreToolUse` and `PostToolUse` as Bash-only
- Design around `UserPromptSubmit` and `Stop`
- Validate real Codex payloads before finalizing parser logic

### Pitfall 5: Copilot `sessionEnd` is used as a post-turn control surface

**What goes wrong:**
Future adapter work treats `sessionEnd` as if it were the Copilot equivalent of a useful post-turn continuation hook.

**How to avoid:**
- Use `preToolUse` and `postToolUse` for tool hooks
- Use `agentStop` for meaningful post-turn follow-up
- Reserve `sessionEnd` for cleanup and logging semantics

### Pitfall 6: OpenCode adapter is designed around the deprecated JSON-hook model

**What goes wrong:**
Future docs or code revive the older OpenCode JSON-hook model even though the canonical design now uses `.opencode/plugins/codewiki.ts`.

**How to avoid:**
- Treat OpenCode as a plugin-dispatch adapter
- Use `tool.execute.before`, `file.edited`, and `session.idle`
- Keep the plugin thin and dispatch to `.codewiki/hooks/*.sh`

### Pitfall 7: `session.idle` is treated as literal session teardown

**What goes wrong:**
The OpenCode adapter assumes `session.idle` means the session is ending permanently and uses it as a teardown-only event.

**How to avoid:**
- Document it as a turn-end or assistant-idle signal
- Use it for lightweight summary or absorb follow-up, not one-shot teardown logic
- Avoid semantics that depend on the user never continuing the session

### Pitfall 8: Hook scripts block the host or fail on POSIX shells

**What goes wrong:**
Shared shell hooks exit non-zero, depend on Bash-only syntax, or assume one JSON payload shape.

**How to avoid:**
- Keep hooks POSIX `sh`
- End informational flows with `exit 0`
- Gracefully degrade when expected fields are missing
- Validate live payloads per tool before writing tool-specific parsing assumptions

### Pitfall 9: Re-runs duplicate marker blocks or hook registrations

**What goes wrong:**
`init` appends duplicate `<!-- codewiki:start -->` sections or stacks duplicate hook entries.

**How to avoid:**
- Use marker replacement, not append-only behavior
- Deduplicate hook registrations by the shared `.codewiki/hooks/` command path
- Keep re-run tests as a standing regression suite

## Integration Gotchas

| Integration | Common mistake | Correct approach |
|-------------|----------------|------------------|
| Claude Code | Forgetting the canonical tree is `.claude/skills/` | Install skills into `.claude/skills/codewiki-<name>/SKILL.md` |
| Codex | Reopening the skill-path question | Reuse `.agents/skills/`; focus on `.codex/hooks.json` and `AGENTS.md` |
| Copilot | Treating `sessionEnd` as a control hook | Use `agentStop` for meaningful post-turn follow-up |
| OpenCode | Building JSON hook config instead of a plugin | Write `.opencode/plugins/codewiki.ts` and dispatch documented plugin events |
| Shared docs | Reintroducing “slash command” language as current truth | Keep that language only in clearly marked historical artifacts |

## "Looks Done But Isn't" Checklist

- [ ] `npm pack --dry-run --json` includes `dist/templates/skills/codewiki-ingest/SKILL.md`
- [ ] `npm pack --dry-run --json` includes `dist/templates/hooks/pre-wiki-context.sh`
- [ ] Live docs do not describe legacy command-era paths or the deprecated OpenCode JSON-hook model as current canon
- [ ] `test/planning-docs-canon.test.ts` matches the current OpenCode, Codex, and Copilot hook model
- [ ] Claude instructions describe CodeWiki as Skills, not slash commands
- [ ] Historical phase artifacts that still mention superseded guidance have an explicit historical banner

## Recovery Guidance

| Failure mode | Recovery |
|--------------|----------|
| Live docs drifted back to old paths | Restore from canonical docs and re-run grep-based validation |
| Published tarball missed assets | Republish with corrected `dist/templates/**` contents and rerun pack tests |
| Wrong hook event was documented | Correct the live canon first, then patch the affected plan or adapter phase docs |
| Historical artifact confused a future session | Add or strengthen the historical banner instead of silently deleting chronology |

## Key Roadmap Implications

1. The install-surface migration is complete. Do not reopen it in Phase 6 or Phase 7.
2. OpenCode planning must focus on the plugin dispatcher, not on alternate skill trees.
3. Codex and Copilot planning must focus on hook semantics and instruction integration, not on skill-path discovery.
4. Regression tests should keep the docs canon honest so the repo cannot quietly drift back to the superseded model.

## Sources

- `docs/codewiki-project-v2.md`
- `docs/skills-migration-handoff.md`
- `docs/research-reference.md`
- Claude Code hooks and skills docs
- OpenAI Codex hooks and skills docs
- GitHub Copilot hooks docs
- OpenCode plugin and skills docs

---
*Pitfalls research refreshed to the canonical skills + hook-event model on 2026-04-13*
