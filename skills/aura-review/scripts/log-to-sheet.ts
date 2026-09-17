import * as fs from 'node:fs';

interface AuraReview {
  appDir: string;
  stats: {
    auraCoveragePct: number;
    couldHaveBeenAuraPct: number;
    usageQualityFindingsCount: number;
  };
}

export function buildRow(review: AuraReview): Array<string | number> {
  return [
    new Date().toISOString(),
    review.appDir,
    review.stats.auraCoveragePct,
    review.stats.couldHaveBeenAuraPct,
    review.stats.usageQualityFindingsCount,
    // No host-sync wiring yet for a real shareable report link — placeholder until
    // that lands, so the sheet at least starts collecting a row per run now.
    process.env.AURA_REVIEW_REPORT_URL ?? 'N/A',
  ];
}

// Posts to an Apps Script Web App bound to the target Sheet (see
// scripts/sheets-webhook.gs for the doPost handler to paste into that Sheet's Apps
// Script editor) rather than talking to the Sheets API directly — this avoids a GCP
// project / service-account key to provision and rotate. The webhook token is the only
// secret; the URL itself is not sensitive on its own since the handler checks the token.
//
// Apps Script Web Apps always answer HTTP 200 for a completed doPost — there is no way
// for the handler to set a different status code — so success/failure is read from the
// JSON body's `ok` field, not `response.ok`.
export async function postRow(
  webhookUrl: string,
  webhookToken: string,
  row: Array<string | number>
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: webhookToken, row }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Sheets webhook request failed: ${response.status} ${text}`);
  }
  const body = JSON.parse(text) as { ok: boolean; error?: string };
  if (!body.ok) {
    throw new Error(`Sheets webhook rejected the row: ${body.error ?? 'unknown error'}`);
  }
}

async function main(): Promise<void> {
  const reviewPath = process.argv[2];
  if (!reviewPath) {
    console.error('Usage: log-to-sheet.ts <review.json path>');
    process.exit(1);
  }

  const webhookUrl = process.env.AURA_REVIEW_SHEETS_WEBHOOK_URL;
  const webhookToken = process.env.AURA_REVIEW_SHEETS_WEBHOOK_TOKEN;
  if (!webhookUrl || !webhookToken) {
    console.log(
      'AURA_REVIEW_SHEETS_WEBHOOK_URL / AURA_REVIEW_SHEETS_WEBHOOK_TOKEN not set — skipping Sheet logging.'
    );
    return;
  }

  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf-8')) as AuraReview;
  await postRow(webhookUrl, webhookToken, buildRow(review));
  console.log('Logged review to Sheet via webhook.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
