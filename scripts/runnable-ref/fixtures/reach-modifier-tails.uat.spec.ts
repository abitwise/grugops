// reach-modifier-tails.uat.spec.ts — the TAIL-AXIS REACHABILITY fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for `WR-38` of `31-REVIEW.md` round 8.
//
// WHAT WAS WRONG. `31-34` added a binding that requires every PUBLISHED ban member to have a corpus
// row driving it to a refusal — the direction membership equality cannot see, and the exact shape
// `CR-23` was: a head published in the constant, quoted in the recipe, and unreachable by the
// mechanism for the one case it was retained for, with the suite green throughout. That binding
// derived its expected side from TWO of the four published ban sets. `BANNED_MODIFIER_TAILS` is
// published, quoted by value in the recipe and asserted by the membership-equality case, and only
// one of its four members (`skip`) had a row keyed to the constant. `only` was reached incidentally
// by two fixtures written for other reasons; `fixme` and `fail` were called by NO fixture at all,
// so a narrowing that made either unreachable would have repeated `CR-23` with the same green
// suite.
//
// WHAT THIS FILE ADDS. One call per published tail, on a published head, through the framework's
// own declared surface — the route identity decides. Each is a REAL spelling: `skip` removes the
// scenario from the evidence, `only` removes every OTHER scenario from it, `fixme` marks it
// expected-to-fail and removes it, and `fail` INVERTS it so a failing assertion reports as a pass.
// The four are written as four separate module-scope calls rather than folded into one, because the
// binding requires a row per MEMBER and a reader tracing a member to its evidence must land on one
// construct.
//
// MUTATION CONTRACT. The marked region holds the four planted modifier calls and nothing else. What
// survives the deletion is the same scenario asserted normally through the same imports, so a
// finding cannot have been caused by the import, the navigation or the value read.

import { test, expect } from "@playwright/test";

// MUTATE-REMOVE-START
test.skip("the refund is issued within one billing cycle", async ({ page }) => {
  await expect(page.getByTestId("refund-state")).toHaveText("issued");
});

test.only("the invoice total is shown, and nothing else runs", async ({ page }) => {
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});

test.fixme("the dunning notice is sent", async ({ page }) => {
  await expect(page.getByTestId("dunning-state")).toHaveText("sent");
});

test.fail("the proration is computed from the mid-cycle date", async ({ page }) => {
  await expect(page.getByTestId("proration")).toHaveText("$13.00");
});
// MUTATE-REMOVE-END

test("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
