---
description: Generate a Product Requirements Document from a feature idea
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
argument-hint: <feature-description>
---

# CodeWiki PRD

<purpose>
Turn a feature idea into a concrete Product Requirements Document that fits the current codebase.
Use the existing repository and wiki as context, preserve the original clarifying-question workflow,
and support both mentorship mode and fast mode.
</purpose>

<process>
## Step 1: Capture the request
- Treat `$ARGUMENTS` as the feature description.
- If the feature description is missing, ask the user to describe the feature first.

## Step 2: Choose the interaction mode
- If `$ARGUMENTS` contains `--fast` or `fast`, switch to fast mode.
- Otherwise default to mentorship mode.
- In mentorship mode, ask clarifying questions before writing the PRD. Use lettered or numbered
  options so the user can answer quickly.

## Step 3: Research current state with subagents
- Use `Task` to spawn parallel research agents:
  1. one agent reads architecture, schema, and project docs
  2. one agent searches the codebase for related features, patterns, and reusable modules
- Synthesize their findings before drafting the PRD.

## Step 4: Ask clarifying questions in mentorship mode
- Focus on the what and why:
  - problem or goal
  - target user
  - core functionality
  - user stories
  - acceptance criteria
  - scope boundaries
  - data requirements
  - design considerations
  - edge cases
- In fast mode, skip the clarifying questions and make reasonable assumptions explicit in the PRD.

## Step 5: Draft the PRD
- Use this structure:
  1. Introduction / Overview
  2. Goals
  3. User Stories
  4. Functional Requirements
  5. Non-Goals
  6. Design Considerations
  7. Technical Considerations
  8. Success Metrics
  9. Open Questions
- Keep requirements explicit, unambiguous, and implementation-ready without junior-developer framing.

## Step 6: Save the PRD
- Save the document as `tasks/[n]-prd-[feature-name].md`.
- Use a zero-padded 4-digit sequence such as `0001-prd-example-feature.md`.
- If a filename collision exists, increment the sequence rather than overwriting.

## Step 7: Boundaries
- Do not start implementing the feature from this command.
- Do not create commits automatically; the user controls git operations.
</process>
