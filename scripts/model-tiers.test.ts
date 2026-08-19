// model-tiers.test.ts — oracle for the per-role model resolver (scripts/model-tiers.ts).
//
// model-tiers is the single answer to "which model alias does role X get". This file pins the
// properties that make that answer safe to emit into shipped frontmatter:
//
//   (1) THE ZERO-CONFIG CONTRACT — with no configuration anywhere, every role resolves to
//       `inherit`, which is the value the generator emitted as a literal before this phase. MODEL-01
//       requires the emitted BYTES not to move, and this is the half of that claim a unit test can
//       decide; scripts/adapter-byte-baseline.test.ts decides the other half against a frozen commit.
//   (2) THE VACUITY FLOOR, AND THE SHORT-SET FLOOR BESIDE IT — an EMPTY stem set and a stem set of
//       the WRONG SIZE are DIFFERENT facts and get different refusals. A resolver that returns an
//       empty map over an empty input reports a clean assignment of nothing, which is the
//       fully-green-over-a-broken-tree defect this milestone exists to delete.
//   (3) DETERMINISM UNDER ARGUMENT ORDER — the resolved map is consumed by a generator that writes
//       bytes, so the map's own insertion order must be a property of the expression rather than of
//       the caller's argument order. Shuffling the input must not move the answer.
//   (4) THE CLOSED ALIAS SET — exactly four aliases, decided by exact string equality. A four-member
//       allow-list is what keeps a YAML-significant byte out of the emitted frontmatter; a pattern
//       match would admit whatever the pattern happened not to exclude.
//
// EVERY CORPUS IS DERIVED AT RUN TIME from the kit authority (listRoles). No role stem is written as
// a literal here, because a hand-written stem list inside the oracle for a derivation authority is
// the set-literal-drift class this milestone exists to delete. The only constructed inputs are the
// deliberately adversarial ones — empty, short, duplicated — and each is built BY TRANSFORMING the
// derived set rather than by typing one out.
//
// Drives the COMMITTED compiled scripts/model-tiers.js (never the .ts) — the repo idiom, and the
// artifact every consumer actually imports.

import { describe, it, expect } from "vitest";
import { join } from "node:path";

import { listRoles, ROLE_COUNT } from "./kit-model.js";
import {
  MODEL_ALIASES,
  isModelAlias,
  resolveModels,
  roleCorpusCardinalityRefusal,
  type ModelAlias,
} from "./model-tiers.js";

const ROOT = join(import.meta.dirname, "..");

/**
 * The role stems, derived through the kit authority at run time. `listRoles` returns FILENAMES and
 * the resolver is keyed by STEM, so the extension is dropped here — the one place in this file that
 * knows the difference.
 */
const kitStems = (): string[] => listRoles(ROOT).map((f) => f.slice(0, -".md".length));

/** The success arm's value, or a failure that names the refusal instead of a bare undefined. */
const resolvedOrFail = (stems: readonly string[]): ReadonlyMap<string, ModelAlias> => {
  const r = resolveModels(stems);
  if (!r.ok) throw new Error(`expected a resolution, got a refusal: ${r.reason}`);
  return r.value;
};

/** A map rendered as a stable string, so two resolutions can be compared including their ORDER. */
const stringifyMap = (m: ReadonlyMap<string, ModelAlias>): string =>
  JSON.stringify([...m.entries()]);

describe("model-tiers: the zero-config resolution (plan 29.1-01)", () => {
  it("resolves EVERY role derived from the kit authority to `inherit` when nothing is configured", () => {
    // ── THE PREMISE, BEFORE THE CLAIM. ───────────────────────────────────────────────────────
    const stems = kitStems();
    expect(
      stems.length,
      "the role corpus must really have been derived before anything is claimed about its resolution",
    ).toBe(ROLE_COUNT);

    // ── THE CLAIM. ───────────────────────────────────────────────────────────────────────────
    const resolved = resolvedOrFail(stems);
    expect(
      resolved.size,
      "the resolved map must carry one entry per derived stem — a map SHORTER than its input assigns nothing to the remainder while reporting success",
    ).toBe(ROLE_COUNT);

    // Every derived stem is present AND carries `inherit`. Asserted as a findings array rather than
    // inside the loop, so a red names every stem that moved instead of the first one.
    const wrong: string[] = [];
    for (const stem of stems) {
      if (!resolved.has(stem)) {
        wrong.push(`${stem} — absent from the resolved map`);
        continue;
      }
      const alias = resolved.get(stem);
      if (alias !== "inherit") wrong.push(`${stem} — resolved to "${String(alias)}"`);
    }
    expect(
      wrong,
      'the zero-config answer for every role is "inherit" — that is the literal the generator emitted before this phase, and MODEL-01 requires the emitted bytes not to move',
    ).toEqual([]);
  });

  it("assigns `inherit` and nothing else — the resolved value set is a single member", () => {
    const resolved = resolvedOrFail(kitStems());
    expect([...new Set(resolved.values())]).toEqual(["inherit"]);
  });
});

describe("model-tiers: the refusals, each by its own name (plan 29.1-01)", () => {
  it("REFUSES an EMPTY stem set rather than returning an empty map", () => {
    const r = resolveModels([]);
    expect(
      r.ok,
      "an empty stem set must be a refusal — a resolver that returns an empty map over an empty input reports a clean assignment of nothing",
    ).toBe(false);
    if (r.ok) return;
    expect(r.reason).toMatch(/EMPTY/);
    // The refusal must state WHY an empty set is not a small clean run, not merely that it was empty.
    expect(r.reason).toMatch(/vacuous/);
  });

  it("the ROLE_COUNT relationship REFUSES a SHORT set naming BOTH numbers — a distinct fact from an empty one", () => {
    const stems = kitStems();
    const short = stems.slice(0, stems.length - 1);
    const reason = roleCorpusCardinalityRefusal(short);
    expect(reason, "a set that is not the live role corpus must be refused by name").not.toBeNull();
    // Both numbers, so the reader is told what was derived AND what was expected.
    expect(reason).toContain(String(short.length));
    expect(reason).toContain(String(ROLE_COUNT));
    // …and it must NOT be the empty-set sentence. A short set and an empty set are different facts.
    expect(reason).not.toMatch(/vacuous/);
    // The refusal names the walk an author owes before changing the pinned count.
    expect(reason).toMatch(/ROLE_COUNT/);
  });

  it("the ROLE_COUNT relationship ACCEPTS the live corpus, so the predicate is not simply always-refusing", () => {
    expect(roleCorpusCardinalityRefusal(kitStems())).toBeNull();
  });

  it("resolveModels ACCEPTS a MIRROR-SIZED subset — the cardinality is the consumer's question, not its own", () => {
    // This is the direction the first draft of this module got wrong, and the reason the cardinality
    // check is a separate named predicate. The adapter generator runs over hermetic mirrors carrying
    // a SUBSET of the role corpus — its own suite mirrors six roles — where a smaller set is correct
    // rather than broken. A cardinality equality inside the resolver refused those valid runs.
    const stems = kitStems();
    const mirror = stems.slice(0, 6);
    const r = resolveModels(mirror);
    expect(r.ok, "a mirror-sized subset must resolve rather than be refused").toBe(true);
    if (!r.ok) return;
    expect(r.value.size).toBe(mirror.length);
    // Every member of the subset still got an assignment — which is the property D-05 actually
    // needs ("role #18 cannot arrive unassigned"), and it holds on a mirror as well as on the corpus.
    for (const stem of mirror) expect(r.value.get(stem)).toBe("inherit");
  });

  it("REFUSES a DUPLICATED stem naming the stem and its occurrence count — never last-wins", () => {
    // Built by TRANSFORMING the derived set, so no stem is typed out: the last stem is replaced by
    // the first, which leaves the length at ROLE_COUNT and puts exactly one stem at count 2. The
    // length floor therefore cannot be what refuses this input.
    const stems = kitStems();
    const duped = [...stems.slice(0, stems.length - 1), stems[0]];
    expect(duped.length, "the duplicate case must clear the length floor to reach the duplicate check").toBe(
      ROLE_COUNT,
    );

    const r = resolveModels(duped);
    expect(r.ok, "a duplicated stem must be refused rather than resolved last-wins").toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain(stems[0]);
    expect(r.reason).toContain("2");
  });
});

describe("model-tiers: determinism and the closed alias set (plan 29.1-01)", () => {
  it("two calls with the same stem set produce byte-identical maps, ORDER included", () => {
    const stems = kitStems();
    expect(stringifyMap(resolvedOrFail(stems))).toBe(stringifyMap(resolvedOrFail(stems)));
  });

  it("a SHUFFLED stem set produces the identical map — the order is the expression's, not the caller's", () => {
    // This is the case the internal sort exists for. Without it the map's insertion order would
    // follow the argument order, and an iteration-order dependence could reach an emitted file.
    const stems = kitStems();
    const shuffled = [...stems].reverse();
    expect(shuffled, "the shuffle must really have moved something").not.toEqual(stems);
    expect(stringifyMap(resolvedOrFail(shuffled))).toBe(stringifyMap(resolvedOrFail(stems)));
  });

  it("MODEL_ALIASES holds EXACTLY four DISTINCT members — two-sided, so 3 and 5 both fail", () => {
    expect(
      MODEL_ALIASES.length,
      "the alias vocabulary is a closed four-member allow-list; adding or removing one is a deliberate act that obliges the author to walk every consumer",
    ).toBe(4);
    // Distinctness beside the count: a duplicated member would otherwise pad the count to 4 while
    // the vocabulary was actually three aliases wide.
    expect(new Set(MODEL_ALIASES).size).toBe(4);
    expect(MODEL_ALIASES).toContain("inherit");
  });

  it("alias membership is EXACT STRING EQUALITY — a near miss, a case fold and a substring all fail", () => {
    for (const a of MODEL_ALIASES) expect(isModelAlias(a)).toBe(true);
    // Each of these would be admitted by some plausible pattern match, and none is a legal alias.
    for (const bad of [
      "Inherit",
      "INHERIT",
      "inherit ",
      " inherit",
      "inherits",
      "in",
      "claude-opus-4-20250514",
      "",
    ]) {
      expect(isModelAlias(bad), `"${bad}" must not be admitted as an alias`).toBe(false);
    }
    // Non-strings are refused rather than coerced.
    for (const bad of [null, undefined, 0, 1, true, {}, ["inherit"]]) {
      expect(isModelAlias(bad), `${JSON.stringify(bad) ?? "undefined"} must not be admitted`).toBe(false);
    }
  });

  it("every resolved value is a member of the closed alias set", () => {
    for (const alias of resolvedOrFail(kitStems()).values()) {
      expect(isModelAlias(alias)).toBe(true);
    }
  });
});
