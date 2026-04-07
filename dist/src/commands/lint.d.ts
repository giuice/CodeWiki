import { LintFinding } from "../core/types.js";
export declare function collectLintFindings(cwd: string): Promise<LintFinding[]>;
export declare function runLint(cwd: string): Promise<string>;
