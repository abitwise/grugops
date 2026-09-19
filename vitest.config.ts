import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    // scripts/runnable-ref/fixtures/*.uat.spec.ts match Vitest's default `**/*.spec.ts` include,
    // but they are NOT tests: they are the parse corpus uat-spec-integrity.js is pointed at, and
    // they import @playwright/test, which this repository deliberately does not depend on.
    // Collecting them would fail the run on a module resolution error and, worse, would run the
    // very constructs the checker exists to refuse. The default exclude list is SPREAD rather than
    // replaced, so node_modules/dist/etc. stay excluded — assigning `exclude` overrides the
    // defaults outright.
    //
    // `**/.temp/**` is excluded for a MEASURED reason, not a tidiness one (plan 31-27, MOVEMENT 0).
    // `.temp/` is this repository's scratch root for probes, and it is gitignored at `.gitignore:19`.
    // Round 5 left a spec file under `.temp/`; the runner COLLECTED it — a scratch probe is a
    // `*.test.ts`/`*.spec.ts` as far as the default include glob is concerned — and the run died on
    // SIGSEGV. Every `git status`-based residue gate in rounds 3, 4 and 5 stayed silent about it,
    // because a gitignored path is invisible to `git status`. So the residue predicate for a probe is
    // a REAL listing (`find .temp -mindepth 1`) plus a FIFO sweep, and the runner is told not to
    // collect from there at all.
    //
    // This stops COLLECTION only. It does NOT stop `scripts/freshness.test.ts` from using
    // `.temp/freshness-clones/` as a working directory — that suite creates and reads real clones
    // under `.temp/` from inside a test that lives in `scripts/`, and an exclude pattern governs
    // which FILES vitest turns into test files, never which paths a running test may touch.
    exclude: [
      ...configDefaults.exclude,
      "**/scripts/runnable-ref/fixtures/**",
      "**/.temp/**",
    ],
    // Several gate oracles (catalog-freshness, generate-catalog, freshness) exercise
    // the REAL working tree — regenerating the committed catalog, planting transient
    // drift into docs/catalog/README.md, or dropping a non-conforming file into
    // agent-factory/roles. Vitest runs test FILES in parallel workers by default, so
    // those real-tree mutations race across files (a bad role planted by one file is
    // visible to a generator another file is reading), producing intermittent failures.
    // The suite is small; serialize file execution so the shared-tree gate tests stay
    // isolated from one another.
    fileParallelism: false,
    // Three bounds, each MEASURED from CI run 35394268365 (2026-09-18, both matrix legs), landed
    // by plan 33-02 for D-14 ("add warning, don't prevent test run").
    //
    // Before this block the `test` object set no bound at all, so every test inherited vitest's
    // 5000 ms default and 12 tests on the windows leg / 8 on the ubuntu leg died at it. The
    // slowest COMPLETED test on any leg measured 85568 ms (windows leg, `every gate-plantable
    // corpus row moves the gate from exit 0 to exit 1, with the refusal TEXT read from the gate's
    // own output`), and it passes today only because it carries an explicit per-test timeout
    // argument. So 85568 ms is a measured FLOOR: a global bound below it would be a bound that
    // fires on a slower runner against a test that is known to complete. The failing set's true
    // durations are UNMEASURED — vitest reports elapsed time on a cut test, not the bound (the
    // deepest-directory probe reported 33354 ms while being cut at 5000 ms) — so 180000 ms is a
    // CHOICE ABOVE THE MEASURED FLOOR, not a derivation from it. A genuine hang still dies here.
    // The next pushed CI run reports the new slowest test; plan 33-09 re-measures against it.
    testTimeout: 180_000,
    // A separate bound for hooks, because `testTimeout` does not govern them: one measured breach
    // is a `beforeAll` in `scripts/check-foundation-guards.test.ts` dying at the inherited
    // `Error: Hook timed out in 10000ms`, which D-14's wording (`testTimeout` only) would have
    // left red.
    hookTimeout: 120_000,
    // Every test that used to die at the old 5000 ms default is now PRINTED as slow by the
    // reporter and still runs to completion. The rule is warn, never prevent: a slow test is a
    // measurement to read, not a failure to hide.
    slowTestThreshold: 5_000,
    // No bound in this file may become conditional on the host operating system. A bound that
    // reads the platform converts an unmeasured outcome on one leg into a green on the other:
    // the slow test is no longer observed, only excused. A red on a platform is the measurement
    // arriving (CONTEXT D-14, D-16).
  },
});
