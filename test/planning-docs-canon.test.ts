import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("planning docs canon keeps roadmap and requirements aligned to SM-05", () => {
  const roadmap = readWorkspaceFile(".planning/ROADMAP.md");
  const requirements = readWorkspaceFile(".planning/REQUIREMENTS.md");

  assert.match(roadmap, /### Phase 4\.1\.4: Planning Docs Canon Refresh \(INSERTED\)/);
  assert.match(roadmap, /\*\*Requirements\*\*: SM-05/);
  assert.match(roadmap, /installs 8 skills to `\.claude\/skills\/codewiki-<name>\//);
  assert.match(roadmap, /`\.agents\/skills\/codewiki-<name>\/SKILL\.md`/);
  assert.match(roadmap, /dist\/templates\/skills\/codewiki-ingest\/SKILL\.md/);

  assert.match(
    requirements,
    /\*\*SM-05\*\*: Planning artifacts \(`ROADMAP\.md`, `REQUIREMENTS\.md`, `STATE\.md`, and active phase contexts\/plans\) reflect the skills canon and parser-safe split structure/
  );
  assert.match(requirements, /\| SM-05 \| Phase 4\.1\.4 \(Planning Docs Canon Refresh\) \| Complete \(2026-04-12\) \|/);
  assert.match(requirements, /\| SM-06 \| Phase 4\.1\.5 \(Product Docs Canon Refresh\) \| Planned \|/);
  assert.match(requirements, /\*\*CC-01\*\*: Installs 8 skills to `\.claude\/skills\/codewiki-<name>\/SKILL\.md`/);
  assert.match(requirements, /\*\*OC-01\*\*: Installs 8 skills to `\.opencode\/skills\/codewiki-<name>\/SKILL\.md`/);
  assert.match(requirements, /\*\*CODEX-01\*\*: Installs 8 skills to correct Codex skill directory/);
});

test("planning docs canon keeps state, conventions, and active context parser-safe", () => {
  const state = readWorkspaceFile(".planning/STATE.md");
  const conventions = readWorkspaceFile(".planning/CONVENTIONS.md");
  const phaseContext = readWorkspaceFile(".planning/phases/04.1-skills-migration/04.1-CONTEXT.md");

  assert.match(state, /Phase 04\.1 planning uses parser-safe chained decimals \(4\.1\.1-4\.1\.5\)/);
  assert.match(
    state,
    /Phase 04\.1\.2: skills canon install surface is `\.claude\/skills\/codewiki-<name>\/SKILL\.md` for Claude and `\.agents\/skills\/codewiki-<name>\/SKILL\.md` for non-Claude tools/
  );

  assert.match(conventions, /\(e\.g\., 4\.1\.1, 4\.1\.2\)/);
  assert.doesNotMatch(conventions, /\(e\.g\., 4\.1a, 4\.1b\)/);

  assert.match(phaseContext, /Use chained decimal numbering for the split\./);
  assert.match(phaseContext, /does not parse suffixes like `4\.1a`/);
  assert.match(phaseContext, /\.claude\/skills\/codewiki-<name>\/SKILL\.md/);
  assert.match(phaseContext, /\.agents\/skills\/codewiki-<name>\/SKILL\.md/);
  assert.doesNotMatch(phaseContext, /\*\*04\.1a\b/);
  assert.doesNotMatch(phaseContext, /\*\*04\.1b\b/);
});
