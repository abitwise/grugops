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
// WHAT THIS FILE IS NOW USED FOR, AND WHY THAT RAISES THE COST OF ITS DRIFT (31-11 and 31-12,
// WR-13). It has stopped being only a compile target for the corpus. `uat-spec-integrity.test.ts`
// reads it in BOTH directions, and the second one makes it the DENOMINATOR of a coverage
// assertion rather than only a compile target:
//
//   FORWARD  — every spelling the ban rule decides has its head exported here, and the call
//              type-checks against this surface. This answers "is every banned spelling real?"
//   REVERSE  — every member reachable by walking this file's declared types with the TypeScript
//              checker is either refused by the ban rule or carries a written reason for not being
//              refused, asserted as a TOTAL partition whose cardinality is checked. This answers
//              "is every real modifier decided?" — the direction CR-01 was and CR-06 still was.
//
// SO A CHANGE HERE IS A CHANGE TO A MEASUREMENT, NOT ONLY TO A FIXTURE. Adding a member adds a row
// the reverse partition must decide: it is refused by the rule, or it needs a reason. A member with
// neither turns the suite red naming it, which is the intended behaviour and not a defect in the
// test. Removing a member shrinks the denominator silently, which is why the walk asserts it
// reached its own declared depth bound. A change must keep BOTH directions green.
//
// The drift disclosure above is UNCHANGED and still governs, and it matters more now than it did:
// this file remains a hand transcription and an open `UNKNOWN - verify` (`R-07`). The reverse
// partition establishes coverage of the DECLARED surface. It does not establish coverage of the
// package, and no reader may take it as such.

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

  /**
   * 31-13 (D-18, CR-07): the RUNTIME modifier surface, reached through `test.info()`.
   *
   * WHY IT IS DECLARED HERE, AND WHAT DECLARING IT COSTS. Playwright's TestInfo fixture carries the
   * same modifiers as the static `test` object, applied from inside a running scenario:
   * `test.info().skip()` removes the scenario's result from the evidence exactly as
   * `test.skip(...)` does, and `test.info().fail()` inverts it. The round-3 verifier reproduced all
   * three passing the committed checker at exit 0, because the resolver declined any callee chain
   * containing a call. D-18 (1) decides that shape, and the corpus fixture that carries it —
   * `modifier-call-link.uat.spec.ts` — must compile against a DECLARED surface rather than against
   * nothing, or it would be a fixture that could not fail for the reason it exists.
   *
   * THE MEMBERS BELOW ARE THE REMOVING MODIFIERS, THE INVERTING ONE AND THE TIMING ONE, and they
   * are grouped that way on purpose: the first three change WHAT the evidence contains, the last
   * changes only how long the scenario is given, which is why the rule refuses the first three and
   * not `slow`.
   *
   * WHAT DECLARING IT DOES NOT DO. It does NOT put `test.info().skip` into the reverse partition's
   * denominator. That walk is `checker.getPropertiesOfType`, which descends declared PROPERTY
   * CHAINS and does not descend through a call signature's RETURN TYPE, so a call-link spelling
   * stays outside the walked set until the walk is extended. What declaring `info` does is let the
   * FORWARD direction compile the shape, and add `test.info` itself to the walked set — a member
   * the partition must now decide. The boundary is stated in browser-uat-recipe.md's completeness
   * paragraph rather than being absorbed silently.
   *
   * `UNKNOWN - verify` at the same strength as the rest of this file: a hand transcription, not a
   * reading of the released package.
   */
  export interface TestInfo {
    readonly skip: TestModifier;
    readonly fixme: TestModifier;
    readonly fail: TestModifier;
    readonly slow: TestModifier;
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
    // 31-12 (WR-13): a modifier that is NOT refused, and the reason it is declared here. Playwright
    // files `slow` in the same modifiers group as `skip`, `only`, `fixme` and `fail`, but its effect
    // is to triple the time budget a scenario is given — the scenario still runs and its assertions
    // are still read. Without a member of this shape the reverse partition's non-refused bucket
    // would hold only hooks, structure and configuration, and it would never have to decide a
    // member that is a modifier by the framework's own taxonomy. It is here so the reverse question
    // could have gone the other way. `UNKNOWN - verify` at the same strength as the rest of this
    // file: a hand transcription, not a reading of the package.
    readonly slow: TestModifier;
    readonly step: TestModifier;
    readonly beforeEach: TestModifier;
    readonly afterEach: TestModifier;
    readonly describe: Describe;
    // 31-13 (D-18, CR-07): the accessor for the runtime modifier surface above. The ACCESSOR itself
    // removes no scenario and inverts no result — its MEMBERS do, and they are refused through the
    // call-link resolution D-18 decided, which this file's reverse walk cannot reach.
    readonly info: () => TestInfo;
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
    // 31-13 (D-18, CR-07): the CONFIGURED matcher. It returns another `Expect`, which is what makes
    // `expect.configure({ soft: true })(locator).toBeVisible()` a real spelling — and what made it
    // an escape the resolver never asked the rule about. The path alone is legitimate
    // (`expect.configure({ retries: 2 })` changes no result), so it is the PAIR of path and enabled
    // option that D-18 (2) refuses. `UNKNOWN - verify` at this file's stated strength.
    readonly configure: (options: {
      readonly soft?: boolean;
      readonly retries?: number;
      readonly timeout?: number;
    }) => Expect;
  }

  export const test: Test;
  export const expect: Expect;
}
