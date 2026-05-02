---
status: complete
phase: 08-npm-publish-hardening
source:
  - .planning/phases/08-npm-publish-hardening/08-01-SUMMARY.md
  - .planning/phases/08-npm-publish-hardening/08-02-SUMMARY.md
  - .planning/phases/08-npm-publish-hardening/08-03-SUMMARY.md
started: 2026-05-01T15:48:00-03:00
updated: 2026-05-02T11:36:28-03:00
---

## Current Test

[testing complete]

## Tests

### 1. Package Runtime Contract
expected: As a maintainer inspecting the package, `package.json` declares `engines.node` as `>=20.11.0` and does not declare any runtime `dependencies`.
result: pass

### 2. Pack Manifest Contains Runtime Assets
expected: Running the pack manifest verification uses `npm pack --dry-run --json`; every runtime template asset needed by `codewiki init` is included, while tests, source maps, and helper-only template sources are excluded from the package.
result: pass

### 3. Local Tarball npx Smoke
expected: Running the local release-candidate tarball through `npx --yes --package <tarball> codewiki init --name packed-smoke --tool claude-code,codex,copilot,opencode` in a fresh temporary project initializes CodeWiki and writes representative Claude Code, Codex, Copilot, and OpenCode adapter files without leaving a generated `codewiki-*.tgz` in the repo.
result: pass

### 4. README Tool and Flag Guidance
expected: Reading the README shows the four supported tools (`claude-code`, `codex`, `copilot`, `opencode`), their skill/hook/instruction integration surfaces, and the `--tool`, `--force`, and `--name` flags.
result: pass

### 5. README Publish Verification Guidance
expected: Reading the README Development section shows `node >=20.11.0`, zero runtime dependency guidance, local tarball verification as the blocking pre-publish check, `codewiki@latest` as a post-publish registry check, and troubleshooting for missing templates or registry-only failures.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
