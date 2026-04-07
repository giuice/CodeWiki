import path from "node:path";
import { ensureInsideRoot, listMarkdownFiles, readText, readTextIfExists, relativePath } from "./files.js";

export interface WikiPageMatch {
  path: string;
  score: number;
  excerpt: string;
}

function terms(input: string): Set<string> {
  return new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9_-]+/)
      .filter((term) => term.length > 2),
  );
}

function firstHeading(markdown: string): string | undefined {
  return markdown.split(/\r?\n/).find((line) => line.startsWith("# "))?.replace(/^#\s+/, "");
}

function excerptFor(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("---") && !line.startsWith("type:"))
    ?.slice(0, 180) ?? "No excerpt available.";
}

export async function readIndexFirst(root: string, wikiPath: string): Promise<string> {
  return (await readTextIfExists(path.join(root, wikiPath, "index.md"))) ?? "";
}

export async function findRelevantPages(root: string, wikiPath: string, query: string, limit = 5): Promise<WikiPageMatch[]> {
  const index = await readIndexFirst(root, wikiPath);
  const queryTerms = terms(`${query}\n${index}`);
  const pages = (await listMarkdownFiles(root, wikiPath)).filter((page) => !page.endsWith("/index.md") && !page.endsWith("/log.md"));
  const matches: WikiPageMatch[] = [];

  for (const page of pages) {
    const absolute = ensureInsideRoot(root, page);
    const content = await readText(absolute);
    const searchable = `${page}\n${firstHeading(content) ?? ""}\n${content}`.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (searchable.includes(term)) score += 1;
    }
    if (score > 0) {
      matches.push({ path: relativePath(root, absolute), score, excerpt: excerptFor(content) });
    }
  }

  return matches.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
}

export async function readWikiPages(root: string, matches: WikiPageMatch[]): Promise<Array<WikiPageMatch & { content: string }>> {
  const withContent: Array<WikiPageMatch & { content: string }> = [];
  for (const match of matches) {
    withContent.push({ ...match, content: await readText(ensureInsideRoot(root, match.path)) });
  }
  return withContent;
}
