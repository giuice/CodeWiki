# Harness Engineering for CodeWiki — Architectural Design Document

**Status:** Draft v0.1 · Author: research synthesis for Giuly · Audience: solo maintainer of `giuice/CodeWiki` · Source framing: Birgitta Böckeler / Martin Fowler, *Harness engineering for coding agent users* (Apr 2026); LangChain, *Improving Deep Agents with harness engineering* (Feb 2026); OpenAI, *Harness engineering: leveraging Codex in an agent‑first world*; @Vtrivedy10 commentary.

---

## 0. Note on the source repo

I was not able to fetch `https://github.com/giuice/CodeWiki` directly during this research pass (the URL did not resolve to a public, indexable page from my crawler, and it did not surface in search). Public hits for `giuice` show `giuice/giuice-memory-bank` and unrelated personal repositories; the Brazilian, solo, hooks‑plus‑markdown‑wiki, GSD‑style‑install framework you described as `giuice/CodeWiki` is therefore treated in this document as an **unverified-from-the-outside but authoritative description by the maintainer**. Wherever a design recommendation depends on an internal that I could not confirm, it is flagged as an **Open question** rather than asserted. This is consistent with your standing instruction to flag missing context instead of inventing it.

That caveat aside, the description you provided — markdown wiki as durable store, pre/post hooks around AI‑agent operations, human‑confirmed writes, multi‑tool support, GSD‑style install — is internally coherent and maps cleanly onto patterns that several adjacent open systems (giuice‑memory‑bank, gsd‑build/gsd‑2, llm‑wiki‑agent, obsidian‑wiki, AGENTS.md) already use. The architectural reasoning below is robust to small variations in how those internals end up being implemented.

---

## 1. Direct answer: can harness practices genuinely improve CodeWiki?

**Yes — but only a specific subset, and the win is *qualitatively different* from the LangChain win.**

LangChain’s 13.7‑point jump on Terminal Bench (52.8 → 66.5) is a *task‑completion* number: the harness made an autonomous coder more likely to finish a coding task correctly. CodeWiki is not a task‑completion system. It is a **knowledge‑integrity system**: its job is to make sure the markdown the human approves is actually *true about the codebase* and stays useful across sessions. So the right question isn’t “will harness engineering give CodeWiki a Terminal Bench bump?” It’s “does harness engineering give us better tools to prevent bad knowledge from being persisted, and to detect when persisted knowledge has rotted?”

The answer there is yes, and the mapping is unusually clean for three reasons:

1. **CodeWiki already has the right shape.** Pre‑hooks, post‑hooks, and a human‑confirmed write step are exactly the surfaces Fowler calls “feedforward guides” and “feedback sensors,” and exactly where LangChain attaches middleware. The architecture you’ve already chosen is, in Fowler’s terminology, a harness — you just haven’t named the layer.
2. **The most valuable harness practice (self‑verification before completion) maps almost 1:1 onto wiki writes.** A `PreCompletionChecklistMiddleware` over an exiting agent and a `PreWriteVerificationHook` over a wiki page that’s about to be persisted are the same idea: force an extra pass against an explicit spec before something becomes durable. For CodeWiki the “task spec” is *the source code the page claims to describe*. This is where harness engineering and CodeWiki’s stated mission meet most tightly.
3. **Some harness practices are *already* what CodeWiki does, just unnamed.** Human‑confirmed writes are essentially the OWASP‑recommended defense against memory poisoning (provenance + user confirmation before persisting new memories). Calling out that this is what you’re doing makes the design legible and gives you a vocabulary for the rest of the layer.

**However**, several harness practices that are critical for autonomous CLIs (loop detection on file edits, time‑budget warning injection, the “xhigh‑high‑xhigh reasoning sandwich,” trace orchestration with LangSmith/Harbor) are **a poor fit, redundant, or actively over‑engineered** for a solo‑maintained, install‑into‑project, multi‑tool framework. Treating CodeWiki like Deep Agents on Terminal Bench would waste your time. The roadmap section below is opinionated about where to stop.

---

## 2. Vocabulary you’ll need (calibrated to CodeWiki)

Two pieces of source vocabulary are worth keeping — they let the rest of the design read clearly.

**From Fowler.** A *harness* is everything around the model that increases trust in its output. It is composed of:

- **Guides** — feedforward controls that shape behaviour *before* it acts (system prompts, AGENTS.md, skill files, conventions). Computational guides are deterministic (linters, schemas); inferential guides are LLM‑shaped (prompts, rules).
- **Sensors** — feedback controls that observe *after* the agent acts and either correct it or let it self‑correct. Computational sensors (tests, structural analysis) are cheap and fast; inferential sensors (LLM‑as‑judge, review subagents) are slower and probabilistic.
- **The steering loop** — a human iterating on guides and sensors when the agent makes the same mistake twice. Fowler is emphatic that this loop is the actual job of a harness engineer.
- **Harnessability** / *ambient affordances* — the property that a system is structurally amenable to being harnessed. Strongly typed languages, clear module boundaries, and convention‑heavy frameworks are highly harnessable. Free‑form prose is low‑harnessability.

**From LangChain.** They compress the design space to three concrete *knobs*: **System Prompt, Tools, Middleware**. Middleware (their term for hooks around model and tool calls) is where most of the deterministic gains came from. Their named pieces:

- `LocalContextMiddleware` — runs on agent start, injects environment context (cwd, parent/children dirs, available interpreters).
- `PreCompletionChecklistMiddleware` — intercepts the agent before it exits and forces a verification pass against the spec ("Ralph Wiggum loop" — keep going until the work is actually checked).
- `LoopDetectionMiddleware` — counts per‑file edit hits via tool‑call hooks; after N hits to the same file it injects “consider reconsidering your approach.”
- **Trace Analyzer Skill** — fetch traces, fan out parallel error‑analysis subagents, synthesize, propose targeted harness changes (boosting‑style).
- **Build & Self‑Verify** — Plan → Build → Verify → Fix in the system prompt, with verification as a first‑class phase.
- **Reasoning sandwich** — more reasoning on planning and verification, less on execution.
- **Per‑model harness tailoring** — Codex, Claude, and Gemini need different prompting; the same harness scored worse on Claude Opus until rerun.

The piece neither source emphasizes that **matters most for CodeWiki** is the *security* literature on **memory poisoning** (OWASP ASI06, Microsoft Security, Palo Alto Unit 42, MITRE ATLAS AML.T0080). This treats persistent memory writes as untrusted input that needs *provenance* and *user confirmation* before commit. CodeWiki’s human‑confirmed‑write step is already exactly this defense; the harness layer should make that explicit and add provenance metadata to every page.

---

## 3. Where the harness layer sits relative to CodeWiki

The proposal is to introduce a single new conceptual layer — call it the **CodeWiki Harness** — that lives *between* the AI tool and the wiki, and that is composed of named middlewares hung off the existing pre‑hook / post‑hook surface. No new lifecycle is invented; the harness is just a vocabulary and a discipline for what plugs into the hooks you already have.

### 3.1 Current architecture (as described, not as inspected)

```
   ┌──────────────────────────────────────────────────────────────────┐
   │                     AI Coding Tool                               │
   │  (Claude Code / Codex / Cursor / Copilot / Gemini CLI / etc.)    │
   └───────────────┬────────────────────────────────┬─────────────────┘
                   │ reads                          │ proposes write
                   ▼                                ▼
        ┌─────────────────────┐         ┌──────────────────────┐
        │   Pre-hooks         │         │  Post-hooks          │
        │  (CodeWiki injects  │         │  (CodeWiki captures  │
        │   context / wiki    │         │   proposed writes    │
        │   pages on session  │         │   and tool outputs)  │
        │   start / on read)  │         │                      │
        └────────┬────────────┘         └──────────┬───────────┘
                 │                                 │
                 ▼                                 ▼
        ┌──────────────────────────────────────────────────────┐
        │              Markdown Wiki Store                     │
        │            (durable, human-readable)                 │
        └──────────────────────────────────────────────────────┘
                                 ▲
                                 │ blocking gate
                  ┌──────────────┴──────────────┐
                  │   Human-confirmed write     │
                  │  (the one mandatory check)  │
                  └─────────────────────────────┘
```

### 3.2 Proposed architecture with harness layer

The harness sits as a **chain of middleware** registered on the pre‑hook and post‑hook surface, plus a **separate offline analyzer** that reads accumulated traces and proposes changes back to the maintainer. Nothing about the existing wiki or human‑confirmation step changes.

```
   ┌──────────────────────────────────────────────────────────────────┐
   │                     AI Coding Tool                               │
   └─────────┬──────────────────────────────────────┬─────────────────┘
             │ session start / read                 │ proposed write
             ▼                                      ▼
 ┌────────────────────────────────┐   ┌─────────────────────────────────┐
 │  Pre-hook chain                │   │  Post-hook chain                │
 │  ─────────────                 │   │  ─────────────                  │
 │  1. ToolFingerprintMiddleware  │   │  1. TraceCaptureMiddleware      │
 │  2. LocalContextMiddleware     │   │  2. WikiWriteIntentMiddleware   │
 │  3. WikiContextMiddleware      │   │  3. PreWriteVerificationMW      │
 │  4. ProvenanceTagMiddleware    │   │  4. KnowledgeLoopDetectionMW    │
 │  5. SystemPromptComposer       │   │  5. ProvenanceStampMiddleware   │
 └─────────┬──────────────────────┘   └─────────────────────┬───────────┘
           │                                                │
           ▼                                                ▼
       (agent runs)                              ┌──────────────────────┐
                                                 │ Human-confirmed write │ ← unchanged
                                                 └──────────┬───────────┘
                                                            ▼
                                                ┌──────────────────────┐
                                                │   Markdown Wiki      │
                                                │   + provenance YAML  │
                                                └──────────┬───────────┘
                                                           │
                                          ┌────────────────┴────────────────┐
                                          ▼                                 ▼
                              ┌────────────────────────┐     ┌──────────────────────┐
                              │  Trace Store           │     │  Wiki Lint / Drift   │
                              │  (.codewiki/traces/)   │     │  (computational      │
                              └──────────┬─────────────┘     │   sensors over wiki) │
                                         │                   └──────────────────────┘
                                         ▼
                              ┌───────────────────────────┐
                              │  Trace Analyzer Skill     │
                              │  (offline, on-demand)     │
                              │  → proposes harness diff  │
                              └───────────────────────────┘
```

The key insight: **CodeWiki’s pre‑hooks already are LangChain‑style middleware, and CodeWiki’s post‑hooks already are tool‑call hooks.** Adopting the harness vocabulary doesn’t require new infrastructure; it requires (a) naming and standardizing the middleware contract, (b) writing the specific middlewares that solve CodeWiki‑specific failure modes, and (c) adding an offline trace analyzer that closes the steering loop Fowler emphasizes.

---

## 4. Per‑practice evaluation

The following table evaluates each harness practice against four CodeWiki‑specific axes: **Maps onto existing architecture?**, **Implementation difficulty for a solo dev**, **Expected impact on knowledge integrity**, and **Redundant with existing CodeWiki?**

| # | Practice | Maps onto? | Difficulty | Impact on knowledge integrity | Redundant? |
|---|---|---|---|---|---|
| 1 | **Wiki‑write self‑verification** (analog of `PreCompletionChecklistMiddleware`) | Yes — a post‑hook, before human confirmation | **Low–Medium** | **Very high** — directly attacks hallucinated knowledge | No |
| 2 | **Provenance tagging on wiki pages** (frontmatter: source files, commit SHA, agent name, model, trace id) | Yes — wraps human‑confirmed write | **Low** | **High** — enables audit, lint, decay, rollback | No |
| 3 | **`LocalContextMiddleware` analog: `WikiContextMiddleware`** (inject relevant existing wiki pages on session start to reduce re‑discovery) | Yes — pre‑hook | **Low** | **High** — addresses the exact stateless‑repetitive‑mistake problem CodeWiki was built for, and reduces the chance the agent invents knowledge that already exists | Partially — this is arguably *the core feature* of CodeWiki and may already exist; the harness framing makes it one named middleware among several |
| 4 | **Build & Self‑Verify loop in system prompt** (Plan → Build → Verify → Fix, where Verify means *open the cited source file and confirm the claim*) | Yes — pre‑hook composes the system prompt | **Low** | **High** | No |
| 5 | **Trace Analyzer skill, adapted**: instead of analyzing for task‑completion failures, analyze for *knowledge failures* — pages where the human rejected the write, pages later edited in conflict, pages whose cited source no longer exists | Yes — offline, reads `.codewiki/traces/` | **Medium** | **High** (steering loop) | No |
| 6 | **Loop detection adapted for knowledge churn** (`KnowledgeLoopDetectionMiddleware`: if the same wiki page has been rewritten N times in conflicting ways across sessions, inject a “stop, reconsider, this page may need a human decision” signal) | Yes — post‑hook | **Medium** | **Medium‑high** — catches the failure mode the human‑confirmed‑write gate doesn’t catch on its own | No |
| 7 | **Time‑budget warning injection** | Forced fit | **Low to implement, low value** | **Low** for CodeWiki — there is no race against a benchmark timeout; the human gate dominates pacing | Yes (effectively) |
| 8 | **xhigh‑high‑xhigh reasoning sandwich** | Possible only on tools that expose a reasoning knob (Codex, GPT‑5+, Claude adaptive thinking, Gemini thinking) | **Medium** (per‑tool) | **Medium** for verification step | Partially redundant with adaptive‑reasoning models |
| 9 | **Per‑tool harness tailoring** (Codex vs Claude vs Cursor vs Copilot vs Gemini CLI all have different prompt files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`) | Yes — installer concern; CodeWiki is multi‑tool by design | **Medium** | **High** (this is what makes CodeWiki actually multi‑tool, not just multi‑tool in name) | Probably partial — depends on what GSD‑style install already does |
| 10 | **Teaching agents to write *testable knowledge*** (every claim must cite the file/line/symbol that justifies it; a page with un‑cited claims fails the pre‑write check) | Yes — system‑prompt guide + post‑hook computational sensor | **Medium** | **Very high** — this is the harness pattern that hits the hallucination problem head‑on | No |
| 11 | **Tracing as feedback signal** (LangSmith/Harbor for LangChain) — for CodeWiki, simple JSONL trace store under `.codewiki/traces/` | Yes — post‑hook captures, no infra dependency | **Low–Medium** | **Medium** until you have enough traces to mine | No |
| 12 | **Sub‑agent delegation, sandbox orchestration (Daytona/Modal), persistent memory primitives** | No — out of scope | **High** | Negligible for CodeWiki | N/A — over‑engineering |
| 13 | **PR‑review Ralph Wiggum loop (OpenAI Codex style: agent reviews own PR and re‑iterates)** | Possible but tangential | **High** | Low for the wiki use case; the human is already the reviewer | N/A |

Practices 1, 2, 3, 4, 9, 10 are the high‑value set. Practices 5, 6, 11 are valuable once #1–4 are in place. Practices 7, 8, 12, 13 are skippable.

---

## 5. The core mapping: self‑verification specifically applied to wiki writes

This is the most important section of the document because it is where harness engineering and CodeWiki’s stated mission overlap perfectly.

LangChain’s most cited gain came from `PreCompletionChecklistMiddleware`. Their agent’s most common failure was: *write a solution, re‑read its own code, confirm it looks ok, stop.* The middleware intercepts the exit and forces a verification pass against the original task spec. They explicitly call this a Ralph Wiggum Loop pattern.

CodeWiki has the *exact same failure mode at the knowledge layer*. An AI agent in a session figures something out about the codebase, writes it as a markdown page, re‑reads its own draft, confirms it looks ok, and proposes the write. The human confirmation step catches the most egregious hallucinations, but humans optimize for "looks plausible" — which is precisely what LLMs are best at producing. **Every page that looks plausible but is actually wrong is a candidate for becoming durable, persistent, agent‑readable misinformation about the user’s codebase**: a memory poisoning event, even if non‑adversarial.

### 5.1 PreWriteVerificationMiddleware — design

The middleware fires as a post‑hook, **before** the human‑confirmation gate. It does *not* replace the human gate; it is the layer that prevents the human from being the only line of defense.

It runs three computational checks (deterministic, fast, on every write) and one optional inferential check:

**Computational sensors** (cheap, run always):

1. **Citation existence.** Every non‑trivial claim in the proposed page must cite a `path/to/file.ext[:line_or_symbol]`. The middleware parses citations and verifies each path exists at the current commit. Pages whose cited files no longer exist are blocked or flagged. (This is the harness analog of Fowler’s structural sensors — duplicate code, missing coverage — applied to documentation.)
2. **Symbol existence.** Where a citation names a symbol (`auth.middleware.requireUser`), a tree‑sitter or ctags/LSP lookup confirms the symbol exists. Symbol‑not‑found is the single highest‑precision hallucination signal in code documentation; CodeWikiBench‑style work has confirmed that broken cross‑references are a common LLM doc‑gen failure.
3. **Diff against existing wiki.** Compare the proposed page against the current page (if one exists). If the diff replaces a previously human‑confirmed claim with a contradictory one and offers no new citation, escalate (see §7 on knowledge‑churn loop detection).

**Inferential sensor** (optional, expensive, run on flagged pages):

4. **LLM‑as‑judge with the cited source file in context.** A small, separate model call: *“Here is the proposed wiki page. Here is the contents of every file it cites. Does the page accurately describe these files? List any claims that are not supported by the cited source.”* Output is appended to the page draft as a verification report visible to the human at confirmation time.

Critically, this is exactly Fowler’s “feedback sensors that produce signals optimized for LLM consumption.” If verification finds problems, the middleware does not silently block — it injects the verification report back as a *Ralph Wiggum continuation prompt* to the agent ("you cited X, but X does not contain Y; please re‑verify or remove the claim"). This converts the human’s rejection rate into a self‑healing loop.

### 5.2 Why this is the architecturally privileged practice

Most other harness practices help an agent *do* something better. This one is special: it is the only practice that directly enforces CodeWiki’s contract — *what gets persisted is verified knowledge*. Everything else in the roadmap is supporting infrastructure for this single check.

**Open question:** Does CodeWiki currently require citations in proposed pages, or does it accept free‑form markdown? The design above assumes a citation discipline can be required by the system prompt and enforced by a parser. If pages are currently free‑form, adding the citation requirement is a prerequisite and is itself a harness change (a feedforward guide). The `llm-wiki-agent` and `obsidian-wiki` projects both impose `[[wikilink]]` and source‑page conventions; CodeWiki almost certainly needs an analog.

---

## 6. Trace collection across multiple AI tools

LangChain’s trace story rides on LangSmith because they own the agent loop. **CodeWiki does not own the agent loop** — it sits inside Claude Code, Codex, Cursor, Gemini CLI, or whatever the user installed it for. So the trace architecture has to be tool‑agnostic.

The minimum viable design:

```
.codewiki/
├── traces/
│   ├── 2026-04-28T14-03-22Z__claude-code__sess-ab12.jsonl
│   ├── 2026-04-28T15-11-09Z__codex__sess-cd34.jsonl
│   └── ...
├── wiki/
│   └── (existing markdown pages)
└── harness/
    ├── system_prompts/    # composed at session start, per tool
    ├── middleware.toml    # which middlewares are active
    └── trace_analyzer/    # the offline skill
```

Each post‑hook invocation appends one JSON line: `{ts, tool, session_id, event_type, page_path, before_sha, after_sha, agent_response_snippet, verification_report, human_decision}`. This is the same shape LangChain calls a *trace* but stripped of LangSmith‑specific structure. It is local‑first, file‑based, and works anywhere the install runs — same philosophy as gsd's "state lives on disk — `.gsd/` is the source of truth" and as `obsidian-wiki`'s append‑only `log.md`.

The fact that CodeWiki already proxies through pre/post hooks means trace capture is essentially a one‑liner per hook. The interesting work is what comes after.

### 6.1 The Trace Analyzer Skill — adapted for *knowledge* quality

LangChain’s analyzer asks: *where did the agent fail to complete the task?* For CodeWiki the question is fundamentally different and more interesting:

> *Where did the wiki produce knowledge that the human had to reject, that contradicted itself across sessions, that cited files that no longer exist, or that the next agent session ignored or overwrote?*

The Trace Analyzer Skill, run on demand by the maintainer (you), does roughly:

1. **Fetch traces** from `.codewiki/traces/` over a time window.
2. **Cluster failure modes** with parallel sub‑agents:
   - Pages rejected at the human gate → cluster by reason (citation missing, contradiction, irrelevant).
   - Pages with high churn (rewritten more than N times) → these are the harness’s blind spots.
   - Pages whose `verification_report` failed but were confirmed anyway → tells you when humans rubber‑stamp.
   - Pages cited by later sessions vs pages ignored → ignored pages are dead weight that the harness should prune.
3. **Synthesize** into proposed harness changes: tighten the system prompt for tool X, add a citation rule, mark a topic for human review, retire stale pages.
4. **Diff the harness** and present the diff to the human for approval — same boosting‑style loop LangChain describes, except the artifacts being changed are CodeWiki’s system prompts, middleware config, and (importantly) the wiki itself.

This is the steering loop Fowler insists is the actual job of a harness engineer. It’s also the answer to the question *“how does a Trace Analyzer feed back into wiki content quality, not just agent performance?”* — by treating wiki pages, system prompts, and middleware config as the same harness artifact and letting the analyzer propose edits to all three.

**Open question:** This is the highest‑variance piece of the proposal. It requires you to actually have non‑trivial trace volume (a few weeks of dogfooding) before it produces signal. A premature build of the analyzer is wasted time. It belongs in phase 3 of the roadmap.

---

## 7. Loop detection adapted for knowledge‑write churn

LangChain’s `LoopDetectionMiddleware` counts edits to the same file inside one session and nudges the agent after N hits. The CodeWiki adaptation is materially more interesting because **CodeWiki’s loops happen across sessions**, not within them.

A typical pathological pattern:

- Session 1 (Claude Code): agent learns that auth is in `src/auth/middleware.ts`, writes `wiki/auth.md` describing it.
- Session 2 (Cursor, three days later, different developer or same developer in different mood): agent re‑discovers, rewrites `wiki/auth.md` with a contradictory description of the same code.
- Session 3 (Codex): agent reads the latest version, takes it as ground truth, makes a downstream architectural mistake.

This is the across‑session memory poisoning case from Christian Schneider’s and OWASP’s analyses, applied benignly: no attacker, just churn. The harness fix is a **`KnowledgeLoopDetectionMiddleware`** with three behaviors:

1. **Track per‑page rewrite counts** in the provenance frontmatter (`rewrite_count`, `rewrite_history: [{ts, agent_tool, sha_before, sha_after}]`). This is just metadata on each write.
2. **On the Nth rewrite within a window**, the post‑hook injects a Ralph‑Wiggum‑style continuation: *"This page has been rewritten N times in M days, with diverging content. Before proposing another rewrite, consult the prior versions and either (a) reconcile them in one consistent draft, or (b) explicitly mark a section as `<!-- CONTESTED: human review needed -->` and stop."* This converts churn from a silent failure into a visible signal.
3. **Surface contested pages to the maintainer** through a simple `codewiki lint` command. This is a computational sensor in Fowler’s sense — fast, deterministic, runs anytime.

This is also the place where the *human‑confirmed write* gate genuinely needs help. The human can plausibly review one diff. They cannot plausibly notice that they’re approving the third contradictory rewrite of the same page in two weeks. The loop detector sees that.

---

## 8. Per‑tool harness tailoring

CodeWiki’s multi‑tool support is one of its differentiators and one of its hardest problems. The ecosystem reality (well‑documented across the AGENTS.md spec, vibecoding.app’s comparison guide, augmentcode.com’s guide, and the deepagents docs):

- **Claude Code** auto‑loads `CLAUDE.md`; supports rich hooks (`PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, `PreCompact`, etc.) including command, prompt, and agent‑hook handler types; has an `Edit/Write/MultiEdit` tool surface.
- **Codex CLI** auto‑loads `AGENTS.md`; has its own hooks system documented at `developers.openai.com/codex/hooks` (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`).
- **Gemini CLI** uses `GEMINI.md`, traverses up *and* down the directory tree, has `/memory show` introspection.
- **Cursor** uses `.cursor/rules/*.mdc` with YAML frontmatter and glob scoping; also reads `AGENTS.md`.
- **GitHub Copilot** uses `.github/copilot-instructions.md`; weaker hook surface.
- **Windsurf, Amp, Aider, Augment, Antigravity, Trae**, and others mostly converge on `AGENTS.md`.

LangChain found empirically that the same harness scored 7 points worse on Claude than on Codex because the prompting wasn’t adapted. For CodeWiki the analog is even stronger: each tool has a different file the system prompt has to live in, and a different hook surface to attach middleware to.

The proposed model — adapted from how `gsd-build/get-shit-done` handles the same problem — is:

```
.codewiki/harness/
├── shared/                       ← canonical, tool-agnostic
│   ├── system_prompt.core.md     ← Build & Self-Verify, citation rules
│   ├── verification_rules.md
│   └── middleware.toml
└── tools/                        ← compiled at install time
    ├── claude/
    │   ├── CLAUDE.md             ← symlink or rendered include
    │   └── .claude/settings.json ← hook registrations
    ├── codex/
    │   ├── AGENTS.md
    │   └── .codex/hooks.toml
    ├── cursor/
    │   └── .cursor/rules/codewiki.mdc
    ├── gemini/
    │   └── GEMINI.md
    └── copilot/
        └── .github/copilot-instructions.md
```

`codewiki install --tool claude --tool codex` renders the tool‑specific files from the shared canon. The GSD‑style install you described is the correct mechanism; the harness layer just gives it more to compile.

**Concretely on the prompt side**, three pieces vary per tool:

- **Verbosity / formality.** Codex prompting guide recommends terse, imperative; Claude prompting guide recommends explicit structure and rationale; Gemini benefits from explicit thinking budgets. Don’t paste the same prompt.
- **Tool naming.** `Edit` vs `str_replace` vs `apply_patch` are different surfaces; the wiki‑write detection in the post‑hook needs to match the right tool name per host.
- **Hook handler type.** Claude Code supports prompt and agent hooks (which can do verification with sub‑LLM reasoning); Codex hooks are command/HTTP only. The `PreWriteVerificationMiddleware` from §5 should use the richer surface where available and degrade gracefully (computational checks only) where it isn’t.

**Open question:** It’s unclear from the public description how `giuice/CodeWiki` currently distributes per‑tool config. If it is already a templated install that emits `CLAUDE.md`, `AGENTS.md`, etc., much of this section is a vocabulary upgrade rather than a build. If it currently emits one universal file, the per‑tool split is a real piece of work and is worth doing because of the LangChain finding.

---

## 9. What to leave out (honest non‑goals)

Several harness practices look attractive but are over‑engineered for CodeWiki today.

- **Sandbox orchestration (Harbor / Daytona / Modal / Runloop).** These exist to let an autonomous agent execute arbitrary code in isolation. CodeWiki doesn’t execute code; it documents code. Skip.
- **Time‑budget injection.** Solved a Terminal Bench problem (89 tasks, strict timeouts). CodeWiki sessions are bounded by humans, not benchmarks. Skip.
- **The reasoning sandwich (xhigh‑high‑xhigh).** Useful only on models that expose reasoning budgets and only when you’re paying for tokens by the bushel. For CodeWiki, the verification step (§5) is the place where you’d want extra reasoning, but adaptive‑reasoning models (Claude Sonnet 4.5+, Gemini 2.5 thinking) handle this without manual budgeting. Don’t bake explicit reasoning ladders into the system prompt; let the model decide. If you ship Codex support and someone reports verification‑pass quality issues, *then* add a reasoning hint there.
- **Multi‑agent PR review loop / OpenAI Codex‑style Ralph Wiggum loop on PRs.** That’s for autonomous shipping. CodeWiki has a human in the loop; the verification middleware in §5 is a strictly cheaper substitute.
- **Building your own LangSmith.** Local JSONL traces are sufficient. Resist the gravitational pull toward a hosted observability product until you have evidence you need one.
- **Generative harness templates per topology** (Fowler’s open question for the wider field). Out of scope; CodeWiki should cover *one* topology — “markdown wiki for AI agents to read while editing code” — and do it well.

A useful test for *“is this practice over‑engineered?”* is Fowler’s question: **does this feedback sensor or feedforward guide help when the human did clearly specify what they wanted?** If the practice mainly compensates for unclear specification or autonomous agents running unsupervised, it’s probably not what CodeWiki needs, because the human is right there and the contract is explicit (the wiki page must accurately describe the cited code).

---

## 10. Risks and where harness engineering would *not* help

This is the section the user asked for explicitly. There are real ways this could go wrong.

1. **Harness churn becomes the work.** Fowler notes that a harness is "an ongoing engineering practice, not a one‑time configuration." For a solo dev on an unfinished framework, this can swallow your roadmap. Mitigation: treat the harness as a small fixed surface (the middlewares listed in §3.2) and resist adding new ones unless the trace analyzer says you should.
2. **Verification middleware becomes the bottleneck.** If the LLM‑as‑judge pass in §5.1 runs on every wiki write, with a strong model, it adds cost and latency to every confirmation. Mitigation: gate the inferential pass on the computational checks (only run LLM‑as‑judge if citation/symbol checks already passed but the page is large or contradicts an existing one).
3. **False sense of safety.** A `verification_report: ok` stamp may make the human approve faster, not more carefully. This is the same risk RAG systems face when they say "verified by knowledge base." Mitigation: keep the verification report blunt and surface specific *unverified* claims rather than a boolean.
4. **Per‑tool config drift.** Once you ship five sets of tool configs, you will inevitably evolve one of them and forget the others — exactly the problem AGENTS.md was created to solve. Mitigation: enforce a single canonical source under `harness/shared/` and treat tool‑specific files as build artifacts, never edit them by hand.
5. **The harness over‑constrains the agent.** Ashby’s Law: a regulator must have at least as much variety as the system it governs. If your verification rules block legitimate, novel wiki content (e.g., an architectural pattern page that genuinely has no single file to cite), the harness will degrade, not improve, the wiki. Mitigation: every blocking rule must have an `<!-- ALLOW: rationale -->` escape hatch the human can write into a draft to override the check.
6. **Adversarial memory poisoning is technically possible** for a CodeWiki vault that ingests external content (e.g., pasted issue comments, fetched documentation, third‑party READMEs). OWASP ASI06 and Microsoft Security/Unit 42 have documented this against production memory systems. The provenance tag (§4 row 2) plus mandatory human confirmation already give CodeWiki much of the recommended defense. The harness layer should *make this defense visible* in design docs (the `provenance:` frontmatter and the human gate are CodeWiki’s answer to memory poisoning) but probably does not need adversarial machinery for v1.
7. **Where harness engineering does not help at all.** Fowler is candid that *behaviour harnesses* — making sure functional behaviour is what was asked for — are the open frontier and the existing tooling is weak. CodeWiki is a maintainability/architecture‑documentation harness, not a behaviour harness. For behavioural correctness of generated code, CodeWiki is not the right layer; CI tests, fitness functions, and human review still are. Don’t market CodeWiki as solving that problem.
8. **You may be doing this anyway.** If your existing pre/post hooks already inject relevant wiki context on session start (#3 in the table) and your human confirmation gate already requires an inline diff (#1 light version), then "harness engineering for CodeWiki" is partly a *naming and documentation* exercise rather than a *building* exercise. That is actually the best outcome — the work is one design doc (this one), one terminology pass on the README, and a small handful of new middlewares, not a re‑architecture.

---

## 11. Prioritized roadmap (for a solo dev on an unfinished framework)

Ordered by **(impact × ease)** as you asked.

### Phase 0 — Naming pass (1 day)

Adopt the harness vocabulary in the docs. Rename internal pre/post hook chains to `pre_hook_middleware` and `post_hook_middleware`. State explicitly that the human‑confirmed write is a memory‑poisoning defense (with reference to OWASP ASI06). Cost: zero. Value: makes everything below legible to outside contributors and to your future self.

### Phase 1 — High‑impact, low‑cost middleware (1–2 weeks)

1. **`ProvenanceTagMiddleware`**: every write stamps the page with `source_files: [...]`, `commit_sha: ...`, `agent_tool: ...`, `agent_model: ...`, `trace_id: ...`, `confirmed_by: ...`, `confirmed_at: ...`. Pure metadata. Unblocks everything downstream.
2. **`PreWriteVerificationMiddleware` — computational tier only** (citation existence + symbol existence + diff‑against‑prior). No LLM judge yet. This is the mission‑critical piece.
3. **System‑prompt guide**: rewrite the CodeWiki system prompt to mandate Plan → Build → Verify → Fix and to require citations. Push this into all per‑tool prompt files.

These three give you the bulk of the qualitative gain. After Phase 1, every page has provenance, every page has a fighting chance of being correct, and the system prompt has set the right expectation.

### Phase 2 — Cross‑session safety (1–2 weeks)

4. **`KnowledgeLoopDetectionMiddleware`** — track rewrite churn, inject "CONTESTED" continuation prompts, surface contested pages via a `codewiki lint` command.
5. **`WikiContextMiddleware`** (if not already present) — on session start, scan the proposed task and inject the most relevant existing wiki pages into context. This is CodeWiki's core value proposition encoded as a named middleware.
6. **Per‑tool prompt split** — split shared prompt content from per‑tool wrappers; render `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules/codewiki.mdc`, `.github/copilot-instructions.md` from one canon at install time.

### Phase 3 — Steering loop (2–4 weeks, only after dogfooding)

7. **`TraceCaptureMiddleware`** — JSONL append per pre/post‑hook event. Trivial to implement; valuable only once volume exists.
8. **Trace Analyzer skill** — offline, on‑demand, reads traces, proposes harness/system‑prompt/wiki edits as a diff. This is the steering loop.
9. **`PreWriteVerificationMiddleware` — inferential tier** — add the optional LLM‑as‑judge pass for flagged pages, gated by the computational checks.

### Phase ∞ — Resist

Sandbox orchestration. Reasoning sandwich. Time budgets. Sub‑agent fan‑out. Self‑hosted observability. Marketing CodeWiki as a behaviour harness.

---

## 12. Summary

Harness engineering, as Fowler frames it (guides + sensors + steering loop) and as LangChain operationalizes it (system prompt + tools + middleware + trace‑driven boosting), is not a separate product to graft onto CodeWiki. It is **a vocabulary and a discipline that names what CodeWiki is already trying to be** — pre‑hooks are feedforward guides, post‑hooks are feedback sensors, the human confirmation step is the OWASP‑recommended defense against memory poisoning.

The single highest‑value addition the harness model contributes to CodeWiki is **`PreWriteVerificationMiddleware`** — a citation‑checking, symbol‑checking, optionally LLM‑judging post‑hook that runs *before* the human gate and converts CodeWiki from "human is sole reviewer" to "human reviews the small set of writes that already passed mechanical verification." This directly attacks the problem CodeWiki was built to solve: hallucinated knowledge becoming durable.

The supporting cast — provenance frontmatter, knowledge‑churn loop detection, per‑tool prompt rendering, a trace analyzer — are valuable in roughly that priority order. The reasoning sandwich, sandbox orchestration, time‑budget injection, and PR‑review Ralph Wiggum loop are *not* valuable for CodeWiki and should be explicitly out of scope.

The honest answer to your underlying question — *"can we really improve CodeWiki with these workflows? if yes and not hard to implement we need to try this"* — is: **yes, the high‑value subset is implementable in two phases of one to two weeks each by a solo dev, and the win is exactly aligned with CodeWiki's stated mission. The trace analyzer and inferential verification belong to a later phase that depends on having dogfooded the basics first.** Anything beyond that list, ignore.

---

## Appendix A — Open questions to resolve before phase 1

These are the items I could not confirm from outside the repo and that should be checked before you start building.

1. Does CodeWiki currently require pages to cite source files / symbols, or are pages free‑form? (Determines whether citation parsing in `PreWriteVerificationMiddleware` is a 1‑day or a 1‑week task.)
2. How is the multi‑tool install actually done today? Is there a single template that gets dropped, or per‑tool files? (Determines whether §8 is a vocabulary pass or a real build.)
3. Is there already a `WikiContextMiddleware`‑equivalent that injects relevant existing pages on session start? (If yes, this is mostly already‑done and only needs naming.)
4. What is the wiki page format — pure markdown body, or does it already carry frontmatter? (Determines whether `ProvenanceTagMiddleware` is purely additive or requires a format change.)
5. Are pre/post hooks currently a single function per type, or already a chain? (Determines the API for registering new middlewares.)
6. Does the human‑confirmation step show a diff against the prior version, or only the new content? (If only new, the diff display is itself a low‑cost harness improvement.)

## Appendix B — A note on tweet IDs

The two tweet IDs you supplied (`2031408954517971368` and `2023805578561060992`) were partially recoverable. The second resolves to `Vtrivedy10`’s thread on harness engineering and matches the LangChain blog content (self‑verification, automated context engineering, doom loops, reasoning sandwich) that is the basis of §2 above. The first ID did not resolve in my searches; the closest related Vtrivedy10 threads are `2022018287408910745` (Building Better Coding Agent Harnesses) and `2033608199564067098` (deepagents as starting point for harness engineering, internal agent dogfooding). All concrete LangChain practices you flagged (`PreCompletionChecklistMiddleware`, `LocalContextMiddleware`, `LoopDetectionMiddleware`, Trace Analyzer Skill, reasoning sandwich, time‑budget injection, testable‑code prompting, per‑model tailoring) are independently confirmed on the official LangChain blog, so nothing in this document depends on the unresolved tweet ID.