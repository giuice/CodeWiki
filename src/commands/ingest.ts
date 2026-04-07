import path from "node:path";
import { readConfig } from "../core/config.js";
import { ensureInsideRoot, exists, isMarkdownPath, readText, relativePath } from "../core/files.js";
import { PROPOSAL_BOUNDARY, proposalHeader } from "../core/proposals.js";
import { findRelevantPages, readIndexFirst } from "../core/wiki-index.js";
import { sourceSummaryTemplate } from "../templates/page-templates.js";

export async function runIngest(cwd: string, args: string[]): Promise<string> {
  const sourceArg = args[0];
  if (!sourceArg) throw new Error("Usage: codewiki ingest <markdown-path>");
  if (!isMarkdownPath(sourceArg)) throw new Error("codewiki ingest accepts markdown sources only (.md or .markdown).");
  const sourcePath = ensureInsideRoot(cwd, sourceArg);
  if (!(await exists(sourcePath))) throw new Error(`Source file not found: ${sourceArg}`);
  const config = await readConfig(cwd);
  const sourceRelative = relativePath(cwd, sourcePath);
  const source = await readText(sourcePath);
  const index = await readIndexFirst(cwd, config.wiki.path);
  const related = await findRelevantPages(cwd, config.wiki.path, `${sourceRelative}\n${source}`);
  const rawRoot = path.relative(cwd, ensureInsideRoot(cwd, config.wiki.raw_path)).split(path.sep).join("/");

  return `${proposalHeader(`Ingest Proposal: ${sourceRelative}`)}\n## Source validation\n- Markdown source: \`${sourceRelative}\`\n- Configured raw path: \`${rawRoot || config.wiki.raw_path}\`\n- Read \`wiki/index.md\` first: ${index ? "yes" : "missing index; related-page matching used existing wiki files only"}\n\n## Proposed source-summary page\n\n${sourceSummaryTemplate(sourceRelative)}\n\n## Candidate related updates\n${related.length > 0 ? related.map((page) => `- \`${page.path}\` — ${page.excerpt}`).join("\n") : "- No deterministic related pages found."}\n\n## Agent prompt\nSummarize \`${sourceRelative}\`, discuss takeaways with the human if configured, then propose source-summary and related wiki page edits. ${PROPOSAL_BOUNDARY}.\n`;
}
