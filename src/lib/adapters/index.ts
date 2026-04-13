import type { SupportedTool } from "../../core/types.js";
import type { ToolAdapter } from "./types.js";

const SHARED_SKILLS_TOOLS = new Set<SupportedTool>(["codex", "copilot", "opencode"]);

const adapterFactories: Partial<Record<SupportedTool, () => Promise<ToolAdapter>>> = {
  "claude-code": async () => {
    const modulePath = "./claude.js";
    const { ClaudeCodeAdapter } = await import(modulePath);
    return new ClaudeCodeAdapter();
  },
  opencode: async () => {
    const modulePath = "./opencode.js";
    const { OpenCodeAdapter } = await import(modulePath);
    return new OpenCodeAdapter();
  }
};

async function createSharedSkillsAdapter(): Promise<ToolAdapter> {
  const modulePath = "./shared-skills.js";
  const { SharedSkillsAdapter } = await import(modulePath);
  return new SharedSkillsAdapter();
}

export async function resolveAdapters(
  tools: SupportedTool[]
): Promise<{ adapters: ToolAdapter[]; unsupported: SupportedTool[] }> {
  const adapters: ToolAdapter[] = [];
  const unsupported: SupportedTool[] = [];
  let sharedSkillsAdded = false;

  for (const tool of tools) {
    if (SHARED_SKILLS_TOOLS.has(tool) && !sharedSkillsAdded) {
      adapters.push(await createSharedSkillsAdapter());
      sharedSkillsAdded = true;
    }

    const factory = adapterFactories[tool];
    if (factory) {
      adapters.push(await factory());
      continue;
    }

    if (!SHARED_SKILLS_TOOLS.has(tool)) {
      unsupported.push(tool);
    }
  }

  return { adapters, unsupported };
}

export type { AdapterInstallOptions, ToolAdapter } from "./types.js";
