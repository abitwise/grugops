// generate-hook-manifest.ts — regenerate the decider-closure manifest inside hooks/hook-entry.ts
// (plan 30-11 round 4, `RA5-5`).
//
// THE SET IS DERIVED. The closure comes from `scripts/js-import-closure.ts` — the same derivation the
// freshness mirrors already use — walked from each decider `hooks/hooks.json` names, so a module
// added to the graph is manifested without anyone editing a list. The cardinality is asserted by
// `scripts/floor-invariance.test.ts` against a fresh derivation, because a manifest that silently
// went SHORT would leave exactly the module an attacker wants unverified.
import { readFileSync, writeFileSync } from "node:fs";
import { isEntrypoint } from "./is-entry.js";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { jsImportClosure } from "./js-import-closure.js";
const ROOT = join(import.meta.dirname, "..");
export const HOOK_ENTRY_TS = join(ROOT, "hooks", "hook-entry.ts");
export const MANIFEST_OPEN = "// <hook-manifest> GENERATED — do not edit by hand; run `npm run generate:hook-manifest`";
export const MANIFEST_CLOSE = "// </hook-manifest>";
/** Every decider `hooks/hooks.json` routes through the wrapper — derived, never listed here. */
export function deciderEntries(root = ROOT) {
    const hooks = JSON.parse(readFileSync(join(root, "hooks", "hooks.json"), "utf8"));
    const out = new Set();
    for (const m of hooks.hooks.PreToolUse) {
        for (const h of m.hooks) {
            const parts = h.command.trim().split(/\s+/);
            const last = parts[parts.length - 1];
            if (last !== undefined && last.endsWith(".js") && !last.includes("hook-entry")) {
                out.add(`hooks/${last.replace(/^.*[\\/]/, "")}`);
            }
        }
    }
    return [...out].sort();
}
/** The manifest a fresh derivation produces: every decider plus its whole emitted import closure. */
/**
 * One entry per decider, each mapping every module in THAT decider's closure to its hash.
 *
 * Per-decider rather than one flat set (round 4): the wrapper must verify exactly the code it is
 * about to run, not every decider the kit ships. A flat manifest made a partial kit — one decider
 * present, the other absent — refuse a decider that was perfectly intact, which is a refusal about a
 * file the run was never going to load.
 */
export function deriveManifest(root = ROOT) {
    const out = {};
    for (const entry of deciderEntries(root)) {
        const files = new Set([entry, ...jsImportClosure(root, entry)]);
        const per = {};
        for (const rel of [...files].sort()) {
            per[rel] = createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");
        }
        out[entry] = per;
    }
    return out;
}
export function renderManifestRegion(manifest) {
    const lines = [];
    for (const [entry, per] of Object.entries(manifest)) {
        lines.push(`  ${JSON.stringify(entry)}: {`);
        for (const [rel, hash] of Object.entries(per)) {
            lines.push(`    ${JSON.stringify(rel)}: ${JSON.stringify(hash)},`);
        }
        lines.push("  },");
    }
    return [
        MANIFEST_OPEN,
        "const DECIDER_MANIFEST: Readonly<Record<string, Readonly<Record<string, string>>>> = {",
        ...lines,
        "};",
        MANIFEST_CLOSE,
    ].join("\n");
}
/** The wrapper's source with the manifest region replaced by a fixed placeholder — the FREEZE input. */
export function normalizeManifestRegion(src) {
    const a = src.indexOf(MANIFEST_OPEN);
    const b = src.indexOf(MANIFEST_CLOSE);
    if (a === -1 || b === -1)
        return src;
    return src.slice(0, a) + "<MANIFEST REGION>" + src.slice(b + MANIFEST_CLOSE.length);
}
export function rewriteHookEntry(root = ROOT) {
    const path = join(root, "hooks", "hook-entry.ts");
    const src = readFileSync(path, "utf8");
    const a = src.indexOf(MANIFEST_OPEN);
    const b = src.indexOf(MANIFEST_CLOSE);
    if (a === -1 || b === -1) {
        throw new Error(`generate-hook-manifest: the manifest region markers are missing from ${path}`);
    }
    const next = src.slice(0, a) + renderManifestRegion(deriveManifest(root)) + src.slice(b + MANIFEST_CLOSE.length);
    return { changed: next !== src, text: next };
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    const { changed, text } = rewriteHookEntry();
    writeFileSync(HOOK_ENTRY_TS, text, "utf8");
    const m = deriveManifest();
    const n = Object.values(m).reduce((a, per) => a + Object.keys(per).length, 0);
    process.stdout.write(`Wrote hooks/hook-entry.ts manifest — ${Object.keys(m).length} decider(s), ${n} module hash(es)` +
        `${changed ? "" : " (unchanged)"}.\n`);
    process.exit(0);
}
