import path from "node:path";
import { createInterface } from "node:readline/promises";

import { SUPPORTED_TOOLS, type SupportedTool } from "../core/types.js";
import { resolveAdapters } from "../lib/adapters/index.js";
import { detectTools } from "../lib/detect.js";
import { formatSectionedReport, type ReportEntry, type ReportSection } from "../lib/reporter.js";
import { scaffoldProject } from "../lib/scaffold.js";

export interface InitOptions {
  root?: string;
  args: string[];
}

function readOptionValue(args: string[], index: number, flag: "--name" | "--tool"): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    if (flag === "--name") {
      throw new Error("--name requires a project name");
    }

    throw new Error("--tool requires comma-separated values");
  }

  return value;
}

function parseTools(value: string): SupportedTool[] {
  const requested = value.split(",").map((tool) => tool.trim()).filter(Boolean);
  if (requested.length === 0) {
    throw new Error("--tool requires at least one supported value");
  }
  const unknown = requested.filter((tool) => !SUPPORTED_TOOLS.includes(tool as SupportedTool));
  if (unknown.length > 0) {
    throw new Error(`Unsupported tool value: ${unknown.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}`);
  }
  return [...new Set(requested)] as SupportedTool[];
}

const SHARED_SKILL_ONLY_TOOLS = new Set<SupportedTool>(["codex", "copilot", "opencode"]);

function getPendingIntegrationEntries(tools: SupportedTool[]): ReportEntry[] {
  return tools
    .filter((tool) => SHARED_SKILL_ONLY_TOOLS.has(tool))
    .map((tool) => ({
      action: "skipped" as const,
      path: tool,
      reason: "shared skills installed; hooks and instructions remain pending"
    }));
}

async function promptForTool(): Promise<SupportedTool[]> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = (await readline.question(
      "No AI tools detected. Install for:\n  1) claude-code\n\nEnter number or tool name: "
    )).trim().toLowerCase();

    if (answer === "1" || answer === "claude-code") {
      return ["claude-code"];
    }

    throw new Error("Invalid tool selection. Use --tool to specify: codewiki init --tool claude-code");
  } finally {
    readline.close();
  }
}

export async function initCommand({ root = process.cwd(), args }: InitOptions): Promise<string> {
  let projectName = path.basename(root);
  let requestedTools: SupportedTool[] | undefined;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--force") {
      force = true;
    } else if (arg === "--name") {
      const value = readOptionValue(args, index, "--name");
      index += 1;
      projectName = value;
    } else if (arg === "--tool") {
      const value = readOptionValue(args, index, "--tool");
      index += 1;
      requestedTools = parseTools(value);
    } else {
      throw new Error(`Unknown init option: ${arg}`);
    }
  }

  let tools = requestedTools ?? await detectTools(root);
  if (tools.length === 0) {
    if (!process.stdin.isTTY) {
      throw new Error("No AI tools detected. Use --tool to specify: codewiki init --tool claude-code");
    }

    tools = await promptForTool();
  }

  // Resolve dist/templates/ from import.meta.dirname at runtime.
  const meta = import.meta as ImportMeta & { dirname: string };
  const templateDir = path.resolve(meta.dirname, "..", "templates");

  const scaffoldEntries = await scaffoldProject({ root, projectName, tools, force });
  const { adapters, unsupported } = await resolveAdapters(tools);
  const sections: ReportSection[] = [{ title: "Wiki scaffold", entries: scaffoldEntries }];

  for (const adapter of adapters) {
    const adapterEntries = await adapter.install({ root, projectName, force, templateDir });
    sections.push({ title: `${adapter.tool} adapter`, entries: adapterEntries });
  }

  const hasSharedSkillsAdapter = adapters.some((adapter) => adapter.tool === "shared-skills");
  const pendingIntegrationEntries = hasSharedSkillsAdapter ? getPendingIntegrationEntries(tools) : [];
  if (pendingIntegrationEntries.length > 0) {
    sections.push({
      title: "Tool-specific integrations pending",
      entries: pendingIntegrationEntries
    });
  }

  if (unsupported.length > 0) {
    sections.push({
      title: "Unsupported (not yet implemented)",
      entries: unsupported.map((tool) => ({
        action: "skipped" as const,
        path: tool,
        reason: "adapter not implemented"
      }))
    });
  }

  return formatSectionedReport(projectName, sections);
}
