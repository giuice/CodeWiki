---
name: codewiki-lint
description: Check wiki for contradictions, orphans, stale content, and drift
allowed-tools: [Read, Glob, Grep, Bash]
---

# CodeWiki Lint

<purpose>
Inspect the wiki for structural and content health problems so the knowledge base keeps compounding
instead of silently drifting out of sync with the project.
</purpose>

<process>
## Step 1: Load the wiki catalog
- Read `wiki/index.md` first.
- Glob `wiki/**/*.md` to inventory every wiki page currently present.
- Read `wiki/_backlinks.json` to identify high-importance pages (many backlinks) versus orphaned pages (zero backlinks).

## Step 2: Detect contradictions
- Look for conflicting claims about the same entity, decision, issue status, or file ownership.
- Report the conflicting pages and the statements that disagree.

## Step 3: Detect orphaned pages
- Find pages that exist under `wiki/` but are not listed in `wiki/index.md`.
- Cross-reference with `wiki/_backlinks.json`: pages with zero backlinks and missing index coverage are strong orphan candidates.
- Flag each orphan with its path and likely category.

## Step 4: Detect stale content
- Search for references to deleted, renamed, or missing project files.
- Flag claims that appear to describe code paths or behaviors that no longer exist.

## Step 5: Detect missing cross-references
- Find pages that should link to each other but do not.
- Prefer high-value gaps: entity-to-decision, issue-to-lesson, source-to-entity.

## Step 6: Detect template drift
- Compare representative pages against `.codewiki/templates/` expectations.
- Flag pages whose structure has drifted so far that future maintenance becomes unreliable.

## Step 7: Report findings
- Output a structured report grouped by severity:
  - HIGH: contradictions or materially stale claims
  - MEDIUM: orphan pages or broken cross-references
  - LOW: template drift, thin pages, discoverability gaps
- If the wiki looks healthy, say so explicitly and list any small improvement opportunities.

## Step 8: Boundaries
- This is a read-only lint pass.
- Do not edit files from this command.
</process>