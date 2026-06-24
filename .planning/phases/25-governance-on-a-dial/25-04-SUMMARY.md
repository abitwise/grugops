---
phase: 25-governance-on-a-dial
plan: 04
subsystem: governance / admission / matcher / dial-floor
tags: [GOV-01, SC1, SC3, GAP1, GAP2, GAP3, admission-guard, shell-segment-parser, forged-stamp, fail-closed, D-12]
gap_closure: true

# Dependency graph
requires:
  - phase: 25-governance-on-a-dial (plan 01)
    provides: readGovernanceConfig(repoRoot?) — the shared governance value reader (default-on-absent, unchanged here)
  - phase: 25-governance-on-a-dial (plan 02)
    provides: hooks/admission-guard.js — the un-forgeable GOV-01 primary tier (matcher + dial gate hardened here)
  - phase: 25-governance-on-a-dial (plan 03)
    provides: admit() D-04 refusal + GOV-02 audit ledger + floor-invariance sweep (admit()-tier); SC2 + the ledger PRESERVED untouched
provides:
  - hooks/admission-guard.ts shell-segment parser (liveTokens + isAdmitInvocation) — ONE parsing authority replacing the ADMIT_SEGMENT regex
  - hooks/admission-guard.ts fail-closed dial canonicalization (only `off` does not gate) + corrupt-vs-absent config handling via readGovernanceConfigResult
  - scripts/context-io.ts readGovernanceConfigResult — discriminated {absent|ok|unreadable} read (additive; value reader unchanged)
  - scripts/context-io.ts admit() forged-human-stamp backstop (a self-authored high-severity human:NAME stamp is refused under an active dial)
  - scripts/floor-invariance.test.ts HOOK-tier garbage/corrupt sweep + anti-whack-a-mole launcher×prefix×body×line-ending class fuzz
  - 25-04-RED-baseline.txt / 25-04-GREEN-proof.txt — the both-direction RED→GREEN proof vs the committed .js
affects: [25-verify-work, 25-secure-phase, phase-26-equivalence-oracle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The matcher boundary IS the parser: one shell-grammar walk classifies quoted/comment/heredoc text as inert data, then asks if any LIVE segment is an admit launch (anti-whack-a-mole, the P22 round-8 lesson)"
    - "Fail-closed dial canonicalization at the un-forgeable tier: the ONLY non-gating value is exactly `off`; every other value gates at least as strictly as `all` (the dials only tighten, SC3)"
    - "Corrupt-vs-absent config distinction via an additive discriminated read result, leaving the value reader's default-on-absent contract intact (SC2 preserved)"

key-files:
  created: []
  modified:
    - hooks/admission-guard.ts
    - hooks/admission-guard.js
    - hooks/admission-guard.test.ts
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/floor-invariance.test.ts

key-decisions:
  - "Corrupt-vs-absent binding mechanism: option (a) — a NEW exported readGovernanceConfigResult returning {source: absent|ok|unreadable, config}; the hook consumes it and fails CLOSED on `unreadable`, stays lean on `absent`. readGovernanceConfig (the value reader) is UNCHANGED so SC2 / 25-01/02/03 / zero-config lean are preserved."
  - "Dial canonicalization is conservative: any non-canonical human_admission value gates at least as strictly as `all` (gateEveryMatch = dial !== 'high-severity' && dial !== 'off'), so a typo can never under-gate."
  - "The forged-stamp backstop refuses BOTH a missing AND a self-authored human:NAME stamp on a high-severity finding under an active dial; admit() names the fault, defers to the hook, never rewrites — it is the weaker self-settable tier (D-05), the hook is the only grant path."

requirements-completed: []  # GOV-01/GOV-02 stay in-progress until the independent red-team + human approval close SC1+SC3 (D-12)

# Metrics
duration: ~35min
completed: 2026-06-24
status: complete
---

# Phase 25 Plan 04 (gap-closure): shell-segment parser + fail-closed dial/config + forged-stamp backstop Summary

**The GOV-01 admission matcher is now a single shell-segment parsing authority that catches every admit launcher (node|npx|tsx|npx tsx + subshell + backslash-continuation + assignment/env prefix) and treats quoted/comment/heredoc text as inert data; the un-forgeable hook fails CLOSED on any non-`off` dial value and on a corrupt config while a genuinely absent config stays lean; and admit() now refuses a self-authored high-severity human:NAME stamp — closing the three matcher bypasses, the dial/corrupt-config fail-open, the forged-stamp hole, and the heredoc false-positive that 25-VERIFICATION.md reproduced. Tasks 01–03 are committed with both-direction RED→GREEN proof vs the committed `.js`; Task 25-04-04 (the independent both-angle red-team) is a BLOCKING checkpoint and execution STOPPED there — per D-12 the green author suites are necessary-but-NOT-sufficient for SC1+SC3 closure.**

## Performance
- **Duration:** ~35 min
- **Tasks:** 3 of 4 executed and committed (Task 4 is a blocking human-verify checkpoint — STOPPED, see below)
- **Files modified:** 7 (0 created; 2 proof artifacts created under the phase dir)

## Accomplishments

### Task 25-04-01 — shell-segment parser matcher (SC1 + GAP3), commit `3b0c16b`
- **RED captured FIRST** (the 22-08/22-09 discipline): before any source edit, child-spawned each bypass form against the PRE-FIX committed `admission-guard.js` (blob `d60fe72…`) and recorded each ALLOWs into `25-04-RED-baseline.txt` — subshell `( node …admit )`, backslash-newline continuation, `npx tsx`, bare `npx`, bare `tsx` all ALLOW; the inert heredoc body DENIES (GAP3 false-positive).
- **Replaced** the `ADMIT_SEGMENT` regex firewall (and the old `isAdmitInvocation`) with ONE parsing authority:
  - `liveTokens(cmd)` walks the command string ONCE honoring the shell grammar: single/double-quoted runs, `#` comments, and heredoc bodies (`<<WORD`, `<<-WORD`, `<<'WORD'`) are inert DATA and never emitted as live tokens; a backslash-newline is a line continuation (joins the segment); `(`, `$(`, `)`, `;`, `&`, `|`, newline open/close command contexts; each emitted token is flagged `startsSegment`.
  - `isAdmitInvocation(cmd)` finds each segment-leading command word (skipping `VAR=val`/`env` prefixes transparently); if it is a launcher (`node`|`npx`|`tsx`) it confirms the same segment has a `context-io` script token followed by the `admit` verb. The `npx tsx <script>` two-token form is covered (launcher `npx`, `tsx` an earlier arg).
- **No second narrower matcher** — grep confirms the regex firewall is gone and one parser feeds the gate.
- **GREEN:** all five launchers flip to DENY (naming the note); heredoc/quoted/comment mentions ALLOW; refuse-self-set (D-01) still DENIES; the supported bare-node form still DENIES (no regression). 40 cases in `admission-guard.test.ts`.

### Task 25-04-02 — fail-closed dial + corrupt config (SC3) and forged-stamp backstop (SC1), commit `f858f4a`
- **PART A (dial fail-closed):** in `admission-guard.ts` the ONLY non-gating value is now EXACTLY `off`; `gateEveryMatch = dial !== "high-severity"` (and `!== "off"`), so any typo / case / whitespace / garbage / empty value gates at least as strictly as `all`. Every non-canonical value flips RED ALLOW → GREEN DENY.
- **PART B (corrupt vs absent):** added `readGovernanceConfigResult(repoRoot?)` to `context-io.ts` returning a discriminated `{ source: "absent" | "ok" | "unreadable", config }`. The hook consumes it: `source === "unreadable"` (a config file exists but cannot be parsed) → `deny()` (fail-closed); `source === "absent"` (no file) → lean (allow routine). `readGovernanceConfig` (the value reader) is UNCHANGED — SC2 / 25-01/02/03 / zero-config lean preserved.
- **PART C (forged-stamp backstop):** `admit()` D-04 now refuses a high-severity finding under an active dial whether the `human:NAME` stamp is MISSING or SELF-AUTHORED. admit() (the weaker self-settable tier, D-05) cannot verify a real human placed the stamp, so it refuses and defers to the un-forgeable hook, NAMING the fault, never rewriting the note. The forged `human:eve` (and a self-authored `human:alice`) on a high-severity finding flips RED ADMITTED → GREEN REFUSED; under `off` it does not fire; a routine human-stamped finding is unaffected (high-severity-scoped).
- Updated the one stale D-04 test that had encoded the old forgeable behavior; 129 targeted tests green.

### Task 25-04-03 — anti-whack-a-mole fuzz + HOOK-tier garbage/corrupt sweep (D-12), commit `b8382be`
- **HOOK-tier sweep:** `floor-invariance.test.ts` now child-spawns the COMMITTED `admission-guard.js` (not just admit()) across 11 `human_admission` values incl. garbage — each non-`off` DENIES a high-severity admit; corrupt config DENIES; absent config ALLOWs routine; `off` ALLOWs. This closes the exact gap the red-team found (the 88-case sweep tested admit(), not the hook).
- **Anti-whack-a-mole class fuzz:** {launcher: node|npx|tsx|npx tsx} × {prefix: none|subshell|env-var|env|`\`-continuation} × {body: single/double-quoted|heredoc|comment} × {LF|CRLF}. Every LIVE admit launch DENIES; every INERT mention ALLOWs — asserted as a CLASS invariant over the single parsing authority, plus one adversary-shaped exotic launcher (`( FOO=1 env BAR=2 node \<nl> …admit )`) the author did not enumerate, caught structurally. 119 floor-invariance cases green.

## Decisions Made
- **Corrupt-vs-absent binding = option (a)** (a new discriminated read result), not a hook-side ad-hoc check, because it keeps the read logic in one shared module and leaves the value reader's contract provably untouched.
- **Conservative dial gating:** an unrecognized value gates like `all` (every match), the strictest reading, so a typo can only over-gate, never under-gate.
- **Backstop scope = high-severity only:** a routine finding's human stamp is not second-guessed (the dial only adds a stop for the three high-severity roles or, under `all`, every admission — which the hook already enforces).

## The matcher structure (single parsing authority)
- Recognized live launchers: `node`, `npx`, `tsx`, `npx tsx`, behind any number of `VAR=val` / `env` command prefixes, inside a subshell `( … )` / `$( … )`, joined across `\`-continuations.
- Inert body-contexts (never a live admit): single-quoted, double-quoted, `#` comment, heredoc body (`<<WORD`, `<<-WORD`, `<<'WORD'`/`<<"WORD"`).
- One grammar walk → a launcher shape outside any narrow anchor cannot escape, and an inert mention cannot false-positive.

## Proof artifacts (both-direction, vs the COMMITTED `.js`)
- `25-04-RED-baseline.txt` — pre-fix committed `.js` ALLOWs each bypass (subshell / `\`-continuation / npx tsx / bare npx / bare tsx / forged human:eve / 7 garbage dials / corrupt config) and over-blocks the heredoc.
- `25-04-GREEN-proof.txt` — post-fix committed `.js` DENIES each bypass naming the note; ALLOWs the inert heredoc/quoted/comment, the canonical `off`, and the zero-config absent routine; the launcher×prefix×body×line-ending fuzz + the exotic launcher.

## Safety invariants confirmed
- `npm run freshness` exits 0 — 21 committed `.js` fresh, 0 drift.
- `git diff --quiet hooks/guard.ts` exits 0 — byte-frozen (blob `3501810e21308e4b7e219679a6ca30dace9b5d66`, D-02). guard.ts was read for pattern only, never edited.
- `npx vitest run scripts/check-foundation-guards.test.ts` — 28/28 green (WR-01 did NOT false-positive on the rewrite or the new artifacts; D-13).
- Full non-e2e: `npx vitest run --exclude '**/scripts/e2e/**'` — **666 passed, 1 skipped** (up from 611). Bare `npm test` deliberately NOT run (live e2e lane).
- SC2 + the GOV-02 audit ledger (25-01/02/03) are PRESERVED untouched (the audit-ledger tests stay green; the ledger writer and `readGovernanceConfig`'s absent path are unchanged).

## Deviations from Plan
**One in-scope test correction (Rule 1 — the test encoded the bug being fixed).** The pre-existing D-04 case "does NOT fire when the finding carries a verified_by: human:alice stamp under high-severity" asserted the OLD forgeable behavior (a self-authored high-severity human stamp admitting). The 25-04 forged-stamp backstop intentionally reverses this; the test was updated to assert the corrected REFUSED outcome. This is the exact SC1 semantic the verifier required, not a regression.

## REQUIRED before SC1+SC3 are considered closed (flag for the verifier / checkpoint)

**Per D-12 and [[grugops-safety-invariant-green-suite-insufficient]], the green author suites here are NECESSARY BUT NOT SUFFICIENT.** This phase already hit the green-suite-insufficient failure mode TWICE: the author's prior 31+88-case suites passed and STILL missed these exact bypasses. The author reproduced the both-direction RED→GREEN flip vs the committed `.js` (captured in the proof artifacts) as EVIDENCE — the author does NOT claim SC1+SC3 are "closed."

**Task 25-04-04 is a blocking `checkpoint:human-verify` (gate="blocking", autonomous:false) and execution STOPPED there.** This executor cannot dispatch the required independent red-team (subagents cannot spawn subagents) and must NOT self-approve. The INDEPENDENT opus-grade probe — different blind spots than the author, running BOTH a LOGIC angle AND an INPUT-SURFACE angle (the P23 split, which earned its keep on exactly this phase's first red-team) — must, vs the COMMITTED `hooks/admission-guard.js` and `scripts/context-io.js` (never the `.ts`, never the author's own suites):
1. **Input-surface:** reproduce each evasion launcher DENY (subshell / `\`-continuation / `npx tsx` / bare npx/tsx) + the heredoc/quoted/comment ALLOW, AND invent at least one launcher/mention shape the author did NOT enumerate to test the parser as ONE authority over the grammar, not an anchor list.
2. **Logic:** reproduce every non-canonical dial DENY + corrupt config DENY + absent config ALLOW + the forged `human:eve` high-severity REFUSAL.
3. **Both-direction RED→GREEN** matching `25-04-RED-baseline.txt` (pre-fix ALLOW) → `25-04-GREEN-proof.txt` (post-fix DENY naming the note; clean/heredoc/zero-config ALLOW), reproduced vs the committed `.js`.
4. **Floor + freshness:** the four named floor invariants hold at every dial value; `git diff --quiet hooks/guard.ts` exit 0; freshness 0; WR-01 no false-positive.
5. Record the reproduced commands + the invented shape + outcomes HERE, then surface to the human for the "approved" resume signal.

## Self-Check: PASSED

- `hooks/admission-guard.ts` (shell-segment parser) — FOUND
- `scripts/context-io.ts` (readGovernanceConfigResult + forged-stamp backstop) — FOUND
- `scripts/floor-invariance.test.ts` (HOOK-tier sweep + fuzz) — FOUND
- `25-04-RED-baseline.txt` — FOUND
- `25-04-GREEN-proof.txt` — FOUND
- `25-04-SUMMARY.md` — FOUND
- commit `3b0c16b` (Task 25-04-01) — FOUND
- commit `f858f4a` (Task 25-04-02) — FOUND
- commit `b8382be` (Task 25-04-03) — FOUND
- `ADMIT_SEGMENT` regex firewall GONE (only a historical comment reference remains; one parser feeds the gate) — CONFIRMED

---
*Phase: 25-governance-on-a-dial*
*Completed: 2026-06-24 (Tasks 01–03; Task 04 blocking checkpoint pending the independent red-team)*
