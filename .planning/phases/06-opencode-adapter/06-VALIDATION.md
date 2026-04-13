---
phase: 6
slug: opencode-adapter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Mixed: `node:test` compiled from `test/**/*.ts` plus Vitest for `src/**/__tests__/**/*.test.ts` |
| **Config file** | `tsconfig.test.json` and `vitest.config.ts` |
| **Quick run command** | `npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/opencode-adapter.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20-30 seconds once the new tests exist |

---

## Sampling Rate

- **After Plan 06-01 completion:** `npx vitest run src/templates/__tests__/opencode-adapter.test.ts`
- **After Plan 06-02 implementation work:** `npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/opencode-adapter.test.ts`
- **Before phase closeout:** `npm test`
- **Max feedback latency:** under 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | OC-02 | T-06-01 / — | OpenCode agents preserve updater/verifier responsibilities without granting unintended behavior | unit/content | `npx vitest run src/templates/__tests__/opencode-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | OC-03 / OC-04 | T-06-02 / T-06-03 | Plugin template contains only the documented event bridge and instructions template stays concise | unit/content | `npx vitest run src/templates/__tests__/opencode-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | OC-01 / OC-02 / OC-03 / OC-04 | T-06-04 | `init --tool opencode` installs skills, agents, plugin, and `AGENTS.md` marker block in a temp project | integration | `npm run build && node --test dist/test/init.test.js` | ✅ existing suite, needs new case | ⬜ pending |
| 06-02-02 | 02 | 1 | CLI-07 (phase dependency) | T-06-05 | Rerunning the OpenCode install does not duplicate marker sections or surface contradictory report output | integration | `npm run build && node --test dist/test/init.test.js` | ✅ existing suite, needs new case | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/templates/__tests__/opencode-adapter.test.ts` — template assertions for the OpenCode plugin, instructions, and agent assets
- [ ] `test/init.test.ts` — OpenCode explicit-bootstrap and rerun-idempotency coverage
- [x] Existing `node:test` and Vitest infrastructure already exists; no framework install required

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OpenCode runtime accepts the generated plugin without host-specific payload surprises | OC-03 | Official docs confirm event names, but not every payload shape we may normalize before passing to shell hooks | In a temp project, run the built CLI with `--tool opencode`, start OpenCode if available, and confirm the plugin loads and the generated file remains syntactically valid |

---

## Validation Sign-Off

- [ ] All tasks have automated verification or an explicit Wave 0 dependency
- [ ] Sampling continuity: no three consecutive tasks without an automated verify step
- [ ] Wave 0 closes the missing OpenCode template + init regression surface
- [ ] No watch-mode flags
- [ ] Feedback latency under 30 seconds
- [ ] `nyquist_compliant: true` set in frontmatter after execution validation

**Approval:** pending
