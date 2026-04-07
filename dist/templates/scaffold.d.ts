import type { SupportedTool } from "../core/types.js";
export interface ScaffoldEntry {
    path: string;
    content?: string;
    directory?: boolean;
}
export declare function scaffoldEntries(projectName: string, tools: SupportedTool[]): ScaffoldEntry[];
