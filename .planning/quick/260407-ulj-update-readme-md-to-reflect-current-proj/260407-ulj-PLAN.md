---
phase: quick
plan: 260407-ulj
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "README describes v2 installer-only architecture (npx codewiki init as sole CLI command)"
    - "No references to removed runtime CLI commands (ingest, query, lint, prd, tasks, status as CLI commands)"
    - "Slash commands, hooks, and agents described as the intelligence layer"
    - "Architecture diagram shows raw/wiki/tool-integration layers accurately"
    - "Phase 3 completion status is reflected"
  artifacts:
    - path: "README.md"
      provides: "Accurate project documentation for v2 architecture"
      contains: "npx codewiki init"
  key_links: []
---

> Historical note: This completed quick-task artifact preserves the assumptions of its original session. It may mention superseded command-era paths or older hook-event choices. For current canon, use `docs/codewiki-project-v2.md`, `docs/skills-migration-handoff.md`, `docs/research-reference.md`, and the live `.planning/*.md` docs.

<objective>
Rewrite README.md to accurately reflect the v2 architecture where the CLI is installer-only (`npx codewiki init`) and all runtime intelligence lives in markdown prompt files (slash commands, agents, hooks) that AI tools execute natively.

Purpose: The current README describes the deleted v1 runtime CLI with commands like `codewiki ingest`, `codewiki query`, etc. This is completely wrong and misleading for anyone discovering the project.

Output: A fully rewritten README.md reflecting current project state (Phase 3 of 8 complete).
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@README.md
@src/templates/claude/commands/codewiki/ (6 slash command templates)
@src/templates/claude/agents/ (2 agent definitions)
@src/templates/hooks/ (2 hook scripts)
@src/commands/init.ts (the only CLI command)
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite README.md for v2 architecture</name>
  <files>README.md</files>
  <action>
Completely rewrite README.md. Keep the same overall structure feel (intro, workflow, architecture, install, quick start, development) but update ALL content to reflect v2 reality.

**Section-by-section instructions:**

**1. Title + Intro (keep spirit, update mechanism):**
- Keep: "markdown-first framework for giving AI coding agents durable, human-approved project memory"
- Update: Emphasize that CodeWiki installs prompt files (slash commands, hooks, agents) into a project — the AI tools themselves execute the intelligence, not a runtime CLI
- Mention supported tools: Claude Code, Codex, Copilot, OpenCode

**2. "The right workflow" section (keep as-is mostly):**
- Keep the core rule: "The agent proposes; the human approves; only approved knowledge enters wiki/"
- Keep the mermaid flowchart — it's still accurate
- REMOVE the `codewiki query "..."` bash example after the diagram (this CLI command no longer exists)
- Replace with: explain that slash commands like `/codewiki-query` handle this within the AI tool

**3. Architecture section:**
- Update the mermaid diagram to show three layers:
  1. Raw layer: `raw/` — immutable human-curated source documents
  2. Wiki layer: `wiki/` — LLM-written, human-approved knowledge (entities, decisions, lessons, issues, sources)
  3. Tool integration layer: hooks (pre/post), slash commands (6), agents (2), system instructions — installed per-tool by `init`
- Show that `codewiki init` installs tool-specific files into the AI tool's native locations (e.g., `.claude/commands/`, `.claude/agents/` for Claude Code)

**4. "Generated project layout" section:**
- Update to show what `codewiki init` actually creates now:
  ```
  .codewiki/
    config.yml
    templates/          (page templates for wiki entries)
  raw/                  (human-curated source documents)
  wiki/
    index.md
    log.md
    entities/
    decisions/
    lessons/
    issues/
    sources/
  ```
- Plus tool-specific files, e.g. for Claude Code:
  ```
  .claude/
    commands/codewiki/
      ingest.md
      query.md
      lint.md
      prd.md
      tasks.md
      process.md
    agents/
      codewiki-wiki-updater.md
      codewiki-verifier.md
  .codewiki/
    hooks/
      pre-wiki-context.sh
      post-verify.sh
  ```

**5. Install section:**
- Primary: `npx codewiki init` (no install needed)
- Dev: `npm install && npm run build && npm link` then `codewiki init`
- REMOVE `codewiki --help` references — there's only `init`
- REMOVE `npm install -g codewiki` for now (not published yet)

**6. Quick start section — COMPLETELY REWRITE:**
```bash
# 1. Initialize CodeWiki in your project
npx codewiki init --name "My Project" --tool claude-code

# 2. Start using slash commands in your AI tool
#    /codewiki-query "what do we know about auth middleware?"
#    /codewiki-ingest raw/api-redesign.md
#    /codewiki-lint
#    /codewiki-prd "add retry policy to API client"
#    /codewiki-tasks raw/<prd-file>.md
#    /codewiki-process

# 3. Hooks run automatically
#    pre-wiki-context.sh — injects wiki context before file edits
#    post-verify.sh — verification reminder after changes

# 4. Agents available on demand
#    codewiki-wiki-updater — proposes wiki updates from session work
#    codewiki-verifier — validates wiki changes before approval
```

**7. Commands table — replace entirely:**

| Command | What it does |
| --- | --- |
| `codewiki init [--tool ...] [--name ...] [--force]` | Scaffolds `.codewiki/`, `raw/`, `wiki/`, installs slash commands, hooks, and agents for the specified AI tool(s). |

That's the ONLY CLI command. All other intelligence is in the installed prompt files.

**8. Add new "Slash Commands" section (after Commands):**
Table listing the 6 slash commands with brief descriptions:

| Slash Command | Purpose |
| --- | --- |
| `/codewiki-ingest` | Read a raw source and propose a wiki source-summary |
| `/codewiki-query` | Search wiki for relevant context |
| `/codewiki-lint` | Run deterministic wiki health checks |
| `/codewiki-prd` | Draft a PRD from a description |
| `/codewiki-tasks` | Generate tasks from a PRD |
| `/codewiki-process` | Process raw documents into wiki proposals |

**9. Add "Hooks" section:**
- `pre-wiki-context.sh` — Automatically injects relevant wiki context before the agent edits files
- `post-verify.sh` — Reminds the agent to verify changes and propose wiki updates

**10. Add "Agents" section:**
- `codewiki-wiki-updater` — Proposes wiki updates based on session work
- `codewiki-verifier` — Validates proposed wiki changes against conventions

**11. Adapter guidance section — UPDATE:**
- Explain that `codewiki init --tool ...` installs native integration files for each tool
- Currently supported: `claude-code` (fully implemented)
- Planned: `codex`, `copilot`, `opencode`
- Keep the sequence diagram — it's still accurate

**12. Development section — UPDATE:**
```bash
npm install
npm run typecheck
npm run build
npm test
```
- Mention vitest for unit tests
- Mention zero runtime deps
- REMOVE `node dist/bin/codewiki.js --help` (no help command)

**13. "V1 non-goals" → rename to "Current non-goals":**
- Keep the list but update the intro text to mention v2 architecture
- Add: "runtime CLI commands beyond `init`" to the list (this IS a non-goal now)
- Remove: "template migration commands" (not relevant anymore)

**14. Add "Project Status" section near the bottom:**
- Phase 3 of 8 complete
- Phases completed: Phase 1 (Clean Slate), Phase 2 (Shared Infrastructure), Phase 3 (Prompt Templates and Hook Scripts)
- Next: Phase 4 (Claude Code Adapter + init Command)
- Link to roadmap if exists

Throughout: ensure NO references to `codewiki ingest`, `codewiki query`, `codewiki lint`, `codewiki prd`, `codewiki tasks`, `codewiki status` as CLI commands. These are now slash commands only (e.g., `/codewiki-ingest`).
  </action>
  <verify>
    <automated>grep -c "codewiki ingest\|codewiki query\|codewiki lint\|codewiki prd\|codewiki tasks\|codewiki status" README.md | grep -q "^0$" && echo "PASS: No old CLI commands found" || echo "FAIL: Old CLI commands still present"</automated>
  </verify>
  <done>
    - README.md accurately describes v2 installer-only architecture
    - `npx codewiki init` shown as the sole CLI command
    - Slash commands, hooks, and agents documented as the intelligence layer
    - No references to removed runtime CLI commands
    - Architecture diagram updated for v2
    - Project status section shows Phase 3 of 8 complete
  </done>
</task>

</tasks>

<verification>
1. `grep -c "codewiki ingest\|codewiki query\|codewiki lint\|codewiki prd\|codewiki tasks\|codewiki status" README.md` returns 0 (no old CLI commands)
2. `grep -c "npx codewiki init\|codewiki init" README.md` returns ≥ 1 (init command documented)
3. `grep -c "codewiki-ingest\|codewiki-query\|codewiki-lint" README.md` returns ≥ 1 (slash commands documented)
4. `grep -c "pre-wiki-context\|post-verify" README.md` returns ≥ 1 (hooks documented)
5. `grep -c "wiki-updater\|verifier" README.md` returns ≥ 1 (agents documented)
</verification>

<success_criteria>
README.md fully reflects the v2 architecture: CLI is installer-only, intelligence lives in slash commands/hooks/agents, no references to deleted runtime CLI commands, project status shows Phase 3 of 8 complete.
</success_criteria>

<output>
After completion, create `.planning/quick/260407-ulj-update-readme-md-to-reflect-current-proj/260407-ulj-SUMMARY.md`
</output>
