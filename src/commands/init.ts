import path from "node:path";
import { createInterface } from "node:readline/promises";
import pc from "picocolors";

import { SUPPORTED_TOOLS, type SupportedTool } from "../core/types.js";
import { resolveAdapters } from "../lib/adapters/index.js";
import { detectTools } from "../lib/detect.js";
import { formatBrandBanner, formatSectionedReport, type ReportSection } from "../lib/reporter.js";
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
  if (requested.some((tool) => tool.toLowerCase() === "all")) {
    return [...SUPPORTED_TOOLS];
  }
  const unknown = requested.filter((tool) => !SUPPORTED_TOOLS.includes(tool as SupportedTool));
  if (unknown.length > 0) {
    throw new Error(`Unsupported tool value: ${unknown.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}, all`);
  }
  return [...new Set(requested)] as SupportedTool[];
}

function parsePromptToolSelection(answer: string): SupportedTool[] {
  const normalized = answer.trim().toLowerCase();
  if (normalized === "a" || normalized === "all") {
    return [...SUPPORTED_TOOLS];
  }

  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`Invalid tool selection. Use --tool to specify: codewiki init --tool ${SUPPORTED_TOOLS.join(",")}`);
  }

  const selected: SupportedTool[] = [];
  for (const part of parts) {
    const selectedByNumber = Number.parseInt(part, 10);
    const byNumber = Number.isInteger(selectedByNumber) && String(selectedByNumber) === part
      ? SUPPORTED_TOOLS[selectedByNumber - 1]
      : undefined;
    const byName = SUPPORTED_TOOLS.includes(part as SupportedTool) ? part as SupportedTool : undefined;
    const tool = byNumber ?? byName;

    if (!tool) {
      throw new Error(`Invalid tool selection. Use --tool to specify: codewiki init --tool ${SUPPORTED_TOOLS.join(",")}`);
    }

    selected.push(tool);
  }

  return [...new Set(selected)];
}

async function promptForTool(): Promise<SupportedTool[]> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const choices = SUPPORTED_TOOLS.map((tool, index) => `  ${pc.cyan(`${index + 1})`)} ${tool}`).join("\n");
    const answer = await readline.question(
      `${formatBrandBanner()}\n\n${pc.yellow("No AI tools detected.")} Install ${pc.bold("CodeWiki")} for:\n${choices}\n  ${pc.cyan("A)")} all\n\nEnter numbers, names, or A for all: `
    );

    return parsePromptToolSelection(answer);
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
