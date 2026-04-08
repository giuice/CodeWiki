import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SESSION_END_PATH = path.resolve("src/templates/hooks/session-end.sh");

describe("ABS-04: session-end.sh summarizes recent work and never blocks", () => {
  test("session-end.sh exists with the expected structured output markers", async () => {
    const content = await readFile(SESSION_END_PATH, "utf8");
    expect(content.startsWith("#!/bin/sh")).toBe(true);
    expect(content).toContain("trap 'exit 0' EXIT");
    expect(content).toContain("CODEWIKI_SESSION_SUMMARY");
    expect(content).toContain("END_CODEWIKI_SESSION_SUMMARY");
    expect(content).toContain("git diff");
    expect(content).toContain("_cwiki_");
  });

  test("session-end.sh exits 0 outside a git repository", () => {
    const output = execSync(`sh "${SESSION_END_PATH}" 2>/dev/null; echo "EXIT:$?"`, {
      encoding: "utf8",
      timeout: 5000
    });
    const exitCode = output.trim().split("\n").pop();
    expect(exitCode).toBe("EXIT:0");
  });

  test("session-end.sh passes shellcheck", () => {
    try {
      execSync(`npx --yes shellcheck --shell=sh "${SESSION_END_PATH}"`, {
        encoding: "utf8",
        timeout: 30000
      });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      const output = (error.stdout ?? "") + (error.stderr ?? "");
      expect.fail(`shellcheck failed:\n${output}`);
    }
  });
});