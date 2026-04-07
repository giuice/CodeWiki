import type { PageMatch } from "./types.js";
export declare function tokenize(value: string): string[];
export declare function readIndexFirst(root: string, wikiPath?: string): Promise<{
    indexText: string;
    readOrder: string[];
}>;
export declare function matchWikiPages(root: string, question: string, wikiPath?: string, limit?: number): Promise<{
    matches: PageMatch[];
    readOrder: string[];
}>;
