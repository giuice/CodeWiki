---
phase: 01-clean-slate
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/cli.ts
  - test/init.test.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed `src/cli.ts` (the CLI entry point) and `test/init.test.ts` (integration tests). The CLI is small, clean, and well-structured. The test file exercises the compiled binary via `spawnSync` which is a valid integration approach. No critical security or data-loss issues found. Three warnings relate to correctness risks and one reliability gap in tests; three info items are style and maintainability suggestions.

---

## Warnings

### WR-01: Hardcoded version string will silently go stale

**File:** `src/cli.ts:32`
**Issue:** The version string `"0.1.0"` is hardcoded. When `package.json` is bumped this value will not update, so `codewiki --version` will always report the wrong version after the first release.
**Fix:**
```typescript
// At the top of cli.ts, read the version from package.json at runtime.
// Since the module resolution is NodeNext/ESM, use import.meta.dirname:
import { readFileSync } from "node:fs";
import { join } from "node:path";

function packageVersion(): string {
  const pkg = JSON.parse(
    readFileSync(join(import.meta.dirname, "../../package.json"), "utf8")
  ) as { version: string };
  return pkg.version;
}

// Then in runCli:
if (command === "--version" || command === "-v") {
  console.log(packageVersion());
  return 0;
}
```
Alternatively, use a build-time constant injected by a `postbuild` script.

---

### WR-02: `--index` pre-increment on `args` array can silently read `undefined`

**File:** `src/commands/init.ts:29` and `src/commands/init.ts:33`
**Issue:** `args[++index]` reads the next element without bounding the index. If a user passes `--name` or `--tool` as the last argument with no following value, `value` becomes `undefined`, the guard `if (!value)` catches it only because `undefined` is falsy — which happens to work, but only by coincidence. If `value` were ever a valid falsy string (empty string after `.trim()`) the error message would be wrong. More importantly, the guard pattern is fragile; if a third option is added in the same style and the author forgets the guard, the bug silently passes `undefined` downstream.
**Fix:**
```typescript
} else if (arg === "--name") {
  index += 1;
  const value = args[index];
  if (value === undefined || value.startsWith("--")) {
    throw new Error("--name requires a non-empty project name");
  }
  projectName = value;
}
```
Check `=== undefined` explicitly, and also reject the case where the next token is another flag.

---

### WR-03: Test "init refuses overwrite" asserts failure but does not assert error message for the config-parser case

**File:** `test/init.test.ts:83`
**Issue:** The second part of the test (line 81-83) writes a partial YAML config and asserts the CLI exits non-zero, but does not assert anything about `stderr`. If the CLI fails for an unrelated reason (e.g., a file-system permission error), the test still passes, masking the actual failure mode. The test intent — "config parser fails closed" — is stated in the test name but not verified.
**Fix:**
```typescript
const badInit = runCli(cwd, ["init"]);
assert.notEqual(badInit.status, 0);
// Add one of the following depending on implemented error text:
assert.match(badInit.stderr, /config/i);
// or a more specific message check once the error text is known
```

---

## Info

### IN-01: `-v` flag is a non-standard alias for `--version`

**File:** `src/cli.ts:31`
**Issue:** The convention for short-form version flags is `--version` only, or `-V` (capital) as used by Commander.js. `-v` (lowercase) is conventionally `--verbose`. This is unlikely to cause a bug today but will conflict if a `--verbose` flag is ever added.
**Fix:** Change `-v` to `-V` or remove the short alias entirely and accept only `--version`.

---

### IN-02: `helpText()` is exported but not tested

**File:** `src/cli.ts:9`
**Issue:** `helpText()` is `export`ed from `cli.ts`, which suggests it was intended for use in tests or other modules. However, `init.test.ts` tests the help output via the compiled binary (subprocess), not by importing `helpText()` directly. The export is unused outside the module, creating a misleading public surface.
**Fix:** Either remove the `export` keyword (making it module-private), or add a unit test that imports and asserts on `helpText()` to verify the format without relying on the compiled binary.

---

### IN-03: `listRecursive` in helpers ignores symlinks silently

**File:** `test/helpers.ts:33`
**Issue:** `listRecursive` uses `statSync` (which follows symlinks) and pushes the entry name regardless of type. If the scaffold ever creates a symlink, it will be traversed as a directory and potentially cause infinite recursion or incorrect output. This is a latent risk in test infrastructure.
**Fix:** Add a guard to skip symlinks, or use `lstatSync` and check `isSymbolicLink()` before recursing:
```typescript
const stat = statSync(full);
if (stat.isSymbolicLink()) continue; // or handle explicitly
```

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
