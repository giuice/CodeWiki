---
phase: 4
slug: claude-code-adapter-init-command
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.3 |
| **Config file** | implicit (vitest finds src/**/*.test.ts) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | CLI-01 | — | N/A | integration | `node dist/bin/codewiki.js init --tool claude-code` | Partial | ⬜ pending |
| 04-01-02 | 01 | 1 | CLI-02 | — | N/A | unit | `npx vitest run -t "tool flag"` | Partial | ⬜ pending |
| 04-01-03 | 01 | 1 | CLI-03 | — | N/A | unit | `npx vitest run -t "force"` | Partial | ⬜ pending |
| 04-01-04 | 01 | 1 | CLI-05 | — | N/A | unit | `npx vitest run src/lib/__tests__/detect.test.ts` | ✅ | ⬜ pending |
| 04-01-05 | 01 | 1 | CLI-06 | — | N/A | unit | `npx vitest run -t "report"` | Partial | ⬜ pending |
| 04-01-06 | 01 | 1 | CLI-07 | — | N/A | integration | `npx vitest run -t "idempotent"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | CC-01 | — | N/A | integration | `npx vitest run -t "claude commands"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | CC-02 | — | N/A | integration | `npx vitest run -t "claude agents"` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | CC-03 | — | N/A | unit | `npx vitest run -t "settings merge"` | ❌ W0 | ⬜ pending |
| 04-02-04 | 02 | 1 | CC-04 | — | N/A | unit | `npx vitest run src/lib/__tests__/merge.test.ts` | ✅ | ⬜ pending |
| 04-02-05 | 02 | 1 | CC-05 | — | N/A | integration | `npx vitest run -t "hook permissions"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/claude-adapter.test.ts` — stubs for CC-01 through CC-05
- [ ] `test/init-integration.test.ts` — stubs for CLI-01, CLI-07 (idempotent re-run in temp dir)
- [ ] Extend `src/lib/__tests__/merge.test.ts` — hook deduplication for object arrays

*Existing infrastructure covers CLI-04, CLI-05, CC-04.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npx codewiki init end-to-end in real project | CLI-01 | Requires npm publish or npm link | 1. `npm link` in CodeWiki, 2. `cd /tmp/test-project && npm init -y && mkdir .claude`, 3. `npx codewiki init`, 4. Verify output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
