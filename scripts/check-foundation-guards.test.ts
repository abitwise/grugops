// check-foundation-guards.test.ts — SDLC-02 / SC2 fail-proof harness for
// scripts/check-foundation-guards.js (Vitest port of check-foundation-guards.test.sh).
//
// Proves the six foundation guards both PASS and FAIL — the no-fabrication contract (a gate that
// can only ever pass is fabricated green). It plants EXACTLY ONE real violation per guard into a
// hermetic throwaway mirror of the inputs, runs the COMPILED guard (.js) against that mirror via
// the CHECK_ROOT override, and asserts each fails red (nonzero exit AND the finding names the
// defect — the expect_fail shape). Then a smoke run proves the REAL guard is GREEN over the REAL
// tree, and a byte-identity assertion proves the two config JSONs stay byte-identical (the
// tri-file drift Plan 10-03 must avoid).
//
// The .sh harness mirrored the guard's inputs into $WORK/<case>/ and ran the guard FROM the mirror
// so its hard-coded relative paths resolved there. The TS guard exposes a CHECK_ROOT env override
// (it resolves every path against CHECK_ROOT when set), so this harness mirrors inputs into a temp
// dir and spawns `node check-foundation-guards.js` with CHECK_ROOT pointed at the mirror —
// reproducing the same hermetic plant-and-run behavior. NOTHING outside the temp dir is mutated.
//
// Spawns the COMMITTED compiled .js (never the .ts), mirroring the spawnSync child-CLI test idiom.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  writeFileSync,
  appendFileSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

// (27-65 task 3) The gate-level sweep plants rows from plan 27-63's corpus BY ID, and adjudicates
// which rows are graftable with the same admission reader the gate now uses — so the module-level
// replay and the gate-level replay cannot disagree about which bytes were tested.
import { CORPUS, CORPUS_COUNT, rowById } from "./canonical-corpus.js";
import { admit } from "./canonical-frontmatter.js";

// (Plan 29-01) The two new guards' predicates, read from the authority so the mirror repair and the
// fixtures below cannot come to disagree with the guards about what conforms.
import {
  readCavemanFence,
  normalizeSentence,
  segmentClauses,
  countLexiconTokens,
  countBannedConstructions,
  CAVEMAN_LEXICON,
  CAVEMAN_LEXICON_MIN,
  BANNED_CONSTRUCTIONS,
} from "./voice-model.js";

import {
  listRoles,
  listAgentAdapters,
  listSkillAdapters,
  listPluginSkillAdapters,
  listPluginExemptComponentFiles,
  pluginForbiddenComponentSubpaths,
  spawnGrantScan,
  ROLE_COUNT,
  PLUGIN_SKILL_ADAPTER_COUNT,
  PLUGIN_MANIFEST_COMPONENT_COUNT,
} from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-foundation-guards.js");

// Repo-relative path of a role file inside a mirror (or the real tree). Every plant case below goes
// through this helper rather than restating the directory, so the role directory is named in exactly
// one more place than the derivation itself — the set-literal drift this phase exists to delete.
const rolePath = (root: string, name: string): string =>
  join(root, "agent-factory/roles", name);

// (Phase 27 / KIT-01) The role portion of the harness's own input set is DERIVED. GUARD_INPUTS was
// itself a hand-maintained list of exactly the drift class this phase deletes: 17 role literals that
// had to be edited in lockstep with the guard's ROLE_FILES and the kit on disk. It is now built from
// the same authority the guard uses, so a mirror can never be missing a role the guard will scan.
// The NON-role entries stay explicit literals on purpose — they are a curated set of unrelated
// surfaces (AGENTS.md, the two adapters, the two packaging templates, the SEC_VOICE surfaces, the
// workflows, the .planning/ Tier-1 oracle inputs), not a directory listing, so there is nothing to
// derive them from.
const DERIVED_ROLE_INPUTS = listRoles().map((f) => `agent-factory/roles/${f}`);

// (Phase 27 / KIT-02) The ADAPTER portion of the harness's input set is derived too, for the same
// reason. guard_adapter_size, the spawn-grant scan and the SKILL_COUNT floor all derive their
// membership from `.claude/agents` and `.claude/skills`, so a mirror carrying a hand-picked SUBSET
// of those directories would trip the count floor on every plant case instead of the violation it
// planted. Deriving here mirrors the guard's own rule, so the two can never disagree.
//
// (Plan 27-10, KIT-02) The AGENT half now calls the SAME authority the guard calls. It used to be a
// third non-recursive readdir of `.claude/agents` living in the harness — "mirrors the guard's own
// rule" was a promise kept by hand, and a hand-kept promise is the drift class this milestone
// deletes. A mirror can no longer carry a different adapter set than the guard will scan, and a
// nested adapter in the live tree would be mirrored rather than quietly dropped from every fixture.
const DERIVED_AGENT_ADAPTER_INPUTS = listAgentAdapters(ROOT).map(
  (rel) => `.claude/agents/${rel}`,
);
const DERIVED_SKILL_ADAPTER_INPUTS = listSkillAdapters(ROOT).map(
  (rel) => `.claude/skills/${rel}`,
);

// (Plan 27-34, closing CR-03) The PLUGIN-FORM skill tree. A mirror that did not carry it would make
// the plant case below pass because the file is ABSENT — guard_wr05 skips a scan member that does not
// exist — rather than because the guard convicted it, which is a case that pins nothing. It would also
// trip the new plugin cardinality floor on every unrelated plant case. Derived from the same authority
// the guard derives from, so the mirror and the scan can never disagree about membership.
const DERIVED_PLUGIN_SKILL_INPUTS = listPluginSkillAdapters(ROOT).map(
  (rel) => `skills/${rel}`,
);

// The complete set of input files the guard reads (repo-relative). A mirror carries byte-faithful
// copies of all of these; one file is then mutated to plant the violation. The derived role corpus
// plus the derived adapter corpus (agents + skills) plus the SEC_VOICE surfaces plus AGENTS.md and
// the 2 packaging templates.
const GUARD_INPUTS = [
  ...DERIVED_ROLE_INPUTS,
  ...DERIVED_AGENT_ADAPTER_INPUTS,
  ...DERIVED_SKILL_ADAPTER_INPUTS,
  ...DERIVED_PLUGIN_SKILL_INPUTS,
  "AGENTS.md",
  "agent-factory/packaging/subagent.frontmatter.md",
  "agent-factory/packaging/slash-command.template.md",
  "agent-factory/workflows/15-security-audit.md",
  "agent-factory/checklists/security-nfr-checklist.md",
  // (Phase 24) agent-factory/handoffs/security-nfr-handoff.md was DROPPED from SEC_VOICE_FILES — the
  // 17 static handoff templates were deleted, so the deleted handoff is no longer a guard input.
  // Phase 19 Tier-1 oracle inputs (UAT-AUTO-05): the aggregator now invokes the three oracles, which
  // read these. Mirror them so the hermetic plant case below can break one and prove the aggregator
  // fails closed. (The oracle bodies live single-source in check-uat-oracles.ts.)
  ".planning/PROJECT.md",
  ".planning/STATE.md",
  ".planning/v1.2-SDLC-COVERAGE-AUDIT.md",
  ".planning/RETROSPECTIVE.md",
  "hooks/hooks.json",
  "hooks/guard.js",
  // (DOGF-01) examples/03-ticket-to-pr.md dropped: the A3 oracle is now oracleDualPathEquivalence,
  // which self-seeds hermetic temp dirs and reads no repo input — the former parity example is dead.
  // Phase 20 guard_context_writes SCAN set (SCTX-05): the 16 shipped workflows (the 17 roles are
  // already mirrored above). The guard greps these for a raw `.grugops/context/` write bypassing
  // context-io.ts; mirror them so the SC-5 planted-raw-write case can plant a bypass into one.
  "agent-factory/workflows/00-bootstrap-greenfield.md",
  "agent-factory/workflows/01-bootstrap-brownfield.md",
  "agent-factory/workflows/02-idea-to-epics.md",
  "agent-factory/workflows/03-epic-to-tickets.md",
  "agent-factory/workflows/04-ticket-to-pr.md",
  "agent-factory/workflows/05-pr-quality-gate.md",
  "agent-factory/workflows/06-uat-pack.md",
  "agent-factory/workflows/07-backlog-refinement.md",
  "agent-factory/workflows/08-sprint-planning.md",
  "agent-factory/workflows/09-daily-sweep.md",
  "agent-factory/workflows/10-sprint-review.md",
  "agent-factory/workflows/11-retro.md",
  "agent-factory/workflows/12-release.md",
  "agent-factory/workflows/13-incident.md",
  "agent-factory/workflows/14-ui-design-to-build.md",
  "agent-factory/workflows/15-security-audit.md",
  // Phase 27 (KIT-01): guard_kit_counts derives the workflow set from <CHECK_ROOT>/agent-factory/
  // workflows and requires exactly WORKFLOW_COUNT (19) entries. Workflows 16/17/18 are not in the
  // guard_context_writes SCAN set, but the mirror must still carry them or every plant case would
  // trip the count guard on a 16-workflow mirror instead of the violation it planted.
  "agent-factory/workflows/16-context-read-write.md",
  "agent-factory/workflows/17-task-claim.md",
  "agent-factory/workflows/18-context-compaction.md",
  // Phase 23 (D-19): the invoked oracleWr05Wording now scans the 5-tool tables for asymmetric-flip
  // drift, so mirror them too — otherwise the oracle's CR-01 missing-file fail-red would fire on
  // every foundation-guards plant case.
  "agent-factory/packaging/adapters.md",
  "agent-factory/README.md",
];

const tmpDirs: string[] = [];

// ---------------------------------------------------------------------------------------------
// (Plan 29-01) WHY THE MIRROR'S ROLE FILES ARE NORMALIZED RATHER THAN COPIED BYTE-FAITHFULLY.
//
// Every plant case below asserts that ONE planted violation turns the gate red and that the
// UNPLANTED mirror stays green. As of plan 29-01 the tree at HEAD is DELIBERATELY RED on two guards
// — guard_caveman_voice on all 17 blocks and guard_role_clause_uniqueness on 12 clause groups — and
// that RED is this plan's D-24 acceptance evidence, not a defect. A byte-faithful mirror of the real
// role files is therefore the FAILURE case, not the baseline, and every "the unplanted mirror is
// green" control would be measuring the tree's known drift instead of the plant.
//
// This is the same reasoning check-public-docs-vocabulary.test.ts already applies, and its words fit
// unchanged: "the real public documents are the very drift this guard measures, so a copied mirror
// would be the RED case, not the baseline." That harness synthesizes; this one repairs, because the
// other nine guards need the real adapters, the real grant closure and the real workflow set.
//
// THE REPAIR IS SCOPED TO THE TWO NEW GUARDS AND IS PROVEN TO SUCCEED, NOT ASSUMED. It rewrites each
// role file's caveman-fence INTERIOR to a conforming block and marks the second and later
// occurrences of any repeated clause, then RE-MEASURES with the guards' own predicates from
// voice-model.js and THROWS if a finding survives. A mirror builder that quietly stopped repairing
// would otherwise turn every control below into a test of the drift rather than of the plant.
//
// It reads the predicates from voice-model.js rather than restating them — the plants-read-from-the
// -authority rule this file already applies to the grant corpus.
// ---------------------------------------------------------------------------------------------

// A conforming caveman block: >= CAVEMAN_LEXICON_MIN lexicon terms, zero banned constructions, and
// every line under CLAUSE_MIN_WORDS once normalized so the block contributes no clause of its own.
// Asserted against the authority in the pin case below rather than trusted.
const CONFORMING_CAVEMAN_BLOCK = ["You grug.", "You smash rock.", "You no think."];

function repairCavemanBlock(text: string): string {
  const lines = text.split("\n");
  const heading = lines.findIndex((l) => /^## Caveman prompt/.test(l));
  if (heading < 0) return text;
  let open = -1;
  for (let i = heading + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      open = i;
      break;
    }
  }
  if (open < 0) return text;
  let close = -1;
  for (let i = open + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      close = i;
      break;
    }
  }
  if (close < 0) return text;
  return [
    ...lines.slice(0, open + 1),
    ...CONFORMING_CAVEMAN_BLOCK,
    ...lines.slice(close),
  ].join("\n");
}

// Append a marker INSIDE the clause that repeats, not at the end of its line: the repeated clause is
// routinely the FIRST sentence of a `## Hard limits` paragraph, so a line-end suffix would leave it
// byte-identical and the repair would silently do nothing. The line is re-split with CAPTURING
// separators so joining reconstructs it exactly apart from the inserted marker.
function markRepeatedClause(
  line: string,
  target: string,
  marker: string,
): { line: string; changed: boolean } {
  let changed = false;
  const out = line
    .split(/((?<=[.!?])\s+)/)
    .map((sentence, si) => {
      if (si % 2 === 1) return sentence;
      return sentence
        .split(/( — | – | ; | : )/)
        .map((frag, fi) => {
          if (fi % 2 === 1 || changed) return frag;
          if (normalizeSentence(frag) !== target) return frag;
          changed = true;
          return frag.replace(/([A-Za-z0-9])([^A-Za-z0-9]*)$/, `$1 ${marker}$2`);
        })
        .join("");
    })
    .join("");
  return { line: out, changed };
}

function dedupeClauses(text: string, rel: string): string {
  const lines = text.split("\n");
  let marked = 0;
  for (let pass = 0; pass < 8; pass++) {
    const groups = new Map<string, number[]>();
    for (const { clause, line } of segmentClauses(lines.join("\n"))) {
      const seen = groups.get(clause);
      if (seen) seen.push(line);
      else groups.set(clause, [line]);
    }
    const dups = [...groups.entries()].filter(([, v]) => v.length > 1);
    if (dups.length === 0) return lines.join("\n");
    for (const [clause, at] of dups) {
      for (const ln of at.slice(1)) {
        marked += 1;
        const r = markRepeatedClause(
          lines[ln - 1],
          clause,
          `mirror variant ${marked}`,
        );
        if (!r.changed) {
          throw new Error(
            `mirror repair: could not de-duplicate "${clause}" at ${rel}:${ln} — the fixture would silently become a test of the tree's drift`,
          );
        }
        lines[ln - 1] = r.line;
      }
    }
  }
  throw new Error(`mirror repair: de-duplication did not converge for ${rel}`);
}

function normalizeMirroredRole(text: string, rel: string): string {
  const repaired = dedupeClauses(repairCavemanBlock(text), rel);
  // RE-MEASURE with the guards' own predicates. A repair that stopped working must be LOUD.
  const verdict = readCavemanFence(repaired);
  if (!verdict.ok) {
    throw new Error(`mirror repair: ${rel} fence refused (${verdict.reason})`);
  }
  const banned = countBannedConstructions(verdict.inside);
  const bannedTotal =
    banned.article + banned.copula + banned.modal + banned.subordinator;
  if (countLexiconTokens(verdict.inside) < CAVEMAN_LEXICON_MIN || bannedTotal > 0) {
    throw new Error(
      `mirror repair: ${rel} caveman block still fails the two-sided predicate`,
    );
  }
  const groups = new Map<string, number>();
  for (const { clause } of segmentClauses(repaired)) {
    groups.set(clause, (groups.get(clause) ?? 0) + 1);
  }
  const survivor = [...groups.entries()].find(([, n]) => n > 1);
  if (survivor) {
    throw new Error(
      `mirror repair: ${rel} still repeats "${survivor[0]}" ${survivor[1]} times`,
    );
  }
  return repaired;
}

const MIRRORED_ROLE_PREFIX = "agent-factory/roles/";

// Build a temp mirror carrying copies of every guard input — byte-faithful for every input except
// the 17 role files, which are normalized as argued above. Returns the mirror dir.
function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-fg-"));
  tmpDirs.push(m);
  for (const rel of GUARD_INPUTS) {
    mkdirSync(join(m, dirname(rel)), { recursive: true });
    if (rel.startsWith(MIRRORED_ROLE_PREFIX)) {
      writeFileSync(
        join(m, rel),
        normalizeMirroredRole(readFileSync(join(ROOT, rel), "utf8"), rel),
        "utf8",
      );
      continue;
    }
    cpSync(join(ROOT, rel), join(m, rel));
  }
  return m;
}

// (Plan 29-01) Replace a mirrored role file's caveman-fence INTERIOR with the given lines, leaving
// the heading, both delimiters and every other line of the document untouched. One helper for every
// voice fixture, so a fixture differs from its siblings only in the bytes it plants.
function plantCavemanBlock(
  root: string,
  role: string,
  body: string[],
): string {
  const file = join(root, "agent-factory/roles", role);
  const lines = readFileSync(file, "utf8").split("\n");
  const heading = lines.findIndex((l) => /^## Caveman prompt/.test(l));
  let open = -1;
  for (let i = heading + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      open = i;
      break;
    }
  }
  let close = -1;
  for (let i = open + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      close = i;
      break;
    }
  }
  const next = [
    ...lines.slice(0, open + 1),
    ...body,
    ...lines.slice(close),
  ].join("\n");
  writeFileSync(file, next, "utf8");
  return next;
}

// The coordinator adapter's agent name, and the full role-agent namespace derived from the kit.
const COORDINATOR = "grugops-orchestrator";
const roleAgentNames = (): string[] =>
  listRoles().map((f) => `grugops-${f.replace(/\.md$/, "")}`);
const adapterPath = (root: string, name: string): string =>
  join(root, ".claude/agents", `${name}.md`);

// (Plan 27-14) The ANCHORED specialist memory sentence, verbatim. guard_adapter_body's positive half
// is no longer a fragment substring test — it counts occurrences of the FULL sentence forms the
// generator emits, exactly one per body. Every constructed fixture adapter below therefore carries
// this sentence verbatim; the former fixture wording ("Fixture adapter. The shared verified context
// is the only memory.") was a fragment and is exactly the shape the guard now refuses.
//
// This literal is a FIXTURE, not a scan set: if it ever drifts from the guard's own constant every
// case built on a constructed mirror goes red, so the duplication fails closed.
//
// (27-60 / WR-04) That fail-closed claim was TRUE for the specialist form — nine fixtures embed it,
// so drift reds them — and FALSE for the coordinator form, which was read by NOTHING. The
// test-inclusive typecheck target flagged it as an unused local, which is exactly what a duplicate
// with no consumer IS: a second copy of a wording contract that can drift in silence, this
// repository's diagnosed set-literal failure class. Deleting it would delete the mirror; the fix is
// to make the claim its own comment makes actually hold, in `memory-sentence fixtures mirror the
// guard's own constants` below, which asserts BOTH forms appear verbatim in the guard source.
const MEMORY_SENTENCE_SPECIALIST =
  "The shared verified context is the only memory — read what earlier roles published, publish your own, and expect nothing to have been passed to you by whoever activated you.";
const MEMORY_SENTENCE_COORDINATOR =
  "The shared verified context is the only memory — never relay data between agents.";

describe("memory-sentence fixtures mirror the guard's own constants (27-60 / WR-04)", () => {
  it("both fixture forms appear VERBATIM in scripts/check-foundation-guards.ts", () => {
    const guardSrc = readFileSync(join(ROOT, "scripts", "check-foundation-guards.ts"), "utf8");
    for (const [label, sentence] of [
      ["specialist", MEMORY_SENTENCE_SPECIALIST],
      ["coordinator", MEMORY_SENTENCE_COORDINATOR],
    ] as const) {
      expect(
        guardSrc.includes(sentence),
        `the ${label} memory sentence this harness mirrors is no longer present verbatim in ` +
          `scripts/check-foundation-guards.ts — the wording contract drifted on one side only. ` +
          `Re-cut the template, the generator and this fixture together. Fixture text: ${sentence}`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// THE D-64 CUTOVER PINS (plan 27-65) — the spawn verdict is rendered by the canonical admission
// reader, and `scripts/frontmatter.ts` is DEMOTED from safety authority to convenience reader.
//
// WHY THESE ARE SOURCE ASSERTIONS AND NOT BEHAVIOUR TESTS. The behaviour is covered by the gate
// sweep further down, which plants historical bypass shapes into live files and reads the refusal
// text out of the gate's own output. What a behaviour test CANNOT see is a verdict call site left
// pointing at the old reader on a path no planted document happens to traverse — T-27-153, "a live
// bypass wearing a fresh coat". That is a property of the SOURCE, so it is asserted over the source.
//
// EVERY SET BELOW IS DERIVED, NONE IS HAND-LISTED. This repository's second named systemic failure
// class is a hand-maintained set that rots while staying green; the original draft of this very
// assertion was scoped to `check-foundation-guards.ts` alone and would have passed green while
// `coordinator-resolution-precheck.ts` — a FOURTH verdict site the plan did not enumerate — kept
// rendering a spawn verdict through the module this round demotes. The scope amendment that added it
// is recorded in 27-65-SUMMARY.md under deviations.
// ---------------------------------------------------------------------------

// Non-test TypeScript under scripts/, read once. The enumeration is a directory read rather than a
// literal list, so a consumer that lands tomorrow is covered the day it lands.
const nonTestScripts = (): string[] =>
  readdirSync(join(ROOT, "scripts"))
    .filter((n) => n.endsWith(".ts") && !n.endsWith(".test.ts"))
    .sort();

// The symbols one module imports from another, with comments stripped so a NAME MENTIONED IN PROSE
// inside the import block cannot satisfy or falsify a membership test. Returns [] when the module
// does not import from that specifier at all.
const importedSymbols = (file: string, specifier: string): string[] => {
  const src = readFileSync(join(ROOT, "scripts", file), "utf8");
  const re = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*["']\\./${specifier}\\.js["']`,
    "g",
  );
  const out: string[] = [];
  for (const m of src.matchAll(re)) {
    const block = (m[1] as string)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((l) => l.replace(/\/\/.*$/, ""))
      .join("\n");
    for (const raw of block.split(",")) {
      const name = raw.replace(/^\s*type\s+/, "").trim();
      if (name !== "") out.push(name);
    }
  }
  return out.sort();
};

// The grant predicates and the grant-key constant: the four names whose RESULT is a spawn verdict.
// `parseFrontmatter` is deliberately NOT in this list — it is a transformation, and the two adapter
// generators legitimately keep using it to READ a document they then rewrite. What this list contains
// is the names that ANSWER "does this document grant the spawn tool, and to whom".
const GRANT_PREDICATES = [
  "keysHaveSpawnGrant",
  "keysGrantedAgentNames",
  "keyHasValue",
  "TOOLS_KEYS",
] as const;

describe("D-64 cutover: the spawn verdict is rendered by the canonical admission reader (27-65)", () => {
  it("the parser's non-test consumer list is NON-EMPTY and unchanged in size — a DEMOTION, never a deletion", () => {
    const consumers = nonTestScripts().filter(
      (n) => importedSymbols(n, "frontmatter").length > 0,
    );
    // NON-VACUITY FLOOR FIRST: an enumeration that found nothing cannot report "unchanged".
    expect(
      consumers.length,
      "zero non-test consumers of ./frontmatter.js — the derivation found nothing and no claim below means anything",
    ).toBeGreaterThan(0);

    // THE COUNT IS MEASURED, NOT TAKEN FROM THE PLAN'S PROSE.
    //
    // 27-65-PLAN.md's must_haves say the parser "keeps its eleven non-test consumers". Measured with
    //   git ls-files -z '*.ts' | xargs -0 grep -l 'from "./frontmatter.js"'
    // the pre-cutover answer was FIVE, not eleven: the other four files the plan counted
    // (`adapters-freshness.ts`, `canonical-corpus.ts`, `kit-model.ts`, `skill-twins-freshness.ts`)
    // only MENTION the module in prose comments and import nothing from it. Widening this derivation
    // until it reached eleven would be the set-literal drift this phase exists to delete, so the
    // measurement wins — exactly as 27-62 did when D-64's own eight-key, thirty-one-file premise was
    // falsified by measurement.
    //
    // AND THE CUTOVER MOVED IT FROM FIVE TO FOUR, WHICH IS RECORDED RATHER THAN ROUNDED AWAY.
    // `coordinator-resolution-precheck.ts` took NOTHING from the parser except verdict-bearing
    // symbols — `parseFrontmatter`, `keysGrantedAgentNames`, `keyHasValue` — so when those moved to
    // the canonical reader it stopped importing the module at all. That is a consumer genuinely lost,
    // not a demotion failure: the module is still consumed by four non-test modules including the
    // guard itself, so it is emphatically not dead code, and D-64 Part C's "keeps its consumers, is
    // not deleted" holds. Stating four while the plan says eleven is the honest reading of both.
    //
    // (Plan 29-01) AND IT MOVED FROM FOUR TO FIVE, WHICH IS A GAIN IN THE DEMOTION'S OWN DIRECTION.
    // `voice-model.ts` imports exactly ONE symbol — `FENCE_DELIMITER_LINE`, the delimiter CLASS — and
    // no verdict-bearing symbol at all, which the grant-predicate case immediately below asserts
    // tree-wide. That is precisely the shape D-64 Part C wanted the parser to keep: consumers that
    // take a declaration from it, not consumers that take a verdict from it.
    expect(consumers).toEqual([
      "canonical-frontmatter.ts",
      "check-foundation-guards.ts",
      "generate-role-adapters.ts",
      "generate-skill-twins.ts",
      "voice-model.ts",
    ]);
    expect(
      importedSymbols("voice-model.ts", "frontmatter"),
      "voice-model.ts must take the delimiter CLASS and nothing else — a second symbol is a step back toward a forked machine",
    ).toEqual(["FENCE_DELIMITER_LINE"]);
  });

  it("NO non-test module imports a GRANT PREDICATE from ./frontmatter.js — the parser renders no spawn verdict anywhere", () => {
    // Tree-wide and fully derived: there is no allow-list here and no file is exempted by name, so
    // the assertion cannot rot as the tree grows. After the cutover the correct answer is ZERO.
    const offenders: string[] = [];
    let scanned = 0;
    for (const f of nonTestScripts()) {
      const symbols = importedSymbols(f, "frontmatter");
      if (symbols.length === 0) continue;
      scanned += 1;
      for (const p of GRANT_PREDICATES) {
        if (symbols.includes(p)) offenders.push(`${f} imports ${p}`);
      }
    }
    // NON-VACUITY FLOOR: the loop really did inspect import blocks.
    expect(
      scanned,
      "the grant-predicate scan inspected zero import blocks — a negative over nothing proves nothing",
    ).toBeGreaterThan(0);
    expect(
      offenders,
      "a module still imports a grant predicate from the DEMOTED parser. D-64 Part C retires " +
        "scripts/frontmatter.ts as the safety authority for the spawn verdict; the module that " +
        "renders it is scripts/canonical-frontmatter.ts. Import the admission reader instead.",
    ).toEqual([]);
  });

  it("every module that renders a spawn verdict reads the CANONICAL module, and takes NO verdict-bearing symbol from the parser", () => {
    // The verdict-renderer set is DERIVED as "non-test modules importing ./canonical-frontmatter.js",
    // never hand-listed. That is what makes this assertion cover a fifth verdict site the day one
    // lands, and it is the specific correction that brought coordinator-resolution-precheck.ts into
    // this plan's scope.
    const cutover = nonTestScripts().filter(
      (n) =>
        n !== "canonical-frontmatter.ts" &&
        importedSymbols(n, "canonical-frontmatter").length > 0,
    );
    expect(
      cutover.length,
      "no module imports ./canonical-frontmatter.js — the cutover did not happen",
    ).toBeGreaterThan(0);
    expect(cutover).toEqual([
      "check-foundation-guards.ts",
      "coordinator-resolution-precheck.ts",
    ]);

    for (const f of cutover) {
      // `stripFencedBlocks` is the ONE fence authority and stays imported from the parser by design —
      // it is not a verdict, it is the shared definition of where a frontmatter region begins. Every
      // OTHER symbol taken from the parser by a verdict renderer is a finding.
      const fromParser = importedSymbols(f, "frontmatter").filter(
        (s) => s !== "stripFencedBlocks",
      );
      expect(
        fromParser,
        `${f} renders a spawn verdict and still takes ${fromParser.join(", ")} from ./frontmatter.js`,
      ).toEqual([]);
      // And it really does take the admission entry point, not merely some constant.
      expect(importedSymbols(f, "canonical-frontmatter")).toContain("admit");
    }
  });

  it("scripts/frontmatter.ts records its DEMOTION in its header, and its parsing logic is unchanged", () => {
    const src = readFileSync(join(ROOT, "scripts", "frontmatter.ts"), "utf8");
    // Bounded to the header: the note must be in the module's own header, where a reader arriving at
    // the file sees it, not buried beside some function.
    const header = src.slice(0, src.indexOf("\nimport "));
    expect(
      header.length,
      "the frontmatter.ts header slice is too small to be the header",
    ).toBeGreaterThan(2000);
    expect(header).toContain("DEMOTED");
    expect(header).toContain("scripts/canonical-frontmatter.ts");
    expect(header).toContain("D-64");
  });
});

// (Phase 27 / plan 27-07) BOTH KIT-03 fixtures are now CONSTRUCTED, and neither inherits its shape
// from the live tree.
//
// Plan 27-01 wrote the RED case against plain mirror(), on the belief that "a mirror carrying
// today's shape is referentially broken by construction" would stay true. It did not: mirror()
// derives DERIVED_AGENT_ADAPTER_INPUTS by reading the live .claude/agents, so the moment plan 27-07
// generated the seventeen adapters the RED fixture silently became a GREEN tree and the case stopped
// exercising the oracle at all. An oracle regression test whose fixture tracks the thing it is
// supposed to contradict is not a regression test. brokenMirror() therefore RE-CREATES the
// pre-27-07 shape explicitly — 17 roles, exactly one adapter, a coordinator grant naming the seven
// agents that resolved to nothing — so the RED evidence survives every future change to the live
// adapter directory.
//
// consistentMirror() builds the other side: one adapter per role with a full 16-name grant, so the
// cases that assert a fully green run have a green tree to assert against. It overwrites the
// mirrored real adapters with minimal fixture bodies rather than creating them, which keeps those
// cases independent of the generator's exact output bytes.

// The seven names the hand-written pre-27-07 coordinator grant carried, none of which resolved to an
// adapter file. Kept verbatim as the historical fixture — this list is deliberately NOT derived.
const HISTORICAL_GRANT_7 = [
  "grugops-software-engineer",
  "grugops-qe-e2e",
  "grugops-security-nfr",
  "grugops-architect-design",
  "grugops-system-analyst",
  "grugops-uat-planner",
  "grugops-release-manager",
];

// Re-point a mirrored adapter's `tools:` line at an explicit grant.
function repointGrant(file: string, granted: string[]): void {
  const rewritten = readFileSync(file, "utf8")
    .split("\n")
    .map((l) =>
      /^tools:/.test(l)
        ? `tools: Agent(${granted.join(", ")}), Read, Grep, Glob, Bash, Edit, Write`
        : l,
    )
    .join("\n");
  writeFileSync(file, rewritten);
}

// (Plan 27-19 / CR-02) Rewrite a mirrored adapter's single frontmatter `name:` line.
//
// Claude Code takes agent identity ONLY from that key, so this is the only way to build a fixture
// whose DECLARED identity disagrees with its FILENAME — the namespace split the review reproduced,
// and the shape no KIT-03 fixture could previously express. Modelled on reshapeToolsKey()'s
// find-then-splice, and it THROWS when the key is absent: a helper that silently no-ops leaves the
// case asserting against an unmodified tree, which is a fixture that pins nothing.
function renameAdapterIdentity(file: string, newName: string): void {
  const src = readFileSync(file, "utf8").split("\n");
  const at = src.findIndex((l) => /^name:/.test(l));
  if (at === -1) {
    throw new Error(`renameAdapterIdentity: ${file} has no \`name:\` line to rewrite`);
  }
  src.splice(at, 1, `name: ${newName}`);
  writeFileSync(file, src.join("\n"));
}

// The RED fixture: the structurally broken tree this milestone exists to close.
function brokenMirror(): string {
  const m = mirror();
  for (const name of roleAgentNames()) {
    if (name === COORDINATOR) continue;
    rmSync(adapterPath(m, name), { force: true });
  }
  repointGrant(adapterPath(m, COORDINATOR), HISTORICAL_GRANT_7);
  return m;
}

function consistentMirror(): string {
  const m = mirror();
  const names = roleAgentNames();
  const granted = names.filter((n) => n !== COORDINATOR);
  // One adapter file per role. Deliberately WITHOUT a `coordinator: true` marker and without a
  // spawn grant — exactly one coordinator may exist, and only it may hold the grant.
  //
  // (Phase 27 / plan 27-08) The fixture body carries the memory sentence, because guard_adapter_body
  // asserts every scanned body names the shared verified context as its memory. A fixture that
  // omitted it would be a genuinely defective adapter, and every "asserts ALL CHECKS PASSED" case
  // built on this mirror would fail for a reason having nothing to do with what it tests. Keep it.
  // (Plan 27-14) It now carries the ANCHORED FULL sentence, exactly once — the fragment no longer
  // satisfies the positive half.
  //
  // (Plan 27-19 / CR-02) `name:` is written EQUAL TO THE FILENAME STEM, and that match is now
  // ASSERTED by the oracle rather than merely assumed by this fixture — which is why the default is
  // kept: every existing case depends on this mirror running green. The INVERSE is expressed by the
  // three cases at the end of the KIT-03 block, which use renameAdapterIdentity() (and
  // plantPlainAdapter()'s `name` argument) to make the declared identity disagree with the filename.
  // Before that assertion existed, all eleven KIT-03 cases would have passed identically against a
  // comparison that ignored `name` entirely.
  //
  // (Plan 27-20 / WR-05) The `tools:` line is LOAD-BEARING, not decoration — the same note this
  // fixture already carries for the memory sentence. guard_wr05 now floors every agent adapter on
  // DECLARING a tool allow-list, because omitting the key makes the platform grant every
  // main-conversation tool including the spawn tool. An adapter without the line is therefore a
  // genuinely defective adapter, and every "asserts ALL CHECKS PASSED" case built on this mirror
  // would fail for a reason having nothing to do with what it tests. It is deliberately SPAWN-FREE:
  // only the coordinator may hold the grant, so the list names ordinary tools and no `Agent`.
  for (const name of granted) {
    writeFileSync(
      adapterPath(m, name),
      `---\nname: ${name}\ndescription: Hermetic mirror fixture adapter.\ntools: Read, Grep, Glob, Edit, Write, Bash\nmodel: inherit\n---\nFixture adapter. ${MEMORY_SENTENCE_SPECIALIST}\n`,
    );
  }
  // Re-point the coordinator's grant at the full 16-name set so the closure closes.
  repointGrant(adapterPath(m, COORDINATOR), granted);
  return m;
}

// Plant the reproduced CR-01 rogue adapter at a path RELATIVE to the mirror's `.claude/agents`.
// `rel` may carry directory segments — that is the whole point, and mkdirSync({recursive:true})
// needs no new machinery for it. The body is deliberately complete: a live `coordinator: true`
// marker, an enumerated spawn grant, the kit-vs-state invariant blockquote, and the shared-context
// memory sentence. Nothing about it is malformed; only its LOCATION was ever hiding it.
function plantNestedRogue(root: string, rel: string): string {
  const file = join(root, ".claude/agents", rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    [
      "---",
      "name: grugops-rogue",
      'description: "Rogue spawner planted in a subdirectory."',
      "coordinator: true",
      "tools: Agent(grugops-installer, grugops-security-nfr), Read, Grep, Glob, Edit, Write, Bash",
      "model: inherit",
      "---",
      "> **Kit vs state invariant:** `agent-factory/…` = read-only KIT. If the kit dir is absent, STOP — do not hunt.",
      "",
      `Rogue adapter with a live spawn grant. ${MEMORY_SENTENCE_SPECIALIST}`,
      "",
    ].join("\n"),
  );
  return file;
}

// Plant a PLAIN (non-coordinator, no spawn grant) adapter at a path relative to the mirror's
// `.claude/agents`. The oracle's coordinator-cardinality branch returns early, so a case that needs
// to reach the three-way set comparison must plant a file that is unremarkable in every way except
// its existence. Body carries the memory sentence so guard_adapter_body has nothing to say about it.
//
// (Plan 27-19 / CR-02) `name` is a SEPARATE ARGUMENT from `rel` and callers may now legally disagree
// them — that is what lets a fixture express a declared identity differing from its own filename
// stem, the shape the review found no fixture could produce. Existing callers pass a matching pair on
// purpose, because that match is what the oracle now ASSERTS; the fixture-expressed-mismatch case at
// the end of the KIT-03 block is the inverse and is what would fail if the assertion were deleted.
//
// (Plan 27-20 / WR-05) Like consistentMirror()'s fixture bodies, the `tools:` line here is
// LOAD-BEARING. guard_wr05 floors every agent adapter on DECLARING a tool allow-list — an absent key
// is a grant by inheritance of every main-conversation tool, the spawn tool included — so a planted
// adapter without one would fail for a reason having nothing to do with the case that planted it.
// Deliberately spawn-free: this helper's whole point is a file unremarkable in every way except its
// existence.
function plantPlainAdapter(root: string, rel: string, name: string): string {
  const file = join(root, ".claude/agents", rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `---\nname: ${name}\ndescription: Hermetic mirror fixture adapter.\ntools: Read, Grep, Glob, Edit, Write, Bash\nmodel: inherit\n---\nFixture adapter. ${MEMORY_SENTENCE_SPECIALIST}\n`,
  );
  return file;
}

// (Plan 27-12) Insert lines INTO a mirrored file's frontmatter block, immediately before its closing
// `---` delimiter.
//
// Why this helper now exists: the spawn grant and the coordinator marker are read from the
// FRONTMATTER BLOCK, not from anywhere in the body. That is a deliberate narrowing recorded in the
// guard's design comment — the old array expression matched a dashed line anywhere in the file, so a
// body bullet merely NAMING the spawn tool would have failed the guard, which is a false positive
// that forces a later author to delete correct documentation to go green. The three cases below used
// to append their plant to the END of a scan file and so pinned that old body-anywhere behavior;
// they now plant a REAL frontmatter grant, which is both the shape the platform actually acts on and
// a strictly stronger fixture.
function plantInFrontmatter(file: string, lines: string[]): void {
  const src = readFileSync(file, "utf8").split("\n");
  const close = src.indexOf("---", 1);
  if (src[0] !== "---" || close === -1) {
    throw new Error(`plantInFrontmatter: ${file} has no frontmatter block to plant into`);
  }
  src.splice(close, 0, ...lines);
  writeFileSync(file, src.join("\n"));
}

// Rewrite a mirrored file's frontmatter `tools:` / `allowed-tools:` key into an arbitrary YAML shape.
// The replacement lines REPLACE the single key line, so the surrounding frontmatter stays valid and
// the only thing that changed is the SCALAR FORM the value is expressed in. This is what the folded-
// scalar bypass cases need: the semantic value is a real grant either way, and the question is
// whether the guard reads the value or the bytes of one line.
function reshapeToolsKey(file: string, shape: string[]): void {
  const src = readFileSync(file, "utf8").split("\n");
  const at = src.findIndex((l) => /^(tools|allowed-tools):/.test(l));
  if (at === -1) throw new Error(`reshapeToolsKey: ${file} has no tools key`);
  src.splice(at, 1, ...shape);
  writeFileSync(file, src.join("\n"));
}

// ---------------------------------------------------------------------------
// (27-65 / D-64 Part A) THE REFUSAL ASSERTION, and the narrowing it exists to make visible.
//
// READ THIS BEFORE CONCLUDING A CASE BELOW WAS WEAKENED. Many cases in this file were written when
// the spawn verdict came from scripts/frontmatter.ts, an INTERPRETING reader whose job was to see
// THROUGH a folded scalar, a wrapped quoted scalar or a trailing comment to the value underneath.
// Their plants are therefore written in those spellings, and they asserted the specific arm that
// convicted the resulting value — "rogue spawner", "declares the `tools` key 3 times".
//
// After the cutover the verdict comes from a CANONICAL-FORM reader. It does not see through those
// spellings; it REFUSES them by name, before the grant question is asked. So the gate still goes red
// on every one of those plants — the bypass-closure property each case was written to prove is
// intact, and is now stronger, because the document is refused whether or not it carries a grant.
// What changed is the DIAGNOSIS, and the cases say so.
//
// THE NARROWING, STATED AS A MEASUREMENT RATHER THAN IMPLIED. Of the seven legitimate YAML spellings
// of ONE declaration that `SINGLE_DECLARATION_SPELLINGS` below walks, the canonical form admits TWO —
// the one-line plain scalar and the block sequence. The other five (wrapped plain, wrapped quoted,
// trailing `#` comment, folded `>-`, literal `|-`) are now REFUSED inside the spawn-grant scan. The
// live kit uses only the two admitted spellings, so the measured false-red cost today is ZERO across
// all 33 scanned files — but the LATITUDE is genuinely gone, and a future author who writes a folded
// `tools:` will be refused. That is D-64's intent (a canonical form is a narrowing, or it is not
// canonical), it is recorded in 27-65-SUMMARY.md, and it must not be discovered by surprise here.
//
// WHAT WAS LOST AND IS NOT PRETENDED OTHERWISE: the duplicate-key arm used to report an EXACT COUNT
// ("3 times"). Admission refuses at the SECOND occurrence, so the count is no longer computed. Both
// spellings go red; the newer one is diagnostically weaker by exactly that one number.
// ---------------------------------------------------------------------------

// Assert the gate REFUSED a named file under a named canonical-form refusal code, and that no
// passing WR-05 line was printed. The refusal TEXT is read out of the gate's own output — an exit
// code alone is not the claim this phase accepts.
function expectRefused(o: string, file: string, code: string): void {
  expect(o, `expected the refusal to name ${file}`).toContain(file);
  expect(o, `expected the refusal code [${code}]`).toContain(`[${code}]`);
  expect(o, "expected the canonical-form refusal wording").toContain(
    "frontmatter is NOT in the canonical form",
  );
  expect(
    o,
    "a refusal must NEVER be reported as carrying no grant",
  ).toMatch(/NEVER read as "carries no grant"/);
  expect(o, "no passing WR-05 line may accompany a refusal").not.toContain(
    "PASS  WR-05:",
  );
}

// (Plan 27-26 / WR-01) Replace the allow-list key line AND the block-sequence items that belong to
// it. reshapeToolsKey() above splices out exactly ONE line, which is right for the scalar-form cases
// it was written for — but the shipped SKILL adapters express `allowed-tools` as a block SEQUENCE,
// so replacing only the key line would leave its `  - Read` items dangling under whatever shape was
// spliced in. A cardinality fixture must control the whole declaration or it is not counting what it
// claims to count. THROWS when the key is absent, for the same reason renameAdapterIdentity() does:
// a helper that silently no-ops leaves the case asserting against an unmodified tree.
function reshapeToolsBlock(file: string, shape: string[]): void {
  const src = readFileSync(file, "utf8").split("\n");
  const at = src.findIndex((l) => /^(tools|allowed-tools):/.test(l));
  if (at === -1) throw new Error(`reshapeToolsBlock: ${file} has no tools key`);
  let end = at + 1;
  while (end < src.length && /^\s+- /.test(src[end])) end++;
  src.splice(at, end - at, ...shape);
  writeFileSync(file, src.join("\n"));
}

// (Plan 27-30 / IN-01) Remove a mirrored SKILL adapter's allow-list declaration ENTIRELY — the
// `allowed-tools:` key line and every block-sequence item belonging to it.
//
// This is the fixture the agent-adapter SCOPING GATE needs and never had. guard_wr05's absence and
// emptiness arms are gated behind `isAgentAdapter`, and all seven committed skills declare an
// allow-list today, so deleting that gate would change nothing on the live tree — the scoping
// decision plan 27-26 called load-bearing was decided by a branch no case exercised. Producing the
// input the gate is scoped AGAINST is the only way to tell a scoped rule apart from an absent one.
//
// It DELEGATES to reshapeToolsBlock() with an empty shape rather than re-implementing the find-and-
// splice. That helper already owns "which lines are this declaration" — the key line plus its
// dangling `  - item` continuations, the distinction reshapeToolsKey() cannot make — and a second
// copy of that walk is precisely the duplicate-set shape this phase exists to delete. It therefore
// also inherits the THROW when the key is absent, for the reason reshapeToolsBlock() and
// renameAdapterIdentity() both record: a helper that silently no-ops leaves the case asserting
// against an unmodified tree, which is a fixture that pins nothing.
//
// (Plan 27-34) IT NOW PLANTS ON BOTH DISTRIBUTION FORMS, and that is not incidental. The new
// guard_distribution_pair asserts the plugin form and its standalone twin are byte-identical modulo
// the `name` value, so removing the declaration from ONE side is a real divergence and reds that guard
// — correctly, but for a reason having nothing to do with the scoping gate this fixture exists to
// exercise. Planting on both sides keeps the input to guard_wr05 exactly what it was (a skill with no
// allow-list, on both surfaces the guard scans) while leaving the pair intact, so the case's
// `ALL CHECKS PASSED` assertion stays honest rather than being weakened to accommodate a real finding.
// It returns the STANDALONE path, which is what the case's fixture guard reads.
function plantSkillWithoutToolsKey(root: string, skill: string): string {
  const file = join(root, ".claude/skills", skill, "SKILL.md");
  reshapeToolsBlock(file, []);
  // The plugin-form twin of `grugops-<n>` is `skills/<n>`; `grugops` itself is its own twin.
  const twin = skill === "grugops" ? "grugops" : skill.replace(/^grugops-/, "");
  reshapeToolsBlock(join(root, "skills", twin, "SKILL.md"), []);
  return file;
}

// Run the compiled guard with CHECK_ROOT pointed at the mirror; capture status + combined output.
function runIn(checkRoot: string): SpawnSyncReturns<string> {
  return spawnSync("node", [GUARD_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
}

// The combined stdout+stderr of a guard run (findings print to stdout).
function out(r: SpawnSyncReturns<string>): string {
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

// (Plan 27-37, D-46) THE SCRATCH-BUILD HARNESS — how a FLOOR is proven to fire.
//
// Several claims this plan makes are about the guard's own derivation rather than about the tree it
// reads: the schema's two-sided cardinality, and the three buckets partitioning it. Neither can be
// broken by planting a file, so neither can be exercised through mirror() alone — and a case that
// asserts two numbers agree proves the numbers agree, not that anything fails when they do not.
//
// So the case builds a SCRATCH copy of the compiled scripts (the flat `.js` import graph the guard
// actually runs), applies one textual mutation to the scratch `kit-model.js`, and runs the scratch
// guard against a normal hermetic mirror. NOTHING in the repository is mutated: the mutation lives in
// a temp directory that afterAll removes.
//
// The mutation is asserted to have APPLIED before the guard runs. A `replace` that silently matched
// nothing would leave an unmutated build passing, and the case would report a green floor it never
// exercised — which is the fabricated-completion shape this whole phase exists to delete.
function scratchGuard(mutate: (kitModelJs: string) => string): string {
  return scratchGuardFiles({ "kit-model.js": mutate });
}

// (Plan 27-42, D-50) The same harness, generalized to mutate ANY of the compiled files in the scratch
// import graph — and more than one of them in a single build.
//
// Why the generalization was needed: the IN-03 faithfulness control mutates the GUARD (it replaces the
// call to the extracted partition predicate with an inline restatement of the same predicate) and, for
// its non-vacuous half, mutates KIT-MODEL in the same build (so the partition actually fires). One
// scratch build must therefore carry both mutations.
//
// Every mutation is still asserted to have APPLIED. A `replace` that silently matched nothing would
// leave an unmutated build passing and the case would report a control it never exercised.
function scratchGuardFiles(
  mutations: Record<string, (src: string) => string>,
): string {
  const dir = mkdtempSync(join(tmpdir(), "grugops-fg-scratch-"));
  tmpDirs.push(dir);
  const scriptsDir = join(dir, "scripts");
  mkdirSync(scriptsDir, { recursive: true });
  for (const name of readdirSync(join(ROOT, "scripts"))) {
    if (!name.endsWith(".js")) continue;
    cpSync(join(ROOT, "scripts", name), join(scriptsDir, name));
  }
  for (const [name, mutate] of Object.entries(mutations)) {
    const path = join(scriptsDir, name);
    const before = readFileSync(path, "utf8");
    const after = mutate(before);
    if (after === before) {
      throw new Error(
        `scratchGuard: the mutation of ${name} matched nothing, so the scratch build is identical ` +
          "to the committed one — a floor 'proven' against an unmutated build is proven against nothing",
      );
    }
    writeFileSync(path, after);
  }
  return join(scriptsDir, "check-foundation-guards.js");
}

// Run a scratch guard against a hermetic mirror of the real inputs.
function runScratch(
  guardJs: string,
  checkRoot: string,
): SpawnSyncReturns<string> {
  return spawnSync("node", [guardJs], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

describe("check-foundation-guards.js (SDLC-02 / SC2 fail-proof harness)", () => {
  // ── guard_wr05 (Phase 23 INVERTED, both-direction, marker-keyed) ─────────────────────────────
  // After the WR-05 flip the guard enforces BOTH directions over the explicit SCAN set:
  //   • the coordinator (coordinator: true marker) MUST carry the spawn grant;
  //   • every non-coordinator SCAN file MUST NOT.
  // The grant shapes (comma list + YAML array, both alias tokens) are still caught on a
  // non-coordinator; the orchestrator legitimately carries a grant now, so the rogue-grant plant
  // moves to a NON-coordinator SCAN file.

  // RED fixture (a): planted grant on a NON-coordinator SCAN file → rogue spawner. Plant onto a
  // packaging template (no coordinator: true marker) so the non-coordinator direction fires.
  //
  // (Plan 27-12) The plant moved from the END of the file INTO the frontmatter block. The old
  // placement pinned a behavior that has been deliberately narrowed: the grant is a frontmatter fact
  // about the `tools` / `allowed-tools` key, and a `tools:`-shaped line in the body is prose. The
  // narrowing removes a false positive (a body bullet naming the spawn tool used to fail the guard);
  // the fixture is strictly stronger for it, because a frontmatter grant is the shape the platform
  // actually acts on.
  it("guard_wr05 planted grant on non-coordinator (comma-form) → nonzero + 'rogue spawner' names the file", () => {
    const m = mirror();
    plantInFrontmatter(
      join(m, "agent-factory/packaging/slash-command.template.md"),
      ["tools: Read, Agent"],
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("slash-command.template.md");
  });

  it("guard_wr05 planted grant on non-coordinator (array-item) → nonzero + 'rogue spawner'", () => {
    const m = mirror();
    plantInFrontmatter(join(m, ".claude/skills/grugops/SKILL.md"), ["  - Agent"]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("SKILL.md");
  });

  it("guard_wr05 planted grant on non-coordinator (quoted array-item) → nonzero + REFUSED `quoted-on-plain-only-key` (WR-02, re-sited by 27-65)", () => {
    const m = mirror();
    plantInFrontmatter(join(m, ".claude/skills/grugops/SKILL.md"), ['  - "Agent"']);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    // A QUOTED value on a grant key is refused before the grant test runs — the double-quoted escape
    // alphabet is permanently outside the path that renders a spawn verdict, which is what keeps the
    // whole D-30 attack family off this path. The plant is still convicted; it is convicted earlier.
    expectRefused(out(r), "SKILL.md", "quoted-on-plain-only-key");
  });

  // THE ROGUE-SPAWNER ARM ITSELF, PLANTED IN CANONICAL FORM — added by 27-65 because without it the
  // arm would have lost its last live plant.
  //
  // Every pre-existing rogue-spawner fixture in this file expresses its grant in a spelling the
  // canonical form now refuses, so after the cutover each of them convicts at the refusal instead of
  // at the arm. That is correct behaviour, and it would ALSO have left `non-coordinator carries a
  // spawn grant` with no case that reaches it — an arm turned green by the disappearance of its own
  // fixtures, which is precisely the silent coverage loss this repository has already paid for.
  //
  // This plant is a plain one-line scalar: the canonical form ADMITS it, so the document reaches the
  // grant test and is convicted by the arm, by name.
  it("guard_wr05 CANONICAL-FORM grant on a non-coordinator → ADMITTED, then convicted as 'rogue spawner' (27-65 arm-reachability)", () => {
    const m = mirror();
    reshapeToolsBlock(adapterPath(m, "grugops-qe-e2e"), [
      "tools: Read, Grep, Glob, Agent(grugops-software-engineer)",
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toMatch(/rogue spawner/i);
    expect(o).toContain(".claude/agents/grugops-qe-e2e.md");
    // NON-VACUITY: it was convicted by the ARM, not by a refusal. If this document were refused the
    // case would prove nothing about the arm, and the whole point of adding it would be lost.
    expect(
      o,
      "the canonical plant must be ADMITTED and convicted by the arm, never refused",
    ).not.toContain("frontmatter is NOT in the canonical form");
  });

  // ── The CR-02 FOLDED-SCALAR bypass, reproduced and now closed (plan 27-12, SPAWN-04). ─────────
  //
  // `WR05_COMMA` required the key and the spawn token on ONE physical line; `WR05_ARRAY` required a
  // leading dash. A YAML folded scalar has neither: the key line carries only the fold indicator and
  // the value arrives on an indented continuation line. It is valid YAML and it produces exactly the
  // comma-string value the platform expects — so the platform granted the spawn tool while the guard
  // printed ALL CHECKS PASSED. Reproduced twice on hermetic mirrors (27-REVIEW § CR-02), and the two
  // shapes below are those reproductions verbatim.
  //
  // The skill case is the worse of the two: a skill adapter has no role to compare against, so KIT-03
  // is structurally blind to it and the skill count only checks cardinality. Nothing else in the
  // suite could have caught it.
  it("guard_wr05 folded grant on a non-coordinator ROLE ADAPTER → nonzero + REFUSED `block-scalar` (CR-02, reproduced; re-sited by 27-65)", () => {
    const m = mirror();
    reshapeToolsKey(adapterPath(m, "grugops-qe-e2e"), [
      "tools: >-",
      "  Read, Grep, Glob, Edit, Write, Bash, Agent(grugops-installer, grugops-security-nfr)",
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    // CR-02's original bytes, unchanged. The old reader had to SEE THROUGH the fold to convict; the
    // canonical form refuses the fold itself, so the conviction no longer depends on a recogniser
    // getting the indentation right — which is the exact mechanism that regressed in round 11.
    expectRefused(out(r), ".claude/agents/grugops-qe-e2e.md", "block-scalar");
  });

  it("guard_wr05 folded grant on a SKILL file → nonzero + REFUSED `block-scalar` (CR-02, reproduced — no role corpus can cross-check a skill)", () => {
    const m = mirror();
    reshapeToolsKey(join(m, ".claude/skills/grugops/SKILL.md"), [
      "allowed-tools: >-",
      "  Read, Grep, Glob, Agent(grugops-software-engineer)",
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expectRefused(
      out(r),
      ".claude/skills/grugops/SKILL.md",
      "block-scalar",
    );
  });

  // ── The CR-01 ANCHOR/ALIAS bypass, reproduced and now closed (plan 27-18, SPAWN-04). ──────────
  //
  // The parser closed the folded-scalar bypass above and then claimed, in its own header, that a YAML
  // anchor or alias "lands in the parse-failure arm". It did not: `KEY_LINE` matches `_tools: &t …`
  // and `allowed-tools: *t` perfectly well, so the parse SUCCEEDED and the flattened value of the
  // tools key was the literal string `*t` — no spawn token, and therefore the clean no-grant verdict
  // the module exists to make impossible. Reproduced end-to-end on a hermetic mirror with the plant on
  // a SKILL adapter and the whole gate printed ALL CHECKS PASSED (27-REVIEW-GAPS § CR-01).
  //
  // The skill surface is again the worst case, and deliberately the one planted: `adapters-freshness`
  // covers `.claude/agents` only, `SKILL_ADAPTER_COUNT` checks cardinality only, and KIT-03 has no
  // role to compare a skill against. Nothing else in the suite could have caught it.
  //
  // The paired green run on the SAME unplanted mirror is what makes the plant provably load-bearing:
  // without it a red run could be blamed on the mirror rather than on the two planted lines.
  it("guard_wr05 ANCHOR/ALIAS grant on a SKILL file → nonzero + parse failure names the file (CR-01, reproduced)", () => {
    const clean = mirror();
    const before = runIn(clean);
    expect(before.status).toBe(0);
    expect(out(before)).toContain("ALL CHECKS PASSED");

    const m = mirror();
    reshapeToolsKey(join(m, ".claude/skills/grugops/SKILL.md"), [
      "_tools: &t Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)",
      "allowed-tools: *t",
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expectRefused(o, ".claude/skills/grugops/SKILL.md", "node-property");
    expect(o).toMatch(/which opens a YAML anchor/);
    // And the load-bearing half at the AGGREGATOR level: the refusal must not have been quietly
    // folded into the no-grant branch, which would print a passing WR-05 line over an unread file.
    expect(o).toMatch(/NEVER read as "carries no grant"/);
    expect(o).not.toContain("PASS  WR-05:");
  });

  // ── The CR-01 TAG-PREFIXED bypass, reproduced and now closed (plan 27-24, round 2). ───────────
  //
  // The case above closed the bare anchor/alias. The refusal it installed tested for a SIGIL at
  // position 0 of a node — and a YAML TAG is a node PROPERTY that legally stands in front of one. So
  // `!!str &t …` does not begin with a sigil (the anchor is behind the tag) and `!!seq [*t]` does not
  // begin with `[` (the collection is behind the tag), and both slid past the refusal into the
  // flattened-string arm: `allowed-tools` flattened to the literal `!!seq [*t]`, no spawn token, and
  // the parser returned `{ ok: true, value: false }` — the silent no-grant arm, restored by adding two
  // characters. Reproduced end-to-end on a hermetic mirror with the plant on a SKILL adapter and the
  // whole gate printed ALL CHECKS PASSED, exit 0 (27-REVIEW-GAPS-2 § CR-01).
  //
  // Sibling of the case above by construction, and planted on the SAME surface for the same reason:
  // `adapters-freshness` covers `.claude/agents` only, `SKILL_ADAPTER_COUNT` checks cardinality only,
  // and KIT-03 has no role to compare a skill against — so the aggregator is the ONLY thing standing
  // between a crafted SKILL.md and a rogue grant. The paired green run on the same unplanted mirror
  // comes first, so a red run cannot be blamed on the mirror rather than on the two planted lines.
  it("guard_wr05 TAG-PREFIXED anchor/alias grant on a SKILL file → nonzero + parse failure names the file (CR-01 round 2, reproduced)", () => {
    const clean = mirror();
    const before = runIn(clean);
    expect(before.status).toBe(0);
    expect(out(before)).toContain("ALL CHECKS PASSED");

    const m = mirror();
    reshapeToolsKey(join(m, ".claude/skills/grugops/SKILL.md"), [
      "_tools: !!str &t Read, Write, Bash, Glob, Grep, Agent(grugops-software-engineer)",
      "allowed-tools: !!seq [*t]",
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // The TAG sigil is reached first here — `!!str` opens a YAML tag before the anchor that follows
    // it. Same enumerated code, and the reason names the construct that was actually seen rather
    // than the one the case is nicknamed after.
    expectRefused(o, ".claude/skills/grugops/SKILL.md", "node-property");
    expect(o).toMatch(/which opens a YAML tag/);
    // The load-bearing half, identical to the sibling: the refusal must not have been folded into the
    // no-grant branch, which would print a passing WR-05 line over a file the guard never read.
    expect(o).toMatch(/NEVER read as "carries no grant"/);
    expect(o).not.toContain("PASS  WR-05:");
  });

  // ── The CR-01 ESCAPED bypass, reproduced and now closed (plan 27-29, round 3, D-30). ──────────
  //
  // Third sibling, third axis. Rounds 1 and 2 widened the refusal across YAML NODE PROPERTIES while
  // the parser's own string rewriter stayed wrong somewhere else entirely: `unquote()` resolved a
  // double-quoted scalar by deleting every backslash, which is correct for `\"` and `\\` by accident
  // and destroys every numeric escape YAML 1.2 § 5.7 defines. So a block-sequence item spelled
  // `"\x41gent(grugops-orchestrator)"` — ONE backslash, a value a compliant loader resolves to
  // `Agent(grugops-orchestrator)` — flattened to `x41gent(grugops-orchestrator)`, carried no spawn
  // token, and returned `{ ok: true, value: false }`. Planted on this exact surface in a hermetic
  // mirror the whole gate printed ALL CHECKS PASSED at exit 0 (27-REVIEW-GAPS-3 § CR-01).
  //
  // The fix is STRUCTURAL, not another refusal pattern (D-30): the module now resolves exactly three
  // allowlisted escapes and refuses every other backslash sequence by name, so the next unenumerated
  // spelling refuses BY DEFAULT rather than becoming round five. `scripts/frontmatter.test.ts` proves
  // that default exhaustively over the printable-ASCII escape alphabet; THIS case proves the whole
  // gate acts on it.
  //
  // Same surface as its two siblings and for the same reason: `adapters-freshness` covers
  // `.claude/agents` only, `SKILL_ADAPTER_COUNT` checks cardinality only, and KIT-03 has no role to
  // compare a skill against — the aggregator is the only thing between a crafted SKILL.md and a rogue
  // grant. The paired green run on the same unplanted mirror comes first, so a red run cannot be
  // blamed on the mirror. The escaped item is built from a CHAR CODE, never a source-literal
  // backslash, so neither this file's own escaping nor a future reformat can silently double it.
  it("guard_wr05 ESCAPED grant item on a SKILL file → nonzero + parse failure names the file (CR-01 round 3, reproduced)", () => {
    const clean = mirror();
    const before = runIn(clean);
    expect(before.status).toBe(0);
    expect(out(before)).toContain("ALL CHECKS PASSED");

    const BACKSLASH = String.fromCharCode(92);
    const escapedItem = `  - "${BACKSLASH}x41gent(grugops-orchestrator)"`;
    // The plant carries EXACTLY ONE backslash byte. Asserted, not assumed — the review's reproduction
    // instruction was to verify the bytes with `od -c` precisely because a doubled backslash is a
    // different (and allowlisted) document that proves nothing.
    expect(escapedItem.split(BACKSLASH).length - 1).toBe(1);

    const m = mirror();
    reshapeToolsBlock(join(m, ".claude/skills/grugops/SKILL.md"), [
      "allowed-tools:",
      "  - Read",
      "  - Write",
      "  - Bash",
      "  - Glob",
      "  - Grep",
      escapedItem,
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (27-65) THE WHOLE D-30 ESCAPE FAMILY IS NOW REFUSED WITHOUT THE ESCAPE ALPHABET BEING CONSULTED
    // AT ALL, and that is a structural result rather than a re-worded one. The old reader had to
    // resolve `\x41` and then decide whether the resolved bytes were a grant, which is why it needed
    // an escape allowlist and why round 3 found this shape. The canonical form refuses a DOUBLE-QUOTED
    // value on a grant key outright — `tools` and `allowed-tools` admit plain scalars only — so the
    // escape is never resolved, the allowlist is never reached, and every 8-, 16- and 32-bit escape
    // width, the truncated escape and the dangling backslash all land here identically. 27-63 measured
    // exactly this over the historical corpus: every escape-axis row refuses as
    // `quoted-on-plain-only-key`, not as `disallowed-escape`.
    expectRefused(
      o,
      ".claude/skills/grugops/SKILL.md",
      "quoted-on-plain-only-key",
    );
    expect(o).toMatch(/admit plain scalars only/);
    // The load-bearing half, identical to both siblings: the refusal must not have been folded into
    // the no-grant branch, which would print a passing WR-05 line over a file the guard never read.
    expect(o).toMatch(/NEVER read as "carries no grant"/);
    expect(o).not.toContain("PASS  WR-05:");
  });

  // The third form the product oracle in frontmatter.test.ts also covers, pinned here at the
  // AGGREGATOR level: a block sequence whose spawn item is quoted. The old array expression happened
  // to catch a quoted item; this case exists so that deleting it cannot silently lose the coverage.
  it("guard_wr05 grant as a QUOTED BLOCK SEQUENCE item → nonzero + REFUSED `quoted-on-plain-only-key` (re-sited by 27-65)", () => {
    const m = mirror();
    reshapeToolsKey(adapterPath(m, "grugops-installer"), [
      "tools:",
      "  - Read",
      "  - Grep",
      '  - "Agent(grugops-qe-e2e)"',
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expectRefused(
      out(r),
      ".claude/agents/grugops-installer.md",
      "quoted-on-plain-only-key",
    );
  });

  // The OTHER direction of the same key scoping, so the narrowing is pinned in both directions: a
  // spawn token in a `description:` value — including one expressed as a folded scalar, the very form
  // that closed the bypass above — is NOT a grant. Widening the test to the whole frontmatter would
  // make this case fail, and a guard that fails on correct documentation teaches authors to delete
  // documentation.
  // (27-65) RE-EXPRESSED IN CANONICAL FORM, AND THE REASON MATTERS MORE THAN THE EDIT.
  //
  // This case's PROPERTY is key scoping: a spawn token inside a `description:` value is documentation,
  // not a grant, and a guard that reds on it teaches authors to delete correct documentation. That
  // property is unchanged and still worth pinning.
  //
  // Its old FIXTURE expressed the description as a folded scalar (`>-`), which the canonical form now
  // refuses — so as written it had become a case asserting a green run over a document the gate
  // correctly reds. It is re-expressed as the DOUBLE-QUOTED form, which is what every one of the 17
  // live agent adapters actually uses and which the canonical form admits on `description` precisely
  // because the corpus measured 17 of them.
  //
  // THE NARROWING IS NOT HIDDEN BY THE RE-EXPRESSION: the sibling case directly below pins that the
  // folded spelling is now REFUSED by name, so both halves of the truth are asserted rather than one
  // being quietly replaced by the other.
  it("guard_wr05 grant WORDING inside a double-quoted description value is NOT a grant → guard PASSES (key scoping)", () => {
    const m = consistentMirror();
    const file = adapterPath(m, "grugops-factory-coach");
    writeFileSync(
      file,
      readFileSync(file, "utf8").replace(
        /^description: .*$/m,
        'description: "Coaches the factory. Never uses Agent(grugops-qe-e2e) — this sentence merely names the spawn tool and is documentation, not a grant."',
      ),
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // The other half of the truth: the FOLDED description this case used to plant is now refused. Not a
  // bypass and not a regression — a documented narrowing, pinned so it cannot be discovered by
  // accident, and stated in 27-65-SUMMARY.md as a cost of the canonical form rather than a free win.
  it("guard_wr05 a FOLDED description is now REFUSED `block-scalar` — the narrowing, pinned (27-65)", () => {
    const m = consistentMirror();
    const file = adapterPath(m, "grugops-factory-coach");
    writeFileSync(
      file,
      readFileSync(file, "utf8").replace(
        /^description: .*$/m,
        "description: >-\n  Coaches the factory. Never uses Agent(grugops-qe-e2e) — this sentence merely\n  names the spawn tool and is documentation, not a grant.",
      ),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expectRefused(
      out(r),
      ".claude/agents/grugops-factory-coach.md",
      "block-scalar",
    );
  });

  // A parse that cannot complete is a PARSE ARTIFACT, never a verdict. Strip the coordinator
  // adapter's closing `---` so its frontmatter block opens and never closes, and assert the guard
  // names the file with a parse-failure finding AND does not print a passing spawn-grant line. The
  // failure arm must never collapse into "carries no grant".
  it("guard_wr05 UNTERMINATED frontmatter block on the coordinator → nonzero + parse-failure names the file, no passing WR-05 line", () => {
    const m = mirror();
    const file = adapterPath(m, COORDINATOR);
    const src = readFileSync(file, "utf8").split("\n");
    src.splice(src.indexOf("---", 1), 1); // remove the CLOSING delimiter only
    writeFileSync(file, src.join("\n"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expectRefused(
      o,
      ".claude/agents/grugops-orchestrator.md",
      "no-closing-delimiter",
    );
    expect(o).toMatch(/is never closed by a `---` line/);
  });

  // The name-key floor the parser makes possible: a file in the agent-adapter set with no `name` key
  // is not a loadable agent, and is also not a file this guard can honestly report on.
  //
  // (Plan 27-20 / WR-05) The fixture DECLARES a `tools` line so it fails for exactly ONE reason. Once
  // the sibling tools-key floor landed, a fixture missing both keys would go red either way — and a
  // case that stays red after the assertion it names is deleted has stopped pinning that assertion.
  // The added line makes this case STRICTLY more precise, and the final assertion states so.
  it("guard_wr05 agent adapter with NO name key → nonzero + the missing-name floor names the file", () => {
    const m = consistentMirror();
    const file = adapterPath(m, "grugops-uat-planner");
    writeFileSync(
      file,
      `---\ndescription: Fixture adapter with no name key.\ntools: Read, Grep, Glob, Edit, Write, Bash\nmodel: inherit\n---\nFixture adapter. ${MEMORY_SENTENCE_SPECIALIST}\n`,
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/carries no `name` key in its frontmatter/);
    expect(out(r)).toContain(".claude/agents/grugops-uat-planner.md");
    // The name floor is the ONLY reason this tree is red — the tools floor has nothing to say.
    expect(out(r)).not.toMatch(/declares no `tools` key/);
  });

  // (Plan 27-20 / 27-REVIEW § WR-05) The tools-key floor: the same argument as the name floor above.
  // An agent adapter that declares NO tool allow-list is not "carrying no grant" — the platform hands
  // it every main-conversation tool, `Agent` included, so an absent key is a grant BY INHERITANCE.
  // keysHaveSpawnGrant() returns false for a missing key, so before this floor the rogue-grant
  // direction read a maximal grant as compliant and the PASS line asserted something it never checked.
  it("guard_wr05 agent adapter with NO tools key → nonzero + names the file and the grant-by-inheritance consequence (WR-05, reproduced)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    const before = readFileSync(file, "utf8");
    // Guard the fixture: without this, a shipped adapter that stopped carrying the line would turn
    // this case into a no-op deletion asserting against an unmodified tree.
    expect(before).toMatch(/^tools:/m);
    writeFileSync(
      file,
      before
        .split("\n")
        .filter((l) => !/^tools:/.test(l))
        .join("\n"),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toMatch(/declares no `tools` key/);
    expect(o).toContain("an absent key is a grant by inheritance");
    expect(o).toContain(".claude/agents/grugops-qe-e2e.md");
    expect(o).not.toContain("PASS  WR-05:");
  });

  // (Plan 27-20 self-review, probe F) The EMPTINESS arm, the same split plan 27-19 made on the `name`
  // key. `tools:` with no value parses to a PRESENT key carrying "", so a bare key-presence test
  // passed it — the WR-05 bypass reachable by deleting a VALUE instead of a LINE. Asserted as its OWN
  // wording and explicitly NOT the absent-key arm, so neither can drift into the other.
  it("guard_wr05 agent adapter with a tools key present but EMPTY → nonzero + its OWN finding, not the absent-key one (WR-05 self-review)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    const before = readFileSync(file, "utf8");
    expect(before).toMatch(/^tools: .+$/m);
    writeFileSync(file, before.replace(/^tools: .*$/m, "tools:"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (27-65) The emptiness arm's PROPERTY — an empty declaration is its own fact and never the
    // absent-key one — survives the cutover intact, and is now enforced one level earlier: the
    // canonical form has no null value, so `tools:` with nothing beneath it is refused by name
    // instead of being admitted as a present key carrying "".
    expectRefused(o, ".claude/agents/grugops-qe-e2e.md", "dangling-empty-key");
    expect(o).toMatch(/written with an empty value/);
    // The load-bearing half is unchanged: this must NOT be reported as the absent-key finding. Two
    // different facts, two different remedies, and conflating them is what this case exists to stop.
    expect(o).not.toMatch(/declares no `tools` key/);
  });

  // (Plan 27-30 / 27-REVIEW-GAPS-3 § IN-01) THE SCOPING CONTROL for the two arms directly above.
  //
  // Both of those arms are gated behind `isAgentAdapter`, and plan 27-26 recorded that scoping as a
  // deliberate, load-bearing decision when it widened the loop from AGENT_ADAPTERS to
  // SPAWN_GRANT_SCAN: a skill with no `allowed-tools` is not a defective sub-agent identity, it is
  // not a sub-agent at all, so floors written about agent identity must not fire on it.
  //
  // WHY THE DECISION NEEDED A CASE. All seven committed skills declare an allow-list today, so
  // `declaredToolsValues` is non-empty for every skill on the live tree — deleting the gate outright
  // would change NOTHING that the suite or the live run could see. Whether a future skill omitting
  // the key reds the gate was therefore decided by an untested branch, and a scoped rule with no
  // exercised non-firing side is indistinguishable from a rule that simply never fires. This case
  // produces the one input the gate is scoped against and asserts the tree stays GREEN.
  //
  // THE PAIRED DIRECTION IS NOT DUPLICATED HERE. That the SAME omission on an AGENT adapter reds the
  // guard and names the file is already asserted, unchanged, by "guard_wr05 agent adapter with NO
  // tools key → nonzero + names the file and the grant-by-inheritance consequence (WR-05,
  // reproduced)" immediately above. A second copy of that assertion is the duplicate-set shape this
  // phase exists to delete; the two cases together are what prove the gate SCOPED rather than
  // DISABLED. The clean-mirror green run comes first so a green result cannot be blamed on the plant
  // never having been applied — plantSkillWithoutToolsKey() throws rather than no-op if it were.
  it("guard_wr05 SKILL with its allow-list declaration REMOVED → still GREEN: the agent-adapter scoping gate, exercised (IN-01)", () => {
    const m = mirror();
    const before = runIn(m);
    expect(before.status).toBe(0);
    expect(out(before)).toContain("ALL CHECKS PASSED");

    const file = plantSkillWithoutToolsKey(m, "grugops-map");
    // Fixture guard: the declaration is really gone, so the assertion below is about the gate and
    // not about a plant that quietly did nothing.
    expect(readFileSync(file, "utf8")).not.toMatch(/^allowed-tools:/m);

    const r = runIn(m);
    const o = out(r);
    expect(r.status).toBe(0);
    expect(o).toContain("ALL CHECKS PASSED");
    // Asserted on the FINDING TEXT and not merely on the exit code: a green run for some unrelated
    // reason must not be able to stand in for the gate holding. NEITHER gated arm fired.
    expect(o).not.toMatch(/declares no `tools` key/);
    expect(o).not.toContain("`tools` key present with an EMPTY value");
    // And guard_wr05 genuinely RAN over this tree rather than being skipped — the PASS line is the
    // guard's own statement that it reached a verdict. Without this, "no finding" and "no check"
    // would print the same thing, which is the confusion this whole phase is about. Deliberately NOT
    // asserted on the skill's filename: it legitimately appears in other guards' PASS lines.
    expect(o).toContain("PASS  WR-05:");
  });

  // ── The WR-01 CARDINALITY arm: the rule the sibling `name` key already had (plan 27-26). ────────
  //
  // Plan 27-19 refused a `name` key carrying anything other than exactly one value — "which of the two
  // the platform's YAML loader honours is not this oracle's to guess". Plan 27-20 gave the ALLOW-LIST
  // answer an absence arm and an emptiness arm, thirty lines away in the same function, and no
  // cardinality arm. keysHaveSpawnGrant() is deliberately a disjunction over ALL occurrences: correct
  // and fail-safe in the rogue direction, fail-OPEN in the coordinator-must-hold-the-grant direction.
  // So a coordinator declaring `tools:` twice, where a last-wins loader drops the occurrence carrying
  // the grant, printed ALL CHECKS PASSED at exit 0 with the runtime grant silently gone
  // (27-REVIEW-GAPS-2 § WR-01, reproduced on a hermetic mirror).
  //
  // The paired green run on the SAME unplanted mirror comes first, so a red run cannot be blamed on
  // the mirror rather than on the one planted line.
  it("guard_wr05 DUPLICATE `tools` key on the coordinator → nonzero + names the file and the count (WR-01, reproduced)", () => {
    const clean = mirror();
    const before = runIn(clean);
    expect(before.status).toBe(0);
    expect(out(before)).toContain("ALL CHECKS PASSED");

    const m = mirror();
    const file = adapterPath(m, COORDINATOR);
    const src = readFileSync(file, "utf8").split("\n");
    const at = src.findIndex((l) => /^tools:/.test(l));
    expect(at).not.toBe(-1); // fixture guard: a no-op plant asserts nothing
    // The SECOND declaration carries no spawn token. Under a last-wins loader the coordinator holds
    // no grant at all; under a first-wins loader it holds the full one. The guard may prefer neither.
    src.splice(at + 1, 0, "tools: Read, Grep, Glob, Edit, Write, Bash");
    writeFileSync(file, src.join("\n"));

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (27-65) The document is now REFUSED for declaring one key twice, before either loader-preference
    // question is asked. The property this case exists for is unchanged and is arguably better served:
    // the guard still refuses to prefer an occurrence, and it now refuses the DOCUMENT rather than
    // reasoning about which occurrence a loader would honour.
    expectRefused(o, ".claude/agents/grugops-orchestrator.md", "duplicate-key");
    expect(o).toMatch(/appears more than once in this region/);
    // Still the case that no OTHER arm claims this document: the dropped-grant arm must stay silent,
    // or the refusal would be masking a second, wrong diagnosis.
    expect(o).not.toMatch(/carries no spawn grant/);
  });

  // The same shape on the SKILL spelling of the key, planted on a skill adapter — the surface with no
  // freshness gate, no role corpus to cross-check and only cardinality checked elsewhere. One arm
  // covers both spellings; this case is what proves the coverage is not agent-only.
  it("guard_wr05 DUPLICATE `allowed-tools` key on a SKILL file → nonzero + REFUSED `duplicate-key` (WR-01 skill spelling, narrowed by 27-65)", () => {
    const m = mirror();
    const file = join(m, ".claude/skills/grugops/SKILL.md");
    reshapeToolsBlock(file, [
      "allowed-tools: Read, Write, Bash, Glob, Grep",
      "allowed-tools: Read, Glob, Grep",
    ]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // The property this case exists for — one arm covers BOTH key spellings, so the coverage is not
    // agent-only — is preserved exactly. The skill surface is still the one with no freshness gate and
    // no role corpus to cross-check, and it is still convicted here, by name.
    expectRefused(o, ".claude/skills/grugops/SKILL.md", "duplicate-key");
  });

  // THE NON-FIRING SIDE, pinned as its own case. An arm with no proven non-firing side is a rule
  // nobody can tell apart from an unconditional red. Every committed adapter and skill declares its
  // allow-list key exactly ONCE, so the clean mirror must stay green AND must carry no cardinality
  // finding — asserted on the finding text, not merely on the exit code, so a green run for some
  // unrelated reason cannot stand in for the threshold holding at one.
  it("guard_wr05 the cardinality arm does NOT fire at ONE occurrence — the clean mirror is GREEN and prints no allow-list-count finding", () => {
    const m = mirror();
    const r = runIn(m);
    expect(r.status).toBe(0);
    const o = out(r);
    expect(o).toContain("ALL CHECKS PASSED");
    expect(o).not.toMatch(/allow-list key \d+ times/);
    expect(o).not.toMatch(/DIFFERENT allow-list keys/);
  });

  // THE EMPTINESS ARM IS NOT MASKED. The cardinality arm sits AFTER the absence/emptiness chain
  // rather than inside it, so two EMPTY declarations produce BOTH findings. Folding it in as another
  // `else if` would have let the new arm silence the arm it was added to join.
  it("guard_wr05 TWO EMPTY `tools` declarations → nonzero + REFUSED at the FIRST defect; the per-document both-findings property is narrowed (WR-01 interplay, 27-65)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-installer");
    const src = readFileSync(file, "utf8").split("\n");
    const at = src.findIndex((l) => /^tools:/.test(l));
    expect(at).not.toBe(-1);
    src.splice(at, 1, "tools:", "tools:");
    writeFileSync(file, src.join("\n"));

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (27-65) BOTH defects are still present in the document, but the canonical form refuses at the
    // FIRST one it meets — the dangling empty key on line one of the pair — and never reaches the
    // duplicate. The "report BOTH findings" property this case was written for is therefore NOT
    // preserved for this input, and that is recorded rather than asserted around: an admission reader
    // returns one refusal per document by construction, because a second refusal would require
    // continuing to interpret a document it has already declined to vouch for.
    //
    // The no-short-circuit property still holds where it can hold — ACROSS files, which is where it
    // actually matters for a gate that must report every offending file. The sibling case
    // "a duplicate key AND a separate finding are BOTH reported" pins exactly that.
    expectRefused(o, ".claude/agents/grugops-installer.md", "dangling-empty-key");
    expect(o).toMatch(/written with an empty value/);
  });

  // THE TWO-KEY-NAMES ADJACENCY, dispositioned deliberately rather than left unconsidered — an
  // unconsidered adjacency is how the absence and emptiness arms came to be written without the
  // cardinality one. DISPOSITION: REFUSED. The platform reads one spelling per surface (`tools` on a
  // sub-agent, `allowed-tools` on a skill or command) while keysHaveSpawnGrant() reads BOTH as one
  // answer, so a document carrying both hands one predicate two authorities. It is its OWN finding,
  // not the per-key cardinality one, because "one key twice" and "two different keys once each" are
  // different facts with different reasons.
  it("guard_wr05 an adapter declaring BOTH `tools` and `allowed-tools` → nonzero + the two-authorities finding, not the per-key count (WR-01 adjacency)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    const src = readFileSync(file, "utf8").split("\n");
    const at = src.findIndex((l) => /^tools:/.test(l));
    expect(at).not.toBe(-1);
    src.splice(at, 1, "tools: Read, Grep, Glob", "allowed-tools: Read, Grep, Glob");
    writeFileSync(file, src.join("\n"));

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(".claude/agents/grugops-qe-e2e.md");
    expect(o).toContain("declares 2 DIFFERENT allow-list keys");
    expect(o).toContain("`tools`, `allowed-tools`");
    // Each key appears ONCE, so the per-key cardinality arm must stay silent — the two findings are
    // not interchangeable and neither may stand in for the other.
    expect(o).not.toMatch(/allow-list key \d+ times/);
  });

  // ── The FALSE-RED control the cardinality arm needs to be trustworthy (plan 27-26, Task 2). ─────
  //
  // A cardinality arm that fired on a legitimately WRAPPED declaration would red the tree on correct
  // content — the failure mode the sibling `name` rule explicitly designed against, in the paragraph
  // that lists every spelling the parser JOINS into a single value. Asserting one spelling and calling
  // it coverage is how that design fails to carry across, so this walks ONE declaration through each
  // of them (the product convention scripts/frontmatter.test.ts uses for the refused forms) and
  // asserts the aggregator still exits 0 for every one.
  //
  // The block SEQUENCE is included beyond the sibling's five because it is the form the shipped SKILL
  // adapters actually use — the spelling a false red would cost the most on.
  //
  // (27-65) THE TABLE NOW CARRIES ITS OWN VERDICT COLUMN, AND THAT COLUMN IS THE NARROWING.
  //
  // All seven spellings below are legitimate YAML expressing ONE declaration, and the old
  // interpreting reader resolved every one of them to a single value — which is what made this a
  // false-red control. The canonical form ADMITS TWO of the seven and REFUSES FIVE. Rather than
  // deleting the five (which would erase the evidence that the latitude ever existed) or asserting
  // green over them (which is now false), each row states which side it is on and the case below
  // asserts BOTH sides in one walk. The two-sided count is asserted so a row cannot be silently
  // dropped from either bucket.
  //
  // MEASURED CONSEQUENCE ON THE LIVE KIT: zero. The 17 agent adapters use the one-line plain scalar
  // and the 7 skills use the block sequence — the two admitted spellings — so all 33 scanned files
  // admit. The cost is paid by future content, loudly and with a named reason, not silently.
  const SINGLE_DECLARATION_SPELLINGS: readonly {
    label: string;
    shape: string[];
    // The canonical-form verdict. `null` = ADMITTED; a string = the enumerated refusal code.
    refusedAs: string | null;
  }[] = [
    {
      label: "one-line plain scalar",
      shape: ["tools: Read, Grep, Glob"],
      refusedAs: null,
    },
    {
      label: "plain scalar WRAPPED across lines",
      shape: ["tools: Read, Grep,", "  Glob"],
      refusedAs: "unrecognized-line",
    },
    {
      label: "quoted scalar WRAPPED across lines",
      shape: ['tools: "Read, Grep,', '  Glob"'],
      refusedAs: "quoted-on-plain-only-key",
    },
    {
      label: "value carrying a trailing # comment",
      shape: ["tools: Read, Grep, Glob # no spawn tool here"],
      refusedAs: "plain-scalar-charset",
    },
    {
      label: "folded block scalar (>-)",
      shape: ["tools: >-", "  Read, Grep,", "  Glob"],
      refusedAs: "block-scalar",
    },
    {
      label: "literal block scalar (|-)",
      shape: ["tools: |-", "  Read, Grep, Glob"],
      refusedAs: "block-scalar",
    },
    {
      label: "block sequence (the shipped skill form)",
      shape: ["tools:", "  - Read", "  - Grep", "  - Glob"],
      refusedAs: null,
    },
  ];

  it("guard_wr05 the ADMITTED spellings of ONE declaration do not trip the arm, and the REFUSED ones fail by name (WR-01 false-red control, re-sited by 27-65)", () => {
    // Fixture guard: a control that walked zero spellings would pass vacuously.
    expect(SINGLE_DECLARATION_SPELLINGS.length).toBe(7);
    // TWO-SIDED COUNT, asserted before the walk. A row silently moved from one bucket to the other —
    // or dropped from the table — changes these numbers and fails by name rather than by absence.
    const admitted = SINGLE_DECLARATION_SPELLINGS.filter(
      (s) => s.refusedAs === null,
    );
    const refused = SINGLE_DECLARATION_SPELLINGS.filter(
      (s) => s.refusedAs !== null,
    );
    expect(admitted.length, "spellings the canonical form ADMITS").toBe(2);
    expect(refused.length, "spellings the canonical form REFUSES").toBe(5);
    expect(admitted.length + refused.length).toBe(
      SINGLE_DECLARATION_SPELLINGS.length,
    );

    for (const { label, shape, refusedAs } of SINGLE_DECLARATION_SPELLINGS) {
      const m = mirror();
      reshapeToolsBlock(adapterPath(m, "grugops-qe-e2e"), shape);
      const r = runIn(m);
      const o = out(r);
      if (refusedAs !== null) {
        // THE NARROWING HALF. A refusal is loud, named and carries its reason — the safe direction.
        expect(r.status, `${label}: expected the canonical form to REFUSE`).not.toBe(0);
        expectRefused(o, ".claude/agents/grugops-qe-e2e.md", refusedAs);
        continue;
      }
      // THE SURVIVING FALSE-RED CONTROL. The two spellings the live kit actually uses must still not
      // trip the cardinality or two-authorities arms, and must still exit 0.
      expect(o, `${label}: expected no cardinality finding`).not.toMatch(
        /allow-list key \d+ times/,
      );
      expect(o, `${label}: expected no two-authorities finding`).not.toMatch(
        /DIFFERENT allow-list keys/,
      );
      expect(r.status, `${label}: expected a green aggregator run`).toBe(0);
    }
    // (Plan 27-37) EXPLICIT TIMEOUT, recorded rather than left to the 5s default. This one case
    // builds SEVEN mirrors and spawns the compiled guard seven times — roughly 3s on an idle host and
    // demonstrably over 5s once this file's other spawn-heavy cases have churned the filesystem ahead
    // of it. It timed out for exactly that reason when plan 27-37 added its nine derived-corpus plant
    // cases, and a wall-clock flake in a control that asserts "no false red" is the worst possible
    // place to leave a coin flip: it reads as a real finding. Nothing about the assertion changed.
  }, 60_000);

  // THE COUNT IS AN EXACT INTEGER, not a loose "more than one". A message reporting a wrong number
  // would pass a `/\d+ times/` match and mislead whoever read it, so the assertion is on the integer
  // itself and on the absence of its neighbours. (KIT-03 precision edge: occurrence counts are
  // compared as integers with no tolerance band, and a mismatch is a failure rather than a warning.)
  // (27-65) WHAT THIS CASE LOST, STATED PLAINLY RATHER THAN QUIETLY DROPPED.
  //
  // It used to assert the guard reported an EXACT INTEGER — "3 times", and not 2 or 4 — because a
  // message carrying a wrong number would satisfy a loose `/\d+ times/` match and mislead its reader.
  // The canonical form refuses at the SECOND occurrence of a key and never counts to three, so that
  // integer is no longer computed anywhere and the precision property cannot be asserted.
  //
  // This is a real diagnostic loss and it is recorded as one in 27-65-SUMMARY.md. It is not a safety
  // loss: both the old and the new behaviour take the gate to a red exit naming the file, and the new
  // one refuses a duplicate of ANY key rather than only the two grant keys. A reader now learns "this
  // key appears more than once" instead of "this key appears three times".
  it("guard_wr05 THREE `tools` declarations → REFUSED `duplicate-key` naming the file (WR-01 precision, narrowed by 27-65)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-installer");
    const src = readFileSync(file, "utf8").split("\n");
    const at = src.findIndex((l) => /^tools:/.test(l));
    expect(at).not.toBe(-1);
    src.splice(
      at,
      1,
      "tools: Read, Grep, Glob",
      "tools: Read, Grep",
      "tools: Read",
    );
    writeFileSync(file, src.join("\n"));

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expectRefused(o, ".claude/agents/grugops-installer.md", "duplicate-key");
    expect(o).toMatch(/appears more than once in this region/);
    // The count is gone, so assert it is gone rather than leaving a reader to assume it is still
    // there. A stale assertion for "3 times" would have failed; a silently deleted one would have
    // left the loss invisible.
    expect(
      o,
      "the exact-occurrence count is no longer computed by the canonical form",
    ).not.toMatch(/allow-list key \d+ times/);
  });

  // A CHECK REPORTS WHAT IT CHECKED — the guards' established rule, asserted across the new arm. With
  // a plant carrying BOTH a duplicate allow-list key AND a separate pre-existing finding (a rogue
  // spawn grant on a different non-coordinator file), the run must report both rather than
  // short-circuiting at the first. Each is asserted independently, so neither can stand in for the
  // other.
  it("guard_wr05 a duplicate key AND a separate finding are BOTH reported — no short-circuit (WR-01 ordering)", () => {
    const m = mirror();

    const dup = adapterPath(m, "grugops-installer");
    const src = readFileSync(dup, "utf8").split("\n");
    const at = src.findIndex((l) => /^tools:/.test(l));
    expect(at).not.toBe(-1);
    src.splice(at + 1, 0, "tools: Read, Grep, Glob");
    writeFileSync(dup, src.join("\n"));

    reshapeToolsKey(adapterPath(m, "grugops-qe-e2e"), [
      "tools: Read, Grep, Glob, Agent(grugops-software-engineer)",
    ]);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (27-65) THE CROSS-FILE NO-SHORT-CIRCUIT PROPERTY, WHICH IS THE ONE THAT MATTERS FOR A GATE, IS
    // FULLY PRESERVED — and this case is now the place it is pinned. Two different files, two
    // different defects, both reported in one run: the duplicate key is REFUSED by name, and the
    // second file's canonical-form grant is convicted by the rogue-spawner ARM. Neither stands in for
    // the other, and the refusal loop deliberately `continue`s rather than returning so every
    // offending file is named.
    expectRefused(o, ".claude/agents/grugops-installer.md", "duplicate-key");
    expect(o).toMatch(/rogue spawner/i);
    expect(o).toContain(".claude/agents/grugops-qe-e2e.md");
  });

  // (Plan 27-20 self-review, probe E) An UNTERMINATED `<!--` used to strip nothing, so every beat
  // after it counted as live and the guard PASSED — while a reader of the rendered markdown sees an
  // HTML block swallowing the rest of the file. The guard would be claiming an announcement nobody
  // can read, which is CR-03 by another route. stripHtmlComments() now treats an unterminated comment
  // the way stripFencedBlocks() has always treated an unterminated fence: it extends to EOF and is
  // never emitted. One rule for both strippers, taken from this tree's own precedent.
  it("guard_wr05 tier announcement behind an UNTERMINATED HTML comment → nonzero + names the beats (CR-03 self-review)", () => {
    const m = mirror();
    const file = adapterPath(m, COORDINATOR);
    const before = readFileSync(file, "utf8");
    expect(before).toContain("**Announce your tier before scheduling.**");
    expect(before).not.toContain("<!-- UNTERMINATED");
    writeFileSync(
      file,
      before.replace(
        "**Announce your tier before scheduling.**",
        "<!-- UNTERMINATED\n**Announce your tier before scheduling.**",
      ),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    for (const label of [
      "Full tier label",
      "Reduced tier label",
      "Degraded tier label",
    ]) {
      expect(o).toContain(`missing the tier-announcement beat "${label}"`);
    }
    expect(o).not.toContain("carries all 6 tier-announcement beats");
  });

  // RED fixture (b): the coordinator with its spawn grant DROPPED → a half-flip that silently kills
  // CC parallelism. Rewrite the orchestrator adapter to keep coordinator: true but strip every grant.
  it("guard_wr05 coordinator grant DROPPED → nonzero + 'dropped grant kills Claude Code parallelism' names the file (D-16)", () => {
    const m = mirror();
    const file = join(m, ".claude/agents/grugops-orchestrator.md");
    const stripped = readFileSync(file, "utf8")
      .split("\n")
      // remove any line that carries the spawn grant (comma list OR array item), keep the marker.
      .filter(
        (l) =>
          !/^(tools|allowed-tools):.*\b(Agent|Task)\b/.test(l) &&
          !/^[ \t]*-[ \t]*["']?(Agent|Task)\b/.test(l),
      )
      .join("\n");
    writeFileSync(file, stripped);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/kills Claude Code parallelism/i);
    expect(out(r)).toContain("grugops-orchestrator.md");
  });

  // RED fixture (c): the coordinator: true MARKER removed → a rename/marker-loss must not silently
  // demote the coordinator. With the marker gone the orchestrator is a non-coordinator that still
  // holds a grant → the non-coordinator direction fires.
  it("guard_wr05 coordinator marker REMOVED (grant retained) → nonzero + 'rogue spawner' names the file (D-15)", () => {
    const m = mirror();
    const file = join(m, ".claude/agents/grugops-orchestrator.md");
    const demoted = readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => !/^coordinator:\s*true\b/.test(l))
      .join("\n");
    writeFileSync(file, demoted);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain("grugops-orchestrator.md");
  });

  // CR-01 fence-immunity: a SCAN file carrying ONLY a FENCED coordinator example (marker + grant
  // inside a ``` block) and NO live grant must be IGNORED — the guard PASSES. This is the real
  // subagent.frontmatter.md shape (a documentation example), which previously read as a second live
  // coordinator. Plant the fenced example into a non-adapter SCAN file (slash-command.template.md,
  // which has no live marker/grant) and assert the aggregator stays GREEN. (Phase 27: built on a
  // consistentMirror so the green run is pinned to a CONSTRUCTED fixture rather than to whatever the
  // live adapter directory happens to hold on the day.)
  //
  // (Plan 27-12) This case is now OVER-DETERMINED and is kept anyway: the example is ignored both
  // because it is fenced AND because it sits outside the frontmatter block. The fence authority's
  // remaining LOAD-BEARING contribution — a fenced `---` must not be read as the closing delimiter of
  // an unterminated real block — is pinned precisely in scripts/frontmatter.test.ts, where the shape
  // can be constructed rather than appended to a real file.
  it("guard_wr05 FENCED coordinator example (marker+grant inside ```) is ignored → guard PASSES (CR-01 fence-immunity)", () => {
    const m = consistentMirror();
    appendFileSync(
      join(m, "agent-factory/packaging/slash-command.template.md"),
      "\n## Example coordinator wrapper\n\n```markdown\n---\nname: grugops-orchestrator\ncoordinator: true\ntools: Agent(grugops-software-engineer, grugops-qe-e2e), Read\n---\n```\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // CR-01 cardinality: a SCAN file with a LIVE (non-fenced) second coordinator: true + grant must
  // FAIL the exactly-one-coordinator cardinality check (found 2). Plant a real frontmatter marker +
  // grant (NOT inside a fence) into slash-command.template.md; with the orchestrator adapter already
  // a coordinator, the count becomes 2. (Plan 27-12: planted INTO the frontmatter block rather than
  // appended to the body — same deliberate narrowing recorded above.)
  it("guard_wr05 LIVE second coordinator (non-fenced) → nonzero + 'found 2' cardinality fail (CR-01)", () => {
    const m = mirror();
    plantInFrontmatter(
      join(m, "agent-factory/packaging/slash-command.template.md"),
      ["coordinator: true", "tools: Agent(grugops-software-engineer), Read"],
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/exactly one coordinator/i);
    expect(out(r)).toContain("found 2");
    expect(out(r)).toContain("slash-command.template.md");
  });

  // ── The CR-01 NESTED-ADAPTER bypass, reproduced and now closed (plan 27-10, KIT-02). ──────────
  //
  // Claude Code discovers `.claude/agents/` RECURSIVELY and takes agent identity ONLY from
  // frontmatter, so `.claude/agents/extra/rogue.md` IS LOADED BY THE PLATFORM. Every derivation in
  // this file used to read that directory NON-recursively, so the planted file was simultaneously
  // outside guard_wr05's scan set, guard_adapter_body's, guard_adapter_size's and the KIT-03
  // oracle's — and the whole gate printed ALL CHECKS PASSED over a tree carrying a second live
  // coordinator with its own enumerated spawn grant.
  //
  // The plant below is the reproduction transcript's file byte-for-byte in substance, and
  // deliberately MAXIMALLY STEALTHY: it carries the invariant blockquote (which is what let the
  // original reproduction slip past the kit-reference gate) and the shared-context memory sentence
  // (so guard_adapter_body has nothing to say about it). The ONLY thing left to catch it is the
  // derivation seeing it at all.
  it("guard_wr05 nested adapter planted under .claude/agents → nonzero + 'found 2' coordinators naming the nested path (CR-01)", () => {
    const m = consistentMirror();
    plantNestedRogue(m, "extra/rogue.md");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/exactly one coordinator/i);
    expect(out(r)).toContain("found 2");
    // The planted RELATIVE path, forward-slash separated, appears in the guard output — the
    // derivation saw it, and the guard says so.
    expect(out(r)).toContain(".claude/agents/extra/rogue.md");
  });

  // The flatness policy (plan 27-10, KIT-02). The derivation SEES a nested adapter — that is what
  // closes the bypass above — and guard_adapter_size then REFUSES it by name, because a nested agent
  // adapter is not a supported grugops artifact: the generator emits flat names, the freshness gate
  // compares flat names and the installer materializes them flat. Seeing it and tolerating it would
  // be a policy of silence.
  it("guard_adapter_size nested adapter → nonzero + 'flat adapter directory' finding names the nested path", () => {
    const m = consistentMirror();
    plantNestedRogue(m, "extra/rogue.md");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/contractually FLAT/);
    expect(out(r)).toContain("1 nested agent adapter(s)");
    expect(out(r)).toContain(".claude/agents/extra/rogue.md");
  });

  // Two levels down, and with a basename that collides with a real top-level adapter. Neither the
  // depth nor the name collision may fold it into an existing member.
  it("guard_adapter_size deeply nested adapter reusing a real basename → 'flat adapter directory' still names it", () => {
    const m = consistentMirror();
    plantNestedRogue(m, "a/b/grugops-orchestrator.md");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/contractually FLAT/);
    expect(out(r)).toContain(".claude/agents/a/b/grugops-orchestrator.md");
  });

  // The other direction of the same fixture: with the plant REMOVED the identical mirror is green.
  // Without this, the case above would still pass if the mirror were broken for some unrelated
  // reason, and the RED evidence would be worthless.
  it("guard_wr05 nested adapter removed → the same mirror is GREEN (the plant is what turns it red)", () => {
    const m = consistentMirror();
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // ── guard_wr05 tier-announcement presence (Phase 27 / plan 27-08, the REVISED D-05). ──────────
  //
  // The original D-05 asserted degrade-path presence; under the revised D-02 that would guard for
  // text which must no longer be the contract. The assertion is now tier-announcement presence: all
  // three tier labels, the reduced-path enforcement disclosure, and the capability-sensing sentence
  // that selects between them. One case per beat, because a coordinator that silently drops ONE tier
  // overstates its enforcement — and "claims an enforcement it lacks" is the failure a user cannot
  // detect by reading the announcement.
  //
  // Each case removes the mirrored coordinator's line carrying the beat and asserts the guard names
  // that beat by label. Removing one beat's line never disturbs another's, so each case fails for
  // exactly the reason it is named for.
  const beatCases: readonly { label: string; line: string }[] = [
    { label: "Full tier label", line: "- **Full** —" },
    { label: "Reduced tier label", line: "- **Reduced** —" },
    { label: "Degraded tier label", line: "- **Degraded** —" },
    {
      label: "reduced-path enforcement disclosure",
      line: "runtime-enforced here",
    },
    { label: "capability-sensing selection signal", line: "capability-sensing" },
  ];
  for (const beat of beatCases) {
    it(`guard_wr05 coordinator body missing the ${beat.label} → nonzero + names the beat (revised D-05)`, () => {
      const m = mirror();
      const file = adapterPath(m, COORDINATOR);
      writeFileSync(
        file,
        readFileSync(file, "utf8")
          .split("\n")
          .filter((l) => !l.includes(beat.line))
          .join("\n"),
      );
      const r = runIn(m);
      expect(r.status).not.toBe(0);
      const o = out(r);
      expect(o).toContain(
        `missing the tier-announcement beat "${beat.label}"`,
      );
      expect(o).toContain("grugops-orchestrator.md");
    });
  }

  // ── The SIXTH beat: the reduced-tier COMMAND NAME (plan 27-15, 27-REVIEW § WR-03). ────────────
  //
  // The five cases above are REMOVAL cases; this beat needs REPLACEMENT cases, because the failure it
  // exists to catch is not a dropped line but a line naming the WRONG command. Two directions, both
  // required:
  //   • the STALE value (`/grug`) — the exact string that shipped in plan 27-09 and survived a guard
  //     whose PASS line already claimed one vocabulary across the surfaces;
  //   • an ARBITRARY other value — without this, the beat could be satisfied by any needle that
  //     merely excludes the stale token, and it would go green on the next wrong name instead of on
  //     the right one. The beat must be pinned TO the shipped command, not AGAINST one typo.
  //
  // No other guard in the tree sees this: guardVoice()'s neutralizePhrases() rewrites `/grug` to
  // `BRANDCMD` before it inspects anything, so the token is invisible there by construction.
  const wrongCommandCases: readonly { what: string; replacement: string }[] = [
    { what: "the stale `/grug`", replacement: "`/grug`" },
    { what: "an arbitrary other command", replacement: "`/factory`" },
  ];
  for (const wrong of wrongCommandCases) {
    it(`guard_wr05 coordinator body names ${wrong.what} instead of the shipped command name → nonzero + names the beat`, () => {
      const m = mirror();
      const file = adapterPath(m, COORDINATOR);
      const before = readFileSync(file, "utf8");
      // Guard the fixture itself: if the shipped body ever stops carrying the token, this case would
      // silently become a no-op plant that fails for an unrelated reason.
      expect(before).toContain("`/grugops`");
      writeFileSync(
        file,
        before.replace(/`\/grugops`/g, wrong.replacement),
      );
      const r = runIn(m);
      expect(r.status).not.toBe(0);
      const o = out(r);
      expect(o).toContain(
        'missing the tier-announcement beat "reduced-tier command name"',
      );
      expect(o).toContain("grugops-orchestrator.md");
      expect(o).toContain("names a command the kit does not ship");
    });
  }

  // ── CR-03: the tier-beat check is satisfiable by a comment (plan 27-20, 27-REVIEW § CR-03). ────
  //
  // The eight cases above all DELETE or REPLACE the beat's bytes. None of them could catch the
  // failure the review reproduced, where every byte survives and none of it is live text: the check
  // was a bare `.includes()` over a body that was fence-stripped but never comment-stripped, so
  // wrapping the WHOLE tier announcement in `<!-- -->` printed
  // `carries all 6 tier-announcement beats` with zero of the six visible to the agent that loads the
  // file — a false claim about a capability-and-safety announcement (T-27-34).
  //
  // Every beat label is asserted, not just one: the failure is that the ENTIRE announcement went
  // dark, and a case naming a single beat would still pass if the fix only reached that one.
  it("guard_wr05 the WHOLE tier announcement wrapped in an HTML comment → nonzero + names all 6 beats (CR-03, reproduced)", () => {
    const m = mirror();
    const file = adapterPath(m, COORDINATOR);
    const before = readFileSync(file, "utf8");
    // Guard the fixture the way the wrongCommandCases do. If the shipped body ever stops carrying
    // these markers this case would silently become a no-op plant asserting against an unmodified
    // tree — a fixture that pins nothing.
    expect(before).toContain("**Announce your tier before scheduling.**");
    expect(before).toContain("- **Full** —");
    expect(before).toContain("- **Degraded** —");
    const lines = before.split("\n");
    const start = lines.findIndex((l) =>
      l.includes("**Announce your tier before scheduling.**"),
    );
    const last = lines.reduce(
      (acc, l, i) => (l.includes("and announce it.") ? i : acc),
      -1,
    );
    expect(start).toBeGreaterThan(-1);
    expect(last).toBeGreaterThan(start);
    writeFileSync(
      file,
      [
        ...lines.slice(0, start),
        "<!--",
        ...lines.slice(start, last + 1),
        "-->",
        ...lines.slice(last + 1),
      ].join("\n"),
    );
    // Nothing but the wrap changed: every byte of the announcement is still in the file.
    const after = readFileSync(file, "utf8");
    expect(after).toContain("**Announce your tier before scheduling.**");
    expect(after).toContain("- **Full** —");

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    for (const label of [
      "Full tier label",
      "Reduced tier label",
      "Degraded tier label",
      "reduced-path enforcement disclosure",
      "capability-sensing selection signal",
      "reduced-tier command name",
    ]) {
      expect(o).toContain(`missing the tier-announcement beat "${label}"`);
    }
    expect(o).toContain("grugops-orchestrator.md");
    // And the guard never claims what it did not check.
    expect(o).not.toContain("carries all 6 tier-announcement beats");
  });

  // The other half of the same predicate: PRESENCE is not enough, the count is one. A body stating a
  // tier line twice is a body the generator does not produce, and a reader told the same tier twice
  // cannot tell which statement is current. This is the arm guard_adapter_body's positive half has
  // always had and the tier-beat check did not.
  it("guard_wr05 a tier beat stated TWICE in live text → nonzero + names the beat and the count (CR-03)", () => {
    const m = mirror();
    const file = adapterPath(m, COORDINATOR);
    const before = readFileSync(file, "utf8");
    const lines = before.split("\n");
    const at = lines.findIndex((l) => l.includes("- **Degraded** —"));
    expect(at).toBeGreaterThan(-1);
    // Duplicate the line carrying the beat, in LIVE text — no comment, no fence.
    lines.splice(at, 0, lines[at]);
    writeFileSync(file, lines.join("\n"));

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      'states the tier-announcement beat "Degraded tier label" 2 time(s)',
    );
    expect(o).toContain("exactly 1 occurrence is required");
    expect(o).toContain("grugops-orchestrator.md");
  });

  // SPAWN-04 across the FULL derived scan set. The pre-27-03 guard hand-listed four files, so a rogue
  // grant on any of the seventeen agent adapters or seven skills was unreachable. These two plant a
  // grant on a real non-coordinator ADAPTER — one per grant syntax — which is the surface SPAWN-04 is
  // actually about (the existing cases above plant onto packaging/skill surfaces).
  it("guard_wr05 spawn token planted on a non-coordinator adapter (comma form) → nonzero + rogue spawner", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    writeFileSync(
      file,
      readFileSync(file, "utf8").replace(
        /^tools: .*$/m,
        "tools: Agent(grugops-installer), Read, Grep, Glob, Edit, Write, Bash",
      ),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/rogue spawner/i);
    expect(out(r)).toContain(".claude/agents/grugops-qe-e2e.md");
  });

  it("guard_wr05 spawn token planted on a non-coordinator adapter (quoted list form) → nonzero + REFUSED `quoted-on-plain-only-key` (re-sited by 27-65)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-installer");
    writeFileSync(
      file,
      readFileSync(file, "utf8").replace(
        /^tools: .*$/m,
        'allowed-tools:\n  - Read\n  - "Agent"',
      ),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expectRefused(
      out(r),
      ".claude/agents/grugops-installer.md",
      "quoted-on-plain-only-key",
    );
  });

  // Fence-immunity for the cardinality count, planted on an ADAPTER this time (the existing case
  // plants onto a packaging template). A coordinator-shaped example inside a ``` block in an adapter
  // must not be counted as a second live coordinator — one fence authority, no second parser.
  it("guard_wr05 FENCED coordinator-shaped example in an adapter does not inflate the cardinality → guard PASSES", () => {
    const m = consistentMirror();
    appendFileSync(
      adapterPath(m, "grugops-factory-coach"),
      "\n## Example coordinator frontmatter\n\n```markdown\ncoordinator: true\ntools: Agent(grugops-qe-e2e), Read\n```\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).not.toContain("found 2");
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // The guard reports WHAT IT CHECKED. 23 = 17 agent adapters + 7 skills - the one coordinator.
  it("guard_wr05 PASS line reports the non-coordinator bodies checked (23) and the tier beats", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    const o = out(r);
    expect(o).toContain("23 non-coordinator adapter bodies");
    // 6 since plan 27-15 added the reduced-tier command-name beat (was 5).
    expect(o).toContain("all 6 tier-announcement beats");
  });

  // ── guard_adapter_body (Phase 27 / SPAWN-05, D-23) — BOTH directions, plus the two cases that
  // keep the guard honest about what it must NOT fail on. ──────────────────────────────────────
  //
  // The negative half depends on having enumerated the retired phrases; the positive half does not,
  // which is why it is the load-bearing one. Both are pinned here, and so are the two false-positive
  // shapes: the execution-topology prose this phase deliberately KEEPS, and a fenced documentation
  // example. A guard that failed on either would force a later editor to delete correct text to go
  // green.

  // NEGATIVE half. Plant the real historical line — split across a line break, exactly as an author
  // would hard-wrap it — and assert the guard names both the file and the phrase.
  it("guard_adapter_body planted retired relay vocabulary → nonzero + names the file and the phrase", () => {
    const m = mirror();
    appendFileSync(
      adapterPath(m, COORDINATOR),
      "\nDrain the queue via the role-switch protocol — one window, drop prior context, the handoff\nis the only memory — demand a handoff packet from each.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("SPAWN-05 adapter-body violation");
    expect(o).toContain("grugops-orchestrator.md");
    expect(o).toContain('retired memory-relay vocabulary "handoff packet"');
    // The wrapped clause is caught too — the phrase is checked over normalized whitespace, so a
    // hard wrap in the middle of it is not an evasion.
    expect(o).toContain(
      'retired memory-relay vocabulary "the handoff is the only memory"',
    );
  });

  // POSITIVE half — the half that does not depend on having guessed every retired phrase. Remove the
  // memory sentence from one mirrored adapter body and assert the guard names that file AND the
  // count it found. (Plan 27-14: the count is asserted, not just the absence — the guard now tests
  // the NUMBER of occurrences, so a case that only asserted "names the file" would pass equally on a
  // guard that had silently gone back to testing existence.)
  it("guard_adapter_body memory sentence REMOVED from a body → nonzero + names the file and reports 0 (stale by omission)", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    writeFileSync(
      file,
      readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => !l.includes("shared verified context is the only memory"))
        .join("\n"),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("grugops-qe-e2e.md");
    expect(o).toContain("never names the shared verified context as its memory");
    expect(o).toContain("0 occurrence(s) of a generated memory sentence");
  });

  // (Plan 27-14) EXACTLY ONCE, the upper direction. A body carrying the sentence twice is not a body
  // the generator produces — it has been hand-edited — and the guard must say so with the count. The
  // former existence test was blind to this entirely.
  it("guard_adapter_body memory sentence DUPLICATED in a body → nonzero + names the file and reports 2", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    appendFileSync(file, `\n${MEMORY_SENTENCE_SPECIALIST}\n`);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("grugops-qe-e2e.md");
    expect(o).toContain("states a generated memory sentence 2 time(s)");
  });

  // (Plan 27-14) THE CASE THE FRAGMENT NEEDLE PASSED. Replace the live sentence with a commented-out
  // copy: the bytes are still in the file, so a bare substring test is satisfied, but nothing the
  // agent reads says it. A comment about the rule must never stand in for the rule.
  it("guard_adapter_body memory sentence present ONLY inside an HTML comment → nonzero + names the file and reports 0", () => {
    const m = mirror();
    const file = adapterPath(m, "grugops-qe-e2e");
    writeFileSync(
      file,
      readFileSync(file, "utf8")
        .split("\n")
        .map((l) =>
          l.includes("shared verified context is the only memory")
            ? `<!-- ${l} -->`
            : l,
        )
        .join("\n"),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("grugops-qe-e2e.md");
    expect(o).toContain("0 occurrence(s) of a generated memory sentence");
  });

  // (Plan 27-14) THE TEMPLATE HALF, first direction. The template's two adapter body shapes are the
  // text the generator copies, and they are deliberately FENCED — which is why the template is read
  // RAW. Delete the specialist shape's sentence and the guard must name the SHAPE and the count.
  it("guard_adapter_body memory sentence deleted from a template body shape → nonzero + names the shape", () => {
    const m = mirror();
    const file = join(m, "agent-factory/packaging/subagent.frontmatter.md");
    writeFileSync(
      file,
      readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => !l.includes(MEMORY_SENTENCE_SPECIALIST))
        .join("\n"),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("subagent.frontmatter.md");
    expect(o).toContain("the specialist body shape's memory sentence appears 0");
  });

  // (Plan 27-14) THE TEMPLATE HALF, the defect this plan closes. Before the split, the template was
  // read fence-stripped — which deleted both real body shapes from its input — so the ONLY thing
  // satisfying its positive half on the live tree was a documentation bullet in the same file that
  // merely described the sentence. Reconstruct exactly that state: take the sentence OUT of the
  // fenced body shape and restate it in live prose. The whole-file substring count is still 1, and
  // the guard must still fail red, because a bullet is not a body shape the generator copies.
  it("guard_adapter_body memory sentence in a template PROSE line alone does not satisfy the check → nonzero", () => {
    const m = mirror();
    const file = join(m, "agent-factory/packaging/subagent.frontmatter.md");
    writeFileSync(
      file,
      readFileSync(file, "utf8")
        .split("\n")
        .filter((l) => !l.includes(MEMORY_SENTENCE_SPECIALIST))
        .join("\n") +
        `\n- **The memory sentence** — ${MEMORY_SENTENCE_SPECIALIST}\n`,
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("subagent.frontmatter.md");
    expect(o).toContain(
      "the specialist body shape's memory sentence appears 1 time(s) OUTSIDE a fenced body shape",
    );
  });

  // The KEPT text. "one window, prior context dropped between roles" describes execution topology,
  // not memory: it is how roles activate on the four non-spawning CLIs, it is verbatim in the
  // packaging template, and it is the degraded tier's own wording under the revised D-02. The guard
  // must stay GREEN on it. If this case ever goes red, the fix is to shrink the retired list — never
  // to delete the prose.
  it("guard_adapter_body kept execution-topology prose (one window, prior context dropped) stays GREEN", () => {
    const m = consistentMirror();
    appendFileSync(
      adapterPath(m, COORDINATOR),
      "\nDrain the same queue at concurrency one — one window, prior context dropped between roles — and announce it.\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // Fence-immunity IN AN ADAPTER: a retired phrase inside a ``` block in an adapter body is
  // DOCUMENTATION — quoting the dead vocabulary in order to explain that it is dead must not trip the
  // ban. Shared stripFencedBlocks(), never a second parser.
  //
  // (Plan 27-14) This case used to plant into the packaging TEMPLATE. It now plants into an adapter,
  // because the template half deliberately reads RAW text: the template's fenced blocks are the body
  // shapes the generator copies, so a retired phrase inside one of them is the worst case there is,
  // not documentation. The case below pins that inversion; this one keeps the adapter-side
  // fence-immunity it always asserted.
  it("guard_adapter_body FENCED retired phrase in an ADAPTER body is ignored → guard PASSES", () => {
    const m = consistentMirror();
    appendFileSync(
      adapterPath(m, "grugops-qe-e2e"),
      "\n## Retired shape (documentation only)\n\n```markdown\n— one window, drop prior context, the handoff is the only memory — demand a handoff packet from each.\n```\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // (Plan 27-14) THE INVERSION, pinned. The same fenced plant in the packaging TEMPLATE must fail
  // red: a fenced block there is a body shape the generator copies into seventeen adapters on its
  // next run, so "it is only an example" is exactly wrong at that one location.
  it("guard_adapter_body FENCED retired phrase in the packaging TEMPLATE fails red (raw-text negative half)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/packaging/subagent.frontmatter.md"),
      "\n## Retired shape\n\n```markdown\n— one window, drop prior context, the handoff is the only memory — demand a handoff packet from each.\n```\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("subagent.frontmatter.md");
    expect(o).toContain('retired memory-relay vocabulary "handoff packet"');
    expect(o).toContain("in its raw text (fenced body shapes included)");
  });

  // SCAN-SET MEMBERSHIP, PINNED. D-25 puts the packaging template in the scan set because it is the
  // upstream source the generator is built from — a regression there is caught BEFORE it propagates
  // into seventeen generated adapters. Before this case and the scanned-count case below, NOTHING
  // in this file would have noticed the template being quietly dropped from ADAPTER_BODY_SCAN —
  // verified by scratch removal during plan 27-08, where every other case still passed and only
  // these two went red. They are what pins the membership.
  it("guard_adapter_body scans the packaging template — unfenced retired vocabulary upstream fails red (D-25)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/packaging/subagent.frontmatter.md"),
      "\nDemand a handoff packet from each role.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("subagent.frontmatter.md");
    expect(o).toContain('retired memory-relay vocabulary "handoff packet"');
  });

  // The guard reports WHAT IT CHECKED ON BOTH HALVES, so a run over a collapsed scan set is visible
  // as the anomaly it is rather than hiding behind the word PASS. (Plan 27-14: the two halves are
  // reported separately — 24 derived adapter bodies and 2 template body shapes — because a run that
  // checked the template alone is precisely the failure the old single total could not show.)
  it("guard_adapter_body reports both halves (24 adapter bodies = 17 agents + 7 skills, plus 2 template body shapes)", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    expect(out(r)).toContain(
      "SPAWN-05: 24 adapter bodies + 2 template body shapes checked",
    );
  });

  // ── THE VACUITY FLOOR THAT COULD NOT FIRE (plan 27-14, review finding WR-01). ─────────────────
  //
  // The floor used to test the TOTAL number of bodies scanned. That total always included the
  // packaging template — a named literal, always present — so the branch was unreachable, and a tree
  // with BOTH adapter directories emptied printed a PASS over the template alone. Verified
  // first-hand on a mirror before the fix: the guard's SPAWN-05 line read PASS over 1 body.
  //
  // The assertion below keys on THIS guard's own finding text, not merely on the non-zero exit.
  // Another guard (guard_adapter_size's non-empty floor) also fails on an emptied tree, so a case
  // that only asserted `status !== 0` would pass on somebody else's finding and would go on passing
  // if this floor were deleted outright.
  it("guard_adapter_body derived half empty (both adapter directories emptied) → nonzero + this guard's own floor names both directories", () => {
    const m = mirror();
    rmSync(join(m, ".claude/agents"), { recursive: true, force: true });
    rmSync(join(m, ".claude/skills"), { recursive: true, force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "the adapter-body scan set derived NO adapters — refusing to report a verdict over the packaging template alone",
    );
    expect(o).toContain(".claude/agents: 0 adapter(s)");
    expect(o).toContain(".claude/skills: 0 adapter(s)");
    // And the guard must NOT have printed a passing SPAWN-05 line over the template alone — the
    // exact behaviour the unreachable floor allowed.
    expect(o).not.toContain("PASS  SPAWN-05:");
  });

  // The floor is SCOPED to the empty case: a derived half that still holds an adapter must not trip
  // it. Deleting the skills directory alone leaves 17 agent adapters derived, so this guard's floor
  // stays silent (guard_adapter_size's own per-directory floor is what fails that tree, and it is a
  // different finding).
  it("guard_adapter_body derived half empty floor does NOT fire while an adapter remains", () => {
    const m = mirror();
    rmSync(join(m, ".claude/skills"), { recursive: true, force: true });
    const r = runIn(m);
    expect(out(r)).not.toContain(
      "the adapter-body scan set derived NO adapters",
    );
  });

  // ── guard_agents_bytes — oversize + missing (CR-01). ─────────────────────────────────────────
  it("guard_agents_bytes oversize (>28672B) → nonzero + 'AGENTS.md'", () => {
    const m = mirror();
    writeFileSync(join(m, "AGENTS.md"), "x".repeat(30000) + "\n");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("AGENTS.md");
  });

  it("guard_agents_bytes missing AGENTS.md → nonzero + 'AGENTS.md missing' (CR-01)", () => {
    const m = mirror();
    rmSync(join(m, "AGENTS.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("AGENTS.md missing");
  });

  // ── guard_adapter_size — oversize + missing (CR-01). ─────────────────────────────────────────
  it("guard_adapter_size oversize (>4096B) → nonzero + adapter path", () => {
    const m = mirror();
    writeFileSync(
      join(m, ".claude/skills/grugops/SKILL.md"),
      "x".repeat(5000) + "\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("SKILL.md");
  });

  // (Phase 27 / KIT-02) This case was RE-POINTED, not deleted. It used to delete the orchestrator
  // adapter and assert the CR-01 `<path> missing` branch named it — a branch that only ever fired
  // because ADAPTERS was a hand-listed array pointing at a now-absent file. ADAPTERS is now DERIVED,
  // so a deleted adapter is simply never discovered and no per-file branch can see it. The deletion
  // signal therefore moved to the non-empty floor, which is what the plan required be restored in
  // exchange. Deleting the ONE agent adapter empties `.claude/agents`, and the floor fails red naming
  // that directory and BOTH derived counts.
  it("guard_adapter_size emptied adapter directory → nonzero + names the directory and both derived counts (deletion floor)", () => {
    const m = mirror();
    for (const rel of DERIVED_AGENT_ADAPTER_INPUTS) {
      rmSync(join(m, rel), { force: true });
    }
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("adapter derivation returned an empty set");
    expect(out(r)).toContain(".claude/agents: 0 adapter(s)");
    expect(out(r)).toContain(".claude/skills: 7 adapter(s)");
  });

  // The mirror-image of the floor: a SINGLE deleted skill directory cannot empty the set, and the
  // KIT-03 oracle cannot see it either (a skill has no role to compare against). The SKILL_COUNT
  // assertion in guard_kit_counts is the only thing standing between a deleted skill adapter and a
  // silently smaller derived set. Assert it fails red naming the count it actually found.
  it("kit count 6 skill adapters (one removed) → nonzero + names the derived 6 and the expected 7", () => {
    const m = mirror();
    rmSync(join(m, ".claude/skills/grugops-uat"), {
      recursive: true,
      force: true,
    });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("kit count");
    expect(out(r)).toContain("derived 6 skill adapters");
    expect(out(r)).toContain("expected exactly 7");
  });

  // ── guard_voice — clear-voice marker in each surface + missing + refinement + unclosed fence. ─
  it("guard_voice marker in role clear-voice surface → nonzero + role path", () => {
    const m = mirror();
    appendFileSync(
      rolePath(m, "security-nfr.md"),
      "\ngrug smash the bug.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("security-nfr.md");
  });

  it("guard_voice marker in workflow 15 → nonzero + surface path (D-10)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/workflows/15-security-audit.md"),
      "\ngrug smash the audit.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("15-security-audit.md");
  });

  it("guard_voice marker in ASVS checklist → nonzero + surface path (D-10)", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/checklists/security-nfr-checklist.md"),
      "\ngrug smash the checklist.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("security-nfr-checklist.md");
  });

  // (Phase 24) The former "guard_voice marker in security-nfr handoff" case was REMOVED: the static
  // handoff templates were deleted, so agent-factory/handoffs/security-nfr-handoff.md is no longer a
  // SEC_VOICE_FILE. The surviving security surfaces (the 15-security-audit workflow + the
  // security-nfr-checklist, covered above) still prove guard_voice fails red on a SEC surface.

  // (Phase 27 / KIT-01) The three former "missing role file" cases — one each for guard_voice,
  // guard_caveman_preserved and guard_role_size — are SUPERSEDED and collapsed into the case below.
  // Those cases worked because ROLE_FILES was a hand-listed array: deleting a role from the mirror
  // left a list entry pointing at nothing, so each guard's `fileExists` branch fired naming the file.
  // ROLE_FILES is now DERIVED, so a deleted role is simply not discovered and no per-guard branch can
  // see it. The missing-role signal therefore moved UP to guard_kit_counts, which is strictly
  // stronger: the hand-list version could be defeated by deleting the role AND its list entry in one
  // commit (a fully green suite over a 16-role kit — the founding defect of this milestone), whereas
  // the derived exact count cannot be satisfied by any edit to the guard source. The per-guard
  // `fileExists` branches remain in place as TOCTOU defence between readdir and read.
  //
  // These are the TWO SIDES of D-20's exact-count enforcement, and the pair is the point: a `>=`
  // floor would let 18 through and a `<=` ceiling would let 16 through. Only 17 passes. Both test
  // names carry the string `kit count` so `vitest -t "kit count"` selects exactly this pair.
  it("kit count 16 roles (one deleted) → nonzero + names the derived 16 and the expected 17 (D-20 low side)", () => {
    const m = mirror();
    rmSync(rolePath(m, "compliance-officer.md"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("kit count");
    expect(out(r)).toContain("derived 16 role files");
    expect(out(r)).toContain("expected exactly 17");
  });

  it("kit count 18 roles (one planted) → nonzero + names the derived 18 and the expected 17 (D-20 high side)", () => {
    const m = mirror();
    // A well-formed 18th role: a byte copy of a real one, so it clears guard_voice and
    // guard_caveman_preserved. The ONLY reason to reject it is that the corpus is now 18.
    cpSync(rolePath(ROOT, "installer.md"), rolePath(m, "zz-planted-role.md"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("kit count");
    expect(out(r)).toContain("derived 18 role files");
    expect(out(r)).toContain("expected exactly 17");
  });

  // D-19 per-consumer derivation proof: ROLE_FILES must be genuinely DERIVED, not re-listed under a
  // new name. Plant an 18th role and assert a downstream consumer (guard_role_size) emits a line
  // naming it — a re-listed set would never mention a file no author added to the list. This case
  // asserts on the PRESENCE of that line, not on the exit code: guard_kit_counts legitimately fails
  // in the same run (the corpus is 18), and that is not what is under test here.
  it("planted 18th role reaches guard_role_size — ROLE_FILES is derived, not re-listed (D-19)", () => {
    const m = mirror();
    cpSync(rolePath(ROOT, "installer.md"), rolePath(m, "zz-derived-probe.md"));
    const lines = out(runIn(m)).split("\n");
    const roleSizeLine = lines.find(
      (l) => /^ {2}(PASS|WARN|FAIL)/.test(l) && l.includes("zz-derived-probe.md"),
    );
    expect(roleSizeLine).toBeDefined();
    // roleCeiling() is deliberately NOT derived (D-17), so an undocumented role fails CLOSED naming
    // the file rather than inheriting an automatic ceiling.
    expect(roleSizeLine).toContain("no documented ceiling");
  });

  // ── D-19 per-consumer derivation assertions for the three sets re-pointed in plan 27-03. ──────
  //
  // Each proves its set is GENUINELY derived by planting a NEW file into a hermetic mirror and
  // asserting the guard notices it. A re-listed array — the same literal wearing a new name — could
  // never mention a file no author added to the list, so a plant that reaches the guard is the only
  // proof of derivation that a rename cannot fake.
  //
  // Every case asserts on the guard line NAMING the planted file, never on the exit code alone. That
  // was originally because guard_referential_integrity was legitimately red in the same run (17
  // roles, 1 adapter) until plan 27-07 landed the adapters; it is kept now that the tree is green,
  // because a bare `status !== 0` would still pass if the derivation were reverted and some
  // unrelated guard failed instead.

  // ADAPTERS: plant an oversize `.md` under the mirror's .claude/agents and assert guard_adapter_size
  // measures it. Membership followed the filesystem.
  it("planted agent adapter reaches guard_adapter_size — ADAPTERS is derived, not re-listed (D-19)", () => {
    const m = mirror();
    writeFileSync(
      join(m, ".claude/agents/zz-derived-probe.md"),
      "x".repeat(5000) + "\n",
    );
    const lines = out(runIn(m)).split("\n");
    const sizeLine = lines.find(
      (l) => /^ {2}FAIL/.test(l) && l.includes("zz-derived-probe.md"),
    );
    expect(sizeLine).toBeDefined();
    expect(sizeLine).toContain("adapter too large");
  });

  // SPAWN_GRANT_SCAN: plant a NON-coordinator adapter carrying a spawn grant and assert guard_wr05
  // names it a rogue spawner. This is the load-bearing case of the three — it is what keeps all 17
  // adapters inside the both-direction spawn-grant contract now that plan 27-07 has landed them,
  // with no edit to the guard.
  it("planted non-coordinator adapter with a spawn grant reaches guard_wr05 — SPAWN_GRANT_SCAN is derived (D-19)", () => {
    const m = mirror();
    writeFileSync(
      join(m, ".claude/agents/zz-rogue-spawner.md"),
      "---\nname: zz-rogue-spawner\ndescription: Hermetic plant.\ntools: Read, Agent\n---\nPlanted adapter.\n",
    );
    const o = out(runIn(m));
    expect(o).toContain(
      ".claude/agents/zz-rogue-spawner.md: non-coordinator carries a spawn grant",
    );
    expect(o).toMatch(/rogue spawner/i);
  });

  // ── (Plan 27-34, closing CR-03) THE PLUGIN-FORM DISTRIBUTION SURFACE ──────────────────────────
  //
  // The plant targets a SKILL adapter DELIBERATELY. Planting on an agent adapter would be caught
  // incidentally by the unrelated `name`/`tools` floors even if the scan set were wrong, giving such a
  // case a false green with a wrong diagnosis. A plugin-form skill is subject to NO floor other than
  // the spawn-grant test itself, so a conviction here can only mean the file is genuinely in the scan.
  //
  // Reproduced against the committed `.js` before the fix: this exact plant printed the WR-05 pass line
  // and ALL CHECKS PASSED at exit 0.
  it("planted spawn grant on a PLUGIN-form skill reaches guard_wr05 — the shipped plugin tree is in the scan (CR-03)", () => {
    const m = mirror();
    const target = join(m, "skills/plan/SKILL.md");
    writeFileSync(
      target,
      readFileSync(target, "utf8").replace(
        /^allowed-tools:\n/m,
        "allowed-tools:\n  - Agent(grugops-software-engineer, grugops-qe-e2e)\n",
      ),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "skills/plan/SKILL.md: non-coordinator carries a spawn grant",
    );
    expect(o).toMatch(/rogue spawner/i);
  });

  it("the UNMODIFIED mirror is green — the negative control for the plugin-form plant", () => {
    const r = runIn(mirror());
    expect(out(r)).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  // THE MIRROR-COMPLETENESS CASE. Without it the plant above could pass because the file is ABSENT
  // from the mirror rather than because the guard convicted it — guard_wr05 skips a scan member that
  // does not exist. Measured: with the plugin tree dropped, the SAME plant yields ZERO occurrences of
  // the conviction line, so the case would have proven nothing. This is what makes the plant known to
  // test the guard rather than the mirror.
  it("GUARD_INPUTS carries the plugin-form tree, at exactly the derived cardinality", () => {
    expect(DERIVED_PLUGIN_SKILL_INPUTS.length).toBe(PLUGIN_SKILL_ADAPTER_COUNT);
    expect(DERIVED_PLUGIN_SKILL_INPUTS).toContain("skills/plan/SKILL.md");
    expect(GUARD_INPUTS).toEqual(
      expect.arrayContaining(DERIVED_PLUGIN_SKILL_INPUTS),
    );
    // …and every one of them is a member of the scan the guard actually reads, so the mirror and the
    // scan cannot disagree about what a plant lands on.
    const scan = spawnGrantScan(ROOT);
    for (const rel of DERIVED_PLUGIN_SKILL_INPUTS) expect(scan).toContain(rel);
  });

  // ── THE PLUGIN-ROOT COMPONENT FLOOR (plan 27-37, D-46) ────────────────────────────────────────
  //
  // Round 5 proved this floor with ONE plant, at `agents/`, chosen from the hand-written two-element
  // literal the floor iterated. It was a real case over a real conviction — and it was structurally
  // incapable of catching that SEVEN other surfaces the platform loads sat outside every scan set.
  // Measured on hermetic mirrors before this plan, with one identical plant: `commands/rogue.md`
  // exited 1 and named the file; `outputStyles/rogue.md` and `hooks/rogue.md` each exited 0 with
  // `ALL CHECKS PASSED` and never named it.
  //
  // THE CORPUS IS ITERATED FROM THE PRODUCTION SET, NEVER HAND-LISTED HERE, and the reason is the
  // defect itself: a hand-listed test corpus over a derived production set is the SAME drift class
  // with the sides swapped — the set would rot in the test file instead of in the source file, and
  // stay just as green while it did.
  const ROGUE_COMPONENT = [
    "---",
    "name: rogue",
    "description: planted plugin-root component",
    "allowed-tools: Read, Agent(grugops-orchestrator)",
    "---",
    "",
    "Planted plugin-root component.",
    "",
  ].join("\n");

  it.each(pluginForbiddenComponentSubpaths())(
    "a granted file planted at the FORBIDDEN plugin-root directory `%s/` turns the gate red naming it",
    (subpath) => {
      const m = mirror();
      const rel = `${subpath}/rogue.md`;
      mkdirSync(join(m, subpath), { recursive: true });
      writeFileSync(join(m, rel), ROGUE_COMPONENT);
      const r = runIn(m);
      expect(r.status, `${rel} left the gate at exit 0`).not.toBe(0);
      const o = out(r);
      expect(o).toContain(rel);
      expect(o).toContain("sit OUTSIDE the spawn-grant scan");
    },
    30_000,
  );

  it("the forbidden corpus is DERIVED, at the cardinality the schema implies", () => {
    // Without this, the it.each above could silently iterate a shrunken set and every one of its
    // cases would still pass — the vacuous-corpus failure this file guards against everywhere else.
    const subpaths = pluginForbiddenComponentSubpaths();
    expect(subpaths.length).toBe(9);
    expect(subpaths).toContain("commands");
    expect(subpaths).toContain("outputStyles");
    // The two members the buckets claim are NOT in the forbidden corpus — the adjacency edge.
    expect(subpaths).not.toContain("skills");
    expect(subpaths).not.toContain("hooks");
  });

  // ── THE `hooks/` EXEMPTION'S TWO BOUNDS, asserted in BOTH directions ───────────────────────────
  it("a MARKDOWN adapter planted in the EXEMPT `hooks/` turns the gate red naming the file", () => {
    // The bound that makes the exemption fail closed. Before this plan the identical plant printed
    // ALL CHECKS PASSED at exit 0 and never named the file.
    const m = mirror();
    writeFileSync(join(m, "hooks/rogue.md"), ROGUE_COMPONENT);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("hooks/rogue.md");
    expect(o).toContain("carries 1 markdown adapter(s)");
    // Both bounds fire, and they state DIFFERENT facts: the file is unscanned, and it exists at all.
    expect(o).toContain(
      "markdown (frontmatter-bearing) file(s) under the EXEMPT plugin-root component directory",
    );
  });

  it("a NON-markdown file in the EXEMPT `hooks/` leaves the gate green — bounded, not absent", () => {
    // The other direction, and it is the half that keeps the exemption honest: if ANY plant in
    // `hooks/` went red, the directory would be forbidden in effect and the CLAUDE.md-mandated
    // prod-deploy guard could not live there. The exemption exempts exactly what it says it exempts.
    const m = mirror();
    writeFileSync(join(m, "hooks/rogue.js"), 'console.log("planted");\n');
    const r = runIn(m);
    expect(out(r)).toContain("ALL CHECKS PASSED");
    expect(r.status).toBe(0);
  });

  it("the live gate PRINTS the measured numbers for every plugin-root component surface", () => {
    // The PASS-line wording is a CONTRACT with this case, not prose. The disposition line reports
    // what it counted — including zeros — so a vacuous assertion is visible as the anomaly it is
    // rather than hiding behind a coverage claim.
    const o = out(runIn(ROOT));
    expect(o).toContain(`${PLUGIN_SKILL_ADAPTER_COUNT} plugin-form skill(s)`);
    // All nine forbidden subpaths are named, in sorted order, with their disposition.
    for (const subpath of pluginForbiddenComponentSubpaths()) {
      expect(o, subpath).toContain(`${subpath}/ ABSENT`);
    }
    expect(o).toContain(
      "plugin-default component directories: agents/ ABSENT, commands/ ABSENT",
    );
    // The exempt directory's MEASURED counts — today 7 files, 0 markdown adapters. Read from the
    // production probe rather than restated, so a shrunken directory fails the case instead of
    // quietly satisfying it.
    const hooks = listPluginExemptComponentFiles(ROOT)[0];
    expect(hooks.files.length).toBe(7);
    expect(hooks.markdownFiles.length).toBe(0);
    expect(o).toContain(
      `hooks/ EXEMPT-BY-NAME, PRESENT with ${hooks.files.length} file(s) and ${hooks.markdownFiles.length} markdown adapter(s), 0 of those inside the spawn-grant scan`,
    );
    // The tier-announcement phrase is kept byte-for-byte; the new clauses were APPENDED.
    expect(o).toContain(
      "the coordinator body carries all 6 tier-announcement beats, each exactly once in live, non-fenced, non-commented text",
    );
    // guard_kit_counts reports the partition it asserted. (Plan 27-42, D-50) The covered-elsewhere
    // clause's label is now DERIVED FROM THE RESOLVED PART — the part's name, its lister's own
    // function name, and the measured member count read off the composition — rather than
    // interpolated from a free-text string nothing resolved. Every number in it is derived here too,
    // so the case cannot agree with a shrunken tree.
    expect(o).toContain(
      `the plugin-manifest component schema carries ${PLUGIN_MANIFEST_COMPONENT_COUNT} entries partitioned into 7 forbidden + 1 covered-elsewhere (skills by the plugin-skill part's lister ${listPluginSkillAdapters.name}, ${listPluginSkillAdapters(ROOT).length} member(s) of it in the scan) + 1 exempt by name (hooks)`,
    );
  });

  // ── THE SCHEMA'S TWO-SIDED CARDINALITY FLOOR, exercised rather than merely agreed with ─────────
  it("guard_kit_counts fails red when a schema entry is REMOVED from a scratch build", () => {
    const guardJs = scratchGuard((src) =>
      src.replace('    { manifestKey: "lspServers", probeDirs: ["lspServers"] },\n', ""),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      `the plugin-manifest component schema carries 8 entries, expected exactly ${PLUGIN_MANIFEST_COMPONENT_COUNT}`,
    );
  });

  it("guard_kit_counts fails red when a schema entry is ADDED to a scratch build", () => {
    // The load-bearing direction. Adding a plugin-root component surface must force its author to
    // walk the partition, the probe, the exemption bound and the disposition line BEFORE the count
    // moves — which is the walk that never happened while the set was a two-element literal.
    const guardJs = scratchGuard((src) =>
      src.replace(
        '    { manifestKey: "lspServers", probeDirs: ["lspServers"] },',
        '    { manifestKey: "lspServers", probeDirs: ["lspServers"] },\n    { manifestKey: "scratchTenth", probeDirs: ["scratchTenth"] },',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      `the plugin-manifest component schema carries 10 entries, expected exactly ${PLUGIN_MANIFEST_COMPONENT_COUNT}`,
    );
  });

  // ── THE BUCKET PARTITION, exercised in both violation directions ───────────────────────────────
  it("guard_kit_counts fails red when a scratch build claims one schema member in TWO buckets", () => {
    const guardJs = scratchGuard((src) =>
      src.replace(
        "export const PLUGIN_COMPONENT_EXEMPT = [",
        'export const PLUGIN_COMPONENT_EXEMPT = [\n    { manifestKey: "skills", reason: "scratch double claim", bound: "scratch" },',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("three buckets do not PARTITION it");
    expect(o).toContain("claimed by more than one [skills]");
  });

  it("guard_kit_counts fails red when a scratch build leaves one schema member in NO bucket", () => {
    // Today's forbidden set is COMPUTED, so this state cannot arise from the current code. The floor
    // is what makes a LATER hand-edit of that computation impossible to land silently — which is
    // precisely the drift this plan deletes, arriving through the fix for it.
    const guardJs = scratchGuard((src) =>
      src.replace(
        "return PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey).filter((k) => !claimed.has(k));",
        'return PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey).filter((k) => !claimed.has(k) && k !== "outputStyles");',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("three buckets do not PARTITION it");
    expect(o).toContain("unclaimed by any bucket [outputStyles]");
  });

  // ── (Plan 27-42, D-50, closing IN-03) THE EXTRACTION IS PROVEN FAITHFUL, NOT ASSERTED ──────────
  //
  // The partition check moved out of this guard and into kit-model.ts's pure
  // `partitionPluginComponentClaims`, so a case can hand it a claim set carrying a hole and watch the
  // unclaimed arm fire — an arm that is unreachable from today's production code. That extraction
  // changed WHERE the predicate lives and must never change WHAT it decides.
  //
  // "Must never" is a claim, so it ships with the assertion that makes it true. These two controls
  // build a scratch guard in which the CALL to the extracted predicate is replaced by an INLINE
  // RESTATEMENT of the same predicate — written here, deliberately in a different idiom
  // (`indexOf`/`reduce` rather than `includes`/`filter().length`) so it is an independent statement
  // rather than a copy — and compare the two builds' output byte for byte.
  //
  // WHY THIS RATHER THAN A FROZEN BASELINE LITERAL. A case pinning today's PASS line as a string
  // ("derived 17 roles, 19 workflows, …") would go red the next time the kit legitimately gains a
  // role, and would then be "fixed" by updating the literal — which is the narrow-until-it-passes
  // shape this phase's own record warns about. Both builds here read the SAME tree in the SAME run,
  // so the control stays true across every legitimate count change and can only fail when the two
  // formulations of the predicate disagree.
  const INLINED_PARTITION_CALL =
    "const { unclaimed: unclaimedKeys, doubleClaimed: doubleClaimedKeys, foreign: foreignKeys, } = " +
    "partitionPluginComponentClaims(schemaKeys, pluginForbiddenComponentKeys(), coveredKeys, exemptKeys);";
  // (27-50, IN-02 — a DEVIATION this plan records rather than leaves standing) THE RESTATEMENT HAD
  // FROZEN AT A PREDICATE THE MODULE NO LONGER STATES, AND IT STAYED GREEN.
  //
  // Two arms had moved out from under it. `27-46` gave the foreign arm a de-duplication; this
  // restatement kept `claimedRestated.filter(...)`, which inherits multiplicity. `27-50` widened the
  // double-claim arm's domain to the union of the schema and the claims; this restatement kept
  // `schemaKeys.filter(...)`. Both divergences read GREEN, because the only fixture driving this
  // control plants each foreign key exactly ONCE and no input here ever produced a foreign
  // double-claim — the control agreed with the module everywhere its fixture could look.
  //
  // A CONTROL THAT COMPARES TWO DIFFERENT PREDICATES AND PASSES IS WORSE THAN NO CONTROL, which is
  // this module's own standing argument about weaker duplicates. So the restatement is UPDATED to
  // state today's predicate — still in its own idiom (`indexOf`/`reduce`/`concat` rather than
  // `includes`/`filter().length`/spread), so it remains an independent statement and not a copy —
  // and the firing fixture below is widened to carry a DOUBLED foreign key so the widened arm is
  // actually compared rather than merely restated.
  const inlinePartitionRestatement = (src: string): string =>
    src.replace(
      INLINED_PARTITION_CALL,
      [
        "const claimedRestated = [].concat(pluginForbiddenComponentKeys(), coveredKeys, exemptKeys);",
        "const unclaimedKeys = schemaKeys.filter((k) => claimedRestated.indexOf(k) === -1);",
        "const foreignKeys = claimedRestated.filter((k, i) => schemaKeys.indexOf(k) === -1 && claimedRestated.indexOf(k) === i);",
        "const doubleClaimedKeys = schemaKeys.concat(foreignKeys).filter((k) => claimedRestated.reduce((n, c) => (c === k ? n + 1 : n), 0) > 1);",
      ].join("\n    "),
    );
  // ONE mutation that fires ALL THREE ARMS at once, so the firing control compares three formulas
  // rather than one. It rewrites the computed forbidden set to: drop `outputStyles` (nothing then
  // claims it → the UNCLAIMED arm), append `scratchForeign` TWICE (claimed but not in the schema →
  // the FOREIGN arm, and claimed more than once → the widened DOUBLE-CLAIMED arm), and append
  // `hooks` (already exempt → the DOUBLE-CLAIMED arm's schema half). It deliberately does not touch
  // the covered-elsewhere or exempt buckets, whose SHAPE other plans change.
  //
  // (27-50, IN-02) THE SECOND `scratchForeign` IS WHAT MAKES THIS CONTROL SEE THE WIDENING. With one
  // occurrence the foreign key can only ever reach the foreign arm, so the double-claim arm's domain
  // — the half IN-02 was about — was never compared between the two formulations. It also exercises
  // the foreign arm's de-duplication, which `27-46` added and this control never observed.
  const fireAllThreeArms = (src: string): string =>
    src.replace(
      "return PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey).filter((k) => !claimed.has(k));",
      'return PLUGIN_MANIFEST_COMPONENT_SCHEMA.map((e) => e.manifestKey).filter((k) => !claimed.has(k) && k !== "outputStyles").concat(["scratchForeign", "scratchForeign", "hooks"]);',
    );

  it("the extracted partition predicate is byte-faithful to an inline restatement of it — PASSING tree", () => {
    const m = mirror();
    const inlined = runScratch(
      scratchGuardFiles({
        "check-foundation-guards.js": inlinePartitionRestatement,
      }),
      m,
    );
    // The control side is ALSO a scratch build, so both runs execute from a temp scripts directory
    // and any path-derived byte in the output is identical by construction. It carries a deliberate
    // NO-OP mutation (an appended comment) purely to satisfy the harness's mutation-applied floor;
    // the floor exists so a `replace` that matched nothing cannot pass as a control, and waiving it
    // here would waive it everywhere.
    const committed = runScratch(
      scratchGuardFiles({
        "kit-model.js": (s) => `${s}\n// scratch control build — no semantic change\n`,
      }),
      m,
    );
    expect(committed.status).toBe(0);
    expect(inlined.status).toBe(committed.status);
    expect(out(inlined)).toBe(out(committed));
    // Non-vacuous: the line the extraction could have changed really is in the compared output.
    expect(out(committed)).toContain("kit counts: derived");
    expect(out(committed)).toContain("covered-elsewhere");
  });

  it("the extracted partition predicate is byte-faithful to an inline restatement of it — ALL THREE ARMS FIRING", () => {
    // A control that only ever compares two PASS lines proves the predicate agrees where it does
    // nothing. This half compares the two formulations in the state where ALL THREE arms fire at
    // once, so each arm's formula — not only whichever one happens to be reachable — is compared.
    const m = mirror();
    const inlined = runScratch(
      scratchGuardFiles({
        "kit-model.js": fireAllThreeArms,
        "check-foundation-guards.js": inlinePartitionRestatement,
      }),
      m,
    );
    const committed = runScratch(
      scratchGuardFiles({ "kit-model.js": fireAllThreeArms }),
      m,
    );
    expect(committed.status).not.toBe(0);
    expect(inlined.status).toBe(committed.status);
    expect(out(inlined)).toBe(out(committed));
    // Non-vacuous: all three arms really fired, each naming its key, in BOTH builds. (27-50, IN-02)
    // The double-claim arm now names BOTH a schema key and a FOREIGN one, in the stated order —
    // schema keys first, then the foreign ones in first-occurrence order — and the foreign arm names
    // `scratchForeign` ONCE although two buckets claimed it.
    for (const o of [out(committed), out(inlined)]) {
      expect(o).toContain("unclaimed by any bucket [outputStyles]");
      expect(o).toContain("claimed by more than one [hooks, scratchForeign]");
      expect(o).toContain("claimed but outside the schema [scratchForeign]");
    }
  });

  // ── (Plan 27-42, D-50, closing IN-04) THE COVERER IS RESOLVED, AND BOTH BUCKET CARDINALITIES ────
  //    ARE ENFORCED BY THE GATE RATHER THAN ONLY BY THIS FILE.
  //
  // Measured on hermetic `git archive HEAD` mirrors of the build these cases replace, and recorded so
  // the cases read as closures of a demonstrated hole rather than as new opinions:
  //
  //   the lister renamed EVERYWHERE, only the coverer string left behind → exit 0, ALL CHECKS PASSED,
  //     still printing `covered-elsewhere (skills by listPluginSkillAdapters)`
  //   a coverer string naming a function that never existed          → exit 0, ALL CHECKS PASSED
  //   a SECOND exempt entry (the bucket's own promote trigger)       → exit 0, ALL CHECKS PASSED
  //   a SECOND covered-elsewhere entry                               → exit 0, ALL CHECKS PASSED
  //
  // Each of the four is a named gate failure below.

  it("guard_kit_counts fails red when a scratch build's coverer resolves to NO scan part", () => {
    const guardJs = scratchGuard((src) =>
      src.replace(
        "coverer: listPluginSkillAdapters,",
        "coverer: () => [],",
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "its coverer is NOT one of the listers the spawn-grant scan is composed from",
    );
    expect(o).toContain("`skills`");
  });

  it("guard_kit_counts fails red when a scratch build's coverer is a DISTINCT function carrying the same printed name", () => {
    // THE PRECISION EDGE. Resolution is by object identity, so a coverer whose `.name` is exactly
    // `listPluginSkillAdapters` — and which even delegates to the real lister — still resolves to
    // nothing. If this ever passes, the gate has been "simplified" into a name comparison and IN-04
    // is back under a new spelling.
    const guardJs = scratchGuard((src) =>
      src.replace(
        "coverer: listPluginSkillAdapters,",
        "coverer: { listPluginSkillAdapters: (r) => listPluginSkillAdapters(r) }.listPluginSkillAdapters,",
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      "Resolution is by FUNCTION IDENTITY, never by name",
    );
  });

  it("guard_kit_counts fails red when a coverer resolves to a REAL part that scans a DIFFERENT surface", () => {
    // Found by red-teaming this change, not by the finding it closes. `commands` claimed as covered
    // by the plugin-skill lister: the coverer RESOLVES (it is a real part's lister) and its part has
    // members in the scan, so every other check here passes — while `commands/` leaves the forbidden
    // set on coverage that scans `skills/`. Resolving is not covering, and covering something is not
    // covering THIS key.
    const guardJs = scratchGuard((src) =>
      src.replace(
        'manifestKey: "skills",\n        coverer: listPluginSkillAdapters,',
        'manifestKey: "commands",\n        coverer: listPluginSkillAdapters,',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "is NOT one of the probe directories the schema gives that key",
    );
    expect(o).toContain("scans somewhere else");
  });

  it("guard_kit_counts fails red when a scratch build EMPTIES the covered-elsewhere bucket (zero direction)", () => {
    const guardJs = scratchGuard((src) =>
      src.replace(
        /export const PLUGIN_COMPONENT_COVERED_ELSEWHERE = \[[\s\S]*?\n\];/,
        "export const PLUGIN_COMPONENT_COVERED_ELSEWHERE = [];",
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      "the covered-elsewhere bucket holds 0 entr(ies), expected exactly 1",
    );
  });

  it("guard_kit_counts fails red when a scratch build ADDS a second covered-elsewhere entry (two direction)", () => {
    const guardJs = scratchGuard((src) =>
      src.replace(
        "export const PLUGIN_COMPONENT_COVERED_ELSEWHERE = [",
        'export const PLUGIN_COMPONENT_COVERED_ELSEWHERE = [\n    { manifestKey: "outputStyles", coverer: listPluginSkillAdapters, reason: "scratch second covered entry" },',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      "the covered-elsewhere bucket holds 2 entr(ies), expected exactly 1",
    );
  });

  it("guard_kit_counts fails red when a scratch build EMPTIES the exempt bucket (zero direction)", () => {
    // Measured before this plan: the emptied bucket left guard_kit_counts PASSING and printing
    // `0 exempt by name ()`; the gate only went red through guard_wr05's `hooks/` probe, which is a
    // different finding about a different fact. The count is now named in its own right.
    const guardJs = scratchGuard((src) =>
      src.replace(
        /export const PLUGIN_COMPONENT_EXEMPT = \[[\s\S]*?\n\];/,
        "export const PLUGIN_COMPONENT_EXEMPT = [];",
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      "the exempt-by-name bucket holds 0 entr(ies), expected exactly 1",
    );
  });

  it("guard_kit_counts fails red when a scratch build ADDS a second exemption — the bucket's own recorded promote trigger", () => {
    const guardJs = scratchGuard((src) =>
      src.replace(
        "export const PLUGIN_COMPONENT_EXEMPT = [",
        'export const PLUGIN_COMPONENT_EXEMPT = [\n    { manifestKey: "outputStyles", reason: "scratch second exemption", bound: "scratch" },',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "the exempt-by-name bucket holds 2 entr(ies), expected exactly 1",
    );
    expect(o).toContain("A SECOND DIRECTORY NEEDING EXEMPTION");
  });

  it("guard_kit_counts fails red when the coverer's part could not be re-derived — a coverage claim on a check that did not happen", () => {
    // The third of the three separate facts. The part RESOLVES, but its lister throws, so its set
    // equality was never performed — and the covered-elsewhere claim would otherwise be printed on
    // the strength of it.
    const guardJs = scratchGuard((src) =>
      src.replace(
        "export function listPluginSkillAdapters(",
        'export function listPluginSkillAdapters() { throw new Error("kit-model: scratch unreadable plugin skills"); }\nfunction unusedListPluginSkillAdapters(',
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("SET EQUALITY AGAINST ITS OWN LISTER WAS NOT PERFORMED");
  });

  it("the unmodified control mirror stays exit 0 — the six cases above fail for their planted reason, not because a mirror is broken", () => {
    const r = runIn(mirror());
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // ── guard_kit_counts: A THROWN PER-PART LISTER IS REPORTED, NOT SWALLOWED (plan 27-37, D-47.1) ──
  //
  // THE ROUTE, RECORDED. The real condition is a TOCTOU window: the spawn-grant composition derives
  // cleanly at MODULE LOAD, and a part's directory becomes unreadable before the per-part membership
  // loop reads it again inside the guard. That window is the only one in which this catch can fire —
  // and it cannot be produced deterministically from outside a single synchronous child process,
  // because reproducing it would mean unlinking a directory at an instant between two statements of a
  // process this harness only spawns. So the EQUIVALENT state is produced instead, exactly as the plan
  // licenses: a STUB PART whose lister throws is spliced into a scratch copy of the compiled
  // kit-model.js. Its prefix matches nothing, so the composition, its cardinality and every real
  // part's membership are untouched — the ONLY thing the stub changes is that one lister throws inside
  // the loop, which is precisely the state under test.
  //
  // Measured against the COMMITTED build before the fix, with this exact stub: exit 0,
  // `ALL CHECKS PASSED`, NO finding for the skipped part, the part listed in the breakdown as
  // `stub-throwing 0`, and the PASS line still asserting `each part set-equal to its own lister`.
  const THROWING_STUB_PART =
    '    { name: "stub-throwing", prefix: "stub-throwing/", list: () => { throw new Error("kit-model: cannot read kit directory /scratch/stub-throwing"); } },\n';
  const MISMATCHING_STUB_PART =
    '    { name: "stub-mismatch", prefix: "stub-mismatch/", list: () => ["x.md"] },\n';

  it("a part whose lister THROWS is NAMED, the gate goes red, and the per-part set-equality claim disappears", () => {
    const guardJs = scratchGuard((src) =>
      src.replace(
        "export const SPAWN_GRANT_SCAN_PARTS = [\n",
        `export const SPAWN_GRANT_SCAN_PARTS = [\n${THROWING_STUB_PART}`,
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    // The part is named, the thrown message is carried, and the finding states the fact the PASS line
    // would otherwise have claimed: this equality was NOT performed.
    expect(o).toContain(
      "the spawn-grant scan composition's stub-throwing part could not be re-derived for the per-part membership check",
    );
    expect(o).toContain("cannot read kit directory /scratch/stub-throwing");
    expect(o).toContain("SET EQUALITY WAS NOT PERFORMED");
    // AND THE CLAIM IS GONE. A PASS line must never state a check that was not performed; the fix is
    // structural — the falsifying state now routes to the failure channel, making the PASS branch
    // unreachable — rather than a hedge in the wording.
    expect(o).not.toContain("each part set-equal to its own lister");
  });

  it("the per-part loop CONTINUES past a throwing part — a later part's genuine mismatch is reported in the same run", () => {
    // One unreadable directory must not hide the other parts' results, which is why the `continue` is
    // kept. The mismatching stub is placed AFTER the throwing one, so its finding appearing is proof
    // the loop reached it.
    const guardJs = scratchGuard((src) =>
      src.replace(
        "export const SPAWN_GRANT_SCAN_PARTS = [\n",
        `export const SPAWN_GRANT_SCAN_PARTS = [\n${THROWING_STUB_PART}${MISMATCHING_STUB_PART}`,
      ),
    );
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "the spawn-grant scan composition's stub-throwing part could not be re-derived",
    );
    expect(o).toContain(
      "the spawn-grant scan composition's stub-mismatch members are not exactly what stub-mismatch/ derives",
    );
    expect(o).toContain("missing [stub-mismatch/x.md]");
  });

  it("with every real lister healthy the finding is ABSENT and the per-part claim IS printed (the complement)", () => {
    // The other direction, and the one that keeps the case above from passing for the wrong reason: a
    // finding that fired unconditionally would satisfy the first case and mean nothing.
    const o = out(runIn(mirror()));
    expect(o).not.toContain("could not be re-derived for the per-part membership check");
    expect(o).toContain("each part set-equal to its own lister");
    expect(o).toContain("ALL CHECKS PASSED");
  });

  // ── guard_distribution_pair (plan 27-34, D-40 point 3) ────────────────────────────────────────
  //
  // The two distribution forms of one skill are hand-maintained near-mirrors — the shape that already
  // drifted twice inside this phase (CR-02's install/uninstall pair, WR-04's RUNNABLES pair). The rule
  // is asserted mechanically, with one file exempted by name.
  //
  // The exemption's cardinality is asserted through the guard's OWN pass line rather than by importing
  // the constant: check-foundation-guards.js is a script with a top-level process.exit, so it cannot be
  // imported. The pass line reports both numbers, and the case below asserts they EXHAUST the derived
  // plugin set — so a plugin skill that was neither compared nor exempted is impossible to hide.

  it("the live tree passes the pair rule with 6 compared and 1 exempted, and the two numbers exhaust the plugin set", () => {
    const o = out(runIn(ROOT));
    expect(o).toContain(
      "D-40: 6 plugin/standalone skill pair(s) byte-identical after normalizing the `name` value, 1 exempted by name",
    );
    expect(6 + 1).toBe(PLUGIN_SKILL_ADAPTER_COUNT);
    // The recorded reason names the ACTUAL delta — the kit-root resolver block — not a paraphrase.
    expect(o).toContain(
      "the standalone form carries a kit-root resolver block the plugin form does not need",
    );
  });

  it("the EXEMPTED file is still inside the spawn-grant scan — the exemption forgoes only the mirror assertion", () => {
    // The bound on the exemption, asserted rather than promised. Its spawn grant is checked exactly
    // like every other plugin skill's; what it forgoes is the byte comparison alone.
    expect(spawnGrantScan(ROOT)).toContain("skills/grugops/SKILL.md");
  });

  it("a one-BYTE body change in a plugin form fails red and NAMES the pair", () => {
    const m = mirror();
    const f = join(m, "skills/plan/SKILL.md");
    writeFileSync(
      f,
      readFileSync(f, "utf8").replace(
        "Never merge to a protected branch.",
        "Never merge to a protected branch!",
      ),
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain(
      "skills/plan/SKILL.md and .claude/skills/grugops-plan/SKILL.md DIVERGE beyond the `name` value",
    );
  });

  it("a DELETED standalone twin fails red naming the missing twin, never a skipped comparison", () => {
    const m = mirror();
    rmSync(join(m, ".claude/skills/grugops-ticket"), {
      recursive: true,
      force: true,
    });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      "skills/ticket/SKILL.md: its standalone twin .claude/skills/grugops-ticket/SKILL.md does not exist",
    );
  });

  // THE DISCRIMINATING CASE. Without it the normalization is satisfiable by simply deleting or
  // ignoring the name line — which passes every OTHER control in this block identically while
  // accepting a plugin form whose declared name is wrong, and a skill's name IS the command a user
  // types. Measured: a scratch build implementing the normalization as "drop the name line from both
  // sides" prints ALL CHECKS PASSED on this exact mirror, and passes every other case here unchanged.
  // This case is the one that makes the rule mean anything.
  it("a plugin form declaring a THIRD, wrong name fails red — the rule is not satisfiable by deleting the name line", () => {
    const m = mirror();
    renameAdapterIdentity(join(m, "skills/plan/SKILL.md"), "zzz-wrong");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain(
      "skills/plan/SKILL.md: declares `name: zzz-wrong`, expected `name: plan`",
    );
  });

  it("a pair differing ONLY in the name value still passes — the guard normalizes rather than byte-matching raw", () => {
    // The live tree IS this control: all six command skills differ from their twins by exactly the
    // `name` value and nothing else. A guard requiring a raw byte match would fail all six.
    const r = runIn(mirror());
    expect(out(r)).toContain("6 plugin/standalone skill pair(s) byte-identical");
    expect(r.status).toBe(0);
  });

  it("an EMPTY plugin tree produces a named zero-pair failure, never a vacuous pass", () => {
    const m = mirror();
    for (const rel of DERIVED_PLUGIN_SKILL_INPUTS) {
      rmSync(join(m, rel), { force: true });
    }
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("the pair rule compared ZERO pairs");
  });

  // ── SPAWN-04: the AGGREGATOR-LEVEL mark-prefixed rogue grant, on a SKILL surface ───────────────
  //
  // Two independent SPAWN-04 bypasses meet here: a scan set narrower than the shipped surface (closed
  // by task 1) and a mark-prefixed delimiter that made the parser take a silent no-grant arm (closed
  // by plan 27-33). This case drives both through the whole aggregator rather than through either
  // unit, on a SKILL adapter — the agent-adapter path would be caught incidentally by the unrelated
  // `name`/`tools` floors with a WRONG diagnosis, which is exactly how such a case passes for the
  // wrong reason.
  //
  // MEASURED, NOT ASSUMED, WHICH MARK PLACEMENT REFUSES. A SINGLE leading U+FEFF is the one byte this
  // parser NORMALIZES (D-39 point 1) — it does not refuse, so the grant behind it is read and the file
  // is convicted as a rogue spawner. TWO leading marks, and a mark TRAILING the delimiter payload,
  // both refuse. All three outcomes are pinned below, because the difference between them is the whole
  // content of the claim: "a mark-prefixed grant fails the gate" is true for a different REASON in
  // each, and a case that did not distinguish them could pass while the parse-failure branch was dead.
  const MARK = "﻿";
  const plantMarkedGrant = (
    root: string,
    rel: string,
    mode: "lead1" | "lead2" | "trail",
  ): void => {
    const file = join(root, rel);
    let src = readFileSync(file, "utf8").replace(
      /^allowed-tools:\n/m,
      "allowed-tools:\n  - Agent(grugops-software-engineer, grugops-qe-e2e)\n",
    );
    if (mode === "lead1") src = `${MARK}${src}`;
    else if (mode === "lead2") src = `${MARK}${MARK}${src}`;
    else src = src.replace("---\n", `---${MARK}\n`);
    writeFileSync(file, src);
  };

  for (const rel of [".claude/skills/grugops-map/SKILL.md", "skills/map/SKILL.md"]) {
    it(`a mark-prefixed rogue grant on ${rel} exits non-zero REFUSED by name, not by the name floor (SPAWN-04)`, () => {
      for (const mode of ["lead2", "trail"] as const) {
        const m = mirror();
        plantMarkedGrant(m, rel, mode);
        const r = runIn(m);
        expect(r.status, mode).not.toBe(0);
        const o = out(r);
        expectRefused(o, rel, "no-opening-delimiter");
        // It must be the REFUSAL and NOT a name-floor finding. Without this the case would pass on any
        // red run, including one where the reader silently took a no-grant arm and some unrelated
        // floor fired instead — which is the bypass shape, not its absence.
        expect(o, mode).not.toContain(`${rel}: agent adapter carries`);
      }
    });

    // (27-65) THE THIRD OUTCOME THIS PAIR USED TO PIN IS GONE, AND ITS DISAPPEARANCE IS THE POINT.
    //
    // The old reader NORMALIZED a single leading U+FEFF (D-39 point 1) and refused two of them or a
    // trailing one — three inputs, two branches, and the case above existed precisely because "a
    // mark-prefixed grant fails the gate" was true for a DIFFERENT REASON in each. That asymmetry is
    // the same shape as CR-01 and CR-02: one spelling refused loudly, its near-twin taking a quieter
    // path, and eleven rounds spent finding which twin was which.
    //
    // The canonical form has no normalization step at all. A delimiter line is exactly `---` or it is
    // not one, so all three mark placements land on ONE code with ONE reason. This case is rewritten
    // from "the single mark is normalized then convicted" to "the single mark is refused like the
    // other two", and the three-way collapse is asserted rather than described.
    it(`a SINGLE leading mark on ${rel} is now REFUSED like the other two placements — no normalization branch (27-65)`, () => {
      const m = mirror();
      plantMarkedGrant(m, rel, "lead1");
      const r = runIn(m);
      expect(r.status).not.toBe(0);
      const o = out(r);
      expectRefused(o, rel, "no-opening-delimiter");
      // The branch that used to make this input different from its two siblings no longer exists, so
      // the conviction must NOT come from the rogue-grant arm any more. Asserted, so a future
      // re-introduction of a normalization step fails here by name.
      expect(o).not.toContain(`${rel}: non-coordinator carries a spawn grant`);
    });
  }

  // ── D-41 item 4: the name floor reports the fact it OBSERVED ───────────────────────────────────
  //
  // "Carries no `name` key" over a document with no frontmatter block at all sends the next author to
  // add a key to a block that is not there. A block declaring keys without a name and a document with
  // no block are different facts with different remedies, and telling two different facts apart is
  // this module's founding argument.
  const NO_BLOCK_FINDING = "agent adapter carries NO FRONTMATTER BLOCK at all";
  const NO_NAME_FINDING = "agent adapter carries no `name` key in its frontmatter";

  // (27-65) THE NO-BLOCK ARM IS NOW UNREACHABLE, AND THE FACT IT WAS WRITTEN FOR IS STILL REPORTED.
  //
  // The old reader returned a KEYLESS SUCCESS for a document with no frontmatter block, which is why
  // guard_wr05 needed an arm to tell "a block declaring keys without a name" apart from "no block at
  // all" — two facts with two different remedies. The canonical form has no keyless success: a first
  // line that is not exactly `---` refuses as `no-opening-delimiter`, naming the line it actually saw.
  // The distinction the arm existed to preserve therefore survives — the two documents still produce
  // two visibly different findings — but the second one is now a refusal rather than a floor.
  //
  // The arm itself is deliberately KEPT in the guard as a residual floor that costs nothing and fails
  // closed; this case is what records that it can no longer be reached.
  it("an agent adapter with NO frontmatter block is REFUSED `no-opening-delimiter`, naming the line it saw", () => {
    const m = mirror();
    writeFileSync(
      join(m, ".claude/agents/zz-no-block.md"),
      "Just a body. No frontmatter block anywhere in this document.\n",
    );
    const o = out(runIn(m));
    expectRefused(o, ".claude/agents/zz-no-block.md", "no-opening-delimiter");
    // The refusal names the offending first line, so the author is still told the right thing.
    expect(o).toContain("Just a body. No frontmatter block anywhere");
    // And it is still NOT the missing-name finding: the two facts stay distinguishable, which is the
    // whole property this case and its sibling exist to protect.
    expect(o).not.toContain(`.claude/agents/zz-no-block.md: ${NO_NAME_FINDING}`);
    expect(o).not.toContain(`.claude/agents/zz-no-block.md: ${NO_BLOCK_FINDING}`);
  });

  it("an agent adapter whose block declares keys but no name produces the missing-name finding", () => {
    const m = mirror();
    writeFileSync(
      join(m, ".claude/agents/zz-no-name.md"),
      "---\ndescription: A block that declares keys and no name.\ntools: Read\n---\nBody.\n",
    );
    const o = out(runIn(m));
    expect(o).toContain(`.claude/agents/zz-no-name.md: ${NO_NAME_FINDING}`);
    expect(o).not.toContain(`.claude/agents/zz-no-name.md: ${NO_BLOCK_FINDING}`);
  });

  it("the two no-name facts stay DISTINGUISHABLE in one run — a refusal for the blockless file, the floor for the keyed one (27-65)", () => {
    // The string inequality is still asserted, so a future author cannot collapse the guard's two
    // messages back into one and keep the sibling cases green.
    expect(NO_BLOCK_FINDING).not.toBe(NO_NAME_FINDING);
    const m = mirror();
    writeFileSync(join(m, ".claude/agents/zz-no-block.md"), "Body only.\n");
    writeFileSync(
      join(m, ".claude/agents/zz-no-name.md"),
      "---\ndescription: Keys, no name.\ntools: Read\n---\nBody.\n",
    );
    const o = out(runIn(m));
    // Both facts are reported independently in ONE run and neither masks the other — which is the
    // property that matters. The blockless file is refused by name; the keyed file is ADMITTED and
    // then convicted by the floor, proving the floor is still reachable after the cutover.
    expectRefused(o, ".claude/agents/zz-no-block.md", "no-opening-delimiter");
    expect(o).toContain(`.claude/agents/zz-no-name.md: ${NO_NAME_FINDING}`);
    // NON-VACUITY: the keyed file must NOT have been refused, or this case would no longer prove the
    // floor fires at all.
    expect(
      o,
      "the keyed fixture must be ADMITTED so the name floor is proven reachable",
    ).not.toContain(".claude/agents/zz-no-name.md: frontmatter is NOT");
  });

  // CTX_WORKFLOWS: plant an additional workflow matching the `NN-*.md` naming rule, carrying a raw
  // context write, and assert guard_context_writes names it. Before plan 27-03 the scan enumerated 16
  // of the 19 shipped workflows, so a 20th could never have been seen. (The planted file also takes
  // the corpus to 20 and so trips guard_kit_counts in the same run — which is why this asserts on the
  // SCTX-05 line, not on the exit code.)
  it("planted workflow reaches guard_context_writes — CTX_WORKFLOWS is derived, not re-listed (D-19)", () => {
    const m = mirror();
    writeFileSync(
      join(m, "agent-factory/workflows/19-zz-derived-probe.md"),
      "# Planted workflow\n\nwriteFileSync('.grugops/context/task-x/notes/n.md', data);\n",
    );
    const o = out(runIn(m));
    expect(o).toContain("SCTX-05 raw context write");
    expect(o).toContain(
      "agent-factory/workflows/19-zz-derived-probe.md:3:writeFileSync",
    );
  });

  // The harness's own input set must stay derived — if DERIVED_ROLE_INPUTS ever silently emptied or
  // drifted, every mirror above would be built from an incomplete kit and the plants would be
  // measuring nothing.
  it("GUARD_INPUTS derives exactly ROLE_COUNT role entries (the harness input set is not hand-listed)", () => {
    expect(DERIVED_ROLE_INPUTS.length).toBe(ROLE_COUNT);
    expect(DERIVED_ROLE_INPUTS).toContain("agent-factory/roles/orchestrator.md");
    expect(DERIVED_ROLE_INPUTS).not.toContain(
      "agent-factory/roles/_role-switch-protocol.md",
    );
  });

  // HOST-FILE CHOICE IS LOAD-BEARING (Phase 27 / plan 27-06). The assertion here is global
  // (`ALL CHECKS PASSED`), so this 93-byte plant is charged against the host role's guard_role_size
  // budget as well as being read by guard_voice. It used to plant into `security-nfr.md`, the
  // second-most bloated role, which left the whole case 16 bytes from red — any prose addition to
  // that one file broke a test about voice discipline, for reasons having nothing to do with voice.
  // Adding the `capabilities:` frontmatter key (D-11) spent those 16 bytes and tripped it.
  //
  // The host is therefore `agents-md-scribe.md`: still a ROLE_FILES member, so the caveman-fence
  // strip path is exercised exactly as before, and the role the probe text is actually about (the
  // Scribe writing a Mission section) — but with ~450 bytes of headroom under its ceiling, roughly
  // five times the plant. neutralizePhrases() is file-agnostic (it rewrites `/grug`, `grug voice`
  // and `grug wink` on every line of every voice file), so nothing about the coverage changes.
  // Do NOT move this plant back onto a role that is near its ceiling: no byte ceiling may be raised
  // to make a plant fit, and this case must fail for VOICE reasons or not at all.
  it("guard_voice refinement accepts clear-voice grug-meta + /grug (narrow, not weakened)", () => {
    const m = consistentMirror();
    appendFileSync(
      rolePath(m, "agents-md-scribe.md"),
      "\nThe Scribe may add a light grug wink in Mission; route every `/grug` request to grug voice.\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  it("guard_voice unterminated caveman fence → nonzero + 'unterminated' (WR-03)", () => {
    const m = mirror();
    // Delete the CLOSING ``` of qe-e2e's `## Caveman prompt` block so the fence is unbalanced.
    const file = rolePath(m, "qe-e2e.md");
    const lines = readFileSync(file, "utf8").split("\n");
    let seen = false;
    let fence = 0;
    const kept: string[] = [];
    for (const line of lines) {
      if (/^## Caveman prompt/.test(line)) seen = true;
      if (seen && /^```/.test(line)) {
        fence++;
        if (fence === 2) continue; // drop the closing fence → unbalanced
      }
      kept.push(line);
    }
    writeFileSync(file, kept.join("\n"));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("unterminated");
  });

  // ── guard_caveman_voice — the DISCRIMINATING fixtures (plan 29-01, D-43). ─────────────────────
  //
  // (Plan 29-01) The two `guard_caveman_preserved` plant cases that stood here were RETIRED WITH THE
  // GUARD. They asserted the messages `no caveman marker` and `sanded to prose`, both produced by the
  // `^You`-cadence predicate D-06 deletes; neither could distinguish the two-sided predicate from a
  // one-sided one, because the block each planted fails BOTH arms.
  //
  // WHY THESE FIXTURES EXIST AND THE 17/17 RED TRANSCRIPT DOES NOT REPLACE THEM. Measured over the
  // real corpus (29-RESEARCH §B-1), the positive arm fails 17/17 at EVERY N and the negative arm
  // fails 17/17 independently. So a build that shipped `positive || negative`, or that dropped an arm
  // outright, produces a BYTE-IDENTICAL transcript. Only a block that satisfies exactly one arm can
  // tell the conjunction from the disjunction.
  //
  // Every plant below builds its tokens by reading CAVEMAN_LEXICON and BANNED_CONSTRUCTIONS from the
  // authority. Retyping a term here would be a second copy of the list living in the file that
  // polices the first.
  it("FIXTURE A — a block passing the POSITIVE arm and failing the NEGATIVE arm is RED (D-43)", () => {
    const m = mirror();
    plantCavemanBlock(m, "brownfield-mapper.md", [
      // >= CAVEMAN_LEXICON_MIN lexicon terms …
      `You ${CAVEMAN_LEXICON[0]}. You ${CAVEMAN_LEXICON[4]} ${CAVEMAN_LEXICON[2]}.`,
      // … and one article, which is the whole difference.
      `You find ${BANNED_CONSTRUCTIONS.article[0]} map.`,
    ]);
    const r = runIn(m);
    expect(r.status).toBe(1);
    expect(out(r)).toContain("brownfield-mapper.md");
    expect(out(r)).toContain("negative arm:");
    // The positive arm HELD, so a guard that reported it failing would be measuring something else.
    expect(out(r)).not.toMatch(/brownfield-mapper\.md: positive arm/);
  });

  it("FIXTURE B — a block passing the NEGATIVE arm and failing the POSITIVE arm is RED (D-43)", () => {
    const m = mirror();
    plantCavemanBlock(m, "brownfield-mapper.md", [
      // Zero lexicon terms, and zero articles, copulas, modals and subordinators.
      "You map repo.",
      "You write down what you found.",
    ]);
    const r = runIn(m);
    expect(r.status).toBe(1);
    expect(out(r)).toContain("brownfield-mapper.md");
    expect(out(r)).toMatch(/brownfield-mapper\.md: positive arm/);
    expect(out(r)).not.toMatch(/brownfield-mapper\.md:.*negative arm/);
  });

  // (Phase 27 / KIT-01) The former "missing role → caveman prompt block missing" case is superseded
  // by the derived-kit-count case above. See the comment there.

  // ── guard_role_size — oversize + missing (CR-01). ────────────────────────────────────────────
  it("guard_role_size oversize role (>ceiling) → nonzero + 'bloated' (D-07)", () => {
    const m = mirror();
    writeFileSync(
      rolePath(m, "brownfield-mapper.md"),
      "x".repeat(6000) + "\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("bloated");
  });

  // (Phase 27 / KIT-01) The former "missing role → installer.md missing" case is superseded by the
  // `kit count 16 roles` case above; the D-17 undocumented-role direction is covered by the
  // `planted 18th role reaches guard_role_size` case, which asserts on the guard_role_size line.

  // ── Phase 19 Tier-1 oracle wiring (UAT-AUTO-05 / BLOCKER 1) — the aggregator must FAIL CLOSED. ──
  // Break a single Tier-1 input in the mirror and prove the aggregator goes red — i.e. `node
  // scripts/check-foundation-guards.js` exits non-zero when any one Tier-1 oracle fails, proving it
  // folds uatOracleFails(). (DOGF-01: the A3 oracle is now oracleDualPathEquivalence, which self-seeds
  // hermetic temp dirs and reads NO mirror input, so it cannot be broken via the mirror. We break the
  // A2 hooks-wiring oracle instead — mutating hooks.json's matcher away from "Bash" is a crisp
  // deterministic Tier-1 failure that the aggregator must inherit.)
  it("tier-1 wiring: a broken Tier-1 oracle input → aggregator nonzero + names the Tier-1 failure", () => {
    const m = mirror();
    const file = join(m, "hooks/hooks.json");
    const cfg = JSON.parse(readFileSync(file, "utf8"));
    cfg.hooks.PreToolUse[0].matcher = "NotBash";
    writeFileSync(file, JSON.stringify(cfg, null, 2));
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toMatch(/matcher is not "Bash"/);
  });

  // ── guard_context_writes — SC-5: planted raw context write fires; legitimate prose stays GREEN. ──
  // A raw `writeFileSync('.grugops/context/...')` in shipped role text bypasses context-io.ts — the
  // exact T-20-10 tampering threat. Plant it into one scanned role file and prove the aggregator goes
  // red naming SCTX-05. (token-then-path: the write TOKEN precedes the path on the line.)
  it("guard_context_writes planted raw write (writeFileSync into .grugops/context/) → nonzero + SCTX-05", () => {
    const m = mirror();
    // Plant into a WORKFLOW (no byte ceiling) so the only guard that can fire is guard_context_writes —
    // proving SCTX-05 fires on the bypass in isolation, not as a side effect of guard_role_size.
    appendFileSync(
      join(m, "agent-factory/workflows/02-idea-to-epics.md"),
      "\nwriteFileSync('.grugops/context/task-x/notes/n.md', data);\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("SCTX-05");
  });

  // path-then-token shape: a shell redirect writing the context path (`echo ... >> .grugops/context/`).
  it("guard_context_writes planted shell redirect (echo >> .grugops/context/) → nonzero + SCTX-05", () => {
    const m = mirror();
    appendFileSync(
      join(m, "agent-factory/workflows/04-ticket-to-pr.md"),
      "\necho note >> .grugops/context/task-x/index.md\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("SCTX-05");
  });

  // CALIBRATION (A3): legitimate prose that merely NAMES the helper + the path is NOT a raw write —
  // the guard must stay GREEN (the prose word "write" is not a TOKEN). This is the no-false-positive
  // half of the no-fabrication proof: the guard fires on a real bypass but not on sanctioned prose.
  it("guard_context_writes prose naming context-io.ts + path stays GREEN (no false positive, A3)", () => {
    const m = consistentMirror();
    // Append to a WORKFLOW file (workflows have no byte ceiling, so this isolates the calibration to
    // guard_context_writes — a role file would also trip guard_role_size, masking the real assertion).
    appendFileSync(
      join(m, "agent-factory/workflows/03-epic-to-tickets.md"),
      "\nRoles never raw-write `.grugops/context/` directly; they call the context-io.ts helper.\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // ── guard_referential_integrity (KIT-03 / D-09) — both directions pinned to FIXTURES. ─────────
  //
  // These cases assert against CONSTRUCTED mirrors, never the live tree, which is what makes them
  // permanent. The RED case keeps proving the oracle fires now that plan 27-07 has landed the real
  // adapters and the live tree has gone green — the RED evidence is a regression test rather than a
  // screenshot pasted into a document that nobody re-runs. (It only earns that description since
  // 27-07 replaced its plain-mirror() fixture with brokenMirror(); see the fixture comment above.)
  it("referential integrity RED: the pre-27-07 shape (17 roles, 1 adapter, 7 unresolvable grants) fails naming every set difference", () => {
    const m = brokenMirror(); // the pre-27-07 structurally broken shape, re-created explicitly
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // The three set differences, each named by MEMBER and not merely by cardinality.
    expect(o).toContain("17 roles, 1 adapters");
    expect(o).toContain("16 role(s) with no adapter file");
    expect(o).toContain("grugops-software-engineer");
    expect(o).toContain("7 granted name(s) resolving to no adapter file");
    expect(o).toContain("grant ∪ {coordinator} == adapters == roles");
  });

  it("referential integrity GREEN: 17 adapters matching 17 roles with a 16-name grant passes", () => {
    const m = consistentMirror();
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain(
      "KIT-03: 17 roles == 17 adapters == 17 grant-closure names",
    );
  });

  it("referential integrity one-element difference names the single missing adapter, not just the cardinalities", () => {
    const m = consistentMirror();
    rmSync(adapterPath(m, "grugops-uat-planner"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("1 role(s) with no adapter file: grugops-uat-planner");
    expect(o).toContain(
      "1 granted name(s) resolving to no adapter file: grugops-uat-planner",
    );
  });

  it("referential integrity empty adapter directory fails red — never a vacuous two-empty-sets pass", () => {
    const m = mirror();
    rmSync(join(m, ".claude/agents"), { recursive: true, force: true });
    mkdirSync(join(m, ".claude/agents"), { recursive: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("yielded no adapter files");
    expect(out(r)).toContain("All 17 role(s) are unbacked");
    // The authority's own throw is REPORTED, not swallowed — and it names the directory.
    expect(out(r)).toMatch(/refusing to return an empty set/);
  });

  it("referential integrity UNREADABLE adapter directory fails red naming the directory", () => {
    // The directory is absent, not merely empty. Both conditions land on the same branch now, because
    // the authority distinguishes them in the message it throws and that message names the path.
    const m = mirror();
    rmSync(join(m, ".claude/agents"), { recursive: true, force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    expect(out(r)).toContain("yielded no adapter files");
    expect(out(r)).toMatch(/cannot read kit directory/);
    expect(out(r)).toContain(".claude/agents");
  });

  // ── The KIT-03 cases plan 27-10 adds: one step either side of the cardinality, the nested plant
  // the oracle used to be blind to, a case-variant duplicate, and a basename collision across
  // depths. Every fixture is CONSTRUCTED — none inherits its shape from the live tree, which is the
  // mistake recorded in the fixture comment at the top of this file. ──────────────────────────────

  it("referential integrity fails RED one step BELOW the role cardinality (16 adapters vs 17 roles)", () => {
    const m = consistentMirror();
    rmSync(adapterPath(m, "grugops-installer"), { force: true });
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("17 roles, 16 adapters");
    expect(o).toContain("1 role(s) with no adapter file: grugops-installer");
  });

  it("referential integrity fails RED one step ABOVE the role cardinality (18 adapters vs 17 roles)", () => {
    const m = consistentMirror();
    plantPlainAdapter(m, "grugops-extra.md", "grugops-extra");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("17 roles, 18 adapters");
    expect(o).toContain("1 adapter(s) with no role file: grugops-extra");
  });

  it("referential integrity names a NESTED adapter as an adapter with no role file (it used to be invisible)", () => {
    // Deliberately NOT a coordinator: the coordinator-cardinality branch returns early, and this case
    // has to reach the set comparison to prove the nested member is actually IN the compared set.
    const m = consistentMirror();
    plantPlainAdapter(m, "extra/grugops-rogue.md", "grugops-rogue");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("17 roles, 18 adapters");
    expect(o).toContain(
      "1 adapter(s) with no role file: extra/grugops-rogue",
    );
  });

  it("referential integrity reports a nested adapter sharing a top-level BASENAME as a DISTINCT extra member", () => {
    // `extra/grugops-installer.md` alongside `grugops-installer.md`. A derivation that compared
    // basenames — or deduplicated on the file name — would report 17 adapters here and lose the
    // planted one entirely. Both must survive as distinct members.
    const m = consistentMirror();
    plantPlainAdapter(m, "extra/grugops-installer.md", "grugops-installer");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("17 roles, 18 adapters");
    expect(o).toContain(
      "1 adapter(s) with no role file: extra/grugops-installer",
    );
    // The top-level one is NOT reported missing — it is still a member in its own right.
    expect(o).not.toContain("role(s) with no adapter file: grugops-installer");
  });

  it("referential integrity fails RED on a CASE-VARIANT duplicate filename, naming both", () => {
    // Planted at a nested path on purpose: on a case-insensitive filesystem two case-variant names
    // cannot coexist in ONE directory, so the only way to build this fixture portably is at two
    // depths — which is also exactly the shape a case-insensitive filesystem could otherwise use to
    // make two distinct names compare equal.
    const m = consistentMirror();
    plantPlainAdapter(m, "extra/grugops-INSTALLER.md", "grugops-installer-2");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toMatch(/differing only by letter case/);
    expect(o).toContain("grugops-INSTALLER.md vs grugops-installer.md");
  });

  it("referential integrity ignores a FENCED coordinator grant — no second fence parser (T-27-02)", () => {
    const m = consistentMirror();
    // A documentation example inside a ``` fence must not be read as a live grant. If the parser
    // were fence-blind, these bogus names would enter the closure and the run would fail.
    appendFileSync(
      adapterPath(m, COORDINATOR),
      "\n## Example\n\n```markdown\ntools: Agent(grugops-not-a-real-role, grugops-also-fake), Read\n```\n",
    );
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).not.toContain("grugops-not-a-real-role");
  });

  // ── The IDENTITY-NAMESPACE cases plan 27-19 adds (CR-02). ─────────────────────────────────────
  //
  // Set 2 of the three-way equality is keyed on FILENAMES; set 3 is the coordinator's frontmatter
  // grant, i.e. platform AGENT NAMES. Claude Code takes identity only from frontmatter, and until this
  // round nothing asserted the two namespaces coincide — so the milestone's founding defect (a grant
  // enumerating a name no installed agent carries) reproduced with the oracle printing
  // "17 roles == 17 adapters == 17 grant-closure names" and exiting 0.
  //
  // These three are the fixtures the review found missing. Every one of them fails if the
  // `nameMismatch` block is removed from scripts/check-foundation-guards.ts.

  it("referential integrity RED: one adapter's frontmatter `name` rewritten → nonzero + KIT-03 names it (CR-02, reproduced)", () => {
    const m = consistentMirror();
    // Green FIRST on the IDENTICAL mirror, so the rename is provably what turns it red rather than
    // some unrelated defect in the fixture. Without this the case would still pass over a mirror that
    // was broken for any other reason and the RED evidence would be worthless.
    const before = runIn(m);
    expect(before.status).toBe(0);
    expect(out(before)).toContain("ALL CHECKS PASSED");

    // The review's exact reproduction: one byte-level edit to one NON-COORDINATOR adapter's `name`
    // value and nothing else. The coordinator's grant still enumerates `grugops-installer`, which now
    // resolves to no loaded agent.
    renameAdapterIdentity(
      adapterPath(m, "grugops-installer"),
      "totally-different-name",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("KIT-03:");
    expect(o).toContain(".claude/agents/grugops-installer.md");
    expect(o).toContain("declares `name: totally-different-name`");
    expect(o).toContain("expected `name: grugops-installer`");
    // The oracle returns early, so the equality is NEVER claimed over two namespaces.
    expect(o).not.toContain("PASS  KIT-03");
  });

  it("referential integrity RED: a fixture-PLANTED adapter declaring a name ≠ its filename stem fails the same way", () => {
    // This is the case that proves the FIXTURE GENERATOR can express the failure at all — the review's
    // finding was that it could not, because consistentMirror(), plantPlainAdapter() and
    // plantNestedRogue() all wrote `name:` equal to the filename stem by construction.
    const m = consistentMirror();
    plantPlainAdapter(m, "grugops-extra.md", "grugops-something-else");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    expect(o).toContain("KIT-03:");
    expect(o).toContain(".claude/agents/grugops-extra.md");
    expect(o).toContain("declares `name: grugops-something-else`");
    expect(o).toContain("expected `name: grugops-extra`");
    // The mapping refusal PRECEDES the set comparison, so the 18-vs-17 cardinality is not what is
    // reported here. A mismatch must be fixed before the equality means anything.
    expect(o).not.toContain("17 roles, 18 adapters");
  });

  it("referential integrity RED: an EMPTY `name` value is REFUSED `unrecognized-line`, never read as a match (27-65)", () => {
    const m = consistentMirror();
    renameAdapterIdentity(adapterPath(m, "grugops-qe-e2e"), "");
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // The KIT-03 oracle's own refusal wording (it differs from guard_wr05's on purpose — this one is
    // about a set equality that must not be computed, not about a grant that must not be assumed).
    expect(o).toContain(
      "KIT-03: 1 adapter(s) whose frontmatter is NOT in the canonical form",
    );
    expect(o).toContain(".claude/agents/grugops-qe-e2e.md");
    // MEASURED, NOT GUESSED. The fixture writes `name: ` — key, colon, ONE trailing space — which is
    // neither the `key: value` production (there is no value) nor the `key:` production (there is a
    // trailing space). The canonical form refuses it as an unrecognized line and quotes the line back.
    // The first draft of this assertion guessed `dangling-empty-key` and failed red, which is the
    // assertion doing its job: the code is read off the gate, never assumed from the fixture's intent.
    expect(o).toContain("[unrecognized-line]");
    expect(o).toContain("`name: ` matches none of the 3 admitted line productions");
    // The load-bearing half is untouched: an unreadable adapter is NEVER a zero-length grant closure
    // and NEVER a non-coordinator, and no set equality is computed over it.
    expect(o).toContain(
      "the set equality cannot be checked over a file that cannot be read",
    );
    expect(o).not.toContain("carries NO `name` key at all");
    expect(o).not.toContain("PASS  KIT-03");
  });

  it("referential integrity RED: a DUPLICATE `name` key whose FIRST value matches is refused (27-19 red-team)", () => {
    // Found by attacking this plan's own first draft, which read `declaredValues[0]`. A second `name:`
    // line below a matching one made the ENTIRE gate print ALL CHECKS PASSED over a document declaring
    // two identities — the "two answers to one predicate" class reproduced inside the fix for it.
    // Which answer the platform's loader honours (first, last, or a duplicate-key throw that stops the
    // agent loading at all) is not the oracle's to guess, so the CARDINALITY of the answer is pinned.
    const m = consistentMirror();
    const file = adapterPath(m, "grugops-installer");
    plantInFrontmatter(file, ["name: totally-different-name"]);
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (27-65) The document is REFUSED for declaring `name` twice, before either value is read — so
    // the red-team finding this case pins is closed one level EARLIER than it was. The oracle never
    // reaches `declaredValues[0]` because it never receives a document with two `name` values at all.
    expect(o).toContain(
      "KIT-03: 1 adapter(s) whose frontmatter is NOT in the canonical form",
    );
    expect(o).toContain(".claude/agents/grugops-installer.md");
    expect(o).toContain("[duplicate-key]");
    expect(o).toContain("appears more than once in this region");
    // The old message reported both values; the canonical form refuses at the second occurrence and
    // never collects them. Asserted absent so the diagnostic loss is visible rather than assumed away.
    expect(o).not.toContain("`grugops-installer`, `totally-different-name`");
    expect(o).not.toContain("PASS  KIT-03");
  });

  // The no-false-positive half of the cardinality pin: every LEGITIMATE spelling of one name is one
  // value, so none of them is refused. A wrapped plain scalar is JOINED by the parser rather than
  // becoming a second value, which is what makes `length !== 1` mean "the key genuinely appears twice"
  // instead of "the value was long".
  // (27-65) THE SHARPEST EDGE OF THE NARROWING, AND THE ONE MOST WORTH KNOWING ABOUT.
  //
  // `name` is NOT a member of `DOUBLE_QUOTED_KEYS` — only `description` and `argument-hint` are,
  // because those are the only two keys the live corpus writes quoted (17 and 14 occurrences). So
  // ALL FOUR spellings this control used to walk are now refused: the double-quoted form, the
  // single-quoted form, the trailing-whitespace form and the trailing-`#`-comment form. The old
  // reader JOINED each of them to one value, which is what made "length !== 1 means the key genuinely
  // appears twice" a safe inference; the canonical form gets that inference from admission instead,
  // by refusing every spelling that is not a bare plain scalar.
  //
  // MEASURED COST ON THE LIVE KIT: zero. All 17 adapters write `name: grugops-<role>` as a plain
  // scalar, which is what the generator emits. But a hand-written adapter with a quoted name will now
  // be refused, and that is a real constraint a future author must be told about rather than discover.
  //
  // The case is rewritten two-sided: every refused spelling is asserted refused BY NAME, and the
  // plain spelling that the kit actually uses is asserted still GREEN — so the control still proves
  // the oracle does not red on correct content, over the content that can now be correct.
  it("referential integrity: the PLAIN `name` spelling is GREEN, and the four previously-legitimate spellings are REFUSED by name (27-65 narrowing)", () => {
    const REFUSED_NAME_SPELLINGS: readonly [string, string][] = [
      [`"grugops-installer"`, "quoted-on-plain-only-key"],
      [`'grugops-installer'`, "single-quoted"],
      [`grugops-installer   `, "scalar-padding"],
      [`grugops-installer # the installer role`, "plain-scalar-charset"],
    ];
    // Two-sided count, asserted before the walk so a dropped row is visible.
    expect(REFUSED_NAME_SPELLINGS.length).toBe(4);

    for (const [spelling, code] of REFUSED_NAME_SPELLINGS) {
      const m = consistentMirror();
      renameAdapterIdentity(adapterPath(m, "grugops-installer"), spelling);
      const r = runIn(m);
      const o = out(r);
      expect(r.status, `${spelling}: expected a refusal`).not.toBe(0);
      expect(o, `${spelling}: expected [${code}]`).toContain(`[${code}]`);
      expect(o, `${spelling}: must name the file`).toContain(
        ".claude/agents/grugops-installer.md",
      );
    }

    // THE SURVIVING GREEN CONTROL — the spelling the kit actually ships. Without this the case would
    // be an all-red walk, which proves the oracle can fail but not that it can pass.
    const green = consistentMirror();
    renameAdapterIdentity(
      adapterPath(green, "grugops-installer"),
      "grugops-installer",
    );
    const gr = runIn(green);
    const go = out(gr);
    expect(go).not.toContain("FAIL  KIT-03");
    expect(go).toContain(
      "PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names",
    );
    expect(gr.status).toBe(0);
  }, 60_000);

  // ── Smoke — the REAL guard over the REAL tree. ────────────────────────────────────────────────
  //
  // (Phase 27) This case was INVERTED between plans 27-01 and 27-07, deliberately and temporarily.
  // For that window the live tree was structurally broken — 17 roles, one adapter, a grant naming
  // seven agents that resolved to nothing — and from the commit that added
  // guard_referential_integrity the suite told the truth about that instead of reporting a fabricated
  // green, so the assertion read "everything EXCEPT KIT-03 is green, and KIT-03 is the single FAIL".
  // Plan 27-07 generated the 17 adapters and the corrected 16-name grant, so it is FLIPPED BACK here:
  // zero FAIL lines and a clean exit. The RED behaviour it used to prove did not disappear with the
  // flip — it moved into the brokenMirror() fixture case above, which re-creates the pre-27-07 shape
  // explicitly and is therefore permanent.
  //
  // (Plan 29-01) IT IS INVERTED AGAIN, FOR THE SAME REASON AND UNDER THE SAME DISCIPLINE. The tree is
  // now DELIBERATELY RED on exactly two guards — guard_caveman_voice on all 17 blocks and
  // guard_role_clause_uniqueness on 12 clause groups — which is this plan's D-24 acceptance evidence:
  // a guard that passes the moment it appears has never been watched fail. Plans 29-05, 29-06 and
  // 29-07 land the rewrites that turn both green, and this case is FLIPPED BACK then.
  //
  // The inversion is written as a PIN ON THE EXACT TWO, not as a relaxation. The nine untouched
  // guards must still print zero FAIL lines, so a regression anywhere else is reported by name rather
  // than absorbed into an expected-red exit code. That is what keeps a deliberately red gate from
  // becoming a gate nobody reads.
  it("smoke: real tree is RED on EXACTLY the two new voice guards, and green everywhere else (plan 29-01 D-24 evidence)", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    const o = out(r);
    const fails = o.split("\n").filter((l) => l.startsWith("  FAIL"));
    // Assert on the FAIL lines BEFORE the status, so a regression reports WHICH guard broke rather
    // than only that the exit code was non-zero.
    expect(fails).toHaveLength(2);
    expect(fails[0]).toContain("caveman voice: 17 finding(s) over 17 elements");
    expect(fails[1]).toContain(
      "role clause uniqueness: 12 finding(s) over 17 elements",
    );
    expect(r.status).toBe(1);
    expect(o).toContain("2 CHECK(S) FAILED");
    // The 17 per-block measurement lines are present and in listRoles() sorted order, so the
    // transcript embedded in the guard's source header is reproducible byte-for-byte.
    const detail = o
      .split("\n")
      .filter((l) => /^ {8}\S+\.md: tokens \d+ \/ content words \d+, banned \d+$/.test(l));
    expect(detail).toHaveLength(ROLE_COUNT);
    expect(detail.map((l) => l.trim().split(":")[0])).toEqual(listRoles());
    // The oracle is not merely silent — it ran and reported the three-way equality it now holds.
    expect(o).toContain(
      "KIT-03: 17 roles == 17 adapters == 17 grant-closure names",
    );
  });

  // ── cmp — the two config JSONs must be byte-identical (the tri-file drift). ───────────────────
  it("config JSONs byte-identical (config/ == seed/.grugops/)", () => {
    const a = readFileSync(
      join(ROOT, "agent-factory/config/factory.config.json"),
    );
    const b = readFileSync(
      join(ROOT, "agent-factory/seed/.grugops/factory.config.json"),
    );
    expect(a.equals(b)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// (27-65, task 3) THE END-TO-END GATE SWEEP — plan 27-63's historical corpus, planted on the LIVE
// distribution pair, driven through the REAL compiled gate, in BOTH directions.
//
// WHY THIS EXISTS SEPARATELY FROM THE MODULE-LEVEL REPLAY. Plan 27-63 proved every reproduced bypass
// shape from rounds 1-11 lands on a named refusal FROM THE MODULE. That is a property of a module.
// This sweep proves the same rows fail THE SHIPPED GATE, reading its own stdout — the difference
// between "the reader would refuse this" and "the kit refuses this", which is the only difference
// that mattered for eleven rounds. The rows are addressed BY ID from the same corpus, so the
// module-level and gate-level replays cannot disagree about which bytes were tested.
//
// THE TWO-SIDED CLAIM. A gate that reds everything passes a bypass sweep vacuously — D-64's vacuity
// trap 1, and this phase's single most repeated failure. So the premise controls run FIRST and are
// asserted BEFORE any planted result is read: an unplanted mirror exits 0, and a mirror carrying a
// COMMENT-ONLY plant also exits 0. Only then is a refusal believed to be about the plant.
//
// THE 27-64 INTERACTION, RECORDED. With the seven standalone twins now generated and byte-gated, a
// plant on the twin ALONE would also be caught by `freshness:skill-twins`. That is a genuine
// strengthening and worth knowing — but it would make a red here unattributable, so this sweep plants
// on BOTH distribution forms (keeping guard_distribution_pair green) and runs
// check-foundation-guards.js in ISOLATION. The resulting red is the spawn guard's alone.
// ---------------------------------------------------------------------------

// The two distribution forms of ONE non-coordinator skill — the exact pair the round-11 review's own
// gate reproductions used. Derived from the scan rather than restated, so a renamed skill fails here
// by name instead of silently planting into nothing.
const SWEEP_PAIR = [
  "skills/map/SKILL.md",
  ".claude/skills/grugops-map/SKILL.md",
] as const;

// A row's frontmatter payload: its region minus its own `name:` line (the skill keeps its identity),
// with a `tools:` key line rewritten to the skill surface's `allowed-tools` spelling. Returns null
// when the row carries no graftable grant key — those rows are the DELIMITER family, whose shape IS
// the document frame and therefore cannot survive being spliced into another document's frame.
function sweepRowPayload(text: string): string[] | null {
  const lines = text.split("\n");
  if (lines[0] !== "---") return null;
  const close = lines.indexOf("---", 1);
  if (close === -1) return null;
  const body = lines
    .slice(1, close)
    .filter((l) => !/^name:/.test(l))
    .map((l) => l.replace(/^tools:/, "allowed-tools:"));
  if (!body.some((l) => /^allowed-tools:/.test(l))) return null;
  return body;
}

// Splice a payload over a SKILL.md's own `allowed-tools` region, preserving its `name`,
// `description` and `argument-hint`. Returns null if the target has no such region.
function sweepPlant(skillSrc: string, payload: string[]): string | null {
  const lines = skillSrc.split("\n");
  const at = lines.findIndex((l) => /^allowed-tools:/.test(l));
  if (at === -1) return null;
  let end = at + 1;
  while (end < lines.length && /^\s/.test(lines[end]) && lines[end] !== "---") {
    end++;
  }
  return [...lines.slice(0, at), ...payload, ...lines.slice(end)].join("\n");
}

describe("27-65 end-to-end gate sweep: the rounds-1-11 corpus planted on the live distribution pair", () => {
  // ── PREMISE CONTROLS, RECORDED FIRST. ─────────────────────────────────────────────────────────
  it("PREMISE CONTROL 1 — an UNPLANTED mirror exits 0: the gate is strict, not broken", () => {
    const m = mirror();
    const r = runIn(m);
    expect(
      r.status,
      "the unplanted mirror must be GREEN, or every red below is the mirror rather than the plant",
    ).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
    // The pair rule must also be green on the unplanted mirror, since the sweep's attribution claim
    // depends on it staying green through every plant.
    expect(out(r)).toContain("PASS  D-40:");
  });

  it("PREMISE CONTROL 2 — a COMMENT-ONLY plant on both forms exits 0: the sweep measures the PLANT, not the mirror construction", () => {
    const m = mirror();
    for (const rel of SWEEP_PAIR) {
      const p = join(m, rel);
      const src = readFileSync(p, "utf8");
      // A body-level comment: it changes bytes on both sides equally, so the pair rule stays green
      // and nothing about the frontmatter moves.
      writeFileSync(p, `${src}\n<!-- 27-65 premise control: comment-only -->\n`);
      // The plant must have LANDED, or this control proves nothing about the harness.
      expect(readFileSync(p, "utf8")).toContain("27-65 premise control");
    }
    const r = runIn(m);
    expect(
      r.status,
      "a comment-only plant must stay GREEN — otherwise the sweep is measuring mirror construction",
    ).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
  });

  // ── THE SELECTION RULE, STATED AND SELF-VERIFYING. ────────────────────────────────────────────
  //
  // A row is GATE-PLANTABLE iff (a) its document carries a graftable grant key, and (b) the SPLICED
  // document refuses under the SAME enumerated code the row declares. Clause (b) is what makes the
  // rule a rule rather than a taste: it mechanically guarantees the plant still tests the shape the
  // row is about, so a row whose construct is destroyed by the graft is excluded BY MEASUREMENT
  // rather than by judgement. Rows failing either clause are recorded MODULE-ONLY with the reason.
  //
  // Measured: 79 gate-plantable, 12 module-only, 91 total. The 12 are the delimiter family — rows
  // whose bypass IS the document frame (a BOM, a directive, a four-dash head line), which cannot
  // survive being grafted into another document's frame and are therefore proven at module level by
  // 27-63 and nowhere else.
  const sweepSplit = () => {
    const skill = readFileSync(join(ROOT, SWEEP_PAIR[0]), "utf8");
    const planted: { row: (typeof CORPUS)[number]; payload: string[] }[] = [];
    const moduleOnly: { id: string; why: string }[] = [];
    for (const row of CORPUS) {
      const payload = sweepRowPayload(row.text);
      if (payload === null) {
        moduleOnly.push({
          id: row.id,
          why: "no graftable grant key — the row's construct is the document frame itself",
        });
        continue;
      }
      const doc = sweepPlant(skill, payload);
      if (doc === null) {
        moduleOnly.push({ id: row.id, why: "target skill has no allowed-tools region" });
        continue;
      }
      const a = admit(doc);
      if (a.ok) {
        moduleOnly.push({ id: row.id, why: "the grafted form ADMITS — shape not preserved" });
        continue;
      }
      if (a.code !== row.expected) {
        moduleOnly.push({
          id: row.id,
          why: `the grafted form refuses as ${a.code}, not ${row.expected} — shape not preserved`,
        });
        continue;
      }
      planted.push({ row, payload });
    }
    return { planted, moduleOnly };
  };

  it("the planted / module-only split reconciles TWO-SIDED against the corpus total — no row is silently dropped", () => {
    const { planted, moduleOnly } = sweepSplit();
    expect(planted.length, "gate-plantable rows").toBe(79);
    expect(moduleOnly.length, "module-only rows").toBe(12);
    // THE TWO-SIDED EQUALITY. A row appearing in NEITHER bucket is a silent drop, which is the
    // failure this assertion exists to make impossible.
    expect(planted.length + moduleOnly.length).toBe(CORPUS.length);
    expect(CORPUS.length).toBe(CORPUS_COUNT);
    // Every module-only row carries a stated reason; a reason-less exclusion is an unexplained one.
    for (const m of moduleOnly) {
      expect(m.why.length, `${m.id}: module-only rows must carry a reason`).toBeGreaterThan(20);
    }
    // THE FOUR DOCUMENTS D-64 NAMES, plus their gate-reproduction spellings, must all be PLANTED —
    // they are the two findings 27-VERIFICATION.md records and the two D-64 dissolves. Asserted by
    // ID against the corpus, so this cannot pass over a differently-spelled near-twin.
    const plantedIds = new Set(planted.map((p) => p.row.id));
    for (const id of [
      "r11-cr01-a-explicit-digit",
      "r11-cr01-b-no-digit",
      "r11-cr01-gate-a",
      "r11-cr01-gate-b",
      "r11-cr02-alias-through-compact-mapping",
      "r11-cr02-dashless-control",
      "r11-cr02-gate",
    ]) {
      expect(rowById(id), `${id} must exist in the corpus`).toBeDefined();
      expect(plantedIds.has(id), `${id} must be GATE-planted, not module-only`).toBe(true);
    }
  });

  // ── THE SWEEP ITSELF. ─────────────────────────────────────────────────────────────────────────
  it("every gate-plantable corpus row moves the gate from exit 0 to exit 1, with the refusal TEXT read from the gate's own output", () => {
    const { planted } = sweepSplit();
    expect(planted.length, "a sweep over zero rows proves nothing").toBeGreaterThan(0);

    const transcript: string[] = [];
    for (const { row, payload } of planted) {
      const m = mirror();

      // EXIT CODE BEFORE THE PLANT, on this very mirror. Recorded per row rather than once, so a
      // mirror that was broken before the plant cannot be reported as a row that failed because of it.
      const before = runIn(m);
      expect(before.status, `${row.id}: the pre-plant mirror must be GREEN`).toBe(0);

      // Plant on BOTH distribution forms so guard_distribution_pair stays green and the red is
      // attributable to the spawn guard alone.
      for (const rel of SWEEP_PAIR) {
        const p = join(m, rel);
        const doc = sweepPlant(readFileSync(p, "utf8"), payload);
        expect(doc, `${row.id}: ${rel} has no allowed-tools region to plant into`).not.toBeNull();
        writeFileSync(p, doc as string);
        // THE PLANT MUST HAVE LANDED IN THE FILE THE GATE READS. A plant that did not land produces
        // a convincing green, and this phase has been fooled by exactly that. Re-read from disk and
        // confirm a distinctive byte-run of the payload is present.
        const reread = readFileSync(p, "utf8");
        const witness = payload.find((l) => l.trim().length > 3) as string;
        expect(reread, `${row.id}: the plant did not land in ${rel}`).toContain(witness);
      }

      const after = runIn(m);
      const o = out(after);

      // EXIT CODE AFTER: 0 -> 1. The direction is the claim.
      expect(after.status, `${row.id}: the planted mirror must be RED`).not.toBe(0);

      // THE REFUSAL TEXT, READ FROM THE GATE'S OUTPUT — not merely the exit code. The code and the
      // reason both appear, and both name the canonical-form refusal rather than a no-grant verdict.
      expect(o, `${row.id}: expected the code [${row.expected}]`).toContain(`[${row.expected}]`);
      expect(o, `${row.id}: the refusal must name the file`).toContain(SWEEP_PAIR[0]);
      expect(o, `${row.id}: a refusal is NEVER "carries no grant"`).toMatch(
        /NEVER read as "carries no grant"/,
      );

      // ATTRIBUTION — AND A PLACE THE PLAN'S OWN PREMISE WAS FALSIFIED BY MEASUREMENT.
      //
      // 27-65-PLAN.md task 3 says to plant on both distribution forms "so guard_distribution_pair
      // stays green and the resulting red is attributable to the spawn guard alone". That was true
      // for the round-11 reproductions this sweep inherits, because back then the pair rule read
      // frontmatter through a parser that SUCCEEDED on these documents and simply compared the two
      // sides byte for byte.
      //
      // It is no longer true, and it is no longer true BECAUSE OF THE CUTOVER THIS SAME PLAN
      // MANDATES. Task 2 moved guard_distribution_pair onto the admission reader as its third verdict
      // call site, so a non-canonical document now refuses there too. The plan asks for two things
      // that cannot both hold; the measurement wins, and the attribution claim is made in the form
      // that is actually true rather than the form the plan predicted.
      //
      // WHAT IS ASSERTED INSTEAD IS STRICTLY STRONGER THAN "exactly one FAIL". The EXACT SET of
      // failing checks is pinned at {WR-05, D-40} — so KIT-03, the kit counts, the adapter bodies and
      // every other guard must stay green — AND the pair rule's failure is asserted to be the SAME
      // canonical-form refusal rather than a divergence finding. That last assertion is what
      // preserves the original intent of planting both sides: the twins really did stay in sync, and
      // the red is about the planted bytes, not about the pair drifting apart.
      const fails = o.split("\n").filter((l) => l.startsWith("  FAIL"));
      expect(
        fails.length,
        `${row.id}: expected exactly TWO failing checks (WR-05 + D-40, both reading the same admission reader), got:\n${fails.join("\n")}`,
      ).toBe(2);
      expect(fails.some((l) => l.includes("WR-05")), `${row.id}: WR-05 must fail`).toBe(true);
      expect(fails.some((l) => l.includes("D-40")), `${row.id}: D-40 must fail`).toBe(true);
      // The pair rule refused for the SAME reason — not because the two forms diverged. A divergence
      // finding here would mean the plant landed unevenly and the sweep would be measuring its own
      // fixture rather than the corpus row.
      expect(
        o,
        `${row.id}: the twins must NOT be reported as diverging — the plant landed evenly on both`,
      ).not.toContain("DIVERGE beyond the `name` value");

      // Capture the reason line for the transcript the summary reproduces.
      const reasonLine = o
        .split("\n")
        .find((l) => l.includes(`[${row.expected}]`) && l.includes(SWEEP_PAIR[0]));
      transcript.push(`${row.id} | ${row.expected} | ${(reasonLine ?? "").trim().slice(0, 200)}`);
    }

    // PRINT THE PER-ROW TRANSCRIPT. An exit code alone is not the claim; the refusal text is.
    process.stdout.write(
      `\n27-65 GATE SWEEP — ${transcript.length} row(s), each 0 -> 1 with the refusal text read from the gate:\n${transcript.join("\n")}\n`,
    );
  }, 600_000);

  // ── RESTORATION, PROVEN. ──────────────────────────────────────────────────────────────────────
  it("the sweep leaves NO residue — the committed tree's verdict is UNCHANGED by it", () => {
    // Every plant above went into a temp mirror via CHECK_ROOT; nothing outside tmpdir was written.
    // Proven rather than asserted in a comment: run the gate on the REAL tree with no override.
    //
    // (Plan 29-01) The expected verdict is the tree's deliberate 2-FAIL red, not exit 0 — see the
    // smoke case above. What this asserts is that no guard the sweep touches moved: guard_wr05 is
    // still PASS, and the only two failures are the two voice guards this plan landed.
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    const fails = out(r)
      .split("\n")
      .filter((l) => l.startsWith("  FAIL"));
    expect(
      fails.map((l) => l.split(":")[0].replace("  FAIL  ", "")),
      "the sweep must leave the tree's verdict exactly as it found it",
    ).toEqual(["caveman voice", "role clause uniqueness"]);
    expect(r.status).toBe(1);
    expect(out(r)).toContain(
      "WR-05: exactly one coordinator holds the spawn grant",
    );
    // And the two files the sweep plants into are byte-unchanged on disk.
    for (const rel of SWEEP_PAIR) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src, `${rel} must carry no planted residue`).not.toContain("Agent(grugops-orchestrator)");
    }
  });
});
