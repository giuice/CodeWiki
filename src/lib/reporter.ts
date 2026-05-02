import pc from "picocolors";

export type ReportAction = "created" | "skipped" | "replaced" | "failed";

export interface ReportEntry {
  action: ReportAction;
  path: string;
  reason?: string;
}

export interface ReportSection {
  title: string;
  entries: ReportEntry[];
}

const ACTION_SYMBOLS: Record<ReportAction, string> = {
  created: "✓",
  skipped: "⚠",
  replaced: "↻",
  failed: "✗"
};

const ACTION_ORDER: ReportAction[] = ["created", "skipped", "replaced", "failed"];

export function formatBrandBanner(): string {
  return [
    `${pc.green("  ____ ___  ____  _____ ")}${pc.magenta("__        _____ _  _____ ")}`,
    `${pc.green(" / ___/ _ \\|  _ \\| ____|")}${pc.magenta("\\ \\      / /_ _| |/ /_ _|")}`,
    `${pc.green("| |  | | | | | | |  _|  ")}${pc.magenta(" \\ \\ /\\ / / | || ' / | | ")}`,
    `${pc.green("| |__| |_| | |_| | |___ ")}${pc.magenta("  \\ V  V /  | || . \\ | | ")}`,
    `${pc.green(" \\____\\___/|____/|_____|")}${pc.magenta("   \\_/\\_/  |___|_|\\_\\___|")}`
  ].join("\n");
}

function formatActionSymbol(action: ReportAction): string {
  const symbol = ACTION_SYMBOLS[action];
  if (action === "created") return pc.green(symbol);
  if (action === "skipped") return pc.yellow(symbol);
  if (action === "replaced") return pc.cyan(symbol);
  return pc.red(symbol);
}

function formatSectionTitle(title: string): string {
  return pc.bold(pc.magenta(title));
}

export function formatReport(entries: ReportEntry[]): string {
  const lines = entries.map((entry) => {
    const detail = entry.reason ? ` (${entry.reason})` : "";
    return `  ${formatActionSymbol(entry.action)} ${entry.action.padEnd(8)} ${entry.path}${detail}`;
  });

  const counts = entries.reduce<Record<ReportAction, number>>(
    (totals, entry) => ({
      ...totals,
      [entry.action]: totals[entry.action] + 1
    }),
    { created: 0, skipped: 0, replaced: 0, failed: 0 }
  );

  const summary = ACTION_ORDER.filter((action) => counts[action] > 0)
    .map((action) => `${counts[action]} ${action}`)
    .join(", ");

  return [...lines, "", `Summary: ${summary || "0 changes"}`].join("\n");
}

export function formatSectionedReport(projectName: string, sections: ReportSection[]): string {
  const lines: string[] = [formatBrandBanner(), "", `${pc.bold("CodeWiki")} initialized for ${pc.green(projectName)}.`, ""];

  for (const section of sections) {
    if (section.entries.length === 0) {
      continue;
    }

    lines.push(`${formatSectionTitle(section.title)}:`);
    for (const entry of section.entries) {
      const detail = entry.reason ? ` (${entry.reason})` : "";
      lines.push(`  ${formatActionSymbol(entry.action)} ${entry.action.padEnd(8)} ${entry.path}${detail}`);
    }
    lines.push("");
  }

  const allEntries = sections.flatMap((section) => section.entries);
  const counts = allEntries.reduce<Record<ReportAction, number>>(
    (totals, entry) => ({
      ...totals,
      [entry.action]: totals[entry.action] + 1
    }),
    { created: 0, skipped: 0, replaced: 0, failed: 0 }
  );

  const summary = ACTION_ORDER.filter((action) => counts[action] > 0)
    .map((action) => `${counts[action]} ${action}`)
    .join(", ");

  lines.push(`Summary: ${summary || "0 changes"}`);
  return lines.join("\n");
}
