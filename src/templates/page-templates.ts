export interface PageTemplateInput {
  projectName: string;
}

function escapeDoubleQuotedYaml(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
}

export function configTemplate(projectName: string, tools: readonly string[]): string {
  const escapedProjectName = escapeDoubleQuotedYaml(projectName);

  return `version: 1
project:
  name: "${escapedProjectName}"
  description: "Brief project description for LLM context"
tools:
${tools.map((tool) => `  - ${tool}`).join("\n")}
wiki:
  path: "wiki/"
  raw_path: "raw/"
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
raw_source: raw/example.md
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

## Lessons

## Issues

## Sources
`;
}

export const logTemplate = `---
type: log
---

# CodeWiki Log

## Initial scaffold

- CodeWiki initialized. Future updates require human approval.
`;
