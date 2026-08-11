---
phase: 28-kit-consistency-audit
plan: 03
subsystem: tooling-gates
status: complete
tags: [audit-01, audit-03, d-01, d-02, d-03, d-04, d-05, d-06, d-07, red-first, parse-authority]

requires:
  - scripts/kit-model.ts (listRoles/listWorkflows/ROLE_COUNT/WORKFLOW_COUNT — the D-01 authority, read only)
  - scripts/dead-vocabulary.ts (READ by the pre-pass, NOT consumed as a guard)
  - agent-factory/config/factory.config.json (the live safety-floor values, read at run time)
provides:
  - "scripts/audit-model.js — readRegister/readRegistry, the SINGLE parse authority for both Phase 28 docs/ artifacts"
  - "DISPOSITIONS / CLAIM_KINDS / CLAIM_STATUSES / SAFETY_FLOORS / RUBRIC_CATEGORIES / SAFETY_SURFACE_VALUES / REGISTER_PATH / REGISTRY_PATH"
  - "scripts/audit-prepass.js — auditSetFiles/runPrepass/PREPASS_PREDICATES/AUDIT_SET_COUNT/PROTOCOL_FILE"
  - "scripts/check-audit-register.js — the D-03 two-equality completeness gate, wired at both ends"
  - "auditRegisterFails() — the accessor a later aggregator folds without a shared global"
  - docs/audit/28-disposition-register.md (37 rows + four prose sections, observations empty)
  - docs/audit/28-prepass-evidence.md (123 evidence rows, re-runnable)
  - the D-05 RED transcript that plans 28-06 and 28-07 must turn green
affects:
  - 28-04 (imports readRegistry from this one parse authority; must NOT write a second parser)
  - 28-05 (fills `## Recorded couplings and out-of-set notes`)
  - 28-06 (the read pass; inherits the F-28-A..G id-scheme collision recorded below)
  - 28-07 (the read pass; the safety_surface column feeds D-18's derived exclusion list)
  - .github/workflows/ci.yml (RED until 28-06/28-07, by design)

tech-stack:
  added: []
  patterns:
    - "one parse authority for two artifacts, never a second grammar over the same class of bytes"
    - "fail-closed on hand-authored input — a skipped row is a silent truncation"
    - "refusal arms ORDERED, not racing, so a malformed artifact produces the same message every run"
    - "closed set enumerated once, violation computed as the COMPLEMENT"
    - "de-duplicated foreign-member report in first-occurrence order stated in the expression"
    - "canonical id form with a refusal outside it, never a pattern widened once per surprise"
    - "SET equality in both directions, never a count"
    - "two equalities at two granularities, neither able to absorb the other's drift"
    - "vacuity/cardinality floor written over the PINNED quantity, never over the live derivation"
    - "a reporter exits 0 on evidence; only a refusal to report is non-zero"
    - "oracle-fails-RED-first against the real artifact before any of it is filled"

key-files:
  created:
    - scripts/audit-model.ts
    - scripts/audit-model.js
    - scripts/audit-model.test.ts
    - scripts/audit-prepass.ts
    - scripts/audit-prepass.js
    - scripts/audit-prepass.test.ts
    - scripts/check-audit-register.ts
    - scripts/check-audit-register.js
    - scripts/check-audit-register.test.ts
    - docs/audit/28-disposition-register.md
    - docs/audit/28-prepass-evidence.md
  modified:
    - package.json
    - .github/workflows/ci.yml

decisions:
  - "readRegistry() landed HERE rather than in 28-04, so both audit artifacts are read by one grammar. A second parser in 28-04 would be the duplicate-grammar class this repository has collapsed twice."
  - "`safety_surface` gained a THIRD legal value `—`, the unfilled marker: the PARSER admits it and the GATE refuses it. Writing `no` into 37 unread rows would record a verdict nobody reached (T-28-14); writing an unparseable value would make the register unreadable rather than incomplete."
  - "AUDIT_SET_COUNT is derived from kit-model's PINNED ROLE_COUNT/WORKFLOW_COUNT, never from the live derivation. The plan's literal wording (`derived === sum of the two derived counts + 1`) is self-referential and would have been a floor written over the wrong quantity — worse than no floor, because it can never fire."
  - "The pre-pass's missing-file check can only ever fire on the ONE hand-listed member (the protocol file); a vanished DERIVED member is a COUNT failure instead. Both mechanisms exist, neither is redundant, and both arms are tested."
  - "The unresolvable-reference predicate does NOT adjudicate config keys — there is no non-heuristic way to tell a config key from any other snake_case word in prose. Recorded as a NAMED limit in the predicate's own `what` field and printed into the evidence file, rather than left as a silent gap."
  - "The bare-observation check compares against the WHOLE observation, never as a substring ban — 'clean of retired vocabulary, but ...' is a real observation and banning the token would make correct text unsayable (the dead-vocabulary.ts trap, third instance)."
  - "The gate REPORTS parse refusals through fail() rather than letting them surface as a stack trace: audit-model is a library and throws, this is a gate and reports (the kit-model:744-753 split)."
  - "Finding ids are canonically `F-28-NNN` and the parser refuses anything else. 28-02's `F-28-A`..`F-28-G` are therefore REFUSED by name; the mapping obligation is written into the register rather than the grammar being widened to admit both spellings."

metrics:
  duration: ~70m
  tasks: 3
  commits: 3
  files-changed: 13
  completed: 2026-08-11

actuals:
  tokens: 47000
  tasks: 3
  commits: 3
---

# Phase 28 Plan 03: The Machinery AUDIT-01 Is Measured By Summary

One fail-closed parse authority for both Phase 28 audit artifacts, a re-runnable mechanical
pre-pass that emitted 123 evidence rows across the derived 37-file set, and a completeness gate
enforcing two independent equalities as set equality against the live listers — all standing red
against an unfilled register, with both D-03 equalities already green so the red is precisely the
unread files and nothing else.

## The D-05 RED transcript — verbatim

Captured from a real run of the committed `.js` against the register committed in this plan, and
spliced from the captured bytes rather than retyped. Elided only where a 37-item list repeats.

```
$ node scripts/check-audit-register.js ; echo "exit=$?"

[check_audit_register] the AUDIT-01 disposition register is complete against the derived kit (D-03 / D-05)
  FAIL  37 row(s) carry a BLANK observation — agent-factory/roles/agents-md-scribe.md (line 108),
        agent-factory/roles/architect-design.md (line 109), … [37 rows, lines 108-144] …,
        agent-factory/roles/_role-switch-protocol.md (line 144). D-06 requires a substantive
        observation per row: an empty observation records that nobody wrote anything, which is the
        honest reading of an unread file and is not a completed row
  FAIL  37 row(s) still carry the unfilled `safety_surface` marker "—" — agent-factory/roles/agents-md-scribe.md
        (line 108), … [same 37 rows] …. D-18 derives Phase 29's LANG-02 exclusion list from this
        column unioned with the claim registry's safety rows, so an unrecorded flag becomes a
        missing exclusion two phases later. The marker parses and fails here on purpose: writing
        `no` into an unread row would record a verdict nobody reached

== Result ==
2 CHECK(S) FAILED
exit=1
```

**The shape of the red is the load-bearing part.** Exactly **two** failures, and
`grep -c 'equality' ` on the transcript returns **0** — both D-03 equalities are already GREEN
against the skeleton. The gate is not red because it cannot pass; it is red because 37 files have
not been read. That distinction is what makes this a measurement of the register rather than a
property of the gate, and it is why the clean-mirror case was written and confirmed green *first*.

## The 36 counted paths were generated, never typed

Table A's 36 counted rows were emitted by running `node -e` against the committed `kit-model.js`
and concatenating the result into the register — no path was hand-entered. The equality was then
re-verified independently at run time:

```
$ node -e "… derived = listRoles()+listWorkflows() prefixed; counted = readRegister().rows.filter(counted) …"
derived: 36 counted: 36
byte-identical: true
```

The 37th row is `agent-factory/roles/_role-switch-protocol.md`, `counted: no`, present by name with
its reason in `## Out-of-set by derivation`.

## Pre-pass evidence — per-predicate row counts

`node scripts/audit-prepass.js` → exit **0**, 123 rows across 37 files.

| Predicate | Rows | Reading |
|---|---|---|
| `unresolvable-reference` | **65** | Dominated by *runtime* paths — `.grugops/factory.config.json`, `memory-bank/*.md` — which are correct references to host-repo artifacts that do not exist in the kit repo. Exactly the deliberately-noisy false positives a human adjudicates. |
| `unknown-verify` | **37** | The project's honesty marker, roughly one site per file. Each needs a reader to ask whether the question is still open. |
| `stale-count-or-version` | **21** | Numbers adjacent to kit nouns, plus version-shaped strings. |
| `retired-vocabulary` | **0** | **Corroborating, not anomalous.** `check-kit-refs` Assertion 2 already greps the shipped kit for the path form to zero, and `guard_adapter_body` covers the prose forms. Zero here is the two existing gates agreeing, and is precisely why 28-01's AUDIT-02 gate had to cover the *public documents* instead. |

`diff` of two consecutive runs over the live tree: **empty** — byte-identical.

## Proving the RED is a measurement (the harnesses)

| File | Cases | The property it buys |
|---|---|---|
| `scripts/audit-model.test.ts` | 40 | **All 27 refusal cases were watched RED against a deliberately permissive parser** — one that parses and validates nothing — while the 13 well-formed and closed-set cases passed in that *same* run. That is what makes the RED a measurement rather than "the module did not exist yet". |
| `scripts/audit-prepass.test.ts` | 17 | Derived-set pin, both fail-red arms, predicate discrimination, row ordering, byte-identical re-run. |
| `scripts/check-audit-register.test.ts` | 19 | Green baseline on a **filled** register first; then set-equality both directions, the adjacency pair, the independent equalities, the observation arms, and the parse-refusal-is-reported arm. |

**The union of the arms was tested, not only each arm** (the `partitionPluginComponentClaims`
lesson): a register violating two rules at once is refused, and the case asserts *which* refusal
fires, so the arms are ordered rather than racing.

**The adjacency pair, both directions** — this is what proves the `counted` filter is load-bearing
rather than merely present:

| Fixture | Equality one |
|---|---|
| a **second** uncounted row planted | **GREEN at 36** — and the extra row is still reported by name |
| the protocol row flipped to `counted: yes` | **RED at 37 against 36** |

## Two plan premises corrected by measurement

This project's second diagnosed failure class is a verification harness whose own premise is false;
plan 28-02 hit it twice. Both corrections below were made by measuring rather than by reading the
plan's wording forward.

1. **The cardinality floor as written would never have fired.** The plan says to assert the set size
   "two-sided against the sum of the two derived counts plus one" — but both sides of that
   comparison come from the same live derivation, so it reduces to `n === n`. It is the floor
   written over the wrong quantity that `check-foundation-guards.ts:1250-1262` records as *worse
   than no floor*, because the phase counts it as present while it can never run. `AUDIT_SET_COUNT`
   is therefore built from kit-model's **pinned** `ROLE_COUNT + WORKFLOW_COUNT + 1`, and the
   deleted-role fixture confirms it fires at 36 against 37.

2. **The skeleton's `safety_surface` could not be "a placeholder the gate refuses" and still parse.**
   The plan's task-3 action asks for a refused placeholder while its acceptance criterion requires
   the gate to run and name the empty-observation failure on all 37 rows — and an unparseable value
   makes `readRegister` throw, so the gate would report a parse refusal instead. Resolved by
   splitting the two questions: `—` is a **legal parse value** and a **gate failure**. This also
   avoids the unearned `no`, which was the better outcome on T-28-14 grounds anyway.

## The id-scheme collision — handed to 28-06, grammar NOT widened

The plan fixes the canonical finding-id form as `F-28-NNN`. Plan 28-02 executed *after* this plan
was authored and recorded seven findings as **`F-28-A` … `F-28-G`** in
`docs/audit/28-residual-sizing.md`. Those ids are **refused by name** by this parser.

The grammar was **not** widened to admit both spellings — that is the parser-widened-once-per-surprise
move D-64 exists to stop. Instead the obligation is written into the register's Table B section:
28-06 enters them as `F-28-001` … `F-28-007` with the original letter id quoted in the `reason`
column, so the trail from the sizing document survives while one predicate keeps one form.

## Verification Results

| Check | Result |
|---|---|
| `node scripts/check-audit-register.js` | **exit 1**, `2 CHECK(S) FAILED`, zero equality failures |
| same gate, filled register on a clean mirror | **exit 0**, `ALL CHECKS PASSED` |
| `npm run check:audit-register` | exit 1, output **byte-identical** to the direct `node` run |
| `node scripts/audit-prepass.js` | exit 0, 123 rows / 37 files |
| pre-pass re-run `diff` | **empty** — byte-identical |
| 36 counted paths vs live listers | **byte-identical**, compared at run time |
| `grep -c 'check-audit-register.js' .github/workflows/ci.yml` | `1` |
| `npm run freshness` | exit 0 — **40** committed `.js` match a fresh rebuild (was 37) |
| `npx tsc --noEmit` / `npm run typecheck` | exit 0 (both targets) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | exit 0 — **43 files, 1503 passed, 2 skipped** (was 1467; +36 new) |
| `git diff scripts/kit-model.ts` across all 3 commits | **empty** — no second lister, authority untouched |
| `git diff scripts/dead-vocabulary.ts` | **empty** — read, not edited |
| `git diff scripts/check-public-docs-vocabulary.ts` | **empty** — 28-01's red gate untouched |
| `git diff package.json` | two lines, under `scripts` only — dependency blocks byte-unchanged (T-28-18) |
| all four prose sections present | `1` each; `not mechanically provable` × 1; `cannot hold a Table B finding` × 1 |
| register under `agent-factory/` | **0** — ships to no host repo |

The `2 skipped` tests are pre-existing and untouched.

## Prohibitions — Each Confirmed

| Prohibition | Evidence |
|---|---|
| No second lister for roles or workflows | `git diff scripts/kit-model.ts` empty; both new modules import `listRoles`/`listWorkflows` |
| No register row dropped for being out-of-set | the protocol row is present, `counted: no`, with its reason and a dedicated prose section |
| The two D-03 equalities not conflated | reported through separate `fail()` calls; a case asserts both appear in one run |
| No disposition outside the closed three-name set accepted | computed complement against `DISPOSITIONS`; the fourth-value case asserts the message names the value **and** all three legal members |
| Register not under `agent-factory/`, reaches no host repo | `ls agent-factory/ \| grep -c audit` = 0 |
| The pre-pass does not stand in for a read | it is a reporter (exit 0 on evidence); its header, the evidence file's own section, and the register's prose each state that zero rows is not a verdict of correct |
| No category-six determinism finding fixed | the parser refuses any category-6 disposition other than `deferred`→29; no prose file was edited in this plan |
| A PASS line never states a check that was not performed | every number in the PASS line is read from the run that just happened; the derivation-failure and parse-failure paths both `return` before it |

## Threat Model — Dispositions Discharged

| Threat | Disposition | How |
|---|---|---|
| T-28-13 (parser skips a malformed row) | mitigated | fail-closed on every enumerated malformation; 27 refusal cases watched RED against a permissive parser; arms tested individually **and** as a union with the firing arm named |
| T-28-14 (unearned observation) | mitigated as far as a mechanism reaches, residual **named** | blank and bare-word observations refused (whole-value, never substring); the unfilled `safety_surface` marker refused; and the irreducible remainder written in plain text in `## What this register does not prove` and in `audit-model.ts`'s own recorded residual |
| T-28-15 (vacuous/shrunken derived set) | mitigated | kit-model's existing vacuity throw is caught and **reported** by the gate; `AUDIT_SET_COUNT` pinned against kit-model's constants; SET equality both directions rather than a count |
| T-28-16 (category-6 finding fixed) | mitigated | structural parser refusal, not a convention; both the illegal-disposition and wrong-target-phase arms tested, plus the legal one |
| T-28-17 (pre-pass DoS) | accepted | the audit set is bounded at 37 files from two directories already carrying `MAX_WALK_ENTRIES`; no unbounded input reaches it |
| T-28-18 (package installs) | accepted, verified | no install occurred; `git diff package.json` touches `scripts` only |
| T-28-19 (docs/audit disclosure) | accepted | repo-relative paths and lines from files already public in this repository; no secret read or emitted |

## Deviations from Plan

No deviation rule was invoked — no bug was auto-fixed and no architectural change was needed. Three
**measured divergences from the plan's own premises** are recorded, each resolved by measurement:

1. **The two-sided cardinality assertion as worded is self-referential** and would never have fired;
   rewritten over kit-model's pinned constants (see above).
2. **The skeleton's `safety_surface` placeholder could not be both parser-refused and gate-reported**;
   resolved by making `—` a legal parse value and a gate failure.
3. **`F-28-NNN` collides with 28-02's `F-28-A`..`F-28-G`**; the grammar was kept and the mapping
   obligation written into the register.

Two in-latitude implementation choices, neither a deviation:

- **`CLAIM_STATUSES` was added** to the exported closed sets. D-17 names three statuses and a
  fail-closed parse needs the set to check against; the four sets the plan pins are pinned exactly
  as specified.
- **An `isEntry` guard wraps both new entry-point scripts**, so their test files can import the
  exported pins without the import running the check and calling `process.exit` inside the vitest
  worker. The same choice plans 28-01 and 28-02 made, for the same reason.

## Checkpoints

None. All three tasks were `type="auto"`; no checkpoint, decision, auth gate or architectural
question arose.

## Known Stubs

**One, and it is the plan's stated deliverable rather than an omission.**
`docs/audit/28-disposition-register.md` ships with all 37 `observation` cells empty and all 37
`safety_surface` cells carrying `—`. `## Recorded couplings and out-of-set notes` ships with only
its header sentence. Table B ships with its header row and no data rows.

This is D-24's posture applied to AUDIT-01 and is why `scripts/check-audit-register.js` **exits 1**.
It is not a stub that prevents the plan's goal — the plan's goal was to make AUDIT-01's completeness
mechanical *before* any of it is claimed, and an unfilled register behind a red gate is exactly that.
Plans **28-06** and **28-07** fill it; **28-05** fills the couplings section. Both the CI workflow
file and the gate's own header state the expected-red and its reason, so it cannot reach `/gsd-ship`
silently.

## For the Next Plans

- **28-04** must `import { readRegistry } from "./audit-model.js"`. It is already written, tested and
  committed — **do not write a second parser.** Claim ids are canonically `C-28-NNN`; `kind` is one
  of `safety` / `architecture` / `install`; `status` is one of `true` / `overstated` / `false`;
  `depends_on` must name members of `SAFETY_FLOORS`. The fenced claim text is extracted
  **byte-for-byte** so 28-04's verbatim-at-anchor comparison can be an exact byte compare.
- **28-05** fills `## Recorded couplings and out-of-set notes` with the Phase 33 / GAP-D1 coupling on
  `examples/03-ticket-to-pr.md` and the two deleted hygiene directories. A Table B row is **not** an
  option for a file with no Table A row — the parser refuses it and the section's own header says why.
- **28-06 / 28-07** turn the gate green: a substantive observation and a recorded `safety_surface` on
  every one of the 37 rows, plus the 7 findings from `docs/audit/28-residual-sizing.md` renumbered to
  `F-28-001`..`F-28-007`. `docs/audit/28-prepass-evidence.md` is the pre-seeded worklist — 123 rows,
  and its own header says zero rows is not a verdict of correct.
- **28-07 still owns the D-01 "18 roles → 17" amendment**, and this plan deliberately did not make it.
  The plan's `must_haves.truths` says the amendment happens "in this plan", but `ROADMAP.md:467`
  explicitly assigns the edit to 28-07 *"in `ROADMAP.md` and `REQUIREMENTS.md` together"*, and
  neither file is in this plan's `files_modified`. Making it here would have duplicated an assigned
  edit across two plans and split one amendment over two files in two commits. What this plan owed
  D-01 is that the machinery **embodies** 17-not-18 — 17 counted role rows, the protocol row present
  and uncounted with its reason — and it does. The two stale sites are `ROADMAP.md:95`,
  `ROADMAP.md:425` and `REQUIREMENTS.md:72`.
- **CI is now red on two Phase 28 gates** (`check-public-docs-vocabulary` from 28-01, and this one).
  Both are the recorded, intended state.

## Self-Check: PASSED

All 11 created artifacts exist on disk (three `.ts`/`.js`/`.test.ts` triples plus both `docs/audit/`
files), and all three commits (`4be2f07`, `8dfa93b`, `eba2178`) are present in `git log`.
