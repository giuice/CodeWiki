import { loadConfig } from "../core/config.js";
import { writeTextFileSafe } from "../core/files.js";
function stamp() {
    return new Date().toISOString().replace(/[:.]/g, "").replace(/Z$/, "Z");
}
function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "prd";
}
export async function prdCommand(args, root = process.cwd()) {
    const description = args.join(" ").trim();
    if (!description)
        throw new Error("Usage: codewiki prd <description>");
    const config = await loadConfig(root);
    const file = `${config.wiki.rawPath.replace(/\/$/, "")}/prd-${stamp()}-${slugify(description)}.md`;
    const content = `---
type: prd
status: human-review-needed
approved: false
---

# PRD Draft: ${description}

## Problem

## Goals

## Non-goals

## Acceptance Criteria

## Verification Loop

Each derived task must summarize tests, changes, and proposed wiki updates for human approval.
`;
    await writeTextFileSafe(root, file, content);
    return `Created human-review-needed PRD draft: ${file}`;
}
//# sourceMappingURL=prd.js.map