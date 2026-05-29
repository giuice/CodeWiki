import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, expect, test, vi } from "vitest";

const tempRoots: string[] = [];
const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
const SHARED_HOOK_FILES = [
  "codewiki-hook-lib.mjs",
  "pre-wiki-context.mjs",
  "post-verify.mjs",
  "session-end.mjs",
  "pre-wiki-context.sh",
  "post-verify.sh",
  "session-end.sh"
] as const;

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "codewiki-init-"));
  tempRoots.push(root);
  return root;
}

async function listFiles(root: string, relativeDir = "."): Promise<string[]> {
  const dir = path.join(root, relativeDir);
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath.split(path.sep).join("/").replace(/^\.\//, ""));
    }
  }

  return files;
}

afterEach(async () => {
  vi.resetModules();
  vi.doUnmock("node:readline/promises");

  if (originalIsTTY) {
    Object.defineProperty(process.stdin, "isTTY", originalIsTTY);
  } else {
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: undefined });
  }

  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

test("prompts for Claude when no tools are detected in a TTY session", async () => {
  const question = vi.fn().mockResolvedValue("1");
  vi.doMock("node:readline/promises", () => ({
    createInterface: () => ({
      question,
      close: vi.fn()
    })
  }));

  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });

  const root = await makeTempRoot();
  const { initCommand } = await import("../init.js");

  const output = await initCommand({ root, args: ["--name", "tty-demo"] });

  expect(output).toContain("claude-code adapter:");
  expect(output).not.toContain("Tool-specific integrations pending:");
  expect(existsSync(path.join(root, ".claude/skills/codewiki-ingest/SKILL.md"))).toBe(true);
  expect(question).toHaveBeenCalledOnce();
  expect(question.mock.calls[0]?.[0]).toContain("____ ___");
  expect(question.mock.calls[0]?.[0]).toContain("A)");
  expect(question.mock.calls[0]?.[0]).toContain("all");
});

test("prompt accepts comma-separated numeric selections", async () => {
  vi.doMock("node:readline/promises", () => ({
    createInterface: () => ({
      question: vi.fn().mockResolvedValue("1,2,3,4"),
      close: vi.fn()
    })
  }));

  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });

  const root = await makeTempRoot();
  const { initCommand } = await import("../init.js");

  const output = await initCommand({ root, args: ["--name", "tty-demo"] });

  expect(output).toContain("claude-code adapter:");
  expect(output).toContain("codex adapter:");
  expect(output).toContain("copilot adapter:");
  expect(output).toContain("opencode adapter:");
  expect(existsSync(path.join(root, ".claude/skills/codewiki-ingest/SKILL.md"))).toBe(true);
  expect(existsSync(path.join(root, ".agents/skills/codewiki-ingest/SKILL.md"))).toBe(true);
});

test("prompts in TTY mode even when tools were already detected", async () => {
  const question = vi.fn().mockResolvedValue("3");
  vi.doMock("node:readline/promises", () => ({
    createInterface: () => ({
      question,
      close: vi.fn()
    })
  }));

  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });

  const root = await makeTempRoot();
  await mkdir(path.join(root, ".codewiki"));
  await mkdir(path.join(root, ".codex"));
  const { initCommand } = await import("../init.js");

  const output = await initCommand({ root, args: ["--name", "update-demo"] });

  expect(question).toHaveBeenCalledOnce();
  expect(question.mock.calls[0]?.[0]).toContain("Detected:");
  expect(question.mock.calls[0]?.[0]).toContain("codex");
  expect(output).toContain("copilot adapter:");
  expect(output).not.toContain("codex adapter:");
});

test("prompt accepts A for all tools", async () => {
  vi.doMock("node:readline/promises", () => ({
    createInterface: () => ({
      question: vi.fn().mockResolvedValue("A"),
      close: vi.fn()
    })
  }));

  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });

  const root = await makeTempRoot();
  const { initCommand } = await import("../init.js");

  const output = await initCommand({ root, args: ["--name", "tty-demo"] });

  expect(output).toContain("claude-code adapter:");
  expect(output).toContain("codex adapter:");
  expect(output).toContain("copilot adapter:");
  expect(output).toContain("opencode adapter:");
});

test("--tool all installs every supported adapter", async () => {
  const root = await makeTempRoot();
  const { initCommand } = await import("../init.js");

  const output = await initCommand({ root, args: ["--name", "all-demo", "--tool", "all"] });

  expect(output).toContain("claude-code adapter:");
  expect(output).toContain("codex adapter:");
  expect(output).toContain("copilot adapter:");
  expect(output).toContain("opencode adapter:");
});

test.each(["codex", "copilot", "opencode"] as const)("--tool %s installs shared CodeWiki hooks", async (tool) => {
  const root = await makeTempRoot();
  const { initCommand } = await import("../init.js");

  const output = await initCommand({ root, args: ["--name", `${tool}-demo`, "--tool", tool] });

  expect(output).toContain("Shared hooks:");
  for (const filename of SHARED_HOOK_FILES) {
    await expect(stat(path.join(root, ".codewiki", "hooks", filename))).resolves.toBeDefined();
  }
});

test("--tool all installs one filesystem copy of each shared CodeWiki hook", async () => {
  const root = await makeTempRoot();
  const { initCommand } = await import("../init.js");

  await initCommand({ root, args: ["--name", "all-demo", "--tool", "all"] });

  const files = await listFiles(root);
  for (const filename of SHARED_HOOK_FILES) {
    expect(files).toContain(`.codewiki/hooks/${filename}`);
    expect(files.filter((file) => file === `.codewiki/hooks/${filename}`)).toHaveLength(1);
  }
});
