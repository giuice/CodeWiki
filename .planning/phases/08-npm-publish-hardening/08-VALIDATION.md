---
phase: 08
slug: npm-publish-hardening
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-01
---

# Phase 08 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest plus Node `node:test` compiled integration tests |
| Config file | `vitest.config.ts`, `tsconfig.test.json` |
| Quick run command | `npm run build && node --test dist/test/pack.test.js dist/test/init.test.js` |
| Full suite command | `npm test` |
| Estimated runtime | ~30-90 seconds |

## Sampling Rate

- After every task commit: run the task-level command in the plan's `<verify>` block.
- After every plan wave: run `npm run build && node --test dist/test/pack.test.js dist/test/init.test.js`.
- Before `$gsd-verify-work`: run `npm test`.
- Max feedback latency: one plan.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | BUILD-03 | T-08-01-01 | Node version contract is explicit | metadata | `node -e "const p=require('./package.json'); if (p.engines.node !== '>=20.11.0') process.exit(1)"` | yes | pending |
| 08-01-02 | 01 | 1 | BUILD-04 | T-08-01-02 | Runtime dependency creep is blocked | metadata | `node -e "const p=require('./package.json'); if (p.dependencies) process.exit(1)"` | yes | pending |
| 08-01-03 | 01 | 1 | BUILD-02 | T-08-01-03 | Pack manifest includes runtime templates | integration | `npm run build && node --test dist/test/pack.test.js` | yes | pending |
| 08-02-01 | 02 | 2 | CLI-01, BUILD-03 | T-08-02-01 | Local candidate tarball works through npx | integration | `npm run build && node --test dist/test/init.test.js` | yes | pending |
| 08-03-01 | 03 | 3 | BUILD-03, BUILD-04 | T-08-03-01 | Release verification is documented | docs | `rg -n "npm pack|codewiki@latest|>=20.11.0|runtime dependencies|troubleshooting" README.md` | yes | pending |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Published registry package works as `codewiki@latest` | Phase 8 success criterion 3 | Cannot be verified before publishing the local candidate | After publish, run `tmpdir=$(mktemp -d) && cd "$tmpdir" && npx codewiki@latest init --name latest-smoke` and verify `wiki/index.md` exists |

## Validation Sign-Off

- [x] All tasks have automated verify commands or explicit manual-only rationale.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing test infrastructure.
- [x] No watch-mode flags.
- [x] Feedback latency bounded by plan.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending

