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
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";

// (27-65 task 3) The gate-level sweep plants rows from plan 27-63's corpus BY ID, and adjudicates
// which rows are graftable with the same admission reader the gate now uses — so the module-level
// replay and the gate-level replay cannot disagree about which bytes were tested.
import { CORPUS, CORPUS_COUNT, rowById } from "./canonical-corpus.js";
import {
  admit,
  admittedValuesFor,
  CANONICAL_SCHEMA,
} from "./canonical-frontmatter.js";
// (Plan 29-20) The per-line fence toggle, taken so the CR-02 plant's PREMISE is measured through the
// same authority the reader composes rather than through a second opinion written in the harness.
// The harness's own premise produced a false result in six instances across four straight rounds, so
// it is asserted, never assumed.
import { fencedLineFlags } from "./frontmatter.js";

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
  CLAUSE_MIN_WORDS,
} from "./voice-model.js";

import {
  listRoles,
  listAgentAdapters,
  listSkillAdapters,
  listPluginSkillAdapters,
  listPluginExemptComponentFiles,
  pluginForbiddenComponentSubpaths,
  spawnGrantScan,
  spawnGrantScanPrefix,
  SPAWN_GRANT_SCAN_PARTS,
  ROLE_COUNT,
  PLUGIN_SKILL_ADAPTER_COUNT,
  PLUGIN_MANIFEST_COMPONENT_COUNT,
} from "./kit-model.js";

// (Plan 29-33) Arm A of the SEC_VOICE per-member property floor. The ONE derivation of the safety
// surface (register rows flagged `safety_surface: yes` ∪ registry rows of `kind: safety`), imported
// and consumed exactly as scripts/check-diff-disposition.ts already consumes it — never re-derived
// here, and never read back out of its RENDERED document, which would be a second parser over a
// question this function already answers.
import { safetySurfaceUnion } from "./generate-safety-surface.js";

// (Plan 29.1-04) The model authority, imported so the guard_model_assignment cases assert their
// plants' premises through the SAME functions the guard resolves with — never through a second
// opinion written in the harness. This repository's own harness produced a false result in six
// instances across four straight rounds; a premise measured with a different rule than the guard
// applies is that failure one step earlier.
import {
  readModelsConfig,
  resolveModels,
  tieredCorpusRefusals,
} from "./model-tiers.js";

const ROOT = join(import.meta.dirname, "..");
const GUARD_JS = join(ROOT, "scripts", "check-foundation-guards.js");

// (Plan 29.1-09, IN-04) The stray-pin arm's denominator, DERIVED HERE THE SAME WAY THE GUARD DERIVES
// IT — by partitioning the one spawn-grant scan composition on the `agent` prefix — rather than typed
// as a literal that must agree with another literal. The case below asserts the partition's parts
// against their listers, so this constant cannot be short without something going red.
const NON_AGENT_SURFACE_COUNT = spawnGrantScan(ROOT).filter(
  (f) => !f.startsWith(spawnGrantScanPrefix("agent")),
).length;

// ---------------------------------------------------------------------------
// (Plan 29-05) THE TWO VOICE-GUARD COUNTS, DERIVED FROM THE LIVE TREE.
//
// Plan 29-01 landed both guards RED and pinned their finding counts as the literals 17 and 12 — its
// own transcript. Plans 29-05, 29-06 and 29-07 each rewrite a batch of role files, and each one
// MOVES BOTH NUMBERS. A hand-typed literal would go stale three times, and "retype the number until
// the suite is green" is the reflex that lets a real regression through wearing an expected change's
// clothes. This repository has diagnosed set-literal drift as one of its two systemic failure
// classes; a stale count literal is that defect one scalar down.
//
// These helpers ask the SAME question the guards ask, of the SAME corpus, through the SAME
// authorities in voice-model.js. They are declared ONCE and read by both consumers below, so the two
// cases cannot come to disagree about what a red block is.
//
// A derivation is not evidence on its own — each consumer fences it with a non-vacuity floor and
// with plan 29-01's RED baseline as a ceiling, so a silently-zero derivation fails and an INCREASE
// in findings is reported as the regression it would be.
// ---------------------------------------------------------------------------
//
// (Plan 29-07) THE FLIP-BACK, AND WHY THE DERIVATIONS SURVIVED IT. This plan rewrote the last two
// role files, so both derivations now return ZERO and 29-05's non-vacuity floor failed — exactly as
// it was built to. That failure is the mechanism working: nobody could reach green here by retyping
// a literal, because there was no literal to retype. The helpers are KEPT and their consumers'
// direction is REVERSED, so a future edit that reintroduces a banned construction or a duplicate
// clause fails BOTH the derivation and the guard's own line.
//
// They are also PARAMETERIZED BY ROOT. The falsifiability case below used to lean on the live tree
// being red, which made a permanent proof depend on a transient corpus state; it now plants its own
// red and counts it here, through the same authorities, at whatever root it planted into.
//
// ---------------------------------------------------------------------------------------------
// (Plan 29-14, closing IN-01) THE ROOT IS THREADED THROUGH THE LISTER, NOT ONLY THROUGH THE READ.
//
// `roleTextsIn(root)` used to call `listRoles()` with NO ARGUMENT — so it took the NAMES from the
// real repository and then read those names FROM `root`. On the live tree the two roots coincide and
// the bug is invisible; on a MIRROR whose role set differs it measures a set the guard did not. A
// role planted into a mirror was silently absent from every count computed here, and a role deleted
// from a mirror would have thrown instead of being counted as gone.
//
// That is not an ordinary off-by-one. This harness is the INSTRUMENT that proves every voice fix in
// this round, and an instrument deriving its membership from a tree other than the one it measures
// fabricates evidence without anyone lying. Phase 27 recorded the verification harness producing a
// FALSE result in six instances across four straight rounds, and project memory names asserting the
// harness's own premise as the standing remedy — so `roleNamesIn` below is not merely called, it is
// PINNED by a case that plants an eighteenth role into a mirror and requires the derivation to see
// it. A derivation that silently returned the live set fails that case by MEMBERSHIP and by NUMBER.
//
// Every helper that reads role bytes out of a passed-in root now flows through `roleNamesIn(root)`
// and through `rolePath`, so the names and the bytes come from one place and the role directory is
// spelled once. The call sites that still list WITHOUT a root are the ones that deliberately measure
// the LIVE tree, and each says so at its own site.
// ---------------------------------------------------------------------------------------------

// Repo-relative path of a role file inside a mirror (or the real tree). Every plant case below goes
// through this helper rather than restating the directory, so the role directory is named in exactly
// one more place than the derivation itself — the set-literal drift this phase exists to delete.
//
// (Plan 29-25, IN-03) THE DIRECTORY IS NOW A CONSTANT AND EVERY SPELLING DERIVES FROM IT. Round 1
// introduced `rolePath` with exactly this argument and then left THREE plant sites spelling the
// directory inline — `plantCavemanBlock`, the LANG-07 oracle loop and the vacuity case — plus five
// repo-relative restatements built by template literal. A helper that is bypassed is not a single
// source of truth; it is a fourth spelling with better manners. Both forms now come from
// `ROLE_DIR_REL`: `rolePath` for a filesystem path under some root, `roleRel` for the repo-relative
// form the guards PRINT. A directory rename that misses one of them can no longer leave the harness
// planting into a path the guard does not read.
const ROLE_DIR_REL = "agent-factory/roles";

const rolePath = (root: string, name: string): string =>
  join(root, ROLE_DIR_REL, name);

/** The repo-relative form of a role file — what the guards print in a finding. */
const roleRel = (name: string): string => `${ROLE_DIR_REL}/${name}`;

/** THE role membership of a given root. Names and bytes below both come from here. */
const roleNamesIn = (root: string): string[] => listRoles(root);

const roleTextsIn = (root: string): string[] =>
  roleNamesIn(root).map((n) => readFileSync(rolePath(root, n), "utf8"));

/**
 * Does ONE role file's caveman block fail EITHER arm? Declared as a predicate over TEXT rather than
 * inlined into the fold below, so the premise case can ask the same question of the bytes it plants
 * and derive that plant's CONTRIBUTION to the count independently of the loop that consumes it.
 */
function voiceRed(text: string): boolean {
  const v = readCavemanFence(text);
  if (!v.ok) return true;
  const b = countBannedConstructions(v.inside);
  return (
    countLexiconTokens(v.inside) < CAVEMAN_LEXICON_MIN ||
    b.article + b.copula + b.modal + b.subordinator !== 0
  );
}

/** Role files whose caveman block fails EITHER arm — the guard_caveman_voice finding count. */
function voiceRedCountIn(root: string): number {
  return roleTextsIn(root).filter(voiceRed).length;
}

// Deliberately the LIVE tree: the two ceiling consumers below are claims about the REAL corpus
// against plan 29-01's recorded baseline, not about any mirror.
const derivedVoiceRedCount = (): number => voiceRedCountIn(ROOT);

/** Intra-file repeated normalized clauses in ONE text — the same per-text/per-root split. */
function clauseGroups(text: string): number {
  const groups = new Map<string, number>();
  for (const { clause } of segmentClauses(text))
    groups.set(clause, (groups.get(clause) ?? 0) + 1);
  return [...groups.values()].filter((c) => c > 1).length;
}

/** Intra-file repeated normalized clauses, summed over roles — the uniqueness finding count. */
function clauseGroupCountIn(root: string): number {
  return roleTextsIn(root).reduce((n, t) => n + clauseGroups(t), 0);
}

// Deliberately the LIVE tree, for the same reason as `derivedVoiceRedCount`.
const derivedClauseGroupCount = (): number => clauseGroupCountIn(ROOT);

/** Plan 29-01's RED baseline. The rewrites only ever REMOVE findings, so these are ceilings. */
const VOICE_RED_BASELINE_29_01 = 17;
const CLAUSE_GROUP_BASELINE_29_01 = 12;

// (Phase 27 / KIT-01) The role portion of the harness's own input set is DERIVED. GUARD_INPUTS was
// itself a hand-maintained list of exactly the drift class this phase deletes: 17 role literals that
// had to be edited in lockstep with the guard's ROLE_FILES and the kit on disk. It is now built from
// the same authority the guard uses, so a mirror can never be missing a role the guard will scan.
// The NON-role entries stay explicit literals on purpose — they are a curated set of unrelated
// surfaces (AGENTS.md, the two adapters, the two packaging templates, the SEC_VOICE surfaces, the
// workflows, the .planning/ Tier-1 oracle inputs), not a directory listing, so there is nothing to
// derive them from.
//
// (Plan 29-14, IN-01 class audit) Deliberately rootless. This is the mirror's COPY MANIFEST: it names
// which files are read OUT OF the live tree and written INTO a fresh mirror, so the live tree IS the
// root under measurement here. Asking a not-yet-populated mirror for its role set would be circular.
const DERIVED_ROLE_INPUTS = listRoles().map(roleRel);

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
// every line under CLAUSE_MIN_WORDS once normalized, so the block contributes no clause of its own
// and cannot manufacture a uniqueness finding while repairing a voice one.
//
// Every token is INTERPOLATED FROM THE AUTHORITY, never retyped: a literal here would be a second
// copy of the lexicon living in the file that polices the first. The indices are commented because a
// reordering of CAVEMAN_LEXICON must be visible; if one ever ceased to conform, normalizeMirroredRole
// re-measures and THROWS rather than quietly shipping a broken baseline, and the pin case below
// asserts all three properties directly.
const CONFORMING_CAVEMAN_BLOCK = [
  `You ${CAVEMAN_LEXICON[0]}.`, // grug
  `You ${CAVEMAN_LEXICON[4]} ${CAVEMAN_LEXICON[2]}.`, // smash rock
  `You ${CAVEMAN_LEXICON[8]}.`, // no think
];

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

const MIRRORED_ROLE_PREFIX = `${ROLE_DIR_REL}/`;

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

// (Plan 29-01) There used to be a `rawMirror()` here: an UNREPAIRED, byte-faithful copy of the tree
// at HEAD. Its single consumer was the `||` falsifiability proof, which needed the same RED inputs
// fed to two different builds, and back then the tree itself was red on all 17 blocks so a faithful
// copy was a red fixture for free.
//
// (Plan 29-07) IT IS DELETED, because the property it relied on is gone. The corpus is now green, so
// a byte-faithful mirror is a GREEN fixture, and the proof it served would have degraded into two
// identical green transcripts matching trivially — passing while proving nothing. `allRedMirror()`
// below replaces it by PLANTING the red rather than borrowing it, which is the same fixture argument
// one level more durable. Keeping a fixture whose discriminating power depends on the corpus staying
// broken is the shape this repository has corrected before; it is not kept here for symmetry.

// (Plan 29-07) A block that fails BOTH arms and contributes NO clause of its own. Zero lexicon terms
// (positive arm fails) and one copula (negative arm fails), and it normalizes to two words — below
// CLAUSE_MIN_WORDS — so planting it cannot create or mask a uniqueness finding. Its two-sidedness is
// asserted from the authorities in `allRedMirror()` rather than trusted from this comment.
const BOTH_ARMS_FAILING_BLOCK: readonly string[] = ["You are here."];

// (Plan 29-07) A mirror on which guard_caveman_voice is RED for EVERY role, by construction.
//
// It replaces the use `rawMirror()` used to serve. Until this plan the tree at HEAD was itself red on
// all 17 blocks, so a byte-faithful copy of it was a red fixture for free — and the falsifiability
// proof below leaned on that. The rewrite turned the corpus green, which would have quietly reduced
// that proof to two GREEN transcripts matching trivially. Planting the red makes the fixture
// permanent and independent of whatever the corpus says next.
//
// A block failing both arms is red under the committed conjunction AND under the `||` mutant, which
// is precisely the property the transcript comparison needs.
function allRedMirror(): string {
  const m = mirror();
  // (Plan 29-14, IN-01 class audit) Rooted at the MIRROR. This loop plants into `m`, so it must
  // enumerate `m`'s roles — a rootless listing would silently skip any role the mirror carries and
  // the live tree does not, leaving an unplanted GREEN file inside a fixture whose whole claim is
  // that every role is red.
  for (const role of roleNamesIn(m)) {
    plantCavemanBlock(m, role, [...BOTH_ARMS_FAILING_BLOCK]);
  }
  // The plant is two-sided by ASSERTION, not by assumption — measured through the same authorities
  // the guard reads, so a lexicon or banned-set change that made this block conforming fails loudly
  // here instead of silently turning the fixture green.
  const planted = BOTH_ARMS_FAILING_BLOCK.join("\n");
  const bannedIn = countBannedConstructions(planted);
  if (countLexiconTokens(planted) >= CAVEMAN_LEXICON_MIN) {
    throw new Error("allRedMirror: the planted block passes the POSITIVE arm");
  }
  if (
    bannedIn.article + bannedIn.copula + bannedIn.modal + bannedIn.subordinator ===
    0
  ) {
    throw new Error("allRedMirror: the planted block passes the NEGATIVE arm");
  }
  if (segmentClauses(planted).length !== 0) {
    throw new Error("allRedMirror: the planted block contributes a clause");
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
  // (Plan 29-25, IN-03) Through the helper, never the directory spelled again — see `rolePath`.
  const file = rolePath(root, role);
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
//
// (Plan 29-14, IN-01 class audit) ROOT-TAKING. Both consumers below (`brokenMirror`,
// `consistentMirror`) delete or write adapter files INSIDE a mirror while enumerating this set, which
// is the same shape as the reported defect one namespace over: a rootless listing would leave a
// mirror-only role's adapter untouched by `brokenMirror`'s deletion sweep, so the RED fixture would
// silently ship an intact adapter and the guard would convict it for the wrong reason.
const COORDINATOR = "grugops-orchestrator";
const roleAgentNames = (root: string): string[] =>
  roleNamesIn(root).map((f) => `grugops-${f.replace(/\.md$/, "")}`);
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

// (Plan 29-29, closing V-29-26-02 for the LANG-07 owner scan) The same enumeration made RECURSIVE
// and rooted at the repository rather than at `scripts/`, returning REPOSITORY-RELATIVE paths.
//
// `nonTestScripts()` above reads one directory non-recursively — 41 of the 49 tracked non-test
// modules — while the owner scan built on it called itself "tree-wide" in its case name, its refusal
// wording and its prose. A claim wider than the assertion behind it is this repository's named
// defect class; the remedy it already uses is to widen the ASSERTION. `nonTestScripts()` itself is
// deliberately left alone: four other cases in this file are scoped to `scripts/` on purpose (the
// D-64 cutover pins, the parser-consumer pins), and silently re-rooting them would be a second,
// unexamined change riding on this one.
// The skip rule is "any DOT-directory, plus the three build/dependency directories", and the first
// half is load-bearing rather than tidiness. The first draft named `.git` and `.planning` explicitly
// and the walk then read `.tmp-build/` — the scratch tree `npm run freshness` rebuilds into — which
// carries a full second copy of every compiled module. It happened not to disturb the `.ts`
// enumeration because that directory holds only `.js`, and it disturbed the `.js` enumeration
// immediately. The premise assertion against git's own index is what caught it; a walk trusted
// rather than compared would have reported forty-eight phantom modules as a clean measurement.
const MODULE_WALK_SKIP = new Set(["node_modules", "dist", "coverage"]);
const skipWalkEntry = (name: string): boolean =>
  name.startsWith(".") || MODULE_WALK_SKIP.has(name);
const walkNonTestModules = (dir: string, rel: string, acc: string[]): string[] => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipWalkEntry(entry.name)) continue;
    const next = rel === "" ? entry.name : `${rel}/${entry.name}`;
    if (entry.isDirectory()) walkNonTestModules(join(dir, entry.name), next, acc);
    else if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".d.ts")
    ) {
      acc.push(next);
    }
  }
  return acc;
};
/** Every non-test TypeScript module in the tree, as a repository-relative path. */
const nonTestModules = (root: string = ROOT): string[] =>
  walkNonTestModules(root, "", []).sort();

// The symbols one module imports from another, with comments stripped so a NAME MENTIONED IN PROSE
// inside the import block cannot satisfy or falsify a membership test. Returns [] when the module
// does not import from that specifier at all.
const importedSymbols = (file: string, specifier: string): string[] =>
  importedSymbolsAt(`scripts/${file}`, specifier);

/**
 * (Plan 29-29) The same reader, taking a REPOSITORY-RELATIVE path and a specifier at any depth.
 *
 * `importedSymbols` above resolved against `scripts/` and matched only a `./`-prefixed specifier, so
 * a consumer in `hooks/` or `scripts/runnable-ref/` importing `../scripts/frontmatter.js` was
 * invisible to every scan built on it — the consumer half of V-29-26-02. The specifier match is
 * `[./]${name}.js`, which admits `./frontmatter.js` and `../scripts/frontmatter.js` while still
 * refusing `./canonical-frontmatter.js`: the character before the name must be a dot or a slash, and
 * in that spelling it is a hyphen. `importedSymbols` now DELEGATES here rather than carrying a
 * second copy of the parse, and a case in the LANG-07 block compares the two over the whole overlap.
 */
const importedSymbolsAt = (rel: string, specifier: string): string[] => {
  const src = readFileSync(join(ROOT, rel), "utf8");
  const re = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*["'][^"']*[./]${specifier}\\.js["']`,
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
    //
    // (Plan 29-03) AND FROM FIVE TO SIX, IN THE SAME DIRECTION AND FOR THE SAME REASON.
    // `check-imperative-lexicon.ts` imports exactly ONE symbol — `fencedLineFlags`, the per-line
    // projection of the one fence state machine — and no verdict-bearing symbol at all. The new gate
    // reports `file:line`, so it needs to know which lines are inside a fence WITHOUT losing their
    // positions, and `stripFencedBlocks` drops lines. The answer was to make the existing machine
    // answer per line and express the strip through it, NOT to write a fourth machine in the
    // consumer: the derived fence-machine set in scripts/frontmatter.test.ts is still THREE.
    //
    // (Plan 29-16, WR-06) AND FROM SIX TO SEVEN, IN THE SAME DIRECTION AND FOR THE SAME REASON.
    // `check-diff-disposition.ts` imports exactly ONE symbol — `fencedLineFlags`, the same per-line
    // projection — and no verdict-bearing symbol at all. Its `locateSection` decided where a frozen
    // section ENDS with a bare `## ` scan, so a heading quoted inside a fenced example truncated the
    // region and everything below it silently fell out of the freeze. That is a SECOND GRAMMAR over
    // bytes this module already answers for, and the fix is to consume the existing toggle rather
    // than to widen a second one: the fence-machine set in scripts/frontmatter.test.ts is STILL
    // THREE, and this list grows only by a consumer that takes a declaration.
    //
    // (Plan 29-18, WR-06) AND FROM SEVEN TO EIGHT — the LAST of the three locators the review named.
    // `check-banned-claims.ts` imports exactly ONE symbol, `fencedLineFlags`, and no verdict-bearing
    // symbol at all. Its `locateExemptRegion` decided BOTH of its section-extent questions with a
    // bare heading scan, so a `## ` line inside a fenced example truncated the one named exemption
    // region and a fenced QUOTATION of the region heading counted toward the exactly-one assertion.
    // Note the direction, because it is NOT the same as its sibling two entries above: a truncated
    // EXEMPTION region is fail-CLOSED (more of the document gets checked), while 29-16's truncated
    // FROZEN region was fail-OPEN (less gets protected). Both are one grammar too many; only one of
    // them was dangerous. The fence-machine set in scripts/frontmatter.test.ts is STILL THREE.
    //
    // (Plan 29-25, LANG-07) AND FROM EIGHT TO NINE — the FIFTH section locator, and the one that was
    // logged three times and fixed by none of the three plans that logged it. `audit-model.ts` imports
    // three symbols — `fencedLineFlags`, `sectionEndIndex`, `unfencedHeadingIndex` — and no
    // verdict-bearing symbol at all. Its `tableUnder` answered the section-extent question THREE
    // private ways: a `trim()` whole-line equality for the anchor, a `startsWith("## ")` break for the
    // close, and no fence awareness at either. 29-22 logged it, 29-23 re-logged it, 29-24 named it the
    // only known survivor of the class, and all three left it out of scope. Plan 29-25 turns LANG-07
    // into a DERIVED tree-wide scan, and a derivation whose file set is chosen so the answer comes out
    // right is the defect that scan exists to close — so the fifth locator is closed rather than
    // exempted. Measured on the live register before and after: 37 Table A rows and 32 Table B
    // findings, unchanged, with `check-audit-register`'s transcript byte-identical.
    //
    // (Plan 29-35, LANG-07 — 29-REVIEW § WR-08) AND FROM NINE TO TEN. `generate-catalog.ts` imports
    // exactly two symbols — `sectionEndIndex` and `unfencedHeadingIndex` — and no verdict-bearing
    // symbol at all. It carried a private `new RegExp` lookahead grammar for the section extent, the
    // THIRD grammar over these bytes, duplicated byte-for-byte into `generate-role-adapters.ts`.
    // Fence-blind AND level-blind: its terminator named level two only, so a level-ONE heading did not
    // close the section — byte-for-byte the defect `voice-model.ts` shipped. Both copies are DELETED
    // rather than taught the two missing rules (D-24). The direction matters: this module COMPOSES the
    // shipped catalogue rows, so a truncated capture is a wrong published row, and the freshness gate
    // would then require the wrong bytes to be committed.
    //
    // THIS PIN MOVING IS THE PIN WORKING. It went red the moment the eighth consumer landed, which is
    // exactly what a two-sided list is for — the number is moved here to acknowledge a change that was
    // made on purpose, never to clear a failure.
    expect(consumers).toEqual([
      "audit-model.ts",
      "canonical-frontmatter.ts",
      "check-banned-claims.ts",
      "check-diff-disposition.ts",
      "check-foundation-guards.ts",
      "check-imperative-lexicon.ts",
      "generate-catalog.ts",
      "generate-role-adapters.ts",
      "generate-skill-twins.ts",
      "voice-model.ts",
    ]);
    // (Plan 29-35) …and `generate-catalog.ts`'s OWN set, pinned like every other locator consumer's.
    //
    // (Plan 29-40, G-29-1 / V-29-35-01) THE SET MOVED FROM TWO SYMBOLS TO THE SIBLING'S THREE, AND
    // THE TWO SENTENCES THAT USED TO JUSTIFY THE SHORTER SET ARE WITHDRAWN RATHER THAN RE-VALUED.
    // What stood here claimed that "the parser renders no catalogue row", and the pin's own message
    // said the module must take the locator "and nothing else". BOTH WERE FALSE WHEN THEY WERE
    // WRITTEN. This generator has always parsed frontmatter — it read `tier`, `order` and `cadence`
    // out of a PRIVATE flat `key: value` copy declared at its own line 51, which is precisely why the
    // set looked complete at two symbols: a duplicate grammar is invisible to an IMPORT pin. G-29-1
    // is the record of that, and V-29-35-01 escalated it out of plan 29-35's scope.
    //
    // THE PIN MOVING IS THE PIN WORKING, in the direction D-24 wants: the module took the authority,
    // so the set grew. It is raised only after the module changed, never to clear a red. The two
    // generators' sets are now IDENTICAL because the two deleted grammars were the same defect —
    // the sibling's was deleted in plan 27-23 (WR-03) and this one in plan 29-40, and a set that
    // gained the authority on one side only would itself be the finding.
    //
    // All three symbols remain DECLARATIVE: two integer indices and one discriminated parse result.
    // What an index MEANS for a kit document, and what a missing, duplicated or unreadable `tier:`
    // MEANS for a catalogue row, are both still decided in that generator. It takes NO fence symbol,
    // because it asks no per-line fence question of its own: the fence-awareness it needs is already
    // inside the locator functions and inside the parser.
    expect(
      importedSymbols("generate-catalog.ts", "frontmatter"),
      "generate-catalog.ts must take the frontmatter authority AND the shared section LOCATOR — never a private `parseFrontmatter` of its own (G-29-1) and never a `new RegExp` section-extent grammar of its own (plan 29-35). Byte-identical to the sibling generator's set, because the two deleted grammars were the same defect",
    ).toEqual(["parseFrontmatter", "sectionEndIndex", "unfencedHeadingIndex"]);
    // …and the SIBLING generator's own set, which moved from one symbol to three in the same plan and
    // for the same reason. It keeps `parseFrontmatter` — it has taken the frontmatter authority since
    // WR-03 (plan 27-23) — and adds the two locator functions. THE PIN MOVING IS THE PIN WORKING.
    // Both generators had to move together: the two deleted grammars were byte-identical, so a set
    // that gained one replacement and not the other would itself be the finding.
    expect(
      importedSymbols("generate-role-adapters.ts", "frontmatter"),
      "generate-role-adapters.ts must take the frontmatter authority AND the shared section LOCATOR — never a `new RegExp` section-extent grammar of its own, which is the third-grammar shape plan 29-35 deletes",
    ).toEqual(["parseFrontmatter", "sectionEndIndex", "unfencedHeadingIndex"]);
    // (Plan 29-20, CR-02 + WR-01) AND `voice-model.ts`'s OWN SET MOVED FROM ONE SYMBOL TO FOUR — in
    // the direction D-24 wants, which is why the PIN moves rather than the code. THE PIN MOVING IS
    // THE PIN WORKING: it went red the moment the module took more from the authority, which is
    // exactly what a two-sided list is for.
    //
    // The module used to carry a PRIVATE `/^## /` section-end constant and a PRIVATE raw-line anchor
    // regex beside the imported delimiter class. That private section-end predicate was one of the
    // four disagreeing section locators the round-2 review tabulated, and the raw-line anchor scan was
    // WR-01. Both are DELETED. The bound now comes from `sectionEndIndex`, the anchor's position from
    // `unfencedHeadingIndex`, and the anchor COUNT from `fencedLineFlags` — a count is not a first
    // index, so it takes the per-line projection rather than looping the locator, which would be a
    // second traversal with its own termination behaviour.
    //
    // THE SET GREW AND THE MODULE STILL RENDERS NO VERDICT FROM THE PARSER, which is the property
    // D-64 Part C actually asks for. Every one of the four symbols is DECLARATIVE: a delimiter class,
    // a per-line boolean, and two integer indices. What an index MEANS for a role file — `missing`,
    // `unterminated`, `multiple` — is still decided here, and the grant-predicate case immediately
    // below asserts that tree-wide zero holds.
    expect(
      importedSymbols("voice-model.ts", "frontmatter"),
      "voice-model.ts must take the delimiter CLASS, the per-line PROJECTION and the shared section LOCATOR — never a section-end or anchor predicate of its own, which is the fourth-grammar shape this round deletes",
    ).toEqual([
      "FENCE_DELIMITER_LINE",
      "fencedLineFlags",
      "sectionEndIndex",
      "unfencedHeadingIndex",
    ]);
    // (Plan 29-24, WR-04 + WR-08) AND `check-imperative-lexicon.ts`'s OWN SET MOVED FROM ONE SYMBOL
    // TO THREE — the FOURTH AND FINAL consumer entry to move in this round, and in the direction
    // D-24 wants, which is why the PIN moves rather than the code.
    //
    // The module used to carry THREE private section predicates, one more than the round-2 review
    // tabulated. `unfencedIndexOf` was a private first-index-of-an-unfenced-heading helper with
    // EXACT equality where the authority normalises with `trimEnd()`; `tableFirstCellsUnderHeading`
    // closed its section with a private `startsWith("## ")` that walked straight past a `# `; and
    // `deriveElements` reset its step anchor with a private `SECTION_HEADING_LINE = /^#{1,2} /` on
    // every line. That third one is the grammar the module's OWN comment block said did not exist —
    // it claimed the two table locators were "the last place in this module" answering a
    // section-extent question with a second grammar, while the step anchor sat below the paragraph
    // making the claim. All three are DELETED: the anchor's position comes from
    // `unfencedHeadingIndex`, every section extent from `sectionEndIndex` at level two, and the
    // per-line fence verdict from `fencedLineFlags`.
    //
    // ONE TERMINATOR IS DELIBERATELY LEFT ALONE, AND IT IS NOT AN OVERSIGHT. `boardColumns` ends at
    // the first line that is NOT A TABLE ROW, which is asking where a TABLE ends rather than where a
    // SECTION ends. A table can end long before its section does, so unifying it would harvest every
    // later table in the same section. Stated in source beside it, so a later reader does not merge
    // two predicates that were never the same question.
    //
    // ALL FOUR ENTRIES HAVE NOW MOVED, EACH WITH ITS OWN REASON, AND NONE TAKES A VERDICT. Every
    // symbol in all four sets is DECLARATIVE: a delimiter class, a per-line boolean, and two integer
    // indices. What an index MEANS for a governed document — which lines are inside a step section,
    // which cells are Technical Names — is still decided in the gate, and the grant-predicate case
    // immediately below asserts the tree-wide zero still holds. THE PIN MOVING FOUR TIMES IN ONE
    // ROUND IS THE PIN WORKING: it went red the moment each module took more from the authority,
    // which is exactly what a two-sided list is for.
    expect(
      importedSymbols("check-imperative-lexicon.ts", "frontmatter"),
      "check-imperative-lexicon.ts must take the per-line fence PROJECTION and the shared section LOCATOR — never a heading-equality, section-end or section-anchor-reset predicate of its own, which is the fourth-grammar shape this round deletes",
    ).toEqual(["fencedLineFlags", "sectionEndIndex", "unfencedHeadingIndex"]);
    // (Plan 29-22, WR-03 + WR-08) AND `check-diff-disposition.ts`'s OWN SET MOVED FROM ONE SYMBOL TO
    // THREE — in the direction D-24 wants, which is why the PIN moves rather than the code. THE PIN
    // MOVING IS THE PIN WORKING: it went red the moment the module took more from the authority,
    // which is exactly what a two-sided list is for.
    //
    // The module used to carry TWO private section predicates. `locateSection` declared its own
    // `trimEnd()` heading equality AND its own `startsWith("## ")` close loop — one of the four
    // disagreeing section locators the round-2 review tabulated — and `readDispositionRows` located
    // `## Dispositions` with a bare `body.indexOf(...)` substring search and then read rows to END OF
    // FILE. That second one is the FOURTH locator of the class, the one round 1's fix never derived
    // and therefore never touched. All of it is DELETED: the heading now comes from
    // `unfencedHeadingIndex`, the close from `sectionEndIndex`, and the per-line fence verdict from
    // `fencedLineFlags`, which the row reader consults directly because skipping a quoted example row
    // is a per-LINE question rather than a section-extent one.
    //
    // THE SET GREW AND THE MODULE STILL RENDERS NO VERDICT FROM THE PARSER, which is the property
    // D-64 Part C actually asks for. All three symbols are DECLARATIVE: a per-line boolean and two
    // integer indices. What an index MEANS for a kit document — which clauses are frozen, which rows
    // are dispositions — is still decided in the gate, and the grant-predicate case immediately below
    // asserts that tree-wide zero still holds.
    expect(
      importedSymbols("check-diff-disposition.ts", "frontmatter"),
      "check-diff-disposition.ts must take the per-line fence PROJECTION and the shared section LOCATOR — never a section-end, heading-equality or heading-search predicate of its own, which is the fourth-grammar shape this round deletes",
    ).toEqual(["fencedLineFlags", "sectionEndIndex", "unfencedHeadingIndex"]);
    // (Plan 29-23, WR-02 + WR-08) AND `check-banned-claims.ts`'s OWN SET MOVED FROM ONE SYMBOL TO
    // THREE — the LAST of the four disagreeing section locators the round-2 review tabulated, and in
    // the direction D-24 wants, which is why the PIN moves rather than the code. THE PIN MOVING IS
    // THE PIN WORKING: it went red the moment the module took more from the authority, which is
    // exactly what a two-sided list is for.
    //
    // The module used to carry TWO private section predicates inside `locateExemptRegion`: an
    // exact-equality heading comparison — the one axis on which all four locators of this class
    // disagreed, because the authority normalises with `trimEnd()` and this one did not — and a
    // private `SAME_LEVEL_HEADING = /^## /` close. Both are DELETED. The heading now comes from
    // `unfencedHeadingIndex`, the bound from `sectionEndIndex` at level two, and `fencedLineFlags`
    // is still taken DIRECTLY for the exactly-one heading COUNT, because a count is not a first
    // index and looping the locator to find "the next one after i" would be a second traversal with
    // its own termination behaviour — the very shape this round exists to delete.
    //
    // NOTE THE DIRECTION, which is NOT the same as the two entries above. A truncated EXEMPTION
    // region is fail-CLOSED — more of the document gets checked — while 29-16's and 29-22's
    // truncated FROZEN region was fail-OPEN. The three are not one bug at three addresses.
    //
    // THE SET GREW AND THE MODULE STILL RENDERS NO VERDICT FROM THE PARSER. All three symbols are
    // DECLARATIVE: a per-line boolean and two integer indices. What an index MEANS for the
    // disclaimer — how far the one named exemption reaches, and how many banned claims it therefore
    // suppresses — is still decided in the gate, published on its PASS line and pinned two-sided
    // there, and the grant-predicate case immediately below asserts the tree-wide zero still holds.
    expect(
      importedSymbols("check-banned-claims.ts", "frontmatter"),
      "check-banned-claims.ts must take the per-line fence PROJECTION and the shared section LOCATOR — never a heading-equality or section-end predicate of its own, which is the fourth-grammar shape this round deletes",
    ).toEqual(["fencedLineFlags", "sectionEndIndex", "unfencedHeadingIndex"]);
    // (Plan 29-25, LANG-07) AND `audit-model.ts` — the FIFTH entry, and the last member of the class
    // anywhere in the tree. Same three symbols, same reason, same direction: all three are
    // DECLARATIVE, and what an index MEANS for the disposition register — which pipe lines are Table A
    // rows and which are an appendix's — is still decided in this module. The owner scan added by this
    // plan is what makes "the last member" a measurement rather than a belief.
    //
    // (Plan 29-28, 29-REVIEW § CR-02) AND THIS ENTRY MOVED AGAIN, FROM THREE SYMBOLS TO FOUR — THE
    // PIN WORKING, for the sixth time in this round. It went red the moment the module took MORE
    // from the authority, which is exactly what a two-sided list is for, and the pin is raised only
    // after the direction has been checked.
    //
    // `readRegistry` was the SIXTH locator of the class and the last one in the tree: a raw-line
    // scan for a claim-heading recogniser, with each block's END taken from the next member of the
    // array it built. Fence-blind, and invisible to the owner classifier on BOTH arms. A claim block
    // written inside a FENCED EXAMPLE therefore parsed as a live `kind: safety` row and entered the
    // D-18 exclusion list LANG-02 consults to decide which files a language pass may not touch. The
    // scan now happens INSIDE the authority; this module tests no heading pattern at a bounding
    // position at all.
    //
    // (Plan 29-28, 29-REVIEW § WR-02) AND `FENCE_DELIMITER_LINE`, the fifth symbol. `parseClaimBlock`
    // answered "is this line a fence delimiter" with a private `trim()` equality while `tableUnder`,
    // thirty lines up in the SAME module, answered it through `fencedLineFlags` and the shared
    // class. The two disagreed on two axes — a delimiter carrying an info string, and a
    // three-space-indented delimiter — and the disagreement was live on correct bytes in BOTH
    // directions. The private equality is DELETED rather than corrected in place.
    //
    // TAKING THE CLASS DIRECTLY IS THE RIGHT COMPOSITION, not a shortfall of the unification: "is
    // this line a delimiter" is a different question from "which lines are inside a fence", and
    // folding the first into the second would be a new defect. `voice-model.ts` takes the class for
    // the same reason and its header records the argument.
    //
    // BOTH NEW SYMBOLS ARE DECLARATIVE, like the three already here: a delimiter CLASS and an array
    // of integer indices. What either MEANS for the claim registry — which lines are a claim block,
    // where its verbatim text begins — is still decided in that module.
    expect(
      importedSymbols("audit-model.ts", "frontmatter"),
      "audit-model.ts must take the delimiter CLASS, the per-line fence PROJECTION and the shared section LOCATOR — never a heading-equality, section-end or fence-delimiter predicate of its own, which is the fourth-grammar shape this round deletes",
    ).toEqual([
      "FENCE_DELIMITER_LINE",
      "fencedLineFlags",
      "sectionEndIndex",
      "unfencedHeadingIndex",
      "unfencedMatchIndices",
    ]);
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// (PLAN 29-25, LANG-07 / D-24) LANG-07 AS A DERIVATION — ONE OWNER, TREE-WIDE AND TWO-SIDED.
//
// WHY THIS BLOCK EXISTS. LANG-07's central claim is "exactly one implementation in this tree answers
// the section-extent question". Until this plan that claim was argued from READING. Round 1 verified
// it on delimiter-sharing evidence and round 2 then tabulated FOUR disagreeing section grammars;
// 29-22 logged a FIFTH in `audit-model.ts` that 29-23 and 29-24 re-logged and none of the three
// fixed. A hand-read answer to "how many implementations exist" has now been wrong twice in one
// phase, which is this repository's second named systemic failure class — a hand-maintained set
// rotting while everything stays green. So the claim becomes a scan: derived, sorted, compared
// two-sided, pinned by cardinality, floored for vacuity and proven falsifiable. The pattern is the
// fence-machine scan in scripts/frontmatter.test.ts, followed rather than reinvented.
//
// WHAT A SECTION-EXTENT CONSTRUCT IS, AND WHY IT IS A CONJUNCTION. A module owns this predicate when
// it carries BOTH halves:
//
//   a HEADING RECOGNISER — an anchored regex over leading ATX hashes (one, a RUN, or a `{n,m}`
//   quantifier) followed by a SEPARATOR (a literal space or a `\s` class), or a prefix test for the
//   same — USED on a line that TERMINATES OR BOUNDS a scan, which in this tree means a loop `break`,
//   a `return` of an index, an assignment to a bound, or an index COLLECTED into an array a later
//   loop consumes as a bound.
//
// (Plan 29-29) BOTH HALVES OF THAT SENTENCE WERE WIDENED, AND THE WIDENING IS WHAT THIS PLAN IS. The
// definition previously said "a literal space" and named only three terminators; round 3 measured
// `SECTION_EXTENT_OWNERS = ["frontmatter.ts"]` green over a tree that had TWO owners, because
// `audit-model.ts`'s `readRegistry` spelled its hashes with a `\s` class AND deferred its bound into
// an array thirteen lines away. Each blindness alone was enough to hide it; the correction had to
// close both, and the two single-arm controls are permanent cases below.
//
// REQUIRING BOTH HALVES IS WHAT DOES THE WORK, and it is the half this plan was warned about. Plan
// 29-24 rewired `check-imperative-lexicon.ts` and reported that 29-22's line-scoped classifier still
// found ONE member there — `const HEADING_LINE = /^#{1,6} /` — because that classifier's third
// construct cannot tell a section TERMINATOR from a heading RECOGNISER: both are spelled `/^#{n,m} /`.
// 29-24 recorded the survivor at its declaration and directed this plan to STATE AN EXEMPTION rather
// than widen the classifier, on the grounds that widening to reach zero would be the failure mode.
//
// THE EXEMPTION IS STATED, AND IT IS STRUCTURAL RATHER THAN A NAME ON A LIST. `HEADING_LINE` answers
// "is this line a heading at all" — a third question, kept on purpose — and its only use is
// `if (HEADING_LINE.test(raw)) continue;`. `continue` SKIPS one element; it neither terminates nor
// bounds a scan, so the conjunction's second half excludes the line and no module is exempted BY
// NAME anywhere in this block. That exclusion is asserted rather than assumed, twice: the case below
// requires `check-imperative-lexicon.ts` to match the recogniser arm and NOT the terminator arm — the
// same discrimination the fence-machine scan proves on its own file — and a second case requires
// `continue` to be absent from the terminator constructs. A classifier narrowed until the answer
// comes out right is the defect; a classifier whose second half is SHOWN to be load-bearing on the
// exact module the last plan flagged is a measurement.
//
// THE RECOGNISER ARM IS STILL NARROWER THAN 29-22'S THIRD CONSTRUCT, AND THE NARROWING IS MEASURED.
// That construct is `/\^#\{?[\d,]*\}?[ \\]/`, whose trailing class admits a BACKSLASH — so it
// recognises `/^#\d+$/` in scripts/trace-render.ts, an ISSUE-REFERENCE pattern that is not a heading
// in any sense. 29-22's own summary records exactly this noise as its reason for staying
// module-scoped. The arm here requires a SEPARATOR after the hashes — a literal space or a `\s`
// class, never a backslash — so the widening in plan 29-29 added the shape item 4 named and nothing
// else. Both halves of that difference are asserted below on planted inputs AND on two live modules:
// `trace-render.ts`, whose issue-reference pattern the arm must not even recognise, and
// `validate-agent-factory.ts`, whose `/^##\s+/` the arm DOES recognise and which the CONJUNCTION
// excludes because the line bounds no scan. A widening asserted only on its positive side is how
// 29-22's noise arrived.
//
// COMMENT LINES ARE STRIPPED before classification, for the reason the fence-machine scan already
// gives: the property is about CODE. Four modules in this tree DESCRIBE these constructs at length in
// the comment blocks recording why they were deleted, and without the strip the answer would be the
// prose rather than the code.
//
// WHAT THIS FLOOR WOULD MISS, NAMED RATHER THAN LEFT UNDISCLOSED — it is a floor against the shapes a
// second grammar plausibly takes in this tree, not a proof that none can exist.
//
// (Plan 29-29) EVERY ITEM BELOW WAS RE-CHECKED AGAINST THE FINAL ROUND-3 TREE IN ONE PASS, and each
// now carries its LIVE COUNT rather than a hypothetical. A floor is a claim about THIS tree and it
// goes stale like any other set-literal in this repository — item 4 asserted a falsehood about the
// tree on the day it was written, and item 1 turned out to be reachable twice. Where a count exists
// it is DERIVED and PINNED by a case, so a floor item cannot rot silently again.
//
//   1. A recogniser built from concatenated fragments or a `new RegExp(...)` string. Round 3's LIVE
//      COUNT was 2 — `generate-catalog.ts:87` and `generate-role-adapters.ts:127`, the same
//      eight-line `sectionBody` helper duplicated verbatim, which bounded a `## ` section by regex
//      lookahead over the whole document and was FENCE-BLIND *and* LEVEL-BLIND (its terminator named
//      level two only, so a level-ONE heading did not close the section). That was a third grammar
//      answering the section-extent question and a LANG-07 finding, escalated in 29-29-SUMMARY.md
//      rather than absorbed into the owner list: under the definition above a section-extent
//      construct is a recogniser used on a LINE that bounds a SCAN, and a whole-document regex
//      performs no line scan. Widening the definition to swallow it would have been re-writing the
//      rule until the answer came out interesting.
//      (PLAN 29-35) THE ESCALATION IS CLOSED. BOTH copies are DELETED and both generators now ask
//      `unfencedHeadingIndex` + `sectionEndIndex`, proven behaviour-preserving by byte-identical
//      regeneration of `docs/catalog/README.md` and of all 17 files under `.claude/agents`.
//      LIVE COUNT: 0, still DERIVED AND PINNED two-sided by a case below — whose three
//      discrimination assertions are KEPT, so the empty answer is provably produced by a pattern
//      that still recognises the shape rather than by one that stopped matching.
//   2. A heading test written as a slice or an index comparison — `line.slice(0, 3) === "## "`,
//      `line.charAt(0) === "#"`, `line.indexOf("## ") === 0`. LIVE COUNT: 0, re-measured this plan.
//   3. A bound expressed through a HELPER this scan does not read: `if (isHeading(line)) break;`
//      names no recogniser on the line that breaks, and the recogniser resolution below follows
//      const-bindings only, never call graphs. Not counted: enumerating it needs a call graph, which
//      is the thing the item says this scan does not build.
//   4. A recogniser spelling the hashes with a whitespace CLASS rather than a literal space
//      (`/^#{1,6}\s/`). THIS ITEM USED TO CLAIM NOTHING IN THIS TREE SPELLED THAT, AND THE CLAIM WAS
//      FALSE ON THE DAY IT WAS WRITTEN — `audit-model.ts:893` spelled exactly it, so a sentence
//      wider than the assertion behind it was sitting inside the assertion meant to close that very
//      class. The shape is now RECOGNISED, so it is no longer a floor at all. What stands in its
//      place is the residue: a recogniser whose separator is neither a literal space nor a `\s`
//      class — a character class of its own (`/^#{1,6}[ \t]/`), or a hash run followed by
//      end-of-pattern with the separator supplied by a caller. LIVE COUNT: 0, derived and pinned by
//      a case below. An item is not deleted when it is closed; a floor that shrinks silently is the
//      same defect one level down.
//   5. A locator written in a language this scan does not read, or in a committed `.js` the
//      derivation does not enumerate. Still true: the enumeration is `*.ts`. LIVE COUNT of committed
//      `.js` files with no `.ts` beside them — the only ones a `*.ts` scan could structurally miss —
//      is DERIVED AND PINNED by a case below.
//   6. A terminator placed FURTHER from its recogniser than the block-scoped search reaches — deeper
//      than `TERMINATOR_WINDOW` lines below it, or outside the block the recogniser line opens (a
//      flag set inside the `if` and read after the loop). The search's bound is stated at
//      `TERMINATOR_WINDOW` with the measurement showing this tree's answer does not depend on it.
//      NARROWED by plan 29-29: the commonest escape — an index COLLECTED into an array and consumed
//      by a later loop — is now a terminator construct, because that is the spelling that hid
//      `readRegistry`. What remains is a bound carried out of the block by a BOOLEAN flag or a
//      mutable captured in a closure. Not counted, for item 3's reason: enumerating it needs a
//      data-flow analysis this scan does not perform, and a number nobody can derive is worse in a
//      floor than an honest "not counted".
//
// THE MODULE SET IS THE WHOLE TREE, AND THAT IS NEW (plan 29-29, closing V-29-26-02 for this block).
// The owner and consumer derivations used to read `scripts/` NON-RECURSIVELY — 41 of the 49 tracked
// non-test modules — while the case name, the refusal wording and this prose all said "tree-wide".
// A claim wider than the assertion behind it is this repository's named defect class, and it chose
// the remedy it already uses: widen the ASSERTION, not narrow the sentence. The wider answer was
// MEASURED BEFORE the sentence changed and it is the same answer — one owner, five consumers — so
// the widening is a floor rather than a re-measurement. `nonTestScripts()` is deliberately left
// alone; four other cases in this file are scoped to `scripts/` on purpose.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Comment lines blanked, POSITIONS PRESERVED so a site's line index still means something. */
const codeLinesOfSource = (src: string): string[] =>
  src.split("\n").map((l) => {
    const t = l.trimStart();
    return t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") ? "" : l;
  });

// (Plan 29-29, CR-02) THE RECOGNISER ARM, WIDENED TO THE TWO SPELLINGS FLOOR ITEM 4 NAMED.
//
// Until this plan the arm was `/\/\^#(?:\{[\d,]+\})? /` — one hash or a `{n,m}` quantifier, then a
// LITERAL SPACE. It could not see an anchored hash RUN (`/^### /`) and it could not see a whitespace
// CLASS (`/^#{1,6}\s/`), and item 4 of this block's own disclosed floor asserted that no module in
// this repository spelled the second of those. That sentence was FALSE on the day it was written:
// `audit-model.ts` spelled `/^###\s+(\S+)\s*$/` and carried both blind spots at once.
//
// The widening is `#*` (a run) and `(?: |\\s)` (a separator that may be a class). It adds NOTHING
// else — in particular it still refuses 29-22's third construct, whose trailing character class
// admits a BACKSLASH and so recognises `/^#\d+$/` in `trace-render.ts`, an issue reference that is
// not a heading in any sense. 29-22's own summary records that noise as its reason for staying
// module-scoped. Both directions are asserted on planted inputs and on two live modules below,
// because a classifier WIDENED until it is noisy is the same defect as one NARROWED until the answer
// comes out right.
const HEADING_RECOGNISER_CONSTRUCTS: readonly RegExp[] = [
  // an anchored regex literal: /^# /, /^### /, /^#{1,6} /, each also with a `\s` class instead of
  // the space, and each also tolerating leading whitespace (`/^\s*## /` — evasion [B3])
  /\/\^(?:\\s\*)?#(?:#*)(?:\{[\d,]+\})?(?: |\\s)/,
  /\.startsWith\(\s*["'`]#{1,6} /, // a prefix test for the same
];

// (Plan 29-29, CR-02) THE TERMINATOR ARM, WIDENED TO THE DEFERRED BOUND.
//
// The recogniser widening ALONE reaches nothing, and that is measured rather than argued: run over
// the pre-29-28 source of `audit-model.ts`, a widened recogniser with the old terminator list
// reports the empty set, and the old recogniser with a widened terminator list reports the empty set
// too. Both arms were blind at once. The plan for this task specified the recogniser half; shipping
// it alone would have been a correction that measured nothing — the exact defect this round exists
// to refuse — so the terminator half is added with it and the two controls are permanent cases.
//
// The fourth construct is a bound COLLECTED rather than assigned: `marks.push(i)` inside the loop,
// consumed by a later loop as a section bound. That is what `readRegistry` did, thirteen lines from
// its recogniser, and it is the commonest way a bound escapes a block-scoped search.
const SCAN_TERMINATOR_CONSTRUCTS: readonly RegExp[] = [
  /\bbreak\b/, // a loop break
  /\breturn\s+(?!true\b|false\b|null\b|undefined\b|\{|\[)\S/, // a return of an index
  // a bound assigned the loop index, BARE or inside an expression (round-two evasion [C4]: the first
  // spelling required `end = i;` and was blind to `end = Math.min(end, i);`). The left-hand side
  // must still be a plain assignment to a name — a `const`/`let` DECLARATION is excluded, because the
  // thing declared inside a loop body is a local, not the caller's bound.
  /^\s*[A-Za-z_$][\w$.]*\s*=\s*[^;]*\b(?:i|j|k|idx|index)\b/,
  // a bound COLLECTED into an array — the index bare or in an expression (evasion [B2])
  /\b[A-Za-z_$][\w$.]*\.push\(\s*(?:i|j|k|n|idx|index)\b/,
];

// How far below a recogniser USE the terminator may sit, and the rule that stops the search.
//
// THE FIRST DRAFT OF THIS SCAN WAS LINE-SCOPED AND THAT MADE IT A FALSE MEASUREMENT. It required the
// recogniser and the terminator on ONE line, so it saw `if (line.startsWith("## ")) break;` — the
// spelling `audit-model.ts` happened to use — and was BLIND to the identical locator written across
// four lines as `if (line.startsWith("## ")) {` / `end = i;` / `break;` / `}`. A tree-wide scan
// reporting "exactly one owner" while blind to the commoner spelling of the thing it counts is the
// harness-premise failure this project has now recorded in ten instances. Caught by running the
// classifier over a planted two-line form rather than by reading it.
//
// The search is BLOCK-SCOPED rather than a blind window of N lines, and that distinction is
// load-bearing in both directions: it must reach the `break` inside the consequent the recogniser
// line opens, and it must NOT reach a `return` that merely follows the enclosing loop.
//
// (Plan 29-29) WHERE IT STOPS NOW DEPENDS ON WHETHER THE RECOGNISER LINE OPENED A BLOCK. A line
// ending in `{` owns only the lines indented beneath it, so the search stops at the first line
// indented no deeper. A line that opens NO block owns nothing beneath it, so its bound is
// necessarily a FOLLOWING SIBLING and the search continues at the same indent, stopping only when
// the enclosing block closes. The old unconditional `<= ind` was blind to every bound-result
// locator — round-one evasion [B1], found by attacking this plan's own widening.
//
// The window is a belt-and-braces upper bound. RE-MEASURED at plan 29-29 against the corrected arms
// and the recursive 49-module set: the derived owner answer is identical at 4, 6, 10 and 20, so
// nothing here depends on its value. What the window DOES bound is floor item 6's residue — a
// terminator further from its recogniser than this — and that is stated there rather than here.
const TERMINATOR_WINDOW = 6;

/** Identifiers bound to a heading recogniser, directly or through another such identifier. */
const HEADING_DECLARATION =
  /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*(.+)$/;
const recogniserNamesIn = (
  code: readonly string[],
  rec: readonly RegExp[],
): string[] => {
  const names = new Set<string>();
  // Three passes: a binding may alias a name declared below it, and this tree nests at most twice.
  for (let pass = 0; pass < 3; pass += 1) {
    for (const line of code) {
      const m = HEADING_DECLARATION.exec(line.trim());
      if (m === null) continue;
      const rhs = m[2];
      const direct = rec.some((r) => r.test(rhs));
      const alias = [...names].some((n) => new RegExp(`\\b${n}\\b`).test(rhs));
      if (direct || alias) names.add(m[1]);
    }
  }
  return [...names].sort();
};

const enclosingFunctionOf = (code: readonly string[], i: number): string => {
  for (let j = i; j >= 0; j -= 1) {
    const m = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(
      code[j],
    );
    if (m !== null) return m[1];
  }
  return "<module scope>";
};

/**
 * Every section-extent construct in `src`, as `function :: the line itself`.
 *
 * ONE classifier, called with different construct arrays — the same reason the fence-machine scan
 * and 29-22's module-scoped scan both parameterise theirs: the falsifiability probe has to run THE
 * RULE with a construct removed, and a second spelling of the rule would measure the copy.
 *
 * THE SITE STRING CARRIES NO CONSTRUCT INDEX, for the reason 29-22 recorded after its own first
 * draft made the removal probe a FALSE probe: an index renumbers when a construct is dropped, so
 * every site string changes and `not.toEqual(base)` passes whether or not the removed construct ever
 * matched anything.
 */
const RECOGNISER_BINDING = /^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]*)?=/;
const indentOf = (line: string): number => line.length - line.trimStart().length;

/**
 * (Plan 29-29) "Does this line APPLY a heading recogniser by name" — ONE expression, two consumers.
 *
 * The classifier's use-detection and the declaration skip's exception are the SAME question asked
 * from two sides, and this phase's own rule is one authority per predicate. Writing it twice is how
 * the two would come to disagree about which spelling counts as an application.
 *
 * (Round two of plan 29-29's adversarial pass, evasions [C1] and [C2]) THE VERB LIST IS A
 * HAND-MAINTAINED SET AND IT HAD ALREADY ROTTED. The first spelling carried `test`, `exec` and
 * `match` and knew nothing of `.search(...)` or of optional chaining — so a locator applying its
 * recogniser either way was invisible to the classifier written to catch exactly that, which is this
 * repository's second named systemic failure class sitting inside the assertion meant to close its
 * first one. Both are closed here; both have a live count of ZERO in this tree, so closing them is a
 * FLOOR rather than a re-measurement.
 *
 * The list carries the verbs that ASK the recogniser a question — `test`, `exec`, `match`,
 * `matchAll`, `search`. `replace` and `split` take a RegExp too and are deliberately OUT: they
 * TRANSFORM text rather than locate a line, and admitting them would count every heading-stripping
 * normaliser in the tree as a candidate site. That is the widening-until-noisy direction, and it is
 * refused here for the same reason 29-22's third construct is.
 */
const recogniserApplication = (name: string): RegExp =>
  new RegExp(
    `\\b${name}\\b\\s*\\??\\.(?:test|exec)\\(|\\.(?:match|matchAll|search)\\(\\s*${name}\\b`,
  );
const declarationAppliesRecogniser = (
  line: string,
  names: readonly string[],
): boolean => names.some((n) => recogniserApplication(n).test(line));

/** Does the recogniser use at `i` sit in a position that terminates or bounds a scan? */
const terminatesAt = (
  code: readonly string[],
  i: number,
  term: readonly RegExp[],
): boolean => {
  if (term.some((r) => r.test(code[i]))) return true;
  const ind = indentOf(code[i]);
  // (Plan 29-29, evasion [B1]) WHERE THE SEARCH STOPS DEPENDS ON WHETHER THE RECOGNISER LINE OPENED
  // A BLOCK, and that distinction is what closed the third evasion this plan's adversarial pass
  // found. A line ending in `{` owns the lines indented BENEATH it and nothing else — reaching a
  // sibling would reach the `return` that follows the enclosing loop, which is exactly what the
  // control plant [D] proves must not happen. A line that opens NO block — `const isHead =
  // HEAD.test(lines[i]);` — owns no deeper lines at all, so its bound is necessarily a FOLLOWING
  // SIBLING, and a search that stopped at the first same-indent line could never see it. The old
  // rule was `<= ind` unconditionally and was therefore blind to every bound-result locator.
  const opensBlock = code[i].trimEnd().endsWith("{");
  for (let k = i + 1; k <= Math.min(i + TERMINATOR_WINDOW, code.length - 1); k += 1) {
    if (code[k].trim() === "") continue;
    const kInd = indentOf(code[k]);
    // The enclosing block has closed; anything below is a different question.
    if (kInd < ind || (opensBlock && kInd <= ind)) return false;
    if (term.some((r) => r.test(code[k]))) return true;
  }
  return false;
};

const sectionExtentSitesIn = (
  src: string,
  rec: readonly RegExp[] = HEADING_RECOGNISER_CONSTRUCTS,
  term: readonly RegExp[] = SCAN_TERMINATOR_CONSTRUCTS,
): string[] => {
  const code = codeLinesOfSource(src);
  const names = recogniserNamesIn(code, rec);
  const usesRecogniser = (line: string): boolean =>
    rec.some((r) => r.test(line)) || declarationAppliesRecogniser(line, names);
  const out: string[] = [];
  for (let i = 0; i < code.length; i += 1) {
    // A DECLARATION OF A RECOGNISER is not a use. `const HEADING_AT_MOST_2 = /^#{1,2} /;` binds the
    // predicate; where it is ASKED is the question this scan measures, and counting the binding would
    // both double-count the real site and re-import the recogniser/terminator confusion.
    //
    // (Plan 29-29, evasion [B1]) But a declaration of the TEST'S RESULT — `const isHead =
    // HEAD.test(lines[i]);` — is a USE wearing a declaration's spelling, and the first draft of this
    // skip dropped it. The skip asked "is this line a binding" when the question is "does this
    // binding DEFINE a recogniser or APPLY one". Found by attacking this plan's own widening; a real
    // section locator written that way was invisible to the corrected classifier.
    if (
      RECOGNISER_BINDING.test(code[i].trim()) &&
      !declarationAppliesRecogniser(code[i], names)
    ) {
      continue;
    }
    if (!usesRecogniser(code[i])) continue;
    if (!terminatesAt(code, i, term)) continue;
    out.push(`${enclosingFunctionOf(code, i)} :: ${code[i].trim()}`);
  }
  return out;
};

/**
 * The modules that OWN the predicate, over a given module set and reader.
 *
 * Parameterised by the file set for the same reason the fence-machine scan parameterises its own:
 * the member-level falsifiability probe plants a sixth locator in a temp directory and needs to run
 * THE RULE over it. A second spelling of the rule would measure the copy.
 */
const sectionExtentOwnersAmong = (
  names: readonly string[],
  read: (n: string) => string,
  rec: readonly RegExp[] = HEADING_RECOGNISER_CONSTRUCTS,
  term: readonly RegExp[] = SCAN_TERMINATOR_CONSTRUCTS,
): string[] =>
  names.filter((n) => sectionExtentSitesIn(read(n), rec, term).length > 0).sort();

/**
 * The modules that OWN the predicate, derived over every non-test module IN THE TREE.
 *
 * (Plan 29-29) The read is RECURSIVE and repository-rooted. Until this plan it read `scripts/` and
 * nothing else — 41 of 49 modules — while calling itself tree-wide. The wider answer was measured
 * before the sentence was changed, and it is the same answer.
 */
const sectionExtentOwners = (
  rec: readonly RegExp[] = HEADING_RECOGNISER_CONSTRUCTS,
  term: readonly RegExp[] = SCAN_TERMINATOR_CONSTRUCTS,
): string[] =>
  sectionExtentOwnersAmong(
    nonTestModules(),
    (n) => readFileSync(join(ROOT, n), "utf8"),
    rec,
    term,
  );

/**
 * FLOOR ITEM 1'S SHAPE, MADE A DERIVATION: a section bound built through `new RegExp(...)`.
 *
 * A pattern assembled from a template string carries no regex literal, so the recogniser arm cannot
 * see it by construction. The item disclosed that; what it did not do is say how many the tree has.
 * This expression is that number's source, and it is deliberately SEPARATE from the owner scan
 * rather than folded into it — see the case that consumes it for why.
 */
const REGEXP_BUILT_SECTION_BOUND = /new RegExp\(.*#{1,6}(?: |\\\\s)/;

// The delimiter characters, spelled by CODE rather than literally, so THIS file's own source never
// carries a recogniser-and-terminator pair and can never become a member of the set it derives. The
// self-reference is not hypothetical: the fence-machine scan in scripts/frontmatter.test.ts had to
// take exactly this precaution after the harness defeated its own premise three rounds running.
const HASH = String.fromCharCode(35);
const SLASH = String.fromCharCode(47);
const CARET = String.fromCharCode(94);

/**
 * The section locator this plan DELETED from `audit-model.ts`, restated as a planted module.
 *
 * It is the fifth member of the class — logged by 29-22, re-logged by 29-23, named by 29-24 as the
 * only known survivor — and it is what the member-level probe plants, so the probe is tied to the
 * defect this plan actually closed rather than to an invented one. Assembled from character codes so
 * THIS file's own source never carries a recogniser-and-terminator pair of its own.
 */
const PLANTED_SIXTH_LOCATOR = [
  "export function tableUnder(lines: string[], heading: string): number[] {",
  "  const start = lines.findIndex((l) => l.trim() === heading);",
  "  const out: number[] = [];",
  "  for (let i = start + 1; i < lines.length; i += 1) {",
  `    if (lines[i].startsWith("${HASH}${HASH} ")) break;`,
  "    out.push(i);",
  "  }",
  "  return out;",
  "}",
  "",
].join("\n");

/**
 * (Plan 29-29, CR-02) THE SEVENTH PLANTED LOCATOR — `audit-model.ts`'s pre-29-28 shape, restated.
 *
 * The sixth plant above is spelled with a `.startsWith` prefix test and its `break` on the SAME
 * line: both arms of the classifier saw it the day it was planted. The defect that actually shipped
 * had the two properties that hid it from BOTH arms at once —
 *
 *   a recogniser spelling the hashes with a whitespace CLASS (`/^###\s+(\S+)\s*$/`), which the
 *   recogniser arm required a literal space for; and a bound DEFERRED — the loop pushes indices into
 *   an array that a later loop consumes — which the terminator arm never reached.
 *
 * A probe tied to the defect that really shipped is worth more than an invented one, so this plant
 * is that defect restated rather than a new hypothetical. Assembled from character codes for the
 * same reason the sixth is: this file is itself a member of the module set it derives over.
 */
const PLANTED_SEVENTH_LOCATOR = [
  "export function claimSpans(text: string): number[] {",
  `  const CLAIM_HEAD = ${SLASH}${CARET}${HASH}${HASH}${HASH}\\s+(\\S+)\\s*$${SLASH};`,
  '  const lines = text.split("\\n");',
  "  const marks: number[] = [];",
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (CLAIM_HEAD.test(lines[i])) marks.push(i);",
  "  }",
  "  const spans: number[] = [];",
  "  for (let n = 0; n < marks.length; n += 1) {",
  "    const start = marks[n];",
  "    const end = n + 1 < marks.length ? marks[n + 1] : lines.length;",
  "    spans.push(end - start);",
  "  }",
  "  return spans;",
  "}",
  "",
].join("\n");

/**
 * (Plan 29-29) THE THREE EVASIONS THE MANDATED ADVERSARIAL PASS FOUND AGAINST THIS PLAN'S OWN FIX.
 *
 * The widened arms were attacked with four shapes before they were committed. Three got through, and
 * all three are real section locators rather than curiosities — each one bounds a scan at a heading:
 *
 *   [B1] the recogniser's RESULT bound to a local `const`, so the USE line is spelled like a
 *        DECLARATION and the declaration skip dropped it. That skip exists to stop a recogniser's
 *        DEFINITION being counted as its use; it was written as "is this line a binding" when the
 *        question is "does this binding DEFINE a recogniser or APPLY one".
 *   [B2] the loop index pushed with an offset — `marks.push(i + 0)` — which the collection construct
 *        required to be bare.
 *   [B3] a leading-whitespace-tolerant recogniser, `/^\s*## /`, which the arm's `\^#` anchor missed.
 *
 * [B4], the fourth, was already caught: `lines[i].match(HEAD)` is in the recogniser-application set.
 *
 * A number that is blind to a shape is the same defect whichever level it sits at, so these are
 * CLOSED rather than added to the floor. The fixture is assembled from character codes for the same
 * reason every other plant in this block is.
 */
const PLANTED_EVASION_SOURCE = [
  // [B1] the use line is a declaration — of the TEST'S RESULT, not of a recogniser.
  "export function evadeByBoundResult(lines: string[], from: number): number {",
  `  const HEAD_A = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`,
  "  let end = lines.length;",
  "  for (let i = from; i < lines.length; i += 1) {",
  "    const isHead = HEAD_A.test(lines[i]);",
  "    if (isHead) {",
  "      end = i;",
  "      break;",
  "    }",
  "  }",
  "  return end;",
  "}",
  "",
  // [B2] the index collected with an offset rather than bare.
  "export function evadeByPushOffset(lines: string[]): number[] {",
  `  const HEAD_B = ${SLASH}${CARET}${HASH}${HASH}${HASH}\\s${SLASH};`,
  "  const marks: number[] = [];",
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (HEAD_B.test(lines[i])) marks.push(i + 0);",
  "  }",
  "  return marks;",
  "}",
  "",
  // [B3] a recogniser tolerant of leading whitespace.
  "export function evadeByLeadingWhitespace(lines: string[]): number {",
  `  const HEAD_C = ${SLASH}${CARET}\\s*${HASH}${HASH} ${SLASH};`,
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (HEAD_C.test(lines[i])) return i;",
  "  }",
  "  return lines.length;",
  "}",
  "",
  // [B4] the already-caught spelling, kept as the control: the fixture must not be four failures
  // dressed as three, and a plant nobody could ever have missed proves the fixture is readable.
  "export function evadeByMatchCall(lines: string[]): number {",
  `  const HEAD_D = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`,
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (lines[i].match(HEAD_D)) break;",
  "  }",
  "  return 0;",
  "}",
  "",
  // ── ROUND TWO of the adversarial pass, run against the arms round one had already tightened. ──
  // Three more got through, and all three are a HAND-MAINTAINED SET rotting rather than a new idea:
  // the application-verb list (`test` / `exec` / `match`) had no `search` and no optional-chaining
  // spelling, and the bound-assignment construct required the index BARE. That is this repository's
  // second named systemic failure class, inside the assertion written to close its first one.
  //
  // [C1] the recogniser applied with `.search(...)`.
  "export function evadeBySearchCall(lines: string[]): number {",
  `  const HEAD_E = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`,
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (lines[i].search(HEAD_E) === 0) return i;",
  "  }",
  "  return 0;",
  "}",
  "",
  // [C2] the recogniser applied through optional chaining.
  "export function evadeByOptionalChain(lines: string[]): number {",
  `  const HEAD_F = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`,
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (HEAD_F?.test(lines[i])) break;",
  "  }",
  "  return 0;",
  "}",
  "",
  // [C4] the bound assigned an EXPRESSION over the index rather than the bare index.
  "export function evadeByBoundExpression(lines: string[], from: number): number {",
  `  const HEAD_G = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`,
  "  let end = lines.length;",
  "  for (let i = from; i < lines.length; i += 1) {",
  "    if (HEAD_G.test(lines[i])) {",
  "      end = Math.min(end, i);",
  "    }",
  "  }",
  "  return end;",
  "}",
  "",
].join("\n");

/**
 * THE NAMED SETS ARE THE MEASUREMENT, WRITTEN DOWN — produced by running the derivations above over
 * the live tree in the SAME session that wrote these lines, never transcribed from the plan.
 *
 * The plan predicted the consumer list would be the FOUR guard modules. Measured, it is FIVE: this
 * plan closed `audit-model.ts`, the fifth locator, rather than absorbing it into the owner list. The
 * plan's own instruction is to write down whatever the derivation reports.
 *
 * (Plan 29-29) RE-DERIVED over the FINAL round-3 tree, after 29-27, 29-28, 29-30 and 29-32 had all
 * landed, with the CORRECTED classifier and the RECURSIVE module set. The names are now
 * repository-relative paths because the enumeration is no longer rooted at `scripts/`. The answer
 * over 49 modules is the same as the answer over 41: one owner.
 */
const SECTION_EXTENT_OWNERS = ["scripts/frontmatter.ts"];
const SECTION_EXTENT_OWNER_COUNT = 1;
/**
 * The recursive enumeration's own size, pinned so a walk that silently stopped early is loud.
 *
 * 49 → 50 (plan 29.1-01). Phase 29.1 added ONE non-test module, `scripts/model-tiers.ts`. Derived
 * independently rather than incremented: `find install scripts hooks -name '*.ts' ! -name
 * '*.test.ts'` reports 49 and the recursive walk reports 50, and the difference is `vitest.config.ts`
 * at the repository root, which the walk sees and that command's roots do not. The delta between the
 * two enumerations is unchanged at 1, so the walk did not quietly widen — exactly one module arrived.
 *
 * The owner answer is unchanged by the addition: `model-tiers.ts` decides no section extent and
 * declares no frontmatter parser, so SECTION_EXTENT_OWNERS stays at the one authority.
 */
const NON_TEST_MODULE_COUNT = 50;

// ─────────────────────────────────────────────────────────────────────────────────────────────
// (Plan 29-40, gap G-29-1 of 29-UAT.md, closing V-29-35-01) THE FRONTMATTER-PARSER NAME OWNER SET.
//
// The section-extent scan above answers "which module DECIDES where a section ends". This one answers
// a narrower and more mechanical question: "which module DECLARES a function called
// `parseFrontmatter`". Both exist for the same reason (D-24, one authority per predicate), and this
// one exists because the section-extent scan could not see the defect G-29-1 named.
//
// WHY A SECOND SCAN AT ALL, AND WHAT MADE IT NECESSARY. `scripts/generate-catalog.ts` carried a
// PRIVATE flat `key: value` `parseFrontmatter` beside the exported authority for the whole of phase
// 29. Nothing red. The IMPORTED-SYMBOL pin above could not see it — a duplicate declared locally is
// invisible to an import pin, because the module imports nothing to be pinned. The section-extent
// scan could not see it either — the duplicate answered a DIFFERENT predicate. So a second grammar
// over one class of bytes sat in the tree at exit 0, measured at 0 key-set differences over 36
// documents, i.e. LATENT rather than absent. Its sibling `generate-role-adapters.ts` had the same
// eight-line duplicate deleted in plan 27-23 (WR-03); this file was simply missed by that conversion,
// and no assertion in this repository would have said so.
//
// ── THE BOUND, DISCLOSED HERE RATHER THAN LEFT FOR A LATER ROUND TO DISCOVER. ──────────────────
// THIS TRIPWIRE IS NAME-SCOPED. It reds the day a second module declares a function called
// `parseFrontmatter`. It does NOT detect a duplicated frontmatter grammar declared under a DIFFERENT
// name — `readFrontmatter`, `fmOf`, an inline `text.match(/^---\n/)` in the middle of a loop. That is
// a different predicate: answering it needs a CLASSIFIER over what the code does, the shape
// `sectionExtentOwners()` has, not a test over an identifier. Stating the limit is the point; a
// tripwire whose silence is read as coverage it never had is how V-29-26-02 happened.
//
// THE REMEDY ON A RED IS DELETION, NEVER MEMBERSHIP. A module outside the authority declaring this
// name is a LANG-07 failure. It is closed by deleting the second declaration and consuming
// `scripts/frontmatter.ts`, exactly as plans 27-23 and 29-40 did — never by adding the module to the
// list below. The same posture the section-extent owner case states, for the same reason: a weaker
// second opinion that still votes is worse than none.
//
// MEASURED over the live tree in the same session that wrote this line, by running the derivation
// below — never transcribed from the plan.
const FRONTMATTER_PARSER_OWNERS = ["scripts/frontmatter.ts"];
const FRONTMATTER_PARSER_OWNER_COUNT = 1;

/**
 * The spellings that count as a LOCAL DECLARATION of the name, built against the evasion lesson this
 * file already records: a hand-maintained application-verb list rotted INSIDE the assertion written
 * to close the first drift, so the set of forms is enumerated once here and every member is planted
 * and asserted in the case below rather than trusted.
 *
 * Two arms because JavaScript has two ways to bind a function to a name, and a scan that knows only
 * `function` is defeated by `const parseFrontmatter = (...) => ...` — which is what the deleted
 * duplicate would have become the first time somebody reformatted it.
 *
 * The `(?<![A-Za-z0-9_$])` / `(?![A-Za-z0-9_$])` guards are what keep this a NAME test rather than a
 * SUBSTRING test: `parseFrontmatterStrict` shares the prefix and `reparseFrontmatter` shares the
 * suffix, and neither is this name. Both are planted as non-matches.
 */
const FRONTMATTER_PARSER_DECLARATIONS: readonly RegExp[] = [
  // `function parseFrontmatter(`, with any combination of `export` and `async`, and any generic
  // parameter list — the `(?!...)` boundary is what stops `parseFrontmatterStrict` from matching.
  /(?<![A-Za-z0-9_$])(?:export\s+)?(?:async\s+)?function\s+parseFrontmatter(?![A-Za-z0-9_$])/,
  // `const parseFrontmatter = (` / `= function` / `= async (` / `= <T>(`, and the same for `let` and
  // `var`, with an optional type annotation between the name and the `=`. A plain
  // `const parsed = parseFrontmatter(text)` CALL does not match: the name must sit where the binding
  // is, not where the callee is.
  /(?<![A-Za-z0-9_$])(?:export\s+)?(?:const|let|var)\s+parseFrontmatter(?![A-Za-z0-9_$])\s*(?::[^=]*)?=\s*(?:async\s+)?(?:function\b|\(|<)/,
];

/** True when this source DECLARES the name locally. Comments are blanked first, so a name mentioned
 * in prose can neither satisfy nor falsify the test. */
const declaresFrontmatterParser = (src: string): boolean => {
  const code = codeLinesOfSource(src).join("\n");
  return FRONTMATTER_PARSER_DECLARATIONS.some((r) => r.test(code));
};
/**
 * Floor item 1's LIVE sites, measured in this session and pinned two-sided WITH THEIR ADDRESSES.
 *
 * They were the same eight-line `sectionBody` helper, duplicated verbatim across the two catalog
 * generators. They bound a `## ` section by regex lookahead over the whole document — a third
 * grammar answering the section-extent question, fence-blind, and outside the owner scan's published
 * definition because they perform no line scan. Escalated in 29-29-SUMMARY.md, not absorbed here.
 *
 * (Plan 29-35, LANG-07 — 29-REVIEW § WR-08) THE ESCALATION IS CLOSED AND THIS LIST IS NOW EMPTY.
 * NEITHER generator answers the section-extent question any more: BOTH private grammars are DELETED
 * and both modules ask `unfencedHeadingIndex` + `sectionEndIndex`, proven behaviour-preserving by
 * byte-identical regeneration of `docs/catalog/README.md` and of all 17 files under `.claude/agents`.
 * Re-derived by running the scan below over the live tree, never decremented by hand.
 *
 * THE LIST IS EMPTY BECAUSE PLAN 29-35 EMPTIED IT — NOT BECAUSE THE SHAPE WAS NEVER REAL. That
 * sentence is here so a later reader does not read the emptiness as a hypothetical and delete the
 * case. An empty pinned list is a vacuity risk, so the case's THREE discrimination assertions are
 * KEPT and must keep passing: a `new RegExp` bounding a level-two section matches, one carrying no
 * ATX heading run does not, and one whose hash is followed by no separator does not. The empty LIVE
 * answer is therefore provably produced by a pattern that still recognises the shape, and a third
 * generator adopting the deleted helper reds this case on the day it lands.
 */
const REGEXP_SECTION_BOUND_SITES: string[] = [];
const REGEXP_SECTION_BOUND_SITE_COUNT = 0;
/**
 * The remaining floor items' LIVE sites, derived in this session rather than typed into the prose.
 *
 * Item 4's original text asserted a falsehood about this tree; these are the same kind of claim, so
 * they are pinned by an expression instead. Empty is a legitimate answer — what is not legitimate is
 * an empty answer nobody derived.
 */
const FLOOR_ITEM_2_SITES: string[] = [];
const FLOOR_ITEM_4_RESIDUE_SITES: string[] = [];
const FLOOR_ITEM_5_SITES: string[] = [];
// (Plan 29-28) `unfencedMatchIndices` joins the set the day it is exported, NOT the day some module
// happens to be the first to import only it. This list keys the CONSUMER derivation below, so a
// locator function missing from it is a module that could adopt the authority and still be counted
// as having adopted nothing — the hand-maintained-set drift this repository has corrected four
// times. Its addition leaves the consumer set unchanged today (`audit-model.ts` already takes two
// of the three), which is the check that this widening is a floor and not a re-measurement.
const LOCATOR_FUNCTIONS = [
  "sectionEndIndex",
  "unfencedHeadingIndex",
  "unfencedMatchIndices",
] as const;
// (Plan 29-29) RE-DERIVED over the FINAL round-3 tree with the RECURSIVE module set and the
// path-aware import reader. 29-28 rewired `audit-model.ts` onto `unfencedMatchIndices` and 29-32
// added the `-1` contract; neither moved this set. The wider read adds no consumer either — no
// module outside `scripts/` imports the authority today — so the widening is a FLOOR here rather
// than a re-measurement, and that is the check that it was worth taking.
// (Plan 29-35, LANG-07 — 29-REVIEW § WR-08) RE-DERIVED AND UP BY ONE. `scripts/generate-catalog.ts`
// joins the set the day it deletes its private `new RegExp` section-extent grammar and asks the
// authority instead. THE PIN MOVING IS THE PIN WORKING: it went red the moment the module took the
// two locator functions, which is exactly what a two-sided list is for, and it is raised only after
// the direction has been checked. `scripts/generate-role-adapters.ts` joins for the same reason in
// the same plan — the two copies of the deleted grammar were byte-identical, so the two replacements
// are too, and a set that gained one of them and not the other would be the finding.
const LOCATOR_CONSUMERS = [
  "scripts/audit-model.ts",
  "scripts/check-banned-claims.ts",
  "scripts/check-diff-disposition.ts",
  "scripts/check-imperative-lexicon.ts",
  "scripts/generate-catalog.ts",
  "scripts/generate-role-adapters.ts",
  "scripts/voice-model.ts",
];
const LOCATOR_CONSUMER_COUNT = 7;

/**
 * A source carrying ONE site of each construct pair — the falsifiability probe's fixture.
 *
 * It exists so the derivation's liveness is provable WITHOUT depending on the live tree still
 * carrying a defect. After this plan the live answer is a single module, and one member from a
 * classifier that barely matches is indistinguishable from one member from a classifier that works.
 *
 * ASSEMBLED FROM CHARACTER CODES so THIS file's own source never carries a recogniser-and-terminator
 * pair. The self-reference is not hypothetical: this file is itself a non-test-adjacent module in the
 * same tree, and the fence-machine scan in scripts/frontmatter.test.ts already had to take exactly
 * this precaution after the harness defeated its own premise three rounds running.
 */
const PLANTED_SECTION_LOCATOR_SOURCE = [
  // [A] the ONE-LINE spelling: recogniser identifier and terminator on the same line.
  "export function plantedCloseByRegex(lines: string[], from: number): number {",
  `  const CLOSES = ${SLASH}${CARET}${HASH}{1,2} ${SLASH};`,
  "  for (let i = from; i < lines.length; i += 1) {",
  "    if (CLOSES.test(lines[i])) return i;",
  "  }",
  "  return lines.length;",
  "}",
  "",
  // [B] the MULTI-LINE spelling of the SAME locator — the one the first draft of this scan was blind
  // to, and the commoner of the two in this tree. Its only terminator is the loop BREAK.
  "export function plantedCloseByPrefix(lines: string[]): number {",
  "  let out = 0;",
  "  for (let i = 0; i < lines.length; i += 1) {",
  `    if (lines[i].startsWith("${HASH}${HASH} ")) {`,
  "      break;",
  "    }",
  "    out += 1;",
  "  }",
  "  return out;",
  "}",
  "",
  // [C] the same question answered by assigning a BOUND rather than by breaking or returning. Each
  // planted site carries exactly ONE terminator construct, which is what makes the per-construct
  // removal probe below attributable to the construct removed and to nothing else.
  "export function plantedCloseByBound(lines: string[], from: number): number {",
  "  let end = lines.length;",
  "  for (let i = from; i < lines.length; i += 1) {",
  `    if (lines[i].startsWith("${HASH} ")) {`,
  "      end = i;",
  "    }",
  "  }",
  "  return end;",
  "}",
  "",
  // [D] THE CONTROL: it recognises a heading and bounds nothing — the `continue` shape that keeps
  // `check-imperative-lexicon.ts`'s kept `HEADING_LINE` out of the answer. Its `return seen;` sits
  // OUTSIDE the block the recogniser line opened, which is what the block-scoped search must respect.
  "export function plantedBoundsNothing(lines: string[]): number {",
  `  const IS_HEADING = ${SLASH}${CARET}${HASH}{1,6} ${SLASH};`,
  "  let seen = 0;",
  "  for (const line of lines) {",
  "    if (IS_HEADING.test(line)) continue;",
  "    seen += 1;",
  "  }",
  "  return seen;",
  "}",
  "",
  // [E] (plan 29-29) the bound COLLECTED rather than assigned or broken on: the loop index is pushed
  // into an array a LATER loop consumes as a section bound. This is the spelling `audit-model.ts`
  // carried until plan 29-28 — the recogniser and the bound thirteen lines apart — and it is the
  // shape BOTH arms of this classifier were blind to. Its recogniser spells the hashes as a RUN with
  // a QUANTIFIER and a whitespace CLASS, so this one planted function exercises every axis of the
  // widening at once. Its only terminator construct is the collection itself: the `return marks;`
  // below sits outside the block the recogniser line opened, which the block rule must respect.
  "export function plantedCloseByCollection(lines: string[]): number[] {",
  `  const OPENS = ${SLASH}${CARET}${HASH}${HASH}{2}\\s${SLASH};`,
  "  const marks: number[] = [];",
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (OPENS.test(lines[i])) {",
  "      marks.push(i);",
  "    }",
  "  }",
  "  return marks;",
  "}",
  "",
].join("\n");

describe("LANG-07: exactly ONE module owns the section-extent predicate (plan 29-25, D-24)", () => {
  it("the OWNER set is derived tree-wide, floored for vacuity, and pinned two-sided at the authority alone", () => {
    // (Plan 29-29) The corpus is the RECURSIVE, repository-rooted set — 49 modules, not the 41 the
    // non-recursive `scripts/` read used to hand this scan while the case name said "tree-wide".
    const modules = nonTestModules();
    // ── NON-VACUITY FIRST, BOTH HALVES, BEFORE ANY MEMBERSHIP CLAIM. ──────────────────────────
    // An enumeration that found nothing cannot report that only one module is a member. This project
    // has recorded a vacuity floor that caught an EMPTY denominator and missed a SILENTLY SHORT one,
    // so the scanned count is taken from a source the classifier does not produce — a directory read
    // — and the found count is stated separately.
    expect(
      modules.length,
      "the non-test module corpus must really have been enumerated before anything is claimed about its contents",
    ).toBe(NON_TEST_MODULE_COUNT);
    expect(modules).toContain("scripts/frontmatter.ts");

    const owners = sectionExtentOwners();
    expect(
      owners.length,
      "the classifier found NO section-extent construct anywhere in the tree — a one-member answer from a scan that matches nothing is not a measurement",
    ).toBeGreaterThan(0);

    // ── THE MEMBERSHIP CLAIM, TWO-SIDED. ─────────────────────────────────────────────────────
    expect(owners).toEqual([...owners].sort());
    expect(
      owners,
      "a module outside scripts/frontmatter.ts answers a section-extent question. That is a LANG-07 failure and is escalated, never added to this list",
    ).toEqual(SECTION_EXTENT_OWNERS);
    // Cardinality pinned as a NUMBER beside the member list, so a scan that silently stops matching
    // shrinks LOUDLY rather than passing over a set it no longer populates.
    expect(owners).toHaveLength(SECTION_EXTENT_OWNER_COUNT);

    // ── THE CONJUNCTION IS PROVEN TO DISCRIMINATE, ON THE EXACT MODULE 29-24 FLAGGED. ─────────
    // `check-imperative-lexicon.ts` matches the RECOGNISER arm — it declares `HEADING_LINE` and tests
    // it — and NOT the terminator arm, because its only use is followed by `continue`. That is the
    // stated exemption for a heading RECOGNISER, expressed as a mechanism rather than as a name on an
    // allow-list: no module is exempted by name anywhere in this block.
    const lexicon = codeLinesOfSource(
      readFileSync(join(ROOT, "scripts", "check-imperative-lexicon.ts"), "utf8"),
    ).join("\n");
    expect(
      HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(lexicon)),
      "check-imperative-lexicon.ts declares a heading recogniser IN CODE, so the recogniser arm alone would count it",
    ).toBe(true);
    expect(
      sectionExtentSitesIn(lexicon),
      "…and it terminates no scan with it — `continue` skips one element, it does not bound a scan. This is the exemption plan 29-24 asked for, and it is structural",
    ).toEqual([]);
    expect(owners).not.toContain("scripts/check-imperative-lexicon.ts");

    // ── AND THE AUTHORITY'S OWN SITE IS NAMED, so a one-member answer cannot be one member by
    // accident of which file happened to match.
    expect(
      sectionExtentSitesIn(
        readFileSync(join(ROOT, "scripts", "frontmatter.ts"), "utf8"),
      ),
    ).toEqual(["sectionEndIndex :: if (!flags[i] && closes.test(lines[i])) return i;"]);
  });

  it("the classifier is FALSIFIABLE — both halves of the conjunction are load-bearing on a planted source", () => {
    const base = sectionExtentSitesIn(PLANTED_SECTION_LOCATOR_SOURCE);
    expect(base).toEqual([
      "plantedCloseByRegex :: if (CLOSES.test(lines[i])) return i;",
      'plantedCloseByPrefix :: if (lines[i].startsWith("## ")) {',
      'plantedCloseByBound :: if (lines[i].startsWith("# ")) {',
      "plantedCloseByCollection :: if (OPENS.test(lines[i])) {",
    ]);
    expect(base.length).toBeGreaterThan(0);

    // Dropping a RECOGNISER construct must cost the sites it found — one construct, one spelling.
    for (let i = 0; i < HEADING_RECOGNISER_CONSTRUCTS.length; i += 1) {
      const without = sectionExtentSitesIn(
        PLANTED_SECTION_LOCATOR_SOURCE,
        HEADING_RECOGNISER_CONSTRUCTS.filter((_, j) => j !== i),
        SCAN_TERMINATOR_CONSTRUCTS,
      );
      expect(
        without,
        `dropping recogniser construct [${i}] must MOVE the derived list — a construct that can be deleted with the answer unchanged is decoration`,
      ).not.toEqual(base);
      expect(without.length).toBeLessThan(base.length);
    }
    // …and so must dropping a TERMINATOR construct, which is the half that carries the exemption.
    for (let i = 0; i < SCAN_TERMINATOR_CONSTRUCTS.length; i += 1) {
      const without = sectionExtentSitesIn(
        PLANTED_SECTION_LOCATOR_SOURCE,
        HEADING_RECOGNISER_CONSTRUCTS,
        SCAN_TERMINATOR_CONSTRUCTS.filter((_, j) => j !== i),
      );
      expect(
        without,
        `dropping terminator construct [${i}] must MOVE the derived list`,
      ).not.toEqual(base);
      expect(without.length).toBeLessThan(base.length);
    }

    // EACH PLANTED SITE MATCHES EXACTLY ONE TERMINATOR CONSTRUCT, asserted rather than assumed —
    // which is what makes each removal above attributable to the construct removed and to nothing
    // else. The first draft of this fixture gave one site BOTH a `break` and a bound assignment, so
    // dropping either construct left the answer unchanged and the probe reported a decoration as
    // load-bearing. Caught by reading the received value.
    expect(
      SCAN_TERMINATOR_CONSTRUCTS.map(
        (_, i) =>
          sectionExtentSitesIn(
            PLANTED_SECTION_LOCATOR_SOURCE,
            HEADING_RECOGNISER_CONSTRUCTS,
            SCAN_TERMINATOR_CONSTRUCTS.filter((_, j) => j !== i),
          ).length,
      ),
      "dropping any one terminator construct must cost exactly one planted site",
    ).toEqual(SCAN_TERMINATOR_CONSTRUCTS.map(() => base.length - 1));

    // THE THIRD PLANTED FUNCTION IS THE CONJUNCTION'S CONTROL: it recognises a heading and bounds
    // nothing, so it contributes NO site. Without it, "both halves are required" is only believed.
    expect(
      base.some((s) => s.startsWith("plantedBoundsNothing")),
      "a heading recogniser that bounds no scan must contribute no site — this is the half that exempts a recogniser",
    ).toBe(false);
    // AND THE MULTI-LINE SPELLING IS IN THE ANSWER — the blindness that made the first draft of this
    // scan a false measurement. Asserted as a named member, not as a count, so a future narrowing
    // cannot lose it while some other site keeps the total steady.
    expect(
      base,
      "the four-line spelling of a section close must be a member — a scan blind to it counts one owner while missing the commoner form",
    ).toContain('plantedCloseByPrefix :: if (lines[i].startsWith("## ")) {');
    // The block-scoped search is what buys that, and it is pinned from the OTHER side too: the
    // control's `return seen;` is within TERMINATOR_WINDOW lines of its recogniser use and is
    // correctly NOT reached, because it sits outside the block that use opened.
    const controlLines = PLANTED_SECTION_LOCATOR_SOURCE.split("\n");
    const controlUse = controlLines.findIndex((l) =>
      l.includes("IS_HEADING.test(line)"),
    );
    const controlReturn = controlLines.findIndex((l) => l.trim() === "return seen;");
    expect(controlUse).toBeGreaterThan(-1);
    expect(
      controlReturn - controlUse,
      "the control's terminator must sit INSIDE the line window, or the block rule is not what excludes it",
    ).toBeLessThanOrEqual(TERMINATOR_WINDOW);
    // `continue` is deliberately NOT a terminator. Stated as an assertion because the exemption above
    // rests on it, and a construct list is a hand-maintained set like any other.
    expect(
      SCAN_TERMINATOR_CONSTRUCTS.some((r) => r.test("    if (H.test(raw)) continue;")),
      "`continue` skips one element and bounds nothing — admitting it would re-import the terminator/recogniser confusion this scan exists to resolve",
    ).toBe(false);
  });

  it("a SIXTH section locator makes the owner set fail, BY NAME — the member-level probe", () => {
    // An assertion that was never made to fail is not a pin, and a per-construct removal probe is a
    // weaker claim than this one: it shows each construct is load-bearing, not that a NEW member is
    // caught. The plant is the exact locator this plan deleted from `audit-model.ts`, so the probe is
    // tied to the defect that was real rather than to an invented one.
    const dir = mkdtempSync(join(tmpdir(), "grugops-locator-"));
    tmpDirs.push(dir);
    // (Plan 29-29) The mirror keeps the tree's SHAPE, because the derivation now returns nested
    // repository-relative paths and a flattened copy would be a different set with the same size.
    const inDir = (): string[] =>
      sectionExtentOwnersAmong(nonTestModules(dir), (n) =>
        readFileSync(join(dir, n), "utf8"),
      );
    for (const n of nonTestModules()) {
      mkdirSync(dirname(join(dir, n)), { recursive: true });
      writeFileSync(join(dir, n), readFileSync(join(ROOT, n), "utf8"));
    }
    // THE CONTROL FIRST: the copies alone reproduce the live answer, so the failure below is caused
    // by the plant and not by the temp directory.
    const control = inDir();
    expect(control).toEqual(SECTION_EXTENT_OWNERS);
    expect(control).toHaveLength(SECTION_EXTENT_OWNER_COUNT);

    writeFileSync(join(dir, "scripts", "scratch-sixth-locator.ts"), PLANTED_SIXTH_LOCATOR);
    const withSixth = inDir();
    expect(withSixth).toContain("scripts/scratch-sixth-locator.ts");
    expect(withSixth).toHaveLength(SECTION_EXTENT_OWNER_COUNT + 1);
    expect(withSixth).not.toEqual(control);
    // …and the site is named, not merely counted, so a reviewer reading a failure is told WHICH line.
    expect(sectionExtentSitesIn(PLANTED_SIXTH_LOCATOR)).toEqual([
      'tableUnder :: if (lines[i].startsWith("## ")) break;',
    ]);

    // (Plan 29-29) THE SEVENTH PLANT, through THE SAME RULE over the same directory: the shape that
    // hid `audit-model.ts` from both arms is now a member too, and it lands in a NESTED directory so
    // the recursive walk is exercised by the probe rather than only by the enumeration case.
    mkdirSync(join(dir, "scripts", "runnable-ref"), { recursive: true });
    writeFileSync(
      join(dir, "scripts", "runnable-ref", "scratch-seventh-locator.ts"),
      PLANTED_SEVENTH_LOCATOR,
    );
    const withSeventh = inDir();
    expect(
      withSeventh,
      "the whitespace-class recogniser with a DEFERRED bound must be reported — this is the exact shape round 3 found green over a two-owner tree",
    ).toContain("scripts/runnable-ref/scratch-seventh-locator.ts");
    expect(withSeventh).toHaveLength(SECTION_EXTENT_OWNER_COUNT + 2);
  });

  it("the recogniser arm requires a SEPARATOR — it does not recognise an issue-reference pattern", () => {
    // 29-22's third construct admits a BACKSLASH after the hashes, so it recognises `/^#\d+$/` in
    // scripts/trace-render.ts — an issue reference, not a heading — and that noise is the reason
    // 29-22 recorded for keeping its own scan module-scoped. The narrowing is asserted from both
    // sides on planted lines, so it is a measured difference rather than a quiet convenience.
    //
    // (Plan 29-29) The arm now admits a whitespace CLASS as well as a literal space, so the property
    // is "a SEPARATOR is required" rather than "a literal space is required". What did NOT change is
    // the backslash: 29-22's construct is still not adopted, and the issue-reference line is still
    // refused. That is the half a widening loses if nobody asserts it.
    const heading = `  const H = ${SLASH}${CARET}${HASH}{1,2} ${SLASH};`;
    const issueRef = `  return ${SLASH}${CARET}${HASH}\\d+$${SLASH}.test(ref);`;
    expect(
      HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(heading)),
      "an anchored ATX recogniser followed by a literal space IS a heading recogniser",
    ).toBe(true);
    expect(
      HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(issueRef)),
      "an anchored `#` followed by a digit class is an issue reference and must NOT be recognised",
    ).toBe(false);
    // And the live module carrying that pattern is absent from the answer for that reason.
    expect(sectionExtentOwners()).not.toContain("scripts/trace-render.ts");
  });

  it("the CONSUMER set is derived, sorted and pinned two-sided with its cardinality", () => {
    // (Plan 29-29) Tree-wide, for the same reason the owner set is: the claim said "the parser's
    // consumers" and the read saw one directory. `importedSymbolsAt` accepts a nested path and a
    // relative specifier of any depth; the case below it proves the two readers agree on the 41
    // modules both can see, so the widening is not a second import grammar going unchecked.
    const modules = nonTestModules();
    expect(
      modules.length,
      "the non-test module corpus must really have been enumerated",
    ).toBe(NON_TEST_MODULE_COUNT);

    const consumers = modules
      .filter((n) =>
        importedSymbolsAt(n, "frontmatter").some((s) =>
          (LOCATOR_FUNCTIONS as readonly string[]).includes(s),
        ),
      )
      .sort();
    // NON-VACUITY FIRST: a consumer list that found nothing cannot report that the predicate moved.
    expect(
      consumers.length,
      "no module imports the section locator — a zero here would mean the authority is dead code, not that the predicate is unified",
    ).toBeGreaterThan(0);
    expect(consumers).toEqual([...consumers].sort());
    // THE LIST IS WHAT THE DERIVATION REPORTED, NOT WHAT THE PLAN PREDICTED. 29-25-PLAN.md predicted
    // the four guard modules; measured, it is FIVE, because this plan closed `audit-model.ts` rather
    // than absorbing it. A consumer that never adopted the authority is a LANG-07 failure and is
    // escalated; a consumer that adopted it is recorded here.
    expect(consumers).toEqual(LOCATOR_CONSUMERS);
    expect(consumers).toHaveLength(LOCATOR_CONSUMER_COUNT);

    // THE TWO SETS ARE DISJOINT EXCEPT FOR THE AUTHORITY ITSELF. A module that both OWNS a predicate
    // and CONSUMES the shared one is two grammars wearing one import, which is the shape that let
    // `voice-model.ts` be fence-aware in one half and fence-blind in the other at plan 29-20.
    const owners = sectionExtentOwners();
    // Both sets are now repository-relative paths, so this intersection is a real comparison rather
    // than a basename-versus-path mismatch that could never match anything and would read as clean.
    expect(
      owners.filter((n) => consumers.includes(n)),
      "no module may both declare a section-extent predicate and import the shared one",
    ).toEqual([]);
    expect(
      owners.every((o) => o.includes("/")) && consumers.every((c) => c.includes("/")),
      "the disjointness above is only meaningful if both sets are spelled the same way",
    ).toBe(true);
    expect(owners).toEqual(SECTION_EXTENT_OWNERS);
    expect(consumers).not.toContain("scripts/frontmatter.ts");
  });

  it("the tree-wide import reader agrees with the `scripts/`-scoped one on every module both can see", () => {
    // The widening above replaced `importedSymbols` with `importedSymbolsAt` inside this block. A
    // second import grammar landing unnoticed beside the first is exactly the class this phase
    // exists to delete, so the two are compared on the whole overlap rather than trusted to agree.
    const flat = nonTestScripts();
    // 41 → 42 (plan 29.1-01): `scripts/model-tiers.ts`. Derived independently — `ls scripts/*.ts`
    // minus the `.test.ts` members reports 42 on this tree.
    expect(flat.length, "the `scripts/`-scoped reader's own corpus").toBe(42);
    let compared = 0;
    for (const n of flat) {
      for (const spec of ["frontmatter", "canonical-frontmatter", "audit-model"]) {
        expect(
          importedSymbolsAt(`scripts/${n}`, spec),
          `the two readers disagree about ${n} <- ./${spec}.js`,
        ).toEqual(importedSymbols(n, spec));
        compared += 1;
      }
    }
    // 41 * 3 → 42 * 3 (plan 29.1-01), tracking the one module added above. Kept as a LITERAL times
    // the spec count rather than `flat.length * 3`: deriving it from the loop's own input would make
    // the assertion true by construction and blind to a corpus that silently shrank.
    expect(compared, "the comparison must really have run over the whole corpus").toBe(42 * 3);
    // NON-VACUITY: the comparison would be clean over two readers that both return nothing, so at
    // least one module must have produced a non-empty answer through the NEW reader.
    expect(
      flat.filter((n) => importedSymbolsAt(`scripts/${n}`, "frontmatter").length > 0).length,
      "the tree-wide reader must actually resolve imports, or the agreement above is vacuous",
    ).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // (PLAN 29-29, CR-02) THE CORRECTION — the classifier now sees the shape its own floor said
  // nothing in this tree used.
  //
  // Round 3 measured `SECTION_EXTENT_OWNERS = ["frontmatter.ts"]` green over a tree that had TWO
  // owners, because `audit-model.ts`'s `readRegistry` was missed by BOTH arms at once: the
  // recogniser arm required a literal space and that module spelled a whitespace class, and the
  // terminator arm never reached a bound collected into an array and consumed thirteen lines later.
  //
  // BOTH WIDENINGS ARE LOAD-BEARING, AND THAT IS A MEASUREMENT RATHER THAN A BELIEF. Run over the
  // pre-29-28 source of that module in this plan's session, the recogniser widening ALONE reports
  // nothing and the terminator widening ALONE reports nothing; only the pair reports the site. The
  // plan specified the recogniser half; shipping it alone would have been a correction that measured
  // nothing, which is the exact defect this round exists to refuse. The transcript is in
  // 29-29-SUMMARY.md and the property is asserted permanently by the seventh plant below.
  // ═══════════════════════════════════════════════════════════════════════════════════════════

  it("the recogniser arm sees a hash RUN and a whitespace CLASS — floor item 4's shape, both directions", () => {
    // THE SIX SPELLINGS. One hash, a run, and a `{n,m}` quantifier — each with a literal space and
    // with a whitespace class. Assembled from character codes so this file's own source carries no
    // heading recogniser of its own.
    const MUST_MATCH: readonly [string, string][] = [
      ["one hash, literal space", `  const A = ${SLASH}${CARET}${HASH} ${SLASH};`],
      ["a hash RUN, literal space", `  const B = ${SLASH}${CARET}${HASH}${HASH}${HASH} ${SLASH};`],
      ["a quantifier, literal space", `  const C = ${SLASH}${CARET}${HASH}{1,6} ${SLASH};`],
      ["one hash, whitespace CLASS", `  const D = ${SLASH}${CARET}${HASH}\\s${SLASH};`],
      ["a hash RUN, whitespace CLASS", `  const E = ${SLASH}${CARET}${HASH}${HASH}${HASH}\\s+(\\S+)${SLASH};`],
      ["a quantifier, whitespace CLASS", `  const F = ${SLASH}${CARET}${HASH}{1,6}\\s${SLASH};`],
    ];
    expect(MUST_MATCH.length, "all six combinations of the two axes must be swept").toBe(6);
    for (const [label, line] of MUST_MATCH) {
      expect(
        HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(line)),
        `${label} is an ATX heading recogniser and must be recognised: ${line}`,
      ).toBe(true);
    }

    // AND THE OTHER DIRECTION, because a classifier WIDENED until it is noisy is the same defect as
    // one NARROWED until the answer comes out right. 29-22's third construct admitted a backslash
    // after the hashes and so recognised an issue-reference pattern; the widening here adds a
    // whitespace class and a hash run and adds NOTHING else.
    const MUST_NOT_MATCH: readonly [string, string][] = [
      ["an issue reference", `  return ${SLASH}${CARET}${HASH}\\d+$${SLASH}.test(ref);`],
      ["a bare hash with no separator", `  const G = ${SLASH}${CARET}${HASH}$${SLASH};`],
      ["a hash run with no separator", `  const H = ${SLASH}${CARET}${HASH}${HASH}${HASH}(\\S+)${SLASH};`],
      ["a hash followed by a word character", `  const I = ${SLASH}${CARET}${HASH}[A-Za-z]${SLASH};`],
    ];
    for (const [label, line] of MUST_NOT_MATCH) {
      expect(
        HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(line)),
        `${label} is NOT a heading recogniser and must not be admitted: ${line}`,
      ).toBe(false);
    }
  });

  it("the widening admits NO live site — the two modules a careless one would take are absent BY NAME", () => {
    // Both halves are asserted on the LIVE tree rather than on planted lines, because the hazard is
    // a widening that is clean on fixtures and noisy on the repository.
    const owners = sectionExtentOwners();

    // `trace-render.ts` carries `/^#\d+$/`, an ISSUE-REFERENCE pattern. The recogniser arm must not
    // even recognise it, so the exclusion is not resting on the terminator arm by luck.
    const traceSrc = codeLinesOfSource(
      readFileSync(join(ROOT, "scripts", "trace-render.ts"), "utf8"),
    ).join("\n");
    const issueRefLine = traceSrc
      .split("\n")
      .find((l) => l.includes("test(ref)") && l.includes("\\d+"));
    expect(issueRefLine, "trace-render.ts must still carry the issue-reference pattern").toBeDefined();
    expect(
      HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(issueRefLine as string)),
      "an anchored `#` followed by a digit class is an issue reference, not a heading",
    ).toBe(false);
    expect(sectionExtentSitesIn(traceSrc)).toEqual([]);
    expect(owners).not.toContain("scripts/trace-render.ts");

    // `validate-agent-factory.ts` is the OTHER direction and the stronger half: its board-heading
    // normaliser really does spell `/^##\s+/`, so the WIDENED recogniser arm DOES recognise it. It
    // is excluded by the CONJUNCTION — the line bounds no scan — which is the mechanism this block
    // rests on, exercised on a live module rather than on a planted one.
    const validateSrc = codeLinesOfSource(
      readFileSync(join(ROOT, "scripts", "validate-agent-factory.ts"), "utf8"),
    ).join("\n");
    const boardLine = validateSrc.split("\n").find((l) => l.includes(".replace(") && l.includes("##"));
    expect(boardLine, "validate-agent-factory.ts must still carry the board-heading replace").toBeDefined();
    expect(
      HEADING_RECOGNISER_CONSTRUCTS.some((r) => r.test(boardLine as string)),
      "the widened arm DOES recognise a whitespace-class heading regex — that is the widening",
    ).toBe(true);
    expect(
      sectionExtentSitesIn(validateSrc),
      "…and it still contributes no site, because it terminates no scan. The conjunction is what excludes it",
    ).toEqual([]);
    expect(owners).not.toContain("scripts/validate-agent-factory.ts");
  });

  it("the SEVENTH plant — a whitespace-class recogniser with a DEFERRED bound — is reported, and each widening alone is not enough", () => {
    // The plant is `audit-model.ts`'s pre-29-28 shape restated. It is what makes this correction a
    // measurement of the defect that shipped rather than of an invented one.
    expect(sectionExtentSitesIn(PLANTED_SEVENTH_LOCATOR)).toEqual([
      "claimSpans :: if (CLAIM_HEAD.test(lines[i])) marks.push(i);",
    ]);

    // NEITHER WIDENING ALONE REACHES IT. Run with the pre-29-29 recogniser arm restored, the answer
    // is empty; run with the pre-29-29 terminator arm restored, the answer is empty. Both arms were
    // blind at once, which is why the plan's recogniser-only correction would have measured nothing.
    // The narrow arms are RECONSTRUCTED here rather than checked out of a commit — keying a
    // permanent case to a sha rots the first time the file moves (plan 29-27, decision 5).
    const NARROW_REC: readonly RegExp[] = [
      /\/\^#(?:\{[\d,]+\})? /,
      /\.startsWith\(\s*["'`]#{1,6} /,
    ];
    const NARROW_TERM: readonly RegExp[] = [
      /\bbreak\b/,
      /\breturn\s+(?!true\b|false\b|null\b|undefined\b|\{|\[)\S/,
      /^\s*[A-Za-z_$][\w$.]*\s*=\s*(?:i|j|k|idx|index)\b\s*[;+)]/,
    ];
    expect(
      sectionExtentSitesIn(PLANTED_SEVENTH_LOCATOR, NARROW_REC, SCAN_TERMINATOR_CONSTRUCTS),
      "the recogniser widening alone does not reach it — the terminator arm is blind too",
    ).toEqual([]);
    expect(
      sectionExtentSitesIn(PLANTED_SEVENTH_LOCATOR, HEADING_RECOGNISER_CONSTRUCTS, NARROW_TERM),
      "the terminator widening alone does not reach it — the recogniser arm is blind too",
    ).toEqual([]);
    // And the reconstructed narrow arms really are the ones that shipped: they still find the SIXTH
    // plant, so the two empties above are about this plant's shape and not about a broken fixture.
    expect(
      sectionExtentSitesIn(PLANTED_SIXTH_LOCATOR, NARROW_REC, NARROW_TERM),
      "the reconstructed pre-29-29 arms must still find the sixth plant, or the controls above prove nothing",
    ).toEqual(['tableUnder :: if (lines[i].startsWith("## ")) break;']);
  });

  it("the module set is TREE-WIDE — derived recursively, counted by a second independent enumeration", () => {
    // (V-29-26-02, closed here) The owner derivation used to read `scripts/` NON-RECURSIVELY — 41 of
    // the 49 tracked non-test modules — while the case name, the refusal wording and the block's
    // prose all said "tree-wide". A claim wider than the assertion behind it is this repository's
    // named defect class, and the remedy it already uses is to widen the assertion rather than to
    // narrow the sentence. So the read is recursive, and the answer over the wider set is REPORTED
    // rather than adjusted: it is unchanged at one owner.
    const walked = nonTestModules();
    expect(walked.length, "the recursive walk must enumerate the whole tree").toBe(
      NON_TEST_MODULE_COUNT,
    );
    expect(walked).toEqual([...walked].sort());
    // The nested and out-of-`scripts/` members the old read could not see, named rather than counted.
    for (const outside of [
      "hooks/guard.ts",
      "install/install.ts",
      "scripts/runnable-ref/reference-check.ts",
      "vitest.config.ts",
    ]) {
      expect(walked, `the recursive set must contain ${outside}`).toContain(outside);
    }
    // 41 → 42 (plan 29.1-01): `scripts/model-tiers.ts`, the same one module the flat reader gained.
    // Both pins move together on purpose — they are two enumerations of one corpus, and a change
    // that moved only one of them would be the disagreement this pair exists to surface.
    expect(
      walked.filter((n) => n.startsWith("scripts/") && !n.slice(8).includes("/")).length,
      "…and the old non-recursive answer is a strict subset, stated as the number this widening moved off",
    ).toBe(42);

    // THE ELEMENT COUNT, DERIVED INDEPENDENTLY OF THE WALK THAT PRODUCES IT. A vacuity floor catches
    // an EMPTY denominator and has never caught a SILENTLY SHORT one, so the set is compared against
    // git's own index — a second enumeration this file does not implement.
    const tracked = spawnSync("git", ["ls-files", "*.ts"], { cwd: ROOT, encoding: "utf8" });
    expect(tracked.status, "git ls-files must succeed, or this comparison measures nothing").toBe(0);
    const trackedModules = (tracked.stdout as string)
      .split("\n")
      .filter((n) => n !== "" && !n.endsWith(".test.ts") && !n.endsWith(".d.ts"))
      .sort();
    expect(
      walked,
      "the recursive walk and git's index must enumerate the SAME modules — a difference means either the walk is short or a `.ts` file is uncommitted, and an owner scan over an unenumerated module is not tree-wide",
    ).toEqual(trackedModules);
  });

  it("floor item 1 is a MEASUREMENT: every `new RegExp`-built section bound in the tree is derived and named", () => {
    // (Plan 29-29) Re-checking every floor item against the final tree — the discipline this plan
    // applies to item 4 — found item 1 REACHABLE, twice. A `new RegExp(...)` built from a template
    // string is invisible to the recogniser arm by construction (there is no regex literal to match)
    // and `sectionBody` in the two catalog generators uses one to bound a `## ` section by lookahead.
    //
    // That is a THIRD grammar over the same bytes and it is a LANG-07 finding, escalated in
    // 29-29-SUMMARY.md rather than absorbed into the owner list: under this block's own published
    // definition a section-extent construct is a heading recogniser USED ON A LINE that terminates
    // or bounds a SCAN, and a whole-document regex performs no line scan at all. Widening the
    // definition to swallow it would be re-writing the rule until the answer came out interesting,
    // the mirror image of narrowing it until the answer comes out clean.
    //
    // What is NOT optional is that the floor stop reading as a hypothetical. The shape's live count
    // is derived here and pinned two-sided WITH ITS SITES NAMED, so item 1 cannot rot the way item 4
    // did: a third generator adopting the same helper reds this case on the day it lands.
    //
    // (PLAN 29-35) THE ANSWER IS NOW EMPTY, WHICH RAISES THE BAR ON THE HARNESS'S OWN PREMISE. Both
    // addresses are gone — deleted, not exempted — so this scan can no longer prove it works by
    // producing a member. Three things therefore hold it up, and all three are asserted below: the
    // MODULE CORPUS is floored against its independently pinned size, so an empty answer cannot come
    // from a walk that read nothing; the scanned LINE count is floored, so it cannot come from files
    // read but never classified; and the three discrimination assertions are KEPT, so the pattern is
    // shown still to recognise the shape it reports zero of.
    const scanned = nonTestModules();
    expect(
      scanned.length,
      "the module corpus must really have been enumerated — an EMPTY site list derived from an empty file list is a clean answer produced by reading nothing",
    ).toBe(NON_TEST_MODULE_COUNT);
    const sites: string[] = [];
    let linesClassified = 0;
    for (const rel of scanned) {
      codeLinesOfSource(readFileSync(join(ROOT, rel), "utf8")).forEach((line, i) => {
        linesClassified += 1;
        if (REGEXP_BUILT_SECTION_BOUND.test(line)) sites.push(`${rel}:${i + 1}`);
      });
    }
    // A vacuity floor catches an EMPTY denominator and has never caught a SILENTLY SHORT one, so the
    // LINES the pattern was actually asked about are counted too, not just the files opened.
    expect(
      linesClassified,
      "the pattern must have been asked about real lines — a zero-line scan reports zero sites for a reason that has nothing to do with the tree",
    ).toBeGreaterThan(10000);
    expect(sites.sort()).toEqual(REGEXP_SECTION_BOUND_SITES);
    expect(sites).toHaveLength(REGEXP_SECTION_BOUND_SITE_COUNT);

    // THE DERIVATION DISCRIMINATES, BOTH WAYS, on planted lines — otherwise a two-member answer from
    // a pattern that matches almost nothing is indistinguishable from one that works.
    expect(
      REGEXP_BUILT_SECTION_BOUND.test(
        '  const re = new RegExp(`^## ${h}\\n([\\s\\S]*?)(?=\\n## |$(?![\\s\\S]))`, "m");',
      ),
      "a `new RegExp` bounding a `## ` section is the shape floor item 1 names",
    ).toBe(true);
    expect(
      REGEXP_BUILT_SECTION_BOUND.test('  const re = new RegExp(`\\b(${tokens})\\b`, "gi");'),
      "a `new RegExp` carrying no ATX heading run is NOT this shape",
    ).toBe(false);
    expect(
      REGEXP_BUILT_SECTION_BOUND.test('  const re = new RegExp(`^#${issue}$`, "m");'),
      "a `new RegExp` whose hash is followed by no separator is an issue reference, not a heading",
    ).toBe(false);
  });

  it("the six evasions the adversarial pass found against THIS plan's fix are all reported", () => {
    // Every one of these was measured getting through the widened arms before it was closed; the
    // transcript is in 29-29-SUMMARY.md. A green suite is not proof for a safety invariant in this
    // repository, and the widened classifier IS the only evidence for LANG-07's central claim.
    expect(sectionExtentSitesIn(PLANTED_EVASION_SOURCE)).toEqual([
      "evadeByBoundResult :: const isHead = HEAD_A.test(lines[i]);",
      "evadeByPushOffset :: if (HEAD_B.test(lines[i])) marks.push(i + 0);",
      "evadeByLeadingWhitespace :: if (HEAD_C.test(lines[i])) return i;",
      "evadeByMatchCall :: if (lines[i].match(HEAD_D)) break;",
      "evadeBySearchCall :: if (lines[i].search(HEAD_E) === 0) return i;",
      "evadeByOptionalChain :: if (HEAD_F?.test(lines[i])) break;",
      "evadeByBoundExpression :: if (HEAD_G.test(lines[i])) {",
    ]);

    // AND THE DECLARATION SKIP STILL SKIPS WHAT IT IS FOR. Closing [B1] narrowed a rule; the other
    // side of it must still hold or the fix is a widening that double-counts every recogniser in the
    // tree at its point of definition.
    const definition = `  const HEAD_E = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`;
    expect(
      RECOGNISER_BINDING.test(definition.trim()),
      "a recogniser DEFINITION is still a binding",
    ).toBe(true);
    expect(
      declarationAppliesRecogniser(definition, ["HEAD_E"]),
      "…and it APPLIES nothing, so it is still skipped",
    ).toBe(false);
    expect(
      declarationAppliesRecogniser("  const isHead = HEAD_E.test(lines[i]);", ["HEAD_E"]),
      "a binding of the TEST'S RESULT applies a recogniser and is a use, not a definition",
    ).toBe(true);
    // A source that only DEFINES recognisers contributes no site — the property the skip protects.
    expect(
      sectionExtentSitesIn(
        [
          "export const A = 1;",
          `const HEAD_F = ${SLASH}${CARET}${HASH}${HASH}\\s${SLASH};`,
          `const HEAD_G = ${SLASH}${CARET}${HASH}{1,6} ${SLASH};`,
          "",
        ].join("\n"),
      ),
      "a module that only DECLARES heading recognisers owns no section extent",
    ).toEqual([]);

    // THE LIVE TREE CARRIES EXACTLY ONE declaration-line that applies a recogniser, and it bounds no
    // scan. Derived rather than asserted, so the [B1] closure's live blast radius is a measurement.
    //
    // (Plan 29-37) THE SITE IS RECORDED BY ITS CODE, NOT BY ITS LINE NUMBER. This pin read
    // `scripts/audit-model.ts:1081` until plan 29-37 inserted a comment block above it and the same
    // unchanged line became 1239. A positional literal that moves when nothing about the property
    // moved is this repository's recorded set-literal-drift class arriving in a guard, and the
    // repair is to address the site by what it IS. The count is still exactly one and the identity
    // is still exact — a SECOND applying declaration, or a DIFFERENT one, still reds here.
    const appliedSites: string[] = [];
    for (const rel of nonTestModules()) {
      const code = codeLinesOfSource(readFileSync(join(ROOT, rel), "utf8"));
      const names = recogniserNamesIn(code, HEADING_RECOGNISER_CONSTRUCTS);
      code.forEach((line) => {
        if (!RECOGNISER_BINDING.test(line.trim())) return;
        if (declarationAppliesRecogniser(line, names)) {
          appliedSites.push(`${rel} :: ${line.trim()}`);
        }
      });
    }
    expect(
      appliedSites,
      "the [B1] closure's live blast radius — declaration-lines that APPLY a recogniser",
    ).toEqual(["scripts/audit-model.ts :: const headingMatch = CLAIM_HEADING_RE.exec(lines[start]);"]);
    expect(
      sectionExtentOwners(),
      "…and closing [B1] must not have made a new module an owner; if it did, that is a LANG-07 escalation and not a constant to edit",
    ).toEqual(SECTION_EXTENT_OWNERS);
  });

  it("every remaining floor item's LIVE COUNT is DERIVED, not asserted in prose", () => {
    // A floor that asserts a falsehood about this tree is worse than no floor — that is item 4's
    // whole story, and it is the reason every countable item now has its number produced by an
    // expression rather than typed into a comment. Items 3 and 6 are deliberately absent: both need
    // a call graph or a data-flow analysis this scan does not build, and an underivable number in a
    // floor is worse than an honest "not counted".
    const modules = nonTestModules();
    expect(modules.length, "the floor is a claim about the WHOLE tree").toBe(NON_TEST_MODULE_COUNT);

    // ITEM 2 — a heading test written as a slice, a charAt or an indexOf comparison.
    const ITEM_2 =
      /\.slice\(\s*0\s*,\s*\d+\s*\)\s*===\s*["'`]#|\.charAt\(\s*0\s*\)\s*===\s*["'`]#|\.indexOf\(\s*["'`]#{1,6} /;
    // ITEM 4 RESIDUE — an anchored ATX regex whose separator is a bracket character class of its own
    // (`/^#{1,6}[ \t]/`), which is neither a literal space nor the `\s` class the arm now admits.
    const ITEM_4_RESIDUE = /\/\^#(?:#*)(?:\{[\d,]+\})?\[/;
    const countOver = (re: RegExp): string[] => {
      const hits: string[] = [];
      for (const rel of modules) {
        codeLinesOfSource(readFileSync(join(ROOT, rel), "utf8")).forEach((line, i) => {
          if (re.test(line)) hits.push(`${rel}:${i + 1}`);
        });
      }
      return hits;
    };
    expect(countOver(ITEM_2), "floor item 2 — slice/charAt/indexOf heading tests").toEqual(
      FLOOR_ITEM_2_SITES,
    );
    expect(
      countOver(ITEM_4_RESIDUE),
      "floor item 4's residue — an ATX recogniser whose separator is a bracket class",
    ).toEqual(FLOOR_ITEM_4_RESIDUE_SITES);

    // BOTH EXPRESSIONS DISCRIMINATE. A zero from a pattern that matches nothing is indistinguishable
    // from a zero from a pattern that works, and this project has paid for that confusion.
    expect(ITEM_2.test('  if (line.slice(0, 3) === "## ") break;')).toBe(true);
    expect(ITEM_2.test('  if (line.charAt(0) === "#") break;')).toBe(true);
    expect(ITEM_2.test('  if (line.indexOf("## ") === 0) break;')).toBe(true);
    expect(ITEM_2.test('  if (line.startsWith("## ")) break;')).toBe(false);
    expect(ITEM_4_RESIDUE.test(`  const R = ${SLASH}${CARET}${HASH}{1,6}[ \\t]${SLASH};`)).toBe(true);
    expect(ITEM_4_RESIDUE.test(`  const R = ${SLASH}${CARET}${HASH}{1,6}\\s${SLASH};`)).toBe(false);

    // ITEM 5 — a committed `.js` with no `.ts` beside it is the only file a `*.ts` enumeration can
    // structurally miss. Derived by walking the same tree with the same skip list.
    const jsWalk = (dir: string, rel: string, acc: string[]): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (skipWalkEntry(entry.name)) continue;
        const next = rel === "" ? entry.name : `${rel}/${entry.name}`;
        if (entry.isDirectory()) jsWalk(join(dir, entry.name), next, acc);
        else if (entry.name.endsWith(".js")) acc.push(next);
      }
      return acc;
    };
    const js = jsWalk(ROOT, "", []).sort();
    // The same premise assertion the `.ts` walk carries, and for the same reason: this walk read
    // `.tmp-build/`'s forty-eight phantom copies on its first run and reported them as findings.
    const trackedJs = spawnSync("git", ["ls-files", "*.js"], { cwd: ROOT, encoding: "utf8" });
    expect(trackedJs.status, "git ls-files must succeed, or this comparison measures nothing").toBe(0);
    expect(
      js,
      "the `.js` walk and git's index must enumerate the SAME files — a difference means the walk strayed into a build scratch tree or a committed output is missing",
    ).toEqual((trackedJs.stdout as string).split("\n").filter((n) => n !== "").sort());
    expect(
      js.length,
      "the `.js` enumeration must not be empty — this tree commits its build output",
    ).toBeGreaterThan(30);
    const orphans = js.filter((n) => !existsSync(join(ROOT, `${n.slice(0, -3)}.ts`)));
    expect(orphans, "floor item 5 — committed `.js` with no `.ts` beside it").toEqual(
      FLOOR_ITEM_5_SITES,
    );
  });

  it("no module outside the authority declares the frontmatter parser's name", () => {
    // (Plan 29-40, G-29-1 / V-29-35-01) See FRONTMATTER_PARSER_OWNERS above for the bound this
    // tripwire has, for why the imported-symbol pin and the section-extent scan could both stay green
    // over the duplicate it exists to catch, and for the deletion-not-membership remedy on a red.

    // ── THE DENOMINATOR FIRST, IN ITS OWN EXPECTATION WITH ITS OWN MESSAGE. ────────────────────
    // The corpus is the RECURSIVE, repository-rooted enumeration — never `nonTestScripts()`, which
    // reads ONE directory and covers 41 of these 49 modules. A tripwire calling itself repository-wide
    // while reading a subset is V-29-26-02 recreated inside the assertion written to prevent it.
    //
    // AND THE SIZE IS ASSERTED BEFORE THE ANSWER, because a vacuity floor that only catches an EMPTY
    // set never catches a SILENTLY SHORT one. This phase has already paid for that distinction: a
    // one-owner answer over a walk that stopped after four directories looks exactly like a
    // one-owner answer over the whole tree.
    const modules = nonTestModules();
    expect(
      modules.length,
      "the recursive non-test module walk must really have enumerated the whole tree before anything is claimed about its contents — a short walk reporting one clean owner is the failure this expectation exists to make loud",
    ).toBe(NON_TEST_MODULE_COUNT);
    expect(modules).toContain("scripts/frontmatter.ts");
    expect(modules).toContain("scripts/generate-catalog.ts");
    expect(modules).toContain("scripts/generate-role-adapters.ts");

    // ── THE MEMBERSHIP CLAIM, TWO-SIDED, DERIVED. ─────────────────────────────────────────────
    const owners = modules.filter((rel) =>
      declaresFrontmatterParser(readFileSync(join(ROOT, rel), "utf8")),
    );
    expect(owners).toEqual([...owners].sort());
    expect(
      owners,
      "a module outside scripts/frontmatter.ts declares a function called `parseFrontmatter`. That is a LANG-07 failure (D-24) and it is closed by DELETING the second declaration and consuming the authority — never by adding the module to this list",
    ).toEqual(FRONTMATTER_PARSER_OWNERS);
    // Cardinality pinned as a NUMBER beside the member list, so a recogniser that silently stops
    // matching shrinks LOUDLY rather than passing over a set it no longer populates.
    expect(owners).toHaveLength(FRONTMATTER_PARSER_OWNER_COUNT);
    // …and the two generators are named as NON-members, because a one-member answer must not be one
    // member by accident of which file happened to match. These are the two modules that HELD the
    // duplicate — one until plan 27-23, the other until plan 29-40.
    expect(owners).not.toContain("scripts/generate-catalog.ts");
    expect(owners).not.toContain("scripts/generate-role-adapters.ts");

    // ── PROVEN ABLE TO FAIL: SIX DECLARATION SPELLINGS MATCH. ─────────────────────────────────
    // Every form is PLANTED and asserted rather than trusted. The live answer is one member; these
    // plants are what make that one member a measurement instead of a coincidence.
    const MATCHING_DECLARATIONS: readonly (readonly [string, string])[] = [
      ["plain", "function parseFrontmatter(text: string) {\n  return text;\n}\n"],
      ["exported", "export function parseFrontmatter(text: string) {\n  return text;\n}\n"],
      ["generic", "export function parseFrontmatter<T>(text: string): T {\n  throw text;\n}\n"],
      ["async", "async function parseFrontmatter(text: string) {\n  return text;\n}\n"],
      ["const arrow", "const parseFrontmatter = (text: string) => text;\n"],
      ["let function expression", "let parseFrontmatter = function (text: string) {\n  return text;\n};\n"],
    ];
    for (const [label, planted] of MATCHING_DECLARATIONS) {
      expect(
        declaresFrontmatterParser(planted),
        `the ${label} declaration spelling must be recognised — a form the recogniser cannot see is a form a second copy can hide in`,
      ).toBe(true);
    }

    // ── AND FIVE NEAR MISSES DO NOT. ──────────────────────────────────────────────────────────
    // A recogniser WIDENED until it is noisy is the same defect as one NARROWED until the answer comes
    // out right, so both directions are planted. The last three are what every module in the tree that
    // legitimately USES the authority looks like; if any of them matched, the live answer would be ten
    // owners and the tripwire would be deleted as noise within a round.
    const NON_MATCHING: readonly (readonly [string, string])[] = [
      [
        "a longer identifier sharing the PREFIX",
        "export function parseFrontmatterStrict(text: string) {\n  return text;\n}\n",
      ],
      [
        "a longer identifier sharing the SUFFIX",
        "export function reparseFrontmatter(text: string) {\n  return text;\n}\n",
      ],
      [
        "an IMPORT of the name",
        'import { parseFrontmatter, sectionEndIndex } from "./frontmatter.js";\n',
      ],
      [
        "a COMMENT naming it",
        "// parseFrontmatter is the one authority; do not declare a second one.\n// const parseFrontmatter = (t: string) => t;\n",
      ],
      [
        "a CALL to it",
        "const parsed = parseFrontmatter(text);\nconst again = await parseFrontmatter(other);\n",
      ],
    ];
    for (const [label, planted] of NON_MATCHING) {
      expect(
        declaresFrontmatterParser(planted),
        `${label} must NOT be read as a local declaration — this is a NAME test, and a substring test would report every consumer of the authority as an owner`,
      ).toBe(false);
    }

    // ── THE AUTHORITY'S OWN SOURCE IS NAMED, so the one member is the one intended. ────────────
    expect(
      declaresFrontmatterParser(readFileSync(join(ROOT, "scripts", "frontmatter.ts"), "utf8")),
    ).toBe(true);
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
  for (const name of roleAgentNames(m)) {
    if (name === COORDINATOR) continue;
    rmSync(adapterPath(m, name), { force: true });
  }
  repointGrant(adapterPath(m, COORDINATOR), HISTORICAL_GRANT_7);
  return m;
}

function consistentMirror(): string {
  const m = mirror();
  const names = roleAgentNames(m);
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

// (Plan 29.1-12, R2-CR-01) THE SAME RUN, REACHED THROUGH A *RELATIVE* OVERRIDE.
//
// `runIn` above sets the override and never the working directory, which is precisely why no case in
// this repository could see R2-CR-01: a relative override is only meaningful relative to something,
// and every mirror root the suite plants is absolute. THE WORKING DIRECTORY IS THE INPUT A RELATIVE
// OVERRIDE IS RESOLVED AGAINST, so this helper takes the directory to run from rather than inheriting
// the suite's, and passes the override spelling separately.
function runInRelative(
  cwd: string,
  checkRoot: string,
): SpawnSyncReturns<string> {
  return spawnSync("node", [GUARD_JS], {
    encoding: "utf8",
    cwd,
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
}

// The combined stdout+stderr of a guard run (findings print to stdout).
function out(r: SpawnSyncReturns<string>): string {
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

// ---------------------------------------------------------------------------------------------
// (Plan 29-27) WHICH GUARD PRINTED THIS LINE — ATTRIBUTED, NOT INFERRED FROM INDENTATION.
//
// The two voice guards each name the offending file, and several cases below assert that BOTH did.
// Until this plan that pair was told apart by COLUMN: guard_voice accumulated a raw string and
// printed its findings at column zero, guard_caveman_voice folded through `reportMeasured` and
// printed them indented. That is a positional accident, not a property — and it evaporated the
// moment guard_voice folded through the same authority, which is exactly what CR-01's remedy
// required. Two identical assertions asserting one thing twice is the WR-06 defect this file already
// carries a tripwire for; distinguishing two lines by whitespace is the same defect one step earlier.
//
// So attribution comes from the OUTPUT STRUCTURE the guards actually have: every guard opens with a
// `[guard_name]` banner and everything until the next banner is its own. A line is credited to the
// guard whose section it sits in, which stays true however either guard chooses to format.
function guardSection(o: string, banner: string): string[] {
  const lines = o.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`[${banner}]`));
  if (start === -1) return [];
  const rest = lines.findIndex((l, i) => i > start && /^\[[a-zA-Z_]+\]/.test(l));
  return lines.slice(start + 1, rest === -1 ? lines.length : rest);
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

  // ── IN-03 (plan 29-18): the neutralizer and the counter must agree about CASE. ────────────────
  //
  // `countLexiconTokens` is the ONE implementation of "is this a caveman occurrence", and it matches
  // CASE-INSENSITIVELY. `neutralizePhrases` is a named, bounded exemption FROM that one decision, and
  // it matched case-SENSITIVELY — so a sentence-initial `Grug voice` in correct clear-voice prose
  // survived the exemption and was then convicted by the counter. Two halves of one identity
  // question, two answers.
  //
  // THE DANGEROUS HALF OF THE FIX IS THAT IT WIDENS AN EXEMPTION. So the bound is asserted from BOTH
  // sides and both directions are permanent cases:
  //
  //   PERMISSIVE (RED before this plan, GREEN after) — the exemption must swallow the three brand
  //   phrasings in ANY case.
  //   SCOPE CONTROL (GREEN before AND after) — the exemption must NOT swallow a bare caveman token
  //   that merely sits next to one. A widening proven only in the permissive direction is not proven.
  //
  // Every case below runs on `consistentMirror()` — the GREEN baseline — so a nonzero exit is
  // attributable to the plant rather than to some unrelated guard, and each red case asserts the
  // guard_voice FINDING TEXT rather than only the exit code. The finding text is the mechanism here:
  // guardVoice reports the line AFTER neutralization, so what it prints says which phrasings were
  // exempted and which survived.
  //
  // The host is `agents-md-scribe.md` for the reason the refinement case above records at length: it
  // is a ROLE_FILES member with roughly 450 bytes of headroom under its guard_role_size ceiling, so
  // these plants fail for VOICE reasons or not at all. No byte ceiling may be raised to make a plant
  // fit.
  const CASE_INSENSITIVE_EXEMPT_PLANTS: readonly {
    what: string;
    line: string;
  }[] = [
    {
      what: "a sentence-initial `Grug voice`",
      line: "Grug voice is reserved for the fenced block.",
    },
    {
      what: "a sentence-initial `Grug wink`",
      line: "Grug wink stays out of a security finding.",
    },
    {
      what: "the brand command in UPPER CASE",
      line: "Run /GRUG to start the factory.",
    },
  ];
  for (const plant of CASE_INSENSITIVE_EXEMPT_PLANTS) {
    it(`guard_voice: ${plant.what} in clear voice does NOT red the guard (IN-03)`, () => {
      const m = consistentMirror();
      appendFileSync(rolePath(m, "agents-md-scribe.md"), `\n${plant.line}\n`);
      const r = runIn(m);
      // The OUTPUT assertion runs FIRST, deliberately: on a build where the exemption disagrees with
      // the counter about case, the exit-code assertion alone reports `1 !== 0` and says nothing
      // about WHICH guard convicted. Asserting the banner first makes the failure print the whole
      // run, so the RED names guard_voice and the offending line rather than a bare number.
      expect(out(r)).toContain("ALL CHECKS PASSED");
      expect(r.status).toBe(0);
    });
  }

  // THE BOUND, side one: a bare caveman token in sentence-initial position is NOT one of the three
  // exempt phrasings and must still convict. This case is GREEN before this plan and GREEN after —
  // that is what makes it a control rather than coverage.
  it("guard_voice: a sentence-initial `Grug smash` is NOT exempt and still reds (IN-03 scope control)", () => {
    const m = consistentMirror();
    appendFileSync(
      rolePath(m, "agents-md-scribe.md"),
      "\nGrug smash the rock.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (Plan 29-27) The aggregate FAIL wording is now `reportMeasured`'s, not this guard's own string.
    // Folding guard_voice through the shared vacuity rule is CR-01's second half, and the point of a
    // shared authority is that the sentence belongs to it — so the assertion moves to the shape the
    // authority publishes, WITH its denominator, rather than to a wording this guard no longer owns.
    expect(o).toMatch(/FAIL {2}voice: \d+ finding\(s\) over \d+ elements/);
    expect(o).toContain("agents-md-scribe.md");
    // The reported line, verbatim. Nothing on it was rewritten, because none of the three exempt
    // phrasings occurs on it — asserted as TEXT so the case tests the neutralizer's reach and not
    // merely the exit code.
    expect(o).toContain("Grug smash the rock.");
  });

  // THE BOUND, side two — the UNION of the two arms on ONE line. The exemption and a violation sit
  // together, which is the only shape that can tell a bounded exemption from a prefix-swallowing one.
  // GREEN before and after: the line must convict either way.
  it("guard_voice: a brand phrase adjacent to a bare caveman token does NOT protect it (IN-03 scope control)", () => {
    const m = consistentMirror();
    appendFileSync(
      rolePath(m, "agents-md-scribe.md"),
      "\nGrug voice, then grug smash the rock.\n",
    );
    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const o = out(r);
    // (Plan 29-27) The authority's wording, with its denominator — see the sibling control above.
    expect(o).toMatch(/FAIL {2}voice: \d+ finding\(s\) over \d+ elements/);
    // The surviving half, asserted by name. `grug smash` must reach the counter whatever happens to
    // the brand phrase beside it.
    expect(o).toContain("grug smash the rock.");
  });

  // THE MECHANISM, on that same line — RED before this plan, GREEN after.
  //
  // The two controls above pass on BOTH builds, and they would pass on a build where the exemption
  // never fired at all. This case asserts the other half: on the SAME line, the brand phrase IS
  // rewritten to its marker-free filler while the adjacent caveman token is NOT. guardVoice prints
  // the post-neutralization line, so the printed text is the direct evidence that the exemption
  // applied and stopped where it was supposed to stop.
  it("guard_voice: on one line the brand phrase IS neutralized and the adjacent token is NOT (IN-03)", () => {
    const m = consistentMirror();
    appendFileSync(
      rolePath(m, "agents-md-scribe.md"),
      "\nGrug voice, then grug smash the rock.\n",
    );
    const o = out(runIn(m));
    expect(o).toContain("voice-meta, then grug smash the rock.");
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

  it("FIXTURE C — a block passing BOTH arms is GREEN: the false-red control (D-43)", () => {
    // THE LOAD-BEARING CASE. Without it the 17/17 RED transcript proves nothing, because a gate that
    // always fails is trivially red. The exit STATUS is asserted explicitly, not merely the presence
    // or absence of stdout text: spawnSync does not throw on a non-zero exit, so a case that only
    // matched stdout would pass against a guard that exits 1 unconditionally.
    const m = mirror();
    plantCavemanBlock(m, "brownfield-mapper.md", [
      `You ${CAVEMAN_LEXICON[0]}. You ${CAVEMAN_LEXICON[4]} ${CAVEMAN_LEXICON[2]}.`,
      "You map repo.",
    ]);
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
    // And the PASS line CARRIES THE MEASUREMENT with its full denominator (D-08).
    expect(out(r)).toContain(
      `caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`,
    );
    // The per-block detail line is emitted for the planted block too — the measurement is printed
    // inside the loop, so a green run still publishes what it read.
    expect(out(r)).toMatch(/brownfield-mapper\.md: tokens \d+ \/ content words \d+, banned 0/);
  });

  it("THE CONJUNCTION IS FALSIFIABLE: a scratch build shipping `||` turns fixtures A and B GREEN", () => {
    // WHY THIS CASE AND NOT THE TRANSCRIPT. Both arms fail 17/17 independently at every N, so the
    // 17-row RED table in the guard's source header would be BYTE-IDENTICAL from a build that shipped
    // the disjunction. The three fixtures above are the only evidence that distinguishes them — and
    // "these fixtures would catch it" is itself a claim, so it is MEASURED here rather than argued.
    //
    // The scratch harness asserts the mutation applied, so a `replace` that matched nothing cannot
    // leave this case passing against the committed build.
    const disjunctionGuard = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace(
          "if (!(positiveHolds && negativeHolds)) {",
          "if (!(positiveHolds || negativeHolds)) {",
        ),
    });

    // FIXTURE A on the broken build: positive holds, so the disjunction passes it. GREEN — wrong.
    const a = mirror();
    plantCavemanBlock(a, "brownfield-mapper.md", [
      `You ${CAVEMAN_LEXICON[0]}. You ${CAVEMAN_LEXICON[4]} ${CAVEMAN_LEXICON[2]}.`,
      `You find ${BANNED_CONSTRUCTIONS.article[0]} map.`,
    ]);
    expect(runIn(a).status, "the COMMITTED build must red fixture A").toBe(1);
    expect(
      runScratch(disjunctionGuard, a).status,
      "the disjunction build must PASS fixture A — that is what makes the fixture discriminating",
    ).toBe(0);

    // FIXTURE B on the broken build: negative holds, so the disjunction passes it. GREEN — wrong.
    const b = mirror();
    plantCavemanBlock(b, "brownfield-mapper.md", [
      "You map repo.",
      "You write down what you found.",
    ]);
    expect(runIn(b).status, "the COMMITTED build must red fixture B").toBe(1);
    expect(
      runScratch(disjunctionGuard, b).status,
      "the disjunction build must PASS fixture B",
    ).toBe(0);

    // AND THE RED TRANSCRIPT IS UNMOVED BY THE SAME MUTATION — the point of the whole case. Both
    // builds are pointed at the SAME unrepaired mirror (a byte-faithful copy of the tree at HEAD),
    // and the caveman block of their output is compared byte for byte. It matches, so the transcript
    // embedded in the guard's source header cannot tell a conjunction from a disjunction.
    //
    // (Plan 29-05) The expected count is DERIVED rather than pinned at ROLE_COUNT, and the PREMISE
    // below has to keep asserting that the two transcripts being compared are genuinely red, or the
    // comparison becomes two green blocks matching trivially. That is what the `> 0` floor is for,
    // and it was built to fail loudly — rather than silently weaken this proof — on the plan that
    // turns the last block green.
    //
    // (Plan 29-07) IT FAILED LOUDLY, ON SCHEDULE, AND THIS IS THE REPAIR. The fixture used to be
    // `rawMirror()` — a byte-faithful copy of the tree at HEAD — which was red only because the
    // corpus happened to be red. This plan turned the corpus green, so that fixture stopped being
    // evidence. The red is now PLANTED on every role rather than borrowed from the tree, which makes
    // the proof permanent and independent of the corpus. Retyping the expected count, or dropping
    // the floor, would each have cleared the failure by deleting the evidence for it.
    const raw = allRedMirror();
    const committedRed = runIn(raw);
    const brokenRed = runScratch(disjunctionGuard, raw);
    const cavemanBlockOf = (o: string): string =>
      o.slice(o.indexOf("[guard_caveman_voice]"), o.indexOf("[guard_role_clause_uniqueness]"));
    // PREMISE: the comparison is between two NON-EMPTY transcripts that really are red. The count is
    // read off THE FIXTURE, through the same authorities the guard uses — so if the plant ever
    // stopped applying, this floor fails instead of the comparison passing on two green blocks.
    const rawRed = voiceRedCountIn(raw);
    expect(rawRed).toBeGreaterThan(0);
    expect(rawRed, "the plant must red EVERY role").toBe(ROLE_COUNT);
    expect(rawRed).toBeLessThanOrEqual(VOICE_RED_BASELINE_29_01);
    expect(committedRed.status).toBe(1);
    expect(cavemanBlockOf(out(committedRed))).toContain(
      `caveman voice: ${rawRed} finding(s) over ${ROLE_COUNT} elements`,
    );
    expect(
      cavemanBlockOf(out(brokenRed)),
      "the RED transcript is byte-identical across the two builds — it is necessary evidence, never sufficient",
    ).toBe(cavemanBlockOf(out(committedRed)));
  }, 120_000);

  it("the mirror's repair block is proven conforming against the AUTHORITY, not against this file's opinion", () => {
    // The whole harness rests on this block being a valid baseline. If it silently stopped
    // conforming, every "the unplanted mirror is green" control below would be measuring a broken
    // fixture instead of the plant it thinks it is testing.
    const block = CONFORMING_CAVEMAN_BLOCK.join("\n");
    expect(countLexiconTokens(block)).toBeGreaterThanOrEqual(CAVEMAN_LEXICON_MIN);
    const banned = countBannedConstructions(block);
    expect(banned.article + banned.copula + banned.modal + banned.subordinator).toBe(0);
    // And it contributes NO clause of its own, so it can never create a uniqueness finding.
    expect(segmentClauses(block)).toEqual([]);
    for (const line of CONFORMING_CAVEMAN_BLOCK) {
      expect(
        normalizeSentence(line).split(" ").filter(Boolean).length,
        `"${line}" must stay under CLAUSE_MIN_WORDS`,
      ).toBeLessThan(CLAUSE_MIN_WORDS);
    }
    // Every token really came from the lexicon — no bare literal slipped in.
    for (const line of CONFORMING_CAVEMAN_BLOCK) {
      expect(
        CAVEMAN_LEXICON.some((t) => line.toLowerCase().includes(t)),
        `"${line}" must carry a term from the imported lexicon`,
      ).toBe(true);
    }
  });

  // ── LANG-07 — the parser oracle, asserted through BOTH consumers. ─────────────────────────────
  //
  // This is LANG-07's actual acceptance evidence. That ONE reader exists is a code fact; that BOTH
  // consumers reach an IDENTICAL verdict on identical malformed bytes is the property, and it is the
  // one the two deleted machines violated on two of three forms. Each form is asserted twice: once
  // directly against readCavemanFence in scripts/voice-model.test.ts, and once here through the
  // committed aggregator `.js`.
  const MALFORMED_ROLE = "brownfield-mapper.md";

  // ── (Plan 29-25, WR-06 axis two) EVERY PATTERN ABOUT THE PLANTED ROLE IS BUILT FROM THE CONSTANT.
  //
  // The strongest assertions in the two CR-01/CR-02 cases below are NEGATIVE — "no wrong-bytes
  // measurement line exists for this role". A negative regex that hard-codes `brownfield-mapper\.md`
  // while the plant is driven by `MALFORMED_ROLE` is one edit away from being vacuous: repoint the
  // constant and the pattern matches nothing, so the assertion passes over an output it was never
  // looking at. That is the WR-06 shape wearing a different hat — an assertion satisfied by the
  // absence of its own subject rather than by the property it names.
  //
  // The dot is escaped through a FULL regex escape rather than `name.replace(".", "\\.")`. The
  // single-argument string form of `replace` substitutes only the FIRST occurrence, so a role file
  // ever named with two dots would ship an unescaped one — a latent second defect inside the fix for
  // the first, and this round exists because a fix addressed three sites and missed a fourth.
  const REGEX_METACHARACTERS = /[.*+?^${}()|[\]\\]/g;
  const roleLinePattern = (name: string, tail: string): RegExp =>
    new RegExp(`${name.replace(REGEX_METACHARACTERS, "\\$&")}: ${tail}`);
  /** The per-role wrong-bytes measurement line the pre-bound builds published. */
  const measurementLine = (name: string): RegExp =>
    roleLinePattern(name, "tokens \\d+ / content words \\d+");
  /**
   * A measurement line in the guard's own shape, synthesized. The constructed pattern is asserted to
   * MATCH this before it is asserted not to match the real output, so "no match" is known to mean
   * "the line is absent" rather than "the pattern was incapable".
   */
  const synthesizedMeasurement = (name: string): string =>
    `  ${name}: tokens 4 / content words 4, banned 0`;

  const malformedFenceForms: {
    name: string;
    reason: "missing" | "unterminated" | "multiple";
    mutate: (text: string) => string;
  }[] = [
    {
      // The form on which the two deleted readers disagreed hardest: one failed red, the other
      // returned the WHOLE FILE TAIL as "the block" and passed over it.
      name: "unterminated — the closing delimiter removed",
      reason: "unterminated",
      mutate: (text) => {
        const lines = text.split("\n");
        const heading = lines.findIndex((l) => /^## Caveman prompt/.test(l));
        const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
        const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
        lines.splice(close, 1);
        return lines.join("\n");
      },
    },
    {
      // One reader stripped BOTH blocks; the other never saw the second, because its `break` had
      // already fired. Neither merging nor ignoring is a verdict a reader can defend.
      name: "multiple — a second `## Caveman prompt` heading",
      reason: "multiple",
      mutate: (text) => {
        const lines = text.split("\n");
        const heading = lines.findIndex((l) => /^## Caveman prompt/.test(l));
        const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
        const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
        const section = lines.slice(heading, close + 1);
        lines.splice(close + 1, 0, "", ...section);
        return lines.join("\n");
      },
    },
    {
      // The form the two readers agreed on only BY ACCIDENT — one via its sentinel, the other via an
      // empty return that happened to trip a different check.
      name: "missing — the heading with no fence delimiter at all",
      reason: "missing",
      mutate: (text) => {
        const lines = text.split("\n");
        const heading = lines.findIndex((l) => /^## Caveman prompt/.test(l));
        const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
        const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
        return [
          ...lines.slice(0, open),
          ...lines.slice(open + 1, close),
          ...lines.slice(close + 1),
        ].join("\n");
      },
    },
  ];

  for (const form of malformedFenceForms) {
    it(`LANG-07 oracle: ${form.name} — guard_voice and guard_caveman_voice name the SAME file for the SAME reason`, () => {
      const m = mirror();
      const file = rolePath(m, MALFORMED_ROLE);
      const before = readFileSync(file, "utf8");
      const after = form.mutate(before);
      // A mutation that matched nothing would leave the case asserting against an unmodified tree.
      expect(after, "the malformed-fence plant must actually change the file").not.toBe(before);
      writeFileSync(file, after, "utf8");

      const r = runIn(m);
      const o = out(r);
      expect(r.status).toBe(1);

      // The verdict, as each consumer prints it. The FILE and the REASON must be identical; only the
      // surrounding sentence differs, because the two guards do different things with one verdict.
      //
      // (Plan 29-27) ATTRIBUTED BY SECTION rather than by column. guard_voice now folds through
      // `reportMeasured` like its sibling, so both refusals print indented and the old
      // indentation partition no longer tells them apart — see `guardSection`'s declaration.
      const rel = roleRel(MALFORMED_ROLE);
      const refused = `${rel}: ## Caveman prompt fence refused`;
      const voiceSection = guardSection(o, "guard_voice");
      const cavemanSection = guardSection(o, "guard_caveman_voice");
      // THE HARNESS'S OWN PREMISE. An empty section would make both filters below report 0 and the
      // `toHaveLength(1)` calls fail loudly — but a mis-typed banner would make them report 0 for a
      // reason that has nothing to do with the guards, so the sections are asserted found first.
      expect(voiceSection.length, "the guard_voice output section must be found").toBeGreaterThan(0);
      expect(
        cavemanSection.length,
        "the guard_caveman_voice output section must be found",
      ).toBeGreaterThan(0);
      const voiceLine = voiceSection.find((l) => l.includes(refused));
      const cavemanLine = cavemanSection.find((l) => l.includes(refused));
      expect(voiceLine, "guard_voice must refuse by name").toBeTruthy();
      expect(cavemanLine, "guard_caveman_voice must refuse by name").toBeTruthy();
      expect(voiceLine).toContain(`reason ${form.reason}`);
      expect(cavemanLine).toContain(`reason ${form.reason}`);

      // AND THE OLD DIVERGENCE IS GONE, ASSERTED RATHER THAN ASSUMED: neither guard passes over this
      // file, and neither prints a measured PASS line for its check.
      expect(o).not.toContain("voice: clear-voice surfaces free of caveman markers");
      expect(o).not.toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT}`);
    });
  }

  it("FORM 4 — a well-formed fence with a ZERO-LINE interior is read, and fails the POSITIVE arm only", () => {
    const m = mirror();
    plantCavemanBlock(m, MALFORMED_ROLE, []);
    const r = runIn(m);
    expect(r.status).toBe(1);
    const o = out(r);
    // The reader ACCEPTED it — no refusal — and the guard then measured an empty block.
    expect(o).not.toContain(
      `${roleRel(MALFORMED_ROLE)}: ## Caveman prompt fence refused`,
    );
    // (Plan 29-25, WR-06 axis two) Built from the constant the plant is driven by. The NEGATIVE below
    // is the one that could go vacuous on a repoint, so its pattern is demonstrated capable first.
    expect(o).toContain(`${MALFORMED_ROLE}: tokens 0 / content words 0, banned 0`);
    expect(o).toMatch(
      roleLinePattern(MALFORMED_ROLE, "positive arm: 0 lexicon term\\(s\\)"),
    );
    expect(
      roleLinePattern(MALFORMED_ROLE, ".*negative arm").test(
        `  ${MALFORMED_ROLE}: negative arm: 1 banned construction(s)`,
      ),
      "the constructed pattern must be shown to match a negative-arm line before it is asserted to match none",
    ).toBe(true);
    expect(o).not.toMatch(roleLinePattern(MALFORMED_ROLE, ".*negative arm"));
  });

  // ── CR-01 (plan 29-14) — THE SECTION BOUND, PROVEN AT THE GATE. ────────────────────────────────
  //
  // The reviewer's live-tree reproduction, made permanent and hermetic. Before the bound, a role
  // whose caveman section was reworded into plain senior prose and which carried ANY later fenced
  // block adopted that block as "the caveman block": the reader returned ok:true, guard_voice scanned
  // the real caveman prose as clear-voice remainder and found nothing, guard_caveman_voice measured
  // the unrelated block and printed `tokens 4 / content words 4`, and the WHOLE GATE printed
  // ALL CHECKS PASSED at exit 0. `validate-agent-factory` and `check-kit-refs` also exited 0 on that
  // same tree, so nothing in the repository caught it.
  //
  // Why this case is at the GATE rather than only at the reader: a pure-function case proves the
  // verdict, and the defect was never that the verdict was unavailable — it was that both CONSUMERS
  // published a number about the wrong bytes and the exit code stayed 0. The claim being pinned is
  // about the exit code and the finding text, so it is asserted where those live.
  //
  // The plant is deliberately LEXICON-BEARING under the later heading. A neutral later block would
  // red the gate for a different reason (an empty positive arm), and a case that fails for the wrong
  // reason pins nothing.
  it("the full gate exits 1 on a de-fenced role carrying a later lexicon-bearing fence", () => {
    const m = mirror();
    // Membership through the Task 1 helper, rooted at the MIRROR — the harness's own premise.
    const names = roleNamesIn(m);
    expect(names, "the plant host must be a member of the mirror's role set").toContain(
      MALFORMED_ROLE,
    );

    const file = rolePath(m, MALFORMED_ROLE);
    const before = readFileSync(file, "utf8");
    const lines = before.split("\n");
    const heading = lines.findIndex((l) => /^## Caveman prompt$/.test(l));
    const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
    const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
    // De-fence the caveman section: the heading survives, the block becomes senior prose. Then append
    // a later `## Notes` section carrying four lexicon terms inside a fence — the bytes the pre-bound
    // reader adopted.
    const after = [
      ...lines.slice(0, open),
      "You plan business acceptance and record the outcome.",
      ...lines.slice(close + 1),
      "",
      "## Notes",
      "```",
      "grug club rock cave",
      "```",
      "",
    ].join("\n");
    expect(after, "the de-fencing plant must actually change the file").not.toBe(before);

    // PREMISE, MEASURED: the planted bytes really are the shape this case is about — the caveman
    // section carries no fence, and a LATER fenced block carrying lexicon terms does exist. Asserted
    // through the same authority the guard reads, so a fixture that silently stopped reproducing the
    // defect fails here rather than passing for the wrong reason.
    expect(readCavemanFence(after)).toEqual({ ok: false, reason: "missing" });
    expect(after.split("\n").filter((l) => /^```/.test(l))).toHaveLength(2);
    expect(countLexiconTokens("grug club rock cave")).toBeGreaterThanOrEqual(
      CAVEMAN_LEXICON_MIN,
    );

    writeFileSync(file, after, "utf8");
    const r = runIn(m);
    const o = out(r);

    expect(r.status).toBe(1);
    const rel = roleRel(MALFORMED_ROLE);
    // Both consumers name the FILE and the REASON — `missing`, so the finding says why and not merely
    // that. A finding that named the file without the reason would leave an editor re-deriving the
    // bound from scratch.
    //
    // (Plan 29-25, WR-06 axis one) THIS IS AN OCCURRENCE COUNT BECAUSE `toContain` IS NOT ONE. Two
    // byte-identical `expect(o).toContain(refusal)` calls stood here, under this same comment claiming
    // BOTH consumers were checked. `toContain` is a substring test: the second call was satisfied by
    // whatever satisfied the first, so a build in which `guard_caveman_voice` went silent passed this
    // case with one line in the output and a comment asserting two. Two identical assertions assert
    // one thing twice, and the comment above them almost always claims two — which is why the class
    // has its own derived tripwire further down this file rather than a third hand-fix.
    //
    // The count is not the whole property either, so the PARTITION is asserted beside it: one line in
    // EACH guard's own output section. A count of two alone would be satisfied by one consumer
    // printing twice.
    //
    // (Plan 29-27) THE PARTITION IS BY SECTION, NOT BY COLUMN. It used to be "one at column zero, one
    // indented" — an accident of guard_voice being the only foundation guard that had not folded
    // through `reportMeasured`. Closing CR-01 folded it through, both lines became indented, and a
    // whitespace-keyed partition would have gone from discriminating to always-zero. Attribution now
    // comes from the banner structure; see `guardSection`.
    const refusal = `${rel}: ## Caveman prompt fence refused — reason missing`;
    const refusalLines = o.split("\n").filter((l) => l.includes(refusal));
    expect(
      refusalLines,
      "each of the two voice guards must name the file and the reason INDEPENDENTLY — this is an occurrence count, not a substring test",
    ).toHaveLength(2);
    expect(
      guardSection(o, "guard_voice").filter((l) => l.includes(refusal)),
      "guard_voice refuses inside its OWN output section",
    ).toHaveLength(1);
    expect(
      guardSection(o, "guard_caveman_voice").filter((l) => l.includes(refusal)),
      "guard_caveman_voice refuses inside its OWN output section",
    ).toHaveLength(1);
    // THE COUNT IS PROVEN TO DISCRIMINATE, on output carrying only ONE of the two lines. Without this
    // the strengthened assertion is only believed to be stronger than the pair it replaced.
    expect(
      [refusalLines[0], "some unrelated line"].join("\n").split("\n").filter((l) => l.includes(refusal)),
      "the same filter over single-consumer output must report ONE — which is what the retired pair could not tell apart from two",
    ).toHaveLength(1);
    // And the two PASS lines the pre-bound build printed on these exact bytes are GONE.
    expect(o).not.toContain("voice: clear-voice surfaces free of caveman markers");
    expect(o).not.toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT}`);
    expect(o).not.toContain("ALL CHECKS PASSED");
    // The wrong-bytes measurement itself: the pre-bound build published `tokens 4 / content words 4`
    // for this role, measured over `## Notes`. No measurement line for this role may exist at all now.
    // The pattern is built from `MALFORMED_ROLE` and demonstrated CAPABLE of matching first.
    expect(
      measurementLine(MALFORMED_ROLE).test(synthesizedMeasurement(MALFORMED_ROLE)),
      "the constructed pattern must be shown to match a measurement line before it is asserted to match none",
    ).toBe(true);
    expect(o).not.toMatch(measurementLine(MALFORMED_ROLE));
  });

  // ── CR-02 (plan 29-20) — THE SAME CLAIM, ONE CHARACTER TO THE LEFT. ──────────────────────────────
  //
  // The `# ` SIBLING of the case immediately above, and the reason this phase needed a second
  // gap-closure round. 29-14 closed the bound with `/^## /`, so a LEVEL-ONE heading closed nothing and
  // the defect 29-14 believed it had deleted survived intact under a `# ` successor. Reproduced live
  // against the committed build before this plan:
  //
  //   readCavemanFence("## Caveman prompt\nYou senior prose…\n\n# Appendix\n…\n```\ngrug club rock cave smash\n```\n")
  //   → {"ok":true,"inside":"grug club rock cave smash", …}
  //
  // A bound tested from one side only is a half-fix, and this case is the other side, asserted where
  // the consequence lives: the exit code and the measurement line, not the verdict alone.
  it("the full gate exits 1 on a de-fenced role carrying a later LEVEL-ONE lexicon-bearing fence", () => {
    const m = mirror();
    const names = roleNamesIn(m);
    expect(names, "the plant host must be a member of the mirror's role set").toContain(
      MALFORMED_ROLE,
    );

    const file = rolePath(m, MALFORMED_ROLE);
    const before = readFileSync(file, "utf8");
    const lines = before.split("\n");
    const heading = lines.findIndex((l) => /^## Caveman prompt$/.test(l));
    const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
    const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
    const LEXICON_LINE = "grug club rock cave smash";
    // THE PLANT'S SHAPE IS THE WHOLE CASE, AND THE FIRST DRAFT OF IT WAS VACUOUS. Appending `# Notes`
    // at END OF FILE — the arrangement 29-14's `## ` sibling uses — proves nothing here, because
    // `## Caveman prompt` is followed at line 18 by `## Reads`: the pre-29-20 level-two bound already
    // closed there, the reader already returned `missing`, and the case passed against the very build
    // it was written to fail. So the level-one successor is inserted IMMEDIATELY BELOW the de-fenced
    // prose, ABOVE the next `## ` heading. Under the old bound the fence then sat INSIDE the section
    // and was adopted; under the new one `# Notes` closes first and the reader refuses.
    const after = [
      ...lines.slice(0, open),
      "You plan business acceptance and record the outcome.",
      "",
      "# Notes",
      "```",
      LEXICON_LINE,
      "```",
      ...lines.slice(close + 1),
    ].join("\n");
    expect(after, "the de-fencing plant must actually change the file").not.toBe(before);

    // PREMISE, MEASURED THROUGH THE FENCE AUTHORITY ITSELF — on axes the predicate under test does not
    // decide, so this block answers the same way before and after the fix. It says the planted bytes
    // really are the CR-02 shape, and its LAST assertion is the one that makes the case discriminating
    // rather than a re-run of 29-14.
    const planted = after.split("\n");
    const flags = fencedLineFlags(after);
    const anchors = planted
      .map((l, i) => (l === "## Caveman prompt" && !flags[i] ? i : -1))
      .filter((i) => i >= 0);
    expect(anchors, "exactly one unfenced caveman anchor").toHaveLength(1);
    const notes = planted.findIndex((l, i) => l === "# Notes" && !flags[i]);
    expect(notes, "the level-one successor must exist and be unfenced").toBeGreaterThan(anchors[0]);
    const delimiters = planted
      .map((l, i) => (/^```/.test(l) ? i : -1))
      .filter((i) => i >= 0);
    expect(delimiters, "exactly two delimiters in the planted file").toHaveLength(2);
    expect(
      delimiters.every((i) => i > notes),
      "BOTH delimiters must sit under the level-one successor — none inside the caveman section",
    ).toBe(true);
    expect(countLexiconTokens(LEXICON_LINE)).toBeGreaterThanOrEqual(CAVEMAN_LEXICON_MIN);
    // THE DISCRIMINATION, ASSERTED: the next unfenced LEVEL-TWO heading below the anchor sits BELOW
    // both delimiters. So under the pre-29-20 `/^## /` bound this fence was inside the caveman section
    // and was adopted, and only the LEVEL axis can refuse it. Without this line the case would pass
    // against the build it exists to fail — which is exactly what its first draft did.
    const nextLevelTwo = planted.findIndex(
      (l, i) => i > anchors[0] && !flags[i] && /^## /.test(l),
    );
    expect(nextLevelTwo, "a level-two successor must exist below the plant").toBeGreaterThan(-1);
    expect(
      nextLevelTwo,
      "the level-TWO successor must sit BELOW both delimiters, or the old bound already refused and this case discriminates nothing",
    ).toBeGreaterThan(delimiters[1]);

    writeFileSync(file, after, "utf8");
    const r = runIn(m);
    const o = out(r);

    // THE RED EVIDENCE IS THE EXIT CODE. Against the pre-29-20 build this line received 0: the reader
    // adopted `# Notes`'s block, both consumers measured it, and the whole gate printed ALL CHECKS
    // PASSED on a role whose caveman block had been deleted.
    expect(r.status).toBe(1);
    const rel = roleRel(MALFORMED_ROLE);
    // (Plan 29-25, WR-06 axis one) The `## ` sibling of this case carried the byte-identical PAIR; it
    // is now an occurrence count there and the same count is applied here, so the two siblings pin the
    // same property rather than one pinning it and the other asserting it twice.
    const refusal = `${rel}: ## Caveman prompt fence refused — reason missing`;
    const refusalLines = o.split("\n").filter((l) => l.includes(refusal));
    expect(
      refusalLines,
      "each of the two voice guards must name the file and the reason INDEPENDENTLY",
    ).toHaveLength(2);
    // (Plan 29-27) Attributed by SECTION, for the reason recorded at the sibling above: guard_voice
    // now folds through `reportMeasured`, so a column-keyed partition no longer discriminates.
    expect(
      guardSection(o, "guard_voice").filter((l) => l.includes(refusal)),
      "guard_voice refuses inside its OWN output section",
    ).toHaveLength(1);
    expect(
      guardSection(o, "guard_caveman_voice").filter((l) => l.includes(refusal)),
      "guard_caveman_voice refuses inside its OWN output section",
    ).toHaveLength(1);
    expect(o).not.toContain("voice: clear-voice surfaces free of caveman markers");
    expect(o).not.toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT}`);
    expect(o).not.toContain("ALL CHECKS PASSED");
    // No measurement line about the wrong bytes may coexist with the refusal. The pre-bound build
    // published `tokens 5 / content words 5` here, measured over `# Notes`. Built from the constant,
    // and demonstrated capable of matching before being asserted to match nothing.
    expect(
      measurementLine(MALFORMED_ROLE).test(synthesizedMeasurement(MALFORMED_ROLE)),
      "the constructed pattern must be shown to match a measurement line before it is asserted to match none",
    ).toBe(true);
    expect(o).not.toMatch(measurementLine(MALFORMED_ROLE));

    // And the READER's own verdict agrees. Asserted AFTER the gate deliberately: the claim this case
    // exists to pin is about the exit code, and putting the verdict first would make the RED evidence
    // a failed premise line instead of the received status of 0 the defect actually produced.
    expect(readCavemanFence(after)).toEqual({ ok: false, reason: "missing" });
  });

  it("an UNMODIFIED mirror still exits 0 under the section bound — the false-red control", () => {
    // The other half of the claim, and the half a bound is most likely to break: scoping the reader
    // must not RE-MEASURE the corpus. All 17 live roles carry both fence delimiters inside the caveman
    // section, so the bound cannot move their verdict — and this case is what turns that from an
    // observation into something a regression trips over.
    const m = mirror();
    expect(roleNamesIn(m)).toHaveLength(ROLE_COUNT);
    const r = runIn(m);
    expect(r.status).toBe(0);
    expect(out(r)).toContain("ALL CHECKS PASSED");
    expect(out(r)).toContain(
      `caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`,
    );
  });

  // ── AP-1 — the two vacuity floors, each proven to fire independently. ─────────────────────────
  it("VACUITY: a mirror SHORT by one role file FAILS naming `visited 16 of 17`", () => {
    // The DENOMINATOR floor, which is a different branch from the findings branch: this mirror has no
    // findings at all in the surviving 16 blocks, so only the floor can produce a failure.
    const m = mirror();
    rmSync(rolePath(m, MALFORMED_ROLE), { force: true });
    const o = out(runIn(m));
    expect(o).toContain(
      `caveman voice: visited ${ROLE_COUNT - 1} of ${ROLE_COUNT} elements`,
    );
    expect(o).toContain(
      `role clause uniqueness: visited ${ROLE_COUNT - 1} of ${ROLE_COUNT} elements`,
    );
    expect(o).toContain("the scan set is short");
  });

  it("VACUITY: a guard whose loop is fed NOTHING fails its own floor rather than printing PASS", () => {
    // The ELEMENT-level floor. It cannot be reached by planting a file — kit-model refuses an empty
    // role directory before any guard runs — so it is exercised on a scratch build whose loop
    // iterates an empty array while the mirror still carries all 17 role files. That separation is
    // the point: the scan set is intact and the guard still reports `visited 0`, which is exactly the
    // "the check did not run" shape a PASS line must never cover.
    const emptyLoopGuard = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace(
          "for (const f of ROLE_FILES) {\n        // Every role file the loop looks at counts as VISITED",
          "for (const f of []) {\n        // Every role file the loop looks at counts as VISITED",
        ),
    });
    const m = mirror();
    const r = runScratch(emptyLoopGuard, m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain(`caveman voice: ZERO elements visited (expected ${ROLE_COUNT})`);
    expect(o).toContain("this check was NOT performed");
    // Zero elements ALSO means zero per-block detail lines — D-08's design, asserted.
    expect(o).not.toMatch(/^ {8}\S+\.md: tokens /m);
    expect(o).not.toContain(`caveman voice: 0 findings over 0/${ROLE_COUNT} elements`);
  }, 120_000);

  // ── (Plan 29-27, closing CR-01 / AP-1) guard_voice PUBLISHES WHAT IT MEASURED. ──────────────────
  //
  // It was the last foundation guard with NO measurement at all: a bare
  // `PASS  voice: clear-voice surfaces free of caveman markers` with no denominator and no per-file
  // line. Round 3 showed that is not a cosmetic gap. Under the 29-20 reader bound `readCavemanFence`
  // could return `ok: true` with `outside` the EMPTY STRING, this guard then scanned zero lines,
  // found zero markers, and printed that PASS. Measured on a hermetic mirror carrying the CR-01
  // plant, pre-plan build `0ec8b61`: exit 0, that bare line, and the planted file never named.
  //
  // The cases below pin the three halves of the closure: the denominator exists and is DERIVED, the
  // per-file scanned counts exist and are countable, and a collapsed remainder is a NAMED finding.
  const GUARD_TS_SRC = readFileSync(
    join(ROOT, "scripts/check-foundation-guards.ts"),
    "utf8",
  );

  /**
   * The `SEC_VOICE_FILES` members as the SOURCE declares them. Parsed rather than imported because
   * the guard is a script with top-level side effects and exports nothing — the same reason every
   * other source-level pin in this file reads bytes.
   */
  const parseSecVoiceMembers = (src: string): string[] => {
    const block = /const SEC_VOICE_FILES = \[([\s\S]*?)\n\];/.exec(src);
    if (block === null) {
      throw new Error(
        "SEC_VOICE_FILES literal not found — the pin below would be asserting over nothing",
      );
    }
    return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  };
  const parseSecVoiceCount = (src: string): number => {
    const m = /const SEC_VOICE_FILE_COUNT = (\d+);/.exec(src);
    if (m === null) {
      throw new Error(
        "SEC_VOICE_FILE_COUNT declaration not found — the pin below would be asserting over nothing",
      );
    }
    return Number(m[1]);
  };
  /** The pin itself, as a value — so the SAME predicate can be run over MUTATED source. */
  const secVoicePinMismatch = (src: string): string | null => {
    const members = parseSecVoiceMembers(src);
    const declared = parseSecVoiceCount(src);
    if (members.length === declared) return null;
    return `SEC_VOICE_FILES holds ${members.length} member(s) [${members.join(", ")}] but SEC_VOICE_FILE_COUNT declares ${declared}`;
  };

  // ── (Plan 29-33, closing round-4 CR-01 / the LANG-06 failed truth) THE MEMBERSHIP ROSTER. ────────
  //
  // The cardinality pin above catches the ADD and the REMOVE directions. It is BLIND to the third:
  // SUBSTITUTE one member for any other existing `agent-factory/**.md` path and every published
  // number holds still — `visited` 19, `expected` 19, `SEC_VOICE_FILE_COUNT` 2, the path-shape
  // assertion satisfied — while a real security surface leaves `guard_voice` entirely and the gate
  // exits 0. Reproduced end to end against the COMMITTED `.js` on a `git archive HEAD` mirror by
  // both the round-4 reviewer and the round-4 verifier, and again by this plan before it was written:
  //
  //   unmodified committed .js  ->  FAIL  voice: 1 finding(s) over 19 elements   (exit 1)
  //   one token substituted     ->  PASS  voice: 0 findings over 19/19 elements  (exit 0)
  //
  // This is the shape plan 29-30 found one module over ("a count-preserving REHOME keeps every
  // cardinality identical while a file leaves the list") and closed with a ROSTER. The same remedy,
  // in the same posture as `SAFETY_CLAIM_HOMES` in scripts/check-audit-register.ts: a hand-maintained
  // roster is legitimate under D-01/D-04 only when it FAILS CLOSED against a same-commit companion,
  // and this one does — any add, remove or substitution in EITHER artifact reds by name.
  //
  // THE PIN IS OVER THE `.ts` SOURCE. The reproduction above edited the committed `.js`, which no
  // source-level assertion can see. The half of the closure covering that route is `npm run
  // freshness`, measured rather than asserted in plan 29-33 task 3.
  //
  // Written in SORTED order, and the sortedness is asserted below rather than trusted — a roster
  // compared order-insensitively can otherwise drift into an order the comparison hides.
  const SEC_VOICE_MEMBERS: readonly string[] = [
    "agent-factory/checklists/security-nfr-checklist.md",
    "agent-factory/workflows/15-security-audit.md",
  ] as const;

  // The exact path round 4 substituted in. A real, tracked, `agent-factory/**.md` document that is
  // NOT a security surface — kept as a named constant so the roster case and the property floor
  // discriminate against the SAME decoy the live bypass used.
  const SEC_VOICE_DECOY = "agent-factory/checklists/definition-of-ready.md";

  /**
   * The roster pin as a VALUE, the way `secVoicePinMismatch` already is — so the falsifiability
   * probe drives the SAME comparison the permanent assertion drives. A second implementation inside
   * the probe is how a probe comes to prove a predicate that is not the one shipped.
   *
   * The message reports the two halves SEPARATELY. A failure saying only that "a string moved"
   * cannot say which half drifted, and a substitution moves both at once.
   */
  const secVoiceRosterMismatch = (src: string): string | null => {
    const parsed = parseSecVoiceMembers(src);
    const missing = SEC_VOICE_MEMBERS.filter((m) => !parsed.includes(m));
    const undeclared = parsed.filter((m) => !SEC_VOICE_MEMBERS.includes(m));
    if (missing.length === 0 && undeclared.length === 0) return null;
    return (
      `SEC_VOICE_FILES membership drifted from the declared roster — ` +
      `declared but ABSENT from the guard source: [${missing.join(", ")}]; ` +
      `present in the guard source but UNDECLARED: [${undeclared.join(", ")}]`
    );
  };

  // ── (Plan 29-33) THE PER-MEMBER DERIVED PROPERTY FLOOR — the half a NAME comparison cannot give. ─
  //
  // The roster above refuses a substitution by NAME. It cannot refuse a change that edits the guard
  // literal AND the roster together into a valid-shaped path that is not a security surface at all.
  // So each member must additionally satisfy a property DERIVED from somewhere else in the tree:
  //
  //   arm A — membership in `safetySurfaceUnion()`, the one derivation of the safety surface.
  //   arm B — equality with the path `scripts/generate-asvs-checklist.ts` itself writes.
  //
  // WHY TWO ARMS AND NOT ONE. `security-nfr-checklist.md` is GENERATED by the ASVS generator, so it
  // can never appear in the disposition register that feeds arm A — a generated artifact is not an
  // audited source row. Arm B is therefore a two-artifact pin between two independently maintained
  // files: the generator that WRITES the checklist and the guard that SCANS it must agree about
  // where it lives.
  //
  // THE UNION IS THE ASSERTION, NOT THE ARMS. Testing arms independently and never their union is a
  // recorded failure of this phase; each arm is separately asserted to be a PROPER subset, so a
  // later edit that collapses the two into one reds instead of silently dropping a member.
  const ASVS_GENERATOR_SRC_PATH = "scripts/generate-asvs-checklist.ts";

  /**
   * The path `generate-asvs-checklist.ts` writes, read as BYTES. The module has top-level side
   * effects and does not export `OUT`, so importing it is not an option — the same reason every
   * other source-level pin in this file reads bytes. THROWS by name when the literal is absent, so
   * a rename cannot degrade this arm into a silent `undefined` that satisfies nothing.
   */
  const parseAsvsChecklistOut = (src: string): string => {
    const m = /const OUT = join\(ROOT, "([^"]+)"\);/.exec(src);
    if (m === null) {
      throw new Error(
        `the OUT literal of ${ASVS_GENERATOR_SRC_PATH} was not found — arm B of the SEC_VOICE ` +
          `property floor would be asserting over nothing`,
      );
    }
    return m[1];
  };

  /** Which derived arm, if any, vouches for `member`. `null` means NO derivation vouches for it. */
  const secVoiceDerivedProperty = (
    member: string,
    armA: ReadonlySet<string>,
    armB: string,
  ): "safety-surface-union" | "asvs-generator-out" | null => {
    if (armA.has(member)) return "safety-surface-union";
    if (member === armB) return "asvs-generator-out";
    return null;
  };

  it("SEC_VOICE_FILES cardinality is pinned against SEC_VOICE_FILE_COUNT, and the pin is not vacuous", () => {
    // `SEC_VOICE_FILES` is the ONE part of the voice corpus with no lister to derive it from — a
    // curated pair of non-role security surfaces. A hand-maintained set with no asserted count is
    // this repository's named set-literal-drift class (7 granted names, 0 adapter files), so the
    // remedy is the one the role half already uses: declare the number, compare the derived set.
    const members = parseSecVoiceMembers(GUARD_TS_SRC);
    const declared = parseSecVoiceCount(GUARD_TS_SRC);
    // THE PARSER'S OWN PREMISE FIRST. A regex that silently matched an empty list would make the
    // equality below `0 === 0` and the pin would pass over nothing — the vacuity shape round 3 exists
    // to refuse. The ELEMENT count is derived here independently of the equality that consumes it.
    expect(members.length, "the parsed member list must be non-empty").toBeGreaterThan(0);
    expect(declared, "the declared count must be non-zero").toBeGreaterThan(0);
    expect(members, "every parsed member must be a repo-relative markdown path").toEqual(
      members.filter((m) => m.startsWith("agent-factory/") && m.endsWith(".md")),
    );
    expect(members).toHaveLength(declared);
    expect(secVoicePinMismatch(GUARD_TS_SRC)).toBeNull();
  });

  it("the SEC_VOICE roster is pinned two-sided against the guard source", () => {
    const parsed = parseSecVoiceMembers(GUARD_TS_SRC);

    // ── THE HARNESS'S OWN PREMISE, ASSERTED BEFORE THE EQUALITY IT ENABLES. ──────────────────────
    // A regex that silently matched an empty list would make the comparison `[] === []` and the
    // roster would pin nothing. The ELEMENT count is derived here independently of the loop that
    // consumes it — a vacuity floor that catches an EMPTY denominator but never a SILENTLY SHORT
    // one is this phase's recorded failure, so the roster is asserted non-empty too.
    expect(parsed.length, "the parsed member list must be non-empty").toBeGreaterThan(0);
    expect(SEC_VOICE_MEMBERS.length, "the declared roster must be non-empty").toBeGreaterThan(0);
    expect(
      parsed.filter((m) => m.startsWith("agent-factory/") && m.endsWith(".md")),
      "every parsed member must be a repo-relative markdown path",
    ).toEqual(parsed);
    expect(
      parsed.some((m) => SEC_VOICE_MEMBERS.includes(m)),
      "the parse must have REACHED the literal the roster describes, not some other array",
    ).toBe(true);

    // ── PROBE EDGE LANG-06/ORDERING, ANSWERED BY CONSTRUCTION. ───────────────────────────────────
    // The equality below is order-insensitive (it is a two-way set difference), so a roster written
    // out of order would still pass it. Assert the DECLARATION is sorted so it cannot drift into an
    // order the comparison silently hides.
    expect(
      [...SEC_VOICE_MEMBERS],
      "the declared roster must be written in sorted order",
    ).toEqual([...SEC_VOICE_MEMBERS].sort());

    // ── THE PIN. Two-sided, order-insensitive, both directions reported separately. ──────────────
    expect([...parsed].sort()).toEqual([...SEC_VOICE_MEMBERS].sort());
    expect(secVoiceRosterMismatch(GUARD_TS_SRC)).toBeNull();

    // ── PROBE EDGE LANG-06/ADJACENCY. The two halves of `VOICE_FILES` TOUCH. ─────────────────────
    // `agent-factory/roles/security-nfr.md` is already a member of ROLE_FILES, and the declaration
    // comment in the guard has always asserted it must not be added to SEC_VOICE_FILES — nothing
    // enforced it. A member sitting in BOTH halves would be scanned twice and would inflate
    // `visited` past `expected`, turning the denominator floor into a false red; the two sets must
    // separate. The role half is DERIVED from the same lister the guard uses, never restated.
    const roleHalf = listRoles(ROOT).map((f) => `agent-factory/roles/${f}`);
    expect(roleHalf.length, "the role derivation must be non-empty").toBeGreaterThan(0);
    expect(
      roleHalf,
      "the adjacency probe's own premise: security-nfr.md must really be a ROLE file",
    ).toContain("agent-factory/roles/security-nfr.md");
    expect(
      SEC_VOICE_MEMBERS.filter((m) => roleHalf.includes(m)),
      "no SEC_VOICE member may also be a ROLE file — the two halves must not merge",
    ).toEqual([]);
    expect(SEC_VOICE_MEMBERS).not.toContain("agent-factory/roles/security-nfr.md");
  });

  it("every SEC_VOICE member satisfies a DERIVED property, and the two arms' UNION is the roster", () => {
    // ── ARM A, and its own premise first. ────────────────────────────────────────────────────────
    // An empty union would make "every member is in the union" FALSE rather than vacuous — but an
    // assertion that never actually ran the derivation is the harness-premise failure this round is
    // charged with, so the derivation is measured before it is used as a predicate.
    const unionEntries = safetySurfaceUnion(ROOT);
    expect(unionEntries.length, "safetySurfaceUnion() must be non-empty").toBeGreaterThan(0);
    const armA = new Set(unionEntries.map((e) => e.file));
    expect(armA.size, "the derived arm-A set must be non-empty").toBeGreaterThan(0);
    expect(
      armA.has("agent-factory/workflows/15-security-audit.md"),
      "arm A's premise: the security-audit workflow must really be a derived safety surface",
    ).toBe(true);

    // ── ARM B, parsed from the generator's own bytes; the parser THROWS if the literal is gone. ───
    const armB = parseAsvsChecklistOut(
      readFileSync(join(ROOT, ASVS_GENERATOR_SRC_PATH), "utf8"),
    );
    expect(
      armB,
      "the ASVS generator must still write the checklist the guard scans",
    ).toBe("agent-factory/checklists/security-nfr-checklist.md");
    // AND the parser is proven able to REFUSE. A parser that returned `undefined` on a rename would
    // degrade arm B into a value nothing equals, quietly moving its member to "vouched by nothing"
    // while the union assertion blamed the roster. It throws by name instead.
    expect(() => parseAsvsChecklistOut("const OUT = somethingElse;\n")).toThrow(
      /OUT literal of scripts\/generate-asvs-checklist\.ts was not found/,
    );

    // ── THE UNION IS THE ASSERTION. ──────────────────────────────────────────────────────────────
    const vouched = SEC_VOICE_MEMBERS.filter(
      (m) => secVoiceDerivedProperty(m, armA, armB) !== null,
    );
    expect([...vouched].sort()).toEqual([...SEC_VOICE_MEMBERS].sort());
    expect([...SEC_VOICE_MEMBERS].sort()).toEqual([...vouched].sort());

    // ── EACH ARM IS A PROPER SUBSET, ASSERTED. ───────────────────────────────────────────────────
    // If a later edit collapsed the two arms into one, the union above would still be satisfied by
    // whichever arm survived while the other's member silently left. These two assertions red on
    // that instead, and they also prove NEITHER arm is vacuous.
    const byA = SEC_VOICE_MEMBERS.filter(
      (m) => secVoiceDerivedProperty(m, armA, armB) === "safety-surface-union",
    );
    const byB = SEC_VOICE_MEMBERS.filter(
      (m) => secVoiceDerivedProperty(m, armA, armB) === "asvs-generator-out",
    );
    expect(byA.length, "arm A must vouch for at least one member").toBeGreaterThan(0);
    expect(byB.length, "arm B must vouch for at least one member").toBeGreaterThan(0);
    expect(byA.length, "arm A ALONE must NOT cover the roster").toBeLessThan(
      SEC_VOICE_MEMBERS.length,
    );
    expect(byB.length, "arm B ALONE must NOT cover the roster").toBeLessThan(
      SEC_VOICE_MEMBERS.length,
    );
    expect(byA.concat(byB).sort()).toEqual([...SEC_VOICE_MEMBERS].sort());

    // ── THE DECOY. Without this the floor could pass because EVERY `agent-factory/**.md` path
    // happens to satisfy something. This is the exact path round 4 substituted in.
    expect(
      armA.has(SEC_VOICE_DECOY),
      "the decoy must NOT be a derived safety surface",
    ).toBe(false);
    expect(SEC_VOICE_DECOY, "the decoy must NOT be the ASVS generator's OUT path").not.toBe(armB);
    expect(
      secVoiceDerivedProperty(SEC_VOICE_DECOY, armA, armB),
      "the property floor must REJECT the decoy — it discriminates, it does not merely pass",
    ).toBeNull();
    expect(
      existsSync(join(ROOT, SEC_VOICE_DECOY)),
      "the decoy's own premise: it is a REAL tracked document, so the floor is what refuses it",
    ).toBe(true);
  });

  it("the SEC_VOICE probe REDS on a SUBSTITUTED member — the direction a cardinality is blind to", () => {
    // Round 4's bypass, applied to the guard SOURCE this time. ONE token; the count is untouched.
    const LEAVES = "agent-factory/workflows/15-security-audit.md";
    const substituted = GUARD_TS_SRC.replace(`"${LEAVES}"`, `"${SEC_VOICE_DECOY}"`);

    // 1. ASSERT THE MUTATION APPLIED BEFORE ASSERTING ANY PIN FIRED — a `replace` that matched
    //    nothing would "prove" every assertion below against unmutated bytes.
    expect(substituted, "the substitution must actually change the source").not.toBe(GUARD_TS_SRC);

    // 2. THE MEMBER COUNT IS UNCHANGED. This is the property that made the bypass invisible, so it
    //    is MEASURED here rather than described in a comment.
    const before = parseSecVoiceMembers(GUARD_TS_SRC);
    const after = parseSecVoiceMembers(substituted);
    expect(after).toHaveLength(before.length);
    expect(after, "and the substituted path really did arrive").toContain(SEC_VOICE_DECOY);
    expect(after, "and the real security surface really did leave").not.toContain(LEAVES);

    // 3. THE CARDINALITY PIN IS BLIND. Asserted, so the roster's necessity is a MEASUREMENT rather
    //    than a claim — this is precisely why the third direction had to be added.
    expect(
      secVoicePinMismatch(substituted),
      "the cardinality pin cannot see a substitution — that is the defect being closed",
    ).toBeNull();

    // 4. THE ROSTER REDS, AND NAMES BOTH HALVES OF THE DRIFT.
    const drifted = secVoiceRosterMismatch(substituted);
    expect(drifted, "a substituted member must RED the roster").not.toBeNull();
    expect(drifted, "and must name the member that LEFT").toContain("15-security-audit.md");
    expect(drifted, "and the member that ARRIVED").toContain("definition-of-ready.md");

    // 5. THE PROPERTY FLOOR REJECTS THE DECOY TOO — a substitution fails a derived PROPERTY as well
    //    as a declared NAME, so closing one by hand does not clear the other.
    const armA = new Set(safetySurfaceUnion(ROOT).map((e) => e.file));
    const armB = parseAsvsChecklistOut(
      readFileSync(join(ROOT, ASVS_GENERATOR_SRC_PATH), "utf8"),
    );
    expect(armA.size, "the floor's own derivation must have run").toBeGreaterThan(0);
    expect(secVoiceDerivedProperty(SEC_VOICE_DECOY, armA, armB)).toBeNull();
    expect(
      after.filter((m) => secVoiceDerivedProperty(m, armA, armB) === null),
      "the substituted source's members must no longer all be vouched for",
    ).toEqual([SEC_VOICE_DECOY]);
  });

  it("the SEC_VOICE cardinality pin REDS on an ADDED and on a REMOVED member — the falsifiability probe", () => {
    // A one-sided pin is exactly how set-literal drift survives, so BOTH directions are exercised on
    // mutated source: a member ADDED without bumping the constant, and a member REMOVED. The probe
    // asserts the mutation APPLIED before it asserts the pin fired, because a `replace` that matched
    // nothing would "prove" the pin against unmutated bytes.
    //
    // (Plan 29-33) The THIRD direction — SUBSTITUTE — is BLIND to this pin by construction and lives
    // in its own case below, driving `secVoiceRosterMismatch` and the property floor instead. The
    // three arms together are the falsifiability probe; none of the three was deleted for another.
    const PLANTED = "agent-factory/checklists/planted-extra-surface.md";
    const withExtra = GUARD_TS_SRC.replace(
      "const SEC_VOICE_FILES = [\n",
      `const SEC_VOICE_FILES = [\n  "${PLANTED}",\n`,
    );
    expect(withExtra, "the planted-member mutation must actually change the source").not.toBe(
      GUARD_TS_SRC,
    );
    expect(parseSecVoiceMembers(withExtra)).toHaveLength(
      parseSecVoiceMembers(GUARD_TS_SRC).length + 1,
    );
    const added = secVoicePinMismatch(withExtra);
    expect(added, "an added member must RED the pin").not.toBeNull();
    expect(added, "and the failure must NAME the member that was added").toContain(PLANTED);

    // The other direction: a member removed. `expected` stays put while the derived set shrinks.
    const members = parseSecVoiceMembers(GUARD_TS_SRC);
    const withOneFewer = GUARD_TS_SRC.replace(`  "${members[0]}",\n`, "");
    expect(withOneFewer, "the removal mutation must actually change the source").not.toBe(
      GUARD_TS_SRC,
    );
    const removed = secVoicePinMismatch(withOneFewer);
    expect(removed, "a removed member must RED the pin too").not.toBeNull();
    expect(removed).toContain(`holds ${members.length - 1} member(s)`);
  });

  it("the SEC_VOICE cardinality drift REDS THE GATE ITSELF, not only a source-level assertion", () => {
    // The probe above pins the source. This one pins the CONSEQUENCE, which is the property that
    // matters: `guardVoice` hands `reportMeasured` a denominator of `ROLE_COUNT + SEC_VOICE_FILE_COUNT`
    // while `visited` counts actual members, so a member added without bumping the constant reports
    // 20 of 19 and the denominator floor refuses to print a PASS. That is the drift being caught by a
    // MECHANISM rather than by a test remembering to look.
    const drifted = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace(
          "const SEC_VOICE_FILES = [\n",
          'const SEC_VOICE_FILES = [\n    "agent-factory/checklists/planted-extra-surface.md",\n',
        ),
    });
    const m = mirror();
    const r = runScratch(drifted, m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain(
      `voice: visited ${ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC) + 1} of ${ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC)} elements`,
    );
    expect(o).toContain("the scan set is short");
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
    // The sibling guard is UNTOUCHED by this mutation — so the red is attributable to the voice
    // corpus drift and not to a scratch build that broke everything.
    expect(o).toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`);
  }, 120_000);

  it("guard_voice's PASS line carries a DERIVED denominator, and one scanned-line count per voice file", () => {
    const m = mirror();
    const r = runIn(m);
    const o = out(r);
    expect(r.status).toBe(0);
    // The denominator's SHAPE, in the same form guard_caveman_voice already publishes. Round 3's
    // recorded evidence is that only ONE of the two matched; two is the closure condition.
    const denominators = o
      .split("\n")
      .filter((l) => /voice.*0 findings over \d+\/\d+ elements/.test(l));
    expect(
      denominators,
      "BOTH voice guards must publish a denominator — guard_voice was the one foundation guard with none",
    ).toHaveLength(2);
    expect(o).toContain(
      `voice: 0 findings over ${ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC)}/${ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC)} elements`,
    );
    // The PER-FILE measurement lines, COUNTED against a denominator derived outside this guard's own
    // corpus: the role half from kit-model's ROLE_COUNT, the security half from the declared count.
    const scanned = o.split("\n").filter((l) => /: scanned \d+ clear-voice line\(s\)/.test(l));
    expect(scanned).toHaveLength(ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC));
    // And the retired bare line is GONE — a PASS with no denominator may not reappear beside the new
    // one, which is how a "measurement added" change quietly becomes a measurement added ALONGSIDE.
    expect(o).not.toContain("  PASS  voice: clear-voice surfaces free of caveman markers");
  }, 120_000);

  // ── (Plan 29-34, WR-04/WR-05) THE PER-ELEMENT LINE CARRIES AN ACCOUNTING. ───────────────────────
  //
  // A single scanned count had nothing to contradict it. `scanned 1 clear-voice line(s)` reads the
  // same whether the file holds one line or forty-two of which forty-one were legally swallowed —
  // reproduced end to end on a `git archive HEAD` mirror against the committed `.js`, gate exit 0.
  // Three numbers that must account for each other is what turns the published figure into a
  // measurement; the identity itself is refused BY NAME inside the guard.
  const VOICE_LINE_RE =
    /^ {8}(\S+\.md): scanned (\d+) clear-voice line\(s\), (\d+) marker line\(s\), caveman region (\d+) line\(s\), document (\d+) line\(s\)$/;

  it("every guard_voice element line publishes three numbers that ACCOUNT for each other", () => {
    const m = mirror();
    const r = runIn(m);
    const o = out(r);
    expect(r.status).toBe(0);
    const rows = guardSection(o, "guard_voice")
      .map((l) => VOICE_LINE_RE.exec(l))
      .filter((x): x is RegExpExecArray => x !== null);
    // THE HARNESS'S OWN PREMISE, ASSERTED FIRST. A regex that silently matched nothing would make
    // every claim below a claim about an empty list. The element count is DERIVED from the same two
    // authorities the guard's own denominator uses, never from the loop that consumed the output.
    expect(
      rows,
      "the accounting rows must be parsed from the guard_voice section, or every assertion below is over an empty list",
    ).toHaveLength(ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC));
    for (const [line, name, scanned, , region, total] of rows) {
      expect(
        Number(scanned) + Number(region),
        `${name}: scanned + caveman region must equal the document's own line count — ${line.trim()}`,
      ).toBe(Number(total));
      // And the accounting is not vacuous in the direction that matters: a document total of zero,
      // or a scanned count equal to the total on a file that really has a fence, would satisfy an
      // equality while measuring nothing.
      expect(Number(total), `${name}: document total`).toBeGreaterThan(0);
    }
    // At least one element must have a NON-ZERO caveman region, or the identity above would hold
    // trivially for every row and prove nothing about the reader's half of it.
    expect(
      rows.filter((x) => Number(x[4]) > 0).length,
      "the accounting must be exercised on files that really carry a caveman region",
    ).toBe(ROLE_COUNT);
  }, 120_000);

  it("guard_voice reconciles its walked array against the published retained count", () => {
    // The reconciliation cannot be reached by planting a file: the reader and the marker loop agree
    // on every possible document, which is the property being pinned. So it is proven the way this
    // file proves every floor — a SCRATCH build with ONE mutation, asserted to have applied, run
    // against an ordinary hermetic mirror.
    //
    // The mutation drops one line from the remainder AT THE POINT THE GUARD TAKES IT — before the
    // neutralisation pass — so refusals (a) and (b) both still hold and (c) is the only one that can
    // fire. A mutation placed after the pass would red on (b) instead and this case would report a
    // reconciliation it never exercised.
    const dropped = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace(
          "body = verdict.outside;",
          'body = verdict.outside.split("\\n").slice(1).join("\\n");',
        ),
    });
    const m = mirror();
    const r = runScratch(dropped, m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain("the scanned remainder does not match the reader's accounting");
    expect(o).toContain("the scan is short");
    // The finding NAMES which side is short — a message saying only "two numbers differ" cannot tell
    // an author whether the reader over-reported or the scan under-walked.
    expect(o).toMatch(/the marker scan walked \d+ line\(s\) while the reader retained \d+/);
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
    // The SIBLING guard is untouched by this mutation, so the red is attributable to guard_voice's
    // reconciliation rather than to a scratch build that broke everything.
    expect(o).toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`);
  }, 120_000);

  it("guard_voice refuses when the marker-neutralisation pass changes the line count", () => {
    // REFUSAL (b): `neutralizePhrases` runs BETWEEN the reader and the marker loop, so every
    // downstream line-count claim is a claim about ITS output. If it ever added a line the
    // reconciliation would red for a reason with nothing to do with a swallowed remainder, and the
    // finding would name the wrong cause. The premise is measured rather than argued from its shape.
    const splits = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace(
          '.replace(/\\/grug/gi, "BRANDCMD")',
          '.replace(/\\/grug/gi, "BRAND\\nCMD")',
        ),
    });
    const m = mirror();
    const r = runScratch(splits, m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain("the marker-neutralisation pass changed the line count from");
    expect(o).toContain("it may rewrite within a line and never across one");
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
    expect(o).toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`);
  }, 120_000);

  it("guard_voice refuses when the reader's accounting does not close against the document", () => {
    // REFUSAL (a): the ONE comparison in the loop between a number the reader produced and a number
    // it did not. Mutated in the READER's compiled module rather than the guard's, because that is
    // the direction the check exists for — a reader whose indices stop describing the bytes.
    const skewed = scratchGuardFiles({
      "voice-model.js": (src) =>
        src.replace(
          "return { ok: true, inside, outside, outsideLines, removedLines };",
          "return { ok: true, inside, outside, outsideLines, removedLines: removedLines + 1 };",
        ),
    });
    const m = mirror();
    const r = runScratch(skewed, m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain("the line accounting does not close");
    expect(o).toMatch(/the reader retained \d+ line\(s\) and removed \d+ for the caveman region/);
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
  }, 120_000);

  it("a voice file whose scan remainder COLLAPSES is a named finding, not a silent pass", () => {
    // THE ELEMENT-LEVEL FLOOR, proven REACHED rather than merely present. A SEC_VOICE surface carries
    // no caveman fence by declaration, so the WHOLE document is its clear-voice remainder — emptying
    // it drives the scanned remainder to zero content WITHOUT going through the reader's refusal arm,
    // which is the only route on which the floor can fire. (A role file with the same defect is
    // refused `unterminated` by the reader first; that route is the case below.)
    const m = mirror();
    const surface = "agent-factory/checklists/security-nfr-checklist.md";
    expect(
      readFileSync(join(m, surface), "utf8").length,
      "the mirror must carry the surface with content BEFORE it is collapsed",
    ).toBeGreaterThan(0);
    writeFileSync(join(m, surface), "", "utf8");
    const r = runIn(m);
    const o = out(r);
    expect(r.status).toBe(1);
    // (Plan 29-34, WR-04) The finding now names the RETAINED-INDEX count. It reads 1 here rather
    // than 0 because this surface's whole document IS the remainder — the branch declares no fence —
    // so the emptied file really does retain one (empty) line and the emptiness half of the floor is
    // what fires. The retained-index half is exercised by the role-file route in the case below it.
    expect(o).toContain(`${surface}: the clear-voice remainder retains 1 line(s)`);
    expect(o).toContain("carries 0 byte(s) of content");
    expect(o).toContain("was NOT effectively scanned");
    // The retired wording may not survive beside the new one — a finding message describing a
    // condition the code no longer tests is the same defect the rewording exists to remove.
    expect(o).not.toContain("the clear-voice remainder collapsed to");
    // The published count for that file is VISIBLE — the number and the finding come from the same
    // `body`, so a build in which they drifted apart would print a collapsed count beside a pass.
    expect(o).toContain(`${basename(surface)}: scanned 1 clear-voice line(s)`);
    // And no guard_voice PASS line of ANY shape survives.
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
    expect(o).not.toContain("  PASS  voice: clear-voice surfaces free of caveman markers");
    expect(o).not.toContain("ALL CHECKS PASSED");
  }, 120_000);

  it("the floor's RETAINED-INDEX half fires on a document that is nothing but an anchor and a fence", () => {
    // THE HALF WR-04 SAYS COULD NOT FIRE, SHOWN FIRING. `bodyLines.length === 0` was unreachable for
    // every possible string; `outsideLines === 0` is reachable, and this is the document that
    // reaches it — a role file whose every line is either the anchor or inside the fence, so the
    // reader retains ZERO indices while the walked array still holds one empty element.
    //
    // It is planted on a ROLE file (which expects a fence) rather than a security surface, because
    // the security branch declares the whole document to be the remainder and can never reach a
    // retained count of zero. Which half of the floor a given route can fire is not interchangeable.
    const m = mirror();
    const host = roleNamesIn(m)[0];
    expect(host, "the plant host must be a member of the mirror's derived role set").toBeTruthy();
    // A well-formed fence, so the reader returns ok and the refusal arms are NOT what fires.
    writeFileSync(
      rolePath(m, host),
      ["## Caveman prompt", "```", "grug smash rock", "you no think", "```"].join("\n"),
      "utf8",
    );
    const r = runIn(m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain(`${roleRel(host)}: the clear-voice remainder retains 0 line(s)`);
    // PREMISE: the reader did NOT refuse this document — otherwise the floor was never reached and
    // this case would be reporting the refusal arm under the floor's name.
    expect(o).not.toContain(`${roleRel(host)}: ## Caveman prompt fence refused`);
    // And the number PUBLISHED for the file is the split length, one, beside a retained count of
    // zero — the exact ambiguity that made the retired disjunct unreachable, now visible in the
    // transcript instead of hidden by it.
    expect(o).toContain(`${basename(host)}: scanned 1 clear-voice line(s)`);
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
  }, 120_000);

  // ── (Plan 29-34, WR-05) THE RESIDUAL IS DISCLOSED, AND THE DISCLOSURE IS PINNED. ────────────────
  //
  // The accounting closes the direction where a remainder shrinks without the caveman region growing.
  // The OTHER direction — a region that legitimately grows until it swallows its whole section — is
  // held by the reader's delimiter-neutralised bound alone, and WR-05's own fix paragraph says that
  // "at minimum, record the residual by name at the declaration so a later reader meets it as a
  // decision rather than inferring it from a printed number."
  //
  // A recorded decision that nothing holds still is a comment with a shelf life. So the four load-
  // bearing claims of that paragraph are pinned against the guard's source bytes, the way this file
  // already pins SEC_VOICE's roster and check-audit-register.ts pins its own sentences. Removing the
  // disclosure reds; so does removing the refusal of the nineteen-baseline alternative, which is the
  // half a later editor is most likely to drop while "tidying".
  const VOICE_REMAINDER_RESIDUAL: readonly string[] = [
    "THE WR-05 RESIDUAL — WHAT THE ACCOUNTING ABOVE DOES NOT CATCH, STATED AS A DECISION.",
    "catch a caveman region that LEGITIMATELY GREW. A role file whose fence is honestly widened",
    "WHAT BOUNDS IT TODAY is the delimiter-neutralised section bound in scripts/voice-model.ts: the",
    "THE REFUSED ALTERNATIVE, NAMED. A per-file table of nineteen hand-measured minimum ratios —",
  ] as const;

  /** How many times a pinned sentence occurs in the source. A member must occur exactly once. */
  const residualOccurrences = (src: string, sentence: string): number =>
    src.split(sentence).length - 1;

  it("the WR-05 residual is DISCLOSED at the declaration", () => {
    // THE HARNESS'S OWN PREMISE FIRST: the source really was read, and it really is the guard's.
    expect(
      GUARD_TS_SRC.length,
      "the guard source must have been read before anything is claimed about its prose",
    ).toBeGreaterThan(1000);
    expect(GUARD_TS_SRC).toContain("function guardVoice()");
    for (const sentence of VOICE_REMAINDER_RESIDUAL) {
      // EXACTLY ONCE, not merely present. A member that also occurs elsewhere in the file cannot be
      // shown to be load-bearing — deleting it from the disclosure leaves the pin satisfied by the
      // other copy, which is a pin over the file rather than over the paragraph. The first draft of
      // this roster carried such a member (`It does NOT`) and the sibling below is what found it.
      expect(
        residualOccurrences(GUARD_TS_SRC, sentence),
        `the residual disclosure must carry this sentence EXACTLY ONCE: ${sentence}`,
      ).toBe(1);
    }
    // The disclosure must sit AT THE DECLARATION it describes, not anywhere in the file — a
    // paragraph that drifts away from the floor it qualifies stops being met by the reader who needs
    // it. Asserted as an ORDERING against the floor's own condition rather than as a line number,
    // which would red on every unrelated edit above it.
    const residualAt = GUARD_TS_SRC.indexOf(VOICE_REMAINDER_RESIDUAL[0]);
    const floorAt = GUARD_TS_SRC.indexOf('if (outsideLines === 0 || body.trim() === "")');
    expect(floorAt, "the floor's shipped condition must be locatable in the source").toBeGreaterThan(
      0,
    );
    expect(
      residualAt < floorAt && floorAt - residualAt < 3000,
      "the residual paragraph must sit immediately above the element floor it qualifies",
    ).toBe(true);
    // And the MEASUREMENT the decision rests on is present with both ends of its range, so a later
    // reader can tell how far the corpus sits from the bound without re-deriving it to find out.
    expect(GUARD_TS_SRC).toContain("retained / document");
    expect(GUARD_TS_SRC).toMatch(/0\.860 \(factory-coach\.md/);
    expect(GUARD_TS_SRC).toMatch(/0\.915 \(orchestrator\.md/);
  });

  it("the residual pin REDS when the disclosure is removed — the falsifiability sibling", () => {
    // A pin that has only ever been seen passing is indistinguishable from a pin over a constant
    // that happens to be present. Each sentence is deleted from a COPY of the source in turn and the
    // same predicate re-run, so every member is shown to be load-bearing rather than only the first.
    for (const sentence of VOICE_REMAINDER_RESIDUAL) {
      const without = GUARD_TS_SRC.replace(sentence, "");
      expect(
        without,
        `the mutation must actually change the source for ${sentence}`,
      ).not.toBe(GUARD_TS_SRC);
      expect(
        without.includes(sentence),
        `removing ${sentence} must be visible to the pin, or that member pins nothing`,
      ).toBe(false);
    }
    // AND THE CONTROL: an unrelated deletion elsewhere in the file leaves every member intact, so
    // the probe above is discriminating between the disclosure and the file rather than reporting
    // that any edit at all reds it.
    const unrelated = GUARD_TS_SRC.replace("function guardVoice()", "function guardVoice2()");
    expect(unrelated).not.toBe(GUARD_TS_SRC);
    for (const sentence of VOICE_REMAINDER_RESIDUAL) {
      expect(unrelated.includes(sentence), `${sentence} must survive an unrelated edit`).toBe(true);
    }
  });

  it("a role file whose caveman fence is left OPEN across a later heading exits 1 with no guard_voice pass line", () => {
    // THE CR-01 SHAPE AT THE GATE. The plant is derived from the mirror's real file at run time — the
    // recorded first-draft failure two cases up is that a plant appended at EOF proves nothing — and
    // its premise is asserted before the claim.
    const m = mirror();
    expect(
      roleNamesIn(m),
      "the plant host must be a member of the mirror's derived role set",
    ).toContain(MALFORMED_ROLE);
    const file = rolePath(m, MALFORMED_ROLE);
    const before = readFileSync(file, "utf8");
    const lines = before.split("\n");
    const heading = lines.findIndex((l) => l.trimEnd() === "## Caveman prompt");
    const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
    const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
    expect(
      [heading, open, close].every((i) => i >= 0),
      "the host file must carry an anchor and both delimiters before anything is planted",
    ).toBe(true);
    // A `## ` heading written BETWEEN the delimiters — the shape 29-20's fence-aware bound could not
    // see, because the fence toggle flags the interior the heading sits in.
    const after = [
      ...lines.slice(0, close),
      "",
      "## Notes",
      "you no think, big brain swamp demon",
      ...lines.slice(close),
    ].join("\n");
    expect(after, "the plant must actually change the file").not.toBe(before);
    // PREMISE, MEASURED: the planted heading really does sit between the two delimiters.
    const planted = after.split("\n");
    const notes = planted.findIndex((l) => l === "## Notes");
    const delimiters = planted.map((l, i) => (/^```/.test(l) ? i : -1)).filter((i) => i >= 0);
    expect(
      delimiters[0] < notes && notes < delimiters[1],
      "the planted heading must sit BETWEEN the caveman fence's two delimiters, or the case is vacuous",
    ).toBe(true);
    writeFileSync(file, after, "utf8");

    const r = runIn(m);
    const o = out(r);
    expect(r.status).toBe(1);
    expect(o).toContain(
      `${roleRel(MALFORMED_ROLE)}: ## Caveman prompt fence refused — reason unterminated`,
    );
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
    expect(o).not.toContain("  PASS  voice: clear-voice surfaces free of caveman markers");
    // The refused file is NOT among the published scanned counts — "this file was NOT scanned" is now
    // a visible fact rather than a claim, because the denominator (19) exceeds the lines printed (18).
    const scanned = o.split("\n").filter((l) => /: scanned \d+ clear-voice line\(s\)/.test(l));
    expect(scanned).toHaveLength(ROLE_COUNT + parseSecVoiceCount(GUARD_TS_SRC) - 1);
    expect(scanned.filter((l) => l.includes(MALFORMED_ROLE))).toHaveLength(0);
  }, 120_000);

  // ── (Plan 29-27, Task 3) THE UNION — BOTH HALVES OF LANG-06's FIX, ON ONE DOCUMENT. ─────────────
  //
  // The reader's bound (Task 1) and the guard's denominator (Task 2) are two halves of ONE failure,
  // and this phase's own recorded probe is that a fix scoped to the arm the reproduction happened to
  // use leaves the arm beside it open. Proving them separately on two documents proves two things;
  // the bypass needed both at once, so the closure must be shown at once too.
  //
  // The document is the attack in full: a role file whose caveman fence is opened inside its section
  // and closed AFTER a later heading, with the swallowed section REWORDED INTO CAVEMAN VOICE — the
  // exact thing guard_voice exists to refuse, hidden in the bytes guard_voice would have stopped
  // scanning. Three assertions, because ANY ONE of them alone was true at HEAD while the bypass
  // shipped: the gate exits 1, guard_voice names the file with the reason, and guard_caveman_voice
  // names the SAME file with the SAME reason from the SAME verdict.
  const UNION_HEADING = "## Hard limits";
  const UNION_CAVEMAN_LINE = "you no think, big brain swamp demon, grug club rock";

  /**
   * Build the union plant against a mirror, refusing with a NAMED message if either of its own
   * premises fails. A plant appended at end of file proves nothing — that is the recorded first-draft
   * defect of the level-one whole-gate case above — so the anchor, the delimiters and the insertion
   * point are all DERIVED from the mirror's real file at run time and the bracket is then asserted.
   *
   * `headingOffset` exists only so the vacuous arrangement can be FORCED once, and the premise shown
   * to fire. A premise that has never been seen refusing is a comment.
   */
  const buildUnionPlant = (
    root: string,
    host: string,
    opts: { headingOffset?: number } = {},
  ): string => {
    const names = roleNamesIn(root);
    if (!names.includes(host)) {
      throw new Error(
        `union plant: ${host} is not a member of the mirror's derived role set (${names.length} members) — the plant would land outside the corpus the guards scan`,
      );
    }
    const lines = readFileSync(rolePath(root, host), "utf8").split("\n");
    const heading = lines.findIndex((l) => l.trimEnd() === "## Caveman prompt");
    const open = lines.findIndex((l, i) => i > heading && /^```/.test(l));
    const close = lines.findIndex((l, i) => i > open && /^```/.test(l));
    if (heading === -1 || open === -1 || close === -1) {
      throw new Error(
        `union plant: ${host} does not carry an anchor and two delimiters (heading ${heading}, open ${open}, close ${close})`,
      );
    }
    const at = close + (opts.headingOffset ?? 0);
    const after = [
      ...lines.slice(0, at),
      "",
      UNION_HEADING,
      UNION_CAVEMAN_LINE,
      ...lines.slice(at),
    ].join("\n");
    const planted = after.split("\n");
    // THE PLANTED OCCURRENCE, NOT MERELY THE FIRST ONE. `## Hard limits` is a real section of every
    // role file — that is exactly why it is the heading worth hiding a reworded safety surface behind
    // — so a `findIndex` from zero would locate the file's OWN later heading on any file where the
    // caveman section sits below it, and the bracket check would then be answering about the wrong
    // line. The search starts at the insertion point, and the plant is asserted to have added exactly
    // one occurrence.
    const occurrences = (xs: string[]): number => xs.filter((l) => l === UNION_HEADING).length;
    if (occurrences(planted) !== occurrences(lines) + 1) {
      throw new Error(
        `union plant: expected exactly one NEW \`${UNION_HEADING}\` line, found ${occurrences(planted)} where the source had ${occurrences(lines)}`,
      );
    }
    const notes = planted.indexOf(UNION_HEADING, at);
    const delimiters = planted.map((l, i) => (/^```/.test(l) ? i : -1)).filter((i) => i >= 0);
    if (!(delimiters[0] < notes && notes < delimiters[1])) {
      throw new Error(
        `union plant: the planted heading sits at line ${notes} while the caveman fence's delimiters sit at ${delimiters[0]} and ${delimiters[1]} — it must sit BETWEEN them or the fence never spans it and the plant proves nothing`,
      );
    }
    return after;
  };

  it("the union plant refuses to be vacuous — BOTH of its premises fail with a NAMED message", () => {
    const m = mirror();
    // Premise one, forced: a host outside the derived role set.
    expect(() => buildUnionPlant(m, "not-a-real-role.md")).toThrow(
      /is not a member of the mirror's derived role set/,
    );
    // Premise two, forced: the heading inserted one line PAST the closing delimiter — the vacuous
    // arrangement, in which the fence never spans the heading and the pre-fix build already refused.
    expect(() => buildUnionPlant(m, MALFORMED_ROLE, { headingOffset: 1 })).toThrow(
      /it must sit BETWEEN them/,
    );
    // And the real arrangement passes both, so the throws above are the premises firing and not the
    // helper being broken.
    expect(() => buildUnionPlant(m, MALFORMED_ROLE)).not.toThrow();
  }, 120_000);

  it("THE UNION: an open fence swallowing a caveman-reworded section exits 1, and BOTH guards name the same file for the same reason", () => {
    const m = mirror();
    const after = buildUnionPlant(m, MALFORMED_ROLE);
    // The swallowed section really does carry caveman voice — measured through the same counter the
    // guards read, so the case is about a CONCEALED VIOLATION and not merely about a malformed fence.
    expect(
      countLexiconTokens(UNION_CAVEMAN_LINE),
      "the swallowed section must be caveman-voiced, or the union case is only a fence-shape case",
    ).toBeGreaterThanOrEqual(CAVEMAN_LEXICON_MIN);
    writeFileSync(rolePath(m, MALFORMED_ROLE), after, "utf8");

    const r = runIn(m);
    const o = out(r);
    const rel = roleRel(MALFORMED_ROLE);
    const refused = `${rel}: ## Caveman prompt fence refused — reason unterminated`;

    // (1) THE GATE.
    expect(r.status, "the whole gate must exit 1 on the union document").toBe(1);
    expect(o).not.toContain("ALL CHECKS PASSED");

    // (2) guard_voice names the file WITH the reason, inside its own section.
    expect(
      guardSection(o, "guard_voice").filter((l) => l.includes(refused)),
      "guard_voice must name the file and the reason inside its OWN output section",
    ).toHaveLength(1);

    // (3) guard_caveman_voice reaches the IDENTICAL verdict on the IDENTICAL bytes. This is LANG-07's
    // actual acceptance evidence at this seam: not that one reader exists, but that both consumers
    // agree. Asserted in its own section, so one consumer printing twice cannot satisfy it.
    expect(
      guardSection(o, "guard_caveman_voice").filter((l) => l.includes(refused)),
      "guard_caveman_voice must reach the SAME verdict on the SAME bytes, inside its OWN output section",
    ).toHaveLength(1);

    // And neither guard prints a measured PASS over a document it refused.
    expect(o).not.toMatch(/PASS +voice: 0 findings over/);
    expect(o).not.toContain(`caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT}`);
  }, 120_000);

  it("THE UNION IS PROVEN ABLE TO FAIL: the pre-fix reader bound passes the same document", () => {
    // A whole-gate case that passes against the build it was written to fail is the recorded
    // first-draft defect at the level-one sibling above. This reconstructs the PRE-TASK-1 reader on a
    // scratch build — one textual revert of the delimiter-neutralised bound back to the fence-aware
    // one — and runs the SAME planted mirror through it. History-independent on purpose: keying the
    // proof to a commit hash would rot the first time the file moves.
    const preFixReader = scratchGuardFiles({
      "voice-model.js": (src) =>
        src.replace(
          "const sectionEnd = sectionEndIndex(blindText, heading + 1, 2);",
          "const sectionEnd = sectionEndIndex(text, heading + 1, 2);",
        ),
    });
    const m = mirror();
    writeFileSync(rolePath(m, MALFORMED_ROLE), buildUnionPlant(m, MALFORMED_ROLE), "utf8");
    const o = out(runScratch(preFixReader, m));
    const refused = `${roleRel(MALFORMED_ROLE)}: ## Caveman prompt fence refused — reason unterminated`;
    // The pre-fix reader ACCEPTS the swallowed block, so neither guard refuses — which is precisely
    // the shipped bypass, and precisely what makes the case above discriminating.
    expect(
      o.split("\n").filter((l) => l.includes(refused)),
      "the pre-fix bound must NOT refuse this document — if it does, the union case above is passing for a reason other than the fix",
    ).toHaveLength(0);
    // And the caveman guard measures the WRONG BYTES: it publishes a block for this role built from
    // the swallowed section rather than refusing it.
    expect(o).toMatch(measurementLine(MALFORMED_ROLE));
  }, 120_000);

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

  // ── (Plan 29-13, LANG-08 / D-25) roleCeiling()'s FAIL-CLOSED DEFAULT, pinned by EXIT STATUS. ──
  //
  // Plan 29-13 re-baselines this switch table once, at the end of Phase 29. The property that has to
  // survive that edit is the one D-25's own comment argues for: a role the table does not know gets
  // NO ceiling and fails the aggregator CLOSED, rather than inheriting an automatic one. Deriving
  // the table would hand role #18 a ceiling instead of forcing an author to measure and record one.
  //
  // The `planted 18th role reaches guard_role_size` case above asserts that the LINE appears, and
  // deliberately asserts nothing about the exit code — it is a proof about DERIVATION, not about
  // fail-closure. This case is the other half. It cannot simply assert `status !== 0`, because
  // guard_kit_counts legitimately fails on the same 18-role mirror: a bare nonzero would be
  // satisfied by a co-firing guard even if the default branch had been softened to return a ceiling.
  //
  // So it comes in three parts, and the third is the one that carries the weight:
  //   control    the unplanted mirror is GREEN, so the plant is what turns it red;
  //   red        the plant produces a FAIL line naming `no documented ceiling` and NO size verdict;
  //   falsifier  the SAME mirror and the SAME plant against a scratch build whose `default:` returns
  //              a ceiling instead of "" now yields a `within ceiling` PASS for the planted file —
  //              which is precisely the silently-widening table D-25 refuses, and which proves the
  //              empty string is the mechanism rather than some unrelated guard.
  it("guard_role_size fail-closed default: an UNDOCUMENTED role FAILS closed by exit status, and a default returning a ceiling does not (D-25, LANG-08)", () => {
    const PLANT = "zz-undocumented-role.md";
    // A byte copy of a real role, so every prose guard is satisfied and the ONLY thing wrong with
    // the planted file is that roleCeiling() has no case for its name.
    const plantInto = (root: string): void => {
      cpSync(rolePath(ROOT, "installer.md"), rolePath(root, PLANT));
    };

    // (a) Control — the same fixture, unplanted, is green. Without this the red half below would
    //     still pass if the mirror were broken for some reason having nothing to do with the plant.
    expect(runIn(consistentMirror()).status).toBe(0);

    // (b) Red — the plant fails the aggregator CLOSED.
    const m = consistentMirror();
    plantInto(m);
    const red = runIn(m);
    expect(red.status).not.toBe(0);
    const ceilingLine = out(red)
      .split("\n")
      .find((l) => l.includes(PLANT) && l.includes("no documented ceiling"));
    expect(ceilingLine).toBeDefined();
    expect(ceilingLine!.trimStart().startsWith("FAIL")).toBe(true);
    // And it is never given a size verdict: the default returned "", so no ceiling was compared.
    expect(
      out(red)
        .split("\n")
        .find((l) => l.includes(PLANT) && /\d+B (within ceiling|>=)/.test(l)),
    ).toBeUndefined();

    // (c) Falsifier — soften ONLY the default branch in a scratch build. scratchGuardFiles() throws
    //     if the replacement matches nothing, so a mutation that silently stopped applying cannot
    //     leave this case reporting a control it never exercised.
    const softened = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace('        default:\n            return "";', '        default:\n            return "999999 999999";'),
    });
    const m2 = consistentMirror();
    plantInto(m2);
    const green = runScratch(softened, m2);
    expect(out(green)).not.toContain("no documented ceiling");
    const softenedLine = out(green)
      .split("\n")
      .find((l) => l.includes(PLANT) && l.includes("within ceiling"));
    expect(softenedLine).toBeDefined();
    expect(softenedLine!.trimStart().startsWith("PASS")).toBe(true);
  }, 120_000);

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
  //
  // (Plan 29-07) IT IS FLIPPED BACK, ON SCHEDULE. The last two role files — the dual-voice safety
  // pair — landed in this plan, so all 17 caveman blocks carry measured voice and no role file
  // repeats a clause. Both derivations returned ZERO, 29-05's non-vacuity floor failed, and that
  // failure is what forced this flip to be a DELIBERATE inversion: there was no number to retype.
  //
  // The derivations are KEPT and their direction REVERSED. The tree must be green FOR THE REASON THE
  // GUARDS SAY IT IS — the derived red count and the derived clause-group count are both asserted at
  // exactly 0, computed from the live corpus through the same voice-model.js authorities the guards
  // read, so the case and the guard cannot come to disagree about what a red block is. Plan 29-01's
  // RED baselines stay referenced as the journey's other end: 17 -> 0 and 12 -> 0, strictly down.
  //
  // The RED behaviour this case used to prove did not disappear with the flip. It lives in the three
  // arm fixtures, the `||` falsifiability proof and the all-red planted mirror above, each of which
  // re-creates a red shape explicitly and is therefore permanent.
  it("smoke: real tree is FULLY GREEN and both voice derivations are zero (plan 29-07 flip-back)", () => {
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    const o = out(r);
    const fails = o.split("\n").filter((l) => l.startsWith("  FAIL"));
    // Assert on the FAIL lines BEFORE the status, so a regression reports WHICH guard broke rather
    // than only that the exit code was non-zero.
    expect(
      fails.map((l) => l.split(":")[0].replace("  FAIL  ", "")),
      "no guard may fail on the committed tree",
    ).toEqual([]);
    const derivedVoiceRed = derivedVoiceRedCount();
    const derivedClauseGroups = derivedClauseGroupCount();
    expect(derivedVoiceRed).toBe(0);
    expect(derivedClauseGroups).toBe(0);
    expect(derivedVoiceRed).toBeLessThan(VOICE_RED_BASELINE_29_01);
    expect(derivedClauseGroups).toBeLessThan(CLAUSE_GROUP_BASELINE_29_01);
    // The PASS lines carry the measurement with its full denominator (D-08) — a green that publishes
    // what it read, rather than a green that merely says nothing.
    expect(o).toContain(
      `caveman voice: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`,
    );
    expect(o).toContain(
      `role clause uniqueness: 0 findings over ${ROLE_COUNT}/${ROLE_COUNT} elements`,
    );
    expect(r.status).toBe(0);
    expect(o).toContain("ALL CHECKS PASSED");
    // The 17 per-block measurement lines are present and in listRoles() sorted order, so the
    // transcript embedded in the guard's source header is reproducible byte-for-byte.
    //
    // (Plan 29-14, IN-01 class audit) Deliberately rootless. This case spawns the guard with NO
    // CHECK_ROOT override, so the tree under measurement IS the repository; `roleNamesIn(ROOT)` would
    // be the same call with more ceremony. Rooting it at a mirror would compare the live tree's
    // transcript against some other tree's role set.
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

  // ──────────────────────────────────────────────────────────────────────────────────────────────
  // (Plan 29-14, closing IN-01) THE HARNESS ASSERTS ITS OWN PREMISE.
  //
  // Every voice claim this file makes about a MIRROR rests on one unstated assumption: that the
  // derivations enumerate the mirror's roles rather than the repository's. Until this plan that
  // assumption was FALSE and nothing here could tell, because on the live tree the two sets coincide
  // and every existing case measured a mirror built by copying the live tree — so the wrong set and
  // the right set happened to be the same set.
  //
  // Project memory records the standing remedy in this repository's own words: ASSERT THE
  // VERIFICATION HARNESS'S OWN PREMISE. Phase 27 shipped a harness that produced a FALSE result in
  // six instances across four straight rounds, and each time the premise had gone unasserted rather
  // than been asserted wrongly. So this case does not test a guard. It tests the INSTRUMENT, by
  // constructing the one situation where the two sets are forced apart: a mirror carrying a role the
  // real tree has never had.
  //
  // The plant is named to sort clear of the whole live corpus and does NOT begin with `_`, because
  // `listRoles` drops underscore-prefixed entries by its own rule — an underscore-prefixed plant
  // would be legitimately out of set and the case would prove nothing while looking green.
  //
  // A derivation that silently returned the live set fails here TWICE and in two different currencies:
  // by MEMBERSHIP (the planted name is absent from the derived set) and by NUMBER (neither count
  // moves). One of those alone could be argued away; both cannot.
  it("the voice derivations count a role planted only into the mirror (IN-01 premise)", () => {
    const PLANTED = "zz-planted-premise-role.md";
    // Two things at once, both derived rather than declared: a caveman block that fails BOTH voice
    // arms (zero lexicon terms, one copula) and a clause repeated verbatim in the clear-voice half.
    // So the plant contributes to BOTH derivations, and a harness blind to it is caught by either.
    const REPEATED = "You hold this premise for the harness only.";
    const PLANTED_TEXT = [
      "# Role: Planted Premise",
      "",
      "## One job",
      REPEATED,
      REPEATED,
      "",
      "## Caveman prompt",
      "```",
      ...BOTH_ARMS_FAILING_BLOCK,
      "```",
      "",
    ].join("\n");

    // PREMISE OF THE PREMISE. The planted bytes really do carry the contribution this case is about
    // to attribute to them, measured through the SAME authorities the derivations use rather than
    // asserted in a comment. Derive the expected DELTA independently of the loop that consumes it —
    // a vacuity floor catches an empty denominator but never a silently short one.
    expect(voiceRed(PLANTED_TEXT), "the plant must be voice-RED").toBe(true);
    const PLANTED_VOICE_DELTA = voiceRed(PLANTED_TEXT) ? 1 : 0;
    const PLANTED_CLAUSE_DELTA = clauseGroups(PLANTED_TEXT);
    expect(PLANTED_CLAUSE_DELTA, "the plant must contribute a clause group").toBe(1);

    const m = mirror();
    const namesBefore = roleNamesIn(m);
    const redBefore = voiceRedCountIn(m);
    const groupsBefore = clauseGroupCountIn(m);

    writeFileSync(rolePath(m, PLANTED), PLANTED_TEXT, "utf8");

    const namesAfter = roleNamesIn(m);
    const namesLive = roleNamesIn(ROOT);

    // 1. MEMBERSHIP. The mirror's derived set grew by exactly this file, and the repository's did not.
    expect(namesAfter).toContain(PLANTED);
    expect(namesLive).not.toContain(PLANTED);
    expect(namesAfter.length).toBe(namesBefore.length + 1);
    expect(namesAfter.length).toBeGreaterThan(namesLive.length);

    // 2. NUMBER. Both derivations moved by exactly the plant's own contribution. A derivation that
    // listed the live tree and read from the mirror would return the SAME numbers as before, because
    // the planted name would never be enumerated and so never read.
    expect(voiceRedCountIn(m)).toBe(redBefore + PLANTED_VOICE_DELTA);
    expect(clauseGroupCountIn(m)).toBe(groupsBefore + PLANTED_CLAUSE_DELTA);

    // 3. THE BYTES CAME FROM THE MIRROR. Membership and counts could in principle both move while the
    // text was read from somewhere else; this pins that the derived text set really is the mirror's.
    expect(roleTextsIn(m)).toContain(PLANTED_TEXT);
    expect(roleTextsIn(m).length).toBe(namesAfter.length);
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
    // (Plan 29-01) The expected verdict was the tree's deliberate 2-FAIL red, not exit 0 — see the
    // smoke case above. What this asserts is that no guard the sweep touches moved.
    //
    // (Plan 29-07) The role rewrite is complete and the tree's verdict is now a clean exit 0, so the
    // expected verdict is flipped here too. It is still written as the FULL FAIL-NAME LIST rather
    // than as a bare status, so a regression the sweep left behind is reported BY GUARD NAME instead
    // of as an anonymous non-zero exit.
    const r = spawnSync("node", [GUARD_JS], { encoding: "utf8" });
    const fails = out(r)
      .split("\n")
      .filter((l) => l.startsWith("  FAIL"));
    expect(
      fails.map((l) => l.split(":")[0].replace("  FAIL  ", "")),
      "the sweep must leave the tree's verdict exactly as it found it",
    ).toEqual([]);
    expect(r.status).toBe(0);
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// (PLAN 29-25, WR-05 / WR-06 / WR-07) THE HARNESS DEFECT CLASS, CLOSED DERIVATIONALLY.
//
// WR-06 is the THIRD recorded instance of a harness assertion that asserts less than its name
// claims, and all three landed in one review: a live-corpus control asserting a floor its own call
// already guarantees, a pair of byte-identical `toContain` calls standing for two consumers, and a
// case named for a property whose body tests a source substring. Fixing the third does nothing about
// the fourth — round 2 of this phase exists because round 1 fixed three sites of one finding and a
// fourth nobody had derived stayed open. So the SHAPE gets a tripwire rather than the address getting
// a patch.
//
// WHAT IT CATCHES. Two ADJACENT assertion lines whose text is byte-identical after trimming. Two
// identical assertions assert one thing twice, and the comment above them almost always claims two —
// which is precisely what WR-06 was. `toContain` is a substring test, so the second call is satisfied
// by whatever satisfied the first, and a build in which one of the two subjects went silent passes.
//
// "WITHIN ONE TEST BODY" IS GUARANTEED BY ADJACENCY, NOT APPROXIMATED BY IT. Two consecutive lines
// cannot straddle a test boundary: a boundary is spelled `});` and `it("…", () => {`, neither of
// which is classified as an assertion line, so at least one unclassified line always separates the
// last assertion of one body from the first of the next. That argument is asserted below rather than
// left as a claim.
//
// NON-VACUITY IS FLOORED PER ELEMENT, NOT ONLY IN TOTAL. This project has recorded a vacuity floor
// that caught an EMPTY denominator and missed a SILENTLY SHORT one, so the file count is derived from
// a directory read the scan does not produce, AND every scanned file is required to contribute at
// least one classified assertion line. A scan that read forty-six files and classified nothing in
// half of them can no longer report zero duplicates.
//
// SCOPE IS EVERY `*.test.ts` UNDER `scripts/`, WHICH IS WIDER THAN THE PLAN SPECIFIES. The plan names
// the four gate test modules and the voice model's. A five-member hand-list is the set-literal drift
// this repository has corrected three times and would not cover the sixth test module that lands
// tomorrow, so the set is derived.
//
// (Plan 29-29, IN-03) THE SNAPSHOT THAT USED TO SIT HERE IS GONE, AND THAT IS THE POINT. It read
// "46 files, 4706 classified assertion lines" and was already wrong once before it was committed —
// the first draft said 4693, the count taken BEFORE this block was appended, which the block's own
// assertion lines then falsified. A number written into a comment and never re-measured is the shape
// of defect this plan is about, so the numbers now live in `TRIPWIRE_*` constants pinned two-sided by
// a case that DERIVES them, and the census that produces them reproduces round 3's own published
// answer over round 3's own tree before any new number is believed.
//
// THE ZERO IS NOT VACUOUS, AND THAT IS A HISTORICAL MEASUREMENT RATHER THAN A BELIEF. Run over THIS
// FILE at commit `3ed76c1` — the tree as it stood before plan 29-25 — the same classifier reports
// exactly ONE pair, at line 4251, and it is WR-06 at the address the round-2 review named. The live
// answer is zero only because that pair became an occurrence count in this plan's first commit.
//
// WHAT IT DOES NOT CATCH, NAMED RATHER THAN LEFT UNDISCLOSED — a floor against the shape this project
// has now met three times, not a proof:
//
//   1. Two identical assertions separated by another line — a comment, a blank line, or an unrelated
//      assertion between them.
//   2. Two assertions that differ only in whitespace inside a template literal or across a line
//      break, since the comparison is byte equality after trimming the line's own indentation.
//   3. An assertion duplicated across two CASES rather than within one, which is a different defect
//      (a case that re-proves its neighbour) with a different remedy.
//   4. A multi-line `expect(` whose duplicate opening lines are not adjacent, and any assertion
//      spelled through a helper rather than beginning with `expect(`. LIVE SHARE, derived by the
//      census below rather than described: the share of classified lines carrying a statement that
//      continues past them is FLOORED at `TRIPWIRE_MULTILINE_STATEMENT_FLOOR_PCT`% and stood at
//      20.86% when plan 29-39 measured it, and for every such line a duplicated pair's opener lines
//      are separated by the continuation. (Plan 29-39: this sentence used to quote two exact
//      constants, `TRIPWIRE_MULTILINE_STATEMENTS` of `TRIPWIRE_CLASSIFIED_LINES`. Those constants no
//      longer exist as live pins — see the declaration below — so the share is now named as a floor
//      plus a dated observation. A comment that cites a deleted symbol is the stale-prose class this
//      phase spent four rounds removing.) A planted multi-line duplicate asserts that verdict
//      directly — it is MISSED, on purpose, with the reasoning recorded at the case rather than the
//      absence left to read as coverage.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** A classified assertion line: the line's own text begins the assertion. */
const ASSERTION_LINE = /^expect\(/;
const isAssertionLine = (line: string): boolean => ASSERTION_LINE.test(line.trim());

/** Every `*.test.ts` under `scripts/`, derived by directory read rather than hand-listed. */
const testModules = (): string[] =>
  readdirSync(join(ROOT, "scripts"))
    .filter((n) => n.endsWith(".test.ts"))
    .sort();

/** Adjacent byte-identical assertion pairs in one source, as `line-number :: the line`. */
const duplicateAssertionPairsIn = (src: string): string[] => {
  const lines = src.split("\n");
  const out: string[] = [];
  for (let i = 0; i + 1 < lines.length; i += 1) {
    if (!isAssertionLine(lines[i]) || !isAssertionLine(lines[i + 1])) continue;
    if (lines[i].trim() !== lines[i + 1].trim()) continue;
    out.push(`${i + 1} :: ${lines[i].trim()}`);
  }
  return out;
};

// The planted fixture is ASSEMBLED FROM CONCATENATED FRAGMENTS, so THIS file's own source never
// carries an adjacent byte-identical assertion pair and can never fail the scan on itself. The
// self-reference is not hypothetical — this file is one of the modules the scan reads, and a harness
// that fails its own premise is the exact defect this tripwire exists to delete.
const EXPECT_CALL = `${"expect"}(o).toContain("the same claim, twice");`;
const PLANTED_DUPLICATE_SOURCE = [
  'it("a case whose comment claims two consumers", () => {',
  `  ${EXPECT_CALL}`,
  `  ${EXPECT_CALL}`,
  "});",
  "",
].join("\n");

// (Plan 29-29, IN-03) THE SAME DUPLICATE PAIR, WRITTEN AS A MULTI-LINE CALL — the shape floor item 4
// names and the shape the published figure used to read as covering. Its two opener lines are
// byte-identical and are FOUR lines apart, so adjacency never sees them.
const MULTILINE_EXPECT_CALL = [
  `${"expect"}(`,
  "  o,",
  '  "the same claim, twice",',
  ').toContain("x");',
];
const PLANTED_MULTILINE_DUPLICATE_SOURCE = [
  'it("a case whose comment claims two consumers", () => {',
  ...MULTILINE_EXPECT_CALL.map((l) => `  ${l}`),
  ...MULTILINE_EXPECT_CALL.map((l) => `  ${l}`),
  "});",
  "",
].join("\n");

// ── THE DENOMINATOR, DERIVED FOUR WAYS ────────────────────────────────────────────────────────
//
// (Plan 29-29, IN-03) The tripwire published `N classified assertion lines` and that number read as
// coverage it does not have: for a multi-line `expect(` call the subject and the matcher sit on
// following lines, so a duplicated assertion's OPENER lines are never adjacent and the pair is
// invisible. The floor's disclosed miss named the shape; the number beside it did not account for it.
//
// TWO MULTI-LINE QUESTIONS, NOT ONE, because they are different questions and only the first bears
// on the defect:
//
//   * does the STATEMENT continue past this line? That is what separates two duplicated openers, and
//     it is the share the tripwire is blind to.
//   * does the `expect(` SUBJECT's own parenthesis close on this line? Narrower, and it is the
//     measure round 3's review reported.
//
// AND THE COUNTER'S OWN UNCERTAINTY IS PUBLISHED TOO. Deciding "do the parentheses balance" over
// source text needs a JavaScript tokenizer. Two independently written counters — one naive, one that
// skips quoted regions — DISAGREE on live classified lines, and the disagreement count is pinned
// beside the two totals rather than left as a footnote. A published number whose measurement error
// is unmeasured is the same defect one level up.
const parenBalanceNaive = (line: string): number => {
  let depth = 0;
  for (const ch of line) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
  }
  return depth;
};
const parenBalanceQuoteAware = (line: string): number => {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote !== null) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "/" && line[i + 1] === "/") break;
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
  }
  return depth;
};
/** Does the `expect(` SUBJECT's own parenthesis stay open past the end of this line? */
const subjectOpenPastLine = (line: string): boolean => {
  const at = line.indexOf("expect(");
  if (at === -1) return false;
  let depth = 0;
  for (let i = at + "expect".length; i < line.length; i += 1) {
    if (line[i] === "(") depth += 1;
    else if (line[i] === ")") {
      depth -= 1;
      if (depth === 0) return false;
    }
  }
  return true;
};

interface TripwireCensus {
  modules: number;
  occurrences: number;
  classified: number;
  multiLineStatements: number;
  multiLineStatementsQuoteAware: number;
  counterDisagreements: number;
  multiLineSubjects: number;
  barren: string[];
  pairs: string[];
}

/**
 * Every number the tripwire publishes, from ONE pass, parameterised by the module set and reader.
 *
 * Parameterised for the reason every other derivation in this file is: the premise case re-runs it
 * over the tree as it stood at round 3 and requires it to reproduce the review's published answer
 * before any new number is believed. A transcription that cannot reproduce the known answer is
 * measuring its own transcription errors.
 */
const tripwireCensus = (
  names: readonly string[],
  read: (n: string) => string,
): TripwireCensus => {
  const out: TripwireCensus = {
    modules: names.length,
    occurrences: 0,
    classified: 0,
    multiLineStatements: 0,
    multiLineStatementsQuoteAware: 0,
    counterDisagreements: 0,
    multiLineSubjects: 0,
    barren: [],
    pairs: [],
  };
  for (const n of names) {
    const src = read(n);
    out.occurrences += (src.match(/expect\(/g) ?? []).length;
    let own = 0;
    for (const line of src.split("\n")) {
      if (!isAssertionLine(line)) continue;
      own += 1;
      const naive = parenBalanceNaive(line) > 0;
      const aware = parenBalanceQuoteAware(line) > 0;
      if (naive) out.multiLineStatements += 1;
      if (aware) out.multiLineStatementsQuoteAware += 1;
      if (naive !== aware) out.counterDisagreements += 1;
      if (subjectOpenPastLine(line)) out.multiLineSubjects += 1;
    }
    if (own === 0) out.barren.push(n);
    out.classified += own;
    for (const p of duplicateAssertionPairsIn(src)) out.pairs.push(`${n}:${p}`);
  }
  return out;
};

/**
 * (Plan 29-39, WR-07) The census over the tree at a FIXED COMMIT, read through git rather than off
 * the working tree.
 *
 * ONE reader for both commit-pinned observations. It was inline in the round-3 premise case until
 * this plan added a second observation; two copies of a git reader is two places for a `git show`
 * failure to be swallowed differently, and this block already argues that case about parsers.
 */
const censusAtCommit = (rev: string): TripwireCensus => {
  const listed = spawnSync("git", ["ls-tree", "--name-only", `${rev}:scripts`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (listed.status !== 0) throw new Error(`git ls-tree failed for ${rev}`);
  const names = (listed.stdout as string)
    .split("\n")
    .filter((n) => n.endsWith(".test.ts"))
    .sort();
  if (names.length === 0) throw new Error(`no test modules found at ${rev} — the premise is empty`);
  return tripwireCensus(names, (n) => {
    const r = spawnSync("git", ["show", `${rev}:scripts/${n}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) throw new Error(`git show failed for ${rev}:scripts/${n}`);
    return r.stdout as string;
  });
};

/**
 * (Plan 29-39, WR-07) THE ONE AUTHORITY for every volume relationship the census must satisfy.
 *
 * ONE function rather than a list of assertions in the live case, because the discrimination case
 * below has to decide the SAME question about a census that BROKE, and two implementations of one
 * predicate are how this phase spent four rounds discovering that its two answers disagreed. The
 * live case asserts this returns nothing; the discrimination case asserts it returns exactly the
 * right finding for each measured mutation. Neither can drift from the other.
 *
 * Returns one string per violated relationship, named by id so a red says which one broke.
 */
const censusRelationshipFindings = (c: TripwireCensus): string[] => {
  const out: string[] = [];
  if (!(c.occurrences >= c.classified)) {
    out.push(
      `R1 occurrences (${c.occurrences}) fell below classified lines (${c.classified}) — the classifier and the independently written occurrence counter have come apart`,
    );
  }
  if (!(c.classified >= c.modules * TRIPWIRE_CLASSIFIED_FLOOR_PER_MODULE)) {
    out.push(
      `R2 classified lines (${c.classified}) fell below ${TRIPWIRE_CLASSIFIED_FLOOR_PER_MODULE} per scanned module (${c.modules} modules) — the classifier has gone blind or near-blind`,
    );
  }
  if (!(c.classified > c.multiLineStatements)) {
    out.push(
      `R3 classified lines (${c.classified}) did not exceed continuing statements (${c.multiLineStatements}) — a counter answering TRUE for everything measures nothing`,
    );
  }
  if (!(c.multiLineStatements >= c.multiLineSubjects)) {
    out.push(
      `R4 continuing statements (${c.multiLineStatements}) fell below continuing SUBJECTS (${c.multiLineSubjects}), which are a subset of them — the naive paren counter has broken`,
    );
  }
  if (!(c.multiLineStatements * 100 >= c.classified * TRIPWIRE_MULTILINE_STATEMENT_FLOOR_PCT)) {
    out.push(
      `R5 the continuing-statement SHARE fell below ${TRIPWIRE_MULTILINE_STATEMENT_FLOOR_PCT}% (${c.multiLineStatements} of ${c.classified}) — the classifier has lost the MULTI-LINE class`,
    );
  }
  if (!(c.multiLineSubjects * 100 >= c.classified * TRIPWIRE_MULTILINE_SUBJECT_FLOOR_PCT)) {
    out.push(
      `R6 the continuing-SUBJECT share fell below ${TRIPWIRE_MULTILINE_SUBJECT_FLOOR_PCT}% (${c.multiLineSubjects} of ${c.classified}) — the subject counter has broken or the class has been lost`,
    );
  }
  if (!(c.counterDisagreements * 100 <= c.classified * TRIPWIRE_COUNTER_DISAGREEMENT_CEILING_PCT)) {
    out.push(
      `R7 the two paren counters disagree about more than ${TRIPWIRE_COUNTER_DISAGREEMENT_CEILING_PCT}% of classified lines (${c.counterDisagreements} of ${c.classified}) — one of them has broken`,
    );
  }
  // I1 IS AN IDENTITY AND IS EXPECTED NEVER TO FIRE. It is evaluated here, rather than asserted in
  // prose, so the discrimination case can MEASURE that it never fires across every mutation — the
  // difference between recording that a number has no witness (D-08) and claiming it.
  if (
    !(
      Math.abs(c.multiLineStatements - c.multiLineStatementsQuoteAware) <=
      c.counterDisagreements
    )
  ) {
    out.push(
      `I1 |naive - quote-aware| exceeded the disagreement count — IMPOSSIBLE by the triangle inequality; if this ever fires the census itself is not computing what it claims`,
    );
  }
  return out;
};

/**
 * THE FOUR PUBLISHED NUMBERS, MEASURED IN PLAN 29-29'S SESSION over the live tree — after this
 * block's own cases were written, because the first draft of the old snapshot was taken BEFORE the
 * block was appended and its own assertion lines then falsified it.
 *
 * Round 3's review measured, over the tree at `0ec8b61`: 47 modules, 4806 `expect(` occurrences,
 * 4751 classified lines. The premise case below reproduces all three EXACTLY from that commit. The
 * live numbers are higher because round 3's six plans and this one added assertions; the delta is
 * accounted for in 29-29-SUMMARY.md rather than left as an unexplained movement.
 */
// (Plan 29-33) RE-MEASURED, not adjusted-until-green. Plan 29-33 added three SEC_VOICE cases to
// this module — the roster pin, the derived-property floor and the substitution arm — so all six
// live numbers moved together and by an accounted amount: occurrences 5353 -> 5391 (+38), classified
// 5281 -> 5319 (+38, the same 38 lines, so every added assertion is a classified line and none is a
// second occurrence on a line already counted), statement-level multi-line 1069 -> 1084 (+15),
// NOTE TO A LATER EDITOR: this paragraph must not spell the scanned token literally. The census
// counts raw occurrences over these very bytes, so a comment naming it becomes one — measured here,
// which is why this note exists rather than a rounder number.
// quote-aware 1063 -> 1078 (+15, the SAME delta, so the two counters did not diverge on the new
// text), disagreements 14 -> 14 (UNCHANGED — no added line is one the two paren counters read
// differently), subject-only 577 -> 589 (+12). The round-3 figures below are UNTOUCHED: they are
// reproduced from `0ec8b61` by the premise case and are not a baseline this plan may move.
//
// (Plan 29-34) RE-MEASURED AGAIN, from the live tree, for the same reason. This plan added the line
// accounting cases to voice-model.test.ts and seven cases here, so all six moved together:
// occurrences 5391 -> 5453 (+62), classified 5319 -> 5380 (+61), statement-level multi-line
// 1084 -> 1103 (+19), quote-aware 1078 -> 1097 (+19, the SAME delta, so the two counters still do
// not diverge on the new text), disagreements 14 -> 14 (UNCHANGED — no added line is one the two
// paren counters read differently), subject-only 589 -> 604 (+15).
//
// THE ONE-LINE GAP BETWEEN +62 AND +61 IS ACCOUNTED FOR, NOT ROUNDED PAST. Occurrences are raw
// matches anywhere in the bytes while classified lines must BEGIN with the token, and one added
// COMMENT in voice-model.test.ts quotes the retired vacuous assertion verbatim in order to explain
// what was wrong with it. That comment is an occurrence and is not a classified line — the same
// census-counts-its-own-prose effect the note directly above records, arriving this time from the
// other module.
// (Plan 29-35) RE-MEASURED AGAIN, from the live tree, never adjusted-until-green. This plan added
// one case-level assertion here (`generate-catalog.ts`'s own imported-symbol pin), six to
// frontmatter.test.ts (the IN-05 allow-list and its two discrimination plants, the context-io
// stronger-property control, the generate-catalog two-sided pin, and the edge-set non-vacuity plus
// the seed-membership statement) and three to generate-catalog.test.ts (the import-closure floor and
// the two exit-code attribution assertions), and removed one — the IN-05 module-level import test
// that the locator unification made wrong. Its second task added three more here: the sibling
// generator's imported-symbol pin, and the two vacuity floors the now-EMPTY floor-item-1 answer
// requires (the module corpus and the classified line count). Its third task added twenty-six across
// the two generator test files: the four permanent section-extent cases, thirteen assertions each in
// generate-role-adapters.test.ts and generate-catalog.test.ts. NET +39, and all six numbers moved
// together, MEASURED AT EACH TASK BOUNDARY:
// occurrences 5453 -> 5463 -> 5466 -> 5492 (+39), classified 5380 -> 5390 -> 5393 -> 5419 (+39 —
// THE SAME DELTA at every boundary, so every added assertion is a classified line, none is a second
// raw match on a line already counted, and no comment added by this plan spells the scanned token),
// statement-level multi-line 1103 -> 1111 -> 1114 -> 1123 (+20), quote-aware
// 1097 -> 1105 -> 1108 -> 1117 (+20, the SAME delta at every boundary, so the two paren counters
// still do not diverge on the new text), disagreements 14 -> 14 (UNCHANGED), subject-only
// 604 -> 613 -> 616 -> 621 (+17).
//
// THE +17 / +20 / +39 SPREAD IS ACCOUNTED FOR, NOT ROUNDED PAST, AND THE THREE COUNTERS ARE ASKING
// THREE DIFFERENT QUESTIONS OF ONE SET OF LINES. Twenty-one of the thirty-nine added assertions are
// written on a single line (`status).toBe(0)`, a cell equality, a `not.toContain`), so they leave no
// paren open and the statement-level counters move by twenty rather than by thirty-nine. The
// subject-only counter asks whether the assertion's SUBJECT runs past its own line, which is true of
// seventeen — the spelling that opens with a bare call and puts the subject on the NEXT line — and
// false of the spelling that names the subject inline and opens its paren on the matcher instead.
// What would be a finding is the two PAREN counters disagreeing with EACH OTHER, and they do not, at
// any of the three boundaries.
//
// (AND THE SENTENCE ABOVE IS SPELLED THAT WAY ON PURPOSE. The first draft named the scanned token
// literally, twice, to describe the two spellings — and the census counts raw occurrences over these
// very bytes, so those two comment words became two occurrences that are not classified lines and
// broke the SAME-DELTA property this note relies on. Measured, +2/+0, which is exactly why the older
// note directly below this block exists. The words were removed rather than the delta explained.)
//
// (Plan 29-36) RE-MEASURED AT TASK 1'S BOUNDARY, from the live tree, by running the census and
// reading its answer out — never incremented by hand. This plan's first task narrowed the `-1`
// contract classifier in frontmatter.test.ts: it MERGED the two per-bucket assertions of the
// two-plant discrimination case into one sorted verdict TRIPLE (-2), added a premise assertion that
// all three planted modules really produced a site (+1), and added a case asserting BOTH arms of the
// new exit test are reached over the live tree (+2). NET +2, and every live counter moved by the
// SAME +2:
// occurrences 5492 -> 5494, classified 5419 -> 5421, statement-level multi-line 1123 -> 1125,
// quote-aware 1117 -> 1119 (the SAME delta, so the two paren counters did not diverge),
// subject-only 621 -> 623, disagreements 14 -> 14 (UNCHANGED), modules 47 (UNCHANGED).
//
// A UNIFORM DELTA IS ITSELF THE EVIDENCE HERE, and it is available because all four added and both
// removed assertions are written in the same multi-line spelling: the statement-level and
// subject-only counters therefore see exactly the population the raw count does, and the two removed
// assertions cancel two of the four added ones on every counter at once. What would be a finding is
// the two paren counters disagreeing with each other, and they do not.
//
// TASK 2'S BOUNDARY, RE-MEASURED THE SAME WAY. Task 2 restated `REACH.I5` in
// section-locator-oracle.test.ts and added SIXTEEN assertions there: five in the corpus-shape case
// (the 360/360 partition and the two equalities tying the corpus-shape number to the reach floor)
// and eleven in the new narrowing-hazard case (the non-vacuity floor, the containment, the four
// delta numbers, the two "cannot break it" / "does break it" attributions, and the probe-set
// equality). NET +16, and again the SAME delta on both raw counters:
// occurrences 5494 -> 5510, classified 5421 -> 5437, statement-level multi-line 1125 -> 1134,
// quote-aware 1119 -> 1128 (the SAME delta), subject-only 623 -> 631, disagreements 14 -> 14
// (UNCHANGED), modules 47 (UNCHANGED).
//
// THE +8 / +9 / +16 SPREAD IS ACCOUNTED FOR. Seven of the sixteen are written on a single line (a
// bare count against a literal), so the statement-level counters move by nine rather than sixteen.
// Of those nine, one names a short subject inline and opens its paren on the matcher, so the
// subject-only counter moves by eight. The two paren counters agree at both boundaries, which is
// the property that would be a finding if it broke.
// (Plan 29-37) RE-MEASURED AT THIS PLAN'S BOUNDARY, from the live tree, by running the census and
// reading its answer out. This plan added the WR-02 witness cases and the probe edges to
// scripts/audit-model.test.ts and touched no other test module:
// occurrences 5510 -> 5589 (+79), classified 5437 -> 5516 (+79 — the SAME delta, so every added
// assertion opens its own classified line and none of them landed inside a string), statement-level
// multi-line 1134 -> 1146 (+12), quote-aware 1128 -> 1139 (+11), subject-only 631 -> 636 (+5),
// modules 47 (UNCHANGED — no test file was added).
//
// THIS NOTE DELIBERATELY DOES NOT SPELL THE COUNTED TOKEN. The occurrence counter matches it
// ANYWHERE in a test source, comments included, so a note that quotes the line it is explaining
// moves the number it is explaining. Measured while writing this paragraph: an earlier draft naming
// the line verbatim pushed occurrences to 5591 while classified stayed at 5516, breaking the
// same-delta property for no reason but its own prose. The line is therefore named by its subject.
//
// THE TWO PAREN COUNTERS DIVERGE BY ONE AT THIS BOUNDARY, +12 against +11, and that is reported
// rather than smoothed. The note above says a divergence is what would be a finding; this one is
// accounted for down to the single line that causes it, so it is an instance of the error class the
// disagreement counter EXISTS to publish rather than an unexplained movement. The line is the one
// in scripts/audit-model.test.ts that counts `fencedLineFlags(` call sites inside `readRegistry`'s
// compiled body: its subject splits on a string containing an unbalanced `(`, so the naive counter
// reads the statement as continuing past the line and the quote-aware counter does not.
// `counterDisagreements` therefore moves 14 -> 15, which is the arithmetic of +12/+11 and not a
// second effect. The line was NOT reworded to make the numbers tidy: rewording would delete a true
// instance of the measurement's own error from the measurement of that error, and this file's whole
// posture is the opposite.
// (Plan 29-38) RE-MEASURED AT THIS PLAN'S BOUNDARY, the same way: the census was run against the
// live tree and its answer read out, never adjusted until the case went green. This plan added the
// two `wp04` pin members, the premise assertions, the two extra mutations and the control mutation
// to scripts/check-imperative-lexicon.test.ts and touched no other test module:
// occurrences 5589 -> 5600 (+11), classified 5516 -> 5527 (+11 — the SAME delta again, so every
// added assertion opens its own classified line and none landed inside a string), statement-level
// multi-line 1146 -> 1153 (+7), quote-aware 1139 -> 1146 (+7), subject-only 636 -> 641 (+5),
// modules 47 (UNCHANGED — no test file was added), disagreements 15 (UNCHANGED — the two paren
// counters moved together this time, so this boundary adds no new instance of the measurement's own
// error).
//
// THE +11 WAS DERIVED INDEPENDENTLY OF THE CENSUS BEFORE THESE LITERALS WERE TOUCHED, twice, because
// a counter re-read from the loop that moved it can only ever agree with itself and this file's own
// posture forbids that: the occurrence token was counted over the plan's DIFF (13 added, 2 removed,
// net +11) and over the WHOLE FILE at `HEAD` versus the working tree (252 -> 263, +11). Three
// derivations, one number. A count re-read from the census alone would be the number bumped until
// the red stopped, which is the reflex this repository writes refusals against.
//
// ═════════════════════════════════════════════════════════════════════════════════════════════
// (PLAN 29-39, WR-07) AND THE SIX PARAGRAPHS ABOVE ARE THE EVIDENCE FOR THIS ONE: SIX EXACT
// VOLUME PINS OVER A GROWING CORPUS WERE THE WRONG SHAPE, AND THE LEDGER OF RE-MEASUREMENTS IS
// WHAT PROVES IT. Every plan of round 4 that added an assertion anywhere in `scripts/*.test.ts`
// had to come here and move numbers it had no interest in. That is not diligence being rewarded;
// it is a pin firing on every unrelated commit, and the only way to clear such a red is to bump
// the number — the exact reflex this same round writes refusals against two modules over
// (`check-banned-claims.ts`: "Do NOT widen the pin until it stops firing";
// `check-audit-register.ts`: "LOWERING a count or NARROWING the arm are the two ways to clear this
// finding by deleting what it measures"). A number a maintainer clears without reading is worse
// than no number, because it still reads as evidence.
//
// WHAT MOVES ON AN UNRELATED EDIT — MEASURED IN PLAN 29-39'S SESSION on scratch copies of the
// whole module set, not taken from the review, which said "three of them" and is wrong in both
// directions:
//
//   * one ordinary SINGLE-LINE assertion added to one module moves TWO — occurrences 5600 -> 5601,
//     classified 5527 -> 5528. The other five hold still.
//   * one ordinary MULTI-LINE assertion moves FIVE — those two, plus statement-level 1153 -> 1154,
//     quote-aware 1146 -> 1147, subject-only 641 -> 642.
//   * one added test FILE carrying one assertion moves THREE — modules 47 -> 48 and the same two.
//   * one added test file carrying NO assertion moves ONLY modules, and lands in `barren`.
//
// So five of the seven move on an unrelated assertion. Those five are converted to relationships
// and corpus-derived floors below. The two that do not — the module count and the barren check —
// stay EXACT, and stay exact deliberately: they are THE VACUITY FLOOR. They answer "did the scan
// run at all", and a scan that read no modules, or that read a module and classified nothing in
// it, is a BROKEN MEASUREMENT rather than a grown corpus. A module count is also the one number
// here whose movement is a structural event worth a human read: test modules are added a handful
// of times a year, assertions a handful of times a day.
//
// THE COST, STATED RATHER THAN LEFT TO BE INFERRED — what each surviving pin fires on, and what it
// deliberately does not:
//
//   | pin | fires on | deliberately does NOT fire on |
//   |---|---|---|
//   | modules (exact) | a test module added, removed or renamed out of the scan | anything inside a module |
//   | barren (exact) | any scanned module contributing zero classified lines | a module contributing few |
//   | R1 occurrences >= classified | the occurrence counter or the classifier breaking apart | either of them growing |
//   | R2 classified >= modules x floor | the classifier going blind or near-blind | assertions being added |
//   | R3 classified > statements | the statement counter classifying everything | either growing |
//   | R4 statements >= subjects | the naive paren counter breaking | either growing |
//   | R5 statement SHARE floor | the classifier losing the multi-line CLASS | single-line assertions being added |
//   | R6 subject SHARE floor | the subject counter breaking, or the class being lost | assertions being added |
//   | R7 disagreement SHARE ceiling | either paren counter breaking against the other | one odd line disagreeing |
//
// NONE of the nine fires on an added assertion, an added test file with content, or a plan that
// writes twenty assertions across three modules. ALL of them were proven to fire on the break they
// exist for — the mutation table is in 29-39-SUMMARY.md and every row was run, not argued.
//
// THE FLOORS ARE RATES, NOT MAGIC CONSTANTS, which is the whole difference between a floor that
// keeps meaning something as the corpus grows and a floor that has to be bumped. Each is a
// proportion of a denominator the classifier does not produce, so the FLOOR ITSELF grows with the
// corpus. Measured headroom at this plan's boundary: 117.6 classified lines per module against a
// floor of 20; a 20.86% statement share against a floor of 5%; an 11.60% subject share against a
// floor of 2%; a 0.271% disagreement share against a ceiling of 1%.
//
// WHERE THE EXACT NUMBERS WENT, AND WHY THAT IS D-25 RATHER THAN A DELETION. An exact number is
// legitimate where it is a measurement that FAILS CLOSED and CANNOT DRIFT. A live census over a
// growing corpus is neither. A census over a FIXED COMMIT is both — so the seven exact figures are
// not deleted, they are relocated to `PLAN_29_39_TRIPWIRE` below and asserted against the tree at
// `b76a65e`, where nothing any later plan writes can move them. They were not re-derived on the way:
// the census run over `b76a65e` by git returns exactly the seven values that were pinned live, which
// is why this is a MOVE and not a re-measurement.
//
// AND THE RELOCATION DISSOLVES A HAZARD THIS BLOCK CARRIED THREE SEPARATE WARNINGS ABOUT. The notes
// above tell a later editor not to spell the scanned token in prose, because the census counted raw
// occurrences over these very bytes and a comment naming the token became one — an effect measured
// twice, in plans 29-35 and 29-37, each time breaking a same-delta property for no reason but its
// own prose. A census pinned against a fixed commit reads git blobs, so no byte written here after
// `b76a65e` can reach it. The three warnings are kept as the record of why the exact pins moved;
// the hazard they warn about no longer has a live pin to damage.
// ═════════════════════════════════════════════════════════════════════════════════════════════

/**
 * THE VACUITY FLOOR, and the one exact volume equality left over the LIVE tree.
 *
 * 47 → 49 (plan 29.1-01). Phase 29.1 added TWO test modules — `adapter-byte-baseline.test.ts` (the
 * commit-pinned MODEL-01 byte baseline) and `model-tiers.test.ts` (the model resolver's oracle).
 * Re-derived rather than incremented: `ls scripts/*.test.ts | wc -l` reported 49 on that tree, which
 * is the same number the live census produces, so the two independent counts agree.
 *
 * 49 → 50 (plan 29.1-05). ONE test module added — `model-dial-consistency.test.ts`, the cross-surface
 * oracle for the model dial's prose (D-13/MODEL-06). Re-derived the same way rather than incremented:
 * `ls scripts/*.test.ts | wc -l` reports 50 on this tree, agreeing with the live census. This pin
 * firing is the tripwire working as designed — a module joining the scan is a structural event, and
 * the number moves in the SAME commit that adds the module rather than in a later repair.
 *
 * The FROZEN `PLAN_29_39_TRIPWIRE.modules` below stays at 47 and must not be touched — it describes
 * the tree at `b76a65e`, which cannot change.
 */
const TRIPWIRE_MODULES = 50;
/**
 * Corpus-derived floors, expressed as RATES so the floor grows with the corpus it floors.
 * Each is set well below its measured live value: the point is to catch a measurement that
 * COLLAPSED, never to track one that moved.
 */
const TRIPWIRE_CLASSIFIED_FLOOR_PER_MODULE = 20;
const TRIPWIRE_MULTILINE_STATEMENT_FLOOR_PCT = 5;
const TRIPWIRE_MULTILINE_SUBJECT_FLOOR_PCT = 2;
const TRIPWIRE_COUNTER_DISAGREEMENT_CEILING_PCT = 1;
/** Round 3's own published figures, reproduced from `0ec8b61` by the premise case. */
const ROUND_3_TRIPWIRE = {
  modules: 47,
  occurrences: 4806,
  classified: 4751,
  multiLineStatements: 919,
  multiLineSubjects: 473,
} as const;
/**
 * (Plan 29-39, WR-07) THE EXACT VOLUMES, RELOCATED — measured 2026-08-16 over the tree at
 * `b76a65e`, the commit this plan started from, and asserted against that commit rather than
 * against the live tree. This is the D-25 shape: the figures cannot drift, because the tree they
 * describe cannot change. The four values round 3's own record does not carry — the quote-aware
 * counter, the disagreement count and the two later-added measures — are recorded here for the
 * first time at a fixed commit, so a future reader can reconstruct the corpus's growth from two
 * dated observations rather than from a comment ledger.
 */
const PLAN_29_39_TRIPWIRE = {
  commit: "b76a65e",
  modules: 47,
  occurrences: 5600,
  classified: 5527,
  multiLineStatements: 1153,
  multiLineStatementsQuoteAware: 1146,
  counterDisagreements: 15,
  multiLineSubjects: 641,
} as const;

describe("the harness asserts no less than its names claim (plan 29-25, WR-05 / WR-06 / WR-07)", () => {
  it("NO test module carries two adjacent byte-identical assertions — derived, floored per file, two-sided", () => {
    // ── THE PREMISE, BEFORE THE CLAIM. ───────────────────────────────────────────────────────
    const names = testModules();
    expect(
      names.length,
      "the test-module corpus must really have been enumerated before anything is claimed about its contents",
    ).toBeGreaterThan(30);
    expect(names).toContain("check-foundation-guards.test.ts");
    expect(names).toContain("voice-model.test.ts");

    let assertions = 0;
    const pairs: string[] = [];
    const barren: string[] = [];
    for (const n of names) {
      const src = readFileSync(join(ROOT, "scripts", n), "utf8");
      const own = src.split("\n").filter(isAssertionLine).length;
      if (own === 0) barren.push(n);
      assertions += own;
      for (const p of duplicateAssertionPairsIn(src)) pairs.push(`${n}:${p}`);
    }
    // The TOTAL floor, and then the PER-ELEMENT floor beside it — because a total can stay healthy
    // while individual files silently classify nothing.
    expect(
      assertions,
      "the scan classified no assertion lines at all — a zero-duplicates verdict over nothing proves nothing",
    ).toBeGreaterThan(1000);
    expect(
      barren,
      "every scanned test module must contribute at least one classified assertion line, or the scan is SHORT rather than clean",
    ).toEqual([]);

    // ── THE CLAIM. ───────────────────────────────────────────────────────────────────────────
    expect(
      pairs,
      "two adjacent byte-identical assertions assert one thing twice, and the comment above them almost always claims two. Fix the assertion; do not narrow this classifier to exclude it",
    ).toEqual([]);
  });

  it("the tripwire is FALSIFIABLE — a planted duplicate pair is found, and a near-miss is not", () => {
    // Proven on a synthesized source, permanently, because the live answer is the empty set and an
    // empty answer from a classifier that matches nothing is indistinguishable from an empty answer
    // from a classifier that works.
    expect(duplicateAssertionPairsIn(PLANTED_DUPLICATE_SOURCE)).toEqual([
      `2 :: ${EXPECT_CALL}`,
    ]);

    // THE DISCRIMINATION, BOTH WAYS. A pair separated by one line is NOT reported — the disclosed
    // blindness, asserted so it is a measured bound rather than a claim; and a pair differing by one
    // character is not reported either, so the comparison really is byte equality.
    const separated = PLANTED_DUPLICATE_SOURCE.split("\n");
    separated.splice(2, 0, "  // an intervening comment");
    expect(duplicateAssertionPairsIn(separated.join("\n"))).toEqual([]);
    const differing = PLANTED_DUPLICATE_SOURCE.split("\n");
    differing[2] = differing[2].replace("twice", "once");
    expect(differing[1].trim()).not.toBe(differing[2].trim());
    expect(duplicateAssertionPairsIn(differing.join("\n"))).toEqual([]);
  });

  it('"within one test body" follows from ADJACENCY — a test boundary is never a classified assertion line', () => {
    // The argument the scan rests on, asserted rather than stated. If a boundary line could be
    // classified as an assertion, two adjacent classified lines could straddle two cases and the
    // tripwire would report a pair that is not one.
    for (const boundary of [
      "});",
      "  });",
      'it("a case", () => {',
      'describe("a block", () => {',
      "  const src = readFileSync(p);",
      "  // expect(o).toContain(x);",
    ]) {
      expect(
        isAssertionLine(boundary),
        `a test-boundary line must never classify as an assertion: ${boundary}`,
      ).toBe(false);
    }
    // …and a real assertion line does, at any indentation. Without this the negative above is
    // satisfied by a classifier that recognises nothing.
    expect(isAssertionLine('expect(o).toBe(1);')).toBe(true);
    expect(isAssertionLine('        expect(o).toBe(1);')).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // (PLAN 29-29, IN-03) THE PUBLISHED FIGURE AND THE ACTUAL COVERAGE ARE NOW THE SAME STATEMENT.
  // ═══════════════════════════════════════════════════════════════════════════════════════════

  it("the tripwire's PREMISE: the census reproduces round 3's published answer over round 3's tree", () => {
    // Variants E1 and E2 in docs/audit/29-locator-unification.md §6 already follow this discipline
    // and it is followed here for the same reason: a census that cannot reproduce a KNOWN answer is
    // measuring its own transcription errors, and every new number below rides on this one.
    const then = censusAtCommit("0ec8b61");
    expect(then.modules, "round 3 reported 47 test modules").toBe(ROUND_3_TRIPWIRE.modules);
    expect(then.occurrences, "round 3 reported 4806 `expect(` occurrences").toBe(
      ROUND_3_TRIPWIRE.occurrences,
    );
    expect(then.classified, "round 3 reported 4751 classified lines").toBe(
      ROUND_3_TRIPWIRE.classified,
    );
    // The multi-line halves are re-derived rather than reproduced: the review published 453 without
    // publishing the rule that produced it, and this census's SUBJECT-only rule answers 473 on the
    // same bytes. That 4% gap is recorded as a difference between two rules rather than smoothed
    // into a match — the review's number is not reproducible from what the review states.
    expect(then.multiLineSubjects, "the subject-only rule over round 3's tree").toBe(
      ROUND_3_TRIPWIRE.multiLineSubjects,
    );
    expect(then.multiLineStatements, "the statement-level rule over round 3's tree").toBe(
      ROUND_3_TRIPWIRE.multiLineStatements,
    );
    // And round 3's tree carried zero duplicate pairs too, so the live zero below is not this
    // plan's doing.
    expect(then.pairs, "round 3's tree carried no adjacent byte-identical pair either").toEqual([]);
  }, 60_000);

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // (PLAN 29-39, WR-07) THE EXACT VOLUMES, AND THE ONLY PLACE THEY ARE HONEST.
  // ═══════════════════════════════════════════════════════════════════════════════════════════

  it("the tripwire's EXACT VOLUMES are pinned against a FIXED COMMIT, where they cannot drift", () => {
    // (D-25) An exact number is legitimate where it is a measurement that FAILS CLOSED and CANNOT
    // DRIFT. These seven were pinned over the LIVE tree for four rounds, where they were neither:
    // every plan that added an assertion had to come here and move them, and a pin cleared by
    // bumping is a pin nobody reads. They are not deleted — deleting them would lose the corpus's
    // only dated record of its own size — they are pinned against `b76a65e` instead, which is the
    // tree plan 29-39 started from and a tree no later commit can change.
    const at = censusAtCommit(PLAN_29_39_TRIPWIRE.commit);
    expect(at.modules, "test modules at the pinned commit").toBe(PLAN_29_39_TRIPWIRE.modules);
    expect(at.occurrences, "raw occurrences of the scanned token at the pinned commit").toBe(
      PLAN_29_39_TRIPWIRE.occurrences,
    );
    expect(at.classified, "classified assertion lines at the pinned commit").toBe(
      PLAN_29_39_TRIPWIRE.classified,
    );
    expect(at.multiLineStatements, "the statement-level rule at the pinned commit").toBe(
      PLAN_29_39_TRIPWIRE.multiLineStatements,
    );
    expect(
      at.multiLineStatementsQuoteAware,
      "the same question asked by a counter that skips quoted regions, at the pinned commit",
    ).toBe(PLAN_29_39_TRIPWIRE.multiLineStatementsQuoteAware);
    expect(
      at.counterDisagreements,
      "classified lines the two paren counters DISAGREE about — the measured error of the measurement, at the pinned commit",
    ).toBe(PLAN_29_39_TRIPWIRE.counterDisagreements);
    expect(at.multiLineSubjects, "the narrower SUBJECT-only rule at the pinned commit").toBe(
      PLAN_29_39_TRIPWIRE.multiLineSubjects,
    );

    // THE TWO DATED OBSERVATIONS TOGETHER SAY WHAT ONE CANNOT: the corpus GREW between them, so
    // this pair is a growth record rather than two disconnected snapshots. If a later reader finds
    // these equal, the second observation was taken against the wrong tree.
    expect(
      at.classified,
      "the pinned commit must sit AFTER round 3's tree in corpus size, or the two observations are not measuring a growing corpus",
    ).toBeGreaterThan(ROUND_3_TRIPWIRE.classified);
    expect(
      censusRelationshipFindings(at),
      "every relationship the live census now asserts must also hold at the pinned commit — a relationship that fails on a known-good tree is a false red waiting to happen",
    ).toEqual([]);
  }, 120_000);

  // THE NAME CARRIES "tripwire" ON PURPOSE. This plan's stated acceptance command filters on that
  // word, and a central artifact the acceptance command does not run is an unexercised claim — the
  // shape round 4 raised as WR-03 one module over.
  it("the tripwire census reds on a BROKEN CLASSIFIER and NOT on an ADDED ASSERTION (plan 29-39, WR-07)", () => {
    // ═════════════════════════════════════════════════════════════════════════════════════════
    // THE WHOLE POINT OF WR-07, AS A CASE RATHER THAN AS A CLAIM. Two populations, one predicate.
    //
    // POPULATION 1 — CORPUS GROWTH, which must be QUIET. Run through the REAL census over the REAL
    // module set, with a reader that appends an assertion, so the growth is measured rather than
    // simulated by hand.
    //
    // POPULATION 2 — MEASUREMENT BREAKAGE, which must be LOUD. These are the censuses that seven
    // classifier and counter mutations ACTUALLY PRODUCED over the live tree in plan 29-39's
    // session, recorded here as data. They are transcribed measurements, not invented numbers, and
    // the SUMMARY carries the run that produced each row.
    // ═════════════════════════════════════════════════════════════════════════════════════════
    const names = testModules();
    const live = tripwireCensus(names, (n) => readFileSync(join(ROOT, "scripts", n), "utf8"));
    expect(
      censusRelationshipFindings(live),
      "the live tree must be clean before either population means anything",
    ).toEqual([]);

    // ── POPULATION 1: growth is quiet. ───────────────────────────────────────────────────────
    const singleLine = '\nit("g", () => {\n  ' + "expect" + '(1).toBe(1);\n});\n';
    const multiLine = '\nit("g", () => {\n  ' + "expect" + '(\n    1,\n    "r",\n  ).toBe(1);\n});\n';
    for (const [label, appended] of [
      ["one added SINGLE-LINE assertion", singleLine],
      ["one added MULTI-LINE assertion", multiLine],
      ["twenty added assertions", singleLine.repeat(20)],
    ] as const) {
      const grown = tripwireCensus(names, (n) => {
        const src = readFileSync(join(ROOT, "scripts", n), "utf8");
        return n === "voice-model.test.ts" ? src + appended : src;
      });
      expect(
        grown.classified,
        `${label}: the growth must actually have landed, or this row proves nothing`,
      ).toBeGreaterThan(live.classified);
      expect(
        censusRelationshipFindings(grown),
        `${label} must not red — a pin that fires on every unrelated commit is cleared by bumping it, which is the WR-07 defect`,
      ).toEqual([]);
    }

    // ── POPULATION 2: breakage is loud. ──────────────────────────────────────────────────────
    const broken: ReadonlyArray<readonly [string, TripwireCensus, string]> = [
      [
        "B1 classifier recognises NOTHING",
        { modules: 47, occurrences: 5600, classified: 0, multiLineStatements: 0, multiLineStatementsQuoteAware: 0, counterDisagreements: 0, multiLineSubjects: 0, barren: names, pairs: [] },
        "R2",
      ],
      [
        "B2 classifier recognises EVERY line",
        { modules: 47, occurrences: 5600, classified: 54993, multiLineStatements: 4934, multiLineStatementsQuoteAware: 4632, counterDisagreements: 388, multiLineSubjects: 649, barren: [], pairs: [] },
        "R1",
      ],
      [
        "B3 naive paren counter always 0",
        { modules: 47, occurrences: 5600, classified: 5527, multiLineStatements: 0, multiLineStatementsQuoteAware: 1146, counterDisagreements: 1146, multiLineSubjects: 641, barren: [], pairs: [] },
        "R4",
      ],
      [
        "B4 quote-aware paren counter always 0",
        { modules: 47, occurrences: 5600, classified: 5527, multiLineStatements: 1153, multiLineStatementsQuoteAware: 0, counterDisagreements: 1153, multiLineSubjects: 641, barren: [], pairs: [] },
        "R7",
      ],
      [
        "B5 subject counter always false",
        { modules: 47, occurrences: 5600, classified: 5527, multiLineStatements: 1153, multiLineStatementsQuoteAware: 1146, counterDisagreements: 15, multiLineSubjects: 0, barren: [], pairs: [] },
        "R6",
      ],
      [
        "B6 occurrence counter matches nothing",
        { modules: 47, occurrences: 0, classified: 5527, multiLineStatements: 1153, multiLineStatementsQuoteAware: 1146, counterDisagreements: 15, multiLineSubjects: 641, barren: [], pairs: [] },
        "R1",
      ],
      [
        "B7 classifier drops the MULTI-LINE class",
        { modules: 47, occurrences: 5600, classified: 4319, multiLineStatements: 15, multiLineStatementsQuoteAware: 8, counterDisagreements: 15, multiLineSubjects: 3, barren: [], pairs: [] },
        "R5",
      ],
    ];
    for (const [label, census, expectedId] of broken) {
      const found = censusRelationshipFindings(census);
      expect(
        found.length,
        `${label} must be caught — a conversion that survives its own mutation has deleted what it measured`,
      ).toBeGreaterThan(0);
      expect(
        found.map((f) => f.slice(0, 2)),
        `${label} must be caught by ${expectedId} specifically, so each relationship has a NAMED witness rather than the set having a collective one`,
      ).toContain(expectedId);
    }

    // ── EVERY RELATIONSHIP HAS ITS OWN WITNESS, and the identity provably has none. ───────────
    // (D-08) The set-level claim: R1 through R7 each fire on at least one row above. This is
    // derived from the rows rather than asserted alongside them, so a row deleted in a later edit
    // reduces the derived set and reds here instead of quietly leaving a relationship unwitnessed.
    const witnessed = new Set<string>();
    for (const [, census] of broken) {
      for (const f of censusRelationshipFindings(census)) witnessed.add(f.slice(0, 2));
    }
    expect(
      [...witnessed].sort(),
      "every relationship must be RED on at least one measured mutation, or it is prose wearing an assertion",
    ).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7"]);
    expect(
      witnessed.has("I1"),
      "I1 is an IDENTITY and must fire on NOTHING — it is true for every input by the triangle inequality, and this measured absence is the D-08 record that it has no witness, which is why R7 exists beside it",
    ).toBe(false);
  }, 60_000);

  // (Plan 29-39, WR-07) THE NAME CHANGED WITH THE ASSERTIONS. This case was called "four numbers,
  // each derived, each pinned two-sided" until the two-sided volume pins were converted to
  // relationships. A case name that survives the deletion of the thing it names is the
  // claim-wider-than-its-assertion class, which is the class this whole block exists to hold.
  it("the tripwire PUBLISHES its denominator — the vacuity floor EXACT, the volumes as relationships", () => {
    const names = testModules();
    const census = tripwireCensus(names, (n) =>
      readFileSync(join(ROOT, "scripts", n), "utf8"),
    );

    // ── THE VACUITY FLOOR, EXACT — the two values that do not move when the corpus grows. ────
    // (Plan 29-39, WR-07) These two answer "did the scan run at all". They are kept as equalities
    // for the reason the other five stopped being equalities: they do NOT fire on an added
    // assertion, and when they do fire the event is structural and worth a human read.
    expect(census.modules, "test modules scanned — EXACT on purpose: a module added, removed or renamed out of this scan is a structural event, not corpus growth").toBe(
      TRIPWIRE_MODULES,
    );

    // ── AND THE VOLUMES AS RELATIONSHIPS, so growth is quiet and BREAKAGE is loud. ────────────
    // (Plan 29-39, WR-07) Seven relationships, decided by the ONE authority above, each measured to
    // survive an added assertion and each proven RED under a mutation of the thing it measures. The
    // discrimination case below runs both populations; this line is the live verdict.
    expect(
      censusRelationshipFindings(census),
      "a volume relationship broke — this is the census reporting that one of its own counters is no longer measuring what it claims, and NOT a report that assertions were added",
    ).toEqual([]);

    // ── THE CLAIM, unchanged, and now standing on a published denominator. ───────────────────
    expect(census.barren, "every scanned module must contribute at least one classified line").toEqual(
      [],
    );
    expect(
      census.pairs,
      "two adjacent byte-identical assertions assert one thing twice, and the comment above them almost always claims two",
    ).toEqual([]);
  });

  it("a MULTI-LINE duplicate pair is MISSED — the intended verdict, asserted rather than left as an absence", () => {
    // (Plan 29-29) THE DECISION, AND IT IS A DECISION RATHER THAN AN OMISSION. Normalising a
    // multi-line `expect(` into one logical line before comparing is the fix IN-03 suggests, and it
    // is NOT shipped. The reason is measured, not asserted:
    //
    //   * deciding "do the parentheses balance" over source text needs a JavaScript tokenizer;
    //   * two independently written counters DISAGREE on 14 live classified lines, and the
    //     disagreement is pinned above rather than described;
    //   * the quote-aware one is itself wrong on a regex containing an escaped slash — under it three
    //     live assertions run to END OF FILE, which means a mis-tokenised assertion silently swallows
    //     every line below it. A normalising classifier therefore gets QUIETER the more regex-heavy a
    //     module is, which is the same shape as the window-measured-in-source-lines defect plan 29-32
    //     recorded;
    //   * and on the live tree normalisation reports the same answer the tripwire already reports —
    //     zero pairs — so it buys no measured coverage today while adding a second grammar over
    //     source text to the phase whose founding rule is one authority per predicate.
    //
    // So the pair is MISSED, and the miss is an ASSERTED INTENDED VERDICT with a published number
    // beside it rather than an absence a reader could mistake for coverage. That is the discipline
    // plan 29-31 applies to its own disclosed floor.
    expect(
      duplicateAssertionPairsIn(PLANTED_MULTILINE_DUPLICATE_SOURCE),
      "the multi-line pair is NOT reported — the disclosed residual, asserted so it is a measured bound rather than a claim",
    ).toEqual([]);

    // AND THE RESIDUAL IS NAMED MECHANICALLY, so "missed" is a property of the input rather than a
    // sentence: both openers ARE classified, they ARE byte-identical, and they are NOT adjacent.
    const lines = PLANTED_MULTILINE_DUPLICATE_SOURCE.split("\n");
    const openers = lines
      .map((l, i) => (isAssertionLine(l) ? i : -1))
      .filter((i) => i !== -1);
    expect(openers, "the plant must carry exactly two classified opener lines").toHaveLength(2);
    expect(lines[openers[0]].trim()).toBe(lines[openers[1]].trim());
    expect(
      openers[1] - openers[0],
      "…and they are four lines apart, which is why adjacency cannot see them",
    ).toBe(MULTILINE_EXPECT_CALL.length);
    expect(
      parenBalanceNaive(lines[openers[0]]),
      "the opener really is a multi-line statement by the same rule the census counts with",
    ).toBeGreaterThan(0);

    // THE CONTROL: the SAME duplicated assertion written on one line IS reported, so the miss is
    // about the multi-line spelling and not about the fixture.
    expect(duplicateAssertionPairsIn(PLANTED_DUPLICATE_SOURCE)).toEqual([
      `2 :: ${EXPECT_CALL}`,
    ]);
  });
});

// ---------------------------------------------------------------------------------------------
// (Plan 29.1-04) guard_model_assignment — the SECOND OPINION ON THE EMITTED MODEL VALUE.
//
// `npm run freshness:adapters` regenerates and byte-compares, so both of its sides come from one
// generator over one tree: it proves DETERMINISM. A generator that emitted a pinned tier for all 17
// roles, with the committed adapters updated in the same commit, passes it. This guard's independence
// is its INPUT — the committed adapter bytes on disk, which the generator's run does not touch — so
// every case below plants into those bytes (or into the derivation the expectation is recomputed
// from) and never into the generator.
//
// Every case asserts ITS PLANT'S OWN PREMISE through `admit()`, the same authority the guard reads,
// before asserting the guard's verdict. This repository's harness produced a false result in six
// instances across four straight rounds; a case whose plant did not take is a green that proves
// nothing.
// ---------------------------------------------------------------------------------------------

/** The `model` line of a mirrored adapter, replaced with the given text (which may be several lines). */
function plantAdapterModel(
  root: string,
  adapterFile: string,
  replacement: string[],
): string {
  const file = join(root, ".claude/agents", adapterFile);
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.findIndex((l) => l.startsWith("model:"));
  if (at === -1) {
    throw new Error(
      `plantAdapterModel: ${adapterFile} carries no \`model:\` line, so the plant matched nothing — ` +
        "a case 'proven' against an unmodified fixture is proven against nothing",
    );
  }
  lines.splice(at, 1, ...replacement);
  writeFileSync(file, lines.join("\n"), "utf8");
  return file;
}

/** Every `model` value an adapter's frontmatter declares, read through the guard's OWN authority. */
function admittedModelValues(file: string): string[] | { refused: string } {
  const parsed = admit(readFileSync(file, "utf8"));
  if (!parsed.ok) return { refused: parsed.code };
  return parsed.value.has("model")
    ? admittedValuesFor(parsed.value, "model")
    : [];
}

/** The `guard_model_assignment` section of a run's output, joined for substring assertions. */
function modelSection(o: string): string {
  return guardSection(o, "guard_model_assignment").join("\n");
}

describe("guard_model_assignment (Phase 29.1, MODEL-03/MODEL-05)", () => {
  it("passes on the REAL tree and publishes the DERIVATION SUMMARY, not a bare acknowledgement", () => {
    const r = runIn(ROOT);
    expect(r.status).toBe(0);
    const section = modelSection(out(r));
    expect(section, "the guard must emit a banner and a section").not.toBe("");
    expect(section).toContain(
      `${ROLE_COUNT} committed adapter(s) under .claude/agents compared against a resolution recomputed for ${ROLE_COUNT} derived role stem(s)`,
    );
    expect(section).toContain('preset "none"');
    expect(section).toContain("distinct aliases resolved: inherit");
  });

  it("two consecutive runs over the same tree produce BYTE-IDENTICAL stdout", () => {
    const first = runIn(ROOT).stdout;
    const second = runIn(ROOT).stdout;
    expect(first).toBe(second);
  });

  it("(a) MISMATCH — the finding names the adapter, the value FOUND and the value RESOLVED", () => {
    const m = mirror();
    const file = plantAdapterModel(m, "grugops-orchestrator.md", [
      "model: opus",
    ]);

    // THE PLANT'S OWN PREMISE, through the guard's own reader: the document really declares exactly
    // one `model` value and that value really is `opus`.
    expect(admittedModelValues(file)).toEqual(["opus"]);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(".claude/agents/grugops-orchestrator.md");
    expect(section).toContain("declares `model: opus`");
    expect(section).toContain("the configuration resolves `inherit`");
    expect(section).toContain('role stem "orchestrator"');
  });

  // ── THE FOUR VALUE-SHAPE WORDINGS, NAMED ONCE AND ASSERTED PAIRWISE DISTINCT. ───────────────
  //
  // Folding two of these findings into one sentence would be a silent regression: a later reader
  // could not tell WHICH defect fired, and the "one silence for two facts" mistake is the shape this
  // gate's own `name`-key precedent was written to avoid. So the distinctness is asserted directly
  // rather than left to the four cases below to imply.
  const MISMATCH_ANCHOR = "declares `model: ";
  const ABSENCE_ANCHOR = "carries NO `model` key at all";
  const CARDINALITY_ANCHOR = "a model pin has ONE authority and must have ONE answer";
  const EMPTINESS_ANCHOR = "`model` key present with an EMPTY value";
  const VALUE_SHAPE_ANCHORS = [
    MISMATCH_ANCHOR,
    ABSENCE_ANCHOR,
    CARDINALITY_ANCHOR,
    EMPTINESS_ANCHOR,
  ];

  it("the four value-shape findings are FOUR textually distinct sentences, none a substring of another", () => {
    expect(new Set(VALUE_SHAPE_ANCHORS).size).toBe(VALUE_SHAPE_ANCHORS.length);
    for (const a of VALUE_SHAPE_ANCHORS) {
      for (const b of VALUE_SHAPE_ANCHORS) {
        if (a === b) continue;
        expect(a.includes(b), `"${a}" must not contain "${b}"`).toBe(false);
      }
    }
    // …and all four really are present in the shipped guard, so a wording renamed in the source
    // without being renamed here fails LOUDLY instead of leaving four cases asserting dead strings.
    // The backtick escapes a template literal needs are removed first: the guard PRINTS a bare
    // backtick, and comparing against the escaped source would be comparing against a spelling no
    // reader of the output ever sees.
    const guardSrc = readFileSync(GUARD_JS, "utf8").split("\\`").join("`");
    for (const a of VALUE_SHAPE_ANCHORS) {
      expect(guardSrc, `the guard must still emit "${a}"`).toContain(a);
    }
  });

  it("(b) ABSENCE — the finding names absence as its OWN fact and is NOT the mismatch wording", () => {
    const m = mirror();
    const file = plantAdapterModel(m, "grugops-installer.md", []);

    // PREMISE, through the guard's own reader: the document still admits, and it declares NO
    // `model` value at all. A plant that made the file unreadable would red for a different reason.
    expect(admittedModelValues(file)).toEqual([]);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(".claude/agents/grugops-installer.md");
    expect(section).toContain(ABSENCE_ANCHOR);
    expect(section).not.toContain(MISMATCH_ANCHOR);
    expect(section).not.toContain(CARDINALITY_ANCHOR);
    expect(section).not.toContain(EMPTINESS_ANCHOR);
  });

  // ── (c) CARDINALITY, IN ITS TWO REACHABLE SPELLINGS. ────────────────────────────────────────
  //
  // MEASURED, not assumed: a genuinely DUPLICATED `model:` key does not reach the guard's
  // cardinality arm at all — `admit()` refuses the whole document under `duplicate-key` one layer
  // earlier, because the canonical form refuses a duplicate rather than merging it or resolving it
  // last-wins. The spelling that DOES reach the arm is the block sequence, which admits as one key
  // carrying two values. Both are proven, because the property under test is the same one either
  // way: the guard must never resolve two answers by reading the first.
  it("(c1) DUPLICATE KEY — refused at admission by name, and the first value is NOT read as the answer", () => {
    const m = mirror();
    const file = plantAdapterModel(m, "grugops-qe-e2e.md", [
      "model: inherit",
      "model: opus",
    ]);

    // PREMISE: the plant really does make the document unadmittable, under `duplicate-key`
    // specifically — and note the FIRST value is the CORRECT one, so a guard that read the first
    // would see agreement and print a pass over a document declaring two tiers.
    expect(admittedModelValues(file)).toEqual({ refused: "duplicate-key" });

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(".claude/agents/grugops-qe-e2e.md");
    expect(section).toContain("[duplicate-key]");
    expect(section).toContain("whose frontmatter is NOT in the canonical form");
    // The decoy did not work: no value comparison was rendered over this file.
    expect(section).not.toContain(MISMATCH_ANCHOR);
  });

  it("(c2) TWO VALUES — the finding names the COUNT and every value found, and does not read the first", () => {
    const m = mirror();
    const file = plantAdapterModel(m, "grugops-qe-e2e.md", [
      "model:",
      "  - inherit",
      "  - opus",
    ]);

    // PREMISE: this spelling really does admit, and it really does carry TWO values, the first of
    // which matches the resolution. Anything less and the case would be pinning a refusal.
    expect(admittedModelValues(file)).toEqual(["inherit", "opus"]);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(".claude/agents/grugops-qe-e2e.md");
    expect(section).toContain("declares 2 `model` values (`inherit`, `opus`)");
    expect(section).toContain(CARDINALITY_ANCHOR);
    expect(section).not.toContain(MISMATCH_ANCHOR);
    expect(section).not.toContain(ABSENCE_ANCHOR);
    expect(section).not.toContain(EMPTINESS_ANCHOR);
  });

  // ── (d) EMPTINESS, IN BOTH OF ITS LAYERS. ───────────────────────────────────────────────────
  //
  // (d1) is what happens on the tree as it stands: an emptied `model` value is refused at ADMISSION
  // under `dangling-empty-key`, so the defect is caught and named one layer above the comparison.
  // (d2) is why the guard's own emptiness sentence is kept anyway rather than deleted as dead: a
  // scratch build that WIDENS the admission grammar to admit an empty scalar — the exact future edit
  // the guard's header warns about — lets the value through, and the floor fires by name. A floor
  // proven only by the layer above it is a floor nobody has tested.
  it("(d1) EMPTY VALUE — refused at admission by name, and NOT reported as absence or as a mismatch", () => {
    const m = mirror();
    const file = plantAdapterModel(m, "grugops-release-manager.md", ["model:"]);

    expect(admittedModelValues(file)).toEqual({ refused: "dangling-empty-key" });

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(".claude/agents/grugops-release-manager.md");
    expect(section).toContain("[dangling-empty-key]");
    expect(section).not.toContain(ABSENCE_ANCHOR);
    expect(section).not.toContain(MISMATCH_ANCHOR);
  });

  it("(d2) EMPTY VALUE, admission WIDENED in a scratch build — the guard's own emptiness floor fires by name", () => {
    // The mutation is the widening itself: both `dangling-empty-key` refusals become an admitted
    // empty scalar. Nothing in the repository changes; the widened grammar lives in a temp dir.
    const widenEmptyValue = (src: string): string =>
      src
        .split("\n")
        .map((l) =>
          l.includes('return refuse("dangling-empty-key"')
            ? l.replace(
                /return refuse\("dangling-empty-key".*$/,
                'pendingItems = [""]; pendingQuoted = [false];',
              )
            : l,
        )
        .join("\n");
    const guardJs = scratchGuardFiles({
      "canonical-frontmatter.js": widenEmptyValue,
    });

    const m = mirror();
    plantAdapterModel(m, "grugops-release-manager.md", ["model:"]);

    const r = runScratch(guardJs, m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(".claude/agents/grugops-release-manager.md");
    expect(section).toContain(EMPTINESS_ANCHOR);
    expect(section).not.toContain(ABSENCE_ANCHOR);
    expect(section).not.toContain(MISMATCH_ANCHOR);
    // …and the widening really did take: the file no longer produces an admission refusal.
    expect(section).not.toContain("[dangling-empty-key]");
  });

  // ── (e) THE EIGHTEENTH ROLE, AND THE PROOF THAT THE DERIVATION IS WHAT FIRES IT. ────────────
  //
  // Half one: an eighteenth role arrives with no adapter, and the guard NAMES the stem. Half two:
  // the SAME plant, against a scratch build whose `resolveModels` returns a HAND-LISTED constant map
  // of exactly the seventeen committed stems — and the stem finding disappears, because a hand-listed
  // expectation can never mention a stem no author typed. That pair is the evidence for MODEL-05's
  // "derived rather than compared against a hand-listed expectation": the wording alone would be
  // satisfied by either build.
  //
  // BOTH HALVES ASSERT ON THE FINDING, NEVER ON THE EXIT CODE. An eighteenth role legitimately reds
  // guard_kit_counts and guard_referential_integrity in the same run, in both builds, so the exit
  // code cannot discriminate anything here — the same reasoning the `planted 18th role reaches
  // guard_role_size` case above records.
  const PLANTED_18TH = "zz-planted-model-role.md";
  const PLANTED_18TH_STEM = "zz-planted-model-role";

  it("(e1) an 18th role with no adapter — the guard NAMES the unassigned stem", () => {
    const m = mirror();
    cpSync(rolePath(ROOT, "installer.md"), rolePath(m, PLANTED_18TH));

    // PREMISE: the mirror's derived role set really grew by exactly this stem, and the live tree's
    // did not — the harness's own derivation is asserted, never assumed.
    expect(roleNamesIn(m)).toContain(PLANTED_18TH);
    expect(roleNamesIn(ROOT)).not.toContain(PLANTED_18TH);
    expect(roleNamesIn(m).length).toBe(ROLE_COUNT + 1);

    const section = modelSection(out(runIn(m)));
    expect(section).toContain(`role stem "${PLANTED_18TH_STEM}"`);
    expect(section).toContain("has NO committed adapter under .claude/agents");
    expect(section).toContain(
      `${ROLE_COUNT} committed adapter(s) under .claude/agents against ${ROLE_COUNT + 1} role stem(s)`,
    );
  });

  it("(e2) the SAME plant against a HAND-LISTED expectation — the stem finding does NOT fire", () => {
    // The hand-list is built from the live derivation rather than typed out, so this fixture cannot
    // rot into a stale seventeen-name literal. Its cardinality is asserted, because a silently short
    // list would make the case pass for the wrong reason.
    const committedStems = listRoles(ROOT).map((f) => f.replace(/\.md$/, ""));
    expect(committedStems).toHaveLength(ROLE_COUNT);
    expect(committedStems).not.toContain(PLANTED_18TH_STEM);
    const handListed = `new Map([${committedStems
      .map((s) => `["${s}", "inherit"]`)
      .join(", ")}])`;

    const guardJs = scratchGuardFiles({
      "model-tiers.js": (src) =>
        src.replace(
          "export function resolveModels(stems, options) {",
          `export function resolveModels(stems, options) {\n    return { ok: true, value: ${handListed} };`,
        ),
    });

    const m = mirror();
    cpSync(rolePath(ROOT, "installer.md"), rolePath(m, PLANTED_18TH));

    const section = modelSection(out(runScratch(guardJs, m)));
    // The count floor still fires — it reads the role derivation, which the mutation did not touch —
    // so the section is NOT silent, and the discrimination is precisely the stem-naming finding.
    expect(section).toContain(
      `${ROLE_COUNT} committed adapter(s) under .claude/agents against ${ROLE_COUNT + 1} role stem(s)`,
    );
    // (Plan 29.1-09) NARROWED FROM "the stem is never mentioned" TO "the RESOLUTION-DERIVED finding
    // does not fire", and the narrowing is a repair rather than a weakening.
    //
    // This case's claim has always been about ONE arm: the loop that iterates the RESOLUTION, which is
    // what makes the derivation load-bearing. The old assertion expressed that claim as "the planted
    // stem appears nowhere in the section", which was true only for as long as the resolution was the
    // sole arm capable of naming a stem. Plan 29.1-09 gave `tieredCorpusRefusals` a production
    // consumer, and that arm compares the tier table against the ROLE CORPUS — an authority the
    // `resolveModels` mutation does not touch — so it names the planted stem regardless. Asserting the
    // stem's total absence would now be asserting that the second arm is missing, which is a different
    // and unwanted claim. The assertion below therefore names the resolution arm's own sentence.
    expect(
      section,
      "a hand-listed expectation cannot name a stem no author typed — which is exactly why the guard must not have one",
    ).not.toContain(
      `role stem "${PLANTED_18TH_STEM}" resolves to`,
    );
    // …and the SECOND arm is asserted PRESENT on the same run, so the narrowing above cannot quietly
    // become a case that would pass over a guard with no stem-naming arm at all.
    expect(section).toContain(
      `the role stem "${PLANTED_18TH_STEM}" has NO entry in the TIERED preset table`,
    );
  });

  it("(f) VACUITY — an emptied adapter directory FAILS with its own sentence rather than passing", () => {
    const m = mirror();
    const dir = join(m, ".claude/agents");
    for (const f of readdirSync(dir)) rmSync(join(dir, f), { force: true });
    expect(readdirSync(dir)).toHaveLength(0);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      "the adapter derivation returned NO committed adapters under .claude/agents",
    );
    expect(section).toContain("this run compared zero model values");
    expect(section).not.toContain("PASS");
  });

  it("(g) SHORT SET — one adapter removed, its role file kept: both numbers AND the stem are named", () => {
    const m = mirror();
    rmSync(join(m, ".claude/agents/grugops-factory-coach.md"), { force: true });
    // PREMISE: the adapter is gone and the role file is NOT — a plant that removed both would move
    // the two numbers together and prove nothing about a SILENTLY SHORT set.
    expect(existsSync(join(m, ".claude/agents/grugops-factory-coach.md"))).toBe(false);
    expect(roleNamesIn(m)).toContain("factory-coach.md");

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      `${ROLE_COUNT - 1} committed adapter(s) under .claude/agents against ${ROLE_COUNT} role stem(s)`,
    );
    expect(section).toContain('role stem "factory-coach"');
    expect(section).toContain("has NO committed adapter under .claude/agents");
  });

  it("(h) UNREADABLE ADAPTER — named with its admission code, and NO value comparison over it", () => {
    const m = mirror();
    const file = plantAdapterModel(m, "grugops-security-nfr.md", [
      "model: !opus",
    ]);

    // PREMISE: the plant really is unadmittable, under a NAMED code.
    const verdict = admittedModelValues(file);
    expect(Array.isArray(verdict)).toBe(false);
    expect(verdict).toEqual({ refused: "node-property" });

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      ".claude/agents/grugops-security-nfr.md: [node-property]",
    );
    expect(section).toContain("whose frontmatter is NOT in the canonical form");
    expect(section).toContain(
      "the declared model value cannot be compared over a file that cannot be read",
    );
    // No verdict of any shape was rendered over the unreadable file.
    for (const anchor of VALUE_SHAPE_ANCHORS) {
      expect(section).not.toContain(anchor);
    }
  });

  // ── (i)/(j) THE EXPECTATION FOLLOWS THE CONFIGURATION, IN BOTH ITS DIRECTIONS. ──────────────
  //
  // These are the cases a byte-comparison structurally cannot have. (j) is the strongest single
  // statement in this block: with `"preset": "tiered"` planted in a mirror, seventeen adapters that
  // are byte-identical to the committed tree — and therefore perfectly FRESH — go red, because the
  // configuration now resolves a different value for every one of them.
  // (Plan 29.1-09, WR-07) THIS CASE USED TO PIN THE OPPOSITE OUTCOME. Until this plan it asserted
  // that a refused `models` block produced a WARN and let the build survive — and that advisory
  // channel was one of the three facts composing the round's fail-open: the guard advised, the
  // freshness mirror carried no configuration so the mirrored generator never saw the file, and the
  // workflow ran neither of the two processes that refuse. An illegal `models` block committed to a
  // mirror cleared BOTH continuous-integration gates at exit 0. The case is REPAIRED rather than
  // deleted, because its second half — that the expectation degraded to the lean default and not to
  // a pinned tier — is still true and is what proves the promotion did not change the degradation
  // TARGET (D-11).
  it("(i) a DEGENERATE `models` block FAILS the build and still degrades the expectation to `inherit` (D-11, WR-07)", () => {
    const m = mirror();
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: null }),
      "utf8",
    );

    const r = runIn(m);
    // THE PROMOTION: a refused configuration is a build failure, not an advisory line.
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain("could not be READ");
    expect(section).toContain("DEGRADES to `inherit` for every role stem (D-11)");
    expect(section).toContain("rather than to any pinned tier");
    // The refusal itself is carried, by name, rather than collapsed into "something went wrong".
    expect(section).toContain(
      "is null rather than a JSON object",
    );
    // ASSERTED ON THE ABSENCE OF THE PASS MARKER, not on the exit code alone: a guard printing a
    // FAIL line beside a PASS line for the same subject is a verdict a reader cannot act on, and the
    // exit code cannot tell the two arrangements apart.
    expect(section).not.toContain("  PASS  model assignment");
    // The degradation is announced in the run summary, so a reader cannot mistake a fallback run
    // for a run against their file.
    expect(section).toContain("degraded — the configuration was refused");
    // …and the comparison still ran against every adapter rather than being skipped.
    expect(section).toContain(
      `${ROLE_COUNT} committed adapter(s) under .claude/agents compared against a resolution recomputed for ${ROLE_COUNT} derived role stem(s)`,
    );
    // The degradation TARGET is unchanged: `inherit` for every stem, never a pinned tier.
    expect(section).toContain("distinct aliases resolved: inherit");
  });

  // (Plan 29.1-09, WR-07) THE COMPANION ARM. `guard_model_assignment` degrades on TWO branches — a
  // configuration it cannot READ, and one that reads cleanly and cannot be RESOLVED — and they are
  // mutually exclusive by construction, so no single input reaches both. That is exactly why they are
  // pinned as a PAIR: an arm-pair where one arm blocks and the other advises is the composition hole
  // this repository has spent rounds on, and a single-arm case cannot see it. The structural union
  // proof sits below as case (m).
  it("(i-resolve) a `models` block that READS cleanly but cannot be RESOLVED also FAILS the build (WR-07)", () => {
    const m = mirror();
    // An eighteenth role with no TIERED row, under `preset: tiered`: readModelsConfig succeeds
    // (`preset` is a legal name and there is no `roles` key to validate), and resolveModels refuses
    // at its per-stem coverage floor.
    writeFileSync(
      join(m, "agent-factory/roles/zz-planted-role.md"),
      readFileSync(join(m, "agent-factory/roles/orchestrator.md"), "utf8"),
      "utf8",
    );
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: { preset: "tiered" } }),
      "utf8",
    );

    // PREMISE, through the guard's own authorities: the configuration really READS, and the
    // resolution really REFUSES. Without this the case could pass off the read-refusal arm.
    const stems = listRoles(m).map((f) => f.replace(/\.md$/, ""));
    const cfg = readModelsConfig(m, stems);
    expect(cfg.ok, "the planted configuration must READ cleanly").toBe(true);
    if (!cfg.ok) throw new Error("unreachable");
    expect(resolveModels(stems, { preset: cfg.value.preset }).ok).toBe(false);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      "read cleanly but could not be RESOLVED against this tree's role stems",
    );
    expect(section).toContain("DEGRADES to `inherit` for every stem (D-11)");
    expect(section).toContain("rather than to any pinned tier");
    expect(section).toContain('the "tiered" preset assigns nothing to');
    expect(section).not.toContain("  PASS  model assignment");
    // …and this arm's degradation target is the lean default too, not the `tiered` table it failed
    // to apply. A promotion that changed what the expectation degrades TO would show up here.
    expect(section).toContain("distinct aliases resolved: inherit");
  });

  // (Plan 29.1-13, R2-IN-01) THE SLICER, HOISTED OUT OF CASE (m) SO BOTH PROPERTIES READ ONE BODY.
  //
  // Case `(m)` pins the advisory HELPER and case `(m-channel)` pins the advisory CHANNEL. They are
  // two properties of the SAME region of text, and a second slicer written for the second property
  // would be a second authority on "where does this function begin and end" — the duplicate-grammar
  // shape this repository has corrected repeatedly. So the slicer moves up here unchanged and both
  // cases call it.
  const sliceGuardBody = (src: string, decl: string): string => {
    const start = src.indexOf(decl);
    expect(start, `${decl} must be present`).toBeGreaterThan(-1);
    const rest = src.indexOf("\nfunction ", start + decl.length);
    return src.slice(start, rest === -1 ? src.length : rest);
  };
  // The prose in this function DISCUSSES `warn()` and the advisory write at length — that is the
  // record of why the promotion happened — so both probes run over the CODE lines only. Whole-line
  // comments are dropped and each case's premise proves the drop did not eat the body.
  const codeOfGuardBody = (body: string): string =>
    body
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");

  // BOTH TEXTS OF ONE FUNCTION: the source a human edits, and the committed twin that actually runs
  // on every host. A property asserted only of the `.ts` is a property of a file no host executes.
  const MODEL_GUARD_BODIES = [
    ["check-foundation-guards.ts", "function guardModelAssignment(): void {"],
    ["check-foundation-guards.js", "function guardModelAssignment() {"],
  ] as const;

  // (Plan 29.1-13, R2-IN-01) THE GUARD'S ADVISORY CHANNEL, SPELLED AS THE CHANNEL RATHER THAN AS ONE
  // OF ITS CALLERS. `warn()` at scripts/check-foundation-guards.ts:433 is a three-line wrapper around
  // this write; the write is what puts an advisory line on stdout without touching FAILS.
  const ADVISORY_WRITE = "process.stdout.write";
  // A fragment of the text the guard's own section header prints — stable across a reformat, and
  // NOT a line number, which moves on every edit above it.
  const MODEL_GUARD_HEADER_FRAGMENT = "[guard_model_assignment]";

  /**
   * Every advisory-channel write inside a sliced, comment-stripped guard body: the line that carries
   * it (so a failure can QUOTE the offender rather than print a bare count) and the 200 bytes that
   * follow it (so a multi-line call whose text sits on the next line can still be identified).
   */
  const MODEL_GUARD_WRITE_SITES = (
    code: string,
  ): { line: string; window: string }[] => {
    const sites: { line: string; window: string }[] = [];
    let at = code.indexOf(ADVISORY_WRITE);
    while (at !== -1) {
      const lineStart = code.lastIndexOf("\n", at) + 1;
      const lineEnd = code.indexOf("\n", at);
      sites.push({
        line: code
          .slice(lineStart, lineEnd === -1 ? code.length : lineEnd)
          .trim(),
        window: code.slice(at, at + 200),
      });
      at = code.indexOf(ADVISORY_WRITE, at + 1);
    }
    return sites;
  };

  // (Plan 29.1-09, WR-07) THE UNION, PROVEN STRUCTURALLY BECAUSE NO INPUT CAN REACH BOTH ARMS.
  //
  // The two degraded branches are the arms of one `if`/`else`, so "a mirror that produces both" does
  // not exist and the arm-pair cannot be tested by composing inputs. What CAN be tested is the
  // property a single-arm promotion would break: that this guard makes no call to the advisory
  // HELPER `warn()`. The assertion is DERIVED from the function's own text in both the source and the
  // committed twin that actually runs, rather than from a list of branches a later edit would not be
  // added to.
  //
  // (Plan 29.1-13, R2-IN-01) WHAT THIS CASE CLAIMS IS NARROWED TO WHAT IT PINS. It used to be recorded
  // as "this guard reaches for the advisory channel nowhere at all", which is wider than a probe for
  // `warn(`: the channel is `process.stdout.write`, and `warn()` is one SPELLING of it. Case
  // `(m-channel)` below forbids the channel; this case forbids the helper. Together they close the
  // property; this one alone forbade an identifier.
  it("(m) neither degraded branch reports through the advisory HELPER — guard_model_assignment makes NO warn() call", () => {
    for (const [rel, decl] of MODEL_GUARD_BODIES) {
      const code = codeOfGuardBody(
        sliceGuardBody(readFileSync(join(ROOT, "scripts", rel), "utf8"), decl),
      );
      // PREMISE: the slice really is the guard's body, the comment strip left the code behind, and
      // the probe is capable of seeing a call at all — it finds the guard's own closing `fail(`.
      expect(code, `${rel}: the sliced body must reach the stray-pin arm`).toContain(
        "nonAgentSurfaces",
      );
      expect(code, `${rel}: the probe must be able to see a call`).toContain(
        "fail(",
      );
      expect(
        code.includes("warn("),
        `${rel}: guard_model_assignment must make no warn() HELPER call — warn() is documented advisory and does NOT increment FAILS, so a degraded branch reported through it is a refusal that cannot fail a build. This case pins the HELPER, which is ONE SPELLING of the advisory channel; the channel itself is pinned by (m-channel)`,
      ).toBe(false);
    }
  });

  // (Plan 29.1-13, R2-IN-01) THE CHANNEL, NOT ONE SPELLING OF IT.
  //
  // WHAT THIS CASE BUYS OVER CASE (m). The guard's advisory channel is the direct
  // `process.stdout.write`; `warn()` is a three-line wrapper around it and therefore one spelling of
  // the channel, not the channel. `guardModelAssignment` ALREADY calls the channel directly, for its
  // section header — so a degraded branch rewritten as `process.stdout.write("  WARN  …")` would have
  // cleared case (m)'s `warn(` probe untouched while restoring exactly the fail-open plan 29.1-09
  // spent a task closing: an advisory line on stdout that never increments FAILS. The two cases
  // together forbid the channel; case (m) alone forbade an identifier.
  //
  // The write sites are DERIVED from the same sliced, comment-stripped body case (m) reads, in both
  // the source and the committed twin, and the ONE legitimate site is identified by a fragment of the
  // header text the guard prints — never by a line number, which moves on every edit above it.
  it("(m-channel) guard_model_assignment's ONLY advisory-channel write is its section header", () => {
    for (const [rel, decl] of MODEL_GUARD_BODIES) {
      const code = codeOfGuardBody(
        sliceGuardBody(readFileSync(join(ROOT, "scripts", rel), "utf8"), decl),
      );
      // PREMISE: the same three facts case (m) establishes — the slice is the guard's body, the
      // comment strip left the code behind, and the probe can see a call at all.
      expect(
        code,
        `${rel}: the sliced body must reach the stray-pin arm`,
      ).toContain("nonAgentSurfaces");
      expect(code, `${rel}: the probe must be able to see a call`).toContain(
        "fail(",
      );

      const sites = MODEL_GUARD_WRITE_SITES(code);
      expect(
        sites.length,
        `${rel}: guard_model_assignment must contain EXACTLY 1 ${ADVISORY_WRITE} call and this body contains ${sites.length}. The one legitimate write is the section header; every other write on this channel puts a line on stdout WITHOUT incrementing FAILS, which is a refusal that cannot fail a build. Offending lines:\n    ${sites.map((w) => w.line).join("\n    ")}`,
      ).toBe(1);
      expect(
        sites[0]?.window ?? "",
        `${rel}: the single ${ADVISORY_WRITE} call must be the section header — identified by the header fragment "${MODEL_GUARD_HEADER_FRAGMENT}" the guard prints, not by a line number. Found instead: ${sites[0]?.line ?? "<no site>"}`,
      ).toContain(MODEL_GUARD_HEADER_FRAGMENT);
    }
  });

  // (Plan 29.1-09, WR-08) THE VERDICT DESCRIBES THE RUN IT PERFORMED.
  //
  // `sourceLabel` used to be initialised to "neither standard location" and reassigned only inside
  // the success branch, so a degraded run whose configuration file EXISTS printed the phrase meaning
  // "there is no configuration anywhere". That is the conflation this module's own reader spends a
  // paragraph forbidding one level down — '"off" and "I typed something that cannot mean anything"
  // are different statements' — reproduced in the line that reports the outcome.
  it("(n) a degraded verdict never claims the configuration came from neither standard location", () => {
    const m = mirror();
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: null }),
      "utf8",
    );

    // PREMISE: the configuration file really is there, and the guard really did refuse it.
    expect(existsSync(join(m, ".grugops/factory.config.json"))).toBe(true);
    const section = modelSection(out(runIn(m)));
    expect(section).toContain("could not be READ");

    expect(
      section,
      "a run that refused a configuration file that exists must not report that there is no configuration anywhere",
    ).not.toContain("neither standard location");
  });

  // (Plan 29.1-09, IN-02) THE VERDICT LEAKS NO ABSOLUTE PATH.
  //
  // This guard's own header commits to byte-identical output for a given tree, which an absolute
  // path breaks across machines, and a developer home directory in a published continuous-integration
  // log is a disclosure this guard has no reason to make. Asserted by checking the verdict does not
  // contain the ROOT STRING — not by pattern-matching a path shape, which would pass on a root the
  // pattern happened not to describe.
  it("(o) the verdict names the configuration source relative to the repository root, never absolutely", () => {
    const m = mirror();
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: { preset: "none" } }),
      "utf8",
    );

    const r = runIn(m);
    expect(r.status).toBe(0);
    const section = modelSection(out(r));
    // PREMISE: the run really did read that file, so the assertion below is about a source the
    // verdict actually names rather than about a line it never printed.
    expect(section).toContain("from .grugops/factory.config.json");
    expect(
      section,
      "the model-assignment verdict must not contain the absolute repository root",
    ).not.toContain(m);

    // The same property on THIS repository, whose own configuration lives at the second standard
    // location — the run a contributor and continuous integration actually publish.
    const live = modelSection(out(runIn(ROOT)));
    expect(live).toContain(
      "from agent-factory/config/factory.config.json",
    );
    expect(live).not.toContain(ROOT);
  });

  // (Plan 29.1-09, IN-02) A REFUSAL REASON CARRIES NO ABSOLUTE PATH EITHER. The reasons are minted
  // one module down, where they interpolate the path they opened; promoting them from WARN to FAIL
  // moved them into the failing verdict, so the same commitment has to hold over them.
  it("(o-reason) a refusal reason reaches the finding with its path rendered repo-relative", () => {
    const m = mirror();
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: null }),
      "utf8",
    );

    const section = modelSection(out(runIn(m)));
    expect(section).toContain(
      "the `models` key in .grugops/factory.config.json is null",
    );
    expect(section).not.toContain(m);
  });

  // (Plan 29.1-12, R2-CR-01) THE VERDICT DESCRIBES THE RUN IT PERFORMED UNDER *EVERY* DOCUMENTED
  // INVOCATION SHAPE — NOT ONLY UNDER THE ONE THE SUITE HAPPENED TO PLANT.
  //
  // `relativeToRoot` compiled `ROOT` into a regex straight from the environment. With a RELATIVE
  // override the escaped pattern became "any period followed by non-whitespace, anywhere", so the
  // helper written to keep absolute paths OUT of a published verdict instead deleted bytes from a
  // real, correctly-resolved path: this gate exited 0 while its green PASS line named
  // `agent-factory/config/factoryconfig.json`, a file that has never existed.
  //
  // Asserted as a BYTE-IDENTITY of two live runs rather than as a search for the corrupted spelling.
  // A case that hunted one known-bad string would pass over the next corruption; equality is the
  // property the guard's own header commits to, and it fails on any rewrite in either direction.
  it("(o-rel) a RELATIVE CHECK_ROOT renders the same verdict as the default root — byte for byte", () => {
    const noOverride = { ...process.env };
    delete noOverride.CHECK_ROOT;
    const dflt = spawnSync("node", [GUARD_JS], {
      encoding: "utf8",
      cwd: ROOT,
      env: noOverride,
    });
    const rel = spawnSync("node", [GUARD_JS], {
      encoding: "utf8",
      cwd: ROOT,
      env: { ...noOverride, CHECK_ROOT: "." },
    });

    // PREMISE 1 — the rewrite was even ASKED. Two runs that both printed nothing are equal, and a
    // case asserting only equality would report that as a pass. Both outputs must carry the
    // model-assignment section before their equality means anything.
    const dfltSection = modelSection(out(dflt));
    const relSection = modelSection(out(rel));
    expect(
      dfltSection,
      "the default run must emit a model-assignment section",
    ).not.toBe("");
    expect(
      relSection,
      "the relative-override run must emit a model-assignment section",
    ).not.toBe("");

    // PREMISE 2 — the section names a configuration source that is ASSEMBLED from a real file. The
    // pre-fix build printed a plausible-looking path here; what makes it a defect is that the path
    // does not exist, so the case asserts existence rather than shape.
    const named = /preset "[^"]*" from ([^;]+);/.exec(dfltSection);
    expect(named, "the verdict must name a configuration source").not.toBe(null);
    const source = named![1];
    expect(
      existsSync(join(ROOT, source)),
      `the verdict names ${source}, which must exist under the repository root`,
    ).toBe(true);

    // THE PROPERTY.
    expect(dflt.status, "the default run must exit 0 on this repository").toBe(0);
    expect(rel.status, "the relative-override run must exit 0 too").toBe(0);
    expect(
      out(rel),
      "a relative CHECK_ROOT must produce output byte-identical to the default root — anything else is a verdict that describes the shape of the override string rather than the repository",
    ).toBe(out(dflt));
  });

  // (Plan 29.1-12, R2-CR-01) THE RED PATH IS RENDERED WITH THE SAME FIDELITY AS THE GREEN ONE.
  //
  // `relativeToRoot` is applied to `config.reason` and `resolution.reason` as well as to the verdict's
  // source label, so a corrupted refusal sends an operator to a file that was never opened — a worse
  // outcome than a corrupted PASS line, because the operator ACTS on it. The green-path case above
  // cannot see this: on this repository the configuration reads cleanly and no reason is minted.
  it("(o-rel-reason) a refusal reason under a RELATIVE CHECK_ROOT names the file it actually opened", () => {
    const m = mirror();
    mkdirSync(join(m, ".grugops"), { recursive: true });
    const planted = join(m, ".grugops/factory.config.json");
    writeFileSync(planted, JSON.stringify({ models: null }), "utf8");

    // PREMISE: the file the refusal will name really is on disk inside the mirror, and the run really
    // did REFUSE rather than pass. A case that asserted only the absence of a corrupted spelling would
    // report a run that printed nothing as a pass.
    expect(existsSync(planted)).toBe(true);
    const section = modelSection(out(runInRelative(m, ".")));
    expect(section, "the relative-root run must emit a section").not.toBe("");
    expect(section).toContain("could not be READ");

    // THE PROPERTY: the same repository-relative spelling case `(o-reason)` pins on the absolute-root
    // run, reached here through the invocation shape that used to corrupt it.
    expect(section).toContain(
      "the `models` key in .grugops/factory.config.json is null",
    );
    // THE DISCLOSURE, asserted against the mirror directory STRING rather than against a path-shaped
    // pattern — case `(o)`'s own argument for why a pattern would pass on a root it did not describe.
    expect(section).not.toContain(m);
  });

  // (Plan 29.1-12, R2-CR-01) THE ROOT IS NORMALISED, AND THIS IS THE CASE THAT CAN SEE IT.
  //
  // MEASURED DEVIATION, recorded here because the next reader will otherwise repeat the mistake this
  // case corrects. The fix has two halves — the root is `resolve()`d, and the match must end on a path
  // boundary — and the byte-identity case above discriminates only the SECOND. With `CHECK_ROOT=.` the
  // escaped pattern is `\.`, and every period inside `factory.config.json` is followed by a letter, so
  // the boundary alone already refuses that match. Reverting the normalisation while leaving the
  // boundary in place leaves `(o-rel)` GREEN. Measured, not reasoned: the two live runs are
  // byte-identical under that mutation.
  //
  // What the normalisation actually buys is that the root cannot be a BARE TOKEN. A relative override
  // is any string the caller typed, and a short one collides with ordinary prose in the very sentences
  // this helper rewrites: a mirror reached as `CHECK_ROOT=key` compiles to a pattern matching the word
  // "key" in "the `models` key in ...", which the boundary happily accepts because a space follows it.
  // The whole word is then replaced by ".". So the fixture below names the mirror directory after a
  // word the refusal sentence already contains, which is the only shape that can tell the two halves
  // apart.
  it("(o-rel-word) a relative root that is also an ordinary WORD does not rewrite the prose around the path", () => {
    const parent = mkdtempSync(join(tmpdir(), "grugops-fg-word-"));
    tmpDirs.push(parent);
    const collidingName = "key";
    const m = join(parent, collidingName);
    cpSync(mirror(), m, { recursive: true });
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: null }),
      "utf8",
    );

    // PREMISE 1 — the run refuses, through the ordinary ABSOLUTE-root invocation, so the reference
    // text below is a real rendering rather than an assumption about one.
    const reference = modelSection(out(runIn(m)));
    expect(reference, "the reference run must emit a section").not.toBe("");
    expect(reference).toContain("could not be READ");

    // PREMISE 2 — THE COLLISION IS REAL. The directory name occurs in the rendered sentence at a
    // position that is NOT the path prefix, followed by a byte the path boundary admits. Without this,
    // the case would exercise nothing and pass for the wrong reason.
    expect(
      reference,
      `the fixture is only discriminating if "${collidingName}" appears in the rendered prose followed by whitespace`,
    ).toContain(`\` ${collidingName} in `);

    // THE PROPERTY: reached with the directory name as a RELATIVE override, the sentence is unchanged.
    const section = modelSection(out(runInRelative(parent, collidingName)));
    expect(section, "the relative-root run must emit a section").not.toBe("");
    expect(
      section,
      "a relative override that is also an ordinary word must not rewrite that word out of the refusal sentence — an unnormalised root compiles the caller's typing into the pattern, so the verdict describes the override rather than the repository",
    ).toContain("the `models` key in .grugops/factory.config.json is null");
    expect(section).not.toContain(m);
  });

  // (Plan 29.1-12, R2-CR-01) THE MATCH IS A PATH PREFIX, NOT A SUBSTRING.
  //
  // The review named this variant as unreachable-today-but-unenforced: every path the guard renders is
  // built FROM the root, so a sibling that merely shares a string prefix does not arise on the paths
  // the guard constructs. It DOES arise on the path the guard ECHOES — an illegal `models.preset` is
  // quoted back verbatim into the refusal, and that value is an arbitrary caller string. This case
  // reaches the rewrite on the BEHAVIOUR axis through that echo rather than asserting against the
  // guard's source text, so it observes what the pattern does rather than what it is spelled as.
  it("(o-prefix) a root that is a string PREFIX of a sibling path rewrites nothing", () => {
    const parent = mkdtempSync(join(tmpdir(), "grugops-fg-prefix-"));
    tmpDirs.push(parent);
    const m = join(parent, "mir");
    cpSync(mirror(), m, { recursive: true });
    const siblingDeep = join(parent, "mirXTRA", "deep");
    mkdirSync(siblingDeep, { recursive: true });

    // PREMISE 1 — THE FIXTURE IS WHAT IT CLAIMS. The sibling path really does begin with the mirror
    // root as a string, and really is not under it, and both really exist.
    expect(
      siblingDeep.startsWith(m),
      `${siblingDeep} must begin with ${m} for this case to exercise a prefix match at all`,
    ).toBe(true);
    expect(siblingDeep.startsWith(`${m}/`)).toBe(false);
    expect(existsSync(m) && existsSync(siblingDeep)).toBe(true);

    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: { preset: siblingDeep } }),
      "utf8",
    );

    // PREMISE 2 — the run reached the refusal that echoes the value, so the rewrite was ASKED over
    // text containing the sibling path.
    const section = modelSection(out(runIn(m)));
    expect(section, "the run must emit a section").not.toBe("");
    expect(section).toContain("not a legal preset name");

    // THE PROPERTY: the echoed sibling path survives whole. Under a substring match its leading
    // characters are deleted and it becomes `mirXTRA/deep` — a path that does not exist.
    expect(
      section,
      "a root that is a string prefix of a sibling path must not be rewritten out of the sibling — the match has to end on a path boundary or it is a substring match wearing a path's name",
    ).toContain(siblingDeep);
    expect(section).not.toContain(
      `"${siblingDeep.slice(m.length)}"`,
    );
  });

  // (Plan 29.1-12, R2-CR-01) TODAY'S MEANING OF AN ABSENT OVERRIDE IS PINNED, NOT INFERRED.
  //
  // The normalisation left the falsy check alone on purpose, so both spellings of "no override" still
  // mean the script-relative repository root. That is a behaviour a future edit could change without
  // noticing, because nothing else in the suite ever runs the guard with an EMPTY override.
  it("(o-empty) an unset and an empty CHECK_ROOT both mean the script-relative repository root", () => {
    const noOverride = { ...process.env };
    delete noOverride.CHECK_ROOT;
    const runs = [
      ["unset", noOverride] as const,
      ["empty", { ...noOverride, CHECK_ROOT: "" }] as const,
    ].map(
      ([label, env]) =>
        [
          label,
          spawnSync("node", [GUARD_JS], { encoding: "utf8", cwd: ROOT, env }),
        ] as const,
    );

    // PREMISE: each run produced a model-assignment section, so the equality below is over text that
    // exercised the rendering rather than over two empty strings.
    for (const [label, r] of runs) {
      expect(modelSection(out(r)), `the ${label} run must emit a section`).not.toBe("");
      expect(r.status, `the ${label} run must exit 0`).toBe(0);
    }
    expect(
      out(runs[1][1]),
      "an empty CHECK_ROOT must keep meaning the script-relative repository root",
    ).toBe(out(runs[0][1]));
  });

  // (Plan 29.1-12, R2-CR-01) THE RESIDUAL, DERIVED AND COUNTED — NOT ASSERTED IN PROSE.
  //
  // The un-normalised `process.env.CHECK_ROOT` idiom is shared by every gate in this tree, and this
  // plan edits exactly one of them. What makes that a defensible blast radius rather than an untested
  // assumption is the measured fact that only ONE gate compiles its root into a pattern — every other
  // reader joins it to a path, where an unresolved root is merely relative and not corrupting.
  //
  // Derived from the filesystem at run time so a gate added tomorrow enters the denominator with no
  // edit here. Whole-line comments are stripped first, following case `(m)`: several of these files
  // DISCUSS the override and the pattern at length, and prose about a defect must not be counted as
  // the defect.
  it("(o-one-consumer) exactly ONE gate in this tree compiles its CHECK_ROOT into a RegExp", () => {
    const dir = join(ROOT, "scripts");
    const codeOf = (src: string): string =>
      src
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("//"))
        .join("\n");

    const readsRoot: string[] = [];
    const buildsAnyRegExp: string[] = [];
    const compilesRootIntoRegExp: string[] = [];
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".ts") || f.endsWith(".test.ts")) continue;
      const code = codeOf(readFileSync(join(dir, f), "utf8"));
      if (!code.includes("process.env.CHECK_ROOT")) continue;
      readsRoot.push(f);
      let at = code.indexOf("new RegExp(");
      let any = false;
      let fromRoot = false;
      while (at !== -1) {
        any = true;
        if (/\bROOT\b/.test(code.slice(at, at + 300))) fromRoot = true;
        at = code.indexOf("new RegExp(", at + 1);
      }
      if (any) buildsAnyRegExp.push(f);
      if (fromRoot) compilesRootIntoRegExp.push(f);
    }

    const census = `read CHECK_ROOT: ${readsRoot.length} (${readsRoot.join(", ")}); build any RegExp: ${buildsAnyRegExp.length} (${buildsAnyRegExp.join(", ")}); compile the root INTO a RegExp: ${compilesRootIntoRegExp.length} (${compilesRootIntoRegExp.join(", ")})`;

    // VACUITY FLOOR on the denominator: an empty outer set would make every assertion below pass over
    // nothing at all.
    expect(
      readsRoot.length,
      `no gate in scripts/ reads process.env.CHECK_ROOT — the scan found nothing to measure. ${census}`,
    ).toBeGreaterThan(0);

    // DISCRIMINATION FLOOR: at least one gate builds a RegExp that is NOT built from the root, so
    // "exactly one" below is a property of the inner predicate rather than of RegExp being rare.
    expect(
      buildsAnyRegExp.length,
      `the inner predicate is only meaningful if some gate builds a RegExp WITHOUT the root — otherwise the count below is true for a reason that has nothing to do with this defect. ${census}`,
    ).toBeGreaterThan(compilesRootIntoRegExp.length);

    // THE RESIDUAL: one gate carries this defect class, and it is the one this plan fixed. The other
    // readers join their root to a path, where an unresolved root is relative and not corrupting.
    expect(
      compilesRootIntoRegExp,
      `a SECOND gate now compiles its CHECK_ROOT into a regular expression, which is the R2-CR-01 defect class acquiring a new site. ${census}`,
    ).toEqual(["check-foundation-guards.ts"]);
  });

  it("(j) `preset: tiered` reds SEVENTEEN byte-FRESH adapters — the expectation is the config's, not the generator's", () => {
    const m = mirror();
    mkdirSync(join(m, ".grugops"), { recursive: true });
    writeFileSync(
      join(m, ".grugops/factory.config.json"),
      JSON.stringify({ models: { preset: "tiered" } }),
      "utf8",
    );

    // PREMISE, through the same reader the guard uses: the planted file really resolves `tiered`,
    // and the resolution it produces really disagrees with the committed `inherit` on every role.
    const stems = listRoles(m).map((f) => f.replace(/\.md$/, ""));
    const cfg = readModelsConfig(m, stems);
    expect(cfg.ok).toBe(true);
    if (!cfg.ok) throw new Error("unreachable");
    expect(cfg.value.preset).toBe("tiered");
    const resolution = resolveModels(stems, { preset: cfg.value.preset });
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) throw new Error("unreachable");
    expect([...resolution.value.values()].every((a) => a !== "inherit")).toBe(true);

    // NOT ONE ADAPTER BYTE WAS TOUCHED — every one is exactly what the generator committed, so
    // `adapters-freshness` would report this mirror as perfectly fresh.
    for (const rel of listAgentAdapters(m)) {
      expect(
        readFileSync(join(m, ".claude/agents", rel), "utf8"),
        `${rel} must be byte-identical to the committed adapter`,
      ).toBe(readFileSync(join(ROOT, ".claude/agents", rel), "utf8"));
    }

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    const mismatches = section
      .split("\n")
      .filter((l) => l.includes(MISMATCH_ANCHOR));
    expect(mismatches).toHaveLength(ROLE_COUNT);
    expect(section).toContain(
      "declares `model: inherit`, and the configuration resolves `opus` for role stem \"orchestrator\"",
    );
    expect(section).toContain(
      "declares `model: inherit`, and the configuration resolves `sonnet` for role stem \"qe-e2e\"",
    );
  });

  // ── The TIERED cardinality, adjudicated HERE and proven TWO-SIDED. ──────────────────────────
  const shortTable = (src: string): string =>
    src.replace(
      /\n    \{\n        stem: "uat-planner",[\s\S]*?\n    \},\n\];/,
      "\n];",
    );
  const longTable = (src: string): string =>
    src.replace(
      "export const TIERED = [",
      'export const TIERED = [\n    { stem: "zz-scratch-row", alias: "sonnet", rationale: "scratch row planted by a discrimination case" },',
    );

  it("(k-low) a TIERED table one row SHORT is named with all three numbers", () => {
    const guardJs = scratchGuardFiles({ "model-tiers.js": shortTable });
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(modelSection(out(r))).toContain(
      `the TIERED preset table holds ${ROLE_COUNT - 1} row(s) against MODEL_TIERS_COUNT of ${ROLE_COUNT} and the kit authority's ROLE_COUNT of ${ROLE_COUNT}`,
    );
  });

  it("(k-high) a TIERED table one row LONG is named with all three numbers", () => {
    const guardJs = scratchGuardFiles({ "model-tiers.js": longTable });
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    expect(modelSection(out(r))).toContain(
      `the TIERED preset table holds ${ROLE_COUNT + 1} row(s) against MODEL_TIERS_COUNT of ${ROLE_COUNT} and the kit authority's ROLE_COUNT of ${ROLE_COUNT}`,
    );
  });

  // ── (p)/(q) THE TIER TABLE AGREES WITH THE ROLE CORPUS, ON EVERY RUN. (Plan 29.1-09, IN-01) ──
  //
  // `tieredCorpusRefusals` was accepted as the place the D5 cardinality floor went when it was moved
  // out of `resolveModels`, and until this plan it had NO production consumer at all: the whole of its
  // reachability was its own oracle. It has one now, and it is called UNCONDITIONALLY rather than on
  // the tiered path — because this repository's own tree resolves the ZERO-CONFIG preset, so a
  // tiered-path-only call would never execute in continuous integration, which is precisely the
  // no-production-consumer defect IN-01 reports, reproduced inside the fix for it.

  // A plant that a length comparison structurally cannot see: one table row RENAMED to a valid-looking
  // stem the corpus does not carry. The row count does not move, the corpus count does not move, and
  // both directions of the set equality are wrong.
  const RENAME_VICTIM = "uat-planner";
  const renamedTableStem = (src: string): string =>
    src.replace(`stem: "${RENAME_VICTIM}"`, `stem: "${RENAME_VICTIM}-typo"`);

  it("(p) a role stem with no TIERED row is named by the guard under the ZERO-CONFIG preset too", () => {
    const m = mirror();
    // NO configuration file of any kind — the state this repository itself is in.
    expect(existsSync(join(m, ".grugops/factory.config.json"))).toBe(false);
    writeFileSync(
      join(m, "agent-factory/roles/zz-planted-role.md"),
      readFileSync(join(m, "agent-factory/roles/orchestrator.md"), "utf8"),
      "utf8",
    );

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      'the role stem "zz-planted-role" has NO entry in the TIERED preset table — direction CORPUS → TABLE',
    );
    // …and the run really did resolve the zero-config preset, so the finding above is not an artifact
    // of some tiered configuration having been planted.
    expect(section).toContain('preset "none"');

    // THE DISCRIMINATION THAT MAKES THE UNCONDITIONAL WIRING LOAD-BEARING. The same mirror, against a
    // build whose call is guarded behind the tiered preset: the finding VANISHES. The exit code does
    // NOT discriminate here — an eighteenth role also reds the adapter/stem count floor — so the
    // property is asserted on the finding, which is the thing that would have been lost.
    const guarded = scratchGuardFiles({
      "check-foundation-guards.js": (src) =>
        src.replace(
          "for (const finding of tieredCorpusRefusals(stems))",
          'for (const finding of (config.ok && config.value.preset === "tiered" ? tieredCorpusRefusals(stems) : []))',
        ),
    });
    const gated = modelSection(out(runScratch(guarded, m)));
    expect(
      gated,
      "a tiered-path-only wiring is unreachable on a zero-config tree — which is the defect IN-01 reports",
    ).not.toContain("direction CORPUS → TABLE");
  });

  it("(q) a RENAMED tier-table row is named in BOTH directions although neither count moved", () => {
    const guardJs = scratchGuardFiles({ "model-tiers.js": renamedTableStem });
    const r = runScratch(guardJs, mirror());
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      `the TIERED preset table assigns a tier to "${RENAME_VICTIM}-typo", which is NOT one of the role stems derived from the role-set authority — direction TABLE → CORPUS`,
    );
    expect(section).toContain(
      `the role stem "${RENAME_VICTIM}" has NO entry in the TIERED preset table — direction CORPUS → TABLE`,
    );

    // AND THE DECLARED-CONSTANT CHECK STAYS GREEN ON THIS SAME MUTATION, which is exactly why it does
    // not replace this one and this one does not replace it. Seventeen rows against MODEL_TIERS_COUNT
    // of seventeen is an identity a rename cannot disturb; the two are different axes.
    expect(
      section,
      "the MODEL_TIERS_COUNT arm must not fire on a rename — a count identity is blind to it",
    ).not.toContain("against MODEL_TIERS_COUNT of");
  });

  it("(q-green) the tier table and the role corpus agree on THIS repository, and the arm is not vacuous", () => {
    // The production consumer exists and runs: on the live tree it produces no finding, and the
    // mutation case above proves the same call can produce one.
    expect(tieredCorpusRefusals(listRoles(ROOT).map((f) => f.replace(/\.md$/, "")))).toEqual([]);
    expect(runIn(ROOT).status).toBe(0);
  });


  // ── THE BOUND ON THE SCAN SET, PROVEN TO FIRE. ─────────────────────────────────────────────
  //
  // Found by red-teaming the guard rather than named by the plan: every arm above enumerates the
  // AGENT adapter set, and this kit ships fourteen more frontmatter surfaces the platform loads on
  // which Claude Code honours a `model` key. A guard whose soundness claim is "every committed model
  // pin is the configuration's" is FALSE without this arm, and the arm is worthless without a case
  // that watches it fire.
  //
  // The plant goes on BOTH distribution forms of one skill, for the reason
  // `plantSkillWithoutToolsKey` records: planting on one side alone is a real divergence that reds
  // guard_distribution_pair for a reason having nothing to do with the arm under test.
  it("(l) a stray `model` pin on a SKILL — both distribution forms — is named by file and by value", () => {
    const m = mirror();
    const standalone = join(m, ".claude/skills/grugops-gate/SKILL.md");
    const plugin = join(m, "skills/gate/SKILL.md");
    for (const file of [standalone, plugin]) {
      const lines = readFileSync(file, "utf8").split("\n");
      const at = lines.findIndex((l) => l.startsWith("description:"));
      if (at === -1) {
        throw new Error(
          `the stray-pin plant matched nothing in ${file} — a case proven against an unmodified fixture is proven against nothing`,
        );
      }
      lines.splice(at + 1, 0, "model: opus");
      writeFileSync(file, lines.join("\n"), "utf8");
    }

    // PREMISE, through the guard's own reader: both files still ADMIT (so the arm is reached rather
    // than short-circuited by an admission refusal) and both really declare `opus`.
    expect(admittedModelValues(standalone)).toEqual(["opus"]);
    expect(admittedModelValues(plugin)).toEqual(["opus"]);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain(
      `2 of the ${NON_AGENT_SURFACE_COUNT} non-agent adapter surface(s) this kit ships declare a \`model\` key`,
    );
    expect(section).toContain(".claude/skills/grugops-gate/SKILL.md: `opus`");
    expect(section).toContain("skills/gate/SKILL.md: `opus`");
    expect(section).toContain("a pin here is a tier nobody adjudicated");
    // It is NOT reported as one of the four agent-adapter value-shape defects.
    for (const anchor of VALUE_SHAPE_ANCHORS) {
      expect(section).not.toContain(anchor);
    }
  });

  // ── THE THREE ARMS OF THE STRAY-PIN LOOP, PROVEN AS A UNION. ───────────────────────────────
  //
  // (Plan 29.1-13, R2-WR-03) THE MEASUREMENT THE GUARD'S SOUNDNESS ARGUMENT RESTS ON, PINNED.
  //
  // The paragraph above the stray-pin loop used to offer the two packaging templates as proof that
  // the ADMISSION arm is exercised: "they carry a `kind:`/`tier:` frontmatter the canonical adapter
  // schema does not admit, so they reach this arm and are skipped by it". Measured through the
  // guard's own reader, that is false. `kind` and `tier` are BOTH members of `CANONICAL_SCHEMA`, so
  // both templates ADMIT, and both are skipped one line later by the no-`model`-key arm. The comment
  // named the wrong mechanism, which left the admission arm unexercised and its soundness a claim.
  //
  // This case pins the corrected claim so a later edit cannot quietly restore the false one. It
  // asserts through the same `admit()` the guard calls that both templates admit, that the two keys
  // admitting them really are schema members, and that neither declares a `model` key — which is
  // exactly the arm the corrected paragraph names.
  it("(s) the packaging templates are ADMITTED and skipped by the no-model-key arm — the measured mechanism, pinned", () => {
    const packaging = spawnGrantScan(ROOT).filter((f) =>
      f.startsWith(spawnGrantScanPrefix("packaging")),
    );
    expect(
      packaging.length,
      "the packaging family must be non-empty, or this case pins nothing",
    ).toBeGreaterThan(0);

    for (const rel of packaging) {
      const parsed = admit(readFileSync(join(ROOT, rel), "utf8"));
      expect(
        parsed.ok,
        `${rel}: the corrected paragraph claims this template ADMITS — a refusal here means the comment is wrong again, in the other direction`,
      ).toBe(true);
      if (!parsed.ok) throw new Error("unreachable");
      // THE KEY LIST IS ASSERTED WHOLE, not probed for membership: the false claim was about which
      // keys these files carry, so the correction is only pinned if the whole list is.
      expect(
        [...parsed.value.keys()].sort(),
        `${rel}: the admitted key list is the measurement the corrected paragraph records`,
      ).toEqual(["kind", "tier"]);
      // …and THIS is the arm they take: no `model` key, so the loop's second `continue`, never its
      // first.
      expect(
        parsed.value.has("model"),
        `${rel}: a packaging template that grew a \`model\` key would take the stray-pin arm instead, and the corrected paragraph would be stale`,
      ).toBe(false);
    }

    // The two keys that admit them are schema members — the fact the false comment denied.
    for (const key of ["kind", "tier"]) {
      expect(
        CANONICAL_SCHEMA,
        `\`${key}\` must be a CANONICAL_SCHEMA member, or the packaging templates could not admit and the corrected paragraph would be false`,
      ).toContain(key);
    }
  });

  // (Plan 29.1-13, R2-WR-03) THE ARM'S SILENCE IS AN ASSERTION NOW, NOT A CLAIM RESTING ON AN EXAMPLE
  // THAT NEVER TAKES IT.
  //
  // The stray-pin loop skips an unadmittable surface with NO finding of its own, and the recorded
  // reason is that guard_wr05 already names it by file and by enumerated code and fails the gate
  // closed. Nothing this tree ships reaches that arm, so until this case the coverage was an
  // untested assumption. The arm is reached by PLANTING a refusal, and the plant's own premise is
  // measured through the same `admit()` the guard calls before anything about the verdict is
  // asserted.
  it("(s-unadmittable) an unadmittable non-agent surface is excluded from the probed count and named by guard_wr05", () => {
    const m = mirror();
    const rel = "agent-factory/packaging/slash-command.template.md";
    const file = join(m, rel);
    const before = readFileSync(file, "utf8");
    const planted = before.replace(
      "tier: core\n",
      "tier: core\nstray-unknown-key: planted\n",
    );
    expect(
      planted,
      `the plant matched nothing in ${rel} — a case proven against an unmodified fixture is proven against nothing`,
    ).not.toBe(before);
    writeFileSync(file, planted, "utf8");

    // PREMISE 1 — THE PLANT REALLY IS UNADMITTABLE, AND UNDER WHICH ENUMERATED CODE. Read through the
    // guard's own authority, never through a second opinion written here.
    const parsed = admit(planted);
    expect(
      parsed.ok,
      `${rel}: the plant must be REFUSED, or this case exercises the no-model-key arm and reports it as the admission arm`,
    ).toBe(false);
    if (parsed.ok) throw new Error("unreachable");
    expect(parsed.code).toBe("unknown-key");

    // PREMISE 2 — THE PLANTED FILE REALLY IS IN THE NON-AGENT PARTITION the stray-pin loop walks,
    // derived the same way the guard partitions it.
    const scan = spawnGrantScan(m);
    expect(scan, `${rel} must be a member of the spawn-grant scan`).toContain(
      rel,
    );
    expect(
      rel.startsWith(spawnGrantScanPrefix("agent")),
      `${rel} must be OUTSIDE the agent prefix, or it is not in the partition this arm walks`,
    ).toBe(false);

    const r = runIn(m);
    expect(r.status).not.toBe(0);

    // THE COVERAGE THE ARM'S SILENCE RESTS ON, OBSERVED: guard_wr05 names the file with its code.
    const wr05 = guardSection(out(r), "guard_wr05").join("\n");
    expect(
      wr05,
      "guard_wr05 is the finding the stray-pin arm's silence defers to — if it does not name the file, the silence covers nothing",
    ).toContain(`${rel}: frontmatter is NOT in the canonical form [unknown-key]`);

    // …AND THE DENOMINATOR IS HONEST: one fewer probed than derived, and the excluded member named
    // with its code. Before this plan the same plant printed a count of every member as "checked".
    const section = modelSection(out(r));
    expect(
      section,
      "a run that could not read a surface must not publish a count that includes it",
    ).toContain(
      `${NON_AGENT_SURFACE_COUNT - 1} of ${NON_AGENT_SURFACE_COUNT} non-agent adapter surface(s) probed for a stray pin`,
    );
    expect(section).toContain(`${rel}: [unknown-key]`);
    expect(section).toContain("reported by guard_wr05");
    // The arm does NOT re-report guard_wr05's sentence — the excluded COUNT and the file's identity
    // are this arm's facts; the reason is guard_wr05's.
    expect(section).not.toContain("is not one of the 10 keys");
  });

  // (Plan 29.1-13, R2-WR-03) THE ARMS TESTED AS A UNION, WHICH IS WHAT LET THE OLD JUSTIFICATION
  // STAND.
  //
  // Each arm passing on its own fixture is what every previous round already had; a predicate split
  // into arms is only proven when their UNION is exercised, because the composition is where a count
  // and a message can disagree. One mirror carries all three states at once — an admitted surface
  // with a `model` key, an admitted surface without one, and an unadmittable surface — and ONE
  // verdict is asserted to carry all three facts.
  it("(s-union) one mirror carrying a stray pin, a clean surface and an unadmittable surface reports all three facts", () => {
    const m = mirror();

    // ARM 1 — AN ADMITTED SURFACE CARRYING A `model` KEY. Planted on BOTH distribution forms for the
    // reason case (l) records: one side alone is a real divergence that reds guard_distribution_pair
    // for a reason having nothing to do with the arm under test.
    const pinned = [
      ".claude/skills/grugops-gate/SKILL.md",
      "skills/gate/SKILL.md",
    ];
    for (const rel of pinned) {
      const f = join(m, rel);
      const lines = readFileSync(f, "utf8").split("\n");
      const at = lines.findIndex((l) => l.startsWith("description:"));
      if (at === -1) {
        throw new Error(
          `the stray-pin plant matched nothing in ${rel} — a case proven against an unmodified fixture is proven against nothing`,
        );
      }
      lines.splice(at + 1, 0, "model: opus");
      writeFileSync(f, lines.join("\n"), "utf8");
    }

    // ARM 3 — AN UNADMITTABLE SURFACE.
    const refused = "agent-factory/packaging/slash-command.template.md";
    const refusedFile = join(m, refused);
    const refusedBefore = readFileSync(refusedFile, "utf8");
    const refusedText = refusedBefore.replace(
      "tier: core\n",
      "tier: core\nstray-unknown-key: planted\n",
    );
    expect(refusedText, `the plant matched nothing in ${refused}`).not.toBe(
      refusedBefore,
    );
    writeFileSync(refusedFile, refusedText, "utf8");

    // ARM 2 — AN ADMITTED SURFACE CARRYING NO `model` KEY, left untouched.
    const clean = "agent-factory/packaging/subagent.frontmatter.md";

    // EVERY ARM'S PREMISE, THROUGH THE GUARD'S OWN READER, BEFORE ANY VERDICT IS ASSERTED.
    for (const rel of pinned) {
      expect(admittedModelValues(join(m, rel)), `${rel}: arm 1`).toEqual([
        "opus",
      ]);
    }
    expect(admittedModelValues(join(m, clean)), `${clean}: arm 2`).toEqual([]);
    const refusedParse = admit(refusedText);
    expect(refusedParse.ok, `${refused}: arm 3 must be REFUSED`).toBe(false);
    if (refusedParse.ok) throw new Error("unreachable");
    expect(refusedParse.code).toBe("unknown-key");

    // …and all three really are in the non-agent partition.
    const agentPrefix = spawnGrantScanPrefix("agent");
    const nonAgent = spawnGrantScan(m).filter((f) => !f.startsWith(agentPrefix));
    for (const rel of [...pinned, clean, refused]) {
      expect(nonAgent, `${rel} must be in the non-agent partition`).toContain(
        rel,
      );
    }
    expect(nonAgent.length).toBe(NON_AGENT_SURFACE_COUNT);

    const r = runIn(m);
    expect(r.status).not.toBe(0);
    const section = modelSection(out(r));

    // FACT 1 — the stray pin, named by file and by value.
    expect(section).toContain(
      `2 of the ${NON_AGENT_SURFACE_COUNT} non-agent adapter surface(s) this kit ships declare a \`model\` key`,
    );
    for (const rel of pinned) {
      expect(section).toContain(`${rel}: \`opus\``);
    }

    // FACT 2 — probed is exactly one below derived. The clean surface is PROBED and counted; the
    // unadmittable one is not.
    expect(
      section,
      "the probed count must differ from the derived count by exactly the one member that could not be read",
    ).toContain(
      `${NON_AGENT_SURFACE_COUNT - 1} of ${NON_AGENT_SURFACE_COUNT} non-agent adapter surface(s) probed for a stray pin`,
    );

    // FACT 3 — the excluded member, named with its code.
    expect(section).toContain(`${refused}: [unknown-key]`);
    expect(section).toContain("reported by guard_wr05");
  });

  // (Plan 29.1-09, IN-04) THE DENOMINATOR IS DERIVED FROM THE KIT AUTHORITY, AND THE MEASUREMENT THAT
  // DECIDED IT IS RECORDED IN THE CASE.
  //
  // It used to be composed from TWO hand-named families — the standalone skills and their plugin-form
  // twins — while `SPAWN_GRANT_SCAN_PARTS` enumerates FOUR. The missing family is `packaging`, and it
  // is not an academic gap: `agent-factory/packaging/slash-command.template.md` IS the slash-command
  // surface, and CLAUDE.md's own format table records `model` as legal frontmatter on a slash command.
  // The family IN-04 named as its promote trigger was the very one sitting outside the arm.
  //
  // So no promote trigger is recorded and no count is hand-pinned: the list is PARTITIONED out of the
  // one composition every other scan in this file reads, on the same prefix the composition was built
  // from. A fifth family added to `SPAWN_GRANT_SCAN_PARTS` enters this arm in the commit that adds it.
  it("the non-agent surface denominator is DERIVED by partitioning the ONE kit composition, not hand-listed", () => {
    // Derived here the way a consumer would, and asserted non-vacuous in every part — a partition
    // whose parts are empty publishes a denominator that agrees with nothing.
    const agentPrefix = spawnGrantScanPrefix("agent");
    const scan = spawnGrantScan(ROOT);
    const expected = scan.filter((f) => !f.startsWith(agentPrefix));
    expect(scan.length).toBeGreaterThan(expected.length);
    expect(expected.length).toBe(NON_AGENT_SURFACE_COUNT);

    // THE MEASUREMENT: every family the kit authority enumerates, agent excluded, is represented.
    const families = SPAWN_GRANT_SCAN_PARTS.filter((p) => p.name !== "agent");
    expect(families.map((p) => p.name)).toEqual([
      "skill",
      "plugin-skill",
      "packaging",
    ]);
    for (const part of families) {
      const members = expected.filter((f) => f.startsWith(part.prefix));
      expect(
        members.length,
        `the ${part.name} family must be inside the stray-pin arm`,
      ).toBe(part.list(ROOT).length);
      expect(members.length).toBeGreaterThan(0);
    }

    // …and the family CLAUDE.md names as carrying a legal `model` key is one of them, by file.
    expect(expected).toContain(
      "agent-factory/packaging/slash-command.template.md",
    );

    // (Plan 29.1-13, R2-WR-03) THE CLAUSE THIS CASE MATCHES CHANGED, ITS PREMISE DID NOT. The run
    // summary used to publish ONE number — every derived member, reported as "checked" whether or not
    // it was read. It now publishes PROBED of DERIVED. On an unmutated tree nothing is excluded, so
    // the two numbers are equal and the clause reads as one clean fact; the equality is the assertion,
    // not a coincidence the old wording could not have expressed.
    const section = modelSection(out(runIn(ROOT)));
    expect(section).toContain(
      `${expected.length} of ${expected.length} non-agent adapter surface(s) probed for a stray pin, none found`,
    );
    // …and NOTHING was excluded, which is the other half of "the denominator is honest": the excluded
    // clause is absent entirely rather than present with a zero.
    expect(
      section,
      "an unmutated tree excludes no surface, so the run summary must carry no exclusion clause at all",
    ).not.toContain("reported by guard_wr05");
  });

  it("CONTROL — an UNMUTATED mirror exits 0 with guard_model_assignment passing", () => {
    const r = runIn(mirror());
    expect(r.status).toBe(0);
    const section = modelSection(out(r));
    expect(section).toContain("PASS  model assignment:");
    expect(section).toContain(
      `${ROLE_COUNT} committed adapter(s) under .claude/agents compared against a resolution recomputed for ${ROLE_COUNT} derived role stem(s)`,
    );
    expect(section).toContain('preset "none" from neither standard location');
    expect(section).toContain("distinct aliases resolved: inherit");
  });

  // ── (r) THE GENERATOR IS WIRED INTO CI, ASSERTED AT BOTH ENDS. (Plan 29.1-09, WR-07) ─────────
  //
  // The other half of that round's fail-open, and the half no source edit can hold. Every named
  // refusal this phase built lives in the adapter generator, and `.github/workflows/ci.yml` ran the
  // generator nowhere: `generate:adapters` was defined in package.json and invoked by no step. The
  // freshness mirror copies the role and packaging trees and NO configuration, so the mirrored
  // generator never opened the offending file either. An illegal `models` block committed to a mirror
  // cleared both continuous-integration gates at exit 0.
  //
  // WIRED AT BOTH ENDS, DELIBERATELY. This repository's own comment in that same block already records
  // that `freshness:adapters` sat un-invoked for a whole phase, and that a gate running only as a side
  // effect of another step is borrowed rather than wired. This is the second time that lesson is being
  // applied to this block, so the wiring is pinned here as well as written there — a step present in
  // the workflow and asserted by nothing is one edit away from being gone.
  //
  // ── THE PIN ITSELF WAS OPEN AT ONE END. (Plan 29.1-14, R2-WR-02) ──────────────────────────────
  //
  // The pin as first written located the block by its step name and then took everything to END OF
  // FILE, and probed that slice with substring containment. Both halves fail in the direction that
  // keeps the pin green while the gate is gone. A step appended after this block puts a
  // `npm run generate:adapters` occurring THERE inside the slice, satisfying a case written about
  // THIS block. And the block is roughly four-fifths comment, so a future comment quoting a command
  // satisfies a substring probe with the command deleted. The case's own header asserted the
  // stronger property — that a hit anywhere else in the workflow does not put the command on the
  // gated path — which was false of the code beneath it.
  //
  // The rebuild below is bounded at the next step, asserts that boundedness as a PROPERTY rather
  // than inheriting it from the coincidence that this block is last today, and decides membership by
  // exact equality against comment-stripped COMMAND lines.

  // The step name and the step-boundary marker are each spelled ONCE, here. The marker's bytes — a
  // newline, the workflow's six-space step indentation, and the step key — were read out of
  // .github/workflows/ci.yml rather than remembered; `(r-bound)` asserts the workflow really does
  // carry markers spelled this way, because a right bound that matches nothing is not a bound.
  const UBUNTU_BLOCK_STEP_NAME = "Freshness gates + repo gates (ubuntu only)";
  const STEP_MARKER = "\n      - name: ";

  // The number of `.test.ts` files in scripts/ that locate the ubuntu block by its step name,
  // MEASURED in this session (plan 29.1-14) rather than assumed: check-foundation-guards.test.ts and
  // skill-twins-freshness.test.ts. Pinned two-sided by `(r-class)` so a third reader arriving is a
  // red rather than a silent pass.
  const UBUNTU_BLOCK_READER_COUNT = 2;

  function ciWorkflow(): string {
    return readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
  }

  // (Plan 29.1-19, R3-WR-01) THE SYNTHETIC FOLLOWING STEP THE RIGHT BOUND IS PROVEN AGAINST.
  //
  // The committed workflow's ubuntu block is its LAST step, so the search for a following step
  // marker returns -1 on this tree and BOTH branches of the bounded reader return the same bytes.
  // Measured this session: next marker index -1, bounded and unbounded byte-identical, both command
  // lists 20 entries; and this file run with the reader's right bound deleted came back
  // 263 passed (263). A bound the committed tree cannot exercise is proven on an input that carries
  // what the tree lacks — a following step — assembled in memory. .github/workflows/ci.yml is never
  // written to, not even temporarily.
  //
  // THE COMMAND IS ONE THE BLOCK ALREADY RUNS, ON PURPOSE. A novel string asserted absent from the
  // bounded block would also be absent from the empty string, so a reader returning "" would satisfy
  // it. A command that already occurs INSIDE the block turns the assertion into a COUNT: the bounded
  // read returns exactly the occurrences the committed block carries, and the unbounded read returns
  // one more.
  const APPENDED_STEP_NAME = "A step appended after the ubuntu gate block (synthetic, plan 29.1-19)";
  const APPENDED_STEP_COMMAND = "npm run generate:adapters";

  /**
   * The committed workflow text plus ONE synthetic following step, in memory only.
   *
   * The step is spelled with `STEP_MARKER` itself rather than with a hand-typed `- name:` line, so
   * the input this case proves the bound against and the bound's own needle cannot drift apart.
   */
  function withAppendedStep(ci: string): string {
    return `${ci}${STEP_MARKER}${APPENDED_STEP_NAME}\n        run: |\n          ${APPENDED_STEP_COMMAND}\n`;
  }

  /**
   * The ubuntu gate block: from its step name to the NEXT step marker, or to end of file.
   *
   * BOUNDED ON THE RIGHT ON PURPOSE, AND THE FALLBACK IS NOT THE GUARANTEE. The block is the LAST
   * step in the workflow today, so on the committed file the bound lands on end-of-file either way —
   * which is exactly why it is written now rather than when it first matters.
   *
   * WHAT PROVES IT, AND WHAT DOES NOT. (Plan 29.1-19, R3-WR-01) This docstring previously claimed
   * `(r-bound)` asserted the boundedness as a property. It did not: the assertion it pointed at
   * probed the RETURNED slice for a step marker, which neither branch of the return below can ever
   * contain, so its failure message was unreachable on every possible input and the file stayed
   * green with the bound deleted. The property is proven instead by
   * `(r-bound-synthetic)`, over a workflow that HAS a following step, with a bounded-versus-unbounded
   * control on the same bytes that reds on every run if this bound is removed.
   *
   * Shape follows scripts/model-dial-consistency.test.ts `scopeSection()`, this repository's existing
   * worked example of a section reader bounded on the right, rather than inventing a second one.
   */
  function ubuntuBlock(ci: string): string {
    const at = ci.indexOf(UBUNTU_BLOCK_STEP_NAME);
    if (at === -1) {
      throw new Error(
        "CI wiring oracle: .github/workflows/ci.yml does not carry the step name " +
          `"${UBUNTU_BLOCK_STEP_NAME}" — refusing to read a block that is not there`,
      );
    }
    const rest = ci.slice(at + UBUNTU_BLOCK_STEP_NAME.length);
    const next = rest.indexOf(STEP_MARKER);
    return next === -1 ? rest : rest.slice(0, next);
  }

  /**
   * The block's COMMAND lines: trimmed, non-empty, and with comment lines dropped.
   *
   * The block is roughly four-fifths comment, so a probe over its raw text is a probe over prose. A
   * comment reading `# we used to run npm run generate:adapters here` satisfies a substring match
   * with the command itself deleted. Membership and ordering are decided over THIS list, by exact
   * line equality.
   */
  function ubuntuBlockCommands(ci: string): string[] {
    return ubuntuBlock(ci)
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
  }

  // (Plan 29.1-19, R3-WR-01) THE TITLE NAMES WHAT THE CASE ASSERTS, WHICH IS NOW LESS THAN IT SAID.
  // It read "is bounded at both ends and carries no second step marker" while the only assertion
  // making that claim was unreachable. What survives here are the reader's PREMISES on the committed
  // workflow — a locator that is unambiguous and a right-bound needle that matches something. The
  // bound's effect is `(r-bound-synthetic)`'s.
  it("(r-bound) the ubuntu gate block's locator is unambiguous and its right-bound needle matches real text", () => {
    const ci = ciWorkflow();

    // PREMISE 1 — the step name occurs exactly once, so the locator cannot land on a second
    // occurrence and read a different block while reporting this one.
    expect(
      ci.indexOf(UBUNTU_BLOCK_STEP_NAME),
      "the ubuntu-only gate block must be locatable by its step name",
    ).toBeGreaterThan(-1);
    expect(
      ci.indexOf(UBUNTU_BLOCK_STEP_NAME),
      "the ubuntu gate block's step name must occur exactly once in the workflow, or the locator is ambiguous",
    ).toBe(ci.lastIndexOf(UBUNTU_BLOCK_STEP_NAME));

    // PREMISE 2 — the workflow really does spell its step markers the way STEP_MARKER does. A right
    // bound whose needle matches nothing is not a bound; it is the unbounded read wearing a bound's
    // name, and it would pass this case silently.
    expect(
      ci.split(STEP_MARKER).length - 1,
      `the workflow must carry step markers spelled ${JSON.stringify(STEP_MARKER)} — a right bound that matches nothing is not a bound`,
    ).toBeGreaterThan(0);

    // THE CONTAINMENT ASSERTION THAT STOOD HERE IS DELETED. (Plan 29.1-19, R3-WR-01) It probed the
    // returned slice for a second step marker, which is guaranteed by the reader's own construction:
    // the bounded branch cuts immediately before the first occurrence and the fallback branch is
    // taken only when there is none, so no input could print its failure message. Leaving it beside
    // a working proof is a second claim that the property is tested twice. The property under test
    // is the bound's EFFECT, and it is proven by `(r-bound-synthetic)` below on a workflow that has
    // a following step, with a bounded-versus-unbounded control on the same bytes.

    // VACUITY FLOOR. An empty command list would make every membership assertion in (r-commands)
    // fail loudly, but an empty BLOCK caused by a bad bound reds pointing at the wrong thing — the
    // reader would chase a missing command rather than a broken bound.
    const commands = ubuntuBlockCommands(ci);
    expect(
      commands.length,
      "the bounded block must still carry commands after comment stripping — an empty block is a bound defect, not a wiring defect",
    ).toBeGreaterThan(0);
    expect(
      commands,
      "the slice must really be the gate block, proven by a command already known to live in it",
    ).toContain("npm run freshness:adapters");
  });

  // (Plan 29.1-19, R3-WR-01) THE BOUND, PROVEN ON AN INPUT THAT CAN SEE IT.
  //
  // Round 3 deleted this reader's right bound outright and ran the file: 263 passed (263). Nothing
  // in the committed tree could tell the bounded reader from the unbounded one, because the block is
  // the workflow's last step. The remedy is not another assertion over the committed file — it is an
  // input carrying what the committed file lacks, plus a control that keeps the proof alive on every
  // future run rather than only in the session where someone thinks to try the mutation.
  it("(r-bound-synthetic) the reader stops at the next step, proven on a workflow that HAS one", () => {
    const ci = ciWorkflow();
    const withAppended = withAppendedStep(ci);

    // PREMISE OF THE SYNTHETIC INPUT ITSELF, asserted before anything is read from it. A synthetic
    // text that failed to introduce a following step would make every assertion below pass for the
    // OLD reason — the coincidence this case exists to remove — and the case would degrade silently
    // into the tautology it replaces.
    expect(
      withAppended
        .slice(withAppended.indexOf(UBUNTU_BLOCK_STEP_NAME) + UBUNTU_BLOCK_STEP_NAME.length)
        .indexOf(STEP_MARKER),
      "PREMISE: the synthetic workflow must carry a step marker AFTER the ubuntu block's step name — without one this case proves nothing the committed workflow did not already prove",
    ).toBeGreaterThan(-1);

    // …AND THE FINDING ITSELF, RE-MEASURED RATHER THAN QUOTED. The committed workflow carries no
    // step marker after this block, which is precisely why the bound needs a synthetic input to be
    // visible at all. The day a step is appended to ci.yml this assertion reds, and the correct
    // response is to delete it — the tree would then be exercising the bound on its own.
    expect(
      ci
        .slice(ci.indexOf(UBUNTU_BLOCK_STEP_NAME) + UBUNTU_BLOCK_STEP_NAME.length)
        .indexOf(STEP_MARKER),
      "PREMISE (the finding, re-measured): the COMMITTED workflow must carry NO step marker after the ubuntu block — if it now does, this case's synthetic input is no longer the only thing exercising the bound and this premise should be retired",
    ).toBe(-1);

    const block = ubuntuBlock(withAppended);

    // THE BOUND'S EFFECT.
    expect(
      block,
      `the bounded block must stop before the appended step "${APPENDED_STEP_NAME}" — a reader that searches to end of file is not reading a section, it adopts every later block, and assertions written about THIS block start being made about someone else's text`,
    ).not.toContain(APPENDED_STEP_NAME);

    // …AND THE APPENDED OCCURRENCE IS NOT ADOPTED INTO THE COMMAND LIST. The expected number is
    // COUNTED from the committed block rather than assumed to be one, so it moves with the workflow
    // instead of pinning a guess about it.
    const occurrencesInCommittedBlock = ubuntuBlockCommands(ci).filter(
      (c) => c === APPENDED_STEP_COMMAND,
    ).length;
    expect(
      occurrencesInCommittedBlock,
      `PREMISE: "${APPENDED_STEP_COMMAND}" must already occur inside the committed block — an appended copy is only a duplicate worth counting when the original is there. A command absent from the block would make the count assertion below satisfiable by a reader returning the empty string.`,
    ).toBeGreaterThan(0);
    expect(
      ubuntuBlockCommands(withAppended).filter((c) => c === APPENDED_STEP_COMMAND).length,
      `the bounded read of the synthetic workflow must return ${occurrencesInCommittedBlock} occurrence(s) of "${APPENDED_STEP_COMMAND}" — the number the committed block carries. One more means the appended step's command was adopted into the list this file's wiring assertions are made over.`,
    ).toBe(occurrencesInCommittedBlock);

    // ── NEGATIVE CONTROL, PERMANENT AND DELIBERATE ─────────────────────────────────────────────
    //
    // This is NOT a second reader of the block, and nothing outside this case may call it. It is the
    // SAME slice with the right bound removed, applied to the SAME bytes, so the only difference
    // between it and `ubuntuBlock` above is the bound and nothing else. Asserting the two DIFFER is
    // what makes this proof fail on EVERY run in a tree where the bound has been deleted, rather
    // than only in a session where someone thought to delete it — which is the state round 3 found
    // and the direct application of this round's own lesson about asserting a harness's premise.
    const unboundedUbuntuSlice = withAppended.slice(
      withAppended.indexOf(UBUNTU_BLOCK_STEP_NAME) + UBUNTU_BLOCK_STEP_NAME.length,
    );
    expect(
      unboundedUbuntuSlice,
      "CONTROL: the UNBOUNDED slice must contain the appended step, or the control is not exercising the difference it exists to measure and the comparison below is vacuous",
    ).toContain(APPENDED_STEP_NAME);
    expect(
      block === unboundedUbuntuSlice,
      "CONTROL: the bounded and the unbounded read of the SAME synthetic workflow must DIFFER. They came back byte-identical, which means the reader is not bounding anything.",
    ).toBe(false);
  });

  it("(r-commands) the wiring pin probes COMMAND lines — a comment quoting a command does not satisfy it", () => {
    const ci = ciWorkflow();
    const commands = ubuntuBlockCommands(ci);

    // PREMISE — the list is non-empty and really is the gate block's, proven by a command already
    // known to live in it. Both hold BEFORE any membership assertion below is believed.
    expect(commands.length, "the comment-stripped command list must be non-empty").toBeGreaterThan(0);
    expect(
      commands,
      "the slice must really be the gate block, proven by a command already known to live in it",
    ).toContain("npm run freshness:adapters");

    for (const command of [
      "npm run generate:adapters",
      "git status --porcelain -- .claude/agents/",
      'test -z "$(git status --porcelain -- .claude/agents/)"',
    ]) {
      expect(
        commands,
        `${command} must run inside the ubuntu gate block as a COMMAND line — the generator is the ONE process that refuses an illegal \`models\` configuration, and the cleanliness pair behind it is what proves the committed adapters match the live configuration, including an adapter that exists on disk and was never committed (R2-IN-05). Membership is exact line equality, so a comment quoting this text does not satisfy it. Commands found: ${JSON.stringify(commands)}`,
      ).toContain(command);
    }

    // ORDERING OVER THE COMMAND LIST, NOT OVER RAW BYTE OFFSETS. An index into raw text is an index
    // into prose, and this block is mostly prose: a comment mentioning a command ahead of where the
    // command runs inverts a byte-offset comparison while changing nothing about what runs.
    expect(
      commands.indexOf("npm run generate:adapters"),
      "the generator must run BEFORE the foundation guard, so a configuration defect is named by the process that refuses it before the guard renders a verdict over the same tree",
    ).toBeLessThan(commands.indexOf("node scripts/check-foundation-guards.js"));
    // The adapter-cleanliness pair runs after the generator whose output it is checking, not
    // before it.
    expect(
      commands.indexOf("npm run generate:adapters"),
      "the adapter-cleanliness pair must run after the generator whose output it checks",
    ).toBeLessThan(commands.indexOf("git status --porcelain -- .claude/agents/"));
    // …and the line that ASSERTS comes after the line that PRINTS. (Plan 29.1-14, R2-IN-05) A bare
    // emptiness assertion fails with no output; the printing line is what makes a red actionable,
    // so its position is part of the guarantee rather than a formatting preference.
    expect(
      commands.indexOf("git status --porcelain -- .claude/agents/"),
      "the printing line must precede the asserting line, or a red names no offending entry",
    ).toBeLessThan(
      commands.indexOf('test -z "$(git status --porcelain -- .claude/agents/)"'),
    );

    // NO STEP RUNS THE LIVE e2e LANE. `npm test` spends tokens against an authed box and is not a
    // gate; the workflow's regression command is the excluded form. THESE TWO ARE ABOUT THE WHOLE
    // FILE BY DESIGN and are deliberately NOT scoped to the block: a `npm test` in any step, in any
    // job, in any OS leg is the thing being forbidden.
    expect(ci).not.toContain("run: npm test");
    expect(ci).toContain("npx vitest run --exclude '**/scripts/e2e/**'");
  });

  // (Plan 29.1-14, R2-WR-02) THE CLASS, NOT ONLY THE INSTANCE.
  //
  // THE SHARED-HELPER DISPOSITION, STATED RATHER THAN LEFT TO INFERENCE. `ubuntuBlock` is NOT shared
  // with scripts/skill-twins-freshness.test.ts. Sharing it would mean either copying the helper —
  // two authorities over one predicate, the defect this round is deleting elsewhere — or promoting
  // it into a production module that only tests consume, which is a shipped surface added for a test
  // and is the same trade in the other direction. So each file bounds its own slice, and the CLASS
  // is closed HERE instead: this case derives the set of readers from the filesystem and requires
  // every one of them to carry the right bound. The authority over "is this class bounded" is one
  // assertion, even though the slicing is written twice.
  //
  // The bound is required in its CANONICAL SOURCE SPELLING — the bytes `JSON.stringify(STEP_MARKER)`
  // produces. That is a declared canonical form, not a parser: an equivalent bound written some
  // other way reds here and the remedy is to spell it the one way, which is the point.
  it("(r-class) every test file locating the ubuntu block by step name bounds it on the right", () => {
    const scriptsDir = join(ROOT, "scripts");
    const testFiles = readdirSync(scriptsDir)
      .filter((f) => f.endsWith(".test.ts"))
      .sort();
    const textOf = (f: string) => readFileSync(join(scriptsDir, f), "utf8");
    const members = testFiles.filter((f) => textOf(f).includes(UBUNTU_BLOCK_STEP_NAME));

    // VACUITY FLOOR ON THE DENOMINATOR. A derived set that silently came back empty would make the
    // per-member assertion below pass over nothing — the shape that lets a scan report a clean
    // result about a corpus it never read.
    expect(
      members.length,
      `the derived reader set must be non-empty — ${testFiles.length} .test.ts file(s) were scanned in ${scriptsDir} and none carried the step name "${UBUNTU_BLOCK_STEP_NAME}", which means the scan, not the tree, is broken`,
    ).toBeGreaterThan(0);

    const boundMarkerSource = JSON.stringify(STEP_MARKER).slice(1, -1);
    const unbounded = members.filter((f) => !textOf(f).includes(boundMarkerSource));
    expect(
      unbounded,
      `every test file that locates the ubuntu gate block by its step name must bound the slice on the right with the source spelling \`${boundMarkerSource}\` (the bytes JSON.stringify(STEP_MARKER) produces). Members found (${members.length}): ${JSON.stringify(members)}. Members missing the bound (${unbounded.length}): ${JSON.stringify(unbounded)}. Expected member count: ${UBUNTU_BLOCK_READER_COUNT}.`,
    ).toEqual([]);

    // TWO-SIDED. A third reader joining the class is a red here even when it happens to be bounded,
    // because the pinned number is what makes a new member visible at all.
    expect(
      members.length,
      `the number of test files locating the ubuntu gate block by step name is pinned at ${UBUNTU_BLOCK_READER_COUNT}; found ${members.length}: ${JSON.stringify(members)}. A new reader is not a failure — bound it, then update the pin in the same commit.`,
    ).toBe(UBUNTU_BLOCK_READER_COUNT);
  });
});
