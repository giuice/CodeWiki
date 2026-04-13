---
name: codewiki-tasks
description: Generate implementation tasks from a PRD
argument-hint: <prd-file-path>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
---

# CodeWiki Tasks

<purpose>
Convert a PRD into an implementation task list that reflects both the requested behavior and the
current codebase. Preserve the original two-phase interaction model while also supporting a fast
mode for one-pass generation.
</purpose>

<process>
## Step 1: Resolve the PRD
- Treat `$ARGUMENTS` as the PRD path.
- If no path was provided, ask the user which PRD file to use.
- Read the PRD in full before generating tasks.

## Step 2: Choose the interaction mode
- If `$ARGUMENTS` contains `--fast` or `fast`, switch to fast mode.
- Otherwise default to mentorship mode.

## Step 3: Analyze the current codebase with subagents
- Use `Task` for a two-agent split:
  1. an analyze agent reads the PRD, project config, and existing feature patterns
  2. a generate agent turns that analysis into the task breakdown
- Reuse existing modules and utilities whenever possible instead of duplicating work.

## Step 4: Generate parent tasks
- Produce the main high-level tasks first.
- Base them on the PRD, existing architecture, reusable code, and likely test coverage needs.
- Keep the task count practical and implementation-oriented.

## Step 5: Preserve the mentorship gate
- In mentorship mode, stop after the parent tasks and tell the user:
  "I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks?
  Respond with 'Go' to proceed."
- Wait for "Go" before expanding the task list.
- In fast mode, skip the pause and generate parent tasks plus sub-tasks in one pass.

## Step 6: Generate sub-tasks and relevant files
- Break each parent task into smaller actionable sub-tasks.
- Add a `Relevant Files` section with expected implementation and test files.
- Note reusable utilities, patterns, and constraints that matter to execution.

## Step 7: Save the task list
- Save the file to `tasks/tasks-[prd-file-name].md`.
- Keep the output in Markdown and preserve task numbering.

## Step 8: Boundaries
- Do not create commits automatically; the user controls git operations.
- Keep the final task list aligned to the PRD instead of speculative stretch work.
</process>