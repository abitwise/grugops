// shadowed-rename.uat.spec.ts — the FALSE-POSITIVE CONTROL fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It exists for WR-20 of 31-REVIEW.md and behavioral spot-check
// row 7 of 31-VERIFICATION.md round 4: `canonicaliseHeadSegment` rewrote a resolved path's head
// segment whenever that segment was a key of the file-level import-rename map, with NO scope
// analysis at all. A legitimate spec that renames the framework import to `it` AND separately binds
// a local `it` to an ordinary object was therefore REFUSED — and the finding named `test.skip`, a
// construct that does not appear anywhere in this file. A checker that misnames what it found
// trains a reader to work around it, which is why the failure direction of a FALSE REFUSAL is worse
// than a missed one here.
//
// Measured against the committed .js at HEAD before 31-17's change:
//   UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
//   uat/p.uat.spec.ts:4: banned modifier call — `test.skip` decides which scenarios the quality
//   gate re-runs …
//   EXIT=1
//
// THE CONTRACT OF THIS FIXTURE IS THE OPPOSITE OF THE OTHERS'. It carries NO marked mutation region
// and NO banned construct. Its whole job is to stay at ZERO findings: it is the control that says
// the scope rule 31-17 added did not buy its correctness by refusing less of the real thing. The
// genuine renamed and namespaced spellings stay refused by `import-rename.uat.spec.ts`, and the
// two fixtures must be read together — one proves the rule still fires, this one proves it does not
// fire on a file whose own source text says the name is bound to something else.
//
// ONE DELIBERATE DEVIATION FROM THE REVIEW'S TEXT. The review's reproduction called
// `page.locator("x")`; this corpus type-checks against `fixtures/playwright-test.d.ts`, whose
// hand-transcribed `Page` carries `getByTestId` and not `locator`. The selector is not the shape
// under test — the shadowing binding is — so the call is written with the member the declared
// surface carries rather than adding a member to that surface for a control fixture's convenience.

import { test as it, expect } from "@playwright/test";

it("the invoice total is shown", async ({ page }) => {
  // A LOCAL object that happens to carry a `skip` member. Nothing framework-related about it.
  const helpers = { skip: (n: number) => n };
  // A LOCAL parameter named `it`, shadowing the renamed framework import for this function's body.
  // `it.skip(1)` here is a call on that parameter and has nothing to do with the modifier family.
  function inner(it: { skip: (n: number) => number }): number {
    return it.skip(1);
  }
  inner(helpers);
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
