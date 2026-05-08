import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SKILLS_DIR = path.resolve("src/templates/skills");
const CLAUDE_COMMANDS_DIR = path.resolve("src/templates/claude/commands/codewiki");
const CANONICAL_SKILLS = [
  "absorb",
  "breakdown",
  "flow",
  "ingest",
  "lint",
  "obsidian",
  "prd",
  "process",
  "query",
  "tasks"
];
const ARGUMENT_HINT_SKILLS = new Set(["ingest", "query", "prd", "process", "tasks"]);

async function readSkill(name: string): Promise<string> {
  return readFile(path.join(SKILLS_DIR, `codewiki-${name}`, "SKILL.md"), "utf8");
}

async function readClaudeCommand(name: string): Promise<string> {
  return readFile(path.join(CLAUDE_COMMANDS_DIR, `${name}.md`), "utf8");
}

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] ?? null : null;
}

describe("SM-04: canonical skill files expose the CodeWiki skill frontmatter contract", () => {
  for (const skill of CANONICAL_SKILLS) {
    test(`codewiki-${skill}/SKILL.md has name, description, purpose, and process`, async () => {
      const content = await readSkill(skill);
      const fm = extractFrontmatter(content);

      expect(fm).not.toBeNull();
      expect(fm).toMatch(new RegExp(`^name: codewiki-${skill}$`, "m"));
      expect(fm).toMatch(/^description:/m);
      expect(fm).toMatch(/Use when/);
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

  test("codewiki-ingest handles raw hashes, page thresholds, and bulk ingest", async () => {
    const content = await readSkill("ingest");
    expect(content).toContain("sha256");
    expect(content).toContain("source_url");
    expect(content).toContain("central to one source or appears across two or more sources");
    expect(content).toContain("bulk ingest rule");
    expect(content).toContain("schema taxonomy update");
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

  test("codewiki-query resolves wiki root and reads index for grounded search", async () => {
    const content = await readSkill("query");
    expect(content).toContain("wiki.path");
    expect(content).toContain("Read `index.md` from the resolved wiki root");
    expect(content).toContain("SCHEMA.md");
  });

  test("codewiki-query can file valuable answers with approval", async () => {
    const content = await readSkill("query");
    expect(content).toContain("File valuable answers");
    expect(content).toContain("Wait for explicit user approval before writing any query-derived page.");
    expect(content).toContain("Do not file trivial lookups");
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

  test("codewiki-lint includes programmatic Hermes-style health checks", async () => {
    const content = await readSkill("lint");
    expect(content).toContain("broken wikilinks");
    expect(content).toContain("Validate frontmatter and tags");
    expect(content).toContain("source drift");
    expect(content).toContain("confidence: low");
    expect(content).toContain("log exceeds 500 entries");
  });
});

describe("CMD-03B: Claude command mirrors preserve Hermes-style wiki rules", () => {
  test("Claude ingest mirror includes raw hash, thresholds, taxonomy, and bulk ingest", async () => {
    const content = await readClaudeCommand("ingest");
    expect(content).toContain("sha256");
    expect(content).toContain("central to one source or appears across two or more sources");
    expect(content).toContain("schema taxonomy update");
    expect(content).toContain("bulk ingest rule");
  });

  test("Claude query mirror can file valuable answers with approval", async () => {
    const content = await readClaudeCommand("query");
    expect(content).toContain("File valuable answers");
    expect(content).toContain("Wait for explicit user approval before writing any query-derived page.");
    expect(content).toContain("Do not file trivial lookups");
  });

  test("Claude lint mirror includes programmatic health checks", async () => {
    const content = await readClaudeCommand("lint");
    expect(content).toContain("broken wikilinks");
    expect(content).toContain("Validate frontmatter and tags");
    expect(content).toContain("source drift");
    expect(content).toContain("log exceeds 500 entries");
  });
});

describe("CMD-03C: codewiki-obsidian preserves vault guidance", () => {
  test("codewiki-obsidian keeps Obsidian guidance scoped to vault compatibility", async () => {
    const content = await readSkill("obsidian");
    expect(content).toContain("attachment folder path to `raw/assets/`");
    expect(content).toContain("Wikilinks enabled");
    expect(content).toContain("Dataview");
    expect(content).toContain("Do not introduce database-only state");
    expect(content).toContain("Wait for explicit user approval");
  });

  test("Claude obsidian mirror includes the same vault guidance", async () => {
    const content = await readClaudeCommand("obsidian");
    expect(content).toContain("attachment folder path to `raw/assets/`");
    expect(content).toContain("Wikilinks enabled");
    expect(content).toContain("Dataview");
    expect(content).toContain("Do not introduce database-only state");
  });
});

describe("CMD-03D: codewiki-flow preserves lifecycle routing", () => {
  test("codewiki-flow routes to focused skills without writing wiki files", async () => {
    const content = await readSkill("flow");
    const fm = extractFrontmatter(content);

    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^name: codewiki-flow$/m);
    expect(fm).toContain("Use when");
    expect(content).toContain("routing skill");
    expect(content).toContain("codewiki-ingest");
    expect(content).toContain("codewiki-query");
    expect(content).toContain("codewiki-prd");
    expect(content).toContain("codewiki-tasks");
    expect(content).toContain("codewiki-process");
    expect(content).toContain("codewiki-absorb");
    expect(content).toContain("codewiki-breakdown");
    expect(content).toContain("codewiki-lint");
    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain("Treat hooks as state sensors only");
    expect(content).toContain("Do not write wiki files from this routing skill");
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
    expect(content).toContain("interactive mode");
    expect(content).toContain("wiki.tasks_path");
    expect(content).toContain(".codewiki/tasks/");
    expect(content.toLowerCase()).not.toContain("mentorship");
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
    expect(content).toContain("interactive mode");
    expect(content).toContain("wiki.tasks_path");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain("search the task directory for `*-prd-*.md`");
    expect(content.toLowerCase()).not.toContain("mentorship");
  });

  test("codewiki-tasks preserves Go gate and uses Task for multi-agent", async () => {
    const content = await readSkill("tasks");
    expect(content).toMatch(/["']?Go["']?/);
    expect(content).toContain("Generate phases");
    expect(content).toContain("Generate tasks and relevant files");
    expect(content).toContain("read_first");
    expect(content).toContain("acceptance_criteria");
    expect(content).toContain("Anti-thin validation pass");
    expect(content).toContain("Do not save an anemic task list");
    expect(content).toContain("phase plan");
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
    expect(content).toContain("interactive mode");
    expect(content).toContain("wiki.tasks_path");
    expect(content).toContain(".codewiki/tasks/");
    expect(content).toContain("search the task directory for `tasks-*.md`");
    expect(content.toLowerCase()).not.toContain("mentorship");
  });

  test("codewiki-process preserves one task pattern and uses Task", async () => {
    const content = await readSkill("process");
    expect(content.toLowerCase()).toContain("one task");
    expect(content).toContain("earliest incomplete phase");
    expect(content).toContain("read_first");
    expect(content).toContain("acceptance_criteria");
    expect(content).toContain("completion contract");
    const fm = extractFrontmatter(content)!;
    expect(fm).toContain("Task");
  });

  test("codewiki-process handles pending absorb state with conditional updater and verifier flow", async () => {
    const content = await readSkill("process");
    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain("codewiki-wiki-updater");
    expect(content).toContain("codewiki-verifier");
    expect(content).toContain("codewiki-absorb");
    expect(content).toContain("After meaningful verification");
    expect(content).toContain("If the change created durable wiki-relevant knowledge");
    expect(content).toContain("hooks do not run updater, verifier, absorb");
    expect(content).toContain("In `--fast` mode, collect or defer wiki follow-ups");
    expect(content).toContain("Never write to `wiki/` without explicit approval");
    expect(content).toContain("host runtimes differ");
  });
});

describe("CMD-06B: Claude command mirrors align with state-first hook follow-up", () => {
  test("process, absorb, and flow mirrors do not imply hooks run updater or verifier directly", async () => {
    const process = await readClaudeCommand("process");
    const absorb = await readClaudeCommand("absorb");
    const flow = await readClaudeCommand("flow");

    expect(process).toContain("hooks do not run updater, verifier, absorb");
    expect(absorb).toContain("hooks do not run updater, verifier, absorb");
    expect(flow).toContain("Treat hooks as state sensors only");
  });
});

describe("CMD-07: All canonical skill files have name and description in YAML frontmatter", () => {
  for (const skill of CANONICAL_SKILLS) {
    test(`codewiki-${skill}/SKILL.md has name and description in YAML frontmatter`, async () => {
      const content = await readSkill(skill);
      const fm = extractFrontmatter(content);
      expect(fm).not.toBeNull();
      expect(fm).toMatch(new RegExp(`^name: codewiki-${skill}$`, "m"));
      expect(fm).toMatch(/^description:/m);
      expect(fm).toMatch(/Use when/);
    });
  }
});
