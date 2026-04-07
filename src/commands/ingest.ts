import path from "node:path";
import { promises as fs } from "node:fs";
import { ensureWithinRoot, relativeToRoot } from "../core/files.js";
import { loadConfig } from "../core/config.js";
import { findRelevantPages } from "../core/wiki-index.js";
import { PROPOSAL_ONLY_BOUNDARY, slugify } from "../core/proposals.js";

export async function ingestCommand(sourcePath: string, root = process.cwd()): Promise<string> {
  if (!sourcePath) throw new Error("Usage: codewiki ingest <markdown-path>");
  if (!/\.md(?:own)?$/i.test(sourcePath)) {
    throw new Error("CodeWiki v1 ingests markdown files only (.md or .markdown). Non-markdown ingestion is out of scope.");
  }
  const absolute = ensureWithinRoot(root, sourcePath);
  const rel = relativeToRoot(root, absolute);
  const source = await fs.readFile(absolute, "utf8");
  const config = await loadConfig(root);
  const related = await findRelevantPages(root, config, `${rel}\n${source}`, 8);
  const title = slugify(path.basename(rel, path.extname(rel)));
  const candidateLines = related.matches.length
    ? related.matches.map((match) => `- ${match.path} — matched ${match.matchedTerms.join(", ")}`).join("\n")
    : "- No deterministic related wiki pages found from wiki/index.md and page text.";
  return `${PROPOSAL_ONLY_BOUNDARY}

# Source Summary Proposal: ${title}

## Source
- ${rel}

## Read Order
1. ${related.readOrder.join("\n2. ")}

## Proposed Wiki Write (not applied)
- wiki/sources/${title}.md — source-summary proposal for human review

## Key Takeaway Draft
Summarize the markdown source below, then ask the human to approve any wiki writes.

## Candidate Related Updates
${candidateLines}

## Agent Prompt
Read the source and candidate pages. Propose a source-summary page and any entity/decision/issue/lesson updates. Do not write wiki files until the human approves.

## Source Excerpt
${source.slice(0, 4000)}
`;
}
