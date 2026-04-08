import { chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { exists } from "../../core/files.js";
import type { ReportEntry } from "../reporter.js";

export async function copyTemplateFile(
  templatePath: string,
  targetPath: string,
  force: boolean
): Promise<ReportEntry> {
  const existed = await exists(targetPath);
  if (existed && !force) {
    return { action: "skipped", path: targetPath, reason: "exists" };
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  const content = await readFile(templatePath, "utf8");
  await writeFile(targetPath, content, "utf8");
  return { action: existed ? "replaced" : "created", path: targetPath };
}

export async function chmodExecutable(filePath: string): Promise<void> {
  await chmod(filePath, 0o755);
}

export async function copyTemplateDir(
  srcDir: string,
  destDir: string,
  force: boolean,
  displayRoot: string
): Promise<ReportEntry[]> {
  const entries: ReportEntry[] = [];

  async function walk(currentSrc: string, currentDest: string): Promise<void> {
    const items = await readdir(currentSrc, { withFileTypes: true });

    for (const item of items) {
      const srcPath = path.join(currentSrc, item.name);
      const destPath = path.join(currentDest, item.name);

      if (item.isDirectory()) {
        await walk(srcPath, destPath);
        continue;
      }

      if (!item.isFile()) {
        continue;
      }

      const displayPath = path.relative(displayRoot, destPath).split(path.sep).join("/");
      const result = await copyTemplateFile(srcPath, destPath, force);
      entries.push({ ...result, path: displayPath });
    }
  }

  await walk(srcDir, destDir);
  return entries;
}