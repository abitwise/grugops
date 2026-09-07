// modifier-call.uat.spec.ts — the D-14 ARM (c) fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. A banned modifier call removes the scenario from the evidence the
// gate re-runs, so a green lane would certify a scenario nobody exercised.
//
// MUTATION CONTRACT. The marked region below holds the banned call and nothing else. What survives
// the deletion is a STRUCTURALLY IDENTICAL twin of the same scenario, unskipped — so the finding
// cannot have been caused by the scenario, the selectors or the assertion, only by the modifier.

import { test, expect } from "@playwright/test";

// MUTATE-REMOVE-START
test.skip("refund is issued within one billing cycle", async ({ page }) => {
  await page.goto("/orders/1001/refund");
  await page.getByRole("button", { name: "Request refund" }).click();
  await expect(page.getByTestId("refund-status")).toHaveText("Issued");
});
// MUTATE-REMOVE-END

test("refund is issued within one billing cycle (the same scenario, not skipped)", async ({ page }) => {
  await page.goto("/orders/1001/refund");
  await page.getByRole("button", { name: "Request refund" }).click();
  await expect(page.getByTestId("refund-status")).toHaveText("Issued");
});
