---
phase: 32-board-projector-cli-dashboard
verified: 2026-09-15T03:55:00Z
status: gaps_found
score: 3/5 must-haves verified
covered_files: [".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/phases/32-board-projector-cli-dashboard/32-01-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-01-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-02-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-02-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-03-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-03-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-04-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-04-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-05-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-05-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-06-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-06-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-07-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-07-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-08-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-08-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-09-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-09-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-10-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-10-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-11-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-11-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-12-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-12-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-13-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-13-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-14-ADVERSARIAL-REVIEW.md", ".planning/phases/32-board-projector-cli-dashboard/32-14-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-14-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md", "agent-factory/contracts/board.md", "scripts/board-dashboard.js", "scripts/board-dashboard.test.ts", "scripts/board-dashboard.ts", "scripts/board-model.js", "scripts/board-model.test.ts", "scripts/board-model.ts", "scripts/board-read.js", "scripts/board-read.test.ts", "scripts/board-read.ts", "scripts/board-readonly.test.ts", "scripts/validate-agent-factory.js", "scripts/validate-agent-factory.ts", "scripts/validate.test.ts"]
covered_digest: "v1:sha256:c456336729e85720e9031940f57bc5196cd00197003060206aaaf829685a8809"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed:
    - "CR-06 (original): second ticket-frontmatter authority (`frontMatter()`/`FrontMatter`) deleted from `validate-agent-factory.ts`; `checkTickets()` routed through `parseTicketDocument`; `board-model.ts` docblock corrected to present tense and derived from a census — independently confirmed by grep (0 occurrences in .ts and .js) and by direct read"
    - "CR-01 (original): the two-line namespace-destructure bypass of the DASH-06 guard is now refused — independently reproduced (planted verbatim, `npm run check:dashboard-readonly` → exit 1, 4 failed / 59)"
    - "CR-02 (original): EACCES on `plans/tickets/` now yields a visible `[stale]` badge, a `readErrors` entry with `code: EACCES`, and zero fabricated `row-without-file` conflicts — independently reproduced (`chmod 000` + `--once` and `--once --json`)"
    - "CR-04: a symlink under `plans/tickets/` pointing outside the repository root is refused (`code: OUTSIDE-ROOT`) with zero bytes of the target's content reaching stdout or stderr — independently reproduced"
    - "CR-03 (original) and CR-05 (original): not independently re-executed by this verifier (byte-level tear-detector and stderr-sanitizer changes), but corroborated by direct reading of the cited code (`readVerifyReread` now compares raw bytes before decoding; `warn` is the single sanitizing stderr chokepoint) and by the phase's own detailed, internally consistent review transcripts"
  gaps_remaining:
    - "DASH-04/DASH-05 'never renders a false claim about the filesystem' is still false, one register over from the closed CR-02: a ticket file that exists, is readable, and is merely refused by the grammar (e.g. an unknown key) still produces a fabricated `row-without-file` conflict claiming no file carries that identifier, under a plain-text header that reads `[ok]` with no stale badge — independently reproduced against the current tree"
    - "DASH-06 'the dashboard cannot write, proven mechanically' is still false: `npm run check:dashboard-readonly` reports 59/59 passing over a module that writes any path handed to it via `node:v8`'s `writeHeapSnapshot` (an ordinary import, zero obfuscation) and, separately, via a runtime-assembled `node:fs` identity (`process.getBuiltinModule(\"node:\" + \"fs\")`) — both independently reproduced against the current tree"
  regressions: []
gaps:
  - truth: "The dashboard follows a live run ... and never renders a torn read, a partial parse, or an ENOENT as an empty board — a stale snapshot shows a visible stale badge over the last good read."
    status: failed
    reason: "Independently reproduced against the current tree, on a copy of `scripts/fixtures/board-snapshot/` with one added board row `[ABC-900]` and a readable `plans/tickets/ABC-900.md` carrying one unrecognized key (`owner:`). `readTicketsSource` records a `readErrors` entry (`code: unknown-key`) but does NOT set `sources.tickets` away from `ok`, because a grammar refusal is deliberately excluded from the presence-gate's failure signal (per `board-read.ts`'s own docblock, 'a refused document is not this — the bytes were read'). The plain-text header renders `[ok]` with 10 conflicts and NO stale badge; `--json`'s `conflicts[]` array contains `{\"kind\":\"row-without-file\",\"ticketId\":\"ABC-900\",...,\"actual\":\"no ticket file carries that identifier\"}` — a false, positive claim about the filesystem, against a file that is sitting on disk and was independently confirmed readable. This is 32-REVIEW.md's CR-01 (fresh code review, dated after this round's own adversarial pass), reached through the exact sibling arm CR-02's original fix did not cover, and is CLAUDE.md's 'No fabrication' rule violated on the load-bearing conflicts surface DASH-03 introduces."
    artifacts:
      - path: "scripts/board-read.ts"
        issue: "A grammar refusal at the per-ticket read site records a `readErrors` entry but never marks the source non-`ok`, so the presence gate in `joinSnapshot` (`ticketsListingComplete`) is fed a record set missing the refused identifier with no signal that it was ever seen"
      - path: "scripts/board-model.ts"
        issue: "`joinSnapshot`'s `row-without-file` derivation has no way to distinguish 'no file exists' from 'a file exists and was refused by the grammar' once the tickets source reports `ok`"
    missing:
      - "Carry the file stem of every ticket the grammar refuses (not just I/O failures) into the join, and either suppress a `row-without-file` for an identifier that was refused rather than absent, or state an honest reason (e.g. 'exists and was refused by the ticket grammar') instead of 'no ticket file carries that identifier'; add a `board-read.test.ts` case planting exactly this shape and asserting zero `row-without-file` for it"
  - truth: "The dashboard CANNOT write: an import-graph guard proves its module tree holds no mutating `node:fs` symbol."
    status: failed
    reason: "Independently reproduced twice against the current tree. (1) Appending `import { writeHeapSnapshot } from \"node:v8\"; export const dump = (p) => writeHeapSnapshot(p);` to the committed `scripts/board-read.js` and running `npm run check:dashboard-readonly` yields 59/59 passing, exit 0 — a fully green safety gate over a module that creates and writes an arbitrary file. `node:v8` is not `node:fs`, so it is invisible to every predicate in the guard (the `BANNED_MODULES` deny-list omits it; `bareSpecifiers` is never pinned as a two-sided allow-list). (2) Appending `const m = process.getBuiltinModule(\"node:\" + \"fs\"); export const w = (p) => m.writeFileSync(p, \"x\");` likewise yields 59/59 passing — a runtime-assembled module identity is invisible to the fs-namespace-binding rule entirely. This second case is a previously-named residual (32-11's own docblock, logged in `.planning/WINDOWS.md`) that the phase's own gap-closure round 1 measured but explicitly left open (finding F-03 in `32-14-ADVERSARIAL-REVIEW.md`); the first case (`node:v8`) is a NEW finding from this verification round, requiring no obfuscation at all — an ordinary import from a builtin the deny-list simply does not name."
    artifacts:
      - path: "scripts/board-readonly.test.ts"
        issue: "The module-identity rule (`BANNED_MODULES`) is a hand-typed deny-list of fifteen names rather than an allow-list of the builtins the dashboard closure may reach, so any builtin outside that list — including `node:v8` (`writeHeapSnapshot`), `node:sqlite` (`DatabaseSync`), and `process.report.writeReport` with no import at all — writes a file with nothing noticing; separately, the fs-namespace escape/re-entry rule only fires on an identifier bound to a literal `\"node:fs\"` (or `\"fs\"`) specifier, so a runtime-assembled specifier string defeats it by construction"
    missing:
      - "Invert the module rule to an allow-list of builtins the dashboard closure may reach, pinned two-sided (32-REVIEW.md WR-02's sketch); separately, either constant-fold the argument to `process.getBuiltinModule`/`require`-equivalent calls or refuse any call to those functions outright when the module identity cannot be proven at analysis time (F-03's fix is still undecided per the phase's own docblock — this is not a small closure)"
  - truth: "`--json`, `--once`, non-TTY modes work; renderer degrades visibly; snapshot shape stable; zero runtime deps; no listening socket (DASH-07, DASH-08)"
    status: partial
    reason: "The primary claims hold: `--once --json` from a non-TTY pipe still produces exactly one parseable JSON document with a stable `schemaVersion: 1` shape, `--once` still exits 0, and `package.json` still carries no `dependencies` key. But independently reproduced: a ticket title carrying the 8-bit CSI (U+009B) and OSC (U+009D) introducers survives into the published `--json` stdout document verbatim (2 raw C1 code points measured in the captured output), even though this round's CR-05 fix (32-13) made the module header claim 'every string that reaches EITHER CHANNEL goes through `sanitizeCell` first'. `JSON.stringify` escapes C0/DEL but not C1, and the stdout write path (`emit`'s JSON arm) has no sanitizing chokepoint the way `warn` is for stderr. This is 32-REVIEW.md's CR-02 (fresh code review), a terminal-injection-adjacent gap on the one channel a human piping `--json` into a terminal actually sees, and it is not covered by any must-have this round's plans scoped (32-13's own must-haves name stderr and argv only). Recorded here as a caveat on an otherwise-verified truth, per this project's convention of not inventing a sixth numbered truth for a cross-cutting finding."
    artifacts:
      - path: "scripts/board-dashboard.ts"
        issue: "`emit`'s stdout JSON write has no sanitizing chokepoint; the module header's 'either channel' claim is false for stdout"
    missing:
      - "Add a stdout chokepoint (e.g. a `say()` wrapper around every stdout write) that runs `sanitizeCell` over the serialized document before writing, generalize the AST-derived write-site census to cover stdout the way it already covers stderr, and add a case planting a C1 code point in a ticket title that asserts none reaches the captured `--json` stdout"
deferred: []
advisory:
  - finding: "The single-ticket-frontmatter-authority census (`scripts/validate.test.ts`, `findTicketReaders`) is defeated by rewriting the deleted reader with `new RegExp(...)` instead of a regex literal, and by a function whose parameter has no `string` type annotation — independently reproduced (0 findings for a probe rewrite of the exact deleted reader). No second ticket-frontmatter authority exists on the current tree today; this is a detection-robustness gap in the proof, not a live second authority, so it is recorded as advisory rather than as a gap against DASH-01."
    category: architectural
    reason: "32-REVIEW.md's WR-01, corroborated independently. The census's discrimination case only plants the deleted reader byte-for-byte, so it proves the derivation catches that spelling and not that capability — a class this project has paid for before (P29/P31)."
    evidence_status: "reproduced (probe run against the census's own derivation logic, 0 carriers detected)"
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification:
  - test: "Exercise the directory-level `fs.watch` + mandatory poll floor + debounce over a multi-second window against a real edit (rename-based atomic write) to `plans/board.md`."
    expected: "The dashboard re-renders within the documented poll floor even if a watch handle is orphaned by the atomic rename, and a watch-arm failure surfaces as a diagnosable state rather than silently stopping updates."
    why_human: "Requires a multi-second real-time observation window this verification's time budget does not cover; code inspection shows the poll-floor constant and re-arm logic present, but the timing behavior itself was not independently exercised live, consistent with round 1's disposition of DASH-04."
---

# Phase 32: Board Projector & CLI Dashboard Verification Report

**Phase Goal:** The operator watches the factory live from one read-only terminal view, fed by a single board-grammar authority whose typed snapshot a future web renderer could consume unchanged.
**Verified:** 2026-09-15T03:55:00Z
**Status:** gaps_found
**Re-verification:** Yes — gap-closure round 1 (plans 32-09..32-14), re-testing `32-VERIFICATION.md`'s round-1 `gaps_found` (2/5) verdict

## Goal Achievement

### Method

Every reproduction below was run independently by this verifier against the current tree (build parity confirmed first: `npm run build && npm run check:build-parity` → exit 0, no tracked `.js` moved), not copied from `32-REVIEW.md` or `32-14-ADVERSARIAL-REVIEW.md`. Those two documents were read and treated as leads, not as evidence — per the project's own recorded lesson that a green suite, and even a detailed self-review, is not proof of a safety invariant. Disposable fixtures were used under `/private/tmp/.../scratchpad/verify32`, all copies of `scripts/fixtures/board-snapshot/`; nothing under the repository root was left modified (probes appended to `scripts/board-read.js` were always restored from a `.bak` copy and diffed clean before deletion).

### Observable Truths

Truths derived from the five roadmap success criteria (unchanged framing from round 1's verification).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `board-model.ts` is the ONLY board grammar; column-heading parser extracted/deleted from `validate-agent-factory.ts`; row/WIP grammars pinned by spec + fuzz suite (DASH-01, DASH-02) | ✓ VERIFIED (caveat) | `frontMatter()`/`FrontMatter` confirmed absent from `validate-agent-factory.ts` and its committed `.js` (`grep -c` → 0 both); `checkTickets()` imports and calls `parseTicketDocument` (line 78, 736); `board-model.ts`'s docblock now states the deletion in the present tense, naming plan 32-12 and CR-06. Caveat: the census proving "exactly one reader" is itself defeatable — independently reproduced (see Advisory, WR-01) — though no live second authority exists on the tree today. |
| 2 | One typed `FactorySnapshot` joins board, ticket frontmatter, queue, context, traceability, and surfaces disagreement in `conflicts[]` (DASH-03) | ✓ VERIFIED (caveat) | Confirmed live: `--once --json` on a pristine fixture produces one `FactorySnapshot`, `schemaVersion: 1`, populated `conflicts[]` with real disagreements. Caveat: under the gap-3 failure mode below, `conflicts[]` is populated with a fabricated entry rather than an honest one — attributed to the read-degradation gap (truth #3), consistent with round 1's framing of this same caveat. |
| 3 | Directory-level `fs.watch` + mandatory poll + debounce; never renders a torn read, partial parse, or ENOENT as an empty board — stale snapshot shows a visible stale badge (DASH-04, DASH-05) | ✗ FAILED | The three round-1 reproductions for this truth (EACCES→clean board, one non-UTF-8 byte→permanent torn, symlink escape) are independently confirmed CLOSED (see Independent Reproduction Transcripts). But a NEW, independently reproduced sibling-arm bypass keeps this truth failed: a ticket file that exists and is readable, but is refused by the grammar (e.g. an unknown key), still produces a fabricated `row-without-file` conflict and an `[ok]` header with no stale badge — the exact failure class CR-02's fix was supposed to close, reached one register over. See gap 1. |
| 4 | The dashboard CANNOT write: import-graph guard proves no mutating `node:fs` symbol reachable (DASH-06) | ✗ FAILED | The round-1 reproduction (namespace destructure) is independently confirmed CLOSED. But two independently reproduced live bypasses remain: `node:v8`'s `writeHeapSnapshot` (an ordinary, unobfuscated import — new finding, this verification) and a runtime-assembled `node:fs` identity via `process.getBuiltinModule` (a previously-named residual, F-03, now independently re-confirmed). Both leave `npm run check:dashboard-readonly` fully green (59/59) over a module that writes files. This is the phase's stated mechanical safety centerpiece, and the claim "proves its module tree holds no mutating `node:fs` symbol" is false on the current tree for any module reaching a write capability through a route other than a literal `node:fs`-bound namespace. See gap 2. |
| 5 | `--json`, `--once`, non-TTY modes work; renderer degrades visibly; snapshot shape stable; zero runtime deps; no listening socket (DASH-07, DASH-08) | ✓ VERIFIED (caveat) | Confirmed live: `--once --json` from a non-TTY pipe produces one parseable document; `--once` exits 0; `package.json` has no `dependencies` key (only dev-only `@types/node`, `typescript`, `vitest`). Caveat: independently reproduced — a C1 control code point (CSI/OSC) planted in a ticket title survives unsanitized into the `--json` stdout document, contradicting the module header's own "either channel" claim (introduced by this round's CR-05 fix). Not one of the five numbered roadmap truths verbatim; recorded as a supporting finding (gap 3) rather than a truth failure, consistent with round 1's treatment of the analogous CR-04 finding. |

**Score:** 3/5 truths verified (up from round 1's 2/5)

### Independent Reproduction Transcripts (verifier-run this round, not copied from 32-REVIEW.md / 32-14-ADVERSARIAL-REVIEW.md)

**Premise check:**
```
$ npm run build && npm run check:build-parity
tsc: no diagnostics
Build parity: no tracked build output moved when tsc ran.
```

**Original CR-01 (namespace destructure) — CONFIRMED CLOSED.** Appended verbatim to `scripts/board-read.js`:
```
import * as __fsns_probe from "node:fs";
const { writeFileSync: __wfs_probe, rmSync: __rm_probe } = __fsns_probe;
export function __nuke_probe(p) { __wfs_probe(p, "x"); __rm_probe(p); }
```
`npm run check:dashboard-readonly` → **4 failed | 55 passed (59)**, exit 1. File restored, `git diff --exit-code -- scripts/board-read.js` clean.

**Original CR-02 (EACCES) — CONFIRMED CLOSED.** `chmod 000` on a copy's `plans/tickets/`:
```
$ node scripts/board-dashboard.js t7 --once
... [stale]  STALE: tickets (never read, EACCES)  4 conflicts
$ node scripts/board-dashboard.js t7 --once --json | jq '.readErrors[] | select(.source=="tickets")'
{"source":"tickets","code":"EACCES", ...}
```
Zero `row-without-file` in the conflicts list. Directory mode restored afterward.

**Original CR-04 (symlink escape) — CONFIRMED CLOSED.**
```
$ ln -sf $SCR/outside-secret.txt t5/plans/tickets/ZZZ-999.md
$ node scripts/board-dashboard.js t5 --once --json > out 2> err
$ grep -c SECRET out err
out:0
err:0
```
`readErrors` carries one `code: "OUTSIDE-ROOT"` entry naming the entry and destination, quoting no byte of the target.

**NEW finding — CR-01 sibling-arm bypass (grammar refusal fabricates `row-without-file`) — CONFIRMED OPEN.** On a copy with an added board row `[ABC-900]` and a readable `plans/tickets/ABC-900.md` carrying an unrecognized key:
```
$ node scripts/board-dashboard.js t1 --once
... [ok]  10 conflicts
  row-without-file
    ABC-900 Backlog  expected: plans/tickets/ABC-900.md  actual: no ticket file…
$ node scripts/board-dashboard.js t1 --once --json | jq '.readErrors, (.conflicts[]|select(.kind=="row-without-file"))'
[{"source":"tickets","code":"unknown-key",...}]
{"kind":"row-without-file","ticketId":"ABC-900",...,"actual":"no ticket file carries that identifier"}
```
`ABC-900.md` exists and is independently confirmed readable. No stale badge shown despite a `readErrors` entry existing.

**NEW finding — DASH-06 guard green over `node:v8` writer, zero obfuscation — CONFIRMED OPEN.** Appended to `scripts/board-read.js`:
```
import { writeHeapSnapshot } from "node:v8";
export const dump = (p) => writeHeapSnapshot(p);
```
`npm run check:dashboard-readonly` → **59 passed (59)**, exit 0.

**Re-confirmed finding — DASH-06 guard green over runtime-assembled fs identity (F-03) — CONFIRMED STILL OPEN.** Appended to `scripts/board-read.js`:
```
const m = process.getBuiltinModule("node:" + "fs");
export const w = (p) => m.writeFileSync(p, "x");
```
`npm run check:dashboard-readonly` → **59 passed (59)**, exit 0.

**NEW finding — C1 control code points survive into `--json` stdout — CONFIRMED OPEN.** A ticket title rewritten to contain U+009B (CSI) and U+009D (OSC):
```
$ node scripts/board-dashboard.js t2 --once --json > out.json
$ node -e "count code points in [0x80,0x9f] over out.json"
control code points in stdout json: 2 [ 'U+009b', 'U+009d' ]
```

**Advisory — WR-01 census-defeat — CONFIRMED (advisory, no live second authority).** The deleted `frontMatter()` reader, rewritten with `new RegExp(...)`:
```
const COLUMN_RE = new RegExp("^column:\\s*(.+)$", "m");
...
```
Run through the census's own derivation logic (`ts.isRegularExpressionLiteral` / `StringKeyword`-typed-parameter arms): **0 findings** — the rewrite is invisible to the "exactly one reader" proof.

**Full suite:** `npx vitest run --exclude '**/scripts/e2e/**'` → **74 files, 4811 passed, 2 skipped**, exit 0 — green throughout every finding above, consistent with this project's own recorded lesson that a green suite is not proof of a safety invariant.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/board-model.ts` (+`.js`) | Pure board/ticket grammar, no `node:fs`, single authority | ✓ VERIFIED (grammar core + single-authority claim now true) | 4811-test suite green; docblock claim now present-tense and true |
| `scripts/board-read.ts` (+`.js`) | fs-touching read-verify-reread seam | ⚠️ HOLLOW (partial) | CR-02/03/04 closed; a grammar-refusal (vs. an I/O failure) still does not degrade the tickets source, reopening the same fabrication class one register over |
| `scripts/board-dashboard.ts` (+`.js`) | CLI renderer, TTY/non-TTY/json/watch, sanitized output | ✓ VERIFIED (stderr) / ✗ (stdout gap) | stderr chokepoint (`warn`) confirmed by code read and corroborated by review transcripts; stdout JSON write has no equivalent chokepoint (independently confirmed) |
| `scripts/board-readonly.test.ts` | Mechanical no-write guard | ✗ FAILED (bypassable) | Original CR-01 closed (confirmed); `node:v8` and runtime-assembled-identity bypasses both independently confirmed live |
| `scripts/validate-agent-factory.ts` (+`.js`) | Imports board-model, no second grammar | ✓ VERIFIED | `frontMatter()` confirmed absent; routed through `parseTicketDocument` |
| `agent-factory/contracts/board.md` | Normative spec | ✓ VERIFIED | Referenced consistently; no new contradiction found this round |
| `scripts/fixtures/board-snapshot/expected-snapshot.json` | Golden fixture | ✓ VERIFIED | Pristine-fixture run matches the golden's conflict set (9 conflicts) by inspection |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `scripts/board-dashboard.ts` | `scripts/board-read.ts` | `readSnapshot()` call in `refresh()` | ✓ WIRED | Confirmed by live runs across every reproduction above |
| `scripts/board-read.ts` | `scripts/board-model.ts` | `joinSnapshot()`/`parseBoard()`/`parseTicketDocument()` | ✓ WIRED (but the tickets-source-state signal it depends on is incomplete — see gap 1) | Confirmed by live JSON output |
| `scripts/validate-agent-factory.ts` | `scripts/board-model.ts` | `parseTicketDocument`/`boardColumnName`/`boardHasColumn`/`kebab`/`parseBoard` imports | ✓ WIRED | Single authority confirmed |
| `scripts/board-readonly.test.ts` | `scripts/board-dashboard.js` closure | `jsImportClosure` AST walk | ⚠️ WIRED BUT INCOMPLETE | Namespace-destructure/re-entry routes now closed; module-identity route (`node:v8`, runtime-assembled specifiers) remains open |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build is a faithful build of its sources | `npm run build && npm run check:build-parity` | exit 0, no tracked `.js` moved | ✓ PASS |
| `--once --json` prints one parseable JSON document | `node scripts/board-dashboard.js t1 --once --json \| jq .` | valid single document | ✓ PASS |
| `--once` exits 0 with conflicts present | `node scripts/board-dashboard.js t1 --once; echo $?` | `0` | ✓ PASS |
| Namespace-destructure bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 1, 4 failed | ✓ PASS (confirms original CR-01 closed) |
| `node:v8` writer bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 0, 59/59 | ✗ FAIL (new bypass) |
| Runtime-assembled fs identity bypass of DASH-06 guard | plant + `npm run check:dashboard-readonly` | exit 0, 59/59 | ✗ FAIL (confirms F-03 still open) |
| EACCES on `plans/tickets/` yields stale badge / readError | `chmod 000` + `--once`/`--once --json` | `[stale]` badge, readError present, 0 fabricated conflicts | ✓ PASS (confirms original CR-02 closed) |
| Grammar-refused-but-present ticket does not fabricate `row-without-file` | added row + unknown-key ticket + `--once --json` | `[ok]`, no badge, 1 fabricated `row-without-file` | ✗ FAIL (new bypass) |
| Symlink under `plans/tickets/` stays contained | `ln -sf` + `--once --json` | 0 bytes leaked on both channels, `OUTSIDE-ROOT` | ✓ PASS (confirms CR-04 closed) |
| C1 control code points excluded from `--json` stdout | CSI/OSC in ticket title + `--once --json` | 2 raw C1 code points present in stdout | ✗ FAIL (new finding) |
| Full suite green | `npx vitest run --exclude '**/scripts/e2e/**'` | 74 files, 4811 passed, 2 skipped | ✓ PASS (does not detect any of the above — the project's "green suite is not proof" lesson holds again) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DASH-01 | 32-01, 32-08, 32-12 | Single board-grammar authority | ✓ SATISFIED (caveat: WR-01 census-defeat, advisory) | `frontMatter()` confirmed deleted; docblock corrected |
| DASH-02 | 32-01, 32-02, 32-04 | Written spec + parse-oracle fuzz suite | ✓ SATISFIED | Suites green; unaffected by this round's findings |
| DASH-03 | 32-01, 32-03, 32-05, 32-09 | Typed `FactorySnapshot` joining 5 sources, `conflicts[]` | ✓ SATISFIED (mechanism); see gap 1 caveat | Live JSON confirmed; fabrication attributed to DASH-05's gap |
| DASH-04 | 32-03, 32-09 | `fs.watch` + mandatory poll + debounce | ? NEEDS HUMAN | Timing not independently exercised (see human_verification) |
| DASH-05 | 32-03, 32-07, 32-09, 32-10 | Torn/ENOENT/permission never render as empty; stale badge | ✗ BLOCKED | Gap 1: grammar-refusal sibling-arm fabrication independently confirmed |
| DASH-06 | 32-06, 32-11 | Mechanical read-only guard | ✗ BLOCKED | Gap 2: `node:v8` and runtime-assembled-identity bypasses independently confirmed |
| DASH-07 | 32-01, 32-07, 32-13 | `--json`/`--once`/non-TTY modes, visible degradation | ✓ SATISFIED (caveat); see gap 3 | Live spot-checks pass; stdout C1 leak independently confirmed |
| DASH-08 | 32-01, 32-02, 32-08, 32-13 | Stable snapshot shape, zero runtime deps, no socket | ✓ SATISFIED | `package.json` confirmed dependency-free |

REQUIREMENTS.md currently marks all eight `[ ]` Not complete / "Gaps Found" — accurate to this verification's findings. No orphaned requirements (all eight IDs are claimed by at least one plan across the phase).

### Anti-Patterns Found

| File | Line (approx) | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/board-read.ts` | tickets refusal site | A grammar refusal records `readErrors` but does not degrade `sources.tickets`, so the presence gate is fed a record set with no signal the identifier was ever seen | 🛑 Blocker | Gap 1 — fabricated `row-without-file` |
| `scripts/board-readonly.test.ts` | `BANNED_MODULES` | Module-identity rule is a hand-typed deny-list, not a two-sided-pinned allow-list; misses `node:v8`, `node:sqlite`, and any runtime-assembled specifier | 🛑 Blocker | Gap 2 — DASH-06 guard bypass |
| `scripts/board-dashboard.ts` | `emit`'s JSON write path | No sanitizing chokepoint on the stdout write, contradicting the module header's "either channel" claim | 🛑 Blocker | Gap 3 — C1 code points in `--json` stdout |
| `scripts/validate.test.ts` | `findTicketReaders` | Census recognizes a ticket-frontmatter reader only by regex-literal or string-typed-parameter shape; a `new RegExp(...)` rewrite is invisible | ⚠️ Warning (advisory) | WR-01 — detection-robustness gap, no live second authority today |

No `TBD`/`FIXME`/`XXX` markers found in any file modified by this phase.

### Gaps Summary

Gap-closure round 1 made real, independently-confirmed progress: three of the four original blockers this verifier reproduced in round 1 (CR-01 namespace destructure, CR-02 EACCES fabrication, CR-04 symlink escape) are genuinely closed on the current tree, and the fifth original finding (CR-06, second grammar authority) is also genuinely closed. The score moved from 2/5 to 3/5 truths verified.

But the phase's own history repeated exactly as this project's memory predicts: **every fix this round closed reopened the identical failure class one register over**, and a fresh code review dated after the round's own adversarial self-review (`32-REVIEW.md`, 2026-09-15) caught two of the three sibling-arm bypasses before this verification did — this verification independently reproduced all three, plus re-confirmed a fourth (F-03) the round's own adversarial pass had already found and left open:

1. **The CR-02 fabrication fix only degrades the tickets source on an I/O failure, not on a grammar refusal.** A perfectly readable ticket file that the grammar refuses (an unknown key, a duplicated key, a tab, a BOM — five ordinary spellings per the review) still produces a positive, false claim that no file carries that identifier, under a header that shows `[ok]` with no stale badge. Independently reproduced.
2. **The DASH-06 mechanical no-write guard — the phase's stated safety centerpiece and CLAUDE.md's hard "mechanically enforced, not prose" rule in miniature — is bypassed by an ordinary import from a builtin the deny-list does not name (`node:v8`'s `writeHeapSnapshot`), with zero obfuscation required, and separately by a runtime-assembled module identity that was already a named, accepted residual. Both independently reproduced; `check:dashboard-readonly` reports 59/59 green over a module that writes files in both cases.
3. **The stderr-sanitization fix (CR-05) does not cover stdout**, and the module header now makes a stronger claim ("either channel") than the code delivers — a C1 control code point from board content reaches the published `--json` document verbatim. Independently reproduced.

All three are independently reproduced against the current committed `.js`, not merely re-read from the phase's own review documents, using disposable fixtures. The full `board-*` + `validate` test suite (74 files, 4811 tests) is green throughout — the project's own recorded lesson that a green suite is not proof of a safety invariant holds a further time in this same phase.

REQUIREMENTS.md correctly still marks all eight DASH-0x requirements as incomplete; ROADMAP.md correctly records the gap-closure plans without flipping the phase to Complete. Neither needs correction.

None of these three gaps match a later phase's stated goal or success criteria in ROADMAP.md (checked — Phase 33 covers Windows portability and live capture, not board-grammar authority, read-error handling, or the readonly guard), so none are deferred; all three are live gaps. This phase has used 1 of its 4-round gap-closure cap; per the project's own recorded rule, up to 3 further rounds remain before the cap forces a different resolution.

---

_Verified: 2026-09-15T03:55:00Z_
_Verifier: Claude (gsd-verifier)_
