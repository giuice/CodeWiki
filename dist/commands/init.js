import path from "node:path";
import { ensureDir, writeTextFileSafe } from "../core/files.js";
import { SUPPORTED_TOOLS } from "../core/types.js";
import { scaffoldEntries } from "../templates/scaffold.js";
export function parseToolList(value) {
    const tools = value.split(",").map((tool) => tool.trim()).filter(Boolean);
    const unknown = tools.filter((tool) => !SUPPORTED_TOOLS.includes(tool));
    if (unknown.length > 0) {
        throw new Error(`Unsupported tool(s): ${unknown.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}`);
    }
    return tools;
}
export async function initCommand(options = {}) {
    const root = options.root ?? process.cwd();
    const tools = options.tools ?? [...SUPPORTED_TOOLS];
    const projectName = options.name ?? path.basename(root);
    const entries = scaffoldEntries(projectName, tools);
    for (const entry of entries) {
        if (entry.directory) {
            await ensureDir(root, entry.path);
        }
        else if (entry.content !== undefined) {
            await writeTextFileSafe(root, entry.path, entry.content, options.force ?? false);
        }
    }
    return [
        `Initialized CodeWiki for ${projectName}.`,
        `Generated tools: ${tools.join(", ")}.`,
        "No auto-detection was performed; use --tool to choose adapters explicitly.",
        "Human approval boundary enabled: wiki updates remain proposals until approved."
    ].join("\n");
}
//# sourceMappingURL=init.js.map