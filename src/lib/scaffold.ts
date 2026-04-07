import type { SupportedTool } from "../core/types.js";
import { ensureDir, ensureInsideRoot, exists, writeFileSafe } from "../core/files.js";
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
    const targetPath = ensureInsideRoot(options.root, file.path);
    const existedBeforeWrite = await exists(targetPath);

    try {
      await writeFileSafe(options.root, file.path, file.content, options.force);
      report.push({ action: existedBeforeWrite ? "replaced" : "created", path: file.path });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Refusing to overwrite existing non-empty CodeWiki file without --force")) {
        report.push({ action: "skipped", path: file.path, reason: "exists" });
        continue;
      }

      throw error;
    }
  }

  return report;
}