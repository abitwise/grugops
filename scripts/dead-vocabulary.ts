// dead-vocabulary.ts — the ONE place that says which grugops vocabulary is retired
// (Phase 27 / SPAWN-05, D-24).
//
// Phase 24 deleted the seventeen static handoff templates and replaced the relay with the shared
// verified context. Two different gates now have to know that: check-kit-refs Assertion 2 greps the
// deleted templates' DIRECTORY PATH across the shipped kit, and guard_adapter_body greps ADAPTER
// PROSE that contains no path at all. Those are genuinely different predicates over different
// inputs, so a second CHECK is justified — a second LIST is not. This module is that one list; both
// gates import from here and neither holds the literals inline.
//
// ---------------------------------------------------------------------------------------------
// THE BOUNDARY A FUTURE EDITOR IS MOST LIKELY TO GET WRONG.
//
// SPAWN-05's own wording conflated two things that sit in the SAME surviving sentence. Only the
// memory-relay half is retired. The execution-topology half — "one window, prior context dropped
// between roles" — is STILL CORRECT: it describes how roles activate on the four non-spawning host
// CLIs, it is verbatim in agent-factory/packaging/subagent.frontmatter.md, and under the revised
// D-02 it is the degraded tier's own wording. NEVER add that phrasing, or any other "single window"
// prose, to RETIRED_PROSE_FORMS below: a guard banning it would fail red on text this project keeps
// on purpose, and the only way to go green again would be to delete correct text.
//
// What IS retired is the claim that a static artifact carries memory between roles. The shared
// verified context is the sole memory; nothing reopens that.
// ---------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------
// THE SECOND BOUNDARY, SAME SHAPE AS THE FIRST (Phase 28 / AUDIT-02, D-10).
//
// The verb describing what the Orchestrator does with work — "routes", "routing", "route each to
// the right role agent" — is STILL CORRECT v2.0 English and must NEVER be added to
// RETIRED_PROSE_FORMS below. A token guard banning it would fail red on three live sites this
// project keeps on purpose:
//
//   1. .claude/agents/grugops-orchestrator.md's own `description:` — "Decompose each request into
//      subtasks, ROUTE each to the right role agent within hard limits" — which is the generated
//      adapter text describing the v2.0 decomposer accurately.
//   2. agent-factory/roles/orchestrator.md's `### Routing matrix (subtask → role)` heading — the
//      subtask→role mapping table, which is the mechanism v2.0 actually ships.
//   3. CLAUDE.md's "`description` drives auto-routing: Claude reads it to decide when to delegate"
//      — a CLAUDE CODE PLATFORM FACT about how the host tool selects a subagent. It is not a
//      grugops claim at all, and no grugops vocabulary decision may make it unsayable.
//
// WHAT THE ACTUAL DRIFT IS. Not the word — ONE SPECIFIC CLAIM: "One Orchestrator routes work
// through the full software-delivery lifecycle — business analysis → product → … → release", a
// LINEAR PIPELINE that v2.0 replaced with decompose→enqueue over a shared queue. That is a claim
// about topology, not a token, and a claim is held by a registry row in
// docs/audit/28-claim-registry.md — NEVER by a grep. A grep cannot tell the true sentence from the
// false one because both contain the same word.
//
// The rule both boundaries share: if going green would require deleting correct text, the literal
// does not belong in this file.
// ---------------------------------------------------------------------------------------------
//
// THIS MODULE MUST NEVER BE ADDED TO ANY GUARD'S SCAN SET. By construction it contains every
// literal it defines, so it would fail its own check. It lives under scripts/, which is outside the
// check-kit-refs SCAN set and outside guard_adapter_body's adapters-plus-template scan set, so the
// exclusion holds structurally rather than by anyone remembering it.
//
// Strictly declarative: no I/O, no side effects, zero npm dependencies.

// The PATH form — the deleted templates' directory. check-kit-refs Assertion 2 greps the shipped
// kit, the adapters and AGENTS.md for this and requires zero hits: any survivor is a dangling
// reference to an artifact that no longer exists.
export const RETIRED_PATH_FORMS: readonly string[] = ["agent-factory/handoffs/"];

// The PROSE forms — the memory-relay phrasing retired when the shared verified context replaced the
// static relay. Both are drawn from the one surviving pre-generation adapter line: the noun phrase
// naming the artifact that used to be demanded from each role, and the clause asserting that
// artifact was the only memory. Matching is case-insensitive at the consumer, so only the lowercase
// form is listed here.
//
// Neither form contains a path, which is exactly why check-kit-refs Assertion 2 cannot find them
// and guard_adapter_body exists.
export const RETIRED_PROSE_FORMS: readonly string[] = [
  "handoff packet",
  "the handoff is the only memory",
];
