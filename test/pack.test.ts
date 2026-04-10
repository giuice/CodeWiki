import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("npm pack --dry-run includes required template files in tarball (BUILD-01, BUILD-02)", () => {
  // npm pack --dry-run triggers prepack → build → clean → recompile.
  // This test MUST run after vitest (unit tests) to avoid wiping dist/ mid-suite.
  // The test script order guarantees this: npm run build && npm run test:unit && node --test dist/test/**
  const result = spawnSync("npm", ["pack", "--dry-run"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `npm pack --dry-run failed:\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`);

  const packDetails = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(
    packDetails.status,
    0,
    `npm pack --dry-run --json failed:\nSTDOUT: ${packDetails.stdout}\nSTDERR: ${packDetails.stderr}`
  );

  const packOutput = packDetails.stdout;

  // IMPORTANT: REQUIREMENTS.md says `dist/templates/claude/commands/ingest.md` but that path
  // does NOT exist in the tarball. The actual path includes the codewiki/ subdirectory.
  // Using the real path verified against actual npm pack --dry-run output.
  assert.match(
    packOutput,
    /dist\/templates\/claude\/commands\/codewiki\/ingest\.md/,
    "tarball must include dist/templates/claude/commands/codewiki/ingest.md (BUILD-02)"
  );
  assert.match(
    packOutput,
    /dist\/templates\/hooks\/pre-wiki-context\.sh/,
    "tarball must include dist/templates/hooks/pre-wiki-context.sh"
  );
  assert.match(
    packOutput,
    /dist\/templates\/hooks\/post-verify\.sh/,
    "tarball must include dist/templates/hooks/post-verify.sh"
  );
  assert.match(
    packOutput,
    /dist\/templates\/hooks\/session-end\.sh/,
    "tarball must include dist/templates/hooks/session-end.sh"
  );
});
