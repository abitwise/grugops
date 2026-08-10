---
phase: 27-spawn-correctness-kit-set-authority
plan: 62
subsystem: frontmatter-safety
tags: [D-64, canonical-form, admission-reader, KIT-03, SPAWN-04, gap-closure-round-12]
status: complete
requires:
  - "scripts/frontmatter.ts stripFencedBlocks (the ONE fence authority)"
  - "scripts/frontmatter.ts DQ_ESCAPE_ALLOWLIST (the proven escape alphabet)"
  - "scripts/kit-model.ts spawnGrantScan + SPAWN_GRANT_SCAN_PARTS (the ONE scan authority)"
provides:
  - "scripts/canonical-frontmatter.ts — the canonical-form admission reader (D-64 Part A)"
  - "REFUSAL_CODES — the 23-member enumerated refusal vocabulary, catch-all-free"
  - "CANONICAL_SCHEMA / PLAIN_SCALAR_ALPHABET / DOUBLE_QUOTED_KEYS / GRANT_KEYS / LINE_PRODUCTIONS"
  - "admit() / admittedHasSpawnGrant() / admittedGrantedNames() / admittedGrantValues()"
affects:
  - "27-63 (the rounds-1-11 historical corpus replays against this refusal vocabulary)"
  - "27-65 (the guard cutover, behind its own decision checkpoint — NOT done here)"
tech-stack:
  added: []
  patterns:
    - "admission over interpretation: a restricted canonical shape is ADMITTED, every other byte REFUSED by a named code"
    - "enumerate-the-good at the document level (the D-30 inversion applied to the whole plain-scalar value space)"
    - "one refusal helper, so `ok: false` appears exactly once in the admission core and the count is asserted from source"
    - "refusal-only node-start pre-pass: it can add refusals, never admit, so it cannot disagree with the production pass in the unsafe direction"
key-files:
  created:
    - scripts/canonical-frontmatter.ts
    - scripts/canonical-frontmatter.js
    - scripts/canonical-frontmatter.test.ts
  modified: []
decisions:
  - "D-64 Part A implemented as a NEW module. scripts/frontmatter.ts and scripts/check-foundation-guards.ts are both BYTE-UNCHANGED by this plan (asserted below)."
  - "The admitted grammar follows the MEASURED corpus, not D-64's prose: ten keys not eight, and a restricted double-quoted arm D-64's premise measurement never scanned for."
  - "The plain-scalar alphabet closes the two open classes the corpus samples (all ASCII letters, all ASCII digits) and enumerates punctuation EXACTLY as measured."
  - "Parenthesis balance is an ADMISSION invariant, not a grant-predicate check, so the grant predicates are total and cannot refuse — no third outcome by another name."
metrics:
  duration: 22m
  completed: 2026-08-10
actuals:
  tokens: 23782
  tasks: 3
  commits: 3
---

# Phase 27 Plan 62: Canonical-Form Admission Reader Summary

A new module, `scripts/canonical-frontmatter.ts`, renders the spawn-relevant frontmatter verdict by
ADMITTING a restricted canonical shape and REFUSING every other byte under one of 23 enumerated
codes — deleting the silent-no-grant arm by construction rather than patching its twelfth spelling.

## What was built

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (tracer) | the canonical admission reader, one path end to end | `5b14ee7` | `scripts/canonical-frontmatter.ts`, `scripts/canonical-frontmatter.js` |
| 2 | two-sided cardinality over the live scan | `c37ff77` | `scripts/canonical-frontmatter.test.ts` (+ two Rule-3 module edits) |
| 3 | the refusal vocabulary is complete, named, catch-all-free | `54cccb2` | `scripts/canonical-frontmatter.test.ts` (+ one structural module move) |

`admit(text)` returns exactly two arms and no third:

- `{ ok: true, value: <ordered key/value map> }`
- `{ ok: false, code: <member of REFUSAL_CODES>, reason: <names the line and the offending byte> }`

Every decline routes through a single `refuse()` helper, so the literal `ok: false` appears **exactly
once** in the whole admission core — and that count is asserted from the source at run time, not
claimed in a comment.

## THE GREEN SUITE IS A FLOOR

Stated plainly, because this phase has confused a floor with closure eleven times: **the green suite
below is a FLOOR and is not offered as evidence that any bypass family is closed.** Eleven
consecutive review rounds ended with a live bypass while the suite was green, and rounds 10 and 11
each shipped a regression inside their own fix. The closure evidence offered here is the printed
admission transcript over the live scan, the printed refusal codes and refusal texts, the three
mutation probes that prove the new cases can fail, and the 420-cell loader differential — not the
green line.

## Transcript: the per-part admission breakdown over the live scan

```
canonical-frontmatter: derived spawn-grant scan = 33 member(s)
canonical-frontmatter: composition = agent 17 + skill 7 + plugin-skill 7 + packaging 2 = 33 (SPAWN_GRANT_SCAN_COUNT 33)
canonical-frontmatter: ADMITTED 33/33 live files — agent 17 + skill 7 + plugin-skill 7 + packaging 2
canonical-frontmatter: key union = allowed-tools, argument-hint, coordinator, description, disable-model-invocation, kind, model, name, tier, tools (10)
canonical-frontmatter: line productions in use = `  - item`, `key:`, `key: value`
canonical-frontmatter: 31 double-quoted scalar(s) on exactly 2 key(s): argument-hint, description
canonical-frontmatter: 87 grant-key value(s) across the live corpus, 0 quoted
canonical-frontmatter: 1 grant-carrying live file, 16 enumerated name(s)
canonical-frontmatter: narrowed-schema floor — dropping `model` REFUSES 17/33 live files by `unknown-key`
canonical-frontmatter: 23/23 refusal codes reached by a construct-specific document
canonical-frontmatter: admission core scanned = 9645 non-space chars, 26 refuse() literal site(s) + 12 sigil-table site(s) = 38 assignments over 23 distinct codes, 1 `ok: false`, 0 default branches
```

The non-empty floor is its own named passing case and runs **first**, so a scan that derived nothing
cannot be reported as "all files admitted". The corpus side of every derivation is read through
`spawnGrantScan` from `scripts/kit-model.js` — there is no directory listing anywhere in the test
file.

The narrowed-schema floor is what makes "33/33 admitted" informative: narrowing a **copy** of the
schema by one member (`model`), and passing it back through `admit`'s intersect-only option, makes
the same loop over the same live corpus refuse 17 of 33 files by `unknown-key`. The copy is asserted
to genuinely differ from the exported constant before it is used, so a no-op narrowing cannot
produce a convincing green.

## Transcript: CR-01 and CR-02, DISSOLVED into named loud refusals

All four documents are taken verbatim from `27-REVIEW.md` (round 11).

**CR-01 row A** — the round-11 regression, `>-2` at a bare header under a dash:

```
[block-scalar] line 5: a node starting at column 5 is introduced by `>`, which opens a folded block
scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every
other node, so there is no indentation to compute and no second recogniser site to forget
```

**CR-01 row B** — bare `>-` under a dash, no explicit digit:

```
[block-scalar] line 5: a node starting at column 5 is introduced by `>`, which opens a folded block
scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every
other node, so there is no indentation to compute and no second recogniser site to forget
```

**CR-02** — an alias reaching a grant through a sequence item's compact mapping:

```
[node-property] line 4: a node starting at column 8 is introduced by `&`, which opens a YAML anchor;
the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so
there is no indentation to compute and no second recogniser site to forget
```

**CR-02's dash-less control** — the identical alias one spelling over:

```
[node-property] line 4: a node starting at column 8 is introduced by `&`, which opens a YAML anchor;
the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so
there is no indentation to compute and no second recogniser site to forget
```

The two spellings that diverged for eleven rounds — one refused loudly, one read as "carries no
grant" — now land on **one answer, at one code, with one reason**. Neither is patched: there is no
indentation landmark in this module to compute from the wrong node, and no second `blockHeaderAt`
call site to forget, because block scalars and node properties are refused outright wherever a node
starts.

## The measured divergence from D-64's premise

D-64 Part A specifies an **eight-key, plain-only** alphabet. Implementing that literally would
**refuse the live kit**, which D-64's own vacuity trap 1 forbids. The grammar therefore follows the
corpus, and the divergence is recorded here as a measurement with the command that produced it.

Command (run from the repo root against the committed `.js`):

```bash
node --input-type=module -e "
import fs from 'node:fs'; import path from 'node:path';
const km=await import('./scripts/kit-model.js'); const fm=await import('./scripts/frontmatter.js');
const root=process.cwd(); const scan=km.spawnGrantScan(root);
if (scan.length===0) throw new Error('PREMISE FAILED: empty scan');
const keys=new Set(), dq=new Map(); let dqCount=0;
for (const rel of scan) {
  const lines=fm.stripFencedBlocks(fs.readFileSync(path.join(root,rel),'utf8')).split('\n');
  let close=-1; for(let i=1;i<lines.length;i++) if(lines[i]==='---'){close=i;break;}
  for (const line of lines.slice(1,close)) {
    const m=/^([A-Za-z_][A-Za-z0-9_-]*):(?: (.*))?\$/.exec(line);
    if(!m) continue; keys.add(m[1]);
    if((m[2]??'').startsWith('\"')){ dqCount++; dq.set(m[1],(dq.get(m[1])??0)+1); }
  }
}
console.log('files',scan.length,'keys',keys.size,[...keys].sort().join(','));
console.log('double-quoted',dqCount,[...dq].sort().map(([k,v])=>k+':'+v).join(' '));
"
```

| quantity | D-64's premise | measured this session | consequence if D-64 were implemented literally |
|---|---|---|---|
| files scanned | 31 | **33** (the two `agent-factory/packaging/*.md` templates were omitted) | — |
| distinct keys | 8 | **10** (`kind` and `tier` live only on the two omitted templates) | both packaging templates REFUSED on `unknown-key` |
| double-quoted scalars | never scanned for | **31**, on exactly **2** keys — `description` 17, `argument-hint` 14 | 31 of 33 live files REFUSED |
| quoted values on a grant key | — | **0** | — |

The reconciliation: the schema is ten keys, and the value grammar carries a restricted double-quoted
arm admitted on `description` and `argument-hint` **and nowhere else**. Neither of those is a grant
key, so the double-quoted escape alphabet — the whole D-30 attack family — sits permanently outside
the path that renders a spawn verdict. That the grant keys are plain-only is measured true on the
live corpus today: **0 quoted values across 87 grant-key values**.

The plain-scalar alphabet is derived from the same measurement: the corpus uses 49 distinct
characters (SPACE, `( ) , - . ;`, the digit `2`, letters, U+2014 EM DASH). The constant closes the
two open **classes** the corpus samples — every ASCII letter and every ASCII digit, so a future role
named `grugops-zebra` does not red the gate for a reason unrelated to safety — and enumerates the
punctuation exactly as measured, adding nothing the corpus does not spell. Every YAML-significant
byte is absent from it.

## Adversarial evidence: the probes and the loader differential

**Three mutation probes**, each on a hermetic `git archive HEAD` mirror, each asserting the build's
exit code and confirming the mutation reached the built `.js` before believing any result. The
unmutated control mirror runs 16/16 green.

| probe | mutation | result |
|---|---|---|
| P1 | a 24th code added to `REFUSAL_CODES` with no document | build 0; RED **twice**, naming `probe-orphan-code` at the reachability case and at the source-assignment case |
| P2 | a second `ok: false` introduced inside the admission core | build 0; RED — "the literal `ok: false` must appear exactly once … expected 2 to be 1" |
| P3 | the `[">", "block-scalar"]` row deleted from the sigil table | build 0; RED at CR-01 row A **and** row B, and at the reachability case |

P3 also demonstrates the module's defence in depth, and it is worth recording precisely: with `>`
removed from the sigil table, CR-01 rows A and B are **still REFUSED** — as `unrecognized-line`, not
`block-scalar`. The alphabet and the line productions refuse independently of the sigil table. Two
loud refusals, and no path between them that admits.

**A 420-cell loader differential** against `/usr/bin/ruby -ryaml`: 21 value spellings × 5
prologue/delimiter frames × 2 grant keys × 2 anchor contexts, each adjudicated by libyaml.

```
corpus: 420 documents
ADMITTED 12, REFUSED 408
refusal code histogram:
   36  block-scalar        132  node-property        12  quoted-on-plain-only-key
   12  flow-collection       6  plain-scalar-charset 12  scalar-padding
  168  no-opening-delimiter  6  single-quoted        12  tab-in-region
                                                     12  unbalanced-parentheses
ADMITTED and reporting a grant: 12
UNSAFE (module ADMITTED + no grant, loader reads a grant): 0
```

The only unsafe direction — the module ADMITS a document, reports no grant, and the loader reads one
in the loaded value — is **empty at 0 cells**. All 12 admitted documents report the grant they carry.
Every other cell is a named refusal, which is never the unsafe direction.

## Verification

| check | result |
|---|---|
| `npm run build` | exit 0 (asserted at every task, before any test result was believed) |
| `npm run freshness` | exit 0 — "All build outputs fresh: 33 committed .js file(s) match a fresh tsc rebuild" |
| `npx vitest run scripts/canonical-frontmatter.test.ts --exclude '**/scripts/e2e/**'` | **16 passed (16)** |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full suite) | **1362 passed / 2 skipped across 36 files** — a FLOOR |
| `npm run typecheck` (both lanes) | exit 0 |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `scripts/frontmatter.ts` / `.js` byte-unchanged | **YES** — `git diff c842e81..HEAD -- scripts/frontmatter.*` is empty |
| `scripts/check-foundation-guards.ts` / `.js` byte-unchanged | **YES** — same diff, empty |
| `package.json` / `package-lock.json` byte-unchanged | **YES** — T-27-SC satisfied; **no dependency installed by this plan** |

Note on the validator: it exits 1 with `VALIDATE_KIT_ROOT is unset — refusing to default the kit root
to '.' (C3)` and exits 0 with the variable set. That is a pre-existing environment precondition of
that script, unrelated to this plan, which touches no file it reads.

## Deviations from Plan

### Auto-fixed / structural

**1. [Rule 3 — blocking] `AdmittedValue` records whether a scalar was written quoted**
- **Found during:** Task 2
- **Issue:** the behaviour list requires asserting, over the live corpus, that the set of keys
  carrying a double-quoted value equals `DOUBLE_QUOTED_KEYS` exactly and that zero grant-key values
  are quoted. That fact is not recoverable from the resolved text (`description: "a"` and
  `description: a` resolve identically), so the test would have had to re-read the raw region and
  derive the quoting a second time — the second-grammar drift the plan explicitly forbids in that
  file.
- **Fix:** the scalar arm gained `quoted: boolean` and the sequence arm `quotedItems: boolean[]`. The
  admitted document is a faithful image of what was written, and the quoting is part of that image.
- **Commit:** `c37ff77`

**2. [Rule 3 — blocking] `admit` takes an intersect-only schema option**
- **Found during:** Task 2
- **Issue:** the plan's non-vacuity floor requires narrowing a **copy** of the schema and showing the
  admission loop then refuses a live file — hermetically, without mutating the module. With the
  schema read from a module constant there was no way for the test to exercise the real loop under a
  narrowed schema.
- **Fix:** `admit(text, { schema })` computes the effective schema as the **intersection** of
  `CANONICAL_SCHEMA` with whatever is passed. It can only ever narrow, by construction — there is no
  validation branch and therefore no error path and no third outcome.
- **Commit:** `c37ff77`

**3. [Rule 1 — bug, found by this plan's own assertion] the node-start sigil table sat outside the
bounded source region**
- **Found during:** Task 3
- **Issue:** the source assertion's first draft extracted only `refuse("...")` literals and **FAILED
  red**, naming five codes — `block-scalar`, `node-property`, `flow-collection`, `single-quoted`,
  `reserved-indicator`. Those five are assigned by the `REFUSED_NODE_SIGILS` data table, because the
  pass-2 call site passes a variable, and the table sat outside the `ADMISSION-CORE` markers. A
  completeness claim over the core was silently omitting an entire assignment mechanism.
- **Fix taken:** the table was moved **inside** the marked region and the extraction was widened to
  derive both assignment mechanisms from the source — rather than weakening the assertion to
  accommodate the hole it had just found. The reason is recorded at the table's declaration site.
- **Commit:** `54cccb2`

**4. [housekeeping] `.planning/STATE.md` current-position line corrected**
- The SDK's `state.advance-plan` derived `Plan: 2 of 66` from a counter the init call had reset. It
  was corrected to `Plan: 62 of 66`. No other STATE field was hand-edited.

### Not deviations, recorded for the next reader

- No checkpoint was reached; the tracer's `<verify>` was re-run end to end and passed before any
  expansion task began.
- `agent-factory/packaging/adapters.md` is deliberately **not** in the scan (the composition carries
  exactly 2 packaging templates). Nothing here changes that.

## Known Stubs

None. The module is complete for what D-64 Part A specifies. It is, by design, **not wired into any
gate** — that cutover is 27-65's, behind its own decision checkpoint — and that is a plan boundary,
not a stub.

## Residuals and UNKNOWNs, stated rather than smoothed over

1. **False-red cost of the strict plain-scalar alphabet is UNMEASURED at the gate.** It is measured
   **zero over the 33 live scanned files** today. It is not measured over hypothetical future
   content: a hand-written skill `description` containing an apostrophe, a colon, a slash or a `?`
   would be refused on `plain-scalar-charset` unless it is quoted. The safe direction here is a loud
   false red, and `description` is one of the two keys that may be quoted, so the escape hatch
   exists. **`UNKNOWN - verify`:** the false-red cost across the whole tracked-markdown corpus is not
   measured here because this module governs the spawn-grant scan only; 27-65 owns that measurement
   when the cutover is proposed.
2. **A multi-document stream reads the FIRST region only**, unchanged from `frontmatter.ts`'s
   dispositioned IN-05. This module refuses far more of what precedes a region (a BOM, a directive,
   leading residue all land on `no-opening-delimiter`), but a second document after a closed region
   is body text to it. Recorded, not escalated: it is not claimed as a bypass and must not be
   escalated into one without a measurement.
3. **This module votes on nothing yet.** No guard, no gate and no installer calls it. Its safety
   properties are properties of a module, not of the shipped kit, until 27-65.

## Self-Check: PASSED

- `scripts/canonical-frontmatter.ts` — FOUND
- `scripts/canonical-frontmatter.js` — FOUND
- `scripts/canonical-frontmatter.test.ts` — FOUND
- commit `5b14ee7` — FOUND
- commit `c37ff77` — FOUND
- commit `54cccb2` — FOUND
