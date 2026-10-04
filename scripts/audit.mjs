// Dependency audit for CI (SDLC §4.3): fails on any high or critical advisory, except the
// documented exceptions below. An exception names one advisory, says why it does not affect
// this site, and expires, so it has to be looked at again.
import { execFileSync } from "node:child_process";

const EXCEPTIONS = [
  {
    id: "GHSA-ch52-4w7c-c8xp",
    package: "http-cache-semantics",
    reason:
      "No patched version exists yet (4.2.0 is the latest). Astro uses the package only to cache " +
      "remote images while building (astro/dist/assets/build/remote.js). This site has no remote " +
      "images and ships static files only, so the code never runs for visitors.",
    expires: "2026-11-15",
  },
];

let report;
try {
  report = JSON.parse(execFileSync("npm", ["audit", "--json"], { encoding: "utf8" }));
} catch (e) {
  // npm audit exits with 1 when it finds anything; the JSON is still on stdout.
  report = JSON.parse(e.stdout);
}

const today = new Date().toISOString().slice(0, 10);
const active = EXCEPTIONS.filter((x) => x.expires >= today);
for (const x of EXCEPTIONS.filter((x) => x.expires < today))
  console.error(`Exception for ${x.id} expired on ${x.expires}: review it again.`);

/** Advisory ids behind a vulnerable package, following "via" links to other packages. */
function advisories(name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const v = report.vulnerabilities?.[name];
  if (!v) return [];
  return v.via.flatMap((via) =>
    typeof via === "string"
      ? advisories(via, seen)
      : [{ id: via.url.split("/").pop(), severity: via.severity }],
  );
}

const blocking = [];
for (const [name, v] of Object.entries(report.vulnerabilities ?? {})) {
  if (v.severity !== "high" && v.severity !== "critical") continue;
  const open = advisories(name).filter(
    (a) => (a.severity === "high" || a.severity === "critical") && !active.some((x) => x.id === a.id),
  );
  if (open.length) blocking.push(`${name}: ${[...new Set(open.map((a) => a.id))].join(", ")}`);
  else console.log(`accepted: ${name} (${v.severity}) – only documented exceptions apply`);
}
for (const x of active) console.log(`exception ${x.id} (${x.package}) until ${x.expires}: ${x.reason}`);

if (blocking.length) {
  console.error(`\n✗ High or critical advisories:\n  ${blocking.join("\n  ")}`);
  process.exit(1);
}
console.log("\n✓ npm audit: no high or critical advisories outside the documented exceptions.");
