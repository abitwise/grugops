// playwright-test.d.ts — the DECLARED `@playwright/test` surface the fixture corpus compiles against.
//
// WHAT THIS FILE IS. A hand transcription of the small part of the `@playwright/test` API that
// scripts/runnable-ref/fixtures/*.uat.spec.ts uses, written at the `1.62.1` pin this kit's sibling
// recipe (agent-factory/checklists/playwright-visual-regression-recipe.md) documents.
//
// WHAT THIS FILE IS NOT. It is NOT the package, and it is NOT an authority on the package's API.
// grugops ships zero runtime dependencies and its dev dependency set is fixed at
// `{typescript, vitest}` plus the type-only `@types/node` by CLAUDE.md, so `@playwright/test`
// cannot be installed here to derive this surface mechanically. Its drift from the upstream package
// is an open `UNKNOWN - verify`: nothing in this repository re-checks it against a released
// Playwright, and a reader must not read it as a statement about what Playwright currently exports.
// The simplifications are deliberate and are part of that disclosure: every modifier below carries
// the title-plus-body signature the corpus writes plus one loose catch-all, where the real package
// carries a richer overload set (a bare `test.skip()`, a condition-plus-description form), and one
// `Assertions` interface stands in for Playwright's split generic and locator matchers.
//
// WHAT IT DOES ESTABLISH, and why it earns its place. A fixture that imports a binding this surface
// does not carry FAILS `npm run typecheck`. That is exactly the defect 31-VERIFICATION.md recorded:
// `union-all-arms.uat.spec.ts` imported a top-level `describe` from `@playwright/test` — a binding
// the package does not export — and both tsconfig targets excluded the fixtures directory, so the
// corpus meant to prove arm (c) could never have caught the arm being wrong.
//
// THE ABSENCE IS THE POINT. There is deliberately NO `describe` export below. `test.describe` is the
// only spelling Playwright has. That absence is why the D-17 ban rule keeps the bare `describe`
// HEAD in `BANNED_MODIFIER_HEADS` rather than dropping it: the head is retained because D-14 named
// it and because another framework's bare `describe` can be imported into a spec file, not because
// this package exports one.
//
// WHAT THIS FILE IS NOW USED FOR, AND WHY THAT RAISES THE COST OF ITS DRIFT (31-11, WR-13). It has
// stopped being only a compile target for the corpus. `uat-spec-integrity.test.ts` reads it as the
// authority for a coverage-ADJACENT claim: it partitions the spellings the ban rule decides by
// asking which heads this surface exports, and compiles the exported side against it. Today that
// check runs in ONE DIRECTION — every banned spelling is real. The REVERSE partition, which asks
// whether every real modifier on this surface is banned, lands in plan 31-12; the members added
// below (`serial`, `parallel`, `configure`, `fail`) are what give that reverse check something to
// find. Until it lands, no claim about completeness against Playwright is established here.
//
// The drift disclosure above is UNCHANGED and still governs: this file remains a hand transcription
// and an open `UNKNOWN - verify` (`R-07`). A claim proven against this surface is a claim about the
// DECLARED surface, never about the package.

declare module "@playwright/test" {
  /** The subset of `Locator` this corpus calls. */
  export interface Locator {
    click(options?: unknown): Promise<void>;
    hover(options?: unknown): Promise<void>;
    fill(value: string, options?: unknown): Promise<void>;
    isVisible(options?: unknown): Promise<boolean>;
    textContent(options?: unknown): Promise<string | null>;
  }

  /** The subset of `Page` this corpus calls. */
  export interface Page {
    goto(url: string, options?: unknown): Promise<unknown>;
    reload(options?: unknown): Promise<unknown>;
    url(): string;
    waitForLoadState(state?: string, options?: unknown): Promise<void>;
    getByTestId(testId: string): Locator;
    getByRole(role: string, options?: { readonly name?: string }): Locator;
  }

  /** The built-in fixtures a corpus test body destructures. */
  export interface TestArgs {
    readonly page: Page;
  }

  /**
   * A modifier or hook member. TWO signatures, and both are deliberate.
   *
   * The FIRST is the title-plus-body form the corpus writes, and it is what gives a fixture's
   * `async ({ page }) => {}` body its contextual type; without it every corpus body would be an
   * implicit `any` and the target would report TS7031 instead of checking anything useful.
   *
   * The SECOND is a loose catch-all. The ban-set harness in uat-spec-integrity.test.ts asks only
   * whether a banned spelling EXISTS on this surface and is CALLABLE, and writes each one as a
   * single-argument call. Arity fidelity beyond that would misstate an overload set this file
   * cannot verify — Playwright's real modifiers also accept a bare call and a
   * condition-plus-description form.
   */
  export interface TestModifier {
    (title: string, body: (args: TestArgs) => unknown): void;
    (...args: readonly unknown[]): void;
  }

  /** The same two signatures, for a body that takes no fixtures. */
  export interface DescribeModifier {
    (title: string, body: () => unknown): void;
    (...args: readonly unknown[]): void;
  }

  /**
   * A ROUTING GROUP — `test.describe.serial` / `test.describe.parallel`. It is callable in its own
   * right (a group whose tests run in order, or side by side) AND it carries the same modifiers the
   * describe group carries, which is what makes `test.describe.serial.only(...)` a real spelling.
   *
   * `UNKNOWN - verify` at the same strength as the rest of this file: these two members are a hand
   * transcription. The corpus needs them because CR-06 was reproduced with them and because the
   * false-positive control calls them WITHOUT a modifier; nothing here re-checks them against a
   * released Playwright.
   */
  export interface DescribeGroup {
    (title: string, body: () => unknown): void;
    readonly skip: DescribeModifier;
    readonly only: DescribeModifier;
    readonly fixme: DescribeModifier;
  }

  export interface Describe {
    (title: string, body: () => unknown): void;
    readonly skip: DescribeModifier;
    readonly only: DescribeModifier;
    readonly fixme: DescribeModifier;
    readonly serial: DescribeGroup;
    readonly parallel: DescribeGroup;
    // The configuration call. Its tail is not a modifier, so the D-17 rule must NOT refuse it —
    // that is the false-positive control's job, and this member is what lets the control compile.
    readonly configure: (options: { readonly mode?: string; readonly retries?: number }) => void;
  }

  export interface Test {
    (title: string, body: (args: TestArgs) => unknown): void;
    readonly skip: TestModifier;
    readonly only: TestModifier;
    readonly fixme: TestModifier;
    // 31-11 (D-17, WR-12): the INVERTING modifier. Playwright runs the scenario and reports a
    // failing assertion as a pass, so on a `*.uat.spec.ts` its effect is strictly worse than
    // `skip` — the scenario is not removed from the evidence, it is inverted. It is declared here
    // because the ban rule now decides it and the ban-set/surface cross-check compiles every
    // spelling the rule decides.
    readonly fail: TestModifier;
    readonly step: TestModifier;
    readonly beforeEach: TestModifier;
    readonly afterEach: TestModifier;
    readonly describe: Describe;
  }

  /** The subset of the matcher surface this corpus calls. */
  export interface Assertions {
    toBe(expected: unknown): void;
    toContain(expected: unknown): void;
    toHaveText(expected: string, options?: unknown): Promise<void>;
    toBeVisible(options?: unknown): Promise<void>;
    toBeDisabled(options?: unknown): Promise<void>;
  }

  export interface Expect {
    (actual?: unknown, message?: string): Assertions;
    readonly soft: (actual?: unknown, message?: string) => Assertions;
  }

  export const test: Test;
  export const expect: Expect;
}
