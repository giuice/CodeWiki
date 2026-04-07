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
        rawPath: string;
    };
    verification: {
        requireHumanApproval: boolean;
        requireTests: boolean;
        autoLog: boolean;
    };
    ingestion: {
        interactive: boolean;
        maxPagesPerIngest: number;
    };
    lint: {
        checkOrphans: boolean;
        checkContradictions: boolean;
        checkStaleIssues: boolean;
        checkFileDrift: boolean;
    };
}
export type WriteKind = "applied" | "proposal";
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
export type LintCategory = "missing-required" | "broken-link" | "issue-lifecycle" | "orphan" | "file-drift" | "agent-review";
export interface LintFinding {
    severity: LintSeverity;
    category: LintCategory;
    path: string;
    message: string;
}
export interface PageMatch {
    path: string;
    title: string;
    score: number;
    matchedTerms: string[];
    summary: string;
}
