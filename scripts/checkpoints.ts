// checkpoints.ts — the per-checkpoint autonomy matrix's ONE roster (AUTO-01, AUTO-02, AUTO-07).
//
// WHAT THIS MODULE IS. Phase 30 replaces the documentary `autonomy` scalar with an ENFORCED
// per-checkpoint ternary matrix (`block` / `notify` / `off`). This file owns the roster, the
// ternary vocabulary, the fail-closed canonicalizer, the floor-tier subset, the per-floor env var
// NAME derivation, the disposition resolution rule and the run banner. Every other surface —
// the config reader, the PreToolUse guard, the validator, the render — CONSULTS this module and
// declares none of it a second time.
//
// WHY IT IS ONE MODULE AND NOT A SET OF LITERALS SCATTERED ACROSS THE CONSUMERS. This repository's
// founding defect class is set-literal drift: a hand-maintained scan set / role list / allowlist
// that rots while every gate over it stays green. The remedy this tree has settled on is "derive
// the set, assert the count". So: `CHECKPOINT_DEFAULTS` is the ONLY declaration of the roster,
// `CHECKPOINTS` is `Object.keys()` over it, and `FLOOR_CHECKPOINTS` is an intersection with
// `SAFETY_FLOORS` — imported from ./audit-model.js, never restated (D-04). No second array literal
// of checkpoint ids exists in this file, and none may be added to a consumer.
//
// THE COMPILE-TIME HALF OF THE SAME RULE. `CHECKPOINT_DEFAULTS` carries
// `as const satisfies Record<Checkpoint, Disposition>`: adding a member to the `Checkpoint` union
// without giving it a default is a `tsc` diagnostic, not a runtime surprise. This is the
// `FROZEN_SOURCES` idiom from scripts/check-diff-disposition.ts, applied to the roster — Object.keys()
// over this table is the roster count, and nothing else declares it.
//
// THE TWO-KEY RULE (AUTO-03, D-07 / D-09 / D-10). Every checkpoint is ternary. A FLOOR-tier
// checkpoint differs only in this: lowering it below `block` takes TWO keys, not one.
//   key one — the agent-writable config declaration `checkpoints.<id>: notify | off`;
//   key two — the human-set session env var `GRUGOPS_FLOOR_<ID>=<name>`, read FRESH by the hook
//             process on every invocation.
// A config declaration with no matching env var is an UNAUTHORIZED LOWERING: the effective
// disposition stays `block`, so an agent that edits config alone changes nothing — and the banner
// and the denial both say so by name, so it changes nothing LOUDLY (D-10).
//
// HOW FAR KEY TWO ACTUALLY GOES, STATED HONESTLY. `process.env[NAME]` carries no provenance. The
// env var is un-forgeable from inside a tool call — an agent's own `export VAR=…` lands in the
// child env it spawns, which the hook process never inherits. It is NOT un-forgeable against an
// agent that can write the host's settings files: Claude Code's `env` settings block is reapplied
// to a live session and reaches the next hook subprocess identically (RESEARCH F-2). That residual
// is accepted and disclosed, not closed here. A grant is also SESSION-SCOPED, not per-action: once
// the variable is set, it authorizes lowered behaviour under that name until it is unset.

import { SAFETY_FLOORS } from "./audit-model.js";

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The vocabulary.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The ternary a checkpoint may be set to.
 *   block  — the human stop is enforced; the action is refused without a named human.
 *   notify — the action proceeds and is recorded (a finding note + a banner line).
 *   off    — the action proceeds silently.
 * There is no fourth value, and `block` is the default for every roster member.
 */
export type Disposition = "block" | "notify" | "off";

/**
 * The closed checkpoint roster.
 *
 * TRACER SCOPE (plan 30-01): exactly these two members. Plan 30-04 widens this union from the
 * DERIVED set — the tagged stop bullets in the 17 role `## Hard limits` and 19 workflow
 * `## Stop conditions` sections — and adds the two-sided derived-vs-roster assertion. Until then
 * this union and `CHECKPOINT_DEFAULTS` are the roster, and they are asserted against each other by
 * the compiler rather than by a comment.
 */
export type Checkpoint =
  | "protected_branch_merge"
  | "production_requires_human_confirmation";

/**
 * The roster AND its defaults, in ONE table. Object.keys() over this is the roster count; nothing
 * else declares it.
 *
 * `as const satisfies Record<Checkpoint, Disposition>` is load-bearing in both directions:
 *   - `satisfies` makes a `Checkpoint` member with no entry here a COMPILE error (the missing-member
 *     proof this tree previously only had via `assertNeverVerdict`);
 *   - `as const` keeps the literal value types, so `CHECKPOINT_DEFAULTS[id]` is a `Disposition` and
 *     not a widened `string`.
 *
 * Every default is `block`. That is AUTO-07 in one line: a repo that configures nothing gets the
 * un-lowered posture, and no floor is lowered by omission.
 */
export const CHECKPOINT_DEFAULTS = {
  protected_branch_merge: "block",
  production_requires_human_confirmation: "block",
} as const satisfies Record<Checkpoint, Disposition>;

/**
 * The roster, DERIVED. Never a second array literal of checkpoint ids (D-01).
 *
 * Iteration order is the declaration order of `CHECKPOINT_DEFAULTS` and nothing else declares it.
 * Consumers that COMPARE sets must sort both sides first, so that ordering can never change a
 * verdict — see `sortedIds()`.
 */
export const CHECKPOINTS = Object.keys(CHECKPOINT_DEFAULTS) as readonly Checkpoint[];

/** The canonical spellings of `Disposition`, derived from nothing else and used by the validator. */
export const DISPOSITIONS: readonly Disposition[] = ["block", "notify", "off"];

/** The env-var family that carries key two. One prefix, declared once. */
export const FLOOR_ENV_VAR_PREFIX = "GRUGOPS_FLOOR_";

/** The fixed zero-config banner line (D-20). Always printed, so absent and broken look different. */
export const BANNER_ALL_DEFAULT = "all checkpoints at default";

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Canonicalization — fail closed BY RULE, never by coercion.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Canonicalize a raw disposition value read from config.
 *
 * PITFALL 4, WHICH THIS FUNCTION EXISTS TO REFUSE. The sibling dial in scripts/context-io.ts
 * (`canonicalizeHumanAdmission`) had exactly this bug class in round 2 (GAP-C): `"OFF"`, `true`,
 * `1`, `null`, `[]` each took a different code path and one of them landed on the LENIENT value.
 * So this function does not switch, does not lower-case, does not coerce and has no `default:` arm
 * that could ever return anything else. It recognizes the THREE exact strings and returns `block`
 * for the entire complement — a present non-string, a wrong-case spelling, a number, `null`, an
 * array, an object and `undefined` all reach `block` BY RULE.
 *
 * The direction is deliberate: `block` is the strictest value, so an unrecognized config value
 * gates at least as strictly as the default. There is no input to this function that lowers a
 * checkpoint.
 */
export function canonicalizeDisposition(raw: unknown): Disposition {
  if (raw === "block") return "block";
  if (raw === "notify") return "notify";
  if (raw === "off") return "off";
  return "block";
}

/** `GRUGOPS_FLOOR_<UPPER_ID>` — the name of a floor's key two. Derived from the id, never listed. */
export function floorEnvVarName(id: Checkpoint): string {
  return FLOOR_ENV_VAR_PREFIX + id.toUpperCase();
}

/** Sorted copy of an id list, so a set comparison cannot be decided by iteration order. */
export function sortedIds(ids: readonly string[]): readonly string[] {
  return [...ids].sort();
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The floor-tier subset — derived from SAFETY_FLOORS, count-asserted.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Thrown when the floor derivation returns nothing, or returns fewer members than SAFETY_FLOORS. */
export class FloorCheckpointDerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FloorCheckpointDerivationError";
  }
}

/**
 * The floor-tier checkpoints: the roster members that are ALSO members of `SAFETY_FLOORS`
 * (scripts/audit-model.ts), which D-04 makes the canonical floor list. The floor ids are IMPORTED,
 * never restated here.
 *
 * PITFALL 6 — THE COUNT IS DERIVED OUTSIDE THE LOOP THAT BUILDS THE RESULT. A vacuity floor that
 * only refuses an EMPTY result happily returns 1 of 2 floors, and the missing one is exactly the
 * one an attacker wants missing. So the expected count is computed by walking `SAFETY_FLOORS` —
 * the OTHER side of the intersection — and compared against the length of the list built by
 * walking `checkpoints`. Two independent traversals, one equality. A silently SHORT derivation is
 * a named throw, not a quiet shrink.
 *
 * Exported (rather than inlined into the const below) for one stated reason: a test must be able
 * to drive it with an empty input and watch it THROW rather than return `[]`.
 */
export function deriveFloorCheckpoints(
  checkpoints: readonly Checkpoint[] = CHECKPOINTS,
  floors: readonly { readonly id: string }[] = SAFETY_FLOORS,
): readonly Checkpoint[] {
  const floorIds = new Set(floors.map((f) => f.id));
  const derived = [...new Set(checkpoints)].filter((c) => floorIds.has(c));

  // The independent denominator: counted by walking `floors`, never by measuring `derived`.
  //
  // IT COUNTS DISTINCT IDS, NOT ENTRIES — this is the ADJACENCY rule (D-02/D-03), and it is the
  // reason this is a Set and not a counter. The same human stop can be declared in more than one
  // place (a role's `## Hard limits` AND a workflow's `## Stop conditions`, and later more than one
  // of each); equal ids MERGE into one roster member with a site count of N. They never collide,
  // and they must never inflate the denominator into disagreeing with a correctly-merged result.
  const rosterIds = new Set<string>(checkpoints);
  const distinctInRoster = new Set<string>();
  for (const f of floors) if (rosterIds.has(f.id)) distinctInRoster.add(f.id);
  const expected = distinctInRoster.size;

  if (derived.length !== expected) {
    throw new FloorCheckpointDerivationError(
      `checkpoints: the floor-tier derivation produced ${derived.length} member(s) while ` +
        `SAFETY_FLOORS independently accounts for ${expected} — a derivation that returns short ` +
        `shrinks what is protected while presenting as a clean run, so it is refused rather than used`,
    );
  }
  if (derived.length === 0) {
    throw new FloorCheckpointDerivationError(
      `checkpoints: the floor-tier derivation produced NO members. An empty floor set would mean ` +
        `no checkpoint needs key two, i.e. every lowering could be granted by an agent editing ` +
        `config alone. An empty result is refused, never returned as an empty array`,
    );
  }
  return derived;
}

/** The floor-tier roster subset. Every member needs key two before a lowering takes effect. */
export const FLOOR_CHECKPOINTS: readonly Checkpoint[] = deriveFloorCheckpoints();

/** Is this checkpoint floor-tier (i.e. does lowering it need key two)? */
export function isFloorCheckpoint(id: Checkpoint): boolean {
  return FLOOR_CHECKPOINTS.includes(id);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Resolution — the one place the two-key rule is applied.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The environment shape the resolver reads. Narrower than `process.env`, so a test can pass a literal. */
export type EnvLike = Readonly<Record<string, string | undefined>>;

/** What a checkpoint's config declaration resolves to once the two-key rule has been applied. */
export interface CheckpointResolution {
  readonly id: Checkpoint;
  /** The canonicalized value the config DECLARED (what the banner reports). */
  readonly declared: Disposition;
  /** The value actually ENFORCED (what the decision uses). Never lower than `declared`. */
  readonly effective: Disposition;
  /** Floor-tier members need key two; non-floor members do not. */
  readonly isFloor: boolean;
  /** The name of key two, or `null` for a non-floor checkpoint. */
  readonly envVarName: string | null;
  /** The non-empty value of key two, or `null` when it is absent/empty. */
  readonly authorizedBy: string | null;
  /** A lowering was declared and NOT authorized: enforced as `block`, reported by name (D-10). */
  readonly unauthorizedLowering: boolean;
}

/**
 * Apply the two-key rule to ONE checkpoint.
 *
 * The rule, in full:
 *   - `declared === "block"` → `effective = "block"`. Nothing to authorize; key two is irrelevant.
 *   - non-floor member declared `notify`/`off` → `effective = declared`. One key is the whole rule.
 *   - FLOOR member declared `notify`/`off`:
 *       key two present and non-empty → `effective = declared` (the lowering takes effect);
 *       key two absent or empty      → `effective = "block"` and `unauthorizedLowering = true`.
 *
 * `env` is read by the CALLER and passed in, so the freshness of the read is the hook's decision
 * (it re-reads `process.env` on every invocation) and a test can drive every arm without mutating
 * the ambient environment.
 */
export function resolveCheckpoint(
  id: Checkpoint,
  matrix: Readonly<Record<Checkpoint, Disposition>>,
  env: EnvLike,
): CheckpointResolution {
  const declared = canonicalizeDisposition(matrix[id]);
  const isFloor = isFloorCheckpoint(id);
  const envVarName = isFloor ? floorEnvVarName(id) : null;

  if (declared === "block") {
    return {
      id,
      declared,
      effective: "block",
      isFloor,
      envVarName,
      authorizedBy: null,
      unauthorizedLowering: false,
    };
  }

  if (!isFloor) {
    return {
      id,
      declared,
      effective: declared,
      isFloor,
      envVarName,
      authorizedBy: null,
      unauthorizedLowering: false,
    };
  }

  const raw = env[envVarName as string];
  const authorizedBy = typeof raw === "string" && raw.length > 0 ? raw : null;
  return {
    id,
    declared,
    effective: authorizedBy === null ? "block" : declared,
    isFloor,
    envVarName,
    authorizedBy,
    unauthorizedLowering: authorizedBy === null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The run banner (D-19 / D-20).
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ONE line describing the live matrix, printed on EVERY guard invocation.
 *
 * WHY IT REPORTS THE DECLARED VALUE AND NOT THE EFFECTIVE ONE. An unauthorized lowering enforces
 * `block`, which IS the default — so a banner keyed on the effective value would print
 * `all checkpoints at default` over a config that plainly declares `off`, and the run's own denial
 * would then name a checkpoint the banner had just called default. That disagreement is precisely
 * the Phase 28 AP-1 shape (a line asserting something the run did not establish). The banner
 * therefore reports what the config DECLARED, and says in the same breath whether the declaration
 * is authorized.
 *
 * D-20: with nothing declared away from its default the line is the FIXED literal
 * `all checkpoints at default` — always present, so a missing banner and a broken banner look
 * different.
 */
export function renderCheckpointBanner(
  matrix: Readonly<Record<Checkpoint, Disposition>>,
  env: EnvLike,
): string {
  const parts: string[] = [];
  for (const id of CHECKPOINTS) {
    const r = resolveCheckpoint(id, matrix, env);
    if (r.declared === CHECKPOINT_DEFAULTS[id]) continue;
    if (r.unauthorizedLowering) {
      parts.push(
        `${id}=${r.declared} NOT AUTHORIZED (${r.envVarName} absent; enforced as block)`,
      );
    } else if (r.authorizedBy !== null) {
      parts.push(`${id}=${r.declared} authorized by ${r.envVarName}=${r.authorizedBy}`);
    } else {
      parts.push(`${id}=${r.declared}`);
    }
  }
  return parts.length === 0
    ? BANNER_ALL_DEFAULT
    : `checkpoints not at default: ${parts.join(", ")}`;
}
