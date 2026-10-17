---
phase: 27-spawn-correctness-kit-set-authority
plan: 55
subsystem: frontmatter-authority
tags: [spawn-correctness, kit-03, spawn-04, yaml, safety-invariant, gap-closure-round-11]
status: complete
requires:
  - "scripts/frontmatter.ts — D-57's three-position block-scalar header recognition (27-52)"
  - "scripts/check-foundation-guards.ts — guard_wr05 / guard_referential_integrity / guard_distribution_pair"
provides:
  - "region-scoped block-scalar quoting exemption (D-59)"
  - "assertFoldTargetIsNotBlockOwned — the fold's region-identity invariant"
  - "the region-kind x escape-kind x spelling union axis (72 cells, loader-adjudicated)"
affects:
  - "every guard that reads a frontmatter grant verdict"
tech-stack:
  added: []
  patterns:
    - "a per-region record replaces a per-key flag; the fact is stored ON the thing it describes, which dissolves the handle-stability question rather than answering it"
    - "the resolution unit is the maximal RUN of like-kind regions, so a key with no block scalar is byte-identical to the prior build (D-33 preserved)"
    - "an axis derived from the module's own vocabulary (DQ_ESCAPE_ALLOWLIST) with a liveness case proving the derivation is not a transcription"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
decisions:
  - "D-59 — the block-scalar quoting exemption is a property of the REGION the scalar covers; the sticky per-key flag is DELETED, not tuned"
  - "The plan's PREFERRED disposition (i) was implemented, MEASURED, and REJECTED: it contradicts D-33 and moved two shipped values"
  - "The resolution unit is the maximal run of like-kind regions — a run boundary is a change of kind"
  - "The block header's `key:` introduction is validated through unquoteChecked rather than exempted, even though today's KEY_LINE alphabet makes that a provable no-op"
metrics:
  duration: "~35 min"
  completed: "2026-08-10"
  tasks: 2
  commits: 2
actuals:
  tokens: 23200
  tasks: 2
  commits: 2
---

# Phase 27 Plan 55: Region-Scoped Block-Scalar Quoting Exemption Summary

D-57's block-scalar quoting exemption lived on a sticky per-key flag, so two unrelated lines could
switch off the D-30 escape refusal for an entire key; the flag is deleted and the exemption now
belongs to the region the block scalar actually covers.

## The finding, and what closed it

**CR-01-new** is a **scope** bug, not a condition bug: a *key* property standing in for a *region*
property, shipped inside round 10's own fix. Measured on the committed build `3c7930b`, with the
loader column from `/usr/bin/ruby -ryaml` (ruby 2.6.10 / psych 3.1.0 / libyaml 0.2.1):

- `tools:` / `  a: "\x41gent(grugops-orchestrator)"` — **REFUSED**, naming `\x`.
- the same document plus `  b: >-` / `    x` — **`{"ok":true,"value":false}`**, while the loader reads
  `{"a"=>"Agent(grugops-orchestrator)","b"=>"x"}`. A live grant, reported as "carries no grant".

The module's own asymmetry named the remedy: the block-sequence **item** path resolved each item at
the point it was pushed and therefore still refused, while only the nested-mapping **continuation**
path deferred to the flush. One document, two spellings, two verdicts.

`Accumulator.parts` is now `Part[]` — a list of regions, each carrying its own answer to "is this
text a block scalar's content", plus the `key:` introduction as a separate field because that text is
outside the scalar. The flush walks **maximal runs of like-kind regions**: a block-owned run is
exempt, every other run answers to `unquoteChecked`. The sticky flag no longer exists.

## The disposition, and why the plan's preferred one was rejected

Disposition **(i)** — resolve at the point of effect on the continuation path, deleting the flush's
quoting decision entirely — was implemented **first** and measured. It cannot preserve the
folded-continuation join byte-for-byte, which is the exact condition the plan names for the fallback,
and it contradicts **D-33** (the unquote runs on the JOINED value so YAML's line folding meets this
module's join). It moved two shipped values: `tools:` / `  - Read` / `  -` / `    "Write,` /
`    # x, Agent(…)"` flattened to `Read, Write, # x, Agent(…)` where every build since D-51 flattens
it to `Read, "Write, # x, Agent(…)"`, because the second region **alone** is a wholly-quoted scalar
while the joined value is not.

Disposition **(ii)** landed, with the resolution unit stated as the maximal run. A run boundary is
precisely a change of kind, so a key carrying no block scalar has exactly **one** run and is
byte-identical to the pre-D-59 flush.

**The region-identity question is dissolved rather than answered, and the SUMMARY says so plainly.** A
per-region fact needs a stable handle only when it is stored *apart* from the region — an index into
`parts`, a set of owned offsets — and then that handle's stability becomes a property somebody must
keep proving as the flattener grows. Storing the fact **on** the region removes the question: the flag
travels with the text it describes through every push, fold and join, so no reordering or splice could
invalidate it even if one were introduced. The supporting invariant is asserted anyway, at two levels:
`assertFoldTargetIsNotBlockOwned` throws at the one site a region is mutated after being pushed, and a
case pins that no path in `flattenBlock` splices, reorders, removes, sorts or pops an already-pushed
region, with the push-site count fixed at 4 so a fifth arrives loudly.

## Evidence

Every transcript below is recorded verbatim in
`.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` § **From 27-55**. The
short form:

| Evidence | Result |
|---|---|
| RED/GREEN U-row table with the loader column | **3** of 10 rows moved (U1, U4, U5), all from the silent no-grant arm to a named refusal; **7** byte-identical, including U2's reason string |
| Gate plant, U1's shape in the EXISTING `allowed-tools:` key of BOTH twins of the non-coordinator `plan` skill | pre-fix **exit 0** (`ALL CHECKS PASSED` over a live grant) → post-fix **exit 1** (`2 CHECK(S) FAILED`) |
| Twins named, counted over the FAILURE block only | **2** |
| False-red controls (unplanted mirror pre-fix, unplanted mirror post-fix, real tree post-fix) | **exit 0** on all three |
| Repository-wide value map over `git ls-files '*.md'` | **1170** files, **0** moved, **0** new refusals, **0** lifted |
| Union axis, post-fix | 72 cells, 3 loader-rejected (skipped, printed), 69 adjudicated, both never-exemptible partitions **empty**, loud arm **3** |
| Union axis, pre-fix mirror `3c7930b` | silent-no-grant **1**, module-grant-loader-none **0** — the axis provably sees the defect |
| Mutation control (region-scoping reverted alone, rebuilt) | **6** cases red, each naming its own assertion |
| Adversarial passes (a) and (b), 20 probes | **0** never-exemptible disagreements post-fix; **13** on the pre-fix build |
| `npm run freshness`, `npx tsc --noEmit`, `check-foundation-guards`, `adapters-freshness`, `coordinator-resolution-precheck`, `context-freshness` | all **exit 0** |

**The regression suite is a FLOOR, not the closure evidence.**
`npx vitest run --exclude '**/scripts/e2e/**'` reports **1302 passed | 2 skipped | 0 failed**. A green
suite proves nothing about a safety invariant; the closure evidence is the gate plant, the
pre-fix-mirror non-circularity result, the mutation control and the two adversarial passes.

## What the adversarial passes found

**Pass (b) found a real residual and closed it rather than reporting it.** The `key:` a nested header
prints in front of the scalar was *inside* the exemption under D-57, and would have stayed inside it
under a naive one-flag-per-region fix, because the introduction was stored as the first bytes of the
block region's own body. It is now a separate field routed through `unquoteChecked`. Today's
`KEY_LINE` key alphabet (`[A-Za-z_][A-Za-z0-9_-]*`) makes that validation a provable no-op, so no
document's value moves; it is checked anyway so the rule does not rest on an alphabet declared two
hundred lines away.

Pass (a) found nothing new and is recorded with its starting question and its shapes anyway.

**One harness lesson worth carrying.** The first mutation-control attempt PASSED — for a harness
reason, not a code reason: vitest resolves the test file's `./frontmatter.js` import to the
**committed `.js`**, so mutating only the `.ts` mutated nothing the suite could see. The control was
only real after `npm run build`. This is the "assert the verification harness's own premise" lesson
producing a false result for the seventh time in this phase; it is written into the ledger entry so
the next round does not pay for it again.

## Deviations from Plan

**1. [Rule 1 — Bug] The plan's PREFERRED disposition (i) was implemented, measured red against two
shipped assertions, and replaced by disposition (ii).**
- **Found during:** Task 1, after the first build.
- **Issue:** individual-region resolution contradicts D-33 and moved two shipped values.
- **Fix:** the resolution unit became the maximal run of like-kind regions.
- **Why this is not a deviation from intent:** the plan names this exact condition as the trigger for
  the fallback ("if (i) cannot preserve the folded-continuation join byte-for-byte"). The choice and
  the rejected alternative are recorded as **D-59** with the measurement, as the plan requires.
- **Commit:** `8a2f435`

**2. [Rule 2 — Missing critical functionality] The block header's `key:` introduction was inside the
exemption and is now validated.**
- **Found during:** Task 2, adversarial pass (b), probe b7.
- **Issue:** the introduction is not inside the scalar, so the plan's own prohibition ("every value
  that is not inside a block scalar answers to the existing checked-unquote path byte for byte")
  required it to be checked. It was not.
- **Fix:** `Part.intro` is a separate field, resolved through `unquoteChecked` at the flush.
- **Commit:** `8a2f435`

**3. [Housekeeping] `MODULE_SYMBOLS` updated.** `sawBlock` was not added (a name the module no longer
declares passes vacuously); `interface Part`, `regionText` and `assertFoldTargetIsNotBlockOwned` were.
The entry is spelled `interface Part` rather than `Part` because a four-letter needle matched the
corpus generator's own prose and would have failed the non-circularity pin for a reason unrelated to
circularity. **Commit:** `8a2f435` / `7b1fc9f`

**4. [Process] The tracer feedback gate was satisfied by re-running the automation rather than by
emitting a checkpoint.** `27-55` declares `autonomous: true` and carries no `checkpoint:*` task; Task
1's `<verify>` is four `<automated>` entries, all re-run end-to-end and green before Task 2 began. The
checkpoint protocol states that users never run CLI commands, so a `checkpoint:human-verify` whose
entire content is four CLI commands would violate the protocol it is issued under. Recorded here so
the choice is visible rather than silent.

## Known Stubs

None. No stub, placeholder, TODO or skipped test was introduced. The two pre-existing suite skips are
unrelated to this plan and unchanged.

## Threat Flags

None. This plan introduced no network endpoint, no auth path, no new file access pattern and no schema
change. `T-27-55-01` through `T-27-55-05` are all mitigated and evidenced above; `T-27-55-SC` stands as
accepted — no package-manager install ran and no dependency changed.

## Still OPEN, with a named owner

| Item | Owner |
|---|---|
| The union axis's spelling arm places the block sibling only AFTER the payload, so block-BEFORE ordering is outside its shape space (covered instead by the U4 case and probes a4/a6/a7) | a later round — add an ORDERING member to `AXIS_SPELLING` |
| The pre-fix-mirror non-circularity count is **1 of 72** — non-empty, so the axis provably sees the defect, but thin, and stated rather than presented as a margin it is not | the same later round |
| `27-49` WR-04 residual, `27-50` R1 residual, `27-53` fence-classifier floor, `toggle[1]` sensitivity | carried, unchanged — `27-55` touched no exemption machinery, no fence classifier and no toggle |
| KIT-03 and SPAWN-04 stay `[ ]` / `Gaps Found` | the next verification round for phase 27 (D-58 item 4 — an executing plan never promotes a row because its own tasks targeted that requirement's defect) |

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND
- `scripts/frontmatter.js` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-CONTEXT.md` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md` — FOUND
- commit `8a2f435` — FOUND
- commit `7b1fc9f` — FOUND
