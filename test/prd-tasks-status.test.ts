import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { mustRun, tempProject } from "./helpers.js";

function firstRawPath(stdout: string): string {
  const match = stdout.match(/raw\/[A-Za-z0-9._-]+\.md/);
  assert.ok(match, `expected raw markdown path in ${stdout}`);
  return match[0];
}

test("prd and tasks create human-review-needed raw artifacts", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init"]);
  const prd = mustRun(cwd, ["prd", "add retry policy"]);
  const prdPath = firstRawPath(prd.stdout);
  assert.equal(existsSync(path.join(cwd, prdPath)), true);
  assert.match(readFileSync(path.join(cwd, prdPath), "utf8"), /HUMAN-REVIEW-NEEDED/);

  const tasks = mustRun(cwd, ["tasks", prdPath]);
  const tasksPath = firstRawPath(tasks.stdout);
  assert.equal(existsSync(path.join(cwd, tasksPath)), true);
  const taskText = readFileSync(path.join(cwd, tasksPath), "utf8");
  assert.match(taskText, /verification loop/i);
  assert.match(taskText, /human approval/i);
});

test("status reports page counts, latest log entry, issue counts, and drift warnings", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init"]);
  writeFileSync(path.join(cwd, "wiki/log.md"), "# CodeWiki Log\n\n## [2026-04-07T14:32] ingest | api\n- Status: VERIFIED ✅\n");
  writeFileSync(path.join(cwd, "wiki/issues/ISSUE-OPEN.md"), "---\ntype: issue\nid: ISSUE-OPEN\nstatus: open\n---\n# ISSUE-OPEN\n");
  writeFileSync(path.join(cwd, "wiki/issues/ISSUE-RESOLVED.md"), "---\ntype: issue\nid: ISSUE-RESOLVED\nstatus: resolved\nresolved_by: LESSON-001\n---\n# ISSUE-RESOLVED\n");
  writeFileSync(path.join(cwd, "wiki/lessons/LESSON-001.md"), "---\ntype: lesson\nid: LESSON-001\n---\n# LESSON-001\n");
  const status = mustRun(cwd, ["status"]);
  assert.match(status.stdout, /Pages:/);
  assert.match(status.stdout, /Last log entry: \[2026-04-07T14:32\] ingest \| api/);
  assert.match(status.stdout, /Issues open: 1/);
  assert.match(status.stdout, /Issues resolved: 1/);
  assert.match(status.stdout, /Drift warning count:/);
});
