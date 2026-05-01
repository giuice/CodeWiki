# Phase 8: npm Publish Hardening - Pattern Map

## PATTERN MAPPING COMPLETE

## Files to Modify

| Target | Role | Closest Existing Analog | Pattern to Reuse |
| --- | --- | --- | --- |
| `package.json` | npm metadata contract | Existing package scripts and allowlist | Add metadata in place without disturbing scripts, `bin`, or `files` |
| `test/pack.test.ts` | Tarball manifest coverage | Existing `npm pack --dry-run --json` assertions | Parse machine-readable output and assert exact `dist/templates/...` paths |
| `test/helpers.ts` | Test helper for local packed CLI invocation | `runCli`, `mustRun`, `tempProject` | Wrap `spawnSync` with a small result object and throw on non-zero status |
| `test/init.test.ts` | Clean temp project smoke coverage | Existing compiled CLI adapter integration tests | Create temp projects, run command, assert exact scaffold and adapter files |
| `README.md` | User and maintainer release docs | Existing `Development` section | Add concise commands and troubleshooting without turning README into an internal runbook |

## Existing Code Excerpts

### `test/pack.test.ts`

Use the existing two-step pattern:

```ts
const result = spawnSync("npm", ["pack", "--dry-run"], {
  cwd: process.cwd(),
  encoding: "utf8"
});

const packDetails = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: process.cwd(),
  encoding: "utf8"
});
```

Improve the assertion style by parsing `packDetails.stdout` instead of matching raw JSON text. The JSON includes `files[].path`, which can be placed into a `Set<string>` and compared against an explicit required path list.

### `test/helpers.ts`

Follow the existing helper shape:

```ts
export function mustRun(cwd: string, args: string[]): RunResult {
  const result = runCli(cwd, args);
  if (result.status !== 0) {
    throw new Error(`CLI failed (${args.join(" ")}):\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}
```

Add a tarball/npx helper with the same return/throw style. The helper should accept `cwd`, a tarball path, and CLI args, then run `npx --yes <tarball> ...args`.

### `test/init.test.ts`

Reuse the established concrete file assertions:

```ts
const files = new Set(listRecursive(cwd));
assert.equal(files.has("wiki/index.md"), true, "missing wiki/index.md");
```

The packed smoke should validate representative outputs across all adapter surfaces:

- `.codewiki/config.yml`
- `wiki/index.md`
- `.claude/skills/codewiki-ingest/SKILL.md`
- `.agents/skills/codewiki-ingest/SKILL.md`
- `.codex/hooks.json`
- `.github/hooks/codewiki-hooks.json`
- `.opencode/plugins/codewiki.ts`

### `package.json`

Preserve the current dependency-free runtime contract:

```json
"devDependencies": {
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0",
  "vitest": "^4.1.3"
}
```

Add:

```json
"engines": {
  "node": ">=20.11.0"
}
```

## Data Flow

1. `npm pack --dry-run --json` checks the package manifest without writing a tarball.
2. `npm pack --json` creates a real local `.tgz` candidate after `prepack` runs.
3. `npx --yes <candidate.tgz> init ...` executes the same path users will hit through npm.
4. Fresh temp-project assertions confirm the package can locate `dist/templates/**` after installation through npm tooling.

## Constraints for the Executor

- Keep runtime dependencies at zero unless a concrete implementation failure forces an allowed exception.
- Do not weaken existing local compiled CLI tests.
- Keep the packed smoke focused; it should prove package self-containment, not duplicate every adapter idempotency test.
- README changes should mention `npx codewiki@latest init` only as a post-publish/manual check, not as the blocking release-candidate gate.

