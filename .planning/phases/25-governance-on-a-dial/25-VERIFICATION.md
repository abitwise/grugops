---
phase: 25-governance-on-a-dial
verified: 2026-06-24T18:00:00Z
status: gaps_found
score: 1/3 success criteria verified (SC2 verified; SC1 STILL failed after 25-06 round-3 gap-closure — Classes A/B/E/F closed but a NEW command-modifier-operand / unlisted-wrapper / leading-redirection command-RESOLUTION class bypasses the un-forgeable gate; SC3 dial-canonicalization closed in 25-05 but the SC1 hole leaks a gated admit at EVERY dial incl. `all` — see post-25-06 banner below)
behavior_unverified: 0
overrides_applied: 0
re_verification:
gaps:
  - truth: "SC1 — the human gate is the un-forgeable primary tier; a high-severity note cannot be admitted without a NAMED human disposition. CONFIRMED BYPASS: three Bash command forms slip a real gated high-severity admit PAST the admission-guard matcher (hook returns ALLOW while the identical command actually admits), and admit()'s D-04 has no forged-stamp backstop."
    status: failed
    reason: >
      The admission-guard hook is the SOLE mechanically un-forgeable gate (D-01/D-05;
      admit()'s D-04 tier is the weaker self-settable tier). Its ADMIT_SEGMENT matcher
      (hooks/admission-guard.ts:83-84) anchors only on a bare `node` command at the start
      of an unquoted segment, so three real admit forms evade it and the hook ALLOWs while
      the command admits the note. Reproduced directly against the committed regex (blob
      d60fe72…): subshell `( node …context-io.js admit T forged.md )` → matcher=false
      (leading `(` not in the segment boundary class `[;&|\n]`); backslash-newline
      continuation `node \<newline> …admit …` → matcher=false (`\n` ends the matcher span
      before `admit`, but bash continues the line); `npx tsx scripts/context-io.ts admit …`
      → matcher=false (anchor is `node\b`, never `npx`/`tsx`). COMPOUNDED: admit()'s D-04
      refusal (context-io.ts:930) fires only `!HUMAN_STAMP_RE.test(vb)` — i.e. only when NO
      human stamp exists — so a FORGED `verified_by: human:eve` stamp passes admit() at every
      dial value. With the hook bypassed by these forms AND admit() not backstopping a forged
      stamp, a high-severity note is admitted with a forged human stamp and ZERO real human
      approval. The un-forgeable primary tier is forgeable.
    artifacts:
      - path: "hooks/admission-guard.ts"
        issue: >
          ADMIT_SEGMENT (lines 83-84) is a regex firewall that anchors only on `node` at an
          unquoted segment start; it misses subshell `(`-prefixed invocations,
          backslash-newline line continuations, and `npx tsx`/`npx`-launched runs. The
          isAdmitInvocation() input surface does not parse shell segments, so any launcher
          shape outside the narrow `node`-anchor escapes the gate.
      - path: "scripts/context-io.ts"
        issue: >
          The D-04 refusal (line 930) only fires when verified_by carries NO human:NAME stamp
          (`!HUMAN_STAMP_RE.test(vb)`). A structurally well-formed but FORGED `human:eve` stamp
          passes the grammar (HUMAN_STAMP_RE at line 118) and bypasses D-04 at every dial value.
          There is no backstop binding the human stamp to an actual hook-verified disposition,
          so when the hook is evaded admit() admits the forged-stamp note.
    missing:
      - "Replace the ADMIT_SEGMENT regex matcher with proper shell-segment parsing that catches every admit launcher: `node`, `npx`, `tsx`, `npx tsx`, a subshell `( … )` prefix, and backslash-newline line continuations — while still treating quoted/heredoc/commented bodies as inert data (do NOT regress the verb-anchored input-surface discipline)."
      - "Add a forged-human-stamp backstop to the un-forgeable tier so a `verified_by: human:NAME` stamp cannot stand on a high-severity finding without a corresponding hook-verified disposition (the hook must remain the only path that grants a high-severity admit; a self-authored human:NAME stamp must not pass admit() under human_admission != off)."
      - "Re-prove BOTH directions vs the newly committed .js (clean=allow / each evasion form planted high-severity-without-approval=deny naming the note), reproduced by an independent opus-grade red-team, not a green author suite (D-12)."
  - truth: "SC3 — the un-dialable safety floor is not bypassable by ANY dial setting; a garbage/unknown human_admission value must be treated as gate-or-stricter, NEVER off-equivalent. CONFIRMED FAIL-OPEN: a typo'd/garbage/case-variant dial value, and a corrupt config, make the hook ALLOW (off-equivalent)."
    status: failed
    reason: >
      The hook gates only on the EXACT strings `high-severity`/`all`
      (admission-guard.ts:229 `isGated = dial === "all" || (dial === "high-severity" &&
      isHighSeverity)`). Any unknown/garbage/typo/case/whitespace value
      (`hihg-severity`, `High-Severity`, `all ` with trailing space, `""`, `bogus`, `OFF`,
      `1`, …) is neither exact match → `isGated=false` → the hook falls through to
      `process.exit(0)` ALLOW. This is off-equivalent: a high-severity admit under a typo'd
      dial passes both tiers silently. Separately, readGovernanceConfig (context-io.ts:1096+)
      returns the lean `off` default on ANY read failure (corrupt/unreadable/non-JSON config),
      and the helper NEVER throws — so the hook's own config try/catch (admission-guard.ts:174)
      is dead code, and a corrupt config yields `dial="off"` → hook ALLOW even on a forged
      high-severity admit. Both are structural fail-open holes: the dials do NOT only tighten;
      a non-`off` non-canonical value silently opens what `off` would (correctly) leave
      ungated. admit()'s D-04 is correctly fail-closed here (`!== "off"`), but the hook — the
      un-forgeable tier — is the one that fails open, so the floor IS bypassable by a dial
      setting, contradicting SC3 and Plan 25-03's own structural requirement
      ("garbage treated as gate-or-stricter, never off-equivalent that opens a hole").
    artifacts:
      - path: "hooks/admission-guard.ts"
        issue: >
          Line 229 gates on exact `"all"`/`"high-severity"` only; any other value (incl.
          typos, case variants, trailing whitespace, garbage) falls through to ALLOW. Line
          183 `if (dial === "off") exit(0)` plus the exact-match gate means everything that is
          not canonical-on is treated as off-equivalent. The fail-closed posture for a corrupt
          config is also unreachable because readGovernanceConfig never throws and returns
          `off` on failure (the try/catch at line 169-180 is dead code).
      - path: "scripts/context-io.ts"
        issue: >
          readGovernanceConfig (line 1096+) fails OPEN to the lean default on every read
          failure and returns present values verbatim with no canonicalization. That is correct
          for the reader's contract, but it means the un-forgeable hook receives `off` for a
          corrupt config and an un-normalized garbage string for a typo'd dial — and the hook
          does not defensively treat non-canonical/unreadable as gate-or-stricter.
    missing:
      - "Make the hook fail CLOSED on a non-canonical human_admission value: any value not exactly `off` must be treated as gate-or-stricter (gate at least as strictly as `high-severity`, ideally `all`), never as off-equivalent. A typo must never open a hole."
      - "Make the corrupt/unreadable-config path of the un-forgeable hook fail CLOSED: when the governance config cannot be read, gate the admission (deny pending a human) rather than reading the lean `off` default. Either have the hook distinguish read-failure from a legitimate `off`, or have the hook deny a matched admit whenever the config read is not a confident `off`."
      - "Extend the floor-invariance sweep so it asserts the HOOK (not just admit()) treats every garbage/typo/case/whitespace human_admission value and a corrupt config as gate-or-stricter; re-prove with an independent red-team (D-12)."
  - truth: "Input-surface fail-safe correctness — an inert heredoc/multiline command whose later line merely contains admit text must NOT be denied (the CR-01 inverse). CONFIRMED FALSE-POSITIVE (fail-safe, secondary)."
    status: partial
    reason: >
      The ADMIT_SEGMENT matcher treats `\n` as a segment separator in its leading boundary
      class `(^|[;&|\n])`, so a heredoc/multiline command whose later line contains
      `node …context-io.js admit …` matches and is DENIED even though that line is inert
      heredoc body data (reproduced: `cat <<EOF\nnode …admit …\nEOF` → matcher=true). This
      over-blocks legitimate doc-generation/heredoc commands under active governance. It is
      the fail-SAFE direction (over-deny, not under-allow) and lower priority than the two
      blocking gaps, but it is a real defect in the same matcher that must be fixed when the
      matcher is rewritten to shell-segment parsing (a proper parser would recognize the
      heredoc body as data, not a command segment).
    artifacts:
      - path: "hooks/admission-guard.ts"
        issue: >
          ADMIT_SEGMENT (lines 83-84) treats `\n` as a command-segment boundary, so a later
          line inside a heredoc/multiline body that contains real admit text reads as a live
          admit segment and is denied. The matcher does not model heredoc/quoted-body bodies
          as data.
    missing:
      - "When the matcher is rewritten to shell-segment parsing (SC1 fix), recognize heredoc bodies and quoted multiline bodies as DATA, not command segments, so an inert later-line mention is allowed (fix the CR-01-inverse false-positive in the same pass)."
deferred:
human_verification:
---

# Phase 25: Governance-on-a-Dial Verification Report

> ## ⚠ UPDATE 2026-06-25 — post-25-06 (round-3 UNIFY gap-closure) independent both-angle red-team: STILL gaps_found
>
> Round-3 gap-closure plan **25-06** was EXECUTED (tasks 01–03 committed `4ba29f2`/`8d5b263`/`2f99cde`)
> and put through its blocking **Task 25-06-04** independent both-angle (LOGIC + INPUT-SURFACE, the P23
> split) opus red-team vs the COMMITTED `admission-guard.js` (blob `a65a93c5…`), corroborated by the
> orchestrator's own child-spawn probe. Author suite fully green (304 governance / 792 non-e2e),
> `guard.ts` byte-frozen (`3501810e…`), `scripts/context-io.ts` UNCHANGED, freshness 0.
> **25-06 CLOSED all four round-3 classes — CONFIRMED SOLID by BOTH red-team angles:** Class A path-form
> launcher (`/usr/bin/nice node`, `command node`, `nodejs`, `no"de"`, `{ node …; }`) DENIES; Class B
> `$(echo node)`/backtick command word GATES; Class E `routine ; high` / `routine && high` / newline /
> subshell DENIES (routine-only ALLOWs); Class F duplicate/indented/spaced/CRLF `by` is gate-or-stricter
> (a 108-shape hook-vs-`validate()` divergence fuzz found ZERO divergence). GAP-B/C/D, the four named
> floor invariants, the over-block-clean direction (zero false-positives), SC2 + the GOV-02 ledger all
> HOLD. **BUT both angles + the orchestrator probe reproduced ONE NEW structural command-RESOLUTION
> class (17+ live forms) → SC1 remains `gaps_found`.** This is round 4 / the **8th** green-suite-
> insufficient catch of v2.0 (exactly as Plan 25-06's prohibition #1 anticipated). Full repros + root-
> cause line refs: `25-06-SUMMARY.md` → "Independent Both-Angle Red-Team". The banners below are
> SUPERSEDED for the CLOSED classes; this is the live finding:
>
> - **SC1 / leading-run command-modifier-operand resolution (INPUT-SURFACE + LOGIC, both angles converged).**
>   The round-3 UNIFY resolver (`liveAdmitSegments`, admission-guard.ts:566-574 / .js:556-566) models
>   `<modifier> [-flags] <launcher>` but NOT the rest of the shell's prefix grammar, and SILENTLY DROPS a
>   segment whose command word doesn't resolve to a launcher (default = ALLOW). One class, three sub-roots:
>   - **(2) option/modifier OPERAND not consumed** — `timeout 5 node …admit <hi>` (the textbook, flagless
>     `timeout` form; the duration `5` halts the leading-run skip and reads as the command word),
>     `nice -n 5 node …`, `exec -a foo node …`, `xargs -I {} node …`, `env -C /tmp node …`, `env -u PATH node …`,
>     `timeout -k 1 5 node …`, `/usr/bin/timeout 5 node …`, `nice '-n' '5' node …` — all ALLOW a gated
>     high-severity admit (forged `human:eve`, zero real human) through the un-forgeable PRIMARY tier.
>   - **(1) wrapper not in `COMMAND_MODIFIERS`** (admission-guard.ts:110-120) — `sudo`/`doas`/`setsid`/`ionice`/
>     `chrt`/`taskset node …admit` ALLOW (the closed enumeration is the anti-pattern this phase keeps hitting).
>   - **(3) leading redirection** — `>/dev/null node …admit`, `2>/dev/null node …`, `2>&1 node …` ALLOW
>     (`liveTokens` has no redirection grammar; the operator/target reads as the segment's command word).
>   - **Compounding:** at dial `all` even a ROUTINE admit slips (`timeout 5 node …admit <routine>`) — the
>     strictest dial's floor leaks; and Class E is REOPENED — `node …admit <routine> ; timeout 5 node …admit <hi>`
>     ALLOWs because the wrapper makes the shielded high segment invisible to per-segment classification.
>     The D-01 self-set floor is NOT breached (the broader `commandHasLiveAdmitShape` shape-scan still fires) —
>     this is a GATING bypass, not a self-approval breach.
>
> **Structural root fix for round 4 (both red-team angles independently converged — anti-whack-a-mole):**
> do NOT widen `COMMAND_MODIFIERS` or enumerate operand grammars one notch at a time (the trap). Instead
> INVERT the default exactly as Class B already does for dynamic words: when a segment carries the live
> admit SHAPE (`segmentHasAdmitShape` — a context-io reference + the `admit` verb) but the leading-run
> resolution does NOT terminate at a recognized launcher, treat the command word as UNRESOLVABLE and
> GATE (fail-closed), instead of silently dropping the segment. The admit shape is the trigger, so a new
> wrapper/option/redirection spelling cannot escape; the over-block direction is proven safe (a non-admit
> wrapper — `timeout 5 node render`, `sudo ls` — has no admit shape and stays ALLOW). The P22 round-8
> "make the boundary BE the parser, and fail closed on the unresolvable tail" lesson, applied to
> modifier-operand consumption. **Next:** `/gsd-plan-phase 25 --gaps`.

> ## ⚠ UPDATE 2026-06-25 — post-25-05 (round-2 gap-closure) independent red-team: STILL gaps_found
>
> Round-2 gap-closure plan **25-05** was EXECUTED (tasks 01–03 committed `ffb0d75`/`4100ce4`/`4e69496`)
> and put through its blocking **Task 25-05-04** independent both-angle (logic + input-surface) opus
> red-team vs the committed `.js`, corroborated by the orchestrator's own child-spawn probes. The
> author suite is fully green (743 non-e2e), `guard.ts` byte-frozen (`3501810e…`), freshness 0.
> **25-05 CLOSED the round-2 LOGIC classes** (GAP-C non-string/corrupt/edge dial, GAP-D case/whitespace
> severity, GAP-B self-set-behind-wrapper — all confirmed SOLID at both tiers) and the over-block
> direction stays clean. **But the red-team reproduced THREE NEW live exploitable bypass classes
> (+ one masked defect) → SC1 remains `gaps_found`.** This is round 3 / the **7th** green-suite-insufficient
> catch of v2.0. Full repros + root-cause line refs + the structural root fix: `25-05-SUMMARY.md` →
> "Independent Both-Angle Red-Team". The round-1 gap entries (frontmatter) and the post-25-04 banner
> below are SUPERSEDED by these current findings:
>
> - **SC1 / matcher — path-form command modifier (INPUT-SURFACE):** `/usr/bin/env node …admit`,
>   `/usr/bin/nice node …`, `/usr/bin/env -S node …` (invented), `/usr/bin/xargs node …`, `./nice node …`
>   all ALLOW a gated admit. Root: round-2 basenamed only the launcher word; `isCommandPrefix`
>   (admission-guard.ts:367-373) still tests the RAW modifier token, so a path-form modifier escapes
>   the prefix-skip and the trailing `node` reads as an argument.
> - **SC1 / matcher — command-substitution / backtick command word (INPUT-SURFACE):** `$(echo node) …admit`,
>   `` `echo node` …``, `$(printf node) …`, `$(basename /usr/bin/node) …`, nested/in-modifier-slot all
>   ALLOW. Root: `$(`/`(` are treated as segment openers (:313-314) and backticks are ungrammared, so
>   the substitution that PRODUCES the command word fails OPEN — asymmetric with `$X` (which fails closed).
> - **SC1 / classifier — multi-admit "shield" (LOGIC, NEW, CRITICAL):** under `high-severity`,
>   `node …admit T <routine> ; node …admit T <high-sev>` (and `&&`/`\|`/subshell) ALLOWs. Root:
>   `noteFileFromCommand` (admission-guard.ts:509-517) classifies only the FIRST `admit` token; the
>   matcher is segment-aware but the severity classifier is not. The shielded high-sev note is
>   structurally valid and may carry a forged `human:eve` stamp → forged-human high-severity admit with
>   zero real human, through the un-forgeable PRIMARY tier on Claude Code.
> - **SC1 / masked defect (defense-in-depth):** the hook reads `by` via `parseNote` (last-wins/malformed-
>   tolerant) without `validate()`, so a duplicate/indented `by` mis-classifies — masked today by
>   `admit()`'s own `validate()`. Fix for tier consistency.
>
> **What HELD (round-4 need NOT re-touch):** GAP-C, GAP-D, GAP-B/D-01 floor, off-case/whitespace,
> over-block direction, the four named floor invariants, freshness, `guard.ts` byte-frozen. SC2 + the
> GOV-02 audit ledger remain PRESERVED. **Structural root fix (anti-whack-a-mole, applied completely):**
> resolve the effective command word over EVERY token in the leading run (basename + de-quote modifiers
> too); fail CLOSED on EVERY dynamic command-word production (`$(…)`/backtick, not just `$X`/`eval`);
> classify EVERY live admit segment's note (not just the first `admit`); make hook note-parsing
> consistent with `validate()`. **Next:** `/gsd-plan-phase 25 --gaps`.

> ## ⚠ UPDATE 2026-06-24T19:44Z — post-25-04 independent red-team: STILL gaps_found
>
> Gap-closure plan **25-04** was EXECUTED (tasks 01–03 committed `3b0c16b`/`f858f4a`/`b8382be`) and put through its blocking **Task 25-04-04** independent both-angle (logic + input-surface) opus red-team vs the committed `.js`. It **CLOSED the 6 originally-reported forms** below (subshell / `\`-continuation / `npx tsx` / bare npx/tsx / 7 garbage-STRING dials / corrupt config / forged-stamp-when-no-stamp / heredoc false-positive). **But the red-team found NEW bypasses → SC1+SC3 remain `gaps_found`.** The gap entries below are SUPERSEDED by these current findings (full repros + root-cause line refs: `25-04-SUMMARY.md` → "Independent Both-Angle Red-Team" section):
>
> - **SC1 / matcher (input-surface):** ≥12 launcher shapes still ALLOW a live gated admit — `command`/`exec`/`nice`/`time`/`nohup`/`xargs` wrappers, path/basename (`/usr/local/bin/node`), `nodejs`, `eval`/backtick, split-quote (`no"de"`), `{ }` brace group. Root: `LAUNCHERS` is a 3-literal anchor set (admission-guard.ts:88/265), no effective-command-word resolution; whole-token-only de-quote (:118). **Compounding:** `SELF_APPROVE` runs AFTER the matcher early-exit (:332-341), so every matcher false-negative also reopens the D-01 refuse-self-set floor invariant.
> - **SC1 / severity (logic):** case-variant `by: Security-NFR` escapes the case-sensitive `HIGH_SEVERITY_ROLES` (hook:440, admit:929) while `validate()` accepts any `by` → forged `human:eve` admitted under the `high-severity` dial (both tiers).
> - **SC3 / dial (logic):** a non-string `human_admission` (`true`/`1`/`null`/`[]`/`{}`) coerces to `off` (context-io.ts:1134+1191 `typeof human === "string" ? human : default`) → governance silently OFF at both tiers despite `source="ok"`.
>
> guard.ts byte-frozen (`3501810e…`) and freshness 0 throughout. SC2 + the GOV-02 audit ledger remain PRESERVED. **Next:** `/gsd-plan-phase 25 --gaps`.

**Phase Goal:** Expose the enterprise governance tiers over the now-stable decentralized substrate — human-gated high-severity admission and audit retention — without touching the lean defaults or the un-dialable safety floor.
**Verified:** 2026-06-24T18:00:00Z (initial) · 2026-06-24T19:44Z (post-25-04 independent red-team — still gaps_found)
**Status:** gaps_found
**Re-verification:** Yes — re-checked after 25-04 gap-closure via the blocking independent both-angle red-team (Task 25-04-04)

## Goal Achievement

The phase delivers the config foundation (SC2) cleanly, but the GOV-01 human gate is **forgeable** in practice (three confirmed matcher bypasses + a forged-stamp gap in admit()) and the un-dialable floor is **bypassable** by a typo'd/garbage dial value and a corrupt config (confirmed hook fail-open). SC1 and SC3 are NOT met. These are not green-suite re-litigations — the author's 31-case and 88-case suites pass; the bypasses were reproduced by two independent opus red-teams against the COMMITTED `.js` (the project's terminal D-12 lesson: a green suite is necessary-but-not-sufficient for a safety guard) and re-confirmed by this verifier directly against the committed regex and the committed admit() branch.

### Observable Truths (mapped to Success Criteria)

| #   | Truth (Success Criterion)                                                                                                  | Status     | Evidence |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- |
| SC1 | High-severity (security/architecture/release) notes require a NAMED human disposition before admission; `off` admits routine notes without a stop | ✗ FAILED   | Hook matcher (admission-guard.ts:83-84) misses subshell `(`, backslash-newline continuation, and `npx tsx` admit forms → ALLOW while the command admits. admit()'s D-04 (context-io.ts:930) only fires when NO `human:` stamp exists → a forged `human:eve` stamp passes at every dial value. Net: a high-severity note admits with a forged stamp and zero human approval. Reproduced vs committed regex (all three forms → matcher=false). |
| SC2 | `audit_retention: git\|retained` controls retention; all three config files updated in lockstep; lean defaults preserved (zero-config runs lean) | ✓ VERIFIED | kit JSON == seed JSON byte-identical (`diff` exit 0); both keys present with lean defaults (`human_admission: off`, `audit_retention: git`); twin documents both with the D-09 distinction (factory.config.md:93-94,113-118,135-136); GOV-02 ledger writer (context-io.ts:955-980) appends one fixed-key admission-record JSONL under `retained`, writes nothing under `git`, never the note body; consistency + ledger suites green (125 tests). readGovernanceConfig defaults-on-absent (line 1096+), zero-config runs lean. |
| SC3 | The un-dialable safety floor is unchanged and NOT bypassable by ANY dial setting (verify-before-write, no-fabrication, test-integrity, humans-hold-merge/deploy) | ✗ FAILED   | The FOUR named floor invariants hold at every dial value (refuse-self FAILs, no-fabrication/never-rewrite holds, `quality.test_integrity` has no `off`, `hooks/guard.ts` byte-frozen at `3501810e…`, `git diff --quiet` exit 0). BUT the STRUCTURAL "not bypassable by ANY dial setting" requirement FAILS: the hook gates on exact `all`/`high-severity` only (line 229) → a typo/garbage/case/whitespace value or a corrupt config (readGovernanceConfig returns `off`, line 1096+) → ALLOW (off-equivalent). The floor IS bypassable via a non-canonical dial value. |

**Score:** 1/3 success criteria verified (SC2). SC1 and SC3 failed.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `hooks/admission-guard.ts` (+ `.js` blob `d60fe72…`) | Un-forgeable GOV-01 PreToolUse gate: matches admit, classifies severity by `by`, denies un-approved high-severity, refuses self-set, fails closed | ⚠️ PRESENT BUT DEFECTIVE | Exists, wired in hooks.json, self-set refusal (D-01) solid, byte-frozen guard.ts untouched. BUT the matcher misses three real admit launchers (subshell / `\`-continuation / `npx tsx`) and fails OPEN on a garbage dial and a corrupt config. The gate is not un-forgeable in practice. |
| `scripts/context-io.ts` `readGovernanceConfig` | ONE shared governance config-read path (default-on-absent, never throws) | ✓ VERIFIED | Single shared reader (line 1096+); hook and admit() both import it (OQ-3). Correct reader contract — but its fail-open-to-lean is consumed by the hook without a defensive gate-or-stricter, contributing to SC3. |
| `scripts/context-io.ts` `admit()` D-04 refusal | Refuse a high-severity finding lacking a `human:NAME` stamp under `human_admission != off`, never rewriting | ⚠️ PRESENT BUT INCOMPLETE | Fires correctly on a MISSING stamp (line 930), names the fault, never rewrites; correctly abstains under `off`/routine/stamped. BUT has no backstop for a FORGED `human:NAME` stamp — a self-authored `human:eve` passes, so when the hook is bypassed admit() admits. |
| `scripts/context-io.ts` `appendAuditLedger` (GOV-02) | `retained` → one fixed-key JSONL admission record; `git` → nothing; never the note body; separate from compaction (D-09) | ✓ VERIFIED | Lines 955-980: fixed key order {id,kind,by,severity,verified_by,disposed_by,at}, append-only, mkdir-on-demand, never the body, no compaction overlap. Ledger unit cases green. |
| `agent-factory/config/factory.config.json` + seed + `.md` twin | Two governance keys in 3-surface lockstep, lean defaults, D-09 distinction | ✓ VERIFIED | kit==seed byte-identical; lean defaults; twin documents both keys + the audit_retention vs compaction distinction; tighten-only / un-dialable-floor language present. |
| `scripts/floor-invariance.test.ts` | SC3 dial-value sweep (incl. garbage) over the four floor invariants + structural guarantee | ⚠️ NECESSARY-NOT-SUFFICIENT | Exists, 88 cases green — proves the four NAMED invariants hold at every value. BUT it asserts the structural guarantee at the admit() tier, not the HOOK tier; the hook's garbage-dial / corrupt-config fail-open is outside its sweep (the gap the independent red-team found). Per D-12 the green sweep is necessary-not-sufficient — the independent red-team is the gate, and it FOUND bypasses. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `admit()` | `readGovernanceConfig` | reads `human_admission` + `audit_retention` via the ONE shared path | ✓ WIRED | context-io.ts:926 — single read, no divergent second path. |
| `admit()` (retained) | `.grugops/audit/admissions.jsonl` | appends one JSONL event when `audit_retention === "retained"` | ✓ WIRED | context-io.ts:944-945 → appendAuditLedger. |
| `admission-guard.ts` | `readGovernanceConfig` | hook reads `human_admission` from the same shared path (resolved from `${CLAUDE_PROJECT_DIR}`) | ✓ WIRED | admission-guard.ts:173 — same reader the script tier uses (OQ-3 held). |
| `admission-guard.ts` matcher | a real Bash `admit` command | `ADMIT_SEGMENT` fires on a live admit verb | ✗ BROKEN | Misses subshell / `\`-continuation / `npx tsx` forms (under-match → bypass) AND fires on inert heredoc body lines (over-match → false-positive). The gate's input surface is incomplete in both directions. |
| `hooks/hooks.json` | `admission-guard.js` | second PreToolUse Bash matcher | ✓ WIRED | Confirmed in 25-02 summary; second matcher present beside the byte-frozen deploy guard. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `hooks/admission-guard.ts` | 83-84 | Regex-firewall matcher anchored on a bare `node` segment start; `\n` as a segment boundary | 🛑 Blocker | Three real admit launchers evade the gate (SC1); inert heredoc body lines false-positive (CR-01 inverse). Root cause: regex instead of shell-segment parsing. |
| `hooks/admission-guard.ts` | 169-180, 229 | Dead-code config try/catch + exact-string-only gate | 🛑 Blocker | Garbage/typo dial → off-equivalent ALLOW; corrupt config → `off` → ALLOW. The floor is bypassable by a dial value (SC3). |
| `scripts/context-io.ts` | 930 | D-04 fires only on a MISSING human stamp | ⚠️ Warning | No backstop for a forged `human:NAME` stamp; compounds the SC1 bypass when the hook is evaded. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| GOV-01 | 25-01, 25-02, 25-03 | `human_admission: off\|high-severity\|all`; named human disposes high-severity; mirrors the prod-deploy hook | ✗ BLOCKED | Config + hook + D-04 tier exist, but the un-forgeable gate is forgeable (three matcher bypasses + forged-stamp + dial fail-open). The human gate is not mechanically un-forgeable in practice. |
| GOV-02 | 25-01, 25-03 | `audit_retention: git\|retained`; 3-surface lockstep; lean defaults; floor unchanged | ✓ SATISFIED | 3-surface byte-identical lockstep, lean defaults, durable ledger under `retained`, nothing under `git`, never the note body, D-09 separation; the audit-retention dial itself meets its contract (the floor-unchanged clause is the SC3 concern carried under GOV-01's gate, not the audit dial). |

No orphaned requirements — REQUIREMENTS.md maps GOV-01/GOV-02 to Phase 25 and both appear in the plan frontmatter. (Note: REQUIREMENTS.md already marks GOV-01/GOV-02 `[x] Complete` and the traceability table shows `Complete` — this is the premature-complete pattern; the gaps below mean the phase is NOT complete and those marks should be reverted to in-progress until gap closure.)

### Floor Invariants (SC3 named-invariant detail — these HOLD)

| Invariant | Status | Evidence |
| --------- | ------ | -------- |
| 1. refuse-self still FAILs at every dial value | ✓ HOLDS | validate() refuse-self FAIL set (context-io.ts:576+) is dial-independent; floor sweep asserts it across all values incl. garbage. |
| 2. no-fabrication / never-rewrite holds | ✓ HOLDS | admit()'s D-04 and all refusals push a finding and NEVER rewrite the note (lines 930-938); sweep asserts note text unchanged on refusal. |
| 3. `quality.test_integrity` has no `off` | ✓ HOLDS | factory.config.md:70,130 — allowed `{warn, block}`, never `off` (TINT-03). Dial-independent. |
| 4. `hooks/guard.ts` byte-frozen (humans-hold-merge/deploy) | ✓ HOLDS | `git hash-object hooks/guard.ts` == `3501810e21308e4b7e219679a6ca30dace9b5d66`; `git diff --quiet` exit 0. Never touched (D-02). |

**The four NAMED invariants hold — but SC3's STRUCTURAL clause ("not bypassable by ANY dial setting") FAILS** because the hook's exact-string gate and the corrupt-config path are off-equivalent on non-canonical values (Gap 2). A floor invariant holding under canonical values is not the same as the floor being un-bypassable under every value.

### What Holds (verified PASS — for a balanced record)

- **SC2 fully met**: 25-01 config 3-surface byte-identical lockstep + lean defaults + the single shared `readGovernanceConfig` (OQ-3).
- **GOV-02 audit ledger** (25-03): `retained` → one fixed-key JSONL event; `git` → nothing; D-09 separation from compaction; never the note body.
- **The four NAMED floor invariants** hold at every dial value incl. garbage (refuse-self, no-fabrication/never-rewrite, `test_integrity` no-`off`, `guard.ts` byte-frozen `3501810e…`).
- **Self-set refusal (D-01)** is solid across all variants including the var already in env.
- **WR-01 foundation guard did NOT false-positive** on the closed deferral markers (28/28 green — scan set structurally excludes the closed-marker files).
- **Freshness**: 21 committed `.js` fresh, 0 drift; `hooks/guard.ts` byte-frozen.
- **Author suites green** (necessary-not-sufficient, D-12): floor-invariance + config-governance-consistency + admission-guard = 125 targeted tests green; full non-e2e ~611 green per the summaries.

### Gaps Summary

Two BLOCKING gaps prevent goal achievement, plus one secondary fail-safe defect:

1. **SC1 — GOV-01 human gate is forgeable (BLOCKER).** The admission-guard matcher misses three real admit launchers (subshell `( node …admit … )`, backslash-newline continuation, `npx tsx …admit …`) → the hook ALLOWs while the command admits the high-severity note. Compounded by admit()'s D-04 having no forged-`human:NAME`-stamp backstop. Net: a high-severity note is admitted with a forged human stamp and zero real human approval. Reproduced directly against the committed regex. Fix: replace the regex matcher with shell-segment parsing (catch `node`/`npx`/`tsx`/subshell/continuation, treat quoted/heredoc bodies as data) AND add a forged-stamp backstop so the hook stays the only path to a high-severity admit.

2. **SC3 — the floor IS bypassable by a dial value (BLOCKER).** The hook gates on exact `all`/`high-severity` only, so a typo/garbage/case/whitespace value falls through to ALLOW (off-equivalent), and a corrupt config makes `readGovernanceConfig` return `off` → ALLOW. A garbage `human_admission` must be treated as gate-or-stricter, never off-equivalent. Fix: the hook fails CLOSED (gate-or-stricter) on any non-`off` non-canonical value and on a corrupt/unreadable config.

3. **Input-surface false-positive (SECONDARY, fail-safe).** The matcher fires on an inert heredoc/multiline body line containing admit text → over-blocks doc-generation. Fix alongside the SC1 matcher rewrite (a real parser recognizes heredoc bodies as data).

These gaps are structured in the `gaps:` frontmatter for `/gsd-plan-phase 25 --gaps`. Per D-12 / [[grugops-safety-invariant-green-suite-insufficient]], the gap-closure must re-prove BOTH directions vs the newly committed `.js` (each evasion form flips to deny; the heredoc false-positive flips to allow) reproduced by an INDEPENDENT opus-grade red-team — not a green author suite.

---

_Verified: 2026-06-24T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
