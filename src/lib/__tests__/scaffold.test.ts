import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { scaffoldProject } from "../scaffold.js";

const tempRoots: string[] = [];

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "codewiki-scaffold-"));
  tempRoots.push(root);
  return root;
}

async function existsAt(root: string, relativePath: string): Promise<boolean> {
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("scaffoldProject", () => {
  test("creates wiki index and log files", async () => {
    const root = await makeTempRoot();

    await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });

    await expect(existsAt(root, "wiki/index.md")).resolves.toBe(true);
    await expect(existsAt(root, "wiki/log.md")).resolves.toBe(true);
  });

  test("creates all wiki content directories plus raw and tasks", async () => {
    const root = await makeTempRoot();

    await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });

    for (const relativePath of [
      "wiki/entities",
      "wiki/decisions",
      "wiki/lessons",
      "wiki/issues",
      "wiki/sources",
      "raw",
      "tasks"
    ]) {
      await expect(existsAt(root, relativePath)).resolves.toBe(true);
    }
  });

  test("creates config and exactly five page templates", async () => {
    const root = await makeTempRoot();

    await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code", "codex"] });

    await expect(existsAt(root, ".codewiki/config.yml")).resolves.toBe(true);
    const config = await readdir(path.join(root, ".codewiki/templates"));
    expect(config.sort()).toEqual([
      "decision.md",
      "entity.md",
      "issue.md",
      "lesson.md",
      "source-summary.md"
    ]);
  });

  test("reports created, skipped, and replaced based on actual file state", async () => {
    const root = await makeTempRoot();

    const created = await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });
    expect(created.find((entry) => entry.path === "tasks")?.action).toBe("created");
    expect(created.find((entry) => entry.path === ".codewiki/config.yml")?.action).toBe("created");

    const skipped = await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });
    expect(skipped.find((entry) => entry.path === "tasks")).toEqual({
      action: "skipped",
      path: "tasks",
      reason: "exists"
    });
    expect(skipped.find((entry) => entry.path === ".codewiki/config.yml")).toEqual({
      action: "skipped",
      path: ".codewiki/config.yml",
      reason: "exists"
    });

    const replaced = await scaffoldProject({ force: true, projectName: "demo", root, tools: ["claude-code"] });
    expect(replaced.find((entry) => entry.path === ".codewiki/config.yml")?.action).toBe("replaced");
  });
});