import path from "node:path";
import { loadConfig } from "../core/config.js";
import { ensureWithinRoot, listFilesRecursive, pathExists, readTextIfExists, readTextRequired } from "../core/files.js";
import { firstHeading, frontmatterString, parseMarkdownWithFrontmatter, wikilinks } from "../core/frontmatter.js";
import { sha256File } from "../core/hash.js";
import { PROPOSAL_ONLY_BOUNDARY } from "../core/proposals.js";
function normalizeLink(link) {
    return link.split("|")[0]?.split("#")[0]?.trim() ?? link.trim();
}
async function requiredPathFindings(root, config) {
    const required = [
        ".codewiki/config.yml",
        ".codewiki/templates/entity.md",
        ".codewiki/templates/decision.md",
        ".codewiki/templates/lesson.md",
        ".codewiki/templates/issue.md",
        ".codewiki/templates/source-summary.md",
        config.wiki.rawPath,
        config.wiki.path,
        path.posix.join(config.wiki.path, "index.md"),
        path.posix.join(config.wiki.path, "log.md"),
        path.posix.join(config.wiki.path, "entities"),
        path.posix.join(config.wiki.path, "decisions"),
        path.posix.join(config.wiki.path, "lessons"),
        path.posix.join(config.wiki.path, "issues"),
        path.posix.join(config.wiki.path, "sources")
    ];
    const findings = [];
    for (const rel of required) {
        if (!(await pathExists(ensureWithinRoot(root, rel)))) {
            findings.push({ severity: "error", category: "missing-required", path: rel, message: `Required CodeWiki path is missing: ${rel}` });
        }
    }
    return findings;
}
function linkTargetSet(pagePath, markdown) {
    const parsed = parseMarkdownWithFrontmatter(markdown);
    const base = path.posix.basename(pagePath, ".md");
    const withoutWiki = pagePath.replace(/^wiki\//, "").replace(/\.md$/, "");
    const heading = firstHeading(parsed.body);
    const targets = [base, withoutWiki, pagePath, pagePath.replace(/\.md$/, "")];
    const id = frontmatterString(parsed.frontmatter.id);
    const name = frontmatterString(parsed.frontmatter.name);
    if (id)
        targets.push(id);
    if (name)
        targets.push(name);
    if (heading)
        targets.push(heading);
    return targets;
}
export async function collectLintFindings(root = process.cwd()) {
    const config = await loadConfig(root);
    const findings = await requiredPathFindings(root, config);
    const pagePaths = await listFilesRecursive(root, config.wiki.path, ".md");
    const pageTexts = new Map();
    const knownTargets = new Set();
    for (const page of pagePaths) {
        const markdown = await readTextRequired(root, page);
        pageTexts.set(page, markdown);
        for (const target of linkTargetSet(page, markdown))
            knownTargets.add(target);
    }
    const inbound = new Map();
    for (const page of pagePaths)
        inbound.set(page, 0);
    for (const [page, markdown] of pageTexts) {
        for (const rawLink of wikilinks(markdown)) {
            const link = normalizeLink(rawLink);
            if (!knownTargets.has(link)) {
                findings.push({ severity: "warning", category: "broken-link", path: page, message: `Broken wikilink [[${rawLink}]] does not match a known page id, name, heading, or path.` });
                continue;
            }
            for (const [candidate, text] of pageTexts) {
                if (linkTargetSet(candidate, text).includes(link)) {
                    inbound.set(candidate, (inbound.get(candidate) ?? 0) + 1);
                }
            }
        }
    }
    const indexText = (await readTextIfExists(root, path.posix.join(config.wiki.path, "index.md"))) ?? "";
    for (const [page, markdown] of pageTexts) {
        const parsed = parseMarkdownWithFrontmatter(markdown);
        const type = frontmatterString(parsed.frontmatter.type);
        if (page.endsWith("index.md") || page.endsWith("log.md"))
            continue;
        if (!type) {
            findings.push({ severity: "info", category: "missing-required", path: page, message: "Wiki page has no parseable frontmatter type." });
        }
        if ((inbound.get(page) ?? 0) === 0 && !indexText.includes(page) && !indexText.includes(path.posix.basename(page, ".md"))) {
            findings.push({ severity: "info", category: "orphan", path: page, message: "Orphan candidate: no inbound wikilinks and not listed in wiki/index.md." });
        }
        if (type === "issue") {
            const status = frontmatterString(parsed.frontmatter.status);
            const resolvedBy = frontmatterString(parsed.frontmatter.resolved_by);
            if (status === "resolved" && !resolvedBy) {
                findings.push({ severity: "warning", category: "issue-lifecycle", path: page, message: "Resolved issue is missing resolved_by: LESSON-XXX." });
            }
            else if (status === "resolved" && resolvedBy && !knownTargets.has(resolvedBy)) {
                findings.push({ severity: "warning", category: "issue-lifecycle", path: page, message: `Resolved issue points to unknown lesson: ${resolvedBy}.` });
            }
        }
        if (type === "entity" && config.lint.checkFileDrift) {
            const hashes = parsed.frontmatter.file_hashes;
            if (hashes && typeof hashes === "object" && !Array.isArray(hashes)) {
                for (const [file, storedHash] of Object.entries(hashes)) {
                    const absolute = ensureWithinRoot(root, file);
                    if (!(await pathExists(absolute))) {
                        findings.push({ severity: "warning", category: "file-drift", path: page, message: `Entity references missing file for drift tracking: ${file}.` });
                        continue;
                    }
                    const current = await sha256File(absolute);
                    if (storedHash && current !== storedHash) {
                        findings.push({ severity: "warning", category: "file-drift", path: page, message: `Entity file hash drift for ${file}: expected ${storedHash}, actual ${current}.` });
                    }
                }
            }
        }
    }
    findings.push({
        severity: "info",
        category: "agent-review",
        path: config.wiki.path,
        message: "Semantic contradiction and stale-claim review require an agent/human checklist in v1; deterministic lint did not auto-fix or claim semantic proof."
    });
    return findings;
}
export async function lintCommand(root = process.cwd()) {
    const findings = await collectLintFindings(root);
    const lines = findings.map((finding) => `${finding.severity.toUpperCase()} [${finding.category}] ${finding.path}: ${finding.message}`);
    const errorCount = findings.filter((finding) => finding.severity === "error").length;
    const warningCount = findings.filter((finding) => finding.severity === "warning").length;
    return `${PROPOSAL_ONLY_BOUNDARY}

# CodeWiki Lint Report

Errors: ${errorCount}
Warnings: ${warningCount}
Findings: ${findings.length}

${lines.join("\n") || "No deterministic findings."}

## Agent Review Checklist
- Review contradictions between pages.
- Review stale claims superseded by newer lessons.
- Propose fixes only; require human approval before wiki writes.
`;
}
//# sourceMappingURL=lint.js.map