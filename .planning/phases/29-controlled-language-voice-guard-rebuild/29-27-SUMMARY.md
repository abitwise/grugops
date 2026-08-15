---
phase: 29-controlled-language-voice-guard-rebuild
plan: 27
subsystem: testing
tags: [typescript, voice-guard, fence-parser, vacuity, foundation-guards, gap-closure]

requires:
  - phase: 29-controlled-language-voice-guard-rebuild
    provides: "frontmatter.ts's sectionEndIndex / unfencedHeadingIndex — the ONE section locator (plan 29-20, D-24); vacuity.ts's reportMeasured — the ONE element-level vacuity rule (plan 29-01, AP-1/D-08)"
provides:
  - "readCavemanFence takes its section bound from sectionEndIndex over a DELIMITER-NEUTRALISED projection, so the fence being measured can no longer decide its own section's extent (CR-01 closed)"
  - "guard_voice folds through reportMeasured: a derived denominator, a per-file scanned line count, and an element-level floor that makes a collapsed remainder a named finding"
  - "SEC_VOICE_FILE_COUNT — the declared cardinality of the one hand-maintained half of the voice corpus, pinned two-sided at source level and mechanically through the denominator floor"
  - "guardSection() in the harness — guard attribution by output BANNER rather than by indentation"
  - "a UNION whole-gate case proving both halves of LANG-06's fix on one document, with a history-independent falsifiability probe"
affects: [29-28, 29-29, 29-30, 29-31, 29-32, voice-guards, foundation-guards]

actuals:
  tokens: 17100
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Delimiter-neutralised projection: when a consumer must ask a fence-AWARE authority a question about its OWN fenced block, neutralise the delimiters in the text handed to the authority rather than forking the authority or writing a private predicate"
    - "Guard attribution by output section (banner-to-next-banner) rather than by indentation — a positional accident is not a property"
    - "A hand-maintained set literal declares its count beside it, and the count reaches a reportMeasured denominator so drift reds the GATE, not only a test"

key-files:
  created: []
  modified:
    - scripts/voice-model.ts
    - scripts/voice-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "The bound is taken from sectionEndIndex over a delimiter-neutralised projection of the document (D-24 preserved: the shared authority is composed, never re-implemented; no private heading regex added to voice-model.ts)"
  - "Round 2's `ok: true` expectation on a heading-inside-interior document is REVERSED back to `unterminated`, and both reversals are recorded at the case rather than silently re-baselined a third time"
  - "guard_voice's aggregate FAIL wording now belongs to reportMeasured, not to the guard — the point of a shared authority is that the sentence is the authority's"
  - "The two-consumer partition is re-keyed from column to output section, because folding guard_voice through reportMeasured indented its findings and a whitespace-keyed partition would have silently stopped discriminating"
  - "The union case's falsifiability probe is a scratch-build revert of the bound expression, not a git-hash checkout — keying the proof to a commit would rot the first time the file moves"

patterns-established:
  - "Circularity check: when routing a consumer through a shared authority, ask whether the consumer's own INPUT feeds the state the authority keys on. That is exactly how round 2 reopened this defect."
  - "A premise helper that THROWS a named message, with a companion case that FORCES each premise once — a premise that has never been seen refusing is a comment."

requirements-completed: [LANG-06]

coverage:
  - id: D1
    description: "readCavemanFence refuses `unterminated` by name on a level-one-or-two ATX heading written inside the fence interior, at both heading levels, and never returns `ok: true` with an empty `outside`"
    requirement: LANG-06
    verification:
      - kind: unit
        ref: "scripts/voice-model.test.ts#a `## ` heading inside the fence interior refuses `unterminated` — the block may not extend its own section"
        status: pass
      - kind: unit
        ref: "scripts/voice-model.test.ts#a `# ` heading inside the fence interior ALSO refuses `unterminated` — the level axis, from the other side"
        status: pass
      - kind: unit
        ref: "scripts/voice-model.test.ts#CR-01's exact document — the reviewer's bytes, refused rather than emptying `outside`"
        status: pass
      - kind: unit
        ref: "scripts/voice-model.test.ts#the UNION cell — level-one + trailing whitespace + a nested fenced run, all at once"
        status: pass
    human_judgment: false
  - id: D2
    description: "The `### ` sub-heading control and the well-formed live-corpus control stay GREEN — the fix scopes the reader without re-measuring the corpus, and `outside` is asserted non-empty directly for all 17 roles"
    requirement: LANG-06
    verification:
      - kind: unit
        ref: "scripts/voice-model.test.ts#a `### ` sub-heading does NOT close the caveman section — a subsection structures a section"
        status: pass
      - kind: unit
        ref: "scripts/voice-model.test.ts#every live role returns ok with a non-empty interior — the false-red control"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#an UNMODIFIED mirror still exits 0 under the section bound — the false-red control"
        status: pass
    human_judgment: false
  - id: D3
    description: "guard_voice publishes a derived denominator and a per-file scanned line count; a collapsed remainder is a named finding rather than a silent pass"
    requirement: LANG-06
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_voice's PASS line carries a DERIVED denominator, and one scanned-line count per voice file"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#a voice file whose scan remainder COLLAPSES is a named finding, not a silent pass"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#a role file whose caveman fence is left OPEN across a later heading exits 1 with no guard_voice pass line"
        status: pass
    human_judgment: false
  - id: D4
    description: "SEC_VOICE_FILES cardinality is pinned two-sided against SEC_VOICE_FILE_COUNT, with a planted-member probe that names the added member and a scratch-build probe proving the drift REDS THE GATE"
    requirement: LANG-06
    verification:
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#SEC_VOICE_FILES cardinality is pinned against SEC_VOICE_FILE_COUNT, and the pin is not vacuous"
        status: pass
      - kind: unit
        ref: "scripts/check-foundation-guards.test.ts#the SEC_VOICE cardinality pin REDS on a planted member, and names it — the falsifiability probe"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#the SEC_VOICE cardinality drift REDS THE GATE ITSELF, not only a source-level assertion"
        status: pass
    human_judgment: false
  - id: D5
    description: "The UNION: an open fence swallowing a caveman-reworded section exits 1 and BOTH voice guards name the same file with the same reason from the same verdict — proven non-vacuous against a reconstructed pre-fix reader"
    requirement: LANG-06
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#THE UNION: an open fence swallowing a caveman-reworded section exits 1, and BOTH guards name the same file for the same reason"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#THE UNION IS PROVEN ABLE TO FAIL: the pre-fix reader bound passes the same document"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#the union plant refuses to be vacuous — BOTH of its premises fail with a NAMED message"
        status: pass
    human_judgment: false
  - id: D6
    description: "The four surviving fence-grammar / scan-scope variants (V-29-26-01..04) re-measured against the tree this plan produces; none flipped fail-open"
    requirement: LANG-06
    verification:
      - kind: other
        ref: "node -e over the committed .js — the four-variant residual table below, every number produced by the command pasted beside it"
        status: pass
    human_judgment: true
    rationale: "A residual RECORD is an evidence artifact, not a mechanism. Whether the recorded directions are acceptable to carry forward is a human judgment; the plan explicitly forbids repairing them here (a plan that repairs what it measures has graded its own paper)."

duration: 24min
completed: 2026-08-16
status: complete
---

# Phase 29 Plan 27: Fail-closed caveman reader + a guard_voice that publishes its denominator

**`readCavemanFence` now takes its section bound from `sectionEndIndex` over a delimiter-neutralised projection — so the fence being measured cannot decide its own extent — and `guard_voice` folds through `reportMeasured`, ending the one foundation guard that could print a PASS for a scan of zero bytes.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-08-16T00:42:00Z
- **Completed:** 2026-08-16T01:06:00Z
- **Tasks:** 3
- **Files modified:** 4 (+ their committed `.js`)

## Accomplishments

- **CR-01 closed structurally.** The bound is still the ONE authority; what changed is the TEXT it is asked about. Every `FENCE_DELIMITER_LINE` line is replaced by an empty line (line count and all other bytes preserved) and `sectionEndIndex` is asked over that projection, where `fencedLineFlags` is all-false. The answer is the fence-blind level-at-most-two successor — exactly the bound `3ed76c1` computed, now produced by the shared authority rather than by a private regex. No new grammar, no new exported symbol, no heading-level regex in `voice-model.ts`.
- **WR-01 closed in the same commit.** The header's cost paragraph stated a deleted fail direction; it now states the SHIPPED one, names the circularity as the mechanism, states the authority's SCOPE, and carries the accepted cost as a re-measured live number (0 of 17).
- **AP-1's last live instance closed.** `guard_voice` was the only foundation guard with no measurement at all. It now publishes `voice: 0 findings over 19/19 elements` plus one `scanned N clear-voice line(s)` line per voice file, and a collapsed remainder is a named finding.
- **The hand-maintained half of the voice corpus is now counted.** `SEC_VOICE_FILE_COUNT` is declared beside `SEC_VOICE_FILES`, `expected` is `ROLE_COUNT + SEC_VOICE_FILE_COUNT` (the role half from `kit-model.ts`, a module this corpus does not otherwise consult), and drift in either direction reds the gate through the denominator floor.
- **Both halves proven together.** One whole-gate UNION case on the attack in full, with a history-independent proof that it can fail.

## Task Commits

1. **Task 1 (tracer, TDD): the caveman reader stops letting the block it measures decide its own section's extent** — `3e72f44` (fix)
2. **Task 2 (TDD): guard_voice publishes what it measured** — `edf8f97` (feat)
3. **Task 3: the union case and the residual record** — `c0faf15` (test)

## Files Created/Modified

- `scripts/voice-model.ts` — the `blindText` projection + `sectionEnd` from the shared authority; the header's circularity argument, scope statement and corrected cost paragraph
- `scripts/voice-model.test.ts` — 4 new permanent cases; the round-2 `ok: true` case reversed with both reversals recorded; the live-corpus control now asserts `outside` directly
- `scripts/check-foundation-guards.ts` — `SEC_VOICE_FILE_COUNT`, `VOICE_FILE_COUNT`, `guardVoice` reshaped to a `VoiceFinding[]` + `Measured` fold with a per-file measurement line and an element-level floor
- `scripts/check-foundation-guards.test.ts` — `guardSection()` attribution helper; 7 new cases; 5 existing assertions re-keyed off the retired wording/indentation

---

## Task 1 — the RED-first transcript

Every new case was written BEFORE the reader was touched and run against the committed (pre-fix) build. Verbatim:

```
$ npx vitest run scripts/voice-model.test.ts

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 4 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  scripts/voice-model.test.ts > readCavemanFence — the section bound (plan 29-14, CR-01) > a `## ` heading inside the fence interior refuses `unterminated` — the block may not extend its own section
 FAIL  scripts/voice-model.test.ts > readCavemanFence — the section bound (plan 29-14, CR-01) > a `# ` heading inside the fence interior ALSO refuses `unterminated` — the level axis, from the other side
 FAIL  scripts/voice-model.test.ts > readCavemanFence — the section bound (plan 29-14, CR-01) > CR-01's exact document — the reviewer's bytes, refused rather than emptying `outside`
 FAIL  scripts/voice-model.test.ts > readCavemanFence — the section bound (plan 29-14, CR-01) > the UNION cell — level-one + trailing whitespace + a nested fenced run, all at once
 Test Files  1 failed (1)
      Tests  4 failed | 39 passed (43)
```

The received value on the CR-01 case, verbatim — this is the defect in one object:

```
AssertionError: expected { ok: true, …(2) } to deeply equal { ok: false, reason: 'unterminated' }
  {
-   "ok": false,
-   "reason": "unterminated",
+   "inside": "grug club rock cave
+
+ ## Notes
+ you no think, big brain swamp demon",
+   "ok": true,
+   "outside": "",
  }
```

After the fix, same command:

```
 Test Files  1 passed (1)
      Tests  43 passed (43)
```

## Task 1 — ADVERSARIAL SELF-REPRODUCTION: the three-build CR-01 table

Built on hermetic mirrors (`git archive <ref> | tar -x -C <tmpdir>`), never the live tree. The document is `29-REVIEW.md:110-117` verbatim. The probe:

```js
// cr01.mjs
const m = await import(process.argv[2]);
const d=["## Caveman prompt","```","grug club rock cave","","## Notes",
         "you no think, big brain swamp demon","```",""].join("\n");
const v=m.readCavemanFence(d);
console.log("ok=", v.ok, "reason=", v.reason ?? "-", "outside=", JSON.stringify(v.outside));
```

```
$ git show 3ed76c1:scripts/voice-model.js  > $SP/old3ed/voice-model.js
$ git show 3ed76c1:scripts/frontmatter.js  > $SP/old3ed/frontmatter.js
$ git archive 0ec8b61 | tar -x -C $SP/head-mirror        # HEAD before this plan
$ git archive HEAD    | tar -x -C $SP/post-mirror        # HEAD after Task 1

=== BUILD 3ed76c1 ===
ok= false reason= unterminated outside= undefined
=== BUILD HEAD pre-fix (mirror) ===
ok= true reason= - outside= ""
=== HEAD AFTER Task 1 (hermetic mirror) ===
ok= false reason= unterminated outside= undefined
```

| build | verdict | `outside` |
|---|---|---|
| `3ed76c1` (pre-round-2) | `{"ok":false,"reason":"unterminated"}` | n/a |
| HEAD before this task (`0ec8b61`) | `ok:true` | `""` — the entire scan surface of `guard_voice` |
| HEAD after this task (`3e72f44`) | `{"ok":false,"reason":"unterminated"}` | n/a |

The regression is reproduced and closed, and the closure is verified on a mirror of the COMMIT, not the working tree.

## Task 1 — the accepted cost, measured live

`node -e` over the committed `.js`, deriving the anchor through `unfencedHeadingIndex` and the delimiters through `FENCE_DELIMITER_LINE` (so the count is independent of the bound under test):

```
role files derived: 17 (ROLE_COUNT = 17)
role files carrying a level-1-or-2 ATX line inside their caveman interior: 0
```

**0 of 17** — the refusal has zero live instances on the shipped tree. The number is written into the corrected header paragraph and re-measured here rather than transcribed. Had it been non-zero the plan required escalation; it is not.

## Task 1 — acceptance greps

```
$ grep -a -c 'sectionEndIndex' scripts/voice-model.ts
6
$ grep -a -v '^\s*[/*]' scripts/voice-model.ts | grep -ac '\^#'
0
```

At least one call to the shared authority; zero heading-level regexes of this module's own outside comments.

---

## Task 2 — ADVERSARIAL SELF-REPRODUCTION: the whole gate, pre vs post

On a hermetic mirror of `0ec8b61`, one role file's caveman fence was left open across a planted `## Notes` heading. Premise asserted before the run:

```
PREMISE heading 10 open 11 close 15
PREMISE planted ## Notes at 16 delimiters at 11,18 -> heading sits BETWEEN: true
```

**PRE (the pre-plan build `0ec8b61`, run against the planted tree):**

```
exit=0
[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
  PASS  voice: clear-voice surfaces free of caveman markers
```

Exit 0. A bare PASS. No denominator, no per-file line, and the planted file is never named anywhere in the output.

**POST (this plan's build, run against the SAME planted tree):**

```
exit=1
[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)
        agents-md-scribe.md: scanned 45 clear-voice line(s), 0 marker line(s)
        architect-design.md: scanned 45 clear-voice line(s), 0 marker line(s)
        ba-pm.md: scanned 46 clear-voice line(s), 0 marker line(s)
        … 15 more …
        security-nfr-checklist.md: scanned 419 clear-voice line(s), 0 marker line(s)
  FAIL  voice: 1 finding(s) over 19 elements
  agent-factory/roles/brownfield-mapper.md: ## Caveman prompt fence refused — reason unterminated; the clear-voice remainder was not determined, so this file was NOT scanned
```

Exit 1, the finding names the file with the reason, and **18 scanned lines against a denominator of 19** — the file that was not scanned is visible by arithmetic as well as by name. (See Deviation 1: the plan's acceptance text expected a scanned count FOR the refused file; Task 1's reader refusal now fires first on that route, so the count is published on the collapsed-remainder route instead — shown next.)

## Task 2 — the element-level floor, proven REACHED

The zero-remainder floor is only reachable when the reader ACCEPTS the file and the remainder is nonetheless empty. A `SEC_VOICE_FILES` surface carries no caveman fence by declaration, so the whole document is its remainder — emptying it takes that route:

```
$ : > $SP/plant2/agent-factory/checklists/security-nfr-checklist.md
$ CHECK_ROOT=$SP/plant2 node scripts/check-foundation-guards.js
exit=1
        security-nfr-checklist.md: scanned 1 clear-voice line(s), 0 marker line(s)
  FAIL  voice: 1 finding(s) over 19 elements
  agent-factory/checklists/security-nfr-checklist.md: the clear-voice remainder collapsed to 1 line(s) with no content — a zero-line remainder is indistinguishable from a clean one, so this file was NOT effectively scanned
```

And the pre-plan build on the **same bytes** — the discrimination:

```
$ CHECK_ROOT=$SP/plant2 node $SP/head-mirror/scripts/check-foundation-guards.js
exit=0
  PASS  voice: clear-voice surfaces free of caveman markers
$ grep -ac "security-nfr-checklist" $SP/zero-pre.txt
0
```

Exit 0, bare pass, file never named. The floor is not decoration.

## Task 2 — the planted-member probe, SEEN FAILING

Same predicate the permanent case uses, run over mutated source:

```
SHIPPED SOURCE -> null
PLANTED MEMBER -> SEC_VOICE_FILES holds 3 member(s) [agent-factory/checklists/planted-extra-surface.md, agent-factory/workflows/15-security-audit.md, agent-factory/checklists/security-nfr-checklist.md] but SEC_VOICE_FILE_COUNT declares 2
REMOVED MEMBER -> SEC_VOICE_FILES holds 1 member(s) [agent-factory/checklists/security-nfr-checklist.md] but SEC_VOICE_FILE_COUNT declares 2
```

Both directions red, and the added-member failure NAMES the added member. And the drift reds the **gate**, not only an assertion — a scratch build with one extra `SEC_VOICE_FILES` member and the constant unbumped:

```
  FAIL  voice: visited 20 of 19 elements — the scan set is short, so the result covers less than it claims
  PASS  caveman voice: 0 findings over 17/17 elements
```

The sibling guard is untouched, so the red is attributable to the voice-corpus drift.

## Task 2 — acceptance greps

```
$ node scripts/check-foundation-guards.js | grep -aEc '(voice).*0 findings over [0-9]+/[0-9]+ elements'
2
$ node scripts/check-foundation-guards.js | grep -aE '(voice).*0 findings over [0-9]+/[0-9]+ elements'
  PASS  voice: 0 findings over 19/19 elements
  PASS  caveman voice: 0 findings over 17/17 elements

$ node scripts/check-foundation-guards.js | grep -ac 'scanned '
19
$ node -e 'import("./scripts/kit-model.js").then(k=>console.log(k.ROLE_COUNT, "+ 2 =", k.ROLE_COUNT+2))'
17 + 2 = 19
```

Round 3's recorded evidence was that only ONE of the two matched. **Two is the closure condition and two is what the tree reports.** The scanned-line count equals the independently derived `ROLE_COUNT + SEC_VOICE_FILE_COUNT`, derived by running `kit-model.js` in this session rather than transcribing 19 from the plan.

---

## Task 3 — LANG-06's four enumerated `missing:` items, traced to landed artifacts

| # | `missing:` item (verbatim from `29-VERIFICATION.md`) | landed artifact | the case that pins it |
|---|---|---|---|
| 1 | "Restore the fail-closed direction without a private predicate: compute the FENCE-BLIND level-≤2 successor as well and refuse `unterminated` by name when the closing delimiter sits beyond it, or add an explicit `heading-inside-interior` refusal arm" | `scripts/voice-model.ts:184-201` — the `blindText` projection and `sectionEnd = sectionEndIndex(blindText, heading + 1, 2)`; `grep -ac '\^#'` outside comments = 0, so no private predicate | `voice-model.test.ts` — "a `## ` heading inside the fence interior refuses `unterminated`" and "a `# ` heading … ALSO refuses `unterminated`" |
| 2 | "Publish and two-side-pin what guard_voice actually scanned — the `outside` line count per file — so a remainder that collapses is a red rather than a silent pass" | `scripts/check-foundation-guards.ts:2116-2134` — the per-file `scanned N clear-voice line(s)` line and the element-level floor; `:2141-2151` — the `Measured` fold with `expected: VOICE_FILE_COUNT` | `check-foundation-guards.test.ts` — "guard_voice's PASS line carries a DERIVED denominator, and one scanned-line count per voice file" + "a voice file whose scan remainder COLLAPSES is a named finding, not a silent pass" |
| 3 | "Correct scripts/voice-model.ts:123-128 in the same commit so the module's stated fail direction matches the shipped one" | `scripts/voice-model.ts:123-158` — rewritten in commit `3e72f44`, the SAME commit as the fix; states the circularity, the authority's scope, the shipped direction, and the accepted cost with its measured 0-of-17 | the measurement itself (`node -e` over the committed `.js`, above); the header's claim is re-derivable rather than asserted |
| 4 | "Add a permanent case planting a fence opened inside the caveman section and closed after a later `##` heading, asserting the intended verdict AND asserting `outside` is non-empty" | `voice-model.test.ts` (unit) + `check-foundation-guards.test.ts` (whole gate, T1 and T3) | "CR-01's exact document — the reviewer's bytes, refused rather than emptying `outside`" (verdict + a DIRECT non-empty-`outside` assertion); "every live role returns ok with a non-empty interior" now asserts `outside`'s line count and bytes for all 17; "a role file whose caveman fence is left OPEN across a later heading exits 1"; "THE UNION" |

No item dropped.

## Task 3 — the four surviving variants, RE-MEASURED

Corpus for rows 01/03/04: the markdown members of `safetySurfaceUnion()` — **40 documents**, derived live:

```
$ node -e 'import("./scripts/generate-safety-surface.js").then(g=>console.log(
    g.safetySurfaceUnion().map(x=>x.file).filter(f=>f.endsWith(".md")).length))'
40
```

| variant | direction under this plan's bound | changed by this plan? | live input set, re-measured |
|---|---|---|---|
| **V-29-26-01** — a setext level-two heading as the bound; the ATX-only authority cannot see it | **fail-open, UNCHANGED.** Re-run verbatim: `{"ok":true,"inside":"grug club rock cave smash","outside":"You senior prose here with no fence at all.\nAppendix\n---\nSome later top-level section.\n"}` | **No.** Neutralising delimiters changes which FENCE lines the authority sees; it does not teach the authority setext. The bound axis is orthogonal. | **0** setext level-two headings in the bodies of the 40 documents; **37 of 40** carry a frontmatter terminator that a setext-aware authority would misread (the recorded carve-out cost) |
| **V-29-26-02** — the derived LANG-07 scans are `scripts/`-scoped and non-recursive while the claim is tree-wide | **scope claim, UNCHANGED.** Not a verdict at all; no direction to flip. | **No.** This plan touches neither scan's derivation. | owners scan reads **41 of 49** tracked non-test `.ts`; tripwire reads **47 of 53** tracked `*.test.ts`. Unread (owners): `hooks/admission-guard.ts`, `hooks/guard.ts`, `install/install.ts`, `install/kit-source.ts`, `install/uninstall.ts`, `scripts/runnable-ref/reference-check.ts`, `scripts/runnable-ref/test-skip-integrity.ts`, `vitest.config.ts` |
| **V-29-26-03** — `FENCE_DELIMITER_LINE` is a prefix test, so a four-backtick run is closed early by a three-backtick line inside it | **fail-open, UNCHANGED.** Re-run verbatim: `{"ok":true,"inside":"grug club rock","outside":"# Role\ngrug smash cave\n````\n"}` | **No — and expected.** This is in the fence GRAMMAR, not the section locator. The neutralisation uses the same class, so it inherits the same grammar exactly; it neither widens nor narrows it. | **0** four-or-more-backtick delimiter lines across the 40 documents, against **42** column-zero three-backtick delimiter lines. Empty input set. |
| **V-29-26-04** — an indented delimiter is invisible to the column-zero-anchored class | **fail-closed, UNCHANGED.** Same reason as 03: fence grammar, not section extent. | **No.** | **4** indented fence delimiters, all in `README.md`, lines **31, 33, 40, 42** (`   ```bash`, `   ```, `   ```text`, `   ```). The audit's "six lines" counts these 4 delimiters plus the 2 content lines they bracket; both numbers are consistent and the delimiter count is 4. |

Commands, pasted so every number is re-derivable:

```
# rows 01 / 03 / 04 — one script over the derived corpus
node -e 'Promise.all([import("./scripts/generate-safety-surface.js"), import("./scripts/frontmatter.js")]).then(async ([g, fm])=>{
  const fs = await import("node:fs");
  const docs = g.safetySurfaceUnion().map(x=>x.file).filter(f=>f.endsWith(".md"));
  let setext=0, fmTerm=0;
  for (const f of docs) { const text=fs.readFileSync(f,"utf8"), lines=text.split("\n");
    let bodyStart=0; if (lines[0]==="---") { const t=lines.findIndex((l,i)=>i>0&&l==="---"); if (t>0){bodyStart=t+1;fmTerm++;} }
    const flags=fm.fencedLineFlags(text);
    for (let i=bodyStart+1;i<lines.length;i++) if (!flags[i] && /^-{2,}\s*$/.test(lines[i]) && lines[i-1].trim()!=="" && !/^#/.test(lines[i-1])) setext++; }
  let four=0, three=0, indented=[];
  for (const f of docs) fs.readFileSync(f,"utf8").split("\n").forEach((l,i)=>{
    if (/^`{4,}/.test(l)) four++; else if (/^```/.test(l)) three++;
    if (/^ {1,3}`{3,}/.test(l)) indented.push(`${f}:${i+1}`); });
  console.log({docs:docs.length, setext, fmTerm, four, three, indented}); });'
# -> { docs: 40, setext: 0, fmTerm: 37, four: 0, three: 42,
#      indented: [ "README.md:31", "README.md:33", "README.md:40", "README.md:42" ] }

# row 02 — scan scope against git's own tracked file list
node -e 'const {execSync}=require("child_process"), fs=require("fs");
  const tracked=execSync("git ls-files",{encoding:"utf8"}).split("\n").filter(Boolean);
  const nonTest=tracked.filter(f=>f.endsWith(".ts")&&!f.endsWith(".test.ts")&&!f.endsWith(".d.ts"));
  const scan=fs.readdirSync("scripts").filter(n=>n.endsWith(".ts")&&!n.endsWith(".test.ts"));
  const tests=tracked.filter(f=>f.endsWith(".test.ts"));
  const scanT=fs.readdirSync("scripts").filter(n=>n.endsWith(".test.ts"));
  console.log(scan.length,"of",nonTest.length,"|",scanT.length,"of",tests.length);'
# -> 41 of 49 | 47 of 53
```

**None of the four flipped from fail-closed to fail-open under the new bound.** The plan's escalation condition is not met. V-29-26-03 and V-29-26-04 are fence-GRAMMAR residuals and are deliberately NOT repaired here — a plan that repairs what it measures has graded its own paper.

---

## Verification

| check | command | result |
|---|---|---|
| build + freshness | `npm run build && npm run freshness` | `All build outputs fresh: 48 committed .js file(s) match a fresh tsc rebuild.` |
| the full gate | `node scripts/check-foundation-guards.js` | exit **0**, `ALL CHECKS PASSED`; `guard_voice` PASS carries `0 findings over 19/19 elements` |
| NUL bytes | `node scripts/check-nul-bytes.js` | exit **0** — the counting greps above are trustworthy |
| regression suite | `npx vitest run --exclude '**/scripts/e2e/**'` | **1890 passed / 2 skipped across 52 files** (round 3 baseline: 1878 / 2 / 52 — **+12**, and no file lost) |
| working tree | `git status --porcelain` | no source file modified by a reproduction; only the pre-existing `.planning/STATE.md`, `human-notes.txt`, `.gsd/`, `.planning/phases/29.1-…` |

Suite delta accounting (so a silently shrinking suite would be visible): `voice-model.test.ts` +4 new cases −1 reversed case = **+3**; `check-foundation-guards.test.ts` **+9** new cases. 1878 + 3 + 9 = **1890**.

## Decisions Made

1. **The bound is fence-BLIND again, but produced by the fence-aware authority.** Reverting to a private `/^#{1,2} /` would have restored the behaviour and re-created the fifth heuristic D-24 deleted. Neutralising the delimiters in the *input* keeps one authority and one grammar while restoring `3ed76c1`'s answer exactly.
2. **Round 2's expectation is reversed, and the reversal is recorded at the case with both prior positions.** This case has now moved 29-14 → 29-20 → 29-27. Silently re-baselining it a third time is how the phase lost track of its own fail direction.
3. **The aggregate FAIL wording now belongs to `reportMeasured`.** Two existing IN-03 scope controls asserted `"voice-discipline violation"`, a string `guardVoice` no longer owns. They now assert the authority's published shape *with its denominator*, which is strictly more than the string they replaced.
4. **Guard attribution is re-keyed from column to output section.** See Deviation 2 — this is the most load-bearing incidental change in the plan.
5. **The union case's falsifiability proof is a scratch-build revert, not a git checkout.** Keying a permanent case to `0ec8b61` would rot; reverting one expression in the scratch `voice-model.js` reconstructs the pre-fix reader from the shipped source and stays true as the file moves.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's Task 2 acceptance text is unsatisfiable as written on the route it names**

- **Found during:** Task 2 (whole-gate reproduction)
- **Issue:** The plan required "Post: exit 1, the finding names the file, **and the published scanned count for that file is visible**" for a role file carrying the CR-01 plant. After Task 1, that file is refused `unterminated` by the reader, so `guardVoice` takes the byte-preserved "this file was NOT scanned" branch and — correctly — publishes no scanned count for it. The acceptance clause was written before Task 1's refusal existed and the two arms of the plan are in tension.
- **Fix:** Not fabricated and not silently dropped. The refused-file route is evidenced by what it actually publishes: the finding names the file and the reason, and **18 scanned lines against a denominator of 19** makes the unscanned file visible by arithmetic as well as by name. The "published scanned count is visible" clause is satisfied on the route where the floor genuinely fires — the collapsed-remainder plant, which prints `security-nfr-checklist.md: scanned 1 clear-voice line(s)` immediately above its own finding. Both transcripts are above.
- **Files modified:** none (evidence, not code)
- **Verification:** both transcripts pasted; permanent cases exist for both routes
- **Committed in:** `edf8f97`

**2. [Rule 1 - Bug] Folding `guardVoice` through `reportMeasured` silently disarmed five existing assertions**

- **Found during:** Task 2 (first test run after the fold — 7 cases red)
- **Issue:** Two classes. (a) Two IN-03 scope controls asserted the retired `"voice-discipline violation"` string. (b) Three cases told the two voice guards apart **by column**: `guard_voice` printed findings at column zero (raw string accumulation) and `guard_caveman_voice` printed them indented (`reportMeasured`'s renderer). Folding `guard_voice` through the same authority indented its findings too, so the partition went from discriminating to **always-zero** — a case that "asserts both consumers named the file" would have kept passing while asserting nothing about which guard printed what.
- **Fix:** (a) the two controls now assert `reportMeasured`'s published shape *with its denominator*. (b) a new `guardSection(o, banner)` helper attributes a line to the guard whose `[banner]`-to-next-banner output section it sits in — structural attribution that stays true however either guard formats. All three partition sites re-keyed, with the reasoning recorded at the helper's declaration.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** 197/197 in that file; the union case's three-way assertion (gate + `guard_voice` + `guard_caveman_voice`) is built on the new attribution and is proven able to fail via the scratch-build probe
- **Committed in:** `edf8f97` (re-keying) and `c0faf15` (union case built on it)

**3. [Rule 2 - Missing Critical] The union plant located its heading by `findIndex` from zero**

- **Found during:** Task 3 (self-review of the plant before committing)
- **Issue:** `UNION_HEADING` is `## Hard limits` — deliberately, because a caveman-reworded safety surface is the actual attack. But that heading is a real section of every role file. `planted.findIndex(l => l === UNION_HEADING)` returns the FIRST occurrence, so on any role file whose caveman section sat below `## Hard limits` the bracket check would have been answering about the file's own heading, not the planted one, and the case could have gone vacuous without saying so.
- **Fix:** the search starts at the insertion point (`indexOf(UNION_HEADING, at)`), and the plant additionally asserts it added **exactly one** new occurrence (`occurrences(planted) === occurrences(lines) + 1`), throwing a named message otherwise.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Verification:** 197/197; both premise messages forced once by the companion case
- **Committed in:** `c0faf15`

---

**Total deviations:** 3 auto-fixed (1 bug in the plan's own acceptance text, 1 bug the fold introduced in existing assertions, 1 missing-critical premise hardening)
**Impact on plan:** All three were required for correctness of the evidence. Deviation 2 is the one worth carrying forward: **an assertion keyed to a formatting accident stops discriminating the moment the formatting is unified, and it stops silently.** That is the same class as this phase's recorded bypasses.

## Issues Encountered

- **The tracer feedback gate was satisfied automatically rather than by a human checkpoint.** Task 1 is `type="tracer"` and this is an interactive run, which normally halts for a `checkpoint:human-verify` after the tracer commit. It was continued instead, on three grounds recorded here rather than left implicit: the plan frontmatter declares `autonomous: true`, `.planning/config.json` sets `workflow.human_verify_mode: end-of-phase`, and the tracer's `<verify>` is fully automated and passed end-to-end (build clean, 43/43, the three-build reproduction showing exactly the expected transition, gate exit 0, whole suite green). Flagging it so the end-of-phase human verification knows the gate was auto-satisfied.
- No auth gates, no package installs, no architectural decisions.

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired components were introduced. Every new assertion has been seen failing against a build where the property does not hold.

## Threat Flags

None. The plan's `<threat_model>` covers every surface touched; no new network endpoint, auth path, file-access pattern or trust-boundary schema was introduced. `T-29-27-SC` (package installs) remains an empty input set — this plan installs nothing.

## Next Phase Readiness

- **Unblocks the rest of round 3.** This plan was sequenced first because every later plan's "all seven gates exit 0" evidence was worth nothing while `guard_voice` could measure zero bytes and pass. That is now closed in both halves: the reader refuses, and the guard publishes its denominator.
- **A note for 29-28 / 29-30 / 29-31, which also fold guards through `reportMeasured` (D-08):** `guardSection()` now exists in `check-foundation-guards.test.ts` and should be used for any "both consumers named it" assertion. Do not re-key such an assertion to indentation — that is precisely what Deviation 2 records.
- **Carried forward untouched, by instruction:** V-29-26-01 (setext, fail-open, 0 live), V-29-26-03 (backtick run length, fail-open, 0 live), V-29-26-04 (indented delimiter, fail-closed by corpus accident, 4 live lines in `README.md`). These are round 3's separately-tracked fence-grammar work. V-29-26-02's scan-scope shortfall (41/49 and 47/53) is LANG-07's, addressed by 29-28/29-29/29-32.

## Self-Check: PASSED

All four modified source files exist on disk. All three task commits (`3e72f44`, `edf8f97`, `c0faf15`) exist in git history.

---
*Phase: 29-controlled-language-voice-guard-rebuild*
*Completed: 2026-08-16*
