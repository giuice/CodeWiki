export interface PageTemplateInput {
  projectName: string;
}

function escapeDoubleQuotedYaml(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
}

export function configTemplate(projectName: string, tools: readonly string[]): string {
  const escapedProjectName = escapeDoubleQuotedYaml(projectName);
  const renderedTools = tools.length > 0 ? `tools:\n${tools.map((tool) => `  - ${tool}`).join("\n")}` : "tools: []";

  return `version: 1
project:
  name: "${escapedProjectName}"
  description: "Brief project description for LLM context"
${renderedTools}
wiki:
  path: "wiki/"
  raw_path: "wiki/raw/"
  tasks_path: ".codewiki/tasks/"
verification:
  require_human_approval: true
  require_tests: true
  auto_log: true
ingestion:
  interactive: true
  max_pages_per_ingest: 20
lint:
  check_orphans: true
  check_contradictions: true
  check_stale_issues: true
  check_file_drift: true
`;
}

export const entityTemplate = `---
type: entity
id: ENTITY-001
name: Example Entity
status: active
key_files: []
file_hashes: {}
linked_issues: []
linked_lessons: []
verified_by: human
approved: false
---

# Example Entity

## Purpose

Describe the entity and why it matters.

## Key Files

- Add source files after human review.

## Current Behavior

Record verified behavior only.

## Open Questions

- None yet.
`;

export const decisionTemplate = `---
type: decision
id: ADR-001
status: proposed
date: YYYY-MM-DD
deciders: []
approved: false
---

# ADR-001: Decision Title

## Context

## Decision

## Consequences

## Alternatives Considered
`;

export const lessonTemplate = `---
type: lesson
id: LESSON-001
verified_by: human
approved: false
linked_issues: []
---

# LESSON-001: Lesson Title

## Trigger

## Verified Lesson

## Evidence

## Future Guidance
`;

export const issueTemplate = `---
type: issue
id: ISSUE-001
status: open
resolved_by: ""
verified_by: human
approved: false
---

# ISSUE-001: Issue Title

## Symptom

## Investigation

## Resolution

Set status: resolved and resolved_by: LESSON-XXX after a human-approved lesson captures the fix.
`;

export const sourceSummaryTemplate = `---
type: source-summary
id: SOURCE-001
raw_source: wiki/raw/articles/example.md
related_pages: []
verified_by: human
approved: false
---

# SOURCE-001: Source Summary

## Source

## Summary

## Candidate Wiki Updates

## Approval Checklist

- [ ] Human reviewed source summary.
- [ ] Human approved related wiki page updates.
`;

export function schemaTemplate(projectName: string): string {
  const escapedProjectName = escapeDoubleQuotedYaml(projectName);

  return `---
type: schema
project: "${escapedProjectName}"
---

# CodeWiki Schema

This file is the project-specific contract for CodeWiki. Read it before ingesting sources, answering wiki-grounded questions, linting, or absorbing code changes.

## Purpose

CodeWiki maintains durable, human-reviewed project knowledge as markdown. It is not query-time RAG. Raw sources are preserved as evidence; wiki pages are synthesized knowledge that the agent proposes and updates with human approval.

## Locations

- Wiki root: \`wiki/\`
- Raw sources: \`wiki/raw/\`
- Backlinks index: \`wiki/_backlinks.json\`
- Chronological log: \`wiki/log.md\`
- Content index: \`wiki/index.md\`
- Operational tasks: \`.codewiki/tasks/\`

## Source Rules

- Treat files under \`wiki/raw/\` as immutable source material.
- Store web articles in \`wiki/raw/articles/\`.
- Store papers and PDFs in \`wiki/raw/papers/\`.
- Store meeting notes, interviews, and transcripts in \`wiki/raw/transcripts/\`.
- Store specs, PRDs from outside this project, and design docs in \`wiki/raw/specs/\`.
- Store referenced images and attachments in \`wiki/raw/assets/\`.
- Corrections and interpretation belong in wiki pages, not by rewriting raw sources.

## Orientation Rule

Before any ingest, query, lint, absorb, or breakdown operation:

1. Read this \`SCHEMA.md\`.
2. Read \`wiki/index.md\`.
3. Read recent entries from \`wiki/log.md\`.
4. Read \`wiki/_backlinks.json\` when ranking, linking, or checking orphan pages.

## Page Categories

- \`wiki/entities/\`: components, modules, services, people, teams, products, or other named things.
- \`wiki/decisions/\`: architecture and product decisions.
- \`wiki/concepts/\`: recurring concepts, patterns, domain terms, and technical ideas.
- \`wiki/comparisons/\`: side-by-side analyses and tradeoff records.
- \`wiki/lessons/\`: durable lessons learned from implementation, debugging, or review.
- \`wiki/issues/\`: known issues, risks, workarounds, and resolved problems.
- \`wiki/sources/\`: summaries of raw sources.
- \`wiki/queries/\`: substantial answers worth preserving for future sessions.

## Maintenance Rules

- Every accepted wiki page change must keep \`wiki/index.md\` discoverable.
- Every accepted ingest, absorb, lint, or notable query must append to \`wiki/log.md\`.
- Every new or changed wikilink should be reflected in \`wiki/_backlinks.json\`.
- Prefer updating an existing page over creating a duplicate page.
- Create a new page when a concept or entity is central to a source or recurring across sources.
- Do not create pages for passing mentions.

## Approval Boundary

- Agents may propose wiki edits after reading current context.
- Agents must wait for explicit human approval before writing to \`wiki/\`.
- Generated proposals should list pages to create, pages to update, index/log changes, and unresolved questions.

## Contradictions

When new information conflicts with existing wiki content:

1. Check dates and source provenance.
2. Preserve both claims when the conflict is real.
3. Mark the affected page as contested or record the conflict in the page body.
4. Surface the contradiction to the user before writing changes.
`;
}

export function indexTemplate(projectName: string): string {
  const escapedProjectName = escapeDoubleQuotedYaml(projectName);

  return `---
type: index
project: "${escapedProjectName}"
---

# CodeWiki Index

This index is the first file read by \`codewiki query\` before matched pages.

## Entities

## Decisions

## Concepts

## Comparisons

## Lessons

## Issues

## Sources

## Queries
`;
}

export const logTemplate = `---
type: log
---

# CodeWiki Log

## Initial scaffold

- CodeWiki initialized. Future updates require human approval.
`;
