import type { SupportedTool } from "../core/types.js";

export function configTemplate(projectName: string, tools: SupportedTool[]): string {
  const toolLines = tools.map((tool) => `  - ${tool}`).join("\n");
  return `# .codewiki/config.yml
version: 1

project:
  name: "${projectName}"
  description: "Brief project description for LLM context"

tools:
${toolLines}

wiki:
  path: wiki/
  raw_path: raw/

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
name: example-entity
files: [src/example.ts]
file_hashes:
  src/example.ts: TODO_SHA256
linked_issues: []
linked_lessons: []
last_updated: TODO_DATE
approved: false
verified_by: human
---
# example-entity

## Purpose
Describe the module, service, or component.

## Key Files
- \`src/example.ts\` — Replace with real file responsibilities.

## Dependencies
- Replace with direct dependencies.

## Known Issues
- Link stable issue pages with \`[[ISSUE-XXX]]\`.

## Lessons Learned
- Link verified lessons with \`[[LESSON-XXX]]\`.

## Current Status
Human review needed before this template becomes a wiki fact.
`;

export const decisionTemplate = `---
type: decision
id: DEC-XXX
status: proposed
date: TODO_DATE
approved: false
verified_by: human
---
# DEC-XXX: Decision title

## Context
What problem or force required a decision?

## Decision
What was chosen?

## Consequences
What tradeoffs follow from this choice?

## Status
Use proposed, accepted, superseded, or rejected after human review.
`;

export const lessonTemplate = `---
type: lesson
id: LESSON-XXX
related_files: []
related_entities: []
verified: false
verified_by: human
approved: false
date: TODO_DATE
---
# LESSON-XXX: Lesson title

## What happened
Describe the attempted approach or observed behavior.

## What went wrong
Capture the false assumption, failure mode, or gotcha.

## The fix
Describe the verified correction.

## Verification
Human approval and evidence are required before this becomes wiki knowledge.

## Takeaway
State the reusable rule future agents should follow.
`;

export const issueTemplate = `---
type: issue
id: ISSUE-XXX
status: open
resolved_by: ""
related_files: []
related_entities: []
verified_by: human
approved: false
---
# ISSUE-XXX: Issue title

## Problem
Known trap, pitfall, or unresolved risk.

## Impact
What breaks or becomes misleading?

## Detection
How future agents/developers can recognize it.

## Resolution
When resolved, keep this file in place and set \`status: resolved\` plus \`resolved_by: LESSON-XXX\` in frontmatter.
`;

export const sourceSummaryTemplate = `---
type: source-summary
source: raw/example.md
related_pages: []
verified_by: human
approved: false
date: TODO_DATE
---
# Source Summary: example

## Source
Link to the immutable raw markdown source.

## Key Takeaways
- Human-reviewed summary bullets go here.

## Related Wiki Updates Proposed
- Entity/decision/issue/lesson pages that may need changes.

## Approval Boundary
PROPOSAL ONLY — no wiki files were modified without approval.
`;

export const initialIndex = `# CodeWiki Index

Content-oriented catalog of human-approved wiki pages. Query and ingest commands read this first before selecting matched pages.

## Entities

## Decisions

## Lessons

## Issues

## Sources
`;

export const initialLog = `# CodeWiki Log

Append-only operation log. Entries are added only after human-approved wiki updates.
`;
