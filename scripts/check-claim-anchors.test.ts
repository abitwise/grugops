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
import { REGISTRY_PATH } from "./audit-model.js";
import { spawnGrantScan } from "./kit-model.js";

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
