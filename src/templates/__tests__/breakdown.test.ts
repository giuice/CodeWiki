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

describe("ABS-02: breakdown.md ranks undocumented entities by backlink count", () => {
  test("codewiki-breakdown/SKILL.md exists with description, purpose, process, and approval gate", async () => {
    const content = await readSkill("breakdown");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-breakdown$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content.toLowerCase()).toContain("approval");
  });

  test("codewiki-breakdown/SKILL.md references backlinks, undocumented gaps, and ranking", async () => {
    const content = await readSkill("breakdown");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("wiki/_backlinks.json");
    expect(content.toLowerCase()).toContain("undocumented");
    expect(content.toLowerCase()).toContain("rank");
  });
});
