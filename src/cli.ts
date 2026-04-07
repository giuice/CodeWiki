import { initCommand } from "./commands/init.js";
import { ingestCommand } from "./commands/ingest.js";
import { queryCommand } from "./commands/query.js";
import { lintCommand } from "./commands/lint.js";
import { prdCommand } from "./commands/prd.js";
import { tasksCommand } from "./commands/tasks.js";
import { statusCommand } from "./commands/status.js";

type CommandHandler = (args: string[], root?: string) => Promise<string>;

const COMMANDS: Record<string, CommandHandler> = {
  init: (args, root) => initCommand({ args, root }),
  ingest: ingestCommand,
  query: queryCommand,
  lint: lintCommand,
  prd: prdCommand,
  tasks: tasksCommand,
  status: statusCommand
};

export function helpText(): string {
  return `CodeWiki — markdown-first, human-approved project wiki framework

Usage:
  codewiki <command> [args]

Commands:
  init     Create .codewiki/, raw/, and wiki/ scaffold
  ingest   Emit a source-summary proposal for a markdown raw source
  query    Read wiki/index.md first and emit a referenced context bundle
  lint     Run deterministic checks and agent-review prompts
  prd      Create a human-review-needed raw PRD draft
  tasks    Create a human-review-needed task draft from a PRD
  status   Report wiki stats and drift warning counts

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
      console.log("0.1.0");
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
