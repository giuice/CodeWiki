---
description: Converts a CodeWiki PRD into implementation phases, actionable tasks, and relevant files. Use when codewiki-prd has produced a PRD, a PRD exists but no phase plan exists, the user asks to break down work, or codewiki-process needs an execution-ready plan.
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
argument-hint: <prd-file-path>
---

# CodeWiki Tasks

<purpose>
Convert a PRD into an implementation phase plan that reflects both the requested behavior and the
current codebase. Default to the two-step phases then tasks interaction model, with
`--fast` available for one-pass generation when the user explicitly asks for speed.
</purpose>

<process>
## Step 1: Resolve the task directory
- Read `.codewiki/config.yml` if it exists.
- Use `wiki.tasks_path` as the PRD/task directory when present.
- If `wiki.tasks_path` is missing, use `.codewiki/tasks/`.

## Step 2: Resolve the PRD
- Treat `$ARGUMENTS` as the PRD path.
- Ignore mode flags such as `--fast` when resolving the path.
- If the path is relative and does not exist, also try resolving it under the task directory.
- If no path was provided, search the task directory for `*-prd-*.md`.
- If exactly one PRD exists, use it.
- If multiple PRDs exist, prefer the most recently modified PRD and tell the user which one you chose. If that choice is ambiguous or risky, ask the user which PRD file to use.
- Read the PRD in full before generating tasks.

## Step 3: Choose the interaction mode
- If `$ARGUMENTS` contains `--fast`, switch to fast mode.
- Otherwise default to interactive mode.

## Step 4: Analyze the current codebase with subagents
- Use `Task` for a two-agent split:
  1. an analyze agent reads the PRD, project config, and existing feature patterns
  2. a generate agent turns that analysis into the phase/task breakdown
- Reuse existing modules and utilities whenever possible instead of duplicating work.

## Step 5: Generate phases
- Produce only the main high-level phase headings first.
- Base them on the PRD, existing architecture, reusable code, and likely test coverage needs.
- Keep the phase count practical and implementation-oriented.
- Do not generate checkbox subtasks yet in interactive mode.
- In interactive mode, Step 5 output is only the phase list for user approval.
- After the user responds `Go`, Step 7 expands those approved phases into checkbox subtasks inside the final saved phase plan.

## Step 6: Preserve the interactive gate
- In interactive mode, stop after the phases and tell the user:
  "I have generated the high-level phases based on the PRD. Ready to generate the tasks?
  Respond with 'Go' to proceed."
- Wait for "Go" before expanding the phase plan.
- In fast mode, skip the pause and generate phases plus tasks in one pass.

## Step 7: Generate tasks and relevant files
- Add a `Relevant Files` section with expected implementation and test files.
- Add a `Reusable Utilities, Patterns, and Constraints` section when useful.
- Break each approved phase into smaller actionable checkbox tasks directly under that phase.
- Use hierarchical numbering for tasks, for example `1.1`, `1.2`, `2.1`.
- Each task must name a concrete action, likely target file or existing pattern, and expected verification.
- Each task must include a `read_first` line listing the smallest useful set of files the executor should read before editing.
- Each task must include `acceptance_criteria` bullets with objective pass/fail checks.
- Acceptance criteria must be verifiable by file read, grep, command output, test result, or direct user-visible behavior.
- Do not create tasks that merely restate or paraphrase the phase title.
- Do not add a separate `Subtask Progress`, `Progress`, or duplicate checklist section unless the user explicitly asks for it.
- Keep every task tied to the PRD scope and current codebase.

## Step 7.5: Anti-thin validation pass
- Before saving, review the generated phase plan.
- If any phase has no concrete child tasks, expand it.
- If any task can be understood only by rereading the PRD, add implementation detail.
- If any task lacks `read_first`, add it.
- If any task lacks `acceptance_criteria`, add concrete criteria.
- If any task only repeats the phase title, replace it.
- Do not save an anemic task list.

## Step 8: Save the phase plan
- Save the file to `[task-directory]/tasks-[prd-file-name].md`.
- Keep the output in Markdown and preserve phase/task numbering.

## Step 9: Boundaries
- Do not create commits automatically; the user controls git operations.
- Keep the final phase plan aligned to the PRD instead of speculative stretch work.
</process>
