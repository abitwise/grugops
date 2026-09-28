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
export const RETIRED_PATH_FORMS = ["agent-factory/handoffs/"];
// The PROSE forms — the memory-relay phrasing retired when the shared verified context replaced the
// static relay. Both are drawn from the one surviving pre-generation adapter line: the noun phrase
// naming the artifact that used to be demanded from each role, and the clause asserting that
// artifact was the only memory. Matching is case-insensitive at the consumer, so only the lowercase
// form is listed here.
//
// Neither form contains a path, which is exactly why check-kit-refs Assertion 2 cannot find them
// and guard_adapter_body exists.
export const RETIRED_PROSE_FORMS = [
    "handoff packet",
    "the handoff is the only memory",
];
// ---------------------------------------------------------------------------------------------
// THE 33.1 RETIREMENT: the Bash command-parsing guard (D-17, amended by D-26; D-22, D-28).
//
// Decision D-17 retired the guard that tried to decide, by parsing a shell command, whether an
// agent was about to merge a protected branch or deploy to production. Round after round of review
// found new spellings of the same command that the parser did not refuse, so the hard floor moved to the git
// host (branch protection, deployment environments) and the speed bump moved to the host CLI's own
// permission rules, which the installer writes. D-26 widened the retirement to the whole two-key
// floor-grant family, because the guard was the only runtime reader of it. D-22 and D-28 retired
// the live probe case and the UAT oracle that asserted the guard's deny.
//
// The survivor is NOT listed here and must never be: the MCP shared-context admission gate
// (hooks/admission-guard.*, D-24) is a different gate that stays. The file pattern below is written
// so that the admission gate's own file names never match it (a hyphen or word character before the
// retired base name excludes the match).
//
// These lists feed ONE predicate, scripts/guard-retired.test.ts: zero hits across every tracked
// file outside a pinned, seven-entry exclusion list of history and self paths. A retired name that
// comes back into the live tree turns the suite red. The families mirror the derived consumer
// scan filed with phase 33.1, so the test makes that one-time derivation permanent.
//
// The rule from the header applies here too: if going green would require deleting correct text,
// the literal does not belong in this file. Every member below names code that no longer exists.
// And, again: THIS MODULE MUST NEVER BE ADDED TO ANY GUARD'S SCAN SET. It contains every literal
// it defines, which is why guard-retired.test.ts pins it (and its compiled .js) in its exclusions.
// ---------------------------------------------------------------------------------------------
// F1: the deleted guard's file names (the hook source, its compiled twin and its test). This is a
// RegExp SOURCE, not a word list: the lookbehind refuses a preceding hyphen or word character, so
// the surviving admission gate's files are never reported.
export const RETIRED_GUARD_FILE_PATTERN = String.raw `(?<![-\w])guard\.(?:js|ts|test\.ts)\b`;
// F2-F7: whole-word identifiers. The consumer matches each member as a whole word.
export const RETIRED_GUARD_IDENTIFIERS = {
    // F2: the command model — the rule table and the parser helpers that split a shell command into
    // words and matched them against the governed checkpoints (D-17).
    F2: [
        "COMMAND_CHECKPOINT_RULES",
        "governedToolsNamedBy",
        "classifyWords",
        "failClosedCheckpoints",
        "matchCommandCheckpoints",
        "commandSegments",
        "canonicalWordValue",
        "COMMAND_RULE_CHECKPOINTS",
        "CommandMatch",
    ],
    // F3: the production-deploy grant — the environment key a human set to approve one deploy (D-17).
    F3: ["GRUGOPS_PROD_DEPLOY_APPROVED", "PROD_DEPLOY_APPROVAL_ENV_VAR"],
    // F4: the two-key floor-grant family; its variable prefix is in RETIRED_GUARD_PREFIXES (D-26).
    F4: ["FLOOR_ENV_VAR_PREFIX", "floorEnvVarName"],
    // F5: the deny matcher module and the guard's bypass corpus module (D-17).
    F5: ["prod-deploy-deny-match", "cr01-nested-corpus"],
    // F6: the run banner and the two-key evaluator, whose only runtime caller was the guard (D-26).
    F6: [
        "evaluateMatrix",
        "composeBanner",
        "renderCheckpointBanner",
        "isCheckpointBannerLine",
        "BANNER_ALL_DEFAULT",
        "BANNER_NON_DEFAULT_PREFIX",
        "CONFIG_REFUSAL_PREFIX",
        "resolveCheckpoint",
        "FLOOR_CHECKPOINTS",
        "isFloorCheckpoint",
        "deriveFloorCheckpoints",
        "NAMED_GRANT_ENV_VARS",
        "GRANT_ENV_VAR_PATTERN_SOURCE",
        "isGrantEnvVarName",
    ],
    // F7: the UAT and capture oracles that asserted the guard's deny (D-22, D-28), the checkpoint-note
    // writer whose only production caller was the guard, and the frozen guard blob.
    F7: [
        "oracleHooksWiring",
        "prodDeployDenyFired",
        "PROD_DEPLOY_REASON_SIGNATURE",
        "approvalKeyRefusals",
        "denyObservedInStream",
        "emitCheckpointNote",
        "FROZEN_GUARD_BLOB",
        "denyObservation",
    ],
};
// The floor-grant variable prefix (F4, D-26). The consumer matches it at a word start, so any
// variable in the retired family is reported whatever its suffix.
export const RETIRED_GUARD_PREFIXES = ["GRUGOPS_FLOOR_"];
