export interface WikiPageMatch {
    path: string;
    score: number;
    excerpt: string;
}
export declare function readIndexFirst(root: string, wikiPath: string): Promise<string>;
export declare function findRelevantPages(root: string, wikiPath: string, query: string, limit?: number): Promise<WikiPageMatch[]>;
export declare function readWikiPages(root: string, matches: WikiPageMatch[]): Promise<Array<WikiPageMatch & {
    content: string;
}>>;
