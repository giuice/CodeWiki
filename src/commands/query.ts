import { readTextIfExists } from "../core/files.js";
import { loadConfig } from "../core/config.js";
import { PROPOSAL_BOUNDARY } from "../core/proposals.js";
import { matchWikiPages } from "../core/wiki-index.js";

export async function queryCommand(args: string[], root = process.cwd()): Promise<string> {
  const question = args.join(" ").trim();
  if (!question) throw new Error("Usage: codewiki query <question>");
  const config = await loadConfig(root);
  const { matches, readOrder } = await matchWikiPages(root, question, config.wiki.path);
  const pageSections: string[] = [];
  for (const match of matches) {
    const text = (await readTextIfExists(root, match.path)) ?? "";
    pageSections.push(`### ${match.path}\n${text.slice(0, 1200)}`);
  }
  return [
    "# CodeWiki Query Context Bundle",
    "",
    PROPOSAL_BOUNDARY,
    "",
    `Question: ${question}`,
    "",
    `Read order: ${readOrder.join(" -> ")}`,
    "",
    "## Wiki References",
    matches.length > 0 ? matches.map((match) => `- ${match.path} — ${match.title}`).join("\n") : "No matching wiki pages found; do not hallucinate wiki context.",
    "",
    "## Matched Page Context",
    pageSections.length > 0 ? pageSections.join("\n\n") : "No matched page content.",
    "",
    "## Synthesis Prompt",
    "Answer only from the referenced CodeWiki pages above, and cite relative wiki paths. Do not create wiki pages automatically."
  ].join("\n");
}
