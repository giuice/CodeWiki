import path from "node:path";

import { ensureInsideRoot } from "../core/files.js";
import { chmodExecutable, copyTemplateDir } from "./adapters/base.js";
import type { ReportEntry } from "./reporter.js";

const CODEWIKI_HOOKS_DIR = ".codewiki/hooks";

export interface SharedHookInstallOptions {
  root: string;
  force: boolean;
  templateDir: string;
}

function toFailure(pathname: string, error: unknown): ReportEntry {
  return {
    action: "failed",
    path: pathname,
    reason: error instanceof Error ? error.message : String(error)
  };
}

export async function installSharedHooks(options: SharedHookInstallOptions): Promise<ReportEntry[]> {
  const entries = await copyTemplateDir(
    path.join(options.templateDir, "hooks"),
    ensureInsideRoot(options.root, CODEWIKI_HOOKS_DIR),
    options.force,
    options.root
  );

  const updatedEntries = [...entries];

  for (const [index, entry] of updatedEntries.entries()) {
    if (!entry.path.endsWith(".sh") || entry.action === "failed" || entry.action === "skipped") {
      continue;
    }

    try {
      await chmodExecutable(ensureInsideRoot(options.root, entry.path));
    } catch (error) {
      updatedEntries[index] = toFailure(entry.path, error);
    }
  }

  return updatedEntries;
}
