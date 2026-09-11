// local-helper-head.uat.spec.ts — WR-26's CONTROL fixture for uat-spec-integrity.js.
//
// A parse CORPUS file, not a test, and it must report ZERO findings at exit 0 — before D-35 and
// after it. It carries NO mutation region for that reason: there is nothing here to remove.
//
// WHY IT EXISTS. `D-35` widens the ban back over a `foreign` callee whose declaration comes from
// another module's DECLARATION SURFACE. Every widening of a spelling rule in this file's history has
// cost a FALSE REFUSAL somewhere — `WR-20`, then `WR-23`, then `WR-26`, each one reporting a
// construct the file does not contain, which the recipe calls worse than a missed one. This fixture
// is the shape that keeps paying: a LOCAL binding whose name collides with a renamed import's local
// name, called with a member the ban set retains as a tail.
//
// It is driven in the SAME run as the refusing rows, so the union is proven to stay in the REFUSING
// direction only. Three local shapes are present, because the false refusals were three:
//   - a function-expression PARAMETER at index 1 of a non-`test(...)` call's second argument (WR-26),
//   - an ordinary helper's parameter at index 1 (WR-23),
//   - a module-scope `const` declared in this file's own source (the plain local shape).
//
// Every `skip` member reached below is declared by an anonymous type literal inside this file's own
// `.ts` source, so `D-35` answers `foreign-local` for all three and the spelling rule is never
// consulted. None of them is `@playwright/test`'s, and none of them is another module's declaration
// surface.

import { test as it, expect } from "@playwright/test";

declare function helper(
  n: number,
  f: (a: number, b: { skip: (x: number) => number }) => number,
): void;

const helpers = {
  skip(x: number): number {
    return x;
  },
};

// WR-26's shape: `it` is parameter index 1 of a function expression passed as the SECOND ARGUMENT
// of a call that is not `test(...)`.
helper(1, function (a, it) {
  return it.skip(a);
});

// WR-23's shape: `it` is parameter index 1 of an ordinary helper.
function inner(n: number, it: { skip: (x: number) => number }): number {
  return it.skip(n);
}
void inner(1, helpers);

// The plain local shape: a module-scope binding this file declares, named like a renamed import's
// local name, carrying a banned tail member.
const describe = {
  skip(title: string, body: () => void): void {
    void title;
    void body;
  },
};
describe.skip("a local object that is nobody's test framework", () => {
  void 0;
});

it("the invoice total is shown", async ({ page }) => {
  await page.goto("/billing");
  await expect(page.getByTestId("invoice-total")).toHaveText("$42.00");
});
