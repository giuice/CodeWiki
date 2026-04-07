export interface ParsedFrontmatter {
  data: Record<string, unknown>;
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
