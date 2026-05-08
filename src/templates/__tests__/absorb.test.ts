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
    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain("hooks do not run updater, verifier, absorb");
    expect(content).toContain("git diff --cached");
    expect(content).toContain("wiki.path");
    expect(content).toContain("Read `index.md` from the resolved wiki root first.");
    expect(content).toContain("Read `_backlinks.json` from the resolved wiki root");
    expect(content.toLowerCase()).toContain("anti-cramming");
    expect(content.toLowerCase()).toContain("anti-thinning");
  });
});
