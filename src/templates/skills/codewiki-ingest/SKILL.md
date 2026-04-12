---
name: codewiki-ingest
description: Digest a raw source document into wiki pages
argument-hint: <source-file-path>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# CodeWiki Ingest

<purpose>
Read a source document, extract durable project knowledge, and propose wiki updates that keep the
project wiki current over time. Preserve the human approval boundary: do not write wiki changes
until the user approves the proposal.
</purpose>

<process>
## Step 1: Resolve the source
- Treat `$ARGUMENTS` as the source file path.
- If no path was provided, ask the user which raw file to ingest.
- Read the source and note what kind of material it is (notes, article, transcript, spec, diff).

## Step 2: Load current wiki state
- Read `wiki/index.md` first.
- Use `Glob` and `Grep` to find existing wiki pages that match the source topic.
- Read any relevant pages so you do not duplicate or overwrite existing knowledge blindly.
- Read templates from `.codewiki/templates/` before creating any new page.
- Read `wiki/_backlinks.json` to understand which pages are most referenced and interconnected.

## Step 3: Extract candidate knowledge
- Pull out candidate entities, decisions, lessons, issues, source summaries, and useful cross-links.
- Separate verified facts from open questions, speculation, or disputed claims.
- Keep the wiki grounded in what the source actually supports.

## Step 4: Cross-reference and de-duplicate
- Compare each candidate item against existing wiki pages.
- Prefer updating an existing page over creating a duplicate page when the topic already exists.
- Flag contradictions or stale claims that the new source strengthens, weakens, or overturns.

## Step 5: Propose changes
- Present a concise proposal before making edits:
  - pages to create
  - pages to update
  - `wiki/index.md` entries to add or revise
  - contradictions, gaps, and open questions
- Wait for user approval before writing any file.

## Step 6: Write approved updates
- After approval, create or update only the approved pages.
- Use `.codewiki/templates/` as the default structure for new pages.
- Update `wiki/index.md` so new material is discoverable.
- Update `wiki/_backlinks.json` by scanning all modified and new pages for `[[wikilink]]` references. Add new backlink entries; do not remove existing ones unless a link was actually deleted.
- End with a short summary of what changed and what still needs human review.

## Step 7: Guardrails
- Never mutate `wiki/` without explicit approval in the current conversation.
- Never assume a source is correct when it conflicts with already-verified wiki content.
- Never create commits automatically; the user controls git operations.
</process>