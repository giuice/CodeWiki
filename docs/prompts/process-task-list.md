# Phase Plan Processing

Guidelines for processing CodeWiki phase plans in markdown files. This document is a lineage reference for `codewiki-process`; the live packaged prompt is `src/templates/skills/codewiki-process/SKILL.md`.

## Core Rule

Work one task at a time by default. Use `--fast` only when the user explicitly asks to continue through all remaining tasks without pausing.

## Task Directory

- Read `.codewiki/config.yml` if it exists.
- If `wiki.tasks_path` is declared, use it as the PRD/task directory.
- If `wiki.tasks_path` is not declared, use `.codewiki/tasks/`.

## Phase Plan Resolution

- Treat the non-flag portion of the request as the phase plan path.
- Treat `--fast` as a mode flag, not as part of the path.
- If a relative path does not exist, try resolving it under the task directory.
- If no phase plan path is provided, search the task directory for `tasks-*.md`.
- Prefer a phase plan with incomplete tasks. If multiple candidates are plausible, choose the most recently modified one when that is clear and tell the user; otherwise ask.
- Read the selected phase plan fully before starting work.

## Task Execution

- Identify the next incomplete task under the earliest incomplete phase.
- Before editing, read every file listed in that task's `read_first`.
- If a task lacks `read_first`, infer the smallest useful file set from `Relevant Files`, the PRD context, and the task text before making changes.
- Use the task's `acceptance_criteria` as the completion contract.
- If a non-trivial task lacks `acceptance_criteria`, add concrete criteria before implementation.
- Read existing code patterns and explain the reason for non-obvious implementation choices.
- Use focused subagents only when they help keep the current task narrow and reviewable.

## Phase Plan Maintenance

- Mark completed tasks from `[ ]` to `[x]` after verification.
- Mark a phase `[x]` only after all tasks underneath it are complete.
- Keep the `Relevant Files` section accurate.
- Add newly discovered follow-up tasks when needed.

## Verification

- Verify the task against each `acceptance_criteria` item before marking it complete.
- Run the most relevant existing tests or checks after meaningful implementation steps.
- Do not treat hook output as proof that verification passed; hook output is only a change signal.

## Pending Absorb State

- After meaningful verification, inspect `.codewiki/state/pending-absorb.jsonl` when it exists.
- Treat pending entries as hook-recorded state only. Hooks do not run updater, verifier, absorb, or any other workflow directly.
- Treat hook-provided context as optional because host runtimes differ on whether hook output reaches the agent.
- If the change created durable wiki-relevant knowledge, invoke `codewiki-wiki-updater` to propose approval-gated wiki updates.
- If the change is wiki-relevant but should be batched, explicitly defer it to `codewiki-absorb` at the next completed phase or explicit absorb request.
- After a non-trivial wiki update proposal, invoke `codewiki-verifier` for read-only contradiction, reference, frontmatter, index, log, and backlink review before applying approved wiki edits.
- Never write to `wiki/` without explicit approval in the current conversation.

## Interaction Model

- In interactive mode, execute one task, summarize what changed and why, then wait for the user's go-ahead.
- In `--fast` mode, continue through all remaining tasks without pausing between them and collect or defer wiki follow-ups instead of forcing approval after every task.

## Boundaries

- Do not create commits automatically for code changes or wiki changes; the user controls git operations.
- Do not silently skip failing checks or unresolved blockers.
