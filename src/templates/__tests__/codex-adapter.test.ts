import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

const CODEX_DIR = path.resolve("src/templates/codex");

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.join(CODEX_DIR, relativePath), "utf8");
}

function makeCodexHookRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "codewiki-codex-hook-"));
  mkdirSync(path.join(root, ".codewiki", "hooks"), { recursive: true });
  return root;
}

function writeSharedHook(root: string, name: string, content: string): void {
  const hookPath = path.join(root, ".codewiki", "hooks", name);
  writeFileSync(hookPath, content);
}

function runCodexWrapper(root: string, wrapper: string, payload: string, env: Record<string, string> = {}): string {
  return execFileSync(process.execPath, [path.join(CODEX_DIR, "hooks", wrapper)], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
    input: payload,
    timeout: 5000
  });
}

describe("CODEX-02: Codex hooks and feature templates follow the current event contract", () => {
  test("hooks.json wires prompt, post-tool, and stop events through repository-root wrappers", async () => {
    const content = await readTemplate("hooks.json");
    const config = JSON.parse(content) as { hooks: Record<string, unknown> };

    expect(config.hooks).toBeDefined();
    expect(config.hooks).toHaveProperty("UserPromptSubmit");
    expect(config.hooks).toHaveProperty("PostToolUse");
    expect(config.hooks).toHaveProperty("Stop");
    expect(config.hooks).not.toHaveProperty("PreToolUse");
    expect(content).toContain("Edit|Write|apply_patch");
    expect(content).toContain("user-prompt-submit.mjs");
    expect(content).toContain("post-tool-use.mjs");
    expect(content).toContain("stop.mjs");
    expect(content).toContain("git rev-parse --show-toplevel");
    expect(content).toContain("commandWindows");
    expect(content).toContain("powershell.exe");
    expect(content).not.toContain("statusMessage");
    expect(content).not.toContain("bash");
  });

  test("config.toml enables Codex hook support without inline hook entries", async () => {
    const content = await readTemplate("config.toml");

    expect(content).toContain("[features]");
    expect(content).toContain("codex_hooks = true");
  });

  test("event wrappers preserve Codex stdout and JSON contracts", async () => {
    const userPromptSubmit = await readTemplate("hooks/user-prompt-submit.mjs");
    const preToolUse = await readTemplate("hooks/pre-tool-use.mjs");
    const postToolUse = await readTemplate("hooks/post-tool-use.mjs");
    const stop = await readTemplate("hooks/stop.mjs");
    const wrapperLib = await readTemplate("hooks/codewiki-wrapper-lib.mjs");

    expect(userPromptSubmit).toContain("pre-wiki-context.mjs");
    expect(preToolUse).toContain("writeJson({})");
    expect(postToolUse).toContain("post-verify.mjs");
    expect(postToolUse).toContain("CODEWIKI_HOOK_DEBUG");
    expect(postToolUse).toContain("PostToolUse");
    expect(stop).toContain("session-end.mjs");
    expect(stop).toContain("hasStopHookActive");
    expect(stop).toContain("CODEWIKI_HOOK_DEBUG");
    expect(stop).toContain('decision: "block"');
    expect(wrapperLib).toContain('CODEWIKI_HOOK_HOST: "codex"');

    for (const content of [postToolUse, stop]) {
      expect(content).not.toContain("codewiki-wiki-updater");
      expect(content).not.toContain("codewiki-verifier");
      expect(content).not.toContain("codewiki-process");
      expect(content).not.toContain("codewiki-absorb");
      expect(content).not.toContain("pending-absorb-dedupe");
      expect(content).not.toContain("payload_hash");
      expect(content).not.toContain("diff_hash");
    }
  });

  test("post-tool-use.sh returns empty JSON unless debug exposes shared hook stdout", () => {
    const root = makeCodexHookRoot();
    writeSharedHook(root, "post-verify.mjs", "import { readFileSync } from 'node:fs';\nreadFileSync(0, 'utf8');\nprocess.stdout.write('debug context\\n');\n");

    expect(runCodexWrapper(root, "post-tool-use.mjs", "{}")).toBe("{}\n");
    expect(runCodexWrapper(root, "post-tool-use.mjs", "{}", { CODEWIKI_HOOK_DEBUG: "1" })).toContain("hookSpecificOutput");
  });

  test("stop.sh returns empty JSON by default and respects stop_hook_active", () => {
    const root = makeCodexHookRoot();
    const marker = path.join(root, "stop-ran");
    writeSharedHook(root, "session-end.mjs", "import { readFileSync, writeFileSync } from 'node:fs';\nreadFileSync(0, 'utf8');\nwriteFileSync('stop-ran', '1');\nprocess.stdout.write('debug reason\\n');\n");

    expect(runCodexWrapper(root, "stop.mjs", '{"stop_hook_active":true}')).toBe("{}\n");
    expect(existsSync(marker)).toBe(false);
    expect(runCodexWrapper(root, "stop.mjs", "{}")).toBe("{}\n");
    expect(runCodexWrapper(root, "stop.mjs", "{}", { CODEWIKI_HOOK_DEBUG: "1" })).toContain('"decision":"block"');
  });
});

describe("CODEX-02 and CODEX-03: Codex agents and instructions preserve CodeWiki boundaries", () => {
  test("TOML agents preserve updater approval and verifier read-only responsibilities", async () => {
    const updater = await readTemplate("agents/codewiki-wiki-updater.toml");
    const verifier = await readTemplate("agents/codewiki-verifier.toml");

    for (const content of [updater, verifier]) {
      expect(content).toContain("name =");
      expect(content).toContain("description =");
      expect(content).toContain("developer_instructions =");
      expect(content).toContain("wiki/index.md");
      expect(content).toContain("wiki/log.md");
      expect(content).toContain("wiki/SCHEMA.md");
    }

    expect(updater.toLowerCase()).toContain("approval");
    expect(updater).toContain("confidence");
    expect(updater).toContain("wiki/_archive/");
    expect(verifier.toLowerCase()).toContain("read-only");
    expect(verifier).toContain("FRONTMATTER");
    expect(verifier).toContain("QUALITY");
    expect(verifier).toContain("sha256");
  });

  test("AGENTS.md instruction block references skills, hooks, and important wiki paths", async () => {
    const content = await readTemplate("instructions.md");

    expect(content).toContain(".agents/skills/codewiki-<name>/SKILL.md");
    expect(content).toContain("UserPromptSubmit");
    expect(content).toContain("PostToolUse");
    expect(content).toContain("PreToolUse` is not wired by default");
    expect(content).toMatch(/loop-safe `?Stop`?/);
    expect(content).toContain("wiki/_backlinks.json");
    expect(content).toContain("wiki/SCHEMA.md");
    expect(content).toContain("wiki/raw/");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain(".codewiki/config.yml");
    expect(content).toContain("not query-time RAG");
    expect(content).toContain("New external source in `wiki/raw/`");
    expect(content).toContain("After a substantial coding session");
    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain("invoke `codewiki-wiki-updater`");
    expect(content).toContain("invoke `codewiki-verifier`");
    expect(content).toContain("Hooks provide optional context and persistent change signals");
    expect(content).toContain("visible hook context is debug-only");
    expect(content).toContain("deduped pending absorb state");
    expect(content).toContain("records deduped lifecycle state");
    expect(content).toContain("CODEWIKI_HOOK_DEBUG=1");
    expect(content).toContain("CODEWIKI_HOOK_CONTEXT_BYPASS=1");
    expect(content).toContain("### Schema Discipline");
    expect(content).toContain("confidence");
    expect(content).toContain("contested");
    expect(content).toContain("source_url");
    expect(content).toContain("wiki/queries/");
  });
});
