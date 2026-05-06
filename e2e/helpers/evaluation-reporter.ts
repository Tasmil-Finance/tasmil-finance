import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import type { CardType } from "../page-objects/chat.page";

/**
 * EvaluationReporter ties together:
 * 1. Playwright UI snapshots (screenshot of the rendered card)
 * 2. LangSmith trace data (tool calls, latency, errors)
 * 3. Structured evaluation verdict (pass/fail/warning per dimension)
 *
 * For each test case it produces a JSON evaluation record + PNG screenshot,
 * and at the end of a test run, generates an HTML report.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface EvaluationDimension {
  /** What's being checked */
  name: string;
  /** pass | fail | warning | skipped */
  status: "pass" | "fail" | "warning" | "skipped";
  /** Human-readable explanation */
  detail: string;
}

export interface EvaluationRecord {
  /** Test identifier: "blend.supply" */
  testId: string;
  /** User prompt sent to chat */
  prompt: string;
  /** Timestamp */
  timestamp: string;
  /** Thread ID from URL (links to LangSmith) */
  threadId: string;
  /** LangSmith trace URL (clickable) */
  langsmithUrl: string | null;
  /** Card type rendered in UI */
  cardRendered: CardType | string | null;
  /** Path to screenshot file */
  screenshotPath: string | null;
  /** Time from message send to card render (ms) */
  responseTimeMs: number;
  /** Evaluation dimensions */
  dimensions: EvaluationDimension[];
  /** Overall verdict */
  verdict: "pass" | "fail" | "warning";
}

// ─── Configuration ───────────────────────────────────────────────

const LANGSMITH_API_URL = process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com";
const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY || "";
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || "tasmil-ai";
const REPORT_DIR = join(process.cwd(), "test-results", "evaluation");

// ─── Evaluation Reporter Class ───────────────────────────────────

export class EvaluationReporter {
  private records: EvaluationRecord[] = [];

  constructor() {
    mkdirSync(REPORT_DIR, { recursive: true });
    mkdirSync(join(REPORT_DIR, "screenshots"), { recursive: true });
  }

  /**
   * Evaluate a single test case end-to-end.
   * Call this AFTER the AI has responded and a card is visible.
   */
  async evaluate(params: {
    page: Page;
    testId: string;
    prompt: string;
    threadId: string;
    cardType: CardType | string | null;
    cardLocator: any; // Playwright Locator
    expectedCard: CardType;
    expectedTool?: string;
    expectedTextFragments?: string[];
    responseTimeMs: number;
  }): Promise<EvaluationRecord> {
    const dimensions: EvaluationDimension[] = [];

    // ─── Dimension 1: Correct Card Rendered ────────────────────
    const cardMatch = params.cardType === params.expectedCard;
    dimensions.push({
      name: "Card Type",
      status: cardMatch ? "pass" : "fail",
      detail: cardMatch
        ? `Rendered ${params.cardType} as expected`
        : `Expected ${params.expectedCard}, got ${params.cardType ?? "none"}`,
    });

    // ─── Dimension 2: Response Time ────────────────────────────
    const responseOk = params.responseTimeMs < 60_000;
    dimensions.push({
      name: "Response Time",
      status: responseOk ? (params.responseTimeMs < 30_000 ? "pass" : "warning") : "fail",
      detail: `${(params.responseTimeMs / 1000).toFixed(1)}s`,
    });

    // ─── Dimension 3: Text Content ────────────────────────────
    if (params.expectedTextFragments?.length && params.cardLocator) {
      const cardText = await params.cardLocator.textContent().catch(() => "");
      const allFound = params.expectedTextFragments.every((frag) =>
        cardText?.toLowerCase().includes(frag.toLowerCase())
      );
      dimensions.push({
        name: "Content Accuracy",
        status: allFound ? "pass" : "warning",
        detail: allFound
          ? `All expected text found: ${params.expectedTextFragments.join(", ")}`
          : `Missing: ${params.expectedTextFragments.filter((f) => !cardText?.toLowerCase().includes(f.toLowerCase())).join(", ")}`,
      });
    }

    // ─── Dimension 4: LangSmith Trace ──────────────────────────
    let langsmithUrl: string | null = null;
    if (LANGSMITH_API_KEY && params.expectedTool) {
      const traceResult = await this.fetchTrace(params.threadId);
      if (traceResult) {
        const toolCalled = traceResult.toolCalls.some(
          (tc) => tc.name === params.expectedTool || tc.name.includes(params.expectedTool!)
        );
        dimensions.push({
          name: "AI Tool Selection",
          status: toolCalled ? "pass" : "fail",
          detail: toolCalled
            ? `Correctly called: ${params.expectedTool}`
            : `Expected ${params.expectedTool}, actual tools: [${traceResult.toolCalls.map((t) => t.name).join(", ")}]`,
        });

        if (traceResult.errors.length > 0) {
          dimensions.push({
            name: "AI Errors",
            status: "fail",
            detail: traceResult.errors.join("; "),
          });
        }

        // Build LangSmith URL for the trace
        if (traceResult.runs[0]?.id) {
          langsmithUrl = `${LANGSMITH_API_URL}/o/default/projects/p/${LANGSMITH_PROJECT}/r/${traceResult.runs[0].id}`;
        }
      } else {
        dimensions.push({
          name: "AI Tool Selection",
          status: "skipped",
          detail: "Could not fetch LangSmith trace",
        });
      }
    }

    // ─── Dimension 5: Screenshot ───────────────────────────────
    let screenshotPath: string | null = null;
    if (params.cardLocator) {
      try {
        const filename = `${params.testId.replace(/\./g, "-")}.png`;
        screenshotPath = join(REPORT_DIR, "screenshots", filename);
        await params.cardLocator.screenshot({ path: screenshotPath });
        dimensions.push({
          name: "UI Screenshot",
          status: "pass",
          detail: filename,
        });
      } catch {
        dimensions.push({
          name: "UI Screenshot",
          status: "warning",
          detail: "Could not capture screenshot",
        });
      }
    }

    // ─── Build record ──────────────────────────────────────────
    const verdict = dimensions.some((d) => d.status === "fail")
      ? "fail"
      : dimensions.some((d) => d.status === "warning")
        ? "warning"
        : "pass";

    const record: EvaluationRecord = {
      testId: params.testId,
      prompt: params.prompt,
      timestamp: new Date().toISOString(),
      threadId: params.threadId,
      langsmithUrl,
      cardRendered: params.cardType,
      screenshotPath,
      responseTimeMs: params.responseTimeMs,
      dimensions,
      verdict,
    };

    this.records.push(record);
    return record;
  }

  /**
   * Write the final evaluation report (JSON + HTML).
   */
  writeReport() {
    // JSON report
    const jsonPath = join(REPORT_DIR, "evaluation-report.json");
    writeFileSync(jsonPath, JSON.stringify(this.records, null, 2));

    // HTML report
    const htmlPath = join(REPORT_DIR, "evaluation-report.html");
    writeFileSync(htmlPath, this.generateHtml());

    console.log(`\n📊 Evaluation Report: ${htmlPath}`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(
      `   Tests: ${this.records.length} | Pass: ${this.records.filter((r) => r.verdict === "pass").length} | Fail: ${this.records.filter((r) => r.verdict === "fail").length} | Warning: ${this.records.filter((r) => r.verdict === "warning").length}\n`
    );
  }

  private async fetchTrace(threadId: string) {
    if (!LANGSMITH_API_KEY) return null;
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const response = await fetch(
        `${LANGSMITH_API_URL}/api/v1/runs?` +
          new URLSearchParams({
            project_name: LANGSMITH_PROJECT,
            filter: `and(eq(metadata_key, "thread_id"), eq(metadata_value, "${threadId}"))`,
            order: "desc",
            limit: "10",
          }),
        {
          headers: {
            "x-api-key": LANGSMITH_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) return null;
      const runs = await response.json();
      return this.parseRuns(runs);
    } catch {
      return null;
    }
  }

  private parseRuns(runs: any[]) {
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const errors: string[] = [];

    for (const run of runs) {
      if (run.error) errors.push(run.error);
      if (run.run_type === "tool") {
        toolCalls.push({ name: run.name, args: run.inputs ?? {} });
      }
      if (run.child_runs) {
        for (const child of run.child_runs) {
          if (child.run_type === "tool") {
            toolCalls.push({ name: child.name, args: child.inputs ?? {} });
          }
        }
      }
    }

    return { runs, toolCalls, errors };
  }

  private generateHtml(): string {
    const passCount = this.records.filter((r) => r.verdict === "pass").length;
    const failCount = this.records.filter((r) => r.verdict === "fail").length;
    const warnCount = this.records.filter((r) => r.verdict === "warning").length;

    const rows = this.records
      .map(
        (r) => `
      <tr class="${r.verdict}">
        <td><code>${r.testId}</code></td>
        <td class="prompt">${escapeHtml(r.prompt)}</td>
        <td><span class="badge badge-${r.verdict}">${r.verdict.toUpperCase()}</span></td>
        <td><code>${r.cardRendered ?? "—"}</code></td>
        <td>${(r.responseTimeMs / 1000).toFixed(1)}s</td>
        <td>
          ${r.screenshotPath ? `<a href="screenshots/${r.testId.replace(/\./g, "-")}.png" target="_blank">View</a>` : "—"}
        </td>
        <td>
          ${r.langsmithUrl ? `<a href="${r.langsmithUrl}" target="_blank">Trace</a>` : "—"}
        </td>
        <td>
          <details>
            <summary>${r.dimensions.filter((d) => d.status === "fail").length} issues</summary>
            <ul>
              ${r.dimensions.map((d) => `<li class="dim-${d.status}"><b>${d.name}:</b> ${d.detail}</li>`).join("")}
            </ul>
          </details>
        </td>
      </tr>`
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <title>Tasmil E2E Evaluation Report</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; margin: 2rem; background: #0d1117; color: #e6edf3; }
    h1 { color: #58a6ff; }
    .summary { display: flex; gap: 1.5rem; margin: 1rem 0 2rem; }
    .stat { padding: 1rem 1.5rem; border-radius: 8px; border: 1px solid #30363d; }
    .stat-pass { border-color: #238636; background: #238636/10; }
    .stat-fail { border-color: #da3633; background: #da3633/10; }
    .stat-warn { border-color: #d29922; background: #d29922/10; }
    .stat b { font-size: 2rem; display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.6rem 0.8rem; border: 1px solid #30363d; text-align: left; }
    th { background: #161b22; position: sticky; top: 0; }
    tr.fail { background: rgba(218, 54, 51, 0.05); }
    tr.warning { background: rgba(210, 153, 34, 0.05); }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .badge-pass { background: #238636; color: #fff; }
    .badge-fail { background: #da3633; color: #fff; }
    .badge-warning { background: #d29922; color: #000; }
    .prompt { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    code { background: #161b22; padding: 2px 5px; border-radius: 3px; font-size: 0.8rem; }
    details { cursor: pointer; }
    .dim-pass { color: #3fb950; }
    .dim-fail { color: #f85149; }
    .dim-warning { color: #d29922; }
    .dim-skipped { color: #8b949e; }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Tasmil E2E Evaluation Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <div class="summary">
    <div class="stat stat-pass"><b>${passCount}</b> Pass</div>
    <div class="stat stat-fail"><b>${failCount}</b> Fail</div>
    <div class="stat stat-warn"><b>${warnCount}</b> Warning</div>
    <div class="stat"><b>${this.records.length}</b> Total</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Test ID</th>
        <th>Prompt</th>
        <th>Verdict</th>
        <th>Card</th>
        <th>Time</th>
        <th>Screenshot</th>
        <th>LangSmith</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Singleton for use across test files. */
let _reporter: EvaluationReporter | null = null;
export function getEvaluationReporter(): EvaluationReporter {
  if (!_reporter) _reporter = new EvaluationReporter();
  return _reporter;
}
