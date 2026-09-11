// foreign-soft-assert.uat.spec.ts — the FOREIGN-ASSERTION-LIBRARY fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for the SECOND instance of CR-23, the one Option A of
// the round-7 checkpoint was measured NOT to close: `expect.soft` is a member of
// `BANNED_EXACT_PATHS`, and `@playwright/test` DOES declare `expect` — so a head-declared exemption
// would have left this open. The binding here comes from another assertion library entirely.
//
// MEASURED AGAINST THE COMMITTED .js BEFORE D-35, in an equipped probe root:
//   UAT spec integrity: 0 findings over 1/1 uat specs checked
//   EXIT=0
// with `npx tsc --noEmit` EXIT=0.
//
// WHAT THE CONSTRUCT DOES TO THE EVIDENCE. A soft assertion records a failure and lets the scenario
// finish reporting PASS. The lane is green, the acceptance criterion failed, and nothing in the run
// says so. That the library is not Playwright's changes nothing about the harm.
//
// MUTATION CONTRACT. The marked region holds the planted soft assertion and nothing else. What
// survives is the SAME comparison on the SAME value through the SAME foreign binding's hard call —
// so a finding cannot have been caused by the import, the navigation, or the value read.

import { test } from "@playwright/test";
import { expect } from "other-assert";

test("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  const total = await page.getByTestId("invoice-total").textContent();
  // MUTATE-REMOVE-START
  expect.soft(total).toBe("$42.00");
  // MUTATE-REMOVE-END
  expect(total).toBe("$42.00");
});
