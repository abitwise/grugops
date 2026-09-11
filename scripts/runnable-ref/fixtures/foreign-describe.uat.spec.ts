// foreign-describe.uat.spec.ts — the FOREIGN-FRAMEWORK GROUP fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for CR-23 of the round-7 review: `describe` is retained
// in `BANNED_MODIFIER_HEADS` for another framework's own export, and the `D-30 (2)` cutover made
// that case unreachable. This file is that case, in the spelling the head exists for — a whole
// scenario group disabled by a `describe.skip` whose binding comes from a DECLARED module that is
// not `@playwright/test`.
//
// MEASURED AGAINST THE COMMITTED .js BEFORE D-35, in an equipped probe root:
//   UAT spec integrity: 0 findings over 1/1 uat specs checked
//   EXIT=0
// with `npx tsc --noEmit` EXIT=0 — a LIVE bypass that type-checks clean, not a parse curiosity. The
// group's scenario never runs, and the gate reports green over it.
//
// MUTATION CONTRACT. The marked region holds the planted `describe.skip` group and nothing else.
// What survives the deletion is the SAME scenario, on the same imported binding, written without a
// modifier — so a finding here cannot have been caused by the import, by the scenario, by the
// selector or by the assertion, only by the planted modifier.

import { test, expect } from "@playwright/test";
import { describe } from "other-framework";

// MUTATE-REMOVE-START
describe.skip("refunds, the whole group disabled", () => {
  test("the refund status is shown", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByTestId("refund-status")).toHaveText("Issued");
  });
});
// MUTATE-REMOVE-END

// The structurally identical twin that survives the mutation: the same foreign binding, called
// without a modifier, wrapping the same scenario.
describe("refunds, the whole group enabled", () => {
  test("the refund status is shown again", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByTestId("refund-status")).toHaveText("Issued");
  });
});

test("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
