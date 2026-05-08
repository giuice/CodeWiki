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

function readPendingEvent(cwd: string): Record<string, unknown> {
  const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
  return JSON.parse(pending.trim().split("\n")[0]!) as Record<string, unknown>;
}

function readPendingEvents(cwd: string): Record<string, unknown>[] {
  const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
  return pending.trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

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
    expect(content).not.toContain("_cwiki_worktree_diff=");
    expect(content).not.toContain("_cwiki_cached_diff=");
    expect(content).toContain("_cwiki_");
  });

  test("session-end.sh exits 0 outside a git repository", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-nongit-"));
    const output = execSync(`sh "${SESSION_END_PATH}" 2>/dev/null; echo "EXIT:$?"`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const exitCode = output.trim().split("\n").pop();
    expect(exitCode).toBe("EXIT:0");
  });

  test("session-end.sh exits 0 when empty JSON payload {} is piped as stdin", () => {
    // SC-4: hook scripts exit 0 when called with an empty JSON payload
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-nongit-"));
    const output = execSync(`echo "{}" | sh "${SESSION_END_PATH}" 2>/dev/null; echo "EXIT:$?"`, {
      cwd,
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

  test("session-end.sh writes normalized pending absorb schema fields", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked_file.ts"), "before\n");
    execSync("git add tracked_file.ts && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked_file.ts"), "after\n");

    const output = execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const event = readPendingEvent(cwd);

    expect(output).toBe("");
    expect(event.timestamp).toEqual(expect.any(String));
    expect(event.source).toBe("hook");
    expect(event.host).toBe("codex");
    expect(event.event).toBe("Stop");
    expect(event.reason).toBe("session ended with uncommitted changes");
    expect(event.files).toEqual(expect.stringContaining("tracked_file.ts"));
    expect(event.topic_candidates).toEqual(expect.stringContaining("tracked-file"));
    expect(event.diff_stat).toEqual(expect.stringContaining("tracked_file.ts"));
    expect(event.diff_hash).toEqual(expect.any(String));
    expect(String(event.diff_hash)).not.toHaveLength(0);
  });

  test("session-end.sh suppresses duplicate events for the same uncommitted diff", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    execSync("git add tracked.txt && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    const first = execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const second = execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const events = readPendingEvents(cwd);

    expect(first).toBe("");
    expect(second).toBe("");
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("Stop");
  });

  test("session-end.sh ignores tracked CodeWiki state when deduping lifecycle events", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    execSync("mkdir -p .codewiki/state", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "seed\n");
    execSync("git add tracked.txt .codewiki/state/pending-absorb.jsonl && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
    const appendedEvents = pending.trim().split("\n").filter((line) => line.includes('"event":"Stop"'));

    expect(appendedEvents).toHaveLength(1);
    expect(appendedEvents[0]).toContain("tracked.txt");
    expect(appendedEvents[0]).not.toContain("pending-absorb.jsonl");
  });

  test("session-end.sh records a new event when the diff hash changes", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
    execSync("git init", { cwd, encoding: "utf8" });
    execSync("git config user.email test@example.com", { cwd, encoding: "utf8" });
    execSync("git config user.name Test", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    execSync("git add tracked.txt && git commit -m init", { cwd, encoding: "utf8" });
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");
    execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });

    writeFileSync(path.join(cwd, "tracked.txt"), "after again\n");
    execSync(`CODEWIKI_HOOK_HOST=codex CODEWIKI_HOOK_EVENT=Stop sh "${SESSION_END_PATH}" 2>/dev/null`, {
      cwd,
      encoding: "utf8",
      timeout: 5000
    });
    const events = readPendingEvents(cwd);

    expect(events).toHaveLength(2);
    expect(events[0]?.diff_hash).not.toBe(events[1]?.diff_hash);
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

  test("session-end.sh has no bashisms", async () => {
    const content = await readFile(SESSION_END_PATH, "utf8");
    expect(content.startsWith("#!/bin/sh")).toBe(true);
    expect(content).not.toMatch(/\[\[/);
    expect(content).not.toMatch(/\blocal\b/);
    expect(content).not.toMatch(/echo -[neE]/);
  });
});
