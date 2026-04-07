import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { detectTools } from "../detect.js";

const tempRoots: string[] = [];

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "codewiki-detect-"));
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("detectTools", () => {
  test("detects claude-code from a .claude directory", async () => {
    const root = await makeTempRoot();
    await mkdir(path.join(root, ".claude"));

    await expect(detectTools(root)).resolves.toEqual(["claude-code"]);
  });

  test("detects opencode from opencode.json", async () => {
    const root = await makeTempRoot();
    await writeFile(path.join(root, "opencode.json"), "{}", "utf8");

    await expect(detectTools(root)).resolves.toEqual(["opencode"]);
  });

  test("detects copilot from .github/copilot-instructions.md", async () => {
    const root = await makeTempRoot();
    await mkdir(path.join(root, ".github"), { recursive: true });
    await writeFile(path.join(root, ".github/copilot-instructions.md"), "# instructions", "utf8");

    await expect(detectTools(root)).resolves.toEqual(["copilot"]);
  });

  test("detects multiple tools in rule order", async () => {
    const root = await makeTempRoot();
    await mkdir(path.join(root, ".claude"));
    await mkdir(path.join(root, ".codex"));

    await expect(detectTools(root)).resolves.toEqual(["claude-code", "codex"]);
  });

  test("returns an empty list for an unmarked directory", async () => {
    const root = await makeTempRoot();

    await expect(detectTools(root)).resolves.toEqual([]);
  });
});