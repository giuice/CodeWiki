import { SupportedTool } from "../core/types.js";

const sharedInstructions = `A CodeWiki exists at \`wiki/\`. Before modifying project files, read \`wiki/index.md\`, then relevant entity/issue/lesson pages for the files you intend to change. This pre-hook behavior is file-modification-only; read-only explanation tasks should use \`codewiki query\` explicitly when wiki context would help. After changes, run relevant tests, summarize changed files and wiki context used, then ask the human to approve any proposed wiki updates. Never write wiki updates without explicit human approval.`;

export function adapterFiles(tool: SupportedTool): Record<string, string> {
  switch (tool) {
    case "claude-code":
      return {
        "README.md": `# Claude Code Adapter\n\nThis adapter may be wired into Claude Code hooks. ${sharedInstructions}\n\nCommands: \`/codewiki:ingest\`, \`/codewiki:query\`, \`/codewiki:lint\`.\n`,
        "settings.json": `{"hooks":{"PreToolUse":[{"matcher":"Write|Edit|MultiEdit","hooks":[{"type":"command","command":"codewiki query \"file modification context\""}]}],"PostToolUse":[{"matcher":"Write|Edit|MultiEdit","hooks":[{"type":"command","command":"echo 'Run tests and request human approval before wiki writes.'"}]}]}}\n`,
      };
    case "codex":
      return {
        "AGENTS.fragment.md": `# CodeWiki Instructions for Codex\n\n${sharedInstructions}\n\nCodex adapter status: instruction-only. Use \`codewiki ingest\`, \`codewiki query\`, and \`codewiki lint\`; do not claim automatic hooks exist.\n`,
      };
    case "copilot":
      return {
        "copilot-instructions.fragment.md": `# CodeWiki Instructions for GitHub Copilot\n\n${sharedInstructions}\n\nCopilot adapter status: instruction-only. Suggested commands: \`/codewiki-ingest\`, \`/codewiki-query\`, \`/codewiki-lint\`.\n`,
      };
    case "opencode":
      return {
        "opencode-instructions.md": `# CodeWiki Instructions for OpenCode\n\n${sharedInstructions}\n\nOpenCode adapter status: instruction-only unless your local OpenCode config imports this fragment. Use \`codewiki ingest\`, \`codewiki query\`, and \`codewiki lint\`.\n`,
      };
  }
}
