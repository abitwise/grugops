---
phase: 27-spawn-correctness-kit-set-authority
plan: 36
subsystem: frontmatter-parser
status: complete
tags: [security, parser, delimiter, spawn-grant, gap-closure, round-6, KIT-03, SPAWN-04]
requires:
  - scripts/kit-model.ts spawnGrantScan() (the ONE scan composition, unchanged)
  - scripts/check-foundation-guards.ts guard_wr05 parse-failure branch (unchanged)
provides:
  - scripts/frontmatter.ts classifyDelimiter() — one total delimiter classifier, three verdicts
  - scripts/frontmatter.ts DelimiterVerdict — module-private discriminated union
  - scripts/frontmatter.ts assertNeverVerdict() — compiler-checked exhaustiveness helper
  - scripts/frontmatter.test.ts — the D-45 three-axis cross-product sweep (648 cells)
affects:
  - every consumer of parseFrontmatter / hasSpawnGrant / grantedAgentNames
  - guard_wr05, the KIT-03 oracle, coordinator-resolution-precheck, check-kit-refs
tech-stack:
  added: []
  patterns:
    - "one total classifier + compiler-checked never-branch replaces a pair of composable predicates"
    - "cross-product corpus enumerated from OUTSIDE the rule under test, expected verdict a pure function of axis labels"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
decisions:
  - "D-44 implemented: the two-arm refusal shape is DELETED, not patched — one total classifier, exhaustively consumed at both call sites"
  - "D-45 implemented: the pinning corpus is a 9x4x6 cross-product swept over three position-and-token families (648 cells), built without reference to the classifier's internals"
  - "DELIMITER_ROWS' `arm: 1 | 2` tag RESTATED as the verdict kind (not dropped), and made load-bearing against the shared projection"
metrics:
  duration_minutes: 35
  completed: 2026-08-04
  tasks: 2
  commits: 2
actuals:
  tokens: 71333
  tasks: 2
  commits: 2
---

# Phase 27 Plan 36: One Total Delimiter Classifier Summary

The delimiter region now holds ONE total classifier mapping every line to exactly one of `legal` /
`refuse` / `not-a-delimiter`, consumed through a compiler-checked never-branch at both call sites; the
two-arm refusal shape whose union was not the complement of the legal set is deleted, and a
composite-delimiter rogue spawn grant on a shipped plugin-form skill now turns the whole foundation
gate red instead of printing `ALL CHECKS PASSED` at exit 0.

## What Was Built

| Task | What | Commit |
|---|---|---|
| 1 (tracer) | `DelimiterVerdict` + `assertNeverVerdict` + `classifyDelimiter` in `scripts/frontmatter.ts`; both `parseFrontmatter` call sites rewritten to a switch over the verdict; `delimiterRefusal`, `isLegalDelimiter` and `allDeclaredWs` deleted; named composite anchors, the precision edge and the adjacency partition added | `d4f56e7` |
| 2 | The D-45 three-axis cross-product sweep (648 cells), the non-circularity pin, the placement-axis replacement of the four per-arm constructions, the `DELIMITER_ROWS` reconciliation, and the rewritten 33-member false-red control | `78616c9` |

**Precondition (Task 1).** `git status --porcelain` was NOT empty: `.planning/STATE.md` carried an
uncommitted orchestrator edit. Assessed and recorded rather than waved past — the precondition's
operative fact is that the RED transcript is a claim about COMMITTED code, and
`git status --porcelain -- scripts/ install/ hooks/ agent-factory/ .claude/ skills/ package.json tests/`
was **empty**, so `git archive HEAD` produced a mirror whose `scripts/frontmatter.js` and
`scripts/check-foundation-guards.js` were byte-identical (`cmp`) to the live committed artifacts. Every
plant ran on a throwaway mirror; the live tree was never planted into.

## Task 1 — parser RED/GREEN, eleven rows, both positions

Run against `scripts/frontmatter.js` on a `git archive HEAD` mirror (HEAD `97391e1`) **before** any
edit, then against the rebuilt committed `.js`. Document = the head line shown, then `name: rogue` /
`tools: Read, Agent(grugops-orchestrator)` / `---`.

### OPENING position — `hasSpawnGrant`

| head line | RED (pre-fix, committed `.js`) | GREEN (rebuilt committed `.js`) |
|---|---|---|
| `---` (control) | `{"ok":true,"value":true}` | `{"ok":true,"value":true}` — unchanged |
| `ZWSP + ---` (single-sided) | `{"ok":false, …U+200B…}` | `{"ok":false, …U+200B…}` — unchanged |
| `--- + ZWSP` (single-sided) | `{"ok":false, …U+200B…}` | `{"ok":false, …U+200B…}` — unchanged |
| **`ZWSP + --- + ZWSP`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+200B **twice** |
| **`ZWSP + ----`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+200B and U+002D |
| **`NBSP + ----`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+00A0 and U+002D |
| **`BOM x2 + --- + ZWSP`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+FEFF and U+200B |
| **`ZWSP + --- foo`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+200B and U+0066 |
| **`NUL + --- + NUL`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+0000 twice |
| **`U+0301 + --- + U+0301`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+0301 twice |
| **`space + ----`** | **`{"ok":true,"value":false}`** | `{"ok":false}` — names U+0020 and U+002D |

All **eight** composite rows returned the silent no-grant SUCCESS arm before the fix and refuse by name
after it.

### CLOSING position — `parseFrontmatter`, block opened by a bare `---`

| head line | RED | GREEN |
|---|---|---|
| both single-sided rows | named refusal (already correct) | named refusal — unchanged |
| **all eight composites** | **`frontmatter block opened at line 1 … and is never closed`** | the SAME named refusal as the opening position, naming both code points |

The misleading unterminated-block diagnosis on the composite — the last place D-39 point 5's open/close
parity was untrue — is gone.

### Reason text, both facts named

```
the opening delimiter position carries `<ZWSP>----`, which is not the one legal spelling of the `---`
delimiter: its leading residue renders no glyph of its own and begins with U+200B, so the delimiter
does not begin where the line begins; and the first code point after the payload, U+002D, is outside
the one whitespace class a delimiter may carry. A delimiter begins where the line begins and carries
nothing but space or tab after its payload, so this line is refused as unreadable rather than read as
an absence of keys — never read as "carries no grant"
```

Supplementary plane, both positions: `U+E0020 + --- + U+E0020` reports `U+E0020` (five hex digits) at
both ends — one code POINT label, never a surrogate half. Asserted by a case.

## Task 1 — gate RED/GREEN, three hermetic mirrors, end to end

Plant: `- Agent(grugops-orchestrator)` spliced into the existing `allowed-tools` block sequence of
`skills/grugops/SKILL.md` — the plugin-form skill `guardDistributionPair` exempts and Claude Code loads
for every `/plugin install` user. Each spelling on its own `git archive HEAD` mirror; guard run with the
harness's `CHECK_ROOT` convention.

| head line | RED — committed guard + committed pre-fix parser | GREEN — committed guard + rebuilt parser |
|---|---|---|
| `--- + ZWSP` (trailing only) | exit **1**, `1 CHECK(S) FAILED`, names `skills/grugops/SKILL.md` | exit **1**, names the file |
| `ZWSP + ---` (leading only) | exit **1**, `1 CHECK(S) FAILED`, names `skills/grugops/SKILL.md` | exit **1**, names the file |
| **`ZWSP + --- + ZWSP`** (composite) | **exit 0, `ALL CHECKS PASSED`** — no finding at all | exit **1**, `1 CHECK(S) FAILED`, names `skills/grugops/SKILL.md` and both code points |

One code point flipped a red gate green over a document carrying a live spawn grant. It no longer does.
`guard_wr05`'s hand-written parse-failure branch needed **no edit** — it converts the refusal into the
finding, exactly as designed.

## Task 1 — compiler-enforced exhaustiveness, by transcript

A fourth kind added to `DelimiterVerdict` in a scratch build (backed up, applied, restored
byte-identical afterwards — verified by `cmp`):

```
$ npx tsc --noEmit
scripts/frontmatter.ts(979,33): error TS2345: Argument of type '{ kind: "scratch-fourth-kind"; }' is not assignable to parameter of type 'never'.
scripts/frontmatter.ts(999,35): error TS2345: Argument of type '{ kind: "scratch-fourth-kind"; }' is not assignable to parameter of type 'never'.
typecheck exit: 2

$ (fourth kind removed)  npx tsc --noEmit
typecheck exit 0 (PASS)
```

**Both** call sites named — line 979 is the opening switch's `default`, line 999 the closing scan's.
A code-review claim of exhaustiveness would not have produced this.

## Task 1 — structural criteria, measured

| Criterion | Measured |
|---|---|
| `grep -v '^[[:space:]]*//' scripts/frontmatter.ts \| grep -c 'delimiterRefusal'` | **0** — the two-arm helper is deleted, not retained as a second opinion |
| `grep -c 'isLegalDelimiter\|allDeclaredWs' scripts/frontmatter.ts` | **0** — both former second-opinion predicates folded into the one classifier |
| Neither call site carries a whitespace expression, a payload comparison or residue arithmetic | Confirmed — the only `slice(` in the region is `lines.slice(openAt + 1, end)`, which is block extraction, not delimiter arithmetic |

## Task 2 — the cross-product sweep, RED before and GREEN after

Corpus: **9 leading × 4 payload × 6 trailing = 216 cells** per position-and-token family, over three
families — `opening`/`---`, `closing`/`---`, `closing`/`...` — for **648 cells**, asserted as a number.

Run outside vitest so every cell is evaluated and failing cells are COUNTED rather than the run aborting
on the first assertion:

| Build under test | Cells swept | **Failing cells** |
|---|---|---|
| pre-Task-1 committed `scripts/frontmatter.js` (retained `git archive HEAD` mirror) | 648 | **368** |
| rebuilt committed `scripts/frontmatter.js` | 648 | **0** |

Failing-cell breakdown by family (RED): 112 `opening`/`---`, 128 `closing`/`---`, 128 `closing`/`...`.

**The measured composites among the RED failures — 7 of 7 that this corpus can express:**

```
BOM x2 + `---` + ZWSP    expected=refuse observed=not-a-delimiter
ZWSP   + `---` + ZWSP    expected=refuse observed=not-a-delimiter
ZWSP   + `----`          expected=refuse observed=not-a-delimiter
ZWSP   + `--- foo`       expected=refuse observed=not-a-delimiter
NBSP   + `----`          expected=refuse observed=not-a-delimiter
space  + `----`          expected=refuse observed=not-a-delimiter
NUL    + `---` + NUL     expected=refuse observed=not-a-delimiter
```

**The eighth composite, named rather than glossed.** `U+0301 + --- + U+0301` is **not** a cross-product
cell: the ratified trailing axis carries no combining mark (its six members are none / ZWSP / NBSP /
space / space-plus-text / NUL). It is pinned in two other places, and both were RED against the pre-fix
build: the named composite anchors (`D-44 composite anchors` — RED) and the character sweep's new
`both` placement over the `M (combining marks)` corpus (RED, e.g. `U+0302 both @ opening`). The plan's
axis specification is followed exactly; the gap in coverage it implies is recorded here rather than
closed by quietly widening an axis.

### Suite-level RED against the pre-fix build

The full updated `scripts/frontmatter.test.ts` copied onto the retained mirror (whose
`scripts/frontmatter.js` was `cmp`-verified as the pre-fix committed artifact):

```
× D-44 composite anchors — … REFUSES at the OPENING position, naming BOTH facts
× D-44 composite anchors — the SAME line at the CLOSING position … NOT the `opened and never closed` diagnosis
× KIT-03 precision edge — a SUPPLEMENTARY-PLANE code point … named as ONE `U+XXXXX` label
× D-44 adjacency edge — the three verdict kinds PARTITION every line
× D-43 non-circular sweep — … in both placements       (the new `both` placement)
× D-45 cross-product sweep — 9 leading x 4 payload x 6 trailing …
 Tests  6 failed | 50 passed (56)
```

After the fix: **56 passed**.

### The failing-cell message names all three axis labels

Demonstrated by scratch edit (one cell's expected verdict inverted by removing `"one space"` from the
declared-class trailing labels; file restored `cmp`-identical afterwards):

```
AssertionError: leading=[none] payload=[exact payload] trailing=[one space] position=[opening] token=[---]: expected 'legal' to be 'refuse'
AssertionError: none | exact payload | one space | opening: expected 'refuse' to be 'legal'
```

The second line is the **independently written truth table** catching the same inversion — two separate
statements of the rule disagreeing, which is what makes the non-circularity pin worth having.

### Non-circularity, pinned rather than asserted

The plan's first option was writable cleanly, so it was taken **and** the fallback was added on top:

1. `expectedVerdict.toString()` is read back and asserted to contain **none** of 15 module symbol names
   (`parseFrontmatter`, `hasSpawnGrant`, `grantedAgentNames`, `classifyDelimiter`, `DelimiterVerdict`,
   `assertNeverVerdict`, `leadingInvisibleRun`, `firstOutsideDeclaredWs`, `DELIMITER_WS_CHAR`,
   `VISIBLE_GLYPH`, `OPEN_PAYLOADS`, `CLOSE_PAYLOADS`, `codePointLabel`, `projectVerdict`,
   `buildDelimiterDoc`).
2. Purity: every (leading, payload, trailing, position) tuple evaluated twice and compared.
3. A **13-row independently written truth table** covering all 7 corpus-expressible composites, the
   positive controls, the carve-out at both positions, and the body-only arm at both positions.

**The one carve-out is DECLARED, not discovered.** A single leading byte-order mark at the OPENING
position is normalized away by D-39 point 1's one normalization point, so that cell's *effective*
leading residue is absent. Two marks are not carved out, and no leading residue at the CLOSING position
is carved out (the closing scan is past the normalization point). Both non-carve-outs are truth-table
rows.

### The four per-arm constructions are REPLACED, not kept beside

Round 5's `["trailing @ opening", "leading @ opening", "trailing @ closing", "leading @ closing"]` — one
construction per declared arm, hence structurally incapable of failing on an input outside both — is
gone. The residue PLACEMENT is now an axis with three values (`leading` / `trailing` / **`both`**)
crossed with the two positions, driven by the SAME `buildDelimiterDoc` builder every other construction
in the region uses. A reviewer reading the region finds **one** corpus construction.

### `DELIMITER_ROWS` arm-tagging reconciliation — decision and reason

**RESTATED as the verdict kind, not dropped.** `arm: 1 | 2` named a position inside a two-arm
implementation that no longer exists — a tag describing a deleted structure is a comment claiming a
property, which this module's own rule forbids leaving standing. It was restated rather than dropped
because the restated tag is **load-bearing**: `projectVerdict(row.line, position)` is asserted equal to
`row.verdict`, so a row retagged without changing its behaviour fails instead of drifting into
decoration, and a future row expecting `legal` or `not-a-delimiter` must say so rather than inheriting
`refuse` by position in the table. The leading/trailing distinction the old tag also carried survives in
each row's own label, where it describes the INPUT rather than the implementation.

## False-red cost, measured

| Measurement | Result |
|---|---|
| Spawn-grant scan members read (from `spawnGrantScan()`, never a directory list) | **33** |
| Block lines re-probed at the closing position | **201** |
| Delimiter refusals across those 33 members, head lines AND block lines | **0** |
| Tracked markdown files parsed repository-wide (`git ls-files '*.md'`) | **1122** |
| Delimiter refusals repository-wide, **pre-fix** committed `.js` | **0** |
| Delimiter refusals repository-wide, **post-fix** committed `.js` | **0** |
| Non-delimiter refusals repository-wide, pre- and post-fix | **0** |

**Disposition of the delta against round 5.** Round 5 recorded "a single pre-existing non-delimiter
refusal". Today's measurement over the same corpus definition finds **zero** of either kind, before and
after this change. Since 0 is not MORE than 1, no NEW refusal exists to name — the strict D-44 rule
costs this repository nothing. The discrepancy is in round 5's baseline, not in this change (the
pre-fix build was measured today with the identical script and also returned 0), and is recorded here
rather than reconciled by assumption.

The control now REPORTS what it read (`read 33 scan members and 201 block lines`) in its assertion
message, so a control passing over a shrunken corpus is visible rather than silently reassuring.

## Verification

| Check | Result |
|---|---|
| `npm run build && npm run freshness` | exit 0 — **32 committed `.js` fresh** against a temp rebuild |
| `npx tsc --noEmit` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1074 passed / 2 skipped**, 35 files (baseline was 1068/2 — +6 new tests, 0 failures) |
| `node scripts/check-foundation-guards.js` | exit 0, `ALL CHECKS PASSED` |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| Kit intact | 17 agent adapters, 7 standalone skills, 7 plugin skills, `SPAWN_GRANT_SCAN` = **33** |
| `git diff package.json` | **empty** — zero package-manager install tasks, dev-dependency fence unchanged |
| Round-5 ICU cardinality literals (`toBe(170)`, `toBe(62)`, `toBe(16)`, `toBe(1048)`, `toBe(1050)`) | **byte-unchanged** — this plan added constructions, not corpus members (`git diff` shows no `+`/`-` on those lines) |
| Live tree after both commits | clean apart from the pre-existing `.planning/STATE.md` edit |

**`validate-agent-factory.js` note:** run bare it exits 1 with `VALIDATE_KIT_ROOT is unset — refusing to
default the kit root to '.' (C3)`. That is its designed refusal, not a regression; with the required env
var it exits 0. Recorded so a later reader does not mistake it for a finding.

**The suite being green is not offered as evidence of anything.** It has been green in every round of
this phase in which a defect was later found. Every closure claim above rests on a transcript that was
RED against the committed `.js` before the edit, or on a measured count.

## Deviations from Plan

**None affecting scope or behaviour.** Three recorded judgements:

1. **[Precondition] `git status --porcelain` was not empty** — `.planning/STATE.md` carried an
   orchestrator edit. Assessed as substantively met (all source paths clean; the archive mirror was
   `cmp`-verified against the committed artifacts) and recorded rather than treated as satisfied
   silently. No plan file outside `files_modified` was edited.
2. **[Scope, in-plan] `isLegalDelimiter` and `allDeclaredWs` deleted alongside `delimiterRefusal`.** The
   plan's deletion criterion names only `delimiterRefusal`, but leaving the other two standing would
   have left second predicates over the same question — exactly the shape D-44 promotes away from.
   Their content is folded into the one classifier (`firstOutsideDeclaredWs(residue) === -1` IS the
   legality of what follows the payload). Measured at 0 remaining occurrences.
3. **[Recorded, not closed] The eighth composite is outside the ratified trailing axis.**
   `U+0301 + --- + U+0301` cannot be a cross-product cell because the axis carries no combining mark.
   Rather than widen an axis the plan ratified, it is pinned by the named anchors and by the character
   sweep's `both` placement, both RED before and GREEN after. Named above in full.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary was
introduced; the change narrows an existing trust boundary (file bytes → security verdict) and adds no
new surface. `package.json` is byte-unchanged, so no package-legitimacy checkpoint was reachable.

## Known Stubs

None. `grep -nE "TODO|FIXME|placeholder|coming soon|not available|\.skip\(|\.todo\("` over both changed
source files returns zero matches. No test is skipped by this plan; the suite's 2 pre-existing skips are
untouched and unrelated.

## Flagged Assumption Carried Forward (SPAWN-04, `unclassified`)

The plan's edge probe could not classify an edge category for SPAWN-04, and the planner's reading — that
SPAWN-04 has no independent edge surface this round and now fails solely through the shared
`keysHaveSpawnGrant` / `parseFrontmatter` path this plan repairs — is an ASSUMPTION, not a probe result.
This execution is consistent with that reading (the gate transcript closes SPAWN-04's bypass through the
parser with no edit to `guard_wr05`), but consistency is not confirmation. It remains **unresolved** for
the verifier to confirm or reject. It is not converted into a `backstop` truth and it is not dropped.

## Backstop Truths — status

- *"Claude Code's own frontmatter reader loads a document whose head line is `<ZWSP>---<ZWSP>`"* —
  still `UNKNOWN - verify`, unchanged. The refusal is taken on this module's own contract (a document it
  cannot decode belongs in the unreadable arm), exactly as D-34 recorded, and **not** on a proven live
  load.
- *"No tracked markdown file outside the 33-member scan gains a NEW delimiter refusal"* — **measured**:
  1122 files, 0 refusals before and after. No new refusal to name or disposition.

## Self-Check: PASSED

- `scripts/frontmatter.ts` — FOUND
- `scripts/frontmatter.js` — FOUND
- `scripts/frontmatter.test.ts` — FOUND
- `.planning/phases/27-spawn-correctness-kit-set-authority/27-36-SUMMARY.md` — FOUND
- commit `d4f56e7` — FOUND
- commit `78616c9` — FOUND
