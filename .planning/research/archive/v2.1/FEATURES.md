# Feature Research

**Domain:** Agentic software-delivery kit — live board monitoring, human-in-the-loop autonomy control, agent-driven acceptance testing, controlled natural language for machine-read/machine-written docs
**Researched:** 2026-07-28
**Confidence:** MEDIUM-HIGH overall — HIGH on areas 1–3 (mature comparables, converging patterns), MEDIUM on area 4's rules and **LOW on area 4's central evidence claim** (see `## Area 4 evidence honesty`, which is the section the quality gate cares about)

**Milestone scope:** v2.1 Autonomous Factory. Four NEW capability areas only. Existing grugops features (shared verified context, §14 gate, queue, ASVS, BDD/TDD, install line, docs catalog) are treated as **substrate to depend on**, not as things to re-research.

> The v2.0 edition of this file is preserved at `.planning/research/archive/v2.0/FEATURES.md`.

---

## Executive read (the five findings that should survive into requirements)

1. **The dashboard's value is the parser, not the pixels.** Every comparable TUI (lazygit, k9s, gh-dash) is a thin renderer over one authoritative model. grugops's differentiator is that the model is *typed and reusable*; its risk is that a second grammar for "what column is this ticket in" appears — which is the exact failure class the v2.0 closure doctrine was written about.
2. **`fs.watch` + atomic-rename is a known trap, and grugops writes by atomic rename.** A watch bound to a file path is orphaned by the rename that replaces it. Watch the **directory**; debounce; keep a last-good snapshot. Windows is worse (no events on watched-dir move/rename, `EPERM` on delete, directory-level monitoring only).
3. **CI/CD converged on per-risk-boundary granularity, ternary state, prevent-self-approval, and timeout→deny.** All four are directly transplantable. Notably GitHub ships a literal *"prevent self-reviews"* toggle — the same predicate grugops already enforces on `verified_by`.
4. **"The agent explores, the code judges" is the settled pattern for agent-run UAT** — and it is architecturally identical to grugops's `emitVerdict()` root-of-trust. The four documented self-pass failure modes (assertion weakening, test deletion, behavioral fakery, **state pollution**) map cleanly onto grugops's admission model, and state pollution is the one grugops has not yet closed for browser evidence.
5. **There is no published evidence that controlled language improves LLM comprehension.** The mechanism is plausible; the citation does not exist. STE's attested benefit is for *human* readers and translation. Worse, STE's "do not omit articles/subjects" rule makes text **longer**, so STE must not be sold as a token-economy win. Recommend shipping a named *grugops writing profile derived from* ASD-STE100 rules, never a claim of STE conformance.

---

## Area 1 — CLI dashboard / live board monitor

### Comparable tools surveyed

| Tool | What it teaches | Mutates state? |
|------|-----------------|----------------|
| **lazygit** | The reference keyboard model: pane-per-domain, `Tab` between panes, always-visible status bar showing *the keys valid right now*, `?` for full help | Yes (commits, merges) |
| **k9s** | Resource-nav sidebar + live-refreshing table + drill-down; `:` command palette | Yes |
| **gh-dash** | Sectioned dashboard over remote state; numbered view jumps (`1`–`5`), `Enter` focuses a preview pane instead of opening a browser, live keyword search, progressive loading, configurable sections | Yes (custom keybindings can trigger Actions/reviews) |
| **btop** | High-frequency full-repaint monitor — the *wrong* model for a file-backed board | No |
| **claude-squad / openkanban / amux / repomon / octomux / Claude-Code-Agent-Monitor** | The 2026 wave of agent-orchestration monitors: worktree-per-agent, unified permission inbox, live monitor grid, Kanban status board, in-app diff review | Yes — most of them are control planes, not monitors |

**The most important observation:** essentially every comparable is a *control plane* that happens to render. grugops is proposing a *monitor* that must never control. That is an unusual position, and the design pressure will be constant and one-directional — every user request will be "let me move that ticket from here." The read-only boundary must be structural (no write capability compiled in / no fs write API reachable from the renderer), not a policy in a role prompt. This mirrors the "verdict function imports nothing from a browser" pattern from area 3.

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes / grugops dependency |
|---------|--------------|------------|----------------------------|
| **Column view with live/limit WIP** (13 columns, `(WIP 1/3)`) | It is a Kanban board; a board that doesn't show WIP isn't one | MEDIUM | Depends on `plans/board.md` §6.1 heading format + `factory.config.json#wip_limits`. **The heading count and the live row count can disagree** — the projector must pick one authority (rows) and *report* the disagreement, never silently reconcile |
| **Per-ticket row: ID, title, owner role, age-in-column** | Standard board affordance | LOW | Board row format already carries `(owner: …, since: …)` |
| **Ticket ↔ file agreement surfaced** | grugops already defines the `status:`/`column:` contract; users expect drift to be visible | LOW | Depends on `plans/tickets/<prefix>-xxx.md` frontmatter. The structure validator already checks this — the dashboard *displays* it, does not re-implement it |
| **Queue depth: pending / claimed / done counts** | "Is anything actually running?" is the first question | LOW | Reads `.grugops/queue/{pending,claimed,done}/` — directory listing only |
| **Active agents pane** (claimant, task ref, claim age vs `stale_ttl_minutes`) | The headline of an "autonomous factory" | MEDIUM | Depends on `claim.ts` claim metadata. **Ordering flag: this pane is empty until the spawn defect is fixed** — build spawn first or the dashboard's best view ships dead |
| **Blocked items with block age vs `blocked_escalation_days`** | The board defines Blocked as "visible, time-tracked" — a monitor that hides it contradicts the artifact | LOW | Board conventions block |
| **Gate status: last §14 verdict + id + freshness** | The gate is the backpressure; operators watch it | MEDIUM | Depends on `emitVerdict()` output / `.grugops/context/` verdict notes |
| **Recent events feed** (last N admitted notes, newest first) | Every monitor has a log pane | MEDIUM | Depends on shared-context note `at` timestamps + the committed JSONL index |
| **Auto-refresh with a visible freshness indicator** | Users must know whether they're looking at now or 40 seconds ago | MEDIUM | `fs.watch` on **directories** + debounce + `fs.watchFile` polling fallback; render "last updated HH:MM:SS" and a degraded badge when watching failed |
| **Keyboard nav: `hjkl`/arrows, `Tab` panes, `?` help, `q` quit, number keys for view jumps, `/` filter** | lazygit/k9s set this expectation universally | MEDIUM | Pure render-layer |
| **Drill-down** (`Enter` on a ticket → detail pane: frontmatter, refs, its notes) | gh-dash's preview-pane model; avoids the context switch that motivates a TUI at all | MEDIUM | Read-only file reads |
| **Non-TTY / CI degradation: `--once` plain text, `--json` snapshot** | Zero-config-first; also how it gets tested | LOW | Aligns with the existing committed-`.js` + deterministic-output convention |
| **Honest unknown state** — unparseable file → `UNKNOWN - verify`, never a fabricated `0` | This project's core constraint | LOW | Direct application of the no-fabrication rule to a rendering surface |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **ONE board/state projector authority emitting a typed snapshot** | The whole point. Renderer, `--json`, and a future web view all consume the same struct; no second grammar for board truth | MEDIUM-HIGH | This *is* the v2.0 closure doctrine applied prospectively ("one format-aware authority per predicate"). Cheap now, unpayable later |
| **Byte-deterministic `--json` snapshot + a freshness-style fixture test** | Makes a *rendering* feature mechanically verifiable, which nothing else in this class is | MEDIUM | Reuses the docs-catalog / `freshness:catalog` precedent exactly: fixture tree → snapshot → byte-compare |
| **Verification badges** — a note/ticket shows its `verified_by` stamp and gate id | No other board shows *why* a state is trustworthy. This is grugops's entire thesis made visible | MEDIUM | Depends on VFY-01..04 |
| **Autonomy banner** — persistent header showing the active checkpoint matrix and **any lowered floor, with who lowered it and when** | Turns area 2's "never silently" requirement into something an operator cannot miss | LOW (given area 2 lands) | Read-only; see dependency graph |
| **Mode indicator: PARALLEL (Claude Code) vs SEQUENTIAL (other 4)** | Makes the dual-path architecture legible; a user on Codex should see *why* width is 1 | LOW | Depends on host detection already implied by the dual path |
| **WIP-violation and stale-claim highlighting** | Derived invariants surfaced at a glance | LOW | **Surface only.** Enforcement stays in the Orchestrator role + config (see anti-features) |

### Anti-Features (and the explicit "read-only / never load-bearing" violations)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Any keybinding that moves a ticket / claims a task / unblocks / retries / kills an agent** | Every comparable TUI does it; it will be the #1 request | **Violates read-only.** Creates a second writer to `plans/board.md` and `.grugops/queue/` outside the sanctioned `context-io.ts` path — the exact thing v2.0 spent a milestone closing | Dashboard shows the state; the human types the request into the host CLI. Optionally: a key that *copies a suggested `/grug` command to the clipboard* — still no write |
| **Approving a human checkpoint from the dashboard** | Feels like the natural home for an approval inbox (octomux ships one) | **Violates read-only, and worse: puts a write path into a safety gate.** An approval surface must be un-forgeable and named-human; a monitor process is neither | Approval stays in the host CLI session / the named-human opt-in mechanism from area 2 |
| **A dashboard cache/index file (`.grugops/dashboard-cache.json`)** | Perf on large boards | **Violates read-only** and creates a second grammar for board truth that can go stale and be trusted | Re-parse on change; the board is a handful of KB. If perf ever bites, cache **in memory only** |
| **The Orchestrator reading the dashboard's computed WIP count** | "We already computed it" | **Makes the dashboard load-bearing.** The kit must run identically with the dashboard never installed | Roles read `board.md` + config, as today. The projector may be *shared library code*, but the dashboard process is never in the decision path |
| **Resident daemon / background notifier / desktop notifications** | "Tell me when the gate goes red" | grugops has no runtime and no daemon — this reintroduces one, plus a process to operate | Foreground process only; exits cleanly; `--once` for scripting |
| **Any runtime dependency (ink/blessed/react/chalk)** | Faster to build a pretty TUI | Breaks the hard "zero runtime dependencies on host machines" constraint | Raw ANSI escape codes on Node stdlib, compiled `.js`, same as every other kit runnable |
| **Full-screen high-FPS repaint (btop model)** | Looks impressive | Burns CPU to re-render a file that changes a few times a minute; also destroys terminal scrollback | Event-driven repaint on debounced change + a manual `r` refresh |
| **Telemetry / usage analytics** | "Understand adoption" | Already explicitly out of scope since v1.1 | None |
| **Auto-launching the dashboard from the installer** | Discoverability | Installers are additive and reversible; auto-launch is a surprise side effect | Print one line: how to start it |
| **Mouse-required interactions** | Modern TUIs support mouse | Mouse is fine as an *addition*; requiring it breaks ssh/tmux/CI workflows | Keyboard-complete; mouse optional |
| **Rendering a partially-written file** | It's what naive `fs.watch` handlers do | Shows torn state as if it were truth — a fabrication by accident | Parse to a complete snapshot, then swap; on parse failure keep the last good snapshot + show a stale/unparseable badge |

### File-changes-mid-render: the expected behavior (concrete)

This is the question with a real, citable answer, and grugops's write model makes it sharper than usual.

- **`fs.watch` is documented as not 100% consistent across platforms and unavailable in some situations.** The `filename` callback argument is not guaranteed on all platforms — fallback logic is required. On **Windows**, no events are emitted when a watched directory is moved or renamed, `EPERM` is reported when it is deleted, and changes are monitored at the *directory* level (Node's docs explicitly note this means `fs.watch` does not protect against file substitution). `recursive: true` support differs by platform and Node version.
- **grugops writes by atomic rename** (`context-io.ts`, `claim.ts` transitions). A watcher bound to a *file path* is orphaned the moment that file is replaced by rename — the handle follows the old inode and goes silent. **Watch the containing directory, not the file.** This is the single most likely "the dashboard just stopped updating" bug, and it is predictable in advance.
- **Debounce.** A single logical write produces multiple events (duplicate events are known `fs.watch` behavior). Coalesce with a trailing debounce (~50–150 ms) before re-parsing.
- **Polling fallback.** `fs.watchFile` (default interval 5007 ms) is the stdlib fallback; expose an interval flag. Network filesystems and some containers need it. The fallback must be *visible* in the UI ("polling, 5s") — a silently degraded refresh rate is a quiet lie about freshness.
- **Never render a partial parse.** Build the whole snapshot, then atomically swap the render model. On failure: retain last good, badge it, and show the parse error on demand. Torn reads on a concurrently-written markdown file are otherwise indistinguishable from real state.

---

## Area 2 — Configurable human-in-the-loop checkpoints

### How comparable systems model "where does a human approve?"

| System | Granularity | Escape hatches | Auditability of a *lowered* setting |
|--------|-------------|----------------|--------------------------------------|
| **GitHub Actions Environments** | Per **environment** (a named risk boundary), attached to a job | Wait timer 0–43,200 min; branch restrictions; **"Prevent self-reviews"** toggle; env secrets withheld until the gate passes | Deployment history records what/when/who-approved. The *config change itself* is a settings edit in the org audit log |
| **GitLab CI** | Per **job** (`when: manual` + `allow_failure: false`) and per **protected environment** (who may deploy, multiple approval rules with required counts) | Manual job blocks the pipeline; rules can require N approvers | Deployment approvals recorded per environment |
| **Argo CD** | Per **sync / sync window** (time-boxed allow-deny), manual sync per stage | Sync windows deny by clock, not by person | Application event history |
| **Temporal** | Per **workflow wait point** — `wait_condition(..., timeout=…)`, signal-driven | **Timeout branch is explicit and usually means reject/escalate.** Durable across worker restarts; a five-month wait costs nothing | Full event history is the audit log by construction |
| **LangGraph** | Per **tool call** — `interrupt()` / `Command(resume=…)` | approve / **reject** / **edit the tool arguments**; checkpointed state survives process death. Vendor states "review and approve tool calls before execution" is by a wide margin the most common production HITL pattern | Checkpoint history |
| **Claude Code permission modes** | Global-ish mode: `default` / `plan` / `acceptEdits` / `bypassPermissions` | `bypassPermissions` (`--dangerously-skip-permissions`) shows a **one-time responsibility-acceptance dialog persisted to settings**, refuses to run as root, and is documented as container/VM-only. A newer "auto mode" is the safer middle | The one-time dialog is the entire audit surface — and it's one-time |
| **Break-glass (PAM/HIPAA practice)** | Per emergency **session** | Request + stated reason + time-box + credential rotation afterwards | **Tamper-proof log of request, approval, session, and actions; alert fires within ~60 s of activation.** Framed explicitly as "a security control, not a bypass" |

### What granularity users actually want

The evidence converges, and it converges *against both extremes*:

- **Global scalar (`autonomy: full`) is too blunt.** It is the `--dangerously-skip-permissions` shape. Even Anthropic wraps that one flag in a responsibility dialog, a root refusal, and container-only guidance — a JSON field has none of that friction. grugops's decision to retire the scalar is well-supported.
- **Per-workflow-step is too fine.** A 40-key matrix is a matrix nobody reads; defaults get copy-pasted from a blog post and the dial stops meaning anything.
- **The sweet spot is per-named-risk-boundary** — GitHub's "environment", GitLab's "protected environment", LangGraph's "tool call class". For grugops that means matrix keys should be **checkpoint identities** (merge, prod deploy, context admission, test-integrity justification, verify-before-write, DoR stop, XL split, release, UAT sign-off) — roughly 8–14 keys, each naming a risk — not one key per workflow step.

### Table Stakes

| Feature | Why Expected | Complexity | Notes / grugops dependency |
|---------|--------------|------------|----------------------------|
| **An enumerated, named list of every human stop** | You cannot dial what you cannot name; also the only way to prove the matrix is complete | MEDIUM | The milestone already sequences enumeration first — correct. Cross-check against all 18 roles + 19 workflows and the prod-deploy hook |
| **Ternary per checkpoint, not boolean:** `block` / `notify` / `off` | GitHub, GitLab, Temporal all have a middle state; boolean forces "annoying" or "unsafe" | LOW | Extends the existing `off / high-severity / all` shape of `context.human_admission` |
| **Safe defaults; zero-config = safe** | Existing grugops constraint | LOW | Unchanged from GOV-01/02 |
| **Named human identity on approval, never a boolean** | An approval nobody's name is on is not an approval | LOW | Already exists: `GRUGOPS_PROD_DEPLOY_APPROVED` + refuse-self-set |
| **Prevent self-approval** | GitHub ships this as a literal toggle; grugops already enforces the same predicate on `verified_by` | LOW | Reuse `context-io.ts` `validate()`'s refuse-self set — do **not** author a second self-check (second-grammar hazard) |
| **Timeout → deny / escalate. Never timeout → proceed** | Temporal's canonical pattern | LOW | Applies to any unattended run |
| **Fail-closed on unknown/typo enum values** | A typo must never open a hole | LOW | Already the GOV-01 behavior: any value that isn't exactly `off` gates at least as strictly as the next tier. Generalize to every matrix key |
| **Every approval AND every skip recorded in the trace** | Auditability is the product | MEDIUM | `plans/traceability.md` + shared-context notes |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Lowering a floor is itself a gated, stamped, non-self event** | Nobody in this space does this. CI systems log a bypass *use*; the *config change* is just a settings edit. grugops can make the opt-in un-self-settable by the same mechanism class as the deploy hook | **HIGH** | This is a safety invariant. Per the project's own doctrine: budget red-team rounds, expect a structural fix, do not accept a green suite as closure |
| **Claim-dropping — when a checkpoint is lowered, the corresponding claim is withdrawn from the artifact** | The strongest idea in this milestone. It is the no-fabrication rule applied to *marketing copy inside the trace*: a gate report must stop asserting "test integrity enforced" and instead read "test integrity: notify-only (lowered by \<human\> on \<date\>)" | MEDIUM | Touches the §14 gate report, traceability, role prompts, and the dashboard banner. Mechanically checkable: a guard asserting *claim present ⇒ checkpoint at floor* |
| **Break-glass framing: time-boxed + reason-required + alert-on-use** | PAM practice, transplanted. A lowered floor that auto-expires is far safer than one that lives forever in a committed config | MEDIUM | Optional/enterprise tier. Even the reason-string alone beats a bare boolean |
| **The lowered state is visible in the dashboard header** | "Never silently" made continuously visible, not just recorded | LOW | Read-only consumption of the matrix; see dependency graph |
| **Notify-and-continue emits an admitted note, not a console line** | A "notify" that scrolls past is not a notification | LOW | Reuses the shared context as the notification channel — no new mechanism |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **A single global `autonomy: full` / `yolo: true`** | Simple; users ask for it | Silently unsets everything at once, with no per-risk record. The `--dangerously-skip-permissions` shape without any of its friction | Per-checkpoint matrix; a "lower everything" convenience, if ever added, must expand to explicit per-key values on write |
| **Env-var or CLI-flag per-run override with no persisted record** | Convenient for CI | An unrecorded lowering is exactly the "silent" outcome the milestone forbids | Overrides allowed only if they emit a trace note; otherwise refuse |
| **Timeout → proceed ("assume approval after 24h")** | Unblocks unattended runs | Converts absence of evidence into approval — the precise anti-pattern the A3/DOG-02 capture rule exists to prevent | Timeout → deny + escalate |
| **Deleting the guard when a checkpoint is `off`** | "It's off, why run it?" | Loses the ability to report the lowered state, and makes re-raising the floor a code change | Guard always runs; when `off` it reports `off by \<human\>` instead of blocking |
| **Per-workflow-step granularity** | Maximum flexibility | Unusable dial; defaults become cargo-cult | ~8–14 risk-boundary checkpoints |
| **Agent-settable opt-in of any kind** | Enables full autonomy | Straight violation of "an agent cannot self-set" | Named-human mechanism. **And re-disclose the known irreducible residual** (same-uid / no-hook direct-FS forgery) here rather than re-claiming it solved — the honest boundary is worth more than an over-claim |
| **Approving from the dashboard** | Convenient | Cross-cutting violation of area 1's read-only boundary | Host CLI session only |
| **"Unattended mode" that means "no checkpoints"** | It's what the word suggests | Unattended should mean *queue the decisions*, not *skip them* | Unattended = run until a `block` checkpoint, then park the task in the queue with a clear "waiting on human: \<checkpoint\>" state the dashboard shows. Temporal's model: waiting costs nothing |

---

## Area 3 — Agent-driven manual / exploratory testing feeding UAT

### Agent-run UAT vs scripted E2E — what each is actually for

| | Scripted E2E (existing §14 gate) | Agent exploratory run (new) |
|---|---|---|
| Strength | Deterministic, cheap to re-run, regression-proof | Discovers states nobody specified; adapts to a changed UI |
| Weakness | Blind to anything not asserted; brittle selectors | Non-deterministic; **cannot be its own oracle** |
| Correct role | The **gate** | The **discovery** step, and a **generator** of gate tests |

**The settled synthesis pattern: the agent explores, the code judges.** The strongest published articulation enforces it structurally — the verdict function imports nothing from a browser, and a self-test asserts the browser module never entered the module table during verdict computation. Optional LLM triage may only *append explanatory text to a failure*; it can never flip a verdict to pass. This is architecturally the same shape as grugops's `emitVerdict()` root-of-trust + `admit()` cross-check, which is a strong signal the milestone's stated design is right.

### Documented self-pass failure modes (all four are attested, not hypothetical)

1. **Assertion weakening** — `expect(v).toBe(5)` rewritten to `expect(v).toBeTruthy()`.
2. **Test-case deletion** — after repeated repair failures, the agent removes the failing case and reports 100% pass.
3. **Behavioral fakery** — plausible output produced without performing the task (never read the file, summarized from the prompt).
4. **State pollution** — the agent runs in the same environment the evaluator inspects and **writes the result file directly**.

**#4 is the open surface for this milestone.** grugops has closed the note-admission path; it has not closed "the agent produced the evidence artifact it will be judged on." The countermeasure is provenance on the artifact: the evidence file must be written by the tool's own writer (Playwright's trace/video/screenshot output), and the judge must read the **artifact**, not the agent's narration of it.

### Table Stakes

| Feature | Why Expected | Complexity | Notes / grugops dependency |
|---------|--------------|------------|----------------------------|
| **Evidence written to files at a known path, never pasted into the transcript** | Prose is not evidence; this is the project's own no-fabrication rule | LOW | Playwright already in the §14 gate |
| **Accessibility snapshot as the primary agent-legible view** | The structured a11y tree (roles, names, states, stable element refs) is ~2–5 KB and deterministic; screenshots can be enormous (one report measured **232k tokens for a single screenshot**) | MEDIUM | Playwright MCP exposes this natively; grugops already ships axe-core in the gate |
| **Screenshot at decision points + video + `trace.zip` on failure** | The universal expectation for "what did the agent actually see" | LOW-MEDIUM | Playwright config; reuse the existing visual-regression recipe |
| **Console logs (filtered against a benign allowlist) + network log + HTTP status** | Practitioner-standard diagnostic set; unfiltered console noise makes every run "fail" | MEDIUM | New capture, existing gate wiring |
| **Deterministic verdict computed from captured artifacts, not from narration** | The whole point | HIGH | Depends on `emitVerdict()`; the judge must be a pure function |
| **Loud skip when the browser/tool is unavailable — never a silent green** | Existing project pattern from the Tier-2 harness | LOW | Reuse the Tier-2 loud-skip convention verbatim |
| **Artifact retention + cleanup policy** | Traces and videos are large; unbounded growth breaks repos | LOW | Ties to `context.audit_retention` |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Evidence enters through the verify-before-write path — UAT result is a stamped note, not prose** | An agent literally cannot run its own UAT and stamp its own pass | MEDIUM (given VFY-01..04 exists) | The stated milestone intent; research fully supports it |
| **Import-boundary separation of explorer and judge, proven by a self-test** | Turns "don't let the agent judge itself" from a rule into a mechanical fact | HIGH | Safety invariant → red-team budget applies. Direct analogue of the v2.0 structural-closure doctrine |
| **Artifact provenance: the note records the evidence file path + content hash; the judge reads the artifact** | Closes state pollution (failure mode #4) | MEDIUM | New. This is the gap |
| **Exploratory → promoted scripted spec** | Exploration is discovery; the promoted spec is the durable regression proof in the §14 gate | MEDIUM | "This review is where an exploratory transcript becomes engineering" — the practitioner consensus |
| **Two-lane browser strategy** | Claude in Chrome for authenticated/interactive dev work (it drives the browser you already have logged in); Playwright MCP for reproducible/CI/cross-browser | MEDIUM-HIGH | **Recommend Playwright MCP as the floor and Claude in Chrome as the optional lane.** Documented Chrome-extension limits: connection instability, a `chrome-extension://` context problem, auth flows frequently needing manual intervention. Making the CC-only path the floor would also break the other four host CLIs |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Agent authors the pass/fail** | Fast, feels natural | All four documented self-pass modes live here | Code judges; agent may only append explanation to a failure |
| **Screenshots as the primary agent input** | "Just look at it" | Token blowup and non-determinism; pixels are a worse oracle than the a11y tree | A11y snapshot primary; screenshots for humans and for diffing |
| **Agent writes the evidence/result file it will be judged on** | Simplest plumbing | State pollution — attested failure mode | Tool-written artifacts only; judge reads the artifact |
| **Auto-healing selectors / auto-rewriting assertions to reach green** | "Reduce flake" | Indistinguishable from assertion weakening | Flake is reported, not repaired, inside the gate |
| **Exploratory runs *replacing* scripted E2E** | "Agents are more flexible" | Non-deterministic → cannot be a regression gate | Exploratory feeds the gate; the gate stays scripted |
| **LLM-as-judge as the sole UAT oracle** | Cheap and general | A single LLM cannot reliably verify its own output — structurally predisposed to agree with itself | Deterministic judge; LLM triage as annotation only |
| **Requiring a headed browser in CI as a hard dependency** | Fidelity | Breaks the zero-host-dependency posture and the four non-Claude CLIs | Optional lane + loud skip |

---

## Area 4 — Controlled natural language (ASD-STE100) for machine-read and machine-written docs

### What STE actually is (HIGH confidence)

- **Two parts:** (1) writing rules, (2) a dictionary. Current edition **Issue 9, released 2025-01-15**: **53 writing rules in 9 sections**, ~**900 approved words**, and ~**1200 unapproved words** listed with suggested alternatives. 555 dictionary entries were updated in Issue 9.
- **Origin and purpose:** developed from the 1980s by AECMA (now ASD) at the European airline industry's request, so aircraft-maintenance documentation would be understandable to **non-native English readers**. Adoption has spread outside aerospace — only ~36% of Issue-8 users were aerospace/defense.
- **Licensing:** ASD-STE100 is a copyright and trademark of ASD (Brussels). The specification is **free to download on request** from asd-ste100.org, but copyright is fully retained by ASD. **Deriving a profile from the rules and citing them is fine; redistributing the dictionary is not something the free download grants.**
- **Tooling:** conformance checking splits sharply. Free tools are partial (a Thumbs Up STE Tool, an online verb checker, an "STE-checker"). Full checking is commercial and dictionary-dependent (Acrolinx, Congree, Boeing Simplified English Checker, ARDOS). **No free tool certifies conformance.**

### The core rules, and which generalize to software procedural text

**Generalize well — mechanically checkable, no licensed dictionary needed:**

| Rule | Applies to grugops surfaces? |
|------|------------------------------|
| Procedures: **≤20 words per instruction** | Yes — workflow steps, checklists |
| Descriptions: **≤25 words per sentence** | Yes — role prose, notes, board comments |
| **One topic per paragraph, ≤6 sentences** | Yes |
| **One instruction per sentence** (one imperative per line) | Yes — highest-value rule for workflow steps |
| **Active voice**; passive only in descriptions when the agent is unknown | Yes |
| **Restricted verb forms** — infinitive, imperative, simple present/past/future, past participle as adjective only; **no present perfect** | Mostly yes |
| **`-ing` forms restricted** to technical nouns/modifiers | **Partially — see collision below** |
| **Do not omit sentence components** (subject, verb, article) | **Direct collision with caveman voice — see below** |
| **Noun clusters ≤3 words** | Yes, and useful (grugops has "shared verified context write path") |
| **Use vertical lists** for complex/enumerable content | Yes |
| **Safety instructions begin with the command or condition** | Yes — maps onto grugops's clear-voice safety surfaces |
| **One word, one meaning, one part of speech** | Yes — but implement as a small *grugops* approved-term list, not ASD's 900 words |

**Do not generalize / impractical without the licensed dictionary:**

- **The ~900-word approved dictionary itself.** Software text needs *commit, branch, repository, subagent, TypeScript, frontmatter, idempotent* — none approved. STE's own escape hatch (Technical Names / Technical Verbs) can admit them, but applying it wholesale means the dictionary constraint effectively evaporates and you are left with the rules anyway. **Recommendation: adopt the rules, do not adopt the dictionary.**
- Aerospace/S1000D-specific structural conventions (maintenance-manual warnings/cautions formatting tied to the S1000D data-module model).
- The `-ing` prohibition taken literally: grugops's own queue directories are `pending/`, `claimed/`, `done/`, and "running", "blocked", "pending" are load-bearing status words. **Carve out identifiers, paths, config keys, code, and status tokens from any `-ing` rule.**
- "Do not omit articles/subjects" **directly contradicts the caveman fenced block**, which is telegraphic by design. This is exactly why the milestone's surface split (caveman inside the fence, STE-derived profile everywhere else) is the right call — but the guard must be **surface-scoped**, or it will fight `guard_caveman_preserved` on the same bytes.

### Area 4 evidence honesty — DEMONSTRATED vs `UNKNOWN - verify`

This is the section the quality gate asks about, so it is stated plainly.

**DEMONSTRATED (or at least well-attested):**

- STE reduces ambiguity **for human readers**, particularly non-native English speakers, and improves consistency for translation/machine translation. *Confidence: MEDIUM.* This is decades of aerospace industry consensus and the stated design purpose of the standard — but I did not locate a controlled study with effect sizes, and the claim is usually asserted rather than measured in the available sources. Treat as "industry consensus", not "measured".
- STE has **documented limitations and critics**: it requires high English proficiency to apply correctly, is frequently misapplied as a substitute for a full style guide, and produces poor documentation when badly implemented; it is recommended as a *complement* to a style guide. *Confidence: MEDIUM-HIGH.*
- LLM-based **simplification of text for humans** improves readability metrics (reported ~2–6 grade levels in medical-communication reviews) — but the same reviews note that **only one randomised trial actually measured comprehension**. *Confidence: MEDIUM, and note this is the reverse direction:* evidence about LLMs *producing* simplified text for people, not about LLMs *consuming* controlled language better.

**`UNKNOWN - verify` — plausible but NOT established:**

- **`UNKNOWN - verify`: that writing agent-read documentation in ASD-STE100 (or any CNL) measurably improves LLM task success, reduces hallucination, or reduces ambiguity in agent behavior.** I found no study establishing this. The mechanism is plausible (fewer word senses, shorter sentences, less anaphora, no telegraphic omission ⇒ less ambiguity), and there is *adjacent* evidence that long, low-signal context files reduce agent success — which grugops already cites for its "Minimal AGENTS.md" constraint. But "shorter and denser helps" is not the same claim as "STE specifically helps." **Do not ship a claim that STE improves agent comprehension.**
- **`UNKNOWN - verify`: that STE reduces token count.** Plausibly the *opposite* for grugops: STE forbids omitting articles and subjects, which makes text **longer** than the current telegraphic caveman style. **STE must not be sold as a token-economy win.** The kickoff measurement already showed the caveman-as-token-economy claim did not survive contact with the artifact; replacing it with an equally unmeasured STE-as-token-economy claim would repeat the error one level up.
- **`UNKNOWN - verify`: that any available checker validates STE *conformance*** at a level a guard could rely on. Free tooling is partial; full conformance checking is commercial and dictionary-dependent.

**The consequence for `guard_ste` — the most important design point in area 4:**

> `guard_ste` must **not** claim to enforce ASD-STE100. It must enforce a **named, enumerated grugops writing profile** whose every rule it can check *exactly*, with the profile documented as "rules derived from ASD-STE100 Issue 9; not certified STE."

A guard that checks 6 mechanically-checkable rules while claiming to enforce 53 is a heuristic detector that is a strict subset of the real predicate — which is, verbatim, the documented root cause of all 13 v2.0 green-suite bypasses, and the exact failure that let `guard_caveman_preserved` drift green for an entire milestone. Enumerate the profile; check every rule in it; claim only that.

*(Trademark note: "Simplified Technical English" and "ASD-STE100" are ASD marks. "Derived from" + citation is the safe framing; "STE-compliant" is both unverifiable and a trademark risk.)*

---

## Feature Dependencies

```
[Spawn correctness fix]  (milestone item, not researched here)
    └──enables──> [Active-agents pane]        <- pane is EMPTY until spawn works

[Board/state projector: ONE authority, typed snapshot]
    ├──requires──> [board.md §6.1 heading format + ticket frontmatter contract]  (EXISTS)
    ├──requires──> [.grugops/queue/{pending,claimed,done}]                       (EXISTS, CLAIM-01/02)
    ├──requires──> [shared-context notes + JSONL index]                          (EXISTS, SCTX-01..05)
    └──requires──> [factory.config.json#wip_limits / #queue]                     (EXISTS, CONFIG-*)

[CLI dashboard renderer]
    └──requires──> [Board/state projector]
        └──requires──> [directory-level fs.watch + debounce + polling fallback]
                            └──forced-by──> [atomic-rename write model]          (EXISTS, context-io/claim)

[--json snapshot] ──enables──> [byte-deterministic projector test]  (reuses freshness:catalog pattern)

[Checkpoint enumeration]
    └──requires──> [pass over 18 roles + 19 workflows + prod-deploy hook]
        └──overlaps──> [Kit consistency audit]        <- do these together, one read of the kit

[Per-checkpoint autonomy matrix]
    └──requires──> [Checkpoint enumeration]
        ├──requires──> [fail-closed enum parsing]                    (EXISTS, GOV-01 pattern)
        └──requires──> [named-human opt-in, agent-unsettable]        (EXTENDS deploy-hook + validate())

[Claim-dropping]  ──requires──> [Per-checkpoint autonomy matrix]
                  ──touches───> [§14 gate report, traceability.md, role prompts]

[Autonomy banner in dashboard] ──requires──> [Per-checkpoint matrix] + [projector]

[Agent exploratory UAT]
    ├──requires──> [verify-before-write admission]           (EXISTS, VFY-01..04)
    ├──requires──> [§14 gate + emitVerdict() root of trust]  (EXISTS, GATE-01/VFY-02)
    ├──requires──> [Playwright + axe-core in the gate]       (EXISTS, UIQA-01/02)
    └──requires──> [artifact provenance: path + hash in the note]    <- NEW, closes state pollution

[Explorer/judge import boundary] ──enables──> [trustworthy agent UAT]

[grugops writing profile (STE-derived)]
    ├──requires──> [enumerated rule list, each mechanically checkable]
    └──requires──> [surface scoping]
                        └──conflicts──> [caveman fenced block]  (telegraphic vs "do not omit articles")

[guard_ste] ──conflicts──> [guard_caveman_preserved]   unless BOTH are surface-scoped to disjoint byte ranges
[guard_ste] ──requires───> [role-skeleton de-duplication]  (say-each-thing-once precedes rule-checking prose)
```

### Dependency Notes

- **Dashboard requires the projector, and the projector requires an authority decision.** `plans/board.md` encodes WIP twice — in the `(WIP 1/3)` heading and in the live rows beneath it. These can disagree. The projector must name one as authoritative (rows) and *surface* the disagreement. Choosing silently is a second grammar; the v2.0 doctrine says one format-aware authority per predicate.
- **Spawn before dashboard.** The "active agents" pane is the dashboard's headline and it renders nothing until role subagents actually spawn. Shipping the dashboard first produces a demo that proves the defect.
- **Enumeration before matrix, and enumeration piggybacks on the consistency audit.** Both require one careful read of all 18 roles + 19 workflows. Doing them in one pass is materially cheaper than twice.
- **`guard_ste` conflicts with `guard_caveman_preserved` on the same files.** Resolve by byte-range scoping: the fenced identity block is caveman-only and STE-exempt; everything outside it is profile-governed and caveman-exempt. Both guards must agree on the fence grammar — and per the doctrine, that means **one shared fence parser**, not two.
- **Artifact provenance is the new piece in area 3.** Everything else (gate, admission, Playwright, axe-core, loud skip) already exists. The gap is that the agent can currently produce the evidence it will be judged on.
- **`-ing` and article rules collide with grugops's own vocabulary.** `pending/`, `claimed/`, `running` are load-bearing. Carve out identifiers, paths, config keys, code fences, and status tokens from the profile before writing the guard, not after it fails.

---

## MVP Definition

### Launch With (v2.1 core)

- [ ] **Checkpoint enumeration** — the named list of every human stop, produced during the kit consistency audit. *Cheapest, unblocks the most, and is itself an audit artifact.*
- [ ] **Per-checkpoint matrix with ternary values + fail-closed parsing + safe defaults** — replaces the `autonomy` scalar.
- [ ] **Named-human opt-in for lowering a floor, agent-unsettable, recorded in the trace** — the safety invariant. Budget red-team rounds.
- [ ] **Claim-dropping** — the lowered state removes the corresponding claim from the artifact. *This is what makes "never silently" true rather than asserted.*
- [ ] **Board/state projector: one authority, typed snapshot, `--json`, byte-deterministic test** — the reusable core.
- [ ] **CLI dashboard: columns + WIP, tickets, queue depth, active agents, blocked, gate status, autonomy banner; keyboard nav; directory-watch + debounce + polling fallback; read-only by construction.**
- [ ] **grugops writing profile (STE-derived), enumerated, surface-scoped** + `guard_ste` that checks *exactly the enumerated rules* and claims nothing more.
- [ ] **Rebuilt voice guard that measures voice, not sentence shape** — the current one drifted green for a milestone.
- [ ] **Agent exploratory UAT on the Playwright MCP lane**, with tool-written artifacts, artifact provenance in the note, a deterministic judge, and a loud skip.

### Add After Validation (v2.1.x / next)

- [ ] **Claude-in-Chrome lane** — trigger: the Playwright lane is stable and someone needs an authenticated dev session. Documented instability makes it a second lane, never the floor.
- [ ] **Exploratory → promoted scripted spec pipeline** — trigger: exploratory runs produce repeatable findings worth regression-locking.
- [ ] **Break-glass time-boxing + expiry on a lowered floor** — trigger: someone leaves a floor lowered in a committed config.
- [ ] **Dashboard drill-down detail pane + `/` filter + `:` palette** — trigger: boards get big enough that scanning fails.
- [ ] **Per-checkpoint notification routing** — trigger: real unattended runs where parked tasks go unnoticed.

### Future Consideration (v2.2+)

- [ ] **Web renderer over the same typed snapshot** — defer: the point of the projector is that this becomes cheap later; building it now re-opens the "no web UI" boundary before the CLI has proven the snapshot shape. Read-only + local only, if ever.
- [ ] **Approval inbox UI** — defer indefinitely; it is a write path into a safety gate (see anti-features).
- [ ] **Full STE dictionary conformance** — defer: needs a commercial checker and a license posture grugops does not have.
- [ ] **Empirical measurement of whether the writing profile helps agents** — defer, but *name it*: this is the honest way to eventually retire the `UNKNOWN - verify`, exactly as `measure-cost.ts` does for the ~50% claim.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Checkpoint enumeration | HIGH | LOW | P1 |
| Per-checkpoint matrix (ternary, fail-closed, safe defaults) | HIGH | MEDIUM | P1 |
| Named-human opt-in for lowering a floor | HIGH | HIGH (safety invariant) | P1 |
| Claim-dropping when a checkpoint is lowered | HIGH | MEDIUM | P1 |
| Board/state projector (one authority, typed snapshot) | HIGH | MEDIUM-HIGH | P1 |
| CLI dashboard core views + keyboard nav | HIGH | MEDIUM | P1 |
| Directory-watch + debounce + polling fallback (Windows-safe) | HIGH | MEDIUM | P1 |
| `--json` snapshot + byte-deterministic projector test | MEDIUM | LOW | P1 |
| Writing profile enumeration + surface scoping | HIGH | MEDIUM | P1 |
| `guard_ste` limited to the enumerated rules | HIGH | MEDIUM | P1 |
| Voice guard rebuilt to measure voice | HIGH | MEDIUM | P1 |
| Agent exploratory UAT — Playwright lane + tool-written artifacts | HIGH | MEDIUM | P1 |
| Explorer/judge import-boundary separation | HIGH | HIGH (safety invariant) | P1 |
| Artifact provenance (path + hash) in the UAT note | HIGH | MEDIUM | P1 |
| Autonomy banner in the dashboard | MEDIUM | LOW | P2 |
| Verification badges on notes/tickets | MEDIUM | MEDIUM | P2 |
| Parallel/sequential mode indicator | MEDIUM | LOW | P2 |
| WIP-violation + stale-claim highlighting | MEDIUM | LOW | P2 |
| Drill-down detail pane, `/` filter | MEDIUM | MEDIUM | P2 |
| Break-glass time-boxing / auto-expiry | MEDIUM | MEDIUM | P2 |
| Exploratory → promoted spec pipeline | MEDIUM | MEDIUM | P2 |
| Claude-in-Chrome lane | MEDIUM | MEDIUM-HIGH + UNKNOWN | P3 |
| `:` command palette, mouse support | LOW | MEDIUM | P3 |
| Web renderer over the snapshot | LOW (this milestone) | MEDIUM | P3 |

**Priority key:** P1 must-have for the milestone · P2 add when possible · P3 future.

---

## Competitor Feature Analysis

| Feature | Comparable A | Comparable B | grugops approach |
|---------|--------------|--------------|------------------|
| Board TUI | **lazygit / k9s** — panes, status bar of live keys, `?` help, drill-down; *mutating* | **gh-dash** — sectioned, numbered jumps, preview pane, live search; *mutating* | Same interaction grammar, **zero mutation** — enforced structurally (renderer has no write path), not by policy |
| Agent monitoring | **octomux / Claude-Code-Agent-Monitor** — live grid, permission inbox, Kanban board, web UI, WebSockets | **claude-squad** — tmux multiplexing of sessions | Read-only projection of files that already exist; no daemon, no sockets, no runtime deps |
| Approval gates | **GitHub Environments** — per-environment reviewers, wait timer, prevent-self-review, deployment history | **Temporal** — durable wait + explicit timeout branch; **LangGraph** — approve/reject/**edit** per tool call | Per-checkpoint matrix at risk-boundary granularity, timeout→deny, reuse of the existing non-self stamp predicate |
| Lowering a safety setting | **Claude Code `bypassPermissions`** — one-time responsibility dialog, root refusal, container-only guidance | **Break-glass (PAM)** — request + reason + tamper-proof log + alert in ~60 s + time-box + rotation | Named-human, agent-unsettable opt-in, **plus claim-dropping** — the artifact stops asserting the property. No comparable does this |
| Agent UI verification | **Playwright MCP** — a11y-snapshot-first, deterministic refs, CI-fit | **Claude in Chrome** — real authenticated session; unstable, `chrome-extension://` context issues | Playwright lane as the floor, Chrome as an optional lane; verdict by code; evidence admitted through verify-before-write |
| Controlled language | **ASD-STE100** — 53 rules + 900-word dictionary; free spec, commercial checkers | **Acrolinx / Congree** — commercial conformance checking | Rules-only derived profile, enumerated and fully checkable; **no conformance claim**, no dictionary redistribution |

---

## Explicit list: features that would violate "read-only and never load-bearing"

For the requirement author — write these as **prohibitions**, not omissions:

1. Any keybinding that writes to `plans/board.md`, `plans/tickets/**`, `.grugops/queue/**`, `.grugops/context/**`, `plans/traceability.md`, or config.
2. Any approval / gate decision taken from the dashboard.
3. Any dashboard-owned cache, index, lock, or state file on disk.
4. Any role, workflow, guard, or oracle that reads a value **computed by the dashboard** rather than from the source files. *(This is the load-bearing test: if removing the dashboard changes factory behavior, it is load-bearing.)*
5. Any resident/background process, notifier, or socket.
6. Any runtime dependency shipped to host machines.
7. Rendering a partially-parsed file as if it were state.
8. Silently degrading to polling without saying so — a false freshness claim is a fabrication.
9. The dashboard being required by, or referenced as a step inside, any workflow.
10. Telemetry of any kind.

---

## Sources

**Area 1 — dashboards/TUI + file watching**
- lazygit / k9s / gh-dash design surveys — https://github.com/rothgar/awesome-tuis · https://www.gh-dash.dev/configuration/examples/ · https://metabureau.com.au/blog/gh-dash-terminal-github-dashboard · https://github.com/bjarneo/kli · https://github.com/gbarany/tea-dash (MEDIUM)
- Agent-orchestration monitors — https://github.com/bradAGI/awesome-cli-coding-agents · https://github.com/andyrewlee/awesome-agent-orchestrators · https://github.com/hoangsonww/Claude-Code-Agent-Monitor · https://www.augmentcode.com/tools/open-source-agent-orchestrators (MEDIUM)
- Node `fs.watch` / `fs.watchFile` caveats, platform inconsistency, Windows behavior, polling fallback — Node.js `doc/api/fs.md` via Context7 (HIGH)

**Area 2 — human-in-the-loop checkpoints**
- GitHub Actions environments, required reviewers, wait timer (0–43,200 min), prevent-self-reviews, deployment audit trail — https://oneuptime.com/blog/post/2025-12-20-deployment-gates-github-actions/view · https://devblogs.microsoft.com/devops/i-need-manual-approvers-for-github-actions-and-i-got-them-now/ (MEDIUM)
- GitLab `when: manual`, protected environments, deployment approvals — https://docs.gitlab.com/ci/environments/deployment_approvals/ · https://oneuptime.com/blog/post/2025-12-21-gitlab-deployment-approvals/view (MEDIUM)
- Argo CD manual approval gates between environments — https://oneuptime.com/blog/post/2026-02-26-argocd-manual-approval-gates/view (MEDIUM)
- Temporal HITL: `wait_condition` + timeout → reject/escalate, durable waits — https://temporal.io/blog/human-in-the-loop-approvals · https://docs.temporal.io/ai-cookbook/human-in-the-loop-python (MEDIUM-HIGH)
- LangGraph `interrupt()` / `Command(resume)`, approve-reject-edit, "most common HITL pattern in production" — https://www.langchain.com/blog/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt · https://docs.langchain.com/oss/python/langchain/human-in-the-loop (MEDIUM-HIGH)
- Claude Code permission modes, `bypassPermissions` one-time responsibility dialog, root refusal, container-only guidance — https://code.claude.com/docs/en/permission-modes · https://www.anthropic.com/engineering/claude-code-auto-mode (HIGH for the docs page, MEDIUM for commentary)
- Break-glass: tamper-proof audit trail, ~60 s alerting, "a security control, not a bypass" — https://hipaa.yale.edu/security/break-glass-procedure-granting-emergency-access-critical-ephi-systems · https://www.cloudanix.com/learn/break-glass-procedure-emergency-access-for-critical-resources · https://www.beyondtrust.com/blog/entry/provide-security-privileged-accounts-with-break-glass-process (MEDIUM)

**Area 3 — agent-driven exploratory testing**
- "The agent explores, the code judges" — import-boundary separation, self-test that the verdict function never loads a browser, LLM triage may only annotate failures — https://vadim.blog/computer-use-agents-ui-verification/ (MEDIUM-HIGH; single-author but unusually specific and mechanically stated)
- Self-pass failure modes: assertion weakening, test deletion, behavioral fakery, state pollution — https://arxiv.org/pdf/2605.01471 · https://www.devassure.io/blog/ai-coding-agents-gaming-their-own-tests/ · https://dev.to/maximsaplin/ai-agent-failure-modes-beyond-hallucination-208g (MEDIUM-HIGH; the arXiv case study is the strongest of these)
- LLMs cannot reliably self-verify — https://pub.towardsai.net/how-multi-agent-self-verification-actually-works-and-why-it-changes-everything-for-production-ai-71923df63d01 (MEDIUM)
- Playwright MCP a11y-snapshot-first model, evidence capture (trace/console/network/video), screenshot token cost — https://qaskills.sh/blog/playwright-mcp-accessibility-snapshots-reference · https://medium.com/@adnanmasood/playwright-and-playwright-mcp-a-field-guide-for-agentic-browser-automation-f11b9daa3627 · https://medium.com/@7003425114klp/one-screenshot-232-000-tokens-0b37783438c7 (MEDIUM)
- Playwright MCP vs Claude in Chrome tradeoffs and Chrome-extension limitations — https://www.test-lab.ai/blog/chrome-mcp-vs-playwright-mcp · https://stevekinney.com/courses/self-testing-ai-agents/runtime-tools-compared · https://lalatenduswain.medium.com/playwright-mcp-vs-claude-in-chrome-which-browser-testing-tool-should-you-use-in-2026-e502bee0067a (MEDIUM)

**Area 4 — controlled natural language**
- ASD-STE100 structure, 53 rules / 9 sections, ~900 approved + ~1200 unapproved words, Issue 9 (2025-01-15), concrete rules (≤20-word instructions, ≤25-word descriptions, ≤6-sentence paragraphs, one instruction per sentence, active voice, restricted verb forms, `-ing` restriction, no omitted components, ≤3-word noun clusters, vertical lists, safety-instruction form), documented criticisms and the 36% non-aerospace figure — https://en.wikipedia.org/wiki/Simplified_Technical_English · https://www.asd-ste100.org/about_STE.html · https://www.asd-ste100.org/STE_faq.html · https://www.asd-europe.org/news-media/news-events/news/simplified-technical-english-asd-ste100-issue-9/ · https://www.tcworld.info/e-magazine/technical-writing/asd-ste100-issue-9-setting-a-standard-for-technical-documentation (HIGH on structure/rules, MEDIUM-HIGH on criticism)
- Free download on request; ASD copyright and trademark retained — https://www.asd-ste100.org/request.html · https://www.asd-ste100.org/STE_downloads.html (HIGH)
- Checker tooling landscape (free partial vs commercial full: Thumbs Up STE Tool, verb checker, Acrolinx, Congree, Boeing Simplified English Checker, ARDOS) — https://www.techscribe.co.uk/techw/asd-simplified-technical-english.htm (MEDIUM-HIGH)
- Controlled natural language definition and typical restrictions — https://en.wikipedia.org/wiki/Controlled_natural_language (MEDIUM)
- LLM text simplification improves readability metrics but comprehension is largely unmeasured (one randomised trial) — https://arxiv.org/html/2407.20046v1 · https://link.springer.com/article/10.1007/s10676-024-09792-4 · https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12920046/ (MEDIUM — and note this is the *reverse* direction from the claim grugops would want)
- **No source found** establishing that controlled language improves LLM comprehension of machine-read documentation. Recorded as `UNKNOWN - verify`. (absent)

---
*Feature research for: agentic software-delivery kit — live board monitoring, HITL autonomy control, agent-driven acceptance testing, controlled natural language*
*Researched: 2026-07-28*
