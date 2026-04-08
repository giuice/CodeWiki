---
phase: 3
slug: prompt-templates-and-hook-scripts
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-07
validated: 2026-04-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + shellcheck |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/templates/__tests__/` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test` on changed template tests
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CMD-01 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-01-02 | 01 | 1 | CMD-02 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-01-03 | 01 | 1 | CMD-03 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-01-04 | 01 | 1 | CMD-04 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-01-05 | 01 | 1 | CMD-05 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-01-06 | 01 | 1 | CMD-06 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-01-07 | 01 | 1 | CMD-07 | — | N/A | unit | `npx vitest run src/templates/__tests__/commands.test.ts` | ✅ | ✅ green |
| 3-02-01 | 02 | 1 | HOOK-01 | — | exits 0 when wiki missing | integration | `npx vitest run src/templates/__tests__/hooks.test.ts` | ✅ | ✅ green |
| 3-02-02 | 02 | 1 | HOOK-02 | — | exits 0 on empty JSON | integration | `npx vitest run src/templates/__tests__/hooks.test.ts` | ✅ | ✅ green |
| 3-02-03 | 02 | 1 | HOOK-03 | — | never blocks agent | integration | `npx vitest run src/templates/__tests__/hooks.test.ts` | ✅ | ✅ green |
| 3-02-04 | 02 | 1 | HOOK-04 | — | shellcheck clean | lint | `npx vitest run src/templates/__tests__/hooks.test.ts` | ✅ | ✅ green |
| 3-02-05 | 02 | 1 | HOOK-05 | — | POSIX sh only | lint | `npx vitest run src/templates/__tests__/hooks.test.ts` | ✅ | ✅ green |
| 3-03-01 | 03 | 2 | AGENT-01 | — | N/A | unit | `npx vitest run src/templates/__tests__/agents.test.ts` | ✅ | ✅ green |
| 3-03-02 | 03 | 2 | AGENT-02 | — | N/A | unit | `npx vitest run src/templates/__tests__/agents.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing test infrastructure (`vitest`) covers template unit tests
- [x] `shellcheck` available via `npx --yes shellcheck` for HOOK-04 validation

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Command content matches source prompts | CMD-01–CMD-07 | Semantic content verification requires human review | Compare each command file against docs/prompts/ source material |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ complete

---

## Validation Audit 2026-04-08

| Metric | Count |
|--------|-------|
| Gaps found | 14 |
| Resolved | 14 |
| Escalated | 0 |

### Test Files Created

| File | Tests | Covers |
|------|-------|--------|
| `src/templates/__tests__/commands.test.ts` | 18 | CMD-01 through CMD-07 |
| `src/templates/__tests__/hooks.test.ts` | 12 | HOOK-01 through HOOK-05 |
| `src/templates/__tests__/agents.test.ts` | 8 | AGENT-01 and AGENT-02 |
