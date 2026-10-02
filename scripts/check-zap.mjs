// Fails CI if the ZAP scan found anything rated Medium or High (SDLC §4.3).
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "report_json.json";
const report = JSON.parse(readFileSync(file, "utf8"));
const alerts = (report.site ?? []).flatMap((s) => s.alerts ?? []);
const RISK = { 0: "Informational", 1: "Low", 2: "Medium", 3: "High" };

for (const a of alerts)
  console.log(`[${RISK[a.riskcode]}] ${a.pluginid} ${a.name} (${a.count ?? a.instances?.length ?? 0})`);
/**
 * Accepted findings (SDLC §4.3). Each entry is as narrow as possible and explains itself.
 * 90003 Sub Resource Integrity: the only script from another host is Cloudflare Web Analytics,
 * which Cloudflare injects and updates in place, so a fixed integrity hash would break it. The
 * CSP limits scripts to our own origin and that one host. Any other script without SRI fails.
 */
/** True when the evidence is one script tag whose src is exactly the Cloudflare beacon. */
function isCloudflareBeacon(evidence = "") {
  const srcs = [...evidence.matchAll(/\ssrc=["']([^"']+)["']/g)].map((m) => m[1]);
  if (srcs.length !== 1) return false;
  try {
    const url = new URL(srcs[0]);
    return url.origin === "https://static.cloudflareinsights.com" && url.pathname === "/beacon.min.js";
  } catch {
    return false;
  }
}
const ACCEPTED = {
  90003: (instance) => isCloudflareBeacon(instance.evidence),
};
const accepted = (a) => {
  const rule = ACCEPTED[a.pluginid];
  return Boolean(rule) && (a.instances ?? []).length > 0 && a.instances.every(rule);
};
for (const a of alerts.filter(accepted))
  console.log(`  accepted: ${a.pluginid} ${a.name} (Cloudflare Web Analytics only)`);
const blocking = alerts.filter((a) => Number(a.riskcode) >= 2 && !accepted(a));
if (blocking.length) {
  console.error(`\n✗ ${blocking.length} ZAP finding(s) at Medium or above. See the zap-report artifact.`);
  process.exit(1);
}
console.log(`\n✓ ZAP: no Medium or High findings (${alerts.length} lower-risk alerts listed above).`);
