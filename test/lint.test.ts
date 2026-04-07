import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { mustRun, runCli, tempProject } from "./helpers.js";

test("lint reports missing required files without requiring git", () => {
  const cwd = tempProject();
  const result = mustRun(cwd, ["lint"]);
  assert.match(result.stdout, /missing-required/);
  assert.match(result.stdout, /wiki\/index\.md/);
  assert.match(result.stdout, /Agent Review Checklist/);
});

test("lint reports broken links, issue lifecycle, orphan candidates, and file drift", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init"]);
  mkdirSync(path.join(cwd, "src"), { recursive: true });
  writeFileSync(path.join(cwd, "src/api.ts"), "export const api = 1;\n");
  writeFileSync(path.join(cwd, "wiki/entities/api.md"), `---
type: entity
name: api
file_hashes:
  src/api.ts: not-the-current-hash
---
# api

References [[MISSING-404]].
`);
  writeFileSync(path.join(cwd, "wiki/issues/ISSUE-001.md"), `---
type: issue
id: ISSUE-001
status: resolved
resolved_by: ""
---
# ISSUE-001

Resolved but not linked.
`);
  const result = mustRun(cwd, ["lint"]);
  assert.match(result.stdout, /broken-link/);
  assert.match(result.stdout, /issue-lifecycle/);
  assert.match(result.stdout, /orphan/);
  assert.match(result.stdout, /file-drift/);
  assert.match(result.stdout, /agent-review/);
  assert.match(result.stdout, /PROPOSAL ONLY/);
});

test("path escape attempts fail safely", () => {
  const cwd = tempProject();
  mustRun(cwd, ["init"]);
  const result = runCli(cwd, ["ingest", "../outside.md"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Path escapes project root|no such file/i);
});
