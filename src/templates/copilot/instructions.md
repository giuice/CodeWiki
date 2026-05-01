## CodeWiki

Copilot uses the shared `.agents/skills/codewiki-<name>/SKILL.md` tree for CodeWiki skills, plus Copilot hooks installed under `.github/hooks/`.

### Skills

- `codewiki-ingest`, `codewiki-query`, `codewiki-lint`
- `codewiki-absorb`, `codewiki-breakdown`
- `codewiki-prd`, `codewiki-tasks`, `codewiki-process`

### Approval Boundary

- Treat `wiki/` as human-reviewed knowledge.
- Propose wiki edits first and wait for human approval before writing them.
- Use the verifier role as a read-only check when a wiki change needs contradiction or index review.

### Copilot Hooks

- `.github/hooks/codewiki-hooks.json` wires `preToolUse` to `.codewiki/hooks/pre-wiki-context.sh`
- `.github/hooks/codewiki-hooks.json` wires `postToolUse` to `.codewiki/hooks/post-verify.sh`
- `.github/hooks/codewiki-hooks.json` wires `agentStop` as the meaningful post-turn CodeWiki follow-up hook
- `.github/hooks/codewiki-hooks.json` wires `sessionEnd` as cleanup-only lifecycle handling

### Important Paths

- Wiki: `wiki/`
- Raw sources: `raw/`
- Config: `.codewiki/config.yml`
- Backlinks index: `wiki/_backlinks.json`
