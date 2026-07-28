# Pitfalls Research

**Domain:** grugops v2.1 — adding five capabilities to a *shipped, mature, file-based markdown agent-factory kit* whose entire value proposition is a non-fabricated audit trail: (1) a read-only board dashboard over files another process writes, (2) making four previously-hard safety floors dialable, (3) agent-driven browser testing as acceptance evidence, (4) a controlled-language rewrite of 18 role prompts + 19 workflows, (5) fixing the subagent spawn path across a five-CLI portable kit. Zero host runtime deps; TypeScript compiled to committed, freshness-checked `.js`; Node 22+; Windows is a hard target.
**Researched:** 2026-07-28
**Confidence:** HIGH on the grugops-internal facts (read directly from `scripts/check-foundation-guards.ts`, `scripts/context-io.ts`, `scripts/validate-agent-factory.ts`, `scripts/check-uat-oracles.ts`, `.claude/agents/grugops-orchestrator.md`, `agent-factory/workflows/05-pr-quality-gate.md`, PROJECT.md this session). HIGH on Node `fs.watch` caveats (official v24 fs API docs via Context7, community-corroborated). MEDIUM on ASD-STE100 checker limits, agent-browser-evidence failure modes, torn-read mitigation, and fail-closed config practice (web-sourced, cross-checked but not vendor-primary). MEDIUM where a mitigation is a *design recommendation* rather than a documented external fact.

---

> ## Framing — read this before any pitfall
>
> This project has 13 documented cases where a **fully green test suite still admitted a bypass** of a safety invariant, and the root cause was the same every time: *a heuristic detector whose grammar was a strict subset of the real format's grammar, so the format itself became the attack surface.* Closure required a **structural** fix — one format-aware authority per predicate, delete the second grammar, move the gate to the point of effect, unfreeze a frozen weaker duplicate — plus parser-oracle fuzzing, ≥2 independent red-teams, and self-reproduction of the bypass (PROJECT.md Constraints; Key Decisions "the closure doctrine", D-12).
>
> **A live instance of exactly that failure is already open at v2.1 kickoff.** `guard_caveman_preserved` (check-foundation-guards.ts:450) asserts `>=2` lines matching `/^You\b/` **OR** `>=1` idiom from `VOICE_MARKERS`. Its grammar is *sentence shape*. The predicate it claims to police is *voice*. Sentence shape is a strict subset of voice, so all 17 blocks drifted to plain English (zero `grug`) and the guard stayed GREEN for a full milestone. Every guard v2.1 adds is at risk of the same shape.
>
> **Therefore this document imposes one extra requirement on every proposed guard, and the roadmapper should treat it as a phase success criterion:** each guard must ship with a written statement of *(a) the exact grammar it matches, (b) the predicate it is claimed to enforce, and (c) whether (a) is a strict subset of (b)*. If (a) ⊊ (b), the guard **may not be described as enforcing (b)** anywhere in the kit, the trace, or the docs — the claim must be narrowed to what the grammar actually decides. Over-claiming a guard is a **no-fabrication violation**, not a documentation nit. See the *Guard Grammar Audit* table below.
>
> **Phase numbering:** v2.0 ended at Phase 26; v2.1 phases start at **27**. The phase names below are the researcher's recommended *themes* — the roadmapper assigns final numbers. The load-bearing ordering claim is at the bottom.

---

## Critical Pitfalls

### Area A — Fixing the subagent spawn path across a portable kit

---

### P-01: Fixing the spawn path with a guard that has the same blind spot that hid the bug

**What goes wrong:**
`guard_wr05` is extended to "also check that role agents exist," implemented as a grep for role names, and it passes while the route is still broken — because the guard checks a *token* and the failure lives in the *relationship between two files*.

**Why it happens:**
`guard_wr05` was deliberately built as a frontmatter-token matcher that "matches the frontmatter TOKEN only — NEVER the prose word `spawn`/`sub-agent`" (check-foundation-guards.ts:19-21). That calibration was correct for its original predicate ("no rogue file grants `Agent`") and is exactly wrong for the new one. The current defect proves it: the orchestrator adapter's frontmatter grants `Agent(grugops-software-engineer, grugops-qe-e2e, grugops-security-nfr, grugops-architect-design, grugops-system-analyst, grugops-uat-planner, grugops-release-manager)` — **7 names, 0 of which exist on disk** (`.claude/agents/` contains exactly one file). `guard_wr05` passes, because a grant token is present and the coordinator cardinality is 1. Its grammar has no notion of *referential integrity*.

**How to avoid — structural, not heuristic:**
Add a **referential-integrity oracle** that enumerates from *both* authorities and asserts **set equality**, not membership:
- **Forward:** every name inside the coordinator's `Agent(...)` grant MUST resolve to a file under `.claude/agents/` whose frontmatter `name:` equals it exactly. A name with no file → FAIL, naming the name.
- **Reverse:** every routable role in the Orchestrator routing matrix (`agent-factory/roles/orchestrator.md`) and every non-`_`-prefixed file in `agent-factory/roles/` MUST appear in the allowlist, or be on an explicit, *named-and-justified* `NOT_ROUTABLE` list committed in the guard source. An unlisted role → FAIL. (`greenfield-mapper` is the one that bit the user; a membership-only check would never have caught it.)

This is not a subset heuristic: it derives its expected set from the filesystem and the role corpus rather than pattern-matching a shape, so a new role added later fails the guard by default rather than silently degrading. It is the same both-direction design `guard_wr05` already uses for the coordinator (check-foundation-guards.ts:110-118) — extended from "who may grant" to "what the grant resolves to."

**Warning signs:**
- The extended guard is written as one more regex against one more file.
- The guard passes on a tree where `.claude/agents/` has been emptied. (Make that a RED fixture — it is the current production state and must fail.)
- Nobody can state what the guard does when a role file is *added*.

**Phase to address:** Phase 27 (Spawn Correctness & Adapter Integrity) — build the oracle **before** authoring the 17 adapters, so the adapters land into a guarded environment (the v1.2/v2.0 foundation-guards-first pattern).

---

### P-02: The adapter *body* stays unguarded, so stale prose survives another "grep-to-zero"

**What goes wrong:**
v2.0 recorded a "grep-to-zero" removal of all handoff references. It was not zero. `.claude/agents/grugops-orchestrator.md` still instructs: *"one window, drop prior context, the handoff is the only memory — demand a handoff packet from each"* — the single most load-bearing adapter in the kit, telling the coordinator to run sequentially and demand artifacts that were deleted in Phase 24. The guards inspect that exact file for spawn grants (`guard_wr05`), byte size (`guard_adapter_size`), and kit paths (`check-kit-refs`) — **none of them read the body prose.**

**Why it happens:**
The guard set was designed around the correct v1.x/v2.0 fear: adapters must not *become copies* of role text. So it polices size and tokens. It has no authority over *semantic staleness*, and a body-prose grep was explicitly avoided (D-09 token-vs-prose care) to prevent false positives on explanatory text.

**How to avoid — structural:**
Do **not** answer this with a forbidden-phrase grep. A blocklist of dead terms (`handoff`, `packet`, `one window`) is precisely a strict-subset heuristic: the next stale phrase is not on the list. Instead, **generate the adapter body** and gate it with byte equality. This repo already has three working instances of exactly that pattern:
- `scripts/generate-catalog.ts` + `catalog-freshness.ts` (`freshness:catalog`)
- `scripts/trace-render.ts` + `trace-freshness.ts` (`freshness:traceability`)
- `scripts/claim.js now-running` + `now-running-freshness.ts` (`freshness:queue`)

Make the adapter body a deterministic render of single-source role text (`agent-factory/roles/*.md` + the role-switch protocol) plus the installer-materialized kit path, and add `freshness:adapters` — a mirror-regenerate + `Buffer.equals` gate that fails red on drift. Then stale adapter prose is not *detectable*, it is **unrepresentable**: an editor cannot leave stale text behind, because a regenerate would not reproduce it. This also permanently discharges the "adapters drift from single-source role text" constraint rather than re-checking it each milestone.

If full generation is judged too large for one phase, the **minimum viable structural** step is: reduce the adapter body to a pointer plus a *frozen, byte-hashed* block, with the hash committed and checked. A body edit then fails red without anyone having to predict the offending word.

**Warning signs:**
- The proposed fix is "add `handoff` to a deny-list."
- The word list has to be updated whenever new vocabulary is retired.
- `git grep handoff` is being used as the acceptance evidence. (It was last time, and it returned zero while a live reference existed — because the grep set excluded `.claude/`.)

**Phase to address:** Phase 27.

---

### P-03: The fix works on Claude Code and silently breaks the four degraded CLIs

**What goes wrong:**
Codex CLI, Gemini CLI, OpenCode, and Copilot CLI have no spawn model — they run the concurrency-1 sequential path over the same substrate (PROJECT.md, PAR-02/03). Authoring 17 Claude subagent adapters and rewiring the coordinator to spawn can quietly (a) delete or contradict the sequential role-switch instructions those four depend on, or (b) push the four onto a code path whose on-disk output no longer matches the parallel one — breaking the invariant `oracleDualPathEquivalence` exists to protect.

**Why it happens:**
Claude Code is the only tool the developer is actually running while fixing this. The other four are exercised only by the oracle, and the oracle is a *simulation* (`oracleDualPathEquivalence` replays one seeded decomposition two ways in hermetic temp roots driving the committed `claim.js`/`context-io.js` — check-uat-oracles.ts:16-23). A simulation proves the substrate converges; it does not prove a Gemini CLI session still reads a coherent instruction set.

**How to avoid:**
- Re-run `oracleDualPathEquivalence` as a **blocking** criterion after the rewire, and treat any change to the sequential path as requiring the oracle to be re-derived, not just re-run.
- Add one **negative** criterion the oracle does not currently assert: the sequential path must reach the same artifact set *without* any `.claude/agents/` file present at all. If deleting `.claude/agents/` changes the sequential result, the two paths are coupled and the degradation is not real.
- Keep the role-switch protocol (`_role-switch-protocol.md`) as the single source for the sequential contract, and make the Claude adapters *reference* it rather than restate a parallel variant of it. Two spawn narratives = two grammars = the documented failure mode.

**Warning signs:** the phrase "the other CLIs are unaffected" appears in a plan without a run that proves it. A `.claude/`-specific instruction appears inside `agent-factory/` (the portable kit).

**Phase to address:** Phase 27, verified again in Phase 33 (Live Capture).

---

### P-04: Proving spawning with a test that can pass without a spawn ever happening (vacuous test)

**What goes wrong:**
A test asserts that the adapters exist, that the allowlist is complete, that the substrate converges — all green — and *no role agent has ever run in its own session*. This is precisely the v2.1 kickoff finding: the model "silently completes the work inline" when a spawn fails with agent-type-not-found, producing outputs that look identical on disk.

**Why it happens:**
Inline completion is *output-equivalent* to a real spawn for most artifacts. That is what made the defect survive a whole milestone. Any assertion over artifacts alone is therefore vacuous with respect to the predicate "a subagent ran."

**How to avoid — the discriminating evidence must be something inline execution cannot produce:**
- The captured run must contain a **per-agent session identity** that inline execution cannot forge: a note whose `by:` is the role identity *and* whose provenance carries a distinct session/run id, or the platform's own subagent-start marker in captured output.
- Better: make the *absence* of a spawn a **hard failure at the point of effect** rather than a silent fallback. If the coordinator cannot resolve a role agent, it must STOP with a named error, not proceed inline. "Move the gate to the point of effect" is the closure doctrine's own prescription and it applies literally here: today the point of effect (spawn attempt) silently degrades; the gate is far away in a guard file.
- The capture rule already in force applies unchanged (D-01/D-02): **a loud skip is not a capture; a passing suite that skipped the live lane is not a capture.** The evidence is a date + a verdict + the captured output.

**Warning signs:** the acceptance evidence for "spawning works" is a green `npm test`. The word "presumably" or "should now" appears near the spawn claim. Nobody can name the byte in the capture that only a real spawn produces.

**Phase to address:** Phase 27 designs the discriminator; Phase 33 captures the run — and this is the *same* captured run GAP-D1 has waited for since v1.0, so schedule them together.

---

### Area B — Making previously-hard safety floors configurable

---

### P-05: A parse failure that fails OPEN — already present in this codebase

**What goes wrong:**
The config reader that governs a safety control returns the *lean* default when it cannot read or parse the config, so a corrupted, truncated, or permission-denied `factory.config.json` silently disables governance.

**Why it happens — this is not hypothetical here:**
`readGovernanceConfig()` (context-io.ts:1220) is carefully fail-closed on *degenerate shapes* — a non-object config, a non-object `context` key, and a present-but-non-string `human_admission` all return `GATE_OR_STRICTER_HUMAN_ADMISSION`. But its `catch` block (context-io.ts:1257-1259) reads:

```
} catch {
  // Unreadable / non-JSON / any failure → fall through to the lean default. Never throw.
  return { ...GOVERNANCE_DEFAULTS };
}
```

`GOVERNANCE_DEFAULTS.human_admission` is `off`. So **an unreadable or malformed config yields `off`** — the permissive branch — while a *readable-but-degenerate* one yields strict. The project already noticed this asymmetry and solved it by adding a **second reader**, `readGovernanceConfigResult()` (context-io.ts:1288), which distinguishes unreadable-vs-absent "for the hook." That is two config-reading authorities with different failure semantics over the same file — the exact "second grammar" the closure doctrine says to delete.

**How to avoid — structural:**
The per-checkpoint autonomy matrix must **not add a third reader**. Collapse to **one** config authority returning a discriminated result `{ absent } | { present, values } | { unreadable, rawError }`, and let every consumer (matrix, hook, `admit`, validator, dashboard) branch on that one shape. Rules:
- **absent** → lean defaults (zero-config-first is preserved; this is the only permissive branch and it requires proving the file genuinely does not exist).
- **present** → canonicalize each key; any value not exactly a defined variant → the **strictest** defined variant, with the raw unknown value preserved and reported (the protobuf `unknown-field-set` prescription; never normalise an unknown away).
- **unreadable** → strictest, loudly, naming the path and the errno. Never lean.

Then delete `readGovernanceConfig`'s value-only form, or make it a thin projection of the result form so the two cannot drift.

**Warning signs:** two functions read the same config file. A `catch {}` returns a default. A test asserts behavior for a *missing* file but not for a *present-but-`chmod 000`* file, a truncated file, a BOM-prefixed file, or a file containing `{"context":{"checkpoints":null}}`.

**Phase to address:** Phase 30 (Per-Checkpoint Autonomy Matrix), as the *first* plan in the phase — before any checkpoint reads the matrix.

---

### P-06: Default-open on a typo, a new checkpoint, or a partially-specified matrix

**What goes wrong:**
Moving from an `autonomy` **scalar** to a per-checkpoint **matrix** multiplies the enum surface from one key to N keys. Three new default-open channels appear: (a) a misspelled checkpoint name is silently ignored → that checkpoint uses the code default; (b) a checkpoint added in a later phase has no matrix entry → falls to whatever the lookup returns for a missing key; (c) a valid key with an unrecognised value maps to "not strict" by falling through an `if (value === 'require_human')` test.

**Why it happens:**
Object lookups return `undefined` for both "not configured" and "misspelled," and `undefined` reads as falsy. The scalar form had exactly one place to get this wrong; the matrix has one per checkpoint. Documented in the wild: JUnit silently accepted invalid values for a severity config parameter, so users believed they had configured a control they had not.

**How to avoid — structural:**
- The set of checkpoints is a **closed, exported constant** (one authority). The config reader validates the matrix against it and **rejects unknown keys loudly** rather than ignoring them — an unknown key is far more likely a typo of a real checkpoint than a forward-compat extension, and this kit has no forward-compat requirement for config keys.
- The lookup is **total**: `checkpointPolicy(name)` is typed over the closed set, so adding a checkpoint without adding a default is a **compile error**, not a runtime open door. This is the cheapest structural win available in the whole milestone — TypeScript exhaustiveness checking is a real authority, not a heuristic.
- Every value canonicalizes through **one** function; the fallback is the strictest variant, not the code default. Reuse `canonicalizeHumanAdmission`'s shape (it already NFKC-folds, strips zero-width code points, and lowercases — the round-8 GAP-R7-1 lesson) rather than writing a fresh `.trim().toLowerCase()`. A fresh trim-only comparison is *literally* the frozen weaker duplicate that cost Phase 25 an extra round.

**Warning signs:** a `Record<string, string>` type for the matrix. Any `?? 'off'` or `|| false` near a checkpoint read. A test matrix that varies values but never varies *keys*.

**Phase to address:** Phase 30.

---

### P-07: The agent can write the config that governs it

**What goes wrong:**
The autonomy matrix lives in `.grugops/factory.config.json`, inside the repo the agent edits, with an editor tool the agent holds. An agent that finds a checkpoint inconvenient edits the matrix, then passes the checkpoint. The audit trail records a pass.

**Why it happens:**
This is not a new hole — v2.0 already documented the irreducible residual ("same-uid / no-hook direct-FS forgery is not preventable by a hook running as the same user," Key Decisions) and backstopped it with `autonomy=pr`, humans holding merge. But that backstop was sized for the *v2.0* threat model, in which the four floors were **un-dialable** and so an agent editing config could not reach them. Making the floors dialable **widens the blast radius of the same residual**: config edits now reach merge, prod deploy, test-integrity justification, and verify-before-write.

**How to avoid:**
- **Do not put the lowering in the config file.** Split the two things a dial does: the config may express *intent to run at a lower tier*; the **grant** must live where the agent's process cannot write it. The prod-deploy hook already demonstrates the pattern: `GRUGOPS_PROD_DEPLOY_APPROVED` is read from the hook's own process env, set by a human in the launching shell, and the guard explicitly refuses inline self-approval (`hooks/guard.ts:86-87` matches `VAR=1 cmd`, `export VAR=1`, and `env VAR=1 cmd` forms and denies them). Extend that mechanism rather than inventing a second one.
- Make the lowered floor **fail closed on the grant, not on the intent**: a config that says `merge: agent` with no live human grant behaves exactly as `merge: human`, and says so out loud on every run.
- Put the config file itself under a **change-detection** gate: the matrix's committed state is part of the trace, so a matrix change inside a task's own commit range is a reviewable event, not invisible.

**Warning signs:** the design has exactly one place (`factory.config.json`) that both expresses and grants the lowering. The word "trusted" appears about a file in the working tree. The threat model says "the agent wouldn't do that."

**Phase to address:** Phase 30. Budget the closure-doctrine cost (≥2 independent red-teams + self-reproduction, D-12) — this phase touches the four hardest floors in the product and is the direct successor to Phase 25, which took 8 rounds.

---

### P-08: An env-var opt-in the agent's own subprocess can set

**What goes wrong:**
The "human sets it in the launching shell" mechanism is reimplemented for the new checkpoints, and the new implementation reads the variable from a place the agent can influence — a `.env` file, a `direnv` config, the child env of a `Bash` call, or a variable exported by a script the agent wrote.

**Why it happens:**
`process.env` looks like one thing but is really two: the env the *hook/guard* process inherited from the human's session, and the env an agent-spawned child was handed. Only the first is un-forgeable, and only because the hook runs in the harness's process tree, not the agent's. context-io.ts:956-959 states this precisely — the in-script tier "is settable in `admit()`'s own child env" and is therefore explicitly the **weaker** tier (D-05), with the separate admission-guard hook as the un-forgeable primary.

**How to avoid:**
- Reuse the existing two-tier split verbatim: an in-script **defense-in-depth** refusal that is honestly labelled self-settable, plus a **hook** tier that is the only grant path. Do not invent a third tier with unstated strength.
- Never read the grant from a file in the repo (`.env`, `.envrc`, a config key) — only from the process env of a guard the agent did not launch.
- Add the negative test explicitly: a run where the agent's own `Bash` call exports the grant variable must **still** be refused. This test exists in spirit for prod-deploy; it must exist per-checkpoint for the new matrix.
- For the four non-Claude CLIs there is no hook, so the un-forgeable tier is **absent**. Say so in the docs; do not let the matrix imply a guarantee those four cannot deliver. (This is the same "server-less admission gate" gap already acknowledged as accepted-for-now.)

**Warning signs:** a grant read via `dotenv`-style loading. A test that sets the variable in the test process and calls it proof. Docs that describe the grant identically for all five CLIs.

**Phase to address:** Phase 30.

---

### P-09: The claim outlives the guarantee — a lowered floor that the docs still advertise

**What goes wrong:**
A user lowers `test_integrity` or `verify_before_write`, and README / `docs/catalog/` / role prompts / the marketing copy still assert "an agent cannot stamp its own pass." The audit trail now **overstates its guarantees**, which for this project is the worst possible defect: it is fabrication with extra steps.

**Why it happens:**
Claims live in prose across ~72 kit files plus a generated catalog plus a README, and none of them are wired to the dial. Nothing today makes a claim conditional on a config value.

**How to avoid — structural, and this is the highest-leverage idea in the milestone:**
Make the *claim* a **derived artifact**, not authored prose. Concretely:
- Introduce a generated `.grugops/GUARANTEES.md` (or a section in a per-run trace header) rendered by a script from the **live** matrix + grant state — the same render-plus-freshness-gate family already used three times in this repo. When a floor is lowered, the rendered guarantee text *changes*, automatically, with no author involved.
- Every gate result, verdict note, and UAT record carries the **effective checkpoint policy at the moment it was produced**. A `READY_FOR_HUMAN_REVIEW` produced under a lowered test-integrity floor must be distinguishable, forever, from one produced under the default. Otherwise the trace cannot be re-read honestly later.
- **Loud, per-run, at the point of effect:** the terminal result banner names every non-default checkpoint. Not a config comment; not a doc footnote. The v2.0 precedent is the "advise loudly, never hide" floor already written into workflow 05 (`quality.test_integrity` has no `off` value in any mode; advisory mode advises loudly, it does not hide) — extend that discipline, do not weaken it.
- Prose claims in static files should be **narrowed once** to the un-dialable residue ("humans hold merge and deploy unless a named human has granted otherwise for this run") and otherwise **point at** the generated guarantee surface. A static file must never assert an unconditional guarantee that a dial can remove.

**Warning signs:** `README.md` says "cannot" about something the matrix can now switch off. A verdict note has no record of the policy under which it was produced. Someone proposes "we'll document the caveat" instead of rendering it.

**Phase to address:** Phase 30 builds the render + the per-run banner; Phase 28 (Kit Consistency Audit) sweeps the static claims and narrows them.

---

### Area C — Agent-driven browser testing as acceptance evidence

---

### P-10: The agent narrates a pass instead of executing one (hallucinated assertion)

**What goes wrong:**
The agent reports "clicked Save, saw the success toast, UAT-03 passes." No assertion ran. This is the single documented failure cluster for agent browser automation: agent-authored failures group into *hallucinated assertions* (the agent invented a verification step), test explosion, and business-logic gaps.

**Why it happens:**
An LLM driving a browser produces prose about the browser. Prose is the default output format, and prose is exactly the thing this project has spent four milestones refusing to accept as evidence.

**How to avoid — structural:**
The pass/fail must be a **tool return value, not a model sentence**. Route every assertion through a tool whose result is machine-produced and whose failure is a non-zero result the agent cannot restate away — Playwright MCP's first-class verification tools (`browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value`) and `browser_generate_locator`, or, better for this project, a **generated Playwright spec file** that the existing §14 gate runs as an ordinary `e2e` step. grugops already has the un-cheatable path built: `emitVerdict()` is the sole `§14-gate` author, and `admit()` cross-checks a finding's stamp against a live GREEN verdict. **Browser evidence should enter through that door and no other.**

The right architecture is therefore: *the agent may author the test; the agent may never author the result.* An agent-driven exploration session's output is a **committed spec file**, whose execution under the gate mints the verdict. Anything the agent says between those two events is commentary.

**Warning signs:** a UAT row flips to `passed` from an agent's transcript. The evidence artifact is a paragraph. `verified_by` is anything other than a real `§14-gate#<id>`, a passing test, or `human:NAME`.

**Phase to address:** Phase 31 (Autonomous Manual Testing).

---

### P-11: A run that never happened, reported as green

**What goes wrong:**
The browser tool is absent, unauthenticated, headless-vs-attended mismatched, or the MCP server failed to start — and the lane reports success because "no failures were observed."

**Why it happens:**
Absence of failure reads as success in almost every harness that is not explicitly designed against it. Claude in Chrome requires an attended browser with site-level permissions; Playwright MCP requires a server; neither is present in CI.

**How to avoid:**
grugops has already solved this exact problem once and the solution should be copied verbatim, not redesigned. The Tier-2 `claude --print` lane **always runs a present-and-authed probe first**, and on absence emits a *loud, distinctly-marked SKIP* (`SKIPPED: claude CLI absent or unauthed …`) — "a skip is NOT a pass: the underlying UAT stays `pending`, and its status flips to passed/resolved only from a real authed run's captured output" (workflow 05, step 3). Apply identically:
- Probe browser availability **before** the lane; loud skip on absence; the UAT stays `pending`.
- Never let the browser lane sit inside the default `npm test` green path without the probe.
- The skip marker must be textually distinct from a pass so `grep` cannot confuse them (this is why the existing marker is `SKIPPED:` and not `ok (skipped)`).

**Warning signs:** the lane exits 0 with no output. The UAT status changed on a machine with no browser. "It works on my machine" is the only evidence.

**Phase to address:** Phase 31.

---

### P-12: Evidence not bound to a commit, a run, or a state

**What goes wrong:**
A screenshot exists. Nobody can prove which commit it came from, whether it was taken before or after the assertion, or that it shows the asserted state. A screenshot taken *before* the click is indistinguishable from one taken after, and a stale screenshot from a previous run is indistinguishable from a fresh one.

**Why it happens:**
Screenshots are captured for humans, so they carry no provenance. The kit's own note schema *does* carry provenance (typed six-kind notes with a provenance fence, `refs`, `at`, `by`, `verified_by`) — but an image dropped into a directory bypasses all of it.

**How to avoid:**
- Evidence is an **`artifact-ref` note**, not a loose file: `refs` carries the commit SHA, the gate run id, the ticket id, and the spec/test id; the image is referenced by content hash. The trace renderer (`trace-render.ts`) already classifies refs by shape and fills the matrix from them — extend the classifier, do not add a parallel evidence ledger. (A parallel ledger is a second grammar.)
- Bind the assertion and the capture: capture **after** the tool assertion returns, in the same tool invocation, or capture Playwright's own trace (which carries the ordered action log) rather than a bare PNG.
- Refuse an evidence note whose commit SHA is not the HEAD the gate ran against — same class of check as `admit()`'s live-verdict cross-check, and reusable.

**Warning signs:** an evidence directory with no index. Filenames as the only metadata. Two runs whose screenshots are byte-identical (a strong tell that nothing re-ran).

**Phase to address:** Phase 31.

---

### P-13: Flaky selector read as a product failure — or worse, as a product pass

**What goes wrong:**
A locator breaks; the agent reports a product defect and files a finding. Or a locator matches nothing and the "verify text visible" call is written so that not-found short-circuits into a skipped assertion, so the test silently no-ops and reports green.

**Why it happens:**
Agent-generated locators are brittle, and the failure surface of "selector wrong" and "feature broken" is identical from inside the browser. The silent no-op variant is worse and is a known agent-authored pattern: a `try/catch` around an assertion, or an assertion inside a conditional that is false.

**How to avoid:**
- Prefer **accessibility-tree snapshot mode** (Playwright MCP's default) over pixel/DOM selectors: element identification is deterministic and role/name-based, which is both more stable and independently meaningful.
- Ban conditional and caught assertions in generated specs mechanically. This is a genuinely checkable predicate on a generated file (an assertion inside `try`, `if`, or `catch`), and unlike prose it has a real grammar — but note it is still a *subset* check on the TypeScript spec text unless implemented over the TS AST. **Implement it over the AST**, not a regex, or do not claim it.
- Distinguish the two failures at the source: a locator that resolves to zero elements is a **harness error** (exit code distinct from a test failure), mirroring how the test-integrity checker already separates exit `1` (finding) from exit `2` (could not run) in workflow 05 step 3. That three-valued convention is already the house style; reuse it.

**Warning signs:** a finding blaming the product with no reproduction outside the browser session. A spec with `try { expect(...) } catch {}`. A "0 assertions" run reported green.

**Phase to address:** Phase 31.

---

### Area D — Rewriting a markdown corpus to a controlled-language standard

---

### P-14: Claiming ASD-STE100 conformance that cannot be mechanically verified

**What goes wrong:**
The kit ships a claim of "ASD-STE100-derived controlled language, enforced by `guard_ste`." The guard checks approved words and sentence length. STE's actual requirements include one-topic-per-sentence and clarity, which no checker decides. The claim exceeds the guarantee — a no-fabrication violation in the project's own terms.

**Why it happens:**
"Controlled language" sounds mechanically decidable. It is not, and the standard's own community says so plainly: **no language checker can guarantee full compliance with STE, because the goal of STE is clarity, and only human writers can judge whether a sentence makes good sense.** Every commercial checker (Boeing SEC, HyperSTE, Congree, Acrolinx, ARDOS, TechScribe) is documented as partial, and all vendor guidance says checker output must be interpreted by a trained human.

**How to avoid:**
- **Split the predicate explicitly and publish the split.** Decidable subset: approved-dictionary membership + permitted part-of-speech, sentence-length cap (~20 words procedural / ~25 descriptive), paragraph-length cap, banned constructions (passive in procedures, gerund strings, noun clusters > 3). Non-decidable remainder: one-topic-per-sentence, clarity, correctness of meaning.
- `guard_ste` polices **only** the decidable subset and is **named for it** — e.g. `guard_ste_lexicon_and_length`, not `guard_ste`. A guard named for a predicate it does not decide is the `guard_caveman_preserved` mistake with new vocabulary.
- The kit's claim becomes: *"workflow steps, checklists, memory-bank, context notes, board, and traceability follow an ASD-STE100-**derived** profile; the mechanically enforced subset is X, and the remainder is a human review item."* That sentence is true, checkable, and still sells the feature.
- The non-decidable remainder gets a **human Tier-3 sign-off**, exactly like the existing B1/B2 persona/prose judgment item. Do not pretend it automated away.

**Warning signs:** any file says "STE-compliant." The guard name matches the standard's name. A conformance percentage is quoted with no denominator.

**Phase to address:** Phase 29 (Controlled Language), first plan — write the split before writing the guard.

---

### P-15: Semantic drift while "just rewording" safety and compliance text

**What goes wrong:**
A mass rewrite pass touches `05-pr-quality-gate.md`, `15-security-audit.md`, `16-context-read-write.md`, the ASVS checklist, and the prod-deploy prose. Load-bearing precision is smoothed away: "a finding whose stamp matches no live green verdict is refused" becomes "findings need a verdict"; "never on `BLOCKED_NEEDS_FIX` or `SPLIT_REQUIRED`" loses its enumeration; `warn|block`-only becomes "configurable."

**Why it happens:**
Controlled-language rewriting optimises for short sentences and approved words. The safety text in this kit is long and precise *on purpose* — much of it is the written form of an invariant that took 8 rounds to close. Shortening is the failure mode, and it is invisible in a diff review that is looking at style.

**How to avoid:**
- **Carve the safety surfaces out of the STE profile.** The milestone already scopes STE to "workflow *steps*, checklists, memory-bank, shared-context notes, board, traceability" — hold that line hard, and add an explicit **exclusion list**: the emission/admission paragraphs of workflow 05, workflow 16's protocol, workflow 15 + the ASVS checklist, the prod-deploy prose, and every `UNKNOWN - verify` sentence. The existing `SEC_VOICE_FILES` list in `check-foundation-guards.ts` is already the beginning of such a carve-out and should be reused as the seed, not re-derived.
- Rewrite **one file per commit**, with the diff reviewed for *meaning* by a reviewer who did not write it. A 37-file bulk commit cannot be reviewed for semantic drift and should be rejected on sight.
- For each excluded-but-touched paragraph, require a before/after pair in the plan.
- Note the existing precedent: the Phase 14 security checklist was *generated from a pinned ASVS source* precisely so it could be proven "not hand-transcribed." Any safety text that can be generated should be, rather than rewritten.

**Warning signs:** a single commit touching >5 kit files with the message "STE pass." An enumeration (`lint → typecheck → unit → build → e2e → test-integrity`) becomes "the gate steps." A "must" becomes a "should."

**Phase to address:** Phase 29, with the exclusion list ratified in Phase 28's consistency audit.

---

### P-16: The rewrite breaks byte ceilings, exact-match oracles, and cross-file references — and the "fix" retires the guards

**What goes wrong:**
Three concrete mechanical breakages, all pre-identifiable:

1. **`guard_role_size` byte ceilings.** `roleCeiling()` (check-foundation-guards.ts:487) hard-codes per-file FAIL/WARN byte pairs derived from a 2026-06-10 baseline. A prose rewrite changes every one. The tempting fix — bump the ceilings until green — **silently retires the anti-bloat guard**, which is the guard that has been holding roles terse for four milestones.
2. **`oracleWr05Wording`.** A Tier-1 auto-UAT oracle asserting three semantic beats appear in **`.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`, `.planning/RETROSPECTIVE.md`** (check-uat-oracles.ts:110-115), matched by per-beat regexes requiring an action token and a phase on the *same line*. This oracle is folded into the foundation-guards aggregator and fails the build. It has already broken once in this project from ordinary STATE.md editing. Any milestone that rewrites planning prose will break it.
3. **Cross-file single-source references.** Roles and workflows reference each other by exact path and by section name ("per `agent-factory/workflows/16-context-read-write.md`", "see the human-only short-circuit in Step 4"). Renumbering a step or renaming a section during a rewrite silently orphans the reference — `check-kit-refs` validates paths, not step numbers.

**How to avoid:**
- **Ceilings:** re-baseline in **one** commit at the **end** of the rewrite, and require the new baseline to be **≤ the old** for every file. The milestone's stated goal is de-duplication ("say each thing once"); if bytes go *up*, the phase did not do what it claimed and the guard should say so. Record the delta per file in the plan. Never adjust a ceiling mid-rewrite to unblock a commit.
- **`oracleWr05Wording`:** freeze the four scanned `.planning` files against the rewrite, or migrate the beats to a dedicated, purpose-built file that is not editorial prose. Do **not** loosen the regexes — loosening an oracle to accommodate an edit is the "second grammar" pattern in miniature.
- **Cross-file references:** before rewriting, run an inventory of every intra-kit reference *including* step numbers and section titles; assert it after. This is a genuinely mechanical check (references are structured), so build it as a real guard rather than a manual pass. Stabilise step numbering by *not renumbering* — rewriting a step's prose is in scope; changing its number is not.

**Warning signs:** a commit message contains "adjust ceiling." A regex in an oracle gets `?` or `.*` added during a prose phase. `npm test` fails and the fix touches a `.test.ts` rather than the source.

**Phase to address:** Phase 29, with the ceiling re-baseline as its own final plan and a mandatory ≤-old assertion.

---

### P-17: The voice guard is rebuilt as another sentence-shape heuristic

**What goes wrong:**
`guard_caveman_preserved` is replaced with a "measures voice, not shape" guard that in fact counts a different shape — say, lowercase sentence starts, or absence of articles — and drifts green again.

**Why it happens:**
Voice is not mechanically decidable, for the same reason STE clarity is not. Any implementable check is a proxy. The previous proxy (`^You` ×2 OR one idiom) failed because it was satisfiable by text that had none of the intended character.

**How to avoid — narrow the predicate until it is decidable, then name the guard for the narrow thing:**
- The measurable, non-gameable core is **lexical density against a committed voice lexicon**: the block must contain ≥ N distinct tokens from a committed `voice-lexicon.md` (which must include `\bgrug\b` — its total absence across all 17 blocks was the tell), at a floor ratio to block length. This is checkable, has a real denominator, and cannot be satisfied by any amount of plain English.
- Add the **negative** half, which is where the old guard had nothing: banned clear-voice constructions inside the block (full articles above a rate threshold, sentences over N words, second-person auxiliary chains). The old guard had only a positive test and so could not detect *dilution*.
- **Publish the number.** "17/17 blocks carry ≥5 lexicon tokens at ≥3% density" is a claim with a denominator a reader can re-derive. "Voice preserved" is not.
- Fuzz it: the guard must be run against (a) all 17 current blocks — which should **FAIL RED today**, and that RED is the acceptance evidence for the rebuild; (b) a corpus of plain-English blocks that pass the old guard; (c) adversarial blocks that stuff lexicon tokens into otherwise plain prose. If (c) passes, the density floor is too low.

Because this guard *is* an unavoidable heuristic, it must carry the full unavoidable-heuristic tax: parser-oracle fuzz over the fence grammar (an unclosed fence, a nested fence, CRLF, a `## Caveman prompt` heading inside a fence), ≥2 independent red-teams, and a written statement that it measures lexical density and **not** voice.

**Warning signs:** the new guard passes on the current 17 files. The guard's name contains the word "voice." No number is reported, only PASS.

**Phase to address:** Phase 29.

---

### P-18: Unmeasurable conformance — "the rewrite landed" with no denominator

**What goes wrong:**
The phase completes, 37 files are rewritten, and the only evidence is that the guard is green. Since the guard polices a subset, green means "no violation of the subset was found," which is compatible with the migration having missed a third of the corpus.

**How to avoid:**
- Report **coverage** and **conformance** as two separate numbers with denominators: *files in scope / files rewritten* and *sentences checked / sentences conformant*, per surface. A file not in the scan set must be visible as such.
- The scan set must be **derived**, not hand-listed. This repo has the bug already: `guard_context_writes`'s `CTX_WORKFLOWS` lists workflows `00`–`15` — **16 files** — while `agent-factory/workflows/` now contains **19**, so `16-context-read-write.md`, `17-task-claim.md`, and `18-context-compaction.md` are **outside the scan set**. Those are precisely the three workflows that describe context I/O. Any new hand-listed scan set will rot the same way. Derive from `readdirSync` (as `generate-catalog.ts` already does) and assert the count against an expected total so a *shrinking* corpus also fails red.
- Keep a per-file conformance record in the trace so a later reader can tell which files were migrated and which were excluded and why.

**Warning signs:** a hard-coded file array in a new guard. A phase report that says "all files" without a count. The count does not match `ls agent-factory/workflows | wc -l`.

**Phase to address:** Phase 29; the `CTX_WORKFLOWS` scan-set gap is a Phase 28 (Consistency Audit) fix and should be listed as a finding there regardless.

---

### Area E — Read-only monitoring dashboard over actively-written files

---

### P-19: A second board grammar (the highest-probability repeat of the documented failure)

**What goes wrong:**
The dashboard ships its own board parser. It now disagrees with `validate-agent-factory.ts`'s parser about what a column is, and the two drift. The board renders one truth; the validator enforces another.

**Why it happens:**
The dashboard's needs (live counts, per-ticket detail, WIP display) are richer than the validator's (does this ticket's `column:` name an existing board heading?), so writing a fresh parser feels natural. There is already a board grammar in `validate-agent-factory.ts:419-443`:

```
boardColumnName(line) = line.replace(/^##\s+/,"").replace(/\s*\(WIP[^)]*\)\s*$/,"").trim()
boardHasColumn(col)   = boardLines.some(l => l.startsWith("## ") && boardColumnName(l) === col.trim())
frontMatter(text)     = { column: /^column:\s*(.+)$/m, status: /^status:\s*(.+)$/m }
kebab(column) === status
```

Note that this grammar was **already** hardened once for exactly this class of bug (WR-03: `startsWith("## " + col + " ")` accepted word-prefixes, so column `In` matched `## In Development (WIP 0/3)`). A second parser will not inherit that fix.

**How to avoid — structural, and this is the milestone's stated design already, so hold it:**
**ONE board/state parser authority**, exported, emitting a typed snapshot. The dashboard renders the snapshot. The validator **consumes the same parser** rather than keeping its inline regexes. A future web app renders the same snapshot unchanged. Delete the second grammar; do not sync it. This is literally the doctrine's prescription and the CMP-02 fix that finally held ("a single exported frontmatter grammar shared by `parseNote` and `splitNotes` so the two cannot drift").

Concretely: the parser owns the board-heading grammar, the WIP-marker grammar, the ticket-row grammar, and the ticket-frontmatter grammar. Everything else imports it. Add a parser-oracle fuzz suite over board fixtures (a heading with no WIP marker, `(WIP unlimited)`, `(visible, time-tracked)`, a heading inside an HTML comment — **note `plans/board.md` ships with a large `<!-- -->` documentation block containing example `## In Development (WIP 1/3)` headings and example ticket rows; a naive parser will read the documentation as live state**, which is the same fenced-example trap `guard_wr05` hit and fixed with `stripFencedBlocks` + cardinality).

**Warning signs:** the word "parse" appears in a dashboard file. `validate-agent-factory.ts` is untouched by the dashboard phase. The dashboard shows a column the validator does not recognise.

**Phase to address:** Phase 32 (Board Projector & CLI Dashboard) — projector first, dashboard second; the validator re-point is part of the same phase, not a follow-up.

---

### P-20: Torn reads — the board is *not* written atomically

**What goes wrong:**
The dashboard reads `plans/board.md` while a role is mid-write and renders a truncated board — or worse, a board that parses cleanly but is missing a column, so the operator sees a confidently wrong state.

**Why it happens:**
grugops has an atomic writer, `atomicWrite()` (context-io.ts:664) — temp file, `renameSync`, Windows fallback. But it governs **`.grugops/context/`** only, and `guard_context_writes` enforces its use only for that path. `plans/board.md` is moved by **roles using their editor tool** ("On `plans/board.md`, the Software Engineer owns the `In Development → In Review` transition…" — role and workflow prose throughout). Those writes are not atomic, and there is no single writer authority for the board.

Two distinct hazards follow:
- **Partial content.** A reader mid-write sees partial data. The accepted mitigation is writer-side: write to a unique temp file in the same directory, then `rename()` — atomic on one filesystem, so readers see all-old or all-new, never a mix.
- **ENOENT window (Windows).** `atomicWrite`'s Windows fallback catches `EPERM`/`EEXIST`/`EACCES`, **`unlinkSync(finalPath)`, then retries the rename** (context-io.ts:670-678). Between the unlink and the rename the file **does not exist**. A dashboard that treats ENOENT as "empty board" will render an empty board. Windows is a hard target for this project.

**How to avoid:**
- **Reader side (mandatory, since the writer cannot be fully controlled):** read → parse → validate → render, and on *any* parse failure or ENOENT, **keep the last good snapshot and show a STALE badge with the failure reason and a timestamp**. Never render a partial parse. Never render empty on ENOENT. Re-read after a short backoff (this is the `awaitWriteFinish` idea — hold the event until the file is stable — implemented in ~15 lines of stdlib rather than by adding chokidar, which is an npm runtime dependency the project forbids).
- **Writer side (the real fix, worth doing):** route board mutations through a `board-io.ts` helper using `atomicWrite`, and extend `guard_context_writes`'s token-vs-path co-occurrence check to cover `plans/board.md` and `plans/traceability.md`. That guard's grammar (a write TOKEN and the path on the same line, either order, with an arrow-lookbehind to avoid prose false positives — check-foundation-guards.ts:575-588) transfers directly. This is a modest edit that removes the hazard class rather than mitigating it.
- Ignore `*.tmp-*` files when scanning; they are `atomicWrite`'s own temp files and will otherwise be picked up by both the watcher and any directory glob.

**Warning signs:** the dashboard has ever shown an empty or half board. The renderer has no "last good" concept. `readFileSync` has no `try`. A test writes the fixture with `writeFileSync` (which is exactly the non-atomic case that must be *tested*, not avoided).

**Phase to address:** Phase 32; the `board-io.ts` + guard extension may be pulled into Phase 27/28 as foundation work since it is cheap and unblocks the dashboard.

---

### P-21: `fs.watch` is not a reliable event source, and the reliable fallback is forbidden

**What goes wrong:**
The dashboard misses updates, double-renders, or throws — differently on macOS, Linux, Windows, and network mounts.

**Why it happens — from the official Node fs docs:**
- Availability depends on the OS notification layer (inotify / kqueue+FSEvents / event ports / `ReadDirectoryChangesW` / AHA). **IBM i does not support it.**
- **"Unavailability on network file systems or virtualized environments may cause exceptions or unreliable behavior."** Docker-on-Mac bind mounts, WSL2 cross-filesystem paths, and NFS home directories are all realistic grugops environments.
- **On Windows, directory renames/moves emit no event and directory deletion reports `EPERM`.** `atomicWrite`'s rename-based write on Windows is therefore in the *least* well-observed category.
- **On Windows `fs.watch` monitors the directory, not the specific file**, so a file can be substituted with no event for the original filename — the docs state explicitly that there is no protection against malicious filesystem actions.
- `recursive: true` is honored **only on supported platforms**.
- Community-corroborated: duplicate events for a single change are routine, most changes surface as `rename`, and `filename` may be `null`.
- The docs name **`fs.watchFile`** (stat polling, default interval 5007 ms) as the *slower but more reliable* alternative.

The ecosystem answer is chokidar (`usePolling` for network mounts, `awaitWriteFinish` with a 2000 ms stability threshold). **grugops cannot use it** — zero host runtime dependencies is a hard constraint.

**How to avoid:**
- Treat `fs.watch` as a **hint, never a source of truth**. The event triggers a re-read; the re-read is the truth. Then duplicate events are harmless (the second re-read produces the same snapshot and renders nothing) and missed events are bounded by the poll floor.
- Ship a **mandatory polling floor** alongside the watcher (e.g. `fs.watchFile`/`statSync` at 1–2 s), not an opt-in fallback. An opt-in fallback is never on when it is needed.
- **Coalesce + debounce**: collapse events within a window and require size/mtime stability before parsing (the `awaitWriteFinish` idea, hand-rolled).
- Detect content change by **content hash**, not mtime — mtime has coarse granularity on some filesystems and does not change on some in-place edits.
- Watch the **directory** and filter by filename, not the file, so an atomic-rename replacement is still observed (a watch bound to an inode follows the old inode after a rename).
- Wrap every `fs.watch` call in `try` and **degrade to polling-only, loudly**, on throw. Say so in the UI: "watch unavailable, polling every 2s."

**Warning signs:** no polling path exists. `recursive: true` with no platform check. `mtime` equality used as the change test. Zero tests on a rename-based write.

**Phase to address:** Phase 32.

---

### P-22: Watcher handle leaks and unbounded memory in a long-running process

**What goes wrong:**
A dashboard left open for hours accumulates `FSWatcher` handles (one per re-registration after an ENOENT or a rename), leaks `fs.watchFile` watchers (which are keyed by filename and persist until `unwatchFile`), and grows an unbounded event/render history until the terminal process is the heaviest thing on the box.

**Why it happens:**
Every existing grugops tool is a **short-lived, exit-when-done script**. Nothing in the codebase is a long-running process, so no habits, tests, or review reflexes exist for lifecycle management. This is a genuinely new failure class for the project.

**How to avoid:**
- One `AbortController` for the whole watcher set; pass `signal` to `fs.watch` (supported) and abort on exit, `SIGINT`, and `SIGTERM`.
- Re-registration must `close()` the old watcher first; keep watchers in a `Map` keyed by path so double-registration is structurally impossible.
- Bound every collection: last-good snapshot (1), error ring buffer (fixed N), no unbounded event log.
- Add a **soak test** — run the dashboard against a fixture tree with a writer loop for a few thousand cycles and assert handle count and RSS are flat. Without a soak test this pitfall is undetectable in CI.
- `persistent: false` where appropriate so the process can exit; `unref()` timers.

**Warning signs:** `fs.watch` is called inside the event handler. No `close()` anywhere. `process.on('SIGINT')` absent. Memory is never measured.

**Phase to address:** Phase 32.

---

### P-23: Terminal rendering hazards — flicker, resize, non-TTY, Windows ANSI, wide/CJK

**What goes wrong:**
The dashboard flickers on every re-render; garbles on resize; emits raw escape codes into a CI log or a pipe; mis-aligns columns for CJK/emoji ticket titles; renders unreadable on a Windows terminal.

**Why it happens:**
Full-screen redraw on every event is the naive implementation and is the flicker cause. Column alignment is computed from `String.length`, which counts UTF-16 code units — wrong for wide characters (CJK is 2 columns wide), combining marks, and emoji/ZWJ sequences. Ticket titles are free text and will contain these.

**How to avoid:**
- **Detect `process.stdout.isTTY` and branch.** Non-TTY (piped, CI, redirected to a file) → plain-text, no ANSI, no cursor control, single-shot output. Also honor `NO_COLOR`, `TERM=dumb`, and `CI`. This matters here because agents will pipe the dashboard.
- Render **diffs, not full frames** — or at minimum draw into a buffer and write once per frame with a frame-rate cap (e.g. 10 fps) so a burst of writes cannot produce a burst of redraws.
- Handle `process.stdout.on('resize')` by recomputing layout; clamp to a minimum width and degrade to a narrow layout rather than wrapping into garbage.
- Compute display width with a real east-asian-width/grapheme routine, not `.length`. `Intl.Segmenter` is in the Node 22 stdlib for grapheme segmentation; width still needs a small code-point table. **Truncate by grapheme, never mid-sequence.** Sanitize control characters and ANSI sequences out of ticket titles before rendering (a ticket title is untrusted text that reaches a terminal — see Security Mistakes).
- Modern Windows Terminal / ConHost support VT sequences, but only when virtual-terminal processing is enabled; do not assume. Keep the ANSI vocabulary small (SGR colors, cursor home, clear-line) and gate it on TTY detection.

**Warning signs:** `console.clear()` per event. `.length` used for padding. No non-TTY test. The only tested terminal is the developer's.

**Phase to address:** Phase 32.

---

### P-24: Scope creep from read-only monitor to state-mutating controller

**What goes wrong:**
"Just let me move a ticket from the dashboard" arrives, and grugops acquires a second write path to the board that bypasses roles, workflows, WIP checks, traceability updates, and the commit convention.

**Why it happens:**
A board that renders is one keystroke away from a board that edits, and the ask is completely reasonable from a UX standpoint. The constraint change ratified at kickoff was explicit and narrow: *"a **read-only, derived, local** view of the board is now permitted. Hosted/SaaS and any write path stay out of scope."*

**How to avoid — structural:**
- The dashboard process must **hold no write capability**: no `writeFileSync`/`appendFileSync`/`renameSync`/`mkdirSync` imports anywhere in the dashboard module tree. Assert this **mechanically** — an import-graph check over the dashboard's own sources, added to the foundation guards. Its grammar is "does this module tree import a mutating `node:fs` symbol," which is a real, decidable property of the source and **not** a subset heuristic if implemented over imports rather than prose.
- No `--fix`, no `--move`, no interactive keybinding that mutates. If a user needs to move a ticket, the dashboard prints the `/grug` command to run.
- Note the existing precedent to point at: `install --check` is a doctor that "reports and names; it never edits the user's repo." Same posture, same rationale.

**Warning signs:** an issue titled "make the board interactive." A `--write` flag "just for testing." `node:fs` write symbols appear in a dashboard import.

**Phase to address:** Phase 32; add the import-graph guard in the same phase that adds the dashboard.

---

### P-25: The board is derived from three sources that disagree, and the dashboard picks one

**What goes wrong:**
`plans/board.md` says a ticket is `In Review`; `plans/tickets/ABC-012.md` frontmatter says `status: in-development`; `.grugops/queue/claimed/` says an agent holds it. The dashboard shows one of these confidently.

**Why it happens:**
There are genuinely three state surfaces now — the board (human-facing WIP truth), ticket frontmatter (the board↔ticket contract the validator enforces), and the queue registry (the actual claim state, with `now-running.md` as its derived render). v2.0 added the third. Nothing reconciles them continuously; workflow 09 (daily sweep) reconciles the first two *periodically*.

**How to avoid:**
- The typed snapshot must model **disagreement as a first-class value**, not resolve it silently. A ticket whose three sources disagree renders as `CONFLICT` with all three values shown. This is the `UNKNOWN - verify` discipline applied to a UI: an honest "these disagree" beats a confident wrong answer, and it is the only rendering consistent with the project's no-fabrication constraint.
- Name the authority per field in the projector's contract (board = column display; ticket frontmatter = the contract the validator enforces; claim registry = who is actually working). Do not let the dashboard invent a precedence order that no other component shares.
- The dashboard surfacing conflicts is a **feature** — it makes the daily-sweep reconciliation visible and is arguably the strongest operator value in the whole projector.

**Warning signs:** the projector has a `resolveConflict()` function. The dashboard and `validate-agent-factory` disagree about the same tree. A conflict is silently dropped.

**Phase to address:** Phase 32.

---

### Area F — Cross-cutting

---

### P-26: Freshness-gate proliferation and the vacuous-pass trap

**What goes wrong:**
v2.1 adds more generated artifacts (adapter bodies, the guarantees render, board snapshot fixtures) and therefore more freshness gates. Two failure modes: gate sprawl (five `freshness:*` npm scripts nobody runs together), and **vacuous passes** — a gate that is green because there is nothing to check.

**Why it happens:**
Documented in this project already: `freshness:context` "currently passes *vacuously* on the grugops tree itself — there are no committed `.grugops/context/` notes… its non-vacuous behavior is proven only by its tests" (Key Decisions). `checkTickets()` in the validator has the same shape: `if (ticketFiles.length === 0) return;` — zero tickets → green (D-43 vacuity).

**How to avoid:**
- Every new gate reports **what it checked** (`compared 17 adapters, 0 drift`), not just PASS. A count of zero is then visible as the anomaly it is.
- Any gate whose non-vacuous behavior is only proven by its tests must say so in its own output.
- Consolidate the `freshness:*` lane into a single `npm run freshness:all` that CI runs, so a new gate cannot be added and then never invoked.

**Phase to address:** Phase 28 (audit the existing gates), then each phase that adds one.

---

### P-27: `orchestrator.md` crosses its FAIL ceiling mid-milestone

**What goes wrong:**
`orchestrator.md` is 7562 B against WARN 7165 / FAIL 7570 (check-foundation-guards.ts:489). **It is 8 bytes from a hard build failure.** Every v2.1 feature adds to it: the spawn allowlist, the per-checkpoint matrix, the STE profile pointer, the dashboard mention. The build will go red on a routine edit, mid-plan, and the reflex fix is to raise the ceiling.

**How to avoid:**
Trim or split `orchestrator.md` **before** any v2.1 phase writes to it — this is already standing obligation #3 from the v2.0 close, and it is now genuinely urgent rather than advisory. The de-duplication work ("say each thing once") is the natural vehicle and should target the coordinator spine first. Five other roles sit near their ceilings too, so the STE/de-dup phase should report the byte delta for all 17.

**Warning signs:** any commit that raises a value in `roleCeiling()`.

**Phase to address:** Phase 27 or 28, before the coordinator gains text. Not later.

---

## Guard Grammar Audit

Required by the framing above. For every guard v2.1 touches or adds: what it matches, what it is claimed to enforce, and whether the former is a strict subset of the latter.

| Guard | Grammar it actually matches | Predicate it is claimed to enforce | Strict subset? | Verdict / required action |
|---|---|---|---|---|
| `guard_caveman_preserved` (existing) | `>=2` lines matching `/^You\b/` **OR** `>=1` token from `VOICE_MARKERS`, inside the fenced `## Caveman prompt` block | "every role keeps its caveman voice" | **YES — proven failed** | Rebuild as lexical-density with a published number; rename to what it measures; RED against all 17 current files is the acceptance evidence (P-17) |
| `guard_wr05` (existing) | Line-anchored frontmatter EREs for `Agent`/`Task` + `coordinator: true`, over a 4-file scan set, fence-stripped, cardinality == 1 | "only the coordinator may spawn" | NO for that predicate — a real token check with both directions and cardinality | Keep as-is. Do **not** extend it to prose (P-02) |
| **NEW** adapter referential integrity | Set equality between `Agent(...)` names, `.claude/agents/*.md` frontmatter `name:`, and the routable-role corpus | "every routable role can actually be spawned" | **NO** — enumerates both authorities and asserts equality | Build in Phase 27, before authoring adapters (P-01) |
| **NEW** adapter-body staleness | *If implemented as a phrase deny-list:* a fixed word set | "no stale/contradictory adapter prose" | **YES — reject this design** | Replace with generate + `freshness:adapters` byte-equality; staleness becomes unrepresentable (P-02) |
| `guard_context_writes` (existing) | Write TOKEN + `.grugops/context/` path co-occurring on one line, either order, arrow-lookbehind, over a hand-listed 17-role + **16**-workflow scan set | "no raw context write in shipped kit text" | Grammar is sound; **the scan set is stale** — workflows 16/17/18 are outside it | Derive the scan set via `readdirSync`; assert the count. Extend the path set to `plans/board.md` + `plans/traceability.md` (P-18, P-20) |
| **NEW** `guard_ste_*` | Approved-word membership, POS restriction, sentence/paragraph length, banned constructions | *If named `guard_ste`:* "ASD-STE100 conformance" | **YES — inherently, and unfixably** | Name it for the decidable subset; publish the split; human Tier-3 for the remainder; never claim STE conformance (P-14) |
| **NEW** board/state projector | Board heading + WIP-marker + ticket-row + ticket-frontmatter grammar, HTML-comment-stripped | "the rendered board equals the board file" | NO **iff** it is the single authority and the validator consumes it | Must replace `validate-agent-factory.ts`'s inline regexes, not coexist with them (P-19) |
| **NEW** dashboard read-only | Mutating `node:fs` symbols in the dashboard module import graph | "the dashboard cannot write" | NO if over imports; **YES** if over prose/docs | Implement over imports/AST; add to foundation guards (P-24) |
| **NEW** no-conditional-assertions in generated specs | `expect`/`browser_verify_*` inside `try`/`catch`/`if` | "no silently no-op test" | **YES if regex; NO if over the TS AST** | Implement over the AST, or narrow the claim (P-13) |
| **NEW** checkpoint policy lookup | TypeScript exhaustive switch over a closed checkpoint set | "no checkpoint defaults open" | **NO** — compile-time totality is a real authority | Cheapest structural win in the milestone (P-06) |
| `oracleWr05Wording` (existing) | Per-beat regexes (action token + phase on one line) over 4 `.planning` files | "the WR-05 closure narrative is consistent" | Sound, but **brittle to editorial prose** | Freeze the scanned files against the rewrite, or migrate the beats out of editorial prose. Never loosen the regexes (P-16) |

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Raise a `roleCeiling()` value to unblock a rewrite commit | Build goes green now | Silently retires the anti-bloat guard that has held four milestones; makes the de-duplication claim unfalsifiable | **Never mid-phase.** Only as a single end-of-phase re-baseline where every file is ≤ its old value, with the delta recorded |
| Loosen an oracle regex so an edited doc passes | Unblocks a commit | Converts a working oracle into a strict subset of its own predicate — the documented failure mode, self-inflicted | Never |
| Give the dashboard its own board parser | Ships faster; richer than the validator's needs | Two grammars over one format; guaranteed drift; the exact CMP-02 failure | Never — the projector-as-single-authority *is* the feature |
| Add chokidar for reliable watching | Solves `fs.watch` in one line | Breaks the zero-host-runtime-dependency constraint that defines the product | Never. Hand-roll the ~15 lines of debounce + polling floor |
| Read the autonomy grant from `factory.config.json` | One place to configure | The agent can write the file that governs it; widens the accepted v2.0 residual to reach merge and prod deploy | Never for the **grant**. Acceptable for the *intent*, if the grant is separate |
| Deny-list stale words in adapter bodies | Catches today's known stale phrase | The next stale phrase is not on the list; creates a false sense of coverage | Only as a temporary supplement *alongside* the generate+freshness fix, never instead of it |
| Hand-list a scan set in a new guard | Explicit, reviewable, matches house style | Rots on the next file addition — already happened to `CTX_WORKFLOWS` (16 of 19) | Only with a derived count assertion that fails red when the corpus changes |
| Accept a "browser session transcript" as UAT evidence | Unblocks the autonomous-testing feature | Fabrication surface; destroys the one property the product sells | Never |
| Skip the soak test for the dashboard | Saves a day | Handle/memory leaks are invisible in CI and only appear in the operator's long session — the exact use case | Only if the dashboard is documented as short-run, which defeats its purpose |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| Node `fs.watch` | Treating events as the source of truth; assuming `recursive` works; assuming one event per change | Event = hint only; the re-read is truth; mandatory polling floor; coalesce+debounce; content-hash comparison; wrap in `try` and degrade loudly |
| Node `fs.watch` on Windows | Assuming a rename-based write is observed | Windows emits no event for directory rename/move and watches the *directory* not the file; watch the directory + filter, and rely on the polling floor for renames |
| Network mounts / Docker bind / WSL2 | Assuming inotify works | Official docs: unreliable or throwing on network FS and virtualized environments; polling is the documented reliable alternative (`fs.watchFile`, default 5007 ms) |
| `atomicWrite` (this repo) | Assuming the target always exists | The Windows `EPERM` fallback unlinks then renames — an ENOENT window. Readers must treat ENOENT as *transient*, not as "empty" |
| `.tmp-<pid>-*` temp files | Globbing the directory and parsing them | Filter `*.tmp-*` in both the watcher and any directory scan |
| Claude Code subagents | Assuming an allowlisted name resolves | A missing agent type fails the spawn and the model **completes inline, silently**. Assert referential integrity; fail hard at the spawn point |
| Claude Code plugin form | Referencing `agent-factory/…` from inside the plugin | Plugins are copied to a cache; `../` references are not copied. Adapter path resolution must target the user's repo (still flagged "verify during dogfood") |
| Playwright MCP / Claude in Chrome | Accepting the agent's narration as the result | Assertions must be tool return values; better, generate a spec the §14 gate runs; the verdict is minted by `emitVerdict()` and nothing else |
| Claude in Chrome | Assuming it runs headless/in CI | Attended browser + site-level permissions required. Probe first; loud skip; UAT stays `pending` |
| The four non-Claude CLIs | Assuming hook-tier guarantees apply | There is no hook there; the un-forgeable admission tier is **absent**. Document the asymmetry; do not let the matrix imply otherwise |
| `factory.config.json` | Adding a third reader for the new matrix | One discriminated-result reader (`absent`/`present`/`unreadable`); every consumer branches on it |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Full-frame redraw per event | Flicker; CPU spike during agent activity | Diff rendering or buffered single-write with a frame cap (~10 fps) | Immediately, as soon as an agent writes in a burst |
| Re-parse the whole state tree on every event | Dashboard lags behind reality; CPU pegged | Hash-gate: re-parse only when a file's content hash changed; parse per-file, not per-tree | ~50+ tickets, or a busy N-agent run |
| `fs.watchFile` per file with no ceiling | Growing poll cost; handle count grows | Watch the **directory**; one polling timer for the whole tree | ~100 watched files |
| Unbounded event/render history | RSS grows over an operator's session | Fixed-size ring buffers; last-good snapshot is exactly one | Hours, not minutes |
| Watcher re-registration without `close()` | `EMFILE`/too many open files after a while | `Map`-keyed watchers; close before re-register; one `AbortController` | Hundreds of rename events |
| Reading the full context corpus for the dashboard | Startup latency grows with project age | Read the committed JSONL index, not every note; respect `freshness:context` | Hundreds of notes |
| Per-sentence STE checking of the whole corpus in the gate | Guard runtime dominates the build | Check only changed files in the gate; full-corpus check in a dedicated lane | 37+ files × per-sentence analysis |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Grant lives in a file the agent can write | The agent lowers the floor that governs it, then passes it; the trail records a pass | Grant only from the process env of a guard the agent did not launch; config expresses intent, never grant (P-07) |
| Reimplementing the env-var grant for new checkpoints | The agent's own `Bash` child sets it | Reuse the existing hook tier verbatim; add the negative test where the agent exports the variable and is still refused (P-08) |
| Config parse failure returns the lean default | Corrupt/unreadable config silently disables governance — live today in `readGovernanceConfig`'s `catch` | One discriminated-result reader; `unreadable` → strictest, loudly (P-05) |
| Unknown enum value falls through to permissive | A typo disables a control the user believes is on | Unknown → strictest defined variant; preserve and report the raw value; reject unknown *keys* loudly (P-06) |
| Rendering untrusted ticket titles raw to a terminal | ANSI/OSC injection from a title in a PR or an imported issue can move the cursor, rewrite the screen, or (via OSC 8 / OSC 52) forge links or touch the clipboard | Strip control chars and ESC sequences before rendering; the dashboard renders *text*, never a passthrough |
| Dashboard reading paths from config without normalization | Path traversal out of the repo into `$HOME` | Reuse the existing `assertSafeTask`-style validation; resolve and confine to the repo root |
| `fs.watch` treated as a security boundary | Node docs state explicitly there is no protection against malicious FS actions; on Windows a file can be substituted with no event for the original name | Never; the watcher is a UX convenience, all trust decisions run through the existing guards |
| Approval state persisting beyond one run | A grant intended for one deploy stays live for the session | Grant is per-run and re-asserted at the point of effect; no "temporary" override without an expiry and a re-prompt |
| Browser session with real credentials driven by an agent | Agent navigates to an unintended origin with a live session | Restrict origins; never run acceptance browsing against production; treat the browser as the *device under test*, never a privileged client |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| Rendering a confidently wrong board on a partial parse | The operator trusts a false state and acts on it — worse than no dashboard | Last-good + STALE badge + reason + timestamp; never render a partial parse |
| Rendering empty on ENOENT | Looks like "all work done" at the exact moment a write is in flight | ENOENT is transient; keep last good and retry |
| Silently resolving board/ticket/queue disagreement | Hides the drift the daily sweep exists to fix | Render `CONFLICT` with all three values — the honest render is the more useful one |
| A lowered floor visible only in a config file | The operator forgets the floor is down and reads the trace as if it were up | Per-run banner naming every non-default checkpoint; effective policy recorded on every verdict |
| ANSI escapes in a piped/CI log | Unreadable logs; broken downstream parsing | `isTTY` branch; honor `NO_COLOR`/`TERM=dumb`/`CI` |
| Column misalignment on CJK/emoji titles | Board unreadable for non-ASCII projects | Display-width-aware layout; grapheme-safe truncation |
| Dashboard that looks interactive but is not | User tries to move a ticket, nothing happens | State read-only in the header; print the `/grug` command instead of accepting the keystroke |
| A loud skip that looks like a pass at a glance | UAT believed done when the browser never ran | Distinct `SKIPPED:` marker (existing convention); UAT stays `pending` |

---

## "Looks Done But Isn't" Checklist

- [ ] **Spawn fix:** adapters exist and the allowlist is complete — but has a **captured live run** shown a role agent executing in its own session, with a marker inline execution cannot produce? A green suite is not a capture (D-01/D-02).
- [ ] **Spawn fix:** does the coordinator **STOP** on an unresolvable role agent, or does it still fall back to inline?
- [ ] **Spawn fix:** does the referential-integrity oracle FAIL RED on today's tree (`.claude/agents/` with one file)? If not, it does not check what it claims.
- [ ] **Adapter bodies:** is stale prose *unrepresentable* (generated + byte-gated), or merely *not currently present*?
- [ ] **Autonomy matrix:** is there still more than one function reading `factory.config.json`? Does a `chmod 000` config produce the **strictest** behavior?
- [ ] **Autonomy matrix:** is adding a new checkpoint without a default a **compile error**?
- [ ] **Autonomy matrix:** is there a test where the agent's own `Bash` call exports the grant and is still refused?
- [ ] **Lowered floor:** does a verdict note produced under a lowered floor look different, forever, from one produced under the default?
- [ ] **Lowered floor:** does any static file still assert an unconditional guarantee the matrix can now remove?
- [ ] **Browser evidence:** is the pass a tool return value or a model sentence? Is it bound to a commit SHA and a gate run id?
- [ ] **Browser evidence:** does the lane loud-skip when no browser is present, leaving the UAT `pending`?
- [ ] **STE rewrite:** is the guard named for the subset it decides? Is the conformance claim narrowed to that subset?
- [ ] **STE rewrite:** were byte ceilings re-baselined **downward** in one end-of-phase commit, with per-file deltas recorded?
- [ ] **STE rewrite:** is the scan set derived from `readdirSync` with a count assertion, or hand-listed? (`CTX_WORKFLOWS` is 16 of 19 today.)
- [ ] **STE rewrite:** do the four `.planning` files `oracleWr05Wording` scans still carry all three beats?
- [ ] **STE rewrite:** were the safety-surface exclusions honored — workflow 05's emission/admission paragraphs, workflow 16, workflow 15 + the ASVS checklist, the prod-deploy prose?
- [ ] **Dashboard:** is there exactly ONE board parser in the repo, and does `validate-agent-factory.ts` use it?
- [ ] **Dashboard:** does it parse `plans/board.md`'s large HTML documentation comment as live columns/rows?
- [ ] **Dashboard:** does it render correctly when the board is being written non-atomically? When it briefly does not exist? On a network mount with `fs.watch` throwing?
- [ ] **Dashboard:** flat handle count and RSS over a soak run? Clean exit on `SIGINT`?
- [ ] **Dashboard:** is non-TTY output plain text? Does the module tree import any mutating `node:fs` symbol?
- [ ] **Everywhere:** does every new guard report **what it checked** (a count), so a vacuous pass is visible?
- [ ] **Everywhere:** is `orchestrator.md` still under 7570 B?

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| P-19 second board grammar shipped | **MEDIUM** | Extract the projector as the sole authority; re-point the validator; delete the dashboard's parser; re-run the fuzz corpus. Cheap while both are new, expensive once a web renderer also depends on the second grammar |
| P-05/P-06 a checkpoint shipped default-open | **HIGH** | Every run made under the open default is retroactively suspect; the trace cannot distinguish them. Requires a corrective note in the audit trail per affected run + a version bump. **This is why it must be prevented, not recovered** |
| P-16 byte ceilings raised to unblock | **LOW if caught immediately** | Revert the ceiling change, split the file instead. HIGH once several phases have grown into the new headroom — the baseline is gone |
| P-14 STE conformance over-claimed | **LOW** | Narrow the claim in one commit; regenerate the catalog. Cheap, but must be done before any external communication repeats the claim |
| P-10 a fabricated browser pass reached the trace | **HIGH** | Every UAT resolved through that path reverts to `pending`; the evidence chain is re-derived. This is reputational, not just technical |
| P-20 the dashboard rendered a wrong board | **LOW** technically | Add last-good + STALE; but the operator's trust is the real cost, and it is slow to rebuild |
| P-22 handle/memory leak in a shipped dashboard | **LOW** | Add the `AbortController`+`Map` lifecycle and a soak test. Contained because the dashboard is non-load-bearing by design |
| P-02 another stale-prose survivor found post-milestone | **MEDIUM** | Switch to generated adapter bodies. Note this would be the *second* occurrence; a third would indicate the deny-list approach was chosen again |

---

## Pitfall-to-Phase Mapping

Phase numbers are the researcher's recommendation (v2.1 resumes at 27); the roadmapper assigns finals.

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| P-01 spawn guard with the same blind spot | **27 — Spawn Correctness** | Referential-integrity oracle FAILS RED on today's tree; passes only after all 17 adapters exist; fails when a role is added without an allowlist entry |
| P-02 unguarded adapter body | **27** | `freshness:adapters` fails on a hand-edited body; the current stale sentence is unrepresentable after regeneration |
| P-03 four CLIs silently broken | **27**, re-verified **33** | `oracleDualPathEquivalence` green; sequential path produces the same artifacts with `.claude/agents/` absent |
| P-04 vacuous spawn proof | **27** designs, **33** captures | A captured run containing a marker inline execution cannot produce, with a date and a verdict |
| P-27 `orchestrator.md` at 7562/7570 B | **27 or 28**, before the coordinator gains text | `guard_role_size` green with margin; no `roleCeiling()` value raised |
| P-09 stale claims / P-18 scan-set rot / P-26 vacuous gates | **28 — Kit Consistency Audit** | Every unconditional guarantee in static text is narrowed or points at the generated surface; `CTX_WORKFLOWS` derived and count-asserted; `CLAUDE.md` drift closed |
| P-14 STE over-claim | **29 — Controlled Language** | The decidable/non-decidable split is published; the guard's name matches its grammar |
| P-15 semantic drift in safety text | **29** | Exclusion list honored; one-file-per-commit; before/after pairs for every touched safety paragraph |
| P-16 ceilings/oracles/refs broken | **29** | Single end-of-phase re-baseline, all files ≤ old; `oracleWr05Wording` green; intra-kit reference inventory matches before/after |
| P-17 voice guard rebuilt as a heuristic | **29** | New guard FAILS RED on all 17 current blocks; publishes a number with a denominator; survives the lexicon-stuffing adversarial corpus |
| P-05 fail-open parse / P-06 default-open enum / P-07 self-governed config / P-08 self-settable env | **30 — Per-Checkpoint Autonomy** | One config reader; `chmod 000` → strictest; a new checkpoint without a default is a compile error; agent-exported grant still refused; ≥2 independent red-teams + self-repro (D-12) |
| P-09 lowered floor invisible | **30** | Generated guarantees surface changes when a floor is lowered; per-run banner; effective policy on every verdict |
| P-10 hallucinated assertion / P-11 phantom run / P-12 unbound evidence / P-13 flaky-vs-real | **31 — Autonomous Manual Testing** | Verdict minted only by `emitVerdict()`; loud skip leaves UAT `pending`; evidence is an `artifact-ref` note with commit + run id; conditional assertions rejected over the AST |
| P-19 second grammar / P-25 conflicting sources | **32 — Board Projector & Dashboard** | Exactly one parser; `validate-agent-factory.ts` consumes it; conflicts render as `CONFLICT`; the board's HTML comment is not parsed as live state |
| P-20 torn reads / P-21 watcher unreliability | **32** | Renders correctly against a non-atomic writer loop, an ENOENT window, and a throwing `fs.watch`; the polling floor is mandatory, not opt-in |
| P-22 leaks / P-23 terminal hazards / P-24 scope creep | **32** | Soak test shows flat handles + RSS; non-TTY emits plain text; CJK/emoji titles align; import-graph guard proves no write capability |
| GAP-D1 live capture + Windows portability | **33 — Live Capture & Portability** | The one captured live dual-path run flips A3/DOG-02 + the coupled `examples/03-ticket-to-pr.md` edit; `windows-latest` leg green |

**Ordering rationale (the load-bearing recommendation):**

1. **27 before everything.** The spawn defect is the milestone's reason for existing, it blocks the GAP-D1 capture that has been open since v1.0, and every later phase's evidence is more trustworthy once role agents genuinely run. Build the referential-integrity oracle *before* the adapters, per the v1.2/v2.0 foundation-guards-first pattern.
2. **28 before 29.** The consistency audit produces the exclusion list, the derived scan sets, and the claim inventory that the controlled-language rewrite needs as inputs. Rewriting first means rewriting text that the audit will then say should not have been rewritten. `orchestrator.md` must be trimmed here at the latest — it is 8 bytes from FAIL.
3. **29 before 30.** The rewrite touches config prose and role text; doing it after the matrix lands means rewriting freshly-written governance text and re-running the expensive red-team gate.
4. **30 is the expensive one.** It is the direct successor to Phase 25 (8 rounds, 2 independent red-teams, the hardest phase in the project) and touches the four hardest floors. Budget red-team rounds explicitly; do not treat the overrun as an overrun.
5. **31 after 30**, because browser evidence must enter through the verify-before-write path, and 30 is where that path's dialability is settled. Evidence written against a floor whose semantics change one phase later is evidence that must be re-derived.
6. **32 last among the features.** It is read-only, non-load-bearing, and depends on the board/ticket/queue state surfaces being stable. It is also the lowest-risk place to end the milestone, and the projector benefits from 28's consistency work.
7. **33 last**, folding the GAP-D1 capture and the Windows leg — both of which are *proofs about the whole milestone*, not features, and both of which need everything else in place.

---

## Inherited pitfalls still live (carried, not re-derived)

From v1.2/v2.0 research and audits; each remains in force and intersects v2.1:

- **Single-source drift across five tools** — worsened by 17 new adapters (P-02).
- **Prompt bloat / byte ceilings** — six roles near the ceiling, one at 99.9% (P-27).
- **Dial regressions** — a dial that removes a floor rather than adding friction (P-09).
- **Test-integrity loophole** — an agent authoring its own justification; unchanged floor (`warn|block`, never `off`).
- **Packaging-template regeneration hazard (WR-05 family)** — regeneration must not restore a dropped or incorrect grant.
- **`check-kit-refs` / duplicate-Test-ID robustness (WR-01..04)** — carried tech debt, intersects the rewrite.
- **Fail-safe residuals** — the WR-03 usability false-positive; the `---\n--- \n…` byte-round-trip adjacency; the `floor-invariance.test.ts` spawn-heavy timeout (needs an explicit larger `testTimeout` — this will get *worse* when Phase 30 adds checkpoints); the documented same-uid direct-FS forgery residual backstopped by `autonomy=pr` (P-07 widens its blast radius).
- **`agent-factory/handoffs/.gitkeep`** still present — MIGR-02's "directory deleted" phrasing cosmetically unmet.

---

## Sources

**grugops-internal (HIGH — read directly this session):**
- `.planning/PROJECT.md` — Constraints, Key Decisions (the closure doctrine, D-12, the D-01/D-02 capture rule, GOV-01 fail-closed dial), v2.1 kickoff findings, standing obligations
- `scripts/check-foundation-guards.ts` — `guard_wr05` (l.108-212), `guard_voice` (l.375), `guard_caveman_preserved` (l.450-476), `roleCeiling()` (l.487-526), `guard_context_writes` + `CTX_WORKFLOWS` (l.558-623)
- `scripts/context-io.ts` — `atomicWrite` (l.664-689), `admit()` + the D-04/D-05 two-tier split (l.966-1045), `readGovernanceConfig` and its lean-on-`catch` (l.1220-1265), `readGovernanceConfigResult` (l.1288+)
- `scripts/validate-agent-factory.ts` — the board↔ticket grammar and the WR-03 prefix-match fix (l.401-455)
- `scripts/check-uat-oracles.ts` — the three Tier-1 oracles; `oracleWr05Wording` scan set + tolerant beat regexes (l.102-120)
- `scripts/trace-render.ts`, `scripts/now-running-freshness.ts`, `scripts/catalog-freshness.ts` — the render + byte-equality freshness-gate family the adapter/guarantee renders should join
- `.claude/agents/grugops-orchestrator.md` — the live stale-handoff body and the 7-name / 0-file allowlist
- `agent-factory/workflows/05-pr-quality-gate.md` — the `emitVerdict` root-of-trust carve-out, the loud-skip convention, three-valued exit codes, "advise loudly, never hide"
- `plans/board.md`, `hooks/guard.ts`, `package.json`

**External:**
- Node.js v24 `fs` API docs via Context7 — `fs.watch` Caveats/Availability (platform backends, network-FS unreliability, Windows directory-rename/`EPERM`/file-substitution, no protection against malicious FS actions), `fs.watchFile` as the reliable polling alternative (default interval 5007 ms) — **HIGH**
- chokidar issue #144 + README and cross-platform `fs.watch` writeups — duplicate events, `rename`-heavy event types, `usePolling` for network mounts, `awaitWriteFinish`/`stabilityThreshold` — **MEDIUM** (corroborates the official caveats; the library itself is unusable here)
- microhowto "Atomically rewrite the content of a file", the ActiveState atomic-write recipe, `rename-after-writing` — write-temp-then-`rename()` gives readers all-old-or-all-new — **MEDIUM**
- ASD-STE100 tooling pages (asd-ste100.org "Tools for STE", TechScribe, Boeing Simplified English Checker, HyperSTE, Wikipedia STE) — **no checker can guarantee full STE compliance; clarity is human-judged; checker output requires trained interpretation** — **MEDIUM**
- Playwright MCP guides (testquality 2026 architecture, qaskills testing-capability guide, TestDino, Bug0) — hallucinated assertions as a named agent-authored failure cluster; accessibility-tree snapshot mode as the deterministic default; `browser_verify_*` first-class assertions; human oversight still required — **MEDIUM**
- Config/enum fail-closed practice (JUnit #4617 silent invalid-value acceptance, kiota-python #515 silent empty result, the protobuf enum-behavior guide's unknown-field preservation) — never map unknown onto the permissive branch — **MEDIUM**

---
*Pitfalls research for: grugops v2.1 — Autonomous Factory (Real Spawning, Controlled Language & Live Board)*
*Researched: 2026-07-28*
