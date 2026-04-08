# Phase 4: Claude Code Adapter + init Command - Research

**Researched:** 2026-04-08
**Domain:** CLI installer architecture, Claude Code integration, file merging
**Confidence:** HIGH

## Summary

Phase 4 rewrites the `init` command to become a real installer pipeline: detect tools, scaffold wiki structure, install Claude Code adapter assets (8 commands, 2 agents, 3 hook scripts), wire hooks into `.claude/settings.json`, append instructions to `CLAUDE.md`, and print a structured report. All template assets already exist in `src/templates/claude/` and `src/templates/hooks/` from Phases 3 and 3.1. The merge utilities (`deepMerge`, `deduplicateHookArray`, `mergeMarkerSection`) already exist in `src/lib/merge.ts`. The core work is (1) building the adapter installer pipeline, (2) rewriting `init.ts` to use it, and (3) handling edge cases: TTY detection for interactive fallback, `--force` behavior per file, and idempotent re-runs.

**Primary recommendation:** Build a generic `ToolAdapter` interface with Claude as the first implementation. The adapter owns: which files to copy, which configs to merge, and how to report results. `init.ts` orchestrates: parse flags, detect/select tools, scaffold wiki, run adapters, format report.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 4 installs the full post-3.1 Claude asset set: 8 Claude command files (`ingest`, `query`, `lint`, `absorb`, `breakdown`, `prd`, `tasks`, `process`) and 2 Claude agents.
- **D-02:** `.codewiki/hooks/session-end.sh` is copied in Phase 4, but Claude hook wiring remains pre/post-only for now. The install report should make it clear that `session-end.sh` is installed but not yet wired into a Claude lifecycle event.
- **D-03:** Build a thin generic installer pipeline now, with Claude as the only fully implemented adapter in Phase 4.
- **D-04:** Keep shared copy, merge, detection, and reporting helpers generic so later tool phases extend the pipeline instead of rewriting `init.ts`.
- **D-05:** When `--tool` is omitted, run tool detection first. If nothing is detected, prompt the user in interactive/TTY runs and fail with clear `--tool` guidance in non-interactive contexts.
- **D-06:** If Claude is explicitly selected, create both `.claude/` and root `CLAUDE.md` automatically when they do not already exist.
- **D-07:** Treat `.claude/settings.json` and `CLAUDE.md` as merge targets: preserve unrelated user content, deep-merge JSON config, and use CodeWiki marker sections for markdown instructions.
- **D-08:** Treat copied Claude commands, Claude agents, and shared hook scripts as per-file install targets: skip existing files without `--force`, replace them with `--force`, and continue the install with a full report instead of aborting the entire adapter install.
- **D-09:** Phase 4 should support generic tool selection and filtering in the CLI surface, but only Claude receives a full installer implementation in this phase.
- **D-10:** If the user chooses Claude from the interactive no-detection fallback, that choice carries the same authority as `--tool claude-code` and should create the Claude integration surface automatically.

### Claude's Discretion
- Exact report formatting, as long as it clearly distinguishes wiki scaffold work from Claude adapter work and calls out inactive assets.
- Exact module and function boundaries inside the thin generic installer pipeline.
- Whether the interactive no-detection prompt lists only implemented adapters or lists future adapters with explicit "not implemented in this phase" messaging.

### Deferred Ideas (OUT OF SCOPE)
- Claude lifecycle wiring for `session-end.sh` -- defer until the desired Claude session lifecycle event and payload shape are confirmed.
- Full non-Claude adapter implementations -- remain in later phases; Phase 4 should only prepare the shared installer shape for them.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | `npx codewiki init` works without global install | Existing `bin` field in package.json already correct; Commander.js not yet added but is in CLAUDE.md stack |
| CLI-02 | `--tool claude-code,codex` flag installs only specified adapters | Current `parseTools()` in init.ts already handles this; needs adapter filtering |
| CLI-03 | `--force` flag overwrites existing prompt/command files | Per-file skip/replace logic needed in adapter installer |
| CLI-04 | `--name <name>` flag sets project name in config | Already parsed in init.ts |
| CLI-05 | Auto-detect AI tools present | `detect.ts` already implements detection for all 4 tools |
| CLI-06 | Structured install report | `reporter.ts` exists; needs section grouping (wiki vs adapter) |
| CLI-07 | Re-running init without --force produces identical state | Merge utilities + per-file skip logic ensure idempotency |
| CC-01 | Installs 8 slash commands to `.claude/commands/codewiki/` | 8 .md files exist in `src/templates/claude/commands/codewiki/` |
| CC-02 | Installs 2 subagents to `.claude/agents/` | 2 .md files exist in `src/templates/claude/agents/` |
| CC-03 | Deep-merges hooks into `.claude/settings.json` | `deepMerge` + `deduplicateHookArray` in merge.ts; settings.json hook format verified below |
| CC-04 | Appends instructions to `CLAUDE.md` using markers | `mergeMarkerSection` in merge.ts handles this |
| CC-05 | Installs hook scripts to `.codewiki/hooks/` with mode 755 | 3 hook scripts exist in `src/templates/hooks/`; need `chmod` after copy |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | stdlib | File copy, read, write, chmod | Zero deps; `fs.cpSync`, `fs.chmodSync` stable since Node 20 [VERIFIED: codebase already uses fs/promises] |
| Node.js built-in `path` | stdlib | Path manipulation | Already used throughout codebase [VERIFIED: codebase] |
| Node.js built-in `readline` | stdlib | Interactive TTY prompt for tool selection | Zero deps; only used when no tool detected and stdin is TTY [ASSUMED] |
| Node.js built-in `tty` | stdlib | `process.stdin.isTTY` check | Standard Node.js TTY detection [VERIFIED: Node.js docs] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| picocolors | ^1.1.0 | Colored install report output | Per CLAUDE.md stack recommendation; not yet a dependency but approved [VERIFIED: CLAUDE.md] |

**No new dependencies required.** All merge, detection, and file utilities already exist in the codebase.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── commands/
│   └── init.ts              # Rewritten: orchestrates detect → scaffold → adapters → report
├── core/
│   ├── types.ts             # Add ToolAdapter interface
│   └── files.ts             # Add copyFileSafe(), chmodSafe()
├── lib/
│   ├── detect.ts            # Existing (extend for interactive fallback)
│   ├── merge.ts             # Existing (no changes needed)
│   ├── scaffold.ts          # Existing (wiki scaffold only)
│   ├── reporter.ts          # Extend for sectioned report
│   └── adapters/
│       ├── types.ts         # ToolAdapter interface
│       ├── claude.ts        # Claude Code adapter implementation
│       └── index.ts         # Adapter registry (resolveAdapter)
├── templates/
│   ├── claude/              # Existing template assets
│   ├── hooks/               # Existing hook scripts
│   └── scaffold.ts          # Existing wiki scaffold definitions
```

### Pattern 1: Adapter Interface
**What:** Each tool adapter implements a common interface so `init.ts` doesn't need tool-specific logic.
**When to use:** Always -- this is the core architectural pattern per D-03/D-04.
**Example:**
```typescript
// Source: derived from CONTEXT.md D-03/D-04
interface ToolAdapter {
  tool: SupportedTool;
  install(options: AdapterInstallOptions): Promise<ReportEntry[]>;
}

interface AdapterInstallOptions {
  root: string;
  projectName: string;
  force: boolean;
  templateDir: string;  // resolved path to dist/templates/
}
```

### Pattern 2: Claude settings.json Hook Structure
**What:** The exact JSON structure for Claude Code hooks in `.claude/settings.json`.
**When to use:** When building the Claude adapter's config merge logic.
**Example:**
```typescript
// Source: [VERIFIED: /home/giuice/.claude/settings.json on this machine]
// Claude Code settings.json hook format:
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .codewiki/hooks/pre-wiki-context.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .codewiki/hooks/post-verify.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

### Pattern 3: File Copy with Report
**What:** Copy template files to target, reporting created/skipped/replaced per file.
**When to use:** For all adapter file installations (commands, agents, hooks).
**Example:**
```typescript
// Source: derived from existing scaffold.ts pattern
async function copyTemplateFile(
  templatePath: string, targetPath: string, force: boolean
): Promise<ReportEntry> {
  const existed = await exists(targetPath);
  if (existed && !force) {
    return { action: "skipped", path: relativePath, reason: "exists" };
  }
  await mkdir(dirname(targetPath), { recursive: true });
  const content = await readFile(templatePath, "utf8");
  await writeFile(targetPath, content, "utf8");
  return { action: existed ? "replaced" : "created", path: relativePath };
}
```

### Pattern 4: Interactive TTY Fallback
**What:** When no tool detected and no `--tool` flag, prompt if TTY, error if not.
**When to use:** Per D-05.
**Example:**
```typescript
// Source: [VERIFIED: Node.js stdlib]
import { createInterface } from "node:readline/promises";

if (detectedTools.length === 0 && !toolFlag) {
  if (!process.stdin.isTTY) {
    throw new Error("No AI tools detected. Use --tool to specify: codewiki init --tool claude-code");
  }
  // Interactive prompt using readline
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("No AI tools detected. Install for: (1) claude-code\n> ");
  rl.close();
}
```

### Anti-Patterns to Avoid
- **Monolithic init function:** Don't put all install logic in one function. Adapter pattern keeps it modular.
- **Aborting on single file failure:** Per D-08, continue installing and report failures -- don't abort the whole adapter.
- **Hardcoding Claude paths in init.ts:** Keep tool-specific paths inside the adapter implementation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON deep merge | Custom recursive merge | Existing `deepMerge` in merge.ts | Already tested, handles edge cases |
| Hook array dedup | Manual array comparison | Existing `deduplicateHookArray` in merge.ts | Already tested |
| Markdown marker merge | Custom string manipulation | Existing `mergeMarkerSection` in merge.ts | Already tested, handles malformed markers |
| File path safety | Manual path joining | Existing `ensureInsideRoot` in files.ts | Prevents path traversal |

## Common Pitfalls

### Pitfall 1: Hook Deduplication on Re-run
**What goes wrong:** Running `init` twice doubles the hook entries in `settings.json`.
**Why it happens:** Hook arrays contain objects, not strings -- simple `Set` dedup doesn't work on objects.
**How to avoid:** The existing `deduplicateHookArray` works on string arrays. For the settings.json hooks structure (arrays of objects), need to compare by `command` field or serialize the hook entry for comparison.
**Warning signs:** Test with `init` twice and check `settings.json` hook count.

### Pitfall 2: Template Path Resolution at Runtime
**What goes wrong:** Template files not found when running from `npx` because path resolution uses source paths instead of dist paths.
**Why it happens:** `import.meta.dirname` points to `dist/commands/` at runtime, not `src/commands/`.
**How to avoid:** Use `import.meta.dirname` to resolve `../../templates/` relative to the compiled file location. The postbuild script already copies templates to `dist/templates/`.
**Warning signs:** Works in dev (`vitest`) but fails when installed via npm.

### Pitfall 3: chmod Not Applied to Copied Hook Scripts
**What goes wrong:** Hook scripts installed without executable permission, causing silent failures when Claude tries to run them.
**Why it happens:** `fs.writeFile` doesn't preserve source file permissions.
**How to avoid:** Explicitly `fs.chmodSync(targetPath, 0o755)` after copying each `.sh` file (CC-05 requirement).
**Warning signs:** Hooks installed but Claude reports "permission denied" when triggering them.

### Pitfall 4: CLAUDE.md Created vs Appended
**What goes wrong:** When `CLAUDE.md` doesn't exist and Claude is explicitly selected (D-06), the file should be created. But `mergeMarkerSection` expects existing content.
**How to avoid:** Pass empty string to `mergeMarkerSection` when file doesn't exist -- it already handles this case (line 79 of merge.ts: `const separator = existing.length > 0 ? "\n\n" : ""`).
**Warning signs:** None -- existing merge.ts handles this correctly.

### Pitfall 5: Scaffold Directories Still Created for All Tools
**What goes wrong:** Current `scaffoldDirectories` creates `.codewiki/adapters/{tool}` for ALL selected tools, but Phase 4 only implements Claude.
**Why it happens:** The scaffold function was designed pre-adapter.
**How to avoid:** Keep wiki scaffold generic (it creates `.codewiki/` structure). Adapter-specific directories (`.claude/commands/codewiki/`, `.claude/agents/`) are created by the adapter itself, not scaffold.
**Warning signs:** Extra empty adapter directories for unselected tools.

## Code Examples

### settings.json Merge for Claude Hooks
```typescript
// Source: derived from existing merge.ts + verified settings.json format
function buildClaudeHooksConfig(): Record<string, unknown> {
  return {
    hooks: {
      PreToolUse: [
        {
          matcher: "Write|Edit",
          hooks: [
            {
              type: "command",
              command: "bash .codewiki/hooks/pre-wiki-context.sh",
              timeout: 10
            }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: "Write|Edit",
          hooks: [
            {
              type: "command",
              command: "bash .codewiki/hooks/post-verify.sh",
              timeout: 10
            }
          ]
        }
      ]
    }
  };
}

// Merge with existing settings.json
async function mergeClaudeSettings(root: string): Promise<void> {
  const settingsPath = path.join(root, ".claude", "settings.json");
  const existing = await readTextIfExists(settingsPath) ?? "{}";
  const parsed = JSON.parse(existing);
  const codewikiConfig = buildClaudeHooksConfig();

  // Deep merge preserves existing keys
  const merged = deepMerge(parsed, codewikiConfig);

  // Deduplicate hook arrays by command string
  if (merged.hooks) {
    for (const event of ["PreToolUse", "PostToolUse"]) {
      if (Array.isArray(merged.hooks[event])) {
        merged.hooks[event] = deduplicateHookEntries(merged.hooks[event]);
      }
    }
  }

  await writeFile(settingsPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
}
```

### Hook Entry Deduplication (Object Arrays)
```typescript
// Source: [ASSUMED] -- new utility needed since existing deduplicateHookArray works on string[]
function deduplicateHookEntries(entries: HookEntry[]): HookEntry[] {
  const seen = new Set<string>();
  return entries.filter(entry => {
    // Use command string as dedup key
    const key = JSON.stringify(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

### Install Report Format
```typescript
// Source: [ASSUMED] -- recommended format per discretion area
/*
CodeWiki initialized for my-project.

Wiki scaffold:
  ✓ created  wiki/index.md
  ✓ created  wiki/log.md
  ...

Claude Code adapter:
  ✓ created  .claude/commands/codewiki/ingest.md
  ✓ created  .claude/commands/codewiki/query.md
  ...
  ✓ created  .claude/agents/codewiki-wiki-updater.md
  ✓ created  .claude/agents/codewiki-verifier.md
  ✓ created  .claude/settings.json (merged hooks)
  ✓ created  CLAUDE.md (appended instructions)

Shared hooks:
  ✓ created  .codewiki/hooks/pre-wiki-context.sh (755)
  ✓ created  .codewiki/hooks/post-verify.sh (755)
  ✓ created  .codewiki/hooks/session-end.sh (755, not wired)

Summary: 20 created, 0 skipped, 0 replaced, 0 failed
*/
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.3 |
| Config file | implicit (vitest finds src/**/*.test.ts) |
| Quick run command | `npx vitest run` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLI-01 | npx codewiki init works | integration | `node dist/bin/codewiki.js init --tool claude-code` | Partial (test/init.test.ts exists but needs rewrite) |
| CLI-02 | --tool filters adapters | unit | `npx vitest run -t "tool flag"` | Partial |
| CLI-03 | --force overwrites | unit | `npx vitest run -t "force"` | Partial |
| CLI-05 | Auto-detect tools | unit | `npx vitest run src/lib/__tests__/detect.test.ts` | Exists |
| CLI-06 | Structured report | unit | `npx vitest run -t "report"` | Partial |
| CLI-07 | Idempotent re-run | integration | `npx vitest run -t "idempotent"` | Needs creation |
| CC-01 | 8 commands installed | integration | `npx vitest run -t "claude commands"` | Needs creation |
| CC-02 | 2 agents installed | integration | `npx vitest run -t "claude agents"` | Needs creation |
| CC-03 | settings.json merge | unit | `npx vitest run -t "settings merge"` | Needs creation |
| CC-04 | CLAUDE.md markers | unit | `npx vitest run src/lib/__tests__/merge.test.ts` | Exists (merge.test.ts covers mergeMarkerSection) |
| CC-05 | Hook scripts mode 755 | integration | `npx vitest run -t "hook permissions"` | Needs creation |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/claude-adapter.test.ts` -- covers CC-01 through CC-05
- [ ] `test/init-integration.test.ts` -- covers CLI-01, CLI-07 (idempotent re-run in temp dir)
- [ ] Hook deduplication tests for object arrays (extend merge.test.ts)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `readline/promises` available for interactive prompt in Node >=20.11.0 | Architecture Patterns | LOW -- fallback to callback-style readline |
| A2 | Hook entry deduplication by JSON.stringify is sufficient | Code Examples | MEDIUM -- if Claude settings has non-deterministic key order, dedup fails; use command-field comparison instead |
| A3 | Hook `timeout: 10` is appropriate for wiki context scripts | Code Examples | LOW -- adjustable later |

## Open Questions

1. **CLAUDE.md instruction content**
   - What we know: `mergeMarkerSection` handles the merge. Template content exists in `adapter-templates.ts`.
   - What's unclear: Is the current `adapterReadme` content sufficient for CLAUDE.md, or should there be a separate instruction template?
   - Recommendation: Create a dedicated `src/templates/claude/instructions.md` template for the CLAUDE.md marker section content, separate from the adapter README.

2. **Commander.js adoption timing**
   - What we know: CLAUDE.md recommends Commander.js ^14.0.0 for CLI parsing.
   - What's unclear: Should Phase 4 adopt Commander.js or keep the manual arg parsing?
   - Recommendation: Keep manual parsing for Phase 4 (it works, and adding Commander.js is a separate concern). Adopt Commander.js in a later phase or as a separate task.

## Sources

### Primary (HIGH confidence)
- Codebase: `src/commands/init.ts`, `src/lib/merge.ts`, `src/lib/detect.ts`, `src/lib/scaffold.ts`, `src/lib/reporter.ts` -- verified current implementation
- Codebase: `src/templates/claude/` -- verified 8 commands + 2 agents exist
- Codebase: `src/templates/hooks/` -- verified 3 hook scripts exist
- Machine: `/home/giuice/.claude/settings.json` -- verified Claude Code hook JSON structure

### Secondary (MEDIUM confidence)
- `docs/codewiki-project-v2.md` -- design intent for settings.json hook wiring
- `docs/implementation-plan-v2.md` -- expected install verification scenarios

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all utilities already exist in codebase, no new deps needed
- Architecture: HIGH -- adapter pattern is well-defined by CONTEXT.md decisions
- Pitfalls: HIGH -- verified against actual codebase and settings.json format

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain, no fast-moving dependencies)
