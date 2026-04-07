export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

function parseScalar(raw: string): unknown {
  const value = raw.trim();
  if (value === "") return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((part) => part.trim().replace(/^['"]|['"]$/g, ""));
  }
  return value.replace(/^['"]|['"]$/g, "");
}

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  if (!markdown.startsWith("---\n")) return { data: {}, body: markdown };
  const end = markdown.indexOf("\n---", 4);
  if (end < 0) return { data: {}, body: markdown };
  const raw = markdown.slice(4, end);
  const body = markdown.slice(end + 4).replace(/^\n/, "");
  const data: Record<string, unknown> = {};
  let currentMapKey: string | undefined;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const nested = line.match(/^\s{2,}([^:]+):\s*(.*)$/);
    if (nested && currentMapKey) {
      const map = data[currentMapKey];
      if (map && typeof map === "object" && !Array.isArray(map)) {
        (map as Record<string, string>)[nested[1]!.trim()] = String(parseScalar(nested[2] ?? ""));
      }
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1]!;
    const rawValue = match[2] ?? "";
    if (rawValue === "") {
      data[key] = {};
      currentMapKey = key;
    } else {
      data[key] = parseScalar(rawValue);
      currentMapKey = undefined;
    }
  }

  return { data, body };
}

export function parseMarkdownWithFrontmatter(markdown: string): ParsedMarkdown {
  const parsed = parseFrontmatter(markdown);
  return { frontmatter: parsed.data, body: parsed.body };
}

export function firstHeading(markdown: string): string | undefined {
  return markdown.split(/\r?\n/).find((line) => line.startsWith("# "))?.replace(/^#\s+/, "").trim();
}

export function wikilinks(markdown: string): string[] {
  return Array.from(markdown.matchAll(/\[\[([^\]]+)\]\]/g), (match) => match[1]?.trim() ?? "").filter(Boolean);
}

export function frontmatterString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
