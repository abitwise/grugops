---
phase: 27-spawn-correctness-kit-set-authority
plan: 63
subsystem: frontmatter-safety
tags: [D-64, canonical-form, historical-corpus, replay, KIT-03, SPAWN-04, gap-closure-round-12]
status: complete
requires:
  - "scripts/canonical-frontmatter.ts admit() + REFUSAL_CODES (the admission reader from 27-62)"
  - "the eleven review artifacts of rounds 1-11, plus the loader-adjudicated axis tables in scripts/frontmatter.test.ts"
provides:
  - "scripts/canonical-corpus.ts — 91 reproduced bypass shapes as cited, count-asserted data"
  - "CORPUS / CORPUS_COUNT / ROUNDS / rowsByRound() / rowById() / citedSources() / unresolvedSources()"
  - "scripts/canonical-corpus.test.ts — the replay, the completeness pins and the widening fail-proof"
  - "scripts/canonical-frontmatter.ts admitUnderProofWeakeningOnly() — the named proof-only widening entry point"
affects:
  - "27-65 (the guard cutover plants rows from THIS corpus by id, so the module-level and gate-level replays cannot disagree about which bytes were tested)"
tech-stack:
  added: []
  patterns:
    - "the corpus is an ARTIFACT with provenance: every row cites round, finding id and source path, and every path is asserted to resolve"
    - "the count constant lives in the file that owns the data and throws at module load on disagreement"
    - "one derived iteration replays every row; no hand-enumerated case per shape"
    - "the fail-proof widens a COPY through a named proof-only entry point, never the module on disk, and asserts the copy differs before believing it"
key-files:
  created:
    - scripts/canonical-corpus.ts
    - scripts/canonical-corpus.js
    - scripts/canonical-corpus.test.ts
  modified:
    - scripts/canonical-frontmatter.ts
    - scripts/canonical-frontmatter.js
decisions:
  - "The corpus records THREE kinds — bypass (85), control (4) and divergence (2) — so a control that already refused and a module-grant/loader-none divergence are never counted as silent no-grants."
  - "Every row declares its expected refusal code, derived by hand from the grammar BEFORE the reader was run. All 91 matched on the first execution; the expectations are not a transcription of the actuals."
  - "The plan's task-3 premise that each widening produces ADMITs is FALSIFIED by measurement and reported as such: the block-scalar widening moves 7 named rows and admits 0, because the reader refuses in two independent places. The node-property widening admits 4."
  - "The proof-only widening entry point is a separately named export outside the admission core; `admit`'s signature — the one 27-65 wires into the guard — gains no widening knob, and a derived tree-wide scan pins its reference sites at exactly 2."
metrics:
  duration: 41m
  completed: 2026-08-10
actuals:
  tokens: 48784
  tasks: 3
  commits: 3
---

# Phase 27 Plan 63: The Rounds-1-11 Bypass Corpus, Replayed Summary

Every bypass shape the eleven review rounds of this phase actually reproduced — 91 of them, harvested
with provenance from twelve cited artifacts — now produces a **named loud refusal** from the canonical
admission reader, on the code the row declares, with the refusal text printed.

## What was built

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | harvest the corpus from the eleven rounds, with provenance asserted | `3b9ba86` | `scripts/canonical-corpus.ts`, `scripts/canonical-corpus.js` |
| 2 | replay every row and print the refusal TEXT | `171cf05` | `scripts/canonical-corpus.test.ts` |
| 3 | the replay is proven able to FAIL | `bcac773` | `scripts/canonical-corpus.test.ts`, `scripts/canonical-frontmatter.ts` (+ `.js`) |

## THE GREEN SUITE IS A FLOOR

Stated plainly, because this phase has confused a floor with closure twelve times now: **the green
suite below is a FLOOR and is not offered as evidence that any bypass family is closed.** Eleven
consecutive review rounds ended with a live bypass while the suite was green, and rounds 10 and 11
each shipped a regression inside their own fix.

The closure evidence offered here is: the **per-row refusal transcript** reproduced in full below; the
**round-coverage table** with its two-sided assertions; the **widening sweep** with its premise control
recorded first and every moved row named; and **three mutation probes on a hermetic mirror** proving
that sweep can go red. Not the green line.

## The corpus, by round

Row totals are asserted two-sided: every round in 1..11 has at least one row (a round with zero rows
fails **by name**), every round the corpus mentions is inside that range, and the total is asserted
greater than the round count so one-row-per-round cannot satisfy the completeness claim.

```
canonical-corpus: 91 row(s), 91 distinct id(s), 11 rounds declared
canonical-corpus: rows per round
  round  1 :  6 row(s)  (bypass 6, control 0, divergence 0)
  round  2 : 12 row(s)  (bypass 12, control 0, divergence 0)
  round  3 : 12 row(s)  (bypass 12, control 0, divergence 0)
  round  4 :  2 row(s)  (bypass 2, control 0, divergence 0)
  round  5 :  9 row(s)  (bypass 9, control 0, divergence 0)
  round  6 :  3 row(s)  (bypass 3, control 0, divergence 0)
  round  7 : 10 row(s)  (bypass 10, control 0, divergence 0)
  round  8 :  8 row(s)  (bypass 8, control 0, divergence 0)
  round  9 :  6 row(s)  (bypass 5, control 1, divergence 0)
  round 10 : 14 row(s)  (bypass 10, control 2, divergence 2)
  round 11 :  9 row(s)  (bypass 7, control 2, divergence 0)
```

`CORPUS_COUNT` is declared in the same file as the data and **throws at module load** on disagreement.
That check is not decorative: it fired during task 1, on the first build, naming `78` against the
measured `91`. The count was corrected to the measurement, not the other way round.

Twelve distinct source artifacts are cited and every one resolves — checked twice, by `existsSync`
and again by a non-empty read, so a directory or a broken symlink cannot satisfy it:

```
.planning/phases/27-spawn-correctness-kit-set-authority/27-REVIEW-GAPS.md      (round 1)
                                                    ...-GAPS-2.md  ...  -GAPS-8.md   (rounds 2-8)
.planning/phases/27-spawn-correctness-kit-set-authority/27-REVIEW-round9.md    (round 9)
.planning/phases/27-spawn-correctness-kit-set-authority/27-REVIEW-round10.md   (round 10)
.planning/phases/27-spawn-correctness-kit-set-authority/27-REVIEW.md           (round 11)
scripts/frontmatter.test.ts   (the loader-adjudicated ESCAPE, TAG and REFUSED_FORMS axes)
```

## THE PER-ROW REPLAY TRANSCRIPT — all 91 rows, with the refusal TEXT

**0 admitted. 0 code mismatches.** Every row's actual code equals the code the row declares, and every
refusal carries prose naming the line and the offending byte.

The expected codes were derived by hand from the grammar **before** the reader was run, and all 91
matched on the first execution — so this column is a prediction that held, not a transcription of the
output.

| row id | round | finding | code | refusal TEXT | loader verdict as the source records it |
|---|---|---|---|---|---|
| `r01-cr01-parser` | 1 | CR-01 | `node-property` | line 3: a node starting at column 5 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `r01-cr01-gate` | 1 | CR-01 | `node-property` | line 5: a node starting at column 9 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `r02-cr01-tagged-alias` | 2 | CR-01 | `node-property` | line 3: a node starting at column 5 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `r03-cr01-escaped-seq-item` | 3 | CR-01 | `quoted-on-plain-only-key` | line 9: `allowed-tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `r03-in02-directive-prologue` | 3 | IN-02 | `no-opening-delimiter` | line 1 of the fence-stripped document is `%TAG !e! tag:x,2000:`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r04-cr01-bom` | 4 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `﻿---`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r04-cr01-trailing-nbsp` | 4 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `--- `, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-zwsp-fourdash` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `​----`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-zwsp-dash-foo` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `​--- foo`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-space-fourdash` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `  ----`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-combining-acute` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `́---́`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-double-bom-fourdash` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `﻿﻿----`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-nbsp-fourdash` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is ` ----`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-double-bom-zwsp` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `﻿﻿---​`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-nul` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `\x00---\x00`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r05-cr01-gate-zwsp-both` | 5 | CR-01 | `no-opening-delimiter` | line 1 of the fence-stripped document is `​---​`, and the canonical form requires it to be exactly `---`; a byte-order mark, leading whitespace or a directive before the delimiter is refused rather than skipped | UNKNOWN - verify |
| `r06-cr01-double-quoted` | 6 | CR-01 | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | `{"tools"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r06-cr01-single-quoted` | 6 | CR-01 | `single-quoted` | line 3: a node starting at column 8 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"tools"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r06-cr01-seq-item` | 6 | CR-01 | `quoted-on-plain-only-key` | line 8: `allowed-tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | `{"tools"=>["Read", "Write, # x, Agent(grugops-orchestrator)"]}` |
| `r07-cr01-dq-continuation` | 7 | CR-01 | `unrecognized-line` | line 4: `  "Read,` is indented as a block-sequence item and does not match the admitted production `  - item` | `"Read, # x, Agent(grugops-orchestrator)"` |
| `r07-cr01-sq-continuation` | 7 | CR-01 | `single-quoted` | line 4: a node starting at column 3 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"Read, # x, Agent(grugops-orchestrator)"` |
| `r07-cr01-key-comment` | 7 | CR-01 | `plain-scalar-charset` | line 3: the plain value of `tools` carries `#` (U+0023), which is outside the enumerated plain-scalar alphabet; the alphabet states what this module can vouch for, and every byte outside it is refused rather than interpreted | `"Read, # x, Agent(grugops-orchestrator)"` |
| `r07-cr01-trailing-space-key` | 7 | CR-01 | `scalar-padding` | line 3: the value of `tools` is written as ` `, which begins or ends with whitespace; the canonical form is exactly one space after the colon and no trailing whitespace, so the bytes of the value are unambiguous | `"Read, # x, Agent(grugops-orchestrator)"` |
| `r07-cr01-flow-sequence` | 7 | CR-01 | `flow-collection` | line 3: a node starting at column 8 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["Read", "Write, # x, Agent(grugops-orchestrator)"]` |
| `r07-cr01-flow-mapping` | 7 | CR-01 | `flow-collection` | line 3: a node starting at column 8 is introduced by `{`, which opens a flow mapping; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r07-cr01-empty-dash` | 7 | CR-01 | `unrecognized-line` | line 5: `  -` is indented as a block-sequence item and does not match the admitted production `  - item` | `["Read", "Write, # x, Agent(grugops-orchestrator)"]` |
| `r07-cr01-gate-skill` | 7 | CR-01 | `unrecognized-line` | line 4: `  "Read, Write, Bash, Glob, Grep,` is indented as a block-sequence item and does not match the admitted production `  - item` | `"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"` |
| `r07-cr01-gate-flow` | 7 | CR-01 | `flow-collection` | line 3: a node starting at column 16 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["Read","Write","Bash","Glob","Grep, # x, Agent(grugops-orchestrator)"]` |
| `r07-cr01-gate-agent` | 7 | CR-01 | `unrecognized-line` | line 4: `  "Read, Grep, Glob, Edit, Write, Bash,` is indented as a block-sequence item and does not match the admitted production `  - item` | `"Read, Grep, Glob, Edit, Write, Bash, # x, Agent(grugops-orchestrator)"` |
| `r08-cr01-a-nested-mapping` | 8 | CR-01 row A | `unrecognized-line` | line 4: `  nested: "Read,` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r08-cr01-b-compact-nested-sequence` | 8 | CR-01 row B | `plain-scalar-charset` | line 4: the plain value of `tools` carries `"` (U+0022), which is outside the enumerated plain-scalar alphabet; the alphabet states what this module can vouch for, and every byte outside it is refused rather than interpreted | `[["Read, # x, Agent(grugops-orchestrator)"]]` |
| `r08-cr01-c-json-adjacency` | 8 | CR-01 row C | `flow-collection` | line 3: a node starting at column 8 is introduced by `{`, which opens a flow mapping; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r08-cr01-d-seq-compact-mapping` | 8 | CR-01 row D | `plain-scalar-charset` | line 4: the plain value of `tools` carries `:` (U+003A), which is outside the enumerated plain-scalar alphabet; the alphabet states what this module can vouch for, and every byte outside it is refused rather than interpreted | `[{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]` |
| `r08-cr01-e-two-level-mapping` | 8 | CR-01 row E | `unrecognized-line` | line 4: `  a:` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"a"=>{"b"=>"Read, # x, Agent(grugops-orchestrator)"}}` |
| `r08-cr01-f-explicit-key` | 8 | CR-01 row F | `reserved-indicator` | line 4: a node starting at column 3 is introduced by `?`, which opens a complex mapping key indicator; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"Read, # x, Agent(grugops-orchestrator)"=>"v"}` |
| `r08-cr01-h-spaced-json-key` | 8 | CR-01 row H | `flow-collection` | line 3: a node starting at column 8 is introduced by `{`, which opens a flow mapping; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"a"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r08-cr01-c2-nested-flow` | 8 | CR-01 row C2 | `flow-collection` | line 3: a node starting at column 8 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `[{"a"=>"Read, # x, Agent(grugops-orchestrator)"}]` |
| `r09-cr01-a-spaced-escape` | 9 | CR-01 row A | `single-quoted` | line 3: a node starting at column 8 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"Read' s, # x, Agent(grugops-orchestrator)"` |
| `r09-cr01-b-unspaced-escape` | 9 | CR-01 row B | `single-quoted` | line 3: a node starting at column 8 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"Read's, # x, Agent(grugops-orchestrator)"` |
| `r09-cr01-c-seq-item` | 9 | CR-01 row C | `single-quoted` | line 4: a node starting at column 5 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["Read' s, # x, Agent(grugops-orchestrator)"]` |
| `r09-cr01-d-flow-sequence` | 9 | CR-01 row D | `flow-collection` | line 3: a node starting at column 8 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["Read' s, # x, Agent(grugops-orchestrator)"]` |
| `r09-cr01-f-control` | 9 | CR-01 row F | `single-quoted` | line 3: a node starting at column 8 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"Read, # x, Agent(grugops-orchestrator)"` |
| `r09-cr01-gate` | 9 | CR-01 | `single-quoted` | line 4: a node starting at column 5 is introduced by `'`, which opens a single-quoted scalar; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"Read' s, # x, Agent(grugops-orchestrator)"` |
| `r10-cr01-u1-sticky-exemption` | 10 | CR-01 row U1 | `block-scalar` | line 5: a node starting at column 6 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"a"=>"Agent(grugops-orchestrator)","b"=>"x"}` |
| `r10-cr01-u2-control` | 10 | CR-01 row U2 | `unrecognized-line` | line 4: `  a: "\x41gent(grugops-orchestrator)"` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"a"=>"Agent(grugops-orchestrator)"}` |
| `r10-cr02-a-anchor-before-indicator` | 10 | CR-02 row A | `node-property` | line 4: a node starting at column 11 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr02-b-tag-before-indicator` | 10 | CR-02 row B | `node-property` | line 4: a node starting at column 11 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"nested"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr02-f-explicit-key-value` | 10 | CR-02 row F | `reserved-indicator` | line 4: a node starting at column 3 is introduced by `?`, which opens a complex mapping key indicator; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"k"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr02-q-explicit-key` | 10 | CR-02 row Q | `reserved-indicator` | line 4: a node starting at column 3 is introduced by `?`, which opens a complex mapping key indicator; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"Read, # x, Agent(grugops-orchestrator)"=>"v"}` |
| `r10-cr02-p-control` | 10 | CR-02 row P | `node-property` | line 4: a node starting at column 3 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `r10-cr02-gate` | 10 | CR-02 | `node-property` | line 4: a node starting at column 11 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `allowed-tools => {"nested"=>"Read, Write, Bash, Glob, Grep, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr03-v1-quoted-nested-key` | 10 | CR-03 row V1 | `unrecognized-line` | line 4: `  "a b": >-` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr03-v2-dotted-nested-key` | 10 | CR-03 row V2 | `unrecognized-line` | line 4: `  a.b: >-` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"a.b"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr03-v3-digit-leading-nested-key` | 10 | CR-03 row V3 | `unrecognized-line` | line 4: `  1a: >-` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"1a"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-cr03-v4-spaced-nested-key` | 10 | CR-03 row V4 | `unrecognized-line` | line 4: `  a b: >-` is indented as a block-sequence item and does not match the admitted production `  - item` | `{"a b"=>"Read, # x, Agent(grugops-orchestrator)"}` |
| `r10-wr01-overincluded-content-line` | 10 | WR-01 | `block-scalar` | line 4: a node starting at column 11 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `{"nested"=>"Read,"}` |
| `r10-wr02-folded-blank-line` | 10 | WR-02 | `block-scalar` | line 3: a node starting at column 8 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"Agent(alpha, ga\nmma)\n"` |
| `r11-cr01-a-explicit-digit` | 11 | CR-01 row A | `block-scalar` | line 5: a node starting at column 5 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["  Read,\n # x, Agent(grugops-orchestrator)"]` |
| `r11-cr01-b-no-digit` | 11 | CR-01 row B | `block-scalar` | line 5: a node starting at column 5 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["Read, # x, Agent(grugops-orchestrator)"]` |
| `r11-cr01-gate-a` | 11 | CR-01 row A (gate reproduction) | `block-scalar` | line 5: a node starting at column 5 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["  Read, Write, Bash, Glob, Grep,\n # x, Agent(grugops-orchestrator)"]` |
| `r11-cr01-gate-b` | 11 | CR-01 row B (gate reproduction) | `block-scalar` | line 5: a node starting at column 5 is introduced by `>`, which opens a folded block scalar header; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `r11-cr02-alias-through-compact-mapping` | 11 | CR-02 | `node-property` | line 4: a node starting at column 8 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `"allowed-tools"=>[{"j"=>"Agent(grugops-orchestrator)"}]` |
| `r11-cr02-dashless-control` | 11 | CR-02 control | `node-property` | line 4: a node starting at column 8 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `r11-cr02-gate` | 11 | CR-02 (gate reproduction) | `node-property` | line 4: a node starting at column 8 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `["Read", "Write", "Bash", "Glob", "Grep", {"j"=>"Agent(grugops-orchestrator)"}]` |
| `r11-cr02-t3-loader-rejected` | 11 | CR-02 row T3 | `node-property` | line 4: a node starting at column 8 is introduced by `*`, which opens a YAML alias; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `REJECTED by libyaml` |
| `r11-cr02-r-loader-rejected` | 11 | CR-02 row R | `node-property` | line 4: a node starting at column 8 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | `REJECTED by libyaml` |
| `ax-ref-keyline` | 1 | REFUSED_FORMS / the CR-01 reproduction | `node-property` | line 3: a node starting at column 9 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-ref-own-value` | 1 | REFUSED_FORMS / anchor on the tools key's own value | `node-property` | line 3: a node starting at column 8 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-ref-flow-item` | 1 | REFUSED_FORMS / flow-sequence items | `flow-collection` | line 3: a node starting at column 8 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-ref-seq-item` | 1 | REFUSED_FORMS / block-sequence items | `node-property` | line 4: a node starting at column 5 is introduced by `&`, which opens a YAML anchor; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-keyline` | 2 | TAG axis / KEY-LINE (the CR-01 round-2 reproduction) | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-own-value` | 2 | TAG axis / KEY-LINE, no reference at all | `node-property` | line 3: a node starting at column 8 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-flow-item` | 2 | TAG axis / FLOW-ITEM | `node-property` | line 3: a node starting at column 8 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-seq-item` | 2 | TAG axis / SEQ_ITEM | `node-property` | line 4: a node starting at column 5 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-local` | 2 | TAG shape / single-indicator LOCAL tag | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-named-handle` | 2 | TAG shape / NAMED-HANDLE tag | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-verbatim` | 2 | TAG shape / VERBATIM tag | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-bare` | 2 | TAG shape / BARE non-specific tag | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-adjacency` | 2 | TAG adjacency / no separating whitespace | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-then-anchor` | 2 | TAG adjacency / tag then ANCHOR then collection | `node-property` | line 3: a node starting at column 9 is introduced by `!`, which opens a YAML tag; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-tag-nesting` | 2 | TAG nesting / bare tags on nodes INSIDE a flow collection | `flow-collection` | line 3: a node starting at column 8 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-esc-keyline` | 3 | ESCAPE axis / KEY-LINE (the CR-01 round-3 reproduction) | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `ax-esc-helper-key` | 3 | ESCAPE axis / KEY-LINE on a helper key | `unknown-key` | line 3: `_helper` is not one of the 10 keys the canonical schema admits (allowed-tools, argument-hint, coordinator, description, disable-model-invocation, kind, model, name, tier, tools); an unknown key is refused rather than ignored, because an ignored key is a second place a document can hide a value | UNKNOWN - verify |
| `ax-esc-flow-item` | 3 | ESCAPE axis / FLOW-ITEM | `flow-collection` | line 3: a node starting at column 8 is introduced by `[`, which opens a flow sequence; the canonical form admits a plain scalar or a double-quoted scalar and refuses every other node, so there is no indentation to compute and no second recogniser site to forget | UNKNOWN - verify |
| `ax-esc-seq-item` | 3 | ESCAPE axis / SEQ_ITEM | `quoted-on-plain-only-key` | line 5: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `ax-esc-plain-continuation` | 3 | ESCAPE axis / PLAIN-CONTINUATION | `unrecognized-line` | line 4: `  "\x41gent(grugops-orchestrator)"` is indented as a block-sequence item and does not match the admitted production `  - item` | UNKNOWN - verify |
| `ax-esc-u16` | 3 | ESCAPE spelling / 16-bit numeric | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `ax-esc-u32` | 3 | ESCAPE spelling / 32-bit numeric | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `ax-esc-line-feed` | 3 | ESCAPE spelling / the line-feed escape | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `ax-esc-truncated` | 3 | ESCAPE precision / TRUNCATED numeric escape | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |
| `ax-esc-dangling-backslash` | 3 | ESCAPE boundary / DANGLING backslash | `quoted-on-plain-only-key` | line 3: `tools` carries a double-quoted value, and the only keys admitted to carry one are description and argument-hint; the grant-bearing keys tools and allowed-tools admit plain scalars only, which is what keeps the double-quoted escape alphabet permanently outside the path that renders a spawn verdict | UNKNOWN - verify |

## The refusal vocabulary the history does and does not exercise

```
canonical-corpus: codes EXERCISED by the history = 11/23 —
  block-scalar 7, flow-collection 10, no-opening-delimiter 12, node-property 25,
  plain-scalar-charset 3, quoted-on-plain-only-key 10, reserved-indicator 3,
  scalar-padding 1, single-quoted 7, unknown-key 1, unrecognized-line 12
```

**The 12 codes this corpus does NOT exercise, recorded as INFORMATION and not as a failure:**

`no-closing-delimiter`, `empty-region`, `tab-in-region`, `control-character`, `bad-indentation`,
`duplicate-key`, `dangling-empty-key`, `orphan-sequence-item`, `unbalanced-parentheses`,
`unterminated-double-quote`, `embedded-double-quote`, `disallowed-escape`.

This is not a hole. 27-62 already proved all 23 codes reachable by a construct-specific document; the
list above simply says which constructs **no review round happened to reproduce**. It is named rather
than passed over silently so a later reader cannot mistake this corpus for a completeness claim over
the vocabulary.

One result inside that histogram is worth stating on its own, because it is the structural closure of
the whole D-30 escape family. Every escape-axis row — the 8-bit, 16-bit and 32-bit numeric widths, the
non-numeric escapes, the truncated escape, the dangling backslash — lands on
**`quoted-on-plain-only-key`**, not on `disallowed-escape`. The escape alphabet is never consulted,
because a double-quoted value on a grant key is refused before any escape is resolved. The entire
attack family sits permanently outside the path that renders a spawn verdict.

## D-64's four named documents, DISSOLVED

The plan required CR-01 rows A and B, CR-02's alias-through-compact-mapping and CR-02's dash-less
control by name, plus their gate-reproduction spellings. All seven are in the corpus with the exact
bytes the round-11 review recorded, and plan 27-65 plants them **by row id** so the module-level and
gate-level replays cannot disagree about which bytes were tested:

| row id | construct | code |
|---|---|---|
| `r11-cr01-a-explicit-digit` | `>-2` at a bare header under a dash — the confirmed regression against `3c7930b` | `block-scalar` |
| `r11-cr01-b-no-digit` | the same position with no explicit indicator | `block-scalar` |
| `r11-cr01-gate-a` | row A planted into a live `allowed-tools` key | `block-scalar` |
| `r11-cr01-gate-b` | row B planted into a live `allowed-tools` key | `block-scalar` |
| `r11-cr02-alias-through-compact-mapping` | an alias reaching a grant through a sequence item's compact mapping | `node-property` |
| `r11-cr02-dashless-control` | the identical alias one spelling over, which the old module already refused | `node-property` |
| `r11-cr02-gate` | the alias planted behind the kit's five baseline tools | `node-property` |

The two spellings that diverged for eleven rounds — one refused loudly, one read as "carries no
grant" — land on **one answer, at one code, with one reason**. `scripts/frontmatter.ts` was not
edited; there is no indentation landmark in the new reader to compute from the wrong node and no
second recogniser call site to forget.

## THE WIDENING SWEEP — the replay is proven able to fail

### Premise control, recorded FIRST

```
canonical-corpus: PREMISE CONTROL — unwidened, 91 row(s) replayed, 0 admitted,
0 code mismatches; the empty weakening is byte-equivalent to admit() on all 91 rows
```

The last clause is the control this phase's record demanded: without it the sweep could be measuring
the proof-only entry point rather than the widening. Every widening is asserted to genuinely differ
from the shipped constants **before** any result it produces is believed — a no-op widening yields a
perfectly convincing green, and this phase has been fooled by exactly that.

### Widening 1 — `admit block-scalar indicators` (`|` `>`)

```
      rows MOVED    : 7
      rows ADMITTED : 0
        r10-cr01-u1-sticky-exemption        (block-scalar -> unrecognized-line)
        r10-wr01-overincluded-content-line  (block-scalar -> unrecognized-line)
        r10-wr02-folded-blank-line          (block-scalar -> unrecognized-line)
        r11-cr01-a-explicit-digit           (block-scalar -> unrecognized-line)
        r11-cr01-b-no-digit                 (block-scalar -> unrecognized-line)
        r11-cr01-gate-a                     (block-scalar -> unrecognized-line)
        r11-cr01-gate-b                     (block-scalar -> unrecognized-line)
```

### Widening 2 — `admit node-property sigils` (`&` `*` `!`)

```
      rows MOVED    : 25
      rows ADMITTED : 4 — ax-ref-own-value, ax-ref-seq-item, ax-tag-own-value, ax-tag-seq-item
        r01-cr01-parser                        (node-property -> unknown-key)
        r01-cr01-gate                          (node-property -> unknown-key)
        r02-cr01-tagged-alias                  (node-property -> unknown-key)
        r10-cr02-a-anchor-before-indicator     (node-property -> unrecognized-line)
        r10-cr02-b-tag-before-indicator        (node-property -> unrecognized-line)
        r10-cr02-p-control                     (node-property -> unrecognized-line)
        r10-cr02-gate                          (node-property -> unrecognized-line)
        r11-cr02-alias-through-compact-mapping (node-property -> unknown-key)
        r11-cr02-dashless-control              (node-property -> unknown-key)
        r11-cr02-gate                          (node-property -> unknown-key)
        r11-cr02-t3-loader-rejected            (node-property -> plain-scalar-charset)
        r11-cr02-r-loader-rejected             (node-property -> plain-scalar-charset)
        ax-ref-keyline                         (node-property -> unknown-key)
        ax-ref-own-value                       (node-property -> ADMITTED)
        ax-ref-seq-item                        (node-property -> ADMITTED)
        ax-tag-keyline                         (node-property -> unknown-key)
        ax-tag-own-value                       (node-property -> ADMITTED)
        ax-tag-flow-item                       (node-property -> plain-scalar-charset)
        ax-tag-seq-item                        (node-property -> ADMITTED)
        ax-tag-local                           (node-property -> unknown-key)
        ax-tag-named-handle                    (node-property -> unknown-key)
        ax-tag-verbatim                        (node-property -> unknown-key)
        ax-tag-bare                            (node-property -> unknown-key)
        ax-tag-adjacency                       (node-property -> unknown-key)
        ax-tag-then-anchor                     (node-property -> unknown-key)
```

Four rows go all the way to **ADMITTED**, and `admittedHasSpawnGrant` reads a live
`Agent(grugops-orchestrator)` out of each. The replay can therefore be made to fail in the direction
that matters, not merely to shuffle codes.

### The moved union is a STRICT SUBSET — 32 of 91

The 59 rows **neither** widening moves are named in full by the case, so the corpus is shown to
exercise more than the two headline constructs. By code: `flow-collection` 10, `no-opening-delimiter`
12, `plain-scalar-charset` 3, `quoted-on-plain-only-key` 10, `reserved-indicator` 3, `scalar-padding`
1, `single-quoted` 7, `unknown-key` 1, `unrecognized-line` 12.

### Where the plan's premise was FALSIFIED by measurement, and what was reported instead

The plan's task 3 states that widening the grammar to admit block-scalar indicators "makes the
block-scalar rows ADMIT". **That is false, and it is false for a good reason.** Widening 1 moves seven
named rows and admits zero.

The cause is the reader's defence in depth, which 27-62 measured independently with its P3 probe: a
block-scalar indicator is refused **twice** — at a node start by the sigil table, and everywhere else
by its absence from the plain-scalar alphabet — and the historical block-scalar shapes are all
multi-line constructs that the canonical line productions refuse a third time, as
`unrecognized-line`. Making them ADMIT would require widening the line productions and the indentation
rule as well, which is a second grammar and is what the plan forbids by name.

What was implemented rather than reported around: each widening carries **both** halves (sigil table
and alphabet), the case **halts loudly if any widening moves zero rows** exactly as the plan requires,
and a **separate** assertion requires at least one widening to produce a genuine ADMIT — so
"the corpus can be made to pass" is proven, and the ADMIT-versus-MOVE split is stated as a measurement
rather than smoothed into the plan's wording.

### The sweep is itself proven able to fail — three mutation probes

Per this repository's standing rule, a claimed mutation result is not believed until the build's exit
code is asserted and the mutation is confirmed **in the built artifact**. All three probes ran on a
hermetic mirror of the working tree with `node_modules` symlinked; the unmutated control is
**11/11 green** before and after.

| probe | mutation | built-artifact confirmation | result |
|---|---|---|---|
| P1 | the proof entry point IGNORES the weakening | `grep -c dropSigils` on the built `.js` = **0** | build 0; **RED** — "widening `admit block-scalar indicators` moved ZERO rows … must halt rather than be reported as 'the grammar is robust'" |
| P2 | only the SIGIL half of the weakening is applied, not the alphabet half | `grep -c addToAlphabet` = **0** | build 0; **RED** — both widenings report `rows ADMITTED : 0`, and the "no widening made ANY historical bypass row ADMIT" assertion fires |
| P3 | the weakening MUTATES the shipped constants instead of copying | `grep -c "new Map(REFUSED_NODE_SIGILS)"` = **0** | build 0; **RED twice** — the containment case names the exact sigil: "after the sweep, `\|` is missing from the SHIPPED node-start refusal table — a widening reached the module" |

P2 is the interesting one: it is an independent reproduction of 27-62's defence-in-depth finding, and
it is the measured justification for `ProofWeakening` carrying two fields rather than one. A
single-field weakening would have reported a moved row as though it were an admitted one.

## Rows whose source records NO loader verdict — `UNKNOWN - verify`

**No loader is run in this file and no loader verdict is inferred anywhere.** 47 rows carry the
transcript their source printed; **44 rows carry `null`**, each with its reason, and the test asserts
that every such row's note actually contains the string `UNKNOWN - verify` so a silent null cannot
read as "no loader disagreement".

The 44 fall into five groups:

1. **Rounds 1-4 (7 rows)** — those reviews ran **no YAML loader**. Round 3 says so in its own words
   ("I could not execute a third-party YAML loader in this environment") and rests on YAML 1.2 § 5.7.
   Rounds 1 and 2 argue resolution from the spec and record gate exit codes instead.
2. **Round 5 (9 rows)** — the prologue table records module verdicts and gate exit codes, and the
   review explicitly declines to claim Claude Code loads a `<ZWSP>---<ZWSP>` head line.
3. **Two controls (`r10-cr02-p-control`, `r11-cr02-dashless-control`)** — their sources record the
   MODULE verdict (a correct refusal) and print no libyaml column for them.
4. **`r11-cr01-gate-b`** — round 11 records the gate exit code for row B's plant but prints no
   separate libyaml transcript for the planted spelling; row B's own loader value is recorded at the
   parser level instead.
5. **The 25 axis rows** — `scripts/frontmatter.test.ts`'s ESCAPE, TAG and reference axes assert
   against the module's refusal arm and carry no per-row loader transcript (the loader columns in that
   file live on `WR01_FALSE_RED_FORMS` and on the D-52 differential).

Two rows carry the loader verdict **`REJECTED by libyaml`** rather than a value —
`r11-cr02-t3-loader-rejected` and `r11-cr02-r-loader-rejected`. Round 11 records that half of CR-02's
asymmetry as documents libyaml refuses to load. A loader rejection is still not a clean verdict: the
old module returned `{ok:true,value:false}` over them.

## What was deliberately EXCLUDED from the corpus, and why

`WR01_FALSE_RED_FORMS` in `scripts/frontmatter.test.ts` (2 rows: an alias sigil and a tagged alias
arriving on a plain **continuation** line) is **not** in the corpus. Those documents are the opposite
direction: libyaml loads them to plain strings carrying no grant, and refusing them was the false red
D-48 inverted. They are not reproduced bypasses, and recording them as rows expected to refuse would
be filing a known false red as a closure.

Recorded honestly for the next reader: the canonical reader **does** refuse both, as `node-property`.
That is a false red of the new grammar in the safe direction, and it belongs to the residual 27-62
already recorded — the false-red cost of the strict alphabet, which 27-65 owns when the cutover is
proposed. It is **not** escalated into a bypass here.

Round 4's IN-01 (two legal YAML spellings that fail red) is excluded on the same reasoning.

## Transcription honesty

Two fields on every row record exactly what was done to each document on its way into the file:

- **`transcription: "verbatim"`** (23 rows) — the source prints the whole document and it is copied
  byte for byte.
- **`transcription: "framed"`** (68 rows) — the source prints a *region* ("the region under `tools:`")
  or abbreviates the token as `Agent(…)`. The region is wrapped in the two-line frame round 11 itself
  uses (`---` / `name: r` / … / `---`) and the abbreviation is written out as
  `Agent(grugops-orchestrator)`, which is the token every round used. Nothing else is reconstructed.

Where a source elided prose — round 1's planted `description:` line trails off in an ellipsis — the
elision is **dropped rather than invented**.

Special bytes are built from character codes and never written as source literals: the backslash
(a doubled backslash is a different, allowlisted document), and the invisible code points BOM, ZWSP,
NBSP, NUL and COMBINING ACUTE. The NUL is the sharpest reason: a literal NUL byte in this file would
make `grep` classify it as binary and report **zero matches with no warning**, quietly hiding these
rows from every future audit.

## Verification

| check | result |
|---|---|
| `npm run build` | exit 0 — asserted at every task, before any result was believed |
| `npm run freshness` | exit 0 — "All build outputs fresh: 36 committed .js file(s) match a fresh tsc rebuild" |
| `npx vitest run scripts/canonical-corpus.test.ts scripts/canonical-frontmatter.test.ts` | **27 passed (27)** — 11 new, and 27-62's own 16 still green after the module edit |
| `npx vitest run --exclude '**/scripts/e2e/**'` (full suite) | **1398 passed / 2 skipped across 39 files** — a FLOOR |
| `npm run typecheck` (both lanes) | exit 0 |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| `scripts/frontmatter.ts` / `.js` **BYTE-UNCHANGED** by this plan | **YES** — the working diff is empty and no commit of this plan touches it |
| `scripts/check-foundation-guards.ts` / `.js` **BYTE-UNCHANGED** by this plan | **YES** — same |
| package manifest — no dependency added (T-27-SC) | **YES** — `dependencies`/`devDependencies` untouched; the only `package.json` movement since `c842e81` is 27-64's two `npm run` script entries, from wave 1, not this plan |

The full suite ran with `--exclude '**/scripts/e2e/**'`. Bare `npm test` was **never** run: it triggers
a live claude-CLI lane that spends tokens and can hang.

## Deviations from Plan

### 1. [Rule 3 — blocking] a narrow, named injection point was added to `scripts/canonical-frontmatter.ts`

- **Found during:** Task 3
- **Issue:** the module exposed no surface to substitute its alphabet or its node-start table, so the
  widening sweep could not run the real admission logic against a weakened grammar without either
  mutating the module on disk or writing a second admission implementation in the test. The plan
  forbids both and explicitly anticipates this remedy.
- **Fix:** `admitUnderProofWeakeningOnly(text, weakening)`, declared **outside** the admission core,
  which builds a weakened copy and delegates to the same `admitAgainst` the shipped path uses. There
  is still exactly one admission implementation. `admit`'s own signature is unchanged and `AdmitOptions`
  can still only narrow, which the test asserts over the module's source. A derived, cardinality-pinned
  scan over every tracked `.ts` asserts the proof-only name is referenced by exactly two files, one of
  which is a test.
- **Also required:** `admitValue` gained an `alphabet` parameter and `admit` was refactored so the
  grammar is a record rather than three free constant reads. `admit` always fills it from the module
  constants, so shipped behaviour is unchanged — proven by 27-62's 16 cases still passing.
- **Commit:** `bcac773`

### 2. [measurement contradicts the plan] widening the block-scalar grammar admits ZERO rows

- **Found during:** Task 3
- **Issue:** the plan's behaviour list asserts each widening makes named rows ADMIT. Widening 1 moves
  seven rows and admits none.
- **Disposition:** reported as a measurement, not worked around. Full reasoning in the sweep section
  above. The plan's halt rule (a widening that moves zero rows must halt loudly) is implemented as
  written and is proven able to fire by probe P1.

### 3. [caught by this plan's own assertion] `CORPUS_COUNT` was wrong on the first build

- The declared count of 78 disagreed with the measured 91, and the module-load throw named both
  numbers. The count was corrected to the measurement. Recorded because it is the first evidence that
  the tamper check of T-27-145 actually fires.

### 4. [Rule 2 — missing critical functionality] the containment check was widened from one file to the tree

- The first draft asserted the proof-only entry point's containment by reading
  `scripts/canonical-frontmatter.ts` alone. A hand-scoped check stays green while the set it claims to
  bound grows — this repository's second systemic failure class by name. Replaced with a derivation
  over every tracked `.ts`, with the resulting set compared to a named list and its cardinality pinned
  separately.

## Known Stubs

None.

## Residuals and UNKNOWNs, stated rather than smoothed over

1. **44 of 91 rows carry no loader verdict, by construction.** Enumerated by group above. This is a
   property of the historical record, not of this plan, and it is not repairable here: re-running
   libyaml today over rounds 1-5's documents would produce a verdict those reviews never recorded, and
   attributing it to them would be a fabricated citation. **`UNKNOWN - verify`** stands.
2. **This corpus proves closure over the shapes rounds 1-11 REPRODUCED, and nothing more.** It cannot
   prove that no unenumerated construct exists. The argument that it need not is structural and belongs
   to 27-62 — the reader admits an enumerated shape and refuses every other byte — not to this corpus.
3. **The corpus is not wired into any gate.** It is module-level evidence. 27-65 owns planting these
   rows through the real guard, and until then these are properties of a module rather than of the
   shipped kit.
4. **`UNKNOWN - verify`: whether Claude Code honours a *mapping* under `allowed-tools:` as a tool
   grant** remains unconfirmed against the platform, exactly as rounds 10 and 11 recorded it. Several
   corpus rows are mappings. No live platform escalation is claimed by this plan either; the rows
   stand on the old module's own contract, which is how their sources scoped them.
5. **The two `WR01_FALSE_RED_FORMS` documents are refused by the canonical reader.** Recorded above as
   a known false red in the safe direction, folded into 27-62's standing false-red residual, and
   deliberately not escalated.

## Self-Check: PASSED

- `scripts/canonical-corpus.ts` — FOUND
- `scripts/canonical-corpus.js` — FOUND
- `scripts/canonical-corpus.test.ts` — FOUND
- commit `3b9ba86` — FOUND
- commit `171cf05` — FOUND
- commit `bcac773` — FOUND
