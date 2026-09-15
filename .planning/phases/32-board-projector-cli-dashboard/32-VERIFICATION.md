---
phase: 32-board-projector-cli-dashboard
verified: 2026-09-15T18:00:00Z
status: gaps_found
score: 2/5 must-haves verified
covered_files: [".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/phases/32-board-projector-cli-dashboard/32-01-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-01-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-02-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-02-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-03-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-03-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-04-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-04-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-05-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-05-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-06-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-06-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-07-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-07-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-08-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-08-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-09-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-09-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-10-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-10-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-11-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-11-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-12-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-12-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-13-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-13-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-14-ADVERSARIAL-REVIEW.md", ".planning/phases/32-board-projector-cli-dashboard/32-14-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-14-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-15-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-15-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-16-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-16-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-17-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-17-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-18-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-18-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-19-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-19-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-20-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-20-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-21-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-21-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-22-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-22-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-23-ADVERSARIAL-REVIEW.md", ".planning/phases/32-board-projector-cli-dashboard/32-23-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-23-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md", "agent-factory/contracts/board.md", "scripts/board-dashboard.js", "scripts/board-dashboard.test.ts", "scripts/board-dashboard.ts", "scripts/board-model.js", "scripts/board-model.test.ts", "scripts/board-model.ts", "scripts/board-read.js", "scripts/board-read.test.ts", "scripts/board-read.ts", "scripts/board-readonly.test.ts", "scripts/board-tracer.test.ts", "scripts/board-watch-live.test.ts", "scripts/board-watch.test.ts", "scripts/check-foundation-guards.test.ts", "scripts/js-import-closure.ts", "scripts/validate-agent-factory.js", "scripts/validate-agent-factory.ts", "scripts/validate.test.ts"]
covered_digest: "v1:sha256:1c41f5e29c06e065f4d246ea972d751914c904e44720e654b4e4ff11212352eb"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "Round-1 gap 1 (grammar-refused-but-readable ticket fabricating `row-without-file`) — independently reproduced CLOSED: `actual` now reads `plans/tickets/ABC-900.md exists and the reader could not admit it (unknown-key)` with a `readErrors` entry naming the code"
    - "Round-1 gap 2 (DASH-06 guard green over `node:v8` writer and over a runtime-assembled `node:fs` identity) — independently reproduced CLOSED: both plants now exit 1 against `check:dashboard-readonly` (6 failed/89 and 4 failed/89 respectively)"
    - "Round-1 gap 3 (raw C1 code points surviving into `--json` stdout) — independently reproduced CLOSED: 0 control code points recovered from the captured `--json` document after planting U+009B/U+009D in a ticket title"
    - "Original CR-01 (namespace-destructure bypass), CR-04 (symlink leak), CR-06 (second ticket-frontmatter authority) — spot-checked, still closed, no regression"
  gaps_remaining:
    - "DASH-03 'surfaces disagreement... rather than silently resolving it' now fails a NEW way, independently reproduced: a ticket file that is admitted (parses cleanly, zero readErrors) but declares an `id` different from its file stem still produces a fabricated `row-without-file` conflict claiming no file carries the row's identifier, while that exact file is sitting on disk and was read successfully. This is 32-REVIEW.md's CR-03 / the round's own adversarial self-review's F-06, reached one population over from the fix that closed round-1's gap 1 (which only covers grammar-*refused* entries, keyed by stem; this is an *admitted* entry keyed by a declared id other than its stem)."
    - "DASH-04/DASH-05's watch-arming layer fails a NEW way, independently reproduced: the reader's `OUTSIDE_ROOT` refusal is raised per directory ENTRY (one symlinked ticket file, one symlinked claimed-task directory), but the dashboard's watch-arm consumes it as a refusal of the whole SOURCE — so one escaping entry silently un-arms every watch directory sharing that source (all of `plans/tickets` on a ticket-file symlink; all three queue stages — `pending`, `claimed`, `done` — on a queue-task symlink), with nothing recorded on any channel (`loop.watchErrors()` stays empty). Separately, and independently reproduced: the same refusal early-return never clears a pre-existing watch-failure record, so a genuine earlier watch failure (e.g. ENOSPC) becomes a PERMANENT, false `readErrors`/stderr claim ('it will be re-armed on the next poll tick') that outlives the condition it describes, for the life of the process. This is 32-REVIEW.md's CR-01 and CR-02."
    - "DASH-06 'proves its module tree holds no mutating node:fs symbol' is STILL false, via two NEW routes past the very allow-list that closed round-1's gap 2. (1) A writer module reached through an ABSOLUTE-path import specifier (`import { w } from \"/abs/path/writer.mjs\"`) is invisible to both the bare-specifier allow-list (it does not start with `.` or start-with-neither-prefix logic treats it as 'bare' inconsistently with the closure walker, which only follows `.`-relative specifiers) — independently reproduced: guard exits 0, 89/89, over a module that creates an arbitrary file, survives a full `tsc` build and `check:build-parity` by construction. (2) Reaching `process.report.writeReport` through an intermediate binding (`const r = process.report; r.writeReport(p)`) reds only the census equality/count, never the acquisition-mechanism case, so the maintainer-facing fix the failing test suggests — add `\"process.report\"` to the allow-list and bump the count — independently reproduced to fully re-green the guard (89/89) over a module that still writes an arbitrary file. This is 32-REVIEW.md's WR-01/WR-02 (the round's own self-review's F-04/F-08)."
  regressions: []
gaps:
  - truth: "One typed FactorySnapshot joins board, ticket frontmatter, queue state, context notes, and traceability, and surfaces board-vs-frontmatter disagreement in conflicts[] rather than silently resolving it (DASH-03)."
    status: failed
    reason: "Independently reproduced against the current tree, on a copy of scripts/fixtures/board-snapshot/ with a board row [ABC-901] and plans/tickets/ABC-901.md declaring `id: ABC-902` (a document that parses cleanly and is admitted — zero tickets readErrors). --once --json produces {\"kind\":\"row-without-file\",\"ticketId\":\"ABC-901\",\"expected\":\"plans/tickets/ABC-901.md\",\"actual\":\"no ticket file carries that identifier\"} under a plain-text [ok] header with no stale badge, while plans/tickets/ABC-901.md exists, is readable, and was parsed successfully. Confirmed by direct code reading of scripts/board-model.ts:1291-1299: the join's presence question is answered from two maps — ticketById, keyed by the document's DECLARED id, and unadmittedById, keyed by the STEM of entries the grammar REFUSED — and a document admitted under a declared id that differs from its own stem falls into neither map, so the 'no ticket file carries that identifier' sentence is asserted about a file that is on disk and was read without error. This is CLAUDE.md's no-fabrication rule violated on the conflicts[] surface DASH-03 introduces, for a third population the round's own fix (which covers only refused entries) does not reach."
    artifacts:
      - path: "scripts/board-model.ts"
        issue: "joinSnapshot's row-without-file derivation (unadmittedById, keyed by file stem, vs ticketById, keyed by declared id) has no population for 'admitted, but under a different declared id than its stem' — that identifier's presence question is answered as absence"
      - path: "scripts/board-read.ts"
        issue: "ticketStem's fallback-identity docblock states it is used only 'when the document states no id', so the stem is not carried alongside a declared id for an admitted record, leaving the join no way to recognize this shape"
    missing:
      - "Carry both the file's stem and its declared id on every admitted TicketRecord, derive a byStem lookup on the admitted population the same way unadmittedById already derives one on the refused population, and state the honest sentence when a stem match exists under another id (e.g. 'plans/tickets/ABC-901.md exists and declares the identifier ABC-902') instead of asserting absence; add a board-read.test.ts / board-model.test.ts case planting exactly this id/stem mismatch and asserting zero row-without-file conflicts whose actual claims absence for it"
  - truth: "The dashboard follows a live run using directory-level fs.watch plus a mandatory polling floor and debounce, never renders a torn read, a partial parse, or an ENOENT as an empty board — a stale snapshot shows a visible stale badge over the last good read (DASH-04, DASH-05)."
    status: failed
    reason: "Independently reproduced twice against the current tree, driving the real createLoop/run with only watch injected. (1) A single symlinked plans/tickets/ZZZ-999.md pointing outside the repository root: armed directories after the first read are [plans, .grugops/queue/claimed, .grugops/context] — plans/tickets is MISSING from the armed set even though it exists, is readable, and is fully inside the root; loop.watchErrors() is empty, so nothing on any channel says the low-latency watch path for tickets is down. A symlinked .grugops/queue/claimed/escaped-task directory produces the same shape one level up: armed = [plans, plans/tickets, .grugops/context] — ALL THREE queue-stage watches (pending, claimed, done) are missing, though pending and done are ordinary readable empty directories with nothing to do with the escaping entry. Confirmed by direct code reading of scripts/board-dashboard.ts:900-978: refusedSources is a Set<SourceName> built from every OUTSIDE_ROOT readError's source field, and OUTSIDE_ROOT is raised PER ENTRY (one ticket file, one claimed-task directory) but consumed in arm() as a refusal of the WHOLE source — and multiple WatchDir entries (the three queue stages) share one SourceName. (2) Separately, and independently reproduced with an injected watch() that throws once then stops throwing: the containment-refusal early return at board-dashboard.ts:975-978 is the only one of arm()'s three early-return paths that does NOT call watchErrorsByDir.delete(rel) (contrast the !exists arm at :999 and the successful-rearm arm at :1022) — so a genuine watch failure recorded before an entry starts escaping (e.g. transient ENOSPC) leaves its stale, now-false record ('it is closed and will be re-armed on the next poll tick') permanently in loop.watchErrors(), which emit() merges into every published readErrors document and every stderr frame for the rest of the process's life, even after the underlying watch() call would once again succeed."
    artifacts:
      - path: "scripts/board-dashboard.ts"
        issue: "refusedSources (board-dashboard.ts:900-919) is keyed by SourceName rather than by the specific directory the reader's readError names, so a per-entry OUTSIDE_ROOT refusal silently un-arms every WatchDir sharing that source; the containment early return in arm() (:975-978) is also the one early-return path that never clears watchErrorsByDir, so a pre-existing watch-failure record for that directory survives indefinitely once the containment refusal starts firing"
    missing:
      - "Narrow the signal consumed in arm() to the specific directory a watch handle would be opened on (e.g. compare against relative(repoRoot, e.path) rather than e.source), and add watchErrorsByDir.delete(rel) to the containment early return for the reason the !exists arm already states; add a board-watch.test.ts converse case planting a symlinked ENTRY (not a whole linked directory) inside an otherwise-ordinary plans/tickets and inside .grugops/queue/claimed, asserting the sibling watch(es) stay armed, plus a case driving a watch failure then a containment refusal and asserting loop.watchErrors() is empty"
  - truth: "The dashboard CANNOT write: an import-graph guard proves its module tree holds no mutating node:fs symbol (DASH-06)."
    status: failed
    reason: "Independently reproduced twice against the current tree — both routes NEW this round, past the allow-list that closed round-1's node:v8/runtime-assembled-identity gap. (1) Appending `import { w } from \"/private/.../outside/writer.mjs\"; export const wA = (p) => w(p);` to the committed scripts/board-read.js, where writer.mjs is an ordinary two-line module outside the repository calling node:fs's writeFileSync, yields `npm run check:dashboard-readonly` -> exit 0, 89 passed (89) — the guard is fully green. The export was then invoked directly and independently confirmed to create an arbitrary file with attacker-controlled content. This also passes tsc --noEmit and npm run build with the import moved into board-read.ts, and check:build-parity is satisfied by construction (the emitted .js carries the specifier verbatim), so this is not bounded by round 1's 'must also survive a rebuild' argument. (2) Appending `const r = process.report; export const wB = (p) => r.writeReport(p);` reds only 3 of 89 cases (the two-sided census equality/count and one positive-control), never the `PREMISE: no closure module acquires a module by a route that is not a static literal import` case — the actual write-detection mechanism. Applying the exact edit the failing assertion's message asks for (add \"process.report\" to EXPECTED_GLOBAL_MEMBER_PATHS, move the count 10 -> 11) was independently applied and re-greens the guard to 89/89 while the planted writer remains present and callable."
    artifacts:
      - path: "scripts/board-readonly.test.ts"
        issue: "isBareSpecifier (module-identity allow-list subject) classifies by testing for the ABSENCE of '.' and '/' prefixes, while js-import-closure.ts's relativeSpecifiers (the closure-follow subject) only follows specifiers starting with '.' — an absolute-path specifier belongs to neither set, so it is neither censused nor walked. Separately, collectAcquisitions arm 3 only records a capability-global member-path acquisition when the maximal path is itself a CALL EXPRESSION's callee; a member path read into a variable binding first (const r = process.report) is invisible to that arm, so recording the member name in the two-sided allow-list is a single edit that satisfies the census without the acquisition mechanism ever having reasoned about the binding"
    missing:
      - "Census the specifier of every import/export-from/dynamic-import into a total three-way partition (bare / relative / everything else) and refuse the third bucket by construction, the way opaqueSpecifiers already refuses a non-literal specifier; separately, treat a read of a capability-global member path into any binding (VariableDeclaration, BindingElement, PropertyAssignment, array literal, or passed as a call argument) as a non-admitted acquisition, applying arm 4's existing root-binding rule one level down to member paths"
    reason_advisory: "A third, lower-severity caveat on the otherwise-verified truth 5 (DASH-07/DASH-08) is recorded for completeness though it does not flip that truth's status, matching this project's own convention for the analogous round-1 finding: independently reproduced, a raw C0 control character (ESC, BEL) planted in a board row title produces 0 raw control code points in the captured --json stdout document (the sanitizer's own measure is satisfied), but ONE JSON.parse of that same document recovers the raw ESC and BEL characters verbatim, because JSON.stringify escapes C0 into printable six-character sequences (\\u001b) before sanitizeCell ever sees the string, and sanitizeCell only strips literal control bytes, not their escaped textual form. This is 32-REVIEW.md's WR-04 / the round's own self-review's F-05, and it means the module's own 'every string that reaches either channel goes through sanitizeCell' claim is true of raw bytes on the wire but not of what a --json consumer recovers after parsing."
deferred: []
advisory:
  - finding: "The single-ticket-frontmatter-authority census (scripts/validate.test.ts) is defeated by a second reader assembling its key names via Array.prototype.join (e.g. [\"c\",\"o\",\"l\",\"u\",\"m\",\"n\"].join(\"\")) combined with a split/indexOf scan instead of a regex or string literal — this was not independently re-executed by this verifier this round (it was measured live by both 32-REVIEW.md's WR-03 and the round's own 32-23-ADVERSARIAL-REVIEW.md's A3, both dated the same day as this verification, with a concrete corpus plant and a 'census reports 1, exit 0' result), but is corroborated by direct reading of the census's own TEXT_SCAN_PRIMITIVES enumeration in scripts/validate.test.ts, which does not include join, replace, replaceAll, matchAll, search, or slice. No live second ticket-frontmatter authority exists on the tree today; this is a detection-robustness residual in the proof, not a live second authority, so it remains advisory rather than a gap against DASH-01/DASH-02, consistent with round 1's disposition of the equivalent finding."
    category: architectural
    reason: "32-REVIEW.md's WR-03 (a re-opening of round-1's WR-01/advisory) and the round's own self-review's A3, corroborated by direct reading of the enumerated primitive list. The census's discrimination corpus still only plants a few ordinary rewrites rather than deriving the primitive set as a refused complement, a class this project has paid for repeatedly (P29/P31 in project history)."
    evidence_status: "not independently re-executed this round; corroborated by direct code reading and by two independent same-day measurements (32-REVIEW.md, 32-23-ADVERSARIAL-REVIEW.md) with concrete reproduction transcripts"
behavior_unverified_items: []
coincidental_reliance_items: []
---

# Phase 32: Board Projector & CLI Dashboard Verification Report

**Phase Goal:** The operator watches the factory live from one read-only terminal view, fed by a single board-grammar authority whose typed snapshot a future web renderer could consume unchanged.
**Verified:** 2026-09-15T18:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — gap-closure round 2 (plans 32-15..32-23), re-testing `32-VERIFICATION.md`'s round-1 `gaps_found` (3/5) verdict. Phase has now used 2 of its 4-round gap-closure cap; two rounds remain per the project's own recorded rule (established after Phase 31).

## Goal Achievement

### Method

Every reproduction below was run independently by this verifier against the current committed tree
(build parity confirmed first: `npm run build && npm run check:build-parity` → exit 0, no tracked
`.js` moved), not copied from `32-REVIEW.md` or `32-23-ADVERSARIAL-REVIEW.md`. Those two documents
were read first and used to target where to probe — per this project's own instruction and its own
recorded lesson that a green suite, and even a careful self-review, is not proof of a safety
invariant — but every transcript below is this verifier's own run, on disposable fixtures under
`/private/tmp/.../scratchpad/verify32`, outside the repository root. Every probe that touched a
tracked file (`scripts/board-read.js`, `scripts/board-readonly.test.ts`) was restored from a
backup copy and confirmed clean with `git diff --exit-code` before the next probe began.

**Premise check:**
```
$ npm run build && npm run check:build-parity
tsc — no diagnostics
Build parity: no tracked build output moved when tsc ran.
```

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `board-model.ts` is the ONLY board grammar; column-heading parser extracted/deleted from `validate-agent-factory.ts`; row/WIP grammars pinned by spec + fuzz suite (DASH-01, DASH-02) | ✓ VERIFIED (caveat) | `frontMatter()`/`FrontMatter` confirmed absent from `validate-agent-factory.ts` (`grep -c` → 0); `checkTickets()` still routes through `parseTicketDocument` (line 736). Caveat, not independently re-executed this round but corroborated by direct code reading and two independent same-day measurements: the "exactly one ticket-frontmatter reader" census is still defeated by an `Array.join`-assembled key spelling (advisory, no live second authority on the tree today). |
| 2 | One typed `FactorySnapshot` joins board, ticket frontmatter, queue, context, traceability, and surfaces disagreement in `conflicts[]` (DASH-03) | ✗ FAILED | Independently reproduced: an ADMITTED ticket file (zero `readErrors`) whose declared `id` differs from its file stem still produces a fabricated `row-without-file` conflict claiming no file carries that identifier, while the file is on disk and was read without error. Round 1's fix for the analogous *refused*-entry shape does not reach this *admitted*-under-another-id shape. See gap 1. |
| 3 | Directory-level `fs.watch` + mandatory poll + debounce; never renders a torn read, partial parse, or ENOENT as an empty board — stale snapshot shows a visible stale badge (DASH-04, DASH-05) | ✗ FAILED | Round 1's three reproductions (EACCES, torn UTF-8 byte, symlink escape) and this round's own closed sibling-arm fabrication (grammar-refused ticket) are all independently confirmed CLOSED. But two NEW, independently reproduced failures keep this truth failed: (a) a single symlinked entry (one ticket file, or one claimed-task directory) silently un-arms every watch directory sharing that entry's SOURCE, with nothing recorded anywhere; (b) a genuine watch failure's record is never cleared by the containment-refusal early return, so a stale, false "will be re-armed" claim can persist for the life of the process. See gap 2. |
| 4 | The dashboard CANNOT write: import-graph guard proves no mutating `node:fs` symbol reachable (DASH-06) | ✗ FAILED | Round 1's `node:v8`/runtime-assembled-identity bypasses are independently confirmed CLOSED by this round's allow-list inversion. But two NEW, independently reproduced bypasses of that very allow-list remain: an absolute-path import specifier is invisible to both the allow-list and the closure walker (guard green, 89/89, over a module that creates an arbitrary file); and a capability-global member path reached through a variable binding reds only the census count, not the write-detection mechanism, so recording the member name in the allow-list — the fix the failing test itself suggests — silently re-greens the guard over a live writer. See gap 3. |
| 5 | `--json`, `--once`, non-TTY modes work; renderer degrades visibly; snapshot shape stable; zero runtime deps; no listening socket (DASH-07, DASH-08) | ✓ VERIFIED (caveat) | Confirmed live: `--once --json` from a non-TTY pipe produces one parseable document with `schemaVersion: 1`; `--once` exits 0; `package.json` has no `dependencies` key. Round 1's C1-in-stdout finding is independently confirmed CLOSED (0 control code points recovered from captured stdout after planting U+009B/U+009D). Caveat, independently reproduced: a raw C0 control character (ESC, BEL) planted in a ticket title produces 0 raw bytes on the wire but is recoverable, unsanitized, by one `JSON.parse` of the captured document — the serializer turns it into printable escaped text before the sanitizer ever sees it. Not one of the five numbered roadmap truths verbatim; recorded as a caveat rather than a truth failure, consistent with this project's own treatment of the analogous round-1 finding. |

**Score:** 2/5 truths verified (down from round 1's 3/5 — see "Why the score went down" below)

### Why the score went down despite real, independently-confirmed closures

This round closed real ground: all three of round 1's gaps (grammar-refusal fabrication,
`node:v8`/runtime-identity DASH-06 bypasses, C1-in-stdout) are independently reproduced CLOSED
against the current tree, and the full suite grew from 74/4811 to 75/4974 with nothing missing.
But every one of this round's own fixes reopened the identical failure class **one register over**,
exactly as this project's own recorded history predicts (P22, P23, P25, P27, P29, P31 all show the
same shape): the CR-03/F-06 fix for a *refused* entry does not cover an *admitted* entry under
another declared id; the CR-01/CR-02 containment fix asks the right question (`OUTSIDE_ROOT`) but
at the wrong granularity (source, not directory) and leaks a record its own sibling arm clears; the
WR-01/WR-02 allow-list inversion for DASH-06 is the right posture but its subject (`bareSpecifiers`,
callee-position member paths) is a syntactic complement rather than a total partition, so an
absolute-path specifier and a member-path binding both fall outside every arm. Truth 2 (DASH-03),
which round 1 scored as "verified with a caveat attributed to the DASH-05 gap," is now independently
confirmed to fail on its **own** terms — a pure join-logic defect with zero read errors involved,
unrelated to any filesystem degradation. That is why the headline score moved from 3/5 to 2/5 even
though round 2 produced the largest closure of any round in this phase.

### Independent Reproduction Transcripts (this verifier's own runs)

**CR-03 / F-06 (DASH-03, gap 1) — CONFIRMED OPEN.** Board row `[ABC-901]` plus
`plans/tickets/ABC-901.md` declaring `id: ABC-902`:
```
$ node scripts/board-dashboard.js <tree> --once --json | jq '.readErrors, (.conflicts[]|select(.ticketId=="ABC-901"))'
[]  # zero readErrors for tickets — the file was read and parsed successfully
{"kind":"row-without-file","ticketId":"ABC-901","column":"Blocked",
 "expected":"plans/tickets/ABC-901.md","actual":"no ticket file carries that identifier"}
$ node scripts/board-dashboard.js <tree> --once
... [ok]  11 conflicts        # no stale badge; the false claim is under a plain "ok" header
```
Confirmed by direct read of `scripts/board-model.ts:1291-1299`: `ticketById` keyed by declared `id`,
`unadmittedById` keyed by stem of *refused* entries only — an admitted entry under a non-matching
declared id belongs to neither map.

**CR-01 (DASH-04/05, gap 2, part 1) — CONFIRMED OPEN.** Driving the real `run`/`createLoop` with only
`watch` injected, over a copy of the fixture:
```
# one symlinked TICKET FILE: ln -s $OUT/secret.txt tree/plans/tickets/ZZZ-999.md
armed dirs:  [ plans, .grugops/queue/claimed, .grugops/context ]   # plans/tickets MISSING
readErrors:  tickets:OUTSIDE-ROOT (per-entry)
loop.watchErrors(): []                                              # nothing recorded anywhere

# one symlinked TASK DIRECTORY: ln -s $OUT tree/.grugops/queue/claimed/escaped-task
armed dirs:  [ plans, plans/tickets, .grugops/context ]            # ALL THREE queue stages MISSING
readErrors:  queue:OUTSIDE-ROOT (per-entry)
loop.watchErrors(): []
```
Confirmed by direct read of `scripts/board-dashboard.ts:900-919,967-978`: `refusedSources` is a
`Set<SourceName>` built from every `OUTSIDE_ROOT` error's `source` field; three `WatchDir` entries
(`pending`, `claimed`, `done`) share `source: "queue"`.

**CR-02 (DASH-04/05, gap 2, part 2) — CONFIRMED OPEN.** Driving `createLoop` directly with an
injected `watch()` that throws once (`ENOSPC`) then stops throwing, and a `refresh()` in between that
makes `readErrors` report an `OUTSIDE_ROOT` refusal for the same source:
```
after first arm attempt, watchErrors: [{"path":"plans/tickets","code":"watch",
  "message":"the watch on plans/tickets failed (ENOSPC...). It is closed and will be re-armed
  on the next poll tick..."}]
after refresh (ENOSPC condition now gone, tickets now refused instead), watchErrors: [SAME RECORD,
  UNCHANGED]
```
Confirmed by direct read of `scripts/board-dashboard.ts:967-978`: the containment early return is the
only one of `arm()`'s three early-return paths (compare `:995-1000` and `:1018-1022`) that never
calls `watchErrorsByDir.delete(rel)`.

**WR-01 / F-04 (DASH-06, gap 3, part 1) — CONFIRMED OPEN.** Appended to the committed
`scripts/board-read.js`:
```
import { wA } from "/private/.../outside/writer.mjs";   // an ordinary two-line module, writeFileSync
export const wA_export = (p) => wA(p);
```
`npm run check:dashboard-readonly` → **89 passed (89)**, exit 0. The export was then invoked and
independently confirmed to create `PWNED.txt` with attacker-controlled content. File restored,
`git diff --exit-code -- scripts/board-read.js` clean.

**WR-02 / F-08 (DASH-06, gap 3, part 2) — CONFIRMED OPEN.** Appended to the committed
`scripts/board-read.js`:
```
const r = process.report;
export const wB = (p) => r.writeReport(p);
```
Step 1: `npm run check:dashboard-readonly` → **3 failed | 86 passed (89)** — the census equality,
count, and one positive control fail; `PREMISE: no closure module acquires a module by a route that
is not a static literal import` stays GREEN. Step 2: applied the exact edit the failing message
suggests (`"process.report"` added to `EXPECTED_GLOBAL_MEMBER_PATHS`, count `10 → 11`) →
`npm run check:dashboard-readonly` → **89 passed (89)**, exit 0, with the writer still present and
callable. Both files restored, `git diff --exit-code -- scripts/` clean.

**F-05 (DASH-07/08, caveat) — CONFIRMED OPEN.** Raw `ESC`/`BEL` planted in a board row title:
```
control code points in the raw --json document:      []          # sanitizer's measure satisfied
control code points recovered by ONE JSON.parse:      U+001b, U+0007
```

**Regression spot-checks (no regression found):**
```
$ # original CR-01 namespace destructure, replanted verbatim
npm run check:dashboard-readonly → 5 failed | 84 passed (89), exit 1     — still closed
$ grep -c 'frontMatter\|FrontMatter' scripts/validate-agent-factory.ts scripts/validate-agent-factory.js
0  0                                                                      — CR-06 still closed
$ npx vitest run --exclude '**/scripts/e2e/**'
75 files, 4974 passed, 2 skipped, exit 0                                 — full suite green
$ git status --short
 M .planning/milestone.lock   M human-notes.txt   ?? .gsd/   ?? .planning/state.json
  (pre-existing, unrelated to this phase; git diff --exit-code -- scripts/ agent-factory/ docs/ clean)
```

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/board-model.ts` (+`.js`) | Pure board/ticket grammar, no `node:fs`, single authority | ⚠️ HOLLOW (partial) | Grammar core and single-authority claim hold; `joinSnapshot`'s presence partition (`ticketById`/`unadmittedById`) is not total over admitted-under-another-id entries — see gap 1 |
| `scripts/board-read.ts` (+`.js`) | fs-touching read-verify-reread seam | ✓ VERIFIED | All read-path fabrication findings (EACCES, torn byte, symlink, grammar-refusal) independently confirmed closed this round and last |
| `scripts/board-dashboard.ts` (+`.js`) | CLI renderer, TTY/non-TTY/json/watch, sanitized output | ⚠️ HOLLOW (partial) | stdout C1 chokepoint confirmed closed; watch-arm containment logic (`refusedSources`, `arm()`) is not granular enough and leaks stale records — see gap 2; C0-via-parse caveat open |
| `scripts/board-readonly.test.ts` | Mechanical no-write guard | ✗ FAILED (bypassable) | Allow-list inversion closed the round-1 bypasses; two new routes (absolute specifier, member-path binding) independently confirmed open — see gap 3 |
| `scripts/validate-agent-factory.ts` (+`.js`) | Imports board-model, no second grammar | ✓ VERIFIED | `frontMatter()` confirmed absent; routed through `parseTicketDocument` |
| `agent-factory/contracts/board.md` | Normative spec | ✓ VERIFIED | Referenced consistently across this round's findings; no new contradiction found |
| `scripts/fixtures/board-snapshot/expected-snapshot.json` | Golden fixture | ✓ VERIFIED | Pristine-fixture run (`9 conflicts`) matches the golden's conflict set |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `scripts/board-dashboard.ts` | `scripts/board-read.ts` | `readSnapshot()` call in `refresh()` | ✓ WIRED | Confirmed by live runs across every reproduction above |
| `scripts/board-read.ts` | `scripts/board-model.ts` | `joinSnapshot()`/`parseBoard()`/`parseTicketDocument()` | ⚠️ WIRED BUT INCOMPLETE | The tickets-source-state signal is complete for refusals, incomplete for admitted-under-another-id (gap 1) |
| `scripts/board-dashboard.ts` (watch arm) | `scripts/board-read.ts` (`OUTSIDE_ROOT`) | `refusedSources` set built from `readErrors` | ⚠️ WIRED BUT WRONG GRANULARITY | One containment authority (good), consumed at the wrong grain — per-source instead of per-directory (gap 2) |
| `scripts/validate-agent-factory.ts` | `scripts/board-model.ts` | `parseTicketDocument`/`boardColumnName`/`boardHasColumn`/`kebab`/`parseBoard` imports | ✓ WIRED | Single authority confirmed |
| `scripts/board-readonly.test.ts` | `scripts/board-dashboard.js` closure | `jsImportClosure` AST walk + `ALLOWED_BUILTIN_SPECIFIERS` allow-list | ⚠️ WIRED BUT INCOMPLETE | Namespace/deny-list routes closed; absolute-specifier and member-path-binding routes remain — see gap 3 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build is a faithful build of its sources | `npm run build && npm run check:build-parity` | exit 0, no tracked `.js` moved | ✓ PASS |
| `--once --json` prints one parseable JSON document | `node scripts/board-dashboard.js t1 --once --json \| jq .` | valid single document | ✓ PASS |
| `--once` exits 0 with conflicts present | `node scripts/board-dashboard.js t1 --once; echo $?` | `0` | ✓ PASS |
| Original namespace-destructure bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 1, 5 failed | ✓ PASS (no regression) |
| Grammar-refused-but-present ticket does not fabricate `row-without-file` | added row + unknown-key ticket + `--once --json` | honest sentence naming the file and refusal code | ✓ PASS (round-1 gap 1 closed) |
| `node:v8` / runtime-assembled-identity bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 1 in both cases | ✓ PASS (round-1 gap 2 closed) |
| C1 control code points excluded from `--json` stdout | CSI/OSC in ticket title + `--once --json` | 0 control code points | ✓ PASS (round-1 gap 3 closed) |
| Admitted ticket with id ≠ stem does not fabricate `row-without-file` | id/stem mismatch fixture + `--once --json` | fabricated `row-without-file`, zero readErrors | ✗ FAIL (NEW — gap 1) |
| Symlinked entry inside a watched directory does not un-arm the whole source | symlinked ticket file / claimed-task dir + injected watch | sibling directories (plans/tickets; pending, done) silently un-armed | ✗ FAIL (NEW — gap 2) |
| A cleared containment condition re-arms the watch and clears its record | inject watch failure, then simulate containment refusal, then clear it | stale record never cleared | ✗ FAIL (NEW — gap 2) |
| Absolute-path specifier writer bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 0, 89/89 | ✗ FAIL (NEW — gap 3) |
| Member-path-binding writer bypass of DASH-06 guard | plant + apply suggested allow-list fix + `npm run check:dashboard-readonly` | exit 0, 89/89, writer still live | ✗ FAIL (NEW — gap 3) |
| C0 control code points excluded from a `--json` consumer after parsing | ESC/BEL in ticket title + `--once --json` + `JSON.parse` | 0 raw, but 2 recovered by one `JSON.parse` | ✗ FAIL (NEW — caveat on truth 5) |
| Full suite green | `npx vitest run --exclude '**/scripts/e2e/**'` | 75 files, 4974 passed, 2 skipped | ✓ PASS (does not detect any FAIL row above — the project's "green suite is not proof" lesson holds a further time) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DASH-01 | 32-01, 32-08, 32-12, 32-16, 32-21 | Single board-grammar authority | ✓ SATISFIED (caveat: advisory census-defeat) | `frontMatter()` confirmed deleted; census still has a stated blind spot, no live second authority |
| DASH-02 | 32-01, 32-02, 32-04, 32-12, 32-16, 32-21 | Written spec + parse-oracle fuzz suite | ✓ SATISFIED | Unaffected by this round's findings |
| DASH-03 | 32-01, 32-03, 32-05, 32-09, 32-10, 32-15, 32-17, 32-23 | Typed `FactorySnapshot` joining 5 sources, `conflicts[]` | ✗ BLOCKED | Gap 1: id/stem mismatch fabricates absence against an admitted, on-disk file |
| DASH-04 | 32-03, 32-09, 32-15, 32-19, 32-22 | `fs.watch` + mandatory poll + debounce | ✗ BLOCKED | Gap 2: per-entry refusal silently un-arms whole-source watches; stale watch record never cleared |
| DASH-05 | 32-03, 32-07, 32-09, 32-10, 32-15, 32-17, 32-19, 32-22 | Torn/ENOENT/permission never render as empty; stale badge | ✗ BLOCKED | Gap 2 (watch-arming failures are silent, defeating the low-latency path the stale badge depends on) plus gap 1's fabrication surface |
| DASH-06 | 32-06, 32-11, 32-20, 32-21 | Mechanical read-only guard | ✗ BLOCKED | Gap 3: absolute-path specifier and member-path-binding bypasses, both independently confirmed live |
| DASH-07 | 32-01, 32-07, 32-13, 32-18 | `--json`/`--once`/non-TTY modes, visible degradation | ✓ SATISFIED (caveat) | Live spot-checks pass; C0-via-`JSON.parse` caveat open (F-05) |
| DASH-08 | 32-01, 32-02, 32-05, 32-06, 32-08, 32-11, 32-13, 32-17, 32-18, 32-20 | Stable snapshot shape, zero runtime deps, no socket | ✓ SATISFIED | `package.json` confirmed dependency-free (`devDependencies` only: `@types/node`, `typescript`, `vitest`) |

REQUIREMENTS.md currently marks all eight `[ ]` Not complete / "Gaps Found" — accurate to this
verification's findings. No orphaned requirements: all eight IDs are claimed by at least one plan
across the phase (cross-referenced against every `32-*-PLAN.md`'s `requirements:` frontmatter).

### Anti-Patterns Found

| File | Line (approx) | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/board-model.ts` | `joinSnapshot`, `unadmittedById`/`ticketById` (1291-1299) | Presence partition not total over "admitted under a non-matching declared id" | 🛑 Blocker | Gap 1 — fabricated `row-without-file` against an on-disk, successfully-read file |
| `scripts/board-dashboard.ts` | `refusedSources`/`arm()` (900-978) | Containment refusal consumed at source granularity instead of directory granularity; the same early return never clears a pre-existing watch-failure record | 🛑 Blocker | Gap 2 — silent whole-source watch un-arming; permanent false watch-failure claim |
| `scripts/board-readonly.test.ts` | `isBareSpecifier` / `collectAcquisitions` arm 3 | Module-identity allow-list and closure-walk subject are both syntactic complements rather than a total partition; a capability-global member path is only an "acquisition" when it is itself a callee, not when read into a binding first | 🛑 Blocker | Gap 3 — DASH-06 guard bypass via absolute specifier and via member-path binding |
| `scripts/board-dashboard.ts` | `writeDocument` (306-307) | `sanitizeCell(JSON.stringify(v))` removes raw C1 but not C0 that `JSON.stringify` has already escaped into printable text | ⚠️ Warning (caveat on truth 5) | C0 recoverable by a `--json` consumer's own `JSON.parse` |
| `scripts/validate.test.ts` | `TEXT_SCAN_PRIMITIVES` | Census of ticket-frontmatter-reading primitives is an enumeration, not a refused complement; misses `join`, `replace`, `matchAll`, etc. | ⚠️ Warning (advisory) | Detection-robustness gap, no live second authority today |

No `TBD`/`FIXME`/`XXX` markers found in any file modified by this phase.

### Gaps Summary

Gap-closure round 2 made real, independently-confirmed progress: all three of round 1's gaps
(grammar-refusal fabrication, the `node:v8`/runtime-assembled-identity DASH-06 bypasses, and the
C1-in-stdout leak) are genuinely closed on the current tree, and none of the four original blockers
from round 1's own reproductions (namespace destructure, EACCES, torn byte, symlink escape) have
regressed. The full test suite grew from 74 files / 4811 cases to 75 / 4974 with nothing missing,
and the DASH-06 guard's own case count grew from 59 to 89.

But the phase's history repeated for a second consecutive round exactly as this project's own
recorded pattern predicts: **every fix this round reopened the identical failure class one register
over**, and this verification independently reproduced three new blockers — one on DASH-03 (a
different population than round 1's fix reached), two on DASH-04/DASH-05 and DASH-06 respectively
(both reopening the same allow-list/containment posture the round's own fixes just established) —
plus a lower-severity caveat on DASH-07/DASH-08's stdout channel. All were reproduced independently
by this verifier, against the current committed tree, using disposable fixtures — not read from
`32-REVIEW.md` or `32-23-ADVERSARIAL-REVIEW.md`, though both documents (read first, as leads) named
every one of them before this verification ran.

1. **DASH-03 (gap 1)**: an admitted ticket file whose declared `id` is not its stem is invisible to
   both halves of `joinSnapshot`'s presence partition, producing a fabricated `row-without-file`
   claim against a file on disk with zero read errors.
2. **DASH-04/DASH-05 (gap 2)**: the watch-arm's containment check operates at the wrong granularity
   (source instead of directory) and its refusal path never clears a stale watch-failure record —
   both independently reproduced live, with the loop reporting nothing on any channel in the first
   case and a permanent false claim in the second.
3. **DASH-06 (gap 3)**: the freshly-inverted allow-list from this round is bypassed by an
   absolute-path import specifier (falls between the allow-list and the closure walker) and by a
   capability-global member path reached through a binding rather than a direct call (the mechanism
   that actually detects writes never fires; only a cosmetic census count does).

REQUIREMENTS.md correctly still marks all eight DASH-0x requirements as incomplete; ROADMAP.md's
Phase 32 checkbox is still `[ ]` (unchecked) and no premature Complete flip was found. Neither needs
correction.

None of these three gaps match a later phase's stated goal or success criteria in ROADMAP.md
(Phase 33 covers Windows portability and live capture, not board-grammar joins, watch-arm
containment granularity, or the readonly guard's specifier/binding coverage), so none are deferred —
all three are live gaps against this phase. This phase has now used 2 of its 4-round gap-closure
cap; two further rounds remain before the cap forces a different resolution (override, as Phase 31
required at round 8, or a canonical-form rewrite of the three affected predicates, which both
`32-REVIEW.md` and `32-23-ADVERSARIAL-REVIEW.md` independently recommend for round 3, having
identified the same "syntactic complement instead of a total partition" root cause across all three
new blockers).

---

_Verified: 2026-09-15T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
