<!-- GSD:project-start source:PROJECT.md -->
## Project

**CodeWiki v2**

CodeWiki is a framework that installs into any AI coding tool (Claude Code, Codex, Copilot, OpenCode) and maintains a persistent, LLM-written wiki of verified project knowledge. Developers run `npx codewiki init` once — the CLI scaffolds a wiki structure and installs hooks, slash commands, and agents into their AI tool. All intelligence (reading wiki, proposing updates, human approval loops) lives in markdown prompt files the AI tool executes natively.

Target users: solo developers using AI coding agents who have experienced agents confidently producing broken code and want accumulated, cross-referenced, human-verified context that reduces hallucination over time.

**Core Value:** `npx codewiki init` turns any project into an AI-tool-native knowledge system in 30 seconds, where every session starts smarter than the last.

### Constraints

- **Tech stack**: TypeScript + Node.js — existing build system, keep it
- **Zero runtime dependencies**: CLI must have no npm dependencies at runtime (installer-only pattern)
- **Zero LLM calls**: CLI never calls any AI API — all intelligence is in markdown files
- **POSIX-compatible hooks**: Hook scripts must work across all four supported tools with `jq` fallback to `grep`
- **npm publish**: Package must work via `npx` with no global install; prompt files must be bundled in `dist/`
- **No clobber**: `init` must deep-merge JSON configs and use marker comments in markdown files to avoid destroying existing user configs
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | ^5.x (keep existing) | Language | Already in use; strict mode, NodeNext module resolution already configured correctly |
| Node.js | >=20.11.0 (target >=22 LTS) | Runtime | v20.11.0 is the minimum for `import.meta.dirname` (no polyfill needed); v22 LTS active through 2027 |
| Commander.js | ^14.0.0 | CLI arg parsing | Zero dependencies, zero runtime footprint; 125k+ dependent packages in npm; MIT licensed; v14 is ESM-native with TypeScript types built-in; the standard choice for Node CLIs |
| Node.js built-in `fs` | (stdlib) | File I/O: copy, read, write, chmod | `fs.cpSync`, `fs.readFileSync`, `fs.writeFileSync`, `fs.chmodSync` — no third-party needed for an installer-only CLI |
| Node.js built-in `path` | (stdlib) | Path manipulation | Platform-safe join/resolve; always prefer over string concatenation |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| picocolors | ^1.1.0 | Terminal ANSI color output | Use instead of chalk; 14x smaller (7 kB vs 101 kB), zero dependencies, TypeScript types included; perfectly sufficient for an installer's success/warning/error lines |
| (none for deep merge) | n/a | JSON deep merge | Implement inline — the merge logic is ~20 lines of TypeScript; a dependency would violate the zero-runtime-deps constraint and the logic is simple enough to own |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript `tsc` (keep existing) | Compile to `dist/` | Already configured with `NodeNext` module resolution and `ES2022` target — keep it |
| `copyfiles` or `npm run` shell script | Copy non-TS assets to `dist/` | tsc does NOT copy `.md`, `.sh`, `.yml` files; use a `postbuild` npm script: `cp -r src/templates dist/templates` or the `copyfiles` package as a devDependency |
| `vitest` | Unit testing | Zero-config for TypeScript + ESM; 10-20x faster than Jest; replaces the current `node --test` runner |
| `@types/node` ^22.x | Node.js stdlib types | Bump from `^20.0.0` to `^22.x` to get accurate types for `import.meta.dirname`, `fs.cpSync`, etc. |
## Installation
# Runtime (the ONLY runtime dependency — if you want color output; otherwise zero deps)
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Commander.js | `process.argv` parsing by hand | Only if the CLI had one flag and no subcommands; CodeWiki needs `--tool`, `--force`, `--name` options with help text |
| Commander.js | yargs | Yargs is 290 kB vs Commander's 174 kB, and has transitive dependencies; not worth it for a single `init` command |
| Commander.js | minimist | Minimist has no help generation; you'd write all usage strings by hand |
| picocolors | chalk | Chalk v5 is also zero-dep and solid, but picocolors is 14x smaller with identical API; use chalk if the project already has it as a transitive dep |
| tsc + copyfiles | tsup | tsup (esbuild-based) is excellent for library bundling but adds a dev-complexity layer; since CodeWiki already has a working `tsc` pipeline with `NodeNext` module resolution, switching to tsup is not worth the migration cost. tsup's `publicDir` option could copy assets, but so can a two-line npm script. Keep tsc. |
| Inline deep merge | `ts-deepmerge` or `deepmerge-ts` | Only if merge requirements grow complex (circular references, Set/Map merging); for `.claude/settings.json` style objects, a 20-line recursive merge is simpler and adds zero bytes to the published package |
| `fs.cpSync` (stdlib) | `fs-extra` | `fs-extra` is excellent but adds a runtime dependency; `fs.cpSync({ recursive: true })` covers every copy case needed here and is stable since Node 16 (fully stable in Node 20) |
| vitest | node --test (current) | `node --test` works but requires compiled output before each run; vitest runs TypeScript directly in dev, much faster feedback loop |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `lodash` / `lodash.merge` | Runtime dependency; overkill for 2–3 JSON merge sites in an installer | Inline 20-line recursive merge function |
| `glob` / `fast-glob` | Runtime dependency; CodeWiki's installer copies known file trees, not pattern-matched globs | Hard-coded paths + `fs.readdirSync` if needed |
| `chalk` v4 (CommonJS) | CJS-only; conflicts with `"type": "module"` in the existing package.json | chalk v5 (ESM) or picocolors |
| `ts-node` / `tsx` as runtime shebang | Adds a soft runtime dependency; forces users to have ts-node installed | Compile to JS with tsc, shebang points to `dist/bin/codewiki.js` |
| `execa` / `shelljs` | Runtime dependency; the installer does not need to spawn subprocesses — it only copies files and edits JSON/markdown | `fs.chmodSync` for making scripts executable; no subprocess runner needed |
| `inquirer` / `@inquirer/prompts` | Runtime dependency; the only interactive moment is "no tool detected, which do you want?" — that can be handled with a simple `readline` built-in or deferred to `--tool` flag guidance | `node:readline` built-in if truly needed |
| CommonJS output (`"type": "commonjs"`) | The existing package.json already has `"type": "module"`; reverting would conflict with `import.meta.url` patterns and force awkward interop | Keep `"type": "module"` + `NodeNext` — it's correctly set up already |
## How to Bundle Non-TypeScript Assets
### Problem
### Solution: postbuild copy script
### File layout in src/
### Reading bundled files at runtime
## The `files` Field in package.json
## Version Compatibility
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Commander ^14 | Node >=18 | v14 dropped support for Node 16; v14 is ESM-only implementation but still importable from CJS |
| TypeScript ^5.x | `@types/node` ^22.x | Bump @types/node to get `import.meta.dirname` type without error |
| `fs.cpSync` | Node >=16.7.0 (experimental), stable in Node >=20 | Set `engines.node` to `>=20.11.0`; known regressions in some 22.x patch versions (fixed in current LTS) — use `{ recursive: true, force: true }` to be explicit |
| picocolors ^1.1 | Any Node | No constraints |
## Existing Stack Assessment
- `"type": "module"` — correct for ESM
- `module: "NodeNext"` + `moduleResolution: "NodeNext"` in tsconfig — the right setting for a Node CLI that uses `import.meta.url`
- `"bin": { "codewiki": "./dist/bin/codewiki.js" }` — correct path convention
- `"files": ["dist/", "README.md"]` — correct whitelist
## Sources
- Commander.js npm page (zero dependencies confirmed, v14.0.3 current): https://www.npmjs.com/package/commander
- picocolors npm page (7 kB, zero deps, 14x smaller than chalk): https://www.npmjs.com/package/picocolors
- Node.js ESM docs — `import.meta.dirname` available from v20.11.0: https://nodejs.org/api/esm.html
- Sonar blog — `__dirname` and `import.meta.dirname` in Node.js ESM: https://www.sonarsource.com/blog/dirname-node-js-es-modules/
- npm package.json `files` field docs: https://docs.npmjs.com/files/package.json/
- TypeScript ESM publishing guide (2ality, Feb 2025): https://2ality.com/2025/02/typescript-esm-packages.html
- tsup copy static files issue (no native support confirmed): https://github.com/egoist/tsup/issues/278
- Vitest vs Jest 2025 comparison: https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/
- TypeScript in 2025 with ESM/CJS (bin field CJS recommendation): https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### Phase Atomicity (MANDATORY — context window survival)

Every GSD phase, sub-phase, and plan MUST fit within a single agent context window. Phases that exceed context limits waste tokens, produce incomplete work, and force expensive re-reads. This is the #1 operational constraint.

**Hard limits per plan:**
- **≤3 tasks** per plan file
- **≤5 files touched** per plan (including test files)
- **≤1 concern** per plan — code changes OR doc updates, never both together

**Phase decomposition rules:**
- If a phase has more than 2 plans, consider splitting into decimal sub-phases (e.g., 4.1a, 4.1b)
- Code migration and doc cascade are ALWAYS separate sub-phases
- Test updates are their own sub-phase if they touch more than 3 test files
- Each sub-phase must have a single verifiable deliverable
- If you need to read more than 500 lines of context files to understand the plan, the plan is too broad — split it

**What agents must do:**
- Before planning: estimate total files and tasks. If >5 files or >3 tasks, split BEFORE writing the plan
- During execution: if context is filling up, stop, commit what works, and create a continuation sub-phase
- Never combine "move files + update imports + update tests + update docs" in one plan — that's 4 sub-phases

**Anti-patterns (these ALWAYS blow context):**
- "Doc cascade" plans that touch 8+ markdown files in one pass
- Plans that grep-and-replace across the entire codebase
- Phases that include both implementation and comprehensive testing
- Plans that read multiple large reference docs before starting work
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<Critical!>
# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```
</Critical!>
