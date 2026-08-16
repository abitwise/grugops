// check-imperative-lexicon.test.ts — the hermetic harness for the two controlled-language guards.
//
// WHAT THIS FILE IS FOR, AND WHY THE RED TRANSCRIPT ALONE WOULD NOT DO.
//
// `scripts/check-imperative-lexicon.js` was watched FAILING against the real tree before a single
// word of the corpus was rewritten: 81 findings over 125 `## Steps` bullets, and 264 findings over
// 1,816 sentences. That transcript is the D-24 acceptance evidence and it EXPIRES — plans 29-08
// through 29-12 land the rewrites that turn it green, and after that the RED has no live
// reproduction anywhere.
//
// A RED verdict also proves nothing on its own: A GATE THAT ALWAYS FAILS IS TRIVIALLY RED. The
// clean-mirror GREEN control below is what turns the verdict into a measurement — the same
// committed `.js` exits 0 on a conforming corpus and exits 1 on each planted shape.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a trace/quality guard; the acceptable proof is an adversarial
// RED-vs-committed-`.js` reproduction. So every behavioural case here drives the COMMITTED `.js`
// through spawnSync against a hermetic CHECK_ROOT mirror under the OS temp dir — never the `.ts`,
// and never the real tree. Nothing is ever written into the committed tree.
//
// EVERY PLANT IS INTERPOLATED FROM THE MODULE'S OWN EXPORTS. A retyped verb, limit or marker here
// would be a second copy of the authority living in the file that polices it — the set-literal
// drift this repository has diagnosed as one of its two systemic failure classes, landing inside
// the test that exists to prevent it. The mirror's per-part file counts are likewise DERIVED from
// `GOVERNED_CORPUS_PARTS` and `TECHNICAL_NAME_PARTS`, so a mirror that drifts out of shape fails
// the pin case rather than silently testing a different corpus.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-imperative-lexicon.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  copyFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BANNED_CONSTRUCTIONS } from "./voice-model.js";
import { fencedLineFlags } from "./frontmatter.js";
import {
  APPROVED_STEP_VERBS,
  GOVERNED_CORPUS_COUNT,
  GOVERNED_CORPUS_PARTS,
  LEXICON_MEASURED_LABEL,
  SENTENCE_MEASURED_LABEL,
  GOVERNED_CORPUS_EXCLUDED_LOCATIONS,
  GENERATED_MARKER,
  GENERATED_EXEMPT_COUNT,
  PROCEDURAL_SENTENCE_MAX_WORDS,
  DESCRIPTIVE_SENTENCE_MAX_WORDS,
  TECHNICAL_NAMES,
  TECHNICAL_NAMES_COUNT,
  TECHNICAL_NAME_PARTS,
  countWords,
} from "./check-imperative-lexicon.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-imperative-lexicon.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── The plants, taken from the authority BY PROPERTY ────────────────────────────────────────────
//
// Selected by property rather than by index, so a reordering of the verb list cannot silently turn
// a plant into a different verb, and no literal from the authority is ever retyped here.
const VERB = APPROVED_STEP_VERBS[0];
const VERB2 = APPROVED_STEP_VERBS[1];
const ACTOR = TECHNICAL_NAMES.find((n) => n.includes("/"));

// Non-vacuity on the selection itself. A `find` that returned undefined would make the actor plant
// the string "undefined", which classifies as a plain unrecognised word — and the actor-subject case
// would pass while proving nothing about TECHNICAL_NAMES at all.
if (VERB === undefined || VERB2 === undefined || ACTOR === undefined) {
  throw new Error(
    "check-imperative-lexicon.test.ts: a plant could not be selected from the module's exports. " +
      "Every plant below would be the string 'undefined', and the RED cases would pass as green.",
  );
}

const partSize = (name: string): number => {
  const p =
    GOVERNED_CORPUS_PARTS.find((x) => x.name === name) ??
    TECHNICAL_NAME_PARTS.find((x) => x.name === name);
  if (p === undefined) {
    throw new Error(`check-imperative-lexicon.test.ts: no derived part named ${name}`);
  }
  return p.members.length;
};

const WORKFLOW_N = partSize("workflows");
const CHECKLIST_N = partSize("checklists");
const SEED_N = partSize("seedTemplates");
const CONTRACT_N = partSize("contracts");
const ROLE_N = partSize("roleDisplayNames");
const CONFIG_KEY_N = partSize("configKeys");
const NOTE_KIND_N = partSize("noteKinds");
const BOARD_COLUMN_N = partSize("boardColumns");

// ── The mirror ──────────────────────────────────────────────────────────────────────────────────
//
// SYNTHESIZED, NEVER COPIED, for the reason check-public-docs-vocabulary.test.ts records: a
// byte-faithful copy of the real kit is the baseline only while the real kit is CLEAN, and the whole
// subject of this gate is that the real kit is not — it is 81 and 264 findings deep by design until
// plans 29-08..29-12 land. A copied mirror would make every GREEN control a test of the drift.

const CONFORMING_WORKFLOW = (n: number): string =>
  [
    `# Workflow: Fixture Workflow ${n}`,
    "",
    "## Inputs required",
    "- A ticket with acceptance criteria, size, and priority.",
    "",
    "## Steps",
    `1. ${VERB} the shared context first.`,
    `2. ${VERB2} the result as a typed note.`,
    "",
    "## Stop conditions",
    "- The ticket fails the Definition of Ready -> stop and hand back.",
    "",
  ].join("\n");

const CONFORMING_CHECKLIST = (n: number): string =>
  [`# Fixture checklist ${n}`, "", `- ${VERB} the gate result.`, ""].join("\n");

const CONFORMING_SEED = (n: number): string =>
  [`# Fixture seed template ${n}`, "", "Seed content stays short.", ""].join("\n");

const CONFORMING_CONTRACT = (n: number): string =>
  [`# Fixture contract ${n}`, "", "Contract text stays short.", ""].join("\n");

const BOARD_TABLE_HEADER = "| Column | Entry means | Exit owner | WIP (default) |";
const BOARD = "agent-factory/seed/plans/board.md";
const NOTE_CONTRACT = "agent-factory/contracts/context-note.md";
const CONFIG_JSON = "agent-factory/config/factory.config.json";

function boardDoc(columns: number): string {
  const rows = Array.from(
    { length: columns },
    (_, i) => `| Column ${i} | entry rule ${i} | Orchestrator | 4 |`,
  );
  return [
    "# Board",
    "",
    BOARD_TABLE_HEADER,
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

function noteContractDoc(kinds: number): string {
  const rows = Array.from(
    { length: kinds },
    (_, i) => `| \`kind-${i}\` | what it records ${i} |`,
  );
  return [
    "# Contract: context note",
    "",
    "## The six note kinds",
    "",
    "| Kind | What it records |",
    "| --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

function configDoc(keys: number): string {
  const o: Record<string, number> = {};
  for (let i = 0; i < keys; i++) o[`key_${i}`] = i;
  return JSON.stringify(o, null, 2);
}

// The mirror's own role display names. The ACTOR plant is built from THIS rather than from the real
// tree's TECHNICAL_NAMES, because the gate derives its Technical Names from the mirror it is pointed
// at — a plant naming `BA/PM` would be a word the mirror's derivation has never heard of, and the
// case would pass through the `not-an-approved-verb` arm while claiming to prove the actor arm.
const mirrorRoleDisplayName = (n: number): string => `Fixture Role ${n}`;
function roleDoc(n: number): string {
  return [
    `# Role: ${mirrorRoleDisplayName(n)}`,
    "",
    "Role text stays short.",
    "",
  ].join("\n");
}

type MirrorSpec = {
  /** Per-part member counts. Default is the real tree's derived shape. */
  workflows?: number;
  checklists?: number;
  /** How many GENERATED-marked documents the mirror ships. Default is the gate's own pin. */
  generated?: number;
  seed?: number;
  contracts?: number;
  roles?: number;
  boardColumns?: number;
  noteKinds?: number;
  configKeys?: number;
  /** Per-path content overrides, keyed by the same repo-relative path the gate reports. */
  plant?: Record<string, string>;
  /** Extra files written verbatim beyond the derived shape. */
  extra?: Record<string, string>;
};

function makeMirror(prefix: string, spec: MirrorSpec = {}): string {
  const mirror = freshTmp(prefix);
  const plant = spec.plant ?? {};
  const write = (rel: string, fallback: string): void => {
    const dst = join(mirror, rel);
    mkdirSync(join(dst, ".."), { recursive: true });
    writeFileSync(dst, plant[rel] ?? fallback, "utf8");
  };
  // The four corpus directories always EXIST, so the walk has something to reach; whether each
  // derives any member is what the per-part vacuity cases vary.
  for (const d of [
    "agent-factory/workflows",
    "agent-factory/checklists",
    "agent-factory/seed/plans",
    "agent-factory/contracts",
    "agent-factory/roles",
  ]) {
    mkdirSync(join(mirror, d), { recursive: true });
  }

  const nWorkflows = spec.workflows ?? WORKFLOW_N;
  for (let i = 0; i < nWorkflows; i++) {
    write(
      `agent-factory/workflows/${String(i).padStart(2, "0")}-fixture.md`,
      CONFORMING_WORKFLOW(i),
    );
  }
  const nChecklists = spec.checklists ?? CHECKLIST_N;
  for (let i = 0; i < nChecklists; i++) {
    write(
      `agent-factory/checklists/${String(i).padStart(2, "0")}-fixture.md`,
      CONFORMING_CHECKLIST(i),
    );
  }
  // THE MIRROR SHIPS THE GENERATED DOCUMENT TOO, because the derived exclusion's cardinality is
  // pinned TWO-SIDED: a mirror with no generated file fails that pin, and every behavioural case
  // would then be measuring a corpus the gate had already refused. The count is derived from the
  // gate's own pin, so a change there moves this automatically.
  const nGenerated = spec.generated ?? GENERATED_EXEMPT_COUNT;
  for (let i = 0; i < nGenerated; i++) {
    write(
      `agent-factory/checklists/zz-generated-${i}.md`,
      `<!-- ${GENERATED_MARKER} — do not hand-edit. -->\n\n# Generated fixture ${i}\n\n- The row is copied verbatim.\n`,
    );
  }
  // The seed part always carries the board (a derived Technical Names source); the rest are fillers.
  const nSeed = spec.seed ?? SEED_N;
  if (nSeed > 0) write(BOARD, boardDoc(spec.boardColumns ?? BOARD_COLUMN_N));
  for (let i = 1; i < nSeed; i++) {
    write(`agent-factory/seed/memory-bank/${String(i).padStart(2, "0")}-fixture.md`, CONFORMING_SEED(i));
  }
  // The contracts part always carries the note contract (a derived Technical Names source).
  const nContracts = spec.contracts ?? CONTRACT_N;
  if (nContracts > 0) write(NOTE_CONTRACT, noteContractDoc(spec.noteKinds ?? NOTE_KIND_N));
  for (let i = 1; i < nContracts; i++) {
    write(`agent-factory/contracts/${String(i).padStart(2, "0")}-fixture.md`, CONFORMING_CONTRACT(i));
  }
  // Outside the corpus, but inside the Technical Names derivation.
  const nRoles = spec.roles ?? ROLE_N;
  for (let i = 0; i < nRoles; i++) {
    write(`agent-factory/roles/fixture-${String(i).padStart(2, "0")}.md`, roleDoc(i));
  }
  write(CONFIG_JSON, configDoc(spec.configKeys ?? CONFIG_KEY_N));

  for (const [rel, body] of Object.entries(spec.extra ?? {})) {
    const dst = join(mirror, rel);
    mkdirSync(join(dst, ".."), { recursive: true });
    writeFileSync(dst, body, "utf8");
  }
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** How many WP-01 findings the run reported. Arithmetic over the rendered lines. */
const stepFindingCount = (out: string): number =>
  (out.match(/— WP-01 \[/g) ?? []).length;
/** How many findings of one sentence-form kind the run reported. */
const formFindingCount = (out: string, kind: string): number =>
  (out.match(new RegExp(`\\[${kind}\\]`, "g")) ?? []).length;

/** A workflow whose `## Steps` section holds exactly the supplied bullets. */
const workflowWithSteps = (bullets: string[], extraSections = ""): string =>
  [
    "# Workflow: Planted Workflow",
    "",
    "## Steps",
    ...bullets,
    "",
    extraSections,
    "",
  ].join("\n");

/** N words of filler, so a sentence's length is arithmetic rather than eyeballed. */
const filler = (n: number): string =>
  Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (1) THE GREEN CONTROL. Without it every RED below proves nothing.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("check-imperative-lexicon — the clean mirror", () => {
  it("exits 0 with two measured PASS lines naming the corpus, the exclusions and the derived names", () => {
    // THE EXIT CODE IS ASSERTED EXPLICITLY: spawnSync does not throw on a non-zero exit, so a case
    // that only checked stdout would pass against a gate that exits 1 every single time.
    const { status, stdout } = runGate(makeMirror("gops-lex-clean-"));
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain(`${GOVERNED_CORPUS_COUNT} governed document(s) in 4 derived part(s)`);
    // Both predicates print their own measured verdict — two names, two denominators.
    expect(stdout).toContain("[guard_imperative_lexicon]");
    expect(stdout).toContain("[guard_sentence_form]");
    // The label NAMES the element it counts, so a reader meets the grain in the verdict itself, and
    // BOTH denominators are the file counts rather than the bullet and sentence totals (WR-02).
    expect(stdout).toContain(
      `${LEXICON_MEASURED_LABEL}: 0 findings over ${bulletTotals(stdout).files}/${bulletTotals(stdout).files} elements`,
    );
    expect(stdout).toContain(
      `${SENTENCE_MEASURED_LABEL}: 0 findings over ${GOVERNED_CORPUS_COUNT}/${GOVERNED_CORPUS_COUNT} elements`,
    );
    // The detail lines still carry the bullet and sentence totals, so the finer numbers are not lost.
    expect(bulletTotals(stdout).bullets).toBeGreaterThan(bulletTotals(stdout).files);
    expect(sentenceTotals(stdout).total).toBeGreaterThan(GOVERNED_CORPUS_COUNT);
    // Every excluded location is named INLINE with its reason, never left to a file's absence.
    for (const e of GOVERNED_CORPUS_EXCLUDED_LOCATIONS) {
      expect(stdout).toContain(e.location);
      expect(stdout).toContain(e.reason);
    }
    expect(stdout).toContain(
      `${TECHNICAL_NAMES_COUNT} Technical Name(s) DERIVED from the kit, never listed`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (2) THE CORPUS DERIVATION — per-part floor first, then the aggregate pin, then the marker.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("check-imperative-lexicon — the derived corpus", () => {
  for (const part of ["workflows", "checklists", "seedTemplates", "contracts"] as const) {
    it(`a mirror whose "${part}" part derives ZERO members exits 1 naming that part`, () => {
      const spec: MirrorSpec = {};
      if (part === "workflows") spec.workflows = 0;
      if (part === "checklists") spec.checklists = 0;
      if (part === "seedTemplates") spec.seed = 0;
      if (part === "contracts") spec.contracts = 0;
      const { status, stdout } = runGate(makeMirror(`gops-lex-zero-${part}-`, spec));
      expect(status).toBe(1);
      expect(stdout).toContain(`the "${part}" part of the governed corpus derived ZERO members`);
      // THE FLOOR IS EVALUATED BEFORE THE AGGREGATE PIN, and the order is asserted rather than
      // assumed: a reader must meet "this part contributes nothing" before "the total is short",
      // because the second reads as a number to move and the first does not.
      const floorAt = stdout.indexOf(`the "${part}" part of the governed corpus derived ZERO`);
      const pinAt = stdout.indexOf("the governed corpus derived");
      expect(floorAt).toBeGreaterThanOrEqual(0);
      expect(pinAt).toBeGreaterThan(floorAt);
    });
  }

  it("a mirror SHORT BY ONE WORKFLOW exits 1 naming the derived count and the pinned count", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-lex-short-", { workflows: WORKFLOW_N - 1 }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `the governed corpus derived ${GOVERNED_CORPUS_COUNT - 1} document(s), expected exactly ${GOVERNED_CORPUS_COUNT}`,
    );
    // The message must say that moving the pin is not the remedy.
    expect(stdout).toContain("supposed to enter this scan BY EXISTING");
  });

  it("a mirror LONGER BY ONE exits 1 — the pin is two-sided, not a floor", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-lex-long-", { checklists: CHECKLIST_N + 1 }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `the governed corpus derived ${GOVERNED_CORPUS_COUNT + 1} document(s), expected exactly ${GOVERNED_CORPUS_COUNT}`,
    );
  });

  it("a PLANTED SECOND GENERATED FILE is excluded, and the cardinality assertion fails NAMING it", () => {
    // The load-bearing half of D-42. The second file is excluded from the corpus by the derived
    // marker — which is why the corpus count still holds — and the ONLY thing that reports its
    // arrival is the two-sided cardinality assertion. Without that assertion a second generated kit
    // file would leave the scan in complete silence.
    const planted = `agent-factory/checklists/zz-generated-${GENERATED_EXEMPT_COUNT}.md`;
    const { status, stdout } = runGate(
      makeMirror("gops-lex-gen2-", { generated: GENERATED_EXEMPT_COUNT + 1 }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `${GENERATED_EXEMPT_COUNT + 1} candidate document(s) carry the \`${GENERATED_MARKER}\` marker, expected exactly ${GENERATED_EXEMPT_COUNT}`,
    );
    expect(stdout).toContain(planted);
    // And the corpus itself is UNCHANGED at the pin — proving the exclusion really happened rather
    // than the file simply never being found.
    expect(stdout).not.toContain(
      `the governed corpus derived ${GOVERNED_CORPUS_COUNT + 1} document(s)`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (3) guard_imperative_lexicon — the canonical step form, and its SECTION SCOPING.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("guard_imperative_lexicon (WP-01)", () => {
  const plantWorkflow = (body: string): MirrorSpec => ({
    plant: { "agent-factory/workflows/00-fixture.md": body },
  });

  it("a BOLD LABEL is a finding; the same text with the label removed is not", () => {
    // THE DISCRIMINATING PAIR. One mirror per side, same sentence, one difference.
    const red = runGate(
      makeMirror(
        "gops-lex-bold-",
        plantWorkflow(workflowWithSteps([`1. **${VERB} the gate** in order.`])),
      ),
    );
    expect(red.status).toBe(1);
    expect(stepFindingCount(red.stdout)).toBe(1);
    expect(red.stdout).toContain("[bold-label]");

    const green = runGate(
      makeMirror(
        "gops-lex-bold-ok-",
        plantWorkflow(workflowWithSteps([`1. ${VERB} the gate in order.`])),
      ),
    );
    expect(green.status).toBe(0);
    expect(stepFindingCount(green.stdout)).toBe(0);
  });

  it("a DETERMINER subject is a finding", () => {
    const { status, stdout } = runGate(
      makeMirror(
        "gops-lex-det-",
        plantWorkflow(workflowWithSteps(["1. The Orchestrator pulls the ticket."])),
      ),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("[determiner-subject]");
    expect(stepFindingCount(stdout)).toBe(1);
  });

  it("an ACTOR subject is a finding, and TECHNICAL_NAMES is what names the shape", () => {
    // The Technical Names set is consumed here rather than decorating a comment: without it this
    // bullet would report as a plain unrecognised word and the remedy would read "add it to the
    // verb list", which is the one remedy WP-01 must never suggest.
    //
    // PREMISE FIRST — the REAL tree's derivation returns DISPLAY names (D-40). If it returned
    // filenames, `BA/PM` would be absent and this whole arm would be exercising a set that matches
    // nothing in the corpus it governs.
    expect(ACTOR).toMatch(/\//);
    const { status, stdout } = runGate(
      makeMirror(
        "gops-lex-actor-",
        plantWorkflow(
          workflowWithSteps([`1. ${mirrorRoleDisplayName(0)} defines the product.`]),
        ),
      ),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("[actor-subject]");
    expect(stdout).toContain("used as a SUBJECT");
  });

  it("an `## Inputs required` noun phrase and a `## Stop conditions` conditional are NOT findings", () => {
    // THE SECTION SCOPING, PROVEN RATHER THAN COMMENTED. Both bullets below would be WP-01 findings
    // under a bullet-scoped rule; 72 correct bullets across the real corpus are of exactly these two
    // shapes, and the only route back to green from reporting them would be weakening the rule.
    const { status, stdout } = runGate(
      makeMirror(
        "gops-lex-scope-",
        plantWorkflow(
          workflowWithSteps(
            [`1. ${VERB} the shared context first.`],
            [
              "## Inputs required",
              "- A ticket with acceptance criteria, size, and priority.",
              "",
              "## Stop conditions",
              "- The ticket fails the Definition of Ready -> stop and hand back.",
            ].join("\n"),
          ),
        ),
      ),
    );
    expect(status).toBe(0);
    expect(stepFindingCount(stdout)).toBe(0);
  });

  it("a non-conforming bullet INSIDE A FENCE is not a finding — one fence machine, asked per line", () => {
    const fenced = [
      "# Workflow: Planted Workflow",
      "",
      "## Steps",
      `1. ${VERB} the shared context first.`,
      "",
      "```",
      "1. The Orchestrator pulls the ticket.",
      "```",
      "",
    ].join("\n");
    const { status, stdout } = runGate(
      makeMirror("gops-lex-fence-", plantWorkflow(fenced)),
    );
    expect(status).toBe(0);
    expect(stepFindingCount(stdout)).toBe(0);
  });

  it("a corpus with ZERO `## Steps` bullets exits 1 through the SHARED vacuity rule", () => {
    // The gate declares no zero check of its own; this message is reportMeasured's, word for word.
    const noSteps = ["# Workflow: Planted Workflow", "", "Prose only here.", ""].join("\n");
    const spec: MirrorSpec = { plant: {} };
    for (let i = 0; i < WORKFLOW_N; i++) {
      spec.plant![`agent-factory/workflows/${String(i).padStart(2, "0")}-fixture.md`] = noSteps;
    }
    const { status, stdout } = runGate(makeMirror("gops-lex-nobullets-", spec));
    expect(status).toBe(1);
    expect(stdout).toContain(
      `${LEXICON_MEASURED_LABEL}: ZERO elements visited (expected 0) — this check was NOT performed`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (4) guard_sentence_form — two bounds by section anchor, four banned constructions.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("guard_sentence_form (WP-02..WP-08)", () => {
  const plantWorkflow = (body: string): MirrorSpec => ({
    plant: { "agent-factory/workflows/00-fixture.md": body },
  });

  it("the PROCEDURAL bound is exactly 20 words — 21 is a finding, 20 is not", () => {
    const over = `1. ${VERB} ${filler(PROCEDURAL_SENTENCE_MAX_WORDS)}.`;
    const at = `1. ${VERB} ${filler(PROCEDURAL_SENTENCE_MAX_WORDS - 1)}.`;
    // The plant's length is MEASURED with the module's own counter, never eyeballed.
    expect(countWords(over.replace(/^1\. /, ""))).toBe(PROCEDURAL_SENTENCE_MAX_WORDS + 1);
    expect(countWords(at.replace(/^1\. /, ""))).toBe(PROCEDURAL_SENTENCE_MAX_WORDS);

    const red = runGate(
      makeMirror("gops-lex-proc21-", plantWorkflow(workflowWithSteps([over]))),
    );
    expect(red.status).toBe(1);
    expect(formFindingCount(red.stdout, "procedural-sentence-too-long")).toBe(1);
    expect(red.stdout).toContain(
      `${PROCEDURAL_SENTENCE_MAX_WORDS + 1} words, bound ${PROCEDURAL_SENTENCE_MAX_WORDS}`,
    );

    const green = runGate(
      makeMirror("gops-lex-proc20-", plantWorkflow(workflowWithSteps([at]))),
    );
    expect(green.status).toBe(0);
  });

  it("the SAME 21-word sentence as prose is NOT a finding — the section anchor decides (WP-04)", () => {
    const prose = [
      "# Workflow: Planted Workflow",
      "",
      `${VERB} ${filler(PROCEDURAL_SENTENCE_MAX_WORDS)}.`,
      "",
      "## Steps",
      `1. ${VERB} the shared context first.`,
      "",
    ].join("\n");
    const { status, stdout } = runGate(
      makeMirror("gops-lex-prose21-", plantWorkflow(prose)),
    );
    expect(status).toBe(0);
    expect(formFindingCount(stdout, "descriptive-sentence-too-long")).toBe(0);
  });

  it("the DESCRIPTIVE bound is exactly 25 words — 26 is a finding, 25 is not", () => {
    const doc = (n: number): string =>
      ["# Workflow: Planted Workflow", "", `${filler(n)}.`, "", "## Steps", `1. ${VERB} it.`, ""].join("\n");
    const red = runGate(
      makeMirror("gops-lex-desc26-", plantWorkflow(doc(DESCRIPTIVE_SENTENCE_MAX_WORDS + 1))),
    );
    expect(red.status).toBe(1);
    expect(formFindingCount(red.stdout, "descriptive-sentence-too-long")).toBe(1);

    const green = runGate(
      makeMirror("gops-lex-desc25-", plantWorkflow(doc(DESCRIPTIVE_SENTENCE_MAX_WORDS))),
    );
    expect(green.status).toBe(0);
  });

  it("a MODAL inside a `## Steps` bullet is a finding; the same modal in prose is not (WP-05)", () => {
    const red = runGate(
      makeMirror(
        "gops-lex-modal-",
        plantWorkflow(workflowWithSteps([`1. ${VERB} the gate, which must pass.`])),
      ),
    );
    expect(red.status).toBe(1);
    expect(formFindingCount(red.stdout, "modal-in-procedural-step")).toBe(1);

    const green = runGate(
      makeMirror(
        "gops-lex-modal-prose-",
        plantWorkflow(
          [
            "# Workflow: Planted Workflow",
            "",
            "The gate must pass before release.",
            "",
            "## Steps",
            `1. ${VERB} the gate.`,
            "",
          ].join("\n"),
        ),
      ),
    );
    expect(green.status).toBe(0);
  });

  it("a BARE DEMONSTRATIVE subject is a finding; a demonstrative DETERMINER is not (WP-06)", () => {
    // The discriminating pair for the closed-function-word rule: `This is …` has no subject a
    // reader can resolve, while `This workflow …` modifies a noun and is correct.
    const doc = (sentence: string): string =>
      ["# Workflow: Planted Workflow", "", sentence, "", "## Steps", `1. ${VERB} it.`, ""].join("\n");
    const red = runGate(
      makeMirror("gops-lex-demo-", plantWorkflow(doc("This is the release gate."))),
    );
    expect(red.status).toBe(1);
    expect(formFindingCount(red.stdout, "bare-demonstrative-subject")).toBe(1);

    const green = runGate(
      makeMirror("gops-lex-demo-ok-", plantWorkflow(doc("This workflow runs at release."))),
    );
    expect(green.status).toBe(0);
  });

  it("the and-slash-or construction is a finding (WP-07)", () => {
    const { status, stdout } = runGate(
      makeMirror(
        "gops-lex-andor-",
        plantWorkflow(
          ["# Workflow: Planted Workflow", "", "The reviewer and/or the author signs off.", "", "## Steps", `1. ${VERB} it.`, ""].join("\n"),
        ),
      ),
    );
    expect(status).toBe(1);
    expect(formFindingCount(stdout, "and-slash-or")).toBe(1);
  });

  it("two imperatives chained by a conjunction are ONE finding (WP-08)", () => {
    const { status, stdout } = runGate(
      makeMirror(
        "gops-lex-chain-",
        plantWorkflow(workflowWithSteps([`1. ${VERB} the note, and ${VERB2.toLowerCase()} the row.`])),
      ),
    );
    expect(status).toBe(1);
    expect(formFindingCount(stdout, "more-than-one-instruction")).toBe(1);
  });

  it("a corpus with ZERO sentences exits 1 through the SHARED vacuity rule", () => {
    const spec: MirrorSpec = { plant: {} };
    for (let i = 0; i < WORKFLOW_N; i++) {
      spec.plant![`agent-factory/workflows/${String(i).padStart(2, "0")}-fixture.md`] = "";
    }
    for (let i = 0; i < CHECKLIST_N; i++) {
      spec.plant![`agent-factory/checklists/${String(i).padStart(2, "0")}-fixture.md`] = "";
    }
    for (let i = 1; i < SEED_N; i++) {
      spec.plant![`agent-factory/seed/memory-bank/${String(i).padStart(2, "0")}-fixture.md`] = "";
    }
    for (let i = 1; i < CONTRACT_N; i++) {
      spec.plant![`agent-factory/contracts/${String(i).padStart(2, "0")}-fixture.md`] = "";
    }
    // The board and the note contract still carry their tables — they are the Technical Names
    // sources — so this case is about the SENTENCE fold, and it must still report zero bullets too.
    const { status, stdout } = runGate(makeMirror("gops-lex-nosent-", spec));
    expect(status).toBe(1);
    expect(stdout).toContain(`${LEXICON_MEASURED_LABEL}: ZERO elements visited`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (5) THE DERIVED TECHNICAL NAMES SET (LANG-01 / D-40).
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("TECHNICAL_NAMES — derived, floored per part, pinned two-sided", () => {
  it("a mirror whose config carries ONE EXTRA KEY exits 1 naming the derived and pinned counts", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-lex-names-grew-", { configKeys: CONFIG_KEY_N + 1 }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `the Technical Names set derived ${TECHNICAL_NAMES_COUNT + 1} member(s), expected exactly ${TECHNICAL_NAMES_COUNT}`,
    );
  });

  it("a mirror whose board table is EMPTY fires the per-part floor by name", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-lex-names-zero-", { boardColumns: 0 }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      'the "boardColumns" part of the Technical Names set derived ZERO members',
    );
  });

  it("countWords collapses a MULTI-WORD Technical Name to one term — the set is load-bearing", () => {
    // If this were decoration, deleting the collapse would change no verdict. It changes verdicts:
    // the real-tree run reports 86 over-long procedural sentences with the collapse and 87 without.
    const multi = TECHNICAL_NAMES.find((n) => n.includes(" "));
    expect(multi, "PREMISE — the derived set must contain a multi-word name").toBeDefined();
    const words = (multi as string).split(/\s+/).length;
    expect(words).toBeGreaterThan(1);
    expect(countWords(`${multi} runs`)).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (6) THE PINS AND THE COST.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("check-imperative-lexicon — exported pins and cost", () => {
  it("exports the pinned constants at the values the plan and the profile name", () => {
    expect(GOVERNED_CORPUS_COUNT).toBe(47);
    expect(APPROVED_STEP_VERBS.length).toBe(43);
    expect(PROCEDURAL_SENTENCE_MAX_WORDS).toBe(20);
    expect(DESCRIPTIVE_SENTENCE_MAX_WORDS).toBe(25);
    expect(GENERATED_EXEMPT_COUNT).toBe(1);
    // Every approved verb is capitalised and single-token: WP-01 compares at position zero, so a
    // multi-word member could never match and would be a silent no-op member.
    for (const v of APPROVED_STEP_VERBS) {
      expect(v).toMatch(/^[A-Z][a-z]+$/);
    }
    // And the list carries no duplicate, which a hand-maintained set acquires quietly.
    expect(new Set(APPROVED_STEP_VERBS).size).toBe(APPROVED_STEP_VERBS.length);
  });

  it("T-29-16 — the largest governed file is processed well under one second", () => {
    // The superlinear-backtracking incident (a 0.47 s guard that took 383 s) is DORMANT, not fixed.
    // Measured against the real 13,831-byte workflow rather than a fixture, because the shape of
    // real prose is what triggers it.
    const largest = join(ROOT, "agent-factory/workflows/05-pr-quality-gate.md");
    const started = Date.now();
    const body = readFileSync(largest, "utf8");
    let n = 0;
    for (const line of body.split("\n")) n += countWords(line);
    const elapsed = Date.now() - started;
    expect(n).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000);
    process.stdout.write(
      `\n29-03 timing: countWords over agent-factory/workflows/05-pr-quality-gate.md (${body.length} B) → ${n} words in ${elapsed} ms\n`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (7) CR-03 — A STEP BULLET IS A STEP BULLET AT ANY DEPTH, AND A SUB-HEADING DOES NOT END A SECTION.
//
// THIS IS A POSITION BUG, NOT A CHARACTER-CLASS BUG, and the distinction is the whole point. The
// question these cases ask is not which characters the predicate accepts but AT WHICH POSITIONS IT
// IS EVEN ASKED. A CommonMark sub-bullet under a numbered step is indented four or more spaces, so a
// marker bounded at three leading spaces never sees it: it is absent from the bullet count so the
// loss leaves no trace, reclassified as descriptive so it is measured against the 25-word bound
// instead of the 20, and skipped entirely by the modal rule and the one-instruction rule. Four
// consequences from one missing position.
//
// EVERY COUNT ASSERTION BELOW IS RELATIVE. The baseline is DERIVED from a run over the same mirror
// without the planted line, never typed — this repository has already had a hard-coded corpus count
// asserted in twenty-one places and independently proven wrong, and a literal here would be that
// defect landing inside the test written to prevent it.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The one workflow every case below plants into. It exists in every mirror by construction. */
const PLANTED_WORKFLOW = "agent-factory/workflows/00-fixture.md";

/** A workflow whose `## Steps` section holds exactly the supplied lines, verbatim and in order. */
const stepsDoc = (lines: string[]): string =>
  ["# Workflow: Planted Workflow", "", "## Steps", ...lines, ""].join("\n");

/** Run the committed gate over a mirror whose planted workflow carries exactly these step lines. */
function runWithSteps(
  prefix: string,
  lines: string[],
): { status: number; stdout: string } {
  return runGate(
    makeMirror(prefix, { plant: { [PLANTED_WORKFLOW]: stepsDoc(lines) } }),
  );
}

/**
 * The gate's own published bullet figures, read back from its detail line.
 *
 * A throw rather than a default: a regex that stopped matching would otherwise turn every relative
 * count assertion below into `0 === 0 + 1` failing for the wrong reason, or worse, into a silent
 * comparison of two absent numbers.
 */
const bulletTotals = (out: string): { bullets: number; files: number } => {
  const m = out.match(/(\d+) `## Steps` bullet\(s\) across (\d+) file\(s\)/);
  if (m === null) {
    throw new Error(
      `the gate printed no \`## Steps\` bullet count line, so no relative assertion is possible:\n${out}`,
    );
  }
  return { bullets: Number(m[1]), files: Number(m[2]) };
};

/**
 * The gate's own published sentence figures, split by section anchor.
 *
 * THIS IS THE PREMISE INSTRUMENT, and it exists because of a near-miss recorded in 29-16: a case can
 * go RED FOR THE WRONG REASON. A planted line that never reached the sentence loop at all would
 * produce exactly the same "no finding" as one that reached it and was classified descriptive — and
 * the reclassification cases below would then be asserting a symptom whose mechanism they never
 * touched. Reading the procedural/descriptive split back lets each case assert that its line ARRIVED
 * and that only its CLASSIFICATION moved.
 */
const sentenceTotals = (
  out: string,
): { total: number; procedural: number; descriptive: number } => {
  const m = out.match(/(\d+) sentence\(s\) — (\d+) procedural, (\d+) descriptive/);
  if (m === null) {
    throw new Error(
      `the gate printed no sentence split line, so no premise assertion is possible:\n${out}`,
    );
  }
  return {
    total: Number(m[1]),
    procedural: Number(m[2]),
    descriptive: Number(m[3]),
  };
};

/** The base step section every plant is measured against: one conforming ordered step. */
const BASE_STEPS = [`1. ${VERB} the shared context first.`];

/** A bullet that is a WP-01 finding wherever it is counted — a determiner subject, never a verb. */
const DESCRIBING_BULLET = "The result is recorded by hand.";

describe("CR-03 — a `## Steps` bullet is counted at any nesting depth", () => {
  it("counts a FOUR-SPACE indented bullet under a numbered step, and the count rises by exactly one", () => {
    const before = runWithSteps("gops-lex-cr03-base-", BASE_STEPS);
    const after = runWithSteps("gops-lex-cr03-indent-", [
      ...BASE_STEPS,
      `    - ${DESCRIBING_BULLET}`,
    ]);

    // PREMISE, asserted rather than assumed: the unplanted mirror is clean, so the planted run's
    // exit 1 is attributable to the planted line and to nothing else in the fixture.
    expect(before.status).toBe(0);

    // The count is the acknowledgement. Derived on both sides, never typed.
    expect(bulletTotals(after.stdout).bullets).toBe(
      bulletTotals(before.stdout).bullets + 1,
    );
    expect(after.status).toBe(1);
    expect(after.stdout).toContain(DESCRIBING_BULLET);
  });

  it("counts a TAB-indented bullet, because CommonMark indentation is spaces or tabs", () => {
    // A space-only bound would be the same defect one character over.
    const before = runWithSteps("gops-lex-cr03-tabbase-", BASE_STEPS);
    const after = runWithSteps("gops-lex-cr03-tab-", [
      ...BASE_STEPS,
      `\t- ${DESCRIBING_BULLET}`,
    ]);
    expect(before.status).toBe(0);
    expect(bulletTotals(after.stdout).bullets).toBe(
      bulletTotals(before.stdout).bullets + 1,
    );
    expect(after.status).toBe(1);
  });

  it("measures an indented bullet against the PROCEDURAL bound, not the descriptive one", () => {
    // The sentence is built to sit strictly BETWEEN the two bounds, so the reclassification is what
    // decides the verdict — and both bounds are read from the module rather than retyped.
    const sentence = `${VERB} ${filler(21)}.`;
    const words = countWords(sentence);
    expect(words).toBeGreaterThan(PROCEDURAL_SENTENCE_MAX_WORDS);
    expect(words).toBeLessThanOrEqual(DESCRIPTIVE_SENTENCE_MAX_WORDS);

    const before = runWithSteps("gops-lex-cr03-lenbase-", BASE_STEPS);
    const { status, stdout } = runWithSteps("gops-lex-cr03-len-", [
      ...BASE_STEPS,
      `    - ${sentence}`,
    ]);

    // THE MECHANISM, asserted directly. The planted line contributes exactly one sentence, and that
    // sentence lands on the PROCEDURAL side of the split. Without this the case would pass equally
    // for a line the sentence loop never reached at all.
    const b = sentenceTotals(before.stdout);
    const a = sentenceTotals(stdout);
    expect(a.total).toBe(b.total + 1);
    expect(a.procedural).toBe(b.procedural + 1);
    expect(a.descriptive).toBe(b.descriptive);

    expect(status).toBe(1);
    // Reported under the procedural bound, and NOT under the descriptive one. Asserting both is what
    // proves the reclassification rather than merely a finding of some kind.
    expect(formFindingCount(stdout, "procedural-sentence-too-long")).toBe(1);
    expect(formFindingCount(stdout, "descriptive-sentence-too-long")).toBe(0);
    expect(stdout).toContain(`${words} words, bound ${PROCEDURAL_SENTENCE_MAX_WORDS}`);
  });

  it("makes an indented NUMBERED line procedural through ORDERED_MARKER, with no section anchor involved", () => {
    // THIS CASE EXISTS BECAUSE A MUTATION FOUND ITS ABSENCE. Narrowing ORDERED_MARKER back to three
    // leading spaces, with LIST_MARKER left wide, reddened NOTHING — every case above plants a `-`
    // bullet, so the second marker's widening was shipped uncovered. `procedural` is
    // `(inSteps && isBullet) || ORDERED_MARKER.test(raw)`, and this arm is the RIGHT-HAND side: the
    // plant lives in a CHECKLIST, which has no `## Steps` heading at all, so the section anchor
    // cannot be what decides it. LIST_MARKER is wide in both the fix and the mutation, so the marker
    // strip is identical on both sides and `procedural` is the only thing that moves.
    const sentence = `${VERB} ${filler(21)}.`;
    const words = countWords(sentence);
    expect(words).toBeGreaterThan(PROCEDURAL_SENTENCE_MAX_WORDS);
    expect(words).toBeLessThanOrEqual(DESCRIPTIVE_SENTENCE_MAX_WORDS);

    const CHECKLIST = "agent-factory/checklists/00-fixture.md";
    const doc = (body: string): string =>
      ["# Fixture checklist 0", "", `- ${VERB} the gate result.`, body, ""].join("\n");
    const before = runGate(
      makeMirror("gops-lex-cr03-ordbase-", { plant: { [CHECKLIST]: doc("") } }),
    );
    const after = runGate(
      makeMirror("gops-lex-cr03-ord-", {
        plant: { [CHECKLIST]: doc(`    1. ${sentence}`) },
      }),
    );

    // PREMISE: the unplanted mirror is clean, and the planted line arrives as exactly one sentence.
    expect(before.status).toBe(0);
    const b = sentenceTotals(before.stdout);
    const a = sentenceTotals(after.stdout);
    expect(a.total).toBe(b.total + 1);
    // THE MECHANISM: it arrives on the PROCEDURAL side, and the descriptive side does not move.
    expect(a.procedural).toBe(b.procedural + 1);
    expect(a.descriptive).toBe(b.descriptive);

    expect(after.status).toBe(1);
    expect(formFindingCount(after.stdout, "procedural-sentence-too-long")).toBe(1);
    expect(formFindingCount(after.stdout, "descriptive-sentence-too-long")).toBe(0);
    // And no bullet was counted, which is what proves the section anchor played no part.
    expect(bulletTotals(after.stdout).bullets).toBe(
      bulletTotals(before.stdout).bullets,
    );
  });

  it("reaches the MODAL rule (WP-05) on an indented bullet", () => {
    const modal = BANNED_CONSTRUCTIONS.modal[0];
    const before = runWithSteps("gops-lex-cr03-modalbase-", BASE_STEPS);
    const { status, stdout } = runWithSteps("gops-lex-cr03-modal-", [
      ...BASE_STEPS,
      `    - ${VERB} the note when the gate ${modal} report a result.`,
    ]);
    // PREMISE: the line reaches the sentence loop and lands PROCEDURAL. WP-05 is asked only of a
    // procedural sentence, so this is the position the rule was previously never asked at.
    const b = sentenceTotals(before.stdout);
    const a = sentenceTotals(stdout);
    expect(a.total).toBe(b.total + 1);
    expect(a.procedural).toBe(b.procedural + 1);

    expect(status).toBe(1);
    expect(formFindingCount(stdout, "modal-in-procedural-step")).toBe(1);
    // The bullet opens with an approved verb, so WP-01 is silent and the exit 1 is WP-05's alone.
    expect(stepFindingCount(stdout)).toBe(0);
  });

  it("reaches the ONE-INSTRUCTION rule (WP-08) on an indented bullet", () => {
    const before = runWithSteps("gops-lex-cr03-chainbase-", BASE_STEPS);
    const { status, stdout } = runWithSteps("gops-lex-cr03-chain-", [
      ...BASE_STEPS,
      `    - ${VERB} the note and ${VERB2} the result.`,
    ]);
    // PREMISE: same as WP-05 above — WP-08 is asked only of a procedural sentence whose FIRST token
    // is an approved verb, and the marker strip is what makes that first token the verb.
    const b = sentenceTotals(before.stdout);
    const a = sentenceTotals(stdout);
    expect(a.total).toBe(b.total + 1);
    expect(a.procedural).toBe(b.procedural + 1);

    expect(status).toBe(1);
    expect(formFindingCount(stdout, "more-than-one-instruction")).toBe(1);
    expect(stepFindingCount(stdout)).toBe(0);
  });
});

describe("CR-03 — the `## Steps` anchor survives a sub-heading and is released only by a heading of level at most two", () => {
  it("a `### ` sub-heading STRUCTURES the section and does not release the bullets below it", () => {
    const withSub = [...BASE_STEPS, "", "### Sub-phase", ""];
    const before = runWithSteps("gops-lex-cr03-subbase-", withSub);
    const after = runWithSteps("gops-lex-cr03-sub-", [
      ...withSub,
      `- ${DESCRIBING_BULLET}`,
    ]);
    expect(before.status).toBe(0);
    expect(bulletTotals(after.stdout).bullets).toBe(
      bulletTotals(before.stdout).bullets + 1,
    );
    expect(after.status).toBe(1);
  });

  it("a `## ` heading DOES release them — the false-red control at level two", () => {
    const withOther = [...BASE_STEPS, "", "## Other", ""];
    const before = runWithSteps("gops-lex-cr03-otherbase-", withOther);
    const after = runWithSteps("gops-lex-cr03-other-", [
      ...withOther,
      `- ${DESCRIBING_BULLET}`,
    ]);
    // Neither run counts the bullet and neither reds. Testing the UNION of the arms rather than each
    // arm alone is the point: a fix that simply stopped releasing at ALL headings would pass the
    // sub-heading case above and fail here.
    expect(bulletTotals(after.stdout).bullets).toBe(
      bulletTotals(before.stdout).bullets,
    );
    expect(before.status).toBe(0);
    expect(after.status).toBe(0);
  });

  it("a `# ` heading DOES release them — the false-red control at level one", () => {
    const withTop = [...BASE_STEPS, "", "# Top Level", ""];
    const before = runWithSteps("gops-lex-cr03-topbase-", withTop);
    const after = runWithSteps("gops-lex-cr03-top-", [
      ...withTop,
      `- ${DESCRIBING_BULLET}`,
    ]);
    expect(bulletTotals(after.stdout).bullets).toBe(
      bulletTotals(before.stdout).bullets,
    );
    expect(before.status).toBe(0);
    expect(after.status).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (8) WR-02 — TWO INDEPENDENT DENOMINATORS, AND A SET-LEVEL REFUSAL THAT NAMES ITS MEMBER.
//
// A vacuity floor catches an EMPTY denominator and never a SILENTLY SHORT one. Both call sites in
// this gate previously passed `expected` read off the very array the loop counted, so
// `visited !== expected` could not fire under any input and vacuity.ts's second branch — the branch
// that exists to make a narrowed check visible — was dead code with a comment explaining what it was
// for. The concrete consequence: a governed corpus in which seventeen of forty-seven files stopped
// producing step bullets was indistinguishable, in the gate's published output, from one where all
// forty-seven still did.
//
// The remedy is the one 29-16 established at the sibling gate: `expected` from a code path the loop
// does not own, `visited` from the loop, and a mismatch that NAMES its members in both directions,
// because a bare count is a number a reader cannot act on.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe("WR-02 — the lexicon denominator comes from the HEADING scan and names its file", () => {
  it("REDs a governed file that opens a `## Steps` section and contributes no bullet, naming it", () => {
    const rel = "agent-factory/workflows/00-fixture.md";
    // A `## Steps` heading with prose under it and not one bullet. The `# Workflow: ` heading stays,
    // so the workflow display-name derivation is untouched and this case varies ONE thing.
    const headingNoBullet = [
      "# Workflow: Planted Workflow",
      "",
      "## Steps",
      "",
      "Prose sits here where a step bullet belongs.",
      "",
    ].join("\n");

    const control = runGate(makeMirror("gops-lex-wr02-ctrl-"));
    const planted = runGate(
      makeMirror("gops-lex-wr02-nobullet-", { plant: { [rel]: headingNoBullet } }),
    );

    // THE CONTROL. One variable isolated: the identical mirror without the plant is clean.
    expect(control.status).toBe(0);
    expect(control.stdout).toContain(
      `${LEXICON_MEASURED_LABEL}: 0 findings over ${WORKFLOW_N}/${WORKFLOW_N} elements`,
    );

    expect(planted.status).toBe(1);
    // NAMED, not merely counted.
    expect(planted.stdout).toContain(
      "the step-heading file set and the bullet-bearing file set are not equal",
    );
    expect(planted.stdout).toContain(
      "carries a `## Steps` heading but NOT contributed a bullet (1)",
    );
    expect(planted.stdout).toContain(rel);
    // And the denominator itself is now short, which under the old shape it could never be.
    expect(planted.stdout).toContain(
      `${LEXICON_MEASURED_LABEL}: visited ${WORKFLOW_N - 1} of ${WORKFLOW_N} elements`,
    );
  });
});

describe("WR-02 — the sentence-form denominator is the derived corpus size and names its file", () => {
  it("REDs a governed file that yields no sentence at all, naming it — with the fixture's corpus membership asserted FIRST", () => {
    const rel = "agent-factory/checklists/00-fixture.md";
    // A heading and nothing else. Headings are never sentences, so this file contributes zero.
    const headingOnly = "# Fixture checklist 0\n";

    // ── THE HARNESS PREMISE, ASSERTED BEFORE THE VERDICT (plan 29-24, WR-07) ────────────────────
    //
    // A plant that landed OUTSIDE the derived corpus would still red — through the OPPOSITE arm of
    // the same refusal, the one that reports a scan reaching past its own corpus — and this case
    // would report a green for a property it never measured. So the premise is proven by the gate
    // itself: the same path, carrying an over-long DESCRIPTIVE sentence, must be REACHED and NAMED
    // by the sentence loop. That is what says the path is a corpus member the loop visits.
    const OVERLONG = `${filler(DESCRIPTIVE_SENTENCE_MAX_WORDS + 1)}.`;
    const premise = runGate(
      makeMirror("gops-lex-wr02-premise-", {
        plant: { [rel]: `# Fixture checklist 0\n\n${OVERLONG}\n` },
      }),
    );
    expect(premise.status).toBe(1);
    expect(premise.stdout).toContain(`${rel}:`);
    expect(formFindingCount(premise.stdout, "descriptive-sentence-too-long")).toBe(1);

    const control = runGate(makeMirror("gops-lex-wr02-sctrl-"));
    const planted = runGate(
      makeMirror("gops-lex-wr02-nosentence-", { plant: { [rel]: headingOnly } }),
    );

    expect(control.status).toBe(0);
    expect(control.stdout).toContain(
      `${SENTENCE_MEASURED_LABEL}: 0 findings over ${GOVERNED_CORPUS_COUNT}/${GOVERNED_CORPUS_COUNT} elements`,
    );

    expect(planted.status).toBe(1);
    expect(planted.stdout).toContain(
      "the governed-corpus file set and the sentence-bearing file set are not equal",
    );
    // NAMED THROUGH THE `MISSING` ARM SPECIFICALLY, never merely "some refusal fired". The sibling
    // arm — a file that yielded a sentence without being a corpus member — is a DIFFERENT defect,
    // and a case that accepted either would be blind to which one it had reproduced.
    expect(planted.stdout).toContain(
      "in the derived governed corpus but NOT yielded a sentence (1)",
    );
    expect(planted.stdout).toContain(rel);
    // AND THE PUBLISHED DENOMINATOR MOVED BY EXACTLY ONE against the control directly above.
    expect(planted.stdout).toContain(
      `${SENTENCE_MEASURED_LABEL}: visited ${GOVERNED_CORPUS_COUNT - 1} of ${GOVERNED_CORPUS_COUNT} elements`,
    );
  });

  it("TRIPWIRE ONLY: the tautological denominator SPELLINGS are absent from the module's source", () => {
    // THIS CASE ASSERTS A SUBSTRING, NOT A PROPERTY, AND ITS NAME NOW SAYS SO (plan 29-24, WR-07).
    //
    // It used to be called "asserts the PROPERTY directly", which is a claim its body cannot
    // support. Three substring tests over the module's own text cannot express "the denominator is
    // not read off the array the loop consumes": renaming `elements`, extracting
    // `const n = elements.bullets.length`, or reformatting across a line break each reintroduce the
    // defect with every assertion below still green. A case whose name claims more than its body
    // asserts is a false-assurance surface, which is the same class of defect as a gate whose
    // published name is wider than the subset it decides — the thing this entire phase is about.
    //
    // It is KEPT, as a cheap anti-regression tripwire BESIDE the real assertions rather than in
    // place of them. The behavioural sibling for each denominator is the case directly above this
    // one and the case in the describe block above that, both of which plant a fixture and require
    // the mismatch to fire. Comment lines are stripped, because the defect's own spelling is quoted
    // at length in the source that explains why it is gone.
    const executable = readFileSync(
      join(ROOT, "scripts", "check-imperative-lexicon.ts"),
      "utf8",
    )
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");

    expect(executable).not.toContain("expected: elements.bullets.length");
    expect(executable).not.toContain("expected: elements.sentences.length");
    // And each side is present, from the branch the plan names.
    expect(executable).toContain("expected: elements.stepsFiles.length");
    expect(executable).toContain("expected: corpus.length");
    expect(executable).toContain("visited: sentenceFilesVisited.length");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (8b) WR-04 / WR-09 — THE VERDICTS THE MODULE'S OWN PROSE NAMES, EACH PINNED BY A CASE.
//
// Round 1's CR-03 fix made the list marker depth-unbounded, which is correct for a CommonMark
// sub-bullet and produced two SCOPE mismatches between what this gate ENFORCES and what its own
// recorded prose says it enforces. Neither is fail-open, and both mean the guard is not deciding
// exactly the subset its name and its documentation claim.
//
//   WR-04  the set-equality refusal REDs a prose-only `## Steps` section, which the module's own
//          Residual 1 documented as deliberately out of scope. RESOLVED BY HUMAN DECISION
//          (`retire-residual`, plan 29-24 Task 1): the residual is retired and the replacement is
//          published as a numbered, decidable rule in agent-factory/writing-profile.md. The case
//          below asserts the ONE SENTENCE in BOTH artifacts, so enforcement and documentation
//          cannot drift apart again without a red.
//
//   WR-09  the depth-unbounded markers also admit lines inside a FOUR-SPACE-INDENTED code block,
//          which is not fenced, so `fencedLineFlags` returns false for it. Recorded as Residual 4
//          with a concrete conflict rather than a difficulty judgement. The disclosed verdict is
//          PINNED here, so the residual is a measured disclosure and not an untested belief.
//
// AND THE ORDERED ARM'S SCOPE IS STATED AND ITS UNION TESTED. `procedural` is
// `(inSteps && isBullet) || ORDERED_MARKER.test(raw)` — two arms. Until this block neither arm's
// boundary was asserted anywhere, and after a predicate is split into arms it is the arms' UNION,
// with its complement, that a case has to cover.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * THE SENTENCES OF THE TWO STEPS-ANCHOR RULES, written as literals here on purpose.
 *
 * Interpolating them from a module export would make the cross-artifact assertion below tautological
 * in the direction that matters: the point is that the GATE and the PROFILE say the same words to an
 * author, and a shared constant proves only that one file imports another. This is the same reason
 * every other refusal-wording assertion in this file is written as a literal.
 *
 * WHY THERE ARE TWO SENTENCES FOR `WP-11` (WR-05). `WP-11` has always been a two-sentence rule, and
 * only its first sentence was ever pinned — while the case's own comment claimed the gate and the
 * kit's documentation were "held to ONE sentence in TWO artifacts, so a future reword of either
 * alone is a red". They were not: the remedy halves had disagreed since the day they landed (the
 * profile said "a heading that is not a steps heading", the gate said "a heading that is not
 * `## Steps`"), and no assertion could see it. A claim wider than the assertion beneath it is this
 * repository's own named defect class, and it had landed inside the mechanism built against it. The
 * previous comment is DELETED rather than amended, because a cost paragraph that survives the change
 * it describes is the same defect one module over.
 *
 * WHY `WP-04` IS HERE NOW, AND WHY ONLY ITS SECOND SENTENCE (WR-06). Plan 29-31 narrowed TWO rows to
 * the literal `## Steps` and published a profile section titled for both, asserting of both that they
 * "name the literal heading `## Steps` … because that is the spelling the gate decides". The
 * mechanism it built held `WP-11` alone. Before this block, `grep -n "WP-04" scripts/*.test.ts`
 * returned ONE comment line and ONE case NAME across the whole tree of test modules and ZERO
 * assertions — measured with the comment filter shown, not estimated. So the row could revert to "a
 * bullet under a steps heading is procedural" — the level-agnostic, fail-open wording 29-31 removed —
 * and nothing would notice. It was reproduced rather than argued: with that reversion applied to a
 * git-backed clone of HEAD, all seven gates exited 0 and the non-e2e suite reported the SAME
 * 2026 passed / 1 failed / 2 skipped as the unmutated clone. Not one number moved.
 *
 * Only `WP-04`'s SECOND sentence is pinned. Its first — "The section anchor decides which length
 * limit applies to a sentence." — names no spelling, so no drift of it is visible to this gate, and
 * pinning it would assert an agreement neither artifact can be checked for. Pinning exactly the
 * decidable half is D-11's naming rule applied to a constant instead of to a guard's printed name.
 *
 * THE COMPARISON IS BYTES. `includes` is substring equality over UTF-16 code units: no normalization,
 * no case folding, no confusable mapping. A typographic apostrophe, an NBSP or a full-width backtick
 * substituted into either artifact IS a drift and reds. Stated at the declaration rather than left to
 * be inferred from the method name, because an inferred property is one a later tidy-up may disagree
 * with silently.
 */
const STEPS_RULE_ID = "WP-11";
const STEPS_RULE_SENTENCE =
  "A `## Steps` section carries at least one list item.";
const STEPS_REMEDY_SENTENCE =
  "Write the section's procedure as list items, or move the explanatory paragraphs under a heading that is not `## Steps`.";
const STEPS_ANCHOR_RULE_ID = "WP-04";
const STEPS_ANCHOR_RULE_SENTENCE =
  "A bullet under a `## Steps` heading is procedural.";

/**
 * The rule ROW of one profile rule, or `undefined` if the table carries none.
 *
 * TWO LOOKUPS AND NOT ONE, because they read two different rows. Only the AGGREGATE below is renamed
 * for the pair; a single lookup parameterised by id would be the same function twice with a shorter
 * name, and the two call sites want two independently-asserted premises anyway.
 */
const wp11Row = (profile: string): string | undefined =>
  profile.split("\n").find((l) => l.startsWith(`| \`${STEPS_RULE_ID}\` |`));
const wp04Row = (profile: string): string | undefined =>
  profile
    .split("\n")
    .find((l) => l.startsWith(`| \`${STEPS_ANCHOR_RULE_ID}\` |`));

/**
 * THE SIX-MEMBER STEPS-ANCHOR PIN, AS DATA, so the falsifiability probe drives the SAME comparison
 * the permanent assertions do rather than a second implementation of it.
 *
 * WHY THE NAME SAYS "PAIR" AND NOT "WP-11" (WR-06, D-11 and D-39 applied one layer in). This
 * mechanism held `WP-11` alone and carried a name saying so; it now decides TWO rules. D-11 removed
 * a guard named for one rule while holding three, and D-39 established that the naming rule binds at
 * the gate's OUTPUT line. An identifier is the same surface one layer in: a maintainer asking
 * whether `WP-04` was held would have read a WP-11-only name and taken the wrong answer from it,
 * which is close to how `WP-04` came to be published unheld for a whole round. The former names are
 * RENAMED THROUGHOUT and no longer exist anywhere in this tree — deliberately not aliased, because
 * an alias would leave the wrong answer reachable under the old spelling.
 *
 * Six members and not one concatenated string: a concatenation pin cannot say WHICH half drifted,
 * and a failure that reports only that "a string moved" is the failure mode this round has charged
 * against every cell-flip reproduction it reviewed. Each member carries its own message naming the
 * sentence AND the artifact.
 *
 * Each `row` is the rule ROW, never the whole profile document. The rationale sections beneath the
 * table quote these sentences too — § *The adjacency rule* carries `WP-04`'s wording in prose — so a
 * document-scoped `toContain` would keep passing on a table row that had been reworded. An assertion
 * satisfied by prose that is not the rule is not an assertion about the rule.
 */
type StepsAnchorPinMember = {
  readonly key:
    | "gate/rule"
    | "gate/remedy"
    | "profile/rule"
    | "profile/remedy"
    | "gate/wp04"
    | "profile/wp04";
  readonly message: string;
  readonly holds: boolean;
};
function stepsAnchorPin(
  gateOutput: string,
  row: string | undefined,
  anchorRow: string | undefined,
): readonly StepsAnchorPinMember[] {
  return [
    {
      key: "gate/rule",
      message: `the GATE's refusal does not carry WP-11's RULE sentence: ${STEPS_RULE_SENTENCE}`,
      holds: gateOutput.includes(STEPS_RULE_SENTENCE),
    },
    {
      key: "gate/remedy",
      message: `the GATE's refusal does not carry WP-11's REMEDY sentence: ${STEPS_REMEDY_SENTENCE}`,
      holds: gateOutput.includes(STEPS_REMEDY_SENTENCE),
    },
    {
      key: "profile/rule",
      message: `the PROFILE's WP-11 row does not carry WP-11's RULE sentence: ${STEPS_RULE_SENTENCE}`,
      holds: row !== undefined && row.includes(STEPS_RULE_SENTENCE),
    },
    {
      key: "profile/remedy",
      message: `the PROFILE's WP-11 row does not carry WP-11's REMEDY sentence: ${STEPS_REMEDY_SENTENCE}`,
      holds: row !== undefined && row.includes(STEPS_REMEDY_SENTENCE),
    },
    {
      key: "gate/wp04",
      message: `the GATE's refusal does not carry WP-04's ANCHOR sentence: ${STEPS_ANCHOR_RULE_SENTENCE}`,
      holds: gateOutput.includes(STEPS_ANCHOR_RULE_SENTENCE),
    },
    {
      key: "profile/wp04",
      message: `the PROFILE's WP-04 row does not carry WP-04's ANCHOR sentence: ${STEPS_ANCHOR_RULE_SENTENCE}`,
      holds:
        anchorRow !== undefined &&
        anchorRow.includes(STEPS_ANCHOR_RULE_SENTENCE),
    },
  ];
}
/** The members that do NOT hold, by key — the probe's assertion surface. */
const stepsAnchorBroken = (
  gateOutput: string,
  row: string | undefined,
  anchorRow: string | undefined,
): string[] =>
  stepsAnchorPin(gateOutput, row, anchorRow)
    .filter((m) => !m.holds)
    .map((m) => m.key);

describe("WR-04 / WR-09 — the shapes this guard's own prose names, each with its verdict pinned", () => {
  it("WR-04 / WR-06: a prose-only `## Steps` section and an over-long step are RED, and the refusals name BOTH RULES — the same sentences the writing profile publishes", () => {
    const rel = "agent-factory/workflows/01-fixture.md";
    // A `## Steps` heading whose section is written as paragraphs and carries not one list item.
    // The `# Workflow: ` heading stays, so the display-name derivation is untouched and this
    // fixture varies exactly one thing.
    const proseOnly = [
      "# Workflow: Prose Only Workflow",
      "",
      "## Steps",
      "",
      "Prose sits here where a step bullet belongs.",
      "",
    ].join("\n");

    // THE SECOND PLANT, AND WHY THE FIXTURE GREW (WR-06). `WP-04`'s sentence is emitted by
    // `FORM_REMEDY`'s procedural-too-long entry, and that remedy is rendered only when a procedural
    // sentence actually exceeds its bound. The prose-only plant alone produces no such finding, so a
    // `gate/wp04` member read off that stdout would be asserting the sentence is absent — a pin
    // green for the wrong reason, which is the exact shape this round keeps charging. One extra
    // workflow carrying one over-long step bullet puts BOTH refusals in ONE run's output.
    //
    // It also cannot disturb the `WP-11` inequality it shares the run with: this file carries a
    // `## Steps` heading AND a bullet under it, so it joins both file sets and the inequality is
    // still produced by the prose-only plant alone. The word count is arithmetic from the module's
    // own bound, never a typed literal.
    const relLong = "agent-factory/workflows/02-fixture.md";
    const overLong = filler(PROCEDURAL_SENTENCE_MAX_WORDS + 1);
    expect(countWords(`${VERB} ${overLong}.`)).toBeGreaterThan(
      PROCEDURAL_SENTENCE_MAX_WORDS,
    );
    const longStep = [
      "# Workflow: Long Step Workflow",
      "",
      "## Steps",
      `1. ${VERB} ${overLong}.`,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr04-prose-", {
        plant: { [rel]: proseOnly, [relLong]: longStep },
      }),
    );

    expect(status).toBe(1);
    expect(stdout).toContain(rel);
    expect(stdout).toContain(
      "the step-heading file set and the bullet-bearing file set are not equal",
    );
    // THE HALF THAT IS NEW, AND THE WHOLE OF WR-04. Before plan 29-24 the gate reddened this shape
    // by accident of a denominator while the module's Residual 1 documented it as out of scope, and
    // the refusal told an author what the gate had COMPUTED rather than what to WRITE.
    expect(stdout).toContain(STEPS_RULE_ID);
    // …and the second plant genuinely reached the remedy that carries `WP-04`'s sentence. Asserting
    // the finding kind FIRST means a `gate/wp04` failure below can only be a DRIFT, never a fixture
    // that quietly stopped producing the refusal the member reads.
    expect(stdout).toContain("[procedural-sentence-too-long]");
    expect(stdout).toContain(relLong);

    // WHAT IS HELD, STATED WITH NOTHING BEYOND IT (WR-05, WR-06). BOTH sentences of `WP-11` and the
    // DECIDABLE sentence of `WP-04` appear in the gate's refusals AND in each rule's own profile
    // ROW, as six independent assertions with six distinct messages. A reword of ANY of them in
    // EITHER artifact fails exactly one member and names which. That is six drift routes, and all
    // six are demonstrated to red by the six-mutation probe below rather than inferred from two.
    const profile = readFileSync(
      join(ROOT, "agent-factory", "writing-profile.md"),
      "utf8",
    );
    const ruleRow = wp11Row(profile);
    const anchorRow = wp04Row(profile);
    // THE HARNESS'S OWN PREMISE, ASSERTED SEPARATELY FOR EACH ROW BEFORE ANY SENTENCE COMPARISON. A
    // table whose row id changed makes the lookup `undefined`, and every containment below would
    // then be false for a reason that has nothing to do with drift — a red that misnames its own
    // cause. Two assertions and not one: a single combined check cannot say WHICH row vanished.
    expect(
      ruleRow,
      `no ${STEPS_RULE_ID} row in the writing profile's rule table`,
    ).toBeDefined();
    expect(
      anchorRow,
      `no ${STEPS_ANCHOR_RULE_ID} row in the writing profile's rule table`,
    ).toBeDefined();
    for (const member of stepsAnchorPin(stdout, ruleRow, anchorRow)) {
      expect(member.holds, member.message).toBe(true);
    }

    // …and both rows are marked DECIDABLE, because a gate decides them. An advisory mark on a gated
    // rule is the same class of claim/behaviour disagreement WR-04 is about.
    expect(ruleRow).toContain("| decidable |");
    expect(anchorRow).toContain("| decidable |");
  });

  it("WR-05 / WR-06: the two-artifact pin FAILS on each of the SIX ways WP-11 and WP-04 can drift, names which half moved, and holds on a control that touches neither", () => {
    // THE PROBE THAT MAKES THE PIN ABOVE MEAN SOMETHING. A pin that has only ever been seen passing
    // is exactly what shipped here before — twice. `WP-11`'s remedy halves disagreed on the day they
    // landed with no assertion covering them (WR-05), and `WP-04`'s row was published narrowed with
    // no assertion at all (WR-06). Six mutations, one per member, each required to break exactly its
    // own member and to leave the other five standing.
    //
    // The mirror carries BOTH plants for the reason the case above records: `WP-04`'s sentence rides
    // on the procedural-too-long remedy, which needs an over-long step to be rendered at all.
    const overLong = filler(PROCEDURAL_SENTENCE_MAX_WORDS + 1);
    const { stdout } = runGate(
      makeMirror("gops-lex-wr05-probe-", {
        plant: {
          "agent-factory/workflows/01-fixture.md": [
            "# Workflow: Prose Only Workflow",
            "",
            "## Steps",
            "",
            "Prose sits here where a step bullet belongs.",
            "",
          ].join("\n"),
          "agent-factory/workflows/02-fixture.md": [
            "# Workflow: Long Step Workflow",
            "",
            "## Steps",
            `1. ${VERB} ${overLong}.`,
            "",
          ].join("\n"),
        },
      }),
    );
    const profile = readFileSync(
      join(ROOT, "agent-factory", "writing-profile.md"),
      "utf8",
    );
    const row = wp11Row(profile);
    const anchorRow = wp04Row(profile);

    // The unmutated control. Without it a probe whose every arm reds could be reporting a pin that
    // is simply always broken.
    expect(
      stepsAnchorBroken(stdout, row, anchorRow),
      "the SHIPPED artifacts must satisfy all six members",
    ).toEqual([]);

    // A reword that a human would call harmless and a byte comparison calls a drift.
    const reword = (s: string): string =>
      s
        .replace("carries", "holds")
        .replace("Write", "Put")
        .replace("bullet", "list item");

    const mutations: readonly {
      readonly name: string;
      readonly gate: string;
      readonly row: string | undefined;
      readonly anchorRow: string | undefined;
      readonly expect: string;
    }[] = [
      {
        name: "the RULE sentence reworded in the GATE's constant",
        gate: stdout.replaceAll(STEPS_RULE_SENTENCE, reword(STEPS_RULE_SENTENCE)),
        row,
        anchorRow,
        expect: "gate/rule",
      },
      {
        name: "the REMEDY sentence reworded in the GATE's constant",
        gate: stdout.replaceAll(
          STEPS_REMEDY_SENTENCE,
          reword(STEPS_REMEDY_SENTENCE),
        ),
        row,
        anchorRow,
        expect: "gate/remedy",
      },
      {
        name: "the RULE sentence reworded in a mirror of the PROFILE",
        gate: stdout,
        row: row?.replaceAll(STEPS_RULE_SENTENCE, reword(STEPS_RULE_SENTENCE)),
        anchorRow,
        expect: "profile/rule",
      },
      {
        name: "the REMEDY sentence reworded in a mirror of the PROFILE",
        gate: stdout,
        row: row?.replaceAll(
          STEPS_REMEDY_SENTENCE,
          reword(STEPS_REMEDY_SENTENCE),
        ),
        anchorRow,
        expect: "profile/remedy",
      },
      {
        name: "WP-04's ANCHOR sentence reworded in the GATE's constant",
        gate: stdout.replaceAll(
          STEPS_ANCHOR_RULE_SENTENCE,
          reword(STEPS_ANCHOR_RULE_SENTENCE),
        ),
        row,
        anchorRow,
        expect: "gate/wp04",
      },
      {
        // THE MUTATION THIS PLAN EXISTS FOR: the exact level-agnostic reversion that passed every
        // gate and moved no test before the two `wp04` members existed.
        name: "WP-04's ANCHOR sentence reverted to the LEVEL-AGNOSTIC wording in a mirror of the PROFILE",
        gate: stdout,
        row,
        anchorRow: anchorRow?.replaceAll(
          STEPS_ANCHOR_RULE_SENTENCE,
          "A bullet under a steps heading is procedural.",
        ),
        expect: "profile/wp04",
      },
    ];

    // Six mutations, six DISTINCT expected keys. Without this the probe could run the same cell
    // twice and report six passes over five drift routes — a denominator that is silently short is
    // the failure a vacuity floor over an EMPTY list never catches, so the count is derived from the
    // mutation table itself and compared against the pin's own member count.
    const expectedKeys = mutations.map((m) => m.expect);
    expect(new Set(expectedKeys).size, "the six mutations must target six DISTINCT members").toBe(
      mutations.length,
    );
    expect(
      new Set(expectedKeys),
      "every member of the pin must have a mutation, and every mutation a member",
    ).toEqual(new Set(stepsAnchorPin(stdout, row, anchorRow).map((m) => m.key)));

    for (const m of mutations) {
      // PREMISE, FORCED: the mutation must actually have changed the artifact it names. A
      // replacement that silently matched nothing would make the arm below assert that an unmutated
      // input still passes, which is the vacuity this round keeps finding in its own probes.
      const changed = m.expect.startsWith("gate/")
        ? m.gate !== stdout
        : m.expect === "profile/wp04"
          ? m.anchorRow !== anchorRow
          : m.row !== row;
      expect(changed, `the mutation "${m.name}" changed no byte of its artifact`).toBe(true);
      expect(stepsAnchorBroken(m.gate, m.row, m.anchorRow), m.name).toEqual([
        m.expect,
      ]);

      // AND THE MESSAGE THE BROKEN MEMBER CARRIES IS THE ONE A READER GETS. Asserting only the key
      // would leave the six messages unexercised, and an unexercised message is how a failure that
      // names nothing ships: the arm would go red and the reader would still have to diff two files
      // by hand to learn which half moved.
      const broken = stepsAnchorPin(m.gate, m.row, m.anchorRow).find(
        (x) => !x.holds,
      );
      expect(broken, m.name).toBeDefined();
      expect(broken?.message, `${m.name} — the failure must name the ARTIFACT`).toContain(
        m.expect.startsWith("gate/")
          ? "GATE's refusal"
          : m.expect === "profile/wp04"
            ? "PROFILE's WP-04 row"
            : "PROFILE's WP-11 row",
      );
      expect(broken?.message, `${m.name} — the failure must name the SENTENCE`).toContain(
        m.expect.endsWith("/wp04")
          ? STEPS_ANCHOR_RULE_SENTENCE
          : m.expect.endsWith("/rule")
            ? STEPS_RULE_SENTENCE
            : STEPS_REMEDY_SENTENCE,
      );
    }

    // THE CONTROL MUTATION — SPECIFICITY, NOT JUST SENSITIVITY. Six arms that all red prove the pin
    // notices change; they do not prove it notices only the change it is for. A pin that reds on
    // every unrelated edit trains a maintainer to clear it without reading it, which is the
    // behaviour this same round writes a separate warning about. Each artifact is edited in a place
    // no pinned sentence depends on — the gate's trailing scan-set advice, and the row's STATUS
    // cell — and the broken-key list must stay empty.
    const controlGate = stdout.replaceAll(
      "Do NOT narrow the scan set",
      "Do NOT shrink the scan set",
    );
    const controlRow = row?.replace("| decidable |", "| decidable  |");
    const controlAnchorRow = anchorRow?.replace(
      "| decidable |",
      "| decidable  |",
    );
    expect(controlGate, "the control must actually have changed the GATE text").not.toBe(stdout);
    expect(controlRow, "the control must actually have changed the WP-11 row").not.toBe(row);
    expect(
      controlAnchorRow,
      "the control must actually have changed the WP-04 row",
    ).not.toBe(anchorRow);
    expect(
      stepsAnchorBroken(controlGate, controlRow, controlAnchorRow),
      "an edit touching no pinned sentence must break NO member",
    ).toEqual([]);
  });

  it("WR-09 / Residual 4: a FOUR-SPACE-INDENTED numbered line under `## Steps` IS admitted as a step bullet — the disclosed verdict, measured", () => {
    const rel = "agent-factory/workflows/02-fixture.md";
    // An indented code block: a paragraph, a blank line, then four-space-indented content. Indented
    // code blocks carry no delimiter, so `fencedLineFlags` cannot see them and the marker test is
    // asked of the line exactly as if it were a step.
    const body = (withBlock: boolean): string =>
      [
        "# Workflow: Indented Block Workflow",
        "",
        "## Steps",
        `1. ${VERB} the shared context first.`,
        "",
        "The transcript below is an indented code block:",
        "",
        ...(withBlock ? ["    1. npm run gate"] : []),
        "",
        "## Stop conditions",
        "- The ticket fails the Definition of Ready -> stop and hand back.",
        "",
      ].join("\n");

    const control = runGate(
      makeMirror("gops-lex-wr09-blockctrl-", { plant: { [rel]: body(false) } }),
    );
    const planted = runGate(
      makeMirror("gops-lex-wr09-block-", { plant: { [rel]: body(true) } }),
    );

    // THE ADMISSION IS MEASURED, NOT INFERRED FROM AN EXIT CODE. The bullet DENOMINATOR moves by
    // exactly one, which is what says the transcript line was counted AS A STEP rather than merely
    // that something somewhere went red.
    expect(bulletTotals(planted.stdout).bullets).toBe(
      bulletTotals(control.stdout).bullets + 1,
    );
    // And the direction is fail-CLOSED: a false red on correct text, never a silent pass.
    expect(control.status).toBe(0);
    expect(planted.status).toBe(1);
    expect(planted.stdout).toContain(`${rel}:`);
    expect(planted.stdout).toContain("WP-01 [not-an-approved-verb]");
  });

  it("WR-09: the ORDERED arm decides `procedural` with NO section anchor — the marker character is the only variable", () => {
    const rel = "agent-factory/workflows/03-fixture.md";
    // One word over the procedural bound and comfortably under the descriptive one, so the SENTENCE
    // is identical in both runs and only the arm that classifies it differs.
    const LONG = filler(PROCEDURAL_SENTENCE_MAX_WORDS + 1);
    expect(countWords(`${LONG}.`)).toBeGreaterThan(PROCEDURAL_SENTENCE_MAX_WORDS);
    expect(countWords(`${LONG}.`)).toBeLessThanOrEqual(DESCRIPTIVE_SENTENCE_MAX_WORDS);

    const body = (marker: string): string =>
      [
        "# Workflow: Unanchored Ordered Workflow",
        "",
        "## Steps",
        `1. ${VERB} the shared context first.`,
        "",
        "## Notes",
        `${marker}${LONG}.`,
        "",
      ].join("\n");

    const ordered = runGate(
      makeMirror("gops-lex-wr09-ord-", { plant: { [rel]: body("    1. ") } }),
    );
    const unordered = runGate(
      makeMirror("gops-lex-wr09-unord-", { plant: { [rel]: body("    - ") } }),
    );

    // The ordered arm reaches a line NO section anchor reaches, and it moves the published
    // procedural count by exactly one.
    expect(sentenceTotals(ordered.stdout).procedural).toBe(
      sentenceTotals(unordered.stdout).procedural + 1,
    );
    expect(unordered.status).toBe(0);
    expect(ordered.status).toBe(1);
    expect(ordered.stdout).toContain("[procedural-sentence-too-long]");
    expect(ordered.stdout).toContain(rel);
  });

  it("WR-09: the two `procedural` arms, their UNION and its complement — all four cells asserted", () => {
    const rel = "agent-factory/workflows/04-fixture.md";
    const LONG = filler(PROCEDURAL_SENTENCE_MAX_WORDS + 1);

    const doc = (heading: string, marker: string): string =>
      [
        "# Workflow: Union Fixture Workflow",
        "",
        heading,
        `${marker}${LONG}.`,
        "",
      ].join("\n");
    const cell = (
      label: string,
      heading: string,
      marker: string,
    ): { status: number; stdout: string } =>
      runGate(
        makeMirror(`gops-lex-wr09-union-${label}-`, {
          plant: { [rel]: doc(heading, marker) },
        }),
      );

    // The two arms are `inSteps && isBullet` and `ORDERED_MARKER`. The four cells are both arms,
    // each arm alone, and neither — and the last one is what makes the other three a measurement.
    const both = cell("both", "## Steps", "    1. ");
    const anchoredOnly = cell("anchored", "## Steps", "    - ");
    const orderedOnly = cell("ordered", "## Notes", "    1. ");
    const neither = cell("neither", "## Notes", "    - ");

    expect({
      both: both.status,
      anchoredOnly: anchoredOnly.status,
      orderedOnly: orderedOnly.status,
      neither: neither.status,
    }).toEqual({ both: 1, anchoredOnly: 1, orderedOnly: 1, neither: 0 });

    for (const r of [both, anchoredOnly, orderedOnly]) {
      expect(r.stdout).toContain("[procedural-sentence-too-long]");
    }
    // THE COMPLEMENT. The identical sentence under neither arm is DESCRIPTIVE, and 21 words is
    // inside the 25-word descriptive bound — so it is reported by neither length rule. Without this
    // cell the three above are consistent with a gate that calls every long sentence procedural.
    expect(neither.stdout).not.toContain("[procedural-sentence-too-long]");
    expect(neither.stdout).not.toContain("[descriptive-sentence-too-long]");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (8b) WR-05 — THE UNDECIDED HEADING LEVEL IS A MOVED NUMBER, NOT A SILENCE.
//
// `WP-11` and `WP-04` are published for `## Steps` and decided for that spelling only. Every other
// ATX level is a DISCLOSED FLOOR, and before this block the floor was a promise: a prose-only
// `### Steps` section violated the level-agnostic rule the profile used to publish, contributed no
// member to `stepsFiles`, produced no refusal, and the whole gate exited 0 with the file unnamed.
// Live reachability was ZERO, so no green suite could ever have caught it and none did.
//
// WHAT THE CASES BELOW HOLD. The INTENDED verdict for an undecided level is asserted explicitly —
// "not a WP-11 finding" is a decision, and an absence of findings must never be allowed to read as
// coverage. Beside it the tally is required to MOVE, which is the difference between a residual that
// is documented and one that is closed.
//
// The prose-only `## Steps` RED control that must not regress lives in the WR-04 case above, which
// now asserts BOTH of WP-11's sentences in both artifacts. It is not duplicated here.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The `any`-level pattern's declaration AS IT APPEARS IN THE COMMITTED `.js`, for the scratch-build
 * probe below. Written out here because the probe's whole point is to break the SHIPPED bytes.
 */
const ANY_LEVEL_DECL =
  "const STEPS_HEADING_ANY_LEVEL = /^#{1,6} Steps\\s*$/;";

/**
 * Run a COPY of the committed gate with one expression replaced — the falsifiability lever for
 * refusals that are unreachable on a healthy tree.
 *
 * The whole `scripts/*.js` set is copied because the gate imports its siblings; only the one file is
 * mutated. A replacement that matches nothing THROWS rather than silently running the unmutated
 * build, because a probe whose mutation missed would report a green as evidence of a passing check.
 */
function runScratchGate(
  checkRoot: string,
  from: string,
  to: string,
): { status: number; stdout: string } {
  const dir = freshTmp("gops-lex-scratchbuild-");
  for (const f of readdirSync(join(ROOT, "scripts")).filter((n) =>
    n.endsWith(".js"),
  )) {
    copyFileSync(join(ROOT, "scripts", f), join(dir, f));
  }
  const gate = join(dir, "check-imperative-lexicon.js");
  const src = readFileSync(gate, "utf8");
  if (!src.includes(from)) {
    throw new Error(
      `the scratch mutation matched no byte of the committed gate: ${from}`,
    );
  }
  writeFileSync(gate, src.replace(from, to), "utf8");
  // THE PATH IS RESOLVED THROUGH ITS SYMLINKS BEFORE SPAWNING, and this is load-bearing rather than
  // tidy. The gate runs `runAll()` only when `import.meta.url === pathToFileURL(process.argv[1])`.
  // On macOS the OS temp dir is `/var/folders/…`, a symlink to `/private/var/folders/…`; the ESM
  // loader reports the real path while `argv[1]` keeps the symlinked one, so the guard is false, the
  // module loads, runs NOTHING and exits 0 with empty output. Every assertion against such a run is
  // then satisfied by silence — the first draft of this probe reported a green control and a green
  // mutation for exactly that reason.
  const resolved = realpathSync(gate);
  const r = spawnSync("node", [resolved], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  const stdout = (r.stdout ?? "") + (r.stderr ?? "");
  // PREMISE: the scratch build actually RAN. A run that produced no output cannot be evidence for
  // or against anything, and it is indistinguishable from a passing gate by exit code alone.
  if (!stdout.includes("[guard_imperative_lexicon]")) {
    throw new Error(
      `the scratch build produced no gate output (status ${r.status}) — it did not run, so no ` +
        `verdict below is measuring anything`,
    );
  }
  return { status: r.status ?? -1, stdout };
}

/** The published steps-heading tally, parsed from the run that produced it. */
type StepsTally = { decided: number; undecided: number; any: number };
function stepsTally(out: string): StepsTally {
  const m =
    /steps headings by ATX level: (\d+) at the decided `## Steps` level, (\d+) at any other level, (\d+) seen in total/.exec(
      out,
    );
  // PREMISE, FORCED. A run that stopped publishing the tally would otherwise make every comparison
  // below compare two zeroes and pass — the vacuity shape this round has met in its own probes.
  if (m === null) {
    throw new Error(
      "the run published NO steps-heading tally line, so nothing below is measuring the floor",
    );
  }
  return { decided: +m[1], undecided: +m[2], any: +m[3] };
}

/** A workflow with a conforming `## Steps` section plus one extra section, spelled as given. */
const workflowWithExtraSection = (body: string[]): string =>
  [
    "# Workflow: Sub Level Steps Workflow",
    "",
    "## Steps",
    `1. ${VERB} the shared context first.`,
    "",
    "## Notes",
    "",
    ...body,
    "",
  ].join("\n");

describe("WR-05 — a steps heading at an undecided ATX level is measured, published and refused", () => {
  const REL = "agent-factory/workflows/01-fixture.md";
  /** The unplanted baseline every case below is compared against, not a transcribed number. */
  const baseline = (): { run: ReturnType<typeof runGate>; tally: StepsTally } => {
    const run = runGate(makeMirror("gops-lex-wr05-base-"));
    return { run, tally: stepsTally(run.stdout) };
  };

  it("the BASELINE mirror is clean and its tally is not vacuous — the false-red and false-zero control", () => {
    const { run, tally } = baseline();
    expect(run.status).toBe(0);
    // TWO-SIDED, and this is the side a zero-valued floor needs most: a walk that reached nothing
    // reports zero undecided headings and reads exactly like a conforming corpus.
    expect(tally.undecided).toBe(0);
    expect(tally.decided).toBeGreaterThan(0);
    expect(tally.any).toBe(tally.decided + tally.undecided);
  });

  it("a prose-only `### Steps` section is NOT a WP-11 finding — the INTENDED verdict — and moves the undecided tally by one", () => {
    const base = baseline();
    const doc = workflowWithExtraSection([
      "### Steps",
      "",
      "Prose sits here where a step bullet belongs.",
    ]);
    // DERIVED, never transcribed: a line number typed here would keep "passing" against a different
    // line the moment the fixture's preamble changed length.
    const at = doc.split("\n").indexOf("### Steps") + 1;
    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr05-h3-", { plant: { [REL]: doc } }),
    );
    const tally = stepsTally(stdout);

    // THE INTENDED VERDICT, ASSERTED RATHER THAN INFERRED FROM AN ABSENCE. Under the narrowing the
    // profile now publishes, a `### Steps` section is outside WP-11. The set equality that produces
    // the WP-11 refusal must therefore NOT fire, and the decided-level tally must not move either.
    expect(stdout).not.toContain(
      "the step-heading file set and the bullet-bearing file set are not equal",
    );
    expect(tally.decided).toBe(base.tally.decided);

    // AND THE FLOOR MOVED. Exactly one, named by file and line, with the remedy in the refusal.
    expect(tally.undecided).toBe(base.tally.undecided + 1);
    expect(tally.any).toBe(tally.decided + tally.undecided);
    expect(status).toBe(1);
    expect(stdout).toContain("sit at an ATX level WP-11 does not decide");
    expect(stdout).toContain(`${REL}:${at} \`### Steps\``);
    expect(stdout).toContain("Deleting this tally is not the remedy");
  });

  it("a prose-only `# Steps` section is covered by the SAME tally — the floor is every undecided spelling, not the one the review named", () => {
    const base = baseline();
    const doc = workflowWithExtraSection([
      "# Steps",
      "",
      "Prose sits here where a step bullet belongs.",
    ]);
    const at = doc.split("\n").indexOf("# Steps") + 1;
    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr05-h1-", { plant: { [REL]: doc } }),
    );
    const tally = stepsTally(stdout);

    expect(stdout).not.toContain(
      "the step-heading file set and the bullet-bearing file set are not equal",
    );
    expect(tally.decided).toBe(base.tally.decided);
    expect(tally.undecided).toBe(base.tally.undecided + 1);
    expect(tally.any).toBe(tally.decided + tally.undecided);
    expect(status).toBe(1);
    expect(stdout).toContain(`${REL}:${at} \`# Steps\``);
  });

  it("a `## Steps` heading written INSIDE A FENCE moves NEITHER tally — the tripwire cannot be tripped by documentation", () => {
    const base = baseline();
    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr05-fence-", {
        plant: {
          [REL]: workflowWithExtraSection([
            "A workflow may quote the shape it governs:",
            "",
            "```md",
            "## Steps",
            "",
            "Prose sits here where a step bullet belongs.",
            "",
            "### Steps",
            "```",
          ]),
        },
      }),
    );
    const tally = stepsTally(stdout);

    // BOTH sides. The fenced `## Steps` must not inflate the DECIDED tally either — a quoted
    // example that enters the decided count would shift the WP-11 denominator, which is the same
    // boundary every fence-aware predicate in this module is defending.
    expect(tally.decided).toBe(base.tally.decided);
    expect(tally.undecided).toBe(base.tally.undecided);
    expect(tally.any).toBe(base.tally.any);
    expect(status).toBe(0);
  });

  it("the LIVE tree's undecided tally is pinned two-sided, and the pin is proven able to red by a planted member", () => {
    // THE LIVE SIDE. The mirrors above prove the mechanism; this proves the SHIPPED corpus is
    // actually inside it. Read-only: the gate is spawned against the repo root and writes nothing.
    const live = runGate(ROOT);
    const tally = stepsTally(live.stdout);
    expect(live.status).toBe(0);
    expect(tally.undecided).toBe(0);
    // The other side of the pin, derived in this same run rather than transcribed: a floor over a
    // scan that saw no steps heading at all is not a floor.
    expect(tally.decided).toBeGreaterThan(0);
    expect(tally.any).toBe(tally.decided + tally.undecided);

    // AND THE PIN CAN RED. The planted member is the falsifiability proof: without it, a pin whose
    // value is zero is indistinguishable from a pin measuring nothing.
    const planted = runGate(
      makeMirror("gops-lex-wr05-plant-", {
        plant: {
          [REL]: workflowWithExtraSection([
            "### Steps",
            "",
            "Prose sits here where a step bullet belongs.",
          ]),
        },
      }),
    );
    expect(planted.status).toBe(1);
    expect(stepsTally(planted.stdout).undecided).toBe(1);
  });

  it("the tally's three premises are PROVEN able to refuse — a premise never seen failing is a comment", () => {
    // A SCRATCH BUILD OF THE SHIPPED SOURCE, not a git checkout (the 29-27 precedent): keying a
    // permanent case to a commit rots the first time the file moves, while reverting one expression
    // in a copy of the committed `.js` reconstructs the broken build from whatever ships today.
    //
    // WHY THESE THREE ARE WORTH THE SPAWNS. Every one of them is unreachable on a healthy tree, so
    // each is an assertion that has never been observed doing anything. That is precisely the shape
    // this phase keeps finding: a check whose value is a constant, indistinguishable from a check
    // that cannot fire.
    const mirror = makeMirror("gops-lex-wr05-premise-");

    // THE CONTROL. Without it, three reds prove only that a scratch build reds.
    const control = runScratchGate(mirror, ANY_LEVEL_DECL, ANY_LEVEL_DECL);
    expect(control.status, "an unmutated scratch build must still pass").toBe(0);

    // PREMISE 1 and 3: the `any` pattern stops matching. The reconciliation sum breaks, and the
    // vacuity floor refuses to publish a level floor over a walk that reached nothing.
    const anyZero = runScratchGate(
      mirror,
      ANY_LEVEL_DECL,
      ANY_LEVEL_DECL.replace(" Steps", " StepsZZZ"),
    );
    expect(anyZero.status).toBe(1);
    expect(anyZero.stdout).toContain("the steps-heading tallies do not reconcile");
    expect(anyZero.stdout).toContain("saw ZERO steps headings across");

    // PREMISE 2: the section-extent loop's own anchor count stops advancing, so the two independent
    // walks disagree. This is the check that makes the tally an audit of the loop beside it rather
    // than a restatement of it.
    const anchors = runScratchGate(
      mirror,
      "stepsHeadings.anchors += 1;",
      "stepsHeadings.anchors += 0;",
    );
    expect(anchors.status).toBe(1);
    expect(anchors.stdout).toContain("the section-extent loop anchored on 0");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// (9) WR-06 — THE TECHNICAL NAME TABLE SCAN READS THE ONE FENCE AUTHORITY.
//
// This module already imports `fencedLineFlags` and already consumes it for the governed-prose
// question. The two table locators were the one place left in the file that answered a
// SECTION-EXTENT question with a second grammar over the same bytes — a bare `startsWith("## ")`
// scan that cannot tell a heading from a heading QUOTED IN AN EXAMPLE.
//
// THE DIRECTION IS NOT CURRENTLY REACHABLE ON THE LIVE CORPUS, AND IT IS FIXED ANYWAY. The phase's
// thesis is that a second grammar over the same bytes is a defect even while the two grammars agree,
// and this particular set is load-bearing: a multi-word Technical Name collapses to ONE term in
// countWords, so an injected or dropped term moves sentences across the length bounds and changes
// verdicts in a guard that never mentions tables at all.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The note-kind rows the real derivation expects, built from the gate's own derived part size. */
const kindRows = (n: number, prefix = "kind"): string[] =>
  Array.from({ length: n }, (_, i) => `| \`${prefix}-${i}\` | what it records ${i} |`);

const NOTE_KINDS_HEADING = "## The six note kinds";

describe("WR-06 — a fenced line cannot truncate, relocate or inject into the Technical Name table scan", () => {
  it("a fenced `## ` line does NOT end the section — every row below it is still harvested", () => {
    // PREMISE, asserted so the case cannot pass vacuously: rows are placed BELOW the fenced heading,
    // so there is something for the truncation to have lost.
    const below = kindRows(NOTE_KIND_N).slice(1);
    expect(below.length).toBeGreaterThan(0);

    const doc = [
      "# Contract: context note",
      "",
      NOTE_KINDS_HEADING,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      kindRows(NOTE_KIND_N)[0],
      "",
      "```md",
      "## Example output",
      "",
      "| `injected-a` | a row inside a fenced example |",
      "```",
      "",
      ...below,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr06-trunc-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    // All NOTE_KIND_N rows survive, so the derived part is the full size and the pin holds.
    expect(stdout).toContain(`noteKinds ${NOTE_KIND_N}`);
    // And the fenced row was not harvested on the way past.
    expect(stdout).not.toContain("injected-a");
    expect(status).toBe(0);
  });

  it("a table row inside a fence is NOT harvested — a fenced example cannot inject a term", () => {
    const doc = [
      "# Contract: context note",
      "",
      NOTE_KINDS_HEADING,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      ...kindRows(NOTE_KIND_N),
      "",
      "```md",
      "| `injected-b` | a fenced row with no heading anywhere near it |",
      "```",
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr06-inject-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    expect(stdout).toContain(`noteKinds ${NOTE_KIND_N}`);
    expect(stdout).not.toContain("injected-b");
    expect(status).toBe(0);
  });

  it("a heading QUOTED INSIDE A FENCE is not matched as the section's own heading", () => {
    // The fenced copy sits BEFORE the real one, so a fence-blind `indexOf` locks onto the wrong line
    // and scans an example block instead of the table.
    const doc = [
      "# Contract: context note",
      "",
      "```md",
      NOTE_KINDS_HEADING,
      "",
      "| `injected-c` | a fenced row under a fenced heading |",
      "```",
      "",
      NOTE_KINDS_HEADING,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      ...kindRows(NOTE_KIND_N),
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr06-anchor-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    expect(stdout).toContain(`noteKinds ${NOTE_KIND_N}`);
    expect(stdout).not.toContain("injected-c");
    expect(status).toBe(0);
  });

  it("the same three defences hold for the BOARD column table, which is a second scan over a second document", () => {
    const cols = Array.from(
      { length: BOARD_COLUMN_N },
      (_, i) => `| Column ${i} | entry rule ${i} | Orchestrator | 4 |`,
    );
    const doc = [
      "# Board",
      "",
      "```md",
      BOARD_TABLE_HEADER,
      "| `injected-d` | a fenced row under a fenced header | x | 1 |",
      "```",
      "",
      BOARD_TABLE_HEADER,
      "|---|---|---|---|",
      ...cols,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr06-board-", { plant: { [BOARD]: doc } }),
    );
    expect(stdout).toContain(`boardColumns ${BOARD_COLUMN_N}`);
    expect(stdout).not.toContain("injected-d");
    expect(status).toBe(0);
  });

  it("a fence INSIDE the board table does not end it — the rows below the example survive", () => {
    // THIS CASE EXISTS BECAUSE A MUTATION FOUND ITS ABSENCE. Removing the board loop's fenced-line
    // skip reddened NOTHING: the case above puts its fence BEFORE the header row, so it exercises
    // only the heading-match arm. The board loop ends at the first line that is not a row, and a
    // fence delimiter is not a row — so without the skip an example sitting INSIDE the table ends
    // the table, and every column below it leaves the derived vocabulary silently.
    const cols = Array.from(
      { length: BOARD_COLUMN_N },
      (_, i) => `| Column ${i} | entry rule ${i} | Orchestrator | 4 |`,
    );
    const below = cols.slice(1);
    // PREMISE: there ARE rows below the fence, so there is something for the truncation to lose.
    expect(below.length).toBeGreaterThan(0);
    const doc = [
      "# Board",
      "",
      BOARD_TABLE_HEADER,
      "|---|---|---|---|",
      cols[0],
      "```md",
      "| `injected-e` | a fenced example row inside the table | x | 1 |",
      "```",
      ...below,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr06-boardmid-", { plant: { [BOARD]: doc } }),
    );
    expect(stdout).toContain(`boardColumns ${BOARD_COLUMN_N}`);
    expect(stdout).not.toContain("injected-e");
    expect(status).toBe(0);
  });

  // ── The four axes the rewire MOVED, each of which a mutation proved nothing pinned ────────────
  //
  // ADDED BECAUSE FOUR MUTATIONS OF PLAN 29-24's REWIRE REDDENED NOTHING. The suite was green with
  // the table section bound restored to END OF FILE, with the authority's `trimEnd()` equality
  // replaced by the deleted exact-equality scan, with the step anchor made fence-blind, and with
  // every step section after the first silently ignored. Four unpinned axes in a round whose entire
  // subject is unpinned widenings, found by mutating rather than by reading — which is the only
  // reason they are here.
  //
  // Two of them are behaviour this rewire CHANGED: the section close went from level-two-only to
  // level-at-most-two, and the heading equality went from exact to `trimEnd()`-normalized. An
  // unpinned change is indistinguishable from an accident.

  it("a REAL later `## ` heading ENDS the note-kind table section — a row beyond it is not harvested", () => {
    const beyond = "| `beyond-two` | a row in a LATER section entirely |";
    const doc = [
      "# Contract: context note",
      "",
      NOTE_KINDS_HEADING,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      ...kindRows(NOTE_KIND_N),
      "",
      "## A later section",
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      beyond,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr08-end2-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    expect(stdout).toContain(`noteKinds ${NOTE_KIND_N}`);
    expect(stdout).not.toContain("beyond-two");
    expect(status).toBe(0);
  });

  it("a REAL later `# ` heading ALSO ends it — the level widening plan 29-24 introduced, pinned in the direction it moved", () => {
    // THE DELETED CLOSE WAS `startsWith("## ")` AND WOULD WALK STRAIGHT PAST THIS LINE. The shared
    // authority closes on a heading of level AT MOST two, so the section now ends EARLIER — fewer
    // rows harvested, which is the direction that cannot silently inject a Technical Name. Without
    // this case that widening has no assertion behind it at all.
    const beyond = "| `beyond-one` | a row below a LEVEL-ONE heading |";
    const doc = [
      "# Contract: context note",
      "",
      NOTE_KINDS_HEADING,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      ...kindRows(NOTE_KIND_N),
      "",
      "# An appendix at level one",
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      beyond,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr08-end1-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    expect(stdout).toContain(`noteKinds ${NOTE_KIND_N}`);
    expect(stdout).not.toContain("beyond-one");
    expect(status).toBe(0);
  });

  it("a heading carrying ONE TRAILING SPACE is still located — the authority's `trimEnd()` equality, which the deleted helper did not apply", () => {
    // The deleted private helper compared `lines[i] === heading`. This heading is invisible to that
    // and the whole part would fail to derive, so the gate refuses with a named derivation failure.
    const doc = [
      "# Contract: context note",
      "",
      `${NOTE_KINDS_HEADING} `,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      ...kindRows(NOTE_KIND_N),
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr08-trail-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    expect(stdout).toContain(`noteKinds ${NOTE_KIND_N}`);
    expect(stdout).not.toContain(
      "part of the Technical Names set could not be derived",
    );
    expect(status).toBe(0);
  });

  it("a heading carrying a LEADING space is NOT the heading — the bound on that same equality", () => {
    // The other side of the widening. The authority normalises the END of the line and nothing else,
    // so the column-zero convention four gates share survives. The derivation REFUSES by name rather
    // than quietly returning an empty part.
    const doc = [
      "# Contract: context note",
      "",
      ` ${NOTE_KINDS_HEADING}`,
      "",
      "| Kind | What it records |",
      "| --- | --- |",
      ...kindRows(NOTE_KIND_N),
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr08-lead-", { plant: { [NOTE_CONTRACT]: doc } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `the "noteKinds" part of the Technical Names set could not be derived`,
    );
    expect(stdout).toContain(NOTE_KINDS_HEADING);
  });

  it("a `## Steps` heading QUOTED INSIDE A FENCE opens no step section — the anchor scan reads the same toggle its extent does", () => {
    const rel = "agent-factory/workflows/00-fixture.md";
    const NON_CONFORMING = "The Orchestrator pulls the ticket into development.";
    const doc = [
      "# Workflow: Fenced Anchor Workflow",
      "",
      "## Notes",
      "",
      "```md",
      "## Steps",
      "```",
      "",
      `- ${NON_CONFORMING}`,
      "",
    ].join("\n");

    const { status, stdout } = runGate(
      makeMirror("gops-lex-wr08-fenceanchor-", { plant: { [rel]: doc } }),
    );
    // A fence-blind anchor scan would open a step section at the QUOTED heading, and the bullet
    // below the fence would then be measured as a step and reported under WP-01.
    expect(stdout).not.toContain(NON_CONFORMING);
    expect(stepFindingCount(stdout)).toBe(0);
    expect(status).toBe(0);
  });

  it("a file carrying TWO `## Steps` sections has BOTH governed — one range per anchor, never only the first", () => {
    const rel = "agent-factory/workflows/00-fixture.md";
    const NON_CONFORMING = "The Orchestrator pulls the ticket into development.";
    const doc = (second: boolean): string =>
      [
        "# Workflow: Two Sections Workflow",
        "",
        "## Steps",
        `- ${VERB} the shared context first.`,
        "",
        "## Interlude",
        "",
        "Prose between the two step sections.",
        "",
        "## Steps",
        ...(second ? [`- ${NON_CONFORMING}`] : [`- ${VERB2} the result.`]),
        "",
      ].join("\n");

    const control = runGate(
      makeMirror("gops-lex-wr08-twoctrl-", { plant: { [rel]: doc(false) } }),
    );
    const planted = runGate(
      makeMirror("gops-lex-wr08-two-", { plant: { [rel]: doc(true) } }),
    );

    // PREMISE: both documents contribute the SAME number of step bullets, so the only thing that
    // varies is whether the SECOND section's bullet is measured at all.
    expect(bulletTotals(planted.stdout).bullets).toBe(
      bulletTotals(control.stdout).bullets,
    );
    expect(control.status).toBe(0);
    expect(planted.status).toBe(1);
    expect(planted.stdout).toContain(NON_CONFORMING);
    // Exactly ONE finding appears, and it is a WP-01 verdict over the second section's bullet. The
    // kind is `determiner-subject` because the mirror derives its own Technical Names and has never
    // heard of `Orchestrator` — asserting `actor-subject` here would be a case passing through the
    // wrong arm, which is the trap this file's own header records.
    expect(stepFindingCount(planted.stdout)).toBe(
      stepFindingCount(control.stdout) + 1,
    );
    expect(planted.stdout).toContain("WP-01 [determiner-subject]");
  });

  it("the two table sources on the LIVE tree carry zero fenced heading lines and zero fenced rows", () => {
    // This is what makes the "identical before and after" claim a MEASUREMENT rather than a hope. If
    // either document ever grows a fenced heading or a fenced table row, the live set becomes
    // sensitive to this fix and that fact should surface here rather than in a verdict elsewhere.
    for (const rel of [NOTE_CONTRACT, BOARD]) {
      const text = readFileSync(join(ROOT, rel), "utf8");
      const flags = fencedLineFlags(text);
      const lines = text.split("\n");
      let fencedHeadings = 0;
      let fencedRows = 0;
      for (let i = 0; i < lines.length; i++) {
        if (!flags[i]) continue;
        if (lines[i].startsWith("## ")) fencedHeadings += 1;
        if (lines[i].trim().startsWith("|")) fencedRows += 1;
      }
      expect({ rel, fencedHeadings, fencedRows }).toEqual({
        rel,
        fencedHeadings: 0,
        fencedRows: 0,
      });
    }
    // And the derived set is at its pinned size, so neither scan silently lost or gained a member.
    expect(TECHNICAL_NAMES.length).toBe(TECHNICAL_NAMES_COUNT);
  });
});
