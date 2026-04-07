export const SUPPORTED_TOOLS = ["claude-code", "codex", "copilot", "opencode"] as const;

export type SupportedTool = (typeof SUPPORTED_TOOLS)[number];

export interface CodeWikiConfig {
  version: number;
  project: {
    name: string;
    description: string;
  };
  tools: SupportedTool[];
  wiki: {
    path: string;
    raw_path: string;
    rawPath: string;
  };
  verification: {
    require_human_approval: boolean;
    require_tests: boolean;
    auto_log: boolean;
  };
  ingestion: {
    interactive: boolean;
    max_pages_per_ingest: number;
  };
  lint: {
    check_orphans: boolean;
    check_contradictions: boolean;
    check_stale_issues: boolean;
    check_file_drift: boolean;
  };
}

export type WriteKind = "applied" | "proposal" | "proposal-only";

export interface FileWriteRecord {
  kind: WriteKind;
  path: string;
  description: string;
}

export interface ProposalBundle {
  kind: "proposal-only";
  title: string;
  source?: string;
  relatedPages: string[];
  body: string;
}

export interface FileWritePlan {
  kind: WriteKind;
  path: string;
  description: string;
}

export interface ProposalResult {
  kind: "proposal";
  title: string;
  boundary: string;
  proposedWrites: FileWritePlan[];
  body: string;
}

export type LintSeverity = "error" | "warning" | "info";

export interface LintFinding {
  severity: LintSeverity;
  category: "required-file" | "missing-required" | "wikilink" | "broken-link" | "issue-lifecycle" | "orphan" | "file-drift" | "agent-review";
  path?: string;
  message: string;
}

export interface PageMatch {
  path: string;
  title: string;
  score: number;
  matchedTerms: string[];
  summary: string;
}
