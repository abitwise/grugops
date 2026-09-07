// union-all-arms.uat.spec.ts — the UNION fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It carries ONE instance of each of D-14's three arms:
//   (a) a caught assertion — an `expect` inside a catch clause;
//   (b) a conditional assertion — an `expect` under an `if`;
//   (c) a banned modifier call — `describe.only`.
//
// It exists because a walk that returns at the first arm it reaches would still refuse this file,
// exit 1 and look correct. The harness therefore asserts that ALL THREE characteristic findings are
// reported together: the result is the UNION of the arms, not the first one hit.

import { test, expect, describe } from "@playwright/test";

describe.only("billing", () => {
  test("an overdue invoice blocks a plan change", async ({ page }) => {
    await page.goto("/billing");
    const overdue = await page.getByTestId("overdue-badge").isVisible();

    if (overdue) {
      await expect(page.getByTestId("plan-change")).toBeDisabled();
    }

    try {
      await page.getByTestId("plan-change").click();
    } catch {
      await expect(page.getByTestId("plan-change-error")).toBeVisible();
    }

    await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
  });
});
