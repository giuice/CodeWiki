# Phase 8: npm Publish Hardening - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 hardens the npm publication path for CodeWiki. It must make the package self-contained, set the Node engine contract, prove the packed tarball includes all required template assets, and verify that a clean project can run the packaged CLI and receive the expected wiki scaffold and selected tool integrations. It does not reopen adapter design, skill semantics, hook lifecycle decisions, or broader product scope from earlier phases.

</domain>

<decisions>
## Implementation Decisions

### Pack and template coverage
- **D-01:** Pack verification should cover all required template assets, not just one representative skill and a few hook scripts.
- **D-02:** The planner can choose the exact assertion structure, but the gate must fail if any shipped source template needed by `init` is missing from the npm tarball.
- **D-03:** `npm pack --dry-run --json` remains the preferred machine-readable source for tarball file assertions because current npm dry-run text output may omit the full file list.

### Clean install smoke
- **D-04:** The primary pre-publish smoke test should use a locally generated npm tarball, not `codewiki@latest`.
- **D-05:** The smoke should run the packed package in a fresh temporary directory and validate that `init` completes and creates the expected scaffold/assets.
- **D-06:** `npx codewiki@latest init` is valuable as a post-publish/manual checklist item, but it should not be the blocking pre-publish test because it targets the already-published registry package rather than the local candidate.

### Runtime dependencies and engines
- **D-07:** Add `engines.node` with the roadmap-required contract: `>=20.11.0`.
- **D-08:** Keep runtime dependencies at zero unless there is a concrete implementation reason to add one.
- **D-09:** `picocolors` is an acceptable exception if the implementation benefits from colored output. The user explicitly accepted the cost because the current npm package is tiny, dependency-free, and low risk.
- **D-10:** Do not add `commander` in Phase 8 unless the planner finds a real CLI parsing need. The current CLI is simple enough that a larger parsing dependency is not justified by default.
- **D-11:** If `picocolors` is added, the dependency contract should stay narrow and deliberate; do not use it as permission to add broader runtime dependency creep.

### README and publish documentation
- **D-12:** README updates should cover both user-facing install/use and publish-hardening details.
- **D-13:** Include practical verification/troubleshooting notes for publication, including the local tarball smoke and the post-publish `npx codewiki@latest init` check.
- **D-14:** Keep README useful and bounded. It can include publishing notes, but should not become a long internal release manual.

### the agent's Discretion
- Exact test file split and helper names for tarball assertions and clean-project smoke.
- Exact generated temporary directory strategy for running the packed package.
- Exact README section layout and wording, as long as it covers usage, verification, and troubleshooting clearly.
- Whether to add `picocolors` in implementation. It is allowed, not required.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 8 goal and success criteria for npm publish hardening.
- `.planning/REQUIREMENTS.md` — `BUILD-03` and `BUILD-04` define the remaining build/publish requirements.
- `.planning/PROJECT.md` — project constraints: installer-only CLI, prompt assets bundled in `dist/`, no clobber, and npm publish expectations.
- `.planning/STATE.md` — current project position and accumulated decisions after Phase 7.

### Product and user documentation
- `README.md` — user-facing install and workflow docs that should be updated for publish verification and troubleshooting.
- `docs/codewiki-project-v2.md` — canonical v2 architecture, install surface, and publish-related constraints.
- `docs/implementation-plan-v2.md` — implementation reference for the installer/package hardening work.

### Prior phase context
- `.planning/phases/07-codex-and-copilot-adapters/07-CONTEXT.md` — confirms Phase 8 boundary and completed adapter scope.
- `.planning/phases/06-opencode-adapter/06-CONTEXT.md` — reinforces shared skill tree and adapter packaging expectations.
- `.planning/phases/04.1.1-skill-template-source-inserted/04.1.1-CONTEXT.md` — canonical source-template and skill-file expectations.

### Package and test surfaces
- `package.json` — npm metadata, `files`, scripts, dependencies/devDependencies, `bin`, and future `engines`.
- `package-lock.json` — dependency lock state if any runtime dependency such as `picocolors` is added.
- `test/pack.test.ts` — current npm pack assertions and natural home for broader tarball coverage.
- `test/init.test.ts` — existing compiled CLI integration tests and clean-project install assertions.
- `test/helpers.ts` — temporary project and CLI execution helpers that can be extended for packed-package smoke tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json`: already has `bin`, `files`, `prepack`, `build`, and no runtime `dependencies`; missing `engines`.
- `test/pack.test.ts`: already runs `npm pack --dry-run` and `npm pack --dry-run --json`, then asserts selected template files are included.
- `test/init.test.ts`: already validates clean temp-project installs for Claude, OpenCode, Codex, Copilot, and mixed selections through the compiled local CLI.
- `test/helpers.ts`: provides `tempProject`, `runCli`, `mustRun`, and recursive file listing helpers.
- `src/templates/**`: canonical template asset tree copied by `postbuild` into `dist/templates/` and then included through the package `files` allowlist.

### Established Patterns
- Package tests prefer machine-readable npm output for tarball assertions.
- Integration tests create temporary projects and validate concrete files rather than relying only on stdout.
- The CLI currently uses a small hand-rolled argument parser and has no runtime dependency needs.
- The publish package is intended to be self-contained: `dist/`, `README.md`, and `package.json` are the allowlisted package files.

### Integration Points
- `package.json` needs the engine contract and any deliberate runtime dependency decision.
- `test/pack.test.ts` should expand from representative asset checks to full required-template coverage.
- A new or existing compiled integration test should smoke the generated `.tgz` in a clean directory.
- `README.md` should explain normal `npx codewiki init` usage plus how maintainers verify a release candidate and published package.

</code_context>

<specifics>
## Specific Ideas

- User selected discussion areas for clean `npx` smoke, dependency/engine contract, and README publication docs.
- User clarified that all necessary pack assets should be checked.
- User accepted local tarball smoke as the correct pre-publish gate and accepted `npx codewiki@latest init` as a post-publish/manual check.
- User asked about the cost of colored output dependencies. Current npm metadata checked during discussion: `picocolors@1.1.1` is about 6.3 KB unpacked and dependency-free; `commander@14.0.3` is about 209 KB unpacked, dependency-free, and requires Node >=20.
- User concluded `picocolors` is small enough to be worth the cost and carries no meaningful risk for this project.
- User wants README coverage to include everything relevant: user install/use, publish verification, and troubleshooting.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 8 scope.

</deferred>

---

*Phase: 08-npm-publish-hardening*
*Context gathered: 2026-05-01*
