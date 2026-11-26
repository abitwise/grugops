## Deferred Items

- installer fs census names an unclassified Node export `openAsBlobSync`
  status: open
  **Found during:** plan 45-01, full-suite run (2026-11-26, Node v26.12.1).
  **What:** `install/installer-fs-census.test.ts` › "every node:fs export whose name may mark a content read is classified" fails with `UNCLASSIFIED node:fs export openAsBlobSync`. The export comes from the Node runtime on this machine, not from any file plan 45-01 changed; the test file was last changed in d865a456. Out of scope for 45-01: classify `openAsBlobSync` in CONTENT_READER or NOT_CONTENT_READER in its own change.
