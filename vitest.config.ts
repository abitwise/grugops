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
  },
});
