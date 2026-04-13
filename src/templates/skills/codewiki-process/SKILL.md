---
name: codewiki-process
description: Execute tasks from a task list one sub-task at a time
argument-hint: <task-file-path>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
---

# CodeWiki Process

<purpose>
Execute a task list in a controlled way that keeps progress visible, preserves the "why" behind each
change, and supports both mentorship mode and fast mode.
</purpose>

<process>
## Step 1: Resolve the task list
- Treat `$ARGUMENTS` as the task list path.
- If the path is missing, ask the user which task file to process.
- Read the task file fully before starting work.

## Step 2: Choose the interaction mode
- If `$ARGUMENTS` contains `--fast` or `fast`, switch to fast mode.
- Otherwise default to mentorship mode.

## Step 3: Find the next actionable work
- Identify the next incomplete sub-task in the list.
- Read the relevant files and existing code patterns before making changes.
- Explain the why for any non-obvious implementation choice.

## Step 4: Use focused subtask execution
- For each sub-task, use `Task` to spawn a focused subtask executor when it helps keep the work
  narrow and reviewable.
- The subtask executor should work only on the current sub-task, report what changed, and stop.

## Step 5: Update the task list as work lands
- Mark completed sub-tasks from `[ ]` to `[x]`.
- Keep the `Relevant Files` section accurate.
- Add newly discovered follow-up tasks when needed.

## Step 6: Preserve the one sub-task workflow
- In mentorship mode, execute one sub-task at a time.
- After each one sub-task completion, summarize what changed, explain why, and wait for the user's
  go-ahead before continuing.
- In fast mode, continue through all remaining sub-tasks without pausing between them.

## Step 7: Verification and finish
- Run the most relevant existing tests or checks after meaningful implementation steps.
- When the task list is complete, summarize finished work, remaining manual checks, and any new
  tasks that should be captured.

## Step 8: Boundaries
- Do not create commits automatically; the user controls git operations.
- Do not silently skip failing checks or unresolved blockers.
</process>