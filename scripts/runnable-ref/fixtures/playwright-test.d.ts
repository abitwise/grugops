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
// only spelling Playwright has, which is why `BANNED_CONSTRUCTS` had to gain the three
// `test.describe.*` paths.

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

  export interface Describe {
    (title: string, body: () => unknown): void;
    readonly skip: DescribeModifier;
    readonly only: DescribeModifier;
    readonly fixme: DescribeModifier;
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
