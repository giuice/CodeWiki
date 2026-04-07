import path from "node:path";
import { ensureInsideRoot, exists, readText } from "./files.js";
import { SUPPORTED_TOOLS } from "./types.js";
export const DEFAULT_CONFIG_RELATIVE_PATH = ".codewiki/config.yml";
function stripQuotes(value) {
    return value.trim().replace(/^['"]|['"]$/g, "");
}
function parseBoolean(value, field) {
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    throw new Error(`Invalid boolean for ${field}: ${value}`);
}
function parseNumber(value, field) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        throw new Error(`Invalid number for ${field}: ${value}`);
    return parsed;
}
function valueFor(lines, key) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = lines.find((line) => new RegExp(`^${escaped}:\\s+`).test(line));
    return match?.replace(new RegExp(`^${escaped}:\\s*`), "").trim();
}
function nestedValue(lines, section, key) {
    const start = lines.findIndex((line) => line === `${section}:`);
    if (start < 0)
        return undefined;
    for (let index = start + 1; index < lines.length; index += 1) {
        const line = lines[index];
        if (/^\S/.test(line))
            break;
        const match = line.match(new RegExp(`^  ${key}:\\s*(.+)$`));
        if (match)
            return match[1].trim();
    }
    return undefined;
}
function sequence(lines, section) {
    const start = lines.findIndex((line) => line === `${section}:`);
    if (start < 0)
        return [];
    const values = [];
    for (let index = start + 1; index < lines.length; index += 1) {
        const line = lines[index];
        if (/^\S/.test(line))
            break;
        const match = line.match(/^  -\s+(.+)$/);
        if (match)
            values.push(stripQuotes(match[1]));
    }
    return values;
}
export function parseTools(rawTools) {
    const tools = rawTools.split(",").map((tool) => tool.trim()).filter(Boolean);
    const invalid = tools.filter((tool) => !SUPPORTED_TOOLS.includes(tool));
    if (invalid.length > 0) {
        throw new Error(`Unsupported tool value: ${invalid.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}`);
    }
    return tools;
}
export function parseConfigYaml(yaml) {
    if (/[\t{}&*]|<<:/.test(yaml)) {
        throw new Error("Unsupported YAML syntax in .codewiki/config.yml. Regenerate config or keep to the generated simple YAML subset.");
    }
    const lines = yaml.split(/\r?\n/).map((line) => line.replace(/\s+#.*$/, "")).filter((line) => line.trim());
    const tools = sequence(lines, "tools");
    const invalidTools = tools.filter((tool) => !SUPPORTED_TOOLS.includes(tool));
    if (invalidTools.length > 0) {
        throw new Error(`Unsupported configured tool(s): ${invalidTools.join(", ")}`);
    }
    const config = {
        version: parseNumber(valueFor(lines, "version") ?? "1", "version"),
        project: {
            name: stripQuotes(nestedValue(lines, "project", "name") ?? "codewiki-project"),
            description: stripQuotes(nestedValue(lines, "project", "description") ?? "Brief project description for LLM context"),
        },
        tools: tools,
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
export async function readConfig(root) {
    const configPath = path.join(root, DEFAULT_CONFIG_RELATIVE_PATH);
    if (!(await exists(configPath))) {
        throw new Error("Missing .codewiki/config.yml. Run `codewiki init` first.");
    }
    const config = parseConfigYaml(await readText(configPath));
    ensureInsideRoot(root, config.wiki.path);
    ensureInsideRoot(root, config.wiki.raw_path);
    return config;
}
export function defaultConfigYaml(projectName, tools) {
    return `# .codewiki/config.yml\nversion: 1\n\nproject:\n  name: "${projectName}"\n  description: "Brief project description for LLM context"\n\ntools:\n${tools.map((tool) => `  - ${tool}`).join("\n")}\n\nwiki:\n  path: wiki/\n  raw_path: raw/\n\nverification:\n  require_human_approval: true\n  require_tests: true\n  auto_log: true\n\ningestion:\n  interactive: true\n  max_pages_per_ingest: 20\n\nlint:\n  check_orphans: true\n  check_contradictions: true\n  check_stale_issues: true\n  check_file_drift: true\n`;
}
//# sourceMappingURL=config.js.map