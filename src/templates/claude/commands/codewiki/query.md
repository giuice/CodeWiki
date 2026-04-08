---
description: Search wiki and synthesize an answer from wiki pages
allowed-tools: [Read, Glob, Grep, Bash]
argument-hint: <question>
---

# CodeWiki Query

<purpose>
Answer a question by reading the local wiki first, then synthesizing a grounded response from the
matched wiki pages. Treat the wiki as the primary knowledge layer between the user and raw sources.
</purpose>

<process>
## Step 1: Read the query
- Treat `$ARGUMENTS` as the user question.
- If the question is missing or unclear, ask for the exact question before searching.

## Step 2: Read the wiki index first
- Read `wiki/index.md` before anything else.
- Use the index to identify candidate entity, decision, lesson, issue, and source pages.
- Read `wiki/_backlinks.json` to identify high-importance pages. Pages with many backlinks are more likely to contain authoritative answers.

## Step 3: Search for relevant pages
- Use `Grep` on the wiki for keywords, aliases, file names, and adjacent concepts from the question.
- Use `Glob` to expand from promising matches into the specific markdown pages that matter.
- Use `wiki/_backlinks.json` to prioritize pages with higher backlink counts when multiple pages match the query.
- Prefer a small set of high-signal pages over broad, noisy retrieval.

## Step 4: Read matched pages
- Read the matched wiki pages in full when they appear central to the answer.
- Note supporting evidence, contradictions, and unresolved gaps.

## Step 5: Synthesize the answer
- Answer the question directly.
- Cite the supporting wiki entries with file paths so the user can inspect them.
- Call out uncertainty when the wiki is incomplete or conflicting.

## Step 6: Handle misses explicitly
- If no relevant wiki pages are found, say so clearly.
- Suggest what kind of source or wiki page would be needed to answer the question better.

## Step 7: Boundaries
- Stay local: this is a wiki-grounded markdown search workflow, not an API call.
- Do not edit files from this command.
</process>
