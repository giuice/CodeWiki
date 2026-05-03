import { stat } from "node:fs/promises";

import { ensureInsideRoot } from "../core/files.js";
import type { SupportedTool } from "../core/types.js";

interface DetectionRule {
  tool: SupportedTool;
  relativePath: string;
  kind: "directory" | "file";
}

const DETECTION_RULES: DetectionRule[] = [
  { tool: "claude-code", relativePath: ".claude", kind: "directory" },
  { tool: "codex", relativePath: ".codex", kind: "directory" },
  { tool: "opencode", relativePath: "opencode.json", kind: "file" },
  { tool: "copilot", relativePath: ".github/copilot-instructions.md", kind: "file" }
];

async function matchesRule(root: string, rule: DetectionRule): Promise<boolean> {
  try {
    const entry = await stat(ensureInsideRoot(root, rule.relativePath));
    return rule.kind === "directory" ? entry.isDirectory() : entry.isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function detectTools(root: string): Promise<SupportedTool[]> {
  const detected: SupportedTool[] = [];

  for (const rule of DETECTION_RULES) {
    if (await matchesRule(root, rule)) {
      detected.push(rule.tool);
    }
  }

  return detected;
}
