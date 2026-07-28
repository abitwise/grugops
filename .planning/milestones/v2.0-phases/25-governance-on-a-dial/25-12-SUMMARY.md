# 25-12 SUMMARY — round-7 gap closure + independent red-teams (GAPS_FOUND, 12th catch)

**Plan:** 25-12 (round 7 — fix the round-6 channel defects GAP-R6-1/2/3)
**Outcome:** checkpoint 25-12-04 NOT approved → **gaps_found** (12th green-suite-insufficient catch). SC1 round-7 closure NOT declared. Phase 25 NOT complete; ROADMAP NOT flipped; GOV-01 NOT marked complete.

## What executed + held (tasks 1-3 — confirmed by orchestrator RED→GREEN + both red-teams)
- **GAP-R6-1 CLOSED** (`a9ce6ed`): a shared `writeNoteFile(notesDir, id, text)` containment chokepoint (`resolve(finalPath)` must start with `resolve(notesDir)+sep`, fail-closed) routed through by BOTH `appendNote` AND `emitVerdict`; co-primary `by`/`at` path-metacharacter reject in `validate()` (reserved `§14-gate` U+00A7 preserved). The round-6 `by:"x/../../../VICTIM/notes/INJECTED"` cross-task injection is refused across every writer; forged/precomputed id contained; legit + `§14-gate` notes still write.
- **GAP-R6-2 CLOSED** (`3ae14cb`): `trustedRepoRoot()` — hook + server both read `process.env.CLAUDE_PROJECT_DIR`; `repoRoot`/`contextRoot` removed from the `propose_note` inputSchema and inert. Off-mode W3-defeat + forged `disposed_by` gone.
- **GAP-R6-3 honest-scoped** (`62e2a8b`): SC1 + `disposed_by` + WF16 + context-note + the admission-guard/admission-server SOURCE COMMENTS all reconciled to the per-session-grant/per-note-capable model.
- Preserved: `guard.ts` byte-frozen, `liveTokens`=0, single-source `isGatedNote`, freshness 0, 737 non-e2e green. Executor hard-stopped at the blocking checkpoint without self-approving (correct).

## Checkpoint 25-12-04 — TWO independent bash-grounded red-teams (the D-12 gate) → GAPS_FOUND
The orchestrator dispatched two independent opus red-teams (+ self-reproduction) for the final closure. **RT-A found NO bypass.** **RT-B (blind, framed as a maximally-creative novel-hole hunt) BASH-GROUNDED a NEW channel bypass — the single red-team would have FALSE-PASSED.** ("Sometimes only one angle finds it.")

**GAP-R7-1 (decisive) — a high-severity finding admits through the sanctioned channel with the hook ALLOWing, NO env, NO human stamp (ledger mislabels `severity:routine`).** Two classifier divergences the round-7 "single-source" fix never unified (the signature "gate predicate narrower than the format/parser" class):
- **Lever 1 — `kind:"finding "` (trailing whitespace; `\t`/leading space too):** the hook (`admission-guard.js:146`) and `isGatedNote` (`context-io.js:1165`) raw-compare `kind !== "finding"` → treat it as a soft (non-finding) kind ⇒ hook ALLOW, not gated. But `parseNote` (`context-io.js:218`) trims → the store sees a real `finding`. Routes evaluation to admit()'s non-gated path.
- **Lever 2 — `by:"security- nfr"` (internal space):** `isHighSeverityRole` (NFKC + strip-all-whitespace) → high-sev TRUE; admit()'s FROZEN D-04 `.trim().toLowerCase()` (`context-io.js:877`, edges only) → FALSE. The byte-freeze on `admit()` is the TRAP — it froze a strictly-weaker classifier that becomes the sole high-sev defense once Lever 1 routes around the strong gate.
- `verified_by:§14-gate#<id>` is satisfied by any real green verdict. Orchestrator-CONFIRMED both divergences. Under dial `all`, Lever 1 alone admits ANY finding.

## Round 8 (the round-8-Phase-22 terminal lesson, applied fully — ONE format-aware classifier authority)
1. Canonicalize/trim `kind` (or consult `parseNote`'s trimmed kind) before the `=== "finding"` comparison in BOTH `admission-guard.js` AND `isGatedNote`.
2. Make `admit()`'s D-04 use the single-source `isHighSeverityRole` — **requires UNFREEZING `admit()`** (a human safety-posture call, surfaced to the user; the freeze is the trap).
3. Optionally enforce the `kind` enum at the server boundary (the `propose_note` inputSchema declares it but the server forwards `args.kind` raw).
4. Re-prove with ≥2 independent bash-grounded opus red-teams (one false-passed this round).

_Authored 2026-06-28 by the orchestrator from the RT-B reproduction + self-confirmation (no-fabrication: checkpoint not approved; verdict authored from the reproduced bypass, not a green suite or RT-A's clean pass)._
