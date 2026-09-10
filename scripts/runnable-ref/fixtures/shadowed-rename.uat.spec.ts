// shadowed-rename.uat.spec.ts — the UNION fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test. It began as the FALSE-POSITIVE CONTROL for WR-20 of 31-REVIEW.md
// and behavioral spot-check row 7 of 31-VERIFICATION.md round 4: `canonicaliseHeadSegment` rewrote a
// resolved path's head segment whenever that segment was a key of the file-level import-rename map,
// with NO scope analysis at all. A legitimate spec that renames the framework import to `it` AND
// separately binds a local `it` to an ordinary object was therefore REFUSED — and the finding named
// `test.skip`, a construct that did not appear anywhere in the file. A checker that misnames what it
// found trains a reader to work around it, which is why the failure direction of a FALSE REFUSAL is
// worse than a missed one here.
//
// Measured against the committed .js at HEAD before 31-17's change:
//   UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
//   uat/p.uat.spec.ts:4: banned modifier call — `test.skip` decides which scenarios the quality
//   gate re-runs …
//   EXIT=1
//
// ITS CONTRACT IS NOW TWO-DIRECTIONAL, AND THAT IS WR-24 OF ROUND 5. As a pure zero-findings control
// this file could only ever fail for the FALSE-REFUSAL direction. A fix that disabled the
// canonicalisation entirely kept it green — and that is exactly the state 31-17 shipped and CR-14
// measured: one declaration anywhere in a file suppressed the rewrite for the WHOLE file, so a
// genuine `it.skip(...)` at module scope was ADMITTED at exit 0. The union — one spec that BOTH
// declares the shadowing name AND genuinely calls the modifier through the rename — lived in no
// corpus file, so no fixture could fail for CR-14's reason.
//
// MUTATION CONTRACT. The marked region holds ONE genuine module-scope renamed modifier call and
// nothing else, and it is asserted reported EXACTLY ONCE. What survives the deletion is the
// shadowing helper, the WR-23 second-parameter helper and a structurally identical scenario written
// on the same renamed binding WITHOUT a modifier — so the file returns to zero findings. The two
// halves are asserted in OPPOSITE directions:
//
//   region PRESENT — exactly one finding, naming `test.skip`, at the module-scope call's own line.
//                    Under 31-17's file-scoped rule this reported ZERO, so this half is the one that
//                    can fail for CR-14's reason.
//   region REMOVED — zero findings. This half is the original WR-20 control, unchanged in spirit:
//                    a local binding that shadows a renamed import is not a banned construct.
//
// ONE DELIBERATE DEVIATION FROM THE REVIEW'S TEXT. The review's reproduction called
// `page.locator("x")`; this corpus type-checks against `fixtures/playwright-test.d.ts`, whose
// hand-transcribed `Page` carries `getByTestId` and not `locator`. The selector is not the shape
// under test — the shadowing binding is — so the call is written with the member the declared
// surface carries rather than adding a member to that surface for a fixture's convenience.

import { test as it, expect } from "@playwright/test";

// MUTATE-REMOVE-START
// THE GENUINE HALF. `it` here is the renamed framework binding — nothing in this file's own source
// text binds `it` at module scope — so this IS `test.skip(...)` and it must be refused, once.
it.skip("the invoice total is shown, removed", async ({ page }) => {
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
// MUTATE-REMOVE-END

it("the invoice total is shown", async ({ page }) => {
  // A LOCAL object that happens to carry a `skip` member. Nothing framework-related about it.
  const helpers = { skip: (n: number) => n };
  // A LOCAL parameter named `it`, shadowing the renamed framework import for this function's body.
  // `it.skip(1)` here is a call on that parameter and has nothing to do with the modifier family.
  function inner(it: { skip: (n: number) => number }): number {
    return it.skip(1);
  }
  inner(helpers);
  // WR-23's SHAPE, as a second control. `it` is this helper's SECOND parameter. D-21 (2) exempted
  // index 1 of ANY function-like node from the census, so this binding was invisible, the
  // canonicalisation fired on it, and the checker reported `test.skip` — a construct absent from the
  // file. D-27 narrows the exemption to index 1 of a function that is itself a CALL's second
  // argument, which is the position the TestInfo fixture map actually binds.
  function second(n: number, it: { skip: (x: number) => number }): number {
    return it.skip(n);
  }
  second(1, helpers);
  // WR-26's SHAPE, as a THIRD control, and the position D-27's narrowing did not reach. The
  // exemption `isFixtureBindingPosition` grants is "index 1 of a function that is itself the SECOND
  // ARGUMENT of a call" — of ANY call. The map it exempts for binds only under a `test(...)`-headed
  // one. The two authorities are meant to name ONE position and they differ by exactly the set of
  // non-`test(...)` calls that take a function as their second argument, which is what this control
  // occupies: `it` is parameter index 1 of a function expression passed as `apply`'s second
  // argument, `apply` is not `test`, and nothing framework-related happens here at all.
  //
  // MEASURED AGAINST THE COMMITTED .js BEFORE THIS PLAN'S CHANGE, in its own probe file:
  //   UAT spec integrity: 1 finding(s) over 1/1 uat specs checked
  //   e2e/uat/p.uat.spec.ts:3: banned modifier call — `test.skip` …
  //   EXIT=1
  // A FALSE REFUSAL naming `test.skip`, a construct absent from the file — the identical failure,
  // with the identical misleading message, that WR-20 and then WR-23 were each convened to close.
  function apply(n: number, f: (a: number, b: { skip: (x: number) => number }) => number): number {
    return f(n, helpers);
  }
  apply(1, function (a, it) {
    return it.skip(a);
  });
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
