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
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  APPROVED_STEP_VERBS,
  GOVERNED_CORPUS_COUNT,
  GOVERNED_CORPUS_PARTS,
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
    expect(stdout).toMatch(/imperative lexicon: 0 findings over \d+\/\d+ elements/);
    expect(stdout).toMatch(/sentence form: 0 findings over \d+\/\d+ elements/);
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
      "imperative lexicon: ZERO elements visited (expected 0) — this check was NOT performed",
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
    expect(stdout).toContain("imperative lexicon: ZERO elements visited");
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
