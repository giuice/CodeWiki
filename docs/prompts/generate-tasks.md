# Rule: Generating a Phase Plan from a PRD

## Goal

To guide an AI assistant in creating a detailed, step-by-step phase plan in Markdown format based on an existing Product Requirements Document (PRD). The phase plan should guide a developer through implementation.

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/tasks/`
- **Filename:** `tasks-[prd-file-name].md` (e.g., `tasks-0001-prd-user-profile-editing.md`)

## Process

1.  **Receive PRD Reference:** The user points the AI to a specific PRD file
2.  **Analyze PRD:** The AI reads and analyzes the functional requirements, user stories, and other sections of the specified PRD.
3.  **Assess Current State & Architecture:**
    * **Review Configuration:** Analyze `package.json`, `tsconfig.json`, or equivalent to understand dependencies and versions.
    * **Search for Patterns:** Look for existing similar features in the codebase. (e.g., "If creating a new API route, read an existing API route first to match the coding style.")
    * **Check Reusability:** Explicitly list any existing components or utility functions that can be reused to avoid duplicate code.
4.  **Phase 1: Generate Phases:** Based on the PRD analysis and current state assessment, create the file and generate only the main, high-level phases required to implement the feature. Use your judgement on how many phases to use. It is likely to be about five phases. Present these phases to the user in the specified format (without tasks yet). In interactive mode, this step outputs only phase headings for approval. Inform the user: "I have generated the high-level phases based on the PRD. Ready to generate the tasks? Respond with 'Go' to proceed."
5.  **Wait for Confirmation:** Pause and wait for the user to respond with "Go".
6.  **Phase 2: Generate Tasks:** Once the user confirms, expand the approved phases into smaller, actionable checkbox tasks necessary to complete the phase. Ensure tasks logically follow from the phase, cover the implementation details implied by the PRD, and consider existing codebase patterns where relevant without being constrained by them. Each task must include `read_first` and `acceptance_criteria` entries.
7.  **Identify Relevant Files:** Based on the tasks and PRD, identify potential files that will need to be created or modified. List these under the `Relevant Files` section, including corresponding test files if applicable.
8.  **Generate Final Output:** Combine the phases, tasks, relevant files, reusable utilities/patterns/constraints, and notes into the final Markdown structure.
9.  **Save Phase Plan:** Save the generated document in the `/tasks/` directory with the filename `tasks-[prd-file-name].md`, where `[prd-file-name]` matches the base name of the input PRD file (e.g., if the input was `0001-prd-user-profile-editing.md`, the output is `tasks-0001-prd-user-profile-editing.md`).
10. **Anti-Thin Validation:** Before saving, reject tasks that merely restate phase titles, lack implementation detail, lack `read_first`, or lack objective `acceptance_criteria`.

## Output Format

The generated phase plan _must_ follow this structure:

```markdown
## Relevant Files

- `path/to/potential/file1.ts` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/file1.test.ts` - Unit tests for `file1.ts`.
- `path/to/another/file.tsx` - Brief description (e.g., API route handler for data submission).
- `path/to/another/file.test.tsx` - Unit tests for `another/file.tsx`.
- `lib/utils/helpers.ts` - Brief description (e.g., Utility functions needed for calculations).
- `lib/utils/helpers.test.ts` - Unit tests for `helpers.ts`.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Reusable Utilities, Patterns, and Constraints

- Reuse `path/to/existing/pattern.ts` for the established implementation pattern.
- Preserve existing persisted data shapes, public API names, or compatibility constraints.

## Phases

- [ ] 1.0 Phase Title
  - [ ] 1.1 [Task description 1.1]
    - read_first: `path/to/potential/file1.ts`, `path/to/file1.test.ts`
    - acceptance_criteria:
      - [Objective pass/fail check for the implementation result.]
      - [Relevant test or command verifies the task.]
  - [ ] 1.2 [Task description 1.2]
    - read_first: `path/to/another/file.tsx`
    - acceptance_criteria:
      - [Objective pass/fail check for the implementation result.]
- [ ] 2.0 Phase Title
  - [ ] 2.1 [Task description 2.1]
    - read_first: `lib/utils/helpers.ts`, `lib/utils/helpers.test.ts`
    - acceptance_criteria:
      - [Objective pass/fail check for the implementation result.]
- [ ] 3.0 Phase Title (may not require tasks if purely structural or configuration)
```

## Interaction Model

The process explicitly requires a pause after generating phases to get user confirmation ("Go") before proceeding to generate the detailed tasks. This ensures the high-level plan aligns with user expectations before diving into details.

## Target Audience

Assume the primary reader of the phase plan is a **junior developer** who will implement the feature with awareness of the existing codebase context.
