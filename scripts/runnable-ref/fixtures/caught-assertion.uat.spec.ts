// caught-assertion.uat.spec.ts — the D-14 ARM (a) fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. An assertion inside a try block or a catch clause cannot fail the
// test: the throw is swallowed and the lane still goes green, so the evidence would certify a
// scenario that was never really checked.
//
// MUTATION CONTRACT. The lines between MUTATE-REMOVE-START and MUTATE-REMOVE-END are EXACTLY the
// banned constructs and nothing else. The harness deletes those lines and asserts the checker then
// exits 0. What SURVIVES the deletion is the proof: the try block, the catch clause, the finally
// block and two straight-line assertions all remain, so a finding here can only have been caused by
// an assertion's POSITION and never by the presence of error handling or of assertions as such.

import { test, expect } from "@playwright/test";
import assert from "node:assert/strict";

test("the order confirmation is reachable after a flaky redirect", async ({ page }) => {
  await page.goto("/orders/1001");

  try {
    await page.getByTestId("retry-redirect").click();
    // MUTATE-REMOVE-START
    await expect(page.getByTestId("order-status")).toHaveText("Confirmed");
    // MUTATE-REMOVE-END
  } catch {
    await page.reload();
    // MUTATE-REMOVE-START
    assert(page.url().includes("/orders/1001"));
    // MUTATE-REMOVE-END
  } finally {
    await page.waitForLoadState("networkidle");
  }

  // Straight-line assertions: unconditional and uncaught. These survive the mutation.
  await expect(page.getByTestId("order-id")).toHaveText("1001");
  await expect(page.getByTestId("order-total")).toHaveText("$42.00");
});
