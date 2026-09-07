// clean.uat.spec.ts — the ADVERSARIAL NEGATIVE fixture for uat-spec-integrity.js.
//
// This file is a parse CORPUS, not a test. It is deliberately full of the SHAPES the checker must
// not confuse for the constructs it refuses, so that an implementation which pattern-matches text
// instead of deciding over the TypeScript AST fails here:
//
//   - an `if` statement that contains no assertion at all;
//   - a `try` block and a `catch` clause that contain no assertion at all;
//   - a `finally` block (deliberately OUTSIDE D-14's locked set);
//   - a comment naming a banned member (see the word test.skip on this very line);
//   - a string literal that reads like an assertion.
//
// Every one of those is ACCEPTED. A run over a target holding only this file exits 0.

import { test, expect } from "@playwright/test";

test("checkout completes and the receipt shows the paid total", async ({ page }) => {
  await page.goto("/checkout");

  // An `if` with no assertion inside it: control flow is not the ban — a CONDITIONAL ASSERTION is.
  if (await page.getByRole("button", { name: "Accept cookies" }).isVisible()) {
    await page.getByRole("button", { name: "Accept cookies" }).click();
  }

  // A try/catch/finally that carries no assertion: the ban is on a CAUGHT ASSERTION, not on error
  // handling in the setup path.
  try {
    await page.getByTestId("promo-banner").dismiss();
  } catch {
    await page.reload();
  } finally {
    await page.waitForLoadState("networkidle");
  }

  // A string literal shaped like the constructs the checker refuses. Text, not code.
  const notes = "the previous revision used expect( inside a catch and called test.skip";
  await page.getByTestId("notes").fill(notes);

  await page.getByRole("button", { name: "Pay" }).click();

  // The assertions themselves sit on the straight-line path: unconditional, uncaught.
  await expect(page.getByTestId("receipt-total")).toHaveText("$42.00");
  await expect(page.getByTestId("receipt-status")).toHaveText("Paid");
});
