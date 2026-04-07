---
phase: 3
slug: prompt-templates-and-hook-scripts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node --test (built-in) + shellcheck |
| **Config file** | none — scripts are standalone |
| **Quick run command** | `node --test src/templates/__tests__/*.test.ts` |
| **Full suite command** | `npm test && shellcheck --shell=sh src/templates/hooks/*.sh` |
| **Estimated runtime** | ~5 seconds |

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
| 3-01-01 | 01 | 1 | CMD-01 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-read.md` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | CMD-02 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-update.md` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | CMD-03 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-status.md` | ❌ W0 | ⬜ pending |
| 3-01-04 | 01 | 1 | CMD-04 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-search.md` | ❌ W0 | ⬜ pending |
| 3-01-05 | 01 | 1 | CMD-05 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-verify.md` | ❌ W0 | ⬜ pending |
| 3-01-06 | 01 | 1 | CMD-06 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-init.md` | ❌ W0 | ⬜ pending |
| 3-01-07 | 01 | 1 | CMD-07 | — | N/A | unit | `grep -q 'description:' src/templates/commands/wiki-export.md` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | HOOK-01 | — | exits 0 when wiki missing | integration | `echo '' \| sh src/templates/hooks/pre-wiki-context.sh; echo $?` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | HOOK-02 | — | exits 0 on empty JSON | integration | `echo '' \| sh src/templates/hooks/post-verify.sh; echo $?` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 1 | HOOK-03 | — | never blocks agent | integration | `sh -c 'timeout 5 sh src/templates/hooks/pre-wiki-context.sh'; echo $?` | ❌ W0 | ⬜ pending |
| 3-02-04 | 02 | 1 | HOOK-04 | — | shellcheck clean | lint | `shellcheck --shell=sh src/templates/hooks/*.sh` | ❌ W0 | ⬜ pending |
| 3-02-05 | 02 | 1 | HOOK-05 | — | POSIX sh only | lint | `grep -c 'bash' src/templates/hooks/*.sh \| grep -v ':0$'` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | AGENT-01 | — | N/A | unit | `test -f src/templates/agents/codewiki-wiki-updater.md` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | AGENT-02 | — | N/A | unit | `test -f src/templates/agents/codewiki-verifier.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install `shellcheck` if not available — needed for HOOK-04 validation
- [ ] Existing test infrastructure (`node --test`) covers template unit tests

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Command content matches source prompts | CMD-01–CMD-07 | Semantic content verification requires human review | Compare each command file against docs/prompts/ source material |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
