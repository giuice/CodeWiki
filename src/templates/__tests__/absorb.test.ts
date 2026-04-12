import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SKILLS_DIR = path.resolve("src/templates/skills");

async function readSkill(name: string): Promise<string> {
  return readFile(path.join(SKILLS_DIR, `codewiki-${name}`, "SKILL.md"), "utf8");
}

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] ?? null : null;
}

describe("ABS-01: absorb.md has code-focused wiki absorption rules", () => {
  test("codewiki-absorb/SKILL.md exists with description, purpose, process, and approval gate", async () => {
    const content = await readSkill("absorb");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-absorb$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content.toLowerCase()).toContain("wait for user approval");
  });

  test("codewiki-absorb/SKILL.md references git diff, backlinks, anti-cramming, and anti-thinning", async () => {
    const content = await readSkill("absorb");
    expect(content).toContain("git diff HEAD~1");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content.toLowerCase()).toContain("anti-cramming");
    expect(content.toLowerCase()).toContain("anti-thinning");
  });
});
