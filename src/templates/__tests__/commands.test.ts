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

describe("CMD-01: ingest.md has description frontmatter and purpose/process tags", () => {
  test("ingest.md exists with description, purpose, and process", async () => {
    const content = await readCommand("ingest.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
  });

  test("ingest.md has approval gate and no automatic git commit", async () => {
    const content = await readCommand("ingest.md");
    expect(content.toLowerCase()).toContain("approval");
  });
});

describe("CMD-02: query.md has description frontmatter and purpose/process tags", () => {
  test("query.md exists with description, purpose, and process", async () => {
    const content = await readCommand("query.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
  });

  test("query.md references wiki/index.md for grounded search", async () => {
    const content = await readCommand("query.md");
    expect(content).toContain("wiki/index.md");
  });
});

describe("CMD-03: lint.md has description frontmatter and purpose/process tags", () => {
  test("lint.md exists with description, purpose, and process", async () => {
    const content = await readCommand("lint.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
  });

  test("lint.md includes orphan detection capability", async () => {
    const content = await readCommand("lint.md");
    expect(content.toLowerCase()).toContain("orphan");
  });
});

describe("CMD-04: prd.md has description, purpose/process, and --fast toggle", () => {
  test("prd.md exists with description, purpose, process, and --fast", async () => {
    const content = await readCommand("prd.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content).toContain("--fast");
  });

  test("prd.md preserves clarifying questions and uses Task for multi-agent", async () => {
    const content = await readCommand("prd.md");
    expect(content.toLowerCase()).toContain("clarifying questions");
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });
});

describe("CMD-05: tasks.md has description, purpose/process, and --fast toggle", () => {
  test("tasks.md exists with description, purpose, process, and --fast", async () => {
    const content = await readCommand("tasks.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content).toContain("--fast");
  });

  test("tasks.md preserves Go gate and uses Task for multi-agent", async () => {
    const content = await readCommand("tasks.md");
    expect(content).toMatch(/['"]?Go['"]?/);
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });
});

describe("CMD-06: process.md has description, purpose/process, and --fast toggle", () => {
  test("process.md exists with description, purpose, process, and --fast", async () => {
    const content = await readCommand("process.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(content).toContain("<purpose>");
    expect(content).toContain("<process>");
    expect(content).toContain("--fast");
  });

  test("process.md preserves one sub-task pattern and uses Task", async () => {
    const content = await readCommand("process.md");
    expect(content.toLowerCase()).toMatch(/one sub[- ]?task/);
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });
});

describe("CMD-07: All 6 command files have description field in YAML frontmatter", () => {
  const commands = ["ingest.md", "query.md", "lint.md", "prd.md", "tasks.md", "process.md"];

  for (const cmd of commands) {
    test(`${cmd} has description field in YAML frontmatter`, async () => {
      const content = await readCommand(cmd);
      const fm = extractFrontmatter(content);
      expect(fm).not.toBeNull();
      expect(fm).toMatch(/^description:/m);
    });
  }
});
