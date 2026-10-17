---
phase: 32-board-projector-cli-dashboard
plan: 20
subsystem: testing
tags: [safety-guard, ast, typescript, vitest, allow-list, capability-analysis, import-closure]

# Dependency graph
requires:
  - phase: 32-board-projector-cli-dashboard
    provides: "plans 32-15..32-19 changed modules inside scripts/board-dashboard.js's import closure; this guard decides a question about that closure, so it runs after all of them"
  - phase: 32-board-projector-cli-dashboard
    provides: "32-06 built the read-only guard; 32-11 converted the fs-namespace rule to a canonical form; 32-14 measured F-03"
provides:
  - "Module IDENTITY decided by a two-sided allow-list (ALLOWED_BUILTIN_SPECIFIERS) instead of a fifteen-name deny-list"
  - "A canonical form for module ACQUISITION: one admitted shape, every other acquisition refused (ModuleFacts.acquisitions)"
  - "A two-sided census of the member paths reached on capability-bearing globals (EXPECTED_GLOBAL_MEMBER_PATHS)"
  - "Scope-chain callee resolution that closes the 'one dead declaration disables the ban' shape structurally"
  - "MODULE_IDENTITY_SHAPES: ten closed spellings held as data, iterated with the two existing tables in one union pass"
  - "RED baseline and GREEN proof artifacts with mutation transcripts and committed-.js reproductions"
affects: [32-21, 32-22, 32-23, board-projector, dashboard-safety, foundation-guards]

actuals:
  tokens: 27973
  tasks: 3
  commits: 5  # 3 task commits + the SUMMARY commit + this metadata commit, on base 569d02a0
plan_head_before: 569d02a0b018bb6fed65965bb08e214fb7d9c3c3

tech-stack:
  added: []
  patterns:
    - "Allow-list inversion: state the canonical form, refuse the complement, pin it by members AND count with a decision-shaped message"
    - "Witness-carrying discrimination rows: each planted spelling names the derived set that must refuse it, so a red produced by another rule cannot be credited to this one"
    - "Scope-chain resolution over a file-level declared-name census, so imprecision runs toward refusal"
    - "Mutation transcripts: disable each rule in exactly one place and record which named rows go red"

key-files:
  created:
    - .planning/phases/32-board-projector-cli-dashboard/32-20-RED-baseline.txt
    - .planning/phases/32-board-projector-cli-dashboard/32-20-GREEN-proof.txt
  modified:
    - scripts/board-readonly.test.ts

key-decisions:
  - "Module identity is an allow-list, not a deny-list: BANNED_MODULES and ADDITIONAL_BANNED_MODULES are retained as the written record of D-21 and asserted disjoint from the allow-list, but they no longer decide the question"
  - "An unprovable module identity is refused rather than constant-folded — 32-11's argument against making the pass cleverer, with the stronger reason that a guard which cannot decide must refuse"
  - "The callee resolution map is pinned by KIND and by the enclosing-scope structure, NOT by a name->line map over 311 resolved call sites: a pin that reds on unrelated churn is the loosened-pin failure this file's own docblock refuses"
  - "The capability-global census is name-scoped rather than binding-scoped, so a shadowed-global local still reds; the imprecision runs toward refusal"
  - "A literal env key (process.env.NO_COLOR) is a different censused path from the computed one the closure uses, and is refused until recorded — naming which variable the projector reads is a decision worth making"

patterns-established:
  - "Witness-per-row discrimination: a shape table row carries the derived set that refuses it"
  - "Union iteration over every escape table in one pass, because three rules that each pass their own rows and were never run together is how a capability reopens one register over"

requirements-completed: [DASH-06, DASH-08]

coverage:
  - id: D1
    description: "A module importing a builtin outside the allow-list — node:v8's heap-snapshot writer, node:sqlite, node:vm, or the un-prefixed spelling of any of them — makes `npm run check:dashboard-readonly` exit non-zero"
    requirement: "DASH-08"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#module identity is REFUSED: the heap-snapshot writer imported from node:v8 (zero obfuscation; verifier gap 2)"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the closure's normalized builtin identities have exactly the allowed MEMBERS"
        status: pass
      - kind: integration
        ref: "npm run check:dashboard-readonly with each source appended to the committed scripts/board-read.js — exit 1 (was exit 0, 59/59); transcripts in 32-20-GREEN-proof.txt sections 2 and 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "A module that acquires a module identity at runtime — assembled specifier, dynamic import, require-equivalent — makes the gate exit non-zero, because the only admitted acquisition is a static import declaration with a literal specifier"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a RUNTIME-ASSEMBLED module identity is refused (F-03, the residual 32-11 named)"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a REQUIRE-EQUIVALENT through an unresolvable callee is refused by name"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a DYNAMIC IMPORT of any specifier is an acquisition, fs or not"
        status: pass
      - kind: integration
        ref: "npm run check:dashboard-readonly with process.getBuiltinModule(\"node:\" + \"fs\") appended to the committed scripts/board-read.js — exit 1, 4 failed (was exit 0, 59/59); 32-20-GREEN-proof.txt section 4, R3"
        status: pass
    human_judgment: false
  - id: D3
    description: "A module that reaches a write capability through a global rather than through a module — process.report.writeReport — makes the gate exit non-zero, because the member paths on capability-bearing globals are pinned two-sided"
    requirement: "DASH-06"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#a write capability reached through a GLOBAL with no import at all is refused (WR-02)"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the capability-global member paths have exactly the expected MEMBERS"
        status: pass
      - kind: integration
        ref: "npm run check:dashboard-readonly with process.report.writeReport(p) appended to the committed scripts/board-read.js — exit 1, 4 failed (was exit 0, 59/59); 32-20-GREEN-proof.txt section 4, R2"
        status: pass
    human_judgment: false
  - id: D4
    description: "The legitimate closure is unchanged by all three rules: the unplanted mirror is still green and the measured fs symbol set still has its six committed members and its pinned count"
    verification:
      - kind: unit
        ref: "scripts/board-readonly.test.ts#CONTROL: an UNPLANTED mirror of the live closure is still green"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#POSITIVE CONTROLS: the four capabilities the closure legitimately uses stay admitted"
        status: pass
      - kind: unit
        ref: "scripts/board-readonly.test.ts#the derived closure fs symbol set has the expected COUNT"
        status: pass
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' — 74 files, 4946 passed | 2 skipped, exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Each of the three new rules is shown to DECIDE something: disabling it in exactly one place reds named discrimination rows"
    verification:
      - kind: manual_procedural
        ref: "three mutation transcripts recorded in 32-20-GREEN-proof.txt section 3 — M1 reds 6 named cases, M2 reds 8, M3 reds 5; no mutation left in the tree"
        status: pass
    human_judgment: false
  - id: D6
    description: "The plan moves no build output: it edits one .test.ts file and the committed .js tree stays byte-identical"
    verification:
      - kind: integration
        ref: "npm run build && npm run check:build-parity — 'no tracked build output moved when tsc ran'; git diff --exit-code -- scripts/board-read.js scripts/board-model.js scripts/board-dashboard.js exit 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "The docblock's 'what this does not close' list names only boundaries measured during this plan, and the nearest open edge (import.meta) is stated with the two members the live closure reaches on it today"
    verification:
      - kind: other
        ref: "grep -n 'import\\.meta' over the five closure modules — scripts/is-entry.js, scripts/board-dashboard.js (import.meta.url), scripts/kit-model.js (import.meta.dirname)"
        status: pass
    human_judgment: true
    rationale: "Whether a written boundary list is HONEST — that it names what a reader would otherwise have to rediscover, and omits nothing the plan measured — is a judgment about prose that no test asserts. The membership claim behind it was measured; the adequacy of the wording was not."

# Metrics
duration: 31 min
completed: 2026-09-15
status: complete
---

# Phase 32 Plan 20: Module identity, module acquisition, and the globals — all three closed in one edit

**The dashboard read-only guard now decides module IDENTITY by a three-member allow-list, module ACQUISITION by a canonical form with one admitted shape, and platform capability by a ten-path census over three pinned global roots — closing nine writers that all left it at exit 0 with 59 of 59 passing.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-09-15T11:13:15Z
- **Completed:** 2026-09-15T11:44:55Z
- **Tasks:** 3
- **Files modified:** 3 (1 source, 2 artifacts)

## Accomplishments

- **Inverted the module rule.** `ALLOWED_BUILTIN_SPECIFIERS` (`fs`, `path`, `url`, each with the reason it belongs and the module that brings it in) is asserted EQUAL to the live normalized bare-specifier set, by members and by count. The complement is refused by construction, which is what closes `node:v8`, `node:sqlite`, `node:vm` and every builtin nobody has met yet. `BANNED_MODULES` survives as the written record of D-21 and is asserted disjoint from the allow-list so the record and the rule cannot silently disagree.
- **Stated the canonical form for acquisition.** In this closure a module identity is established by exactly one shape — a static import declaration with a string-literal specifier. A dynamic import (any argument), a call or construction through an identifier no enclosing scope declares, a call through an unadmitted global member path, and any non-member-access read of a capability-bearing global are all collected as `acquisitions` and asserted absent through the premise case the fs acquisitions already red through.
- **Censused the globals two-sided.** `EXPECTED_GLOBAL_MEMBER_PATHS` — ten measured paths over the three pinned roots `process` / `globalThis` / `global`, each with a reason. One derivation refuses both `process.report.writeReport` (a file writer with no import anywhere) and `process.getBuiltinModule` (F-03's assembled identity).
- **Closed the dead-declaration shape structurally.** Resolution walks the ancestor scope chain rather than a file-level census of declared names, so a block-scoped declaration in a scope the call site is not inside resolves nothing — proved by its own discrimination case. Both axes are pinned: `ADMITTED_GLOBAL_CALLEES` (what may be called with no declaration) and `RESOLVING_DECLARATION_KINDS` (the shapes of declaration that admit a callee).
- **Made the union the thing under test.** All three shape tables (32 rows total) are planted by ONE iteration against the same mirror, each row naming the derived set its own rule must produce.
- **Proved every refusal twice.** From a planted mirror inside the suite, and by planting the same source into the committed `scripts/board-read.js` a host runs and watching `npm run check:dashboard-readonly` exit non-zero — with the tree verified clean after each restore.

## Task Commits

1. **Task 1: Module identity becomes a two-sided allow-list** — `cd4c5106` (test)
2. **Task 2: One admitted way to acquire a module, and a two-sided census of the globals** — `ddc40ba5` (test)
3. **Task 3: The shapes as data, the mutations, and the reproduction against the committed .js** — `7d36c13e` (test)

**Plan metadata:** `e71ff498` carries this SUMMARY; the `docs(32-20): record plan position, metrics and decisions` commit after it carries STATE.md and ROADMAP.md.

## Files Created/Modified

- `scripts/board-readonly.test.ts` — the allow-list, the acquisition canonical form, the scope-chain resolver, the global member-path census, the third shape table and the union iteration. 59 → 89 cases; no case replaced.
- `.planning/phases/32-board-projector-cli-dashboard/32-20-RED-baseline.txt` — nine writers, gate green at exit 0 / 59-of-59 on every one, with the four collected sets and a restore-check per row.
- `.planning/phases/32-board-projector-cli-dashboard/32-20-GREEN-proof.txt` — the after side: nine plants now exit non-zero, three mutation transcripts naming the rows each disabled rule reds, three committed-`.js` reproductions with exit codes and failed-case counts, the positive controls, and the measured open boundaries.

## Decisions Made

- **The banned lists are documentation now, not the rule.** Deleting them would delete the record of D-21, and a decision nobody can find gets re-litigated. They are kept and asserted disjoint from the allow-list instead.
- **Refuse rather than fold.** `process.getBuiltinModule("node:" + "fs")` could be closed by constant-folding the argument. 32-11 declined that because it changes what this syntactic pass is; this plan refuses the acquisition instead, on the stronger ground that an unprovable identity is not a safe identity. The sentence is written where the rule is, because the next reader's instinct will be to make the pass cleverer.
- **Both axes of the resolution are pinned, but not by name.** See the deviation below.
- **The census is name-scoped.** A local or parameter reusing `process` is treated as the global. The imprecision runs toward refusal, which is the only direction a safety guard may be imprecise in, and a case proves the direction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — correctness of the pin] The resolution map is pinned by KIND and by scope structure, not by a name→line map**

- **Found during:** Task 2 (the "pin both axes of the resolution" instruction)
- **Issue:** The plan asks for the resolved-callee map — name, declaration kind, line — to be pinned two-sided. Measured: the live closure resolves **311 call sites** across its five modules. A pin over those names and lines reds on any unrelated edit to any closure module (a renamed helper, an inserted comment shifting a line). This file's own docblock already records what happens to a pin that reds for an unrelated reason — it gets loosened until it stops noticing — and argues the runtime-cardinality pin out of existence on exactly that ground twenty lines above. Shipping the map pin would have installed the failure the file exists to refuse.
- **Fix:** Both axes are still pinned, on the axes that are functions of capability rather than of churn: `ADMITTED_GLOBAL_CALLEES` (ten members, each with a reason, count-pinned — what may be called with NO declaration) and `RESOLVING_DECLARATION_KINDS` (six members, count-pinned — the shapes of declaration that admit a callee). The hazard the map pin was meant to catch — "one dead declaration disables the ban" — is closed **structurally** instead: `declaredDirectlyIn` is asked of each ancestor on the scope chain from the call site, so a declaration in a scope the call is not inside resolves nothing. A dedicated case plants a block-scoped dead `const` and asserts the callee is still unresolved. The kind and line of every resolution are still carried in the census string and printed on every run.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** the block-scoped case reds without the scope walk; `npm run check:dashboard-readonly` exit 0, 89 passed; the reason is written at the case rather than left in this file.
- **Committed in:** `ddc40ba5`

**2. [Rule 2 — missing critical] A `new` expression is inspected as well as a call**

- **Found during:** Task 2
- **Issue:** The plan's rule speaks of "a call to an identifier this pass cannot resolve". `new __Acquire("node:v8")` is the same hazard with a different keyword, and `ts.isCallExpression` does not match a `NewExpression`.
- **Fix:** The resolution arm covers both. Measured cost: five more admitted-global callees (`Date`, `Error`, `Map`, `Set`, `TextDecoder`), each inert, each named with its reason and its module, and the exemption set is pinned two-sided with a reachability case so an exemption nobody uses is a red.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** `ADMITTED_GLOBAL_CALLEES` count case; the reachability case; `npm run check:dashboard-readonly` exit 0.
- **Committed in:** `ddc40ba5`

**3. [Rule 2 — missing critical] A non-member-access READ of a capability-bearing global is refused**

- **Found during:** Task 2 (probing the sibling arm of the census)
- **Issue:** The plan asks for a member-path census rooted at the global identifiers. Two lines walk around it: `const p = process; p.report.writeReport(x);` — the member path is no longer rooted at a spelling the census knows, and nothing else in the file looks at it. This is precisely the shape 32-11 closed one register over for the fs namespace binding, and it would have been a live bypass in a plan whose whole purpose is that these gaps stop being reachable one arm over.
- **Fix:** The canonical form is stated for globals too — the ONE admitted read is as the object of a member access — with binding sites and member names exempt. Measured on the live closure first: **zero** such reads, so the rule costs the legitimate closure nothing. A discrimination row and a named case both plant the alias.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** the alias case and `MODULE_IDENTITY_SHAPES` row 10; mutation M2 reds both, proving the rule decides them.
- **Committed in:** `ddc40ba5`, row added in `7d36c13e`

**4. [Rule 2 — scope] A tenth module-identity row**

- **Found during:** Task 3
- **Issue:** The plan names nine spellings for `MODULE_IDENTITY_SHAPES`. The global alias from deviation 3 is a tenth distinct spelling, and leaving it out of the table would mean a closed spelling with no row — the thing the table exists to prevent.
- **Fix:** Added as row 10; `MODULE_IDENTITY_SHAPE_COUNT` is 10.
- **Files modified:** `scripts/board-readonly.test.ts`
- **Verification:** the cardinality case; ten row names present in the verbose reporter output.
- **Committed in:** `7d36c13e`

---

**Total deviations:** 4 auto-fixed (1 pin-correctness, 3 missing-critical/scope).
**Impact on plan:** All three arms the plan scoped are closed, plus one sibling arm the plan did not name that would have left the census walkable in two lines. No production module changed and no build output moved. No scope creep beyond the guard file.

## Issues Encountered

- **The positive control tripped its own rule, correctly.** The first version of the "four capabilities" control read `process.env["NO_COLOR"]`, which normalizes to the censused path `process.env.NO_COLOR` — a *different* path from the `process.env.[computed]` the live closure uses, and therefore unadmitted. The control was rewritten to use the computed shape the closure actually uses, and the finding was kept as a comment: naming which environment variable the projector reads should be a decision somebody records, not a silent admission.
- **The live claude-CLI e2e lane was not run** (`npm test` triggers it; it spends tokens and can hang on an authenticated box). The regression suite was run as `npx vitest run --exclude '**/scripts/e2e/**'`: 74 files, 4946 passed, 2 skipped, exit 0. Recorded rather than silently skipped.

## Known Stubs

None. This plan added no placeholder, no skipped test and no unrun `<verify>` command; every command in the plan's `<verification>` block was executed and its result recorded in `32-20-GREEN-proof.txt` section 6.

## Threat Flags

None. This plan edits one `.test.ts` file. It introduces no network endpoint, no auth path, no schema change and no new file-access pattern in any shipped module; the only files it writes are the mirrors under the already-established gitignored scratch root, whose residue case is unchanged and still green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 32-21**, which depends on this plan and closes the mechanical half of F-01: the derivation in `scripts/check-foundation-guards.test.ts` that silently skips any `check:*` script whose command is not `node scripts/<x>.js` — which is exactly this gate. The docblock here cross-references it rather than duplicating it.
- **REQUIREMENTS.md and the ROADMAP phase status were deliberately NOT flipped to Complete** by this plan, per its own success criteria. DASH-06 and DASH-08 are recorded in this summary's `requirements-completed` for traceability, and the phase-level verification round decides whether the truths hold.
- **Open edges are named and measured** in `32-20-GREEN-proof.txt` section 7: `import.meta` as a meta-property outside the identifier-rooted census (two members reached in the live closure today), any route whose identity exists only at run time, and the mechanical CI-reachability proof that 32-21 closes.

---
*Phase: 32-board-projector-cli-dashboard*
*Completed: 2026-09-15*

## Self-Check: PASSED

- All three created/modified files exist on disk.
- All four commits (`cd4c5106`, `ddc40ba5`, `7d36c13e`, `9d408fc8`) are present in the history.
- `npm run check:dashboard-readonly` re-run after the SUMMARY commit: exit 0, 89 passed (89).
