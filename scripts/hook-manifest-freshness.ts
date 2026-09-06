// hook-manifest-freshness.ts — the decider-closure manifest inside hooks/hook-entry.ts is a
// deterministic product of the emitted `.js` import graph (plan 30-11 round 4, `RA5-5`).
//
// The wrapper refuses to run a decider whose code does not match the manifest it carries. That is
// only worth anything if the manifest is a faithful derivation, so this gate re-derives it and
// refuses any drift — the same contract every other freshness gate in this repository carries.

import { isEntrypoint } from "./is-entry.js";
import { rewriteHookEntry, deriveManifest } from "./generate-hook-manifest.js";

const isEntry = isEntrypoint(import.meta.url);

if (isEntry) {
  try {
    const { changed } = rewriteHookEntry();
    const m = deriveManifest();
    const n = Object.values(m).reduce((a, per) => a + Object.keys(per).length, 0);
    if (changed) {
      console.log(
        "Hook-manifest freshness check FAILED: hooks/hook-entry.ts's manifest is not a derivation of " +
          "the current emitted import graph. A decider module changed without the wrapper's manifest " +
          "moving, which means the wrapper would refuse to run it — or, worse, that the manifest was " +
          "written by hand. Remedy: npm run generate:hook-manifest, then commit hook-entry.ts, " +
          "hook-entry.js and the D-24 freeze together.",
      );
      process.exit(1);
    }
    console.log(`Hook manifest fresh: ${Object.keys(m).length} decider(s), ${n} module hash(es) match a fresh derivation.`);
    process.exit(0);
  } catch (e) {
    console.log(`Hook-manifest freshness check FAILED: ${(e as Error).message}`);
    process.exit(1);
  }
}
