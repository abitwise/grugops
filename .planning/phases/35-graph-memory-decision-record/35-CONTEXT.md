# Phase 35: Graph-memory decision record - Context

**Gathered:** 2026-10-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Write one recorded decision that settles graph memory for v3.0: graphify and comparable tools were evaluated, graph memory is not adopted, and nothing is built. The record states what a user may do with such a tool themselves, the trigger for revisiting the decision, that no graph-tool output enters the shared context without a verification stamp, and it repeats no vendor token-saving number (GRAPH-01, GRAPH-02). No later phase builds or reserves anything for graph memory. No file outside `.planning/` changes in this phase (roadmap success criterion 4).

Note on IDs: the `D-NN` items below are phase-local discussion decisions. The decision this phase *records* is the milestone-level **D-10** (see D-02).

</domain>

<decisions>
## Implementation Decisions

### Record form and home
- **D-01:** The full record lives in a standalone file, `.planning/phases/35-graph-memory-decision-record/35-DECISION.md`: the tools-evaluated table, the reasoning, the allowed posture, the revisit trigger, and the verification-stamp rule. PROJECT.md (already about 111 KB) gets only one row in its Key Decisions table that points to that file.
- **D-02:** The recorded decision is numbered **D-10**, continuing the v3.0 series D-1..D-9 in PROJECT.md Key Decisions, and its row is tagged `[v3.0, D-10]` like its siblings. Outcome column: the same convention the other v3.0 rows use (planner's call).

### Revisit trigger
- **D-03:** The decision is reopened only when **both** conditions hold:
  (a) a graph or code-index tool ships as plain files with zero host runtime dependencies (no Python toolchain, no native wheels, no SQLite, no graph DB, no server), **and** its output can carry a verification stamp before it enters the shared context;
  (b) after the Phase 37 byte budgets land, a measured dogfood run shows that code-navigation reads, not state files, are the main token cost.
  Either condition alone does not reopen it.
- **D-04:** There is no date-based or scheduled review. The trigger is event-based only, and no milestone audit step is added.

### Allowed posture (what a user and a role may do)
- **D-05:** A user may install graphify, CodeGraph or any similar tool themselves. A role may read that tool's output as an exploration aid, the same way it reads grep output. Anything the role learns that way is verified before it enters the shared context, and the tool's output itself never enters it. The posture is stated **only** in the decision record. No role text names a tool or adds a line about derived indexes, so Phases 39–43 add nothing for graph memory.
- **D-06:** The Phase 43 docs get no mention of host-native code navigation (for example Claude Code LSP plugins) because of this decision. Phase 43 can still choose that on its own, but this phase creates no follow-up for it.

### Vendor claims and evidence
- **D-07:** The record contains **no** token-saving figure of any kind: no vendor figure, no independent-test figure, no "x-fold" multiplier, no percentage. It may say only that vendors self-report savings and that grugops has measured none. `.planning/**` is excluded from `scripts/check-banned-claims.ts` (the `**/.planning/` segment class), so no gate enforces GRAPH-02 here. The verifier has to check it by reading `35-DECISION.md` and the new Key Decisions row, including spellings the gate's literals would miss.
- **D-08:** Tool facts are taken from the research as-of 2026-10-20 (`.planning/research/STACK.md` §(d)) without a fresh web pass. The record carries that date and keeps the research's confidence labels (`LOW`, `UNKNOWN - verify`) as they are, with no upgrades.

### Claude's Discretion
- The internal structure and headings of `35-DECISION.md`, provided it covers everything in GRAPH-01/02 and D-03..D-07.
- Whether to name GSD's own `gsd-graphify` / `.planning/graphs/` in the record to head off the confusion PITFALLS.md Pitfall 19 describes. This was offered as an extra area and not discussed. Including one clarifying sentence is fine; it changes nothing outside `.planning/`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and scope
- `.planning/REQUIREMENTS.md` — GRAPH-01, GRAPH-02 (lines 11–14), and the out-of-scope row "Adopting or building graph memory" (line 103)
- `.planning/ROADMAP.md` § "Phase 35: Graph-memory decision record": goal and the four success criteria, including "No file outside `.planning/` changes"

### Evidence the record cites
- `.planning/research/STACK.md` §(d) "Graph memory spike: what exists, and whether it fits": the tools-evaluated table (Graphify, CodeGraph, code-graph-rag, Serena, MCP memory server), the three-step reasoning, and the allowed posture. Also item 7 of the TL;DR and row 33 ("Markdown index files as the graph")
- `.planning/research/SUMMARY.md` § "Phase 35": what the phase delivers and the pitfalls it avoids
- `.planning/research/ARCHITECTURE.md` §8: any graph would have to be a derived, regenerable index with a freshness gate. **Superseded on one point:** its "reserve the path in state-layout if recommended" no longer applies, because the phase goal says nothing is reserved
- `.planning/research/PITFALLS.md` Pitfall 19 (spike turns into a database) and the token-claim pitfall (around line 354; vendor numbers must not be restated)
- `.planning/research/FEATURES.md` rows 169, 189, 292: the expected decision and "only if the spike decision names a trigger that is later met"

### Where the pointer row goes
- `.planning/PROJECT.md` Key Decisions table: the v3.0 rows D-1..D-9 (around lines 256–269) are the format to match

### Claims gate (for the verifier)
- `scripts/check-banned-claims.ts`: the excluded-directory list contains `**/.planning/` (around line 912), which is why GRAPH-02 is checked by reading the content (D-07)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- PROJECT.md Key Decisions table rows tagged `[v3.0, D-N]`: the exact row format for the D-10 pointer.

### Established Patterns
- The decision-record pattern (decision + reasoning + outcome) used across PROJECT.md Key Decisions. The roadmap marks this phase as needing no research phase.
- The no-fabrication rule: unknown facts stay `UNKNOWN - verify`, and LOW-confidence claims keep their label.

### Integration Points
- None outside `.planning/`. The only writes are the new `35-DECISION.md` and one appended row in `.planning/PROJECT.md`.

</code_context>

<specifics>
## Specific Ideas

- The "graph" grugops owns is the markdown index layer from Phase 37 (`nfr-catalog.md`, `traceability.md`, ticket links) plus the validator. The record can name it as the answer to the token-cost question for state files, without claiming any saving.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within phase scope. (Host-native code navigation in the Phase 43 docs was considered, and the user chose not to create a follow-up; see D-06.)

</deferred>

---

*Phase: 35-graph-memory-decision-record*
*Context gathered: 2026-10-20*
