import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { cliPath, listRecursive, mustRun, mustRunPackedCli, runCli, tempProject } from "./helpers.js";

function countOccurrences(value: string, pattern: string): number {
  return value.split(pattern).length - 1;
}

const CANONICAL_SKILLS = [
  "absorb",
  "breakdown",
  "flow",
  "ingest",
  "lint",
  "obsidian",
  "prd",
  "process",
  "query",
  "tasks"
] as const;

function assertInstalledSkillTree(cwd: string, baseDir: string): void {
  for (const skill of CANONICAL_SKILLS) {
    const rel = path.join(baseDir, `codewiki-${skill}`, "SKILL.md");
    assert.equal(existsSync(path.join(cwd, rel)), true, `missing ${rel}`);
  }
}

function assertInstalledSkillTreeOnce(cwd: string, baseDir: string): void {
  assertInstalledSkillTree(cwd, baseDir);

  const files = listRecursive(path.join(cwd, baseDir));
  const skillFiles = files.filter((rel) => rel.endsWith("/SKILL.md"));
  assert.equal(skillFiles.length, CANONICAL_SKILLS.length, `${baseDir} should contain each CodeWiki skill exactly once`);
}

function countHookCommands(config: unknown, commandFragment: string): number {
  let count = 0;

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const record = value as Record<string, unknown>;
    if (typeof record.command === "string" && record.command.includes(commandFragment)) {
      count += 1;
    }

    for (const child of Object.values(record)) visit(child);
  }

  visit(config);
  return count;
}

test("package baseline and compiled help expose all commands", () => {
  const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as Record<string, unknown>;
  assert.equal(pkg.type, "module");
  assert.deepEqual(pkg.bin, { codewiki: "dist/bin/codewiki.js" });
  assert.deepEqual(pkg.dependencies, { picocolors: "^1.1.1" });
  assert.ok(existsSync(path.join(process.cwd(), "tsconfig.json")));
  assert.ok(existsSync(cliPath()));
  const result = runCli(process.cwd(), ["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /\binit\b/);
  const version = runCli(process.cwd(), ["--version"]);
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), pkg.version);
  const unknown = runCli(process.cwd(), ["unknown-command"]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown command/);
});

test("local npm tarball works through npx in a fresh project", () => {
  let tarballPath: string | null = null;

  try {
    const packed = spawnSync("npm", ["pack", "--json"], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(packed.status, 0, `npm pack failed:\nSTDOUT:\n${packed.stdout}\nSTDERR:\n${packed.stderr}`);

    const entries = JSON.parse(packed.stdout) as Array<{ filename?: string }>;
    const filename = entries[0]?.filename;
    if (typeof filename !== "string") {
      assert.fail("npm pack JSON did not include a filename");
    }

    tarballPath = path.join(process.cwd(), filename);
    const cwd = tempProject();
    const result = mustRunPackedCli(cwd, tarballPath, [
      "init",
      "--name",
      "packed-smoke",
      "--tool",
      "claude-code,codex,copilot,opencode"
    ]);

    assert.match(result.stdout, /CodeWiki initialized for packed-smoke\./);
    assert.match(result.stdout, /claude-code adapter:/);
    assert.match(result.stdout, /codex adapter:/);
    assert.match(result.stdout, /copilot adapter:/);
    assert.match(result.stdout, /opencode adapter:/);

    const files = new Set(listRecursive(cwd));
    for (const rel of [
      ".codewiki/config.yml",
      ".codewiki/tasks",
      ".codewiki/hooks/pre-wiki-context.sh",
      "wiki/SCHEMA.md",
      "wiki/_archive",
      "wiki/raw/specs",
      "wiki/index.md",
      ".claude/skills/codewiki-ingest/SKILL.md",
      ".agents/skills/codewiki-ingest/SKILL.md",
      ".codex/hooks.json",
      ".github/hooks/codewiki-hooks.json",
      ".opencode/plugins/codewiki.ts"
    ]) {
      assert.equal(files.has(rel), true, `missing ${rel}`);
    }
  } finally {
    if (tarballPath && existsSync(tarballPath)) {
      unlinkSync(tarballPath);
    }
  }
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
    ".codewiki/tasks",
    ".codewiki/hooks",
    ".codewiki/hooks/post-verify.sh",
    ".codewiki/hooks/pre-wiki-context.sh",
    ".codewiki/hooks/session-end.sh",
    ".codewiki/templates/entity.md",
    ".codewiki/templates/decision.md",
    ".codewiki/templates/concept.md",
    ".codewiki/templates/comparison.md",
    ".codewiki/templates/lesson.md",
    ".codewiki/templates/issue.md",
    ".codewiki/templates/query.md",
    ".codewiki/templates/source-summary.md",
    ".claude/agents/codewiki-verifier.md",
    ".claude/agents/codewiki-wiki-updater.md",
    ".claude/settings.json",
    "CLAUDE.md",
    "wiki/SCHEMA.md",
    "wiki/raw/articles",
    "wiki/raw/papers",
    "wiki/raw/transcripts",
    "wiki/raw/specs",
    "wiki/raw/assets",
    "wiki/_archive",
    "wiki/index.md",
    "wiki/log.md",
    "wiki/entities",
    "wiki/decisions",
    "wiki/concepts",
    "wiki/comparisons",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources",
    "wiki/queries"
  ]) {
    assert.equal(files.has(rel), true, `missing ${rel}`);
  }
  assertInstalledSkillTree(cwd, ".claude/skills");
  assert.equal(existsSync(path.join(cwd, ".agents/skills")), false, "Claude-only install must not create .agents/skills");
  assert.equal(files.has(".codewiki/adapters/claude-code"), false);

  const config = readFileSync(path.join(cwd, ".codewiki/config.yml"), "utf8");
  for (const key of ["version", "project", "tools", "wiki", "verification", "ingestion", "lint"]) {
    assert.match(config, new RegExp(`^${key}:`, "m"));
  }
  assert.match(config, /name: "demo"/);
  assert.match(config, /^tools: \[\]$/m);
  assert.match(config, /raw_path: "wiki\/raw\/"/);
  assert.match(config, /tasks_path: "\.codewiki\/tasks\/"/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/entity.md"), "utf8"), /file_hashes:/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/lesson.md"), "utf8"), /verified_by: human/);
  assert.match(readFileSync(path.join(cwd, ".codewiki/templates/source-summary.md"), "utf8"), /approved: false/);
  assert.match(readFileSync(path.join(cwd, "wiki/SCHEMA.md"), "utf8"), /Raw sources: `wiki\/raw\/`/);

  const settings = JSON.parse(readFileSync(path.join(cwd, ".claude/settings.json"), "utf8")) as {
    hooks: { PreToolUse: Array<unknown>; PostToolUse: Array<unknown> };
  };
  assert.equal(settings.hooks.PreToolUse.length, 1);
  assert.equal(settings.hooks.PostToolUse.length, 1);

  const claudeInstructions = readFileSync(path.join(cwd, "CLAUDE.md"), "utf8");
  assert.match(claudeInstructions, /<!-- codewiki:start -->/);
  assert.match(claudeInstructions, /codewiki-breakdown/);
  assert.match(claudeInstructions, /not query-time RAG/);
  assert.match(claudeInstructions, /Hooks provide context and change signals/);
  assert.match(claudeInstructions, /Schema Discipline/);
  assert.match(claudeInstructions, /confidence/);
  assert.match(claudeInstructions, /source_url/);
  assert.match(claudeInstructions, /wiki\/queries\//);

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
  assertInstalledSkillTree(cwd, ".claude/skills");
  assert.equal(existsSync(path.join(cwd, ".agents/skills")), false, "Auto-detected Claude install must not create .agents/skills");
});

test("init --tool opencode installs the real OpenCode adapter and stays idempotent", () => {
  const cwd = tempProject();

  const first = mustRun(cwd, ["init", "--tool", "opencode"]);
  assert.match(first.stdout, /shared-skills adapter:/);
  assert.match(first.stdout, /opencode adapter:/);
  assert.doesNotMatch(first.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(first.stdout, /opencode \(shared skills installed; hooks and instructions remain pending\)/);

  assertInstalledSkillTree(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".claude/skills")), false, "OpenCode-only install must not create .claude/skills");
  assert.equal(existsSync(path.join(cwd, ".opencode/plugins/codewiki.ts")), true);
  assert.equal(existsSync(path.join(cwd, ".opencode/agents/codewiki-wiki-updater.md")), true);
  assert.equal(existsSync(path.join(cwd, ".opencode/agents/codewiki-verifier.md")), true);
  assert.equal(existsSync(path.join(cwd, "AGENTS.md")), true);

  const firstAgents = readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  assert.equal(countOccurrences(firstAgents, "<!-- codewiki:start -->"), 1);
  assert.match(firstAgents, /wiki\/_backlinks\.json/);
  assert.match(firstAgents, /tool\.execute\.before/);

  const second = mustRun(cwd, ["init", "--tool", "opencode"]);
  assert.match(second.stdout, /shared-skills adapter:/);
  assert.match(second.stdout, /opencode adapter:/);
  assert.doesNotMatch(second.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(second.stdout, /opencode \(shared skills installed; hooks and instructions remain pending\)/);

  const secondAgents = readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  assert.equal(countOccurrences(secondAgents, "<!-- codewiki:start -->"), 1);
});

test("init --tool codex installs hooks, agents, shared skills, and preserves user config on rerun", () => {
  const cwd = tempProject();
  mkdirSync(path.join(cwd, ".codex"), { recursive: true });
  writeFileSync(
    path.join(cwd, ".codex/hooks.json"),
    JSON.stringify(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: "Read",
              hooks: [{ type: "command", command: "echo user-codex-hook" }]
            }
          ]
        }
      },
      null,
      2
    ) + "\n"
  );
  writeFileSync(
    path.join(cwd, ".codex/config.toml"),
    "[features]\nother_feature = true\ncodex_hooks = false\n"
  );
  writeFileSync(path.join(cwd, "AGENTS.md"), "# Existing Instructions\n");

  const first = mustRun(cwd, ["init", "--tool", "codex"]);
  assert.match(first.stdout, /shared-skills adapter:/);
  assert.match(first.stdout, /codex adapter:/);
  assert.doesNotMatch(first.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(first.stdout, /codex \(shared skills installed; hooks and instructions remain pending\)/);

  assertInstalledSkillTree(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".claude/skills")), false, "Codex-only install must not create .claude/skills");

  for (const rel of [
    ".codex/hooks.json",
    ".codex/config.toml",
    ".codex/hooks/user-prompt-submit.sh",
    ".codex/hooks/post-tool-use.sh",
    ".codex/hooks/stop.sh",
    ".codex/agents/codewiki-wiki-updater.toml",
    ".codex/agents/codewiki-verifier.toml",
    "AGENTS.md"
  ]) {
    assert.equal(existsSync(path.join(cwd, rel)), true, `missing ${rel}`);
  }

  const firstHooks = JSON.parse(readFileSync(path.join(cwd, ".codex/hooks.json"), "utf8")) as {
    hooks: { PreToolUse: Array<{ matcher?: string; hooks?: Array<{ command?: string }> }> };
  };
  assert.equal(
    firstHooks.hooks.PreToolUse.some((entry) =>
      entry.hooks?.some((hook) => hook.command === "echo user-codex-hook")
    ),
    true
  );
  assert.equal(
    firstHooks.hooks.PreToolUse.some((entry) => entry.matcher === "Edit|Write|apply_patch"),
    true
  );
  assert.equal(countHookCommands(firstHooks, ".codex/hooks/user-prompt-submit.sh"), 1);
  assert.equal(countHookCommands(firstHooks, ".codex/hooks/pre-tool-use.sh"), 1);
  assert.equal(countHookCommands(firstHooks, ".codex/hooks/post-tool-use.sh"), 1);
  assert.equal(countHookCommands(firstHooks, ".codex/hooks/stop.sh"), 1);

  const firstConfig = readFileSync(path.join(cwd, ".codex/config.toml"), "utf8");
  assert.match(firstConfig, /other_feature = true/);
  assert.match(firstConfig, /codex_hooks = true/);
  assert.doesNotMatch(firstConfig, /codex_hooks = false/);

  const firstAgents = readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  assert.match(firstAgents, /^# Existing Instructions/m);
  assert.equal(countOccurrences(firstAgents, "<!-- codewiki:start -->"), 1);

  mustRun(cwd, ["init", "--tool", "codex"]);

  const secondAgents = readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  assert.equal(countOccurrences(secondAgents, "<!-- codewiki:start -->"), 1);

  const secondHooks = JSON.parse(readFileSync(path.join(cwd, ".codex/hooks.json"), "utf8"));
  assert.equal(countHookCommands(secondHooks, ".codex/hooks/user-prompt-submit.sh"), 1);
  assert.equal(countHookCommands(secondHooks, ".codex/hooks/pre-tool-use.sh"), 1);
  assert.equal(countHookCommands(secondHooks, ".codex/hooks/post-tool-use.sh"), 1);
  assert.equal(countHookCommands(secondHooks, ".codex/hooks/stop.sh"), 1);
});

test("init updates stale CodeWiki-managed instruction sections without clobbering user text", () => {
  const cases = [
    { tool: "claude-code", instructionFile: "CLAUDE.md" },
    { tool: "codex", instructionFile: "AGENTS.md" },
    { tool: "copilot", instructionFile: ".github/copilot-instructions.md" },
    { tool: "opencode", instructionFile: "AGENTS.md" }
  ] as const;

  for (const testCase of cases) {
    const cwd = tempProject();
    mkdirSync(path.dirname(path.join(cwd, testCase.instructionFile)), { recursive: true });
    writeFileSync(
      path.join(cwd, testCase.instructionFile),
      [
        "# Existing Instructions",
        "",
        "Keep this user-owned note.",
        "",
        "<!-- codewiki:start -->",
        "old generated CodeWiki instructions",
        "<!-- codewiki:end -->",
        "",
        "Keep this footer."
      ].join("\n")
    );

    const result = mustRun(cwd, ["init", "--tool", testCase.tool]);

    assert.match(result.stdout, new RegExp(testCase.instructionFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const instructions = readFileSync(path.join(cwd, testCase.instructionFile), "utf8");
    assert.match(instructions, /Keep this user-owned note\./);
    assert.match(instructions, /Keep this footer\./);
    assert.doesNotMatch(instructions, /old generated CodeWiki instructions/);
    assert.match(instructions, /codewiki-obsidian/);
    assert.equal(countOccurrences(instructions, "<!-- codewiki:start -->"), 1);
    assert.equal(countOccurrences(instructions, "<!-- codewiki:end -->"), 1);
  }
});

test("init --tool copilot installs hooks, shared skills, and preserves instructions on rerun", () => {
  const cwd = tempProject();
  mkdirSync(path.join(cwd, ".github/hooks"), { recursive: true });
  writeFileSync(path.join(cwd, ".github/copilot-instructions.md"), "# Existing Copilot Instructions\n");
  writeFileSync(path.join(cwd, ".github/hooks/existing.json"), "{\"hooks\":{}}\n");

  const first = mustRun(cwd, ["init", "--tool", "copilot"]);
  assert.match(first.stdout, /shared-skills adapter:/);
  assert.match(first.stdout, /copilot adapter:/);
  assert.doesNotMatch(first.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(first.stdout, /copilot \(shared skills installed; hooks and instructions remain pending\)/);

  assertInstalledSkillTree(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".claude/skills")), false, "Copilot-only install must not create .claude/skills");

  for (const rel of [
    ".github/hooks/codewiki-hooks.json",
    ".github/hooks/codewiki/pre-tool-use.sh",
    ".github/hooks/codewiki/post-tool-use.sh",
    ".github/hooks/codewiki/agent-stop.sh",
    ".github/agents/codewiki-wiki-updater.agent.md",
    ".github/agents/codewiki-verifier.agent.md",
    ".github/copilot-instructions.md",
    ".github/hooks/existing.json"
  ]) {
    assert.equal(existsSync(path.join(cwd, rel)), true, `missing ${rel}`);
  }

  const hooks = JSON.parse(readFileSync(path.join(cwd, ".github/hooks/codewiki-hooks.json"), "utf8")) as {
    version: number;
    hooks: Record<string, unknown>;
  };
  assert.equal(hooks.version, 1);
  assert.equal("preToolUse" in hooks.hooks, true);
  assert.equal("postToolUse" in hooks.hooks, true);
  assert.equal("agentStop" in hooks.hooks, true);
  assert.equal("sessionEnd" in hooks.hooks, true);

  const firstInstructions = readFileSync(path.join(cwd, ".github/copilot-instructions.md"), "utf8");
  assert.match(firstInstructions, /^# Existing Copilot Instructions/m);
  assert.equal(countOccurrences(firstInstructions, "<!-- codewiki:start -->"), 1);

  const second = mustRun(cwd, ["init", "--tool", "copilot"]);
  assert.match(second.stdout, /shared-skills adapter:/);
  assert.match(second.stdout, /copilot adapter:/);
  assert.doesNotMatch(second.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(second.stdout, /copilot \(shared skills installed; hooks and instructions remain pending\)/);

  const secondInstructions = readFileSync(path.join(cwd, ".github/copilot-instructions.md"), "utf8");
  assert.equal(countOccurrences(secondInstructions, "<!-- codewiki:start -->"), 1);
  assert.equal(existsSync(path.join(cwd, ".github/hooks/existing.json")), true);
  assert.equal(existsSync(path.join(cwd, ".github/agents/codewiki-wiki-updater.agent.md")), true);
  assert.equal(existsSync(path.join(cwd, ".github/agents/codewiki-verifier.agent.md")), true);

  const userEditedHooks = '{"version":1,"hooks":{"agentStop":[{"type":"command","bash":"echo user"}]}}\n';
  writeFileSync(path.join(cwd, ".github/hooks/codewiki-hooks.json"), userEditedHooks);
  const third = mustRun(cwd, ["init", "--tool", "copilot"]);
  assert.match(third.stdout, /\.github\/hooks\/codewiki-hooks\.json \(exists; use --force to replace\)/);
  assert.equal(readFileSync(path.join(cwd, ".github/hooks/codewiki-hooks.json"), "utf8"), userEditedHooks);
});

test("init --tool claude-code,codex installs both skill trees and the real Codex adapter", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--tool", "claude-code,codex"]);
  assert.match(result.stdout, /claude-code adapter:/);
  assert.match(result.stdout, /shared-skills adapter:/);
  assert.match(result.stdout, /codex adapter:/);
  assert.doesNotMatch(result.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(result.stdout, /codex \(shared skills installed; hooks and instructions remain pending\)/);
  assert.doesNotMatch(result.stdout, /Unsupported \(not yet implemented\):/);
  assertInstalledSkillTree(cwd, ".claude/skills");
  assertInstalledSkillTree(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".codex/hooks.json")), true);
  assert.equal(existsSync(path.join(cwd, "AGENTS.md")), true);
  assert.equal(existsSync(path.join(cwd, "CLAUDE.md")), true);

  const bad = runCli(tempProject(), ["init", "--tool", "unknown"]);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /Supported values: claude-code, codex, copilot, opencode, all/);

  const missingToolValue = runCli(tempProject(), ["init", "--tool", "--force"]);
  assert.notEqual(missingToolValue.status, 0);
  assert.match(missingToolValue.stderr, /--tool requires comma-separated values/);

  const empty = runCli(tempProject(), ["init", "--tool", ","]);
  assert.notEqual(empty.status, 0);
  assert.match(empty.stderr, /requires at least one supported value/);

  const deduped = tempProject();
  const duplicateSelection = mustRun(deduped, ["init", "--tool", "claude-code,claude-code,codex"]);
  assert.match(duplicateSelection.stdout, /claude-code adapter:/);
  assert.match(duplicateSelection.stdout, /shared-skills adapter:/);
  assert.match(duplicateSelection.stdout, /codex adapter:/);
  assert.doesNotMatch(
    duplicateSelection.stdout,
    /codex \(shared skills installed; hooks and instructions remain pending\)/
  );
  assertInstalledSkillTree(deduped, ".claude/skills");
  assertInstalledSkillTree(deduped, ".agents/skills");
  assert.equal(existsSync(path.join(deduped, ".codex/hooks.json")), true);
});

test("init --tool all installs every supported adapter", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--tool", "all"]);

  assert.match(result.stdout, /claude-code adapter:/);
  assert.match(result.stdout, /shared-skills adapter:/);
  assert.match(result.stdout, /codex adapter:/);
  assert.match(result.stdout, /copilot adapter:/);
  assert.match(result.stdout, /opencode adapter:/);
  assert.doesNotMatch(result.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(result.stdout, /shared skills installed; hooks and instructions remain pending/);

  assertInstalledSkillTreeOnce(cwd, ".claude/skills");
  assertInstalledSkillTreeOnce(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".codex/hooks.json")), true);
  assert.equal(existsSync(path.join(cwd, ".github/hooks/codewiki-hooks.json")), true);
  assert.equal(existsSync(path.join(cwd, ".opencode/plugins/codewiki.ts")), true);
});

test("init --tool claude-code,copilot installs both skill trees and the real Copilot adapter", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--tool", "claude-code,copilot"]);
  assert.match(result.stdout, /claude-code adapter:/);
  assert.match(result.stdout, /shared-skills adapter:/);
  assert.match(result.stdout, /copilot adapter:/);
  assert.doesNotMatch(result.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(result.stdout, /copilot \(shared skills installed; hooks and instructions remain pending\)/);

  assertInstalledSkillTreeOnce(cwd, ".claude/skills");
  assertInstalledSkillTreeOnce(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".github/hooks/codewiki-hooks.json")), true);
  assert.equal(existsSync(path.join(cwd, ".github/copilot-instructions.md")), true);
  assert.equal(existsSync(path.join(cwd, "CLAUDE.md")), true);
});

test("init --tool claude-code,codex,copilot,opencode reports all real adapters without pending integrations", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["init", "--tool", "claude-code,codex,copilot,opencode"]);

  assert.match(result.stdout, /claude-code adapter:/);
  assert.match(result.stdout, /shared-skills adapter:/);
  assert.match(result.stdout, /codex adapter:/);
  assert.match(result.stdout, /copilot adapter:/);
  assert.match(result.stdout, /opencode adapter:/);
  assert.doesNotMatch(result.stdout, /Tool-specific integrations pending:/);
  assert.doesNotMatch(result.stdout, /shared skills installed; hooks and instructions remain pending/);

  assertInstalledSkillTreeOnce(cwd, ".claude/skills");
  assertInstalledSkillTreeOnce(cwd, ".agents/skills");
  assert.equal(existsSync(path.join(cwd, ".codex/hooks.json")), true);
  assert.equal(existsSync(path.join(cwd, ".github/hooks/codewiki-hooks.json")), true);
  assert.equal(existsSync(path.join(cwd, ".opencode/plugins/codewiki.ts")), true);
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
  assertInstalledSkillTree(cwd, ".claude/skills");
  assert.equal(existsSync(path.join(cwd, ".agents/skills")), false, "Claude reruns must not create .agents/skills");

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
  assertInstalledSkillTree(cwd, ".claude/skills");
  assert.equal(existsSync(path.join(cwd, ".agents/skills")), false, "Claude reruns must keep .agents/skills absent");

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

test("init installs hook scripts with executable permissions (mode 755)", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init", "--tool", "claude-code"]);

  for (const hookFile of [
    ".codewiki/hooks/pre-wiki-context.sh",
    ".codewiki/hooks/post-verify.sh",
    ".codewiki/hooks/session-end.sh"
  ]) {
    const stats = statSync(path.join(cwd, hookFile));
    const mode = stats.mode & 0o777;
    assert.equal(mode, 0o755, `${hookFile} expected mode 755, got ${mode.toString(8)}`);
  }
});

test("init --force replaces existing skill and agent files", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init", "--tool", "claude-code"]);

  writeFileSync(path.join(cwd, ".claude/skills/codewiki-ingest/SKILL.md"), "# Stale content\n");
  writeFileSync(path.join(cwd, ".claude/agents/codewiki-verifier.md"), "# Stale agent\n");

  const result = mustRun(cwd, ["init", "--tool", "claude-code", "--force"]);

  assert.match(result.stdout, /↻/);
  assert.match(result.stdout, /codewiki-ingest\/SKILL\.md/);
  assert.ok(!/# Stale content/.test(readFileSync(path.join(cwd, ".claude/skills/codewiki-ingest/SKILL.md"), "utf8")));
  assert.ok(!/# Stale agent/.test(readFileSync(path.join(cwd, ".claude/agents/codewiki-verifier.md"), "utf8")));
  assertInstalledSkillTree(cwd, ".claude/skills");
  assert.equal(existsSync(path.join(cwd, ".agents/skills")), false, "Force reruns must keep .agents/skills absent for Claude-only installs");
});

test("init updates stale managed adapter assets without --force", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init", "--tool", "claude-code,codex"]);

  writeFileSync(path.join(cwd, ".claude/skills/codewiki-ingest/SKILL.md"), "# Stale Claude skill\n");
  writeFileSync(path.join(cwd, ".agents/skills/codewiki-ingest/SKILL.md"), "# Stale shared skill\n");
  writeFileSync(path.join(cwd, ".claude/agents/codewiki-verifier.md"), "# Stale Claude agent\n");
  writeFileSync(path.join(cwd, ".codewiki/hooks/pre-wiki-context.sh"), "#!/bin/sh\n# Stale hook\n");

  const result = mustRun(cwd, ["init", "--tool", "claude-code,codex"]);

  assert.match(result.stdout, /↻ replaced \.claude\/skills\/codewiki-ingest\/SKILL\.md/);
  assert.match(result.stdout, /↻ replaced \.agents\/skills\/codewiki-ingest\/SKILL\.md/);
  assert.match(result.stdout, /↻ replaced \.claude\/agents\/codewiki-verifier\.md/);
  assert.match(result.stdout, /↻ replaced \.codewiki\/hooks\/pre-wiki-context\.sh/);
  assert.ok(!/# Stale Claude skill/.test(readFileSync(path.join(cwd, ".claude/skills/codewiki-ingest/SKILL.md"), "utf8")));
  assert.ok(!/# Stale shared skill/.test(readFileSync(path.join(cwd, ".agents/skills/codewiki-ingest/SKILL.md"), "utf8")));
  assert.ok(!/# Stale Claude agent/.test(readFileSync(path.join(cwd, ".claude/agents/codewiki-verifier.md"), "utf8")));
  assert.ok(!/# Stale hook/.test(readFileSync(path.join(cwd, ".codewiki/hooks/pre-wiki-context.sh"), "utf8")));
});
