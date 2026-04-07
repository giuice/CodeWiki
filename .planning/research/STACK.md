# Stack Research

**Domain:** npm CLI installer tool (TypeScript, zero runtime dependencies)
**Researched:** 2026-04-07
**Confidence:** HIGH

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

```bash
# Runtime (the ONLY runtime dependency — if you want color output; otherwise zero deps)
npm install commander picocolors

# Dev dependencies
npm install -D vitest @types/node@^22 copyfiles
```

If the project must remain truly zero runtime dependencies even for colors, replace `picocolors` with plain `process.stdout.write` or use ANSI codes directly. The zero-dep constraint is achievable with only Node.js built-ins + Commander, since Commander itself has zero dependencies.

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

This is the most important implementation detail for the installer pattern.

### Problem

`tsc` compiles `.ts` files only. The installer must ship markdown prompts, shell hook scripts, YAML templates, and JSON template files inside `dist/`. These will NOT be copied by `tsc`.

### Solution: postbuild copy script

Add to `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "postbuild": "copyfiles -u 1 \"src/templates/**\" dist/",
    "prepack": "npm run build"
  }
}
```

`copyfiles -u 1` strips the leading `src/` segment, so `src/templates/claude/commands/ingest.md` becomes `dist/templates/claude/commands/ingest.md`.

Alternatively, use a pure shell one-liner as `postbuild`:
```json
"postbuild": "cp -r src/templates dist/templates && cp -r src/prompts dist/prompts"
```

The shell version is simpler if cross-platform (Windows) support is not required. Since this is a developer tool targeting macOS/Linux, the shell approach is fine.

### File layout in src/

```
src/
  bin/
    codewiki.ts         # CLI entry point — compiled to dist/bin/codewiki.js
  commands/
    init.ts             # init command logic
  lib/
    merge.ts            # deep merge helpers
    detect.ts           # tool auto-detection
    install.ts          # file installation logic
  templates/            # NOT compiled — copied verbatim by postbuild
    claude/
      commands/
        ingest.md
        query.md
        lint.md
        prd.md
        tasks.md
        process.md
      agents/
        codewiki-wiki-updater.md
        codewiki-verifier.md
      settings-fragment.json   # merged into .claude/settings.json
    codex/
      ...
    copilot/
      ...
    opencode/
      ...
    shared/
      hooks/
        pre-wiki-context.sh
        post-verify.sh
      templates/
        entity.md
        decision.md
        lesson.md
        issue.md
        source-summary.md
      config.yml
      wiki-index.md
      wiki-log.md
```

### Reading bundled files at runtime

Use `import.meta.dirname` (Node >=20.11.0) to locate the package's own `dist/` directory at runtime:

```typescript
import { join } from 'node:path';
import { readFileSync, cpSync } from 'node:fs';

// import.meta.dirname is the directory of the compiled .js file
// e.g. /home/user/.npm/_npx/.../dist/commands/
const TEMPLATES_DIR = join(import.meta.dirname, '..', 'templates');

// Copy claude command templates into target project
cpSync(
  join(TEMPLATES_DIR, 'claude', 'commands'),
  join(targetDir, '.claude', 'commands', 'codewiki'),
  { recursive: true }
);
```

This works correctly whether the package is invoked via `npx codewiki init` (from the npm cache), globally installed, or `node dist/bin/codewiki.js` locally.

For older Node compatibility (18.x) where `import.meta.dirname` does not exist, use the explicit form:
```typescript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
```

Recommendation: set `engines: { node: ">=20.11.0" }` in package.json and use `import.meta.dirname` directly — no polyfill needed.

## The `files` Field in package.json

The `files` field is a whitelist of what gets published to npm. Everything not listed is excluded. Currently:

```json
"files": ["dist/", "README.md", "package.json"]
```

This is correct. With the postbuild copy, `dist/` will include both compiled JS and the copied template assets. No further changes to `files` are needed.

Verify before publishing with:
```bash
npm pack --dry-run
```

This prints every file that would be included. Confirm that `dist/templates/` and `dist/prompts/` appear in the list.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Commander ^14 | Node >=18 | v14 dropped support for Node 16; v14 is ESM-only implementation but still importable from CJS |
| TypeScript ^5.x | `@types/node` ^22.x | Bump @types/node to get `import.meta.dirname` type without error |
| `fs.cpSync` | Node >=16.7.0 (experimental), stable in Node >=20 | Set `engines.node` to `>=20.11.0`; known regressions in some 22.x patch versions (fixed in current LTS) — use `{ recursive: true, force: true }` to be explicit |
| picocolors ^1.1 | Any Node | No constraints |

## Existing Stack Assessment

The current `package.json` is already well-configured for this task:

- `"type": "module"` — correct for ESM
- `module: "NodeNext"` + `moduleResolution: "NodeNext"` in tsconfig — the right setting for a Node CLI that uses `import.meta.url`
- `"bin": { "codewiki": "./dist/bin/codewiki.js" }` — correct path convention
- `"files": ["dist/", "README.md"]` — correct whitelist

**Changes needed:**
1. Bump `@types/node` from `^20.0.0` to `^22.x`
2. Add `commander` (runtime dep)
3. Add `picocolors` (runtime dep, optional)
4. Add `copyfiles` or shell `postbuild` script to copy template assets
5. Add `vitest` (devDep) to replace `node --test`
6. Add `engines: { "node": ">=20.11.0" }` to package.json

No bundler change required. tsc + postbuild is sufficient for an installer-only CLI.

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

---
*Stack research for: npm CLI installer (TypeScript, zero runtime deps)*
*Researched: 2026-04-07*
