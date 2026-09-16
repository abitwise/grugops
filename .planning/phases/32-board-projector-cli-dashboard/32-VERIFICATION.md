---
phase: 32-board-projector-cli-dashboard
verified: 2026-09-16T18:10:00Z
status: gaps_found
score: 4/5 must-haves verified
covered_files: [".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/phases/32-board-projector-cli-dashboard/32-31-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-31-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-32-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-32-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-33-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-33-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-34-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-34-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-35-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-35-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-36-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-36-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-37-ADVERSARIAL-REVIEW.md", ".planning/phases/32-board-projector-cli-dashboard/32-37-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-37-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md", ".planning/phases/32-board-projector-cli-dashboard/32-VERIFICATION.md", "agent-factory/contracts/board.md", "scripts/board-dashboard.js", "scripts/board-dashboard.test.ts", "scripts/board-dashboard.ts", "scripts/board-model.js", "scripts/board-model.test.ts", "scripts/board-model.ts", "scripts/board-read.js", "scripts/board-read.test.ts", "scripts/board-read.ts", "scripts/board-readonly.test.ts", "scripts/board-tracer.test.ts", "scripts/board-watch-live.test.ts", "scripts/board-watch.test.ts", "scripts/check-foundation-guards.test.ts", "scripts/fixtures/board-snapshot/expected-snapshot.json", "scripts/js-import-closure.js", "scripts/js-import-closure.ts", "scripts/validate-agent-factory.js", "scripts/validate-agent-factory.ts", "scripts/validate.test.ts"]
covered_digest: "v1:sha256:3ed080ac51969bd5f755501ebd7b57aac2f521fd85219156b3b69c6762c8ffc2"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed:
    - "Round-2 gap 1 (DASH-03): an ADMITTED ticket file whose declared `id` differs from its stem fabricated a 'no ticket file carries that identifier' claim against a file that exists and was read successfully — independently reproduced CLOSED: the sentence now names the file and its declared identifier ('plans/tickets/ABC-901.md exists and declares the identifier ABC-902, so it is joined under that identifier and not this one'), with zero tickets readErrors."
    - "Round-2 gap 2, part 1 (DASH-04/05): a single symlinked entry (one ticket file, or one claimed-task directory) silently un-armed every watch sharing its SOURCE — independently reproduced CLOSED by direct code reading: `arm()` now asks `deps.contained(root, dir)` per directory, not `refusedSources: Set<SourceName>` per source."
    - "Round-2 gap 2, part 2 (DASH-04/05): the containment early return never cleared a pre-existing stale watch-failure record — independently reproduced CLOSED by direct code reading: the containment branch at board-dashboard.ts:1141-1145 now calls `watchErrorsByDir.delete(rel)`, matching the absent-directory and successful-rearm arms."
    - "Round-2 gap 3, part 1 (DASH-06): a writer reached through an absolute-path import specifier was invisible to the allow-list and the closure walker (guard green, 89/89, over a live arbitrary-file writer) — independently reproduced CLOSED: planting the same shape into the committed scripts/board-read.js now yields exit 1, 98 failed of 171, with the write-detection PREMISE case among the failures."
    - "Round-2 gap 3, part 2 (DASH-06): recording a capability-global member path reached through a variable binding in the allow-list silently re-greened the guard over a live writer (exit 0, 89/89) — independently reproduced CLOSED: the same plant now yields exit 1, 19 failed of 171, with the write-detection PREMISE case red."
    - "Round-2 caveat on DASH-07/08: a raw C0 control character planted in board content was recoverable, unsanitized, by one JSON.parse of the captured --json document — confirmed CLOSED by direct code reading: `writeDocument` now runs `scrub()` (which applies `sanitizeCell` to every string value and key, recursively) BEFORE `JSON.stringify`, not after, so a control character is removed from the value before the serializer can re-escape it into printable text."
  gaps_remaining:
    - "DASH-03's `conflicts[]` surface still contains a live, independently-reproduced self-contradiction for a NEW, narrower population than round 2's: when two admitted ticket files declare the same identifier (a duplicate-id contest), the loser's `row-without-file` conflict states 'plans/tickets/<loser>.md exists and declares the identifier <id>, so it IS joined under that identifier and not this one' in the same document whose `readErrors` states, of the identical file, that it is the one NOT joined. Both sentences reach the operator on the same --json document, so nothing is hidden, but the document contradicts itself about one file's join state. This is 32-37-ADVERSARIAL-REVIEW.md's F-12 and 32-REVIEW.md's WR-01, independently reproduced by this verifier against the current tree (see Independent Reproduction Transcripts). Narrower in scope and lower severity than round 2's gap (which asserted absence of a file that was never in either lookup map at all); this one asserts a wrong PRESENCE state for a file that IS in the correct map, for exactly the duplicate-id-loser population."
  regressions: []
gaps:
  - truth: "A typed FactorySnapshot joins board, ticket frontmatter, queue state, context notes, and traceability, and surfaces board-vs-frontmatter disagreement in conflicts[] rather than silently resolving it (DASH-03)."
    status: failed
    reason: "Independently reproduced against the current tree: board row [ABC-903] plus two ticket files (ABC-901.md, ABC-903.md) both declaring id: ABC-902 (a duplicate-id contest, which readTicketsSource resolves by keeping the first file by name as the joined record and the second as an admitted-but-unjoined loser, by design). The tickets readErrors entry for this contest correctly states 'ABC-901.md is the one joined and ABC-903.md is not.' The conflicts[] entry for ABC-903 in the SAME document states 'plans/tickets/ABC-903.md exists and declares the identifier ABC-902, so it is joined under that identifier and not this one' — directly contradicting the readErrors entry three fields over. Confirmed by direct reading of scripts/board-model.ts's presenceOf/presenceActual: ticketPopulations fills byStem from every admitted record, including a duplicate-id loser, so presenceOf reaches the admitted-under-another-id arm for the loser exactly as it does for the winner, and presenceActual states a consequence (joined under that id) that is true of the winner and false of the loser. CLAUDE.md's no-fabrication rule is what makes this a gap rather than a cosmetic wording issue: the projector is not silently resolving a disagreement here (both facts are printed), but it is asserting two contradictory things about the same file's join state within one snapshot."
    artifacts:
      - path: "scripts/board-model.ts"
        issue: "presenceActual's admitted-under-another-id arm states 'so it is joined under that identifier' unconditionally, but ticketPopulations's byStem includes duplicate-id losers (deliberately, to keep the presence partition total), so the arm's consequence clause is false for a loser"
    missing:
      - "Distinguish the winner from a duplicate-id loser inside the admitted-under-another-id arm — presenceOf already has the winner in hand via byId.get(declaredId) — and state a true sentence for the loser case (e.g. 'plans/tickets/<id>.md exists and declares the identifier <declared>, which <winner file> claimed first, so it is joined under no identifier'), matching agent-factory/contracts/board.md's table in the same commit since the contract currently carries the same false clause verbatim; add a board-model.test.ts case planting exactly this duplicate-id-loser shape and asserting the conflict's actual text does not claim the loser is joined"
deferred: []
advisory:
  - finding: "The single-ticket-frontmatter-authority census (scripts/validate.test.ts, findTicketReaders/censusOver) is defeated by a genuine second reader whose key-spelling half and text-scanning half live in two separate files joined by an ordinary import — the census only looks for both halves inside ONE parsed source file. Also defeated by a key spelling assembled at runtime (String.fromCharCode) rather than statically."
    category: architectural
    reason: "32-REVIEW.md's WR-04 and this round's own 32-37-ADVERSARIAL-REVIEW.md's F-10 (both dated 2026-09-16) both measured a real, working second ticket-frontmatter reader split across scripts/zz-probe-n2keys.ts and scripts/zz-probe-n2scan.ts reading {\"status\":\"ready\",\"column\":\"In Development\"} out of the fixture's deliberate-disagreement ticket, at exit 0 (census reports 1 authority). This verifier did not independently re-execute that plant this round, but corroborated it by direct reading of findTicketReaders' `namesBothKeys && primitiveRows.size > 0` guard, which is evaluated per-file with no cross-file join. Unchanged from round 2's disposition of the equivalent finding (advisory, not a gap against DASH-01/DASH-02) because no live second authority exists on the tree today — this is a detection-robustness residual in the proof, not a live second authority."
    evidence_status: "not independently re-executed this round; corroborated by direct code reading of scripts/validate.test.ts and by two independent same-day measurements (32-REVIEW.md WR-04, 32-37-ADVERSARIAL-REVIEW.md F-10) with concrete reproduction transcripts"
  - finding: "js-import-closure.ts's moduleSpecifiers() reads an ordinary string literal inside install/install.js ('import { resolvedAssignmentsIn } from \"./model-tiers.js\";', embedded as generated-source text for a temp-mirror probe) as a real relative import specifier, because stripNonCode blanks comments and template text but deliberately leaves string-literal contents intact. jsImportClosure(ROOT, \"install/install.js\") therefore throws ImportClosureError naming an import ('./model-tiers.js') the file does not actually have, because install/model-tiers.js does not exist."
    category: architectural
    reason: "Independently reproduced by this verifier: `moduleSpecifiers(readFileSync('install/install.js','utf8'))` returns `[{\"specifier\":\"./model-tiers.js\",\"cls\":\"relative\"}]`, and `jsImportClosure(process.cwd(), \"install/install.js\")` throws exactly the message 32-REVIEW.md's CR-01 quotes. Also independently reproduced that an ordinary prose string containing a non-relative path (e.g. a quoted '/etc/passwd' inside an error message) is classified `foreign`, which would also throw if that file were ever scanned. Blast radius today is zero, also independently confirmed: no current caller (grep across scripts/*.ts/test.ts) passes install/install.js as a jsImportClosure entry, and the unplanted `check:dashboard-readonly` guard (which does not scan this file) is green at 171/171. This does not create a false PASS or a write-capability bypass of DASH-06 — the failure direction is an unrelated-looking over-refusal (throw), not a silent under-detection — but it is a live, reproducible instance of the module's own single-authority claim ('the scan's INPUT is CODE... asked about import statements rather than about prose') being false of a tracked file, which is why 32-REVIEW.md rates it a CRITICAL finding despite the zero current blast radius. Recommended for round 4 or a human decision, given the module's docblock already states the fix (blank string-literal spans the same way template text is blanked, then re-measure both classes over all 65 tracked files)."
    evidence_status: "independently reproduced this round by this verifier, both the fabricated-edge throw on install/install.js and the foreign-classification of an ordinary prose path string; zero live callers found by repository-wide grep"
behavior_unverified_items: []
coincidental_reliance_items: []
---

# Phase 32: Board Projector & CLI Dashboard Verification Report

**Phase Goal:** The operator watches the factory live from one read-only terminal view, fed by a single board-grammar authority whose typed snapshot a future web renderer could consume unchanged.
**Verified:** 2026-09-16T18:10:00Z
**Status:** gaps_found
**Re-verification:** Yes — gap-closure round 3 (plans 32-31..32-37), re-testing `32-VERIFICATION.md`'s round-2 `gaps_found` (2/5) verdict. Phase has now used 3 of its 4-round gap-closure cap; one round remains per the project's own recorded rule (established after Phase 31).

## Goal Achievement

### Method

Every reproduction below was run independently by this verifier against the current committed tree
(HEAD `670f1b3c`), not copied from `32-37-ADVERSARIAL-REVIEW.md` or `32-REVIEW.md`. Those two
documents (the round's own self-review and an independent code review, both dated 2026-09-16) were
read first and treated as UNVERIFIED leads to confirm against source — per this project's own
instruction and its own recorded lesson that a green suite, and even a careful self-review, is not
proof of a safety invariant. Every transcript below is this verifier's own run, on disposable
fixtures under a scratchpad directory outside the repository root, or a direct read of the committed
source at the cited line numbers. Every probe that touched a tracked file
(`scripts/board-read.js`) was restored and confirmed clean with `git diff --exit-code` before the
next probe began.

**Premise check:**
```
$ npm run build && npm run check:build-parity
tsc — no diagnostics
Build parity: no tracked build output moved when tsc ran.
```

**Full-suite premise check (run once, in the background, given its ~9 minute duration):**
```
$ npx vitest run --exclude '**/scripts/e2e/**'
Test Files  75 passed (75)
     Tests  5120 passed | 2 skipped (5122)
[exited with code 0]
```
This matches `32-37-ADVERSARIAL-REVIEW.md`'s own measurement (75 files, 5120 passed, 2 skipped) —
no regression against round 2's 4974 and nothing missing. A second, targeted run of the nine test
files this round's plans modified (`board-read`, `board-model`, `board-dashboard`, `board-watch`,
`board-watch-live`, `board-tracer`, `validate`, `check-foundation-guards`, plus `board-readonly`
separately) was also run independently and is reported per-file below.

`npm test` was **not** run (it triggers the live claude-CLI e2e lane per this project's own recorded
guidance); its state remains `UNKNOWN - verify`, unchanged from every prior round of this phase.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `board-model.ts` is the ONLY board grammar; column-heading parser extracted/deleted from `validate-agent-factory.ts`; row/WIP grammars pinned by spec + fuzz suite (DASH-01, DASH-02) | ✓ VERIFIED (caveat) | Unchanged from round 2's disposition. `frontMatter()`/`FrontMatter` confirmed absent from `validate-agent-factory.ts`; `checkTickets()` routes through `parseTicketDocument`. Caveat (advisory, not independently re-executed this round): the "exactly one ticket-frontmatter reader" census is file-scoped and is defeated by a genuine second reader split across two files, or by a runtime-assembled key spelling — no live second authority exists on the tree today. |
| 2 | One typed `FactorySnapshot` joins board, ticket frontmatter, queue, context, traceability, and surfaces disagreement in `conflicts[]` (DASH-03) | ✗ FAILED | Round 2's gap (an admitted ticket whose declared `id` differs from its stem fabricating absence) is independently reproduced CLOSED. A NEW, narrower gap remains: a duplicate-id contest's loser gets a `row-without-file` conflict claiming it IS joined under the contested identifier, in the same document whose `readErrors` states it is NOT the one joined — a live, independently-reproduced self-contradiction on the primary snapshot document. See gap 1. |
| 3 | Directory-level `fs.watch` + mandatory poll + debounce; never renders a torn read, partial parse, or ENOENT as an empty board — stale snapshot shows a visible stale badge (DASH-04, DASH-05) | ✓ VERIFIED (caveat) | Round 2's two gaps (per-entry refusal silently un-arming a whole shared source; a stale watch-failure record never cleared by the containment early return) are both independently confirmed CLOSED by direct code reading: `arm()` now asks `deps.contained(root, dir)` per directory rather than consulting a `Set<SourceName>`, and the containment early return now calls `watchErrorsByDir.delete(rel)`. Caveat, confirmed by direct code reading: `defaultDeps.contained` calls `insideRoot(root, dir, ...).ok`, discarding the resolved real path, and `arm()` then opens `dir` (the unresolved spelling) at `deps.watch(dir, ...)` rather than the resolved path — a check-then-open race against a symlink swap. Bounded: the watch listener ignores the `filename` argument entirely and only triggers a re-read, so no content crosses this seam; the reader's own per-read `OUTSIDE_ROOT` containment check remains the authoritative safety boundary for what is actually rendered. This is `32-REVIEW.md`'s WR-03, not independently re-executed as a live race by this verifier (a genuine link-swap race is not practically reproducible from a single-threaded probe) but confirmed present in the committed source. |
| 4 | The dashboard CANNOT write: import-graph guard proves no mutating `node:fs` symbol reachable (DASH-06) | ✓ VERIFIED (caveat) | Round 2's two live write bypasses (absolute-path import specifier; capability-global member path reached through a binding) are both independently reproduced CLOSED by this verifier: planting each shape into the committed `scripts/board-read.js` and running `npm run check:dashboard-readonly` now yields exit 1 (98 failed/171 and 19 failed/171 respectively), with the write-detection `PREMISE` case among the failures in both cases, not only a count. The unplanted guard is independently confirmed green at 171/171. Caveat, independently reproduced: `moduleSpecifiers()` (the shared authority `js-import-closure.ts` exports) misreads an ordinary string literal inside the committed `install/install.js` as a real relative import, causing `jsImportClosure` to throw an `ImportClosureError` naming an import that file does not have. This does not create a false PASS or a write bypass (the failure direction is an over-refusing throw, not a silent under-detection), and zero current caller passes `install/install.js` as a closure entry (confirmed by repository-wide grep) — but it is a live, reproducible violation of the module's own stated claim that its input is "code... rather than prose." See advisory. |
| 5 | `--json`, `--once`, non-TTY modes work; renderer degrades visibly; snapshot shape stable; zero runtime deps; no listening socket (DASH-07, DASH-08) | ✓ VERIFIED | Confirmed live: `--once --json` from this verifier's own run produces one parseable document with `snapshot.schemaVersion: 2` and `conflicts` array present; `--once` exits 0. `package.json` confirmed to have no `dependencies` key at all (`devDependencies` only: `@types/node`, `typescript`, `vitest`); no `createServer`/`listen(`/`net.`/`http.`/`WebSocket` usage found in `board-dashboard.ts`, `board-read.ts`, or `board-model.ts`. Round 2's caveat (a raw C0 control character recoverable by one `JSON.parse` of a captured `--json` document) is independently confirmed CLOSED by direct code reading: `writeDocument` now runs `sanitizeCell(JSON.stringify(scrub(value)))`, where `scrub()` recursively applies `sanitizeCell` to every string value and key BEFORE serialization, so a control character is removed from the value itself rather than surviving as printable escaped text for the sanitizer to miss. **DASH-08 judgment call (asked explicitly):** a human decision (Option A, recorded in plan 32-33) published a new `stem` field on `TicketRecord` and moved `SCHEMA_VERSION` from 1 to 2, with the golden fixture regenerated in the same commit. This SATISFIES, rather than violates, "the snapshot shape is stable enough that a future web renderer consumes it unchanged": the clause is a promise of versioned, detectable stability — not of an eternal shape freeze — and a deliberate, human-decided, version-gated change with a regenerated golden is exactly the mechanism by which a future consumer can safely detect and handle a shape change (check `schemaVersion` before parsing) rather than being silently broken by an undetected drift. |

**Score:** 4/5 truths verified (up from round 2's 2/5 — three round-2 gaps closed with zero regressions; one narrower, independently-confirmed gap remains on DASH-03)

### Independent Reproduction Transcripts (this verifier's own runs)

**F-06 (DASH-03, round-2 gap) — CONFIRMED CLOSED.** Board row `[ABC-901]` plus a fresh
`plans/tickets/ABC-901.md` declaring `id: ABC-902`:
```
$ node scripts/board-dashboard.js <tree> --once --json
readErrors(tickets): []
conflict for ABC-901: {"kind":"row-without-file","ticketId":"ABC-901","column":"Blocked",
  "expected":"plans/tickets/ABC-901.md",
  "actual":"plans/tickets/ABC-901.md exists and declares the identifier ABC-902,
            so it is joined under that identifier and not this one","source":"board"}
exit=0
```

**F-12 / WR-01 (DASH-03, NEW gap) — CONFIRMED OPEN.** Board row `[ABC-903]` plus two ticket files,
`ABC-901.md` and `ABC-903.md`, both declaring `id: ABC-902`:
```
$ node scripts/board-dashboard.js <tree> --once --json
readErrors(tickets): [{"code":"duplicate-id","message":"ABC-903.md and ABC-901.md both claim the
  identifier ABC-902. Ticket identifiers are unique and the first by file name is joined, so
  ABC-901.md is the one joined and ABC-903.md is NOT. ..."}]
conflict for ABC-903: {"kind":"row-without-file","ticketId":"ABC-903", ...,
  "actual":"plans/tickets/ABC-903.md exists and declares the identifier ABC-902,
            so it IS joined under that identifier and not this one"}
exit=0
```
The same document asserts, of the same file, both "is not" (readErrors) and "is" (conflicts).
Confirmed by direct read of `scripts/board-model.ts`: `ticketPopulations` fills `byStem` from every
admitted record including a duplicate-id loser (by design, to keep the partition total),
`presenceOf` reaches `admitted-under-another-id` for the loser exactly as for the winner, and
`presenceActual`'s consequence clause is true only of the winner.

**WR-01/S1 (DASH-06, round-2 gap 3 part 1) — CONFIRMED CLOSED.** Appended to the committed
`scripts/board-read.js`:
```
import { w } from "<outside>/writer.mjs";      // writeFileSync, outside repo root
export const wA_export = (p) => w(p);
```
`npm run check:dashboard-readonly` → **98 failed | 73 passed (171)**, exit 1. File restored,
`git diff --exit-code -- scripts/board-read.js` clean.

**WR-02/S6 (DASH-06, round-2 gap 3 part 2) — CONFIRMED CLOSED.** Appended to the committed
`scripts/board-read.js`:
```
const r = process.report;
export const wB = (p) => r.writeReport(p);
```
`npm run check:dashboard-readonly` → **19 failed | 152 passed (171)**, exit 1, with
`PREMISE: no closure module acquires a module by a route that is not a static literal import`
among the failures — the write-detection mechanism, not only a census count. File restored,
`git diff --exit-code -- scripts/board-read.js` clean.

**Watch-arm containment (DASH-04/05, round-2 gap 2) — CONFIRMED CLOSED by direct code reading.**
`scripts/board-dashboard.ts:938`: `contained: (root, dir) => insideRoot(root, dir, "the watched
directory").ok` is now called **per directory** inside `arm()` (`scripts/board-dashboard.ts:1141`),
not against a `Set<SourceName>` built from every `readErrors` entry's `source` field. The same
containment branch (`:1141-1145`) now calls `watchErrorsByDir.delete(rel)`, matching the pattern the
absent-directory arm (`:1147-1153`) and the successful-rearm arm (`:1170-1174`) already state in
their comments.

**WR-03 (DASH-04/05, NEW caveat) — CONFIRMED present by direct code reading.**
`scripts/board-dashboard.ts:938` discards `insideRoot`'s resolved path (only `.ok` is kept), and
`arm()` at `:1155` calls `deps.watch(dir, ...)` — `dir`, the unresolved joined path, not the
resolved path the containment check examined. `:1156-1157`: the watch callback ignores the
`filename` argument entirely and only calls `schedule()`, bounding the leak to a held handle and
spurious re-reads, never content.

**CR-01 (DASH-06 authority, NEW caveat) — CONFIRMED OPEN.**
```
$ node -e 'const src = require("fs").readFileSync("install/install.js","utf8");
  console.log(JSON.stringify(m.moduleSpecifiers(src).filter(s=>s.specifier.includes("model-tiers"))))'
[{"specifier":"./model-tiers.js","cls":"relative"}]
$ node -e 'm.jsImportClosure(process.cwd(), "install/install.js")'
ImportClosureError: js-import-closure: install/install.js imports "./model-tiers.js", which does
not resolve to a file at .../install/model-tiers.js. ...
```
`install/install.js` carries the generated-source line
`'import { resolvedAssignmentsIn } from "./model-tiers.js";'` inside an ordinary string literal
(part of a probe-script template), which `stripNonCode` deliberately leaves intact (only comments
and template text are blanked). Repository-wide grep confirms zero current callers pass
`install/install.js` as a `jsImportClosure` entry.

**C0/C1-via-JSON.parse (DASH-07/08, round-2 caveat) — CONFIRMED CLOSED by direct code reading.**
`scripts/board-dashboard.ts:324-330` (`scrub`) recursively applies `sanitizeCell` to every string
value and object key of the snapshot BEFORE `writeDocument` (`:381`) calls
`sanitizeCell(JSON.stringify(scrub(value)))` — control characters are removed from the value itself,
not from the already-escaped JSON text, so `JSON.stringify` cannot re-introduce them as printable
escape sequences a consumer's `JSON.parse` would recover.

**Regression spot-checks (no regression found):**
```
$ npx vitest run scripts/board-readonly.test.ts
board-readonly: 327 resolved call sites [...], 0 unresolved, 10 capability-global member paths,
  0 refused acquisitions
Test Files  1 passed (1)   Tests  171 passed (171)

$ npx vitest run scripts/board-read.test.ts scripts/board-model.test.ts \
    scripts/board-dashboard.test.ts scripts/board-watch.test.ts \
    scripts/board-watch-live.test.ts scripts/board-tracer.test.ts \
    scripts/validate.test.ts scripts/check-foundation-guards.test.ts
Test Files  8 passed (8)   Tests  926 passed (926)

$ npx vitest run --exclude '**/scripts/e2e/**'
Test Files  75 passed (75)   Tests  5120 passed | 2 skipped (5122)   exit 0

$ node scripts/board-dashboard.js scripts/fixtures/board-snapshot --once --json | jq '.snapshot.schemaVersion, (.conflicts|length)'
2
9

$ git status --short
 M .planning/milestone.lock   M human-notes.txt   ?? .gsd/   ?? .planning/state.json
  (pre-existing, unrelated to this phase; git diff --exit-code -- scripts/ agent-factory/ docs/
   package.json .planning/REQUIREMENTS.md .planning/ROADMAP.md clean)
```

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/board-model.ts` (+`.js`) | Pure board/ticket grammar, no `node:fs`, single authority | ⚠️ HOLLOW (partial) | Grammar core and single-authority claim hold; `presenceActual`'s `admitted-under-another-id` arm asserts a consequence true of a duplicate-id winner but false of the loser — see gap 1 |
| `scripts/board-read.ts` (+`.js`) | fs-touching read-verify-reread seam | ✓ VERIFIED | All read-path fabrication findings from rounds 1 and 2 independently confirmed closed and non-regressed this round |
| `scripts/board-dashboard.ts` (+`.js`) | CLI renderer, TTY/non-TTY/json/watch, sanitized output | ⚠️ HOLLOW (partial) | Watch-arm containment granularity and stale-record-clearing both confirmed closed; C0/C1 stdout sanitization confirmed closed; the containment check-then-open ordering (WR-03) remains a bounded, unclosed caveat |
| `scripts/js-import-closure.ts` (+`.js`) | Shared specifier-classification authority for the DASH-06 guard | ⚠️ HOLLOW (partial) | The three-class partition (bare/relative/foreign) is total over its input and closes all six round-2/round-3 write-bypass spellings; its `moduleSpecifiers()` input assembly reads an ordinary string literal as code on at least one tracked file (`install/install.js`) — see advisory (CR-01) |
| `scripts/board-readonly.test.ts` | Mechanical no-write guard | ✓ VERIFIED | All independently-reproduced write-bypass plants (absolute specifier, member-path binding, namespace destructure, `node:v8`, runtime-assembled identity) exit 1 with the write-detection PREMISE case red; unplanted guard green 171/171 |
| `scripts/validate-agent-factory.ts` (+`.js`) | Imports board-model, no second grammar | ✓ VERIFIED | `frontMatter()` confirmed absent; routed through `parseTicketDocument` |
| `agent-factory/contracts/board.md` | Normative spec | ⚠️ HOLLOW (partial) | Carries the same false `admitted-under-another-id` consequence clause as `board-model.ts` (per `32-REVIEW.md` WR-01) — the contract needs to move in the same commit as the code fix |
| `scripts/fixtures/board-snapshot/expected-snapshot.json` | Golden fixture | ✓ VERIFIED | Pristine-fixture run (`schemaVersion: 2`, `9 conflicts`) matches the golden |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `scripts/board-dashboard.ts` | `scripts/board-read.ts` | `readSnapshot()` call in `refresh()` | ✓ WIRED | Confirmed by every live run above |
| `scripts/board-read.ts` | `scripts/board-model.ts` | `joinSnapshot()`/`parseBoard()`/`parseTicketDocument()` | ⚠️ WIRED BUT INCOMPLETE | The presence derivation is complete for the id≠stem population (round-2 gap 1, closed) but not for the duplicate-id-loser population (gap 1, this round) |
| `scripts/board-dashboard.ts` (watch arm) | `scripts/board-read.ts` (`insideRoot`) | `deps.contained(root, dir)` per `WatchDir` entry | ⚠️ WIRED BUT LOSSY | Correct granularity (per-directory, closing round-2's gap) but discards `insideRoot`'s resolved path and re-opens the unresolved spelling at `deps.watch` (WR-03 caveat) |
| `scripts/validate-agent-factory.ts` | `scripts/board-model.ts` | `parseTicketDocument`/`boardColumnName`/`boardHasColumn`/`kebab`/`parseBoard` imports | ✓ WIRED | Single authority confirmed |
| `scripts/board-readonly.test.ts` | `scripts/board-dashboard.js` closure | `jsImportClosureFacts` AST walk + `classifySpecifier` three-way partition | ✓ WIRED | All independently-reproduced round-2 bypasses closed; the partition itself is total over its measured input |
| `scripts/js-import-closure.ts` (`moduleSpecifiers`) | any file it scans | regex-driven specifier extraction over `stripNonCode`'s output | ⚠️ WIRED BUT OVER-BROAD | String-literal contents are left un-blanked, so an ordinary string containing what looks like an import line is read as one — independently confirmed on `install/install.js` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build is a faithful build of its sources | `npm run build && npm run check:build-parity` | exit 0, no tracked `.js` moved | ✓ PASS |
| `--once --json` prints one parseable JSON document, `schemaVersion: 2` | `node scripts/board-dashboard.js t0 --once --json \| jq .` | valid single document | ✓ PASS |
| `--once` exits 0 with conflicts present | `node scripts/board-dashboard.js t0 --once; echo $?` | `0`, `9 conflicts` matching golden | ✓ PASS |
| Absolute-path specifier writer bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 1, 98 failed, PREMISE red | ✓ PASS (round-2 gap 3.1 closed) |
| Member-path-binding writer bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 1, 19 failed, PREMISE red | ✓ PASS (round-2 gap 3.2 closed) |
| Unplanted DASH-06 guard is green | `npm run check:dashboard-readonly` | 171 passed (171) | ✓ PASS |
| Admitted ticket with id ≠ stem does not fabricate `row-without-file` | id/stem mismatch fixture + `--once --json` | honest sentence naming the declared id, zero readErrors | ✓ PASS (round-2 gap 1 closed) |
| Duplicate-id contest loser does not get a self-contradicting `row-without-file` | duplicate-id fixture + `--once --json` | `readErrors` says "not joined"; `conflicts` for the same file says "is joined" | ✗ FAIL (NEW — gap 1) |
| A control character survives to a `--json` consumer after `JSON.parse` | direct code read of `scrub`/`writeDocument` ordering | control char removed from the value before `JSON.stringify` runs | ✓ PASS (round-2 caveat closed) |
| A string literal is misread as a live import specifier | `moduleSpecifiers()` on `install/install.js` | `./model-tiers.js` read as a `relative` import; `jsImportClosure` throws | ✗ FAIL (NEW caveat — zero live callers, no write-bypass consequence) |
| The watch-arm opens the same path it checked for containment | direct code read of `defaultDeps.contained` + `arm()` | `.ok` boolean kept, resolved path discarded; `deps.watch(dir, ...)` opens the unresolved spelling | ✗ FAIL (NEW caveat — bounded, `filename` argument ignored, no content leak) |
| Zero runtime dependencies, no listening socket | `package.json` read + grep for server/socket APIs | no `dependencies` key; no `createServer`/`listen(`/`net.`/`http.`/`WebSocket` | ✓ PASS |
| Targeted nine-file suite green | `npx vitest run <9 round-3-owned test files>` | 8 files, 926 passed | ✓ PASS |
| Full suite green | `npx vitest run --exclude '**/scripts/e2e/**'` | 75 files, 5120 passed, 2 skipped, exit 0 | ✓ PASS (does not detect the FAIL rows above — the project's "green suite is not proof" lesson holds a further time) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DASH-01 | 32-01, 32-08, 32-12, 32-16, 32-21, 32-36 | Single board-grammar authority | ✓ SATISFIED (caveat: advisory census-defeat, unchanged from round 2) | `frontMatter()` confirmed deleted; census still has a stated file-scope blind spot, no live second authority found |
| DASH-02 | 32-01, 32-02, 32-04, 32-12, 32-16, 32-21 | Written spec + parse-oracle fuzz suite | ✓ SATISFIED | Unaffected by this round's findings |
| DASH-03 | 32-01, 32-03, 32-05, 32-09, 32-10, 32-15, 32-17, 32-23, 32-33 | Typed `FactorySnapshot` joining 5 sources, `conflicts[]` | ✗ BLOCKED | Gap 1: duplicate-id-loser self-contradiction, independently confirmed live on the primary snapshot document |
| DASH-04 | 32-03, 32-09, 32-15, 32-19, 32-22, 32-34 | `fs.watch` + mandatory poll + debounce | ✓ SATISFIED (caveat) | Round-2 gaps closed; WR-03 check-then-open ordering caveat, bounded (no content leak) |
| DASH-05 | 32-03, 32-07, 32-09, 32-10, 32-15, 32-17, 32-19, 32-22, 32-34 | Torn/ENOENT/permission never render as empty; stale badge | ✓ SATISFIED (caveat) | Watch-arming failures no longer silent; stale-record leak closed; WR-03 caveat carried |
| DASH-06 | 32-06, 32-11, 32-20, 32-21, 32-31, 32-32 | Mechanical read-only guard | ✓ SATISFIED (caveat) | Both round-2 live write bypasses independently confirmed closed; CR-01 (fabricated import edge, zero live blast radius, no write-bypass consequence) carried as advisory |
| DASH-07 | 32-01, 32-07, 32-13, 32-18, 32-35 | `--json`/`--once`/non-TTY modes, visible degradation | ✓ SATISFIED | Round-2 C0/C1 caveat independently confirmed closed |
| DASH-08 | 32-01, 32-02, 32-05, 32-06, 32-08, 32-11, 32-13, 32-17, 32-18, 32-20, 32-33 | Stable snapshot shape, zero runtime deps, no socket | ✓ SATISFIED | `package.json` confirmed dependency-free; the human-decided `schemaVersion` 1→2 bump satisfies rather than violates the "stable enough... consumes it unchanged" clause (versioned, detectable change, not silent drift) — see Truth 5 evidence for the explicit judgment |

REQUIREMENTS.md currently marks all eight `[ ]` Not complete / "Gaps Found" — accurate to this
verification's findings (DASH-03 is genuinely blocked; the other seven are satisfied with caveats
carried forward for round 4 or a human override decision, and REQUIREMENTS.md does not currently
distinguish "satisfied with caveat" from "blocked", so leaving all eight unchecked understates
progress but does not misstate any individual finding). No orphaned requirements: all eight IDs are
claimed by at least one plan across the phase (cross-referenced against every `32-*-PLAN.md`'s
`requirements:` frontmatter).

**A premature-Complete flip was found in git history and already reverted before this verification
ran** (`f8c84e06` marked DASH-03/05/08 `[x]` Complete; `1b8e0eab` reverted it back to `[ ]`/Gaps
Found). REQUIREMENTS.md as it stands at HEAD `670f1b3c` is correct and needs no further correction.

### Anti-Patterns Found

| File | Line (approx) | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/board-model.ts` | `presenceActual`, `admitted-under-another-id` arm | Asserts "joined under that identifier" unconditionally over a population (`byStem`) that includes duplicate-id losers | 🛑 Blocker | Gap 1 — self-contradicting `conflicts[]` entry against the same document's own `readErrors`, live and independently reproduced |
| `agent-factory/contracts/board.md` | table row for `admitted-under-another-id` | Carries the same false consequence clause as the code | ⚠️ Warning | Contract cannot currently be used to adjudicate gap 1; needs to move with the code fix |
| `scripts/js-import-closure.ts` | `stripNonCode` / `moduleSpecifiers` | String-literal contents are left un-blanked, so an ordinary string is read as code | ⚠️ Warning | Live on `install/install.js` (throws on scan) with zero current callers; no write-bypass consequence |
| `scripts/board-dashboard.ts` | `defaultDeps.contained` (:938) / `arm()` (:1141-1155) | Containment check examines the resolved path (`insideRoot(...).ok`); `deps.watch` then opens the unresolved spelling | ⚠️ Warning | Check-then-open race, bounded by the watch listener ignoring `filename` and by the reader's independent per-read containment check |

No `TBD`/`FIXME`/`XXX` markers found in any file modified by this phase.

### Gaps Summary

Gap-closure round 3 made substantial, independently-confirmed progress: all five of round 2's gaps
(the DASH-03 id≠stem fabrication; the DASH-04/05 whole-source watch un-arming; the DASH-04/05 stale
watch-record leak; both DASH-06 live write bypasses — absolute specifier and member-path binding;
and the DASH-07/08 C0-via-`JSON.parse` caveat) are independently confirmed CLOSED against the
current tree, with zero regressions found in any of round 1's or round 2's other closures. The full
suite grew from 4974 to 5120 passing cases with nothing missing, and the DASH-06 guard's own case
count grew from 89 to 171.

One gap remains, independently reproduced and narrower in both scope and severity than any of round
2's: a duplicate-id contest's loser file gets a `conflicts[]` entry that contradicts its own
`readErrors` entry about whether that file is joined. Both facts reach the operator on the same
document (nothing is hidden), but the document is self-contradictory, which is exactly the shape
CLAUDE.md's no-fabrication rule and DASH-03's own text ("surfaces... disagreement... rather than
silently resolving it") exist to prevent — now occurring between two fields of one snapshot rather
than between the board and a ticket file.

Three further findings were independently confirmed present but are recorded as caveats rather than
gaps, because none defeats the specific must-have it borders: `js-import-closure.ts` misreads a
string literal as an import on one tracked file with zero live callers and no write-bypass
consequence (DASH-06's core no-write claim is unaffected); the watch-arm's containment check
examines a resolved path but opens the unresolved spelling, bounded by the listener ignoring
`filename` and by the reader's own independent containment check on every actual read (DASH-04/05's
rendering behavior is unaffected); and the ticket-frontmatter census remains file-scoped, unchanged
from round 2's advisory disposition (no live second authority found).

1. **DASH-03 (gap 1)**: a duplicate-id contest's loser gets a `row-without-file` conflict asserting
   it IS joined under the contested identifier, in the same document whose `readErrors` states,
   of the same file, that it is NOT the one joined.

REQUIREMENTS.md correctly still marks all eight DASH-0x requirements as incomplete; ROADMAP.md's
Phase 32 status was not touched by this verification. A premature-Complete flip from earlier in this
round was already found reverted before this verification began (see Requirements Coverage).

None of this gap matches a later phase's stated goal or success criteria in ROADMAP.md (Phase 33
covers Windows portability and live capture, not the ticket-presence join), so it is not deferred —
it is a live gap against this phase. **This phase has now used 3 of its 4-round gap-closure cap.**
One round remains before the cap forces a different resolution (override, as Phase 31 required at
round 8, or a targeted fix — the round's own self-review already scoped the remaining gap as a
small, single-file, single-arm change with a named owner (`presenceActual`'s
`admitted-under-another-id` arm) and an already-drafted fix in `32-REVIEW.md`'s WR-01, unlike this
phase's earlier rounds where the fix required a canonical-form rewrite of an entire predicate).
Given the sharply reduced severity and scope of what remains (one narrow, low-impact sentence-quality
defect, both facts visible to the operator, versus round 1's and round 2's live write-bypasses and
broad fabrications), a human may reasonably choose to override this gap rather than spend a fourth
round — that decision is recorded here as available, not applied.

**This looks like a bounded, well-scoped residual.** To accept this deviation without a further
round, add to a future verification's frontmatter:

```yaml
overrides:
  - must_have: "One typed FactorySnapshot joins board, ticket frontmatter, queue state, context notes, and traceability, and surfaces board-vs-frontmatter disagreement in conflicts[] rather than silently resolving it (DASH-03)."
    reason: "The remaining gap is a duplicate-id-loser sentence stating 'joined' when the file is not the one joined; both the true state (readErrors) and the false consequence clause (conflicts) are visible in the same document, so nothing is hidden from the operator — only one field's wording is wrong. Narrow, single-arm, single-file fix already drafted in 32-REVIEW.md's WR-01."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

---

_Verified: 2026-09-16T18:10:00Z_
_Verifier: Claude (gsd-verifier)_
