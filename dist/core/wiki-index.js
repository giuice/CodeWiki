import path from "node:path";
import { firstHeading, parseMarkdownWithFrontmatter, frontmatterString } from "./frontmatter.js";
import { listFilesRecursive, readTextIfExists, readTextRequired } from "./files.js";
export function termsFromText(text) {
    const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "what", "how", "why", "about", "wiki", "codewiki"]);
    const terms = text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [];
    return Array.from(new Set(terms.filter((term) => !stop.has(term))));
}
function summarize(markdown) {
    const line = markdown.split(/\r?\n/).find((candidate) => candidate.trim() && !candidate.startsWith("---") && !candidate.startsWith("#"));
    return line?.trim().slice(0, 180) ?? "No summary available.";
}
export async function findRelevantPages(root, config, query, limit = 5) {
    const indexPath = path.posix.join(config.wiki.path, "index.md");
    const index = (await readTextIfExists(root, indexPath)) ?? "";
    const readOrder = [indexPath];
    const terms = termsFromText(`${query}\n${index}`);
    const pages = (await listFilesRecursive(root, config.wiki.path, ".md")).filter((file) => !file.endsWith("index.md") && !file.endsWith("log.md"));
    const matches = [];
    for (const page of pages) {
        const markdown = await readTextRequired(root, page);
        const parsed = parseMarkdownWithFrontmatter(markdown);
        const title = firstHeading(parsed.body) ?? frontmatterString(parsed.frontmatter.id) ?? frontmatterString(parsed.frontmatter.name) ?? path.basename(page, ".md");
        const haystack = `${page}\n${title}\n${markdown}`.toLowerCase();
        const matchedTerms = terms.filter((term) => haystack.includes(term));
        if (matchedTerms.length > 0) {
            matches.push({ path: page, title, score: matchedTerms.length, matchedTerms, summary: summarize(parsed.body) });
        }
    }
    matches.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
    return { index, matches: matches.slice(0, limit), readOrder };
}
//# sourceMappingURL=wiki-index.js.map