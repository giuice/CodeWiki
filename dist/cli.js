import { initCommand, parseToolList } from "./commands/init.js";
import { ingestCommand } from "./commands/ingest.js";
import { queryCommand } from "./commands/query.js";
import { lintCommand } from "./commands/lint.js";
import { prdCommand } from "./commands/prd.js";
import { tasksCommand } from "./commands/tasks.js";
import { statusCommand } from "./commands/status.js";
export const HELP = `CodeWiki — markdown-first, human-approved project wiki framework

Usage:
  codewiki <command> [args]

Commands:
  init [--tool <claude-code,codex,copilot,opencode>] [--name <project-name>] [--force]
  ingest <markdown-path>
  query <question>
  lint
  prd <description>
  tasks <prd-path>
  status

Human approval boundary: proposal-producing commands do not modify wiki files without approval.
`;
function parseInitArgs(args) {
    const options = {};
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--force") {
            options.force = true;
        }
        else if (arg === "--tool") {
            const value = args[index + 1];
            if (!value)
                throw new Error("--tool requires a comma-separated value");
            options.tools = parseToolList(value);
            index += 1;
        }
        else if (arg?.startsWith("--tool=")) {
            options.tools = parseToolList(arg.slice("--tool=".length));
        }
        else if (arg === "--name") {
            const value = args[index + 1];
            if (!value)
                throw new Error("--name requires a value");
            options.name = value;
            index += 1;
        }
        else if (arg?.startsWith("--name=")) {
            options.name = arg.slice("--name=".length);
        }
        else {
            throw new Error(`Unknown init option: ${arg}`);
        }
    }
    return options;
}
export async function runCli(argv, root = process.cwd()) {
    const [command, ...args] = argv;
    try {
        if (!command || command === "--help" || command === "-h") {
            return { code: 0, stdout: HELP, stderr: "" };
        }
        switch (command) {
            case "init":
                return { code: 0, stdout: await initCommand({ ...parseInitArgs(args), root }), stderr: "" };
            case "ingest":
                return { code: 0, stdout: await ingestCommand(args[0] ?? "", root), stderr: "" };
            case "query":
                return { code: 0, stdout: await queryCommand(args.join(" "), root), stderr: "" };
            case "lint":
                return { code: 0, stdout: await lintCommand(root), stderr: "" };
            case "prd":
                return { code: 0, stdout: await prdCommand(args.join(" "), root), stderr: "" };
            case "tasks":
                return { code: 0, stdout: await tasksCommand(args[0] ?? "", root), stderr: "" };
            case "status":
                return { code: 0, stdout: await statusCommand(root), stderr: "" };
            default:
                return { code: 1, stdout: "", stderr: `Unknown command: ${command}\n\n${HELP}` };
        }
    }
    catch (error) {
        return { code: 1, stdout: "", stderr: error instanceof Error ? error.message : String(error) };
    }
}
//# sourceMappingURL=cli.js.map