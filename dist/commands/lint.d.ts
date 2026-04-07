import type { LintFinding } from "../core/types.js";
export declare function collectLintFindings(root?: string): Promise<LintFinding[]>;
export declare function lintCommand(_args: string[], root?: string): Promise<string>;
