import { loadConfig } from "../core/config.js";
import { findRelevantPages } from "../core/wiki-index.js";
import { readTextRequired } from "../core/files.js";
import { PROPOSAL_ONLY_BOUNDARY } from "../core/proposals.js";
export async function queryCommand(question, root = process.cwd()) {
    if (!question)
        throw new Error("Usage: codewiki query <question>");
    const config = await loadConfig(root);
    const related = await findRelevantPages(root, config, question, 6);
    const refs = [];
    for (const match of related.matches) {
        const markdown = await readTextRequired(root, match.path);
        refs.push(`## ${match.path}\nMatched terms: ${match.matchedTerms.join(", ")}\n${markdown.slice(0, 2400)}`);
    }
    const noMatch = related.matches.length === 0 ? "\nNo matching wiki pages found. Do not hallucinate wiki context; answer from available evidence or ask the human for more sources.\n" : "";
    return `${PROPOSAL_ONLY_BOUNDARY}

# CodeWiki Query Context Bundle

Question: ${question}

## Read Order
1. ${related.readOrder.join("\n2. ")}

## Matched Page References
${related.matches.map((match) => `- ${match.path} — ${match.title}`).join("\n") || "- None"}
${noMatch}
## Context
${refs.join("\n\n") || "No wiki page context selected."}

## Synthesis Prompt
Answer using the referenced wiki pages above. Cite relative wiki paths. Do not create or update wiki pages unless the human explicitly approves a later write.
`;
}
//# sourceMappingURL=query.js.map