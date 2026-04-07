import path from "node:path";
import { ensureDir, writeTextFileSafe } from "../core/files.js";
import { SUPPORTED_TOOLS, type SupportedTool } from "../core/types.js";
import { scaffoldDirectories, scaffoldFiles } from "../templates/scaffold.js";

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

export async function initCommand({ root = process.cwd(), args }: InitOptions): Promise<string> {
  let projectName = path.basename(root);
  let tools: SupportedTool[] = [...SUPPORTED_TOOLS];
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
      tools = parseTools(value);
    } else {
      throw new Error(`Unknown init option: ${arg}`);
    }
  }

  for (const directory of scaffoldDirectories(tools)) {
    await ensureDir(root, directory);
  }
  for (const file of scaffoldFiles(projectName, tools)) {
    await writeTextFileSafe(root, file.path, file.content, force);
  }
  return [`Initialized CodeWiki for ${projectName}.`, `Adapters: ${tools.join(", ")}.`, "No tool auto-detection was performed.", "Human approval boundary: wiki updates remain human-approved proposal-only until explicitly reviewed."].join("\n");
}
