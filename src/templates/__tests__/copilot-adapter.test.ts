import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const COPILOT_DIR = path.resolve("src/templates/copilot");

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.join(COPILOT_DIR, relativePath), "utf8");
}

describe("COP-01: Copilot hook templates use agentStop as a post-turn state sensor", () => {
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
    expect(content).toContain("CODEWIKI_HOOK_HOST=copilot");
    expect(content).toContain("CODEWIKI_HOOK_EVENT=sessionEnd");
    expect(content).toContain("sh .codewiki/hooks/session-end.sh");
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
    expect(postToolUse).toContain("CODEWIKI_HOOK_HOST=copilot");
    expect(postToolUse).toContain("additionalContext");
    expect(postToolUse).toContain("CODEWIKI_HOOK_DEBUG");
    expect(agentStop).toContain("session-end.sh");
    expect(agentStop).toContain("CODEWIKI_HOOK_HOST=copilot");
    expect(agentStop).toContain("agentStop");
    expect(agentStop).toContain("sessionEnd");
    expect(agentStop).toContain("CODEWIKI_HOOK_DEBUG");
    expect(agentStop).toContain('"decision":"block"');
    expect(agentStop).toContain('"decision":"allow"');

    for (const content of [postToolUse, agentStop]) {
      expect(content).not.toContain("codewiki-wiki-updater");
      expect(content).not.toContain("codewiki-verifier");
      expect(content).not.toContain("codewiki-process");
      expect(content).not.toContain("codewiki-absorb");
      expect(content).not.toContain("pending-absorb-dedupe");
      expect(content).not.toContain("payload_hash");
      expect(content).not.toContain("diff_hash");
    }
  });
});

describe("COP-02 and COP-03: Copilot instructions preserve shared skill and wiki boundaries", () => {
  test("instructions reference shared skills, hooks, lifecycle, and important wiki paths", async () => {
    const content = await readTemplate("instructions.md");

    expect(content).toContain(".agents/skills/codewiki-<name>/SKILL.md");
    expect(content).toContain(".github/agents/codewiki-wiki-updater.agent.md");
    expect(content).toContain(".github/agents/codewiki-verifier.agent.md");
    expect(content).toContain(".github/hooks/codewiki-hooks.json");
    expect(content).toContain("agentStop");
    expect(content).toContain("sessionEnd");
    expect(content).toContain("cleanup-only");
    expect(content).toContain("protected by shared dedupe");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content).toContain("wiki/SCHEMA.md");
    expect(content).toContain("wiki/raw/");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain(".codewiki/config.yml");
    expect(content).toContain("not query-time RAG");
    expect(content).toContain("New external source in `wiki/raw/`");
    expect(content).toContain("After a substantial coding session");
    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain(".github/agents/codewiki-wiki-updater.agent.md` for durable");
    expect(content).toContain(".github/agents/codewiki-verifier.agent.md` for read-only");
    expect(content).toContain("Hooks provide optional context and persistent change signals");
    expect(content).toContain("Always fall back to reading `.codewiki/state/`");
    expect(content).toContain("### Schema Discipline");
    expect(content).toContain("confidence");
    expect(content).toContain("contested");
    expect(content).toContain("source_url");
    expect(content).toContain("wiki/queries/");
    expect(content).not.toContain(".github/skills");
  });
});

describe("COP-04: Copilot custom agents preserve updater and verifier responsibilities", () => {
  test("wiki-updater custom agent is approval-gated and grounded in CodeWiki paths", async () => {
    const content = await readTemplate("agents/codewiki-wiki-updater.agent.md");

    expect(content).toContain("name: codewiki-wiki-updater");
    expect(content).toContain("description:");
    expect(content).toContain("wiki/SCHEMA.md");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content).toContain("Get explicit human approval before writing any file under `wiki/`");
    expect(content).toContain("Do not create commits automatically");
  });

  test("verifier custom agent is read-only and checks required maintenance surfaces", async () => {
    const content = await readTemplate("agents/codewiki-verifier.agent.md");

    expect(content).toContain("name: codewiki-verifier");
    expect(content).toContain("description:");
    expect(content).toContain("Stay read-only");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("wiki/log.md");
    expect(content).toContain("FRONTMATTER");
  });
});
