// kit-plan-limits.test.ts — the pure predicates the kit write plan (install.ts buildKitPlan) asks
// about its destinations, tested by themselves (red-team of plan 33.1-31, brief §3).
//
// B2, case-folding collision. Two kit names that differ only by case or by Unicode normalisation
// name ONE file on a case-insensitive or normalisation-insensitive target (the macOS and Windows
// defaults). The plan refuses the whole kit when any two destinations fold to the same path, per
// component (a parent directory too). The predicate is pure over the list of target-relative
// destinations, so it is tested here without a disk image; install.test.ts runs the end-to-end case
// only where the local filesystem can hold two such names.
//
// Borderline (a), path length. A destination whose full path or any component is over the platform
// limit cannot be created; the plan refuses the whole kit before the first write.
//
// Drives the COMMITTED .js modules, the repo idiom.

import { describe, it, expect } from "vitest";
import { kitNameCollisions } from "./kit-source.js";
import { pathLimitProblem, PATH_MAX_BYTES, NAME_MAX_BYTES } from "./user-file.js";

describe("kit plan: two destinations that fold to one name (red-team B2 of plan 33.1-31)", () => {
  it("no pair for distinct names, and the real kit's own name shapes fold apart", () => {
    const rels = [
      ".claude/skills/grugops/SKILL.md",
      ".claude/skills/grugops-gate/SKILL.md",
      ".claude/agents/grugops-orchestrator.md",
      ".claude/agents/grugops-qe-e2e.md",
    ];
    expect(kitNameCollisions(rels)).toEqual([]);
  });

  it("a leaf that differs only by case is a collision", () => {
    const pairs = kitNameCollisions([".claude/agents/grugops-orchestrator.md", ".claude/agents/GRUGOPS-orchestrator.md"]);
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toContain(".claude/agents/grugops-orchestrator.md");
    expect(pairs[0]).toContain(".claude/agents/GRUGOPS-orchestrator.md");
  });

  it("a parent directory that differs only by case is a collision, named at that directory", () => {
    const pairs = kitNameCollisions([".claude/skills/grugops-gate/SKILL.md", ".claude/skills/GRUGOPS-GATE/SKILL.md"]);
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toEqual([".claude/skills/grugops-gate", ".claude/skills/GRUGOPS-GATE"]);
  });

  it("a parent directory that folds equal is a collision even when the leaves differ", () => {
    const pairs = kitNameCollisions([".claude/skills/Gate/a.md", ".claude/skills/gate/b.md"]);
    expect(pairs).toEqual([[".claude/skills/Gate", ".claude/skills/gate"]]);
  });

  it("names equal after Unicode NFC normalisation are a collision (NFC versus NFD)", () => {
    const nfc: string = "caf\u00e9";
    const nfd: string = "cafe\u0301";
    expect(nfc).not.toBe(nfd);
    const pairs = kitNameCollisions([`.claude/agents/${nfc}.md`, `.claude/agents/${nfd}.md`]);
    expect(pairs.length).toBe(1);
  });

  it("the same destination twice is a collision", () => {
    expect(kitNameCollisions([".claude/agents/a.md", ".claude/agents/a.md"]).length).toBe(1);
  });

  it("three names folding to one give two pairs, each naming the first one seen", () => {
    const pairs = kitNameCollisions([".claude/agents/a.md", ".claude/agents/A.md", ".claude/agents/a.MD"]);
    expect(pairs).toEqual([
      [".claude/agents/a.md", ".claude/agents/A.md"],
      [".claude/agents/a.md", ".claude/agents/a.MD"],
    ]);
  });
});

describe("kit plan: a destination over the platform path limits (red-team borderline (a) of plan 33.1-31)", () => {
  it("the constants are the platform's (NAME_MAX 255; PATH_MAX 4096 on linux, 1024 elsewhere)", () => {
    expect(NAME_MAX_BYTES).toBe(255);
    expect(PATH_MAX_BYTES).toBe(process.platform === "linux" ? 4096 : 1024);
  });

  it("a full path of PATH_MAX - 1 bytes is within the limit, and PATH_MAX bytes is over it (PATH_MAX counts the NUL)", () => {
    // An absolute path of exactly `n` bytes, every component within NAME_MAX.
    const pathOfBytes = (n: number): string => {
      let p = "";
      while (n - p.length > 201) p += "/" + "d".repeat(200);
      return p + "/" + "e".repeat(n - p.length - 1);
    };
    const at = pathOfBytes(PATH_MAX_BYTES - 1);
    expect(Buffer.byteLength(at)).toBe(PATH_MAX_BYTES - 1);
    expect(pathLimitProblem(at)).toBeNull();
    const over = pathOfBytes(PATH_MAX_BYTES);
    expect(Buffer.byteLength(over)).toBe(PATH_MAX_BYTES);
    expect(pathLimitProblem(over)).toMatch(/path limit/);
  });

  it("a component of NAME_MAX bytes is within the limit, and NAME_MAX + 1 bytes is over it, counted in UTF-8 bytes", () => {
    expect(pathLimitProblem(`/t/${"n".repeat(NAME_MAX_BYTES)}`)).toBeNull();
    expect(pathLimitProblem(`/t/${"n".repeat(NAME_MAX_BYTES + 1)}`)).toMatch(/name limit/);
    // 128 two-byte characters are 256 bytes: over, though only 128 characters.
    expect(pathLimitProblem(`/t/${"\u00e9".repeat(128)}`)).toMatch(/name limit/);
  });
});
