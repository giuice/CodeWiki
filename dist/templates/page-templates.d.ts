export interface PageTemplateInput {
    projectName: string;
}
export declare function configTemplate(projectName: string, tools: readonly string[]): string;
export declare const entityTemplate = "---\ntype: entity\nid: ENTITY-001\nname: Example Entity\nstatus: active\nkey_files: []\nfile_hashes: {}\nlinked_issues: []\nlinked_lessons: []\nverified_by: human\napproved: false\n---\n\n# Example Entity\n\n## Purpose\n\nDescribe the entity and why it matters.\n\n## Key Files\n\n- Add source files after human review.\n\n## Current Behavior\n\nRecord verified behavior only.\n\n## Open Questions\n\n- None yet.\n";
export declare const decisionTemplate = "---\ntype: decision\nid: ADR-001\nstatus: proposed\ndate: YYYY-MM-DD\ndeciders: []\napproved: false\n---\n\n# ADR-001: Decision Title\n\n## Context\n\n## Decision\n\n## Consequences\n\n## Alternatives Considered\n";
export declare const lessonTemplate = "---\ntype: lesson\nid: LESSON-001\nverified_by: human\napproved: false\nlinked_issues: []\n---\n\n# LESSON-001: Lesson Title\n\n## Trigger\n\n## Verified Lesson\n\n## Evidence\n\n## Future Guidance\n";
export declare const issueTemplate = "---\ntype: issue\nid: ISSUE-001\nstatus: open\nresolved_by: \"\"\nverified_by: human\napproved: false\n---\n\n# ISSUE-001: Issue Title\n\n## Symptom\n\n## Investigation\n\n## Resolution\n\nSet status: resolved and resolved_by: LESSON-XXX after a human-approved lesson captures the fix.\n";
export declare const sourceSummaryTemplate = "---\ntype: source-summary\nid: SOURCE-001\nraw_source: raw/example.md\nrelated_pages: []\nverified_by: human\napproved: false\n---\n\n# SOURCE-001: Source Summary\n\n## Source\n\n## Summary\n\n## Candidate Wiki Updates\n\n## Approval Checklist\n\n- [ ] Human reviewed source summary.\n- [ ] Human approved related wiki page updates.\n";
export declare function indexTemplate(projectName: string): string;
export declare const logTemplate = "---\ntype: log\n---\n\n# CodeWiki Log\n\n## Initial scaffold\n\n- CodeWiki initialized. Future updates require human approval.\n";
