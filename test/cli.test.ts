import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cliPath = path.resolve("dist/bin/codewiki.js");

async function makeTempProject(): Promise<string> {
  const root = path.join(tmpdir(), `codewiki-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(root, { recursive: true });
  return root;
}

async function run(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, ...args], { cwd });
    return { code: 0, stdout: String(stdout), stderr: String(stderr) };
  } catch (error) {
    const failure = error as Error & { code?: number | string; stdout?: string | Buffer; stderr?: string | Buffer };
    return {
      code: typeof failure.code === "number" ? failure.code : 1,
      stdout: String(failure.stdout ?? ""),
      stderr: String(failure.stderr ?? failure.message),
    };
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root: string, relDir: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  async function visit(absDir: string): Promise<void> {
    if (!(await exists(absDir))) return;
    for (const entry of await readdir(absDir, { withFileTypes: true })) {
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) await visit(abs);
      else if (entry.isFile()) out.set(path.relative(root, abs).split(path.sep).join("/"), await readFile(abs, "utf8"));
    }
  }
  await visit(path.join(root, relDir));
  return out;
}

test("compiled CLI help lists all required commands", async () => {
  const { stdout } = await execFileAsync(process.execPath, [cliPath, "--help"]);
  for (const command of ["init", "ingest", "query", "lint", "prd", "tasks", "status"]) {
    assert.match(stdout, new RegExp(`\\b${command}\\b`));
  }
  assert.deepEqual(pkg.dependencies ?? {}, {}, "runtime dependencies should stay empty for v1");
  const devDeps = pkg.devDependencies as Record<string, string>;
  assert.ok(devDeps.typescript);
  assert.ok(devDeps["@types/node"]);

  const tsconfig = JSON.parse(await readFile(path.join(repoRoot, "tsconfig.json"), "utf8")) as { compilerOptions: Record<string, unknown> };
  assert.equal(tsconfig.compilerOptions.strict, true);
  assert.equal(tsconfig.compilerOptions.module, "NodeNext");

  const help = runCodeWiki(["--help"]);
  assert.equal(help.status, 0, help.stderr);
  for (const command of ["init", "ingest", "query", "lint", "prd", "tasks", "status"]) {
    assert.match(help.stdout, new RegExp(`\\b${command}\\b`));
  }

  const unknown = runCodeWiki(["does-not-exist"]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown command: does-not-exist/);
});

test("init creates the PRD scaffold, filters adapters, and protects existing files", async () => {
  const root = await tempProject();
  const init = runCodeWiki(["init", "--name", "Sample Project", "--tool", "claude-code,codex"], root);
  assert.equal(init.status, 0, init.stderr);
  assert.match(init.stdout, /No tool auto-detection was performed/);

  const required = [
    ".codewiki/config.yml",
    ".codewiki/templates/entity.md",
    ".codewiki/templates/decision.md",
    ".codewiki/templates/lesson.md",
    ".codewiki/templates/issue.md",
    ".codewiki/templates/source-summary.md",
    ".codewiki/adapters/claude-code/README.md",
    ".codewiki/adapters/codex/README.md",
    "raw",
    "wiki/index.md",
    "wiki/log.md",
    "wiki/entities",
    "wiki/decisions",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources"
  ];
  for (const relPath of required) {
    assert.ok(await exists(path.join(root, relPath)), `missing ${relPath}`);
  }
  assert.equal(await exists(path.join(root, ".codewiki/adapters/copilot/README.md")), false);
  assert.equal(await exists(path.join(root, ".codewiki/adapters/opencode/README.md")), false);

  const config = await readFile(path.join(root, ".codewiki/config.yml"), "utf8");
  for (const key of ["version", "project", "tools", "wiki", "verification", "ingestion", "lint"]) {
    assert.match(config, new RegExp(`^${key}:`, "m"));
  }
  assert.match(config, /- claude-code/);
  assert.match(config, /- codex/);
  assert.doesNotMatch(config, /- copilot/);

  const entityTemplate = await readFile(path.join(root, ".codewiki/templates/entity.md"), "utf8");
  assert.match(entityTemplate, /type: entity/);
  assert.match(entityTemplate, /file_hashes:/);
  assert.match(entityTemplate, /verified_by: human/);
  assert.match(entityTemplate, /approved: false/);
  const codexAdapter = await readFile(path.join(root, ".codewiki/adapters/codex/README.md"), "utf8");
  assert.match(codexAdapter, /instruction-only in v1/);
  assert.match(codexAdapter, /file-modification-only/);
  assert.match(codexAdapter, /wiki\/index\.md/);

  await writeFile(path.join(root, "wiki/index.md"), "custom", "utf8");
  const blocked = runCodeWiki(["init", "--name", "Sample Project", "--tool", "claude-code,codex"], root);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /Refusing to overwrite existing non-empty CodeWiki file without --force/);

  const badTool = runCodeWiki(["init", "--tool", "unknown"], await tempProject());
  assert.notEqual(badTool.status, 0);
  assert.match(badTool.stderr, /Supported values: claude-code, codex, copilot, opencode/);
});

test("ingest and query are proposal-safe and reference wiki/index.md first", async () => {
  const root = await tempProject();
  assert.equal(runCodeWiki(["init", "--name", "Safe"], root).status, 0);
  await writeFile(path.join(root, "wiki/index.md"), "# Index\n\n- [Router](wiki/entities/router.md)\n", "utf8");
  await writeFile(path.join(root, "wiki/entities/router.md"), `---\ntype: entity\nid: ENTITY-ROUTER\n---\n\n# Router\n\nThe router dispatches query commands and keeps proposal boundaries.\n`, "utf8");
  await writeFile(path.join(root, "raw/source.md"), "# Router Notes\n\nThe router should dispatch query requests safely.", "utf8");
  await writeFile(path.join(root, "raw/source.txt"), "not markdown", "utf8");
  const before = await listFiles(root, "wiki");

  const rejected = runCodeWiki(["ingest", "raw/source.txt"], root);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /markdown sources only/);

  const ingest = runCodeWiki(["ingest", "raw/source.md"], root);
  assert.equal(ingest.status, 0, ingest.stderr);
  assert.match(ingest.stdout, /Source Summary Proposal: raw\/source\.md/);
  assert.match(ingest.stdout, /PROPOSAL ONLY — no wiki files were modified without approval/);
  assert.match(ingest.stdout, /Candidate Related Updates/);
  assert.match(ingest.stdout, /wiki\/entities\/router\.md/);
  assert.match(ingest.stdout, /Read Order\nwiki\/index\.md -> wiki\/entities\/router\.md/);
  assert.deepEqual(await listFiles(root, "wiki"), before, "ingest must not mutate wiki files");

  const query = runCodeWiki(["query", "How does router dispatch work?"], root);
  assert.equal(query.status, 0, query.stderr);
  assert.match(query.stdout, /Read order: wiki\/index\.md -> wiki\/entities\/router\.md/);
  assert.match(query.stdout, /Wiki References/);
  assert.match(query.stdout, /wiki\/entities\/router\.md/);
  assert.match(query.stdout, /Do not create wiki pages automatically/);
  assert.deepEqual(await listFiles(root, "wiki"), before, "query must not mutate wiki files");

  const noMatch = runCodeWiki(["query", "unrelated frobnicator"], root);
  assert.equal(noMatch.status, 0, noMatch.stderr);
  assert.match(noMatch.stdout, /No matching wiki pages found|wiki\/entities\/router\.md/);
});

test("lint, prd, tasks, and status preserve human approval boundaries", async () => {
  const root = await tempProject();
  assert.equal(runCodeWiki(["init", "--name", "Linty"], root).status, 0);
  await writeFile(path.join(root, "tracked.ts"), "export const value = 1;\n", "utf8");
  const wrongHash = createHash("sha256").update("old").digest("hex");
  await writeFile(path.join(root, "wiki/entities/service.md"), `---\ntype: entity\nid: ENTITY-SERVICE\nfile_hashes:\n  tracked.ts: ${wrongHash}\n---\n\n# Service\n\nLinks to [[MISSING-PAGE]].\n`, "utf8");
  await writeFile(path.join(root, "wiki/issues/done.md"), `---\ntype: issue\nid: ISSUE-DONE\nstatus: resolved\nresolved_by: ""\n---\n\n# Done\n`, "utf8");
  await writeFile(path.join(root, "wiki/lessons/lonely.md"), `---\ntype: lesson\nid: LESSON-LONELY\n---\n\n# Lonely\n`, "utf8");

  const lint = runCodeWiki(["lint"], root);
  assert.equal(lint.status, 0, lint.stderr);
  for (const category of ["broken-link", "issue-lifecycle", "orphan", "file-drift", "agent-review"]) {
    assert.match(lint.stdout, new RegExp(`\\[${category}\\]`));
  }
  assert.match(lint.stdout, /no wiki fixes were written automatically/);

  const lint = await run(["lint"], root);
  assert.equal(lint.code, 0, lint.stderr);
  assert.match(lint.stdout, /Broken wikilink \[\[MISSING-123\]\]/);
  assert.match(lint.stdout, /Resolved issue is missing resolved_by/);
  assert.match(lint.stdout, /Entity file hash drift for src\/foo.ts/);
  assert.match(lint.stdout, /Orphan candidate/);
  assert.match(lint.stdout, /Semantic contradiction and stale-claim review requires an agent\/human checklist/);
  assert.match(lint.stdout, /PROPOSAL ONLY — no wiki files were modified without approval/);
});

test("prd, tasks, and status create human-review artifacts and summarize wiki state", async () => {
  const root = await makeTempProject();
  assert.equal((await run(["init", "--name", "status-demo"], root)).code, 0);
  const prd = await run(["prd", "add retry widget"], root);
  assert.equal(prd.code, 0, prd.stderr);
  assert.match(prd.stdout, /raw\/prd-\d{8}T\d{6}Z-add-retry-widget\.md/);
  const prdPath = prd.stdout.match(/raw\/[^\s]+\.md/)?.[0];
  assert.ok(prdPath);
  const prdContent = await readFile(path.join(root, prdPath), "utf8");
  assert.match(prdContent, /human-review-needed/);

  const tasks = await run(["tasks", prdPath], root);
  assert.equal(tasks.code, 0, tasks.stderr);
  assert.match(tasks.stdout, /human-review-needed task artifact/);
  const taskPath = tasks.stdout.match(/raw\/[^\s]+\.md/)?.[0];
  assert.ok(taskPath);
  const taskContent = await readFile(path.join(root, taskPath), "utf8");
  assert.match(taskContent, /Verification Loop Required/);
  assert.match(taskContent, /request human approval before wiki writes/);

  await writeFile(path.join(root, "wiki/log.md"), "# CodeWiki Log\n\n## [2026-04-07T17:00] ingest | demo\n- Status: VERIFIED ✅\n", "utf8");
  await writeFile(path.join(root, "wiki/issues/ISSUE-OPEN.md"), "---\ntype: issue\nid: ISSUE-OPEN\nstatus: open\n---\n# ISSUE-OPEN\n", "utf8");
  await writeFile(path.join(root, "wiki/issues/ISSUE-RESOLVED.md"), "---\ntype: issue\nid: ISSUE-RESOLVED\nstatus: resolved\nresolved_by: LESSON-001\n---\n# ISSUE-RESOLVED\n", "utf8");
  const status = await run(["status"], root);
  assert.equal(status.code, 0, status.stderr);
  assert.match(status.stdout, /Project: status-demo/);
  assert.match(status.stdout, /Open issues: 1/);
  assert.match(status.stdout, /Resolved issues: 1/);
  assert.match(status.stdout, /Drift warning count: 1/);

  const prd = runCodeWiki(["prd", "Add CodeWiki prompts"], root);
  assert.equal(prd.status, 0, prd.stderr);
  const prdPath = prd.stdout.match(/raw\/[\w.-]+\.md/)?.[0];
  assert.ok(prdPath, prd.stdout);
  const prdText = await readFile(path.join(root, prdPath), "utf8");
  assert.match(prdText, /status: human-review-needed/);
  assert.match(prdText, /approved: false/);

  const tasks = runCodeWiki(["tasks", prdPath], root);
  assert.equal(tasks.status, 0, tasks.stderr);
  const tasksPath = tasks.stdout.match(/raw\/[\w.-]+\.md/)?.[0];
  assert.ok(tasksPath, tasks.stdout);
  const tasksText = await readFile(path.join(root, tasksPath), "utf8");
  assert.match(tasksText, /verification loop/i);
  assert.match(tasksText, /approved: false/);
});
