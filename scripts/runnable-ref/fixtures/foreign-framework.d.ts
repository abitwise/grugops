// foreign-framework.d.ts — the AMBIENT surface of TWO NON-PLAYWRIGHT modules, for CR-23.
//
// WHY THIS FILE EXISTS. `CR-23` of the round-7 review is about a ban the framework does not own.
// `@playwright/test` exports no top-level `describe`, which is exactly why `BANNED_MODIFIER_HEADS`
// retains one: the head is kept for ANOTHER framework's bare `describe` imported into a spec file.
// The `D-30 (2)` identity cutover then made the `foreign` answer TERMINAL, so that head became
// unreachable for the one case it was retained for — and the corpus never noticed, because every
// row it drove spelled `describe` as an UNDECLARED name, which the identity route declines anyway.
//
// A corpus that drives the spelling a head does NOT exist for is a denominator that cannot observe
// the property it claims. These declarations give the corpus the spelling the head DOES exist for.
//
// WHY IT IS AMBIENT AND HAND-WRITTEN. The same reason `playwright-test.d.ts` is: this repository's
// dev dependency set is fixed at `{typescript, vitest}` by CLAUDE.md, so no second test framework
// and no second assertion library can be installed to measure against. These modules do not exist
// on disk anywhere; they exist only as declarations, which is precisely the shape a target's own
// `types/` directory takes. The installed-package route stays the open `UNKNOWN - verify` carried
// beside `R-07`.
//
// WHAT IT IS NOT. It is not a transcription of any real package's API. The members below are the
// SHAPE the ban is about — a head with a banned tail member, and an assertion head with a `soft`
// member — and nothing more. Reading it as documentation of any shipped library would be wrong.
//
// D-35 (2026-09-11): a callee whose declaration comes from a `declare module "…"` block or from a
// declaration file is `foreign-declared`, and the spelling rule answers for it. Both blocks below
// are that shape, in a `.d.ts`, so they exercise BOTH halves of the discriminant at once; the
// declaration-FILE half alone is driven separately by a generated row.

declare module "other-framework" {
  /**
   * Another framework's own `describe`, with the modifier member the ban is about. The call
   * signature is what makes the bare `describe("…", …)` spelling legitimate — a single-segment
   * path is a plain call and the rule does not refuse it.
   */
  export const describe: {
    (title: string, body: () => void): void;
    skip(title: string, body: () => void): void;
    only(title: string, body: () => void): void;
  };
}

declare module "other-assert" {
  /**
   * Another assertion library's `expect`, with the `soft` member. A soft assertion records a
   * failure without failing the scenario, so a green lane certifies a scenario whose acceptance
   * criterion failed — the harm `BANNED_EXACT_PATHS` exists for, in a library Playwright does not
   * declare.
   */
  export const expect: {
    (actual: unknown): { toBe(expected: unknown): void };
    soft(actual: unknown): { toBe(expected: unknown): void };
  };
}
