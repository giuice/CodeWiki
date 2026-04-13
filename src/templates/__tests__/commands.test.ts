import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SKILLS_DIR = path.resolve("src/templates/skills");
const CANONICAL_SKILLS = ["absorb", "breakdown", "ingest", "lint", "prd", "process", "query", "tasks"];
const ARGUMENT_HINT_SKILLS = new Set(["ingest", "query", "prd", "process", "tasks"]);

async function readSkill(name: string): Promise<string> {
  return readFile(path.join(SKILLS_DIR, `codewiki-${name}`, "SKILL.md"), "utf8");
}

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] ?? null : null;
}

describe("SM-04: canonical skill files expose the eight-skill frontmatter contract", () => {
  for (const skill of CANONICAL_SKILLS) {
    test(`codewiki-${skill}/SKILL.md has name, description, purpose, and process`, async () => {
      const content = await readSkill(skill);
      const fm = extractFrontmatter(content);

      expect(fm).not.toBeNull();
      expect(fm).toMatch(new RegExp(`^name: codewiki-${skill}$`, "m"));
      expect(fm).toMatch(/^description:/m);
      expect(content).toContain("<purpose>");
      expect(content).toContain("<process>");
    });

    test(`codewiki-${skill}/SKILL.md preserves the current argument-hint contract`, async () => {
      const fm = extractFrontmatter(await readSkill(skill));

      expect(fm).not.toBeNull();

      if (ARGUMENT_HINT_SKILLS.has(skill)) {
        expect(fm).toMatch(/^argument-hint:/m);
      } else {
        expect(fm).not.toMatch(/^argument-hint:/m);
      }
    });
  }
});

describe("CMD-01: codewiki-ingest preserves the ingest workflow checks", () => {
  test("codewiki-ingest exists with description, purpose, and process", async () => {
    const content = await readSkill("ingest");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-ingest$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
  });

  test("codewiki-ingest has approval gate and no automatic git commit", async () => {
    const content = await readSkill("ingest");
    expect(content.toLowerCase()).toContain("approval");
  });
});

describe("CMD-02: codewiki-query preserves the grounded search workflow", () => {
  test("codewiki-query exists with description, purpose, and process", async () => {
    const content = await readSkill("query");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-query$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
  });

  test("codewiki-query references wiki/index.md for grounded search", async () => {
    const content = await readSkill("query");
    expect(content).toContain("wiki/index.md");
  });
});

describe("CMD-03: codewiki-lint preserves lint workflow checks", () => {
  test("codewiki-lint exists with description, purpose, and process", async () => {
    const content = await readSkill("lint");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-lint$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
  });

  test("codewiki-lint includes orphan detection capability", async () => {
    const content = await readSkill("lint");
    expect(content.toLowerCase()).toContain("orphan");
  });
});

describe("CMD-04: codewiki-prd preserves task-driven PRD workflow checks", () => {
  test("codewiki-prd exists with description, purpose, process, and --fast", async () => {
    const content = await readSkill("prd");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-prd$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content).toContain("--fast");
  });

  test("codewiki-prd preserves clarifying questions and uses Task for multi-agent", async () => {
    const content = await readSkill("prd");
    expect(content.toLowerCase()).toContain("clarifying questions");
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });
});

describe("CMD-05: codewiki-tasks preserves task generation workflow checks", () => {
  test("codewiki-tasks exists with description, purpose, process, and --fast", async () => {
    const content = await readSkill("tasks");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-tasks$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content).toContain("--fast");
  });

  test("codewiki-tasks preserves Go gate and uses Task for multi-agent", async () => {
    const content = await readSkill("tasks");
    expect(content).toMatch(/["']?Go["']?/);
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });
});

describe("CMD-06: codewiki-process preserves process workflow checks", () => {
  test("codewiki-process exists with description, purpose, process, and --fast", async () => {
    const content = await readSkill("process");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-process$/m);
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content).toContain("--fast");
  });

  test("codewiki-process preserves one sub-task pattern and uses Task", async () => {
    const content = await readSkill("process");
    expect(content.toLowerCase()).toMatch(/one sub[- ]?task/);
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });
});

describe("CMD-07: All 8 canonical skill files have name and description in YAML frontmatter", () => {
  for (const skill of CANONICAL_SKILLS) {
    test(`codewiki-${skill}/SKILL.md has name and description in YAML frontmatter`, async () => {
      const content = await readSkill(skill);
      const fm = extractFrontmatter(content);
      expect(fm).not.toBeNull();
      expect(fm).toMatch(new RegExp(`^name: codewiki-${skill}$`, "m"));
      expect(fm).toMatch(/^description:/m);
    });
  }
});
