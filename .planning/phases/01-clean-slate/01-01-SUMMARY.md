---
phase: 01-clean-slate
plan: "01"
subsystem: cli
tags: [cleanup, deletion, build]
dependency_graph:
  requires: []
  provides: [clean-src-slate]
  affects: [src/cli.ts, src/commands/, src/core/, test/]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - src/cli.ts
    - test/init.test.ts
  deleted:
    - src/commands/ingest.ts
    - src/commands/query.ts
    - src/commands/lint.ts
    - src/commands/prd.ts
    - src/commands/tasks.ts
    - src/commands/status.ts
    - src/core/config.ts
    - src/core/frontmatter.ts
    - src/core/hash.ts
    - src/core/proposals.ts
    - src/core/wiki-index.ts
    - test/ingest.test.ts
    - test/query.test.ts
    - test/lint.test.ts
    - test/prd-tasks-status.test.ts
    - test/cli.test.ts
decisions:
  - cli.test.ts deleted entirely (all tests were v1 command-specific)
  - init.test.ts updated to remove v1 command assertions instead of deleted
metrics:
  duration: 10m
  completed: "2026-04-07"
  tasks_completed: 2
  files_modified: 2
  files_deleted: 16
---

# Phase 01 Plan 01: Clean Slate Summary

**One-liner:** Deleted 11 v1 runtime source files and 5 test files, reduced cli.ts to init-only with a clean build.

## What Was Done

Removed all v1 runtime CLI code to create a clean slate for v2 development:

- **6 v1 command files deleted:** ingest, query, lint, prd, tasks, status
- **5 orphaned core modules deleted:** config, frontmatter, hash, proposals, wiki-index
- **5 v1 test files deleted:** ingest.test.ts, query.test.ts, lint.test.ts, prd-tasks-status.test.ts, cli.test.ts
- **cli.ts updated:** stripped to init-only command map and simplified helpText
- **init.test.ts updated:** removed assertions for v1 commands (--help check, status command call)
- **npm run build:** passes with zero errors after all deletions

## Tasks

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Delete v1 runtime files and orphaned core modules | 17f10da | Done |
| 2 | Update cli.ts to init-only and verify build | 54d9bc8 | Done |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] cli.test.ts deleted (all v1 tests) vs edit**
- **Found during:** Task 1
- **Issue:** cli.test.ts contained only v1 command integration tests (ingest, query, lint, prd, tasks, status). No init-specific logic worth preserving.
- **Fix:** Deleted cli.test.ts entirely per plan instruction step 4 (delete if only tests v1 routing).
- **Files modified:** test/cli.test.ts (deleted)
- **Commit:** 17f10da

**2. [Rule 1 - Bug] init.test.ts status command reference removed**
- **Found during:** Task 1
- **Issue:** init.test.ts had a test calling `runCli(cwd, ["status"])` which would fail after deletion.
- **Fix:** Replaced with `runCli(cwd, ["init"])` to test that overwrite still fails, preserving the config-parser test intent.
- **Files modified:** test/init.test.ts
- **Commit:** 17f10da

## Known Stubs

None.

## Threat Flags

None — this plan only deletes code, introduces no new trust boundaries.

## Self-Check: PASSED

- src/commands/ contains only init.ts: FOUND
- src/core/ contains only files.ts and types.ts: FOUND
- Commit 17f10da exists: FOUND
- Commit 54d9bc8 exists: FOUND
- npm run build exits 0: VERIFIED
