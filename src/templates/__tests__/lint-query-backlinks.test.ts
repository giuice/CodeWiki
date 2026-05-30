import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const LINT_PATH = path.resolve("src/templates/skills/codewiki-lint/SKILL.md");
const QUERY_PATH = path.resolve("src/templates/skills/codewiki-query/SKILL.md");

describe("ABS-03B: lint.md and query.md use backlinks for ranking", () => {
  test("lint.md uses resolved _backlinks.json for catalog loading and orphan detection", async () => {
    const content = await readFile(LINT_PATH, "utf8");
    const matches = content.match(/_backlinks\.json/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(content).toContain("Read `_backlinks.json` from the resolved wiki root to identify high-importance pages (many backlinks) versus orphaned pages (zero backlinks).");
    expect(content).toContain("Cross-reference with `_backlinks.json` from the resolved wiki root: pages with zero backlinks and missing index coverage are strong orphan candidates.");
  });

  test("query.md uses resolved _backlinks.json for authority and prioritization", async () => {
    const content = await readFile(QUERY_PATH, "utf8");
    const matches = content.match(/_backlinks\.json/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(content).toContain("Read `_backlinks.json` from the resolved wiki root");
    expect(content).toContain("Use `_backlinks.json` to identify higher-importance pages when multiple candidates look relevant. Pages with many backlinks are more likely to contain authoritative answers.");
    expect(content).toContain("Use `_backlinks.json` to prioritize higher-importance pages when multiple pages match.");
  });
});
