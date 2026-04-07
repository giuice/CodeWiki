import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runCli } from "../src/cli.js";
const execFileAsync = promisify(execFile);
async function tempProject() {
    return mkdir(path.join(tmpdir(), `codewiki-${Date.now()}-${Math.random().toString(16).slice(2)}`), { recursive: true }).then(() => path.join(tmpdir(), `codewiki-${Date.now()}-${Math.random().toString(16).slice(2)}`));
}
async function makeTempProject() {
    const root = path.join(tmpdir(), `codewiki-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(root, { recursive: true });
    return root;
}
async function run(args, cwd, now) {
    let stdout = "";
    let stderr = "";
    const code = await runCli(args, {
        cwd,
        stdout: (message) => { stdout += message; },
        stderr: (message) => { stderr += message; },
        ...(now ? { now } : {}),
    });
    return { code, stdout, stderr };
}
async function exists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch (error) {
        if (error.code === "ENOENT")
            return false;
        throw error;
    }
}
async function listFiles(root, relativeDir) {
    const base = path.join(root, relativeDir);
    const found = [];
    async function walk(current) {
        for (const entry of await readdir(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory())
                await walk(full);
            else
                found.push(path.relative(root, full).split(path.sep).join("/"));
        }
    }
    await walk(base);
    return found.sort();
}
test("compiled CLI help lists all required commands", async () => {
    const cliPath = path.resolve("dist/bin/codewiki.js");
    const { stdout } = await execFileAsync(process.execPath, [cliPath, "--help"]);
    for (const command of ["init", "ingest", "query", "lint", "prd", "tasks", "status"]) {
        assert.match(stdout, new RegExp(`\\b${command}\\b`));
    }
});
test("init creates scaffold, selected adapters, config keys, and refuses unsafe overwrite", async () => {
    const root = await makeTempProject();
    const result = await run(["init", "--name", "demo", "--tool", "claude-code,codex"], root);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /No tool auto-detection was claimed/);
    const required = [
        ".codewiki/config.yml",
        ".codewiki/templates/entity.md",
        ".codewiki/templates/decision.md",
        ".codewiki/templates/lesson.md",
        ".codewiki/templates/issue.md",
        ".codewiki/templates/source-summary.md",
        ".codewiki/adapters/claude-code/README.md",
        ".codewiki/adapters/codex/AGENTS.fragment.md",
        "raw",
        "wiki/index.md",
        "wiki/log.md",
        "wiki/entities",
        "wiki/decisions",
        "wiki/lessons",
        "wiki/issues",
        "wiki/sources",
    ];
    for (const relative of required) {
        assert.equal(await exists(path.join(root, relative)), true, `${relative} should exist`);
    }
    assert.equal(await exists(path.join(root, ".codewiki/adapters/copilot")), false);
    assert.equal(await exists(path.join(root, ".codewiki/adapters/opencode")), false);
    const config = await readFile(path.join(root, ".codewiki/config.yml"), "utf8");
    for (const key of ["version:", "project:", "tools:", "wiki:", "verification:", "ingestion:", "lint:"]) {
        assert.match(config, new RegExp(`^${key}`, "m"));
    }
    const entityTemplate = await readFile(path.join(root, ".codewiki/templates/entity.md"), "utf8");
    assert.match(entityTemplate, /type: entity/);
    assert.match(entityTemplate, /file_hashes:/);
    const codexAdapter = await readFile(path.join(root, ".codewiki/adapters/codex/AGENTS.fragment.md"), "utf8");
    assert.match(codexAdapter, /instruction-only/);
    assert.match(codexAdapter, /file-modification-only/);
    const rerun = await run(["init"], root);
    assert.equal(rerun.code, 1);
    assert.match(rerun.stderr, /Refusing to overwrite/);
    const unknownRoot = await makeTempProject();
    const unknown = await run(["init", "--tool", "unknown"], unknownRoot);
    assert.equal(unknown.code, 1);
    assert.match(unknown.stderr, /Supported values: claude-code, codex, copilot, opencode/);
});
test("ingest and query are proposal-safe and do not modify wiki files", async () => {
    const root = await makeTempProject();
    assert.equal((await run(["init"], root)).code, 0);
    await writeFile(path.join(root, "raw/api-redesign.md"), "# API Redesign\n\nRetry logic belongs in api-client.", "utf8");
    await writeFile(path.join(root, "wiki/index.md"), "# CodeWiki Index\n\n- [api-client](entities/api-client.md) — retry API client tags: api retry\n", "utf8");
    await writeFile(path.join(root, "wiki/entities/api-client.md"), "---\ntype: entity\nname: api-client\n---\n# api-client\n\nHandles API retry behavior.\n", "utf8");
    const beforeFiles = await listFiles(root, "wiki");
    const beforeIndex = await readFile(path.join(root, "wiki/index.md"), "utf8");
    const beforeEntity = await readFile(path.join(root, "wiki/entities/api-client.md"), "utf8");
    const nonMarkdown = await run(["ingest", "raw/api-redesign.txt"], root);
    assert.equal(nonMarkdown.code, 1);
    assert.match(nonMarkdown.stderr, /markdown sources only/);
    const ingest = await run(["ingest", "raw/api-redesign.md"], root);
    assert.equal(ingest.code, 0, ingest.stderr);
    assert.match(ingest.stdout, /PROPOSAL ONLY — no wiki files were modified without approval/);
    assert.match(ingest.stdout, /Source Summary: raw\/api-redesign.md/);
    assert.match(ingest.stdout, /wiki\/entities\/api-client.md/);
    assert.deepEqual(await listFiles(root, "wiki"), beforeFiles);
    assert.equal(await readFile(path.join(root, "wiki/index.md"), "utf8"), beforeIndex);
    assert.equal(await readFile(path.join(root, "wiki/entities/api-client.md"), "utf8"), beforeEntity);
    const query = await run(["query", "retry api"], root);
    assert.equal(query.code, 0, query.stderr);
    assert.match(query.stdout, /Read order:\n1\. `wiki\/index.md`\n2\. `wiki\/entities\/api-client.md`/);
    assert.match(query.stdout, /Matched page references/);
    assert.match(query.stdout, /PROPOSAL ONLY — no wiki files were modified without approval/);
    assert.deepEqual(await listFiles(root, "wiki"), beforeFiles);
});
test("lint reports deterministic issues and separates semantic agent review", async () => {
    const emptyRoot = await makeTempProject();
    const missing = await run(["lint"], emptyRoot);
    assert.equal(missing.code, 0);
    assert.match(missing.stdout, /Missing required CodeWiki path: wiki\/index.md/);
    const root = await makeTempProject();
    assert.equal((await run(["init"], root)).code, 0);
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src/foo.ts"), "export const foo = 1;\n", "utf8");
    await writeFile(path.join(root, "wiki/issues/ISSUE-001.md"), "---\ntype: issue\nid: ISSUE-001\nstatus: resolved\nresolved_by: null\n---\n# ISSUE-001\n", "utf8");
    await writeFile(path.join(root, "wiki/entities/foo.md"), "---\ntype: entity\nname: foo\nfile_hashes:\n  src/foo.ts: wrong-hash\n---\n# foo\n\nSee [[MISSING-123]].\n", "utf8");
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
    const now = new Date("2026-04-07T17:30:00.000Z");
    const prd = await run(["prd", "add retry widget"], root, now);
    assert.equal(prd.code, 0, prd.stderr);
    assert.match(prd.stdout, /raw\/prd-20260407T173000Z-add-retry-widget\.md/);
    const prdPath = prd.stdout.match(/raw\/[^\s]+\.md/)?.[0];
    assert.ok(prdPath);
    const prdContent = await readFile(path.join(root, prdPath), "utf8");
    assert.match(prdContent, /human-review-needed/);
    const tasks = await run(["tasks", prdPath], root, now);
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
    assert.match(status.stdout, /Latest log entry: ## \[2026-04-07T17:00\] ingest \| demo/);
});
//# sourceMappingURL=cli.test.js.map