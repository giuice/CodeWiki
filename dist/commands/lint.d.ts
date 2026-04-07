import type { LintFinding } from "../core/types.js";
export declare function collectLintFindings(root?: string): Promise<LintFinding[]>;
export declare function lintCommand(root?: string): Promise<string>;
