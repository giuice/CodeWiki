---
name: codewiki-breakdown
description: Find undocumented entities referenced in wiki and propose new pages
argument-hint: ""
allowed-tools: [Read, Glob, Grep, Bash]
---

# CodeWiki Breakdown

<purpose>
Scan the wiki for concrete entities, patterns, and decisions that are referenced but still lack a
dedicated page. Rank the strongest candidates by backlink count so the most important knowledge
gaps get filled first.
</purpose>

<process>
## Step 1: Load backlink index
- Read `wiki/_backlinks.json` first.
- If it is missing or empty, scan `wiki/**/*.md` for `[[wikilink]]` references and build the backlink index before continuing.

## Step 2: Load wiki inventory
- Read `wiki/index.md`.
- Use `Glob` on `wiki/**/*.md` to inventory all existing wiki pages.

## Step 3: Find undocumented references
- For each `[[wikilink]]` target surfaced by the backlink index, check whether a corresponding wiki page exists.
- Collect the targets that are referenced but have no dedicated page.

## Step 4: Scan code for additional candidates
- Grep the codebase for entity names mentioned in wiki pages but not yet documented.
- Prioritize concrete, code-backed items such as exported functions, class names, config keys, CLI flags, and environment variables.

## Step 5: Rank by importance
- Sort candidates using this order:
  - backlink count from `wiki/_backlinks.json`
  - number of wiki pages mentioning the entity
  - whether the entity is also visible in code

## Step 6: Propose batch
- Present the top 5-10 candidates with:
  - entity name
  - reference count
  - suggested wiki category (`entity`, `decision`, `lesson`, or `issue`)
  - one-line description
- Wait for user approval or selection before creating any page.

## Step 7: Create approved pages
- For each approved candidate, create the page using `.codewiki/templates/`.
- Update `wiki/index.md` with the new entries.
- Update `wiki/_backlinks.json` after the new pages and links exist.

## Step 8: Guardrails
- Never create pages without approval.
- Keep the batch size at 10 or fewer candidates per run to avoid context overload.
- If no meaningful gaps are found, say so explicitly.
</process>