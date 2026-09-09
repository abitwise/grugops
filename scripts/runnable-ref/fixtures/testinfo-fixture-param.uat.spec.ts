// testinfo-fixture-param.uat.spec.ts — the TESTINFO FIXTURE-PARAMETER fixture for
// uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for CR-10 of 31-REVIEW.md, independently reproduced in
// 31-VERIFICATION.md round 4: `test("a", async ({ page }, testInfo) => { testInfo.skip(); })` is
// Playwright's PRIMARY documented spelling of exactly the modifiers D-18 (1) was convened to decide
// in their `test.info()` form, and all three spellings reported `0 findings over 1/1 uat specs
// checked` at exit 0 against the committed checker. The path resolved cleanly — nothing was
// declined — and the head `testInfo` was simply not a banned head, which is why neither the derived
// decline set nor the reverse partition could ever have named it.
//
// WHAT THE SURVIVING SCENARIO PROVES. `slow` is a modifier by Playwright's own taxonomy and is
// deliberately NOT refused: it triples the time budget a scenario is given, so the scenario still
// runs and every assertion in it is still read. It is written on the SAME fixture-parameter binding
// as the escapes above it, so a fix that canonicalised the head into a blanket refusal of the whole
// TestInfo surface would turn this fixture red rather than passing quietly.
//
// MUTATION CONTRACT. The marked region holds the three refused modifier calls and nothing else.
// What survives the deletion is the same scenario asserted normally, PLUS a second scenario that
// takes the same second callback parameter and calls a NON-banned member on it — both of which must
// stay at zero findings before and after.

import { test, expect } from "@playwright/test";

test("the invoice total is shown", async ({ page }, testInfo) => {
  await page.goto("/billing");
  // MUTATE-REMOVE-START
  testInfo.skip();
  testInfo.fail();
  testInfo.fixme(true, "later");
  // MUTATE-REMOVE-END
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});

test("the invoice total survives a reload", async ({ page }, testInfo) => {
  testInfo.slow();
  await page.reload();
  await expect(page.getByTestId("invoice-total")).toBeVisible();
});
