import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SESSION_END_PATH = path.resolve("src/templates/hooks/session-end.sh");
const LEGACY_SESSION_SUMMARY = ["CODEWIKI", "SESSION", "SUMMARY"].join("_");
const LEGACY_END_SESSION_SUMMARY = ["END", "CODEWIKI", "SESSION", "SUMMARY"].join("_");
const LEGACY_HEAD_PARENT_DIFF = "HEAD" + "~1";

describe("ABS-04: session-end.sh records pending work and never blocks", () => {
  test("session-end.sh exists with the expected silent state contract", async () => {
    const content = await readFile(SESSION_END_PATH, "utf8");
    expect(content.startsWith("#!/bin/sh")).toBe(true);
    expect(content).toContain("trap 'exit 0' EXIT");
    expect(content).toContain("pending-absorb.jsonl");
    expect(content).not.toContain(LEGACY_SESSION_SUMMARY);
    expect(content).not.toContain(LEGACY_END_SESSION_SUMMARY);
    expect(content).not.toContain(LEGACY_HEAD_PARENT_DIFF);
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

  test("session-end.sh exits 0 when empty JSON payload {} is piped as stdin", () => {
    // SC-4: hook scripts exit 0 when called with an empty JSON payload
    const output = execSync(`echo "{}" | sh "${SESSION_END_PATH}" 2>/dev/null; echo "EXIT:$?"`, {
      encoding: "utf8",
      timeout: 5000
    });
    const exitCode = output.trim().split("\n").pop();
    expect(exitCode).toBe("EXIT:0");
  });

  test("session-end.sh writes pending absorb state for current working tree diff without stdout", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    execSync("git add tracked.txt && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    const output = execSync(`sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");

    expect(output).toBe("");
    expect(pending).toContain("session ended with uncommitted changes");
    expect(pending).toContain("tracked.txt");
  });

  test("session-end.sh records both staged and unstaged changes", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "staged.txt"), "before\n");
    writeFileSync(path.join(cwd, "unstaged.txt"), "before\n");
    execSync("git add staged.txt unstaged.txt && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "staged.txt"), "after\n");
    execSync("git add staged.txt", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "unstaged.txt"), "after\n");

    const output = execSync(`sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");

    expect(output).toBe("");
    expect(pending).toContain("staged.txt");
    expect(pending).toContain("unstaged.txt");
  });

  test("session-end.sh writes structured debug audit fields", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    execSync("git add tracked.txt && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    execSync(`CODEWIKI_HOOK_DEBUG=1 sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const debug = readFileSync(path.join(cwd, ".codewiki/state/hooks-debug.jsonl"), "utf8");

    expect(debug).toContain('"stdin_payload"');
    expect(debug).toContain('"stdout_produced":false');
    expect(debug).toContain('"wrapper_json":"unknown"');
    expect(debug).toContain('"observable_context":"state"');
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
