import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ensureDir, ensureInsideRoot, exists, readTextIfExists, relativePath } from "../../core/files.js";
import type { SupportedTool } from "../../core/types.js";
import { deduplicateHookEntries, deepMerge, mergeMarkerSection } from "../merge.js";
import type { ReportEntry } from "../reporter.js";
import { chmodExecutable, copyTemplateDir } from "./base.js";
import type { AdapterInstallOptions, ToolAdapter } from "./types.js";

interface ClaudeHookCommand {
  type: "command";
  command: string;
  timeout: number;
}

interface ClaudeHookMatcher {
  matcher: string;
  hooks: ClaudeHookCommand[];
}

interface ClaudeSettings extends Record<string, unknown> {
  hooks?: Record<string, unknown>;
}

const PRE_TOOL_HOOK: ClaudeHookMatcher = {
  matcher: "Write|Edit",
  hooks: [{ type: "command", command: "bash .codewiki/hooks/pre-wiki-context.sh", timeout: 10 }]
};

const POST_TOOL_HOOK: ClaudeHookMatcher = {
  matcher: "Write|Edit",
  hooks: [{ type: "command", command: "bash .codewiki/hooks/post-verify.sh", timeout: 10 }]
};

const CLAUDE_SETTINGS_PATCH: ClaudeSettings = {
  hooks: {
    PreToolUse: [PRE_TOOL_HOOK],
    PostToolUse: [POST_TOOL_HOOK]
  }
};

const HOOK_EVENT_NAMES = ["PreToolUse", "PostToolUse"] as const;
const CLAUDE_SKILLS_DIR = ".claude/skills";
const CLAUDE_AGENTS_DIR = ".claude/agents";
const CODEWIKI_HOOKS_DIR = ".codewiki/hooks";
const CLAUDE_SETTINGS_FILE = ".claude/settings.json";
const CLAUDE_INSTRUCTIONS_FILE = "CLAUDE.md";
const SESSION_END_HOOK_PATH = `${CODEWIKI_HOOKS_DIR}/session-end.sh`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toHookEntries(value: unknown): ClaudeHookMatcher[] {
  return Array.isArray(value) ? (value as ClaudeHookMatcher[]) : [];
}

function toFailure(pathname: string, error: unknown): ReportEntry {
  return {
    action: "failed",
    path: pathname,
    reason: error instanceof Error ? error.message : String(error)
  };
}

function withReason(entry: ReportEntry, reason: string): ReportEntry {
  if (!entry.reason) {
    return { ...entry, reason };
  }

  return { ...entry, reason: `${entry.reason}; ${reason}` };
}

export class ClaudeCodeAdapter implements ToolAdapter {
  tool: SupportedTool = "claude-code";

  async install(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    const report: ReportEntry[] = [];

    await Promise.all([
      ensureDir(options.root, CLAUDE_SKILLS_DIR),
      ensureDir(options.root, CLAUDE_AGENTS_DIR),
      ensureDir(options.root, CODEWIKI_HOOKS_DIR)
    ]);

    report.push(
      ...(await this.copyAssetDirectory(
        path.join(options.templateDir, "skills"),
        ensureInsideRoot(options.root, CLAUDE_SKILLS_DIR),
        options
      ))
    );

    report.push(
      ...(await this.copyAssetDirectory(
        path.join(options.templateDir, "claude", "agents"),
        ensureInsideRoot(options.root, CLAUDE_AGENTS_DIR),
        options
      ))
    );

    const hookEntries = await this.copyAssetDirectory(
      path.join(options.templateDir, "hooks"),
      ensureInsideRoot(options.root, CODEWIKI_HOOKS_DIR),
      options
    );
    report.push(...(await this.applyHookPermissions(options, hookEntries)));

    report.push(await this.mergeSettings(options));
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
      if (!entry.path.endsWith(".sh") || entry.action === "failed") {
        continue;
      }

      if (entry.action !== "skipped") {
        try {
          await chmodExecutable(ensureInsideRoot(options.root, entry.path));
        } catch (error) {
          updatedEntries[index] = toFailure(entry.path, error);
          continue;
        }
      }

      if (entry.path === SESSION_END_HOOK_PATH) {
        updatedEntries[index] = withReason(entry, "not wired to Claude lifecycle");
      }
    }

    return updatedEntries;
  }

  private async mergeSettings(options: AdapterInstallOptions): Promise<ReportEntry> {
    const settingsPath = ensureInsideRoot(options.root, CLAUDE_SETTINGS_FILE);
    const displayPath = relativePath(options.root, settingsPath);

    try {
      const existed = await exists(settingsPath);
      const existingText = (await readTextIfExists(settingsPath)) ?? "{}";
      const existingSettings = JSON.parse(existingText) as ClaudeSettings;
      const mergedSettings = deepMerge(existingSettings, CLAUDE_SETTINGS_PATCH);
      const existingHooks = isRecord(existingSettings.hooks) ? existingSettings.hooks : {};
      const mergedHooks = isRecord(mergedSettings.hooks) ? { ...mergedSettings.hooks } : {};

      for (const eventName of HOOK_EVENT_NAMES) {
        mergedHooks[eventName] = deduplicateHookEntries([
          ...toHookEntries(existingHooks[eventName]),
          ...toHookEntries(CLAUDE_SETTINGS_PATCH.hooks?.[eventName])
        ]);
      }

      mergedSettings.hooks = mergedHooks;
      const nextText = `${JSON.stringify(mergedSettings, null, 2)}\n`;
      if (nextText === existingText) {
        return { action: "skipped", path: displayPath, reason: "exists" };
      }

      await writeFile(settingsPath, nextText, "utf8");
      return { action: existed ? "replaced" : "created", path: displayPath };
    } catch (error) {
      return toFailure(displayPath, error);
    }
  }

  private async mergeInstructions(options: AdapterInstallOptions): Promise<ReportEntry> {
    const claudePath = ensureInsideRoot(options.root, CLAUDE_INSTRUCTIONS_FILE);
    const displayPath = relativePath(options.root, claudePath);
    const instructionPath = path.join(options.templateDir, "claude", "instructions.md");

    try {
      const existed = await exists(claudePath);
      const existingText = (await readTextIfExists(claudePath)) ?? "";
      const instructionContent = (await readFile(instructionPath, "utf8")).trimEnd();
      const mergedText = mergeMarkerSection(existingText, instructionContent, options.force);

      if (mergedText === existingText) {
        return { action: "skipped", path: displayPath, reason: "exists" };
      }

      await writeFile(claudePath, mergedText, "utf8");
      return { action: existed ? "replaced" : "created", path: displayPath };
    } catch (error) {
      return toFailure(displayPath, error);
    }
  }
}