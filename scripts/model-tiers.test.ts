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

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { listRoles, ROLE_COUNT } from "./kit-model.js";
import {
  MODEL_ALIASES,
  MODEL_TIERS_COUNT,
  MODELS_CONFIG_CANDIDATE_RELS,
  MODELS_KEYS,
  PRESET_NAMES,
  RESOLVED_PRESET_PREFIX,
  TIERED,
  inheritForEveryStem,
  isModelAlias,
  isPresetName,
  MIRRORED_RESOLVED_PRESET_PREFIX,
  RESOLVED_ASSIGNMENT_PREFIX,
  mirroredResolvedPresetLine,
  mirroredResolvedPresetsIn,
  readModelsConfig,
  resolveModels,
  resolvedAssignmentLine,
  resolvedAssignmentsIn,
  resolvedPresetLine,
  resolvedPresetsIn,
  tieredCorpusRefusals,
  tieredTableRefusals,
  type ModelAlias,
  type ModelsKey,
  type ResolveModelsOptions,
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

  // (PLAN 29.1-15, R2-IN-02) THE TWO COUNT-ONLY CARDINALITY CASES THAT SAT HERE ARE GONE WITH THE
  // PREDICATE THEY DROVE. It was ~30 lines of exported production code whose only consumer was these
  // two cases, for a second consecutive review round, and it was deleted rather than given a caller.
  // The cases went with it deliberately rather than being retargeted at the sister: the sister has
  // its own oracle below, and keeping these would have been a second set of cases for one predicate
  // — the same duplication at the oracle level that the deletion removes at the source level. The
  // ROLE_COUNT relationship over the LIVE tree is adjudicated by `guard_model_assignment`, whose own
  // cases live in scripts/check-foundation-guards.test.ts.

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

// ── Plan 29.1-02 Task 3: the two-location config read ────────────────────────────────────────────
//
// Every fixture config is written into a FRESH mkdtemp directory and nothing outside it is touched.
// The role stems these fixtures are validated against are still derived from the kit authority at
// run time; the only literals here are the deliberately ILLEGAL values, which is the one place a
// literal is the point of the case.

const scratchRoots: string[] = [];

afterAll(() => {
  for (const dir of scratchRoots) rmSync(dir, { recursive: true, force: true });
});

const REPO_DROPPED = [".grugops", "factory.config.json"] as const;
const IN_KIT = ["agent-factory", "config", "factory.config.json"] as const;

/** A fresh scratch repo root, registered for cleanup. */
const scratchRoot = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "grugops-model-config-"));
  scratchRoots.push(dir);
  return dir;
};

/** Write a config file at one of the two candidate locations inside a scratch root. */
const writeConfigAt = (root: string, rel: readonly string[], body: string): void => {
  const parts = [...rel];
  const file = parts.pop() as string;
  const dir = parts.length > 0 ? join(root, ...parts) : root;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, file), body, "utf8");
};

/** A scratch root carrying one repo-dropped config with the given raw body. */
const rootWithRawConfig = (body: string): string => {
  const root = scratchRoot();
  writeConfigAt(root, REPO_DROPPED, body);
  return root;
};

/** A scratch root carrying one repo-dropped config holding the given JSON value. */
const rootWithConfig = (value: unknown): string => rootWithRawConfig(JSON.stringify(value, null, 2));

/** The reader's refusal reason, or a failure that names the unexpected success. */
const refusalOrFail = (root: string, stems: readonly string[]): string => {
  const r = readModelsConfig(root, stems);
  if (r.ok) throw new Error(`expected a refusal, got a resolution: preset "${r.value.preset}"`);
  return r.reason;
};

describe("model-tiers: readModelsConfig — the zero-config arms (plan 29.1-02, D-05)", () => {
  it("resolves an ABSENT config at BOTH locations to `none` with no overrides", () => {
    const stems = kitStems();
    const r = readModelsConfig(scratchRoot(), stems);
    expect(r.ok, "zero-config must never be an error — an absent block means `inherit` everywhere").toBe(
      true,
    );
    if (!r.ok) return;
    expect(r.value.preset).toBe("none");
    expect(r.value.overrides.size).toBe(0);
    // …and the resolution it implies is byte-identical to the zero-config answer.
    const resolved = resolveModels(stems, { preset: r.value.preset, overrides: r.value.overrides });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(stringifyMap(resolved.value)).toBe(stringifyMap(resolvedOrFail(stems)));
  });

  it("a config present with NO `models` key is INDISTINGUISHABLE from an absent one", () => {
    const stems = kitStems();
    const present = readModelsConfig(rootWithConfig({ quality: { tdd: true } }), stems);
    const absent = readModelsConfig(scratchRoot(), stems);
    expect(present.ok).toBe(true);
    expect(absent.ok).toBe(true);
    if (!present.ok || !absent.ok) return;
    expect(present.value.preset).toBe(absent.value.preset);
    expect(present.value.overrides.size).toBe(absent.value.overrides.size);
  });

  it("a `models` set to an EMPTY OBJECT is the zero-config answer, not a degenerate shape", () => {
    const stems = kitStems();
    const r = readModelsConfig(rootWithConfig({ models: {} }), stems);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.preset).toBe("none");
    expect(r.value.overrides.size).toBe(0);
  });
});

describe("model-tiers: readModelsConfig — the degenerate shapes (plan 29.1-02, Pitfall 2)", () => {
  for (const [label, models] of [
    ["null", null],
    ["an array", []],
    ["a string", "tiered"],
    ["a number", 3],
  ] as const) {
    it(`REFUSES a \`models\` that is ${label} — a PRESENT-but-degenerate shape, never folded into absent`, () => {
      const stems = kitStems();
      const root = rootWithConfig({ models });
      const reason = refusalOrFail(root, stems);
      // The file is named, so the reader knows WHICH of the two candidate locations was read.
      expect(reason).toContain("factory.config.json");
      // The shape found is named, so the remedy is obvious rather than guessed at.
      expect(reason).toMatch(/models/);

      // …and the refusal is TEXTUALLY DISTINCT from the absent path, which is not a refusal at all.
      const absent = readModelsConfig(scratchRoot(), stems);
      expect(
        absent.ok,
        "if the degenerate shape were folded into the absent case this assertion would be the one that failed",
      ).toBe(true);
    });
  }

  it("REFUSES a whole config that PARSES but is not a JSON object — a branch of its own", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithConfig(["not", "an", "object"]), stems);
    expect(reason).toContain("factory.config.json");
    // Distinct from the degenerate-`models` sentence: this one is about the FILE, not the sub-object.
    const degenerate = refusalOrFail(rootWithConfig({ models: null }), stems);
    expect(reason).not.toBe(degenerate);
  });

  it("REFUSES an UNPARSEABLE config naming the file AND the parse error", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithRawConfig("{ this is not json"), stems);
    expect(reason).toContain("factory.config.json");
    expect(
      reason.length,
      "the parse error itself must reach the reader — a bare 'could not read' hides which byte was wrong",
    ).toBeGreaterThan("factory.config.json".length);
    expect(reason).toMatch(/JSON|parse/i);
  });

  it("REFUSES a `roles` that is present but not an object", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithConfig({ models: { roles: ["orchestrator"] } }), stems);
    expect(reason).toMatch(/roles/);
  });
});

describe("model-tiers: readModelsConfig — every illegal input by name (plan 29.1-02, D-06/D-07/D-11)", () => {
  it("REFUSES a preset outside the closed set naming the offending value and the legal set", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithConfig({ models: { preset: "cost" } }), stems);
    expect(reason).toContain("cost");
    for (const name of PRESET_NAMES) expect(reason).toContain(name);
  });

  it("REFUSES a NON-STRING preset — membership is exact equality, so a boolean is not coerced", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithConfig({ models: { preset: true } }), stems);
    for (const name of PRESET_NAMES) expect(reason).toContain(name);
  });

  it("REFUSES an unknown `roles` KEY naming the key and the valid set — the ASVS V12 control (D-06)", () => {
    const stems = kitStems();
    const reason = refusalOrFail(
      rootWithConfig({ models: { roles: { "orchestrater": "opus" } } }),
      stems,
    );
    expect(reason).toContain("orchestrater");
    // The valid set is DERIVED and stated, so the user can see the name they meant.
    expect(reason).toContain("orchestrator");
    // A config-derived string is compared against a derived set and never joined onto a path.
    expect(reason).not.toMatch(/ENOENT|no such file/);
  });

  it("REFUSES a `roles` key that is a PATH rather than a stem — it never reaches the filesystem", () => {
    const stems = kitStems();
    const reason = refusalOrFail(
      rootWithConfig({ models: { roles: { "../../etc/passwd": "opus" } } }),
      stems,
    );
    expect(reason).toContain("../../etc/passwd");
    expect(reason).not.toMatch(/ENOENT|no such file/);
  });

  // FIVE separate illegal-alias cases, each asserting its OWN reason text. Written as a loop over a
  // literal table because the ILLEGAL VALUES are exactly what these cases are about — this is the one
  // place in this file where a literal is the subject rather than a stale copy of something derived.
  for (const [label, bad] of [
    ["a full model id", "claude-3-5-sonnet-20241022"],
    ["a case fold", "Opus"],
    ["a number", 3],
    ["the empty string", ""],
    ["null", null],
  ] as const) {
    it(`REFUSES ${label} as a \`roles\` VALUE, naming the role, the value and the legal set`, () => {
      const stems = kitStems();
      const victim = stems[0];
      const reason = refusalOrFail(
        rootWithConfig({ models: { roles: { [victim]: bad } } }),
        stems,
      );
      expect(reason, "the refusal must name WHICH role carried the illegal value").toContain(victim);
      expect(
        reason,
        "the refusal must QUOTE the offending value back, so the user sees what they typed",
      ).toContain(JSON.stringify(bad));
      for (const alias of MODEL_ALIASES) {
        expect(reason, `the legal set must be stated in full — "${alias}" is missing`).toContain(alias);
      }
    });
  }

  it("the full-model-id refusal is MODEL-04's enforcement point, not the admission reader's", () => {
    // canonical-frontmatter.ts's admit() would accept `claude-3-5-sonnet-20241022` as a legal plain
    // scalar — it is exactly the alphabet a plain scalar is allowed to use. MODEL-04 is closed HERE,
    // by exact equality against four constants, and nowhere downstream.
    const stems = kitStems();
    const reason = refusalOrFail(
      rootWithConfig({ models: { roles: { [stems[0]]: "claude-3-5-sonnet-20241022" } } }),
      stems,
    );
    expect(reason).toContain("claude-3-5-sonnet-20241022");
    expect(MODEL_ALIASES).not.toContain("claude-3-5-sonnet-20241022");
  });
});

describe("model-tiers: candidate precedence and the override contract (plan 29.1-02)", () => {
  it("`.grugops/factory.config.json` WINS over the in-kit config when BOTH exist", () => {
    const stems = kitStems();
    const root = scratchRoot();
    writeConfigAt(root, REPO_DROPPED, JSON.stringify({ models: { preset: "tiered" } }));
    writeConfigAt(root, IN_KIT, JSON.stringify({ models: { preset: "none" } }));
    const r = readModelsConfig(root, stems);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.preset, "the repo-dropped location is the more specific one and resolves first").toBe(
      "tiered",
    );
  });

  it("reads the IN-KIT config when the repo-dropped one is absent — both candidates are live", () => {
    const stems = kitStems();
    const root = scratchRoot();
    writeConfigAt(root, IN_KIT, JSON.stringify({ models: { preset: "tiered" } }));
    const r = readModelsConfig(root, stems);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.preset).toBe("tiered");
  });

  it("SHADOWING: a present-but-models-less first candidate wins WHOLE over a models-carrying second", () => {
    // FINDING WR-05, PINNED. The reader returns on the FIRST candidate that EXISTS, whether or not
    // that file carries a `models` key. So a `.grugops/factory.config.json` holding only unrelated
    // dials SHADOWS a `models` block in the in-kit config: the answer is the zero-config one and
    // the source names the shadowing file. Under D-04 the shipped seed IS such a file, which makes
    // this the standard installed shape rather than a contrived one.
    //
    // WHY THIS IS A NEW SHAPE AND NOT A RESTATEMENT. The two precedence cases above plant a
    // `models` block in BOTH files; neither of them can distinguish "the first file wins" from
    // "the first file WITH A BLOCK wins". This one does, and it is the shape the shipped
    // documentation did not state until this plan.
    //
    // THE PATHS AND THE EXPECTED SOURCE ARE THIS FILE'S OWN LITERALS, deliberately not derived
    // from MODELS_CONFIG_CANDIDATE_RELS. A fixture that planted its files THROUGH the constant and
    // then asserted the source AGAINST the constant would move both sides together under a
    // reversal and could never go red — which is the two-sided-pin failure class this round exists
    // to close. Reversing the constant's declared order was observed to turn this case RED.
    const stems = kitStems();
    const root = scratchRoot();
    writeConfigAt(root, REPO_DROPPED, JSON.stringify({ quality: { tdd: true } }));
    writeConfigAt(root, IN_KIT, JSON.stringify({ models: { preset: "tiered" } }));

    // THE FIXTURE'S OWN PREMISE, read back off disk before anything is asserted about the
    // resolution: a typo in either literal above would otherwise make this case pass for the
    // wrong reason — there is more than one way to reach `preset: "none"`.
    const firstAbs = join(root, ...REPO_DROPPED);
    const secondAbs = join(root, ...IN_KIT);
    expect(existsSync(firstAbs), "PREMISE: the shadowing file must exist").toBe(true);
    const firstJson = JSON.parse(readFileSync(firstAbs, "utf8")) as Record<string, unknown>;
    const secondJson = JSON.parse(readFileSync(secondAbs, "utf8")) as Record<string, unknown>;
    expect(
      Object.prototype.hasOwnProperty.call(firstJson, "models"),
      "PREMISE: the FIRST candidate must carry NO `models` key — that is the whole shape",
    ).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(secondJson, "models"),
      "PREMISE: the SECOND candidate must carry a `models` key for it to have something to shadow",
    ).toBe(true);

    const r = readModelsConfig(root, stems);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.preset, "the second file's `tiered` is shadowed — this is the zero-config answer").toBe(
      "none",
    );
    expect(r.value.overrides.size).toBe(0);
    expect(r.value.source, "and the SOURCE names the shadowing file, not the one that was skipped").toBe(
      firstAbs,
    );
    expect(r.value.source).not.toBe(secondAbs);
  });

  it("the candidate list is built from the exported location constant, in declared order", () => {
    const stems = kitStems();

    // Direction one: the constant says what this file's independently written fixture tuples say.
    // Two hand-written spellings pinned against each other is only worth something because they
    // were written by different plans for different purposes; the load-bearing independence check
    // is in scripts/model-dial-consistency.test.ts, which asserts every member of this constant
    // appears in both SHIPPED documents.
    expect(MODELS_CONFIG_CANDIDATE_RELS).toHaveLength(2);
    expect(MODELS_CONFIG_CANDIDATE_RELS[0]).toBe(REPO_DROPPED.join("/"));
    expect(MODELS_CONFIG_CANDIDATE_RELS[1]).toBe(IN_KIT.join("/"));

    // Direction two: EVERY declared member is a LIVE candidate. A member that the reader never
    // opens would make the constant a decorative list — the exact defect of a documented location
    // the code does not read. Each is planted ALONE in a fresh root, so nothing else can answer.
    for (const rel of MODELS_CONFIG_CANDIDATE_RELS) {
      const root = scratchRoot();
      const segments = rel.split("/");
      writeConfigAt(root, segments, JSON.stringify({ models: { preset: "tiered" } }));
      const r = readModelsConfig(root, stems);
      expect(r.ok, `the declared location ${rel} must be read`).toBe(true);
      if (!r.ok) return;
      expect(r.value.preset, `${rel} is a live candidate, not a documented-only location`).toBe("tiered");
      expect(r.value.source, `and the reader names ${rel} as the file it read`).toBe(
        join(root, ...segments),
      );
    }
  });

  it("an OVERRIDE WINS over a preset assignment on the same stem — a stated contract, not an order", () => {
    const stems = kitStems();
    // Derived, not typed: pick a stem the preset assigns `sonnet` and override it to `opus`.
    const victim = TIERED.find((r) => r.alias === "sonnet")?.stem;
    expect(victim, "the fixture premise — the preset must assign `sonnet` to someone").toBeDefined();
    if (victim === undefined) return;

    const root = rootWithConfig({ models: { preset: "tiered", roles: { [victim]: "opus" } } });
    const cfg = readModelsConfig(root, stems);
    expect(cfg.ok).toBe(true);
    if (!cfg.ok) return;

    const r = resolveModels(stems, { preset: cfg.value.preset, overrides: cfg.value.overrides });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.get(victim), "the override is the deliberate winner").toBe("opus");
    // Every OTHER stem still carries the preset's answer, so the override is SPARSE, not a full map.
    for (const row of TIERED) {
      if (row.stem === victim) continue;
      expect(r.value.get(row.stem)).toBe(row.alias);
    }
  });

  it("an override applies on top of `none` as well — the sparse map is not preset-specific", () => {
    const stems = kitStems();
    const victim = stems[0];
    const cfg = readModelsConfig(rootWithConfig({ models: { roles: { [victim]: "haiku" } } }), stems);
    expect(cfg.ok).toBe(true);
    if (!cfg.ok) return;
    const r = resolveModels(stems, { preset: cfg.value.preset, overrides: cfg.value.overrides });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.get(victim)).toBe("haiku");
    for (const stem of stems.filter((s) => s !== victim)) expect(r.value.get(stem)).toBe("inherit");
  });
});

describe("model-tiers: the consumer split — the reader takes no policy (plan 29.1-02, D-11)", () => {
  it("inheritForEveryStem gives EVERY stem `inherit` and NEVER a pinned tier", () => {
    const stems = kitStems();
    const degraded = inheritForEveryStem(stems);
    expect(degraded.size).toBe(stems.length);
    expect([...new Set(degraded.values())]).toEqual(["inherit"]);
    // The direction that matters: degrading must never land on a tier the user's account may lack.
    for (const alias of degraded.values()) {
      expect(["opus", "sonnet", "haiku"]).not.toContain(alias);
    }
  });

  it("a refusal is a VERDICT the caller acts on — the reader itself substitutes nothing", () => {
    const stems = kitStems();
    const r = readModelsConfig(rootWithConfig({ models: { preset: "cost" } }), stems);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    // The refusal carries a reason and NOT a map — a reader that returned a degraded map here would
    // have taken the doctor's policy on the generator's behalf.
    expect(Object.prototype.hasOwnProperty.call(r, "value")).toBe(false);
    expect(typeof r.reason).toBe("string");
    // The degrading consumer builds its own answer from the SAME shared helper.
    expect([...new Set(inheritForEveryStem(stems).values())]).toEqual(["inherit"]);
  });

  it("REFUSES an EMPTY derived stem set rather than validating role keys against nobody", () => {
    // Validating a `roles` key against an empty valid set would refuse every key for the wrong
    // reason, and validating it against nothing would accept every key. Both are the vacuous pass.
    const reason = refusalOrFail(rootWithConfig({ models: { preset: "tiered" } }), []);
    expect(reason).toMatch(/EMPTY|vacuous/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE RESOLVED-PRESET LINE (plan 29.1-03, RESEARCH.md Pitfall 3 option (c))
//
// scripts/adapters-freshness.ts satisfies D-04 today by pure ABSENCE: its mirror copies
// agent-factory/roles and agent-factory/packaging and nothing else, so a config-reading generator
// running inside it resolves nothing. Absence is not a pin — the day someone adds a configuration
// directory to that twin list the gate silently becomes config-dependent while staying green.
//
// The remedy is that the generator PRINTS the preset its run resolved and the gate ASSERTS that
// line. That makes the emitter and the reader two consumers of ONE grammar, which is why both live
// here rather than one literal in the generator and a second, hand-copied one inside the gate. A
// hand-copied marker is this repository's named second systemic failure class: the two copies rot
// apart while the gate stays green, which is exactly the outcome the pin exists to prevent.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("model-tiers: the resolved-preset line grammar (plan 29.1-03)", () => {
  it("emits one line per legal preset name, and the reader reads back EXACTLY that name", () => {
    // Derived from PRESET_NAMES rather than written out, so a third preset cannot ship with a line
    // grammar nobody exercised.
    expect(PRESET_NAMES.length, "the preset vocabulary must be non-empty or this case is vacuous")
      .toBeGreaterThan(0);
    for (const preset of PRESET_NAMES) {
      const line = resolvedPresetLine(preset);
      expect(line, `the line for "${preset}" must carry the shared prefix`).toContain(
        RESOLVED_PRESET_PREFIX,
      );
      // The round trip is the whole contract: whatever the emitter writes, the reader reads back.
      expect(resolvedPresetsIn(line)).toEqual([preset]);
    }
  });

  it("the reader finds the line INSIDE a multi-line stream and ignores every other line", () => {
    const stream = [
      "generate-role-adapters: some earlier line",
      resolvedPresetLine("none"),
      "generate-role-adapters: wrote 17 adapters to /somewhere",
      "",
    ].join("\n");
    expect(resolvedPresetsIn(stream)).toEqual(["none"]);
  });

  it("an ABSENT line reads back as an EMPTY list — never as a default, and never as agreement", () => {
    // The load-bearing direction. A reader that answered "none" for a stream carrying no line at
    // all would let a gate treat silence as consent, which is the shape this repository has paid
    // for repeatedly. The empty list forces the caller to have an explicit absent branch.
    expect(resolvedPresetsIn("")).toEqual([]);
    expect(resolvedPresetsIn("generate-role-adapters: wrote 17 adapters\n")).toEqual([]);
  });

  it("reports EVERY matching line rather than the first — an ambiguous stream stays ambiguous", () => {
    // A caller cannot fail closed on "two runs disagreed" if the reader silently discards one of
    // them. Returning the list keeps the ambiguity visible at the call site.
    const stream = [
      `${resolvedPresetLine("none")}`,
      `${resolvedPresetLine("tiered")}`,
      "",
    ].join("\n");
    expect(resolvedPresetsIn(stream)).toEqual(["none", "tiered"]);
  });

  it("survives CRLF — a Windows child's stdout must not read back with a trailing carriage return", () => {
    // grugops ships to Windows, and the gate reads a spawned child's stdout. `"none\r"` is not
    // `"none"`, and the difference would be an equality failure with an invisible cause.
    const stream = `${resolvedPresetLine("none")}\r\ngenerate-role-adapters: wrote 17\r\n`;
    expect(resolvedPresetsIn(stream)).toEqual(["none"]);
  });

  it("the prefix is not a legal preset name — the marker can never be mistaken for its value", () => {
    expect(isPresetName(RESOLVED_PRESET_PREFIX)).toBe(false);
    expect(RESOLVED_PRESET_PREFIX.length).toBeGreaterThan(0);
  });

  // ── The ANCHOR (finding WR-03). ───────────────────────────────────────────────────────────────
  // The reader used to ask `indexOf`, so ANY line mentioning the phrase was read as an announcement.
  // The three shapes below are the ones reproduced in 29.1-REVIEW.md § WR-03 against the pre-fix
  // committed .js; each returned a value there and each must return the empty list here. The fourth
  // is the leading-whitespace shape the review does not name, which the anchor must also refuse: a
  // line an indenting log wrapper touched is not a line the emitter wrote.

  it("resolvedPresetsIn refuses an incidental mention in a warning line", () => {
    // Pre-fix: `["none"]`. A diagnostic that MENTIONS the phrase would have satisfied the gate's
    // "the line is present" branch, so the gate would read a warning about a failed read as consent.
    //
    // TWO SHAPES, and the SECOND is the one that still discriminates. The review's verbatim string
    // is refused by the owning prefix alone, so it would stay green if the anchor were reverted; the
    // variant carrying the WHOLE owning prefix mid-line is refused only by the anchor. Asserting
    // just the first would let the anchor rot while this case reported it held.
    expect(resolvedPresetsIn("WARN could not read resolved model preset: none")).toEqual([]);
    expect(resolvedPresetsIn(`WARN could not read ${resolvedPresetLine("none")}`)).toEqual([]);
  });

  it("resolvedPresetsIn refuses an incidental mention inside a shell echo", () => {
    // Pre-fix: `["tiered\" >> log"]` — a captured value carrying shell syntax, which is visible
    // proof that the reader was not reading an announcement at all. The second shape carries the
    // whole owning prefix, so it is refused by the ANCHOR rather than by the prefix change.
    expect(resolvedPresetsIn('echo "resolved model preset: tiered" >> log')).toEqual([]);
    expect(resolvedPresetsIn(`echo "${resolvedPresetLine("tiered")}" >> log`)).toEqual([]);
  });

  it("resolvedPresetsIn refuses an incidental mention inside a comment", () => {
    // Pre-fix: `["none"]`. Again in two shapes: the review's verbatim one, and the one carrying the
    // whole owning prefix, which only the anchor can refuse.
    expect(resolvedPresetsIn("# TODO: fix resolved model preset: none")).toEqual([]);
    expect(resolvedPresetsIn(`# TODO: fix ${resolvedPresetLine("none")}`)).toEqual([]);
  });

  it("resolvedPresetsIn refuses a leading-whitespace line", () => {
    // THE PAIR IS THE DISCRIMINATION. The indented form must come back empty and the un-indented
    // form must come back with the value; asserting only the first would pass for a reader that
    // refused everything.
    expect(resolvedPresetsIn(`  ${resolvedPresetLine("none")}`)).toEqual([]);
    expect(resolvedPresetsIn(resolvedPresetLine("none"))).toEqual(["none"]);
  });

  it("resolvedPresetsIn accepts the emitter's own line and strips a trailing CR", () => {
    // The carriage return is trimmed off THE LINE before the prefix test — and therefore off the
    // tail of the captured value too, because the line is trimmed before the value is sliced out of
    // it (finding R3-IN-04). This comment RESTATED the source docstring's false half and was
    // corrected with it: one claim must not survive in two versions. The three cases immediately
    // below pin both halves of the corrected claim.
    expect(resolvedPresetsIn(`${resolvedPresetLine("none")}\r`)).toEqual(["none"]);
  });

  it("the anchored reader trims the value's TAIL — the docstring's first half, measured", () => {
    // A trailing run is removed from the captured value, because the LINE is trimmed before the
    // value is sliced out of it. The docstring said the opposite until plan 29.1-21; the mechanism
    // never did. Asserted here so the claim is decided rather than trusted.
    expect(resolvedPresetsIn(`${resolvedPresetLine("none")}   `)).toEqual(["none"]);
    expect(resolvedPresetsIn(`${resolvedPresetLine("none")}\t`)).toEqual(["none"]);
    // The SIBLING grammar is built on the same helper, so the claim holds for it too or the two
    // readers disagree about one mechanism. Both readers, one assertion of the same property.
    expect(mirroredResolvedPresetsIn(`${mirroredResolvedPresetLine("tiered")}  `)).toEqual([
      "tiered",
    ]);
  });

  it("the anchored reader preserves the value's HEAD and interior — the docstring's second half", () => {
    // Leading and internal spacing survives, so a malformed value stays visible AS malformed rather
    // than being normalised into a shape a consumer would then accept. This is the half of the
    // claim that was always true, and it is pinned beside the corrected half so a future edit
    // cannot repair one by breaking the other.
    expect(resolvedPresetsIn(`${RESOLVED_PRESET_PREFIX} none`)).toEqual([" none"]);
    expect(resolvedPresetsIn(`${RESOLVED_PRESET_PREFIX}no ne`)).toEqual(["no ne"]);
  });

  it("the tail trim does not weaken the ANCHOR — an indented line is refused, trailing run or not", () => {
    // THE ORDERING CLAIM, which is what makes the other two safe: the line is trimmed at its END
    // and the prefix is required at BYTE 0 of the result, so trimming can never move a line INTO
    // acceptance. The leading-whitespace case above pins the plain indented line; this one pins the
    // interaction, which is the shape a reader would reach for if the trim were widened to `trim()`.
    expect(resolvedPresetsIn(`  ${resolvedPresetLine("none")}   `)).toEqual([]);
    expect(resolvedPresetsIn(`\t${resolvedPresetLine("none")}\r`)).toEqual([]);
  });

  it("the emitter owns the WHOLE prefix — no caller may prepend the generator's name to it", () => {
    // The anchor only holds if the emitted line begins with the marker at byte 0. A caller that
    // prefixed the line with anything at all would produce a line its own reader refuses, which is
    // the loud failure direction this pair pins.
    expect(resolvedPresetLine("none").startsWith(RESOLVED_PRESET_PREFIX)).toBe(true);
    expect(resolvedPresetsIn(`generate-role-adapters: ${resolvedPresetLine("none")}`)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE RESOLVED-ASSIGNMENT AND MIRRORED-VERDICT GRAMMARS (plan 29.1-07, findings CR-01 and WR-04)
//
// CR-01: `resolveModels` has TWO inputs — a preset and a sparse override map — and the preset line
// announces only the first. A run carrying `{"models":{"roles":{...}}}` and NO `preset` key
// announced `none`, which is the zero-config answer, while emitting adapters that were not the
// zero-config output. Reproduced end to end: the freshness gate exited 0 with two committed
// adapters carrying `model: opus`. The remedy is a grammar that announces what the resolution
// PRODUCED — its member count, its override count and the distinct aliases it actually emitted.
//
// WR-04: the freshness gate hand-spelled its own verdict marker inside the file that argues the
// marker must never be hand-spelled, and it was load-bearing because that gate's oracle parses the
// gate's own stdout — so the "round trip" cases were reading a literal, not an announcement. The
// gate's verdict is therefore its OWN declared grammar here, with its own reader beside it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("model-tiers: the resolved-assignment line grammar (plan 29.1-07, CR-01)", () => {
  it("resolvedAssignmentLine and resolvedAssignmentsIn are inverse over the zero-config resolution", () => {
    // Built through the module's OWN zero-config helper over the LIVE role corpus rather than a
    // hand-written map, so the member count under test is the one the generator would announce.
    const stems = listRoles(ROOT).map((f) => f.slice(0, -".md".length));
    expect(stems.length, "the live role corpus must be non-empty or this case is vacuous")
      .toBeGreaterThan(0);
    const resolution = inheritForEveryStem(stems);
    expect(
      resolution.size,
      "PREMISE: the zero-config resolution must cover the whole derived corpus",
    ).toBe(ROLE_COUNT);

    const results = resolvedAssignmentsIn(resolvedAssignmentLine(resolution, 0));
    expect(results).toHaveLength(1);
    expect(results[0].ok, results[0].ok ? "" : results[0].reason).toBe(true);
    if (!results[0].ok) return;
    expect(results[0].value.roles).toBe(ROLE_COUNT);
    expect(results[0].value.overrides).toBe(0);
    expect(results[0].value.aliases).toEqual(["inherit"]);
  });

  it("the announced alias set is DISTINCT and SORTED, and the override count travels unmodified", () => {
    // The line must describe a MIXED resolution too, or the zero-config case above would be
    // satisfied by an emitter that hard-coded the zero-config answer.
    const mixed = new Map<string, ModelAlias>([
      ["c-role", "inherit"],
      ["a-role", "opus"],
      ["b-role", "opus"],
    ]);
    const results = resolvedAssignmentsIn(resolvedAssignmentLine(mixed, 2));
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(true);
    if (!results[0].ok) return;
    expect(results[0].value.roles).toBe(3);
    expect(results[0].value.overrides).toBe(2);
    expect(results[0].value.aliases).toEqual(["inherit", "opus"]);
  });

  it("resolvedAssignmentsIn REFUSES a malformed payload by name rather than dropping the line", () => {
    // A dropped line collapses into the ABSENT case, and a consumer's absent branch reports a run
    // that announced nothing — a different fact with a different remedy. So each shape below must
    // come back as exactly one refusal whose reason QUOTES what it could not read.
    const shapes = [
      '{"roles":"seventeen"}',
      "not json at all",
      "[1,2,3]",
      "null",
      '{"roles":17,"overrides":0,"aliases":"inherit"}',
      '{"roles":17,"overrides":0,"aliases":[7]}',
      '{"roles":-1,"overrides":0,"aliases":["inherit"]}',
      '{"roles":17,"overrides":0,"aliases":["inherit"],"digest":"abc"}',
    ];
    for (const payload of shapes) {
      const results = resolvedAssignmentsIn(RESOLVED_ASSIGNMENT_PREFIX + payload);
      expect(results, `"${payload}" must produce exactly one result`).toHaveLength(1);
      expect(results[0].ok, `"${payload}" must be REFUSED, not accepted`).toBe(false);
      if (results[0].ok) continue;
      // QUOTED, not interpolated raw. The payload arrives from a spawned child's stdout, so it is
      // untrusted text; embedding it unescaped would let a payload forge the surrounding sentence.
      // `JSON.stringify` is the same quoting the module's other refusals use on user-supplied values.
      expect(
        results[0].reason,
        "the refusal must quote the payload it could not read",
      ).toContain(JSON.stringify(payload));
    }
  });

  it("resolvedAssignmentsIn REFUSES an announced alias outside the closed set", () => {
    // (FINDING R2-IN-04) THE PARSER USED TO CHECK THE ALIAS TYPE AND STOP, while the refusal it
    // quotes back declares the shape as `"aliases":[<alias>,…]` — so `["not-a-model"]` read back
    // ok:true against a message promising an alias. The message stated a stricter grammar than the
    // parser enforced, which is the class this round is otherwise closing.
    const illegal = "not-a-model";

    // THE CASE'S OWN PREMISE, ASSERTED FIRST: the envelope is otherwise WELL-FORMED, so a refusal
    // below is attributable to the alias and not to a malformed payload. Proven by reading back the
    // identical envelope with a LEGAL alias in the same slot and requiring it to succeed.
    expect(isModelAlias(illegal), "the probe value must really be outside the closed set").toBe(false);
    const wellFormed = `{"roles":2,"overrides":0,"aliases":["inherit"]}`;
    const control = resolvedAssignmentsIn(RESOLVED_ASSIGNMENT_PREFIX + wellFormed);
    expect(control).toHaveLength(1);
    expect(control[0].ok, "the envelope itself must read back cleanly, or the red below is the envelope's").toBe(
      true,
    );

    const payload = `{"roles":2,"overrides":0,"aliases":["${illegal}"]}`;
    const results = resolvedAssignmentsIn(RESOLVED_ASSIGNMENT_PREFIX + payload);
    expect(results).toHaveLength(1);
    expect(results[0].ok, "an alias outside the closed set must be REFUSED, not read back").toBe(false);
    if (results[0].ok) return;
    // The OFFENDING VALUE, quoted, and the LEGAL SET, named — how every other alias refusal in this
    // module words it.
    expect(results[0].reason).toContain(JSON.stringify(illegal));
    expect(results[0].reason).toContain("not a legal model alias");
    for (const alias of MODEL_ALIASES) expect(results[0].reason).toContain(`"${alias}"`);
  });

  it("an ABSENT assignment line reads back as an EMPTY list — silence is never consent here either", () => {
    expect(resolvedAssignmentsIn("")).toEqual([]);
    expect(resolvedAssignmentsIn("generate-role-adapters: wrote 17 adapters\n")).toEqual([]);
  });

  it("the assignment reader is anchored too — an incidental mention is not an announcement", () => {
    const line = resolvedAssignmentLine(new Map<string, ModelAlias>([["a", "inherit"]]), 0);
    expect(resolvedAssignmentsIn(line)).toHaveLength(1);
    expect(resolvedAssignmentsIn(`WARN could not read ${line}`)).toEqual([]);
    expect(resolvedAssignmentsIn(`  ${line}`)).toEqual([]);
  });

  it("mirroredResolvedPresetLine and mirroredResolvedPresetsIn are inverse, and neither grammar reads the other's line", () => {
    // THE CROSS-GRAMMAR ISOLATION. Three declared grammars in one block is three chances for a
    // reader to accept a line a different speaker wrote, and the gate's verdict is precisely the
    // line whose conflation with the generator's announcement finding WR-04 named.
    for (const preset of PRESET_NAMES) {
      expect(mirroredResolvedPresetsIn(mirroredResolvedPresetLine(preset))).toEqual([preset]);
    }
    expect(resolvedPresetsIn(mirroredResolvedPresetLine("none"))).toEqual([]);
    expect(mirroredResolvedPresetsIn(resolvedPresetLine("none"))).toEqual([]);

    // …and neither preset grammar may read an ASSIGNMENT line.
    const assignment = resolvedAssignmentLine(new Map<string, ModelAlias>([["a", "inherit"]]), 0);
    expect(resolvedPresetsIn(assignment)).toEqual([]);
    expect(mirroredResolvedPresetsIn(assignment)).toEqual([]);
    expect(resolvedAssignmentsIn(resolvedPresetLine("none"))).toEqual([]);
  });

  it("the mirrored verdict line carries NO trailing punctuation — it is parsed, not read", () => {
    // A full stop would become part of the parsed value and turn `none` into `none.`. Asserted
    // rather than trusted: that is exactly how the first draft of this line failed its own case.
    const line = mirroredResolvedPresetLine("none");
    expect(line.startsWith(MIRRORED_RESOLVED_PRESET_PREFIX)).toBe(true);
    expect(line.endsWith("none")).toBe(true);
    expect(mirroredResolvedPresetsIn(line)).toEqual(["none"]);
  });
});

// ── The `models` BLOCK'S OWN KEY SET (plan 29.1-08, finding WR-01) ─────────────────────────────
//
// D-06 closes the key set of `models.roles`: an unknown role stem is refused naming the key and the
// valid set, because "a silently ignored override is a tier the user believes they set and did not".
// The block CONTAINING that map was open. `readModelsBlock` read `models.preset` and `models.roles`
// and enumerated nothing, so every other key was silently discarded.
//
// FOUR SHAPES WERE REPRODUCED against the committed .js before this block was written, and all four
// were accepted in silence:
//
//   {"models":{"presets":"tiered"}}                             => OK  preset=none   overrides=0
//   {"models":{"Preset":"tiered"}}                              => OK  preset=none   overrides=0
//   {"models":{"preset":"tiered","role":{"orchestrator":"opus"}}} => OK preset=tiered overrides=0
//   {"model":{"preset":"tiered"}}                               => OK  preset=none   overrides=0
//
// THE THIRD IS THE WORST AND IT IS NOT THE TYPO. A legal `preset` sits beside a near-miss overrides
// key: the preset APPLIES and the overrides silently do not, so the user gets a PARTIALLY wrong tier
// map with a green run and no message of any kind. That is verbatim what this module's own
// `unassigned` refusal calls "a tier the user believes they set and did not".
//
// THE FOURTH IS A DISCLOSED RESIDUAL AND IS PINNED AS ONE. The configuration FILE's top-level key
// set is legitimately OPEN — the same file carries the governance, quality, queue and compaction
// dials — so a closed-set mechanism there would refuse valid keys. Its case below asserts the
// zero-config answer and says in its own title that it is a residual, not a success.
describe("model-tiers: the `models` block's key set is CLOSED BY NAME (plan 29.1-08, WR-01)", () => {
  it("an unknown key inside the models block is REFUSED naming the key and the legal set", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithConfig({ models: { presets: "tiered" } }), stems);
    expect(reason).toContain("`models.presets`");
    // ONE offending key takes the singular clause.
    expect(reason).toContain("which is not a key of");
    // The legal set is QUOTED BACK, derived from the same tuple the check reads.
    for (const key of MODELS_KEYS) expect(reason).toContain(`"${key}"`);
    // The reason the user can act on, in D-06's own words, one level up.
    expect(reason).toMatch(/believes they set and did not/);
  });

  it("a case-varied preset key is refused as an unknown key rather than read", () => {
    const stems = kitStems();
    const reason = refusalOrFail(rootWithConfig({ models: { Preset: "tiered" } }), stems);
    // Membership is EXACT STRING EQUALITY, never a case fold — the same rule the alias and preset
    // vocabularies already follow. A case fold here would silently accept `Preset` as `preset`.
    expect(reason).toContain("`models.Preset`");
    for (const key of MODELS_KEYS) expect(reason).toContain(`"${key}"`);
  });

  it("the PARTIAL-APPLICATION shape is refused before the preset is applied", () => {
    const stems = kitStems();
    const reason = refusalOrFail(
      rootWithConfig({ models: { preset: "tiered", role: { orchestrator: "opus" } } }),
      stems,
    );
    // The refusal names the OVERRIDES key that was about to be dropped…
    expect(reason).toContain("`models.role`");
    // …and it is NOT the preset refusal: `tiered` is a legal preset and is never the complaint.
    expect(reason).not.toContain("is not a legal preset name");
    // WHAT DISCRIMINATES WHAT. This case is closed by the check's PRESENCE — deleting the check was
    // observed to turn it RED. It is NOT the case that discriminates the check's PLACEMENT: moving
    // the check below the preset read leaves this case GREEN, because a refusal short-circuits the
    // function either way and reading a legal preset into a local applies nothing. The case
    // immediately below is the one that moves on placement, and it moves on the refusal TEXT.
  });

  it("the unknown-key refusal fires before the preset refusal on a block carrying both defects", () => {
    const stems = kitStems();
    // THE PLACEMENT PROOF, and the only case in this block that moves when the check is relocated.
    // Asserted on the TEXT rather than on the boolean, because both placements refuse — they differ
    // only in WHICH FINDING the author is handed. Pre-fix, and again under the relocation mutation,
    // this shape refused for the illegal preset VALUE, having already read `models.preset`. That
    // sends the author to fix `"bogus"` inside a key they have to delete regardless, and only then
    // tells them about the key. The block's SHAPE is adjudicated before any of its values.
    const reason = refusalOrFail(
      rootWithConfig({ models: { presets: "tiered", preset: "bogus" } }),
      stems,
    );
    expect(reason).toContain("`models.presets`");
    expect(reason).not.toContain("is not a legal preset name");
    expect(reason).not.toContain('"bogus"');
  });

  it("EVERY offending key is named, in sorted order, in ONE refusal", () => {
    const stems = kitStems();
    // A user with two typos is told about two typos. Reporting only the first would send them round
    // the loop once per mistake, and the sort makes WHICH key is named first a property of the set
    // rather than of JSON key order.
    const reason = refusalOrFail(rootWithConfig({ models: { presets: "x", rolez: {} } }), stems);
    expect(reason).toContain("`models.presets`");
    expect(reason).toContain("`models.rolez`");
    expect(reason.indexOf("`models.presets`")).toBeLessThan(reason.indexOf("`models.rolez`"));
    // The clause agrees in number with the list it follows. "which is not a key" after a two-item
    // list reads as though one of the two were legal, and this text is the only channel telling the
    // user their configuration did not do what they meant.
    expect(reason).toContain("none of which is a key");
    expect(reason).not.toContain("which is not a key of");
  });

  it("a legal block carrying both preset and roles is still accepted", () => {
    const stems = kitStems();
    const victim = [...stems].sort()[0] as string;
    const r = readModelsConfig(
      rootWithConfig({ models: { preset: "tiered", roles: { [victim]: "opus" } } }),
      stems,
    );
    expect(r.ok, "the closed set must admit its own two members").toBe(true);
    if (!r.ok) return;
    expect(r.value.preset).toBe("tiered");
    expect(r.value.overrides.size).toBe(1);
    expect(r.value.overrides.get(victim)).toBe("opus");
  });

  it("an EMPTY models block is still the zero-config answer", () => {
    const stems = kitStems();
    // An empty key set has no member outside the legal set, so the new check must be silent on it.
    const r = readModelsConfig(rootWithConfig({ models: {} }), stems);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.preset).toBe("none");
    expect(r.value.overrides.size).toBe(0);
  });

  it("DISCLOSED RESIDUAL: a singular model key at file level is the zero-config answer, and the file's top-level key set is open by design", () => {
    const stems = kitStems();
    // NOT A SUCCESS. This case pins WHAT THE CODE DOES so the boundary of the guarantee is a
    // property nobody has to infer from silence. The FILE's top-level key set is open — it carries
    // `governance`, `quality`, `queue`, `context` and more — so closing it would need a registry of
    // every reader of this file, which does not exist in this tree. The direction of the residual is
    // recorded beside the check in source: the user gets the lean default and cannot tell it from a
    // typo. Closing it is out of scope for this plan and is NOT reported as closed anywhere.
    const r = readModelsConfig(rootWithConfig({ model: { preset: "tiered" } }), stems);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.preset).toBe("none");
    expect(r.value.overrides.size).toBe(0);
  });

  it("MODELS_KEYS is the closed set itself — exactly the two keys `readModelsBlock` PERMITS", () => {
    // THIS LITERAL IS A SECOND HAND-WRITTEN LIST, said plainly (finding R2-WR-06). The comment this
    // replaces called it "DERIVED-ADJACENT rather than a second hand-maintained list" and claimed a
    // third legal key "can only arrive by editing the tuple, which moves the mechanism and the
    // message together". Both halves were wrong in the same direction: this IS the second list, and
    // editing the tuple moves the MESSAGE — the refusal quotes MODELS_KEYS — while moving no
    // mechanism at all, because no reader is added and nothing asserts one was.
    //
    // WHAT IT IS ACTUALLY WORTH, which is not nothing: it makes an addition to the tuple VISIBLE IN
    // A DIFF. A reviewer reading a one-line tuple change sees this case change beside it. That is
    // the whole of its value, and it is the reason the case is kept rather than deleted as the
    // second authority.
    //
    // WHAT MAKES AN UNREAD ADDITION FAIL is the case below, "every member of MODELS_KEYS is CONSUMED
    // by the reader, not merely permitted", which drives each member through `readModelsConfig` and
    // requires the answer to move. Presence and consumption are two assertions over one tuple here,
    // rather than one assertion pretending to be two.
    expect([...MODELS_KEYS].sort()).toEqual(["preset", "roles"]);
    expect(new Set(MODELS_KEYS).size, "a repeated member would be a set literal pretending to be a set").toBe(
      MODELS_KEYS.length,
    );
  });

  it("every member of MODELS_KEYS is CONSUMED by the reader, not merely permitted", () => {
    // (FINDING R2-WR-06) THE PRESENCE CLOSURE ABOVE IS WR-01 RESTORED ONE LEVEL UP WITHOUT THIS CASE.
    // `readModelsBlock` refuses any key outside the tuple, then reads `models.preset` and
    // `models.roles` and nothing else. Nothing tied the tuple's membership to the keys the reader
    // actually consumes, so adding a member with no reader admitted the block carrying it, ignored
    // it, and reported the zero-config answer with no message of any kind — verbatim the defect the
    // tuple exists to close, one level up.
    const stems = kitStems();

    // Each probe is a value that, set ALONE in a `models` block, must visibly move the reader's
    // answer. The role stem is DERIVED from the kit authority rather than typed, like every other
    // corpus reference in this file.
    const probes: Record<ModelsKey, unknown> = {
      preset: "tiered",
      roles: { [[...stems].sort()[0]]: "opus" },
    };

    // THE PREMISE, BEFORE THE LOOP THAT SPENDS IT, AND IN BOTH DIRECTIONS. A key added to
    // MODELS_KEYS with no probe is a key nobody proved is read, and a loop over the probe table
    // alone would pass over exactly that omission — the table would shrink to fit the coverage it
    // had rather than fail on the coverage it lacked. This is the round's "derive the set, assert
    // the count" rule applied to a probe table rather than to a scan set: the ELEMENTS are compared,
    // not the cardinality, because two lists of equal length can still disagree about a member.
    expect(
      Object.keys(probes).sort(),
      "the probe table must cover every member of MODELS_KEYS — an unprobed key is an unproven key",
    ).toEqual([...MODELS_KEYS].sort());
    expect(
      [...MODELS_KEYS].sort(),
      "the probe table must carry no key MODELS_KEYS does not — a probe for a non-key proves nothing",
    ).toEqual(Object.keys(probes).sort());

    // The two facts the reader returns, as one stable serialisation. `source` is deliberately NOT
    // included: it is the fixture's own temp path and would differ between every pair of reads, so a
    // comparison carrying it would pass on the path rather than on the answer.
    const answer = (root: string): string => {
      const r = readModelsConfig(root, stems);
      if (!r.ok) throw new Error(`expected a resolution, got a refusal: ${r.reason}`);
      return JSON.stringify([r.value.preset, [...r.value.overrides].sort()]);
    };

    // THE BASELINE'S OWN PREMISE, asserted before anything is compared against it. A baseline that
    // was a refusal would make every comparison below differ for the wrong reason and the case would
    // report success over a broken read.
    const baselineRead = readModelsConfig(rootWithConfig({ models: {} }), stems);
    expect(baselineRead.ok, "the empty-block baseline must be a successful read, not a refusal").toBe(
      true,
    );
    const baseline = answer(rootWithConfig({ models: {} }));

    for (const key of MODELS_KEYS) {
      const withKey = answer(rootWithConfig({ models: { [key]: probes[key] } }));
      expect(
        withKey,
        `setting \`models.${key}\` alone changed nothing the reader returns — the key is PERMITTED by MODELS_KEYS and CONSUMED by nobody, which is a dial the user believes they set and did not`,
      ).not.toBe(baseline);
    }
  });
});

// ── FLOOR 0 VALIDATES BEFORE IT DEFAULTS (plan 29.1-08, finding WR-02) ─────────────────────────
//
// `resolveModels` opened with `const preset: PresetName = options?.preset ?? "none";` — the coalesce
// ran BEFORE `isPresetName`, so `null` and `undefined` were both coerced past the floor. The
// docstring on `ResolveModelsOptions.preset` directly above it claims the resolver "validates it by
// exact equality anyway — a JS caller can hand over anything". It did not.
//
// Reproduced against the committed .js before this block was written:
//
//   resolveModels(['a','b'], {preset: null})      => ok:true  [["a","inherit"],["b","inherit"]]
//   resolveModels(['a','b'], {preset: undefined}) => ok:true  [["a","inherit"],["b","inherit"]]
//
// WHY THE CODE IS FIXED RATHER THAN THE DOCSTRING DELETED. `readModelsConfig` cannot emit a null
// preset today, so this is latent rather than live. But the tooling layer ships as committed .js
// with NO TYPE CHECKING ON HOSTS, and that is the docstring's own stated reason for existing: the
// declared option type is advisory at run time, and the module header names the installer doctor and
// "any future runtime reader" as consumers. A floor that holds only under `tsc` is not a floor.
//
// ABSENT AND NULL ARE DIFFERENT STATEMENTS. An ABSENT preset is the zero-config contract — the
// caller asked for the lean default. A NULL preset is a caller who typed something that cannot mean
// anything. This module spends a paragraph on exactly that distinction at Pitfall 2 one function
// away ('"off" and "I typed something that cannot mean anything" are different statements'), and
// collapsing them here would leave a caller with the lean default and no indication why.
describe("model-tiers: resolveModels Floor 0 validates BEFORE it defaults (plan 29.1-08, WR-02)", () => {
  /** Two stems, derived from the kit authority rather than typed, in the shape Floor 0 needs. */
  const twoStems = (): readonly string[] => [...kitStems()].sort().slice(0, 2);

  it("resolveModels REFUSES a null preset by name instead of coercing it", () => {
    // THE CAST IS THE POINT OF THIS CASE, not an inconvenience worked around. The declared option
    // type does not admit `null`, so under `tsc` this call is unwritable — which is precisely why
    // the defect was invisible. The cast stands in for the untyped JavaScript caller the docstring
    // names: the committed .js runs on hosts with no type checking, so the only thing standing
    // between a null and the zero-config answer is this floor.
    const r = resolveModels(twoStems(), { preset: null } as unknown as { preset: undefined });
    expect(r.ok, "a null preset is a value that cannot mean anything, not a request for the default").toBe(
      false,
    );
    if (r.ok) return;
    // Quoted back exactly as it arrived, and the legal set named.
    expect(r.reason).toContain("null");
    for (const name of PRESET_NAMES) expect(r.reason).toContain(`"${name}"`);
  });

  it("resolveModels still treats an ABSENT preset as the zero-config answer", () => {
    // THE GREEN CONTROLS. Three spellings of "I did not ask for a preset", all of which must still
    // resolve `inherit` for every stem — the zero-config contract MODEL-01 pins the bytes of.
    const stems = twoStems();
    const zero = stringifyMap(resolvedOrFail(stems));
    for (const [label, r] of [
      ["absent options", resolveModels(stems)],
      ["absent preset key", resolveModels(stems, {})],
      ["explicitly undefined preset", resolveModels(stems, { preset: undefined })],
    ] as const) {
      expect(r.ok, `${label} must resolve — the fix must not close the zero-config path`).toBe(true);
      if (!r.ok) continue;
      expect(stringifyMap(r.value), label).toBe(zero);
    }
  });

  it("the three shapes are DISTINGUISHABLE — absent and undefined resolve, null and any other non-member refuse", () => {
    const stems = twoStems();
    const resolves = (o?: { preset?: unknown }): boolean =>
      resolveModels(stems, o as { preset?: undefined }).ok;
    expect(resolves(undefined)).toBe(true);
    expect(resolves({})).toBe(true);
    expect(resolves({ preset: undefined })).toBe(true);
    // Everything else — including every nullish and non-string shape user-authored JSON can carry.
    for (const bad of [null, 0, false, "", "bogus", "None", [], {}]) {
      expect(resolves({ preset: bad }), `${JSON.stringify(bad)} must be refused`).toBe(false);
    }
  });

  it("the pre-existing ILLEGAL-STRING refusal text is unchanged — compared, not eyeballed", () => {
    // The bytes of this refusal were captured from the PRE-FIX committed .js and are asserted here
    // rather than read: a fix to the floor's ORDERING must not move the floor's WORDING, and "it
    // looks the same" is not a comparison.
    const r = resolveModels(twoStems(), { preset: "bogus" } as unknown as { preset: undefined });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe(
      'model-tiers: "bogus" is not a legal preset name. The legal set is exactly: "none", ' +
        '"tiered". Remedy: use one of those two names; adding a third preset is a source change in ' +
        "scripts/model-tiers.ts, not a value a configuration file can invent.",
    );
    expect(r.reason.length, "the captured pre-fix length").toBe(241);
  });
});

// ── FLOOR 0b VALIDATES THE OTHER ARGUMENT'S SHAPE (plan 29.1-15, finding R2-WR-01) ─────────────
//
// WR-02 WAS CLOSED ON `preset` AND LEFT OPEN ON `overrides` — the same nullish coercion, in the same
// function, defended by the same docstring. The override application floor read
// `options?.overrides ?? []`, a coalesce before any shape check, while the docstring twelve lines
// above claimed the resolver "keeps a last-line alias floor anyway, because this value is written
// straight into emitted frontmatter". That floor was not reached at all for a value that is not
// iterable.
//
// Reproduced against the committed .js before this block was written:
//
//   resolveModels(['a','b'], {preset:'none', overrides: null})
//     => {"ok":true,"value":[["a","inherit"],["b","inherit"]]}     <- silently discarded
//   resolveModels(['a','b'], {preset:'none', overrides: {a:'opus'}})
//     => TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
//        at resolveModels (scripts/model-tiers.js:854:40)
//
// The second is the worse of the two and the likelier: a plain object is the natural shape for a
// caller that read `models.roles` out of JSON without building a Map, and a THROW leaves the module
// header's contract — return a result so a degrading consumer can branch on it — unavailable to the
// installer doctor and any future runtime reader, who would each have to write a catch, and a catch
// is where a refusal quietly becomes a default nobody chose.
//
// WHY THE CODE IS FIXED RATHER THAN THE DOCSTRING DELETED is plan 29.1-08's own recorded argument for
// `preset`, quoted rather than re-derived: the tooling layer ships as committed .js with NO TYPE
// CHECKING ON HOSTS, so the declared option type is advisory at run time, and "a floor that holds
// only under `tsc` is not a floor".
describe("model-tiers: resolveModels Floor 0b validates the overrides SHAPE (plan 29.1-15, R2-WR-01)", () => {
  /** Two stems, derived from the kit authority rather than typed, in the shape Floor 0b needs. */
  const twoStems = (): readonly string[] => [...kitStems()].sort().slice(0, 2);

  /** The refusal reason for an overrides value the declared type does not admit, or a failure. */
  const overridesRefusal = (bad: unknown): string => {
    // THE CAST IS THE POINT OF THESE CASES, not an inconvenience worked around — the same reason the
    // null-preset case above carries one. The declared option type does not admit these values, so
    // under `tsc` these calls are unwritable, which is precisely why the defect survived a green
    // suite. The cast stands in for the untyped JavaScript caller the module header names: the
    // committed .js runs on hosts with no type checking, so this floor is the only thing between a
    // present-but-wrong value and a tier the caller believes they set.
    const r = resolveModels(twoStems(), {
      preset: "none",
      overrides: bad,
    } as unknown as ResolveModelsOptions);
    if (r.ok) {
      throw new Error(
        `expected a refusal for ${JSON.stringify(bad)}, got a resolution: ${stringifyMap(r.value)}`,
      );
    }
    return r.reason;
  };

  it("resolveModels REFUSES a null overrides map by name instead of silently discarding it", () => {
    const reason = overridesRefusal(null);
    // The SHAPE RECEIVED, named back to the caller through the module's own shape helper.
    expect(reason).toContain("the overrides argument is null");
    // …and the SHAPE REQUIRED, so the caller is told what to hand over rather than only what failed.
    expect(reason).toContain("rather than a Map of role stem to alias");
    // The contract stated in the same terms Floor 0 states it: absent is the zero-config answer, and
    // present-but-wrong is a tier the caller believes they set.
    expect(reason).toContain("An ABSENT overrides map is the zero-config contract");
    expect(reason).toContain("a tier the caller believes they set and did not");
  });

  it("resolveModels REFUSES a plain-object overrides map by name instead of throwing", () => {
    // The RETURNED refusal is the assertion. If the floor regressed this call would not fail an
    // expectation — it would throw a TypeError out of the resolver, which is the defect itself.
    const reason = overridesRefusal({ [twoStems()[0]]: "opus" });
    expect(reason).toContain("the overrides argument is an object");
    expect(reason).toContain("rather than a Map of role stem to alias");
  });

  it("resolveModels still treats an ABSENT overrides map as the zero-config answer", () => {
    // THE GREEN CONTROLS, compared against the same stringified map the preset controls use. Three
    // spellings of "I did not hand over overrides", all of which must still resolve `inherit` for
    // every stem — the fix must not close the zero-config path MODEL-01 pins the bytes of.
    const stems = twoStems();
    const zero = stringifyMap(resolvedOrFail(stems));
    for (const [label, r] of [
      ["absent options", resolveModels(stems)],
      ["absent overrides key", resolveModels(stems, { preset: "none" })],
      ["explicitly undefined overrides", resolveModels(stems, { preset: "none", overrides: undefined })],
    ] as const) {
      expect(r.ok, `${label} must resolve — the fix must not close the zero-config path`).toBe(true);
      if (!r.ok) continue;
      expect(stringifyMap(r.value), label).toBe(zero);
    }
  });

  it("a LEGITIMATE Map still applies, and an illegal alias inside it is still refused per entry", () => {
    // The floor added above must not have moved the floor below it. A real Map still reaches the
    // per-entry alias check, so the green path and the pre-existing refusal are both exercised.
    const stems = twoStems();
    const applied = resolveModels(stems, {
      preset: "none",
      overrides: new Map([[stems[0], "opus"]]),
    });
    expect(applied.ok, "a Map of stem to alias is the shape this argument is for").toBe(true);
    if (!applied.ok) return;
    expect(applied.value.get(stems[0])).toBe("opus");
    expect(applied.value.get(stems[1])).toBe("inherit");

    const illegal = resolveModels(stems, {
      preset: "none",
      overrides: new Map([[stems[0], "gpt-5"]]) as unknown as ReadonlyMap<string, ModelAlias>,
    });
    expect(illegal.ok, "an illegal alias inside a legitimate Map is still the per-entry floor's").toBe(
      false,
    );
    if (illegal.ok) return;
    expect(illegal.reason).toContain(`the override for role "${stems[0]}"`);
    for (const alias of MODEL_ALIASES) expect(illegal.reason).toContain(`"${alias}"`);
  });
});

describe("model-tiers: the refusal path RETURNS on every input (plan 29.1-21, R3-WR-02)", () => {
  /** Two stems, derived from the kit authority rather than typed, in the shape both floors need. */
  const twoStems = (): readonly string[] => [...kitStems()].sort().slice(0, 2);

  /**
   * THE FOUR SHAPES THE ROUND-3 VERIFIER REPRODUCED AS THROWS, built rather than stored.
   *
   * A circular object cannot be a module-level constant shared between cases, because the same
   * object graph handed to two calls would let one case's mutation reach the other. Each entry is a
   * FACTORY for that reason, and for the second one that matters here: a getter that throws is only
   * a throwing getter while it is being read, so the value has to be fresh at the call site.
   */
  const circular = (): unknown => {
    const o: Record<string, unknown> = {};
    o.self = o;
    return o;
  };

  /**
   * THE SHAPE CORPUS THIS AUTHORITY MUST BE TOTAL OVER, and the DERIVED denominator under it.
   *
   * Totality is a claim about EVERY input, and a hand-listed four-case table is exactly the
   * set-literal drift this repository names as its second systemic failure class — it proves the
   * four shapes somebody thought of on the day. So the corpus is measured against a denominator
   * that is not this file's to choose: `typeof`'s codomain is fixed by the language at EIGHT
   * results, and the case below asserts the corpus covers all eight in BOTH directions rather than
   * counting itself. An input shape that `typeof` can name and this corpus does not carry is a hole
   * the assertion prints; a ninth entry invented here that `typeof` cannot name is one it prints too.
   *
   * The four object-typed entries beyond the `typeof` cover are the sub-shapes that make totality a
   * question at all: `JSON.stringify` throws on two of them (a circular graph, a getter that throws
   * mid-serialisation) and silently returns a non-string for three more of the corpus (`undefined`,
   * a function, a symbol). Both failure modes are the reason `quoteValue` wraps the call rather than
   * trusting it.
   *
   * THE FIFTH OBJECT ENTRY WAS ADDED BY PLAN 29.1-23, BECAUSE THE TWO AXES FAIL UNDER DIFFERENT
   * OPERATORS AND THIS CORPUS ONLY EVER MEASURED ONE OF THEM. Every shape here was chosen against
   * `JSON.stringify`, which is what renders a rejected VALUE. A rejected KEY used to be rendered by
   * TEMPLATE-LITERAL CONVERSION instead, which throws on a different set — measured, both
   * directions, before this entry was written:
   *
   *   an object whose getter throws            JSON.stringify: THREW   template literal: "[object Object]"
   *   an object whose string conversion throws JSON.stringify: "{}"    template literal: THREW
   *
   * The two shapes are exactly complementary, and the corpus carried only the first. Driven at the
   * KEY position against the pre-fix build it therefore caught ONE of the two regressions the
   * round-4 verifier reproduced and would have reported the other as safe. A corpus derived for one
   * operator is not a corpus for a claim about every input; the entry below is what makes the KEY
   * axis's own throwing shape visible to a case rather than only to a report.
   */
  const SHAPE_CORPUS: readonly (readonly [label: string, make: () => unknown])[] = [
    ["undefined", () => undefined],
    ["null", () => null],
    ["a boolean", () => false],
    ["a number", () => Number.NaN],
    ["a BigInt", () => 1n],
    ["a string", () => "not-an-alias"],
    ["a symbol", () => Symbol("nope")],
    ["a function", () => () => "nope"],
    ["an array", () => ["opus"]],
    ["a plain object", () => ({ tier: "opus" })],
    ["a circular object", circular],
    ["an object whose getter throws", () => ({ get boom(): never { throw new Error("getter"); } })],
    [
      "an object whose string conversion throws",
      () => ({ toString(): never { throw new Error("to-string"); } }),
    ],
  ];

  /** The complete codomain of `typeof`, fixed by the language rather than by this file. */
  const TYPEOF_RESULTS = [
    "undefined",
    "object",
    "boolean",
    "number",
    "bigint",
    "string",
    "symbol",
    "function",
  ] as const;

  it("the shape corpus covers every result `typeof` can produce, in both directions", () => {
    // THE DENOMINATOR IS DERIVED, NOT TYPED. A cardinality assertion against a hand-typed number
    // would move the day someone added an entry and re-typed the number to match, which is the
    // failure mode it exists to catch. This compares two SETS instead: the shapes the corpus
    // actually produces, and the closed vocabulary the language can name.
    const covered = new Set(SHAPE_CORPUS.map(([, make]) => typeof make()));
    expect([...covered].sort()).toEqual([...TYPEOF_RESULTS].sort());
    expect(covered.size).toBe(TYPEOF_RESULTS.length);
    // And the corpus is strictly wider than its cover, because the object sub-shapes that THROW are
    // indistinguishable from a plain object under `typeof` and are the whole reason for the guard.
    expect(SHAPE_CORPUS.length).toBeGreaterThan(TYPEOF_RESULTS.length);
  });

  it("the shape corpus and the language codomain are both observable numbers, pinned two-sided", () => {
    // WHY BOTH PINS EXIST, WHICH IS FINDING WR-04 OF ROUND 4 (recorded there as WR-02 of the review).
    // The case above argues that its denominator "is not this file's to choose" — and then this file
    // types it, eight strings, three lines under the argument. That is not a lie, but it is not
    // checkable either: a reader who does not already believe the claim has nothing to check it
    // against, and a co-edit that deletes one corpus entry TOGETHER WITH its matching codomain
    // string leaves the set-equality above perfectly green over a corpus that no longer covers the
    // language. The two numbers below are what make the argument observable.
    //
    // EIGHT IS THE LANGUAGE'S NUMBER, NOT THIS FILE'S. `typeof` has exactly eight possible results:
    // ECMA-262, the `typeof` Operator Results table (13.5.3 / Table 41) — "undefined", "object" (for
    // both `null` and any non-callable object), "boolean", "number", "string", "symbol", "bigint",
    // "function". A ninth result cannot be invented by an author of this file, so this pin fails
    // exactly when someone edits the local list away from the table it claims to copy.
    expect(
      TYPEOF_RESULTS.length,
      "the `typeof` codomain is EIGHT results, fixed by ECMA-262's `typeof` Operator Results " +
        "table — if this number moved, the local list stopped being a copy of the language table " +
        "the case above claims it is",
    ).toBe(8);
    // THE CORPUS SIZE IS PINNED FOR THE OTHER HALF OF THE SAME CO-EDIT. Deleting an entry AND its
    // codomain string in one edit keeps the sets equal and reds HERE instead. Thirteen: eight for
    // the `typeof` cover plus five object sub-shapes (an array, a plain object, a circular graph,
    // a throwing getter, a throwing string conversion) that `typeof` cannot tell apart.
    expect(
      SHAPE_CORPUS.length,
      "the corpus is EIGHT typeof-cover shapes plus FIVE object sub-shapes typeof cannot " +
        "distinguish; a change here is a change to the denominator every totality claim in this " +
        "describe block rests on, and must be argued rather than re-typed",
    ).toBe(13);
    // And every label is distinct, so the two numbers above count shapes rather than repetitions.
    expect(new Set(SHAPE_CORPUS.map(([label]) => label)).size).toBe(SHAPE_CORPUS.length);
  });

  it("the override refusal RETURNS for every shape in the corpus, never throwing out of itself", () => {
    // THE ASSERTION IS THAT THE CALL RETURNS. If the authority regressed, this case would not fail
    // an expectation — the resolver would throw, which is the defect itself, so the call is wrapped
    // and the throw is reported as the failure it is rather than as a suite error with no name.
    //
    // THIS IS THE **VALUE** ARM, and saying so is the point of the two cases that follow it. Every
    // entry below puts a corpus shape at the VALUE position and a real stem at the KEY position, so
    // on its own it supports a claim about rejected values — not the claim its describe block makes
    // about every input. The KEY arm and the arm's union are asserted separately, because two arms
    // verified apart are two statements about two inputs.
    const stems = twoStems();
    for (const [label, make] of SHAPE_CORPUS) {
      let outcome: ReturnType<typeof resolveModels>;
      try {
        outcome = resolveModels(stems, {
          preset: "none",
          overrides: new Map([[stems[0], make()]]),
        } as unknown as ResolveModelsOptions);
      } catch (e) {
        throw new Error(
          `the refusal path THREW for ${label} instead of returning: ${String(e)}`,
        );
      }
      expect(outcome.ok, `${label} is not a legal alias, so it must be REFUSED`).toBe(false);
      if (outcome.ok) continue;
      // The role stem travels with the shape, so a caller holding several overrides can tell WHICH
      // one was rejected rather than only that something was.
      expect(outcome.reason, label).toContain(`the override for role "${stems[0]}"`);
      for (const alias of MODEL_ALIASES) expect(outcome.reason, label).toContain(`"${alias}"`);
    }
  });

  it("the override refusal RETURNS for every shape in the corpus at the KEY position, never throwing out of itself", () => {
    // THE ARM THE CORPUS NEVER MEASURED, AND THE ONE THE ROUND-4 REGRESSION LIVED ON. A Map key is
    // typed `string` and is ANY VALUE at run time — the declared type is advisory on hosts, which is
    // this module's own standing reason for every floor it has. Both refusal sentences interpolated
    // that key raw inside hand-written quotation marks while routing their alias through the
    // authority, so the guarded position proved nothing: the un-guarded one beside it killed the
    // same message.
    //
    // WATCHED FAILING FIRST, against the committed `.js` at a58036b (the build before plan 29.1-23
    // task 1), driven from one script with this exact corpus: "a symbol" THREW
    // `TypeError: Cannot convert a Symbol value to a string`, and the newly added
    // "an object whose string conversion throws" THREW `Error: to-string`. The other eleven shapes
    // RETURNED — which is why the corpus needed the thirteenth entry before this case could see both
    // reproduced regressions rather than one of them.
    //
    // A LEGAL ALIAS AT THE VALUE POSITION IS DELIBERATE. It makes the alias floor pass, so every
    // iteration reaches the SECOND refusal — the uncovered-stem one. That is the sentence plan
    // 29.1-21 created by reversing a silent skip, and the sentence the regression was reachable
    // through; the value arm above can never reach it.
    const stems = twoStems();
    for (const [label, make] of SHAPE_CORPUS) {
      let outcome: ReturnType<typeof resolveModels>;
      try {
        outcome = resolveModels(stems, {
          preset: "none",
          overrides: new Map([[make(), "opus"]]),
        } as unknown as ResolveModelsOptions);
      } catch (e) {
        throw new Error(
          `the refusal path THREW for ${label} at the KEY position instead of returning: ${String(e)}`,
        );
      }
      expect(
        outcome.ok,
        `${label} is not a stem this resolution covers, so it must be REFUSED`,
      ).toBe(false);
      if (outcome.ok) continue;
      // The SENTENCE that names the stem position survives every key shape, which is the whole
      // point: the refusal exists to tell the caller their override was dropped, and a key that
      // kills that sentence takes the message with it.
      expect(outcome.reason, label).toContain("the override names the role stem ");
      // And the covered set is still named, derived from the stems handed over rather than typed.
      for (const stem of stems) expect(outcome.reason, label).toContain(`"${stem}"`);
    }
  });

  it("the override refusal RETURNS for every KEY-by-VALUE cell in the corpus, and the cell count is derived from both axes", () => {
    // THE UNION OF THE TWO ARMS, WHICH IS NOT EITHER ARM. Verified apart, the arms above are two
    // statements about two inputs; the cell that exercises BOTH un-guarded interpolations inside ONE
    // sentence is the one where the key AND the value are each un-renderable, and it appears in
    // neither. It appears here.
    //
    // THE CELL COUNT IS DERIVED FROM THE CORPUS ON BOTH AXES, never typed beside it, because a typed
    // product is a number that moves when someone re-types it to match — the same set-literal drift
    // the corpus itself is built to avoid.
    const stems = twoStems();
    const expectedCells = SHAPE_CORPUS.length * SHAPE_CORPUS.length;
    let cells = 0;
    for (const [keyLabel, makeKey] of SHAPE_CORPUS) {
      for (const [valueLabel, makeValue] of SHAPE_CORPUS) {
        const cell = `key=${keyLabel} / value=${valueLabel}`;
        let outcome: ReturnType<typeof resolveModels>;
        try {
          outcome = resolveModels(stems, {
            preset: "none",
            overrides: new Map([[makeKey(), makeValue()]]),
          } as unknown as ResolveModelsOptions);
        } catch (e) {
          throw new Error(`the refusal path THREW for ${cell} instead of returning: ${String(e)}`);
        }
        expect(outcome.ok, `${cell} carries no legal alias, so it must be REFUSED`).toBe(false);
        if (!outcome.ok) expect(outcome.reason, cell).toContain("model-tiers: the override ");
        cells += 1;
      }
    }
    // THE IN-LOOP COUNTER IS ASSERTED AGAINST THE DERIVED PRODUCT. Asserting the product alone would
    // pass over a loop that ran short — an early `continue`, a corpus entry whose factory returned
    // nothing, a nested loop rewritten to iterate one axis. The number of cells this run ACTUALLY
    // executed is counted where they execute, and compared with the number the corpus says there
    // are, so a smaller success is a failure.
    expect(
      cells,
      `the cross product must exercise every cell: ${String(SHAPE_CORPUS.length)} key shapes × ` +
        `${String(SHAPE_CORPUS.length)} value shapes = ${String(expectedCells)}`,
    ).toBe(expectedCells);
  });

  it("a Symbol key is REFUSED and NAMED rather than crashing the sentence that rejects it", () => {
    // THE RENDERING IS PINNED, NOT ASSUMED. A Symbol key reaches the ONE quoting authority, and that
    // authority renders a Symbol the way it has always rendered a Symbol VALUE: `JSON.stringify`
    // RETURNS `undefined` for a symbol — without throwing — and the authority's `String(...)` is
    // what keeps a non-string out of the template. So the key reads as a bare `undefined`.
    //
    // WHETHER THAT IS THE BEST RENDERING FOR A READER IS A WORDING JUDGEMENT, NOT A PREDICATE, and
    // it is disclosed in .planning/WINDOWS.md rather than argued away here. What this case buys is
    // that it cannot drift silently. The mitigating fact is asserted below rather than claimed: a
    // legitimate STRING key spelled "undefined" renders WITH its quotation marks, so the two are
    // distinguishable in the message a caller actually reads.
    const stems = twoStems();
    const r = resolveModels(stems, {
      preset: "none",
      overrides: new Map([[Symbol("nope"), "opus"]]),
    } as unknown as ResolveModelsOptions);
    expect(r.ok, "a Symbol is not a stem this resolution covers — a refusal, not a crash").toBe(
      false,
    );
    if (r.ok) return;
    expect(r.reason).toContain("model-tiers: the override names the role stem undefined, which is ");
    expect(r.reason).not.toContain('the role stem "undefined"');

    // THE DISCRIMINATOR. The same sentence for the STRING "undefined" carries the quotation marks
    // the authority supplies for a string, so a reader can tell a rendered value from a dropped one.
    const asString = resolveModels(stems, {
      preset: "none",
      overrides: new Map([["undefined", "opus"]]),
    } as unknown as ResolveModelsOptions);
    expect(asString.ok).toBe(false);
    if (asString.ok) return;
    expect(asString.reason).toContain('model-tiers: the override names the role stem "undefined", ');
    expect(asString.reason).not.toBe(r.reason);
  });

  it("Floor 0 returns a refusal for a preset that cannot be serialised, rather than throwing", () => {
    const r = resolveModels(twoStems(), { preset: circular() } as unknown as ResolveModelsOptions);
    expect(r.ok, "a circular preset is not a legal preset name — it is a refusal, not a crash").toBe(
      false,
    );
    if (r.ok) return;
    // The DESCRIPTION, not a rendering — angle brackets are how a reader tells the two apart.
    expect(r.reason).toContain("<an object that cannot be serialised>");
    expect(r.reason).toContain("is not a legal preset name");
    for (const name of PRESET_NAMES) expect(r.reason).toContain(`"${name}"`);
  });

  it("Floor 0 returns a refusal for a BigInt preset, rather than throwing", () => {
    const r = resolveModels(twoStems(), { preset: 1n } as unknown as ResolveModelsOptions);
    expect(r.ok, "a BigInt preset is a value that cannot mean anything, not a crash").toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain("<a bigint that cannot be serialised>");
    for (const name of PRESET_NAMES) expect(r.reason).toContain(`"${name}"`);
  });

  it("the override refusal returns for an alias that cannot be serialised, rather than throwing", () => {
    const stems = twoStems();
    const r = resolveModels(stems, {
      preset: "none",
      overrides: new Map([[stems[0], circular()]]),
    } as unknown as ResolveModelsOptions);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain(`the override for role "${stems[0]}"`);
    expect(r.reason).toContain("<an object that cannot be serialised>");
  });

  it("the override refusal returns for a BigInt alias, rather than throwing", () => {
    const stems = twoStems();
    const r = resolveModels(stems, {
      preset: "none",
      overrides: new Map([[stems[0], 1n]]),
    } as unknown as ResolveModelsOptions);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain(`the override for role "${stems[0]}"`);
    expect(r.reason).toContain("<a bigint that cannot be serialised>");
  });

  it("a SERIALISABLE value renders byte-identically through the authority — no refusal wording moved", () => {
    // THE REGRESSION CONTROL FOR THE WHOLE CHANGE. A total function that altered the rendering of an
    // ordinary value would be a silent wording change across a safety surface, and every one of
    // these strings is what a user reads when their configuration is rejected. The expected text is
    // built here the way the pre-fix code built it, so the two renderings are compared rather than
    // one of them being restated.
    const stems = twoStems();
    for (const value of ["cheap", 7, true, null, ["tiered"], { preset: "tiered" }] as const) {
      const r = resolveModels(stems, { preset: value } as unknown as ResolveModelsOptions);
      expect(r.ok, `${String(JSON.stringify(value))} is not a preset name`).toBe(false);
      if (r.ok) continue;
      expect(r.reason).toContain(`model-tiers: ${String(JSON.stringify(value))} is not a legal`);
    }
    for (const value of ["gpt-5", 7, true, null, ["opus"]] as const) {
      const r = resolveModels(stems, {
        preset: "none",
        overrides: new Map([[stems[0], value]]),
      } as unknown as ResolveModelsOptions);
      expect(r.ok).toBe(false);
      if (r.ok) continue;
      expect(r.reason).toContain(
        `the override for role "${stems[0]}" is ${String(JSON.stringify(value))}, which `,
      );
    }
  });

  it("the quoting operation has ONE spelling in the module that ships as well as the one that compiles", () => {
    // THE SET IS DERIVED FROM THE SOURCE, AND ITS CARDINALITY PINNED TWO-SIDED. Comments are
    // stripped first, because this module's own docstrings quote the operation while describing it —
    // a scan that counted those would be counting prose. Two sites survive by design and both are
    // named below; a third is a plan violation, and so is a second spelling of the wrapped form.
    //
    // IT READS BOTH ARTIFACTS AS OF PLAN 29.1-23, WHICH IS FINDING WR-04 OF ROUND 4. The claim this
    // case makes is about THIS MODULE, and the module hosts actually execute is the committed
    // `scripts/model-tiers.js` — a tooling layer that ships as compiled output with no type checking
    // on the host, which is this module's own standing reason for every run-time floor it has. A
    // scan that reads only the `.ts` proves a property of the file that COMPILES, not of the file
    // that SHIPS. Build parity is enforced elsewhere and would probably catch a divergence, but
    // "another gate would probably have caught it" is not the claim written above, and this case is
    // the one that makes the claim. Both counts were MEASURED before this widening rather than
    // assumed equal: 2 sites over the `.ts` and 2 over the `.js`, guarded-`try` 1 and 1, wrapped
    // spelling absent from both. They agree, which is the expected result and not a proven one until
    // it is read.
    const SUBJECTS = ["model-tiers.ts", "model-tiers.js"] as const;
    // THE COMMENT STRIP'S LIMITS, STATED WHERE THE CLAIM IS MADE. The filter drops a line whose
    // FIRST non-space byte opens a comment, and nothing else. A trailing comment on a code line is
    // NOT dropped, and neither is a block comment sharing a line with code — the text of both is
    // scanned as if it were code. The strip is therefore one-directional: it can produce a FALSE RED
    // (a spelling written in a trailing comment counted as a site) and it cannot produce a false
    // green from executable code, because the only text it removes is text on a line that is
    // entirely a comment, and a comment does not execute.
    const STRIP_LIMITS =
      "the comment strip drops ONLY a line whose first non-space byte opens a comment; a trailing " +
      "comment on a code line and a block comment sharing a line with code are BOTH scanned as " +
      "code, so this count can be too HIGH and never too low";
    for (const file of SUBJECTS) {
      const source = readFileSync(join(ROOT, "scripts", file), "utf8")
        .split("\n")
        .filter((line) => !/^\s*[/*]/.test(line))
        .join("\n");
      const sites = source.match(/JSON\.stringify\(/g) ?? [];
      expect(
        sites.length,
        `${file}: exactly two — \`quoteValue\`'s guarded call, the one authority, and ` +
          "`resolvedAssignmentLine`'s payload emitter, which SERIALISES AN ANNOUNCEMENT rather " +
          `than building a refusal, and whose input is a locally constructed ResolvedAssignment. ${STRIP_LIMITS}`,
      ).toBe(2);
      // The wrapped second spelling the override refusal carried is GONE, not relocated — and the
      // authority does not satisfy this scan itself, because it assigns the render to a local rather
      // than composing the two calls. A predicate a subject can satisfy on its own is not a predicate.
      expect(
        source.includes("String(JSON.stringify("),
        `${file}: carries the composed second spelling the deleted override site used. ${STRIP_LIMITS}`,
      ).toBe(false);
      // The surviving authority is the ONLY place the operation sits inside a `try`.
      expect(
        (source.match(/try \{\n\s*rendered = JSON\.stringify\(/g) ?? []).length,
        `${file}: the guarded call is the ONE authority and must appear exactly once. ${STRIP_LIMITS}`,
      ).toBe(1);
    }
  });
});

describe("model-tiers: an override for an uncovered stem is REFUSED (plan 29.1-21, R3 anti-pattern)", () => {
  /** Two stems, derived from the kit authority rather than typed. */
  const twoStems = (): readonly string[] => [...kitStems()].sort().slice(0, 2);

  it("resolveModels REFUSES an override naming a stem this resolution does not cover", () => {
    // WAS A SILENT `continue` UNTIL PLAN 29.1-21, on an argued mirror case that the measurement
    // could not find a single instance of. Replacing the skip with a refusal left the WHOLE suite
    // green (55 files, 2381 passed) and all three live gates at exit 0 with adapter bytes unchanged,
    // and both production call sites hand `readModelsConfig` and `resolveModels` the SAME stems —
    // so an uncovered stem cannot arrive from either. The disposition is DECIDED here rather than
    // carried into a fourth round.
    const stems = twoStems();
    const r = resolveModels(stems, {
      preset: "none",
      overrides: new Map([["definitely-not-a-role", "opus"]]),
    } as unknown as ResolveModelsOptions);
    expect(r.ok, "an override this resolver would drop is a tier the caller believes they set").toBe(
      false,
    );
    if (r.ok) return;
    // The STEM is named, so a caller holding several overrides can tell which one was rejected.
    expect(r.reason).toContain('"definitely-not-a-role"');
    // And the set it is not a member of is named too, derived from the stems handed over.
    for (const stem of stems) expect(r.reason).toContain(`"${stem}"`);
  });

  it("a COVERED stem still applies — the refusal did not close the override contract", () => {
    // THE GREEN CONTROL. A refusal that also refused the legitimate case would be indistinguishable
    // from the one above on its own, and the override winning over the preset is the module header's
    // stated tie-breaking contract.
    const stems = twoStems();
    const r = resolveModels(stems, { preset: "none", overrides: new Map([[stems[0], "opus"]]) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.get(stems[0])).toBe("opus");
    expect(r.value.get(stems[1])).toBe("inherit");
  });
});
