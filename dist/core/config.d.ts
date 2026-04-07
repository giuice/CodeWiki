import { type CodeWikiConfig } from "./types.js";
export declare function parseGeneratedConfig(text: string, root?: string): CodeWikiConfig;
export declare function loadConfig(root?: string): Promise<CodeWikiConfig>;
