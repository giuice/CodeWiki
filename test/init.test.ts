import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cliPath, listRecursive, mustRun, runCli, tempProject } from "./helpers.js";

function countOccurrences(value: string, pattern: string): number {
  return value.split(pattern).length - 1;
}

test("package baseline and compiled help expose all commands", () => {
  const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as Record<string, unknown>;
  assert.equal(pkg.type, "module");
  assert.deepEqual(pkg.bin, { codewiki: "./dist/bin/codewiki.js" });
  assert.equal("dependencies" in pkg, false);
  assert.ok(existsSync(path.join(process.cwd(), "tsconfig.json")));
  assert.ok(existsSync(cliPath()));
  const result = runCli(process.cwd(), ["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /\binit\b/);
  const unknown = runCli(process.cwd(), ["unknown-command"]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown command/);
});

test("init installs the wiki scaffold and Claude assets when the tool is selected explicitly", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--name", "demo", "--tool", "claude-code"]);
  assert.match(result.stdout, /CodeWiki initialized for demo\./);
  assert.match(result.stdout, /Wiki scaffold:/);
  assert.match(result.stdout, /claude-code adapter:/);
  assert.match(result.stdout, /session-end\.sh .*not wired to Claude lifecycle/);

  const files = new Set(listRecursive(cwd));
  for (const rel of [
    ".codewiki/config.yml",
    ".codewiki/hooks",
    ".codewiki/hooks/post-verify.sh",
    ".codewiki/hooks/pre-wiki-context.sh",
    ".codewiki/hooks/session-end.sh",
    ".codewiki/templates/entity.md",
    ".codewiki/templates/decision.md",
    ".codewiki/templates/lesson.md",
    ".codewiki/templates/issue.md",
    ".codewiki/templates/source-summary.md",
    ".claude/agents/codewiki-verifier.md",
    ".claude/agents/codewiki-wiki-updater.md",
    ".claude/commands/codewiki/absorb.md",
    ".claude/commands/codewiki/breakdown.md",
    ".claude/commands/codewiki/ingest.md",
    ".claude/commands/codewiki/lint.md",
    ".claude/commands/codewiki/prd.md",
    ".claude/commands/codewiki/process.md",
    ".claude/commands/codewiki/query.md",
    ".claude/commands/codewiki/tasks.md",
    ".claude/settings.json",
    "CLAUDE.md",
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
  assert.equal(files.has(".codewiki/adapters/claude-code"), false);

  const config = readFileSync(path.join(cwd, ".codewiki/config.yml"), "utf8");
  for (const key of ["version", "project", "tools", "wiki", "verification", "ingestion", "lint"]) {
    assert.match(config, new RegExp(`^${key}:`, "m"));
  }
  assert.match(config, /name: "demo"/);
  assert.match(config, /^tools: \[\]$/m);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/entity.md"), "utf8"), /file_hashes:/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/lesson.md"), "utf8"), /verified_by: human/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/source-summary.md"), "utf8"), /approved: false/);

  const settings = JSON.parse(readFileSync(path.join(cwd, ".claude/settings.json"), "utf8")) as {
    hooks: { PreToolUse: Array<unknown>; PostToolUse: Array<unknown> };
  };
  assert.equal(settings.hooks.PreToolUse.length, 1);
  assert.equal(settings.hooks.PostToolUse.length, 1);

  const claudeInstructions = readFileSync(path.join(cwd, "CLAUDE.md"), "utf8");
  assert.match(claudeInstructions, /<!-- codewiki:start -->/);
  assert.match(claudeInstructions, /\/codewiki-breakdown/);

  const quoted = tempProject();
  mustRun(quoted, ["init", "--name", 'demo "quoted"', "--tool", "claude-code"]);
  assert.match(readFileSync(path.join(quoted, ".codewiki/config.yml"), "utf8"), /name: "demo \\"quoted\\""/);
  assert.match(readFileSync(path.join(quoted, "wiki/index.md"), "utf8"), /project: "demo \\"quoted\\""/);
});

test("init auto-detects Claude when a .claude directory already exists", () => {
  const cwd = tempProject();
  mkdirSync(path.join(cwd, ".claude"), { recursive: true });

  const result = mustRun(cwd, ["init"]);
  assert.match(result.stdout, /claude-code adapter:/);
  assert.equal(existsSync(path.join(cwd, ".claude/commands/codewiki/query.md")), true);
});

test("init reports unsupported selected tools without failing the Claude install", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--tool", "claude-code,codex"]);
  assert.match(result.stdout, /Unsupported \(not yet implemented\):/);
  assert.match(result.stdout, /codex \(adapter not implemented\)/);
  assert.equal(existsSync(path.join(cwd, ".claude/commands/codewiki/ingest.md")), true);
  assert.equal(existsSync(path.join(cwd, ".codewiki/adapters/codex")), false);

  const bad = runCli(tempProject(), ["init", "--tool", "unknown"]);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /Supported values: claude-code, codex, copilot, opencode/);

  const missingToolValue = runCli(tempProject(), ["init", "--tool", "--force"]);
  assert.notEqual(missingToolValue.status, 0);
  assert.match(missingToolValue.stderr, /--tool requires comma-separated values/);

  const empty = runCli(tempProject(), ["init", "--tool", ","]);
  assert.notEqual(empty.status, 0);
  assert.match(empty.stderr, /requires at least one supported value/);

  const deduped = tempProject();
  const duplicateSelection = mustRun(deduped, ["init", "--tool", "claude-code,claude-code,codex"]);
  assert.match(duplicateSelection.stdout, /claude-code adapter:/);
  assert.match(duplicateSelection.stdout, /codex \(adapter not implemented\)/);
});

test("init preserves existing Claude settings and instructions without duplication on rerun", () => {
  const cwd = tempProject();
  mkdirSync(path.join(cwd, ".claude"), { recursive: true });
  writeFileSync(
    path.join(cwd, ".claude/settings.json"),
    JSON.stringify(
      {
        theme: "dark",
        hooks: {
          PreToolUse: [
            {
              matcher: "Write|Edit",
              hooks: [{ type: "command", command: "echo user", timeout: 5 }]
            }
          ]
        }
      },
      null,
      2
    ) + "\n"
  );
  writeFileSync(path.join(cwd, "CLAUDE.md"), "# Existing Instructions\n");

  const first = mustRun(cwd, ["init", "--tool", "claude-code"]);
  assert.match(first.stdout, /session-end\.sh .*not wired to Claude lifecycle/);

  const firstSettings = JSON.parse(readFileSync(path.join(cwd, ".claude/settings.json"), "utf8")) as {
    theme: string;
    hooks: { PreToolUse: Array<{ hooks: Array<{ command: string }> }>; PostToolUse: Array<unknown> };
  };
  assert.equal(firstSettings.theme, "dark");
  assert.equal(firstSettings.hooks.PreToolUse.length, 2);
  assert.equal(firstSettings.hooks.PostToolUse.length, 1);
  assert.equal(firstSettings.hooks.PreToolUse[0]?.hooks[0]?.command, "echo user");

  const firstClaude = readFileSync(path.join(cwd, "CLAUDE.md"), "utf8");
  assert.match(firstClaude, /^# Existing Instructions/m);
  assert.equal(countOccurrences(firstClaude, "<!-- codewiki:start -->"), 1);

  const second = mustRun(cwd, ["init", "--tool", "claude-code"]);
  assert.match(second.stdout, /\.claude\/settings\.json \(exists\)/);
  assert.match(second.stdout, /CLAUDE\.md \(exists\)/);

  const secondSettings = JSON.parse(readFileSync(path.join(cwd, ".claude/settings.json"), "utf8")) as {
    hooks: { PreToolUse: Array<unknown>; PostToolUse: Array<unknown> };
  };
  assert.equal(secondSettings.hooks.PreToolUse.length, 2);
  assert.equal(secondSettings.hooks.PostToolUse.length, 1);

  const secondClaude = readFileSync(path.join(cwd, "CLAUDE.md"), "utf8");
  assert.equal(countOccurrences(secondClaude, "<!-- codewiki:start -->"), 1);
});

test("init requires --tool when no AI tools are detected in non-tty execution", () => {
  const missingTools = runCli(tempProject(), ["init"]);
  assert.notEqual(missingTools.status, 0);
  assert.match(missingTools.stderr, /No AI tools detected\. Use --tool to specify: codewiki init --tool claude-code/);

  const missingNameValue = runCli(tempProject(), ["init", "--name", "--force"]);
  assert.notEqual(missingNameValue.status, 0);
  assert.match(missingNameValue.stderr, /--name requires a project name/);
});
