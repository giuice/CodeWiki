import path from "node:path";
import { promises as fs } from "node:fs";
import { ensureWithinRoot, readTextIfExists, snapshotFiles } from "../core/files.js";
import { loadConfig } from "../core/config.js";
import { PROPOSAL_BOUNDARY, renderProposal } from "../core/proposals.js";
import { matchWikiPages } from "../core/wiki-index.js";
import type { ProposalResult } from "../core/types.js";

export async function ingestCommand(args: string[], root = process.cwd()): Promise<string> {
  const input = args[0];
  if (!input) throw new Error("Usage: codewiki ingest <markdown-path>");
  if (!/\.md(?:own)?$/i.test(input)) throw new Error("CodeWiki v1 ingests markdown sources only; markdown files only (.md or .markdown).");
  const absolute = ensureWithinRoot(root, input);
  const sourceText = await fs.readFile(absolute, "utf8");
  const relSource = path.relative(root, absolute).split(path.sep).join("/");
  const config = await loadConfig(root);
  const before = await snapshotFiles(root, config.wiki.path);
  const { matches, readOrder } = await matchWikiPages(root, sourceText, config.wiki.path);
  const after = await snapshotFiles(root, config.wiki.path);
  if (before.size !== after.size || Array.from(before).some(([file, text]) => after.get(file) !== text)) {
    throw new Error("Internal safety violation: ingest attempted to modify wiki files.");
  }
  const result: ProposalResult = {
    kind: "proposal",
    title: `Source Summary Proposal: ${relSource}`,
    boundary: PROPOSAL_BOUNDARY,
    proposedWrites: [{ kind: "proposal", path: `wiki/sources/${path.basename(relSource, path.extname(relSource))}.md`, description: "Human-reviewed source-summary page candidate" }],
    body: [
      "## Source",
      relSource,
      "",
      "## Read Order",
      readOrder.join(" -> "),
      "",
      "## Source Summary Draft",
      sourceText.split(/\r?\n/).slice(0, 20).join("\n"),
      "",
      "## Candidate Related Updates",
      ...(matches.length > 0 ? matches.map((match) => `- ${match.path} (matched: ${match.matchedTerms.join(", ") || "index reference"})`) : ["- No deterministic related pages found."]),
      "",
      "## Approval Checklist",
      "- [ ] Human reviewed this source summary.",
      "- [ ] Human approved any related wiki updates."
    ].join("\n")
  };
  await readTextIfExists(root, path.posix.join(config.wiki.path.replace(/\/$/, ""), "index.md"));
  return renderProposal(result);
}
