# Phase 28: Kit Consistency Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-11
**Phase:** 28-kit-consistency-audit
**Areas discussed:** Disposition register shape, Drift scope & mechanism, What counts as a "claim", Fix-vs-record budget

---

## Disposition register shape

### Q1 — Completeness anchor

| Option | Description | Selected |
|--------|-------------|----------|
| New audit lister, 18+19 | `listAuditableKitFiles()` beside `listRoles()`; every `.md` incl. `_`-prefixed; two-sided assert at 18/19=37; SC1's "18" stands (recommended) | |
| Reuse `listRoles()`, amend to 17 | Derive from the existing Phase 27 authority (17+19=36); amend ROADMAP SC1's "18" to 17; zero new machinery | ✓ |
| Widen to all kit prose | roles + workflows + 14 checklists + packaging + contracts (~55 files) | |

**User's choice:** Reuse `listRoles()`, amend to 17 → **D-01**
**Notes:** Keeps one authority per predicate. Accepted cost — `_role-switch-protocol.md` falls out of the derived set — was handled by the next question rather than absorbed silently.

### Q2 — `_role-switch-protocol.md`

| Option | Description | Selected |
|--------|-------------|----------|
| Named exclusion + still read | 37th uncounted row with its reason, and read once for the drift check (recommended) | ✓ |
| Named exclusion, not read | One recorded line; the file ships unread this phase | |
| Fold into the drift sweep only | No register row; covered by the mechanical grep only | |

**User's choice:** Named exclusion + still read → **D-02**
**Notes:** `docs/design/shared-install.md:55` records its step 4 as *"write the role's handoff file under `agent-factory/handoffs/`"* — one of the likeliest drift carriers in the tree.

### Q3 — Disposition vocabulary

| Option | Description | Selected |
|--------|-------------|----------|
| `fixed` / `accepted` / `deferred` | Exactly AUDIT-01's three names as a closed set; a fourth value fails the gate (recommended) | ✓ |
| Add `DISSOLVED` as a fourth | Plus Phase 27 round-12's class for a finding whose premise a structural change removes | |
| Three + a separate file-verdict set | Findings and file rows draw from different closed sets | |

**User's choice:** `fixed` / `accepted` / `deferred` → **D-04**
**Notes:** Presented alongside the two-level completeness model (**D-03**) that keeps file rows and finding rows from conflating — the granularity mismatch between AUDIT-01's *"each finding"* and SC1's *"each role and workflow"*.

### Q4 — How the 36 files get read

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanical pre-pass + full read | Re-runnable checker for greppable predicates across all 36, then a real read with findings pre-seeded; unverifiable-read limit named (recommended) | ✓ |
| Parallel subagents, fixed rubric | Fastest; every verdict an unbacked agent claim | |
| Inline sequential read only | First-hand and consistent; nothing re-runnable survives | |

**User's choice:** Mechanical pre-pass + full read → **D-06**

### Q5 — Where the register lives

| Option | Description | Selected |
|--------|-------------|----------|
| `docs/` + a `scripts/` gate | Durable, outside `agent-factory/`, both completeness equalities enforced in CI (recommended) | ✓ |
| `docs/`, no gate | Durable but the equalities are prose only | |
| Phase planning dir only | Consistent with Phase 27; archived at milestone close, invisible to CI | |

**User's choice:** `docs/` + a `scripts/` gate → **D-05**
**Notes:** Decisive factor — Phase 29's roadmap entry declares a dependency on this phase's output, so the artifact must outlive the milestone archive.

### Q6 — Rubric scope

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, record-only | Six categories; determinism findings dispositioned `deferred → Phase 29` by default, never fixed here (recommended) | ✓ |
| No, five categories only | Strictly correctness + strangeness; Phase 29 starts from zero | |
| Yes, and fixable here | Six categories with in-phase fixes; rewrites prose LANG-05 will rewrite again | |

**User's choice:** Yes, record-only → **D-07**

---

## Drift scope & mechanism

### Q1 — The drift set

| Option | Description | Selected |
|--------|-------------|----------|
| Everything user-visible | All shipped surfaces + `CLAUDE.md` + `README.md` + `examples/`; `CHANGELOG.md` and `docs/` as named historical exemptions (recommended) | ✓ |
| Shipped surfaces only | Leaves `CLAUDE.md` — AUDIT-02's literal target — stale | |
| `CLAUDE.md` only, as written | Smallest diff; knowingly ships measured drift in the guide every install lays down | |

**User's choice:** Everything user-visible → **D-08**
**Notes:** Settled by `install/install.ts:1065` — the whole `agent-factory/` tree is `cpSync`'d to every user's kit root, so `agent-factory/README.md`'s 4 handoff references are user-facing while `CLAUDE.md`'s 3 are not.

### Q2 — Enforcement mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| New derived consumer | Third `dead-vocabulary.ts` consumer with a derived, count-asserted scan set; `check-kit-refs`'s D-08 contract untouched (recommended) | ✓ |
| New consumer, hand-listed set | Same consumer, 8 named files; a hand-maintained set literal inside the phase auditing for exactly that | |
| One-time edit, no guard | Fix the prose, add no machinery | |

**User's choice:** New derived consumer → **D-09**
**Notes:** Weighed against the fact that this drift already outlived a full milestone — Phase 24 deleted the handoff templates in v2.0 and the prose is still shipping four phases and one release later. A one-time edit is the thing that already didn't hold.

### Q3 — Where the "routes" claim lands

| Option | Description | Selected |
|--------|-------------|----------|
| One registry, kind-tagged | `kind: safety \| architecture \| install`; Phase 30 filters to `safety`; architecture claims still get ids (recommended) | ✓ |
| Register finding only, no id | Narrowest reading of AUDIT-03's word "safety" | |
| Separate architecture registry | Two registries — the duplicate-list class D-24 and D-28 each collapsed | |

**User's choice:** One registry, kind-tagged → **D-15**
**Notes:** Established that `routes` is **not** bannable as a token (**D-10**) — it is still correct in the orchestrator adapter's own description, `orchestrator.md`'s `### Routing matrix`, and `CLAUDE.md:83`'s Claude Code platform fact. Only the specific lifecycle-pipeline claim is drift, and a claim can only be held by a registry entry.

### Q4 — `examples/`

| Option | Description | Selected |
|--------|-------------|----------|
| Re-narrate all 5, flag 33 | All 14 refs re-narrated incl. `03-ticket-to-pr.md`; GAP-D1 coupling recorded (recommended) | ✓ |
| Fix 4, defer `03` to Phase 33 | Zero cross-phase file contention; two dead paths keep shipping | |
| Path swap only | Correct paths describing a relay that no longer exists | |

**User's choice:** Re-narrate all 5, flag 33 → **D-11**

---

## What counts as a "claim"

### Q1 — Registry structure

| Option | Description | Selected |
|--------|-------------|----------|
| Claim → floor mapping | Row carries `depends_on`; two-sided completeness against the four floors; Phase 30 gets a join, not a search (recommended) | ✓ |
| Flat enumerated list | Every assertive sentence gets an id; Phase 30's prose search moves rather than disappears | |
| Floors-first, minimal | Only sentences the four floors back; architecture and install claims get no id | |

**User's choice:** Claim → floor mapping → **D-13**, **D-14**
**Notes:** Reframed from *"what is a claim"* to *"which public sentences become false if floor F is lowered?"* — which is AUDIT-03's stated purpose and joins directly to Phase 30's AUTO-01 checkpoint set.

### Q2 — Freshness across Phase 29

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor + bijection gate | Invisible `<!-- claim: ID -->` anchors; anchors ↔ rows asserted bijective; residual named (recommended) | ✓ |
| Text freshness gate only | No markup; line numbers rot and new claims are invisible | |
| Registry exists, no gate | Meets SC3 literally; Phase 29 can silently invalidate it | |

**User's choice:** Anchor + bijection gate → **D-16**
**Notes:** Decisive factor — Phase 29 sits between this registry and its only consumer and rewrites prose for a living. The unanchored-new-claim residual is recorded as a named limit rather than implied away.

### Q3 — Safety-surface exclusion list

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, derived from both | `safety_surface` flag on the 36 register rows ∪ `kind: safety` registry rows (recommended) | ✓ |
| Yes, as its own hand-list | A fourth hand-maintained set | |
| No — leave it to Phase 29 | Honors AUDIT-01..04 as written; contradicts the roadmap's stated dependency | |

**User's choice:** Yes, derived from both → **D-18**
**Notes:** Flagged that the roadmap assigns this artifact in Phase 29's *dependency prose* while no AUDIT requirement carries it.

### Q4 — Claim truth

| Option | Description | Selected |
|--------|-------------|----------|
| Assess + disposition | `status: true \| overstated \| false` measured against the mechanism; anything not `true` is an AUDIT-01 finding (recommended) | ✓ |
| Assess, fix none | Record honestly, correct in Phase 30 | |
| Inventory only | Exactly AUDIT-03 as written; smallest scope | |

**User's choice:** Assess + disposition → **D-17**
**Notes:** Four candidates measured live during discussion: the "identical everywhere" handoff claim (false by drift); "Coordinator spawns role agents" (advertised while KIT-03/SPAWN-04 remain `[ ]`, closed by user override); "Humans **always** hold merge and deploy" (overstated vs the documented forgery residual); and the `0.1.0` version claim. Presented with the honest scope note that this is a real verification pass over ~30 claims.

---

## Fix-vs-record budget

### Q1 — Budget posture

| Option | Description | Selected |
|--------|-------------|----------|
| Defects fixed, prose recorded | Fix the trivial items and the drift; size then fix-or-defer the unsized; record prose for Phase 29 (recommended) | ✓ |
| Everything in scope gets fixed | Strongest end state; reopens `frontmatter.ts` inside an audit phase | |
| Record everything, fix only AUDIT-02/04 | Cleanest separation; ships a known non-terminating gate | |

**User's choice:** Defects fixed, prose recorded → **D-19**
**Notes:** Presented with a sized 8-item inventory. Two items carry a *timing* argument rather than a size one — the `floor-invariance.test.ts` timeout gets measurably worse in Phase 30, and the oracle hang blocks the gate every other plan depends on.

### Q2 — `oracleWr05Wording` acceptance bar

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor + input guard | Consuming anchors, permanent long-line regression control, and a loud input bound (recommended) | ✓ |
| Anchor + regression test | Closes the reproduced hang; input stays unbounded | |
| Fix, then assess retirement | Same fix plus a recorded strangeness finding on whether the oracle is still load-bearing | |

**User's choice:** Anchor + input guard → **D-20**
**Notes:** Measured the class first — exactly 3 pure-lookahead regexes, all in `WR05_BEATS`, none elsewhere in `scripts/`. Surfaced that the oracle's input includes `.planning/STATE.md`, an unbounded agent-written narrative, and that option 3's retirement question survives as a deferred idea rather than being folded into a bug fix.

### Q3 — AUDIT-04 evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Re-measure at execution | `npm show` at execution time; measured value wins over the roadmap's numbers; no live gate; `UNKNOWN - verify` if offline (recommended) | ✓ |
| Pin the roadmap's numbers | Deterministic; "verified at the time of change" becomes "verified two weeks earlier" | |
| Re-measure + freshness gate | Permanently current; reds on a normal upstream release | |

**User's choice:** Re-measure at execution → **D-23**
**Notes:** Surfaced that the requirement pre-names `1.62.0` / `4.12.1` from a 2026-07-28 measurement, so inheriting them *is* the assumption the requirement forbids.

### Q4 — If a residual reaches the canonical admission reader

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-commit to defer | Deferred by rule to a phase carrying a red-team budget; investigation still recorded (recommended) | |
| Fix here with a red-team pass | Fix in this phase and budget an adversarial round | ✓ |
| Decide after investigation | No pre-commitment | |

**User's choice:** Fix here with a red-team pass → **D-21**
**Notes:** **Taken against a stated concern, recorded in CONTEXT.md verbatim.** The concern raised: twelve gap-closure rounds on that module, rounds 10 and 11 each shipping a regression inside their own fix, D-64's round-12 pivot existing specifically to stop widening the parser, Phase 27 closed by named user override with KIT-03/SPAWN-04 still `[ ]`, and Phase 30 — not 28 — carrying a red-team budget as scope. The user chose to proceed; the accepted cost is that this audit phase now carries an adversarial round.

### Q5 — Red-team bar for that fix

| Option | Description | Selected |
|--------|-------------|----------|
| Full Phase 27 doctrine | Structural fix + parser-oracle fuzz against a real loader + ≥2 independent red-teams + self-reproduction (recommended) | ✓ |
| Lighter bar: fuzz + one red team | Proportionate to a narrower defect; one red team is what rounds 10 and 11 had | |
| Canonical-form check only | Valid only if the fix is refusal-side; needs a gate to prove that | |

**User's choice:** Full Phase 27 doctrine → **D-22**

### Q6 — Guard-vs-fix ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Guard first, must fail RED | Consumer lands early and reds against the real tree with recorded hit counts; fixes turn it green (recommended) | ✓ |
| Guard and fixes together | RED state exists only in a mirror | |
| Fixes first, guard after | Guard passes on arrival; its ability to catch is asserted | |

**User's choice:** Guard first, must fail RED → **D-24**
**Notes:** Same shape as Phase 27 SC2's KIT-03 oracle requirement.

### Q7 — Registry-vs-fix ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor before the fixes | Claims registered against today's text with drift ones `status: false`; the rewrite must update rows and the gate catches it on a real commit (recommended) | ✓ |
| Anchor after the fixes | No rework; the freshness gate is never exercised on a real edit | |
| Split by overlap | Two authoring passes and a hand-maintained overlap set | |

**User's choice:** Anchor before the fixes → **D-25**

### Q8 — Hygiene deletions

| Option | Description | Selected |
|--------|-------------|----------|
| Delete both, recorded | Remove `agent-factory/handoffs/` and the empty `agent-factory/examples/`, each as a register row with its reason (recommended) | ✓ |
| Delete `handoffs/` only | Ships an empty `examples/` dir | |
| Record both, delete neither | Two vestigial directories keep shipping | |

**User's choice:** Delete both, recorded → **D-12**
**Notes:** Verified first that `RETIRED_PATH_FORMS` asserts zero hits on the path (so deleting the dir cannot break it) and that nothing on disk requires either directory to exist.

---

## Claude's Discretion

- Wave decomposition and plan count, subject to the D-24 / D-25 ordering constraints.
- File names and on-disk format of the register, the claim registry, and the derived exclusion list under `docs/`.
- The id scheme for claim ids and finding ids.
- How the mechanical pre-pass is packaged — joining an existing `scripts/` gate or standing alone.
- Sizing method for residuals #1 (WR-03 usability false-positive) and #2 (byte-round-trip adjacency).

## Deferred Ideas

- Widening the audit to all kit prose (~55 files) — declined; goes past AUDIT-01 and SC1.
- A second, architecture-only claim registry — declined under D-15 as the duplicate-list class.
- Retiring `oracleWr05Wording` entirely — it asserts four `.planning/` docs narrate a two-milestone-old story in a repo where `.planning/` is archived at milestone close. A candidate strangeness finding, explicitly not to be retired inside a bug fix.
- Deriving `WR05_SCAN`'s membership — D-20 bounds its input, not its set.
- Fixing determinism / prose findings — record-only here; Phase 29's LANG-02 and LANG-05.
- Reconciling `agent-factory/README.md:38-44`'s five-tool dispatch table with the Full / Reduced / Degraded tier vocabulary from Phase 27 D-02 — falls out as a D-07 category-1 finding rather than being pre-decided.
