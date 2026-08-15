// check-diff-disposition.test.ts — the hermetic harness for the LANG-03 diff-disposition gate.
//
// WHAT THIS FILE IS FOR, STATED PLAINLY. `node scripts/check-diff-disposition.js` exits 0 against
// the tree at the end of plan 29-04, because no kit content has changed since the recorded base.
// That green is NOT this gate's acceptance evidence and must never be read as it: a gate that has
// never been watched refuse is a gate nobody has seen work.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is not proof for a safety or trace guard; the acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. So every behavioural case here drives the COMMITTED .js via
// spawnSync against a hermetic CHECK_ROOT mirror under the OS temp dir — never the .ts, and never
// the real tree. Nothing is ever written into the committed tree.
//
// WHY EACH MIRROR IS A REAL GIT REPOSITORY, WHICH THE OTHER GATE TESTS DO NOT NEED. This gate's
// entire left-hand side is a diff. A synthesized directory with no history gives it nothing to read,
// and a gate handed nothing reports a clean tree — so a mirror without commits would make every
// case pass for the wrong reason. Each mirror is therefore `git init`ed in the temp dir and carries
// TWO commits: the first is the base the gate compares against, the second carries the plant.
//
// WHY THE MIRRORS ARE SYNTHESIZED RATHER THAN COPIED, except for four files. The role and workflow
// bodies are written here so a plant can be isolated to one line. The claim registry, the
// disposition register and scripts/check-foundation-guards.ts are COPIED from the real tree,
// because those three are the gate's own frozen SOURCES: synthesizing them would replace the
// derivation under test with a fixture of itself.
//
// EVERY PLANT IS INTERPOLATED FROM THE GATE'S OWN EXPORTED SETS OR FROM THE REAL FROZEN SOURCES,
// never retyped. A literal typed here would be a second copy of the set living in the file that
// polices the first.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-diff-disposition.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DISPOSITION_DIR,
  BASE_FILE,
  FROZEN_SOURCES,
  FROZEN_SECTION_ANCHORS,
  POSITIVE_GUARD_LITERALS,
  POSITIVE_GUARD_LITERAL_COUNT,
  POSITIVE_GUARD_LITERAL_SITES,
  derivePositiveGuardLiterals,
  deriveFrozenSet,
  locateSection,
  touchedLines,
  WORKING_TREE_CARRIER,
  COMPANION_MIN_WORDS,
  isCompanionFilled,
  readDispositionRows,
  RESIDUE_FROM_REGISTRY_COUNT,
} from "./check-diff-disposition.js";
import {
  listRoles,
  listWorkflows,
  ROLE_COUNT,
  WORKFLOW_COUNT,
  ROLES_SUBPATH,
  WORKFLOWS_SUBPATH,
} from "./kit-model.js";
import { readRegistry, readRegister } from "./audit-model.js";
// The ONE place the out-of-set protocol file's path is declared. The residue's register-side member
// is pinned against this literal rather than retyped — a second spelling is the set-literal drift
// class in miniature.
import { PROTOCOL_FILE } from "./audit-prepass.js";
// The ONE derivation that produces the watched corpus. Imported here for the same reason the gate
// imports it: a second union computed in the file that polices the first is how one authority
// becomes two, and the CR-01 premise assertions below are worthless if they measure a different set
// from the one the gate measures.
import {
  safetySurfaceUnion,
  renderSafetySurface,
  OUT as SAFETY_SURFACE_PATH,
} from "./generate-safety-surface.js";
import { normalizeSentence, segmentClauses } from "./voice-model.js";
// The ONE fence toggle. Imported here for the SAME reason the gate must import it: a second
// recogniser in the file that polices the first is how one authority becomes two.
import { fencedLineFlags } from "./frontmatter.js";

const REPO = join(import.meta.dirname, "..");

/**
 * The gate's published measurement label, spelled ONCE here.
 *
 * It names the ELEMENT the denominator counts (WR-02), so six cases assert it and a seventh spelling
 * would be the set-literal drift class in miniature — rename the element grain and five cases keep
 * asserting a line the gate no longer prints, while the sixth is the only one that reds.
 */
const MEASURED_LABEL = "diff disposition — changed watched file(s)";
const GATE_JS = join(REPO, "scripts", "check-diff-disposition.js");

const REGISTER_REL = "docs/audit/28-disposition-register.md";
const REGISTRY_REL = "docs/audit/28-claim-registry.md";
const GUARDS_REL = "scripts/check-foundation-guards.ts";
const PROTOCOL_REL = `${ROLES_SUBPATH}/_role-switch-protocol.md`;

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// A git environment with no dependence on the developer's own config: no global or system config is
// read, and the identity is supplied by env rather than by `git config`, so the harness cannot fail
// on a box where committing needs a name.
const GIT_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "grugops harness",
  GIT_AUTHOR_EMAIL: "harness@example.invalid",
  GIT_COMMITTER_NAME: "grugops harness",
  GIT_COMMITTER_EMAIL: "harness@example.invalid",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

function gitIn(cwd: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: GIT_ENV });
  if (r.status !== 0) {
    throw new Error(
      `harness: \`git ${args.join(" ")}\` failed in ${cwd} (status ${r.status})\n${r.stdout ?? ""}${r.stderr ?? ""}`,
    );
  }
  return r.stdout ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The mirror corpus.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// The one sentence every mirror role's `## Hard limits` carries. Declared once here because three
// plants derive from it — the frozen-region change, its companion-bearing twin, and the shared-prefix
// non-intersection — and three spellings of one fixture is the drift class in miniature.
const HARD_LIMIT_SENTENCE =
  "Make a small diff for one ticket and never change the architecture without an ADR.";

const ROLE_BODY = (name: string): string =>
  [
    "---",
    "kind: role",
    "tier: core",
    "---",
    `# Role: ${name}`,
    "",
    "## One job",
    "This role does one thing and records what it did.",
    "",
    FROZEN_SECTION_ANCHORS[0].heading,
    HARD_LIMIT_SENTENCE,
    "",
    "## Notes",
    "This section sits outside every frozen structural section in the corpus.",
    "",
  ].join("\n");

const WORKFLOW_BODY = (name: string): string =>
  [
    `# Workflow: ${name}`,
    "",
    "## Steps",
    "1. Read the shared verified context before doing anything else.",
    "",
    FROZEN_SECTION_ANCHORS[1].heading,
    "Stop when the scope grows beyond the ticket that is in hand.",
    "",
    FROZEN_SECTION_ANCHORS[2].heading,
    "Commit the smallest diff that closes this one ticket.",
    "",
    "## Notes",
    "This section sits outside every frozen structural section in the corpus.",
    "",
  ].join("\n");

/** The real corpus filenames, so the mirror's derivations agree with the copied register. */
const REAL_ROLES = listRoles(REPO);
const REAL_WORKFLOWS = listWorkflows(REPO);

interface MirrorSpec {
  /**
   * repo-relative path -> content written into the BASE commit itself, over the starting corpus.
   *
   * WHY THIS FIELD HAD TO EXIST BEFORE WR-06 COULD BE PROVEN. A fenced heading truncating a frozen
   * region is a defect about a REWORD inside that region — the added and removed sides of one line.
   * Expressed as a plant alone, the fenced block and the reword land in the same diff and the case
   * becomes an INSERTION, which exercises only the added side and never the removed one. Putting the
   * fenced structure in the starting corpus is what makes the plant a one-line reword.
   *
   * Additive, and its premise is asserted below: every path named here is read back out of the base
   * commit and compared byte for byte, so a fixture that failed to land is a refusal rather than a
   * case that quietly proves something else.
   */
  readonly baseCorpus?: Readonly<Record<string, string>>;
  /**
   * ORDERED extra commits applied between the base commit and the final plant commit, each a map of
   * repo-relative path to content. Additive: a spec that omits it builds exactly the two-commit
   * mirror this harness has always built, so no existing case changes shape.
   *
   * WHY THIS FIELD HAD TO EXIST BEFORE CR-02 COULD BE BELIEVED. `makeMirror` built exactly TWO
   * commits, so "the companion changed in the SAME commit as the frozen clause" and "the companion
   * changed anywhere since the recorded base" are the same statement in every fixture written before
   * this one. A two-commit fixture cannot distinguish the rule from the bug, which is why the range-
   * versus-commit defect lived under a green suite: no case could have caught it.
   */
  readonly commits?: readonly Readonly<Record<string, string>>[];
  /** repo-relative path -> replacement content, applied in the FINAL commit. */
  readonly plant?: Readonly<Record<string, string>>;
  /** disposition filename (e.g. `29-05.md`) -> file content. */
  readonly dispositions?: Readonly<Record<string, string>>;
  /** Override the recorded base commit with this literal (for the unresolvable-base case). */
  readonly baseOverride?: string;
}

/** Writers bound to one mirror root. Shared by makeMirror and makeDivergentMirror. */
function mirrorWriters(root: string): {
  write: (rel: string, content: string) => void;
  copy: (rel: string) => void;
} {
  return {
    write: (rel, content) => {
      const dst = join(root, rel);
      mkdirSync(join(dst, ".."), { recursive: true });
      writeFileSync(dst, content, "utf8");
    },
    copy: (rel) => {
      const dst = join(root, rel);
      mkdirSync(join(dst, ".."), { recursive: true });
      copyFileSync(join(REPO, rel), dst);
    },
  };
}

/** The starting corpus every mirror shares, written but not committed. */
function writeCorpus(root: string): void {
  const { write, copy } = mirrorWriters(root);
  // The three frozen SOURCES are copied, never synthesized — see the header.
  copy(REGISTER_REL);
  copy(REGISTRY_REL);
  copy(GUARDS_REL);

  for (const f of REAL_ROLES) write(`${ROLES_SUBPATH}/${f}`, ROLE_BODY(f));
  // The protocol file is out-of-set for COUNTING (listRoles drops `_`-prefixed entries) and in the
  // watched corpus, so it exists and deliberately carries no `## Hard limits`.
  write(PROTOCOL_REL, "# Role switch protocol\n\nThis file carries no frozen section.\n");
  for (const f of REAL_WORKFLOWS)
    write(`${WORKFLOWS_SUBPATH}/${f}`, WORKFLOW_BODY(f));
}

/** The repo-relative paths one commit touched, read back from git rather than from the spec. */
function filesInCommit(root: string, sha: string): string[] {
  return gitIn(root, [
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    sha,
  ])
    .split("\n")
    .filter((p) => p.length > 0);
}

/**
 * Build a mirror and return its root, the base commit the gate is pointed at, and every commit
 * AFTER that base in oldest-first order.
 *
 * THE HARNESS ASSERTS ITS OWN PREMISE, because this is the round where a harness premise is what
 * failed. A three-commit fixture that silently collapsed into two would prove the exact opposite of
 * what its case claims — the companion and the reword would land together and the case would go
 * green under the very bug it was written to catch — and nothing else here would notice. So after
 * building, this refuses unless:
 *
 *   (1) the number of commits between the recorded base and HEAD is exactly the number of payloads
 *       supplied PLUS ONE, the final plant commit, which always exists because BASE_FILE is always
 *       written into it; and
 *   (2) every path named by payload `i` appears in commit `i` and in NO OTHER post-base commit —
 *       which catches a collapse in either direction, forward or backward.
 *
 * The base commit is excluded from (2) on purpose and not as a softening: it carries the whole
 * starting corpus by construction, so every payload path is necessarily in it.
 */
function makeMirror(
  prefix: string,
  spec: MirrorSpec = {},
): { root: string; base: string; commits: string[] } {
  const root = freshTmp(prefix);
  const { write } = mirrorWriters(root);
  writeCorpus(root);
  for (const [rel, content] of Object.entries(spec.baseCorpus ?? {})) {
    write(rel, content);
  }

  gitIn(root, ["init", "-q"]);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "base"]);
  const base = gitIn(root, ["rev-parse", "HEAD"]).trim();

  // ── The baseCorpus premise: what the fixture claims is in the base commit really is ──────────
  for (const [rel, content] of Object.entries(spec.baseCorpus ?? {})) {
    const inBase = gitIn(root, ["show", `${base}:${rel}`]);
    if (inBase !== content) {
      throw new Error(
        `harness premise: baseCorpus names ${rel}, but the recorded base commit ` +
          `${base.slice(0, 7)} carries different bytes at ${root}. A case whose starting corpus did ` +
          `not land proves something other than what it claims`,
      );
    }
  }

  const payloads = spec.commits ?? [];
  const commits: string[] = [];
  for (let i = 0; i < payloads.length; i++) {
    for (const [rel, content] of Object.entries(payloads[i])) write(rel, content);
    gitIn(root, ["add", "-A"]);
    gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", `payload-${i}`]);
    commits.push(gitIn(root, ["rev-parse", "HEAD"]).trim());
  }

  write(
    BASE_FILE,
    `---\nbase_commit: ${spec.baseOverride ?? base}\nrecorded: 2026-08-13\n---\n\nHarness mirror.\n`,
  );
  for (const [rel, content] of Object.entries(spec.plant ?? {})) {
    write(rel, content);
  }
  for (const [name, content] of Object.entries(spec.dispositions ?? {})) {
    write(`${DISPOSITION_DIR}/${name}`, content);
  }
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "plant"]);
  commits.push(gitIn(root, ["rev-parse", "HEAD"]).trim());

  // ── (1) the commit count ─────────────────────────────────────────────────────────────────────
  const counted = Number.parseInt(
    gitIn(root, ["rev-list", "--count", `${base}..HEAD`]).trim(),
    10,
  );
  if (counted !== payloads.length + 1) {
    throw new Error(
      `harness premise: ${payloads.length} payload commit(s) were supplied, so ${payloads.length + 1} ` +
        `commit(s) must exist between the recorded base and HEAD (the payloads plus the final plant ` +
        `commit), but git counted ${counted} at ${root}. A fixture that collapsed its commits cannot ` +
        `tell "in this commit" from "since the base", which is the whole point of the field`,
    );
  }
  if (commits.length !== counted) {
    throw new Error(
      `harness premise: recorded ${commits.length} commit sha(s) but git reports ${counted} at ${root}`,
    );
  }

  // ── (2) each payload's files are in that payload's commit and no other post-base commit ──────
  const namesPerCommit = commits.map((sha) => filesInCommit(root, sha));
  for (let i = 0; i < payloads.length; i++) {
    for (const rel of Object.keys(payloads[i])) {
      if (!namesPerCommit[i].includes(rel)) {
        throw new Error(
          `harness premise: payload ${i} names ${rel}, but commit ${commits[i].slice(0, 7)} does not ` +
            `touch it at ${root}. The payload did not land in its own commit`,
        );
      }
      for (let j = 0; j < namesPerCommit.length; j++) {
        if (j !== i && namesPerCommit[j].includes(rel)) {
          throw new Error(
            `harness premise: ${rel} belongs to payload ${i} but is ALSO touched by post-base commit ` +
              `${j} (${commits[j].slice(0, 7)}) at ${root}. A path touched by two carriers makes the ` +
              `attribution the case is about ambiguous`,
          );
        }
      }
    }
  }

  return { root, base, commits };
}

/**
 * A mirror whose recorded base is NOT an ancestor of HEAD — the shape a rebase or a force-push
 * leaves behind, and the one the recorded-base file names in its own words ("different again after
 * a rebase").
 *
 * This is the constructible unattributable case. The frozen clause lives in the recorded base's
 * tree and not in HEAD's, so it appears on the REMOVED side of the range diff — while no commit in
 * `base..HEAD` ever touched the file that carries it, because those commits descend from a sibling
 * of the base. The clause is therefore in the range and in no carrier, which is exactly the
 * condition that must fail CLOSED rather than fall through to "satisfied".
 */
function makeDivergentMirror(
  prefix: string,
  spec: {
    frozenPlant: Readonly<Record<string, string>>;
    dispositions: Readonly<Record<string, string>>;
    /** Applied on the divergent side, so the one carrier in the range can touch a watched file. */
    readonly postPlant?: Readonly<Record<string, string>>;
  },
): { root: string; base: string } {
  const root = freshTmp(prefix);
  const { write } = mirrorWriters(root);
  writeCorpus(root);

  gitIn(root, ["init", "-q"]);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "corpus"]);
  const fork = gitIn(root, ["rev-parse", "HEAD"]).trim();

  // The RECORDED BASE carries the frozen clause.
  for (const [rel, content] of Object.entries(spec.frozenPlant)) write(rel, content);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "recorded-base"]);
  const base = gitIn(root, ["rev-parse", "HEAD"]).trim();

  // HEAD descends from the FORK, not from the recorded base — so the frozen clause is absent from
  // HEAD's tree and no commit reachable from HEAD ever removed it.
  gitIn(root, ["checkout", "-q", "-b", "rebased", fork]);
  write(
    BASE_FILE,
    `---\nbase_commit: ${base}\nrecorded: 2026-08-13\n---\n\nHarness mirror (divergent history).\n`,
  );
  for (const [name, content] of Object.entries(spec.dispositions)) {
    write(`${DISPOSITION_DIR}/${name}`, content);
  }
  for (const [rel, content] of Object.entries(spec.postPlant ?? {})) {
    write(rel, content);
  }
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "post-rebase work"]);

  return { root, base };
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync(process.execPath, [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Plant helpers, every one interpolated from the fixtures above or from the real frozen sources.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const ROLE_UNDER_TEST = `${ROLES_SUBPATH}/${REAL_ROLES[0]}`;
const WORKFLOW_UNDER_TEST = `${WORKFLOWS_SUBPATH}/${REAL_WORKFLOWS[0]}`;

const REWORDED_HARD_LIMIT =
  "Keep the diff small for one ticket and never move the architecture without an ADR.";

/** The role body with its `## Hard limits` sentence reworded — one line, nothing else. */
const REWORDED_ROLE = ROLE_BODY(REAL_ROLES[0]).replace(
  HARD_LIMIT_SENTENCE,
  REWORDED_HARD_LIMIT,
);

/** The workflow body with `text` appended inside `## Notes` — outside every frozen section. */
function workflowWithNote(text: string): string {
  const body = WORKFLOW_BODY(REAL_WORKFLOWS[0]);
  return body.replace(
    "This section sits outside every frozen structural section in the corpus.",
    `This section sits outside every frozen structural section in the corpus.\n${text}`,
  );
}

/**
 * A registry row whose verbatim text is one line and segments to exactly one clause.
 *
 * PREMISE ASSERTED, NOT ASSUMED. If no such row exists the anchor case would silently plant nothing
 * recognisable and would then prove the wrong arm — the failure 29-03's actor-subject fixture hit.
 */
const ANCHOR_CLAIM = readRegistry(REPO).claims.find(
  (c) => !c.verbatim.includes("\n") && segmentClauses(c.verbatim).length === 1,
);

/**
 * The two companion files, TOUCHED without changing anything either derivation reads.
 *
 * A companion touch has to be visible to git and invisible to the extractors. If touching the
 * registry moved a verbatim anchor, or touching the guard source moved a literal declaration, the
 * three-commit cases below would go red on a SHORT-derivation refusal instead of on the companion
 * rule — a red for the wrong reason, which proves nothing about CR-02. The premise cases directly
 * beneath assert that neither derivation moves.
 */
const REGISTRY_TOUCHED =
  readFileSync(join(REPO, REGISTRY_REL), "utf8") +
  "\n<!-- harness: companion touch — no claim row changed -->\n";
const GUARDS_TOUCHED =
  readFileSync(join(REPO, GUARDS_REL), "utf8") +
  "\n// harness: companion touch — no literal declaration changed\n";

/** The registry verbatim the anchor cases plant, taken from the registry rather than retyped. */
const ANCHOR_VERBATIM = (ANCHOR_CLAIM as { verbatim: string } | undefined)?.verbatim ?? "";

/**
 * A positive guard literal that segments to exactly ONE clause and is in the frozen set under
 * `positiveGuardLiterals` — DERIVED from the gate's own exported set, never typed.
 *
 * Three of the nine literals qualify; the other six are either multi-clause or below the clause
 * floor. Planting one of those would prove the wrong arm, which is the failure 29-03's
 * actor-subject fixture already hit in this file.
 */
const FROZEN_ON_REAL_TREE = deriveFrozenSet(REPO);
const PLANTABLE_POSITIVE_LITERAL = POSITIVE_GUARD_LITERALS.find((l) => {
  const segs = segmentClauses(l);
  return (
    segs.length === 1 &&
    FROZEN_ON_REAL_TREE.text.get(segs[0].clause) === "positiveGuardLiterals"
  );
});

const dispositionFile = (rows: string[]): string =>
  [
    "# Harness dispositions",
    "",
    "## Dispositions",
    "",
    "| file | line | before | after | rule | disposition | companion |",
    "|---|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");

const row = (
  file: string,
  before: string,
  after: string,
  companion: string,
): string =>
  `| ${file} | 11 | ${before} | ${after} | WP-03 | Reworded under the profile and re-read for the permission it carries. | ${companion} |`;

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The premises this harness rests on.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-diff-disposition — harness premises", () => {
  it("the gate exports three frozen sources and at least three positive guard literals", () => {
    expect(Object.keys(FROZEN_SOURCES)).toEqual([
      "registryAnchors",
      "structuralSections",
      "positiveGuardLiterals",
    ]);
    expect(POSITIVE_GUARD_LITERALS.length).toBe(POSITIVE_GUARD_LITERAL_COUNT);
    expect(POSITIVE_GUARD_LITERALS.length).toBeGreaterThanOrEqual(3);
    // Extracted, not typed: every literal must appear verbatim in the source that declares it.
    for (const site of POSITIVE_GUARD_LITERAL_SITES) {
      const src = readFileSync(join(REPO, site.source), "utf8");
      expect(src).toContain(`const ${site.declaration}`);
    }
    for (const literal of POSITIVE_GUARD_LITERALS) {
      expect(readFileSync(join(REPO, GUARDS_REL), "utf8")).toContain(literal);
    }
  });

  it("the three frozen section anchors resolve at full cardinality on the real tree", () => {
    expect(FROZEN_SECTION_ANCHORS.map((a) => a.heading)).toEqual([
      "## Hard limits",
      "## Stop conditions",
      "## Commit",
    ]);
    expect(FROZEN_SECTION_ANCHORS[0].expected).toBe(ROLE_COUNT);
    expect(FROZEN_SECTION_ANCHORS[1].expected).toBe(WORKFLOW_COUNT);
    expect(FROZEN_SECTION_ANCHORS[2].expected).toBe(WORKFLOW_COUNT);
  });

  it("a registry row exists whose verbatim segments to exactly one clause", () => {
    expect(ANCHOR_CLAIM, "no single-clause registry anchor available to plant").toBeDefined();
  });

  it("a positive guard literal exists that segments to exactly one FROZEN clause", () => {
    expect(
      PLANTABLE_POSITIVE_LITERAL,
      "no single-clause positive guard literal available to plant",
    ).toBeDefined();
    const clause = segmentClauses(PLANTABLE_POSITIVE_LITERAL as string)[0].clause;
    expect(FROZEN_ON_REAL_TREE.text.get(clause)).toBe("positiveGuardLiterals");
  });

  it("both companion touches are visible to git and invisible to both derivations", () => {
    // THE PREMISE THE THREE-COMMIT CASES REST ON. Each touched companion must differ from the real
    // file (or the payload commit would be empty and the fixture would collapse to two commits),
    // and must leave the derivation that reads it byte-identical (or the case would red on a SHORT
    // derivation instead of on the companion rule).
    expect(REGISTRY_TOUCHED).not.toBe(readFileSync(join(REPO, REGISTRY_REL), "utf8"));
    expect(GUARDS_TOUCHED).not.toBe(readFileSync(join(REPO, GUARDS_REL), "utf8"));

    const probe = freshTmp("gops-diffdisp-premise-");
    const { write } = mirrorWriters(probe);
    write(REGISTRY_REL, REGISTRY_TOUCHED);
    write(GUARDS_REL, GUARDS_TOUCHED);

    const real = readRegistry(REPO).claims.map((c) => c.verbatim);
    const touched = readRegistry(probe).claims.map((c) => c.verbatim);
    expect(touched).toEqual(real);
    expect(touched.length).toBeGreaterThan(0);

    const realLits = derivePositiveGuardLiterals(REPO);
    const touchedLits = derivePositiveGuardLiterals(probe);
    expect(touchedLits.refusals).toEqual([]);
    expect(touchedLits.literals.map((l) => l.literal)).toEqual(
      realLits.literals.map((l) => l.literal),
    );
    expect(touchedLits.literals.length).toBe(POSITIVE_GUARD_LITERAL_COUNT);
  });

  it("locateSection ends a section at the next `## ` heading, not at the next `#`", () => {
    const body = ROLE_BODY("X");
    const span = locateSection(body, "## Hard limits");
    expect(span).not.toBeNull();
    const lines = body.split("\n");
    expect(lines[(span as { from: number }).from - 1]).toBe("## Hard limits");
    // The `## Notes` heading is the terminator, so it is NOT inside the frozen span.
    expect(lines[(span as { to: number }).to]).toBe("## Notes");
    expect(locateSection(body, "## Nothing here")).toBeNull();
  });

  it("touchedLines reads only `@@` headers, and a one-line hunk defaults to a count of 1", () => {
    const t = touchedLines("@@ -11 +11 @@\n-old\n+new\n@@ -20,0 +21,2 @@\n+a\n+b\n");
    // `-11` with no comma is a one-line range; `-20,0` is a range of ZERO lines, which is how git
    // spells a pure insertion. A count of 0 must contribute NOTHING to the removed side — reading
    // it as "line 20 changed" would attribute an untouched clause to the diff and demand a
    // disposition row for text nobody edited.
    expect(t.removed).toEqual([11]);
    expect(t.added).toEqual([11, 21, 22]);
    // A body line that merely begins with `@@ ` is not a header — it lacks the closing ` @@`.
    expect(touchedLines("@@ not a header\n").added).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE GREEN CONTROL. Without it every RED below proves nothing: a gate that always fails is
// trivially red.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-diff-disposition — the clean mirror", () => {
  it("exits 0 on a mirror whose watched corpus is unchanged since the recorded base", () => {
    const { root } = makeMirror("gops-diffdisp-clean-");
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    // The PASS line carries the measurement: all four D-01 derivations with their counts.
    expect(stdout).toContain(`roles \`## Hard limits\` ${ROLE_COUNT}/${ROLE_COUNT}`);
    expect(stdout).toContain(
      `workflows \`## Stop conditions\` ${WORKFLOW_COUNT}/${WORKFLOW_COUNT}`,
    );
    expect(stdout).toContain(
      `workflows \`## Commit\` ${WORKFLOW_COUNT}/${WORKFLOW_COUNT}`,
    );
    expect(stdout).toContain("registry verbatim anchors");
    expect(stdout).toContain("a clean tree, not a vacuous pass");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The planted mirrors.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-diff-disposition — the frozen set refuses", () => {
  it("REDs a reworded role `## Hard limits` sentence carrying no disposition row", () => {
    const { root } = makeMirror("gops-diffdisp-frozen-", {
      plant: { [ROLE_UNDER_TEST]: REWORDED_ROLE },
      // A disposition file EXISTS and carries an unrelated row, so this case is isolated to the
      // frozen refusal rather than mixing in the empty-directory refusal below.
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", "An unrelated clause nobody planted here.", "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(stdout).toContain("FROZEN by structuralSections");
    expect(stdout).toContain(ROLE_UNDER_TEST);
    expect(stdout).toContain("## Hard limits");
    // The finding names the clause and the owed companion edit, and says the hatch does not exist.
    expect(stdout).toContain(segmentClauses(REWORDED_HARD_LIMIT)[0].clause);
    expect(stdout).toContain("Owed companion edit");
    expect(stdout).toContain("no override tier");
    // file:line, so a reader can go straight to it.
    expect(stdout).toMatch(
      new RegExp(`${REAL_ROLES[0].replace(".", "\\.")}:\\d+ \\((added|removed)\\)`),
    );
  });

  it("GREENs the same change once a disposition row names the companion edit", () => {
    const { root } = makeMirror("gops-diffdisp-frozen-ok-", {
      plant: { [ROLE_UNDER_TEST]: REWORDED_ROLE },
      dispositions: {
        "29-05.md": dispositionFile([
          row(
            ROLE_UNDER_TEST,
            HARD_LIMIT_SENTENCE,
            REWORDED_HARD_LIMIT,
            "`## Hard limits` reworded under WP-03; the prohibition and its ADR condition are unchanged, re-read line by line.",
          ),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    // The fold ran over real elements — this is not the clean-tree arm.
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over`);
    expect(stdout).not.toContain("a clean tree, not a vacuous pass");
  });

  it("REDs a clause byte-equal to a registry verbatim anchor with the registry unchanged", () => {
    // EQUALITY IS A HIT, NOT A NEAR-MISS. The planted text is the registry's own verbatim, taken
    // from the registry rather than retyped, and it is planted OUTSIDE every frozen section so the
    // case proves the textual arm rather than the positional one.
    const verbatim = (ANCHOR_CLAIM as { verbatim: string }).verbatim;
    const { root } = makeMirror("gops-diffdisp-anchor-", {
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(verbatim) },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", verbatim, "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by registryAnchors");
    expect(stdout).toContain(REGISTRY_REL);
    expect(stdout).toContain(segmentClauses(verbatim)[0].clause);
  });

  it("does NOT treat a shared prefix as an intersection — an ordinary row is enough", () => {
    const frozenClause = segmentClauses(HARD_LIMIT_SENTENCE)[0].clause;
    const longer = HARD_LIMIT_SENTENCE.replace(
      /\.$/,
      " and record every command that was run.",
    );
    // The premise the case rests on: a shared prefix, and not equality.
    expect(normalizeSentence(longer).startsWith(frozenClause)).toBe(true);
    expect(normalizeSentence(longer)).not.toBe(frozenClause);

    const { root } = makeMirror("gops-diffdisp-prefix-", {
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(longer) },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", longer, "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).not.toContain("FROZEN by");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-05 — a companion cell is FILLED only in one canonical form.
//
// THE DEFECT THESE CASES REPRODUCE. The structural arm's satisfaction test was
// `r.companion !== "" && r.companion !== UNFILLED` — a membership decision made by excluding ONE bad
// value. A cell carrying a hyphen, an en dash, a question mark, `n/a`, `TBD`, `none` or `todo` is
// neither empty nor that one em dash, so it satisfied the companion requirement for a change inside
// a frozen `## Hard limits`, `## Stop conditions` or `## Commit` section. The structural arm carries
// the whole positional freeze — the arm that catches a REWORD, where the new text matches nothing
// frozen and only its POSITION does — so a placeholder there admits exactly the change this gate
// exists to refuse.
//
// THE SPELLINGS BELOW ARE ENUMERATED HERE AND NOWHERE ELSE, ON PURPOSE. They are the ADVERSARY, not
// the predicate. A denylist of placeholder tokens in the gate is the enumerate-the-bad shape three
// separate eight-round closures in this repository were spent deleting, and the thirteenth
// placeholder is the one nobody thinks of. The fix declares the canonical FILLED form and refuses
// its complement (D-64's move, D-43's polarity), so this table is a set of WITNESSES that the
// complement is refused — never the list the gate consults.
//
// RECORDED PRE-CHANGE BEHAVIOUR, so a later reader knows which of these were bypasses and which were
// already refused: against the committed build at plan 29-15, ELEVEN of the thirteen rows below
// PASSED the companion requirement (the gate exited 0 and printed ALL CHECKS PASSED). Only the empty
// cell and the em dash were refused, because those are the two values the deleted test excluded.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Every placeholder spelling a companion cell must be refused for. Each is a WITNESS that the
 * canonical form's complement is refused; none of them is named in the gate's source.
 *
 * `–` and `—` are written as escapes rather than as glyphs so a reader can see WHICH dash
 * each row is — the en dash and the em dash are indistinguishable in most review fonts, and one of
 * them was the single value the deleted predicate excluded.
 */
const PLACEHOLDER_COMPANION_CELLS: readonly { name: string; cell: string }[] = [
  { name: "empty", cell: "" },
  { name: "hyphen", cell: "-" },
  { name: "double hyphen", cell: "--" },
  { name: "en dash", cell: "–" },
  { name: "em dash", cell: "—" },
  { name: "question mark", cell: "?" },
  { name: "n/a", cell: "n/a" },
  { name: "N/A", cell: "N/A" },
  { name: "na", cell: "na" },
  { name: "tbd", cell: "tbd" },
  { name: "TBD", cell: "TBD" },
  { name: "none", cell: "none" },
  { name: "todo", cell: "todo" },
];

/** A companion cell that does the job the contract describes: it names the section and the reason. */
const REAL_COMPANION_PROSE =
  "`## Hard limits` keeps the ADR condition and the small-diff prohibition byte-unchanged in the same commit, and this row records that the reword moved the wording and not the permission.";

describe("check-diff-disposition — a companion cell is filled in ONE canonical form (WR-05)", () => {
  it.each(PLACEHOLDER_COMPANION_CELLS)(
    "refuses $name as a companion cell for a frozen structural reword",
    ({ name, cell }) => {
      const { root } = makeMirror(
        `gops-diffdisp-companion-${name.replace(/[^a-z0-9]+/gi, "")}-`,
        {
          plant: { [ROLE_UNDER_TEST]: REWORDED_ROLE },
          dispositions: {
            "29-05.md": dispositionFile([
              row(
                ROLE_UNDER_TEST,
                HARD_LIMIT_SENTENCE,
                REWORDED_HARD_LIMIT,
                cell,
              ),
            ]),
          },
        },
      );
      const { status, stdout } = runGate(root);
      // The banner is asserted BEFORE the exit code, so a failing row prints the gate's whole
      // passing transcript — that transcript IS the bypass evidence.
      expect(stdout).not.toContain("ALL CHECKS PASSED");
      expect(status).toBe(1);
      expect(stdout).toContain("FROZEN by structuralSections");
      expect(stdout).toContain("## Hard limits");
      expect(stdout).toContain("Owed companion edit");
    },
  );

  it("accepts a companion cell carrying real prose — the false-red control", () => {
    // Without this the table above proves nothing: a predicate that refuses everything is trivially
    // green on thirteen refusals and useless as a gate.
    const { root } = makeMirror("gops-diffdisp-companion-prose-", {
      plant: { [ROLE_UNDER_TEST]: REWORDED_ROLE },
      dispositions: {
        "29-05.md": dispositionFile([
          row(
            ROLE_UNDER_TEST,
            HARD_LIMIT_SENTENCE,
            REWORDED_HARD_LIMIT,
            REAL_COMPANION_PROSE,
          ),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    // The fold ran over real elements — this is not the clean-tree arm.
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over`);
    expect(stdout).not.toContain("a clean tree, not a vacuous pass");
  });

  // ── The boundary, asserted from BOTH sides ─────────────────────────────────────────────────
  //
  // A floor asserted only from the accepting side is satisfied by a predicate that accepts
  // everything, which is the predicate this section replaced. Both cells are GENERATED from the
  // exported constant rather than typed at a length, so the pair moves with the floor instead of
  // silently becoming two arbitrary strings the first time the floor changes.

  /** A cell of exactly `n` normalized words. Premise asserted at each call site. */
  const cellOfWords = (n: number): string =>
    Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

  it("accepts a companion cell of EXACTLY the minimum word count", () => {
    const cell = cellOfWords(COMPANION_MIN_WORDS);
    // The case's own premise: the generated cell really is at the floor, measured the way the
    // predicate measures it.
    expect(normalizeSentence(cell).split(" ").filter(Boolean).length).toBe(
      COMPANION_MIN_WORDS,
    );
    expect(isCompanionFilled(cell)).toBe(true);

    const { root } = makeMirror("gops-diffdisp-companion-atfloor-", {
      plant: { [ROLE_UNDER_TEST]: REWORDED_ROLE },
      dispositions: {
        "29-05.md": dispositionFile([
          row(ROLE_UNDER_TEST, HARD_LIMIT_SENTENCE, REWORDED_HARD_LIMIT, cell),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("refuses a companion cell ONE word shorter than the minimum", () => {
    const cell = cellOfWords(COMPANION_MIN_WORDS - 1);
    expect(normalizeSentence(cell).split(" ").filter(Boolean).length).toBe(
      COMPANION_MIN_WORDS - 1,
    );
    expect(isCompanionFilled(cell)).toBe(false);

    const { root } = makeMirror("gops-diffdisp-companion-belowfloor-", {
      plant: { [ROLE_UNDER_TEST]: REWORDED_ROLE },
      dispositions: {
        "29-05.md": dispositionFile([
          row(ROLE_UNDER_TEST, HARD_LIMIT_SENTENCE, REWORDED_HARD_LIMIT, cell),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by structuralSections");
    // The finding tells the author what the canonical form is, so the remedy is not a guess.
    expect(stdout).toContain(`${COMPANION_MIN_WORDS} normalized words`);
  });

  it("surrounding whitespace changes nothing — the form is measured, not matched", () => {
    // The markdown table reader trims every cell, so a padded placeholder and a bare one arrive
    // here identically. Asserted rather than assumed, because "with or without spaces" is the
    // clause the behaviour block promises and a trim is what makes it true.
    for (const { cell } of PLACEHOLDER_COMPANION_CELLS) {
      expect(isCompanionFilled(cell)).toBe(false);
      expect(isCompanionFilled(`  ${cell}  `)).toBe(false);
    }
    expect(isCompanionFilled(REAL_COMPANION_PROSE)).toBe(true);
    expect(isCompanionFilled(`   ${REAL_COMPANION_PROSE}   `)).toBe(true);
  });

  it("leaves the LIVE disposition register undisturbed — no cell sits in the middle band", () => {
    // THE FALSE-RED CONTROL WITH TEETH, over the real register rather than a fixture.
    //
    // A floor is only safe to adopt if the live register's cells are nowhere near it. Every
    // companion cell written by a human in this phase must fall clearly on one side: either it is
    // a PLACEHOLDER, which normalizes to at most one word, or it is PROSE that clears the floor.
    // A cell in between would mean this edit changed a human judgement that was already made, and
    // that is what re-auditing 230 structural intersections would cost.
    const { rows, refusals } = readDispositionRows(REPO);
    expect(refusals).toEqual([]);
    // Non-vacuity: an empty register would satisfy the partition below trivially.
    expect(rows.length).toBeGreaterThan(0);

    const middleBand: string[] = [];
    let placeholders = 0;
    let filled = 0;
    let smallestFilled = Number.POSITIVE_INFINITY;
    for (const r of rows) {
      const words = normalizeSentence(r.companion)
        .split(" ")
        .filter(Boolean).length;
      if (isCompanionFilled(r.companion)) {
        filled += 1;
        smallestFilled = Math.min(smallestFilled, words);
      } else if (words <= 1) {
        placeholders += 1;
      } else {
        middleBand.push(`${r.source}: ${JSON.stringify(r.companion)} (${words} words)`);
      }
    }
    // Named, never merely counted: a partition failure that names no member is unactionable.
    expect(middleBand).toEqual([]);
    // Both halves are non-empty, or the partition proves nothing about either side.
    expect(placeholders).toBeGreaterThan(0);
    expect(filled).toBeGreaterThan(0);
    // The MARGIN, derived on both sides rather than pinned as a literal: the smallest prose cell a
    // human actually wrote clears the floor with room, so no judgement sits on the boundary.
    expect(smallestFilled).toBeGreaterThan(COMPANION_MIN_WORDS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-06 — where a frozen section ENDS is decided by the one fence authority.
//
// THE DEFECT THESE CASES REPRODUCE. `locateSection` scanned for the next line beginning `## ` with
// no idea what a fence is, while `fencedLineFlags` — the tree's single fence toggle, already
// consumed by check-imperative-lexicon.ts for exactly this class of question — sat one import away.
// Kit documents quote markdown inside fenced examples, so a `## ` line inside a fence TRUNCATED the
// frozen region: everything below the quoted heading fell OUT of `## Stop conditions` while still
// sitting inside it, and a reword there needed no companion edit at all.
//
// THIS DIRECTION FAILS OPEN, WHICH IS WHY IT IS FIXED RATHER THAN RECORDED. A truncated frozen
// region SHRINKS what is protected, with no failure anywhere — the gate stays green and simply
// checks less. The sibling truncation in the banned-claim exemption locator causes MORE to be
// checked, which is fail-closed and shows up as a red somebody investigates. Naming the asymmetry is
// what stops a later reader treating the two as interchangeable.
//
// The live corpus carries ZERO fenced `## ` lines today (re-derived at execution, plan 29-16), so
// these cases are necessarily PLANTED. A corpus-derived proof would prove nothing.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The heading QUOTED inside the fenced example.
 *
 * DELIBERATELY NOT ONE OF THE THREE FROZEN ANCHORS, and the reason is a red this case first produced
 * for the WRONG REASON. Quoting `## Commit` made the fence-blind locator match the QUOTED heading as
 * the `## Commit` section itself and run that mislocated region from the fenced line down to the real
 * heading — which swallowed the sentence below the fence. The gate then exited 1 against the
 * PRE-CHANGE build, so the case looked like a reproduction while proving the opposite: the clause was
 * inside a region either way and the truncation was never exercised. A non-anchor heading leaves the
 * sentence inside NO region before the fix and inside `## Stop conditions` after it, which is the
 * difference the case is about. Quoting an anchor is covered separately, on its own terms, below.
 */
const QUOTED_HEADING = "## Example output";

const STOP_CLAUSE_BELOW_FENCE =
  "Stop when the acceptance scenario cannot be written down before the diff.";
const REWORDED_CLAUSE_BELOW_FENCE =
  "Halt when the acceptance scenario cannot be recorded before the diff.";

/**
 * The workflow under test with a fenced markdown example inside `## Stop conditions`, and one
 * sentence BELOW that example but still inside the section.
 *
 * Both frozen workflow headings survive, so the D-01 cardinality assertions stay at full strength
 * and these cases cannot pass for the unrelated reason that a derivation went short.
 */
const workflowWithFencedHeading = (
  below: string,
  quoted: string = QUOTED_HEADING,
): string =>
  [
    `# Workflow: ${REAL_WORKFLOWS[0]}`,
    "",
    "## Steps",
    "1. Read the shared verified context before doing anything else.",
    "",
    FROZEN_SECTION_ANCHORS[1].heading,
    "Stop when the scope grows beyond the ticket that is in hand.",
    "",
    "```markdown",
    quoted,
    "```",
    "",
    below,
    "",
    FROZEN_SECTION_ANCHORS[2].heading,
    "Commit the smallest diff that closes this one ticket.",
    "",
    "## Notes",
    "This section sits outside every frozen structural section in the corpus.",
    "",
  ].join("\n");

/** The 1-based line of a line matching exactly, derived from the body rather than counted by hand. */
const lineOf = (text: string, want: string): number => {
  const at = text.split("\n").indexOf(want);
  if (at === -1) throw new Error(`harness: ${JSON.stringify(want)} is not a line of the fixture`);
  return at + 1;
};

describe("check-diff-disposition — one fence authority bounds a frozen section (WR-06)", () => {
  it("a fenced `## ` line does not end the section — the region runs to the next UNFENCED heading", () => {
    const body = workflowWithFencedHeading(STOP_CLAUSE_BELOW_FENCE);
    const lines = body.split("\n");
    const fencedHeadingLine = lineOf(body, QUOTED_HEADING);
    const belowLine = lineOf(body, STOP_CLAUSE_BELOW_FENCE);
    const nextRealHeadingLine = lineOf(body, FROZEN_SECTION_ANCHORS[2].heading);

    // The fixture's own premise: the quoted heading really is inside a fence, the next real heading
    // is not, and the quoted spelling occurs exactly once. Asserted through the same authority the
    // gate must consult, so the case cannot rest on a fence the toggle does not see.
    const flags = fencedLineFlags(body);
    expect(flags[fencedHeadingLine - 1]).toBe(true);
    expect(lines.filter((l) => l === QUOTED_HEADING).length).toBe(1);
    expect(flags[nextRealHeadingLine - 1]).toBe(false);

    const span = locateSection(body, FROZEN_SECTION_ANCHORS[1].heading);
    expect(span).not.toBeNull();
    const { from, to } = span as { from: number; to: number };
    expect(lines[from - 1]).toBe(FROZEN_SECTION_ANCHORS[1].heading);
    // The extent, asserted as a NUMBER: it runs past the fenced heading, not up to it.
    expect(to).toBeGreaterThan(fencedHeadingLine);
    // And the sentence below the fence is inside it.
    expect(belowLine).toBeGreaterThan(fencedHeadingLine);
    expect(belowLine).toBeLessThanOrEqual(to);
    // The terminator is the next UNFENCED heading, one line past the end of the region.
    expect(to).toBe(nextRealHeadingLine - 1);
  });

  it("a FROZEN ANCHOR quoted inside a fence is not matched as the section's own heading", () => {
    // The other half of the same defect. Here the quoted heading IS `## Commit`, so a fence-blind
    // locator matches the QUOTED line and reports a `## Commit` region that starts inside a code
    // example — a region whose every clause is documentation rather than governed prose.
    const anchor = FROZEN_SECTION_ANCHORS[2].heading;
    const body = workflowWithFencedHeading(STOP_CLAUSE_BELOW_FENCE, anchor);
    const lines = body.split("\n");
    expect(lines.filter((l) => l === anchor).length).toBe(2);
    const quotedLine = lines.indexOf(anchor) + 1;
    const realLine = lines.lastIndexOf(anchor) + 1;
    const flags = fencedLineFlags(body);
    expect(flags[quotedLine - 1]).toBe(true);
    expect(flags[realLine - 1]).toBe(false);

    const span = locateSection(body, anchor);
    expect(span).not.toBeNull();
    // The located heading is the REAL one, not the earlier quoted occurrence.
    expect((span as { from: number }).from).toBe(realLine);
  });

  it("REDs a reword below a fenced heading, still inside the frozen region, with no filled companion", () => {
    // The starting corpus already carries the fenced structure, so the plant is a ONE-LINE REWORD
    // and both sides of the diff are exercised — see MirrorSpec.baseCorpus for why that matters.
    //
    // THE PREMISE THAT MAKES THIS A REPRODUCTION RATHER THAN A COINCIDENCE: the reworded sentence
    // sits between the fenced heading and the next real heading, so `## Stop conditions` is the ONLY
    // frozen region it can belong to. Without this, a red proves nothing about the truncation — the
    // first version of this case quoted `## Commit` and went red against the PRE-CHANGE build,
    // because the mislocated `## Commit` region swallowed the sentence instead.
    const baseBody = workflowWithFencedHeading(STOP_CLAUSE_BELOW_FENCE);
    expect(lineOf(baseBody, STOP_CLAUSE_BELOW_FENCE)).toBeGreaterThan(
      lineOf(baseBody, QUOTED_HEADING),
    );
    expect(lineOf(baseBody, STOP_CLAUSE_BELOW_FENCE)).toBeLessThan(
      lineOf(baseBody, FROZEN_SECTION_ANCHORS[2].heading),
    );
    expect(baseBody.split("\n").filter((l) => l === QUOTED_HEADING).length).toBe(1);

    const { root } = makeMirror("gops-diffdisp-fence-frozen-", {
      baseCorpus: {
        [WORKFLOW_UNDER_TEST]: workflowWithFencedHeading(STOP_CLAUSE_BELOW_FENCE),
      },
      plant: {
        [WORKFLOW_UNDER_TEST]: workflowWithFencedHeading(REWORDED_CLAUSE_BELOW_FENCE),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(
            WORKFLOW_UNDER_TEST,
            STOP_CLAUSE_BELOW_FENCE,
            REWORDED_CLAUSE_BELOW_FENCE,
            "—",
          ),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    // The banner first: a failing run must print the transcript that IS the bypass evidence.
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by structuralSections");
    expect(stdout).toContain(FROZEN_SECTION_ANCHORS[1].heading);
    expect(stdout).toContain(segmentClauses(REWORDED_CLAUSE_BELOW_FENCE)[0].clause);
  });

  it("GREENs the same reword once the row carries a filled companion — the false-red control", () => {
    const { root } = makeMirror("gops-diffdisp-fence-frozen-ok-", {
      baseCorpus: {
        [WORKFLOW_UNDER_TEST]: workflowWithFencedHeading(STOP_CLAUSE_BELOW_FENCE),
      },
      plant: {
        [WORKFLOW_UNDER_TEST]: workflowWithFencedHeading(REWORDED_CLAUSE_BELOW_FENCE),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(
            WORKFLOW_UNDER_TEST,
            STOP_CLAUSE_BELOW_FENCE,
            REWORDED_CLAUSE_BELOW_FENCE,
            REAL_COMPANION_PROSE,
          ),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over`);
  });

  it("every frozen region on the LIVE corpus ends at an UNFENCED heading or at EOF", () => {
    // THE INVARIANT, not a pinned count. Asserting "the corpus carries zero fenced headings today"
    // would go red the first time somebody legitimately quotes a heading — which is the case this
    // edit exists to handle correctly, not to forbid. The property below holds either way.
    const corpus = [
      ...listRoles(REPO).map((b) => ({
        rel: `${ROLES_SUBPATH}/${b}`,
        headings: [FROZEN_SECTION_ANCHORS[0].heading],
      })),
      ...listWorkflows(REPO).map((b) => ({
        rel: `${WORKFLOWS_SUBPATH}/${b}`,
        headings: [
          FROZEN_SECTION_ANCHORS[1].heading,
          FROZEN_SECTION_ANCHORS[2].heading,
        ],
      })),
    ];
    let located = 0;
    for (const { rel, headings } of corpus) {
      const text = readFileSync(join(REPO, rel), "utf8");
      const lines = text.split("\n");
      const flags = fencedLineFlags(text);
      for (const heading of headings) {
        const span = locateSection(text, heading);
        if (span === null) continue;
        located += 1;
        // The section's own heading line is never inside a fence.
        expect(flags[span.from - 1]).toBe(false);
        // The terminator is either EOF or an UNFENCED `## ` line.
        if (span.to < lines.length) {
          expect(lines[span.to].startsWith("## ")).toBe(true);
          expect(flags[span.to]).toBe(false);
        }
        // No `## ` line INSIDE the region is unfenced — that is what "ends at the next one" means.
        for (let i = span.from; i < span.to; i++) {
          if (lines[i].startsWith("## ")) expect(flags[i]).toBe(true);
        }
      }
    }
    // Non-vacuity: a corpus that located nothing would satisfy every assertion above.
    expect(located).toBe(ROLE_COUNT + 2 * WORKFLOW_COUNT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// CR-02 — the companion edit is judged PER CARRIER, not over the whole range.
//
// The contract strings in FROZEN_SOURCES have always said "must change in the SAME commit". The
// implementation asked whether the companion appeared anywhere in `git diff --name-only <base>`,
// which is a different question: once ANY commit in the range touched the companion, EVERY frozen
// clause from that source was permanently satisfied for the rest of the phase.
//
// No fixture could catch it, because makeMirror built exactly two commits and in a two-commit
// mirror the two questions have the same answer. The cases below are the first in this file to
// span THREE, and each is paired with a same-commit control so a fix that simply reds everything
// is not mistaken for a fix.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-diff-disposition — the companion edit is per carrier (CR-02)", () => {
  it("a companion touched in an earlier commit does not satisfy a later frozen reword", () => {
    // Three commits: [base corpus] → [registry alone] → [the anchored sentence + its row].
    // The registry is in the RANGE but not in the commit that changed the frozen clause.
    const { root, commits } = makeMirror("gops-diffdisp-carrier-registry-", {
      commits: [{ [REGISTRY_REL]: REGISTRY_TOUCHED }],
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(ANCHOR_VERBATIM) },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", ANCHOR_VERBATIM, "—"),
        ]),
      },
    });
    // The case's own premise: three commits, and the companion is NOT in the plant commit.
    expect(commits.length).toBe(2);
    expect(filesInCommit(root, commits[0])).toContain(REGISTRY_REL);
    expect(filesInCommit(root, commits[1])).not.toContain(REGISTRY_REL);
    expect(filesInCommit(root, commits[1])).toContain(WORKFLOW_UNDER_TEST);

    const { status, stdout } = runGate(root);
    // The banner is asserted BEFORE the exit code on purpose: when this case fails it must print the
    // gate's whole passing transcript, because that transcript IS the bypass evidence.
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by registryAnchors");
    expect(stdout).toContain(WORKFLOW_UNDER_TEST);
    expect(stdout).toContain(segmentClauses(ANCHOR_VERBATIM)[0].clause);
    expect(stdout).toContain("Owed companion edit");
  });

  it("a companion touched in the same commit as the reword satisfies it", () => {
    // The FALSE-RED CONTROL for the registry arm. Two commits, both edits together. This was green
    // before CR-02 was closed and must stay green after, or the "fix" is just a blanket refusal.
    const { root, commits } = makeMirror("gops-diffdisp-carrier-registry-ok-", {
      plant: {
        [REGISTRY_REL]: REGISTRY_TOUCHED,
        [WORKFLOW_UNDER_TEST]: workflowWithNote(ANCHOR_VERBATIM),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", ANCHOR_VERBATIM, "—"),
        ]),
      },
    });
    expect(commits.length).toBe(1);
    const touched = filesInCommit(root, commits[0]);
    expect(touched).toContain(REGISTRY_REL);
    expect(touched).toContain(WORKFLOW_UNDER_TEST);

    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    // Non-vacuity: the fold ran over real elements, so this is not the clean-tree arm.
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over`);
    expect(stdout).not.toContain("a clean tree, not a vacuous pass");
  });

  it("a guard source touched in an earlier commit does not satisfy a later frozen reword", () => {
    // The SECOND ARM, identical in shape and safe on the live tree today only because
    // scripts/check-foundation-guards.ts happens not to have changed in the real range. Splitting a
    // root cause by which arm a finding was reported against is the incrementalism this project has
    // already paid for three times, so it closes in the same edit and is pinned here.
    const { root, commits } = makeMirror("gops-diffdisp-carrier-guards-", {
      commits: [{ [GUARDS_REL]: GUARDS_TOUCHED }],
      plant: {
        [WORKFLOW_UNDER_TEST]: workflowWithNote(PLANTABLE_POSITIVE_LITERAL as string),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", PLANTABLE_POSITIVE_LITERAL as string, "—"),
        ]),
      },
    });
    expect(commits.length).toBe(2);
    expect(filesInCommit(root, commits[0])).toContain(GUARDS_REL);
    expect(filesInCommit(root, commits[1])).not.toContain(GUARDS_REL);

    const { status, stdout } = runGate(root);
    // Banner before exit code — see the registry-arm case above.
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by positiveGuardLiterals");
    expect(stdout).toContain(
      segmentClauses(PLANTABLE_POSITIVE_LITERAL as string)[0].clause,
    );
    expect(stdout).toContain(GUARDS_REL);
  });

  it("a guard source touched in the same commit as the reword satisfies it", () => {
    // The FALSE-RED CONTROL for the positive-literal arm.
    const { root, commits } = makeMirror("gops-diffdisp-carrier-guards-ok-", {
      plant: {
        [GUARDS_REL]: GUARDS_TOUCHED,
        [WORKFLOW_UNDER_TEST]: workflowWithNote(PLANTABLE_POSITIVE_LITERAL as string),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", PLANTABLE_POSITIVE_LITERAL as string, "—"),
        ]),
      },
    });
    expect(commits.length).toBe(1);
    expect(filesInCommit(root, commits[0])).toContain(GUARDS_REL);

    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over`);
  });

  it("an unattributable frozen clause is reported rather than satisfied", () => {
    // FAIL-CLOSED. The recorded base is not an ancestor of HEAD, so the frozen clause sits on the
    // removed side of the RANGE diff while no commit in `base..HEAD` ever touched the file that
    // carried it. An attribution the gate cannot make is a refusal, not a pass — and the finding
    // has to say WHICH of the two it is, or a reader cannot tell a missing companion edit from a
    // missing carrier.
    // The one carrier in the range DOES touch a watched file (an ordinary, dispositioned change in
    // a role's `## Notes`), so the attribution map is non-empty and the empty-map refusal below is
    // not what produces this red. This case is isolated to the per-clause "no carrier" verdict.
    const ORDINARY = "Every reviewer reads the acceptance scenario before the diff.";
    const { root, base } = makeDivergentMirror("gops-diffdisp-nocarrier-", {
      frozenPlant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(ANCHOR_VERBATIM) },
      postPlant: {
        [ROLE_UNDER_TEST]: ROLE_BODY(REAL_ROLES[0]).replace(
          "This section sits outside every frozen structural section in the corpus.",
          `This section sits outside every frozen structural section in the corpus.\n${ORDINARY}`,
        ),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, ANCHOR_VERBATIM, "—", "—"),
          row(ROLE_UNDER_TEST, "—", ORDINARY, "—"),
        ]),
      },
    });
    // The case's own premise: the base really is unreachable from HEAD, and the one carrier in the
    // range really did not touch the file the frozen clause lives in.
    const carriers = gitIn(root, ["rev-list", `${base}..HEAD`])
      .split("\n")
      .filter((s) => s.length > 0);
    expect(carriers.length).toBe(1);
    expect(filesInCommit(root, carriers[0])).not.toContain(WORKFLOW_UNDER_TEST);
    expect(
      gitIn(root, ["diff", "--name-only", base, "--", WORKFLOW_UNDER_TEST]).trim(),
    ).toBe(WORKFLOW_UNDER_TEST);

    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by registryAnchors");
    expect(stdout).toContain("NO CARRIER FOUND");
    expect(stdout).toContain("no carrier");
    expect(stdout).toContain(segmentClauses(ANCHOR_VERBATIM)[0].clause);
    // The non-vacuity floor is NOT what produced this red — the map has entries.
    expect(stdout).not.toContain("carrier attribution map is EMPTY");
  });

  it("REDs an EMPTY attribution map by name, above the per-clause loop", () => {
    // The same divergent history with NO watched file touched on the divergent side: every changed
    // clause in the range is unattributable, so the map is empty. That is a derivation which did
    // not run, and it is reported ONCE by name rather than as N identical per-clause findings.
    const { root } = makeDivergentMirror("gops-diffdisp-emptymap-", {
      frozenPlant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(ANCHOR_VERBATIM) },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, ANCHOR_VERBATIM, "—", "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("carrier attribution map is EMPTY");
    expect(stdout).toContain("a derivation that did not run");
    // Reported ABOVE the loop: the per-clause findings never ran, so no FROZEN finding is emitted.
    expect(stdout).not.toContain("FROZEN by");
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("names the carrier count and whether the working tree is one of them", () => {
    const { root } = makeMirror("gops-diffdisp-carriercount-", {
      commits: [{ [REGISTRY_REL]: REGISTRY_TOUCHED }],
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(ANCHOR_VERBATIM) },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", ANCHOR_VERBATIM, "—"),
        ]),
      },
    });
    const { stdout } = runGate(root);
    // Two carriers, both committed, so the working tree is not one of them.
    expect(stdout).toContain("carriers: 2 change set(s)");
    expect(stdout).toContain("the uncommitted working tree is NOT a carrier");
  });

  it("counts the uncommitted working tree as a NAMED carrier", () => {
    // The same three-commit shape, except the companion touch is left UNCOMMITTED. The working tree
    // is then the carrier that changed the frozen clause AND the one that touched the companion, so
    // the rule is satisfied in that one change set — an uncommitted edit is a named carrier, never
    // an unattributed pass.
    const { root } = makeMirror("gops-diffdisp-worktree-carrier-", {
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", ANCHOR_VERBATIM, "—"),
        ]),
      },
    });
    const { write } = mirrorWriters(root);
    write(WORKFLOW_UNDER_TEST, workflowWithNote(ANCHOR_VERBATIM));
    write(REGISTRY_REL, REGISTRY_TOUCHED);

    const { status, stdout } = runGate(root);
    expect(stdout).toContain("the uncommitted working tree IS a carrier");
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(status).toBe(0);
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over`);
  });

  it("REDs an uncommitted frozen reword whose companion was touched in an earlier COMMIT", () => {
    // The working-tree carrier gets the SAME rule, not a softer one: the companion sitting in an
    // earlier commit does not satisfy a clause the working tree changed.
    const { root } = makeMirror("gops-diffdisp-worktree-red-", {
      commits: [{ [REGISTRY_REL]: REGISTRY_TOUCHED }],
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", ANCHOR_VERBATIM, "—"),
        ]),
      },
    });
    const { write } = mirrorWriters(root);
    write(WORKFLOW_UNDER_TEST, workflowWithNote(ANCHOR_VERBATIM));

    const { status, stdout } = runGate(root);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    expect(stdout).toContain("the uncommitted working tree IS a carrier");
    expect(stdout).toContain("FROZEN by registryAnchors");
    expect(stdout).toContain(WORKING_TREE_CARRIER);
    expect(stdout).not.toContain("NO CARRIER FOUND");
  });
});

describe("check-diff-disposition — the disposition requirement", () => {
  it("REDs a non-frozen changed clause that carries no row, naming the clause", () => {
    const planted = "Every reviewer reads the acceptance scenario before the diff.";
    const { root } = makeMirror("gops-diffdisp-undisp-", {
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(planted) },
      // A disposition file exists with a row for something else, so the directory is non-empty and
      // the case is isolated to the missing row.
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", "A clause that was never planted anywhere.", "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("no disposition row");
    expect(stdout).toContain(segmentClauses(planted)[0].clause);
    expect(stdout).toContain(WORKFLOW_UNDER_TEST);
  });

  it("REDs a non-empty diff over an EMPTY disposition directory, naming the directory", () => {
    const planted = "Every reviewer reads the acceptance scenario before the diff.";
    const { root } = makeMirror("gops-diffdisp-emptydir-", {
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(planted) },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain(`${DISPOSITION_DIR}/ derives ZERO disposition file(s)`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-02 — the published denominator is derived by a code path the loop does not own.
//
// THE DEFECT THESE CASES REPRODUCE. `visited` was incremented once per element of `changed.clauses`
// and `expected` was `changed.clauses.length` — the length of the very array the loop walks. The two
// sides read the same object, so vacuity.ts's short-scan-set branch could not fire under any input.
// A vacuity floor catches an EMPTY denominator and never a SILENTLY SHORT one.
//
// The element is now the changed watched FILE: `expected` from the per-file diff's emptiness test,
// `visited` from the clause derivation. A file that changed and yielded nothing moves them apart.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The role under test with `text` appended inside `## Notes` — outside every frozen section. */
const roleWithNote = (text: string): string =>
  ROLE_BODY(REAL_ROLES[0]).replace(
    "This section sits outside every frozen structural section in the corpus.",
    `This section sits outside every frozen structural section in the corpus.\n${text}`,
  );

/** A sentence long enough to be a clause, so the file that carries it is clause-bearing. */
const CLAUSE_BEARING_NOTE =
  "Every reviewer reads the acceptance scenario before the diff.";
/** Two words — below CLAUSE_MIN_WORDS, so the file that carries it changes and yields nothing. */
const CLAUSELESS_NOTE = "ok fine";

describe("check-diff-disposition — the denominator can fail and names its members (WR-02)", () => {
  it("REDs a changed watched file that yielded NO clause, naming the file", () => {
    const { root } = makeMirror("gops-diffdisp-shortdenominator-", {
      plant: {
        // Changes and yields a clause — so the total-zero-clause refusal above does NOT fire and
        // this case is isolated to the per-file denominator.
        [WORKFLOW_UNDER_TEST]: workflowWithNote(CLAUSE_BEARING_NOTE),
        // Changes and yields NOTHING. Invisible under the old tautological denominator.
        [ROLE_UNDER_TEST]: roleWithNote(CLAUSELESS_NOTE),
      },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", CLAUSE_BEARING_NOTE, "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    // NAMED, not merely counted: the offending file appears by path.
    expect(stdout).toContain("changed-file set and the clause-bearing-file set are not equal");
    expect(stdout).toContain("yielded NO clause");
    expect(stdout).toContain(ROLE_UNDER_TEST);
    // And the measurement itself is short, at the FILE grain.
    expect(stdout).toContain(`${MEASURED_LABEL}: visited 1 of 2 elements`);
    // The premise that keeps this from being the total-zero-clause refusal in disguise.
    expect(stdout).not.toContain("ZERO changed clause(s) were derived");
    // The detail line still reports the clause and disposition-row counts, unchanged.
    expect(stdout).toContain("2 watched file(s) changed since");
    expect(stdout).toContain("1 changed clause(s) derived");
  });

  it("the unmodified control passes with a FILE-grain element count", () => {
    // Without this the case above proves nothing: a denominator that always fails is not a check.
    // The only difference is the clauseless plant, so the pair isolates exactly one variable.
    const { root } = makeMirror("gops-diffdisp-shortdenominator-ok-", {
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote(CLAUSE_BEARING_NOTE) },
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", CLAUSE_BEARING_NOTE, "—"),
        ]),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    // ONE file, ONE clause — so the element grain is only legible because the label says so.
    expect(stdout).toContain(`${MEASURED_LABEL}: 0 findings over 1/1 elements`);
    expect(stdout).toContain("1 watched file(s) changed since");
    expect(stdout).not.toContain("are not equal");
  });

  it("the denominator's two sides are derived by DIFFERENT paths, not from one object", () => {
    // The property the fix is about, asserted directly rather than only through its symptom. If the
    // two sides came from one array they could never disagree, which is what made the old floor
    // documentation of intent instead of a check.
    const src = readFileSync(
      join(REPO, "scripts", "check-diff-disposition.ts"),
      "utf8",
    );
    const executable = src
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");
    expect(executable).not.toContain("expected: changed.clauses.length");
    expect(executable).toContain("expected: changed.changedFiles.length");
    expect(executable).toContain("visited: clauseBearingFiles.size");
  });
});

describe("check-diff-disposition — the refusals that keep a green honest", () => {
  it("REDs a changed watched file that derives ZERO clauses — a check that was not performed", () => {
    // Two words is below voice-model's CLAUSE_MIN_WORDS, so the change is real and the clause
    // derivation is empty. That is the shape a clean tree and a broken derivation share, and the
    // gate must tell them apart.
    const { root } = makeMirror("gops-diffdisp-zeroclause-", {
      plant: { [WORKFLOW_UNDER_TEST]: workflowWithNote("ok fine") },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("ZERO changed clause(s) were derived");
    expect(stdout).toContain("a check that was NOT performed");
    expect(stdout).toContain(WORKFLOW_UNDER_TEST);
  });

  it("REDs an unresolvable base commit with the git command and the root, and no stack trace", () => {
    const root = makeMirror("gops-diffdisp-badbase-", {
      baseOverride: "0".repeat(39) + "1",
    }).root;
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("git rev-parse --verify --quiet");
    expect(stdout).toContain(root);
    expect(stdout).toContain("fetch-depth: 0");
    // A stack trace is not a verdict: no `    at file:line:col` frame reaches the output.
    expect(stdout).not.toMatch(/^\s+at .+:\d+:\d+/m);
  });

  it("REDs a base_commit outside the canonical 40-character form", () => {
    const root = makeMirror("gops-diffdisp-badform-", {
      baseOverride: "HEAD~1",
    }).root;
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("canonical form");
    expect(stdout).toContain("40-character");
  });

  it("REDs a SHORT D-01 derivation, naming the derivation and BOTH counts", () => {
    // One role's `## Hard limits` heading is renamed, so the derivation locates 16 of 17. A short
    // derivation shrinks the frozen set silently, which is why it is a refusal and not a warning.
    const { root } = makeMirror("gops-diffdisp-short-", {
      plant: {
        [ROLE_UNDER_TEST]: ROLE_BODY(REAL_ROLES[0]).replace(
          "## Hard limits",
          "## Boundaries",
        ),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain(
      `roles \`## Hard limits\` resolved ${ROLE_COUNT - 1} of ${ROLE_COUNT}`,
    );
    expect(stdout).toContain("SHRINKS the frozen set");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// CR-01 — the watched corpus was the ONE set this gate did not pin, and one table cell moved it.
//
// The round-2 review reproduced this end to end against the committed .js on the live tree: reword
// a frozen `## Hard limits` sentence (one gate reds), then flip ONE `safety_surface` cell in
// `docs/audit/28-disposition-register.md` from `yes` to `no` and regenerate — and all four gates
// exit 0 together. The register lives under `docs/` and is therefore NOT a member of the corpus it
// derives, so the edit that performs the narrowing owes no disposition row and nothing downstream
// can see it.
//
// Every case here asserts its own PREMISE before invoking the gate. This project has recorded six
// instances across four straight rounds of a verification harness producing a FALSE result, one of
// them in the immediately preceding plan; a fixture that silently stopped reproducing the defect
// would otherwise pass for the wrong reason and be indistinguishable from a fix.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The register exactly as committed — the CONTROL side of every comparison below. */
const REGISTER_AS_COMMITTED = readFileSync(join(REPO, REGISTER_REL), "utf8");

/** The derived kit file whose `safety_surface` cell the CR-01 cases flip. Derived, never typed. */
const FLIP_TARGET = ROLE_UNDER_TEST;

/**
 * The committed register with EXACTLY ONE counted row's `safety_surface` cell flipped `yes` → `no`.
 *
 * The edit is positional and surgical: the row is split on `|`, cell 4 (`safety_surface`) is
 * rewritten, and every other byte on the line — including its spacing — is preserved, so the
 * resulting file differs from the committed one in three characters. Anything less surgical would
 * risk a mirror that reds for an incidental reason rather than for CR-01's.
 *
 * It THROWS unless exactly one row matched. A helper that silently flipped zero cells would hand
 * every case below an unflipped fixture and turn the whole block green against the defect it exists
 * to catch.
 */
function registerWithFlippedSafetyFlag(target: string): string {
  let flipped = 0;
  const out = REGISTER_AS_COMMITTED.split("\n").map((line) => {
    // `| file | kind | counted | safety_surface | findings | observation |` splits to 8 pieces,
    // the first and last empty. Table B's rows split the same way but carry a finding id in the
    // file position, so they can never match a kit path.
    const parts = line.split("|");
    if (parts.length < 8) return line;
    if (parts[1].trim() !== target) return line;
    if (parts[3].trim() !== "yes") return line; // `counted`
    if (parts[4].trim() !== "yes") return line; // `safety_surface`
    flipped += 1;
    parts[4] = parts[4].replace("yes", "no");
    return parts.join("|");
  });
  if (flipped !== 1) {
    throw new Error(
      `harness premise: expected exactly ONE counted row for ${target} carrying ` +
        `\`safety_surface: yes\` in ${REGISTER_REL}, but flipped ${flipped}. The fixture this ` +
        `block rests on did not land, so no case below would be measuring what it claims`,
    );
  }
  return out.join("\n");
}

const mdOf = (root: string): string[] =>
  safetySurfaceUnion(root)
    .map((e) => e.file)
    .filter((f) => f.endsWith(".md"))
    .sort();

const derivedKitOf = (root: string): string[] =>
  [
    ...listRoles(root).map((f) => `${ROLES_SUBPATH}/${f}`),
    ...listWorkflows(root).map((f) => `${WORKFLOWS_SUBPATH}/${f}`),
  ].sort();

describe("check-diff-disposition — CR-01: the watched corpus is pinned to the derived kit", () => {
  it("the CONTROL — the identical mirror with NO cell flipped exits 0", () => {
    // Without this the RED below cannot distinguish "the flip was caught" from "a mirror carrying
    // an explicit baseCorpus register always reds".
    const { root } = makeMirror("gops-diffdisp-cr01-control-", {
      baseCorpus: { [REGISTER_REL]: REGISTER_AS_COMMITTED },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("REDs a register whose ONE flipped `safety_surface` cell drops a role from the watched corpus", () => {
    const control = makeMirror("gops-diffdisp-cr01-base-", {
      baseCorpus: { [REGISTER_REL]: REGISTER_AS_COMMITTED },
    });
    const flipped = makeMirror("gops-diffdisp-cr01-flip-", {
      baseCorpus: { [REGISTER_REL]: registerWithFlippedSafetyFlag(FLIP_TARGET) },
    });

    // ── PREMISE 1 — the mirror really carries the flipped cell, read back through the ONE parse
    //    authority rather than through the string edit that produced it, and EXACTLY one cell moved.
    const controlRows = readRegister(control.root).rows;
    const flippedRows = readRegister(flipped.root).rows;
    expect(flippedRows.map((r) => r.file)).toEqual(controlRows.map((r) => r.file));
    const moved = flippedRows.filter(
      (r, i) => r.safetySurface !== controlRows[i].safetySurface,
    );
    expect(moved.map((r) => r.file)).toEqual([FLIP_TARGET]);
    expect(moved[0].safetySurface).toBe("no");
    expect(moved[0].counted).toBe(true);

    // ── PREMISE 2 — the union really is ONE markdown entry shorter, and short by that member.
    const controlWatched = mdOf(control.root);
    const flippedWatched = mdOf(flipped.root);
    expect(controlWatched).toContain(FLIP_TARGET);
    expect(flippedWatched).not.toContain(FLIP_TARGET);
    expect(flippedWatched.length).toBe(controlWatched.length - 1);

    // ── PREMISE 3 — the flipped file is a DERIVED KIT file, which is the set this gate may never
    //    stop watching. A flip on a public document would be a different question entirely.
    expect(derivedKitOf(flipped.root)).toContain(FLIP_TARGET);

    // ── PREMISE 4 — the register is OTHERWISE COMPLETE: its counted row set is still exactly what
    //    the listers derive, so equality one at the sibling gate is satisfied by this fixture. This
    //    is what makes the case a statement about THIS gate rather than about the sibling: the
    //    consumer must red without depending on check-audit-register having run.
    expect(
      flippedRows
        .filter((r) => r.counted)
        .map((r) => r.file)
        .sort(),
    ).toEqual(derivedKitOf(flipped.root));

    const { status, stdout } = runGate(flipped.root);
    expect(status).toBe(1);
    // The refusal names the MEMBER, not only a number — a mismatch that names no member is a number
    // a reader cannot act on.
    expect(stdout).toContain(FLIP_TARGET);
    // ... and the mechanism, so the person who meets the red learns why a pin was needed here.
    expect(stdout).toContain("owes no disposition row");
    expect(stdout).toContain(String(ROLE_COUNT + WORKFLOW_COUNT));
  });

  it("the derived kit's own cardinality is pinned two-sided, independently of the corpus", () => {
    // The containment expectation is a DERIVED set, so it must also be COUNTED — otherwise a
    // narrowing of the listers moves the expectation and the thing it checks at once, which is
    // documentation of intent rather than a check. A role file removed from disk together with its
    // register row leaves containment satisfied and this pin is the only thing that speaks.
    const { root } = makeMirror("gops-diffdisp-cr01-kitcount-");
    rmSync(join(root, FLIP_TARGET));
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("derived kit resolved");
    expect(stdout).toContain(String(ROLE_COUNT + WORKFLOW_COUNT - 1));
  });

  it("the reviewer's end-to-end reproduction: ONE flipped cell reds BOTH gates, hermetically", () => {
    // THE WHOLE POINT IS "BOTH". The review's live reproduction ended with FOUR gates exiting 0
    // together, so a case that watched one gate red would be consistent with the other three still
    // waving the narrowing through. The two gates run as separate processes over one mirror: the
    // consumer does not depend on the source-side gate having run, and the source-side gate does
    // not depend on the consumer.
    const { root } = makeMirror("gops-diffdisp-cr01-bothgates-", {
      baseCorpus: { [REGISTER_REL]: registerWithFlippedSafetyFlag(FLIP_TARGET) },
    });
    // Step 2 of the reproduction, verbatim: regenerate the derived exclusion list FROM the flipped
    // register, so the attack leaves no stale artifact behind for a freshness guard to notice.
    writeFileSync(join(root, SAFETY_SURFACE_PATH), renderSafetySurface(root), "utf8");

    // PREMISE — the regenerated list really is the narrowed one, and it really is fresh. Without
    // this the audit gate could red on staleness and the case would prove the wrong arm.
    expect(readFileSync(join(root, SAFETY_SURFACE_PATH), "utf8")).toBe(
      renderSafetySurface(root),
    );
    expect(readFileSync(join(root, SAFETY_SURFACE_PATH), "utf8")).not.toContain(
      `\`${FLIP_TARGET}\``,
    );

    const consumer = runGate(root);
    const source = spawnSync(
      process.execPath,
      [join(REPO, "scripts", "check-audit-register.js")],
      { encoding: "utf8", env: { ...process.env, CHECK_ROOT: root } },
    );
    const sourceOut = `${source.stdout ?? ""}${source.stderr ?? ""}`;

    expect(consumer.status, "guard_diff_disposition must red").toBe(1);
    expect(consumer.stdout).toContain(FLIP_TARGET);
    expect(source.status, "check_audit_register must red").toBe(1);
    expect(sourceOut).toContain(FLIP_TARGET);
    expect(sourceOut).toMatch(/derived but NOT flagged/);
  });

  it("the VACUITY floor is kept beside the new pin — they answer different questions", () => {
    // A vacuity floor catches an EMPTY denominator and never a SILENTLY SHORT one. Conflating the
    // two is precisely how CR-01 survived, so the zero check stays and is exercised on its own: a
    // register in which NO row is a safety surface and a registry with no `kind: safety` row makes
    // the union empty, and generate-safety-surface refuses it before this gate ever counts.
    const { root } = makeMirror("gops-diffdisp-cr01-vacuous-", {
      baseCorpus: {
        [REGISTER_REL]: REGISTER_AS_COMMITTED.replace(/\| yes \| (\d+) \|/g, "| no | $1 |"),
        // `architecture` is a MEMBER of CLAIM_KINDS, so the registry still parses — the union goes
        // empty because no claim is a safety claim, not because a parse refused.
        [REGISTRY_REL]: readFileSync(join(REPO, REGISTRY_REL), "utf8").replace(
          /^- kind: safety$/gm,
          "- kind: architecture",
        ),
      },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("derived ZERO markdown files");
    expect(stdout).toContain("A vacuous corpus makes every diff empty");
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-06 (round 3) — THE UNION'S MARKDOWN RESIDUE IS ASSERTED, NOT DESCRIBED.
//
// The gate printed `the union's remaining N markdown entr(ies) are public documents` and nothing
// checked that they were. Round 2's two pins both land on the REGISTER arm; the REGISTRY arm — the
// `kind: safety` claims — reaches this gate only through that unchecked sentence. Round 3 flipped
// ONE `kind:` cell, README.md left the union AND the watched corpus, and this gate's own pin did not
// fire, because README.md was never a derived kit file and containment cannot miss what it never
// covered (`0 of 36 derived kit files unwatched`, re-measured below rather than transcribed).
// ─────────────────────────────────────────────────────────────────────────────────────────────
const REGISTRY_AS_COMMITTED = readFileSync(join(REPO, REGISTRY_REL), "utf8");

/** The claim round 3's WR-06 recipe flips. Its home is a PUBLIC document, never a kit file. */
const KIND_FLIP_CLAIM = "C-28-001";

/**
 * The committed registry with EXACTLY ONE claim's `kind: safety` line rewritten to another legal
 * kind. Surgical and positional: the block is located by its own heading and only the `kind:` line
 * inside it moves.
 *
 * It THROWS unless exactly one line moved, for the same reason registerWithFlippedSafetyFlag does:
 * a helper that silently flipped zero cells hands every case below an unflipped fixture and turns
 * the whole block green against the defect it exists to catch.
 */
function registryWithFlippedKind(claimId: string): string {
  const lines = REGISTRY_AS_COMMITTED.split("\n");
  const start = lines.findIndex((l) => l.trimEnd() === `### ${claimId}`);
  if (start < 0) {
    throw new Error(`harness premise: ${REGISTRY_REL} carries no \`### ${claimId}\` heading`);
  }
  let flipped = 0;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("### ")) break;
    if (lines[i] === "- kind: safety") {
      lines[i] = "- kind: architecture";
      flipped += 1;
    }
  }
  if (flipped !== 1) {
    throw new Error(
      `harness premise: expected exactly ONE \`- kind: safety\` line inside ${claimId}'s block in ` +
        `${REGISTRY_REL}, but flipped ${flipped}`,
    );
  }
  return lines.join("\n");
}

/** The registry arm as this gate must derive it: `kind: safety` claim homes, markdown only. */
const registryArmMdOf = (root: string): string[] =>
  [
    ...new Set(
      readRegistry(root)
        .claims.filter((c) => c.kind === "safety")
        .map((c) => c.file)
        .filter((f) => f.endsWith(".md")),
    ),
  ].sort();

const residueOf = (root: string): string[] => {
  const kit = derivedKitOf(root);
  return mdOf(root).filter((f) => !kit.includes(f));
};

describe("check-diff-disposition — WR-06: the union's residue is asserted, not described", () => {
  it("the CONTROL — an unflipped mirror exits 0 and PUBLISHES three reconcilable numbers", () => {
    const { root } = makeMirror("gops-diffdisp-wr06-control-", {
      baseCorpus: { [REGISTRY_REL]: REGISTRY_AS_COMMITTED },
    });
    const { status, stdout } = runGate(root);
    expect(status).toBe(0);

    // The three numbers a reader must be able to reconcile BY HAND against the union's own size.
    const kit = derivedKitOf(root).length;
    const registryArm = registryArmMdOf(root).length;
    const residue = residueOf(root).length;
    expect(kit + residue).toBe(mdOf(root).length);
    expect(stdout).toContain(`${residue} markdown entr`);
    expect(stdout).toContain(`${registryArm} from the registry arm`);

    // AND THE UNCHECKED SENTENCE IS GONE. A gate that both asserts the residue and still describes
    // it would leave the reader two statements and no way to tell which one was measured.
    expect(stdout).not.toContain("are public documents");
  });

  it("REDs round 3's ONE-CELL `kind: safety` flip — from a DIFFERENT equality than the source's", () => {
    const control = makeMirror("gops-diffdisp-wr06-base-", {
      baseCorpus: { [REGISTRY_REL]: REGISTRY_AS_COMMITTED },
    });
    const flipped = makeMirror("gops-diffdisp-wr06-flip-", {
      baseCorpus: { [REGISTRY_REL]: registryWithFlippedKind(KIND_FLIP_CLAIM) },
    });

    // ── PREMISE 1 — exactly one claim's kind moved, read back through the ONE parse authority.
    const before = readRegistry(control.root).claims;
    const after = readRegistry(flipped.root).claims;
    expect(after.map((c) => c.id)).toEqual(before.map((c) => c.id));
    const moved = after.filter((c, i) => c.kind !== before[i].kind);
    expect(moved.map((c) => c.id)).toEqual([KIND_FLIP_CLAIM]);
    expect(before.find((c) => c.id === KIND_FLIP_CLAIM)?.kind).toBe("safety");

    // ── PREMISE 2 — the plant is not a no-op at the POINT OF EFFECT: the home really leaves the
    //    union and the watched corpus.
    const home = before.find((c) => c.id === KIND_FLIP_CLAIM)?.file as string;
    expect(mdOf(control.root)).toContain(home);
    expect(mdOf(flipped.root)).not.toContain(home);
    expect(mdOf(flipped.root).length).toBe(mdOf(control.root).length - 1);

    // ── PREMISE 3 — ROUND 3'S OWN EVIDENCE, RE-MEASURED HERE RATHER THAN TRANSCRIBED. The round-2
    //    containment pin cannot see this: the file that left was never a derived kit file, so ZERO
    //    kit files are unwatched and that pin stays silent. This is what makes the case a statement
    //    about a NEW equality rather than a second spelling of the old one.
    const kit = derivedKitOf(flipped.root);
    expect(kit.filter((f) => !mdOf(flipped.root).includes(f))).toEqual([]);

    // ── PREMISE 4 — the CONTROL mirror is green.
    expect(runGate(control.root).status).toBe(0);

    const { status, stdout } = runGate(flipped.root);
    expect(status).toBe(1);
    expect(stdout).toContain("the registry arm's contribution");
    expect(stdout).toContain(`${RESIDUE_FROM_REGISTRY_COUNT - 1} markdown file(s), expected exactly`);

    // WHAT THE MESSAGE CAN AND CANNOT SAY, ASSERTED RATHER THAN ASSUMED. It names the SURVIVORS and
    // the shortfall. It CANNOT name the file that left: after the `kind:` cell moves, nothing in
    // this repository still says that file was a safety-claim home, and a message that named it
    // would be reading a set the gate no longer has. That direction is named at the SOURCE, and the
    // refusal points there.
    // The survivor list is read back out of the message and compared as PATHS, never as substrings:
    // `agent-factory/README.md` contains `README.md`, so a substring assertion here would report the
    // exact opposite of the property and pass while doing it.
    const survivors = /SURVIVED are \[([^\]]*)\]/.exec(stdout)?.[1].split(", ") ?? [];
    expect(survivors).toEqual(registryArmMdOf(flipped.root));
    expect(survivors).not.toContain(home);
    expect(stdout).toContain("equality four names the KIND that moved");

    // The containment finding must NOT be what reported this — that pin is silent here by
    // construction, and a case that passed on its message would be measuring the wrong equality.
    expect(stdout).not.toContain("are NOT in the watched corpus");
  });

  it("REDs a residue member NO safety claim and NO uncounted row vouches for — the other direction", () => {
    // A COUNTED register row flagged `yes` naming a markdown file outside the derived kit puts a
    // member into the residue from a THIRD source. It is equality one's business at the source; here
    // it is a residue member with no account, and the two gates report it independently.
    const STRAY = "docs/stray-public-note.md";
    const rows = REGISTER_AS_COMMITTED.split("\n");
    const at = rows.findIndex((l) => l.startsWith(`| ${ROLE_UNDER_TEST} |`));
    expect(at, "the fixture row must exist").toBeGreaterThanOrEqual(0);
    const injected = [
      ...rows.slice(0, at + 1),
      rows[at].replace(ROLE_UNDER_TEST, STRAY),
      ...rows.slice(at + 1),
    ].join("\n");

    const { root } = makeMirror("gops-diffdisp-wr06-stray-", {
      baseCorpus: { [REGISTER_REL]: injected },
    });
    writeFileSync(join(root, STRAY), "# Stray\n");

    // ── PREMISE — the stray really entered the residue, and the registry arm did not move.
    expect(residueOf(root)).toContain(STRAY);
    expect(registryArmMdOf(root)).toEqual(registryArmMdOf(REPO));

    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("markdown residue is UNVOUCHED");
    expect(stdout).toContain(STRAY);
    // TWO ACTS, TWO REMEDIES, TWO FINDINGS: this is not reported through the registry-arm count.
    expect(stdout).not.toContain("the registry arm's contribution");
  });

  it("REDs a VACUOUS registry arm — zero `kind: safety` rows is a NAMED refusal here too", () => {
    // The register is left intact, so the union is NOT empty and the round-2 vacuity floor cannot
    // speak. What is empty is the ARM, which is the granularity round 3's flip actually operates at.
    const { root } = makeMirror("gops-diffdisp-wr06-vacuous-arm-", {
      baseCorpus: {
        [REGISTRY_REL]: REGISTRY_AS_COMMITTED.replace(
          /^- kind: safety$/gm,
          "- kind: architecture",
        ),
      },
    });
    expect(registryArmMdOf(root)).toEqual([]);
    expect(mdOf(root).length).toBeGreaterThan(0); // the union is NOT empty — this is the arm alone

    const { status, stdout } = runGate(root);
    expect(status).toBe(1);
    expect(stdout).toContain("the registry arm is EMPTY");
  });

  it("the register's non-kit contribution is pinned two-sided against the ONE literal that declares it", () => {
    // The residue is not only the registry arm: the UNCOUNTED protocol row is flagged `yes` and is
    // outside the derived kit by derivation, so it is a residue member with a register reason. It is
    // pinned against PROTOCOL_FILE — the one place that path is declared — rather than counted.
    expect(residueOf(REPO)).toContain(PROTOCOL_FILE);
    expect(residueOf(REPO).filter((f) => !registryArmMdOf(REPO).includes(f))).toEqual([
      PROTOCOL_FILE,
    ]);
  });

  it("THE BOTH-ARMS PROBE: one cell of EACH arm moves in one commit, and BOTH are named", () => {
    // THIS IS THE CASE NEITHER SINGLE-ARM HARNESS COULD PRODUCE. Round 3's finding is that two pins
    // covering one arm read as coverage; a gate that reported only the first arm it met would pass
    // every single-arm case above and still leave the second arm's drift invisible in exactly the
    // arrangement a real narrowing edit takes.
    const { root } = makeMirror("gops-diffdisp-wr06-botharms-", {
      baseCorpus: {
        [REGISTER_REL]: registerWithFlippedSafetyFlag(FLIP_TARGET),
        [REGISTRY_REL]: registryWithFlippedKind(KIND_FLIP_CLAIM),
      },
    });

    // ── PREMISE — BOTH plants landed, each measured at its own point of effect.
    const watched = mdOf(root);
    expect(watched).not.toContain(FLIP_TARGET); // register arm moved
    expect(watched).not.toContain("README.md"); // registry arm moved
    expect(derivedKitOf(root)).toContain(FLIP_TARGET);

    const { status, stdout } = runGate(root);
    expect(status).toBe(1);

    // THE FINDING COUNT IS THE ASSERTION, not merely the presence of one message. An early return
    // after the first defect would print exactly ONE finding here.
    const findings = stdout
      .split("\n")
      .filter((l) => l.trimStart().startsWith("FAIL "));
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((f) => f.includes("are NOT in the watched corpus"))).toBe(true);
    expect(findings.some((f) => f.includes("the registry arm's contribution"))).toBe(true);

    // AND THE COUNT ASSERTION IS PROVEN TO BE DOING WORK. An early-returning gate's observable
    // output is its FIRST finding alone — the single-arm shape every case above accepts — and this
    // assertion must reject it.
    const earlyReturn = findings.slice(0, 1);
    expect(() => expect(earlyReturn.length).toBeGreaterThanOrEqual(2)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-03 / LANG-07 — EVERY SECTION-EXTENT LOCATOR IN THIS MODULE IS DERIVED, NEVER TRANSCRIBED.
//
// Round 1 of this gap closure fixed THREE section locators the review had written down and left a
// FOURTH — `readDispositionRows` — untouched, because nobody derived it. That is the set-literal
// drift class applied to a defect list: a hand-maintained list of addresses rots exactly like a
// hand-maintained list of files, and it rots silently because the sites it omits raise nothing.
//
// So this block does not start from the review's addresses. It scans THIS MODULE's own source for
// the CONSTRUCTS that answer a section-extent question and reports whatever it finds. If the answer
// ever names a site nobody expected, that site is the finding.
//
// WHAT A "SECTION-EXTENT CONSTRUCT" IS, MECHANICALLY. Three shapes, each with an operand that is
// heading-shaped — an identifier carrying `heading`/`HEADING`/`anchor`/`ANCHOR`, or a string literal
// that opens with ATX hashes and a space:
//
//   [0] LOCATE by whole-line equality — `lines[i].trimEnd() === heading`
//   [1] LOCATE by substring or offset search — `body.indexOf(DISPOSITION_HEADING)`
//   [2] CLOSE by heading PREFIX — `line.startsWith("## ")`, or an anchored `/^#{1,2} /` literal
//
// CONSTRUCT [1] IS THIS FILE'S DEVIATION FROM THE REVIEW'S OWN SKETCH, AND IT IS THE WHOLE POINT.
// The round-2 review and 29-22-PLAN.md both describe the classifier as "a heading-equality test
// against a heading constant, and a heading-prefix test used to terminate a scan" — constructs [0]
// and [2], and nothing else. Those two are BLIND to `readDispositionRows`, which locates its section
// with neither: it calls `indexOf` on the raw document. A derivation built to the sketch would have
// re-derived exactly the three sites round 1 already knew about and re-missed the fourth, inside the
// fix written to stop that happening. The blindness is asserted below rather than argued.
//
// COMMENT LINES ARE STRIPPED before classification, for the reason the fence-machine scan in
// scripts/frontmatter.test.ts already gives: the property is about CODE, not about whether a
// construct is DESCRIBED. This module describes every one of these constructs at length in the
// comment blocks that record why they were deleted, and without the strip the answer after the fix
// would be the prose, not the code.
//
// WHAT THIS FLOOR DOES NOT COVER, NAMED RATHER THAN LEFT UNDISCLOSED: a locator whose operand is
// named something other than heading/anchor and is not a literal; a heading recogniser assembled by
// concatenation or `new RegExp(...)`; a `slice(0, 3)`/`charAt` prefix form; and a locator written in
// a language this scan does not read. It is a floor against the shapes a section locator plausibly
// takes in this tree, not a proof that no other shape can exist.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const MODULE_REL = "scripts/check-diff-disposition.ts";
const AUTHORITY_REL = "scripts/frontmatter.ts";

/** Comment lines blanked, POSITIONS PRESERVED so a site's line index still means something. */
const codeLinesOf = (src: string): string[] =>
  src.split("\n").map((l) => {
    const t = l.trimStart();
    return t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") ? "" : l;
  });

/** An identifier that names a heading, or a string literal that IS one. `\x60` is a backtick. */
const HEADING_OPERAND = String.raw`(?:[\w$]*(?:HEADING|Heading|heading|ANCHOR|anchor)[\w$]*|["'\x60]#{1,6} )`;

const SECTION_EXTENT_CONSTRUCTS: readonly RegExp[] = [
  new RegExp(
    String.raw`(?:===|!==)\s*${HEADING_OPERAND}|${HEADING_OPERAND}\s*(?:===|!==)`,
  ),
  new RegExp(String.raw`\.(?:indexOf|lastIndexOf|search)\(\s*${HEADING_OPERAND}`),
  /\.startsWith\(\s*["'\x60]#{1,6} |\/\^#\{?[\d,]*\}?[ \\]/,
];

/** The nearest preceding top-level `function` declaration — which site the construct belongs to. */
const enclosingFunction = (code: readonly string[], i: number): string => {
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
 * parameterises its own: the falsifiability probe has to run THE RULE with a construct removed, and
 * a second spelling of the rule would measure the copy instead of the thing.
 *
 * THE SITE STRING DELIBERATELY CARRIES NO CONSTRUCT INDEX. The first draft of this helper wrote
 * `construct[n]` into it, which made the removal probe below a FALSE PROBE: dropping construct [0]
 * renumbers [1] and [2], so every site string changed and `not.toEqual(base)` passed whether or not
 * the removed construct had ever matched anything. A probe that cannot fail is the harness-premise
 * failure this project has now recorded nine times, caught here by reading the received value.
 */
const sectionExtentSites = (
  src: string,
  constructs: readonly RegExp[] = SECTION_EXTENT_CONSTRUCTS,
): string[] => {
  const code = codeLinesOf(src);
  const out: string[] = [];
  for (let i = 0; i < code.length; i += 1) {
    if (constructs.some((r) => r.test(code[i]))) {
      out.push(`${enclosingFunction(code, i)} :: ${code[i].trim()}`);
    }
  }
  return out;
};

/**
 * A source carrying ONE site of each construct — the falsifiability probe's fixture.
 *
 * It exists so the derivation's liveness is provable WITHOUT depending on the live module still
 * carrying a defect. After the rewire the live answer is the EMPTY SET, and an empty answer from a
 * classifier that matches nothing is indistinguishable from an empty answer from a classifier that
 * works. This fixture is what tells the two apart, permanently.
 */
const PLANTED_LOCATOR_SOURCE = [
  "export function plantedLocateByEquality(lines: string[], heading: string): number {",
  "  for (let i = 0; i < lines.length; i += 1) {",
  "    if (lines[i].trimEnd() === heading) return i;",
  "  }",
  "  return -1;",
  "}",
  "",
  "export function plantedLocateBySearch(body: string, want: string): number {",
  "  const PLAN_HEADING = want;",
  "  return body.indexOf(PLAN_HEADING);",
  "}",
  "",
  "export function plantedCloseByPrefix(lines: string[], from: number): number {",
  "  for (let i = from; i < lines.length; i += 1) {",
  '    if (lines[i].startsWith("## ")) return i;',
  "  }",
  "  return lines.length;",
  "}",
  "",
].join("\n");

/**
 * The DERIVED site list, produced by running the classifier above over the live module — never
 * transcribed from the review, whose own address list is the thing that missed a site.
 *
 * THE PIN MOVED FROM THREE MEMBERS TO ZERO, AND THE MOVE IS THE DELIVERABLE. Measured at commit
 * `931a466`, before the rewire, the answer was exactly:
 *
 *   locateSection :: if (lines[i].trimEnd() !== heading) continue;
 *   locateSection :: if (!fenced[j] && lines[j].startsWith("## ")) {
 *   readDispositionRows :: const at = body.indexOf(DISPOSITION_HEADING);
 *
 * — two private predicates inside `locateSection` and the fourth locator round 1 never derived. All
 * three are DELETED, not corrected in place: both functions now take their answer from
 * scripts/frontmatter.ts and this module declares no section predicate at all. An EMPTY answer is
 * only meaningful beside a classifier proven live, which is what the falsifiability case and the
 * authority case below are for.
 */
const LOCATOR_SITES: readonly string[] = [];
const LOCATOR_SITE_COUNT = 0;

/** A root carrying only a disposition directory — the unit fixture for readDispositionRows. */
function dispositionRoot(
  prefix: string,
  files: Readonly<Record<string, string>>,
): string {
  const root = freshTmp(prefix);
  mkdirSync(join(root, DISPOSITION_DIR), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(root, DISPOSITION_DIR, name), content, "utf8");
  }
  return root;
}

/** The seven-cell row shape, spelled once, so a fixture's fenced copy and real copy cannot drift. */
const sevenCellRow = (
  file: string,
  before: string,
  after: string,
  companion: string,
): string =>
  `| ${file} | 11 | ${before} | ${after} | WP-03 | Reworded under the profile. | ${companion} |`;

const TABLE_HEAD = "| file | line | before | after | rule | disposition | companion |";
const TABLE_SEP = "|---|---|---|---|---|---|---|";

describe("check-diff-disposition — every section-extent locator is DERIVED, not transcribed (WR-03)", () => {
  it("the module's section-extent locator sites are derived two-sided and pinned by cardinality", () => {
    const src = readFileSync(join(REPO, MODULE_REL), "utf8");
    const sites = sectionExtentSites(src);

    // NON-VACUITY OF THE CORPUS FIRST: the module really was read.
    expect(src.length, "the module under derivation must really have been read").toBeGreaterThan(
      10_000,
    );
    expect(sites).toEqual(LOCATOR_SITES);
    expect(
      sites,
      "cardinality pinned as a NUMBER beside the member list, so a re-declared predicate lands as a NAMED site rather than as a silent regrowth",
    ).toHaveLength(LOCATOR_SITE_COUNT);

    // Each derived line matches EXACTLY ONE construct, which is what makes the per-construct
    // removal probe below attributable to the construct removed and to nothing else.
    for (const line of codeLinesOf(src)) {
      const hits = SECTION_EXTENT_CONSTRUCTS.filter((r) => r.test(line));
      expect(hits.length).toBeLessThanOrEqual(1);
    }
  });

  it("the derivation is FALSIFIABLE — every construct is load-bearing on a source carrying all three", () => {
    const base = sectionExtentSites(PLANTED_LOCATOR_SOURCE);
    expect(base).toEqual([
      "plantedLocateByEquality :: if (lines[i].trimEnd() === heading) return i;",
      "plantedLocateBySearch :: return body.indexOf(PLAN_HEADING);",
      'plantedCloseByPrefix :: if (lines[i].startsWith("## ")) return i;',
    ]);
    expect(base).toHaveLength(SECTION_EXTENT_CONSTRUCTS.length);

    for (let i = 0; i < SECTION_EXTENT_CONSTRUCTS.length; i += 1) {
      const without = sectionExtentSites(
        PLANTED_LOCATOR_SOURCE,
        SECTION_EXTENT_CONSTRUCTS.filter((_, j) => j !== i),
      );
      // The site the removal must cost, named — so the probe asserts WHICH member vanished rather
      // than only that the answer moved. Site strings carry no construct index precisely so that
      // this comparison measures a lost member instead of a renumbered label.
      expect(
        without,
        `dropping construct [${i}] must cost exactly the site it matched — a construct that can be deleted with the answer unchanged is decoration`,
      ).toEqual(base.filter((_, j) => j !== i));
      expect(without).toHaveLength(SECTION_EXTENT_CONSTRUCTS.length - 1);
    }
  });

  it("the review's own two-construct sketch is BLIND to the fourth locator — construct[1] is what finds it", () => {
    // THE DEVIATION, ASSERTED RATHER THAN ARGUED. Run the classifier with exactly the two constructs
    // the review and 29-22-PLAN.md name — equality and heading-prefix — and the SEARCH locator
    // disappears from the answer while the other two remain. That is the shape of a fix that
    // re-derives the known defects and re-misses the unknown one.
    //
    // MEASURED ON THE LIVE MODULE AT COMMIT `931a466`, BEFORE THE REWIRE: the full classifier
    // returned three sites and the two-construct sketch returned two, the missing one being
    // `readDispositionRows :: const at = body.indexOf(DISPOSITION_HEADING);` — the fourth locator
    // this plan exists to close. The live module now derives nothing at all, so the property is
    // pinned here on the planted fixture instead, where it stays non-vacuous permanently. A case
    // asserting "the sketch found nothing" against a source that carries nothing would be exactly
    // the vacuous green this phase keeps meeting.
    const sketch = SECTION_EXTENT_CONSTRUCTS.filter((_, i) => i !== 1);
    const full = sectionExtentSites(PLANTED_LOCATOR_SOURCE);
    const derivedBySketch = sectionExtentSites(PLANTED_LOCATOR_SOURCE, sketch);
    // Non-vacuity: the sketch is not blind to EVERYTHING, it is blind to one shape.
    expect(derivedBySketch.length).toBeGreaterThan(0);
    expect(
      derivedBySketch.some((s) => s.startsWith("plantedLocateBySearch")),
      "the two-construct sketch must NOT find a substring-search locator — that blindness is why the third construct exists",
    ).toBe(false);
    // …and it is blind to that site ALONE, so the widening is minimal rather than a rewrite.
    expect(full.filter((s) => !derivedBySketch.includes(s))).toEqual([
      "plantedLocateBySearch :: return body.indexOf(PLAN_HEADING);",
    ]);
  });

  it("the AUTHORITY still carries these constructs — the predicate MOVED, it did not evaporate", () => {
    // The other side of the two-sided claim, and the assertion that never rots: after the rewire
    // this module derives ZERO sites, and a zero that means "the question moved to one place" must
    // be told apart from a zero that means "nobody asks the question any more". So the module that
    // is ALLOWED to hold the predicate is asserted to still hold it.
    const authority = sectionExtentSites(
      readFileSync(join(REPO, AUTHORITY_REL), "utf8"),
    );
    expect(authority.length).toBeGreaterThan(0);
    expect(
      authority.some((s) => s.startsWith("unfencedHeadingIndex")),
      "scripts/frontmatter.ts must still declare the heading equality — it is the one place this predicate is allowed to live",
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// WR-03 — THE DISPOSITION ROW READER IS BOUNDED AND FENCE-AWARE, AND ITS DIRECTION IS FAIL-OPEN.
//
// `readDispositionRows` located `## Dispositions` with a bare substring search over the whole file
// and then admitted every seven-cell pipe line from that offset TO END OF FILE. Both halves are
// wrong in the SAME direction: a fenced example row and a stray table under a later heading both
// became rows, and a row is what satisfies the structural companion arm — the arm carrying the whole
// positional freeze, the one that catches a REWORD. A spurious row therefore ADMITS a change that
// owed a companion edit. That is the opposite direction from its sibling `locateSection`, whose
// truncation SHRINKS the frozen region, and naming which is which is what this round is for.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("check-diff-disposition — the disposition row reader is bounded and fence-aware (WR-03)", () => {
  it("a FENCED seven-column example under `## Dispositions` donates no row", () => {
    const real = sevenCellRow("agent-factory/roles/a.md", "before one", "after one", "companion");
    const quoted = sevenCellRow("agent-factory/roles/b.md", "before two", "after two", "companion");
    const body = [
      "# Harness dispositions",
      "",
      "## Dispositions",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      real,
      "",
      "Authors copy this shape:",
      "",
      "```markdown",
      TABLE_HEAD,
      TABLE_SEP,
      quoted,
      "```",
      "",
    ].join("\n");
    // The fixture's own premise, asserted through the ONE fence authority: the quoted row really is
    // inside a fence and the real one really is not.
    const flags = fencedLineFlags(body);
    const lines = body.split("\n");
    expect(flags[lines.indexOf(quoted)]).toBe(true);
    expect(flags[lines.indexOf(real)]).toBe(false);

    const root = dispositionRoot("gops-diffdisp-wr03-fenced-", { "29-99.md": body });
    const { rows, refusals } = readDispositionRows(root);
    expect(rows).toHaveLength(1);
    expect(rows[0].file).toBe("agent-factory/roles/a.md");
    expect(refusals).toEqual([]);
  });

  it("a seven-column table under a LATER `## ` heading donates no row", () => {
    const real = sevenCellRow("agent-factory/roles/a.md", "before one", "after one", "companion");
    const stray = sevenCellRow("agent-factory/roles/b.md", "before two", "after two", "companion");
    const body = [
      "# Harness dispositions",
      "",
      "## Dispositions",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      real,
      "",
      "## Appendix",
      "",
      "A table that is not this file's disposition table.",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      stray,
      "",
    ].join("\n");
    const root = dispositionRoot("gops-diffdisp-wr03-later-", { "29-99.md": body });
    const { rows } = readDispositionRows(root);
    expect(rows).toHaveLength(1);
    expect(rows[0].file).toBe("agent-factory/roles/a.md");
  });

  it("a FENCED occurrence of `## Dispositions` is not taken as the real heading", () => {
    const bogus = sevenCellRow("agent-factory/roles/z.md", "quoted before", "quoted after", "quoted");
    const real = sevenCellRow("agent-factory/roles/a.md", "before one", "after one", "companion");
    const body = [
      "# Harness dispositions",
      "",
      "The register looks like this:",
      "",
      "```markdown",
      "## Dispositions",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      bogus,
      "```",
      "",
      "## Dispositions",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      real,
      "",
    ].join("\n");
    // Premise: the literal really does occur twice, the FIRST occurrence is fenced, and a substring
    // search therefore finds the wrong one first.
    const lines = body.split("\n");
    expect(lines.filter((l) => l === "## Dispositions")).toHaveLength(2);
    const flags = fencedLineFlags(body);
    expect(flags[lines.indexOf("## Dispositions")]).toBe(true);
    expect(flags[lines.lastIndexOf("## Dispositions")]).toBe(false);

    const root = dispositionRoot("gops-diffdisp-wr03-quoted-heading-", { "29-99.md": body });
    const { rows } = readDispositionRows(root);
    expect(rows).toHaveLength(1);
    expect(rows[0].file).toBe("agent-factory/roles/a.md");
  });

  it("IN-01 — a row whose `before` cell carries a code span with a pipe is NAMED, not silently dropped", () => {
    // A `before` cell containing a code span with a pipe splits into EIGHT cells, so the row is
    // dropped. Today the only trace is the zero-row refusal, which fires only when NO other row in
    // the file parses — so beside two good rows the line simply vanishes, and the clause it covered
    // reads as undispositioned for a reason that has nothing to do with the author's judgement.
    const good1 = sevenCellRow("agent-factory/roles/a.md", "before one", "after one", "companion");
    const good2 = sevenCellRow("agent-factory/roles/b.md", "before two", "after two", "companion");
    const malformed = sevenCellRow(
      "agent-factory/roles/c.md",
      "the `a | b` alternation",
      "after three",
      "companion",
    );
    const body = [
      "# Harness dispositions",
      "",
      "## Dispositions",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      good1,
      malformed,
      good2,
      "",
    ].join("\n");
    // Premise: the malformed line really does split to eight cells, so the case is about the drop
    // and not about a fixture that happens to parse.
    expect(malformed.split("|").filter((c) => c.trim() !== "")).toHaveLength(8);

    const root = dispositionRoot("gops-diffdisp-in01-", { "29-99.md": body });
    const { rows, refusals } = readDispositionRows(root);
    expect(rows).toHaveLength(2);
    const malformedLine = body.split("\n").indexOf(malformed) + 1;
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain(`29-99.md:${malformedLine}`);
    expect(refusals[0]).toContain("8 cell");
    expect(refusals[0]).toContain("code span");
  });

  it("the live BYPASS end-to-end — a FENCED example row satisfies the structural companion arm", () => {
    // THE REPRODUCTION, not a unit assertion. The role's `## Hard limits` sentence is reworded, and
    // the ONLY row that matches it lives inside a fenced example. At HEAD that row is read, its
    // companion cell is filled, and the gate exits 0 — a frozen reword admitted by a code block.
    //
    // The workflow note and its REAL row are here so the file still carries a parsed row: without
    // them the zero-row refusal would red the fixed build for an unrelated reason and the case would
    // stop being a statement about the fence.
    const noteClause = "Every reviewer reads the acceptance scenario before the diff.";
    const quotedRow = sevenCellRow(
      ROLE_UNDER_TEST,
      HARD_LIMIT_SENTENCE,
      REWORDED_HARD_LIMIT,
      REAL_COMPANION_PROSE,
    );
    const dispositions = [
      "# Harness dispositions",
      "",
      "## Dispositions",
      "",
      TABLE_HEAD,
      TABLE_SEP,
      row(WORKFLOW_UNDER_TEST, "—", noteClause, "—"),
      "",
      "An example row, for authors to copy:",
      "",
      "```markdown",
      quotedRow,
      "```",
      "",
    ].join("\n");
    expect(fencedLineFlags(dispositions)[dispositions.split("\n").indexOf(quotedRow)]).toBe(true);

    const { root } = makeMirror("gops-diffdisp-wr03-bypass-", {
      plant: {
        [ROLE_UNDER_TEST]: REWORDED_ROLE,
        [WORKFLOW_UNDER_TEST]: workflowWithNote(noteClause),
      },
      dispositions: { "29-99.md": dispositions },
    });
    const { status, stdout } = runGate(root);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
    expect(status).toBe(1);
    expect(stdout).toContain("FROZEN by structuralSections");
    expect(stdout).toContain(segmentClauses(REWORDED_HARD_LIMIT)[0].clause);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// LANG-07 arm two — `locateSection` closes on an unfenced heading of level AT MOST TWO.
//
// The private close scan recognised `## ` alone, so a `# ` heading did not end a frozen section and
// the region ran on into the next top-level part of the document. Consuming the shared authority at
// level two fixes that and WIDENS what closes a section, which is a fail-OPEN direction on this
// corpus — the frozen region gets shorter. That is why the widening lands together with the fence
// awareness, and why the corpus measurement below is an assertion rather than a claim.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const LEVEL_ONE_SUCCESSOR = "# Appendix";

/** The role under test with a LEVEL-ONE heading between `## Hard limits` and `## Notes`. */
const roleWithLevelOneSuccessor = (): string =>
  ROLE_BODY(REAL_ROLES[0]).replace(
    "\n## Notes\n",
    `\n${LEVEL_ONE_SUCCESSOR}\nA later top-level part of the document.\n\n## Notes\n`,
  );

describe("check-diff-disposition — a frozen section closes at a LEVEL-ONE heading (LANG-07)", () => {
  it("`## Hard limits` ends at the `# ` heading, not at the `## ` heading below it", () => {
    const body = roleWithLevelOneSuccessor();
    const appendixLine = lineOf(body, LEVEL_ONE_SUCCESSOR);
    const notesLine = lineOf(body, "## Notes");
    // Premise: the two candidate terminators are DISTINCT and in this order, so only the LEVEL axis
    // can tell the two answers apart. Without this the case could pass for the wrong reason.
    expect(appendixLine).toBeLessThan(notesLine);
    expect(fencedLineFlags(body)[appendixLine - 1]).toBe(false);

    const span = locateSection(body, FROZEN_SECTION_ANCHORS[0].heading);
    expect(span).not.toBeNull();
    expect((span as { to: number }).to).toBe(appendixLine - 1);
  });

  // ───────────────────────────────────────────────────────────────────────────────────────────
  // THE WIDENING IS PROVEN BEHAVIOUR-PRESERVING BY MEASUREMENT, NOT BY ASSUMPTION.
  //
  // The old close is restated here as a REFERENCE IMPLEMENTATION. That is deliberate and it is not
  // a second authority: a case's restated predicate is an INPUT to the comparison, the same
  // distinction scripts/frontmatter.test.ts's IN-05 scan already draws. It is also the only way to
  // compare the two answers once the old one has been deleted from the module, which is the point.
  // ───────────────────────────────────────────────────────────────────────────────────────────

  /** The DELETED close scan, restated: the first unfenced `## ` line at or after `from`, else EOF. */
  const levelTwoOnlyClose = (text: string, from: number): number => {
    const lines = text.split("\n");
    const flags = fencedLineFlags(text);
    for (let i = from; i < lines.length; i += 1) {
      if (!flags[i] && lines[i].startsWith("## ")) return i;
    }
    return lines.length;
  };

  it("the comparison CAN fail — the two closes disagree on a body carrying an unfenced `# ` heading", () => {
    // The falsifiability floor for the corpus case below. Without it, "zero disagreements over 55
    // regions" is indistinguishable from a comparison that cannot produce one.
    const body = roleWithLevelOneSuccessor();
    const at = body.split("\n").indexOf(FROZEN_SECTION_ANCHORS[0].heading);
    expect(at).toBeGreaterThan(-1);
    const widened = locateSection(body, FROZEN_SECTION_ANCHORS[0].heading);
    expect((widened as { to: number }).to).not.toBe(levelTwoOnlyClose(body, at + 1));
  });

  it("the level widening moves NOTHING on the live watched corpus — 55 regions, zero disagreements", () => {
    const corpus = [
      ...listRoles(REPO).map((b) => ({
        rel: `${ROLES_SUBPATH}/${b}`,
        headings: [FROZEN_SECTION_ANCHORS[0].heading],
      })),
      ...listWorkflows(REPO).map((b) => ({
        rel: `${WORKFLOWS_SUBPATH}/${b}`,
        headings: [
          FROZEN_SECTION_ANCHORS[1].heading,
          FROZEN_SECTION_ANCHORS[2].heading,
        ],
      })),
    ];
    const disagreements: string[] = [];
    let located = 0;
    for (const { rel, headings } of corpus) {
      const text = readFileSync(join(REPO, rel), "utf8");
      for (const heading of headings) {
        const span = locateSection(text, heading);
        if (span === null) continue;
        located += 1;
        const old = levelTwoOnlyClose(text, span.from);
        if (old !== span.to) {
          disagreements.push(`${rel} \`${heading}\`: level-two close ${old}, level-two-or-one close ${span.to}`);
        }
      }
    }
    // NON-VACUITY FIRST, and as the SAME number the sibling WR-06 case derives: a corpus that
    // located nothing would satisfy the equality below with no work done at all.
    expect(located).toBe(ROLE_COUNT + 2 * WORKFLOW_COUNT);
    expect(
      disagreements,
      "the level widening must not move a single frozen region on the live corpus — a region that got SHORTER is protection silently lost",
    ).toEqual([]);
  });

  it("every level-one heading BELOW a `## ` section in the watched corpus is FENCED, and there are some", () => {
    // WHAT MAKES THE WIDENING SAFE, AS A FACT ABOUT THE CORPUS RATHER THAN A PROPERTY OF THE CODE.
    // A `# ` heading now closes a `## ` section, so an UNFENCED `# ` line below a `## ` heading would
    // truncate that section — the fail-open direction, invisible in a green run. Measured this
    // session the answer is NINE lines, every one of them fenced and every one of them in
    // `agent-factory/README.md` (lines 105, 109, 113, 116, 119, 122, 125, 128 and 131 — quoted
    // `/grug` invocations inside a shell example).
    //
    // THE PLAN'S OWN VERSION OF THIS ASSERTION IS FALSE AND IS NOT THE ONE WRITTEN HERE. 29-22-PLAN
    // says "every line after the first that is a level-one heading … is flagged by the one fence
    // authority". Measured over the same corpus that is 48 lines of which 37 are UNFENCED: every
    // role and workflow carries its `# Role: ` / `# Workflow: ` title at line 6. Those 37 are
    // harmless for the exact reason the plan's own task text gives — they sit ABOVE every `## `
    // heading in their file, so no section-close scan ever starts before them — and the property
    // that expresses the safety is therefore "below a `## `", not "after line one".
    const offenders: string[] = [];
    let examined = 0;
    let filesScanned = 0;
    for (const rel of mdOf(REPO)) {
      filesScanned += 1;
      const text = readFileSync(join(REPO, rel), "utf8");
      const lines = text.split("\n");
      const flags = fencedLineFlags(text);
      const firstSection = lines.findIndex(
        (l, i) => !flags[i] && l.startsWith("## "),
      );
      if (firstSection === -1) continue;
      for (let i = firstSection + 1; i < lines.length; i += 1) {
        if (!lines[i].startsWith("# ")) continue;
        examined += 1;
        if (!flags[i]) offenders.push(`${rel}:${i + 1} — ${lines[i]}`);
      }
    }
    // TWO FLOORS, because a vacuity floor over the FILES cannot see a silently short ELEMENT count.
    expect(filesScanned).toBeGreaterThan(0);
    expect(
      examined,
      "the derived set of level-one headings below a `## ` section must be NON-EMPTY — a scan that found nothing cannot report that they are all fenced",
    ).toBeGreaterThan(0);
    expect(
      offenders,
      "an UNFENCED level-one heading below a `## ` section TRUNCATES that section under the level-two close — the frozen region above it just got shorter, which is protection lost with no failure anywhere",
    ).toEqual([]);
  });
});

describe("check-diff-disposition — the output is diffable", () => {
  it("produces byte-identical stdout across two runs over the same mirror", () => {
    // The ordering assertion. Findings are emitted in file-path then line-number order, so a
    // transcript quoted in a SUMMARY is reproducible rather than a snapshot of one run's map order.
    const { root } = makeMirror("gops-diffdisp-stable-", {
      plant: {
        [ROLE_UNDER_TEST]: REWORDED_ROLE,
        [WORKFLOW_UNDER_TEST]: workflowWithNote(
          "Every reviewer reads the acceptance scenario before the diff.",
        ),
      },
      // A disposition file exists and covers neither plant, so BOTH finding kinds are emitted and
      // the ordering assertion has more than one file and more than one line to order.
      dispositions: {
        "29-05.md": dispositionFile([
          row(WORKFLOW_UNDER_TEST, "—", "A clause that was never planted anywhere.", "—"),
        ]),
      },
    });
    const first = runGate(root);
    const second = runGate(root);
    expect(first.status).toBe(1);
    expect(second.status).toBe(first.status);
    expect(second.stdout).toBe(first.stdout);
    // Non-vacuity: the compared output actually carries findings.
    expect(first.stdout).toContain("FROZEN by structuralSections");
  });
});

describe("check-diff-disposition — wiring", () => {
  it("is wired in CI as well as here — a gate that runs only from a test is borrowed, not wired", () => {
    const ci = readFileSync(join(REPO, ".github", "workflows", "ci.yml"), "utf8");
    expect(ci.split("node scripts/check-diff-disposition.js").length - 1).toBe(1);
  });

  it("CI checks out full history, which this gate's recorded base commit requires", () => {
    // The setting and the gate are asserted TOGETHER. A `fetch-depth: 0` that survives while the
    // gate is removed is a slowdown nobody can explain; a gate that survives while the setting is
    // removed is permanently red on an unresolvable base. Neither is allowed to drift alone.
    const ci = readFileSync(join(REPO, ".github", "workflows", "ci.yml"), "utf8");
    expect(ci).toContain("fetch-depth: 0");
    expect(ci).toContain("FULL HISTORY IS REQUIRED BY guard_diff_disposition");
  });

  it("has a package.json script with the mandatory tsc prefix its siblings carry", () => {
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    expect(pkg.scripts["check:diff-disposition"]).toBe(
      "tsc --outDir .tmp-build && node scripts/check-diff-disposition.js",
    );
    // T-29-SC: this plan installs nothing. The manifest gains one `scripts` entry and no dependency.
    expect(pkg.dependencies).toBeUndefined();
  });
});
