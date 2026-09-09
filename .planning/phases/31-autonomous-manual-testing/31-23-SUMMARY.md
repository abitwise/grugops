---
phase: 31-autonomous-manual-testing
plan: 23
subsystem: shared-verified-context
tags: [security, governance-root, elevation-of-privilege, derived-axes, residual-register, gap-closure-round-5]
status: complete
requires:
  - "31-19 (WR-21 / D-23): the home-directory halt whose ASK-BEFORE-INSPECT ordering is CR-13"
  - "31-22 (CR-16 / D-25): originIsTrusted consuming projectRootFromWorkingDirectory, which this plan rewrites"
  - "31-15 (WR-15 / D-21): the resolution order the monotonicity sweep is measured against"
provides:
  - "isAboveHome / isHomeItself — the split predicate; isAtOrAboveHome DELETED"
  - "GOVERNANCE_CONFIG_CANDIDATE_KINDS — the published classification of the two candidate positions"
  - "MODULE_OWN_CONFIG_POSITIONS — the running module's own two candidates, frozen at load"
  - "homeConfigPositionIsProjectOwned — two comparisons, no filesystem read"
  - "TRUSTED_ROOT_STOP_CONDITIONS S-HOME-ABOVE / S-HOME-SELF (6 -> 7)"
  - "TRUSTED_ROOT_RESIDUALS R-31-19-05 / R-31-19-06 / R-31-19-07 (8 -> 11)"
  - "PART SIX-I — the derived resolution-surface caller axis, namespace bindings resolved"
affects:
  - scripts/context-io.ts
  - scripts/context-io.js
  - hooks/hook-entry.ts
  - agent-factory/workflows/16-context-read-write.md
tech-stack:
  added: []
  patterns:
    - "a bound on a SEARCH bounds the search, never the OBSERVATION"
    - "every input to a safety rule beyond the ordinary evidence is a path, a position or a load-time constant"
    - "a conjunct a caller can flip in one operation is a switch, whichever direction it flips"
    - "price the residual in OPERATIONS and drive the construction; an unmeasured price is an adjective"
key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/context-io-writer-set.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/16-context-read-write.md
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md
key-decisions:
  - "D-26: a bound on a search bounds the search, never the observation. The home directory is inspected exactly once and answers ONLY as a repository — a version-control marker AND a repository-state-plane configuration candidate AND that candidate not being one of the running module's own fallback positions. Every input beyond the walk's ordinary evidence is a path, a position or a load-time constant."
requirements-completed: [UATX-01]
duration: ~1h35m
completed: 2026-09-10
commits: 5
plan_head_before: b3719d7e41a46c170193c1c374f6bb170f83c3f0
actuals:
  tokens: 32972
  tasks: 3
  commits: 5
coverage:
  - deliverable: "CR-13 closed — a repository rooted at the home directory reads its own dial"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#GREEN 1 (CR-13 / row 8): a repository ROOTED AT HOME reads its OWN dial"
        status: pass
      - kind: command
        ref: "node <probe> with HOME at a planted repository root, both project-directory variables removed"
        status: pass
    human_judgment: false
  - deliverable: "A kit's own configuration at a home candidate position never outranks a project nested below home"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#RED 2 (the VENDORED KIT at a home candidate position): the NESTED project's dial governs"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#RED 2b (the MODULE'S OWN position at home): the running kit is not a project"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#MUTATION 3 / MUTATION 4 — each conjunct removed separately breaks its OWN case only"
        status: pass
    human_judgment: false
  - deliverable: "No artifact a caller creates in one operation, and no value of GRUGOPS_HOME, moves the home verdict in either direction"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#INVARIANCE 1 / INVARIANCE 2 / INVARIANCE 3 / INVARIANCE 4"
        status: pass
      - kind: command
        ref: "PROBE 2(e) — 48-cell cross-product, exactly two distinct verdicts partitioned by candidate POSITION"
        status: pass
    human_judgment: false
  - deliverable: "WR-21's closure and R-31-19-01 re-measured intact; the monotonicity sweep shows no case moving from refused to admitted"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#GREEN 2 (WR-21 NOT reopened) / CONTROL 1 / MONOTONICITY (18 cases driven, moved = [])"
        status: pass
    human_judgment: false
  - deliverable: "The published stop set and the workflow prose both describe the walk the code has (6 -> 7)"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#the workflow's stop list and the exported stop set agree, in BOTH directions"
        status: pass
      - kind: test
        ref: "scripts/context-io.test.ts#WATCHED FAIL: a stop seeded on either side breaks the equality"
        status: pass
    human_judgment: false
  - deliverable: "Three named residuals (R-31-19-05/06/07), each OCCUPIED by a driven case, register 8 -> 11"
    verification:
      - kind: test
        ref: "scripts/context-io.test.ts#R-31-19-05 OCCUPIED / R-31-19-06 OCCUPIED BY CONSTRUCTION (a) and (b) / R-31-19-07 OCCUPIED on BOTH axes"
        status: pass
    human_judgment: false
  - deliverable: "PART SIX-I — the resolution-surface caller axis derived across files with namespace bindings resolved"
    verification:
      - kind: test
        ref: "scripts/context-io-writer-set.test.ts#31-23 — PART SIX-I: the changed resolution surface has a DERIVED caller axis"
        status: pass
    human_judgment: false
  - deliverable: "D-26 appended to 31-CONTEXT.md, amending D-23 without editing it"
    verification:
      - kind: command
        ref: "grep -c '^#### Gap-closure decision — D-' → 9 before, 10 after; git diff shows additions only"
        status: pass
    human_judgment: false
  - deliverable: "Six self-red-team probes run against this plan's own walk change"
    verification:
      - kind: command
        ref: "PROBE 1 (6 consumers, 0 moved), PROBE 2 (six axes), PROBE 3 (six HOME spellings), PROBE 4 (three non-walk positions), PROBE 5 (5 cases, 1 moved), PROBE 6 (both §4.3 readings)"
        status: pass
    human_judgment: true
    rationale: "The probe verdicts are recorded transcripts rather than standing assertions; PROBE 2(f) and PROBE 3 each produced a finding whose DISPOSITION (occupy R-31-19-07; correct the claim rather than the behaviour) is a judgment a verifier should re-read rather than take on the transcript alone."
---

# Phase 31 Plan 23: The Bound Bounds Ascent, Not Inspection Summary

Closed CR-13 by splitting `isAtOrAboveHome` into an ascent bound and a home predicate asked AFTER
inspection, and by making the home directory answer only as a repository on three conjuncts — a
version-control marker, a `repository-state-plane` configuration position, and that position not
being one of the running module's own — where the two added conjuncts read no filesystem state and
no environment value at all.

## What shipped

| Artifact | Kind | Where |
|---|---|---|
| `isAboveHome` / `isHomeItself` | NEW split pair; `isAtOrAboveHome` DELETED (0 live occurrences) | `scripts/context-io.ts` |
| the split `HomeBoundary` | CHANGED: two path sets and two identity sets, degenerate-inode premise re-checked for the split shape and applied to BOTH | `scripts/context-io.ts` |
| `GOVERNANCE_CONFIG_CANDIDATE_KINDS` | NEW exported frozen `["repository-state-plane", "in-kit"]`, bound to `governanceConfigCandidates` on FOUR axes | `scripts/context-io.ts` |
| `MODULE_OWN_CONFIG_POSITIONS` | NEW exported frozen constant, `governanceConfigCandidates(GOVERNANCE_FALLBACK_BASE).map(resolve)`, computed once at load | `scripts/context-io.ts` |
| `homeConfigPositionIsProjectOwned` | NEW module-private predicate: two comparisons, no `existsSync`, no `statSync`, no `process.env` | `scripts/context-io.ts` |
| the inspect-then-decide walk | CHANGED `projectRootFromWorkingDirectory`; home never becomes `nearest` | `scripts/context-io.ts` |
| `S-HOME-ABOVE` / `S-HOME-SELF` | CHANGED stop set, 6 → 7; `S-HOME` gone | `scripts/context-io.ts` |
| `R-31-19-05` / `R-31-19-06` / `R-31-19-07` | NEW residual members, register 8 → 11, each OCCUPIED by a driven case | `scripts/context-io.ts` |
| PART SIX-I | NEW derived resolution-surface caller axis, namespace bindings resolved | `scripts/context-io-writer-set.test.ts` |
| the moved stop list | CHANGED quoted prose, 7 bullets, set-equal in both directions | `agent-factory/workflows/16-context-read-write.md` |
| the moved decider hashes | CHANGED via `npm run generate:hook-manifest` | `hooks/hook-entry.ts` |
| **D-26** | NEW dated gap-closure decision (9 → 10), additions only | `31-CONTEXT.md` |

## MOVEMENT 0 — what the shipped installer actually places at each root, MEASURED

Three measurements, with line citations, because the previous draft of this plan assumed two of them
the other way and each one decides the shape of the rule.

| # | Measurement | Citation | Result |
|---|---|---|---|
| 1 | What `copyKit` writes under `$GRUGOPS_HOME` | `install/install.ts:1537-1566` | `agent-factory/` (`KIT_ROOT = resolve(GRUGOPS_HOME, "agent-factory")`, `:147`) and **nothing else at that root** |
| 1 | Where `resolveGrugopsHome` resolves to, and how it treats an empty string | `install/install.ts:137-146` | `resolve(process.env.GRUGOPS_HOME)` when set **and non-blank after trim**, else `resolve(homedir(), ".grugops")` — the sh `:-` colon form |
| 1 | Where the seeded per-repo config is written | `install/install.ts:2146-2152` + `agent-factory/seed/.grugops/factory.config.json` | `join(TARGET, ".grugops", "factory.config.json")` |
| 1 | Where `writeMarker` writes the marker | `install/install.ts:2244` | `join(TARGET, ".grugops", "install.json")` |
| 2 | Does the shipped kit carry a `scripts/` directory? | `ls agent-factory/` | **No.** `checklists config contracts packaging roles seed workflows VERSION README.md _commit-convention.md writing-profile.md`. So an installed shared kit at `$GRUGOPS_HOME/agent-factory` does not contain this module, and `GOVERNANCE_FALLBACK_BASE` is always a CHECKOUT root. |
| 3 | How many `InstallMarker` fields are REQUIRED, and does any name the TARGET? | `install/install.ts:597-616` | **None required, none names the TARGET.** All four (`kitVersion`, `grugopsHome`, `kitRoot`, `installMode`) are `?:`, and `readMarker` accepts any non-null non-array object — so `{}` is a schema-valid marker. |

**The one case in which the two roots collide is `TARGET === $HOME`** — and that is the case that
must be ADOPTED, not refused.

**The earlier draft's claim, checked and CORRECTED.** It asserted that
`~/.grugops/factory.config.json` is "exactly the shipped shared-install kit shape". The installer
does not say that. `copyKit` writes only `$GRUGOPS_HOME/agent-factory`; the `factory.config.json`
under `.grugops` is a TARGET's seeded STATE PLANE. The two are the same directory only when the user
installed into home. The claim is corrected here rather than carried.

Measurement 2 disqualifies every kit-home derivation the previous draft proposed (a
`dirname(GOVERNANCE_FALLBACK_BASE)`-when-its-basename-is-`agent-factory` arm is a derivation over a
shape the installer never creates). Measurement 3 disqualifies reading the installer's marker at all.

## MOVEMENT 1 and 5 — the probe table: six spellings × three programs

Every cell driven in a CHILD PROCESS with `HOME` overridden to the planted tree and BOTH
`CLAUDE_PROJECT_DIR` and `GRUGOPS_PROJECT_DIR` genuinely DELETED (not blanked). The consumer is
`appendNote` with a self-stamped high-severity `finding` (`verified_by: human:alice`); `ledger`
records whether `<home>/.grugops/audit/admissions.jsonl` appeared.

| row | pre-fix (committed `.js` at `b3719d7`) | scratch marker-plus-configuration | post-fix |
|---|---|---|---|
| **ROW 8** — home-rooted repository (`.git` + `.grugops/factory.config.json` high-severity), cwd inside | root `<kit>` · dial `ok/off` · **WROTE** · ledger false | root `<home>` · `ok/high-severity` · REFUSED · ledger true | root **`<home>`** · `ok/high-severity` · **REFUSED** · ledger false |
| **VENDORED-KIT-AT-HOME** — `$HOME/.git` + `$HOME/agent-factory/config/factory.config.json` (lean), cwd `$HOME/work/proj` (high-severity) | root `<proj>` · `ok/high-severity` · REFUSED · ledger false | root **`<home>`** · `ok/off` · **WROTE** · ledger true | root **`<proj>`** · `ok/high-severity` · **REFUSED** · ledger false |
| **MODULE'S-OWN-POSITION** — the module tree COPIED so its own `GOVERNANCE_FALLBACK_BASE` IS the planted home; `.git` + `.grugops/factory.config.json` (lean); cwd `<kit>/proj` (high-severity) | root `<proj>` · `ok/high-severity` · REFUSED · ledger false | root **`<home>`** · `ok/off` · **WROTE** · ledger true | root **`<proj>`** · `ok/high-severity` · **REFUSED** · ledger false |
| **DOTFILES+SHARED-INSTALL** — `$HOME/.git`, `$HOME/.grugops/agent-factory/`, `$HOME/.grugops/factory.config.json` (lean), cwd `$HOME/work/proj` carrying nothing | root `<kit>` · `ok/off` · WROTE · ledger false | root `<home>` · `ok/off` · WROTE · ledger true | root **`<home>`** · `ok/off` · WROTE · ledger true |
| **§4.3 ADJUSTED** — planted ancestor carrying ONLY a configuration, `HOME` set so it IS `os.homedir()` | root `<kit>` · `ok/off` · WROTE | root `<kit>` · `ok/off` · WROTE | root **`<kit>`** · `ok/off` · WROTE |
| **§4.3 ORIGINAL** — planted ancestor merely NAMED `home`, real `HOME` untouched | root = the enclosing checkout · `ok/off` | same | root = the enclosing checkout · `ok/off` |

**The pre-fix `ROW 8` cell matches `31-VERIFICATION.md` behavioral spot-check row 8 exactly** — the
kit returned, the dial `off`, and the self-stamped high-severity finding WROTE. The post-fix cell
resolves to the planted repository, reads `high-severity`, and REFUSES.

**One acceptance criterion is recorded as MEASURED-OTHERWISE rather than as met, and the reason is
stated.** The plan expected the VENDORED-KIT and MODULE'S-OWN rows to resolve to `$HOME` in BOTH the
pre-fix and the marker-plus-configuration columns. They resolve to the NESTED PROJECT pre-fix,
because the pre-fix walk never inspects home at all: it returns the remembered `nearest`, which is
the configured project. The harm those two conjuncts prevent is therefore a harm THIS PLAN'S OWN FIX
would have introduced, not one the pre-fix program has — which is exactly why the middle column is
the one that proves them load-bearing. The plan's sentence about the pre-fix cell was wrong; the
measurement is recorded rather than the expectation.

**§4.3's `UNKNOWN - verify`, resolved by name for `31-26`.** The ORIGINAL spelling was driven twice.
Inside this checkout it resolves to the enclosing repository — `S-BOUNDARY-WINS` fires before the
planted ancestor is ever the answer — so that reading **cannot reproduce WR-21 from inside a
repository at all**. Driven from an `mkdtemp` tree OUTSIDE every repository, it resolves to the
planted ancestor with dial `high-severity`, which is `R-31-19-01`'s documented below-home behaviour
and not a defect. Round 4 must therefore have measured the ADJUSTED spelling.

## GREEN 1b — the installer's marker is not consulted, shown rather than said

`homeRootedRepository` + `$HOME/.grugops/agent-factory` + the marker, driven THREE times:

| marker at `$HOME/.grugops/install.json` | verdict |
|---|---|
| present, holding `{"kitVersion":"2.0.0","grugopsHome":…}` | `<home>` \| refuse |
| absent | `<home>` \| refuse |
| present, holding `{}` (schema-valid per `install/install.ts:597-616`) | `<home>` \| refuse |

`new Set(verdicts).size === 1`. All three identical.

## GREEN 1c — the DECIDED verdict, stated as a choice

The dotfiles-plus-shared-install tree is **ADOPTED**. `$HOME` carries a version-control marker and a
state-plane configuration and neither is this module's own position — the identical evidence, and
the identical answer, the walk gives for that tree one level BELOW home (`R-31-19-01`, verification
row 9).

Its cost is `R-31-19-06`'s priced construction, recorded as numbers beside it: **three** operations
against a bare home (`mkdir $HOME/.git`; `mkdir $HOME/.grugops`; write
`$HOME/.grugops/factory.config.json`), **one** against a home that already carries a dotfiles
checkout. And it is MEASURED, not argued, that a default shared install creates NEITHER artifact at
`$HOME`: `copyKit` writes only `$GRUGOPS_HOME/agent-factory`, and `seedState`/`writeMarker` write
under `$TARGET/.grugops` only, which is `$HOME` exactly when the user installed INTO home.

## The invariance cases — the two named artifacts and the one variable, driven verbatim

| case | pre-artifact | post-artifact | moved? |
|---|---|---|---|
| **INVARIANCE 1** — `mkdir -p $HOME/.grugops/agent-factory` on GREEN 1's adopted tree | `<home>` \| refuse | `<home>` \| refuse | **no** |
| **INVARIANCE 2** — `touch $HOME/.grugops/install.json`, then the same file holding `{}` | `<home>` | `<home>`, `<home>` | **no** (`Set.size === 1`) |
| **INVARIANCE 3** — `GRUGOPS_HOME` unset / redirected / empty / `$HOME` | `<home>` | `<home>` ×3 | **no** (`Set.size === 1`) |

These are the two artifacts and the one variable the round-5 adversarial re-check named. The
retracted design turned INVARIANCE 1's single `mkdir` into CR-13's own harm (an adoption became a
refusal, and a refusal at home lands on `GOVERNANCE_FALLBACK_BASE`'s LEAN dial) and INVARIANCE 2's
single `touch` into an adoption.

**INVARIANCE 4 is DERIVED from the source, not driven.** The home branch's decision expression is
parsed, its local initializers substituted, and `homeConfigPositionIsProjectOwned`'s body inlined;
the module-level names appearing in that transitive closure are asserted by MEMBERS and by COUNT:

```
["GOVERNANCE_CONFIG_CANDIDATE_KINDS", "MODULE_OWN_CONFIG_POSITIONS",
 "REPO_BOUNDARY_MARKERS", "governanceConfigCandidates"]        length 4
```

plus a ban on `statSync`, `readFileSync`, `realpathSync`, `homedir`, `process.env`, `readdirSync`,
`lstatSync` and `openSync` inside that closure. The PREMISE case fires on a renamed decision
constant AND on a renamed predicate declaration (both return `null` rather than an empty closure),
and the seeded mirror adds `TRUSTED_ROOT_ENV_ORDER` and moves the count to exactly 5.

## The FIVE mutation proofs

| mutant | cases that broke | cases that did NOT |
|---|---|---|
| **1 — the MARKER requirement at home removed** (`const homeAnswersAsRepository = isBoundary &&` → `true &&`) | GREEN 2 (the config-only home is ADOPTED — WR-21 restored) and GREEN 4 | GREEN 1 (still `<home>`) |
| **2 — inspect-then-decide reverted** (`isAboveHome(dir, home)` → `… \|\| isHomeItself(dir, home)`) | GREEN 1 (root falls to the kit, verdict `write` — CR-13 exactly) | GREEN 2 (still the kit) |
| **3 — the KIND conjunct removed** (`GOVERNANCE_CONFIG_CANDIDATE_KINDS[…] !== "repository-state-plane"` → `false`) | RED 2 (the vendored kit's own configuration governs `<home>`) | **GREEN 1, GREEN 1b and GREEN 1c all stay green** |
| **4 — the `MODULE_OWN_CONFIG_POSITIONS` exclusion removed** (`return !MODULE_OWN…includes(resolve(candidatePath));` → `return true;`) | RED 2b (the running kit's own configuration governs its nested project) | **GREEN 1 and RED 2 both stay green** |
| **5 — the kind array TRANSPOSED** | the index-for-index binding (2 of 2 candidates mismatch their shape) | — |

**No mutant broke a case belonging to a different conjunct.** Mutants 3 and 4 broke RED 2 and
RED 2b respectively and never each other's — so the two are not one conjunct written twice — and
neither touched the three GREENs. A conjunct whose removal breaks nothing is a conjunct nobody
tested; each of these five broke exactly its own.

Each anchor's occurrence count is asserted EXACTLY ONCE in the committed `.js` before the mutation,
so a mutation that matched nothing cannot masquerade as a passing control.

## The published classification, bound on FOUR axes

| axis | assertion | number |
|---|---|---|
| frozen + cardinality | `Object.isFrozen` and `length === governanceConfigCandidates("").length` | 2 |
| index-for-index | `[0] === "repository-state-plane"`, `[1] === "in-kit"` | 2 |
| SHAPE predicate, ITERATED | each kind derived from `relative(base, candidate).split(sep)` — `in-kit` iff `agent-factory`/`config`/file; `repository-state-plane` iff `.grugops`/file with no `agent-factory` segment | **4 cells checked** (2 bases × 2 candidates) |
| the `$HOME/agent-factory` BASE cell, NAMED | its state-plane candidate `…/agent-factory/.grugops/factory.config.json` classifies as `repository-state-plane` — the measurement that makes the RELATIVE domain a decision rather than an assumption; an ABSOLUTE reading would refuse it | 1 |
| transposition mirror | a reversed kind array mismatches BOTH candidates | 2 of 2 |
| **in-place RENAME mirror** | renaming candidate 1 to `vendor-kit/config/factory.config.json` turns the SHAPE binding RED while index, cardinality and transposition stay GREEN | discriminates |

`MODULE_OWN_CONFIG_POSITIONS`, quoted verbatim beside its base so a reader can check it was derived
rather than typed:

```
GOVERNANCE_FALLBACK_BASE      = /Users/olgeroeselg/Projects/public/grugops
MODULE_OWN_CONFIG_POSITIONS[0]= /Users/olgeroeselg/Projects/public/grugops/.grugops/factory.config.json
MODULE_OWN_CONFIG_POSITIONS[1]= /Users/olgeroeselg/Projects/public/grugops/agent-factory/config/factory.config.json
```

## The stop set and the prose

`TRUSTED_ROOT_STOP_CONDITIONS` **6 → 7**. `S-HOME` is GONE (asserted absent, not merely
supplemented). The workflow's quoted list is **7 bullets**, re-derived rather than assumed, and
asserted set-equal in both directions with the seeded-fail control still discriminating on both
sides.

`S-HOME-SELF`, quoted verbatim, carrying all THREE conjuncts:

> The user's home directory itself is inspected exactly once and ends the upward search either way.
> It is adopted only when it carries a version-control marker and its configuration sits at the
> repository state-plane position rather than the in-kit position. That candidate must also not be
> one of the running kit's own fallback candidate positions.

**A constraint the plan did not anticipate, and how it was resolved.** `check-imperative-lexicon`'s
WP-03 bounds a descriptive sentence in a workflow at 25 words, and the quoted bullet is the exported
string verbatim. A single-sentence spelling of three conjuncts measured 56 words and failed the
gate. The SENTENCE COUNT moved, not the content: three sentences of 16, 19 and 15 words, all three
conjuncts intact. A published stop that stated two of the three would be the WR-21 drift class.

`grep -v '^\s*[/*]' scripts/context-io.ts | grep -c 'isAtOrAboveHome'` → **0**.

## The monotonicity sweep

18 cases driven (6 configuration shapes × 3 environment states) against a pre-31-23 mirror
reconstructed by reverting ONE anchored line, verdict by verdict. `moved` = `[]`, asserted as a SET
rather than as a count.

**The sweep's set, stated, and what is NOT in it.** This is the CONFIGURATION-RESOLUTION corpus
predating this round. It does NOT contain this plan's own new home-rooted cases, and it does NOT
contain the cross-plan ORIGIN-RECOGNITION cases `31-22` added at wave 2 — those are PROBE 5's
subject, governed by its declared intended-change list. A sweep that silently included `31-22`
CONTROL 5a would forbid the one movement this plan declares.

**Two pre-existing cases MOVED, both deliberately, each with the reason written into the case.**

1. `31-19` **PRECEDENCE (b)** — a directory carrying BOTH a marker and a configuration, driven with
   `HOME` at that directory. Under D-23 it answered the KIT; under D-26 it reads its own dial. That
   is GREEN 1's shape, and the movement is **ADMITTED → REFUSED**, the safe direction.
2. `31-22` **CONTROL 5a** — DECLINE → PROMOTE, the declared cross-plan movement (below).

**The 31-19 mirror anchors were MOVED, not relaxed.** `isAtOrAboveHome` is deleted, so "remove the
home stop" is now removing BOTH branches; the mirror carries two anchors and each occurrence count
is still asserted exactly once before the mutation and at zero after it.

## WR-21 re-measured intact

- **§4.3 ADJUSTED post-fix**: root `<kit>`, dial `ok/off`. **WR-21 is not reopened.** Stated
  explicitly because this is the closure this plan's own change is most likely to have cost.
- **GREEN 4**: a config-only home with cwd four levels below still answers the kit — home did not
  enter `nearest` on the way past, asserted by the RESOLVED ANSWER rather than by inspecting a
  variable.
- **CONTROL 1** (verification row 9): the identical tree one level BELOW the real home still
  resolves to the project and reads `high-severity`. Labelled as the documented residual
  `R-31-19-01`, not as a new finding.
- **CONTROL 2** (`31-15`'s own spot-check), **CONTROL 3** (a repository directly under home),
  **CONTROL 4** (a strict ancestor carrying BOTH marker and state-plane configuration, still never
  inspected), **EMPTY** and **ADJACENCY** all pass unchanged.

## Task 2 — the residual register, 8 → 11, every member OCCUPIED

Each `shape` sentence quoted verbatim:

**`R-31-19-05`** — "A repository whose root IS the user's home directory and which carries its own
governance configuration but NO version-control boundary marker is not adopted, and its dial is
replaced by the kit's shipped lean default."

> Occupied: `trustedRepoRoot()` answers `<kit>` with dial `ok/off`, and the self-stamped
> high-severity finding the home repository's own `high-severity` dial would have REFUSED is
> ADMITTED. Its CONSEQUENCE is asserted separately: an admission driven from that shape leaves no
> `.grugops/audit/admissions.jsonl` under the home directory, with the retention premise asserted
> first so the case can see the thing it forbids.

**`R-31-19-06`** — "The home directory's adoption rests on two ordinary filesystem artifacts, so a
process that can write under `$HOME` can MAKE home adoptable in THREE operations against a bare home
— `mkdir $HOME/.git`; `mkdir $HOME/.grugops`; write `$HOME/.grugops/factory.config.json` — or in ONE
against a home already carrying a dotfiles checkout. The converse is a ONE-operation gate LOWERING
that predates this plan: `mkdir $HOME/work/.git` ends the walk at an intermediate boundary carrying
no configuration, after which the answer degrades to `GOVERNANCE_FALLBACK_BASE`'s lean default."

> Occupied by CONSTRUCTION, not by description. (a) A bare planted home answers `<kit>`; the three
> named operations are PERFORMED, the count asserted as the number **3**, and the verdict moves to
> `<home>` \| refuse. (b) A governed home answers `<home>`; the one named operation is PERFORMED,
> the count asserted as **1**, and the answer degrades to `<kit>` with `human_admission: off`.

**`R-31-19-07`** — "The exclusion of the running module's own candidate positions compares LEXICALLY
RESOLVED path SPELLINGS, so the module's own position and the candidate the walk computes can name
one directory with two strings and the exclusion misses. …"

> Occupied on **BOTH** axes its shape sentence names — a residual measured on one of two claimed
> axes is a residual half tested. See PROBE 2(f) below for the driven cells and the price.

Register cardinality **8 → 11**; the round's written dispositions are set-equal to the register in
both directions; the watched-fail control moves the cardinality by exactly one and reports the
seeded member as unbound.

## Task 2 — PART SIX-I, the derived resolution-surface caller axis

`trustedRepoRoot`'s derived caller set (MEASURED, 7 members):

```
hooks/admission-guard.ts::<module>      scripts/context-io.ts::<module>
hooks/guard.ts::<module>                scripts/context-io.ts::admitAndAppend
scripts/admission-server.ts::handleProposeNote   scripts/context-io.ts::appendNote
                                        scripts/context-io.ts::promoteAdmitted
```

`projectRootFromWorkingDirectory` → 2 (`originStoreIsRootAnchored`, `trustedRepoRoot`).
`homeBoundary`, `isAboveHome`, `isHomeItself`, `homeConfigPositionIsProjectOwned` → 1 each.
`GOVERNANCE_CONFIG_CANDIDATE_KINDS` and `MODULE_OWN_CONFIG_POSITIONS` → **exactly 1 reader each**,
`homeConfigPositionIsProjectOwned`; a second reader would be a second authority for one question.

**Two derivation defects found and fixed while building this axis, both of the "coverage it does not
have" class.**

1. PART SIX-D's `deriveRouteCallers` walks a function declaration's BODY. This module's own
   consumers reach the trusted root through a **default parameter** (`repoRoot: string =
   trustedRepoRoot()`), which lives in the parameter list. PART SIX-I walks the whole declaration
   node, and asserts that property explicitly rather than leaving it an unchecked detail.
2. A static-named-import-only alias resolution reported **BOTH PreToolUse hooks as non-consumers of
   the trusted root**. Both bind the module dynamically (`let ioMod: typeof import(…)` then
   `ioMod = await import(…)`) and reach it by property access or by destructuring off that binding.
   PART SIX-I resolves namespace imports, the dynamically typed binding, property access off it, and
   destructuring from it.

**Two members a reader will expect and not find, recorded so their absence is a stated fact.**
`scripts/context-io.ts::admit` — its `repoRoot` default is `ROOT`, the KIT, not `trustedRepoRoot()`;
the production entry is the CLI verb, which resolves the root itself (the `::<module>` member).
`scripts/compactor.ts` — it never asks the trusted root; every root it uses arrives as an argument.

PREMISE, MEMBERS, COUNT and a seeded mirror that moves the count by exactly one, all present.

## Task 3 — the six standing probes

### PROBE 1 — HOW IS THIS GATE REACHED

Every consumer driven with a LEGITIMATE ordinary project (a repository well below home carrying its
own `high-severity` dial), against a pre-31-23 mirror and the rebuilt `.js`.

```
trustedRepoRoot      | pre: root=<project> n/a    | post: root=<project> n/a    | UNCHANGED
readGovernanceConfig | pre: root=<project> n/a    | post: root=<project> n/a    | UNCHANGED
appendNote           | pre: root=<project> refuse | post: root=<project> refuse | UNCHANGED
admitAndAppend       | pre: root=<project> write  | post: root=<project> write  | UNCHANGED
promoteAdmitted      | pre: root=<project> refuse | post: root=<project> refuse | UNCHANGED
handleProposeNote    | pre: root=<project> write  | post: root=<project> write  | UNCHANGED

consumers driven = 6; moved = 0
```

**VERDICT: PASS.** The derived consumer count agrees with PART SIX-I's recorded set (the two hook
`::<module>` members are the same two hooks reached here through `trustedRepoRoot`/
`readGovernanceConfig`).

### PROBE 2 — DERIVE BOTH AXES

| axis | driven input | measured answer | verdict |
|---|---|---|---|
| **(a)** inspection-vs-ascent at a STRICT ANCESTOR of home | an ancestor carrying `.git` AND `.grugops/factory.config.json` (`human_admission: all`), cwd AT it and at home | `<kit>` both times — a configuration there is still never read | PASS |
| **(b)** marker-vs-configuration precedence, home vs ordinary | one directory carrying both, driven as an ordinary directory and as `$HOME` | ordinary: the configuration wins over its own marker (published rule, unchanged). Home: BOTH are required, and the answer is the directory's own dial | PASS — the two rules differ and the difference is asserted |
| **(c)** the `nearest` accumulator | a config-only home, cwd four levels below | `<kit>` — home did not contribute to `nearest` | PASS |
| **(d)** identity-vs-spelling | `HOME` through a symlink, and cwd through it, both directions | recognised as home under both spellings | PASS |
| **(e)** the CALLER-AUTHORABLE cross-product | 2 candidate positions × (`.grugops/agent-factory` present/absent) × (`install.json` absent / empty / `{}`) × (`GRUGOPS_HOME` unset / elsewhere / empty / `$HOME`) | **48 cells printed.** `repository-state-plane`: **1** distinct verdict across all 24 (`HOME ADOPTED (dial off)`). `in-kit`: **1** distinct verdict across all 24 (`NESTED PROJECT (dial high-severity)`) | **PASS** — the verdict varies with candidate POSITION and with NOTHING ELSE |
| **(f)** the CONVERSE, and both spelling cells | below | below | see below |

**PROBE 2(f), part one — is the position test asked anywhere OTHER than at home?** No: PART SIX-I
derives exactly one reader for each of the two constants, and the walk asks
`homeConfigPositionIsProjectOwned` only inside the `isHomeItself` branch. **Can an ordinary ancestor
reach the same collision?** MEASURED: yes, and the answer is a DECISION, not a new residual. With a
vendored kit's in-kit configuration at an ordinary directory and NO boundary anywhere above it, the
walk answers that vendored kit with dial `off`:

```
converse: in-kit config at an ORDINARY dir, no boundary above
  -> {"root":".../loose/vendor/kit","dial":"off"}
```

That is D-23 (4)'s own decided behaviour — the boundary-wins rule answers wherever a boundary
exists, and where none does, the pre-31-19 nearest-wins answer stands — and it is already the named
`R-31-19-01`. The position question is scoped to home deliberately: asking it at every directory
would be a second authority for a question D-23 (4) already answers.

**PROBE 2(f), part two — the two spelling cells `R-31-19-07`'s shape sentence names.** A kit whose
own root IS the planted home, with a configured project nested inside it.

| cell | driven input | measured verdict | price |
|---|---|---|---|
| CONTROL — the real spelling on both sides | `HOME` = `<tree>/kit`, module at `<tree>/kit` | root = `<kit>/proj` — **exclusion HOLDS** | — |
| **CELL 2 — SYMLINK** (`ln -s <kit> <tree>/link`; module, `HOME` and cwd all through the link) | `base = <tree>/kit`, `own[0] = <tree>/kit/.grugops/…` | root = `<kit>/proj` — **exclusion HOLDS** | not reachable: Node's ESM resolver realpaths a symlinked module specifier and `process.cwd()` returns the kernel's realpath, so BOTH sides are already the real spelling before the equality is asked |
| CELL 2b — module real, `HOME` + cwd through the link | same | root = `<kit>/proj` — HOLDS | — |
| **CELL 1 — CASE** (module addressed as `<tree>/KIT`, `HOME` and cwd likewise) | `base = <tree>/KIT`, `own[0] = <tree>/KIT/.grugops/…`, `cwd = <tree>/kit/proj` | root = **`<tree>/kit`** — **exclusion MISSES; the RUNNING KIT'S OWN configuration is adopted over the project nested inside it** | **ONE operation**: address the decider through a case-differing path. `import.meta.dirname` preserves the caller's casing; `process.cwd()` returns the on-disk canonical casing |
| CELL 1b — module real, `HOME` + cwd case-differing | `base = <tree>/kit` | root = `<kit>/proj` — HOLDS | — |

**VERDICT: `R-31-19-07` OCCUPIED on the CASE axis, HOLDING on the SYMLINK axis.** Stated either way
as the expected one, and priced. The consequence of the miss is RED 2b's harm reached through a
spelling rather than through a position.

**Why PROBE 3's symlinked `HOME` does not cover CELL 2:** PROBE 3 exercises `homeBoundary`'s
identity set — whether a symlinked spelling of `$HOME` is recognised AS home. CELL 2 exercises the
`MODULE_OWN_CONFIG_POSITIONS` path equality, a different comparison between different operands.

**The disposition is the plan's own, taken deliberately.** Closing this with a `dev:ino` comparison
is refused: that is a `statSync` under `$HOME` a single symlink can make agree — a one-operation flip
in the gate-lowering direction. Case-folding the comparison is refused for the converse reason: it
would EXCLUDE MORE, and an added refusal at home lands on the lean fallback, so widening the
exclusion lowers a gate exactly as narrowing it can. Recorded with its criterion rather than closed
with a heuristic.

### PROBE 3 — WHAT IS THE PREDICATE'S INPUT ASSEMBLED FROM

Six `HOME` spellings, against a planted marker-less home carrying `human_admission: high-severity`,
cwd one level below it. Every cell answered in 33–38 ms against a 30 s ceiling — no unbounded walk.

| `HOME` | `os.homedir()` | resolved root | dial | disposition |
|---|---|---|---|---|
| unset | the real `/Users/olgeroeselg` | the enclosing checkout | `off` | **DECISION** — `S-BOUNDARY-WINS`; the probe tree lives inside a repository |
| a non-existent path | that path | `<kit>` | `off` | **DECISION** — `S-HOME-UNKNOWN` |
| **a FILE, not a directory** | that file | the planted home (ADOPTED) | `high-severity` | **DEFECT FOUND, FIXED IN THIS PLAN** — see below |
| with a trailing separator | normalised | `<kit>` | `off` | **DECISION** — the separator is normalised, the home spelling recognised, and `R-31-19-05` refuses the marker-less home |
| a SYMLINK to the real home | the link | `<kit>` | `off` | **DECISION** — recognised as home through the realpath spelling |
| the filesystem root `/` | `/` | the enclosing checkout | `off` | **DECISION** — `/` has no strict ancestors and carries neither marker nor state-plane configuration; the boundary rule answers first |

**The defect, and its disposition.** `namedHomeDirectory`'s comment said "a home directory that is
not an existing DIRECTORY has not been DETERMINED", and `directoryIdentity` is a `statSync`, which
succeeds on a regular file. A `$HOME` naming a file therefore built a boundary from that file's
ancestors instead of degrading. That is a claim outrunning its mechanism — the WR-21 class — and it
is fixed here rather than deferred. **The CLAIM is corrected, not the behaviour**, and the source
says why: rejecting a non-directory would return `null`, stop the search and land the caller on
`GOVERNANCE_FALLBACK_BASE`'s LEAN default, and a refusal is not the safe direction (D-26 (4),
`R-31-19-06`). The capability is `R-31-19-02`'s — `os.homedir()` reads an ambient value a process
already controls, and either project-directory variable names the root outright.

**VERDICT: PASS** — no unbounded walk, no unnamed exception, and no adoption BY THE HOME RULE of a
directory the plan did not decide to adopt.

### PROBE 4 — AT WHICH POSITIONS IS THE PREDICATE EVEN ASKED

Every position that reaches a governance configuration, enumerated by line, with the walk's rules
asked or not.

| position | line | walk asked? | measured | disposition |
|---|---|---|---|---|
| `trustedRepoRoot` step 3 | `context-io.ts:3936` | **yes** | marker-less home → `<kit>`, dial `off` | the rule |
| `TRUSTED_ROOT_ENV_ORDER[0]` = `CLAUDE_PROJECT_DIR` | `context-io.ts:3917` | **no** | `CLAUDE_PROJECT_DIR=$HOME` → root `<home>`, dial `high-severity` | existing `R-31-15-03` / `R-31-19-02` — the ambient environment names the root outright; predates this plan |
| `TRUSTED_ROOT_ENV_ORDER[1]` = `GRUGOPS_PROJECT_DIR` | same loop | **no** | same | same member |
| `readGovernanceConfig(repoRoot)` with an EXPLICIT root | `context-io.ts:4219` | **no** | explicit `$HOME` → root `<home>`, dial `high-severity` | the documented 31-09 / WR-10 TEST SEAM. Not on the agent surface: the CLI `admit` verb refuses a root on argv and the MCP tool schema carries none |
| `readGovernanceConfig()` with NO argument | same | n/a | resolves `ROOT` — the kit; never home | by construction |
| `admit()`'s `repoRoot` default | `context-io.ts:2692` | n/a | `ROOT`, the kit — NOT `trustedRepoRoot()` | by construction; the CLI verb passes the resolved root explicitly |
| `hooks/guard.ts:397`, `:468`; `hooks/admission-guard.ts:239`; `scripts/admission-server.ts:176` | — | **yes** | all four go through `trustedRepoRoot()` | the rule |

**VERDICT: PASS** — exactly three positions reach a governance configuration without the walk's
rules being asked, and each is an existing named residual or the documented test seam. None is new.

### PROBE 5 — WHAT DOES THIS CHANGE DO TO A PRE-EXISTING STATE

The CROSS-PLAN INTENDED-CHANGE LIST is an explicit named set in the test source, and its cardinality
and member are asserted BEFORE any diff is read. The WAVE-2 verdicts are **QUOTED from
`31-22-SUMMARY.md`** — fail-closed on an absent file or a missing row — with this plan's inline
expectation used as the CHECK on the quoted row, never as its source. The quoted rows:

```
| CONTROL 5a | `$HOME/.grugops/context` at a home carrying a marker + configuration, shared
  install beside it | `DECLINED (origin-outside-trusted-store)` | **PROMOTE** |
| CONTROL 5b | the same store at a home carrying NO version-control marker |
  `DECLINED (origin-outside-trusted-store)` | DECLINE (unmoved) |
```

Driven out-of-suite against a pre-31-23 mirror (the home question asked BEFORE inspection, which is
31-19's own order) and the rebuilt `.js`:

```
shaped-forgery       | pre=DECLINE  | post=DECLINE  | unmoved
cross-repository     | pre=PROMOTE  | post=PROMOTE  | unmoved
constructed-root     | pre=DECLINE  | post=DECLINE  | unmoved
control-5a           | pre=DECLINE  | post=PROMOTE  | MOVED
control-5b           | pre=DECLINE  | post=DECLINE  | unmoved

cases driven = 5; MOVED = ["control-5a"]
```

**CONTROL 5a MOVED, in the declared direction, with both cells quoted: pre-fix DECLINE, post-fix
PROMOTE.** A 5a that failed to move would be recorded as a FAIL, and the in-suite case now says so
in its own failure message. CONTROL 5b and the other three are UNMOVED in both directions.

*One construction difference recorded honestly:* the out-of-suite `constructed-root` replication
plants its tree under `.temp/` inside this checkout, so the enclosing repository's boundary answers
and the verdict is DECLINE, where the in-suite CONTROL 1b uses an `mkdtemp` tree outside every
repository and PROMOTEs. The verdict is UNMOVED pre→post in both spellings, which is what PROBE 5
measures, and the in-suite CONTROL 1b passes green.

Across the whole standing suite (**3826 tests, 62 files**), exactly two pre-existing cases moved:
`31-19` PRECEDENCE (b) (in the configuration-resolution corpus, ADMITTED → REFUSED, this plan's own
subject) and `31-22` CONTROL 5a (the declared cross-plan member). Every other case is unchanged.

**VERDICT: PASS.**

### PROBE 6 — §4.3's TWO READINGS

| reading | driven input | post-fix answer | verdict |
|---|---|---|---|
| **ADJUSTED** | planted ancestor carrying ONLY `.grugops/factory.config.json`; `HOME` overridden so it IS `os.homedir()` | root `<kit>`, dial `ok/off` | PASS — WR-21 is not reopened |
| **ORIGINAL (in-repo)** | planted ancestor merely NAMED `home`, real `HOME` untouched, tree under `.temp/` | the enclosing checkout, dial `ok/off` | PASS — `S-BOUNDARY-WINS`; this reading cannot reproduce WR-21 from inside a repository |
| **ORIGINAL (outside every repository)** | the same shape in an `mkdtemp` tree | the planted ancestor, dial `high-severity` | PASS — `R-31-19-01`'s documented below-home behaviour |

**`docs/audit/31-round4-residuals.md` §4.3's `UNKNOWN - verify` now has a measurement for both
readings**, and `31-26` can resolve it by name: round 4 measured the ADJUSTED spelling.

### Probes summary

**Six probes ran. One found a defect — PROBE 3's `namedHomeDirectory` claim — and it was FIXED in
this plan** (commit `a8ee352`). PROBE 2(f) produced a measured MISS on the CASE axis, which is
`R-31-19-07` OCCUPIED by design rather than a defect, and it is priced. No probe was recorded as
"expected to pass".

## Cleanup

Every planted tree lived under the single root `.temp/31-23-probe/` and was removed.

```
test ! -e .temp/31-23-probe                                  -> PROBE ROOT GONE
find . -path ./node_modules -prune -o -type p -print          -> (no output)
git status --short  -> only the four pre-existing entries this executor never touched
```

**`git status --short .temp` is NOT the check, and here is why:** `.temp/` is gitignored at
`.gitignore:19`, so that command prints nothing whatever the directory holds — it is inert as a
cleanup assertion. The existence test and the FIFO sweep are the checks.

## Verification

| command | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**'` | **62 files, 3826 tests, all passing** (2 skipped, pre-existing) |
| `npx vitest run … -t "31-23"` (context-io.test.ts) | 42 passing |
| `npx vitest run … -t "PART SIX-I"` | 4 passing |
| `npm run typecheck` | exit 0 |
| `npm run build && npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED` |
| `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED` |
| `node scripts/check-imperative-lexicon.js` | `ALL CHECKS PASSED` |
| `npm run check:residual-citations` | `ALL CHECKS PASSED` |
| `npm run check:audit-register` | `ALL CHECKS PASSED` |
| `npm run check:claim-anchors` | `ALL CHECKS PASSED` |
| `git hash-object hooks/guard.ts` | `669725bc1c616ab57123e22090d93d57eff1b001` — equals `FROZEN_GUARD_BLOB`; `hooks/guard.ts` untouched, never re-based |
| `package.json` | byte-unchanged (0 files in `git diff --name-only b3719d7..HEAD -- package.json`) |
| `grep -c '^#### Gap-closure decision — D-' 31-CONTEXT.md` | **9 → 10**; `git diff b3719d7..HEAD -- 31-CONTEXT.md` = 125 insertions, 0 deletions — D-23 byte-unchanged |

## Deviations from Plan

### 1. [Rule 3 — Blocking] The 25-word workflow-sentence bound forced a three-sentence `S-HOME-SELF`

- **Found during:** Task 1, MOVEMENT 4.
- **Issue:** `check-imperative-lexicon`'s WP-03 bounds a descriptive sentence in a governed workflow
  at 25 words. The exported `S-HOME-SELF` string is quoted verbatim into
  `16-context-read-write.md`, and a single-sentence spelling of three conjuncts measured 56 words —
  a red gate the plan did not anticipate. The prose paragraph this plan added at `:52` was 26 words
  and failed for the same reason.
- **Fix:** the SENTENCE COUNT moved, not the content. `S-HOME-SELF` is three sentences (16, 19 and
  15 words) carrying all three conjuncts; the paragraph is four short sentences. Narrowing the
  published stop to two conjuncts would have been the WR-21 drift class.
- **Files modified:** `scripts/context-io.ts`, `agent-factory/workflows/16-context-read-write.md`.
- **Commit:** `a38be64`.

### 2. [Rule 1 — Bug] The 31-19 mirror anchors named a predicate this plan deletes

- **Found during:** Task 1, MOVEMENT 5.
- **Issue:** `HOME_STOP_ANCHOR` is `"if (isAtOrAboveHome(dir, home))"`, and that predicate no longer
  exists, so the mirror's exactly-once premise failed — correctly.
- **Fix:** the anchors were MOVED deliberately, not relaxed. "Remove the home stop" is now removing
  BOTH branches, so the mirror carries two anchors (`isAboveHome` and `isHomeItself`) whose
  occurrence counts are each still asserted exactly once before the mutation and at zero after it.
- **Files modified:** `scripts/context-io.test.ts`. **Commit:** `a38be64`.

### 3. [Rule 1 — Bug] PART SIX-D's derivation could not see the positions this module actually uses

- **Found during:** Task 2, MOVEMENT 3.
- **Issue:** a body-only, static-named-import-only caller derivation reported BOTH PreToolUse hooks
  as non-consumers of the trusted root (they bind the module dynamically and reach it by property
  access or destructuring), and missed every default-parameter call site (`repoRoot: string =
  trustedRepoRoot()`), which is exactly how this module's own writers reach it. A derived axis that
  cannot see the position the code uses reports coverage it does not have.
- **Fix:** PART SIX-I has its own `deriveSurfaceReferences` walking whole declarations, resolving
  namespace imports, the dynamically typed binding, property access off it and destructuring from
  it. PART SIX-D is untouched, so its pinned expectations do not move.
- **Files modified:** `scripts/context-io-writer-set.test.ts`. **Commit:** `a15205a`.

### 4. [Rule 1 — Bug] `namedHomeDirectory`'s claim outran its mechanism (PROBE 3)

- **Found during:** Task 3, PROBE 3.
- **Issue:** the comment said "not an existing DIRECTORY"; `directoryIdentity` is a `statSync` that
  succeeds on a regular file, so `HOME` naming a file built a boundary from that file's ancestors.
- **Fix:** the CLAIM corrected, not the behaviour, with the reason written at the site — rejecting a
  non-directory returns `null`, which lands the caller on the kit's LEAN default, and a refusal is
  not the safe direction.
- **Files modified:** `scripts/context-io.ts`. **Commit:** `a8ee352`.

### 5. [Recorded, not a deviation] A plan sentence measured false

The plan asserted the VENDORED-KIT and MODULE'S-OWN rows would resolve to `$HOME` in the **pre-fix**
column. Measured, they resolve to the NESTED PROJECT, because the pre-fix walk never inspects home
at all. The harm those conjuncts prevent is one this plan's own fix would have introduced. The
measurement is recorded and the plan's sentence corrected; the middle column is what proves the
conjuncts load-bearing, exactly as the plan's own next sentence says.

### 6. [Process] Committed on `main`

`git.branching_strategy: "none"` and `workflow.use_worktrees: false`; the orchestrator directed
sequential execution on the main working tree, as for `31-21` and `31-22`. The executor's
default-branch commit assertion was overridden on that direction. The four pre-existing uncommitted
entries (`.planning/milestone.lock`, `human-notes.txt`, untracked `.gsd/`, `.planning/state.json`)
were never staged, reverted or stashed.

**Total deviations:** 4 auto-fixed (1 blocking, 3 bugs), 2 recorded.
**Impact:** none on scope. Deviations 3 and 4 each strengthened an axis the plan asked for.

## Known Stubs

None.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no new file-access pattern and no schema
change at a trust boundary; it narrows an existing governance-root resolution.

## Issues Encountered

None blocking. `R-31-19-07` is OCCUPIED on the CASE axis rather than closed — that is the plan's own
recorded decision with its criterion, not an open issue.

## Next

`31-24` and `31-25` own UATX-06's modifier ban and exit boundary. `31-26` can now resolve
`docs/audit/31-round4-residuals.md` §4.3's `UNKNOWN - verify` by name using PROBE 6's two readings.

## Self-Check: PASSED

- `scripts/context-io.ts`, `scripts/context-io.js`, `scripts/context-io.test.ts`,
  `scripts/context-io-writer-set.test.ts`, `hooks/hook-entry.ts`, `hooks/hook-entry.js`,
  `agent-factory/workflows/16-context-read-write.md`,
  `.planning/phases/31-autonomous-manual-testing/31-CONTEXT.md` — all FOUND on disk.
- Commits `d40fd68`, `a38be64`, `a15205a`, `6f793ac`, `a8ee352` — all FOUND in `git log`.
- `git rev-list --count b3719d7..HEAD` = **5**, measured from the on-disk plan ledger, not narrated.
