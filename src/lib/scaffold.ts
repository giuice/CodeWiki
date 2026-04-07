import type { SupportedTool } from "../core/types.js";
import { ensureDir, writeFileSafe } from "../core/files.js";
import { scaffoldDirectories, scaffoldFiles } from "../templates/scaffold.js";
import type { ReportEntry } from "./reporter.js";

export interface ScaffoldOptions {
  root: string;
  projectName: string;
  tools: readonly SupportedTool[];
  force: boolean;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ReportEntry[]> {
  const report: ReportEntry[] = [];

  for (const directory of scaffoldDirectories(options.tools)) {
    await ensureDir(options.root, directory);
    report.push({ action: "created", path: directory });
  }

  for (const file of scaffoldFiles(options.projectName, options.tools)) {
    try {
      await writeFileSafe(options.root, file.path, file.content, options.force);
      report.push({ action: options.force ? "replaced" : "created", path: file.path });
    } catch {
      report.push({ action: "skipped", path: file.path, reason: "exists" });
    }
  }

  return report;
}