import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const COMMANDS_DIR = path.resolve("src/templates/claude/commands/codewiki");

async function readCommand(name: string): Promise<string> {
  return readFile(path.join(COMMANDS_DIR, name), "utf8");
}

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] ?? null : null;
}

describe("ABS-01: absorb.md has code-focused wiki absorption rules", () => {
  test("absorb.md exists with description, purpose, process, and approval gate", async () => {
    const content = await readCommand("absorb.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content.toLowerCase()).toContain("wait for user approval");
  });

  test("absorb.md references git diff, backlinks, anti-cramming, and anti-thinning", async () => {
    const content = await readCommand("absorb.md");
    expect(content).toContain("git diff HEAD~1");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content.toLowerCase()).toContain("anti-cramming");
    expect(content.toLowerCase()).toContain("anti-thinning");
  });
});