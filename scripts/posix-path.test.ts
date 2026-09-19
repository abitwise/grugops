// posix-path.test.ts — the separator-parameterized normalizer, exercised in the Windows spelling on
// whatever host runs it (Phase 33 / CAP-02, D-15).
//
// WHY THE SEPARATOR IS A PARAMETER, STATED AS THE TEST'S OWN PREMISE. The repository's established
// one-liner — `p.split(sep).join("/")` — splits on the HOST separator, so on a POSIX developer box it
// is the identity and no assertion over it can tell the normalizer from a function that does nothing.
// The two-argument form takes the separator explicitly, which is what lets the backslash case below
// run RED on this host when the normalization is deleted: that is the mutation proof, and the
// reason the module has two exports rather than one.
//
// EVERY CASE IS PLATFORM-INDEPENDENT. Nothing here reads `process.platform`; the host-bound wrapper
// is asserted against the two-argument form with the host's own `sep`, so the case is the same
// sentence on Windows and on POSIX and measures the binding rather than the platform.

import { describe, expect, it } from "vitest";
import { sep, win32, posix } from "node:path";
import { toPosix, toPosixWith } from "./posix-path.js";

describe("posix-path — the separator-parameterized normalizer (D-15)", () => {
  it("an explicit backslash separator maps `a\\b\\c` to `a/b/c` — the mutation-provable case", () => {
    // THE ONE ASSERTION THAT DISCRIMINATES ON A POSIX HOST. With the normalization deleted (an
    // identity body) this reads `a\b\c` and reds; with it present it reads `a/b/c`. Everything
    // else in this file is a property the identity would also satisfy for a POSIX input.
    expect(toPosixWith("a\\b\\c", win32.sep)).toBe("a/b/c");
  });

  it("an explicit forward-slash separator leaves `a/b/c` byte-identical", () => {
    expect(toPosixWith("a/b/c", posix.sep)).toBe("a/b/c");
  });

  it("is idempotent under both separators", () => {
    const back = "x\\y\\z.md";
    const fwd = "x/y/z.md";
    expect(toPosixWith(toPosixWith(back, win32.sep), win32.sep)).toBe(toPosixWith(back, win32.sep));
    expect(toPosixWith(toPosixWith(fwd, posix.sep), posix.sep)).toBe(toPosixWith(fwd, posix.sep));
    // …and the second application of the backslash form is a no-op on the already-normalized value.
    expect(toPosixWith(toPosixWith(back, win32.sep), win32.sep)).toBe("x/y/z.md");
  });

  it("a MIXED spelling under the backslash separator collapses to one forward-slash form", () => {
    // Windows accepts both separators in one path, and `path.win32.join` of a POSIX literal against
    // a host-spelled prefix produces exactly this mixed shape before the normalizer sees it.
    expect(toPosixWith("plans\\tickets/ABC-001.md", win32.sep)).toBe("plans/tickets/ABC-001.md");
    expect(toPosixWith(win32.join(".grugops", "context"), win32.sep)).toBe(".grugops/context");
  });

  it("the host-bound wrapper IS the two-argument form bound to the host separator", () => {
    // Asserted as an equality with the two-argument form rather than against a literal, so the
    // sentence is the same on every host: on Windows both sides rewrite, on POSIX neither does.
    // The POSIX input passes through byte-identical on every host (the plan's no-op guarantee).
    for (const p of ["a/b/c", "plans/board.md", ".grugops/context", "a\\b", "C:\\x\\y", ""]) {
      expect(toPosix(p)).toBe(toPosixWith(p, sep));
    }
    expect(toPosix("plans/tickets/ABC-001.md")).toBe("plans/tickets/ABC-001.md");
  });

  it("a refusal message built from a backslash-spelled relative path renders forward slashes", () => {
    // The D-15 behaviour at the message boundary, shown over the normalizer itself: the relative
    // computation's separator does not reach the published sentence.
    const rel = win32.relative("C:\\repo", "C:\\repo\\plans\\tickets\\ESCAPE.md");
    expect(rel).toBe("plans\\tickets\\ESCAPE.md"); // the premise: win32.relative spells with `\`
    const message = `refused: ${toPosixWith(rel, win32.sep)} leaves the tree`;
    expect(message).toBe("refused: plans/tickets/ESCAPE.md leaves the tree");
    expect(message).not.toContain("\\");
  });

  it("a Windows drive-absolute path keeps its drive and loses only its separators", () => {
    expect(toPosixWith("C:\\Users\\r\\repo\\plans\\board.md", win32.sep)).toBe(
      "C:/Users/r/repo/plans/board.md",
    );
  });

  it("an EMPTY separator is refused by name rather than splitting every character", () => {
    // `"abc".split("")` is `["a","b","c"]`, so an empty separator would silently rewrite `abc` to
    // `a/b/c`. That is a caller defect, and it is refused loudly rather than produced.
    expect(() => toPosixWith("abc", "")).toThrow(/empty separator/);
  });
});
