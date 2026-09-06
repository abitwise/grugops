// check-residual-citations.ts — a published residual may not name a mechanism that is not in the
// tree (plan 30-11, `RA2-4` / `RA4-3` / `RA4-6`).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THIS IS ITS OWN CHECK, AND THE TWO HOMES IT WAS EVICTED FROM.
//
// Round 2 put it at `scripts/generate-guarantees.ts`'s entry point. That made the render's entry
// depend on the whole tree, and `guarantees-freshness` re-renders in a MIRROR holding only the
// generator's derived import closure — so the mirror had to copy the cited paths in, and that copy
// pulled whole directories (35 modules outside the declared closure), voiding the isolation the byte
// comparison rests on (`RA4-6`).
//
// Round 3 moved it into `scripts/check-audit-register.ts`, which does run in the repository — and
// that file's own test builds a HERMETIC mirror containing only the inputs the auditor previously
// read. The check went red on 29 cases for a register that was simply not there. Same class, second
// instance, found by running the full suite rather than the touched files.
//
// The question this asks is about the REPOSITORY: does a published citation name a file this
// repository tracks? Neither a pure render nor a hermetic auditor mirror is the repository. So it
// lives here, in a check that is only ever run against the real tree, and it needs no mirror at all.
//
// THE MEMBERSHIP TEST IS `git ls-files`, NOT `existsSync`. An untracked file exists in exactly one
// working tree, and a mechanism that exists in one working tree is precisely a mechanism that "is not
// in the tree" for every reader of the published page.
// ─────────────────────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from "node:fs";
import { isEntrypoint } from "./is-entry.js";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { RESIDUAL_PATH } from "./audit-model.js";
import { citedResidualPaths, EXTERNAL_PATH_MARKER, HISTORICAL_RESIDUAL_ROWS, } from "./generate-guarantees.js";
// THE TRUTHINESS TERNARY, NOT `??` — and an existing guard caught this file using `??` (plan 30-11
// round 3). `??` treats an EMPTY `CHECK_ROOT` as a supplied value, so `join("", …)` resolves against
// the process cwd. That is the identical defect this same plan closed in round 2 for
// `CLAUDE_PROJECT_DIR`, reproduced here by the author in a new file one round later, and refused by
// `check-claim-anchors`'s uniform-idiom sweep rather than by a reviewer.
const ROOT = process.env.CHECK_ROOT
    ? process.env.CHECK_ROOT
    : join(import.meta.dirname, "..");
/** Every tracked path, once. A directory counts as tracked when anything under it is. */
export function trackedPaths(root = ROOT) {
    const out = new Set();
    const listed = execFileSync("git", ["ls-files"], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });
    for (const line of listed.split("\n")) {
        const rel = line.trim();
        if (rel === "")
            continue;
        out.add(rel);
        const parts = rel.split("/");
        for (let i = 1; i < parts.length; i++)
            out.add(parts.slice(0, i).join("/"));
    }
    return out;
}
export function residualCitationRefusals(root = ROOT) {
    const text = readFileSync(join(root, RESIDUAL_PATH), "utf8");
    const tracked = trackedPaths(root);
    const refusals = [];
    let scanned = 0;
    let cited = 0;
    for (const raw of text.split("\n")) {
        const line = raw.replace(/\r$/, "").trim();
        if (!line.includes("|"))
            continue;
        const body = line.startsWith("|") ? line.slice(1) : line;
        const first = (body.split("|")[0] ?? "").trim();
        if (!/^\d+$/.test(first))
            continue;
        if (Number.parseInt(first, 10) <= HISTORICAL_RESIDUAL_ROWS)
            continue;
        scanned += 1;
        for (const path of citedResidualPaths(line)) {
            cited += 1;
            // BOTH HALVES, AND THE REFUSAL SAYS WHICH ONE FAILED (plan 30-11 round 4, `RA6-3`).
            //
            // `git ls-files` reads the INDEX, not the worktree. `rm scripts/audit-model.ts` and the gate
            // still PASSED — the inversion bought a real property (an untracked file exists in one working
            // tree only) and silently sold the converse (an indexed but absent file). It compounds with
            // `RA6-1`: in CI the index and the worktree agree, and `RA6-1` established the gate never ran
            // in CI, so the ONLY place it ran was a developer's tree — precisely the only place the two can
            // disagree. The citation must name a file this repository TRACKS and that is HERE.
            const isTracked = tracked.has(path);
            const isPresent = existsSync(join(root, path));
            if (!isTracked || !isPresent) {
                const why = !isTracked
                    ? !isPresent
                        ? "is neither tracked by git nor present on disk"
                        : "is present on disk but NOT tracked by git — it exists in one working tree only"
                    : "is tracked by git but ABSENT from the working tree — the index still carries it";
                refusals.push(`residual row ${first} cites \`${path}\`, which ${why}. A published residual may not name ` +
                    `a mechanism that does not exist here. If the path is deliberately outside the tree ` +
                    `(a host's own settings file), write it as \`${EXTERNAL_PATH_MARKER}${path}\` so the ` +
                    `citation is a named act.`);
            }
        }
    }
    // THE SCAN'S OWN PREMISE. A scan that matched nothing would pass every row vacuously, forever.
    if (scanned > 0 && cited === 0) {
        refusals.push(`the residual path scan examined ${scanned} published row(s) and found NO cited path at all — ` +
            `that is a scan that has stopped asking, not a register that has stopped citing`);
    }
    return { refusals, scanned, cited };
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    const r = residualCitationRefusals();
    if (r.refusals.length > 0) {
        for (const m of r.refusals)
            console.error(`  FAIL  ${m}`);
        console.error(`\n== Result ==\n${r.refusals.length} CHECK(S) FAILED`);
        process.exit(1);
    }
    console.log(`  PASS  residual citations: ${r.cited} path claim(s) across ${r.scanned} published row(s), ` +
        `every one a tracked file (30-11 RA4-3 — tracked, not merely present on this disk).`);
    console.log("\n== Result ==\nALL CHECKS PASSED");
    process.exit(0);
}
