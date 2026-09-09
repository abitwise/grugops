# Phase 31: Autonomous Manual Testing - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

An agent can drive a real browser to produce UAT evidence, and the only thing that counts as
evidence is an artifact the §14 gate re-runs — a committed Playwright spec. The agent's narration,
a screenshot, or an MCP tool-call transcript never produces a stamp. The phase delivers: the
evidence note shape with provenance (UATX-04), the spec-authoring step through pinned Playwright
MCP documented for all five host CLIs (UATX-01/02), the attended-only Claude-in-Chrome lane that is
structurally unable to earn a gate stamp (UATX-03), the loud-skip path when no browser is usable
(UATX-05), and the TypeScript-AST ban on conditional or caught assertions in generated specs
(UATX-06). Requirements UATX-01..06 are fixed by `.planning/REQUIREMENTS.md`; nothing here widens
them.

Out of the boundary: any change to the four safety floors, any new note kind, any new role, any
new host runtime dependency, and any board/dashboard rendering (Phase 32).

</domain>

<decisions>
## Implementation Decisions

### Evidence note shape and provenance (UATX-01, UATX-04)
- **D-01: Evidence is a `finding` + `artifact-ref` pair; no new note kind.** The §14 gate's
  re-run of the spec yields a `finding` stamped `verified_by: §14-gate#<id>` through the existing
  `emitVerdict` / `admit()` cross-check. An `artifact-ref` note points at the committed spec and
  carries three new required fields: `sha` (the commit the spec was run at), `gate_run` (the
  per-run `<id>` the verdict certifies), `content_hash` (see D-02). The six-kind schema in
  `agent-factory/contracts/context-note.md` stays closed. — **Reversibility:** costly — every note
  parser, the compactor carve-outs and the freshness-gated index would have to learn a seventh
  kind if this were later changed to a dedicated `evidence` note.
- **D-02: `content_hash` is sha256 over the committed UAT spec file (`.uat.spec.ts`) bytes at `sha`.** The
  Playwright run report is not hashed; it is a run product and is bound by `gate_run`. Anyone
  with the repo can recompute the hash. Transitive imports are not hashed (a helper edit does not
  invalidate the evidence in this phase).
- **D-03: The `sha != HEAD-of-gate-run` refusal lives in `admit()` at write time, and only there.** The verdict note the gate emits records the HEAD it ran against; `admit()` refuses an
  `artifact-ref` whose `sha` differs, naming both SHAs in the refusal. One authority per predicate
  (Phase 29 lesson): the gate does NOT pre-check, so there is no second implementation to drift.
  — **Reversibility:** one-way — moving the predicate later means two code paths deciding one
  question for the transition window, which is the exact drift class that cost 13 green-suite
  rounds in v2.0.
- **D-04: Green evidence advances `In UAT → Ready` ONLY when `checkpoints.sign_off_acceptance` is dialed to `allow`; the shipped default stays `block`.** The Phase 30 matrix is honoured
  unchanged: no default moves, no new checkpoint id, no floor touched. Zero-config still stops for
  a named human at `sign_off_acceptance`; a repo that trusts its specs flips the one config key
  (it is not a floor, so no second key is involved). The UAT Planner presents the pack as
  machine-backed either way.

### Spec location and authoring flow (UATX-01, UATX-02)
- **D-05: Specs live in the target repo's existing E2E directory under a `uat/` subfolder and are named `<ticket-id>.uat.spec.ts`.** They ride the existing `quality.ui_e2e` lane unchanged;
  no second Playwright project, no new config path. The `.uat.spec.ts` suffix is the recognition
  key for both the provenance `artifact-ref` and the AST ban (D-13).
- **D-06: QE/E2E authors the spec; the authoring step is added to workflow 06 (UAT pack).** The
  UAT Planner still writes the business scenarios; QE/E2E turns each scenario into a spec through
  Playwright MCP, then the gate re-runs it. No new role — the 17-role count every guard derives is
  untouched.
- **D-07: A new kit checklist `agent-factory/checklists/browser-uat-recipe.md` is the single home for the `@playwright/mcp@0.0.78` setup** — the five `mcp add` commands (Claude Code, Codex,
  Gemini CLI, OpenCode, Copilot CLI), the HEADED-default / `--headless` note, `npx playwright
  install --with-deps chromium`, and the pin. `install/README.md` gets one short section pointing
  at it. `package.json` gains nothing: the server is `npx`-invoked by the user's own agent.
- **D-08: The `0.0.78` pin is one literal in that checklist, asserted by a foundation guard.**
  `check-foundation-guards` asserts every mention of `@playwright/mcp@` across the kit and docs
  equals the checklist literal, the same idiom as the `@playwright/test 1.62.1` pins. Bumping is
  one edit plus re-pin. No `npm show` at gate time.

### Claude-in-Chrome lane (UATX-03)
- **D-09: The lane is barred by absence of any path, proven by test.** `emitVerdict` is the only
  author of a `by: §14-gate` note and takes a gate run's test-integrity result; nothing in the
  Chrome lane calls it. The lane's ONLY outputs are a `finding` stamped `human:<name>` and an
  `artifact-ref` describing what was witnessed. A test asserts the lane's source carries no
  reference to `emitVerdict` or `§14-gate`, and the existing reserved-identity impersonation
  refusal covers any note that tries. No hook denial on the MCP tools, no third reserved identity.
- **D-10: Attended-only is detected by reusing the fail-closed `claude auth status --json` probe from `scripts/e2e/uat-live.test.ts`, requiring `loggedIn === true` AND no `ANTHROPIC_API_KEY` in the environment.** A failed or inconclusive probe is a loud skip naming
  the reason; the lane never opens silently. `UNKNOWN - verify`: whether the JSON exposes the auth
  method (plan vs API key vs `setup-token`) — the researcher must check before the predicate is
  pinned; if it does not, the env-var check is the whole predicate and the doc says so.
- **D-11: The witnessing human's name enters `human:<name>` through the existing grant only — `GRUGOPS_ADMISSION_APPROVED_BY` read by the `admission-guard` PreToolUse hook.** No
  lane-specific variable. A Chrome-lane finding is just another human-stamped finding; the agent
  can never author the name (D-07 of v2.0 holds).
- **D-12: On the four non-Claude-Code hosts the lane is absent by design, stated once in the recipe.** No adapter carries a dead tool name, no per-host skip line. Playwright is the floor
  everywhere, so "degrade, never break" holds.

### Loud skip and AST ban (UATX-05, UATX-06)
- **D-13: The AST checker ships as a materialized runnable `tools/grugops/uat-spec-integrity.js` (name to be confirmed by the planner), built from `scripts/runnable-ref/` exactly like `test-skip-integrity.js`, and resolves `typescript` from the TARGET repo's `node_modules`.**
  grugops ships no parser and no dependency. If the target has no `typescript`, the runnable emits
  a loud skip naming `typescript`, the lane exits non-zero, and the UAT stays `pending` — never a
  pass. It runs at the gate over every `*.uat.spec.ts` (D-05).
- **D-14: The banned-construct set, decided over the TypeScript AST, is as follows.** (a) `expect` /
  `assert` calls inside a `try` block or `catch` clause; (b) `expect` calls under an `if` / `else`,
  a conditional expression, a logical `||` / `&&` / `??` operand, or an optional call; (c)
  `test.skip`, `test.fixme`, `test.only`, `describe.skip`, `describe.only`, and `expect.soft`.
  A spec body with zero `expect` calls is NOT refused in this phase (deferred, see below). The
  claim in the recipe and in GUARANTEES-style prose must name exactly this set — the claim matches
  the mechanism.
- **D-15: "Browser absent or unusable" is a two-stage fail-closed probe inside the runnable, as follows.**
  stage 1 resolves `@playwright/test` from the target; stage 2 runs `npx playwright --version`
  and checks that the browsers directory it reports exists and is non-empty. Any failure at either
  stage emits the exact loud-skip idiom (`LOUD_SKIP_MARKER`-style exported constant, distinct text
  naming the stage), the lane exits non-zero, and the UAT stays `pending`. The existing Tier-2
  convention is reused verbatim in shape; only the marker text differs.
- **D-16: A Playwright-lane skip is recorded as an unstamped `observation` note carrying the marker text verbatim.** No `finding`, no `artifact-ref`, no board move; the ticket stays
  `In UAT` and the pack shows the scenario as pending with the reason.

#### Gap-closure decision — D-17 (2026-09-08, gap-closure round 2, plan 31-11)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It EXTENDS D-14 arm (c); it does not replace D-14, and no existing decision above is
edited or renumbered.

**Forced by:** CR-06 of `31-REVIEW.md` and gap 2 of `31-VERIFICATION.md` round 2 (the truth beginning
"UATX-06"), plus the sibling finding WR-12 on the inverting modifier.

- **D-17: D-14 arm (c) is decided by a RULE over the resolved dotted path, not by an enumerable set
  of dotted paths.** A modifier call is refused when the HEAD segment of its dotted path is one of
  the banned head segments (`test`, `describe`) AND the TAIL segment is one of the banned modifier
  segments (`skip`, `only`, `fixme`, `fail`), or when the whole path is one of the banned exact
  paths (`expect.soft`). The segments in between — `describe`, `serial`, `parallel`, and whatever
  routing segment Playwright adds next — route the call and do not change what the tail does to the
  evidence a gate re-runs. `BANNED_CONSTRUCTS`, the nine-member literal 31-06 shipped, is DELETED:
  keeping a list of banned paths beside the rule would be two authorities for one question.
  `isBannedModifierPath` is the only function that answers it, and the arm-(c) call site asks it and
  performs no comparison of its own.
  - **Why a rule and not two more members.** The round-2 verifier reproduced
    `test.describe.serial.only(...)` and `test.describe.parallel.only(...)` passing the committed
    `.js` at `0 findings over 1/1 uat specs checked`, exit 0, on the same harness that refuses
    `test.describe.only` alone. Adding those two spellings would have been the third round of the
    same edit against this repository's recorded set-literal drift. The runnable's own header
    already required a red-team finding on the set to be "a NEW DECISION and a gap-closure round,
    never a quiet edit", and cited the prior phase that closed a class by defining a canonical form
    instead of adding one more spelling. This is that.
  - **D-14's letter is preserved.** Every path D-14 enumerated — `test.skip`, `test.fixme`,
    `test.only`, `describe.skip`, `describe.only`, `expect.soft` — and the three `test.describe.*`
    spellings 31-06 added are still decided. The bare `describe` head is RETAINED even though
    `@playwright/test` exports no top-level `describe`, because D-14 names it and because another
    framework's bare `describe` can be imported into a spec file.
  - **WR-12: the inverting modifier is decided rather than silent.** `test.fail(...)` runs the
    scenario and reports a failing assertion as a pass, so the lane is green BECAUSE the acceptance
    criterion failed. That is strictly worse for the evidence than removal, so `fail` joins the tail
    set. Leaving it undecided was also a choice, and it was being made silently.
  - **What D-17 does NOT establish.** The head set and the tail set are hand-authored, which is the
    axis this defect class can reappear on. Completeness against the real Playwright modifier surface
    is asserted in ONE direction only — every spelling the rule refuses is real — until plan `31-12`
    lands the reverse partition. The declared surface those checks run against is itself a hand
    transcription whose drift from the released package stays an open `UNKNOWN - verify` (`R-07`).
  - **Reversibility: costly.** Deleting the enumerable set changed the exported contract that both
    the recipe and the test suite consume. Reverting means restoring a set the verifier has now
    measured as incomplete twice.
  - **Recorded in three places that must agree:** here, in the comment beside the rule in
    `scripts/runnable-ref/uat-spec-integrity.ts`, and in `31-11-SUMMARY.md`'s key-decisions block.
    `agent-factory/checklists/browser-uat-recipe.md` quotes the three constants by value under a
    both-directions equality test, so the documented claim and the decided rule have one source.

#### Gap-closure decision — D-18 (2026-09-08, gap-closure round 3, plan 31-13)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It EXTENDS D-14 arm (c) and D-17; it replaces neither, and no existing decision above is
edited, renumbered or deleted.

**Forced by:** CR-07 and WR-14 of `31-REVIEW.md`, and gap 1 of `31-VERIFICATION.md` round 3 (the
truth beginning "UATX-06").

**Which register failed.** D-17 fixed MEMBERSHIP, and it fixed it correctly: `isBannedModifierPath`
decides every shape it is asked about, by head and tail, and needed no new member for the routing
segments the round-2 verifier planted. The round-3 verifier then planted five constructs the rule is
NEVER ASKED ABOUT, because `calleeDottedPath` declined to resolve their callees at all —
`test.info().skip()`, `test.info().fail()`, `test.info().fixme(true, "later")`,
`expect.configure({ soft: true })(locator).toBeVisible()`, and an import-renamed head
(`import { test as it } from "@playwright/test"; it.skip(...)`). Each reported
`0 findings over 1/1 uat specs checked` at exit 0 against the committed `.js`, independently
reproduced by this plan before any source change. The failing register is SHAPE RESOLUTION — which
call expressions the membership rule is even asked about — one register past the one D-17 fixed, and
the THIRD recurrence of this repository's set/shape-literal drift class inside Phase 31 alone.

- **D-18: the declining callee SHAPES are decided, and the set of shapes still declined is derived
  from the source rather than remembered.** D-18 adds no member to any ban set. It makes three
  sub-decisions and then bounds what is left.
  - **(1) A call link RESOLVES.** `calleeDottedPath` recurses on a `CallExpression` link and, when
    the inner path resolves, pushes it as ONE segment suffixed with a `()` marker; when the inner
    path does not resolve, the whole path still does not. `test.info().skip` therefore resolves to
    `test.info().skip`, whose head segment is `test` and whose tail segment is `skip`, so D-17's
    existing rule refuses it with NO new member in any set — the marker lands in the ROUTING
    position D-17 already decided is not part of the membership question. This is why the decision
    needs no decided list of call-bearing heads, which was the alternative the verifier's `missing:`
    offered and which would have been a fourth set literal on the axis this class keeps returning
    to. `expect(x).soft` stays legitimate BY CONSTRUCTION rather than by exception: its head segment
    is the marked `expect()` call, not the bare `expect` identifier, so its path is `expect().soft`,
    which is neither a banned exact path nor a banned head.
  - **(2) The configured-soft escape is a PATH PLUS AN ENABLED OPTION, not a path.** Refusing
    `expect.configure` by path alone would also refuse the legitimate `expect.configure({ retries: 2
    })`. The new frozen `BANNED_CONFIGURED_PATHS` maps a dotted path to the one option key whose
    `true` literal makes the call an escape (`expect.configure` -> `soft`), and `enabledOptionKeys`
    reads the property names assigned the `true` KEYWORD in the call's first object literal —
    literals only, no evaluation, no type checker. `isBannedModifierCall` is the single membership
    authority that joins the two halves and DELEGATES the pure-path half to `isBannedModifierPath`;
    the arm-(c) call site asks that one function and compares nothing itself, exactly as D-17
    requires.
  - **(3) An import rename is canonicalised before the head is read.** `deriveImportRenames` reads
    `ImportSpecifier.propertyName` off the `@playwright/test` import declarations — a literal
    already present in the source text, needing no type checker — and `canonicaliseHeadSegment`
    rewrites the resolved path's head through that map, so `it.skip` is asked as `test.skip`.
  - **The decline set is DERIVED, and bound in both directions.** The test suite parses the
    runnable's own source, closes over the resolver functions the arm-(c) site asks, and derives
    every position at which resolution ends without producing a path. That derived set's members and
    its cardinality are asserted separately, and every member is bound to either a decided construct
    or a NAMED member of `UNRESOLVABLE_CALLEE_RESIDUALS`, in both directions — no derived site
    without a binding, and no residual naming a site the resolver no longer has. A seeded extra
    decline branch is watched moving the count by exactly one and arriving unbound. A sixth
    undisclosed shape therefore reds the suite naming itself instead of passing at exit 0.
  - **What D-18 does NOT establish.** The rename canonicalisation is MODULE-SCOPED: a rename
    arriving through a local fixture-extension module is not canonicalised, because following a
    re-export across files needs resolution D-13 forbids shipping. The reverse partition `31-12`
    landed walks DECLARED PROPERTY CHAINS only — `checker.getPropertiesOfType` does not descend
    through a call signature's return type — so a call-link spelling is outside its denominator
    until that walk is extended; extending it would move the denominator of every coverage assertion
    `31-12` landed and is deliberately not in this round, and the boundary is stated in the recipe's
    completeness paragraph instead. A binding reached through a fixture parameter (`testInfo.skip()`)
    remains the disclosed alias residual for the same D-13 reason. The head and tail sets are still
    hand-authored, and the declared surface is still a hand transcription whose drift from the
    released package stays an open `UNKNOWN - verify` (`R-07`).
  - **Reversibility: costly.** The resolved-path spelling for a call link is now part of the
    exported contract the recipe quotes and the corpus asserts, exactly as D-17's constants are.
    Reverting means restoring a resolver the verifier has measured as declining five real spellings.
  - **Recorded in three places that must agree:** here, in the decision header of
    `scripts/runnable-ref/uat-spec-integrity.ts`, and in `31-13-SUMMARY.md`'s key-decisions block.
    `agent-factory/checklists/browser-uat-recipe.md` quotes the four rule constants by value under
    the both-directions equality test and carries the residual register verbatim, so the documented
    claim and the decided rule keep one source.

#### Gap-closure decision — D-19 (2026-09-08, gap-closure round 3, plan 31-14)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It sits BESIDE D-01 and leaves D-01, D-02, D-03 and D-04 untouched; no existing decision
above is edited, renumbered or deleted.

**Forced by:** CR-08 of `31-REVIEW.md`, and gap 2 of `31-VERIFICATION.md` round 3 (the truth
beginning "The admission mechanism 31-09 wired for UATX-01").

**Which register failed.** 31-09 correctly deleted the kind axis and made `appendNote` consult the
admission authority unconditionally — the fix D-01's evidence floor depends on. But the register it
did not ask about is REACHABILITY IN THE OTHER DIRECTION: not "which notes does the authority
refuse", but "which OPERATIONS now reach an authority built only to decide new admissions". A
re-write is one. `compactor.promote` is a thin pass-through to that writer and Workflow 18 names it
as the only prescribed promotion route, so a note a named human had already legitimately disposed at
the ORIGIN — written through `admitAndAppend`'s gated, pre-admitted branch — was refused, unchanged,
at the DESTINATION by `admit()`'s frozen D-04 arm, for the same structural reason that branch skips
the authority in the first place. Reproduced against the committed `scripts/context-io.js` and
`scripts/compactor.js` before any source change: the origin write returned an id, the identical
promotion threw D-04's refusal text, and zero notes landed at the destination. 31-09's own
blast-radius table enumerated this call site and dispositioned it "admits, unchanged shape ... for
every kind" without driving the case that changed; the round's only promotion probe used a
FABRICATED `§14-gate` stamp, never a legitimate human one.

- **D-19: promotion of an already-admitted note is a RE-BINDING, decided by a PROOF over bytes that
  already exist at the origin — never by a parameter, flag or option a caller can set.** D-19 adds
  no case to `admit()` and does not touch its frozen human-stamp arm. It adds a second route beside
  the full-admission one and makes four sub-decisions.
  - **(1) The entry set is the human-disposition stamp, and it is decided FIRST.** `promoteAdmitted`
    is entered for a note whose `verified_by` is a `human:NAME` disposition — the one question the
    in-script tier is structurally unable to answer. Every other shape, including a `§14-gate`
    stamp and an empty stamp, FALLS THROUGH to `appendNote` byte-identically to what `promote` does
    today, which is why a gate-stamped finding and an `artifact-ref` are still re-bound at the
    destination against a live green verdict there (UATX-04, Workflow 18 step 5) and are still
    refused when that verdict is absent.
  - **(2) The proof is over the origin's own stored bytes.** The named source note must be present
    in the origin context under the same task AND LIVE in the deterministic replay there, and the
    promoted input must recompose — through the module's own composer, validator and read-back
    projection — to exactly the record stored at that id. The four scalars CR-08's fix clause (a)
    names (`kind` / `by` / `verified_by` / `at`) are members of that comparison by construction, and
    so is every other field the store reads back. The frozen id is CARRIED FORWARD, so a faithful
    promotion produces a destination file byte-identical to the origin file.
  - **(3) The skip is scoped to the human-stamp arm, never to the authority.** `promoteAdmitted`
    consults the SAME discriminated `readGovernanceConfig` the gated branch consults and fails
    CLOSED on an unreadable configuration (D-14), so an unknowable dial refuses on this route too.
  - **(4) A re-binding appends NO GOV-02 audit event.** The origin's admission already recorded this
    exact id and the named human who disposed it; a second line keyed by the same id would be a
    duplicate — the shape 31-09 collapsed rather than widened. Measured by a retained-mode case
    rather than assumed.
  - **The road not taken, recorded.** CR-08's alternative — promotion must RE-ADJUDICATE, with a
    named human re-disposing every promoted high-severity finding through the hook on every
    compaction — is rejected. It converts a routine, non-semantic operation into a human gate at
    compaction frequency, and the round-3 verifier's own `missing:` prescribes the proof route.
  - **`add-alongside`, accepted as debt.** The re-binding case is NOT promoted into `admit()` as a
    new arm, because that arm is frozen by an earlier phase's forged-stamp backstop and editing it
    is a strictly larger blast radius than the gap requires. What would force a later promote: a
    THIRD re-write route appearing, or a need for the audit ledger to record a re-binding as a
    first-class event rather than as a pre-admitted skip.
  - **What D-19 does NOT establish.** The origin `notes/` directory is trusted here exactly as far
    as every other reader of it is trusted: a note HAND-WRITTEN into that directory and then
    promoted is a tampering this route does not close (`T-31-14-03`, disposition accept). Workflows
    16 and 18 forbid hand-authoring a context path, and the un-forgeable tier remains the per-call
    admission-guard hook. The compared field set is the store's own read-back projection plus the
    body, so a frontmatter key the parser accepts and that projection drops is not compared — and is
    also not read by `admit()` or `render()` (`R-37`, disposition accept). The route moves no board
    state and emits no verdict, so D-04's reservation — green evidence advances `In UAT → Ready`
    only when `checkpoints.sign_off_acceptance` is dialed to `allow` — cannot be reached through it.
  - **Reversibility: costly.** The route becomes part of the surface a host repository's workflows
    call, and Workflow 18 prescribes it. Reverting restores a state the verifier has measured as
    refusing a legitimate, human-adjudicated governance action.
  - **Recorded in three places that must agree:** here, in the decision header beside the route in
    `scripts/context-io.ts`, and in `31-14-SUMMARY.md`'s key-decisions block. The decline register
    `PROMOTE_ADMITTED_DECLINES` is exported from that module and its key set is asserted equal, in
    both directions, to the clause set derived from the route's own parsed body.

#### Gap-closure decision — D-20 (2026-09-09, gap-closure round 4, plan 31-16)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It sits BESIDE D-14 arm (c), D-17 and D-18 and leaves all three untouched; no existing
decision above is edited, renumbered or deleted, and no member is added to any ban set.

**Forced by:** CR-09 (both variants), CR-10 and IN-10 of `31-REVIEW.md`, and gap 1 of
`31-VERIFICATION.md` round 4 (the truth beginning "UATX-06").

**Which register failed.** D-17 fixed MEMBERSHIP. D-18 fixed SHAPE RESOLUTION. The register that
failed this round is **which arms the resolved shape is compared against**, plus a **membership miss
on a positional binding**. D-18 (1) inserts a `()` marker segment into the resolved path and
justified it for exactly ONE of the ban's three arms — the head/tail arm, where the marker lands in a
routing position D-17 had already decided is not part of the membership question. The two WHOLE-PATH
arms compare the joined path as a literal, and the marker adds a segment to that string. Reproduced
against the committed `scripts/runnable-ref/uat-spec-integrity.js` at HEAD before any source change,
in a probe repository under `.temp/` with a spec at `uat/p.uat.spec.ts`:
`expect.configure({ retries: 2 }).soft(locator).toBeVisible()` and
`expect.configure({ retries: 2 }).configure({ soft: true })(locator).toBeVisible()` each reported
`0 findings over 1/1 uat specs checked`, EXIT=0. Instrumented through the same committed module,
`"expect.configure().soft"` and `"expect.configure().configure"` (with `soft` enabled) both answered
`banned: false`, while the un-chained `"expect.configure"` answered `banned: true` — so the cause is
MEASURED and not inferred. Separately, `testInfo.skip()` / `.fail()` / `.fixme(true, "later")`
reached through the second callback parameter each reported `0 findings over 1/1`, EXIT=0: the path
resolves perfectly to `testInfo.skip` and the head is simply not a banned head, which is why neither
the derived decline set nor the reverse partition could ever have named it.

- **D-20: a routing link is not part of the membership question for ANY arm, the enabled-option axis
  is asked of the WHOLE marked chain, and a positional fixture binding is decided from the parse.**
  D-20 adds no member to any set and makes three sub-decisions.
  - **(1) One marker-aware normaliser, consumed by a DERIVED set of arms.** `stripRoutingLinks` is
    the ONE answer to "what does a resolved path look like when a routing link is not part of the
    membership question": an INTERIOR segment carrying the call marker is dropped, and a path whose
    FIRST segment carries the marker is returned unchanged, because there the marker IS the head — a
    user value was passed in. Both whole-path arms obtain their operand from it; the head/tail arm is
    left exactly as D-17 left it, because there the property already holds by construction.
    `expect(x).soft` therefore stays legitimate BY CONSTRUCTION and not by exception, and the
    marked-HEAD/interior-LINK separation is asserted in both directions. The normaliser DECLINES
    NOTHING — every exit returns its input or a rewrite of it — so the resolver's derived decline set
    stays exactly the set of positions where no path could be produced.
  - **(2) The option axis is folded across the chain, not read off the outer call.** The pair
    D-18 (2) decides is a path plus an ENABLED option, and after (1) the compared path can be folded
    from several links. `chainEnabledOptionKeys` unions the per-link readings, so a chain enabling
    the option at an INNER link is decided identically to one enabling it at the outer link. The
    converse ordering was MEASURED before the change rather than assumed: it already exited 1,
    because the inner link is itself a separately visited call node. What the fold removes is the
    DEPENDENCE of the verdict on which nodes the walk happens to visit — the same structural coupling
    CR-09 exploited one register over. Arm (c) now reports ONE FINDING PER CHAIN, keyed on the call's
    start position and its routing-stripped path, exactly as arms (a) and (b) key theirs on the head
    identifier's position; without that key the fold would report the converse ordering twice.
  - **(3) The TestInfo fixture-parameter binding is decided from the parse, in the one canonicaliser.**
    `deriveTestInfoParameterNames` reads the NAME of the second parameter of the function passed as
    the second argument to a `test(...)`-headed call, per source file, beside `deriveImportRenames`
    and by the identical parse-only argument D-18 (3) makes for `ImportSpecifier.propertyName`: the
    binding is POSITIONAL and the position is a literal already in the source text. The head is
    rewritten to `TEST_INFO_CANONICAL_HEAD` — `test.info()`, the spelling D-18 (1) already decided —
    rather than to a new spelling nobody decided, so `testInfo.skip` is asked as `test.info().skip`
    and the family has one spelling in the findings a reader sees. `canonicaliseHeadSegment` keeps
    its property of declining nothing. PRECEDENCE when a name is in BOTH maps is DECIDED and asserted
    rather than left to reading order: the file-scoped import rename wins over the callback-scoped
    fixture parameter. Both spellings of a banned tail are refused either way; what the precedence
    decides is which canonical path the finding names.
  - **The consumer set is DERIVED, and so is the ban-set axis.** The test suite parses the runnable's
    own source, derives the ban sets as the module constants the two membership authorities read
    (cardinality 4, asserted), and derives every position at which one of those constants is
    consulted together with the OPERAND it is consulted about (cardinality 5, asserted separately
    from the member list). Each derived arm is bound either to "asks the normaliser" or to a written
    raw disposition. A seeded fourth arm outside the normaliser is watched moving the count by
    exactly one and arriving unbound. Deriving the arms while hand-typing the SETS would have been
    the same half-fix one axis over, which is why both axes are derived.
  - **The disproved excuse is REMOVED, not relocated.** The sentence in
    `scripts/runnable-ref/uat-spec-integrity.test.ts` that dispositioned the fixture-parameter
    spelling under the alias residual's "cannot be followed to its declaration without a type
    checker" reason is deleted. Two residuals with reasons TRUE OF THEIR OWN SHAPES replace it — a
    destructured second parameter, and the scope-unawareness of both canonicalisations — and the
    two-axis residual partition still sums.
  - **What D-20 does NOT establish.** The fixture-parameter derivation is NOT scope-aware: a second
    parameter name also declared elsewhere in the file is canonicalised wherever it appears. That is
    the same shadowing boundary WR-20 records for the rename map, it is owned by plan `31-17`, and
    31-16 states the dependency rather than assuming it away — it is a NAMED member of
    `UNRESOLVABLE_CALLEE_RESIDUALS` and a quoted bullet in the recipe. A destructured second
    parameter is named there too. The head and tail sets are still hand-authored, the declared
    surface is still a hand transcription whose drift from the released package stays an open
    `UNKNOWN - verify` (`R-07`), and the reverse walk still reads no call signature's return type or
    parameter list, so neither a call-link nor a fixture-parameter spelling is inside its
    denominator. WR-19's per-frame recursion bound is `31-17`'s work and is untouched here.
  - **Reversibility: costly.** The routing-stripped spelling the arms compare, and the canonical head
    a fixture-parameter binding is asked as, are now part of the exported contract the recipe quotes
    and the corpus asserts, exactly as D-17's and D-18's constants are. Reverting restores arms the
    verifier has measured as defeated by one legitimate call link, and a state in which Playwright's
    primary documented spelling of the banned modifiers passes at exit 0.
  - **Recorded in three places that must agree:** here, in the decision header of
    `scripts/runnable-ref/uat-spec-integrity.ts`, and in `31-16-SUMMARY.md`'s key-decisions block.
    `agent-factory/checklists/browser-uat-recipe.md` states the routing-link rule for all three arms,
    lists the fixture-parameter spelling among the refused constructs, and carries the residual
    register verbatim under the existing both-directions equality case.

### Claude's Discretion
- Exact runnable file name and the exact wording of the two new loud-skip markers, as long as
  each is a single exported constant with a single emission point (the `uat-live.test.ts` shape).
- Field order and rendering of `sha` / `gate_run` / `content_hash` in `index.md`.
- Whether the browser-uat recipe is listed in the lean tier or the enterprise tier of
  `agent-factory/checklists/00-index.md` (it must be listed in exactly one).
- How the QE/E2E step in workflow 06 phrases the Playwright MCP exploration loop, within the
  Phase 29 writing profile.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research and requirements
- `.planning/research/STACK.md` §"Agent-driven browser testing" and the Playwright-vs-Chrome
  table — fixes the split (Playwright spec = evidence, MCP = authoring, Chrome = attended-only),
  the `0.0.78` pin, the five install commands, and the two `UNKNOWN - verify` items.
- `.planning/REQUIREMENTS.md` UATX-01..06 — the six requirements; none re-opened.
- `.planning/ROADMAP.md` §"Phase 31" — goal, five success criteria, research flag.

### Shared verified context (evidence note, stamps, admission)
- `agent-factory/contracts/context-note.md` — the six-kind note schema and provenance fence
  D-01 extends with three `artifact-ref` fields.
- `agent-factory/workflows/16-context-read-write.md` — the two accepted stamps and the
  finding-only stamp rule.
- `scripts/context-io.ts` — `emitVerdict` (only `by: §14-gate` author), `GATE_STAMP_RE`,
  `admit()` cross-check where D-03's SHA refusal is added, reserved-identity refusal D-09 relies on.
- `hooks/admission-guard.ts` — the `GRUGOPS_ADMISSION_APPROVED_BY` grant D-11 reuses.

### Gate, UAT workflow, checkpoints
- `agent-factory/workflows/05-pr-quality-gate.md` — the UI/E2E lane, test-integrity ordering,
  the materialized-checker invocation idiom, verdict emission on green only.
- `agent-factory/workflows/06-uat-pack.md` — where D-06's authoring step is inserted; owns
  `sign_off_acceptance`.
- `scripts/checkpoints.ts` — `sign_off_acceptance` default `block` (D-04 honours it).
- `agent-factory/config/factory.config.md` — `quality.ui_e2e` dial and `checkpoints` matrix.

### Loud skip and runnable idiom
- `scripts/e2e/uat-live.test.ts` — `LOUD_SKIP_MARKER`, `claudePresentAndAuthed()`, the single
  emission point; D-10 and D-15 clone this shape.
- `scripts/runnable-ref/test-skip-integrity.ts` and `install/install.ts` (the
  `tools/grugops/` materialization list) — how a gate-time checker reaches a target (D-13).

### Existing Playwright guidance
- `agent-factory/checklists/playwright-visual-regression-recipe.md` — the pinned
  `@playwright/test 1.62.1` / `@axe-core/playwright 4.12.1` idiom D-08 copies.
- `agent-factory/checklists/00-index.md` — where the new recipe is listed.
- `install/README.md` — receives the pointer section (D-07).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `emitVerdict` / `admit()` in `scripts/context-io.ts`: the whole stamp economy already exists;
  Phase 31 adds three fields and one refusal, no new stamp grammar.
- `claudePresentAndAuthed()` + `LOUD_SKIP_MARKER` in `scripts/e2e/uat-live.test.ts`: the
  fail-closed probe and single-emission-point skip pattern to clone twice (auth lane, browser lane).
- `scripts/runnable-ref/` → `tools/grugops/*.js` materialization via `install.ts`: the delivery
  path for the AST runnable.
- `check-foundation-guards` pin assertions: the idiom for D-08's `0.0.78` guard.
- Phase 30 `checkpoints.ts` matrix and `renderCheckpointBanner`: D-04 needs no new mechanism.

### Established Patterns
- One authority per predicate; a safety invariant closes on a structural fix plus independent
  red-teams, never on a green suite (v2.0 doctrine, Phase 29 D-59 posture on totalities).
- Every skip is LOUD and leaves state `pending`; a silent green is the forbidden outcome.
- Zero shipped runtime deps: hosts run committed `.js`; anything needing a library resolves it
  from the target.
- Derived sets over hand-maintained lists (Phase 27): the AST runnable's spec set must be
  derived from the `*.uat.spec.ts` glob, and the banned-construct list must be the single
  source the recipe quotes.

### Integration Points
- Workflow 06 step insertion between scenario assembly and QE coverage validation.
- Gate step list in workflow 05: the AST runnable runs before the UI/E2E lane, in the same slot
  family as `test-skip-integrity.js`.
- `install.ts` / `uninstall.ts` materialization lists gain one runnable.
- `context-note.md` contract and `context-io.ts` validator gain the three `artifact-ref` fields.
- `00-index.md` and `install/README.md` gain the recipe pointer.

### Verification obligations (carry-forward)
- `UNKNOWN - verify`: `mcp__claude-in-chrome__*` reachability from inside a subagent. The
  Playwright floor does not depend on it; only the Chrome lane's flow does.
- `UNKNOWN - verify`: whether `claude auth status --json` exposes the auth method (D-10).
- The Windows leg stays `UNKNOWN - verify` for every browser probe (WINDOWS.md posture).

</code_context>

<specifics>
## Specific Ideas

- The user wants green Playwright evidence to be ABLE to advance a ticket without a human, but
  only through the Phase 30 dial — "honour the matrix, keep default block" was the explicit
  reconciliation.
- Every recommended option was accepted; the one non-recommended pick (auto-advance) was then
  bounded by the matrix decision above.

</specifics>

<deferred>
## Deferred Ideas

- **Refuse a `*.uat.spec.ts` whose test bodies contain zero `expect` calls** (vacuous evidence).
  Not selected for the Phase 31 ban set; candidate for a later hardening round or a Phase 31
  gap-closure round if a red-team shows it matters.
- **Hashing the spec's transitive imports** so a helper edit invalidates evidence (D-02 hashes
  the spec bytes only).
- **A distinct checkpoint id for evidence-backed advance** — rejected for now in favour of the
  existing `sign_off_acceptance` dial.

</deferred>

---

*Phase: 31-autonomous-manual-testing*
*Context gathered: 2026-09-07*
