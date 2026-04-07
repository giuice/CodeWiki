import path from "node:path";
import { firstHeading, parseMarkdownWithFrontmatter, frontmatterString } from "./frontmatter.js";
import { listFilesRecursive, readTextIfExists } from "./files.js";
export function tokenize(value) {
    return Array.from(new Set(value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? []));
}
function scorePage(queryTerms, text) {
    const haystack = text.toLowerCase();
    const matchedTerms = queryTerms.filter((term) => haystack.includes(term));
    return { score: matchedTerms.length, matchedTerms };
}
function extractReferencedPages(indexText) {
    const pages = new Set();
    for (const match of indexText.matchAll(/\((wiki\/[^)]+\.md)\)|\[\[([^\]]+)\]\]/g)) {
        const markdownLink = match[1];
        const wikiLink = match[2];
        if (markdownLink)
            pages.add(markdownLink);
        if (wikiLink)
            pages.add(wikiLink.endsWith(".md") ? wikiLink : `wiki/${wikiLink}.md`);
    }
    return pages;
}
export async function readIndexFirst(root, wikiPath = "wiki/") {
    const indexRel = path.posix.join(wikiPath.replace(/\/$/, ""), "index.md");
    const indexText = (await readTextIfExists(root, indexRel)) ?? "";
    return { indexText, readOrder: [indexRel] };
}
export async function matchWikiPages(root, question, wikiPath = "wiki/", limit = 5) {
    const queryTerms = tokenize(question);
    const { indexText, readOrder } = await readIndexFirst(root, wikiPath);
    const allPages = await listFilesRecursive(root, wikiPath, ".md");
    const referenced = extractReferencedPages(indexText);
    const scored = [];
    for (const page of allPages) {
        if (page.endsWith("index.md") || page.endsWith("log.md"))
            continue;
        const pageText = (await readTextIfExists(root, page)) ?? "";
        readOrder.push(page);
        const parsed = parseMarkdownWithFrontmatter(pageText);
        const title = firstHeading(parsed.body) ?? path.basename(page, ".md");
        const id = frontmatterString(parsed.frontmatter.id);
        const summary = pageText.split(/\r?\n/).slice(0, 12).join(" ");
        const indexedBonus = referenced.has(page) ? 1 : 0;
        const { score, matchedTerms } = scorePage(queryTerms, `${page}\n${title}\n${id ?? ""}\n${summary}`);
        if (score > 0 || indexedBonus > 0) {
            scored.push({ path: page, title, score: score + indexedBonus, matchedTerms, summary: summary.slice(0, 240) });
        }
    }
    scored.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
    return { matches: scored.slice(0, limit), readOrder };
}
//# sourceMappingURL=wiki-index.js.map