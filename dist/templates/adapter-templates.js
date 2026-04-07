const commonLoop = `# CodeWiki Adapter Instructions

Human approval boundary: wiki page updates are proposal-only until a human approves them.

Pre-hook behavior is file-modification-only: before editing files, read relevant CodeWiki context with \`codewiki query\` and include references in the work plan.

Post-hook behavior: summarize changed files, tests, verification evidence, and proposed wiki updates. Do not mutate \`wiki/\` without approval.

Explicit query behavior: \`codewiki query\` is read-only and should read \`wiki/index.md\` first before matched pages.
`;
const instructionOnly = `
This adapter is instruction-only in v1. It does not install real tool hooks unless a future adapter ADR adds supported hook wiring for this tool.
`;
export function adapterReadme(tool) {
    const title = tool === "claude-code" ? "Claude Code" : tool === "opencode" ? "OpenCode" : tool === "copilot" ? "Copilot" : "Codex";
    if (tool === "claude-code") {
        return `# ${title} CodeWiki Adapter

${commonLoop}
Claude Code may support hook wiring in environments that opt in, but this scaffold keeps updates human-approved and proposal-only by default.
`;
    }
    return `# ${title} CodeWiki Adapter

${commonLoop}${instructionOnly}`;
}
//# sourceMappingURL=adapter-templates.js.map