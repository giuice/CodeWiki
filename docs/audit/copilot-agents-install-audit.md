# Copilot Agents Install Audit Prompt

Use this prompt with a separate reviewer agent to audit the new GitHub Copilot custom-agent install surface and the related CodeWiki hook behavior.

```text
You are auditing a CodeWiki change that adds GitHub Copilot custom-agent support and improves post-verify wiki-update signaling.

Audit goal:
Verify that `codewiki init --tool copilot` installs the same conceptual CodeWiki support surface as the other agent-capable tools: shared skills, Copilot hooks, Copilot instructions, and two supporting custom agents (`codewiki-wiki-updater` and `codewiki-verifier`). Also verify that the post-verify hook can surface new-topic candidates before a wiki entity page already exists.

Primary questions:
1. Does the Copilot adapter create `.github/agents/` and copy both custom agent profiles into it?
2. Are the Copilot custom-agent files in the format expected by GitHub Copilot (`.github/agents/*.agent.md`, YAML frontmatter, `name`, `description`, markdown prompt body)?
3. Are the two Copilot agents semantically equivalent to the Codex/OpenCode/Claude support agents?
   - `codewiki-wiki-updater` must propose approval-gated wiki updates and must not write to `wiki/` without explicit human approval.
   - `codewiki-verifier` must stay read-only and check contradictions, references, frontmatter, index/log/backlink maintenance, and quality signals.
4. Does `package.json` include the Copilot agent templates in the npm package?
5. Does the pack test require the Copilot agent templates in the generated tarball?
6. Does the init integration test assert that `codewiki init --tool copilot` creates both `.github/agents/` files?
7. Does `post-verify.sh` still exit 0 in all cases and remain POSIX sh compatible?
8. Does `post-verify.sh` now emit `Potential new topic candidates` and point the host agent toward `codewiki-wiki-updater` when changed files do not yet match existing `wiki/entities/*.md` pages?
9. Are README and product docs aligned with the intended product behavior: Copilot is not a second-class exception and installs supporting agents too?
10. Are there any stale statements saying Copilot has only a shared skill-driven flow, no agents, or optional/runtime-specific agent packaging?

Files to inspect:
- `src/lib/adapters/copilot.ts`
- `src/templates/copilot/agents/codewiki-wiki-updater.agent.md`
- `src/templates/copilot/agents/codewiki-verifier.agent.md`
- `src/templates/copilot/instructions.md`
- `src/templates/hooks/post-verify.sh`
- `src/templates/__tests__/copilot-adapter.test.ts`
- `src/templates/__tests__/hooks.test.ts`
- `test/init.test.ts`
- `test/pack.test.ts`
- `package.json`
- `README.md`
- `README.pt-BR.md`
- `docs/codewiki-project-v2.md`
- `docs/implementation-plan-v2.md`
- `docs/skills-migration-handoff.md`
- `.planning/PROJECT.md`

Suggested verification commands:
- `rtk npm test`
- `rtk rg -n "Shared skill-driven flow|Optional / runtime-specific|Copilot.*no agents|Claude Code, Codex, and OpenCode install|Claude Code, Codex e OpenCode instalam" README.md README.pt-BR.md docs src test .planning`
- `rtk rg -n "\.github/agents|codewiki-wiki-updater.agent.md|codewiki-verifier.agent.md" src test package.json README.md docs`

Expected outcome:
Return PASS only if Copilot agents are installed, packaged, tested, and documented as first-class CodeWiki support agents, and if the post-verify hook can surface new topic candidates without requiring a pre-existing entity page.

Report format:
- Verdict: PASS or FAIL
- Blocking findings, with file and line references
- Non-blocking observations
- Tests or commands run
```

## Files Modified By This Change

- `src/lib/adapters/copilot.ts`
- `src/templates/copilot/agents/codewiki-wiki-updater.agent.md`
- `src/templates/copilot/agents/codewiki-verifier.agent.md`
- `src/templates/copilot/instructions.md`
- `src/templates/hooks/post-verify.sh`
- `src/templates/__tests__/copilot-adapter.test.ts`
- `src/templates/__tests__/hooks.test.ts`
- `test/init.test.ts`
- `test/pack.test.ts`
- `package.json`
- `README.md`
- `README.pt-BR.md`
- `docs/codewiki-project-v2.md`
- `docs/implementation-plan-v2.md`
- `docs/skills-migration-handoff.md`
- `.planning/PROJECT.md`
