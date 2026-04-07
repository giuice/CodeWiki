# Phase 3: Prompt Templates and Hook Scripts - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

All markdown prompt files (6 slash commands), 2 agent definitions, and 2 hook scripts exist in `src/templates/` and are individually verifiable. This phase creates the template content; Phase 4 wires the installer.

</domain>

<decisions>
## Implementation Decisions

### Prompt Adaptation Strategy
- **D-01:** Use GSD-inspired structured markdown with `<purpose>`, `<process>`, `<step>` tags and explicit tool usage hints for all 6 slash commands
- **D-02:** Implement multi-agent orchestration in adapted commands: `/codewiki-prd` spawns parallel research agents, `/codewiki-tasks` uses analyze+generate agents, `/codewiki-process` spawns focused subtask executor subagents
- **D-03:** No checkpoint files and no automatic git commits from within commands — user controls all git operations (commit, rollback)
- **D-04:** Interaction gates (clarifying questions, "Go" confirmation, one-subtask-at-a-time) offered as user choice: "mentorship mode" (full gates) vs "fast mode" (generate all at once), selectable at invocation time

### New Command Content
- **D-05:** `/codewiki-ingest` performs full wiki extraction — reads source material, extracts entities/decisions/lessons/issues, cross-references with existing wiki pages, proposes new pages + index.md updates with user approval before writing
- **D-06:** `/codewiki-query` performs wiki-grounded search — reads wiki/index.md first, finds relevant pages by keyword/semantic matching, synthesizes answer citing specific wiki entries (local markdown RAG pattern)
- **D-07:** `/codewiki-lint` performs full wiki health check — detects contradictions between pages, orphaned pages not in index, stale content referencing deleted code, missing cross-references, and template drift

### Hook Scripts
- **D-08:** `pre-wiki-context.sh` reads wiki/index.md AND greps for terms related to the current file being edited, outputs matching page summaries as context. Must exit 0 even when wiki/index.md absent
- **D-09:** `post-verify.sh` parses JSON payload for modified file paths, checks if any match wiki entity names, outputs targeted reminder (e.g., "Wiki entity X may need updating"). Uses `jq` with `grep` fallback. Must exit 0 under all conditions including empty payload

### Agent Definitions
- **D-10:** `codewiki-wiki-updater` agent reads recent code changes (git diff / modified files), identifies affected wiki entities, proposes specific page edits with before/after diffs. User approves each change individually
- **D-11:** `codewiki-verifier` agent performs cross-reference contradiction check — verifies proposed changes don't conflict with other wiki pages, validates cross-reference links, ensures new entities are added to index.md. Reports conflicts before any write

### Claude's Discretion
- Internal prompt wording and example content within each command
- Specific grep patterns and matching heuristics in hook scripts
- Agent instruction formatting details and error handling prose

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Prompts (adapt these)
- `docs/prompts/create-prd.md` — Original PRD generation prompt, source for `/codewiki-prd`
- `docs/prompts/generate-tasks.md` — Original task generation prompt, source for `/codewiki-tasks`
- `docs/prompts/process-task-list.md` — Original task processing prompt, source for `/codewiki-process`

### GSD Reference Patterns (borrow structure from)
- `$HOME/.claude/get-shit-done/workflows/discuss-phase.md` — Example of structured `<purpose>/<process>/<step>` tag usage
- `$HOME/.claude/skills/gsd-plan-phase` — Example of multi-agent orchestration in a skill
- `$HOME/.claude/skills/gsd-execute-phase` — Example of subagent spawning and task execution patterns

### Existing Code (extend these patterns)
- `src/templates/adapter-templates.ts` — Existing template pattern with tool-specific content generation
- `src/templates/page-templates.ts` — Existing page template pattern
- `src/templates/scaffold.ts` — Template scaffold structure

### Project Design Docs
- `docs/codewiki-project-v2.md` — PRD for CodeWiki v2
- `docs/implementation-plan-v2.md` — Task breakdown reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/templates/adapter-templates.ts` — Template function pattern returning strings per tool type; slash command templates can follow the same pattern
- `src/templates/page-templates.ts` — Page template generation; wiki entity templates are already here
- `src/lib/merge.ts` — Deep merge and marker merge utilities ready for hook config merging (Phase 4)
- `src/lib/detect.ts` — Tool detection; commands may reference detected tool context
- `src/lib/reporter.ts` — Structured install reporting

### Established Patterns
- Template functions return string content (not file I/O) — keep this separation
- `SupportedTool` type used for tool-specific variants
- ESM with `import.meta.dirname` for asset path resolution
- Templates live in `src/templates/` and get copied to `dist/templates/` by postbuild

### Integration Points
- New slash command files will be `.md` files in `src/templates/claude/commands/codewiki/`
- Agent definitions will be `.md` files in `src/templates/claude/agents/`
- Hook scripts will be `.sh` files in `src/templates/hooks/`
- All must be included in the postbuild copy step (already configured)

</code_context>

<specifics>
## Specific Ideas

- Borrow GSD's multi-agent patterns: parallel research agents in `/codewiki-prd`, analyze+generate split in `/codewiki-tasks`, focused subtask executor in `/codewiki-process`
- Offer mentorship vs fast mode toggle in adapted commands (user mentioned wanting this as a user choice, not hardcoded)
- Hook scripts must be pure POSIX sh with `shellcheck --shell=sh` passing — use `jq` for JSON parsing with `grep` fallback when `jq` is not available
- Agent definitions should reference wiki structure (`wiki/entities/`, `wiki/decisions/`, etc.) explicitly so they can navigate without guessing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-prompt-templates-and-hook-scripts*
*Context gathered: 2026-04-07*
