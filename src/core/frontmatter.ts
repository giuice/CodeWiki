export interface ParsedMarkdown {
  frontmatter: Record<string, string | string[] | Record<string, string>>;
  body: string;
}

function parseScalar(value: string): string | string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""));
  }
  return trimmed.replace(/^['\"]|['\"]$/g, "");
}

export function parseMarkdownWithFrontmatter(markdown: string): ParsedMarkdown {
  if (!markdown.startsWith("---\n")) {
    return { frontmatter: {}, body: markdown };
  }
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: {}, body: markdown };
  }
  const frontmatterText = markdown.slice(4, end).trimEnd();
  const body = markdown.slice(end + 4).replace(/^\n/, "");
  const frontmatter: Record<string, string | string[] | Record<string, string>> = {};
  let currentMapKey: string | undefined;
  for (const rawLine of frontmatterText.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    if (rawLine.startsWith("  ") && currentMapKey) {
      const nested = rawLine.trim();
      const sep = nested.indexOf(":");
      if (sep === -1) continue;
      const map = frontmatter[currentMapKey];
      if (typeof map === "object" && !Array.isArray(map)) {
        map[nested.slice(0, sep).trim()] = nested.slice(sep + 1).trim().replace(/^['\"]|['\"]$/g, "");
      }
      continue;
    }
    currentMapKey = undefined;
    const sep = rawLine.indexOf(":");
    if (sep === -1) continue;
    const key = rawLine.slice(0, sep).trim();
    const value = rawLine.slice(sep + 1).trim();
    if (value === "") {
      frontmatter[key] = {};
      currentMapKey = key;
    } else {
      frontmatter[key] = parseScalar(value);
    }
  }
  return { frontmatter, body };
}

export function firstHeading(markdown: string): string | undefined {
  const line = markdown.split(/\r?\n/).find((candidate) => candidate.startsWith("# "));
  return line?.replace(/^#\s+/, "").trim();
}

export function wikilinks(markdown: string): string[] {
  const matches = markdown.matchAll(/\[\[([^\]]+)\]\]/g);
  return Array.from(matches, (match) => match[1]?.trim() ?? "").filter(Boolean);
}

export function frontmatterString(value: string | string[] | Record<string, string> | undefined): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}
