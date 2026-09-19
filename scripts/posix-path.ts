// posix-path.ts — the ONE home of the published-path normalizer (Phase 33 / CAP-02, D-15).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHAT THIS IS FOR, AND WHAT IT IS DELIBERATELY NOT FOR.
//
// Any path this tooling PUBLISHES — a scan-set dedupe key, an adapter path a gate prints or
// counts, a repo-relative spelling in a verdict line — is normalized to forward slashes exactly
// once, in the module that emits it, and the tests assert the POSIX form (D-15). The measured
// defect this closes: a key built with the host separator (`agent-factory\config\x.md`) never
// collides with the same document's forward-slash key supplied by another derivation, so a dedupe
// over-counts, an overlap reads zero, and a named region is found zero times in one case and twice
// in another (`.planning/phases/33-*/33-RESEARCH.md`, Class B).
//
// It is NOT applied at a comparison point where the path is never published. A containment test
// such as `rel.startsWith(\`..${sep}\`)` reasons about the HOST's spelling on purpose, and a path
// that is opened rather than printed is a location, not a spelling. Normalizing those is the
// over-application RESEARCH Pitfall 3 names as its own defect; the plan summary records the
// partition so a reviewer can check it rather than trust it.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THE SEPARATOR IS A PARAMETER.
//
// The repository's established one-liner — `p.split(sep).join("/")`, present in seven freshness
// modules — is correct and stays where it is. But it splits on the HOST separator, so on a POSIX
// developer box it is the identity and no assertion over it can discriminate the normalizer from
// a function that does nothing. `toPosixWith` takes the separator explicitly; a test hands it
// `path.win32.sep` and the Windows spelling is exercised — and mutation-provable — on any host.
// `toPosix` is that same function bound to the host separator, which is the form production code
// calls: it never needs to know which platform it is on, and it must NOT rewrite a backslash on a
// POSIX host, where a backslash is a legal filename byte.
//
// Node stdlib only. No I/O, no process state, no dependency.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { sep } from "node:path";

/**
 * Spell `path` with forward slashes, treating every occurrence of `separator` as a separator.
 *
 * Forward slashes already present are kept, so a mixed spelling (`plans\tickets/ABC.md`, the
 * shape `path.win32.join` produces from a POSIX literal) collapses to one form. Idempotent: the
 * result contains no `separator` unless `separator` is `/` itself, in which case the call is the
 * identity.
 *
 * An EMPTY separator is refused rather than honoured: `"abc".split("")` splits every character
 * and would silently rewrite `abc` to `a/b/c`. That is a caller defect, not a spelling.
 */
export function toPosixWith(path: string, separator: string = sep): string {
  if (separator === "") {
    throw new Error(
      "posix-path.toPosixWith: refusing an empty separator — it would split every character. " +
        "Pass the separator the path was spelled with (`path.sep`, `path.win32.sep`).",
    );
  }
  if (separator === "/") return path;
  return path.split(separator).join("/");
}

/** `toPosixWith` bound to the host separator — the form production publishing sites call. */
export function toPosix(path: string): string {
  return toPosixWith(path, sep);
}
