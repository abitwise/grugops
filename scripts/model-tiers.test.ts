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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { listRoles, ROLE_COUNT } from "./kit-model.js";
import {
  MODEL_ALIASES,
  MODEL_TIERS_COUNT,
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
    // The carriage return is trimmed off THE LINE before the prefix test rather than off the
    // captured value, so a value carrying internal spacing stays visible as wrong rather than being
    // normalised into shape.
    expect(resolvedPresetsIn(`${resolvedPresetLine("none")}\r`)).toEqual(["none"]);
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

  it("MODELS_KEYS is the closed set itself — exactly the two keys `readModelsBlock` reads", () => {
    // The set is DERIVED-ADJACENT rather than a second hand-maintained list: the refusal filters
    // against this tuple and the cases above quote it back, so a third legal key can only arrive by
    // editing the tuple, which moves the mechanism and the message together.
    expect([...MODELS_KEYS].sort()).toEqual(["preset", "roles"]);
    expect(new Set(MODELS_KEYS).size, "a repeated member would be a set literal pretending to be a set").toBe(
      MODELS_KEYS.length,
    );
  });
});
