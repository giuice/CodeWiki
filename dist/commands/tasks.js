import path from "node:path";
import { loadConfig } from "../core/config.js";
import { ensureWithinRoot, readTextIfExists, writeTextFileSafe } from "../core/files.js";
function stamp() {
    return new Date().toISOString().replace(/[:.]/g, "").replace(/Z$/, "Z");
}
export async function tasksCommand(args, root = process.cwd()) {
    const prdPath = args[0];
    if (!prdPath)
        throw new Error("Usage: codewiki tasks <prd-path>");
    ensureWithinRoot(root, prdPath);
    const prdText = await readTextIfExists(root, prdPath);
    if (prdText === undefined)
        throw new Error(`PRD file not found: ${prdPath}`);
    const config = await loadConfig(root);
    const basename = path.basename(prdPath, path.extname(prdPath)).replace(/[^a-zA-Z0-9_-]+/g, "-");
    const file = `${config.wiki.rawPath.replace(/\/$/, "")}/tasks-${stamp()}-${basename}.md`;
    const content = `---
type: task-list
source_prd: ${prdPath}
status: human-review-needed
approved: false
---

# Task Draft for ${prdPath}

## Tasks

- [ ] Implement the smallest safe slice from the PRD.
- [ ] Run the verification loop: build, typecheck, tests, and human-approved wiki proposal review.
- [ ] Record proposed wiki updates without applying them automatically.

## PRD Excerpt

${prdText.slice(0, 1600)}
`;
    await writeTextFileSafe(root, file, content);
    return `Created human-review-needed task draft: ${file}`;
}
//# sourceMappingURL=tasks.js.map