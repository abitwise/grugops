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
// UNKNOWN - verify: THE ALIAS VOCABULARY ITSELF (assumption A1, recorded confidence LOW).
// Claude Code's `model:` frontmatter accepts the bare aliases `opus` / `sonnet` / `haiku` in a
// sub-agent adapter, with the same meaning as in the CLI. THE ONLY SOURCE FOR THIS IS CLAUDE.md:84
// (`sonnet | opus | haiku | full model id | inherit (the default)`), which is this repository's own
// recorded research; it was NOT re-verified against vendor documentation during phase 29.1's
// research, and no other source is named here.
//
// WHAT IS AT RISK, AND WHAT IS NOT. If the platform rejects a bare alias, every adapter emitted under
// the `tiered` preset fails to load; the remedy is a one-line change to MODEL_ALIASES below plus a
// regeneration. The ZERO-CONFIG path is unaffected in every case, because it emits `inherit`, which
// is the documented default under the same source.
//
// RATIFIED 2026-08-19 by Olger Oeselg (plan 29.1-02 Task 1, option `ratify-as-specified`). The
// `models` config key shape and the closed preset-name set ship as D-05 and D-07 wrote them, and A1
// ships as this recorded note rather than as an unstated fact. The ratifying session cross-checked
// the vocabulary and agreed with CLAUDE.md:84 — that agreement is a SESSION-LEVEL CROSS-CHECK, NOT a
// fetched vendor-documentation citation, and it does not upgrade this note or add a source to it.
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

// ── PRESET_NAMES — the closed preset vocabulary (D-07, D-08) ──────────────────────────────────
//
// THE SET IS CLOSED AND EXACTLY ONE PRESET SHIPS BESIDE THE DEFAULT. `none` is the zero-config
// position — every role `inherit` — and `tiered` is the one shipped opinion. Any other value is a
// refusal naming the value and this set (D-07). Adding a second preset later is therefore a VISIBLE
// SOURCE CHANGE that an author makes here, with a rationale table beside it, rather than a
// config-side surprise a user discovers by typing a name that happens to resolve.
//
// WHY THE NAME IS `tiered` AND NOT `cost` (D-08). `"preset": "cost"` is itself a cost claim, and
// MODEL-07 forbids shipping an unmeasured one. No measurement is taken in this phase, so the name
// states the MECHANISM — roles sit at different tiers — and asserts nothing about spend.
//
// The TUPLE is the declaration and the union is derived from it, for the same reason MODEL_ALIASES
// is written that way: two hand-written copies of one closed set is the drift class this repository
// names as its second systemic failure mode.
export const PRESET_NAMES = ["none", "tiered"] as const;

/** The closed set of legal preset names, derived from the tuple so the two cannot disagree. */
export type PresetName = (typeof PRESET_NAMES)[number];

/**
 * Preset-name membership, decided by EXACT STRING EQUALITY against the two constants.
 *
 * Takes `unknown` for the same reason `isModelAlias` does: the value may arrive from user-authored
 * JSON as a number, a null or an object, and each must be refused rather than coerced. No regular
 * expression decides this, here or anywhere downstream.
 */
export function isPresetName(value: unknown): value is PresetName {
  if (typeof value !== "string") return false;
  return PRESET_NAMES.some((name) => name === value);
}

// ── TIERED — the one shipped preset, one row per role, each row carrying its reason ───────────
//
// D-09 assigns `opus` to four roles and `sonnet` to the other thirteen. NO ROLE IS ASSIGNED `haiku`,
// and that is the load-bearing shape decision rather than an oversight: every role in this kit either
// writes into the shared verified context or produces an artifact a human signs off on, and the
// behavior gate catches CORRECTNESS, not JUDGMENT. A thin-model ticket, test plan or UAT pack
// degrades PAST the one mechanism that would have caught it rather than into it. `haiku` stays a
// legal alias a user may set per role; the shipped preset simply does not reach for it.
//
// The literal MODEL-03 reading — `opus` on three, `haiku` on three, `sonnet` on eleven — was
// considered and rejected in D-09: it exercises all three aliases but puts the thinnest tier exactly
// where quality degradation is least visible.
//
// EVERY ROW CARRIES A RATIONALE BECAUSE THE TYPE REQUIRES ONE (D-10). The reason is not a comment
// beside the assignment and not a prose document elsewhere in the tree; it is the same object, so it
// cannot drift away from what it explains, and a row written without one does not compile.
//
// THE ONE DELIBERATELY ARGUABLE ROW IS `incident-responder`, and D-09 records it as such: an
// incident is where time pressure and blast radius coincide, the role was considered for the
// stronger tier, and it was left on `sonnet` because it is procedural and hands to a named human.
// Its rationale says so in its own words rather than by citing D-09, because a decision identifier
// carries a digit and no rationale may carry one — see the paragraph immediately below.
//
// NO ROW ARGUES SPEND (D-14 / MODEL-07). Each rationale argues QUALITY: what a thinner model would
// degrade past rather than into, and — for the four strong roles — the specific harm D-09 records.
// No rationale asserts a saving, names a price, or contains a digit; scripts/model-tiers.test.ts
// asserts the digit half of that mechanically, so a percentage cannot be introduced without a red.
export const TIERED: readonly RoleTier[] = [
  {
    stem: "agents-md-scribe",
    alias: "sonnet",
    rationale:
      "Writes the AGENTS.md substrate every host CLI reads. The work is transcription against a " +
      "stated shape rather than open judgment, and a malformed substrate is refused by the structure " +
      "validator before any agent loads it.",
  },
  {
    stem: "architect-design",
    alias: "opus",
    rationale:
      "Architectural boundaries are expensive to reverse. A boundary drawn in the wrong place is " +
      "caught by no behavior gate — the code that honours it passes every test — and the mistake is " +
      "paid for by every later change that has to route around it.",
  },
  {
    stem: "ba-pm",
    alias: "sonnet",
    rationale:
      "Turns a request into scoped epics against a stated template. The judgment is bounded by the " +
      "requirement trail, which a human reads and signs, so a weaker reading surfaces at that review " +
      "rather than silently downstream.",
  },
  {
    stem: "brownfield-mapper",
    alias: "sonnet",
    rationale:
      "Surveys an existing repository and records what it finds. The output is observation against " +
      "the tree, and a wrong observation is contradicted by the tree itself the moment a later role " +
      "reads it.",
  },
  {
    stem: "compliance-officer",
    alias: "opus",
    rationale:
      "A misclassified regulated-data field is real-world harm rather than rework. No gate in this " +
      "kit decides whether a field is regulated, so this classification is the only thing standing " +
      "between the user and a disclosure nobody authorised.",
  },
  {
    stem: "factory-coach",
    alias: "sonnet",
    rationale:
      "Explains the kit to the person using it. A weaker explanation is corrected by that person in " +
      "the same conversation, which is the shortest correction loop any role in this kit has.",
  },
  {
    stem: "frontend-ui",
    alias: "sonnet",
    rationale:
      "Implements interface work behind the same behavior gate as every other engineering role, and " +
      "its output is judged visually by a human before it merges — two independent catches on a " +
      "surface where a defect is immediately apparent.",
  },
  {
    stem: "greenfield-mapper",
    alias: "sonnet",
    rationale:
      "Scaffolds a new repository from a stated stack. The shape is prescribed by the kit rather " +
      "than invented, and the structure validator refuses a scaffold that does not match it.",
  },
  {
    stem: "incident-responder",
    alias: "sonnet",
    rationale:
      "Procedural: it follows a stated runbook and hands to a named human, so the judgment that " +
      "decides an incident is the human's rather than the model's. THIS IS THE DELIBERATELY ARGUABLE " +
      "ASSIGNMENT — an incident is where time pressure and blast radius coincide, this role " +
      "was considered for the stronger tier, and it was left here. A later reader who disputes the " +
      "call has the reasoning in front of them, which is exactly what this field exists for.",
  },
  {
    stem: "installer",
    alias: "sonnet",
    rationale:
      "Runs an install that is idempotent, additive and reversible by construction, with a dry-run " +
      "and a doctor that inspect it. A mistake is visible before it is applied rather than after.",
  },
  {
    stem: "orchestrator",
    alias: "opus",
    rationale:
      "Decomposition quality determines every downstream task. A subtask framed wrongly is executed " +
      "faithfully by every role after it, and nothing downstream asks whether the decomposition " +
      "itself was right — so this is the one place a weaker reading propagates instead of being " +
      "caught.",
  },
  {
    stem: "qe-e2e",
    alias: "sonnet",
    rationale:
      "Writes tests against acceptance criteria a human already signed. The criteria bound the " +
      "judgment, and a test that fails to discriminate is caught by the red-first discipline the " +
      "gate already enforces.",
  },
  {
    stem: "release-manager",
    alias: "sonnet",
    rationale:
      "Assembles a changelog and a release from artifacts that already exist. The human holds the " +
      "merge and the deploy mechanically, so this role proposes and never decides.",
  },
  {
    stem: "security-nfr",
    alias: "opus",
    rationale:
      "A missed vulnerability is real-world harm rather than rework. The behavior gate catches a " +
      "broken test and never an absent threat, so nothing downstream asks the question this role " +
      "failed to ask.",
  },
  {
    stem: "software-engineer",
    alias: "sonnet",
    rationale:
      "Implements a ready ticket behind the behavior gate, which is the mechanism this kit relies on " +
      "most and which judges this role's output directly. A weaker implementation degrades INTO that " +
      "gate rather than past it.",
  },
  {
    stem: "system-analyst",
    alias: "sonnet",
    rationale:
      "Turns an epic into a ready ticket against a stated checklist, and that ticket is read by a " +
      "human before any implementation starts — a review step sitting between this role and any " +
      "code it influences.",
  },
  {
    stem: "uat-planner",
    alias: "sonnet",
    rationale:
      "Assembles the acceptance scenarios a human then runs by hand. A thin scenario is felt by the " +
      "person executing it rather than accepted silently, which is the strongest form of review any " +
      "artifact in this kit receives.",
  },
];

// The tier table's exact cardinality, pinned beside the table it describes.
//
// PROMOTE TRIGGER: A NEW ROLE FILE ARRIVING under agent-factory/roles/. That is the ONLY event that
// legitimately moves this number, and it obliges the author to add a row to TIERED with a rationale
// in the same change — the whole point of MODEL-03 is that role eighteen cannot arrive unassigned.
//
// EVERY CONSUMER AN EDITOR MUST WALK BEFORE CHANGING IT: `listRoles` (scripts/kit-model.ts — the
// role-set authority this number mirrors), `resolveModels` below (which reads TIERED under the
// `tiered` preset), `guard_model_assignment` (plan 29.1-04 — where a wrong number stops a release),
// and the adapter generator's resolution call (scripts/generate-role-adapters.ts, which hands this
// resolver the stems it derived).
//
// WHERE THE EXACT CARDINALITY IS ADJUDICATED, and why it is not adjudicated here. THIS LIBRARY
// THROWS ONLY ON THE VACUOUS SET. `guard_model_assignment` owns the two-sided count over the LIVE
// tree, exactly as `guard_kit_counts` owns it for the kit sets, because this resolver sits on the
// adapter generator's hot path and that generator runs over hermetic MIRRORS holding a SUBSET of the
// role corpus — a corpus-cardinality equality on this path refuses valid runs. The same argument, in
// full, is recorded on `roleCorpusCardinalityRefusal` below. What this library enforces instead is
// the strictly STRONGER per-stem check: every stem handed to the resolver has a row, and an
// unassigned stem is NAMED rather than reported as a number that disagrees.
export const MODEL_TIERS_COUNT = ROLE_COUNT;

// The ONE vacuity sentence, declared once and returned by both table predicates below. An empty
// table and a SHORT table are different facts and must not share a sentence; an empty table and an
// empty table must not have two.
const TIERED_VACUITY_REFUSAL =
  "model-tiers: the TIERED preset table is EMPTY — refusing to resolve a preset from a table with " +
  "no entries. A coverage comparison against an empty table passes without comparing anything, " +
  "which is the vacuous pass this floor exists to make impossible.";

/**
 * The tier table's OWN integrity, decidable WITHOUT knowing which roles exist on the tree.
 *
 * These are properties of the table alone — vacuity, a repeated stem, a blank reason — so they are
 * correct on a hermetic mirror as well as on the live tree, and `resolveModels` runs them on every
 * `tiered` resolution. Each finding is its OWN sentence rather than a clause of a merged one, so
 * three different mutations give three readable answers instead of one paragraph.
 *
 * Takes the table as a parameter defaulting to the shipped one, so an oracle can drive an
 * adversarial table without mutating module state and without typing a stem out.
 */
export function tieredTableRefusals(table: readonly RoleTier[] = TIERED): string[] {
  if (table.length === 0) return [TIERED_VACUITY_REFUSAL];

  const findings: string[] = [];

  // A repeated stem, reported by NAME and by COUNT rather than resolved last-wins. Counted over the
  // whole table first, then reported in SORTED stem order, so which duplicate is named is a property
  // of the table rather than of its authoring order.
  const occurrences = new Map<string, number>();
  for (const row of table) occurrences.set(row.stem, (occurrences.get(row.stem) ?? 0) + 1);
  for (const stem of [...occurrences.keys()].sort()) {
    const count = occurrences.get(stem) ?? 0;
    if (count > 1) {
      findings.push(
        `model-tiers: the stem "${stem}" appears ${String(count)} times in the TIERED preset ` +
          "table — refusing a duplicated entry rather than letting the last occurrence win, because " +
          "the losing entry's assignment and its argument would both vanish with no error anywhere. " +
          "Remedy: delete the duplicate; do NOT rely on the surviving one being the intended one.",
      );
    }
  }

  // A blank reason, which D-10 makes a defect rather than a style note.
  for (const row of [...table].sort((a, b) => a.stem.localeCompare(b.stem))) {
    if (row.rationale.trim().length === 0) {
      findings.push(
        `model-tiers: the TIERED entry for "${row.stem}" carries an EMPTY rationale — D-10 makes the ` +
          "rationale a REQUIRED field precisely so a later reader can dispute the tier, and an " +
          "assignment nobody argued for is an assignment nobody can challenge. Remedy: write the " +
          "quality argument for this role's tier; do NOT delete the field.",
      );
    }
  }

  return findings;
}

/**
 * The tier table's relationship to a role corpus, asked BY A CONSUMER THAT IS JUDGING THAT CORPUS.
 * Returns every finding, or an empty array when the table and the corpus agree.
 *
 * THIS IS THE BOTH-DIRECTIONS SET EQUALITY, and both directions are separate findings on purpose. A
 * count identity passes while one stem is claimed by the table and missing from the corpus and
 * another is claimed by the corpus and missing from the table — the exact defect shape recorded in
 * scripts/check-foundation-guards.ts's set-membership-over-count-identity rule. A misspelled stem
 * moves NEITHER number, so a count-only check reads green on it.
 *
 * THE ROW COUNT IS DERIVED INDEPENDENTLY of the membership loops that follow, so a SILENTLY SHORT
 * table is caught as well as an EMPTY one: the length is read off the table itself rather than off
 * the loop that consumes it.
 *
 * WHY `resolveModels` DOES NOT CALL THIS. This predicate compares the table against A WHOLE CORPUS,
 * and the resolver runs over hermetic mirrors holding a subset of it — see MODEL_TIERS_COUNT's block
 * above and `roleCorpusCardinalityRefusal` below. The consumers that genuinely mean "is this the
 * whole live corpus" ask this out loud.
 */
export function tieredCorpusRefusals(
  stems: readonly string[],
  table: readonly RoleTier[] = TIERED,
): string[] {
  if (table.length === 0) return [TIERED_VACUITY_REFUSAL];

  const findings: string[] = [];

  const rowCount = table.length;
  const stemCount = stems.length;
  if (rowCount !== stemCount) {
    findings.push(
      `model-tiers: the TIERED preset table holds ${String(rowCount)} row(s) against the ` +
        `${String(stemCount)} role stem(s) derived from the role-set authority. The pin is ` +
        "TWO-SIDED: a table shorter than the corpus leaves roles unassigned, and a table longer " +
        "than it assigns a tier to something that is not a role. Remedy: reconcile the table with " +
        "agent-factory/roles/ and walk every consumer named on MODEL_TIERS_COUNT.",
    );
  }

  const tableStems = new Set(table.map((r) => r.stem));
  const corpusStems = new Set(stems);

  for (const stem of [...tableStems].sort()) {
    if (!corpusStems.has(stem)) {
      findings.push(
        `model-tiers: the TIERED preset table assigns a tier to "${stem}", which is NOT one of the ` +
          "role stems derived from the role-set authority — direction TABLE → CORPUS. Legal stems " +
          "are whatever listRoles() returns on this tree; a stem here that is not one of them is a " +
          "typo or a role that was renamed or deleted without the table following it.",
      );
    }
  }

  for (const stem of [...corpusStems].sort()) {
    if (!tableStems.has(stem)) {
      findings.push(
        `model-tiers: the role stem "${stem}" has NO entry in the TIERED preset table — direction ` +
          "CORPUS → TABLE. MODEL-03 exists so that a newly arrived role cannot be silently " +
          "unassigned; add an entry for this stem with the quality argument for its tier.",
      );
    }
  }

  return findings;
}

/** What a caller may ask of the resolver beyond the stems themselves. */
export interface ResolveModelsOptions {
  /**
   * The ALREADY-RESOLVED preset name. The resolver validates it by exact equality anyway — a JS
   * caller can hand over anything — but it does not read configuration to obtain it. Absent means
   * `none`, which is the zero-config contract.
   */
  readonly preset?: PresetName;
}

/**
 * Resolve a model alias for every role stem the caller derived.
 *
 * PURE. It opens no file, reads no environment variable and joins no path. The stems come in as an
 * argument, so the caller's derivation (through the kit authority) stays the one place the role set
 * is decided.
 *
 * THE FLOORS RUN BEFORE THE MAP IS BUILT, and each states a DIFFERENT fact:
 *   0. ILLEGAL PRESET — a name outside the closed set, refused naming the value and the legal set.
 *   1. EMPTY          — a resolution over nobody is the vacuous pass, not a small clean run.
 *   2. DUPLICATE      — a repeated stem would otherwise be silently resolved last-wins.
 *   3. Under `tiered` only: the table's own integrity, and then the per-stem coverage check.
 *
 * THE `tiered` COVERAGE CHECK IS THE STRICTLY STRONGER FORM OF MODEL-03'S GUARANTEE. Rather than
 * comparing two numbers, it asks whether EVERY stem handed to this resolver has an entry, and NAMES
 * the ones that do not. That is correct on a hermetic mirror carrying a subset of the corpus, where
 * a cardinality equality is not — and it tells the reader WHICH role arrived unassigned instead of
 * telling them that two numbers disagreed.
 *
 * THE ROLE_COUNT RELATIONSHIP IS DELIBERATELY NOT CHECKED HERE — see `roleCorpusCardinalityRefusal`
 * below for where it went and why.
 */
export function resolveModels(
  stems: readonly string[],
  options?: ResolveModelsOptions,
): ModelResolution {
  // ── Floor 0: the preset name, by EXACT EQUALITY against the closed set. ─────────────────────
  const preset: PresetName = options?.preset ?? "none";
  if (!isPresetName(preset)) {
    return {
      ok: false,
      reason:
        `model-tiers: ${JSON.stringify(preset)} is not a legal preset name. The legal set is ` +
        `exactly: ${PRESET_NAMES.map((n) => `"${n}"`).join(", ")}. Remedy: use one of those two ` +
        "names; adding a third preset is a source change in scripts/model-tiers.ts, not a value a " +
        "configuration file can invent.",
    };
  }

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
  const sorted = [...stems].sort();
  const value = new Map<string, ModelAlias>();

  if (preset === "tiered") {
    // ── Floor 3a: the table's own integrity, before a single stem is looked up in it. ─────────
    const tableRefusals = tieredTableRefusals();
    if (tableRefusals.length > 0) {
      // Joined with a newline rather than merged into one sentence: each refusal keeps its own
      // wording, so a reader sees how many distinct defects the table has rather than one blur.
      return { ok: false, reason: tableRefusals.join("\n") };
    }

    // ── Floor 3b: per-stem coverage, in ONE loop that both builds the map and collects the
    // stems it could not build. Two passes would be two authorities for one predicate. ─────────
    const byStem = new Map<string, ModelAlias>(TIERED.map((row) => [row.stem, row.alias]));
    const unassigned: string[] = [];
    for (const stem of sorted) {
      const alias = byStem.get(stem);
      if (alias === undefined) {
        unassigned.push(stem);
        continue;
      }
      value.set(stem, alias);
    }
    if (unassigned.length > 0) {
      return {
        ok: false,
        reason:
          `model-tiers: the "tiered" preset assigns nothing to ${String(unassigned.length)} of the ` +
          `${String(sorted.length)} stem(s) handed to this resolver: ` +
          `${unassigned.map((s) => `"${s}"`).join(", ")}. MODEL-03 exists so that a role cannot ` +
          "arrive unassigned; add an entry to TIERED for each stem named here, with the quality " +
          "argument for its tier. Remedy: do NOT fall back to `inherit` for the remainder — a " +
          "partial preset is a tier the user believes they set and did not.",
      };
    }
    return { ok: true, value };
  }

  for (const stem of sorted) {
    // The zero-config answer, and the `none` preset's answer, which are the same answer by design.
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
