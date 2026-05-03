import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const CODEX_DIR = path.resolve("src/templates/codex");

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.join(CODEX_DIR, relativePath), "utf8");
}

describe("CODEX-02: Codex hooks and feature templates follow the current event contract", () => {
  test("hooks.json wires prompt, tool, and stop events through repository-root wrappers", async () => {
    const content = await readTemplate("hooks.json");

    expect(content).toContain("UserPromptSubmit");
    expect(content).toContain("PreToolUse");
    expect(content).toContain("PostToolUse");
    expect(content).toContain("Stop");
    expect(content).toContain("Edit|Write|apply_patch");
    expect(content).toContain("user-prompt-submit.sh");
    expect(content).toContain("pre-tool-use.sh");
    expect(content).toContain("post-tool-use.sh");
    expect(content).toContain("stop.sh");
    expect(content).toContain("git rev-parse --show-toplevel");
  });

  test("config.toml enables Codex hook support without inline hook entries", async () => {
    const content = await readTemplate("config.toml");

    expect(content).toContain("[features]");
    expect(content).toContain("codex_hooks = true");
  });

  test("event wrappers preserve Codex stdout and JSON contracts", async () => {
    const userPromptSubmit = await readTemplate("hooks/user-prompt-submit.sh");
    const preToolUse = await readTemplate("hooks/pre-tool-use.sh");
    const postToolUse = await readTemplate("hooks/post-tool-use.sh");
    const stop = await readTemplate("hooks/stop.sh");

    expect(userPromptSubmit).toContain("pre-wiki-context.sh");
    expect(preToolUse).toContain("plain stdout");
    expect(preToolUse).toContain("PreToolUse");
    expect(postToolUse).toContain("post-verify.sh");
    expect(postToolUse).toContain("hookEventName");
    expect(postToolUse).toContain("PostToolUse");
    expect(stop).toContain("session-end.sh");
    expect(stop).toContain("stop_hook_active");
    expect(stop).toContain('"decision":"block"');
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
    expect(content).toMatch(/loop-safe `?Stop`?/);
    expect(content).toContain("wiki/_backlinks.json");
    expect(content).toContain("wiki/SCHEMA.md");
    expect(content).toContain("wiki/raw/");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain(".codewiki/config.yml");
    expect(content).toContain("not query-time RAG");
    expect(content).toContain("New external source in `wiki/raw/`");
    expect(content).toContain("After a substantial coding session");
    expect(content).toContain("Hooks provide context and change signals");
  });
});
