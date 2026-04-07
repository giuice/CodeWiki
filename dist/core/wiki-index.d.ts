import type { CodeWikiConfig, PageMatch } from "./types.js";
export declare function termsFromText(text: string): string[];
export declare function findRelevantPages(root: string, config: CodeWikiConfig, query: string, limit?: number): Promise<{
    index: string;
    matches: PageMatch[];
    readOrder: string[];
}>;
