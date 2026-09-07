// conditional-assertion.uat.spec.ts — the D-14 ARM (b) fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. An assertion the run may never reach proves nothing: the lane
// goes green whether the branch was taken or not, so the evidence records a scenario that may not
// have been exercised at all. Every position D-14 arm (b) names appears here exactly once: an `if`
// then-branch, an `else` branch, both arms of a conditional expression, and the `||`, `&&` and `??`
// operand positions, plus an optional call.
//
// MUTATION CONTRACT. The lines between MUTATE-REMOVE-START and MUTATE-REMOVE-END are EXACTLY the
// banned constructs. Deleting them must clear every finding — the `if`/`else`, the ternary and the
// straight-line assertions that survive prove the cause was the assertion's position.

import { test, expect } from "@playwright/test";

test("the dashboard shows the current plan", async ({ page }) => {
  await page.goto("/dashboard");
  const trialBannerVisible = await page.getByTestId("trial-banner").isVisible();
  const planName = await page.getByTestId("plan-name").textContent();

  if (trialBannerVisible) {
    // MUTATE-REMOVE-START
    await expect(page.getByTestId("trial-days-left")).toHaveText("14");
    // MUTATE-REMOVE-END
    await page.getByTestId("trial-banner").click();
  } else {
    // MUTATE-REMOVE-START
    await expect(page.getByTestId("plan-badge")).toHaveText("Pro");
    // MUTATE-REMOVE-END
    await page.getByTestId("plan-badge").hover();
  }

  // MUTATE-REMOVE-START
  trialBannerVisible
    ? expect(planName).toBe("Trial")
    : expect(planName).toBe("Pro");
  trialBannerVisible || expect(planName).toBe("Pro");
  trialBannerVisible && expect(planName).toBe("Trial");
  planName ?? expect(planName).toBe("Pro");
  expect?.(planName).toBe("Pro");
  // MUTATE-REMOVE-END

  // Straight-line assertions: unconditional. These survive the mutation.
  await expect(page.getByTestId("plan-name")).toBeVisible();
});
