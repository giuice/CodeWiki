import type { SupportedTool } from "../../core/types.js";
import type { ToolAdapter } from "./types.js";

const adapterFactories: Partial<Record<SupportedTool, () => Promise<ToolAdapter>>> = {
  "claude-code": async () => {
    const modulePath = "./claude.js";
    const { ClaudeCodeAdapter } = await import(modulePath);
    return new ClaudeCodeAdapter();
  }
};

export async function resolveAdapters(
  tools: SupportedTool[]
): Promise<{ adapters: ToolAdapter[]; unsupported: SupportedTool[] }> {
  const adapters: ToolAdapter[] = [];
  const unsupported: SupportedTool[] = [];

  for (const tool of tools) {
    const factory = adapterFactories[tool];
    if (!factory) {
      unsupported.push(tool);
      continue;
    }

    adapters.push(await factory());
  }

  return { adapters, unsupported };
}

export type { AdapterInstallOptions, ToolAdapter } from "./types.js";