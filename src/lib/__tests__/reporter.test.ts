import { describe, expect, test } from "vitest";

import { formatReport, formatSectionedReport } from "../reporter.js";

describe("formatReport", () => {
  test("formats a created entry with symbol, action, and path", () => {
    const output = formatReport([{ action: "created", path: "wiki/index.md" }]);

    expect(output).toContain("✓");
    expect(output).toContain("created");
    expect(output).toContain("wiki/index.md");
  });

  test("includes a structured summary line for mixed actions", () => {
    const output = formatReport([
      { action: "created", path: "wiki/index.md" },
      { action: "skipped", path: ".codewiki/config.yml", reason: "exists" },
      { action: "replaced", path: "AGENTS.md" },
      { action: "failed", path: ".claude/settings.json", reason: "parse error" }
    ]);

    expect(output).toContain("⚠");
    expect(output).toContain("↻");
    expect(output).toContain("✗");
    expect(output).toContain("Summary: 1 created, 1 skipped, 1 replaced, 1 failed");
  });
});

describe("formatSectionedReport", () => {
  test("groups entries by section and skips empty sections", () => {
    const output = formatSectionedReport("demo", [
      {
        title: "Wiki scaffold",
        entries: [{ action: "created", path: "wiki/index.md" }]
      },
      {
        title: "Claude adapter",
        entries: [{ action: "skipped", path: ".claude/settings.json", reason: "exists" }]
      },
      {
        title: "Empty section",
        entries: []
      }
    ]);

    expect(output).toContain("CodeWiki initialized for demo.");
    expect(output).toContain("Wiki scaffold:");
    expect(output).toContain("Claude adapter:");
    expect(output).not.toContain("Empty section:");
    expect(output).toContain("Summary: 1 created, 1 skipped");
  });
});