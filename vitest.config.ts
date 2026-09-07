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
    exclude: [...configDefaults.exclude, "**/scripts/runnable-ref/fixtures/**"],
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
