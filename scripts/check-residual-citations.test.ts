// check-residual-citations.test.ts — the published-residual citation gate (plan 30-11).
//
// The gate itself was found by reviewer 6 to be invoked by NOTHING, which is `RA6-1`. This file is
// half of the answer: the derived runner-set case in check-foundation-guards.test.ts asserts CI runs
// it, and these cases assert what it does when it runs.

import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { residualCitationRefusals, trackedPaths } from "./check-residual-citations.js";

const ROOT = join(import.meta.dirname, "..");

describe("check-residual-citations — membership is tracked AND present (RA6-3)", () => {
  const tmps: string[] = [];
  function repoWith(rowBody: string, present: boolean): string {
    const root = mkdtempSync(join(tmpdir(), "rcit-"));
    tmps.push(root);
    execFileSync("git", ["init", "-q"], { cwd: root });
    mkdirSync(join(root, "docs", "audit"), { recursive: true });
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(join(root, "scripts", "thing.ts"), "export const x = 1;\n");
    // The register's addition rows begin above HISTORICAL_RESIDUAL_ROWS (8).
    writeFileSync(
      join(root, "docs", "audit", "28-residual-sizing.md"),
      `| 9 | x | \`accepted\` | — | ${rowBody} |\n`,
    );
    execFileSync("git", ["add", "-A"], { cwd: root });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "x"], {
      cwd: root,
    });
    if (!present) rmSync(join(root, "scripts", "thing.ts"));
    return root;
  }

  it("CONTROL: a tracked, present citation passes", () => {
    const r = residualCitationRefusals(repoWith("see `scripts/thing.ts`", true));
    expect(r.refusals).toEqual([]);
    expect(r.cited).toBe(1);
  });

  it("a TRACKED but ABSENT citation is refused, naming which half failed (RA6-3)", () => {
    // `git ls-files` reads the INDEX. `rm scripts/audit-model.ts` and the gate still PASSED — and it
    // compounds with `RA6-1`: in CI the index and the worktree agree, and the gate never ran in CI,
    // so the only place it ran was a developer's tree, precisely where the two can disagree.
    const r = residualCitationRefusals(repoWith("see `scripts/thing.ts`", false));
    expect(r.refusals.length).toBe(1);
    expect(r.refusals[0]).toContain("ABSENT from the working tree");
  });

  it("an UNTRACKED but present citation is refused too, naming that half", () => {
    const root = repoWith("see `scripts/thing.ts`", true);
    writeFileSync(join(root, "scripts", "local.ts"), "x\n");
    writeFileSync(
      join(root, "docs", "audit", "28-residual-sizing.md"),
      "| 9 | x | `accepted` | — | see `scripts/local.ts` |\n",
    );
    const r = residualCitationRefusals(root);
    expect(r.refusals.length).toBe(1);
    expect(r.refusals[0]).toContain("NOT tracked by git");
  });

  it("the vacuity floor fires when a published row cites nothing", () => {
    const r = residualCitationRefusals(repoWith("prose with no path at all", true));
    expect(r.refusals.join("\n")).toContain("stopped asking");
  });

  it("trackedPaths counts a directory as tracked when anything under it is", () => {
    const t = trackedPaths(ROOT);
    expect(t.has("scripts")).toBe(true);
    expect(t.has("scripts/is-entry.ts")).toBe(true);
    expect(t.has("scripts/definitely-not-a-file.ts")).toBe(false);
  });

  it("the live register passes both halves", () => {
    const r = residualCitationRefusals(ROOT);
    expect(r.refusals).toEqual([]);
    expect(r.cited).toBeGreaterThan(0);
  });
});
