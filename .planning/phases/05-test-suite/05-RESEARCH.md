# Phase 5: Test Suite - Research

**Researched:** 2026-04-10
**Domain:** Vitest test infrastructure, npm pack verification, shell script testing
**Confidence:** HIGH

## Summary

Phase 5 is primarily a gap-analysis and gap-fill phase, not a greenfield build. The test infrastructure is already substantially built: 74 vitest tests pass across 13 test files (lib/__tests__ and src/templates/__tests__), and 8 node:test integration tests pass in test/init.test.ts. The test command runs `npm run build && npm run test:unit && node --test "dist/test/**/*.test.js"` and passes cleanly today.

What Phase 5 must add is a focused set of tests that prove the four success criteria not yet covered by existing tests: (1) a dedicated idempotency test that asserts exactly one hook entry after two consecutive `init` runs (partially covered in init.test.ts but worth pinning as a named spec), (2) a programmatic `npm pack --dry-run` parser test that asserts the template file list (BUILD-02 is currently `Pending` — no test exists for this), (3) session-end.sh exit-0 behavior with empty JSON payload (covered in session-end.test.ts), and (4) pre-wiki-context.sh exit-0 when wiki/index.md is absent (covered in hooks.test.ts). Criteria 3 and 4 are already satisfied by existing vitest tests; the planner should confirm coverage rather than re-implement.

The main deliverable is a `test/pack.test.ts` integration test (node:test style, compiled to dist/test/) that runs `npm pack --dry-run` via `spawnSync` and asserts `dist/templates/claude/commands/codewiki/ingest.md` appears in the output. Note: the REQUIREMENTS.md says `dist/templates/claude/commands/ingest.md` but the actual tarball path is `dist/templates/claude/commands/codewiki/ingest.md` — the test must use the real path.

**Primary recommendation:** Add one new test file (`test/pack.test.ts`) for BUILD-02 pack verification, audit existing tests against each success criterion, and update the vitest config include pattern to also cover `src/templates/__tests__/**/*.test.ts` which is NOT yet included.

## Project Constraints (from CLAUDE.md)

- **Tech stack**: TypeScript + Node.js — existing build system, keep it [VERIFIED: codebase]
- **Zero runtime dependencies**: CLI must have no npm dependencies at runtime [VERIFIED: package.json has no `dependencies` field]
- **Zero LLM calls**: CLI never calls any AI API [VERIFIED: codebase]
- **npm publish**: Package must work via `npx`; prompt files must be bundled in `dist/` [VERIFIED: postbuild copies src/templates to dist/templates]
- **vitest** is the test framework specified in CLAUDE.md [VERIFIED: vitest ^4.1.3 in devDependencies, vitest.config.ts present]
- Use `node --test` runner for compiled integration tests (the test/ directory) [VERIFIED: package.json test script]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-01 | `npm run build` copies `src/templates/**` to `dist/templates/` (postbuild step) | Already implemented and passing — postbuild script in package.json confirmed working. No new code needed, but the pack test validates the output. |
| BUILD-02 | `npm pack --dry-run` lists `dist/templates/claude/commands/ingest.md` (prompt files in tarball) | Currently `Pending` with no test. A new `test/pack.test.ts` using `spawnSync('npm', ['pack', '--dry-run'])` and parsing stdout is the required deliverable. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.1.3 | Unit/integration tests for TypeScript | Already installed and configured; runs TypeScript directly without compile step; 74 tests passing |
| node:test | (stdlib, Node 25.9.0) | Compiled integration tests (test/ dir) | Already in use for init.test.ts; pattern established |
| node:child_process spawnSync | (stdlib) | Run CLI and npm commands in integration tests | Used in test/helpers.ts for CLI subprocess testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:fs/promises | (stdlib) | Async file ops in vitest tests | Used in all src/lib/__tests__ and src/templates/__tests__ |
| node:fs (sync) | (stdlib) | Sync file ops in node:test integration tests | Used in test/helpers.ts (mkdtempSync, readFileSync) |
| execSync | (stdlib) | Run shell scripts in hook tests | Used in src/templates/__tests__/hooks.test.ts |

**Installation:** No new packages needed. All dependencies already present.

**Version verification:** vitest 4.1.3 confirmed installed [VERIFIED: node_modules].

## Architecture Patterns

### Existing Test Layout
```
src/
  lib/
    __tests__/          # vitest unit tests for lib modules
      detect.test.ts
      merge.test.ts
      reporter.test.ts
      scaffold.test.ts
  templates/
    __tests__/          # vitest tests for template file content
      absorb.test.ts
      agents.test.ts
      breakdown.test.ts
      commands.test.ts
      hooks.test.ts
      ingest-backlinks.test.ts
      lint-query-backlinks.test.ts
      session-end.test.ts
  commands/
    __tests__/          # vitest unit test for TTY interactive path
      init.test.ts
test/                   # node:test integration tests (compiled to dist/test/)
  helpers.ts
  init.test.ts          # 8 end-to-end tests using spawnSync
```

### Pattern 1: vitest Unit Tests (src/**/__tests__)
**What:** Import TypeScript modules directly, test pure logic in-process, use async fs/promises.
**When to use:** Testing library functions (merge, scaffold, detect, reporter) and template content assertions.
**Example:**
```typescript
// Source: src/lib/__tests__/merge.test.ts
import { describe, expect, test } from "vitest";
import { deepMerge } from "../merge.js";

describe("deepMerge", () => {
  test("preserves existing keys when adding new keys", () => {
    expect(deepMerge<{ a: number; b: number; c?: number }>({ a: 1, b: 2 }, { c: 3 }))
      .toEqual({ a: 1, b: 2, c: 3 });
  });
});
```

### Pattern 2: node:test Integration Tests (test/)
**What:** Use node:assert/strict, spawnSync, mkdtempSync. Compiled via tsconfig.test.json to dist/test/, run with `node --test "dist/test/**/*.test.js"`.
**When to use:** End-to-end CLI tests that invoke the compiled binary in a temp directory.
**Example:**
```typescript
// Source: test/helpers.ts
import { spawnSync } from "node:child_process";
export function runCli(cwd: string, args: string[]): RunResult {
  const result = spawnSync(process.execPath, [cliPath(), ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
```

### Pattern 3: npm pack --dry-run Parsing (new test/pack.test.ts)
**What:** Run `npm pack --dry-run` via spawnSync, capture stdout, assert specific file paths appear.
**When to use:** BUILD-02 verification — confirms template files are included in the published tarball.
**Example:**
```typescript
// Source: [ASSUMED based on node:test patterns in test/init.test.ts]
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("npm pack --dry-run includes all template files", () => {
  const result = spawnSync("npm", ["pack", "--dry-run"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(result.status, 0, `npm pack failed: ${result.stderr}`);
  // Real tarball path — note codewiki/ subdirectory
  assert.match(result.stdout, /dist\/templates\/claude\/commands\/codewiki\/ingest\.md/);
  assert.match(result.stdout, /dist\/templates\/hooks\/pre-wiki-context\.sh/);
  assert.match(result.stdout, /dist\/templates\/hooks\/post-verify\.sh/);
  assert.match(result.stdout, /dist\/templates\/hooks\/session-end\.sh/);
});
```

### Pattern 4: Shell Script Exit Code Testing (existing, hooks.test.ts)
**What:** Use `execSync` with a trailing `; echo "EXIT:$?"` pattern to capture exit code.
**When to use:** Testing hook scripts exit 0 under various inputs.
**Example:**
```typescript
// Source: src/templates/__tests__/hooks.test.ts [VERIFIED: codebase]
const output = execSync(
  `echo "" | sh "${path.join(HOOKS_DIR, "pre-wiki-context.sh")}" 2>/dev/null; echo "EXIT:$?"`,
  { encoding: "utf8", timeout: 5000 }
);
const exitCode = output.trim().split("\n").pop()!;
expect(exitCode).toBe("EXIT:0");
```

### Anti-Patterns to Avoid
- **Writing tests already covered by existing suite:** merge.test.ts, scaffold.test.ts, hooks.test.ts, and init.test.ts already cover most success criteria. Don't duplicate.
- **Using vitest for pack test:** npm pack runs the prepack script (which triggers a full build+clean). Running it from vitest mid-suite would delete dist/. Use node:test in test/ instead, or run pack in a separate dedicated script.
- **Wrong ingest.md path in pack assertion:** REQUIREMENTS.md says `dist/templates/claude/commands/ingest.md` — this path does NOT exist. The actual path is `dist/templates/claude/commands/codewiki/ingest.md`. The test must use the real path.
- **Including test compiled output in published package:** Currently `dist/test/`, `dist/lib/__tests__/`, `dist/commands/__tests__/`, and `dist/templates/__tests__/` are all included in the tarball. This is a BUILD-02 adjacent issue — the pack test may optionally assert these should NOT be in the tarball, but that's out of scope for Phase 5.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp directory creation | Manual mkdir with UUID | `mkdtempSync` / `mkdtemp` | Already used in test helpers; atomic and auto-cleaned |
| CLI subprocess testing | Custom process wrapper | `spawnSync` via test/helpers.ts `runCli` / `mustRun` | Already abstracted; reuse the pattern |
| Shell script exit code assertion | Custom process runner | `execSync` with `; echo "EXIT:$?"` pattern | Pattern established in hooks.test.ts |

**Key insight:** The test patterns are fully established. Phase 5 adds tests, not new testing infrastructure.

## Coverage Gap Analysis

This is the critical planning input: what success criteria are covered vs. not covered today.

### Success Criterion 1: JSON deep-merge, hook deduplication, marker merge, scaffold directory tree
**Status: COVERED** [VERIFIED: codebase]
- `deepMerge` preserves existing keys: merge.test.ts line 7
- `deduplicateHookArray`/`deduplicateHookEntries`: merge.test.ts lines 39-63
- `mergeMarkerSection` replace/append: merge.test.ts lines 65-99
- Scaffold directory tree: scaffold.test.ts covers all required directories

**Action for planner:** AUDIT ONLY — confirm the specific behaviors named in the criterion are present. No new tests needed for this criterion.

### Success Criterion 2: Two consecutive `init` runs produce exactly one hook entry in `.claude/settings.json`
**Status: COVERED** [VERIFIED: codebase — test/init.test.ts line 132-183]
The test "init preserves existing Claude settings and instructions without duplication on rerun" already:
- Runs init twice
- Asserts `secondSettings.hooks.PreToolUse.length === 2` (1 user + 1 codewiki, no duplication)
- Asserts `secondSettings.hooks.PostToolUse.length === 1` (no duplication)
- Asserts exactly 1 `<!-- codewiki:start -->` occurrence in CLAUDE.md after both runs

**Action for planner:** AUDIT ONLY — this criterion is fully satisfied. The test may need a comment referencing the success criterion, but no new test code is needed.

### Success Criterion 3: `npm pack --dry-run` asserts `dist/templates/claude/commands/ingest.md` in file list
**Status: NOT COVERED** [VERIFIED: no test file runs npm pack]
BUILD-02 is `Pending` in REQUIREMENTS.md. No test currently runs `npm pack`.

**Correction needed:** The requirement says `dist/templates/claude/commands/ingest.md` but the actual pack output path is `dist/templates/claude/commands/codewiki/ingest.md` (verified by running `npm pack --dry-run` against the current codebase). The test must use the real path.

**Action for planner:** CREATE `test/pack.test.ts` using node:test. Compile via tsconfig.test.json. Runs in the same `node --test "dist/test/**/*.test.js"` step as init.test.ts.

### Success Criterion 4: Hook scripts exit code 0 with empty JSON payload and absent wiki/index.md
**Status: COVERED** [VERIFIED: codebase — src/templates/__tests__/hooks.test.ts]
- `pre-wiki-context.sh` exits 0 when wiki/index.md absent: hooks.test.ts line 21
- `post-verify.sh` exits 0 with empty input: hooks.test.ts line 31
- `post-verify.sh` exits 0 with malformed JSON: hooks.test.ts line 39
- `session-end.sh` exits 0 outside a git repo: session-end.test.ts line 22

**Important gap:** The success criterion says "both scripts when called with an empty JSON payload". The session-end.sh test calls without stdin piped, not with an explicit empty JSON payload `{}`. This is a minor gap worth addressing.

**Action for planner:** ADD a test case to session-end.test.ts (or hooks.test.ts) that pipes `{}` as stdin to session-end.sh.

## Critical Discovery: vitest Config Include Pattern

[VERIFIED: vitest.config.ts]

```typescript
export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"]
  }
});
```

The pattern `src/**/__tests__/**/*.test.ts` correctly covers:
- `src/lib/__tests__/*.test.ts` — lib unit tests
- `src/templates/__tests__/*.test.ts` — template content tests
- `src/commands/__tests__/*.test.ts` — command unit tests

All 13 test files are already included. No vitest config change needed.

## Critical Discovery: Test Files Published in npm Package

[VERIFIED: npm pack --dry-run output]

The current `package.json` `files` field is `["dist/", "README.md", "package.json"]`. This means compiled test files are included in the published tarball:
- `dist/test/init.test.js`
- `dist/lib/__tests__/merge.test.js`
- `dist/templates/__tests__/hooks.test.js`
- etc.

This bloats the package. However, fixing this (adding `.npmignore` or updating `files`) is a BUILD-03/BUILD-04 concern assigned to Phase 8, not Phase 5. The pack test in Phase 5 should NOT assert that test files are excluded — that's out of scope.

## Common Pitfalls

### Pitfall 1: npm pack --dry-run Triggers prepack (Full Build + Clean)
**What goes wrong:** `npm pack --dry-run` runs the `prepack` script, which runs `npm run build`, which runs `npm run clean` (deletes dist/), then recompiles. If the pack test runs while vitest is mid-test-suite, the dist/ deletion breaks the rest of the tests.
**Why it happens:** prepack is always triggered by npm pack, including --dry-run.
**How to avoid:** The pack test must live in `test/pack.test.ts` (node:test, compiled integration), not in a vitest file. The test script order is `vitest run` THEN `node --test dist/test/**`, so pack runs after vitest has completed.
**Warning signs:** "Cannot find module" errors in vitest after pack test runs.

### Pitfall 2: Wrong ingest.md Path in Pack Assertion
**What goes wrong:** Success criteria says `dist/templates/claude/commands/ingest.md` but that path doesn't exist in the tarball. The real path is `dist/templates/claude/commands/codewiki/ingest.md`.
**Why it happens:** The requirement was written before the command was nested in a `codewiki/` subdirectory.
**How to avoid:** Use the verified path `dist/templates/claude/commands/codewiki/ingest.md` in the test assertion.
**Warning signs:** Pack test always fails despite the file existing.

### Pitfall 3: Duplicating Existing Tests
**What goes wrong:** Writing new tests for deepMerge, scaffold, or hook exit codes that already have full coverage.
**Why it happens:** Phase description says "add tests covering X" without auditing what already exists.
**How to avoid:** Audit existing coverage first (done in this research). Only create tests for the genuine gap: pack verification + session-end empty-JSON-payload edge case.

### Pitfall 4: spawnSync PATH for npm
**What goes wrong:** `spawnSync("npm", ...)` fails on some systems because npm is not on the PATH when spawned.
**Why it happens:** Node's spawnSync uses the shell PATH, which may differ from the user's interactive PATH.
**How to avoid:** Use `spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ...)` or use the full npm path via `process.env.npm_execpath`. Since Windows is out of scope per CLAUDE.md, `npm` directly should work on Linux/macOS.

### Pitfall 5: Pack Test Running from Wrong CWD
**What goes wrong:** `npm pack --dry-run` runs from the wrong directory and can't find package.json.
**Why it happens:** node:test integration tests run from `process.cwd()` which is the repo root, but this needs to be confirmed.
**How to avoid:** Explicitly pass `cwd: process.cwd()` to spawnSync, or use the verified helpers.ts pattern.

## Code Examples

Verified patterns from existing codebase:

### npm pack --dry-run spawnSync pattern
```typescript
// Pattern: node:test integration test in test/pack.test.ts
// Source: adapts spawnSync pattern from test/helpers.ts [VERIFIED: codebase]
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("npm pack --dry-run includes required template files in tarball", () => {
  const result = spawnSync("npm", ["pack", "--dry-run"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  // npm pack --dry-run exits 0 on success
  assert.equal(result.status, 0, `npm pack failed:\n${result.stderr}`);
  // Assert real path — not the path in REQUIREMENTS.md which is wrong
  assert.match(result.stdout, /dist\/templates\/claude\/commands\/codewiki\/ingest\.md/);
  assert.match(result.stdout, /dist\/templates\/hooks\/pre-wiki-context\.sh/);
  assert.match(result.stdout, /dist\/templates\/hooks\/post-verify\.sh/);
  assert.match(result.stdout, /dist\/templates\/hooks\/session-end\.sh/);
});
```

### Session-end.sh with empty JSON payload
```typescript
// Pattern: extend session-end.test.ts
// Source: adapts pattern from src/templates/__tests__/hooks.test.ts [VERIFIED: codebase]
test("session-end.sh exits 0 with empty JSON payload stdin", () => {
  const output = execSync(
    `echo "{}" | sh "${SESSION_END_PATH}" 2>/dev/null; echo "EXIT:$?"`,
    { encoding: "utf8", timeout: 5000 }
  );
  const exitCode = output.trim().split("\n").pop()!;
  expect(exitCode).toBe("EXIT:0");
});
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The pack test should live in `test/pack.test.ts` (node:test) rather than vitest to avoid prepack/clean collision | Architecture Patterns | If the test command order changes, vitest placement could work; low risk given current script order |
| A2 | `spawnSync("npm", ...)` works without shell:true on Linux | Common Pitfalls | If npm is not on PATH, use `process.env.npm_execpath` or shell:true |

## Open Questions

1. **Path discrepancy in BUILD-02**
   - What we know: REQUIREMENTS.md says `dist/templates/claude/commands/ingest.md`; actual tarball path is `dist/templates/claude/commands/codewiki/ingest.md`
   - What's unclear: Whether to update REQUIREMENTS.md to match reality or update the test description to note the discrepancy
   - Recommendation: Use the real path in the test, add a comment noting the REQUIREMENTS.md path was pre-`codewiki/` subdirectory

2. **Test file exclusion from npm tarball**
   - What we know: Compiled test files (dist/test/, dist/lib/__tests__/, etc.) are currently included in the published package
   - What's unclear: Should Phase 5 add a `.npmignore` or update the `files` field to exclude them
   - Recommendation: Out of scope for Phase 5 (assigned to Phase 8 BUILD-03/BUILD-04). Document as a known issue in pack test comments.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | test runner | Yes | v25.9.0 | — |
| vitest | unit tests | Yes | 4.1.3 | — |
| npm | pack test | Yes | (bundled with Node) | — |
| shellcheck | hooks.test.ts via npx | npx --yes pulls it | via npx | `npx --yes shellcheck` (already used) |

**Missing dependencies with no fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.3 (unit) + node:test stdlib (integration) |
| Config file | `vitest.config.ts` (include: `src/**/__tests__/**/*.test.ts`) |
| Quick run command | `npx vitest run` |
| Full suite command | `npm test` (build + vitest + node:test) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-01 | postbuild copies templates to dist/templates/ | integration (pack) | `npm pack --dry-run` in test/pack.test.ts | No — Wave 0 |
| BUILD-02 | `npm pack --dry-run` lists ingest.md in tarball | integration (pack) | `node --test dist/test/pack.test.js` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/pack.test.ts` — covers BUILD-01 and BUILD-02
- [ ] Additional test case in `src/templates/__tests__/session-end.test.ts` — covers SC-4 empty JSON payload edge case

*(Existing infrastructure covers all other requirements — no framework install or config changes needed)*

## Security Domain

Security enforcement is enabled (no explicit false in config). However, this phase is a test-only phase with no new application logic, no network calls, no authentication surfaces, no data persistence, and no user-controlled inputs reaching application code paths. The only external process spawned is `npm pack --dry-run` (read-only) and shell scripts under test.

**Applicable ASVS Categories:**

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — no auth |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | Test assertions are not user-facing inputs |
| V6 Cryptography | No | N/A |

**Threat patterns specific to this phase:** None — test code is dev-only, not shipped logic.

## Sources

### Primary (HIGH confidence)
- [VERIFIED: codebase] `vitest.config.ts` — include pattern and framework version
- [VERIFIED: codebase] `package.json` — test scripts, devDependencies, files field
- [VERIFIED: codebase] `test/init.test.ts` — idempotency test coverage (SC-2)
- [VERIFIED: codebase] `src/lib/__tests__/merge.test.ts` — deepMerge, deduplication, marker merge coverage (SC-1)
- [VERIFIED: codebase] `src/lib/__tests__/scaffold.test.ts` — directory tree coverage (SC-1)
- [VERIFIED: codebase] `src/templates/__tests__/hooks.test.ts` — exit code coverage (SC-4)
- [VERIFIED: npm pack --dry-run] — actual tarball file list, confirmed ingest.md path

### Secondary (MEDIUM confidence)
- [ASSUMED] spawnSync("npm", ...) works for pack test without shell:true on Linux

## Metadata

**Confidence breakdown:**
- Existing coverage audit: HIGH — verified by reading all test files and running the test suite
- Gap identification: HIGH — BUILD-02 gap confirmed by grepping for "pack" in all test files (no match)
- Path correction (ingest.md): HIGH — confirmed by running npm pack --dry-run and inspecting output
- Pack test pattern: MEDIUM — adapts existing spawnSync patterns; the prepack/clean concern is real but manageable given script ordering

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable stack, no fast-moving dependencies)
