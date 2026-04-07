# Phase 1: Clean Slate - Research

**Researched:** 2026-04-07
**Domain:** Codebase cleanup / v1 runtime deletion
**Confidence:** HIGH

## Summary

Phase 1 removes six v1 runtime command files (ingest, query, lint, prd, tasks, status), updates `src/cli.ts` to only export `init`, removes v1 test files, and ensures `npm run build` passes. The v1 `init.ts` command is kept but will be heavily rewritten in later phases.

The core challenge is dependency analysis: several `src/core/` modules are used ONLY by v1 commands and can be removed, while `files.ts` and `types.ts` are also used by the kept `init.ts` and `src/templates/` modules.

**Primary recommendation:** Delete v1 command files first, then prune orphaned core modules, then fix cli.ts imports, then verify build compiles.

## Architecture Patterns

### Current Source Layout
```
src/
  bin/codewiki.ts        # Entry point (KEEP)
  cli.ts                 # Command router (EDIT - remove v1 imports)
  commands/
    init.ts              # KEEP (v2-relevant)
    ingest.ts            # DELETE (v1 runtime)
    query.ts             # DELETE (v1 runtime)
    lint.ts              # DELETE (v1 runtime)
    prd.ts               # DELETE (v1 runtime)
    tasks.ts             # DELETE (v1 runtime)
    status.ts            # DELETE (v1 runtime)
  core/
    config.ts            # DELETE (only used by v1 commands)
    files.ts             # KEEP (used by init.ts)
    frontmatter.ts       # DELETE (only used by lint.ts)
    hash.ts              # DELETE (only used by lint.ts)
    proposals.ts         # DELETE (only used by ingest.ts, query.ts, lint.ts)
    types.ts             # KEEP (used by init.ts, lint.ts, ingest.ts - but init.ts needs SUPPORTED_TOOLS)
    wiki-index.ts        # DELETE (only used by ingest.ts, query.ts)
  templates/
    adapter-templates.ts # KEEP (imports from core/)
    page-templates.ts    # KEEP
    scaffold.ts          # KEEP (imports from core/)
```

### Dependency Analysis [VERIFIED: grep of src/]

**Files to DELETE (6 commands):**
- `src/commands/ingest.ts` - v1 runtime
- `src/commands/query.ts` - v1 runtime
- `src/commands/lint.ts` - v1 runtime
- `src/commands/prd.ts` - v1 runtime
- `src/commands/tasks.ts` - v1 runtime
- `src/commands/status.ts` - v1 runtime

**Core modules to DELETE (used only by deleted commands):**
- `src/core/config.ts` - used by: ingest, query, lint, prd, status (all deleted)
- `src/core/frontmatter.ts` - used by: lint only
- `src/core/hash.ts` - used by: lint only
- `src/core/proposals.ts` - used by: ingest, query, lint (all deleted)
- `src/core/wiki-index.ts` - used by: ingest, query (all deleted)

**Core modules to KEEP:**
- `src/core/files.ts` - used by init.ts (ensureDir, writeTextFileSafe)
- `src/core/types.ts` - used by init.ts (SUPPORTED_TOOLS, SupportedTool)

**Test files to DELETE (all v1):**
- `test/ingest.test.ts`
- `test/query.test.ts`
- `test/lint.test.ts`
- `test/prd-tasks-status.test.ts`
- `test/cli.test.ts` - references v1 commands; needs review (may need edit instead of delete)
- `test/init.test.ts` - KEEP if it tests only init; review needed
- `test/helpers.ts` - review for v1-only helpers

**cli.ts edits needed:**
- Remove 6 imports (ingest, query, lint, prd, tasks, status)
- Remove those 6 entries from the COMMANDS record
- Update helpText() to remove v1 command descriptions

### Target State After Phase 1
```
src/
  bin/codewiki.ts        # Unchanged
  cli.ts                 # Only init command
  commands/
    init.ts              # Unchanged
  core/
    files.ts             # Unchanged
    types.ts             # Unchanged
  templates/
    adapter-templates.ts # Unchanged
    page-templates.ts    # Unchanged
    scaffold.ts          # Unchanged
test/
    init.test.ts         # Kept if clean
    helpers.ts           # Kept if still needed
```

## Common Pitfalls

### Pitfall 1: Orphaned imports in kept files
**What goes wrong:** After deleting core modules, `adapter-templates.ts` or `scaffold.ts` might import from deleted core files.
**How to avoid:** Verify imports in ALL kept files after deletion, before running build.

### Pitfall 2: tsconfig.test.json references
**What goes wrong:** Build script runs `tsc -p tsconfig.test.json` which may fail if test files reference deleted source.
**How to avoid:** Check tsconfig.test.json include patterns and delete test files in the same pass.

### Pitfall 3: Deleting init.test.ts when it should be kept
**What goes wrong:** init.test.ts tests the init command which is kept for v2.
**How to avoid:** Review init.test.ts content before deciding. If it imports v1-only helpers, it may need editing rather than deletion.

## Don't Hand-Roll

Not applicable for this phase -- it is purely deletion and cleanup.

## Open Questions

1. **cli.test.ts scope** - Does it test only CLI routing (affects v1 commands) or also init? Planner should task the executor to review before deleting.
2. **init.test.ts v1 coupling** - Does it reference v1 scaffolding behavior that will change in Phase 2? If so, keep but mark as needing update.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | adapter-templates.ts and scaffold.ts do not import from deleted core modules | Architecture | Build would fail; executor must verify |

## Sources

### Primary (HIGH confidence)
- Direct grep/ls of src/ directory structure and import statements

## Metadata

**Confidence breakdown:**
- File deletion list: HIGH - verified via grep
- Core module pruning: HIGH - verified via grep of all importers
- Test file handling: MEDIUM - need content review of init.test.ts and cli.test.ts

**Research date:** 2026-04-07
**Valid until:** Until Phase 1 execution begins (static codebase analysis)
