import { ensureInsideRoot, exists } from "../core/files.js";
import type { SupportedTool } from "../core/types.js";

interface DetectionRule {
  tool: SupportedTool;
  relativePath: string;
}

const DETECTION_RULES: DetectionRule[] = [
  { tool: "claude-code", relativePath: ".claude" },
  { tool: "codex", relativePath: ".codex" },
  { tool: "opencode", relativePath: "opencode.json" },
  { tool: "copilot", relativePath: ".github/copilot-instructions.md" }
];

export async function detectTools(root: string): Promise<SupportedTool[]> {
  const detected: SupportedTool[] = [];

  for (const rule of DETECTION_RULES) {
    if (await exists(ensureInsideRoot(root, rule.relativePath))) {
      detected.push(rule.tool);
    }
  }

  return detected;
}