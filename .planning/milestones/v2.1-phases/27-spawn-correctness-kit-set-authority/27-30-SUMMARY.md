---
phase: 27-spawn-correctness-kit-set-authority
plan: 30
subsystem: frontmatter-authority
tags: [KIT-03, SPAWN-04, IN-01, IN-02, D-34, security, parser, scoping-gate]
status: complete
requirements: [KIT-03, SPAWN-04]
gap_closure: true
gap_round: 4

requires:
  - "scripts/frontmatter.ts — the single format-aware frontmatter authority (plan 27-12, hardened 27-29)"
  - "scripts/check-foundation-guards.test.ts — the hermetic CHECK_ROOT mirror harness"
  - "scripts/check-foundation-guards.ts reshapeToolsBlock's sibling helper discipline (plan 27-26)"
provides:
  - "YAML_DIRECTIVE — a leading YAML directive line is refused BY NAME, closing the second silent-SUCCESS arm in the read path (D-34)"
  - "A three-outcome contract whose second arm now reads 'no block at all AND no directive prologue' — the partition MOVED, it did not grow"
  - "plantSkillWithoutToolsKey — the fixture that makes the agent-adapter scoping gate load-bearing"
  - "The reviewer's `UNKNOWN - verify` on platform directive handling, carried into the shipped header rather than overstated as a reproduced bypass"
affects:
  - "scripts/check-foundation-guards.ts — guard_wr05 now reds on a directive-prefixed adapter or skill"
  - "scripts/coordinator-resolution-precheck.ts — inherits the refusal through the shared reader"

tech-stack:
  added: []
  patterns:
    - "A positional test that takes NO LOOKAHEAD: refusing the directive on sight closes the two-directive prologue YAML equally permits, instead of closing only the reported one-directive spelling"
    - "One input, one reason: a percent line inside the block keeps the existing KEY_LINE reason and is deliberately NOT given a second refusal path"
    - "The refusal narrowed to column 0, which is the only place YAML gives `%` directive meaning — the false-red control is built into the pattern rather than bolted on"
    - "A negative control that produces the one input a scoping gate is scoped AGAINST, since a scoped rule with no exercised non-firing side is indistinguishable from a rule that never fires"
    - "The new helper DELEGATES to reshapeToolsBlock rather than re-implementing its walk — one authority for 'which lines are this declaration'"

key-files:
  created: []
  modified:
    - scripts/frontmatter.ts
    - scripts/frontmatter.js
    - scripts/frontmatter.test.ts
    - scripts/check-foundation-guards.test.ts
    - .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md

decisions:
  - "D-34 implemented POSITIONALLY and with NO LOOKAHEAD, which is stronger than the plan's behavior bullet described. The plan's first bullet said 'and whose next line is the opening delimiter'; requiring that would have closed the reported one-directive spelling and left the two-directive prologue (`%YAML 1.2` then `%TAG …` then `---`) still landing in the keyless success arm — the enumerate-the-bad shape D-30 already declined once in this module. The plan's own <action> said 'apply BEFORE the opening-delimiter test', which is the no-lookahead reading, and that is what shipped. A case pins the two-directive and no-block-at-all spellings."
  - "The refusal is anchored at COLUMN 0 with no allowance for leading whitespace. YAML gives `%` directive meaning nowhere else, so an indented `%` falls through to the delimiter test unchanged. That narrowness IS the false-red control and it is built into the pattern rather than added as an exception."
  - "The three-outcome contract was amended to say the partition MOVED rather than grew, and a case asserts there is still no fourth state. The genuinely-keyless arm is byte-unchanged."
  - "plantSkillWithoutToolsKey delegates to reshapeToolsBlock with an empty shape instead of re-implementing the find-and-splice, so there is one walk over 'which lines belong to this declaration' and the throw-on-absent is inherited rather than copied."
  - "The paired RED direction (an AGENT adapter with the same omission) is referenced by name in the new case's comment rather than duplicated, per the plan's explicit instruction."
  - "A NINTH finding surfaced by adversarial probe (a UTF-8 BOM reaching the same silent-success arm) was deliberately NOT fixed. It is pre-existing, has zero live exposure, and choosing between stripping the BOM and refusing it carries its own UNKNOWN - verify — a planning decision, not an executor's. Logged to deferred-items.md."

metrics:
  duration: ~30 min
  completed: 2026-08-01
  tasks: 2
  commits: 3

actuals:
  tokens: 7800
  tasks: 2
  commits: 3
---

# Phase 27 Plan 30: Directive Refusal (IN-02) and the Scoping-Gate Control (IN-01) Summary

The two remaining silent-arm findings in the read path are closed: a YAML directive prologue now lands
in the unreadable arm naming the directive instead of printing what a body-only file prints (D-34), and
the agent-adapter scoping gate is exercised in both directions and proven load-bearing by a captured
failure against a build with it removed.

## What Was Built

| Symbol | File | Kind |
|---|---|---|
| `YAML_DIRECTIVE` | `scripts/frontmatter.ts` | new constant — a column-0 `%` followed by one non-space character |
| the directive refusal reason | `scripts/frontmatter.ts` | new failure-arm string in `parseFrontmatter`, applied at exactly ONE point |
| the amended three-outcome contract | `scripts/frontmatter.ts` | header + `parseFrontmatter` doc — the partition MOVED, it did not grow |
| the D-34 header section | `scripts/frontmatter.ts` | carries the reviewer's `UNKNOWN - verify` in substance, plus the no-lookahead and column-0 rationales |
| `plantSkillWithoutToolsKey` | `scripts/check-foundation-guards.test.ts` | new helper — removes a mirrored skill's WHOLE allow-list declaration; delegates to `reshapeToolsBlock` |
| 5 D-34 cases | `scripts/frontmatter.test.ts` | reproduction, no-lookahead spellings, false-red control, one-input-one-reason, three-states identity |
| the IN-01 scoping control | `scripts/check-foundation-guards.test.ts` | new case — skill with no allow-list keeps the guard GREEN |

`scripts/check-foundation-guards.ts` and its compiled twin were **NOT modified** — `git diff --stat`
over both is empty, as the plan's acceptance criteria required.

---

## IN-02 — RED-before / GREEN-after, MODULE LEVEL, against the committed `scripts/frontmatter.js`

The probe drives the **committed compiled output**, never the `.ts`. The document is the reviewer's
verified reproduction string, verbatim from `27-REVIEW-GAPS-3.md § IN-02`.

### RED — pre-fix committed `scripts/frontmatter.js`

```
=== RED (pre-fix) against the COMMITTED scripts/frontmatter.js ===

-- REPRO: %TAG directive before the opening delimiter (IN-02) --
  parseFrontmatter.ok:  true
  keys:                 []
  hasSpawnGrant:        {"ok":true,"value":false}
  grantedAgentNames:    {"ok":true,"value":[]}

-- CONTROL A: body-only document (legitimately-keyless arm) --
  parseFrontmatter.ok:  true
  keys:                 []
  hasSpawnGrant:        {"ok":true,"value":false}
  grantedAgentNames:    {"ok":true,"value":[]}
```

The repro and the body-only control print **byte-identical results**. That is IN-02: a document whose
`tools` value is plainly `Read, Agent(o)` is indistinguishable from a file with no frontmatter at all.

### GREEN — final committed `scripts/frontmatter.js`

```
=== GREEN (post-fix) against the COMMITTED scripts/frontmatter.js ===

-- REPRO: %TAG directive before the opening delimiter (IN-02) --
  parseFrontmatter.ok:  false
  reason:               the document opens with the YAML directive line `%TAG !e! tag:x,2000:` before
                        any `---` delimiter — a directive declares a YAML processing context this
                        module does not implement, so the value this document expresses is not
                        something this module may report on; it is refused as unreadable rather than
                        read as "no frontmatter, no keys"
  hasSpawnGrant:        {"ok":false,"reason":"the document opens with the YAML directive line
                        `%TAG !e! tag:x,2000:` ... read as \"no frontmatter, no keys\""}
  grantedAgentNames:    {"ok":false,"reason":"... same reason ..."}

-- CONTROL A: body-only document (legitimately-keyless arm) --
  parseFrontmatter.ok:  true
  keys:                 []
  hasSpawnGrant:        {"ok":true,"value":false}     <- UNCHANGED. The keyless arm is intact.

-- CONTROL B: %YAML directive prologue --
  parseFrontmatter.ok:  false                          <- the other legal spelling also refuses

-- CONTROL C: percent line INSIDE the block --
  reason:               cannot read `%TAG !e! tag:x,2000:` as a frontmatter key line or as a
                        continuation of the previous key      <- the EXISTING reason, not the new one

-- CONTROL D: percent line in the BODY after a closed block --
  parseFrontmatter.ok:  true
  keys:                 ["name","tools"]               <- unaffected, as specified
```

All five plan behaviors are captured: the refusal fires and names the line, the keyless arm survives,
a body-position directive is untouched, and an in-block directive keeps its **existing** reason
(one input, one reason).

---

## IN-02 — RED-before / GREEN-after, AGGREGATOR LEVEL, hermetic `CHECK_ROOT` mirror

A green module is not sufficient in this phase; it has shipped defects past a green suite three times.
Plant target `.claude/skills/grugops-map/SKILL.md` — the skill surface with no freshness gate and no
role corpus to cross-check, the same surface rounds 1-3 used. The plant is a `%TAG` prologue in front
of a skill whose allow-list carries a real `Agent(grugops-orchestrator)` grant.

```
=== BEFORE the plant: hermetic mirror, untouched ===
exit=0
== Result ==
ALL CHECKS PASSED

=== RED: PRE-FIX guard (frontmatter.js from wave-1 HEAD 5d040d4), SAME plant ===
exit=0
  PASS  WR-05: exactly one coordinator holds the spawn grant; no non-coordinator does
        (23 non-coordinator adapter bodies + 2 packaging template(s) checked), ...
ALL CHECKS PASSED

=== GREEN: FINAL committed guard, SAME plant ===
exit=1
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-map/SKILL.md: frontmatter parse failure — the document opens with the YAML
directive line `%TAG !e! tag:x,2000:` before any `---` delimiter — a directive declares a YAML
processing context this module does not implement, so the value this document expresses is not
something this module may report on; it is refused as unreadable rather than read as "no frontmatter,
no keys". An unreadable adapter cannot be reported on, so it is NEVER read as "carries no grant"
1 CHECK(S) FAILED

=== restore ===
scripts/frontmatter.js: OK          (SHA-256 verified)
mirror skill SHA-256: 2 identical   (restored byte-for-byte against the live file)
=== live checkout ===
(clean)
```

**This is stated precisely and NOT overstated.** The whole gate printed `ALL CHECKS PASSED` over a file
whose bytes spell a spawn grant — that is a real **guard-level** bypass, reproduced end-to-end.
Whether it is **exploitable** still depends on the reviewer's `UNKNOWN - verify`: if Claude Code's own
reader also requires `---` on line 1, such a file is inert on the platform and the grant never takes
effect. D-34 is therefore taken because the module's own contract puts an undecodable prologue in the
unreadable arm — **honest-pending, not a confirmed live escalation** — and the shipped header says so
in those terms.

---

## IN-02 — the new cases are load-bearing, not restatements

`scripts/frontmatter.js` temporarily replaced with `git show HEAD:scripts/frontmatter.js` (pre-fix),
then rebuilt and restored under SHA-256 verification:

```
=== RED: the new D-34 cases run against the PRE-FIX committed frontmatter.js ===
  × D-34 — a %TAG directive before the opening delimiter is REFUSED by name, not read as
    no-frontmatter (IN-02, reproduced)
  × D-34 — the refusal is POSITIONAL and takes no lookahead: %YAML, a two-directive prologue and a
    directive with no block all refuse
  × D-34 empty edge — the three input states stay exactly THREE, with the directive-prefixed document
    moved from the second into the third
      Tests  3 failed | 35 passed (38)
=== restore ===
scripts/frontmatter.js: OK
```

Exactly the three cases that assert the new refusal fail against the pre-fix build. The other two — the
false-red control and the one-input-one-reason case — pass in **both** builds, which is correct: they
assert behavior that must NOT change.

---

## IN-01 — the gate-removed failure transcript (the load-bearing proof)

A scratch mutation replaced the scoping flag in the compiled guard with `const isAgentAdapter = true`,
so the absence and emptiness arms apply to every scanned file. The live `.ts` source was never touched.

```
=== the new IN-01 skill control, run against a guard build with the scoping flag REMOVED ===
  × guard_wr05 SKILL with its allow-list declaration REMOVED → still GREEN: the agent-adapter
    scoping gate, exercised (IN-01)
AssertionError: expected 1 to be +0 // Object.is equality
      Tests  1 failed | 99 skipped (100)
```

The finding text the removed gate lets through, captured directly against a hermetic archive mirror
with the same plant:

```
=== SCRATCH guard build (isAgentAdapter = true, scoping gate REMOVED) ===
exit=1
  FAIL  WR-05 coordinator-spawn-grant violation:
.claude/skills/grugops-map/SKILL.md: agent adapter declares no `tools` key — omitting it makes the
platform grant every main-conversation tool INCLUDING the spawn tool, so an absent key is a grant by
inheritance and this guard cannot report on it
agent-factory/packaging/slash-command.template.md: agent adapter declares no `tools` key — ...
agent-factory/packaging/subagent.frontmatter.md: agent adapter declares no `tools` key — ...
1 CHECK(S) FAILED

=== restore ===
scripts/check-foundation-guards.js: OK      (SHA-256 verified)
scratch marker: 0 occurrences (clean)
=== live source untouched by task 2 ===
(git diff --stat over check-foundation-guards.ts and .js is EMPTY)
```

The gate is proven load-bearing: with it removed, the control reds and names the planted skill — plus
the two packaging templates, which is independent confirmation the gate really is scoped to agent
adapters and not merely inert. With it present, the tree stays green and **neither** gated arm fires.

---

## Verification

| Check | Result |
|---|---|
| `npm run build && node scripts/freshness.js` | exit 0 — **32 committed `.js` all fresh** |
| `npx vitest run --exclude '**/scripts/e2e/**'` | **1003 passed / 2 skipped** across 35 files, 0 failures (baseline 997/2) |
| `node scripts/check-foundation-guards.js` (live tree) | exit 0, `ALL CHECKS PASSED` |
| `node scripts/adapters-freshness.js` | 17 adapters compared, 0 byte differences, listings set-equal |
| Live kit inventory | **17 adapters / 7 skills** |
| `git diff package.json` / `package-lock.json` | **empty** — no dependency added |
| `grep -c 'YAML_DIRECTIVE'` `.ts` / `.js` | 2 / 2 (criterion: ≥2 each) |
| `grep -c 'UNKNOWN - verify' scripts/frontmatter.ts` | 3 (criterion: ≥1) |
| `grep -c 'plantSkillWithoutToolsKey' ...test.ts` | 3 (criterion: ≥2), and it throws via the inherited `reshapeToolsBlock` guard |
| `scripts/frontmatter.test.ts` case count | 33 → **38** |
| `scripts/check-foundation-guards.test.ts` case count | 99 → **100** |
| Whole-repo false-red scan | **0 parse failures** across 1107 tracked `.md` files; 0 files carry a column-0 `%` line anywhere |

### Wave-1 (plan 27-29) non-regression — explicitly checked, not assumed

| Wave-1 invariant | Result |
|---|---|
| `DQ_ESCAPE_ALLOWLIST` / `resolveDoubleQuoted` / `scanEmbeddedDoubleQuoted` / `unquoteChecked` | **no line added or removed** in the `5d040d4..HEAD` diff |
| The single-quoted branch (the primary false-red control) | **byte-unchanged** — `replace(/''/g, "'")` intact |
| The escape-alphabet property's member count | still `expect(DQ_ESCAPE_ALLOWLIST.size).toBe(3)` — **not edited**, and it passes |
| `grep -c 'NUMERIC_ESCAPE' scripts/frontmatter.ts` | **0** — D-30's rejected enumerate-the-bad patch stayed rejected |

The allowlist count was not altered, so the "say so loudly" clause does not apply.

---

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] The directive test takes NO LOOKAHEAD, which is stronger than one plan bullet described

- **Found during:** Task 1, reading the plan's `<behavior>` and `<action>` against each other.
- **Issue:** the first `<behavior>` bullet said "and whose next line is the opening delimiter". A test
  conditioned on that would refuse `%TAG` + `---` and **miss** the two-directive prologue YAML equally
  permits (`%YAML 1.2`, then `%TAG …`, then `---`), which would land in the keyless success arm exactly
  as before. That is the enumerate-the-bad shape D-30 declined once already in this module, and it is
  how round 5 starts.
- **Fix:** the refusal is positional — a directive at the document start is refused on sight and what
  follows it is never consulted. This matches the plan's `<action>` ("apply … BEFORE the
  opening-delimiter test") and its truth #5 (a directive elsewhere is not special-cased). A case pins
  the two-directive prologue and the directive-with-no-block spellings.
- **Files modified:** `scripts/frontmatter.ts`, `scripts/frontmatter.js`, `scripts/frontmatter.test.ts`
- **Commit:** `179babc`

### 2. [Rule 1 — bug in my own first draft] An over-broad assertion in the IN-01 control

- **Found during:** Task 2, first run of the new case.
- **Issue:** the control asserted `expect(o).not.toContain(".claude/skills/grugops-map/SKILL.md")`.
  The tree was correctly GREEN, but the skill's filename legitimately appears in **other** guards'
  `PASS` lines (`guard_adapter_size`), so the assertion failed on a correct result — a false red in a
  case whose entire job is proving the absence of a false red.
- **Fix:** replaced with `expect(o).toContain("PASS  WR-05:")`, which is strictly stronger: it proves
  guard_wr05 **reached a verdict** over this tree rather than being skipped. Without it, "no finding"
  and "no check" print the same thing — the exact confusion this phase is about. The two
  finding-text negative assertions were kept.
- **Files modified:** `scripts/check-foundation-guards.test.ts`
- **Commit:** `559baed`

### 3. [Scope — logged, deliberately NOT fixed] A NINTH finding: a UTF-8 BOM reaches the same silent-success arm

- **Found during:** post-Task-2 adversarial probe of the new refusal (green suite treated as necessary,
  not sufficient).
- **Issue:** a BOM before the opening delimiter sits at position 0, so neither the directive test nor
  the delimiter test matches and the document takes the "no block at all" arm. Measured against the
  committed `.js`, **both directions**:
  - `"\uFEFF%TAG !e! t\n---\nname: x\ntools: Read, Agent(o)\n---\n"` → `{"ok":true,"value":false}`
  - `"\uFEFF---\nname: x\ntools: Read, Agent(o)\n---\n"` → `{"ok":true,"value":false}`

  The second needs **no directive at all**, so this is not a gap in D-34 — it sits one step in front
  of it.
- **Confirmed PRE-EXISTING:** byte-identical behavior against `5d040d4:scripts/frontmatter.js`
  (wave-1 HEAD, before this plan's first commit). Plan 27-30 neither introduced nor widened it.
- **Live exposure: zero.** No tracked `.md` file begins with a BOM.
- **Why not fixed:** a BOM arm is a **decision**, not a defect fix, and it carries its own
  `UNKNOWN - verify` of exactly the D-34 kind — whether the platform strips a BOM before looking for
  `---` decides whether such a file is inert or rogue. Two answers are defensible (normalize the BOM
  away at the same point CRLF is already normalized, or refuse it by name). Choosing is planning work
  with a reversibility note, not an executor's call mid-wave, and round 4 is scoped to the eight
  round-3 findings.
- **Action taken:** logged to `deferred-items.md` with the measured transcript, the pre-existence
  proof, the zero-exposure finding and a suggested structural direction for round 5.
- **Commit:** `13eb0ab`

---

## Requirements

`KIT-03` and `SPAWN-04` were **deliberately NOT marked complete** in `REQUIREMENTS.md`. Round-4
verification has not run, and wave 1's executor had to revert exactly this. They remain open.

---

## Authentication Gates

None.

---

## Known Stubs

None. No stub, placeholder, TODO or hardcoded empty value was introduced. Every `<verify>` in the plan
was run, and every behavioral claim above carries a captured transcript against the **committed
compiled output** rather than a source read.

One open item is recorded rather than stubbed: the pre-existing BOM arm (deviation 3), which is logged
in `deferred-items.md` and is not a stub introduced by this plan.

---

## Flagged assumptions carried forward (not silently dropped)

- **SPAWN-04 / unclassified**, **SPAWN-02 / unclassified**, **SPAWN-05 / unclassified** — the plan
  recorded these probe rows as `unclassified — review manually` and left them **unresolved** per the
  fallback rules rather than auto-backstopping them. The one concrete instance a human identified in
  this category (the unexercised scoping gate) is closed by Task 2; **the categories themselves remain
  open** and are restated here so round-4 verification sees them.
- The `verification: backstop` truth in this plan's frontmatter (Claude Code's own reader also
  requiring `---` on line 1) remains a **premise, not a measurement**. It was not confirmed against
  the platform, and the shipped header says so.

---

## Threat Flags

None. The change narrows an existing trust boundary (`adapter/skill file content → guard verdict`) and
opens no new surface. `T-27-IN02-01` (Elevation of Privilege) is mitigated as the register specified,
with the platform-inertness premise carried as `UNKNOWN - verify` rather than asserted.
`T-27-IN01-01` (Repudiation) is mitigated by the negative control plus the captured gate-removed
failure. `T-27-IN02-02` (Denial of Service) is accepted as planned — the directive pattern is a single
anchored test on one already-read line, no backtracking, no additional file reads. `T-27-SC`
(Tampering) is trivially satisfied: zero package-manager installs, `package.json` byte-unchanged.

---

## Commits

| Commit | Task | Message |
|---|---|---|
| `179babc` | 1 | `fix(27-30): refuse a leading YAML directive line by name (IN-02, D-34)` |
| `559baed` | 2 | `test(27-30): make the agent-adapter scoping gate load-bearing (IN-01)` |
| `13eb0ab` | — | `docs(27-30): log the pre-existing BOM silent-success arm as a deferred round-5 item` |

---

## Self-Check: PASSED

Every file this summary claims to have modified exists on disk, and every commit hash resolves.

```
FOUND: scripts/frontmatter.ts
FOUND: scripts/frontmatter.js
FOUND: scripts/frontmatter.test.ts
FOUND: scripts/check-foundation-guards.test.ts
FOUND: .planning/phases/27-spawn-correctness-kit-set-authority/deferred-items.md
FOUND: 179babc
FOUND: 559baed
FOUND: 13eb0ab
```
