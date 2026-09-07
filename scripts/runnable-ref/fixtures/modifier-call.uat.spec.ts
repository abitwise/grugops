// modifier-call.uat.spec.ts — the D-14 ARM (c) fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It carries a banned modifier call: `test.skip` removes the
// scenario from the evidence the gate re-runs, so a green lane would certify a scenario nobody
// exercised. The checker refuses it with exit 1, naming this file and the line.
//
// MUTATION CONTRACT: remove the `.skip` member and this file becomes clean. That is what proves the
// finding is caused by the construct it names rather than by anything incidental to the file.

import { test, expect } from "@playwright/test";

test.skip("refund is issued within one billing cycle", async ({ page }) => {
  await page.goto("/orders/1001/refund");
  await page.getByRole("button", { name: "Request refund" }).click();
  await expect(page.getByTestId("refund-status")).toHaveText("Issued");
});
