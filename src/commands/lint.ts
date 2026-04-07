import path from "node:path";
import { readConfig } from "../core/config.js";
import { ensureInsideRoot, exists, listMarkdownFiles, readText, relativePath, sha256File } from "../core/files.js";
import { parseFrontmatter } from "../core/frontmatter.js";
import { LintFinding } from "../core/types.js";
import { PROPOSAL_BOUNDARY } from "../core/proposals.js";

const REQUIRED_PATHS = [".codewiki/config.yml", "wiki/index.md", "wiki/log.md", "wiki/entities", "wiki/decisions", "wiki/lessons", "wiki/issues", "wiki/sources", "raw"];

function markdownId(filePath: string, content: string): string[] {
  const { data } = parseFrontmatter(content);
  const id = typeof data.id === "string" ? data.id : undefined;
  const name = path.basename(filePath, path.extname(filePath));
  return [filePath, name, ...(id ? [id] : [])];
}

function wikilinks(content: string): string[] {
  return Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g)).map((match) => match[1]!.trim());
}

export async function collectLintFindings(cwd: string): Promise<LintFinding[]> {
  const findings: LintFinding[] = [];
  for (const required of REQUIRED_PATHS) {
    if (!(await exists(ensureInsideRoot(cwd, required)))) {
      findings.push({ severity: "error", category: "required-file", path: required, message: `Missing required CodeWiki path: ${required}` });
    }
  }

  let wikiPath = "wiki/";
  try {
    const config = await readConfig(cwd);
    wikiPath = config.wiki.path;
  } catch (error) {
    findings.push({ severity: "error", category: "required-file", path: ".codewiki/config.yml", message: (error as Error).message });
  }

  const pages = await listMarkdownFiles(cwd, wikiPath);
  const pageContents = new Map<string, string>();
  const knownIds = new Set<string>();
  for (const page of pages) {
    const content = await readText(ensureInsideRoot(cwd, page));
    pageContents.set(page, content);
    for (const id of markdownId(page, content)) knownIds.add(id);
  }

  const inbound = new Map<string, number>();
  for (const page of pages) inbound.set(page, 0);
  for (const [page, content] of pageContents) {
    for (const link of wikilinks(content)) {
      if (!knownIds.has(link)) {
        findings.push({ severity: "warning", category: "wikilink", path: page, message: `Broken wikilink [[${link}]] in ${page}` });
      }
      for (const candidate of pages) {
        const ids = markdownId(candidate, pageContents.get(candidate) ?? "");
        if (ids.includes(link)) inbound.set(candidate, (inbound.get(candidate) ?? 0) + 1);
      }
    }
  }

  for (const [page, content] of pageContents) {
    const { data } = parseFrontmatter(content);
    if (page.includes("/issues/") || data.type === "issue") {
      if (data.status === "resolved" && (data.resolved_by === undefined || data.resolved_by === null || data.resolved_by === "null" || data.resolved_by === "")) {
        findings.push({ severity: "warning", category: "issue-lifecycle", path: page, message: "Resolved issue is missing resolved_by: LESSON-XXX linkage." });
      }
    }
    if ((page.includes("/entities/") || data.type === "entity") && data.file_hashes && typeof data.file_hashes === "object" && !Array.isArray(data.file_hashes)) {
      for (const [relativeFile, expected] of Object.entries(data.file_hashes as Record<string, string>)) {
        const absolute = ensureInsideRoot(cwd, relativeFile);
        if (!(await exists(absolute))) {
          findings.push({ severity: "warning", category: "file-drift", path: page, message: `Entity references missing file for drift check: ${relativeFile}` });
          continue;
        }
        const actual = await sha256File(absolute);
        if (actual !== expected) {
          findings.push({ severity: "warning", category: "file-drift", path: page, message: `Entity file hash drift for ${relativeFile}: expected ${expected}, actual ${actual}` });
        }
      }
    }
  }

  for (const page of pages) {
    if (page.endsWith("/index.md") || page.endsWith("/log.md")) continue;
    if ((inbound.get(page) ?? 0) === 0) {
      findings.push({ severity: "info", category: "orphan", path: page, message: `Orphan candidate: ${relativePath(cwd, ensureInsideRoot(cwd, page))} has no inbound wikilinks.` });
    }
  }

  findings.push({ severity: "info", category: "agent-review", message: "Semantic contradiction and stale-claim review requires an agent/human checklist; deterministic lint did not auto-apply fixes." });
  return findings;
}

export async function runLint(cwd: string): Promise<string> {
  const findings = await collectLintFindings(cwd);
  const lines = findings.map((finding) => `- ${finding.severity.toUpperCase()} [${finding.category}]${finding.path ? ` ${finding.path}` : ""}: ${finding.message}`);
  return `# CodeWiki Lint\n\n${lines.join("\n")}\n\n## Agent-review checklist\n- Review possible contradictions between pages.\n- Review stale claims superseded by newer lessons.\n- Propose fixes only; require human approval before writing.\n\n${PROPOSAL_BOUNDARY}.\n`;
}
