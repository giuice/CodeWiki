export interface ParsedMarkdown {
    frontmatter: Record<string, string | string[] | Record<string, string>>;
    body: string;
}
export declare function parseMarkdownWithFrontmatter(markdown: string): ParsedMarkdown;
export declare function firstHeading(markdown: string): string | undefined;
export declare function wikilinks(markdown: string): string[];
export declare function frontmatterString(value: string | string[] | Record<string, string> | undefined): string | undefined;
