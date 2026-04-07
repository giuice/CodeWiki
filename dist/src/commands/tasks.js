import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readConfig } from "../core/config.js";
import { ensureInsideRoot, exists, readText, slugify, timestampForFile } from "../core/files.js";
export async function runTasks(cwd, args, now = new Date()) {
    const prdPathArg = args[0];
    if (!prdPathArg)
        throw new Error("Usage: codewiki tasks <prd-path>");
    const prdPath = ensureInsideRoot(cwd, prdPathArg);
    if (!(await exists(prdPath)))
        throw new Error(`PRD not found: ${prdPathArg}`);
    const config = await readConfig(cwd);
    const rawDir = ensureInsideRoot(cwd, config.wiki.raw_path);
    await mkdir(rawDir, { recursive: true });
    const prd = await readText(prdPath);
    const title = prd.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(prdPathArg, path.extname(prdPathArg));
    const relative = `${config.wiki.raw_path.replace(/\/$/, "")}/tasks-${timestampForFile(now)}-${slugify(title)}.md`;
    const content = `---\ntype: task-list\nstatus: human-review-needed\nsource_prd: ${prdPathArg}\napproved: false\nverified_by: human\ncreated_at: ${now.toISOString()}\n---\n# Tasks for ${title}\n\n> Human-review-needed: review this task split before execution.\n\n## Verification Loop Required\nEvery task must: read relevant wiki context, implement changes, run tests, summarize evidence, and request human approval before wiki writes.\n\n## Proposed Tasks\n- [ ] Review PRD scope and identify files likely to change.\n- [ ] Implement the smallest verified slice.\n- [ ] Run tests/typecheck and capture evidence.\n- [ ] Propose CodeWiki updates; do not apply them without approval.\n`;
    await writeFile(ensureInsideRoot(cwd, relative), content, "utf8");
    return `Created human-review-needed task artifact: ${relative}\n`;
}
//# sourceMappingURL=tasks.js.map