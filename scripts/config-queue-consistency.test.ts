// config-queue-consistency.test.ts — D-06 cross-surface consistency oracle for the `queue` config dial.
//
// The `queue` object is the parallel-execution width/anti-flood/stale-TTL dial. Like every grugops
// config field it lives on a 3-surface atomic dial that MUST stay consistent:
//   1. agent-factory/config/factory.config.json   — the live kit config
//   2. agent-factory/seed/.grugops/factory.config.json — the seed the installer copies into a repo
//   3. agent-factory/config/factory.config.md      — the human-readable twin (documents every key)
//
// This is the D-06 cross-surface consistency check the Phase-23 VALIDATION Wave-0 list requires:
//   - the `queue` object is present on both JSON surfaces and DEEP-EQUAL across them (the seed must
//     match the kit default — the foundation guard separately asserts the two JSONs stay byte-identical);
//   - the queue carries the locked lean defaults wip_limit=3 / claim_cap=2 / stale_ttl_minutes=30 (D-06);
//   - the twin documents each of the three queue keys by name;
//   - the twin crisply distinguishes queue.wip_limit (concurrent agent WIDTH) from the pre-existing
//     per-column `wip_limits` object (board-column flow) — the D-07 naming-collision care.
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

describe("queue config dial — 3-surface consistency (D-06)", () => {
  const kit = loadJson(KIT_JSON);
  const seed = loadJson(SEED_JSON);

  it("the `queue` object is present on both JSON surfaces", () => {
    expect(kit.queue, "kit config is missing the queue object").toBeTruthy();
    expect(seed.queue, "seed config is missing the queue object").toBeTruthy();
  });

  it("the `queue` object is deep-equal across the kit config and the seed", () => {
    expect(kit.queue).toEqual(seed.queue);
  });

  it("the `queue` object carries the locked lean defaults wip_limit=3 / claim_cap=2 / stale_ttl_minutes=30", () => {
    expect(kit.queue).toEqual({ wip_limit: 3, claim_cap: 2, stale_ttl_minutes: 30 });
  });

  it("the `queue` object is a top-level sibling — NOT nested inside or replacing `wip_limits` (D-07)", () => {
    // queue must not collide with or fold into the per-column wip_limits flow object.
    expect(kit.wip_limits, "the per-column wip_limits object must still exist").toBeTruthy();
    expect(kit.wip_limits).not.toHaveProperty("wip_limit");
    expect(kit.queue).not.toHaveProperty("Ready"); // a board column key would mean queue swallowed wip_limits
  });
});

describe("queue config dial — the twin documents every key (D-06)", () => {
  const twin = readFileSync(TWIN_MD, "utf8");

  it("the twin documents each of the three queue keys by name", () => {
    expect(twin).toContain("wip_limit");
    expect(twin).toContain("claim_cap");
    expect(twin).toContain("stale_ttl_minutes");
  });

  it("the twin documents the queue object and its lean defaults", () => {
    expect(twin).toMatch(/`queue`/);
    expect(twin).toMatch(/`queue` sub-fields/);
  });

  it("the twin crisply distinguishes queue.wip_limit (width) from wip_limits (per-column flow) (D-07)", () => {
    // Both names must appear AND the twin must explicitly call out that they are independent.
    expect(twin).toMatch(/`queue\.wip_limit`/);
    expect(twin).toMatch(/`wip_limits`/);
    expect(twin).toMatch(/independent|distinct|unrelated|not be conflated|never changes the other/i);
    // The width meaning and the flow meaning must both be stated.
    expect(twin).toMatch(/width/i);
    expect(twin).toMatch(/per-column|board column|flow/i);
  });
});
