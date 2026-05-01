import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDir, ensureInsideRoot, exists, readTextIfExists, relativePath } from "../../core/files.js";
import type { SupportedTool } from "../../core/types.js";
import { mergeMarkerSection } from "../merge.js";
import type { ReportEntry } from "../reporter.js";
import { chmodExecutable, copyTemplateDir, copyTemplateFile } from "./base.js";
import type { AdapterInstallOptions, ToolAdapter } from "./types.js";

const GITHUB_HOOKS_DIR = ".github/hooks";
const COPILOT_CODEWIKI_HOOKS_DIR = ".github/hooks/codewiki";
const COPILOT_HOOKS_FILE = ".github/hooks/codewiki-hooks.json";
const COPILOT_INSTRUCTIONS_FILE = ".github/copilot-instructions.md";

function toFailure(pathname: string, error: unknown): ReportEntry {
  return {
    action: "failed",
    path: pathname,
    reason: error instanceof Error ? error.message : String(error)
  };
}

async function readTemplateScripts(sourceDir: string): Promise<string[]> {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sh"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export class CopilotAdapter implements ToolAdapter {
  tool: SupportedTool = "copilot";

  async install(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const report: ReportEntry[] = [];

    await Promise.all([
      ensureDir(options.root, GITHUB_HOOKS_DIR),
      ensureDir(options.root, COPILOT_CODEWIKI_HOOKS_DIR)
    ]);

    const hookEntries = await this.copyHookWrappers(options);
    report.push(...(await this.applyHookPermissions(options, hookEntries)));
    report.push(await this.writeHooksConfig(options));
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

  private async copyHookWrappers(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const entries: ReportEntry[] = [];
    const sourceDir = path.join(options.templateDir, "copilot", "hooks");
    const targetDir = ensureInsideRoot(options.root, COPILOT_CODEWIKI_HOOKS_DIR);

    void this.copyAssetDirectory;

    for (const filename of await readTemplateScripts(sourceDir)) {
      const templatePath = path.join(sourceDir, filename);
      const targetPath = path.join(targetDir, filename);
      const displayPath = relativePath(options.root, targetPath);

      try {
        const result = await copyTemplateFile(templatePath, targetPath, options.force);
        entries.push({ ...result, path: displayPath });
      } catch (error) {
        entries.push(toFailure(displayPath, error));
      }
    }

    return entries;
  }

  private async applyHookPermissions(
    options: AdapterInstallOptions,
    hookEntries: ReportEntry[]
  ): Promise<ReportEntry[]> {
    const updatedEntries = [...hookEntries];

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

  private async writeHooksConfig(options: AdapterInstallOptions): Promise<ReportEntry> {
    const hooksPath = ensureInsideRoot(options.root, COPILOT_HOOKS_FILE);
    const displayPath = relativePath(options.root, hooksPath);
    const templatePath = path.join(options.templateDir, "copilot", "hooks", "codewiki-hooks.json");

    try {
      const existed = await exists(hooksPath);
      const existingText = (await readTextIfExists(hooksPath)) ?? "";
      const templateText = await readFile(templatePath, "utf8");

      if (!options.force && existingText === templateText) {
        return { action: "skipped", path: displayPath, reason: "exists" };
      }

      if (!options.force && existed && existingText !== templateText) {
        await writeFile(hooksPath, templateText, "utf8");
        return { action: "replaced", path: displayPath };
      }

      await writeFile(hooksPath, templateText, "utf8");
      return { action: existed ? "replaced" : "created", path: displayPath };
    } catch (error) {
      return toFailure(displayPath, error);
    }
  }

  private async mergeInstructions(options: AdapterInstallOptions): Promise<ReportEntry> {
    const instructionsPath = ensureInsideRoot(options.root, COPILOT_INSTRUCTIONS_FILE);
    const displayPath = relativePath(options.root, instructionsPath);
    const templatePath = path.join(options.templateDir, "copilot", "instructions.md");

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
