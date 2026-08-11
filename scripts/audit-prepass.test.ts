// audit-prepass.test.ts — the hermetic harness for the D-06 mechanical evidence pre-pass.
//
// WHAT IS ACTUALLY BEING MEASURED HERE. The pre-pass is a REPORTER, not a gate, so "it exited 0" is
// not evidence of anything — it exits 0 whether it finds thirty rows or none. The properties worth
// asserting are therefore about the SHAPE of what it reports:
//
//   * the derived set is the whole audit set and is pinned against kit-model's constants, so a
//     vanished role is a red count rather than a file that quietly stops being audited;
//   * the one HAND-LISTED member is missing-file checked BEFORE any predicate runs, because a
//     deleted file otherwise reads as a file with no findings — the opposite of what it is;
//   * two runs over one tree are BYTE-IDENTICAL, so a diff of the committed evidence means a real
//     change in the tree rather than a reshuffle;
//   * every predicate DISCRIMINATES — a fixture matched by two predicates means the table is
//     measuring one thing twice and the row counts are not independent evidence.
//
// The mirrors are SYNTHESIZED rather than copied. The live kit is the subject of the audit, so a
// copied mirror would inherit whatever the real tree carries and make every assertion below a
// statement about today's prose instead of about the pre-pass.
//
// NOT in the e2e lane. Run with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/audit-prepass.test.ts
// Vitest globals:false -> import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  auditSetFiles,
  runPrepass,
  buildPrepassContext,
  predicateHits,
  PREPASS_PREDICATES,
  PREPASS_PREDICATE_COUNT,
  AUDIT_SET_COUNT,
  PROTOCOL_FILE,
  EVIDENCE_PATH,
} from "./audit-prepass.js";
import { ROLE_COUNT, WORKFLOW_COUNT, listRoles, listWorkflows } from "./kit-model.js";

const REPO_ROOT = join(import.meta.dirname, "..");
const PREPASS_JS = join(REPO_ROOT, "scripts", "audit-prepass.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Innocuous body. It must trip NO predicate — a "clean" baseline that is not actually clean would
// make every planted-fixture assertion below meaningless.
const CLEAN_BODY = ["# Role", "", "The role decomposes work and enqueues subtasks.", ""].join("\n");

/** A mirror carrying the exact SHAPE the derivation expects: 17 roles + 19 workflows + protocol. */
function buildMirror(plant: Record<string, string> = {}): string {
  const dir = freshTmp("grugops-audit-prepass-");
  mkdirSync(join(dir, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(dir, "agent-factory", "workflows"), { recursive: true });
  mkdirSync(join(dir, "docs", "audit"), { recursive: true });
  for (let i = 1; i <= ROLE_COUNT; i++) {
    writeFileSync(
      join(dir, "agent-factory", "roles", `role-${String(i).padStart(2, "0")}.md`),
      CLEAN_BODY,
      "utf8",
    );
  }
  for (let i = 0; i < WORKFLOW_COUNT; i++) {
    writeFileSync(
      join(dir, "agent-factory", "workflows", `${String(i).padStart(2, "0")}-flow.md`),
      CLEAN_BODY,
      "utf8",
    );
  }
  writeFileSync(join(dir, PROTOCOL_FILE), CLEAN_BODY, "utf8");
  for (const [rel, body] of Object.entries(plant)) {
    writeFileSync(join(dir, rel), body, "utf8");
  }
  return dir;
}

function runJs(root: string): { status: number | null; stdout: string } {
  const r = spawnSync("node", [PREPASS_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: root },
  });
  return { status: r.status, stdout: `${r.stdout}${r.stderr}` };
}

describe("audit-prepass: the derived audit set", () => {
  it("returns exactly AUDIT_SET_COUNT paths, pinned two-sided against kit-model's constants", () => {
    // NOT self-referential. The left side is the LIVE derivation; the right side is the PINNED
    // constants guard_kit_counts already holds against the tree. `derived === derived` would be a
    // floor written over the wrong quantity, which is worse than no floor.
    expect(AUDIT_SET_COUNT).toBe(ROLE_COUNT + WORKFLOW_COUNT + 1);
    expect(AUDIT_SET_COUNT).toBe(37);
    const live = auditSetFiles();
    expect(live.length).toBe(AUDIT_SET_COUNT);
    expect(live.length).not.toBe(AUDIT_SET_COUNT - 1);
    expect(live.length).not.toBe(AUDIT_SET_COUNT + 1);
  });

  it("is the two listers prefixed back to repo-relative form, plus the one protocol literal", () => {
    const live = auditSetFiles();
    const expectedRoles = listRoles().map((f) => join("agent-factory", "roles", f));
    const expectedWorkflows = listWorkflows().map((f) => join("agent-factory", "workflows", f));
    expect(live).toEqual([...expectedRoles, ...expectedWorkflows, PROTOCOL_FILE]);
    // The protocol file is out-of-set for COUNTING and in-set for READING (D-02) — it is the one
    // member no lister returns, which is exactly why it is the one member that can go missing.
    expect(expectedRoles).not.toContain(PROTOCOL_FILE);
  });

  it("names the protocol file with its underscore prefix, the reason listRoles drops it", () => {
    expect(PROTOCOL_FILE).toBe("agent-factory/roles/_role-switch-protocol.md");
    expect(existsSync(join(REPO_ROOT, PROTOCOL_FILE))).toBe(true);
  });

  it("derives the same set on a synthesized mirror", () => {
    const dir = buildMirror();
    expect(auditSetFiles(dir).length).toBe(AUDIT_SET_COUNT);
  });
});

describe("audit-prepass: the fail-red arms", () => {
  it("exits non-zero NAMING the protocol file when it is missing, before any predicate runs", () => {
    const dir = buildMirror();
    rmSync(join(dir, PROTOCOL_FILE));
    const r = runJs(dir);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain(PROTOCOL_FILE);
    // Before any predicate runs: no evidence section may have been emitted.
    expect(existsSync(join(dir, EVIDENCE_PATH))).toBe(false);
  });

  it("exits non-zero on a COUNT mismatch when a derived role file vanishes", () => {
    // A derived member cannot go "missing" from its own derivation — it simply stops being
    // enumerated. That disappearance is a COUNT failure, which is why both mechanisms exist and
    // why neither is redundant.
    const dir = buildMirror();
    rmSync(join(dir, "agent-factory", "roles", "role-01.md"));
    const r = runJs(dir);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/36/);
    expect(r.stdout).toMatch(/37/);
  });

  it("exits ZERO when it finds evidence — it is a reporter, not a gate", () => {
    const dir = buildMirror({
      "agent-factory/roles/role-01.md": "A handoff packet carries the memory.\n",
    });
    const r = runJs(dir);
    expect(r.status).toBe(0);
    expect(readFileSync(join(dir, EVIDENCE_PATH), "utf8")).toContain("role-01.md");
  });
});

describe("audit-prepass: the predicate table", () => {
  it("pins PREPASS_PREDICATES two-sided", () => {
    expect(PREPASS_PREDICATE_COUNT).toBe(4);
    expect(PREPASS_PREDICATES.length).toBe(PREPASS_PREDICATE_COUNT);
    expect(PREPASS_PREDICATES.length).not.toBe(PREPASS_PREDICATE_COUNT - 1);
    expect(PREPASS_PREDICATES.length).not.toBe(PREPASS_PREDICATE_COUNT + 1);
  });

  it("gives every predicate a unique id, a human label and a stated blind spot", () => {
    const ids = PREPASS_PREDICATES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PREPASS_PREDICATES) {
      expect(p.label.length).toBeGreaterThan(0);
      // `what` states what the predicate can and cannot see. A predicate with no stated blind spot
      // is one whose reader will assume it has none.
      expect(p.what.length).toBeGreaterThan(0);
      expect(p.what).toMatch(/cannot/i);
    }
  });

  it("EVERY predicate discriminates: its fixture is a hit for it and for NO other predicate", () => {
    // A fixture matched by two predicates means the table is measuring one thing twice, and the
    // per-predicate row counts in the evidence file would not be independent evidence.
    const dir = buildMirror();
    const ctx = buildPrepassContext(dir);
    for (const p of PREPASS_PREDICATES) {
      const hitters = PREPASS_PREDICATES.filter(
        (q) => predicateHits(q, p.fixture, ctx).length > 0,
      ).map((q) => q.id);
      expect(hitters).toEqual([p.id]);
    }
  });
});

describe("audit-prepass: the evidence rows", () => {
  it("emits one row per hit in `path:lineno:label:line` form", () => {
    const dir = buildMirror({
      "agent-factory/roles/role-01.md": ["clean", "A handoff packet carries it.", "clean"].join(
        "\n",
      ),
    });
    const out = runPrepass(dir);
    expect(out.refusals).toEqual([]);
    const rows = out.rows.filter((r) => r.includes("role-01.md"));
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatch(/^agent-factory\/roles\/role-01\.md:2:[^:]+:/);
  });

  it("emits NOTHING for a file with no hits — absence of a mechanical hit is not a verdict", () => {
    const dir = buildMirror();
    const out = runPrepass(dir);
    expect(out.rows.length).toBe(0);
    // And specifically: no row anywhere says a file is clean.
    expect(out.rows.join("\n")).not.toMatch(/clean|no findings|ok/i);
  });

  it("orders rows by file in the DERIVED order and by line number within a file", () => {
    const planted = "A handoff packet.\nfiller\nAnother handoff packet.\n";
    const dir = buildMirror({
      "agent-factory/roles/role-03.md": planted,
      "agent-factory/roles/role-01.md": planted,
      "agent-factory/workflows/00-flow.md": planted,
    });
    const out = runPrepass(dir);
    const order = out.rows.map((r) => `${r.split(":")[0]}:${r.split(":")[1]}`);
    expect(order).toEqual([
      "agent-factory/roles/role-01.md:1",
      "agent-factory/roles/role-01.md:3",
      "agent-factory/roles/role-03.md:1",
      "agent-factory/roles/role-03.md:3",
      "agent-factory/workflows/00-flow.md:1",
      "agent-factory/workflows/00-flow.md:3",
    ]);
  });

  it("finds the unresolvable-reference predicate's hit and NOT a reference that resolves", () => {
    const dir = buildMirror({
      "agent-factory/roles/role-01.md": [
        "See agent-factory/roles/does-not-exist.md for details.",
        "See agent-factory/roles/role-02.md for details.",
      ].join("\n"),
    });
    const out = runPrepass(dir);
    const rows = out.rows.filter((r) => r.includes("role-01.md:"));
    expect(rows.length).toBe(1);
    expect(rows[0]).toContain("does-not-exist.md");
  });
});

describe("audit-prepass: the generated evidence file", () => {
  it("writes EVIDENCE_PATH and re-runs BYTE-IDENTICALLY", () => {
    const dir = buildMirror({
      "agent-factory/roles/role-01.md": "A handoff packet and UNKNOWN - verify.\n",
    });
    expect(runJs(dir).status).toBe(0);
    const first = readFileSync(join(dir, EVIDENCE_PATH));
    expect(runJs(dir).status).toBe(0);
    const second = readFileSync(join(dir, EVIDENCE_PATH));
    expect(second.equals(first)).toBe(true);
  });

  it("heads the file with the regeneration command, the date, the set size, the predicate pin, and the not-a-verdict statement", () => {
    const dir = buildMirror();
    runJs(dir);
    const text = readFileSync(join(dir, EVIDENCE_PATH), "utf8");
    expect(text).toContain("node scripts/audit-prepass.js");
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(text).toContain(String(AUDIT_SET_COUNT));
    for (const p of PREPASS_PREDICATES) expect(text).toContain(p.id);
    expect(text).toMatch(/evidence.*not a verdict/is);
  });

  it("carries a section for EVERY predicate, including ones with zero rows", () => {
    // A predicate with no rows must still be visible. Silence about a predicate reads as "it found
    // nothing", which is indistinguishable from "it did not run".
    const dir = buildMirror();
    runJs(dir);
    const text = readFileSync(join(dir, EVIDENCE_PATH), "utf8");
    for (const p of PREPASS_PREDICATES) expect(text).toContain(p.label);
  });
});
