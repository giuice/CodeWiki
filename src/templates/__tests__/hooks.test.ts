import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

const HOOKS_DIR = path.resolve("src/templates/hooks");
const LEGACY_CHANGE_CONTEXT = ["CODEWIKI", "CHANGE", "CONTEXT"].join("_");
const LEGACY_END_CHANGE_CONTEXT = ["END", "CODEWIKI", "CHANGE", "CONTEXT"].join("_");

async function readHook(name: string): Promise<string> {
  return readFile(path.join(HOOKS_DIR, name), "utf8");
}

describe("HOOK-01: pre-wiki-context.sh outputs wiki context or exits 0 when missing", () => {
  test("script contains wiki/index.md read and CodeWiki Context output", async () => {
    const content = await readHook("pre-wiki-context.sh");
    expect(content).toContain("wiki/index.md");
    expect(content).toContain("CodeWiki Context");
  });

  test("script exits 0 when wiki/index.md does not exist", () => {
    const output = execSync(
      `echo "" | sh "${path.join(HOOKS_DIR, "pre-wiki-context.sh")}" 2>/dev/null; echo "EXIT:$?"`,
      { encoding: "utf8", timeout: 5000 }
    );
    const exitCode = output.trim().split("\n").pop()!;
    expect(exitCode).toBe("EXIT:0");
  });
});

describe("HOOK-02: post-verify.sh exits 0 with empty/malformed JSON", () => {
  test("script exits 0 with empty input", () => {
    const output = execSync(
      `echo "" | sh "${path.join(HOOKS_DIR, "post-verify.sh")}" 2>/dev/null; echo "EXIT:$?"`,
      { encoding: "utf8", timeout: 5000 }
    );
    const exitCode = output.trim().split("\n").pop()!;
    expect(exitCode).toBe("EXIT:0");
  });

  test("script exits 0 with malformed JSON input", () => {
    const output = execSync(
      `echo "not json {{{" | sh "${path.join(HOOKS_DIR, "post-verify.sh")}" 2>/dev/null; echo "EXIT:$?"`,
      { encoding: "utf8", timeout: 5000 }
    );
    const exitCode = output.trim().split("\n").pop()!;
    expect(exitCode).toBe("EXIT:0");
  });

  test("script records pending absorb state instead of printing change context", async () => {
    const content = await readHook("post-verify.sh");
    expect(content).toContain("pending-absorb.jsonl");
    expect(content).toContain("hooks-debug.jsonl");
    expect(content).not.toContain(LEGACY_CHANGE_CONTEXT);
    expect(content).not.toContain(LEGACY_END_CHANGE_CONTEXT);
  });

  test("script writes topic candidates to pending-absorb.jsonl silently", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    const output = execSync(
      `printf '%s' '{"file":"src/features/stable-master-pins.ts"}' | sh "${path.join(HOOKS_DIR, "post-verify.sh")}" 2>/dev/null`,
      { cwd, encoding: "utf8", timeout: 5000 }
    );
    const pending = readFileSync(path.join(cwd, ".codewiki/state/pending-absorb.jsonl"), "utf8");

    expect(output).toBe("");
    expect(pending).toContain("wiki-relevant file change");
    expect(pending).toContain("stable-master-pins");
  });

  test("script writes structured debug audit fields", () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "codewiki-hook-"));
    execSync(
      `printf '%s' '{"file":"src/features/stable-master-pins.ts"}' | CODEWIKI_HOOK_DEBUG=1 sh "${path.join(HOOKS_DIR, "post-verify.sh")}" 2>/dev/null`,
      { cwd, encoding: "utf8", timeout: 5000 }
    );
    const debug = readFileSync(path.join(cwd, ".codewiki/state/hooks-debug.jsonl"), "utf8");

    expect(debug).toContain('"stdin_payload":"true"');
    expect(debug).toContain('"stdout_produced":false');
    expect(debug).toContain('"wrapper_json":"unknown"');
    expect(debug).toContain('"observable_context":"state"');
  });
});

describe("HOOK-03: Both hooks complete within 5 seconds and never block", () => {
  test("pre-wiki-context.sh completes within 5 seconds", () => {
    const start = Date.now();
    execSync(
      `echo "" | sh "${path.join(HOOKS_DIR, "pre-wiki-context.sh")}" 2>/dev/null`,
      { encoding: "utf8", timeout: 5000 }
    );
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test("post-verify.sh completes within 5 seconds", () => {
    const start = Date.now();
    execSync(
      `echo "" | sh "${path.join(HOOKS_DIR, "post-verify.sh")}" 2>/dev/null`,
      { encoding: "utf8", timeout: 5000 }
    );
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test("both hooks have trap exit 0 EXIT safety net", async () => {
    const pre = await readHook("pre-wiki-context.sh");
    const post = await readHook("post-verify.sh");
    expect(pre).toContain("trap 'exit 0' EXIT");
    expect(post).toContain("trap 'exit 0' EXIT");
  });
});

describe("HOOK-04: Both scripts pass shellcheck --shell=sh", () => {
  test("pre-wiki-context.sh passes shellcheck", () => {
    try {
      execSync(
        `npx --yes shellcheck --shell=sh "${path.join(HOOKS_DIR, "pre-wiki-context.sh")}"`,
        { encoding: "utf8", timeout: 30000 }
      );
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      const output = (error.stdout ?? "") + (error.stderr ?? "");
      expect.fail(`shellcheck failed:\n${output}`);
    }
  });

  test("post-verify.sh passes shellcheck", () => {
    try {
      execSync(
        `npx --yes shellcheck --shell=sh "${path.join(HOOKS_DIR, "post-verify.sh")}"`,
        { encoding: "utf8", timeout: 30000 }
      );
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      const output = (error.stdout ?? "") + (error.stderr ?? "");
      expect.fail(`shellcheck failed:\n${output}`);
    }
  });
});

describe("HOOK-05: Both scripts use POSIX sh only — no bashisms", () => {
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
