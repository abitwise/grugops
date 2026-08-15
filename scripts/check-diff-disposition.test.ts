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
} from "./check-diff-disposition.js";
import {
  listRoles,
  listWorkflows,
  ROLE_COUNT,
  WORKFLOW_COUNT,
  ROLES_SUBPATH,
  WORKFLOWS_SUBPATH,
} from "./kit-model.js";
import { readRegistry } from "./audit-model.js";
import { normalizeSentence, segmentClauses } from "./voice-model.js";

const REPO = join(import.meta.dirname, "..");
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

  gitIn(root, ["init", "-q"]);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "-q", "--no-gpg-sign", "-m", "base"]);
  const base = gitIn(root, ["rev-parse", "HEAD"]).trim();

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
    expect(stdout).toContain("diff disposition: 0 findings over");
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
    expect(stdout).toContain("diff disposition: 0 findings over");
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
    expect(stdout).toContain("diff disposition: 0 findings over");
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
    expect(stdout).toContain("diff disposition: 0 findings over");
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
