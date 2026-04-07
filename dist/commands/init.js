import path from "node:path";
import { ensureDir, writeTextFileSafe } from "../core/files.js";
import { SUPPORTED_TOOLS } from "../core/types.js";
import { scaffoldDirectories, scaffoldFiles } from "../templates/scaffold.js";
function parseTools(value) {
    const requested = value.split(",").map((tool) => tool.trim()).filter(Boolean);
    const unknown = requested.filter((tool) => !SUPPORTED_TOOLS.includes(tool));
    if (unknown.length > 0) {
        throw new Error(`Unsupported tool value: ${unknown.join(", ")}. Supported values: ${SUPPORTED_TOOLS.join(", ")}`);
    }
    return requested;
}
export async function initCommand({ root = process.cwd(), args }) {
    let projectName = path.basename(root);
    let tools = [...SUPPORTED_TOOLS];
    let force = false;
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--force") {
            force = true;
        }
        else if (arg === "--name") {
            const value = args[++index];
            if (!value)
                throw new Error("--name requires a project name");
            projectName = value;
        }
        else if (arg === "--tool") {
            const value = args[++index];
            if (!value)
                throw new Error("--tool requires comma-separated values");
            tools = parseTools(value);
        }
        else {
            throw new Error(`Unknown init option: ${arg}`);
        }
    }
    for (const directory of scaffoldDirectories(tools)) {
        await ensureDir(root, directory);
    }
    for (const file of scaffoldFiles(projectName, tools)) {
        await writeTextFileSafe(root, file.path, file.content, force);
    }
    return [`Initialized CodeWiki for ${projectName}.`, `Adapters: ${tools.join(", ")}.`, "No tool auto-detection was performed.", "Wiki updates remain human-approved proposal-only until explicitly reviewed."].join("\n");
}
//# sourceMappingURL=init.js.map