// import-rename.uat.spec.ts — the IMPORT-RENAME fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for WR-14 of 31-REVIEW.md and gap 1 of
// 31-VERIFICATION.md round 3: the head segment of a resolved path was compared against the banned
// head set WITHOUT canonicalising an import rename first, so `import { test as it }` followed by
// `it.skip(...)` and `it.describe.only(...)` was reported as `0 findings over 1/1 uat specs checked`
// at exit 0 — a head-set check defeated by two words in the import line.
//
// The rename is resolvable from the AST's own literal `propertyName`, with no type checker, which is
// why D-18 (3) DECIDES it rather than disclosing it. The residual that remains is the MODULE SCOPE:
// a rename arriving through any module other than `@playwright/test` is still not canonicalised.
//
// MUTATION CONTRACT. The marked region holds the two planted modifier calls and nothing else. What
// survives the deletion is a STRUCTURALLY IDENTICAL twin of the same two scenarios, written on the
// same renamed binding without a modifier — so a finding here cannot have been caused by the rename
// itself, by the scenario, by the selectors or by the assertion, only by the planted modifier.

import { test as it, expect } from "@playwright/test";

// MUTATE-REMOVE-START
it.skip("the invoice total is shown, removed", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});

it.describe.only("refunds, run alone", () => {
  it("the refund status is shown", async ({ page }) => {
    await expect(page.getByTestId("refund-status")).toHaveText("Issued");
  });
});
// MUTATE-REMOVE-END

it("the invoice total is shown (the same scenario, not removed)", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});

it.describe("refunds (the same group, not narrowed)", () => {
  it("the refund status is shown", async ({ page }) => {
    await expect(page.getByTestId("refund-status")).toHaveText("Issued");
  });
});
