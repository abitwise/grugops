// P10: malformed / stale / mis-bound .grugops-kit.json over a user's agent-factory/ at the kit root.
// Expect: every variant reads as no record -> the user's directory is renamed aside, never deleted.
import { existsSync, mkdirSync, writeFileSync, readdirSync, realpathSync, symlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { world, run } from "./lib.mjs";
const w = world("malformed");
const variants = (real) => ({
  "not-json": "{nope",
  "wrong-binding": JSON.stringify({ grugopsHome: "/somewhere/else", ledger: [{ path: "agent-factory", kind: "kit" }] }),
  "extra-key": JSON.stringify({ grugopsHome: real, ledger: [{ path: "agent-factory", kind: "kit" }], x: 1 }),
  "kit-extra-field": JSON.stringify({ grugopsHome: real, ledger: [{ path: "agent-factory", kind: "kit", kit: true }] }),
  "dup-binding": `{"grugopsHome":"/other","grugopsHome":${JSON.stringify(real)},"ledger":[{"path":"agent-factory","kind":"kit"}]}`,
  "file-kind": JSON.stringify({ grugopsHome: real, ledger: [{ path: "agent-factory", kind: "file", content: null }] }),
  "trailing-slash-binding": JSON.stringify({ grugopsHome: real + "/", ledger: [{ path: "agent-factory", kind: "kit" }] }),
  "VALID-forged": JSON.stringify({ grugopsHome: real, ledger: [{ path: "agent-factory", kind: "kit" }] }),
});
let i = 0;
for (const name of Object.keys(variants("x"))) {
  const kh = join(w.dir, `kh${i++}`);
  mkdirSync(join(kh, "agent-factory"), { recursive: true });
  writeFileSync(join(kh, "agent-factory", "MYNOTES.md"), "notes\n");
  writeFileSync(join(kh, ".grugops-kit.json"), variants(realpathSync(kh))[name]);
  const r = run(w, "install", [], { grugopsHome: kh });
  const baks = readdirSync(kh).filter((n) => n.startsWith("agent-factory.bak."));
  const kept = baks.some((b) => existsSync(join(kh, b, "MYNOTES.md")));
  console.log(`${name.padEnd(22)} exit ${r.status} userNotesKeptInBackup=${kept} stillAtRoot=${existsSync(join(kh, "agent-factory", "MYNOTES.md"))}`);
}
