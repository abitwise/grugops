---
type: observation
role: orchestrator
task: wave-2026-09-25
at: 2026-10-18T13:49:00Z
sealed: false
refs: [ABC-170, NFR-005]
---

# ABC-170 A6 (NFR-005): the first window is VOID, and no reading is quoted

- At 13:29:35Z a background watcher reported 180 s with no vitest processes. A foreground `ps` at 13:29:51Z counted 4 foreign processes,
  including a vitest under `Projects/public/grugops` with an elapsed time of 06:41, so it had been running throughout that "quiet"
  window. The background shell evidently cannot see other sessions' processes. From now on, quiet windows are judged only from the
  foreground.
- An `ENGINE_DEEP=1 … -t "NFR-005"` run at tip `36e3a753` completed during that window. Its output is **void** under the quiet-window
  rule: it is not quoted as A6, and no number from it counts.
- Foreground waits from 13:30 to 13:48:32Z saw no 180 s quiet stretch.
- A6 stays OPEN. The next attempt happens in a foreground-verified window. It must not overlap ABC-166's width-1 verdict run tonight:
  either take it before that run, or after it ends.
