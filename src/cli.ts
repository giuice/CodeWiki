import { runInit } from "./commands/init.js";
import { runIngest } from "./commands/ingest.js";
import { runLint } from "./commands/lint.js";
import { runPrd } from "./commands/prd.js";
import { runQuery } from "./commands/query.js";
import { runStatus } from "./commands/status.js";
import { runTasks } from "./commands/tasks.js";

export interface CliIO {
  cwd: string;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
  now?: Date;
}

const COMMANDS = ["init", "ingest", "query", "lint", "prd", "tasks", "status"];

export function helpText(): string {
  return `CodeWiki — markdown-first human-approved project wiki CLI\n\nUsage:\n  codewiki <command> [args]\n\nCommands:\n  init      Scaffold .codewiki/, raw/, and wiki/\n  ingest    Create a proposal-only source-summary bundle for a markdown source\n  query     Read wiki/index.md first and emit referenced context\n  lint      Run deterministic wiki health checks plus agent-review checklist\n  prd       Create a human-review-needed PRD draft in raw/\n  tasks     Create a human-review-needed task artifact from a PRD\n  status    Show wiki health and drift summary\n\nWiki writes require human approval. Proposal-producing commands do not mutate wiki pages automatically.\n`;
}

export async function runCli(argv = process.argv.slice(2), io?: Partial<CliIO>): Promise<number> {
  const runtime: CliIO = {
    cwd: io?.cwd ?? process.cwd(),
    stdout: io?.stdout ?? ((message) => process.stdout.write(message)),
    stderr: io?.stderr ?? ((message) => process.stderr.write(message)),
    ...(io?.now ? { now: io.now } : {}),
  };

  const [command, ...args] = argv;
  if (!command || command === "--help" || command === "-h") {
    runtime.stdout(helpText());
    return 0;
  }
  if (command === "help") {
    runtime.stdout(helpText());
    return 0;
  }
  if (!COMMANDS.includes(command)) {
    runtime.stderr(`Unknown command: ${command}\n\n${helpText()}`);
    return 1;
  }

  try {
    const output = await dispatch(command, args, runtime);
    runtime.stdout(output.endsWith("\n") ? output : `${output}\n`);
    return 0;
  } catch (error) {
    runtime.stderr(`${(error as Error).message}\n`);
    return 1;
  }
}

async function dispatch(command: string, args: string[], io: CliIO): Promise<string> {
  switch (command) {
    case "init":
      return runInit({ cwd: io.cwd, args });
    case "ingest":
      return runIngest(io.cwd, args);
    case "query":
      return runQuery(io.cwd, args);
    case "lint":
      return runLint(io.cwd);
    case "prd":
      return runPrd(io.cwd, args, io.now);
    case "tasks":
      return runTasks(io.cwd, args, io.now);
    case "status":
      return runStatus(io.cwd);
    default:
      return helpText();
  }
}
