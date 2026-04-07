import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readConfig } from "../core/config.js";
import { ensureInsideRoot, slugify, timestampForFile } from "../core/files.js";

export async function runPrd(cwd: string, args: string[], now = new Date()): Promise<string> {
  const description = args.join(" ").trim();
  if (!description) throw new Error("Usage: codewiki prd <description>");
  const config = await readConfig(cwd);
  const rawDir = ensureInsideRoot(cwd, config.wiki.raw_path);
  await mkdir(rawDir, { recursive: true });
  const relative = `${config.wiki.raw_path.replace(/\/$/, "")}/prd-${timestampForFile(now)}-${slugify(description)}.md`;
  const target = ensureInsideRoot(cwd, relative);
  const content = `---\ntype: prd\nstatus: human-review-needed\napproved: false\nverified_by: human\ncreated_at: ${now.toISOString()}\n---\n# PRD: ${description}\n\n## Problem\nDescribe the user problem and constraints.\n\n## Goals\n- Human-review-needed.\n\n## Non-goals\n- Do not bypass CodeWiki human approval.\n\n## Acceptance Criteria\n- Requirements are reviewed by a human before implementation.\n\n## Verification Loop\nEach downstream task must run the CodeWiki verification loop and propose wiki updates for human approval only.\n`;
  await writeFile(target, content, "utf8");
  return `Created human-review-needed PRD draft: ${relative}\n`;
}
