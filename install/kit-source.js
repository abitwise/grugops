// kit-source.ts — the SINGLE derivation of "what is in the kit source" (KIT-02, D-28).
//
// Cross-platform. Node stdlib ONLY: node:fs + node:path — ZERO npm dependencies. This module is a
// sibling of install.js and uninstall.js inside install/, resolved relative to the compiled entry
// point, so both binaries still run on a host with nothing installed.
//
// ---------------------------------------------------------------------------
// WHY THIS MODULE EXISTS (D-28, closing CR-02). ONE ANSWER TO ONE PREDICATE.
//
// These derivations used to live TWICE — once in install/install.ts and once in
// install/uninstall.ts — as what the foundation guards' own set-literal inventory called a declared
// BYTE-IDENTICAL PAIR. That pair drifted TWICE inside phase 27 alone. Round 1 re-synced it by hand;
// plan 27-22 then moved install.ts onto statSync for WR-02 and left uninstall.ts on Dirent flags. A
// Dirent for a symlink is NEITHER isFile() NOR isDirectory(), so a symlinked source adapter was
// INSTALLED by install.js and never removed by uninstall.js — reproduced end-to-end with
// `== uninstall complete ==`, exit 0, and the leftover file confirmed in the target. That is a live
// violation of the CLAUDE.md hard constraint that installers stay reversible.
//
// The remedy is STRUCTURAL, not another re-sync plus a promise: there is no longer a pair to drift,
// because there is no longer a pair. A hand-synced duplicate of one predicate is the exact drift
// class KIT-02 exists to delete, and this repository's own terminal lesson is that the fix is one
// authority per predicate. Restoring a second copy of any helper below — in either installer, or in
// a third file, on the argument that the copy is small — re-creates the defect.
//
// THE REVERSAL CAN NEVER BE NARROWER THAN THE INSTALL. The removal set and the install set are now
// the same derivation, evaluated over the same $GRUGOPS_SRC root. A source entry one side can see
// and the other cannot is an entry that installs and never reverses; that shape is now unreachable.
//
// D-18 IS AMENDED, NOT ABANDONED. This module deliberately does NOT import scripts/kit-model.ts.
// D-18's actual rationale is decoupling the installer from the `scripts/` layout, and a shared file
// INSIDE install/ preserves that in full while deleting the duplicate. D-18's separation-of-duty
// half is untouched: the installer still faithfully installs whatever exists in the kit source,
// while kit-model plus the KIT-03 referential-integrity oracle guarantee at CI time that what exists
// is correct. The two derivations are asserted EQUAL by a test rather than bought by coupling — see
// the `source derivation` conformance case in install.test.ts.
//
// EXPLICIT ROOT, NEVER A MODULE-LEVEL CONSTANT (D-22). Every derivation takes the source root as its
// first argument, following the same rule scripts/kit-model.ts follows: each importer passes the
// $GRUGOPS_SRC it already resolved, so this module never re-resolves a root of its own and no
// fourth root convention is invented. It reads no environment variable.
//
// CALL AT EACH USE SITE, NEVER CACHE. The doctor path and the install path run at different points
// in the process, and the uninstall sequence tears down wiring as it goes, so a cached snapshot
// could go stale. These are cheap directory reads; take them where they are used.
//
// ---------------------------------------------------------------------------
// FAIL-LOUD CONTRACT (27-13) — ONE contract, now literally one implementation.
//
// THREE STATES, THREE MESSAGES. `null` = the directory could not be read. `[]` = the directory was
// read successfully and holds nothing. A populated array = the set. The two failure states need
// different remedies (restore the checkout vs. investigate an empty kit), so callers report them
// distinctly and never fold them into one line. srcSkillNames and srcAdapterFiles previously
// returned [] on any read failure, so a tarball that dropped dot directories, a partial checkout or
// a permissions problem produced a SILENT no-op that still printed a completion banner (T-27-59) —
// and on the reversal side, a removal class silently skipped under `== uninstall complete ==`
// (T-27-09). Neither half may claim success over a no-op it did not perform.
//
// This contract DIVERGES DELIBERATELY from scripts/kit-model.ts's floors, which throw on an
// unreadable directory (readDirOrThrow) and refuse a zero-length set (refuseEmpty). kit-model is a
// CI authority whose consumers are guards: a vacuous scan set there passes every check, so failing
// closed is correct. The installer is a user-facing tool that must finish its other classes and
// REPORT what it could not do, rather than aborting a partially-completed install. Reporting is this
// side's fail-loud; throwing is that side's. Both refuse to be silent.
//
// ---------------------------------------------------------------------------
// FILE-NESS IS DECIDED BY statSync, DELIBERATELY, BECAUSE THAT IS THE AUTHORITY'S TEST (WR-02).
// These derivations used to filter on `Dirent` flags from readdirSync(…, { withFileTypes: true }).
// A Dirent for a SYMLINK reports isSymbolicLink() and is therefore NEITHER isFile() NOR
// isDirectory(), so a symlinked adapter failed every filter — while scripts/kit-model.ts's
// walkFilesRelative() uses statSync, which FOLLOWS the link, matching how the platform resolves a
// symlinked adapter. The two derivations disagreed, and the losing side was this one: the symlinked
// file was not installed, not refused by name, not counted, and the run still printed
// `== install complete ==`.
//
// THE INVARIANT, IN ONE SENTENCE. The installer's INSTALL set may deliberately be NARROWER than the
// authority's set — that is the flat-directory contract below — but it may never be BLIND to a
// member the authority sees, because a member it cannot see is a member it cannot refuse by name.
// The installer must not be the one place a file disappears silently.
//
// A statSync that THROWS makes the entry a non-member and never aborts the derivation, the same way
// the surrounding code treats a vanished entry (and the same way walkFilesRelative does). The
// direction is safe here: a dangling link is not a file the platform can load either, so excluding
// it cannot hide a loadable adapter — while aborting the walk WOULD hide every entry after it.
// ---------------------------------------------------------------------------
import { existsSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join } from "node:path";
// ---------------------------------------------------------------------------
// SOURCE_MARKERS / hasSourceMarkers — the D-07/CR-04 self-checkout predicate, answered ONCE
// (D-37, closing WR-02).
//
// WHY THIS LIVES HERE AND NOT IN EITHER BINARY. Until D-37 this pair was two byte-identical string
// literals, one in install.ts and one in uninstall.ts, twenty lines away from the header above that
// exists to say a hand-synced duplicate of one predicate is the exact drift class KIT-02 deletes.
// It is the same shape as the SKILLS/AGENT_REL pair D-28 collapsed, and it was left standing. So it
// is collapsed the same way: ONE exported set, ONE predicate, both binaries importing it and
// neither holding a literal. There is no longer a pair to re-sync, because there is no longer a
// pair.
//
// WHAT IS DELIBERATELY *NOT* COLLAPSED. Only the MARKER half moves here. Each binary's
// path-equality half stays where it is, because the two resolve the target DIFFERENTLY on purpose:
// uninstall.ts normalises with resolve() before comparing (its abspath() does not collapse `.`/`..`
// for sh byte-parity, so `--target /path/to/grugops/.` would slip past a raw compare), while
// install.ts compares the target as computed. Merging those two would silently pick one behaviour
// for both. Two halves, one shared, one not — and the difference is the load-bearing part.
//
// WHY THIS PAIR. A grugops source checkout carries both; a normal installed target can carry
// neither together. The installer writes .claude/, CLAUDE.md, .gemini/, .github/, .grugops/,
// plans/, memory-bank/ and tools/grugops/ into a target and NEVER an install/ directory — so a
// target carrying the installer artifact is a checkout of the kit, not a consumer of it.
// agent-factory/VERSION alone is deliberately NOT enough: install/README.md §1's minimal path tells
// users to copy agent-factory/ into their own repo, so that half legitimately appears in an
// ordinary target and refusing on it would break the very install this guard protects. BOTH are
// required; either alone is not a checkout.
//
// WHY THE RUNTIME ARTIFACT AND NOT THE TYPESCRIPT SOURCE (D-37). The marker names the COMPILED
// install/install.js, not install/install.ts. The compiled artifact is the file whose presence is
// already guaranteed wherever either binary can run at all — a host runs the committed .js with
// nothing installed (CLAUDE.md's zero-runtime-dependency constraint), so a directory that can host
// this guard has it by construction. The .ts is present only because this repository happens to
// commit both, which makes it a fact about the repo's layout rather than about the artifact the
// guard is protecting.
//
// THE FORCING FUNCTION IS THE POINT, NOT THE FILENAME. This marker half named `install/install.sh`
// for about a hundred commits after f9dab9f deleted that file with the POSIX installer (D-09). The
// condition could never fire, which is the same defect as a refusal that is documented and absent.
// Round 3 corrected WHICH file it names and added nothing that would catch the next rename: all
// three shipped fixtures manufacture their own stub, so every assertion is about the predicate over
// a fixture and every one of them stays green when the real file moves. The remedy is this
// repository's terminal lesson — DERIVE THE SET, ASSERT THE COUNT, and assert it over the REAL
// repository: install.test.ts carries a read-only case that walks THIS constant over the actual
// repo root, asserts every entry exists and asserts the length as a number. Restating either path
// as a literal anywhere else — in a binary, in a fixture, in a document — re-creates what was just
// deleted. Import the constant instead.
export const SOURCE_MARKERS = ["install/install.js", "agent-factory/VERSION"];
// hasSourceMarkers: true only when EVERY entry of SOURCE_MARKERS exists beneath `dir`. Membership
// is an AND over the whole set and is therefore order-independent: no single entry can decide the
// answer, and checking them in any order yields the same result.
export function hasSourceMarkers(dir) {
    return SOURCE_MARKERS.every((rel) => existsSync(join(dir, ...rel.split("/"))));
}
// ---------------------------------------------------------------------------
// MAX_WALK_ENTRIES — the recursive walk's WORK bound (D-35, closing WR-01).
//
// THIS IS A SECOND, SEPARATE MECHANISM FROM THE CYCLE ANSWER, AND KEEPING THEM SEPARATE IS THE
// WHOLE POINT. The `ancestors` stack below answers exactly one question — "is this directory
// already on THIS recursion path?" — and answers it correctly. It answers NOTHING about cost. A
// symlink DAG has NO cycle at all and still yields exponentially many distinct relative paths: 15
// directories each holding two forward links to their successor measured 32,767 members in 11.3
// seconds here (and 12.2 seconds in the twin), doubling with every directory added. The ancestor
// stack is right at every step of that walk; it simply is not the mechanism that bounds it.
//
// Conflating the two is what produced BOTH defects in this walk's history — the old global visited
// set tried to make one mechanism answer both questions and silently deleted a legitimate member to
// do it (CR-03). So: the ancestor stack stays PER PATH and answers membership; this counter is a
// single mutable tally threaded across the WHOLE walk and answers cost. Neither is allowed to do
// the other's job. The counter never removes a member the walk would otherwise report while it is
// under the bound.
//
// EXCEEDING IT IS A REPORTED REFUSAL, NEVER A SILENT TRUNCATION. A member that disappears without a
// name is the exact failure this module's header exists to prevent, twice over. On this side the
// documented floor is report-not-throw, so the overflow travels back in the walk's result and the
// caller surfaces it as a verification finding — the run reports INCOMPLETE rather than claiming a
// completion it did not perform. The twin in scripts/kit-model.ts carries the same constant at the
// same value and refuses through ITS floor, which is to throw.
export const MAX_WALK_ENTRIES = 10000;
// isFileFollowing / isDirFollowing — the authority's file-ness and directory-ness test, in the one
// place the three derivations below share. `false` on any stat failure (ENOENT for a dangling link,
// ELOOP for a link cycle, EACCES for an unreadable parent).
export function isFileFollowing(p) {
    try {
        return statSync(p).isFile();
    }
    catch {
        return false;
    }
}
export function isDirFollowing(p) {
    try {
        return statSync(p).isDirectory();
    }
    catch {
        return false;
    }
}
// srcSkillNames: the sorted directory names under <srcRoot>/.claude/skills that contain a
// SKILL.md. A directory without a SKILL.md is not a skill and is never installed. Null on an
// unreadable root (fail-loud); [] on a root that exists and holds no skill.
//
// Directory-ness is statSync's, not the Dirent's (see the header): a SYMLINKED skill directory that
// holds a SKILL.md is a skill, because the platform loads it as one.
export function srcSkillNames(srcRoot) {
    const root = join(srcRoot, ".claude", "skills");
    try {
        return readdirSync(root)
            .filter((name) => isDirFollowing(join(root, name)) && existsSync(join(root, name, "SKILL.md")))
            .sort();
    }
    catch {
        return null;
    }
}
// srcAdapterFiles: the sorted TOP-LEVEL .md filenames under <srcRoot>/.claude/agents. Null on an
// unreadable root (fail-loud); [] on a root that exists and holds no adapter.
//
// File-ness is statSync's, not the Dirent's (see the header, WR-02).
export function srcAdapterFiles(srcRoot) {
    const root = join(srcRoot, ".claude", "agents");
    try {
        return readdirSync(root)
            .filter((name) => name.endsWith(".md") && isFileFollowing(join(root, name)))
            .sort();
    }
    catch {
        return null;
    }
}
export function srcNestedAdapterFiles(srcRoot) {
    const root = join(srcRoot, ".claude", "agents");
    const files = [];
    const cycles = [];
    // ONE tally for the WHOLE walk, deliberately NOT per path. The contrast with `ancestors` below —
    // which is per path by contract — is the exact distinction whose absence produced both defects
    // in this walk's history (D-35), so the two live in different variables with different lifetimes
    // and neither is allowed to answer the other's question.
    const budget = {
        examined: 0,
        overflow: null,
    };
    const walk = (base, ancestors) => {
        if (budget.overflow !== null)
            return;
        const here = join(root, base);
        let real;
        try {
            real = realpathSync(here);
        }
        catch {
            return;
        }
        if (ancestors.includes(real)) {
            // Cycle on THIS path — stop descending, and NAME the path declined (D-36). Reported rather
            // than thrown: this side's documented floor is report-not-throw so the installer finishes its
            // other classes. `base` is never "" here, because the root call starts with no ancestors.
            cycles.push(base);
            return;
        }
        const nextAncestors = [...ancestors, real];
        let names;
        try {
            names = readdirSync(here);
        }
        catch {
            return;
        }
        for (const name of names) {
            // Count the entry BEFORE deciding whether to descend into it or collect it, so the bound
            // limits WORK directly and is independent of the DAG's shape. Exact integer comparison at the
            // named constant: the 10000th entry examined is still under the bound and the 10001st trips
            // it, so the threshold cannot be crossed by an off-by-one or by a rounding of any kind.
            budget.examined += 1;
            if (budget.examined > MAX_WALK_ENTRIES) {
                budget.overflow = { limit: MAX_WALK_ENTRIES, at: base };
                return;
            }
            const rel = base ? `${base}/${name}` : name;
            const full = join(here, name);
            if (isDirFollowing(full)) {
                walk(rel, nextAncestors);
                if (budget.overflow !== null)
                    return;
            }
            else if (name.endsWith(".md") && rel.includes("/") && isFileFollowing(full))
                files.push(rel);
        }
    };
    walk("", []);
    return { files: files.sort(), cycles: cycles.sort(), overflow: budget.overflow };
}
