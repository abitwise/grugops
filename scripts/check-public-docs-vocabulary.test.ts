// check-public-docs-vocabulary.test.ts — the hermetic harness for the AUDIT-02 drift guard.
//
// WHAT THIS FILE IS FOR, STATED PLAINLY. scripts/check-public-docs-vocabulary.js exits 1 against the
// tree at HEAD, and that RED is plan 28-01's D-24 acceptance evidence. But a RED verdict proves
// nothing on its own: a gate that ALWAYS fails is trivially red. These cases are what turn that
// verdict into a MEASUREMENT OF THE TREE — the same committed .js exits 0 on a clean mirror, exits 1
// on each planted shape, and honours its one named exemption.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a safety/trace guard; the acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. So every behavioural case here drives the COMMITTED .js via
// spawnSync against a hermetic CHECK_ROOT mirror under the OS temp dir — never the .ts, and never
// the real tree. Nothing is ever written into the committed tree.
//
// WHY THE MIRRORS ARE SYNTHESIZED RATHER THAN COPIED. check-kit-refs.test.ts builds its mirror by
// copying the real SCAN paths, because that tree is already rewired to zero hits so the copy is a
// clean baseline. That does not work here: the real public documents are the very drift this guard
// measures, so a copied mirror would be the RED case, not the baseline. The builder below therefore
// synthesizes a document set with the same SHAPE the derivation expects — enough root markdown
// files, an examples/ directory, and the kit README — and writes innocuous prose into it. It
// restates no scan list: the shape is asserted against the gate's own exported
// PUBLIC_DOCS_SCAN_COUNT, so a mirror that drifts out of shape fails the pin case rather than
// silently testing something else.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-public-docs-vocabulary.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PUBLIC_DOCS_SCAN_COUNT,
  PUBLIC_DOCS_EXEMPT,
  PUBLIC_DOCS_SCAN_PARTS,
  publicDocsScan,
  grepSubstringInsensitive,
} from "./check-public-docs-vocabulary.js";
import {
  RETIRED_PATH_FORMS,
  RETIRED_PROSE_FORMS,
} from "./dead-vocabulary.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-public-docs-vocabulary.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Innocuous prose. It must stay free of every retired literal — a mirror whose "clean" baseline is
// not actually clean would make the GREEN case a false green, which is the exact failure class this
// file exists to rule out.
const CLEAN = [
  "# A document",
  "",
  "The Orchestrator decomposes each request into subtasks and enqueues them over the shared queue.",
  "The shared verified context is the sole memory between roles.",
  "",
].join("\n");

// The mirror's default shape. FOUR non-exempt root markdown files + the exempt CHANGELOG.md + FIVE
// examples + the kit README = the ten documents the derivation is pinned at.
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

type MirrorSpec = {
  // Root markdown file names (excluding CHANGELOG.md, which is written separately so the exemption
  // cases can address it by itself). Defaults to DEFAULT_ROOT_DOCS.
  rootDocs?: string[];
  // Example file names under examples/. Defaults to DEFAULT_EXAMPLES. An empty array creates the
  // directory with no files in it — the vacuity case.
  examples?: string[];
  // Per-path content overrides, keyed by the same repo-relative path the gate reports.
  plant?: Record<string, string>;
};

function makeMirror(prefix: string, spec: MirrorSpec = {}): string {
  const mirror = freshTmp(prefix);
  const rootDocs = spec.rootDocs ?? DEFAULT_ROOT_DOCS;
  const examples = spec.examples ?? DEFAULT_EXAMPLES;
  const plant = spec.plant ?? {};

  const write = (rel: string): void => {
    const dst = join(mirror, rel);
    mkdirSync(join(dst, ".."), { recursive: true });
    writeFileSync(dst, plant[rel] ?? CLEAN, "utf8");
  };

  for (const f of rootDocs) write(f);
  write(CHANGELOG);
  // Create examples/ even when it holds nothing, so the vacuity case exercises "the directory is
  // there and derives no members" rather than "the directory is absent".
  mkdirSync(join(mirror, "examples"), { recursive: true });
  for (const f of examples) write(`examples/${f}`);
  write(KIT_README);
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

// One hit of each retired form, taken from the authority rather than retyped. Retyping a literal
// here would be a fourth copy of the list living in the file that polices the third.
const PATH_PLANT = `See \`${RETIRED_PATH_FORMS[0]}product-handoff.md\` for the details.`;
const PROSE_PLANT = `The role emits a ${RETIRED_PROSE_FORMS[0]} for the next role to read.`;

describe("check-public-docs-vocabulary — the clean mirror", () => {
  it("exits 0 with a PASS line on a mirror carrying zero retired vocabulary", () => {
    // THE LOAD-BEARING CASE. Without it the D-24 RED transcript proves nothing, because a gate that
    // always fails is trivially red. Asserting the exit code EXPLICITLY (not merely the absence of a
    // throw) is the point: spawnSync does not throw on a non-zero exit, so a case that only checked
    // for stdout text would pass against a gate that exits 1 every time.
    const { status, stdout } = runGate(makeMirror("gops-pubdocs-clean-"));
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain("  PASS  ");
    // The PASS line reports what it read, and the exemption is named inline in it.
    expect(stdout).toContain(`${PUBLIC_DOCS_SCAN_COUNT} public document(s)`);
    expect(stdout).toContain(PUBLIC_DOCS_EXEMPT[0]);
  });
});

describe("check-public-docs-vocabulary — the planted mirrors", () => {
  it("names a BRAND-NEW example file, proving examples/ membership self-derives", () => {
    // The planted file's name appears in NO list anywhere in this repository. If membership were
    // hand-listed rather than walked, this file would be invisible and the gate would report a
    // clean pass over it. The mirror keeps five examples so the derived total still equals the pin,
    // which isolates this case to the walk rather than mixing in a pin failure.
    const planted = "examples/99-brand-new-example.md";
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-newexample-", {
        examples: [
          "01-greenfield.md",
          "02-brownfield.md",
          "03-ticket.md",
          "04-sprint.md",
          "99-brand-new-example.md",
        ],
        plant: { [planted]: PATH_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/99-brand-new-example\.md:\d+:/);
    expect(stdout).toContain(RETIRED_PATH_FORMS[0]);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  it("names a BRAND-NEW root markdown file, proving root membership self-derives", () => {
    // Same argument on the other derived part: readdirSync sees a document nobody registered.
    const planted = "BRAND-NEW-DOC.md";
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-newroot-", {
        rootDocs: ["AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md", planted],
        plant: { [planted]: PROSE_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/BRAND-NEW-DOC\.md:\d+:/);
    expect(stdout).toContain(RETIRED_PROSE_FORMS[0]);
  });

  it("matches a prose form case-INSENSITIVELY, because a re-capitalised retired phrase is the same phrase", () => {
    const planted = "BRAND-NEW-DOC.md";
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-case-", {
        rootDocs: ["AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md", planted],
        plant: { [planted]: PROSE_PLANT.toUpperCase() },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/BRAND-NEW-DOC\.md:\d+:/);
  });

  it("fails the two-sided pin when a SIXTH public document appears, naming both numbers", () => {
    // The pin is REACHED at run time, not merely asserted in this test file. A new public document
    // is supposed to enter the scan by existing; the pin is how that entry becomes visible to a
    // reviewer instead of silently widening the guard's subject.
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-pin-", {
        rootDocs: [...DEFAULT_ROOT_DOCS, "SIXTH-DOC.md"],
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toContain(
      `derived ${PUBLIC_DOCS_SCAN_COUNT + 1} document(s), expected exactly ${PUBLIC_DOCS_SCAN_COUNT}`,
    );
    expect(stdout).toContain("PUBLIC_DOCS_SCAN_COUNT");
  });
});

describe("check-public-docs-vocabulary — the CHANGELOG.md exemption", () => {
  it("exits 0 when the ONLY planted hit is in the exempt CHANGELOG.md", () => {
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-exempt-", {
        plant: { [CHANGELOG]: PROSE_PLANT },
      }),
    );
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
  });

  it("PAIRED PLANT: names the non-exempt file and does NOT name CHANGELOG.md", () => {
    // Asserting only exit 0 on a CHANGELOG.md-only mirror would pass even if the whole grep were
    // dead — a gate that greps nothing also exits 0. The paired plant is what makes the exemption
    // DISCRIMINATING: the identical string sits in two files inside one mirror, and the gate must
    // report exactly one of them.
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-paired-", {
        plant: { [CHANGELOG]: PROSE_PLANT, "CONTRIBUTING.md": PROSE_PLANT },
      }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(/CONTRIBUTING\.md:\d+:/);
    expect(stdout).not.toMatch(/CHANGELOG\.md:\d+:/);
  });
});

describe("check-public-docs-vocabulary — vacuity is refused by name", () => {
  it("refuses an empty examples/ part instead of passing over zero files", () => {
    // A vacuous scan set passes every guard. The floor is per-part on purpose: kitReadme always
    // contributes one named literal, so a floor over the concatenated total could never be reached.
    const { status, stdout } = runGate(
      makeMirror("gops-pubdocs-vacuous-", { examples: [] }),
    );
    expect(status).toBe(1);
    expect(stdout).toMatch(
      /the "examples" part of the public-docs scan set derived ZERO members/,
    );
    expect(stdout).toContain("a vacuous scan set");
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });

  // ── 28-REVIEW WR-01: an absent kitReadme is REPORTED, never a Node stack trace. ──────────────────
  //
  // RED AGAINST THE PRE-FIX BUILD. The kitReadme part was the bare literal `[KIT_README]` and
  // grepSubstring calls readText() unguarded, so deleting agent-factory/README.md made the gate die
  // with `Error: ENOENT … at readText (check-public-docs-vocabulary.js:75)` and a full Node stack.
  // That is against this module's own throw-versus-report split, and it was the ONLY path by which
  // this gate could notice the file was gone — the per-part vacuity floor can structurally never
  // fire for a one-element literal.
  it("REPORTS a missing agent-factory/README.md by name rather than crashing with ENOENT", () => {
    const mirror = makeMirror("gops-pubdocs-nokit-");
    rmSync(join(mirror, KIT_README), { force: true });
    const { status, stdout } = runGate(mirror);
    expect(status).toBe(1);
    expect(stdout).toContain(KIT_README);
    expect(stdout).toMatch(/refusing to report a verdict/);
    // A stack trace is not a verdict. The sibling assertion in check-audit-register.test.ts:371.
    expect(stdout).not.toMatch(/at Object\.|node:internal|ENOENT/);
    // And the per-part vacuity floor is now REACHABLE for this part — it fires by name.
    expect(stdout).toMatch(
      /the "kitReadme" part of the public-docs scan set derived ZERO members/,
    );
  });
});

describe("check-public-docs-vocabulary — the derived pin and the D-10 control", () => {
  it("the live tree derives exactly PUBLIC_DOCS_SCAN_COUNT documents, both directions", () => {
    const live = publicDocsScan();
    expect(live.length).toBe(PUBLIC_DOCS_SCAN_COUNT);
    expect(live.length).not.toBe(PUBLIC_DOCS_SCAN_COUNT - 1);
    expect(live.length).not.toBe(PUBLIC_DOCS_SCAN_COUNT + 1);
  });

  it("the scan set is the concatenation of its three named parts, none empty", () => {
    // Partition the composition by the SAME parts it was built from rather than restating a
    // directory literal. A claim about one part says nothing about the others, so every part is
    // asserted — a widening that swapped one part for another would hold the total at the pin.
    expect(PUBLIC_DOCS_SCAN_PARTS.map((p) => p.name)).toEqual([
      "root",
      "examples",
      "kitReadme",
    ]);
    for (const part of PUBLIC_DOCS_SCAN_PARTS) {
      expect(part.members.length).toBeGreaterThan(0);
    }
    expect(
      PUBLIC_DOCS_SCAN_PARTS.reduce((n, p) => n + p.members.length, 0),
    ).toBe(PUBLIC_DOCS_SCAN_COUNT);
    expect(PUBLIC_DOCS_EXEMPT).toEqual(["CHANGELOG.md"]);
    // The self-exclusion note in dead-vocabulary.ts's header, asserted rather than remembered: the
    // authority module contains every literal it defines, so it would fail its own check. The
    // derivation must never reach scripts/.
    for (const member of publicDocsScan()) {
      expect(member.startsWith("scripts/")).toBe(false);
    }
  });

  it("D-10 CONTROL: the retired-vocabulary arrays are EXACTLY their current members", () => {
    // THIS CASE EXISTS SO THAT BANNING A STILL-CORRECT WORD IS A RED TEST RATHER THAN A JUDGEMENT
    // CALL. The verb describing what the Orchestrator does with work — "routes" — is still correct
    // v2.0 English, and a token guard banning it would fail red on the orchestrator adapter's own
    // description, on orchestrator.md's `### Routing matrix` heading, and on CLAUDE.md's statement
    // about how Claude Code decides to delegate to a subagent, which is a PLATFORM fact and not a
    // grugops claim at all. The same trap already caught single-window prose once.
    //
    // The drift that word names is ONE SPECIFIC CLAIM — a linear BA→…→release pipeline that v2.0
    // replaced with decompose→enqueue over a shared queue — and the correct place to hold a claim is
    // a row in docs/audit/28-claim-registry.md, never a grep. A grep cannot tell the true sentence
    // from the false one, because both contain the same word.
    //
    // Adding ANY token to either array fails this case. That is the mechanism; the header comment in
    // dead-vocabulary.ts is only the explanation.
    expect(RETIRED_PATH_FORMS).toEqual(["agent-factory/handoffs/"]);
    expect(RETIRED_PROSE_FORMS).toEqual([
      "handoff packet",
      "the handoff is the only memory",
    ]);
  });

  // ── 28-REVIEW WR-06: the case invariant is enforced on the CONSUMER, not assumed on the data. ────
  //
  // RED AGAINST THE PRE-FIX BUILD. grepSubstringInsensitive lowercased the SUBJECT and compared it
  // against the needle AS GIVEN. That is only correct while every member of RETIRED_PROSE_FORMS
  // happens to be lowercase — an invariant documented in a comment in dead-vocabulary.ts and
  // enforced nowhere. Adding `"Handoff Packet"` to that array would have made this gate match ZERO
  // lines, forever, silently. The D-10 freeze above is a guard on the DATA, and the data freeze is
  // exactly what an editor updates when adding a literal.
  //
  // The case is written against the CONSUMER with a synthetic mixed-case needle, because exercising
  // it through the array would mean mutating the very list the D-10 control freezes.
  it("grepSubstringInsensitive lowercases the NEEDLE too, so a mixed-case list entry still matches", () => {
    const scan = ["README.md"];
    const lower = grepSubstringInsensitive(scan, "grugops");
    // Non-vacuity: the lowercase needle must actually find something, or the comparison below is
    // between two empty arrays and proves nothing.
    expect(lower.length).toBeGreaterThan(0);
    // The hazard, exactly: a needle whose case differs from the list's convention. Pre-fix this
    // returned []. A guard whose enforcement silently becomes a no-op is worse than no guard.
    expect(grepSubstringInsensitive(scan, "GRUGOPS")).toEqual(lower);
    expect(grepSubstringInsensitive(scan, "GrUgOpS")).toEqual(lower);
  });
});
