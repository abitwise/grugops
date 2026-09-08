// modifier-group-clean.uat.spec.ts — the FALSE-POSITIVE CONTROL for the D-17 modifier rule.
//
// A parse CORPUS file, not a test. Its whole job is to be ACCEPTED. D-17 replaced an exact-string
// ban list with a head-and-tail rule over the resolved dotted path, and the risk a rule carries
// that a list does not is over-reach: a rule that refused every call whose head is `test` would
// refuse the very specs the quality gate exists to run, and a checker that refuses legitimate
// Playwright is a checker a team turns off.
//
// So this file carries, deliberately, exactly the shapes the rule must NOT refuse:
//
//   - `test.describe.serial(...)` — a routing segment used WITHOUT a banned tail;
//   - `test.describe.parallel(...)` — its sibling, same question;
//   - `test.describe.configure(...)` — a configuration call whose tail is not a modifier;
//   - a plain `test(...)` call — one segment, which is not a modifier call at all;
//   - an ordinary assertion chain — `expect(...)` followed by a matcher, which must not be read as
//     `expect.soft` (a CallExpression link deliberately does not resolve).
//
// A run over a target holding only this file exits 0 with zero findings. This file carries NO
// mutation region: there is nothing to delete, because nothing in it is refused.

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe.serial("checkout, run in order", () => {
  test("the receipt shows the paid total", async ({ page }) => {
    await page.goto("/checkout");
    await page.getByRole("button", { name: "Pay" }).click();
    await expect(page.getByTestId("receipt-total")).toHaveText("$42.00");
  });
});

test.describe.parallel("catalogue, run side by side", () => {
  test("the product title is shown", async ({ page }) => {
    await page.goto("/products/1001");
    await expect(page.getByTestId("product-title")).toHaveText("Wireless kettle");
  });
});

test("the order history lists the most recent order", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByTestId("order-1001")).toBeVisible();
});
