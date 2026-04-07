import path from "node:path";
import { ensureDir, writeFileSafe } from "../core/files.js";
import { parseTools } from "../core/config.js";
import { SUPPORTED_TOOLS, SupportedTool } from "../core/types.js";
import { scaffoldDirectories, scaffoldFiles } from "../templates/scaffold.js";

export interface InitOptions {
  cwd: string;
  args: string[];
}

function parseInitArgs(args: string[], cwd: string): { force: boolean; name: string; tools: SupportedTool[] } {
  let force = false;
  let name = path.basename(cwd);
  let tools: SupportedTool[] = [...SUPPORTED_TOOLS];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "--force") force = true;
    else if (arg === "--name") {
      const value = args[++index];
      if (!value) throw new Error("Missing value for --name");
      name = value;
    } else if (arg === "--tool") {
      const value = args[++index];
      if (!value) throw new Error("Missing value for --tool");
      tools = parseTools(value);
    } else if (arg.startsWith("--tool=")) {
      tools = parseTools(arg.slice("--tool=".length));
    } else {
      throw new Error(`Unknown init option: ${arg}`);
    }
  }
  return { force, name, tools };
}

export async function runInit({ cwd, args }: InitOptions): Promise<string> {
  const options = parseInitArgs(args, cwd);
  for (const dir of scaffoldDirectories(options.tools)) {
    await ensureDir(cwd, dir);
  }
  const files = scaffoldFiles(options.name, options.tools);
  for (const file of files) {
    await writeFileSafe(cwd, file.path, file.content, options.force);
  }
  return `CodeWiki scaffold created for ${options.name}.\nGenerated adapters: ${options.tools.join(", ")}.\nHuman approval required for all wiki writes. No tool auto-detection was claimed.\n`;
}
