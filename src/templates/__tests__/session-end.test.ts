import { readFile } from "node:fs/promises";
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

const SESSION_END_PATH = path.resolve("src/templates/hooks/session-end.mjs");
const SESSION_END_SH_PATH = path.resolve("src/templates/hooks/session-end.sh");
const LEGACY_SESSION_SUMMARY = ["CODEWIKI", "SESSION", "SUMMARY"].join("_");
const LEGACY_END_SESSION_SUMMARY = ["END", "CODEWIKI", "SESSION", "SUMMARY"].join("_");
const LEGACY_HEAD_PARENT_DIFF = "HEAD" + "~1";
const posixTest = process.platform === "win32" ? test.skip : test;

function runHook(cwd: string, input = "", env: Record<string, string> = {}): string {
  return execFileSync(process.execPath, [SESSION_END_PATH], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
    input,
    timeout: 5000
  });
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function initRepo(): string {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-"));
  git(cwd, ["init"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "user.name", "Test"]);
  return cwd;
}

function readPendingEvent(cwd: string): Record<string, unknown> {
  const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
  return JSON.parse(pending.trim().split("\n")[0]!) as Record<string, unknown>;
}

function readPendingEvents(cwd: string): Record<string, unknown>[] {
  const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
  return pending.trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("ABS-04: session-end.mjs records pending work and never blocks", () => {
  test("session-end.mjs exists with the expected silent state contract", async () => {
    const content = await readFile(SESSION_END_PATH, "utf8");
    expect(content.startsWith("#!/usr/bin/env node")).toBe(true);
    expect(content).toContain("pending-absorb.jsonl");
    expect(content).toContain("gitDiff");
    expect(content).toContain("ls-files");
    expect(content).toContain("MAX_UNTRACKED_FILES");
    expect(content).toContain("MAX_UNTRACKED_FILE_BYTES");
    expect(content).not.toContain(LEGACY_SESSION_SUMMARY);
    expect(content).not.toContain(LEGACY_END_SESSION_SUMMARY);
    expect(content).not.toContain(LEGACY_HEAD_PARENT_DIFF);
  });

  test("session-end.mjs exits 0 outside a git repository", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-nongit-"));
    expect(runHook(cwd)).toBe("");
  });

  test("session-end.mjs exits 0 when empty JSON payload {} is piped as stdin", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-session-nongit-"));
    expect(runHook(cwd, "{}")).toBe("");
  });

  test("session-end.mjs writes pending absorb state for current working tree diff without stdout", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    git(cwd, ["add", "tracked.txt"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    const output = runHook(cwd);
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");

    expect(output).toBe("");
    expect(pending).toContain("session ended with uncommitted changes");
    expect(pending).toContain("tracked.txt");
  });

  test("session-end.mjs records staged, unstaged, and untracked changes", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "staged.txt"), "before\n");
    writeFileSync(path.join(cwd, "unstaged.txt"), "before\n");
    git(cwd, ["add", "staged.txt", "unstaged.txt"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "staged.txt"), "after\n");
    git(cwd, ["add", "staged.txt"]);
    writeFileSync(path.join(cwd, "unstaged.txt"), "after\n");
    writeFileSync(path.join(cwd, "untracked.txt"), "new\n");

    const output = runHook(cwd);
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");

    expect(output).toBe("");
    expect(pending).toContain("staged.txt");
    expect(pending).toContain("unstaged.txt");
    expect(pending).toContain("untracked.txt");
  });

  test("session-end.mjs writes normalized pending absorb schema fields", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked_file.ts"), "before\n");
    git(cwd, ["add", "tracked_file.ts"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "tracked_file.ts"), "after\n");

    const output = runHook(cwd, "", { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" });
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
  });

  test("session-end.mjs suppresses duplicate events for the same uncommitted diff", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    git(cwd, ["add", "tracked.txt"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    const env = { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" };
    const first = runHook(cwd, "", env);
    const second = runHook(cwd, "", env);
    const events = readPendingEvents(cwd);

    expect(first).toBe("");
    expect(second).toBe("");
    expect(events).toHaveLength(1);
    expect(events[0]?.event).toBe("Stop");
  });

  test("session-end.mjs ignores tracked CodeWiki state when deduping lifecycle events", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    mkdirSync(path.join(cwd, ".codewiki/state"), { recursive: true });
    writeFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "seed\n");
    git(cwd, ["add", "tracked.txt", ".codewiki/state/pending-absorb.jsonl"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    const env = { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" };
    runHook(cwd, "", env);
    runHook(cwd, "", env);
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
    const appendedEvents = pending.trim().split("\n").filter((line) => line.includes('"event":"Stop"'));

    expect(appendedEvents).toHaveLength(1);
    expect(appendedEvents[0]).toContain("tracked.txt");
    expect(appendedEvents[0]).not.toContain("pending-absorb.jsonl");
  });

  test("session-end.mjs records a new event when the diff hash changes", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    git(cwd, ["add", "tracked.txt"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");
    runHook(cwd, "", { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" });

    writeFileSync(path.join(cwd, "tracked.txt"), "after again\n");
    runHook(cwd, "", { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" });
    const events = readPendingEvents(cwd);

    expect(events).toHaveLength(2);
    expect(events[0]?.diff_hash).not.toBe(events[1]?.diff_hash);
  });

  test("session-end.mjs records a new event when an untracked file changes", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "seed\n");
    git(cwd, ["add", "tracked.txt"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "new-topic.ts"), "one\n");
    runHook(cwd, "", { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" });

    writeFileSync(path.join(cwd, "new-topic.ts"), "two\n");
    runHook(cwd, "", { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "Stop" });
    const events = readPendingEvents(cwd);

    expect(events).toHaveLength(2);
    expect(events[0]?.diff_hash).not.toBe(events[1]?.diff_hash);
  });

  test("session-end.mjs bounds untracked files included in lifecycle records", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "seed\n");
    git(cwd, ["add", "tracked.txt"]);
    git(cwd, ["commit", "-m", "init"]);

    for (let index = 0; index < 105; index += 1) {
      writeFileSync(path.join(cwd, `untracked-${String(index).padStart(3, "0")}.ts`), "new\n");
    }

    runHook(cwd);
    const event = readPendingEvent(cwd);

    expect(event.diff_hash).toEqual(expect.any(String));
    expect(event.files).toEqual(expect.stringContaining("untracked-000.ts"));
    expect(event.files).not.toEqual(expect.stringContaining("untracked-100.ts"));
  });

  test("session-end.mjs writes structured debug audit fields", () => {
    const cwd = initRepo();
    writeFileSync(path.join(cwd, "tracked.txt"), "before\n");
    git(cwd, ["add", "tracked.txt"]);
    git(cwd, ["commit", "-m", "init"]);
    writeFileSync(path.join(cwd, "tracked.txt"), "after\n");

    runHook(cwd, "", { CODEWIKI_HOOK_DEBUG: "1" });
    const debug = readFileSync(path.join(cwd, ".codewiki/state/hooks-debug.jsonl"), "utf8");

    expect(debug).toContain('"stdin_payload"');
    expect(debug).toContain('"stdout_produced":false');
    expect(debug).toContain('"wrapper_json":"unknown"');
    expect(debug).toContain('"observable_context":"state"');
  });

  posixTest("session-end.sh fallback passes shellcheck", () => {
    try {
      execSync(`npx --yes shellcheck --shell=sh "${SESSION_END_SH_PATH}"`, {
        encoding: "utf8",
        timeout: 30000
      });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      expect.fail(`shellcheck failed:\n${(error.stdout ?? "") + (error.stderr ?? "")}`);
    }
  }, 30000);

  test("session-end.sh fallback has no bashisms", async () => {
    const content = await readFile(SESSION_END_SH_PATH, "utf8");
    expect(content.startsWith("#!/bin/sh")).toBe(true);
    expect(content).not.toMatch(/\[\[/);
    expect(content).not.toMatch(/\blocal\b/);
    expect(content).not.toMatch(/echo -[neE]/);
  });
});
