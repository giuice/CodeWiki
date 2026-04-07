export interface ParsedFrontmatter {
    data: Record<string, unknown>;
    body: string;
}
export declare function parseFrontmatter(markdown: string): ParsedFrontmatter;
