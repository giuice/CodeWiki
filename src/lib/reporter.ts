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

export function formatReport(entries: ReportEntry[]): string {
  const lines = entries.map((entry) => {
    const detail = entry.reason ? ` (${entry.reason})` : "";
    return `  ${ACTION_SYMBOLS[entry.action]} ${entry.action.padEnd(8)} ${entry.path}${detail}`;
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
  const lines: string[] = [`CodeWiki initialized for ${projectName}.`, ""];

  for (const section of sections) {
    if (section.entries.length === 0) {
      continue;
    }

    lines.push(`${section.title}:`);
    for (const entry of section.entries) {
      const detail = entry.reason ? ` (${entry.reason})` : "";
      lines.push(`  ${ACTION_SYMBOLS[entry.action]} ${entry.action.padEnd(8)} ${entry.path}${detail}`);
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