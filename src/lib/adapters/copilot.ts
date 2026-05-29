import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDir, ensureInsideRoot, exists, readTextIfExists, relativePath } from "../../core/files.js";
import type { SupportedTool } from "../../core/types.js";
import { deduplicateHookEntries, mergeMarkerSection } from "../merge.js";
import type { ReportEntry } from "../reporter.js";
import { chmodExecutable, copyTemplateDir, copyTemplateFile } from "./base.js";
import type { AdapterInstallOptions, ToolAdapter } from "./types.js";

const GITHUB_HOOKS_DIR = ".github/hooks";
const COPILOT_CODEWIKI_HOOKS_DIR = ".github/hooks/codewiki";
const COPILOT_AGENTS_DIR = ".github/agents";
const COPILOT_HOOKS_FILE = ".github/hooks/codewiki-hooks.json";
const COPILOT_INSTRUCTIONS_FILE = ".github/copilot-instructions.md";
const LEGACY_COPILOT_CODEWIKI_HOOKS = [
  ".github/hooks/codewiki/pre-tool-use.sh",
  ".github/hooks/codewiki/post-tool-use.sh",
  ".github/hooks/codewiki/agent-stop.sh",
  ".codewiki/hooks/session-end.sh"
] as const;

function toFailure(pathname: string, error: unknown): ReportEntry {
  return {
    action: "failed",
    path: pathname,
    reason: error instanceof Error ? error.message : String(error)
  };
}

async function readTemplateHookWrappers(sourceDir: string): Promise<string[]> {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && (entry.name.endsWith(".sh") || entry.name.endsWith(".mjs")))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function isLegacyCodeWikiHooksConfig(value: string): boolean {
  return LEGACY_COPILOT_CODEWIKI_HOOKS.some((fragment) => value.includes(fragment));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hookCommandText(value: unknown): string {
  if (!isRecord(value)) return "";
  return ["bash", "powershell", "command"].map((key) => typeof value[key] === "string" ? value[key] : "").join("\n");
}

function isLegacyCodeWikiHookEntry(value: unknown): boolean {
  const commandText = hookCommandText(value);
  return LEGACY_COPILOT_CODEWIKI_HOOKS.some((fragment) => commandText.includes(fragment));
}

function mergeLegacyHooksConfig(existingText: string, templateText: string): string {
  const existing = JSON.parse(existingText) as Record<string, unknown>;
  const template = JSON.parse(templateText) as Record<string, unknown>;
  const existingHooks = isRecord(existing.hooks) ? existing.hooks : {};
  const templateHooks = isRecord(template.hooks) ? template.hooks : {};
  const mergedHooks: Record<string, unknown> = { ...existingHooks };

  for (const [eventName, existingEntries] of Object.entries(existingHooks)) {
    if (!Array.isArray(existingEntries)) continue;
    mergedHooks[eventName] = existingEntries.filter((entry) => !isLegacyCodeWikiHookEntry(entry));
  }

  for (const [eventName, templateEntries] of Object.entries(templateHooks)) {
    if (!Array.isArray(templateEntries)) continue;
    const existingEntries = Array.isArray(mergedHooks[eventName]) ? mergedHooks[eventName] : [];
    mergedHooks[eventName] = deduplicateHookEntries([...existingEntries, ...templateEntries]);
  }

  return `${JSON.stringify({ ...existing, version: template.version ?? existing.version, hooks: mergedHooks }, null, 2)}\n`;
}

export class CopilotAdapter implements ToolAdapter {
  tool: SupportedTool = "copilot";

  async install(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const report: ReportEntry[] = [];

    await Promise.all([
      ensureDir(options.root, GITHUB_HOOKS_DIR),
      ensureDir(options.root, COPILOT_CODEWIKI_HOOKS_DIR),
      ensureDir(options.root, COPILOT_AGENTS_DIR)
    ]);

    const hookEntries = await this.copyHookWrappers(options);
    report.push(...(await this.applyHookPermissions(options, hookEntries)));
    report.push(
      ...(await this.copyAssetDirectory(
        path.join(options.templateDir, "copilot", "agents"),
        ensureInsideRoot(options.root, COPILOT_AGENTS_DIR),
        options
      ))
    );
    report.push(await this.writeHooksConfig(options));
    report.push(await this.mergeInstructions(options));

    return report;
  }

  private async copyHookWrappers(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const entries: ReportEntry[] = [];
    const sourceDir = path.join(options.templateDir, "copilot", "hooks");
    const targetDir = ensureInsideRoot(options.root, COPILOT_CODEWIKI_HOOKS_DIR);

    for (const filename of await readTemplateHookWrappers(sourceDir)) {
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

  private async copyAssetDirectory(
    sourceDir: string,
    targetDir: string,
    options: AdapterInstallOptions
  ): Promise<ReportEntry[]> {
    return copyTemplateDir(sourceDir, targetDir, options.force, options.root);
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

      if (!options.force && existed && !isLegacyCodeWikiHooksConfig(existingText)) {
        return {
          action: "skipped",
          path: displayPath,
          reason: existingText === templateText ? "exists" : "exists; use --force to replace"
        };
      }

      const nextText = !options.force && existed && isLegacyCodeWikiHooksConfig(existingText)
        ? mergeLegacyHooksConfig(existingText, templateText)
        : templateText;
      await writeFile(hooksPath, nextText, "utf8");
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
