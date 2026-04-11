Vou fazer uma varredura somente de leitura nos documentos de produto, roadmap, requisitos e pesquisa para montar um resumo objetivo das inconsistências com arquivo e linha.

Read [](file:///home/giuice/Desenv/CodeWiki/.planning/REQUIREMENTS.md#55-55), lines 55 to 90

Searched for regex `6 slash commands|8 slash commands|Available Commands|/codewiki-absorb|/codewiki-breakdown|OpenCode|Codex|Copilot|file_edited|session_completed|all four tools now support hooks natively` (`CodeWiki` · `docs/**`), 139 results

Read [](file:///home/giuice/Desenv/CodeWiki/.planning/ROADMAP.md#90-90), lines 90 to 150

Searched for regex `6 slash commands|8 slash commands|Available Commands|/codewiki-absorb|/codewiki-breakdown|OpenCode|Codex|Copilot|file_edited|session_completed|all four tools now support hooks natively` (`CodeWiki` · `.planning/**`), 200 results

Vou ler só os trechos pontuais do implementation plan onde a contagem e a lista de comandos aparecem para fechar o resumo com referências exatas.

Read [](file:///home/giuice/Desenv/CodeWiki/docs/implementation-plan-v2.md#430-430), lines 430 to 446

Read [](file:///home/giuice/Desenv/CodeWiki/docs/implementation-plan-v2.md#470-470), lines 470 to 492

Read [](file:///home/giuice/Desenv/CodeWiki/docs/implementation-plan-v2.md#374-374), lines 374 to 396

Read [](file:///home/giuice/Desenv/CodeWiki/docs/codewiki-project-v2.md#320-320), lines 320 to 327

Read [](file:///home/giuice/Desenv/CodeWiki/docs/implementation-plan-v2.md#330-330), lines 330 to 360

**Resume**

I did a read-only audit only. No files were changed in this pass.

**Critical Inconsistencies**

1. Codex still says 6 commands while the product workflow and command surface are 8.
Problem:
The product and workflow clearly require absorb and breakdown, but Codex requirements still exclude them.
References:
REQUIREMENTS.md
codewiki-project-v2.md
codewiki-project-v2.md
PROJECT.md

2. The implementation plan still omits absorb and breakdown from Available Commands.
Problem:
The command list in the instructions section only shows 6 commands, even though the same document defines absorb and breakdown earlier and the product workflow depends on them.
References:
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md

3. The implementation plan mixes “copy all commands” with examples that still assume 6 commands.
Problem:
Phase 6.1 says copy src/prompts/commands/*.md for all tools, which implies the full command set, but later examples and tests still describe 6-command installs.
References:
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md
implementation-plan-v2.md

4. Product v2 says all four tools support hooks, commands, and instructions natively, but research artifacts still say several of those surfaces are unconfirmed or unavailable.
Problem:
This is the biggest cross-doc mismatch. The product doc reads as settled. Research and summary still read as provisional.
References:
codewiki-project-v2.md
codewiki-project-v2.md
codewiki-project-v2.md
codewiki-project-v2.md
codewiki-project-v2.md
FEATURES.md
FEATURES.md
FEATURES.md
SUMMARY.md
SUMMARY.md
SUMMARY.md

5. OpenCode hook behavior is described differently in different places.
Problem:
One place frames OpenCode around file_edited, another around session_completed-only strategy, and research shows both file_edited and session_completed in examples while also saying there is no pre-tool hook.
References:
codewiki-project-v2.md
codewiki-project-v2.md
ROADMAP.md
FEATURES.md
FEATURES.md
FEATURES.md
SUMMARY.md
SUMMARY.md

**Major Inconsistencies**

6. Codex command path is not stable across docs.
Problem:
Some docs say .codex/commands/codewiki, while research says the only confirmed surface may be global prompts under ~/.codex/prompts.
References:
codewiki-project-v2.md
codewiki-project-v2.md
implementation-plan-v2.md
FEATURES.md
FEATURES.md
SUMMARY.md

7. Copilot command support is also unstable across docs.
Problem:
Product v2 presents slash commands via custom agents; research still says no confirmed file-based slash command directory and possibly instruction-only fallback.
References:
codewiki-project-v2.md
implementation-plan-v2.md
FEATURES.md
FEATURES.md
SUMMARY.md
SUMMARY.md

8. The roadmap and requirements are now partially corrected for OpenCode, but Codex and Copilot still reflect the older reduced command model.
Problem:
Claude and OpenCode now point to 8 commands. Codex still says 6. Copilot does not define a command-count requirement at all, even though the product doc presents a full tool-level command surface.
References:
REQUIREMENTS.md
REQUIREMENTS.md
REQUIREMENTS.md
REQUIREMENTS.md
ROADMAP.md
ROADMAP.md

**Secondary / Historical Drift**

9. The older v1 reference doc still shows non-Claude tools with only ingest/query/lint.
Problem:
If someone reads the old project doc, they will infer a much smaller surface for Codex, Copilot, and OpenCode than the v2 product defines.
References:
codewiki-project.md
codewiki-project.md
codewiki-project.md

10. An older quick-task artifact still talks about 6 slash commands.
Problem:
This is not authoritative anymore, but it can still confuse future planning if reused as context.
References:
260407-ulj-PLAN.md

**Bottom Line**

The most important broken source right now is docs/implementation-plan-v2.md. It contains the clearest internal contradictions:
- it defines absorb and breakdown,
- it depends on them in the workflow,
- but it still documents only 6 Available Commands and 6-command install examples.

After that, the highest-value alignment fixes would be:
1. make Codex and Copilot command expectations explicit and consistent with the 8-command product surface or explicitly document a temporary exception,
2. reconcile product claims of native support with research docs that still say several tool surfaces are unconfirmed,
3. normalize OpenCode hook language so file_edited versus session_completed is not described three different ways.

Audit complete; no files were modified in this pass.Continued with Autopilot: Task not yet completeProduced a read-only inconsistency audit across product, implementation, roadmap, requirements, and research docs, with file-and-line references highlighting command-count mismatches, tool-capability conflicts, and outdated planning assumptions.

