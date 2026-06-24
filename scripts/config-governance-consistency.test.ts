// config-governance-consistency.test.ts — Phase-25 cross-surface consistency oracle for the two
// governance config dials: `context.human_admission` (GOV-01) and `context.audit_retention` (GOV-02).
//
// Both keys live on the same 3-surface atomic dial every grugops config field follows, and MUST stay
// consistent:
//   1. agent-factory/config/factory.config.json        — the live kit config
//   2. agent-factory/seed/.grugops/factory.config.json — the seed the installer copies into a repo
//   3. agent-factory/config/factory.config.md          — the human-readable twin (documents every key)
//
// This is the GOV-02 SC2 lockstep check (modeled on config-queue-consistency.test.ts):
//   - both governance keys are present under the `context` object on both JSON surfaces and the whole
//     `context` object is DEEP-EQUAL across them (the seed must match the kit; the foundation guard
//     separately asserts the two JSONs stay byte-identical);
//   - the keys carry the locked lean defaults human_admission="off" / audit_retention="git";
//   - the pre-existing `context.compaction` is still present (the two keys are ADDED, not a replacement);
//   - the twin documents each new key by name;
//   - the twin crisply states the D-09 distinction — audit_retention (governance-record durability) is
//     distinct from compaction (note-body verbosity) and never duplicates compaction:retain-raw;
//   - the twin documents the lean default-on-absent for each new key (D-11).
//
// Drives the COMMITTED config files on disk (no .ts build). Vitest globals:false → import explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const KIT_JSON = join(ROOT, "agent-factory/config/factory.config.json");
const SEED_JSON = join(ROOT, "agent-factory/seed/.grugops/factory.config.json");
const TWIN_MD = join(ROOT, "agent-factory/config/factory.config.md");

function loadJson(p: string): Record<string, unknown> {
  return JSON.parse(readFileSync(p, "utf8"));
}

describe("governance config dials — 3-surface consistency (GOV-01/GOV-02)", () => {
  const kit = loadJson(KIT_JSON);
  const seed = loadJson(SEED_JSON);
  const kitContext = kit.context as Record<string, unknown>;

  it("the `context` object is deep-equal across the kit config and the seed (lockstep, GOV-02 SC2)", () => {
    expect(kit.context).toEqual(seed.context);
  });

  it("both governance keys carry the lean defaults human_admission='off' / audit_retention='git'", () => {
    expect(kitContext.human_admission).toBe("off");
    expect(kitContext.audit_retention).toBe("git");
  });

  it("the pre-existing `context.compaction` is still present — the keys are ADDED, not a replacement", () => {
    expect(kitContext.compaction).toBe("aggressive");
  });
});

describe("governance config dials — the twin documents every key (GOV-01/GOV-02)", () => {
  const twin = readFileSync(TWIN_MD, "utf8");

  it("the twin documents each new governance key by name", () => {
    expect(twin).toMatch(/`human_admission`/);
    expect(twin).toMatch(/`audit_retention`/);
  });

  it("the twin states the D-09 distinction — audit_retention is distinct from compaction, never retain-raw", () => {
    expect(twin).toMatch(/distinct|independent|not.*compaction|never.*retain-raw/i);
  });

  it("the twin documents the lean default-on-absent for each new governance key (D-11)", () => {
    // A missing human_admission reads as off; a missing audit_retention reads as git.
    expect(twin).toMatch(/human_admission.*\boff\b/i);
    expect(twin).toMatch(/audit_retention.*\bgit\b/i);
  });
});
