import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const INGEST_PATH = path.resolve("src/templates/skills/codewiki-ingest/SKILL.md");

describe("ABS-03A: ingest.md reads and updates backlinks", () => {
  test("ingest.md references wiki/_backlinks.json in load and write steps", async () => {
    const content = await readFile(INGEST_PATH, "utf8");
    const matches = content.match(/_backlinks\.json/g) ?? [];
    expect(matches).toHaveLength(2);
    expect(content).toContain("Read `wiki/_backlinks.json` to understand which pages are most referenced and interconnected.");
    expect(content).toContain("Update `wiki/_backlinks.json` by scanning all modified and new pages for `[[wikilink]]` references.");
  });
});
