---
phase: 27-spawn-correctness-kit-set-authority
plan: 33
subsystem: frontmatter-parser / kit-derivation-authority
tags: [spawn-grant, parser-refusal, delimiter, allowlist-polarity, set-authority, cardinality-pin]
status: complete
requires:
  - scripts/frontmatter.ts (the D-30 escape allowlist, the D-34 directive refusal, stripFencedBlocks)
  - scripts/kit-model.ts (listAgentAdapters, listSkillAdapters, readDirOrThrow, refuseEmpty)
  - scripts/check-foundation-guards.ts (guard_wr05's hand-written parse-failure branch, derive())
provides:
  - "scripts/frontmatter.ts — the ONE declared legal delimiter spelling, consulted by both positions"
  - "scripts/frontmatter.ts — the single leading-BOM normalization point"
  - "scripts/frontmatter.ts — the two delimiter refusal arms (arm 1 enumerates nothing)"
  - "scripts/frontmatter.ts — keysGrantedAgentNames refuses a nested parenthesis or a quote"
  - "scripts/kit-model.ts — listPackagingTemplates, spawnGrantScan, SPAWN_GRANT_SCAN_PARTS, spawnGrantScanPrefix"
  - "scripts/kit-model.ts — SPAWN_GRANT_SCAN_COUNT = 26, two-sided"
affects:
  - scripts/check-foundation-guards.ts (guard_wr05 scan set, guardKitCounts)
  - scripts/frontmatter.test.ts (the negative-space sweep, the false-red control)
  - scripts/kit-model.test.ts (the packaging lister and composition cases)
tech-stack:
  added: []
  patterns:
    - "state the LEGAL set and refuse its complement (D-30's polarity, applied to the delimiter axis)"
    - "derive the set, assert the count — two-sided cardinality plus per-part SET equality (D-19/D-20)"
    - "one predicate, one place: the scan composition has one authority and two consumers"
    - "a sweep corpus drawn from the NEGATIVE SPACE of the rejected alphabet, never from the rule under test"
key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
decisions:
  - "D-43 arm 1 consults NO character class — implemented as `startsWith(payload) && !isLegalDelimiter(...)`; the class appears only to NAME the offending code point in the message"
  - "D-43 arm 2's class is the complement of {L,N,P,S}, deliberately NOT Unicode's `graphic` ({L,M,N,P,S,Zs}), which includes combining marks"
  - "The composition's set equality between guard and control is documentation of intent, never an assertion — after the move it compares one object with itself"
  - "The measured coordinator grant closure is 16, not the plan's stated 17: the coordinator does not grant itself"
metrics:
  duration: ~35 min
  completed: 2026-08-03
actuals:
  tokens: 29083
  tasks: 3
  commits: 3
---

# Phase 27 Plan 33: Close CR-01 (the delimiter axis) and WR-02 Summary

The delimiter region now declares its one legal spelling and refuses everything else at both
positions with a refusal side that enumerates nothing; the spawn-grant scan composition has a single
authority pinned by a two-sided cardinality plus per-part set equality; and `keysGrantedAgentNames`
refuses an enumeration it cannot vouch for instead of returning it short or altered.

## What was built

**Task 1 — the one legal delimiter spelling (D-39, D-43).** `scripts/frontmatter.ts` gained a single
normalization point (one leading `U+FEFF`, removed in the same expression that normalizes CRLF,
position zero only), one module-private declared whitespace class, a legal-delimiter predicate both
positions consult, and two refusal arms. Arm 1 is `begins with the payload and is not legal`, full
stop — it consults no character class at all; the class is used afterwards solely to name the first
offending code point in the message, and a message cannot change a verdict. Arm 2 is the only
consumer of the invisible class, stated positively as the complement of `{L, N, P, S}`. The
three-outcome partition comment was amended: the partition moved a second time and still has three
outcomes and no fourth state.

**Task 2 — the non-circular sweep and the relocated composition (D-43).** `scripts/kit-model.ts`
gained `listPackagingTemplates` (the shape rule carried across verbatim, `adapters.md` still out BY
THE RULE and not by omission), the exported `spawnGrantScan()` composition, `SPAWN_GRANT_SCAN_PARTS`,
`spawnGrantScanPrefix()` and `SPAWN_GRANT_SCAN_COUNT = 26`. `check-foundation-guards.ts`'s local
`readPackagingDir` and local composition were DELETED, not kept as a second opinion, and the
packaging call site goes through the existing `derive()` wrapper.

**Task 3 — the grant enumeration refusal (D-41 item 3).** `keysGrantedAgentNames` examines each
captured enumeration before splitting it and returns the failure arm on a nested opening parenthesis
or on any quote character. The scoped-grant expression itself is byte-unchanged from HEAD.

## Transcripts

### Task 1 — parser RED/GREEN against the committed `scripts/frontmatter.js`

Every row carries a live `Agent(grugops-orchestrator)` grant.

| opening line | RED (before) | GREEN (after) |
|---|---|---|
| `---` (control) | GRANTED | GRANTED |
| `---` + trailing space / tab (controls) | GRANTED | GRANTED |
| `---` + U+FE0F | SILENT no-grant `{ok:true,value:false}` | REFUSED, names U+FE0F |
| `---` + U+0301 | SILENT no-grant | REFUSED, names U+0301 |
| `---` + U+0378 | SILENT no-grant | REFUSED, names U+0378 |
| `---` + U+E000 | SILENT no-grant | REFUSED, names U+E000 |
| `----` | SILENT no-grant | REFUSED, names U+002D |
| `--- foo` | SILENT no-grant | REFUSED, names U+0066 |
| `---` + U+E0020 | SILENT no-grant | REFUSED, names U+E0020 |
| `---` + U+200B | SILENT no-grant | REFUSED, names U+200B |
| leading space | SILENT no-grant | REFUSED (arm 2), names U+0020 |
| leading BOM | SILENT no-grant | GRANTED — the one normalization |
| TWO leading BOMs | SILENT no-grant | REFUSED (arm 2), names U+FEFF |

The four rows D-42's alphabet would still have missed (U+FE0F, U+0301, U+0378, U+E000) plus the two
payload variants (`----`, `--- foo`) are the six the round-4 formulation would have shipped green.

**The open/close asymmetry is dead.** At the CLOSING position, RED produced
`frontmatter block opened at line 1 … and is never closed` for every offending row — a misleading
diagnosis naming the wrong fact. GREEN produces the SAME named refusal it produces at the opening
position, with `never closed` absent from the reason.

**Keyless success arm untouched:** body-only, empty and blank-lines-only documents each returned
`{ok:true,value:false}` before and after.

### Task 1 — end-to-end gate RED/GREEN on a hermetic mirror

Mirror built with `git archive HEAD | tar -x` into a throwaway temp dir; the live tree was never
planted into.

| plant on `.claude/skills/grugops-map/SKILL.md` | RED (committed `.js` before) | GREEN (rebuilt committed `.js`) |
|---|---|---|
| single leading BOM + `allowed-tools: … Agent(grugops-orchestrator)` | exit **0**, `ALL CHECKS PASSED` | exit **1** — `.claude/skills/grugops-map/SKILL.md: non-coordinator carries a spawn grant — rogue spawner` |
| `---` + U+0301 opening delimiter + the same rogue grant | exit **0**, `ALL CHECKS PASSED` | exit **1** — `frontmatter parse failure — the opening delimiter position carries \`---́\` … the first code point after the payload, U+0301, is outside the one whitespace class a delimiter may carry` |

### Task 1 — false-red cost, re-measured

`parseFrontmatter` run over **all 1115 tracked markdown files** in the repository: **0** delimiter
refusals. This covers block lines as well as head lines, because the closing scan walks every line of
an opened block under the same rule.

### Task 2 — the sweep proven non-circular

Corpus: 4 × 200 negative-space members (M, Cn, Co, Cs) sampled at a fixed stride 7, plus the 248
format/control/space-separator code points D-42 DID cover taken exhaustively (Cf 170, Cc 62, Zs 16),
plus the two payload variants, plus the two declared-class positive controls. Size asserted as 1048
offending members / 1050 with controls. Every member is exercised at BOTH delimiter positions in BOTH
placements — 4 constructions per member. The corpus additionally asserts that every negative-space
member is OUTSIDE `[\s\p{Cf}\p{Cc}]`, which is the property that makes the completeness claim
non-circular.

| scratch-build narrowing | sweep result |
|---|---|
| `isLegalDelimiter` → `line.trim() === payload` (D-39 point 3's alphabet) | **FAILS**, naming `U+FEFF trailing @ opening` |
| arm 1 gated on `/^[\s\p{Cf}\p{Cc}]+$/u` (D-42's OWN alphabet) | **FAILS**, naming `U+0302 trailing @ opening` — a combining mark D-42's alphabet does not contain |
| reverted | passes |

Under the D-42 narrowing the named-row cases also fail (5 failures), including the U+FE0F row and the
`....` row. A corpus generated from the alphabet under test could never have produced the U+0302
failure — which is precisely how D-42 would have shipped green over a live combining-mark bypass.

**The sweep forced the one legitimate exception to be DECLARED rather than discovered later.** On
first run it failed on `U+FEFF leading @ opening` — the single byte this module normalizes (D-39
point 1). That exception is now written into the sweep with its reason, and every other placement of
U+FEFF still refuses.

### Task 2 — the cardinality pin, two-sided

| mirror | `kit counts` result |
|---|---|
| live tree | PASS — `the spawn-grant scan composition holds exactly 26 members (agent 17 + skill 7 + packaging 2), each part set-equal to its own lister` |
| one skill directory removed | **FAIL** — `derived 25 members, expected exactly 26 (derived breakdown: agent 17 + skill 6 + packaging 2)` |
| one agent adapter added | **FAIL** — `derived 27 members, expected exactly 26 (derived breakdown: agent 18 + skill 7 + packaging 2)` |

The `+1` direction is caught **only** by the new composition pin — no other count moved.

### Task 2 — per-part membership, where a count passes and set equality does not

Scratch build: `spawnGrantScan` edited to DROP the `.claude/skills` part and add seven decoy members
under `.claude/agents`, holding the total at exactly 26.

- the cardinality check **passes** (26 = 26)
- the per-part assertion **fails red**, naming both parts:
  - `the … agent members are not exactly what .claude/agents/ derives — missing [], unexpected [.claude/agents/decoy-0.md … decoy-6.md]`
  - `the … skill members are not exactly what .claude/skills/ derives — missing [7 real SKILL.md paths], unexpected []`
- gate exit **1**; the test-side per-part case fails identically (3 failures)

### Task 2 — the `derive()` wrapper on the packaging call site

Mirror with `agent-factory/packaging` chmod 000:

- exit **1**
- the count floor NAMES it: `derived 0 members, expected exactly 26 (derived breakdown: agent 0 + skill 0 + packaging 0)` followed by `derivation error: kit-model: cannot read kit directory …/agent-factory/packaging`
- **0** unhandled exceptions; **13** guards/oracles still ran

### Task 2 — the false-red control and the unchanged WR-05 pass line

The control consumes `spawnGrantScan()` — the SAME function the guard consumes — parses all 26
members and refuses none, asserting a non-empty key set per member so a member that silently took the
keyless success arm cannot be counted as "did not refuse". The words `at least` do not appear in it.
`grep -v '^[[:space:]]*//' scripts/check-foundation-guards.ts | grep -c 'readPackagingDir'` is **0**.

WR-05's pass line reports the SAME numbers before and after the move:
`23 non-coordinator adapter bodies + 2 packaging template(s) checked`.

### Task 3 — enumeration RED/GREEN against the committed `.js`

| input | RED (before) | GREEN (after) |
|---|---|---|
| `tools: Agent(alpha, Task(beta), gamma)` | `{ok:true,value:["Task(beta","alpha"]}` — `gamma` DROPPED, `Task(beta` invented | REFUSED — `carries a nested opening parenthesis … the tail of the enumeration would have been discarded` |
| `tools: Agent("alpha, beta", gamma)` | `{ok:true,value:["\"alpha","beta\"","gamma"]}` — one name split into three altered ones | REFUSED — `carries a quote character, so the comma split is not the separator the document expresses` |
| `tools: Agent('alpha, beta', gamma)` | (same shape) | REFUSED — same reason |
| `tools: Read, Agent` (unscoped control) | `{ok:true,value:[]}` | `{ok:true,value:[]}` |
| `tools: Agent(grugops-qe-e2e, grugops-installer)` (control) | success | success |

Both refusal reasons carry the module's established closing clause,
`a name is never silently dropped or altered`, verbatim.

## Verification

| check | result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — all 32 committed `.js` fresh |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1035 passed / 2 skipped**, 35 files, 0 failures (baseline 1015) |
| `node scripts/check-foundation-guards.js` | exit 0 |
| `node scripts/coordinator-resolution-precheck.js` | exit 0 |
| `node scripts/check-kit-refs.js` | exit 0 |
| `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | exit 0 |
| live kit | 17 agent adapters, 7 standalone skills, 2 packaging templates |
| `git diff package.json` | empty |
| `grep -v '^[[:space:]]*//' scripts/frontmatter.ts \| grep -c 'uFEFF'` | **1** |
| declared whitespace class declarations | **1** (`const DELIMITER_WS_CHAR`) |
| `grep -c 'SCOPED_GRANT' scripts/frontmatter.ts` | **3**, and the expression line is byte-identical to HEAD |
| `git status --porcelain` | clean apart from this plan's files (`.planning/STATE.md` was already modified at plan start) |

## Deviations from Plan

### Auto-fixed / corrected

**1. [Rule 1 - Bug] The plan's stated coordinator grant cardinality was wrong (17 → 16)**
- **Found during:** Task 3
- **Issue:** The plan's action step says the false-red control asserts "the seventeen-name grant in
  `.claude/agents/grugops-orchestrator.md`". Measured against the committed `.js`, the live closure is
  **16** names — the seventeen agent adapters minus the coordinator itself, because a coordinator does
  not grant a spawn of a second copy of itself.
- **Fix:** The case asserts the MEASURED fact and derives it from the rule
  (`listAgentAdapters(root)` minus `grugops-orchestrator`) rather than restating a literal, so the
  next adapter added cannot silently falsify it. The discrepancy is recorded in the case comment.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `79b8c54`

**2. [Rule 2 - Missing critical functionality] The sweep exposed an undeclared exception**
- **Found during:** Task 2
- **Issue:** On its first run the sweep failed on `U+FEFF leading @ opening`. That is not a defect —
  it is the single byte the module normalizes (D-39 point 1) — but it was an exception the rule
  carried without stating.
- **Fix:** The exception is declared in the sweep with its reason, scoped to that one placement; every
  other placement of U+FEFF, including the leading position of a CLOSING delimiter, still refuses and
  is still swept.
- **Files modified:** `scripts/frontmatter.test.ts`
- **Commit:** `e7fdaa3`

**3. [Rule 3 - Blocking] `spawnGrantScanPrefix` added so the guard partitions rather than restates**
- **Found during:** Task 2
- **Issue:** The first draft of the relocated `PACKAGING_TEMPLATES` filtered the composition on a
  hard-coded `"agent-factory/packaging/"` literal — reintroducing the set-literal drift the move
  exists to delete, one string over.
- **Fix:** `SPAWN_GRANT_SCAN_PARTS` carries a `name` and `spawnGrantScanPrefix(name)` throws on an
  unknown name, so a typo cannot silently return `undefined` and partition the composition into
  nothing. The guard and both test consumers look the prefix up rather than restating it.
- **Files modified:** `scripts/kit-model.ts`, `scripts/check-foundation-guards.ts`
- **Commit:** `e7fdaa3`

### Findings recorded, not silently fixed

**The D-32 escape refusal inside `keysGrantedAgentNames` is now unreachable.** The new quote check is
strictly broader than "this fragment is quoted", so an enumeration carrying a backslash sequence
inside a quoted scalar now carries the quote first and refuses there, with a reason naming the quote
rather than the escape. It is KEPT rather than deleted: it enforces the D-32 allowlist decision at
that call site and becomes reachable again the moment the check above it is narrowed, and it cannot
disagree with the check above — only follow it. A note to that effect sits beside it in the code. The
five-application-point escape sweep in the parser oracle is untouched and still passes.

**Neither `keysGrantedAgentNames` consumer needed an edit.** `check-foundation-guards.ts:251` and
`coordinator-resolution-precheck.ts:402` already branch on the failure arm by hand, as the plan
predicted; both were read and both still exit 0 on the live tree.

## Known Stubs

None. Every predicate this plan added is live code reached by a case, and every acceptance criterion
carrying a "captured transcript" requirement has one recorded above.

## Threat Flags

None. Every mitigation in the plan's threat register landed as code plus a case:
T-27-CR01-01/02 (the delimiter refusal, proven end-to-end on a skill adapter), T-27-D43-01 (arm 1
consults no class), T-27-D43-02 (the sweep fails when narrowed to D-42's own alphabet),
T-27-CR01-03 (open and close reach the same named refusal), T-27-D43-03 (two-sided 26 plus per-part
set equality), T-27-D43-04 (the `derive()` wrapper), T-27-D39-02 (zero false reds over 1115 files),
T-27-WR02-04 (the enumeration refusal), T-27-BOM-01 (a second mark deliberately not stripped),
T-27-SC (zero package-manager installs; `package.json` byte-unchanged).

## Commits

| commit | task |
|---|---|
| `782b5ee` | Task 1 — the one legal delimiter spelling, both positions, both arms |
| `e7fdaa3` | Task 2 — the non-circular sweep and the relocated scan composition |
| `79b8c54` | Task 3 — the grant enumeration refusal |

## Self-Check: PASSED

All claimed files exist on disk; all three claimed commit hashes resolve in `git log`; the two
load-bearing new symbols (`spawnGrantScan`, `SPAWN_GRANT_SCAN_COUNT = 26`) are present in
`scripts/kit-model.ts`.
