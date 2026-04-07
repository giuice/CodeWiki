import { SupportedTool } from "../core/types.js";
export interface ScaffoldFile {
    path: string;
    content: string;
}
export declare function scaffoldDirectories(tools: SupportedTool[]): string[];
export declare function scaffoldFiles(projectName: string, tools: SupportedTool[]): ScaffoldFile[];
