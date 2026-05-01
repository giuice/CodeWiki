import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDir, ensureInsideRoot, exists, readTextIfExists, relativePath } from "../../core/files.js";
import type { SupportedTool } from "../../core/types.js";
import { deduplicateHookEntries, deepMerge, mergeMarkerSection } from "../merge.js";
import type { ReportEntry } from "../reporter.js";
import { chmodExecutable, copyTemplateDir } from "./base.js";
import type { AdapterInstallOptions, ToolAdapter } from "./types.js";

interface CodexHooksConfig extends Record<string, unknown> {
  hooks?: Record<string, unknown>;
}

const CODEX_DIR = ".codex";
const CODEX_HOOKS_DIR = ".codex/hooks";
const CODEX_AGENTS_DIR = ".codex/agents";
const CODEX_HOOKS_FILE = ".codex/hooks.json";
const CODEX_CONFIG_FILE = ".codex/config.toml";
const CODEX_INSTRUCTIONS_FILE = "AGENTS.md";
const CODEX_HOOK_EVENT_NAMES = ["UserPromptSubmit", "PreToolUse", "PostToolUse", "Stop"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toHookEntries(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toFailure(pathname: string, error: unknown): ReportEntry {
  return {
    action: "failed",
    path: pathname,
    reason: error instanceof Error ? error.message : String(error)
  };
}

function mergeCodexHooksFeature(existingText: string, templateText: string): string {
  if (existingText.length === 0) {
    return templateText;
  }

  const lines = existingText.split(/\r?\n/);
  const featuresIndex = lines.findIndex((line) => line.trim() === "[features]");
  if (featuresIndex === -1) {
    const separator = existingText.endsWith("\n") ? "" : "\n";
    return `${existingText}${separator}\n${templateText.trimEnd()}\n`;
  }

  let nextSectionIndex = lines.length;
  for (let index = featuresIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^\s*\[[^\]]+\]\s*$/.test(line)) {
      nextSectionIndex = index;
      break;
    }
  }

  for (let index = featuresIndex + 1; index < nextSectionIndex; index += 1) {
    const line = lines[index] ?? "";
    if (/^\s*codex_hooks\s*=/.test(line)) {
      if (/^\s*codex_hooks\s*=\s*true\s*(?:#.*)?$/.test(line)) {
        return existingText;
      }

      const indent = line.match(/^\s*/)?.[0] ?? "";
      lines[index] = `${indent}codex_hooks = true`;
      return lines.join("\n");
    }
  }

  lines.splice(featuresIndex + 1, 0, "codex_hooks = true");
  return lines.join("\n");
}

export class CodexAdapter implements ToolAdapter {
  tool: SupportedTool = "codex";

  async install(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const report: ReportEntry[] = [];

    await Promise.all([
      ensureDir(options.root, CODEX_DIR),
      ensureDir(options.root, CODEX_HOOKS_DIR),
      ensureDir(options.root, CODEX_AGENTS_DIR)
    ]);

    const hookEntries = await this.copyAssetDirectory(
      path.join(options.templateDir, "codex", "hooks"),
      ensureInsideRoot(options.root, CODEX_HOOKS_DIR),
      options
    );
    report.push(...(await this.applyHookPermissions(options, hookEntries)));

    report.push(
      ...(await this.copyAssetDirectory(
        path.join(options.templateDir, "codex", "agents"),
        ensureInsideRoot(options.root, CODEX_AGENTS_DIR),
        options
      ))
    );

    report.push(await this.mergeHooks(options));
    report.push(await this.mergeConfig(options));
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

  private async mergeHooks(options: AdapterInstallOptions): Promise<ReportEntry> {
    const hooksPath = ensureInsideRoot(options.root, CODEX_HOOKS_FILE);
    const displayPath = relativePath(options.root, hooksPath);
    const templatePath = path.join(options.templateDir, "codex", "hooks.json");

    try {
      const existed = await exists(hooksPath);
      const existingText = (await readTextIfExists(hooksPath)) ?? "{}";
      const templateText = await readFile(templatePath, "utf8");
      const existingHooksConfig = JSON.parse(existingText) as CodexHooksConfig;
      const templateHooksConfig = JSON.parse(templateText) as CodexHooksConfig;
      const mergedConfig = deepMerge(existingHooksConfig, templateHooksConfig);
      const existingHooks = isRecord(existingHooksConfig.hooks) ? existingHooksConfig.hooks : {};
      const templateHooks = isRecord(templateHooksConfig.hooks) ? templateHooksConfig.hooks : {};
      const mergedHooks = isRecord(mergedConfig.hooks) ? { ...mergedConfig.hooks } : {};

      for (const eventName of CODEX_HOOK_EVENT_NAMES) {
        mergedHooks[eventName] = deduplicateHookEntries([
          ...toHookEntries(existingHooks[eventName]),
          ...toHookEntries(templateHooks[eventName])
        ]);
      }

      mergedConfig.hooks = mergedHooks;
      const nextText = `${JSON.stringify(mergedConfig, null, 2)}\n`;
      if (nextText === existingText) {
        return { action: "skipped", path: displayPath, reason: "exists" };
      }

      await writeFile(hooksPath, nextText, "utf8");
      return { action: existed ? "replaced" : "created", path: displayPath };
    } catch (error) {
      return toFailure(displayPath, error);
    }
  }

  private async mergeConfig(options: AdapterInstallOptions): Promise<ReportEntry> {
    const configPath = ensureInsideRoot(options.root, CODEX_CONFIG_FILE);
    const displayPath = relativePath(options.root, configPath);
    const templatePath = path.join(options.templateDir, "codex", "config.toml");

    try {
      const existed = await exists(configPath);
      const existingText = (await readTextIfExists(configPath)) ?? "";
      const templateText = await readFile(templatePath, "utf8");
      const nextText = mergeCodexHooksFeature(existingText, templateText);

      if (nextText === existingText) {
        return { action: "skipped", path: displayPath, reason: "exists" };
      }

      await writeFile(configPath, nextText, "utf8");
      return { action: existed ? "replaced" : "created", path: displayPath };
    } catch (error) {
      return toFailure(displayPath, error);
    }
  }

  private async mergeInstructions(options: AdapterInstallOptions): Promise<ReportEntry> {
    const instructionsPath = ensureInsideRoot(options.root, CODEX_INSTRUCTIONS_FILE);
    const displayPath = relativePath(options.root, instructionsPath);
    const templatePath = path.join(options.templateDir, "codex", "instructions.md");

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
