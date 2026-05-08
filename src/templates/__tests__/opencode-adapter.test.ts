import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const OPENCODE_DIR = path.resolve("src/templates/opencode");

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] ?? null : null;
}

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.join(OPENCODE_DIR, relativePath), "utf8");
}

describe("OC-03: OpenCode plugin template stays a thin shared-hook dispatcher", () => {
  test("plugin template contains the documented events and shared hook targets", async () => {
    const content = await readTemplate("plugins/codewiki.ts");

    expect(content).toContain("tool.execute.before");
    expect(content).toContain("file.edited");
    expect(content).toContain("session.idle");
    expect(content).toContain("pre-wiki-context.sh");
    expect(content).toContain("post-verify.sh");
    expect(content).toContain("session-end.sh");
    expect(content).toContain("codewikiContext");
    expect(content).toContain('spawn("sh"');
    expect(content).toContain('CODEWIKI_HOOK_HOST: "opencode"');
    expect(content).toContain("CODEWIKI_HOOK_EVENT");
    expect(content).toContain('"tool.execute.before"');
    expect(content).toContain('"file.edited"');
    expect(content).toContain('"session.idle"');
    expect(content).toContain("setTimeout");
    expect(content).toContain('stdio: ["pipe", "pipe", "ignore"]');
    expect(content).toContain("not teardown");
    expect(content).not.toContain('spawn("bash"');
    expect(content).not.toContain("codewiki-wiki-updater");
    expect(content).not.toContain("codewiki-verifier");
    expect(content).not.toContain("codewiki-process");
    expect(content).not.toContain("codewiki-absorb");
    expect(content).not.toContain("pending-absorb-dedupe");
    expect(content).not.toContain("payload_hash");
    expect(content).not.toContain("diff_hash");
  });
});

describe("OC-02: OpenCode agent templates preserve updater and verifier responsibilities", () => {
  test("wiki updater keeps approval-gated write behavior", async () => {
    const content = await readTemplate("agents/codewiki-wiki-updater.md");
    const frontmatter = extractFrontmatter(content);

    expect(frontmatter).not.toBeNull();
    expect(frontmatter).toMatch(/^description:/m);
    expect(frontmatter).toMatch(/^mode: subagent$/m);
    expect(content.toLowerCase()).toContain("approval");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("confidence");
    expect(content).toContain("wiki/_archive/");
  });

  test("verifier remains read-only and checks contradiction/reference drift", async () => {
    const content = await readTemplate("agents/codewiki-verifier.md");
    const frontmatter = extractFrontmatter(content);

    expect(frontmatter).not.toBeNull();
    expect(frontmatter).toMatch(/^description:/m);
    expect(frontmatter).toMatch(/^mode: subagent$/m);
    expect(content.toLowerCase()).toContain("read-only");
    expect(content.toLowerCase()).toContain("contradiction");
    expect(content.toLowerCase()).toContain("broken ref");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("FRONTMATTER");
    expect(content).toContain("QUALITY");
    expect(content).toContain("sha256");
  });
});

describe("OC-04: OpenCode instructions template stays concise and practical", () => {
  test("instructions reference the key CodeWiki paths and approval boundary", async () => {
    const content = await readTemplate("instructions.md");

    expect(content).toContain(".agents/skills/codewiki-<name>/SKILL.md");
    expect(content).toContain("wiki/");
    expect(content).toContain("wiki/raw/");
    expect(content).toContain("wiki/SCHEMA.md");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain(".codewiki/config.yml");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content.toLowerCase()).toContain("approval");
    expect(content).toContain("not query-time RAG");
    expect(content).toContain("New external source in `wiki/raw/`");
    expect(content).toContain("After a substantial coding session");
    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain("invoke `codewiki-wiki-updater`");
    expect(content).toContain("invoke `codewiki-verifier`");
    expect(content).toContain("Hooks provide optional context and persistent change signals");
    expect(content).toContain("record pending absorb state");
    expect(content).toContain("deduped idle or turn-end state signal");
    expect(content).toContain("### Schema Discipline");
    expect(content).toContain("confidence");
    expect(content).toContain("contested");
    expect(content).toContain("source_url");
    expect(content).toContain("wiki/queries/");
  });
});
