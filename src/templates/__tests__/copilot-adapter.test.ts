import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const COPILOT_DIR = path.resolve("src/templates/copilot");

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.join(COPILOT_DIR, relativePath), "utf8");
}

describe("COP-01: Copilot hook templates use agentStop for post-turn follow-up", () => {
  test("hook config wires CodeWiki wrappers and cleanup-only sessionEnd", async () => {
    const content = await readTemplate("hooks/codewiki-hooks.json");
    const config = JSON.parse(content) as { version: number; hooks: Record<string, unknown> };

    expect(config.version).toBe(1);
    expect(content).toContain('"version": 1');
    expect(config.hooks).toHaveProperty("preToolUse");
    expect(config.hooks).toHaveProperty("postToolUse");
    expect(config.hooks).toHaveProperty("agentStop");
    expect(config.hooks).toHaveProperty("sessionEnd");
    expect(content).toContain(".github/hooks/codewiki/pre-tool-use.sh");
    expect(content).toContain(".github/hooks/codewiki/post-tool-use.sh");
    expect(content).toContain(".github/hooks/codewiki/agent-stop.sh");
    expect(content).toContain("session-end.sh >/dev/null 2>&1 || true");
  });

  test("wrappers dispatch through shared hooks and preserve Copilot JSON contracts", async () => {
    const preToolUse = await readTemplate("hooks/pre-tool-use.sh");
    const postToolUse = await readTemplate("hooks/post-tool-use.sh");
    const agentStop = await readTemplate("hooks/agent-stop.sh");

    expect(preToolUse).toContain("#!/bin/sh");
    expect(postToolUse).toContain("#!/bin/sh");
    expect(agentStop).toContain("#!/bin/sh");
    expect(preToolUse).toContain("pre-wiki-context.sh");
    expect(postToolUse).toContain("post-verify.sh");
    expect(postToolUse).toContain("additionalContext");
    expect(agentStop).toContain("session-end.sh");
    expect(agentStop).toContain("agentStop");
    expect(agentStop).toContain("sessionEnd");
    expect(agentStop).toContain('"decision":"block"');
    expect(agentStop).toContain('"decision":"allow"');
  });
});

describe("COP-02 and COP-03: Copilot instructions preserve shared skill and wiki boundaries", () => {
  test("instructions reference shared skills, hooks, lifecycle, and important wiki paths", async () => {
    const content = await readTemplate("instructions.md");

    expect(content).toContain(".agents/skills/codewiki-<name>/SKILL.md");
    expect(content).toContain(".github/hooks/codewiki-hooks.json");
    expect(content).toContain("agentStop");
    expect(content).toContain("sessionEnd");
    expect(content).toContain("cleanup-only");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content).toContain("wiki/SCHEMA.md");
    expect(content).toContain("wiki/raw/");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain(".codewiki/config.yml");
    expect(content).toContain("not query-time RAG");
    expect(content).toContain("New external source in `wiki/raw/`");
    expect(content).toContain("After a substantial coding session");
    expect(content).toContain("Hooks provide context and change signals");
    expect(content).toContain("### Schema Discipline");
    expect(content).toContain("confidence");
    expect(content).toContain("contested");
    expect(content).toContain("source_url");
    expect(content).toContain("wiki/queries/");
    expect(content).not.toContain(".github/skills");
  });
});
