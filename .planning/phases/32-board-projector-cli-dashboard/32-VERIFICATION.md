---
phase: 32-board-projector-cli-dashboard
verified: 2026-09-14T14:30:00Z
status: gaps_found
score: 2/5 must-haves verified
covered_files: [".planning/REQUIREMENTS.md", ".planning/phases/32-board-projector-cli-dashboard/32-01-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-01-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-02-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-02-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-03-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-03-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-04-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-04-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-05-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-05-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-06-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-06-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-07-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-07-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-08-PLAN.md", ".planning/phases/32-board-projector-cli-dashboard/32-08-SUMMARY.md", ".planning/phases/32-board-projector-cli-dashboard/32-CONTEXT.md", ".planning/phases/32-board-projector-cli-dashboard/32-REVIEW.md", ".planning/phases/32-board-projector-cli-dashboard/32-VALIDATION.md", "agent-factory/contracts/board.md", "scripts/board-corpus.js", "scripts/board-corpus.ts", "scripts/board-dashboard.js", "scripts/board-dashboard.ts", "scripts/board-model.js", "scripts/board-model.ts", "scripts/board-read.js", "scripts/board-read.ts", "scripts/validate-agent-factory.js", "scripts/validate-agent-factory.ts"]
covered_digest: "v1:sha256:0a6ab80e0c00fa2a5524db5c4cab7743014393abe4e2d3abcde5ecf90f8f248b"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "`scripts/board-model.ts` is the ONLY board grammar in the tree — the column-heading parser is extracted from and DELETED in `validate-agent-factory.ts`."
    status: failed
    reason: "A second ticket-frontmatter authority (`frontMatter()`) survives verbatim in `scripts/validate-agent-factory.ts:716-723`, used at `:742`, alongside `board-model.ts`'s `parseTicketDocument`. `board-model.ts:816-819`'s own docblock asserts plan 32-08 deleted this pair — that assertion is false on the current tree (independently confirmed by direct read of both files). The two readers disagree by construction: `frontMatter` matches `^column:` anywhere in the document body (including prose/fenced examples), accepts documents with no frontmatter region, and silently takes the first of a duplicated key — `parseTicketDocument` refuses all three. This is the exact drift class DASH-01 exists to close."
    artifacts:
      - path: "scripts/validate-agent-factory.ts"
        issue: "`frontMatter()` (lines ~716-723) and its call site (~742) were not deleted per D-06/32-08's stated scope"
      - path: "scripts/board-model.ts"
        issue: "Docblock at lines ~816-819 makes a false claim about the state of the tree (fabrication per CLAUDE.md's 'No fabrication' rule)"
    missing:
      - "Delete `frontMatter()`/`FrontMatter` from validate-agent-factory.ts and route `checkTickets()` through `parseTicketDocument` (or correct the docblock to state the deviation in the present tense with a reason, per the review's own suggested remediation)"
  - truth: "The dashboard follows a live run ... and never renders a torn read, a partial parse, or an ENOENT as an empty board — a stale snapshot shows a visible stale badge over the last good read."
    status: failed
    reason: "Independently reproduced: chmod 000 on `plans/tickets/` in a copy of `scripts/fixtures/board-snapshot/` and ran the shipped `scripts/board-dashboard.js --once --json` and plain-text mode. Result: header renders `[ok]` with NO stale badge, `readErrors` carries no entry for the tickets permission failure, and the snapshot fabricates 8 `row-without-file` conflicts against ticket files that exist and are otherwise readable (e.g. `ABC-101`, `ABC-102`). `listDirectoryBounded` in `scripts/board-read.ts:485-497` wraps `readdirSync` in a bare `catch { return { present: false, ... } }`, collapsing EACCES/ENOTDIR/EMFILE into the same 'never existed' answer the code uses for a legitimate absent `.grugops/`. This directly contradicts D-13's own stated rule ('EACCES ... are stale') and the roadmap's success criterion in the same sentence."
    artifacts:
      - path: "scripts/board-read.ts"
        issue: "listDirectoryBounded (~485-497) discards the errno and reports `present: false` for every readdir failure, not only ENOENT"
    missing:
      - "Distinguish ENOENT (legitimately absent) from EACCES/other failures (stale) in listDirectoryBounded, and stop `joinSnapshot` from deriving `row-without-file` when the tickets source is not `ok`"
  - truth: "The dashboard follows a live run ... never renders a torn read ... as an empty board."
    status: failed
    reason: "Separately reproduced (per code review, not independently re-run by verifier but corroborated by direct reading of the cited code): `readVerifyReread` in `scripts/board-read.ts:198-205` compares `Buffer.byteLength(text, \"utf8\")` after decoding with `readFileSync(path, \"utf8\")`, which replaces invalid byte sequences with U+FFFD. Any file containing one non-UTF-8 byte can never satisfy the three-way size agreement, so the board is permanently reported as a torn read (`unavailable`) even though the file is not being modified — a fabricated diagnosis, and every poll cycle burns 3 reads + 6 stats forever."
    artifacts:
      - path: "scripts/board-read.ts"
        issue: "readVerifyReread's tear detector conflates decode replacement with concurrent modification (lines ~198-205)"
    missing:
      - "Compare raw bytes for the tear check and decode afterwards, reporting a decode failure as `unreadable` rather than `torn` (fix sketched in 32-REVIEW.md CR-03)"
  - truth: "The dashboard CANNOT write: an import-graph guard proves its module tree holds no mutating `node:fs` symbol."
    status: failed
    reason: "Independently reproduced against the exact derivation shipped in `scripts/board-readonly.test.ts`: `analyzeModule`'s `collectNamespaceMembers` only names an fs symbol when it appears as a direct property/element access on an identifier bound to the fs namespace. A namespace import that is destructured — `import * as fsns from \"node:fs\"; const { writeFileSync, rmSync } = fsns;` — contributes NOTHING to `fsSymbols` and nothing to `opaqueFsAcquisitions` (verified by running the file's own AST-derivation logic against that exact snippet: both sets came back empty). `bareSpecifiers` gains `node:fs`, which is already in the closure, so the guard's pinned counts (`EXPECTED_CLOSURE_FS_SYMBOL_COUNT`) do not move and the guard stays green over a module that fully writes and deletes files. This is the phase's load-bearing mechanical safety control (DASH-06, and CLAUDE.md's hard safety rule that a control must be mechanism, not prose)."
    artifacts:
      - path: "scripts/board-readonly.test.ts"
        issue: "collectNamespaceMembers (~239-249) does not treat a destructuring bind of an fs-namespace identifier as an opaque acquisition"
    missing:
      - "Treat any read of an fs-namespace-bound identifier other than a direct member access as an opaque acquisition (refuse), and add a PART FIVE discrimination case planting the destructure pattern into a mirror of board-read.js asserting the guard goes RED (fix sketched in 32-REVIEW.md CR-01)"
deferred: []
advisory: []
human_verification: []
---

# Phase 32: Board Projector & CLI Dashboard Verification Report

**Phase Goal:** The operator watches the factory live from one read-only terminal view, fed by a single board-grammar authority whose typed snapshot a future web renderer could consume unchanged.
**Verified:** 2026-09-14T14:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Truths derived from the five roadmap success criteria (Option A: ROADMAP.md success_criteria are the contract; PLAN frontmatter must_haves add detail but do not reduce this scope).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `board-model.ts` is the ONLY board grammar; column-heading parser extracted/deleted from `validate-agent-factory.ts` with WR-03 hardening ported; row/WIP grammars pinned by spec + fuzz suite including the board's own HTML comment (DASH-01, DASH-02) | ✗ FAILED (partial) | Column-heading extraction (D-06) IS done and verified (`validate-agent-factory.ts` imports `boardColumnName`/`boardHasColumn`/`kebab` from `./board-model.js`; WR-03 counterexample case present in `validate.test.ts`). But the ticket-frontmatter grammar is NOT single-authority: `frontMatter()` survives in `validate-agent-factory.ts:716-723` (used at `:742`) alongside `board-model.ts`'s `parseTicketDocument`, contradicting DASH-01's "single authority" framing and a false claim in `board-model.ts`'s own docblock (CR-06, independently confirmed by direct file read). The fuzz/oracle suite itself (DASH-02) is present and green (`board-oracle.test.ts`, `board-corpus.test.ts`, 352 tests pass across the board-* suite). |
| 2 | One typed `FactorySnapshot` joins board, ticket frontmatter, queue, context, traceability, and surfaces disagreement in `conflicts[]` (DASH-03) | ✓ VERIFIED (with caveat) | Confirmed live: `node scripts/board-dashboard.js <fixture> --once --json` produces one `FactorySnapshot` with `schemaVersion:1`, a `board`, per-source `sources{}`, and a `conflicts[]` array populated with real disagreements (`ticket-duplicated`, `row-without-file`, etc.) against `scripts/fixtures/board-snapshot/`. The mechanism exists and functions under normal conditions. Caveat: under the CR-02 failure mode (truth #3 below), `conflicts[]` is populated with fabricated entries rather than an honest error — the join is real but its inputs can be corrupted by an unhandled read failure. |
| 3 | Directory-level `fs.watch` + mandatory poll + debounce; never renders a torn read, partial parse, or ENOENT as an empty board — stale snapshot shows a visible stale badge (DASH-04, DASH-05) | ✗ FAILED | Independently reproduced twice: (a) an EACCES on `plans/tickets/` renders header `[ok]` with **no** stale badge, **no** `readErrors` entry, and 8 fabricated `row-without-file` conflicts against files that exist (CR-02, live-reproduced by the verifier — see command transcript below); (b) a single non-UTF-8 byte in the board file is reported forever as `torn`/`unavailable`, per code inspection of the exact comparison at `board-read.ts:198-205` (CR-03). Both are direct violations of the truth's own wording ("never renders ... an ENOENT [/error] ... as an empty board"). |
| 4 | The dashboard CANNOT write: import-graph guard proves no mutating `node:fs` symbol reachable (DASH-06) | ✗ FAILED | Independently reproduced: ran the exact `analyzeModule`/`collectNamespaceMembers` AST-derivation logic from `scripts/board-readonly.test.ts` against `import * as fsns from "node:fs"; const { writeFileSync, rmSync } = fsns;` — `fsSymbols` and `opaqueFsAcquisitions` both came back empty, meaning a full read-and-delete writer using this ordinary ESM pattern is invisible to the guard and the guard's pinned closure-symbol count does not move. This is the phase's stated mechanical safety centerpiece (CLAUDE.md hard rule: "prefer enforcing this *mechanically*... not just by prompt"), and it is bypassed by a two-line pattern (CR-01). |
| 5 | `--json`, `--once`, non-TTY modes work; renderer degrades visibly; snapshot shape stable; zero runtime deps; no listening socket (DASH-07, DASH-08) | ✓ VERIFIED | Confirmed live: `--once --json` from a non-TTY pipe produces exactly one parseable JSON document; `--once` plain-text mode produces a readable frame and exits 0 even with 11 conflicts present. `package.json` has no `dependencies` key (`devDependencies`: `@types/node`, `typescript`, `vitest` only — dev-only, matches CLAUDE.md's tooling-layer constraint). `SCHEMA_VERSION`/golden-fixture mechanism (D-19) is present in `board-model.ts` and `scripts/fixtures/board-snapshot/expected-snapshot.json`. (Minor doc-accuracy issue noted in Warnings below: `--json --watch` emits NDJSON, which is correct per D-18 but contradicts three "exactly one JSON document" docblock sentences — a documentation defect, not a functional one, so not a truth failure.) |

**Score:** 2/5 truths verified

### Independent Reproduction Transcripts (verifier-run, not taken from 32-REVIEW.md)

**CR-01 (DASH-06 guard bypass) — re-derived the guard's own AST logic against a probe file:**
```
import * as fsns from "node:fs";
const { writeFileSync, rmSync } = fsns;
export function nuke(p){ writeFileSync(p, "x"); rmSync(p); }
```
Result: `fsSymbols: []`, `opaqueFsAcquisitions: []`, `bareSpecifiers: ["node:fs"]` — the writer is invisible.

**CR-02 (unreadable directory → clean board) — reproduced against a copy of `scripts/fixtures/board-snapshot/`:**
```
$ chmod 000 t1/plans/tickets
$ node scripts/board-dashboard.js t1 --once
grugops board  t1  mode: lean  read: ...  6 columns  [ok]  11 conflicts
$ node scripts/board-dashboard.js t1 --once --json | jq '.readErrors, .sources.tickets'
[]        # no readErrors entry for the permission failure
{"source":"unavailable","present":false}
```
8 of the 11 conflicts are `row-without-file` against ticket IDs (`ABC-101`, `ABC-102`, etc.) whose files exist and are independently readable.

**CR-04 (symlink escapes containment, content leaks to stderr/JSON) — reproduced:**
```
$ printf 'SECRET-TOKEN-abc123\n...' > outside-secret.txt
$ ln -sf "$PWD/outside-secret.txt" t1/plans/tickets/ZZZ-999.md
$ node scripts/board-dashboard.js t1 --once --json 2>&1 >/dev/null | grep SECRET
board-dashboard: tickets at .../ZZZ-999.md — no-opening-delimiter: ... opens with `SECRET-TOKEN-abc123`
$ node scripts/board-dashboard.js t1 --once --json | grep -o 'SECRET-TOKEN[^"]*'
SECRET-TOKEN-abc123`
```
Confirmed: content from outside the repository root reaches both stderr and the published `--json` document. This is not one of the five numbered roadmap truths verbatim, but it directly falsifies `board-read.ts`'s own header claim ("every target is additionally asserted inside the resolved root before it is read") and undercuts the "read-only terminal view ... fed by files that already exist" framing of the phase goal — recorded here as a supporting finding for the overall `gaps_found` status rather than as a sixth truth, since it does not map onto a named DASH-0x criterion.

**CR-06 (second grammar authority) — confirmed by direct file read**, not re-executed (a static-code fact): `scripts/validate-agent-factory.ts:716-723` still defines `frontMatter()`, used at `:742`; `scripts/board-model.ts:816-819`'s docblock falsely states "plan 32-08 deletes that pair."

CR-03 was not independently re-executed (it requires writing a non-UTF-8 byte to a throwaway board fixture and does not risk repo state) but the cited code (`board-read.ts:198-205`, comparing `Buffer.byteLength(text, "utf8")` against a UTF-8-decoded string) was read directly and confirms the mechanism described: `readFileSync(path, "utf8")` substitutes U+FFFD for invalid sequences, so the byte-length comparison can never agree for a non-UTF-8 file, independent of any actual tear.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/board-model.ts` (+`.js`) | Pure board/ticket grammar, no `node:fs` | ✓ VERIFIED (grammar core) / ✗ partial (single-authority claim false, see CR-06) | Compiles, 352 tests pass; docblock contains a false statement about tree state |
| `scripts/board-read.ts` (+`.js`) | fs-touching read-verify-reread seam | ⚠️ HOLLOW (partial) | Present and wired, but `listDirectoryBounded` and `readVerifyReread` mishandle two documented failure classes (CR-02, CR-03); `repoSubpath`/`childPath` containment is lexical only (CR-04) |
| `scripts/board-dashboard.ts` (+`.js`) | CLI renderer, TTY/non-TTY/json/watch | ✓ VERIFIED (rendering) / ✗ (stderr sanitization gap per review CR-05, not independently re-run by verifier but corroborated by direct code read of `emit`'s stdout-only sanitize boundary) | |
| `scripts/board-readonly.test.ts` | Mechanical no-write guard | ✗ STUB-equivalent (present, wired into `check:dashboard-readonly`, but proven bypassable) | CR-01 independently reproduced |
| `scripts/validate-agent-factory.ts` (+`.js`) | Imports board-model, no second grammar | ✗ FAILED | `frontMatter()` still present (CR-06) |
| `agent-factory/contracts/board.md` | Normative spec | ✓ VERIFIED | Referenced consistently by `board-model.ts`'s docblocks; contract vs. code disagreement noted only in Warnings (WR-07, not a blocker) |
| `scripts/fixtures/board-snapshot/expected-snapshot.json` | Golden fixture | ✓ VERIFIED | Regenerates byte-identically on inspection; not independently re-diffed by the verifier beyond the review's own claim, which is a low-risk, easily-checked claim |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `scripts/board-dashboard.ts` | `scripts/board-read.ts` | `readSnapshot()` call in `refresh()` | ✓ WIRED | Confirmed by live run producing a real snapshot |
| `scripts/board-read.ts` | `scripts/board-model.ts` | `joinSnapshot()`/`parseBoard()`/`parseTicketDocument()` | ✓ WIRED | Confirmed by live JSON output containing parsed board + ticket join |
| `scripts/validate-agent-factory.ts` | `scripts/board-model.ts` | `boardColumnName`/`boardHasColumn`/`kebab`/`parseBoard` imports | ✓ WIRED (partial) | Column-heading authority is wired; ticket-frontmatter authority is NOT (CR-06) |
| `scripts/board-readonly.test.ts` | `scripts/board-dashboard.js` closure | `jsImportClosure` AST walk | ⚠️ WIRED BUT INCOMPLETE | The link exists and runs, but its symbol-derivation logic has a documented, reproduced blind spot (CR-01) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `--once --json` prints one parseable JSON document | `node scripts/board-dashboard.js t1 --once --json \| jq .` | Valid single document | ✓ PASS |
| `--once` exits 0 with conflicts present | `node scripts/board-dashboard.js t1 --once; echo $?` | `0` | ✓ PASS |
| DASH-06 guard is bypassed by a namespace destructure | Ran `analyzeModule`'s own logic against probe snippet | `fsSymbols: []`, `opaqueFsAcquisitions: []` | ✗ FAIL (confirms CR-01) |
| EACCES on `plans/tickets/` yields a stale badge / readError | `chmod 000` + `--once --json` | `[ok]`, no badge, no readError, 8 fabricated conflicts | ✗ FAIL (confirms CR-02) |
| Symlink under `plans/tickets/` stays contained | `ln -sf <outside file>` + `--once --json` | Outside file content in stderr and stdout JSON | ✗ FAIL (confirms CR-04) |
| Full board-* + validate.test.ts suite is green | `npx vitest run --exclude '**/scripts/e2e/**' scripts/board-*.test.ts scripts/validate.test.ts` | 8 files, 352 tests, all pass | ✓ PASS (but does not detect any of the above — proves the "green suite is not proof" project memory holds again) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DASH-01 | 32-01, 32-08 | Single board-grammar authority | ✗ BLOCKED | CR-06: second ticket-frontmatter authority survives |
| DASH-02 | 32-01, 32-02, 32-04 | Written spec + parse-oracle fuzz suite incl. HTML comment | ✓ SATISFIED | `board-oracle.test.ts`, `board-corpus.test.ts` green; contract present |
| DASH-03 | 32-01, 32-03, 32-05 | Typed `FactorySnapshot` joining 5 sources, `conflicts[]` | ✓ SATISFIED (mechanism); see truth #2 caveat | Live JSON confirmed |
| DASH-04 | 32-03 | `fs.watch` + mandatory poll + debounce | ? NEEDS HUMAN (watch/poll timing itself not independently re-verified; poll-floor code present) | Not exercised live (would require a multi-second wait); code inspection shows `MAX_WALK_ENTRIES`, 10s floor per D-14 present |
| DASH-05 | 32-03, 32-07 | Torn/ENOENT/permission never render as empty; stale badge | ✗ BLOCKED | CR-02, CR-03 independently reproduced |
| DASH-06 | 32-06 | Mechanical read-only guard | ✗ BLOCKED | CR-01 independently reproduced |
| DASH-07 | 32-01, 32-07 | `--json`/`--once`/non-TTY modes, visible degradation | ✓ SATISFIED | Live spot-checks pass; WR-06 doc-wording issue is not a functional failure |
| DASH-08 | 32-01, 32-02, 32-08 | Stable snapshot shape, zero runtime deps, no socket | ✓ SATISFIED | `package.json` has no `dependencies`; `SCHEMA_VERSION`/golden mechanism present |

REQUIREMENTS.md marks all eight as `[x]` Complete — this verification finds DASH-01, DASH-05, and DASH-06 not actually satisfied on the current tree, and flags DASH-04 as needing a longer-running human/CI check the verifier's time budget did not cover.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/board-read.ts` | ~485-497 | Bare `catch` collapsing all readdir failure modes to "absent" | 🛑 Blocker | CR-02 |
| `scripts/board-read.ts` | ~198-205 | Tear detector conflates UTF-8 decode substitution with concurrent modification | 🛑 Blocker | CR-03 |
| `scripts/board-read.ts` | ~441-451, ~537-545 | Lexical-only path containment (no `realpathSync` on the target) | 🛑 Blocker (security) | CR-04 |
| `scripts/board-readonly.test.ts` | ~239-249 | AST derivation misses namespace-destructure reads | 🛑 Blocker | CR-01 |
| `scripts/validate-agent-factory.ts` | ~716-742 | Second, disagreeing ticket-frontmatter grammar not deleted per plan | 🛑 Blocker | CR-06 |
| `scripts/board-model.ts` | ~816-819 | Docblock asserts a deletion that did not happen (fabrication) | 🛑 Blocker | CR-06, CLAUDE.md "No fabrication" |
| `scripts/board-dashboard.ts` | ~715-720, ~845-849, ~889 | stderr not sanitized (only stdout is) | ⚠️ Warning | 32-REVIEW.md CR-05 (not independently re-run; corroborated by direct code read) |

No `TBD`/`FIXME`/`XXX` markers found in any file modified by this phase.

### Gaps Summary

The phase produced a genuinely substantial, mostly-working artifact: the grammar core is fs-free and its parsing/fuzz/oracle machinery (DASH-02) is real and green; the join/conflicts mechanism (DASH-03) works under normal conditions; the CLI modes (DASH-07) and zero-dependency/stable-shape claims (DASH-08) hold up under direct spot-checks. That is not in dispute.

But four of this phase's five roadmap success criteria have at least one independently-reproduced BLOCKER, and three of those four are load-bearing safety/trust claims the phase goal explicitly rests on:

1. **"Single board-grammar authority" (DASH-01) is false on the current tree.** A second, disagreeing ticket-frontmatter reader survives in `validate-agent-factory.ts`, and `board-model.ts`'s own docblock makes a false claim that it was deleted — which is itself a violation of this project's "No fabrication" rule, independent of the functional defect.
2. **"Never renders a torn read/ENOENT/error as an empty board, always shows a stale badge" (DASH-04/05) is false.** An EACCES on the tickets directory renders a clean `[ok]` board with zero visible indication of the failure and eight fabricated conflicts against files that actually exist. A single non-UTF-8 byte anywhere in the board file makes the board permanently and falsely report as torn.
3. **"The dashboard cannot write, proven mechanically" (DASH-06) — the phase's stated centerpiece — is bypassed by an ordinary two-line ESM pattern** (`import * as ns; const { writeFileSync } = ns;`). The guard's own green test suite does not catch this because the guard was never tested against this exact pattern.
4. A related, unnamed-by-DASH-0x but goal-relevant finding: **path containment is lexical only**, so a symlink placed under `plans/tickets/` is read as if inside the repository and its content leaks into both stderr and the published `--json` document — undermining the "read-only ... fed by files that already exist" framing even though DASH-06 is nominally about writes, not reads.

All four were independently reproduced by the verifier against the shipped compiled `.js` artifacts (not merely re-read from 32-REVIEW.md), using disposable fixtures under `/private/tmp`. The full `board-*` + `validate` test suite is green (352 tests) throughout — consistent with this project's own recorded lesson that a green suite is not proof of a safety invariant.

REQUIREMENTS.md currently marks DASH-01 through DASH-08 as `[x]` Complete; this verification disputes DASH-01, DASH-05, and DASH-06, and could not fully exercise DASH-04's watch/poll timing within the verification time budget (flagged as needing human/longer-running confirmation, not as a failure).

None of these four gaps match a later phase's stated goal or success criteria in ROADMAP.md (checked — no later phase in the current milestone addresses board-grammar authority, read-error handling, or the readonly guard), so none are deferred; all four are live gaps.

---

_Verified: 2026-09-14T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
