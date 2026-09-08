// element-access-modifier.uat.spec.ts — the BRACKET-NOTATION fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for 31-REVIEW.md CR-02 and gap 2 of
// 31-VERIFICATION.md: arm (c) accepted only a PropertyAccessExpression callee, so `test["skip"](…)`
// — the identical construct, written with a string-literal member — was never seen at all. A
// checker that refuses `test.skip` and admits `test["skip"]` has a spelling boundary, not a rule.
//
// Both constructs below normalise to the SAME dotted path as their dotted spelling, so the checker
// reports one finding for each and the harness asserts the count is exactly two.
//
// MUTATION CONTRACT. The marked regions hold the two bracket-notation calls and nothing else. What
// survives the deletion is the same scenario written without a modifier, so a finding here cannot
// have been caused by the scenario, the selectors or the assertion.

import { test, expect } from "@playwright/test";

// MUTATE-REMOVE-START
test["skip"]("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
// MUTATE-REMOVE-END

test("the invoice total is shown (the same scenario, not skipped)", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
  // MUTATE-REMOVE-START
  expect["soft"](page.url()).toContain("/billing");
  // MUTATE-REMOVE-END
});
