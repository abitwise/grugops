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
