// configured-soft.uat.spec.ts — the CONFIGURED-SOFT fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for CR-07 of 31-REVIEW.md: a soft assertion records a
// failure without failing the scenario, so a green lane certifies a scenario whose acceptance
// criterion failed. `expect.soft` was already refused as an exact path, but the CONFIGURED spelling
// — `expect.configure({ soft: true })(locator)` — reached the same behaviour through a callee the
// resolver declined, and was reported as `0 findings over 1/1 uat specs checked` at exit 0.
//
// 31-16 (CR-09 and IN-10 of 31-REVIEW.md): THE REGION NOW CARRIES THE CHAINED SPELLINGS, AND THE
// CONTROL IS CHAINED AND INVOKED. Before this round the marked region held only the UN-CHAINED
// escape and the control was a bare module-scope statement — `expect.configure({ retries: 2 });` —
// never chained and never invoked. The mutation contract therefore proved the pair-decision only for
// the shape whose resolved path carries NO call-link marker, which is precisely why this fixture
// stayed green while `expect.configure({ retries: 2 }).soft(locator)` and
// `expect.configure({ retries: 2 }).configure({ soft: true })(locator)` both passed the committed
// checker at exit 0. A fixture that cannot fail for the reason it exists for is not evidence.
//
// WHY THE CONTROL BELOW IS THE POINT OF THIS FILE. `expect.configure` is a LEGITIMATE call:
// `expect.configure({ retries: 2 })(locator)` re-runs a matcher and changes no result. Refusing the
// path alone would refuse it too, and so would a fix that closed CR-09 by banning every path a
// routing link folds to. The control is now written in the same CHAINED, INVOKED shape as the
// escapes it must be told apart from, so a fix that lost the second axis turns this fixture red.
//
// MUTATION CONTRACT. The marked region holds the planted escapes and nothing else — the un-chained
// pair, both chained spellings, and the converse ordering that enables the option at an INNER link.
// What survives the deletion is the same scenario asserted normally, PLUS the chained and invoked
// legitimate configure call, which must stay at zero findings both before and after.

import { test, expect } from "@playwright/test";

test("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  // MUTATE-REMOVE-START
  await expect.configure({ soft: true })(page.getByTestId("invoice-total")).toBeVisible();
  await expect.configure({ retries: 2 }).soft(page.getByTestId("invoice-total")).toBeVisible();
  await expect
    .configure({ retries: 2 })
    .configure({ soft: true })(page.getByTestId("invoice-total"))
    .toBeVisible();
  await expect
    .configure({ soft: true })
    .configure({ timeout: 5 })(page.getByTestId("invoice-total"))
    .toBeVisible();
  // MUTATE-REMOVE-END
  await expect.configure({ retries: 2 })(page.getByTestId("invoice-total")).toBeVisible();
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
