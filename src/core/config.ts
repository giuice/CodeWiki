import path from "node:path";
import { ensureInsideRoot, exists, readText } from "./files.js";
import { CodeWikiConfig, SUPPORTED_TOOLS, SupportedTool } from "./types.js";

export const DEFAULT_CONFIG_RELATIVE_PATH = ".codewiki/config.yml";

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

function valueFor(lines: string[], key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = lines.find((line) => new RegExp(`^${escaped}:\\s+`).test(line));
  return match?.replace(new RegExp(`^${escaped}:\\s*`), "").trim();
}

function nestedValue(lines: string[], section: string, key: string): string | undefined {
  const start = lines.findIndex((line) => line === `${section}:`);
  if (start < 0) return undefined;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (/^\S/.test(line)) break;
    const match = line.match(new RegExp(`^  ${key}:\\s*(.+)$`));
    if (match) return match[1]!.trim();
  }
  return undefined;
}

export function parseGeneratedConfig(text: string, root = process.cwd()): CodeWikiConfig {
  assertSupportedYamlSubset(text);
  const config: CodeWikiConfig = structuredClone(DEFAULT_CONFIG);
  config.tools = [];
  let section: keyof CodeWikiConfig | "tools" | undefined;
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmedRaw = rawLine.trim();
    if (!trimmedRaw || trimmedRaw.startsWith("#")) continue;
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (!withoutComment.trim()) continue;
    if (!withoutComment.startsWith(" ")) {
      const [key, ...rest] = withoutComment.split(":");
      const value = rest.join(":").trim();
      if (!key) continue;
      if (key === "version") {
        config.version = parseNumber(value, "version");
        section = undefined;
      } else if (["project", "tools", "wiki", "verification", "ingestion", "lint"].includes(key) && value === "") {
        section = key as keyof CodeWikiConfig;
      } else {
        throw new Error(`Unsupported top-level config line: ${rawLine}`);
      }
      continue;
    }
    if (!section) throw new Error(`Config value without a supported section: ${rawLine}`);
    const trimmed = withoutComment.trim();
    if (section === "tools" && trimmed.startsWith("- ")) {
      const tool = unquote(trimmed.slice(2)) as SupportedTool;
      if (!SUPPORTED_TOOLS.includes(tool)) {
        throw new Error(`Unsupported CodeWiki tool in config: ${tool}`);
      }
      config.tools.push(tool);
      continue;
    }
    const sep = trimmed.indexOf(":");
    if (sep === -1) throw new Error(`Unsupported config line: ${rawLine}`);
    const key = trimmed.slice(0, sep).trim();
    const value = unquote(trimmed.slice(sep + 1).trim());
    switch (section) {
      case "project":
        if (key === "name" || key === "description") config.project[key] = value;
        else throw new Error(`Unsupported project config key: ${key}`);
        break;
      case "wiki":
        if (key === "path") config.wiki.path = value;
        else if (key === "raw_path") config.wiki.rawPath = value;
        else throw new Error(`Unsupported wiki config key: ${key}`);
        break;
      case "verification":
        if (key === "require_human_approval") config.verification.requireHumanApproval = parseBoolean(value, key);
        else if (key === "require_tests") config.verification.requireTests = parseBoolean(value, key);
        else if (key === "auto_log") config.verification.autoLog = parseBoolean(value, key);
        else throw new Error(`Unsupported verification config key: ${key}`);
        break;
      case "ingestion":
        if (key === "interactive") config.ingestion.interactive = parseBoolean(value, key);
        else if (key === "max_pages_per_ingest") config.ingestion.maxPagesPerIngest = parseNumber(value, key);
        else throw new Error(`Unsupported ingestion config key: ${key}`);
        break;
      case "lint":
        if (key === "check_orphans") config.lint.checkOrphans = parseBoolean(value, key);
        else if (key === "check_contradictions") config.lint.checkContradictions = parseBoolean(value, key);
        else if (key === "check_stale_issues") config.lint.checkStaleIssues = parseBoolean(value, key);
        else if (key === "check_file_drift") config.lint.checkFileDrift = parseBoolean(value, key);
        else throw new Error(`Unsupported lint config key: ${key}`);
        break;
      default:
        throw new Error(`Unsupported config section: ${String(section)}`);
    }
  }
  return values;
}

export function parseTools(rawTools: string): SupportedTool[] {
  const tools = rawTools.split(",").map((tool) => tool.trim()).filter(Boolean);
  const invalid = tools.filter((tool): tool is string => !SUPPORTED_TOOLS.includes(tool as SupportedTool));
  if (invalid.length > 0) {
    throw new Error(`Unsupported tool value: ${invalid.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}`);
  }
  return tools as SupportedTool[];
}

export function parseConfigYaml(yaml: string): CodeWikiConfig {
  if (/[\t{}&*]|<<:/.test(yaml)) {
    throw new Error("Unsupported YAML syntax in .codewiki/config.yml. Regenerate config or keep to the generated simple YAML subset.");
  }
  const lines = yaml.split(/\r?\n/).map((line) => line.replace(/\s+#.*$/, "")).filter((line) => line.trim());
  const tools = sequence(lines, "tools");
  const invalidTools = tools.filter((tool): tool is string => !SUPPORTED_TOOLS.includes(tool as SupportedTool));
  if (invalidTools.length > 0) {
    throw new Error(`Unsupported configured tool(s): ${invalidTools.join(", ")}`);
  }

  const config: CodeWikiConfig = {
    version: parseNumber(valueFor(lines, "version") ?? "1", "version"),
    project: {
      name: stripQuotes(nestedValue(lines, "project", "name") ?? "codewiki-project"),
      description: stripQuotes(nestedValue(lines, "project", "description") ?? "Brief project description for LLM context"),
    },
    tools: tools as SupportedTool[],
    wiki: {
      path: stripQuotes(nestedValue(lines, "wiki", "path") ?? "wiki/"),
      raw_path: stripQuotes(nestedValue(lines, "wiki", "raw_path") ?? "raw/"),
    },
    verification: {
      require_human_approval: parseBoolean(nestedValue(lines, "verification", "require_human_approval") ?? "true", "verification.require_human_approval"),
      require_tests: parseBoolean(nestedValue(lines, "verification", "require_tests") ?? "true", "verification.require_tests"),
      auto_log: parseBoolean(nestedValue(lines, "verification", "auto_log") ?? "true", "verification.auto_log"),
    },
    ingestion: {
      interactive: parseBoolean(nestedValue(lines, "ingestion", "interactive") ?? "true", "ingestion.interactive"),
      max_pages_per_ingest: parseNumber(nestedValue(lines, "ingestion", "max_pages_per_ingest") ?? "20", "ingestion.max_pages_per_ingest"),
    },
    lint: {
      check_orphans: parseBoolean(nestedValue(lines, "lint", "check_orphans") ?? "true", "lint.check_orphans"),
      check_contradictions: parseBoolean(nestedValue(lines, "lint", "check_contradictions") ?? "true", "lint.check_contradictions"),
      check_stale_issues: parseBoolean(nestedValue(lines, "lint", "check_stale_issues") ?? "true", "lint.check_stale_issues"),
      check_file_drift: parseBoolean(nestedValue(lines, "lint", "check_file_drift") ?? "true", "lint.check_file_drift"),
    },
  };

  ensureInsideRoot(process.cwd(), config.wiki.path);
  ensureInsideRoot(process.cwd(), config.wiki.raw_path);
  return config;
}

export async function readConfig(root: string): Promise<CodeWikiConfig> {
  const configPath = path.join(root, DEFAULT_CONFIG_RELATIVE_PATH);
  if (!(await exists(configPath))) {
    throw new Error("Missing .codewiki/config.yml. Run `codewiki init` first.");
  }
  const config = parseConfigYaml(await readText(configPath));
  ensureInsideRoot(root, config.wiki.path);
  ensureInsideRoot(root, config.wiki.raw_path);
  return config;
}

export function defaultConfigYaml(projectName: string, tools: SupportedTool[]): string {
  return `# .codewiki/config.yml\nversion: 1\n\nproject:\n  name: "${projectName}"\n  description: "Brief project description for LLM context"\n\ntools:\n${tools.map((tool) => `  - ${tool}`).join("\n")}\n\nwiki:\n  path: wiki/\n  raw_path: raw/\n\nverification:\n  require_human_approval: true\n  require_tests: true\n  auto_log: true\n\ningestion:\n  interactive: true\n  max_pages_per_ingest: 20\n\nlint:\n  check_orphans: true\n  check_contradictions: true\n  check_stale_issues: true\n  check_file_drift: true\n`;
}
