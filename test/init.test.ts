import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cliPath, listRecursive, mustRun, runCli, tempProject } from "./helpers.js";

test("package baseline and compiled help expose all commands", () => {
  const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as Record<string, unknown>;
  assert.equal(pkg.type, "module");
  assert.deepEqual(pkg.bin, { codewiki: "./dist/bin/codewiki.js" });
  assert.equal("dependencies" in pkg, false);
  assert.ok(existsSync(path.join(process.cwd(), "tsconfig.json")));
  assert.ok(existsSync(cliPath()));
  const result = runCli(process.cwd(), ["--help"]);
  assert.equal(result.status, 0);
  for (const command of ["init", "ingest", "query", "lint", "prd", "tasks", "status"]) {
    assert.match(result.stdout, new RegExp(`\\b${command}\\b`));
  }
  const unknown = runCli(process.cwd(), ["unknown-command"]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown command/);
});

test("init creates PRD-defined scaffold and generated config", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--name", "demo"]);
  assert.match(result.stdout, /Human approval boundary/);
  assert.doesNotMatch(result.stdout, /detected/i);
  const files = new Set(listRecursive(cwd));
  for (const rel of [
    ".codewiki/config.yml",
    ".codewiki/templates/entity.md",
    ".codewiki/templates/decision.md",
    ".codewiki/templates/lesson.md",
    ".codewiki/templates/issue.md",
    ".codewiki/templates/source-summary.md",
    ".codewiki/adapters/claude-code",
    ".codewiki/adapters/codex",
    ".codewiki/adapters/copilot",
    ".codewiki/adapters/opencode",
    "raw",
    "wiki/index.md",
    "wiki/log.md",
    "wiki/entities",
    "wiki/decisions",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources"
  ]) {
    assert.equal(files.has(rel), true, `missing ${rel}`);
  }
  const config = readFileSync(path.join(cwd, ".codewiki/config.yml"), "utf8");
  for (const key of ["version", "project", "tools", "wiki", "verification", "ingestion", "lint"]) {
    assert.match(config, new RegExp(`^${key}:`, "m"));
  }
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/entity.md"), "utf8"), /file_hashes:/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/lesson.md"), "utf8"), /verified_by: human/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/source-summary.md"), "utf8"), /approved: false/);
});

test("init --tool filters adapters and unknown tools fail clearly", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init", "--tool", "claude-code,codex"]);
  assert.equal(existsSync(path.join(cwd, ".codewiki/adapters/claude-code")), true);
  assert.equal(existsSync(path.join(cwd, ".codewiki/adapters/codex")), true);
  assert.equal(existsSync(path.join(cwd, ".codewiki/adapters/copilot")), false);
  assert.equal(existsSync(path.join(cwd, ".codewiki/adapters/opencode")), false);
  assert.match(readFileSync(path.join(cwd, ".codewiki/adapters/codex/AGENTS.fragment.md"), "utf8"), /instruction-only/);

  const bad = runCli(tempProject(), ["init", "--tool", "unknown"]);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /Supported values: claude-code, codex, copilot, opencode/);
});

test("init refuses overwrite without force and config parser fails closed", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init"]);
  writeFileSync(path.join(cwd, ".codewiki/config.yml"), "custom: true\n");
  const overwrite = runCli(cwd, ["init"]);
  assert.notEqual(overwrite.status, 0);
  assert.match(overwrite.stderr, /Refusing to overwrite/);

  writeFileSync(path.join(cwd, ".codewiki/config.yml"), "version: 1\ntools: [codex]\n");
  const status = runCli(cwd, ["status"]);
  assert.notEqual(status.status, 0);
  assert.match(status.stderr, /Unsupported \.codewiki\/config\.yml syntax/);
});
