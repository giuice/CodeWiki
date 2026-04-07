import path from "node:path";
import { ensureInsideRoot, exists, readText } from "./files.js";
import { type CodeWikiConfig, SUPPORTED_TOOLS, type SupportedTool } from "./types.js";

export const DEFAULT_CONFIG_RELATIVE_PATH = ".codewiki/config.yml";

const DEFAULT_CONFIG: CodeWikiConfig = {
  version: 1,
  project: { name: "codewiki-project", description: "Brief project description for LLM context" },
  tools: [...SUPPORTED_TOOLS],
  wiki: { path: "wiki/", raw_path: "raw/", rawPath: "raw/" },
  verification: { require_human_approval: true, require_tests: true, auto_log: true },
  ingestion: { interactive: true, max_pages_per_ingest: 20 },
  lint: { check_orphans: true, check_contradictions: true, check_stale_issues: true, check_file_drift: true }
};

function stripQuotes(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function parseBoolean(value: string, field: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Invalid boolean for ${field}: ${value}`);
}

function parseNumber(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid number for ${field}: ${value}`);
  return parsed;
}

function assertSupportedYamlSubset(yaml: string): void {
  if (/[\t{}\[\]&*]|<<:|!!|!\w/.test(yaml)) {
    throw new Error("Unsupported .codewiki/config.yml syntax. Regenerate config or keep to the generated simple YAML subset.");
  }
}

function removeInlineComment(line: string): string {
  return line.replace(/\s+#.*$/, "");
}

function sectionLines(lines: string[], section: string): string[] {
  const start = lines.findIndex((line) => line === `${section}:`);
  if (start < 0) return [];
  const collected: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined || /^\S/.test(line)) break;
    collected.push(line);
  }
  return collected;
}

function nestedValue(lines: string[], section: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = sectionLines(lines, section)
    .map((line) => line.match(new RegExp(`^  ${escaped}:\\s*(.+)$`)))
    .find((candidate): candidate is RegExpMatchArray => candidate !== null);
  return match?.[1]?.trim();
}

function sequence(lines: string[], section: string): string[] {
  return sectionLines(lines, section)
    .map((line) => line.match(/^  -\s+(.+)$/)?.[1])
    .filter((value): value is string => value !== undefined)
    .map(stripQuotes);
}

function valueFor(lines: string[], key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = lines.find((line) => new RegExp(`^${escaped}:\\s+`).test(line));
  return match?.replace(new RegExp(`^${escaped}:\\s*`), "").trim();
}

function normalizeConfig(config: CodeWikiConfig, root: string): CodeWikiConfig {
  config.wiki.rawPath = config.wiki.raw_path;
  ensureInsideRoot(root, config.wiki.path);
  ensureInsideRoot(root, config.wiki.raw_path);
  return config;
}

export function parseTools(rawTools: string): SupportedTool[] {
  const tools = rawTools.split(",").map((tool) => tool.trim()).filter(Boolean);
  const invalid = tools.filter((tool): tool is string => !SUPPORTED_TOOLS.includes(tool as SupportedTool));
  if (invalid.length > 0) {
    throw new Error(`Unsupported tool value: ${invalid.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}`);
  }
  return tools as SupportedTool[];
}

export function parseConfigYaml(yaml: string, root = process.cwd()): CodeWikiConfig {
  assertSupportedYamlSubset(yaml);
  const lines = yaml.split(/\r?\n/).map(removeInlineComment).filter((line) => line.trim());
  const tools = sequence(lines, "tools");
  const invalidTools = tools.filter((tool): tool is string => !SUPPORTED_TOOLS.includes(tool as SupportedTool));
  if (invalidTools.length > 0) {
    throw new Error(`Unsupported configured tool(s): ${invalidTools.join(", ")}`);
  }
  const rawPath = stripQuotes(nestedValue(lines, "wiki", "raw_path") ?? DEFAULT_CONFIG.wiki.raw_path);
  return normalizeConfig({
    version: parseNumber(valueFor(lines, "version") ?? String(DEFAULT_CONFIG.version), "version"),
    project: {
      name: stripQuotes(nestedValue(lines, "project", "name") ?? path.basename(root)),
      description: stripQuotes(nestedValue(lines, "project", "description") ?? DEFAULT_CONFIG.project.description)
    },
    tools: tools.length > 0 ? tools as SupportedTool[] : [...DEFAULT_CONFIG.tools],
    wiki: {
      path: stripQuotes(nestedValue(lines, "wiki", "path") ?? DEFAULT_CONFIG.wiki.path),
      raw_path: rawPath,
      rawPath
    },
    verification: {
      require_human_approval: parseBoolean(nestedValue(lines, "verification", "require_human_approval") ?? "true", "verification.require_human_approval"),
      require_tests: parseBoolean(nestedValue(lines, "verification", "require_tests") ?? "true", "verification.require_tests"),
      auto_log: parseBoolean(nestedValue(lines, "verification", "auto_log") ?? "true", "verification.auto_log")
    },
    ingestion: {
      interactive: parseBoolean(nestedValue(lines, "ingestion", "interactive") ?? "true", "ingestion.interactive"),
      max_pages_per_ingest: parseNumber(nestedValue(lines, "ingestion", "max_pages_per_ingest") ?? "20", "ingestion.max_pages_per_ingest")
    },
    lint: {
      check_orphans: parseBoolean(nestedValue(lines, "lint", "check_orphans") ?? "true", "lint.check_orphans"),
      check_contradictions: parseBoolean(nestedValue(lines, "lint", "check_contradictions") ?? "true", "lint.check_contradictions"),
      check_stale_issues: parseBoolean(nestedValue(lines, "lint", "check_stale_issues") ?? "true", "lint.check_stale_issues"),
      check_file_drift: parseBoolean(nestedValue(lines, "lint", "check_file_drift") ?? "true", "lint.check_file_drift")
    }
  }, root);
}

export const parseGeneratedConfig = parseConfigYaml;

export async function readConfig(root: string): Promise<CodeWikiConfig> {
  const configPath = path.join(root, DEFAULT_CONFIG_RELATIVE_PATH);
  if (!(await exists(configPath))) {
    throw new Error("Missing .codewiki/config.yml. Run `codewiki init` first.");
  }
  return parseConfigYaml(await readText(configPath), root);
}

export const loadConfig = readConfig;

export function defaultConfigYaml(projectName: string, tools: SupportedTool[]): string {
  return `# .codewiki/config.yml\nversion: 1\n\nproject:\n  name: "${projectName}"\n  description: "Brief project description for LLM context"\n\ntools:\n${tools.map((tool) => `  - ${tool}`).join("\n")}\n\nwiki:\n  path: wiki/\n  raw_path: raw/\n\nverification:\n  require_human_approval: true\n  require_tests: true\n  auto_log: true\n\ningestion:\n  interactive: true\n  max_pages_per_ingest: 20\n\nlint:\n  check_orphans: true\n  check_contradictions: true\n  check_stale_issues: true\n  check_file_drift: true\n`;
}
