---
phase: 08
slug: npm-publish-hardening
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-01
---

# Phase 08 - Security

Per-phase security contract for npm publish hardening. This audit verifies only the mitigations declared in the Phase 08 plan threat models and summary artifacts.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm metadata -> user runtime | `engines.node` communicates the supported Node version before `init` runs. | Package metadata consumed by npm and users |
| source templates -> packaged tarball | `src/templates/**` must survive build and npm file allowlisting as `dist/templates/**`. | Runtime template assets copied into the published package |
| package manifest -> dependency install | Runtime dependencies must not creep into the installer package accidentally. | Package dependency metadata consumed during install |
| local source tree -> generated tarball | The pre-publish smoke must execute the packaged artifact, not the working tree directly. | Generated `.tgz` release candidate |
| npm/npx execution -> fresh project | The package must resolve bundled `dist/templates/**` assets after npm extraction. | CLI execution through `npx` in a temporary project |
| temporary test output -> repository | Generated `.tgz` files must be cleaned up so tests do not dirty the repo. | Test artifacts produced by `npm pack --json` |
| README -> user execution | Commands must distinguish local release candidate checks from published registry checks. | User-facing install and smoke commands |
| README -> maintainer release process | Troubleshooting must point to build, pack manifest, and registry checks without changing scope. | Maintainer release guidance |
| dependency statement -> package contract | Documentation must match the package's zero-runtime-dependency state. | Public package contract documentation |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-08-01-01 | D | Node runtime | mitigate | `package.json` declares `engines.node: >=20.11.0`; verified by parsed package JSON check. | closed |
| T-08-01-02 | T | package dependencies | mitigate | `package.json` has no `dependencies` key; verified by parsed package JSON check. | closed |
| T-08-01-03 | R | tarball manifest | mitigate | `test/pack.test.ts` parses `npm pack --dry-run --json`, asserts every required runtime template path, and rejects non-runtime artifacts with forbidden pack patterns. | closed |
| T-08-02-01 | R | pre-publish smoke | mitigate | `test/init.test.ts` runs `npm pack --json`; `test/helpers.ts` invokes the generated tarball through `npx --yes --package <tarball> codewiki`. | closed |
| T-08-02-02 | T | asset resolution | mitigate | The local tarball smoke asserts scaffold files plus Claude, Codex, Copilot, and OpenCode adapter files in a fresh temp project. | closed |
| T-08-02-03 | D | generated tarball cleanup | mitigate | The local tarball smoke deletes the generated `.tgz` in a `finally` block with `unlinkSync`. | closed |
| T-08-03-01 | R | release docs | mitigate | `README.md` documents local tarball smoke as the blocking pre-publish check and `codewiki@latest` as the post-publish registry check. | closed |
| T-08-03-02 | I | runtime contract | mitigate | `README.md` states `node >=20.11.0`, zero runtime dependencies, and dev-only TypeScript, Vitest, and `@types/node`. | closed |
| T-08-03-03 | D | troubleshooting | mitigate | `README.md` includes concise troubleshooting for missing templates and registry-specific failures. | closed |

*Status: open | closed*
*Disposition: mitigate (implementation required) | accept (documented risk) | transfer (third-party)*

---

## Verification Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-08-01-01 | `package.json` contains `"engines": { "node": ">=20.11.0" }`; `node -e "const p=require('./package.json'); if (p.engines.node !== '>=20.11.0') process.exit(1); if ('dependencies' in p) process.exit(2)"` passed. |
| T-08-01-02 | `package.json` contains no top-level `dependencies` field; the parsed package JSON check passed. |
| T-08-01-03 | `test/pack.test.ts` defines `REQUIRED_TEMPLATE_FILES`, builds a `Set` from npm pack JSON `files[].path`, asserts every required template path, and defines `FORBIDDEN_PACKAGE_PATTERNS`. Focused `rg` checks passed. |
| T-08-02-01 | `test/init.test.ts` contains `local npm tarball works through npx in a fresh project`; `test/helpers.ts` uses `npx --yes --package` against the local tarball. Focused `rg` checks passed. |
| T-08-02-02 | The tarball smoke asserts `.codewiki/config.yml`, shared hooks, `wiki/index.md`, Claude shared skill, `.agents` shared skill, `.codex/hooks.json`, `.github/hooks/codewiki-hooks.json`, and `.opencode/plugins/codewiki.ts`. |
| T-08-02-03 | `test/init.test.ts` imports and calls `unlinkSync(tarballPath)` inside `finally` when the generated tarball exists. |
| T-08-03-01 | `README.md` includes `npm pack --dry-run --json`, local tarball smoke via `npx --yes --package`, post-publish `codewiki@latest` smoke, and explicit post-publish wording. |
| T-08-03-02 | `README.md` states the package targets `node >=20.11.0`, runtime dependencies are intentionally zero, and TypeScript, Vitest, and `@types/node` are dev-only. |
| T-08-03-03 | `README.md` has a `Publish troubleshooting` subsection covering `src/templates/**` to `dist/templates/**`, pack manifest checks, and registry/publish verification failures. |

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit 2026-05-01

| Metric | Count |
|--------|-------|
| Threats found | 9 |
| Closed | 9 |
| Open | 0 |

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-01 | 9 | 9 | 0 | Codex |

## Verification Commands

| Command | Result |
|---------|--------|
| `node -e "const p=require('./package.json'); if (p.engines.node !== '>=20.11.0') process.exit(1); if ('dependencies' in p) process.exit(2)"` | passed |
| `rg -n "REQUIRED_TEMPLATE_FILES\|FORBIDDEN_PACKAGE_PATTERNS\|npm pack --dry-run\|--json\|dist/templates/skills/codewiki-tasks/SKILL.md\|dist/templates/codex/hooks/user-prompt-submit.sh\|dist/templates/copilot/hooks/agent-stop.sh\|dist/templates/opencode/plugins/codewiki.ts" test/pack.test.ts` | passed |
| `rg -n 'local npm tarball works through npx in a fresh project\|\["pack", "--json"\]\|mustRunPackedCli\|--package\|claude-code,codex,copilot,opencode\|unlinkSync\|\.opencode/plugins/codewiki\.ts' test/init.test.ts test/helpers.ts` | passed |
| `rg -n "node >=20\.11\.0\|npm pack --dry-run --json\|codewiki@latest init --name latest-smoke\|Runtime dependencies are intentionally zero\|troubleshooting\|post-publish\|registry" README.md` | passed |
| `npm test` | passed: 16 Vitest files / 105 tests and 17 compiled node tests |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-01
