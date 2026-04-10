---
phase: 5
slug: test-suite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.3 (unit) + node:test stdlib (integration) |
| **Config file** | `vitest.config.ts` (include: `src/**/__tests__/**/*.test.ts`) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm test` (build + vitest + node:test) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | BUILD-02 | — | N/A — test-only phase | integration | `node --test dist/test/pack.test.js` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | BUILD-02 | — | N/A | unit | `npx vitest run src/templates/__tests__/session-end.test.ts` | ✅ exists | ⬜ pending |
| 05-01-03 | 01 | 1 | BUILD-01, BUILD-02 | — | N/A | integration | `npm test` | ✅ (after build) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/pack.test.ts` — stubs BUILD-01 and BUILD-02 (compiled via tsconfig.test.json → dist/test/pack.test.js)
- [ ] Additional test case in `src/templates/__tests__/session-end.test.ts` — SC-4 empty JSON payload edge case

*Existing infrastructure covers all other requirements — no framework install or config changes needed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
