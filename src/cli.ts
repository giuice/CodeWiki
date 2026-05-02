import { readFileSync } from "node:fs";

import { initCommand } from "./commands/init.js";

type CommandHandler = (args: string[], root?: string) => Promise<string>;

const COMMANDS: Record<string, CommandHandler> = {
  init: (args, root) => initCommand(root === undefined ? { args } : { args, root }),
};

function packageVersion(): string {
  const packageJsonPath = new URL("../package.json", import.meta.url);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: unknown };
  if (typeof packageJson.version !== "string") {
    throw new Error("Could not read package version from package.json");
  }

  return packageJson.version;
}

export function helpText(): string {
  return `CodeWiki — markdown-first, human-approved project wiki framework

Usage:
  codewiki <command> [args]

Commands:
  init     Create .codewiki/, raw/, and wiki/ scaffold

Global:
  --help   Show this help
  --version Show package version
`;
}

export async function runCli(argv = process.argv.slice(2), root = process.cwd()): Promise<number> {
  const [command, ...args] = argv;
  try {
    if (!command || command === "--help" || command === "-h") {
      console.log(helpText());
      return 0;
    }
    if (command === "--version" || command === "-v") {
      console.log(packageVersion());
      return 0;
    }
    const handler = COMMANDS[command];
    if (!handler) {
      throw new Error(`Unknown command: ${command}. Run codewiki --help for supported commands.`);
    }
    const output = await handler(args, root);
    if (output) console.log(output);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
