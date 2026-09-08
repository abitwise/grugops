---
phase: 31-autonomous-manual-testing
plan: 15
subsystem: infra
tags: [governance, admission, trusted-root, environment-resolution, tier-1-oracle, typescript]

requires:
  - phase: 31-autonomous-manual-testing
    provides: "31-09's single trusted root (`trustedRepoRoot`) and the unconditional `admit()` call in every writer"
  - phase: 31-autonomous-manual-testing
    provides: "31-14's `promoteAdmitted` proof-gated re-binding route, whose governance root moves with the other writers'"
provides:
  - "A documented four-step resolution order for the trusted governance root, stated in ONE function, with the previous behaviour as its LAST step"
  - "`GRUGOPS_PROJECT_DIR` as a documented installer-set project-directory environment contract"
  - "`TRUSTED_ROOT_ENV_ORDER` — the precedence as DATA rather than as reading order"
  - "`TRUSTED_ROOT_RESIDUALS` — a frozen register of what the order still cannot answer, each member with its reason and its closing criterion"
  - "A monotonicity proof against the pre-31-15 program itself, plus the empty-directory control, the adjacency control, the precedence case and two bound cases"
  - "A per-consumer × per-step agreement matrix: every file naming the one function is driven at every step of the order"
  - "A Tier-1 oracle that describes its own mechanism and writes only to a governance root it owns"
affects: [context-io, admission-guard, admission-server, workflow-16, foundation-guards]

actuals:
  tokens: 24187
  tasks: 3
  commits: 5
plan_head_before: 4a6ea2d5fe96889f8dd98900147a18e565a9052b

tech-stack:
  added: []
  patterns:
    - "Precedence as data: an ordered frozen array the resolver iterates and the tests index, never two `if` statements a reader must order by position"
    - "A bounded upward filesystem search whose stop condition is a repository marker, so a governance read can never reach a user's home directory"
    - "A frozen exported residual register asserted set-equal to the round's written dispositions, so a later gap arrives as a red test rather than as a silence"
    - "Monotonicity proven by mirroring the committed artifact with the change reverted through occurrence-asserted anchors, then comparing verdict by verdict"

key-files:
  created: []
  modified:
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.js
    - scripts/floor-invariance.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - agent-factory/workflows/16-context-read-write.md

key-decisions:
  - "The trusted root gains a four-step order — the Claude Code variable, the installer-set variable, a bounded working-directory search, then the kit — instead of a second parameter. No caller may still choose the root as an argument."
  - "`GRUGOPS_PROJECT_DIR` is named once as a constant in an ordered array; the precedence between the two variables is asserted by index, not by reading order."
  - "The upward search stops at the first ancestor carrying a repository marker and is bounded at 64 ancestors, so it can never resolve above a repository boundary."
  - "A host repository carrying no factory configuration resolves to the kit's lean default. Recorded as residual R-31-15-02 because it is the CORRECT answer and reads like a hole."
  - "`hooks/guard.ts`'s comment narrowing was REVERTED rather than re-baselined: re-freezing a byte-frozen deploy guard to correct a comment is the wrong trade."
  - "IN-09's guard-side `§14-gate` spelling fix is DEFERRED: it is a prose workaround for a guard false positive, it blocks nothing, and changing the guard's parse is a separate surface."

patterns-established:
  - "Ask which step of an order ANSWERED and which step answered when it fell through — the cascade case, not only the per-step case"
  - "Derive the consumer set from the sources that name the authority, and assert it set-equal to the set the block drives"

requirements-completed: []

coverage:
  - id: D1
    description: "The governance dial that decides an admission is read from the TARGET repository on all five host CLIs, not only where Claude Code sets its project-directory variable."
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 — WR-15: the target repository's dial is read on every host > ROW 6, GREEN: both variables unset and the cwd inside a project — the project's dial REFUSES"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > GREEN 2: the documented installer-set variable answers when the Claude Code one does not"
        status: pass
      - kind: integration
        ref: "node probe against the committed scripts/context-io.js with both project-directory variables unset (RED and GREEN transcripts quoted in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The change is monotone in the safe direction: no configuration moved from refused to admitted, and the empty-directory control resolves exactly as before."
    requirement: "UATX-02"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > MONOTONICITY: no configuration moved from REFUSED to ADMITTED, on either host family"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > CONTROL 2 (unchanged): no variable and no configuration above the cwd resolves to the KIT"
        status: pass
    human_judgment: false
  - id: D3
    description: "The upward search is bounded at the repository marker and by a step limit, and the precedence between the two variables is asserted in both directions."
    requirement: "UATX-02"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > BOUND: the search stops at the first repository marker and never returns the OUTER project"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > BOUND: the ancestor walk is limited, so a configuration far above the cwd is not reached"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > PRECEDENCE: with BOTH variables set to different projects, the Claude Code one wins"
        status: pass
    human_judgment: false
  - id: D4
    description: "There is still exactly ONE function answering which root governs an admission, and every consumer's answer is asserted equal to it at every step of the order."
    requirement: "UATX-01"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > step 1..4 > the three in-process writers / the CLI admit verb / promoteAdmitted / hooks/admission-guard.js / hooks/guard.js agree with the one function"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > the consumer set is DERIVED from the source rather than hand-typed"
        status: pass
      - kind: other
        ref: "node -e \"const m=require('./scripts/context-io.js'); …/^trustedRepoRoot/… length !== 1 throws\""
        status: pass
    human_judgment: false
  - id: D5
    description: "The Tier-1 dual-path oracle's docstring describes the notes it actually writes, and its writes leave a retained-audit host project's ledger untouched."
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-15 > IN-08: running the dual-path oracle leaves a retained-audit host project's ledger untouched"
        status: pass
      - kind: integration
        ref: "node scripts/check-uat-oracles.js — ALL CHECKS PASSED, exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "The structural bars this phase's requirements rest on (D-09 attended-lane bar, D-08 pin foundation guard, the oracle lane, the structure validator) are unmoved by the root-resolution change."
    requirement: "UATX-03"
    verification:
      - kind: unit
        ref: "scripts/chrome-lane-bar.test.ts — 15 passed"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js — guard_playwright_mcp_pin PASS, ALL CHECKS PASSED"
        status: pass
      - kind: integration
        ref: "VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js — ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D7
    description: "Workflow 16 states the resolution order's conditions and no longer describes the dial read as Claude-Code-only."
    requirement: "UATX-01"
    verification:
      - kind: integration
        ref: "node scripts/check-imperative-lexicon.js — ALL CHECKS PASSED (WP-02 procedural bound and WP-06 antecedent rule both satisfied by the new prose)"
        status: pass
    human_judgment: true
    rationale: "The gates prove the prose is well-formed and that the file parses; whether the sentence accurately describes the mechanism to a human reader is a judgment a reviewer makes, and the round-3 verifier's own finding was that a sentence can be well-formed and still overstate."

duration: 24 min
completed: 2026-09-08
status: complete
---

# Phase 31 Plan 15: The Trusted Governance Root Reads the Target Repository on Every Host — Summary

**`trustedRepoRoot()` gains a documented four-step order — the Claude Code variable, the installer-set `GRUGOPS_PROJECT_DIR`, a repository-bounded working-directory search, then the kit — proven monotone against the pre-fix program itself, with every consumer driven at every step, plus a Tier-1 oracle that stops describing a mechanism it does not have and stops writing into whatever repository the ambient root names.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-09-08T23:20:00Z
- **Completed:** 2026-09-08T23:44:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- **WR-15 closed.** The dial that decides an admission is read from the target repository on all five host CLIs. On the four hosts D-12 names as the ones where the attended lane is absent by design — and where the in-script refusal is therefore the ONLY tier available — the refusals Workflow 16 promises were previously evaluated against the kit's shipped lean default whatever the target repository said.
- **The change is proven monotone rather than asserted monotone,** against the pre-31-15 program itself: the committed `.js` is mirrored with the order reverted through two occurrence-asserted anchors, and the configuration set is compared verdict by verdict.
- **A frozen residual register** names what the order still cannot answer, each member with its reason and the criterion that would force it closed, asserted set-equal to this round's written dispositions.
- **WR-16 and IN-08 closed** in the Tier-1 dual-path oracle: the docstring now describes the two notes the function writes and states that no verdict is emitted, and both writes take a governance root the function creates and removes.

## Task Commits

1. **Task 1: the documented resolution order, RED-first** — `9c6f969` (fix)
2. **Task 2: the oracle's docstring and its owned governance root** — `e5b65e6` (fix)
3. **Deviation 1: revert the byte-frozen deploy guard, re-freeze the hook manifest** — `e40a197` (fix)
4. **Deviation 2 + 3: keep `equivDoWork` one function; split the over-long workflow sentences** — `4ee640a` (fix)
5. **Task 3: the fall-through cascade and the derived consumer set** — `88cbe24` (test)

_Plan metadata commit follows this SUMMARY._

## RED → GREEN: the verifier's spot-check row 6, quoted verbatim

The probe is the round-3 verifier's row 6 made runnable: a temp project holding
`{"context":{"human_admission":"high-severity"}}`, a child process with **both**
project-directory variables removed from its environment (removed, not blanked), its working
directory inside that project, and no approval grant present. It drives the **committed**
`scripts/context-io.js` with a self-stamped high-severity governance finding — the note the active
dial must refuse — and prints the resolved root beside the outcome so the cause is measured rather
than inferred.

### RED — against the PRE-FIX committed `.js`, before any source change

```
CLAUDE_PROJECT_DIR   = undefined
GRUGOPS_PROJECT_DIR  = undefined
process.cwd()        = /private/var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/wr15-proj-gCjy7v
temp project dial    = human_admission: high-severity
trustedRepoRoot()    = /Users/olgeroeselg/Projects/public/grugops
dial actually read   = ok / human_admission: off
RESULT: WROTE 20260908T020000Z-security-nfr-finding-51783b83
notes on disk        = 1
```

The write **SUCCEEDED**, and the resolved root was the module's own install root — the kit. Under the
shipped two-root install that is `~/.grugops`, whose only configuration is the shipped lean default,
which is why the dial actually read is `off` against a target repository that says `high-severity`.

### GREEN — against the POST-FIX committed `.js`

```
CLAUDE_PROJECT_DIR   = undefined
GRUGOPS_PROJECT_DIR  = undefined
process.cwd()        = /private/var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/wr15-proj-3tITYn
temp project dial    = human_admission: high-severity
trustedRepoRoot()    = /private/var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/wr15-proj-3tITYn
dial actually read   = ok / human_admission: high-severity
RESULT: REFUSED — context-io.appendNote: refusing to write a note the admission authority did not
accept. Nothing was written: admission REFUSED (human_admission: high-severity): a high-severity
governance entry authored by "security-nfr" (security, architecture, or release) carries a
self-authored human disposition stamp (verified_by: human:alice) that this in-script tier cannot
verify was placed by a real human. A high-severity admission is granted ONLY through the un-forgeable
admission-guard hook (a human exports the approval in the launching shell); a self-authored
human:NAME stamp does not satisfy it. Admission is refused until a named human disposes it through
the hook. This is the in-script defense-in-depth tier; on Claude Code the un-forgeable gate is the
separate admission-guard hook.
notes on disk        = 0
```

The refusal **names the dial it read** — `human_admission: high-severity` — so the two runs differ by
which repository's configuration was consulted and by nothing else.

## The resolution order

Stated in one place, `scripts/context-io.ts` `trustedRepoRoot()`:

| Step | Answer | Reason it is at this position |
|---|---|---|
| 1 | `CLAUDE_PROJECT_DIR`, present and non-empty after trimming, made absolute | The variable Claude Code sets for a real project session. Unchanged from before this plan. |
| 2 | `GRUGOPS_PROJECT_DIR`, same predicate | The documented **installer-set** answer for the four hosts that set no Claude Code variable. The installer knows the target it seeded; the agent does not set it. |
| 3 | The nearest ancestor of the process working directory carrying a factory configuration | The last non-kit answer available on a host that set neither variable. Bounded: the walk stops at the first ancestor carrying a repository marker and after 64 ancestors. |
| 4 | The kit this module ships in | The previous behaviour, kept as the LAST step rather than the only one. |

Both variable names live in one frozen ordered array, `TRUSTED_ROOT_ENV_ORDER`, so the precedence is
**data** rather than reading order, and both go through the one trim-and-publish presence predicate.
No parameter was added: the CLI `admit` verb still refuses a root on `argv`, and the MCP tool schema
still carries none.

## Monotonicity, the controls, the bound and the precedence — measured

The comparison is against the program this change replaces, not against a hand-written model of it.
The committed `.js` is mirrored into a temp kit with two anchored reversions —
`for (const name of TRUSTED_ROOT_ENV_ORDER)` → `.slice(0, 1)`, and
`const discovered = cwd === null ? null : projectRootFromWorkingDirectory(cwd);` → `= null` — each
anchor's occurrence count asserted at exactly 1 before the mutation and 0 after, so a mutation that
matched nothing cannot masquerade as a passing control.

| Case | Configuration | Result |
|---|---|---|
| MONOTONICITY | 6 configurations (`high-severity`, `all`, explicit `off`, no configuration, unreadable configuration, empty directory) × 3 environments (no variable, `CLAUDE_PROJECT_DIR`, `GRUGOPS_PROJECT_DIR`) = **18 driven pairs** | **0 cases moved refused → admitted.** The cases that moved admitted → refused are exactly the 6 whose target repository carries a dial the pre-31-15 program never read: `{high-severity, all, unreadable} × {no variable, GRUGOPS_PROJECT_DIR}`. Asserted as **set equality**, not as a count. |
| CONTROL 2 (unchanged) | Both variables unset, cwd an empty temp directory with no configuration or repository marker above it within the bound | Resolves to the kit, and the posture is lean — exactly as the pre-fix program did unconditionally. The premise (that the temp directory's ancestors carry nothing) is asserted, not assumed. |
| CONTROL 3 (adjacency) | cwd **is** the project root carrying the configuration | Returned at distance zero. A nested `a/b/c` under the same project returns the project, so the **nearest** ancestor answers rather than the search skipping past it. |
| BOUND | Outer project with an active dial; inner directory carrying `.git` and no configuration; cwd `inner/src` | The outer project's root is **not** returned. The walk stops at the inner repository marker and falls through to the kit. |
| BOUND, non-vacuous | Same nesting, but the inner repository **does** carry a configuration | The inner root answers and its dial refuses — so the bound case above is a bound and not a broken search. |
| BOUND, step limit | Configuration 70 directory levels above the cwd | Not reached; resolution falls through to the kit. A walk without a step limit would have found it. |
| PRECEDENCE | Both variables set to **different** projects | `CLAUDE_PROJECT_DIR` wins. Asserted in **both** directions (Claude-lean/installer-active writes; Claude-active/installer-lean refuses), because "the first one wins" and "the active dial wins" agree on a single-direction case. |
| EMPTY INPUT | `GRUGOPS_PROJECT_DIR` set to `""`, `"   "`, `"\n"` | Names nothing and falls through, exactly as the Claude Code variable already did. A padded value is trimmed and published. |
| CASCADE | A **distinct** project planted at every step, then each step's input removed in turn | The answer walks down the order: step 1 → step 2 → step 3 → the kit. |

## Every consumer of the trusted root, at every step — measured

Driven against the committed `.js` in a temporary kit (so the step-4 rows cannot write into the
working tree). Root names are the temp directory basenames; `<kit>` is the temporary kit that stands
in for the shared install. **Zero mismatches across all 28 rows.**

| Consumer | Step that answered | Root | Agrees with the one function | Posture | Measured message (truncated) |
|---|---|---|---|---|---|
| `appendNote` | 1 (`CLAUDE_PROJECT_DIR`) | `ct-dial-BaeFCu` | = `trustedRepoRoot()` | refuse | `context-io.appendNote: refusing to write a note the admission authority did not accept…` |
| `admitAndAppend` | 1 | `ct-dial-nznLN2` | = `trustedRepoRoot()` | write | `20260908T020000Z-security-nfr-finding-fee27eee` |
| `handleProposeNote` (admission server) | 1 | `ct-dial-IOCUJt` | = `trustedRepoRoot()` | write | `admitted: note …ef5c1024 written via the single sanctioned writer` |
| `promoteAdmitted` | 1 | `ct-unreadable-IzWf3g` | = `trustedRepoRoot()` | refuse | `DECLINED (unreadable-governance-config). A governance configur…` |
| CLI `admit` verb | 1 | `ct-dial-M9sAtO` | exit 1 | refuse | `admission REFUSED (human_admission: high-severity)…` |
| `hooks/admission-guard.js` | 1 | `ct-dial-UjNeO3` | = `trustedRepoRoot()` | deny | denied on the dial at the step-resolved root |
| `hooks/guard.js` | 1 | `ct-guard-PrEOD7` | = `trustedRepoRoot()` | allow | the lowering at the step-resolved root took effect |
| `appendNote` | 2 (`GRUGOPS_PROJECT_DIR`) | `ct-dial-t9yuui` | = `trustedRepoRoot()` | refuse | `refusing to write a note the admission authority did not accept…` |
| `admitAndAppend` | 2 | `ct-dial-yr2byI` | = `trustedRepoRoot()` | write | `20260908T020000Z-security-nfr-finding-78d9dcf1` |
| `handleProposeNote` | 2 | `ct-dial-c2A19d` | = `trustedRepoRoot()` | write | `admitted: note …9a5bc00d written via the single sanctioned writer` |
| `promoteAdmitted` | 2 | `ct-unreadable-ZOo2E2` | = `trustedRepoRoot()` | refuse | `DECLINED (unreadable-governance-config)…` |
| CLI `admit` verb | 2 | `ct-dial-TPqCyI` | exit 1 | refuse | `admission REFUSED (human_admission: high-severity)…` |
| `hooks/admission-guard.js` | 2 | `ct-dial-N0ru5Z` | = `trustedRepoRoot()` | deny | denied on the dial at the step-resolved root |
| `hooks/guard.js` | 2 | `ct-guard-hwODIm` | = `trustedRepoRoot()` | allow | the lowering at the step-resolved root took effect |
| `appendNote` | 3 (cwd walk) | `ct-dial-FzDTVr` | = `trustedRepoRoot()` | refuse | `refusing to write a note the admission authority did not accept…` |
| `admitAndAppend` | 3 | `ct-dial-gv9XaD` | = `trustedRepoRoot()` | write | `20260908T020000Z-security-nfr-finding-c13859ce` |
| `handleProposeNote` | 3 | `ct-dial-KVNrcg` | = `trustedRepoRoot()` | write | `admitted: note …7026e98e written via the single sanctioned writer` |
| `promoteAdmitted` | 3 | `ct-unreadable-Buq9JB` | = `trustedRepoRoot()` | refuse | `DECLINED (unreadable-governance-config)…` |
| CLI `admit` verb | 3 | `ct-dial-LJWkT1` | exit 1 | refuse | `admission REFUSED (human_admission: high-severity)…` |
| `hooks/admission-guard.js` | 3 | `ct-dial-cQoTGP` | = `trustedRepoRoot()` | deny | denied on the dial at the step-resolved root |
| `hooks/guard.js` | 3 | `ct-guard-U8PhM3` | = `trustedRepoRoot()` | allow | the lowering at the step-resolved root took effect |
| `appendNote` | 4 (kit, fall-through) | `<kit>` | = `trustedRepoRoot()` | write | `20260908T020000Z-security-nfr-finding-59a76cd9` |
| `admitAndAppend` | 4 | `<kit>` | = `trustedRepoRoot()` | refuse | `admission REFUSED (W3): this note is not gated…` |
| `handleProposeNote` | 4 | `<kit>` | = `trustedRepoRoot()` | refuse | `admission REFUSED (W3): this note is not gated…` |
| `promoteAdmitted` | 4 | `<kit>` | = `trustedRepoRoot()` | refuse | `DECLINED (no-such-origin-note)…` |
| CLI `admit` verb | 4 | `<kit>` | exit 0 | write | `note admitted: it passed every admission check that applies to it…` |
| `hooks/admission-guard.js` | 4 | `<kit>` | = `trustedRepoRoot()` | allow | allowed (lean posture at the kit) |
| `hooks/guard.js` | 4 | `<kit>` | = `trustedRepoRoot()` | deny | the lowering did not apply — the kit carries no lowering |

**Reading the polarities, because two of them look inverted and are not.**
`appendNote` and `admitAndAppend` disagree on this one note **by design**: under an ACTIVE dial a
human-stamped high-severity finding is GATED, so the combiner's pre-admitted branch is the route that
writes it, while `appendNote`'s in-script tier refuses a stamp it cannot verify; under the LEAN dial
the same note is NOT gated, so the combiner refuses the disposition (W3) while `appendNote` admits
it. Each writer FLIPS with the root, which is what proves it read that root. `promoteAdmitted` does
not consult the `human_admission` dial for a note it can prove, so its probe is the D-14
unreadable-configuration arm; the CLAUSE it names discriminates, not the verdict. `hooks/guard.js`
reads the CHECKPOINT matrix rather than `human_admission`, so its probe is a checkpoint lowering plus
its floor grant — a fact about which key that consumer reads, not a second spelling of which root.

**The consumer set is DERIVED, not typed.** The test scans every non-test `.ts` under `scripts/` and
`hooks/` for the one function's name and asserts the result set-equal to the files this block drives:
`hooks/admission-guard.ts`, `hooks/guard.ts`, `scripts/admission-server.ts`, `scripts/context-io.ts`.
A new consumer added later is a red test here, not a silent gap.

## Resolution-order residual register, with this round's dispositions

`TRUSTED_ROOT_RESIDUALS` is a frozen export in `scripts/context-io.ts`. The test suite asserts the
round's written dispositions **set-equal** to the register, so a member added later without a
disposition turns a case red rather than shipping as a silence.

| Id | Shape | Disposition |
|---|---|---|
| **R-31-15-01** | A process that can change its own working directory can decide which project's factory configuration step 3 finds. | **ACCEPTED** (threat `T-31-15-02`). Strictly monotone against what it replaces: step 4 resolved unconditionally to the kit, the most permissive answer available. A process that can change its working directory can already set the step-1 or step-2 variable in its own child environment, so this adds no capability. What the doctrine forbids is a root chosen as an ARGUMENT, and no parameter was added. The un-forgeable tier remains the per-call admission hook. **Closing criterion:** a root the calling process cannot influence at all — resolved by the host from outside the agent's process tree and delivered through a channel the agent cannot write. |
| **R-31-15-02** | A host repository that carries no factory configuration at any published candidate position resolves to the kit, whose shipped dial is lean. | **NOT A HOLE — the correct answer**, recorded so a reader tracing WR-15 does not read it as one. A repository that configured nothing has expressed no governance posture, and the kit's shipped default is the posture the project ships. **Closing criterion:** nothing in this module; it would change only if the project decided an unconfigured repository should be treated as stricter than the shipped default, which is a product decision about the dial. |
| **R-31-15-03** | Both project-directory variables are ambient environment values; a process that controls its own child environment sets what a child of it resolves. | **PRE-EXISTING and unchanged by this plan.** Step 1 has always had this property and step 2 is the same shape one name over. It is why the environment tier is documented as the weaker, not-mechanically-un-forgeable signal (D-05) rather than as the authority. **Closing criterion:** as R-31-15-01. |
| **R-31-15-04** | A factory configuration held ABOVE a nested repository is not found from inside that nested repository — the walk stops at the inner repository marker. | **DELIBERATE.** It is threat `T-31-15-03`'s mitigation rather than a side effect: an unbounded walk reaches a user's home directory and a sibling checkout's dial. **Closing criterion:** a published, explicit statement that an outer repository governs an inner one, which no artifact in this project makes today and which would need its own decision record. |

## Structural bars, re-measured after the change

| Bar | Command | Result |
|---|---|---|
| D-09 — no route from the attended lane to a gate stamp; one-author-set derived | `npx vitest run scripts/chrome-lane-bar.test.ts` | `Test Files 1 passed (1)`, `Tests 15 passed (15)` |
| D-08 — the pinned browser-MCP literal, by foundation guard | `node scripts/check-foundation-guards.js` | `PASS  playwright MCP pin 0.0.78 — pinned mention(s) over 117 markdown file(s): 0 findings over 7/7 elements`; `ALL CHECKS PASSED` |
| D-07 — the recipe-and-oracle lane | `node scripts/check-uat-oracles.js` | `ALL CHECKS PASSED`, exit 0 |
| Structure validator | `VALIDATE_KIT_ROOT=$PWD VALIDATE_ROOT=$PWD node scripts/validate-agent-factory.js` | `ALL CHECKS PASSED` |
| One trusted-root export | `node -e "…/^trustedRepoRoot/… length !== 1 throws"` | exit 0 — exactly one export |
| Derived writer / caller / decline-clause sets that 31-14 extended | `npx vitest run scripts/context-io-writer-set.test.ts scripts/compactor.test.ts` | green and unmoved (109 + suite) |
| Full excluded-e2e regression | `npx vitest run --exclude '**/scripts/e2e/**'` | `Test Files 62 passed (62)`, `Tests 3566 passed | 2 skipped (3568)`, exit 0 |
| Committed `.js` freshness | `npm run freshness` | `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| Build parity | `npm run check:build-parity` | `Build parity: no tracked build output moved when tsc ran.` |
| Build + typecheck | `npm run build && npm run typecheck` | exit 0 |

The 62-file / 2-skip shape the round-3 verification measured is preserved; the test count rose from
3529 to 3566 as this plan's cases landed.

## The round's FULL review dispositions ledger

Reproduced here so a reviewer has ONE place to check this round for completeness. Every finding of
`31-REVIEW.md`, including the ones `31-13` and `31-14` own.

| Finding | Severity | Disposition | Owning plan | Where addressed |
|---|---|---|---|---|
| **CR-07** — call-link and configured-soft evasions of the modifier ban | Critical | incorporated | `31-13` | Tasks 1–4 of `31-13` |
| **CR-08** — a human-disposed finding is refused on promotion | Critical | incorporated | `31-14` | Tasks 1–4 of `31-14` (`promoteAdmitted`, the proof-gated re-binding route) |
| **WR-14** — an import-renamed head evades the rule | Warning | incorporated | `31-13` | `31-13` Task 1 Movement 4, Tasks 2–3 |
| **WR-15** — the trusted root's kit fallback means four of five hosts never read the target repository's dial | Warning (flagged by the verifier as compounding CR-08 and as the primary deployment path) | **incorporated — closed this round** | `31-15` | Task 1 (documented order, RED-first against the committed `.js`, monotonicity proof, bound, precedence, controls); Task 3 (per-consumer legitimate-input table, cascade, derived consumer set, residual register) |
| **WR-16** — `equivDoWork`'s doc comment describes a reverted attempt's mechanism | Warning | **incorporated** | `31-15` | Task 2, using the reviewer's replacement text as the floor |
| **IN-07** — Workflow 18 step 5's pass-through claim is no longer exact | Info | incorporated | `31-14` | `31-14` Task 3 |
| **IN-08** — the Tier-1 oracle writes to the ambient trusted root | Info | **incorporated**, promoted above its filed severity because Task 1 makes the ambient root more likely to name a real host project | `31-15` | Task 2 |
| **IN-09** — residuals confirmed present and correctly dispositioned | Info | **acknowledged, carried forward** — no code change required, except the one deferral named below | `31-15` | This SUMMARY's carried-forward table |

### IN-09's confirmed residuals, carried forward with the finding that owns each

Recorded here so the next reviewer does not re-derive them.

| Residual | Owning finding / artifact | Carried-forward status |
|---|---|---|
| `R-43` — the declared surface is a hand transcription and is now a denominator | `31-09..31-12` summaries; `docs/audit/29-style-dispositions/31-09.md` | Confirmed accurately stated in the recipe and the `.d.ts` header. Unchanged this round. |
| `R-44` — depth bound 4 | same | Confirmed accurately stated. Unchanged this round. |
| `R-47` — the disposition record is hand-authored | same | Confirmed accurately stated. Unchanged this round. |
| `R-46` — an alias outside both buckets | same | Accurate but **incomplete**; the completion is CR-07, owned by `31-13`. |
| `Q9` — an in-process importer can mint a verdict via `emitVerdict` | same | **Disclosed and pre-existing.** Unchanged this round. |
| The 78 undispositioned clauses from `31-05/06/08` | same | Deferred with a measured count. Unchanged this round. |
| The `§14-gate` (no `#<id>`) spelling in `docs/audit/29-style-dispositions/31-09.md`'s WF18 line-51 row, a `guard_context_writes` false-positive workaround | IN-09 | **DEFERRED with a written reason.** It is a prose workaround for a guard false positive, it blocks nothing this round, and changing the guard's parse is a separate surface with its own blast radius. It is not closed and is not claimed as closed. |

### The four pre-existing manual-only verification items — CARRIED FORWARD, NOT CLOSED

None of these was attempted by this plan and none is closed by it. They are restated verbatim in
substance from `31-VERIFICATION.md`'s `human_verification` block.

| Id | Item | Why a human, and why still open |
|---|---|---|
| **R-01** | The attended Claude-in-Chrome lane opens under real interactive auth, pauses for a human on a login/challenge page, and produces only a human-stamped finding plus an artifact-ref — never a gate stamp. | Requires an attended Claude Code session with the Claude-in-Chrome extension and a real interactive login. Not reachable in CI and not reachable on this box. Carried unchanged through rounds 2 and 3. |
| **R-02** | The `claude auth status --json` fail-closed predicate (D-10) under an API-key-only box and under a long-lived setup token. | Research assumptions A2/A3 are `UNKNOWN - verify`; neither configuration is reachable without destroying this box's real credentials. |
| **R-03** | Both browser-absence probe stages, and the whole spec-integrity runnable, on a Windows host. | `UNKNOWN - verify` per the standing Windows posture. Not testable on darwin. |
| **R-04** | A host repository that installed grugops before this release re-runs the installer, picks up `tools/grugops/uat-spec-integrity.js`, and the uninstaller removes it. | Requires a second scratch repository with a prior grugops install at an earlier release; not exercised by the unit suite. |

## Files Created/Modified

- `scripts/context-io.ts` — `trustedRepoRoot`'s four-step order; `TRUSTED_ROOT_ENV_ORDER`;
  `REPO_BOUNDARY_MARKERS`; the bounded `projectRootFromWorkingDirectory` search;
  `TRUSTED_ROOT_RESIDUALS` and its `TrustedRootResidual` shape; the CLI `admit` usage message now
  built from the order rather than naming one variable.
- `scripts/context-io.js` — the committed build of the above.
- `scripts/context-io.test.ts` — the whole `31-15` block: the order step by step, the fall-through
  cascade, both bound cases, the step limit, precedence in both directions, the empty-input case,
  CONTROL 2 and CONTROL 3, the monotonicity mirror, the 7 × 4 consumer matrix, the derived consumer
  set, the residual register and its dispositions, and the IN-08 host-ledger case.
- `scripts/check-uat-oracles.ts` / `.js` — `equivDoWork`'s corrected docstring and its owned
  governance root.
- `scripts/floor-invariance.test.ts` — the D-24 paragraph recording that a 31-15 commit touched the
  byte-frozen deploy guard and put it back.
- `hooks/hook-entry.ts` / `.js` — the frozen decider manifest regenerated for `context-io.js`'s new
  hash.
- `agent-factory/workflows/16-context-read-write.md` — the degrade paragraph now states the
  resolution order's conditions and names `GRUGOPS_PROJECT_DIR` as the documented non-Claude-Code
  answer; the Inputs line no longer says the dial is read "when the host is Claude Code".

## Decisions Made

- **The order, not a parameter.** WR-15's fix could have been a `repoRoot` argument on the writers.
  It is not: 30-11 removed exactly that seam from the production `admit` verb, and 31-09 removed it
  from the writers' defaults. The order reads ambient values a process could already influence and
  adds no argument.
- **The precedence is data.** `TRUSTED_ROOT_ENV_ORDER` exists so the two names are spelled once, both
  go through the one presence predicate, and the precedence assertion indexes the array instead of
  restating the order a third time.
- **The kit is the LAST step, not a deleted one.** CONTROL 2 asserts an unconfigured host resolves
  exactly as it does today, so this change cannot be read as removing the fallback.
- **`hooks/guard.ts` reverted rather than re-baselined.** See Deviation 1.
- **IN-09's guard-side spelling fix deferred**, with the reason recorded in the ledger above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] The comment narrowing in the byte-frozen `hooks/guard.ts` was reverted**

- **Found during:** Task 3 (the full-suite run)
- **Issue:** Task 1 narrowed two COMMENTS in `hooks/guard.ts` — the two describing the kit as the
  immediate answer when `CLAUDE_PROJECT_DIR` names nothing — so the guard's prose would match the new
  order. `hooks/guard.ts` is **byte-frozen** at the D-02 blob, and D-24 makes the freeze
  **commit-scoped**: the guard and its baseline in `scripts/floor-invariance.test.ts` must move in the
  same commit. Both halves of the freeze fired — the blob comparison went red, and the D-24 assertion
  named commit `9c6f969` as a split.
- **Fix:** Reverted `hooks/guard.ts` and `hooks/guard.js` to the frozen blob. The comment imprecision
  is left standing and recorded in the baseline paragraph: re-freezing a deploy guard to correct a
  comment is the wrong trade, and the accurate statement of the order lives in the reader that owns
  it. `hooks/hook-entry.ts`/`.js` were regenerated because the decider closure carries a hash of
  `scripts/context-io.js`, which this plan legitimately changed.
- **Files modified:** `hooks/guard.ts`, `hooks/guard.js`, `hooks/hook-entry.ts`, `hooks/hook-entry.js`,
  `scripts/floor-invariance.test.ts`
- **Verification:** `npx vitest run scripts/floor-invariance.test.ts hooks/guard.test.ts` — 366 passed
- **Committed in:** `e40a197`

**2. [Rule 1 — Bug] `equivDoWork` kept as one function**

- **Found during:** Task 3 (the full-suite run)
- **Issue:** Task 2's IN-08 fix split the two writes into an `equivDoWorkUnder` helper so the
  governance root's lifetime was a `try`/`finally` around one call.
  `scripts/context-io-writer-set.test.ts` DERIVES the caller set of each promotion route across files
  and went red naming the new helper — the derivation doing exactly its job.
- **Fix:** The helper is inlined; the root's lifetime is a `try`/`finally` around the whole body and
  the derived member is `equivDoWork` again. The reason is recorded at the site so the next reader
  does not re-split it.
- **Files modified:** `scripts/check-uat-oracles.ts`, `scripts/check-uat-oracles.js`
- **Verification:** `npx vitest run scripts/context-io-writer-set.test.ts` — 109 passed;
  `node scripts/check-uat-oracles.js` — `ALL CHECKS PASSED`
- **Committed in:** `4ee640a`

**3. [Rule 1 — Bug] The Workflow 16 qualification broke two language gates**

- **Found during:** Task 3 (the full-suite run)
- **Issue:** `guard_imperative_lexicon` refused two sentences the new degrade paragraph added under a
  `## Steps` bullet: 29 and 28 words against the WP-02 procedural bound of 20; the first repair then
  tripped WP-06 by opening a sentence with a bare demonstrative.
- **Fix:** The resolution order is now four short sentences and the antecedent is named. No claim
  changed.
- **Files modified:** `agent-factory/workflows/16-context-read-write.md`
- **Verification:** `node scripts/check-imperative-lexicon.js` — `ALL CHECKS PASSED`
- **Committed in:** `4ee640a`

**4. [Rule 3 — Blocking] Temporary directories realpath-resolved in the new test block**

- **Found during:** Task 1
- **Issue:** On macOS `/var` is a symlink to `/private/var`, so a child process reports
  `process.cwd()` in the resolved form while `mkdtempSync` returns the unresolved one. Thirteen cases
  compared the two verbatim and failed on the platform rather than on the resolution order.
- **Fix:** Every temp directory in the block is realpath-resolved at creation, with the reason
  recorded at the helper.
- **Files modified:** `scripts/context-io.test.ts`
- **Verification:** the 31-15 block — 37 passed
- **Committed in:** `9c6f969` / `88cbe24`

**5. [Process] The plan's default-branch commit check was not enforced**

- **Found during:** every commit
- **Issue:** This project sets `git.branching_strategy: none` and `workflow.use_worktrees: false`, and
  every plan in this phase committed on `main`. The executor's protected-branch assertion would have
  halted the run.
- **Fix:** Committed on `main`, sequentially, as the orchestrator's instruction and every prior plan
  in this phase did. Recorded here rather than left implicit, exactly as `31-14` did.
- **Committed in:** n/a (process note)

---

**Total deviations:** 5 (3 auto-fixed bugs surfaced by this repository's own derived-set and
byte-freeze gates, 1 blocking platform issue, 1 process note).
**Impact on plan:** No scope creep. Three of the five are this repository's gates catching this
plan's own additions — the derived caller set, the byte freeze on the deploy guard, and the
procedural-sentence bound — which is the mechanism working rather than obstacles routed around. The
one change reverted rather than repaired is a comment in a byte-frozen safety file, and the reason is
recorded beside its baseline.

## Issues Encountered

- **The RED measurement is the probe, not the test.** The new test block cannot fail case-by-case
  against the pre-fix committed `.js`, because it reads exports that artifact does not have — the
  file fails at collection with `TypeError: Cannot read properties of undefined`. The meaningful
  RED is therefore the runnable row-6 probe quoted verbatim above, recorded against the pre-fix
  artifact before any source change. Recorded so a reviewer does not read "the test failed to
  collect" as the RED evidence.
- **The IN-08 case was proven able to red before being trusted.** A green case asserting an absence
  is the shape this repository keeps catching. Against a mirror of the oracle with the two governance
  roots removed, with the ambient root pointed at a retained-audit project, that project's
  `.grugops/audit/admissions.jsonl` gained **12 lines** — exactly the 3 tasks × 2 notes × 2 replay
  paths IN-08 predicted. After the fix the ledger is absent.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data source was introduced.

## Threat Flags

None. No new network endpoint, auth path or schema at a trust boundary was introduced. The one new
surface — the working-directory search — is enumerated in the plan's own threat register
(`T-31-15-02`, `T-31-15-03`) and carried into `TRUSTED_ROOT_RESIDUALS` as `R-31-15-01` and
`R-31-15-04`.

## Requirements

`requirements-completed` is deliberately **empty** and `.planning/REQUIREMENTS.md` was **not**
edited. The phase rule recorded in `ROADMAP.md` and enforced by commit `59d4e39` is that only a
verification round may flip a UATX requirement row to `Complete`. This plan supplies evidence toward
UATX-01, UATX-02 and UATX-03; it does not mark them.

## User Setup Required

None — no external service configuration required. `GRUGOPS_PROJECT_DIR` is an environment contract
the installer sets; nothing in this plan requires a human to export it, and where it is unset the
order's later steps answer.

## Next Phase Readiness

- Every actionable finding of `31-REVIEW.md` is now incorporated across `31-13`, `31-14` and `31-15`,
  or deferred with a written rationale, and this SUMMARY is the round's single completeness record.
- **Ready for a fourth phase verification round.** The two blockers (CR-07, CR-08) and the two
  warnings (WR-14, WR-15) are each owned and closed by a gap-closure plan; whether they are closed
  *in the verifier's sense* is exactly what a verification round decides, and this plan does not
  claim it.
- **Standing caution, from this repository's own record:** every gap-closure round in this phase has
  closed its findings and still returned `gaps_found`, with the next defect one register over. The
  register this plan just moved is the ROOT the predicate is evaluated against. The register a
  fourth round should probe next is what that root is *composed of* — the candidate positions
  `governanceConfigCandidates` publishes, and whether every reader asks for them rather than
  spelling one.

---
*Phase: 31-autonomous-manual-testing*
*Completed: 2026-09-08*

## Self-Check: PASSED

Every file named in `key-files.modified` exists on disk, and all five task commits
(`9c6f969`, `e5b65e6`, `e40a197`, `4ee640a`, `88cbe24`) are present in the repository. The
`commits: 5` figure is MEASURED — `git rev-list --count 4a6ea2d..HEAD` — not narrated.
