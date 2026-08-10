---
phase: 27-spawn-correctness-kit-set-authority
plan: 66
subsystem: planning-record
tags: [D-64, disposition-register, DISSOLVED, traceability-hold, KIT-03, SPAWN-04, SPAWN-03, gap-closure-round-12]
status: complete
requires:
  - "27-62-SUMMARY.md / 27-63-SUMMARY.md / 27-64-SUMMARY.md / 27-65-SUMMARY.md (the evidence every disposition cites)"
  - "27-REVIEW.md and 27-VERIFICATION.md (round 11 — the items being dispositioned)"
  - "27-CONTEXT.md D-58 item 4, D-63, D-64 (the rules the hold and the DISSOLVED class rest on)"
provides:
  - "deferred-items.md § Round 12 disposition register — 13 rows, one per round-11 item, completeness asserted by count"
  - "DISSOLVED / DEMOTED / SUPERSEDED as named, defined disposition classes"
  - "deferred-items.md § Part six — the round-12 traceability hold, three rows asserted from disk in both renderings"
  - "the round-12 standing-obligations carry-forward, 15 rows, each with an owner"
affects:
  - "the next verification round for phase 27 — it owns the KIT-03 / SPAWN-04 flip and the two stale status narratives"
  - "any later reader who would otherwise read this round as a twelfth parser repair"
tech-stack:
  added: []
  patterns:
    - "a disposition class is DEFINED in prose before the table uses it, because the word is the artifact"
    - "counts re-derived from disk before adoption, with a HALT rather than a number fitted to a total"
    - "a correction to a closed round's record is written as an AMENDMENT in the discovering round, never by rewriting the historical text"
    - "cited-not-re-measured claims named explicitly, so 'the assertions still pass' is never mistaken for 'the transcript was re-taken'"
key-files:
  created:
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-66-SUMMARY.md
  modified:
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "FIXED is used ZERO times in the round-12 register. Round 12 repaired nothing in scripts/frontmatter.ts — 0 non-comment diff lines — and a row reading FIXED would send a later reader hunting a repair that does not exist."
  - "DISSOLVED, DEMOTED and SUPERSEDED are three new classes, each defined before first use. DISSOLVED for a defect made unreachable by a mechanism change; DEMOTED for an item still true of a module that no longer renders a verdict; SUPERSEDED for a prescribed remedy D-64 declined."
  - "The round-11 register is left BYTE-UNCHANGED. WR-01's register-correction half is recorded as an amendment in the round that discovered it, because rewriting a closed round's record destroys the evidence of what was believed when it was written."
  - "REQUIREMENTS.md and ROADMAP.md are changed by ZERO bytes. The two stale KIT-03 / SPAWN-04 narratives were deliberately NOT updated and recorded as an owned non-edit, because rewriting a narrative weakens the byte-unchanged guarantee the verify gate rests on."
metrics:
  duration: 38m
  completed: 2026-08-11
actuals:
  tokens: 11026    # chars/4 over the realized diff bc267f9..db20e74 (44,107 chars)
  tasks: 2
  commits: 2
---

# Phase 27 Plan 66: The Round-12 Disposition Register and Traceability Hold Summary

Every one of the 13 items round 11 raised now carries a written disposition whose arithmetic a reader
can check, in a register that uses **FIXED zero times** — because round 12 repaired nothing in
`scripts/frontmatter.ts` and a row saying otherwise would be false about the state of that module.

## What was built

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | the round-12 disposition register, with DISSOLVED as a named class | `111cba1` | `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` |
| 2 | the round-12 traceability hold — asserted from disk, nothing promoted | `db20e74` | `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` |

**This plan edited exactly ONE file.** `git diff --name-only bc267f9..db20e74` returns
`.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` and nothing else. No file
under `scripts/` was touched, no package was installed, and `package.json` is byte-unchanged
(`git diff --quiet bc267f9..HEAD -- package.json` exit **0**, threat T-27-SC).

## NO REQUIREMENT ROW WAS PROMOTED BY THIS ROUND

Stated first because it is the single claim most likely to be wanted and most costly to get wrong.
**KIT-03 and SPAWN-04 remain `[ ]` / Gaps Found. SPAWN-03 remains `[ ]` / Gaps Found, deferred, at
`UNKNOWN - verify`.** Not one byte of `.planning/REQUIREMENTS.md` or `.planning/ROADMAP.md` changed.
D-58 item 4 reserves promotion to a **verification** round, and commit `47d7820` already reverted one
premature flip of exactly this pair. A row promoted by the round that wrote its own fix tells a reader
that an unsound authorization control is verified — the failure this phase has paid for eleven times.

## The re-derived item counts, and their reconciliation

The plan's prose stated 13. That figure was **re-derived from disk before it was adopted**, because
three separate plans in this round had their own stated counts falsified by measurement (D-64's
31-vs-33 files and 8-vs-10 keys; `27-64`'s 5-vs-6 freshness gates; `27-65`'s 11-vs-5 consumers).

| Source | What was counted | How | Result |
|---|---|---|---|
| `27-REVIEW.md` | frontmatter tally | `sed -n '/^findings:/,/^status:/p'` | `critical: 2, warning: 4, info: 3, total: 9` |
| `27-REVIEW.md` | body finding headings, counted **independently** | `grep -cE '^### (CR\|WR\|IN)-[0-9]+'` | **9** — CR-01, CR-02, WR-01…WR-04, IN-01…IN-03 |
| `27-VERIFICATION.md` | `missing` entries under the single `gaps` entry | node, **inside the frontmatter only** | **3** |
| `27-VERIFICATION.md` | `deferred` entries | node, inside the frontmatter only | **1** (SPAWN-03) |

**Reconciliation: the frontmatter tally and the independently counted headings AGREE at 9, so no
disagreement row is owed.** `2 + 4 + 3 == 9`. Items beyond the review: `3 + 1 == 4`.
**Total round-11 items raised: `9 + 4 == 13`.**

**Rows written in the register: 13.** Verified mechanically, not by inspection — the plan's own
automated check counts them:

```
$ node -e "... const rows=(reg.match(/^\|\s*(?:[A-Z]?[0-9]+|V[0-9]+)\s*\|/gm)||[]).length; ..."
register rows: 13
register terms present; length 35023
```

**`13 == 13`.** The register records that if those two numbers ever differ, the register is wrong
rather than the count.

**The counting hazard this repository is known for was avoided deliberately.** `verification: backstop`
in this repo means BOTH "probe row auto-resolved" AND "`UNKNOWN - verify` premise", so a naive grep
tally double-counts. The verification items were counted **inside the frontmatter only**, structurally
(the `missing:` list and the `deferred:` list), never by grepping the document body.

## The disposition partition, summed

| Class | Count | Rows |
|---|---|---|
| **DISSOLVED** | 3 | 1 (CR-01-r11), 2 (CR-02-r11), 3 (WR-01-r11) |
| **DEMOTED** | 4 | 4 (WR-02-r11), 5 (WR-03-r11), 7 (IN-01-r11), 9 (IN-03-r11) |
| **OPEN** | 2 | 6 (WR-04-r11), 8 (IN-02-r11) |
| **SUPERSEDED** | 3 | V1, V2, V3 |
| **DEFERRED** | 1 | V4 (SPAWN-03) |
| **FIXED** | **0** | — |

**`3 + 4 + 2 + 3 + 1 == 13`.**

**FIXED appears zero times, and that is the point.** The measurement that licenses it, taken this
session at `bc267f9`:

```
$ git diff c842e81..bc267f9 -- scripts/frontmatter.ts | grep -E '^[+-][^+-]' \
    | grep -vE '^[+-]\s*(//|\*|/\*|\*/)' | grep -vE '^[+-]\s*$' | wc -l
0
$ git diff -U0 c842e81..bc267f9 -- scripts/frontmatter.ts | grep -E '^@@'
@@ -1,2 +1,41 @@
```

Zero non-comment lines changed; the single diff hunk is the file **header**. Every defect site round 11
named — `openBlock`, the unwired `mappingSeparatorNodeStarts` call site, `raw.trim()` (still at `:2172`),
the `HEADER_INTRODUCTIONS` comment (`:758`, `:3135`), `unquoteChecked(p.intro)` (`:2068`) — is
byte-identical to the build round 11 reviewed.

**DISSOLVED is not FIXED, and each DISSOLVED row says so explicitly.** A reader who conflates them
would go looking for a repair that does not exist and might widen the parser a twelfth time.

## What was measured this session versus what is cited

**Re-measured at `bc267f9` / `111cba1`:**

| What | Result |
|---|---|
| `admit()` on **WR-01-r11's verbatim review document** (`27-REVIEW.md` lines 322-330) | `{ok:false, code:"block-scalar"}` — reason: *"line 4: a node starting at column 8 is introduced by `>` …"*. **Measured, not inferred from CR-01's corpus rows** |
| `AXIS_HEADER_INDICATOR_FORM.length` (WR-02-r11) | **3**; no `AXIS_HEADER_PARENT_OFFSET`, no explicit-digit axis — the item is unchanged |
| `tsconfig.tests.json` (WR-04-r11) | `git diff --quiet c842e81..bc267f9` exit **0** — byte-unchanged; `:22` still `"exclude": ["node_modules", ".tmp-build"]` |
| `scripts/generate-role-adapters.test.ts` (IN-02-r11) | `git diff --quiet` exit **0**; `:886` still `.startsWith("//")` only |
| The nine round-11 corpus rows and their declared codes | 4 × `block-scalar`, 5 × `node-property`, read from `scripts/canonical-corpus.js` |
| `DISTRIBUTION_PAIR_EXEMPT` | **1** member, `skills/grugops/SKILL.md` (`check-foundation-guards.ts:1716`) |
| Refusal codes the historical corpus never exercises | **12 of 23**, derived by subtracting the corpus's used-code set from `REFUSAL_CODES` |

**CITED, NOT RE-MEASURED — flagged for the verifier.** Three transcripts belong to the plan that
produced them and were not re-taken, because re-taking them means re-running a hermetic-mirror plant
sweep, which this plan's scope (one markdown file, no `scripts/` edit) does not carry:
`27-65`'s **79-row gate plant sweep**, `27-63`'s **91-row replay transcript and three mutation
probes**, and `27-64`'s **one-byte-drift fail-proof**. Their *assertions* re-execute inside this
round's closing suite and hold; their *transcripts* are their own summaries'. **"The assertions still
pass" and "the transcript was re-taken on the final build" are different claims**, and eleven rounds of
this phase were closed on the first while sounding like the second.

## The three requirement rows, quoted from disk, from BOTH places each appears

Read at `111cba1`, never from a line citation in any report.

**KIT-03 — checkbox, `.planning/REQUIREMENTS.md:58`:**

> `- [ ] **KIT-03**: A referential-integrity oracle asserts set equality between the coordinator's spawn grant, the adapter directory, and the role corpus — and **fails RED against today's tree** (1 adapter present, 7 names granted, 17 roles) before it is trusted.`

**KIT-03 — traceability status cell, `.planning/REQUIREMENTS.md:158`:**

> `| KIT-03 | Phase 27 | Gaps Found — held pending verification. Round 11 closed all three bypasses this row's FAILED status now rests on (27-55 CR-01-new / D-59, 27-56 CR-03 / D-60, 27-57 CR-02 / D-61), plus WR-01 / WR-02 / IN-01 (27-58 / D-62), each re-measured on the FINAL build ff68c31 and still closed (deferred-items.md § From 27-61 § 5, fifteen rows). Round 10's 27-51 / 27-52 closures likewise still hold. Held anyway: only a verification round may flip it (D-58 item 4). |`

**SPAWN-04 — checkbox, `.planning/REQUIREMENTS.md:65`:**

> `- [ ] **SPAWN-04**: Non-coordinator role adapters omit the `Agent` tool entirely — a mechanism that holds on both the main-thread and subagent paths, rather than relying on a frontmatter token the runtime ignores.`

**SPAWN-04 — traceability status cell, `.planning/REQUIREMENTS.md:162`:**

> `| SPAWN-04 | Phase 27 | Gaps Found — held pending verification, for the same reason as KIT-03 and by the same rule (D-58 item 4). Round 11's closures include the one bypass the round-10 verifier reproduced END TO END through the full gate (CR-02): the same plant now takes check-foundation-guards from exit 0 to exit 1 on both distribution twins, re-run on the FINAL build ff68c31 (deferred-items.md § From 27-61 § 4, plant P57). The UNKNOWN - verify platform bound on whether Claude Code honours a mapping under an allow-list key is UNCHANGED and no live platform escalation is claimed. Commit 47d7820 already reverted one premature flip of exactly this pair. |`

**SPAWN-03 — checkbox, `.planning/REQUIREMENTS.md:64`:**

> `- [ ] **SPAWN-03**: The coordinator is wired as the Claude Code **main-thread** agent so its `Agent(<allowlist>)` grant is honoured by the runtime — the current subagent placement makes the grant a no-op, since Claude Code ignores the type list inside a subagent definition.`

**SPAWN-03 — traceability status cell, `.planning/REQUIREMENTS.md:161`:**

> `| SPAWN-03 | Phase 27 | Gaps Found — the runtime half is DEFERRED to Phase 33 / GAP-D1 / CAP-01 and its status stays UNKNOWN - verify (user decision, ratified as D-56 item 10, recorded 2026-08-09 in deferred-items.md). Not fabricated as confirmed; not re-opened as a Phase-27 blocker. |`

**SPAWN-03's owner row, `.planning/ROADMAP.md:106`, byte-unchanged:**

> `| 1 | **GAP-D1** — one captured live dual-path run → flip A3/DOG-02 + the coupled `examples/03-ticket-to-pr.md` edit | 33 (CAP-01) |`

**THE PAIR ASSERTION: the checkbox and the status cell agree with each other, and with the round-11
verification's verdict, for `3` of `3` rows.** This is the check that catches a **half-promotion**,
where one rendering moves and the other does not — which is why both are read rather than one.

## The `git diff --exit-code` output over the two planning files

```
$ git diff --exit-code -- .planning/REQUIREMENTS.md .planning/ROADMAP.md
$ echo "EXIT=$?"
EXIT=0
```

No output, exit **0**: both files are byte-unchanged. Re-confirmed after both task commits.

```
$ grep -n '^- \[ \] \*\*KIT-03\*\*\|^- \[ \] \*\*SPAWN-04\*\*\|^- \[ \] \*\*SPAWN-03\*\*' .planning/REQUIREMENTS.md
58:- [ ] **KIT-03**: ...
64:- [ ] **SPAWN-03**: ...
65:- [ ] **SPAWN-04**: ...
```

All three still unchecked.

## The exemption count at round scope

**`DISTRIBUTION_PAIR_EXEMPT` holds exactly ONE member — `skills/grugops/SKILL.md` — before round 12
and after it.** Read from source at `scripts/check-foundation-guards.ts:1716` this session
(D-64 vacuity trap 3). **No exemption was added anywhere in this round to make a cell pass**, and
`27-64` (§ P3/P4) and `27-65` (its 1-before/1-after row) each assert this independently with their own
cases.

## The carry-forward list, with owners

Fifteen standing obligations are written into `deferred-items.md` § Part five, each with an owner, so
they survive a milestone archive move. The ones the plan named by requirement, plus the rest:

| Obligation | Owner |
|---|---|
| **SPAWN-03's live-platform capture** — `UNKNOWN - verify`, no static gate can produce it | **Phase 33** — GAP-D1 / CAP-01 |
| **KIT-03 and SPAWN-04 remain unflipped** | **the next verification round** |
| **The 12 corpus rows `27-65` could NOT plant at the gate** — the whole `no-opening-delimiter` delimiter family; proven at module level only; `79 + 12 = 91` asserted two-sided | **a later round** |
| **12 of 23 refusal codes are exercised by NO corpus row** — `no-closing-delimiter`, `empty-region`, `tab-in-region`, `control-character`, `bad-indentation`, `duplicate-key`, `dangling-empty-key`, `orphan-sequence-item`, `unbalanced-parentheses`, `unterminated-double-quote`, `embedded-double-quote`, `disallowed-escape` | **a later round** |
| **The canonical form is a NARROWING** — 2 of 7 legitimate spellings survive; live cost zero, latitude gone | **a later round** |
| **554 of 575 out-of-scan frontmatter files would REFUSE** — a hard constraint on anyone widening `spawnGrantScan`; no exemption added | **anyone widening the scan** |
| **Two named diagnostic losses at the cutover** — the duplicate-key count, per-document multi-finding reporting | **a later round** |
| **`freshness:queue` and `freshness:traceability` named by NO CI step**; the workflow comment is wrong by three | **a later round** |
| **`27-64`'s unreachable empty-regeneration branch** — `UNKNOWN - verify`, no transcript fabricated | **a human / a later round** |
| **`27-62`'s false-red cost unmeasured over future content** | **a later round** |
| **A multi-document stream reads the FIRST region only** — recorded, not escalated | **a later round, only with a measurement** |
| **44 of 91 corpus rows carry NO loader verdict** — `UNKNOWN - verify` stands; not repairable without a fabricated citation | **nobody — recorded** |
| **Whether Claude Code honours a *mapping* under `allowed-tools:`** — `UNKNOWN - verify`, unchanged from rounds 10 and 11 | **Phase 33** |
| **The two `WR01_FALSE_RED_FORMS` documents** — excluded as false reds in the safe direction, NOT filed as closures | **a later round** |
| **Every DEMOTED and OPEN row** — WR-02-r11, WR-03-r11, WR-04-r11, IN-01-r11, IN-02-r11, IN-03-r11 | **a later round** |

Plus one **new, deliberate non-edit** recorded with its owner: **KIT-03's and SPAWN-04's status
narratives are stale.** They name round 11's closures and describe the parser being *repaired* — which
D-64 retired. They were not updated because this plan's verify gate is `git diff --exit-code` over both
planning files, and rewriting a narrative then asserting "only the narrative moved" is a weaker
guarantee than changing nothing. **Owner: the next verification round.**

## The round's closing suite and gate results

| Command | Result |
|---|---|
| `node scripts/check-foundation-guards.js` | **exit 0** |
| `node scripts/adapters-freshness.js` | **exit 0** |
| `node scripts/skill-twins-freshness.js` | **exit 0** |
| `node scripts/coordinator-resolution-precheck.js` | **exit 0** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1409 passed / 2 skipped across 39 files, exit 0** |
| `git diff --exit-code -- .planning/REQUIREMENTS.md .planning/ROADMAP.md` | **exit 0** |
| `package.json` byte-unchanged (T-27-SC) | **YES** — no package installed |
| files touched by this plan | **1** — `deferred-items.md` |

Bare `npm test` was **never** run: it triggers a live claude-CLI lane that spends tokens and can hang.

### THE SUITE IS A FLOOR

**The 1409-passing suite above is a FLOOR and is NOT offered — here or anywhere in the register — as
evidence that any bypass family is closed.** Eleven consecutive review rounds ended with a live bypass
while the suite was green, and rounds 10 and 11 each shipped a regression inside their own fix. The
closure evidence for this round is the **transcripts and the gate exit codes recorded by plans `27-62`
through `27-65`** — the per-part admission breakdown over the 33-file live scan, the 91-row replay with
its premise control, the widening sweep with every moved row named, the three mutation probes, the twin
byte-gate fail-proof, and the 79-row end-to-end plant sweep with the refusal text read from the guard's
own stdout — together with the four gate exit codes re-measured above. Never the green line.

## Deviations from Plan

**None affecting scope or outcome.** Two judgement calls the plan explicitly delegated, recorded so
they are visible:

1. **The plan permitted a status-narrative update and preferred byte-unchanged rows. Byte-unchanged
   was chosen**, and the staleness recorded as an owned carry-forward instead. Rationale is in the hold
   and repeated above.
2. **The plan asked for "its own honest class" for items neither FIXED nor DISSOLVED. Two were needed,
   not one** — DEMOTED (still true, module demoted) and OPEN (still true, module never demoted, e.g.
   `tsconfig.tests.json` and the adapter generator's test harness). Folding IN-02-r11 and WR-04-r11
   into DEMOTED would have implied the mirror-spawn freshness pattern was demoted, which is the
   opposite of what D-64 Part B did to it. A third class, SUPERSEDED, was needed for the three
   `missing` entries, which are prescribed remedies rather than defects.

No auto-fix rule was invoked. No architectural question arose.

## Known Stubs

None.

## Threat Flags

None. This plan created no network endpoint, no auth path, no file-access pattern and no schema at a
trust boundary. It edited one markdown record.

## Self-Check: PASSED

- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND (3535 lines; § *Round 12 disposition register* and § *Part six* both present, 13 register rows)
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-66-SUMMARY.md` — FOUND
- commit `111cba1` — FOUND
- commit `db20e74` — FOUND
- `.planning/REQUIREMENTS.md` — byte-unchanged, `git diff --exit-code` exit 0
- `.planning/ROADMAP.md` — byte-unchanged, `git diff --exit-code` exit 0
- control bytes (excl. TAB/LF) in `deferred-items.md` — **0**; `file -b` reports `Unicode text, UTF-8 text`, so the artifact is not binary-classified and is grep-visible (the failure `8d8187e` had to repair in `27-63-SUMMARY.md`)
