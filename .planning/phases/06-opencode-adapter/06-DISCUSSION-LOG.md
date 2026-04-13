# Phase 6: OpenCode Adapter - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 06-opencode-adapter
**Areas discussed:** Plugin architecture, AGENTS.md strategy, OpenCode agents, detection and bootstrap

---

## Plugin architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Dispatcher minimo | Listen to the three agreed events, translate the minimum payload, and call the shared shell hooks. | ✓ |
| Dispatcher com normalizacao leve | Add some payload/path normalization before invoking the shared hooks. | |
| Plugin mais esperto | Put more event-specific and product logic inside the TypeScript plugin. | |
| Voce decide | Let the planner choose the approach later. | |

**User's choice:** Dispatcher minimo
**Notes:** The user explicitly pointed out that the thin dispatcher model had already been decided and should not be reopened during discussion.

---

## AGENTS.md strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Bloco enxuto | Keep the OpenCode `AGENTS.md` section concise: skills, approval boundary, hook behavior, and important paths. | ✓ |
| Bloco espelhado do Claude, adaptado | Reuse most Claude instruction content with small wording changes. | |
| Bloco mais prescritivo para OpenCode | Add stronger workflow rules specific to OpenCode. | |
| Voce decide | Let the planner choose the approach later. | |

**User's choice:** Bloco enxuto
**Notes:** The user preferred a compact, practical integration instead of copying the full Claude instruction body.

---

## OpenCode agents

| Option | Description | Selected |
|--------|-------------|----------|
| Adaptacao leve dos agentes atuais | Reuse the existing CodeWiki agent roles with only light OpenCode-specific adjustments. | |
| Copia quase literal | Install versions that are nearly identical to the Claude agent templates. | |
| Agentes realmente especificos do OpenCode | Rewrite the agent prompts around OpenCode-specific runtime behavior. | |
| Voce decide | Let the planner choose the approach later. | |

**User's choice:** Custom — preserve `codewiki-wiki-updater` and `codewiki-verifier` as the role pair, but adapt each tool's agent prompts as much as needed so they work in the best way for that host runtime.
**Notes:** During clarification, the existing agent pair was confirmed as `codewiki-wiki-updater` and `codewiki-verifier`. After reconsideration, the user revised the earlier "light adaptation" preference and asked for tool-optimized prompts rather than near-identical copies across OpenCode, Codex, Copilot, and Claude.

---

## Detection and bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| Bootstrap explicito e deteccao conservadora | Keep auto-detection narrow, but treat `--tool opencode` as authoritative and create the missing OpenCode surface. | ✓ |
| Deteccao mais ampla | Detect OpenCode from additional markers such as `.opencode/`. | |
| Bootstrap minimo | Install only a minimal subset when the project does not already look like OpenCode. | |
| Voce decide | Let the planner choose the approach later. | |

**User's choice:** Bootstrap explicito e deteccao conservadora
**Notes:** The user wanted explicit OpenCode selection to work even when no existing OpenCode config is present, without broadening auto-detection prematurely.

---

## the agent's Discretion

- Exact TypeScript structure for the thin plugin dispatcher
- Exact wording of the concise `AGENTS.md` block
- Exact adaptation delta between the Claude agent templates and the OpenCode copies
- Exact install sequencing and report wording for OpenCode bootstrap targets

## Deferred Ideas

- Broaden OpenCode auto-detection beyond the conservative marker set if later validation proves it safe
- Introduce deeper OpenCode-specific agent behavior only if runtime differences make light adaptation insufficient
- Validate and harden around real OpenCode event payload shapes during planning/implementation
