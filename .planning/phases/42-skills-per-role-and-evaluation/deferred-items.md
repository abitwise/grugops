## Deferred Items

- Installer census reds from plan 42-08, found by the 42-07 full-suite run
  status: open
  **What:** `install/mode-census.test.ts` fails 4 cases (the scripts test count is 85, pinned at 83; an untagged chmod; a tag outside the closed set; the installer scanned set changed) and `install/path-spelling-census.test.ts` fails 3 cases (a second absoluteness rule; the scanned test set changed; a leading-`/` absolute test at `install/host-tools.test.ts:1875`).
  **Source:** commit 84faa547 (`test(42-08)`) and the scripts test modules added earlier in phase 42, all before 42-07's base 2f38172a. 42-07 adds no test module, no chmod and no absoluteness check.
  **Why deferred:** outside 42-07's scope; the census pins move only with a reading of each new chmod and path test.
