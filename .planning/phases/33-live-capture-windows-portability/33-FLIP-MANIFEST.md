# Phase 33 — GAP-D1 flip manifest (D-17, D-18, D-19)

**Manifest status:** `pre-capture`

The status field has exactly two values. `pre-capture` is the state this document ships in: no
capture exists, every declared surface still carries its pre-flip cell, and that is correct. The
second value, `discharged`, is written by plan 33-11 in the same commit that performs the flip. The
residual rule (section 1.4) and the commit-set rule (section 2.1) are in force only in the second
state; in the first state the gate derives and prints both sides and refuses only when a derivation
fails or a declared locator does not resolve against the tree.

This is a safety surface (CLAUDE.md: no fabrication; the trace is the proof), so it is written in
clear professional voice. Every number in it was measured on the tree at commit `6b33fb9e`
(2026-09-19), with the command quoted beside it. Every census uses the text-forcing matcher flag
(`grep -a`), never a Perl-mode expression — this repository's own hazard is that the default
matcher silently reports zero over a file it classifies as binary.

**How the gate reads this document.** `scripts/check-flip-manifest.ts` parses the markdown tables
below and identifies each by its header row, never by a heading. A cell wrapped in one pair of
backticks, or in a double-backtick pair with one inner space on each side, is unwrapped; `\|` inside
a cell is a literal pipe. The gate holds the derivation rule for each named part; this document
holds the parts' names, their expected counts and their listed members, so the two are compared
rather than either being trusted.

| Setting | Value |
|---|---|
| capture summary | `33-CAPTURE-SUMMARY.md` |
| parity table file | `examples/03-ticket-to-pr.md` |
| parity table header cell | `Parity dimension` |
| parity data rows | `7` |
| pinned live-surface total | `28` |
| residual token | `pending human` |

The capture summary is resolved relative to this manifest's directory. It does not exist in the
pre-capture state; plan 33-10 writes it, and the citation rule (section 4) reads it only in the
discharged state.

---

## 1. Scope — the live-surface set, as an allow-list of derived parts

### 1.1 Why an allow-list and not a suffix exclusion

D-17 asks for a check that no `pending human` cell or GAP-D1 deferral sentence survives outside the
flip commit's set. Measured repo-wide, that check has no satisfiable denominator:

```
git ls-files '*.md' | xargs grep -ail 'pending human' | wc -l        -> 46 files
git ls-files        | xargs grep -ail 'GAP-D1'        | wc -l        -> 47 files
```

Most of those files are plans, summaries, research notes, reviews, discussion logs, UAT records,
verification records and milestone audits that describe a past state truthfully. Rewriting any of
them to make a gate green would be the fabrication this manifest exists to prevent. The planner also
measured that excluding by filename suffix (`*-PLAN.md`, `*-SUMMARY.md`, `*-RESEARCH.md`,
`*-REVIEW.md`, `superseded-rounds/`) still leaves twenty files carrying the cell phrase and
twenty-two carrying the deferral token. So the live-surface set is an ALLOW-LIST of named parts,
each with a derivation rule the gate computes, a per-part vacuity floor, and one pinned total.

The scoping assumption, stated so it can be falsified by reading: a live surface is a document that
makes a CURRENT claim about the product or about the project's state. A document whose subject is a
closed period — a milestone log, a retrospective, an audit of a milestone, a plan or summary of a
finished phase, a dated verification record not named by D-17 — is truthful history and is out of
scope.

### 1.2 The parts

| Part | Derivation rule | Declared count |
|---|---|---|
| `publicDocs` | The repository's own answer to "which documents are public": `publicDocsCorpus()` from `scripts/check-public-docs-vocabulary.ts`, taken whole, the same part `check-banned-claims` consumes. Root markdown, the five examples, the kit README and the generated guarantees page. | 12 |
| `docsTree` | Every tracked markdown file under `docs/`, excluding `docs/audit/**`. The audit directory is the project's record shelf — disposition registers, residual records, red-team surfaces, prepass evidence — and a record describes its date. Command: `git ls-files -- docs \| grep -a '\.md$' \| grep -av '^docs/audit/'`. | 7 |
| `planningLedgers` | Every tracked markdown file directly under `.planning/` (one path separator), minus the closed-period records named in section 1.3 with their reasons. Command: `git ls-files -- .planning \| grep -a '^\.planning/[^/]*\.md$'` reports 9; 4 are excluded. | 5 |
| `archivedRecords` | The archived milestone records D-17 names explicitly and edits in place: every file the flip class (section 2) declares under `.planning/milestones/`. Derived from the flip table, not from a walk, because which archived record is edited in place is a human decision (D-17), not a property of the tree. | 4 |
| `runtimeEvidence` | The recording surface for the runtime observation: every tracked file whose name ends in `-RUNTIME-EVIDENCE.md`. Command: `git ls-files \| grep -a -- '-RUNTIME-EVIDENCE\.md$'`. | 1 |

Overlap between parts: `docs/GUARANTEES.md` is a member of both `publicDocs` and `docsTree` (1).
The pinned total counts each document once: 12 + 7 + 5 + 4 + 1 - 1 = **28**.

The gate refuses a verdict when any part derives zero members, when any part's derived count
differs from the declared count above, when the derived member set differs from the listed members
in section 1.5, or when the deduplicated total differs from the pinned total. The refusal names
every part with its count. Moving the pin is how a change to the set is acknowledged after every
part's derivation has been walked; it is not how the failure is made to go away.

### 1.3 Ledger exclusions — closed-period records at the top of `.planning/`

| Excluded ledger | Reason |
|---|---|
| `.planning/MILESTONES.md` | The milestone log. Its one GAP-D1 line (L26, `grep -ain 'GAP-D1'`) is the v2.0 close's "carried into the next milestone" list, a record of that close. |
| `.planning/RETROSPECTIVE.md` | A retrospective. Its one `pending human` line (L156) quotes the phrase to describe what the v1.0 dogfood left behind; it is a mention in a record, not a cell. |
| `.planning/v1.2-SDLC-COVERAGE-AUDIT.md` | An audit of a closed milestone. Carries neither token today; excluded by the same criterion so the rule is the criterion and not the current token count. |
| `.planning/v2.1-MILESTONE-AUDIT.md` | A dated audit. Its one GAP-D1 line (L80) is audit evidence text and carries no deferral marker; excluded by criterion. |

What remains in the part: `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`,
`.planning/STATE.md`, `.planning/WINDOWS.md`. Note that `PROJECT.md` is a ledger D-17 did not name
and RESEARCH did not tabulate; this plan's census found four current-state sentences in it (section
2, rows F59-F62) and one dated history line (section 1.4), so it is declared here with that reason.

### 1.4 The residual rule, its tokens, and the dated lines inside live files it does not touch

In the discharged state the gate reads every member of the live-surface set line by line and
refuses, naming the file and line, when a line carries either token:

- **T1 — the cell token.** The residual token from the settings table, `pending human`, matched as
  a case-insensitive substring. Post-flip prose that needs to describe the former state must do so
  without the literal phrase, or the gate names the line.
- **T2 — a GAP-D1 deferral sentence.** A line that contains `GAP-D1` (case-insensitive) AND one of
  the deferral markers below (case-insensitive substrings). The marker vocabulary was measured from
  the current-state deferral sentences on this tree; it is content, not a totality claim, and the
  flip class in section 2 is the enumeration. T2 is the net for a sentence the enumeration missed.

| Deferral marker | Measured lines (pre-capture, live-surface set only) |
|---|---|
| `standing deferral` | `.planning/STATE.md:1583` |
| `→ carried` | `.planning/STATE.md:1572`, `.planning/STATE.md:1577`, `.planning/STATE.md:1580` |
| `rides along` | `.planning/PROJECT.md:51` |
| `wait on ONE captured` | `.planning/STATE.md:1481` |
| `Needs exactly ONE captured` | `.planning/PROJECT.md:175` |

Command for T2 over the derived set, quoted so the table can be re-measured:
`for f in <members>; do grep -ain 'GAP-D1' "$f" | grep -aiE 'standing deferral|→ carried|rides along|waits? on ONE captured|needs exactly ONE captured'; done`.
Every line it reports is a flip-class row in section 2. Two current-state ledgers also carry a
dated log entry that mentions the cell token while truthfully describing a past state; those two
lines are exempt from the residual rule by anchor, and the gate refuses if an anchor no longer
resolves (a stale exemption is a derivation failure, not a pass):

| Exempt file | Anchor | Reason |
|---|---|---|
| `.planning/PROJECT.md` | `*Last updated: 2026-06-04 — Phase 6 (Validation, Brand & Dogfood) complete` | A dated entry in `## Evolution` (L322). It records what Phase 6 shipped on 2026-06-04, including the cells it left for a human. |
| `.planning/STATE.md` | `- [Phase 06]: [06-05] Hybrid dogfood` | A dated decision-log entry (L658) written by the state tooling at the time; the decisions log is a record of decisions at their dates. |

Measured T1 over the live-surface set in the pre-capture state (`grep -ain 'pending human'`): 27
lines — `examples/03-ticket-to-pr.md` 9 (L16, L182, L187-L193), `docs/dogfood-human-runbook.md` 3
(L175, L178, L203), `06-HUMAN-UAT.md` 1 (L32), `06-VERIFICATION.md` 8 (L10, L30, L32, L34, L60,
L63, L71, L133), `19-VERIFICATION.md` 2 (L17, L127), `.planning/PROJECT.md` 3 (L239, L241, L322),
`.planning/STATE.md` 1 (L658). All but the two exempt lines are flip-class or correction-class rows.

### 1.5 Members, as derived on this tree

| Part | Member |
|---|---|
| `publicDocs` | `AGENTS.md` |
| `publicDocs` | `CHANGELOG.md` |
| `publicDocs` | `CLAUDE.md` |
| `publicDocs` | `CONTRIBUTING.md` |
| `publicDocs` | `README.md` |
| `publicDocs` | `examples/01-greenfield-bootstrap.md` |
| `publicDocs` | `examples/02-brownfield-bootstrap.md` |
| `publicDocs` | `examples/03-ticket-to-pr.md` |
| `publicDocs` | `examples/04-sprint-cycle.md` |
| `publicDocs` | `examples/05-release-run.md` |
| `publicDocs` | `agent-factory/README.md` |
| `publicDocs` | `docs/GUARANTEES.md` |
| `docsTree` | `docs/GUARANTEES.md` |
| `docsTree` | `docs/catalog/README.md` |
| `docsTree` | `docs/design/shared-install.md` |
| `docsTree` | `docs/dogfood-human-runbook.md` |
| `docsTree` | `docs/faq.md` |
| `docsTree` | `docs/initial/agent_factory_builder_spec_v2.md` |
| `docsTree` | `docs/initial/grugops_brand_manual.md` |
| `planningLedgers` | `.planning/PROJECT.md` |
| `planningLedgers` | `.planning/REQUIREMENTS.md` |
| `planningLedgers` | `.planning/ROADMAP.md` |
| `planningLedgers` | `.planning/STATE.md` |
| `planningLedgers` | `.planning/WINDOWS.md` |
| `archivedRecords` | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` |
| `archivedRecords` | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` |
| `archivedRecords` | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` |
| `archivedRecords` | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` |
| `runtimeEvidence` | `.planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md` |

### 1.6 Out of scope, and why

Every other file carrying either token is history and is not rewritten. Named, so the omission is
a decision: the Phase 06, 19, 23, 24, 26, 27 and 28 plans, summaries, contexts, research notes,
patterns, reviews, UAT and verification records under `.planning/milestones/` and
`.planning/phases/` that D-17 does not name (`24-VERIFICATION.md` and `26-VERIFICATION.md` carry the
cell phrase; `26-VERIFICATION.md` and `27-VERIFICATION.md` carry GAP-D1 — each describes what that
phase verified at its date); `superseded-rounds/`; the Phase 33 planning documents themselves;
`.planning/research/`; `.planning/quick/`; `CHANGELOG.md`'s two GAP-D1 lines (L69, L132 — release
notes, no deferral marker; it stays in `publicDocs` and passes the residual rule as written);
`docs/audit/28-disposition-register.md` (a record; it receives an appended discharge note, row F14,
and its two `pending human` lines at L140 and L151 describe plan 28-05's diff and stay).

`.planning/WINDOWS.md` is three representations of one ledger — a frontmatter counter block, a
markdown table and a JSON appendix that repeats every row — so its rows are changed only through
the tool its own header names (`gsd-tools windows fixed <id>` / `windows waive <id> "<reason>"`),
never by hand. A hand edit desynchronises the three. The gate reads the JSON appendix.

---

## 2. The flip class — one row per cell the capture flips

### 2.1 The commit-set rule

The declared set is the union of the `File` columns of this table and of the correction table in
section 3 — 14 files, this manifest included, because its status field flips in the same commit.
In the discharged state the gate derives the flip commit from git (the commit that introduced the
discharged status line into this file, or the commit or range given on the command line), reads its
changed-file set with `git diff-tree --no-commit-id --name-only -r`, and refuses when that set
differs from the declared set in either direction: an undeclared file that rode along, or a declared
file that was omitted. Neither side is written down against the other.

### 2.2 Row kinds

- `status` — this manifest's status line. Locator is the line's label.
- `anchor` — a pre-flip literal that must be PRESENT in the file in the pre-capture state (the
  manifest is checked against the tree it describes) and ABSENT in the discharged state (the cell
  was flipped). Locator is the literal.
- `marker` — a post-flip literal that must be ABSENT in the pre-capture state and PRESENT in the
  discharged state; used where the flip appends to a record rather than replacing text.
- `parity-row` — a data row of the parity table named in the settings, by 1-based index and its
  pre-flip label. Pre-capture: the table is located by its header cell, has exactly the declared
  number of data rows, and the row at that index carries that label. Discharged: every cell after
  the label carries the citation form of section 4 (both columns, D-19), and the cited section
  exists in the capture summary. The label of row 4 is retired by D-19 and is not checked after the
  flip.
- `ledger-row` — a `.planning/WINDOWS.md` row by id, read from the JSON appendix. Pre-capture:
  status `open`. Discharged: status not `open` (`fixed` or `waived`, written by the tool).

### 2.3 Rows

| # | File | Kind | Locator | Current value | Post-flip shape |
|---|---|---|---|---|---|
| F1 | `.planning/phases/33-live-capture-windows-portability/33-FLIP-MANIFEST.md` | `status` | `**Manifest status:**` | `pre-capture` | the second declared value |
| F2 | `examples/03-ticket-to-pr.md` | `anchor` | `those checks are marked **pending human**` | L16 says the live path cannot be self-driven and its checks are pending | past tense: the live path was captured headlessly on the capture date; cites the summary |
| F3 | `examples/03-ticket-to-pr.md` | `anchor` | `until then its cells read **pending human**` | L182, the table's introduction, uses the relay vocabulary D-19 retires | names the capture and the shared-context note vocabulary; no relay wording |
| F4 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 1 "Same ticket"` | right cell `pending human` (runbook step 3) | both cells in the citation form |
| F5 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 2 "Dispatch mechanism"` | right cell `pending human` (plugin install → `settings.json` `agent:` → `Agent` spawn) | both cells in the citation form |
| F6 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 3 "Plugin-cache pointer resolution (D-31)"` | right cell `pending human` (runbook step 1) | both cells in the citation form |
| F7 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 4 "Handoff filenames produced"` | left cell names handoff files MIGR-02 deleted; right cell `pending human` | the row becomes the typed notes each path published into the shared context (D-19); both cells in the citation form |
| F8 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 5 "Gate verdict"` | right cell `pending human` (runbook step 3) | both cells in the citation form |
| F9 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 6 "Live PreToolUse deploy guard (SAFE-02)"` | right cell `pending human` (runbook step 2) | both cells in the citation form; the observed deny is the hook event of D-04 |
| F10 | `examples/03-ticket-to-pr.md` | `parity-row` | `row 7 "Validator on resulting tree (DOG-01)"` | right cell `pending human` (runbook step 4) | both cells in the citation form |
| F11 | `docs/dogfood-human-runbook.md` | `anchor` | `` column currently reads `pending human` `` | L175 | the runbook describes the human fallback; the column is filled and cited |
| F12 | `docs/dogfood-human-runbook.md` | `anchor` | `` replace each `pending human` cell `` | L178 | past tense or removed; the step is the fallback procedure |
| F13 | `docs/dogfood-human-runbook.md` | `anchor` | `` cells stay `pending human` `` | L203, the deferred outcome | removed or reworded without the literal |
| F14 | `docs/audit/28-disposition-register.md` | `marker` | `Discharged by plan 33-11` | absent | a dated note under the `examples/03-ticket-to-pr.md` entry beginning with that literal, citing the flip commit |
| F15 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` | `anchor` | `status: partial` | frontmatter | `status: passed` |
| F16 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` | `anchor` | `result: [pending]` | Test 3 (A3) | `result: [passed]` plus a note in the citation form |
| F17 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` | `anchor` | `passed: 2` | summary block | `passed: 3` |
| F18 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` | `anchor` | `pending: 1` | summary block | `pending: 0` |
| F19 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `status: human_needed` | frontmatter L4 | `status: passed` |
| F20 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `score: 6/7 must-haves verified` | frontmatter L5 | `score: 7/7 must-haves verified` |
| F21 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `**Status:** human_needed` | L17 | `**Status:** passed` |
| F22 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `pending human CC cells` | L30, truth 5 | the cells are captured and cited |
| F23 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `\| HUMAN NEEDED \|` | L32, truth 7 | `\| VERIFIED \|` with the citation |
| F24 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `**Score:** 6/7 truths verified (1 pending human by design)` | L34 | `**Score:** 7/7 truths verified` with the capture date |
| F25 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `REAL capture with gate verdict + pending human parity cells` | L60 | the parity cells are captured and cited |
| F26 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `GRUGOPS_PROD_DEPLOY_APPROVED, pending human \|` | L63, the runbook content-check row | the checklist's last item names the fallback, not a pending cell |
| F27 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `` side-by-side parity table with `pending human` cells `` | L71 | the table is filled and cited |
| F28 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `\| PARTIALLY SATISFIED \|` | L105, DOG-02 | `\| SATISFIED \|` with the citation |
| F29 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | `anchor` | `The one human_needed item (DOG-02 CC-native path)` | L143, the gaps paragraph | states the item was captured on the capture date and cites the summary |
| F30 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `status: human_needed` | frontmatter L4 | `status: passed` |
| F31 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `status: partial` | frontmatter L9, the gaps block | `status: resolved` or the block removed |
| F32 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `remain [pending] — both agentic` | L10, the reason | A1 and A3 resolved with the citation |
| F33 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `SC4 is partial — A1/A3 pending` | L34 | `**Status:** passed (5/5 ...)` with the citation |
| F34 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `\| PARTIAL \| B3 resolved: 11-HUMAN-UAT.md` | L46, SC4 | `\| VERIFIED \|` with the citation |
| F35 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `**Score:** 4/5 SC verified (SC4 is partial` | L49 | `**Score:** 5/5 SC verified` |
| F36 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `\| PARTIAL \| B3 resolved (oracle exit 0)` | L102, UAT-AUTO-04 | `\| VERIFIED \|` with the citation |
| F37 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | `anchor` | `` A1 and A3 remain `[pending]` `` | L142 | resolved, with the citation |
| F38 | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` | `anchor` | `status: partial` | frontmatter | `status: passed` — evidence is the CI run id in `33-CI-MEASUREMENT.md` (CAP-02), NOT the capture summary; the two citations are never mixed |
| F39 | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` | `anchor` | `[deferred to v2.0 milestone end — human will run the Windows CI proof then]` | L11 | the run id and its date |
| F40 | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` | `anchor` | `result: [pending]` | Test 1 | `result: [passed]` citing the run id |
| F41 | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` | `anchor` | `passed: 0` | summary block | `passed: 1` |
| F42 | `.planning/milestones/v2.0-phases/20-shared-context-substrate-concurrency-foundation/20-HUMAN-UAT.md` | `anchor` | `pending: 1` | summary block | `pending: 0` |
| F43 | `.planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md` | `marker` | `33-CAPTURE-SUMMARY.md` | absent — the slots hold the July 2026 human observation, which D-01 keeps as corroboration and which stays verbatim | a second block, the headless capture's recording-surface fields pasted from the summary field for field, citing the summary section |
| F44 | `.planning/REQUIREMENTS.md` | `anchor` | `- [ ] **CAP-01**` | L140 | `- [x] **CAP-01**` with the capture date and summary |
| F45 | `.planning/REQUIREMENTS.md` | `anchor` | `- [ ] **CAP-03**` | L142 | `- [x] **CAP-03**` with the capture date and summary |
| F46 | `.planning/REQUIREMENTS.md` | `anchor` | `the runtime half is DEFERRED to Phase 33 / GAP-D1 / CAP-01` | L181, the SPAWN-03 traceability row | the runtime half observed on the capture date; cites the summary and the runtime-evidence document |
| F47 | `.planning/STATE.md` | `anchor` | `- **[v2.0] GAP-D1** — the A3/DOG-02 retirement flip` | L1481, the open-items list | discharged, with the capture date and summary |
| F48 | `.planning/STATE.md` | `anchor` | `\| uat \| Phase 06 — 06-HUMAN-UAT.md \| partial (1 open) \| 2026-06-16 → carried \|` | L1572, the v2.0-close carried table | status `passed`, resolved on the capture date |
| F49 | `.planning/STATE.md` | `anchor` | `\| verification \| Phase 19 — 19-VERIFICATION.md \| human_needed (4/5 SC) \| 2026-06-16 → carried \|` | L1577 | status `passed`, resolved on the capture date |
| F50 | `.planning/STATE.md` | `anchor` | `\| verification \| Phase 06 — 06-VERIFICATION.md \| human_needed \| 2026-06-16 → carried \|` | L1580 | status `passed`, resolved on the capture date |
| F51 | `.planning/STATE.md` | `anchor` | `**GAP-D1 — standing deferral` | L1583, the standing-deferral paragraph | retired; a one-line discharge note with the capture date and summary |
| F52 | `.planning/ROADMAP.md` | `anchor` | `\| 1 \| **GAP-D1** — one captured live dual-path run → flip A3/DOG-02` | L109, the carried-obligations table | discharged, with the capture date and summary |
| F53 | `.planning/WINDOWS.md` | `ledger-row` | `id 1` | `open` — SPAWN-03 runtime half unobserved | `fixed` via the tool, reason citing the summary |
| F54 | `.planning/WINDOWS.md` | `ledger-row` | `id 183` | `open` — live lane not run for 32-17 | `fixed` via the tool, reason citing the summary |
| F55 | `.planning/WINDOWS.md` | `ledger-row` | `id 211` | `open` — A1 empty capture on 2026-09-18 | `fixed` via the tool, reason citing the summary |
| F56 | `.planning/WINDOWS.md` | `ledger-row` | `id 212` | `open` — SAFETY CASE, A2-live deny absent on 2026-09-18 | `fixed` via the tool, reason citing the D-04 hook event in the summary |
| F57 | `.planning/WINDOWS.md` | `ledger-row` | `id 213` | `open` — A3-live no verdict convergence on 2026-09-18 | `fixed` via the tool, reason citing the summary |
| F58 | `.planning/WINDOWS.md` | `ledger-row` | `id 214` | `open` — stale `npm test` docblock claim; declared on the premise that plan 33-08 (D-08) lands before the flip and leaves the ledger untouched | `fixed` via the tool, reason citing the 33-08 rewrite |
| F59 | `.planning/PROJECT.md` | `anchor` | `GAP-D1 rides along` | L51, the current-milestone standing obligations | discharged, with the capture date and summary |
| F60 | `.planning/PROJECT.md` | `anchor` | `1. **GAP-D1 — the A3/DOG-02 retirement flip.**` | L175, the carried-obligations list | discharged, with the capture date and summary |
| F61 | `.planning/PROJECT.md` | `anchor` | `DOG-02 live-CC half still pending human` | L239, the key-decisions outcome column | the live half captured on the capture date |
| F62 | `.planning/PROJECT.md` | `anchor` | `live firing pending human (Deferred Items)` | L241, the key-decisions outcome column | the live deny observed on the capture date (D-04) |

The declared set, as the union of the `File` columns above and in section 3 (14 files):
`33-FLIP-MANIFEST.md`, `examples/03-ticket-to-pr.md`, `docs/dogfood-human-runbook.md`,
`docs/audit/28-disposition-register.md`, `06-HUMAN-UAT.md`, `06-VERIFICATION.md`,
`19-VERIFICATION.md`, `20-HUMAN-UAT.md`, `27-SPAWN-03-RUNTIME-EVIDENCE.md`,
`.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/WINDOWS.md`,
`.planning/PROJECT.md`.

Not declared, and therefore not touched by the flip commit: the CAP-02 requirement row
(`REQUIREMENTS.md:141`) and the Phase 20 rows in the state document's v2.0-close table, which plan
33-11's later ledger task brings into agreement with the CI measurement in its own commit; the
plan summary and the gate's own output, which land in a separate follow-up commit.

---

## 3. The correction class — sentences false about the tree regardless of the capture

Kept distinct from the flip class. A flip row takes its post-flip value from the capture and carries
a citation. A correction row rests on a measurement of the tree and carries no capture citation.

Measured on this tree:

```
sed -n '183,194p' examples/03-ticket-to-pr.md | grep -ac '^| '            -> 8 (1 header + 7 data rows)
sed -n '187,193p' examples/03-ticket-to-pr.md | grep -ac 'pending human'  -> 7 right-hand cells
grep -ac 'pending human' examples/03-ticket-to-pr.md                      -> 9 (7 cells + L16 + L182)
```

The parity table has exactly 7 data rows and exactly 7 right-hand cells. Nine archived sentences
across three files say 9 — the count of every occurrence of the phrase in the file, which was never
the count of the table's cells. RESEARCH § "The count disagreement" measured five such sentences;
this plan's census (`grep -aon '9 [^|]\{0,40\}cells' <file>`) found nine, listed below. A tenth row
records a heading that has been false about its own file since 2026-07-29 — the same species: a
statement about the tree that no capture can make true.

In the pre-capture state each stale fragment must be PRESENT in its file (the row is checked against
the tree it describes); in the discharged state each must be ABSENT. The corrected wording must
carry no residual token (section 1.4), because every file below is in the live-surface set.

| # | File | Line | Stale fragment | Measured true count | Corrected wording |
|---|---|---|---|---|---|
| C1 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-HUMAN-UAT.md` | 32 | `` Fill the 9 `pending human` cells `` | 7 | "Fill the seven CC-native cells" |
| C2 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | 10 | `has 9 CC-native cells still marked 'pending human'` | 7 | "has seven CC-native cells, filled by the capture" |
| C3 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | 32 | `` has 9 cells marked `pending human` `` | 7 | "has seven CC-native cells, filled by the capture" |
| C4 | `.planning/milestones/v1.0-phases/06-validation-brand-dogfood/06-VERIFICATION.md` | 133 | `` (9 cells currently `pending human`) `` | 7 | "(seven CC-native cells, filled by the capture)" |
| C5 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | 10 | `including 9 parity cells` | 7 | "including the seven parity cells" |
| C6 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | 17 | `` All 9 CC-native parity cells still read `pending human` `` | 7 | "All seven CC-native parity cells are filled by the capture" |
| C7 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | 20 | `fill the 9 parity cells` | 7 | "fill the seven parity cells" |
| C8 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | 26 | `Fill 9 pending cells` | 7 | "Fill the seven CC-native cells" |
| C9 | `.planning/milestones/v1.2-phases/19-factory-auto-uat-harness-tier-1-deterministic-oracles-tier-2/19-VERIFICATION.md` | 127 | `` Fill the 9 `pending human` cells `` | 7 | "Fill the seven CC-native cells" |
| C10 | `.planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md` | 66 | `## Slots — all empty, all UNVERIFIED` | the slots were filled by the human observation of 2026-07-29 | "## Slots — filled by the observation of 2026-07-29 (corroboration, D-01); the headless capture block follows" |

---

## 4. The citation form (D-18)

Every flipped parity cell — both columns, D-19 — has exactly this shape, with nothing before or
after it inside the cell:

```
`<observed value>` (captured YYYY-MM-DD, `33-CAPTURE-SUMMARY.md` § <section heading text>)
```

- The observed value is in code quotes and is read from the summary, never from memory.
- The parenthetical opens with the word `captured`, then the capture date in ISO form.
- The citation names the capture summary from the settings table, in code quotes, then `§`, then the
  text of a heading that exists in that summary (the heading text without its leading hashes, for
  example `Completion` or `CAP-03 verdict (D-02) — run A`).

Every cell traces to a line in the summary. The gate refuses, naming the cell, when a cell has no
parenthetical, when the parenthetical has no date, when it names no summary section, or when the
named section does not exist as a heading in the summary. A cell without a citation is a
fabrication.

Correction rows (section 3) carry no citation; a corrected count rests on the measurement quoted
beside it. Ledger rows carry their reason in the ledger, written by the tool. The 20-HUMAN-UAT rows
(F38-F42) cite the CI measurement document, not the capture summary, and the gate's citation rule
does not apply to them.

---

## 5. What this manifest does not decide

- Whether the flip happens. Plan 33-11 opens with a blocking human decision (flip, hold, or
  correction-only); a red or divergent capture holds (D-20).
- The post-flip values. They come from the capture summary at flip time.
- Any row of `.planning/WINDOWS.md` by hand. See section 1.6.
- Any file listed in section 1.6 as history.

Amendments to this manifest — a member missing from the declared set, a scope rule that pulled in
a truthful record, a moved pin — are recorded here with their reason, in the same commit series as
the flip, before the gate is re-run.

---

## 6. Hold record (plan 33-11, 2026-09-20)

**Decision: hold.** Selected by the human at plan 33-11's blocking decision checkpoint on
2026-09-20, from the three options the plan offered (flip, hold, correction-only). Nothing flips.

**Evidence the hold rests on.** `33-CAPTURE-SUMMARY.md` (commit `c7be6d0d`, checkout `8f05ed42`)
carries exactly one outcome line under its `Completion` section, and it reads `OUTCOME: fail`. The
one condition that set it is the `Dual-path equivalence (D-07)` section: the comparator returned
named differences (`ARCH-AUDIT-001: note-count differs: path A has 15, path B has 0`;
`AUDIT-01-map` / `AUDIT-02-architecture` / `AUDIT-03-security: note-count differs: path A has 0,
path B has 3`; no note on both sides). `33-DIAGNOSIS.md` § 1 attributes the red: cause class SUITE
(`scripts/dual-path-equivalence.ts` asserts byte-identical model prose and keys on model-chosen task
ids, which D-07 disclaims), with a KIT rider under D-20 recorded verbatim in § 1.3 (the `--agent`
path's seven-tool grant, the notes reaching disk by different routes, the task decomposition
difference). Both CAP-03 sides held in both runs and the D-04 deny was observed on the hook channel
in both — none of that is disputed by this record; it is not sufficient, because D-20 holds every
flip until the two paths show parity under a predicate that can be met.

**What this record does and does not change.**

- Every flip-class row in section 2.3 (F1 through F62) and every correction-class row in section 3
  (C1 through C10) is untouched. Each pre-flip anchor still occurs in its file; each post-flip
  marker is still absent; the parity table still has seven data rows with their pre-flip labels;
  the six ledger rows are still `open`. The gate re-run over this tree after this section was
  written reports the same derivation as before it: 28 pinned / 28 derived, 62 flip rows, 10
  correction rows, 2 exemption anchors, exit 0.
- The status line at the top of this document still reads the first declared value. The residual
  rule (section 1.4) and the commit-set rule (section 2.1) therefore stay out of force. This is
  deliberate: the second value is written only in the commit that performs the flip, and no such
  commit exists.
- The correction class (section 3) is also held, by the human's choice of `hold` over `partial`:
  no correction-class edit lands in this round, so the one-commit rule of section 2.1 does not have
  to be re-stated across two commits.
- `.planning/WINDOWS.md` receives no row from this record. The D-07 finding and the three KIT
  findings are carried in `33-DIAGNOSIS.md` with their offline reproductions; whether they become
  ledger rows is the next round's decision, taken through the tool section 1.6 names.
- `docs/audit/28-disposition-register.md` receives a dated note under its
  `examples/03-ticket-to-pr.md` entry stating that the row-granularity overlap is not yet
  discharged and pointing here. That note does not carry the F14 marker literal, so F14 still reads
  as absent.

**The path back to the flip.** GAP-D1 stays open. The next gap-closure round (round 2 of the
four-round cap for Phase 33) owns the comparator's predicate (`33-DIAGNOSIS.md` § 1.4 names the
path-invariant projection), the kit decisions on the `--agent` grant and the reader's admission of
hand-written notes, and a fresh go for a second capture. When a capture reads `OUTCOME: pass` with
an empty D-07 difference list, plan 33-11's Tasks 2 through 4 are executed as written against
this manifest: the status line flips to the second value in the same commit as the fourteen
declared files, and the residual and commit-set rules come into force over it. One item that
capture-day commit must not miss, recorded here so it is not re-discovered: `.planning/PROJECT.md`
is in the declared set (rows F59 through F62 in section 2.3, with the reason in section 1.3) but
not in plan 33-11's `<files>` list; the manifest is the instruction.
