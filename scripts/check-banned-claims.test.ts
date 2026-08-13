// check-banned-claims.test.ts — the hermetic harness for the LANG-04 banned-claim gate.
//
// WHAT THIS FILE IS FOR, STATED PLAINLY, AND WHY IT IS THE DURABLE HALF OF D-44.
//
// scripts/check-banned-claims.js was watched failing on a real claim in a real file: three findings
// over 82 documents at the commit that introduced it, exit 0 at the next commit, with the gate
// byte-unchanged across the transition. That transcript is the acceptance evidence, and it expires.
// The tree can never again contain the claim — the whole point of the gate is that it cannot — so
// after that one commit the RED has no live reproduction anywhere. Without the PLANTED fixture
// below, this gate's only evidence would be a historical commit nobody re-runs.
//
// A RED verdict also proves nothing on its own: a gate that ALWAYS fails is trivially red. These
// cases are what turn the verdict into a MEASUREMENT — the same committed .js exits 0 on a clean
// mirror, exits 1 on each planted shape, and honours its one named exemption REGION-SCOPED rather
// than file-scoped.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a safety/trace guard; the acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. So every behavioural case here drives the COMMITTED .js via
// spawnSync against a hermetic CHECK_ROOT mirror under the OS temp dir — never the .ts, and never
// the real tree. Nothing is ever written into the committed tree.
//
// EVERY PLANT IS BUILT BY INTERPOLATING FROM BANNED_CLAIM_LITERALS. A retyped literal here would be
// a second copy of the list living in the file that polices it — the set-literal drift this
// repository has diagnosed as one of its two systemic failure classes, landing inside the test that
// exists to prevent it.
//
// WHY THE MIRRORS ARE SYNTHESIZED RATHER THAN COPIED. The same argument
// check-public-docs-vocabulary.test.ts records: a byte-faithful copy of the real kit is the
// baseline only while the real kit is clean, and the whole subject of this gate is text that must
// not appear. The builder synthesizes a document set with the SHAPE the derivation expects and
// derives its own filler count from the gate's exported pin, so a mirror that drifts out of shape
// fails the pin case rather than silently testing something else.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-banned-claims.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BANNED_CLAIM_LITERALS,
  BANNED_CLAIM_SCAN_COUNT,
  BANNED_CLAIM_SCAN_PARTS,
  BANNED_CLAIM_EXEMPT_REGION,
  BANNED_CLAIM_EXCLUDED,
  BANNED_CLAIM_EXCLUDED_LOCATIONS,
  CONFORMANCE_VERB_MARKERS,
  bannedClaimScan,
  bannedClaimScanOverlap,
} from "./check-banned-claims.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-banned-claims.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ── The plants, taken from the authority ─────────────────────────────────────────────────────
//
// Selected BY PROPERTY rather than by index or by name, so a reordering of the list cannot silently
// turn a plant into a different literal, and a retyped string never enters this file.
const UNCONDITIONAL_NAME = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "standard-name" && l.requiresOnSameLine === undefined,
);
const CONDITIONAL_NAME = BANNED_CLAIM_LITERALS.find(
  (l) => l.requiresOnSameLine !== undefined,
);
const TOKEN_CLAIM = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "token-economy",
);
const COMPREHENSION_CLAIM = BANNED_CLAIM_LITERALS.find(
  (l) => l.group === "comprehension",
);

// Non-vacuity on the selection itself. A `find` that returned undefined would make every plant
// below the string "undefined", which no gate matches — and every RED case would pass as a GREEN.
if (
  UNCONDITIONAL_NAME === undefined ||
  CONDITIONAL_NAME === undefined ||
  TOKEN_CLAIM === undefined ||
  COMPREHENSION_CLAIM === undefined
) {
  throw new Error(
    "check-banned-claims.test.ts: one of the four plant literals could not be selected from " +
      "BANNED_CLAIM_LITERALS. Every plant below would be the string 'undefined', which matches " +
      "nothing — the RED cases would pass as green while proving nothing at all.",
  );
}

const CONFORMANCE_VERB = CONFORMANCE_VERB_MARKERS[0];

/** The exact shape of the D-44 draft claim: the name, with a conformance verb beside it. */
const NAME_PLANT = `The grugops kit ${CONFORMANCE_VERB}s to ${UNCONDITIONAL_NAME.literal}.`;
/** Two banned literals adjacent on ONE line — the adjacency case. */
const ADJACENT_PLANT = `The kit ${CONFORMANCE_VERB}s to ${UNCONDITIONAL_NAME.literal} ${CONDITIONAL_NAME.literal}.`;
/** The discipline's bare name with NO conformance verb — legal, and the conditional arm's control. */
const BARE_NAME_PLANT = `Writers of ${CONDITIONAL_NAME.literal} choose one word per meaning.`;
const TOKEN_PLANT = `The voice is a ${TOKEN_CLAIM.literal} applied to memory.`;
const COMPREHENSION_PLANT = `The profile ${COMPREHENSION_CLAIM.literal} for the model.`;

// ── The mirror ────────────────────────────────────────────────────────────────────────────────

const CLEAN = [
  "# A document",
  "",
  "The Orchestrator decomposes each request into subtasks and enqueues them over the shared queue.",
  "The shared verified context is the sole memory between roles.",
  "",
].join("\n");

const DEFAULT_ROOT_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "README.md",
];
const DEFAULT_EXAMPLES = [
  "01-greenfield.md",
  "02-brownfield.md",
  "03-ticket.md",
  "04-sprint.md",
  "05-release.md",
];
const CHANGELOG = "CHANGELOG.md";
const KIT_README = "agent-factory/README.md";
const PROFILE = BANNED_CLAIM_EXEMPT_REGION.file;

/**
 * The profile document the mirror ships, with its exemption region.
 *
 * `regionBody` is what sits under the exempt heading; `preamble` is what sits ABOVE it, outside the
 * region. The two are separate parameters precisely so the region-scoped cases can put the SAME
 * sentence on each side of the heading and watch the gate discriminate.
 */
function profileDoc(opts: {
  preamble?: string;
  regionBody?: string;
  headings?: number;
  trailingSection?: boolean;
} = {}): string {
  const heading = BANNED_CLAIM_EXEMPT_REGION.heading;
  const out = [
    "# grugops writing profile",
    "",
    "## The rules",
    "",
    opts.preamble ?? "Every rule carries a stable id.",
    "",
  ];
  const count = opts.headings ?? 1;
  for (let n = 0; n < count; n++) {
    out.push(heading, "", opts.regionBody ?? "This profile is an independent work.", "");
  }
  if (opts.trailingSection === true) {
    out.push("## After the region", "", "Text below the region is scanned again.", "");
  }
  return out.join("\n");
}

type MirrorSpec = {
  rootDocs?: string[];
  examples?: string[];
  /** Extra kit markdown files beyond README.md and the profile. Defaults to the derived filler set. */
  kitFillers?: string[];
  /** Options passed to profileDoc(). */
  profile?: Parameters<typeof profileDoc>[0];
  /** Omit the profile document entirely — the vanished-exemption-file case. */
  omitProfile?: boolean;
  /** Per-path content overrides, keyed by the same repo-relative path the gate reports. */
  plant?: Record<string, string>;
};

// The filler count is DERIVED FROM THE GATE'S OWN PIN, never typed. The union is
// (2 kit named + N fillers) + 10 public documents − 1 overlap, so N = COUNT − 11. A change to the
// pin moves this automatically, and a mirror that no longer reaches the pin fails the pin case
// rather than quietly testing a different corpus.
const KIT_NAMED = 2; // agent-factory/README.md + the profile
const PUBLIC_DOCS = 10;
const OVERLAP = 1; // agent-factory/README.md is in both parts
const FILLER_COUNT = BANNED_CLAIM_SCAN_COUNT - (KIT_NAMED + PUBLIC_DOCS - OVERLAP);

function defaultFillers(): string[] {
  return Array.from(
    { length: FILLER_COUNT },
    (_, i) => `agent-factory/workflows/${String(i).padStart(3, "0")}-filler.md`,
  );
}

function makeMirror(prefix: string, spec: MirrorSpec = {}): string {
  const mirror = freshTmp(prefix);
  const rootDocs = spec.rootDocs ?? DEFAULT_ROOT_DOCS;
  const examples = spec.examples ?? DEFAULT_EXAMPLES;
  const fillers = spec.kitFillers ?? defaultFillers();
  const plant = spec.plant ?? {};

  const write = (rel: string, fallback: string = CLEAN): void => {
    const dst = join(mirror, rel);
    mkdirSync(join(dst, ".."), { recursive: true });
    writeFileSync(dst, plant[rel] ?? fallback, "utf8");
  };

  for (const f of rootDocs) write(f);
  write(CHANGELOG);
  mkdirSync(join(mirror, "examples"), { recursive: true });
  for (const f of examples) write(`examples/${f}`);
  // The kit. agent-factory/ always exists so the walk has a directory to reach; whether it derives
  // any markdown is what the vacuity case varies.
  mkdirSync(join(mirror, "agent-factory"), { recursive: true });
  write(KIT_README);
  if (spec.omitProfile !== true) write(PROFILE, profileDoc(spec.profile));
  for (const f of fillers) write(f);
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** How many individual findings the run reported. Arithmetic over the rendered lines. */
function findingCount(stdout: string): number {
  return (stdout.match(/— banned [a-z-]+ literal /g) ?? []).length;
}

// ── The GREEN control ─────────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the clean mirror", () => {
  it("exits 0 with a measured PASS line naming the counts and the exemption region", () => {
    // THE LOAD-BEARING CASE. Without it the D-44 RED transcript proves nothing, because a gate that
    // always fails is trivially red. The exit code is asserted EXPLICITLY: spawnSync does not throw
    // on a non-zero exit, so a case that only checked stdout would pass against a gate that exits 1
    // every time.
    const { status, stdout } = runGate(makeMirror("gops-banned-clean-"));
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain(`${BANNED_CLAIM_SCAN_COUNT} document(s)`);
    // The PASS line carries the measurement, the part breakdown and the exemption with its reason.
    expect(stdout).toContain(
      `0 findings over ${BANNED_CLAIM_SCAN_COUNT}/${BANNED_CLAIM_SCAN_COUNT} elements`,
    );
    expect(stdout).toContain(`${BANNED_CLAIM_LITERALS.length} pinned literal(s)`);
    expect(stdout).toContain(BANNED_CLAIM_EXEMPT_REGION.heading);
    expect(stdout).toContain(BANNED_CLAIM_EXEMPT_REGION.reason);
    expect(stdout).toContain(
      `${BANNED_CLAIM_EXCLUDED.length} candidate literal(s) refused at admission`,
    );
  });
});

// ── The planted claims: the durable half of D-44 ──────────────────────────────────────────────

describe("check-banned-claims — the planted claims", () => {
  it("D-44 DURABLE FIXTURE: names a kit file carrying the conformance claim OUTSIDE the region", () => {
    // This is the case that survives the tree going green forever. The claim is planted in a kit
    // document with no relationship to the exemption, and the gate must name the file, the line and
    // the literal.
    const planted = "agent-factory/workflows/000-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-planted-", { plant: { [planted]: NAME_PLANT } }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/000-filler\.md:\d+:\d+/);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
    expect(stdout).toContain("Remedy: delete the claim");
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("names the claim planted in the profile's own PREAMBLE, above the exemption heading", () => {
    // The exemption is region-scoped, not file-scoped. A claim in the exempt FILE but outside the
    // exempt SECTION is still a finding — which is exactly the shape of the D-44 draft claim the
    // gate was landed against.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-preamble-", { profile: { preamble: NAME_PLANT } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(PROFILE);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
  });

  it("catches a token-economy claim and a comprehension claim in two different kit files", () => {
    // The three groups are asserted together, because a claim about one group says nothing about
    // the others: a gate that only ever ran group 1 would pass every case above.
    const a = "agent-factory/workflows/001-filler.md";
    const b = "agent-factory/workflows/002-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-groups-", {
        plant: { [a]: TOKEN_PLANT, [b]: COMPREHENSION_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(TOKEN_CLAIM.literal);
    expect(stdout).toContain(COMPREHENSION_CLAIM.literal);
    expect(findingCount(stdout)).toBe(2);
  });

  it("matches case-INSENSITIVELY, because a re-capitalised claim is the same claim", () => {
    const planted = "agent-factory/workflows/003-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-case-", {
        plant: { [planted]: TOKEN_PLANT.toUpperCase() },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/003-filler\.md:\d+:\d+/);
  });
});

// ── Adjacency: the hit count is arithmetic ────────────────────────────────────────────────────

describe("check-banned-claims — adjacency", () => {
  it("TWO adjacent banned literals on ONE line produce TWO findings, not one merged finding", () => {
    // The count is arithmetic over what was read. A per-line boolean would report this line once
    // and under-count every future multi-claim sentence — and the D-44 draft claim itself was
    // exactly this shape.
    const planted = "agent-factory/workflows/004-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-adjacent-", { plant: { [planted]: ADJACENT_PLANT } }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(2);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
    expect(stdout).toContain(CONDITIONAL_NAME.literal);
    // Two DIFFERENT columns on the same line — the second finding is not a duplicate report.
    const cols = [...stdout.matchAll(/004-filler\.md:(\d+):(\d+)/g)].map((m) => [
      m[1],
      m[2],
    ]);
    expect(cols.length).toBe(2);
    expect(cols[0][0]).toBe(cols[1][0]); // same line
    expect(cols[0][1]).not.toBe(cols[1][1]); // different column
  });

  it("the SAME literal twice on one line produces two findings", () => {
    const planted = "agent-factory/workflows/005-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-repeat-", {
        plant: { [planted]: `${TOKEN_PLANT} ${TOKEN_PLANT}` },
      }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(2);
  });
});

// ── The conditional arm ───────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the one conditional literal", () => {
  it("does NOT fire on the discipline's bare name with no conformance verb on the line", () => {
    // THE ADMISSION TEST, ASSERTED. Banning the bare name would make it impossible to write a
    // correct sentence that names the discipline, and going green would then require deleting
    // correct text. This case is what keeps the conditional arm conditional.
    const planted = "agent-factory/workflows/006-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-bare-", { plant: { [planted]: BARE_NAME_PLANT } }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("DOES fire on the same name once a conformance verb joins it on that line", () => {
    // The discriminating half. Without it the case above would pass against a gate whose
    // conditional arm never matches anything at all.
    const planted = "agent-factory/workflows/006-filler.md";
    const { status, stdout } = runGate(
      makeMirror("gops-banned-bare-verb-", {
        plant: {
          [planted]: `${BARE_NAME_PLANT.slice(0, -1)}, and the kit ${CONFORMANCE_VERB}s to it.`,
        },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(CONDITIONAL_NAME.literal);
  });
});

// ── The exemption region ──────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the one named exemption region", () => {
  it("exits 0 when the SAME sentence appears ONLY inside the exemption region", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-exempt-", { profile: { regionBody: NAME_PLANT } }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("PAIRED PLANT: the region is scoped, so the same sentence above the heading IS reported", () => {
    // Asserting only exit 0 on a region-only mirror would pass even if the whole scan were dead — a
    // gate that reads nothing also exits 0. The paired plant is what makes the exemption
    // DISCRIMINATING: the identical sentence sits on both sides of one heading in one file, and the
    // gate must report exactly the one above it.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-paired-", {
        profile: { preamble: NAME_PLANT, regionBody: NAME_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(findingCount(stdout)).toBe(1);
  });

  it("the region ENDS at the next same-level heading — text below it is scanned again", () => {
    // A region that ran to end-of-file would exempt everything after the disclaimer, which is the
    // quiet way a one-section exemption becomes a whole-file one.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-region-end-", {
        profile: { trailingSection: true },
        plant: {
          [PROFILE]: profileDoc({ trailingSection: true }).replace(
            "Text below the region is scanned again.",
            NAME_PLANT,
          ),
        },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(PROFILE);
    expect(stdout).toContain(UNCONDITIONAL_NAME.literal);
  });

  it("FAILS on a DUPLICATED exemption heading — the hole cannot be widened by adding a second", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-dup-region-", { profile: { headings: 2 } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("occurs 2 time(s)");
    expect(stdout).toContain("DUPLICATED region widens");
  });

  it("FAILS on a MISSING exemption heading", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-no-region-", { profile: { headings: 0 } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("occurs 0 time(s)");
  });

  it("FAILS on an EMPTY exemption region — a heading with no disclaimer beneath it", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-empty-region-", { profile: { regionBody: "" } }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain("is EMPTY");
  });

  it("FAILS BY NAME when the exemption DOCUMENT is gone, not merely one document short", () => {
    // The refusal used to live inside the scan loop, where it could only fire while the file was
    // still a member of the scan — so deleting the file skipped every one of its refusals and the
    // only survivor was the aggregate pin, which never says the disclaimer is gone.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-no-profile-", { omitProfile: true }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(PROFILE);
    expect(stdout).toContain("does not exist at");
    // A stack trace is not a verdict.
    expect(stdout).not.toMatch(/at Object\.|node:internal|ENOENT/);
  });
});

// ── Vacuity and the two-sided pin ─────────────────────────────────────────────────────────────

describe("check-banned-claims — vacuity is refused by name, per part, before the pin", () => {
  it("refuses a publicDocs part that derives ZERO members, by its own name", () => {
    // BOTH parts are asserted, because a floor proven on one says nothing about the other — and the
    // floor is per-part precisely so one part emptying out cannot hide behind the other's members.
    const mirror = makeMirror("gops-banned-vacuous-pub-");
    for (const f of [...DEFAULT_ROOT_DOCS, CHANGELOG])
      rmSync(join(mirror, f), { force: true });
    rmSync(join(mirror, "examples"), { recursive: true, force: true });
    rmSync(join(mirror, KIT_README), { force: true });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(
      'the "publicDocs" part of the banned-claim scan set derived ZERO members',
    );
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("refuses a TRULY empty kit part by name, and the floor is printed BEFORE the pin", () => {
    const mirror = makeMirror("gops-banned-vacuous2-", {
      kitFillers: [],
      omitProfile: true,
    });
    rmSync(join(mirror, KIT_README), { force: true });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(
      'the "kit" part of the banned-claim scan set derived ZERO members',
    );
    expect(stdout).toContain("a vacuous scan set");
    // Ordering: the per-part floor is consulted BEFORE the aggregate pin, so a reader meets the
    // reason before the arithmetic.
    const floorAt = stdout.indexOf('the "kit" part');
    const pinAt = stdout.indexOf("banned-claim scan set derived ");
    expect(floorAt).toBeGreaterThanOrEqual(0);
    expect(pinAt).toBeGreaterThan(floorAt);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("fails the two-sided pin when the corpus is SHORT BY ONE, naming both numbers", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-banned-short-", {
        kitFillers: defaultFillers().slice(0, FILLER_COUNT - 1),
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT - 1} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
    expect(stdout).toContain("BANNED_CLAIM_SCAN_COUNT");
    expect(stdout).toContain("moving the pin is how you acknowledge that it did");
  });

  it("fails the two-sided pin when a BRAND-NEW kit document appears, proving membership self-derives", () => {
    // The planted file's name appears in no list anywhere in this repository. If kit membership
    // were hand-listed, this file would be invisible.
    const { status, stdout } = runGate(
      makeMirror("gops-banned-grew-", {
        kitFillers: [
          ...defaultFillers(),
          "agent-factory/checklists/99-brand-new.md",
        ],
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `derived ${BANNED_CLAIM_SCAN_COUNT + 1} document(s), expected exactly ${BANNED_CLAIM_SCAN_COUNT}`,
    );
  });
});

// ── The live tree ─────────────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the derived pin against the live tree", () => {
  it("derives exactly BANNED_CLAIM_SCAN_COUNT documents, both directions", () => {
    const live = bannedClaimScan();
    expect(live.length).toBe(BANNED_CLAIM_SCAN_COUNT);
    expect(live.length).not.toBe(BANNED_CLAIM_SCAN_COUNT - 1);
    expect(live.length).not.toBe(BANNED_CLAIM_SCAN_COUNT + 1);
  });

  it("both parts are non-empty and the overlap arithmetic is the one the PASS line reports", () => {
    expect(BANNED_CLAIM_SCAN_PARTS.map((p) => p.name)).toEqual([
      "kit",
      "publicDocs",
    ]);
    for (const part of BANNED_CLAIM_SCAN_PARTS) {
      expect(part.members.length).toBeGreaterThan(0);
    }
    const summed = BANNED_CLAIM_SCAN_PARTS.reduce(
      (n, p) => n + p.members.length,
      0,
    );
    expect(summed - bannedClaimScanOverlap()).toBe(BANNED_CLAIM_SCAN_COUNT);
  });

  it("the derivation never reaches an excluded location, so this gate cannot scan itself", () => {
    // The self-exclusion note in the module header, asserted rather than remembered: the authority
    // contains every literal it defines, so it would fail its own check.
    for (const member of bannedClaimScan()) {
      for (const excluded of BANNED_CLAIM_EXCLUDED_LOCATIONS) {
        expect(member.startsWith(excluded)).toBe(false);
      }
    }
  });

  it("the live tree is GREEN and its PASS line reports the numbers this file derives", () => {
    // The gate's own committed .js against the real tree, with no CHECK_ROOT override. This is the
    // GREEN half of the D-44 transition, re-measured on every run rather than quoted from a commit.
    const r = spawnSync("node", [GATE_JS], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.stdout).toContain(
      `0 findings over ${BANNED_CLAIM_SCAN_COUNT}/${BANNED_CLAIM_SCAN_COUNT} elements`,
    );
  });
});

// ── The list itself ───────────────────────────────────────────────────────────────────────────

describe("check-banned-claims — the one list, frozen", () => {
  it("CONTROL: every literal is non-empty, lowercase-comparable and belongs to a declared group", () => {
    // A blank or whitespace literal would match every line of every document, turning the gate into
    // a machine that reports the whole corpus — and a reviewer would read the flood as a bug in the
    // corpus rather than in the list.
    for (const m of BANNED_CLAIM_LITERALS) {
      expect(m.literal.trim().length).toBeGreaterThan(2);
      expect(["standard-name", "token-economy", "comprehension"]).toContain(
        m.group,
      );
    }
    expect(new Set(BANNED_CLAIM_LITERALS.map((m) => m.literal)).size).toBe(
      BANNED_CLAIM_LITERALS.length,
    );
    // Exactly one conditional member. A second would need its own recorded reason, and a
    // conditional member added silently is how an unconditional prohibition quietly becomes a
    // conditional one.
    expect(
      BANNED_CLAIM_LITERALS.filter((m) => m.requiresOnSameLine !== undefined)
        .length,
    ).toBe(1);
    // All three groups are populated. A group that emptied out would leave a prohibition LANG-04
    // names with no literal behind it, while the PASS line still counted three groups.
    for (const g of ["standard-name", "token-economy", "comprehension"]) {
      expect(BANNED_CLAIM_LITERALS.some((m) => m.group === g)).toBe(true);
    }
  });

  it("the admission log records every refused candidate with a reason", () => {
    expect(BANNED_CLAIM_EXCLUDED.length).toBeGreaterThan(0);
    for (const e of BANNED_CLAIM_EXCLUDED) {
      expect(e.candidate.trim()).not.toBe("");
      expect(e.reason.trim().length).toBeGreaterThan(40);
    }
  });
});
