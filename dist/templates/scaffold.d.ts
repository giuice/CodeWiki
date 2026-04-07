import type { SupportedTool } from "../core/types.js";
export interface ScaffoldFile {
    path: string;
    content: string;
}
export declare function scaffoldDirectories(tools: readonly SupportedTool[]): string[];
export declare function scaffoldFiles(projectName: string, tools: readonly SupportedTool[]): ScaffoldFile[];
