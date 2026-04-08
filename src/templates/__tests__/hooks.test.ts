import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

import { describe, expect, test } from "vitest";

const HOOKS_DIR = path.resolve("src/templates/hooks");

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

  test("script contains structured change context output pattern", async () => {
    const content = await readHook("post-verify.sh");
    expect(content).toContain("CODEWIKI_CHANGE_CONTEXT");
    expect(content).toContain("END_CODEWIKI_CHANGE_CONTEXT");
    expect(content).toContain("codewiki-absorb");
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
