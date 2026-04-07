const sharedBoundary = `CodeWiki human approval boundary:
- Before modifying project files, read wiki/index.md and relevant wiki pages for related issues and lessons.
- The pre-hook is file-modification-only; read-only explanations should use codewiki query explicitly.
- After changes, run relevant tests, summarize changed files and wiki context used, then ask the human before writing wiki updates.
- Tests passing never auto-approves wiki writes. The agent proposes; the human approves.
`;
export function adapterFiles(tool) {
    switch (tool) {
        case "claude-code":
            return [
                {
                    path: ".codewiki/adapters/claude-code/README.md",
                    content: `# Claude Code Adapter

This adapter documents Claude Code hook wiring for CodeWiki.

${sharedBoundary}

Claude Code may wire real hooks through settings when a project owner copies the generated example. Hooks should fire only on file-write/modification tool events and should prompt for post-change verification before any wiki update.
`
                },
                {
                    path: ".codewiki/adapters/claude-code/settings.example.json",
                    content: `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "codewiki query \"files about to change\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "printf 'Run tests and ask for human approval before CodeWiki updates.\\n'"
          }
        ]
      }
    ]
  }
}
`
                }
            ];
        case "codex":
            return [
                {
                    path: ".codewiki/adapters/codex/AGENTS.fragment.md",
                    content: `# CodeWiki Codex Instructions (instruction-only)

Codex integration is instruction-only in v1; no real hook support is generated here.

${sharedBoundary}

For read-only tasks, run \`codewiki query "question"\` only when wiki context would help. For write tasks, inspect \`wiki/index.md\` first, read matched pages, then continue with normal verification.
`
                }
            ];
        case "copilot":
            return [
                {
                    path: ".codewiki/adapters/copilot/copilot-instructions.fragment.md",
                    content: `# CodeWiki Copilot Instructions (instruction-only)

Copilot integration is instruction-only in v1; copy this into .github/copilot-instructions.md if desired.

${sharedBoundary}

Commands: /codewiki-ingest, /codewiki-query, /codewiki-lint map to the local \`codewiki\` CLI.
`
                }
            ];
        case "opencode":
            return [
                {
                    path: ".codewiki/adapters/opencode/opencode-instructions.md",
                    content: `# CodeWiki OpenCode Instructions (instruction-only)

OpenCode integration is instruction-only in v1 unless a future adapter ADR adds real hook wiring.

${sharedBoundary}

Use \`codewiki ingest\`, \`codewiki query\`, and \`codewiki lint\` as explicit markdown-first commands.
`
                }
            ];
    }
}
//# sourceMappingURL=adapter-templates.js.map