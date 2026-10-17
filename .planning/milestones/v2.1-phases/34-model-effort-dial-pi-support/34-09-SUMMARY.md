---
phase: 34-model-effort-dial-pi-support
plan: 09
subsystem: testing
tags: [host-registry, d-11, prose-scan, set-literal-drift, pi, hook-manifest, vitest]

requires:
  - phase: 34-02
    provides: "install/host-tools.ts HOST_TOOLS (id, name, shortName, dispatch)"
  - phase: 34-06
    provides: "registry-derived per-host table test; count-free packaging prose"
  - phase: 34-07
    provides: "count-free scope sentence with the separate Pi clause (the SCOPE_SENTENCE / PI_CLAUSE pins)"
  - phase: 34-08
    provides: "count-free install guide, README, FAQ and CLAUDE.md host lists"
provides:
  - "install/host-tools-prose.test.ts: a scan derived from `git ls-files -z` and HOST_TOOLS that fails on a host count word (Rule A) and on a host list that omits exactly one non-spawning host (Rule B), in markdown and TypeScript, with nine mutation cases and two live cases"
  - "count-free host prose in workflow 16, the role-switch protocol, the context-note contract, two caveman lines, the hook closure (context-io, dead-vocabulary, admission-guard, admission-server), the oracles and their tests"
  - "regenerated hooks/hook-entry.ts manifest"
  - "docs/audit/29-style-dispositions/34-09.md for this plan's watched-corpus clauses"
affects: [34-10, phase-34-verification]

actuals:
  tokens: 13674
  tasks: 3
  commits: 3
plan_head_before: 6aaf0917da7ac7d761ec934baee16c5ebbe6bdcb
plan_head_after: f8162f7641d4b7c1333070162224295b733cb0ae

tech-stack:
  added: []
  patterns:
    - "A prose scan reads blocks, not lines: a markdown paragraph, a TypeScript comment paragraph, or a string literal wrapped with a trailing `+`, so a phrase or list that wraps a line break is read whole"
    - "Planted fault phrases are assembled from separate constants, so the scanner's own source passes its own scan"
    - "A quoted past PASS line that carried a count is paraphrased, not re-quoted with the count changed"

key-files:
  created:
    - install/host-tools-prose.test.ts
    - docs/audit/29-style-dispositions/34-09.md
  modified:
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/roles/_role-switch-protocol.md
    - agent-factory/contracts/context-note.md
    - agent-factory/packaging/adapters.md
    - install/README.md
    - scripts/context-io.ts
    - scripts/context-io.test.ts
    - scripts/dead-vocabulary.ts
    - scripts/admission-server.ts
    - hooks/admission-guard.ts
    - hooks/hook-entry.ts
    - scripts/check-uat-oracles.ts
    - scripts/check-uat-oracles.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "Rule B judges a TypeScript line inside its block (comment paragraph or wrapped string), never alone. A block always contains its lines, so a line that names all hosts but one is still reported unless its own paragraph names the missing host. A per-line pass false-positived on a complete list wrapped across a string concatenation (context-io.ts:5728-5729), measured during Task 2."
  - "Rule A also runs over joined blocks, and the hyphen form covers `<n>-host` besides `<n>-tool`. A per-line scan missed the count phrases in dead-vocabulary.ts:16-17 and context-io.ts:177-178, 5843-5844 and context-io.test.ts:4021-4022, 16442-16443, each split across a line break."
  - "Three Rule B exemptions, all for host lists that name the hosts with a per-agent `model` field or agent-definition format, which Pi lacks (D-12): subagent.frontmatter.md R2 and R3, and the SCOPE_SENTENCE pin in model-dial-consistency.test.ts. Zero Rule A exemptions; both counts are pinned."
  - "Where a past decision named a host set (the D-12 sentence in context-io.ts and its test), the hosts are named and Pi is added with a clause saying D-12 named all of them but Pi, which phase 34 added. The meaning of D-12 is kept."
  - "The caveman lines in adapters.md (the 34-06 deferred item) and install/README.md say 'for each tool'. Rule A was not widened to 'N times' or 'N ways': those are not host nouns, and widening them would add false positives across the tree."

patterns-established:
  - "Derived prose scan: scan set from git ls-files, vocabulary from the registry, declared and counted exemptions that fail when stale, mutation proofs in a scratch git repository"

requirements-completed: [HOST-01]

coverage:
  - id: D1
    description: "Rule A (host count word) and Rule B (host list one short) catch both members of the class, by mutation in a scratch git repository"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools-prose.test.ts#the host-prose scan catches both members of the class, by mutation (plan 34-09, D-11) (9 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The live tracked markdown (711 files) and TypeScript (198 files) give zero findings outside three reasoned, counted exemptions, and no exemption is stale"
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "install/host-tools-prose.test.ts#the live tree carries no host count and no short host list (plan 34-09, D-11) (4 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hook-closure modules carry no host count, behaviour unchanged, and the manifest matches a fresh derivation"
    requirement: HOST-01
    verification:
      - kind: other
        ref: "npm run freshness:hook-manifest"
        status: pass
      - kind: unit
        ref: "scripts/context-io.test.ts, scripts/floor-invariance.test.ts, hooks/admission-guard.test.ts, scripts/admission-server.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten sentences read correctly and keep their meaning (wording-only changes, Pi added where the sentence covers every non-spawning host)"
    verification: []
    human_judgment: true
    rationale: "Whether each rewrite keeps the sentence's meaning, for example the D-12 clause in context-io.ts, is a reading judgment no test asserts"

duration: 31min
completed: 2026-10-06
status: complete
---

# Phase 34 Plan 09: Derived host-prose scan Summary

**`install/host-tools-prose.test.ts` builds its scan set from `git ls-files -z` and its host names from `HOST_TOOLS`. It fails, naming the file and line, on a host count word (for example a number before "non-CC CLIs" or `<n>-tool`) and on any paragraph or TypeScript block that lists every non-spawning host but one. Both rules are proven by mutation in a scratch git repository. The live tree now passes: 711 markdown and 198 TypeScript files, three reasoned exemptions.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-10-06T16:11:57Z
- **Completed:** 2026-10-06T16:43:09Z
- **Tasks:** 3
- **Files modified:** 25 (including 7 committed `.js` build outputs)

## Accomplishments

- A derived prose scan with two rules:
  - Rule A catches a count word before a host noun, plus the `<n>-tool` and `<n>-host` hyphen forms. It runs case-insensitive over joined blocks.
  - Rule B catches a host list that leaves out exactly one registry `sequential` host, and names the host it leaves out.
  - Nothing in the scanner is a hand-typed list: no file list and no host-name list.
- Nine mutation cases in scratch git repositories:
  1. markdown count phrase reported by Rule A
  2. short markdown host list reported by Rule B, naming the missing host
  3. TypeScript `non-CC CLIs` count reported by Rule A
  4. clean markdown and clean TypeScript files give zero findings
  5. `.planning/` file tracked but not scanned
  6. count phrase and short list wrapped across TypeScript lines still reported
  7. hyphen forms reported, and bare `tools` counts as a host noun only in markdown
  8. a complete list wrapped across a string concatenation is clean
  9. a stale-exemption probe
- Two live cases (markdown and TypeScript). Each first checks its premise: the scan set is non-empty, contains the named anchor files, and contains no excluded path. The markdown premise also checks that the exclusions actually remove tracked files.
- Every remaining hit in shipped markdown, comments and runtime strings is rewritten without a count. Pi is named wherever the sentence covers every non-spawning host. "Two hosts" meaning two operating systems now reads "two platforms".
- The hook manifest was regenerated, and `freshness:hook-manifest` is green.

## Scan sets and exemptions (final)

- **Markdown arm:** 711 tracked `*.md` files. **TypeScript arm:** 198 tracked `*.ts` files. Measured with `git ls-files` minus the exclusions at HEAD `f8162f76`. The exclusions remove 1623 tracked paths.
- **Declared exclusions:**

| Exclusion | Reason |
|---|---|
| `.planning/` | Planning history: past plans and summaries record what was true then |
| `docs/audit/` | Audit records: dated entries quote text as it read when audited |
| `docs/initial/` | The frozen product spec and brand inputs, kept as received |
| `CHANGELOG.md` | Release history: each entry records what a past release shipped |
| `*.js` | Build outputs that follow their `.ts`; in neither arm |

- **Exemptions:** `EXEMPTION_COUNT = 3` and `RULE_A_EXEMPTION_COUNT = 0`. Every exemption must still match a finding.

| File | Rule | Needle | Reason |
|---|---|---|---|
| `agent-factory/packaging/subagent.frontmatter.md` | B | `R2, Copilot CLI's \`model\` property at run time` | Names the hosts whose agent formats accept a per-agent `model` field; Pi ships no sub-agents (D-12) |
| `agent-factory/packaging/subagent.frontmatter.md` | B | `R3, whether grugops should emit for the other host CLIs` | Names the hosts grugops could generate agent definitions for; Pi has no per-agent definition format |
| `scripts/model-dial-consistency.test.ts` | B | ``each accept a per-agent `model` `` | SCOPE_SENTENCE pins the per-agent clause; Pi is covered by the separate PI_CLAUSE pin on the same doc line |

## Task Commits

1. **Task 1: Derived scan, mutation proofs, count-free markdown** - `3b25f240` (test)
2. **Task 2: Count-free hook closure, manifest regenerated** - `f041c4a3` (docs)
3. **Task 3: Count-free oracle comments, TypeScript arm live** - `f8162f76` (test)

**Plan metadata:** recorded in the final docs commit.

## Rewritten lines

**Task 1 (markdown):**

| File:line | Before | After |
|---|---|---|
| agent-factory/contracts/context-note.md:149 | the four non-CC CLIs degrade to | the non-Claude-Code host CLIs degrade to |
| agent-factory/roles/_role-switch-protocol.md:11-12 | On the four non-spawning host CLIs (Codex, Gemini, OpenCode, Copilot) | On the non-spawning host CLIs (Codex, Gemini, OpenCode, Copilot, Pi) |
| agent-factory/roles/_role-switch-protocol.md:54 | the four non-spawning CLIs run | the non-spawning host CLIs run |
| agent-factory/workflows/16-context-read-write.md:32 | The four non-CC CLIs degrade to two weaker signals. | The non-Claude-Code host CLIs degrade to two weaker signals. |
| agent-factory/workflows/16-context-read-write.md:54 | Codex, Gemini CLI, OpenCode and Copilot CLI deliver nothing here. | Codex, Gemini CLI, OpenCode, Copilot CLI and Pi deliver nothing here. |
| agent-factory/workflows/16-context-read-write.md:60 | on the four hosts where no such channel exists | on the hosts other than Claude Code, where no such channel exists |
| agent-factory/packaging/adapters.md:7 | grug not build it five times. | grug not build it again for each tool. |
| install/README.md:3 | grug not install it five different hard ways. | grug not install it a different hard way for each tool. |

**Task 2 (hook closure; wording only):**

| File:line | Before | After |
|---|---|---|
| hooks/admission-guard.ts:33 | for the four non-Claude-Code CLIs | for the non-Claude-Code host CLIs |
| scripts/admission-server.ts:34-35 | The four non-CC CLIs degrade | The non-Claude-Code host CLIs degrade |
| scripts/dead-vocabulary.ts:16 | on the four non-spawning host CLIs | on the non-spawning host CLIs |
| scripts/context-io.ts:177-178 | the four non-CC CLIs degrade | the non-Claude-Code host CLIs degrade |
| scripts/context-io.ts:1277 | Two hosts, two sentences | Two platforms, two sentences |
| scripts/context-io.ts:3929 | covers the four non-CC CLIs | covers the non-Claude-Code host CLIs |
| scripts/context-io.ts:4780 | On the four host CLIs that set no | On the host CLIs that set no |
| scripts/context-io.ts:4901 | Two hosts, two answers | Two platforms, two answers |
| scripts/context-io.ts:4955 | for the four host CLIs that set no | for the host CLIs that set no |
| scripts/context-io.ts:5396 | On Codex, Gemini CLI, OpenCode and Copilot CLI | On Codex, Gemini CLI, OpenCode, Copilot CLI and Pi |
| scripts/context-io.ts:5492-5494 | Codex, Gemini CLI, OpenCode and Copilot CLI — the four hosts D-12 names as the ones where the attended lane is absent by design | Codex, Gemini CLI, OpenCode, Copilot CLI and Pi — the hosts where the attended lane is absent by design (D-12 named all of them but Pi, which phase 34 added and which has no attended lane either) |
| scripts/context-io.ts:5588 | open on the four that do not | open on every other host |
| scripts/context-io.ts:5592 | Codex, Gemini CLI, OpenCode and Copilot CLI | Codex, Gemini CLI, OpenCode, Copilot CLI and Pi |
| scripts/context-io.ts:5629, 5667, 5729, 5836 (runtime strings) | Codex, Gemini CLI, OpenCode or Copilot CLI | Codex, Gemini CLI, OpenCode, Copilot CLI or Pi |
| scripts/context-io.ts:5735 (runtime string) | Still open on the four non-Claude-Code hosts. | Still open on the hosts other than Claude Code. |
| scripts/context-io.ts:5802 (runtime string) | unchanged on the four hosts where the walk is the answer. | unchanged on the hosts where the walk is the answer. |
| scripts/context-io.ts:5843-5844 (runtime string) | Still open on the four non-Claude-Code hosts | Still open on the hosts other than Claude Code |
| scripts/context-io.ts:6453 | four non-Claude-Code CLIs use | non-Claude-Code host CLIs use |
| scripts/context-io.test.ts:738 | the four non-CC CLIs | the non-Claude-Code host CLIs |
| scripts/context-io.test.ts:4021-4022 | the surface the four non-Claude-Code CLIs use | the surface the non-Claude-Code host CLIs use |
| scripts/context-io.test.ts:6121-6123 | same D-12 sentence as context-io.ts:5492 | same rewrite |
| scripts/context-io.test.ts:11482 (test title) | (the 4-host control) | (the no-delivered-root control) |
| scripts/context-io.test.ts:11483 | The four non-Claude-Code hosts deliver | The hosts other than Claude Code deliver |
| scripts/context-io.test.ts:12622 | Two hosts, two arms | Two platforms, two arms |
| scripts/context-io.test.ts:16443-16444 (string) | the surface the four non-Claude-Code CLIs use | the surface the non-Claude-Code host CLIs use |

No test asserted the changed runtime strings (searched before editing), so no assertion moved.

**Task 3 (oracles and tests):**

| File:line | Before | After |
|---|---|---|
| scripts/check-uat-oracles.ts:358 | gate printing `PASS WR-05 wording: … the 5-tool-table flip is asymmetric` and exiting 0 | gate printing a WR-05 PASS line that called the per-host table flip asymmetric, and exiting 0 |
| scripts/check-uat-oracles.test.ts:56 | the two 5-tool tables | the two per-host tables |
| scripts/check-uat-oracles.test.ts:64 | scans the 5-tool tables | scans the per-host tables |
| scripts/check-uat-oracles.test.ts:202 | from BOTH 5-tool tables | from BOTH per-host tables |
| scripts/check-uat-oracles.test.ts:204 | `PASS  WR-05 wording: … the 5-tool-table flip is asymmetric` and exited 0 | a WR-05 PASS line calling the per-host table flip asymmetric, and exited 0 |
| scripts/check-foundation-guards.test.ts:355 | scans the 5-tool tables | scans the per-host tables |
| scripts/check-foundation-guards.test.ts:5107 | on the four non-spawning CLIs | on the non-spawning host CLIs |
| scripts/check-foundation-guards.ts:1308 | on the four non-spawning host CLIs | on the non-spawning host CLIs |

The current WR-05 PASS message carried no count since plan 34-06, so no assertion quoted a changed message.

## Files Created/Modified

- `install/host-tools-prose.test.ts`: the derived scan, mutation cases, live cases, exemption table
- `docs/audit/29-style-dispositions/34-09.md`: disposition rows for the 8 watched clauses this plan changed
- Markdown: workflow 16, role-switch protocol, context-note contract, adapters.md, install/README.md
- Hook closure: `scripts/context-io.ts`, `scripts/dead-vocabulary.ts`, `hooks/admission-guard.ts` (with `.js`), and the regenerated `hooks/hook-entry.ts` / `.js`
- `scripts/admission-server.ts` (with `.js`), `scripts/check-uat-oracles.ts` (with `.js`), `scripts/check-foundation-guards.ts` (with `.js`), and the tests `context-io.test.ts`, `check-uat-oracles.test.ts`, `check-foundation-guards.test.ts`
- `.planning/phases/34-model-effort-dial-pi-support/deferred-items.md`: two 34-09 entries

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- Rule B judges whole blocks.
- Rule A joins wrapped lines and covers `<n>-host`.
- There are three Rule B exemptions, each for a per-agent-format host list, and none for Rule A.
- Wherever D-12 named a host set, the hosts are now listed by name, with Pi added and labelled as added later.
- The caveman count lines were fixed by hand, without widening the scan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The per-line scan missed count phrases split across a line break**
- **Found during:** Task 1, while prototyping against the live tree.
- **Issue:** A per-line Rule A did not find hits the plan expects, including dead-vocabulary.ts:16 ("…host" / "CLIs" on the next line) and context-io.ts:177 and 5843-5844.
- **Fix:** Rule A runs over joined blocks: markdown paragraphs, TypeScript comment paragraphs, and string literals wrapped with `+`. Mutation case (6) proves it.
- **Files modified:** install/host-tools-prose.test.ts
- **Commit:** 3b25f240, f8162f76

**2. [Rule 1 - Bug] Per-line Rule B false-positived on a wrapped complete list**
- **Found during:** Task 2. The rewrite of context-io.ts:5728-5729 names all hosts across two string lines, and the line alone reads as "omits Codex".
- **Fix:** Rule B judges each TypeScript line inside its block, as markdown judges a paragraph. A block contains its lines, so a short list is still reported unless its own block names the missing host. The finding points at the line where the list starts. Mutation case (8) proves a complete wrapped list is clean.
- **Deviation from the plan's wording:** "each TypeScript line" is now "each TypeScript line within its block".
- **Commit:** f8162f76

**3. [Rule 2 - Missing critical] `<n>-host` hyphen form**
- **Issue:** The test title "(the 4-host control)" in context-io.test.ts is a host count, but the plan's grammar only caught `<n>-tool`.
- **Fix:** The hyphen form now covers `tool|host`. The title is rewritten, and mutation case (7) covers both forms.
- **Commit:** f041c4a3, f8162f76

**4. [Rule 3 - Blocking] Sites outside the plan's file list**
- `scripts/admission-server.ts:34-35` and `scripts/check-foundation-guards.ts:1308` were found by the scan, and both were rewritten. The plan says "any hit the scan finds that this list missed".
- `install/README.md:3` and `agent-factory/packaging/adapters.md:7` are caveman count lines (the 34-06 deferred item). Both were fixed by hand.
- **Commits:** 3b25f240, f041c4a3, f8162f76

**5. [Rule 2 - Missing critical] Disposition rows for watched clauses**
- **Issue:** `check-diff-disposition` (a CI gate) requires a row for every changed clause in the watched corpus. The role-switch protocol and workflow 16 are in that corpus.
- **Fix:** Added `docs/audit/29-style-dispositions/34-09.md` with 8 rows. This plan's clauses no longer appear in the gate's findings.
- **Commit:** 3b25f240

**6. Past PASS-line quotes paraphrased, not re-quoted.** check-uat-oracles.ts:358 and its test at line 204 quoted a PASS line the gate printed before plan 34-06. Changing the count inside the quote would have changed what the gate printed then. Both are rewritten as reported speech with no count.

---

**Total deviations:** 6 (2 Rule 1, 2 Rule 2, 1 Rule 3, 1 wording choice). **Impact:** the scan is stricter than the plan's grammar (joined blocks, `<n>-host`), with one bounded relaxation: a TypeScript line is judged within its block. No behaviour change in any module.

## Issues Encountered

- `node scripts/check-diff-disposition.js` (CI) was already red before this plan. It reports 6 "no disposition row" findings from plans 34-06 and 34-08: `README.md:4`, `README.md:48`, and `agent-factory/README.md:39` (twice), `:42` and `:58`. It still reports exactly those 6 after this plan. They are logged in `deferred-items.md` with owner 34-10 or the phase gap round.
- `scripts/floor-invariance.test.ts` "hooks/hook-entry.ts has no uncommitted modification" fails until the regenerated manifest is committed. This is by design, and the test was green after commit f041c4a3.

## Verification

- `npx vitest run --exclude '**/scripts/e2e/**'`: **100 files, 7330 passed, 2 skipped, exit 0** (961 s, at HEAD `f8162f76`).
- Green:
  - `npm run check:build-parity` and `npm run typecheck`
  - `npm run freshness` (73 `.js` files fresh), `freshness:adapters`, `freshness:hook-manifest` (13 module hashes), `freshness:catalog`
  - `node scripts/check-foundation-guards.js`
  - `check-kit-refs`, `check-claim-anchors`, `check-banned-claims`, `check-public-docs-vocabulary`, `check-imperative-lexicon`, `check-nul-bytes`, `check-audit-register` and `check-platform-shapes`
  - `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js`
- `check-diff-disposition`: red, with only the 6 pre-existing findings described above.

## Known limits

- Rule A matches only its grammar. A count without a host noun ("the other four", "N times", "N ways") is not caught. The two caveman lines of that shape were fixed by hand and logged.
- Rule B masks a short list when its block names the missing host elsewhere. This is the same paragraph rule markdown has always had, and it is now applied to TypeScript.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 34-10. The diff-disposition backfill for 34-06 and 34-08 is open in deferred-items.md.

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-06*

## Self-Check: PASSED

All created files exist; task commits 3b25f240, f041c4a3 and f8162f76 are ancestors of HEAD.
