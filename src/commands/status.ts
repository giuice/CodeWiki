import path from "node:path";
import { readConfig } from "../core/config.js";
import { ensureInsideRoot, exists, listMarkdownFiles, readText } from "../core/files.js";
import { parseFrontmatter } from "../core/frontmatter.js";
import { collectLintFindings } from "./lint.js";

export async function runStatus(cwd: string): Promise<string> {
  const config = await readConfig(cwd);
  const pages = await listMarkdownFiles(cwd, config.wiki.path);
  const logPath = path.join(cwd, config.wiki.path, "log.md");
  const log = (await exists(logPath)) ? await readText(logPath) : "";
  const headings = log.split(/\r?\n/).filter((line) => line.startsWith("## "));
  let openIssues = 0;
  let resolvedIssues = 0;
  for (const page of pages.filter((candidate) => candidate.includes("/issues/"))) {
    const { data } = parseFrontmatter(await readText(ensureInsideRoot(cwd, page)));
    if (data.status === "resolved") resolvedIssues += 1;
    else openIssues += 1;
  }
  const findings = await collectLintFindings(cwd);
  const driftWarnings = findings.filter((finding) => finding.category === "file-drift").length;
  return `# CodeWiki Status\n\nProject: ${config.project.name}\nWiki path: ${config.wiki.path}\nRaw path: ${config.wiki.raw_path}\nPage count: ${pages.length}\nOpen issues: ${openIssues}\nResolved issues: ${resolvedIssues}\nLatest log entry: ${headings.at(-1) ?? "none"}\nDrift warning count: ${driftWarnings}\nHuman approval required: ${config.verification.require_human_approval}\n`;
}
