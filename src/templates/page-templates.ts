export function entityTemplate(): string {
  return `---\ntype: entity\nname: example-entity\nfiles: []\nfile_hashes:\n  path/to/file.ts: sha256-placeholder\nlinked_issues: []\nlinked_lessons: []\nlast_updated: YYYY-MM-DD\napproved: false\nverified_by: human\n---\n# Entity Name\n\n## Purpose\nDescribe the module, service, or component.\n\n## Key Files\n- \`path/to/file.ts\` — Why it matters.\n\n## Dependencies\n- Internal/external dependencies that shape future work.\n\n## Known Issues\n- [[ISSUE-XXX]] — Known trap.\n\n## Lessons Learned\n- [[LESSON-XXX]] — Verified learning.\n\n## Current Status\nHuman-reviewed status notes.\n`;
}

export function decisionTemplate(): string {
  return `---\ntype: decision\nid: DEC-XXX\nstatus: proposed\ndate: YYYY-MM-DD\napproved: false\nverified_by: human\n---\n# DEC-XXX: Decision Title\n\n## Context\nWhat forces led to this decision?\n\n## Decision\nWhat was decided?\n\n## Consequences\nWhat tradeoffs and follow-up checks matter?\n`;
}

export function lessonTemplate(): string {
  return `---\ntype: lesson\nid: LESSON-XXX\nrelated_files: []\nrelated_entities: []\nverified: false\nverified_by: human\napproved: false\ndate: YYYY-MM-DD\n---\n# LESSON-XXX: Lesson Title\n\n## What happened\nDescribe the attempt or incident.\n\n## What went wrong\nCapture the false assumption or failure mode.\n\n## The fix\nCapture the verified correction.\n\n## Verification\nHuman-confirmed evidence required before this becomes accepted wiki knowledge.\n\n## Takeaway\nShort rule future agents should follow.\n`;
}

export function issueTemplate(): string {
  return `---\ntype: issue\nid: ISSUE-XXX\nstatus: open\nresolved_by: null\nrelated_files: []\nlinked_lessons: []\nverified_by: human\napproved: false\ndate: YYYY-MM-DD\n---\n# ISSUE-XXX: Issue Title\n\n## Problem\nKnown gotcha, trap, or agent pitfall.\n\n## How to recognize it\nSignals future agents should watch for.\n\n## Current workaround\nKnown mitigation while status is open.\n\n## Resolution\nIf status is resolved, link the stable lesson in \`resolved_by: LESSON-XXX\` without moving this file.\n`;
}

export function sourceSummaryTemplate(rawSource = "raw/example.md"): string {
  return `---\ntype: source-summary\nsource: ${rawSource}\nrelated_pages: []\nverified_by: human\napproved: false\ndate: YYYY-MM-DD\n---\n# Source Summary: ${rawSource}\n\n## Source\n- \`${rawSource}\`\n\n## Key takeaways\n- Human/agent-reviewed summary point.\n\n## Related pages to update\n- Candidate wiki pages that may need changes after human approval.\n\n## Proposed wiki updates\nNo update is applied until a human approves the proposal.\n`;
}

export const PAGE_TEMPLATES = {
  "entity.md": entityTemplate,
  "decision.md": decisionTemplate,
  "lesson.md": lessonTemplate,
  "issue.md": issueTemplate,
  "source-summary.md": () => sourceSummaryTemplate(),
} as const;
