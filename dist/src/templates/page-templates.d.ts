export declare function entityTemplate(): string;
export declare function decisionTemplate(): string;
export declare function lessonTemplate(): string;
export declare function issueTemplate(): string;
export declare function sourceSummaryTemplate(rawSource?: string): string;
export declare const PAGE_TEMPLATES: {
    readonly "entity.md": typeof entityTemplate;
    readonly "decision.md": typeof decisionTemplate;
    readonly "lesson.md": typeof lessonTemplate;
    readonly "issue.md": typeof issueTemplate;
    readonly "source-summary.md": () => string;
};
