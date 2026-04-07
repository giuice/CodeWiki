---
phase: 2
slug: shared-infrastructure
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 installs if missing) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | MERGE-01 | — | N/A | unit | `npx vitest run src/lib/__tests__/merge.test.ts` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | MERGE-02 | — | N/A | unit | `npx vitest run src/lib/__tests__/merge.test.ts` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | MERGE-03 | — | N/A | unit | `npx vitest run src/lib/__tests__/merge.test.ts` | ✅ | ✅ green |
| 02-01-04 | 01 | 1 | MERGE-04 | — | N/A | unit | `npx vitest run src/lib/__tests__/merge.test.ts` | ✅ | ✅ green |
| 02-02-01 | 02 | 1 | WIKI-01 | — | N/A | unit | `npx vitest run src/lib/__tests__/scaffold.test.ts` | ✅ | ✅ green |
| 02-02-02 | 02 | 1 | WIKI-02 | — | N/A | unit | `npx vitest run src/lib/__tests__/scaffold.test.ts` | ✅ | ✅ green |
| 02-02-03 | 02 | 1 | WIKI-03 | — | N/A | unit | `npx vitest run src/lib/__tests__/scaffold.test.ts` | ✅ | ✅ green |
| 02-03-01 | 03 | 1 | WIKI-04 | — | N/A | unit | `npx vitest run src/lib/__tests__/detect.test.ts` | ✅ | ✅ green |
| 02-03-02 | 03 | 1 | WIKI-05 | — | N/A | unit | `npx vitest run src/lib/__tests__/detect.test.ts` | ✅ | ✅ green |
| 02-04-01 | 04 | 1 | — | — | N/A | unit | `npx vitest run src/lib/__tests__/reporter.test.ts` | ✅ | ✅ green |
| 02-05-01 | 05 | 2 | — | — | N/A | integration | `npm run build && ls dist/templates/` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest` — install as devDependency if not present
- [x] `vitest.config.ts` — create config for TypeScript ESM
- [x] `src/lib/__tests__/merge.test.ts` — stubs for MERGE-01 through MERGE-04
- [x] `src/lib/__tests__/scaffold.test.ts` — stubs for WIKI-01 through WIKI-03
- [x] `src/lib/__tests__/detect.test.ts` — stubs for WIKI-04, WIKI-05
- [x] `src/lib/__tests__/reporter.test.ts` — stubs for reporter output

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-04-07
