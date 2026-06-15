import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
