import { loadConfig } from "../core/config.js";
import { firstHeading, frontmatterString, parseMarkdownWithFrontmatter } from "../core/frontmatter.js";
import { listFilesRecursive, readTextIfExists } from "../core/files.js";
import { collectLintFindings } from "./lint.js";
export async function statusCommand(_args, root = process.cwd()) {
    const config = await loadConfig(root);
    const pages = await listFilesRecursive(root, config.wiki.path, ".md");
    let openIssues = 0;
    let resolvedIssues = 0;
    for (const page of pages) {
        const parsed = parseMarkdownWithFrontmatter((await readTextIfExists(root, page)) ?? "");
        if (frontmatterString(parsed.frontmatter.type) === "issue") {
            if (frontmatterString(parsed.frontmatter.status) === "resolved")
                resolvedIssues += 1;
            else
                openIssues += 1;
        }
    }
    const logText = (await readTextIfExists(root, `${config.wiki.path.replace(/\/$/, "")}/log.md`)) ?? "";
    const latestLog = firstHeading(logText) ?? "No log heading found";
    const driftWarnings = (await collectLintFindings(root)).filter((finding) => finding.category === "file-drift").length;
    return [
        "# CodeWiki Status",
        `Project: ${config.project.name}`,
        `Wiki path: ${config.wiki.path}`,
        `Raw path: ${config.wiki.rawPath}`,
        `Page count: ${pages.length}`,
        `Latest log heading: ${latestLog}`,
        `Open issues: ${openIssues}`,
        `Resolved issues: ${resolvedIssues}`,
        `Drift warning count: ${driftWarnings}`
    ].join("\n");
}
//# sourceMappingURL=status.js.map