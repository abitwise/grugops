// check-audit-register.ts — Phase 28 AUDIT-01 disposition-register completeness gate (D-05).
//
//   node scripts/check-audit-register.js
// Exit 0 = the register is complete and internally consistent; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path (transitively, through the modules it
// imports). Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS IS A CHECK AND NOT A CLAIM.
//
// Phase 29's roadmap entry declares a dependency on this register, and Phase 30 consumes the claim
// registry beside it. A `.planning/phases/28-.../` artifact is ARCHIVED AT MILESTONE CLOSE and is
// invisible to CI, so "the register is complete" written in a planning document is a sentence that
// stops being true without anything going red. The register therefore lives under `docs/` as a
// durable repo artifact, and this gate holds its completeness on every CI run.
//
// It lives under `docs/` and NOT under `agent-factory/` on purpose: install/install.ts copies the
// whole `agent-factory/` tree into every host repository, and an internal audit record is not
// something a user should find in their own repo.
//
// THIS GATE IS EXPECTED TO FAIL RED UNTIL THE READ PASS IN 28-06 AND 28-07 FILLS THE REGISTER.
// That is deliberate and it is the acceptance evidence for the same argument D-24 makes about the
// AUDIT-02 drift guard: a completeness gate that goes green the moment it appears has never been
// watched distinguish a complete register from an empty one. Measured at the commit that introduced
// it: exit 1, 37 empty observations and 37 unfilled safety-surface flags, with BOTH D-03 equalities
// already green — so the red is precisely the unread files and nothing else.
//
// THE THROW-VERSUS-REPORT SPLIT. scripts/audit-model.ts is a LIBRARY and throws on a register it
// cannot vouch for. This is a GATE and must REPORT: a stack trace is not a verdict, and a gate that
// dies is not a gate that failed. Every parse refusal is caught below and printed through fail().
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  readRegister,
  readRegistry,
  isBlank,
  CLAIM_KINDS,
  REGISTER_PATH,
  REGISTRY_PATH,
  type ClaimKind,
  type Register,
  type RegisterRow,
} from "./audit-model.js";
import { listRoles, listWorkflows } from "./kit-model.js";
// The public-document scan set, taken from the ONE module that DERIVES it rather than restated as a
// directory literal here. It is one of the two derivations equality four measures the registry arm
// against; see the equality-four block for why a derived vouching set is what layer one needs.
import { publicDocsScan } from "./check-public-docs-vocabulary.js";
// The D-02 protocol file, taken from the ONE place it is declared rather than retyped here. It is
// the single intended member of the uncounted arm, and the uncounted pin below is written against
// this literal so the two cannot disagree (28-REVIEW WR-12).
import { PROTOCOL_FILE } from "./audit-prepass.js";
import {
  renderSafetySurface,
  OUT as SAFETY_SURFACE_PATH,
  REGEN_COMMAND as SAFETY_SURFACE_REGEN,
} from "./generate-safety-surface.js";

// CHECK_ROOT override is load-bearing: the Vitest harness builds a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

// Exported accessor so a later aggregator can fold this gate's verdict without reaching for a
// shared global (the check-uat-oracles precedent).
export const auditRegisterFails = (): number => FAILS;

const ROLES_SUBPATH = "agent-factory/roles";
const WORKFLOWS_SUBPATH = "agent-factory/workflows";

// ---------------------------------------------------------------------------
// THE BARE-OBSERVATION SET, WITH ITS BOUND AND ITS FORBIDDEN ALTERNATIVE.
//
// D-06 requires every row to carry a SUBSTANTIVE observation rather than the bare word describing
// an absence of findings, and this is that requirement ENFORCED rather than requested. An agent
// writing "clean" into 37 rows would produce a green gate over an audit that never happened
// (T-28-14), and this is as far as a mechanism can go against it.
//
// THE BOUND, STATED HONESTLY. This catches an observation that IS one of these, whole. It cannot
// catch a fluent, plausible, false observation, and no mechanism can — that residual is named in
// the register's own `## What this register does not prove` section rather than implied away here.
//
// THE FORBIDDEN ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: making this a
// SUBSTRING ban. "Clean of retired vocabulary, but the tier table at line 40 still predates the
// tier names" is a real observation, and banning the token would make correct text unsayable — the
// same trap dead-vocabulary.ts's header records twice. The comparison is against the WHOLE
// observation, normalized only for case and trailing punctuation.
// ---------------------------------------------------------------------------
const BARE_OBSERVATIONS: readonly string[] = [
  "clean",
  "none",
  "n/a",
  "na",
  "ok",
  "fine",
  "good",
  "nothing",
  "no findings",
  "no finding",
  "no issues",
  "nothing found",
  "none found",
  "no drift",
  "verified",
  "read",
  "done",
  // A bare NON-ANSWER rather than an absent value. `—`, `–` and `-` are handled by
  // audit-model.isBlank (they stand where a value belongs); these stand where an ANSWER belongs and
  // supply none, which is the same act D-06 refuses. Kept here rather than widened into isBlank,
  // because isBlank is also what readRegister uses to decide whether a `deferred` row named a target
  // phase — and "tbd" as a target phase is a different question from "tbd" as an observation.
  "?",
  "tbd",
  "todo",
];

function normalizeObservation(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.!;,]+$/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// EQUALITY FOUR — THE REGISTRY ARM OF THE D-18 UNION, PINNED IN BOTH DIRECTIONS.
//
// WHY THIS ARM EXISTS (29-REVIEW round 3, WR-06 with CR-02 supplying the other direction). The
// D-18 union is `register rows flagged safety_surface: yes` UNION `registry rows of kind: safety`
// (generate-safety-surface.ts:73-101). Round 2 pinned that union TWICE and both pins landed on the
// REGISTER arm: equality three above pins the register's flagged set two-sided, and
// check-diff-disposition pins `derivedKit ⊆ corpus.watched` plus a derived count. Containment is
// one-directional BY DESIGN, so the REGISTRY arm — four files on the live tree, two of them present
// by registry reason ALONE — was unpinned in BOTH directions.
//
// Round 3 reproduced it end to end: flip ONE `kind:` cell from `safety` to `architecture` and
// README.md leaves the union (41 -> 40) AND the watched corpus, while check-audit-register and
// check-claim-anchors both exit 0 and the consumer's containment pin does not fire — because
// README.md was never a kit file and containment cannot miss what it never covered.
//
// IT LIVES BESIDE EQUALITY THREE ON PURPOSE. The two arms of one union are pinned side by side, at
// the source, which is where equality three's own comment says the equality belongs. A registry
// check bolted onto a kit-shaped floor somewhere else is what round 2 shipped.
//
// THE ARM IS DERIVED FROM THE PARSER, NEVER FROM RENDERED TEXT. `safetySurfaceUnion` renders a
// reason sentence per entry ("home of safety claim C-28-NNN"); a check that parsed that sentence
// would be a second grammar over a third artifact, which is the class this phase exists to delete.
// ---------------------------------------------------------------------------

/**
 * THE SAFETY ARM'S ROSTER — which claim lives where, keyed by the registry's OWN primary key.
 *
 * WHY IT EXISTS, AND IT IS NOT WHAT THE PLAN FIRST SPECIFIED. This plan specified the per-kind
 * cardinality below as the whole REMOVE direction, and named a hand-written list of protected file
 * paths as the refused alternative. The mandated adversarial pass against that implementation found
 * a live bypass of exactly the class this round exists to close, and it was MEASURED rather than
 * argued: rehome a `kind: safety` claim from `README.md` to another VOUCHED public document,
 * transplant its verbatim and its anchor comment with it, and `README.md` leaves the D-18 exclusion
 * list while all seven gates exit 0. The kind counts never move — 6 safety claims before and 6
 * after — so a cardinality cannot see it, and the residue count at the consumer cannot either,
 * because the arm still contributes three markdown files. A count is blind to MEMBERSHIP by
 * construction, which is the same "two errors that cancel" shape plan 29-28's own adversarial pass
 * found one layer down.
 *
 * WHY THIS IS NOT THE ALTERNATIVE THE PLAN REFUSED. The refused shape is a list of PROTECTED FILE
 * PATHS — a set that GRANTS protection, drifts silently when a document is renamed, and answers the
 * question layer one already answers by derivation. This is keyed by CLAIM ID, the registry's own
 * primary key: it is the arm's ROSTER, an assertion about what the registry SAYS rather than a
 * grant of protection, and every one of its files must independently pass layer one's derived
 * containment before it means anything. It fails CLOSED — any add, delete or rehome reds until it
 * is updated — and its update is a same-commit companion to the registry edit (D-04), which is the
 * same standing D-25 gives roleCeiling()'s hand-maintained table.
 *
 * IT IS THE ONE AUTHORITY FOR THE SAFETY ARM'S SIZE. CLAIM_KIND_CARDINALITY's `safety` entry is
 * derived from this list's length rather than written twice.
 */
export const SAFETY_CLAIM_HOMES: readonly {
  readonly claim: string;
  readonly file: string;
}[] = [
  { claim: "C-28-001", file: "README.md" },
  { claim: "C-28-010", file: "AGENTS.md" },
  { claim: "C-28-018", file: "AGENTS.md" },
  { claim: "C-28-023", file: "agent-factory/README.md" },
  { claim: "C-28-032", file: "agent-factory/README.md" },
  { claim: "C-28-038", file: ".claude-plugin/plugin.json" },
];

/**
 * THE PER-KIND MEASUREMENT BASELINE — the REMOVE direction, and the only hand-declared number here.
 *
 * WHY A BASELINE IS LEGITIMATE FOR THIS COLUMN AND FOR NOTHING ELSE IN THIS GATE. Nothing in this
 * repository independently derives WHICH claims are safety claims. `kind` is an EDITORIAL
 * classification made by the reader who filed the claim, so the direction round 3 reproduced — a
 * `safety` cell quietly becoming an `architecture` cell — has no derivation to be measured against.
 * Every other set in this gate is derived (the kit listers, publicDocsScan, the registry parse) and
 * stays derived.
 *
 * IT IS LEGITIMATE UNDER D-25 because it is a MEASUREMENT, not a discovery set, and it fails
 * CLOSED: a claim that is added, deleted, or reclassified makes this gate RED until somebody
 * updates the map, rather than quietly widening what the gate accepts.
 *
 * IT IS LEGITIMATE UNDER D-04 for the same reason from the other side: the update is a SAME-COMMIT
 * companion edit to the registry change that caused it, so the reclassification and its
 * acknowledgement land together and are reviewable as one act.
 *
 * THE REFUSED ALTERNATIVE, NAMED SO IT IS NOT REDISCOVERED AS A GOOD IDEA: a hand-written list of
 * PROTECTED FILE PATHS. D-01 refuses that outright — it is the maintained set-literal this whole
 * phase exists to delete, it would drift silently the first time a public document was renamed, and
 * it would answer a question (which files) that layer one already answers by derivation. A
 * cardinality answers only the question no derivation can: how many claims each editorial class
 * carries.
 *
 * ITS OWN FLOOR IS BELOW. A map that loses a kind takes that kind's rows with it and every
 * remaining equality still holds, which is this project's set-literal-drift class one level up. The
 * SUM of these counts must equal the registry's total claim count, and the map must name every
 * legal kind.
 */
export const CLAIM_KIND_CARDINALITY: readonly {
  readonly kind: ClaimKind;
  readonly count: number;
}[] = [
  // DERIVED from the roster below, never declared twice. The roster is the authority for the safety
  // arm; a second literal here would be two opinions about one number, which is the shape this
  // phase's record has now had to correct four times.
  { kind: "safety", count: SAFETY_CLAIM_HOMES.length },
  // 28 -> 32 (plan 29-52, D-54). FOUR ROWS ADDED, NONE RECLASSIFIED. `C-28-043` .. `C-28-046` freeze
  // the four paragraphs inside `check-banned-claims`'s one named exemption region that carried a
  // banned-claim occurrence and sat inside no registry-anchored block. They are `architecture` for
  // the same reason `C-28-039` .. `C-28-042` are: each states grugops's own posture about what the
  // kit does and does not claim, and none of them depends on a safety floor. This gate refused until
  // the number moved, which is the companion edit D-04 requires arriving as one act; the number was
  // taken from that refusal's own text ("architecture declares 28 but the registry carries 32").
  // 32 -> 33 (plan 29.1-06, D-16). ONE ROW ADDED, NONE RECLASSIFIED. `C-28-047` is the model dial's
  // cost denial: the kit ships a per-role model dial and claims no saving from any tier assignment,
  // and MODEL-07's totality half is held as CONTENT under the D-59 precedent rather than as a fourth
  // literal group in check-banned-claims. It is `architecture` for the same reason `C-28-039` ..
  // `C-28-046` are: it states grugops's own posture about what the kit does and does not claim, and
  // it depends on no safety floor. This gate refused until the number moved, which is the companion
  // edit D-04 requires arriving as one act; the number was taken from that refusal's own text
  // ("architecture declares 32 but the registry carries 33").
  { kind: "architecture", count: 33 },
  { kind: "install", count: 8 },
];

/**
 * The registry arm's NON-MARKDOWN members, declared with their reason.
 *
 * WHY THIS EXISTS AT ALL. Layer one measures the arm against `publicDocsScan()` UNION the derived
 * kit, and BOTH derivations are markdown-only by construction — publicDocsScan filters on `.md` and
 * the kit listers derive `.md` role and workflow files. Measured on the live tree, the registry arm
 * carries exactly one non-markdown member, so letting a non-markdown path fall through unchecked
 * would leave the whole class unvouched-for. It is declared here instead, in the shape
 * PUBLIC_DOCS_EXEMPT and the uncounted pin above already use.
 *
 * IT IS USED IN THE ADD DIRECTION ONLY, AND THAT IS DELIBERATE. A two-sided pin here would be a
 * SECOND, WEAKER duplicate of the per-kind cardinality: removing this member from the arm drops the
 * `safety` count from 6 to 5 and the cardinality names it. One authority per predicate — the rule
 * this phase's own record has now paid for four times — means the REMOVE direction has exactly one
 * owner, and it is the map above.
 */
export const REGISTRY_ARM_NON_MARKDOWN: readonly {
  readonly file: string;
  readonly why: string;
}[] = [
  {
    file: ".claude-plugin/plugin.json",
    why:
      "the Claude Code plugin manifest — a public distribution surface whose `description` is " +
      "user-facing claim text (C-28-038). Neither vouching derivation can reach it: both are " +
      "markdown-only",
  },
];

export interface RegistryArmInputs {
  /** The parsed registry's claims — id, home file and editorial kind. */
  readonly claims: readonly { id: string; file: string; kind: string }[];
  /** Every path a derivation vouches for: `publicDocsScan()` UNION the derived kit. */
  readonly vouched: readonly string[];
  /** The declared per-kind measurement baseline. */
  readonly cardinality: readonly { kind: string; count: number }[];
  /** The declared safety-arm roster — which claim id lives in which file. */
  readonly roster: readonly { claim: string; file: string }[];
}

/**
 * Equality four's whole verdict, as a list of findings.
 *
 * IT NEVER RETURNS AT THE FIRST DEFECT. A predicate that stopped early would satisfy every
 * single-defect case in the harness and still leave a second arm's drift invisible in exactly the
 * arrangement a real narrowing edit takes — one cell of each arm moving in one commit. The harness
 * asserts the COUNT, not merely the presence of a message.
 *
 * Pure and exported so its two source-level floors (the SUM and the kind coverage) can be driven
 * directly: the declared map lives in THIS file, and a hermetic mirror can perturb a registry but
 * never a constant compiled into the gate.
 */
export function registryArmFindings(i: RegistryArmInputs): string[] {
  const findings: string[] = [];

  const safetyClaims = i.claims.filter((c) => c.kind === "safety");
  const armFiles = [...new Set(safetyClaims.map((c) => c.file))].sort();

  // ── THE VACUITY REFUSAL ────────────────────────────────────────────────────
  // An arm that derives nothing satisfies every equality written over it. This is the argument
  // generate-safety-surface.ts already makes for the empty UNION and kit-model.ts's refuseEmpty()
  // makes for an empty derivation, applied to the ARM — the granularity at which round 3's flip
  // actually operates. Its wording is reused rather than a third one invented.
  if (armFiles.length === 0) {
    findings.push(
      `equality four (the registry arm is EMPTY): ${REGISTRY_PATH} carries ZERO \`kind: safety\` ` +
        `claim(s), so the registry arm of the D-18 union contributes nothing and every equality ` +
        `written over it holds vacuously. A vacuous set passes every guard computed over it, and ` +
        `an exclusion list missing this arm silently permits a style pass over the public ` +
        `documents that host safety claims`,
    );
  }

  // ── LAYER ONE, THE ADD DIRECTION — derived against derived ─────────────────
  // A safety claim naming a file that neither derivation can vouch for puts that file into the
  // D-18 exclusion list on the strength of one editorial cell. This is equality three's
  // "flagged but NOT derived" argument applied to the other arm, and it needs no hand-written list.
  const declaredNonMarkdown = REGISTRY_ARM_NON_MARKDOWN.map((e) => e.file);
  const markdownArm = armFiles.filter((f) => f.endsWith(".md"));
  const nonMarkdownArm = armFiles.filter((f) => !f.endsWith(".md"));

  const strays = markdownArm.filter((f) => !i.vouched.includes(f));
  if (strays.length > 0) {
    findings.push(
      `equality four (safety claim NOT vouched for): ${strays.length} \`kind: safety\` claim(s) ` +
        `name a markdown file that neither derivation vouches for — ${strays.join(", ")}. The ` +
        `vouching set is publicDocsScan() UNION the derived kit (${i.vouched.length} file(s)); a ` +
        `safety claim outside both puts a file into the D-18 exclusion list that nothing in this ` +
        `repository can account for, which is equality three's "flagged but NOT derived" argument ` +
        `applied to the registry arm. The remedy is to correct the claim's \`file\`, or to make ` +
        `the file a public document; widening this check is never the fix`,
    );
  }
  const undeclared = nonMarkdownArm.filter((f) => !declaredNonMarkdown.includes(f));
  if (undeclared.length > 0) {
    findings.push(
      `equality four (undeclared non-markdown safety claim): ${undeclared.length} \`kind: safety\` ` +
        `claim(s) name a NON-markdown file that is not declared in REGISTRY_ARM_NON_MARKDOWN — ` +
        `${undeclared.join(", ")}. Both vouching derivations are markdown-only by construction, so ` +
        `a non-markdown member cannot be derived and is declared by name WITH ITS REASON instead. ` +
        `The declared member(s) are [${declaredNonMarkdown.join(", ")}]. If a second non-markdown ` +
        `file genuinely hosts a safety claim, widen that declaration with its reason — the shape ` +
        `PUBLIC_DOCS_EXEMPT uses — rather than relaxing the check`,
    );
  }

  // ── LAYER TWO(a), THE REMOVE DIRECTION — the arm's ROSTER, two-sided ───────
  //
  // The direction a CARDINALITY is structurally blind to: a rehome preserves every count while
  // moving the arm's membership, and the file that left the exclusion list leaves silently. Pairs
  // are compared, not files, so a claim moved between two files that are BOTH already on the arm is
  // still a named finding.
  const pairKey = (p: { claim: string; file: string }): string => `${p.claim} -> ${p.file}`;
  const derivedPairs = safetyClaims
    .map((c) => pairKey({ claim: c.id, file: c.file }))
    .sort();
  const declaredPairs = i.roster.map(pairKey).sort();
  const rosterMissing = declaredPairs.filter((p) => !derivedPairs.includes(p));
  const rosterUnexpected = derivedPairs.filter((p) => !declaredPairs.includes(p));
  if (rosterMissing.length > 0 || rosterUnexpected.length > 0) {
    findings.push(
      `equality four (safety arm roster): the registry's \`kind: safety\` claims are not the roster ` +
        `SAFETY_CLAIM_HOMES records — declared but ABSENT [${rosterMissing.join("; ")}], present ` +
        `but UNDECLARED [${rosterUnexpected.join("; ")}]. This is the direction a per-kind count is ` +
        `structurally blind to: rehoming a safety claim from one vouched public document to another ` +
        `preserves every count while removing the old home from the D-18 exclusion list entirely, ` +
        `and the removal arrives as a clean build. If the move is correct, update SAFETY_CLAIM_HOMES ` +
        `in the SAME commit as the registry edit (D-04) and say why in the commit message; deleting ` +
        `a roster entry to clear this finding deletes the evidence it is made of`,
    );
  }

  // ── LAYER TWO(b), THE REMOVE DIRECTION — two-sided per-kind cardinality ────
  const derivedCounts = new Map<string, number>();
  for (const c of i.claims) derivedCounts.set(c.kind, (derivedCounts.get(c.kind) ?? 0) + 1);
  const declaredCounts = new Map<string, number>();
  for (const c of i.cardinality) declaredCounts.set(c.kind, c.count);

  // The map's own COVERAGE, derived against CLAIM_KINDS rather than baselined: a legal kind absent
  // from the map is a kind whose rows are measured against nothing.
  const uncovered = CLAIM_KINDS.filter((k) => !declaredCounts.has(k));
  if (uncovered.length > 0) {
    findings.push(
      `equality four (the declared kind map omits a legal kind): CLAIM_KIND_CARDINALITY names no ` +
        `count for [${uncovered.join(", ")}], which audit-model declares legal. A kind absent from ` +
        `the map is a kind whose rows are measured against nothing, so every claim of that kind ` +
        `could be added or reclassified without moving a single number here`,
    );
  }

  const kinds = [...new Set([...declaredCounts.keys(), ...derivedCounts.keys()])].sort();
  const disagreeing = kinds
    .filter((k) => (declaredCounts.get(k) ?? 0) !== (derivedCounts.get(k) ?? 0))
    .map(
      (k) =>
        `${k} declares ${declaredCounts.get(k) ?? 0} but the registry carries ` +
        `${derivedCounts.get(k) ?? 0}`,
    );
  if (disagreeing.length > 0) {
    findings.push(
      `equality four (kind cardinality): ${disagreeing.length} claim kind(s) disagree with the ` +
        `declared measurement baseline — ${disagreeing.join("; ")}. The \`kind\` column decides ` +
        `membership of the D-18 exclusion list's REGISTRY arm, and one cell moved from \`safety\` ` +
        `to another kind removes a file from that list ENTIRELY: the file leaves the LANG-03 ` +
        `watched corpus, guard_diff_disposition simply checks less, and the narrowing arrives as a ` +
        `clean build. The registry lives under \`docs/\` and is NOT itself a member of the corpus ` +
        `it derives, so the edit that performs the narrowing owes no disposition row and nothing ` +
        `downstream can see it. If the reclassification is correct, update CLAIM_KIND_CARDINALITY ` +
        `in the SAME commit (D-04) with the reason in the commit message; LOWERING a count or ` +
        `NARROWING the arm are the two ways to clear this finding by deleting what it measures, ` +
        `and neither is the fix`,
    );
  }

  // ── THE BASELINE'S OWN FLOOR ───────────────────────────────────────────────
  const declaredSum = i.cardinality.reduce((n, c) => n + c.count, 0);
  if (declaredSum !== i.claims.length) {
    findings.push(
      `equality four (the declared kind map is SHORT): CLAIM_KIND_CARDINALITY sums to ` +
        `${declaredSum} claim(s) against ${i.claims.length} parsed from ${REGISTRY_PATH}. A map ` +
        `that loses a kind takes that kind's rows out of the measurement with it and every ` +
        `remaining per-kind equality still holds — the set-literal-drift class one level up. Walk ` +
        `the registry's kinds before treating either number as the one to move`,
    );
  }

  return findings;
}

// ---------------------------------------------------------------------------
// The check.
// ---------------------------------------------------------------------------
function runAll(): void {
  process.stdout.write(
    "\n[check_audit_register] the AUDIT-01 disposition register is complete against the derived kit (D-03 / D-05)\n",
  );

  // ── The derived side ─────────────────────────────────────────────────────
  let derivedRoles: string[];
  let derivedWorkflows: string[];
  try {
    derivedRoles = listRoles(ROOT).map((f) => `${ROLES_SUBPATH}/${f}`);
    derivedWorkflows = listWorkflows(ROOT).map((f) => `${WORKFLOWS_SUBPATH}/${f}`);
  } catch (e) {
    // kit-model throws on an unreadable or VACUOUS directory. Reporting a completeness verdict
    // against a set that could not be derived would be a fabricated verdict — an empty derived set
    // makes the equality trivially satisfiable, which is exactly what the library's throw prevents.
    fail(
      `the audit set could not be derived from scripts/kit-model.js — ${(e as Error).message}. ` +
        `Refusing to report a completeness verdict against a set that was never read`,
    );
    finish();
    return;
  }

  const derived = [...derivedRoles, ...derivedWorkflows].sort();

  // ── The register side ────────────────────────────────────────────────────
  let register: Register;
  try {
    register = readRegister(ROOT);
  } catch (e) {
    fail(
      `${REGISTER_PATH} could not be parsed — ${(e as Error).message}. The parse authority refuses ` +
        `what it cannot vouch for rather than skipping it, because a skipped row is a silent ` +
        `truncation and a truncated register satisfies every equality computed over it`,
    );
    finish();
    return;
  }

  const counted = register.rows.filter((r) => r.counted);
  const uncounted = register.rows.filter((r) => !r.counted);

  // ── EVERY ROW NAMES A FILE THAT EXISTS ───────────────────────────────────
  //
  // 28-REVIEW WR-12. Equality one below constrains only the `counted: yes` rows. An UNCOUNTED row
  // was reported by name and otherwise unconstrained — nothing checked that its file existed — yet
  // an uncounted row with `safety_surface: yes` enters safetySurfaceUnion() and therefore the D-18
  // exclusion list Phase 29 consults. audit-prepass does a missing-file check on ITS copy of the
  // same set; this gate did not.
  //
  // Checked over EVERY row rather than only the uncounted ones: a counted row naming a vanished file
  // is already caught by equality one, and asking the cheaper question first gives the reader the
  // precise cause rather than a set difference to interpret. The message deliberately avoids the
  // words equality one uses, so the two failures stay distinguishable in one run.
  const missingOnDisk = register.rows.filter((r) => !existsSync(join(ROOT, r.file)));
  if (missingOnDisk.length > 0) {
    fail(
      `${missingOnDisk.length} register row(s) name a file that is not on disk — ` +
        `${missingOnDisk.map((r) => `${r.file} (line ${r.line})`).join(", ")}. A row about a file ` +
        `that does not exist records a read that could not have happened, and an UNCOUNTED such row ` +
        `is constrained by nothing else while still feeding the D-18 exclusion list`,
    );
  }

  // ── THE UNCOUNTED ARM IS PINNED, NOT LEFT OPEN ───────────────────────────
  //
  // SET equality against the one literal that declares this member, in both directions — never a
  // bare count. A count would pass while a decoy displaced the protocol row, which is the same
  // argument equality one makes about its own set twenty lines below. Adding a second out-of-set
  // file is a real decision and it now requires an edit here, with a reason, rather than passing
  // silently: the review measured that a second uncounted row kept this gate green.
  const uncountedPaths = uncounted.map((r) => r.file).sort();
  const expectedUncounted = [PROTOCOL_FILE];
  if (uncountedPaths.join("\n") !== expectedUncounted.join("\n")) {
    fail(
      `the register's uncounted rows are [${uncountedPaths.join(", ")}], expected exactly ` +
        `[${expectedUncounted.join(", ")}]. An uncounted row is invisible to equality one yet feeds ` +
        `the D-18 exclusion list through safetySurfaceUnion(), so the arm's membership is pinned ` +
        `rather than left open. If a second file genuinely belongs out-of-set for counting, widen ` +
        `this expectation WITH ITS REASON — the shape PUBLIC_DOCS_EXEMPT uses — rather than ` +
        `relaxing the check`,
    );
  }

  // ── EQUALITY ONE — SET equality, in BOTH directions ──────────────────────
  //
  // This is SET equality on purpose. A count would pass while a decoy displaced a real member: 36
  // rows compared against 36 derived files agree perfectly while one row names a file that does not
  // exist and one file that does exist has no row. Both lists are reported in the DERIVED SORTED
  // order, so two runs over the same tree produce byte-identical output and a diff means a real
  // change rather than a reshuffle.
  const countedPaths = counted.map((r) => r.file).sort();
  if (countedPaths.join("\n") !== derived.join("\n")) {
    const missing = derived.filter((f) => !countedPaths.includes(f));
    const unexpected = countedPaths.filter((f) => !derived.includes(f));
    fail(
      `equality one: the register's counted rows are not exactly what the listers derive — ` +
        `missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}]. The register ` +
        `carries ${countedPaths.length} counted row(s) against ${derived.length} derived file(s) ` +
        `(${derivedRoles.length} roles + ${derivedWorkflows.length} workflows). This is SET ` +
        `equality on purpose: a count would pass while a decoy displaced a real member`,
    );
  }

  // ── EQUALITY THREE — the FLAGGED rows are the derived kit, both directions ─
  //
  // WHY THIS ARM EXISTS (29-REVIEW round 2, CR-01). Equality one pins the counted ROW SET and
  // nothing pinned this column's VALUES — yet the `safety_surface: yes` rows are the larger arm of
  // the D-18 union, and that union is guard_diff_disposition's ENTIRE left-hand side. The review
  // reproduced the consequence end to end on the live tree: reword a frozen `## Hard limits`
  // sentence (one gate reds), flip ONE cell here from `yes` to `no`, regenerate, and all four gates
  // exit 0 together. The gate's own finding text already said "do NOT narrow the watched corpus" —
  // a prohibition with no mechanism.
  //
  // THE ASYMMETRY THAT MADE IT INVISIBLE, and it is in the REFUSAL rather than only in this
  // comment, because the person who meets the red is the person who needs it: this register lives
  // under `docs/` and is therefore not itself a member of the corpus it derives, so the edit that
  // performs the narrowing owes no disposition row anywhere.
  //
  // TWO DIRECTIONS, REPORTED AS TWO DEFECTS. They are different acts with different remedies — one
  // de-scopes a file that is audited, the other admits a file that is not — and equality two records
  // twenty lines below why a conflated tally is refused here: one number absorbs the other's drift.
  //
  // It reuses `derived` from line 160 rather than re-deriving the kit, so equality one and equality
  // three cannot come to disagree about what the derived set is.
  const flagged = counted
    .filter((r) => r.safetySurface === "yes")
    .map((r) => r.file)
    .sort();
  const unflagged = derived.filter((f) => !flagged.includes(f));
  const strayFlags = flagged.filter((f) => !derived.includes(f));
  if (unflagged.length > 0) {
    fail(
      `equality three (derived but NOT flagged): ${unflagged.length} derived kit file(s) are ` +
        `absent from the set of counted rows flagged \`safety_surface: yes\` — ` +
        `${unflagged.join(", ")}. A derived kit file that is not flagged is REMOVED from the ` +
        `LANG-03 watched corpus entirely: guard_diff_disposition simply checks less and stays ` +
        `green, so the narrowing arrives as a clean build rather than as a failure. This register ` +
        `lives under \`docs/\` and is NOT itself a member of the corpus it derives, which is why ` +
        `the edit that performs the narrowing owes no disposition row and nothing downstream can ` +
        `see it. The remedy is to restore the flag, or to record the exception WITH ITS REASON — ` +
        `the shape the uncounted pin above uses; lowering or deleting this assertion is never the fix`,
    );
  }
  if (strayFlags.length > 0) {
    fail(
      `equality three (flagged but NOT derived): ${strayFlags.length} counted row(s) flagged ` +
        `\`safety_surface: yes\` name a file the listers do not derive — ${strayFlags.join(", ")}. ` +
        `A flagged counted row outside the audited set puts a file into the D-18 exclusion list ` +
        `that this register was never able to vouch for. Reported separately from the direction ` +
        `above and from equality one: neither number may absorb the other's drift`,
    );
  }

  // ── EQUALITY FOUR — the REGISTRY arm, both directions (see the block above) ─
  //
  // The parse is wrapped: audit-model is a LIBRARY and throws on a registry it cannot vouch for,
  // and this is a GATE that must REPORT. A stack trace is not a verdict.
  let registryClaims: readonly { id: string; file: string; kind: string }[] | null = null;
  try {
    registryClaims = readRegistry(ROOT).claims.map((c) => ({
      id: c.id,
      file: c.file,
      kind: c.kind as string,
    }));
  } catch (e) {
    fail(
      `${REGISTRY_PATH} could not be parsed, so the REGISTRY arm of the D-18 union could not be ` +
        `measured and NO verdict is reported over it — ${(e as Error).message}`,
    );
  }
  // The vouching set, taken from the two DERIVATIONS and nothing else. `derived` is reused from
  // above so equalities one, three and four cannot come to disagree about what the kit is.
  const vouched = [...new Set([...publicDocsScan(), ...derived])].sort();
  const safetyClaimCount =
    registryClaims === null ? 0 : registryClaims.filter((c) => c.kind === "safety").length;
  const registryArmFiles =
    registryClaims === null
      ? []
      : [...new Set(registryClaims.filter((c) => c.kind === "safety").map((c) => c.file))].sort();
  if (registryClaims !== null) {
    for (const f of registryArmFindings({
      claims: registryClaims,
      vouched,
      cardinality: CLAIM_KIND_CARDINALITY,
      roster: SAFETY_CLAIM_HOMES,
    })) {
      fail(f);
    }
  }

  // ── EQUALITY TWO — independent, and at TWO granularities ─────────────────
  //
  // Reported SEPARATELY from equality one. A single conflated tally lets one number absorb the
  // other's drift, which is the conflation that broke the backstop-marker accounting in this
  // project: a total that double-counts can never close, and the equality quietly stops meaning
  // anything while continuing to hold.
  const declaredSum = register.rows.reduce((n, r) => n + r.findings, 0);
  if (declaredSum !== register.findings.length) {
    fail(
      `equality two: Table A declares ${declaredSum} finding(s) in total, but Table B carries ` +
        `${register.findings.length} finding row(s). Neither number may absorb the other's drift, ` +
        `so this is reported independently of equality one`,
    );
  }

  // The per-file granularity. The two totals can agree while two individual files are each wrong in
  // opposite directions, which is precisely why one tally is not enough.
  const actualPerFile = new Map<string, number>();
  for (const f of register.findings) {
    actualPerFile.set(f.file, (actualPerFile.get(f.file) ?? 0) + 1);
  }
  const perFileMismatches: string[] = [];
  for (const row of register.rows) {
    const actual = actualPerFile.get(row.file) ?? 0;
    if (actual !== row.findings) {
      perFileMismatches.push(`${row.file} declares ${row.findings} but Table B carries ${actual}`);
    }
  }
  if (perFileMismatches.length > 0) {
    fail(
      `equality two (per file): ${perFileMismatches.length} row(s) declare a findings count that ` +
        `disagrees with their own Table B rows — ${perFileMismatches.join("; ")}`,
    );
  }

  // ── D-06's substantive-observation requirement ───────────────────────────
  //
  // THE BLANK TEST CONSUMES THE ONE AUTHORITY (28-REVIEW CR-04). It read
  // `normalizeObservation(row.observation) === ""`, which is a THIRD definition of "blank" inside
  // one phase and the only one that disagreed — on the register's OWN unfilled marker. `observation:
  // —` was neither blank nor bare and passed as substantive, while the D-18 arm sixteen lines below
  // caught `safety_surface: —`. audit-model.isBlank is now the single element-level authority; this
  // gate asks it rather than re-deriving the predicate.
  const blank: string[] = [];
  const bare: string[] = [];
  for (const row of register.rows) {
    if (isBlank(row.observation)) {
      blank.push(`${row.file} (line ${row.line})`);
      continue;
    }
    const norm = normalizeObservation(row.observation);
    if (BARE_OBSERVATIONS.includes(norm)) {
      bare.push(`${row.file} (line ${row.line}): "${row.observation.trim()}"`);
    }
  }
  if (blank.length > 0) {
    fail(
      `${blank.length} row(s) carry a BLANK observation — ${blank.join(", ")}. D-06 requires a ` +
        `substantive observation per row: an empty observation, or a placeholder glyph standing ` +
        `where one belongs, records that nobody wrote anything — the honest reading of an unread ` +
        `file, and not a completed row. "Blank" is audit-model.isBlank's closed set and is not ` +
        `re-derived here`,
    );
  }
  if (bare.length > 0) {
    fail(
      `${bare.length} row(s) carry a BARE observation standing in for a substantive one — ` +
        `${bare.join("; ")}. The comparison is against the WHOLE observation, so a sentence that ` +
        `merely contains one of these words is fine; what is refused is the word standing alone`,
    );
  }

  // ── D-18's safety_surface, and the unfilled marker ───────────────────────
  const unfilled = register.rows.filter((r) => r.safetySurface === "—");
  if (unfilled.length > 0) {
    fail(
      `${unfilled.length} row(s) still carry the unfilled \`safety_surface\` marker "—" — ` +
        `${unfilled.map((r) => `${r.file} (line ${r.line})`).join(", ")}. D-18 derives Phase 29's ` +
        `LANG-02 exclusion list from this column unioned with the claim registry's safety rows, so ` +
        `an unrecorded flag becomes a missing exclusion two phases later. The marker parses and ` +
        `fails here on purpose: writing \`no\` into an unread row would record a verdict nobody reached`,
    );
  }

  // ── The uncounted rows are REPORTED, never invisible ──────────────────────
  // An out-of-set file recorded as a row and then never mentioned again is a file dropped in a
  // slower way. Every uncounted row is named on every run, with the reason its observation carries.
  const uncountedReport = uncounted
    .map((r) => `${r.file} — ${describeUncounted(r)}`)
    .join("; ");

  // The D-18 derived exclusion list is checked against a fresh regeneration on the same run, from
  // the same ROOT, so a flag flipped in the register above cannot leave a stale list downstream.
  checkSafetySurfaceFreshness();

  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed. Every number below is read from
    // the run that just happened: the derived counts come from the listers, the register counts
    // from the parsed rows, and the findings totals from the two tables that were just compared.
    // The freshness clause is only reachable when checkSafetySurfaceFreshness() regenerated the
    // list and byte-compared it — it fails and returns on every other path.
    pass(
      `AUDIT-01 completeness: equality one holds — ${countedPaths.length} counted register row(s) ` +
        `set-equal in both directions to ${derived.length} derived file(s) ` +
        `(${derivedRoles.length} roles + ${derivedWorkflows.length} workflows); equality three ` +
        `holds — the ${flagged.length} counted row(s) flagged \`safety_surface: yes\` are set-equal ` +
        `in both directions to those same ${derived.length} derived file(s), so no kit file has ` +
        `been de-scoped out of the LANG-03 watched corpus; equality four holds — the union's OTHER ` +
        `arm carries ${safetyClaimCount} \`kind: safety\` claim(s) naming ` +
        `${registryArmFiles.length} distinct file(s) (${registryArmFiles.join(", ")}), every ` +
        `markdown one vouched for by publicDocsScan() or the derived kit (${vouched.length} ` +
        `file(s)) and ${REGISTRY_ARM_NON_MARKDOWN.length} non-markdown one(s) declared by name, ` +
        `set-equal as CLAIM->HOME pairs to the ${SAFETY_CLAIM_HOMES.length}-entry roster ` +
        `SAFETY_CLAIM_HOMES, with the registry's kind distribution exactly ` +
        `${CLAIM_KIND_CARDINALITY.map((c) => `${c.kind} ${c.count}`).join(", ")} summing to the ` +
        `${registryClaims === null ? 0 : registryClaims.length} claim(s) parsed; equality two holds ` +
        `— Table A declares ${declaredSum} finding(s) and Table B carries ${register.findings.length}, ` +
        `agreeing per file across all ${register.rows.length} row(s); ${uncounted.length} uncounted ` +
        `row(s) recorded by name (${uncountedReport}); every observation substantive and every ` +
        `safety_surface recorded; and ${SAFETY_SURFACE_PATH} is byte-identical to a fresh ` +
        `regeneration of the D-18 union`,
    );
  }

  finish();
}

// ── The D-18 exclusion-list freshness guard ──────────────────────────────────────────────────
//
// WHY IT LIVES IN THIS GATE AND NOT IN A SEVENTH SCRIPT. `docs/audit/28-safety-surface-exclusions.md`
// is derived from two artifacts — this register and the claim registry — and a separate module
// would need its own reader for at least one of them, which is the second-grammar-over-one-file
// class this phase exists to refuse. It belongs HERE specifically because this gate is the one that
// enforces the `safety_surface` column's completeness, and that column is the exclusion list's
// larger arm: the check that every flag is recorded and the check that the derived list matches
// those flags are two halves of one question. (The claim registry's own completeness stays with
// scripts/check-claim-anchors.js; this guard consults it only through the one parse authority, via
// renderSafetySurface, and never parses it here.)
//
// FAIL CLOSED. A missing, unreadable, or divergent list is a FAIL, never a skip. A guard that
// quietly passes when the artifact it protects is absent is worse than no guard, because the phase
// counts it as present while it can never fire.
//
// The comparison is a BYTE compare against an in-memory regeneration — no normalization, no trim.
// A trailing space is a divergence, because the consumer of this file is a reader deciding whether
// a path is on the list and the only way to be sure the list is current is that it is byte-exact.
function checkSafetySurfaceFreshness(): void {
  let rebuilt: string;
  try {
    rebuilt = renderSafetySurface(ROOT);
  } catch (e) {
    fail(
      `${SAFETY_SURFACE_PATH} could not be regenerated — ${(e as Error).message}. Freshness cannot ` +
        `be proven, so it is reported as a failure rather than assumed`,
    );
    return;
  }

  let committed: string;
  try {
    committed = readFileSync(join(ROOT, SAFETY_SURFACE_PATH), "utf8");
  } catch {
    fail(
      `${SAFETY_SURFACE_PATH} could not be read — the derived safety-surface exclusion list is ` +
        `missing or unreadable. Phase 29's LANG-02 and LANG-03 consult it before rewording any kit ` +
        `text, and an absent list reads as "nothing is excluded". Run \`${SAFETY_SURFACE_REGEN}\` ` +
        `and commit the result`,
    );
    return;
  }

  if (committed !== rebuilt) {
    fail(
      `${SAFETY_SURFACE_PATH} is STALE — the committed list differs from a fresh regeneration, so a ` +
        `\`safety_surface\` flag or a \`kind: safety\` claim moved without the derived list being ` +
        `rebuilt. Run \`${SAFETY_SURFACE_REGEN}\` and commit the result`,
    );
  }
}

function describeUncounted(row: RegisterRow): string {
  const obs = row.observation.trim();
  return obs === "" ? "no reason recorded yet" : obs;
}

function finish(): void {
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

// Entry check: true only when launched directly. pathToFileURL rather than a hand-built
// `file://${argv[1]}` — the hand-built form does not match on Windows, which would make a direct
// run perform ZERO checks and exit 0, a fabricated green. It is also what lets the test file import
// the exported accessor without the import running the gate inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
