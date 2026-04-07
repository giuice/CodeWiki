import { initCommand } from "./commands/init.js";
import { ingestCommand } from "./commands/ingest.js";
import { queryCommand } from "./commands/query.js";
import { lintCommand } from "./commands/lint.js";
import { prdCommand } from "./commands/prd.js";
import { tasksCommand } from "./commands/tasks.js";
import { statusCommand } from "./commands/status.js";

export interface CliIO {
  cwd: string;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
  now?: Date;
}

type CommandHandler = (args: string[], root: string, now?: Date) => Promise<string>;

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

function runtimeFor(context?: string | Partial<CliIO>): CliIO {
  if (typeof context === "string") {
    return {
      cwd: context,
      stdout: (message) => { console.log(message); },
      stderr: (message) => { console.error(message); },
    };
  }
  return {
    cwd: context?.cwd ?? process.cwd(),
    stdout: context?.stdout ?? ((message) => { console.log(message); }),
    stderr: context?.stderr ?? ((message) => { console.error(message); }),
    ...(context?.now ? { now: context.now } : {}),
  };
}

export async function runCli(argv = process.argv.slice(2), context?: string | Partial<CliIO>): Promise<number> {
  const runtime = runtimeFor(context);
  const [command, ...args] = argv;
  try {
    if (!command || command === "--help" || command === "-h") {
      runtime.stdout(helpText());
      return 0;
    }
    if (command === "--version" || command === "-v") {
      runtime.stdout("0.1.0");
      return 0;
    }
    const handler = COMMANDS[command];
    if (!handler) {
      throw new Error(`Unknown command: ${command}. Run codewiki --help for supported commands.`);
    }
    const output = await handler(args, runtime.cwd, runtime.now);
    if (output) runtime.stdout(output.endsWith("\n") ? output : `${output}\n`);
    return 0;
  } catch (error) {
    runtime.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
