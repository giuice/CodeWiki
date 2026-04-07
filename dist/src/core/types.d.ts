export declare const SUPPORTED_TOOLS: readonly ["claude-code", "codex", "copilot", "opencode"];
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
export type WriteKind = "applied" | "proposal-only";
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
export type LintSeverity = "error" | "warning" | "info";
export interface LintFinding {
    severity: LintSeverity;
    category: "required-file" | "wikilink" | "issue-lifecycle" | "orphan" | "file-drift" | "agent-review";
    path?: string;
    message: string;
}
