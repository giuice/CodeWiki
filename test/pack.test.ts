import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const REQUIRED_TEMPLATE_FILES = [
  "dist/templates/skills/codewiki-absorb/SKILL.md",
  "dist/templates/skills/codewiki-breakdown/SKILL.md",
  "dist/templates/skills/codewiki-ingest/SKILL.md",
  "dist/templates/skills/codewiki-lint/SKILL.md",
  "dist/templates/skills/codewiki-obsidian/SKILL.md",
  "dist/templates/skills/codewiki-prd/SKILL.md",
  "dist/templates/skills/codewiki-process/SKILL.md",
  "dist/templates/skills/codewiki-query/SKILL.md",
  "dist/templates/skills/codewiki-tasks/SKILL.md",
  "dist/templates/hooks/pre-wiki-context.sh",
  "dist/templates/hooks/post-verify.sh",
  "dist/templates/hooks/session-end.sh",
  "dist/templates/claude/agents/codewiki-verifier.md",
  "dist/templates/claude/agents/codewiki-wiki-updater.md",
  "dist/templates/claude/instructions.md",
  "dist/templates/codex/hooks.json",
  "dist/templates/codex/config.toml",
  "dist/templates/codex/hooks/user-prompt-submit.sh",
  "dist/templates/codex/hooks/pre-tool-use.sh",
  "dist/templates/codex/hooks/post-tool-use.sh",
  "dist/templates/codex/hooks/stop.sh",
  "dist/templates/codex/agents/codewiki-verifier.toml",
  "dist/templates/codex/agents/codewiki-wiki-updater.toml",
  "dist/templates/codex/instructions.md",
  "dist/templates/copilot/hooks/codewiki-hooks.json",
  "dist/templates/copilot/hooks/pre-tool-use.sh",
  "dist/templates/copilot/hooks/post-tool-use.sh",
  "dist/templates/copilot/hooks/agent-stop.sh",
  "dist/templates/copilot/agents/codewiki-verifier.agent.md",
  "dist/templates/copilot/agents/codewiki-wiki-updater.agent.md",
  "dist/templates/copilot/instructions.md",
  "dist/templates/opencode/plugins/codewiki.ts",
  "dist/templates/opencode/agents/codewiki-verifier.md",
  "dist/templates/opencode/agents/codewiki-wiki-updater.md",
  "dist/templates/opencode/instructions.md"
] as const;

const FORBIDDEN_PACKAGE_PATTERNS = [
  /^dist\/test\//,
  /\/__tests__\//,
  /^dist\/templates\/adapter-templates\.(?:d\.ts|js|js\.map|ts)$/,
  /^dist\/templates\/(?:page-templates|scaffold)\.(?:js\.map|ts)$/,
  /\.js\.map$/
] as const;

type PackFile = {
  path: string;
};

type PackPackage = {
  files: PackFile[];
};

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

  const packOutput = JSON.parse(packDetails.stdout) as PackPackage[];
  const files = new Set(packOutput[0]?.files.map((file) => file.path) ?? []);

  for (const requiredPath of REQUIRED_TEMPLATE_FILES) {
    assert.equal(files.has(requiredPath), true, `tarball must include ${requiredPath}`);
  }

  for (const packedPath of files) {
    for (const forbiddenPattern of FORBIDDEN_PACKAGE_PATTERNS) {
      assert.equal(forbiddenPattern.test(packedPath), false, `tarball must not include ${packedPath}`);
    }
  }
});
