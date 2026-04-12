---
name: codewiki-absorb
description: Extract knowledge from recent code changes into wiki
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# CodeWiki Absorb

<purpose>
Read recent code changes, cross-reference them against the local wiki, and propose updates that
capture durable project knowledge. This is code-focused absorption: reason from git diffs and
changed files, not from raw documents. Preserve the human approval boundary at all times.
</purpose>

<process>
## Step 1: Gather recent changes
- Run `git diff HEAD~1` to inspect the latest session of work.
- If the working tree has uncommitted changes, also check `git diff --cached` and plain `git diff`.
- List the changed files and summarize what changed semantically, not line-by-line.

## Step 2: Load wiki state
- Read `wiki/index.md` first.
- Read `wiki/_backlinks.json` to see which pages are most referenced and interconnected.
- Use `Glob` on `wiki/**/*.md` to inventory the full wiki before proposing edits.

## Step 3: Cross-reference changes against wiki
- For each changed file, search the wiki for existing pages that mention it or the concepts it affects.
- Identify three buckets:
  - existing pages that need updating
  - new entities, decisions, lessons, or issues implied by the changes
  - contradictions between the new code and the current wiki narrative

## Step 4: Apply anti-cramming
- If an existing page would gain a third paragraph about the same sub-topic, propose a new dedicated page instead.
- Prefer 30 focused pages over 5 bloated ones.

## Step 5: Apply anti-thinning
- Every page you touch must get meaningfully richer.
- If a topic is mentioned in 4+ other pages, its own page must not remain a three-sentence stub.
- Flag thin pages that should be expanded while this change is fresh.

## Step 6: Update backlinks
- After proposing changes, rebuild `wiki/_backlinks.json` by scanning all wiki pages for `[[wikilink]]` references.
- Use the structure `{ "page-path": ["referencing-page-1", "referencing-page-2"] }`.

## Step 7: Propose changes
- Present a concise proposal covering:
  - pages to create
  - pages to update
  - backlink changes needed in `wiki/_backlinks.json`
  - contradictions or stale claims found
- Wait for user approval before writing any wiki files.

## Step 8: Write approved updates
- After approval, create or update only the approved pages using `.codewiki/templates/`.
- Update `wiki/index.md` and `wiki/_backlinks.json` so the wiki stays navigable.

## Step 9: Guardrails
- Never write to `wiki/` without explicit approval in the current conversation.
- Never auto-commit.
- If the detected code changes are trivial, such as whitespace or formatting only, say so and skip wiki edits.
</process>