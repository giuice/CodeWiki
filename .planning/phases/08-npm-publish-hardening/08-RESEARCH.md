# Phase 8: npm Publish Hardening - Research

## RESEARCH COMPLETE

## Question

What do we need to know to plan Phase 8 well?

Phase 8 is a release-hardening phase, not a product-scope phase. The useful research is therefore mostly local: package metadata, pack behavior, existing compiled integration tests, and documentation surfaces that need to reflect the final publish path.

## Current State

### Package metadata

- `package.json` already has `bin.codewiki = "./dist/bin/codewiki.js"`.
- `package.json` already allowlists `dist/`, `README.md`, and `package.json` in `files`.
- `package.json` already runs `prepack: npm run build`, and `postbuild` copies `src/templates/.` into `dist/templates/`.
- There is no `engines` field yet, so `BUILD-03` is still open.
- There is no runtime `dependencies` field today, which already satisfies the strictest reading of `BUILD-04`.
- `devDependencies` are limited to TypeScript, Vitest, and Node types.

### Existing pack coverage

- `test/pack.test.ts` already uses `npm pack --dry-run --json`, which matches decision D-03.
- Current coverage asserts only representative template files:
  - `dist/templates/skills/codewiki-ingest/SKILL.md`
  - `dist/templates/hooks/pre-wiki-context.sh`
  - `dist/templates/hooks/post-verify.sh`
  - `dist/templates/hooks/session-end.sh`
- Phase 8 decision D-01 requires broadening this to all required template assets needed by `init`, not just a representative subset.

### Existing integration helpers

- `test/helpers.ts` provides `tempProject`, `runCli`, `mustRun`, `listRecursive`, and `read`.
- `test/init.test.ts` already validates compiled local CLI behavior for the wiki scaffold and all supported adapter selections.
- No helper currently runs the package through a generated `.tgz` tarball, so a local candidate package can pass compiled CLI tests while still failing the actual `npx` execution path.

### Template asset inventory

The template tree currently includes required assets in these groups:

- Skills: 8 `src/templates/skills/codewiki-*/SKILL.md` files.
- Shared hooks: 3 `src/templates/hooks/*.sh` files.
- Claude: 2 agents, 1 instruction file, and legacy command files still present in the template tree.
- Codex: hook config, config TOML, 4 hook wrappers, 2 agents, and instructions.
- Copilot: hook config, 3 hook wrappers, and instructions.
- OpenCode: plugin, 2 agents, and instructions.
- Shared template modules: `adapter-templates.ts`, `page-templates.ts`, and `scaffold.ts`.
- Template tests under `src/templates/__tests__` are source tree tests and do not need to be installed by `init`; because the package copies all `src/templates/**` into `dist/templates/**`, broad pack coverage can either include them as a regression of the current copy behavior or deliberately focus on runtime-needed assets.

### Documentation surface

- `README.md` already has user-facing `npx codewiki init` usage and a `Development` section.
- `README.md` currently says "Zero runtime dependencies" and does not include the Phase 8 release-candidate local tarball smoke or post-publish `npx codewiki@latest init` checklist.
- `docs/implementation-plan-v2.md` says Phase 8 should keep tarball checks aligned with the canonical template tree and preserve the zero-runtime-dependency installer pattern.
- `docs/codewiki-project-v2.md` already describes installer-only architecture and normal `npx codewiki init` usage.

## Recommended Plan Shape

Plan Phase 8 as three executable plans:

1. Package contract and full pack manifest coverage.
2. Local tarball `npx` smoke test in a clean temp project.
3. README publish verification and troubleshooting documentation.

This split keeps file ownership clean:

- `08-01` owns `package.json` and `test/pack.test.ts`.
- `08-02` owns `test/helpers.ts` and `test/init.test.ts`.
- `08-03` owns `README.md`.

## Validation Architecture

### Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Vitest plus Node `node:test` compiled integration tests |
| Config file | `vitest.config.ts`, `tsconfig.test.json` |
| Quick run command | `npm run build && node --test dist/test/pack.test.js dist/test/init.test.js` |
| Full suite command | `npm test` |
| Estimated runtime | Approximately 30-90 seconds depending on `npm pack` and `npx` cache behavior |

### Critical Behaviors to Validate

- `package.json` contains `"engines": { "node": ">=20.11.0" }`.
- `package.json` still has no `dependencies` field unless a deliberate allowed runtime dependency is added.
- `npm pack --dry-run --json` includes every runtime template asset required by `init`.
- A locally generated `codewiki-*.tgz` can be invoked by `npx --yes <tarball> init --tool claude-code,codex,copilot,opencode --name packed-smoke` in a fresh temp directory.
- The packed smoke validates concrete scaffold and adapter files, not just exit code.
- README documents normal user install, local tarball release-candidate verification, post-publish `codewiki@latest` verification, and common troubleshooting points.

## Pitfalls

- `npm pack --dry-run` text output can omit file details; use `--json` and parse `files[].path`.
- `npm pack` triggers `prepack`, which runs `npm run build` and can mutate `dist/`; keep pack tests in the compiled `node:test` phase that already runs after Vitest.
- A tarball smoke should use the local `.tgz`, not `codewiki@latest`, because the local tarball represents the release candidate.
- Running `npx` against a tarball may be slower than direct `node dist/bin/codewiki.js`; keep the smoke focused and avoid duplicating all adapter assertions already present in `test/init.test.ts`.
- Do not add Commander in this phase unless implementation discovers a real CLI parsing need. The current parser is sufficient.
- `picocolors` is allowed by context but not required by the phase goal. Keeping zero runtime dependencies is simpler and satisfies `BUILD-04` most directly.

