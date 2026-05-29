import { readFile } from "node:fs/promises";
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

const HOOKS_DIR = path.resolve("src/templates/hooks");
const LEGACY_CHANGE_CONTEXT = ["CODEWIKI", "CHANGE", "CONTEXT"].join("_");
const LEGACY_END_CHANGE_CONTEXT = ["END", "CODEWIKI", "CHANGE", "CONTEXT"].join("_");
const posixTest = process.platform === "win32" ? test.skip : test;

async function readHook(name: string): Promise<string> {
  return readFile(path.join(HOOKS_DIR, name), "utf8");
}

function runNodeHook(name: string, cwd: string, input = "", env: Record<string, string> = {}): string {
  return execFileSync(process.execPath, [path.join(HOOKS_DIR, name)], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
    input,
    timeout: 5000
  });
}

function readPendingEvent(cwd: string): Record<string, unknown> {
  const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
  return JSON.parse(pending.trim().split("\n")[0]!) as Record<string, unknown>;
}

function readPendingEvents(cwd: string): Record<string, unknown>[] {
  const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");
  return pending.trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

function makeWikiRoot(indexContent: string): string {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-pre-hook-"));
  mkdirSync(path.join(cwd, "wiki"), { recursive: true });
  writeFileSync(path.join(cwd, "wiki", "index.md"), indexContent);
  return cwd;
}

function runPreWikiContext(cwd: string, prompt: string, env: Record<string, string> = {}): string {
  return runNodeHook("pre-wiki-context.mjs", cwd, prompt, env);
}

describe("HOOK-01: pre-wiki-context.mjs outputs wiki context or exits 0 when missing", () => {
  test("primary Node hook contains wiki/index.md read and CodeWiki Context output", async () => {
    const content = await readHook("pre-wiki-context.mjs");
    expect(content).toContain("wiki");
    expect(content).toContain("index.md");
    expect(content).toContain("CodeWiki Context");
  });

  test("primary Node hook exits 0 when wiki/index.md does not exist", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-pre-missing-"));
    expect(runNodeHook("pre-wiki-context.mjs", cwd, "")).toBe("");
  });

  test("generic programming prompt produces no stdout", () => {
    const cwd = makeWikiRoot("- architecture decision schema source history\n");
    const output = runPreWikiContext(cwd, "Explain the architecture decision schema from source history");

    expect(output).toBe("");
  });

  test("explicit CodeWiki prompt can emit matching wiki index context", () => {
    const cwd = makeWikiRoot("- stable-master-pins lesson from CodeWiki\n");
    const output = runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");

    expect(output).toContain("## CodeWiki Context");
    expect(output).toContain("stable-master-pins");
  });

  test("repeated identical context is suppressed by the context cache", () => {
    const cwd = makeWikiRoot("- stable-master-pins lesson from CodeWiki\n");
    const first = runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");
    const second = runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");

    expect(first).toContain("## CodeWiki Context");
    expect(second).toBe("");
  });

  test("changed relevant prompt terms allow a new context block", () => {
    const cwd = makeWikiRoot("- stable-master-pins lesson from CodeWiki\n");
    runPreWikiContext(cwd, "Use codewiki for stable-master-pins");
    const output = runPreWikiContext(cwd, "Use wiki lessons for stable-master-pins");

    expect(output).toContain("## CodeWiki Context");
    expect(output).toContain("stable-master-pins");
  });

  test("changed emitted wiki index context allows a new context block", () => {
    const cwd = makeWikiRoot("- stable-master-pins lesson from CodeWiki\n");
    runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");
    writeFileSync(path.join(cwd, "wiki", "index.md"), "- stable-master-pins updated lesson from CodeWiki\n");
    const output = runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");

    expect(output).toContain("## CodeWiki Context");
    expect(output).toContain("updated lesson");
  });

  test("debug logging records deduped context decisions", () => {
    const cwd = makeWikiRoot("- stable-master-pins lesson from CodeWiki\n");
    runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");
    const output = runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins", { CODEWIKI_HOOK_DEBUG: "1" });
    const debug = readFileSync(path.join(cwd, ".codewiki/state/hooks-debug.jsonl"), "utf8");

    expect(output).toBe("");
    expect(debug).toContain('"stage":"deduped"');
    expect(debug).toContain("context fingerprint already emitted");
  });

  test("context cache bypass is opt-in by environment variable", () => {
    const cwd = makeWikiRoot("- stable-master-pins lesson from CodeWiki\n");
    runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins");
    const output = runPreWikiContext(cwd, "Use codewiki lessons for stable-master-pins", {
      CODEWIKI_HOOK_CONTEXT_BYPASS: "1"
    });

    expect(output).toContain("## CodeWiki Context");
    expect(output).toContain("stable-master-pins");
  });
});

describe("HOOK-02: post-verify.mjs exits 0 with empty/malformed JSON", () => {
  test("primary Node hook exits 0 with empty input", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    expect(runNodeHook("post-verify.mjs", cwd, "")).toBe("");
  });

  test("primary Node hook exits 0 with malformed JSON input", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    expect(runNodeHook("post-verify.mjs", cwd, "not json {{{")).toBe("");
  });

  test("primary Node hook writes topic candidates to pending-absorb.jsonl silently", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const output = runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts"}');
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");

    expect(output).toBe("");
    expect(pending).toContain("wiki-relevant file change");
    expect(pending).toContain("stable-master-pins");
  });

  test("primary Node hook records bounded material from large payloads", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const payload = JSON.stringify({
      file: "src/features/stable-master-pins.ts",
      output: "x".repeat(300 * 1024)
    });

    runNodeHook("post-verify.mjs", cwd, payload);
    const event = readPendingEvent(cwd);

    expect(event.files).toEqual(expect.stringContaining("src/features/stable-master-pins.ts"));
    expect(event.payload_hash).toEqual(expect.any(String));
  });

  test("primary Node hook normalizes Windows paths", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    runNodeHook("post-verify.mjs", cwd, JSON.stringify({ file: "C:\\repo\\src\\features\\stable-master-pins.ts" }));
    const event = readPendingEvent(cwd);

    expect(event.files).toEqual(expect.stringContaining("C:/repo/src/features/stable-master-pins.ts"));
    expect(event.topic_candidates).toEqual(expect.stringContaining("stable-master-pins"));
  });

  test("primary Node hook writes normalized pending absorb schema fields", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts"}', {
      CODEWIKI_HOOK_HOST: "codex",
      CODEWIKI_HOOK_EVENT: "PostToolUse"
    });
    const event = readPendingEvent(cwd);

    expect(event.timestamp).toEqual(expect.any(String));
    expect(event.source).toBe("hook");
    expect(event.host).toBe("codex");
    expect(event.event).toBe("PostToolUse");
    expect(event.reason).toBe("wiki-relevant file change");
    expect(event.files).toEqual(expect.stringContaining("src/features/stable-master-pins.ts"));
    expect(event.topic_candidates).toEqual(expect.stringContaining("stable-master-pins"));
    expect(event.payload_hash).toEqual(expect.any(String));
  });

  test("primary Node hook writes structured debug audit fields", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts"}', { CODEWIKI_HOOK_DEBUG: "1" });
    const debug = readFileSync(path.join(cwd, ".codewiki/state/hooks-debug.jsonl"), "utf8");

    expect(debug).toContain('"stdin_payload":"true"');
    expect(debug).toContain('"stdout_produced":false');
    expect(debug).toContain('"wrapper_json":"unknown"');
    expect(debug).toContain('"observable_context":"state"');
  });

  test("primary Node hook suppresses duplicate pending absorb events across invocations", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const payload = '{"file":"src/features/stable-master-pins.ts"}';

    const first = runNodeHook("post-verify.mjs", cwd, payload, { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "PostToolUse" });
    const second = runNodeHook("post-verify.mjs", cwd, payload, { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "PostToolUse" });
    const events = readPendingEvents(cwd);

    expect(first).toBe("");
    expect(second).toBe("");
    expect(events).toHaveLength(1);
    expect(events[0]?.files).toEqual(expect.stringContaining("stable-master-pins.ts"));
  });

  test("primary Node hook dedupes equivalent file signals when wrapper metadata differs", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const env = { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "PostToolUse" };

    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts","callId":"first"}', env);
    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts","callId":"second"}', env);
    const events = readPendingEvents(cwd);

    expect(events).toHaveLength(1);
    expect(events[0]?.files).toEqual(expect.stringContaining("stable-master-pins.ts"));
  });

  test("primary Node hook records a new event when the same file has a different material payload", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const env = { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "PostToolUse" };

    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts","diff":"before"}', env);
    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts","diff":"after"}', env);
    const events = readPendingEvents(cwd);

    expect(events).toHaveLength(2);
    expect(events[0]?.payload_hash).not.toBe(events[1]?.payload_hash);
  });

  test("primary Node hook records a new event for a different file set", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const env = { CODEWIKI_HOOK_HOST: "codex", CODEWIKI_HOOK_EVENT: "PostToolUse" };

    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/stable-master-pins.ts"}', env);
    runNodeHook("post-verify.mjs", cwd, '{"file":"src/features/other-topic.ts"}', env);
    const events = readPendingEvents(cwd);

    expect(events).toHaveLength(2);
    expect(events[0]?.files).toEqual(expect.stringContaining("stable-master-pins.ts"));
    expect(events[1]?.files).toEqual(expect.stringContaining("other-topic.ts"));
  });

  test("fallback shell hook keeps silent pending-absorb state contract", async () => {
    const content = await readHook("post-verify.sh");
    expect(content).toContain("pending-absorb.jsonl");
    expect(content).toContain("hooks-debug.jsonl");
    expect(content).not.toContain(LEGACY_CHANGE_CONTEXT);
    expect(content).not.toContain(LEGACY_END_CHANGE_CONTEXT);
  });
});

describe("HOOK-03: Primary Node hooks complete within 5 seconds and never block", () => {
  test("pre-wiki-context.mjs completes within 5 seconds", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const start = Date.now();
    runNodeHook("pre-wiki-context.mjs", cwd, "");
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test("post-verify.mjs completes within 5 seconds", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const start = Date.now();
    runNodeHook("post-verify.mjs", cwd, "");
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

describe("HOOK-04: POSIX fallback scripts remain shellcheck-clean", () => {
  posixTest("pre-wiki-context.sh passes shellcheck", () => {
    try {
      execSync(`npx --yes shellcheck --shell=sh "${path.join(HOOKS_DIR, "pre-wiki-context.sh")}"`, {
        encoding: "utf8",
        timeout: 30000
      });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      expect.fail(`shellcheck failed:\n${(error.stdout ?? "") + (error.stderr ?? "")}`);
    }
  }, 30000);

  posixTest("post-verify.sh passes shellcheck", () => {
    try {
      execSync(`npx --yes shellcheck --shell=sh "${path.join(HOOKS_DIR, "post-verify.sh")}"`, {
        encoding: "utf8",
        timeout: 30000
      });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      expect.fail(`shellcheck failed:\n${(error.stdout ?? "") + (error.stderr ?? "")}`);
    }
  }, 30000);
});

describe("HOOK-05: POSIX fallback scripts use POSIX sh only", () => {
  test("pre-wiki-context.sh has no bashisms", async () => {
    const content = await readHook("pre-wiki-context.sh");
    expect(content.startsWith("#!/bin/sh")).toBe(true);
    expect(content).not.toMatch(/\[\[/);
    expect(content).not.toMatch(/\blocal\b/);
    expect(content).not.toMatch(/echo -[neE]/);
  });

  test("post-verify.sh has no bashisms", async () => {
    const content = await readHook("post-verify.sh");
    expect(content.startsWith("#!/bin/sh")).toBe(true);
    expect(content).not.toMatch(/\[\[/);
    expect(content).not.toMatch(/\blocal\b/);
    expect(content).not.toMatch(/echo -[neE]/);
  });
});
