import path from "node:path";
import { loadConfig } from "../core/config.js";
import { listFilesRecursive, readTextIfExists, readTextRequired } from "../core/files.js";
import { frontmatterString, parseMarkdownWithFrontmatter } from "../core/frontmatter.js";
import { collectLintFindings } from "./lint.js";
export async function statusCommand(root = process.cwd()) {
    const config = await loadConfig(root);
    const pages = await listFilesRecursive(root, config.wiki.path, ".md");
    const issuePages = pages.filter((page) => page.includes("/issues/"));
    let openIssues = 0;
    let resolvedIssues = 0;
    for (const page of issuePages) {
        const parsed = parseMarkdownWithFrontmatter(await readTextRequired(root, page));
        const status = frontmatterString(parsed.frontmatter.status);
        if (status === "resolved")
            resolvedIssues += 1;
        else
            openIssues += 1;
    }
    const logPath = path.posix.join(config.wiki.path, "log.md");
    const log = (await readTextIfExists(root, logPath)) ?? "";
    const lastLogHeading = Array.from(log.matchAll(/^##\s+(.+)$/gm)).at(-1)?.[1] ?? "No log entries";
    const lintFindings = await collectLintFindings(root);
    const driftWarnings = lintFindings.filter((finding) => finding.category === "file-drift").length;
    return `# CodeWiki Status

Project: ${config.project.name}
Wiki path: ${config.wiki.path}
Raw path: ${config.wiki.rawPath}
Pages: ${pages.length}
Entities: ${pages.filter((page) => page.includes("/entities/")).length}
Decisions: ${pages.filter((page) => page.includes("/decisions/")).length}
Lessons: ${pages.filter((page) => page.includes("/lessons/")).length}
Issues open: ${openIssues}
Issues resolved: ${resolvedIssues}
Sources: ${pages.filter((page) => page.includes("/sources/")).length}
Last log entry: ${lastLogHeading}
Drift warning count: ${driftWarnings}
Lint warning/error count: ${lintFindings.filter((finding) => finding.severity !== "info").length}

No database, server, web UI, vector index, or non-markdown ingestion is required for this status report.
`;
}
//# sourceMappingURL=status.js.map