// model-tiers.ts — the per-role model alias resolver (MODEL-01…MODEL-05, Phase 29.1).
//
// THIS MODULE IS THE SINGLE ANSWER TO "WHICH MODEL ALIAS DOES ROLE X GET". Every consumer that
// needs one — the adapter generator, the installer's doctor, the assignment guard — asks here and
// nowhere else, so no two of them can disagree about a role's tier.
//
// WHY IT IS A SIBLING OF kit-model.ts RATHER THAN A SECTION INSIDE IT. kit-model is the kit-SET
// authority: which roles exist, which workflows exist, how many of each. The tier table this module
// grows carries a REQUIRED per-role rationale — argued prose about why a role earns a stronger or a
// cheaper model — and that prose has no business inside the module every guard, validator and
// generator in the repository imports for its set derivations. The dependency runs one way: this
// module asks kit-model for the pinned cardinality, and kit-model does not know this module exists.
//
// THE D-11 CONSUMER SPLIT, which is why the return type is a discriminated result and not a map.
// MODEL-04 ("full model ids are refused") and MODEL-05 ("fail-closed to `inherit`, never to a pinned
// tier") describe DIFFERENT INPUTS, not a contradiction:
//
//   - ABSENT value        → `inherit`. That is the zero-config contract, not an error.
//   - PRESENT but ILLEGAL → a REFUSAL. The generator turns that refusal into exit 1 naming the role,
//                           the offending value and the legal set, and writes NOTHING — its existing
//                           all-or-nothing posture (T-27-32), not a new behaviour.
//   - Every OTHER consumer of a resolved model — the doctor, any runtime reader — degrades to
//                           `inherit`, and NEVER to a pinned tier. Silently upgrading a user to a
//                           model their account may not carry is a worse failure than reading the
//                           session default.
//
// Returning a result rather than throwing is what lets one reader serve all three: the generator
// branches on `ok:false` and dies; a degrading consumer branches on it and substitutes `inherit`.
// A throw would force every degrading consumer to write a catch, and a catch is where a refusal
// quietly becomes a default nobody chose.
//
// COUPLING RISK, RECORDED SO PHASE 30'S AUTHOR FINDS IT RATHER THAN DISCOVERS IT. Phase 30 collapses
// `readGovernanceConfig` and `readGovernanceConfigResult` in scripts/context-io.ts into ONE
// discriminated-result config reader. This module is deliberately written in that same shape so that
// it does not become the THIRD config reader in the tree while a plan is actively deleting the
// second. An author unifying those two should read this module's reader as a fourth caller of the
// pattern they are settling, not as an unrelated module to leave alone.
//
// NO MEASUREMENT IS TAKEN HERE AND NO COST CLAIM IS MADE (MODEL-07 / D-14). Assigning a role a
// cheaper model is not evidence that anything was saved, and this module states no saving, implies
// none, and records no benchmark. scripts/measure-cost.ts holds the repository's standing
// `UNKNOWN - verify` on the usage schema and is untouched by this phase.
//
// THIS TASK'S SCOPE. Plan 29.1-01 delivers the ZERO-CONFIG arm only: `resolveModels` takes the stems
// its caller derived and answers `inherit` for all of them. The preset table (TIERED), the two-
// location config read (readModelsConfig) and the preset-name pin (resolvedPresetName) arrive in
// plan 29.1-02. `RoleTier` ships now because the tier table's SHAPE — in particular its required
// rationale field — is the mechanism D-10 rests on, and a shape agreed before there are entries is
// a shape no entry can quietly bend.
//
// DELIBERATELY NOT IMPORTED: `listRoles`. This module performs NO I/O — it resolves over stems its
// caller already derived, which is what makes it a pure function two different callers can share.
// The role-set authority is still the only source of those stems (the generator derives them through
// `listRoles`, and scripts/model-tiers.test.ts derives its corpus the same way); what this module
// takes from kit-model is the pinned CARDINALITY it checks that derivation against. There is no
// private readdir here or anywhere downstream of here. `noUnusedLocals` is on in tsconfig.json, so
// importing a symbol this module does not call would not compile in any case.
//
// Node stdlib not required — this module opens no file and touches no path. Zero npm dependencies.
//
// Findings are written in CLEAR PROFESSIONAL VOICE. A model tier is a money topic, and CLAUDE.md's
// voice discipline makes clear voice mandatory for money, security and compliance — never caveman.

import { ROLE_COUNT } from "./kit-model.js";

// ── The closed alias vocabulary ───────────────────────────────────────────────────────────────
//
// The TUPLE is the declaration and the UNION is derived from it, rather than both being typed out.
// Two hand-written copies of one closed set is this repository's named second systemic failure class
// — a literal that rots while the suite stays green — and here it would rot in the more dangerous
// direction: a union member absent from the tuple is an alias the type system accepts and the
// membership check refuses, which reads as a bug in the caller.
//
// FOUR MEMBERS, AND MEMBERSHIP IS EXACT STRING EQUALITY AGAINST THESE FOUR CONSTANTS — never a
// regular expression. A closed four-member allow-list is what makes a YAML-significant byte
// unreachable in the emitted frontmatter: the emitted value can only ever be one of these strings,
// so a colon, a quote, a newline or a leading dash cannot arrive there at all. A pattern match would
// instead admit whatever the pattern happened not to exclude, which is a property nobody can state.
//
// Full model ids are NOT members, deliberately (MODEL-04): an id like a dated model string is the
// hand-maintained stale literal this milestone exists to eliminate, and an alias degrades gracefully
// for a user whose account does not carry the stronger tier.
export const MODEL_ALIASES = ["inherit", "opus", "sonnet", "haiku"] as const;

/** The closed set of legal model aliases, derived from the tuple above so the two cannot disagree. */
export type ModelAlias = (typeof MODEL_ALIASES)[number];

/**
 * Alias membership, decided by EXACT STRING EQUALITY against the four constants.
 *
 * Takes `unknown` rather than `string` on purpose: a `models` block is user-authored JSON, so the
 * value arriving here may be a number, a null or an object, and each must be refused rather than
 * coerced. There is no regular expression in this function and there must never be one — see the
 * argument above the tuple.
 */
export function isModelAlias(value: unknown): value is ModelAlias {
  if (typeof value !== "string") return false;
  return MODEL_ALIASES.some((alias) => alias === value);
}

/**
 * One row of the shipped preset table (populated in plan 29.1-02).
 *
 * `rationale` IS REQUIRED BY THE TYPE, and that is D-10's whole mechanism rather than a convention.
 * MODEL-03 requires every role to hold a position with a reason, and MODEL-07 requires the reasoning
 * behind a tier split to be disputable by a later reader. A row written without a rationale must not
 * COMPILE — a comment would drift away from the assignment it explains, and a separate prose document
 * would drift out of the repository entirely. One required field serves both requirements, and the
 * rationale cannot come apart from the assignment because they are the same object.
 */
export interface RoleTier {
  readonly stem: string;
  readonly alias: ModelAlias;
  readonly rationale: string;
}

/**
 * The resolver's answer: a resolved map, or a refusal that names what was wrong.
 *
 * A discriminated result rather than a map-or-throw, for the D-11 reason argued in the module
 * header — one reader serves the generator (which dies on a refusal) and every degrading consumer
 * (which substitutes `inherit`), and neither has to write a catch.
 */
export type ModelResolution =
  | { readonly ok: true; readonly value: ReadonlyMap<string, ModelAlias> }
  | { readonly ok: false; readonly reason: string };

/**
 * Resolve a model alias for every role stem the caller derived.
 *
 * ZERO-CONFIG ARM ONLY in plan 29.1-01: no configuration is read, so every stem resolves to
 * `inherit` — the exact value the generator emitted as a literal before this phase, which is what
 * makes MODEL-01's byte-identity claim reachable at all.
 *
 * PURE. It opens no file, reads no environment variable and joins no path. The stems come in as an
 * argument, so the caller's derivation (through the kit authority) stays the one place the role set
 * is decided.
 *
 * THE TWO FLOORS RUN BEFORE THE MAP IS BUILT, and each states a DIFFERENT fact:
 *   1. EMPTY     — a resolution over nobody is the vacuous pass, not a small clean run.
 *   2. DUPLICATE — a repeated stem would otherwise be silently resolved last-wins.
 *
 * THE ROLE_COUNT RELATIONSHIP IS DELIBERATELY NOT CHECKED HERE — see `roleCorpusCardinalityRefusal`
 * below for where it went and why. In short: this function runs on hermetic MIRRORS holding a
 * subset of the corpus, where a smaller set is correct rather than broken.
 */
export function resolveModels(stems: readonly string[]): ModelResolution {
  // ── Floor 1: the vacuity floor. ─────────────────────────────────────────────────────────────
  if (stems.length === 0) {
    return {
      ok: false,
      reason:
        "model-tiers: the stem set is EMPTY — refusing to resolve a model for nobody. " +
        '"The set was empty, therefore every member is assigned" is the vacuous pass this floor ' +
        "exists to make impossible: a resolution over nothing reports a clean assignment and " +
        "carries no information about the roles it was supposed to cover.",
    };
  }

  // ── Floor 2: a duplicated stem, reported by NAME and by COUNT rather than resolved last-wins. ─
  // Counted over the whole set first, then reported in SORTED stem order, so which duplicate is
  // named is a property of the set rather than of the caller's argument order.
  const occurrences = new Map<string, number>();
  for (const stem of stems) occurrences.set(stem, (occurrences.get(stem) ?? 0) + 1);
  for (const stem of [...occurrences.keys()].sort()) {
    const count = occurrences.get(stem) ?? 0;
    if (count > 1) {
      return {
        ok: false,
        reason:
          `model-tiers: the stem "${stem}" appears ${String(count)} times in the stem set — ` +
          "refusing a duplicated stem rather than letting the last occurrence win, because the " +
          "losing occurrence's assignment would vanish with no error anywhere.",
      };
    }
  }

  // ── The resolution. ─────────────────────────────────────────────────────────────────────────
  // SORTED BEFORE INSERTION so the map's own iteration order is a property of this expression
  // rather than of the caller's argument order. The generator writes bytes from this map, and an
  // ordering that followed the argument would be an ordering nothing in the emit path controls.
  const value = new Map<string, ModelAlias>();
  for (const stem of [...stems].sort()) {
    // The zero-config answer. This single site is what plan 29.1-02 widens to consult a preset and
    // a sparse per-role override; until then it is the literal the generator used to emit itself.
    value.set(stem, "inherit");
  }
  return { ok: true, value };
}

/**
 * The ROLE_COUNT relationship, asked BY THE CONSUMERS THAT ARE JUDGING THE LIVE ROLE CORPUS.
 * Returns the refusal reason, or `null` when the set really is the corpus.
 *
 * WHY THIS IS NOT A FLOOR INSIDE `resolveModels`, which is where plan 29.1-01 first put it and where
 * it was measurably wrong. `resolveModels` sits on the adapter generator's hot path, and that
 * generator RUNS OVER HERMETIC MIRRORS holding a SUBSET of the role corpus — its own committed suite
 * mirrors six roles, and scripts/adapters-freshness.ts and the foundation-guard harnesses mirror
 * whatever tree they are judging. Measured: with the equality inside the resolver, a six-role mirror
 * was refused and 22 committed cases went red. A smaller set is CORRECT there, not broken, so a
 * cardinality equality on that path refuses valid runs.
 *
 * IT IS ALSO A SECOND AUTHORITY FOR A PREDICATE THAT ALREADY HAS ONE, which is the deeper reason.
 * `listRoles` itself does NOT assert ROLE_COUNT — it refuses only an EMPTY corpus — and the two-sided
 * cardinality is asserted by `guard_kit_counts` over the LIVE tree. Duplicating that assertion inside
 * a shared resolver would make the weaker copy fire where the stronger one correctly does not, and
 * "delete the second authority rather than teach it a case" is this repository's own rule.
 *
 * WHAT STILL SATISFIES D-05, so nothing is lost by the move. D-05's requirement is that "role #18
 * cannot arrive unassigned". `resolveModels` assigns a value to EVERY stem it is handed, so on any
 * tree — live or mirrored — an eighteenth role is assigned rather than skipped. From plan 29.1-02,
 * when the TIERED preset carries per-role rows, the binding check becomes the strictly STRONGER
 * "every stem has a row", which names the unassigned stem instead of reporting a number that
 * disagrees, and which is correct on a mirror as well. This function remains the place a consumer
 * that genuinely means "is this the whole live corpus" asks that question out loud.
 */
export function roleCorpusCardinalityRefusal(stems: readonly string[]): string | null {
  if (stems.length === ROLE_COUNT) return null;
  return (
    `model-tiers: the stem set holds ${String(stems.length)} stem(s) against the kit authority's ` +
    `ROLE_COUNT of ${String(ROLE_COUNT)} — this consumer declared it was judging the whole live ` +
    "role corpus, and a set that is not the corpus assigns nothing to the remainder while " +
    "reporting success. If the role corpus genuinely changed, walk every derived consumer before " +
    "changing ROLE_COUNT: listRoles, the TIERED preset table, and guard_model_assignment."
  );
}
