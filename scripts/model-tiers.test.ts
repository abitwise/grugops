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
  MODEL_TIERS_COUNT,
  PRESET_NAMES,
  TIERED,
  isModelAlias,
  isPresetName,
  resolveModels,
  roleCorpusCardinalityRefusal,
  tieredCorpusRefusals,
  tieredTableRefusals,
  type ModelAlias,
  type RoleTier,
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

// ── Plan 29.1-02 additions ───────────────────────────────────────────────────────────────────────
//
// FIXTURE TABLES ARE BUILT BY TRANSFORMING THE SHIPPED ONE, never by typing rows out. A fixture that
// enumerated seventeen stems inside the oracle for a derivation authority would be exactly the
// set-literal-drift class this milestone exists to delete, and it would go stale in the direction
// nobody notices: green while the shipped table moved underneath it.

/** The stems TIERED assigns a given alias, sorted — DERIVED from the table rather than listed. */
const stemsWithAlias = (alias: ModelAlias): string[] =>
  TIERED.filter((r) => r.alias === alias)
    .map((r) => r.stem)
    .sort();

/** The shipped table minus one row — the "a role has no assignment" mutation, as a fixture. */
const tableWithout = (stem: string): RoleTier[] => TIERED.filter((r) => r.stem !== stem);

/** The shipped table with one stem MISSPELLED — breaks set equality in BOTH directions at once. */
const tableRenaming = (from: string, to: string): RoleTier[] =>
  TIERED.map((r) => (r.stem === from ? { ...r, stem: to } : r));

/** The shipped table with one rationale blanked to whitespace — a third, distinct fact. */
const tableBlanking = (stem: string): RoleTier[] =>
  TIERED.map((r) => (r.stem === stem ? { ...r, rationale: "   " } : r));

/**
 * The shipped table with one stem REPEATED and its length UNCHANGED. Built by overwriting the last
 * row's stem with the first row's, so the length floor cannot be what refuses this input — the
 * duplicate check has to be what fires.
 */
const tableWithDuplicate = (): RoleTier[] => [
  ...TIERED.slice(0, TIERED.length - 1),
  { ...TIERED[TIERED.length - 1], stem: TIERED[0].stem },
];

/** The shipped table plus one row for a stem no role file carries — the OVER-long direction. */
const tableWithExtra = (): RoleTier[] => [
  ...TIERED,
  { stem: "not-a-role-file", alias: "sonnet", rationale: "a deliberately adversarial fixture row" },
];

/** The findings that match a pattern, so a case can assert HOW MANY distinct facts were reported. */
const matching = (findings: readonly string[], re: RegExp): string[] =>
  findings.filter((f) => re.test(f));

describe("model-tiers: the TIERED preset table (plan 29.1-02, MODEL-03)", () => {
  it("covers the DERIVED role corpus in BOTH directions with nothing left over", () => {
    const stems = kitStems();
    expect(stems.length, "the corpus must really have been derived first").toBe(ROLE_COUNT);
    expect(
      tieredCorpusRefusals(stems),
      "the shipped table must equal the derived role set in both directions — a stem with no role file and a role file with no row are two different defects and both are refusals",
    ).toEqual([]);
  });

  it("pins its cardinality TWO-SIDED against the derived corpus and against MODEL_TIERS_COUNT", () => {
    const stems = kitStems();
    expect(TIERED.length).toBe(stems.length);
    expect(MODEL_TIERS_COUNT).toBe(ROLE_COUNT);
    expect(TIERED.length).toBe(MODEL_TIERS_COUNT);
    // Distinctness beside the count: seventeen rows over sixteen stems would otherwise pass a count.
    expect(new Set(TIERED.map((r) => r.stem)).size).toBe(TIERED.length);
  });

  it("REFUSES a table SHORT by one with TWO separate findings — the uncovered stem AND the count", () => {
    const stems = kitStems();
    const victim = stems[0];
    const findings = tieredCorpusRefusals(stems, tableWithout(victim));

    const uncovered = matching(findings, /CORPUS . TABLE/);
    expect(uncovered.length, "exactly one role stem is uncovered, so exactly one such finding").toBe(1);
    expect(uncovered[0]).toContain(victim);

    const count = matching(findings, /row\(s\)/);
    expect(count.length, "the count is its own separate fact, not a clause of the coverage one").toBe(1);
    expect(count[0]).toContain(String(stems.length - 1));
    expect(count[0]).toContain(String(stems.length));
  });

  it("REFUSES a MISSPELLED stem naming BOTH directions — an unknown row AND an unassigned role", () => {
    const stems = kitStems();
    const victim = stems.find((s) => s === "security-nfr") ?? stems[0];
    const findings = tieredCorpusRefusals(stems, tableRenaming(victim, `${victim}s`));

    const tableToCorpus = matching(findings, /TABLE . CORPUS/);
    expect(tableToCorpus.length).toBe(1);
    expect(tableToCorpus[0]).toContain(`${victim}s`);

    const corpusToTable = matching(findings, /CORPUS . TABLE/);
    expect(corpusToTable.length).toBe(1);
    expect(corpusToTable[0]).toContain(victim);

    // The count is UNCHANGED by a misspelling, so a count-only check would have passed this input.
    expect(matching(findings, /row\(s\)/)).toEqual([]);
  });

  it("REFUSES an OVER-LONG table at eighteen against seventeen — the pin is two-sided, not a floor", () => {
    const stems = kitStems();
    const findings = tieredCorpusRefusals(stems, tableWithExtra());
    const count = matching(findings, /row\(s\)/);
    expect(count.length).toBe(1);
    expect(count[0]).toContain(String(stems.length + 1));
    expect(count[0]).toContain(String(stems.length));
  });

  it("REFUSES an EMPTY table with the VACUITY sentence and NOT the length sentence", () => {
    const findings = tieredCorpusRefusals(kitStems(), []);
    expect(findings.length, "a vacuous table is ONE fact, stated once").toBe(1);
    expect(findings[0]).toMatch(/vacuous/);
    expect(findings[0]).toMatch(/EMPTY/);
    expect(
      matching(findings, /row\(s\)/),
      "an empty table is not a short table — reporting it as a count would bury the fact that there is nothing to compare",
    ).toEqual([]);
  });

  it("REFUSES a DUPLICATED stem naming the stem and its occurrence count, at UNCHANGED length", () => {
    const table = tableWithDuplicate();
    expect(table.length, "the duplicate fixture must clear the length floor to reach the duplicate check").toBe(
      TIERED.length,
    );
    const findings = tieredTableRefusals(table);
    const dup = matching(findings, /appears/);
    expect(dup.length).toBe(1);
    expect(dup[0]).toContain(TIERED[0].stem);
    expect(dup[0]).toContain("2");
  });

  it("REFUSES a BLANK rationale naming its stem — a third fact, textually distinct from the other two", () => {
    const victim = TIERED[0].stem;
    const findings = tieredTableRefusals(tableBlanking(victim));
    const blank = matching(findings, /rationale/i);
    expect(blank.length).toBe(1);
    expect(blank[0]).toContain(victim);
    // Distinct from the coverage and count sentences, so three mutations give three readable answers.
    expect(blank[0]).not.toMatch(/CORPUS . TABLE/);
    expect(blank[0]).not.toMatch(/row\(s\)/);
  });

  it("the SHIPPED table itself carries no table-level defect", () => {
    expect(tieredTableRefusals()).toEqual([]);
    expect(tieredCorpusRefusals(kitStems())).toEqual([]);
  });

  it("every rationale is NON-EMPTY after trim, checked over every row rather than sampled", () => {
    const blank = TIERED.filter((r) => r.rationale.trim().length === 0).map((r) => r.stem);
    expect(blank, "D-10 makes the reason a required field; a blank one is a row with no argument").toEqual([]);
    expect(TIERED.length, "the check must have had rows to run over").toBe(ROLE_COUNT);
  });

  it("no rationale contains a DECIMAL DIGIT — a price or a percentage cannot arrive without a red", () => {
    // MODEL-07 / D-14: the rationale field argues QUALITY and never spend. A digit is the cheapest
    // mechanical proxy for the thing being refused — a number is what a cost or savings claim needs.
    const withDigits = TIERED.filter((r) => /[0-9]/.test(r.rationale)).map((r) => r.stem);
    expect(withDigits).toEqual([]);
  });

  it("assigns `opus` to EXACTLY the four D-09 stems, `sonnet` to the rest, and `haiku` to NOBODY", () => {
    // The four names are legitimately literal HERE and nowhere else: this assertion is ABOUT them.
    expect(stemsWithAlias("opus")).toEqual(
      ["architect-design", "compliance-officer", "orchestrator", "security-nfr"].sort(),
    );
    expect(stemsWithAlias("haiku"), "no role is assigned the thinnest tier under this preset").toEqual([]);
    expect(stemsWithAlias("sonnet").length).toBe(ROLE_COUNT - 4);
    // The three buckets partition the table — no row claimed twice, no row claimed by none.
    expect(
      stemsWithAlias("opus").length + stemsWithAlias("sonnet").length + stemsWithAlias("haiku").length,
    ).toBe(TIERED.length);
    expect(stemsWithAlias("inherit"), "the preset takes a position; it does not defer").toEqual([]);
  });
});

describe("model-tiers: the closed preset-name set (plan 29.1-02, D-07)", () => {
  it("holds EXACTLY two DISTINCT members, `none` and `tiered` — two-sided, so three fails", () => {
    expect(PRESET_NAMES.length).toBe(2);
    expect(new Set(PRESET_NAMES).size).toBe(2);
    expect([...PRESET_NAMES].sort()).toEqual(["none", "tiered"]);
  });

  it("decides membership by EXACT STRING EQUALITY — a case fold, a near miss and a non-string fail", () => {
    for (const name of PRESET_NAMES) expect(isPresetName(name)).toBe(true);
    for (const bad of ["None", "TIERED", "tiered ", "tier", "cost", "", "default"]) {
      expect(isPresetName(bad), `"${bad}" must not be admitted as a preset name`).toBe(false);
    }
    for (const bad of [null, undefined, 0, 1, true, {}, ["tiered"]]) {
      expect(isPresetName(bad)).toBe(false);
    }
  });

  it("is named `tiered` and NOT `cost` — a preset called `cost` is itself an unmeasured cost claim", () => {
    expect(PRESET_NAMES).not.toContain("cost");
  });
});

describe("model-tiers: resolving UNDER a preset (plan 29.1-02)", () => {
  it("`none` is byte-identical to the zero-config answer, ORDER included", () => {
    const stems = kitStems();
    const withNone = resolveModels(stems, { preset: "none" });
    expect(withNone.ok).toBe(true);
    if (!withNone.ok) return;
    expect(stringifyMap(withNone.value)).toBe(stringifyMap(resolvedOrFail(stems)));
  });

  it("`tiered` gives every stem EXACTLY the alias TIERED assigns it", () => {
    const stems = kitStems();
    const r = resolveModels(stems, { preset: "tiered" });
    expect(r.ok, "the shipped table must resolve over the live corpus").toBe(true);
    if (!r.ok) return;

    const wrong: string[] = [];
    for (const row of TIERED) {
      const got = r.value.get(row.stem);
      if (got !== row.alias) wrong.push(`${row.stem} — table says "${row.alias}", resolver said "${String(got)}"`);
    }
    expect(wrong, "the resolver must read the table rather than reproduce a default").toEqual([]);
    expect(r.value.size).toBe(stems.length);
  });

  it("`tiered` MOVES the answer away from the zero-config one — the preset is not a no-op", () => {
    const stems = kitStems();
    const tiered = resolveModels(stems, { preset: "tiered" });
    expect(tiered.ok).toBe(true);
    if (!tiered.ok) return;
    expect(stringifyMap(tiered.value)).not.toBe(stringifyMap(resolvedOrFail(stems)));
  });

  it("`tiered` REFUSES a stem with NO row, naming the stem — MODEL-03's binding check", () => {
    // This is the strictly STRONGER form of "role #18 cannot arrive unassigned": it names the
    // unassigned stem instead of reporting a number that disagrees, and it is correct on a mirror.
    const r = resolveModels([...kitStems(), "role-eighteen"], { preset: "tiered" });
    expect(r.ok, "an unassigned stem must be refused rather than silently skipped").toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain("role-eighteen");
  });

  it("`tiered` RESOLVES a MIRROR-SIZED subset — the corpus relationship is the consumer's question", () => {
    // The upstream constraint recorded as plan 29.1-01's deviation 1: this resolver sits on the
    // adapter generator's hot path, and that generator runs over hermetic mirrors holding a SUBSET
    // of the role corpus. A corpus-cardinality equality on this path refuses valid runs.
    const mirror = kitStems().slice(0, 6);
    const r = resolveModels(mirror, { preset: "tiered" });
    expect(r.ok, "a mirror-sized subset must resolve under the preset as well as under zero-config").toBe(
      true,
    );
    if (!r.ok) return;
    expect(r.value.size).toBe(mirror.length);
    for (const stem of mirror) {
      const row = TIERED.find((t) => t.stem === stem);
      expect(r.value.get(stem)).toBe(row?.alias);
    }
  });

  it("REFUSES a preset name outside the closed set, naming the value and the legal set", () => {
    const r = resolveModels(kitStems(), { preset: "cost" as never });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain("cost");
    for (const name of PRESET_NAMES) expect(r.reason).toContain(name);
  });

  it("resolves DETERMINISTICALLY under `tiered` — a shuffled input gives the identical map", () => {
    const stems = kitStems();
    const a = resolveModels(stems, { preset: "tiered" });
    const b = resolveModels([...stems].reverse(), { preset: "tiered" });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(stringifyMap(a.value)).toBe(stringifyMap(b.value));
  });

  it("every value resolved under `tiered` is a member of the closed alias set", () => {
    const r = resolveModels(kitStems(), { preset: "tiered" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const alias of r.value.values()) expect(isModelAlias(alias)).toBe(true);
  });
});
