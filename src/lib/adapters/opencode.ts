import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDir, ensureInsideRoot, exists, readTextIfExists, relativePath } from "../../core/files.js";
import type { SupportedTool } from "../../core/types.js";
import { mergeMarkerSection } from "../merge.js";
import type { ReportEntry } from "../reporter.js";
import { copyTemplateDir } from "./base.js";
import type { AdapterInstallOptions, ToolAdapter } from "./types.js";

const OPENCODE_PLUGIN_DIR = ".opencode/plugins";
const OPENCODE_AGENTS_DIR = ".opencode/agents";
const OPENCODE_INSTRUCTIONS_FILE = "AGENTS.md";

function toFailure(pathname: string, error: unknown): ReportEntry {
  return {
    action: "failed",
    path: pathname,
    reason: error instanceof Error ? error.message : String(error)
  };
}

export class OpenCodeAdapter implements ToolAdapter {
  tool: SupportedTool = "opencode";

  async install(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const report: ReportEntry[] = [];

    await Promise.all([
      ensureDir(options.root, OPENCODE_PLUGIN_DIR),
      ensureDir(options.root, OPENCODE_AGENTS_DIR)
    ]);

    report.push(
      ...(await this.copyAssetDirectory(
        path.join(options.templateDir, "opencode", "plugins"),
        ensureInsideRoot(options.root, OPENCODE_PLUGIN_DIR),
        options
      ))
    );

    report.push(
      ...(await this.copyAssetDirectory(
        path.join(options.templateDir, "opencode", "agents"),
        ensureInsideRoot(options.root, OPENCODE_AGENTS_DIR),
        options
      ))
    );

    report.push(await this.mergeInstructions(options));

    return report;
  }

  private async copyAssetDirectory(
    sourceDir: string,
    targetDir: string,
    options: AdapterInstallOptions
  ): Promise<ReportEntry[]> {
    return copyTemplateDir(sourceDir, targetDir, options.force, options.root);
  }

  private async mergeInstructions(options: AdapterInstallOptions): Promise<ReportEntry> {
    const instructionsPath = ensureInsideRoot(options.root, OPENCODE_INSTRUCTIONS_FILE);
    const displayPath = relativePath(options.root, instructionsPath);
    const templatePath = path.join(options.templateDir, "opencode", "instructions.md");

    try {
      const existed = await exists(instructionsPath);
      const existingText = (await readTextIfExists(instructionsPath)) ?? "";
      const instructionContent = (await readFile(templatePath, "utf8")).trimEnd();
      const mergedText = mergeMarkerSection(existingText, instructionContent, options.force);

      if (mergedText === existingText) {
        return { action: "skipped", path: displayPath, reason: "exists" };
      }

      await writeFile(instructionsPath, mergedText, "utf8");
      return { action: existed ? "replaced" : "created", path: displayPath };
    } catch (error) {
      return toFailure(displayPath, error);
    }
  }
}
