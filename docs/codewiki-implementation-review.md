# CodeWiki Implementation Review Notes

Date: 2026-04-07  
Scope: review and documentation lane for the TypeScript npm CLI described by `.omx/plans/prd-codewiki-framework-20260407.md` and `.omx/plans/test-spec-codewiki-framework-20260407.md`.

## Release-blocking checklist

The implementation should not be considered complete until all items below are true:

- `package.json` identifies the package as `codewiki`, exposes `bin.codewiki` as `./dist/bin/codewiki.js`, keeps runtime `dependencies` empty, and includes `clean`, `build`, `typecheck`, `test`, and `prepack` scripts.
- `tsconfig.json` uses Node ESM-compatible settings (`module`/`moduleResolution` set to `NodeNext`) with `strict` enabled.
- `src/bin/codewiki.ts` compiles to a runnable `dist/bin/codewiki.js` CLI that lists `init`, `ingest`, `query`, `lint`, `prd`, `tasks`, and `status` in `--help`.
- `init` creates the exact PRD scaffold and does not overwrite non-empty CodeWiki files without `--force`.
- Proposal-producing commands (`ingest`, `query`, and semantic `lint` review) print `PROPOSAL ONLY — no wiki files were modified without approval` and do not mutate `wiki/` by default.
- Config/path utilities fail closed when paths escape the project root or the config uses unsupported YAML constructs.
- Adapter docs label Codex, Copilot, and OpenCode as instruction-only unless real hook support is implemented; Claude Code hook wiring must be documented if generated.
- Tests are authored in TypeScript, compiled to `dist/test/**/*.test.js`, and run with Node's built-in test runner.

## Verification commands

Run these from the package root before release or task terminal completion:

```bash
npm install
npm run build
npm run typecheck
npm test
node dist/bin/codewiki.js --help
```

Recommended smoke check:

```bash
tmpdir=$(mktemp -d)
(cd "$tmpdir" && node /absolute/path/to/dist/bin/codewiki.js init && find .codewiki raw wiki -maxdepth 3 \( -type f -o -type d \) | sort)
```

## Code quality review focus

- Prefer small command modules and typed shared results over ad-hoc stringly command handling.
- Keep the config parser intentionally narrow if no YAML runtime dependency is approved; unsupported YAML must produce an actionable error instead of being silently misread.
- Keep proposal and applied-write types distinct so future contributors cannot accidentally turn context/proposal commands into unapproved wiki mutations.
- Avoid `any` in core config, proposal, lint, and command models unless a comment justifies a boundary with untyped external input.
- Keep timestamped artifacts deterministic enough for tests by allowing injectable clocks or path builders where feasible.
- Ensure executable verification covers shebang/bin behavior after compilation, not only TypeScript source imports.

## Current review observations

At the start of this review lane, the integrated worker branch available in this worktree contained package metadata only and was not yet a complete CodeWiki CLI implementation. The checklist above records the gates that should block final release if still unmet after implementation/test lanes are merged.
