import { CodeWikiConfig, SupportedTool } from "./types.js";
export declare const DEFAULT_CONFIG_RELATIVE_PATH = ".codewiki/config.yml";
export declare function parseTools(rawTools: string): SupportedTool[];
export declare function parseConfigYaml(yaml: string): CodeWikiConfig;
export declare function readConfig(root: string): Promise<CodeWikiConfig>;
export declare function defaultConfigYaml(projectName: string, tools: SupportedTool[]): string;
