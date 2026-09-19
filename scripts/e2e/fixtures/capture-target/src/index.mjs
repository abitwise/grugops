// The thing the fixture project's gate scripts act on. It is intentionally tiny: the Phase 33
// capture is about the factory installed on top of it, not about this file. `--self-test` and
// `--build` both exit 0 so the section-14 gate (lint, typecheck, test, build) is reachable.

export function greet(name) {
  return `hello, ${name}`;
}

const mode = process.argv[2] ?? "";
if (mode === "--self-test") {
  if (greet("grug") !== "hello, grug") {
    console.error("self-test: greet() returned an unexpected value");
    process.exit(1);
  }
  console.log("self-test: 1 case, 0 failures");
} else if (mode === "--build") {
  console.log("build: nothing to compile; the fixture ships as plain ES modules");
}
