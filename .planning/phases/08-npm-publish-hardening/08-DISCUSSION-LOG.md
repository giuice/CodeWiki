# Phase 8: npm Publish Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 08-npm-publish-hardening
**Areas discussed:** Pack coverage, clean install smoke, dependencies and engines, README publish docs

---

## Pack Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Representative files | Keep current style: one canonical skill plus key shared hooks. | |
| All required assets | Verify every template/asset required by `init` appears in the tarball. | ✓ |
| Planner decides | Let the planner choose coverage depth. | |

**User's choice:** All required assets.
**Notes:** User explicitly said "sim todos" when asked whether all templates/needed assets should be checked.

---

## Clean Install Smoke

| Option | Description | Selected |
|--------|-------------|----------|
| Local tarball as main gate | Generate `npm pack`, run the package in a clean temp project, and validate scaffold/assets. | ✓ |
| Local tarball plus post-publish checklist | Automate local tarball smoke and document manual `npx codewiki@latest init` after publishing. | ✓ |
| Automate `npx codewiki@latest` | Block pre-publish on the npm registry package. | |

**User's choice:** Local tarball smoke before publish; post-publish `npx codewiki@latest init` is acceptable as a checklist item.
**Notes:** User initially did not understand why `codewiki@latest` differs from local code. Clarification: `latest` tests the already-published registry package, so it is not the right pre-publish gate.

---

## Dependencies and Engines

| Option | Description | Selected |
|--------|-------------|----------|
| Zero runtime dependencies | Keep the package dependency-free unless a concrete reason appears. | ✓ |
| Allow `picocolors` | Permit small dependency-free color output helper if useful. | ✓ |
| Add `commander` | Use a CLI parsing library for flags/subcommands. | |

**User's choice:** Runtime dependencies should stay near zero, but `picocolors` is acceptable. `commander` is not needed by default.
**Notes:** During discussion, current npm metadata was checked: `picocolors@1.1.1` is about 6.3 KB unpacked and dependency-free; `commander@14.0.3` is about 209 KB unpacked, dependency-free, and requires Node >=20. User concluded `picocolors` is small enough to be worth the cost and carries no meaningful risk.

---

## README Publish Docs

| Option | Description | Selected |
|--------|-------------|----------|
| User usage only | Keep README focused on normal users. | |
| Publish notes only | Add narrow maintainer verification notes. | |
| Full practical coverage | Cover user usage, release verification, and troubleshooting without becoming a long internal manual. | ✓ |

**User's choice:** Full practical coverage.
**Notes:** User answered "tudo": README should include everything relevant to install/use, publication verification, and troubleshooting.

---

## the agent's Discretion

- Exact test structure for full tarball asset assertions.
- Exact implementation of local packed-package smoke.
- Whether to actually add `picocolors`; it is allowed, not required.
- Exact README section structure.

## Deferred Ideas

None.
