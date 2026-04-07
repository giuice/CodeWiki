export declare const HELP = "CodeWiki \u2014 markdown-first, human-approved project wiki framework\n\nUsage:\n  codewiki <command> [args]\n\nCommands:\n  init [--tool <claude-code,codex,copilot,opencode>] [--name <project-name>] [--force]\n  ingest <markdown-path>\n  query <question>\n  lint\n  prd <description>\n  tasks <prd-path>\n  status\n\nHuman approval boundary: proposal-producing commands do not modify wiki files without approval.\n";
export declare function runCli(argv: string[], root?: string): Promise<{
    code: number;
    stdout: string;
    stderr: string;
}>;
