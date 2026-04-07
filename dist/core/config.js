import path from "node:path";
import { pathExists, readTextIfExists, ensureWithinRoot } from "./files.js";
import { SUPPORTED_TOOLS } from "./types.js";
const DEFAULT_CONFIG = {
    version: 1,
    project: { name: path.basename(process.cwd()), description: "Brief project description for LLM context" },
    tools: ["claude-code", "codex", "copilot", "opencode"],
    wiki: { path: "wiki/", rawPath: "raw/" },
    verification: { requireHumanApproval: true, requireTests: true, autoLog: true },
    ingestion: { interactive: true, maxPagesPerIngest: 20 },
    lint: { checkOrphans: true, checkContradictions: true, checkStaleIssues: true, checkFileDrift: true }
};
function parseBoolean(value, key) {
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    throw new Error(`Unsupported boolean value for ${key}: ${value}`);
}
function parseNumber(value, key) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        throw new Error(`Unsupported numeric value for ${key}: ${value}`);
    return parsed;
}
function unquote(value) {
    return value.trim().replace(/^['\"]|['\"]$/g, "");
}
function assertSupportedYamlSubset(text) {
    const unsupported = [/\t/, /:\s*[{|[]/, /:\s*[>&*]/, /<<\s*:/, /!<|!!/];
    for (const pattern of unsupported) {
        if (pattern.test(text)) {
            throw new Error("Unsupported .codewiki/config.yml syntax. CodeWiki v1 only reads the generated simple YAML subset; remove anchors, inline collections, tags, tabs, and block scalars or add a future YAML parser ADR.");
        }
    }
}
export function parseGeneratedConfig(text, root = process.cwd()) {
    assertSupportedYamlSubset(text);
    const config = structuredClone(DEFAULT_CONFIG);
    config.tools = [];
    let section;
    for (const rawLine of text.split(/\r?\n/)) {
        const withoutComment = rawLine.replace(/\s+#.*$/, "");
        if (!withoutComment.trim())
            continue;
        if (!withoutComment.startsWith(" ")) {
            const [key, ...rest] = withoutComment.split(":");
            const value = rest.join(":").trim();
            if (!key)
                continue;
            if (key === "version") {
                config.version = parseNumber(value, "version");
                section = undefined;
            }
            else if (["project", "tools", "wiki", "verification", "ingestion", "lint"].includes(key) && value === "") {
                section = key;
            }
            else {
                throw new Error(`Unsupported top-level config line: ${rawLine}`);
            }
            continue;
        }
        if (!section)
            throw new Error(`Config value without a supported section: ${rawLine}`);
        const trimmed = withoutComment.trim();
        if (section === "tools" && trimmed.startsWith("- ")) {
            const tool = unquote(trimmed.slice(2));
            if (!SUPPORTED_TOOLS.includes(tool)) {
                throw new Error(`Unsupported CodeWiki tool in config: ${tool}`);
            }
            config.tools.push(tool);
            continue;
        }
        const sep = trimmed.indexOf(":");
        if (sep === -1)
            throw new Error(`Unsupported config line: ${rawLine}`);
        const key = trimmed.slice(0, sep).trim();
        const value = unquote(trimmed.slice(sep + 1).trim());
        switch (section) {
            case "project":
                if (key === "name" || key === "description")
                    config.project[key] = value;
                else
                    throw new Error(`Unsupported project config key: ${key}`);
                break;
            case "wiki":
                if (key === "path")
                    config.wiki.path = value;
                else if (key === "raw_path")
                    config.wiki.rawPath = value;
                else
                    throw new Error(`Unsupported wiki config key: ${key}`);
                break;
            case "verification":
                if (key === "require_human_approval")
                    config.verification.requireHumanApproval = parseBoolean(value, key);
                else if (key === "require_tests")
                    config.verification.requireTests = parseBoolean(value, key);
                else if (key === "auto_log")
                    config.verification.autoLog = parseBoolean(value, key);
                else
                    throw new Error(`Unsupported verification config key: ${key}`);
                break;
            case "ingestion":
                if (key === "interactive")
                    config.ingestion.interactive = parseBoolean(value, key);
                else if (key === "max_pages_per_ingest")
                    config.ingestion.maxPagesPerIngest = parseNumber(value, key);
                else
                    throw new Error(`Unsupported ingestion config key: ${key}`);
                break;
            case "lint":
                if (key === "check_orphans")
                    config.lint.checkOrphans = parseBoolean(value, key);
                else if (key === "check_contradictions")
                    config.lint.checkContradictions = parseBoolean(value, key);
                else if (key === "check_stale_issues")
                    config.lint.checkStaleIssues = parseBoolean(value, key);
                else if (key === "check_file_drift")
                    config.lint.checkFileDrift = parseBoolean(value, key);
                else
                    throw new Error(`Unsupported lint config key: ${key}`);
                break;
            default:
                throw new Error(`Unsupported config section: ${String(section)}`);
        }
    }
    if (config.tools.length === 0)
        config.tools = [...DEFAULT_CONFIG.tools];
    ensureWithinRoot(root, config.wiki.path);
    ensureWithinRoot(root, config.wiki.rawPath);
    return config;
}
export async function loadConfig(root = process.cwd()) {
    const configPath = path.join(root, ".codewiki", "config.yml");
    if (!(await pathExists(configPath))) {
        return { ...structuredClone(DEFAULT_CONFIG), project: { ...DEFAULT_CONFIG.project, name: path.basename(root) } };
    }
    const text = await readTextIfExists(root, ".codewiki/config.yml");
    if (text === undefined)
        throw new Error("Unable to read .codewiki/config.yml");
    return parseGeneratedConfig(text, root);
}
//# sourceMappingURL=config.js.map