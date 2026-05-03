import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
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
  test("creates wiki schema, index, log, and backlinks files", async () => {
    const root = await makeTempRoot();

    await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });

    await expect(existsAt(root, "wiki/SCHEMA.md")).resolves.toBe(true);
    await expect(existsAt(root, "wiki/index.md")).resolves.toBe(true);
    await expect(existsAt(root, "wiki/log.md")).resolves.toBe(true);
    await expect(existsAt(root, "wiki/_backlinks.json")).resolves.toBe(true);
  });

  test("creates all wiki content directories plus wiki raw and codewiki tasks", async () => {
    const root = await makeTempRoot();

    await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });

    for (const relativePath of [
      ".codewiki/hooks",
      ".codewiki/tasks",
      "wiki/raw/articles",
      "wiki/raw/papers",
      "wiki/raw/transcripts",
      "wiki/raw/specs",
      "wiki/raw/assets",
      "wiki/entities",
      "wiki/decisions",
      "wiki/concepts",
      "wiki/comparisons",
      "wiki/lessons",
      "wiki/issues",
      "wiki/sources",
      "wiki/queries"
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

  test("renders an explicit empty tools array when no tools are selected", async () => {
    const root = await makeTempRoot();

    await scaffoldProject({ force: false, projectName: "demo", root, tools: [] });

    await expect(existsAt(root, ".codewiki/adapters")).resolves.toBe(false);
    const config = await readFile(path.join(root, ".codewiki/config.yml"), "utf8");
    expect(config).toMatch(/^tools: \[\]$/m);
    expect(config).toContain('raw_path: "wiki/raw/"');
    expect(config).toContain('tasks_path: ".codewiki/tasks/"');
  });

  test("reports created, skipped, and replaced based on actual file state", async () => {
    const root = await makeTempRoot();

    const created = await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });
    expect(created.find((entry) => entry.path === ".codewiki/tasks")?.action).toBe("created");
    expect(created.find((entry) => entry.path === ".codewiki/config.yml")?.action).toBe("created");

    const skipped = await scaffoldProject({ force: false, projectName: "demo", root, tools: ["claude-code"] });
    expect(skipped.find((entry) => entry.path === ".codewiki/tasks")).toEqual({
      action: "skipped",
      path: ".codewiki/tasks",
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
