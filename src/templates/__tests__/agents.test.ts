import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

const AGENTS_DIR = path.resolve("src/templates/claude/agents");

async function readAgent(name: string): Promise<string> {
  return readFile(path.join(AGENTS_DIR, name), "utf8");
}

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] ?? null : null;
}

describe("AGENT-01: codewiki-wiki-updater.md has description and approval-gated instructions", () => {
  test("wiki-updater has description frontmatter", async () => {
    const content = await readAgent("codewiki-wiki-updater.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(fm).toMatch(/Proposes wiki updates/);
  });

  test("wiki-updater requires user approval before writing", async () => {
    const content = await readAgent("codewiki-wiki-updater.md");
    expect(content.toLowerCase()).toContain("approval");
  });

  test("wiki-updater references wiki/entities/ and reads code changes", async () => {
    const content = await readAgent("codewiki-wiki-updater.md");
    expect(content).toContain("wiki/entities/");
    expect(content).toContain("git diff");
  });

  test("wiki-updater applies schema taxonomy, thresholds, and quality signals", async () => {
    const content = await readAgent("codewiki-wiki-updater.md");
    expect(content).toContain("page thresholds");
    expect(content).toContain("wiki/_archive/");
    expect(content).toContain("confidence");
    expect(content).toContain("contested");
    expect(content).toContain("tag");
  });
});

describe("AGENT-02: codewiki-verifier.md has description and read-only verification", () => {
  test("verifier has description frontmatter", async () => {
    const content = await readAgent("codewiki-verifier.md");
    const fm = extractFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm).toMatch(/^description:/m);
    expect(fm).toMatch(/Verifies proposed wiki changes/);
  });

  test("verifier is read-only — allowed-tools has no Write or Edit", async () => {
    const content = await readAgent("codewiki-verifier.md");
    const fm = extractFrontmatter(content)!;
    expect(fm).not.toContain("Write");
    expect(fm).not.toContain("Edit");
    expect(fm).toContain("Read");
  });

  test("verifier checks for contradictions and broken references", async () => {
    const content = await readAgent("codewiki-verifier.md");
    expect(content.toLowerCase()).toContain("contradiction");
    expect(content.toLowerCase()).toContain("cross-reference");
  });

  test("verifier uses structured finding report format", async () => {
    const content = await readAgent("codewiki-verifier.md");
    expect(content).toContain("CONFLICT");
    expect(content).toContain("BROKEN REF");
    expect(content).toContain("MISSING INDEX");
  });

  test("verifier checks wiki/index.md for coverage", async () => {
    const content = await readAgent("codewiki-verifier.md");
    expect(content).toContain("wiki/index.md");
  });

  test("verifier checks frontmatter, taxonomy, quality signals, and log coverage", async () => {
    const content = await readAgent("codewiki-verifier.md");
    expect(content).toContain("FRONTMATTER");
    expect(content).toContain("QUALITY");
    expect(content).toContain("confidence");
    expect(content).toContain("contested");
    expect(content).toContain("wiki/_archive/");
    expect(content).toContain("## [YYYY-MM-DD] action | subject");
  });
});

describe("CLAUDE instructions connect pending absorb state to supporting agents", () => {
  test("instructions treat pending absorb state as updater/verifier follow-up signal", async () => {
    const content = await readFile(path.resolve("src/templates/claude/instructions.md"), "utf8");

    expect(content).toContain(".codewiki/state/pending-absorb.jsonl");
    expect(content).toContain("invoke `codewiki-wiki-updater`");
    expect(content).toContain("invoke `codewiki-verifier`");
    expect(content).toContain("Hook output is advisory");
    expect(content).toContain("pending signals are deduped in shared state");
  });
});
