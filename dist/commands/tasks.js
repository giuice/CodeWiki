import path from "node:path";
import { ensureWithinRoot, readTextRequired, writeTextFileSafe } from "../core/files.js";
import { slugify, timestampForFile } from "../core/proposals.js";
export async function tasksCommand(prdPath, root = process.cwd(), now = new Date()) {
    if (!prdPath)
        throw new Error("Usage: codewiki tasks <prd-path>");
    const absolute = ensureWithinRoot(root, prdPath);
    const rel = path.relative(root, absolute).split(path.sep).join("/");
    const prd = await readTextRequired(root, rel);
    const base = slugify(path.basename(rel, path.extname(rel))).slice(0, 70);
    const out = path.posix.join("raw", `${timestampForFile(now)}-tasks-${base}.md`);
    const content = `---
type: task-list
source_prd: ${rel}
human_review_needed: true
approved: false
date: ${now.toISOString()}
---
# Task List Draft for ${rel}

HUMAN-REVIEW-NEEDED: Review this task breakdown before execution. Every task must use the CodeWiki verification loop and human approval before wiki writes.

## Source PRD Excerpt
${prd.slice(0, 3000)}

## Tasks
- [ ] 1. Confirm PRD scope and required tests with the human.
- [ ] 2. Implement the smallest verified slice.
- [ ] 3. Run relevant tests/typecheck/lint.
- [ ] 4. Summarize changes and wiki context used.
- [ ] 5. Ask for human approval before any CodeWiki wiki update.
`;
    await writeTextFileSafe(root, out, content, false);
    return `Created human-review-needed task artifact: ${out}`;
}
//# sourceMappingURL=tasks.js.map