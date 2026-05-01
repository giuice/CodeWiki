---
phase: 08-npm-publish-hardening
verified: 2026-05-01T18:35:59Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
---

# Phase 8: npm Publish Hardening Verification Report

**Phase Goal:** npm publish hardening for CodeWiki, including package/pack manifest coverage, local tarball npx smoke, and bounded README release verification docs.
**Verified:** 2026-05-01T18:35:59Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npm pack --dry-run` output includes all runtime template files needed by `init` | VERIFIED | `test/pack.test.ts:5` defines 32 required template paths; `test/pack.test.ts:67` parses `npm pack --dry-run --json`; parsed spot-check found `requiredCount: 32`, `missing: []`. |
| 2 | Pack verification uses npm's machine-readable dry-run JSON as source of truth | VERIFIED | `test/pack.test.ts:67-79` runs `npm pack --dry-run --json`, parses JSON, and builds a `Set` from `files[].path`. |
| 3 | Package metadata declares Node `>=20.11.0` and zero runtime dependencies | VERIFIED | `package.json:44-46` declares engines; no `dependencies` key exists; `node -e` contract check exited 0. |
| 4 | Runtime package allowlist is scoped to runtime artifacts | VERIFIED | `package.json:9-42` allowlists compiled CLI/lib modules, declarations, required templates, README, and package metadata only. |
| 5 | Runtime dependencies remain zero; Commander and picocolors were not added | VERIFIED | `package.json:64-68` contains only devDependencies; no runtime `dependencies` key exists. |
| 6 | Negative pack assertions reject non-runtime artifacts | VERIFIED | `test/pack.test.ts:40-46` forbids `dist/test`, `__tests__`, helper template sources, and source maps; `test/pack.test.ts:85-88` asserts none are packed. |
| 7 | Local release-candidate tarball runs through `npx` in a fresh project | VERIFIED | `test/init.test.ts:69-116` packs a local `.tgz`, runs `init` in `tempProject()`, and asserts scaffold plus Claude/Codex/Copilot/OpenCode files; `npm test` passed. |
| 8 | Local tarball smoke uses npm package form, not direct archive execution | VERIFIED | `test/helpers.ts:25-27` runs `npx --yes --package <tarball> codewiki ...`, matching the post-review fix. |
| 9 | Local tarball smoke cleans generated package artifacts | VERIFIED | `test/init.test.ts:70-114` tracks `tarballPath` and unlinks it in `finally`; `ls codewiki-*.tgz` returned no files after tests. |
| 10 | README documents user-facing install/use, four tools, hook strategies, and `--tool`, `--force`, `--name` | VERIFIED | `README.md:293-300` documents four tool strategies; `README.md:251` and `README.md:293` document flags. |
| 11 | README documents isolated local tarball smoke and post-publish `codewiki@latest` check without making registry latest the pre-publish gate | VERIFIED | `README.md:321-344` documents temp-dir local tarball smoke with `npx --yes --package "$TARBALL" codewiki ...` and a separate post-publish `codewiki@latest` smoke. |
| 12 | Phase review report is clean after post-review fixes | VERIFIED | `.planning/phases/08-npm-publish-hardening/08-REVIEW.md` frontmatter has `status: clean`, `warning: 0`, `info: 0`, `total: 0`. |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | npm engine, zero runtime dependency contract, runtime package allowlist | VERIFIED | Engines present at `package.json:44-46`; no runtime dependencies; files allowlist at `package.json:9-42`. |
| `test/pack.test.ts` | Full runtime template tarball manifest coverage and negative pack assertions | VERIFIED | Required manifest at `test/pack.test.ts:5-38`; JSON pack parse at `test/pack.test.ts:67-79`; forbidden patterns at `test/pack.test.ts:40-46`. |
| `test/helpers.ts` | Reusable helper for local tarball `npx` invocation | VERIFIED | `runPackedCli` and `mustRunPackedCli` exist at `test/helpers.ts:25-43`; package form uses `--package`. |
| `test/init.test.ts` | Local packed tarball smoke coverage | VERIFIED | Test at `test/init.test.ts:69-116` runs `npm pack --json`, invokes packed CLI, asserts scaffold/adapter files, and cleans tarball. |
| `README.md` | Bounded user and maintainer publish verification guidance | VERIFIED | Publish verification and troubleshooting sections at `README.md:321-348`; multi-tool table at `README.md:293-300`. |
| `.planning/phases/08-npm-publish-hardening/08-REVIEW.md` | Clean post-review report | VERIFIED | Review frontmatter records zero findings and `status: clean`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json` | npm tarball contents | `files` allowlist plus `prepack` build | WIRED | `package.json:9-42` allowlists package contents; `package.json:55` runs build before pack. |
| `test/pack.test.ts` | npm pack manifest | `spawnSync("npm", ["pack", "--dry-run", "--json"])` | WIRED | JSON output is parsed and asserted from `files[].path`. |
| `test/init.test.ts` | packed CLI helper | `mustRunPackedCli(cwd, tarballPath, ...)` | WIRED | Imported at `test/init.test.ts:6`, used at `test/init.test.ts:84`. |
| `test/helpers.ts` | local tarball executable path | `npx --yes --package <tarball> codewiki` | WIRED | `test/helpers.ts:25-27` invokes the generated tarball package through npm-supported package form. |
| `README.md` | implemented release checks | documented commands | WIRED | README commands match test behavior: package-form local tarball smoke and separate post-publish registry smoke. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `test/pack.test.ts` | `files` | Parsed `npm pack --dry-run --json` output | Yes | FLOWING |
| `test/init.test.ts` | `tarballPath`, temp project file set | Parsed `npm pack --json` filename and `listRecursive(cwd)` after packed `init` | Yes | FLOWING |
| `test/helpers.ts` | `RunResult` | `spawnSync("npx", ...)` stdout/stderr/status | Yes | FLOWING |
| `README.md` | Release commands | Static documentation aligned to tested command form | Yes | VERIFIED_STATIC |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full project suite | `npm test` | 16 Vitest files / 105 tests and 17 compiled node tests passed | PASS |
| Engine and dependency contract | `node -e "const p=require('./package.json'); if (p.engines.node !== '>=20.11.0') process.exit(1); if ('dependencies' in p) process.exit(2)"` | Exited 0 | PASS |
| Pack manifest coverage | `node --test dist/test/pack.test.js` | 1 test passed | PASS |
| Local tarball npx smoke and init coverage | `npm run build && node --test dist/test/init.test.js` | 14 tests passed, including local tarball smoke | PASS |
| Pack JSON required/forbidden manifest parse | Custom `npm pack --dry-run --json` parser | 74 files, 32 required, `missing: []`, `forbiddenHits: []` | PASS |
| Tarball cleanup | `ls codewiki-*.tgz 2>/dev/null || true` | No generated tarball remained | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CLI-01 | 08-02, 08-03 | `npx codewiki init` works without a global install | SATISFIED | Local `.tgz` is invoked through `npx --yes --package <tarball> codewiki` in a fresh temp project and creates scaffold/adapter files. |
| BUILD-03 | 08-01, 08-02, 08-03 | `engines.node >= "20.11.0"` set in package.json | SATISFIED | `package.json:44-46`; node contract check passed. |
| BUILD-04 | 08-01, 08-02, 08-03 | Zero npm runtime dependencies, with Commander.js and optional picocolors only | SATISFIED | No `dependencies` field in `package.json`; README states runtime dependencies are intentionally zero. |

No additional Phase 8 requirement IDs were found in `.planning/REQUIREMENTS.md` beyond BUILD-03 and BUILD-04. CLI-01 is claimed by Phase 8 plan frontmatter and remains satisfied by the local packed `npx` smoke without changing the original requirements traceability.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `test/helpers.ts` | 48 | `const output: string[] = []` | INFO | Accumulator in recursive file listing, not stub data. |
| `test/init.test.ts` | 70 | `let tarballPath: string \| null = null` | INFO | Cleanup state initialized before `finally`, not a hollow implementation. |
| `test/init.test.ts` | 376 | `Unsupported (not yet implemented)` | INFO | Negative assertion ensuring stale pending-integration text is absent. |

No blocker or warning anti-patterns found.

### Human Verification Required

None.

### Gaps Summary

No gaps found. Phase 8's publish-hardening goal is achieved in the codebase: npm package metadata is hardened, pack manifest coverage is complete and negative, local tarball `npx` smoke is executable and isolated, README release verification stays bounded, and the post-review report is clean.

---

_Verified: 2026-05-01T18:35:59Z_
_Verifier: the agent (gsd-verifier)_
