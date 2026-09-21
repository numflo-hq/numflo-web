// Fails CI if the ZAP scan found anything rated Medium or High (SDLC §4.3).
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "report_json.json";
const report = JSON.parse(readFileSync(file, "utf8"));
const alerts = (report.site ?? []).flatMap((s) => s.alerts ?? []);
const RISK = { 0: "Informational", 1: "Low", 2: "Medium", 3: "High" };

for (const a of alerts)
  console.log(`[${RISK[a.riskcode]}] ${a.pluginid} ${a.name} (${a.count ?? a.instances?.length ?? 0})`);
const blocking = alerts.filter((a) => Number(a.riskcode) >= 2);
if (blocking.length) {
  console.error(`\n✗ ${blocking.length} ZAP finding(s) at Medium or above. See the zap-report artifact.`);
  process.exit(1);
}
console.log(`\n✓ ZAP: no Medium or High findings (${alerts.length} lower-risk alerts listed above).`);
