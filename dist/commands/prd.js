import path from "node:path";
import { ensureDir, writeTextFileSafe } from "../core/files.js";
import { slugify, timestampForFile } from "../core/proposals.js";
export async function prdCommand(description, root = process.cwd(), now = new Date()) {
    if (!description)
        throw new Error("Usage: codewiki prd <description>");
    await ensureDir(root, "raw");
    const slug = slugify(description).slice(0, 60);
    const relPath = path.posix.join("raw", `${timestampForFile(now)}-prd-${slug}.md`);
    const content = `---
type: prd
human_review_needed: true
approved: false
date: ${now.toISOString()}
---
# PRD Draft: ${description}

HUMAN-REVIEW-NEEDED: This raw PRD draft is a prompt artifact. Refine and approve before generating tasks or wiki updates.

## Problem
Describe the user/problem evidence.

## Goals
- TODO

## Non-Goals
- Preserve CodeWiki v1 boundaries unless explicitly changed.

## Acceptance Criteria
- TODO

## Verification Loop
Each implementation task must run tests and ask for human approval before wiki updates.
`;
    await writeTextFileSafe(root, relPath, content, false);
    return `Created human-review-needed PRD draft: ${relPath}`;
}
//# sourceMappingURL=prd.js.map