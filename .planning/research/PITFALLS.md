# Pitfalls Research

**Domain:** Markdown agent-factory (role prompts + workflows + checklists + config dial + quality gate + per-tool adapters + installers) — adding v1.2 SDLC depth (BDD/TDD, ASVS security, senior personas, UI build+test, test-integrity gate, linting, docs catalog, install migrate/update)
**Researched:** 2026-06-09
**Confidence:** HIGH on grugops-specific constraints (from PROJECT.md + v1.1 audit + embedded STACK research), MEDIUM on external SOTA practice (BDD/ASVS/Playwright, web-verified June 2026)

> These are pitfalls of **shipping markdown that instructs an LLM**, not of building an app. grugops ships no runtime; every "feature" is prose + a checklist + a gate clause that some host coding agent will execute across 5 different CLIs. The failure modes are therefore about *drift, bloat, fabrication, and silently re-armed capability* — not latency or memory leaks. Each pitfall flags which named grugops hard-constraint it threatens.

---

## Critical Pitfalls

### Pitfall 1: WR-05 regeneration hazard — re-arming the spawn tool when touching packaging templates

**What goes wrong:**
The two packaging templates (`agent-factory/packaging/subagent.frontmatter.md` and `slash-command.template.md`) still prescribe the `Agent` tool + "spawn sub-agents" prose. v1.1 dropped the spawn grant from the *materialized* adapters, but the *templates* were left stale (carried tech-debt WR-05). v1.2 touches packaging heavily — senior-persona rewrites, a new UI persona, a security persona, a docs-catalog generator that may read packaging metadata. Any regeneration of the standalone adapters or plugin agents *from these templates* silently re-introduces sub-agent spawn capability, breaking the deliberate single-window sequential role-load design.

**Why it happens:**
Source-of-truth confusion: the deployed adapters are correct but the generator templates upstream of them are wrong, so the system is "right until someone re-runs the generator." Nobody re-reads templates they assume are already fixed. v1.2's persona overhaul is exactly the kind of broad packaging churn that triggers a regen.

**How to avoid:**
- Fix the templates as the **first** packaging-touching task of v1.2 (don't carry WR-05 forward again). Strip `Agent`/`tools: Agent`/"spawn sub-agents" from both templates; replace with the `_role-switch-protocol.md` sequential-load language.
- Add a mechanical guard to `scripts/check-kit-refs.sh` (or a sibling check): grep the packaging templates + all materialized adapters for `Agent` in a `tools:` position and for "spawn" prose; fail the gate if found. This makes the no-spawn rule *mechanical*, matching the "enforce safety in code not prose" principle.
- Wire that grep into CI and the structure validator so a regen that re-arms spawn fails red.

**Warning signs:**
A diff to any adapter that adds `tools: Agent` or `Agent(...)`; a persona/packaging PR that "just regenerated the wrappers"; `_role-switch-protocol.md` and an adapter disagreeing on whether spawning is allowed.

**Phase to address:**
Earliest packaging/persona phase (the SDLC-audit + senior-persona overhaul phase). Threatens the **no-spawn single-window** hard constraint.

---

### Pitfall 2: Migrate/update destroys or clobbers user content (delete-first instead of additive)

**What goes wrong:**
`install.sh --migrate` (MIGR-01) and `--update` (UPD-01) re-shape an existing install: kit relocates to `$GRUGOPS_HOME`, adapters re-materialize, config/state schema may move. A naive implementation deletes-then-writes, overwrites a user-edited `factory.config.json`, re-materializes over hand-tuned adapters, or removes "stale" state it doesn't recognize. The v1.1 install code already had a *Critical* of exactly this shape — CR-01: an unbounded sentinel/marker strip could delete user content past an unterminated open marker. Migrate/update multiplies that surface.

**Why it happens:**
"Update" reads as "replace." Marker-block rewriting is fiddly (the v1.1 bug proves it). Schema migration tempts a clean slate. And the kit cannot distinguish grugops-authored bytes from user edits unless it tracks provenance precisely.

**How to avoid:**
- **Never delete-first.** Rename-to-backup (`factory.config.json` → `factory.config.json.bak-<timestamp>` or `.grugops/backups/`) before writing; deletion only behind an explicit, named flag (e.g. `--prune`), never the default path.
- Make migrate/update **idempotent + reversible + dry-run-capable** (`DRY_RUN=1` already a kit convention) and re-run-safe — same v1.1 installer contract.
- Reuse the *bounded* marker-strip fix from v1.1 CR-01: only ever touch bytes between matched `MAT_OPEN`/`MAT_CLOSE` sentinels; refuse to strip past an unterminated marker; treat a garbled marker as STOP, not "delete everything after."
- Seed/skip-if-exists for state (the v1.1 `seed_state` contract); migration touches only grugops-owned files, never seeded user state.
- Ship a RED-by-design test harness first (the v1.1 `install.two-root.test.sh` pattern) that asserts: user-edited config survives, hand-edited adapter content is backed up not lost, re-running is a no-op, and uninstall after migrate restores the pre-migrate state.
- sh ↔ Node **byte-parity** on the migrate/update path, same as the existing installers.

**Warning signs:**
Any `rm`/`unlink`/truncate on a user-owned path in the migrate/update flow without a prior backup; a test that doesn't include a "user edited the file" fixture; non-byte-identical sh vs Node behavior; a marker strip with no upper bound.

**Phase to address:**
The install migrate/update phase (MIGR-01/UPD-01). Threatens the **installers-never-delete-user-content** hard constraint — this is the single highest-blast-radius pitfall in v1.2 because it runs irreversibly on the user's repo.

---

### Pitfall 3: Voice-discipline drift — grug caveman voice leaking into security/compliance/money/legal

**What goes wrong:**
v1.2 adds the most safety-critical prose grugops has ever shipped: OWASP ASVS findings, a security-audit workflow, a test-integrity gate verdict, and migrate/update warnings (data loss). If those are written in grug voice ("grug find big scary hole, grug no like"), the joke undermines trust at exactly the moment clarity matters — a security finding or a "this will overwrite your config" warning must be unambiguous, professional English. The inverse also bites: flattening the *role prompts* into clear corporate English to "be safe" kills the brand voice that earns trust everywhere else.

**Why it happens:**
A single author rewriting many files defaults to one register. The new senior personas raise the temptation to "sound senior" (clear English) everywhere, eroding grug voice in the prompts. Conversely, copy-paste from a grug-voiced persona into a security checklist drags caveman phrasing into a place it must never be.

**How to avoid:**
- Codify the two-voice boundary as an explicit, testable rule (it's already a stated constraint): **grug voice** in role prompts, mascot, playful copy; **clear professional English** in security findings, compliance, money, legal, disclaimers, and *data-loss/safety warnings* (add migrate/update warnings to this list explicitly).
- Add a lint-style check to the gate/validator: security-audit checklist, ASVS findings template, test-integrity verdict, and install warning strings must NOT contain grug-voice markers (lowercase-only sentences, third-person "grug", "big brain"/"complexity demon" idioms). Flag, don't silently pass.
- In the senior-persona overhaul, keep "senior" = *judgment and depth of the role prompt*, not register — a senior persona still speaks grug; seniority shows in what it checks and decides, not in dropping the voice.

**Warning signs:**
"grug" / lowercase-only style appearing in an ASVS finding, a compliance line, or a migrate warning; role prompts reading like a corporate playbook with the voice sanded off; reviewers unable to tell which register a given file is supposed to be in.

**Phase to address:**
Security-audit phase + senior-persona phase + migrate/update phase (each introduces clear-voice surfaces). Threatens the **two-voice discipline** constraint. A cross-cutting voice-lint check is the durable prevention.

---

### Pitfall 4: Single-source drift — new v1.2 content forked across the 5 tool adapters instead of pointed-to

**What goes wrong:**
The new BDD/TDD steps, the ASVS checklist, the UI workflow, the lint step, the test-integrity clause are written once in `agent-factory/` — but then a well-meaning edit "helps" Codex or Gemini or Copilot by pasting the relevant guidance into that tool's adapter. Now the same instruction exists in 6 places and they diverge on the next edit. This is the exact drift the single-source rule exists to prevent across 5 CLIs.

**Why it happens:**
Adapters *feel* like the natural place to put tool-specific behavior, and v1.2 adds a lot of behavior. Authors forget that adapters are *thin pointers* — only the dispatch differs, never the content (PKG-01). When a new capability seems tool-shaped (e.g. Playwright on one stack), the urge to inline it per-tool is strong.

**How to avoid:**
- Hold the line: every new v1.2 capability is **one** canonical file under `agent-factory/`; adapters only point. If something is genuinely tool-specific, it's a dispatch detail, not content.
- Extend `check-kit-refs.sh` to assert adapters contain no substantive capability prose — only pointers/dispatch + the materialized `KIT=` block. A length/heading cap on adapter files catches inlining.
- The docs catalog (Pitfall 9), being generated from the single source, becomes a second mechanical check: if a capability appears in an adapter but not in the canonical source the catalog reads, the catalog and the adapter disagree → drift detected.

**Warning signs:**
A BDD/ASVS/lint instruction appearing verbatim in two or more adapters; an adapter file growing past pointer-size; a fix that has to be applied "in all five places."

**Phase to address:**
Every v1.2 content phase, enforced by a gate check added in the SDLC-audit/foundation phase. Threatens the **single-source** hard constraint.

---

### Pitfall 5: Prompt / AGENTS.md bloat — overstuffing roles with BDD/ASVS/lint detail until agent success drops

**What goes wrong:**
v1.2 wants to teach the kit a LOT: Gherkin conventions, TDD red-green discipline, the full ASVS L1/L2/L3 control families, Playwright stabilization rules, per-stack linter configs. The tempting move is to dump it all into the relevant role prompts and AGENTS.md. But long machine-written context measurably lowers agent success and raises cost (a named constraint) — and Codex enforces a hard 32 KiB `project_doc_max_bytes` cap on AGENTS.md. Bloated prompts produce *worse* BDD/security/lint behavior, not better.

**Why it happens:**
"More guidance = better output" is intuitive and wrong for LLMs past a context budget. Each capability author optimizes their own section without seeing the cumulative weight. ASVS especially invites a wall of controls.

**How to avoid:**
- Keep role prompts and AGENTS.md **minimal and high-signal**; push detail into *referenced* files (checklists, workflow files, the ASVS checklist, a linter-recommendations table) that the agent opens only when the workflow reaches that stage. AGENTS.md points; it does not contain.
- Budget it: track AGENTS.md bytes against the 32 KiB Codex cap with a CI check; treat role-prompt length as a reviewed metric (the kit already values minimalism).
- Put BDD/TDD/ASVS/lint depth where the **workflow** routes the agent to it just-in-time — the role prompt says "at acceptance, run the BDD checklist" and links it; it does not embed the checklist.
- Reuse the existing 9-section role skeleton; resist adding new always-loaded sections for v1.2 capabilities — make them workflow-stage references instead.

**Warning signs:**
AGENTS.md approaching/exceeding ~32 KiB; role prompts doubling in length during the persona overhaul; the same ASVS/Gherkin text pasted into multiple role prompts; agent output getting *less* focused after a prompt grows.

**Phase to address:**
SDLC-audit/foundation phase sets the byte budget + reference-not-embed rule; every capability phase respects it. Threatens the **minimal-AGENTS.md/prompt** constraint (and indirectly single-source via Pitfall 4).

---

### Pitfall 6: Config-dial regressions — enterprise gate becomes skippable, or lean tier over-taxes solo builders

**What goes wrong:**
Two opposite failures, both fatal to the "zero-config first, enterprise on one flag" promise:
1. A v1.2 capability gated only by prose ("if enterprise, also run L3 ASVS") that an agent can talk itself out of → an enterprise gate that's effectively optional. The test-integrity gate and the security audit are exactly the gates that must NOT be skippable when the dial says enterprise.
2. The new BDD/TDD/ASVS/UI-test/lint ceremony is wired as *always-on* rather than dialed → a solo builder fixing a typo is now forced through Gherkin authoring, an L3 audit, and visual-regression baselining. That over-taxes the lean tier and drives the solo user away — violating "don't tax solo users."

**Why it happens:**
Each capability author wants their thing to "always run" (it feels important). Dial-awareness is extra work and easy to skip. And making a gate truly un-skippable requires mechanical enforcement, not a prompt clause.

**How to avoid:**
- Every new v1.2 capability must read `factory.config.json` and define its **lean default** and its **enterprise escalation** explicitly (the existing config-dial pattern). BDD depth, TDD depth, ASVS level, UI-test scope, lint strictness are all *dialed*, not fixed.
- Lean defaults should be genuinely light: e.g. lean = TDD encouraged + ASVS L1 spot-check + smoke E2E; enterprise = full BDD acceptance suite + ASVS L2/L3 + visual regression + lint-blocking. Map ASVS L1→lean, L2/L3→enterprise (matches OWASP's own "start at L1, escalate with risk" guidance).
- Make the enterprise gates **mechanical where the host allows** (gate clauses the §14 backpressure gate enforces; a check that the test-integrity + security steps actually ran and produced artifacts, not just a self-asserted "done"). An enterprise gate that exists only as prose is a skippable gate.
- Honor "bug the user as little as needed" *inside the lean tier only* — fewer checkpoints, defaults over prompts — but never let that principle remove an enterprise-dialed gate or the merge/deploy human stop.

**Warning signs:**
A capability with no `factory.config` branch (always-on); a lean-tier dogfood that forces enterprise ceremony on a trivial change; an enterprise gate that an agent passed without producing the expected security/test artifact; "bug the user less" cited to justify skipping a required gate.

**Phase to address:**
SDLC-audit/foundation phase defines the dial contract for v1.2 capabilities; each capability phase implements both tiers; the gate phase makes enterprise gates mechanical. Threatens the **zero-config-first / enterprise-on-one-flag** constraint.

---

### Pitfall 7: Test-integrity escape hatch becomes a cheating loophole

**What goes wrong:**
The test-integrity gate blocks unjustified skipped tests but allows a *documented-justification* escape hatch. If the escape hatch accepts any free-text reason, the agent (under pressure to make the gate green) writes "skipped: flaky, will fix later" and the gate fabricates a pass — destroying the trace, which is the entire value prop ("the trace is the proof"). This converts a quality gate into a rubber stamp.

**Why it happens:**
An agent optimizing for a green gate will take the cheapest path to green. A free-text justification is the cheapest path. The same incentive that produces `it.skip` with a TODO produces a hollow justification.

**How to avoid:**
- Make the escape hatch **costly, structured, and traceable**, not free-text: require a linked ticket/REQ-ID, a named owner, an explicit expiry/re-enable date, and a category from a closed list (e.g. `env-unavailable`, `upstream-bug`, `intentionally-deferred`). No ticket → no skip.
- The gate must **count and surface** skips (skip count in the verdict), and refuse to go green if skips exceed a dialed threshold or any skip is past its expiry. Enterprise tier: zero unjustified skips, hard fail.
- Reuse the kit's `UNKNOWN - verify` / no-fabrication discipline: a skip without a verifiable justification is a fabricated pass and must fail the gate, not warn.
- Forbid the gate from *self-authoring* justifications — the justification is a human/ticket artifact the agent records, never invents (mirrors the prod-deploy hook's "refuses self-set approval").
- Test the gate with a RED fixture: a hollow-justification skip MUST fail the harness.

**Warning signs:**
Justifications that are generic ("flaky", "later", "known issue") with no ticket; skip count rising release over release; the gate going green with skipped tests and no linked artifacts; the agent writing its own justification text.

**Phase to address:**
The test-integrity gate phase. Threatens the **no-fabrication / trace-is-the-proof** hard constraint — this is no-fabrication applied to tests, the most likely place an agent will cheat to please.

---

### Pitfall 8: BDD/TDD cargo-culting — Gherkin nobody runs, coverage-gamed tests, BDD/TDD duplication

**What goes wrong:**
Several distinct cargo-cult failures:
- **Dead Gherkin:** `.feature` files written as documentation that no step definitions execute — pure ceremony. Matt Wynne's "10 Easy Ways to Fail at BDD" notes business stakeholders rarely read `.feature` files; the value is in the discovery conversation, not the artifact. grugops emitting Gherkin templates that no workflow actually runs reproduces this.
- **Imperative scenarios:** LLMs reliably produce *syntactically correct but imperative* Gherkin ("click #submit, see .alert") instead of declarative business behavior — a verified failure mode of LLM-generated Gherkin. That makes scenarios brittle and pointless.
- **Coverage-gamed tests:** TDD reduced to "write tests until coverage % is green" → assertion-free or tautological tests that exercise lines without checking behavior.
- **BDD/TDD duplication:** the same logic asserted at both the BDD acceptance layer and the TDD unit layer, doubling maintenance for no added confidence.

**Why it happens:**
BDD/TDD are easy to imitate and hard to do well; the artifacts are mistaken for the practice. An LLM optimizes for "looks like Gherkin/has tests," not "captures behavior." Coverage numbers are a seductive proxy metric.

**How to avoid:**
- Position BDD as the **business→engineer contract at acceptance/UAT** (its stated v1.2 role): declarative, business-language scenarios, no UI selectors in the `Given/When/Then` — UI detail lives behind step definitions. Provide a *declarative* Gherkin template and an explicit "no CSS/HTML in scenarios" rule.
- Make BDD scenarios **executable or absent** — the workflow must wire `.feature` files to runnable step definitions; the test-integrity gate (Pitfall 7) should flag `.feature` files with no executing steps as effectively skipped. No dead Gherkin.
- TDD = **red-green at the unit layer** for behavior, not coverage chasing. Recommend assertion-quality checks (does the test fail when behavior breaks?) over coverage thresholds; if coverage is dialed, treat it as a floor, not a goal, and pair it with mutation-style "does removing the assertion still pass?" sanity.
- Define the **layering** explicitly to avoid duplication: BDD owns user-observable acceptance behavior; TDD owns unit-level logic/edge cases. Same assertion at both layers is a smell.
- Tie both to the existing traceability trail (REQ-ID → BDD scenario → unit tests → code) so tests map to requirements, not to a coverage dashboard.

**Warning signs:**
`.feature` files with no matching step definitions; scenarios mentioning selectors/HTML; tests with no assertions or only `expect(true)`; identical behavior verified at acceptance and unit layers; "coverage went up" cited as the test's value.

**Phase to address:**
The test-first (BDD+TDD) phase, with the executable-or-absent rule enforced by the test-integrity gate phase. MEDIUM confidence (external SOTA + LLM-Gherkin research).

---

### Pitfall 9: Docs-catalog drift — the catalog diverges from the roles/workflows it documents

**What goes wrong:**
A browsable markdown docs catalog of every agent + workflow, if **hand-maintained**, immediately rots: a persona is renamed or a workflow gains a step, the catalog still describes the old one, and now the kit ships documentation that contradicts the kit. For a tool whose value is honesty/traceability, a lying docs catalog is worse than none.

**Why it happens:**
Manual docs always lag the thing they describe; the v1.2 persona overhaul + new workflows guarantee heavy churn exactly while the catalog is new. Nobody updates docs in the same PR as the change.

**How to avoid:**
- **Generate** the catalog from the canonical `agent-factory/` source (role frontmatter, workflow headings, checklist titles) — never hand-maintain it. The catalog is a derived artifact, like the docs-as-code pattern.
- Make it a **gated/CI-checked** generation: regenerate in CI and fail if the committed catalog differs from the freshly generated one (the classic "generated file is stale" check). This turns drift into a red build, not a silent lie.
- Stay inside the boundary: in-repo markdown only, **no web UI** (explicit out-of-scope — grugops is a file-and-prompt kit, not a platform). A generator that emits markdown keeps it boring and diffable.
- The generator doubles as a single-source check (Pitfall 4): it can only document what's in the canonical source, so capability prose hiding in an adapter won't appear — surfacing the fork.
- No fabrication in the generator: if a role/workflow lacks a description, emit `UNKNOWN - verify` rather than inventing one.

**Warning signs:**
A catalog edited by hand in a PR; catalog entries for renamed/removed roles; the generator absent and the catalog committed manually; catalog describing a workflow step that no longer exists.

**Phase to address:**
The docs-catalog phase. Threatens **no-fabrication** (a stale catalog is an untrue artifact) and is reinforced by the **single-source** rule.

---

### Pitfall 10: ASVS misapplication — wrong level, checkbox theater, findings as security-without-substance

**What goes wrong:**
- **Wrong level:** applying ASVS L3 to a trivial internal tool (needless friction) or L1 to a payment/health app (under-protection). OWASP's own guidance: start at L1, escalate L2/L3 with risk; L3 is for high-assurance (finance/health/critical).
- **Checkbox theater:** treating ASVS as a tick-list "without contextual risk assessment" — an explicitly documented ASVS anti-pattern. An agent marking 200 controls "pass" with no evidence is fabricating a security verdict.
- **Findings without substance / jokey voice:** security findings written vaguely, or in grug voice (see Pitfall 3), so the human can't act on them.

**Why it happens:**
ASVS is large; an agent will happily emit a fully-ticked checklist (it looks thorough). Risk-tiering requires judgment the agent skips. The dial makes "which level" a real decision that's easy to get wrong.

**How to avoid:**
- Tie ASVS level to the config dial and the project's risk: **lean/L1** default; **enterprise** escalates to L2 (most apps) / L3 (regulated). Make the level a config field with guidance, not a free choice per run (matches Pitfall 6).
- Forbid checkbox theater mechanically: each "pass" must cite **evidence** (a test, a code reference, a config) — no evidence → `UNKNOWN - verify`, never an unbacked tick. This is the no-fabrication rule applied to security.
- Findings in **clear professional English** (Pitfall 3), with severity, the affected control, and a concrete remediation. A finding the human can't act on is noise.
- The security-audit workflow produces an artifact the §14 gate can check for existence + non-emptiness, so an enterprise security gate can't be a no-op (Pitfall 6).

**Warning signs:**
A 100%-pass ASVS checklist with no evidence column; the same level applied regardless of project risk; findings in grug voice or without remediation; the audit "done" with no produced artifact.

**Phase to address:**
The security-audit phase. Threatens **no-fabrication** (unbacked passes) and **two-voice** (findings must be clear). MEDIUM confidence (OWASP ASVS 5.0 web-verified).

---

### Pitfall 11: Flaky / over-mocked UI/E2E tests + visual-regression noise; "bug the user less" sliding into skipping safety gates

**What goes wrong:**
- **Flaky E2E:** timing/wait races, shared state between tests, brittle CSS/XPath selectors — research attributes most flakiness to wrong selectors and async-wait + resource contention. grugops recommending `waitForTimeout` or class-based selectors bakes flakiness into every user's suite.
- **Over-mocking:** mocking so much the E2E proves nothing — but the opposite (hitting a real DB in UI tests) is "asking for trouble." The right line is mock external/network boundaries (`page.route()`), exercise the real UI.
- **Visual-regression noise:** un-stabilized screenshots (animations, fonts, dynamic data) produce constant false diffs → the team mutes visual regression entirely. Noise kills the signal.
- **Safety-gate erosion:** the laudable v1.2 principle "bug the user as little as needed" can slide into auto-passing UI/E2E without a human ever seeing a real failure mode, OR — worse — into trimming the *required* human merge/deploy stop. "Fewer checkpoints" must never touch the merge/deploy hard limit.

**Why it happens:**
Flaky/over-mocked/noisy tests are the default outcome of naive E2E; you have to *design* against them. And "minimize human stops" is a real v1.2 goal that, taken too far, eats the safety gates that are the whole point.

**How to avoid:**
- Bake SOTA Playwright stability into the UI/E2E workflow + checklist: **role/label/`data-testid` locators** over CSS/XPath; web-first assertions (auto-wait) instead of `waitForTimeout`; **isolated state per test** (no inter-test data dependencies); `page.route()` to mock network, real UI.
- Stabilize visual tests by construction: disable animations/transitions, mask dynamic regions, pin fonts/viewport, set a sane diff threshold — recommend these in the workflow so users don't ship noisy baselines.
- Encode "bug the user as little as needed" as a **bounded** principle in the workflow: it removes *informational* checkpoints and uses defaults, but the **merge/deploy human confirmation is exempt and non-negotiable** (mechanically enforced by the existing PreToolUse hook). State this exemption explicitly so no persona reasons its way past it.
- Make the test-integrity gate (Pitfall 7) catch the lazy fix: muting/skipping a flaky UI test must hit the justified-skip mechanism, not silently disappear.

**Warning signs:**
Recommended examples using `waitForTimeout` or `.css-xyz` selectors; UI tests sharing fixtures/data; visual baselines that diff on every run; a workflow that auto-approves a deploy or trims the human merge stop; flaky tests quietly `.skip`-ed instead of justified.

**Phase to address:**
The UI build-flow + automated UI/E2E phase, with skip-handling enforced by the test-integrity gate phase. Threatens the **humans-hold-merge/deploy** hard constraint (via the "bug less" slide). MEDIUM confidence (Playwright SOTA web-verified June 2026).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Leave WR-05 spawn prose in packaging templates "since adapters are already fixed" | Skip a tedious template edit | A future regen silently re-arms sub-agent spawning, breaking single-window design | **Never** — fix in the first packaging phase + add the grep guard |
| Embed BDD/ASVS/lint detail directly in role prompts | One file to edit; "all context in one place" | Prompt bloat lowers agent success; hits Codex 32 KiB cap; multiplies single-source drift | Never for the always-loaded prompts; OK in *referenced* workflow/checklist files |
| Free-text justification for skipped tests | Fast green gate | Test-integrity gate becomes a rubber stamp; trace stops being proof | **Never** — require ticket + owner + expiry + category |
| Hand-write the docs catalog "just to ship it" | Catalog exists today | Rots on first persona/workflow change; ships a lying artifact | Never — generate it; CI-fail on staleness |
| Always-on BDD/ASVS/UI-test ceremony (skip the dial) | Less config plumbing per capability | Over-taxes solo/lean users; drives them off | Never — every capability must define lean default + enterprise escalation |
| Migrate/update deletes-then-writes | Simpler installer code | Destroys user content; irreversible; violates the install hard-constraint | **Never** — rename-to-backup; deletion only behind explicit `--prune` |
| Paste capability prose into one tool's adapter to "fix it for that CLI" | That tool behaves right now | 6-way divergence; fix-in-five-places forever | Never — adapters are pointers; the fix is in the canonical source |
| Coverage-% target as the TDD goal | Easy to measure "done" | Assertion-free/tautological tests; false confidence | Coverage as a floor only, paired with assertion-quality checks |

## Integration Gotchas

*(For a markdown kit, "integrations" = the 5 host CLIs + Claude's two distribution forms + the install/state plane. These are where v1.2 prose actually executes.)*

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| 5 host CLIs (Claude/Codex/Gemini/OpenCode/Copilot) | Inlining new BDD/ASVS/UI content per-adapter | One canonical source; adapters point only (single-source) |
| Codex `AGENTS.md` (32 KiB cap) | Growing AGENTS.md with v1.2 detail past the cap | Keep minimal; CI-check byte size; push detail to referenced files |
| Claude plugin form (copied to cache) | A generated docs catalog or template referencing `../` outside the plugin dir | Keep everything the plugin needs inside the plugin dir; verify resolution in dogfood |
| Packaging templates → materialized adapters | Regenerating from stale (WR-05) templates re-arms `Agent` spawn | Fix templates first; grep-guard `tools: Agent` / "spawn" in CI |
| Install state plane (`.grugops/`, `plans/`, `memory-bank/`) | Migrate/update overwriting user-edited config/state | Rename-to-backup, seed-if-absent, never delete-first, byte-parity sh/Node |
| `factory.config.json` dial | New capability with no config branch (always-on) | Every capability reads the dial; lean default + enterprise escalation |
| PreToolUse prod-deploy hook | "Bug the user less" trimming the human merge/deploy stop | Hook stays; merge/deploy human confirmation explicitly exempt from "fewer checkpoints" |

## Performance Traps

*(grugops has no runtime; "performance" here = agent success rate + token cost as the kit grows, and the cost of running the gates.)*

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Context bloat from embedded v1.2 detail | Agent output less focused after prompts grow; higher token cost | Reference-not-embed; byte budget on AGENTS.md + role prompts | As soon as AGENTS.md nears 32 KiB / prompts double in length |
| Full BDD+ASVS L3+visual-regression on every change | Solo user abandons; trivial fixes take an hour | Dial it — lean defaults light, enterprise heavy | First lean-tier dogfood on a typo-sized change |
| Always-running visual regression with noisy baselines | Constant false diffs; team mutes the whole suite | Stabilize by construction (disable animations, mask dynamic, pin fonts) | First few CI runs on any real UI |
| Docs catalog regenerated/diffed on every tiny edit | Slow CI; noisy diffs | Generate deterministically; diff only the catalog, not the whole tree | As role/workflow count grows |

## Security Mistakes

*(Domain-specific to a security-auditing markdown kit, beyond generic web security.)*

| Mistake | Risk | Prevention |
|---------|------|------------|
| Fully-ticked ASVS checklist with no evidence | Fabricated security verdict; false assurance | Each pass cites evidence; no evidence → `UNKNOWN - verify`, never a tick |
| ASVS level mismatched to risk (L3 on trivial / L1 on regulated) | Friction or under-protection | Tie level to dial + project risk; L1 lean → L2/L3 enterprise |
| Security findings in grug/jokey voice | Human can't act; trust eroded at the safety moment | Clear professional English; severity + control + remediation |
| Migrate/update with no data-loss warning, or warning in grug voice | User loses config/state unaware | Clear-voice warning + backup-before-write + dry-run |
| Test-integrity skip used to bypass a security test | Security gap shipped behind a green gate | Justified-skip requires ticket/owner/expiry; security skips hard-fail at enterprise |
| Self-authored security/deploy approval | Agent approves its own gate | Approval/justification is a human artifact the agent records, never invents (mirrors prod-deploy hook) |

## UX Pitfalls

*(UX here = the developer using grugops, across solo→enterprise.)*

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Lean tier forced through enterprise ceremony | Solo builder feels taxed, abandons grugops | Light lean defaults; ceremony only on the enterprise flag |
| Too many human checkpoints in UI/test flows | Friction; user stops trusting the automation | "Bug the user as little as needed" — defaults over prompts, stop at real decisions only |
| Removing human checkpoints too aggressively | Required safety/merge/deploy stop skipped | Merge/deploy + named safety gates are exempt from checkpoint-trimming |
| Migrate that surprises the user with content changes | Lost trust; "the tool ate my config" | Dry-run preview, backups, explicit + reversible, never silent |
| Docs catalog that contradicts the actual roles | User follows wrong instructions | Generated + CI-gated catalog; never hand-maintained |
| Grug voice in a data-loss/security warning | User doesn't take the warning seriously | Clear voice for all warnings/findings/money/legal |

## "Looks Done But Isn't" Checklist

- [ ] **Packaging templates:** Often still carry `tools: Agent` / "spawn" prose (WR-05) — verify both templates AND a fresh regen produce no spawn grant; grep-guard in CI
- [ ] **Migrate/update:** Often missing the "user edited the file" case — verify user config/adapters are backed-up (not lost), re-run is a no-op, uninstall-after-migrate restores; sh/Node byte-parity
- [ ] **New capability (BDD/ASVS/UI/lint):** Often missing the `factory.config` branch — verify it has an explicit lean default AND enterprise escalation, not always-on
- [ ] **Test-integrity gate:** Often accepts free-text skips — verify a hollow-justification skip FAILS a RED fixture; skip count surfaced in verdict
- [ ] **BDD `.feature` files:** Often documentation nobody runs — verify each scenario has executing step definitions; no UI selectors in Given/When/Then
- [ ] **ASVS checklist:** Often 100% pass with no evidence — verify every pass cites evidence or reads `UNKNOWN - verify`; findings in clear voice
- [ ] **Docs catalog:** Often hand-maintained — verify it's generated and CI fails on staleness; describes only what's in the canonical source
- [ ] **Voice:** Often grug voice leaked into security/compliance/warnings — verify a voice-lint check passes on those surfaces; role prompts still in grug voice
- [ ] **Single-source:** Often capability prose inlined in an adapter — verify adapters are pointer-sized; capability text exists once under `agent-factory/`
- [ ] **AGENTS.md size:** Often crept toward 32 KiB — verify byte size under the Codex cap
- [ ] **"Bug the user less":** Often slid into trimming a real gate — verify the merge/deploy human stop and the PreToolUse hook are untouched

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| WR-05 spawn re-armed by a regen | LOW (if caught by grep) / HIGH (if shipped) | Add the grep guard; strip spawn from templates + adapters; regenerate; re-verify single-window |
| Migrate destroyed user content | HIGH (data loss) | Restore from the rename-to-backup files if backups were made; if delete-first shipped, only git history saves the user — hence "never delete-first" |
| Single-source fork across adapters | MEDIUM | Diff adapters against canonical source; delete inlined prose; replace with pointer; add the adapter-size check |
| Prompt/AGENTS.md bloat | MEDIUM | Extract embedded detail into referenced files; re-measure bytes; re-run dogfood for success-rate recovery |
| Skippable enterprise gate | MEDIUM | Convert prose gate to a mechanical check (artifact-exists + ran); add a RED fixture proving the gate blocks |
| Hollow justified-skip | LOW (process) | Tighten the schema (ticket/owner/expiry/category); add RED fixture; audit existing skips |
| Stale docs catalog | LOW | Build the generator; add CI staleness check; regenerate from source |
| Voice leak into security text | LOW | Rewrite the offending findings in clear voice; add the voice-lint check |
| Flaky/noisy UI tests recommended | MEDIUM | Update the workflow/checklist to SOTA locators + stabilization; re-baseline visual tests |

## Pitfall-to-Phase Mapping

*(Phase names are themes from the v1.2 scope; the roadmapper assigns numbers. Ordering rationale: the SDLC-audit/foundation phase should establish the cross-cutting guards — dial contract, byte budget, voice-lint, WR-05 grep, single-source check — BEFORE the capability phases pour content in, so the guards catch drift as it's written.)*

| Pitfall | Prevention Phase (theme) | Verification |
|---------|--------------------------|--------------|
| 1. WR-05 spawn re-arm | SDLC-audit / persona-foundation (first packaging touch) | CI grep finds no `tools: Agent` / "spawn" in templates or fresh regen |
| 2. Migrate destroys content | Install migrate/update (MIGR-01/UPD-01) | RED harness: user edits survive, re-run no-op, uninstall restores, sh/Node byte-parity |
| 3. Voice drift | Security + senior-persona + migrate phases (cross-cutting) | Voice-lint check: no grug markers in security/compliance/warnings; prompts still grug |
| 4. Single-source fork | SDLC-audit/foundation (guard) + every content phase | `check-kit-refs`-style assertion: adapters pointer-sized, no capability prose |
| 5. Prompt/AGENTS.md bloat | SDLC-audit/foundation (byte budget) | AGENTS.md < 32 KiB; role-prompt length reviewed; detail in referenced files |
| 6. Config-dial regression | SDLC-audit/foundation (dial contract) + gate phase | Lean dogfood not over-taxed; enterprise gate mechanically un-skippable |
| 7. Test-integrity loophole | Test-integrity gate | RED fixture: hollow-justification skip fails; skip count in verdict |
| 8. BDD/TDD cargo-cult | Test-first (BDD+TDD) + gate | `.feature` files have executing steps; declarative scenarios; no layer duplication |
| 9. Docs-catalog drift | Browsable docs catalog | Generator exists; CI fails on stale catalog; documents only canonical source |
| 10. ASVS misapplication | Security audit (OWASP ASVS) | Level tied to dial/risk; every pass evidenced or `UNKNOWN - verify`; clear-voice findings |
| 11. Flaky/over-mocked/noisy UI tests + safety-gate slide | UI build-flow + automated UI/E2E + gate | SOTA locators/stabilization recommended; merge/deploy hook untouched; flaky-skip goes through justified-skip |

## Sources

- `.planning/PROJECT.md` — constraints, Key Decisions (single-source, zero-config, two-voice, no-fabrication, minimal AGENTS.md, humans-hold-merge/deploy, installers-never-delete), v1.2 scope + "bug the user as little as needed" (HIGH)
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md` — WR-05 regeneration hazard, CR-01 unbounded marker-strip / content-deletion fix, `check-kit-refs.sh` WR-01..04 false-green channels, two-root seed/skip-if-exists contract, sh↔Node byte-parity, RED-by-design harness pattern (HIGH)
- `CLAUDE.md` embedded STACK research — Codex 32 KiB `project_doc_max_bytes` cap, single-source adapter rule, plugin-cache copying, `Agent`-tool no-nesting / single-window design, prod-deploy hook (HIGH)
- OWASP ASVS 5.0 levels + checkbox-theater anti-pattern: [OWASP ASVS project](https://owasp.org/www-project-application-security-verification-standard/), [ASVS v5 — Cyber Chief](https://www.cyberchief.ai/2025/09/owasp-asvs-v5-raising-bar-for.html), [What's New in ASVS 5.0 — SoftwareMill](https://softwaremill.com/whats-new-in-asvs-5-0/), [What is OWASP ASVS — DevSecOps School](https://devsecopsschool.com/blog/owasp-asvs/) (MEDIUM)
- BDD/Gherkin anti-patterns (dead/imperative Gherkin, discovery > artifact, LLM-imperative tendency): [BDD 101: Writing Good Gherkin — Automation Panda](https://automationpanda.com/2017/01/30/bdd-101-writing-good-gherkin/), [Gherkin best practices — andredesousa (GitHub)](https://github.com/andredesousa/gherkin-best-practices), [Declarative vs Imperative Gherkin — Medium](https://medium.com/@putraadityapradana/understanding-declarative-and-imperative-gherkin-styles-in-bdd-9889f09b92d6), [Common BDD anti-patterns — Technogise/Medium](https://medium.com/technogise/common-anti-patterns-in-automations-coupled-with-bdd-7cbe50aeb04b) (MEDIUM)
- Playwright flakiness / over-mocking / visual-regression noise: [Reduce Playwright Flakiness — Decipher](https://getdecipher.com/blog/how-to-reduce-playwright-test-flakiness), [Playwright mistakes to avoid — TestDino](https://testdino.com/blog/playwright-mistakes/), [Stop writing flaky tests — Anna Tomka/Medium](https://medium.com/@anna_tomka/stop-writing-flaky-tests-how-to-avoid-common-playwright-mistakes-425da48b82d4), [Fixing flaky Playwright visual regression — Houseful](https://www.houseful.blog/posts/2023/fix-flaky-playwright-visual-regression-tests/) (MEDIUM)

---
*Pitfalls research for: markdown agent-factory adding SDLC depth, quality discipline & browsable docs (grugops v1.2)*
*Researched: 2026-06-09*
