// check-claim-anchors.test.ts — the D-16 bijection + verbatim-at-anchor gate.
//
// Every case spawns the COMMITTED .js against a hermetic mirror under the OS temp dir via
// CHECK_ROOT, the pattern check-public-docs-vocabulary.test.ts and check-audit-register.test.ts
// both use. The green-baseline case was written and confirmed passing FIRST, against a
// deliberately permissive stub that checked nothing — that is what makes the refusal cases below a
// MEASUREMENT of the gate rather than a report that the module did not exist yet (the 28-03
// lesson, recorded in that plan's summary).

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import {
  REGISTRY_PATH,
  readRegistry,
  scanAnchoredDocument,
  anchoredBlockAt,
} from "./audit-model.js";
import { spawnGrantScan } from "./kit-model.js";
// (Plan 29-51) The exemption region's OWN declaration and OWN locator, asked rather than restated.
// A second spelling of "which lines are the disclaimer" in this file would be the duplicate-authority
// defect arriving inside the plan whose whole subject is removing one.
import {
  BANNED_CLAIM_EXEMPT_REGION,
  locateExemptRegion,
} from "./check-banned-claims.js";

const REPO = join(import.meta.dirname, "..");
const GATE = join(REPO, "scripts", "check-claim-anchors.js");

function run(root: string): { status: number; out: string } {
  const r = spawnSync(process.execPath, [GATE], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: root },
  });
  return { status: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}

function freshTmp(): string {
  return mkdtempSync(join(tmpdir(), "grugops-claim-anchors-"));
}

function writeAt(root: string, rel: string, body: string): void {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
}

const FENCE = "```";

interface ClaimSpec {
  id: string;
  file: string;
  line?: string;
  kind?: string;
  dependsOn?: string;
  status?: string;
  mechanism?: string;
  disposition?: string;
  findingId?: string;
  targetPhase?: string;
  text: string;
}

function registry(...claims: ClaimSpec[]): string {
  const blocks = claims.map((c) => {
    const meta = [
      `### ${c.id}`,
      "",
      `- file: ${c.file}`,
      `- line: ${c.line ?? "2"}`,
      `- kind: ${c.kind ?? "architecture"}`,
      `- depends_on: ${c.dependsOn ?? "—"}`,
      `- status: ${c.status ?? "true"}`,
      `- mechanism: ${c.mechanism ?? "Measured against the fixture tree."}`,
    ];
    if (c.disposition !== undefined) meta.push(`- disposition: ${c.disposition}`);
    if (c.findingId !== undefined) meta.push(`- finding_id: ${c.findingId}`);
    if (c.targetPhase !== undefined) meta.push(`- target_phase: ${c.targetPhase}`);
    return [...meta, "", FENCE, c.text, FENCE, ""].join("\n");
  });
  return ["# Fixture claim registry", "", "## Claims", "", ...blocks].join("\n");
}

/**
 * A mirror carrying one safety claim per floor, so D-14's two-sided completeness is satisfied by
 * the BASELINE and every case below is measuring the thing it names rather than tripping over an
 * unrelated floor-coverage failure.
 */
const FLOORS = "autonomy, test_integrity, production_requires_human_confirmation, protected_branch_merge";

function baseline(): { root: string; docBody: string } {
  const root = freshTmp();
  const docBody = [
    "# Fixture",
    "",
    "<!-- claim: C-28-001 -->",
    "Humans always hold merge and deploy.",
    "",
    "<!-- claim: C-28-002 -->",
    "The installer never overwrites your content.",
    "and it removes only what it added.",
    "",
  ].join("\n");
  writeAt(root, "PUBLIC.md", docBody);
  writeAt(
    root,
    REGISTRY_PATH,
    registry(
      {
        id: "C-28-001",
        file: "PUBLIC.md",
        line: "4",
        kind: "safety",
        dependsOn: FLOORS,
        text: "Humans always hold merge and deploy.",
      },
      {
        id: "C-28-002",
        file: "PUBLIC.md",
        line: "7-8",
        text: "The installer never overwrites your content.\nand it removes only what it added.",
      },
    ),
  );
  return { root, docBody };
}

describe("check-claim-anchors: the green baseline", () => {
  it("exits 0 on a well-formed mirror and names the counts it read", () => {
    const { root } = baseline();
    const r = run(root);
    expect(r.status).toBe(0);
    expect(r.out).toMatch(/ALL CHECKS PASSED/);
    // The PASS line must state what was actually done, never a check that was not performed.
    expect(r.out).toMatch(/2 registry row\(s\)/);
    expect(r.out).toMatch(/2 verbatim comparison\(s\)/);
  });
});

describe("check-claim-anchors: the bijection, both directions", () => {
  it("refuses an anchor with no registry row, naming the id and the file", () => {
    const { root, docBody } = baseline();
    writeAt(root, "PUBLIC.md", `${docBody}\n<!-- claim: C-28-009 -->\nAn unregistered sentence.\n`);
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/C-28-009/);
    expect(r.out).toMatch(/PUBLIC\.md/);
    expect(r.out).toMatch(/unexpected/);
  });

  it("refuses a registry row with no anchor, naming the id and the file", () => {
    const { root } = baseline();
    // The row is registered; the anchor is absent from the document.
    writeAt(root, "PUBLIC.md", ["# Fixture", "", "Humans always hold merge and deploy.", ""].join("\n"));
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/C-28-001/);
    expect(r.out).toMatch(/PUBLIC\.md/);
    expect(r.out).toMatch(/missing/);
  });

  it("reports missing and unexpected ids in sorted id order, so two runs agree byte for byte", () => {
    const { root } = baseline();
    writeAt(
      root,
      "PUBLIC.md",
      ["# Fixture", "", "<!-- claim: C-28-009 -->", "x", "", "<!-- claim: C-28-003 -->", "y", ""].join("\n"),
    );
    const a = run(root);
    const b = run(root);
    expect(a.out).toBe(b.out);
    const at = a.out.indexOf("C-28-003");
    const bt = a.out.indexOf("C-28-009");
    expect(at).toBeGreaterThan(-1);
    expect(bt).toBeGreaterThan(at);
  });
});

describe("check-claim-anchors: the verbatim comparison", () => {
  it("refuses a changed sentence and prints BOTH strings and BOTH byte lengths", () => {
    const { root } = baseline();
    writeAt(
      root,
      "PUBLIC.md",
      [
        "# Fixture",
        "",
        "<!-- claim: C-28-001 -->",
        "Humans usually hold merge and deploy.",
        "",
        "<!-- claim: C-28-002 -->",
        "The installer never overwrites your content.",
        "and it removes only what it added.",
        "",
      ].join("\n"),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    // Asserting exit 1 alone would pass on ANY failure — the message must carry the evidence.
    expect(r.out).toContain("Humans always hold merge and deploy.");
    expect(r.out).toContain("Humans usually hold merge and deploy.");
    expect(r.out).toMatch(/36 byte/);
    expect(r.out).toMatch(/37 byte/);
  });

  it("refuses a whitespace-only divergence — the comparison is exact, never trimmed", () => {
    const { root } = baseline();
    writeAt(
      root,
      "PUBLIC.md",
      [
        "# Fixture",
        "",
        "<!-- claim: C-28-001 -->",
        "Humans always hold merge and deploy. ",
        "",
        "<!-- claim: C-28-002 -->",
        "The installer never overwrites your content.",
        "and it removes only what it added.",
        "",
      ].join("\n"),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/C-28-001/);
  });

  it("compares a multi-line claim across all of its lines", () => {
    const { root } = baseline();
    writeAt(
      root,
      "PUBLIC.md",
      [
        "# Fixture",
        "",
        "<!-- claim: C-28-001 -->",
        "Humans always hold merge and deploy.",
        "",
        "<!-- claim: C-28-002 -->",
        "The installer never overwrites your content.",
        "and it removes only what it ADDED.",
        "",
      ].join("\n"),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/C-28-002/);
  });
});

describe("check-claim-anchors: the adjacency edges (AUDIT-03 probe)", () => {
  it("parses two anchors on consecutive lines as two distinct anchors, the second claiming the line below IT", () => {
    const root = freshTmp();
    writeAt(
      root,
      "PUBLIC.md",
      ["# Fixture", "", "<!-- claim: C-28-001 -->", "<!-- claim: C-28-002 -->", "The shared claim line.", ""].join(
        "\n",
      ),
    );
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        // C-28-001's claim line is the line below IT, which is C-28-002's anchor. Registering that
        // literal text is the only way the first row could pass, and it is exactly what a reader
        // must not be able to do by accident — so this fixture registers the TRUE sentence and the
        // gate must report the first row as a mismatch while recognizing BOTH ids.
        { id: "C-28-001", file: "PUBLIC.md", line: "4", text: "The shared claim line." },
        { id: "C-28-002", file: "PUBLIC.md", line: "5", text: "The shared claim line." },
      ),
    );
    const r = run(root);
    // Both ids are RECOGNIZED — neither is reported as an unexpected or a missing anchor.
    expect(r.out).not.toMatch(/missing \[[^\]]*C-28-00[12]/);
    expect(r.out).not.toMatch(/unexpected \[[^\]]*C-28-00[12]/);
    // C-28-002's claim line is the line below the SECOND anchor and therefore matches.
    // C-28-001's is the second anchor line itself and therefore does not.
    expect(r.status).toBe(1);
    expect(r.out).toContain("<!-- claim: C-28-002 -->");
    expect(r.out).toMatch(/C-28-001/);
  });

  it("refuses an anchor on the last line of a file by name, rather than reading past the end", () => {
    const root = freshTmp();
    writeAt(root, "PUBLIC.md", ["# Fixture", "", "<!-- claim: C-28-001 -->"].join("\n"));
    writeAt(root, REGISTRY_PATH, registry({ id: "C-28-001", file: "PUBLIC.md", line: "4", text: "Anything." }));
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/last line|end of/i);
    expect(r.out).toMatch(/C-28-001/);
    expect(r.out).not.toMatch(/undefined/);
  });

  it("refuses a duplicate anchor id, naming the id and EVERY file carrying it", () => {
    const { root } = baseline();
    writeAt(root, "OTHER.md", ["# Other", "", "<!-- claim: C-28-001 -->", "Humans always hold merge and deploy.", ""].join("\n"));
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "OTHER.md", line: "4", text: "Humans always hold merge and deploy." },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/duplicate anchor id: C-28-001/);
    // The count and BOTH files, not merely the word "duplicate" — a message naming one file would
    // send a reader to fix half the problem.
    expect(r.out).toMatch(/anchored 2 times/);
    expect(r.out).toContain("PUBLIC.md");
    expect(r.out).toContain("OTHER.md");
  });

  it("refuses a malformed anchor id rather than silently ignoring the comment", () => {
    const { root, docBody } = baseline();
    writeAt(root, "PUBLIC.md", `${docBody}\n<!-- claim: CLM-001 -->\nA sentence.\n`);
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/CLM-001/);
    expect(r.out).toMatch(/canonical/i);
  });
});

describe("check-claim-anchors: the scan set is DERIVED, not hand-listed", () => {
  it("scans a fourth anchored document that exists only in the fixture registry, with no source edit", () => {
    const { root, docBody } = baseline();
    writeAt(root, "FOURTH.md", ["# Fourth", "", "<!-- claim: C-28-003 -->", "A fourth document's claim.", ""].join("\n"));
    writeAt(root, "PUBLIC.md", docBody);
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
        { id: "C-28-003", file: "FOURTH.md", line: "4", text: "A fourth document's claim." },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(0);
    // The fourth document entered the scan by being REGISTERED. If membership were hand-listed the
    // gate would not have looked at it and its anchor would be an unexpected one.
    expect(r.out).toContain("FOURTH.md");
  });

  // ── 28-REVIEW WR-08: an unanchorable row is PRESENCE-checked, not merely counted. ────────────────
  //
  // RED AGAINST THE PRE-FIX BUILD. `anchoredDocs()` filters to `.md`, and a non-markdown row was
  // exempt from ALL verification rather than only from the anchor bijection — a `plugin.json` row
  // whose verbatim text had been edited away passed green. The stated exclusion reason ("a JSON file
  // cannot carry an HTML comment") justifies dropping the ANCHOR requirement, not the VERBATIM one,
  // which needs no anchor at all.
  it("refuses an unanchorable row whose verbatim text is ABSENT from the file it names", () => {
    const { root } = baseline();
    writeAt(root, "plugin.json", '{\n  "description": "something else entirely"\n}\n');
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
        { id: "C-28-003", file: "plugin.json", line: "2", text: '  "description": "the text this row claims is there",' },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/C-28-003/);
    expect(r.out).toContain("plugin.json");
    expect(r.out).toMatch(/not present in the file/);
    // The message must state the asymmetry a reader needs: position cannot be checked, presence can.
    expect(r.out).toMatch(/POSITION-checked.*PRESENCE-checked/s);
  });

  it("PASSES an unanchorable row whose verbatim text IS present, and counts it as a comparison", () => {
    // The adjacency half. Without it the case above is consistent with a gate that reds on every
    // unanchorable row.
    const { root } = baseline();
    const verbatim = '  "description": "grugops — an agent factory.",';
    writeAt(root, "plugin.json", `{\n${verbatim}\n  "name": "grugops"\n}\n`);
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
        { id: "C-28-003", file: "plugin.json", line: "2", text: verbatim },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(0);
    // Three comparisons, not two: the unanchorable row was CHECKED rather than counted and skipped.
    expect(r.out).toMatch(/3 verbatim comparison\(s\)/);
    // And the PASS line no longer claims the row's freshness rests on the registry row alone.
    expect(r.out).toMatch(/PRESENCE-checked/);
  });

  it("refuses an unanchorable row naming a file that does not exist", () => {
    const { root } = baseline();
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
        { id: "C-28-003", file: "gone.json", line: "2", text: "anything" },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/gone\.json/);
    expect(r.out).toMatch(/does not exist/);
  });

  it("refuses a registry whose markdown rows are empty rather than passing over an empty intersection", () => {
    const root = freshTmp();
    writeAt(root, "plugin.json", "{}");
    writeAt(
      root,
      REGISTRY_PATH,
      registry({ id: "C-28-001", file: "plugin.json", line: "1", text: "Only an unanchorable row." }),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/no markdown|zero markdown/i);
  });
});

describe("check-claim-anchors: D-14 and D-17 completeness", () => {
  it("refuses a kind:safety row naming no floor", () => {
    const root = freshTmp();
    writeAt(root, "PUBLIC.md", ["# F", "", "<!-- claim: C-28-001 -->", "A safety sentence.", ""].join("\n"));
    writeAt(
      root,
      REGISTRY_PATH,
      registry({ id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: "—", text: "A safety sentence." }),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/C-28-001/);
    expect(r.out).toMatch(/depends_on|floor/i);
  });

  it("refuses a safety floor with no claim mapped to it, naming the floor", () => {
    const root = freshTmp();
    writeAt(root, "PUBLIC.md", ["# F", "", "<!-- claim: C-28-001 -->", "A safety sentence.", ""].join("\n"));
    writeAt(
      root,
      REGISTRY_PATH,
      registry({ id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: "autonomy", text: "A safety sentence." }),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/test_integrity/);
    expect(r.out).toMatch(/protected_branch_merge/);
  });

  it("refuses a blank mechanism — an unmeasured status is a verdict nobody reached", () => {
    const { root } = baseline();
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, mechanism: "—", text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/mechanism/);
    expect(r.out).toMatch(/C-28-001/);
  });

  it("refuses a non-true row carrying no disposition and no finding id", () => {
    const { root } = baseline();
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, status: "false", text: "Humans always hold merge and deploy." },
        { id: "C-28-002", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/disposition|finding/i);
  });

  it("refuses a claim id sequence with a gap", () => {
    const { root, docBody } = baseline();
    writeAt(root, "PUBLIC.md", docBody.replace("C-28-002", "C-28-004"));
    writeAt(
      root,
      REGISTRY_PATH,
      registry(
        { id: "C-28-001", file: "PUBLIC.md", line: "4", kind: "safety", dependsOn: FLOORS, text: "Humans always hold merge and deploy." },
        { id: "C-28-004", file: "PUBLIC.md", line: "7-8", text: "The installer never overwrites your content.\nand it removes only what it added." },
      ),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/contiguous|gap/i);
  });
});

describe("check-claim-anchors: the stripHtmlComments collision", () => {
  it("names no stripHtmlComments CALL SITE — the gate reads raw bytes", () => {
    const src = readFileSync(join(REPO, "scripts", "check-claim-anchors.ts"), "utf8");
    // The helper's NAME must appear (the header records the collision) but never as an invocation.
    expect(src).toContain("stripHtmlComments");
    const callSites = src
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .filter((l) => /stripHtmlComments\s*\(/.test(l));
    expect(callSites).toEqual([]);
  });

  it("keeps the three anchored documents out of spawnGrantScan() — the scan stripHtmlComments feeds", () => {
    const scan = spawnGrantScan();
    expect(scan.length).toBeGreaterThan(0);
    for (const doc of ["README.md", "AGENTS.md", "agent-factory/README.md"]) {
      expect(scan).not.toContain(doc);
      expect(scan.filter((s) => s.endsWith(`/${doc}`))).toEqual([]);
    }
  });
});

// ── 28-REVIEW WR-05: the entry-guard and root-override idioms are ONE shape across the set. ───────
//
// DERIVE THE SET, ASSERT ITS MEMBERS — never fix the one file the review happened to name and leave
// the next divergence to be found by the next review. The set is every scripts/ source that declares
// an `isEntry` guard, discovered by scanning rather than listed here, and its cardinality is pinned
// two-sided so a new gate joins the assertion by EXISTING.
describe("the standalone-gate idioms are uniform across scripts/", () => {
  function entryGuardSources(): { name: string; src: string }[] {
    const out: { name: string; src: string }[] = [];
    for (const name of readdirSync(join(REPO, "scripts")).sort()) {
      if (!name.endsWith(".ts") || name.endsWith(".test.ts")) continue;
      const src = readFileSync(join(REPO, "scripts", name), "utf8");
      if (/const isEntry =/.test(src)) out.push({ name, src });
    }
    return out;
  }

  it("every isEntry guard compares import.meta.url against pathToFileURL(argv[1])", () => {
    const sources = entryGuardSources();
    // Two-sided pin. A set that silently shrank would assert the property over fewer files than it
    // names; one that grew is a gate nobody reviewed.
    //
    // 7 → 8 (Phase 29 / plan 29-02): scripts/check-banned-claims.ts is the eighth standalone gate.
    // 8 → 9 (Phase 29 / plan 29-03): scripts/check-imperative-lexicon.ts is the ninth.
    // 9 → 10 (Phase 29 / plan 29-04): scripts/check-diff-disposition.ts is the tenth.
    // THE PIN MOVED BECAUSE THE SET GREW, AND THE SET GREW BY THE MECHANISM THIS BLOCK IS FOR — the
    // new gate joined the assertion by EXISTING, and the property assertion below passed for it on
    // the first run. Moving the pin is how that entry is acknowledged; it is never how a property
    // failure is cleared. If the `offenders` assertion had failed, the fix would have been the new
    // gate's entry guard, not this number.
    expect(sources.length).toBe(10);
    expect(sources.length).not.toBe(9);
    expect(sources.length).not.toBe(11);
    const offenders = sources
      .filter((s) => !/import\.meta\.url === pathToFileURL\(process\.argv\[1\]\)\.href/.test(s.src))
      .map((s) => `scripts/${s.name}`);
    expect(
      offenders,
      `an isEntry guard is using a weaker form than the sibling precedent. ` +
        `\`process.argv[1].endsWith("x.js")\` matches ANY path ending in that filename, and a ` +
        `hand-built \`file://\${argv[1]}\` does not match on Windows — which makes a direct run ` +
        `perform ZERO checks and exit 0, a fabricated green.`,
    ).toEqual([]);
  });

  it("every *_ROOT override uses the truthiness ternary, so an empty env var degrades to the repo root", () => {
    // `??` and the ternary differ on exactly one input: an empty string. With `??` an empty
    // CHECK_ROOT resolves every path against the process CWD instead of the repo root.
    const offenders: string[] = [];
    for (const { name, src } of entryGuardSources()) {
      src.split("\n").forEach((line, n) => {
        if (/process\.env\.(CHECK_ROOT|NUL_SCAN_ROOT)\s*\?\?/.test(line)) {
          offenders.push(`scripts/${name}:${n + 1}: ${line.trim()}`);
        }
      });
    }
    expect(offenders, `a root override is using \`??\` rather than the sibling ternary`).toEqual([]);
    // Non-vacuity: the scan must actually be reading files that DO declare a root override.
    const withRoot = entryGuardSources().filter((s) =>
      /process\.env\.(CHECK_ROOT|NUL_SCAN_ROOT)/.test(s.src),
    );
    expect(withRoot.length).toBeGreaterThan(4);
  });
});

describe("check-claim-anchors: the real tree", () => {
  it("exits 0 against the repository as committed by plan 28-04", () => {
    const r = spawnSync(process.execPath, [GATE], { encoding: "utf8" });
    expect(`${r.stdout}${r.stderr}`).toMatch(/ALL CHECKS PASSED/);
    expect(r.status).toBe(0);
  });

  it("is wired in CI as well as here — a gate that runs only from a test is borrowed, not wired", () => {
    const ci = readFileSync(join(REPO, ".github", "workflows", "ci.yml"), "utf8");
    expect(ci.split("check-claim-anchors.js").length - 1).toBe(1);
  });
});

// ── (PLAN 29-51) THE GATE DECLARES NO ANCHOR GRAMMAR, NO LINE ASSEMBLY AND NO BYTE COMPARISON. ───
//
// ASSERT THE ABSENCE, NOT THE CHANGE. A rewire is worth nothing if the declarations it replaced are
// still sitting in the file unused, or come back a year later — an unused second grammar is how two
// rules for one question survive the plan that unified them. So this case is DERIVED FROM THE
// MODULE'S OWN TEXT rather than from a list of names a later edit would not be added to.
//
// AND THE PROBES' OWN PREMISE IS ASSERTED FIRST. A probe that matches nothing anywhere passes this
// case vacuously and reports the absence of a defect it is incapable of finding. Each probe is
// therefore run against the AUTHORITY, where it must match, before it is run against the gate, where
// it must not.
describe("check-claim-anchors: the gate declares none of the moved constructs (plan 29-51)", () => {
  const PROBES: readonly { name: string; re: RegExp; why: string }[] = [
    {
      name: "an anchor-comment REGEX LITERAL",
      re: /\/\^<!--/,
      why: "a second anchor grammar over the same bytes — the LANG-07 defect this move exists to prevent",
    },
    {
      name: "a line assembly",
      re: /\.split\("\\n"\)/,
      why: "a second assembly of one document — the coordinate-shear axis every such defect in this phase came from",
    },
    {
      name: "a Buffer EQUALITY",
      re: /\.equals\(/,
      why: "a second byte comparison, which could drift away from the one the registry freeze is defined by",
    },
  ];

  function textOf(rel: string): string {
    return readFileSync(join(REPO, "scripts", rel), "utf8");
  }
  // Both the source AND the committed twin: a declaration can be reintroduced in either, and it is
  // the twin that actually runs.
  const GATE_FILES = ["check-claim-anchors.ts", "check-claim-anchors.js"];
  const AUTHORITY_FILES = ["audit-model.ts", "audit-model.js"];

  it("PREMISE: every probe finds its subject in the AUTHORITY, so none can pass vacuously", () => {
    for (const p of PROBES) {
      for (const f of AUTHORITY_FILES) {
        expect(p.re.test(textOf(f)), `${p.name} must be present in ${f}`).toBe(true);
      }
    }
  });

  it("the gate declares no anchor grammar, no line assembly and no byte equality of its own", () => {
    for (const p of PROBES) {
      for (const f of GATE_FILES) {
        const hits = textOf(f)
          .split("\n")
          .map((l, i) => ({ l, n: i + 1 }))
          .filter(({ l }) => p.re.test(l));
        expect(
          hits.map((h) => `${f}:${h.n}: ${h.l.trim()}`),
          `${f} must declare no ${p.name} — ${p.why}`,
        ).toEqual([]);
      }
    }
  });

  it("VACUITY GUARD: the gate still carries the unanchorable PRESENCE check, a DIFFERENT comparison", () => {
    // Without this, the case above would also pass on a gate that had stopped comparing bytes
    // altogether. The presence check is `Buffer.includes` over the WHOLE FILE, is deliberately
    // outside the authority's scope, and must survive the rewire untouched.
    for (const f of GATE_FILES) {
      const src = textOf(f);
      expect(src, `${f} keeps the unanchorable presence check`).toContain(
        'bytes.includes(Buffer.from(claim.verbatim, "utf8"))',
      );
    }
  });

  it("and it ASKS the authority instead — the four moved symbols are imported, not declared", () => {
    const src = textOf("check-claim-anchors.ts");
    const importBlock = src.slice(src.indexOf('from "./audit-model.js"') - 1200, src.indexOf('from "./audit-model.js"'));
    for (const sym of [
      "MARKDOWN_SUFFIX",
      "anchoredDocs",
      "scanAnchoredDocument",
      "anchoredBlockAt",
    ]) {
      expect(importBlock, `${sym} is imported from the authority`).toContain(sym);
      // and never declared here
      expect(
        new RegExp(`^\\s*(export\\s+)?(const|function)\\s+${sym}\\b`, "m").test(src),
        `${sym} is not re-declared in the gate`,
      ).toBe(false);
    }
  });
});

// ── (PLAN 29-51) THE EXEMPTION DOCUMENT'S ANCHORED-LINE SET, MEASURED HERE SO 29-52 INHERITS IT. ─
//
// Round-6 CR-01's stronger fix is to require every suppressed banned-claim occurrence to sit on a
// line inside a registry-anchored, byte-frozen block. That is an INTERSECTION of two index sets
// derived by two different modules over one document, and this repository's most expensive recurring
// defect is exactly that shape: two expressions assembling one document and then trading indices
// computed in different coordinate systems.
//
// So the intersection's PREMISE is asserted here, before the plan that spends it is written. The
// numbers themselves are published in 29-51-SUMMARY.md rather than pinned as literals — a line
// number in an assertion is the set-literal drift this repository has diagnosed twice.
describe("check-claim-anchors: the anchored-line set of the exemption document (plan 29-51)", () => {
  const DOC = BANNED_CLAIM_EXEMPT_REGION.file;
  const text = readFileSync(join(REPO, DOC), "utf8");
  const claims = readRegistry(REPO).claims.filter((c) => c.file === DOC);
  const scan = scanAnchoredDocument(text);

  it("the exemption document is registered, anchored, and every one of its blocks is frozen", () => {
    expect(claims.length, "the exemption document carries registry rows").toBeGreaterThan(0);
    expect(scan.anchors.length, "…and anchors").toBeGreaterThan(0);
    expect(scan.attempts, "…and no near-anchor attempt").toEqual([]);
    const byId = new Map(scan.anchors.map((a) => [a.id, a]));
    for (const c of claims) {
      const anchor = byId.get(c.id);
      expect(anchor, `${c.id} is anchored in ${DOC}`).toBeDefined();
      const block = anchoredBlockAt(scan, anchor!, c.verbatim);
      expect(block.overruns, `${c.id} does not overrun`).toBe(false);
      expect(block.matches, `${c.id}'s bytes are frozen`).toBe(true);
      expect(block.end, `${c.id}'s extent lies inside the assembly`).toBeLessThanOrEqual(
        scan.contentLineCount,
      );
    }
  });

  it("THE INTERSECTION PREMISE: the two consumers' arrays are the SAME coordinate system", () => {
    // `locateExemptRegion` measures the region over the array its CALLER hands in — a raw
    // `text.split("\n")`. `scanAnchoredDocument` drops the single empty element a TERMINATING
    // newline produces. The two therefore differ in LENGTH by at most that one element, and they
    // must be ELEMENTWISE IDENTICAL everywhere the authority has a line, or an index produced by one
    // and spent against the other addresses a different line. Asserted, never assumed.
    const raw = text.split("\n");
    expect(raw.length - scan.contentLineCount).toBeLessThanOrEqual(1);
    expect(raw.length).toBeGreaterThanOrEqual(scan.contentLineCount);
    for (let i = 0; i < scan.contentLineCount; i += 1) {
      expect(raw[i], `the two arrays agree at index ${i}`).toBe(scan.lines[i]);
    }
    // …and the only element the authority dropped is the terminator's empty one.
    if (raw.length > scan.contentLineCount) expect(raw[scan.contentLineCount]).toBe("");
  });

  it("the region carries anchored blocks, and every one of them lies INSIDE the region", () => {
    const raw = text.split("\n");
    const region = locateExemptRegion(raw);
    expect(region, "the one named exemption region resolves").not.toBeNull();
    const body = { start: region!.headingAt + 1, end: region!.endBefore };
    expect(body.end - body.start, "the region body is non-empty").toBeGreaterThan(0);

    // THE SELECTION IS BY ANCHOR POSITION AND THE ASSERTION IS ABOUT THE BLOCK'S EXTENT, and those
    // must be two different things. A first draft selected on the extent and then asserted the
    // extent, which is unfalsifiable by construction — every member satisfies the assertion because
    // the filter is the assertion. Found by mutating `end` and watching the case stay green.
    const byId = new Map(scan.anchors.map((a) => [a.id, a]));
    const inside = claims
      .map((c) => anchoredBlockAt(scan, byId.get(c.id)!, c.verbatim))
      .filter((b) => b.anchorIndex >= region!.headingAt && b.anchorIndex < body.end);
    expect(inside.length, "the region carries at least one anchored block").toBeGreaterThan(0);
    for (const b of inside) {
      expect(b.matches, `${b.id} inside the region is frozen`).toBe(true);
      expect(b.start, `${b.id}'s block starts inside the region`).toBeGreaterThanOrEqual(body.start);
      expect(b.end, `${b.id}'s block ends inside the region`).toBeLessThanOrEqual(body.end);
    }
    // The anchored coverage is a SUBSET of the region — the containment plan 29-52 intersects
    // against. Its SIZE is a measurement published in the SUMMARY, deliberately not pinned here.
    const covered = new Set<number>();
    for (const b of inside) for (let i = b.start; i < b.end; i += 1) covered.add(i);
    expect(covered.size).toBeGreaterThan(0);
    expect(covered.size).toBeLessThanOrEqual(body.end - body.start);
    for (const i of covered) {
      expect(i, "every covered index is inside the region body").toBeGreaterThanOrEqual(body.start);
      expect(i).toBeLessThan(body.end);
    }
  });
});
