import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, expect, test, vi } from "vitest";

const tempRoots: string[] = [];
const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "codewiki-init-"));
  tempRoots.push(root);
  return root;
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
