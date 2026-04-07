# Phase 2: Shared Infrastructure - Research

**Researched:** 2026-04-07
**Domain:** TypeScript library modules (file I/O, JSON merge, tool detection, reporting)
**Confidence:** HIGH

## Summary

Phase 2 creates four library modules under `src/lib/` and confirms the postbuild copy step. The existing codebase already has significant infrastructure in `src/core/files.ts` (ensureDir, writeFileSafe, exists, readText) and `src/templates/scaffold.ts` (directory/file scaffolding). The phase reorganizes and extends this into purpose-built modules.

The key insight: most of the scaffold logic already exists. `scaffold.ts` already creates the wiki directory tree and files. The work is extracting reusable library functions, adding the missing `detect.ts` and `reporter.ts` modules, implementing proper JSON deep merge, and adding a postbuild copy step.

**Primary recommendation:** Build four focused modules (`merge.ts`, `scaffold.ts`, `detect.ts`, `reporter.ts`) in `src/lib/`, reusing existing `src/core/files.ts` utilities. Use `node --test` for now (already configured) or migrate to vitest as a stretch goal.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WIKI-01 | Creates `wiki/index.md` and `wiki/log.md` | Already implemented in `src/templates/scaffold.ts` scaffoldFiles(); `src/lib/scaffold.ts` wraps this |
| WIKI-02 | Creates `wiki/entities/`, `wiki/decisions/`, `wiki/lessons/`, `wiki/issues/`, `wiki/sources/` | Already in scaffoldDirectories(); verify in new module |
| WIKI-03 | Creates `raw/` and `tasks/` directories | `raw/` exists in scaffoldDirectories(); `tasks/` is MISSING -- must be added |
| WIKI-04 | Creates `.codewiki/config.yml` | Already in scaffoldFiles() via configTemplate() |
| WIKI-05 | Creates `.codewiki/templates/` with 5 page templates | Already in scaffoldFiles(); 5 templates exist in page-templates.ts |
| MERGE-01 | JSON merge never clobbers existing user keys | New `src/lib/merge.ts` -- inline recursive deep merge (~20 lines per CLAUDE.md) |
| MERGE-02 | JSON merge deduplicates CodeWiki hooks on re-run | Array dedup logic in merge.ts -- match by hook command path or identifier |
| MERGE-03 | Markdown merge never creates duplicate marker sections | Marker-based insert/replace in merge.ts using `<!-- codewiki:start/end -->` |
| MERGE-04 | `--force` replaces existing marker section | Force mode in markdown merge replaces content between markers |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs/promises` | (stdlib) | All file I/O | Already used in core/files.ts; zero deps per CLAUDE.md [VERIFIED: codebase] |
| Node.js built-in `path` | (stdlib) | Path manipulation | Already used throughout [VERIFIED: codebase] |
| TypeScript | ^5.x | Language | Already configured [VERIFIED: tsconfig.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.1.3 | Unit testing | Recommended by CLAUDE.md; current `node --test` works but vitest runs TS directly [VERIFIED: npm registry] |

**No new runtime dependencies.** CLAUDE.md mandates zero runtime deps. All modules use Node.js stdlib only.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── bin/              # CLI entry point (exists)
├── cli.ts            # CLI router (exists)
├── commands/         # Command handlers (exists)
│   └── init.ts       # Init command (exists, will import from lib/)
├── core/             # Low-level utilities (exists)
│   ├── files.ts      # File I/O helpers (exists)
│   └── types.ts      # Type definitions (exists)
├── lib/              # NEW: shared library modules
│   ├── merge.ts      # JSON deep merge + markdown marker merge
│   ├── scaffold.ts   # Wiki directory tree creation (refactor from templates/)
│   ├── detect.ts     # AI tool detection
│   └── reporter.ts   # Structured install report
└── templates/        # Template content (exists)
    ├── page-templates.ts
    ├── adapter-templates.ts
    └── scaffold.ts   # Keep or re-export from lib/scaffold.ts
```

### Pattern 1: Pure Functions with Root Parameter
**What:** Every lib function takes `root: string` as first param, never touches `process.cwd()` directly
**When to use:** All file operations
**Example:**
```typescript
// Already established pattern in core/files.ts
export async function ensureDir(root: string, relativeDir: string): Promise<void> {
  await mkdir(ensureInsideRoot(root, relativeDir), { recursive: true });
}
```
[VERIFIED: codebase src/core/files.ts]

### Pattern 2: Inline Deep Merge (No Library)
**What:** ~20-line recursive merge function for JSON objects
**When to use:** Merging `.claude/settings.json`, `opencode.json`
**Example:**
```typescript
// Source: CLAUDE.md recommendation
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceVal = source[key];
    const targetVal = result[key];
    if (
      sourceVal !== null &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      ) as T[keyof T];
    } else {
      result[key] = sourceVal as T[keyof T];
    }
  }
  return result;
}
```
[ASSUMED -- standard pattern, adjust for exactOptionalPropertyTypes in tsconfig]

### Pattern 3: Marker-Based Markdown Merge
**What:** Insert/replace content between `<!-- codewiki:start -->` and `<!-- codewiki:end -->` markers
**When to use:** Appending instructions to CLAUDE.md, AGENTS.md, copilot-instructions.md
**Example:**
```typescript
const START_MARKER = "<!-- codewiki:start -->";
const END_MARKER = "<!-- codewiki:end -->";

export function mergeMarkerSection(
  existing: string,
  newContent: string,
  force: boolean
): string {
  const startIdx = existing.indexOf(START_MARKER);
  const endIdx = existing.indexOf(END_MARKER);
  if (startIdx !== -1 && endIdx !== -1) {
    if (!force) return existing; // MERGE-03: don't duplicate
    // MERGE-04: --force replaces
    return existing.slice(0, startIdx) +
      START_MARKER + "\n" + newContent + "\n" + END_MARKER +
      existing.slice(endIdx + END_MARKER.length);
  }
  return existing + "\n\n" + START_MARKER + "\n" + newContent + "\n" + END_MARKER + "\n";
}
```
[ASSUMED -- straightforward string manipulation]

### Anti-Patterns to Avoid
- **Using lodash/deepmerge library:** CLAUDE.md explicitly forbids runtime deps for this [VERIFIED: CLAUDE.md]
- **Mutating input objects in deepMerge:** Always return new object; callers expect immutability
- **Hardcoding tool paths:** Use a map/config, not switch statements scattered across files

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom YAML parser | Write YAML as template strings (already done) | config.yml is write-only from CLI; reading is done by AI tools |
| File path safety | Custom path validation | Existing `ensureInsideRoot()` in core/files.ts | Already handles path traversal attacks [VERIFIED: codebase] |
| Recursive dir creation | Manual mkdir chain | `fs.mkdir({ recursive: true })` via existing `ensureDir()` | Already implemented [VERIFIED: codebase] |

## Common Pitfalls

### Pitfall 1: Missing `tasks/` Directory
**What goes wrong:** WIKI-03 requires `tasks/` but current `scaffoldDirectories()` only creates `raw/`
**Why it happens:** Original scaffold predates the requirements spec
**How to avoid:** Add `"tasks"` to the directories array in scaffold
**Warning signs:** Test for WIKI-03 fails

### Pitfall 2: Array Handling in Deep Merge (MERGE-02)
**What goes wrong:** Naive deep merge treats arrays as atomic (replaces entirely), losing existing hooks
**Why it happens:** JSON hooks are arrays of objects; simple replace loses user entries
**How to avoid:** For hook arrays specifically, implement dedup-and-append: keep existing entries, add new CodeWiki entries only if not already present. Match by a key field (e.g., hook command path).
**Warning signs:** Re-running `init` doubles the hook entries in settings.json

### Pitfall 3: TypeScript Strict Mode Gotchas
**What goes wrong:** `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true` cause type errors in generic merge code
**Why it happens:** These are enabled in tsconfig.json [VERIFIED: codebase]
**How to avoid:** Use explicit type assertions in the merge function; test compilation as part of development
**Warning signs:** `tsc` errors on merge.ts generics

### Pitfall 4: Postbuild Step Not Configured
**What goes wrong:** `npm run build` produces `dist/` with only JS files; template .md/.yml files missing
**Why it happens:** `tsc` does not copy non-TS files
**How to avoid:** Add a `postbuild` script to package.json: `"postbuild": "cp -r src/templates dist/templates"` or similar
**Warning signs:** `ls dist/templates/` shows nothing after build

### Pitfall 5: Tool Detection False Positives
**What goes wrong:** Detecting tools in wrong directories or detecting partial matches
**Why it happens:** `.github/` exists in many repos without Copilot; need to check for specific file `.github/copilot-instructions.md`
**How to avoid:** Check exact paths: `.claude/` dir, `.codex/` dir, `opencode.json` file, `.github/copilot-instructions.md` file
**Warning signs:** detect.ts returns copilot for every GitHub repo

## Code Examples

### detect.ts - Tool Detection
```typescript
import { exists } from "../core/files.js";
import { ensureInsideRoot } from "../core/files.js";
import type { SupportedTool } from "../core/types.js";

interface DetectionRule {
  tool: SupportedTool;
  check: string; // relative path to check
  type: "dir" | "file";
}

const DETECTION_RULES: DetectionRule[] = [
  { tool: "claude-code", check: ".claude", type: "dir" },
  { tool: "codex", check: ".codex", type: "dir" },
  { tool: "opencode", check: "opencode.json", type: "file" },
  { tool: "copilot", check: ".github/copilot-instructions.md", type: "file" },
];

export async function detectTools(root: string): Promise<SupportedTool[]> {
  const detected: SupportedTool[] = [];
  for (const rule of DETECTION_RULES) {
    const target = ensureInsideRoot(root, rule.check);
    if (await exists(target)) {
      detected.push(rule.tool);
    }
  }
  return detected;
}
```
[ASSUMED -- based on CLI-05 requirement and existing codebase patterns]

### reporter.ts - Structured Report
```typescript
export type ReportAction = "created" | "skipped" | "replaced" | "failed";

export interface ReportEntry {
  action: ReportAction;
  path: string;
  reason?: string;
}

export function formatReport(entries: ReportEntry[]): string {
  const symbols: Record<ReportAction, string> = {
    created: "✓",
    skipped: "⚠",
    replaced: "↻",
    failed: "✗",
  };
  const lines = entries.map(
    (e) => `  ${symbols[e.action]} ${e.action.padEnd(8)} ${e.path}${e.reason ? ` (${e.reason})` : ""}`
  );
  const summary = Object.entries(
    entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.action] = (acc[e.action] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([k, v]) => `${v} ${k}`).join(", ");

  return [...lines, "", `Summary: ${summary}`].join("\n");
}
```
[ASSUMED -- based on CLI-06 requirement]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (current) -- vitest migration recommended but not required |
| Config file | tsconfig.test.json (exists) |
| Quick run command | `npm run build && node --test dist/test/merge.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WIKI-01 | Creates wiki/index.md and wiki/log.md | unit | `node --test dist/test/scaffold.test.js` | No -- Wave 0 |
| WIKI-02 | Creates entity/decision/lesson/issue/source dirs | unit | `node --test dist/test/scaffold.test.js` | No -- Wave 0 |
| WIKI-03 | Creates raw/ and tasks/ directories | unit | `node --test dist/test/scaffold.test.js` | No -- Wave 0 |
| WIKI-04 | Creates .codewiki/config.yml | unit | `node --test dist/test/scaffold.test.js` | No -- Wave 0 |
| WIKI-05 | Creates .codewiki/templates/ with 5 templates | unit | `node --test dist/test/scaffold.test.js` | No -- Wave 0 |
| MERGE-01 | JSON merge preserves existing keys | unit | `node --test dist/test/merge.test.js` | No -- Wave 0 |
| MERGE-02 | JSON merge deduplicates hooks | unit | `node --test dist/test/merge.test.js` | No -- Wave 0 |
| MERGE-03 | Markdown merge no duplicate markers | unit | `node --test dist/test/merge.test.js` | No -- Wave 0 |
| MERGE-04 | --force replaces marker section | unit | `node --test dist/test/merge.test.js` | No -- Wave 0 |

### Wave 0 Gaps
- [ ] `test/merge.test.ts` -- covers MERGE-01 through MERGE-04
- [ ] `test/scaffold.test.ts` -- covers WIKI-01 through WIKI-05 (existing `test/init.test.ts` may partially cover)
- [ ] `test/detect.test.ts` -- covers detect.ts tool detection
- [ ] `test/reporter.test.ts` -- covers reporter.ts output format

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Deep merge ~20 lines suffices for settings.json structure | Architecture Patterns | LOW -- may need special array handling for hooks (MERGE-02) |
| A2 | Tool detection paths (.claude/, .codex/, opencode.json, .github/copilot-instructions.md) are correct | Code Examples | LOW -- paths come from REQUIREMENTS.md CLI-05 |
| A3 | `tasks/` directory is missing from current scaffold and needs adding | Pitfalls | MEDIUM -- verify against current scaffoldDirectories() |

## Open Questions

1. **Should `src/lib/scaffold.ts` replace or wrap `src/templates/scaffold.ts`?**
   - What we know: templates/scaffold.ts has the logic; lib/scaffold.ts is the new target
   - What's unclear: Whether to move the code or create a facade
   - Recommendation: Move scaffoldDirectories/scaffoldFiles to `src/lib/scaffold.ts`, update imports in init.ts. Delete templates/scaffold.ts or re-export from it.

2. **Hook array dedup strategy for MERGE-02**
   - What we know: `.claude/settings.json` has PreToolUse/PostToolUse hook arrays
   - What's unclear: Exact structure of hook entries and what field to use as dedup key
   - Recommendation: Use the hook command/script path as the unique key for dedup

## Sources

### Primary (HIGH confidence)
- Codebase inspection: src/core/files.ts, src/templates/scaffold.ts, src/commands/init.ts, tsconfig.json, package.json
- CLAUDE.md: stack decisions, zero-dep constraint, inline merge recommendation
- REQUIREMENTS.md: WIKI-01..05, MERGE-01..04 specifications

### Secondary (MEDIUM confidence)
- npm registry: vitest 4.1.3 current version [VERIFIED: npm view]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all stdlib, no new deps, verified against codebase
- Architecture: HIGH - extending existing patterns already in codebase
- Pitfalls: HIGH - derived from concrete codebase analysis and requirement gaps

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable domain, no external deps)
