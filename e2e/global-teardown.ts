import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Global teardown — runs after all tests complete.
 * Merges individual evaluation records into a final summary.
 */
export default function globalTeardown() {
  const reportPath = join(process.cwd(), "test-results", "evaluation", "evaluation-report.json");

  if (existsSync(reportPath)) {
    const records = JSON.parse(readFileSync(reportPath, "utf-8"));
    const pass = records.filter((r: any) => r.verdict === "pass").length;
    const fail = records.filter((r: any) => r.verdict === "fail").length;
    const warn = records.filter((r: any) => r.verdict === "warning").length;

    console.log("\n" + "=".repeat(60));
    console.log("  EVALUATION SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `  ✅ Pass: ${pass}  ❌ Fail: ${fail}  ⚠️  Warning: ${warn}  📊 Total: ${records.length}`
    );
    console.log(`  Report: test-results/evaluation/evaluation-report.html`);
    console.log("=".repeat(60) + "\n");
  }
}
