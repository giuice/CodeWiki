import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const LINT_PATH = path.resolve("src/templates/claude/commands/codewiki/lint.md");
const QUERY_PATH = path.resolve("src/templates/claude/commands/codewiki/query.md");

describe("ABS-03B: lint.md and query.md use backlinks for ranking", () => {
  test("lint.md uses wiki/_backlinks.json for catalog loading and orphan detection", async () => {
    const content = await readFile(LINT_PATH, "utf8");
    const matches = content.match(/_backlinks\.json/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(content).toContain("Read `wiki/_backlinks.json` to identify high-importance pages (many backlinks) versus orphaned pages (zero backlinks).");
    expect(content).toContain("Cross-reference with `wiki/_backlinks.json`: pages with zero backlinks and missing index coverage are strong orphan candidates.");
  });

  test("query.md uses wiki/_backlinks.json for authority and prioritization", async () => {
    const content = await readFile(QUERY_PATH, "utf8");
    const matches = content.match(/_backlinks\.json/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(content).toContain("Read `wiki/_backlinks.json` to identify high-importance pages. Pages with many backlinks are more likely to contain authoritative answers.");
    expect(content).toContain("Use `wiki/_backlinks.json` to prioritize pages with higher backlink counts when multiple pages match the query.");
  });
});