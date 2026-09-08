// configured-soft.uat.spec.ts — the CONFIGURED-SOFT fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for CR-07 of 31-REVIEW.md: a soft assertion records a
// failure without failing the scenario, so a green lane certifies a scenario whose acceptance
// criterion failed. `expect.soft` was already refused as an exact path, but the CONFIGURED spelling
// — `expect.configure({ soft: true })(locator)` — reached the same behaviour through a callee the
// resolver declined, and was reported as `0 findings over 1/1 uat specs checked` at exit 0.
//
// WHY THE CONTROL BELOW IS THE POINT OF THIS FIXTURE. `expect.configure` is a LEGITIMATE call:
// `expect.configure({ retries: 2 })` re-runs a matcher and changes no result. Refusing the path
// alone would refuse it too. D-18 (2) therefore decides the PAIR — the path plus the option key
// whose `true` literal makes it an escape — so this file carries both halves and would catch a fix
// that closed the escape by banning the path.
//
// MUTATION CONTRACT. The marked region holds the planted escape and nothing else. What survives the
// deletion is the same scenario asserted normally, PLUS the legitimate configure call, which must
// stay at zero findings both before and after.

import { test, expect } from "@playwright/test";

expect.configure({ retries: 2 });

test("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  // MUTATE-REMOVE-START
  await expect.configure({ soft: true })(page.getByTestId("invoice-total")).toBeVisible();
  // MUTATE-REMOVE-END
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
