# Phase 7: Codex and Copilot Adapters - Pattern Map

**Mapped:** 2026-05-01
**Input:** `07-CONTEXT.md`, `07-RESEARCH.md`, existing adapter/test code

## Closest Existing Analogs

| New Surface | Closest Analog | Why |
|-------------|----------------|-----|
| `src/lib/adapters/codex.ts` | `src/lib/adapters/claude.ts`, `src/lib/adapters/opencode.ts` | Needs JSON merge, marker merge, copy helpers, executable permissions, and adapter report entries |
| `src/lib/adapters/copilot.ts` | `src/lib/adapters/opencode.ts`, `src/lib/adapters/claude.ts` | Needs instruction merge plus hook asset/config copy; simpler than Codex because no TOML config |
| Adapter registry changes | `src/lib/adapters/index.ts` | Existing pattern resolves shared skills once and then tool adapters by selected tool |
| Pending-report changes | `src/commands/init.ts` | Existing `SHARED_SKILL_ONLY_TOOLS` must shrink as real adapters land |
| Codex/Copilot instruction templates | `src/templates/opencode/instructions.md`, `src/templates/claude/instructions.md` | OpenCode shows concise non-Claude `AGENTS.md`; Claude shows fuller approval and path wording |
| Codex TOML agents | `src/templates/claude/agents/*.md`, `src/templates/opencode/agents/*.md` | Preserve updater/verifier responsibilities while changing host manifest format |
| Hook wrapper scripts | `src/templates/hooks/*.sh`, `src/templates/opencode/plugins/codewiki.ts` | Reuse shared shell logic and keep host adapter as a thin dispatch/translation layer |
| Template tests | `src/templates/__tests__/opencode-adapter.test.ts` | Content-contract tests for host assets |
| Install tests | `test/init.test.ts` | End-to-end compiled CLI tests for explicit bootstrap, mixed tools, and idempotency |

## Concrete Code Excerpts To Reuse

### Adapter Copy + Merge Shape

From `src/lib/adapters/opencode.ts`, reuse the pattern:

```ts
await Promise.all([
  ensureDir(options.root, OPENCODE_PLUGIN_DIR),
  ensureDir(options.root, OPENCODE_AGENTS_DIR)
]);

report.push(
  ...(await this.copyAssetDirectory(
    path.join(options.templateDir, "opencode", "plugins"),
    ensureInsideRoot(options.root, OPENCODE_PLUGIN_DIR),
    options
  ))
);

report.push(await this.mergeInstructions(options));
```

Codex and Copilot should follow this shape with their own constants and template directories.

### Marker Merge

From `src/lib/merge.ts`:

```ts
export function mergeMarkerSection(existing: string, newContent: string, force: boolean): string
```

Use this for `AGENTS.md` and `.github/copilot-instructions.md`. Do not hand-roll marker replacement.

### JSON Hook Merge + Deduplication

From `src/lib/adapters/claude.ts`:

```ts
const mergedSettings = deepMerge(existingSettings, CLAUDE_SETTINGS_PATCH);
...
mergedHooks[eventName] = deduplicateHookEntries([
  ...toHookEntries(existingHooks[eventName]),
  ...toHookEntries(CLAUDE_SETTINGS_PATCH.hooks?.[eventName])
]);
```

Use the same idea for `.codex/hooks.json`; for `.github/hooks/codewiki-hooks.json`, a CodeWiki-owned file can be written idempotently, but tests should still prove reruns do not duplicate entries.

### Shared Skills Layering

From `src/lib/adapters/index.ts`:

```ts
if (SHARED_SKILLS_TOOLS.has(tool) && !sharedSkillsAdded) {
  adapters.push(await createSharedSkillsAdapter());
  sharedSkillsAdded = true;
}
```

Keep this intact. Add `codex` and `copilot` factories alongside `opencode`, but do not remove them from `SHARED_SKILLS_TOOLS`.

### Pending Report

From `src/commands/init.ts`:

```ts
const SHARED_SKILL_ONLY_TOOLS = new Set<SupportedTool>(["codex", "copilot"]);
```

Phase 7 should shrink this set after each real adapter lands. After both adapters are complete, it should be empty or removed with equivalent behavior.

### Install Test Helpers

From `test/init.test.ts`:

```ts
function assertInstalledSkillTree(cwd: string, baseDir: string): void {
  for (const skill of CANONICAL_SKILLS) {
    const rel = path.join(baseDir, `codewiki-${skill}`, "SKILL.md");
    assert.equal(existsSync(path.join(cwd, rel)), true, `missing ${rel}`);
  }
}
```

Reuse this helper for `init --tool codex`, `init --tool copilot`, and mixed Claude selections.

## Files By Plan

| Plan | Primary Files |
|------|---------------|
| 07-01 | `src/templates/codex/hooks.json`, `src/templates/codex/config.toml`, `src/templates/codex/hooks/*.sh`, `src/templates/codex/agents/*.toml`, `src/templates/codex/instructions.md` |
| 07-02 | `src/lib/adapters/codex.ts`, `src/lib/adapters/index.ts`, `src/commands/init.ts` |
| 07-03 | `test/init.test.ts`, `src/templates/__tests__/codex-adapter.test.ts` |
| 07-04 | `src/templates/copilot/hooks/codewiki-hooks.json`, `src/templates/copilot/hooks/*.sh`, `src/templates/copilot/instructions.md` |
| 07-05 | `src/lib/adapters/copilot.ts`, `src/lib/adapters/index.ts`, `src/commands/init.ts` |
| 07-06 | `test/init.test.ts`, `src/templates/__tests__/copilot-adapter.test.ts` |

## Landmines

- `CodexAdapter` is the only place that should edit `.codex/config.toml`; keep feature insertion narrow and deterministic.
- Codex `Stop` wrapper must not print plain text and must inspect `stop_hook_active`.
- Copilot hook config should live in `.github/hooks/codewiki-hooks.json`; do not overwrite arbitrary existing `.github/hooks/*.json` files.
- `SharedSkillsAdapter` should still run before Codex/Copilot adapters.
- Mixed selections should not duplicate `.agents/skills`; adapter resolution already dedupes the shared adapter if left intact.
