# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```

---

# Phase Atomicity — MANDATORY for all agents

Every phase, sub-phase, and plan in this project MUST fit within a single agent context window. This is the #1 operational constraint — phases that exceed context limits have been catastrophic, producing incomplete work and wasting tokens.

## Hard limits per plan

- **≤3 tasks** per plan file
- **≤5 files touched** per plan (including test files)
- **≤1 concern** per plan — code changes OR doc updates, never both

## Decomposition rules

- If a phase has more than 2 plans, split into decimal sub-phases (e.g., 4.1a, 4.1b)
- Code migration and doc cascade are ALWAYS separate sub-phases
- Test updates are their own sub-phase if they touch >3 test files
- Each sub-phase must have a single verifiable deliverable
- If you need to read >500 lines of context to understand the plan, the plan is too broad — split it

## What agents must do

- Before planning: estimate total files and tasks. If >5 files or >3 tasks, split BEFORE writing the plan
- During execution: if context is filling up, stop, commit what works, create a continuation sub-phase
- Never combine "move files + update imports + update tests + update docs" in one plan — that's 4 sub-phases

## Anti-patterns (these ALWAYS blow context)

- "Doc cascade" plans that touch 8+ markdown files in one pass
- Plans that grep-and-replace across the entire codebase
- Phases that include both implementation and comprehensive testing
- Plans that read multiple large reference docs before starting work
