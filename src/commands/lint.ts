import path from "node:path";
import { ensureWithinRoot, listFilesRecursive, pathExists, readTextIfExists } from "../core/files.js";
import { parseMarkdownWithFrontmatter, wikilinks, frontmatterString } from "../core/frontmatter.js";
import { sha256File } from "../core/hash.js";
import { loadConfig } from "../core/config.js";
import { PROPOSAL_BOUNDARY } from "../core/proposals.js";
import type { CodeWikiConfig } from "../core/types.js";
import type { LintFinding } from "../core/types.js";

function knownPageKeys(page: string, id?: string): string[] {
  const withoutExt = page.replace(/\.md$/i, "");
  const base = path.posix.basename(withoutExt);
  return [page, withoutExt, base, ...(id ? [id] : [])];
}

export async function collectLintFindings(root = process.cwd()): Promise<LintFinding[]> {
  const findings: LintFinding[] = [];
  let config: CodeWikiConfig = {
    version: 1,
    project: { name: path.basename(root), description: "" },
    tools: [],
    wiki: { path: "wiki/", raw_path: "raw/", rawPath: "raw/" },
    verification: { require_human_approval: true, require_tests: true, auto_log: true },
    ingestion: { interactive: true, max_pages_per_ingest: 20 },
    lint: { check_orphans: true, check_contradictions: true, check_stale_issues: true, check_file_drift: true },
  };
  try {
    config = await loadConfig(root);
  } catch (error) {
    findings.push({ severity: "error", category: "missing-required", path: ".codewiki/config.yml", message: (error as Error).message });
  }
  const wikiPath = config.wiki.path.replace(/\/$/, "");
  for (const required of [`${wikiPath}/index.md`, `${wikiPath}/log.md`]) {
    if (!(await pathExists(ensureWithinRoot(root, required)))) {
      findings.push({ severity: "error", category: "missing-required", path: required, message: `Missing required CodeWiki path: ${required}` });
    }
  }
  const pages = await listFilesRecursive(root, wikiPath, ".md");
  const known = new Set<string>();
  const incoming = new Map<string, number>();
  const parsedPages = new Map<string, ReturnType<typeof parseMarkdownWithFrontmatter>>();
  for (const page of pages) {
    const parsed = parseMarkdownWithFrontmatter((await readTextIfExists(root, page)) ?? "");
    parsedPages.set(page, parsed);
    for (const key of knownPageKeys(page, frontmatterString(parsed.frontmatter.id))) known.add(key);
    incoming.set(page, 0);
  }
  for (const [page, parsed] of parsedPages) {
    for (const link of wikilinks(parsed.body)) {
      if (!known.has(link)) {
        findings.push({ severity: "warning", category: "broken-link", path: page, message: `Broken wikilink [[${link}]]` });
      } else {
        for (const candidate of pages) {
          if (knownPageKeys(candidate, frontmatterString(parsedPages.get(candidate)?.frontmatter.id)).includes(link)) {
            incoming.set(candidate, (incoming.get(candidate) ?? 0) + 1);
          }
        }
      }
    }
    if (frontmatterString(parsed.frontmatter.type) === "issue" && frontmatterString(parsed.frontmatter.status) === "resolved" && !frontmatterString(parsed.frontmatter.resolved_by)) {
      findings.push({ severity: "warning", category: "issue-lifecycle", path: page, message: "Resolved issue is missing resolved_by: LESSON-XXX." });
    }
    const fileHashes = parsed.frontmatter.file_hashes;
    if (frontmatterString(parsed.frontmatter.type) === "entity" && fileHashes !== null && typeof fileHashes === "object" && !Array.isArray(fileHashes)) {
      for (const [relFile, expectedHash] of Object.entries(fileHashes)) {
        try {
          const actual = await sha256File(ensureWithinRoot(root, relFile));
          if (actual !== expectedHash) {
            findings.push({ severity: "warning", category: "file-drift", path: page, message: `Entity file hash drift for ${relFile}.` });
          }
        } catch {
          findings.push({ severity: "warning", category: "file-drift", path: page, message: `Tracked file missing for hash drift check: ${relFile}.` });
        }
      }
    }
  }
  for (const page of pages) {
    if (!page.endsWith("index.md") && !page.endsWith("log.md") && (incoming.get(page) ?? 0) === 0) {
      findings.push({ severity: "info", category: "orphan", path: page, message: "Orphan candidate: no incoming wikilinks found." });
    }
  }
  if (config.lint.check_contradictions || config.lint.check_stale_issues) {
    findings.push({ severity: "info", category: "agent-review", path: wikiPath, message: "Semantic contradiction and stale-claim review requires an agent/human checklist; no deterministic fix was applied." });
  }
  return findings;
}

export async function lintCommand(_args: string[], root = process.cwd()): Promise<string> {
  const findings = await collectLintFindings(root);
  return [
    "# CodeWiki Lint",
    "Deterministic checks completed; no wiki fixes were written automatically.",
    PROPOSAL_BOUNDARY,
    "",
    "## Agent Review Checklist",
    "- [ ] Review semantic contradictions and stale claims manually or with an approved agent.",
    "- [ ] Do not apply wiki fixes without human approval.",
    "",
    ...findings.map((finding) => `- ${finding.severity.toUpperCase()} [${finding.category}] ${finding.path}: ${finding.message}`)
  ].join("\n");
}
