# Phase 4: Claude Code Adapter + init Command - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

`codewiki init` should create the wiki scaffold and install Claude Code integration end-to-end: Claude command files, Claude agents, shared hook scripts, `.claude/settings.json` hook wiring, and `CLAUDE.md` instructions. The CLI remains installer-only, reruns must be idempotent, and Claude is the only fully implemented adapter in this phase.

</domain>

<decisions>
## Implementation Decisions

### Claude install surface
- **D-01:** Phase 4 installs the full post-3.1 Claude asset set: 8 Claude command files (`ingest`, `query`, `lint`, `absorb`, `breakdown`, `prd`, `tasks`, `process`) and 2 Claude agents.
- **D-02:** `.codewiki/hooks/session-end.sh` is copied in Phase 4, but Claude hook wiring remains pre/post-only for now. The install report should make it clear that `session-end.sh` is installed but not yet wired into a Claude lifecycle event.

### Installer architecture
- **D-03:** Build a thin generic installer pipeline now, with Claude as the only fully implemented adapter in Phase 4.
- **D-04:** Keep shared copy, merge, detection, and reporting helpers generic so later tool phases extend the pipeline instead of rewriting `init.ts`.

### Detection and target creation
- **D-05:** When `--tool` is omitted, run tool detection first. If nothing is detected, prompt the user in interactive/TTY runs and fail with clear `--tool` guidance in non-interactive contexts.
- **D-06:** If Claude is explicitly selected, create both `.claude/` and root `CLAUDE.md` automatically when they do not already exist.

### Existing-file behavior
- **D-07:** Treat `.claude/settings.json` and `CLAUDE.md` as merge targets: preserve unrelated user content, deep-merge JSON config, and use CodeWiki marker sections for markdown instructions.
- **D-08:** Treat copied Claude commands, Claude agents, and shared hook scripts as per-file install targets: skip existing files without `--force`, replace them with `--force`, and continue the install with a full report instead of aborting the entire adapter install.

### Claude-specific scope boundaries
- **D-09:** Phase 4 should support generic tool selection and filtering in the CLI surface, but only Claude receives a full installer implementation in this phase.
- **D-10:** If the user chooses Claude from the interactive no-detection fallback, that choice carries the same authority as `--tool claude-code` and should create the Claude integration surface automatically.

### the agent's Discretion
- Exact report formatting, as long as it clearly distinguishes wiki scaffold work from Claude adapter work and calls out inactive assets.
- Exact module and function boundaries inside the thin generic installer pipeline.
- Whether the interactive no-detection prompt lists only implemented adapters or lists future adapters with explicit “not implemented in this phase” messaging.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase definition and requirements
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and sequencing relative to Phase 3.1 and later adapter phases.
- `.planning/REQUIREMENTS.md` — Active `CLI-*` and `CC-*` requirements that Phase 4 must satisfy, plus idempotency expectations.
- `.planning/PROJECT.md` — Installer-only architecture, zero-runtime-dependency constraint, shared-hooks direction, and no-clobber rules.
- `.planning/STATE.md` — Current project position and active blockers that shape Phase 4 planning.

### Product and install design
- `docs/codewiki-project-v2.md` — Installed config model, tool auto-detection rules, shared hook strategy, and `init` behavior.
- `docs/implementation-plan-v2.md` — Expected `init` rewrite, merge semantics, report shape examples, and installation verification scenarios.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/commands/init.ts`: Existing flag parsing for `--tool`, `--name`, and `--force` can be preserved while replacing the current “all tools by default” behavior.
- `src/lib/detect.ts`: Existing detection helper already knows Claude/Codex/Copilot/OpenCode markers and can be extended to match the broader PRD rules.
- `src/lib/merge.ts`: `deepMerge`, `deduplicateHookArray`, and `mergeMarkerSection` already cover the core JSON/marker merge safety required by Phase 4.
- `src/lib/scaffold.ts`: Current scaffold writer already produces created/skipped/replaced report entries and can stay responsible for wiki scaffold creation.
- `src/templates/scaffold.ts`: Current scaffold definitions already own the base wiki tree and can be extended to install real Claude assets instead of placeholder adapter docs.
- `src/lib/reporter.ts`: Existing report formatter provides created/skipped/replaced/failed output that can evolve into the Phase 4 install report.
- `test/init.test.ts` and `src/lib/__tests__/scaffold.test.ts`: Existing tests define the current baseline behavior and will need to be rewritten around the new Claude install path.

### Established Patterns
- File creation uses safe writes and reports each path individually rather than hiding partial results.
- Markdown instruction merging uses `<!-- codewiki:start -->` / `<!-- codewiki:end -->` markers.
- JSON merge safety and hook deduplication already live in `src/lib/merge.ts` rather than inside command-specific code.
- Template assets ship from `src/templates/` and are expected to be available in `dist/templates/` at runtime.
- Tool identity is centralized through `SupportedTool`, which makes a thin generic installer pipeline a natural extension of the current codebase.

### Integration Points
- Claude command files need to be copied into `.claude/commands/codewiki/`.
- Claude agent definitions need to be copied into `.claude/agents/`.
- Shared shell hooks need to be copied into `.codewiki/hooks/` and Claude hook config must point at them from `.claude/settings.json`.
- `CLAUDE.md` needs a marker-managed CodeWiki section appended or replaced without disturbing unrelated project instructions.
- `init` should run in this order: resolve tools, scaffold wiki structure, install tool adapters, then print a report.

</code_context>

<specifics>
## Specific Ideas

- Hybrid install surface: install the full Claude asset set now, but keep Claude lifecycle wiring limited to pre/post hooks and report `session-end.sh` as installed-but-inactive.
- Interactive fallback should exist only when `init` is running in a context where prompting is viable; scripts and CI should get a deterministic error telling them to pass `--tool`.
- Explicit Claude selection should be authoritative enough to create missing `.claude/` and `CLAUDE.md` targets automatically.

</specifics>

<deferred>
## Deferred Ideas

- Claude lifecycle wiring for `session-end.sh` — defer until the desired Claude session lifecycle event and payload shape are confirmed.
- Full non-Claude adapter implementations — remain in later phases; Phase 4 should only prepare the shared installer shape for them.

</deferred>

---

*Phase: 04-claude-code-adapter-init-command*
*Context gathered: 2026-04-08*