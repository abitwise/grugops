// modifier-family.uat.spec.ts — the ROUTING-SEGMENT fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for CR-06 of 31-REVIEW.md and gap 2 of
// 31-VERIFICATION.md round 2: membership used to be an exact-string test against a nine-member
// list, so `test.describe.serial.only(...)` and `test.describe.parallel.only(...)` — real
// Playwright spellings that narrow an ENTIRE gate run exactly as `test.describe.only(...)` does —
// were reported as `0 findings over 1/1 uat specs checked` at exit 0. A checker that refuses
// `test.describe.only` and admits `test.describe.serial.only` has a spelling boundary, not a rule.
//
// D-17 made membership a rule over the resolved path: the HEAD it starts from and the MODIFIER it
// ends in. The segments in between ROUTE the call and do not change what the tail does to the
// evidence, so both spellings below are refused with no member added to any set.
//
// MUTATION CONTRACT. The marked region holds the two planted spellings and nothing else. What
// survives the deletion is a STRUCTURALLY IDENTICAL twin of the same two scenarios, written without
// a modifier, so a finding here cannot have been caused by the scenario, the selectors or the
// assertion — only by the routed modifier.

import { test, expect } from "@playwright/test";

// MUTATE-REMOVE-START
test.describe.serial.only("billing, run in order", () => {
  test("the invoice total is shown", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
  });
});

test.describe.parallel.only("refunds, run side by side", () => {
  test("the refund status is shown", async ({ page }) => {
    await page.goto("/refunds");
    await expect(page.getByTestId("refund-status")).toHaveText("Issued");
  });
});
// MUTATE-REMOVE-END

test.describe("billing, run in order (the same scenario, not narrowed)", () => {
  test("the invoice total is shown", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
  });
});

test.describe("refunds, run side by side (the same scenario, not narrowed)", () => {
  test("the refund status is shown", async ({ page }) => {
    await page.goto("/refunds");
    await expect(page.getByTestId("refund-status")).toHaveText("Issued");
  });
});
