// This file isn't executed from the repo — it's a paste-in template, kept here as the
// versioned source of truth for what's manually copied into the target Sheet's Apps
// Script editor, so what's actually deployed can be diffed against something instead of
// living invisibly in a Google account nobody else can review. If this file changes,
// re-paste it into the Sheet.
//
// Temporary: this Sheets integration exists only until aura-review results get a proper
// CDF time series integration (see aura-eval-daily.yml's "Upload stats to CDF" TODO).
// Once that lands, this file, log-to-sheet.ts, and the --log-to-sheet flag should all be
// removed rather than kept running alongside the CDF path.
//
// Paste this into the target Sheet's Apps Script editor (Extensions > Apps Script),
// replacing Code.gs's contents, then Deploy > New deployment > type "Web app"
// (execute as yourself, access "Anyone"). The deployment URL is
// AURA_REVIEW_SHEETS_WEBHOOK_URL; the token below is AURA_REVIEW_SHEETS_WEBHOOK_TOKEN.
//
// The "Anyone" access setting only controls who Google lets invoke the URL at all —
// it does not mean anyone can append rows. That's gated by the token check below, which
// is the actual auth boundary. Set the real token via Project Settings > Script
// Properties (key AURA_REVIEW_WEBHOOK_TOKEN) rather than hardcoding it here, so it
// isn't visible to anyone who opens the script (Apps Script is visible to Sheet editors).
//
// Apps Script's ContentService always returns HTTP 200 for a completed doPost — there is
// no way to set a different status code from a web app deployment. Callers (see
// scripts/log-to-sheet.ts) must check the JSON body's `ok` field, not the HTTP status.

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var expectedToken = PropertiesService.getScriptProperties().getProperty(
    'AURA_REVIEW_WEBHOOK_TOKEN'
  );

  if (!expectedToken || body.token !== expectedToken) {
    return jsonResponse({ ok: false, error: 'invalid token' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0 && body.headers) {
    sheet.appendRow(body.headers);
  }
  sheet.appendRow(body.row);

  return jsonResponse({ ok: true });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
