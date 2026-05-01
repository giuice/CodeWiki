---
phase: 7
slug: codex-and-copilot-adapters
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-01
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Mixed: `node:test` compiled from `test/**/*.ts` plus Vitest for `src/**/__tests__/**/*.test.ts` |
| **Config file** | `tsconfig.test.json` and `vitest.config.ts` |
| **Quick run command** | `npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/codex-adapter.test.ts src/templates/__tests__/copilot-adapter.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~25-40 seconds once the new tests exist |

---

## Sampling Rate

- **After template plans:** Run the relevant Vitest template test file.
- **After adapter wiring plans:** Run `npm run build && node --test dist/test/init.test.js`.
- **After regression plan:** Run the quick run command, then `npm test`.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** under 40 seconds for quick checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | CODEX-02 | T-07-01-01 | Codex wrappers translate shared hook output into event-appropriate JSON and avoid loop-prone Stop output | content/unit | `npx vitest run src/templates/__tests__/codex-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | CODEX-02 / CODEX-03 | T-07-01-02 | Codex hook/config/instruction templates are narrow and no-clobber ready | content/unit | `npx vitest run src/templates/__tests__/codex-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | CODEX-02 | T-07-01-03 | Codex TOML agents preserve updater/verifier permissions and role boundaries | content/unit | `npx vitest run src/templates/__tests__/codex-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | CODEX-01 / CODEX-02 / CODEX-03 | T-07-02-01 | `init --tool codex` installs shared skills plus Codex-owned hooks, config, agents, and `AGENTS.md` without clobbering user content | integration | `npm run build && node --test dist/test/init.test.js` | ✅ suite exists, needs new case | ⬜ pending |
| 07-03-01 | 03 | 3 | CODEX-01 / CODEX-02 / CODEX-03 | T-07-03-01 | Codex install is idempotent and mixed Claude+Codex selections write both skill trees exactly once | integration | `npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/codex-adapter.test.ts` | ✅ suite exists, needs new cases | ⬜ pending |
| 07-04-01 | 04 | 1 | COP-01 / COP-02 | T-07-04-01 | Copilot hook/instruction templates use `agentStop` for smart follow-up and leave `sessionEnd` cleanup-only | content/unit | `npx vitest run src/templates/__tests__/copilot-adapter.test.ts` | ❌ W0 | ⬜ pending |
| 07-05-01 | 05 | 2 | COP-01 / COP-02 / COP-03 | T-07-05-01 | `init --tool copilot` installs shared skills plus Copilot hook and instruction surfaces without clobbering user content | integration | `npm run build && node --test dist/test/init.test.js` | ✅ suite exists, needs new case | ⬜ pending |
| 07-06-01 | 06 | 3 | COP-01 / COP-02 / COP-03 | T-07-06-01 | Copilot install is idempotent and mixed Claude+Copilot selections write both skill trees exactly once | integration | `npm run build && node --test dist/test/init.test.js && npx vitest run src/templates/__tests__/copilot-adapter.test.ts` | ✅ suite exists, needs new cases | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/templates/__tests__/codex-adapter.test.ts` — Codex hook/config/agent/instruction template assertions.
- [ ] `src/templates/__tests__/copilot-adapter.test.ts` — Copilot hook/instruction template assertions.
- [ ] `test/init.test.ts` — Codex and Copilot explicit-bootstrap, no-clobber, rerun-idempotency, and mixed-selection coverage.
- [x] Existing `node:test` and Vitest infrastructure already exists; no framework install required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Codex runtime accepts generated wrappers and hook JSON with current payloads | CODEX-02 | Official docs define contracts, but live CLI hook payload details can change | In a temp project, run built `codewiki init --tool codex`, start Codex with hooks enabled, trigger prompt, apply_patch, and stop events; confirm wrappers exit 0 and no continuation loop occurs |
| Copilot runtime accepts generated hook JSON and conservative `agentStop` behavior | COP-01 | GitHub docs define config shape, but runtime availability can vary between CLI/cloud surfaces | In a temp project, run built `codewiki init --tool copilot`, start Copilot CLI if available, trigger tool and stop events, and confirm hook commands do not block normal operation |

---

## Validation Sign-Off

- [ ] All tasks have automated verification or an explicit Wave 0 dependency.
- [ ] Sampling continuity: no three consecutive tasks without an automated verify step.
- [ ] Wave 0 covers missing Codex/Copilot template + init regression surface.
- [ ] No watch-mode flags.
- [ ] Feedback latency under 40 seconds.
- [ ] `nyquist_compliant: true` set in frontmatter after execution validation.

**Approval:** pending
