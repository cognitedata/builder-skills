import * as fs from 'node:fs';

interface AuraReview {
  appDir: string;
  stats: {
    auraCoveragePct: number;
    auraUsages: number;
    nonAuraUsages: number;
    allAuraUsages: number;
    allNonAuraUsages: number;
    couldHaveBeenAuraPct: number;
    couldHaveBeenAuraCount: number;
    couldHaveBeenAuraConsideredCount: number;
    couldHaveBeenAuraOfNonAuraPct: number;
    usageQualityFindingsCount: number;
  };
  nonComplianceFindings: unknown[];
  thirdPartyUsages: unknown[];
}

// Keep in the same order as buildRow's return value — the webhook writes this as the
// sheet's header row the first time it sees an empty sheet (see sheets-webhook.gs).
export const HEADERS = [
  'Timestamp',
  'App',
  'Aura coverage %',
  'Aura usages (distinct)',
  'Non-Aura usages (distinct)',
  'Aura usages (all occurrences)',
  'Non-Aura usages (all occurrences)',
  'Could-have-been-Aura %',
  'Could-have-been-Aura count',
  'Could-have-been-Aura considered',
  'Could-have-been-Aura of all non-Aura %',
  'Usage-quality findings',
  'Non-compliance findings',
  'Third-party usages',
  'Report URL',
];

export function buildRow(review: AuraReview): Array<string | number> {
  const { stats } = review;
  return [
    new Date().toISOString(),
    review.appDir,
    stats.auraCoveragePct,
    stats.auraUsages,
    stats.nonAuraUsages,
    stats.allAuraUsages,
    stats.allNonAuraUsages,
    stats.couldHaveBeenAuraPct,
    stats.couldHaveBeenAuraCount,
    stats.couldHaveBeenAuraConsideredCount,
    stats.couldHaveBeenAuraOfNonAuraPct,
    stats.usageQualityFindingsCount,
    review.nonComplianceFindings.length,
    review.thirdPartyUsages.length,
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
  row: Array<string | number>,
  headers: string[]
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: webhookToken, row, headers }),
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
  await postRow(webhookUrl, webhookToken, buildRow(review), HEADERS);
  console.log('Logged review to Sheet via webhook.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
