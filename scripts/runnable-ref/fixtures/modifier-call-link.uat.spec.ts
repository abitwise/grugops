// modifier-call-link.uat.spec.ts — the CALL-LINK fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for CR-07 of 31-REVIEW.md and gap 1 of
// 31-VERIFICATION.md round 3: the ban rule was only ever asked about a callee `calleeDottedPath`
// could resolve, and that resolver returned null for ANY chain containing a call. So
// `test.info().skip()`, `test.info().fail()` and `test.info().fixme(true, "later")` — the documented
// TestInfo-fixture runtime spelling of exactly the modifiers the tail set bans, with the identical
// effect on the evidence — were reported as `0 findings over 1/1 uat specs checked` at exit 0.
//
// D-18 (1) decides the call link: the inner path resolves and is pushed as one segment with a `()`
// marker, so `test.info().skip` has head `test` and tail `skip` and the D-17 rule refuses it with
// nothing added to any set. The marker lands in the routing position, which is also what keeps a
// legitimate chained assertion legitimate.
//
// MUTATION CONTRACT. The marked region holds the three planted spellings and nothing else. What
// survives the deletion is a STRUCTURALLY IDENTICAL twin of the same three scenarios, written
// without a modifier call, so a finding here cannot have been caused by the scenario, the selectors
// or the assertion — only by the planted call-link modifier.

import { test, expect } from "@playwright/test";

// MUTATE-REMOVE-START
test("the invoice total is shown, removed at run time", async ({ page }) => {
  test.info().skip();
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});

test("the refund status is shown, inverted at run time", async ({ page }) => {
  test.info().fail();
  await page.goto("/refunds");
  await expect(page.getByTestId("refund-status")).toHaveText("Issued");
});

test("the shipping estimate is shown, deferred at run time", async ({ page }) => {
  test.info().fixme(true, "later");
  await page.goto("/shipping");
  await expect(page.getByTestId("shipping-estimate")).toHaveText("2 days");
});
// MUTATE-REMOVE-END

test("the invoice total is shown (the same scenario, not narrowed)", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});

test("the refund status is shown (the same scenario, not inverted)", async ({ page }) => {
  await page.goto("/refunds");
  await expect(page.getByTestId("refund-status")).toHaveText("Issued");
});

test("the shipping estimate is shown (the same scenario, not deferred)", async ({ page }) => {
  await page.goto("/shipping");
  await expect(page.getByTestId("shipping-estimate")).toHaveText("2 days");
});
