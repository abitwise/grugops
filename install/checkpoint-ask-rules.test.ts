// checkpoint-ask-rules.test.ts — pure unit cases for the ask-rule declaration (D-18, D-29).
//
// Imports only the sibling module (the committed .js, the repo idiom). The installer-side
// behaviour — the settings merge, the ledger, dry run, uninstall — is driven end to end by spawning
// the committed installer in install.test.ts; the cross-check of the disposition canonicalizer
// against scripts/checkpoints.js lives there too, under that file's documented test-only exception.

import { describe, it, expect } from "vitest";
import {
  ASK_RULE_CHECKPOINTS,
  ASK_RULE_ROWS,
  askRulesFor,
  allAskRules,
  canonicalizeCheckpointDisposition,
  checkpointsToWrite,
} from "./checkpoint-ask-rules.js";

// The four rule shapes measured against Claude Code's matcher (33.1-RESEARCH § Q1). `<tool>` is one
// word; `<verb>` may be two words (`pr merge`).
const FORM_A = /^Bash\([a-z]+ [a-z][a-z ]* \*\)$/; //       Bash(<tool> <verb> *)
const FORM_B = /^Bash\([a-z]+ \* [a-z][a-z ]* \*\)$/; //    Bash(<tool> * <verb> *)
const FORM_C = /^Bash\([a-z]+ \* [a-z][a-z ]*[a-z]\)$/; //  Bash(<tool> * <verb>)
const FORM_FLAG = /^Bash\([a-z]+ \*--[a-z-]+\*\)$/; //       Bash(<tool> *<flag>*)

describe("checkpoint ask rules: the derived set", () => {
  it("the count is derived from the table (verbs x 3 + flags) AND pinned as a number (55)", () => {
    const derived = ASK_RULE_ROWS.reduce((n, row) => n + row.verbs.length * 3 + row.flags.length, 0);
    const rules = allAskRules();
    expect(rules.length).toBe(derived);
    // CARDINALITY AS A NUMBER: equality alone passes when the table and the derivation shrink together.
    expect(rules.length).toBe(55);
    expect(new Set(rules).size).toBe(rules.length);
  });

  it("the merge checkpoint yields 6 rules and the deploy checkpoint 49", () => {
    expect(askRulesFor("protected_branch_merge").length).toBe(6);
    expect(askRulesFor("production_requires_human_confirmation").length).toBe(49);
    expect(ASK_RULE_CHECKPOINTS.length).toBe(2);
  });

  it("the merge rules are exactly the six gh pr merge / git push forms", () => {
    expect(askRulesFor("protected_branch_merge")).toEqual([
      "Bash(gh pr merge *)",
      "Bash(gh * pr merge *)",
      "Bash(gh * pr merge)",
      "Bash(git push *)",
      "Bash(git * push *)",
      "Bash(git * push)",
    ]);
  });

  it("every rule matches one of the four measured form shapes", () => {
    const unmatched = allAskRules().filter(
      (r) => !FORM_A.test(r) && !FORM_B.test(r) && !FORM_C.test(r) && !FORM_FLAG.test(r),
    );
    expect(unmatched).toEqual([]);
  });

  it("D-29: no rule carries the local ref-write verb", () => {
    const offending = allAskRules().filter((r) => r.includes("update-ref"));
    expect(offending).toEqual([]);
    for (const row of ASK_RULE_ROWS) expect(row.verbs).not.toContain("update-ref");
  });

  it("vercel is governed by --prod only, and allAskRules keeps checkpoint order", () => {
    expect(askRulesFor("production_requires_human_confirmation")).toContain("Bash(vercel *--prod*)");
    expect(allAskRules().filter((r) => r.startsWith("Bash(vercel"))).toEqual(["Bash(vercel *--prod*)"]);
    expect(allAskRules()).toEqual([
      ...askRulesFor(ASK_RULE_CHECKPOINTS[0]),
      ...askRulesFor(ASK_RULE_CHECKPOINTS[1]),
    ]);
  });
});

describe("checkpoint ask rules: which checkpoints are written", () => {
  const both = ["protected_branch_merge", "production_requires_human_confirmation"];

  it("a non-object or absent configuration writes both (fail closed)", () => {
    for (const cfg of [undefined, null, 1, "x", [], true]) expect(checkpointsToWrite(cfg)).toEqual(both);
  });

  it("a missing or non-object checkpoints object writes both", () => {
    for (const cfg of [{}, { checkpoints: null }, { checkpoints: "block" }, { checkpoints: [] }, { checkpoints: {} }]) {
      expect(checkpointsToWrite(cfg)).toEqual(both);
    }
  });

  it("only an exact notify or off lowers a checkpoint", () => {
    expect(checkpointsToWrite({ checkpoints: { protected_branch_merge: "off" } })).toEqual([
      "production_requires_human_confirmation",
    ]);
    expect(checkpointsToWrite({ checkpoints: { production_requires_human_confirmation: "notify" } })).toEqual([
      "protected_branch_merge",
    ]);
    expect(
      checkpointsToWrite({ checkpoints: { protected_branch_merge: "off", production_requires_human_confirmation: "off" } }),
    ).toEqual([]);
    for (const v of ["OFF", "Off", true, false, null, 0, "", "block"]) {
      expect(checkpointsToWrite({ checkpoints: { protected_branch_merge: v } })).toEqual(both);
    }
  });

  it("the canonicalizer maps exactly block/notify/off to themselves and everything else to block", () => {
    expect(canonicalizeCheckpointDisposition("block")).toBe("block");
    expect(canonicalizeCheckpointDisposition("notify")).toBe("notify");
    expect(canonicalizeCheckpointDisposition("off")).toBe("off");
    for (const v of ["OFF", "Notify", " off", true, null, undefined, {}, []]) {
      expect(canonicalizeCheckpointDisposition(v)).toBe("block");
    }
  });
});
