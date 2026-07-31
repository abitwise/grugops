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
// srcNestedAdapterFiles: every `.md` entry BELOW the top level of <srcRoot>/.claude/agents, as
// forward-slash relative paths, sorted.
//
// THE FLAT-DIRECTORY CONTRACT, AND WHY THE INSTALLER MUST SEE PAST IT. The adapter directory is flat
// by contract: the generator, the freshness gate and the installer all work over a flat directory,
// and the foundation guards REFUSE a nested adapter by name. But Claude Code discovers
// `.claude/agents/` RECURSIVELY, so a nested file is loaded by the platform. srcAdapterFiles() above
// is deliberately non-recursive — it is the INSTALL set, and installing a nested file would
// contradict the contract — which means without this helper a nested source adapter would simply
// vanish from the run with no comment. The installer must not be the one place a file disappears
// silently, so it detects the nested entry and REFUSES it by name (T-27-62).
//
// THE POLICY IS DEFINED BY scripts/kit-model.ts (listAgentAdapters), NOT HERE. That module is the
// single authority for "what is an adapter"; this file deliberately does NOT import it (D-18/D-28 —
// the installer stays decoupled from the scripts/ layout). The two derivations are asserted EQUAL by
// a test instead of bought by coupling: see the `source derivation` conformance case in
// install.test.ts, which compares the installer's real installed set against listAgentAdapters()
// over the same fixture and asserts the cardinality as a number. If the locked decision is ever
// revisited, that conformance case is what to delete along with the duplicate.
//
// A read failure at any level yields [] here rather than null: an unreadable root is already the
// srcAdapterFiles() null branch's finding, and reporting the same condition twice would be noise.
//
// Both the recursion test and the collection test go through statSync (see the header, WR-02), so a
// symlinked nested DIRECTORY is descended into and a symlinked nested FILE is collected — and each
// one is therefore refused BY NAME at its relative path instead of vanishing. Following links is
// what makes a cycle reachable, so realpath'd directories are visited at most once: a directory
// already walked under an earlier path contributes no member the walk has not already seen, so
// skipping the repeat removes an unbounded recursion without narrowing the set.
export function srcNestedAdapterFiles(srcRoot) {
    const root = join(srcRoot, ".claude", "agents");
    const seen = new Set();
    const walk = (base) => {
        const out = [];
        const here = join(root, base);
        try {
            const real = realpathSync(here);
            if (seen.has(real))
                return out;
            seen.add(real);
        }
        catch {
            return out;
        }
        let names;
        try {
            names = readdirSync(here);
        }
        catch {
            return out;
        }
        for (const name of names) {
            const rel = base ? `${base}/${name}` : name;
            const full = join(here, name);
            if (isDirFollowing(full))
                out.push(...walk(rel));
            else if (name.endsWith(".md") && rel.includes("/") && isFileFollowing(full))
                out.push(rel);
        }
        return out;
    };
    return walk("").sort();
}
