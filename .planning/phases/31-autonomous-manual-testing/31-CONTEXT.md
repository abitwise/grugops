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

### Derived decline clauses and their dispositions

The STANDING enumeration of `PROMOTE_ADMITTED_DECLINES`, bound by `scripts/context-io-writer-set.ts`'s
derived clause set in both directions. It lives here rather than in a plan summary because a summary
records what one round did and this is the current answer, which a later round may move — 31-14
originally bound it to `31-14-SUMMARY.md`, which left the current answer depending on a historical
record nobody may rewrite. That summary keeps its own six-row table as the history of its round; this
table is the one the suite reads.

| Clause | Disposition |
|---|---|
| `empty-source-id` | Refuse. A re-binding names the note it re-binds; an empty id names nothing, so there is no origin record to prove anything against. |
| `unreadable-governance-config` | Refuse, fail-closed (D-14). The dial is UNKNOWN, and this route skips only the arm the in-script tier cannot verify, never the authority. A genuinely ABSENT config is a different case and runs lean. |
| `no-such-origin-note` | Refuse. With no note at the named id in the origin, nothing was ever admitted there; the promotion is a NEW admission and must take the full-admission route. |
| `origin-note-not-live` | Refuse. The origin's deterministic replay folded the note out, so carrying it forward would re-admit a decision the origin already withdrew. |
| `field-differs-from-origin` | Refuse. A re-binding is a FAITHFUL carry-forward; a note whose provenance changed is a new note, and a new note is a new admission. |
| `body-differs-from-origin` | Refuse. A compaction that CHANGED the note is a new admission, decided by the full authority at the destination and honestly degraded when its stamp no longer cross-checks. |
| `destination-id-occupied` | Refuse (31-18, CR-11). The destination already holds a DIFFERENT note under this id, and a write that replaced it would DELETE admitted evidence from the permanent audit trail rather than supersede it. Destination bytes IDENTICAL to the proven origin bytes are the decided idempotent re-promotion, which proceeds and reaches no clause. |
| `origin-outside-trusted-store` | Refuse (31-18, WR-17). The proof's left operand must resolve inside a location the module has independent reason to trust — a directory it recognises as a grugops context store, or a location reached from its own trusted-root answer. An ordinary directory a caller authored and named lets that caller supply the bytes its own write is judged against. What the shape-based recognition still leaves open is the named residual `T-31-18-01`. |
| `destination-outside-governed-store` | Refuse (31-29, CR-20 / D-31). The destination must resolve, through the one authority `governanceRootOf`, to a recognised store anchored to a governance root — D-25's canonical origin form, asked of the destination too. The constraint is about IDENTITY, not evidence: a note and its GOV-02 event are two halves of one action, and while the note was keyed on `to` and the event on `repoRoot` a finding could land in one repository's store with its audit record in another's ledger. A store whose owning repository cannot be resolved is a store whose audit trail cannot be named. The alternative — promote and record nothing — is REJECTED: it makes the workflow's guarantee true by weakening it.
| `human-stamp-not-gated-at-destination` | Refuse (31-18, WR-18). The destination's dial does not gate this note, so a `human:NAME` disposition is not meaningful on it and accepting one would forge a `disposed_by` audit record — the identical ground `admitAndAppend`'s W3 arm refuses the same note on. Under a dial that DOES gate the note the CR-08 promotion is unchanged. |
| `unreadable-audit-ledger` | Refuse (31-21, WR-22 (2)). The destination repository's GOV-02 ledger IS present and could not be read — it is not a regular file, or it could not be opened at all. The route's response to "no record" is to APPEND, so answering "no record" for a ledger nobody could read manufactures a second event keyed on one id — the duplicate 31-09 collapsed and the reason D-19 (4) appends nothing when the id is already there. Absent and unreadable are different facts: an absent ledger honestly records nothing and the promotion proceeds; an unknowable one is refused. Decided BEFORE the note is written, and the position is named.

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

#### Gap-closure decision — D-21 (2026-09-09, gap-closure round 4 wave 2, plan 31-17)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It sits BESIDE D-18 and D-20 and leaves both untouched; no existing decision above is
edited, renumbered or deleted, and no member is added to any ban set.

**Forced by:** WR-19 and WR-20 of `31-REVIEW.md`, each independently reproduced by
`31-VERIFICATION.md` round 4 (behavioral spot-check rows 8 and 7, and the anti-patterns rows for the
512-step guard and for `canonicaliseHeadSegment`).

**Which register failed — twice, and neither is the register the previous three rounds fixed.**

*WR-19: the UNIT of a bound, which changed when the code around it changed.* D-17 fixed MEMBERSHIP,
D-18 fixed SHAPE RESOLUTION, D-20 fixed WHICH ARMS the shape is compared against. WR-19 is about
none of those: the 512-step chain bound was written for a FLAT loop, and D-18 (1) made
`calleeDottedPath` recursive without re-deriving it, so "512 steps per resolution" silently became
"512 steps per recursion frame". The bound then bounded nothing. Reproduced against the committed
`scripts/runnable-ref/uat-spec-integrity.js` at HEAD before any source change, in a probe repository
under `.temp/` with a spec at `uat/p.uat.spec.ts` carrying a 4000-link call chain:

```
EXIT=1     stdout: (empty)
stderr:    RangeError: Maximum call stack size exceeded
               at calleeDottedPath (…/scripts/runnable-ref/uat-spec-integrity.js:686:33)
```

and instrumented through the same committed module, which is what shows the per-frame restart rather
than inferring it: 600 pure property links resolved to `null`, while the SAME 600 links with 6 call
links interleaved resolved to a 1216-character path with head `test`. The exit code stayed inside the
D-12 contract's `{ 0, 1, 2 }` only because Node's uncaught-exception code is 1, which that contract
reads as "a finding — the quality gate blocks". The substantive harm is that `reportMeasured` was
NEVER REACHED, so the vacuity floor and the denominator floor — the two branches whose entire purpose
is to make a check that did not run unreadable as a clean one — were bypassed BY CONSTRUCTION while
stdout stayed silent. That is UATX-05's own contract failing on a reachable path, and it also made
the residual sentence the recipe quotes verbatim false in both of its clauses.

*WR-20: whether the name being rewritten is the name the map is about.* `canonicaliseHeadSegment`
rewrote `segments[0]` whenever it was a key of a file-level map, with no scope analysis at all.
Reproduced on the same probe shape, using the review's own spec:

```
UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
uat/p.uat.spec.ts:4: banned modifier call — `test.skip` decides which scenarios the quality gate
re-runs and how their results are read, …
EXIT=1
```

A legitimate spec was refused, and the finding named `test.skip` — a construct that does not appear
in the file. The failure direction is a FALSE REFUSAL, which trains a reader to work around the
checker rather than to trust it, and D-20 (3) had just added a SECOND map feeding that same
canonicaliser, so a scope rule written for the import map alone would have been this exact defect one
map over.

- **D-21: the chain bound is ONE shared budget for a whole resolution and the walk that asks it uses
  an explicit stack; and the ONE canonicaliser asks what a head is bound to, for every map that feeds
  it.** D-21 adds no member to any ban set and makes two sub-decisions.
  - **(1) One budget, one walk, one decided exit code.** `CALLEE_CHAIN_STEP_BOUND` is the ONE
    authority for the bound's VALUE — asserted by a case that parses the runnable and counts the
    numeric literal, so a second spelling of the number cannot appear — and `CalleeStepBudget` is the
    ONE authority for its UNIT. `calleeDottedPath` threads a single budget through its own recursion
    and charges the descent into a call link explicitly, so interleaving calls buys a chain no extra
    steps and a chain that exhausts the allowance yields NO PATH rather than an exception. Bounding
    the resolver is necessary and NOT sufficient, which is the part no review named: the tree walk
    that ASKS the resolver was itself a recursive descent, as deep as whatever chain a spec author
    writes, and no step budget could reach that cost. `forEachDescendant` replaces both
    self-recursive walks with an explicit worklist, so the depth leaves the interpreter's stack
    entirely and no new residual is created — every descendant is still visited exactly once, and
    both callers are order-independent. Finally, a spec `findBannedConstructs` cannot finish is
    recorded by `analyzeSpecs` as a COULD-NOT-RUN reason rather than allowed to escape as a throw:
    the exit code is then inside `{ 0, 1, 2 }` BY DECISION on every path, and because such a file
    does not increment `visited`, the denominator floor reports the short scan set out loud. Measured
    after the change on the same 4000-link probe: `EXIT=0`, stdout
    `UAT spec integrity: 0 findings over 1/1 uat specs checked`, stderr empty; and at 200000 links
    the same. Mutation-proven in both halves — restoring the per-frame reset fails 4 of the new
    cases, and restoring the recursive walk fails 3 (with the fail-closed boundary then holding the
    contract at `EXIT=2` and naming the file, which is the layering working as designed).
  - **(2) The scope rule lives in the canonicaliser and covers every map.** `deriveDeclaredNames` is
    a per-source-file census of the names the file DECLARES — a parameter, a `const`/`let`/`var`
    binding, a destructured binding element, a function name, a class name — every one a literal
    already in the source text, which is the identical parse-only reasoning D-18 (3) and D-20 (3)
    use. `canonicaliseHeadSegment` consults it BEFORE either map and returns its input unchanged for
    a declared head, so the rule wins over BOTH maps; precedence is asserted as its own case rather
    than left to reading order, and the canonicaliser keeps its property of declining nothing. The
    rule is MONOTONE IN THE SAFE DIRECTION: it can only stop a rewrite, and only where the file's own
    source text says the name is bound to something else — a spec that CALLS a renamed import does
    not DECLARE that name. An import binding is deliberately NOT counted, and that direction is
    asserted: a census counting import specifiers would make every rename shadow itself and the
    canonicalisation would never fire, which is how a fix buys a green by doing nothing. A function's
    SECOND parameter is exempt, because that is exactly where the TestInfo fixture map binds; the
    exemption is stated as a POSITION rather than as membership of that map, so the census does not
    depend on the map it constrains — a census derived from that map and then used to constrain it
    would be a fixed point this runnable does not compute. Measured after the change on the review's
    own spec: `0 findings over 1/1 uat specs checked`, `EXIT=0`. Mutation-proven twice: emptying the
    census fails 11 cases, and dropping the second-parameter exemption fails 8 — including the 31-16
    fixture-parameter cases, which is the proof that the exemption is scoped to exactly the position
    it claims.
  - **The sets stay DERIVED, and the numbers were re-measured rather than carried forward.** The
    derived decline-site set moved from 16 to **17**; the one added site is
    `deriveDeclaredNames`'s parser-predicate guard, dispositioned as a residual under the existing
    parser-surface sentence. The residual register stays at **9** — two of its sentences were
    REWRITTEN to be true of the changed mechanism, none was added or removed — and the two-axis
    partition still sums to it. The derived path-consumer set stays at **5** and the reverse walk's
    denominator at **26**; neither mechanism was touched. The watched-fail control still moves the
    decline count by exactly one and arrives unbound.
  - **What D-21 does NOT establish.** The scope rule is FILE-SCOPED, not lexically scoped: one
    declaration anywhere in the file suppresses the rewrite for the WHOLE file, so a file that BOTH
    declares the renamed name and genuinely calls the modifier through the rename is not refused.
    That cost is asserted as a MEASURED case, not merely described, so it cannot quietly stop being
    true. A name shadowed ONLY at a second-parameter position is still canonicalised. Both costs are
    NAMED members of `UNRESOLVABLE_CALLEE_RESIDUALS` with reasons true of them and are quoted into
    the recipe from that one source. The step bound remains a stated LIMIT — it is now honestly one
    allowance for one resolution rather than one per frame. The head and tail sets are still
    hand-authored, the declared surface is still a hand transcription whose drift from the released
    package stays an open `UNKNOWN - verify` (`R-07`), and the reverse walk still reads no call
    signature's return type or parameter list.
  - **Reversibility: costly.** The bound's UNIT and the scope rule's file-scoped answer are now part
    of the exported contract the recipe quotes and the corpus asserts. Reverting restores a resolver
    the verifier measured crashing with an empty stdout on a reachable input — with both floors
    bypassed — and a checker it measured refusing a legitimate spec while naming a construct that is
    not in it.
  - **Recorded in three places that must agree:** here, in the decision header of
    `scripts/runnable-ref/uat-spec-integrity.ts`, and in `31-17-SUMMARY.md`'s key-decisions block.
    `agent-factory/checklists/browser-uat-recipe.md` states the declared-name rule and its
    file-scoped coarseness in clear voice, states that a spec the checker cannot finish analysing is
    a could-not-run reason rather than an escaping throw, and carries the residual register verbatim
    under the existing both-directions equality case.

#### Gap-closure decision — D-22 (2026-09-09, gap-closure round 4 wave 3, plan 31-18)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It is a dated SUB-DECISION of D-19: it sits beside D-19's four sub-decisions, extends
(2), (3) and (4), and leaves D-01 through D-21 untouched. No existing decision above is edited,
renumbered or deleted.

**Forced by:** `CR-11`, `WR-17` and `WR-18` of `31-REVIEW.md`, and the round-4 `UATX-01` gap of
`31-VERIFICATION.md` (behavioural spot-check rows 9 and 10, the `regressions:` entry for CR-11, and
the key-link rows recording the destination link MISSING and the proof's operand MISWIRED).

**Which register failed.** For `CR-11`, an IDENTITY: `promoteAdmitted` took its write id from
`sourceId`, an argument, where every other writer derives its id behind `noteId`'s collision nonce
and can therefore only ever ADD a file — and the write never asked what was already there. The
round-4 verifier reproduced the consequence against the committed `scripts/context-io.js` and
`scripts/compactor.js`: a legitimate `observation` admitted into a shared destination the ordinary
way was replaced byte-for-byte by a forged `finding` under the same id, the same id returned, nothing
thrown, no diagnostic, and no admission check reached at all. The register nobody asked was the
DESTINATION's own contents. Every promotion probe of rounds 1 through 4 promoted into a FRESH
destination, which is why a green suite never saw it. For `WR-17` and `WR-18`, a READ TAKEN FOR
EXISTENCE RATHER THAN FOR CONTENT: the proof's left operand was read from `from`, an unconstrained
caller-supplied path, and the governance configuration was read only for whether it PARSED —
`human_admission` had zero occurrences in the function body. So the route accepted bytes the
benefiting caller authored, and carried a `human:NAME` stamp forward under a dial that
`admitAndAppend` refuses the identical note under. One rule, two answers.

- **D-22: the shared verified context is APPEND-ONLY as a property of the write, the proof's operand
  is bytes the module has independent reason to trust, and the governance dial's VALUE decides
  through the one gated authority.** D-22 adds no case to `admit()`, does not touch its frozen
  human-stamp arm, and does not touch `hooks/guard.ts`. It makes five sub-decisions.
  - **(1) The append-only invariant is enforced at the POINT OF EFFECT.** `writeNoteFile` — the
    module's single note-write chokepoint — refuses a write onto an id whose destination bytes
    DIFFER. The check is there rather than in the one route the reviewer reached because this
    repository's doctrine is to ask how a chokepoint is REACHED, not only what it refuses: a check
    written into `promoteAdmitted` alone would close that route and leave the capability for the next
    writer that accepts a caller-chosen id. `appendNote`'s own append-only justification comment
    stops being an assumption every writer happened to satisfy and becomes a property the write
    enforces.
  - **(2) The IDENTICAL-bytes case is decided, not defaulted.** A write whose bytes are exactly what
    the destination already holds PROCEEDS, as a no-op. The post-condition the caller asked for
    already holds, there is nothing to destroy, and the case is reachable without any adversary — a
    re-run compaction promoting the same admitted note twice must not become a refusal. Because the
    write returns early, `atomicWrite`'s rename is never asked to replace an existing note file, so
    its Windows unlink-then-rename branch stays what its own comment says it is.
  - **(3) The route ALSO declines by name.** `destination-id-occupied` joins
    `PROMOTE_ADMITTED_DECLINES`, read through the SAME reader the proof's left operand uses and
    positioned before the chokepoint, so "nothing was written" stays true by construction rather than
    by cleanup and the refusal is legible where a reader of the register looks.
  - **(4) The proof's left operand must resolve inside a location the module has independent reason
    to trust** — a directory it RECOGNISES as a grugops context store (`<X>/.grugops/context`, the
    shape `DEFAULT_CONTEXT_ROOT` names and the only shape the sanctioned writers create), or a
    location reached from `trustedRepoRoot()`. The route's `repoRoot` TEST SEAM is deliberately NOT a
    trusted base: a caller able to supply both the governance root and the origin would be choosing
    the location its own proof is judged inside. No parameter is added, and a derived case pins the
    route's parameter list so a widening one cannot arrive quietly. This extends D-19 (2).
  - **(5) The dial's VALUE decides, through `isGatedNote`, and the ledger premise becomes a LOOK.**
    The route asks the single-source gated authority the combiner and the 25-10 per-call hook both
    import — never a second local composition, which is this module's named ten-round drift surface —
    and declines `human-stamp-not-gated-at-destination` where the destination gates nothing, on the
    identical ground W3 names. Under a dial that DOES gate the note the CR-08 promotion is unchanged.
    And D-19 (4)'s no-ledger premise is checked rather than assumed: the route reads the destination
    repository's own GOV-02 ledger, appends nothing when the id is already recorded (D-19 (4) intact),
    and appends one event marked `re_bound: true` when it is not — so a `retained` destination can no
    longer gain a high-severity human-disposed finding with no ledger line anywhere in it, while the
    event stays distinguishable from a fresh admission. A fresh admission's seven-key line is
    byte-unchanged, asserted rather than claimed. This extends D-19 (3) and (4).
  - **The road not taken, recorded.** Requiring the origin to be the DESTINATION's own context store
    is rejected: a cross-repository compaction — an origin in one checkout, a destination in another
    — is a promotion a host genuinely performs, and Workflow 18 names the origin context root as an
    argument for exactly that reason. Refusing the identical-bytes re-promotion is also rejected, for
    the reason in (2). Turning the ledger premise into a NAMED RESIDUAL rather than a check was the
    other acceptable outcome the review offered; the check was chosen because the destination
    repository's ledger is a file this route already has the root for, so the premise cost one read.
  - **What D-22 does NOT establish.** The origin store is recognised by its SHAPE or by sitting under
    `trustedRepoRoot()`, never by a registry, so a caller that constructs that whole tree around notes
    it authored still presents a store this route accepts (`T-31-18-01`, disposition accept, with
    what would force it closed recorded in the register). That bound is identical to `T-31-14-03`:
    this route trusts what a recognised store CONTAINS. `atomicWrite` remains exported, still renames
    onto whatever is there, and does not reach `writeNoteFile`, so the append-only invariant does not
    bind it — the disclosed `T-31-25` non-note-writer residual, unchanged. The compared field set is
    still the store's own read-back projection plus the body (`R-37`). The route still moves no board
    state and emits no verdict, so D-04's reservation cannot be reached through it.
  - **Reversibility: costly.** The append-only property becomes an invariant of the write chokepoint
    that every writer and Workflow 18 depend on, and the route's agreement with the combiner about
    one rule becomes part of the contract that workflow prescribes. Reverting restores a module the
    round-4 verifier measured silently deleting admitted evidence from the shared verified context,
    and two routes that answer the same governance question differently.
  - **Recorded in three places that must agree:** here, in the D-19 decision header beside the route
    in `scripts/context-io.ts`, and in `31-18-SUMMARY.md`'s key-decisions block. The standing decline
    enumeration above is asserted equal, in both directions, to the clause set derived from the
    route's own parsed body.

#### Gap-closure decision — D-23 (2026-09-09, gap-closure round 4 wave 4, plan 31-19)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It sits BESIDE D-19 and D-22 and leaves D-01 through D-22 untouched. No existing
decision above is edited, renumbered or deleted.

**Forced by:** `WR-21` of `31-REVIEW.md` — the residue the round-3 review left when it closed
`WR-15` — and the round-4 verification, which reproduced it independently and named it beside the
two blockers. `31-15`'s own plan carried the prohibition "the resolution order must never resolve to
a root ABOVE the repository boundary ... and never reaches a user's home directory" as a flagged,
unverified statement. Round 4 verified it and found it false.

**Which register failed.** A BOUND STATED IN PROSE AND NEVER EXPRESSED IN THE CODE. The upward
search's only stop conditions were a configuration found, an ancestor carrying `.git`, the
filesystem root, and 64 ancestors. None of those is the user's home directory — while the function's
own docstring said the walk "never continues past" a boundary so a resolution "can never reach a
user's home directory", and `agent-factory/workflows/16-context-read-write.md` repeated it. Both are
non-sequiturs: the marker stop fires only if some ancestor happens to carry `.git`, and nothing
guarantees one does. Measured against the committed `scripts/context-io.js` before any source
change, with both project-directory variables removed and a working directory three levels below a
home-directory-shaped ancestor carrying `.grugops/factory.config.json` and no marker on the path,
`trustedRepoRoot()` returned the planted ancestor and read its `human_admission: "all"`; a second
probe drove an admission from that shape and the GOV-02 event landed in the planted directory's own
`.grugops/audit/admissions.jsonl`. Under the shipped shared-install model the kit lives at
`~/.grugops`, so that ancestor shape is what the installer creates rather than a contrived tree.

- **D-23: the bound on the governance-root search is a PROPERTY OF THE WALK, not of which markers a
  filesystem happens to carry, and the prose that states it is quoted from the mechanism under an
  asserted equality.** D-23 adds no case to `admit()`, does not touch its frozen human-stamp arm,
  and does not touch `hooks/guard.ts`. It makes five sub-decisions.
  - **(1) The walk halts at the user's home directory and never inspects it or anything above it.**
    The code is made to match the documentation rather than the documentation weakened to match the
    code, which is the direction the review offered as its first acceptable outcome. The comparison
    is against the DIRECTORY and not a spelling of it: `dev:ino`, so a home reached through a
    symlink or spelled with different case on a case-insensitive filesystem is still recognised — a
    missed stop is the unsafe direction. The identity set's own premise is CHECKED rather than
    assumed (the home directory's identity is compared with its parent's, and where they agree the
    platform's identities are discarded and path spellings decide alone), because a platform with
    degenerate identities would otherwise stop the walk at its first step and re-open WR-15 there.
  - **(2) A home directory that cannot be determined stops the search rather than licensing an
    unbounded one.** The answer degrades to the kit — the answer the pre-`31-15` program gave
    unconditionally — which is the one outcome this case may not turn into a walk with no ceiling.
  - **(3) The boundary set no longer depends on one tool being present.** `REPO_BOUNDARY_MARKERS`
    names nine version-control markers rather than `.git` alone. It is recorded as CONTENT and not
    as the bound. The road not taken is recorded with it: a non-VCS `.grugops` boundary was refused
    because a sub-package carrying grugops STATE and no configuration would end the walk below the
    repository whose dial governs and fall through to the kit's lean default — a configuration
    moving from refused to admitted, which is the WR-15 defect itself.
  - **(4) A repository root's own configuration outranks one nested inside it** — WR-21's second
    half, DECIDED rather than named. A vendored kit's `agent-factory/config/factory.config.json`,
    the second published candidate and the file every vendored copy of this kit carries, won over
    the host repository's own for any process whose working directory sat under it. That is a
    governance dial lowered by changing directory. Measured pre-fix: root `…/host/vendor/kit`, dial
    `off`, a self-stamped high-severity finding WRITTEN; post-fix: root `…/host`, dial
    `high-severity`, REFUSED naming the dial. Where the repository root carries no configuration the
    nested one still answers, so nothing that resolved before resolves differently.
  - **(5) The complete stop set is a FROZEN EXPORT and the protocol document is quoted from it.**
    `TRUSTED_ROOT_STOP_CONDITIONS` publishes every stop once, with the step limit INTERPOLATED
    rather than typed, and `scripts/context-io.test.ts` asserts the workflow's list set-equal to it
    in BOTH directions with a watched-fail control seeding an extra stop on each side. This is the
    structural half: WR-21 exists because a claim was free to outrun the mechanism, and correcting
    the sentence without binding it would leave the next drift unobserved.
  - **The road not taken, recorded.** The review's other acceptable outcome — leave the walk
    unbounded and rewrite both sentences with a residual member — is rejected. The consequence is
    not only a wrong dial: `trustedRepoRoot()` is the answer every consumer asks, so the audit
    ledger writer lands in the adopted directory too, and one project's admission records would be
    written into another's committed audit trail. A documented capability is still that capability.
  - **What D-23 does NOT establish.** Four residuals are named in `TRUSTED_ROOT_RESIDUALS`, each
    with its reason and its closing criterion. `R-31-19-01`: a configuration at an ancestor BELOW
    the home directory, with no marker between, still governs — that IS step 3 and it is WR-15's
    closure, so the review's `Fix:` sentence is satisfied for the shape the review reproduced (an
    ancestor at or above the home directory) and refused below it. `R-31-19-02`: the home directory
    is whatever `os.homedir()` names, an ambient value — the same shape as `R-31-15-03` one name
    over, and a process that can set `HOME` can already set either project-directory variable.
    `R-31-19-03`: on a platform with degenerate filesystem identities the stop compares path
    spellings alone. `R-31-19-04`: the marker set is an open set, so a checkout whose marker is not
    named is not recognised as a repository root. The register's cardinality (8) is asserted
    separately from its members, and a watched-fail control proves the set-equality is a control.
  - **Reversibility: costly.** The stop set becomes a published authority the protocol document is
    quoted from, and every consumer's root resolution depends on the walk. Reverting restores a
    program the round-4 verifier measured adopting a home-directory-shaped ancestor's configuration
    and writing one project's admission records into another's audit trail.
  - **Recorded in three places that must agree:** here, in the resolution-order docstring beside
    `trustedRepoRoot` in `scripts/context-io.ts`, and in `31-19-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-24 (2026-09-09, gap-closure round 5, plan 31-21)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It sits BESIDE D-22 and D-23 and leaves D-01 through D-23 untouched. No existing
decision above is edited, renumbered or deleted.

**Forced by:** CR-12 and WR-22 of `31-REVIEW.md`, each independently reproduced by
`31-VERIFICATION.md` round 5 (behavioral spot-check row 7, the `regressions:` entry for CR-12, and
the key-link row recording `writeNoteFile`'s destination read MISWIRED). Both were re-reproduced on
this tree against the committed `scripts/context-io.js` before any source change: a FIFO at a note
path made `appendNote` exit 124 under `timeout 10` with zero bytes of stdout and zero of stderr, and
a FIFO at `<repoRoot>/.grugops/audit/admissions.jsonl` made `promoteAdmitted` exit 124 under
`timeout 15` with the destination note ALREADY written.

**Which register failed — two of them, and neither had been touched before.**

The first is WHICH PRIMITIVE A READ USES. Four rounds of this phase built derived axes over
`scripts/context-io.ts`: which functions can write a note, what the authority refuses, where the
re-binding route declines, how each writer's destination id is decided. Not one of them asks what a
read is made of. So round 4's CR-11 fix could add an unguarded `existsSync` + `readFileSync` pair to
the module's single note-write chokepoint — inside a function every one of those axes already covers
— and every axis stayed green while one allowed `mkfifo` wedged every writer in the module. The same
file already carried a 25-line header explaining that exact hazard, and a reader that refuses it,
2,400 lines below the new unguarded read. A rule living inside one function is a HABIT, not an
authority: the next reader added to the module did not inherit it.

The second is HOW MANY ROUTES A PROPERTY IS ASSERTED OVER. WR-22 cited `promoteAdmitted:1704` and
nothing else, and the sentence it corrects — `18-context-compaction.md`'s "the destination never
holds a human-disposed finding with no ledger line" — is a claim about the whole substrate.
`admitAndAppend`'s gated branch has the identical note-write / ledger-append pair, with `disposed_by`
derived from the very `human:NAME` stamp that makes the note human-disposed. Inverting only the
route the review walked would have left the corrected sentence false at the other one: the claim
outrunning the mechanism INSIDE the edit that exists to stop it.

- **D-24: every read and every append this module performs on a caller-influenced filesystem
  position goes through ONE non-blocking authority, and a property asserted in prose is asserted
  over the DERIVED set of routes that have it, never over the route a reviewer happened to name.**
  D-24 adds no case to `admit()`, does not touch its frozen byte-span (`ADMIT_FROZEN_SHA256` is NOT
  re-based), and does not touch `hooks/guard.ts` (`FROZEN_GUARD_BLOB` is NOT re-based). It makes
  three sub-decisions.
  - **(1) One non-blocking reader, and one non-blocking appender, for the whole module.** The body
    of `readGovernanceConfigCandidate` was LIFTED into `readRegularFileOrNull` rather than copied
    beside it, and that function became a caller of it — so the module has one read rather than two
    habits. Its own 25-line header stays in place as the recorded ORIGIN of the rule. The canonical
    form for a caller-influenced position is stated once, as an exported constant: `absent, or a
    regular file`. Everything else — FIFO, device, directory, socket, present-and-unopenable — is
    refused in bounded time, BY NAME, naming the position. The decision is made by `fstat` on the
    OPEN descriptor rather than by an enumeration of dangerous file types, because an enumeration is
    a list that rots; `fstat` through the descriptor also stats THROUGH a symlink, so a file
    legitimately delivered by a symlink to a regular file still reads while a symlink to a FIFO is
    refused for what it points AT. Five positions were routed through it, of which the review named
    two: the write chokepoint's destination read, `ledgerRecordsId`, the `readRawNotes` directory
    walk, the two CLI argv note reads, and the governance-config read. `readFileSync` is now absent
    from the module's `node:fs` import list entirely — 5 non-comment call sites became 0.
  - **(2) The GOV-02 ledger event is appended BEFORE the note is written, at EVERY member of a
    DERIVED note-then-ledger writer set, and the ledger look fails CLOSED.** The set is derived from
    the module's own source and has two members, `promoteAdmitted` and `admitAndAppend`; `admit()`
    appends an event and writes no note, and the derivation SHOWS that rather than the author
    asserting it. The two steps cannot be made atomic — this module has no transaction — so the
    ORDER decides which asymmetry a crash can produce, and it is chosen deliberately: a ledger line
    for a note that was not written is an OVER-RECORD, legible and reconcilable against the notes
    directory, while a note with no ledger line is a REPUDIATION. Neither route carries a value
    backwards: on both, the id is frozen before either step. `ledgerRecordsId` no longer answers
    `false` for a ledger that is present and unreadable — the caller's response to "not recorded" is
    to APPEND, so a fail-open read manufactured the duplicate event D-19 (4) exists to prevent. It
    now throws, and `promoteAdmitted` raises the new `unreadable-audit-ledger` decline before
    anything is written. D-19 (4) itself is unchanged: when the id is already recorded, nothing is
    appended.
  - **(3) The corrected prose names the routes it covers, and is BOUND to the derived set.** The
    `18-context-compaction.md` sentence now states the property, the two routes it holds on, the
    `audit_retention: retained` scope, the fact that under any other retention value no ledger is
    kept and the paragraph says nothing, the REACHABLE over-record direction, and the
    unreadable-ledger refusal. A case in `scripts/context-io-writer-set.test.ts` asserts that every
    member the derivation returns is NAMED in that paragraph and asserts the cardinality in the same
    case, so a third route appearing later turns the binding red instead of silently widening a
    claim the code no longer supports.
  - **The road not taken, recorded.** Adding the three lines of `O_NONBLOCK`/`fstat`/refusal
    directly to `writeNoteFile` — the smallest edit that closes the reproduction — is rejected. It
    would have produced a THIRD copy of one discipline in a file that already had two, and the
    reason CR-12 exists is that the second copy was never made: the rule was not reachable as an
    authority. A fix that closes a reproduction while leaving the next reader free to omit the rule
    is the "fix the probe shape" pattern five rounds of this phase have paid for.
  - **What D-24 does NOT establish.**
    - `R-31-21-01` — `atomicWrite`'s `writeFileSync` is a blocking-capable call this module still
      makes. It is NOT AIMABLE: its destination carries a random UUID no caller can predict, and the
      subsequent `renameSync` replaces rather than opens. A caller who can watch the temp name
      appear and win the race is already a same-uid direct-filesystem actor, which is the standing
      T-31-25 residual. Disposition: accept, recorded as a derived member with this answer rather
      than as prose.
    - `R-31-21-02` — a non-regular file planted INSIDE a `notes/` directory is SKIPPED by the
      directory walk rather than refused loudly. The walk already skips a file that does not parse,
      because one malformed file must not make a whole task's context unreadable, and throwing would
      let one planted FIFO deny `render` and `currentState` for the entire task — trading a hang for
      a denial one register over. The write side stays loud: the chokepoint refuses that position by
      name. What this costs is that the skip is quiet on a surface whose value is legibility.
      Disposition: accept, bounded by the loud write-side refusal.
    - `R-31-21-03` — THE PLAN'S OWN PREMISE WAS WRONG AND IS CORRECTED HERE RATHER THAN LEFT
      STANDING. Plan 31-21 recorded as a `must_haves.truth` that "the measured behaviour on darwin
      is that `appendFileSync` to a FIFO exits 0 IMMEDIATELY — no hang, and the GOV-02 event is
      silently discarded", and asked for that to be filed as a derived write-site disposition.
      Measured on this tree, it is false: `appendFileSync` opens for WRITING, and opening a FIFO for
      writing blocks until a reader appears — `timeout 10` produced exit 124 through BOTH `admit`
      and `admitAndAppend`. That is a fourth blocking position in CR-12's class, reachable from two
      routes that consult no ledger and therefore inherit no read-side refusal. It is closed rather
      than recorded: `appendRegularFileLine` replaces `appendFileSync`, a FIFO now fails ENXIO in
      0.05 s, and an admission that cannot be recorded under `retained` is REFUSED rather than
      granted unrecorded. The refusal lives in the WRITERS (`appendNote`, `admitAndAppend`) and not
      in `admit()`, because `admit()` decides whether a note is admissible while "can this admission
      be recorded" is a fact about the filesystem — putting the second question inside the authority
      would conflate them and would add a member to a refusal-family axis whose every member is
      about the note. This is why `admit()`'s frozen span is untouched.
    - `R-31-21-04` — the derivations behind both new axes are SYNTACTIC. They resolve a call by
      identifier, so an alias or a computed member call is not seen; and the order axis excludes a
      note write that is the whole expression of a `return` statement, because such a tail
      delegation returns before any ledger work in that function happens. Widening either matcher
      once per counter-example is the failure this repository has paid for, so the boundary is
      written down instead. What watches it is behavioural: the FIFO corpus and the per-member
      transposed mirrors.
  - **Reversibility: costly.** The named refusal clause, the canonical-form constant and the
    one-authority rule become part of the module's exported contract and of two derived axes.
    Reverting restores a chokepoint the round-5 verifier measured hanging forever with zero bytes on
    both streams, reachable by every writer in the module, and a GOV-02 ledger whose append was
    measured wedging two more routes.
  - **Recorded in three places that must agree:** here, in the `writeNoteFile` / one-reader header
    in `scripts/context-io.ts`, and in `31-21-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-25 (2026-09-09, gap-closure round 5, plan 31-22)

This is a GAP-CLOSURE decision recorded during execution, not an original user decision from the
discussion. It sits BESIDE D-22 and D-24 and leaves D-01 through D-24 untouched. No existing
decision above is edited, renumbered or deleted.

**Forced by:** CR-16 and WR-25 of `31-REVIEW.md`, each independently reproduced by
`31-VERIFICATION.md` round 5 (behavioral spot-check row 4 with controls at rows 5 and 6, the
key-link row recording `originIsTrusted`'s second arm MISWIRED, and the anti-patterns row at
`~1486-1491`). Both were re-reproduced on this tree against the committed `scripts/context-io.js`
before any source change. Legitimately-obtained human-disposed bytes copied into
`<proj>/tmp/forged/T-1/notes/` — an ordinary directory with no `.grugops/context` anywhere on the
path — promoted into a fresh destination id: `promotedId` returned, `threw` null, the destination
holding the file, and the destination repository's GOV-02 ledger gaining one `disposed_by` line.

**Which register failed — the SHAPE the operand is recognised by, and then one turn further in.**

Not membership, and not the operand's EXISTENCE: WR-17 fixed both in round 4. What failed is the
shape the operand is RECOGNISED by. Round 4 left the recognition a DISJUNCTION — the store shape, OR
a path at or under `trustedRepoRoot()` — and the agent that calls the route RUNS INSIDE the
repository, so every directory it can create satisfied the second arm. The constraint excluded only
origins outside the repository, which is not where a caller authoring its own proof would put one.

Deleting that arm was NECESSARY AND NOT SUFFICIENT, which was measured before this plan shipped
rather than discovered by the next round. `isRecognisedContextStore` is a two-component basename
test, so `<proj>/tmp/forged/.grugops/context` is a recognised origin — the same caller, the same
bytes, one `mkdir -p` further on. Driven against a scratch shape-only implementation of
`originIsTrusted`, it promoted. Under a basename-only rule the workflow sentence being rewritten in
the same plan could only have been NARROWED to "an ordinary directory"; it could not have been made
true. The register that closes it is ROOT ANCHORING rather than shape.

And separately: the ORDER in which a caller is told which clause failed. Measured order in the
committed artifact put the ENVIRONMENT clause ahead of the OPERAND clause, so under the lean posture
a caller naming a forged origin was told the destination's dial was the problem — and the workflow's
remedy for that clause is to WIDEN the dial.

- **D-25: a trusted proof origin has ONE recognised canonical form, and that form is a CONJUNCTION
  rather than a disjunction of arms — the recognised store SHAPE, AND a governance root this module
  resolves for itself from the one caller-supplied value. Everything else is refused BY NAME,
  including a path inside this repository. The clause a caller is told about names the caller's own
  INPUT before it names the caller's ENVIRONMENT.** D-25 adds no case to `admit()`, does not touch
  its frozen byte-span, and does not touch `hooks/guard.ts` (`FROZEN_GUARD_BLOB` is NOT re-based).
  It makes three sub-decisions.
  - **(1) The root-proximity arm is DELETED, not narrowed.** Proximity to the root the CALLER is
    already running inside is evidence of nothing. The review's narrowed alternative
    (`resolvedFrom === resolve(join(trustedRepoRoot(), ".grugops", "context"))`) is deliberately NOT
    kept as a second arm either: it is the AMBIENT special case of the anchoring conjunct, so
    keeping it would be a second authority for a question the conjunct already answers — the drift
    shape this module keeps deleting. `originIsTrusted` is now ONE `return` of a conjunction, and a
    case parses the module and counts its return statements rather than reading it.
  - **(2) The recognised form is conjoined with an INDEPENDENTLY-RESOLVED governance root.**
    `originStoreIsRootAnchored` asks `projectRootFromWorkingDirectory` about the origin's grandparent
    and requires the answer to BE that grandparent. This is not the doctrine the old two-arms
    docstring rejects: there is still exactly ONE caller-supplied value, and the module decides for
    itself whether that value's location is a governance root. A caller can move the origin; it
    cannot move what the walk says about where the origin is. The distinction is written at the site
    so a later reader does not mistake the two.
  - **(3) The operand clause precedes the dial clause, and the ORDER is a DERIVED axis.**
    `origin-outside-trusted-store` now sits immediately after `unreadable-governance-config` and
    immediately before `human-stamp-not-gated-at-destination`. `unreadable-governance-config` stays
    above both because an unreadable dial is a fail-closed PRECONDITION rather than an ordering
    preference. PART SIX-H of `scripts/context-io-writer-set.test.ts` parses `promoteAdmitted`'s own
    body, derives the ordered clause sequence, asserts its MEMBERS and its LENGTH, binds its SET
    two-sidedly to the derived decline set, fires a PREMISE on a renamed route, and watches a mirror
    with the two WHOLE guard blocks transposed fail.
  - **The road not taken, recorded.** Keeping an arbitrary in-repository origin and REWRITING both
    agent-facing sentences to match — the review's second acceptable outcome — is rejected. It would
    have turned a stop condition into a disclosure on the register whose entire contract is that the
    claim matches the mechanism, and it would have left the proof's left operand authored by the
    benefiting caller, which is D-22's own prohibition one round later.
  - **What D-25 does NOT establish.**
    - The rewritten `T-31-18-01` — a caller that constructs a whole GOVERNANCE ROOT around notes it
      authored still presents a store this route accepts. PRICED per position, measured rather than
      assumed: THREE filesystem operations inside a repository (marker, configuration, store), each
      proven load-bearing by a driven subtraction; TWO outside every repository, because a walk that
      meets no boundary answers the nearest configuration it remembered. That second number is the
      cross-repository capability the residual keeps. Disposition: accept.
    - `R-31-22-01` — the narrowing's own COST, found by driving the legitimate input rather than
      only the hostile one. A checkout carrying a `.grugops/context` store and NO governance
      configuration is now refused as an ORIGIN, where the deleted arm accepted it by shape. Bounded
      by the installer, which seeds `.grugops/factory.config.json` into every target it touches.
      Disposition: accept, as the stated cost of pricing the residual at three operations.
    - `R-31-22-02` — the DESTINATION axis. `to` is caller-supplied and is NOT constrained by the
      same canonical form, because it is not a proof OPERAND: nothing read at the destination is
      evidence FOR the promotion. Five destination shapes are driven and all five answers are the
      decided ones. Disposition: accept, bounded by the append-only write chokepoint.
    - The COUPLING to `31-23`. `originStoreIsRootAnchored` consumes
      `projectRootFromWorkingDirectory`, which `31-23` rewrites in wave 3. CONTROL 5a — a home-rooted
      project promoting from its own `$HOME/.grugops/context` — DECLINES at wave 2 and is EXPECTED to
      become PROMOTE at wave 3. That single DECLINE -> PROMOTE movement is the sole member of
      `31-23` PROBE 5's cross-plan intended-change list; CONTROL 5b is the unmoved control it is read
      against.
    - The SYMLINK answer. `resolve()` is LEXICAL, so the rule reads the link's OWN path components.
      A symlink whose own location is a recognised, anchored store is accepted whatever it points at;
      a shaped symlink under an unanchored directory is refused. Both are driven cases, and the
      answer is a decision rather than an accident.
  - **Reversibility: costly.** The recognition rule becomes the single published origin contract the
    workflow prose is quoted against. Reverting restores an arm the round-5 verifier measured
    accepting a caller-authored directory, which is verbatim the workaround the workflow calls
    refused.
  - **Recorded in three places that must agree:** here, in the D-19 route header in
    `scripts/context-io.ts`, and in `31-22-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-26 (2026-09-09, gap-closure round 5, plan 31-23)

**Forced by:** CR-13 of `31-REVIEW.md`, independently reproduced by `31-VERIFICATION.md` round 5
(behavioral spot-check row 8 with its control at row 9, the `regressions:` entry for CR-13, the
key-link row recording the walk MISWIRED, and the anti-patterns row at ~2598-2606).

Reproduced against the committed `scripts/context-io.js` before any source change: with `HOME` set
to a planted repository root carrying `.git` and `human_admission: high-severity`, both
project-directory variables genuinely removed, and the working directory inside it,
`trustedRepoRoot()` returned the KIT, the dial read `off`, and a self-stamped high-severity finding
WROTE. The control one level below the real home resolved to the project and read `high-severity`.
The two runs differ in nothing but whether the repository root is the home directory.

**Which register failed — not the bound's EXISTENCE, and not which markers the set contains.**

D-23 established that the walk must be bounded above; that is not in question and is re-measured
intact. What failed is a different register: WHETHER A BOUND ON ASCENT MAY ALSO BOUND OBSERVATION.
`31-19` asked `isAtOrAboveHome(dir, home)` BEFORE `dir` was inspected, at every step, so one
predicate answered two questions — "may the walk climb here?" and "may the walk look here?" — and a
repository whose root IS the home directory had its own marker and its own configuration skipped
entirely. That is the WR-15 verdict direction, a configuration moving from refused to admitted, and
on the four hosts D-12 names the in-script refusal is the only tier there is.

**D-26 AMENDS one sentence of D-23 and leaves the rest standing.** D-23 says the walk "halts at the
user's home directory and never inspects it or anything above it". The ascent halt STAYS. The
blanket non-inspection DOES NOT. D-23 itself is left byte-unchanged: the amendment is recorded here
as its own dated decision rather than edited into the sentence it corrects, so a reader can see both
what was decided in round 4 and what round 5 changed about it.

- **D-26: a bound on a SEARCH bounds the search, never the OBSERVATION. The user's home directory is
  inspected exactly once and ends the walk either way, and it answers ONLY as a repository — a
  version-control boundary marker, AND a carrying configuration candidate whose kind is the
  repository STATE-PLANE position rather than the IN-KIT position, AND that candidate not being one
  of the running module's OWN fallback candidate positions. Home never contributes to `nearest`.**
  D-26 adds no case to `admit()`, does not touch its frozen byte-span, and does not touch
  `hooks/guard.ts` (`FROZEN_GUARD_BLOB` is NOT re-based). It makes four sub-decisions.
  - **(1) The predicate is SPLIT and the order is inspect-then-decide.** `isAtOrAboveHome` is
    DELETED — a third predicate answering a question two now answer is the drift shape this module
    keeps deleting. `isAboveHome` refuses a strict ancestor outright; `isHomeItself` is asked AFTER
    the directory has been inspected. `HomeBoundary` carries two path sets and two identity sets,
    and the degenerate-inode premise is re-checked for the split shape rather than inherited: where
    a platform's inodes say nothing, BOTH identity sets are discarded and the spelling sets decide
    alone.
  - **(2) Home is adopted only as a REPOSITORY, never as a bare configuration position, and
    `R-31-19-05` names the cost.** The review's own `Fix:` sketch is NOT adopted verbatim: it
    assigns `nearest = dir` before asking whether `dir` is home and then returns `nearest`, so a
    home directory carrying only a configuration would be ADOPTED on the way past — verbatim the
    WR-21 hole `31-19` was convened to close, and the shape `~/.grugops/factory.config.json` has
    under the shipped shared install. Hence the marker requirement, and hence home never entering
    `nearest`.
  - **(3) The carrying candidate must be the STATE-PLANE position and not one of the module's OWN.**
    `governanceConfigCandidates` publishes TWO positions, and at `$HOME` the second is
    `$HOME/agent-factory/config/factory.config.json` — a KIT's own configuration, the file every
    vendored copy of this kit carries, and the exact position D-23 (4) already ruled must lose to a
    repository root's own. At every ordinary directory that rule holds because a boundary ABOVE the
    kit wins; at `$HOME` the walk ENDS, so nothing wins. The in-kit position is therefore excluded
    BY POSITION through the new published `GOVERNANCE_CONFIG_CANDIDATE_KINDS`, and the running
    module's own two candidates are excluded BY PATH EQUALITY through the new frozen
    `MODULE_OWN_CONFIG_POSITIONS`, because the kit this reader ships in is not a project.
  - **(4) EVERY input to the home rule beyond the walk's ordinary evidence is a path, a position or
    a load-time constant — no filesystem probe under `$HOME`, no environment read — and the
    ordinary evidence is PRICED in operations as `R-31-19-06` rather than defended.**
    `MODULE_OWN_CONFIG_POSITIONS` is `governanceConfigCandidates(GOVERNANCE_FALLBACK_BASE)` resolved
    once at load, and `GOVERNANCE_FALLBACK_BASE` is `join(import.meta.dirname, "..")` — a property
    of WHICH PROGRAM IS RUNNING, not of the filesystem that program inspects. `GRUGOPS_HOME` is
    deliberately read NOT AT ALL.
  - **BOTH adversarial re-checks are recorded, not only the second.** Sub-decisions (3) and (4) were
    forced by TWO successive re-checks of this plan BEFORE it executed, so the round-history law of
    this phase — every round's fix creating the next round's Critical — was interrupted twice inside
    the plan rather than once after it.
    - The FIRST found that marker-plus-configuration alone lets a kit's own configuration govern a
      project nested below home. That is sub-decision (3)'s reason.
    - The draft that answered it did so with two `existsSync` probes under `$HOME/.grugops`, and the
      SECOND measured both as caller-authorable in ONE operation, in OPPOSITE directions: creating
      `<kitHome>/agent-factory` turned an ADOPTION into a REFUSAL — and a refusal at home returns
      `nearest`, which with nothing remembered lands on `GOVERNANCE_FALLBACK_BASE`'s LEAN dial, so
      CR-13's own measured harm came back by one `mkdir` — while creating `<kitHome>/install.json`
      turned a REFUSAL into an ADOPTION. Reading that marker through its own parser is the same
      one-write flip: `install/install.ts:597-620` makes every `InstallMarker` field optional, names
      no TARGET, and accepts `{}` as valid. Sub-decision (4) is the rule written so a third turn has
      nothing to find.
    - The retracted claim is RETRACTED rather than inherited. The earlier draft argued that the
      kit-ownership set "may only disqualify, never qualify", and that was false in both halves:
      false in fact, because the `install.json` arm QUALIFIED a position the other conjuncts
      refused; and false in principle, because a disqualification at home is not the safe direction.
      `WR-15`'s monotone-in-the-safe-direction argument was written about the step-4 fallback and
      does not transfer to a walk whose refusal LANDS on that fallback.
  - **What D-26 does NOT establish.**
    - `R-31-19-05` — a repository rooted at home carrying a configuration but NO version-control
      marker is not adopted, and its dial is replaced by the kit's lean default. Disposition:
      recorded, not closed. What would force it closed is an explicit opt-in the walk can read that
      a caller cannot author, and explicitly NOT the installer's own marker.
    - `R-31-19-06` — the two evidence conjuncts, PRICED in operations rather than in adjectives:
      THREE against a bare home (`mkdir $HOME/.git`; `mkdir $HOME/.grugops`; write
      `$HOME/.grugops/factory.config.json`), ONE against a home already carrying a dotfiles
      checkout, and ONE for the converse gate LOWERING that predates this plan
      (`mkdir $HOME/work/.git` ends the walk at an intermediate boundary carrying no configuration,
      after which the answer degrades to the lean fallback). Both counts are driven by construction.
      Disposition: accept, inside the class `R-31-15-01` already accepts.
    - `R-31-19-07` — the exclusion compares LEXICAL path spellings. MEASURED on both axes its shape
      sentence names: the exclusion HOLDS under a symlinked spelling (Node's ESM resolver realpaths
      the module and `process.cwd()` returns the kernel's realpath, so both sides are already real)
      and MISSES under a case-differing one on a case-insensitive filesystem, where the running
      kit's own configuration is adopted over a project nested inside it — RED 2b's harm reached
      through a spelling rather than through a position. Disposition: disclosed with its criterion.
      The `dev:ino` alternative is refused because a single symlink makes it agree, and case-folding
      the comparison is refused because an added refusal at home lands on the lean fallback.
    - `R-31-19-01`'s still-open below-home question is untouched: a configuration at an ancestor
      BELOW home still governs, which IS step 3 and is WR-15's closure.
    - The DOTFILES-PLUS-SHARED-INSTALL tree is ADOPTED, and that is a DECIDED verdict rather than a
      case that quietly changed. `$HOME` carries a marker and a state-plane configuration and
      neither is this module's own position — the identical evidence, and the identical answer, the
      walk gives for that tree one level BELOW home. A DEFAULT shared install creates NEITHER
      artifact at `$HOME`: `copyKit` writes only `$GRUGOPS_HOME/agent-factory`, and
      `seedState`/`writeMarker` write under `$TARGET/.grugops` only, which is `$HOME` exactly when
      the user installed INTO home — the case that must be adopted.
    - `GRUGOPS_HOME` is read NOT AT ALL, and treating it as additive-only would itself have been
      unsound, for the same reason the retracted claim above was.
  - **Reversibility: costly.** The stop set is a published authority the workflow prose is quoted
    from and every consumer's root resolution depends on. Reverting restores a walk the round-5
    verifier measured skipping a home-rooted repository's own dial in favour of the kit's lean
    default.
  - **Recorded in three places that must agree:** here, in the `trustedRepoRoot` resolution-order
    docstring in `scripts/context-io.ts`, and in `31-23-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-27 (2026-09-09, gap-closure round 5, plan 31-24)

**Forced by:** CR-14, WR-23, WR-24 and IN-12 of `31-REVIEW.md`, with CR-14 independently reproduced
by `31-VERIFICATION.md` round 5 (behavioral spot-check row 10 and its control at row 11, the
key-link row recording the census MISWIRED, and the anti-patterns row for `deriveDeclaredNames`).

Reproduced against the committed `scripts/runnable-ref/uat-spec-integrity.js` before any source
change, from a probe root under `.temp/31-24-probe/`. `import { test as it, expect }` plus
`it.skip("scenario", async ({ page }) => { const it = 1; void it; ... })` reported `0 findings`, exit
0. The identical file WITHOUT the dead `const` reported `1 finding(s)`, exit 1, naming `test.skip`.
The namespace spelling and an index-0 helper parameter named `testInfo` gave the same pair of
answers. WR-23's shape ran the other way: `function inner(n: number, it: { skip: ... })` inside a
file that renames the framework import to `it` reported `1 finding(s)`, exit 1, naming `test.skip` —
a construct absent from the file.

**Which register failed — not membership (D-17), not shape resolution (D-18), not which arms
(D-20), not the bound's unit (D-21 (1)), but the SCOPE of a suppression; then, one turn further in,
WHICH of several in-scope bindings ANSWERS; and separately the POSITION an exemption names.**

D-21 (2) established that the ONE canonicaliser must ask what a head is bound to, for every map that
feeds it. That placement is right and is unchanged. What failed is the register the question was
asked in: a per-file SET of names. For a BAN, returning a head unchanged means `it.skip` is asked as
`it.skip`, whose head is not a banned head, so the construct is ADMITTED — and one dead declaration
anywhere in a spec disabled the whole rename/namespace/fixture-parameter family for that file.

**Narrowing file-scope membership to containment was NECESSARY and NOT SUFFICIENT, and that was
MEASURED before this plan shipped.** Under a rule where ANY containing binding suppresses, the
SourceFile contains every call, so `const testInfo = 1;` at module scope together with the ordinary
`test("s", async ({ page }, testInfo) => testInfo.skip())` still reports `0 findings` at exit 0. The
register that fixes it is RESOLUTION — innermost wins — rather than containment.

- **D-27: a reference is resolved to the NEAREST binding of its name that lexically contains it, and
  only THAT binding decides whether the canonicalisation is suppressed.** `deriveDeclaredNames` is
  REPLACED by `deriveDeclaredBindings`, which returns an ordered list of
  `{ name, start, end, suppresses }`; `resolveBinding(bindings, name, position)` is the ONE
  resolution authority; and `canonicaliseHeadSegment` takes a `{ bindings, position }` PAIR and
  consults that authority in place of a name-set membership test. It makes four sub-decisions.
  - **(1) Innermost-binding resolution replaces file-scope membership, asked with the reference
    POSITION, through one authority BOTH canonicalisations consume.** Among the records of a name
    whose range contains the position, the one with the greatest `start` decides, tie-broken by the
    smallest `end`. The rule keeps D-21 (2)'s placement — in the canonicaliser, before either map —
    so a third map arriving later inherits it. The scope argument is a PAIR rather than two
    parameters, so a caller that cannot produce a position cannot produce the argument either: a
    file-level constant is not a position, and a zero sits inside the SourceFile's own range, which
    under a hoisting module-scope binding suppresses every call in the file. Both callers pass the
    `getStart(sf)` of the call they are deciding, and the caller count is asserted by a case that
    parses the module rather than by a grep.
  - **(2) Ranges are computed PER DECLARATION KIND, because the kinds disagree about where a binding
    begins.** `var` bindings and function declarations HOIST: their range is the nearest enclosing
    function-like node, or the SourceFile at module scope, in full, and a reference above them is
    legitimately theirs. `let`, `const`, a binding element of either, and a class declaration's name
    do NOT: the range starts at the declaration's own `getStart(sf)` and runs to the end of the
    nearest enclosing block, loop or function. That is the temporal-dead-zone answer; it is also the
    safe direction for a ban, and it is what stops `it.skip(...)` followed by a later `let it = 1;`
    in the same block from being the same two-line evasion CR-14 was. A parameter, destructured or
    not, ranges over its own function; a catch-clause binding ranges over its catch clause. An
    import binding stays OUT of the list for the reason D-21 (2) already recorded.
  - **(3) The TestInfo fixture-binding position is RECORDED as a NON-suppressing binding rather than
    OMITTED, and the exemption stays a POSITION.** Omitting it makes the parameter invisible to
    resolution, so an outer declaration of the same name becomes the nearest binding and suppresses
    — which is exactly the module-scope evasion measured above. Recording it makes the parameter the
    nearest binding, and it suppresses nothing. WR-23 narrows the position itself: index 1 of a
    function that is ITSELF THE SECOND ARGUMENT of a call expression, which is where
    `deriveTestInfoParameterNames` binds, rather than index 1 of ANY function-like node. It never
    becomes membership of the map it constrains, so D-20 (3)'s fixed-point argument is preserved
    exactly.
  - **(4) The disclosure states the DIRECTION a suppression moves a BAN.** The D-21 header's
    sentence "THE RULE IS MONOTONE IN THE SAFE DIRECTION" is corrected in the same edit as the
    mechanism. Stopping a rewrite is the only direction in which this rule can change an answer, and
    it changes it from REFUSED to ACCEPTED. What bounds the rule is the nearest-binding resolution,
    not a claim about its direction. The corrected sentence, the rewritten
    `UNRESOLVABLE_CALLEE_RESIDUALS` member and `browser-uat-recipe.md`'s boundary list all move
    together, under the both-directions equality the suite already asserts.
  - **The corpus can now fail in BOTH directions (WR-24).** `shadowed-rename.uat.spec.ts` was a
    zero-findings control, so a fix that disabled the canonicalisation entirely kept it green —
    which is the state 31-17 shipped. It gains a `MUTATE-REMOVE` region carrying a genuine
    module-scope renamed modifier call: region present, exactly one finding; region removed, zero.
    WR-23's second-parameter helper is added as a second control in the same file.
  - **IN-12 is the same family, one register down.** `stripRoutingLinks` ran twice on one input
    inside the configured arm. It now runs ONCE into a local both positions read, which is the
    argument the existing comment already made, expressed so the two positions cannot drift apart.
    The CR-09 path-consumer derivation was STRENGTHENED in the same edit rather than weakened by it:
    it now FOLLOWS an operand identifier to the local's initialiser, because a check that looked for
    the normaliser's name in the operand text would have gone quietly true for any local whatever.
  - **What D-27 does NOT establish.**
    - A module-scope declaration still reaches the WHOLE FILE wherever nothing nearer binds the
      name. That is the correct half of the old file-scope rule and it is driven as its own case;
      the stronger claim — that a module-scope declaration suppresses even where an inner binding
      exists — is FALSE and is driven as the RED case that proves it.
    - NO BINDER IS SHIPPED (D-13). Resolution is a RANGE test over positions the parse already
      carries, not real name resolution. A `typeof`-guarded conditional declaration, a `with` block
      and any other construct whose real binding a parser cannot see are outside what these ranges
      decide. Disposition: disclosed in the exported register, quoted into the recipe.
    - A parser that publishes no `NodeFlags`, no `getEnd` or none of the five declaration predicates
      yields NO list at all, and the canonicaliser then applies no scope rule — the pre-D-21
      behaviour. The flags are in the SAME guard rather than in a per-kind fallback on purpose:
      guessing a declaration's kind would widen half the ranges in a file, and a wider range is a
      wider suppression, which for a ban is the unsafe direction.
    - A name shadowed ONLY at the fixture-binding position is still canonicalised. That is D-20 (3)'s
      own recorded cost and it is unchanged.
    - The head and tail sets are still hand-authored, and `R-07` — the declared surface's drift from
      the released `@playwright/test` — is still an open `UNKNOWN - verify`.
  - **Reversibility: costly.** The resolution rule is now part of the exported contract the recipe
    quotes and the corpus asserts. Reverting restores a checker the round-5 verifier measured
    ADMITTING `it.skip` at module scope because of a dead declaration in an unrelated block.
  - **Recorded in three places that must agree:** here, in the D-21 header block and
    `deriveDeclaredBindings` docstring in `scripts/runnable-ref/uat-spec-integrity.ts`, and in
    `31-24-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-28 (2026-09-09, gap-closure round 5, plan 31-25)

**Forced by:** CR-15 of `31-REVIEW.md`, independently reproduced by `31-VERIFICATION.md` round 5
(behavioral spot-check row 12, the `regressions:` entry for CR-15, the key-link row recording
`ts.createSourceFile` NOT_WIRED to the could-not-run boundary, and the anti-patterns row at ~1605).

Reproduced against the committed `scripts/runnable-ref/uat-spec-integrity.js` before any source
change, from a probe root under `.temp/31-25-probe/` with the spec at `uat/p.uat.spec.ts`. A spec
containing `const x: any = ((((…1…))));` measured, on this tree:

| depth | exit | stdout | stderr |
|---|---|---|---|
| 500 | 0 | 57 B, `0 findings over 1/1 uat specs checked` | empty |
| 630 | 0 | the same pass line | empty |
| 631 | 1 | empty | `RangeError: Maximum call stack size exceeded` |
| 1000 / 2000 / 5000 | 1 | empty | 1474 B, `RangeError` at `typescript.js` `token()` |

with NO measurement line on EITHER stream at any failing depth. **The bypass threshold moved from
4,000 to 1,000, in the opposite direction from the round-4 fix**, and the recipe paragraph the same
round added asserted it could not happen.

**Which register failed — not the bound's VALUE and not its UNIT, both of which D-21 (1) fixed, but
WHICH WORK THE BOUNDARY ENCLOSES; and separately, WHETHER THE CONTRACT IS HELD AT THE PROCESS EDGE
AT ALL.**

D-21 (1) decided that a spec this runnable cannot finish is a could-not-run reason rather than an
escaping throw. That decision is right and is unchanged. What failed is that it was implemented
around ONE FUNCTION — `findBannedConstructs` — while `ts.createSourceFile`, a recursive-descent
parser running on author-controlled source, sat one line ABOVE the `try`. The substantive harm was
never the exception and never the exit code: it is that `reportMeasured` is never REACHED, so the
vacuity floor and the denominator floor are bypassed BY CONSTRUCTION while stdout stays silent, and
Node's uncaught-exception code 1 is read by the D-12 contract as "a finding — the gate blocks". A
check that never ran is reported as a check that found something.

- **D-28: the `{0,1,2}` contract is held at TWO decided boundaries and nowhere else.** It makes
  three sub-decisions.
  - **(1) EVERYTHING this runnable does with a spec's bytes is inside ONE per-file boundary, and the
    fix covers the CLASS rather than the call the review reproduced.** In `analyzeSpecs` one `try`
    now encloses the read, the `ts.createSourceFile` call, the `parseDiagnostics` inspection and the
    `findBannedConstructs` call. A file the parser cannot finish is a file this runnable did not
    check, exactly like one it could not read: it is named on stderr, it does NOT increment
    `visited`, and the denominator floor therefore reports the short scan set out loud. The four
    could-not-run reasons stay distinguishable — unreadable, did not parse, the parse itself
    faulted, could not be analysed — so a reader can tell which happened. `deriveSpecPaths`'s
    directory `walk`, named by CR-15 as the SECOND unguarded self-recursion in the same file, is
    de-recursed into an explicit worklist in the same edit, for the identical reason D-21 (1)
    replaced BOTH self-recursive AST walks rather than only the one WR-19 named.
  - **(2) `main`'s whole body is inside ONE process boundary that names the fault and returns 2.**
    The `try` returns what the body returns, so a legitimate 0 and a legitimate 1 pass through
    untouched and only a THROW becomes 2. The code is 2 rather than 1 because 1 means "a finding —
    the gate blocks", which is a claim ABOUT THE SPECS, and a runnable that could not complete has
    made no claim about them. `PROCESS_BOUNDARY_MARKER` is the reason string, distinct from every
    per-file could-not-run reason. `MainDependencies` is the injected-dependency record that makes
    the boundary REACHABLE by a case — the same seam, for the same stated reason, as
    `analyzeSpecs`'s injectable `readFile`: a boundary nobody can reach is a boundary nobody has
    tested. Every field defaults to the real function, so the CLI runs exactly the program it ran
    before the record existed.
  - **(3) The requirement is "the measurement reaches the stream ITS BRANCH writes to", published as
    `MEASUREMENT_BRANCH_STREAMS` and READ OFF `reportMeasured` rather than imposed on it.**
    `reportMeasured`'s two floors call `err(...)` and return 2; only the findings line and the pass
    line call `out(...)`. So a could-not-run shape produces its measurement on STDERR with an EMPTY
    stdout, by design. An earlier draft of this decision required a `visited/expected` line on
    STDOUT for every could-not-run shape; that requirement is unsatisfiable without MOVING a floor's
    output, and moving it would re-author the `scripts/vacuity.ts` mirror D-21 deliberately keeps.
    The requirement was rewritten rather than the mechanism. `PATHOLOGICAL_INPUT_SHAPES` publishes
    the corpus's coverage as a set — six shapes, generated at RUN TIME into a probe root removed in
    a `finally`, because `tsconfig.fixtures.json` type-checks everything under the fixtures
    directory and a 1,000-deep nesting or an invalid-UTF-8 file committed there would turn a
    different gate red for a reason unrelated to the ban.
  - **What D-28 does NOT establish.**
    - A fault that terminates the process WITHOUT UNWINDING — an out-of-memory kill, or a signal —
      is caught by no `try` and is outside both boundaries. It is disclosed by name in the recipe
      rather than left implied.
    - Whether the Windows leg of this behaviour matches the POSIX one is an open `UNKNOWN - verify`,
      consistent with the standing portability posture.
    - A could-not-run run is still a run that covered LESS THAN THE DERIVED SET, not a run that
      proved anything. Exit 2 is never a pass, and the floors say so on stderr.
    - `reportMeasured`'s own branch/stream design is the `scripts/vacuity.ts` mirror and is left
      BYTE-UNCHANGED by this plan; a case asserts its four branches are still the same four with the
      same two writing to `out` and the same two to `err`. A requirement that would have forced it to
      change is a requirement this plan rewrote, never a mechanism it re-authored.
    - The de-recursed directory walk covers the CLASS; whether the OLD recursive walk was reachable
      to exhaustion is platform-dependent and was MEASURED rather than assumed — on this tree a
      like-for-like recursive frame overflows around depth 8,000 while the path-length limit stops
      directory descent at 476, so the exhaustion was not reachable here.
  - **Reversibility: costly.** The two boundaries are now the exported contract the recipe quotes and
    the corpus asserts. Reverting restores a runnable the round-5 verifier measured crashing at a
    QUARTER of the previously-fixed depth, with both measurement floors bypassed and stdout silent.
  - **Recorded in three places that must agree:** here, in the D-21 header block and the
    `analyzeSpecs` / `main` docstrings in `scripts/runnable-ref/uat-spec-integrity.ts`, and in
    `31-25-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-29 (2026-09-10, gap-closure round 6, plan 31-27)

**Forced by:** CR-17 of `31-REVIEW.md`, independently reproduced by `31-VERIFICATION.md` round 6
against the committed `hooks/hook-entry.js` at HEAD (`3a82d6f`); and structural fix S1 of
`31-round6-residual-dispositions.md`, together with `R-31-19-07`, which round 5 recorded OCCUPIED at
a price of one filesystem operation.

Reproduced in this plan against the committed artifacts before any source change, driven through the
command DERIVED from `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` substituted — never a retyped
argv, because a test that drills the module instead of the entry is exactly what produced CR-17:

| shape | positions | exit | stdout | stderr | wall |
|---|---|---|---|---|---|
| control, untouched mirror | — | 0 | 442 B deny | 27 B | 0.07 s |
| FIFO at a manifest position | **13 of 13** | **124** | **0 B** | **0 B** | 12.0 s |
| stdin whose writer never closes | — | killed by the harness at 25 s | 0 B | 0 B | >25 s |

and, for the governance root, against the committed `scripts/context-io.js`:

| input to today's tier 1 | verdict |
|---|---|
| `CLAUDE_PROJECT_DIR` = a REGULAR FILE | accepted as the governance root |
| `CLAUDE_PROJECT_DIR` = a directory with NO version-control marker | accepted |
| `CLAUDE_PROJECT_DIR` = the kit's OWN root | accepted |
| the kit addressed through a case-differing spelling of its own root | the module-own exclusion MISSED (premise asserted first: `realpathSync.native` returned ONE canonical path for both spellings) |

**Which register failed — not the RULE and not the FILE the rule was written in, but WHICH FILE THE
RULE WAS CARRIED TO.** D-24 (plan 31-21) is right and is unchanged: every read on a caller-influenced
position goes through one non-blocking regular-file reader. It was implemented in
`scripts/context-io.ts` and never carried to `hooks/hook-entry.ts` — the file `hooks/hooks.json`
names, the process the host spawns for every `Bash` tool call and every `mcp__grugops__*` call. This
is the SIXTH consecutive round in which a fix landed in the module the finding named and the next
Critical appeared at the coordinate the fix did not reach.

- **D-29: the PreToolUse wrapper performs no unbounded operation before it can answer, and the
  governance root gains a tier whose delivery channel the agent cannot write.** Four sub-decisions.
  - **(1) The bounded-work rule is a PROPERTY OF THE WRAPPER, not a second habit inside it.** Every
    manifest read goes through one inline `readRegularFileOrRefuse` — `O_NONBLOCK` open, `fstat` on
    THAT descriptor, a stated `HOOK_MODULE_MAX_BYTES` ceiling, a bounded read, a `close` in a
    `finally` — producing THREE distinguishable denials: absent, `manifest-path-not-a-regular-file`,
    above-the-ceiling. And the wrapper's own fd-0 payload read is DELETED rather than guarded: fd 0
    is inherited by the child that `DECIDER_TIMEOUT_MS` already bounds, so a stall on the host's
    stdin becomes SIGTERM on a child and the existing `child.signal !== null` branch answers with no
    new code path. A read the wrapper does not perform cannot be a read the wrapper waits on.
  - **(2) The restatement is bound to the original by MEASUREMENT, not by trust.** The wrapper may
    import only `node:` builtins, so the reader is restated inline rather than imported — a second
    implementation of one rule, which is this repository's recorded drift shape.
    `scripts/nonblocking-reader-parity.test.ts` therefore DERIVES the implementing-file set by a
    structural question asked of every function-like node found by a RECURSIVE walk, asserts its
    members and its cardinality of 2, and moves that count by exactly one in each direction with two
    seeded mirrors; and it drives ONE shared eight-shape corpus through BOTH implementations,
    requiring the same decision class from each. Measured on darwin: 8 driven, 0 skipped, 0
    disagreements, max 51 ms.
  - **(3) Tier 0 is a HOST-DELIVERED root, and it is a NARROWING that is measured rather than
    argued.** `hooks/hook-entry.ts` reads its own host-built `CLAUDE_PROJECT_DIR`, shape-checks it
    with builtins alone, and sets `GRUGOPS_HOST_DELIVERED_ROOT` on the ONE `spawnSync` it makes; an
    unusable value delivers NOTHING rather than a bad value, and an ambient value under that name is
    DELETED rather than inherited. `hostDeliveredRoot()` accepts only a canonical, absolute, existing
    directory carrying a version-control marker that is not the kit's own root. A differential drives
    one value set through tier 1's predicate and tier 0's: tier 1 accepts 6, tier 0 accepts 1, and
    every value tier 0 accepts tier 1 already accepted. `TRUSTED_ROOT_TIERS` publishes the five-step
    order and `agent-factory/workflows/16-context-read-write.md` is asserted equal to it in BOTH
    directions.
  - **(4) `R-31-19-07` is CLOSED by canonicalising BOTH sides through ONE ladder, and the register is
    re-scoped BY HOST.** `canonicalDirectoryPath` is kernel realpath, then portable realpath, then
    the deepest EXISTING ancestor with the remainder re-joined — that tail is load-bearing, because a
    candidate position need not exist and a bare `resolve` there would have left the bypass open
    after the "fix". `TrustedRootResidual` gains a `hosts` field: four members become
    `non-cc-hook-path` (closed on the Claude Code hook path by tier 0, open on the other four hosts),
    six keep `all` as written CLOSE dispositions, and `R-31-19-03` keeps `all` and stays the
    register's ONLY OPEN item, owned by `31-30`'s Windows leg and the standing human item R-03.
  - **D-29 AMENDS ONE CLAUSE OF D-26 AND LEAVES THE REST STANDING.** D-26 fixed the home rule's
    published-name set at FOUR and BANNED `realpathSync` from that closure, because the design it
    retracted PROBED the filesystem under `$HOME` and an adversarial re-check measured that probe as
    a one-operation flip in BOTH directions. `canonicalDirectoryPath` is the FIFTH name and is not
    that: it is a canonicalisation applied to both sides of one comparison, not a probe whose ANSWER
    is a conjunct. The flip it does admit is MEASURED rather than argued away — a caller with write
    access under `$HOME` can plant `$HOME/.grugops` as a symlink into the kit's own `.grugops`, and a
    driven case shows the resulting governance VERDICT is identical to the control's, because the
    symlink IS the kit's configuration and both answers read one file. Keeping the ban would have
    meant keeping a measured, occupied bypass to preserve a rule written against a different
    mechanism. Every other banned name stands.
  - **What D-29 does NOT establish.**
    - **Tier 0 does not exist on Codex, Gemini CLI, OpenCode or Copilot CLI.** No host there builds
      the environment of a grugops decider, so the walk remains the answer and the four re-scoped
      members are open on those hosts. The register says so member by member rather than globally.
    - **It closes nothing about a process acting as itself.** An agent invoking
      `scripts/context-io.js` directly from its own Bash tool builds its own environment and can set
      `GRUGOPS_HOST_DELIVERED_ROOT`. That is `R-31-15-01`'s already-accepted capability, not a new
      one. Tier 0 closes the tier that decides whether a force push or a deploy pattern runs.
    - **The trust in the delivered channel is exactly the wrapper's freeze plus the decider's hash
      verification, and nothing more.** If either is defeated the channel is worth what the defeating
      capability is worth.
    - **A unix socket is refused at `open(2)` with ENOTSUP on darwin, before either implementation
      has a descriptor to `fstat`.** This plan predicted the `fstat` rule would answer it and the
      corpus measured otherwise; it is recorded as its own decision class in BOTH implementations
      rather than folded into the shape refusal. The Windows leg of the whole FIFO class remains
      `UNKNOWN - verify`, consistent with the standing portability posture.
    - **`R-31-19-03` is not closed and is not closeable from darwin.** Whether
      `canonicalDirectoryPath` answers correctly on a degenerate-directory-identity platform is
      UNMEASURED from here and is not claimed.
  - **Reversibility: costly.** The wrapper's bounded-work property, its named refusal fragment, tier
    0 and the `hosts` field are now the exported contract the corpus, the re-taken freeze and
    `16-context-read-write.md` assert. Reverting restores a PreToolUse guard the round-6 verifier
    measured returning nothing at all, on both streams, for one `mkfifo` at an ordinary agent-writable
    path — and a resolution order whose highest tier accepts any non-empty string.
  - **Recorded in three places that must agree:** here, in the `hooks/hook-entry.ts` header block
    plus the `hostDeliveredRoot` / `canonicalDirectoryPath` docstrings and the
    `agent-factory/workflows/16-context-read-write.md` resolution-order section, and in
    `31-27-SUMMARY.md`'s key-decisions block.

- **D-30 (2026-09-10, gap-closure round 6, wave 2; THE S2 CUTOVER) — the UAT-spec modifier ban is
  decided by SYMBOL IDENTITY from the target repository's own TypeScript checker, not by spelling.**
  Forced by CR-18, CR-21, WR-26, WR-29, WR-30 and IN-15 of `31-REVIEW.md`, by residual `RR-07`, and
  by the six-round pattern behind all of them. Every one of those findings was independently
  reproduced in `31-VERIFICATION.md` round 6 against the committed `.js`.
  - **This decision was opened by a NAMED HUMAN, not by an executing agent.** `31-28-PLAN.md`
    carried a `checkpoint:decision` in front of the deletion for exactly that reason, and the
    choice — `cutover`, plus three sub-decisions — is quoted verbatim in `31-28-SUMMARY.md` before
    any deletion appears in the record.
  - **Which register failed.** Not membership (D-17). Not shape resolution (D-18). Not which arms
    the resolved shape is compared against (D-20). Not the scope the census is asked over (D-27).
    What failed is THE AUTHORITY those questions were put to. Every one of them was a question
    about the TypeScript language — where does this name bind, which declaration does this
    reference reach, what is the declared type of this callback parameter — and every one was
    answered by a predicate hand-authored in the runnable. Round 5 shipped one such fix and
    produced four Criticals inside it. Every member of `UNRESOLVABLE_CALLEE_RESIDUALS` ended with
    the same four words: *without a type checker.*
  - **The decision.** A banned call is one whose callee's resolved symbol is declared by the
    framework ITSELF. `createProgramForTarget` builds a Program from the target's own `typescript`
    — which D-13 already requires the target to ship — and `resolveBannedModifier` asks its checker
    which symbol a callee is. Identity is anchored on the framework's DECLARATION FILES, derived by
    walking its own exports, never on a module-specifier string. The membership question is then
    put to the SAME `isBannedModifierCall` every other arm asks.
  - **Sub-decision 1 (the human's words: "Keep TDZ rule beside identity").** Identity alone loses a
    refusal D-27 measured and closed: `it.skip(...)` followed by a later `let it = 1;` gives the
    checker no symbol at all. The declared-binding census therefore SURVIVES as a second rule, and
    the pairing is bounded — the spelling rule is asked ONLY where identity returned `unresolved`,
    never beside it — and disclosed as a residual of its own with the one direction in which it can
    be wrong.
  - **Sub-decision 2 (the human's words: "Route to could-not-run, exit 2").** A target whose
    `@playwright/test` declarations do not resolve gives every callee no symbol, so the check would
    pass everything. It exits 2 through the D-28 could-not-run boundary with
    `PROGRAM_UNAVAILABLE_REASON` and its own cause, as does a target with no configuration file, an
    unreadable or unparseable one, or a compiler that throws. This also closes `RR-07`: a parser
    lacking predicates was a SILENT degrade to the pre-D-18 rule, and a smaller ban applied without
    saying so is a gate lowering rather than a disclosed limit. The predicates join
    `loadTypeScriptFromTarget`'s validated surface, so their absence is the existing loud skip.
  - **Sub-decision 3 (the human's words: "Yes, fix in 31-28").** `.temp` joins
    `SKIPPED_DIRECTORIES`, so probe residue cannot change what this repository's own gate measures.
  - **Five approximations are DELETED, and two defects inside the sixth are FIXED rather than left
    under identity's cover.** Deleted: `deriveTestInfoParameterNames`'s fixed-index body read
    (CR-21), `isFixtureBindingPosition` (WR-26), `CALLEE_CHAIN_STEP_BOUND` with the recursion in
    `calleeDottedPath` that needed it (`RR-05`), `newCalleeStepBudget` / `CalleeStepBudget`, and
    `DeclaredBinding.suppresses` once its only false value went with the map it protected. Fixed
    inside the surviving census: a function declaration hoists to its enclosing BLOCK, not to its
    enclosing function (CR-18), and `using` / `await using` are BLOCK-SCOPED and are no longer
    classified as hoisting (WR-30). "Another rule catches it" is the reasoning this phase has now
    paid for six times.
  - **The register shrank by MEASUREMENT, from nine members to six.** `RR-01`, `RR-03`, `RR-08` and
    `RR-09` are CLOSED by the checker, each with a corpus row driven at the gate's own entry that
    reported `0 findings`/EXIT=0 before and `1 finding(s)`/EXIT=1 after. `RR-05` was deleted with
    its code. `RR-07` was replaced by the could-not-run member. `RR-04` was REWRITTEN rather than
    removed: `({ test }).test.skip(...)` is now refused because the member's declaration is the
    framework's, while a call on `this` is still undecided. Two members are NEW and disclose what
    the cutover itself costs.
  - **WHAT D-30 DOES NOT ESTABLISH.**
    - **The three residuals kept as named refusals are accepted by design and are not gaps.** A
      member computed from a non-literal expression (`test[name](...)`), an option enabled by
      anything other than the `true` keyword, and the undecided half of a non-identifier head.
    - **The cost and failure modes of creating a Program in a HOST repository are not established.**
      Measured here: 0.03 s on this repository (zero specs derived, so the vacuity floor answers
      before a Program is needed) and 0.27 s on a ten-spec probe repository. A host's own cost is
      its own, and a large repository's is unmeasured.
    - **The installed-package identity route is REASONED, not measured.** CLAUDE.md fixes the dev
      dependency set at `{typescript, vitest}`, so `@playwright/test` cannot be installed here. The
      ambient-declaration route is driven end to end; the `node_modules` route is an open
      `UNKNOWN - verify` carried beside `R-07`.
    - **The Windows leg of everything above is `R-03` and is `31-30`'s to measure.**
    - **A coordinate MOVEMENT 2 surfaced and CLOSED, recorded because it was found rather than
      predicted:** the decline-site derivation's own site MATCHER did not recognise the new
      resolver's shape. `resolveBannedModifier` declines by returning a TAGGED RESULT, not `null`,
      so the matcher derived ZERO sites inside the mechanism that now decides the ban and every
      binding would have passed over it. The matcher was widened to recognise `undefined` and a
      `kind`-tagged object literal, and the derived set grew from 14 to 28 with all 28 bound.
    - **A coordinate MOVEMENT 2 surfaced and DISCLOSED rather than closed:** a spec whose shape
      exhausts the compiler's BINDER blocks the WHOLE run rather than one file, because the binder
      runs over every root file at once. A file's own PARSE stays per-file — the compiler host's
      reader is wrapped — but this is coarser than D-28's boundary. It is a named register member
      with a closure criterion: a way to bind one file at a time, which the compiler's public API
      does not offer today.
  - **Reversibility: ONE-WAY, which is why a human opened the door.** The runnable's public contract
    grew — a target must now provide a `typescript` that can create a Program, and a repository with
    no configuration file BLOCKS a gate that previously passed. The register shrank and
    `browser-uat-recipe.md` quotes the smaller one. Reverting means restoring five hand-authored
    predicates that produced four Criticals in a single round.
  - **Recorded in three places that must agree:** here, in the D-30 header block plus the
    `resolveBannedModifier` / `createProgramForTarget` docstrings in
    `scripts/runnable-ref/uat-spec-integrity.ts`, and in `31-28-SUMMARY.md`'s key-decisions block.

- **D-31 (2026-09-10, gap-closure round 6, wave 3) — a bound is owned by the side that ADMITS, and
  two halves of one action are keyed on ONE variable.**
  - **What forced it.** `CR-19` and `CR-20` of `31-REVIEW.md`, both independently reproduced by
    `31-VERIFICATION.md` round 6 against the committed `scripts/context-io.js`, plus `WR-27`,
    `WR-28` and `IN-14`. And the six-round pattern this phase has now paid for every round: each
    round's fix created the next round's Critical at the coordinate the fix did not reach. Round 5
    gave this module one non-blocking regular-file reader with a size ceiling, and inverted the
    note-then-ledger order at both derived routes. Both closures are real and are re-measured here
    as controls. What each COST is what round 6 found.
  - **Which register failed — and it was neither of the two that had already been re-derived.** Not
    the reader, and not the order. The two questions nobody had asked of this module were **WHICH
    SIDE OWNS A BOUND** and **WHICH VARIABLE KEYS AN ACTION**.
  - **D-31 (1) — a bound is enforced on the side that ADMITS.** The ceiling was wired into
    `readRegularFileOrNull` and into nothing else, so the writer could create an object every one
    of its own readers was required to refuse. Measured: a 9 MiB note returned an id cleanly, landed
    at 9,437,353 bytes, and the immediately following `readContext` for that task returned ZERO
    notes — invisible to `readContext`, `render`, `currentState`, `admit()`'s cross-check and
    `promoteAdmitted`'s liveness clause alike, permanently, on the only memory this project has
    between agents. `writeNoteFile` now measures the composed candidate and refuses BEFORE
    `mkdirSync` and `atomicWrite`; the read side keeps its own refusal for a file it did not write;
    and BOTH read the one exported `NOTE_FILE_MAX_BYTES`. The same reconciliation is applied to
    `AUDIT_LEDGER_MAX_BYTES`, where the read carried 64 MiB and the append carried nothing.
  - **D-31 (2) — two halves of one action are keyed on ONE variable.** `promoteAdmitted` keyed its
    note write on `to` and its GOV-02 event on `repoRoot`. Measured with three real governance
    roots: the finding landed in THIRD's store and its audit record in DEST's ledger. The owning
    repository is now DERIVED from the destination store through one exported authority,
    `governanceRootOf`, which `originStoreIsRootAnchored` also calls — so the origin end and the
    destination end ask one function rather than two spellings of one rule. Both halves key on that
    answer. `repoRoot` still answers the governance dial; it no longer decides where a record lands,
    and a case derives that from the module's own AST rather than by reading.
  - **D-31 (3) — a refusal NAMES the condition that is true.** `CR-19`'s second half is a fabricated
    claim, not a wording problem: an idempotent re-write of identical bytes was refused with
    `note-path-not-a-regular-file` and a message asserting the position "is not absent, or a regular
    file", which `stat` measures false of a 9,437,353-byte regular file. An over-ceiling REGULAR
    file now carries `NOTE_ABOVE_CEILING_CLAUSE`, distinct from the shape clause, with the condition
    carried on a discriminant so a caller names its own clause without matching on message text.
  - **THE REJECTED ALTERNATIVE, NAMED.** The review offers a second disposition for `CR-20`: leave
    `to` unconstrained, and record that an unanchored destination simply gets no audit record. It is
    **REJECTED**. It would make the workflow's sentence true by WEAKENING the guarantee it
    describes — the claim-follows-mechanism move run backwards — and it would leave a human
    disposition sitting in a store whose audit trail cannot be named. A `to` outside a governed
    store is a named decline, `destination-outside-governed-store`, raised before anything is
    written.
  - **`WR-28`, a CORRECTION rather than a closure.** The forged-origin price was stated as "three
    filesystem operations inside this repository, and two outside every repository". Measured per
    position by subtraction: **three** inside a repository carrying a governance CONFIGURATION,
    **two** inside one carrying a version-control marker and NO configuration, **two** outside every
    repository. The variable is the ENCLOSING repository's configuration, not the fact of being
    inside one. All three numbers now appear identically in `T-31-18-01`, in `governanceRootOf`'s
    docstring and in `18-context-compaction.md`, with a case asserting the three agree.
  - **`IN-14` / `R-31-21-02`.** `readRawNotes`' single `catch { continue; }` covered three different
    facts with one silence. Measured before the fix: a file that did not parse, a FIFO at a note
    path, and a vanished entry all produced a zero-length read, zero rendered rows and no diagnostic.
    They are three named arms (`NOTE_SKIP_ARMS`), the skipped entries are counted, and `render`
    reports the count and the arm breakdown in a CONDITIONAL section — a task with nothing skipped
    renders byte-for-byte what it rendered before.
  - **`WR-27` — the axis that exists to catch drift was drifting.** `deriveFsBlockingSites`
    descended only into TOP-LEVEL function declarations, while its own comment claimed a new
    blocking call anywhere in the module turned it red. Measured: a seeded `openSync` inside an
    arrow, inside a class method, and inside the CLI entry block each left the count at 5, while the
    top-level control moved it to 6. The walk now starts at the SourceFile with nearest-named-scope
    attribution, and the three shapes are seeded mirrors each moving the count by exactly one. The
    member set before and after is IDENTICAL, so the fix widened what the axis CAN see without
    re-baselining what it DOES see.
  - **`WRITE_PATH_RESIDUALS`.** Round 5's own closing measurement recorded that the four
    `R-31-21-*` residuals lived only in this document's prose, bound by no test, while the other
    three registers each carry a two-sided binding. They are now an exported register with the same
    interface shape, the same two-sided equality against the dispositions written below, and an
    asserted cardinality.
  - **The write path's residual dispositions, bound to `WRITE_PATH_RESIDUALS` in both directions:**
    - `R-31-21-01` — `atomicWrite`'s `writeFileSync` is a blocking-capable call whose destination
      carries a random UUID no caller can predict. CLOSE: accepted by design, an unaimable
      destination, bounded by the standing same-uid `T-31-25` residual.
    - `R-31-21-02` — the SKIP of a non-regular file inside `notes/` stays, because throwing would
      let one planted FIFO deny `render` and `currentState` for a whole task. The LEGIBILITY half is
      CLOSED by the three counted arms above.
    - `R-31-21-03` — plan 31-21's own premise about `appendFileSync` was measured FALSE and CLOSED
      in that same round; recorded here so the id resolves to its measurement rather than to a gap.
    - `R-31-21-04` — the derivations are SYNTACTIC. The SCOPE half is CLOSED by `WR-27`'s recursive
      walk. The alias and computed-member half is accepted, bounded behaviourally by the FIFO corpus
      and the per-member transposed mirrors; a type-checker-backed resolution is the `S2` cutover
      D-30 landed elsewhere, and applying it here is named as the NEXT MILESTONE's, not this phase's.
    - `R-31-29-01` — NEW this round. A note already ON DISK above the ceiling is refused by every
      reader and by the write side, and is neither deleted nor rotated: the shared verified context
      is APPEND-ONLY, and a writer that removed an over-ceiling note would be destroying evidence to
      tidy a listing. Accept; the condition is legible at every surface.
  - **WHAT D-31 DOES NOT ESTABLISH.**
    - **The destination constraint names a REPOSITORY, not a trustworthy destination.** It does not
      authenticate the destination's CONTENTS, and a caller who can construct a governance root can
      present a destination this route accepts — at the same price, and bounded by the same
      residual, as `T-31-18-01` states for the origin.
    - **It is NOT asked of every other writer's `contextRoot`.** `appendNote` still accepts any
      destination. This is a property of the RE-BINDING route, not of the module, because a
      promotion is what carries a human disposition across a repository boundary.
    - **The ceilings are operational limits, not integrity guarantees.** They bound what a reader
      will read; they say nothing about whether what it reads is true.
    - **The three counted skip arms are reported in `index.md` and nowhere else.** A reader who
      never opens the rendered index still learns nothing — a surfacing question for the workflows.
    - **The Windows leg of everything above is `R-03` and is `31-30`'s to measure.**
    - **A coordinate found rather than predicted, and DISCLOSED:** constraining `to` changed the
      answer for fixtures across three suites that had staged bare temp directories as destinations.
      Two of them were passing for the WRONG REASON and were re-aimed rather than re-baselined —
      `WR-18`'s Test 6a asserted "nothing was appended" against a ledger the route had stopped
      writing to at all, and the round-5 FIFO driver planted its unreadable ledger at `repoRoot`
      rather than at the destination whose ledger the route now names.
  - **Reversibility: costly.** The exported ceilings, the new clauses, the derived destination
    binding and `WRITE_PATH_RESIDUALS` become part of the module's exported contract, of three
    derived axes, and of the sentences `18-context-compaction.md` states. Reverting restores a
    writer the round-6 verifier measured creating a note that disappeared from every reader with no
    diagnostic, and a route it measured splitting a human-disposed finding and its audit record
    across two different repositories — under a workflow sentence stating twice that it cannot
    happen.
  - **Recorded in three places that must agree:** here, in the `NOTE_FILE_MAX_BYTES` /
    `governanceRootOf` / `writeNoteFile` header blocks in `scripts/context-io.ts`, and in
    `31-29-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-32 (2026-09-10, gap-closure round 6, wave 4, plan 31-30)

**Forced by:** four things at once, and two of them are corrections to what the phase's own record
says rather than defects in the code.

1. **`D-28`'s recorded non-establishment, at the one caller that can answer for it.** D-28's own
   "what D-28 does NOT establish" block says a fault that terminates the process WITHOUT UNWINDING —
   an out-of-memory kill, or a signal — is caught by no `try` and is outside both of its boundaries.
   That is true and the runnable cannot fix it: a process killed by a signal runs no `catch` clause.
   `agent-factory/workflows/05-pr-quality-gate.md` step 3 branched on exit codes `0`, `1` and `2` and
   said nothing about a run that produced no exit code at all, so the outcome fell to whatever the
   reading agent's default happened to be.
2. **`R-03` was MIS-SCOPED in the record.** `31-round6-residual-dispositions.md` §F disposes it as
   "Fix via CI — add a `windows-latest` job … ONE job closes R-03". **That job has existed since plan
   `20-04`.** Writing a plan that added it again would have been a fabricated closure, which is the
   one thing this phase's requirement is about.
3. **`R-04` was never a human item.** Its `why_human` described a harness nobody had written — a
   temporary home, an install, a home reshaped to the prior release, a second install, an idempotence
   assertion and an uninstall — not a judgement no machine can make.
4. **The round-5 closing measurement raised two findings it could not repair** (`docs/audit/31-round5-residuals.md`
   §6.3 and §9.4): a `check:diff-disposition` debt grown to 110 with 35 owed by that round's own
   plans, and a harness-instance tally in which two plans of one round both claimed the ninth
   ordinal. A measurement plan that writes source has found a new defect, so both were deferred here.

**Measured before anything was written, in every case.** The arm set derived from
`05-pr-quality-gate.md`'s own prose had cardinality **3**; the runnable spawned against a 40-spec
probe repository and killed mid-run reported `EXIT CODE: null`, `SIGNAL: "SIGKILL"`, zero bytes on
both streams, and again the same under `SIGTERM`; no arm matched. The `windows-latest` leg's six
existing steps were enumerated FROM the workflow file. The debt was re-measured at `112` before a row
was written. The `.temp/` residue predicate was demonstrated inert with a file planted under it —
`git check-ignore -v` naming `.gitignore:19`, `git status --short .temp` printing nothing, a real
listing printing the file.

- **D-32: a result nobody produced is never a result, and a record that names the wrong gap is
  corrected before it is closed.** It makes five sub-decisions.
  - **(1) A run that produced NO exit code is a fourth arm at the CALLER, not a fifth exit code at
    the runnable.** `05-pr-quality-gate.md` step 3 gains a `no exit code` arm: the run died without
    producing one, killed by a signal or by the operating system; it is recorded as could-not-run with
    the signal named; it short-circuits to the blocked terminal result exactly as exit `2` does; and
    it is never read as a pass and never read as a finding. The three existing arms' clause text is
    BYTE-IDENTICAL after the change, asserted as a CONTROL case — the change is an addition to a
    paragraph other gates bind to, never a rewrite of it. The arm set is DERIVED from the prose by
    `scripts/uat-gate-exit-contract.test.ts`, fail-closed on an unresolvable region, and the
    runnable's own reachable return values are derived from its syntax tree and asserted a SUBSET of
    the numeric arms — so a fifth return added later with no caller arm turns the gate red, and a
    return the walker cannot follow is red rather than silently dropped.
  - **(2) A platform claim is a MEASUREMENT or a recorded skip, and never a green row.**
    `scripts/check-platform-shapes.ts` drives the corpus on whatever platform the job runs on and
    PRINTS the shapes it could not construct, with the shape, the position, the platform and the
    reason. It runs on EVERY leg, because a skip list is a DIFFERENTIAL measurement and a list nobody
    has watched be empty is a list nobody has watched. The Windows-scoped step sets
    `GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS`, under which an EMPTY skip list is a FAILURE: a platform
    with no primitive for a named pipe at a filesystem path that reports skipping nothing has reported
    a green about work it did not do. Named pipes on Windows live in the `\\.\pipe\` namespace, so
    the FIFO is POSIX-only and the DIRECTORY is the portable non-regular-file shape.
  - **(3) A human item that describes a harness is a harness.** `R-04` is closed by five cases in
    `install/install.test.ts` driving the real committed installer and uninstaller in throwaway homes.
    The materialized set is compared as a SET with its cardinality, because two installs must produce
    the same MEMBERS and the order `readdirSync` returns them in is not part of the contract.
  - **(4) A debt is paid in the OWNING plan's file, with DERIVED attribution, and the measuring stick
    does not move.** The three owed files are written by this plan and say so in their own first
    section; every row's attribution comes from the gate's own `attributeClauses()` rather than from a
    guess; and a clause whose carrier set does not include the named plan is recorded under "What is
    NOT in this file" with its owner instead. `00-base.md`'s `base_commit` and the watched corpus's
    cardinality are both asserted unchanged by cases, because the gate's own message names moving
    either as clearing a finding by deleting its evidence.
  - **(5) A tally becomes an INDEX by being ONE list, and a prior SUMMARY is never rewritten.**
    `docs/audit/harness-false-result-instances.md` carries one row per instance with contiguous
    ordinals from 1, and the ordinal is READ OFF it. The round-5 collision is ANNOTATED there —
    `31-22-SUMMARY.md` and `31-25-SUMMARY.md` both still say "ninth", and a case asserts they do.
    The gate scans a DERIVED document set with its cardinality asserted and its own vacuity floor
    asserted, so a silently short scan is red rather than green.

  - **What D-32 does NOT establish.**
    - **`R-01` and `R-02` stay OPEN with their `UNKNOWN - verify` markers intact and a named human
      owner.** The attended Chrome lane under real interactive auth needs an attended session with the
      browser extension installed; the `claude auth status --json` predicate under API-key and
      long-lived-token configurations needs credential configurations this box does not have. Neither
      is closable by an agent and neither may be closed by argument.
    - **The WINDOWS REMAINDER.** Everything `check-platform-shapes.js` measured, it measured on
      **darwin**. What a Windows runner reports is NOT measurable from this box and is not claimed:
      whether the FIFO and symlink shapes are skipped there; whether `BROWSER_ABSENT_MARKER`'s two
      probe stages behave identically there (both are resolution-and-existence checks, which is an
      ARGUMENT and not a measurement); whether `PARSER_ABSENT_MARKER` is reached there; and
      `R-31-19-03` itself. This plan supplies the INSTRUMENT and the CI wiring, not the reading.
    - **`R-31-19-03` is SHRUNK, not closed.** Its own register entry says it is measurable only on a
      platform reporting degenerate directory identity and that no agent on darwin may close it by
      argument. The new step prints `home`, its parent, both `dev:ino` values and a `degenerate YES/no`
      verdict; on darwin the verdict is `no`. The Windows verdict, and whether `canonicalDirectoryPath`
      answers correctly where the verdict is `YES`, are the remainder.
    - **The debt is PAID DOWN, not paid off.** 112 → 80. What remains: 65 findings across
      `05-pr-quality-gate.md`, `06-uat-pack.md` and `17-task-claim.md` owned by `31-04`/`31-05`/`31-06`/`31-08`;
      10 in `16-context-read-write.md` owned by `31-15`; and 5 in `18-context-compaction.md` owned by
      `31-29` through a NEW finding this plan raises — a disposition row whose `after` cell packs
      MULTIPLE SENTENCES normalizes to a string matching no clause and covers nothing, silently, while
      reading as work done. That is a CLASS and no derived check exists for it today.
    - **Fourteen unguarded POSIX-only `mkfifo` constructions in this repository's test modules make
      the Windows leg's suite step unreachable-green.** Measured on darwin from the SOURCE; what a
      Windows run then does is NOT measurable from here and is NOT claimed. It is why the two new
      steps sit BEFORE the vitest step. Pre-existing, in four modules this plan does not otherwise
      touch, carried with an owner rather than fixed.
    - **The instance list is a FLOOR, not a total.** A harness that produced a false result and was
      silently corrected leaves no citation and cannot appear in it. And §9.4's claim that `31-23`
      recorded a further unnumbered instance could NOT be substantiated; it is recorded as
      unsubstantiated rather than given an invented row.
    - **No requirement was flipped.** `UATX-02`, `UATX-03` and `UATX-05` are this plan's declared
      requirements and none is marked complete: `.planning/ROADMAP.md` states in its own words that
      only a verification round may flip one.
  - **Reversibility: reversible.** The arm is an addition to a workflow paragraph, the CI steps are
    additions to a job that already existed, the installer cases are cases, and the three disposition
    files plus the instance list are records. Reverting restores a gate branch with no instruction for
    a run that produced no result, a Windows leg whose remainder is an assumption, a human item that
    was always a harness, and a tally that is not an index.
  - **Recorded in four places that must agree:** here; in `05-pr-quality-gate.md`'s exit-code branch
    and `browser-uat-recipe.md`'s pointer to it; in `scripts/check-platform-shapes.ts`'s header block
    and `.github/workflows/ci.yml`'s two new step comments; and in `31-30-SUMMARY.md`'s key-decisions
    block.

#### Gap-closure decision — D-33 (2026-09-11, gap-closure round 7, wave 1, plan 31-32)

**This decision was opened by a NAMED HUMAN, not by an executing agent.** `31-32-PLAN.md` carried a
`checkpoint:decision` rated `one-way` in front of the edit for exactly that reason. The answer,
given on 2026-09-11, verbatim and in full:

> remove-axis

The two options REFUSED were `freeze-manifest` — which the plan itself recommended, and which would
have created `docs/audit/31-review-corpus-manifest.md` as a frozen expected-side authority — and
`derive-both-keep-review`, which would have kept the suite reading `31-REVIEW.md`. Neither was
taken. The executing agent implements the answer, not the recommendation.

**What forced it, re-measured in this session before the decision was presented and again before
this block was written.** The full excluded-e2e suite was RED at the round base. The single failing
case was the review-coverage self-check in `scripts/runnable-ref/uat-spec-integrity.test.ts`, and
the commit that turned it red changed zero source bytes:

```
$ npx vitest run --exclude '**/scripts/e2e/**' scripts/runnable-ref/uat-spec-integrity.test.ts
 FAIL  scripts/runnable-ref/uat-spec-integrity.test.ts > uat-spec-integrity — 31-28 MOVEMENT 1: the
       corpus's denominator is DERIVED, not typed > covers every 31-REVIEW.md finding that names
       this runnable, in BOTH directions
AssertionError: expected [ 'CR-23', 'CR-25', 'IN-16', …(3) ] to deeply equal
                         [ 'CR-18', 'CR-21', 'IN-15', …(3) ]
- Expected: CR-18, CR-21, IN-15, WR-26, WR-29, WR-30
+ Received: CR-23, CR-25, IN-16, IN-17, WR-33, WR-35
 Test Files  1 failed (1)      Tests  1 failed | 324 passed (325)
```

The received set is round 7's review; the expected set is round 5's `CORPUS_COVERAGE` literal.

**Which register failed.** Not the covered side, and not the comparison. What failed is the
ORACLE'S INPUT. `reviewFindingsNamingThisRunnable()` recomputed the expected set by walking
`31-REVIEW.md`'s current `###` headings, and this project REPLACES that document at every
gap-closure round rather than appending to it — `git diff --stat f2404aa..c830eb4` is 605 insertions
and 552 deletions on that file alone. A test whose expected value is recomputed from an artifact
that is rewritten under it has no oracle, and every later plan in round 7 verifies against this same
file.

- **D-33 (1) — the review-to-corpus coverage axis is REMOVED from the continuously-run suite. This
  is a GATE LOWERING, and it is recorded as one.** Stated plainly, with nothing softened: this
  phase had a check that bound its review record to its test corpus on every run, and after this
  plan it does not. Until this change, a finding raised in `31-REVIEW.md` that named
  `scripts/runnable-ref/uat-spec-integrity.ts` and that no corpus row covered turned the suite red.
  After this change nothing in the suite observes that relationship. A finding can now be raised,
  and a round can now close, with no corpus row covering it and with every test green. That is
  strictly less checking than the tree carried before, it was chosen deliberately by a named human
  over two alternatives that preserved the axis, and this project's own doctrine — D-30
  sub-decision 2's sentence, *"a smaller ban applied without saying so is a gate lowering rather
  than a disclosed limit"* — requires it to be written down as a lowering rather than as a cleanup.
  It is written down here as a lowering.

  What is deleted: `REVIEW_MD`, `reviewFindingsNamingThisRunnable()`, the `CORPUS_COVERAGE` literal,
  and the case `covers every 31-REVIEW.md finding that names this runnable, in BOTH directions`.
  No corpus row is deleted and no row id changes.

- **D-33 (2) — the obligation the removal creates is HANDED TO A NAMED PLAN, not dropped.** Plan
  `31-38`, this round's closing measurement, asserts the review-to-corpus coverage ONCE PER ROUND as
  a recorded one-shot: it derives the set of `31-REVIEW.md` findings that name this runnable, states
  which corpus rows cover each, and records any finding with no covering row as an open item with an
  owner. A one-shot taken by a plan is weaker than a check taken on every run — it can be skipped,
  and skipping it leaves no red — and that weakness is the substance of the lowering in (1). It is
  named here so that a later reader can see whether the obligation was met rather than infer it.

- **D-33 (3) — the corpus's row-count floor is kept, and the half of it that the removal took away
  is replaced by a MONOTONE floor rather than by nothing.** The third case of the `31-28 MOVEMENT 1`
  block computed its floor as `CORPUS_COVERAGE`'s row total plus the residual register's length —
  16 rows. Deleting `CORPUS_COVERAGE` would have dropped that floor to 6 in silence, which is a
  second lowering nobody chose. The case instead keeps its derived half (the residual register's
  own length, with its vacuity premise asserted first) and adds `CORPUS_ROW_FLOOR`, the row count
  MEASURED from this file's own AST at this commit. It is a hand-typed number and it is disclosed as
  one. It is not a mirror of a moving set: it can only be wrong by under-claiming, and it turns red
  when a row is deleted, which is the fail-closed direction. The measured value at this commit is
  **33** distinct row ids — more than double the floor the deleted derivation produced. The number
  comes from the AST walk `declaredCorpusRowIds()` performs, not from a grep: a grep over
  `row("…")` reports 34 because two of those occurrences sit inside DOC COMMENTS, and the walk does
  not count a comment. The first draft of this block carried the grep's 34 and is corrected here,
  recorded rather than silently overwritten, because a floor typed one above the measurement is a
  floor that is red on the day it is written.

- **D-33 (4) — the removal is proven STRUCTURALLY, from the file's own syntax tree, not by grep over
  prose.** A case parses `scripts/runnable-ref/uat-spec-integrity.test.ts` with the host TypeScript
  and asserts that no string literal in it equals `31-REVIEW.md`, after asserting its own walk saw a
  non-zero number of string literals. A later edit that re-points any assertion at the per-round
  rewritten review document turns that case red. This is what stops the axis from being re-added by
  accident under a different name.

- **D-33 (5) — a narrowed INPUT BOUNDARY is DISCLOSED rather than reverted (WR-35).** `.temp` stays
  in `SKIPPED_DIRECTORIES`. It was put there by D-30 sub-decision 3 in a named human's own words —
  *"Yes, fix in 31-28"* — and reverting a human's decision inside a fix plan is the move this phase
  forbids. What changes is that the walk now COUNTS what it skipped and the runnable SAYS so: one
  line on stderr naming each skipped directory and its hit count, emitted only when at least one
  entry was skipped. The reason is a property of the constant rather than a note about `.temp`:
  `SKIPPED_DIRECTORIES` is the walk's input boundary, the installer materializes this runnable into
  every host at `tools/grugops/uat-spec-integrity.js`, and both floors in `reportMeasured` are blind
  to it because `expected` and `visited` shrink together. A boundary that narrows a host's
  denominator must be legible at the surface that reports the result.

  **The rejected alternative, named with its reason.** WR-35's first remedy — revert `.temp` from
  `SKIPPED_DIRECTORIES` and keep the closure at the runner, where `vitest.config.ts`'s
  `**/.temp/**` exclude already sits — is REJECTED. It would reverse a named human's sub-decision
  inside an agent-authored fix plan, and it would reopen the harm round 5 measured: a stray spec
  left under `.temp/` by this repository's own probes changes what this repository's own gate
  measures. Disclosure closes the review's finding without touching the human's decision.

- **D-33 (6) — a dead export and a half-deleted sentence are removed rather than carried (IN-16,
  IN-17).** `TEST_INFO_CANONICAL_HEAD`'s only remaining reader was a test asserting its literal
  value, a live assertion over a dead binding; the export and the assertion go together. The
  orphaned `is recorded with` clause in `deriveDeclaredBindings`'s doc block is deleted and the
  D-30 (5) paragraph stands as its own sentence. Neither touches a decision. Both are recorded as
  hygiene with the review's own citation.

- **What D-33 does NOT establish.**
  - **It does not establish that the coverage relationship holds.** It establishes only where the
    relationship is now asserted — once per round, by `31-38` — and that nothing asserts it
    continuously. At the moment this block is written, round 7's six findings naming this runnable
    (`CR-23`, `CR-25`, `IN-16`, `IN-17`, `WR-33`, `WR-35`) are covered by no corpus row, because
    their fix plans have not run. That is the state the removed case was reporting.
  - **It does not make the deleted case's complaint false.** The case was correct that the sets
    differed. What was wrong was the instrument, not the reading.
  - **`CORPUS_ROW_FLOOR` is a floor, not a coverage claim.** A corpus can satisfy it while covering
    nothing a review raised. It bounds deletion; it does not bind content.
  - **The disclosure line makes no claim about what a host SHOULD skip.** It reports what this
    runnable did skip. Whether `.temp` belongs in a kit-shipped boundary at all is left open, with
    WR-35's own first remedy recorded above as the rejected alternative rather than as a closed
    question.
  - **The Windows behaviour of the disclosure line is not measured.** It is a stderr write with no
    path separator in it, which is an ARGUMENT and not a measurement. It joins the phase's standing
    Windows remainder.
  - **No requirement was flipped.** `UATX-01` through `UATX-06` stay unchecked in
    `.planning/REQUIREMENTS.md`, the Phase 31 checkbox stays unchecked in `.planning/ROADMAP.md`,
    and every traceability row still reads `Gaps Found`. Only a verification round may flip one.

- **Reversibility: ONE-WAY for (1), reversible for the rest.** Restoring the deleted axis means
  restoring a test whose expected set is recomputed from a document this project replaces every
  round — a test that is RED at every round boundary by construction, which is the state measured at
  this round's base. The disclosure line is additive and emitted only on a non-empty skip set; the
  two deletions are hygiene.

- **Recorded in four places that must agree:** here; in the `SKIPPED_DIRECTORIES` comment block and
  the disclosure emission site in `scripts/runnable-ref/uat-spec-integrity.ts`; in
  `agent-factory/checklists/browser-uat-recipe.md`'s boundary list, with its row in
  `docs/audit/29-style-dispositions/31-32.md`; and in `31-32-SUMMARY.md`'s key-decisions block.

#### Gap-closure decision — D-34 (2026-09-11, gap-closure round 7, wave 2, plan 31-33)

- **What forced it.** `CR-22` and `CR-24` of `31-REVIEW.md`, both independently reproduced by
  `31-VERIFICATION.md` round 7 against the committed `scripts/context-io.js`, and both re-reproduced
  in this plan's own scratch before any source was touched. And the seventh instance of this phase's
  recorded generator: the round-6 fix created the round-7 Critical at the coordinate the fix did not
  reach.
- **Which register failed — and it was neither the rule nor the order.** `D-31 (2)`'s rule and
  `D-24`'s order are both correct and are both re-measured here as controls. The two questions
  nobody had asked were **WHERE a property claimed of a FUNCTION is installed** and **WHICH SET a
  property claimed of a SET is asserted over**.
- **D-34 (1) — a property claimed of a FUNCTION is established at the function's ENTRY.**
  `31-29` installed `destinationRoot = governanceRootOf(to)` nineteen lines BELOW
  `promoteAdmitted`'s own human-stamp fall-through, so the ORDINARY path through that function —
  a note carrying no `human:NAME` stamp — RETURNED two lines above the derivation and keyed its note
  write on `to` while its GOV-02 event went to `repoRoot`. Reproduced here with three real
  governance roots, each asserted `governanceRootOf(store) === root` before any result was read:
  THIRD held the note with no ledger line, DEST held the ledger line with no note. The derivation
  and its named decline are now the FIRST thing the body does after `assertSafeTask`, there is no
  return between the function's first line and them, and the fall-through carries the derived root
  into the full-admission route. `admitAndAppend`'s gated branch — the other route
  `18-context-compaction.md` names by hand, and the one the review measured splitting a
  human-disposed finding from its own audit record — derives the same answer at ITS entry and
  appends there instead of at `repoRoot`.
- **WHAT THE CLAUSE ORDER COST, STATED RATHER THAN SLIPPED IN.** `destination-outside-governed-store`
  now precedes every other decline, including `unreadable-governance-config` and
  `origin-outside-trusted-store`, which `WR-25` deliberately ordered. The derivation cannot sit at
  the entry while its own decline sits eight clauses down, and an entry-level property is worth more
  than a clause adjacency: a caller told about its destination is told the truth about the one input
  every path below writes into, and a caller who fixes a source id would meet this clause anyway.
  The order is asserted from the route's own parsed body, and the new adjacency carries its reason
  in `EXPECTED_DECLINE_ORDER`'s docstring.
- **D-34 (2) — a property claimed of a SET is asserted over a set DERIVED from the module's AST.**
  `CR-24`'s half is the same shape one register over: `readRawNotesWithSkips` discarded the
  `ReadPositionRefusal.condition` discriminant `D-31 (3)` created for exactly that caller, and
  hand-labelled three conditions with one arm. See plan `31-33`'s task 2 for the arm set's binding.
- **THE REJECTED ALTERNATIVE STAYS REJECTED.** An unanchored destination is a NAMED DECLINE, never
  a promotion that quietly records nothing. `D-31`'s reason is unchanged and is restated at the
  clause: making a workflow sentence true by weakening the guarantee it describes is the
  claim-follows-mechanism move run backwards.
- **A SECOND REJECTED ALTERNATIVE, WITH THE NUMBER THAT REJECTED IT.** The review's own fix asks for
  a ledger-root parameter on `appendNote`, `admitAndAppend` AND `admit`. `admit()` is byte-frozen
  (`ADMIT_FROZEN_SHA256`) and takes ONE root for both its governance-dial read and its GOV-02
  append, so routing the record through a derived root necessarily routes the DIAL through it too.
  MEASURED rather than argued: that change turns 63 existing cases RED on the DIAL, not on the
  ledger, because they use `repoRoot` as the dial seam over a governed store. A second measurement
  ruled out the adjacent alternative of refusing an ungoverned `contextRoot` at those two writers:
  the suite presents one to `appendNote` 121 times and to `admitAndAppend` 26 times, and refusing
  them reverses `D-31`'s deliberate decision that the destination constraint is the RE-BINDING
  route's property and not the module's. Both are recorded here with their numbers rather than taken
  silently, and the exposure that remains is `R-31-33-01`.
- **The write path's residual dispositions, bound to `WRITE_PATH_RESIDUALS` in both directions:**
  - `R-31-33-01` — every GOV-02 append reached THROUGH `admit()` is keyed on `admit()`'s one root
    parameter, so a direct caller that deliberately hands `appendNote` — or `admitAndAppend`'s
    non-gated branch — a `contextRoot` under one repository and a `repoRoot` under another still
    splits the two halves. ACCEPT and DISCLOSE, driven by its own case. What would close it is a
    deliberate unfreeze of `admit()` giving it a ledger root distinct from its dial root, re-based
    with the reason written at the freeze — the shape that freeze has been re-based under five
    times before.
  - `R-31-33-02` — `CR-22`'s fourth position. With NO arguments the note lands in the KIT's own
    store and the GOV-02 event under the HOST repository. MEASURED on this tree: the two coincide
    on this box, so the split is NOT observable here, and under the shipped shared-install model
    they are different directories. ACCEPT and DISCLOSE: closing it means DECIDING which repository
    the default names, and either answer reverses a prior decision with a written reason —
    deriving the dial root from the kit store reverses `WR-10`, and re-pointing
    `DEFAULT_CONTEXT_ROOT` at the host repository moves every READER's default with it.
- **WHAT D-34 DOES NOT ESTABLISH.**
  - **It does not make every GOV-02 append follow a derived root.** Three of them do — the two arms
    of `promoteAdmitted` and `admitAndAppend`'s gated branch, each an `appendAuditLedger` call this
    module can aim. The appends inside `admit()` do not; that is `R-31-33-01`.
  - **It does not close the DEFAULT split.** That is `R-31-33-02`, measured and published.
  - **It does not authenticate a destination's CONTENTS**, at the same price and bounded by the same
    residual `D-31` already stated for the origin.
  - **The Windows leg of everything above is `R-03`** and remains this phase's standing remainder.
- **D-34 (3) — the arm set is bound to the authority that raises the conditions.** `CR-24` and the
  Skipped-entries finding. `D-31 (3)` put the condition on the error so a caller could name its own
  clause WITHOUT re-deriving the fact; `readRawNotesWithSkips` — the caller `IN-14` was raised
  about — discarded the discriminant and hand-labelled every catch `not-a-regular-file`. Reproduced
  against the committed `.js`: an EACCES regular file, a FIFO and an 8,388,609-byte REGULAR file all
  rendered under one arm, and the third row's own detail text ("It IS a regular file; what
  disqualifies it is its size and nothing else") contradicted the arm it was filed under — on the
  ONE artefact a human triaging an admitted-then-unreadable note reads. `READ_POSITION_CONDITIONS`
  is a runtime constant now, `ReadPositionCondition` is derived FROM it, and `NOTE_SKIP_ARMS`
  SPREADS it: `["unparseable", "unopenable", "not-a-regular-file", "above-ceiling", "vanished"]`.
  The catch reads the arm from the discriminant with ONE explicitly named fallback. The `vanished`
  docstring names both conditions that reach it — a concurrent delete AND a dangling symlink's
  ENOENT on its target.
- **AND THE SUITE HAD ENCODED THE BUG.** The case titled "the three arms produce three DISTINCT
  observable results" EXPECTED two of its three plants to share one arm, so its distinctness
  assertions compared `unparseable` against `not a regular file` and never compared the pair that
  had actually collapsed. A distinctness claim that omits the colliding pair is the assertion the
  collision hid behind. The full ordered cross product over all five arms is asserted now, over the
  ARM CELL rather than the whole row — comparing whole rows PASSES on the pre-fix module, because
  two conditions under one arm still carry different detail text.
- **THE WORKFLOW SENTENCE IS CORRECTED BY MOVING THE MECHANISM.** `18-context-compaction.md`'s two
  ledger sentences — "The append precedes the write, and both steps name the same derived
  repository. So the destination never holds a human-disposed finding with no ledger line." — are
  NOT reworded. They were measured false of `admitAndAppend` and are true of it now because D-34 (1)
  moved the derivation to that route's entry. What the paragraph gains is what it did not yet
  state: that BOTH named routes derive it, that the derivation sits above every branch, that the
  re-binding route refuses an ungoverned destination on every path, what the caller's repository
  argument answers, and — as a disclosure rather than a guarantee — where an ordinary admission
  carrying no human disposition still records itself. Every changed clause carries a row in
  `docs/audit/29-style-dispositions/31-33.md`.
- **AMENDMENT — D-31's `NOT ESTABLISHED` bullet, corrected rather than left contradicted.** D-31
  recorded: "It is NOT asked of every other writer's `contextRoot`. `appendNote` still accepts any
  destination. This is a property of the RE-BINDING route, not of the module." That bullet STANDS
  as to the DECLINE — `appendNote` still accepts any destination, and `R-31-33-01` records the
  measured reason (121 call sites) it was not changed. It is AMENDED as to WHERE the re-binding
  route's own property holds: D-31 left it true of one arm, and D-34 makes it a property of the
  whole function, established at its entry, with no return between the function's first line and
  the derivation. The two decisions do not disagree; D-34 narrows what D-31's bullet was actually
  about.
- **Reversibility: costly.** The entry-level derivation, the moved clause order, the grown
  `NOTE_SKIP_ARMS` and the two new residuals become part of the module's exported contract and of
  four derived axes. `NOTE_SKIP_ARMS` is read by a rendered artefact, so reverting changes
  `index.md` for any task with a skipped entry — back to a table that points a human at a FIFO when
  the cause is a permission bit or a size ceiling. Reverting the rest restores a route the round-7
  verifier measured splitting a note and its own audit record across two repositories on the
  ORDINARY path through it, under a workflow sentence stating twice that it cannot happen.
- **Recorded in four places that must agree:** here; in the `promoteAdmitted` entry block, the
  `NOTE_SKIP_ARMS` docstring and the `WRITE_PATH_RESIDUALS` entries in `scripts/context-io.ts`; in
  `agent-factory/workflows/18-context-compaction.md`'s ledger paragraph, with its rows in
  `docs/audit/29-style-dispositions/31-33.md`; and in `31-33-SUMMARY.md`'s key-decisions block.

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

#### Gap-closure decision — D-35 (2026-09-11, gap-closure round 7, wave 3, plan 31-34)

- **What forced it.** `CR-23` of `31-REVIEW.md`, in BOTH of its instances, independently reproduced
  by `31-VERIFICATION.md` round 7 against the committed `scripts/runnable-ref/uat-spec-integrity.js`
  and re-reproduced in this plan's own scratch before any source byte was touched. `D-30 (2)` made
  the identity answer `foreign` TERMINAL — `banPath = identity.kind === "framework" ? identity.path
  : identity.kind === "foreign" ? null : spelled` — and `@playwright/test` declares no top-level
  `describe`, so a REAL `describe` is always `foreign`. The head `BANNED_MODIFIER_HEADS` retains for
  "another framework's bare `describe` imported into a spec file" was dead for exactly that case.
  The same held for `BANNED_EXACT_PATHS = ["expect.soft"]` whenever `expect` came from another
  assertion library.
- **Which register failed — and it was neither membership nor resolution.** The constants were
  correct. The resolver was correct. What failed was the WIRING between the identity answer and the
  spelling rule, and the fact that a published ban member became UNREACHABLE without anyone saying
  so. The recipe went on publishing `describe` as a banned head, quoted by value from the exported
  constant, over a mechanism that could no longer reach it.
- **Why the suite was green over a ban that was off.** The corpus drove `describe.skip` where
  `describe` is UNDECLARED — the one spelling the identity route declines anyway, so the spelling
  rule answered and the row refused. Re-measured here at the entry: `1 finding(s)`, `EXIT=1` — and
  `tsc --noEmit` **exit 2** on that same file (`TS2593: Cannot find name 'describe'`). The row that
  kept the suite green rests on a construct the language refuses to compile. A corpus that drives
  the spelling a head does NOT exist for is a denominator that cannot observe the property it claims.

- **THE HUMAN'S ANSWER, VERBATIM (2026-09-11).**

  ```
  split-foreign-by-provenance
  ```

  A named human answered the `checkpoint:decision` this plan's Task 1 put in front of the edit,
  refusing the two options below.

- **THE TWO OPTIONS REFUSED, WITH THEIR MEASURED CONSEQUENCES.**
  - `union-head-declared-exemption` (Option A — the review's own literal sketch: consult the
    spelling rule whenever identity did not decide a FRAMEWORK ban, re-narrowing WR-26 to heads the
    framework DOES declare). **MEASURED SHORTFALL, which is why it was presented as closing one of
    two instances:** `@playwright/test` does not declare `describe`, so the `describe.skip` instance
    closes — but it DOES declare `expect`, so under a head-declared exemption the
    `expect.soft`-from-another-assertion-library instance stays OPEN at exit 0. Its literal form
    additionally false-refuses a project's own `./helpers` module exporting a binding named
    `describe` with a `skip` member.
  - `delete-retained-members` (Option C — abandon the retention in the open: `describe` leaves
    `BANNED_MODIFIER_HEADS`, `expect.soft` leaves `BANNED_EXACT_PATHS`, both leave the recipe). A
    disclosed gate LOWERING, and one that would also remove today's live refusal on the
    undeclared-`describe` row.

- **THE DISCRIMINANT IS THE EXECUTOR'S CHOICE, NOT THE HUMAN'S, AND IS RECORDED AS SUCH.** The human
  named the OPTION and named no discriminant. Option B's plan text sketched one — "imported from a
  module versus declared locally" — and that literal reading was MEASURED WRONG in this session: it
  false-refuses a project's own `./helpers.ts` exporting a head-named binding, which is an import.
  An ambient-block-only reading was measured wrong in the other direction: it misses the
  declaration-FILE shape a `node_modules` package or a hand-written `types/*.d.ts` produces. The
  form implemented is the one that got every probed arm right:

  > **`foreign` splits by DECLARATION PROVENANCE.** A resolved non-framework callee is
  > `foreign-declared` when ANY of its declarations comes from another module's DECLARATION SURFACE
  > — a `declare module "…"` block, or a declaration file (`.d.ts`). It is `foreign-local` when
  > every declaration is in the program's own authored source. `foreign-declared` hands the call to
  > the spelling rule; `foreign-local` does not, which is what keeps WR-26's false refusal
  > impossible rather than merely narrower.

  A symbol declared in several places, one of them a declaration surface, is read as
  `foreign-declared` — the refusing direction, the same way declaration merging into the framework's
  own type is read.

- **THE PROBE TABLE THE DISCRIMINANT WAS CHOSEN ON.** Every arm driven at the runnable's own entry
  against an equipped target, each with its own `tsc --noEmit` exit code, before and after:

  | Arm | Shape | Before | `tsc` | After | Correct? |
  |---|---|---|---|---|---|
  | ambient module block | `declare module "other-framework"` exporting `describe.skip` | `0 findings` EXIT=0 | 0 | `1 finding(s)` EXIT=1 | refuse |
  | ambient module block | `declare module "other-assert"` exporting `expect.soft` | `0 findings` EXIT=0 | 0 | `1 finding(s)` EXIT=1 | refuse |
  | declaration FILE | `types/other-framework.d.ts`, relative import | `0 findings` EXIT=0 | 0 | `1 finding(s)` EXIT=1 | refuse |
  | local source module | `./helpers.ts` exporting `describe.skip` | `0 findings` EXIT=0 | 0 | `0 findings` EXIT=0 | accept |
  | local binding (WR-26) | `helper(1, function (a, it) { return it.skip(a); })` | `0 findings` EXIT=0 | 0 | `0 findings` EXIT=0 | accept |
  | undeclared | bare `describe.skip`, no declaration at all | `1 finding(s)` EXIT=1 | **2** | `1 finding(s)` EXIT=1 | refuse |
  | framework | `test.skip` from `@playwright/test` | `1 finding(s)` EXIT=1 | 0 | `1 finding(s)` EXIT=1 | refuse |

- **WHAT D-35 DOES NOT ESTABLISH.**
  - **It does not decide a head the spec file hand-declares for itself.** `declare const describe: {
    skip(…): void }` written INSIDE a `.ts` spec is neither a `declare module` block nor a
    declaration file, so it stays `foreign-local` and is ACCEPTED. MEASURED in this session: `0
    findings`, `EXIT=0`, `tsc --noEmit` exit 0 — a live, type-checking shape. It is not closed here
    because the shape is structurally identical to WR-26's own control — both resolve to a
    `PropertySignature` of an anonymous type literal inside a `declare` statement — so any predicate
    that refuses one refuses the other. It is DISCLOSED as a register member rather than absorbed.
  - **It does not exempt a project's own `.d.ts`.** A repository that hand-writes
    `types/anything.d.ts` declaring a binding named `test` or `describe` with a banned tail is now
    REFUSED. That is a widening in the refusing direction and it is stated rather than discovered.
  - **It does not measure the installed-package route.** `@playwright/test` cannot be installed here
    (CLAUDE.md fixes the dev dependency set), so the `node_modules` shape remains the open
    `UNKNOWN - verify` carried beside `R-07`. The declaration-FILE arm this decision adds is the
    same arm that route would travel, and it IS measured — on a `.d.ts` inside the target's own
    program rather than under `node_modules`.
  - **It does not move a requirement checkbox, a traceability row or the phase checkbox.** Only a
    verification round may do that.
  - **The Windows leg is `R-03`** and remains this phase's standing remainder.

- **Reversibility: ONE-WAY.** The shipped runnable's promise about a whole family of constructs
  changes, and `browser-uat-recipe.md` publishes that promise to every host the installer
  materializes into. Reverting restores a state in which a `describe.skip` group or an
  `expect.soft` assertion, imported from any DECLARED non-Playwright module, is accepted at exit 0
  by a gate whose own documentation says otherwise.

- **The three places that must agree, asserted in both directions.**
  1. `resolveBannedModifier`'s published identity vocabulary and the `banPath` wiring that CONSUMES
     it — `ModifierIdentity`'s arms are a runtime constant and the consumer reads the arm from that
     constant rather than from a hand-typed literal.
  2. `BANNED_MODIFIER_HEADS` / `BANNED_EXACT_PATHS` and `agent-factory/checklists/browser-uat-recipe.md`'s
     published ban set — already asserted equal in both directions, now joined by a second binding:
     every published head must carry a REFUSING corpus row, keyed through the `row(…)` marker.
  3. `UNRESOLVABLE_CALLEE_RESIDUALS` and the recipe's boundary list — verbatim, in both directions,
     including the two members this decision rewrites and adds.

#### Gap-closure decision — D-36 (2026-09-11, gap-closure round 7, wave 4, plan 31-35)

- **What forced it.** `CR-25` of `31-REVIEW.md`, independently reproduced and bisected TWICE — by
  `31-REVIEW.md`'s own code review and by `31-VERIFICATION.md` round 7's Behavioral Spot-Check row 6
  — and re-reproduced in this plan's own scratch against the committed `.js` before any source byte
  moved. `frameworkSurface` walks the framework's declared surface breadth-first under
  `SURFACE_NODE_BOUND = 4096` and `SURFACE_DEPTH_BOUND = 6`, and when it reached either it returned a
  PARTIAL surface with no signal. A declaration file the walk never reached is absent from
  `ctx.frameworkFiles`, so `resolveBannedModifier` answers `foreign` for every call on it — accept.
  The function's own comment claimed the bounds mean a large surface `costs a stated amount rather
  than an open one`. The amount was the ban.

- **Which register failed.** Not membership, not resolution, and not the identity vocabulary D-35
  had just split. What failed was the DIRECTION a bound degrades in, and the fact that a bound which
  had been reached was reported NOWHERE: neither `UNRESOLVABLE_CALLEE_RESIDUALS` nor the recipe's
  boundary list mentioned either bound. This is D-30 (4)'s own doctrine for RR-07 — *a smaller ban
  applied without saying so is a gate LOWERING rather than a disclosed limit* — failing inside the
  mechanism that replaced RR-07.

- **THE DECISION.** A BOUND THAT IS REACHED IS A CHECK THAT DID NOT RUN. The walk records which
  limit stopped it; `createProgramForTarget` turns that into `ok: false` with an exported cause
  (`SURFACE_TRUNCATED_CAUSE`) naming both bound values and the one reached; the run takes the
  EXISTING could-not-run boundary at exit 2. No new exit code and no second boundary — D-28 holds
  the `{0,1,2}` contract at two decided boundaries and this is a new CAUSE at one of them.
  Three refinements are part of the decision rather than incidental to it:
  1. **A LEAF at the bound is not a truncation.** A node with no properties and no call signatures
     cut nothing off. Without this, every run that merely reached a `void` return at depth six would
     be a could-not-run. The predicate fails CLOSED: a checker that throws for either question
     answers "expandable".
  2. **The walk stops at the STANDARD LIBRARY's edge.** See the measurement below. Without this the
     decision above would have been unshippable.
  3. **The walk's SEEDING failure joins the same record.** A checker that throws from
     `getExportsOfModule` used to return an empty surface through a bare `catch`; it is now the
     third arm of one truncation vocabulary rather than the one silent early return left behind.
  4. **A standard-library CONTAINER is descended into by its TYPE ARGUMENTS, never by its own
     members.** This refinement exists because refinement (2) CREATED a regression and this plan's
     own adversarial probe measured it — see below. A checker that does not publish
     `getTypeArguments` is the fourth truncation arm, `container-unreadable`, rather than a quietly
     narrower walk.

- **THE MEASUREMENT THAT CHANGED THE SHAPE OF THE FIX, and it was not in the plan.** Before any
  narrowing, over the transcribed surface this repository itself ships:

  ```
  frameworkFiles = 17   — SIXTEEN of them node_modules/typescript/lib/*.d.ts
  typePaths      = 79
  deepest path   = expect().toHaveText().__@toStringTag@52.length.toString   — SIX links
  ```

  The depth bound was therefore ALREADY being reached on an ORDINARY run, by walking `String`,
  `Number`, `Array` and `Promise`. The headroom this plan set out to measure was not thin, it was
  ZERO, and a truncation route added without refinement (2) would have turned EVERY run into a
  could-not-run at exit 2. After the narrowing: **1 framework file, 17 recorded paths, deepest at
  depth 2** — against bounds of 4096 and 6.

- **THE RECONCILED BOUNDARY NUMBER, WITH ITS CONSTRUCTION.** The construction is written into
  `uat-spec-integrity.test.ts`'s own block header and is: one `interface GrugDeep<i>` per FILE, an
  augmenting file that hangs the chain off the framework's `Test` type, and a LOCAL-ALIAS head
  (`const t = test`). In THIS construction the pre-fix flip pair is **7 hops refused / 8 hops
  accepted at exit 0 with ZERO bytes on stderr**, `tsc --noEmit` exit 0 for both — which is
  `31-VERIFICATION.md` row 6's number, not `31-REVIEW.md`'s 6/7. Both prior measurements are
  correct about their own layouts and both demonstrate the same defect; neither prior document is
  edited. The difference is WHERE the last hop's `skip` is declared: a `skip` sharing a file with
  the interface that owns it is reached when that interface is VISITED (depth ≤ 6), one hop later
  than a `skip` whose file is reached only when its owner is EXPANDED (depth < 6). The confound both
  prior rounds name is re-established BY MEASUREMENT here: the same chain with every hop in ONE file
  refused at every length to eleven hops, because `frameworkFiles` holds FILES.

- **A SECOND RECONCILIATION THE PLAN DID NOT ANTICIPATE.** With a plain `test` head, CR-25's filed
  spelling no longer reproduces at this base: measured at chain lengths 6 through 9, `1 finding(s)`
  / `EXIT=1` at EVERY length. D-35's `foreign-declared` arm asks the SPELLING rule, and
  `test`…`skip` is banned on head and tail alone, so the spelling rule backstops the identity
  failure for that spelling. The defect was MASKED, not closed — the alias-headed construction is
  the same defect with the mask removed, and it is a corpus row.

- **THE PROBE OF THIS PLAN'S OWN FIX, AND THE REGRESSION IT FOUND.** Three adversarial probes were
  run against the fix before it was called done, each asking one question: can a framework
  declaration be left UNREACHED without the walk reporting a truncation?
  - **A framework type behind a standard-library container** (`Held[]` on the framework's own
    `Test`). REPRODUCED: accepted at exit 0 with the narrowing in and `tsc --noEmit` exit 0 — and
    REFUSED at exit 1 by the artifact at this plan's base. **A regression this plan created**, in
    the direction that turns a ban off, predicted by the member that disclosed it and then measured
    rather than left as prose. CLOSED by refinement (4), and kept closed by a corpus row.
  - **A framework member behind an INDEX SIGNATURE.** REPRODUCED at exit 0 — and reproduced
    identically at this plan's base, so it is pre-existing. NOT closed: it is the register member
    named above, with a driven row.
  - **The walk's inner catches** (`getPropertiesOfType` or `getTypeOfSymbolAtLocation` throwing).
    Read rather than reproduced: a checker that throws there is a compiler fault this repository
    cannot synthesise. They remain a silent-subtree shape, and they are recorded as an open item for
    the next verification round rather than claimed closed.

- **The operational price, named rather than discovered.** A target whose framework surface is deep
  enough to leave anything unexpanded at the bound now BLOCKS a gate that previously passed. In the
  probe family the refusing band moved down from "seven hops refused" to "five hops refused, six
  and beyond could-not-run". That price is exactly what D-30's reversibility paragraph already
  accepted for the could-not-run route, and it is the fail-closed direction UATX-05 names.

- **WHAT D-36 DOES NOT ESTABLISH.**
  - **It does not measure the INSTALLED package's surface.** `@playwright/test` cannot be installed
    here (CLAUDE.md fixes the dev dependency set at `{typescript, vitest}`), so whether a real
    released Playwright surface approaches either bound is an open `UNKNOWN - verify`, carried
    beside the installed-package member. The headroom numbers above are measurements of the
    TRANSCRIBED surface this repository ships and of nothing else. No claim is made about the
    magnitude on the `node_modules` route.
  - **It does not reach a framework member behind an INDEX SIGNATURE.** The walk reads each type's
    declared PROPERTIES and an index signature is not one, so a `skip` behind
    `[key: string]: Modifier` is outside the surface at ANY depth: no bound is reached and nothing
    is truncated. MEASURED at `0 findings` / `EXIT=0` on a file that type-checks clean, and
    MEASURED IDENTICALLY against the artifact at this plan's base — a pre-existing remainder rather
    than a cost of this decision. It is a named register member with a closure criterion and its own
    corpus row, and the row asserts the ACCEPT so the disclosure cannot quietly stop being true. The
    `test`-headed and `describe`-headed spellings are still refused by the spelling rule, which
    bounds it.
  - **It does not raise either bound.** Raising a bound is not a substitute for reporting that it
    was reached, and no bound value moved in this plan.
  - **It does not move a requirement checkbox, a traceability row or the phase checkbox.** Only a
    verification round may do that.
  - **The Windows leg is `R-03`** and remains this phase's standing remainder.

- **Reversibility: COSTLY, one-way in the blocking direction.** The runnable's public contract grows:
  a target whose framework surface exceeds a bound now blocks. Reverting restores a bounded walk
  that turns the ban off past its own bound with zero bytes of diagnostic — and, because refinement
  (2) travels with it, restores a walk that spends its whole depth budget inside the compiler's
  standard library.

- **The three places that must agree, asserted in both directions.**
  1. `frameworkSurface`'s truncation vocabulary and the cause `createProgramForTarget` returns —
    `SURFACE_TRUNCATION_REACHED` is one record, `SURFACE_TRUNCATION_ARMS` is derived from it, and an
    arm without a sentence does not compile.
  2. `UNRESOLVABLE_CALLEE_RESIDUALS` and the recipe's boundary list — verbatim, in both directions,
    now including the two bounds and the narrowing's cost. Watched RED in BOTH directions at this
    plan's close (a member with no bullet; a bullet with no member) and reverted.
  3. The published bounds and the corpus — the boundary PAIR is driven at the runnable's own entry,
    refused just under and could-not-run just over, so the direction cannot regress to an accept.

#### Gap-closure decision — D-37 (2026-09-11, gap-closure round 7, wave 5, plan 31-36)

- **What forced it.** `WR-31`, `WR-32` and `IN-18` of `31-REVIEW.md`, each re-driven in this plan's
  own scratch against the committed artifacts before any source byte moved.
  - `WR-31`: `scripts/check-platform-shapes.ts`'s own header states that the CONTROL at each
    position "must NOT be refused by the not-a-regular-file clause" and that "a run that refuses
    everything proves nothing". The implemented check asked only whether one refusal CLAUSE STRING
    was absent, and `d.verdict` was computed and never asserted. Re-measured here with the module's
    own plants: at the `DECIDER_MANIFEST` position the CONTROL drew
    `Blocked (fail-closed): the grugops hook module "scripts/checkpoints.js" does not match the
    frozen manifest`; at the note position it drew `context-io.writeNoteFile: refusing to write —
    the destination already holds a DIFFERENT note under id "…"`. The gate printed
    `not refused (correct)` for **all four** control rows and `ALL CHECKS PASSED`, exit 0.
  - `IN-18`: `const staged = forced.has(shape.name) ? { ...plant(shape), made: false } : plant(shape)`
    ran `plant(shape)` for a shape it had already decided to skip. Observed from outside the module
    with every shape forced absent: **8 position plants appeared under the scratch root** (four
    `grugops-shape-note-*`, four `grugops-shape-hook-*`, each hook mirror a whole import-closure
    copy) before the results were discarded.
  - `WR-32`: `bodyImplementsDiscipline` recognised the refusal by ONE syntactic shape and both
    mutation mirrors were written in that shape. The predicate transcribed verbatim and applied to
    three semantically identical spellings answered
    `{"nb":true,"ds":true,"rf":false,"th":true,"all":false}` for `st.isFile() === false`, for
    `st.isFile() !== true` and for a negated `if`/`else` with the `throw` in the else branch — `rf`
    false in every one, so none joins `IMPLEMENTING` and the cardinality assertion stays green at 2.
    Separately, an untracked implementation written into the real `scripts/` tree was absent from
    `candidateSources`'s 128-file census while present on disk.

- **Which register failed.** Not either harness's RULE. `check-platform-shapes` drives the right
  positions and `nonblocking-reader-parity` binds the right two implementations; both rules are
  unchanged by this plan. What failed is whether each harness can OBSERVE the property it reports
  on — a control that asserts an ABSENCE, and a predicate whose mirrors are written in its own
  spelling. This is the class `docs/audit/harness-false-result-instances.md` records fourteen times,
  and row 13 records the disagreement between a control and a refusing shape as exactly the signal
  that caught a dropped position. These two surviving positions could not produce that signal.

- **THE DECISION, IN TWO PARTS.**
  1. **A CONTROL ASSERTS ITS POSITION'S ORDINARY OUTCOME POSITIVELY, AND ITS RED PATH IS DRIVEN.**
     Each position carries a `controlVerdict` — `write` at the note path, `answered` at the manifest
     path — and the control asserts the measured verdict EQUALS it; the clause-absence check is kept
     as an additional condition rather than as the only one. The staging is corrected so that
     verdict is REACHABLE: the manifest position plants the bytes of the module `DECIDER_MANIFEST`
     names, and the note position plants the note the driver is about to write, composed by driving
     the real writer into a throwaway store rather than by restating its format. Because the wrapper
     exits 0 both when it passes the decider's decision through and when it fail-closes,
     `status === 0` is not the discriminant: the verdict classifier reads the wrapper's own
     fail-closed marker, and the premise that the marker OCCURS in the committed artifact is
     asserted before the classifier's answer is read. `GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL`
     restores the pre-fix staging so the red path is a thing that runs, not a thing that is argued:
     driven, it reports `verdict=refuse, expected write` at the note position,
     `verdict=fail-closed, expected answered` at the manifest position, and `5 CHECK(S) FAILED` at
     exit 1. And the forced-absent seam now skips WITHOUT planting — re-observed, **0 position
     plants** where there were 8.
  2. **AN ACCEPTED-SPELLING SET AND ITS MIRROR SET ARE ONE DERIVATION.** `REFUSAL_SPELLINGS`
     enumerates the accepted spellings; the predicate asks the SEMANTIC question over all of them —
     does this function branch on `fstat`'s regular-file answer and throw on the not-regular side —
     and the mutation mirrors are GENERATED by iterating that same list, with a case asserting the
     ids the mirrors actually drove ARE the enumerated ids. Watched red by generating over a proper
     subset: the census case then names exactly the spelling nothing exercised. The input boundary
     becomes the UNION of `git ls-files "*.ts"` and a real filesystem walk of `scripts/`, `hooks/`
     and `install/`, with a case asserting the two censuses agree over the walk's own roots and
     naming any path present in one and absent from the other.

- **THE VISIBILITY WIDENED; THE BASELINE DID NOT MOVE.** Derived over the real tree, three ways:

  ```
  tracked census 128 files   walked census 127 files (scripts, hooks, install)   union 128 files
  pre-fix predicate  / tracked-only  = ["hooks/hook-entry.ts","scripts/context-io.ts"]
  post-fix predicate / tracked-only  = ["hooks/hook-entry.ts","scripts/context-io.ts"]
  post-fix predicate / two-source    = ["hooks/hook-entry.ts","scripts/context-io.ts"]
  ```

  The same two files in every cell. This is the property `WR-27`'s own fix established for the
  sibling axis: what the axis CAN see grew, what it DOES see did not.

- **A DEFECT THE REVIEW DID NOT NAME, FOUND BY MAKING THE ORDINARY OUTCOME REACHABLE.** The symlink
  CONTROL's target was `<at>.platform-shape-target`. At the manifest position the decider resolves
  the symlink and `import()`s the realpath, which Node refuses with
  `Unknown file extension ".platform-shape-target"` — so that control drew a fail-closed deny for a
  reason with nothing to do with the rule under test, and the clause-absence check scored it
  `not refused (correct)` too. The marker now goes BEFORE the extension. Correct bytes alone would
  not have fixed that row, and only a POSITIVE assertion surfaced it.

- **WHAT D-37 DOES NOT ESTABLISH.**
  - **It does not restore the GOV-02 ledger position.** That position stays DROPPED with its
    explanatory comment byte-unchanged and its restore criterion in `deferred-items.md` untouched.
    Nothing here is smuggled past the AUTO-06 governance-dial scan.
  - **It does not claim the accepted-spelling set is TOTAL.** Four spellings are enumerated and the
    predicate accepts those four; a fifth spelling of a regular-file refusal is a spelling this axis
    still walks past. What changed is that the accepted set is now NAMED and its mirrors are
    generated from it, so widening it is one edit rather than two that can drift. This is the
    open-set posture `D-59` settled for the sibling problem in Phase 29: the enumeration is content
    with a disclosed limit, not a decidable totality.
  - **It does not make an untracked implementation a passing state.** The union CONSIDERS it and the
    agreement case REPORTS it; a tree carrying an untracked `.ts` under the walk roots turns that
    case red, by design.
  - **It does not measure anything on Windows.** `R-03` remains this phase's standing remainder, and
    a shape this platform cannot construct stays a recorded SKIP with its reason.
  - **It does not move a requirement checkbox, a traceability row or the phase checkbox.** Only a
    verification round may do that. `UATX-01` through `UATX-06` stay unchecked and `Gaps Found`.

- **Reversibility: REVERSIBLE.** Harness staging, one added assertion, and a test-local predicate
  with its input boundary. Reverting restores a gate that prints `ALL CHECKS PASSED` over four rows
  that are all refusals, and an axis that a third implementation spelled differently — or left
  untracked — walks past.

- **The three places that must agree.**
  1. Each position's `controlVerdict` and the verdict its driver actually produces — asserted
     positively per row, and the classifier's own premises (every shape accounted for at every
     position; the manifest position produced more than one verdict class; the fail-closed marker
     occurs in the committed wrapper) asserted before any row is read.
  2. `REFUSAL_SPELLINGS` and the mirrors — one list, iterated to generate the mirrors, with the
     driven ids compared back to it. Neither can go short alone.
  3. The tracked census and the filesystem walk — two independently derived lists, unioned for the
     derivation and compared to each other for the disclosure.

- **THE ROUND'S RUNNING GATES, RE-MEASURED AT THIS PLAN'S CLOSING COMMIT.**

  | Gate | `31-31` (round-6 close) | here |
  |---|---|---|
  | `npm run check:diff-disposition` | 80 finding(s) over 39 elements | **78 over 39** — and **78 over 39 measured at this plan's base `4a67f3f`** in a detached worktree, so this plan moved it by ZERO. The 80 → 78 drop belongs to `31-32`…`31-35`. The gate exits 1 while the debt is non-zero, which is the round's standing state rather than a regression. |
  | `npm run freshness` | 61 committed `.js` | **61 committed `.js` fresh**, set equality with the walk 0/0 |
  | `npm run freshness:hook-manifest` | 2 decider(s), 26 module hash(es) | **2 decider(s), 26 module hash(es)** |
  | `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` | **`ALL CHECKS PASSED`** |
  | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` | **`ALL CHECKS PASSED`** |

  `docs/audit/harness-false-result-instances.md` is byte-unchanged by this plan — row 13's
  correction is `31-37`'s to make — as are `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`.
