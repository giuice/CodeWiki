import { readConfig } from "../core/config.js";
import { PROPOSAL_BOUNDARY } from "../core/proposals.js";
import { findRelevantPages, readIndexFirst, readWikiPages } from "../core/wiki-index.js";
export async function runQuery(cwd, args) {
    const question = args.join(" ").trim();
    if (!question)
        throw new Error("Usage: codewiki query <question>");
    const config = await readConfig(cwd);
    const index = await readIndexFirst(cwd, config.wiki.path);
    const matches = await findRelevantPages(cwd, config.wiki.path, question);
    const pages = await readWikiPages(cwd, matches);
    const contexts = pages.map((page) => `## ${page.path}\nScore: ${page.score}\n\n${page.content}`).join("\n\n---\n\n");
    return `# CodeWiki Query Context\n\nQuestion: ${question}\nRead order:\n1. \`${config.wiki.path.replace(/\/$/, "")}/index.md\`${index ? "" : " (missing)"}\n${pages.map((page, indexOffset) => `${indexOffset + 2}. \`${page.path}\``).join("\n")}\n\n${pages.length === 0 ? "No deterministic wiki pages matched this query. Do not hallucinate wiki context; answer from other evidence or ask the human to add approved wiki knowledge.\n" : `Matched page references:\n${pages.map((page) => `- \`${page.path}\` — ${page.excerpt}`).join("\n")}\n\n${contexts}\n`}\n## Synthesis prompt\nAnswer using only the matched wiki references above plus explicitly cited project evidence. If the answer should become durable knowledge, propose a wiki update for human approval. ${PROPOSAL_BOUNDARY}.\n`;
}
//# sourceMappingURL=query.js.map