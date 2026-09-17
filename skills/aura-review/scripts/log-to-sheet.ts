import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

interface AuraReview {
  appDir: string;
  stats: {
    auraCoveragePct: number;
    couldHaveBeenAuraPct: number;
    usageQualityFindingsCount: number;
  };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

// Exchanges a service-account key for a bearer token via a self-signed JWT assertion
// (RFC 7523), using only Node's built-in `crypto` and `fetch` — no `googleapis`
// dependency, since this script runs against whatever app's node_modules happen to be
// on NODE_PATH (see SKILL.md), not a controlled environment we can add deps to.
export async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), key.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

// Appends one row to the sheet's first tab. Sheets picks the next empty row after the
// existing data itself (`:append` semantics) — this script never tracks row numbers.
export async function appendRow(
  sheetId: string,
  accessToken: string,
  row: Array<string | number>
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!response.ok) {
    throw new Error(`Sheets append failed: ${response.status} ${await response.text()}`);
  }
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

async function main(): Promise<void> {
  const reviewPath = process.argv[2];
  if (!reviewPath) {
    console.error('Usage: log-to-sheet.ts <review.json path>');
    process.exit(1);
  }

  const sheetId = process.env.AURA_REVIEW_SHEET_ID;
  const saKeyRaw = process.env.GOOGLE_SHEETS_SA_KEY;
  if (!sheetId || !saKeyRaw) {
    console.log(
      'AURA_REVIEW_SHEET_ID / GOOGLE_SHEETS_SA_KEY not set — skipping Sheet logging.'
    );
    return;
  }

  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf-8')) as AuraReview;
  const key = JSON.parse(saKeyRaw) as ServiceAccountKey;

  const accessToken = await getAccessToken(key);
  await appendRow(sheetId, accessToken, buildRow(review));
  console.log(`Logged review to Sheet ${sheetId}.`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
